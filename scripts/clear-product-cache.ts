#!/usr/bin/env npx tsx

/**
 * 清理產品快取的腳本
 * 解決可能的快取問題導致的產品顯示不正確
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

async function clearAllCaches() {
  loadEnvVars()
  
  console.log('🧹 開始清理產品快取...')
  console.log('')

  try {
    // 清理內存快取
    console.log('💾 清理內存快取:')
    
    // 重新初始化產品服務以清理快取
    const { productService } = await import('../src/services/productService')
    
    // 強制清理快取（如果服務支持的話）
    if ('clearCache' in productService && typeof productService.clearCache === 'function') {
      await productService.clearCache()
      console.log('   ✅ 產品服務快取已清理')
    } else {
      console.log('   ⚠️  產品服務不支援手動清理快取')
    }

    // 測試 API 快取清理
    console.log('')
    console.log('🌐 測試 API 快取清理:')
    
    try {
      // 嘗試使用時間戳參數強制更新
      const timestamp = Date.now()
      const testUrl = `http://localhost:3000/api/products?t=${timestamp}`
      
      const response = await fetch(testUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ API 測試成功，返回 ${data.length} 個產品`)
      } else {
        console.log(`   ⚠️  API 測試失敗: ${response.status} (可能服務器未運行)`)
      }
    } catch (error) {
      console.log('   ⚠️  無法測試 API（本地服務器可能未運行）')
    }

    // 重新載入產品並驗證
    console.log('')
    console.log('🔄 重新載入產品驗證:')
    
    const products = await productService.getProducts()
    console.log(`   📊 重新載入後的產品數量: ${products.length}`)
    
    if (products.length > 0) {
      console.log('   產品清單:')
      products.forEach((product: any, index: number) => {
        console.log(`     ${index + 1}. ${product.name}`)
      })
    }

    console.log('')
    console.log('✅ 快取清理完成！')
    
    console.log('')
    console.log('🎯 建議的除錯步驟:')
    console.log('1. 重新啟動開發服務器: npm run dev')
    console.log('2. 清理瀏覽器快取並硬重整 (Ctrl+Shift+R)')
    console.log('3. 檢查瀏覽器開發者工具的網路面板')
    console.log('4. 檢查 console 是否有 JavaScript 錯誤')
    console.log('5. 確認沒有 JavaScript 過濾邏輯問題')

  } catch (error) {
    console.error('❌ 清理快取時發生錯誤:', error)
  }
}

// 建立一個強制重新載入產品的函數
async function forceReloadProducts() {
  console.log('')
  console.log('🔄 強制重新載入產品資料...')
  
  try {
    const { supabaseProductService } = await import('../src/services/supabaseProductService')
    
    // 直接從資料庫獲取最新資料
    const products = await supabaseProductService.getProducts()
    console.log(`直接從 Supabase 查詢結果: ${products.length} 個產品`)
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (ID: ${product.id})`)
      console.log(`   isActive: ${product.isActive}`)
      console.log(`   showInCatalog: ${product.showInCatalog}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('重新載入產品時發生錯誤:', error)
  }
}

async function main() {
  console.log('🚀 產品快取清理與驗證工具')
  console.log('')

  await clearAllCaches()
  await forceReloadProducts()

  console.log('')
  console.log('🎯 完成！如果問題仍然存在，請檢查:')
  console.log('- 前端 React 組件狀態')
  console.log('- useEffect 依賴陣列')
  console.log('- 瀏覽器開發者工具中的錯誤')
  console.log('- 網路請求是否成功')
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 腳本執行失敗:', error)
    process.exit(1)
  })
}