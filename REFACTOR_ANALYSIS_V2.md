# Campaign Wizard Refactor V2 - Comprehensive Analysis

**Document:** `FRONTEND_CAMPAIGN_WIZARD_IMPLEMENTATION.md`
**Analysis Date:** October 22, 2025
**Status:** Ready for Implementation ✅

---

## Executive Summary

This V2 proposal is **dramatically better** than the first version. It's simpler, faster to implement, and more maintainable while still delivering the core functionality needed for campaign creation.

**Key Improvements:**
- ❌ Removed component library (saves 2-3 hours)
- ❌ Removed multi-step API calls
- ✅ Uses existing `/generate-flyer` endpoint (no backend wait!)
- ✅ Added per-location customization toggle (huge feature)
- ✅ Single atomic API call
- ✅ Simpler state management

**Time Estimate:** 3-4 hours (realistic)
**Complexity:** Medium
**Risk:** Low

---

## Comparison: V1 vs V2

| Aspect | V1 (Original) | V2 (This Proposal) | Winner |
|--------|---------------|-------------------|---------|
| **Component Library** | Yes - full reusable system | No - simple inline components | V2 ✅ |
| **Implementation Time** | 6-8 hours | 3-4 hours | V2 ✅ |
| **State Management** | Complex with preview system | Straightforward wizard state | V2 ✅ |
| **API Calls** | Multiple (campaign → assets → generate) | Single atomic call | V2 ✅ |
| **Backend Dependency** | New endpoints needed | Uses existing endpoint | V2 ✅ |
| **Per-Location Copy** | Not mentioned | Built-in toggle feature | V2 ✅ |
| **Code Reusability** | High | Low | V1 ✅ |
| **Maintenance** | More complex | Simpler | V2 ✅ |

**Verdict:** V2 is significantly better for immediate needs.

---

## Architecture Analysis

### 5-Step Wizard Flow

```
1. Goal Selection → 2. Locations → 3. Asset Type + Toggle → 4. Design → 5. Review
```

**Strengths:**
- ✅ Linear, predictable flow
- ✅ Campaign auto-created at Step 1→2 transition
- ✅ Toggle at Step 3 determines Step 4 behavior (smart!)
- ✅ Review step prevents mistakes

**Potential Issues:**
- ⚠️ Step 4 has two completely different UIs (shared vs per-location)
- ⚠️ State initialization for locationAssets could be tricky

### Two-Mode Design System

**Shared Mode (Toggle OFF):**
- Single form with: URL, Headline, Subheadline, CTA, Layout
- Backend gets: `location_ids`, `layout`, `copy`
- Creates N identical assets (one per location)

**Per-Location Mode (Toggle ON):**
- Tabbed interface, one form per location
- Backend gets: `assets` array with custom copy per location
- Creates N unique assets

**This is brilliant design!** Covers both simple and complex use cases.

---

## Implementation Complexity Breakdown

### Step 1: Types (15 minutes)
- Create `src/types/campaign.ts`
- Define Campaign, CampaignCopy, WizardData interfaces
- **Risk:** None - straightforward TypeScript

### Step 2: Campaign API Client (20 minutes)
- Update `src/lib/campaign-api.ts`
- Add `generateAssets()` method
- **Risk:** Low - we already have similar patterns

### Step 3: Wizard State Hook (25 minutes)
- Create `useCampaignWizard.ts` hook
- State management and validation logic
- **Risk:** Medium - `canProceed()` validation logic is complex

### Step 4-8: Five Step Components (90-120 minutes)
- **Step1Goal** (20 min): Radio group with icons ✅
- **Step2Locations** (25 min): Multi-select checkboxes with Supabase query ✅
- **Step3AssetType** (20 min): Radio group + toggle ✅
- **Step4DesignShared** (25 min): Form with character limits ✅
- **Step4DesignPerLocation** (40-50 min): Tabs + repeated forms - **MOST COMPLEX** ⚠️
- **Step5Review** (20 min): Read-only summary ✅

