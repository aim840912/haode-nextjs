#!/usr/bin/env npx tsx

/**
 * 驗證 audit_logs 約束修復是否成功
 * 測試 security_policy 類型是否可以正常插入
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

class AuditFixVerifier {
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

  async verifyConstraintFix(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      this.log('🧪 驗證約束修復...', 'info')

      // 測試插入各種新的 resource_type
      const testTypes = [
        'security_policy',
        'system_config',
        'migration',
        'user_management',
        'data_maintenance'
      ]

      const testResults = []

      for (const resourceType of testTypes) {
        try {
          this.log(`   測試 ${resourceType}...`, 'info')

          const result = await supabaseAdmin
            .from('audit_logs')
            .insert({
              user_email: 'system',
              user_name: 'Verification Test',
              user_role: 'system',
              action: 'update',
              resource_type: resourceType,
              resource_id: `verify_${resourceType}_${Date.now()}`,
              resource_details: { test: true },
              metadata: { 
                verification: true,
                timestamp: new Date().toISOString()
              }
            })
            .select()

          if (result.error) {
            testResults.push({ type: resourceType, success: false, error: result.error.message })
            this.log(`   ❌ ${resourceType}: ${result.error.message}`, 'error')
          } else {
            testResults.push({ type: resourceType, success: true })
            this.log(`   ✅ ${resourceType}: 成功`, 'success')
          }

        } catch (error) {
          testResults.push({ 
            type: resourceType, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          this.log(`   ❌ ${resourceType}: ${error instanceof Error ? error.message : error}`, 'error')
        }
      }

      // 清理測試記錄
      this.log('🧹 清理測試記錄...', 'info')
      await supabaseAdmin
        .from('audit_logs')
        .delete()
        .eq('user_name', 'Verification Test')

      // 分析結果
      const successCount = testResults.filter(r => r.success).length
      const totalCount = testResults.length

      this.log('', 'info')
      this.log('📊 驗證結果:', 'info')
      this.log(`   成功: ${successCount}/${totalCount}`, successCount === totalCount ? 'success' : 'warning')

      if (successCount === totalCount) {
        this.log('🎉 約束修復成功！所有新的 resource_type 都可以正常使用', 'success')
        this.log('', 'info')
        this.log('現在您可以重新執行 013_restore_rls_security.sql 遷移', 'info')
        return true
      } else {
        this.log('⚠️ 部分類型仍然無法使用，約束可能尚未完全修復', 'warning')
        return false
      }

    } catch (error) {
      this.log(`❌ 驗證過程中發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testOriginalTypes(): Promise<void> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      this.log('🔍 測試原有 resource_type 是否仍正常...', 'info')

      const originalTypes = ['inquiry', 'inquiry_item', 'customer_data']

      for (const resourceType of originalTypes) {
        try {
          const result = await supabaseAdmin
            .from('audit_logs')
            .insert({
              user_email: 'system',
              user_name: 'Original Type Test',
              user_role: 'system',
              action: 'view',
              resource_type: resourceType,
              resource_id: `test_${resourceType}_${Date.now()}`,
              resource_details: { test: true },
              metadata: { compatibility_test: true }
            })
            .select()

          if (result.error) {
            this.log(`   ❌ ${resourceType}: ${result.error.message}`, 'error')
          } else {
            this.log(`   ✅ ${resourceType}: 正常`, 'success')
          }

        } catch (error) {
          this.log(`   ❌ ${resourceType}: ${error instanceof Error ? error.message : error}`, 'error')
        }
      }

      // 清理測試記錄
      await supabaseAdmin
        .from('audit_logs')
        .delete()
        .eq('user_name', 'Original Type Test')

    } catch (error) {
      this.log(`❌ 測試原有類型時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
    }
  }
}

async function main() {
  const verifier = new AuditFixVerifier()
  
  console.log('🚀 開始驗證 audit_logs 約束修復...')
  console.log('')

  // 測試原有類型
  await verifier.testOriginalTypes()
  console.log('')

  // 驗證新約束
  const success = await verifier.verifyConstraintFix()
  
  if (success) {
    console.log('')
    console.log('🎯 下一步：')
    console.log('1. 在 Supabase SQL Editor 中重新執行 013_restore_rls_security.sql')
    console.log('2. 或者手動執行該文件中的 RLS 設定部分')
    console.log('3. 驗證 RLS 政策是否正確啟用')
  } else {
    console.log('')
    console.log('⚠️ 請確認是否已在 Supabase Dashboard 中執行約束更新 SQL')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 驗證腳本執行失敗:', error)
    process.exit(1)
  })
}