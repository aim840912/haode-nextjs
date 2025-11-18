import { useContext } from 'react'
import { LoadingContext } from './LoadingManager'

/**
 * 使用 Loading Context 的 Hook
 *
 * @returns LoadingContextType
 * @throws 如果在 LoadingManager 外部使用
 */
export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingManager')
  }
  return context
}
