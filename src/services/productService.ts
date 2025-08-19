import { Product, ProductService } from '@/types/product'
import { promises as fs } from 'fs'
import path from 'path'

export class JsonProductService implements ProductService {
  private readonly filePath = path.join(process.cwd(), 'src/data/products.json')

  async getProducts(): Promise<Product[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading products:', error)
      return []
    }
  }

  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const products = await this.getProducts()
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    products.push(newProduct)
    await this.saveProducts(products)
    return newProduct
  }

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const products = await this.getProducts()
    const index = products.findIndex(p => p.id === id)
    
    if (index === -1) {
      throw new Error('Product not found')
    }

    const updatedProduct = {
      ...products[index],
      ...productData,
      updatedAt: new Date().toISOString()
    }
    
    products[index] = updatedProduct
    await this.saveProducts(products)
    return updatedProduct
  }

  async deleteProduct(id: string): Promise<void> {
    // 先嘗試刪除 Supabase Storage 中的產品圖片
    try {
      const { deleteProductImages } = await import('@/lib/supabase-storage')
      await deleteProductImages(id)
    } catch (storageError) {
      // 圖片刪除失敗不應該阻止產品刪除，但要記錄警告
      console.warn('刪除產品圖片時發生警告:', storageError)
    }
    
    // 然後從檔案中刪除產品記錄
    const products = await this.getProducts()
    const filteredProducts = products.filter(p => p.id !== id)
    await this.saveProducts(filteredProducts)
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts()
    return products.find(p => p.id === id) || null
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts()
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    
    return products
      .filter(product => 
        product.isActive && (
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
        )
      )
      .sort((a, b) => {
        // 計算相關性分數，名稱匹配優先級最高
        const getRelevanceScore = (product: Product) => {
          const name = product.name.toLowerCase()
          const description = product.description.toLowerCase()
          const category = product.category.toLowerCase()
          
          if (name.includes(searchTerm)) return 3
          if (category.includes(searchTerm)) return 2
          if (description.includes(searchTerm)) return 1
          return 0
        }
        
        return getRelevanceScore(b) - getRelevanceScore(a)
      })
  }

  private async saveProducts(products: Product[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(products, null, 2), 'utf-8')
  }
}

// 智慧產品服務 - 根據環境自動選擇實作
import { getProductService } from './serviceFactory'

// 延遲初始化的產品服務
let _productService: ProductService | null = null

export const productService: ProductService = {
  async getProducts() {
    if (!_productService) _productService = await getProductService()
    return _productService.getProducts()
  },

  async getAllProducts() {
    if (!_productService) _productService = await getProductService()
    return _productService.getAllProducts ? _productService.getAllProducts() : _productService.getProducts()
  },
  
  async addProduct(productData) {
    if (!_productService) _productService = await getProductService()
    return _productService.addProduct(productData)
  },
  
  async updateProduct(id, productData) {
    if (!_productService) _productService = await getProductService()
    return _productService.updateProduct(id, productData)
  },
  
  async deleteProduct(id) {
    if (!_productService) _productService = await getProductService()
    return _productService.deleteProduct(id)
  },
  
  async getProductById(id) {
    if (!_productService) _productService = await getProductService()
    return _productService.getProductById(id)
  },
  
  async searchProducts(query) {
    if (!_productService) _productService = await getProductService()
    return _productService.searchProducts(query)
  }
}