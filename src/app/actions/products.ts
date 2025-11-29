/**
 * 產品管理 Server Actions
 *
 * 提供產品管理的 Server Actions:
 * - createProductAction - 建立產品 (僅管理員)
 * - updateProductAction - 更新產品 (僅管理員)
 * - deleteProductAction - 刪除產品 (僅管理員)
 * - toggleProductActiveAction - 切換上架/下架狀態 (僅管理員)
 */

'use server'

import { revalidatePath } from 'next/cache'
import { NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import {
  requireAdmin,
  success,
  error,
  validationError,
  logCreate,
  logUpdate,
  logDelete,
} from '@/lib/server'
import { AdminProductSchemas } from '@/lib/validation'
import { productService } from '@/services/core/product/productService'

/**
 * 建立產品
 *
 * 僅限管理員操作
 *
 * @param data - 產品資料
 * @returns ActionResponse 包含建立的產品
 *
 * @example
 * ```tsx
 * import { createProductAction } from '@/app/actions/products'
 *
 * function ProductForm() {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleSubmit = async (formData) => {
 *     startTransition(async () => {
 *       const result = await createProductAction({
 *         name: formData.get('name'),
 *         description: formData.get('description'),
 *         price: Number(formData.get('price')),
 *         category: formData.get('category'),
 *         inventory: Number(formData.get('inventory')),
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 * }
 * ```
 */
export async function createProductAction(data: unknown) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 驗證輸入資料
    const result = AdminProductSchemas.create.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 記錄操作
    apiLogger.info('建立產品', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        productName: result.data.name,
        category: result.data.category,
      },
    })

    // 4. 建立產品
    const product = await productService.addProduct(result.data)

    // 5. 審計日誌
    await logCreate(admin, 'product', product.id, {
      newData: {
        name: product.name,
        price: product.price,
        category: product.category,
        inventory: product.inventory,
      },
    })

    // 6. Revalidation
    revalidatePath('/products')
    revalidatePath('/admin/products')

    // 7. 返回成功回應
    return success(product, '產品建立成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 更新產品
 *
 * 僅限管理員操作
 *
 * @param productId - 產品 ID
 * @param data - 更新資料
 * @returns ActionResponse 包含更新後的產品
 *
 * @example
 * ```tsx
 * import { updateProductAction } from '@/app/actions/products'
 *
 * function EditProductForm({ productId }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleSubmit = async (formData) => {
 *     startTransition(async () => {
 *       const result = await updateProductAction(productId, {
 *         name: formData.get('name'),
 *         price: Number(formData.get('price')),
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *       }
 *     })
 *   }
 * }
 * ```
 */
export async function updateProductAction(productId: string, data: unknown) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 驗證輸入資料
    const result = AdminProductSchemas.update.safeParse(data)

    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 取得當前產品資料（用於審計日誌）
    const currentProduct = await productService.getProductById(productId)

    if (!currentProduct) {
      throw new NotFoundError('找不到產品')
    }

    // 4. 記錄操作
    apiLogger.info('更新產品', {
      metadata: {
        adminId: admin.id,
        productId,
        changes: Object.keys(result.data),
      },
    })

    // 5. 更新產品
    const updatedProduct = await productService.updateProduct(productId, result.data)

    // 6. 審計日誌
    await logUpdate(admin, 'product', productId, {
      previousData: {
        name: currentProduct.name,
        price: currentProduct.price,
        isActive: currentProduct.isActive,
      },
      newData: {
        name: updatedProduct.name,
        price: updatedProduct.price,
        isActive: updatedProduct.isActive,
      },
    })

    // 7. Revalidation
    revalidatePath('/products')
    revalidatePath(`/products/${productId}`)
    revalidatePath('/admin/products')

    // 8. 返回成功回應
    return success(updatedProduct, '產品更新成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 刪除產品
 *
 * 僅限管理員操作
 *
 * @param productId - 產品 ID
 * @returns ActionResponse 包含刪除結果
 *
 * @example
 * ```tsx
 * import { deleteProductAction } from '@/app/actions/products'
 *
 * function DeleteButton({ productId, productName }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleDelete = async () => {
 *     if (!confirm(`確定要刪除「${productName}」嗎？`)) return
 *
 *     startTransition(async () => {
 *       const result = await deleteProductAction(productId)
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleDelete} disabled={isPending}>
 *       {isPending ? '刪除中...' : '刪除'}
 *     </button>
 *   )
 * }
 * ```
 */
export async function deleteProductAction(productId: string) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得產品資料（用於審計日誌）
    const product = await productService.getProductById(productId)

    if (!product) {
      throw new NotFoundError('找不到產品')
    }

    // 3. 記錄操作
    apiLogger.info('刪除產品', {
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        productId,
        productName: product.name,
      },
    })

    // 4. 執行刪除
    await productService.deleteProduct(productId)

    // 5. 審計日誌
    await logDelete(admin, 'product', productId, {
      previousData: {
        name: product.name,
        price: product.price,
        category: product.category,
      },
    })

    // 6. Revalidation
    revalidatePath('/products')
    revalidatePath('/admin/products')

    // 7. 返回成功回應
    return success({ id: productId }, '產品刪除成功')
  } catch (err) {
    return error(err)
  }
}

/**
 * 切換產品上架/下架狀態
 *
 * 便利 Action，用於快速切換產品的 isActive 狀態
 * 僅限管理員操作
 *
 * @param productId - 產品 ID
 * @param isActive - 新的上架狀態
 * @returns ActionResponse 包含更新後的產品
 *
 * @example
 * ```tsx
 * import { toggleProductActiveAction } from '@/app/actions/products'
 *
 * function ProductToggle({ productId, currentActive }) {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleToggle = () => {
 *     startTransition(async () => {
 *       const result = await toggleProductActiveAction(productId, !currentActive)
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleToggle} disabled={isPending}>
 *       {currentActive ? '下架' : '上架'}
 *     </button>
 *   )
 * }
 * ```
 */
export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  try {
    // 1. 管理員權限檢查
    const admin = await requireAdmin()

    // 2. 取得當前產品
    const currentProduct = await productService.getProductById(productId)

    if (!currentProduct) {
      throw new NotFoundError('找不到產品')
    }

    const actionText = isActive ? '上架' : '下架'

    // 3. 記錄操作
    apiLogger.info(`產品${actionText}`, {
      metadata: {
        adminId: admin.id,
        productId,
        productName: currentProduct.name,
        previousState: currentProduct.isActive,
        newState: isActive,
      },
    })

    // 4. 更新產品狀態
    const updatedProduct = await productService.updateProduct(productId, { isActive })

    // 5. 審計日誌
    await logUpdate(admin, 'product', productId, {
      previousData: { isActive: currentProduct.isActive },
      newData: { isActive },
      metadata: { action: actionText },
    })

    // 6. Revalidation
    revalidatePath('/products')
    revalidatePath(`/products/${productId}`)
    revalidatePath('/admin/products')

    // 7. 返回成功回應
    return success(updatedProduct, `產品已${actionText}`)
  } catch (err) {
    return error(err)
  }
}
