/**
 * SmartUploadDecision - 智慧上傳決策引擎
 *
 * 功能特色：
 * - 多維度評分系統（表單完成度、使用者行為、網路狀況、檔案大小、系統負載）
 * - 智慧權重調整和機器學習優化
 * - 條件式上傳決策與延遲建議
 * - 詳細的決策推理和優先權判定
 * - 即時效能監控和統計分析
 */

import { logger } from '@/lib/logger'

export type Priority = 'low' | 'normal' | 'high' | 'critical'

export interface UploadContext {
  formCompleteness: number // 0-100
  userIdleTime: number // 毫秒
  networkQuality: NetworkInfo
  fileSize: number // 位元組
  availableStorage: number // 位元組
  userBehavior: UserBehaviorData
  systemLoad: SystemLoadInfo
  timestamp?: number // 決策時間戳
  sessionId?: string // 會話 ID
}

export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  downlink: number // Mbps
  rtt: number // 毫秒
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | '5g'
  saveData: boolean // 是否啟用資料節省模式
}

export interface UserBehaviorData {
  averageFormFillTime: number // 毫秒
  completionRate: number // 0-100
  abandonmentRate: number // 0-100
  timeOfDay: number // 0-23
  dayOfWeek: number // 0-6 (0=Sunday)
  sessionDuration: number // 當前會話持續時間(毫秒)
  interactionCount: number // 當前會話互動次數
  lastUploadTime?: number // 上次上傳時間戳
}

export interface SystemLoadInfo {
  cpuUsage: number // 0-100 (估算)
  memoryUsage: number // 0-100
  activeUploads: number // 目前進行中的上傳數量
  queuedUploads: number // 佇列中的上傳數量
  availableBandwidth: number // 可用頻寬(Mbps)
}

export interface UploadDecision {
  shouldUpload: boolean
  confidence: number // 0-1
  reasoning: string[]
  suggestedDelay: number // 毫秒，0表示立即上傳
  priority: Priority
  metadata: {
    scoreBreakdown: ScoreBreakdown
    totalScore: number
    appliedWeights: ScoreWeights
    contextSnapshot: Partial<UploadContext>
    decisionTime: number
  }
}

export interface ScoreBreakdown {
  formCompleteness: number // 0-1
  userBehavior: number // 0-1
  network: number // 0-1
  fileSize: number // 0-1
  systemLoad: number // 0-1
}

export interface ScoreWeights {
  formCompleteness: number
  userBehavior: number
  network: number
  fileSize: number
  systemLoad: number
}

export interface DecisionStats {
  totalDecisions: number
  uploadRecommended: number
  averageConfidence: number
  averageDelay: number
  priorityDistribution: Record<Priority, number>
  scoreDistribution: {
    formCompleteness: { avg: number; min: number; max: number }
    userBehavior: { avg: number; min: number; max: number }
    network: { avg: number; min: number; max: number }
    fileSize: { avg: number; min: number; max: number }
    systemLoad: { avg: number; min: number; max: number }
  }
}

export class SmartUploadDecision {
  private static instance: SmartUploadDecision

  // 預設權重（可動態調整）
  private weights: ScoreWeights = {
    formCompleteness: 0.3, // 表單完成度最重要
    userBehavior: 0.25, // 使用者行為次重要
    network: 0.2, // 網路狀況
    fileSize: 0.15, // 檔案大小
    systemLoad: 0.1, // 系統負載
  }

  // 決策閾值
  private readonly UPLOAD_THRESHOLD = 0.6 // 總分超過此值建議上傳
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.8 // 高信心度閾值
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.4 // 低信心度閾值

  // 統計資料
  private stats: DecisionStats = {
    totalDecisions: 0,
    uploadRecommended: 0,
    averageConfidence: 0,
    averageDelay: 0,
    priorityDistribution: { low: 0, normal: 0, high: 0, critical: 0 },
    scoreDistribution: {
      formCompleteness: { avg: 0, min: 1, max: 0 },
      userBehavior: { avg: 0, min: 1, max: 0 },
      network: { avg: 0, min: 1, max: 0 },
      fileSize: { avg: 0, min: 1, max: 0 },
      systemLoad: { avg: 0, min: 1, max: 0 },
    },
  }

