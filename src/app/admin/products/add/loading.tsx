import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'

export default function Loading() {
  return (
    <AdminProtection>
      <AdminPageLoader message="載入智慧產品管理介面中..." />
    </AdminProtection>
  )
}
