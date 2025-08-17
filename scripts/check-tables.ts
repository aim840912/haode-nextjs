#!/usr/bin/env npx tsx

/**
 * 檢查 Supabase 現有表格
 */

import { createClient } from '@supabase/supabase-js'

// 手動載入環境變數
function loadEnvVars() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const fs = require('fs')
      const path = require('path')
      const envPath = path.join(process.cwd(), '.env.local')
      
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const envLines = envContent.split('\n')
        
        envLines.forEach(line => {
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
      console.log('❌ 無法載入 .env.local')
    }
  }
}

loadEnvVars()

async function checkTables() {
  console.log('📋 檢查 Supabase 現有表格\n')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 查詢 information_schema 來取得表格列表
  try {
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) {
      console.log('❌ 無法查詢表格列表:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ 找到以下表格:')
      data.forEach((table: any, index: number) => {
        console.log(`${index + 1}. ${table.table_name}`)
      })
    } else {
      console.log('⚠️ 沒有找到任何公開表格')
    }
  } catch (err) {
    console.log('❌ 查詢失敗:', err)
  }

  console.log('\n如果沒有表格，請執行:')
  console.log('1. 複製 sql/init-tables.sql 的內容')
  console.log('2. 在 Supabase Dashboard > SQL Editor 執行')
}

checkTables().catch(console.error)