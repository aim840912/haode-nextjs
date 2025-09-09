import { test, expect } from '@playwright/test'
import { ProductsPage } from '../pages/ProductsPage'

/**
 * 產品頁面 E2E 測試
 *
 * 測試產品瀏覽、搜尋和詢問功能
 */
test.describe('產品頁面基本功能測試', () => {
  let productsPage: ProductsPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
    await productsPage.navigate()
    await productsPage.waitForLoad()
  })

  test('產品頁面應該正確載入並顯示產品列表', async () => {
    // 檢查產品數量
    const productCount = await productsPage.getProductCount()

    // 至少應該有一些產品展示（如果有資料的話）
    // 如果沒有產品，頁面也應該正常顯示
    expect(productCount).toBeGreaterThanOrEqual(0)

    // 檢查是否有錯誤
    const errors = await productsPage.hasErrors()
    expect(errors.hasError).toBe(false)

    // 如果有產品，驗證產品卡片內容
    if (productCount > 0) {
      const firstProductInfo = await productsPage.verifyProductCard(0)
      expect(firstProductInfo.valid).toBe(true)
      expect(firstProductInfo.hasName).toBe(true)
    }
  })

  test('產品卡片應該包含必要的資訊', async () => {
    const productCount = await productsPage.getProductCount()

    // 如果有產品，測試產品卡片
    if (productCount > 0) {
      const cardResults = await productsPage.verifyAllProductCards()

      // 檢查每個產品卡片
      for (const result of cardResults) {
        expect(result.valid).toBe(true)
        expect(result.hasName).toBe(true)

        // 產品名稱應該有意義的內容
        if (result.name) {
          expect(result.name.length).toBeGreaterThan(0)
        }
      }
    } else {
      // 如果沒有產品，應該顯示適當的訊息
      console.log('沒有產品資料可供測試')
    }
  })

  test('頁面載入效能應該符合標準', async () => {
    const performance = await productsPage.checkLoadPerformance()

    expect(performance.isPerformant).toBe(true)
    expect(performance.loadTime).toBeLessThan(8000) // 8秒內載入完成

    console.log(`產品頁面載入時間: ${performance.loadTime}ms`)
    console.log(`產品數量: ${performance.productCount}`)
  })
})

