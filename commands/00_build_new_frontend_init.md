# 00_build_new_frontend_init.md

## 🎯 Goal

Initialize the Attra frontend repository using **Vite + React Router + TypeScript + Shadcn/ui + Tailwind CSS**. Pull backend schema contracts, generate typed API clients, and set up the folder structure for files 01-10.

---

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Backend API running at `api.attra.io` (or `localhost:8080` for dev)
- Supabase project created with credentials

---

## 🗂️ Files Created

```
attra-frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn components (auto-generated)
│   │   ├── layout/                # MobileBottomNav, MobileHeader (file 10)
│   │   ├── campaigns/             # Campaign components (file 04)
│   │   ├── contacts/              # Contact components (file 06)
│   │   ├── analytics/             # Analytics components (file 07)
│   │   ├── feature-gating/        # Feature gating (file 08)
│   │   ├── onboarding/            # Onboarding wizard (file 03)
│   │   ├── auth/                  # Auth components (file 02)
│   │   └── theme/                 # Dark mode toggle (file 10)
│   ├── pages/
│   │   ├── Signup.tsx             # File 02
│   │   ├── Login.tsx              # File 02
│   │   ├── Onboarding.tsx         # File 03
│   │   ├── Dashboard.tsx          # File 04+
│   │   ├── Analytics.tsx          # File 07
│   │   ├── Contacts.tsx           # File 06
│   │   ├── Settings.tsx           # File 09
│   │   ├── campaigns/
│   │   │   ├── New.tsx            # File 04
│   │   │   └── [id].tsx           # File 04
│   │   ├── locations/             # File 03
│   │   └── auth/
│   │       └── Callback.tsx       # File 02
│   ├── hooks/
│   │   ├── useAuth.ts             # File 02
│   │   ├── useTenant.ts           # File 02
│   │   ├── usePWA.ts              # File 10
│   │   ├── useOffline.ts          # File 10
│   │   ├── useDarkMode.ts         # File 10
│   │   ├── useMobileDetection.ts  # File 10
│   │   ├── useFeatureGate.ts      # File 08
│   │   └── usePlanLimit.ts        # File 08
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client
│   │   ├── api-client.ts          # Base API client
│   │   ├── campaign-api.ts        # File 04
│   │   ├── contacts-api.ts        # File 06
│   │   ├── analytics-api.ts       # File 07
│   │   ├── plans-api.ts           # File 08
│   │   ├── google-places.ts       # File 03
│   │   ├── offline-sync.ts        # File 10
│   │   ├── utils.ts               # cn() helper
│   │   └── contracts/
│   │       ├── openapi.json       # Pulled from backend
│   │       └── manifest.json      # Pulled from backend
│   ├── contexts/
│   │   └── AuthContext.tsx        # File 02
│   ├── types/
│   │   ├── api.d.ts               # Generated from OpenAPI
│   │   ├── backend.d.ts           # Pulled from backend
│   │   └── billing.ts             # File 08
│   └── styles/
│       ├── index.css              # Global styles
│       └── mobile.css             # File 10
├── public/
│   ├── icons/                     # PWA icons (file 10)
│   ├── manifest.json              # PWA manifest (file 10)
│   └── robots.txt
├── scripts/
│   └── pull-contracts.sh          # Script to fetch backend contracts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── components.json                # Shadcn config
```

---

## ⚙️ Step 1: Initialize Vite Project

```bash
# Create project
pnpm create vite attra-frontend --template react-ts
cd attra-frontend

# Install dependencies
pnpm install
```

---

## ⚙️ Step 2: Install Core Dependencies

```bash
# Routing
pnpm add react-router-dom

# State Management
pnpm add @tanstack/react-query

# Supabase
pnpm add @supabase/supabase-js

# Forms
pnpm add react-hook-form zod @hookform/resolvers

# UI Utilities
pnpm add class-variance-authority clsx tailwind-merge

# Icons
pnpm add lucide-react

# Date handling
pnpm add date-fns

# QR codes
pnpm add qrcode.react

# PWA (prep for file 10)
pnpm add @vite-pwa/vite-plugin workbox-window

# IndexedDB (offline support, file 10)
pnpm add idb

# Dev dependencies
pnpm add -D @types/node
```

---

## ⚙️ Step 3: Setup Tailwind CSS

```bash
# Install Tailwind
pnpm add -D tailwindcss postcss autoprefixer

# Initialize config
npx tailwindcss init -p
```

**File:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## ⚙️ Step 4: Initialize Shadcn/ui

```bash
# Initialize Shadcn
npx shadcn-ui@latest init
```

**Select these options:**
- Would you like to use TypeScript? **Yes**
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate**
- Where is your global CSS file? **src/styles/index.css**
- Would you like to use CSS variables for colors? **Yes**
- Where is your tailwind.config.js located? **tailwind.config.js**
- Configure the import alias for components? **@/components**
- Configure the import alias for utils? **@/lib/utils**
- Are you using React Server Components? **No**

**Install core Shadcn components:**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add radio-group
```

---

## ⚙️ Step 5: Configure Vite

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});
```

---

## ⚙️ Step 6: Create Folder Structure

```bash
# Create directories
mkdir -p src/components/{ui,layout,campaigns,contacts,analytics,feature-gating,onboarding,auth,theme}
mkdir -p src/pages/{campaigns,locations,auth}
mkdir -p src/hooks
mkdir -p src/lib/contracts
mkdir -p src/contexts
mkdir -p src/types
mkdir -p src/styles
mkdir -p public/icons
mkdir -p scripts
```

