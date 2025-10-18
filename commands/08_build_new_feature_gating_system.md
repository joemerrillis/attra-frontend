# 08_build_feature_gating_system.md

## 🎯 Goal

Build a complete, production-ready feature gating system for Attra's FOMO-driven upgrade experience. This is the **monetization infrastructure** - a centralized library of hooks, components, and utilities that make locked features visible but disabled, creating natural desire to upgrade. Every paywall in the app will use this system for consistency and maintainability.

**Timeline:** 8-10 hours  
**Priority:** CRITICAL - Revenue infrastructure

---

## 📋 Prerequisites

- ✅ Backend feature gating API deployed (`12_Feature_Gating_System_Backend_Implementation.md`)
- ✅ `billing.plans` table seeded with pricing tiers
- ✅ `billing.feature_gates` table configured
- ✅ `billing.plan_limits` table with usage caps
- ✅ Auth system working (tenant has `plan_key`)

---

## 🧭 Philosophy

**"Show, don't hide. Tease, don't block. Upgrade, don't paywall."**

This system creates **positive friction** - users see what they're missing, understand the value, and choose to upgrade naturally. Every locked feature includes:
- ✅ **Context** - What the feature does
- ✅ **Value** - Why they need it
- ✅ **Path** - Clear upgrade CTA
- ✅ **Transparency** - Honest about what's locked

---

## 🗂️ Complete File Structure

```
src/
├── types/
│   └── billing.ts                       (TypeScript types for plans)
├── lib/
│   ├── api/
│   │   └── plans-api.ts                 (API client for feature checks)
│   ├── data-masking.ts                  (Mask emails, phones, names)
│   └── plan-utils.ts                    (Plan hierarchy, formatting)
├── hooks/
│   ├── useFeatureGate.ts                (Check feature access)
│   ├── usePlanLimit.ts                  (Check usage limits)
│   ├── usePlanData.ts                   (Fetch all plans)
│   └── useCurrentPlan.ts                (Get user's current plan)
├── components/
│   └── feature-gating/
│       ├── LockedFeature.tsx            (Wrapper for gated features)
│       ├── UpgradePrompt.tsx            (Generic upgrade card)
│       ├── PlanUsageWidget.tsx          (Usage progress bar)
│       ├── FeatureBadge.tsx             (Small plan badges)
│       ├── PricingComparison.tsx        (Full pricing grid)
│       └── UpgradeDialog.tsx            (Modal upgrade flow)
└── pages/
    ├── Upgrade.tsx                      (Dedicated upgrade page)
    └── Pricing.tsx                      (Public pricing page)
```

---

## 🎨 Implementation

### Step 1: TypeScript Types

**File:** `src/types/billing.ts`

```typescript
export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Plan {
  key: PlanKey;
  name: string;
  displayName: string;
  description: string;
  pricing: {
    monthly: number;
    yearly: number | null;
    currency: string;
  };
  limits: Record<string, number | null>;
  features: Feature[];
  featuresSummary: string[];
  tierLevel: number;
}

export interface Feature {
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface FeatureAccessCheck {
  hasAccess: boolean;
  userPlan: PlanKey;
  requiredPlan: PlanKey;
  feature: {
    key: string;
    name: string;
    description: string;
  };
  upgradeUrl: string | null;
}

export interface PlanLimitCheck {
  limitKey: string;
  limitValue: number | null;
  isUnlimited: boolean;
}

export interface UsageStatus {
  current: number;
  limit: number | null;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
  isUnlimited: boolean;
}
```

---

### Step 2: API Client

**File:** `src/lib/api/plans-api.ts`

