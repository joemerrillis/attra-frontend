/**
 * Frontend Agent Channel Initialization
 *
 * This script runs in Node.js context when the Frontend agent (Claude Code) spawns.
 * It connects the agent to the multi-agent communication channels for real-time
 * collaboration with Researcher, Backend, and Seshat.
 *
 * Context: This runs in Claude Code's Node.js environment, NOT in the browser.
 */

// Load environment variables from .env
import 'dotenv/config';

import {
  initializeChannels,
  subscribe,
  publish,
  Channel,
  AgentId,
  MessageType
} from '@attra/channels';

/**
 * Handle macro research messages from Researcher
 *
 * Researcher posts high-level multi-task plans here.
 * Frontend validates UI/UX feasibility BEFORE tasks are created.
 */
async function handleMacroResearch(message) {
  console.log(`[Frontend] Macro Research: ${message.type} from ${message.from}`);

  if (message.type === MessageType.TASK_PROPOSE) {
    console.log(`[Frontend] New multi-task plan proposed:`);
    console.log(message.content);

    // TODO: Validate UI/UX feasibility
    // Example validations:
    // - Does plan conflict with existing design system?
    // - Are proposed components realistic?
    // - Will responsive design work with proposed layout?

    const concerns = await validateUIDesign(message.content);

    if (concerns.length > 0) {
      console.log(`[Frontend] UI/UX concerns found:`, concerns);
      await publish(
        Channel.RESEARCH_MACRO,
        AgentId.FRONTEND,
        MessageType.TASK_QUESTION,
        `UI/UX feedback on plan:\n${concerns.map(c => `- ${c}`).join('\n')}`,
        { threadId: message.id }
      );
    } else {
      console.log(`[Frontend] Plan looks good from UI/UX perspective`);
    }
  }
}

/**
 * Validate UI/UX design in proposed plans
 */
async function validateUIDesign(planContent) {
  const concerns = [];

  // Example validations (implement based on your design system)
  if (planContent.includes('drag-drop') && !planContent.includes('mobile')) {
    concerns.push('Drag-drop requires mobile touch event consideration');
  }

  if (planContent.includes('modal') && !planContent.includes('accessibility')) {
    concerns.push('Modal requires accessibility (focus trap, ARIA, keyboard)');
  }

  // Add more validations based on your component library

  return concerns;
}

/**
 * Handle micro research messages from Researcher
 *
 * BEFORE starting any task, Frontend performs deep component analysis
 * and posts corrections if task references wrong components/patterns.
 */
async function handleMicroQuestions(message) {
  console.log(`[Frontend] Micro Research: ${message.type} from ${message.from}`);

  if (message.type === MessageType.CLARIFICATION_REQUEST) {
    console.log(`[Frontend] Clarification requested:`);
    console.log(message.content);

    // TODO: Respond to clarification requests if they're for Frontend
    // Example: "Which button component should I use - Button or CustomButton?"
  }

  if (message.type === MessageType.TASK_VALIDATE) {
    console.log(`[Frontend] Task validation requested:`);
    console.log(message.content);

    // TODO: Validate task references correct components
    // Example: Check if "src/components/OldButton.tsx" actually exists
    // or if it was renamed to "src/components/ui/button.tsx"
  }
}

/**
 * Perform deep component research before starting a task
 *
 * Called when Frontend agent receives a new task.
 * Analyzes component tree to find issues BEFORE building starts.
 */
