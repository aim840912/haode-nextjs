/**
 * OrderService 完整測試套件
 *
 * 本測試檔案已模組化拆分,各功能測試分別位於:
 * - __tests__/test-setup.ts - Mock 設置和共用工具
 * - __tests__/order-query.test.ts - 查詢操作測試 (getUserOrders, getOrderById, etc.)
 * - __tests__/order-create.test.ts - 建立訂單測試 (createOrder)
 * - __tests__/order-update.test.ts - 更新訂單測試 (updateOrder, updateOrderStatus)
 * - __tests__/order-cancel.test.ts - 取消訂單測試 (cancelOrder)
 *
 * 本檔案保留用於整合測試和向後相容性
 */

import './__tests__/order-query.test'
import './__tests__/order-create.test'
import './__tests__/order-update.test'
import './__tests__/order-cancel.test'

export {}
