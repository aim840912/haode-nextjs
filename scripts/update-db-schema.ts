#!/usr/bin/env npx tsx

/**
 * 資料庫結構更新腳本
 * 自動添加缺少的欄位到 products 表格
 */

import { createClient } from '@supabase/supabase-js'
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
      }
    } catch (error) {
      console.log('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

async function updateProductsTable() {
  console.log('🔧 開始更新 products 表格結構...\n')

  loadEnvVars()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少必要的環境變數')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log('📋 檢查現有表格結構...')

    // 檢查 emoji 欄位
    const { error: emojiError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name = 'emoji'
            ) THEN
                ALTER TABLE products ADD COLUMN emoji TEXT DEFAULT '';
                RAISE NOTICE 'Added emoji column';
            ELSE
                RAISE NOTICE 'Emoji column already exists';
            END IF;
        END $$;
      `,
    })

    if (emojiError) {
      console.log('⚠️ 使用直接 SQL 方式添加 emoji 欄位...')
      try {
        await supabaseAdmin.from('products').select('emoji').limit(1)
      } catch {
        // 如果查詢失敗，說明欄位不存在，嘗試其他方法
        console.log('🔧 emoji 欄位不存在，建議手動執行 SQL')
      }
    }

    // 檢查 stock 欄位
    console.log('📦 檢查 stock 欄位...')
    const { error: stockError } = await supabaseAdmin.from('products').select('stock').limit(1)

    if (stockError && stockError.message.includes('stock')) {
      console.log('🔧 stock 欄位不存在，建議手動執行 SQL')
    } else {
      console.log('✅ stock 欄位存在')
    }

    console.log('\n📝 建議執行以下 SQL 語句：')
    console.log('複製 sql/update-products-table.sql 的內容')
    console.log('在 Supabase Dashboard > SQL Editor 執行')
  } catch (error) {
    console.error('❌ 更新過程發生錯誤:', error)
  }
}

if (require.main === module) {
  updateProductsTable().catch(console.error)
}
