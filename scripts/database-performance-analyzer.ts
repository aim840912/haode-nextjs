/**
 * 資料庫效能分析工具
 *
 * 🎯 功能：
 * - 分析查詢效能和索引使用情況
 * - 識別慢查詢和效能瓶頸
 * - 提供優化建議
 * - 生成詳細的效能報告
 */

import { createServiceSupabaseClient } from '../src/lib/supabase-server'
import { dbLogger } from '../src/lib/logger'
import fs from 'fs'
import path from 'path'

interface TableSizeInfo {
  tablename: string
  size_bytes: number
  size_pretty: string
  row_count: number
}

interface IndexUsageInfo {
  schemaname: string
  tablename: string
  indexname: string
  idx_scan: number
  idx_tup_read: number
  idx_tup_fetch: number
}

interface QueryPerformance {
  query: string
  calls: number
  total_time: number
  mean_time: number
  rows: number
}

interface PerformanceReport {
  timestamp: string
  databaseSize: string
  tablesSummary: TableSizeInfo[]
  indexUsage: IndexUsageInfo[]
  slowQueries: QueryPerformance[]
  recommendations: string[]
}

async function analyzeDatabasePerformance(): Promise<void> {
  const startTime = Date.now()

  try {
    dbLogger.info('開始資料庫效能分析', {
      module: 'PerformanceAnalyzer',
      action: 'start',
    })

    const client = createServiceSupabaseClient()

    // 1. 分析資料庫大小和表格統計
    const tablesSummary = await analyzeTableSizes(client)

    // 2. 分析索引使用情況
    const indexUsage = await analyzeIndexUsage(client)

    // 3. 檢查查詢效能（如果可用）
    const slowQueries = await analyzeSlowQueries(client)

    // 4. 獲取資料庫總大小
    const databaseSize = await getDatabaseSize(client)

    // 5. 生成優化建議
    const recommendations = generateRecommendations({
      tablesSummary,
      indexUsage,
      slowQueries,
    })

    // 6. 建立效能報告
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      databaseSize,
      tablesSummary,
      indexUsage,
      slowQueries,
      recommendations,
    }

    // 7. 輸出報告
    await generatePerformanceReport(report)
    await saveReportToFile(report)

    const executionTime = Date.now() - startTime
    dbLogger.info('✅ 資料庫效能分析完成', {
      module: 'PerformanceAnalyzer',
      action: 'complete',
      metadata: {
        executionTime,
        tablesAnalyzed: tablesSummary.length,
        indexesAnalyzed: indexUsage.length,
        slowQueriesFound: slowQueries.length,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    dbLogger.error('💥 效能分析執行失敗', {
      module: 'PerformanceAnalyzer',
      action: 'error',
      metadata: { error: errorMessage },
    })
    process.exit(1)
  }
}

/**
 * 分析表格大小和統計資訊
 */
async function analyzeTableSizes(client: any): Promise<TableSizeInfo[]> {
  try {
    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT 
          t.tablename,
          pg_total_relation_size(c.oid) as size_bytes,
          pg_size_pretty(pg_total_relation_size(c.oid)) as size_pretty,
          COALESCE(s.n_live_tup, 0) as row_count
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        LEFT JOIN pg_stat_user_tables s ON s.tablename = t.tablename
        WHERE t.schemaname = 'public'
        AND t.tablename IN ('products', 'news', 'inquiries', 'inquiry_items', 
                           'product_images', 'user_interests', 'locations', 
                           'audit_logs', 'profiles', 'schedule', 'culture', 'farm_tour')
        ORDER BY pg_total_relation_size(c.oid) DESC
      `,
    })

    if (error) {
      dbLogger.warn('無法獲取表格大小資訊', {
        module: 'PerformanceAnalyzer',
        metadata: { error: error.message },
      })
      return []
    }

    return data || []
  } catch (error) {
    dbLogger.warn('表格大小分析失敗', {
      module: 'PerformanceAnalyzer',
      metadata: { error: String(error) },
    })
    return []
  }
}

/**
 * 分析索引使用情況
 */
async function analyzeIndexUsage(client: any): Promise<IndexUsageInfo[]> {
  try {
    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE tablename IN ('products', 'news', 'inquiries', 'inquiry_items', 
                           'product_images', 'user_interests', 'locations', 
                           'audit_logs', 'profiles', 'schedule', 'culture', 'farm_tour')
        ORDER BY idx_scan DESC, tablename, indexname
      `,
    })

    if (error) {
      dbLogger.warn('無法獲取索引使用統計', {
        module: 'PerformanceAnalyzer',
        metadata: { error: error.message },
      })
      return []
    }

    return data || []
  } catch (error) {
    dbLogger.warn('索引使用分析失敗', {
      module: 'PerformanceAnalyzer',
      metadata: { error: String(error) },
    })
    return []
  }
}

