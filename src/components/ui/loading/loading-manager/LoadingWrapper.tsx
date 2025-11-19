import React from 'react'
import { LoadingIndicator } from './LoadingIndicator'
import { useLoading } from './useLoading'
import type { LoadingWrapperProps } from './types'

/**
 * 條件式載入包裝器元件
 *
 * 根據載入狀態顯示子元件或載入畫面
 *
 * @example
 * ```tsx
 * <LoadingWrapper loading={isDataLoading}>
 *   <DataTable data={data} />
 * </LoadingWrapper>
 * ```
 */
export const LoadingWrapper = React.memo<LoadingWrapperProps>(
  ({ loading = false, fallback, children, useSmartLoading = true }) => {
    const { isLoading, shouldShowLoading } = useLoading()
    const showLoading = loading || (useSmartLoading ? shouldShowLoading : isLoading)

    if (showLoading) {
      return (
        <>
          {fallback || (
            <div className="flex items-center justify-center py-8">
              <LoadingIndicator size="lg" showProgress />
            </div>
          )}
        </>
      )
    }

    return <>{children}</>
  }
)

LoadingWrapper.displayName = 'LoadingWrapper'
