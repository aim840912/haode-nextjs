'use client'

import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

import 'react-calendar/dist/Calendar.css'

export interface CalendarEvent {
  id: string
  title: string
  start: Date | string
  end?: Date | string
  backgroundColor?: string
  textColor?: string
  extendedProps?: Record<string, unknown>
}

interface SimpleCalendarProps {
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onMonthChange?: (startDate: Date, endDate: Date) => void
  height?: string | number
  className?: string
}

export function SimpleCalendar({
  events,
  onDateClick,
  onEventClick,
  onMonthChange,
  height = 'auto',
  className,
}: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // 將事件按日期分組
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      const date = new Date(event.start)
      const key = date.toISOString().split('T')[0]
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(event)
    })
    return map
  }, [events])

  // 取得特定日期的事件
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const key = date.toISOString().split('T')[0]
    return eventsByDate.get(key) || []
  }

  // 處理日期點擊
  const handleDateClick = (date: Date) => {
    onDateClick?.(date)
  }

  // 處理月份變更
  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setCurrentDate(activeStartDate)
      const endDate = new Date(activeStartDate)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      onMonthChange?.(activeStartDate, endDate)
    }
  }

  // 自訂日期內容
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null

    const dateEvents = getEventsForDate(date)
    if (dateEvents.length === 0) return null

    const displayEvents = dateEvents.slice(0, 3)
    const hasMore = dateEvents.length > 3

    return (
      <div className="mt-1 space-y-0.5">
        {displayEvents.map(event => (
          <button
            key={event.id}
            onClick={e => {
              e.stopPropagation()
              onEventClick?.(event)
            }}
            className="w-full text-left text-xs px-1 py-0.5 rounded truncate transition-opacity hover:opacity-80"
            style={{
              backgroundColor: event.backgroundColor || '#3B82F6',
              color: event.textColor || '#FFFFFF',
            }}
            title={event.title}
          >
            {event.title}
          </button>
        ))}
        {hasMore && <div className="text-xs text-gray-500 px-1">+{dateEvents.length - 3} 更多</div>}
      </div>
    )
  }

  // 自訂日期樣式
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''

    const dateEvents = getEventsForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()

    return cn(
      'relative min-h-[80px] p-1',
      dateEvents.length > 0 && 'bg-blue-50',
      isToday && 'bg-green-50 font-bold'
    )
  }

  return (
    <div
      className={cn(
        'simple-calendar bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden',
        className
      )}
      style={{ height }}
    >
      <Calendar
        value={currentDate}
        onClickDay={handleDateClick}
        onActiveStartDateChange={handleActiveStartDateChange}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale="zh-TW"
        prevLabel={<ChevronLeft className="w-5 h-5" />}
        nextLabel={<ChevronRight className="w-5 h-5" />}
        prev2Label={null}
        next2Label={null}
        showNeighboringMonth={false}
        calendarType="iso8601"
        formatShortWeekday={(_, date) => {
          const weekdays = ['日', '一', '二', '三', '四', '五', '六']
          return weekdays[date.getDay()]
        }}
        navigationLabel={({ date }) => `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`}
      />

      <style jsx global>{`
        .simple-calendar .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
          background: transparent;
        }

        .simple-calendar .react-calendar__navigation {
          display: flex;
          margin-bottom: 0;
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .simple-calendar .react-calendar__navigation button {
          min-width: 40px;
          background: none;
          font-size: 1rem;
          color: #374151;
        }

        .simple-calendar .react-calendar__navigation button:hover {
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }

        .simple-calendar .react-calendar__navigation button:disabled {
          background-color: transparent;
        }

        .simple-calendar .react-calendar__navigation__label {
          font-weight: 600;
          flex-grow: 1;
        }

        .simple-calendar .react-calendar__month-view__weekdays {
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: #6b7280;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .simple-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }

        .simple-calendar .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        .simple-calendar .react-calendar__month-view__days__day {
          padding: 0.25rem;
          vertical-align: top;
        }

        .simple-calendar .react-calendar__tile {
          padding: 0;
          background: none;
          text-align: left;
        }

        .simple-calendar .react-calendar__tile:hover {
          background-color: #f9fafb;
        }

        .simple-calendar .react-calendar__tile--now {
          background-color: #ecfdf5 !important;
        }

        .simple-calendar .react-calendar__tile--active {
          background-color: #dbeafe !important;
        }

        .simple-calendar .react-calendar__month-view__days__day--weekend {
          color: #dc2626;
        }

        /* Dark mode */
        .dark .simple-calendar .react-calendar__navigation button {
          color: #e5e7eb;
        }

        .dark .simple-calendar .react-calendar__navigation button:hover {
          background-color: #374151;
        }

        .dark .simple-calendar .react-calendar__month-view__weekdays {
          color: #9ca3af;
          border-color: #374151;
        }

        .dark .simple-calendar .react-calendar__navigation {
          border-color: #374151;
        }

        .dark .simple-calendar .react-calendar__tile:hover {
          background-color: #1f2937;
        }

        .dark .simple-calendar .react-calendar__month-view__days__day {
          color: #e5e7eb;
        }
      `}</style>
    </div>
  )
}
