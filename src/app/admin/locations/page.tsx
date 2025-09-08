'use client'

import { useState, useEffect } from 'react'
import { Location } from '@/types/location'
import Link from 'next/link'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'
import AdminProtection from '@/components/AdminProtection'

// 驗證圖片 URL 是否有效（避免 emoji 或無效 URL 傳遞給 img 標籤）
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false
  // 檢查是否包含 emoji 字符
  const emojiRegex =
    /[\u{1F000}-\u{1F9FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  if (emojiRegex.test(url)) return false
  // 檢查是否為有效的相對或絕對路徑
  return (
    url.startsWith('/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  )
}

export default function LocationsAdmin() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const result = await response.json()

      // 處理統一 API 回應格式
      const data = result.data || result

      // 確保 data 是陣列
      if (Array.isArray(data)) {
        setLocations(data)
        logger.info('門市資料載入成功', { metadata: { count: data.length } })
      } else {
        logger.error('API 回應格式錯誤：locations data 不是陣列', result)
        setLocations([])
      }
    } catch (error) {
      logger.error(
        'Error fetching locations:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!user) {
      alert('請先登入')
      return
    }

    if (!confirm('確定要刪除此門市嗎？')) return

    try {
      await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      setLocations(locations.filter(l => l.id !== id))
    } catch (error) {
      logger.error(
        'Error deleting location:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert('刪除失敗')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 頁面標題和操作按鈕 */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">門市管理</h1>

              {/* 操作按鈕組 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/locations/add"
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    新增門市
                  </Link>
                )}
                <Link
                  href="/locations"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  查看門市頁面
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  回到首頁
                </Link>
              </div>
            </div>
          </div>

          {/* 門市列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {locations.map(location => (
              <div
                key={location.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-amber-300"
              >
                {/* Location Header */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center relative border-b border-gray-100">
                  <div className="mb-4">
                    {location.image ? (
                      isValidImageUrl(location.image) ? (
                        <Image
                          src={location.image}
                          alt={location.title}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-xl mx-auto border-2 border-white shadow-md"
                        />
                      ) : (
                        // 當圖片是 emoji 或無效 URL 時，顯示 emoji 或佔位符
                        <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center border-2 border-amber-200 shadow-md">
                          <span className="text-3xl">
                            {location.image.includes('🏔️')
                              ? '🏔️'
                              : location.image.includes('🏪')
                                ? '🏪'
                                : location.image.includes('🏢')
                                  ? '🏢'
                                  : '🏪'}
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto flex items-center justify-center border-2 border-gray-200 shadow-md">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{location.title}</h3>
                  <div className="text-sm font-medium text-gray-600 bg-white bg-opacity-60 rounded-full px-3 py-1">
                    {location.name}
                  </div>
                  {location.isMain && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      總店
                    </span>
                  )}
                </div>

                {/* Location Details */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg
                          className="w-3 h-3 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700 flex-1">{location.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{location.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{location.hours}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{location.closedDays}</span>
                    </div>
                  </div>

                  {/* Features Preview */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      特色服務
                    </h4>
                    <div className="space-y-2">
                      {location.features.slice(0, 2).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                      {location.features.length > 2 && (
                        <div className="text-xs text-gray-500 pl-3.5">
                          ...等 {location.features.length} 項服務
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      主打商品
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {location.specialties.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200"
                        >
                          {specialty}
                        </span>
                      ))}
                      {location.specialties.length > 3 && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                          +{location.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  {user?.role === 'admin' ? (
                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                      <Link
                        href={`/admin/locations/${location.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        編輯
                      </Link>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        刪除
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-sm py-4 border-t border-gray-100">
                      <svg
                        className="w-5 h-5 mx-auto mb-1 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      需要管理員權限
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 空狀態 */}
          {locations.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">尚無門市資料</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                還沒有新增任何門市據點。開始新增第一個門市來管理您的業務據點吧！
              </p>
              {user?.role === 'admin' && (
                <Link
                  href="/admin/locations/add"
                  className="inline-flex items-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  新增第一個門市
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminProtection>
  )
}
