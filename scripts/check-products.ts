#!/usr/bin/env npx tsx

/**
 * 產品顯示問題診斷腳本
 * 檢查為什麼資料庫有兩個產品但網頁只顯示一個
 */

import { createClient } from '@supabase/supabase-js'

// 載入環境變數
function loadEnvVars() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const fs = require('fs')
      const path = require('path')
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
      }
    } catch (error) {
      console.error('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

class ProductDiagnostics {
  private supabaseUrl: string
  private serviceKey: string

  constructor() {
    loadEnvVars()
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('缺少必要的環境變數')
    }
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
    }
    const reset = '\x1b[0m'
    console.log(`${colors[type]}${message}${reset}`)
  }

  async checkAllProducts(): Promise<void> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      this.log('🔍 檢查資料庫中的所有產品...', 'info')

      // 查詢所有產品（不加任何過濾）
      const { data: allProducts, error: allError } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (allError) {
        this.log(`❌ 查詢所有產品失敗: ${allError.message}`, 'error')
        return
      }

      if (!allProducts || allProducts.length === 0) {
        this.log('⚠️  資料庫中沒有任何產品', 'warning')
        return
      }

      this.log(`📊 資料庫總產品數: ${allProducts.length}`, 'info')
      console.log('')

      // 詳細分析每個產品
      this.log('📋 產品詳細資訊:', 'info')
      allProducts.forEach((product, index) => {
        const activeStatus = product.is_active ? '✅ 啟用' : '❌ 停用'
        const catalogStatus = product.show_in_catalog ? '✅ 顯示' : '❌ 隱藏'
        
        console.log(`${index + 1}. ${product.name}`)
        console.log(`   ID: ${product.id}`)
        console.log(`   is_active: ${activeStatus}`)
        console.log(`   show_in_catalog: ${catalogStatus}`)
        console.log(`   類別: ${product.category}`)
        console.log(`   價格: $${product.price}`)
        console.log(`   建立時間: ${product.created_at}`)
        console.log('')
      })

      // 分析過濾結果
      await this.analyzeFilterResults(allProducts)

    } catch (error) {
      this.log(`❌ 檢查產品時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
    }
  }

  async analyzeFilterResults(allProducts: any[]): Promise<void> {
    this.log('🧪 分析不同過濾條件的結果...', 'info')

    // 模擬 supabaseProductService.getProducts() 的查詢
    const activeProducts = allProducts.filter(p => p.is_active === true)
    this.log(`📈 is_active = true 的產品: ${activeProducts.length} 個`, activeProducts.length > 0 ? 'success' : 'warning')

    // 模擬前端的額外過濾
    const catalogProducts = activeProducts.filter(p => p.show_in_catalog !== false)
    this.log(`📈 同時滿足 is_active = true 且 show_in_catalog 不為 false 的產品: ${catalogProducts.length} 個`, catalogProducts.length > 0 ? 'success' : 'warning')

    console.log('')
    this.log('🎯 最終會在網頁顯示的產品:', 'info')
    catalogProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (ID: ${product.id})`)
    })

    if (catalogProducts.length === 0) {
      console.log('')
      this.log('⚠️  沒有產品會顯示在網頁上！', 'warning')
      this.log('可能的原因:', 'info')
      console.log('1. 所有產品的 is_active 都是 false')
      console.log('2. 所有產品的 show_in_catalog 都是 false')
      console.log('3. 資料庫查詢有其他問題')
    } else if (catalogProducts.length < allProducts.length) {
      console.log('')
      this.log(`⚠️  只有 ${catalogProducts.length}/${allProducts.length} 產品會顯示`, 'warning')
      
      const hiddenProducts = allProducts.filter(p => 
        !p.is_active || p.show_in_catalog === false
      )
      
      this.log('被隱藏的產品:', 'info')
      hiddenProducts.forEach((product, index) => {
        const reason = !product.is_active ? 'is_active = false' : 'show_in_catalog = false'
        console.log(`${index + 1}. ${product.name} (原因: ${reason})`)
      })
    }
  }

  async testApiEndpoints(): Promise<void> {
    this.log('🌐 測試 API 端點...', 'info')

    try {
      // 測試一般產品 API
      const normalResponse = await fetch(`${this.supabaseUrl.replace(/\.supabase\.co.*/, '.vercel.app')}/api/products`)
      if (normalResponse.ok) {
        const normalData = await normalResponse.json()
        this.log(`📡 /api/products 返回: ${normalData.length} 個產品`, 'success')
      } else {
        this.log(`❌ /api/products 請求失敗: ${normalResponse.status}`, 'error')
      }

      // 測試管理員產品 API
      const adminResponse = await fetch(`${this.supabaseUrl.replace(/\.supabase\.co.*/, '.vercel.app')}/api/products?admin=true`)
      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        this.log(`📡 /api/products?admin=true 返回: ${adminData.length} 個產品`, 'success')
      } else {
        this.log(`❌ /api/products?admin=true 請求失敗: ${adminResponse.status}`, 'error')
      }

    } catch (error) {
      this.log('⚠️  無法測試 API 端點（可能需要在部署環境中測試）', 'warning')
    }
  }

  async suggestFix(): Promise<void> {
    console.log('')
    this.log('🔧 修復建議:', 'info')
    console.log('')

    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const { data: products } = await supabaseAdmin
        .from('products')
        .select('*')

      if (!products || products.length === 0) {
        console.log('1. 資料庫中沒有產品，請先新增產品')
        return
      }

      const inactiveProducts = products.filter(p => !p.is_active)
      const hiddenProducts = products.filter(p => p.show_in_catalog === false)

      if (inactiveProducts.length > 0) {
        console.log('1. 啟用被停用的產品:')
        console.log('   UPDATE products SET is_active = true WHERE id IN (')
        inactiveProducts.forEach((p, i) => {
          console.log(`     '${p.id}'${i < inactiveProducts.length - 1 ? ',' : ''}`)
        })
        console.log('   );')
        console.log('')
      }

      if (hiddenProducts.length > 0) {
        console.log('2. 顯示被隱藏的產品:')
        console.log('   UPDATE products SET show_in_catalog = true WHERE id IN (')
        hiddenProducts.forEach((p, i) => {
          console.log(`     '${p.id}'${i < hiddenProducts.length - 1 ? ',' : ''}`)
        })
        console.log('   );')
        console.log('')
      }

      const visibleProducts = products.filter(p => p.is_active && p.show_in_catalog !== false)
      if (visibleProducts.length === products.length) {
        console.log('3. 所有產品狀態都正常，問題可能在於:')
        console.log('   - 前端程式碼的過濾邏輯')
        console.log('   - API 快取問題')
        console.log('   - RLS 政策限制（雖然 products 表似乎沒有設定 RLS）')
      }

    } catch (error) {
      console.log('無法生成修復建議:', error)
    }
  }
}

async function main() {
  const diagnostics = new ProductDiagnostics()
  
  console.log('🚀 開始產品顯示問題診斷...')
  console.log('')

  await diagnostics.checkAllProducts()
  await diagnostics.testApiEndpoints()
  await diagnostics.suggestFix()

  console.log('')
  console.log('🎯 診斷完成！')
  console.log('如果問題仍未解決，請檢查:')
  console.log('1. 瀏覽器開發者工具的網路面板')
  console.log('2. 前端 console 的錯誤訊息')
  console.log('3. 是否有快取問題（嘗試硬重整）')
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 診斷腳本執行失敗:', error)
    process.exit(1)
  })
}

export default ProductDiagnostics