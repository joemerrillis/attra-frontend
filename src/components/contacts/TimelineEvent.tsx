import { memo } from 'react';
import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEventTime } from '@/lib/timeline-utils';
import type { TimelineEvent as TimelineEventType } from '@/lib/timeline-utils';

interface TimelineEventProps {
  event: TimelineEventType;
  isFirst: boolean;
  isLast: boolean;
}

export const TimelineEvent = memo(({ event, isFirst, isLast }: TimelineEventProps) => {
  const Icon = (Icons as any)[event.icon] || Icons.Circle;
  const { relative, exact } = formatEventTime(event.timestamp);

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icon */}
      <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background ${
        isFirst ? 'border-primary' : 'border-border'
      }`}>
        <Icon className={`w-5 h-5 ${event.color}`} />
      </div>

      {/* Content */}
      <Card className={`flex-1 ${isFirst ? 'border-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{event.title}</h4>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              )}
            </div>
            <time
              className="text-xs text-muted-foreground"
              title={exact}
            >
              {relative}
            </time>
          </div>

          {/* Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {event.metadata.campaign && (
                <Badge variant="secondary" className="text-xs">
                  {event.metadata.campaign}
                </Badge>
              )}
              {event.metadata.outcome && (
                <Badge variant="outline" className="text-xs">
                  {event.metadata.outcome}
                </Badge>
              )}
              {event.metadata.followUpDate && (
                <Badge variant="outline" className="text-xs">
                  Follow-up: {new Date(event.metadata.followUpDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

TimelineEvent.displayName = 'TimelineEvent';