---

## ⚙️ Step 7: Setup Environment Variables

**File:** `.env.example`

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API
VITE_API_URL=https://api.attra.io

# Google Maps (for address autocomplete in file 03)
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Environment
VITE_ENV=development
```

**File:** `.env`

```bash
# Copy from .env.example and fill in real values
# DO NOT COMMIT THIS FILE
```

**Update `.gitignore`:**

```
# Environment
.env
.env.local
.env.production

# Build
dist
build

# Dependencies
node_modules

# Misc
.DS_Store
*.log
```

---

## ⚙️ Step 8: Pull Backend Contracts

**File:** `scripts/pull-contracts.sh`

```bash
#!/bin/bash

# Pull backend schema contracts
echo "📡 Pulling backend contracts..."

API_URL=${VITE_API_URL:-"http://localhost:8080"}

mkdir -p src/lib/contracts
mkdir -p src/types

# Pull OpenAPI schema
curl -s "$API_URL/schema/openapi.json" -o src/lib/contracts/openapi.json
echo "✅ OpenAPI schema pulled"

# Pull TypeScript types
curl -s "$API_URL/schema/types.d.ts" -o src/types/backend.d.ts
echo "✅ TypeScript types pulled"

# Pull manifest
curl -s "$API_URL/schema/manifest.json" -o src/lib/contracts/manifest.json
echo "✅ Manifest pulled"

# Generate typed API client
echo "🔧 Generating typed API client..."
pnpm dlx openapi-typescript src/lib/contracts/openapi.json -o src/types/api.d.ts
echo "✅ API client types generated"

echo "🎉 Contracts synced successfully!"
```

**Make executable:**

```bash
chmod +x scripts/pull-contracts.sh
```

**Run it:**

```bash
./scripts/pull-contracts.sh
```

---

## ⚙️ Step 9: Create Supabase Client

**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/backend';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Type exports for convenience
export type { Database };
export type User = Database['public']['Tables']['users']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
```

---

## ⚙️ Step 10: Create Base API Client

**File:** `src/lib/api-client.ts`

```typescript
import type { paths } from '@/types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Fetch with authentication
 */
export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Get token from localStorage (set by Supabase)
  const token = localStorage.getItem('supabase.auth.token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Type-safe API paths
 */
export type ApiPaths = paths;
```

---

## ⚙️ Step 11: Setup Global Styles

**File:** `src/styles/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Mobile-specific styles (for file 10) */
@media (max-width: 768px) {
  body {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

## ⚙️ Step 12: Create React Query Provider

**File:** `src/lib/react-query.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## ⚙️ Step 13: Setup Main App Entry

**File:** `src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**File:** `src/App.tsx`

```typescript
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Toaster } from '@/components/ui/toaster';

// Placeholder - routes will be added in files 02-10
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <h1 className="text-4xl font-bold text-center p-8">
            ●<span className="text-primary">&gt;</span>attra<span className="text-primary">&gt;</span>●
          </h1>
          <p className="text-center text-muted-foreground">
            Frontend initialized. Ready for file 02 (Auth).
          </p>
        </div>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## ⚙️ Step 14: Update Package.json Scripts

**File:** `package.json`

```json
{
  "name": "attra-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "pull-contracts": "./scripts/pull-contracts.sh",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

---

## ⚙️ Step 15: Create TypeScript Config

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## ✅ Step 16: Verify Setup

Run these checks:

```bash
# 1. Start dev server
pnpm dev
# Should open on http://localhost:5173

# 2. Pull contracts (backend must be running)
pnpm run pull-contracts
# Should create src/types/api.d.ts and src/types/backend.d.ts

# 3. Check TypeScript compilation
pnpm build
# Should compile without errors

# 4. Verify files exist
ls -la src/types/api.d.ts
ls -la src/types/backend.d.ts
ls -la src/lib/contracts/openapi.json
```

---

## 📊 Acceptance Criteria

- [ ] Vite dev server runs at `http://localhost:5173`
- [ ] Tailwind CSS styles load correctly
- [ ] Shadcn/ui components installed and accessible
- [ ] Backend contracts pulled successfully (`api.d.ts`, `backend.d.ts`)
- [ ] TypeScript compiles without errors
- [ ] React Query provider configured
- [ ] Supabase client initialized
- [ ] Environment variables documented
- [ ] Folder structure matches files 01-10
- [ ] `pnpm build` succeeds
- [ ] Git repository initialized with proper `.gitignore`

---

## 🚀 Next Steps

After completing this file:

1. **File 01:** Build marketing site at `attra.io`
2. **File 02:** Setup authentication with Supabase
3. **File 03:** Create onboarding wizard
4. **Files 04-10:** Core features

---

## 📚 Reference Commands

```bash
# Pull latest contracts
pnpm run pull-contracts

# Add a new Shadcn component
npx shadcn-ui@latest add [component-name]

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## 🛠️ Troubleshooting

### Backend contracts fail to pull

```bash
# Check if backend is running
curl http://localhost:8080/health

# Manually fetch OpenAPI spec
curl http://localhost:8080/schema/openapi.json | jq
```

### TypeScript errors after pulling contracts

```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
pnpm build
```

### Supabase client errors

```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check .env file exists
cat .env
```

---

**End of File 00 - Ready for Claude Code Execution** 🚀