export async function deepComponentResearch(task) {
  const issues = [];

  console.log(`[Frontend] Deep component research for task: ${task.subject}`);

  // Example checks (implement based on your codebase)

  // Check 1: Does referenced component exist?
  if (task.body.content.includes('src/components/') || task.body.content.includes('src/pages/')) {
    // Extract file paths from task content
    const pathMatches = task.body.content.match(/src\/[a-zA-Z0-9\/\-_.]+\.(tsx?|jsx?)/g);
    if (pathMatches) {
      for (const path of pathMatches) {
        // TODO: Check if file exists using filesystem
        // If not, add to issues
        // issues.push(`File not found: ${path}`);
      }
    }
  }

  // Check 2: Does task use deprecated patterns?
  if (task.body.content.includes('class component')) {
    issues.push('Task mentions class components - we use functional components with hooks');
  }

  // Check 3: Are API endpoints correct?
  if (task.body.content.includes('api/v1/')) {
    issues.push('Task references api/v1/ but we use api/internal/ for internal endpoints');
  }

  return issues;
}

/**
 * Post progress updates during task execution
 */
export async function postProgress(taskId, message, metadata = {}) {
  await publish(
    Channel.KNOWLEDGE_RECEIPTS,
    AgentId.FRONTEND,
    MessageType.COMMIT,
    message,
    { taskId, ...metadata }
  );

  console.log(`[Frontend] Progress posted: ${message}`);
}

/**
 * Post test results
 */
export async function postTestResult(taskId, testType, passed, details = {}) {
  const messageType = passed ? MessageType.TEST_PASS : MessageType.TEST_FAIL;

  await publish(
    Channel.KNOWLEDGE_RECEIPTS,
    AgentId.FRONTEND,
    messageType,
    `${testType} ${passed ? 'passed' : 'failed'}`,
    { taskId, testType, ...details }
  );

  console.log(`[Frontend] Test result posted: ${testType} ${passed ? 'PASS' : 'FAIL'}`);
}

/**
 * Initialize Frontend agent channels
 */
export async function initFrontendAgent() {
  console.log('[Frontend] Initializing channel connections...');

  try {
    // Initialize channels (connects to Redis and Supabase)
    await initializeChannels();
    console.log('[Frontend] ✓ Channels initialized');

    // Subscribe to research channels
    await subscribe(Channel.RESEARCH_MACRO, handleMacroResearch);
    console.log('[Frontend] ✓ Subscribed to RESEARCH_MACRO');

    await subscribe(Channel.RESEARCH_MICRO, handleMicroQuestions);
    console.log('[Frontend] ✓ Subscribed to RESEARCH_MICRO');

    // Announce presence to other agents
    await publish(
      Channel.META_AGENTS,
      AgentId.FRONTEND,
      MessageType.STATUS,
      'Frontend agent online and ready',
      {
        capabilities: [
          'React component development',
          'UI/UX implementation',
          'Responsive design',
          'Accessibility',
          'Browser testing'
        ],
        stack: {
          framework: 'React 18',
          bundler: 'Vite',
          styling: 'Tailwind CSS',
          components: 'shadcn/ui',
          state: 'React Query + Context'
        }
      }
    );
    console.log('[Frontend] ✓ Announced presence on META_AGENTS');

    console.log('[Frontend] 🚀 Agent fully initialized and connected!');

    return true;
  } catch (error) {
    console.error('[Frontend] ✗ Failed to initialize channels:', error.message);
    console.error('[Frontend] Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Shutdown channels gracefully
 */
export async function shutdownFrontendAgent() {
  const { shutdownChannels } = await import('@attra/channels');
  await shutdownChannels();
  console.log('[Frontend] Agent shutdown complete');
}

// If running directly (node agent-init-channels.js), initialize and keep alive
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Frontend] Running agent initialization test...');

  initFrontendAgent()
    .then(() => {
      console.log('[Frontend] Test successful! Keeping connection alive for 30 seconds...');
      console.log('[Frontend] Check http://localhost:3100 to see the agent in the dashboard');

      // Keep process alive for testing
      setTimeout(async () => {
        console.log('[Frontend] Test complete, shutting down...');
        await shutdownFrontendAgent();
        process.exit(0);
      }, 30000);
    })
    .catch((error) => {
      console.error('[Frontend] Test failed:', error);
      process.exit(1);
    });
}
