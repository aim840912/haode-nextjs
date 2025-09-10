#!/usr/bin/env tsx

/**
 * Rate Limiting 測試腳本
 *
 * 用於驗證 rate limiting 系統的正確性：
 * - 測試不同端點的限制
 * - 驗證錯誤處理
 * - 檢查監控功能
 * - 測試自動重試機制
 */

import { rateLimiter, IdentifierStrategy } from '../src/lib/rate-limiter'
import { getRateLimitConfig } from '../src/config/rate-limits'
import { rateLimitMonitor } from '../src/services/rateLimitMonitoringService'

// 模擬 NextRequest 物件
class MockRequest {
  public method: string
  public url: string
  public nextUrl: { pathname: string }
  private headerMap: Map<string, string> = new Map()

  constructor(method: string, pathname: string, headers: Record<string, string> = {}) {
    this.method = method
    this.url = `http://localhost:3000${pathname}`
    this.nextUrl = { pathname }

    // 設置預設標頭
    this.headerMap.set('user-agent', 'rate-limiting-test-script/1.0')
    this.headerMap.set('x-forwarded-for', '127.0.0.1')

    // 添加自定義標頭
    Object.entries(headers).forEach(([key, value]) => {
      this.headerMap.set(key.toLowerCase(), value)
    })
  }

  headers = {
    get: (name: string) => this.headerMap.get(name.toLowerCase()) || null,
  }
}

/**
 * 測試結果統計
 */
interface TestResults {
  totalTests: number
  passedTests: number
  failedTests: number
  errors: Array<{
    test: string
    error: string
  }>
}

/**
 * 測試套件
 */
