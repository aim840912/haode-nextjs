/**
 * 產品圖片清理服務
 *
 * 統一處理產品刪除時的圖片清理
 * 只支援新系統：使用 product_images 表統一管理
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { dbLogger, apiLogger } from '@/lib/logger'
import type { Product, ProductImage } from '@/types/product'

export class ProductImageCleanupError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'ProductImageCleanupError'
  }
}

export interface CleanupResult {
  totalImages: number
  deletedFromStorage: number
  deletedFromDatabase: number
  errors: string[]
  details: {
    legacyImages: string[]
    unifiedImages: string[]
    failedPaths: string[]
  }
}

/**
 * 產品圖片清理服務
 */
export class ProductImageCleanupService {
  private readonly MEDIA_BUCKET = 'media' // 新系統統一使用的 bucket
  private readonly LEGACY_BUCKET = 'products' // 舊系統可能存在的 bucket

  /**
   * 清理產品的所有相關圖片
   */
  async cleanupProductImages(productId: string): Promise<CleanupResult> {
    const result: CleanupResult = {
      totalImages: 0,
      deletedFromStorage: 0,
      deletedFromDatabase: 0,
      errors: [],
      details: {
        legacyImages: [],
        unifiedImages: [],
        failedPaths: [],
      },
    }

    try {
      apiLogger.info('🚀 開始執行產品圖片三重清理機制', {
        metadata: { productId },
      })

      // 1. 查詢產品完整資料
      const product = await this.getProductWithImages(productId)
      if (!product) {
        dbLogger.warn('找不到產品資料，跳過圖片清理', {
          module: 'ProductImageCleanupService',
          metadata: { productId },
        })
        return result
      }

      // 2. 提取所有圖片 URL（舊系統）
      const legacyImageUrls = this.extractLegacyImageUrls(product)
      result.details.legacyImages = legacyImageUrls
      result.totalImages += legacyImageUrls.length

      // 3. 清理舊系統圖片
      if (legacyImageUrls.length > 0) {
        const legacyCleanupResult = await this.cleanupLegacyImages(legacyImageUrls)
        result.deletedFromStorage += legacyCleanupResult.deleted
        result.errors.push(...legacyCleanupResult.errors)
        result.details.failedPaths.push(...legacyCleanupResult.failedPaths)
      }

      // 4. 清理新系統圖片（使用統一圖片服務）
      try {
        const { unifiedImageService } = await import('./unified-image-service')
        const deletedCount = await unifiedImageService.deleteEntityImages('products', productId)
        result.deletedFromDatabase = deletedCount
        result.totalImages += deletedCount

        apiLogger.info('🗃️ 統一圖片服務清理完成', {
          metadata: { productId, deletedCount },
        })
      } catch (error) {
        const errorMessage = `統一圖片服務清理失敗: ${error instanceof Error ? error.message : String(error)}`
        result.errors.push(errorMessage)

        dbLogger.error('統一圖片服務清理失敗', error as Error, {
          module: 'ProductImageCleanupService',
          metadata: { productId },
        })
      }

      // 5. 直接掃描 Storage 清理（確保完全清理）
      try {
        const storageCleanupResult = await this.cleanupStorageDirectly(productId)
        result.deletedFromStorage += storageCleanupResult.deletedCount
        result.totalImages += storageCleanupResult.deletedCount

        if (storageCleanupResult.errors.length > 0) {
          result.errors.push(...storageCleanupResult.errors)
        }

        apiLogger.info('💾 直接 Storage 掃描清理完成', {
          metadata: {
            productId,
            deletedCount: storageCleanupResult.deletedCount,
            deletedFiles: storageCleanupResult.deletedFiles,
          },
        })
      } catch (error) {
        const errorMessage = `直接 Storage 掃描清理失敗: ${error instanceof Error ? error.message : String(error)}`
        result.errors.push(errorMessage)

        dbLogger.error('直接 Storage 掃描清理失敗', error as Error, {
          module: 'ProductImageCleanupService',
          metadata: { productId },
        })
      }

      // 6. 記錄清理結果
      dbLogger.info('產品圖片清理完成', {
        module: 'ProductImageCleanupService',
        metadata: {
          productId,
          totalImages: result.totalImages,
          deletedFromStorage: result.deletedFromStorage,
          deletedFromDatabase: result.deletedFromDatabase,
          errorCount: result.errors.length,
        },
      })

      return result
    } catch (error) {
      const errorMessage = `產品圖片清理失敗: ${error instanceof Error ? error.message : String(error)}`
      result.errors.push(errorMessage)

      dbLogger.error('產品圖片清理失敗', error as Error, {
        module: 'ProductImageCleanupService',
        metadata: { productId },
      })

      return result
    }
  }

