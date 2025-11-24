#!/usr/bin/env npx tsx

/**
 * 直接新增單位價格欄位到資料庫
 * 使用原始 HTTP API 方式執行 SQL
 */

import fs from 'fs'
import path from 'path'

// 載入環境變數
function loadEnvVars() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
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

async function addUnitPricingColumnsDirect() {
  try {
    // 載入環境變數
    loadEnvVars()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      throw new Error('缺少必要的環境變數：NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    }

    console.log('🔧 直接新增單位價格欄位...')

    // SQL 語句
    const sqls = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20);',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC DEFAULT 1;',
      "COMMENT ON COLUMN products.price_unit IS '價格單位（如：斤、包、箱等）';",
      "COMMENT ON COLUMN products.unit_quantity IS '單位數量，預設為 1';",
    ]

    for (let i = 0; i < sqls.length; i++) {
      const sql = sqls[i]
      console.log(`⚡ 執行語句 ${i + 1}/${sqls.length}...`)
      console.log(`   ${sql.substring(0, 80)}${sql.length > 80 ? '...' : ''}`)

      try {
        // 使用 REST API 直接執行 SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            apikey: serviceKey,
          },
          body: JSON.stringify({
            query: sql,
          }),
        })

        if (!response.ok) {
          // 嘗試使用查詢參數方式
          const response2 = await fetch(
            `${supabaseUrl}/rest/v1/rpc/exec?query=${encodeURIComponent(sql)}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                apikey: serviceKey,
              },
            }
          )

          if (!response2.ok) {
            const text = await response.text()
            console.log(`   ⚠️  HTTP 執行失敗 (${response.status}): ${text}`)
          } else {
            console.log(`   ✅ 執行成功 (方法 2)`)
          }
        } else {
          console.log(`   ✅ 執行成功`)
        }
      } catch (error) {
        console.log(`   ⚠️  例外: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 驗證結果 - 使用簡單的 fetch 請求
    console.log('\n🔍 驗證欄位是否已新增...')

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/products?select=id,name,price,price_unit,unit_quantity&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            Accept: 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ 驗證成功! 欄位已可用。')

        if (data.length > 0) {
          const product = data[0]
          console.log(`📊 範例產品資料:`)
          console.log(`   ID: ${product.id}`)
          console.log(`   名稱: ${product.name}`)
          console.log(`   價格: ${product.price}`)
          console.log(`   單位: ${product.price_unit || '未設定'}`)
          console.log(`   數量: ${product.unit_quantity || '未設定'}`)
        }

        // 更新現有產品的預設值
        console.log('\n🔄 為現有產品設定預設單位數量...')
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/products?unit_quantity=is.null`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              apikey: serviceKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              unit_quantity: 1,
            }),
          }
        )

        if (updateResponse.ok) {
          console.log('✅ 現有產品預設值設定完成')
        } else {
          console.log('⚠️  預設值設定失敗，但欄位已新增')
        }
      } else {
        const text = await response.text()
        console.log(`❌ 驗證失敗: ${text}`)
      }
    } catch (error) {
      console.log(`❌ 驗證時發生錯誤: ${error instanceof Error ? error.message : String(error)}`)
    }
  } catch (error) {
    console.error('💥 操作失敗:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  addUnitPricingColumnsDirect().catch(error => {
    console.error('❌ 腳本執行失敗:', error)
    process.exit(1)
  })
}
