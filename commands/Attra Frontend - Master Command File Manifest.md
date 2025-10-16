# Attra Frontend - Master Command File Manifest

## Project Overview

**Goal:** Build complete MVP frontend for Attra attribution platform
**Timeline:** ~2 weeks with Claude Code autonomous execution
**Tech Stack:** Vite + React Router + Shadcn/ui + Tailwind + TypeScript

---

## Command File Directory

```
/claude/commands/frontend/
├── Phase 1: Foundation (Week 1)
│   ├── 01_build_marketing_site_layout.md
│   ├── 02_build_auth_and_tenant_setup.md
│   └── 03_build_onboarding_wizard.md
│
├── Phase 2: Physical → Digital (●>) (Week 1-2)
│   ├── 04_build_campaign_wizard.md
│   ├── 05_build_ai_copy_generation_service.md
│   ├── 06_build_pdf_generation_service.md
│   ├── 07_build_qr_link_and_utm_service.md
│   ├── 08_build_scan_landing_page_system.md
│   └── 09_build_qr_scan_tracking.md
│
├── Phase 3: Digital → Physical (>●) (Week 2)
│   ├── 10_build_contacts_module.md
│   ├── 11_build_interactions_module.md
│   ├── 12_build_email_template_system.md
│   └── 13_build_gmail_sync.md
│
├── Phase 4: The Dashboard (Week 2-3)
│   ├── 14_build_realtime_map_dashboard.md
│   ├── 15_build_campaigns_list_view.md
│   └── 16_build_analytics_dashboard.md
│
├── Phase 5: Growth Mechanics (Week 3)
│   ├── 17_build_usage_tracking_and_limits.md
│   ├── 18_build_stripe_billing_integration.md
│   ├── 19_build_settings_pages.md
│   ├── 23_build_feature_gating_backend.md ← NEW
│   └── 24_build_feature_gating_frontend.md ← NEW
│
└── Phase 6: Polish (Week 3-4)
    ├── 20_build_pwa_setup.md
    ├── 21_build_mobile_dashboard.md
    └── 22_finalize_launch_and_seed_data.md
```

---

## Complete Command File List with Dependencies

### Phase 1: Foundation (12 hours)

#### 01_build_marketing_site_layout.md (3 hrs)
**Purpose:** Landing page at `attra.io`
**Builds:**
- Hero section with ●>attra>● logo
- "Measure the real world" headline
- Animated map background
- Sign up CTA → `app.attra.io/signup`
- Footer (docs, pricing, login)
**Dependencies:** None
**Tech:** Next.js or Astro (static export)
**Deliverables:**
- `marketing/pages/index.tsx`
- `marketing/components/Hero.tsx`
- `marketing/components/AnimatedMap.tsx`

---

#### 02_build_auth_and_tenant_setup.md (4 hrs)
**Purpose:** Supabase Auth + tenant creation
**Builds:**
- Google OAuth login
- Sign up page at `app.attra.io/signup`
- Create `users` + `tenants` records
- Redirect to onboarding
**Dependencies:** Supabase configured
**Tech:** Supabase Auth, React Router
**Deliverables:**
- `src/pages/Signup.tsx`
- `src/pages/Login.tsx`
- `src/hooks/useAuth.ts`
- `src/lib/supabase.ts`

---

#### 03_build_onboarding_wizard.md (5 hrs)
**Purpose:** Outcome-based onboarding flow
**Builds:**
- Step 1: Choose vertical (dropdown)
- Step 2: Upload logo + brand colors
- Step 3: First location (address autocomplete)
- Step 4: Choose campaign goal
- Creates first tenant + location + campaign
**Dependencies:** 02_build_auth_and_tenant_setup.md
**Tech:** React Hook Form + Zod, Google Maps API
**Deliverables:**
- `src/pages/Onboarding.tsx`
- `src/components/onboarding/VerticalSelector.tsx`
- `src/components/onboarding/BrandingForm.tsx`
- `src/components/onboarding/LocationForm.tsx`

---

### Phase 2: Physical → Digital (●>) (28 hours)

