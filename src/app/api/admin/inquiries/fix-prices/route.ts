/**
 * 修復詢價單價格的管理員 API
 * 僅供管理員使用的一次性修復工具
 */

import { NextRequest } from 'next/server'
import { withAdminAndError } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { dbLogger } from '@/lib/logger'
import { createServiceSupabaseClient } from '@/lib/database/supabase-server'

interface FixResult {
  total_items: number
  fixed_items: number
  errors: string[]
  details: Array<{
    inquiry_item_id: string
    product_id: string
    product_name: string
    old_price: number | null
    new_price: number | null
    status: 'fixed' | 'no_product' | 'already_has_price' | 'error'
  }>
}

async function handlePOST(request: NextRequest): Promise<Response> {
  const supabase = createServiceSupabaseClient()
  const result: FixResult = {
    total_items: 0,
    fixed_items: 0,
    errors: [],
    details: [],
  }

  try {
    dbLogger.info('開始修復詢價單價格', {
      metadata: {
        module: 'FixPricesAPI',
        action: 'start',
      },
    })

    // 1. 查詢所有 unit_price 為 null 的詢價項目
    const { data: inquiryItems, error: queryError } = await supabase
      .from('inquiry_items')
      .select('id, product_id, product_name, unit_price, quantity')
      .is('unit_price', null)

    if (queryError) {
      throw queryError
    }

    result.total_items = inquiryItems?.length || 0

    if (!inquiryItems || inquiryItems.length === 0) {
      dbLogger.info('沒有需要修復的詢價項目', {
        metadata: {
          module: 'FixPricesAPI',
          action: 'complete',
        },
      })

      return success(result, '沒有需要修復的詢價項目')
    }

    // 2. 批量處理每個項目
    for (const item of inquiryItems) {
      try {
        // 查詢產品當前價格
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('price')
          .eq('id', item.product_id)
          .single()

        const detail: FixResult['details'][0] = {
          inquiry_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          old_price: item.unit_price,
          new_price: null,
          status: 'error',
        }

        if (productError || !product) {
          detail.status = 'no_product'
          result.details.push(detail)
          result.errors.push(`產品 ${item.product_id} (${item.product_name}) 不存在`)
          continue
        }

        if (!product.price || product.price <= 0) {
          detail.status = 'no_product'
          result.details.push(detail)
          result.errors.push(`產品 ${item.product_id} (${item.product_name}) 沒有有效價格`)
          continue
        }

        // 3. 更新詢價項目的價格
        detail.new_price = product.price
        const totalPrice = product.price * item.quantity

        const { error: updateError } = await supabase
          .from('inquiry_items')
          .update({
            unit_price: product.price,
            total_price: totalPrice,
          })
          .eq('id', item.id)

        if (updateError) {
          detail.status = 'error'
          result.details.push(detail)
          result.errors.push(`更新項目 ${item.id} 失敗：${updateError.message}`)
          continue
        }

        detail.status = 'fixed'
        result.details.push(detail)
        result.fixed_items++

        dbLogger.info('成功修復詢價項目價格', {
          metadata: {
            module: 'FixPricesAPI',
            action: 'fix_item',
            inquiry_item_id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: product.price,
            total_price: totalPrice,
          },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        result.errors.push(`處理項目 ${item.id} 時發生錯誤：${errorMessage}`)

        result.details.push({
          inquiry_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          old_price: item.unit_price,
          new_price: null,
          status: 'error',
        })

        dbLogger.error('修復詢價項目價格失敗', new Error(errorMessage), {
          module: 'FixPricesAPI',
          action: 'fix_item_error',
          metadata: {
            inquiry_item_id: item.id,
            product_id: item.product_id,
          },
        })
      }
    }

    dbLogger.info('完成修復詢價單價格', {
      metadata: {
        module: 'FixPricesAPI',
        action: 'complete',
        total_items: result.total_items,
        fixed_items: result.fixed_items,
        error_count: result.errors.length,
      },
    })

    const message = `修復完成：處理了 ${result.total_items} 個項目，成功修復 ${result.fixed_items} 個，${result.errors.length} 個錯誤`
    return success(result, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    result.errors.push(`修復過程發生嚴重錯誤：${errorMessage}`)

    dbLogger.error('修復詢價單價格過程發生錯誤', new Error(errorMessage), {
      module: 'FixPricesAPI',
      action: 'process_error',
    })

    return success(result, '修復過程中發生錯誤，請查看詳細資訊')
  }
}

export const POST = withAdminAndError(handlePOST, { module: 'FixPricesAPI', enableAuditLog: true })
