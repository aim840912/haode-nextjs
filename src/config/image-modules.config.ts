/**
 * 圖片模組配置
 * 定義各個模組的圖片上傳配置參數
 */

export interface ImageModuleConfig {
  /** 最大檔案數量 */
  maxFiles: number
  /** 允許多檔案上傳 */
  allowMultiple: boolean
  /** 生成的圖片尺寸 */
  generateSizes: string[]
  /** 啟用排序功能 */
  enableSorting: boolean
  /** 啟用刪除功能 */
  enableDelete: boolean
  /** 啟用前端壓縮 */
  enableCompression: boolean
  /** 接受的檔案類型 */
  acceptedTypes: string[]
  /** 最大檔案大小 (bytes) */
  maxFileSize: number
  /** Storage 資料夾名稱 */
  storageFolder: string
  /** 模組顯示名稱 */
  displayName: string
}

export const IMAGE_MODULE_CONFIGS: Record<string, ImageModuleConfig> = {
  products: {
    maxFiles: 10,
    allowMultiple: true,
    generateSizes: ['medium'], // 只生成單一尺寸
    enableSorting: true,
    enableDelete: true,
    enableCompression: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    storageFolder: 'products',
    displayName: '產品圖片',
  },
  news: {
    maxFiles: 1,
    allowMultiple: false,
    generateSizes: ['medium'],
    enableSorting: false,
    enableDelete: true,
    enableCompression: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    storageFolder: 'news',
    displayName: '新聞圖片',
  },
  locations: {
    maxFiles: 1,
    allowMultiple: false,
    generateSizes: ['medium'],
    enableSorting: false,
    enableDelete: true,
    enableCompression: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    storageFolder: 'locations',
    displayName: '門市圖片',
  },
  'farm-tour': {
    maxFiles: 1,
    allowMultiple: false,
    generateSizes: ['medium'],
    enableSorting: false,
    enableDelete: true,
    enableCompression: true, // 農場體驗強制壓縮
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 3 * 1024 * 1024, // 3MB (較小)
    storageFolder: 'farm-tour',
    displayName: '農場體驗圖片',
  },
  moments: {
    maxFiles: 5,
    allowMultiple: true,
    generateSizes: ['medium'],
    enableSorting: false,
    enableDelete: true,
    enableCompression: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    storageFolder: 'moments',
    displayName: '精彩時刻圖片',
  },
}

/**
 * 取得模組配置
 * @param module 模組名稱
 * @returns 模組配置
 */
export function getModuleConfig(module: string): ImageModuleConfig {
  const config = IMAGE_MODULE_CONFIGS[module]
  if (!config) {
    throw new Error(`未知的圖片模組: ${module}`)
  }
  return config
}

/**
 * 檢查模組是否存在
 * @param module 模組名稱
 * @returns 是否存在
 */
export function isValidModule(module: string): boolean {
  return module in IMAGE_MODULE_CONFIGS
}

/**
 * 取得所有支援的模組
 * @returns 模組名稱陣列
 */
export function getSupportedModules(): string[] {
  return Object.keys(IMAGE_MODULE_CONFIGS)
}

/**
 * 取得模組的完整 Storage 路徑
 * @param module 模組名稱
 * @param entityId 實體 ID
 * @returns Storage 路徑
 */
export function getModuleStoragePath(module: string, entityId: string): string {
  const config = getModuleConfig(module)
  const yearMonth = new Date().toISOString().slice(0, 7) // YYYY-MM 格式
  return `${config.storageFolder}/${yearMonth}/${module}-${entityId}`
}
