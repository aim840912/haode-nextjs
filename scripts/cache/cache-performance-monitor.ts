/**
 * 快取和連線池效能監控工具
 *
 * 🎯 功能：
 * - 監控快取效能指標
 * - 監控資料庫連線池狀態
 * - 生成效能報告
 * - 自動調整建議
 * - 警報機制
 */

import { databaseConnectionPool } from '../src/lib/database-connection-pool'
import { advancedCacheStrategy } from '../src/lib/advanced-cache-strategy'
import { dbLogger, cacheLogger } from '../src/lib/logger'
import fs from 'fs'
import path from 'path'

/**
 * 監控配置
 */
interface MonitorConfig {
  /** 監控間隔（秒） */
  monitorInterval: number
  /** 報告生成間隔（秒） */
  reportInterval: number
  /** 警報閾值 */
  alertThresholds: {
    cacheHitRate: number
    connectionPoolUtilization: number
    averageResponseTime: number
    errorRate: number
  }
  /** 歷史資料保留天數 */
  historyRetentionDays: number
}

/**
 * 監控快照
 */
interface MonitoringSnapshot {
  timestamp: Date
  cacheMetrics: {
    hitRate: number
    memoryHitRate: number
    kvHitRate: number
    averageResponseTime: number
    memoryUsage: number
    totalOperations: number
    errorCount: number
  }
  connectionPoolMetrics: {
    totalConnections: number
    activeConnections: number
    utilizationRate: number
    averageResponseTime: number
    totalQueries: number
    failedQueries: number
    successRate: number
  }
  systemMetrics: {
    memoryUsagePercent: number
    cpuUsagePercent: number
  }
}

/**
 * 效能報告
 */
interface PerformanceReport {
  reportTime: Date
  timeRange: {
    start: Date
    end: Date
  }
  summary: {
    averageCacheHitRate: number
    averageConnectionUtilization: number
    totalQueries: number
    totalCacheOperations: number
    overallHealthScore: number
  }
  trends: {
    cacheHitRateTrend: 'improving' | 'declining' | 'stable'
    connectionUtilizationTrend: 'improving' | 'declining' | 'stable'
    responseTimeTrend: 'improving' | 'declining' | 'stable'
  }
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: 'cache' | 'database' | 'system'
    description: string
    recommendation: string
  }>
  optimizations: string[]
}

/**
 * 效能監控器類別
 */
export class CachePerformanceMonitor {
  private snapshots: MonitoringSnapshot[] = []
  private monitorTimer?: NodeJS.Timeout
  private reportTimer?: NodeJS.Timeout
  private alertCallbacks: Array<(issue: any) => void> = []

  constructor(private config: MonitorConfig) {
    this.initialize()
  }

  /**
   * 初始化監控
   */
  private initialize(): void {
    dbLogger.info('啟動快取和連線池效能監控', {
      module: 'CachePerformanceMonitor',
      action: 'initialize',
      metadata: { config: this.config },
    })

    // 啟動定期監控
    this.startMonitoring()

    // 啟動定期報告
    this.startReporting()

    // 清理歷史資料
    this.scheduleHistoryCleanup()
  }

  /**
   * 啟動監控
   */
  private startMonitoring(): void {
    this.monitorTimer = setInterval(() => this.takeSnapshot(), this.config.monitorInterval * 1000)

    // 立即執行一次
    this.takeSnapshot()
  }

  /**
   * 啟動報告生成
   */
  private startReporting(): void {
    this.reportTimer = setInterval(
      () => this.generateAndSaveReport(),
      this.config.reportInterval * 1000
    )
  }

  /**
   * 拍攝效能快照
   */
  private async takeSnapshot(): Promise<void> {
    const timer = dbLogger.timer('效能快照')

    try {
      // 獲取快取指標
      const cacheMetrics = await this.getCacheMetrics()

      // 獲取連線池指標
      const connectionPoolMetrics = await this.getConnectionPoolMetrics()

      // 獲取系統指標
      const systemMetrics = await this.getSystemMetrics()

      const snapshot: MonitoringSnapshot = {
        timestamp: new Date(),
        cacheMetrics,
        connectionPoolMetrics,
        systemMetrics,
      }

      this.snapshots.push(snapshot)

      // 檢查警報條件
      this.checkAlerts(snapshot)

      // 保持快照數量在合理範圍內
      if (this.snapshots.length > 1000) {
        this.snapshots = this.snapshots.slice(-500)
      }

      timer.end({
        metadata: {
          cacheHitRate: cacheMetrics.hitRate,
          connectionUtilization: connectionPoolMetrics.utilizationRate,
          totalSnapshots: this.snapshots.length,
        },
      })
    } catch (error) {
      timer.end()
      dbLogger.error('效能快照失敗', {
        module: 'CachePerformanceMonitor',
        metadata: { error: String(error) },
      })
    }
  }