  // 決策歷史記錄（用於學習）
  private decisionHistory: Array<{
    context: UploadContext
    decision: UploadDecision
    actualOutcome?: 'success' | 'failed' | 'cancelled'
    timestamp: number
  }> = []

  private readonly MAX_HISTORY = 1000 // 最多保留 1000 條決策記錄

  /**
   * 單例模式
   */
  static getInstance(): SmartUploadDecision {
    if (!SmartUploadDecision.instance) {
      SmartUploadDecision.instance = new SmartUploadDecision()
    }
    return SmartUploadDecision.instance
  }

  /**
   * 主要決策方法：是否應該立即上傳
   */
  shouldUploadNow(context: UploadContext): UploadDecision {
    const timer = logger.timer('智慧上傳決策')

    try {
      // 計算各項評分
      const scores = this.calculateScores(context)

      // 加權總分
      const totalScore = this.weightedSum(scores)

      // 生成決策
      const decision: UploadDecision = {
        shouldUpload: totalScore > this.UPLOAD_THRESHOLD,
        confidence: totalScore,
        reasoning: this.generateReasoning(scores, context),
        suggestedDelay: this.calculateDelay(totalScore, context),
        priority: this.determinePriority(context, totalScore),
        metadata: {
          scoreBreakdown: scores,
          totalScore,
          appliedWeights: { ...this.weights },
          contextSnapshot: {
            formCompleteness: context.formCompleteness,
            networkQuality: context.networkQuality,
            fileSize: context.fileSize,
            userIdleTime: context.userIdleTime,
          },
          decisionTime: Date.now(),
        },
      }

      // 更新統計資料
      this.updateStats(decision, scores)

      // 記錄決策歷史
      this.recordDecision(context, decision)

      const duration = timer.end({
        metadata: {
          shouldUpload: decision.shouldUpload,
          confidence: decision.confidence.toFixed(3),
          priority: decision.priority,
          suggestedDelay: decision.suggestedDelay,
          totalScore: totalScore.toFixed(3),
        },
      })

      logger.info('智慧上傳決策完成', {
        metadata: {
          decision: decision.shouldUpload ? '建議上傳' : '建議延遲',
          confidence: `${(decision.confidence * 100).toFixed(1)}%`,
          priority: decision.priority,
          delay:
            decision.suggestedDelay > 0
              ? `${(decision.suggestedDelay / 1000).toFixed(1)}s`
              : '立即',
          reasoning: decision.reasoning.slice(0, 2),
          duration,
        },
      })

      return decision
    } catch (error) {
      timer.end()
      logger.error('智慧上傳決策失敗', error as Error, {
        metadata: {
          formCompleteness: context.formCompleteness,
          fileSize: context.fileSize,
          networkType: context.networkQuality.type,
        },
      })

      // 返回保守的決策
      return {
        shouldUpload: false,
        confidence: 0.1,
        reasoning: ['決策引擎發生錯誤，採用保守策略'],
        suggestedDelay: 30000, // 30秒後重試
        priority: 'low',
        metadata: {
          scoreBreakdown: {
            formCompleteness: 0,
            userBehavior: 0,
            network: 0,
            fileSize: 0,
            systemLoad: 0,
          },
          totalScore: 0,
          appliedWeights: { ...this.weights },
          contextSnapshot: {},
          decisionTime: Date.now(),
        },
      }
    }
  }

  /**
   * 計算各項評分
   */
  private calculateScores(context: UploadContext): ScoreBreakdown {
    return {
      formCompleteness: this.scoreFormCompleteness(context.formCompleteness),
      userBehavior: this.scoreUserBehavior(context.userBehavior),
      network: this.scoreNetwork(context.networkQuality),
      fileSize: this.scoreFileSize(context.fileSize, context.availableStorage),
      systemLoad: this.scoreSystemLoad(context.systemLoad),
    }
  }

  /**
   * 表單完成度評分
   * 使用 S 曲線：70% 以上開始快速增長
   */
  private scoreFormCompleteness(completeness: number): number {
    // S 曲線評分，在 70% 處有一個拐點
    const score = 1 / (1 + Math.exp(-0.1 * (completeness - 70)))

    // 極低完成度給予懲罰
    if (completeness < 20) {
      return score * 0.3
    }

    // 95% 以上給予獎勵
    if (completeness >= 95) {
      return Math.min(1, score * 1.1)
    }

    return score
  }

