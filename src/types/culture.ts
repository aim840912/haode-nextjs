export interface CultureItem {
  id: string
  title: string
  subtitle: string
  description: string
  color: string
  height: string
  textColor: string
  emoji: string
  imageUrl?: string  // 新增圖片 URL 欄位
  createdAt: string
  updatedAt: string
}

export interface CultureService {
  getCultureItems(): Promise<CultureItem[]>
  addCultureItem(item: Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CultureItem>
  updateCultureItem(id: string, item: Partial<Omit<CultureItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CultureItem>
  deleteCultureItem(id: string): Promise<void>
  getCultureItemById(id: string): Promise<CultureItem | null>
}