  /**
   * 獲取快取指標
   */
  private async getCacheMetrics(): Promise<MonitoringSnapshot['cacheMetrics']> {
    try {
      const cacheStats = advancedCacheStrategy.getPerformanceMetrics()

      return {
        hitRate: cacheStats.hitRate,
        memoryHitRate: cacheStats.memoryHitRate,
        kvHitRate: cacheStats.kvHitRate,
        averageResponseTime: cacheStats.averageResponseTime,
        memoryUsage: cacheStats.memoryUsage,
        totalOperations: cacheStats.hotKeys.reduce((sum, key) => sum + key.accessCount, 0),
        errorCount: 0, // 需要從快取管理器獲取
      }
    } catch (error) {
      cacheLogger.warn('獲取快取指標失敗', {
        module: 'CachePerformanceMonitor',
        metadata: { error: String(error) },
      })

      return {
        hitRate: 0,
        memoryHitRate: 0,
        kvHitRate: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        totalOperations: 0,
        errorCount: 0,
      }
    }
  }

  /**
   * 獲取連線池指標
   */
  private async getConnectionPoolMetrics(): Promise<MonitoringSnapshot['connectionPoolMetrics']> {
    try {
      const poolStats = databaseConnectionPool.getStats()

      return {
        totalConnections: poolStats.totalConnections,
        activeConnections: poolStats.activeConnections,
        utilizationRate: poolStats.utilizationRate,
        averageResponseTime: poolStats.averageResponseTime,
        totalQueries: poolStats.totalQueries,
        failedQueries: poolStats.failedQueries,
        successRate: poolStats.successRate,
      }
    } catch (error) {
      dbLogger.warn('獲取連線池指標失敗', {
        module: 'CachePerformanceMonitor',
        metadata: { error: String(error) },
      })

      return {
        totalConnections: 0,
        activeConnections: 0,
        utilizationRate: 0,
        averageResponseTime: 0,
        totalQueries: 0,
        failedQueries: 0,
        successRate: 100,
      }
    }
  }

  /**
   * 獲取系統指標
   */
  private async getSystemMetrics(): Promise<MonitoringSnapshot['systemMetrics']> {
    try {
      // 使用 Node.js process API 獲取記憶體使用量
      const memInfo = process.memoryUsage()
      const totalMemory = require('os').totalmem()
      const memoryUsagePercent = (memInfo.rss / totalMemory) * 100

      // CPU 使用率需要第三方套件或系統命令
      const cpuUsagePercent = 0 // 簡化實作

      return {
        memoryUsagePercent,
        cpuUsagePercent,
      }
    } catch (error) {
      return {
        memoryUsagePercent: 0,
        cpuUsagePercent: 0,
      }
    }
  }

  /**
   * 檢查警報條件
   */
  private checkAlerts(snapshot: MonitoringSnapshot): void {
    const alerts: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      category: 'cache' | 'database' | 'system'
      description: string
    }> = []

    // 快取命中率警報
    if (snapshot.cacheMetrics.hitRate < this.config.alertThresholds.cacheHitRate) {
      alerts.push({
        severity: snapshot.cacheMetrics.hitRate < 50 ? 'critical' : 'high',
        category: 'cache',
        description: `快取命中率過低: ${snapshot.cacheMetrics.hitRate.toFixed(1)}%`,
      })
    }

    // 連線池使用率警報
    if (
      snapshot.connectionPoolMetrics.utilizationRate >
      this.config.alertThresholds.connectionPoolUtilization
    ) {
      alerts.push({
        severity: snapshot.connectionPoolMetrics.utilizationRate > 90 ? 'critical' : 'high',
        category: 'database',
        description: `連線池使用率過高: ${snapshot.connectionPoolMetrics.utilizationRate.toFixed(1)}%`,
      })
    }

    // 回應時間警報
    if (
      snapshot.connectionPoolMetrics.averageResponseTime >
      this.config.alertThresholds.averageResponseTime
    ) {
      alerts.push({
        severity: snapshot.connectionPoolMetrics.averageResponseTime > 5000 ? 'critical' : 'medium',
        category: 'database',
        description: `資料庫回應時間過長: ${snapshot.connectionPoolMetrics.averageResponseTime.toFixed(0)}ms`,
      })
    }

