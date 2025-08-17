import { ScheduleItem, ScheduleService } from '@/types/schedule'
import { promises as fs } from 'fs'
import path from 'path'

class JsonScheduleService implements ScheduleService {
  private readonly filePath = path.join(process.cwd(), 'src/data/schedule.json')

  async getSchedule(): Promise<ScheduleItem[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading schedule:', error)
      return []
    }
  }

  async addSchedule(scheduleData: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem> {
    const schedule = await this.getSchedule()
    const newSchedule: ScheduleItem = {
      ...scheduleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    schedule.push(newSchedule)
    // 按日期排序
    schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    await this.saveSchedule(schedule)
    return newSchedule
  }

  async updateSchedule(id: string, scheduleData: Partial<Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ScheduleItem> {
    const schedule = await this.getSchedule()
    const index = schedule.findIndex(s => s.id === id)
    
    if (index === -1) {
      throw new Error('Schedule not found')
    }

    const updatedSchedule = {
      ...schedule[index],
      ...scheduleData,
      updatedAt: new Date().toISOString()
    }
    
    schedule[index] = updatedSchedule
    // 重新排序
    schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    await this.saveSchedule(schedule)
    return updatedSchedule
  }

  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.getSchedule()
    const filteredSchedule = schedule.filter(s => s.id !== id)
    await this.saveSchedule(filteredSchedule)
  }

  async getScheduleById(id: string): Promise<ScheduleItem | null> {
    const schedule = await this.getSchedule()
    return schedule.find(s => s.id === id) || null
  }

  private async saveSchedule(schedule: ScheduleItem[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(schedule, null, 2), 'utf-8')
  }
}

import { supabaseScheduleService } from './supabaseScheduleService'

// 使用 Supabase 服務取代 JSON 檔案
export const scheduleService: ScheduleService = supabaseScheduleService