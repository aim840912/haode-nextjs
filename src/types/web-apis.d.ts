/**
 * Web APIs 類型定義
 * 支援智慧上傳系統所需的瀏覽器 API
 */

declare global {
  interface Window {
    // Service Worker 相關
    registration?: ServiceWorkerRegistration
    navigator: Navigator & {
      storage?: StorageManager
      connection?: NetworkInformation
    }
    // Performance API 擴展
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number
        totalJSHeapSize: number
        jsHeapSizeLimit: number
      }
    }
  }

  // Network Information API
  interface NetworkInformation extends EventTarget {
    readonly type?:
      | 'bluetooth'
      | 'cellular'
      | 'ethernet'
      | 'none'
      | 'wifi'
      | 'wimax'
      | 'other'
      | 'unknown'
    readonly effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
    readonly downlink?: number
    readonly rtt?: number
    readonly saveData?: boolean
    onchange: ((event: Event) => void) | null
  }

  // Storage Manager API
  interface StorageManager {
    estimate(): Promise<StorageEstimate>
    persist(): Promise<boolean>
    persisted(): Promise<boolean>
  }

  interface StorageEstimate {
    quota?: number
    usage?: number
    usageDetails?: Record<string, number>
  }

  // IndexedDB 相關類型擴展
  interface IDBDatabase {
    createObjectStore(name: string, optionalParameters?: IDBObjectStoreParameters): IDBObjectStore
    deleteObjectStore(name: string): void
    transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction
  }

  // Web Worker 相關
  interface Worker {
    postMessage(message: any, transfer?: Transferable[]): void
    terminate(): void
  }

  // File API 擴展
  interface File {
    readonly webkitRelativePath?: string
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory'
    readonly name: string
    isSameEntry(other: FileSystemHandle): Promise<boolean>
  }

  // URL API 擴展 (for Blob URLs)
  interface URL {
    createObjectURL(object: Blob | MediaSource): string
    revokeObjectURL(url: string): void
  }
}

// 智慧上傳系統專用類型
export interface SmartUploadMetadata {
  fileName: string
  fileSize: number
  fileType: string
  lastModified: number
  uploadId: string
  priority: 'high' | 'medium' | 'low'
  retryCount: number
  createdAt: number
  updatedAt: number
}

export interface UploadProgress {
  uploadId: string
  fileName: string
  loaded: number
  total: number
  percentage: number
  speed: number
  timeRemaining: number
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused'
  error?: string
}

export interface NetworkQuality {
  type: string
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
  score: number // 0-100
}

export interface SystemResources {
  availableStorage: number
  usedStorage: number
  memoryUsage: number
  cpuScore: number // 0-100
}

export {}
