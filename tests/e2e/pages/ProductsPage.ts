import { Page, Locator } from '@playwright/test'
import { navigateToPage, waitForPageLoad, fillForm, clickAndWait } from '../utils/test-helpers'

/**
 * 產品頁面 Page Object
 *
 * 封裝產品頁面的所有元素和操作
 */
export class ProductsPage {
  readonly page: Page

  // 主要區塊
  readonly productGrid: Locator
  readonly searchSection: Locator
  readonly filterSection: Locator
  readonly loadingIndicator: Locator

  // 搜尋和篩選
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly categoryFilter: Locator
  readonly priceFilter: Locator

  // 產品卡片元素
  readonly productCards: Locator
  readonly productNames: Locator
  readonly productPrices: Locator
  readonly productImages: Locator
  readonly inquiryButtons: Locator

  constructor(page: Page) {
    this.page = page

    // 主要區塊
    this.productGrid = page
      .locator('.products-grid, .product-list, [data-testid="products-grid"]')
      .first()
    this.searchSection = page.locator('.search-section, [data-testid="search-section"]').first()
    this.filterSection = page.locator('.filter-section, [data-testid="filter-section"]').first()
    this.loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]').first()

    // 搜尋和篩選元素
    this.searchInput = page.locator(
      'input[placeholder*="搜尋"], input[type="search"], [data-testid="search-input"]'
    )
    this.searchButton = page.locator('button:has-text("搜尋"), [data-testid="search-button"]')
    this.categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]')
    this.priceFilter = page.locator('select[name="price"], [data-testid="price-filter"]')

    // 產品卡片相關元素
    this.productCards = page.locator('.product-card, [data-testid="product-card"]')
    this.productNames = page.locator('.product-name, [data-testid="product-name"]')
    this.productPrices = page.locator('.product-price, [data-testid="product-price"]')
    this.productImages = page.locator('.product-image, [data-testid="product-image"]')
    this.inquiryButtons = page.locator('button:has-text("詢問"), [data-testid="inquiry-button"]')
  }

  /**
   * 導航到產品頁面
   */
  async navigate() {
    await navigateToPage(this.page, '/products')
  }

  /**
   * 等待產品頁面載入完成
   */
  async waitForLoad() {
    await waitForPageLoad(this.page)

    // 等待產品網格出現或載入指示器消失
    try {
      await Promise.race([
        this.productGrid.waitFor({ state: 'visible', timeout: 10000 }),
        this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }),
      ])
    } catch {
      // 如果都沒有出現，至少等待基本的頁面載入
      console.warn('Products page load timeout, but continuing...')
    }
  }

  /**
   * 取得產品數量
   */
  async getProductCount(): Promise<number> {
    await this.productCards
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {})
    return await this.productCards.count()
  }

  /**
   * 取得所有產品名稱
   */
  async getProductNames(): Promise<string[]> {
    const count = await this.getProductCount()
    if (count === 0) return []

    const names: string[] = []
    for (let i = 0; i < count; i++) {
      const name = await this.productNames.nth(i).textContent()
      if (name) names.push(name.trim())
    }
    return names
  }

  /**
   * 搜尋產品
   */
  async searchProducts(keyword: string) {
    try {
      await this.searchInput.fill(keyword)
      await this.searchButton.click()
      await this.waitForLoad()
      return true
    } catch (error) {
      console.warn('Search functionality not available:', error)
      return false
    }
  }

  /**
   * 選擇產品類別篩選
   */
  async selectCategory(category: string) {
    try {
      await this.categoryFilter.selectOption(category)
      await this.waitForLoad()
      return true
    } catch (error) {
      console.warn('Category filter not available:', error)
      return false
    }
  }

  /**
   * 點擊特定產品卡片
   */
  async clickProduct(index: number) {
    const productCount = await this.getProductCount()
    if (index >= productCount) {
      throw new Error(
        `Product index ${index} out of range. Only ${productCount} products available.`
      )
    }

    await this.productCards.nth(index).click()
    await waitForPageLoad(this.page)
  }

  /**
   * 點擊第一個可用的產品
   */
  async clickFirstProduct() {
    const productCount = await this.getProductCount()
    if (productCount === 0) {
      throw new Error('No products available to click')
    }

    await this.clickProduct(0)
  }

  /**
   * 點擊產品詢問按鈕
   */
  async clickInquiryButton(productIndex = 0) {
    const inquiryCount = await this.inquiryButtons.count()
    if (inquiryCount === 0) {
      throw new Error('No inquiry buttons found')
    }

    if (productIndex >= inquiryCount) {
      throw new Error(`Inquiry button index ${productIndex} out of range`)
    }

    await this.inquiryButtons.nth(productIndex).click()
    await waitForPageLoad(this.page)
  }

  /**
   * 驗證產品卡片內容
   */
  async verifyProductCard(index: number) {
    const productCount = await this.getProductCount()
    if (index >= productCount) {
      return { valid: false, reason: 'Index out of range' }
    }

    const card = this.productCards.nth(index)

    try {
      const name = await card.locator('.product-name, [data-testid="product-name"]').textContent()
      const price = await card
        .locator('.product-price, [data-testid="product-price"]')
        .textContent()
      const image = card.locator('img, [data-testid="product-image"]')

      return {
        valid: true,
        hasName: !!name && name.trim().length > 0,
        hasPrice: !!price && price.trim().length > 0,
        hasImage: (await image.count()) > 0,
        name: name?.trim(),
        price: price?.trim(),
      }
    } catch (error) {
      return {
        valid: false,
        reason: `Error verifying product card: ${error}`,
      }
    }
  }

  /**
   * 驗證所有可見產品卡片
   */
  async verifyAllProductCards() {
    const productCount = await this.getProductCount()
    const results = []

    for (let i = 0; i < Math.min(productCount, 5); i++) {
      // 限制檢查前5個
      const cardInfo = await this.verifyProductCard(i)
      results.push({ index: i, ...cardInfo })
    }

    return results
  }

  /**
   * 檢查頁面載入效能
   */
  async checkLoadPerformance() {
    const startTime = Date.now()
    await this.navigate()
    await this.waitForLoad()
    const loadTime = Date.now() - startTime

    return {
      loadTime,
      isPerformant: loadTime < 5000, // 5秒內載入算良好
      productCount: await this.getProductCount(),
    }
  }

  /**
   * 測試響應式設計
   */
  async testResponsiveLayout() {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ]

    const results: Record<string, any> = {}

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport)
      await this.page.waitForTimeout(500)

      results[viewport.name] = {
        productGridVisible: await this.productGrid.isVisible(),
        searchVisible: await this.searchInput.isVisible().catch(() => false),
        productCount: await this.getProductCount(),
      }
    }

    return results
  }

  /**
   * 驗證搜尋功能
   */
  async testSearchFunctionality(keyword: string) {
    // 記錄搜尋前的產品數量
    await this.navigate()
    await this.waitForLoad()
    const beforeCount = await this.getProductCount()

    // 執行搜尋
    const searchWorked = await this.searchProducts(keyword)
    if (!searchWorked) {
      return { available: false }
    }

    // 記錄搜尋後的產品數量
    const afterCount = await this.getProductCount()
    const productNames = await this.getProductNames()

    return {
      available: true,
      beforeCount,
      afterCount,
      searchTerm: keyword,
      resultsChanged: beforeCount !== afterCount,
      matchingProducts: productNames.filter(name =>
        name.toLowerCase().includes(keyword.toLowerCase())
      ),
    }
  }

  /**
   * 檢查是否有錯誤狀態
   */
  async hasErrors() {
    const errorSelectors = [
      '.error',
      '.error-message',
      '[data-testid="error"]',
      'text=找不到產品',
      'text=載入失敗',
      'text=錯誤',
    ]

    for (const selector of errorSelectors) {
      try {
        const element = this.page.locator(selector)
        if (await element.isVisible()) {
          return {
            hasError: true,
            errorText: await element.textContent(),
          }
        }
      } catch {
        // 忽略找不到元素的錯誤
      }
    }

    return { hasError: false, errorText: null }
  }

  /**
   * 等待產品載入完成
   */
  async waitForProductsLoad() {
    // 等待載入指示器消失或產品出現
    try {
      await Promise.race([
        this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }),
        this.productCards.first().waitFor({ state: 'visible', timeout: 10000 }),
      ])
    } catch {
      // 超時也繼續，可能沒有載入指示器
    }
  }
}
