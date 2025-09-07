import { logger } from '@/lib/logger';

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  path: string;
  alt?: string;
  position: number;
  size: 'thumbnail' | 'medium' | 'large';
  width?: number;
  height?: number;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductImageData {
  product_id: string;
  url: string;
  path: string;
  alt?: string;
  position: number;
  size: 'thumbnail' | 'medium' | 'large';
  width?: number;
  height?: number;
  file_size?: number;
}

export interface UpdateProductImageData {
  url?: string;
  path?: string;
  alt?: string;
  position?: number;
  size?: 'thumbnail' | 'medium' | 'large';
  width?: number;
  height?: number;
  file_size?: number;
}

/**
 * 產品圖片服務 - 佔位實作版本
 * 
 * 注意：此服務目前為佔位實作，所有方法都標記為未實作
 * 實作此功能需要：
 * 1. 在資料庫中創建 product_images 表
 * 2. 更新 Database 類型定義以包含 product_images 表
 * 3. 實作實際的 CRUD 操作
 * 4. 實作圖片上傳和處理邏輯
 */
export class ProductImageService {
  private static logNotImplemented(method: string, context?: Record<string, unknown>) {
    logger.warn(`ProductImageService.${method} - 功能暫未實作`, { 
      metadata: { ...context, reason: '資料庫中尚無 product_images 表，需要完整實作' } 
    });
  }

  /**
   * 獲取產品的所有圖片 (依照 position 排序)
   */
  static async getProductImages(productId: string): Promise<ProductImage[]> {
    this.logNotImplemented('getProductImages', { productId });
    return [];
  }

  /**
   * 新增產品圖片
   */
  static async createProductImage(imageData: CreateProductImageData): Promise<ProductImage> {
    this.logNotImplemented('createProductImage', { productId: imageData.product_id });
    
    // 返回一個符合介面的模擬物件
    const mockImage: ProductImage = {
      id: `mock-${Date.now()}`,
      product_id: imageData.product_id,
      url: imageData.url,
      path: imageData.path,
      alt: imageData.alt,
      position: imageData.position,
      size: imageData.size,
      width: imageData.width,
      height: imageData.height,
      file_size: imageData.file_size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return mockImage;
  }

  /**
   * 批量新增產品圖片
   */
  static async createProductImages(imagesData: CreateProductImageData[]): Promise<ProductImage[]> {
    this.logNotImplemented('createProductImages', { count: imagesData.length });
    return [];
  }

  /**
   * 更新產品圖片
   */
  static async updateProductImage(imageId: string, updateData: UpdateProductImageData): Promise<ProductImage> {
    this.logNotImplemented('updateProductImage', { imageId });
    
    // 返回一個符合介面的模擬物件
    const mockImage: ProductImage = {
      id: imageId,
      product_id: 'mock-product',
      url: updateData.url || 'mock-url',
      path: updateData.path || 'mock-path',
      alt: updateData.alt,
      position: updateData.position || 0,
      size: updateData.size || 'medium',
      width: updateData.width,
      height: updateData.height,
      file_size: updateData.file_size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return mockImage;
  }

  /**
   * 刪除產品圖片
   */
  static async deleteProductImage(imageId: string): Promise<void> {
    this.logNotImplemented('deleteProductImage', { imageId });
    // 佔位實作：什麼都不做
  }

  /**
   * 批量更新圖片排序
   */
  static async updateImagesOrder(productId: string, imageOrders: { id: string; position: number }[]): Promise<void> {
    this.logNotImplemented('updateImagesOrder', { productId, count: imageOrders.length });
    // 佔位實作：什麼都不做
  }

  /**
   * 獲取指定位置的圖片
   */
  static async getImageByPosition(productId: string, position: number): Promise<ProductImage | null> {
    this.logNotImplemented('getImageByPosition', { productId, position });
    return null;
  }

  /**
   * 移動圖片位置 (從某個位置開始的圖片往前或往後移動)
   */
  static async shiftImagesPosition(productId: string, fromPosition: number, shift: number): Promise<void> {
    this.logNotImplemented('shiftImagesPosition', { productId, fromPosition, shift });
    // 佔位實作：什麼都不做
  }

  /**
   * 清除產品的所有圖片
   */
  static async clearProductImages(productId: string): Promise<void> {
    this.logNotImplemented('clearProductImages', { productId });
    // 佔位實作：什麼都不做
  }

  /**
   * 獲取產品的主圖 (position = 0)
   */
  static async getProductPrimaryImage(productId: string): Promise<ProductImage | null> {
    return await this.getImageByPosition(productId, 0);
  }
}