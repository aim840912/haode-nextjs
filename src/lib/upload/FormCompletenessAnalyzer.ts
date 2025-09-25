/**
 * FormCompletenessAnalyzer - 表單完成度分析服務
 *
 * 功能特色：
 * - 多維度表單分析（必填欄位、選填欄位、內容品質、結構完整性）
 * - 智慧權重調整和學習優化
 * - 即時完成度計算和預測分析
 * - 使用者行為模式識別
 * - 動態建議和優化提示
 */

import { logger } from '@/lib/logger'

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'file'
  | 'date'
  | 'url'
export type FieldPriority = 'required' | 'important' | 'optional' | 'enhancement'
export type ContentQuality = 'empty' | 'minimal' | 'adequate' | 'good' | 'excellent'

export interface FormField {
  id: string
  name: string
  type: FieldType
  priority: FieldPriority
  value: any
  isValid: boolean
  isVisible: boolean
  isEnabled: boolean
  placeholder?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  options?: string[] // for select, radio, checkbox
  metadata?: {
    lastModified?: number
    focusTime?: number
    changeCount?: number
    validationAttempts?: number
  }
}

export interface FormSection {
  id: string
  name: string
  priority: FieldPriority
  fields: FormField[]
  isVisible: boolean
  isComplete?: boolean
  completionScore?: number
}

export interface FormStructure {
  id: string
  name: string
  sections: FormSection[]
  totalFields: number
  requiredFields: number
  completedFields: number
  metadata?: {
    createdAt?: number
    lastModified?: number
    sessionId?: string
    userAgent?: string
  }
}

export interface CompletenessAnalysis {
  overallScore: number // 0-100
  weightedScore: number // 0-1 for decision engine
  breakdown: {
    requiredFields: {
      completed: number
      total: number
      percentage: number
      score: number
    }
    importantFields: {
      completed: number
      total: number
      percentage: number
      score: number
    }
    optionalFields: {
      completed: number
      total: number
      percentage: number
      score: number
    }
    contentQuality: {
      average: ContentQuality
      score: number
      details: Record<string, ContentQuality>
    }
    structuralIntegrity: {
      sectionsCompleted: number
      totalSections: number
      percentage: number
      score: number
    }
  }
  insights: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    predictedCompletionTime?: number
    riskFactors: string[]
  }
  metadata: {
    analysisTime: number
    fieldCount: number
    sectionCount: number
    totalFocusTime: number
    interactionCount: number
  }
}

export interface FormBehaviorPattern {
  fillSpeed: number // 字元/分鐘
  pauseFrequency: number // 暫停次數/分鐘
  revisionRate: number // 修改次數/欄位
  sectionJumpRate: number // 跨區段跳轉率
  validationFailureRate: number // 驗證失敗率
  timeDistribution: Record<string, number> // 各欄位耗時分布
}

export class FormCompletenessAnalyzer {
  private static instance: FormCompletenessAnalyzer

  // 評分權重
  private weights = {
    requiredFields: 0.4, // 必填欄位最重要
    importantFields: 0.25, // 重要欄位
    contentQuality: 0.2, // 內容品質
    structuralIntegrity: 0.1, // 結構完整性
    optionalFields: 0.05, // 選填欄位加分項
  }

  // 分析統計
  private stats = {
    totalAnalyses: 0,
    averageCompleteness: 0,
    commonPatterns: new Map<string, number>(),
    performanceMetrics: {
      avgAnalysisTime: 0,
      cacheHitRate: 0,
    },
  }

  // 分析快取
  private analysisCache = new Map<
    string,
    {
      analysis: CompletenessAnalysis
      timestamp: number
    }
  >()
  private readonly CACHE_TTL = 30000 // 30秒快取

  /**
   * 單例模式
   */
  static getInstance(): FormCompletenessAnalyzer {
    if (!FormCompletenessAnalyzer.instance) {
      FormCompletenessAnalyzer.instance = new FormCompletenessAnalyzer()
    }
    return FormCompletenessAnalyzer.instance
  }

