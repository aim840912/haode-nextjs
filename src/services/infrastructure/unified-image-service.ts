/**
 * 統一圖片管理服務
 * 整合所有模組的圖片上傳、管理功能
 */

import type { Database } from '@/types/database'
import type { ImageUploadResult } from '@/types/supabase.types'
import { ImageDeleter } from './image-delete'
import { ImageQueryManager } from './image-query'
import { ImageStorageManager } from './image-storage'
import { ImageUploader } from './image-upload'

// 重新匯出錯誤類別
export { UnifiedImageError } from './image-error'

type ImageRecord = Database['public']['Tables']['images']['Row']

/**
 * 統一圖片管理服務類別
 */
export class UnifiedImageService {
  private storageManager: ImageStorageManager
  private uploader: ImageUploader
  private queryManager: ImageQueryManager
  private deleter: ImageDeleter

  constructor() {
    this.storageManager = new ImageStorageManager()
    this.uploader = new ImageUploader(this.storageManager)
    this.queryManager = new ImageQueryManager()
    this.deleter = new ImageDeleter(this.storageManager)
  }

  // ============================================================
  // 上傳功能
  // ============================================================

  /**
   * 上傳單張圖片
   */
  async uploadImage(
    file: File,
    module: string,
    entityId: string,
    size: string = 'medium',
    display_position: number = 0
  ): Promise<ImageUploadResult> {
    return this.uploader.uploadImage(file, module, entityId, size, display_position)
  }

  /**
   * 批量上傳多尺寸圖片
   */
  async uploadMultipleSizes(
    file: File,
    module: string,
    entityId: string,
    display_position: number = 0
  ): Promise<ImageUploadResult[]> {
    const results = await this.uploader.uploadMultipleSizes(
      file,
      module,
      entityId,
      display_position
    )

    // 如果部分上傳失敗，清理已上傳的檔案
    if (results.length > 0) {
      // 清理邏輯已在 uploader 中處理
    }

    return results
  }

  // ============================================================
  // 查詢功能
  // ============================================================

  /**
   * 查詢圖片列表
   */
  async getImages(module: string, entityId: string): Promise<ImageRecord[]> {
    return this.queryManager.getImages(module, entityId)
  }

  /**
   * 根據 ID 查詢圖片
   */
  async getImageById(imageId: string): Promise<ImageRecord | null> {
    return this.queryManager.getImageById(imageId)
  }

  // ============================================================
  // 更新功能
  // ============================================================

  /**
   * 更新圖片排序
   */
  async updateImagePositions(
    imagePositions: Array<{ id: string; display_position: number }>
  ): Promise<void> {
    return this.queryManager.updateImagePositions(imagePositions)
  }

  /**
   * 更新圖片資訊
   */
  async updateImageInfo(
    imageId: string,
    updates: { alt_text?: string; metadata?: Record<string, any> }
  ): Promise<void> {
    return this.queryManager.updateImageInfo(imageId, updates)
  }

  // ============================================================
  // 刪除功能
  // ============================================================

  /**
   * 刪除圖片
   */
  async deleteImage(imageId: string): Promise<void> {
    return this.deleter.deleteImage(imageId)
  }

  /**
   * 刪除實體的所有圖片
   */
  async deleteEntityImages(module: string, entityId: string): Promise<number> {
    return this.deleter.deleteEntityImages(module, entityId, this.getImages.bind(this))
  }

  // ============================================================
  // Storage 工具方法
  // ============================================================

  /**
   * 取得圖片的公開 URL
   */
  getImagePublicUrl(filePath: string): string {
    return this.storageManager.getImagePublicUrl(filePath)
  }

  /**
   * 檢查圖片是否存在
   */
  async checkImageExists(filePath: string): Promise<boolean> {
    return this.storageManager.checkImageExists(filePath)
  }
}

// 導出單例實例
export const unifiedImageService = new UnifiedImageService()
