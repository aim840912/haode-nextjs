import { Product, ProductService } from '@/types/product'
import { promises as fs } from 'fs'
import path from 'path'

class JsonProductService implements ProductService {
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
    const products = await this.getProducts()
    const filteredProducts = products.filter(p => p.id !== id)
    await this.saveProducts(filteredProducts)
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts()
    return products.find(p => p.id === id) || null
  }

  private async saveProducts(products: Product[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(products, null, 2), 'utf-8')
  }
}

// 將來改成資料庫時，只需要替換這行
// export const productService: ProductService = new JsonProductService()

// Supabase implementation
import { supabaseProductService } from './supabaseProductService'
export const productService: ProductService = supabaseProductService