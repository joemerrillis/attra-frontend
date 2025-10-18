# 10_build_new_pwa_mobile.md

## 🎯 Goal

Transform Attra into a production-ready Progressive Web App with native mobile wrapper support, featuring:

- ✅ **PWA Configuration** - Installable, offline-capable, app-like experience
- ✅ **Capacitor Integration** - Native iOS/Android builds from same codebase
- ✅ **Mobile Navigation** - Bottom tab bar with 6 items, vertical-aware terminology
- ✅ **Dark Mode** - System-aware theme with manual toggle
- ✅ **Offline Support** - Cached data with sync indicators
- ✅ **Install Prompts** - Smart detection (browser only, not in PWA/Capacitor)
- ✅ **Touch Optimization** - Mobile-first interactions and gestures
- ✅ **Performance** - Code splitting, lazy loading, optimized assets

---

## 📋 Prerequisites

**Dependencies to install:**
```bash
pnpm add @vite-pwa/vite-plugin workbox-window
pnpm add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
pnpm add -D @capacitor/assets
```

**Existing files required:**
- `04_build_new_campaign_creation_system.md` ✅
- `06_build_new_contacts_crm_system.md` ✅
- `07_build_new_analytics_dashboard.md` ✅
- `08_build_new_feature_gating_system.md` ✅
- `09_build_new_settings_pages.md` ✅

---

## 🏗️ Architecture Overview

```
Vite/React App (app.attra.io)
        ↓
    [Build Step]
        ↓
    ┌───┴────┐
    ↓        ↓
  PWA      Capacitor
(Browser)  (iOS/Android)
    ↓        ↓
Service   Native APIs
Worker    (Push, Camera)
```

**Key Principles:**
- Single codebase for web + native
- Progressive enhancement (features degrade gracefully)
- Offline-first for core workflows
- Mobile-first responsive design

---

## 📁 File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── MobileBottomNav.tsx        # Bottom tab navigation
│   │   ├── MobileHeader.tsx           # Top bar with profile menu
│   │   ├── InstallPrompt.tsx          # PWA install banner
│   │   └── OfflineIndicator.tsx       # Network status badge
│   ├── mobile/
│   │   ├── TouchOptimized.tsx         # Touch-friendly wrappers
│   │   └── SwipeHandler.tsx           # Swipe gestures
│   └── theme/
│       └── ThemeToggle.tsx            # Dark mode switch
├── hooks/
│   ├── usePWA.ts                      # PWA state & install
│   ├── useOffline.ts                  # Network detection
│   ├── useDarkMode.ts                 # Theme management
│   └── useMobileDetection.ts          # Platform detection
├── lib/
│   ├── capacitor.ts                   # Capacitor utilities
│   └── service-worker.ts              # SW registration
└── styles/
    └── mobile.css                     # Mobile-specific styles

public/
├── manifest.json                      # PWA manifest
├── icons/                             # App icons (512x512, etc.)
├── robots.txt
└── sw.js                              # Service worker (auto-generated)

ios/                                   # Capacitor iOS project
android/                               # Capacitor Android project
capacitor.config.ts                    # Capacitor configuration
```

---

## 🔧 Step 1: Configure Vite PWA Plugin

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      
      manifest: {
        name: '●>attra>● - Attribution Infrastructure',
        short_name: 'Attra',
        description: 'Attribution infrastructure that takes the guesswork out of physical advertising',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        
        categories: ['business', 'productivity', 'utilities'],
        
        shortcuts: [
          {
            name: 'New Campaign',
            short_name: 'Campaign',
            description: 'Create a new marketing campaign',
            url: '/campaigns/new',
            icons: [{ src: '/icons/campaign-shortcut.png', sizes: '96x96' }]
          },
          {
            name: 'Analytics',
            short_name: 'Analytics',
            description: 'View attribution analytics',
            url: '/analytics',
            icons: [{ src: '/icons/analytics-shortcut.png', sizes: '96x96' }]
          }
        ]
      },
      
      workbox: {
        // Cache strategy
        runtimeCaching: [
          {
            // API calls - Network first, cache fallback
            urlPattern: /^https:\/\/api\.attra\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Static assets - Cache first
            urlPattern: /\.(js|css|woff2?)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Images - Stale while revalidate
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],
        
        // Don't cache these patterns
        navigateFallbackDenylist: [/^\/api\//, /^\/s\//],
        
        // Clean old caches
        cleanupOutdatedCaches: true
      },
      
      devOptions: {
        enabled: true // Enable SW in dev for testing
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

---

## 🎨 Step 2: Create PWA Manifest Icons

**Script:** `scripts/generate-icons.js`

```javascript
import sharp from 'sharp';
import { promises as fs } from 'fs';

