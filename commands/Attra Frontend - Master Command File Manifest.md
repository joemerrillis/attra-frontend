# Attra Frontend - Master Command File Manifest

**Version:** 2.0  
**Last Updated:** October 18, 2025  
**Architecture:** Domain-Driven, Consolidated Features  
**Status:** Production-Ready

---

## 🎯 Project Overview

**Goal:** Build complete MVP frontend for Attra attribution platform  
**Timeline:** ~1 week (54 hours) with Claude Code execution  
**Tech Stack:** Vite + React Router + Shadcn/ui + Tailwind + TypeScript  
**Backend:** Fastify API at `api.attra.io` (must be running)

---

## 📁 Command File Structure

```
/claude/commands/frontend/
├── 00_build_new_frontend_init.md              (Init: 2 hrs)
├── 01_build_marketing_site_layout.md          (Foundation: 3 hrs)
├── 02_build_auth_and_tenant_setup.md          (Foundation: 4 hrs)
├── 03_build_onboarding_wizard.md              (Foundation: 5 hrs)
├── 04_build_new_campaign_creation_system.md   (Core: 8 hrs)
├── 05_build_new_analytics_dashboard.md        (Core: 8 hrs)
├── 06_build_new_contacts_crm_system.md        (Core: 8 hrs)
├── 08_build_new_feature_gating_system.md      (Growth: 6 hrs)
├── 09_build_new_settings_pages.md             (Growth: 6 hrs)
└── 10_build_new_pwa_mobile.md                 (Polish: 4 hrs)

Total: 10 files, ~54 hours
```

---

## 🗺️ Build Phases

### **Phase 0: Initialization (2 hours)**

#### 00_build_new_frontend_init.md
**Purpose:** Initialize Vite project, install dependencies, pull backend contracts  
**Dependencies:** Backend API must be running at `api.attra.io` (or `localhost:8080`)  
**Builds:**
- Vite + React + TypeScript project
- Tailwind CSS + PostCSS configuration
- Shadcn/ui component library setup
- React Query provider
- Supabase client initialization
- Pull backend contracts from `/schema/*`
- Generate typed API client from OpenAPI spec

**Key Deliverables:**
- `src/types/api.d.ts` - Generated API types
- `src/types/backend.d.ts` - Supabase database types
- `src/lib/api-client.ts` - Typed fetch wrapper
- `src/lib/supabase.ts` - Supabase client
- `src/lib/react-query.ts` - React Query config
- Complete folder structure matching files 01-10

**Acceptance Criteria:**
- [ ] `pnpm dev` starts dev server on port 5173
- [ ] Backend contracts pulled successfully
- [ ] TypeScript compiles without errors
- [ ] Shadcn/ui components accessible
- [ ] React Query provider configured

**Estimated Time:** 2 hours

---

### **Phase 1: Foundation (12 hours)**

#### 01_build_marketing_site_layout.md
**Purpose:** Landing page at `attra.io`  
**Dependencies:** 00_build_new_frontend_init.md  
**Builds:**
- Hero section with ●>attra>● logo
- "Measure the Real World" headline
- Animated map background (placeholder or real Mapbox)
- How It Works section (●> Create → Distribute → Track >●)
- Industry grid (Real Estate, Pet Services, etc.)
- Testimonials section
- Final CTA section
- Footer with links

**Key Deliverables:**
- `marketing/pages/index.tsx`
- `marketing/components/Hero.tsx`
- `marketing/components/AnimatedMap.tsx`
- `marketing/components/HowItWorks.tsx`
- `marketing/components/Footer.tsx`

**Acceptance Criteria:**
- [ ] Landing page loads at `attra.io`
- [ ] "Start Free" button links to `app.attra.io/signup`
- [ ] Mobile responsive
- [ ] Lighthouse score 95+
- [ ] All sections render correctly

**Estimated Time:** 3 hours  
**Can Run in Parallel:** Yes (independent of other frontend features)

---

#### 02_build_auth_and_tenant_setup.md
**Purpose:** Supabase Auth with Google OAuth + tenant creation  
**Dependencies:** 00_build_new_frontend_init.md  
**Builds:**
- Google OAuth sign-in flow
- Signup page at `/signup`
- Login page at `/login`
- Auth callback handler at `/auth/callback`
- Auth context provider
- Protected route wrapper
- Automatic user profile creation
- Redirect to onboarding if no tenant

