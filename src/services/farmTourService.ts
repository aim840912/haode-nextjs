import { FarmTourActivity } from '@/types/farmTour'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'src/data/farm-tour.json')

export const farmTourService = {
  // 獲取所有活動
  async getAll(): Promise<FarmTourActivity[]> {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading farm tour data:', error)
      return []
    }
  },

  // 根據ID獲取活動
  async getById(id: string): Promise<FarmTourActivity | null> {
    const activities = await this.getAll()
    return activities.find(activity => activity.id === id) || null
  },

  // 新增活動
  async create(activityData: Omit<FarmTourActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmTourActivity> {
    const activities = await this.getAll()
    const newActivity: FarmTourActivity = {
      ...activityData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    activities.push(newActivity)
    await fs.writeFile(DATA_FILE, JSON.stringify(activities, null, 2))
    return newActivity
  },

  // 更新活動
  async update(id: string, updateData: Partial<Omit<FarmTourActivity, 'id' | 'createdAt'>>): Promise<FarmTourActivity | null> {
    const activities = await this.getAll()
    const activityIndex = activities.findIndex(activity => activity.id === id)
    
    if (activityIndex === -1) return null
    
    activities[activityIndex] = {
      ...activities[activityIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(activities, null, 2))
    return activities[activityIndex]
  },

  // 刪除活動
  async delete(id: string): Promise<boolean> {
    const activities = await this.getAll()
    const filteredActivities = activities.filter(activity => activity.id !== id)
    
    if (filteredActivities.length === activities.length) return false
    
    await fs.writeFile(DATA_FILE, JSON.stringify(filteredActivities, null, 2))
    return true
  }
}