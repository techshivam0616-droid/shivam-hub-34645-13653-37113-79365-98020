import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function ContentCardSkeleton({ viewMode = 'grid' }: ContentCardSkeletonProps) {
  return (
    <Card className={`overflow-hidden border-2 ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
      {/* Image skeleton */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'}`}>
        <Skeleton className={`w-full ${viewMode === 'list' ? 'h-full' : 'h-64'} rounded-t-lg`} />
        
        {/* Badge skeleton */}
        <div className="absolute top-2 left-2 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        {/* Action buttons skeleton */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      
      <div className="flex-1">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </div>
    </Card>
  );
}

export function ContentCardSkeletonGrid({ count = 6, viewMode = 'grid' }: { count?: number; viewMode?: 'grid' | 'list' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ContentCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
      ))}
    </>
  );
}