  /**
   * 主要分析方法：計算表單完成度
   */
  analyzeFormCompleteness(form: FormStructure): CompletenessAnalysis {
    const timer = logger.timer('表單完成度分析')
    const cacheKey = this.generateCacheKey(form)

    try {
      // 檢查快取
      const cached = this.getCachedAnalysis(cacheKey)
      if (cached) {
        timer.end({ metadata: { source: 'cache' } })
        return cached
      }

      // 執行完整分析
      const analysis = this.performAnalysis(form)

      // 快取結果
      this.cacheAnalysis(cacheKey, analysis)

      // 更新統計
      this.updateStats(analysis)

      const duration = timer.end({
        metadata: {
          overallScore: analysis.overallScore,
          weightedScore: analysis.weightedScore.toFixed(3),
          totalFields: form.totalFields,
          completedFields: form.completedFields,
        },
      })

      logger.info('表單完成度分析完成', {
        metadata: {
          formId: form.id,
          overallScore: `${analysis.overallScore.toFixed(1)}%`,
          weightedScore: analysis.weightedScore.toFixed(3),
          requiredCompletion: `${analysis.breakdown.requiredFields.percentage.toFixed(1)}%`,
          duration,
        },
      })

      return analysis
    } catch (error) {
      timer.end()
      logger.error('表單完成度分析失敗', error as Error, {
        metadata: {
          formId: form.id,
          totalFields: form.totalFields,
        },
      })

      // 返回基礎分析
      return this.createFallbackAnalysis(form)
    }
  }

  /**
   * 執行完整分析
   */
  private performAnalysis(form: FormStructure): CompletenessAnalysis {
    const startTime = performance.now()

    // 分析各類別欄位
    const requiredAnalysis = this.analyzeFieldsByPriority(form, 'required')
    const importantAnalysis = this.analyzeFieldsByPriority(form, 'important')
    const optionalAnalysis = this.analyzeFieldsByPriority(form, 'optional')

    // 分析內容品質
    const contentQualityAnalysis = this.analyzeContentQuality(form)

    // 分析結構完整性
    const structuralAnalysis = this.analyzeStructuralIntegrity(form)

    // 計算加權分數
    const weightedScore = this.calculateWeightedScore({
      requiredFields: requiredAnalysis.score,
      importantFields: importantAnalysis.score,
      contentQuality: contentQualityAnalysis.score,
      structuralIntegrity: structuralAnalysis.score,
      optionalFields: optionalAnalysis.score,
    })

    // 計算整體分數 (0-100)
    const overallScore = weightedScore * 100

    // 生成洞察分析
    const insights = this.generateInsights(form, {
      requiredAnalysis,
      importantAnalysis,
      optionalAnalysis,
      contentQualityAnalysis,
      structuralAnalysis,
      overallScore,
    })

    // 收集元數據
    const metadata = this.collectMetadata(form, performance.now() - startTime)

    return {
      overallScore,
      weightedScore,
      breakdown: {
        requiredFields: requiredAnalysis,
        importantFields: importantAnalysis,
        optionalFields: optionalAnalysis,
        contentQuality: contentQualityAnalysis,
        structuralIntegrity: structuralAnalysis,
      },
      insights,
      metadata,
    }
  }

  /**
   * 按優先級分析欄位
   */
  private analyzeFieldsByPriority(
    form: FormStructure,
    priority: FieldPriority
  ): {
    completed: number
    total: number
    percentage: number
    score: number
  } {
    const fields = form.sections
      .flatMap(section => section.fields)
      .filter(field => field.priority === priority && field.isVisible && field.isEnabled)

    const total = fields.length
    const completed = fields.filter(field => this.isFieldCompleted(field)).length

    if (total === 0) {
      return { completed: 0, total: 0, percentage: 100, score: 1 }
    }

    const percentage = (completed / total) * 100
    const score = this.calculateFieldScore(percentage, priority)

    return { completed, total, percentage, score }
  }

