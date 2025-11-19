import { LoadingButton } from '@/components/ui/loading/LoadingSpinner'
import type { ProfileFormData } from '@/hooks/profile/useProfileForm'
import type { User } from '@/types/auth'

interface ProfileTabProps {
  user: User
  formData: ProfileFormData
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * 個人資料分頁元件
 * 顯示和編輯使用者的個人資料
 */
export function ProfileTab({
  user,
  formData,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
}: ProfileTabProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">個人資料</h2>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            編輯資料
          </button>
        ) : (
          <div className="space-x-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <LoadingButton
              loading={isSaving}
              onClick={onSave}
              className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800"
            >
              儲存
            </LoadingButton>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 基本資料 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">基本資料</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            ) : (
              <p className="text-gray-900">{user.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-600 text-sm">({isEditing ? '無法修改' : '聯絡用信箱'})</p>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
                placeholder="請輸入電話號碼"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            ) : (
              <p className="text-gray-900">{user.phone || '未設定'}</p>
            )}
          </div>
        </div>

        {/* 地址資料 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">地址資料</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">國家</label>
            {isEditing ? (
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            ) : (
              <p className="text-gray-900">{user.address?.country || '未設定'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            {isEditing ? (
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={onInputChange}
                placeholder="請輸入城市"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            ) : (
              <p className="text-gray-900">{user.address?.city || '未設定'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">街道地址</label>
            {isEditing ? (
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={onInputChange}
                placeholder="請輸入詳細地址"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            ) : (
              <p className="text-gray-900">{user.address?.street || '未設定'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">郵遞區號</label>
            {isEditing ? (
              <input
                type="text"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={onInputChange}
                placeholder="請輸入郵遞區號"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
            ) : (
              <p className="text-gray-900">{user.address?.postalCode || '未設定'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
