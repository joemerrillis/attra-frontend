# Build Authentication and Tenant Setup

## Objective
Implement Supabase authentication with Google OAuth and automatic tenant creation. When a user signs up, the system should create both a `users` record and a `tenants` record, then redirect to the onboarding wizard.

## Dependencies
- Supabase project created and configured
- Database schema with `users` and `tenants` tables

## Tech Stack
- **Auth:** Supabase Auth with Google OAuth
- **Frontend:** React 18+, TypeScript, React Router
- **State:** React Context for auth state
- **Styling:** Tailwind CSS + Shadcn/ui

---

## Database Schema

### Ensure Tables Exist

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Tenants table (one per business)
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  plan_key text DEFAULT 'free' REFERENCES billing.plans(plan_key)
);

-- User-Tenant relationship (for future team features)
CREATE TABLE IF NOT EXISTS public.user_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for tenants
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their tenant"
  ON tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for user_tenants
CREATE POLICY "Users can view their tenant memberships"
  ON user_tenants FOR SELECT
  USING (user_id = auth.uid());
```

---

## Supabase Configuration

### Enable Google OAuth

In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Google
3. Add Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Add redirect URL: `https://app.attra.io/auth/callback`

---

## File Structure

```
src/
├── lib/
│   └── supabase.ts
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
├── pages/
│   ├── Signup.tsx
│   ├── Login.tsx
│   └── auth/
│       └── Callback.tsx
└── components/
    └── auth/
        ├── GoogleButton.tsx
        └── ProtectedRoute.tsx
```

---

## Implementation

### 1. Supabase Client

**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  primary_color: string;
  plan_key: string;
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
}
```

---

### 2. Auth Context

**File:** `src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User, Tenant } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserAndTenant(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserAndTenant(session.user.id);
      } else {
        setUser(null);
        setTenant(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserAndTenant = async (userId: string) => {
    try {
      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Load user's tenant
      const { data: userTenantData, error: userTenantError } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (userTenantError) {
        // No tenant yet - user needs onboarding
        setTenant(null);
        setLoading(false);
        return;
      }

      // Load tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userTenantData.tenant_id)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (session) {
      await loadUserAndTenant(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        tenant,
        loading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

---

### 3. Auth Hook

**File:** `src/hooks/useAuth.ts`

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

### 4. Google Sign In Button

**File:** `src/components/auth/GoogleButton.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick, loading }) => {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
      size="lg"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};
```

---

### 5. Signup Page

**File:** `src/pages/Signup.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // Redirect handled by OAuth callback
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            ●<span className="text-blue-600">&gt;</span>attra<span className="text-blue-600">&gt;</span>●
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Join Attra
          </h2>
          <p className="text-gray-600">
            Start measuring your ground game today
          </p>
        </div>

        {/* Sign in form */}
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <GoogleButton onClick={handleGoogleSignIn} loading={loading} />

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Log in
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500 text-center">
            By continuing, you agree to Attra's{' '}
            <a href="/terms" className="underline">Terms of Service</a> and{' '}
            <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={() => (window.location.href = 'https://attra.io')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. Login Page

**File:** `src/pages/Login.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            ●<span className="text-blue-600">&gt;</span>attra<span className="text-blue-600">&gt;</span>●
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <GoogleButton onClick={handleGoogleSignIn} loading={loading} />

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 7. Auth Callback Handler

**File:** `src/pages/auth/Callback.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get the session from the URL
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      if (!data.session) {
        throw new Error('No session found');
      }

      const userId = data.session.user.id;
      const userEmail = data.session.user.email!;
      const userName = data.session.user.user_metadata?.full_name || userEmail.split('@')[0];
      const avatarUrl = data.session.user.user_metadata?.avatar_url;

      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        // Create user profile
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            full_name: userName,
            avatar_url: avatarUrl,
          });

        if (userError) throw userError;
      }

      // Check if user has a tenant
      const { data: userTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();

      if (!userTenant) {
        // New user - redirect to onboarding
        navigate('/onboarding');
      } else {
        // Existing user - redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setError('Failed to complete sign in. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
```

---

### 8. Protected Route Component

**File:** `src/components/auth/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenant?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireTenant = true 
}) => {
  const { session, tenant, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireTenant && !tenant) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
```

---

## Router Setup

**File:** `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
import Signup from '@/pages/Signup';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/auth/Callback';
import Onboarding from '@/pages/Onboarding'; // Next command file
import Dashboard from '@/pages/Dashboard'; // Future command file

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute requireTenant={false}>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Redirect root to dashboard or signup */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## Environment Variables

**File:** `.env.example`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Testing

### Manual Tests

- [ ] Click "Continue with Google" on signup page
- [ ] Google OAuth popup appears
- [ ] After Google auth, redirected to `/auth/callback`
- [ ] User profile created in `users` table
- [ ] If new user: redirected to `/onboarding`
- [ ] If existing user: redirected to `/dashboard`
- [ ] Sign out works
- [ ] Sign in again works
- [ ] Protected routes require authentication

### Database Tests

```sql
-- Verify user was created
SELECT * FROM users WHERE email = 'test@example.com';

-- Verify no tenant yet (new user)
SELECT * FROM user_tenants WHERE user_id = 'user-id-here';
```

---

## Acceptance Criteria

- [ ] Signup page renders at `/signup`
- [ ] Google OAuth button works
- [ ] User profile created on first sign in
- [ ] Auth callback handles redirect correctly
- [ ] New users redirect to `/onboarding`
- [ ] Existing users redirect to `/dashboard`
- [ ] Protected routes require authentication
- [ ] Sign out functionality works
- [ ] Auth state persists on page refresh
- [ ] Error handling for failed auth

---

## Estimated Build Time

**4 hours**

## Priority

**Critical** - Required for all authenticated features

---

## Notes

- Google OAuth is the only auth method for MVP
- Email/password auth can be added later
- RLS policies ensure data security
- Auth state syncs across tabs
- Session persists in localStorage
