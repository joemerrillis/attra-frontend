import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, tenant, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              ●<span className="text-primary">&gt;</span>attra<span className="text-primary">&gt;</span>●
            </h1>
            <p className="text-gray-600 mt-1">Dashboard</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <div className="space-y-2 text-gray-600">
            <p>User: {user?.full_name || user?.email}</p>
            <p>Tenant: {tenant?.name || 'No tenant'}</p>
            <p className="text-sm text-gray-500 mt-4">
              Dashboard features will be built in files 04-10
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
