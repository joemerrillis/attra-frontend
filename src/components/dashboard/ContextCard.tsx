import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type ContextCardPriority = 'urgent' | 'positive' | 'onboarding' | 'success' | 'neutral';

interface ContextCardProps {
  priority: ContextCardPriority;
  icon?: React.ReactNode;
  headline: string;
  subtext?: string;
  buttonLabel?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
  className?: string;
}

export function ContextCard({
  priority,
  icon,
  headline,
  subtext,
  buttonLabel,
  buttonHref,
  onButtonClick,
  className,
}: ContextCardProps) {
  // Color-coded based on priority (aligns with styleguide)
  const priorityStyles = {
    urgent: {
      border: 'border-l-4 border-l-destructive',
      icon: 'text-destructive',
      headline: 'text-foreground',
    },
    positive: {
      border: 'border-l-4 border-l-success',
      icon: 'text-success',
      headline: 'text-foreground',
    },
    onboarding: {
      border: 'border-l-4 border-l-accent',
      icon: 'text-accent',
      headline: 'text-foreground',
    },
    success: {
      border: 'border-l-4 border-l-success',
      icon: 'text-success',
      headline: 'text-foreground',
    },
    neutral: {
      border: 'border-l-4 border-l-muted',
      icon: 'text-muted-foreground',
      headline: 'text-foreground',
    },
  };

  const styles = priorityStyles[priority];

  return (
    <Card className={cn('transition-all hover:shadow-md', styles.border, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className={cn('mt-1 flex-shrink-0', styles.icon)}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className={cn('text-lg leading-tight', styles.headline)}>
              {headline}
            </CardTitle>
            {subtext && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtext}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {(buttonLabel || buttonHref) && (
        <CardContent className="pt-0">
          {buttonHref ? (
            <Button
              variant={priority === 'urgent' ? 'accent' : 'outline'}
              size="sm"
              asChild
            >
              <Link to={buttonHref}>
                {buttonLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button
              variant={priority === 'urgent' ? 'accent' : 'outline'}
              size="sm"
              onClick={onButtonClick}
            >
              {buttonLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