**Key Deliverables:**
- `src/pages/Signup.tsx`
- `src/pages/Login.tsx`
- `src/pages/auth/Callback.tsx`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/components/auth/GoogleButton.tsx`
- `src/components/auth/ProtectedRoute.tsx`

**Acceptance Criteria:**
- [ ] "Continue with Google" button works
- [ ] OAuth flow completes successfully
- [ ] User profile created in `users` table
- [ ] New users redirected to `/onboarding`
- [ ] Existing users redirected to `/dashboard`
- [ ] Auth state persists across page refresh
- [ ] Sign out functionality works

**Estimated Time:** 4 hours

---

#### 03_build_onboarding_wizard.md
**Purpose:** 4-step onboarding wizard for new tenants  
**Dependencies:** 02_build_auth_and_tenant_setup.md  
**Builds:**
- **Step 1:** Choose vertical (dropdown with icons)
- **Step 2:** Business name + logo upload + primary color picker
- **Step 3:** First location (Google Places autocomplete)
- **Step 4:** Choose campaign goal
- Progress indicator (1/4, 2/4, etc.)
- Back/Next navigation
- Creates tenant + location + vertical on completion
- Stores campaign goal in localStorage for file 04

**Key Deliverables:**
- `src/pages/Onboarding.tsx`
- `src/components/onboarding/WizardLayout.tsx`
- `src/components/onboarding/StepIndicator.tsx`
- `src/components/onboarding/VerticalSelector.tsx`
- `src/components/onboarding/BrandingForm.tsx`
- `src/components/onboarding/LocationForm.tsx`
- `src/components/onboarding/CampaignGoalSelector.tsx`
- `src/hooks/useOnboarding.ts`
- `src/lib/google-places.ts`

**Acceptance Criteria:**
- [ ] All 4 steps render correctly
- [ ] Progress bar updates with each step
- [ ] Google Places autocomplete works
- [ ] Logo uploads to Supabase Storage
- [ ] Color picker functional
- [ ] Tenant + location + vertical created on completion
- [ ] Redirects to `/campaigns/new`
- [ ] Campaign goal stored in localStorage

**Estimated Time:** 5 hours

---

### **Phase 2: Core Features (24 hours)**

#### 04_build_new_campaign_creation_system.md
**Purpose:** Complete campaign creation workflow (end-to-end)  
**Dependencies:** 03_build_onboarding_wizard.md  
**Builds:**
- Campaign wizard (multi-step form)
- Campaign goal selection
- AI headline/subheadline generation (OpenAI/Anthropic)
- Location selection (multi-select)
- Flyer layout choice (Classic/Modern/Minimal)
- QR code generation + short link creation
- PDF flyer generation (backend worker)
- PDF preview component
- Scan landing page system (`/s/:code`)
- Scan tracking (anonymous + authenticated)
- Campaign status tracking (draft/active/completed)

**Key Deliverables:**
- `src/pages/campaigns/New.tsx`
- `src/pages/campaigns/[id].tsx`
- `src/pages/ScanLanding.tsx`
- `src/components/campaigns/CampaignWizard.tsx`
- `src/components/campaigns/GoalSelector.tsx`
- `src/components/campaigns/AICopyGenerator.tsx`
- `src/components/campaigns/LocationSelector.tsx`
- `src/components/campaigns/LayoutSelector.tsx`
- `src/components/campaigns/PDFPreview.tsx`
- `src/components/scan/BrandedForm.tsx`
- `src/lib/campaign-api.ts`
- `src/lib/ai-api.ts`
- `src/lib/pdf-api.ts`

**Acceptance Criteria:**
- [ ] Campaign wizard completes all steps
- [ ] AI generates headline/subheadline
- [ ] QR code + short link created
- [ ] PDF generation job enqueued
- [ ] PDF downloads successfully
- [ ] Scan landing page renders with branding
- [ ] Form submission creates contact
- [ ] Scan tracking records location/device
- [ ] Campaign status updates correctly

**Estimated Time:** 8 hours

---

#### 05_build_new_analytics_dashboard.md
**Purpose:** Analytics + realtime map + campaign list view  
**Dependencies:** 04_build_new_campaign_creation_system.md  
**Builds:**
- Realtime map dashboard (Mapbox/Leaflet)
- Pin per location with scan count
- Pulse animation on new scan (Supabase Realtime)
- Filter by campaign/date
- Recent scans feed
- Scans over time (line chart)
- Top locations (bar chart)
- Conversion funnel (scans → contacts)
- Campaign list view (table)
- Export to CSV

**Key Deliverables:**
- `src/pages/Dashboard.tsx`
- `src/pages/Analytics.tsx`
- `src/pages/Campaigns.tsx`
- `src/components/dashboard/MapView.tsx`
- `src/components/dashboard/RecentScans.tsx`
- `src/components/analytics/LineChart.tsx`
- `src/components/analytics/BarChart.tsx`
- `src/components/analytics/ConversionFunnel.tsx`
- `src/components/campaigns/CampaignTable.tsx`
- `src/hooks/useRealtimeScans.ts`
- `src/lib/analytics-api.ts`

**Acceptance Criteria:**
- [ ] Map loads with location pins
- [ ] Pins show scan count
- [ ] New scans pulse on map in realtime
- [ ] Charts render with correct data
- [ ] Campaign table shows all campaigns
- [ ] Filters work (campaign/date)
- [ ] Export CSV downloads successfully
- [ ] Realtime subscriptions work
- [ ] Responsive on mobile

**Estimated Time:** 8 hours  
**Can Run in Parallel:** Yes (with file 06, after file 04 complete)

---

#### 06_build_new_contacts_crm_system.md
**Purpose:** Contact management + interaction tracking  
**Dependencies:** 04_build_new_campaign_creation_system.md  
**Builds:**
- Contact table view (paginated)
- Contact detail page
- Add/edit/delete contacts
- Source tracking (QR scan vs manual)
- Filter by campaign/location/date
- Data masking for free tier (email/phone hidden)
- Interaction timeline per contact
- Log interaction form (call/email/meeting/note)
- Quick actions (send email, set reminder)
- Contact tags/labels

**Key Deliverables:**
- `src/pages/Contacts.tsx`
- `src/pages/contacts/[id].tsx`
- `src/components/contacts/ContactTable.tsx`
- `src/components/contacts/ContactForm.tsx`
- `src/components/contacts/ContactDetail.tsx`
- `src/components/contacts/InteractionTimeline.tsx`
- `src/components/contacts/LogInteractionForm.tsx`
- `src/components/contacts/ContactFilters.tsx`
- `src/lib/contacts-api.ts`

**Acceptance Criteria:**
- [ ] Contact table loads with pagination
- [ ] Add/edit/delete contacts works
- [ ] Contact detail page shows full history
- [ ] Interaction timeline renders chronologically
- [ ] Log interaction form submits successfully
- [ ] Filters work (campaign/location/date)
- [ ] Data masking works in free tier
- [ ] Quick actions functional
- [ ] Tags can be added/removed

**Estimated Time:** 8 hours  
**Can Run in Parallel:** Yes (with file 05, after file 04 complete)

---

### **Phase 3: Growth & Polish (16 hours)**

#### 08_build_new_feature_gating_system.md
**Purpose:** Plan-based feature access + upgrade prompts  
**Dependencies:** 05_build_new_analytics_dashboard.md, 06_build_new_contacts_crm_system.md  
**Builds:**
- `useFeatureGate()` hook (checks plan access)
- `usePlanLimit()` hook (checks usage limits)
- `<LockedFeature>` component (blur + lock icon)
- `<UpgradePrompt>` component (call-to-action)
- `<PlanUsageWidget>` component (progress bar)
- Data masking utilities (email/phone redaction)
- Plan definitions (Free/Starter/Pro/Enterprise)
- Feature gates per plan
- Usage tracking (scans/contacts/campaigns)
- Soft block (show upgrade prompt, don't prevent action)

**Key Deliverables:**
- `src/hooks/useFeatureGate.ts`
- `src/hooks/usePlanLimit.ts`
- `src/components/feature-gating/LockedFeature.tsx`
- `src/components/feature-gating/UpgradePrompt.tsx`
- `src/components/feature-gating/PlanUsageWidget.tsx`
- `src/lib/data-masking.ts`
- `src/lib/plan-utils.ts`
- `src/lib/plans-api.ts`
- `src/types/billing.ts`

**Acceptance Criteria:**
- [ ] Free users see locked features with blur
- [ ] Upgrade prompts appear correctly
- [ ] Plan limits enforced (but soft blocks)
- [ ] Usage widget shows progress
- [ ] Data masking works (email/phone hidden)
- [ ] Feature gates check plan correctly
- [ ] Plan upgrade flow initiated

**Estimated Time:** 6 hours

---

#### 09_build_new_settings_pages.md
**Purpose:** Tenant settings + integrations + billing  
**Dependencies:** 08_build_new_feature_gating_system.md  
**Builds:**
- **Profile Tab:** Name, email, avatar upload
- **Branding Tab:** Logo, primary color, font
- **Integrations Tab:** Gmail OAuth, API keys
- **Billing Tab:** Stripe portal iframe, plan display
- **Team Tab:** Invite members, manage roles (future)
- Settings layout with tab navigation
- Gmail connection flow
- API key generation
- Stripe Customer Portal link

**Key Deliverables:**
- `src/pages/Settings.tsx`
- `src/components/settings/SettingsLayout.tsx`
- `src/components/settings/ProfileTab.tsx`
- `src/components/settings/BrandingTab.tsx`
- `src/components/settings/IntegrationsTab.tsx`
- `src/components/settings/BillingTab.tsx`
- `src/components/settings/TeamTab.tsx` (future)
- `src/lib/gmail-api.ts`
- `src/lib/billing-api.ts`

**Acceptance Criteria:**
- [ ] Settings page loads with tabs
- [ ] Profile updates save successfully
- [ ] Logo uploads to storage
- [ ] Color picker updates branding
- [ ] Gmail OAuth flow completes
- [ ] API keys can be generated/revoked
- [ ] Stripe portal loads in iframe
- [ ] Current plan displayed correctly

**Estimated Time:** 6 hours

---

#### 10_build_new_pwa_mobile.md
**Purpose:** PWA setup + mobile optimization + Capacitor wrapper  
**Dependencies:** 09_build_new_settings_pages.md  
**Builds:**
- Vite PWA plugin configuration
- Service worker with caching strategies
- PWA manifest.json (icons, colors, shortcuts)
- Capacitor configuration (iOS + Android)
- Mobile bottom navigation (6 icons)
- Mobile header with profile menu
- Install prompt (browser only, not in PWA/Capacitor)
- Offline indicator banner
- Dark mode toggle + system preference
- Touch-optimized components
- Offline data sync (IndexedDB queue)
- Mobile-specific styles

**Key Deliverables:**
- `vite.config.ts` (PWA plugin)
- `capacitor.config.ts`
- `public/manifest.json`
- `public/icons/` (192x192, 512x512, maskable)
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/layout/MobileHeader.tsx`
- `src/components/layout/InstallPrompt.tsx`
- `src/components/layout/OfflineIndicator.tsx`
- `src/components/theme/ThemeToggle.tsx`
- `src/hooks/usePWA.ts`
- `src/hooks/useOffline.ts`
- `src/hooks/useDarkMode.ts`
- `src/hooks/useMobileDetection.ts`
- `src/lib/offline-sync.ts`
- `src/styles/mobile.css`

