/**
 * 執行四季體驗圖片設定 Migration
 * 新增 4 個四季體驗圖片設定鍵
 *
 * 使用方法：npx tsx scripts/run-season-images-migration.ts
 */

// 載入環境變數
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// 載入 .env.local 檔案
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { dbLogger } from '../src/lib/logger'

async function runMigration() {
  // 檢查環境變數
  console.log('環境變數檢查:')
  console.log(
    'NEXT_PUBLIC_SUPABASE_URL:',
    process.env.NEXT_PUBLIC_SUPABASE_URL ? '已設定' : '未設定'
  )
  console.log(
    'SUPABASE_SERVICE_ROLE_KEY:',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? '已設定' : '未設定'
  )

  // 創建 Supabase 客戶端
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
    dbLogger.info('開始執行四季體驗圖片設定 Migration', {
      module: 'Migration',
      action: 'season-images-settings',
    })

    console.log('\n執行插入操作...')
    console.log('─'.repeat(50))

    const settingsToInsert = [
      {
        key: 'home.season_spring_image',
        value: '/images/locations/mountain.jpg',
        type: 'image',
        description: '首頁四季體驗 - 春季賞花圖片',
      },
      {
        key: 'home.season_summer_image',
        value: '/images/farm-tour/many_people_1.jpg',
        type: 'image',
        description: '首頁四季體驗 - 夏日採果圖片',
      },
      {
        key: 'home.season_autumn_image',
        value: '/images/locations/mountain.jpg',
        type: 'image',
        description: '首頁四季體驗 - 秋收體驗圖片',
      },
      {
        key: 'home.season_winter_image',
        value: '/images/farm-tour/many_people_1.jpg',
        type: 'image',
        description: '首頁四季體驗 - 冬日品茶圖片',
      },
    ]

    for (const setting of settingsToInsert) {
      // 檢查鍵是否已存在
      const { data: existing } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', setting.key)
        .single()

      if (existing) {
        console.log(`✓ 設定鍵 ${setting.key} 已存在，跳過`)
        continue
      }

      // 插入新設定
      const { error: insertError } = await supabase.from('site_settings').insert([setting])

      if (insertError) {
        console.error(`✗ 插入 ${setting.key} 失敗:`, insertError.message)
      } else {
        console.log(`✓ 成功插入設定鍵: ${setting.key}`)
      }
    }

    // 驗證插入結果
    console.log('\n驗證插入結果...')
    console.log('─'.repeat(50))

    const keysToCheck = [
      'home.season_spring_image',
      'home.season_summer_image',
      'home.season_autumn_image',
      'home.season_winter_image',
    ]

    for (const key of keysToCheck) {
      const { data: setting, error: checkError } = await supabase
        .from('site_settings')
        .select('key, value, type, description')
        .eq('key', key)
        .single()

      if (checkError) {
        console.log(`✗ ${key}: 不存在`)
      } else {
        console.log(`✓ ${key}: 存在`)
        console.log(`  類型: ${setting.type}, 說明: ${setting.description}`)
      }
    }

    console.log('\n' + '─'.repeat(50))
    console.log('✓ Migration 執行完成！')

    dbLogger.info('四季體驗圖片設定 Migration 完成', {
      module: 'Migration',
      action: 'season-images-settings',
    })
  } catch (error) {
    dbLogger.error('Migration 執行失敗', error as Error, {
      module: 'Migration',
      action: 'season-images-settings',
    })
    console.error('執行失敗:', error)
    process.exit(1)
  }
}

// 執行 Migration
runMigration()
  .then(() => {
    console.log('\n✓ 所有操作已完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n✗ 執行過程發生錯誤:', error)
    process.exit(1)
  })