**Risk Areas:**
- ⚠️ Step4DesignPerLocation has tab navigation + dynamic form generation
- ⚠️ LocationAssets state initialization timing
- ⚠️ Keeping tab state in sync with selections

### Step 9: Main Wizard (40 minutes)
- Update `src/pages/campaigns/New.tsx`
- Conditional rendering based on step
- Campaign creation effect hook
- Generate assets mutation
- **Risk:** Medium - useEffect timing for campaign creation

### Testing (30 minutes)
- Shared mode flow
- Per-location mode flow
- Validation edge cases
- API integration

**Total Time Estimate:** 3-4 hours (realistic with existing components)

---

## Critical Dependencies

### Backend Endpoint
```
POST /api/internal/campaigns/:id/generate-flyer
```

**Must Support:**
1. Shared mode payload:
```json
{
  "asset_type": "flyer",
  "base_url": "https://...",
  "location_ids": ["loc1", "loc2"],
  "layout": "modern",
  "copy": { "headline": "...", "subheadline": "...", "cta": "..." }
}
```

2. Per-location mode payload:
```json
{
  "asset_type": "flyer",
  "base_url": "https://...",
  "assets": [
    {
      "location_id": "loc1",
      "layout": "modern",
      "copy": { "headline": "...", "subheadline": "...", "cta": "..." }
    }
  ]
}
```

**Expected Response:**
```json
{
  "message": "...",
  "campaign_id": "...",
  "assets_created": 2,
  "qr_links_created": 2,
  "jobs_enqueued": 2,
  "assets": [...],
  "qr_links": [...],
  "job_ids": [...]
}
```

**QUESTION FOR USER:** Is this endpoint deployed and ready? ⚠️

---

## Potential Issues & Solutions

### Issue 1: locationAssets Initialization
**Problem:** Empty array vs undefined, timing of initialization

**Solution (from code):**
```typescript
// In Step4DesignPerLocation
if (locationAssets.length === 0 && selectedLocationIds.length > 0) {
  onLocationAssetsChange(
    selectedLocationIds.map(id => ({
      location_id: id,
      layout: 'modern',
      copy: { headline: '', subheadline: '', cta: '' }
    }))
  );
}
```

**Risk Level:** Low - handled in component

### Issue 2: Campaign Creation Timing
**Problem:** Campaign needs to exist before Step 2, but created in useEffect

**Solution (from code):**
```typescript
useEffect(() => {
  if (currentStep === 2 && !campaignId && wizardData.goal) {
    createCampaign();
  }
}, [currentStep, campaignId, wizardData.goal]);
```

**Risk Level:** Medium - useEffect can fire multiple times
**Recommendation:** Add `isCreatingCampaign` flag (already present in code ✅)

### Issue 3: Character Limit Enforcement
**Problem:** Need to prevent copy that's too long

**Solution (from code):**
```typescript
<Input
  maxLength={60}
  value={copy.headline}
  onChange={(e) => onCopyChange({ ...copy, headline: e.target.value })}
/>
```

**Risk Level:** None - handled with `maxLength`

### Issue 4: Tab State in Per-Location Mode
**Problem:** Active tab needs to default to first location

**Solution (from code):**
```typescript
const [activeTab, setActiveTab] = useState(selectedLocationIds[0] || '');
```

**Risk Level:** Low - but what if user goes back and changes locations?
**Recommendation:** Reset activeTab when selectedLocationIds changes

### Issue 5: Missing Shadcn Components
**Components Used:**
- Card, CardContent, CardHeader, CardTitle, CardDescription ✅
- Button ✅
- Input ✅
- Textarea ⚠️ (need to verify installed)
- RadioGroup, RadioGroupItem ✅
- Checkbox ✅
- Switch ✅
- Label ✅
- Separator ✅
- Badge ✅
- Progress ✅
- Tabs, TabsContent, TabsList, TabsTrigger ✅

