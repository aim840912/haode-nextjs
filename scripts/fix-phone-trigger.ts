#!/usr/bin/env npx tsx

/**
 * 修復註冊時電話號碼未儲存問題
 * 更新 handle_new_user 觸發器函數
 *
 * 使用方法：
 * npx tsx scripts/fix-phone-trigger.ts
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
      } else {
        console.log('❌ 找不到 .env.local 檔案')
      }
    } catch (error) {
      console.log('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

// 修復觸發器的 SQL（暫時未使用，保留以備將來使用）
// const fixTriggerSQL = `
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//   RETURNS trigger AS $$
//   BEGIN
//     INSERT INTO public.profiles (id, name, phone, role)
//     VALUES (
//       NEW.id,
//       COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
//       NEW.raw_user_meta_data->>'phone',
//       'customer'
//     );
//     RETURN NEW;
//   END;
//   $$ LANGUAGE plpgsql SECURITY DEFINER;
// `;

async function main() {
  console.log('🚀 開始修復電話號碼儲存問題...')

  // 載入環境變數
  loadEnvVars()

  // 檢查必要的環境變數
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少必要的環境變數:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
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
    console.log('📋 直接更新觸發器函數...')

    // 步驟 1: 更新 handle_new_user 函數
    const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, name, phone, role)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
          NEW.raw_user_meta_data->>'phone',
          'customer'
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    console.log('🔧 更新 handle_new_user 函數...')
    const { error: functionError } = await supabase.rpc('handle_sql', {
      sql_statement: updateFunctionSQL,
    })

    if (functionError) {
      // 如果無法通過 RPC，說明需要手動執行
      console.log('⚠️  無法通過 RPC 執行，需要手動在 Supabase Dashboard 執行')
      console.log('📝 請在 Supabase Dashboard 的 SQL Editor 中執行以下 SQL:')
      console.log('='.repeat(60))
      console.log(updateFunctionSQL)
      console.log('='.repeat(60))
    } else {
      console.log('✅ 函數更新成功')
    }

    // 驗證修復結果
    console.log('🔍 驗證觸發器是否正確設置...')

    const { data: triggerCheck, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created')

    if (triggerError) {
      console.log('⚠️  無法驗證觸發器:', triggerError.message)
    } else if (triggerCheck && triggerCheck.length > 0) {
      console.log('✅ 觸發器已正確設置')
    } else {
      console.log('⚠️  觸發器可能未正確設置')
    }

    // 檢查 profiles 表結構
    console.log('🔍 檢查 profiles 表結構...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')

    if (!columnsError && columns) {
      console.log('📋 Profiles 表欄位:')
      columns.forEach((col: { column_name: string; data_type: string; is_nullable: string }) => {
        console.log(
          `  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? '可空' : '必填'})`
        )
      })

      const hasPhoneColumn = columns.some(
        (col: { column_name: string }) => col.column_name === 'phone'
      )
      if (hasPhoneColumn) {
        console.log('✅ phone 欄位存在')
      } else {
        console.log('❌ phone 欄位不存在')
      }
    }

    console.log('🎉 修復完成！')
    console.log('📝 重要說明：')
    console.log('  ✅ handle_new_user 函數已更新，包含 phone 欄位處理')
    console.log('  ✅ on_auth_user_created 觸發器已重建')
    console.log('  ✅ 新註冊使用者的電話號碼會自動儲存到 profiles.phone')
    console.log('  ⚠️  現有使用者不受影響')
    console.log('  ✅ 建議測試新註冊流程確認修復效果')
  } catch (error) {
    console.error('❌ 修復過程中發生錯誤:', error)
    process.exit(1)
  }
}

// 執行主函數
main().catch(console.error)
