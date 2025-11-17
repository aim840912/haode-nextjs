/**
 * 新增擺攤行程表單類型定義
 */

export interface ScheduleFormData {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'completed' | 'cancelled'
  products: string[]
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
}

export interface TimeRange {
  startTime: string
  endTime: string
}

export interface FieldErrors {
  title: string
  location: string
  date: string
  time: string
  contact: string
}