**Action Required:** Check if Textarea is installed:
```bash
npx shadcn@latest add textarea
```

---

## Migration Impact

### Files to Create (New):
- `src/types/campaign.ts` (or update existing)
- `src/hooks/useCampaignWizard.ts`
- `src/components/campaigns/wizard/Step1Goal.tsx`
- `src/components/campaigns/wizard/Step2Locations.tsx`
- `src/components/campaigns/wizard/Step3AssetType.tsx`
- `src/components/campaigns/wizard/Step4DesignShared.tsx`
- `src/components/campaigns/wizard/Step4DesignPerLocation.tsx`
- `src/components/campaigns/wizard/Step5Review.tsx`

### Files to Update:
- `src/lib/campaign-api.ts` - Add `generateAssets()` method
- `src/pages/campaigns/New.tsx` - Complete rewrite

### Files to Delete (maybe):
- Old `CampaignWizard.tsx` (if it exists)
- Old PDF preview components (replaced by review step)

**Risk:** Medium - will break existing campaign creation flow temporarily

---

## Testing Plan

### Test Case 1: Shared Mode Flow
1. Select goal → verify campaign created
2. Select 3 locations → verify selection stored
3. Choose "Flyer" asset type, toggle OFF
4. Enter URL + copy + layout
5. Review → verify summary shows all data
6. Generate → verify single API call with correct payload
7. Verify redirect to campaign page

**Expected Payload:**
```json
{
  "asset_type": "flyer",
  "base_url": "https://test.com",
  "location_ids": ["loc1", "loc2", "loc3"],
  "layout": "modern",
  "copy": {
    "headline": "Test Headline",
    "subheadline": "Test Subheadline",
    "cta": "Test CTA"
  }
}
```

### Test Case 2: Per-Location Mode Flow
1. Select goal + 2 locations
2. Choose asset type, toggle ON
3. Verify tabs show for both locations
4. Enter different copy for each location
5. Review → verify shows "Per-location (customized)"
6. Generate → verify payload has `assets` array

**Expected Payload:**
```json
{
  "asset_type": "flyer",
  "base_url": "https://test.com",
  "assets": [
    {
      "location_id": "loc1",
      "layout": "classic",
      "copy": { "headline": "Location 1 Headline", ... }
    },
    {
      "location_id": "loc2",
      "layout": "modern",
      "copy": { "headline": "Location 2 Headline", ... }
    }
  ]
}
```

### Test Case 3: Validation
- Try clicking "Next" with empty goal → should be disabled
- Try proceeding without locations → should be disabled
- Try Step 4 with empty headline → should be disabled
- Test character limits (61 chars in headline → truncated)

### Test Case 4: Navigation
- Go forward through steps → verify state persists
- Go back to Step 2 and change locations
- Verify Step 4 updates to show new locations (per-location mode)
- Verify back button disabled on Step 1

### Test Case 5: Error Handling
- Mock API failure on campaign creation
- Mock API failure on asset generation
- Verify toast notifications show
- Verify can retry after failure

---

## Recommendations

### ✅ Proceed with Implementation
**Reasons:**
1. V2 is dramatically simpler than V1
2. Uses existing backend endpoint (no waiting)
3. 3-4 hours is reasonable time investment
4. Low risk - mostly UI work
5. Per-location feature is high-value add

### ⚠️ Before Starting
**Verify:**
1. Backend `/generate-flyer` endpoint is deployed
2. Endpoint supports both `location_ids` AND `assets` formats
3. Textarea component is installed (`npx shadcn@latest add textarea`)

### 💡 Suggested Improvements
**Optional enhancements:**
1. Add preview thumbnail in layout selection
2. Add "Copy from another location" button in per-location mode
3. Add autosave to localStorage (resume incomplete wizards)
4. Add "Generate sample copy" AI button (future enhancement)

