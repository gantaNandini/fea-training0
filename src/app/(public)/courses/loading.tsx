import { SkeletonGrid } from '@/components/shared/SkeletonCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container-page py-12">
      <Skeleton className="mb-8 h-10 w-64" />
      <SkeletonGrid count={6} />
    </div>
  )
}
