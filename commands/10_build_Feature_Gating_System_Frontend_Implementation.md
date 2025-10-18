# Feature Gating System - Frontend Implementation

## Objective
Build the React/TypeScript frontend for Attra's feature gating system. This creates a beautiful FOMO-driven upgrade experience where locked features are visible but disabled, encouraging users to upgrade naturally.

## Dependencies
- Backend feature gating API (`23_build_feature_gating_backend.md`)
- React 18+
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- React Router
- Zustand or React Context for state management

---

## File Structure

```
src/
├── hooks/
│   ├── useFeatureGate.ts
│   ├── usePlanLimits.ts
│   └── usePlanData.ts
├── components/
│   ├── feature-gating/
│   │   ├── LockedFeature.tsx
│   │   ├── UpgradePrompt.tsx
│   │   ├── PlanUsageWidget.tsx
│   │   ├── FeatureBadge.tsx
│   │   └── PricingComparison.tsx
│   └── ui/
│       └── (shadcn components)
├── lib/
│   ├── data-masking.ts
│   ├── plan-utils.ts
│   └── api-client.ts
├── types/
│   └── billing.ts
└── pages/
    ├── Upgrade.tsx
    └── Pricing.tsx
```

---

## TypeScript Types

### `src/types/billing.ts`

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
}

export interface Feature {
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface FeatureAccessResult {
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

export interface PlanLimit {
  limitKey: string;
  limitValue: number | null;
  isUnlimited: boolean;
}
```

---

## API Client

### `src/lib/api-client.ts`

```typescript
import { Plan, FeatureAccessResult, PlanLimit } from '@/types/billing';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const planApi = {
  async getPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_BASE}/api/plans`);
    if (!response.ok) throw new Error('Failed to fetch plans');
    const data = await response.json();
    return data.plans;
  },

  async checkFeatureAccess(featureKey: string, token: string): Promise<FeatureAccessResult> {
    const response = await fetch(`${API_BASE}/api/features/${featureKey}/check`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to check feature access');
    return response.json();
  },

  async getPlanLimit(limitKey: string, token: string): Promise<PlanLimit> {
    const response = await fetch(`${API_BASE}/api/plans/limits/${limitKey}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to get plan limit');
    return response.json();
  }
};
```

---

## React Hooks

### `src/hooks/usePlanData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { planApi } from '@/lib/api-client';

export const usePlanData = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: planApi.getPlans,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};
```

### `src/hooks/useFeatureGate.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { planApi } from '@/lib/api-client';
import { PlanKey } from '@/types/billing';

export const useFeatureGate = (featureKey: string) => {
  const { user, token } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['feature-access', featureKey, user?.tenant?.id],
    queryFn: () => planApi.checkFeatureAccess(featureKey, token),
    enabled: !!token && !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    hasAccess: data?.hasAccess ?? false,
    requiredPlan: data?.requiredPlan as PlanKey | undefined,
    userPlan: data?.userPlan as PlanKey | undefined,
    upgradeUrl: data?.upgradeUrl,
    isLoading,
    feature: data?.feature,
  };
};
```

### `src/hooks/usePlanLimits.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { planApi } from '@/lib/api-client';

export const usePlanLimit = (limitKey: string) => {
  const { token } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['plan-limit', limitKey],
    queryFn: () => planApi.getPlanLimit(limitKey, token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  return {
    limitValue: data?.limitValue,
    isUnlimited: data?.isUnlimited ?? false,
    isLoading,
  };
};
```

---

## Utility Functions

### `src/lib/data-masking.ts`

```typescript
/**
 * Mask a name for display in free tier
 * "John Smith" → "J*** S****"
 */
export function maskName(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length === 0) return '';
    return part[0] + '*'.repeat(Math.max(part.length - 1, 3));
  }).join(' ');
}