**Acceptance Criteria:**
- [ ] PWA installs from browser
- [ ] Service worker caches assets
- [ ] Offline mode works (cached data visible)
- [ ] Install prompt appears in browser only
- [ ] Dark mode toggles correctly
- [ ] Bottom nav shows on mobile
- [ ] Capacitor builds for iOS/Android
- [ ] Touch targets 44x44px minimum
- [ ] Offline sync queues actions
- [ ] Lighthouse score 90+

**Estimated Time:** 4 hours

---

## 📊 Build Timeline Summary

| Phase | Files | Est. Hours | Dependencies | Parallelizable? |
|-------|-------|------------|--------------|-----------------|
| **0: Init** | 1 | 2 hrs | Backend running | No |
| **1: Foundation** | 3 | 12 hrs | Phase 0 | Partial (file 01) |
| **2: Core Features** | 3 | 24 hrs | Phase 1 | Yes (files 05+06 after 04) |
| **3: Growth & Polish** | 3 | 16 hrs | Phase 2 | Partial (files 08+09) |
| **TOTAL** | **10 files** | **54 hrs** | Sequential + Parallel | **~1 week** |

---

## 🗺️ Dependency Graph

```
00 (Init) ────────────────────────────────────┐
 ↓                                             │
01 (Marketing) ← Can run in parallel           │
 ↓                                             ↓
02 (Auth) ────────────────────────────────────┤
 ↓                                             │
03 (Onboarding) ──────────────────────────────┤
 ↓                                             │
04 (Campaigns) ───────────┬───────────────────┤
                          │                   │
                          ├──→ 05 (Analytics) │
                          │                   ↓
                          └──→ 06 (Contacts)  │
                                ↓             │
                          ┌─────┴─────┐       │
                          ↓           ↓       │
                    08 (Gating)  09 (Settings)│
                          └─────┬─────┘       │
                                ↓             │
                          10 (PWA/Mobile) ────┘
```

