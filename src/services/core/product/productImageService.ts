/**
 * 產品圖片服務
 *
 * 統一管理產品圖片的 CRUD 和排序操作
 */

import type { ProductImage } from '@/types/product'
import {
  createProductImage,
  createProductImages,
  type CreateProductImageData,
} from './image/image-create'
import { deleteProductImage, clearProductImages } from './image/image-delete'
import { reorderImages, setPrimaryImage } from './image/image-order'
import { getProductImages, getImageById, getMainImage } from './image/image-query'
import { updateProductImage, type UpdateProductImageData } from './image/image-update'

// 重新導出類型(向後相容)
export type { CreateProductImageData, UpdateProductImageData }

/**
 * 產品圖片服務類別
 */
export class ProductImageService {
  // Query 方法
  static async getProductImages(productId: string): Promise<ProductImage[]> {
    return getProductImages(productId)
  }

  static async getImageById(imageId: string): Promise<ProductImage | null> {
    return getImageById(imageId)
  }

  static async getMainImage(productId: string): Promise<ProductImage | null> {
    return getMainImage(productId)
  }

  // Create 方法
  static async createProductImage(imageData: CreateProductImageData): Promise<ProductImage> {
    return createProductImage(imageData)
  }

  static async createProductImages(imagesData: CreateProductImageData[]): Promise<ProductImage[]> {
    return createProductImages(imagesData)
  }

  // Update 方法
  static async updateProductImage(
    imageId: string,
    updateData: UpdateProductImageData
  ): Promise<ProductImage> {
    return updateProductImage(imageId, updateData)
  }

  // Delete 方法
  static async deleteProductImage(imageId: string): Promise<void> {
    return deleteProductImage(imageId)
  }

  static async clearProductImages(productId: string): Promise<void> {
    return clearProductImages(productId)
  }

  // Order 方法
  static async reorderImages(
    productId: string,
    imageOrders: { id: string; position: number }[]
  ): Promise<void> {
    return reorderImages(productId, imageOrders)
  }

  static async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    return setPrimaryImage(productId, imageId)
  }
}

// 導出服務實例(向後相容)
export const productImageService = ProductImageService
