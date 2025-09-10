'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'
import { UserInterestsService } from '@/services/userInterestsServiceAdapter'
import { useToast } from '@/components/Toast'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingSpinner, { LoadingButton } from '@/components/LoadingSpinner'
import OptimizedImage from '@/components/OptimizedImage'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import type { Product } from '@/types/product'
import type { Order } from '@/types/order'

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

// 個人資料內容元件（使用 useSearchParams）
function ProfilePageContent() {
  const { user, updateProfile, isLoading: authLoading } = useAuth()
  const { success, error } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [interestedProducts, setInterestedProducts] = useState<string[]>([])
  const [interestedProductsData, setInterestedProductsData] = useState<Product[]>([])
  const [loadingInterests, setLoadingInterests] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: '台灣',
    },
  })

  // 載入訂單資料
  const loadOrders = useCallback(async () => {
    if (!user) return

    setLoadingOrders(true)
    setOrdersError(null)

    try {
      const response = await fetch('/api/orders?limit=10')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setOrders(result.data.orders || [])
        } else {
          throw new Error(result.message || '載入訂單失敗')
        }
      } else {
        throw new Error('載入訂單失敗')
      }
    } catch (error) {
      logger.error('Error loading orders', error as Error, {
        metadata: { userId: user?.id },
      })
      setOrdersError('載入訂單失敗，請稍後再試')
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [user])

  // 初始化表單資料
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || '台灣',
        },
      })
    }
  }, [user])

  // 處理 URL 參數中的標籤切換
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'orders', 'interests'].includes(tab)) {
      setActiveTab(tab)
    } else if (!tab) {
      // 沒有 tab 參數時預設為 profile 標籤
      setActiveTab('profile')
    }
  }, [searchParams.get('tab')])

  const loadInterestedProducts = useCallback(async () => {
    if (!user) return

    try {
      // 從資料庫載入興趣清單
      const productIds = await UserInterestsService.getUserInterests(user.id)
      setInterestedProducts(productIds)

      // 獲取產品資料
      if (productIds.length > 0) {
        fetchInterestedProductsData(productIds)
      }
    } catch (error) {
      logger.error('Error loading interested products', error as Error, {
        metadata: { userId: user?.id },
      })
      setInterestedProducts([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]) // fetchInterestedProductsData 穩定，不需要在依賴中

  // 載入興趣清單和訂單
  useEffect(() => {
    if (user) {
      loadInterestedProducts()
      loadOrders()
    }
  }, [user, loadInterestedProducts, loadOrders])

  // 取消訂單
  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: '使用者主動取消',
        }),
      })

      if (response.ok) {
        success('訂單取消成功', '訂單已成功取消')
        // 重新載入訂單列表
        loadOrders()
      } else {
        const errorData = await response.json()
        error('取消失敗', errorData.message || '取消訂單失敗，請稍後再試')
      }
    } catch (cancelError) {
      logger.error('Error canceling order', cancelError as Error, {
        metadata: { orderId },
      })
      error('取消失敗', '取消訂單失敗，請稍後再試')
    }
  }

  const fetchInterestedProductsData = async (productIds: string[]) => {
    setLoadingInterests(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const result = await response.json()

        // 處理統一 API 回應格式
        const allProducts = result.data || result

        // 確保 allProducts 是陣列
        if (!Array.isArray(allProducts)) {
          logger.error('API 回應格式錯誤：data 不是陣列', new Error('Invalid API response'), {
            metadata: { response: result },
          })
          setInterestedProductsData([])
          return
        }

        const filteredProducts = allProducts.filter(
          (product: Product) => productIds.includes(product.id) && product.isActive
        )
        setInterestedProductsData(filteredProducts)
      }
    } catch (error) {
      logger.error('Error fetching interested products', error as Error, {
        metadata: { userId: user?.id },
      })
    } finally {
      setLoadingInterests(false)
    }
  }

  const removeFromInterests = async (productId: string, productName: string) => {
    if (!user) return

    // 立即更新 UI
    const newInterestedProducts = interestedProducts.filter(id => id !== productId)
    setInterestedProducts(newInterestedProducts)
    setInterestedProductsData(prev => prev.filter(product => product.id !== productId))

    // 從資料庫移除
    const success = await UserInterestsService.removeInterest(user.id, productId)
    if (!success) {
      // 如果移除失敗，恢復原狀態
      setInterestedProducts(interestedProducts)
      // 重新載入產品資料
      if (interestedProducts.length > 0) {
        fetchInterestedProductsData(interestedProducts)
      }
      error('移除失敗', '無法從興趣清單中移除產品，請稍後再試')
      return
    }

    // 觸發自定義事件通知其他元件更新
    window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))

    // 顯示提示
    const notification = document.createElement('div')
    notification.textContent = `已從興趣清單移除 ${productName}`
    notification.className =
      'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    document.body.appendChild(notification)
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 2000)
  }

  // 路由保護
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      })

      setIsEditing(false)
      success('資料更新成功', '您的個人資料已更新')
    } catch (updateError) {
      logger.error('Profile update failed', updateError as Error, {
        metadata: { userId: user?.id },
      })
      error('更新失敗', '請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待確認'
      case 'confirmed':
        return '已確認'
      case 'processing':
        return '處理中'
      case 'shipped':
        return '已出貨'
      case 'delivered':
        return '已送達'
      case 'cancelled':
        return '已取消'
      case 'refunded':
        return '已退款'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-600 bg-orange-100'
      case 'confirmed':
        return 'text-blue-600 bg-blue-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'shipped':
        return 'text-purple-600 bg-purple-100'
      case 'delivered':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      case 'refunded':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  // 處理標籤切換並同步 URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/profile?tab=${tab}`, { scroll: false })
  }

  if (authLoading) {
    return <ProfilePageLoading />
  }

  if (!user) {
    return null // 會被路由保護重定向
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
                    有興趣的產品 ({interestedProducts.length})
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* 主要內容 */}
          <div className="lg:col-span-3">
            {/* 個人資料 Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">個人資料</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      編輯資料
                    </button>
                  ) : (
                    <div className="space-x-6">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <LoadingButton
                        loading={isSaving}
                        onClick={handleSave}
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
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-600 text-sm">
                        ({isEditing ? '無法修改' : '聯絡用信箱'})
                      </p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
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
                          onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          placeholder="請輸入城市"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.city || '未設定'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        街道地址
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          placeholder="請輸入詳細地址"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.street || '未設定'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        郵遞區號
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address.postalCode"
                          value={formData.address.postalCode}
                          onChange={handleInputChange}
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
            )}

            {/* 訂單記錄 Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">訂單記錄</h2>
                  <button
                    onClick={loadOrders}
                    className="px-4 py-2 text-amber-900 hover:text-amber-700 transition-colors"
                    disabled={loadingOrders}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="text-center py-12">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">載入中...</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                      <svg
                        className="w-16 h-16 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">{ordersError}</p>
                    <button
                      onClick={loadOrders}
                      className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      重新載入
                    </button>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              訂單 {order.orderNumber}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                            </p>
                            {order.trackingNumber && (
                              <p className="text-sm text-blue-600 mt-1">
                                物流追蹤: {order.trackingNumber}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {item.productImage && (
                                    <img
                                      src={item.productImage}
                                      alt={item.productName}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <span className="font-medium">{item.productName}</span>
                                    {item.priceUnit && (
                                      <span className="text-sm text-gray-500 ml-2">
                                        ({item.priceUnit})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 ml-10">
                                  NT$ {item.unitPrice.toLocaleString()} x {item.quantity}
                                </div>
                              </div>
                              <span className="font-medium">
                                NT$ {item.subtotal.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>商品小計</span>
                            <span>NT$ {order.subtotal.toLocaleString()}</span>
                          </div>
                          {order.shippingFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>運費</span>
                              <span>NT$ {order.shippingFee.toLocaleString()}</span>
                            </div>
                          )}
                          {order.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>稅費</span>
                              <span>NT$ {order.tax.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-semibold border-t pt-2">
                            <span>總計</span>
                            <span className="text-lg text-amber-900">
                              NT$ {order.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* 訂單操作 */}
                        {order.status === 'pending' || order.status === 'confirmed' ? (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                if (confirm('確定要取消這個訂單嗎？')) cancelOrder(order.id)
                              }}
                              className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              取消訂單
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
                    <p className="text-gray-600 mb-4">尚無訂單記錄</p>
                    <p className="text-gray-500 text-sm">很快就會有您的第一個訂單了</p>
                  </div>
                )}
              </div>
            )}

            {/* 有興趣的產品 Tab */}
            {activeTab === 'interests' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">有興趣的產品</h2>
                  <Link
                    href="/products"
                    className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    繼續購物
                  </Link>
                </div>

                {loadingInterests ? (
                  <div className="text-center py-12">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">載入中...</p>
                  </div>
                ) : interestedProductsData.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interestedProductsData.map(product => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-w-16 aspect-h-9">
                          <OptimizedImage
                            src={product.images?.[0] || '/images/placeholder.jpg'}
                            alt={product.name}
                            width={400}
                            height={225}
                            className="object-cover w-full h-48"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-amber-600 mb-1">{product.category}</div>
                          <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.description}
                          </p>

                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-xl font-bold text-amber-900">
                                NT$ {product.price?.toLocaleString()}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  NT$ {product.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.inventory > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.inventory > 0 ? '有庫存' : '缺貨'}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href="/products"
                              className="flex-1 px-3 py-2 bg-amber-900 text-white text-sm rounded-lg hover:bg-amber-800 transition-colors text-center"
                            >
                              查看詳情
                            </Link>
                            <button
                              onClick={() => removeFromInterests(product.id, product.name)}
                              className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                              title="移除興趣"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
                    <p className="text-gray-600 mb-4">尚無有興趣的產品</p>
                    <p className="text-gray-500 text-sm mb-6">
                      在產品頁面點擊愛心圖示來添加您感興趣的產品
                    </p>
                    <Link
                      href="/products"
                      className="inline-block px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      開始探索產品
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 主要導出函數，使用 Suspense 包裝
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageLoading />}>
      <ProfilePageContent />
    </Suspense>
  )
}
