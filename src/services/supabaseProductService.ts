import { Product, ProductService } from '@/types/product'
import { supabase, supabaseAdmin } from '@/lib/supabase'

class SupabaseProductService implements ProductService {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const { data, error } = await supabaseAdmin!
        .from('products')
        .insert([this.transformToDB(productData)])
        .select()
        .single()
      
      if (error) throw error
      
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    try {
      const { data, error } = await supabaseAdmin!
        .from('products')
        .update(this.transformToDB(productData))
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      if (!data) throw new Error('Product not found')
      
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin!
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error fetching product by id:', error)
      return null
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      if (!query.trim()) return []

      const searchTerm = `%${query.toLowerCase()}%`
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      const products = data?.map(this.transformFromDB) || []
      
      // 按相關性排序
      return products.sort((a, b) => {
        const queryLower = query.toLowerCase()
        const getRelevanceScore = (product: Product) => {
          const name = product.name.toLowerCase()
          const description = product.description.toLowerCase()
          const category = product.category.toLowerCase()
          
          if (name.includes(queryLower)) return 3
          if (category.includes(queryLower)) return 2
          if (description.includes(queryLower)) return 1
          return 0
        }
        
        return getRelevanceScore(b) - getRelevanceScore(a)
      })
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  }

  private transformFromDB(dbProduct: Record<string, unknown>): Product {
    // 預設圖片對應表
    const defaultImages: { [key: string]: string } = {
      '有機紅肉李': '/images/products/red-plum.jpg',
      '高山烏龍茶': '/images/products/oolong-tea.jpg', 
      '季節蔬菜箱': '/images/products/vegetable-box.jpg',
      '農場蜂蜜': '/images/products/honey.jpg'
    }

    // 取得圖片路徑，優先使用資料庫的值，否則使用預設對應
    let imageUrl = (dbProduct.image_url as string) || defaultImages[dbProduct.name as string] || '/images/placeholder.jpg'
    
    // 修正錯誤的 Imgur 連結
    if (imageUrl && imageUrl.includes('imgur.com') && !imageUrl.includes('.jpg') && !imageUrl.includes('.png')) {
      imageUrl = defaultImages[dbProduct.name as string] || '/images/placeholder.jpg'
    }

    return {
      id: dbProduct.id as string,
      name: dbProduct.name as string,
      description: dbProduct.description as string,
      category: dbProduct.category as string,
      price: parseFloat(dbProduct.price as string),
      images: [imageUrl],
      inventory: dbProduct.stock as number,
      isActive: dbProduct.is_active as boolean,
      createdAt: dbProduct.created_at as string,
      updatedAt: dbProduct.updated_at as string
    }
  }

  private transformToDB(product: Partial<Product>): Record<string, unknown> {
    const transformed: Record<string, unknown> = {}
    
    if (product.name !== undefined) transformed.name = product.name
    if (product.description !== undefined) transformed.description = product.description
    if (product.price !== undefined) transformed.price = product.price
    if (product.category !== undefined) transformed.category = product.category
    if (product.images && product.images.length > 0) transformed.image_url = product.images[0]
    if (product.inventory !== undefined) transformed.stock = product.inventory
    if (product.isActive !== undefined) transformed.is_active = product.isActive
    
    return transformed
  }
}

// Export the service instance
export const supabaseProductService: ProductService = new SupabaseProductService()