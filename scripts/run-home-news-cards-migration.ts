/**
 * 執行首頁最新消息卡片設定 Migration
 * 新增 12 個首頁最新消息卡片設定鍵（當季推薦 + 農場活動）
 *
 * 使用方法：npx tsx scripts/run-home-news-cards-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { dbLogger } from '../src/lib/logger'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 手動載入 .env.local 檔案
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        const value = valueParts
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '')
        if (key && value) {
          process.env[key.trim()] = value
        }
      }
    })
  } catch (error) {
    console.error('無法載入 .env.local 檔案:', error)
  }
}

loadEnvFile()

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
    dbLogger.info('開始執行首頁最新消息卡片設定 Migration', {
      module: 'Migration',
      action: 'home-news-cards-settings',
    })

    console.log('\n執行 SQL 遷移腳本...')
    console.log('─'.repeat(50))

    const settingsToInsert = [
      // 當季推薦卡片設定
      {
        key: 'home.news.seasonal_recommendation.enabled',
        value: 'true',
        type: 'boolean',
        description: '是否啟用當季推薦卡片',
      },
      {
        key: 'home.news.seasonal_recommendation.title',
        value: '當季推薦',
        type: 'string',
        description: '當季推薦卡片標題',
      },
      {
        key: 'home.news.seasonal_recommendation.icon',
        value: 'sprout',
        type: 'string',
        description: '當季推薦卡片圖示 (sprout/apple/wheat/leaf)',
      },
      {
        key: 'home.news.seasonal_recommendation.description',
        value: '春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中',
        type: 'string',
        description: '當季推薦卡片描述文字',
      },
      {
        key: 'home.news.seasonal_recommendation.link_url',
        value: '/products',
        type: 'string',
        description: '當季推薦卡片連結 URL',
      },
      {
        key: 'home.news.seasonal_recommendation.link_text',
        value: '查看產品 →',
        type: 'string',
        description: '當季推薦卡片連結文字',
      },
      // 農場活動卡片設定
      {
        key: 'home.news.farm_activity.enabled',
        value: 'true',
        type: 'boolean',
        description: '是否啟用農場活動卡片',
      },
      {
        key: 'home.news.farm_activity.title',
        value: '農場活動',
        type: 'string',
        description: '農場活動卡片標題',
      },
      {
        key: 'home.news.farm_activity.icon',
        value: 'party-popper',
        type: 'string',
        description: '農場活動卡片圖示 (party-popper/calendar/users/sparkles)',
      },
      {
        key: 'home.news.farm_activity.description',
        value: '週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣',
        type: 'string',
        description: '農場活動卡片描述文字',
      },
      {
        key: 'home.news.farm_activity.link_url',
        value: '/farm-tour',
        type: 'string',
        description: '農場活動卡片連結 URL',
      },
      {
        key: 'home.news.farm_activity.link_text',
        value: '立即預約 →',
        type: 'string',
        description: '農場活動卡片連結文字',
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

    const keysToCheck = settingsToInsert.map(s => s.key)

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
        console.log(`  值: ${setting.value}, 類型: ${setting.type}`)
      }
    }

    console.log('\n' + '─'.repeat(50))
    console.log('✓ Migration 執行完成！')

    dbLogger.info('首頁最新消息卡片設定 Migration 完成', {
      module: 'Migration',
      action: 'home-news-cards-settings',
    })
  } catch (error) {
    dbLogger.error('Migration 執行失敗', error as Error, {
      module: 'Migration',
      action: 'home-news-cards-settings',
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
