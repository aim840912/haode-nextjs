'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { useSchedule } from '@/hooks/useSchedule'
import { formatDate } from '@/lib/utils/formatters'

/**
 * 下次市集擺攤卡片元件
 * 從 /api/schedule 動態獲取最近的未來行程
 */
export function NextMarketScheduleCard() {
  const { schedule, loading, error } = useSchedule()

  // 計算下次擺攤行程
  const nextSchedule = useMemo(() => {
    if (!schedule || schedule.length === 0) return null

    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD

    // 篩選未來的 upcoming 行程
    const upcomingSchedules = schedule.filter(item => {
      return item.status === 'upcoming' && item.date >= today
    })

    // 按日期時間排序，取最近的一個
    const sorted = upcomingSchedules.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })

    return sorted[0] || null
  }, [schedule])

  // Loading 狀態
  if (loading) {
    return (
      <div className="bg-amber-600 dark:bg-amber-700 rounded-2xl p-8 text-white text-center hover:shadow-lg transition-shadow duration-300 border-2 border-amber-500 dark:border-amber-600">
        <div className="flex justify-center mb-4">
          <CalendarDays className="w-12 h-12 text-white animate-pulse" strokeWidth={2} />
        </div>
        <h3 className="text-2xl font-bold mb-4">下次市集擺攤</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-white/20 rounded mx-auto w-48"></div>
          <div className="h-6 bg-white/20 rounded mx-auto w-40"></div>
        </div>
      </div>
    )
  }

  // 錯誤或無資料狀態
  if (error || !nextSchedule) {
    return (
      <div className="bg-gray-500 dark:bg-gray-600 rounded-2xl p-8 text-white text-center hover:shadow-lg transition-shadow duration-300 border-2 border-gray-400 dark:border-gray-500">
        <div className="flex justify-center mb-4">
          <CalendarDays className="w-12 h-12 text-white" strokeWidth={2} />
        </div>
        <h3 className="text-2xl font-bold mb-4">下次市集擺攤</h3>
        <p className="text-white/80 mb-6">{error ? '暫時無法取得行程資料' : '近期暫無擺攤行程'}</p>
        <Link
          href="/schedule"
          className="inline-block bg-white text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          查看完整行程
        </Link>
      </div>
    )
  }

  // 格式化顯示
  const scheduleDate = new Date(nextSchedule.date)
  const weekday = scheduleDate.toLocaleDateString('zh-TW', { weekday: 'short' }) // 週六
  const dateStr = formatDate(nextSchedule.date, 'short') // 2025/01/15

  return (
    <div className="bg-amber-600 dark:bg-amber-700 rounded-2xl p-8 text-white text-center hover:shadow-lg transition-shadow duration-300 border-2 border-amber-500 dark:border-amber-600">
      <div className="flex justify-center mb-4">
        <CalendarDays className="w-12 h-12 text-white" strokeWidth={2} />
      </div>
      <h3 className="text-2xl font-bold mb-4">下次市集擺攤</h3>
      <div className="text-3xl font-bold mb-2">
        {weekday} {nextSchedule.time}
      </div>
      <p className="text-white/90 mb-2">{nextSchedule.location}</p>
      <p className="text-white/70 text-sm mb-6">{dateStr}</p>

      {nextSchedule.specialOffer && (
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-6">
          <p className="text-sm font-medium">🎁 {nextSchedule.specialOffer}</p>
        </div>
      )}

      <Link
        href="/schedule"
        className="inline-block bg-white text-amber-700 px-8 py-3 rounded-full font-semibold hover:bg-amber-50 transition-colors"
      >
        查看完整行程
      </Link>
    </div>
  )
}
