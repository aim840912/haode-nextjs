import { ProductCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'

/**
 * 產品頁面載入狀態組件
 *
 * 統一的產品載入骨架屏顯示
 */
export function ProductsLoadingState() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
