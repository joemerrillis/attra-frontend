import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Campaigns</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Scans</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Flyers Generated</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Your Campaigns</h2>
              <p className="text-gray-600 text-sm mt-1">
                Create and manage your marketing campaigns
              </p>
            </div>
            <Button onClick={() => navigate('/campaigns/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first campaign
            </p>
            <Button onClick={() => navigate('/campaigns/new')} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
