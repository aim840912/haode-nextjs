/**
 * 全文搜尋功能部署腳本
 *
 * 🎯 功能：
 * - 部署全文搜尋 SQL 函數
 * - 驗證搜尋功能是否正常運作
 * - 執行搜尋效能測試
 * - 生成部署報告
 */

// 載入環境變數
import { config } from 'dotenv'
import path from 'path'

// 載入 .env.local 檔案
const envPath = path.join(__dirname, '..', '.env.local')
config({ path: envPath })

import { createServiceSupabaseClient } from '../src/lib/supabase-server'
import { dbLogger } from '../src/lib/logger'
import fs from 'fs'

interface SearchTestResult {
  testName: string
  query: string
  resultCount: number
  executionTime: number
  success: boolean
  error?: string
}

interface DeploymentReport {
  timestamp: string
  functionsDeployed: number
  testResults: SearchTestResult[]
  performanceMetrics: Record<string, any>
  recommendations: string[]
}

async function deployFullTextSearch(): Promise<void> {
  const startTime = Date.now()

  try {
    dbLogger.info('開始部署全文搜尋功能', {
      module: 'FullTextSearchDeployment',
      action: 'start',
    })

    const client = createServiceSupabaseClient()

    // 1. 讀取並執行 SQL 函數
    await deploySearchFunctions(client)

    // 2. 驗證函數部署
    const functionsCount = await verifyFunctionDeployment(client)

    // 3. 執行搜尋測試
    const testResults = await runSearchTests(client)

    // 4. 分析效能指標
    const performanceMetrics = await analyzePerformanceMetrics(client)

    // 5. 生成建議
    const recommendations = generateRecommendations(testResults, performanceMetrics)

    // 6. 建立部署報告
    const report: DeploymentReport = {
      timestamp: new Date().toISOString(),
      functionsDeployed: functionsCount,
      testResults,
      performanceMetrics,
      recommendations,
    }

    // 7. 輸出報告
    await generateDeploymentReport(report)
    await saveDeploymentReport(report)

    const executionTime = Date.now() - startTime
    dbLogger.info('✅ 全文搜尋功能部署完成', {
      module: 'FullTextSearchDeployment',
      action: 'complete',
      metadata: {
        executionTime,
        functionsDeployed: functionsCount,
        testsRun: testResults.length,
        testsSuccessful: testResults.filter(t => t.success).length,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    dbLogger.error('💥 全文搜尋功能部署失敗', {
      module: 'FullTextSearchDeployment',
      action: 'error',
      metadata: { error: errorMessage },
    })
    process.exit(1)
  }
}

/**
 * 部署搜尋函數
 */
async function deploySearchFunctions(client: any): Promise<void> {
  try {
    dbLogger.info('📋 開始部署全文搜尋 SQL 函數...')

    // 讀取 SQL 腳本
    const sqlPath = path.join(__dirname, 'full-text-search-functions.sql')
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`全文搜尋 SQL 腳本不存在: ${sqlPath}`)
    }

    const functionsSQL = fs.readFileSync(sqlPath, 'utf-8')

    // 分割並執行 SQL 語句
    const statements = functionsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    dbLogger.info(`📝 準備執行 ${statements.length} 條 SQL 語句`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const progress = `[${i + 1}/${statements.length}]`

      try {
        const { error } = await client.rpc('exec_sql', { sql: statement })

        if (error) {
          if (error.message.includes('already exists')) {
            dbLogger.debug(`⚠️  ${progress} 物件已存在，跳過`)
          } else {
            dbLogger.error(`❌ ${progress} 執行失敗: ${error.message}`)
            errorCount++
          }
        } else {
          successCount++
          dbLogger.debug(`✅ ${progress} 執行成功`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        dbLogger.error(`💥 ${progress} 執行異常: ${errorMessage}`)
        errorCount++
      }
    }

    dbLogger.info('📋 SQL 函數部署完成', {
      module: 'FullTextSearchDeployment',
      metadata: { successCount, errorCount, totalStatements: statements.length },
    })
  } catch (error) {
    throw new Error(`部署搜尋函數失敗: ${error}`)
  }
}

/**
 * 驗證函數部署
 */
async function verifyFunctionDeployment(client: any): Promise<number> {
  try {
    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT 
          proname as function_name,
          pronargs as arg_count,
          pg_get_function_result(oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND proname IN (
          'full_text_search_products',
          'full_text_search_news',
          'get_search_suggestions',
          'log_search_activity',
          'get_popular_searches',
          'analyze_search_performance'
        )
        ORDER BY proname
      `,
    })

    if (error) {
      throw new Error(`驗證函數部署失敗: ${error.message}`)
    }

    const functions = data || []
    dbLogger.info('🔍 驗證函數部署結果', {
      module: 'FullTextSearchDeployment',
      metadata: {
        functionsFound: functions.length,
        functionNames: functions.map((f: any) => f.function_name),
      },
    })

    return functions.length
  } catch (error) {
    dbLogger.warn('驗證函數部署時發生錯誤', {
      module: 'FullTextSearchDeployment',
      metadata: { error: String(error) },
    })
    return 0
  }
}

/**
 * 執行搜尋測試
 */
async function runSearchTests(client: any): Promise<SearchTestResult[]> {
  const tests: Array<{
    testName: string
    functionName: string
    params: Record<string, any>
  }> = [
    {
      testName: '產品基本搜尋測試',
      functionName: 'full_text_search_products',
      params: { search_query: '農產品', search_limit: 5 },
    },
    {
      testName: '產品中文搜尋測試',
      functionName: 'full_text_search_products',
      params: { search_query: '有機蔬菜', search_limit: 5 },
    },
    {
      testName: '新聞搜尋測試',
      functionName: 'full_text_search_news',
      params: { search_query: '農業新聞', search_limit: 5 },
    },
    {
      testName: '搜尋建議測試',
      functionName: 'get_search_suggestions',
      params: { partial_query: '農', target_table: 'products', suggestion_limit: 3 },
    },
    {
      testName: '效能分析測試',
      functionName: 'analyze_search_performance',
      params: { table_name: 'products' },
    },
  ]

  const results: SearchTestResult[] = []

  for (const test of tests) {
    const startTime = Date.now()

    try {
      dbLogger.debug(`🧪 執行測試: ${test.testName}`)

      const { data, error } = await client.rpc(test.functionName, test.params)
      const executionTime = Date.now() - startTime

      if (error) {
        results.push({
          testName: test.testName,
          query: test.params.search_query || test.params.partial_query || 'N/A',
          resultCount: 0,
          executionTime,
          success: false,
          error: error.message,
        })
      } else {
        results.push({
          testName: test.testName,
          query: test.params.search_query || test.params.partial_query || 'N/A',
          resultCount: Array.isArray(data) ? data.length : 1,
          executionTime,
          success: true,
        })
      }
    } catch (err) {
      const executionTime = Date.now() - startTime
      results.push({
        testName: test.testName,
        query: test.params.search_query || test.params.partial_query || 'N/A',
        resultCount: 0,
        executionTime,
        success: false,
        error: String(err),
      })
    }
  }

  const successfulTests = results.filter(r => r.success).length
  dbLogger.info('🧪 搜尋測試完成', {
    module: 'FullTextSearchDeployment',
    metadata: {
      totalTests: results.length,
      successfulTests,
      failedTests: results.length - successfulTests,
    },
  })

  return results
}

/**
 * 分析效能指標
 */
async function analyzePerformanceMetrics(client: any): Promise<Record<string, any>> {
  try {
    const metrics: Record<string, any> = {}

    // 分析產品表效能
    const { data: productMetrics } = await client.rpc('analyze_search_performance', {
      table_name: 'products',
    })

    if (productMetrics) {
      metrics.products = {}
      productMetrics.forEach((metric: any) => {
        metrics.products[metric.metric_name] = {
          value: metric.metric_value,
          description: metric.description,
        }
      })
    }

    // 分析新聞表效能
    const { data: newsMetrics } = await client.rpc('analyze_search_performance', {
      table_name: 'news',
    })

    if (newsMetrics) {
      metrics.news = {}
      newsMetrics.forEach((metric: any) => {
        metrics.news[metric.metric_name] = {
          value: metric.metric_value,
          description: metric.description,
        }
      })
    }

    // 獲取索引使用統計
    const { data: indexStats } = await client.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename,
          COUNT(*) as index_count
        FROM pg_indexes 
        WHERE tablename IN ('products', 'news')
        GROUP BY tablename
      `,
    })

    if (indexStats) {
      metrics.indexes = {}
      indexStats.forEach((stat: any) => {
        metrics.indexes[stat.tablename] = stat.index_count
      })
    }

    return metrics
  } catch (error) {
    dbLogger.warn('分析效能指標時發生錯誤', {
      module: 'FullTextSearchDeployment',
      metadata: { error: String(error) },
    })
    return {}
  }
}

/**
 * 生成建議
 */
function generateRecommendations(
  testResults: SearchTestResult[],
  performanceMetrics: Record<string, any>
): string[] {
  const recommendations: string[] = []

  // 分析測試結果
  const failedTests = testResults.filter(t => !t.success)
  if (failedTests.length > 0) {
    recommendations.push(`⚠️  發現 ${failedTests.length} 個測試失敗，建議檢查錯誤並修復`)
    failedTests.forEach(test => {
      recommendations.push(`  • ${test.testName}: ${test.error}`)
    })
  }

  // 分析執行時間
  const slowTests = testResults.filter(t => t.success && t.executionTime > 1000)
  if (slowTests.length > 0) {
    recommendations.push(`🐌 發現 ${slowTests.length} 個慢速搜尋測試（>1秒）`)
    recommendations.push('   建議檢查索引配置和查詢最佳化')
  }

  // 檢查索引配置
  if (performanceMetrics.indexes) {
    const productIndexes = performanceMetrics.indexes.products || 0
    const newsIndexes = performanceMetrics.indexes.news || 0

    if (productIndexes < 3) {
      recommendations.push('📊 產品表索引數量偏少，建議執行索引優化腳本')
    }
    if (newsIndexes < 2) {
      recommendations.push('📊 新聞表索引數量偏少，建議執行索引優化腳本')
    }
  }

  // 通用建議
  recommendations.push('🚀 部署後續步驟建議：')
  recommendations.push('  • 定期監控搜尋效能和使用統計')
  recommendations.push('  • 實作搜尋結果快取策略')
  recommendations.push('  • 考慮使用 Elasticsearch 處理大量資料')
  recommendations.push('  • 建立搜尋分析儀表板')

  return recommendations
}

/**
 * 生成部署報告
 */
async function generateDeploymentReport(report: DeploymentReport): Promise<void> {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 全文搜尋功能部署報告')
  console.log('='.repeat(80))
  console.log(`🕐 部署時間: ${report.timestamp}`)
  console.log(`📋 部署函數: ${report.functionsDeployed} 個`)

  // 測試結果
  console.log('\n🧪 功能測試結果:')
  console.log('─'.repeat(80))
  console.log(
    '測試名稱'.padEnd(30) + '查詢'.padEnd(15) + '結果數'.padEnd(8) + '時間(ms)'.padEnd(10) + '狀態'
  )
  console.log('─'.repeat(80))

  report.testResults.forEach(test => {
    const status = test.success ? '✅ 通過' : '❌ 失敗'
    console.log(
      test.testName.padEnd(30) +
        (test.query.length > 12 ? test.query.substring(0, 12) + '...' : test.query).padEnd(15) +
        test.resultCount.toString().padEnd(8) +
        test.executionTime.toString().padEnd(10) +
        status
    )

    if (!test.success && test.error) {
      console.log(`    錯誤: ${test.error}`)
    }
  })

  // 效能指標
  console.log('\n📊 效能指標:')
  console.log('─'.repeat(60))
  Object.entries(report.performanceMetrics).forEach(([table, metrics]) => {
    console.log(`${table.toUpperCase()} 表格:`)
    if (typeof metrics === 'object' && metrics !== null) {
      Object.entries(metrics).forEach(([key, value]: [string, any]) => {
        if (typeof value === 'object' && value.value && value.description) {
          console.log(`  ${value.description}: ${value.value}`)
        }
      })
    }
    console.log()
  })

  // 建議
  console.log('💡 部署建議:')
  console.log('─'.repeat(60))
  report.recommendations.forEach(rec => {
    console.log(rec)
  })

  console.log('\n' + '='.repeat(80))
}

/**
 * 儲存部署報告
 */
async function saveDeploymentReport(report: DeploymentReport): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `full-text-search-deployment-${timestamp}.json`
    const filepath = path.join(__dirname, 'reports', filename)

    // 確保 reports 目錄存在
    const reportsDir = path.join(__dirname, 'reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

    console.log(`📄 部署報告已儲存: ${filepath}`)

    dbLogger.info('部署報告已儲存到檔案', {
      module: 'FullTextSearchDeployment',
      action: 'saveReport',
      metadata: { filepath },
    })
  } catch (error) {
    dbLogger.warn('無法儲存部署報告到檔案', {
      module: 'FullTextSearchDeployment',
      metadata: { error: String(error) },
    })
  }
}

// 執行腳本
if (require.main === module) {
  deployFullTextSearch()
}
