import { useState, useCallback } from 'react'
import type { InquiryWithItems } from '@/types/inquiry'
import type { InquiryPriority, AssigneeRole, InquiryAssignment } from '@/hooks/useInquiryWorkflow'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/hooks/useInquiryWorkflow'

interface InquiryAssignee {
  id: string
  name: string
  role: AssigneeRole
  email: string
  specialties?: string[]
}

interface WorkflowResult {
  processedRules: Array<{ id: string; name: string }>
  actions: {
    priority: InquiryPriority
    dueHours: number
    shouldNotify: boolean
    autoAssign: {
      assignee_id: string
      assignee_name: string
      role: AssigneeRole
    } | null
  }
  wasAssigned: boolean
}

interface AssignmentPanelProps {
  inquiry: InquiryWithItems
  availableAssignees: InquiryAssignee[]
  currentAssignment: InquiryAssignment | null
  userEmail: string | undefined
  onAssign: (
    inquiryId: string,
    assigneeId: string,
    assigneeName: string,
    assigneeRole: AssigneeRole,
    assignedBy: string,
    options?: {
      priority?: InquiryPriority
      notes?: string
      dueHours?: number
    }
  ) => InquiryAssignment
  onUpdateAssignmentStatus: (
    assignmentId: string,
    status: 'assigned' | 'in_progress' | 'completed'
  ) => void
  onProcessWorkflow: (inquiry: InquiryWithItems) => WorkflowResult
  onGetAssigneeWorkload: (assigneeId: string) => {
    total: number
    byPriority: Record<string, number>
  }
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onWarning: (message: string) => void
}

/**
 * 詢問單分配管理面板元件
 * 處理指派處理人員、設定優先級和工作流程
 */
export function AssignmentPanel({
  inquiry,
  availableAssignees,
  currentAssignment,
  userEmail,
  onAssign,
  onUpdateAssignmentStatus,
  onProcessWorkflow,
  onGetAssigneeWorkload,
  onSuccess,
  onError,
  onWarning,
}: AssignmentPanelProps) {
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<InquiryPriority>('normal')
  const [assignmentNotes, setAssignmentNotes] = useState('')

  const handleTogglePanel = useCallback(() => {
    setShowAssignmentPanel(!showAssignmentPanel)
    if (!showAssignmentPanel) {
      setSelectedAssignee('')
      setSelectedPriority('normal')
      setAssignmentNotes('')
    }
  }, [showAssignmentPanel])

  const handleProcessWorkflow = useCallback(() => {
    const workflowResult = onProcessWorkflow(inquiry)
    if (workflowResult.wasAssigned) {
      onSuccess('已根據規則自動分配處理人員')
    } else {
      onWarning(`已套用 ${workflowResult.processedRules.length} 條規則，但無自動分配設定`)
    }
  }, [inquiry, onProcessWorkflow, onSuccess, onWarning])

  const handleConfirmAssignment = useCallback(() => {
    if (!selectedAssignee) {
      onError('必須選擇一位處理人員才能進行分配')
      return
    }

    const assignee = availableAssignees.find(a => a.id === selectedAssignee)
    if (!assignee) return

    try {
      onAssign(inquiry.id, assignee.id, assignee.name, assignee.role, userEmail || 'admin', {
        priority: selectedPriority,
        notes: assignmentNotes || undefined,
        dueHours:
          selectedPriority === 'urgent'
            ? 1
            : selectedPriority === 'high'
              ? 4
              : selectedPriority === 'normal'
                ? 24
                : 72,
      })

      onSuccess(`詢價單已分配給 ${assignee.name}`)

      setSelectedAssignee('')
      setSelectedPriority('normal')
      setAssignmentNotes('')
      setShowAssignmentPanel(false)
    } catch (error) {
      onError(error instanceof Error ? error.message : '分配時發生錯誤')
    }
  }, [
    selectedAssignee,
    availableAssignees,
    inquiry.id,
    userEmail,
    selectedPriority,
    assignmentNotes,
    onAssign,
    onSuccess,
    onError,
  ])

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">分配管理</h3>
        <button
          onClick={handleTogglePanel}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAssignmentPanel
              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              : 'bg-purple-900 text-white hover:bg-purple-800'
          }`}
        >
          {showAssignmentPanel ? '收起分配面板' : '管理分配'}
        </button>
      </div>

      {/* 當前分配狀態 */}
      {currentAssignment ? (
        <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-purple-900">當前分配</h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">處理人員：</span> {currentAssignment.assignee_name}
                </p>
                <p className="text-sm text-purple-800">
                  <span className="font-medium">優先級：</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      PRIORITY_COLORS[currentAssignment.priority]
                    }`}
                  >
                    {PRIORITY_LABELS[currentAssignment.priority]}
                  </span>
                </p>
                <p className="text-sm text-purple-800">
                  <span className="font-medium">分配時間：</span>
                  {new Date(currentAssignment.assigned_at).toLocaleString('zh-TW')}
                </p>
                {currentAssignment.due_date && (
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">截止時間：</span>
                    <span
                      className={`ml-1 ${
                        new Date(currentAssignment.due_date) < new Date()
                          ? 'text-red-600 font-medium'
                          : 'text-purple-800'
                      }`}
                    >
                      {new Date(currentAssignment.due_date).toLocaleString('zh-TW')}
                    </span>
                    {new Date(currentAssignment.due_date) < new Date() && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        已逾期
                      </span>
                    )}
                  </p>
                )}
                {currentAssignment.notes && (
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">備註：</span> {currentAssignment.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <select
                value={currentAssignment.status}
                onChange={e => {
                  onUpdateAssignmentStatus(
                    currentAssignment.id,
                    e.target.value as 'assigned' | 'in_progress' | 'completed'
                  )
                }}
                className="px-3 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="assigned">已分配</option>
                <option value="in_progress">處理中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center text-gray-600">
            <p className="font-medium">尚未分配處理人員</p>
            <p className="text-sm mt-1">點擊「管理分配」來指派處理人員</p>
          </div>
        </div>
      )}

      {showAssignmentPanel && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 選擇處理人員 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">指派處理人員</label>
              <select
                value={selectedAssignee}
                onChange={e => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">選擇處理人員...</option>
                {availableAssignees.map(assignee => {
                  const workload = onGetAssigneeWorkload(assignee.id)
                  return (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name} ({assignee.role}) - {workload.total} 件處理中
                    </option>
                  )
                })}
              </select>
            </div>

            {/* 設定優先級 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">優先級</label>
              <select
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value as InquiryPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 分配備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分配備註</label>
            <textarea
              value={assignmentNotes}
              onChange={e => setAssignmentNotes(e.target.value)}
              placeholder="輸入分配相關備註或特殊說明..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* 執行分配 */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleProcessWorkflow}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              套用工作流程規則
            </button>

            <button
              onClick={handleConfirmAssignment}
              disabled={!selectedAssignee}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              確認分配
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
