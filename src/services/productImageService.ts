import { getSupabaseAdmin } from '@/lib/supabase-auth';
import { logger } from '@/lib/logger';

// 類型斷言，解決 Supabase 類型推斷問題
const supabase = () => getSupabaseAdmin();

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

export class ProductImageService {
  /**
   * 獲取產品的所有圖片 (依照 position 排序)
   */
  static async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      const { data, error } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true });

      if (error) {
        logger.error('獲取產品圖片失敗', error, { metadata: { productId } });
        throw error;
      }

      logger.debug('獲取產品圖片成功', { 
        metadata: { productId, imageCount: data?.length || 0 } 
      });

      return data || [];

    } catch (error) {
      logger.error('ProductImageService.getProductImages 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { productId } }
      );
      throw error;
    }
  }

  /**
   * 新增產品圖片
   */
  static async createProductImage(imageData: CreateProductImageData): Promise<ProductImage> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      // 檢查位置是否已被使用
      const existingImage = await this.getImageByPosition(imageData.product_id, imageData.position);
      if (existingImage) {
        // 如果位置已被佔用，將現有圖片往後移
        await this.shiftImagesPosition(imageData.product_id, imageData.position, 1);
      }

      const { data, error } = await supabaseAdmin
        .from('product_images')
        .insert([imageData])
        .select()
        .single();

      if (error) {
        logger.error('新增產品圖片失敗', error, { 
          metadata: { productId: imageData.product_id, position: imageData.position } 
        });
        throw error;
      }

      logger.info('新增產品圖片成功', {
        metadata: { 
          productId: imageData.product_id, 
          imageId: data.id,
          position: data.position,
          url: data.url 
        }
      });

      return data;

    } catch (error) {
      logger.error('ProductImageService.createProductImage 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { productId: imageData.product_id } }
      );
      throw error;
    }
  }

  /**
   * 批量新增產品圖片
   */
  static async createProductImages(imagesData: CreateProductImageData[]): Promise<ProductImage[]> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      if (imagesData.length === 0) {
        return [];
      }

      const { data, error } = await supabaseAdmin
        .from('product_images')
        .insert(imagesData)
        .select();

      if (error) {
        logger.error('批量新增產品圖片失敗', error, { 
          metadata: { count: imagesData.length, productId: imagesData[0]?.product_id } 
        });
        throw error;
      }

      logger.info('批量新增產品圖片成功', {
        metadata: { 
          productId: imagesData[0]?.product_id,
          count: data?.length || 0
        }
      });

      return data || [];

    } catch (error) {
      logger.error('ProductImageService.createProductImages 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { count: imagesData.length } }
      );
      throw error;
    }
  }

  /**
   * 更新產品圖片
   */
  static async updateProductImage(imageId: string, updateData: UpdateProductImageData): Promise<ProductImage> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      const { data, error } = await supabaseAdmin
        .from('product_images')
        .update(updateData)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        logger.error('更新產品圖片失敗', error, { metadata: { imageId } });
        throw error;
      }

      logger.info('更新產品圖片成功', {
        metadata: { imageId, updateFields: Object.keys(updateData) }
      });

      return data;

    } catch (error) {
      logger.error('ProductImageService.updateProductImage 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { imageId } }
      );
      throw error;
    }
  }

  /**
   * 刪除產品圖片
   */
  static async deleteProductImage(imageId: string): Promise<void> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      // 先獲取要刪除的圖片資訊
      const { data: imageToDelete, error: fetchError } = await supabaseAdmin
        .from('product_images')
        .select('product_id, position')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        logger.error('獲取要刪除的圖片資訊失敗', fetchError, { metadata: { imageId } });
        throw fetchError;
      }

      // 刪除圖片
      const { error: deleteError } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        logger.error('刪除產品圖片失敗', deleteError, { metadata: { imageId } });
        throw deleteError;
      }

      // 重新調整後續圖片的位置
      if (imageToDelete) {
        await this.shiftImagesPosition(imageToDelete.product_id, imageToDelete.position + 1, -1);
      }

      logger.info('刪除產品圖片成功', { metadata: { imageId } });

    } catch (error) {
      logger.error('ProductImageService.deleteProductImage 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { imageId } }
      );
      throw error;
    }
  }

  /**
   * 批量更新圖片排序
   */
  static async updateImagesOrder(productId: string, imageOrders: { id: string; position: number }[]): Promise<void> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      // 使用事務更新所有圖片的位置
      const updates = imageOrders.map(({ id, position }) => 
        supabaseAdmin
          .from('product_images')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      // 檢查是否有錯誤
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        logger.error('批量更新圖片排序部分失敗', errors[0].error, {
          metadata: { productId, failedCount: errors.length, totalCount: imageOrders.length }
        });
        throw errors[0].error;
      }

      logger.info('批量更新圖片排序成功', {
        metadata: { productId, updatedCount: imageOrders.length }
      });

    } catch (error) {
      logger.error('ProductImageService.updateImagesOrder 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { productId } }
      );
      throw error;
    }
  }

  /**
   * 獲取指定位置的圖片
   */
  static async getImageByPosition(productId: string, position: number): Promise<ProductImage | null> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      const { data, error } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('position', position)
        .maybeSingle();

      if (error) {
        logger.error('獲取指定位置圖片失敗', error, { 
          metadata: { productId, position } 
        });
        throw error;
      }

      return data;

    } catch (error) {
      logger.error('ProductImageService.getImageByPosition 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { productId, position } }
      );
      throw error;
    }
  }

  /**
   * 移動圖片位置 (從某個位置開始的圖片往前或往後移動)
   */
  static async shiftImagesPosition(productId: string, fromPosition: number, shift: number): Promise<void> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      // 預留給未來可能的 SQL 操作使用

      // 使用 SQL 更新位置
      const { error } = await supabaseAdmin.rpc('shift_product_images_position', {
        p_product_id: productId,
        p_from_position: fromPosition,
        p_shift: shift
      });

      // 如果 RPC 函數不存在，使用備用方法
      if (error && error.message.includes('function')) {
        // 備用方法：獲取需要移動的圖片並逐一更新
        const { data: imagesToShift, error: fetchError } = await supabaseAdmin
          .from('product_images')
          .select('id, position')
          .eq('product_id', productId)
          .gte('position', fromPosition);

        if (fetchError) {
          throw fetchError;
        }

        if (imagesToShift && imagesToShift.length > 0) {
          const updates = imagesToShift.map((img: { id: string; position: number }) => 
            supabaseAdmin
              .from('product_images')
              .update({ position: img.position + shift })
              .eq('id', img.id)
          );

          const results = await Promise.all(updates);
          const errors = results.filter(result => result.error);
          if (errors.length > 0) {
            throw errors[0].error;
          }
        }
      } else if (error) {
        throw error;
      }

      logger.debug('調整圖片位置成功', {
        metadata: { productId, fromPosition, shift }
      });

    } catch (error) {
      logger.error('ProductImageService.shiftImagesPosition 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { productId, fromPosition, shift } }
      );
      throw error;
    }
  }

  /**
   * 清除產品的所有圖片
   */
  static async clearProductImages(productId: string): Promise<void> {
    try {
      const supabaseAdmin = supabase();
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client 未配置');
      }

      const { error } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (error) {
        logger.error('清除產品圖片失敗', error, { metadata: { productId } });
        throw error;
      }

      logger.info('清除產品圖片成功', { metadata: { productId } });

    } catch (error) {
      logger.error('ProductImageService.clearProductImages 執行失敗', 
        error instanceof Error ? error : new Error(String(error)), 
        { metadata: { productId } }
      );
      throw error;
    }
  }

  /**
   * 獲取產品的主圖 (position = 0)
   */
  static async getProductPrimaryImage(productId: string): Promise<ProductImage | null> {
    return await this.getImageByPosition(productId, 0);
  }
}