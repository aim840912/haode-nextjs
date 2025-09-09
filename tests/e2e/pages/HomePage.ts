import { Page, Locator } from '@playwright/test'
import { navigateToPage, waitForPageLoad, expectElementText } from '../utils/test-helpers'

/**
 * 首頁 Page Object
 *
 * 封裝首頁的所有元素和操作，提供乾淨的測試介面
 */
export class HomePage {
  readonly page: Page

  // 元素選擇器
  readonly heroSection: Locator
  readonly navigationMenu: Locator
  readonly productsSection: Locator
  readonly newsSection: Locator
  readonly footer: Locator

  // 導航連結
  readonly homeLink: Locator
  readonly productsLink: Locator
  readonly newsLink: Locator
  readonly cultureLink: Locator
  readonly contactLink: Locator
  readonly loginLink: Locator
  readonly adminLink: Locator

  // 功能按鈕
  readonly inquiryButton: Locator
  readonly moreProductsButton: Locator
  readonly moreNewsButton: Locator

  constructor(page: Page) {
    this.page = page

    // 初始化元素選擇器 - 根據實際頁面結構調整
    this.heroSection = page.locator('section').first() // 首頁的主要 section
    this.navigationMenu = page.locator('nav, header').first()
    this.productsSection = page
      .locator('section:has-text("農場特色"), section:has-text("農產品")')
      .first()
    this.newsSection = page
      .locator('section:has-text("最新消息"), section:has-text("新聞")')
      .first()
    this.footer = page.locator('footer').first()

    // 導航連結
    this.homeLink = page.locator('a[href="/"]')
    this.productsLink = page.locator('a[href="/products"]')
    this.newsLink = page.locator('a[href="/news"]')
    this.cultureLink = page.locator('a[href="/culture"]')
    this.contactLink = page.locator('a[href="/contact"]')
    this.loginLink = page.locator('a[href="/login"]')
    this.adminLink = page.locator('a[href="/admin"]')

    // 功能按鈕
    this.inquiryButton = page
      .locator('text=立即詢問, text=詢問產品, [data-testid="inquiry-button"]')
      .first()
    this.moreProductsButton = page
      .locator('text=查看更多產品, text=更多產品, [data-testid="more-products"]')
      .first()
    this.moreNewsButton = page
      .locator('text=查看更多消息, text=更多新聞, [data-testid="more-news"]')
      .first()
  }

  /**
   * 導航到首頁
   */
  async navigate() {
    await navigateToPage(this.page, '/')
  }

  /**
   * 等待首頁完全載入
   */
  async waitForLoad() {
    await waitForPageLoad(this.page)
    // 等待關鍵元素出現，確保頁面渲染完成
    await this.heroSection.waitFor({ state: 'visible', timeout: 10000 })
  }

  /**
   * 檢查頁面基本元素是否存在
   */
  async verifyPageElements() {
    const checks = [
      { element: this.heroSection, name: '主要區塊' },
      { element: this.navigationMenu, name: '導航選單' },
      { element: this.footer, name: '頁尾' },
    ]

    const results: Record<string, boolean> = {}
    for (const check of checks) {
      try {
        await check.element.waitFor({ state: 'visible', timeout: 5000 })
        results[check.name] = true
      } catch {
        results[check.name] = false
      }
    }

    return results
  }

  /**
   * 檢查導航功能
   */
  async testNavigation(linkName: 'products' | 'news' | 'culture' | 'contact' | 'login') {
    const linkMap = {
      products: { element: this.productsLink, expectedUrl: '/products' },
      news: { element: this.newsLink, expectedUrl: '/news' },
      culture: { element: this.cultureLink, expectedUrl: '/culture' },
      contact: { element: this.contactLink, expectedUrl: '/contact' },
      login: { element: this.loginLink, expectedUrl: '/login' },
    }

    const linkInfo = linkMap[linkName]
    await linkInfo.element.click()

    // 等待頁面導航完成
    await this.page.waitForURL(`**${linkInfo.expectedUrl}**`)
    await waitForPageLoad(this.page)

    return this.page.url().includes(linkInfo.expectedUrl)
  }

  /**
   * 搜尋產品（如果首頁有搜尋功能）
   */
  async searchProducts(keyword: string) {
    const searchInput = this.page
      .locator('input[placeholder*="搜尋"], input[type="search"], [data-testid="search-input"]')
      .first()
    const searchButton = this.page
      .locator('button:has-text("搜尋"), [data-testid="search-button"]')
      .first()

    try {
      await searchInput.fill(keyword)
      await searchButton.click()
      await waitForPageLoad(this.page)
      return true
    } catch {
      return false
    }
  }

  /**
   * 點擊產品詢問按鈕
   */
  async clickInquiryButton() {
    await this.inquiryButton.click()
    await waitForPageLoad(this.page)
  }

  /**
   * 檢查產品展示區塊
   */
  async verifyProductsSection() {
    try {
      await this.productsSection.waitFor({ state: 'visible', timeout: 5000 })

      // 檢查是否有產品卡片
      const productCards = this.page.locator('.product-card, [data-testid="product-card"]')
      const count = await productCards.count()

      return {
        visible: true,
        hasProducts: count > 0,
        productCount: count,
      }
    } catch {
      return {
        visible: false,
        hasProducts: false,
        productCount: 0,
      }
    }
  }

  /**
   * 檢查新聞展示區塊
   */
  async verifyNewsSection() {
    try {
      await this.newsSection.waitFor({ state: 'visible', timeout: 5000 })

      // 檢查是否有新聞項目
      const newsItems = this.page.locator('.news-item, .news-card, [data-testid="news-item"]')
      const count = await newsItems.count()

      return {
        visible: true,
        hasNews: count > 0,
        newsCount: count,
      }
    } catch {
      return {
        visible: false,
        hasNews: false,
        newsCount: 0,
      }
    }
  }

  /**
   * 驗證頁面響應式設計
   */
  async testResponsiveDesign() {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ]

    const results: Record<string, any> = {}

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport)
      await this.page.waitForTimeout(500) // 等待響應式調整

      results[viewport.name] = {
        heroVisible: await this.heroSection.isVisible(),
        navigationVisible: await this.navigationMenu.isVisible(),
        footerVisible: await this.footer.isVisible(),
      }
    }

    return results
  }

  /**
   * 取得頁面標題
   */
  async getPageTitle() {
    return await this.page.title()
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
      isPerformant: loadTime < 3000, // 3秒內載入完成算是良好效能
    }
  }

  /**
   * 檢查是否有錯誤訊息
   */
  async hasErrors() {
    const errorSelectors = [
      '.error',
      '.error-message',
      '[data-testid="error"]',
      'text=錯誤',
      'text=Error',
      'text=失敗',
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
}
