import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'

export default function Loading() {
  return (
    <AdminProtection>
      <AdminPageLoader message="載入產品編輯資料中..." />
    </AdminProtection>
  )
}
