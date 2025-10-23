import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  name?: string;
  onNameChange: (name: string) => void;
  description?: string;
  onDescriptionChange: (description: string) => void;
  goal?: CampaignGoal;
  onGoalChange: (goal: CampaignGoal) => void;
}

export function Step1Goal({ name, onNameChange, description, onDescriptionChange, goal, onGoalChange }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Your Campaign</h2>
        <p className="text-muted-foreground">
          Give your campaign a name and choose its primary objective
        </p>
      </div>

      {/* Campaign Name & Description */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Help identify this campaign at a glance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">
              Campaign Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign-name"
              placeholder="e.g., Spring Sale 30% Off, Grand Opening Week"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Give your campaign a memorable name that describes its purpose
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-description">
              Description <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="campaign-description"
              placeholder="Additional notes about this campaign..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Goal Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Campaign Goal</h3>
        <p className="text-sm text-muted-foreground mb-4">
          What's the primary objective?
        </p>
      </div>

      <RadioGroup value={goal} onValueChange={onGoalChange}>
        <div className="grid gap-4">
          {GOALS.map((goalOption) => {
            const Icon = goalOption.icon;
            const isSelected = goal === goalOption.value;

            return (
              <Card
                key={goalOption.value}
                className={`cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => onGoalChange(goalOption.value)}
              >
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <RadioGroupItem value={goalOption.value} id={goalOption.value} />
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor={goalOption.value} className="cursor-pointer">
                      <CardTitle className="text-lg">{goalOption.label}</CardTitle>
                    </Label>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{goalOption.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
