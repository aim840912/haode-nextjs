import { AuditLog, AUDIT_ACTION_LABELS, AuditAction } from '@/types/audit'

type DeleteTarget =
  | { type: 'single'; data?: AuditLog }
  | { type: 'batch'; data?: { ids: string[] } }

interface DeleteConfirmModalProps {
  isOpen: boolean
  deleteTarget: DeleteTarget
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 刪除確認彈窗元件
 * 負責顯示刪除確認對話框
 */
export function DeleteConfirmModal({
  isOpen,
  deleteTarget,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">確認刪除</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="mb-6">
            {deleteTarget.type === 'single' ? (
              <div>
                <p className="text-gray-600 mb-4">確定要刪除這筆審計日誌嗎？</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>時間：</strong>
                    {deleteTarget.data?.created_at &&
                      new Date(deleteTarget.data.created_at).toLocaleString('zh-TW')}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>動作：</strong>
                    {deleteTarget.data?.action &&
                      AUDIT_ACTION_LABELS[deleteTarget.data.action as AuditAction]}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>使用者：</strong>
                    {deleteTarget.data?.user_email}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  確定要刪除選取的 <strong>{deleteTarget.data?.ids?.length}</strong> 筆審計日誌嗎？
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">⚠️ 此操作無法復原，請謹慎確認</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
