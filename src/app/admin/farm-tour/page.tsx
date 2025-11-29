'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { deleteFarmTourAction, toggleFarmTourAvailabilityAction } from '@/app/actions/farm-tour'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { useAuth } from '@/contexts/AuthContext'
import { fetchFarmTourActivities } from '@/lib/api/farm-tour-api'
import { logger } from '@/lib/logger'
import { formatDate as formatDateUtil } from '@/lib/utils/formatters'
import { FarmTourActivity } from '@/types/farmTour'

export default function FarmTourAdmin() {
  const [activities, setActivities] = useState<FarmTourActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [_isPending, startTransition] = useTransition()
  const { user } = useAuth()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const data = await fetchFarmTourActivities()
      setActivities(data)
    } catch (error) {
      logger.error(
        'Error fetching farm tour activities:',
        error instanceof Error ? error : new Error('Unknown error')
      )
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此體驗活動嗎？此操作將同時刪除相關圖片且無法復原。')) return

    startTransition(async () => {
      try {
        const result = await deleteFarmTourAction(id)

        if (result.success) {
          setActivities(activities.filter(activity => activity.id !== id))
          alert(result.message || '體驗活動已刪除')
        } else {
          alert(result.error?.message || '刪除失敗')
        }
      } catch (err) {
        logger.error(
          'Error deleting activity:',
          err instanceof Error ? err : new Error('Unknown error')
        )
        alert(err instanceof Error ? err.message : '刪除失敗')
      }
    })
  }

  const toggleAvailability = async (id: string, available: boolean) => {
    // 樂觀更新
    setActivities(
      activities.map(activity =>
        activity.id === id ? { ...activity, available: !available } : activity
      )
    )

    startTransition(async () => {
      try {
        const result = await toggleFarmTourAvailabilityAction(id, !available)

        if (!result.success) {
          // 回滾樂觀更新
          setActivities(
            activities.map(activity => (activity.id === id ? { ...activity, available } : activity))
          )
          alert(result.error?.message || '更新狀態失敗')
        }
      } catch (err) {
        // 回滾樂觀更新
        setActivities(
          activities.map(activity => (activity.id === id ? { ...activity, available } : activity))
        )
        logger.error(
          'Error updating availability:',
          err instanceof Error ? err : new Error('Unknown error')
        )
        alert(err instanceof Error ? err.message : '更新狀態失敗')
      }
    })
  }

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString, 'medium')
  }

  if (loading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center text-gray-900 dark:text-gray-100">載入中...</div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  農場導覽管理
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">管理農場導覽活動和體驗預約</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/farm-tour/add"
                    className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                  >
                    新增體驗活動
                  </Link>
                )}
                <Link
                  href="/admin/farm-tour/calendar"
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                >
                  預約行事曆
                </Link>
                <Link
                  href="/farm-tour"
                  className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors text-sm"
                >
                  查看果園頁面
                </Link>
                <Link
                  href="/"
                  className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  回到首頁
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-600"
              >
                {/* Activity Preview */}
                <div className="relative h-48 bg-gradient-to-br from-green-100 to-amber-100 dark:from-green-900/30 dark:to-amber-900/30">
                  {/* 圖片層 */}
                  {activity.image && (
                    <Image
                      src={activity.image}
                      alt={activity.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {activity.note}
                      </p>
                    </div>
                  )}

                  {/* Status */}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.available
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {activity.available ? '開放預約' : '暫停開放'}
                    </div>
                  </div>

                  {/* Activities List Preview */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      活動內容
                    </h4>
                    <div className="space-y-1">
                      {activity.activities.slice(0, 3).map((act, index) => (
                        <div
                          key={index}
                          className="flex items-center text-xs text-gray-600 dark:text-gray-300"
                        >
                          <span className="mr-1 text-green-500 dark:text-green-400">•</span>
                          <span>{act}</span>
                        </div>
                      ))}
                      {activity.activities.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ...等 {activity.activities.length} 項活動
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    建立：{formatDate(activity.createdAt)}
                  </div>

                  {/* Controls */}
                  {user?.role === 'admin' ? (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/farm-tour/${activity.id}/edit`}
                          className="flex-1 bg-amber-600 dark:bg-amber-700 text-white px-3 py-2 rounded text-sm text-center hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
                        >
                          編輯
                        </Link>
                        <button
                          onClick={() => toggleAvailability(activity.id, activity.available)}
                          className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                            activity.available
                              ? 'bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-600'
                              : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
                          }`}
                        >
                          {activity.available ? '停用' : '啟用'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="w-full bg-red-600 dark:bg-red-700 text-white px-3 py-2 rounded text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      >
                        刪除活動
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">
                      需要管理員權限
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">尚無體驗活動</p>
              {user?.role === 'admin' && (
                <Link
                  href="/admin/farm-tour/add"
                  className="inline-block bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                >
                  新增第一個體驗活動
                </Link>
              )}
            </div>
          )}

          {/* 統計資訊 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
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
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {activities.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">總體驗活動</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
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
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {activities.filter(a => a.available).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">開放預約</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {activities.filter(a => a.price && a.price > 0).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">付費活動</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtection>
  )
}