const sizes = [72, 96, 128, 144, 192, 384, 512];
const sourceIcon = 'public/logo.svg'; // Your ●>attra>● logo

async function generateIcons() {
  await fs.mkdir('public/icons', { recursive: true });
  
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}.png`);
    
    console.log(`✅ Generated ${size}x${size} icon`);
  }
  
  // Generate maskable icons (with padding for safe area)
  for (const size of [192, 512]) {
    await sharp(sourceIcon)
      .resize(size * 0.8, size * 0.8) // 80% size for padding
      .extend({
        top: size * 0.1,
        bottom: size * 0.1,
        left: size * 0.1,
        right: size * 0.1,
        background: { r: 99, g: 102, b: 241, alpha: 1 } // theme color
      })
      .png()
      .toFile(`public/icons/icon-${size}-maskable.png`);
    
    console.log(`✅ Generated ${size}x${size} maskable icon`);
  }
}

generateIcons().catch(console.error);
```

**Run:**
```bash
node scripts/generate-icons.js
```

---

## 📱 Step 3: Configure Capacitor

**File:** `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.attra.app',
  appName: 'Attra',
  webDir: 'dist',
  
  server: {
    // For development - point to Vite dev server
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  
  ios: {
    scheme: 'Attra',
    contentInset: 'automatic'
  },
  
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
```

**Initialize Capacitor:**
```bash
npx cap init
npx cap add ios
npx cap add android
```

**Sync assets:**
```bash
npx cap sync
```

---

## 🪝 Step 4: Create Platform Detection Hooks

**File:** `src/hooks/useMobileDetection.ts`

```typescript
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface PlatformInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isPWA: boolean;
  isCapacitor: boolean;
  platform: 'ios' | 'android' | 'web';
}

export function useMobileDetection(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => detectPlatform());
  
  useEffect(() => {
    // Update on resize (e.g., tablet rotation)
    const handleResize = () => setInfo(detectPlatform());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return info;
}

function detectPlatform(): PlatformInfo {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  
  const isMobileWidth = window.innerWidth < 768;
  const isTouchDevice = 'ontouchstart' in window;
  
  return {
    isMobile: isMobileWidth || isTouchDevice || isCapacitor,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
    isPWA,
    isCapacitor,
    platform
  };
}
```

**File:** `src/hooks/usePWA.ts`

```typescript
import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  showInstallPrompt: boolean;
  needsUpdate: boolean;
  install: () => Promise<void>;
  dismissPrompt: () => void;
  updateServiceWorker: () => void;
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  
  const {
    needRefresh: [needsUpdate],
    updateServiceWorker
  } = useRegisterSW();
  
  useEffect(() => {
    // Check if already installed
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsInstalled(isPWA);
    
    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after user has engaged (viewed 2+ pages)
      const pageViews = parseInt(localStorage.getItem('attra_page_views') || '0');
      if (pageViews >= 2) {
        setShowPrompt(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Track app install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('attra_installed', 'true');
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);
  
  // Track page views for install prompt
  useEffect(() => {
    const views = parseInt(localStorage.getItem('attra_page_views') || '0');
    localStorage.setItem('attra_page_views', String(views + 1));
  }, []);
  
  const install = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };
  
  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('attra_install_dismissed', Date.now().toString());
  };
  
  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    showInstallPrompt: showPrompt && !isInstalled,
    needsUpdate,
    install,
    dismissPrompt,
    updateServiceWorker
  };
}
```

**File:** `src/hooks/useOffline.ts`

```typescript
import { useState, useEffect } from 'react';

interface OfflineState {
  isOnline: boolean;
  lastOnline: Date | null;
  showOfflineBanner: boolean;
}

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setLastOnline(new Date());
      setShowBanner(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOnline,
    lastOnline,
    showOfflineBanner: showBanner
  };
}
```

**File:** `src/hooks/useDarkMode.ts`

```typescript
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('attra_theme') as Theme;
    return saved || 'system';
  });
  
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (dark: boolean) => {
      setIsDark(dark);
      root.classList.toggle('dark', dark);
    };
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);
  
  const setThemePreference = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('attra_theme', newTheme);
  };
  
  return { theme, isDark, setTheme: setThemePreference };
}
```

