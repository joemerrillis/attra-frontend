import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Toaster } from '@/components/ui/toaster';

// Placeholder - routes will be added in files 02-10
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <h1 className="text-4xl font-bold text-center p-8">
            ●<span className="text-primary">&gt;</span>attra<span className="text-primary">&gt;</span>●
          </h1>
          <p className="text-center text-muted-foreground">
            Frontend initialized. Ready for file 02 (Auth).
          </p>
        </div>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
