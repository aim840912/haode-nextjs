/**
 * 圖片資料轉換工具
 *
 * 負責資料庫記錄與業務物件之間的轉換
 */

import type { Database } from '@/types/database'
import type { ProductImage } from '@/types/product'

type ImageRow = Database['public']['Tables']['images']['Row']

/**
 * 從資料庫記錄轉換為業務物件
 */
export function transformFromDB(row: ImageRow): ProductImage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (row.metadata as any) || {}
  return {
    id: row.id,
    entity_id: row.entity_id,
    storage_url: row.storage_url,
    file_path: row.file_path,
    alt_text: row.alt_text || undefined,
    display_position: row.display_position ?? 0,
    size: row.size as 'thumbnail' | 'medium' | 'large',
    width: metadata.width || undefined,
    height: metadata.height || undefined,
    file_size: metadata.file_size || undefined,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    module: row.module,
  }
}