---

## 🎨 Step 5: Create Mobile Layout Components

**File:** `src/components/layout/MobileBottomNav.tsx`

```typescript
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, FileText, MapPin, Settings } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const location = useLocation();
  const { tenant } = useTenant();
  
  // Get vertical-specific terminology
  const locationLabel = tenant?.vertical?.locations_label || 'Locations';
  
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/campaigns', icon: FileText, label: 'Campaigns' },
    { to: '/locations', icon: MapPin, label: locationLabel },
    { to: '/settings', icon: Settings, label: 'Settings' }
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
              <Icon className={cn(
                'w-5 h-5 mb-1',
                isActive && 'stroke-[2.5px]'
              )} />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
```

**File:** `src/components/layout/MobileHeader.tsx`

```typescript
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export function MobileHeader() {
  const { tenant } = useTenant();
  const { user, signOut } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img 
            src={tenant?.branding?.logo_url || '/logo.svg'} 
            alt="●>attra>●"
            className="h-8 w-auto"
          />
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
          
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{tenant?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to="/settings/billing">Billing</Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to="/help">Help & Support</Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```

**File:** `src/components/layout/InstallPrompt.tsx`

```typescript
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';
import { useMobileDetection } from '@/hooks/useMobileDetection';

export function InstallPrompt() {
  const { showInstallPrompt, install, dismissPrompt } = usePWA();
  const { isCapacitor, isPWA } = useMobileDetection();
  
  // Don't show in Capacitor or if already installed as PWA
  if (isCapacitor || isPWA || !showInstallPrompt) {
    return null;
  }
  
  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 p-4 shadow-lg border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">
            ●> Install Attra
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Track attribution on the go with our app
          </p>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={install} className="flex-1">
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissPrompt}>
              Later
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 -mt-1 -mr-1"
          onClick={dismissPrompt}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
```

**File:** `src/components/layout/OfflineIndicator.tsx`

```typescript
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, lastOnline, showOfflineBanner } = useOffline();
  
  if (isOnline) return null;
  
  return (
    <div className={cn(
      'fixed top-14 left-0 right-0 z-40 bg-yellow-500 text-yellow-950',
      'px-4 py-2 text-sm font-medium flex items-center justify-center gap-2',
      'md:top-0',
      showOfflineBanner ? 'translate-y-0' : '-translate-y-full',
      'transition-transform duration-300'
    )}>
      <WifiOff className="w-4 h-4" />
      <span>You're offline. Changes will sync when reconnected.</span>
      {lastOnline && (
        <span className="text-xs opacity-75 ml-1">
          (Last online: {lastOnline.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}
```

---

## 🎨 Step 6: Dark Mode Implementation

**File:** `src/components/theme/ThemeToggle.tsx`

```typescript
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDarkMode } from '@/hooks/useDarkMode';

export function ThemeToggle() {
  const { theme, isDark, setTheme } = useDarkMode();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {isDark ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="w-4 h-4 mr-2" />
          Light
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="w-4 h-4 mr-2" />
          Dark
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="w-4 h-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Update:** `src/index.css` (add dark mode variables)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Mobile-specific */
  @media (max-width: 768px) {
    body {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}
```

---

## 📱 Step 7: Mobile-Optimized Layouts

**File:** `src/styles/mobile.css`

```css
/* Touch-friendly tap targets (minimum 44x44px) */
@media (max-width: 768px) {
  button,
  a,
  input,
  select {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Larger form inputs on mobile */
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  textarea {
    @apply text-base; /* Prevents iOS zoom on focus */
  }
  
  /* Remove tap highlight on iOS */
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Smooth scrolling with momentum */
  .mobile-scroll {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Bottom nav safe area */
  .mobile-content {
    padding-bottom: calc(4rem + env(safe-area-inset-bottom));
  }
  
  /* Pull to refresh indicator */
  .ptr-indicator {
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  }
  
  .ptr-indicator.pulling {
    transform: translateY(0);
  }
}

/* Landscape mode adjustments */
@media (max-width: 768px) and (orientation: landscape) {
  .mobile-header {
    height: 3rem;
  }
  
  .mobile-bottom-nav {
    height: 3rem;
  }
}

/* PWA-specific styles */
@media (display-mode: standalone) {
  /* Remove unnecessary UI when installed */
  .install-prompt {
    display: none;
  }
  
  /* Add safe area padding for notched devices */
  .pwa-header {
    padding-top: env(safe-area-inset-top);
  }
}
```