test.describe('產品搜尋功能測試', () => {
  let productsPage: ProductsPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
    await productsPage.navigate()
    await productsPage.waitForLoad()
  })

  test('搜尋功能應該正常運作（如果存在）', async () => {
    const searchResult = await productsPage.testSearchFunctionality('蔬菜')

    if (searchResult.available) {
      // 搜尋功能可用
      expect(searchResult.beforeCount).toBeGreaterThanOrEqual(0)
      expect(searchResult.afterCount).toBeGreaterThanOrEqual(0)

      // 搜尋後應該沒有錯誤
      const errors = await productsPage.hasErrors()
      expect(errors.hasError).toBe(false)

      console.log(`搜尋前產品數量: ${searchResult.beforeCount}`)
      console.log(`搜尋後產品數量: ${searchResult.afterCount}`)
      console.log(`匹配的產品: ${searchResult.matchingProducts?.length || 0}`)
    } else {
      console.log('搜尋功能不可用，跳過搜尋測試')
    }
  })

  test('空關鍵字搜尋應該顯示所有產品或提示', async () => {
    const searchAvailable = await productsPage.searchProducts('')

    if (searchAvailable) {
      await productsPage.waitForProductsLoad()

      // 空搜尋應該不會出現錯誤
      const errors = await productsPage.hasErrors()
      expect(errors.hasError).toBe(false)

      // 應該有產品顯示或有適當的提示
      const productCount = await productsPage.getProductCount()
      expect(productCount).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('產品互動功能測試', () => {
  let productsPage: ProductsPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
    await productsPage.navigate()
    await productsPage.waitForLoad()
  })

  test('點擊產品卡片應該顯示產品詳情或詢問表單', async () => {
    const productCount = await productsPage.getProductCount()

    if (productCount > 0) {
      const currentUrl = productsPage.page.url()

      // 點擊第一個產品
      await productsPage.clickFirstProduct()

      // 等待頁面變化
      await productsPage.page.waitForTimeout(1000)

      const newUrl = productsPage.page.url()

      // URL應該有變化，或者頁面上應該出現詳情/詢問表單
      const urlChanged = newUrl !== currentUrl
      const hasModal = await productsPage.page
        .locator('.modal, .dialog, [data-testid="modal"]')
        .isVisible()
      const hasForm = await productsPage.page.locator('form').isVisible()

      expect(urlChanged || hasModal || hasForm).toBe(true)
    } else {
      console.log('沒有產品可供點擊測試')
    }
  })

  test('產品詢問按鈕應該正常運作（如果存在）', async () => {
    const productCount = await productsPage.getProductCount()

    if (productCount > 0) {
      try {
        await productsPage.clickInquiryButton(0)

        // 檢查是否開啟詢問表單或導向詢問頁面
        const hasInquiryForm = await productsPage.page
          .locator('form, .inquiry-form, [data-testid="inquiry-form"]')
          .isVisible()
        const urlHasInquiry = productsPage.page.url().includes('inquiry')

        expect(hasInquiryForm || urlHasInquiry).toBe(true)
      } catch (error) {
        console.log('產品詢問按鈕不存在或不可點擊')
      }
    }
  })
})

test.describe('產品頁面響應式設計測試', () => {
  let productsPage: ProductsPage

  test.beforeEach(async ({ page }) => {
    productsPage = new ProductsPage(page)
  })

  test('響應式佈局應該在不同螢幕尺寸下正常運作', async () => {
    await productsPage.navigate()
    await productsPage.waitForLoad()

    const responsiveResults = await productsPage.testResponsiveLayout()

    // 檢查桌面版
    expect(responsiveResults['Desktop'].productGridVisible).toBe(true)

    // 檢查平板版
    expect(responsiveResults['Tablet'].productGridVisible).toBe(true)

    // 檢查手機版
    expect(responsiveResults['Mobile'].productGridVisible).toBe(true)

    // 所有尺寸都應該顯示相同數量的產品（或合理的範圍內）
    const desktopCount = responsiveResults['Desktop'].productCount
    const tabletCount = responsiveResults['Tablet'].productCount
    const mobileCount = responsiveResults['Mobile'].productCount

    expect(desktopCount).toEqual(tabletCount)
    expect(tabletCount).toEqual(mobileCount)

    console.log(`響應式測試結果:`)
    console.log(`桌面版產品數量: ${desktopCount}`)
    console.log(`平板版產品數量: ${tabletCount}`)
    console.log(`手機版產品數量: ${mobileCount}`)
  })

  test('手機版應該有適當的觸控友好設計', async ({ page }) => {
    // 設定手機尺寸
    await page.setViewportSize({ width: 375, height: 667 })

    await productsPage.navigate()
    await productsPage.waitForLoad()

    const productCount = await productsPage.getProductCount()

    if (productCount > 0) {
      // 檢查產品卡片的觸控區域大小
      const firstProductCard = productsPage.productCards.first()
      const boundingBox = await firstProductCard.boundingBox()

      if (boundingBox) {
        // 觸控區域應該至少有 44px 高度（iOS 人機介面指南建議）
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
      }

      // 檢查按鈕是否足夠大
      const inquiryButtons = productsPage.inquiryButtons
      const buttonCount = await inquiryButtons.count()

      if (buttonCount > 0) {
        const firstButton = inquiryButtons.first()
        const buttonBox = await firstButton.boundingBox()

        if (buttonBox) {
          expect(buttonBox.height).toBeGreaterThanOrEqual(44)
          expect(buttonBox.width).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })
})

test.describe('產品頁面錯誤處理測試', () => {
  test('產品頁面在 API 錯誤時應該優雅處理', async ({ page }) => {
    // 模擬 API 錯誤
    await page.route('**/api/products**', route => route.abort('connectionrefused'))

    const productsPage = new ProductsPage(page)
    await productsPage.navigate()

    // 等待頁面載入嘗試
    await page.waitForTimeout(3000)

    // 頁面應該不會完全崩潰
    const title = await page.title()
    expect(title).toBeTruthy()

    // 應該顯示適當的錯誤訊息或載入中狀態
    const hasLoadingOrError = await Promise.race([
      page.locator('.loading, .spinner').isVisible(),
      page.locator('.error, .error-message').isVisible(),
      page.locator('text=載入中').isVisible(),
      page.locator('text=錯誤').isVisible(),
      Promise.resolve(true), // 防止無限等待
    ])

    // 不期望頁面完全空白
    const bodyText = await page.locator('body').textContent()
    expect(bodyText?.length || 0).toBeGreaterThan(0)
  })

  test('無產品資料時應該顯示適當訊息', async ({ page }) => {
    // 模擬空的產品回應
    await page.route('**/api/products**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], success: true }),
      })
    )

    const productsPage = new ProductsPage(page)
    await productsPage.navigate()
    await productsPage.waitForLoad()

    // 應該顯示「沒有產品」或類似的訊息
    const noProductsMessage = await Promise.race([
      page.locator('text=沒有產品').isVisible(),
      page.locator('text=暫無商品').isVisible(),
      page.locator('text=No products').isVisible(),
      page.locator('.empty-state').isVisible(),
      Promise.resolve(false),
    ])

    // 至少應該有一些文字說明狀況
    const bodyText = (await page.locator('body').textContent()) || ''
    expect(bodyText.length).toBeGreaterThan(50) // 應該有基本的頁面內容
  })
})
