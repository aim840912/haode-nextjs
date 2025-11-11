import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'

export default function Loading() {
  return (
    <AdminProtection>
      <AdminPageLoader message="載入門市管理中..." />
    </AdminProtection>
  )
}