**File:** `src/components/mobile/TouchOptimized.tsx`

```typescript
import { ComponentProps, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TouchOptimizedProps extends ComponentProps<'button'> {
  ripple?: boolean;
}

/**
 * Touch-optimized button wrapper with haptic feedback
 */
export const TouchOptimized = forwardRef<HTMLButtonElement, TouchOptimizedProps>(
  ({ children, className, ripple = true, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback on Capacitor
      if ('Capacitor' in window && 'Haptics' in (window as any).Capacitor) {
        (window as any).Capacitor.Haptics.impact({ style: 'light' });
      }
      
      onClick?.(e);
    };
    
    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          'touch-manipulation', // Disables double-tap zoom
          'active:scale-95 transition-transform',
          ripple && 'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchOptimized.displayName = 'TouchOptimized';
```

---

## 🔄 Step 8: Offline Data Sync

**File:** `src/lib/offline-sync.ts`

```typescript
import { openDB, IDBPDatabase } from 'idb';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'campaign' | 'contact' | 'location';
  data: any;
  timestamp: number;
}

let db: IDBPDatabase;

/**
 * Initialize IndexedDB for offline queue
 */
export async function initOfflineDB() {
  db = await openDB('attra-offline', 1, {
    upgrade(db) {
      // Pending actions queue
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', { keyPath: 'id' });
      }
      
      // Cached data
      if (!db.objectStoreNames.contains('cached-data')) {
        const store = db.createObjectStore('cached-data', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp');
      }
    }
  });
}

/**
 * Queue an action for later sync
 */
export async function queueAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
  const pending: PendingAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  
  await db.put('pending-actions', pending);
  return pending.id;
}

/**
 * Get all pending actions
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  return db.getAll('pending-actions');
}

/**
 * Remove completed action
 */
export async function removePendingAction(id: string) {
  await db.delete('pending-actions', id);
}

/**
 * Cache data for offline access
 */
export async function cacheData(key: string, data: any) {
  await db.put('cached-data', {
    key,
    data,
    timestamp: Date.now()
  });
}

/**
 * Get cached data
 */
export async function getCachedData(key: string) {
  const cached = await db.get('cached-data', key);
  return cached?.data;
}

/**
 * Sync pending actions when back online
 */
export async function syncPendingActions() {
  const actions = await getPendingActions();
  
  for (const action of actions) {
    try {
      // Send to API
      const response = await fetch(`/api/internal/${action.entity}s`, {
        method: action.type === 'create' ? 'POST' : 
                action.type === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('attra_token')}`
        },
        body: JSON.stringify(action.data)
      });
      
      if (response.ok) {
        await removePendingAction(action.id);
        console.log('✅ Synced action:', action.id);
      }
    } catch (err) {
      console.error('❌ Sync failed for action:', action.id, err);
    }
  }
}

// Auto-sync when back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Back online, syncing...');
    syncPendingActions();
  });
}
```

**Usage in components:**

```typescript
import { queueAction, getCachedData } from '@/lib/offline-sync';
import { useOffline } from '@/hooks/useOffline';

function CampaignForm() {
  const { isOnline } = useOffline();
  
  const handleSubmit = async (data) => {
    if (!isOnline) {
      // Queue for later
      await queueAction({
        type: 'create',
        entity: 'campaign',
        data
      });
      
      toast.success('Campaign saved. Will sync when online.');
    } else {
      // Normal API call
      await createCampaign(data);
    }
  };
}
```

---

## 🚀 Step 9: Update Main App Layout

**File:** `src/App.tsx`

```typescript
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { InstallPrompt } from '@/components/layout/InstallPrompt';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { queryClient } from '@/lib/react-query';
import { AppRoutes } from './routes';
import { useEffect } from 'react';
import { initOfflineDB } from '@/lib/offline-sync';

