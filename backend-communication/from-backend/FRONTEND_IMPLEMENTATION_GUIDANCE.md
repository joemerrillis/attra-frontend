# FRONTEND IMPLEMENTATION GUIDANCE
## Responses to Frontend Team's Analysis (REFACTOR_ANALYSIS_V2.md)

**Date:** October 22, 2025  
**Status:** Backend deployed ✅  
**Ready to Build:** Yes, with these clarifications

---

## 📋 Addressing The 5 Issues

### ✅ Issue 1: Campaign Draft Loading

**Frontend Question:** Should we load draft campaign data into wizard?

**Answer:** YES, but **simplified approach**

**Why load drafts:**
- User accidentally refreshes page → don't lose their work
- User gets interrupted → can continue later
- Professional polish (users expect this)

**Implementation:**
```typescript
// In New.tsx, after campaign is created
useEffect(() => {
  if (campaignId) {
    // Fetch campaign data
    const loadDraft = async () => {
      const campaign = await campaignAPI.get(campaignId);
      
      // Populate wizard state
      updateData({
        goal: campaign.goal as CampaignGoal,
        assetType: campaign.asset_type as AssetType,
        copy: campaign.copy, // If exists
      });
    };
    
    loadDraft();
  }
}, [campaignId]);
```

**Time:** 20 minutes (not 30)

**Priority:** MEDIUM - Nice to have, but can ship without it

---

### ✅ Issue 2: Supabase Direct Query in Step2Locations

**Frontend Question:** Should we use API client instead of direct Supabase query?

**Answer:** YES, use existing API client

**Why this is better:**
- Consistent with rest of app
- Centralizes location access logic
- Easier to add caching, filtering later

**Update Step2Locations.tsx:**
```typescript
// BEFORE (proposed):
import { supabase } from '@/lib/supabase';

const { data: locations } = useQuery({
  queryKey: ['locations'],
  queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const tenantId = session?.user?.app_metadata?.tenant_id;
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
    
    if (error) throw error;
    return data as Location[];
  }
});

// AFTER (corrected):
import { locationApi } from '@/lib/location-api';

const { data: locations, isLoading } = useQuery({
  queryKey: ['locations'],
  queryFn: locationApi.list
});
```

**Time:** 5 minutes

**Priority:** HIGH - Fix before building

---

### ✅ Issue 3: Campaign API Client Naming

**Frontend Question:** We already have `campaignApi` (lowercase), proposed uses `campaignAPI` (uppercase)

**Answer:** Use existing file, ADD new functions

**Correct Approach:**
```typescript
// File: src/lib/campaign-api.ts (EXISTING FILE)

// Keep existing functions:
export const campaignApi = {
  list: async () => { ... },
  get: async (id: string) => { ... },
  
  // ADD these new functions:
  create: async (data: {
    name: string;
    goal: string;
    description?: string;
  }): Promise<Campaign> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/internal/campaigns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(data)
      }
    );
    
    if (!response.ok) throw new Error('Failed to create campaign');
    return response.json();
  },

  generateAssets: async (
    campaignId: string,
    request: GenerateAssetsRequest
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/internal/campaigns/${campaignId}/generate-flyer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(request)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate assets');
    }
    
    return response.json();
  }
};
```

**In New.tsx, use:**
```typescript
import { campaignApi } from '@/lib/campaign-api'; // Lowercase!

const { mutate: createCampaign } = useMutation({
  mutationFn: campaignApi.create, // Not campaignAPI.create
  // ...
});

const { mutate: generateAssets } = useMutation({
  mutationFn: () => campaignApi.generateAssets(campaignId!, request),
  // ...
});
```

**Time:** 10 minutes

**Priority:** HIGH - Must match existing patterns

---

### ✅ Issue 4: State Update During Render (Step4DesignPerLocation)

**Frontend Question:** This will cause infinite loops!

**Answer:** YES, move to useEffect

