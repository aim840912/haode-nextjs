import { NextResponse } from 'next/server'
import { supabaseProductService } from '@/services/supabaseProductService'

export async function GET() {
  try {
    const products = await supabaseProductService.getProducts()
    
    // 提取所有唯一的分類
    const categories = [...new Set(products.map(product => product.category))]
      .filter(category => category && category.trim() !== '')
      .sort()
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}