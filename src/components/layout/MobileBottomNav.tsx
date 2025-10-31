import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                'active:scale-95',
                isActive
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn('w-5 h-5 mb-1', isActive && 'stroke-[2.5px]')}
              />
              <span className="text-xs font-medium">{label}</span>

              {/* Orange indicator bar */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent transition-all duration-200" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
