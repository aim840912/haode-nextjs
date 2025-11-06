import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { AdminPageLoader } from '@/components/ui/loading/PageLoader'

export default function Loading() {
  return (
    <AdminProtection>
      <AdminPageLoader message="載入擺攤行程管理中..." />
    </AdminProtection>
  )
}
