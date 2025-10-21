import { ReactNode } from 'react';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile } = useMobileDetection();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
