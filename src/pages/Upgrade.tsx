import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlanData } from '@/hooks/usePlanData';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { formatPrice } from '@/lib/plan-utils';
import { FeatureBadge } from '@/components/feature-gating/FeatureBadge';

export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const feature = searchParams.get('feature');

  const { plans, isLoading } = usePlanData();
  const { planKey: currentPlan } = useCurrentPlan();

  if (isLoading) {
    return <div className="container py-8">Loading plans...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-4xl font-bold mb-2">
            Upgrade Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            {feature
              ? `Unlock ${feature.replace(/_/g, ' ')} and more with a paid plan`
              : 'Choose the plan that fits your business'}
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Your current plan:</p>
          <FeatureBadge planKey={currentPlan} size="md" />
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter(p => p.key !== 'free').map((plan) => {
            const isCurrentPlan = plan.key === currentPlan;
            const price = plan.pricing.monthly;

            return (
              <Card
                key={plan.key}
                className={`relative ${
                  plan.key === 'pro'
                    ? 'border-purple-500 shadow-lg scale-105'
                    : ''
                }`}
              >
                {plan.key === 'pro' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.displayName}
                    {isCurrentPlan && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {formatPrice(price, plan.pricing.currency)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    {plan.featuresSummary.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full"
                    variant={plan.key === 'pro' ? 'default' : 'outline'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.displayName}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            All plans include 14-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
