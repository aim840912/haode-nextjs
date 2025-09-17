export interface FarmTourActivity {
  id: string
  start_month: number // 開始月份 (1-12)
  end_month: number // 結束月份 (1-12)
  title: string
  activities: string[]
  price: number // 選填，預設 0
  image: string
  available: boolean
  note: string
  createdAt: string
  updatedAt: string
}
