'use client'

import { useCallback, useState } from 'react'
import {
  useScheduleCalendar,
  type ScheduleCalendarEvent,
  type ScheduleStatus,
} from '@/hooks/useScheduleCalendar'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { StatusFilter } from './StatusFilter'
import { CalendarView } from './CalendarView'
import { CalendarLegend } from './CalendarLegend'
import { EventDetailModal } from './EventDetailModal'

export interface ScheduleCalendarProps {
  className?: string
  height?: string | number
  statusFilter?: ScheduleStatus
  onStatusFilterChange?: (filter: ScheduleStatus) => void
  hideStatusFilter?: boolean
}

export function ScheduleCalendar({
  className = '',
  height = 'auto',
  statusFilter: externalStatusFilter,
  onStatusFilterChange: externalOnChange,
  hideStatusFilter = false,
}: ScheduleCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<ScheduleCalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  const initialFilter = externalStatusFilter || 'all'
  const {
    events,
    statistics,
    loading,
    error,
    refreshData,
    statusFilter: internalStatusFilter,
    setStatusFilter: internalSetStatusFilter,
  } = useScheduleCalendar(initialFilter)

  const currentStatusFilter = externalStatusFilter ?? internalStatusFilter

  const handleStatusFilterChange = useCallback(
    (newFilter: ScheduleStatus) => {
      if (externalOnChange) {
        externalOnChange(newFilter)
      } else {
        internalSetStatusFilter(newFilter)
      }
    },
    [externalOnChange, internalSetStatusFilter]
  )

  const handleEventClick = useCallback(
    (clickInfo: { event: { id: string } }) => {
      const eventId = clickInfo.event.id
      const event = events.find(e => e.id === eventId)

      logger.debug(`擺攤行程事件被點擊: ${eventId}`)

      if (event) {
        setSelectedEvent(event)
        setShowEventModal(true)
      }
    },
    [events]
  )

  const closeEventModal = useCallback(() => {
    setShowEventModal(false)
    setSelectedEvent(null)
  }, [])

  return (
    <div className={cn('schedule-calendar', className)}>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {!hideStatusFilter && (
          <StatusFilter
            currentFilter={currentStatusFilter}
            onFilterChange={handleStatusFilterChange}
            statistics={statistics}
          />
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300">
          <strong>載入失敗：</strong>
          {error}
          <button
            onClick={refreshData}
            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            重試
          </button>
        </div>
      )}

      {loading && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-300 text-center">
          載入擺攤行程中...
        </div>
      )}

      <CalendarView events={events} height={height} onEventClick={handleEventClick} />

      <CalendarLegend />

      <EventDetailModal event={selectedEvent} isOpen={showEventModal} onClose={closeEventModal} />
    </div>
  )
}
