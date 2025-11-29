'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/layouts/common/Footer'
import { Header } from '@/components/layouts/common/Header'
import { HeaderSpacer } from '@/components/ui/navigation/HeaderSpacer'

interface RootLayoutContentProps {
  children: React.ReactNode
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  const pathname = usePathname()

  // Admin 頁面不顯示前台的 Header/Footer
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    // Admin 頁面：只渲染 children（由 admin/layout.tsx 處理 UI）
    return <>{children}</>
  }

  // 前台頁面：顯示 Header + Footer
  return (
    <>
      <Header />
      <main className="flex-grow">
        <HeaderSpacer />
        {children}
      </main>
      <Footer />
    </>
  )
}
