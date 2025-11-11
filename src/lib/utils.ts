import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合併 className，支援條件和 Tailwind CSS 衝突解決
 *
 * @example
 * ```tsx
 * // 基本使用
 * cn('px-2 py-1', 'text-red-500')
 *
 * // 條件 className
 * cn('base-class', isActive && 'active', isDisabled && 'disabled')
 *
 * // 物件語法
 * cn('base-class', { 'active': isActive, 'disabled': isDisabled })
 *
 * // Tailwind 衝突解決 (後者覆蓋前者)
 * cn('px-2 py-1', 'px-4') // 結果: 'py-1 px-4'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * 條件性 className 工具函數
 * 根據條件返回對應的 className
 *
 * @deprecated 請使用 cn() 函數的條件語法: cn(condition && 'class-name')
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string {
  return condition ? trueClass : falseClass
}

/**
 * 切換 className 工具函數
 * 根據狀態切換 className
 *
 * @deprecated 請使用 cn() 函數的條件語法: cn(isActive ? 'active-class' : 'inactive-class')
 */
export function toggleClass(
  isActive: boolean,
  activeClass: string,
  inactiveClass: string = ''
): string {
  return isActive ? activeClass : inactiveClass
}