/**
 * Mask an email for display in free tier
 * "john@example.com" → "j***@exa*****.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@*****.com';
  
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***';
  const maskedDomain = domain.slice(0, 3) + '*****' + domain.slice(-4);
  
  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a phone number
 * "555-123-4567" → "***-***-4567"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '***-***-****';
  
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}
```

### `src/lib/plan-utils.ts`

```typescript
import { PlanKey } from '@/types/billing';

const PLAN_HIERARCHY: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export function comparePlans(plan1: PlanKey, plan2: PlanKey): number {
  return PLAN_HIERARCHY[plan1] - PLAN_HIERARCHY[plan2];
}

export function canAccessFeature(userPlan: PlanKey, requiredPlan: PlanKey): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function formatPrice(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function getPlanColor(planKey: PlanKey): string {
  const colors: Record<PlanKey, string> = {
    free: 'text-gray-600',
    starter: 'text-blue-600',
    pro: 'text-purple-600',
    enterprise: 'text-orange-600',
  };
  return colors[planKey];
}
```

---

## Components

### `src/components/feature-gating/LockedFeature.tsx`

```tsx
import React from 'react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';
import { Loader2 } from 'lucide-react';

interface LockedFeatureProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export const LockedFeature: React.FC<LockedFeatureProps> = ({
  featureKey,
  children,
  fallback,
  loadingFallback,
}) => {
  const { hasAccess, isLoading, requiredPlan, upgradeUrl, feature } = useFeatureGate(featureKey);

  if (isLoading) {
    return loadingFallback || (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback || (
    <UpgradePrompt
      feature={feature?.name || featureKey}
      description={feature?.description}
      tier={requiredPlan!}
      upgradeUrl={upgradeUrl!}
    />
  );
};
```

### `src/components/feature-gating/UpgradePrompt.tsx`

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanKey } from '@/types/billing';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  tier: PlanKey;
  upgradeUrl: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  description,
  tier,
  upgradeUrl,
  size = 'md',
}) => {
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

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-center ${sizeClasses[size]}`}>
      <Lock className={`${iconSizes[size]} mx-auto mb-3 text-blue-500`} />
      <h3 className="text-lg font-semibold mb-2">
        {feature} Available in {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </h3>
      {description && (
        <p className="text-gray-600 text-sm mb-4">{description}</p>
      )}
      <p className="text-gray-600 mb-4">
        Upgrade to unlock this feature and grow faster
      </p>
      <Button asChild size={size === 'sm' ? 'sm' : 'default'}>
        <Link to={upgradeUrl} className="inline-flex items-center gap-2">
          Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};
```

### `src/components/feature-gating/PlanUsageWidget.tsx`

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimit } from '@/hooks/usePlanLimits';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface PlanUsageWidgetProps {
  limitKey: string;
  currentUsage: number;
  label: string;
}

export const PlanUsageWidget: React.FC<PlanUsageWidgetProps> = ({
  limitKey,
  currentUsage,
  label,
}) => {
  const { user } = useAuth();
  const { limitValue, isUnlimited } = usePlanLimit(limitKey);

  if (isUnlimited) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-sm text-green-700">
          ✓ Unlimited {label}
        </p>
      </div>
    );
  }

  if (!limitValue) return null;

  const percentage = (currentUsage / limitValue) * 100;
  const isWarning = percentage > 80;
  const isExceeded = currentUsage >= limitValue;

  return (
    <div className={`p-4 border rounded ${
      isExceeded ? 'bg-red-50 border-red-200' : 
      isWarning ? 'bg-yellow-50 border-yellow-200' : 
      'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          {currentUsage.toLocaleString()} / {limitValue.toLocaleString()} {label}
        </span>
        <span className="text-sm font-semibold">
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <Progress 
        value={Math.min(percentage, 100)} 
        className={isExceeded ? 'bg-red-200' : isWarning ? 'bg-yellow-200' : 'bg-gray-200'}
      />
      
      {isWarning && (
        <div className="flex items-center gap-2 mt-3">
          <AlertTriangle className={`w-4 h-4 ${isExceeded ? 'text-red-600' : 'text-yellow-600'}`} />
          <p className={`text-sm ${isExceeded ? 'text-red-700' : 'text-yellow-700'}`}>
            {isExceeded ? (
              <>You've reached your limit. <Link to="/upgrade" className="underline font-medium">Upgrade now</Link></>
            ) : (
              <>You're almost at your limit. <Link to="/upgrade" className="underline font-medium">Upgrade now</Link></>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
```

### `src/components/feature-gating/FeatureBadge.tsx`

```tsx
import React from 'react';
import { Lock } from 'lucide-react';
import { PlanKey } from '@/types/billing';
import { getPlanColor } from '@/lib/plan-utils';

interface FeatureBadgeProps {
  planKey: PlanKey;
  size?: 'sm' | 'md';
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({ 
  planKey, 
  size = 'sm' 
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gray-100 ${sizeClasses} ${getPlanColor(planKey)}`}>
      <Lock className={iconSize} />
      {planKey.charAt(0).toUpperCase() + planKey.slice(1)}
    </span>
  );
};
```

### `src/components/feature-gating/PricingComparison.tsx`

```tsx
import React from 'react';
import { Check, X } from 'lucide-react';
import { usePlanData } from '@/hooks/usePlanData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/plan-utils';
import { Link } from 'react-router-dom';

export const PricingComparison: React.FC = () => {
  const { data: plans, isLoading } = usePlanData();
  const { user } = useAuth();

  if (isLoading || !plans) {
    return <div>Loading pricing...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = user?.tenant?.plan_key === plan.key;
        
        return (
          <div 
            key={plan.key}
            className={`border rounded-lg p-6 ${
              isCurrentPlan ? 'border-blue-500 shadow-lg' : 'border-gray-200'
            }`}
          >
            {isCurrentPlan && (
              <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded mb-4">
                Current Plan
              </span>
            )}
            
            <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {plan.pricing.monthly === 0 ? 'Free' : formatPrice(plan.pricing.monthly * 100)}
              </span>
              {plan.pricing.monthly > 0 && (
                <span className="text-gray-600">/month</span>
              )}
            </div>

            {!isCurrentPlan && (
              <Button asChild className="w-full mb-6">
                <Link to={`/upgrade?to=${plan.key}`}>
                  {plan.pricing.monthly === 0 ? 'Get Started' : 'Upgrade'}
                </Link>
              </Button>
            )}

            <div className="space-y-2">
              {plan.featuresSummary.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

---

## Usage Examples

### Example 1: Lock Contact List

```tsx
// pages/Contacts.tsx
import { LockedFeature } from '@/components/feature-gating/LockedFeature';
import { maskName, maskEmail } from '@/lib/data-masking';
import { useAuth } from '@/hooks/useAuth';

export const ContactsPage = () => {
  const { user } = useAuth();
  const contacts = useContacts();
  
  return (
    <div>
      <h1>Contacts</h1>
      
      <LockedFeature featureKey="view_all_contacts">
        {/* Full contact list - only visible to Starter+ */}
        <ContactTable contacts={contacts} showFullDetails />
      </LockedFeature>
      
      {/* Free tier: Show limited, blurred contacts */}
      {user?.tenant?.plan_key === 'free' && (
        <div className="space-y-2">
          {contacts.slice(0, 10).map((contact) => (
            <div key={contact.id} className="p-4 border rounded">
              <p className="font-semibold">{maskName(contact.name)}</p>
              <p className="text-gray-600">{maskEmail(contact.email)}</p>
            </div>
          ))}
          <div className="text-center text-gray-600 mt-4">
            {contacts.length > 10 && (
              <p>+ {contacts.length - 10} more contacts</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Example 2: Lock Map View

```tsx
// pages/Dashboard.tsx
import { LockedFeature } from '@/components/feature-gating/LockedFeature';
import { MapView } from '@/components/MapView';

export const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <LockedFeature featureKey="map_view">
        <MapView />
      </LockedFeature>
    </div>
  );
};
```

### Example 3: Disabled Button with Tooltip

```tsx
// components/EmailButton.tsx
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

export const SendEmailButton = () => {
  const { hasAccess, requiredPlan } = useFeatureGate('email_sending');
  
  return (
    <Tooltip 
      content={!hasAccess ? `Upgrade to ${requiredPlan} to send emails` : undefined}
    >
      <div>
        <Button 
          disabled={!hasAccess}
          className="relative"
        >
          {!hasAccess && <Lock className="w-4 h-4 mr-2" />}
          Send Email
        </Button>
      </div>
    </Tooltip>
  );
};
```

### Example 4: Usage Tracking Widget

```tsx
// pages/Dashboard.tsx
import { PlanUsageWidget } from '@/components/feature-gating/PlanUsageWidget';
import { useContacts } from '@/hooks/useContacts';

export const Dashboard = () => {
  const { contacts } = useContacts();
  const monthlyContacts = contacts.filter(c => 
    new Date(c.created_at) > startOfMonth(new Date())
  ).length;
  
  return (
    <div>
      <PlanUsageWidget
        limitKey="contacts_per_month"
        currentUsage={monthlyContacts}
        label="contacts this month"
      />
    </div>
  );
};
```

---

## Acceptance Criteria

- [ ] `useFeatureGate` hook checks access correctly
- [ ] `usePlanLimit` hook fetches limits correctly
- [ ] `LockedFeature` component renders upgrade prompt when locked
- [ ] `UpgradePrompt` displays correct tier and upgrade link
- [ ] `PlanUsageWidget` shows progress bars and warnings
- [ ] Data masking functions work (names, emails, phones)
- [ ] All components are TypeScript strict mode compliant
- [ ] Components use Shadcn/ui primitives
- [ ] Responsive design works on mobile
- [ ] Loading states handled gracefully
- [ ] Error states handled gracefully
- [ ] Feature checks cached appropriately (5 min TTL)

---

## Styling Notes

All components use Tailwind classes and follow these patterns:

- Locked features: `bg-gradient-to-r from-blue-50 to-purple-50`
- Warning states: `bg-yellow-50 border-yellow-200`
- Error/exceeded states: `bg-red-50 border-red-200`
- Success states: `bg-green-50 border-green-200`
- Icons: Lucide React icons
- Animations: Tailwind transitions

---

## Performance Optimizations

1. **Query caching** - Feature checks cached for 5 minutes
2. **Memoization** - Use React.memo for expensive components
3. **Lazy loading** - Code split pricing page
4. **Debouncing** - Debounce usage tracking updates

---

## Estimated Build Time

**6-8 hours**

## Priority

**High** - Required for pricing model UI
