/**
 * 圖片驗證模組
 */

import { isValidModule } from '@/config/image-modules.config'
import { UnifiedImageError } from './image-error'

/**
 * 驗證模組和實體ID
 */
export function validateImageParams(module: string, entityId: string): void {
  if (!isValidModule(module)) {
    throw new UnifiedImageError(`不支援的圖片模組: ${module}`)
  }

  if (!entityId || typeof entityId !== 'string') {
    throw new UnifiedImageError('實體ID為必填參數')
  }
}
