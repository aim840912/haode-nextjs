'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminProtection from '@/components/features/admin/AdminProtection'
import {
  BugAntIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  FunnelIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline'
import {
  DevNote,
  DevNoteStats,
  DevNoteType,
  DevNoteStatus,
  DevNotePriority,
  DevNoteInput,
} from '@/types/devNote'
import { apiLogger } from '@/lib/logger'

export default function DevNotesPage() {
  const [notes, setNotes] = useState<DevNote[]>([])
  const [stats, setStats] = useState<DevNoteStats | null>(null)
  const [loading, setLoading] = useState(true)

  // 篩選狀態
  const [typeFilter, setTypeFilter] = useState<DevNoteType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DevNoteStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<DevNotePriority | 'all'>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, priorityFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // 載入統計
      const statsRes = await fetch('/api/admin/dev-notes/stats')
      const statsData = await statsRes.json()
      setStats(statsData.data)

      // 載入列表
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)

      const notesRes = await fetch(`/api/admin/dev-notes?${params}`)
      const notesData = await notesRes.json()
      setNotes(notesData.data)
    } catch (error) {
      apiLogger.error('開發筆記載入失敗', error as Error, {
        module: 'DevNotesPage',
        action: 'loadDevNotes',
        metadata: { typeFilter, statusFilter, priorityFilter },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-100"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">開發筆記</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Bug 追蹤與待辦事項管理
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>新增筆記</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 統計卡片 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="總計"
                value={stats.total}
                icon={ClipboardDocumentListIcon}
                color="blue"
              />
              <StatCard title="進行中" value={stats.in_progress} icon={BugAntIcon} color="yellow" />
              <StatCard
                title="已完成"
                value={stats.completed}
                icon={ClipboardDocumentListIcon}
                color="green"
              />
              <StatCard
                title="高優先級"
                value={stats.by_priority.high + stats.by_priority.urgent}
                icon={BugAntIcon}
                color="red"
              />
            </div>
          )}

          {/* 篩選器 */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as DevNoteType | 'all')}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">所有類型</option>
                <option value="bug">Bug</option>
                <option value="todo">待辦</option>
                <option value="feature">新功能</option>
                <option value="improvement">改進</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as DevNoteStatus | 'all')}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">所有狀態</option>
                <option value="pending">待處理</option>
                <option value="in_progress">進行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as DevNotePriority | 'all')}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">所有優先級</option>
                <option value="urgent">緊急</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          {/* 列表 */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">載入中...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">暫無記錄</div>
            ) : (
              notes.map(note => <NoteCard key={note.id} note={note} onUpdate={loadData} />)
            )}
          </div>
        </div>
      </div>

      {/* 新增 Modal */}
      {showCreateModal && (
        <CreateNoteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadData()
          }}
        />
      )}
    </AdminProtection>
  )
}

// 統計卡片元件
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'yellow' | 'green' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}

// 新增筆記 Modal 元件
function CreateNoteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<DevNoteInput>({
    title: '',
    description: '',
    type: 'bug',
    priority: 'medium',
    status: 'pending',
    tags: [],
  })
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 驗證
    if (!formData.title.trim()) {
      setError('標題不可為空')
      return
    }

    setSubmitting(true)
    try {
      // 處理標籤
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const response = await fetch('/api/admin/dev-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tags.length > 0 ? tags : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || '建立失敗')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗,請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">新增開發筆記</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-300"
              disabled={submitting}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入標題"
              disabled={submitting}
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入詳細描述"
              disabled={submitting}
            />
          </div>

          {/* 類型、優先級、狀態 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                類型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as DevNoteType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="bug">Bug</option>
                <option value="todo">待辦</option>
                <option value="feature">新功能</option>
                <option value="improvement">改進</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先級 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={e =>
                  setFormData({ ...formData, priority: e.target.value as DevNotePriority })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select
                value={formData.status}
                onChange={e =>
                  setFormData({ ...formData, status: e.target.value as DevNoteStatus })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="pending">待處理</option>
                <option value="in_progress">進行中</option>
              </select>
            </div>
          </div>

          {/* 標籤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">標籤 (逗號分隔)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如: frontend, urgent, bug-fix"
              disabled={submitting}
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? '建立中...' : '建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 筆記卡片元件
function NoteCard({ note, onUpdate }: { note: DevNote; onUpdate?: () => void }) {
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')

  const cardBgColors: Record<DevNoteType, string> = {
    bug: 'bg-red-100 border-red-400',
    todo: 'bg-blue-100 border-blue-400',
    feature: 'bg-purple-100 border-purple-400',
    improvement: 'bg-green-100 border-green-400',
  }

  const typeColors: Record<DevNoteType, string> = {
    bug: 'bg-red-100 text-red-800',
    todo: 'bg-blue-100 text-blue-800',
    feature: 'bg-purple-100 text-purple-800',
    improvement: 'bg-green-100 text-green-800',
  }

  const priorityColors: Record<DevNotePriority, string> = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-gray-500 text-white',
  }

  const statusColors: Record<DevNoteStatus, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const handleToggleStatus = async () => {
    setError('')
    setCompleting(true)

    // 根據當前狀態決定新狀態
    const isCompleted = note.status === 'completed'
    const newStatus = isCompleted ? 'pending' : 'completed'
    const completedAt = isCompleted ? null : new Date().toISOString()

    try {
      const response = await fetch(`/api/admin/dev-notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completed_at: completedAt,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || '更新失敗')
      }

      // 成功後刷新列表
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗，請稍後再試')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div
      className={`rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${cardBgColors[note.type]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[note.type]}`}>
              {note.type}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[note.priority]}`}
            >
              {note.priority}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[note.status]}`}>
              {note.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {note.title}
          </h3>
          {note.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">{note.description}</p>
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <div className="mt-3 text-xs text-gray-500">
            建立時間:{new Date(note.created_at).toLocaleString('zh-TW')}
          </div>
        </div>

        {/* 狀態切換按鈕 - 根據當前狀態顯示不同操作 */}
        <div className="ml-4">
          <button
            onClick={handleToggleStatus}
            disabled={completing}
            className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              note.status === 'completed'
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {note.status === 'completed' ? (
              <>
                <ArrowUturnLeftIcon className="w-4 h-4" />
                <span>{completing ? '處理中...' : '取消完成'}</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>{completing ? '處理中...' : '標記為完成'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