**Critical Path:** 00 → 02 → 03 → 04 → (05 or 06) → 08 or 09 → 10  
**Parallelizable:** Files 05 and 06 can run simultaneously after 04  
**Independent:** File 01 can run anytime after 00

---

## ✅ Pre-Build Checklist

### **Required Before Starting:**

- [ ] Backend API running at `api.attra.io` or `localhost:8080`
- [ ] Backend contracts accessible at `/schema/openapi.json`
- [ ] Supabase project created with credentials
- [ ] Google OAuth credentials configured
- [ ] Google Maps API key obtained
- [ ] Stripe account created (test mode)
- [ ] Domain `attra.io` purchased and configured
- [ ] Git repository initialized

### **Environment Variables Needed:**

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API
VITE_API_URL=https://api.attra.io

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-maps-key

# Stripe (optional for Phase 3)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Environment
VITE_ENV=development
```

---

## 🧪 Testing Checklist (Execute After Each Phase)

### **After Phase 0:**
- [ ] `pnpm dev` starts without errors
- [ ] Backend contracts pulled successfully
- [ ] TypeScript compiles

### **After Phase 1:**
- [ ] Marketing site loads
- [ ] Google OAuth sign-in works
- [ ] Onboarding wizard completes
- [ ] Tenant created in database

### **After Phase 2:**
- [ ] Campaign creation end-to-end works
- [ ] PDF downloads successfully
- [ ] QR scan landing page loads
- [ ] Map shows scan pins
- [ ] Contact added via scan form

### **After Phase 3:**
- [ ] Feature gates show upgrade prompts
- [ ] Settings tabs all functional
- [ ] PWA installs on device
- [ ] Offline mode works

---

## 🚀 Deployment Steps

### **1. Marketing Site (attra.io)**
```bash
cd marketing
pnpm build
# Deploy to Vercel/Cloudflare Pages
```

### **2. App (app.attra.io)**
```bash
pnpm build
# Deploy to Vercel/Render/Cloudflare Pages
```

### **3. Mobile Apps (Optional)**
```bash
# iOS
pnpm build:ios
pnpm cap:open:ios
# Archive and upload to App Store Connect

