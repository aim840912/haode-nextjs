'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays, Gift } from 'lucide-react'
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
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-center mb-4">
          <CalendarDays className="w-12 h-12 text-[#d35400] animate-pulse" strokeWidth={2} />
        </div>
        <h3 className="text-2xl font-bold text-[#3e2723] mb-4">下次市集擺攤</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded mx-auto w-48"></div>
          <div className="h-6 bg-gray-200 rounded mx-auto w-40"></div>
        </div>
      </div>
    )
  }

  // 錯誤或無資料狀態
  if (error || !nextSchedule) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-center mb-4">
          <CalendarDays className="w-12 h-12 text-gray-400" strokeWidth={2} />
        </div>
        <h3 className="text-2xl font-bold text-[#3e2723] mb-4">下次市集擺攤</h3>
        <p className="text-gray-500 mb-6">{error ? '暫時無法取得行程資料' : '近期暫無擺攤行程'}</p>
        <Link
          href="/schedule"
          className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-semibold transition-colors"
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
    <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-center mb-4">
        <CalendarDays className="w-12 h-12 text-[#d35400]" strokeWidth={2} />
      </div>
      <h3 className="text-2xl font-bold text-[#3e2723] mb-4">下次市集擺攤</h3>
      <div className="text-3xl font-bold text-[#d35400] mb-2">
        {weekday} {nextSchedule.time}
      </div>
      <p className="text-gray-700 mb-2">{nextSchedule.location}</p>
      <p className="text-gray-500 text-sm mb-6">{dateStr}</p>

      {nextSchedule.specialOffer && (
        <div className="bg-[#fff8f0] rounded-lg p-3 mb-6 flex items-center justify-center gap-2">
          <Gift className="w-4 h-4 text-[#d35400]" strokeWidth={2} />
          <p className="text-sm font-medium text-[#d35400]">{nextSchedule.specialOffer}</p>
        </div>
      )}

      <Link
        href="/schedule"
        className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-semibold transition-colors"
      >
        查看完整行程
      </Link>
    </div>
  )
}
