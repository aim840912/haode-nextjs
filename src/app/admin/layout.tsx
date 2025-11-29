'use client'

import { AdminHeader } from '@/components/features/admin/AdminHeader'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { AdminSidebar } from '@/components/features/admin/AdminSidebar'
import { AdminSidebarProvider, useAdminSidebar } from '@/contexts/AdminSidebarContext'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useAdminSidebar()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AdminSidebar />
      <AdminHeader />

      {/* 主內容區 */}
      <main
        className={`
          pt-16 min-h-screen
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:pl-16' : 'lg:pl-60'}
        `}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtection>
      <AdminSidebarProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminSidebarProvider>
    </AdminProtection>
  )
}
