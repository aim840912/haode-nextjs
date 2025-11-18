/**
 * ProductsSection - 向後兼容匯出
 */

import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { ProductsSection } from './products-section'

export function ProductsSectionWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <ProductsSection />
    </ComponentErrorBoundary>
  )
}