#### 04_build_campaign_wizard.md (6 hrs)
**Purpose:** Create campaigns with AI-generated flyers
**Builds:**
- Campaign goal selection
- AI headline/subheadline generation
- Location selection
- Layout choice (Classic/Modern/Minimal)
- PDF preview
**Dependencies:** 03_build_onboarding_wizard.md, 05_build_ai_copy_generation_service.md
**Tech:** React Hook Form, React Query
**Deliverables:**
- `src/pages/campaigns/New.tsx`
- `src/components/campaigns/CampaignWizard.tsx`
- `src/components/campaigns/LayoutSelector.tsx`
- `src/components/campaigns/PDFPreview.tsx`

---

#### 05_build_ai_copy_generation_service.md (4 hrs)
**Purpose:** OpenAI/Anthropic integration for copy
**Builds:**
- Backend API endpoint `/api/ai/generate-copy`
- Prompt templates per vertical + goal
- Copy versioning (regenerate button)
**Dependencies:** None (backend only)
**Tech:** OpenAI API or Anthropic API
**Deliverables:**
- `api/services/ai-copy-generator.js`
- `api/routes/ai.js`

---

#### 06_build_pdf_generation_service.md (5 hrs)
**Purpose:** Generate branded flyer PDFs
**Builds:**
- Puppeteer/PDFKit worker
- HTML templates (Classic/Modern/Minimal)
- Brand injection (logo, colors, fonts)
- QR code embedding
- Supabase Storage upload
**Dependencies:** 07_build_qr_link_and_utm_service.md
**Tech:** Puppeteer or PDFKit, Supabase Storage
**Deliverables:**
- `api/workers/pdf-generator.js`
- `api/templates/flyers/classic.html`
- `api/templates/flyers/modern.html`
- `api/templates/flyers/minimal.html`

---

#### 07_build_qr_link_and_utm_service.md (4 hrs)
**Purpose:** Generate QR codes and short links
**Builds:**
- Short code generation (6-char alphanumeric)
- QR image generation
- UTM parameter builder
- Store in `ops.qr_links`
**Dependencies:** None (backend only)
**Tech:** `qrcode` npm package
**Deliverables:**
- `api/services/qr-generator.js`
- `api/services/utm-builder.js`

---

#### 08_build_scan_landing_page_system.md (6 hrs)
**Purpose:** Attra-hosted lead capture pages
**Builds:**
- Public route `/s/:code`
- Fetch campaign config
- Render branded form (name + email)
- Submit → create contact
- Redirect to tenant's URL with params
**Dependencies:** 09_build_qr_scan_tracking.md, 10_build_contacts_module.md
**Tech:** React, Tailwind, Supabase
**Deliverables:**
- `src/pages/ScanLanding.tsx`
- `src/components/scan/BrandedForm.tsx`
- `api/routes/public/scan.js`

---

#### 09_build_qr_scan_tracking.md (3 hrs)
**Purpose:** Log scan events
**Builds:**
- Log scan (timestamp, location, device)
- Store in `ops.qr_scans`
- Link to contact if form submitted
**Dependencies:** None (backend only)
**Tech:** Fastify, Supabase
**Deliverables:**
- `api/services/scan-tracker.js`
- `api/routes/scan.js`

---

### Phase 3: Digital → Physical (>●) (20 hours)

#### 10_build_contacts_module.md (5 hrs)
**Purpose:** Contact management (CRM basics)
**Builds:**
- Contacts table view
- Add/edit/delete contacts
- Source tracking (QR scan vs manual)
- Filter by campaign/location
- Data masking for free tier
**Dependencies:** 24_build_feature_gating_frontend.md
**Tech:** React Query, Shadcn Table
**Deliverables:**
- `src/pages/Contacts.tsx`
- `src/components/contacts/ContactTable.tsx`
- `src/components/contacts/ContactForm.tsx`
- `api/routes/contacts.js`

---

#### 11_build_interactions_module.md (4 hrs)
**Purpose:** Track calls, emails, meetings
**Builds:**
- Log interaction form
- Timeline view per contact
- Quick actions (send email, set reminder)
**Dependencies:** 10_build_contacts_module.md
**Tech:** React Hook Form
**Deliverables:**
- `src/components/contacts/InteractionTimeline.tsx`
- `src/components/contacts/LogInteractionForm.tsx`
- `api/routes/interactions.js`

