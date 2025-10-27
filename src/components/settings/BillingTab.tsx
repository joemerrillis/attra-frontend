import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { usePlanData } from '@/hooks/usePlanData';
import { formatPrice } from '@/lib/plan-utils';
import { FeatureBadge } from '@/components/feature-gating/FeatureBadge';
import { Sparkles, Check, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BillingTab() {
  const navigate = useNavigate();
  const { planKey: currentPlan, isLoading: isLoadingCurrentPlan } = useCurrentPlan();
  const { plans, isLoading: isLoadingPlans } = usePlanData();

  if (isLoadingCurrentPlan || isLoadingPlans) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Subscription</CardTitle>
          <CardDescription>Loading your plan details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlanData = plans.find(p => p.key === currentPlan);
  const canUpgrade = currentPlan === 'free';

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <FeatureBadge planKey={currentPlan} size="md" />
              {currentPlanData && (
                <p className="text-sm text-muted-foreground">
                  {currentPlanData.description}
                </p>
              )}
            </div>
            {currentPlanData && currentPlan !== 'free' && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatPrice(currentPlanData.pricing.monthly, currentPlanData.pricing.currency)}
                </div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
            )}
          </div>

          {/* Current Plan Features */}
          {currentPlanData && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <p className="text-sm font-medium">What's included:</p>
              <div className="space-y-1">
                {currentPlanData.featuresSummary.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Prompt for Free Users */}
      {canUpgrade && (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>Unlock More Features</CardTitle>
            </div>
            <CardDescription>
              Upgrade to access premium features and grow your business faster
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Real-time interactive map with location tracking</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Full contact details with email addresses</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Bulk campaigns across multiple locations</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Gmail deep link integration for faster follow-ups</span>
              </div>
            </div>

            <Button
              onClick={() => navigate('/upgrade')}
              className="w-full gap-2"
              size="lg"
            >
              <Sparkles className="w-4 h-4" />
              View Plans & Pricing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Card (Placeholder) */}
      {!canUpgrade && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <CardTitle>Payment Method</CardTitle>
            </div>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Payment management coming soon. Contact support for billing assistance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