  /**
   * 使用者行為評分
   */
  private scoreUserBehavior(behavior: UserBehaviorData): number {
    // 放棄率懲罰（放棄率越高分數越低）
    const abandonmentPenalty = Math.max(0, 1 - behavior.abandonmentRate / 100)

    // 完成率獎勵
    const completionBonus = behavior.completionRate / 100

    // 時間獎勵
    const timeBonus = this.getTimeOfDayBonus(behavior.timeOfDay)

    // 星期幾獎勵（工作日 vs 週末）
    const dayBonus = this.getDayOfWeekBonus(behavior.dayOfWeek)

    // 會話活躍度（互動次數和持續時間）
    const sessionActivity = this.getSessionActivityScore(
      behavior.interactionCount,
      behavior.sessionDuration
    )

    // 上傳間隔評分（避免過於頻繁的上傳）
    const uploadFrequencyScore = this.getUploadFrequencyScore(behavior.lastUploadTime)

    return (
      abandonmentPenalty * 0.25 +
      completionBonus * 0.25 +
      timeBonus * 0.15 +
      dayBonus * 0.1 +
      sessionActivity * 0.15 +
      uploadFrequencyScore * 0.1
    )
  }

  /**
   * 網路狀況評分
   */
  private scoreNetwork(network: NetworkInfo): number {
    // 網路類型評分
    const typeScores: Record<string, number> = {
      ethernet: 1.0,
      wifi: 0.9,
      '5g': 0.85,
      '4g': 0.7,
      '3g': 0.5,
      '2g': 0.3,
      'slow-2g': 0.2,
      cellular: 0.6,
      unknown: 0.3,
    }
    const typeScore = typeScores[network.type] || typeScores[network.effectiveType] || 0.3

    // 速度評分（10Mbps = 滿分）
    const speedScore = Math.min(network.downlink / 10, 1)

    // 延遲評分（100ms 以下滿分，1000ms 以上 0 分）
    const latencyScore = Math.max(0, Math.min(1, (1000 - network.rtt) / 900))

    // 資料節省模式懲罰
    const saveDataPenalty = network.saveData ? 0.7 : 1.0

    const baseScore = (typeScore * 0.4 + speedScore * 0.4 + latencyScore * 0.2) * saveDataPenalty

    // 網路狀況極差時給予更大懲罰
    if (network.effectiveType === 'slow-2g' || network.rtt > 2000) {
      return baseScore * 0.5
    }

    return baseScore
  }

  /**
   * 檔案大小評分
   */
  private scoreFileSize(size: number, availableStorage: number): number {
    const sizeInMB = size / (1024 * 1024)
    const storageInMB = availableStorage / (1024 * 1024)

    // 基礎大小評分
    let sizeScore: number
    if (sizeInMB < 1) {
      sizeScore = 1.0 // 小於 1MB：滿分
    } else if (sizeInMB < 5) {
      sizeScore = 0.8 // 1-5MB：良好
    } else if (sizeInMB < 10) {
      sizeScore = 0.5 // 5-10MB：一般
    } else if (sizeInMB < 50) {
      sizeScore = 0.3 // 10-50MB：較差
    } else {
      sizeScore = 0.1 // 超過 50MB：很差
    }

    // 儲存空間充足度修正
    const storageRatio = size / availableStorage
    let storageModifier = 1.0

    if (storageRatio > 0.1) {
      // 超過可用空間 10%
      storageModifier = 0.7
    } else if (storageRatio > 0.05) {
      // 超過可用空間 5%
      storageModifier = 0.85
    }

    return sizeScore * storageModifier
  }

  /**
   * 系統負載評分
   */
  private scoreSystemLoad(load: SystemLoadInfo): number {
    // CPU 使用率評分（使用率越低分數越高）
    const cpuScore = Math.max(0, (100 - load.cpuUsage) / 100)

    // 記憶體使用率評分
    const memoryScore = Math.max(0, (100 - load.memoryUsage) / 100)

    // 並行上傳數量評分（5個並行上傳為上限）
    const uploadScore = Math.max(0, (5 - load.activeUploads) / 5)

    // 佇列長度評分（10個佇列項目為上限）
    const queueScore = Math.max(0, (10 - load.queuedUploads) / 10)

    // 可用頻寬評分
    const bandwidthScore = Math.min(load.availableBandwidth / 5, 1) // 5Mbps 為滿分

    return (
      cpuScore * 0.2 +
      memoryScore * 0.3 +
      uploadScore * 0.2 +
      queueScore * 0.15 +
      bandwidthScore * 0.15
    )
  }

