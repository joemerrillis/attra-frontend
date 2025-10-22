import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CampaignGoal } from '@/types/campaign';
import { Target, Users, Calendar, Megaphone, TrendingUp } from 'lucide-react';

const GOALS: Array<{
  value: CampaignGoal;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'new_clients',
    label: 'New Clients',
    description: 'Attract new customers to your business',
    icon: Target
  },
  {
    value: 'retention',
    label: 'Retention',
    description: 'Re-engage existing customers',
    icon: Users
  },
  {
    value: 'event_promo',
    label: 'Event Promotion',
    description: 'Promote an upcoming event or special offer',
    icon: Calendar
  },
  {
    value: 'seasonal',
    label: 'Seasonal Campaign',
    description: 'Holiday or seasonal marketing push',
    icon: TrendingUp
  },
  {
    value: 'awareness',
    label: 'Brand Awareness',
    description: 'Increase visibility and recognition',
    icon: Megaphone
  }
];

interface Step1GoalProps {
  value?: CampaignGoal;
  onChange: (goal: CampaignGoal) => void;
}

export function Step1Goal({ value, onChange }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What's your campaign goal?</h2>
        <p className="text-muted-foreground">
          Choose the primary objective for this campaign
        </p>
      </div>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid gap-4">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = value === goal.value;

            return (
              <Card
                key={goal.value}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => onChange(goal.value)}
              >
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <RadioGroupItem value={goal.value} id={goal.value} />
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor={goal.value} className="cursor-pointer">
                      <CardTitle className="text-lg">{goal.label}</CardTitle>
                    </Label>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{goal.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
