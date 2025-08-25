#!/usr/bin/env npx tsx

/**
 * 執行 SQL 遷移檔案的腳本
 * 
 * 使用方法：
 * npx tsx scripts/run-migration.ts <migration-file-path>
 * 
 * 例如：
 * npx tsx scripts/run-migration.ts supabase/migrations/014_update_audit_logs_constraint.sql
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

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

class MigrationRunner {
  private supabaseUrl: string
  private serviceKey: string

  constructor() {
    loadEnvVars()
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('缺少必要的環境變數：NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
    }
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      error: '\x1b[31m',   // red
      warning: '\x1b[33m', // yellow
    }
    const reset = '\x1b[0m'
    console.log(`${colors[type]}${message}${reset}`)
  }

  async runMigrationFile(filePath: string): Promise<boolean> {
    try {
      this.log(`📁 讀取遷移檔案: ${filePath}`, 'info')
      
      // 讀取 SQL 檔案
      const fullPath = join(process.cwd(), filePath)
      const sqlContent = readFileSync(fullPath, 'utf8')
      
      this.log(`📋 SQL 內容載入成功 (${sqlContent.length} 個字符)`, 'info')
      
      // 建立 Supabase admin 客戶端
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      this.log(`🔧 執行 SQL 遷移...`, 'info')
      
      // 執行 SQL
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql: sqlContent
      })

      if (error) {
        // 如果 rpc 不存在，嘗試使用原始查詢
        this.log(`⚠️ RPC 方法不可用，嘗試直接執行...`, 'warning')
        
        // 分割 SQL 語句（簡單的分割，可能需要更複雜的解析）
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.startsWith('--'))

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i]
          if (statement) {
            this.log(`   執行語句 ${i + 1}/${statements.length}...`, 'info')
            
            const { error: stmtError } = await supabaseAdmin
              .from('dummy') // 這不會被使用，但需要指定一個 table
              .select('*')
              .limit(0)
              .then(() => supabaseAdmin.rpc('exec', { query: statement }))
              .catch(async () => {
                // 如果都不行，嘗試使用 POST 請求
                const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${this.serviceKey}`,
                    'Content-Type': 'application/json',
                    'apikey': this.serviceKey
                  },
                  body: JSON.stringify({ sql: statement })
                })
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${await response.text()}`)
                }
                
                return { error: null }
              })

            if (stmtError) {
              throw stmtError
            }
          }
        }
        
        this.log(`✅ 遷移檔案執行成功`, 'success')
        return true
      } else {
        this.log(`✅ 遷移檔案執行成功`, 'success')
        if (data) {
          this.log(`📊 執行結果: ${JSON.stringify(data, null, 2)}`, 'info')
        }
        return true
      }

    } catch (error) {
      this.log(`❌ 執行遷移時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('count')
        .limit(1)

      if (error) throw error

      this.log(`✅ 資料庫連線成功`, 'success')
      return true
    } catch (error) {
      this.log(`❌ 資料庫連線失敗: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }
}

async function main() {
  const migrationFile = process.argv[2]
  
  if (!migrationFile) {
    console.error('❌ 請提供遷移檔案路徑')
    console.log('使用方法: npx tsx scripts/run-migration.ts <migration-file-path>')
    process.exit(1)
  }

  const runner = new MigrationRunner()
  
  console.log('🧪 測試資料庫連線...')
  const connected = await runner.testConnection()
  
  if (!connected) {
    process.exit(1)
  }

  console.log(`🚀 執行遷移: ${migrationFile}`)
  const success = await runner.runMigrationFile(migrationFile)
  
  if (success) {
    console.log('🎉 遷移執行完成！')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 腳本執行失敗:', error)
    process.exit(1)
  })
}

export default MigrationRunner