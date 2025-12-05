import React from 'react';
import { Target, Users, Gift, Home as HomeIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MarketingGoalSelectorProps {
  vertical: string;
  value: string;
  onChange: (value: string) => void;
}

const goalsByVertical: Record<string, Array<{ key: string; label: string; icon: any }>> = {
  real_estate: [
    { key: 'open_house', label: 'Promote an Open House', icon: HomeIcon },
    { key: 'new_listing', label: 'Announce a New Listing', icon: Target },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
  ],
  pet_services: [
    { key: 'new_clients', label: 'Get More Clients', icon: Target },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
    { key: 'promotion', label: 'Promote a Special Offer', icon: Gift },
  ],
  home_services: [
    { key: 'new_area', label: 'Expand to New Area', icon: Target },
    { key: 'promotion', label: 'Promote a Special Offer', icon: Gift },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
  ],
  landscaping: [
    { key: 'new_area', label: 'Expand to New Area', icon: Target },
    { key: 'seasonal', label: 'Seasonal Promotion', icon: Gift },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
  ],
  professional: [
    { key: 'awareness', label: 'Build Awareness', icon: Target },
    { key: 'referrals', label: 'Generate Referrals', icon: Users },
    { key: 'event', label: 'Promote an Event', icon: Gift },
  ],
};

export const MarketingGoalSelector: React.FC<MarketingGoalSelectorProps> = ({
  vertical,
  value,
  onChange,
}) => {
  const goals = goalsByVertical[vertical] || goalsByVertical.professional;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's Your Goal?</h2>
      <p className="text-gray-600 mb-6">
        We'll customize your first flyer based on what you're trying to achieve
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="space-y-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            return (
              <Label
                key={goal.key}
                htmlFor={goal.key}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors ${value === goal.key ? 'border-primary bg-blue-50' : 'border-gray-200'
                  }`}
              >
                <RadioGroupItem
                  value={goal.key}
                  id={goal.key}
                  className="flex-shrink-0"
                />
                <Icon className="w-6 h-6 text-primary mx-3 flex-shrink-0" />
                <span className="font-medium">{goal.label}</span>
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};