**Problem Code:**
```typescript
// ❌ BAD - State update during render
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

**Fixed Code:**
```typescript
// ✅ GOOD - State update in effect
useEffect(() => {
  if (locationAssets.length === 0 && selectedLocationIds.length > 0) {
    onLocationAssetsChange(
      selectedLocationIds.map(id => ({
        location_id: id,
        layout: 'modern' as LayoutType,
        copy: { headline: '', subheadline: '', cta: '' }
      }))
    );
  }
}, [selectedLocationIds, locationAssets.length]); // Dependencies
```

**Update Step4DesignPerLocation.tsx:**

Replace lines that were:
```typescript
// Initialize location assets if empty
if (locationAssets.length === 0 && selectedLocationIds.length > 0) {
  onLocationAssetsChange(...);
}
```

With:
```typescript
// Initialize location assets if empty (in useEffect to avoid render loops)
useEffect(() => {
  if (locationAssets.length === 0 && selectedLocationIds.length > 0) {
    onLocationAssetsChange(
      selectedLocationIds.map(id => ({
        location_id: id,
        layout: 'modern' as LayoutType,
        copy: { headline: '', subheadline: '', cta: '' }
      }))
    );
  }
}, [selectedLocationIds, locationAssets.length, onLocationAssetsChange]);
```

**Time:** 5 minutes

**Priority:** CRITICAL - Will break without this fix

---

### ✅ Issue 5: Missing/Duplicate Types File

**Frontend Question:** Do we already have campaign types?

**Answer:** Check first, merge if exists

**Approach:**
```bash
# 1. Check if types file exists
ls src/types/campaign.ts

# If EXISTS:
# - Open existing file
# - ADD new types (WizardData, LocationCopy, etc.)
# - KEEP existing types
# - MERGE carefully

# If NOT EXISTS:
# - Create new file with all types from command file
```

**Merge Strategy (if types exist):**
```typescript
// src/types/campaign.ts

// KEEP existing types:
export interface Campaign {
  // ... existing fields
}

// ADD new types needed for wizard:
export interface CampaignCopy {
  headline: string;
  subheadline: string;
  cta: string;
}

export interface LocationCopy {
  location_id: string;
  layout: LayoutType;
  copy: CampaignCopy;
}

export interface WizardData {
  goal?: CampaignGoal;
  selectedLocations: string[];
  assetType?: AssetType;
  customizePerLocation: boolean;
  destinationUrl?: string;
  layout?: LayoutType;
  copy?: CampaignCopy;
  locationAssets?: LocationCopy[];
}

export interface GenerateAssetsRequest {
  asset_type: AssetType;
  base_url: string;
  location_ids?: string[];
  layout?: LayoutType;
  copy?: CampaignCopy;
  assets?: Array<{
    location_id: string;
    layout: LayoutType;
    copy: CampaignCopy;
  }>;
}
```

**Time:** 15 minutes

**Priority:** HIGH - Foundation for everything else

---

## 🎯 Updated Implementation Plan

### Phase 0: Pre-Flight Checks (15 min)
```bash
# 1. Confirm backend is deployed
curl -X POST https://api.attra.io/api/internal/campaigns/{test-id}/generate-flyer \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"asset_type":"flyer","base_url":"https://test.com","location_ids":["test"]}'

# Expected: 200 OK or 404 (campaign not found)
# NOT Expected: 404 (endpoint not found) or 500

# 2. Check existing files
ls src/lib/campaign-api.ts   # Should exist
ls src/lib/location-api.ts   # Should exist
ls src/types/campaign.ts     # May or may not exist

