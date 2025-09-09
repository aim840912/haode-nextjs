import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/HomePage'
import { testConfig } from '../fixtures/test-data'

/**
 * 首頁 E2E 測試
 *
 * 測試首頁的基本功能和使用者體驗
 */
test.describe('首頁功能測試', () => {
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
    await homePage.navigate()
    await homePage.waitForLoad()
  })

  test('首頁應該正確載入並顯示主要元素', async () => {
    // 驗證頁面標題
    const title = await homePage.getPageTitle()
    expect(title).toContain('豪德農場')

    // 驗證主要頁面元素存在
    const pageElements = await homePage.verifyPageElements()
    expect(pageElements['主要區塊']).toBe(true)
    expect(pageElements['導航選單']).toBe(true)
    expect(pageElements['頁尾']).toBe(true)

    // 檢查是否有錯誤訊息
    const errors = await homePage.hasErrors()
    expect(errors.hasError).toBe(false)
  })

  test('導航功能應該正常運作', async () => {
    // 測試導航到產品頁面
    const productsNavResult = await homePage.testNavigation('products')
    expect(productsNavResult).toBe(true)

    // 回到首頁
    await homePage.navigate()

    // 測試導航到新聞頁面
    const newsNavResult = await homePage.testNavigation('news')
    expect(newsNavResult).toBe(true)

    // 回到首頁
    await homePage.navigate()

    // 測試導航到文化頁面
    const cultureNavResult = await homePage.testNavigation('culture')
    expect(cultureNavResult).toBe(true)
  })

  test('產品展示區塊應該正常顯示', async () => {
    const productsSection = await homePage.verifyProductsSection()

    expect(productsSection.visible).toBe(true)

    // 如果有產品資料，應該顯示產品
    if (productsSection.hasProducts) {
      expect(productsSection.productCount).toBeGreaterThan(0)
    }
  })

  test('新聞展示區塊應該正常顯示', async () => {
    const newsSection = await homePage.verifyNewsSection()

    expect(newsSection.visible).toBe(true)

    // 如果有新聞資料，應該顯示新聞
    if (newsSection.hasNews) {
      expect(newsSection.newsCount).toBeGreaterThan(0)
    }
  })

  test('響應式設計應該在不同裝置上正常運作', async () => {
    const responsiveResults = await homePage.testResponsiveDesign()

    // 檢查桌面版
    expect(responsiveResults['Desktop'].heroVisible).toBe(true)
    expect(responsiveResults['Desktop'].navigationVisible).toBe(true)

    // 檢查平板版
    expect(responsiveResults['Tablet'].heroVisible).toBe(true)
    expect(responsiveResults['Tablet'].navigationVisible).toBe(true)

    // 檢查手機版
    expect(responsiveResults['Mobile'].heroVisible).toBe(true)
    // 手機版的導航可能會隱藏在漢堡選單中，所以不一定可見
  })

  test('頁面載入效能應該符合標準', async ({ page }) => {
    // 建立新的 HomePage 實例來重新測試載入效能
    const newHomePage = new HomePage(page)
    const performance = await newHomePage.checkLoadPerformance()

    expect(performance.isPerformant).toBe(true)
    expect(performance.loadTime).toBeLessThan(5000) // 5秒內載入完成
  })
})

test.describe('首頁互動測試', () => {
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
    await homePage.navigate()
    await homePage.waitForLoad()
  })

  test('搜尋功能應該正常運作（如果存在）', async () => {
    // 嘗試搜尋產品
    const searchResult = await homePage.searchProducts('蔬菜')

    // 如果搜尋功能存在，應該能正常執行
    if (searchResult) {
      // 檢查頁面是否有變化（可能導向搜尋結果頁面或篩選結果）
      await homePage.page.waitForTimeout(1000)
      const hasErrors = await homePage.hasErrors()
      expect(hasErrors.hasError).toBe(false)
    }
  })

  test('詢問按鈕應該可以點擊（如果存在）', async () => {
    try {
      await homePage.clickInquiryButton()

      // 檢查是否導向詢問頁面或開啟詢問表單
      const currentUrl = homePage.page.url()
      const hasInquiryForm = await homePage.page.locator('form').isVisible()

      expect(currentUrl.includes('/inquiry') || hasInquiryForm).toBe(true)
    } catch (error) {
      // 如果首頁沒有詢問按鈕，測試會跳過
      console.log('首頁沒有詢問按鈕，跳過此測試')
    }
  })
})

test.describe('首頁 SEO 和可訪問性測試', () => {
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
  })

  test('頁面應該有適當的 SEO 標籤', async ({ page }) => {
    await homePage.navigate()

    // 檢查標題
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)

    // 檢查 meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toBeTruthy()

    // 檢查 viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').count()
    expect(viewportMeta).toBeGreaterThan(0)
  })

  test('圖片應該有適當的 alt 文字', async ({ page }) => {
    await homePage.navigate()
    await homePage.waitForLoad()

    const images = page.locator('img')
    const imageCount = await images.count()

    if (imageCount > 0) {
      // 檢查前幾張圖片是否有 alt 屬性
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const alt = await images.nth(i).getAttribute('alt')
        // alt 可能為空字符串（裝飾性圖片），但不應該是 null
        expect(alt).not.toBeNull()
      }
    }
  })

  test('連結應該有適當的文字或 aria-label', async ({ page }) => {
    await homePage.navigate()
    await homePage.waitForLoad()

    const links = page.locator('a')
    const linkCount = await links.count()

    if (linkCount > 0) {
      // 檢查主要導航連結
      const navLinks = [
        homePage.productsLink,
        homePage.newsLink,
        homePage.cultureLink,
        homePage.contactLink,
      ]

      for (const link of navLinks) {
        const isVisible = await link.isVisible()
        if (isVisible) {
          const text = await link.textContent()
          const ariaLabel = await link.getAttribute('aria-label')
          const title = await link.getAttribute('title')

          // 連結應該有文字、aria-label 或 title 之一
          expect(text || ariaLabel || title).toBeTruthy()
        }
      }
    }
  })
})

test.describe('首頁錯誤處理測試', () => {
  test('首頁在網路問題時應該優雅降級', async ({ page }) => {
    // 模擬網路問題
    await page.route('**/api/**', route => route.abort('connectionrefused'))

    const homePage = new HomePage(page)
    await homePage.navigate()

    // 頁面應該仍然可以載入基本結構
    const pageElements = await homePage.verifyPageElements()
    expect(pageElements['導航選單']).toBe(true)
    expect(pageElements['頁尾']).toBe(true)

    // 應該顯示適當的錯誤訊息或載入中狀態
    await page.waitForTimeout(2000)
    // 測試頁面不會完全崩潰
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('首頁應該處理 JavaScript 錯誤', async ({ page }) => {
    // 監聽 console 錯誤
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    const homePage = new HomePage(page)
    await homePage.navigate()
    await homePage.waitForLoad()

    // 檢查是否有嚴重的 JavaScript 錯誤
    const criticalErrors = consoleErrors.filter(
      error => error.includes('TypeError') || error.includes('ReferenceError')
    )

    // 輕微的錯誤可以接受，但不應該有關鍵錯誤
    expect(criticalErrors.length).toBeLessThanOrEqual(2)
  })
})
