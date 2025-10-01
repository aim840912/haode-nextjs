'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/feedback/Toast'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingSpinner from '@/components/ui/loading/LoadingSpinner'

// Hooks
import { useProfileForm } from './hooks/useProfileForm'
import { useOrders } from './hooks/useOrders'
import { useInterests } from './hooks/useInterests'

// Components
import { ProfileTab } from './components/ProfileTab'
import { OrdersTab } from './components/OrdersTab'
import { InterestsTab } from './components/InterestsTab'

// 載入頁面元件
function ProfilePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    </div>
  )
}

// 個人資料內容元件
function ProfilePageContent() {
  const { user, updateProfile, isLoading: authLoading } = useAuth()
  const { success, error } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState('profile')

  // 使用自定義 hooks
  const { formData, isEditing, isSaving, setIsEditing, handleInputChange, handleSave } =
    useProfileForm(
      user,
      updateProfile,
      () => success('資料更新成功', '您的個人資料已更新'),
      message => error('更新失敗', message)
    )

  const {
    orders,
    loadingOrders,
    ordersError,
    loadOrders,
    cancelOrder,
    getStatusText,
    getStatusColor,
  } = useOrders(
    user,
    message => success('操作成功', message),
    message => error('操作失敗', message)
  )

  const { interestedProductsData, loadingInterests, loadInterests, removeFromInterests } =
    useInterests(
      user,
      message => success('操作成功', message),
      message => error('操作失敗', message)
    )

  // 初始化：從 URL 參數設定 activeTab
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab && ['profile', 'orders', 'interests'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 載入訂單和收藏清單
  useEffect(() => {
    if (user) {
      if (activeTab === 'orders') {
        loadOrders()
      } else if (activeTab === 'interests') {
        loadInterests()
      }
    }
  }, [user, activeTab, loadOrders, loadInterests])

  // 處理分頁切換
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/profile?tab=${tab}`)
  }

  // 載入中
  if (authLoading || !user) {
    return <ProfilePageLoading />
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">會員中心</h1>
          <p className="text-gray-600">歡迎回來，{user.name}</p>
        </div>

        <div className="lg:grid lg:grid-cols-4 gap-8">
          {/* 側邊導航 */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    個人資料
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    訂單記錄
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('interests')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'interests'
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    收藏清單
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* 主要內容區 */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                formData={formData}
                isEditing={isEditing}
                isSaving={isSaving}
                onEdit={() => setIsEditing(true)}
                onCancel={() => setIsEditing(false)}
                onSave={handleSave}
                onInputChange={handleInputChange}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                loading={loadingOrders}
                error={ordersError}
                onCancelOrder={cancelOrder}
                getStatusText={getStatusText}
                getStatusColor={getStatusColor}
              />
            )}

            {activeTab === 'interests' && (
              <InterestsTab
                products={interestedProductsData}
                loading={loadingInterests}
                onRemove={removeFromInterests}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 主要匯出元件
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageLoading />}>
      <ProfilePageContent />
    </Suspense>
  )
}