# 3. Backup old wizard (optional)
cp src/pages/campaigns/New.tsx src/pages/campaigns/NewOld.tsx
```

---

### Phase 1: Foundation (45 min)

**Step 1.1: Types (15 min)**
- Check if `src/types/campaign.ts` exists
- If YES: Add new types, keep existing
- If NO: Create with all types from command file

**Step 1.2: API Client Updates (15 min)**
- Open `src/lib/campaign-api.ts`
- ADD `create()` function
- ADD `generateAssets()` function
- Keep existing functions

**Step 1.3: Hook (15 min)**
- Create `src/hooks/useCampaignWizard.ts`
- Copy from command file (no changes needed)

---

### Phase 2: Simple Steps (60 min)

**Step 2.1: Wizard Shell (15 min)**
- Create `src/pages/campaigns/New.tsx`
- Basic structure, progress bar, navigation
- Leave step content empty for now

**Step 2.2: Step 1 - Goal (10 min)**
- Create `src/components/campaigns/wizard/Step1Goal.tsx`
- Copy-paste from command file (works as-is)

**Step 2.3: Step 2 - Locations (15 min)**
- Create `src/components/campaigns/wizard/Step2Locations.tsx`
- ⚠️ CHANGE: Use `locationApi.list` instead of Supabase direct
- Test checkbox selection

**Step 2.4: Step 3 - Asset Type + Toggle (10 min)**
- Create `src/components/campaigns/wizard/Step3AssetType.tsx`
- Copy-paste from command file (works as-is)

**Step 2.5: Step 5 - Review (10 min)**
- Create `src/components/campaigns/wizard/Step5Review.tsx`
- Copy-paste from command file (works as-is)

---

### Phase 3: Complex Step (60 min)

**Step 3.1: Shared Design (30 min)**
- Create `src/components/campaigns/wizard/Step4DesignShared.tsx`
- Copy from command file
- Add form validation
- Test character counters

**Step 3.2: Per-Location Design (30 min)**
- Create `src/components/campaigns/wizard/Step4DesignPerLocation.tsx`
- ⚠️ CRITICAL: Fix state initialization (use useEffect)
- Test tab switching
- Test independent customization

---

### Phase 4: Integration (45 min)

**Step 4.1: Wire Up Main Component (20 min)**
- Complete `New.tsx` with all steps
- Add step routing logic
- Test navigation (next/prev)

**Step 4.2: API Integration (15 min)**
- Test campaign creation (step 1→2)
- Test asset generation (step 5)
- Verify both shared and per-location modes

**Step 4.3: Error Handling (10 min)**
- Toast messages for errors
- Loading states
- Validation feedback

---

### Phase 5: Polish (30 min)

**Step 5.1: Draft Loading (Optional) (15 min)**
- Add campaign draft loading
- Test refresh behavior

**Step 5.2: Edge Cases (15 min)**
- Test with 1 location
- Test with 10+ locations
- Test form validation
- Test character limits

---

## ⏱️ Total Time Estimate

```
Phase 0: Pre-Flight       15 min
Phase 1: Foundation       45 min
Phase 2: Simple Steps     60 min
Phase 3: Complex Step     60 min
Phase 4: Integration      45 min
Phase 5: Polish          30 min
-----------------------------------
Total:                   255 min = 4.25 hours

Realistic: 4.5 hours (with debugging)
```

---

## ✅ Pre-Implementation Checklist

**Before starting Phase 1:**

- [ ] Backend `/generate-flyer` endpoint confirmed deployed
- [ ] Tested endpoint with curl (returns 200 or 404, not 500)
- [ ] Located existing `campaign-api.ts` file
- [ ] Located existing `location-api.ts` file
- [ ] Checked if `types/campaign.ts` exists
- [ ] Decided: Replace old wizard or keep as backup?
- [ ] At least 2-3 test locations exist in account

---

## 🚨 Critical Fixes Summary

**Must fix before building:**

1. ✅ **Step2Locations.tsx** - Use `locationApi.list` not Supabase direct
2. ✅ **Step4DesignPerLocation.tsx** - Move state init to useEffect
3. ✅ **campaign-api.ts** - Add to existing file, don't create new
4. ✅ **types/campaign.ts** - Merge if exists, don't overwrite

**Optional but recommended:**

5. ⚠️ **Draft loading** - Add if time permits (15 min)

---

## 📝 Component Checklist

**Create these files:**

```
src/
├── types/
│   └── campaign.ts (update existing or create)
├── hooks/
│   └── useCampaignWizard.ts (new)
├── lib/
│   └── campaign-api.ts (update existing)
└── components/campaigns/wizard/
    ├── Step1Goal.tsx (new)
    ├── Step2Locations.tsx (new - use locationApi!)
    ├── Step3AssetType.tsx (new)
    ├── Step4DesignShared.tsx (new)
    ├── Step4DesignPerLocation.tsx (new - fix useEffect!)
    └── Step5Review.tsx (new)
```

**Update these files:**

```
src/pages/campaigns/New.tsx (replace or create new)
src/lib/campaign-api.ts (add 2 functions)
```

---

## 🎬 Ready to Build?

**Green Light Criteria:**

✅ Backend deployed and tested
✅ All 5 issues understood and solutions ready
✅ Existing files located (campaign-api, location-api)
✅ Types strategy decided (merge or create)
✅ 4-5 hour block available

**Start with:** Phase 1 (Foundation) - Get types and API client ready first!

---

## 💡 Pro Tips

1. **Build in order** - Don't skip steps, foundation matters
2. **Test as you go** - Don't wait until end to test
3. **Use console.log** - Log wizard state at each step to verify
4. **Keep old wizard** - Rename to NewOld.tsx as backup
5. **Commit frequently** - After each phase completes

---

**Ready?** Confirm these 3 things and start Phase 1:

1. ✅ Backend `/generate-flyer` endpoint is live
2. ✅ You have 4-5 hours available
3. ✅ You understand the 5 critical fixes

Good luck! 🚀
