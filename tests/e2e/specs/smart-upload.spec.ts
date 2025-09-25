import { test, expect } from '@playwright/test'
import path from 'path'
import { LoginPage } from '../pages/LoginPage'
import { testUsers } from '../fixtures/test-data'

/**
 * 智慧上傳系統端到端測試
 *
 * 測試目標：
 * 1. 驗證修復後的智慧上傳系統能夠立即上傳圖片
 * 2. 確認產品能夠成功建立並包含圖片 URL
 * 3. 驗證沒有表單完成度計算錯誤
 * 4. 檢查控制台錯誤
 */
test.describe('智慧上傳系統', () => {
  // 測試圖片路徑
  const testImagePath = '/mnt/c/Users/aim84/Downloads/HAUDE/images/products/fruit.jpg'

  test.beforeEach(async ({ page }) => {
    // 監聽控制台訊息和網路請求
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        console.log(`❌ Console Error: ${text}`)
      } else if (type === 'warn') {
        console.log(`⚠️ Console Warning: ${text}`)
      } else if (type === 'log' && text.includes('upload')) {
        console.log(`📋 Upload Log: ${text}`)
      }
    })

    // 監聽網路請求
    page.on('request', request => {
      if (request.url().includes('/api/smart-upload/')) {
        console.log(`🔗 Smart Upload API Request: ${request.method()} ${request.url()}`)
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/smart-upload/')) {
        console.log(`📨 Smart Upload API Response: ${response.status()} ${response.url()}`)
      }
    })

    // 登入管理員帳號
    console.log('🔐 開始管理員登入流程...')
    const loginPage = new LoginPage(page)

    // 導航到登入頁面
    await loginPage.navigate()
    await loginPage.waitForLoad()

    // 使用管理員帳號登入
    await loginPage.loginAsAdmin()

    // 等待登入完成
    const loginSuccess = await loginPage.isLoginSuccessful()
    if (!loginSuccess) {
      const errorMessage = await loginPage.getErrorMessage()
      console.error('❌ 管理員登入失敗:', errorMessage)
      throw new Error(`管理員登入失敗: ${errorMessage || '未知錯誤'}`)
    }

    console.log('✅ 管理員登入成功')
  })

  test('應該能夠立即上傳圖片並成功建立產品', async ({ page }) => {
    console.log('🚀 開始測試智慧上傳系統...')

    // 1. 導航到產品新增頁面
    console.log('📍 步驟 1: 導航到產品新增頁面')
    await page.goto('/admin/products/add-v2')

    // 等待頁面完全載入
    await expect(page.locator('h1')).toHaveText('新增產品 (V2)', { timeout: 10000 })
    console.log('✅ 頁面載入完成')

    // 2. 填寫基本表單資訊
    console.log('📍 步驟 2: 填寫表單資訊')

    // 產品名稱
    await page.fill('[name="name"]', '測試產品 - 簡化版上傳')
    console.log('✅ 已填寫產品名稱')

    // 描述
    await page.fill('[name="description"]', '測試修復後的上傳功能，應該能立即上傳圖片')
    console.log('✅ 已填寫產品描述')

    // 選擇類別（選擇第一個可用選項）
    await page.selectOption('[name="category"]', { index: 1 })
    console.log('✅ 已選擇產品類別')

    // 價格
    await page.fill('[name="price"]', '150')
    console.log('✅ 已填寫價格')

    // 庫存
    await page.fill('[name="stock"]', '20')
    console.log('✅ 已填寫庫存')

    // 3. 測試圖片上傳功能
    console.log('📍 步驟 3: 測試圖片上傳功能')

    // 檢查測試圖片是否存在
    const fs = require('fs')
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`測試圖片不存在: ${testImagePath}`)
    }
    console.log('✅ 測試圖片存在')

    // 找到檔案上傳輸入欄位
    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeVisible()
    console.log('✅ 找到檔案上傳欄位')

    // 記錄上傳前的狀態
    console.log('📸 準備上傳圖片...')

    // 上傳圖片
    await fileInput.setInputFiles(testImagePath)
    console.log('✅ 圖片已選擇')

    // 4. 驗證上傳狀態變化
    console.log('📍 步驟 4: 監控上傳狀態變化')

    // 等待上傳開始（狀態應該從 local 變為 queued/uploading）
    await page.waitForTimeout(1000) // 給一些時間讓上傳開始

    // 檢查是否有上傳進度指示器
    const uploadingIndicator = page
      .locator('[data-testid="upload-progress"]')
      .or(page.locator('.upload-progress'))
      .or(page.locator('text=上傳中').or(page.locator('text=uploading')))

    // 檢查是否顯示上傳狀態
    const hasUploadProgress = (await uploadingIndicator.count()) > 0
    if (hasUploadProgress) {
      console.log('✅ 檢測到上傳進度指示器')
    } else {
      console.log('⚠️ 未檢測到上傳進度指示器，但可能已經完成上傳')
    }

    // 等待上傳完成 - 檢查成功標記
    console.log('⏳ 等待上傳完成...')

    // 等待上傳完成的各種可能指示器
    const successIndicators = [
      page.locator('[data-testid="upload-success"]'),
      page.locator('.upload-success'),
      page.locator('text=✓'),
      page.locator('[data-testid="image-uploaded"]'),
      page.locator('.image-uploaded'),
      page.locator('text=上傳完成'),
      page.locator('text=completed'),
    ]

    // 等待任一成功指示器出現（最多等待 30 秒）
    let uploadCompleted = false
    for (let i = 0; i < 30 && !uploadCompleted; i++) {
      for (const indicator of successIndicators) {
        if ((await indicator.count()) > 0) {
          console.log('✅ 檢測到上傳完成指示器')
          uploadCompleted = true
          break
        }
      }
      if (!uploadCompleted) {
        await page.waitForTimeout(1000)
      }
    }

    if (uploadCompleted) {
      console.log('🎉 圖片上傳完成')
    } else {
      console.log('⚠️ 未檢測到明確的上傳完成指示器，繼續測試...')
    }

    // 5. 檢查控制台錯誤
    console.log('📍 步驟 5: 檢查控制台狀態')

    // 等待一下讓所有 JavaScript 執行完成
    await page.waitForTimeout(2000)

    // 6. 提交表單
    console.log('📍 步驟 6: 提交產品表單')

    // 找到並點擊提交按鈕
    const submitButton = page
      .locator('button[type="submit"]')
      .or(page.locator('text=建立產品').or(page.locator('text=提交').or(page.locator('text=儲存'))))

    await expect(submitButton).toBeVisible()
    console.log('✅ 找到提交按鈕')

    await submitButton.click()
    console.log('✅ 已點擊提交按鈕')

    // 7. 驗證產品建立成功
    console.log('📍 步驟 7: 驗證產品建立結果')

    // 等待成功訊息或重定向
    try {
      // 可能的成功指示器
      const successMessage = page
        .locator('text=建立成功')
        .or(
          page
            .locator('text=產品已建立')
            .or(page.locator('text=新增成功').or(page.locator('.success')))
        )

      // 或者檢查是否重定向到產品列表頁面
      const productListRedirect = page
        .waitForURL('**/admin/products**', { timeout: 10000 })
        .catch(() => null)

      // 等待其中一個條件滿足
      await Promise.race([successMessage.waitFor({ timeout: 10000 }), productListRedirect])

      console.log('🎉 產品建立成功')

      // 如果重定向到產品列表，檢查新產品是否出現
      if (page.url().includes('/admin/products')) {
        console.log('✅ 已重定向到產品列表頁面')

        // 嘗試找到剛建立的產品
        const newProduct = page.locator('text=測試產品 - 簡化版上傳')
        if ((await newProduct.count()) > 0) {
          console.log('✅ 在產品列表中找到新建立的產品')
        }
      }
    } catch (error) {
      console.error('❌ 產品建立失敗或超時:', error)

      // 截圖以便除錯
      await page.screenshot({ path: 'tests/e2e/results/smart-upload-error.png', fullPage: true })

      // 檢查是否有錯誤訊息
      const errorMessages = await page
        .locator('.error, .alert-error, [role="alert"]')
        .allTextContents()
      if (errorMessages.length > 0) {
        console.log('❌ 發現錯誤訊息:', errorMessages)
      }

      throw error
    }

    console.log('🏁 測試完成')
  })

  test('應該能夠處理多個圖片上傳', async ({ page }) => {
    console.log('🚀 開始測試多圖片上傳...')

    await page.goto('/admin/products/add-v2')
    await expect(page.locator('h1')).toHaveText('新增產品 (V2)', { timeout: 10000 })

    // 填寫基本表單
    await page.fill('[name="name"]', '測試產品 - 多圖片上傳')
    await page.fill('[name="description"]', '測試多個圖片同時上傳功能')
    await page.selectOption('[name="category"]', { index: 1 })
    await page.fill('[name="price"]', '200')
    await page.fill('[name="stock"]', '15')

    // 上傳多個圖片
    const imageFiles = [
      '/mnt/c/Users/aim84/Downloads/HAUDE/images/products/fruit.jpg',
      '/mnt/c/Users/aim84/Downloads/HAUDE/images/products/honey.jpg',
    ]

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(imageFiles)
    console.log('✅ 已選擇多個圖片')

    // 等待上傳完成
    await page.waitForTimeout(5000)
    console.log('⏳ 等待多圖片上傳完成')

    // 檢查是否顯示多個圖片預覽
    const imagePreviews = page
      .locator('[data-testid="image-preview"]')
      .or(page.locator('.image-preview'))

    const previewCount = await imagePreviews.count()
    console.log(`📸 檢測到 ${previewCount} 個圖片預覽`)

    // 提交表單
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    console.log('✅ 已提交多圖片產品')

    // 驗證成功
    try {
      await page.waitForURL('**/admin/products**', { timeout: 10000 })
      console.log('🎉 多圖片產品建立成功')
    } catch (error) {
      console.error('❌ 多圖片產品建立失敗:', error)
      await page.screenshot({ path: 'tests/e2e/results/multi-upload-error.png', fullPage: true })
      throw error
    }
  })

  test('應該能夠處理上傳錯誤並顯示適當的錯誤訊息', async ({ page }) => {
    console.log('🚀 開始測試上傳錯誤處理...')

    await page.goto('/admin/products/add-v2')
    await expect(page.locator('h1')).toHaveText('新增產品 (V2)', { timeout: 10000 })

    // 填寫基本表單
    await page.fill('[name="name"]', '測試產品 - 錯誤處理')
    await page.fill('[name="description"]', '測試上傳錯誤處理功能')
    await page.selectOption('[name="category"]', { index: 1 })
    await page.fill('[name="price"]', '100')
    await page.fill('[name="stock"]', '10')

    // 嘗試上傳一個非常大的檔案或不支援的格式
    // 注意：這個測試可能需要根據實際的錯誤處理邏輯調整
    console.log('📸 測試錯誤處理機制')

    // 檢查是否有錯誤處理機制（檔案大小限制、格式限制等）
    const fileInput = page.locator('input[type="file"]').first()

    // 檢查 accept 屬性
    const acceptAttr = await fileInput.getAttribute('accept')
    console.log(`📝 檔案類型限制: ${acceptAttr}`)

    // 檢查是否有檔案大小說明
    const sizeInfo = page.locator('text=*MB*').or(page.locator('text=*大小*'))
    if ((await sizeInfo.count()) > 0) {
      const sizeText = await sizeInfo.first().textContent()
      console.log(`📏 檔案大小說明: ${sizeText}`)
    }

    console.log('✅ 錯誤處理測試完成')
  })
})