function App() {
  const { isMobile } = useMobileDetection();
  
  useEffect(() => {
    // Initialize offline database
    initOfflineDB();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          {/* Mobile Header */}
          {isMobile && <MobileHeader />}
          
          {/* Offline Indicator */}
          <OfflineIndicator />
          
          {/* Main Content */}
          <main className="flex-1 mobile-content">
            <AppRoutes />
          </main>
          
          {/* Mobile Bottom Navigation */}
          {isMobile && <MobileBottomNav />}
          
          {/* Install Prompt */}
          <InstallPrompt />
          
          {/* Toast Notifications */}
          <Toaster />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## 🛠️ Step 10: Build & Deploy Scripts

**File:** `package.json` (add scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    
    "cap:sync": "cap sync",
    "cap:open:ios": "cap open ios",
    "cap:open:android": "cap open android",
    
    "ios:dev": "cap run ios",
    "android:dev": "cap run android",
    
    "build:pwa": "pnpm build",
    "build:ios": "pnpm build && cap sync ios && cap build ios",
    "build:android": "pnpm build && cap sync android && cap build android",
    
    "generate:icons": "node scripts/generate-icons.js"
  }
}
```

---

## ✅ Step 11: Testing Checklist

### **PWA Testing:**
- [ ] Install PWA from browser (Chrome, Safari)
- [ ] Verify offline mode works (airplane mode)
- [ ] Check service worker caches API responses
- [ ] Test "Add to Home Screen" prompt
- [ ] Verify app icon appears on home screen
- [ ] Test update notification when new version deployed

### **Capacitor Testing:**

**iOS:**
- [ ] Build project: `pnpm build:ios`
- [ ] Open Xcode: `pnpm cap:open:ios`
- [ ] Run on simulator/device
- [ ] Test splash screen
- [ ] Verify status bar color
- [ ] Test safe area insets (notch devices)

**Android:**
- [ ] Build project: `pnpm build:android`
- [ ] Open Android Studio: `pnpm cap:open:android`
- [ ] Run on emulator/device
- [ ] Test splash screen
- [ ] Verify navigation bar color
- [ ] Test back button behavior

### **Mobile UX Testing:**
- [ ] Bottom nav works on all routes
- [ ] Settings accessible from profile menu
- [ ] Touch targets are 44x44px minimum
- [ ] Forms don't zoom on iOS when focused
- [ ] Swipe gestures work smoothly
- [ ] Orientation changes handled gracefully

### **Dark Mode Testing:**
- [ ] Toggle between light/dark/system
- [ ] Verify all components have dark variants
- [ ] Check contrast ratios meet WCAG AA
- [ ] Test system theme changes (auto-switch)

### **Offline Testing:**
- [ ] Enable airplane mode
- [ ] View cached campaigns (read-only)
- [ ] Try to create campaign (should queue)
- [ ] Go back online
- [ ] Verify queued actions sync automatically
- [ ] Check "last synced" timestamp updates

---

## 🚀 Step 12: Deployment

### **Web (PWA):**
```bash
# Build for production
pnpm build

# Deploy to Render/Vercel/Netlify
# (auto-deploys from git push to main)
```

### **iOS App Store:**
```bash
# 1. Build
pnpm build:ios

# 2. Open Xcode
pnpm cap:open:ios

# 3. In Xcode:
# - Set team & signing certificate
# - Archive for distribution
# - Upload to App Store Connect
# - Submit for review
```

### **Google Play Store:**
```bash
# 1. Build
pnpm build:android

# 2. Open Android Studio
pnpm cap:open:android

# 3. In Android Studio:
# - Build → Generate Signed Bundle
# - Upload AAB to Play Console
# - Create release & submit for review
```

---

## 📊 Performance Targets

- **Lighthouse Score:** 90+ (PWA)
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s
- **Largest Contentful Paint:** <2.5s
- **Cumulative Layout Shift:** <0.1
- **Bundle Size:** <500KB (gzipped)

---

## ✅ Acceptance Criteria

- [ ] PWA installs successfully on Chrome/Safari
- [ ] Capacitor builds succeed for iOS and Android
- [ ] Bottom nav shows correct vertical terminology
- [ ] Install prompt only appears in browser (not PWA/Capacitor)
- [ ] Dark mode works with system preference
- [ ] Offline mode caches data and queues actions
- [ ] Service worker caches API responses
- [ ] Mobile layouts are touch-friendly (44x44px targets)
- [ ] Settings accessible from profile menu
- [ ] App works in landscape and portrait
- [ ] Safe area insets respected (notched devices)
- [ ] No console errors in production build
- [ ] Lighthouse score 90+ on mobile

---

## 📚 Resources

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Mobile UX Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)

---

**End of File 10 - Ready for Claude Code Execution** 🚀
