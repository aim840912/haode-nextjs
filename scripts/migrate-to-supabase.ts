#!/usr/bin/env npx tsx

/**
 * 資料遷移腳本 - 將 JSON 資料匯入到 Supabase
 * 
 * 使用方法：
 * npm run migrate:products
 */

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'
import path from 'path'

// 載入環境變數
function loadEnvVars() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const fs = require('fs')
      const envPath = path.join(process.cwd(), '.env.local')
      
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const envLines = envContent.split('\n')
        
        envLines.forEach((line: string) => {
          const trimmedLine = line.trim()
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=')
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim()
              process.env[key.trim()] = value
            }
          }
        })
        console.log('✅ .env.local 檔案載入成功')
      } else {
        console.log('❌ 找不到 .env.local 檔案')
      }
    } catch (error) {
      console.log('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

// 轉換產品資料格式
function transformProductForDB(product: any) {
  // 先檢查哪些欄位存在，只使用現有欄位
  const baseData = {
    // 不包含 id，讓 Supabase 自動生成 UUID
    name: product.name,
    description: product.description,
    category: product.category,
    price: parseFloat(product.price.toString()),
    is_active: product.isActive !== false,
    created_at: product.createdAt || new Date().toISOString(),
    updated_at: product.updatedAt || new Date().toISOString()
  }

  // 只有當有圖片時才加入
  if (product.images && product.images.length > 0) {
    (baseData as any).image_url = product.images[0]
  }

  // TODO: 之後添加 emoji 和 stock 欄位
  // emoji: product.emoji || '',
  // stock: product.inventory || 0,

  return baseData
}

async function migrateProducts() {
  console.log('🚀 開始產品資料遷移...\n')

  // 載入環境變數
  loadEnvVars()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少必要的環境變數')
    console.log('請確認 .env.local 包含:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  // 建立 Supabase 客戶端
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 讀取 JSON 資料
    console.log('📖 讀取產品 JSON 資料...')
    const jsonPath = path.join(process.cwd(), 'src/data/products.json')
    const jsonData = await fs.readFile(jsonPath, 'utf-8')
    const products = JSON.parse(jsonData)
    
    console.log(`✅ 找到 ${products.length} 個產品`)

    // 檢查現有資料
    console.log('\n🔍 檢查 Supabase 現有資料...')
    const { data: existingProducts, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name')

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    const existingNames = existingProducts?.map(p => p.name) || []
    console.log(`📊 Supabase 中現有 ${existingNames.length} 個產品`)

    // 準備遷移資料（根據名稱判斷，避免重複）
    const newProducts = products.filter((p: any) => !existingNames.includes(p.name))
    const updateProducts = products.filter((p: any) => existingNames.includes(p.name))

    console.log(`\n📦 準備遷移:`)
    console.log(`   新增: ${newProducts.length} 個產品`)
    console.log(`   更新: ${updateProducts.length} 個產品`)

    // 新增產品
    if (newProducts.length > 0) {
      console.log('\n➕ 新增產品...')
      const newProductData = newProducts.map(transformProductForDB)
      
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('products')
        .insert(newProductData)
        .select()

      if (insertError) {
        console.error('插入錯誤詳情:', insertError)
        throw insertError
      }

      console.log(`✅ 成功新增 ${insertedData?.length || newProducts.length} 個產品`)
    }

    // 更新產品
    if (updateProducts.length > 0) {
      console.log('\n🔄 更新現有產品...')
      let updateCount = 0

      for (const product of updateProducts) {
        const productData = transformProductForDB(product)
        const { created_at, ...updateData } = productData  // 移除 created_at

        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update(updateData)
          .eq('name', product.name)  // 根據名稱更新

        if (updateError) {
          console.warn(`⚠️ 更新產品 ${product.name} 失敗:`, updateError.message)
        } else {
          updateCount++
        }
      }

      console.log(`✅ 成功更新 ${updateCount} 個產品`)
    }

    // 驗證結果
    console.log('\n🔍 驗證遷移結果...')
    const { data: finalData, error: finalError } = await supabaseAdmin
      .from('products')
      .select('id, name, is_active')
      .order('created_at', { ascending: false })

    if (finalError) {
      throw finalError
    }

    console.log(`\n📊 遷移完成統計:`)
    console.log(`   總產品數: ${finalData?.length || 0}`)
    console.log(`   啟用產品: ${finalData?.filter(p => p.is_active).length || 0}`)
    console.log(`   停用產品: ${finalData?.filter(p => !p.is_active).length || 0}`)

    console.log('\n🎉 產品資料遷移完成！')
    console.log('💡 提示：你現在可以在網站管理介面新增/編輯產品了')

  } catch (error) {
    console.error('\n❌ 遷移過程發生錯誤:')
    console.error('完整錯誤物件:', error)
    if (error instanceof Error) {
      console.error('錯誤訊息:', error.message)
      if ('code' in error) {
        console.error('錯誤代碼:', (error as any).code)
      }
    }
    console.log('\n🔧 常見問題排除:')
    console.log('1. 確認 Supabase 資料庫表格已建立')
    console.log('2. 檢查 API Keys 是否正確')
    console.log('3. 確認網路連線正常')
  }
}

// 執行遷移
if (require.main === module) {
  migrateProducts().catch(console.error)
}

export default migrateProducts