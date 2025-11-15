/**
 * 詢問單項目載入工具
 * 負責批次載入詢問單項目
 */

import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { ErrorFactory } from '@/lib/errors'
import { InquiryItem } from '@/types/inquiry'

const getAdmin = () => getSupabaseAdmin()

export class InquiryItemsLoader {
  private static readonly INQUIRY_ITEMS_TABLE = 'inquiry_items'

  /**
   * 取得單一詢問單的項目
   */
  static async loadByInquiryId(inquiryId: string): Promise<InquiryItem[]> {
    const client = getAdmin()
    if (!client) {
      throw new Error('Supabase admin client not initialized')
    }

    const { data, error } = await client
      .from(this.INQUIRY_ITEMS_TABLE)
      .select('*')
      .eq('inquiry_id', inquiryId)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'InquiryItemsLoader',
        action: 'loadByInquiryId',
        context: { inquiryId },
      })
    }

    return (data || []) as InquiryItem[]
  }

  /**
   * 批次取得多個詢問單的項目
   */
  static async loadBatch(inquiryIds: string[]): Promise<Map<string, InquiryItem[]>> {
    if (inquiryIds.length === 0) {
      return new Map()
    }

    const client = getAdmin()
    if (!client) {
      throw new Error('Supabase admin client not initialized')
    }

    const { data, error } = await client
      .from(this.INQUIRY_ITEMS_TABLE)
      .select('*')
      .in('inquiry_id', inquiryIds)

    if (error) {
      throw ErrorFactory.fromSupabaseError(error, {
        module: 'InquiryItemsLoader',
        action: 'loadBatch',
        context: { inquiryIds },
      })
    }

    // 將項目按 inquiry_id 分組
    const itemsByInquiryId = new Map<string, InquiryItem[]>()
    for (const record of data || []) {
      const item = record as InquiryItem
      const inquiryId = (record as any).inquiry_id
      if (!itemsByInquiryId.has(inquiryId)) {
        itemsByInquiryId.set(inquiryId, [])
      }
      itemsByInquiryId.get(inquiryId)!.push(item)
    }

    return itemsByInquiryId
  }

  /**
   * 關聯詢問單項目到詢問單列表
   */
  static assignItemsToInquiries<T extends { id: string; inquiry_items?: InquiryItem[] }>(
    inquiries: T[],
    itemsByInquiryId: Map<string, InquiryItem[]>
  ): void {
    for (const inquiry of inquiries) {
      inquiry.inquiry_items = itemsByInquiryId.get(inquiry.id) || []
    }
  }
}
