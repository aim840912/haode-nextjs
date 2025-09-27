// 產品圖片結構 - 對應 product_images 表
export interface ProductImage {
  id: string
  product_id: string
  url: string
  path: string
  alt?: string
  position: number
  size: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
  file_size?: number
  created_at: string
  updated_at: string
}

// 產品主介面 - 簡化版，只保留核心欄位
export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  priceUnit?: string // 價格單位（如：斤、包、箱、顆、公斤等）
  unitQuantity?: number // 單位數量，預設為 1
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  inventory: number
  isActive: boolean
  createdAt: string
  updatedAt: string

  // 圖片關聯（查詢時動態載入）
  images?: ProductImage[]
}

export interface ProductService {
  getProducts(): Promise<Product[]>
  getAllProducts?(): Promise<Product[]> // 管理員用：獲取所有產品（包含下架）
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>
  updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product>
  deleteProduct(id: string): Promise<void>
  getProductById(id: string): Promise<Product | null>
  searchProducts(query: string): Promise<Product[]>
}
