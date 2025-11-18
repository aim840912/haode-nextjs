'use client'

import { cn } from '@/lib/utils/cn'
import type { ScheduleStatus } from '@/hooks/useScheduleCalendar'

const statusOptions = [
  { value: 'all' as const, label: '全部狀態', color: '#6B7280' },
  { value: 'upcoming' as const, label: '即將到來', color: '#10b981' },
  { value: 'completed' as const, label: '已結束', color: '#6b7280' },
]

interface StatusFilterProps {
  currentFilter: ScheduleStatus
  onFilterChange: (filter: ScheduleStatus) => void
  statistics?: {
    total: number
    byStatus: Record<string, number>
  } | null
}

export function StatusFilter({ currentFilter, onFilterChange, statistics }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map(option => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg border transition-all duration-200',
            currentFilter === option.value
              ? 'border-transparent text-white shadow-md'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          )}
          style={{
            backgroundColor: currentFilter === option.value ? option.color : 'transparent',
          }}
        >
          {option.label}
          {statistics && (
            <span className="ml-1 text-xs">
              {option.value === 'all'
                ? `(${statistics.total})`
                : `(${statistics.byStatus[option.value] || 0})`}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
