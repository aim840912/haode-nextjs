#!/usr/bin/env tsx

/**
 * 執行 user_interests 表格修復腳本
 *
 * 使用方法:
 * npx tsx scripts/execute-user-interests-fix.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function executeSQL(sql: string, description: string) {
  console.log(`\n🔄 執行: ${description}`)

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error(`❌ 錯誤:`, error)
      return false
    }

    console.log(`✅ 成功: ${description}`)
    if (data) {
      console.log('   結果:', data)
    }
    return true
  } catch (error) {
    console.error(`❌ 執行失敗:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 開始修復 user_interests 表格...')

  // 讀取 SQL 腳本
  const checkSQL = readFileSync(join(__dirname, 'check-user-interests-table.sql'), 'utf-8')
  const createSQL = readFileSync(join(__dirname, 'create-user-interests-table.sql'), 'utf-8')

  // 1. 檢查表格狀態
  console.log('\n📋 第一步：檢查現有表格狀態')

  // 分段執行檢查腳本
  const checkQueries = [
    {
      sql: `SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_interests'
      ) AS table_exists;`,
      desc: '檢查表格是否存在',
    },
    {
      sql: `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'user_interests' AND table_schema = 'public'
             ORDER BY ordinal_position;`,
      desc: '檢查表格結構',
    },
    {
      sql: `SELECT COUNT(*) as policies_count FROM pg_policies WHERE tablename = 'user_interests';`,
      desc: '檢查 RLS 政策數量',
    },
  ]

  for (const query of checkQueries) {
    await executeSQL(query.sql, query.desc)
  }

  // 2. 執行修復腳本
  console.log('\n🔧 第二步：執行修復腳本')

  // 分段執行建立腳本
  const createQueries = createSQL
    .split(';')
    .map(query => query.trim())
    .filter(query => query.length > 0 && !query.startsWith('--'))
    .filter(query => !query.includes('測試插入') && !query.includes('測試查詢'))

  let successCount = 0
  for (let i = 0; i < createQueries.length; i++) {
    const query = createQueries[i]
    if (query.includes('CREATE TABLE')) {
      if (await executeSQL(query, `建立 user_interests 表格 (${i + 1}/${createQueries.length})`)) {
        successCount++
      }
    } else if (query.includes('CREATE INDEX')) {
      if (await executeSQL(query, `建立索引 (${i + 1}/${createQueries.length})`)) {
        successCount++
      }
    } else if (query.includes('ALTER TABLE')) {
      if (await executeSQL(query, `設定 RLS (${i + 1}/${createQueries.length})`)) {
        successCount++
      }
    } else if (query.includes('CREATE POLICY')) {
      if (await executeSQL(query, `建立政策 (${i + 1}/${createQueries.length})`)) {
        successCount++
      }
    } else if (query.includes('GRANT')) {
      if (await executeSQL(query, `設定權限 (${i + 1}/${createQueries.length})`)) {
        successCount++
      }
    } else if (query.trim().length > 10) {
      if (await executeSQL(query, `執行語句 (${i + 1}/${createQueries.length})`)) {
        successCount++
      }
    }
  }

  // 3. 驗證結果
  console.log('\n✅ 第三步：驗證修復結果')

  const verifyQueries = [
    {
      sql: `SELECT
              (SELECT COUNT(*) FROM information_schema.tables
               WHERE table_name = 'user_interests' AND table_schema = 'public') as table_exists,
              (SELECT COUNT(*) FROM pg_policies
               WHERE tablename = 'user_interests') as policies_count,
              (SELECT COUNT(*) FROM pg_indexes
               WHERE tablename = 'user_interests') as indexes_count;`,
      desc: '最終驗證結果',
    },
  ]

  for (const query of verifyQueries) {
    await executeSQL(query.sql, query.desc)
  }

  console.log(`\n🎉 修復完成！成功執行 ${successCount} 個 SQL 語句`)
  console.log('\n📝 建議：')
  console.log('   1. 重新啟動開發伺服器測試功能')
  console.log('   2. 檢查應用程式日誌確認錯誤已解決')
  console.log('   3. 測試「我有興趣」功能是否正常工作')
}

// 處理未捕獲的錯誤
process.on('unhandledRejection', error => {
  console.error('❌ 未處理的錯誤:', error)
  process.exit(1)
})

main().catch(error => {
  console.error('❌ 腳本執行失敗:', error)
  process.exit(1)
})
