import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('請設定環境變數: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProductsSchema() {
  try {
    // 查詢產品表結構
    console.log('📋 檢查 products 表結構...\n')

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (productsError) {
      console.error('❌ 查詢 products 表失敗:', productsError.message)
    } else if (products && products.length > 0) {
      const sample = products[0]
      console.log('✅ Products 表欄位:')
      Object.keys(sample).forEach((key, index) => {
        console.log(`${index + 1}. ${key}: ${typeof sample[key]} = ${sample[key]}`)
      })
    } else {
      console.log('⚠️  products 表為空，無法檢查結構')
    }

    // 檢查是否有 product_images 表
    console.log('\n📋 檢查 product_images 表...\n')

    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1)

    if (imagesError) {
      if (imagesError.message.includes('does not exist')) {
        console.log('ℹ️  product_images 表不存在，需要創建')
      } else {
        console.error('❌ 查詢 product_images 表失敗:', imagesError.message)
      }
    } else {
      console.log('✅ product_images 表存在')
      if (images && images.length > 0) {
        const sample = images[0]
        console.log('欄位結構:')
        Object.keys(sample).forEach((key, index) => {
          console.log(`${index + 1}. ${key}: ${typeof sample[key]} = ${sample[key]}`)
        })
      } else {
        console.log('表為空，無法檢查詳細結構')
      }
    }
  } catch (error) {
    console.error('❌ 檢查失敗:', error)
  }
}

checkProductsSchema()
