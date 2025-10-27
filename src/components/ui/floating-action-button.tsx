import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  to = '/campaigns/new',
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label = 'New Campaign',
  className,
}: FloatingActionButtonProps) {
  const buttonClasses = cn(
    // Positioning
    'fixed z-50',
    'bottom-20 right-4', // Mobile: above bottom nav
    'md:bottom-6 md:right-6', // Desktop: corner

    // Size (56x56px Material Design standard)
    'w-14 h-14',
    'rounded-full',

    // Colors
    'bg-accent text-accent-foreground',
    'hover:bg-accent/90',

    // Elevation
    'shadow-lg hover:shadow-xl',
    'transition-all duration-200',

    // Interaction
    'flex items-center justify-center',
    'active:scale-95',

    className
  );

  const content = (
    <>
      {icon}
      <span className="sr-only">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={buttonClasses} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClasses} aria-label={label}>
      {content}
    </button>
  );
}
