/**
 * 圖片服務錯誤類別
 */

export class UnifiedImageError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'UnifiedImageError'
  }
}
