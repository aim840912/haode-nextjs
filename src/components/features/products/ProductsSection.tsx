/**
 * ProductsSection - 向後兼容匯出
 */

import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { ErrorHandler } from '@/components/ui/error/ErrorHandler'
import { LoadingManager } from '@/components/ui/loading/LoadingManager'
import { ProductsSection } from './products-section'

export function ProductsSectionWithErrorBoundary() {
  return (
    <ComponentErrorBoundary>
      <LoadingManager>
        <ErrorHandler>
          <ProductsSection />
        </ErrorHandler>
      </LoadingManager>
    </ComponentErrorBoundary>
  )
}
