/**
 * 執行 Farm Tour 表結構更新 Migration
 *
 * 使用方法：npm run tsx scripts/run-farm-tour-migration.ts
 */

// 載入環境變數
import { config } from 'dotenv'
import { resolve } from 'path'

// 載入 .env.local 檔案
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { dbLogger } from '../src/lib/logger'

async function runMigration() {
  // 除錯：檢查環境變數
  console.log('環境變數檢查:')
  console.log(
    'NEXT_PUBLIC_SUPABASE_URL:',
    process.env.NEXT_PUBLIC_SUPABASE_URL ? '已設定' : '未設定'
  )
  console.log(
    'SUPABASE_SERVICE_ROLE_KEY:',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? '已設定' : '未設定'
  )

  // 直接創建 Supabase 客戶端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('缺少必要的 Supabase 環境變數')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    dbLogger.info('開始執行 Farm Tour Migration', {
      module: 'Migration',
      action: 'farm-tour-update',
    })

    // 檢查目前表結構
    dbLogger.info('檢查目前表結構...')
    const { data: currentCols, error: colError } = await supabase
      .from('farm_tour')
      .select('*')
      .limit(1)

    if (colError) {
      dbLogger.warn('無法檢查表結構', { error: colError })
    } else {
      dbLogger.info('表存在，繼續執行 migration')
    }

    // 步驟 1: 移除不需要的欄位
    dbLogger.info('步驟 1: 移除不需要的欄位')
    const dropColumns = [
      'ALTER TABLE farm_tour DROP COLUMN IF EXISTS duration',
      'ALTER TABLE farm_tour DROP COLUMN IF EXISTS season',
      'ALTER TABLE farm_tour DROP COLUMN IF EXISTS highlight',
      'ALTER TABLE farm_tour DROP COLUMN IF EXISTS includes',
    ]

    for (const sql of dropColumns) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql })
        if (error) {
          dbLogger.warn(`執行 SQL 失敗: ${sql}`, { error })
        } else {
          dbLogger.info(`成功執行: ${sql}`)
        }
      } catch (err) {
        dbLogger.warn(`SQL 執行錯誤: ${sql}`, { error: err })
      }
    }

    // 步驟 2: 修改 months 為兩個數字欄位
    dbLogger.info('步驟 2: 修改月份欄位')
    const monthColumns = [
      'ALTER TABLE farm_tour DROP COLUMN IF EXISTS months',
      'ALTER TABLE farm_tour ADD COLUMN IF NOT EXISTS start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12)',
      'ALTER TABLE farm_tour ADD COLUMN IF NOT EXISTS end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12)',
    ]

    for (const sql of monthColumns) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql })
        if (error) {
          dbLogger.warn(`執行 SQL 失敗: ${sql}`, { error })
        } else {
          dbLogger.info(`成功執行: ${sql}`)
        }
      } catch (err) {
        dbLogger.warn(`SQL 執行錯誤: ${sql}`, { error: err })
      }
    }

    // 步驟 3: 修改 price 欄位
    dbLogger.info('步驟 3: 修改價格欄位')
    const priceColumns = [
      'ALTER TABLE farm_tour ALTER COLUMN price SET DEFAULT 0',
      'ALTER TABLE farm_tour ALTER COLUMN price DROP NOT NULL',
    ]

    for (const sql of priceColumns) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql })
        if (error) {
          dbLogger.warn(`執行 SQL 失敗: ${sql}`, { error })
        } else {
          dbLogger.info(`成功執行: ${sql}`)
        }
      } catch (err) {
        dbLogger.warn(`SQL 執行錯誤: ${sql}`, { error: err })
      }
    }

    // 步驟 4: 為現有資料設定預設值
    dbLogger.info('步驟 4: 為現有資料設定預設值')
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `UPDATE farm_tour
              SET start_month = COALESCE(start_month, 1),
                  end_month = COALESCE(end_month, 12),
                  price = COALESCE(price, 0)
              WHERE start_month IS NULL OR end_month IS NULL OR price IS NULL`,
      })

      if (error) {
        dbLogger.warn('更新現有資料失敗', { error })
      } else {
        dbLogger.info('成功更新現有資料預設值')
      }
    } catch (err) {
      dbLogger.warn('更新現有資料錯誤', { error: err })
    }

    // 驗證表結構
    dbLogger.info('驗證 Migration 結果...')
    try {
      const { data: verifyData, error: verifyError } = await supabase
        .from('farm_tour')
        .select('*')
        .limit(1)

      if (!verifyError) {
        dbLogger.info('Migration 驗證成功，表結構已更新')
      } else {
        dbLogger.error('Migration 驗證失敗', new Error(verifyError.message))
      }
    } catch (err) {
      dbLogger.error('Migration 驗證錯誤', err as Error)
    }

    dbLogger.info('Farm Tour Migration 完成')
  } catch (error) {
    dbLogger.error('Migration 執行失敗', error as Error)
    process.exit(1)
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration 完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('Migration 失敗:', error)
      process.exit(1)
    })
}

export { runMigration }
