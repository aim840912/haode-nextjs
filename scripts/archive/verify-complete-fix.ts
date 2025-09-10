#!/usr/bin/env npx tsx

/**
 * 驗證完整 RLS 修復是否成功
 * 專門用於驗證 complete-rls-fix.sql 或 minimal-rls-fix.sql 的修復結果
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

class CompleteFixVerifier {
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

  async checkNoRecursionErrors(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🧪 測試查詢是否還有遞迴錯誤...', 'info')

      const tests = [
        { name: 'profiles 表查詢', table: 'profiles' },
        { name: 'user_interests 表查詢', table: 'user_interests' },
      ]

      let allSuccess = true

      for (const test of tests) {
        try {
          this.log(`   測試 ${test.name}...`, 'info')

          const { data, error } = await supabaseAdmin.from(test.table).select('*').limit(3)

          if (error) {
            if (error.message.includes('infinite recursion')) {
              this.log(`   ❌ ${test.name}: 仍有無限遞迴問題！`, 'error')
              this.log(`      錯誤: ${error.message}`, 'error')
              allSuccess = false
            } else {
              this.log(`   ⚠️  ${test.name}: ${error.message}（可能是正常的權限限制）`, 'warning')
            }
          } else {
            this.log(`   ✅ ${test.name}: 查詢成功，無遞迴錯誤`, 'success')
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('infinite recursion')) {
            this.log(`   ❌ ${test.name}: 仍有無限遞迴問題！`, 'error')
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
      this.log(`❌ 測試查詢時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async checkRLSStatus(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🔒 檢查 RLS 啟用狀態...', 'info')

      // 使用原始查詢檢查 RLS 狀態
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
        const status = table.relrowsecurity ? '✅ 已啟用' : '❌ 未啟用'
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

  async checkPolicies(): Promise<{ hasBasic: boolean; hasAdmin: boolean }> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('📋 檢查 RLS 政策...', 'info')

      const { data: policies, error } = await supabaseAdmin
        .from('pg_policies')
        .select('schemaname, tablename, policyname, cmd')
        .in('tablename', ['profiles', 'user_interests'])
        .eq('schemaname', 'public')

      if (error) {
        this.log(`   ❌ 查詢政策失敗: ${error.message}`, 'error')
        return { hasBasic: false, hasAdmin: false }
      }

      if (!policies || policies.length === 0) {
        this.log('   ❌ 沒有找到任何 RLS 政策', 'error')
        return { hasBasic: false, hasAdmin: false }
      }

      this.log(`   📊 找到 ${policies.length} 個政策:`, 'info')

      const profilesPolicies = policies.filter(p => p.tablename === 'profiles')
      const interestsPolicies = policies.filter(p => p.tablename === 'user_interests')

      this.log(`     profiles: ${profilesPolicies.length} 個政策`, 'info')
      this.log(`     user_interests: ${interestsPolicies.length} 個政策`, 'info')

      // 檢查基本政策（用戶自我管理）
      const hasBasicProfiles = profilesPolicies.some(
        p => p.policyname.includes('own') || p.policyname.includes('user')
      )
      const hasBasicInterests = interestsPolicies.some(
        p => p.policyname.includes('own') || p.policyname.includes('user')
      )

      // 檢查管理員政策
      const hasAdminProfiles = profilesPolicies.some(p => p.policyname.includes('admin'))
      const hasAdminInterests = interestsPolicies.some(p => p.policyname.includes('admin'))

      const hasBasic = hasBasicProfiles && hasBasicInterests
      const hasAdmin = hasAdminProfiles || hasAdminInterests

      this.log(
        `   基本用戶政策: ${hasBasic ? '✅ 存在' : '❌ 缺失'}`,
        hasBasic ? 'success' : 'error'
      )
      this.log(
        `   管理員政策: ${hasAdmin ? '✅ 存在' : '⚠️  不存在（最小化修復正常）'}`,
        hasAdmin ? 'success' : 'warning'
      )

      return { hasBasic, hasAdmin }
    } catch (error) {
      this.log(`❌ 檢查政策時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return { hasBasic: false, hasAdmin: false }
    }
  }

  async checkAdminFunction(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🔧 檢查 public.is_admin() 函數...', 'info')

      try {
        const { data, error } = await supabaseAdmin.rpc('is_admin')

        if (error) {
          if (error.message.includes('function public.is_admin() does not exist')) {
            this.log('   ⚠️  public.is_admin() 函數不存在（最小化修復正常）', 'warning')
            return false
          } else if (error.message.includes('auth.uid() returned null')) {
            this.log('   ✅ public.is_admin() 函數存在且正常', 'success')
            return true
          } else {
            this.log(`   ❌ 函數執行錯誤: ${error.message}`, 'error')
            return false
          }
        } else {
          this.log('   ✅ public.is_admin() 函數存在且可執行', 'success')
          return true
        }
      } catch (error) {
        this.log(`   ❌ 函數調用失敗: ${error instanceof Error ? error.message : error}`, 'error')
        return false
      }
    } catch (error) {
      this.log(`❌ 檢查函數時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }
}

async function main() {
  const verifier = new CompleteFixVerifier()

  console.log('🚀 開始驗證 RLS 完整修復結果...')
  console.log('')

  const tests = [
    { name: '檢查是否還有遞迴錯誤', test: () => verifier.checkNoRecursionErrors(), critical: true },
    { name: '檢查 RLS 啟用狀態', test: () => verifier.checkRLSStatus(), critical: true },
    { name: '檢查 RLS 政策', test: () => verifier.checkPolicies(), critical: false },
    { name: '檢查管理員函數', test: () => verifier.checkAdminFunction(), critical: false },
  ]

  let criticalSuccess = 0
  let totalCritical = 0
  const allResults: any[] = []

  for (const { name, test, critical } of tests) {
    console.log(`📋 執行: ${name}`)
    const result = await test()
    allResults.push({ name, result, critical })

    if (critical) {
      totalCritical++
      if (result === true || (typeof result === 'object' && result.hasBasic)) {
        criticalSuccess++
      }
    }
    console.log('')
  }

  console.log('📊 驗證結果:')
  console.log('='.repeat(50))

  const { hasBasic, hasAdmin } = allResults.find(r => r.name.includes('政策'))?.result || {
    hasBasic: false,
    hasAdmin: false,
  }
  const noRecursion = allResults.find(r => r.name.includes('遞迴'))?.result
  const rlsEnabled = allResults.find(r => r.name.includes('啟用'))?.result
  const hasFunction = allResults.find(r => r.name.includes('函數'))?.result

  if (noRecursion && rlsEnabled && hasBasic) {
    console.log('🎉 RLS 修復成功！')
    console.log('')
    console.log('✅ 關鍵檢查全部通過:')
    console.log('  • 沒有無限遞迴錯誤')
    console.log('  • RLS 已正確啟用')
    console.log('  • 基本用戶政策正常')
    console.log('')

    if (hasAdmin && hasFunction) {
      console.log('🔧 完整功能:')
      console.log('  • 管理員功能正常')
      console.log('  • public.is_admin() 函數正常')
      console.log('  → 使用了完整修復方案')
    } else {
      console.log('🚀 基本功能:')
      console.log('  • 用戶可以管理自己的數據')
      console.log('  • 沒有管理員功能')
      console.log('  → 使用了最小化修復方案')
    }
  } else {
    console.log('⚠️  修復可能不完整')
    console.log('')
    console.log('問題檢查:')
    if (!noRecursion) console.log('❌ 仍有無限遞迴錯誤')
    if (!rlsEnabled) console.log('❌ RLS 未正確啟用')
    if (!hasBasic) console.log('❌ 基本政策缺失')

    console.log('')
    console.log('🔧 建議:')
    console.log('1. 重新執行修復腳本')
    console.log('2. 檢查是否有遺留的問題政策')
    console.log('3. 確認 Supabase 專案狀態正常')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 驗證腳本執行失敗:', error)
    process.exit(1)
  })
}

export default CompleteFixVerifier
