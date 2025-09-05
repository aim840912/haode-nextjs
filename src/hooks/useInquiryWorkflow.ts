/**
 * 詢價工作流程管理 Hook
 * 提供詢價分配、優先級管理和處理流程功能
 */

import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

export type InquiryPriority = 'low' | 'normal' | 'high' | 'urgent'
export type AssigneeRole = 'sales' | 'manager' | 'support'

export interface InquiryAssignment {
  id: string
  inquiry_id: string
  assignee_id: string
  assignee_name: string
  assignee_role: AssigneeRole
  assigned_at: string
  assigned_by: string
  priority: InquiryPriority
  notes?: string
  due_date?: string
  status: 'assigned' | 'in_progress' | 'completed' | 'reassigned'
  completed_at?: string
}

export interface WorkflowRule {
  id: string
  name: string
  conditions: {
    inquiry_type?: string[]
    amount_range?: { min?: number; max?: number }
    customer_type?: string[]
    urgency?: InquiryPriority[]
  }
  actions: {
    auto_assign?: {
      assignee_id: string
      assignee_name: string
      role: AssigneeRole
    }
    set_priority?: InquiryPriority
    set_due_hours?: number
    send_notification?: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

// 預設的工作流程規則
const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'high-value-product',
    name: '高價值產品詢價',
    conditions: {
      inquiry_type: ['product'],
      amount_range: { min: 50000 },
    },
    actions: {
      set_priority: 'high',
      set_due_hours: 4,
      send_notification: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'farm-tour-auto',
    name: '農場導覽自動分配',
    conditions: {
      inquiry_type: ['farm_tour'],
    },
    actions: {
      set_priority: 'normal',
      set_due_hours: 24,
      send_notification: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'urgent-follow-up',
    name: '緊急跟進',
    conditions: {
      urgency: ['urgent'],
    },
    actions: {
      set_priority: 'urgent',
      set_due_hours: 1,
      send_notification: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// 預設處理人員列表
const DEFAULT_ASSIGNEES = [
  {
    id: 'sales-001',
    name: '王業務',
    role: 'sales' as AssigneeRole,
    email: 'sales.wang@haudetea.com',
    specialties: ['product', 'pricing'],
  },
  {
    id: 'manager-001',
    name: '林經理',
    role: 'manager' as AssigneeRole,
    email: 'manager.lin@haudetea.com',
    specialties: ['farm_tour', 'high_value'],
  },
  {
    id: 'support-001',
    name: '陳客服',
    role: 'support' as AssigneeRole,
    email: 'support.chen@haudetea.com',
    specialties: ['general', 'follow_up'],
  },
]

export const PRIORITY_LABELS: Record<InquiryPriority, string> = {
  low: '低優先級',
  normal: '一般',
  high: '高優先級',
  urgent: '緊急',
}

export const PRIORITY_COLORS: Record<InquiryPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export function useInquiryWorkflow() {
  const [assignments, setAssignments] = useState<InquiryAssignment[]>([])
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([])
  const [availableAssignees] = useState(DEFAULT_ASSIGNEES)
  const [isLoading, setIsLoading] = useState(true)

  // 從 localStorage 載入資料
  useEffect(() => {
    try {
      const savedAssignments = localStorage.getItem('inquiry_assignments')
      const savedRules = localStorage.getItem('workflow_rules')

      if (savedAssignments) {
        setAssignments(JSON.parse(savedAssignments))
      }

      if (savedRules) {
        setWorkflowRules(JSON.parse(savedRules))
      } else {
        // 第一次使用，使用預設規則
        setWorkflowRules(DEFAULT_WORKFLOW_RULES)
        localStorage.setItem('workflow_rules', JSON.stringify(DEFAULT_WORKFLOW_RULES))
      }
    } catch (error) {
      logger.error('Failed to load workflow data', error as Error)
      setWorkflowRules(DEFAULT_WORKFLOW_RULES)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 保存分配資料
  const saveAssignments = useCallback((newAssignments: InquiryAssignment[]) => {
    try {
      localStorage.setItem('inquiry_assignments', JSON.stringify(newAssignments))
      setAssignments(newAssignments)
    } catch (error) {
      logger.error('Failed to save assignments', error as Error)
    }
  }, [])

  // 保存工作流程規則
  const saveWorkflowRules = useCallback((newRules: WorkflowRule[]) => {
    try {
      localStorage.setItem('workflow_rules', JSON.stringify(newRules))
      setWorkflowRules(newRules)
    } catch (error) {
      logger.error('Failed to save workflow rules', error as Error)
    }
  }, [])

  // 分配詢價給處理人員
  const assignInquiry = useCallback(
    (
      inquiryId: string,
      assigneeId: string,
      assigneeName: string,
      assigneeRole: AssigneeRole,
      assignedBy: string,
      options: {
        priority?: InquiryPriority
        notes?: string
        dueHours?: number
      } = {}
    ): InquiryAssignment => {
      const assignment: InquiryAssignment = {
        id: `assignment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        inquiry_id: inquiryId,
        assignee_id: assigneeId,
        assignee_name: assigneeName,
        assignee_role: assigneeRole,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy,
        priority: options.priority || 'normal',
        notes: options.notes,
        due_date: options.dueHours
          ? new Date(Date.now() + options.dueHours * 60 * 60 * 1000).toISOString()
          : undefined,
        status: 'assigned',
      }

      const updatedAssignments = [...assignments, assignment]
      saveAssignments(updatedAssignments)

      logger.info('詢價已分配', {
        module: 'InquiryWorkflow',
        action: 'assignInquiry',
        metadata: {
          inquiryId,
          assigneeId,
          assigneeName,
          priority: assignment.priority,
        },
      })

      return assignment
    },
    [assignments, saveAssignments]
  )

  // 重新分配詢價
  const reassignInquiry = useCallback(
    (
      inquiryId: string,
      newAssigneeId: string,
      newAssigneeName: string,
      newAssigneeRole: AssigneeRole,
      reassignedBy: string,
      reason?: string
    ) => {
      const currentAssignment = assignments.find(
        a => a.inquiry_id === inquiryId && a.status !== 'completed'
      )

      if (currentAssignment) {
        // 標記當前分配為已重新分配
        const updatedAssignments = assignments.map(a =>
          a.id === currentAssignment.id ? { ...a, status: 'reassigned' as const } : a
        )

        // 建立新的分配
        const newAssignment = assignInquiry(
          inquiryId,
          newAssigneeId,
          newAssigneeName,
          newAssigneeRole,
          reassignedBy,
          { notes: reason }
        )

        updatedAssignments.push(newAssignment)
        saveAssignments(updatedAssignments)

        return newAssignment
      }

      return null
    },
    [assignments, assignInquiry, saveAssignments]
  )

  // 更新分配狀態
  const updateAssignmentStatus = useCallback(
    (assignmentId: string, newStatus: InquiryAssignment['status'], notes?: string) => {
      const updatedAssignments = assignments.map(assignment =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: newStatus,
              ...(notes && { notes }),
              ...(newStatus === 'completed' && { completed_at: new Date().toISOString() }),
            }
          : assignment
      )

      saveAssignments(updatedAssignments)
    },
    [assignments, saveAssignments]
  )

  // 根據工作流程規則自動處理詢價
  const processInquiryWorkflow = useCallback(
    (inquiry: { id: string; inquiry_type: string; total_estimated_amount?: number }) => {
      logger.info('開始處理詢價工作流程', {
        module: 'InquiryWorkflow',
        action: 'processWorkflow',
        metadata: { inquiryId: inquiry.id, inquiryType: inquiry.inquiry_type },
      })

      const matchingRules = workflowRules.filter(rule => {
        if (!rule.is_active) return false

        // 檢查詢價類型
        if (
          rule.conditions.inquiry_type &&
          !rule.conditions.inquiry_type.includes(inquiry.inquiry_type)
        ) {
          return false
        }

        // 檢查金額範圍
        if (rule.conditions.amount_range) {
          const totalAmount = inquiry.total_estimated_amount || 0
          const { min, max } = rule.conditions.amount_range
          if ((min && totalAmount < min) || (max && totalAmount > max)) {
            return false
          }
        }

        return true
      })

      const actions = {
        priority: 'normal' as InquiryPriority,
        dueHours: 24,
        shouldNotify: false,
        autoAssign: null as {
          assignee_id: string
          assignee_name: string
          role: AssigneeRole
        } | null,
      }

      // 執行匹配的規則動作
      matchingRules.forEach(rule => {
        if (rule.actions.set_priority) {
          actions.priority = rule.actions.set_priority
        }
        if (rule.actions.set_due_hours) {
          actions.dueHours = rule.actions.set_due_hours
        }
        if (rule.actions.send_notification) {
          actions.shouldNotify = true
        }
        if (rule.actions.auto_assign) {
          actions.autoAssign = rule.actions.auto_assign
        }
      })

      // 如果有自動分配規則，執行分配
      if (actions.autoAssign) {
        assignInquiry(
          inquiry.id,
          actions.autoAssign.assignee_id,
          actions.autoAssign.assignee_name,
          actions.autoAssign.role,
          'system',
          {
            priority: actions.priority,
            dueHours: actions.dueHours,
            notes: `自動分配 - 符合規則: ${matchingRules.map(r => r.name).join(', ')}`,
          }
        )
      }

      return {
        processedRules: matchingRules,
        actions,
        wasAssigned: !!actions.autoAssign,
      }
    },
    [workflowRules, assignInquiry]
  )

  // 取得詢價的當前分配
  const getInquiryAssignment = useCallback(
    (inquiryId: string): InquiryAssignment | null => {
      return (
        assignments.find(
          a => a.inquiry_id === inquiryId && (a.status === 'assigned' || a.status === 'in_progress')
        ) || null
      )
    },
    [assignments]
  )

  // 取得處理人員的工作負載
  const getAssigneeWorkload = useCallback(
    (assigneeId: string) => {
      const assigneeAssignments = assignments.filter(
        a => a.assignee_id === assigneeId && (a.status === 'assigned' || a.status === 'in_progress')
      )

      const byPriority = assigneeAssignments.reduce(
        (acc, assignment) => {
          acc[assignment.priority] = (acc[assignment.priority] || 0) + 1
          return acc
        },
        {} as Record<InquiryPriority, number>
      )

      const overdue = assigneeAssignments.filter(
        a => a.due_date && new Date(a.due_date) < new Date()
      ).length

      return {
        total: assigneeAssignments.length,
        byPriority,
        overdue,
        assignments: assigneeAssignments,
      }
    },
    [assignments]
  )

  // 取得到期提醒列表
  const getUpcomingDeadlines = useCallback(
    (hours: number = 24) => {
      const cutoffTime = new Date(Date.now() + hours * 60 * 60 * 1000)

      return assignments
        .filter(
          a =>
            (a.status === 'assigned' || a.status === 'in_progress') &&
            a.due_date &&
            new Date(a.due_date) <= cutoffTime
        )
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    },
    [assignments]
  )

  return {
    // 資料
    assignments,
    workflowRules,
    availableAssignees,
    isLoading,

    // 分配管理
    assignInquiry,
    reassignInquiry,
    updateAssignmentStatus,
    getInquiryAssignment,

    // 工作流程
    processInquiryWorkflow,
    saveWorkflowRules,

    // 統計和監控
    getAssigneeWorkload,
    getUpcomingDeadlines,
  }
}
