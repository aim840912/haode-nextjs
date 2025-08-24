import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-auth'
import { Product } from '@/types/product'

// 資料轉換函數：將資料庫格式轉換為前端格式
function transformFromDB(dbProduct: Record<string, unknown>): Product {
  // 預設圖片對應表
  const defaultImages: { [key: string]: string } = {
    '有機紅肉李': '/images/products/red-plum.jpg',
    '高山烏龍茶': '/images/products/oolong-tea.jpg', 
    '季節蔬菜箱': '/images/products/vegetable-box.jpg',
    '精選茶包': '/images/products/tea_bag_1.jpg'
  }

  // 安全地獲取產品名稱
  const productName = (dbProduct.name as string) || ''
  
  // 取得圖片路徑，優先使用資料庫的值，否則使用預設對應
  let imageUrl = (dbProduct.image_url as string) || defaultImages[productName] || '/images/placeholder.jpg'
  
  // 驗證圖片 URL
  if (!imageUrl || typeof imageUrl !== 'string') {
    imageUrl = '/images/placeholder.jpg'
  }
  
  // 修正錯誤的 Imgur 連結
  if (imageUrl.includes('imgur.com') && !imageUrl.includes('.jpg') && !imageUrl.includes('.png') && !imageUrl.includes('.jpeg') && !imageUrl.includes('.webp')) {
    imageUrl = defaultImages[productName] || '/images/placeholder.jpg'
  }

  return {
    id: String(dbProduct.id || ''),
    name: (dbProduct.name as string) || '',
    description: (dbProduct.description as string) || '',
    price: Number(dbProduct.price) || 0,
    category: (dbProduct.category as string) || '',
    images: imageUrl ? [imageUrl] : [],
    inventory: Number(dbProduct.stock) || 0,
    isActive: Boolean(dbProduct.is_active),
    showInCatalog: dbProduct.show_in_catalog !== false, // 預設為 true
    createdAt: (dbProduct.created_at as string) || new Date().toISOString(),
    updatedAt: (dbProduct.updated_at as string) || new Date().toISOString()
  }
}

// 檢查管理員權限的安全實現
function checkAdminPermission(request: NextRequest): { isValid: boolean; error?: string } {
  const adminKey = request.headers.get('X-Admin-Key')
  const envAdminKey = process.env.ADMIN_API_KEY
  
  if (!envAdminKey) {
    console.error('ADMIN_API_KEY not configured in environment variables')
    return { isValid: false, error: '伺服器設定錯誤' }
  }
  
  if (!adminKey) {
    return { isValid: false, error: '缺少管理員認證標頭' }
  }
  
  if (adminKey !== envAdminKey) {
    return { isValid: false, error: '無效的管理員認證' }
  }
  
  return { isValid: true }
}

// GET - 取得所有產品（包含未啟用的）
export async function GET(request: NextRequest) {
  const authResult = checkAdminPermission(request)
  if (!authResult.isValid) {
    const status = authResult.error === '伺服器設定錯誤' ? 500 : 401
    return NextResponse.json({ error: authResult.error }, { status })
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 轉換資料格式
    const transformedProducts = (data || []).map(transformFromDB)

    return NextResponse.json({ products: transformedProducts })
  } catch (error) {
    console.error('Error fetching all products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - 新增產品
export async function POST(request: NextRequest) {
  const authResult = checkAdminPermission(request)
  if (!authResult.isValid) {
    const status = authResult.error === '伺服器設定錯誤' ? 500 : 401
    return NextResponse.json({ error: authResult.error }, { status })
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const productData = await request.json()

    // 轉換資料格式
    const dbProduct = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      image_url: productData.images?.[0] || null,
      stock: productData.inventory || 0,
      is_active: productData.isActive !== false
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([dbProduct])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: transformFromDB(data) }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - 更新產品
export async function PUT(request: NextRequest) {
  const authResult = checkAdminPermission(request)
  if (!authResult.isValid) {
    const status = authResult.error === '伺服器設定錯誤' ? 500 : 401
    return NextResponse.json({ error: authResult.error }, { status })
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { id, ...productData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // 轉換資料格式
    const dbProduct: Record<string, unknown> = {}
    
    if (productData.name !== undefined) dbProduct.name = productData.name
    if (productData.description !== undefined) dbProduct.description = productData.description
    if (productData.price !== undefined) dbProduct.price = productData.price
    if (productData.category !== undefined) dbProduct.category = productData.category
    if (productData.images && productData.images.length > 0) dbProduct.image_url = productData.images[0]
    if (productData.inventory !== undefined) dbProduct.stock = productData.inventory
    if (productData.isActive !== undefined) dbProduct.is_active = productData.isActive

    dbProduct.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dbProduct)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: transformFromDB(data) })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - 刪除產品
export async function DELETE(request: NextRequest) {
  const authResult = checkAdminPermission(request)
  if (!authResult.isValid) {
    const status = authResult.error === '伺服器設定錯誤' ? 500 : 401
    return NextResponse.json({ error: authResult.error }, { status })
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}