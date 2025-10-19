import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Calendar, TrendingUp } from 'lucide-react';

const CAMPAIGN_GOALS = [
  {
    id: 'new_clients',
    name: 'Get New Clients',
    description: 'Attract new customers to your business',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'retention',
    name: 'Retain Existing Clients',
    description: 'Keep current customers engaged',
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'event',
    name: 'Promote an Event',
    description: 'Drive attendance to a specific event',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'awareness',
    name: 'Build Awareness',
    description: 'Increase brand visibility in your area',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
];

interface GoalSelectorProps {
  selected: string | null;
  onSelect: (goalId: string) => void;
}

export function GoalSelector({ selected, onSelect }: GoalSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What's your goal?</h2>
        <p className="text-muted-foreground">
          Choose what you want this campaign to achieve
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPAIGN_GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selected === goal.id;

          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-primary ${goal.borderColor} ${goal.bgColor}`
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelect(goal.id)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${goal.bgColor}`}>
                    <Icon className={`w-6 h-6 ${goal.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {goal.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
