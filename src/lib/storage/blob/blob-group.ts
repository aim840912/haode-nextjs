/**
 * Blob URL 群組化管理
 *
 * 提供便捷的群組化 URL 管理功能
 */

import { blobURLManager, type BlobURLInfo } from '../BlobURLManager'

/**
 * 便捷函數：群組化 Blob URL 管理
 */
export class BlobURLGroup {
  constructor(private groupName: string) {}

  create(blob: Blob, metadata?: BlobURLInfo['metadata']): string {
    return blobURLManager.createURL(blob, {
      group: this.groupName,
      metadata,
    })
  }

  revokeAll(): number {
    return blobURLManager.revokeGroup(this.groupName)
  }

  getAll(): string[] {
    return blobURLManager.getGroupURLs(this.groupName)
  }

  getCount(): number {
    return this.getAll().length
  }
}
