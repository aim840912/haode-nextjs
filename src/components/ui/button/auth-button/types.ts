import { User } from '@/types/auth'

/**
 * AuthButton Props
 */
export interface AuthButtonProps {
  /** 是否為行動版 */
  isMobile?: boolean
}

/**
 * UserDropdownMenu Props
 */
export interface UserDropdownMenuProps {
  /** 用戶資料 */
  user: User
  /** 是否為行動版 */
  isMobile: boolean
  /** 下拉選單是否開啟 */
  isOpen: boolean
  /** 登出中狀態 */
  isLoggingOut: boolean
  /** 興趣產品數量 */
  interestedCount: number
  /** 登出處理 */
  onLogout: () => void
  /** 關閉下拉選單 */
  onClose: () => void
}

/**
 * useAuthButton Hook Return Type
 */
export interface UseAuthButtonReturn {
  /** 用戶資料 */
  user: User | null
  /** 是否載入中 */
  isLoading: boolean
  /** 是否登出中 */
  isLoggingOut: boolean
  /** 下拉選單是否開啟 */
  isDropdownOpen: boolean
  /** 興趣產品數量 */
  interestedCount: number
  /** 客戶端是否已掛載 */
  hasMounted: boolean
  /** 下拉選單 ref */
  dropdownRef: React.RefObject<HTMLDivElement>
  /** 處理登出 */
  handleLogout: () => void
  /** 切換下拉選單 */
  toggleDropdown: () => void
  /** 關閉下拉選單 */
  closeDropdown: () => void
}
