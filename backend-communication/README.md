# Backend Communication

This directory contains all communication documents between the Frontend and Backend teams.

---

## 📁 Directory Structure

```
backend-communication/
├── to-backend/       Messages TO the backend team (API requests, bug reports, requirements)
└── from-backend/     Messages FROM the backend team (responses, implementation guidance, proposals)
```

---

## 📤 to-backend/

Documents we send TO the backend team requesting changes, reporting issues, or explaining requirements.

**Current Documents:**
- `TEAM_API_REQUIREMENTS.md` - Request to fix GET /api/internal/team endpoint
- `ASSET_API_REQUIREMENTS.md` - Request to fix POST /api/internal/assets endpoint
- `DATA_MODEL_AND_RELATIONSHIPS.md` - Explanation of data model relationships (assets ↔ locations)

**When to add files here:**
- Backend API is returning errors
- We need a new endpoint created
- We need to explain frontend requirements
- We found a bug in the backend
- We need schema changes

---

## 📥 from-backend/

Documents the backend team sends TO us with responses, guidance, or proposals.

**Current Documents:**
- `FRONTEND_IMPLEMENTATION_GUIDANCE.md` - Backend's response to our REFACTOR_ANALYSIS_V2.md

**When to add files here:**
- Backend provides implementation guidance
- Backend proposes new features or changes
- Backend responds to our requests
- Backend provides API documentation

---

## 📝 Document Format

All documents should follow this format for consistency:

### Header
```markdown
# 📋 [Title]

**Date:** YYYY-MM-DD
**Priority:** HIGH/MEDIUM/LOW
**Issue/Purpose:** Brief description
```

### Sections (as applicable)
1. **The Problem/Context** - What's broken or needed
2. **Current State** - How it works now
3. **Expected State** - How it should work
4. **API Specification** - Request/response examples
5. **Implementation Guide** - Step-by-step pseudocode
6. **Testing** - How to verify it works
7. **Success Criteria** - Clear checkboxes

### Audience
Write as if communicating with another Claude Code instance:
- Extremely detailed
- No assumptions
- Include SQL queries, TypeScript examples, file paths with line numbers
- Show both correct and incorrect approaches
- Provide context for decisions

---

## 🔄 Workflow

### When Frontend needs something from Backend:

1. Create a new `.md` file in `to-backend/`
2. Use the format above
3. Be as detailed as possible
4. Include cURL test commands
5. Provide validation checklists
6. Copy to Claude Chat Project for Backend Team Lead

### When Backend responds:

1. Place their response in `from-backend/`
2. Reference the original request if applicable
3. Update any relevant frontend code based on guidance

---

## 🎯 Key Principles

1. **Be Explicit** - No implicit assumptions
2. **Show Examples** - Always include code snippets
3. **Provide Context** - Explain the "why" not just the "what"
4. **Make Testable** - Include cURL commands, validation steps
5. **Think Async** - Backend team may not see this for hours/days, make it complete

---

**Updated:** 2025-10-23