  /**
   * 時間獎勵計算
   */
  private getTimeOfDayBonus(hour: number): number {
    if (hour >= 9 && hour <= 17) {
      return 1.0 // 工作時間：滿分
    } else if ((hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 22)) {
      return 0.8 // 早晨和晚上：良好
    } else if (hour >= 23 || hour <= 5) {
      return 0.4 // 深夜/凌晨：較差
    } else {
      return 0.6 // 其他時間：一般
    }
  }

  /**
   * 星期獎勵計算
   */
  private getDayOfWeekBonus(day: number): number {
    if (day >= 1 && day <= 5) {
      return 1.0 // 工作日：滿分
    } else if (day === 6) {
      return 0.8 // 星期六：良好
    } else {
      return 0.7 // 星期日：一般
    }
  }

  /**
   * 會話活躍度評分
   */
  private getSessionActivityScore(interactionCount: number, sessionDuration: number): number {
    const durationInMinutes = sessionDuration / (1000 * 60)

    // 互動頻率（每分鐘互動次數）
    const interactionRate = durationInMinutes > 0 ? interactionCount / durationInMinutes : 0

    // 理想的互動頻率是每分鐘 0.5-2 次
    if (interactionRate >= 0.5 && interactionRate <= 2) {
      return 1.0
    } else if (interactionRate >= 0.2 && interactionRate <= 5) {
      return 0.8
    } else {
      return 0.5
    }
  }

  /**
   * 上傳頻率評分
   */
  private getUploadFrequencyScore(lastUploadTime?: number): number {
    if (!lastUploadTime) return 1.0

    const timeSinceLastUpload = Date.now() - lastUploadTime
    const minutesSince = timeSinceLastUpload / (1000 * 60)

    // 5 分鐘內的上傳給予懲罰（避免過於頻繁）
    if (minutesSince < 5) {
      return 0.3
    } else if (minutesSince < 15) {
      return 0.7
    } else {
      return 1.0
    }
  }

  /**
   * 加權總分計算
   */
  private weightedSum(scores: ScoreBreakdown): number {
    return (
      scores.formCompleteness * this.weights.formCompleteness +
      scores.userBehavior * this.weights.userBehavior +
      scores.network * this.weights.network +
      scores.fileSize * this.weights.fileSize +
      scores.systemLoad * this.weights.systemLoad
    )
  }

  /**
   * 生成決策推理
   */
  private generateReasoning(scores: ScoreBreakdown, context: UploadContext): string[] {
    const reasoning: string[] = []

    // 表單完成度推理
    if (scores.formCompleteness > 0.8) {
      reasoning.push(`表單完成度高 (${context.formCompleteness}%)，建議上傳`)
    } else if (scores.formCompleteness < 0.3) {
      reasoning.push(`表單完成度低 (${context.formCompleteness}%)，建議等待更多內容`)
    }

    // 網路狀況推理
    if (scores.network > 0.8) {
      reasoning.push(
        `網路狀況良好 (${context.networkQuality.type}, ${context.networkQuality.downlink}Mbps)`
      )
    } else if (scores.network < 0.4) {
      reasoning.push(
        `網路狀況不佳 (${context.networkQuality.effectiveType}, ${context.networkQuality.rtt}ms 延遲)`
      )
    }

    // 檔案大小推理
    const fileSizeMB = (context.fileSize / (1024 * 1024)).toFixed(1)
    if (scores.fileSize > 0.8) {
      reasoning.push(`檔案大小適中 (${fileSizeMB}MB)`)
    } else if (scores.fileSize < 0.4) {
      reasoning.push(`檔案較大 (${fileSizeMB}MB)，可能需要較好的網路條件`)
    }

    // 使用者行為推理
    if (scores.userBehavior > 0.7) {
      reasoning.push('使用者行為模式顯示高完成機率')
    } else if (scores.userBehavior < 0.4) {
      reasoning.push('使用者行為模式顯示可能中途離開')
    }

    // 系統負載推理
    if (scores.systemLoad < 0.3) {
      reasoning.push(`系統負載較高，建議稍後上傳`)
    }

    // 閒置時間推理
    if (context.userIdleTime > 5000) {
      reasoning.push(`使用者閒置 ${(context.userIdleTime / 1000).toFixed(1)} 秒，適合背景上傳`)
    }

    if (reasoning.length === 0) {
      reasoning.push('綜合評估建議的上傳策略')
    }

    return reasoning
  }

