/**
 * className 工具函數
 *
 * 結合 clsx 和 tailwind-merge，提供以下功能：
 * 1. 條件式 className 處理
 * 2. Tailwind CSS 類別衝突解決
 * 3. 支援多種輸入格式
 *
 * @example
 * ```tsx
 * // 基本使用
 * cn('text-base', 'font-bold')
 * // => 'text-base font-bold'
 *
 * // 條件式類別
 * cn('base-class', isActive && 'active', isDisabled && 'disabled')
 * // => 'base-class active' (如果 isActive 為 true)
 *
 * // 物件形式
 * cn('base-class', {
 *   'text-lg': size === 'large',
 *   'text-sm': size === 'small',
 * })
 *
 * // Tailwind 衝突解決
 * cn('text-base text-lg')
 * // => 'text-lg' (後者覆蓋前者)
 * ```
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
