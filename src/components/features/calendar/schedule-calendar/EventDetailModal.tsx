'use client'

import {
  MapPin,
  Calendar,
  Clock,
  ShoppingBag,
  DollarSign,
  CloudRain,
  FileText,
  Phone,
} from 'lucide-react'
import type { ScheduleCalendarEvent } from '@/hooks/useScheduleCalendar'
import { formatDate } from '@/lib/utils/formatters'

interface EventDetailModalProps {
  event: ScheduleCalendarEvent | null
  isOpen: boolean
  onClose: () => void
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!isOpen || !event) return null

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return {
      date: formatDate(date, 'short'),
      time: date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">擺攤行程詳情</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <strong>{event.extendedProps.location}</strong>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <strong>{formatDateTime(event.start).date}</strong>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <strong>{formatDateTime(event.start).time}</strong>
            </div>

            {event.extendedProps.products && event.extendedProps.products.length > 0 && (
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>供應商品：</strong>
                  <div className="mt-1">{event.extendedProps.products.join('、')}</div>
                </div>
              </div>
            )}

            {event.extendedProps.specialOffer && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>特別優惠：</strong>
                  <div className="mt-1 text-red-600 dark:text-red-400">
                    {event.extendedProps.specialOffer}
                  </div>
                </div>
              </div>
            )}

            {event.extendedProps.weatherNote && (
              <div className="flex items-start gap-3">
                <CloudRain className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>天氣備註：</strong>
                  <div className="mt-1">{event.extendedProps.weatherNote}</div>
                </div>
              </div>
            )}

            {event.extendedProps.description && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>詳細說明：</strong>
                  <div className="mt-1">{event.extendedProps.description}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>聯絡資訊：</strong>
                <div className="mt-1">{event.extendedProps.contact}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
