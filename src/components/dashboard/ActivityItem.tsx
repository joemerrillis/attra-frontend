import { Target, Users, Mail, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItemProps {
  type: 'scan' | 'contact' | 'email' | 'call';
  title: string;
  description: string;
  timestamp: string;
}

const ICONS = {
  scan: Target,
  contact: Users,
  email: Mail,
  call: Phone,
};

const COLORS = {
  scan: 'text-blue-600',
  contact: 'text-green-600',
  email: 'text-purple-600',
  call: 'text-orange-600',
};

export function ActivityItem({ type, title, description, timestamp }: ActivityItemProps) {
  const Icon = ICONS[type];
  const color = COLORS[type];

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
