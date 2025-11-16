/**
 * 圖片查詢和更新模組
 * 負責圖片資料的查詢、排序和資訊更新
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger } from '@/lib/logger'
import type { Database } from '@/types/database'
import { UnifiedImageError } from './image-error'
import { validateImageParams } from './image-validation'

type ImageRecord = Database['public']['Tables']['images']['Row']

export class ImageQueryManager {
  /**
   * 查詢圖片列表
   */
  async getImages(module: string, entityId: string): Promise<ImageRecord[]> {
    try {
      validateImageParams(module, entityId)

      const Admin = getSupabaseAdmin()
      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      const { data, error } = await (Admin as any)
        .from('images')
        .select('*')
        .eq('module', module)
        .eq('entity_id', entityId)
        .order('display_position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        throw new UnifiedImageError('查詢圖片列表失敗', error)
      }

      return data || []
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('查詢過程發生未知錯誤', error)
    }
  }

  /**
   * 根據 ID 查詢圖片
   */
  async getImageById(imageId: string): Promise<ImageRecord | null> {
    try {
      const Admin = getSupabaseAdmin()
      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      const { data, error } = await (Admin as any)
        .from('images')
        .select('*')
        .eq('id', imageId)
        .maybeSingle()

      if (error) {
        throw new UnifiedImageError('查詢圖片失敗', error)
      }

      return data as ImageRecord | null
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('查詢圖片過程發生未知錯誤', error)
    }
  }

  /**
   * 更新圖片排序
   */
  async updateImagePositions(
    imagePositions: Array<{ id: string; display_position: number }>
  ): Promise<void> {
    try {
      const Admin = getSupabaseAdmin()
      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      for (const { id, display_position } of imagePositions) {
        const { error } = await (Admin as any)
          .from('images')
          .update({
            display_position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        if (error) {
          throw new UnifiedImageError(`更新圖片 ${id} 位置失敗`, error)
        }
      }

      dbLogger.info('圖片排序更新成功', {
        module: 'ImageQueryManager',
        metadata: { count: imagePositions.length },
      })
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('更新排序過程發生未知錯誤', error)
    }
  }

  /**
   * 更新圖片資訊
   */
  async updateImageInfo(
    imageId: string,
    updates: { alt_text?: string; metadata?: Record<string, any> }
  ): Promise<void> {
    try {
      const Admin = getSupabaseAdmin()
      if (!Admin) {
        throw new UnifiedImageError('Supabase admin client 未配置')
      }

      const { error } = await (Admin as any)
        .from('images')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', imageId)

      if (error) {
        throw new UnifiedImageError('更新圖片資訊失敗', error)
      }

      dbLogger.info('圖片資訊更新成功', {
        module: 'ImageQueryManager',
        metadata: { imageId },
      })
    } catch (error) {
      if (error instanceof UnifiedImageError) {
        throw error
      }
      throw new UnifiedImageError('更新資訊過程發生未知錯誤', error)
    }
  }
}