---

#### 12_build_email_template_system.md (5 hrs)
**Purpose:** Email templates with variables
**Builds:**
- Template CRUD
- Variable insertion ({name}, {location})
- Preview + test send
- Store in `ops.email_templates`
**Dependencies:** 13_build_gmail_sync.md
**Tech:** React Hook Form, Rich text editor
**Deliverables:**
- `src/pages/EmailTemplates.tsx`
- `src/components/emails/TemplateEditor.tsx`
- `src/components/emails/VariableInserter.tsx`
- `api/routes/email-templates.js`

---

#### 13_build_gmail_sync.md (6 hrs)
**Purpose:** Gmail OAuth + sending
**Builds:**
- Gmail API OAuth flow
- Send email via Gmail
- Sync sent emails to `ops.sent_emails`
**Dependencies:** None (backend only)
**Tech:** Gmail API, Supabase
**Deliverables:**
- `api/integrations/gmail.js`
- `api/routes/gmail-auth.js`
- `src/pages/settings/Integrations.tsx`

---

### Phase 4: The Dashboard (15 hours)

#### 14_build_realtime_map_dashboard.md (7 hrs)
**Purpose:** Real-time scan visualization
**Builds:**
- Mapbox/Leaflet integration
- Pin per location (with scan count)
- Real-time pulse on new scan (Supabase Realtime)
- Filter by campaign/date
- Recent scans feed
**Dependencies:** 09_build_qr_scan_tracking.md, 24_build_feature_gating_frontend.md
**Tech:** Mapbox GL JS or Leaflet, Supabase Realtime
**Deliverables:**
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/MapView.tsx`
- `src/components/dashboard/RecentScans.tsx`
- `src/hooks/useRealtimeScans.ts`

---

#### 15_build_campaigns_list_view.md (3 hrs)
**Purpose:** Campaign management table
**Builds:**
- Table: Name | Goal | Scans | Contacts | Status
- Click → campaign detail
- "New Campaign" button
**Dependencies:** 04_build_campaign_wizard.md
**Tech:** Shadcn Table
**Deliverables:**
- `src/pages/Campaigns.tsx`
- `src/components/campaigns/CampaignTable.tsx`

---

#### 16_build_analytics_dashboard.md (5 hrs)
**Purpose:** Charts and reports
**Builds:**
- Scans over time (line chart)
- Top locations (bar chart)
- Conversion funnel (scans → contacts)
- Export CSV
**Dependencies:** 24_build_feature_gating_frontend.md
**Tech:** Recharts, Shadcn Charts
**Deliverables:**
- `src/pages/Analytics.tsx`
- `src/components/analytics/LineChart.tsx`
- `src/components/analytics/BarChart.tsx`
- `src/components/analytics/ConversionFunnel.tsx`

---

### Phase 5: Growth Mechanics (21 hours)

#### 17_build_usage_tracking_and_limits.md (5 hrs)
**Purpose:** Track usage against plan limits
**Builds:**
- Track scans/contacts per tenant per month
- Plan limits enforcement
- Soft block + upgrade prompt UI
- Store in `billing.usage_tracking`
**Dependencies:** 23_build_feature_gating_backend.md
**Tech:** Supabase functions, React
**Deliverables:**
- `api/services/usage-tracker.js`
- `src/components/PlanUsageWidget.tsx`
- Database table: `billing.usage_tracking`

---

#### 18_build_stripe_billing_integration.md (6 hrs)
**Purpose:** Stripe subscriptions
**Builds:**
- Stripe Customer Portal
- Subscription creation (Starter/Pro/Enterprise)
- Webhook handling (subscription.created, etc.)
- Plan features unlock
**Dependencies:** 23_build_feature_gating_backend.md
**Tech:** Stripe API, Stripe Checkout
**Deliverables:**
- `api/integrations/stripe.js`
- `api/routes/billing.js`
- `src/pages/Upgrade.tsx`
- `src/pages/Billing.tsx`

---

#### 19_build_settings_pages.md (5 hrs)
**Purpose:** Tenant settings
**Builds:**
- Profile tab (name, email, photo)
- Branding tab (logo, colors, font)
- Integrations tab (Gmail, API keys)
- Billing tab (Stripe portal iframe)
**Dependencies:** 13_build_gmail_sync.md, 18_build_stripe_billing_integration.md
**Tech:** React Hook Form, Tabs component
**Deliverables:**
- `src/pages/Settings.tsx`
- `src/components/settings/ProfileTab.tsx`
- `src/components/settings/BrandingTab.tsx`
- `src/components/settings/IntegrationsTab.tsx`
- `src/components/settings/BillingTab.tsx`

---

#### 23_build_feature_gating_backend.md (5 hrs) ⭐ NEW
**Purpose:** Database + API for feature gating
**Builds:**
- `billing.plans` table (pricing config)
- `billing.plan_limits` table (usage limits)
- `billing.feature_gates` table (feature → plan mapping)
- API routes for checking access
- Admin routes for updating pricing
**Dependencies:** None (backend only)
**Tech:** Supabase, Fastify
**Deliverables:**
- Database schema (3 tables)
- `api/routes/plans.js`
- `api/routes/features.js`
- `api/middleware/checkFeatureAccess.js`

---

#### 24_build_feature_gating_frontend.md (6 hrs) ⭐ NEW
**Purpose:** React components for feature gating
**Builds:**
- `useFeatureGate()` hook
- `usePlanLimits()` hook
- `<LockedFeature>` component
- `<UpgradePrompt>` component
- `<PlanUsageWidget>` component
- Data masking utilities
**Dependencies:** 23_build_feature_gating_backend.md
**Tech:** React Query, Shadcn UI
**Deliverables:**
- `src/hooks/useFeatureGate.ts`
- `src/components/feature-gating/LockedFeature.tsx`
- `src/components/feature-gating/UpgradePrompt.tsx`
- `src/lib/data-masking.ts`

---

### Phase 6: Polish (9 hours)

#### 20_build_pwa_setup.md (4 hrs)
**Purpose:** Progressive Web App config
**Builds:**
- Service worker
- Manifest.json
- Offline caching strategy
- "Add to Home Screen" prompt
**Dependencies:** None
**Tech:** Vite PWA plugin
**Deliverables:**
- `vite.config.ts` (PWA plugin)
- `public/manifest.json`
- `src/service-worker.ts`

---

#### 21_build_mobile_dashboard.md (5 hrs)
**Purpose:** Mobile-optimized UI
**Builds:**
- Responsive layouts
- Mobile-friendly map
- Touch-optimized forms
- Quick action cards
**Dependencies:** 14_build_realtime_map_dashboard.md
**Tech:** Tailwind responsive classes
**Deliverables:**
- Mobile CSS adjustments
- Touch event handlers
- Hamburger menu

---

#### 22_finalize_launch_and_seed_data.md (3 hrs)
**Purpose:** Production readiness
**Builds:**
- Seed demo campaigns
- Test data cleanup scripts
- Environment variable audit
- Launch checklist document
**Dependencies:** All previous files
**Tech:** Supabase seed scripts
**Deliverables:**
- `scripts/seed-demo-data.sql`
- `scripts/cleanup-test-data.sql`
- `.env.example`
- `LAUNCH_CHECKLIST.md`

---

## Build Timeline Summary

| Phase | Files | Est. Hours | Parallelizable? |
|-------|-------|------------|-----------------|
| 1: Foundation | 3 | 12 hrs | ✅ Yes |
| 2: ●> Flow | 6 | 28 hrs | ✅ Yes (after Phase 1) |
| 3: >● Flow | 4 | 20 hrs | ✅ Yes (after Phase 2) |
| 4: Dashboard | 3 | 15 hrs | ✅ Yes (after Phase 2) |
| 5: Growth | 5 | 21 hrs | ⚠️ Some sequential |
| 6: Polish | 3 | 9 hrs | ✅ Yes (after Phase 4) |
| **TOTAL** | **24 files** | **~105 hrs** | **~2 weeks with parallel execution** |

---

## Your To-Do List (Human Checkpoints)

### 🪪 Setup & Access (Before Build Starts)

- [ ] Buy domain: `attra.io` via Cloudflare
- [ ] Create Supabase project (`attra-prod`)
- [ ] Add Claude Code service key to Supabase
- [ ] Create GitHub repos (`attra-frontend`, `attra-backend`)
- [ ] Create Render/Railway apps for `api.attra.io` and `app.attra.io`
- [ ] Configure Cloudflare DNS:
  - `attra.io` → marketing site
  - `app.attra.io` → frontend app
  - `api.attra.io` → backend API
- [ ] Get OpenAI or Anthropic API key (for copy generation)
- [ ] Get Stripe account + API keys (test mode first)
- [ ] Get Google Maps API key (address autocomplete)
- [ ] Get Gmail API credentials (OAuth)

### 🧭 Command Approval Workflow

**Week 1:**
- [ ] Review + approve Phase 1 files (01-03)
- [ ] Review + approve Phase 2 files (04-09)

**Week 2:**
- [ ] Review + approve Phase 3 files (10-13)
- [ ] Review + approve Phase 4 files (14-16)

**Week 3:**
- [ ] Review + approve Phase 5 files (17-19, 23-24)
- [ ] Review + approve Phase 6 files (20-22)

### 🧪 Testing Sequence

- [ ] **Auth test:** Sign up with Google OAuth → tenant created
- [ ] **Onboarding test:** Complete wizard → location + campaign created
- [ ] **Flyer test:** Create campaign → PDF downloads → QR works
- [ ] **Scan test:** Scan QR on phone → form appears → contact captured
- [ ] **Map test:** Check dashboard → pin appears → pulse on new scan
- [ ] **Contact test:** View contacts → data masking works in free tier
- [ ] **Upgrade test:** Click upgrade → Stripe Checkout works
- [ ] **Gmail test:** Connect Gmail → send test email
- [ ] **PWA test:** Install on mobile → offline mode works
- [ ] **Feature gate test:** Free user sees locked features with prompts

### 🧱 Deployment & Launch

- [ ] Verify environment variables in production
- [ ] Enable Supabase RLS (row-level security)
- [ ] Run seed script: `22_finalize_launch_and_seed_data.md`
- [ ] Deploy marketing site (`attra.io`)
- [ ] Deploy app (`app.attra.io`)
- [ ] Test live QR from printed flyer
- [ ] Monitor error logs for 24 hours
- [ ] Announce beta launch 🎉

---

## Critical Reminders

### For Claude Code Execution:

1. **Always read dependencies first** - Don't build 04 before 03
2. **Test each file after build** - Run acceptance criteria
3. **Commit after each file** - Git commit with descriptive message
4. **Report blockers immediately** - If stuck, ask human for help
5. **Use TypeScript strict mode** - No `any` types allowed
6. **Follow Shadcn patterns** - Use existing UI components
7. **Mobile-first CSS** - Test responsive on small screens
8. **Accessibility matters** - ARIA labels, keyboard navigation

### For You (Joseph):

1. **Approve in batches** - Don't approve all 24 at once
2. **Test incrementally** - Verify each phase before next
3. **Budget ~2 weeks** - Even with parallel execution
4. **Keep Supabase open** - Monitor queries and errors
5. **Check costs daily** - OpenAI API, Supabase, Stripe test charges
6. **Document decisions** - If you change something, update command file
7. **Trust the process** - Claude Code is autonomous, but check output

---

## Emergency Contacts

If you lose this conversation:
1. This manifest is saved in artifact `attra_master_manifest`
2. Backend command file is in artifact `feature_gating_backend`
3. Frontend command file is in artifact `feature_gating_frontend`
4. All files should be committed to `/claude/commands/frontend/` in your repo

---

## Next Steps

1. **Copy this manifest** to `/claude/commands/MASTER_MANIFEST.md` in your repo
2. **Create `/claude/commands/frontend/` directory**
3. **Tell Claude Code:** "Start with Phase 1, execute files 01-03 in order"
4. **Monitor progress** via GitHub commits
5. **Approve Phase 2** after Phase 1 tests pass

---

**Last Updated:** October 15, 2025
**Status:** Ready for execution
**Estimated Completion:** ~2 weeks from start