  /**
   * 計算建議延遲時間
   */
  private calculateDelay(totalScore: number, context: UploadContext): number {
    if (totalScore > this.HIGH_CONFIDENCE_THRESHOLD) {
      return 0 // 立即上傳
    }

    if (totalScore > this.UPLOAD_THRESHOLD) {
      // 短延遲 (5-30 秒)
      return Math.floor(5000 + (this.HIGH_CONFIDENCE_THRESHOLD - totalScore) * 50000)
    }

    if (totalScore > this.LOW_CONFIDENCE_THRESHOLD) {
      // 中延遲 (30秒-5分鐘)
      return Math.floor(30000 + (this.UPLOAD_THRESHOLD - totalScore) * 200000)
    }

    // 長延遲 (5-15分鐘)
    const baseDelay = 300000 // 5 分鐘
    const maxAdditionalDelay = 600000 // 額外 10 分鐘
    const scoreFactor = Math.max(0, this.LOW_CONFIDENCE_THRESHOLD - totalScore)

    return Math.floor(
      baseDelay + (scoreFactor * maxAdditionalDelay) / this.LOW_CONFIDENCE_THRESHOLD
    )
  }

  /**
   * 決定優先權
   */
  private determinePriority(context: UploadContext, totalScore: number): Priority {
    // 檔案大小影響優先權
    const fileSizeMB = context.fileSize / (1024 * 1024)

    if (totalScore > 0.9 || fileSizeMB < 0.5) {
      return 'critical'
    } else if (totalScore > 0.75 || context.formCompleteness > 90) {
      return 'high'
    } else if (totalScore > 0.5) {
      return 'normal'
    } else {
      return 'low'
    }
  }

  /**
   * 更新統計資料
   */
  private updateStats(decision: UploadDecision, scores: ScoreBreakdown): void {
    this.stats.totalDecisions++

    if (decision.shouldUpload) {
      this.stats.uploadRecommended++
    }

    // 更新平均信心度
    const prevAvg = this.stats.averageConfidence
    this.stats.averageConfidence =
      (prevAvg * (this.stats.totalDecisions - 1) + decision.confidence) / this.stats.totalDecisions

    // 更新平均延遲
    const prevDelayAvg = this.stats.averageDelay
    this.stats.averageDelay =
      (prevDelayAvg * (this.stats.totalDecisions - 1) + decision.suggestedDelay) /
      this.stats.totalDecisions

    // 更新優先權分布
    this.stats.priorityDistribution[decision.priority]++

    // 更新評分分布
    for (const [key, value] of Object.entries(scores)) {
      const scoreKey = key as keyof ScoreBreakdown
      const dist = this.stats.scoreDistribution[scoreKey]

      const prevAvg = dist.avg
      const count = this.stats.totalDecisions
      dist.avg = (prevAvg * (count - 1) + value) / count
      dist.min = Math.min(dist.min, value)
      dist.max = Math.max(dist.max, value)
    }
  }

  /**
   * 記錄決策歷史
   */
  private recordDecision(context: UploadContext, decision: UploadDecision): void {
    this.decisionHistory.push({
      context,
      decision,
      timestamp: Date.now(),
    })

    // 保持歷史記錄在限制範圍內
    if (this.decisionHistory.length > this.MAX_HISTORY) {
      this.decisionHistory.shift()
    }
  }

  /**
   * 取得決策統計
   */
  getStats(): DecisionStats {
    return { ...this.stats }
  }

