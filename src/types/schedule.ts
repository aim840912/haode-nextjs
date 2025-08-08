export interface ScheduleItem {
  id: string
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer?: string
  weatherNote?: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleService {
  getSchedule(): Promise<ScheduleItem[]>
  addSchedule(schedule: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem>
  updateSchedule(id: string, schedule: Partial<Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ScheduleItem>
  deleteSchedule(id: string): Promise<void>
  getScheduleById(id: string): Promise<ScheduleItem | null>
}