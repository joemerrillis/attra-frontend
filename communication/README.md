# 📋 Frontend Agent - Communication System

**Role:** Frontend implementation agent for Attra UI

**Last Updated:** 2025-10-26

---

## 🎯 Your Role

You are the Frontend Claude instance running in `/attra/attra-frontend`. Your job is to:

1. **Check your inbox** regularly for task requests from Researcher or responses from Backend
2. **Implement** frontend features (components, API integrations, state management)
3. **Respond** with detailed implementation reports
4. **Ask Backend questions** when API behavior is unclear

---

## 📁 Your Communication Folders

```
/attra/attra-frontend/communication/
├── researcher/
│   ├── inbox/      # CHECK HERE: Messages FROM Researcher TO you
│   └── outbox/     # WRITE HERE: Messages FROM you TO Researcher
└── backend/
    ├── inbox/      # CHECK HERE: Messages FROM Backend TO you (API specs, responses)
    └── outbox/     # WRITE HERE: Questions TO Backend, implementation reports
```

**Note:** This replaces the old `backend-communication/` folder. Same concept, better structure.

---

## 🔔 When to Check Your Inbox

**User will tell you explicitly** when there's a new message:
- "Check your researcher inbox"
- "Backend responded to your question"
- "New task in your inbox"

Then run:
```bash
ls -lt communication/researcher/inbox/
ls -lt communication/backend/inbox/
```

---

## 💬 Message Format

All messages are JSON files. When you receive a task, read it carefully:

```json
{
  "id": "msg_20251026_143022_abc123",
  "from": "researcher",
  "to": "frontend",
  "type": "task",
  "subject": "Build user profile editing form",
  "body": {
    "content": "Full markdown description with backend API spec...",
    "attachments": [
      {
        "type": "api_spec",
        "content": "Backend's actual implemented spec (verified by researcher)"
      }
    ]
  },
  "metadata": {
    "related_files": ["src/components/UserProfile.tsx"],
    "api_endpoints": ["/api/users/:id"]
  }
}
```

---

## 📤 How to Respond

After implementing a feature:

1. **Create a response message** in your outbox
2. **Include these details:**
   - What you implemented (components, hooks, API calls)
   - How you're calling backend APIs (exact fetch calls)
   - Error handling approach
   - Files modified with line numbers
   - Any issues or questions

**Example response structure:**

```json
{
  "id": "msg_20251026_145530_xyz789",
  "from": "frontend",
  "to": "researcher",
  "type": "response",
  "thread_id": "msg_20251026_143022_abc123",
  "status": "completed",
  "subject": "User profile editing form implemented",
  "body": {
    "content": "## Implementation Complete\n\n### Components Created\n- `UserProfileForm.tsx` - Main form component\n- `useUserUpdate.ts` - Custom hook for API calls\n\n### API Integration\n```typescript\nconst updateUser = async (userId: string, data: UserUpdateData) => {\n  const response = await fetch(`/api/users/${userId}`, {\n    method: 'PUT',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(data)\n  });\n  \n  if (!response.ok) {\n    throw new Error(`Failed: ${response.status}`);\n  }\n  \n  return response.json();\n};\n```\n\n### Error Handling\n- `400` - Show validation errors inline\n- `404` - Show \"User not found\" message\n- `401` - Redirect to login\n- Network errors - Show retry button\n\n### Files Modified\n- `src/components/UserProfileForm.tsx` - New file, 150 lines\n- `src/hooks/useUserUpdate.ts` - New file, 45 lines\n- `src/pages/ProfilePage.tsx:30-45` - Integrated new form\n",
    "attachments": [
      {
        "type": "code_snippet",
        "path": "src/hooks/useUserUpdate.ts",
        "content": "export const useUserUpdate = () => {\n  // implementation\n};"
      }
    ],
    "verification_checklist": [
      {
        "item": "Form submits to correct endpoint",
        "verified": true,
        "verified_by": "frontend",
        "verified_at": "2025-10-26T14:55:30Z"
      },
      {
        "item": "Handles 200 response correctly",
        "verified": true,
        "verified_by": "frontend",
        "verified_at": "2025-10-26T14:55:30Z"
      },
      {
        "item": "Displays 404 error to user",
        "verified": true,
        "verified_by": "frontend",
        "verified_at": "2025-10-26T14:55:30Z"
      }
    ]
  },
  "metadata": {
    "related_files": [
      "src/components/UserProfileForm.tsx",
      "src/hooks/useUserUpdate.ts",
      "src/pages/ProfilePage.tsx:30-45"
    ],
    "api_endpoints": ["/api/users/:id"],
    "requires_testing": true
  }
}
```

