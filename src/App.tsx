import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
import Landing from '@/pages/Landing';
import Signup from '@/pages/Signup';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/auth/Callback';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import NewCampaign from '@/pages/campaigns/New';
import ScanLanding from '@/pages/public/ScanLanding';
import Upgrade from '@/pages/Upgrade';
import ContactsIndex from '@/pages/contacts/Index';
import ContactDetail from '@/pages/contacts/Detail';
import Settings from '@/pages/Settings';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes - NO AUTH REQUIRED */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Public QR scan routes - NO AUTH REQUIRED */}
            <Route path="/q/:id" element={<ScanLanding />} />
            <Route path="/go/:id" element={<ScanLanding />} />

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireTenant={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns/new"
              element={
                <ProtectedRoute>
                  <NewCampaign />
                </ProtectedRoute>
              }
            />

            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <Upgrade />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <ContactsIndex />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts/:id"
              element={
                <ProtectedRoute>
                  <ContactDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
