/**
 * Header 導航項目配置
 */
export interface NavigationItem {
  href: string
  label: string
  isExternal: boolean
}

export const navItems: NavigationItem[] = [
  { href: '/', label: '農業探索', isExternal: false },
  { href: '/farm-tour', label: '觀光果園', isExternal: false },
  { href: '/products', label: '產品介紹', isExternal: false },
  { href: '/locations', label: '門市據點', isExternal: false },
  { href: '/schedule', label: '擺攤行程', isExternal: false },
]
