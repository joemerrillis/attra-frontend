# Frontend Agent Channels Integration

## Overview

The Frontend agent (Claude Code instance running in Node.js) is now connected to the Attra multi-agent communication system via Redis-based channels.

This enables:
- ✅ Real-time communication with Researcher, Backend, and Seshat
- ✅ Macro research (validate UI/UX plans BEFORE task creation)
- ✅ Micro research (validate task accuracy BEFORE implementation)
- ✅ Progress publishing (commits, tests) visible in real-time dashboard
- ✅ Persistent message history in Supabase

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend Agent (Claude Code - Node.js Context)             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ agent-init-channels.js                                │   │
│  │ - Initializes Redis connections                       │   │
│  │ - Subscribes to RESEARCH_MACRO, RESEARCH_MICRO        │   │
│  │ - Publishes to KNOWLEDGE_RECEIPTS, META_AGENTS        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  @attra/channels Package               │
        │  - Redis pub/sub (real-time)          │
        │  - Redis streams (persistent)         │
        │  - Supabase (long-term storage)       │
        └───────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Researcher│    │ Backend  │    │  Seshat  │
    │  Agent   │    │  Agent   │    │  Agent   │
    └──────────┘    └──────────┘    └──────────┘
```

## Key Files

### `agent-init-channels.js`
Main initialization script for Frontend agent channel connections. Runs in Node.js context (NOT browser).

**Exports:**
- `initFrontendAgent()` - Initialize channels and subscribe to research channels
- `shutdownFrontendAgent()` - Gracefully close connections
- `deepComponentResearch(task)` - Analyze component tree for task validation
- `postProgress(taskId, message, metadata)` - Publish progress updates
- `postTestResult(taskId, testType, passed, details)` - Publish test results

**Usage:**
```javascript
import { initFrontendAgent, postProgress } from './agent-init-channels.js';

// Initialize at agent spawn
await initFrontendAgent();

// During task execution
await postProgress('task_123', 'AssetForm component modified', {
  files: ['src/components/AssetForm.tsx'],
  linesChanged: 45
});
```

### `.env`
Environment configuration with Redis and Supabase credentials.

**Required variables:**
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `SUPABASE_URL=https://ucajegvxioqolusklant.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=[secret]`

### `test-channels-simple.js`
Simple diagnostic script to test channel connectivity.

## Channel Subscriptions

### RESEARCH_MACRO
**Purpose:** High-level multi-task planning and UI/UX validation

**Frontend role:** Validate UI/UX feasibility of proposed plans BEFORE tasks are created

**Message types handled:**
- `TASK_PROPOSE` - Researcher posts multi-task plan
  - Frontend reviews for UI/UX concerns
  - Posts feedback via `TASK_QUESTION` if issues found

**Example flow:**
```
Researcher → RESEARCH_MACRO: "Plan to add drag-drop background positioning"
Frontend → Validates: "Drag-drop needs touch event handling for mobile"
Frontend → RESEARCH_MACRO: "UI/UX concern: Drag-drop requires mobile touch events"
Researcher → Adjusts plan to include mobile touch handling
```

### RESEARCH_MICRO
**Purpose:** Task-level validation and clarifications BEFORE implementation

**Frontend role:** Validate task accuracy using deep component tree knowledge

**Message types handled:**
- `CLARIFICATION_REQUEST` - Researcher asks questions
- `TASK_VALIDATE` - Validate if task references correct components

**Example flow:**
```
Researcher → RESEARCH_MICRO: "Does AssetForm component exist at src/components/AssetForm.tsx?"
Frontend → Checks filesystem
Frontend → RESEARCH_MICRO: "Yes, but it's now at src/components/ui/asset-form.tsx"
Researcher → Updates task with correct path
```

### KNOWLEDGE_RECEIPTS
**Purpose:** Real-time progress updates during task execution

**Frontend publishes:**
- `COMMIT` - Code changes made
- `TEST_PASS` - Tests passed
- `TEST_FAIL` - Tests failed
- `STATUS` - General status updates

**Example:**
```javascript
await postProgress('task_123', 'Mobile responsive testing complete', {
  testType: 'responsive',
  viewports: ['375px', '768px', '1024px'],
  passed: true
});
```

### META_AGENTS
**Purpose:** Agent lifecycle events (spawn, shutdown, heartbeat)

