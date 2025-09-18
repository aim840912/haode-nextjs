export interface MomentItem {
  id: string
  title: string
  subtitle: string
  description: string
  color: string
  height: string
  textColor: string
  emoji: string
  imageUrl?: string // 單一圖片 URL（向後相容）
  images?: string[] // 圖片陣列（支援多圖片）
  createdAt: string
  updatedAt: string
}

export interface MomentService {
  getMomentItems(): Promise<MomentItem[]>
  addMomentItem(item: Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MomentItem>
  updateMomentItem(
    id: string,
    item: Partial<Omit<MomentItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<MomentItem>
  deleteMomentItem(id: string): Promise<void>
  getMomentItemById(id: string): Promise<MomentItem | null>
}
