import { cn } from '@/lib/utils';
import { MapPin as MapPinIcon } from 'lucide-react';

export interface MapPinProps {
  /** Number of pending contacts at this location */
  badgeCount: number;
  /** Whether this pin has new activity (pulse animation) */
  isLive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom className */
  className?: string;
}

export function MapPin({
  badgeCount,
  isLive = false,
  onClick,
  className,
}: MapPinProps) {
  const hasContacts = badgeCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative',
        'w-12 h-12',              // 48x48px touch target
        'transition-transform',
        'hover:scale-110',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
        className
      )}
      aria-label={`${badgeCount} contact${badgeCount !== 1 ? 's' : ''} pending`}
    >
      {/* Pin icon */}
      <MapPinIcon
        className={cn(
          'w-8 h-8',
          'transition-colors',
          hasContacts ? 'text-accent' : 'text-primary',
        )}
        fill={hasContacts ? 'currentColor' : 'none'}
      />

      {/* Pulse animation (when live) */}
      {isLive && hasContacts && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="absolute w-8 h-8 bg-accent opacity-75 rounded-full animate-ping" />
        </span>
      )}

      {/* Badge count */}
      {badgeCount > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1',
            'min-w-[20px] h-5',
            'px-1.5',
            'flex items-center justify-center',
            'bg-accent text-accent-foreground',
            'text-xs font-semibold',
            'rounded-full',
            'border-2 border-background',
            'shadow-sm',
          )}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  );
}