### 🚨 Watch Out For
1. **Campaign creation timing** - ensure campaignId is set before Step 2 UI renders
2. **Location changes** - if user goes back and changes locations, reset locationAssets
3. **Tab state** - ensure activeTab stays in bounds when locations change
4. **Character counting** - ensure counts update in real-time
5. **Validation** - ensure `canProceed()` logic is bulletproof

---

## Code Quality Assessment

### Strengths
- ✅ Clean separation of concerns (one component per step)
- ✅ Proper TypeScript typing throughout
- ✅ Good use of React Query for data fetching
- ✅ Character limits enforced in UI
- ✅ Proper error handling with toast notifications
- ✅ Loading states for async operations

### Areas for Improvement
- ⚠️ No PropTypes or JSDoc comments (minor)
- ⚠️ Hard-coded character limits (60, 120, 40) could be constants
- ⚠️ GOALS, ASSET_TYPES, LAYOUTS arrays repeated in multiple files
- ⚠️ No unit tests included in spec

**Recommendation:** Extract constants to `src/constants/campaign.ts`

---

## Final Verdict

**Status: READY TO IMPLEMENT** ✅

**Confidence Level:** High (85%)

**Why High Confidence:**
- Proposal is well-structured and detailed
- Uses existing patterns from codebase
- No experimental features or libraries
- Clear success criteria
- Realistic time estimate

**Remaining 15% Uncertainty:**
- Backend endpoint readiness not confirmed
- Per-location tab state management could have edge cases
- Campaign creation useEffect timing

**Next Steps:**
1. ✅ User confirms backend endpoint is deployed
2. ✅ User approves proceeding with implementation
3. ✅ Install Textarea component if needed
4. ✅ Start with Step 1 and work sequentially through steps

---

## Time Breakdown (Detailed)

| Task | Est. Time | Actual Time | Notes |
|------|-----------|-------------|-------|
| Types & Interfaces | 15 min | TBD | Straightforward |
| Campaign API Client | 20 min | TBD | Similar to existing |
| Wizard State Hook | 25 min | TBD | Most complex logic |
| Step 1: Goal | 20 min | TBD | Simple radio group |
| Step 2: Locations | 25 min | TBD | Multi-select + query |
| Step 3: Asset Type | 20 min | TBD | Radio + toggle |
| Step 4: Shared | 25 min | TBD | Form with validation |
| Step 4: Per-Location | 50 min | TBD | **MOST COMPLEX** |
| Step 5: Review | 20 min | TBD | Read-only display |
| Main Wizard Component | 40 min | TBD | Orchestration logic |
| Testing & Debugging | 30 min | TBD | Both modes |
| **TOTAL** | **3h 50m** | TBD | Realistic estimate |

---

## Comparison to Current Implementation

**Current State:**
- Has basic wizard with 4 steps (goal → copy → layout → generate)
- Creates campaign on mount
- Uses `usePDFGeneration` hook
- Generates single asset per campaign
- No multi-location support

**After V2:**
- 5 steps with proper progression
- Multi-location support (bulk operations)
- Per-location customization option
- Single atomic API call
- Better validation and UX

**Migration Strategy:**
1. Keep old wizard temporarily as `/campaigns/new-old`
2. Implement new wizard at `/campaigns/new`
3. Test thoroughly with real backend
4. Remove old wizard once confirmed working

---

## Questions for User

Before proceeding with implementation:

1. **Backend Readiness:**
   - Is `POST /api/internal/campaigns/:id/generate-flyer` deployed?
   - Does it support both `location_ids` (shared) AND `assets` (per-location) formats?
   - Does it return the expected response structure?

2. **Feature Scope:**
   - Should we keep the old wizard during transition, or replace entirely?
   - Do you want preview thumbnails in layout selection? (adds ~30 min)
   - Any specific branding/copy requirements for the wizard?

3. **Testing:**
   - Should I test against production or staging backend?
   - Any specific test scenarios you want covered?

---

**Document prepared by:** Claude Code
**Ready for user review and approval** ✅
