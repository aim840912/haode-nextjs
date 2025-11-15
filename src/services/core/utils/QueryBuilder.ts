/**
 * 查詢建構器工具
 * 提供統一的分頁查詢邏輯
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory } from '@/lib/errors'

const getAdmin = () => {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase admin client not initialized')
  }
  return client
}

/**
 * 分頁查詢配置
 */
interface PaginationConfig {
  tableName: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit: number
  offset: number
}

/**
 * 分頁查詢結果
 */
interface PaginationResult<T> {
  data: T[]
  total: number
}

/**
 * 執行分頁查詢
 *
 * @example
 * ```typescript
 * const result = await QueryBuilder.paginate<OrderRecord>({
 *   tableName: 'orders',
 *   filters: { user_id: userId },
 *   orderBy: { column: 'created_at', ascending: false },
 *   limit: 20,
 *   offset: 0
 * })
 * ```
 */
export class QueryBuilder {
  /**
   * 執行分頁查詢
   */
  static async paginate<T>(config: PaginationConfig): Promise<PaginationResult<T>> {
    const { tableName, filters = {}, orderBy, limit, offset } = config
    const client = getAdmin()

    try {
      // 建立基礎查詢 (使用 as any 繞過 Supabase 類型限制)
      let countQuery = (client.from as any)(tableName).select('*', {
        count: 'exact',
        head: true,
      })
      let dataQuery = (client.from as any)(tableName).select('*')

      // 應用篩選條件
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          countQuery = countQuery.eq(key, value)
          dataQuery = dataQuery.eq(key, value)
        }
      }

      // 取得總數
      const { count, error: countError } = await countQuery

      if (countError) {
        throw ErrorFactory.fromSupabaseError(countError, {
          module: 'QueryBuilder',
          action: 'paginate:count',
          context: { tableName, filters },
        })
      }

      // 應用排序
      if (orderBy) {
        dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending ?? false })
      }

      // 應用分頁
      dataQuery = dataQuery.range(offset, offset + limit - 1)

      // 取得資料
      const { data, error: dataError } = await dataQuery

      if (dataError) {
        throw ErrorFactory.fromSupabaseError(dataError, {
          module: 'QueryBuilder',
          action: 'paginate:data',
          context: { tableName, filters, limit, offset },
        })
      }

      return {
        data: (data || []) as T[],
        total: count || 0,
      }
    } catch (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'QueryBuilder',
        action: 'paginate',
        context: { tableName, filters, limit, offset },
      })
    }
  }

  /**
   * 取得單筆資料
   */
  static async findOne<T>(tableName: string, filters: Record<string, any>): Promise<T | null> {
    const client = getAdmin()

    try {
      let query = (client.from as any)(tableName).select('*')

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'QueryBuilder',
          action: 'findOne',
          context: { tableName, filters },
        })
      }

      return data as T
    } catch (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'QueryBuilder',
        action: 'findOne',
        context: { tableName, filters },
      })
    }
  }
}
