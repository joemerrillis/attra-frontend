import { Menu, Home, BarChart3, Users, FileText, MapPin, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useMobileDetection } from '@/hooks/useMobileDetection';

export function MobileHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/campaigns', icon: FileText, label: 'Campaigns' },
    { to: '/locations', icon: MapPin, label: 'Locations' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">
            <span className="text-gray-400">&gt;●</span> attra
          </span>
        </Link>

        {/* Desktop Navigation Menu (Hamburger) */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Navigation</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {navItems.map(({ to, icon: Icon, label }) => (
                <DropdownMenuItem key={to} asChild>
                  <Link to={to} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Mobile - Just Logo (nav is in bottom bar) */}
      </div>
    </header>
  );
}
