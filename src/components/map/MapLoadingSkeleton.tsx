import { Skeleton } from '@/components/ui/skeleton';

export function MapLoadingSkeleton() {
  return (
    <div className="relative w-full h-[calc(100vh-120px)] bg-muted/30">
      {/* Header stats bar skeleton */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Map skeleton */}
      <div className="absolute inset-0 pt-20">
        <Skeleton className="w-full h-full" />

        {/* Pulsing pin placeholders */}
        <div className="absolute top-1/4 left-1/3">
          <Skeleton className="w-12 h-12 rounded-full animate-pulse" />
        </div>
        <div className="absolute top-1/2 right-1/3">
          <Skeleton className="w-12 h-12 rounded-full animate-pulse" />
        </div>
        <div className="absolute bottom-1/3 left-2/3">
          <Skeleton className="w-12 h-12 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