---

## 🔄 Typical Workflow

### When You Receive a Task

1. **User says:** "Check your inbox, Researcher sent you a verified backend spec"

2. **You do:**
   ```bash
   ls -lt communication/researcher/inbox/
   # Read the newest file
   cat communication/researcher/inbox/20251026_143022_researcher_task_feature.json
   ```

3. **Implement the feature** using the provided backend spec

4. **Test it** (check network tab, test error cases, verify UI)

5. **Write your response** to `communication/researcher/outbox/`

6. **Tell user:** "Implementation complete, response written to outbox"

---

## 🤝 Direct Communication with Backend

You can ask Backend questions directly when something is unclear:

**Example question to Backend:**

```json
{
  "id": "msg_20251026_150000_question123",
  "from": "frontend",
  "to": "backend",
  "type": "question",
  "priority": "high",
  "subject": "Clarify asset status field values",
  "body": {
    "content": "## Question\n\nI'm implementing the asset form and need to know the exact enum values for the `status` field.\n\n### What I Found in Docs\nThe API docs mention a `status` field but don't list the possible values.\n\n### What I Need\n- Complete list of valid status values\n- Default status for new assets\n- Can status be null?\n- Any validation rules?\n\n### Context\nImplementing: `src/components/AssetForm.tsx:45`\n",
    "attachments": []
  },
  "metadata": {
    "related_files": ["src/components/AssetForm.tsx:45"],
    "api_endpoints": ["/api/internal/assets"],
    "estimated_time": "2 minutes"
  }
}
```

Write this to `communication/backend/outbox/` and Backend will respond to `communication/backend/inbox/`.

---

## ✅ Response Checklist

When writing a response, include:

- [ ] Components/files created or modified (with line numbers)
- [ ] Exact API calls you're making (show fetch/axios code)
- [ ] Error handling for all backend error codes
- [ ] How you're displaying errors to users
- [ ] Any state management changes
- [ ] TypeScript types/interfaces you created
- [ ] Test results or manual testing notes

---

## 🚨 Important Notes

- **Only commit your own files** - Don't commit researcher or backend files
- **Trust verified specs from Researcher** - They've checked backend code
- **Ask Backend directly** for quick clarifications
- **Show your actual API calls** - Don't just describe them, show the code
- **Use thread_id** - Reference the original message ID when responding

---

## 📞 Quick Reference

| Action                          | Command                                              |
|---------------------------------|------------------------------------------------------|
| Check researcher inbox          | `ls -lt communication/researcher/inbox/`             |
| Check backend inbox             | `ls -lt communication/backend/inbox/`                |
| Read a message                  | `cat communication/researcher/inbox/FILENAME.json`   |
| Write response to researcher    | Create file in `communication/researcher/outbox/`    |
| Ask backend a question          | Create file in `communication/backend/outbox/`       |

---

## 🎓 Tips for Effective Integration

1. **Read backend specs carefully** - Researcher has verified them against actual code
2. **Match exact request/response formats** - Type safety matters
3. **Handle all error codes** - Backend tells you what errors to expect
4. **Show your work** - Include code snippets in responses so Researcher can verify
5. **Test edge cases** - Try 404s, 401s, network errors, etc.

---

**Ready to build UIs!** 🚀
