'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { logger } from '@/lib/logger'

interface Moment {
  id: string
  title: string
  description?: string
  content?: string
  category: string
  year: number
  is_featured: boolean
  images: string[]
  created_at: string
  updated_at: string
}

interface AdminMomentsTableProps {
  onDelete?: (id: string) => void
  refreshTrigger?: number
}

export default function AdminMomentsTable({ onDelete, refreshTrigger }: AdminMomentsTableProps) {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'created_at'>('created_at')

  const fetchMoments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/moments')
      if (!response.ok) {
        throw new Error('載入精彩時刻失敗')
      }

      const data = await response.json()
      if (data.success) {
        // 轉換 API 回應到我們需要的格式
        const transformedMoments = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.subtitle || item.description,
          content: item.description,
          category: 'moments',
          year: new Date().getFullYear(),
          is_featured: true,
          images: [],
          created_at: item.createdAt || new Date().toISOString(),
          updated_at: item.updatedAt || new Date().toISOString(),
        }))
        setMoments(transformedMoments)
      } else {
        throw new Error(data.message || '載入精彩時刻失敗')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入精彩時刻失敗'
      setError(errorMessage)
      logger.error('載入精彩時刻失敗', error as Error, {
        metadata: { context: 'AdminMomentsTable.fetchMoments' },
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('確定要刪除這個精彩時刻嗎？此操作無法復原。')) {
        return
      }

      try {
        const response = await fetch(`/api/moments/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('刪除失敗')
        }

        // 樂觀更新 UI
        setMoments(prev => prev.filter(moment => moment.id !== id))
        onDelete?.(id)

        logger.info('精彩時刻刪除成功', {
          metadata: { momentId: id },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '刪除失敗'
        alert(errorMessage)
        logger.error('刪除精彩時刻失敗', error as Error, {
          metadata: { momentId: id },
        })
      }
    },
    [onDelete]
  )

  const handleToggleFeatured = useCallback(async (id: string, is_featured: boolean) => {
    try {
      const response = await fetch(`/api/moments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_featured: !is_featured }),
      })

      if (!response.ok) {
        throw new Error('更新失敗')
      }

      // 樂觀更新 UI
      setMoments(prev =>
        prev.map(moment => (moment.id === id ? { ...moment, is_featured: !is_featured } : moment))
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新失敗'
      alert(errorMessage)
      logger.error('更新精彩時刻失敗', error as Error, {
        metadata: { momentId: id },
      })
    }
  }, [])

  useEffect(() => {
    fetchMoments()
  }, [fetchMoments, refreshTrigger])

  // 篩選和排序
  const filteredMoments = moments
    .filter(moment => {
      const matchesSearch =
        moment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || moment.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'year':
          return b.year - a.year
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto mb-4"></div>
          <p className="text-gray-600">載入精彩時刻資料中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMoments}
            className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 篩選控制 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搜尋</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜尋標題或描述..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分類</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">全部分類</option>
              <option value="moments">精彩時刻</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="created_at">建立時間</option>
              <option value="title">標題</option>
              <option value="year">年份</option>
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-sm text-gray-600">共 {filteredMoments.length} 個項目</span>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                標題
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                年份
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                精選
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                建立時間
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMoments.map(moment => (
              <tr key={moment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{moment.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {moment.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{moment.year}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleFeatured(moment.id, moment.is_featured)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      moment.is_featured
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {moment.is_featured ? '精選' : '一般'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {new Date(moment.created_at).toLocaleDateString('zh-TW')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Link
                    href={`/admin/moments/${moment.id}/edit`}
                    className="text-amber-600 hover:text-amber-900"
                  >
                    編輯
                  </Link>
                  <button
                    onClick={() => handleDelete(moment.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMoments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合條件的精彩時刻</p>
          </div>
        )}
      </div>
    </div>
  )
}
