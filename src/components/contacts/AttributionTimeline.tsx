import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, TrendingUp } from 'lucide-react';
import { TimelineEvent } from './TimelineEvent';
import { calculateResponseMetrics } from '@/lib/timeline-utils';
import type { TimelineEvent as TimelineEventType } from '@/lib/timeline-utils';

interface AttributionTimelineProps {
  timeline: TimelineEventType[];
}

export function AttributionTimeline({ timeline }: AttributionTimelineProps) {
  const metrics = calculateResponseMetrics(timeline);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Attribution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Response time metric */}
        {metrics && (
          <Alert className={`mb-6 ${metrics.isFast ? 'border-green-500 bg-green-50' : ''}`}>
            <TrendingUp className={`h-4 w-4 ${metrics.isFast ? 'text-green-600' : ''}`} />
            <AlertDescription>
              <strong>Response time: {metrics.formatted}</strong>
              {metrics.isFast && ' — Great job! Fast responses increase conversion.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Timeline events */}
        <div className="space-y-0">
          {timeline.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity yet
            </p>
          ) : (
            timeline.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isFirst={index === 0}
                isLast={index === timeline.length - 1}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
