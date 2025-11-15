export interface NavItem {
  href: string
  label: string
  isExternal: boolean
}

export interface AdminMenuProps {
  isOpen: boolean
  onClose: () => void
  stats?: {
    unread_count: number
  }
}
