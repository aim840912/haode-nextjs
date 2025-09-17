#!/usr/bin/env tsx

/**
 * 簡單檢查 user_interests 表格是否存在
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxlrtcagsuoijjolgdzs.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MiP7LTM7Ok_Dd-CYIh6_Ag_eaZrbCLJ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTable() {
  console.log('🔍 檢查 user_interests 表格是否存在...')

  try {
    // 嘗試查詢表格
    const { data, error } = await supabase
      .from('user_interests')
      .select('count(*)', { count: 'exact', head: true })

    if (error) {
      console.log('❌ 表格不存在或無法訪問')
      console.log('   錯誤:', error.message)
      console.log('   錯誤代碼:', error.code)
      return false
    }

    console.log('✅ user_interests 表格存在且可訪問')
    console.log('   記錄數:', data)
    return true
  } catch (error) {
    console.log('❌ 檢查失敗:', error)
    return false
  }
}

async function main() {
  const exists = await checkTable()

  if (!exists) {
    console.log('\n💡 建議解決方案:')
    console.log('   1. 到 Supabase Dashboard 手動建立 user_interests 表格')
    console.log('   2. 或使用 Supabase SQL Editor 執行以下腳本:')
    console.log('      scripts/create-user-interests-table.sql')
    console.log('\n   表格結構:')
    console.log('   - id: UUID (Primary Key)')
    console.log('   - user_id: UUID (Not Null)')
    console.log('   - product_id: UUID (Not Null)')
    console.log('   - created_at: TIMESTAMP WITH TIME ZONE')
    console.log('   - UNIQUE(user_id, product_id)')
  } else {
    console.log('\n✅ 表格已存在，問題可能出在其他地方')
    console.log('   建議檢查 RLS 政策和權限設定')
  }
}

main().catch(console.error)
