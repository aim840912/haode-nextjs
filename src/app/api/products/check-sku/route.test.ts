/**
 * GET /api/products/check-sku 測試
 *
 * 測試 SKU 檢查 API:
 * - 驗證輸入參數
 * - SKU 格式驗證
 * - 降級模式處理
 */

import { describe, it, expect } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/products/check-sku', () => {
  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該返回 200 當 SKU 不存在', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=FRUIT-001')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.exists).toBe(false)
    expect(data.data.sku).toBe('FRUIT-001')
    expect(data.data.existingProduct).toBeNull()
    expect(data.data.suggestions).toEqual([])
    expect(data.message).toBe('SKU 檢查完成')
  })

  it('應該將小寫 SKU 轉換為大寫', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=fruit-002')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.sku).toBe('FRUIT-002')
  })

  it('應該處理包含數字和連字符的 SKU', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=ABC-123-XYZ')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.sku).toBe('ABC-123-XYZ')
    expect(data.data.exists).toBe(false)
  })

  it('應該處理最短長度 SKU (3 字元)', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=A1B')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.sku).toBe('A1B')
  })

  it('應該處理最長長度 SKU (20 字元)', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/products/check-sku?sku=ABCDE-12345-FGHIJ-67'
    )

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.sku).toBe('ABCDE-12345-FGHIJ-67')
  })

  // ==========================================================================
  // 驗證錯誤
  // ==========================================================================

  it('應該返回 400 當 SKU 參數缺失', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 參數為必填')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當 SKU 為空字串', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 參數為必填')
  })

  it('應該返回 400 當 SKU 為純空格', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=%20%20%20')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 參數為必填')
  })

  it('應該返回 400 當 SKU 太短 (少於 3 字元)', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=AB')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  })

  it('應該返回 400 當 SKU 太長 (超過 20 字元)', async () => {
    // Arrange
    const request = new NextRequest(
      'http://localhost:3000/api/products/check-sku?sku=ABCDEFGHIJ1234567890X'
    )

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  })

  it('應該將小寫字母轉為大寫並通過驗證', async () => {
    // Arrange - 小寫字母會被轉換為大寫
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=fruitabc')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert - 轉換後通過驗證
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.sku).toBe('FRUITABC')
    expect(data.data.exists).toBe(false)
  })

  it('應該返回 400 當 SKU 包含特殊字元', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=FRUIT@001')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  })

  it('應該返回 400 當 SKU 包含空格', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=FRUIT%20001')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  })

  it('應該返回 400 當 SKU 包含底線', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/products/check-sku?sku=FRUIT_001')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toBe('SKU 格式不正確：需要 3-20 位英文大寫字母、數字或連字符')
  })
})
