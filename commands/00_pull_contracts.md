## 🎨 `app.attra.io/commands/00_pull_contracts.md`
```markdown
# 00_pull_contracts.md
**Goal:** Initialize Attra frontend repository and prepare to consume backend schema contracts.

---

## 🪜 Step 1: Initialize Project
- Run:
  ```bash
  pnpm create next-app@latest . --typescript --tailwind --eslint --app
After setup:

bash
Copy code
pnpm add @tanstack/react-query supabase-js openapi-typescript
🧩 Step 2: Setup Folder Structure
Create directories:

bash
Copy code
/src
  /screens
  /components
  /lib
  /hooks
/commands
Add .gitignore with:

bash
Copy code
node_modules
.env
.next
out
Create src/lib/apiClient.ts (placeholder for now).

🔁 Step 3: Pull Backend Contracts
Fetch schema files from backend:

bash
Copy code
curl https://api.attra.io/schema/openapi.json -o src/lib/openapi.json
curl https://api.attra.io/schema/types.d.ts -o src/types/backend.d.ts
Generate typed client:

bash
Copy code
pnpm dlx openapi-typescript src/lib/openapi.json -o src/lib/api.d.ts
Import types into src/lib/apiClient.ts:

ts
Copy code
import type { paths } from './api';
export type ApiPaths = paths;
⚙️ Step 4: Configure React Query Provider
In src/app/providers.tsx:

tsx
Copy code
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();
export default function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
Then wrap the root layout:

tsx
Copy code
import Providers from './providers';
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
🔐 Step 5: Add .env.example
bash
Copy code
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace_with_your_anon_key
✅ Step 6: Verify
Run:

bash
Copy code
pnpm run dev
Visit http://localhost:3000 → should display Next.js starter

Verify schema files exist in /src/lib and /src/types

Checkpoint: Frontend scaffolded and ready for first sync with backend schema.