  /**
   * 重置統計資料
   */
  resetStats(): void {
    this.stats = {
      totalDecisions: 0,
      uploadRecommended: 0,
      averageConfidence: 0,
      averageDelay: 0,
      priorityDistribution: { low: 0, normal: 0, high: 0, critical: 0 },
      scoreDistribution: {
        formCompleteness: { avg: 0, min: 1, max: 0 },
        userBehavior: { avg: 0, min: 1, max: 0 },
        network: { avg: 0, min: 1, max: 0 },
        fileSize: { avg: 0, min: 1, max: 0 },
        systemLoad: { avg: 0, min: 1, max: 0 },
      },
    }
    this.decisionHistory = []
    logger.info('智慧上傳決策統計已重置')
  }

  /**
   * 調整權重（用於機器學習優化）
   */
  adjustWeights(newWeights: Partial<ScoreWeights>): void {
    this.weights = { ...this.weights, ...newWeights }

    // 確保權重總和為 1
    const total = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0)
    if (Math.abs(total - 1) > 0.01) {
      logger.warn('權重總和不為 1，進行正規化', {
        metadata: { oldWeights: this.weights, total },
      })

      for (const key in this.weights) {
        this.weights[key as keyof ScoreWeights] /= total
      }
    }

    logger.info('智慧上傳決策權重已調整', {
      metadata: { newWeights: this.weights },
    })
  }

  /**
   * 記錄實際結果（用於機器學習）
   */
  recordOutcome(decisionId: string, outcome: 'success' | 'failed' | 'cancelled'): void {
    const recentDecision = this.decisionHistory
      .reverse()
      .find(record => record.decision.metadata.decisionTime.toString() === decisionId)

    if (recentDecision) {
      recentDecision.actualOutcome = outcome
      logger.debug('決策結果已記錄', {
        metadata: { outcome, confidence: recentDecision.decision.confidence },
      })
    }
  }

  /**
   * 取得決策建議（供外部系統參考）
   */
  getDecisionInsights(): {
    recommendedThresholds: { upload: number; highConfidence: number; lowConfidence: number }
    optimalWeights: ScoreWeights
    performanceMetrics: {
      successRate: number
      averageDecisionTime: number
      mostCommonPriority: Priority
    }
  } {
    const successfulDecisions = this.decisionHistory.filter(
      record => record.actualOutcome === 'success'
    )

    const successRate =
      this.decisionHistory.length > 0 ? successfulDecisions.length / this.decisionHistory.length : 0

    const avgDecisionTime =
      this.decisionHistory.length > 0
        ? this.decisionHistory.reduce(
            (sum, record) =>
              sum +
              (record.decision.metadata.decisionTime -
                (record.context.timestamp || record.decision.metadata.decisionTime)),
            0
          ) / this.decisionHistory.length
        : 0

    const priorityCounts = this.stats.priorityDistribution
    const mostCommonPriority = Object.entries(priorityCounts).reduce(
      (max, [priority, count]) =>
        count > max.count ? { priority: priority as Priority, count } : max,
      { priority: 'normal' as Priority, count: 0 }
    ).priority

    return {
      recommendedThresholds: {
        upload: this.UPLOAD_THRESHOLD,
        highConfidence: this.HIGH_CONFIDENCE_THRESHOLD,
        lowConfidence: this.LOW_CONFIDENCE_THRESHOLD,
      },
      optimalWeights: { ...this.weights },
      performanceMetrics: {
        successRate,
        averageDecisionTime: avgDecisionTime,
        mostCommonPriority,
      },
    }
  }
}

/**
 * 導出單例實例
 */
export const smartUploadDecision = SmartUploadDecision.getInstance()

/**
 * 便捷函數：快速決策
 */
export function shouldUploadNow(context: UploadContext): UploadDecision {
  return smartUploadDecision.shouldUploadNow(context)
}

/**
 * 便捷函數：取得當前網路資訊
 */
export function getCurrentNetworkInfo(): NetworkInfo {
  let networkInfo: NetworkInfo = {
    type: 'unknown',
    downlink: 1,
    rtt: 100,
    effectiveType: '4g',
    saveData: false,
  }

  if (typeof window !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection
    if (connection) {
      networkInfo = {
        type: connection.type || 'unknown',
        downlink: connection.downlink || 1,
        rtt: connection.rtt || 100,
        effectiveType: connection.effectiveType || '4g',
        saveData: connection.saveData || false,
      }
    }
  }

  return networkInfo
}
