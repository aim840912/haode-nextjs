import { useAuth } from '@/contexts/AuthContext'

interface AdminControlsProps {
  onRefresh: () => void
  loading: boolean
}

/**
 * 管理員控制按鈕組件
 *
 * 僅對管理員使用者顯示的功能按鈕區域
 * - 重新整理按鈕
 * - 產品管理連結
 * - 新增產品連結
 */
export function AdminControls({ onRefresh, loading }: AdminControlsProps) {
  const { user } = useAuth()

  // 只有管理員才顯示控制按鈕
  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto max-w-sm sm:max-w-none">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg sm:rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="重新整理產品列表"
      >
        <span>{loading ? '更新中...' : '重新整理'}</span>
      </button>

      <a
        href="/admin/products"
        className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg sm:rounded-full text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
      >
        <span>產品管理</span>
      </a>

      <a
        href="/admin/products/add"
        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg sm:rounded-full text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <span>新增產品</span>
      </a>
    </div>
  )
}
