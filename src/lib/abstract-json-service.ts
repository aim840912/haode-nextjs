/**
 * JSON 檔案抽象服務類別
 * 
 * 提供基於 JSON 檔案的服務實作基礎：
 * - 檔案系統 CRUD 操作
 * - 記憶體快取支援
 * - 原子性寫入操作
 * - 資料驗證和備份
 */

import { promises as fs } from 'fs'
import path from 'path'
import { 
  BaseService, 
  PaginatedService,
  SearchableService,
  PaginatedResult,
  QueryOptions,
  PaginatedQueryOptions,
  ServiceConfig,
  ServiceMetadata,
  createPaginatedResult,
  normalizeQueryOptions,
  normalizePaginatedQueryOptions
} from './base-service'
import { NotFoundError, ValidationError, InternalServerError } from './errors'
import { logger } from './logger'

/**
 * JSON 實體介面（所有 JSON 實體必須有的欄位）
 */
export interface JsonEntity {
  id: string
  createdAt: string
  updatedAt: string
}

/**
 * JSON 服務配置
 */
export interface JsonServiceConfig extends ServiceConfig {
  /** JSON 檔案路徑 */
  filePath: string
  /** 是否啟用自動備份 */
  enableBackup?: boolean
  /** 備份檔案數量限制 */
  maxBackupFiles?: number
  /** 是否使用記憶體快取 */
  useMemoryCache?: boolean
  /** JSON 檔案編碼 */
  encoding?: BufferEncoding
}

/**
 * 搜尋配置
 */
export interface SearchConfig {
  /** 可搜尋的欄位 */
  searchableFields: string[]
  /** 是否區分大小寫 */
  caseSensitive?: boolean
  /** 是否精確匹配 */
  exactMatch?: boolean
}

/**
 * 抽象 JSON 檔案服務基礎類別
 * 
 * 提供基於 JSON 檔案的 CRUD 操作實作
 * 支援記憶體快取、備份和搜尋功能
 */
