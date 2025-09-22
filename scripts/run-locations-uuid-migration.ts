/**
 * 安全執行 locations UUID 遷移腳本
 *
 * 此腳本會將 locations 表的 ID 從 BIGSERIAL 改為 UUID
 * ⚠️ 這是一個重大的架構變更，執行前請確保已備份資料
 */

import { readFileSync } from 'fs'
import path from 'path'
import { getSupabaseAdmin } from '../src/lib/database/supabase-auth'

async function runLocationsMigration() {
  console.log('🚀 開始執行 locations UUID 遷移...')

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    console.error('❌ 無法初始化 Supabase 管理員客戶端')
    process.exit(1)
  }

  try {
    // 1. 檢查當前 locations 表結構
    console.log('📋 檢查當前 locations 表結構...')
    const { data: currentStructure, error: structureError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'locations')
      .eq('table_schema', 'public')
      .eq('column_name', 'id')

    if (structureError) {
      console.error('❌ 檢查表結構失敗:', structureError)
      process.exit(1)
    }

    if (!currentStructure || currentStructure.length === 0) {
      console.error('❌ 找不到 locations 表或 id 欄位')
      process.exit(1)
    }

    const currentIdType = currentStructure[0].data_type
    console.log(`📊 當前 ID 類型: ${currentIdType}`)

    // 檢查是否已經是 UUID
    if (currentIdType === 'uuid') {
      console.log('✅ locations 表已經使用 UUID，無需遷移')
      return
    }

    // 2. 檢查現有資料數量
    const { count, error: countError } = await supabaseAdmin
      .from('locations')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ 檢查資料數量失敗:', countError)
      process.exit(1)
    }

    console.log(`📊 當前 locations 表有 ${count} 筆記錄`)

    // 3. 確認執行遷移
    console.log('\n⚠️  警告：即將執行以下變更：')
    console.log('   • 將 locations.id 從 BIGSERIAL 改為 UUID')
    console.log('   • 現有記錄會獲得新的 UUID')
    console.log('   • 舊 ID 映射會儲存在 location_id_mapping 表中')
    console.log('   • 此操作會暫時鎖定 locations 表')

    // 在生產環境中，你可能想要添加互動式確認
    // 目前為了自動化，跳過互動確認

    // 4. 讀取並執行遷移 SQL
    console.log('\n🔄 開始執行遷移 SQL...')
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/002_migrate_locations_to_uuid.sql'
    )
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // 執行遷移（Supabase 客戶端不支援多語句，需要分段執行）
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT')

    for (const statement of sqlStatements) {
      if (statement.includes('RAISE NOTICE') || statement.includes('DO $$')) {
        // 跳過 PostgreSQL 特定語法，這些在 Supabase 客戶端中無法執行
        continue
      }

      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error(`❌ SQL 執行失敗: ${statement.substring(0, 100)}...`)
          console.error('錯誤:', error)
          throw error
        }
      } catch (err) {
        // 某些語句可能需要特殊處理
        console.warn(`⚠️ 語句跳過: ${statement.substring(0, 50)}...`)
      }
    }

    // 5. 驗證遷移結果
    console.log('🔍 驗證遷移結果...')

    // 檢查新的表結構
    const { data: newStructure, error: newStructureError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'locations')
      .eq('table_schema', 'public')
      .eq('column_name', 'id')

    if (newStructureError) {
      console.error('❌ 檢查新表結構失敗:', newStructureError)
      throw newStructureError
    }

    const newIdType = newStructure?.[0]?.data_type
    console.log(`📊 新 ID 類型: ${newIdType}`)

    // 檢查資料數量是否一致
    const { count: newCount, error: newCountError } = await supabaseAdmin
      .from('locations')
      .select('*', { count: 'exact', head: true })

    if (newCountError) {
      console.error('❌ 檢查新資料數量失敗:', newCountError)
      throw newCountError
    }

    console.log(`📊 遷移後 locations 表有 ${newCount} 筆記錄`)

    if (count !== newCount) {
      console.error(`❌ 資料遺失！遷移前: ${count}, 遷移後: ${newCount}`)
      throw new Error('遷移過程中資料遺失')
    }

    // 6. 檢查是否有 UUID 格式的 ID
    const { data: sampleRecord, error: sampleError } = await supabaseAdmin
      .from('locations')
      .select('id')
      .limit(1)
      .single()

    if (sampleError) {
      console.error('❌ 檢查樣本記錄失敗:', sampleError)
      throw sampleError
    }

    const sampleId = sampleRecord?.id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(sampleId)) {
      console.error(`❌ ID 格式不正確: ${sampleId}`)
      throw new Error('ID 未正確轉換為 UUID 格式')
    }

    console.log('✅ 遷移成功完成！')
    console.log('\n📝 後續步驟：')
    console.log('1. 更新 TypeScript 類型定義')
    console.log('2. 更新所有 Location 相關程式碼')
    console.log('3. 測試所有 CRUD 操作')
    console.log('4. 確認功能正常後可刪除 location_id_mapping 表')
  } catch (error) {
    console.error('❌ 遷移過程中發生錯誤:', error)
    console.log('\n💡 恢復建議：')
    console.log('1. 檢查資料庫狀態')
    console.log('2. 如果資料完整，檢查程式碼是否需要調整')
    console.log('3. 如果資料有問題，從備份恢復')
    process.exit(1)
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  runLocationsMigration().catch(console.error)
}

export { runLocationsMigration }