/**
 * 分析慢查詢（如果 pg_stat_statements 可用）
 */
async function analyzeSlowQueries(client: any): Promise<QueryPerformance[]> {
  try {
    // 檢查是否有 pg_stat_statements 擴展
    const { data: extensionCheck } = await client.rpc('exec_sql', {
      sql: `
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      `,
    })

    if (!extensionCheck || extensionCheck.length === 0) {
      dbLogger.info('pg_stat_statements 擴展未啟用，跳過慢查詢分析')
      return []
    }

    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT 
          substr(query, 1, 100) as query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE query NOT ILIKE '%pg_%'
        AND mean_time > 10
        ORDER BY mean_time DESC
        LIMIT 10
      `,
    })

    if (error) {
      dbLogger.warn('無法獲取慢查詢統計', {
        module: 'PerformanceAnalyzer',
        metadata: { error: error.message },
      })
      return []
    }

    return data || []
  } catch (error) {
    dbLogger.debug('慢查詢分析失敗（可能不支援）', {
      module: 'PerformanceAnalyzer',
      metadata: { error: String(error) },
    })
    return []
  }
}

/**
 * 獲取資料庫總大小
 */
async function getDatabaseSize(client: any): Promise<string> {
  try {
    const { data, error } = await client.rpc('exec_sql', {
      sql: `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
    })

    if (error || !data || data.length === 0) {
      return '未知'
    }

    return data[0].size
  } catch (error) {
    return '未知'
  }
}

/**
 * 生成優化建議
 */
function generateRecommendations(data: {
  tablesSummary: TableSizeInfo[]
  indexUsage: IndexUsageInfo[]
  slowQueries: QueryPerformance[]
}): string[] {
  const recommendations: string[] = []

  // 分析大型表格
  const largeTables = data.tablesSummary.filter(table => table.size_bytes > 100 * 1024 * 1024) // > 100MB
  if (largeTables.length > 0) {
    recommendations.push(`🔍 發現 ${largeTables.length} 個大型表格，建議定期執行 VACUUM ANALYZE`)
    largeTables.forEach(table => {
      recommendations.push(
        `  • ${table.tablename}: ${table.size_pretty} (${table.row_count.toLocaleString()} 行)`
      )
    })
  }

  // 分析未使用的索引
  const unusedIndexes = data.indexUsage.filter(
    index => index.idx_scan === 0 && !index.indexname.includes('pkey')
  )
  if (unusedIndexes.length > 0) {
    recommendations.push(`⚠️  發現 ${unusedIndexes.length} 個未使用的索引，考慮移除以節省空間`)
    unusedIndexes.slice(0, 5).forEach(index => {
      recommendations.push(`  • ${index.tablename}.${index.indexname}`)
    })
  }

  // 分析低使用率索引
  const lowUsageIndexes = data.indexUsage.filter(
    index => index.idx_scan > 0 && index.idx_scan < 10 && !index.indexname.includes('pkey')
  )
  if (lowUsageIndexes.length > 0) {
    recommendations.push(`📉 發現 ${lowUsageIndexes.length} 個低使用率索引，建議檢查其必要性`)
  }

  // 分析慢查詢
  if (data.slowQueries.length > 0) {
    recommendations.push(`🐌 發現 ${data.slowQueries.length} 個慢查詢，平均執行時間超過 10ms`)
    recommendations.push('   建議檢查查詢計劃並考慮添加適當索引')
  }

  // 通用建議
  recommendations.push('📈 建議定期監控項目：')
  recommendations.push('  • 每週執行 VACUUM ANALYZE')
  recommendations.push('  • 監控索引使用率和查詢效能')
  recommendations.push('  • 檢查資料庫連接池設定')
  recommendations.push('  • 實作查詢結果快取策略')

  return recommendations
}