export abstract class AbstractJsonService<T extends JsonEntity, CreateDTO = any, UpdateDTO = any> 
  implements BaseService<T, CreateDTO, UpdateDTO>, PaginatedService<T>, SearchableService<T> {
  
  protected readonly config: JsonServiceConfig
  protected readonly metadata: ServiceMetadata
  protected readonly searchConfig?: SearchConfig
  
  // 記憶體快取
  private memoryCache: T[] | null = null
  private cacheTimestamp: number = 0
  private isWriting: boolean = false

  constructor(
    config: JsonServiceConfig, 
    searchConfig?: SearchConfig
  ) {
    this.config = {
      enableCache: true,
      cacheTTL: 300, // 5分鐘
      enableAuditLog: false, // JSON 服務預設不啟用審計日誌
      defaultPageSize: 20,
      maxPageSize: 100,
      enableBackup: true,
      maxBackupFiles: 5,
      useMemoryCache: true,
      encoding: 'utf-8',
      ...config
    }

    this.searchConfig = searchConfig
    
    this.metadata = {
      name: `${path.basename(config.filePath, '.json')}Service`,
      version: '1.0.0',
      description: `JSON file service for ${config.filePath}`,
      features: ['crud', 'pagination', 'search', 'caching', 'backup']
    }
  }

  /**
   * 生成新的 ID
   */
  protected generateId(): string {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 生成時間戳
   */
  protected generateTimestamp(): string {
    return new Date().toISOString()
  }

  /**
   * 驗證實體資料（子類別可以覆寫）
   */
  protected validateEntity(data: any): void {
    // 基礎驗證 - 子類別可以擴展
    if (!data) {
      throw new ValidationError('資料不能為空')
    }
  }

  /**
   * 轉換建立 DTO 為實體
   */
  protected transformCreateDTO(data: CreateDTO): T {
    const now = this.generateTimestamp()
    return {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    } as unknown as T
  }

  /**
   * 轉換更新 DTO 為實體變更
   */
  protected transformUpdateDTO(data: UpdateDTO): Partial<T> {
    return {
      ...data,
      updatedAt: this.generateTimestamp()
    } as Partial<T>
  }

  /**
   * 確保檔案目錄存在
   */
  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.config.filePath)
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
    }
  }

  /**
   * 讀取 JSON 檔案
   */
  private async readJsonFile(): Promise<T[]> {
    try {
      await this.ensureDirectoryExists()
      const data = await fs.readFile(this.config.filePath, this.config.encoding!)
      return JSON.parse(data)
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        // 檔案不存在，建立空陣列
        await this.writeJsonFile([])
        return []
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new InternalServerError(`讀取 JSON 檔案失敗: ${message}`, {
        module: this.metadata.name,
        action: 'readJsonFile',
        originalError: error instanceof Error ? error : undefined
      })
    }
  }

  /**
   * 寫入 JSON 檔案（原子性操作）
   */
  private async writeJsonFile(data: T[]): Promise<void> {
    if (this.isWriting) {
      // 防止並發寫入
      await new Promise(resolve => setTimeout(resolve, 10))
      return this.writeJsonFile(data)
    }

    try {
      this.isWriting = true
      await this.ensureDirectoryExists()

      // 建立備份
      if (this.config.enableBackup) {
        await this.createBackup()
      }

      // 原子性寫入（先寫臨時檔，再重命名）
      const tempFile = this.config.filePath + '.tmp'
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), this.config.encoding!)
      await fs.rename(tempFile, this.config.filePath)

      // 更新記憶體快取
      if (this.config.useMemoryCache) {
        this.memoryCache = [...data] // 建立副本
        this.cacheTimestamp = Date.now()
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new InternalServerError(`寫入 JSON 檔案失敗: ${message}`, {
        module: this.metadata.name,
        action: 'writeJsonFile',
        originalError: error instanceof Error ? error : undefined
      })
    } finally {
      this.isWriting = false
    }
  }

  /**
   * 建立檔案備份
   */
  private async createBackup(): Promise<void> {
    try {
      const backupPath = this.config.filePath + '.backup.' + Date.now()
      await fs.copyFile(this.config.filePath, backupPath)

      // 清理舊備份
      await this.cleanupOldBackups()
    } catch (error) {
      // 備份失敗不影響主要操作，只記錄日誌
      logger.warn('建立備份失敗', {
        module: this.metadata.name,
        metadata: { error: (error as Error).message }
      })
    }
  }

  /**
   * 清理舊備份檔案
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const dir = path.dirname(this.config.filePath)
      const baseName = path.basename(this.config.filePath)
      const files = await fs.readdir(dir)
      
      const backupFiles = files
        .filter(file => file.startsWith(baseName + '.backup.'))
        .map(file => ({
          file,
          timestamp: parseInt(file.split('.backup.')[1]) || 0
        }))
        .sort((a, b) => b.timestamp - a.timestamp)

      // 保留最新的 N 個備份
      const filesToDelete = backupFiles.slice(this.config.maxBackupFiles!)
      
      await Promise.all(
        filesToDelete.map(({ file }) => 
          fs.unlink(path.join(dir, file)).catch(() => {})
        )
      )
    } catch (error) {
      // 清理失敗不影響主要操作
      logger.warn('清理舊備份失敗', {
        module: this.metadata.name,
        metadata: { error: (error as Error).message }
      })
    }
  }

  /**
   * 取得資料（含快取邏輯）
   */
  private async getData(): Promise<T[]> {
    // 檢查記憶體快取
    if (this.config.useMemoryCache && this.memoryCache && 
        Date.now() - this.cacheTimestamp < (this.config.cacheTTL! * 1000)) {
      return [...this.memoryCache] // 返回副本
    }

    // 從檔案讀取
    const data = await this.readJsonFile()
    
    // 更新記憶體快取
    if (this.config.useMemoryCache) {
      this.memoryCache = [...data]
      this.cacheTimestamp = Date.now()
    }

    return data
  }

  /**
   * 套用查詢選項到資料
   */
  private applyQueryOptions(data: T[], options?: QueryOptions): T[] {
    let result = [...data]
    const normalizedOptions = normalizeQueryOptions(options)

    // 套用過濾條件
    if (Object.keys(normalizedOptions.filters).length > 0) {
      result = result.filter(item => {
        return Object.entries(normalizedOptions.filters).every(([key, value]) => {
          if (value === undefined || value === null) return true
          return (item as any)[key] === value
        })
      })
    }

    // 套用排序
    result.sort((a, b) => {
      const aValue = (a as any)[normalizedOptions.sortBy]
      const bValue = (b as any)[normalizedOptions.sortBy]
      
      if (normalizedOptions.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return result
  }

  /**
   * 實作 BaseService.findAll
   */
  async findAll(options?: QueryOptions): Promise<T[]> {
    try {
      const data = await this.getData()
      const result = this.applyQueryOptions(data, options)
      
      logger.debug(`取得 ${this.metadata.name} 列表成功`, {
        module: this.metadata.name,
        action: 'findAll',
        metadata: { count: result.length, fromCache: !!this.memoryCache }
      })

      return result
    } catch (error) {
      logger.error(`取得 ${this.metadata.name} 列表失敗`, error as Error, {
        module: this.metadata.name,
        action: 'findAll'
      })
      throw error
    }
  }

  /**
   * 實作 BaseService.findById
   */
  async findById(id: string): Promise<T | null> {
    try {
      const data = await this.getData()
      const result = data.find(item => item.id === id) || null
      
      logger.debug(`取得 ${this.metadata.name} 詳情`, {
        module: this.metadata.name,
        action: 'findById',
        metadata: { id, found: !!result }
      })

      return result
    } catch (error) {
      logger.error(`取得 ${this.metadata.name} 詳情失敗`, error as Error, {
        module: this.metadata.name,
        action: 'findById'
      })
      throw error
    }
  }

  /**
   * 實作 BaseService.create
   */
  async create(data: CreateDTO): Promise<T> {
    try {
      this.validateEntity(data)
      
      const items = await this.getData()
      const newItem = this.transformCreateDTO(data)
      
      items.push(newItem)
      await this.writeJsonFile(items)
      
      logger.info(`建立 ${this.metadata.name} 成功`, {
        module: this.metadata.name,
        action: 'create',
        metadata: { id: newItem.id }
      })

      return newItem
    } catch (error) {
      logger.error(`建立 ${this.metadata.name} 失敗`, error as Error, {
        module: this.metadata.name,
        action: 'create'
      })
      throw error
    }
  }

  /**
   * 實作 BaseService.update
   */
  async update(id: string, data: UpdateDTO): Promise<T> {
    try {
      this.validateEntity(data)
      
      const items = await this.getData()
      const index = items.findIndex(item => item.id === id)
      
      if (index === -1) {
        throw new NotFoundError(`${this.metadata.name} not found`, {
          module: this.metadata.name,
          action: 'update',
          context: { id }
        })
      }

      const updateData = this.transformUpdateDTO(data)
      const updatedItem = { ...items[index], ...updateData } as T
      
      items[index] = updatedItem
      await this.writeJsonFile(items)
      
      logger.info(`更新 ${this.metadata.name} 成功`, {
        module: this.metadata.name,
        action: 'update',
        metadata: { id }
      })

      return updatedItem
    } catch (error) {
      logger.error(`更新 ${this.metadata.name} 失敗`, error as Error, {
        module: this.metadata.name,
        action: 'update'
      })
      throw error
    }
  }

  /**
   * 實作 BaseService.delete
   */
  async delete(id: string): Promise<void> {
    try {
      const items = await this.getData()
      const index = items.findIndex(item => item.id === id)
      
      if (index === -1) {
        throw new NotFoundError(`${this.metadata.name} not found`, {
          module: this.metadata.name,
          action: 'delete',
          context: { id }
        })
      }

      items.splice(index, 1)
      await this.writeJsonFile(items)
      
      logger.info(`刪除 ${this.metadata.name} 成功`, {
        module: this.metadata.name,
        action: 'delete',
        metadata: { id }
      })
    } catch (error) {
      logger.error(`刪除 ${this.metadata.name} 失敗`, error as Error, {
        module: this.metadata.name,
        action: 'delete'
      })
      throw error
    }
  }

  /**
   * 實作 BaseService.exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const data = await this.getData()
      return data.some(item => item.id === id)
    } catch (error) {
      logger.error(`檢查 ${this.metadata.name} 存在性失敗`, error as Error, {
        module: this.metadata.name,
        action: 'exists'
      })
      throw error
    }
  }

  /**
   * 實作 PaginatedService.findAllPaginated
   */
  async findAllPaginated(options?: PaginatedQueryOptions): Promise<PaginatedResult<T>> {
    try {
      const normalizedOptions = normalizePaginatedQueryOptions(options)
      const allData = await this.getData()
      const filteredData = this.applyQueryOptions(allData, normalizedOptions)
      
      const offset = (normalizedOptions.page - 1) * normalizedOptions.limit
      const items = filteredData.slice(offset, offset + normalizedOptions.limit)
      
      const result = createPaginatedResult(
        items,
        filteredData.length,
        normalizedOptions.page,
        normalizedOptions.limit
      )
      
      logger.info(`分頁查詢 ${this.metadata.name} 成功`, {
        module: this.metadata.name,
        action: 'findAllPaginated',
        metadata: { 
          page: normalizedOptions.page, 
          limit: normalizedOptions.limit,
          total: filteredData.length,
          itemCount: items.length
        }
      })

      return result
    } catch (error) {
      logger.error(`分頁查詢 ${this.metadata.name} 失敗`, error as Error, {
        module: this.metadata.name,
        action: 'findAllPaginated'
      })
      throw error
    }
  }

  /**
   * 實作 SearchableService.search
   */
  async search(query: string, options?: QueryOptions): Promise<T[]> {
    if (!this.searchConfig) {
      throw new Error('Search not configured for this service')
    }

    try {
      const data = await this.getData()
      const searchTerm = this.searchConfig.caseSensitive ? query : query.toLowerCase()
      
      const filteredData = data.filter(item => {
        return this.searchConfig!.searchableFields.some(field => {
          const fieldValue = (item as any)[field]
          if (!fieldValue) return false
          
          const stringValue = this.searchConfig!.caseSensitive 
            ? String(fieldValue) 
            : String(fieldValue).toLowerCase()
          
          return this.searchConfig!.exactMatch 
            ? stringValue === searchTerm
            : stringValue.includes(searchTerm)
        })
      })

      const result = this.applyQueryOptions(filteredData, options)
      
      logger.info(`搜尋 ${this.metadata.name} 成功`, {
        module: this.metadata.name,
        action: 'search',
        metadata: { query, resultCount: result.length }
      })

      return result
    } catch (error) {
      logger.error(`搜尋 ${this.metadata.name} 失敗`, error as Error, {
        module: this.metadata.name,
        action: 'search'
      })
      throw error
    }
  }

  /**
   * 清除記憶體快取
   */
  async clearCache(): Promise<void> {
    this.memoryCache = null
    this.cacheTimestamp = 0
    
    logger.info(`清除 ${this.metadata.name} 快取成功`, {
      module: this.metadata.name,
      action: 'clearCache'
    })
  }

  /**
   * 取得服務健康狀態
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    details?: Record<string, any>
  }> {
    try {
      // 檢查檔案是否可讀取
      await fs.access(this.config.filePath)
      const stats = await fs.stat(this.config.filePath)
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          filePath: this.config.filePath,
          fileSize: stats.size,
          lastModified: stats.mtime.toISOString(),
          cacheEnabled: this.config.useMemoryCache,
          cached: !!this.memoryCache
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          filePath: this.config.filePath,
          error: (error as Error).message
        }
      }
    }
  }
}