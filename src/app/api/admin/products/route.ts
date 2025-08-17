import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Product } from '@/types/product'

// 檢查是否為管理員權限的簡單實現
// 在實際應用中，你應該實施適當的身份驗證
function checkAdminPermission(request: NextRequest): boolean {
  const adminKey = request.headers.get('X-Admin-Key')
  const envAdminKey = process.env.ADMIN_API_KEY
  
  if (!envAdminKey) {
    console.warn('ADMIN_API_KEY not set in environment variables')
    return false
  }
  
  return adminKey === envAdminKey
}

// GET - 取得所有產品（包含未啟用的）
export async function GET(request: NextRequest) {
  if (!checkAdminPermission(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json({ products: data || [] })
  } catch (error) {
    console.error('Error fetching all products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - 新增產品
export async function POST(request: NextRequest) {
  if (!checkAdminPermission(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      is_active: productData.isActive !== false,
      emoji: productData.emoji || ''
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([dbProduct])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - 更新產品
export async function PUT(request: NextRequest) {
  if (!checkAdminPermission(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    if (productData.emoji !== undefined) dbProduct.emoji = productData.emoji

    dbProduct.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(dbProduct)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - 刪除產品
export async function DELETE(request: NextRequest) {
  if (!checkAdminPermission(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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