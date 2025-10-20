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
