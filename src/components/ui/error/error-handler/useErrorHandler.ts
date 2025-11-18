import { useContext } from 'react'
import { ErrorContext } from './ErrorHandler'

/**
 * 使用 Error Context 的 Hook
 *
 * @returns ErrorContextType
 * @throws 如果在 ErrorHandler 外部使用
 */
export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorHandler')
  }
  return context
}
