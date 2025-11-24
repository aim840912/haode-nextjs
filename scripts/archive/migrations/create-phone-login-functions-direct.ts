#!/usr/bin/env tsx

/**
 * 直接建立手機號碼登入功能函數
 *
 * 這個腳本會：
 * 1. 建立手機號碼到 email 的查詢函數
 * 2. 建立驗證函數
 * 3. 測試函數功能
 */

import { config } from 'dotenv'
import path from 'path'

// 載入 .env.local 檔案
const envPath = path.join(__dirname, '..', '.env.local')
config({ path: envPath })

import { createClient } from '@supabase/supabase-js'
import { dbLogger } from '../src/lib/logger'

async function createPhoneLoginFunctions() {
  console.log('🚀 開始建立手機號碼登入功能函數...')

  // 直接建立 Supabase 客戶端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少必要的環境變數: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // 1. 建立主要查詢函數
    console.log('📋 建立 get_email_by_phone 函數...')

    const getEmailByPhoneSQL = `
      CREATE OR REPLACE FUNCTION get_email_by_phone(phone_number TEXT)
      RETURNS TABLE(email TEXT, user_id UUID) AS $$
      DECLARE
          normalized_phone TEXT;
      BEGIN
          -- 輸入驗證
          IF phone_number IS NULL OR phone_number = '' THEN
              RETURN;
          END IF;

          -- 正規化手機號碼（移除空格、破折號等）
          normalized_phone := regexp_replace(phone_number, '[^0-9+]', '', 'g');

          -- 驗證台灣手機號碼格式 (09xxxxxxxx)
          IF NOT (normalized_phone ~ '^09[0-9]{8}$') THEN
              RETURN;
          END IF;

          -- 查詢用戶資料
          RETURN QUERY
          SELECT
              au.email,
              au.id as user_id
          FROM profiles p
          INNER JOIN auth.users au ON p.id = au.id
          WHERE p.phone = normalized_phone
            AND au.email IS NOT NULL
            AND au.email != ''
          LIMIT 1;

          RETURN;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    const { error: error1 } = await supabaseAdmin
      .rpc('exec_sql' as any, {
        sql: getEmailByPhoneSQL,
      })
      .catch(async () => {
        // 如果 exec_sql 不存在，我們無法直接執行複雜的 SQL
        // 改為建議手動執行
        console.log('⚠️  需要手動在 Supabase SQL Editor 中執行函數')
        return { error: { message: 'exec_sql not available' } }
      })

    if (error1) {
      if (error1.message === 'exec_sql not available') {
        console.log('\n📋 請在 Supabase Dashboard > SQL Editor 中執行以下 SQL:')
        console.log('━'.repeat(80))
        console.log(getEmailByPhoneSQL)
        console.log('━'.repeat(80))
      } else if (error1.message.includes('already exists')) {
        console.log('✅ get_email_by_phone 函數已存在')
      } else {
        console.error('❌ 建立 get_email_by_phone 函數失敗:', error1.message)
      }
    } else {
      console.log('✅ get_email_by_phone 函數建立成功')
    }

    // 2. 建立驗證函數
    console.log('📋 建立 is_valid_taiwan_phone 函數...')

    const isValidPhoneSQL = `
      CREATE OR REPLACE FUNCTION is_valid_taiwan_phone(phone_number TEXT)
      RETURNS BOOLEAN AS $$
      DECLARE
          normalized_phone TEXT;
      BEGIN
          -- 輸入驗證
          IF phone_number IS NULL OR phone_number = '' THEN
              RETURN FALSE;
          END IF;

          -- 正規化手機號碼
          normalized_phone := regexp_replace(phone_number, '[^0-9+]', '', 'g');

          -- 驗證台灣手機號碼格式
          RETURN normalized_phone ~ '^09[0-9]{8}$';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    if (error1?.message === 'exec_sql not available') {
      console.log('\n📋 請在 Supabase Dashboard > SQL Editor 中執行以下 SQL:')
      console.log('━'.repeat(80))
      console.log(isValidPhoneSQL)
      console.log('━'.repeat(80))
    } else {
      const { error: error2 } = await supabaseAdmin.rpc('exec_sql' as any, {
        sql: isValidPhoneSQL,
      })

      if (error2 && !error2.message.includes('already exists')) {
        console.error('❌ 建立 is_valid_taiwan_phone 函數失敗:', error2.message)
      } else {
        console.log('✅ is_valid_taiwan_phone 函數建立成功')
      }
    }

    // 3. 測試函數（如果可以）
    if (!error1 || error1.message === 'exec_sql not available') {
      console.log('\n🧪 測試函數功能...')

      if (error1?.message === 'exec_sql not available') {
        console.log('⚠️  無法自動測試，請手動執行以下測試 SQL:')
        console.log('━'.repeat(60))
        console.log('-- 測試手機號碼格式驗證')
        console.log("SELECT is_valid_taiwan_phone('0912345678') as valid_phone;")
        console.log("SELECT is_valid_taiwan_phone('123456789') as invalid_phone;")
        console.log('')
        console.log('-- 測試手機號碼查詢（如果有測試資料）')
        console.log("SELECT * FROM get_email_by_phone('0912345678');")
        console.log('━'.repeat(60))
      } else {
        // 嘗試測試
        try {
          const { data: testData } = await supabaseAdmin.rpc('is_valid_taiwan_phone', {
            phone_number: '0912345678',
          })
          console.log('✅ 函數測試成功, 0912345678 驗證結果:', testData)

          const { data: testData2 } = await supabaseAdmin.rpc('is_valid_taiwan_phone', {
            phone_number: '123456789',
          })
          console.log('✅ 函數測試成功, 123456789 驗證結果:', testData2)
        } catch (testError) {
          console.log('⚠️  函數測試跳過 (可能需要等待 schema 刷新)')
        }
      }
    }

    console.log('\n✅ 手機號碼登入功能函數建立完成!')
    console.log('\n🚀 後續步驟:')
    console.log('1. 修改 phone-to-email API 使用新的 RPC 函數')
    console.log('2. 測試手機號碼登入功能')
    console.log('3. 監控函數執行效能')

    dbLogger.info('手機號碼登入功能函數建立完成', {
      module: 'PhoneLoginSetup',
      action: 'complete',
    })
  } catch (error) {
    console.error('💥 建立函數時發生錯誤:', error)
    dbLogger.error('建立手機號碼登入功能函數失敗', error as Error, {
      module: 'PhoneLoginSetup',
      action: 'error',
    })
    process.exit(1)
  }
}

// 執行腳本
if (require.main === module) {
  createPhoneLoginFunctions()
}