# Android
pnpm build:android
pnpm cap:open:android
# Generate signed bundle and upload to Play Console
```

---

## 📚 Command Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "pull-contracts": "./scripts/pull-contracts.sh",
    
    "cap:sync": "cap sync",
    "cap:open:ios": "cap open ios",
    "cap:open:android": "cap open android",
    
    "build:pwa": "pnpm build",
    "build:ios": "pnpm build && cap sync ios && cap build ios",
    "build:android": "pnpm build && cap sync android && cap build android",
    
    "generate:icons": "node scripts/generate-icons.js"
  }
}
```

---

## 🛠️ Troubleshooting

### **Backend contracts fail to pull**
```bash
# Check if backend is running
curl http://localhost:8080/health

# Manually fetch contracts
curl http://localhost:8080/schema/openapi.json | jq
```

### **TypeScript errors after pulling contracts**
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### **Supabase connection fails**
```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check .env file
cat .env
```

### **PWA not installing**
- Check `manifest.json` is accessible
- Verify HTTPS (required for PWA)
- Check service worker registration in DevTools

---

## 📝 Notes for Claude Code

### **Execution Guidelines:**

1. **Read dependencies first** - Never start a file before its dependencies
2. **Test after each file** - Run acceptance criteria before moving on
3. **Commit after each file** - Git commit with descriptive message
4. **Pull contracts first** - Always run `pnpm pull-contracts` before building
5. **Report blockers** - If stuck, document the issue and stop

### **Code Standards:**

- TypeScript strict mode (no `any` types)
- Use Shadcn/ui components (no custom UI from scratch)
- Mobile-first CSS (test on small screens)
- Accessibility (ARIA labels, keyboard navigation)
- Error boundaries on all page components
- Loading states on all async operations

---

## 🎉 Definition of Done

The frontend is **production-ready** when:

- ✅ All 10 files executed successfully
- ✅ All acceptance criteria met
- ✅ TypeScript compiles with zero errors
- ✅ `pnpm build` succeeds
- ✅ Lighthouse score 90+ on mobile
- ✅ PWA installs successfully
- ✅ All pages responsive on mobile
- ✅ Auth flow works end-to-end
- ✅ Campaign creation works end-to-end
- ✅ Realtime map shows scans
- ✅ Feature gates enforce plan limits
- ✅ Settings save correctly
- ✅ Offline mode functions

---

## 🆘 Support & Escalation

If Claude Code encounters blockers:

1. Check the troubleshooting section in the relevant file
2. Review error logs and stack traces
3. Verify prerequisites are met
4. Test components in isolation
5. Document the issue and escalate to Joseph

**Include in escalation:**
- Command file being executed
- Step where failure occurred
- Complete error message
- Environment (local/staging/production)
- Steps already attempted

---

**End of Master Manifest - Ready for Execution** �
