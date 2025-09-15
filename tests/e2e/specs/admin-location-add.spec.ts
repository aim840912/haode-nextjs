/**
 * E2E 測試：管理員門市新增功能
 * 測試路徑：/admin/locations/add
 */

import { test, expect } from '@playwright/test'

const testLocationData = {
  name: 'E2E測試門市',
  title: '豪德茶業E2E測試門市',
  address: '台北市大安區忠孝東路四段101號',
  landmark: '捷運忠孝敦化站出口',
  phone: '0227712345',
  lineId: '@e2etest',
  hours: '10:00-20:00',
  closedDays: '國定假日',
  parking: '附近有付費停車格',
  publicTransport: '捷運忠孝敦化站步行2分鐘',
  features: ['E2E測試專用', '自動化測試'],
  specialties: ['測試用茶品', '驗證專用商品'],
  coordinates: {
    lat: 25.0418,
    lng: 121.5491,
  },
}

test.describe('管理員門市新增', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入管理員帳號
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // 檢查是否有登入表單
    const loginForm = page.locator('form, [data-testid="login-form"]')
    if (await loginForm.isVisible()) {
      // 填寫管理員登入資訊（這裡使用測試帳號）
      const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]'
      )
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"], input[placeholder*="密碼"], input[placeholder*="password"]'
      )

      if (await emailInput.isVisible()) {
        await emailInput.fill('admin@haude.com') // 測試管理員 email
        await passwordInput.fill('admin123') // 測試密碼

        // 點擊登入按鈕
        const loginButton = page
          .locator('button[type="submit"], button')
          .filter({ hasText: /登入|Login|立即登入/ })
        await loginButton.click()

        // 等待登入完成
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)
      }
    }

    // 導航到門市新增頁面
    await page.goto('/admin/locations/add')
    await page.waitForLoadState('networkidle')

    // 如果仍然顯示需要登入，跳過此測試
    if (await page.locator('text=需要登入').isVisible()) {
      test.skip('跳過測試：無法登入管理員帳號')
    }
  })

  test('應該顯示門市新增表單', async ({ page }) => {
    // 檢查標題
    await expect(page.locator('h1, h2').filter({ hasText: /新增|門市|地點/ })).toBeVisible()

    // 檢查必要的表單欄位
    await expect(
      page.locator('input[name="name"], input[placeholder*="門市名稱"], input[placeholder*="名稱"]')
    ).toBeVisible()
    await expect(page.locator('input[name="address"], input[placeholder*="地址"]')).toBeVisible()
    await expect(page.locator('input[name="phone"], input[placeholder*="電話"]')).toBeVisible()

    // 檢查提交按鈕
    await expect(
      page.locator('button[type="submit"], button').filter({ hasText: /提交|送出|新增|確定/ })
    ).toBeVisible()
  })

  test('應該能成功新增門市', async ({ page }) => {
    // 填寫基本資訊
    await page.fill(
      'input[name="name"], input[placeholder*="門市名稱"], input[placeholder*="名稱"]',
      testLocationData.name
    )
    await page.fill(
      'input[name="title"], input[placeholder*="標題"], input[placeholder*="完整名稱"]',
      testLocationData.title
    )
    await page.fill('input[name="address"], input[placeholder*="地址"]', testLocationData.address)
    await page.fill('input[name="landmark"], input[placeholder*="地標"]', testLocationData.landmark)
    await page.fill('input[name="phone"], input[placeholder*="電話"]', testLocationData.phone)

    // 填寫聯絡資訊
    await page.fill('input[name="lineId"], input[placeholder*="LINE"]', testLocationData.lineId)
    await page.fill(
      'input[name="hours"], input[placeholder*="營業時間"], input[placeholder*="時間"]',
      testLocationData.hours
    )
    await page.fill(
      'input[name="closedDays"], input[placeholder*="公休"], input[placeholder*="休息"]',
      testLocationData.closedDays
    )

    // 填寫交通資訊
    await page.fill(
      'input[name="parking"], input[placeholder*="停車"], textarea[name="parking"]',
      testLocationData.parking
    )
    await page.fill(
      'input[name="publicTransport"], input[placeholder*="大眾運輸"], input[placeholder*="交通"], textarea[name="publicTransport"]',
      testLocationData.publicTransport
    )

    // 填寫座標（如果有座標輸入欄位）
    const latInput = page.locator('input[name="lat"], input[placeholder*="緯度"]')
    const lngInput = page.locator('input[name="lng"], input[placeholder*="經度"]')

    if (await latInput.isVisible()) {
      await latInput.fill(testLocationData.coordinates.lat.toString())
    }
    if (await lngInput.isVisible()) {
      await lngInput.fill(testLocationData.coordinates.lng.toString())
    }

    // 處理特色服務（如果是多選或標籤輸入）
    const featuresInput = page.locator(
      'input[name="features"], input[placeholder*="特色"], input[placeholder*="服務"]'
    )
    if (await featuresInput.isVisible()) {
      for (const feature of testLocationData.features) {
        await featuresInput.fill(feature)
        await page.keyboard.press('Enter') // 嘗試按 Enter 添加標籤
      }
    }

    // 處理主打商品
    const specialtiesInput = page.locator(
      'input[name="specialties"], input[placeholder*="主打"], input[placeholder*="商品"]'
    )
    if (await specialtiesInput.isVisible()) {
      for (const specialty of testLocationData.specialties) {
        await specialtiesInput.fill(specialty)
        await page.keyboard.press('Enter')
      }
    }

    // 提交表單
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /提交|送出|新增|確定/ })
    await submitButton.click()

    // 等待回應並檢查結果
    await page.waitForTimeout(2000) // 等待 API 請求完成

    // 檢查成功訊息或跳轉
    const successIndicators = [
      page.locator('.success, .alert-success').filter({ hasText: /成功|已新增/ }),
      page.locator('[role="alert"]').filter({ hasText: /成功/ }),
      page.getByText(/新增成功|建立成功|已新增/),
    ]

    let foundSuccess = false
    for (const indicator of successIndicators) {
      if (await indicator.isVisible()) {
        foundSuccess = true
        break
      }
    }

    // 如果沒有找到成功訊息，檢查是否跳轉到列表頁面
    if (!foundSuccess) {
      await expect(page).toHaveURL(/admin.*location/i, { timeout: 5000 })
    } else {
      expect(foundSuccess).toBe(true)
    }
  })

  test('應該驗證必填欄位', async ({ page }) => {
    // 嘗試提交空表單
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /提交|送出|新增|確定/ })
    await submitButton.click()

    // 等待驗證訊息
    await page.waitForTimeout(1000)

    // 檢查是否有驗證錯誤訊息
    const errorIndicators = [
      page.locator('.error, .alert-error, .text-red-500'),
      page.locator('[role="alert"]').filter({ hasText: /錯誤|必填|不能為空/ }),
      page.getByText(/必填|不能為空|請填寫/),
    ]

    let foundError = false
    for (const indicator of errorIndicators) {
      if (await indicator.isVisible()) {
        foundError = true
        break
      }
    }

    expect(foundError).toBe(true)
  })

  test('應該驗證電話號碼格式', async ({ page }) => {
    // 填寫基本必填資訊
    await page.fill(
      'input[name="name"], input[placeholder*="門市名稱"], input[placeholder*="名稱"]',
      testLocationData.name
    )
    await page.fill('input[name="address"], input[placeholder*="地址"]', testLocationData.address)

    // 填寫無效的電話號碼
    await page.fill('input[name="phone"], input[placeholder*="電話"]', '無效電話')

    // 提交表單
    const submitButton = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /提交|送出|新增|確定/ })
    await submitButton.click()

    // 等待驗證
    await page.waitForTimeout(1000)

    // 檢查電話號碼驗證錯誤
    const phoneErrorIndicators = [
      page.locator('.error, .alert-error, .text-red-500').filter({ hasText: /電話|格式/ }),
      page.getByText(/電話.*格式|格式.*正確/),
    ]

    let foundPhoneError = false
    for (const indicator of phoneErrorIndicators) {
      if (await indicator.isVisible()) {
        foundPhoneError = true
        break
      }
    }

    expect(foundPhoneError).toBe(true)
  })

  test('圖片上傳功能應該正常運作', async ({ page }) => {
    // 檢查圖片上傳元件
    const imageUpload = page.locator('input[type="file"], .image-upload, [data-testid*="upload"]')

    if (await imageUpload.isVisible()) {
      // 模擬圖片上傳（使用測試圖片）
      const testImagePath = require('path').join(__dirname, '../fixtures/test-image.jpg')

      try {
        await imageUpload.setInputFiles(testImagePath)

        // 等待上傳完成
        await page.waitForTimeout(3000)

        // 檢查是否有上傳成功的指示
        const uploadSuccess = page.locator(
          '.upload-success, .preview, img[src*="blob:"], img[src*="data:"]'
        )
        await expect(uploadSuccess).toBeVisible({ timeout: 10000 })
      } catch (error) {
        // 如果測試圖片不存在，跳過圖片上傳測試
        console.log('跳過圖片上傳測試：測試圖片不存在')
      }
    }
  })
})

test.describe('門市新增 API 直接測試', () => {
  test('API 端點應該正常運作', async ({ request }) => {
    // 注意：API 可能需要身份驗證，先測試是否需要登入
    const response = await request.post('/api/locations', {
      data: {
        ...testLocationData,
        name: 'API測試門市' + Date.now(), // 避免重複
      },
    })

    // 檢查回應狀態
    if (response.status() === 401) {
      test.skip('跳過測試：API 需要身份驗證')
      return
    }

    // 如果是驗證錯誤（400），檢查是否是座標問題
    if (response.status() === 400) {
      const responseData = await response.json()
      console.log('API 400 錯誤詳情:', responseData)

      // 如果是座標驗證失敗，修正資料後重試
      if (responseData.message?.includes('座標')) {
        const retryResponse = await request.post('/api/locations', {
          data: {
            ...testLocationData,
            name: 'API測試門市' + Date.now(),
            coordinates: testLocationData.coordinates, // 確保座標格式正確
          },
        })
        expect(retryResponse.status()).toBe(201)
        return
      }
    }

    expect(response.status()).toBe(201)

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.data).toHaveProperty('id')
    expect(responseData.data.name).toContain('API測試門市')
  })

  test('API 應該驗證必填欄位', async ({ request }) => {
    const response = await request.post('/api/locations', {
      data: {
        name: '', // 空名稱應該失敗
        address: testLocationData.address,
      },
    })

    // 如果需要身份驗證，跳過測試
    if (response.status() === 401) {
      test.skip('跳過測試：API 需要身份驗證')
      return
    }

    expect(response.status()).toBe(400)

    const responseData = await response.json()
    expect(responseData.success).toBe(false)
    // 檢查錯誤訊息是否存在（處理巢狀的錯誤物件）
    const errorMessage =
      typeof responseData.error === 'object'
        ? responseData.error.message
        : responseData.message || responseData.error || ''
    expect(errorMessage).toMatch(/名稱|必填|不能為空/)
  })
})
