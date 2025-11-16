import { useState, useEffect, useRef } from 'react'

/**
 * Header 狀態管理 Hook
 * 管理 Desktop/Mobile 的選單開合狀態和外部點擊偵測
 */
export function useHeaderState() {
  // 管理員選單狀態
  const [isDesktopAdminMenuOpen, setIsDesktopAdminMenuOpen] = useState(false)
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false)

  // 手機版導航選單狀態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Refs
  const desktopAdminMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileAdminMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopAdminMenuRef.current &&
        !desktopAdminMenuRef.current.contains(event.target as Node)
      ) {
        setIsDesktopAdminMenuOpen(false)
      }
      if (
        mobileAdminMenuRef.current &&
        !mobileAdminMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileAdminMenuOpen(false)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 事件處理函數
  const handleDesktopAdminMenuToggle = () => {
    setIsDesktopAdminMenuOpen(!isDesktopAdminMenuOpen)
  }

  const handleMobileAdminMenuToggle = () => {
    setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen)
  }

  const handleMobileMenuToggle = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)

    // 發送自定義事件通知 HeaderSpacer 更新高度
    const event = new CustomEvent('mobileMenuToggle', {
      detail: { isOpen: newState },
    })
    document.dispatchEvent(event)
  }

  const handleMenuItemClick = () => {
    setIsDesktopAdminMenuOpen(false)
    setIsMobileAdminMenuOpen(false)
    setIsMobileMenuOpen(false)

    // 發送自定義事件通知 HeaderSpacer 更新高度
    const event = new CustomEvent('mobileMenuToggle', {
      detail: { isOpen: false },
    })
    document.dispatchEvent(event)
  }

  return {
    // 狀態
    isDesktopAdminMenuOpen,
    isMobileAdminMenuOpen,
    isMobileMenuOpen,
    // Refs
    desktopAdminMenuRef,
    mobileAdminMenuRef,
    mobileMenuRef,
    mobileMenuButtonRef,
    // 處理函數
    handleDesktopAdminMenuToggle,
    handleMobileAdminMenuToggle,
    handleMobileMenuToggle,
    handleMenuItemClick,
  }
}
