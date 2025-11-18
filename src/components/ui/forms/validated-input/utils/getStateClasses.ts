import { cn } from '@/lib/utils/cn'
import { InputState } from '../types'

/**
 * 根據狀態返回對應的樣式類別
 */
const STATE_CLASSES: Record<InputState, string> = {
  error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  warning: 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500',
  success: 'border-green-500 focus:ring-green-500 focus:border-green-500',
  validating: 'border-blue-500 focus:ring-blue-500 focus:border-blue-500',
  default: 'border-gray-300 focus:ring-green-500 focus:border-transparent',
}

/**
 * 獲取輸入框的完整樣式類別
 */
export function getStateClasses(inputState: InputState, className?: string): string {
  return cn(
    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200',
    STATE_CLASSES[inputState],
    className
  )
}
