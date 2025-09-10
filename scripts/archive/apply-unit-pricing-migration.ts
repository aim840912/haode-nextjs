#!/usr/bin/env npx tsx

/**
 * 應用單位價格遷移腳本
 * 新增 price_unit 和 unit_quantity 欄位到 products 表
 */

import { createServiceSupabaseClient } from '../src/lib/supabase-server'
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

async function applyUnitPricingMigration() {
  try {
    // 載入環境變數
    loadEnvVars()

    console.log('🔄 應用單位價格遷移...')

    // 讀取遷移檔案
    const migrationPath = path.join(__dirname, '../add-unit-pricing-columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // 分割 SQL 語句
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const client = createServiceSupabaseClient()

    console.log(`📝 找到 ${statements.length} 個 SQL 語句待執行`)

    // 執行每個語句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`⚡ 執行語句 ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)

      try {
        // 嘗試使用 rpc 執行
        const { error } = await client.rpc('exec_sql', { sql: statement })

        if (error) {
          console.log(`   ⚠️  RPC 執行失敗: ${error.message}`)

          // 如果是 ALTER TABLE 語句，嘗試使用不同的方法
          if (statement.toUpperCase().includes('ALTER TABLE')) {
            console.log(`   🔧 嘗試替代執行方法...`)

            // 嘗試直接查詢來測試欄位是否已存在
            const { error: testError } = await client
              .from('products')
              .select('price_unit, unit_quantity')
              .limit(1)

            if (!testError) {
              console.log(`   ✅ 欄位已存在，跳過此語句`)
            } else if (
              testError.message.includes('column') &&
              (testError.message.includes('price_unit') ||
                testError.message.includes('unit_quantity'))
            ) {
              console.log(`   ❌ 欄位不存在，需要手動添加`)
              console.log(`   請在 Supabase Dashboard 中手動執行: ${statement}`)
            } else {
              console.log(`   ❌ 其他錯誤: ${testError.message}`)
            }
          } else {
            console.log(`   ❌ 執行失敗: ${error.message}`)
          }
        } else {
          console.log(`   ✅ 成功`)
        }
      } catch (err) {
        console.log(`   ⚠️  例外: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // 驗證遷移結果
    console.log('\n🔍 驗證遷移結果...')
    const { data, error } = await client
      .from('products')
      .select('id, name, price, price_unit, unit_quantity')
      .limit(1)

    if (error) {
      if (
        error.message.includes('column') &&
        (error.message.includes('price_unit') || error.message.includes('unit_quantity'))
      ) {
        console.log('❌ 遷移未完成: price_unit 和 unit_quantity 欄位不存在')
        console.log('\n📋 手動執行步驟:')
        console.log('1. 打開 Supabase Dashboard')
        console.log('2. 進入 SQL Editor')
        console.log('3. 執行以下 SQL:')
        console.log('   ALTER TABLE products ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20);')
        console.log(
          '   ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC DEFAULT 1;'
        )
      } else {
        console.log(`❌ 驗證失敗: ${error.message}`)
      }
    } else {
      console.log('✅ 遷移驗證成功! 新欄位可以使用了。')
      if (data && data.length > 0) {
        const product = data[0]
        console.log(`📊 範例產品資料:`)
        console.log(`   ID: ${product.id}`)
        console.log(`   名稱: ${product.name}`)
        console.log(`   價格: ${product.price}`)
        console.log(`   單位: ${product.price_unit || '未設定'}`)
        console.log(`   數量: ${product.unit_quantity || '未設定'}`)
      }
    }
  } catch (error) {
    console.error('💥 遷移失敗:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  applyUnitPricingMigration().catch(error => {
    console.error('❌ 腳本執行失敗:', error)
    process.exit(1)
  })
}
