import { CultureItem, CultureService } from '@/types/culture'
import { promises as fs } from 'fs'
import path from 'path'

export class JsonCultureService implements CultureService {
  private readonly filePath = path.join(process.cwd(), 'src/data/culture.json')

  async getCultureItems(): Promise<CultureItem[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading culture items:', error)
      return []
    }
  }

  async addCultureItem(itemData: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CultureItem> {
    const items = await this.getCultureItems()
    const newItem: CultureItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    items.push(newItem)
    await this.saveCultureItems(items)
    return newItem
  }

  async updateCultureItem(id: string, itemData: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CultureItem> {
    const items = await this.getCultureItems()
    const index = items.findIndex(item => item.id === id)
    
    if (index === -1) {
      throw new Error('Culture item not found')
    }

    const updatedItem = {
      ...items[index],
      ...itemData,
      updatedAt: new Date().toISOString()
    }
    
    items[index] = updatedItem
    await this.saveCultureItems(items)
    return updatedItem
  }

  async deleteCultureItem(id: string): Promise<void> {
    const items = await this.getCultureItems()
    const filteredItems = items.filter(item => item.id !== id)
    await this.saveCultureItems(filteredItems)
  }

  async getCultureItemById(id: string): Promise<CultureItem | null> {
    const items = await this.getCultureItems()
    return items.find(item => item.id === id) || null
  }

  private async saveCultureItems(items: CultureItem[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8')
  }
}

// 將來改成資料庫時，只需要替換這行
export const cultureService: CultureService = new JsonCultureService()