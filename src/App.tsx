import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import Landing from '@/pages/Landing';
import Signup from '@/pages/Signup';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/auth/Callback';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import CampaignsIndex from '@/pages/campaigns/Index';
import NewCampaign from '@/pages/campaigns/New';
import Locations from '@/pages/Locations';
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

            {/* Main app routes with AppLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CampaignsIndex />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns/new"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <NewCampaign />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Locations />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContactsIndex />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ContactDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Upgrade />
                  </AppLayout>
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
