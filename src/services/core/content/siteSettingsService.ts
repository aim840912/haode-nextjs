/**
 * 網站設定服務
 * 用於管理網站動態設定（首頁、農場體驗頁等圖片和文字內容）
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import { ErrorFactory, NotFoundError, ValidationError } from '@/lib/errors'
import type {
  SiteSetting,
  SiteSettingInput,
  SiteSettingUpdate,
  SettingKey,
} from '@/types/siteSettings'

export class SiteSettingsService {
  private readonly moduleName = 'SiteSettingsService'

  private getSupabaseClient() {
    return getSupabaseAdmin()
  }

  /**
   * 取得所有設定
   */
  async getAll(): Promise<SiteSetting[]> {
    const timer = dbLogger.timer('查詢所有網站設定')

    try {
      dbLogger.info('取得所有網站設定', {
        module: this.moduleName,
        action: 'getAll',
      })

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('*')
        .order('key', { ascending: true })

      if (error) throw error

      timer.end({ metadata: { count: data?.length || 0 } })

      return (data || []) as SiteSetting[]
    } catch (error) {
      timer.end()
      dbLogger.error('取得網站設定失敗', error as Error, {
        module: this.moduleName,
        action: 'getAll',
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: 'getAll',
      })
    }
  }

  /**
   * 根據 key 取得單一設定
   */
  async getByKey(key: SettingKey | string): Promise<SiteSetting | null> {
    const timer = dbLogger.timer('查詢單一網站設定')

    try {
      dbLogger.info('根據 key 取得網站設定', {
        module: this.moduleName,
        action: 'getByKey',
        metadata: { key },
      })

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('*')
        .eq('key', key)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          timer.end({ metadata: { found: false } })
          return null
        }
        throw error
      }

      timer.end({ metadata: { found: true } })
      return data as SiteSetting | null
    } catch (error) {
      timer.end()
      dbLogger.error('取得網站設定失敗', error as Error, {
        module: this.moduleName,
        action: 'getByKey',
        metadata: { key },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: 'getByKey',
      })
    }
  }

  /**
   * 批次取得多個設定
   */
  async getByKeys(keys: (SettingKey | string)[]): Promise<Record<string, SiteSetting>> {
    const timer = dbLogger.timer('批次查詢網站設定')

    try {
      dbLogger.info('批次取得網站設定', {
        module: this.moduleName,
        action: 'getByKeys',
        metadata: { keysCount: keys.length },
      })

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('*')
        .in('key', keys)

      if (error) throw error

      const result: Record<string, SiteSetting> = {}
      ;(data as SiteSetting[])?.forEach(setting => {
        result[setting.key] = setting
      })

      timer.end({ metadata: { requestedKeys: keys.length, foundKeys: data?.length || 0 } })
      return result
    } catch (error) {
      timer.end()
      dbLogger.error('批次取得網站設定失敗', error as Error, {
        module: this.moduleName,
        action: 'getByKeys',
        metadata: { keysCount: keys.length },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: 'getByKeys',
      })
    }
  }

  /**
   * 建立新設定
   */
  async create(input: SiteSettingInput): Promise<SiteSetting> {
    const timer = dbLogger.timer('建立網站設定')

    try {
      if (!input.key?.trim()) {
        throw new ValidationError('設定鍵不能為空')
      }

      dbLogger.info('建立新的網站設定', {
        module: this.moduleName,
        action: 'create',
        metadata: { key: input.key, type: input.type },
      })

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

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

      if (error) throw error

      const setting = data as SiteSetting

      timer.end({ metadata: { key: setting.key } })

      dbLogger.info('網站設定建立成功', {
        module: this.moduleName,
        action: 'create',
        metadata: { key: setting.key },
      })

      return setting
    } catch (error) {
      timer.end()
      dbLogger.error('建立網站設定失敗', error as Error, {
        module: this.moduleName,
        action: 'create',
        metadata: { key: input.key },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: 'create',
      })
    }
  }

  /**
   * 更新設定
   */
  async update(key: SettingKey | string, input: SiteSettingUpdate): Promise<SiteSetting> {
    const timer = dbLogger.timer('更新網站設定')

    try {
      dbLogger.info('更新網站設定', {
        module: this.moduleName,
        action: 'update',
        metadata: { key },
      })

      const existing = await this.getByKey(key)
      if (!existing) {
        throw new NotFoundError(`找不到設定鍵: ${key}`)
      }

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

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

      if (error) throw error

      const updatedSetting = data as SiteSetting

      timer.end({ metadata: { key: updatedSetting.key } })

      dbLogger.info('網站設定更新成功', {
        module: this.moduleName,
        action: 'update',
        metadata: { key: updatedSetting.key },
      })

      return updatedSetting
    } catch (error) {
      timer.end()
      dbLogger.error('更新網站設定失敗', error as Error, {
        module: this.moduleName,
        action: 'update',
        metadata: { key },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: 'update',
      })
    }
  }

  /**
   * 刪除設定
   */
  async delete(key: SettingKey | string): Promise<boolean> {
    const timer = dbLogger.timer('刪除網站設定')

    try {
      dbLogger.info('刪除網站設定', {
        module: this.moduleName,
        action: 'delete',
        metadata: { key },
      })

      const existing = await this.getByKey(key)
      if (!existing) {
        throw new NotFoundError(`找不到設定鍵: ${key}`)
      }

      const supabase = this.getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client 初始化失敗')
      }

      const { error } = await supabase
        .from('site_settings' as any)
        .delete()
        .eq('key', key)

      if (error) throw error

      timer.end({ metadata: { deleted: true } })

      dbLogger.info('網站設定刪除成功', {
        module: this.moduleName,
        action: 'delete',
        metadata: { key },
      })

      return true
    } catch (error) {
      timer.end()
      dbLogger.error('刪除網站設定失敗', error as Error, {
        module: this.moduleName,
        action: 'delete',
        metadata: { key },
      })
      throw ErrorFactory.fromSupabaseError(error, {
        module: this.moduleName,
        action: 'delete',
      })
    }
  }
}

export const siteSettingsService = new SiteSettingsService()
