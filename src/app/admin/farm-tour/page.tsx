'use client'

import { useState, useEffect } from 'react'
import { FarmTourActivity } from '@/types/farmTour'
import Link from 'next/link'
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
      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error('Error fetching farm tour activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此體驗活動嗎？')) return
    
    try {
      await fetch(`/api/farm-tour/${id}`, { method: 'DELETE' })
      setActivities(activities.filter(activity => activity.id !== id))
    } catch (error) {
      console.error('Error deleting activity:', error)
      alert('刪除失敗')
    }
  }

  const toggleAvailability = async (id: string, available: boolean) => {
    try {
      const response = await fetch(`/api/farm-tour/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !available })
      })
      
      if (response.ok) {
        setActivities(activities.map(activity => 
          activity.id === id ? { ...activity, available: !available } : activity
        ))
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('更新狀態失敗')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
          <div className="space-x-4">
            {user?.role === 'admin' && (
              <Link 
                href="/admin/farm-tour/add"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                新增體驗活動
              </Link>
            )}
            <Link 
              href="/farm-tour"
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              查看果園頁面
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Activity Preview */}
              <div className="bg-gradient-to-br from-green-100 to-amber-100 p-6 text-center">
                <div className="text-4xl mb-3">{activity.image}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{activity.title}</h3>
                <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
                  <span className="bg-white px-2 py-1 rounded-full">{activity.season}</span>
                  <span className="bg-white px-2 py-1 rounded-full">{activity.months}</span>
                </div>
              </div>

              {/* Activity Details */}
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-amber-600 font-medium mb-2">{activity.highlight}</p>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    activity.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.available ? '✅ 開放預約' : '❌ 暫停開放'}
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
                  <div className="text-center text-gray-400 text-sm py-2">
                    需要管理員權限
                  </div>
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
              <div className="text-3xl mr-4">🌱</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
                <div className="text-sm text-gray-500">總體驗活動</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
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
              <div className="text-3xl mr-4">🗓️</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(activities.map(a => a.season)).size}
                </div>
                <div className="text-sm text-gray-500">季節類別</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}