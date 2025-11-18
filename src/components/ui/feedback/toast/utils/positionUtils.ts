/**
 * Toast 位置管理工具
 */

import type { Toast, ToastPosition } from '../types'

/**
 * 根據位置參數取得對應的 CSS class
 */
export function getPositionClasses(position: ToastPosition = 'bottom-right'): string {
  const positions: Record<ToastPosition, string> = {
    'top-left': 'fixed top-4 left-4 z-50 space-y-2',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2',
    'top-right': 'fixed top-4 right-4 z-50 space-y-2',
    'bottom-left': 'fixed bottom-4 left-4 z-50 space-y-2',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2',
    'bottom-right': 'fixed bottom-4 right-4 z-50 space-y-2',
  }
  return positions[position]
}

/**
 * 將 toasts 依照位置分組
 */
export function groupToastsByPosition(toasts: Toast[]): Map<ToastPosition, Toast[]> {
  const grouped = new Map<ToastPosition, Toast[]>()

  toasts.forEach(toast => {
    const position = toast.position || 'bottom-right'
    if (!grouped.has(position)) {
      grouped.set(position, [])
    }
    grouped.get(position)!.push(toast)
  })

  return grouped
}
