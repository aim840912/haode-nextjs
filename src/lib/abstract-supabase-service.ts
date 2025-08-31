/**
 * Supabase 抽象服務類別
 * 
 * 提供基於 Supabase 的服務實作基礎：
 * - 統一的資料庫操作
 * - 自動錯誤處理和轉換
 * - 內建快取支援
 * - 審計日誌整合
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'
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
import { ErrorFactory, DatabaseError, NotFoundError, ValidationError } from './errors'
import { dbLogger } from './logger'

/**
 * Supabase 查詢建構器類型
 */
type SupabaseQueryBuilder = any // 暫時使用 any 以解決型別問題

/**
 * 資料轉換器介面
 */
export interface DataTransformer<T, DbRecord = any> {
  /** 從資料庫記錄轉換為實體 */
  fromDB(record: DbRecord): T
  /** 從實體轉換為資料庫記錄 */
  toDB(entity: Partial<T>): Partial<DbRecord>
}

/**
 * Supabase 服務配置
 */
export interface SupabaseServiceConfig extends ServiceConfig {
  /** 資料表名稱 */
  tableName: string
  /** 是否使用管理員客戶端 */
  useAdminClient?: boolean
  /** 預設的查詢選項 */
  defaultIncludes?: string[]
  /** 軟刪除欄位名稱 */
  softDeleteField?: string
}

/**
 * 抽象 Supabase 服務基礎類別
 * 
 * 提供標準 CRUD 操作的 Supabase 實作
 * 子類別只需要定義表格名稱和資料轉換邏輯
 */