class RateLimitTester {
  private results: TestResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errors: [],
  }

  /**
   * 執行測試
   */
  private test(name: string, testFn: () => Promise<boolean>): Promise<void> {
    return new Promise(async resolve => {
      this.results.totalTests++
      console.log(`\n🧪 測試: ${name}`)

      try {
        const passed = await testFn()
        if (passed) {
          this.results.passedTests++
          console.log(`✅ 通過: ${name}`)
        } else {
          this.results.failedTests++
          console.log(`❌ 失敗: ${name}`)
        }
      } catch (error) {
        this.results.failedTests++
        const errorMsg = error instanceof Error ? error.message : String(error)
        this.results.errors.push({ test: name, error: errorMsg })
        console.log(`❌ 錯誤: ${name} - ${errorMsg}`)
      }

      resolve()
    })
  }

  /**
   * 測試基本 rate limiting 功能
   */
  async testBasicRateLimit(): Promise<boolean> {
    const config = {
      maxRequests: 3,
      windowMs: 60000,
      strategy: IdentifierStrategy.IP,
      enableAuditLog: false,
      includeHeaders: true,
    }

    const request = new MockRequest('POST', '/api/test') as any
    let allowedCount = 0
    let rejectedCount = 0

    // 發送 5 個請求，預期前 3 個通過，後 2 個被拒絕
    for (let i = 0; i < 5; i++) {
      const result = await rateLimiter.checkRateLimit(request, config)
      if (result.allowed) {
        allowedCount++
      } else {
        rejectedCount++
      }

      console.log(
        `  請求 ${i + 1}: ${result.allowed ? '允許' : '拒絕'} (剩餘: ${result.remaining})`
      )
    }

    return allowedCount === 3 && rejectedCount === 2
  }

  /**
   * 測試不同識別策略
   */
  async testIdentifierStrategies(): Promise<boolean> {
    const configs = [
      { strategy: IdentifierStrategy.IP, expected: 'IP' },
      { strategy: IdentifierStrategy.API_KEY, expected: 'API Key' },
      { strategy: IdentifierStrategy.COMBINED, expected: 'Combined' },
    ]

    let allPassed = true

    for (const { strategy, expected } of configs) {
      const config = {
        maxRequests: 10,
        windowMs: 60000,
        strategy,
        enableAuditLog: false,
        includeHeaders: true,
      }

      const request1 = new MockRequest('GET', '/api/test', {
        'x-api-key': 'test-key-1',
      }) as any

      const request2 = new MockRequest('GET', '/api/test', {
        'x-forwarded-for': '192.168.1.100',
        'x-api-key': 'test-key-2',
      }) as any

      const result1 = await rateLimiter.checkRateLimit(request1, config)
      const result2 = await rateLimiter.checkRateLimit(request2, config)

      console.log(
        `  策略 ${expected}: 請求1識別符=${result1.identifier}, 請求2識別符=${result2.identifier}`
      )

      // 驗證不同識別符產生不同的結果
      if (result1.identifier === result2.identifier && strategy !== IdentifierStrategy.IP) {
        allPassed = false
      }
    }

    return allPassed
  }

  /**
   * 測試配置載入
   */
  async testConfigLoading(): Promise<boolean> {
    const testPaths = [
      '/api/inquiries',
      '/api/admin/products',
      '/api/cart',
      '/api/products',
      '/api/unknown',
    ]

    let configsLoaded = 0

    for (const path of testPaths) {
      const config = getRateLimitConfig(path)
      if (config) {
        configsLoaded++
        console.log(
          `  ${path}: 限制=${config.maxRequests}/${config.windowMs}ms, 策略=${config.strategy}`
        )
      } else {
        console.log(`  ${path}: 無配置`)
      }
    }

    return configsLoaded >= 4 // 至少應該載入 4 個配置
  }

  /**
   * 測試監控功能
   */
  async testMonitoring(): Promise<boolean> {
    // 記錄一些測試事件
    await rateLimitMonitor.recordRateLimitEvent('127.0.0.1', '/api/test', 'ip', false, {
      userAgent: 'test',
    })

    await rateLimitMonitor.recordRateLimitEvent('127.0.0.1', '/api/test', 'ip', true, {
      userAgent: 'test',
    })

    // 獲取統計
    const stats = await rateLimitMonitor.getStats()

    console.log(`  統計: 總請求=${stats.totalRequests}, 被限制=${stats.limitedRequests}`)
    console.log(`  限制率: ${stats.limitRate.toFixed(2)}%`)
    console.log(`  被封鎖 IP: ${stats.blockedIPs}`)

    return stats.totalRequests > 0
  }

  /**
   * 測試 IP 封鎖功能
   */
  async testIPBlocking(): Promise<boolean> {
    const testIP = '192.168.1.200'

    // 檢查初始狀態
    let blockInfo = await rateLimitMonitor.isIPBlocked(testIP)
    if (blockInfo) {
      console.log(`  警告: ${testIP} 已被封鎖，先解除封鎖`)
      await rateLimitMonitor.unblockIP(testIP, 'test_cleanup')
    }

    // 封鎖 IP
    await rateLimitMonitor.blockIP(
      testIP,
      'rate_limit_exceeded' as any,
      60000, // 1 分鐘
      { testMode: true }
    )

    // 檢查是否被封鎖
    blockInfo = await rateLimitMonitor.isIPBlocked(testIP)
    const isBlocked = blockInfo !== null

    console.log(`  ${testIP} 封鎖狀態: ${isBlocked ? '已封鎖' : '未封鎖'}`)
    if (blockInfo) {
      console.log(`  封鎖原因: ${blockInfo.reason}`)
      console.log(`  到期時間: ${blockInfo.expiresAt}`)
    }

    // 解除封鎖（清理）
    if (isBlocked) {
      await rateLimitMonitor.unblockIP(testIP, 'test_cleanup')
      const afterUnblock = await rateLimitMonitor.isIPBlocked(testIP)
      console.log(`  解除封鎖後狀態: ${afterUnblock ? '仍被封鎖' : '已解除'}`)
    }

    return isBlocked
  }

  /**
   * 測試記憶體回退機制
   */
  async testMemoryFallback(): Promise<boolean> {
    console.log('  注意: 記憶體回退測試需要 KV 服務不可用時才能完整驗證')
    console.log('  當前測試僅驗證記憶體存儲的基本功能')

    const config = {
      maxRequests: 2,
      windowMs: 60000,
      strategy: IdentifierStrategy.IP,
      enableAuditLog: false,
      includeHeaders: true,
    }

    const request = new MockRequest('GET', '/api/fallback-test', {
      'x-forwarded-for': '10.0.0.1',
    }) as any

    let successCount = 0

    // 測試基本功能
    for (let i = 0; i < 3; i++) {
      try {
        const result = await rateLimiter.checkRateLimit(request, config)
        if (i < 2 && result.allowed) successCount++
        if (i >= 2 && !result.allowed) successCount++
      } catch (error) {
        console.log(`  回退測試錯誤 ${i}: ${error}`)
      }
    }

    return successCount === 3
  }

  /**
   * 執行所有測試
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 開始 Rate Limiting 系統測試...\n')
    console.log('=' * 50)

    await this.test('基本 Rate Limiting 功能', () => this.testBasicRateLimit())
    await this.test('不同識別策略', () => this.testIdentifierStrategies())
    await this.test('配置載入', () => this.testConfigLoading())
    await this.test('監控功能', () => this.testMonitoring())
    await this.test('IP 封鎖功能', () => this.testIPBlocking())
    await this.test('記憶體回退機制', () => this.testMemoryFallback())

    this.printResults()
  }

  /**
   * 輸出測試結果
   */
  private printResults(): void {
    console.log('\n' + '=' * 50)
    console.log('📊 測試結果統計:')
    console.log(`總測試數: ${this.results.totalTests}`)
    console.log(`通過: ${this.results.passedTests} ✅`)
    console.log(`失敗: ${this.results.failedTests} ❌`)
    console.log(
      `成功率: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)}%`
    )

    if (this.results.errors.length > 0) {
      console.log('\n🐛 錯誤詳情:')
      this.results.errors.forEach(({ test, error }) => {
        console.log(`  ${test}: ${error}`)
      })
    }

    console.log('\n' + '=' * 50)

    if (this.results.failedTests === 0) {
      console.log('🎉 所有測試通過！Rate Limiting 系統運作正常。')
    } else {
      console.log('⚠️  部分測試失敗，請檢查上述錯誤並修復。')
    }

    console.log('\n📚 測試說明:')
    console.log('- 這些測試驗證了 rate limiting 系統的核心功能')
    console.log('- 某些功能（如 KV 存儲）在本地環境中可能無法完全測試')
    console.log('- 建議在部署環境中進行完整的端到端測試')
  }
}

/**
 * 主函數
 */
async function main() {
  const tester = new RateLimitTester()

  try {
    await tester.runAllTests()
  } catch (error) {
    console.error('測試執行失敗:', error)
    process.exit(1)
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(console.error)
}
