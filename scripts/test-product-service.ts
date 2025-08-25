#!/usr/bin/env npx tsx

/**
 * 直接測試產品服務邏輯
 * 模擬前端呼叫來診斷問題
 */

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

async function testProductServices() {
  loadEnvVars()
  
  console.log('🔧 直接測試產品服務...')
  console.log('')

  try {
    // 測試 SupabaseProductService
    console.log('📊 測試 SupabaseProductService:')
    const { supabaseProductService } = await import('../src/services/supabaseProductService')
    
    const supabaseProducts = await supabaseProductService.getProducts()
    console.log(`   ✅ getProducts() 返回: ${supabaseProducts.length} 個產品`)
    
    if (supabaseProducts.length > 0) {
      console.log('   產品列表:')
      supabaseProducts.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.name} (isActive: ${product.isActive}, showInCatalog: ${product.showInCatalog})`)
      })
    }

    // 測試 getAllProducts
    if (supabaseProductService.getAllProducts) {
      const allProducts = await supabaseProductService.getAllProducts()
      console.log(`   ✅ getAllProducts() 返回: ${allProducts.length} 個產品`)
    }

    console.log('')

    // 測試服務工廠
    console.log('🏭 測試服務工廠:')
    const { productService } = await import('../src/services/productService')
    
    const serviceProducts = await productService.getProducts()
    console.log(`   ✅ productService.getProducts() 返回: ${serviceProducts.length} 個產品`)

    if (serviceProducts.length > 0) {
      console.log('   產品列表:')
      serviceProducts.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.name} (isActive: ${product.isActive}, showInCatalog: ${product.showInCatalog})`)
      })
    }

    console.log('')

    // 檢查服務工廠的配置
    console.log('⚙️ 檢查服務配置:')
    const { getProductService } = await import('../src/services/serviceFactory')
    const actualService = await getProductService()
    console.log(`   使用的服務類型: ${actualService.constructor.name}`)

    console.log('')

    // 模擬前端過濾邏輯
    console.log('🎯 模擬前端過濾邏輯:')
    const rawProducts = await productService.getProducts()
    const filteredProducts = rawProducts.filter((p: any) => p.isActive && (p.showInCatalog ?? true))
    console.log(`   原始產品數: ${rawProducts.length}`)
    console.log(`   過濾後產品數: ${filteredProducts.length}`)

    if (filteredProducts.length !== rawProducts.length) {
      console.log('   被過濾掉的產品:')
      const hiddenProducts = rawProducts.filter((p: any) => !p.isActive || p.showInCatalog === false)
      hiddenProducts.forEach((product: any, index: number) => {
        const reason = !product.isActive ? 'isActive = false' : 'showInCatalog = false'
        console.log(`     ${index + 1}. ${product.name} (原因: ${reason})`)
      })
    }

  } catch (error) {
    console.error('❌ 測試產品服務時發生錯誤:', error)
  }
}

async function main() {
  console.log('🚀 開始產品服務測試...')
  console.log('')

  await testProductServices()

  console.log('')
  console.log('🎯 測試完成！')
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 測試腳本執行失敗:', error)
    process.exit(1)
  })
}