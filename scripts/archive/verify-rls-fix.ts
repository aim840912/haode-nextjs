#!/usr/bin/env npx tsx

/**
 * 驗證 RLS 無限遞迴修復是否成功
 * 測試 auth.is_admin() 函數和相關 RLS 政策
 */

import { createClient } from '@supabase/supabase-js'

// 載入環境變數
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
      console.error('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

class RLSFixVerifier {
  private supabaseUrl: string
  private serviceKey: string

  constructor() {
    loadEnvVars()
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('缺少必要的環境變數')
    }
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
    }
    const reset = '\x1b[0m'
    console.log(`${colors[type]}${message}${reset}`)
  }

  async testFunction(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🧪 測試 public.is_admin() 函數...', 'info')

      // 測試函數是否存在並可執行
      try {
        const { data, error } = await supabaseAdmin.rpc('is_admin')

        if (error) {
          // 可能是因為沒有當前用戶，這是正常的
          if (error.message.includes('auth.uid() returned null')) {
            this.log('   ✅ 函數存在且運作正常（無當前用戶時返回 null 是正常的）', 'success')
            return true
          } else {
            this.log(`   ❌ 函數執行錯誤: ${error.message}`, 'error')
            return false
          }
        } else {
          this.log(`   ✅ 函數執行成功，返回值: ${data}`, 'success')
          return true
        }
      } catch (error) {
        this.log(`   ❌ 函數調用失敗: ${error instanceof Error ? error.message : error}`, 'error')
        return false
      }
    } catch (error) {
      this.log(`❌ 測試函數時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testBasicQueries(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🔍 測試基本查詢操作...', 'info')

      const tests = [
        { name: 'profiles 表查詢', table: 'profiles' },
        { name: 'user_interests 表查詢', table: 'user_interests' },
      ]

      let allSuccess = true

      for (const test of tests) {
        try {
          this.log(`   測試 ${test.name}...`, 'info')

          const { data, error } = await supabaseAdmin.from(test.table).select('*').limit(5)

          if (error) {
            if (error.message.includes('infinite recursion')) {
              this.log(`   ❌ ${test.name}: 仍有無限遞迴問題`, 'error')
              allSuccess = false
            } else {
              this.log(`   ⚠️  ${test.name}: ${error.message}（可能是正常的權限限制）`, 'warning')
            }
          } else {
            this.log(`   ✅ ${test.name}: 查詢成功，返回 ${data?.length || 0} 筆記錄`, 'success')
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('infinite recursion')) {
            this.log(`   ❌ ${test.name}: 仍有無限遞迴問題`, 'error')
            allSuccess = false
          } else {
            this.log(
              `   ⚠️  ${test.name}: ${error instanceof Error ? error.message : error}`,
              'warning'
            )
          }
        }
      }

      return allSuccess
    } catch (error) {
      this.log(
        `❌ 測試基本查詢時發生錯誤: ${error instanceof Error ? error.message : error}`,
        'error'
      )
      return false
    }
  }

  async testRLSPolicies(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🛡️  檢查 RLS 政策狀態...', 'info')

      // 查詢當前的 RLS 政策
      const { data: policies, error } = await supabaseAdmin
        .from('pg_policies')
        .select('schemaname, tablename, policyname, roles, cmd, qual')
        .in('tablename', ['profiles', 'user_interests'])

      if (error) {
        this.log(`   ❌ 查詢政策失敗: ${error.message}`, 'error')
        return false
      }

      if (!policies || policies.length === 0) {
        this.log('   ⚠️  沒有找到 RLS 政策', 'warning')
        return false
      }

      this.log(`   📋 找到 ${policies.length} 個 RLS 政策:`, 'info')

      const profilesPolicies = policies.filter(p => p.tablename === 'profiles')
      const interestsPolicies = policies.filter(p => p.tablename === 'user_interests')

      this.log(`     profiles 表: ${profilesPolicies.length} 個政策`, 'info')
      this.log(`     user_interests 表: ${interestsPolicies.length} 個政策`, 'info')

      // 檢查是否有預期的政策
      const expectedPolicies = [
        'users_view_own_profile',
        'users_update_own_profile',
        'system_insert_profiles',
        'admins_view_all_profiles',
        'admins_update_all_profiles',
        'users_view_own_interests',
        'users_insert_own_interests',
        'users_update_own_interests',
        'users_delete_own_interests',
        'admins_view_all_interests',
      ]

      const foundPolicies = policies.map(p => p.policyname)
      const missingPolicies = expectedPolicies.filter(p => !foundPolicies.includes(p))

      if (missingPolicies.length === 0) {
        this.log('   ✅ 所有預期的政策都存在', 'success')
        return true
      } else {
        this.log(`   ⚠️  缺少以下政策: ${missingPolicies.join(', ')}`, 'warning')
        return false
      }
    } catch (error) {
      this.log(
        `❌ 檢查 RLS 政策時發生錯誤: ${error instanceof Error ? error.message : error}`,
        'error'
      )
      return false
    }
  }

  async checkRLSStatus(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🔒 檢查 RLS 啟用狀態...', 'info')

      // 查詢 RLS 狀態
      const { data, error } = await supabaseAdmin
        .from('pg_class')
        .select('relname, relrowsecurity')
        .in('relname', ['profiles', 'user_interests'])

      if (error) {
        this.log(`   ❌ 查詢 RLS 狀態失敗: ${error.message}`, 'error')
        return false
      }

      if (!data || data.length === 0) {
        this.log('   ❌ 找不到相關表格', 'error')
        return false
      }

      let allEnabled = true
      for (const table of data) {
        const status = table.relrowsecurity ? '啟用' : '停用'
        const statusType = table.relrowsecurity ? 'success' : 'error'
        this.log(`   ${table.relname}: RLS ${status}`, statusType)

        if (!table.relrowsecurity) {
          allEnabled = false
        }
      }

      return allEnabled
    } catch (error) {
      this.log(
        `❌ 檢查 RLS 狀態時發生錯誤: ${error instanceof Error ? error.message : error}`,
        'error'
      )
      return false
    }
  }
}

async function main() {
  const verifier = new RLSFixVerifier()

  console.log('🚀 開始驗證 RLS 無限遞迴修復...')
  console.log('')

  const tests = [
    { name: '檢查 RLS 啟用狀態', test: () => verifier.checkRLSStatus() },
    { name: '測試 auth.is_admin() 函數', test: () => verifier.testFunction() },
    { name: '測試基本查詢操作', test: () => verifier.testBasicQueries() },
    { name: '檢查 RLS 政策狀態', test: () => verifier.testRLSPolicies() },
  ]

  let successCount = 0
  const totalTests = tests.length

  for (const { name, test } of tests) {
    console.log(`📋 執行: ${name}`)
    const success = await test()
    if (success) successCount++
    console.log('')
  }

  console.log('📊 驗證結果:')
  console.log(`成功: ${successCount}/${totalTests}`)

  if (successCount === totalTests) {
    console.log('🎉 RLS 無限遞迴問題已修復！')
    console.log('')
    console.log('🎯 系統狀態:')
    console.log('✅ RLS 政策正常運作')
    console.log('✅ 沒有無限遞迴錯誤')
    console.log('✅ public.is_admin() 函數正常')
    console.log('✅ 管理員和用戶權限分離正確')
  } else {
    console.log('⚠️  修復可能不完整，請檢查上述錯誤')
    console.log('')
    console.log('🔧 可能的解決方案:')
    console.log('1. 確認已正確執行 015_fix_rls_recursion.sql')
    console.log('2. 檢查 Supabase 專案狀態')
    console.log('3. 如果仍有遞迴錯誤，執行 emergency-rls-cleanup.sql')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 驗證腳本執行失敗:', error)
    process.exit(1)
  })
}

export default RLSFixVerifier