```typescript
import { Plan, FeatureAccessCheck, PlanLimitCheck } from '@/types/billing';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class PlansApiClient {
  /**
   * Fetch all available pricing plans
   */
  async getPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_BASE}/plans`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }
    
    const data = await response.json();
    return data.plans;
  }

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(
    featureKey: string,
    token: string
  ): Promise<FeatureAccessCheck> {
    const response = await fetch(
      `${API_BASE}/features/${featureKey}/check`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to check feature access');
    }
    
    return response.json();
  }

  /**
   * Get plan limit for a specific limit key
   */
  async getPlanLimit(
    limitKey: string,
    token: string
  ): Promise<PlanLimitCheck> {
    const response = await fetch(
      `${API_BASE}/plans/limits/${limitKey}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to get plan limit');
    }
    
    return response.json();
  }
}

export const plansApi = new PlansApiClient();
```

---

### Step 3: Utility Functions

**File:** `src/lib/data-masking.ts`

```typescript
/**
 * Mask a name for free tier display
 * "John Smith" → "J*** S****"
 */
export function maskName(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  return parts
    .map(part => {
      if (part.length === 0) return '';
      return part[0] + '•'.repeat(Math.max(part.length - 1, 3));
    })
    .join(' ');
}

/**
 * Mask an email address
 * "john@example.com" → "j•••@exa••••.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '•••@••••.com';
  
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '•'.repeat(Math.min(local.length - 1, 3));
  
  const domainParts = domain.split('.');
  const maskedDomain = domainParts
    .map((part, i) => {
      if (i === domainParts.length - 1) return part; // Keep TLD
      return part.slice(0, 3) + '•'.repeat(Math.max(part.length - 3, 2));
    })
    .join('.');
  
  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a phone number
 * "(555) 123-4567" → "•••-•••-4567"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '•••-•••-••••';
  
  // Extract digits only
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 4) return '•••-•••-••••';
  
  const last4 = digits.slice(-4);
  return `•••-•••-${last4}`;
}

/**
 * Format contact data with masking based on access level
 */
export function formatContactForDisplay(
  contact: any,
  hasAccess: boolean
) {
  if (hasAccess) {
    return {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      masked: false,
    };
  }
  
  return {
    name: contact.name, // Name always visible
    email: maskEmail(contact.email),
    phone: maskPhone(contact.phone),
    masked: true,
  };
}
```

**File:** `src/lib/plan-utils.ts`

```typescript
import type { PlanKey, Plan } from '@/types/billing';

/**
 * Plan hierarchy for comparison
 */
const PLAN_HIERARCHY: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Compare two plans by tier level
 */
export function comparePlans(plan1: PlanKey, plan2: PlanKey): number {
  return PLAN_HIERARCHY[plan1] - PLAN_HIERARCHY[plan2];
}

/**
 * Check if user plan can access a required plan's features
 */
export function canAccessFeature(
  userPlan: PlanKey,
  requiredPlan: PlanKey
): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Format price in cents to currency string
 */
export function formatPrice(
  cents: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Get consistent color class for plan badges
 */
export function getPlanColor(planKey: PlanKey): string {
  const colors: Record<PlanKey, string> = {
    free: 'text-gray-600 bg-gray-100',
    starter: 'text-blue-600 bg-blue-100',
    pro: 'text-purple-600 bg-purple-100',
    enterprise: 'text-orange-600 bg-orange-100',
  };
  return colors[planKey] || colors.free;
}

/**
 * Get plan display name with proper casing
 */
export function getPlanDisplayName(planKey: PlanKey): string {
  return planKey.charAt(0).toUpperCase() + planKey.slice(1);
}

/**
 * Calculate usage percentage and status
 */
export function calculateUsageStatus(
  current: number,
  limit: number | null
): {
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
  isUnlimited: boolean;
} {
  if (limit === null) {
    return {
      percentage: 0,
      isWarning: false,
      isExceeded: false,
      isUnlimited: true,
    };
  }
  
  const percentage = (current / limit) * 100;
  
  return {
    percentage: Math.min(percentage, 100),
    isWarning: percentage > 80,
    isExceeded: current >= limit,
    isUnlimited: false,
  };
}

/**
 * Sort plans by tier level
 */
export function sortPlansByTier(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => a.tierLevel - b.tierLevel);
}
```

---

### Step 4: Core Hooks

**File:** `src/hooks/useFeatureGate.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { plansApi } from '@/lib/api/plans-api';
import type { PlanKey } from '@/types/billing';

interface UseFeatureGateResult {
  hasAccess: boolean;
  isLoading: boolean;
  requiredPlan?: PlanKey;
  userPlan?: PlanKey;
  upgradeUrl?: string;
  feature?: {
    key: string;
    name: string;
    description: string;
  };
}

/**
 * Check if user has access to a specific feature
 * 
 * @example
 * const { hasAccess, upgradeUrl } = useFeatureGate('map_view');
 * if (!hasAccess) return <UpgradePrompt upgradeUrl={upgradeUrl} />;
 */
export function useFeatureGate(featureKey: string): UseFeatureGateResult {
  const { user, token } = useAuth();
  
  const query = useQuery({
    queryKey: ['feature-access', featureKey, user?.tenant?.id],
    queryFn: () => plansApi.checkFeatureAccess(featureKey, token!),
    enabled: !!token && !!user?.tenant?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
  
  return {
    hasAccess: query.data?.hasAccess ?? false,
    isLoading: query.isLoading,
    requiredPlan: query.data?.requiredPlan,
    userPlan: query.data?.userPlan,
    upgradeUrl: query.data?.upgradeUrl ?? undefined,
    feature: query.data?.feature,
  };
}
```

**File:** `src/hooks/usePlanLimit.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { plansApi } from '@/lib/api/plans-api';

interface UsePlanLimitResult {
  limitValue: number | null;
  isUnlimited: boolean;
  isLoading: boolean;
}

/**
 * Get the limit value for a specific limit key on user's current plan
 * 
 * @example
 * const { limitValue, isUnlimited } = usePlanLimit('contacts_per_month');
 * // limitValue: 1000 (or null if unlimited)
 */
export function usePlanLimit(limitKey: string): UsePlanLimitResult {
  const { token } = useAuth();
  
  const query = useQuery({
    queryKey: ['plan-limit', limitKey],
    queryFn: () => plansApi.getPlanLimit(limitKey, token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  return {
    limitValue: query.data?.limitValue ?? null,
    isUnlimited: query.data?.isUnlimited ?? false,
    isLoading: query.isLoading,
  };
}
```

**File:** `src/hooks/usePlanData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '@/lib/api/plans-api';
import { sortPlansByTier } from '@/lib/plan-utils';
import type { Plan } from '@/types/billing';

interface UsePlanDataResult {
  plans: Plan[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch all available pricing plans
 * Used for pricing pages and upgrade flows
 * 
 * @example
 * const { plans, isLoading } = usePlanData();
 */
export function usePlanData(): UsePlanDataResult {
  const query = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.getPlans,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
  
  return {
    plans: query.data ? sortPlansByTier(query.data) : [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
```

**File:** `src/hooks/useCurrentPlan.ts`

```typescript
import { useAuth } from '@/hooks/useAuth';
import type { PlanKey } from '@/types/billing';

interface UseCurrentPlanResult {
  planKey: PlanKey;
  isLoading: boolean;
}

/**
 * Get user's current plan key
 * 
 * @example
 * const { planKey } = useCurrentPlan();
 * // planKey: 'free' | 'starter' | 'pro' | 'enterprise'
 */
export function useCurrentPlan(): UseCurrentPlanResult {
  const { user, isLoading } = useAuth();
  
  return {
    planKey: (user?.tenant?.plan_key as PlanKey) || 'free',
    isLoading,
  };
}
```

---

### Step 5: Core Components

**File:** `src/components/feature-gating/LockedFeature.tsx`

```typescript
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

interface LockedFeatureProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  showPrompt?: boolean;
}

/**
 * Wrapper component that shows children only if user has feature access
 * Shows upgrade prompt by default when locked
 * 
 * @example
 * <LockedFeature featureKey="map_view">
 *   <MapComponent />
 * </LockedFeature>
 */
export function LockedFeature({
  featureKey,
  children,
  fallback,
  loadingFallback,
  showPrompt = true,
}: LockedFeatureProps) {
  const {
    hasAccess,
    isLoading,
    requiredPlan,
    upgradeUrl,
    feature,
  } = useFeatureGate(featureKey);
  
  // Show loading state
  if (isLoading) {
    return (
      loadingFallback || (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }
  
  // User has access - show children
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // User doesn't have access - show fallback or prompt
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showPrompt && requiredPlan && upgradeUrl) {
    return (
      <UpgradePrompt
        featureName={feature?.name || featureKey}
        description={feature?.description}
        requiredPlan={requiredPlan}
        upgradeUrl={upgradeUrl}
      />
    );
  }
  
  return null;
}
```

**File:** `src/components/feature-gating/UpgradePrompt.tsx`

```typescript
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { getPlanDisplayName } from '@/lib/plan-utils';
import type { PlanKey } from '@/types/billing';

interface UpgradePromptProps {
  featureName: string;
  description?: string;
  requiredPlan: PlanKey;
  upgradeUrl: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'card' | 'inline';
}

/**
 * Generic upgrade prompt for locked features
 * 
 * @example
 * <UpgradePrompt
 *   featureName="Real-Time Map"
 *   requiredPlan="pro"
 *   upgradeUrl="/upgrade?feature=realtime_map"
 * />
 */
export function UpgradePrompt({
  featureName,
  description,
  requiredPlan,
  upgradeUrl,
  size = 'md',
  variant = 'card',
}: UpgradePromptProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  const content = (
    <div className={`text-center ${sizeClasses[size]}`}>
      <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
        <Lock className={`${iconSizes[size]} text-primary`} />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        {featureName}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-1">
        Available in {getPlanDisplayName(requiredPlan)}
      </p>
      
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <Button asChild size={size === 'sm' ? 'sm' : 'default'}>
          <Link to={upgradeUrl} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Upgrade to {getPlanDisplayName(requiredPlan)}
          </Link>
        </Button>
        
        <Button
          variant="outline"
          asChild
          size={size === 'sm' ? 'sm' : 'default'}
        >
          <Link to="/pricing" className="gap-2">
            View All Plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
  
  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        {content}
      </div>
    );
  }
  
  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
}
```

**File:** `src/components/feature-gating/PlanUsageWidget.tsx`

```typescript
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanLimit } from '@/hooks/usePlanLimit';
import { calculateUsageStatus } from '@/lib/plan-utils';

interface PlanUsageWidgetProps {
  limitKey: string;
  currentUsage: number;
  label: string;
  showCard?: boolean;
}

/**
 * Display usage progress bar with warnings
 * 
 * @example
 * <PlanUsageWidget
 *   limitKey="contacts_per_month"
 *   currentUsage={750}
 *   label="contacts this month"
 * />
 */
export function PlanUsageWidget({
  limitKey,
  currentUsage,
  label,
  showCard = false,
}: PlanUsageWidgetProps) {
  const { limitValue, isUnlimited, isLoading } = usePlanLimit(limitKey);
  
  if (isLoading) {
    return null;
  }
  
  const status = calculateUsageStatus(currentUsage, limitValue);
  
  // Unlimited plan
  if (status.isUnlimited) {
    const content = (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <span>Unlimited {label}</span>
      </div>
    );
    
    return showCard ? (
      <Card>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    ) : content;
  }
  
  // Has limit
  const colorClasses = status.isExceeded
    ? 'bg-red-50 border-red-200'
    : status.isWarning
    ? 'bg-yellow-50 border-yellow-200'
    : 'bg-gray-50 border-gray-200';
  
  const textColorClasses = status.isExceeded
    ? 'text-red-700'
    : status.isWarning
    ? 'text-yellow-700'
    : 'text-muted-foreground';
  
  const content = (
    <div className={`border rounded-lg p-4 ${colorClasses}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          {currentUsage.toLocaleString()} / {limitValue?.toLocaleString()} {label}
        </span>
        <span className="text-sm font-semibold">
          {status.percentage.toFixed(0)}%
        </span>
      </div>
      
      <Progress
        value={status.percentage}
        className="h-2"
      />
      
      {status.isWarning && (
        <div className="flex items-start gap-2 mt-3">
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${textColorClasses}`} />
          <p className={`text-sm ${textColorClasses}`}>
            {status.isExceeded ? (
              <>
                You've reached your limit.{' '}
                <Link to="/upgrade" className="underline font-medium">
                  Upgrade now
                </Link>
              </>
            ) : (
              <>
                You're almost at your limit.{' '}
                <Link to="/upgrade" className="underline font-medium">
                  Upgrade for more
                </Link>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
  
  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }
  
  return content;
}
```

**File:** `src/components/feature-gating/FeatureBadge.tsx`

```typescript
import { Lock } from 'lucide-react';
import { getPlanColor, getPlanDisplayName } from '@/lib/plan-utils';
import type { PlanKey } from '@/types/billing';

interface FeatureBadgeProps {
  planKey: PlanKey;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

/**
 * Small badge showing which plan a feature requires
 * 
 * @example
 * <FeatureBadge planKey="pro" size="sm" />
 */
export function FeatureBadge({
  planKey,
  size = 'sm',
  showIcon = true,
}: FeatureBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${getPlanColor(planKey)}`}
    >
      {showIcon && <Lock className={iconSize} />}
      {getPlanDisplayName(planKey)}
    </span>
  );
}
```

**File:** `src/components/feature-gating/PricingComparison.tsx`

```typescript
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { usePlanData } from '@/hooks/usePlanData';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { formatPrice } from '@/lib/plan-utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PricingComparisonProps {
  highlightPlan?: string;
}

