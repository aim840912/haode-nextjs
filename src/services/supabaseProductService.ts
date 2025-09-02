import { Product, ProductService } from '@/types/product'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'

class SupabaseProductService implements ProductService {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error in getProducts:', error)
      return []
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      // 使用管理員客戶端來獲取所有產品（包含下架的）
      const client = supabaseAdmin || supabase
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
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
      // 先刪除 Supabase Storage 中的所有產品圖片
      const { deleteProductImages } = await import('@/lib/supabase-storage')
      try {
        await deleteProductImages(id)
      } catch (storageError) {
        // 圖片刪除失敗不應該阻止產品刪除，但要記錄錯誤
        console.warn('刪除產品圖片時發生警告:', storageError)
      }
      
      // 然後刪除資料庫記錄
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
      // 使用管理員客戶端來獲取產品（支援查詢下架產品）
      const client = supabaseAdmin || supabase
      const { data, error } = await client
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
      return products.sort((a: any, b: any) => {
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
      '精選茶包': '/images/products/teabag.jpg'
    }

    // 安全地獲取產品名稱
    const productName = (dbProduct.name as string) || ''
    
    // 取得圖片陣列，優先使用新的 images 欄位
    let images: string[] = []
    
    try {
      // 嘗試解析 images JSONB 欄位
      if (dbProduct.images && typeof dbProduct.images === 'string') {
        images = JSON.parse(dbProduct.images as string)
      } else if (Array.isArray(dbProduct.images)) {
        images = dbProduct.images
      }
    } catch (error) {
      // JSON 解析失敗，使用空陣列
      images = []
    }
    
    // 如果沒有新格式圖片，回退到舊的 image_url
    if (images.length === 0) {
      const imageUrl = (dbProduct.image_url as string) || defaultImages[productName] || '/images/placeholder.jpg'
      
      // 驗證圖片 URL
      if (imageUrl && typeof imageUrl === 'string') {
        // 修正錯誤的 Imgur 連結
        if (imageUrl.includes('imgur.com') && !imageUrl.includes('.jpg') && !imageUrl.includes('.png') && !imageUrl.includes('.jpeg') && !imageUrl.includes('.webp')) {
          images = [defaultImages[productName] || '/images/placeholder.jpg']
        } else {
          images = [imageUrl]
        }
      } else {
        images = ['/images/placeholder.jpg']
      }
    }
    
    // 確保至少有一張圖片
    if (images.length === 0) {
      images = ['/images/placeholder.jpg']
    }
    
    // 確保所有必要欄位都有有效值
    const price = typeof dbProduct.price === 'number' ? dbProduct.price : parseFloat(dbProduct.price as string) || 0
    const stock = typeof dbProduct.stock === 'number' ? dbProduct.stock : parseInt(dbProduct.stock as string) || 0

    return {
      id: (dbProduct.id as string) || '',
      name: productName,
      description: (dbProduct.description as string) || '',
      category: (dbProduct.category as string) || '',
      price: price,
      images: images, // 使用完整的圖片陣列
      inventory: stock,
      isActive: Boolean(dbProduct.is_active),
      showInCatalog: dbProduct.show_in_catalog !== undefined ? Boolean(dbProduct.show_in_catalog) : true,
      createdAt: (dbProduct.created_at as string) || new Date().toISOString(),
      updatedAt: (dbProduct.updated_at as string) || new Date().toISOString()
    }
  }

  private transformToDB(product: Partial<Product>): Record<string, unknown> {
    const transformed: Record<string, unknown> = {}
    
    if (product.name !== undefined) transformed.name = product.name
    if (product.description !== undefined) transformed.description = product.description
    if (product.price !== undefined) transformed.price = product.price
    if (product.category !== undefined) transformed.category = product.category
    if (product.images !== undefined) {
      transformed.image_url = product.images.length > 0 ? product.images[0] : null // 保持向後相容
      transformed.images = JSON.stringify(product.images) // 新增：儲存完整圖片陣列
    }
    if (product.inventory !== undefined) transformed.stock = product.inventory
    if (product.isActive !== undefined) transformed.is_active = product.isActive
    if (product.showInCatalog !== undefined) transformed.show_in_catalog = product.showInCatalog
    
    return transformed
  }
}

// Export the service instance
export const supabaseProductService: ProductService = new SupabaseProductService()