/**
 * 生成控制台效能報告
 */
async function generatePerformanceReport(report: PerformanceReport): Promise<void> {
  console.log('\n' + '='.repeat(80))
  console.log('📊 資料庫效能分析報告')
  console.log('='.repeat(80))
  console.log(`🕐 分析時間: ${report.timestamp}`)
  console.log(`💾 資料庫大小: ${report.databaseSize}`)

  // 表格統計
  console.log('\n📋 表格大小統計:')
  console.log('─'.repeat(60))
  console.log('表格名稱'.padEnd(20) + '大小'.padEnd(12) + '行數')
  console.log('─'.repeat(60))
  report.tablesSummary.forEach(table => {
    console.log(
      table.tablename.padEnd(20) + table.size_pretty.padEnd(12) + table.row_count.toLocaleString()
    )
  })

  // 索引使用統計
  console.log('\n🔍 索引使用統計（前 10 個最常用）:')
  console.log('─'.repeat(80))
  console.log('表格.索引'.padEnd(40) + '掃描次數'.padEnd(12) + '讀取元組'.padEnd(12) + '提取元組')
  console.log('─'.repeat(80))
  report.indexUsage
    .sort((a, b) => b.idx_scan - a.idx_scan)
    .slice(0, 10)
    .forEach(index => {
      const indexName = `${index.tablename}.${index.indexname}`
      console.log(
        indexName.padEnd(40) +
          index.idx_scan.toLocaleString().padEnd(12) +
          index.idx_tup_read.toLocaleString().padEnd(12) +
          index.idx_tup_fetch.toLocaleString()
      )
    })

  // 慢查詢統計
  if (report.slowQueries.length > 0) {
    console.log('\n🐌 慢查詢統計:')
    console.log('─'.repeat(80))
    report.slowQueries.forEach((query, index) => {
      console.log(`${index + 1}. 查詢: ${query.query}...`)
      console.log(`   調用次數: ${query.calls}, 平均時間: ${query.mean_time.toFixed(2)}ms`)
    })
  }

  // 優化建議
  console.log('\n💡 優化建議:')
  console.log('─'.repeat(60))
  report.recommendations.forEach(recommendation => {
    console.log(recommendation)
  })

  console.log('\n' + '='.repeat(80))
}

/**
 * 儲存報告到檔案
 */
async function saveReportToFile(report: PerformanceReport): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `performance-report-${timestamp}.json`
    const filepath = path.join(__dirname, 'reports', filename)

    // 確保 reports 目錄存在
    const reportsDir = path.join(__dirname, 'reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

    console.log(`📄 效能報告已儲存: ${filepath}`)

    dbLogger.info('效能報告已儲存到檔案', {
      module: 'PerformanceAnalyzer',
      action: 'saveReport',
      metadata: { filepath },
    })
  } catch (error) {
    dbLogger.warn('無法儲存效能報告到檔案', {
      module: 'PerformanceAnalyzer',
      metadata: { error: String(error) },
    })
  }
}

// 執行腳本
if (require.main === module) {
  analyzeDatabasePerformance()
}
