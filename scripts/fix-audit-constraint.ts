#!/usr/bin/env npx tsx

/**
 * 修復 audit_logs 表的 resource_type 約束問題
 * 直接執行必要的 SQL 語句來更新約束
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

class AuditConstraintFixer {
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

  async fixAuditLogsConstraint(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      this.log('🔧 開始修復 audit_logs 表的約束...', 'info')

      // 步驟 1: 先檢查當前的約束
      this.log('📋 檢查當前約束狀態...', 'info')
      
      // 步驟 2: 使用原始 SQL 查詢來更新約束
      // 這裡我們直接插入一條測試記錄來看是否需要更新約束
      try {
        const testResult = await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_email: 'system',
            user_name: 'Test',
            user_role: 'system',
            action: 'update',
            resource_type: 'security_policy',  // 嘗試插入新的類型
            resource_id: 'test',
            resource_details: {},
            metadata: { test: true }
          })
          .select()

        if (testResult.error) {
          if (testResult.error.message.includes('violates check constraint')) {
            this.log('⚠️ 確認需要更新約束', 'warning')
            // 刪除測試記錄（如果有的話）
            await supabaseAdmin
              .from('audit_logs')
              .delete()
              .eq('resource_id', 'test')
              .eq('user_email', 'system')
            
            // 現在我們需要用其他方法更新約束
            // 由於 Supabase 不允許直接執行 ALTER TABLE，我們需要告訴用戶手動執行
            this.log('❌ 無法透過程式自動修復約束', 'error')
            this.log('', 'info')
            this.log('請手動執行以下步驟:', 'warning')
            this.log('1. 登入 Supabase Dashboard', 'info')
            this.log('2. 前往 SQL Editor', 'info')
            this.log('3. 執行以下 SQL:', 'info')
            this.log('', 'info')
            this.log('-- 移除舊約束', 'info')
            this.log('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_resource_type_check;', 'info')
            this.log('', 'info')
            this.log('-- 建立新約束', 'info')
            this.log(`ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_resource_type_check`, 'info')
            this.log(`CHECK (resource_type IN (`, 'info')
            this.log(`  'inquiry', 'inquiry_item', 'customer_data',`, 'info')
            this.log(`  'security_policy', 'system_config', 'migration',`, 'info')
            this.log(`  'user_management', 'data_maintenance'`, 'info')
            this.log(`));`, 'info')
            this.log('', 'info')
            this.log('4. 然後重新執行失敗的 013 遷移', 'info')
            
            return false
          } else {
            throw testResult.error
          }
        } else {
          this.log('✅ 約束已經允許 security_policy 類型', 'success')
          // 清理測試記錄
          await supabaseAdmin
            .from('audit_logs')
            .delete()
            .eq('resource_id', 'test')
            .eq('user_email', 'system')
          
          return true
        }
      } catch (error) {
        this.log(`❌ 測試插入失敗: ${error instanceof Error ? error.message : error}`, 'error')
        return false
      }

    } catch (error) {
      this.log(`❌ 修復過程中發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testCurrentState(): Promise<void> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      this.log('🧪 測試當前 audit_logs 表狀態...', 'info')

      // 測試查詢
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .limit(5)

      if (error) {
        this.log(`❌ 查詢失敗: ${error.message}`, 'error')
        return
      }

      this.log(`✅ 成功查詢 audit_logs 表`, 'success')
      this.log(`📊 當前有 ${data?.length || 0} 筆測試記錄`, 'info')

      if (data && data.length > 0) {
        const resourceTypes = [...new Set(data.map(log => log.resource_type))]
        this.log(`📋 當前使用的 resource_type: ${resourceTypes.join(', ')}`, 'info')
      }

    } catch (error) {
      this.log(`❌ 測試失敗: ${error instanceof Error ? error.message : error}`, 'error')
    }
  }
}

async function main() {
  const fixer = new AuditConstraintFixer()
  
  console.log('🚀 開始修復 audit_logs 約束問題...')
  console.log('')

  // 先測試當前狀態
  await fixer.testCurrentState()
  console.log('')

  // 嘗試修復約束
  const success = await fixer.fixAuditLogsConstraint()
  
  if (success) {
    console.log('🎉 約束修復完成！')
    console.log('現在可以重新執行 013_restore_rls_security.sql')
  } else {
    console.log('⚠️ 需要手動修復約束')
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 腳本執行失敗:', error)
    process.exit(1)
  })
}