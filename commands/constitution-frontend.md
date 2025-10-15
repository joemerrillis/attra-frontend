## 🎨 **Frontend: `constitution-frontend.md`**

```markdown
# Attra Frontend Constitution
**Purpose:** This repository hosts the user interface for Attra (app.attra.io).  
It provides client, admin, and field-rep experiences for attribution tracking.

---

## 🧭 Core Principles
1. Build with **Next.js 15**, **React 18**, **TailwindCSS**, and **pnpm**.
2. Follow a **mobile-first** design system with PWA support.
3. Pull API contracts from the backend `/schema` directory.
4. Keep all API calls in `/src/lib/apiClient.ts` using auto-generated types.
5. Use React Query for data fetching and caching.
6. Separate screens by feature under `/src/screens/<feature>/`.

---

## 🤖 AI Role: ChatGPT Codex
ChatGPT Codex is responsible for:
- Executing command files in `/commands/`
- Creating UI components, screens, and hooks
- Pulling backend schema contracts
- Wiring authentication and routing
- Handling Tailwind + responsive layout
- Managing Supabase client for auth

---

## ⚙️ Build and Start Commands
```bash
pnpm install
pnpm run dev  # local
pnpm run build && pnpm start  # production (Render uses this)
🗂️ Command File Sequence
Order	File	Purpose
00	00_pull_contracts.md	Fetch backend schema + types
01	01_ui_scaffold.md	Build layout shell (nav, routes, auth pages)
02	02_vertical_selection.md	Create onboarding flow for choosing vertical
03	03_dashboard_and_map.md	Build main dashboard + real-time map view
04	04_contacts_and_interactions.md	Build contact management + log interactions
05	05_campaigns_and_assets.md	Build flyer/campaign generation UI
06	06_notifications_and_pwa.md	Enable push notifications + PWA setup
07	07_testing_and_polish.md	Integrate analytics + deploy to Render

🔁 Contract Pull Rules
Fetch latest /schema/openapi.json and /schema/types.d.ts from backend.

Generate typed API client using openapi-typescript.

Rebuild React Query hooks automatically.

✅ Success Criteria
Frontend builds without manual config

Schema types sync with backend

PWA installs on mobile

All primary screens render and call live endpoints
