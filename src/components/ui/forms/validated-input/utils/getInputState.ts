import { InputState } from '../types'

/**
 * 決定輸入框的樣式狀態
 */
export function getInputState(
  error?: string,
  warning?: string,
  success?: string,
  isValidating?: boolean
): InputState {
  if (error) return 'error'
  if (isValidating) return 'validating'
  if (success && !isValidating) return 'success'
  if (warning) return 'warning'
  return 'default'
}
