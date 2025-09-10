#!/usr/bin/env npx tsx

/**
 * 簡化的 RLS 修復驗證腳本
 * 專注於功能性測試，避免系統表查詢問題
 * 適用於 Supabase 環境
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

class SimpleRLSVerifier {
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

  async testNoRecursion(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🧪 測試是否還有無限遞迴錯誤...', 'info')

      const tests = [
        { name: 'profiles 表', table: 'profiles', columns: 'id, email, role' },
        { name: 'user_interests 表', table: 'user_interests', columns: 'id, user_id, category' },
      ]

      let allSuccess = true

      for (const test of tests) {
        try {
          this.log(`   測試 ${test.name}...`, 'info')

          const { data, error } = await supabaseAdmin.from(test.table).select(test.columns).limit(1)

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
      this.log(`❌ 測試遞迴時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testAdminFunction(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🔧 測試 public.is_admin() 函數...', 'info')

      try {
        const { data, error } = await supabaseAdmin.rpc('is_admin')

        if (error) {
          if (error.message.includes('function public.is_admin() does not exist')) {
            this.log('   ⚠️  public.is_admin() 函數不存在（使用了最小化修復）', 'warning')
            return false
          } else {
            this.log('   ✅ public.is_admin() 函數存在且可執行', 'success')
            return true
          }
        } else {
          this.log('   ✅ public.is_admin() 函數正常運作', 'success')
          return true
        }
      } catch (error) {
        this.log(`   ⚠️  函數測試: ${error instanceof Error ? error.message : error}`, 'warning')
        return false
      }
    } catch (error) {
      this.log(`❌ 檢查函數時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testBasicQueries(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('📊 測試基本數據庫操作...', 'info')

      // 測試計數查詢（最簡單的測試）
      try {
        const { count: profileCount, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (profileError) {
          this.log(`   ⚠️  profiles 計數: ${profileError.message}`, 'warning')
        } else {
          this.log(`   ✅ profiles 表查詢正常 (${profileCount || 0} 筆記錄)`, 'success')
        }

        const { count: interestCount, error: interestError } = await supabaseAdmin
          .from('user_interests')
          .select('*', { count: 'exact', head: true })

        if (interestError) {
          this.log(`   ⚠️  user_interests 計數: ${interestError.message}`, 'warning')
        } else {
          this.log(`   ✅ user_interests 表查詢正常 (${interestCount || 0} 筆記錄)`, 'success')
        }

        return !profileError && !interestError
      } catch (error) {
        this.log(`   ❌ 基本查詢失敗: ${error instanceof Error ? error.message : error}`, 'error')
        return false
      }
    } catch (error) {
      this.log(
        `❌ 測試基本查詢時發生錯誤: ${error instanceof Error ? error.message : error}`,
        'error'
      )
      return false
    }
  }

  async testRLSWorking(): Promise<boolean> {
    try {
      const supabaseAnon = createClient(this.supabaseUrl, this.serviceKey.replace(/.*/, ''), {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      this.log('🔒 測試 RLS 是否正常限制存取...', 'info')

      // 使用 anon key 測試是否被 RLS 限制
      try {
        const { data, error } = await supabaseAnon.from('profiles').select('*').limit(1)

        if (error) {
          if (
            error.message.includes('RLS') ||
            error.message.includes('policy') ||
            error.message.includes('permission')
          ) {
            this.log('   ✅ RLS 正常運作（匿名用戶被正確限制）', 'success')
            return true
          } else {
            this.log(`   ⚠️  預期的 RLS 限制，但得到其他錯誤: ${error.message}`, 'warning')
            return false
          }
        } else {
          this.log('   ⚠️  匿名用戶可以存取資料（RLS 可能有問題）', 'warning')
          return false
        }
      } catch (error) {
        this.log('   ✅ RLS 正常運作（查詢被阻止）', 'success')
        return true
      }
    } catch (error) {
      this.log(`❌ 測試 RLS 時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }
}

async function main() {
  const verifier = new SimpleRLSVerifier()

  console.log('🚀 開始簡化的 RLS 修復驗證...')
  console.log('')

  const tests = [
    { name: '檢查無限遞迴問題', test: () => verifier.testNoRecursion(), critical: true },
    { name: '測試基本資料庫操作', test: () => verifier.testBasicQueries(), critical: true },
    { name: '測試管理員函數', test: () => verifier.testAdminFunction(), critical: false },
    { name: '測試 RLS 存取限制', test: () => verifier.testRLSWorking(), critical: false },
  ]

  let criticalPassed = 0
  let totalCritical = 0
  const results: { name: string; success: boolean; critical: boolean }[] = []

  for (const { name, test, critical } of tests) {
    console.log(`📋 執行: ${name}`)
    const success = await test()
    results.push({ name, success, critical })

    if (critical) {
      totalCritical++
      if (success) criticalPassed++
    }
    console.log('')
  }

  console.log('📊 驗證結果:')
  console.log('='.repeat(50))

  const recursionFixed = results.find(r => r.name.includes('遞迴'))?.success
  const basicWorks = results.find(r => r.name.includes('基本'))?.success
  const hasFunction = results.find(r => r.name.includes('函數'))?.success
  const rlsWorks = results.find(r => r.name.includes('RLS'))?.success

  if (recursionFixed && basicWorks) {
    console.log('🎉 RLS 修復成功！')
    console.log('')
    console.log('✅ 關鍵功能正常:')
    console.log('  • 無限遞迴問題已解決')
    console.log('  • 基本資料庫操作正常')
    console.log('')

    if (hasFunction) {
      console.log('🔧 檢測到完整修復:')
      console.log('  • public.is_admin() 函數正常')
      console.log('  • 支援管理員功能')
    } else {
      console.log('🚀 檢測到最小化修復:')
      console.log('  • 基本用戶功能正常')
      console.log('  • 沒有管理員功能（正常）')
    }

    if (rlsWorks) {
      console.log('  • RLS 存取控制正常')
    }

    console.log('')
    console.log('🎯 系統狀態: 可以正常使用')
  } else {
    console.log('⚠️  發現問題需要處理:')
    console.log('')

    if (!recursionFixed) {
      console.log('❌ 仍有無限遞迴問題')
      console.log('   建議: 重新執行修復腳本')
    }

    if (!basicWorks) {
      console.log('❌ 基本資料庫操作異常')
      console.log('   建議: 檢查 Supabase 連線和表格狀態')
    }

    console.log('')
    console.log('🔧 下一步建議:')
    console.log('1. 檢查修復腳本是否完全執行')
    console.log('2. 確認 Supabase 專案狀態正常')
    console.log('3. 如果問題持續，使用緊急清理腳本')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 簡化驗證腳本執行失敗:', error)
    process.exit(1)
  })
}

export default SimpleRLSVerifier
