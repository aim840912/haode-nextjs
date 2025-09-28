// 產品圖片結構 - 對應 images 表 (module='products')
// 使用資料庫原始欄位名稱，與統一 API 格式一致
export interface ProductImage {
  id: string
  entity_id: string // 資料庫: images.entity_id (產品 ID)
  storage_url: string // 資料庫: images.storage_url
  file_path: string // 資料庫: images.file_path
  alt_text?: string | null // 資料庫: images.alt_text
  display_position: number // 資料庫: images.display_position
  size: 'thumbnail' | 'medium' | 'large'
  width?: number | null // 存在 images.metadata
  height?: number | null // 存在 images.metadata
  file_size?: number | null // 存在 images.metadata
  created_at: string
  updated_at: string
  module: string // 資料庫: images.module (固定為 'products')
}

// 產品主介面 - 使用 images 表存放產品圖片
export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  inventory: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  productImages: ProductImage[]
}

// 產品建立資料
export interface CreateProductData {
  name: string
  description: string
  category: string
  price: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  inventory: number
  isActive: boolean
}

// 產品更新資料
export interface UpdateProductData {
  name?: string
  description?: string
  category?: string
  price?: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  inventory?: number
  isActive?: boolean
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
