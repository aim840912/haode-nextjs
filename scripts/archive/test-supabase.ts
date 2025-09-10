#!/usr/bin/env npx tsx

/**
 * Supabase 連線測試腳本
 *
 * 使用方法：
 * npm run test:supabase
 *
 * 注意：請確保 .env.local 檔案已正確設定環境變數
 */

import { createClient } from '@supabase/supabase-js'

// 檢查並載入環境變數
function loadEnvVars() {
  // 檢查是否在 Next.js 環境中（會自動載入 .env.local）
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('⚠️ 偵測到環境變數未載入，嘗試手動載入 .env.local...')

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

        console.log('✅ .env.local 檔案載入成功')
      } else {
        console.log('❌ 找不到 .env.local 檔案')
      }
    } catch (error) {
      console.log('❌ 載入 .env.local 時發生錯誤:', error)
    }
  }
}

// 載入環境變數
loadEnvVars()

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  duration?: number
  details?: any
}

class SupabaseTestRunner {
  private results: TestResult[] = []
  private supabaseUrl: string
  private anonKey: string
  private serviceKey: string

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m', // cyan
      success: '\x1b[32m', // green
      error: '\x1b[31m', // red
      warning: '\x1b[33m', // yellow
    }
    const reset = '\x1b[0m'
    console.log(`${colors[type]}${message}${reset}`)
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now()
    try {
      await testFn()
      const duration = Date.now() - start
      this.results.push({
        name,
        status: 'success',
        message: `測試通過`,
        duration,
      })
      this.log(`✅ ${name} (${duration}ms)`, 'success')
    } catch (error) {
      const duration = Date.now() - start
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.results.push({
        name,
        status: 'error',
        message,
        duration,
      })
      this.log(`❌ ${name}: ${message}`, 'error')
    }
  }

  async testEnvironmentVariables() {
    await this.runTest('環境變數檢查', async () => {
      if (!this.supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL 未設定')
      if (!this.anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定')
      if (!this.serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY 未設定')

      if (!this.supabaseUrl.includes('supabase.co')) {
        throw new Error('Supabase URL 格式不正確')
      }

      this.log(`   📍 URL: ${this.supabaseUrl}`, 'info')
      this.log(`   🔑 Anon Key: ${this.anonKey.substring(0, 20)}...`, 'info')
      this.log(`   🔐 Service Key: ${this.serviceKey.substring(0, 20)}...`, 'info')
    })
  }

  async testAnonConnection() {
    await this.runTest('Anon Key 連線測試', async () => {
      const supabase = createClient(this.supabaseUrl, this.anonKey)

      const { data, error } = await supabase.from('products').select('count').limit(1)

      if (error) throw error
      this.log(`   📊 可以使用 anon key 讀取資料`, 'info')
    })
  }

  async testServiceRoleConnection() {
    await this.runTest('Service Role 連線測試', async () => {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const { data, error } = await supabaseAdmin.from('products').select('count').limit(1)

      if (error) throw error
      this.log(`   🛡️ Service role 可以繞過 RLS`, 'info')
    })
  }

  async testDatabaseTables() {
    await this.runTest('資料庫表格檢查', async () => {
      const supabaseAdmin = createClient(this.supabaseUrl, this.serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const tables = ['products', 'users', 'orders', 'profiles']
      const existingTables = []

      for (const table of tables) {
        try {
          const { error } = await supabaseAdmin.from(table).select('count').limit(1)

          if (!error) {
            existingTables.push(table)
          }
        } catch (err) {
          // Table doesn't exist, continue
        }
      }

      if (existingTables.length === 0) {
        throw new Error('沒有找到任何資料表')
      }

      this.log(`   📋 找到表格: ${existingTables.join(', ')}`, 'info')
    })
  }

  async testAuth() {
    await this.runTest('Auth 服務測試', async () => {
      const supabase = createClient(this.supabaseUrl, this.anonKey)

      const { data, error } = await supabase.auth.getSession()

      if (error) throw error

      this.log(`   🔐 Auth 服務正常運作`, 'info')
      if (data.session) {
        this.log(`   👤 當前有使用者登入`, 'info')
      } else {
        this.log(`   👤 目前未登入（正常）`, 'info')
      }
    })
  }

  async testRealtimeConnection() {
    await this.runTest('Realtime 連線測試', async () => {
      const supabase = createClient(this.supabaseUrl, this.anonKey)

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Realtime 連線超時'))
        }, 5000)

        const channel = supabase
          .channel('test-channel')
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout)
            channel.unsubscribe()
            this.log(`   🔄 Realtime 連線正常`, 'info')
            resolve(void 0)
          })
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout)
              channel.unsubscribe()
              this.log(`   🔄 Realtime 訂閱成功`, 'info')
              resolve(void 0)
            } else if (status === 'CLOSED') {
              clearTimeout(timeout)
              reject(new Error('Realtime 連線被關閉'))
            }
          })
      })
    })
  }

  async runAllTests() {
    this.log('🧪 開始 Supabase 連線測試...', 'info')
    this.log('', 'info')

    await this.testEnvironmentVariables()
    await this.testAnonConnection()
    await this.testServiceRoleConnection()
    await this.testDatabaseTables()
    await this.testAuth()
    await this.testRealtimeConnection()

    this.printSummary()
  }

  printSummary() {
    this.log('', 'info')
    this.log('📊 測試摘要', 'info')
    this.log('='.repeat(50), 'info')

    const totalTests = this.results.length
    const successTests = this.results.filter(r => r.status === 'success').length
    const errorTests = this.results.filter(r => r.status === 'error').length
    const warningTests = this.results.filter(r => r.status === 'warning').length

    this.log(`總測試數: ${totalTests}`, 'info')
    this.log(`成功: ${successTests}`, 'success')
    this.log(`警告: ${warningTests}`, 'warning')
    this.log(`失敗: ${errorTests}`, 'error')

    this.log('', 'info')

    if (errorTests === 0) {
      this.log('🎉 所有測試通過！Supabase 設定正確', 'success')
      this.log('', 'info')
      this.log('下一步：', 'info')
      this.log('1. 瀏覽器訪問 http://localhost:3000/test-supabase', 'info')
      this.log('2. 開始實作 Phase 0 的混合資料策略', 'info')
      this.log('3. 建立 Supabase tables (orders, carts, inventory)', 'info')
    } else {
      this.log('⚠️ 發現問題，請檢查以下項目：', 'warning')
      this.log('', 'info')
      this.log('1. .env.local 檔案是否存在且設定正確', 'info')
      this.log('2. Supabase 專案是否已啟動', 'info')
      this.log('3. API Keys 是否為最新版本', 'info')
      this.log('4. 網路連線是否正常', 'info')

      this.log('', 'info')
      this.log('失敗的測試：', 'error')
      this.results
        .filter(r => r.status === 'error')
        .forEach((result: TestResult) => {
          this.log(`- ${result.name}: ${result.message}`, 'error')
        })
    }
  }
}

// 執行測試
async function main() {
  const runner = new SupabaseTestRunner()
  await runner.runAllTests()
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 測試執行失敗:', error)
    process.exit(1)
  })
}

export default SupabaseTestRunner
