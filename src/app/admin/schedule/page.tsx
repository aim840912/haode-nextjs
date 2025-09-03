'use client'

import { useState, useEffect } from 'react'
import { ScheduleItem } from '@/types/schedule'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { useAuth } from '@/lib/auth-context'

export default function ScheduleAdmin() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const { user } = useAuth()

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/schedule')
      const result = await response.json()
      
      // 處理統一 API 回應格式
      const data = result.data || result
      
      // 確保 data 是陣列
      if (Array.isArray(data)) {
        setSchedule(data)
        logger.info('行程資料載入成功', { metadata: { count: data.length } })
      } else {
        logger.error('API 回應格式錯誤：schedule data 不是陣列', result)
        setSchedule([])
      }
    } catch (error) {
      logger.error('Error fetching schedule:', error instanceof Error ? error : new Error('Unknown error'))
      setSchedule([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此行程嗎？')) return
    
    try {
      await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
      setSchedule(schedule.filter(s => s.id !== id))
    } catch (error) {
      logger.error('Error deleting schedule:', error instanceof Error ? error : new Error('Unknown error'))
      alert('刪除失敗')
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchSchedule()
    } catch (error) {
      logger.error('Error updating status:', error instanceof Error ? error : new Error('Unknown error'))
      alert('更新失敗')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800'
      case 'ongoing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即將到來'
      case 'ongoing': return '進行中'
      case 'completed': return '已結束'
      default: return '未知'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const filteredSchedule = filterStatus === 'all' 
    ? schedule 
    : schedule.filter(item => item.status === filterStatus)

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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">擺攤行程管理</h1>
          <div className="flex flex-wrap gap-3">
            {user?.role === 'admin' && (
              <Link 
                href="/admin/schedule/add"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                新增行程
              </Link>
            )}
            <Link 
              href="/schedule/calendar"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              <span>📅</span>
              <span>預覽客戶行事曆</span>
            </Link>
            <Link 
              href="/schedule"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              查看行程頁面
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              回到首頁
            </Link>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-100'
            }`}
          >
            全部行程
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'upcoming'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-green-100'
            }`}
          >
            即將到來
          </button>
          <button
            onClick={() => setFilterStatus('ongoing')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'ongoing'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-100'
            }`}
          >
            進行中
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterStatus === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            已結束
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    行程資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    販售商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedule.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          📍 {item.location}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(item.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user?.role === 'admin' ? (
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${getStatusColor(item.status)}`}
                        >
                          <option value="upcoming">即將到來</option>
                          <option value="ongoing">進行中</option>
                          <option value="completed">已結束</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.products.slice(0, 2).map((product, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {product}
                          </span>
                        ))}
                        {item.products.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{item.products.length - 2}
                          </span>
                        )}
                      </div>
                      {item.specialOffer && (
                        <div className="text-xs text-orange-600 mt-1">
                          🎁 {item.specialOffer}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user?.role === 'admin' ? (
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/schedule/${item.id}/edit`}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            編輯
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            刪除
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">需要管理員權限</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredSchedule.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {filterStatus === 'all' ? '尚無擺攤行程' : `沒有${getStatusText(filterStatus)}的行程`}
              </p>
              {user?.role === 'admin' && (
                <Link 
                  href="/admin/schedule/add"
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  新增第一個行程
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{schedule.length}</div>
                <div className="text-sm text-gray-500">總行程數</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🔜</div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {schedule.filter(s => s.status === 'upcoming').length}
                </div>
                <div className="text-sm text-gray-500">即將到來</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🔄</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {schedule.filter(s => s.status === 'ongoing').length}
                </div>
                <div className="text-sm text-gray-500">進行中</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {schedule.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">已完成</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}