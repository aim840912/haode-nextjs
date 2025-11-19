/**
 * 網站設定服務
 * 用於管理網站動態設定（首頁、農場體驗頁等圖片和文字內容）
 *
 * 重構後:
 * - 使用 withServiceOperation 統一錯誤處理
 * - 移除重複的 try-catch、timer、logger 邏輯
 * - 減少程式碼行數約 40%
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'
import { ServiceSupabaseClient } from '@/types/service.types'
import type {
  SiteSetting,
  SiteSettingInput,
  SiteSettingUpdate,
  SettingKey,
} from '@/types/siteSettings'
import { withServiceOperation } from '../utils/ServiceDecorators'

export class SiteSettingsService {
  private readonly moduleName = 'SiteSettingsService'

  private getSupabaseClient(): ServiceSupabaseClient {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new DatabaseError('Supabase admin client not initialized')
    }
    return client
  }

  /**
   * 取得所有設定
   */
  async getAll(): Promise<SiteSetting[]> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '取得所有網站設定',
      },
      async () => {
        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase
          .from('site_settings' as any)
          .select('*')
          .order('key', { ascending: true })

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return (data || []) as unknown as SiteSetting[]
      }
    )
  }

  /**
   * 根據 key 取得單一設定
   */
  async getByKey(key: SettingKey | string): Promise<SiteSetting | null> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '根據 key 取得網站設定',
        context: { key },
      },
      async () => {
        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase
          .from('site_settings' as any)
          .select('*')
          .eq('key', key)
          .single()

        if (error) {
          // PGRST116 = 找不到資料,返回 null 而非拋出錯誤
          if (error.code === 'PGRST116') {
            return null
          }
          throw ErrorFactory.fromSupabaseError(error)
        }

        return data as unknown as SiteSetting | null
      }
    )
  }

  /**
   * 批次取得多個設定
   */
  async getByKeys(keys: (SettingKey | string)[]): Promise<Record<string, SiteSetting>> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '批次取得網站設定',
        context: { keysCount: keys.length },
      },
      async () => {
        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase
          .from('site_settings' as any)
          .select('*')
          .in('key', keys)

        if (error) throw ErrorFactory.fromSupabaseError(error)

        const result: Record<string, SiteSetting> = {}
        ;(data as unknown as SiteSetting[])?.forEach(setting => {
          result[setting.key] = setting
        })

        return result
      }
    )
  }

  /**
   * 建立新設定
   */
  async create(input: SiteSettingInput): Promise<SiteSetting> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '建立網站設定',
        context: { key: input.key, type: input.type },
      },
      async () => {
        if (!input.key?.trim()) {
          throw new ValidationError('設定鍵不能為空')
        }

        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase
          .from('site_settings' as any)
          .insert([
            {
              key: input.key,
              value: input.value,
              type: input.type,
              description: input.description || null,
            },
          ])
          .select()
          .single()

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return data as unknown as SiteSetting
      }
    )
  }

  /**
   * 更新設定
   */
  async update(key: SettingKey | string, input: SiteSettingUpdate): Promise<SiteSetting> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '更新網站設定',
        context: { key },
      },
      async () => {
        const existing = await this.getByKey(key)
        if (!existing) {
          throw new NotFoundError(`找不到設定鍵: ${key}`)
        }

        const supabase = this.getSupabaseClient()

        const { data, error } = await supabase
          .from('site_settings' as any)
          .update({
            value: input.value,
            description: input.description !== undefined ? input.description : existing.description,
            updated_at: new Date().toISOString(),
          })
          .eq('key', key)
          .select()
          .single()

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return data as unknown as SiteSetting
      }
    )
  }

  /**
   * Upsert 設定（存在則更新，不存在則創建）
   */
  async upsert(
    key: SettingKey | string,
    input: SiteSettingUpdate & { type?: string }
  ): Promise<SiteSetting> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: 'Upsert 網站設定',
        context: { key },
      },
      async () => {
        const existing = await this.getByKey(key)

        if (existing) {
          // 設定存在，執行更新
          return await this.update(key, input)
        } else {
          // 設定不存在，執行創建
          const createInput: SiteSettingInput = {
            key,
            value: input.value,
            type: input.type || 'string',
            description: input.description,
          }
          return await this.create(createInput)
        }
      }
    )
  }

  /**
   * 刪除設定
   */
  async delete(key: SettingKey | string): Promise<boolean> {
    return withServiceOperation(
      {
        module: this.moduleName,
        action: '刪除網站設定',
        context: { key },
      },
      async () => {
        const existing = await this.getByKey(key)
        if (!existing) {
          throw new NotFoundError(`找不到設定鍵: ${key}`)
        }

        const supabase = this.getSupabaseClient()

        const { error } = await supabase
          .from('site_settings' as any)
          .delete()
          .eq('key', key)

        if (error) throw ErrorFactory.fromSupabaseError(error)

        return true
      }
    )
  }
}

export const siteSettingsService = new SiteSettingsService()
