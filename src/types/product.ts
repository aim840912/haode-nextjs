export interface ProductImage {
  id: string
  url: string
  alt: string
  position: number
  size: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  images: string[] // 相容性保留，主要圖片URLs
  productImages?: ProductImage[] // 新的結構化圖片資料
  primaryImageUrl?: string // 主要展示圖片
  thumbnailUrl?: string // 縮圖URL
  galleryImages?: string[] // 圖片相簿URLs
  inventory: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductService {
  getProducts(): Promise<Product[]>
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>
  updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>
  deleteProduct(id: string): Promise<void>
  getProductById(id: string): Promise<Product | null>
  searchProducts(query: string): Promise<Product[]>
}