    // 觸發警報回調
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert)
        } catch (error) {
          dbLogger.warn('警報回調執行失敗', {
            module: 'CachePerformanceMonitor',
            metadata: { error: String(error) },
          })
        }
      })
    })

    if (alerts.length > 0) {
      dbLogger.warn('效能警報觸發', {
        module: 'CachePerformanceMonitor',
        metadata: { alerts },
      })
    }
  }

  /**
   * 生成並儲存報告
   */
  private async generateAndSaveReport(): Promise<void> {
    try {
      const report = this.generatePerformanceReport()
      await this.saveReportToFile(report)

      dbLogger.info('效能報告已生成', {
        module: 'CachePerformanceMonitor',
        metadata: {
          reportTime: report.reportTime,
          healthScore: report.summary.overallHealthScore,
          issuesCount: report.issues.length,
        },
      })
    } catch (error) {
      dbLogger.error('生成效能報告失敗', {
        module: 'CachePerformanceMonitor',
        metadata: { error: String(error) },
      })
    }
  }

  /**
   * 生成效能報告
   */
  generatePerformanceReport(): PerformanceReport {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 過濾最近一小時的快照
    const recentSnapshots = this.snapshots.filter(
      s => s.timestamp >= oneHourAgo && s.timestamp <= now
    )

    if (recentSnapshots.length === 0) {
      throw new Error('沒有可用的監控資料')
    }

    // 計算平均值
    const avgCacheHitRate = this.calculateAverage(recentSnapshots.map(s => s.cacheMetrics.hitRate))
    const avgConnectionUtilization = this.calculateAverage(
      recentSnapshots.map(s => s.connectionPoolMetrics.utilizationRate)
    )

    // 計算趨勢
    const cacheHitRateTrend = this.calculateTrend(recentSnapshots.map(s => s.cacheMetrics.hitRate))
    const connectionUtilizationTrend = this.calculateTrend(
      recentSnapshots.map(s => s.connectionPoolMetrics.utilizationRate)
    )
    const responseTimeTrend = this.calculateTrend(
      recentSnapshots.map(s => s.connectionPoolMetrics.averageResponseTime)
    )

    // 識別問題
    const issues = this.identifyIssues(recentSnapshots)

    // 生成最佳化建議
    const optimizations = this.generateOptimizations(recentSnapshots, issues)

    // 計算整體健康分數
    const overallHealthScore = this.calculateHealthScore(recentSnapshots)

    return {
      reportTime: now,
      timeRange: {
        start: oneHourAgo,
        end: now,
      },
      summary: {
        averageCacheHitRate: avgCacheHitRate,
        averageConnectionUtilization: avgConnectionUtilization,
        totalQueries: recentSnapshots.reduce(
          (sum, s) => sum + s.connectionPoolMetrics.totalQueries,
          0
        ),
        totalCacheOperations: recentSnapshots.reduce(
          (sum, s) => sum + s.cacheMetrics.totalOperations,
          0
        ),
        overallHealthScore,
      },
      trends: {
        cacheHitRateTrend,
        connectionUtilizationTrend,
        responseTimeTrend,
      },
      issues,
      optimizations,
    }
  }

  /**
   * 計算平均值
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  /**
   * 計算趨勢
   */
  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = this.calculateAverage(firstHalf)
    const secondAvg = this.calculateAverage(secondHalf)

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) return 'improving'
    if (change < -5) return 'declining'
    return 'stable'
  }

  /**
   * 識別問題
   */
  private identifyIssues(snapshots: MonitoringSnapshot[]): PerformanceReport['issues'] {
    const issues: PerformanceReport['issues'] = []

    const avgCacheHitRate = this.calculateAverage(snapshots.map(s => s.cacheMetrics.hitRate))
    const avgConnectionUtilization = this.calculateAverage(
      snapshots.map(s => s.connectionPoolMetrics.utilizationRate)
    )
    const avgResponseTime = this.calculateAverage(
      snapshots.map(s => s.connectionPoolMetrics.averageResponseTime)
    )

    // 快取命中率問題
    if (avgCacheHitRate < 70) {
      issues.push({
        severity: avgCacheHitRate < 50 ? 'critical' : 'high',
        category: 'cache',
        description: `快取命中率偏低 (${avgCacheHitRate.toFixed(1)}%)`,
        recommendation: '考慮增加快取 TTL、實作預熱策略或檢查快取鍵設計',
      })
    }

    // 連線池使用率問題
    if (avgConnectionUtilization > 80) {
      issues.push({
        severity: avgConnectionUtilization > 90 ? 'critical' : 'high',
        category: 'database',
        description: `連線池使用率過高 (${avgConnectionUtilization.toFixed(1)}%)`,
        recommendation: '考慮增加最大連線數或最佳化查詢效能',
      })
    }

    // 回應時間問題
    if (avgResponseTime > 1000) {
      issues.push({
        severity: avgResponseTime > 3000 ? 'critical' : 'medium',
        category: 'database',
        description: `資料庫回應時間過長 (${avgResponseTime.toFixed(0)}ms)`,
        recommendation: '檢查慢查詢、索引使用情況或考慮讀寫分離',
      })
    }

    return issues
  }

  /**
   * 生成最佳化建議
   */
  private generateOptimizations(
    snapshots: MonitoringSnapshot[],
    issues: PerformanceReport['issues']
  ): string[] {
    const optimizations: string[] = []

    // 基於問題生成建議
    if (issues.some(i => i.category === 'cache')) {
      optimizations.push('實作智慧型快取預熱策略')
      optimizations.push('考慮啟用快取壓縮功能')
      optimizations.push('檢查並最佳化快取鍵設計')
    }

    if (issues.some(i => i.category === 'database')) {
      optimizations.push('執行資料庫索引最佳化')
      optimizations.push('實作查詢結果快取')
      optimizations.push('考慮讀寫分離架構')
    }

    // 通用建議
    optimizations.push('定期執行 VACUUM ANALYZE')
    optimizations.push('監控並清理長時間執行的查詢')
    optimizations.push('考慮實作資料庫分片策略')

    return optimizations
  }

  /**
   * 計算健康分數
   */
  private calculateHealthScore(snapshots: MonitoringSnapshot[]): number {
    const avgCacheHitRate = this.calculateAverage(snapshots.map(s => s.cacheMetrics.hitRate))
    const avgSuccessRate = this.calculateAverage(
      snapshots.map(s => s.connectionPoolMetrics.successRate)
    )
    const avgUtilization = this.calculateAverage(
      snapshots.map(s => s.connectionPoolMetrics.utilizationRate)
    )

    // 健康分數計算 (0-100)
    let score = 0

    // 快取命中率權重 40%
    score += (avgCacheHitRate / 100) * 40

    // 查詢成功率權重 40%
    score += (avgSuccessRate / 100) * 40

    // 連線池使用率權重 20% (理想範圍 50-80%)
    const utilizationScore =
      avgUtilization <= 80
        ? Math.max(0, 100 - Math.abs(65 - avgUtilization) * 2)
        : Math.max(0, 100 - (avgUtilization - 80) * 5)
    score += (utilizationScore / 100) * 20

    return Math.round(score)
  }

  /**
   * 儲存報告到檔案
   */
  private async saveReportToFile(report: PerformanceReport): Promise<void> {
    try {
      const timestamp = report.reportTime.toISOString().replace(/[:.]/g, '-')
      const filename = `cache-performance-report-${timestamp}.json`
      const filepath = path.join(__dirname, 'reports', filename)

      // 確保 reports 目錄存在
      const reportsDir = path.join(__dirname, 'reports')
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

      console.log(`📄 效能報告已儲存: ${filepath}`)
    } catch (error) {
      dbLogger.warn('儲存效能報告失敗', {
        module: 'CachePerformanceMonitor',
        metadata: { error: String(error) },
      })
    }
  }

  /**
   * 排程歷史資料清理
   */
  private scheduleHistoryCleanup(): void {
    setInterval(
      () => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - this.config.historyRetentionDays)

        const beforeCount = this.snapshots.length
        this.snapshots = this.snapshots.filter(s => s.timestamp >= cutoffDate)
        const afterCount = this.snapshots.length

        if (beforeCount !== afterCount) {
          dbLogger.info('歷史資料清理完成', {
            module: 'CachePerformanceMonitor',
            metadata: { removedSnapshots: beforeCount - afterCount },
          })
        }
      },
      24 * 60 * 60 * 1000
    ) // 每天執行一次
  }

  /**
   * 添加警報回調
   */
  addAlertCallback(callback: (issue: any) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * 獲取最新快照
   */
  getLatestSnapshot(): MonitoringSnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null
  }

  /**
   * 停止監控
   */
  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer)
    }
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
    }

    dbLogger.info('效能監控已停止', {
      module: 'CachePerformanceMonitor',
    })
  }
}

/**
 * 啟動效能監控
 */
async function startPerformanceMonitoring(): Promise<void> {
  const monitor = new CachePerformanceMonitor({
    monitorInterval: 30, // 30 秒
    reportInterval: 3600, // 1 小時
    alertThresholds: {
      cacheHitRate: 70,
      connectionPoolUtilization: 85,
      averageResponseTime: 2000,
      errorRate: 5,
    },
    historyRetentionDays: 7,
  })

  // 添加警報處理器
  monitor.addAlertCallback(alert => {
    console.log(`🚨 效能警報: [${alert.severity.toUpperCase()}] ${alert.description}`)
  })

  console.log('✅ 效能監控已啟動')

  // 程序退出時停止監控
  process.on('SIGINT', () => {
    monitor.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    monitor.stop()
    process.exit(0)
  })
}

// 執行腳本
if (require.main === module) {
  startPerformanceMonitoring()
}
