import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, FileText, MapPin, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/campaigns', icon: FileText, label: 'Campaigns' },
    { to: '/locations', icon: MapPin, label: 'Locations' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                'active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('w-5 h-5 mb-1', isActive && 'stroke-[2.5px]')}
              />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
