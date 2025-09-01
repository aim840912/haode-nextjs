import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { getScheduleService } from '@/services/serviceFactory'
import { apiLogger } from '@/lib/logger'

interface ScheduleCalendarEvent {
  id: string
  title: string        // 市集名稱 + 地點
  start: string        // 日期時間
  end?: string         // 結束時間（如果有）
  backgroundColor: string
  borderColor: string
  extendedProps: {
    location: string
    products: string[]
    specialOffer?: string
    weatherNote?: string
    contact: string
    status: 'upcoming' | 'ongoing' | 'completed'
    description: string
  }
}

async function handleGET() {
  const scheduleService = await getScheduleService()
  const scheduleItems = await scheduleService.getSchedule()
  
  // 將 ScheduleItem 轉換為 FullCalendar 事件格式
  const events: ScheduleCalendarEvent[] = scheduleItems.map(item => {
    const startDateTime = `${item.date}T${item.time}`
    
    // 根據狀態設定顏色
    const getColorByStatus = (status: string) => {
      switch (status) {
        case 'upcoming':
          return { bg: '#10b981', border: '#059669' } // 綠色
        case 'ongoing':
          return { bg: '#3b82f6', border: '#2563eb' } // 藍色
        case 'completed':
          return { bg: '#6b7280', border: '#4b5563' } // 灰色
        default:
          return { bg: '#10b981', border: '#059669' } // 預設綠色
      }
    }
    
    const colors = getColorByStatus(item.status)
    
    return {
      id: item.id,
      title: `${item.title} - ${item.location}`,
      start: startDateTime,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: {
        location: item.location,
        products: item.products,
        specialOffer: item.specialOffer,
        weatherNote: item.weatherNote,
        contact: item.contact,
        status: item.status,
        description: item.description
      }
    }
  })
  
  apiLogger.info(`成功取得擺攤行程行事曆資料: ${events.length} 個事件`)
  
  return success(events, '成功取得擺攤行程行事曆')
}

export const GET = withErrorHandler(handleGET, {
  module: 'ScheduleCalendar',
  enableAuditLog: false
})