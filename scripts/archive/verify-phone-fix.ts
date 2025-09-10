#!/usr/bin/env npx tsx

/**
 * 驗證電話號碼修復結果
 * 檢查新註冊使用者的電話號碼是否正確儲存
 *
 * 使用方法：
 * npx tsx scripts/verify-phone-fix.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
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
        console.log('✅ .env.local 檔案載入成功')
      }
    } catch (error) {
      console.log('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

async function main() {
  console.log('🔍 開始驗證電話號碼修復結果...')

  // 載入環境變數
  loadEnvVars()

  // 檢查必要的環境變數
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少必要的環境變數')
    process.exit(1)
  }

  // 建立 Supabase 管理員客戶端
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // 查詢最近註冊的使用者（按建立時間排序）
    console.log('📋 查詢最近註冊的使用者...')

    const { data: recentProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, phone, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (profilesError) {
      console.error('❌ 查詢 profiles 失敗:', profilesError.message)
      process.exit(1)
    }

    if (!recentProfiles || recentProfiles.length === 0) {
      console.log('⚠️  沒有找到任何使用者資料')
      return
    }

    console.log(`📊 找到 ${recentProfiles.length} 個最近的使用者:`)
    console.log('='.repeat(80))

    recentProfiles.forEach((profile, index) => {
      const phoneDisplay = profile.phone
        ? `${profile.phone.substring(0, 3)}****${profile.phone.substring(7)}`
        : '未設定'

      console.log(`${index + 1}. ${profile.name}`)
      console.log(`   ID: ${profile.id}`)
      console.log(`   電話: ${phoneDisplay}`)
      console.log(`   角色: ${profile.role}`)
      console.log(`   建立時間: ${new Date(profile.created_at).toLocaleString('zh-TW')}`)
      console.log(`   電話狀態: ${profile.phone ? '✅ 已儲存' : '❌ 未儲存'}`)
      console.log('   ' + '-'.repeat(60))
    })

    // 特別檢查是否有名為「測試用戶」的使用者
    const testUser = recentProfiles.find(p => p.name === '測試用戶')

    if (testUser) {
      console.log('🎯 找到測試使用者:')
      console.log(`   姓名: ${testUser.name}`)
      console.log(`   電話: ${testUser.phone ? '✅ ' + testUser.phone : '❌ 未儲存'}`)
      console.log(`   建立時間: ${new Date(testUser.created_at).toLocaleString('zh-TW')}`)

      if (testUser.phone) {
        console.log('🎉 修復成功！電話號碼已正確儲存到 profiles 表')
      } else {
        console.log('❌ 修復失敗！電話號碼未儲存')
      }
    } else {
      console.log('⚠️  未找到「測試用戶」，可能註冊失敗或使用了不同的名稱')
    }

    // 統計有電話號碼的使用者比例
    const usersWithPhone = recentProfiles.filter(p => p.phone && p.phone.trim() !== '')
    const phoneRate = Math.round((usersWithPhone.length / recentProfiles.length) * 100)

    console.log('📈 電話號碼儲存統計:')
    console.log(`   有電話號碼: ${usersWithPhone.length} 人`)
    console.log(`   總使用者數: ${recentProfiles.length} 人`)
    console.log(`   儲存率: ${phoneRate}%`)

    if (phoneRate >= 80) {
      console.log('✅ 電話號碼儲存率良好')
    } else if (phoneRate >= 50) {
      console.log('⚠️  電話號碼儲存率偏低，可能需要進一步檢查')
    } else {
      console.log('❌ 電話號碼儲存率過低，修復可能未完全生效')
    }

    console.log('🏁 驗證完成！')
  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error)
    process.exit(1)
  }
}

// 執行主函數
main().catch(console.error)