  /**
   * 檢查欄位是否完成
   */
  private isFieldCompleted(field: FormField): boolean {
    if (!field.isValid) return false

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
        return this.isTextFieldCompleted(field)

      case 'number':
      case 'tel':
        return field.value !== null && field.value !== undefined && field.value !== ''

      case 'select':
      case 'radio':
        return field.value !== null && field.value !== undefined && field.value !== ''

      case 'checkbox':
        return Array.isArray(field.value) ? field.value.length > 0 : !!field.value

      case 'file':
        return field.value instanceof File || (Array.isArray(field.value) && field.value.length > 0)

      case 'date':
        return (
          field.value instanceof Date || (typeof field.value === 'string' && field.value.length > 0)
        )

      default:
        return !!field.value
    }
  }

  /**
   * 檢查文字欄位是否完成
   */
  private isTextFieldCompleted(field: FormField): boolean {
    if (!field.value || typeof field.value !== 'string') return false

    const trimmedValue = field.value.trim()
    if (trimmedValue.length === 0) return false

    // 檢查最小長度
    if (field.minLength && trimmedValue.length < field.minLength) return false

    // 檢查是否只是佔位符內容
    if (field.placeholder && trimmedValue === field.placeholder) return false

    // 檢查是否為有意義的內容（至少包含一些實質內容）
    if (field.type === 'textarea' && trimmedValue.length < 10) return false
    if (field.type === 'text' && trimmedValue.length < 2) return false

    return true
  }

  /**
   * 計算欄位分數
   */
  private calculateFieldScore(percentage: number, priority: FieldPriority): number {
    let baseScore = percentage / 100

    // 根據優先級調整評分曲線
    switch (priority) {
      case 'required':
        // 必填欄位使用嚴格的 S 曲線，70% 以下大幅懲罰
        baseScore = 1 / (1 + Math.exp(-0.15 * (percentage - 75)))
        break

      case 'important':
        // 重要欄位使用溫和的 S 曲線
        baseScore = 1 / (1 + Math.exp(-0.1 * (percentage - 60)))
        break

      case 'optional':
        // 選填欄位線性加分
        baseScore = Math.min(1, percentage / 100)
        break

      case 'enhancement':
        // 增強欄位給予獎勵分數
        baseScore = Math.min(1.2, (percentage / 100) * 1.2)
        break
    }

    return Math.max(0, Math.min(1, baseScore))
  }

  /**
   * 分析內容品質
   */
  private analyzeContentQuality(form: FormStructure): {
    average: ContentQuality
    score: number
    details: Record<string, ContentQuality>
  } {
    const details: Record<string, ContentQuality> = {}
    const qualityScores: number[] = []

    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.isVisible && field.value) {
          const quality = this.assessContentQuality(field)
          details[field.id] = quality
          qualityScores.push(this.contentQualityToScore(quality))
        }
      }
    }

    if (qualityScores.length === 0) {
      return {
        average: 'empty',
        score: 0,
        details: {},
      }
    }

    const averageScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
    const average = this.scoreToContentQuality(averageScore)

    return {
      average,
      score: averageScore,
      details,
    }
  }

  /**
   * 評估單一欄位的內容品質
   */
  private assessContentQuality(field: FormField): ContentQuality {
    if (!field.value) return 'empty'

    switch (field.type) {
      case 'text':
      case 'textarea':
        return this.assessTextQuality(field.value, field.type)

      case 'email':
        return this.isValidEmail(field.value) ? 'good' : 'minimal'

      case 'tel':
        return this.isValidPhone(field.value) ? 'good' : 'minimal'

      case 'url':
        return this.isValidURL(field.value) ? 'good' : 'minimal'

      case 'file':
        return this.assessFileQuality(field.value)

      default:
        return field.value ? 'adequate' : 'empty'
    }
  }

  /**
   * 評估文字內容品質
   */
  private assessTextQuality(text: string, type: 'text' | 'textarea'): ContentQuality {
    if (!text || typeof text !== 'string') return 'empty'

    const trimmed = text.trim()
    const length = trimmed.length
    const wordCount = trimmed.split(/\s+/).filter(word => word.length > 0).length

    // 檢查是否包含有意義的內容
    const hasNumbers = /\d/.test(trimmed)
    const hasLetters = /[a-zA-Z\u4e00-\u9fff]/.test(trimmed)
    const hasPunctuation = /[.,!?;:]/.test(trimmed)

    if (length === 0) return 'empty'

    if (type === 'textarea') {
      // 文字區域的品質評估
      if (length < 10) return 'minimal'
      if (length < 50 || wordCount < 8) return 'adequate'
      if (length < 200 || wordCount < 30) return 'good'
      return 'excellent'
    } else {
      // 一般文字欄位的品質評估
      if (length < 2) return 'minimal'
      if (length < 5 || wordCount < 2) return 'adequate'
      if (length >= 10 && (hasNumbers || hasPunctuation)) return 'excellent'
      return 'good'
    }
  }

  /**
   * 評估檔案品質
   */
  private assessFileQuality(fileValue: any): ContentQuality {
    if (!fileValue) return 'empty'

    if (fileValue instanceof File) {
      // 單一檔案
      if (fileValue.size === 0) return 'minimal'
      if (fileValue.size < 1024) return 'adequate'
      if (fileValue.size < 1024 * 1024) return 'good'
      return 'excellent'
    }

    if (Array.isArray(fileValue)) {
      // 多個檔案
      if (fileValue.length === 0) return 'empty'
      if (fileValue.length === 1) return 'adequate'
      if (fileValue.length <= 3) return 'good'
      return 'excellent'
    }

    return 'minimal'
  }

  /**
   * 分析結構完整性
   */
  private analyzeStructuralIntegrity(form: FormStructure): {
    sectionsCompleted: number
    totalSections: number
    percentage: number
    score: number
  } {
    const totalSections = form.sections.filter(section => section.isVisible).length
    const sectionsCompleted = form.sections.filter(
      section => section.isVisible && this.isSectionCompleted(section)
    ).length

    if (totalSections === 0) {
      return { sectionsCompleted: 0, totalSections: 0, percentage: 100, score: 1 }
    }

    const percentage = (sectionsCompleted / totalSections) * 100
    const score = this.calculateStructuralScore(percentage, sectionsCompleted, totalSections)

    return { sectionsCompleted, totalSections, percentage, score }
  }

  /**
   * 檢查區段是否完成
   */
  private isSectionCompleted(section: FormSection): boolean {
    const requiredFields = section.fields.filter(
      f => f.priority === 'required' && f.isVisible && f.isEnabled
    )
    const importantFields = section.fields.filter(
      f => f.priority === 'important' && f.isVisible && f.isEnabled
    )

    // 必填欄位必須全部完成
    const requiredCompleted = requiredFields.every(field => this.isFieldCompleted(field))

    // 重要欄位至少要完成 70%
    const importantCompletionRate =
      importantFields.length > 0
        ? importantFields.filter(field => this.isFieldCompleted(field)).length /
          importantFields.length
        : 1

    return requiredCompleted && importantCompletionRate >= 0.7
  }

  /**
   * 計算結構分數
   */
  private calculateStructuralScore(percentage: number, completed: number, total: number): number {
    let baseScore = percentage / 100

    // 獎勵完成多個區段
    if (completed >= 2) {
      baseScore *= 1.1
    }

    // 懲罰只有少數區段的情況
    if (total >= 3 && completed < 2) {
      baseScore *= 0.8
    }

    return Math.max(0, Math.min(1, baseScore))
  }

  /**
   * 計算加權分數
   */
  private calculateWeightedScore(scores: {
    requiredFields: number
    importantFields: number
    contentQuality: number
    structuralIntegrity: number
    optionalFields: number
  }): number {
    return (
      scores.requiredFields * this.weights.requiredFields +
      scores.importantFields * this.weights.importantFields +
      scores.contentQuality * this.weights.contentQuality +
      scores.structuralIntegrity * this.weights.structuralIntegrity +
      Math.min(scores.optionalFields, 1) * this.weights.optionalFields // 選填欄位加分但不超過滿分
    )
  }

  /**
   * 生成分析洞察
   */
  private generateInsights(
    form: FormStructure,
    analysis: any
  ): {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
    predictedCompletionTime?: number
    riskFactors: string[]
  } {
    const strengths: string[] = []
    const weaknesses: string[] = []
    const suggestions: string[] = []
    const riskFactors: string[] = []

    // 分析優勢
    if (analysis.requiredAnalysis.percentage >= 90) {
      strengths.push('必填欄位完成度極高')
    } else if (analysis.requiredAnalysis.percentage >= 70) {
      strengths.push('必填欄位基本完成')
    }

    if (
      analysis.contentQualityAnalysis.average === 'excellent' ||
      analysis.contentQualityAnalysis.average === 'good'
    ) {
      strengths.push('內容品質良好')
    }

    if (analysis.structuralAnalysis.percentage >= 80) {
      strengths.push('表單結構完整')
    }

    // 分析弱點和建議
    if (analysis.requiredAnalysis.percentage < 70) {
      weaknesses.push(`必填欄位完成度偏低 (${analysis.requiredAnalysis.percentage.toFixed(1)}%)`)
      suggestions.push('請完成所有必填欄位')
    }

    if (
      analysis.contentQualityAnalysis.average === 'minimal' ||
      analysis.contentQualityAnalysis.average === 'empty'
    ) {
      weaknesses.push('內容品質需要改善')
      suggestions.push('請提供更詳細和完整的資訊')
    }

    if (analysis.structuralAnalysis.percentage < 50) {
      weaknesses.push('多個表單區段尚未完成')
      suggestions.push('建議按順序完成各個區段')
    }

    // 風險因素評估
    if (analysis.overallScore < 30) {
      riskFactors.push('表單完成度過低，用戶可能中途放棄')
    }

    if (analysis.requiredAnalysis.total > 0 && analysis.requiredAnalysis.completed === 0) {
      riskFactors.push('尚未開始填寫必填欄位')
    }

    const behaviorPattern = this.analyzeBehaviorPattern(form)
    if (behaviorPattern.pauseFrequency > 2) {
      riskFactors.push('填寫過程中頻繁暫停，可能遇到困難')
    }

    // 預測完成時間
    const predictedCompletionTime = this.predictCompletionTime(
      form,
      behaviorPattern,
      analysis.overallScore
    )

    return {
      strengths,
      weaknesses,
      suggestions,
      predictedCompletionTime,
      riskFactors,
    }
  }

  /**
   * 分析使用者行為模式
   */
  private analyzeBehaviorPattern(form: FormStructure): FormBehaviorPattern {
    const fields = form.sections.flatMap(section => section.fields)

    let totalFocusTime = 0
    let totalChangeCount = 0
    const pauseCount = 0
    let revisionCount = 0

    for (const field of fields) {
      if (field.metadata) {
        totalFocusTime += field.metadata.focusTime || 0
        totalChangeCount += field.metadata.changeCount || 0
        revisionCount += field.metadata.validationAttempts || 0
      }
    }

    const sessionDuration = Date.now() - (form.metadata?.createdAt || Date.now())
    const sessionMinutes = Math.max(1, sessionDuration / (1000 * 60))

    return {
      fillSpeed: totalChangeCount / sessionMinutes,
      pauseFrequency: pauseCount / sessionMinutes,
      revisionRate: revisionCount / Math.max(1, fields.length),
      sectionJumpRate: 0, // 需要更複雜的跳轉追蹤
      validationFailureRate: revisionCount / Math.max(1, totalChangeCount),
      timeDistribution: {}, // 需要更詳細的時間追蹤
    }
  }

  /**
   * 預測完成時間
   */
  private predictCompletionTime(
    form: FormStructure,
    pattern: FormBehaviorPattern,
    currentScore: number
  ): number {
    const remainingFields = form.totalFields - form.completedFields
    const avgTimePerField = pattern.fillSpeed > 0 ? 60 / pattern.fillSpeed : 120 // 預設 2 分鐘/欄位

    let estimatedTime = remainingFields * avgTimePerField

    // 根據當前完成度調整
    if (currentScore < 30) {
      estimatedTime *= 1.5 // 低完成度需要更多時間
    } else if (currentScore > 70) {
      estimatedTime *= 0.8 // 高完成度的用戶填寫較快
    }

    // 根據行為模式調整
    if (pattern.pauseFrequency > 1) {
      estimatedTime *= 1.3 // 頻繁暫停的用戶需要更多時間
    }

    return Math.round(estimatedTime * 1000) // 回傳毫秒
  }

  /**
   * 收集分析元數據
   */
  private collectMetadata(
    form: FormStructure,
    analysisTime: number
  ): {
    analysisTime: number
    fieldCount: number
    sectionCount: number
    totalFocusTime: number
    interactionCount: number
  } {
    const fields = form.sections.flatMap(section => section.fields)

    let totalFocusTime = 0
    let interactionCount = 0

    for (const field of fields) {
      if (field.metadata) {
        totalFocusTime += field.metadata.focusTime || 0
        interactionCount += field.metadata.changeCount || 0
      }
    }

    return {
      analysisTime,
      fieldCount: fields.length,
      sectionCount: form.sections.length,
      totalFocusTime,
      interactionCount,
    }
  }

  /**
   * 工具方法：內容品質轉分數
   */
  private contentQualityToScore(quality: ContentQuality): number {
    const scores = {
      empty: 0,
      minimal: 0.2,
      adequate: 0.5,
      good: 0.8,
      excellent: 1.0,
    }
    return scores[quality]
  }

  /**
   * 工具方法：分數轉內容品質
   */
  private scoreToContentQuality(score: number): ContentQuality {
    if (score >= 0.9) return 'excellent'
    if (score >= 0.7) return 'good'
    if (score >= 0.4) return 'adequate'
    if (score > 0) return 'minimal'
    return 'empty'
  }

  /**
   * 工具方法：驗證 Email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 工具方法：驗證電話
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/
    return phoneRegex.test(phone)
  }

  /**
   * 工具方法：驗證 URL
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 快取相關方法
   */
  private generateCacheKey(form: FormStructure): string {
    const fieldsHash = form.sections
      .flatMap(section => section.fields)
      .map(field => `${field.id}:${field.value}:${field.metadata?.lastModified || 0}`)
      .join('|')

    return `form_${form.id}_${this.simpleHash(fieldsHash)}`
  }

  private getCachedAnalysis(cacheKey: string): CompletenessAnalysis | null {
    const cached = this.analysisCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.stats.performanceMetrics.cacheHitRate++
      return cached.analysis
    }
    return null
  }

  private cacheAnalysis(cacheKey: string, analysis: CompletenessAnalysis): void {
    this.analysisCache.set(cacheKey, {
      analysis,
      timestamp: Date.now(),
    })

    // 清理過期快取
    if (this.analysisCache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of this.analysisCache) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.analysisCache.delete(key)
        }
      }
    }
  }

  /**
   * 簡單雜湊函數
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 轉為 32bit 整數
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 建立後備分析（錯誤時使用）
   */
  private createFallbackAnalysis(form: FormStructure): CompletenessAnalysis {
    const basicScore = form.totalFields > 0 ? form.completedFields / form.totalFields : 0

    return {
      overallScore: basicScore * 100,
      weightedScore: basicScore,
      breakdown: {
        requiredFields: { completed: 0, total: 0, percentage: 0, score: 0 },
        importantFields: { completed: 0, total: 0, percentage: 0, score: 0 },
        optionalFields: { completed: 0, total: 0, percentage: 0, score: 0 },
        contentQuality: { average: 'empty', score: 0, details: {} },
        structuralIntegrity: { sectionsCompleted: 0, totalSections: 0, percentage: 0, score: 0 },
      },
      insights: {
        strengths: [],
        weaknesses: ['分析引擎發生錯誤'],
        suggestions: ['請重新整理頁面後再試'],
        riskFactors: ['系統分析異常'],
      },
      metadata: {
        analysisTime: 0,
        fieldCount: form.totalFields,
        sectionCount: form.sections.length,
        totalFocusTime: 0,
        interactionCount: 0,
      },
    }
  }

  /**
   * 更新統計資料
   */
  private updateStats(analysis: CompletenessAnalysis): void {
    this.stats.totalAnalyses++

    const prevAvg = this.stats.averageCompleteness
    this.stats.averageCompleteness =
      (prevAvg * (this.stats.totalAnalyses - 1) + analysis.overallScore) / this.stats.totalAnalyses

    const prevTimeAvg = this.stats.performanceMetrics.avgAnalysisTime
    this.stats.performanceMetrics.avgAnalysisTime =
      (prevTimeAvg * (this.stats.totalAnalyses - 1) + analysis.metadata.analysisTime) /
      this.stats.totalAnalyses
  }

  /**
   * 取得統計資料
   */
  getStats() {
    return { ...this.stats }
  }

  /**
   * 調整權重
   */
  adjustWeights(newWeights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...newWeights }
    logger.info('表單完成度分析權重已調整', {
      metadata: { newWeights: this.weights },
    })
  }

  /**
   * 重置統計和快取
   */
  reset(): void {
    this.stats = {
      totalAnalyses: 0,
      averageCompleteness: 0,
      commonPatterns: new Map(),
      performanceMetrics: {
        avgAnalysisTime: 0,
        cacheHitRate: 0,
      },
    }
    this.analysisCache.clear()
    logger.info('表單完成度分析器已重置')
  }
}

/**
 * 導出單例實例
 */
export const formCompletenessAnalyzer = FormCompletenessAnalyzer.getInstance()

/**
 * 便捷函數：快速分析表單完成度
 */
export function analyzeFormCompleteness(form: FormStructure): CompletenessAnalysis {
  return formCompletenessAnalyzer.analyzeFormCompleteness(form)
}

/**
 * 便捷函數：計算簡單完成度（用於快速評估）
 */
export function calculateSimpleCompleteness(
  completedFields: number,
  totalFields: number,
  requiredCompleted: number,
  requiredTotal: number
): number {
  if (totalFields === 0) return 100

  const basicRate = (completedFields / totalFields) * 0.7
  const requiredRate = requiredTotal > 0 ? (requiredCompleted / requiredTotal) * 0.3 : 0.3

  return Math.min(100, (basicRate + requiredRate) * 100)
}
