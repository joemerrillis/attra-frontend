import { useAuth } from '@/hooks/useAuth';

export default function Onboarding() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4">
          ●<span className="text-primary">&gt;</span>attra<span className="text-primary">&gt;</span>●
        </h1>
        <h2 className="text-2xl font-semibold mb-4">Welcome, {user?.full_name || 'there'}!</h2>
        <p className="text-gray-600 mb-8">
          Onboarding wizard will be built in File 03
        </p>
        <p className="text-sm text-gray-500">
          You're logged in as {user?.email}
        </p>
      </div>
    </div>
  );
}
