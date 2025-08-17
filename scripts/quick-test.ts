#!/usr/bin/env npx tsx

/**
 * 快速 Supabase 連線測試
 * 用於檢查 API Keys 是否正確
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
      console.log('❌ 無法載入 .env.local')
    }
  }
}

loadEnvVars()

async function quickTest() {
  console.log('🔍 快速 Supabase 連線測試\n')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('📋 環境變數檢查:')
  console.log(`URL: ${url ? '✅' : '❌'} ${url?.substring(0, 50)}...`)
  console.log(`Anon Key: ${anonKey ? '✅' : '❌'} ${anonKey?.substring(0, 20)}...`)
  console.log(`Service Key: ${serviceKey ? '✅' : '❌'} ${serviceKey?.substring(0, 20)}...\n`)
  
  if (!url || !anonKey || !serviceKey) {
    console.log('❌ 環境變數缺失，請檢查 .env.local 檔案')
    return
  }

  // 測試 1: 基本連線
  console.log('🔗 測試基本連線...')
  try {
    const supabase = createClient(url, anonKey)
    
    // 簡單的健康檢查
    const { data, error } = await supabase
      .from('test_data')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️ test_data 表格不存在，需要執行 SQL 初始化')
      } else {
        console.log(`❌ 連線錯誤: ${error.message}`)
        console.log(`錯誤代碼: ${error.code}`)
      }
    } else {
      console.log('✅ Anon Key 連線成功')
    }
  } catch (err) {
    console.log(`❌ 連線失敗: ${err}`)
  }

  // 測試 2: Service Role 連線
  console.log('\n🛡️ 測試 Service Role 連線...')
  try {
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data, error } = await supabaseAdmin
      .from('test_data')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️ test_data 表格不存在，需要執行 SQL 初始化')
      } else {
        console.log(`❌ Service Role 錯誤: ${error.message}`)
        console.log(`錯誤代碼: ${error.code}`)
      }
    } else {
      console.log('✅ Service Role 連線成功')
    }
  } catch (err) {
    console.log(`❌ Service Role 連線失敗: ${err}`)
  }

  console.log('\n📝 下一步操作:')
  console.log('1. 如果看到 "表格不存在" 錯誤：')
  console.log('   - 複製 sql/init-tables.sql 內容')
  console.log('   - 在 Supabase Dashboard > SQL Editor 執行')
  console.log('2. 如果看到其他連線錯誤：')
  console.log('   - 檢查 API Keys 是否來自新的 "API Keys" 標籤')
  console.log('   - 確認 Supabase 專案狀態正常')
}

quickTest().catch(console.error)