/**
 * Full pricing grid comparing all plans
 * 
 * @example
 * <PricingComparison highlightPlan="pro" />
 */
export function PricingComparison({ highlightPlan }: PricingComparisonProps) {
  const { plans, isLoading } = usePlanData();
  const { planKey: currentPlan } = useCurrentPlan();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-24 mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlan === plan.key;
        const isHighlighted = highlightPlan === plan.key;
        const isPro = plan.key === 'pro';
        
        return (
          <Card
            key={plan.key}
            className={`relative ${
              isHighlighted || isPro
                ? 'border-primary shadow-lg scale-105'
                : isCurrentPlan
                ? 'border-green-500'
                : ''
            }`}
          >
            {(isHighlighted || isPro) && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="space-y-2">
                {isCurrentPlan && (
                  <Badge variant="outline" className="w-fit">
                    Current Plan
                  </Badge>
                )}
                
                <h3 className="text-2xl font-bold">{plan.displayName}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div>
                {plan.pricing.monthly === 0 ? (
                  <div className="text-4xl font-bold">Free</div>
                ) : (
                  <>
                    <div className="text-4xl font-bold">
                      {formatPrice(plan.pricing.monthly)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per month
                    </div>
                    {plan.pricing.yearly && (
                      <div className="text-xs text-muted-foreground mt-1">
                        or {formatPrice(plan.pricing.yearly)}/year
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* CTA Button */}
              {isCurrentPlan ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={`/upgrade?plan=${plan.key}`}>
                    {plan.key === 'free' ? 'Get Started' : 'Upgrade Now'}
                  </Link>
                </Button>
              )}
              
              {/* Features List */}
              <div className="space-y-3 pt-4 border-t">
                {plan.featuresSummary.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

---

### Step 6: Pages

**File:** `src/pages/Upgrade.tsx`

```typescript
import { useSearchParams } from 'react-router-dom';
import { PricingComparison } from '@/components/feature-gating/PricingComparison';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function UpgradePage() {
  const [searchParams] = useSearchParams();
  const feature = searchParams.get('feature');
  const plan = searchParams.get('plan');
  
  return (
    <div className="container py-12 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Upgrade Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get more features, higher limits, and unlock the full power of Attra
        </p>
      </div>
      
      {/* Feature-specific message */}
      {feature && (
        <Alert className="mb-8 max-w-2xl mx-auto">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Unlock <strong>{feature.replace(/_/g, ' ')}</strong> by upgrading your plan
          </AlertDescription>
        </Alert>
      )}
      
      {/* Pricing Grid */}
      <PricingComparison highlightPlan={plan || 'pro'} />
      
      {/* FAQ or additional info */}
      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>All plans include a 14-day money-back guarantee.</p>
        <p className="mt-2">
          Questions?{' '}
          <a href="mailto:support@attra.io" className="underline">
            Contact our team
          </a>
        </p>
      </div>
    </div>
  );
}
```

**File:** `src/pages/Pricing.tsx`

```typescript
import { PricingComparison } from '@/components/feature-gating/PricingComparison';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="container py-12 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Start free, upgrade as you grow. No hidden fees, cancel anytime.
        </p>
        <Button asChild size="lg">
          <Link to="/signup" className="gap-2">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      {/* Pricing Grid */}
      <PricingComparison />
      
      {/* Feature Comparison Table */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold text-center mb-8">
          Compare Features
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Feature</th>
                <th className="text-center p-4">Free</th>
                <th className="text-center p-4">Starter</th>
                <th className="text-center p-4 bg-primary/5">Pro</th>
                <th className="text-center p-4">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <FeatureRow
                feature="Campaigns & QR Codes"
                free={true}
                starter={true}
                pro={true}
                enterprise={true}
              />
              <FeatureRow
                feature="Scan Tracking"
                free="Unlimited"
                starter="Unlimited"
                pro="Unlimited"
                enterprise="Unlimited"
              />
              <FeatureRow
                feature="Contact Capture"
                free="Unlimited"
                starter="Unlimited"
                pro="Unlimited"
                enterprise="Unlimited"
              />
              <FeatureRow
                feature="View Contacts"
                free="Last 10"
                starter="All"
                pro="All"
                enterprise="All"
              />
              <FeatureRow
                feature="Map View"
                free={false}
                starter={true}
                pro={true}
                enterprise={true}
              />
              <FeatureRow
                feature="Real-Time Updates"
                free={false}
                starter={false}
                pro={true}
                enterprise={true}
              />
              <FeatureRow
                feature="Gmail Integration"
                free={false}
                starter={false}
                pro={true}
                enterprise={true}
              />
              <FeatureRow
                feature="API Access"
                free={false}
                starter={false}
                pro={false}
                enterprise={true}
              />
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FAQ */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <FAQItem
            question="Can I change plans anytime?"
            answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
          />
          <FAQItem
            question="What happens if I exceed my limits?"
            answer="You'll see a notification when you're approaching your limit. You can upgrade anytime to increase your limits, or wait until your monthly cycle resets."
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked."
          />
          <FAQItem
            question="Is there a contract or commitment?"
            answer="No contracts required. Pay month-to-month and cancel anytime. Annual plans offer better value but are also cancellable."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  free,
  starter,
  pro,
  enterprise,
}: {
  feature: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}) {
  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }
    return <span className="text-sm">{value}</span>;
  };
  
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4 font-medium">{feature}</td>
      <td className="p-4 text-center">{renderCell(free)}</td>
      <td className="p-4 text-center">{renderCell(starter)}</td>
      <td className="p-4 text-center bg-primary/5">{renderCell(pro)}</td>
      <td className="p-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-6 last:border-0">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
```

---

## ✅ Acceptance Criteria

### Hooks
- [ ] `useFeatureGate()` checks access and returns upgrade URL
- [ ] `usePlanLimit()` fetches limits with 5min cache
- [ ] `usePlanData()` fetches all plans for pricing pages
- [ ] `useCurrentPlan()` returns user's plan key
- [ ] All hooks handle loading/error states

### Components
- [ ] `<LockedFeature>` shows children only if has access
- [ ] `<UpgradePrompt>` displays feature name, required plan, CTA
- [ ] `<PlanUsageWidget>` shows progress bar with warnings
- [ ] `<FeatureBadge>` displays small plan badges
- [ ] `<PricingComparison>` renders all plans in grid
- [ ] All components are TypeScript strict compliant
- [ ] All components use Shadcn/ui primitives

### Utilities
- [ ] Data masking functions work correctly
- [ ] Plan comparison logic accurate
- [ ] Price formatting consistent
- [ ] Usage calculation handles edge cases

### Pages
- [ ] `/upgrade` page shows pricing with optional feature highlight
- [ ] `/pricing` page shows full comparison table
- [ ] Both pages are mobile responsive
- [ ] CTAs link to correct destinations

### Integration
- [ ] Works with backend feature gates API
- [ ] Caches responses appropriately
- [ ] Handles authentication errors
- [ ] Shows loading states during checks

---

## 🧪 Manual Testing Script

### Test 1: Feature Gate Check
1. Log in as free tier user
2. Navigate to dashboard
3. **Expected:** Map shows upgrade prompt (uses `<LockedFeature>`)
4. Open DevTools → Network → See `/api/features/map_view/check` call
5. **Expected:** Response shows `hasAccess: false`, `requiredPlan: 'starter'`

### Test 2: Usage Widget
1. Create 800 contacts (or mock data)
2. View dashboard with `<PlanUsageWidget limitKey="contacts_per_month" currentUsage={800} />`
3. **Expected:** Yellow warning bar at 80%
4. Create 200 more contacts (1000 total)
5. **Expected:** Red exceeded bar at 100% with upgrade link

### Test 3: Pricing Page
1. Visit `/pricing` while logged out
2. **Expected:** All 4 plans visible in grid
3. **Expected:** "Pro" plan has "Most Popular" badge
4. **Expected:** Feature comparison table shows checkmarks correctly
5. Click "Get Started" on Free plan
6. **Expected:** Redirects to `/signup`

### Test 4: Upgrade Flow
1. Log in as free tier
2. Visit `/upgrade?feature=map_view`
3. **Expected:** Alert shows "Unlock map view by upgrading"
4. **Expected:** Starter plan highlighted (since it unlocks map_view)
5. Click "Upgrade to Starter"
6. **Expected:** (Stripe integration would trigger here)

### Test 5: Data Masking
1. Log in as free tier
2. View contacts list
3. **Expected:** Email shows `j•••@exa••••.com`
4. **Expected:** Phone shows `•••-•••-4567`
5. **Expected:** Name fully visible (not masked)
6. Upgrade to Starter
7. **Expected:** All fields now visible

---

## 🎯 Usage Examples

### Example 1: Lock a Feature
```typescript
import { LockedFeature } from '@/components/feature-gating/LockedFeature';

<LockedFeature featureKey="map_view">
  <MapComponent />
</LockedFeature>
```

### Example 2: Show Usage Progress
```typescript
import { PlanUsageWidget } from '@/components/feature-gating/PlanUsageWidget';

const contactsThisMonth = contacts.filter(/* this month */).length;

<PlanUsageWidget
  limitKey="contacts_per_month"
  currentUsage={contactsThisMonth}
  label="contacts this month"
  showCard
/>
```

### Example 3: Conditional Rendering
```typescript
const { hasAccess } = useFeatureGate('email_sending');

<Button disabled={!hasAccess}>
  {hasAccess ? 'Send Email' : '🔒 Unlock Email Sending'}
</Button>
```

### Example 4: Mask Data
```typescript
import { formatContactForDisplay } from '@/lib/data-masking';
import { useFeatureGate } from '@/hooks/useFeatureGate';

const { hasAccess } = useFeatureGate('contact_details');
const display = formatContactForDisplay(contact, hasAccess);

<div>
  <p>{display.name}</p>
  <p>{display.email}</p> {/* Masked if !hasAccess */}
</div>
```

---

## 📝 Migration Notes

**Files 06 and 07 currently have inline implementations.** After file 08 is built:

1. **File 06 (Contacts) should import:**
   - `useFeatureGate` from `@/hooks/useFeatureGate`
   - `formatContactForDisplay` from `@/lib/data-masking`
   - `UpgradePrompt` from `@/components/feature-gating/UpgradePrompt`

2. **File 07 (Dashboard) should import:**
   - `useFeatureGate` from `@/hooks/useFeatureGate`
   - `LockedFeature` from `@/components/feature-gating/LockedFeature`

3. **Remove duplicate implementations** from both files

---

## ✅ Completion Checklist

Before marking this file as complete:

- [ ] All TypeScript types defined
- [ ] API client created with all methods
- [ ] All utility functions implemented and tested
- [ ] All 4 core hooks created
- [ ] All 5 components built and styled
- [ ] `/upgrade` page functional
- [ ] `/pricing` page with comparison table
- [ ] All components use Shadcn/ui
- [ ] Mobile responsive on all breakpoints
- [ ] Loading states handled
- [ ] Error states handled
- [ ] All acceptance criteria met
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Git commit made with descriptive message

---

**File Complete:** This is a production-ready, executable command file.  
**Claude Code:** Execute each step in sequence. Do not skip steps.  
**Result:** Complete feature gating infrastructure powering FOMO-driven upgrades across the entire application.
