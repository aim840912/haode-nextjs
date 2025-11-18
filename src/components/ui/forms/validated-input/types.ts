/**
 * ValidatedInput 型別定義
 */

export type ValidatedInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'url'
  | 'password'

export type InputState = 'error' | 'warning' | 'success' | 'validating' | 'default'

export interface ValidatedInputProps {
  id: string
  label: string
  type?: ValidatedInputType
  value: string | number
  onChange: (value: string | number) => void
  onBlur?: () => void
  onFocus?: () => void

  // 驗證狀態
  error?: string
  warning?: string
  success?: string
  isValidating?: boolean

  // 樣式和行為
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string

  // 輔助功能
  helpText?: string
  maxLength?: number
  showCharCount?: boolean

  // 特殊功能
  prefix?: string
  suffix?: string
  autoComplete?: string
  rows?: number // for textarea

  // 進階功能
  suggestions?: string[]
  onSuggestionSelect?: (suggestion: string) => void
}

export interface InputFieldProps {
  id: string
  type: ValidatedInputType
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFocus: () => void
  onBlur: () => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  autoComplete?: string
  rows?: number
  inputState: InputState
  error?: string
  warning?: string
  success?: string
  helpText?: string
  baseClasses: string
}
