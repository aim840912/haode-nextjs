'use client'

import { useState, useEffect } from 'react'
import { FarmTourActivity } from '@/types/farmTour'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'

export default function FarmTourAdmin() {
  const [activities, setActivities] = useState<FarmTourActivity[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/farm-tour')
      const result = await response.json()

      // 處理新的統一回應格式
      if (result.success && result.data) {
        setActivities(result.data) // 從 data 屬性取得活動陣列
      } else {
        // 向後相容：如果是舊格式（直接陣列）
        setActivities(Array.isArray(result) ? result : [])
      }
    } catch (error) {
      logger.error(
        'Error fetching farm tour activities:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setActivities([]) // 錯誤時設為空陣列
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此體驗活動嗎？')) return

    try {
      const response = await fetch(`/api/farm-tour/${id}`, { method: 'DELETE' })
      const result = await response.json()

      if (result.success) {
        setActivities(activities.filter(activity => activity.id !== id))
      } else {
        throw new Error(result.error || '刪除失敗')
      }
    } catch (error) {
      logger.error(
        'Error deleting activity:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert(error instanceof Error ? error.message : '刪除失敗')
    }
  }

  const toggleAvailability = async (id: string, available: boolean) => {
    try {
      const response = await fetch(`/api/farm-tour/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !available }),
      })
      const result = await response.json()

      if (result.success) {
        setActivities(
          activities.map(activity =>
            activity.id === id ? { ...activity, available: !available } : activity
          )
        )
      } else {
        throw new Error(result.error || '更新狀態失敗')
      }
    } catch (error) {
      logger.error(
        'Error updating availability:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      alert(error instanceof Error ? error.message : '更新狀態失敗')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">觀光果園管理</h1>
          <div className="flex flex-wrap gap-3">
            {user?.role === 'admin' && (
              <Link
                href="/admin/farm-tour/add"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                新增體驗活動
              </Link>
            )}
            <Link
              href="/admin/farm-tour/calendar"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              預約行事曆
            </Link>
            <Link
              href="/farm-tour"
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              查看果園頁面
            </Link>
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              回到首頁
            </Link>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activities.map(activity => (
            <div
              key={activity.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Activity Preview */}
              <div className="relative h-48 bg-gradient-to-br from-green-100 to-amber-100">
                {/* 圖片層 */}
                {activity.image && (
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* 漸層遮罩層 - 只在有圖片時顯示 */}
                {activity.image && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                )}

                {/* 文字內容層 */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                    {activity.title}
                  </h3>
                  <div className="flex justify-center items-center gap-2 text-sm">
                    <span className="bg-white/90 text-gray-800 px-2 py-1 rounded-full backdrop-blur-sm">
                      {activity.start_month}月 - {activity.end_month}月
                    </span>
                    <span className="bg-white/90 text-gray-800 px-2 py-1 rounded-full backdrop-blur-sm">
                      NT$ {activity.price || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="p-4">
                {activity.note && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{activity.note}</p>
                  </div>
                )}

                {/* Status */}
                <div className="mb-4">
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activity.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {activity.available ? '開放預約' : '暫停開放'}
                  </div>
                </div>

                {/* Activities List Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">活動內容</h4>
                  <div className="space-y-1">
                    {activity.activities.slice(0, 3).map((act, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <span className="mr-1 text-green-500">•</span>
                        <span>{act}</span>
                      </div>
                    ))}
                    {activity.activities.length > 3 && (
                      <div className="text-xs text-gray-500">
                        ...等 {activity.activities.length} 項活動
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  建立：{formatDate(activity.createdAt)}
                </div>

                {/* Controls */}
                {user?.role === 'admin' ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/farm-tour/${activity.id}/edit`}
                        className="flex-1 bg-amber-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-amber-700 transition-colors"
                      >
                        編輯
                      </Link>
                      <button
                        onClick={() => toggleAvailability(activity.id, activity.available)}
                        className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                          activity.available
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {activity.available ? '停用' : '啟用'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      刪除活動
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-2">需要管理員權限</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">尚無體驗活動</p>
            {user?.role === 'admin' && (
              <Link
                href="/admin/farm-tour/add"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                新增第一個體驗活動
              </Link>
            )}
          </div>
        )}

        {/* 統計資訊 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
                <div className="text-sm text-gray-500">總體驗活動</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.available).length}
                </div>
                <div className="text-sm text-gray-500">開放預約</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activities.filter(a => a.price && a.price > 0).length}
                </div>
                <div className="text-sm text-gray-500">付費活動</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
