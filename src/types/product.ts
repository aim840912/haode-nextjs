export interface Product {
  id: string
  name: string
  emoji?: string
  description: string
  category: string
  price: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  images: string[]
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
}