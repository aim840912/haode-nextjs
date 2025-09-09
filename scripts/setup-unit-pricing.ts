#!/usr/bin/env npx tsx

/**
 * 設置單位價格功能的資料庫結構
 *
 * 使用方法：
 * npx tsx scripts/setup-unit-pricing.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

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

class UnitPricingSetup {
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

  private getClient() {
    return createClient(this.supabaseUrl, this.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
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

  async checkCurrentSchema(): Promise<boolean> {
    try {
      this.log('🔍 檢查 products 表的當前結構...', 'info')

      const client = this.getClient()

      // 嘗試查詢新欄位來確認是否存在
      const { data, error } = await client
        .from('products')
        .select('id, name, price, price_unit, unit_quantity')
        .limit(1)

      if (error) {
        if (
          error.message.includes('column') &&
          (error.message.includes('price_unit') || error.message.includes('unit_quantity'))
        ) {
          this.log('❌ 資料庫中缺少 price_unit 和 unit_quantity 欄位', 'error')
          return false
        }
        throw error
      }

      this.log('✅ 資料庫結構檢查通過 - 欄位存在', 'success')

      if (data && data.length > 0) {
        const product = data[0]
        this.log(`📊 範例產品資料:`, 'info')
        this.log(`   ID: ${product.id}`, 'info')
        this.log(`   名稱: ${product.name}`, 'info')
        this.log(`   價格: ${product.price}`, 'info')
        this.log(`   單位: ${product.price_unit || '未設定'}`, 'info')
        this.log(`   數量: ${product.unit_quantity || '未設定'}`, 'info')
      }

      return true
    } catch (error) {
      this.log(
        `❌ 檢查資料庫結構時發生錯誤: ${error instanceof Error ? error.message : error}`,
        'error'
      )
      return false
    }
  }

  async addUnitPricingColumns(): Promise<boolean> {
    try {
      this.log('🔧 新增單位價格欄位到 products 表...', 'info')

      const client = this.getClient()

      // SQL 語句來新增欄位
      const migrationSQL = `
        -- 新增價格單位欄位
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20),
        ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC DEFAULT 1;
        
        -- 新增註解說明
        COMMENT ON COLUMN products.price_unit IS '價格單位（如：斤、包、箱等）';
        COMMENT ON COLUMN products.unit_quantity IS '單位數量，預設為 1';
      `

      // 分割 SQL 語句並執行
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          this.log(`⚡ 執行語句 ${i + 1}/${statements.length}...`, 'info')

          // 使用原始 SQL 執行
          const { error } = await client.rpc('exec_sql', { sql: statement })

          if (error) {
            this.log(`❌ 語句執行失敗: ${error.message}`, 'error')
            return false
          }

          this.log(`✅ 語句執行成功`, 'success')
        }
      }

      return true
    } catch (error) {
      this.log(`❌ 新增欄位時發生錯誤: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }

  async testUnitPricingFeature(): Promise<boolean> {
    try {
      this.log('🧪 測試單位價格功能...', 'info')

      const client = this.getClient()

      // 確認可以正常查詢新欄位
      const { data, error } = await client
        .from('products')
        .select('id, name, price, price_unit, unit_quantity')
        .limit(5)

      if (error) {
        this.log(`❌ 測試查詢失敗: ${error.message}`, 'error')
        return false
      }

      this.log('✅ 查詢測試成功', 'success')
      this.log(`📊 找到 ${data?.length || 0} 個產品記錄`, 'info')

      return true
    } catch (error) {
      this.log(`❌ 功能測試失敗: ${error instanceof Error ? error.message : error}`, 'error')
      return false
    }
  }
}

async function main() {
  console.log('🚀 開始設置單位價格功能...')

  const setup = new UnitPricingSetup()

  // 1. 檢查當前資料庫結構
  const schemaExists = await setup.checkCurrentSchema()

  if (!schemaExists) {
    // 2. 如果欄位不存在，新增它們
    console.log('\n🔧 需要更新資料庫結構...')
    const migrationSuccess = await setup.addUnitPricingColumns()

    if (!migrationSuccess) {
      console.log('❌ 資料庫遷移失敗')
      process.exit(1)
    }
  }

  // 3. 測試功能
  console.log('\n🧪 執行功能測試...')
  const testSuccess = await setup.testUnitPricingFeature()

  if (!testSuccess) {
    console.log('❌ 功能測試失敗')
    process.exit(1)
  }

  console.log('\n🎉 單位價格功能設置完成！')
  console.log('✅ 資料庫已準備好支援單位價格功能')
  console.log('📝 現在可以在新增產品時設定價格單位')

  process.exit(0)
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 腳本執行失敗:', error)
    process.exit(1)
  })
}
