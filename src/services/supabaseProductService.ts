import { Product, ProductService } from '@/types/product'
import { supabaseAdmin } from '@/lib/supabase'

class SupabaseProductService implements ProductService {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabaseAdmin!
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
      const { data, error } = await supabaseAdmin!
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

  private transformFromDB(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      price: parseFloat(dbProduct.price),
      category: dbProduct.category,
      imageUrl: dbProduct.image_url,
      stock: dbProduct.stock,
      isActive: dbProduct.is_active,
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at
    }
  }

  private transformToDB(product: any): any {
    const transformed: any = {}
    
    if (product.name !== undefined) transformed.name = product.name
    if (product.description !== undefined) transformed.description = product.description
    if (product.price !== undefined) transformed.price = product.price
    if (product.category !== undefined) transformed.category = product.category
    if (product.imageUrl !== undefined) transformed.image_url = product.imageUrl
    if (product.stock !== undefined) transformed.stock = product.stock
    if (product.isActive !== undefined) transformed.is_active = product.isActive
    
    return transformed
  }
}

// Export the service instance
export const supabaseProductService: ProductService = new SupabaseProductService()