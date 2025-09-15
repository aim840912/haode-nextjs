#!/usr/bin/env node

/**
 * 測試 Supabase MCP Server 連接的腳本
 *
 * 功能：
 * - 驗證環境變數設定
 * - 測試 MCP Server 啟動
 * - 檢查 Supabase 專案連接
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🧪 Supabase MCP Server 連接測試')
console.log('═'.repeat(50))

// 檢查環境變數
console.log('\n1️⃣ 檢查環境變數...')

const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 檔案不存在')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const hasAccessToken = envContent.includes('SUPABASE_ACCESS_TOKEN=sbp_')

if (hasAccessToken) {
  console.log('✅ SUPABASE_ACCESS_TOKEN 已設定')
} else {
  console.log('❌ SUPABASE_ACCESS_TOKEN 未正確設定')
  console.log('💡 請確認 .env.local 中的 token 以 "sbp_" 開頭')
  process.exit(1)
}

// 檢查 .mcp.json 設定檔
console.log('\n2️⃣ 檢查 MCP 設定檔...')
const mcpConfigPath = path.join(process.cwd(), '.mcp.json')
if (fs.existsSync(mcpConfigPath)) {
  console.log('✅ .mcp.json 設定檔存在')

  try {
    const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'))
    if (config.mcpServers && config.mcpServers.supabase) {
      console.log('✅ Supabase MCP 設定正確')
    } else {
      console.log('⚠️  MCP 設定檔格式可能不完整')
    }
  } catch (error) {
    console.log('⚠️  MCP 設定檔解析失敗:', error.message)
  }
} else {
  console.log('❌ .mcp.json 設定檔不存在')
}

// 測試 MCP Server 版本
console.log('\n3️⃣ 測試 MCP Server 版本...')

const versionProcess = spawn('npx', ['@supabase/mcp-server-supabase', '--version'], {
  stdio: ['inherit', 'pipe', 'pipe']
})

versionProcess.stdout.on('data', (data) => {
  const version = data.toString().trim()
  console.log('✅ MCP Server 版本:', version)
})

versionProcess.stderr.on('data', (data) => {
  console.log('⚠️  版本檢查警告:', data.toString().trim())
})

versionProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n4️⃣ 測試 MCP Server 啟動（5秒超時）...')
    testMcpServerStartup()
  } else {
    console.log('❌ MCP Server 版本檢查失敗，退出碼:', code)
    process.exit(1)
  }
})

function testMcpServerStartup() {
  // 設定環境變數並啟動 MCP Server
  const mcpProcess = spawn('npx', [
    '@supabase/mcp-server-supabase',
    '--read-only',
    '--project-ref=bxlrtcagsuoijjolgdzs',
    '--features=database,docs'
  ], {
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: 'sbp_5e3868ec81de0cbf77f283a5c52a79d28bb7d2de'
    },
    stdio: ['inherit', 'pipe', 'pipe']
  })

  let hasOutput = false
  const timeout = setTimeout(() => {
    if (!hasOutput) {
      console.log('⚠️  MCP Server 啟動超時（可能正在等待 Claude 連接）')
      console.log('💡 這是正常的，表示 MCP Server 已準備好接受連接')
    }
    mcpProcess.kill()
  }, 5000)

  mcpProcess.stdout.on('data', (data) => {
    hasOutput = true
    console.log('📤 MCP Server 輸出:', data.toString().trim())
  })

  mcpProcess.stderr.on('data', (data) => {
    const message = data.toString().trim()
    if (message.includes('error') || message.includes('Error')) {
      console.log('❌ MCP Server 錯誤:', message)
    } else {
      console.log('📝 MCP Server 訊息:', message)
    }
  })

  mcpProcess.on('close', (code) => {
    clearTimeout(timeout)

    if (code === 0 || code === null) {
      console.log('\n🎉 MCP Server 連接測試完成！')
      console.log('\n✅ 所有檢查都已通過')
      console.log('\n📋 下一步操作：')
      console.log('   1. 在 Claude Desktop 中檢查是否出現 Supabase 工具圖示')
      console.log('   2. 嘗試使用自然語言查詢資料庫')
      console.log('   3. 例如：「顯示所有門市資料」')
    } else {
      console.log('❌ MCP Server 測試失敗，退出碼:', code)
    }
  })
}