**Frontend announces:**
- Agent online/offline
- Capabilities
- Tech stack

## Testing the Integration

### Quick Test
```bash
cd attra-frontend
node test-channels-simple.js
```

Expected output:
```
✓ Import successful
✓ Channels initialized
✓ Test message published
🎉 SUCCESS! All channel operations working!
```

### Full Test with Handlers
```bash
cd attra-frontend
node agent-init-channels.js
```

Expected output:
```
[Frontend] Initializing channel connections...
[Frontend] ✓ Channels initialized
[Frontend] ✓ Subscribed to RESEARCH_MACRO
[Frontend] ✓ Subscribed to RESEARCH_MICRO
[Frontend] ✓ Announced presence on META_AGENTS
[Frontend] 🚀 Agent fully initialized and connected!
```

Check dashboard at http://localhost:3100 to see the Frontend agent appear.

## Integration with Task Execution

The Frontend agent should initialize channels at the start of task execution:

```javascript
// At the top of your task execution flow
import { initFrontendAgent, postProgress, shutdownFrontendAgent } from './agent-init-channels.js';

async function executeTask(task) {
  // 1. Initialize channels
  await initFrontendAgent();

  // 2. Perform System Impact Analysis
  await postProgress(task.id, 'Starting System Impact Analysis');
  const issues = await deepComponentResearch(task);

  if (issues.length > 0) {
    // Post corrections to Researcher
    await publish(
      Channel.RESEARCH_MICRO,
      AgentId.FRONTEND,
      MessageType.CLARIFICATION_REQUEST,
      `Task corrections needed: ${issues.join('; ')}`
    );
    return;
  }

  // 3. Execute task with progress updates
  await postProgress(task.id, 'Implementation started');
  // ... build the feature ...
  await postProgress(task.id, 'AssetForm component modified');

  // 4. Post test results
  await postTestResult(task.id, 'responsive', true, {
    viewports: ['375px', '768px', '1024px']
  });

  // 5. Cleanup
  await shutdownFrontendAgent();
}
```

## What This Enables

### Before Channels (Old Workflow)
```
1. Researcher writes task file
2. Frontend reads task file
3. Frontend starts building
4. Frontend discovers task is wrong (component doesn't exist)
5. Frontend writes feedback file
6. Wait for Researcher to read feedback
7. Wasted 15 minutes
```

### With Channels (New Workflow)
```
1. Researcher posts plan to RESEARCH_MACRO
2. Frontend validates immediately: "Component doesn't exist"
3. Researcher corrects plan in real-time
4. Frontend receives corrected task
5. Frontend builds correctly first time
6. Saved 15 minutes + prevented rework
```

## Benefits

1. **Fail Fast** - Catch issues BEFORE building starts
2. **Real-Time Coordination** - No more waiting for file I/O
3. **Progress Visibility** - Researcher sees commits/tests in real-time dashboard
4. **Learning Loop** - Seshat learns from every execution (success AND failure)
5. **Persistent Audit Trail** - All messages stored in Supabase for analysis

## Troubleshooting

### Redis Connection Failed
```
Error: Failed to connect to Redis
```

**Solution:** Ensure Redis is running on localhost:6379
```bash
# Check if Redis is running (Windows: check Services)
# Or start Redis server
```

### Environment Variables Not Found
```
REDIS_HOST: undefined
```

**Solution:** Ensure `.env` file exists with correct variables
```bash
# Check .env file
cat .env

# Should show:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# ...
```

### Import Error
```
Error: Cannot find module '@attra/channels'
```

**Solution:** Install the package
```bash
pnpm install
# or
pnpm add file:../packages/channels
```

## Next Steps

- [ ] Integrate `initFrontendAgent()` into task-watcher.js spawn flow
- [ ] Implement deep component research validations
- [ ] Add macro research UI/UX validation logic
- [ ] Create skill that uses channels for progress publishing
- [ ] Set up integration tests for channel communication

## References

- **Channels Package:** `../packages/channels`
- **Dashboard:** http://localhost:3100
- **Onboarding Doc:** `C:\Users\Joseph Merrill\attra\researcher\onboarding\FOR_FRONTEND_CLAUDE.md`
- **Task Execution Skill:** `skills/task-execution.md`
