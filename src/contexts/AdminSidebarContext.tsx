'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface AdminSidebarContextType {
  /** 桌面版是否收合 */
  isCollapsed: boolean
  /** 手機版側邊欄是否開啟 */
  isMobileOpen: boolean
  /** 切換桌面版收合狀態 */
  toggleCollapse: () => void
  /** 設定桌面版收合狀態 */
  setCollapsed: (collapsed: boolean) => void
  /** 開啟手機版側邊欄 */
  openMobile: () => void
  /** 關閉手機版側邊欄 */
  closeMobile: () => void
  /** 切換手機版側邊欄 */
  toggleMobile: () => void
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined)

const STORAGE_KEY = 'admin-sidebar-collapsed'

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // 從 localStorage 讀取偏好設定
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
    setIsHydrated(true)
  }, [])

  // 儲存收合狀態到 localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed))
    }
  }, [isCollapsed, isHydrated])

  // 當手機版側邊欄開啟時，禁止背景滾動
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }, [])

  const openMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev)
  }, [])

  return (
    <AdminSidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleCollapse,
        setCollapsed,
        openMobile,
        closeMobile,
        toggleMobile,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  )
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext)
  if (context === undefined) {
    throw new Error('useAdminSidebar must be used within an AdminSidebarProvider')
  }
  return context
}
