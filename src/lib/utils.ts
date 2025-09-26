/**
 * 簡單的 className 合併工具函數
 * 合併多個 className 字串，過濾掉 falsy 值
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 條件性 className 工具函數
 * 根據條件返回對應的 className
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
 */
export function toggleClass(
  isActive: boolean,
  activeClass: string,
  inactiveClass: string = ''
): string {
  return isActive ? activeClass : inactiveClass
}