  /**
   * 查詢產品完整資料（包含所有圖片欄位）
   */
  private async getProductWithImages(productId: string): Promise<Product | null> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new ProductImageCleanupError('Supabase admin client 未配置')
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) {
        throw new ProductImageCleanupError('查詢產品資料失敗', error)
      }

      if (!data) {
        return null
      }

      // 轉換為 Product 類型（基於實際資料庫結構）
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category,
        price: data.price,
        priceUnit: data.price_unit,
        unitQuantity: data.unit_quantity,
        originalPrice: undefined,
        isOnSale: false,
        saleEndDate: undefined,
        productImages: [], // 由 loadProductImages 載入
        inventory: data.stock || 0,
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Product
    } catch (error) {
      if (error instanceof ProductImageCleanupError) {
        throw error
      }
      throw new ProductImageCleanupError('查詢產品資料過程發生錯誤', error)
    }
  }

  /**
   * 提取所有舊系統的圖片 URL
   */
  private extractLegacyImageUrls(product: Product): string[] {
    const urls: string[] = []

    dbLogger.debug('開始提取產品圖片 URL', {
      module: 'ProductImageCleanupService',
      metadata: {
        productId: product.id,
        productName: product.name,
        hasProductImages: product.productImages?.length || 0,
      },
    })

    // 只處理 productImages 結構化資料（新系統）
    if (product.productImages && Array.isArray(product.productImages)) {
      const productImageUrls = product.productImages
        .map((img: ProductImage) => img.url)
        .filter(Boolean)
      urls.push(...productImageUrls)
      dbLogger.debug(`從 productImages 陣列提取 ${productImageUrls.length} 張圖片`, {
        module: 'ProductImageCleanupService',
        metadata: { productId: product.id, productImageUrls },
      })
    }

    // 去重並過濾無效 URL
    const uniqueUrls = [...new Set(urls)]
      .filter(url => url && typeof url === 'string' && url.trim() !== '')
      .filter(url => !url.includes('placeholder')) // 跳過佔位圖

    dbLogger.info('圖片 URL 提取完成', {
      module: 'ProductImageCleanupService',
      metadata: {
        productId: product.id,
        totalUrls: urls.length,
        uniqueUrls: uniqueUrls.length,
        filteredUrls: uniqueUrls,
      },
    })

    return uniqueUrls
  }

  /**
   * 清理舊系統的圖片
   */
  private async cleanupLegacyImages(imageUrls: string[]): Promise<{
    deleted: number
    errors: string[]
    failedPaths: string[]
  }> {
    const result = {
      deleted: 0,
      errors: [],
      failedPaths: [],
    } as { deleted: number; errors: string[]; failedPaths: string[] }

    if (imageUrls.length === 0) {
      return result
    }

    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new ProductImageCleanupError('Supabase admin client 未配置')
      }

      // 解析 URL 為 Storage 路徑，並按 bucket 分組
      const pathsByBucket: Record<string, string[]> = {}
      for (const url of imageUrls) {
        try {
          const parseResult = this.extractStoragePathFromUrl(url)
          if (parseResult) {
            const { path, bucket } = parseResult
            if (!pathsByBucket[bucket]) {
              pathsByBucket[bucket] = []
            }
            pathsByBucket[bucket].push(path)
          }
        } catch (error) {
          const errorMessage = `URL 解析失敗: ${url}`
          result.errors.push(errorMessage)
          dbLogger.warn(errorMessage, {
            module: 'ProductImageCleanupService',
            metadata: { url, error: String(error) },
          })
        }
      }

      // 按 bucket 批量刪除 Storage 檔案
      const totalPaths = Object.values(pathsByBucket).reduce((sum, paths) => sum + paths.length, 0)
      if (totalPaths > 0) {
        const deleteResult = await this.deleteFromBucketGroups(pathsByBucket)

        result.deleted = deleteResult.deletedCount
        if (deleteResult.errors.length > 0) {
          result.errors.push(...deleteResult.errors)
          result.failedPaths.push(...deleteResult.failedPaths)
        }

        dbLogger.info('Storage 檔案按 bucket 分組刪除完成', {
          module: 'ProductImageCleanupService',
          metadata: {
            deletedCount: result.deleted,
            totalPaths,
            errorCount: deleteResult.errors.length,
            bucketGroups: Object.keys(pathsByBucket),
            bucketResults: deleteResult.bucketResults,
          },
        })
      }

      return result
    } catch (error) {
      const errorMessage = `舊系統圖片清理失敗: ${error instanceof Error ? error.message : String(error)}`
      result.errors.push(errorMessage)
      result.failedPaths.push(...imageUrls)

      dbLogger.error('舊系統圖片清理失敗', error as Error, {
        module: 'ProductImageCleanupService',
        metadata: { imageCount: imageUrls.length },
      })

      return result
    }
  }

  /**
   * 從 Supabase Storage URL 提取檔案路徑和 bucket 資訊
   */
  private extractStoragePathFromUrl(url: string): {
    path: string
    bucket: string
  } | null {
    try {
      // 支援多種 URL 格式，自動檢測 bucket
      const patterns = [
        // 標準 Supabase Storage URL - media bucket
        {
          pattern: /\/storage\/v1\/object\/public\/media\/(.+)$/,
          bucket: this.MEDIA_BUCKET,
        },
        // 標準 Supabase Storage URL - products bucket
        {
          pattern: /\/storage\/v1\/object\/public\/products\/(.+)$/,
          bucket: this.LEGACY_BUCKET,
        },
        // 自訂網域的 Storage URL - media
        {
          pattern: /\/media\/(.+)$/,
          bucket: this.MEDIA_BUCKET,
        },
        // 自訂網域的 Storage URL - products
        {
          pattern: /\/products\/(.+)$/,
          bucket: this.LEGACY_BUCKET,
        },
        // object/public 格式 - media
        {
          pattern: /\/object\/public\/media\/(.+)$/,
          bucket: this.MEDIA_BUCKET,
        },
        // object/public 格式 - products
        {
          pattern: /\/object\/public\/products\/(.+)$/,
          bucket: this.LEGACY_BUCKET,
        },
      ]

      for (const { pattern, bucket } of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return {
            path: decodeURIComponent(match[1]),
            bucket,
          }
        }
      }

      // 如果無法解析，記錄警告但不拋出錯誤
      dbLogger.warn('無法解析 Storage URL', {
        module: 'ProductImageCleanupService',
        metadata: { url },
      })

      return null
    } catch (error) {
      dbLogger.warn('URL 解析過程發生錯誤', {
        module: 'ProductImageCleanupService',
        metadata: { url, error: String(error) },
      })
      return null
    }
  }

  /**
   * 安全解析 JSON 陣列
   */
  private parseJsonArray(value: any): any[] | null {
    if (Array.isArray(value)) {
      return value
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : null
      } catch {
        return null
      }
    }

    return null
  }

  /**
   * 按 bucket 分組批量刪除 Storage 檔案
   */
  private async deleteFromBucketGroups(pathsByBucket: Record<string, string[]>): Promise<{
    deletedCount: number
    errors: string[]
    failedPaths: string[]
    bucketResults: Record<string, { deleted: number; failed: number }>
  }> {
    const result = {
      deletedCount: 0,
      errors: [],
      failedPaths: [],
      bucketResults: {},
    } as {
      deletedCount: number
      errors: string[]
      failedPaths: string[]
      bucketResults: Record<string, { deleted: number; failed: number }>
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new ProductImageCleanupError('Supabase admin client 未配置')
    }

    // 按 bucket 逐個處理
    for (const [bucket, paths] of Object.entries(pathsByBucket)) {
      result.bucketResults[bucket] = { deleted: 0, failed: 0 }

      if (paths.length === 0) {
        continue
      }

      try {
        dbLogger.info(`開始從 ${bucket} bucket 刪除 ${paths.length} 個檔案`, {
          module: 'ProductImageCleanupService',
          metadata: { bucket, pathCount: paths.length },
        })

        // 使用 Supabase Storage 的批量刪除功能
        const { data, error } = await supabaseAdmin.storage.from(bucket).remove(paths)

        if (error) {
          const errorMessage = `從 ${bucket} bucket 刪除失敗: ${error.message}`
          result.errors.push(errorMessage)
          result.failedPaths.push(...paths)
          result.bucketResults[bucket].failed = paths.length

          dbLogger.error(errorMessage, error, {
            module: 'ProductImageCleanupService',
            metadata: { bucket, pathCount: paths.length },
          })

          continue
        }

        // 統計成功刪除的檔案
        const deletedFiles = data || []
        const deletedCount = deletedFiles.length
        result.deletedCount += deletedCount
        result.bucketResults[bucket].deleted = deletedCount

        // 檢查是否有部分失敗
        const failedCount = paths.length - deletedCount
        if (failedCount > 0) {
          result.bucketResults[bucket].failed = failedCount
          const failedPaths = paths.slice(deletedCount) // 假設失敗的是後面的路徑
          result.failedPaths.push(...failedPaths)
          result.errors.push(`${bucket} bucket 中 ${failedCount} 個檔案刪除失敗`)
        }

        dbLogger.info(`從 ${bucket} bucket 刪除完成`, {
          module: 'ProductImageCleanupService',
          metadata: {
            bucket,
            requested: paths.length,
            deleted: deletedCount,
            failed: failedCount,
          },
        })
      } catch (error) {
        const errorMessage = `${bucket} bucket 刪除過程發生錯誤: ${error instanceof Error ? error.message : String(error)}`
        result.errors.push(errorMessage)
        result.failedPaths.push(...paths)
        result.bucketResults[bucket].failed = paths.length

        dbLogger.error(errorMessage, error as Error, {
          module: 'ProductImageCleanupService',
          metadata: { bucket, pathCount: paths.length },
        })
      }
    }

    return result
  }

  /**
   * 直接掃描並清理 Storage 中的產品圖片
   * 不依賴資料庫記錄，確保完全清理
   */
  private async cleanupStorageDirectly(productId: string): Promise<{
    deletedCount: number
    errors: string[]
    deletedFiles: string[]
  }> {
    const result = {
      deletedCount: 0,
      errors: [] as string[],
      deletedFiles: [] as string[],
    }

    try {
      const supabaseAdmin = getSupabaseAdmin()
      if (!supabaseAdmin) {
        throw new ProductImageCleanupError('Supabase admin client 未配置')
      }

      // 掃描可能的路徑模式（擴展到6個月覆蓋更多情況）
      const pathPatterns: string[] = []

      // 掃描最近6個月的路徑模式
      for (let i = 0; i < 6; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        // 統一圖片服務的標準路徑
        pathPatterns.push(`products/${yearMonth}/products-${productId}`)

        // 可能的變異路徑模式
        pathPatterns.push(`products/${yearMonth}/${productId}`) // 無前綴版本
        pathPatterns.push(`${yearMonth}/products-${productId}`) // 無 products 前綴
      }

      // 添加其他可能的路徑模式
      pathPatterns.push(`products-${productId}`) // 直接以產品ID命名的資料夾
      pathPatterns.push(`products/${productId}`) // 舊版路徑可能性
      pathPatterns.push(`${productId}`) // 最簡單的產品ID路徑

      // 去重
      const uniquePathPatterns = [...new Set(pathPatterns)]

      apiLogger.info('🔍 開始直接掃描 Storage 清理產品圖片', {
        metadata: {
          productId,
          pathPatterns: uniquePathPatterns,
          totalPaths: uniquePathPatterns.length,
          bucket: this.MEDIA_BUCKET,
        },
      })

      // 對每個可能的路徑模式進行掃描
      for (const basePath of uniquePathPatterns) {
        try {
          apiLogger.info(`🔍 掃描路徑: ${basePath}`, {
            metadata: { productId, basePath, bucket: this.MEDIA_BUCKET },
          })

          // 列出該路徑下的所有檔案
          const { data: files, error } = await supabaseAdmin.storage
            .from(this.MEDIA_BUCKET)
            .list(basePath)

          if (error) {
            if (error.message.includes('not found') || error.message.includes('does not exist')) {
              // 路徑不存在，跳過
              continue
            }
            result.errors.push(`掃描路徑 ${basePath} 失敗: ${error.message}`)
            continue
          }

          if (!files || files.length === 0) {
            continue
          }

          // 收集要刪除的檔案路徑
          const filesToDelete = files.map(file => `${basePath}/${file.name}`)

          if (filesToDelete.length > 0) {
            apiLogger.info(`📁 在路徑 ${basePath} 找到 ${filesToDelete.length} 個檔案`, {
              metadata: {
                productId,
                basePath,
                files: filesToDelete,
              },
            })

            // 批量刪除檔案
            const { data: deletedFiles, error: deleteError } = await supabaseAdmin.storage
              .from(this.MEDIA_BUCKET)
              .remove(filesToDelete)

            if (deleteError) {
              result.errors.push(`刪除路徑 ${basePath} 下的檔案失敗: ${deleteError.message}`)
              continue
            }

            const deletedCount = deletedFiles?.length || 0
            result.deletedCount += deletedCount
            result.deletedFiles.push(...(deletedFiles?.map(f => f.name) || []))

            apiLogger.info(`🗑️ 成功刪除路徑 ${basePath} 下的 ${deletedCount} 個檔案`, {
              metadata: {
                productId,
                basePath,
                deletedCount,
                deletedFiles: deletedFiles?.map(f => f.name),
              },
            })
          }
        } catch (error) {
          result.errors.push(
            `處理路徑 ${basePath} 時發生錯誤: ${error instanceof Error ? error.message : String(error)}`
          )

          dbLogger.error(`掃描路徑 ${basePath} 時發生錯誤`, error as Error, {
            module: 'ProductImageCleanupService',
            metadata: { productId, basePath },
          })
        }
      }

      apiLogger.info('✅ 直接 Storage 掃描清理完成', {
        metadata: {
          productId,
          deletedCount: result.deletedCount,
          errorCount: result.errors.length,
          deletedFiles: result.deletedFiles,
          scannedPaths: uniquePathPatterns.length,
        },
      })

      return result
    } catch (error) {
      const errorMessage = `直接 Storage 掃描清理失敗: ${error instanceof Error ? error.message : String(error)}`
      result.errors.push(errorMessage)

      dbLogger.error('直接 Storage 掃描清理失敗', error as Error, {
        module: 'ProductImageCleanupService',
        metadata: { productId },
      })

      return result
    }
  }

  /**
   * 取得孤立圖片清理報告（管理員工具）
   */
  async getOrphanedImagesReport(): Promise<{
    orphanedFiles: string[]
    totalSize: number
    summary: string
  }> {
    // 此功能留待未來實作
    // 需要比較 Storage 中的檔案與資料庫記錄
    return {
      orphanedFiles: [],
      totalSize: 0,
      summary: '孤立圖片檢查功能尚未實作',
    }
  }
}

// 匯出單例實例
export const productImageCleanupService = new ProductImageCleanupService()