export abstract class AbstractSupabaseService<T, CreateDTO = any, UpdateDTO = any> 
  implements BaseService<T, CreateDTO, UpdateDTO>, PaginatedService<T> {
  
  protected readonly client: SupabaseClient
  protected readonly adminClient: SupabaseClient | null
  protected readonly config: SupabaseServiceConfig
  protected readonly metadata: ServiceMetadata
  protected readonly transformer?: DataTransformer<T>

  constructor(config: SupabaseServiceConfig, transformer?: DataTransformer<T>) {
    this.config = {
      enableCache: false,
      cacheTTL: 300, // 5分鐘
      enableAuditLog: true,
      defaultPageSize: 20,
      maxPageSize: 100,
      useAdminClient: false,
      defaultIncludes: [],
      ...config
    }

    this.client = supabase
    this.adminClient = supabaseAdmin
    this.transformer = transformer
    
    this.metadata = {
      name: `${config.tableName}Service`,
      version: '1.0.0',
      description: `Supabase service for ${config.tableName}`,
      features: ['crud', 'pagination', 'caching']
    }
  }

  /**
   * 取得適當的 Supabase 客戶端
   */
  protected getClient(useAdmin: boolean = this.config.useAdminClient!): SupabaseClient {
    if (useAdmin && this.adminClient) {
      return this.adminClient
    }
    return this.client
  }

  /**
   * 建立查詢建構器
   */
  protected createQuery(useAdmin: boolean = false): SupabaseQueryBuilder {
    const client = this.getClient(useAdmin)
    return client.from(this.config.tableName)
  }

  /**
   * 套用查詢選項到查詢建構器
   */
  protected applyQueryOptions(query: SupabaseQueryBuilder, options?: QueryOptions): SupabaseQueryBuilder {
    const normalizedOptions = normalizeQueryOptions(options)
    
    // 套用過濾條件
    if (Object.keys(normalizedOptions.filters).length > 0) {
      Object.entries(normalizedOptions.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    // 套用排序
    query = query.order(normalizedOptions.sortBy, { 
      ascending: normalizedOptions.sortOrder === 'asc' 
    })

    // 套用軟刪除過濾
    if (this.config.softDeleteField) {
      query = query.is(this.config.softDeleteField, null)
    }

    return query
  }

  /**
   * 處理 Supabase 錯誤
   */
  protected handleError(error: any, operation: string, context?: any): never {
    dbLogger.error(`Supabase ${operation} 操作失敗`, error as Error, {
      module: this.metadata.name,
      action: operation,
      metadata: context
    })

    throw ErrorFactory.fromSupabaseError(error, {
      module: this.metadata.name,
      action: operation,
      ...context
    })
  }

  /**
   * 轉換資料庫記錄為實體
   */
  protected transformFromDB(record: any): T {
    if (this.transformer) {
      return this.transformer.fromDB(record)
    }
    return record as T
  }

  /**
   * 轉換實體為資料庫記錄
   */
  protected transformToDB(entity: Partial<T>): any {
    if (this.transformer) {
      return this.transformer.toDB(entity)
    }
    return entity
  }

  /**
   * 實作 BaseService.findAll
   */
  async findAll(options?: QueryOptions): Promise<T[]> {
    try {
      let query = this.createQuery()
      query = this.applyQueryOptions(query, options)
      
      const { data, error } = await query.select('*')
      
      if (error) {
        this.handleError(error, 'findAll', { options })
      }

      const result = (data || []).map((record: Record<string, unknown>) => this.transformFromDB(record))
      
      dbLogger.info(`取得 ${this.config.tableName} 列表成功`, {
        module: this.metadata.name,
        action: 'findAll',
        metadata: { count: result.length, options }
      })

      return result
    } catch (error) {
      this.handleError(error, 'findAll', { options })
    }
  }

  /**
   * 實作 BaseService.findById
   */
  async findById(id: string): Promise<T | null> {
    try {
      let query = this.createQuery()
      
      // 套用軟刪除過濾
      if (this.config.softDeleteField) {
        query = (query as any).is(this.config.softDeleteField, null)
      }

      const { data, error } = await query
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // 找不到記錄
          return null
        }
        this.handleError(error, 'findById', { id })
      }

      const result = data ? this.transformFromDB(data) : null
      
      dbLogger.debug(`取得 ${this.config.tableName} 詳情`, {
        module: this.metadata.name,
        action: 'findById',
        metadata: { id, found: !!result }
      })

      return result
    } catch (error) {
      this.handleError(error, 'findById', { id })
    }
  }

  /**
   * 實作 BaseService.create
   */
  async create(data: CreateDTO): Promise<T> {
    try {
      const dbData = this.transformToDB(data as any)
      const client = this.getClient(true) // 使用管理員權限
      
      const { data: result, error } = await client
        .from(this.config.tableName)
        .insert([dbData])
        .select()
        .single()
      
      if (error) {
        this.handleError(error, 'create', { data: dbData })
      }

      const entity = this.transformFromDB(result)
      
      dbLogger.info(`建立 ${this.config.tableName} 成功`, {
        module: this.metadata.name,
        action: 'create',
        metadata: { id: result.id }
      })

      return entity
    } catch (error) {
      this.handleError(error, 'create', { data })
    }
  }

  /**
   * 實作 BaseService.update
   */
  async update(id: string, data: UpdateDTO): Promise<T> {
    try {
      const dbData = this.transformToDB(data as any)
      const client = this.getClient(true) // 使用管理員權限
      
      let query = client.from(this.config.tableName)
      
      // 套用軟刪除過濾
      if (this.config.softDeleteField) {
        query = (query as any).is(this.config.softDeleteField, null)
      }

      const { data: result, error } = await query
        .update(dbData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        this.handleError(error, 'update', { id, data: dbData })
      }

      if (!result) {
        throw new NotFoundError(`${this.config.tableName} not found`, {
          module: this.metadata.name,
          action: 'update',
          context: { id }
        })
      }

      const entity = this.transformFromDB(result)
      
      dbLogger.info(`更新 ${this.config.tableName} 成功`, {
        module: this.metadata.name,
        action: 'update',
        metadata: { id }
      })

      return entity
    } catch (error) {
      this.handleError(error, 'update', { id, data })
    }
  }

  /**
   * 實作 BaseService.delete
   */
  async delete(id: string): Promise<void> {
    try {
      const client = this.getClient(true) // 使用管理員權限
      
      let query = client.from(this.config.tableName)
      
      if (this.config.softDeleteField) {
        // 軟刪除
        const { error } = await query
          .update({ [this.config.softDeleteField]: new Date().toISOString() })
          .eq('id', id)
          .is(this.config.softDeleteField, null)
        
        if (error) {
          this.handleError(error, 'delete', { id })
        }
      } else {
        // 硬刪除
        const { error } = await query
          .delete()
          .eq('id', id)
        
        if (error) {
          this.handleError(error, 'delete', { id })
        }
      }
      
      dbLogger.info(`刪除 ${this.config.tableName} 成功`, {
        module: this.metadata.name,
        action: 'delete',
        metadata: { id, softDelete: !!this.config.softDeleteField }
      })

    } catch (error) {
      this.handleError(error, 'delete', { id })
    }
  }

  /**
   * 實作 BaseService.exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      let query = this.createQuery()
      
      // 套用軟刪除過濾
      if (this.config.softDeleteField) {
        query = (query as any).is(this.config.softDeleteField, null)
      }

      const { data, error } = await query
        .select('id')
        .eq('id', id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        this.handleError(error, 'exists', { id })
      }

      return !!data
    } catch (error) {
      this.handleError(error, 'exists', { id })
    }
  }

  /**
   * 實作 PaginatedService.findAllPaginated
   */
  async findAllPaginated(options?: PaginatedQueryOptions): Promise<PaginatedResult<T>> {
    try {
      const normalizedOptions = normalizePaginatedQueryOptions(options)
      
      // 取得總數
      let countQuery = this.createQuery()
      countQuery = this.applyQueryOptions(countQuery, normalizedOptions)
      
      const { count, error: countError } = await countQuery
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        this.handleError(countError, 'findAllPaginated:count', { options })
      }

      // 取得分頁資料
      let dataQuery = this.createQuery()
      dataQuery = this.applyQueryOptions(dataQuery, normalizedOptions)
      
      const offset = (normalizedOptions.page - 1) * normalizedOptions.limit
      const { data, error: dataError } = await dataQuery
        .select('*')
        .range(offset, offset + normalizedOptions.limit - 1)
      
      if (dataError) {
        this.handleError(dataError, 'findAllPaginated:data', { options })
      }

      const items = (data || []).map((record: Record<string, unknown>) => this.transformFromDB(record))
      const result = createPaginatedResult(
        items,
        count || 0,
        normalizedOptions.page,
        normalizedOptions.limit
      )
      
      dbLogger.info(`分頁查詢 ${this.config.tableName} 成功`, {
        module: this.metadata.name,
        action: 'findAllPaginated',
        metadata: { 
          page: normalizedOptions.page, 
          limit: normalizedOptions.limit,
          total: count,
          itemCount: items.length
        }
      })

      return result as PaginatedResult<T>
    } catch (error) {
      this.handleError(error, 'findAllPaginated', { options })
    }
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
      // 簡單的連線測試
      const { error } = await this.createQuery()
        .select('id')
        .limit(1)
        .single()
      
      const isHealthy = !error || error.code === 'PGRST116' // 表格可能為空
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        details: {
          tableName: this.config.tableName,
          clientType: this.config.useAdminClient ? 'admin' : 'standard',
          cacheEnabled: this.config.enableCache,
          error: error?.message
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          tableName: this.config.tableName,
          error: (error as Error).message
        }
      }
    }
  }
}