import { Page, Locator } from '@playwright/test'
import { navigateToPage, waitForPageLoad, fillForm } from '../utils/test-helpers'
import { testUsers } from '../fixtures/test-data'

/**
 * 登入頁面 Page Object
 *
 * 封裝登入頁面的所有元素和操作
 */
export class LoginPage {
  readonly page: Page

  // 表單元素
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly rememberMeCheckbox: Locator

  // 連結和按鈕
  readonly forgotPasswordLink: Locator
  readonly registerLink: Locator
  readonly backToHomeLink: Locator

  // 訊息顯示
  readonly errorMessage: Locator
  readonly successMessage: Locator
  readonly loadingIndicator: Locator

  // 頁面區塊
  readonly loginForm: Locator
  readonly loginContainer: Locator

  constructor(page: Page) {
    this.page = page

    // 表單元素
    this.emailInput = page.locator('input[name="email"], input[type="email"], #email')
    this.passwordInput = page.locator('input[name="password"], input[type="password"], #password')
    this.loginButton = page.locator(
      'button[type="submit"], button:has-text("登入"), button:has-text("Login")'
    )
    this.rememberMeCheckbox = page.locator(
      'input[type="checkbox"][name="remember"], input[id="remember"]'
    )

    // 連結
    this.forgotPasswordLink = page.locator(
      'a:has-text("忘記密碼"), a[href*="forgot"], a[href*="reset"]'
    )
    this.registerLink = page.locator(
      'a:has-text("註冊"), a:has-text("Register"), a[href*="register"]'
    )
    this.backToHomeLink = page.locator('a:has-text("回到首頁"), a[href="/"]')

    // 訊息元素
    this.errorMessage = page.locator('.error, .error-message, [data-testid="error"], .alert-danger')
    this.successMessage = page.locator(
      '.success, .success-message, [data-testid="success"], .alert-success'
    )
    this.loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]')

    // 頁面區塊
    this.loginForm = page.locator('form, .login-form, [data-testid="login-form"]')
    this.loginContainer = page.locator(
      '.login-container, .auth-container, [data-testid="login-container"]'
    )
  }

  /**
   * 導航到登入頁面
   */
  async navigate() {
    await navigateToPage(this.page, '/login')
  }

  /**
   * 等待登入頁面載入完成
   */
  async waitForLoad() {
    await waitForPageLoad(this.page)
    // 等待表單出現
    await this.loginForm.waitFor({ state: 'visible', timeout: 10000 })
  }

  /**
   * 執行登入操作
   */
  async login(email: string, password: string, rememberMe = false) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)

    if (rememberMe) {
      await this.rememberMeCheckbox.check()
    }

    await this.loginButton.click()

    // 等待頁面反應
    await this.page.waitForTimeout(1000)
  }

  /**
   * 使用管理員帳號登入
   */
  async loginAsAdmin() {
    await this.login(testUsers.admin.email, testUsers.admin.password)
  }

  /**
   * 使用一般使用者帳號登入
   */
  async loginAsUser() {
    await this.login(testUsers.user.email, testUsers.user.password)
  }

  /**
   * 嘗試無效的登入
   */
  async attemptInvalidLogin() {
    await this.login('invalid@test.com', 'wrongpassword')
  }

  /**
   * 檢查是否登入成功
   */
  async isLoginSuccessful(): Promise<boolean> {
    try {
      // 檢查是否重定向到其他頁面（不是登入頁）
      await this.page.waitForTimeout(2000)
      const currentUrl = this.page.url()

      // 如果還在登入頁面，通常表示登入失敗
      if (currentUrl.includes('/login')) {
        return false
      }

      // 檢查是否有成功訊息或用戶選單
      const hasUserMenu = await this.page
        .locator('.user-menu, [data-testid="user-menu"]')
        .isVisible()
        .catch(() => false)
      const hasLogoutButton = await this.page
        .locator('text=登出, text=Logout')
        .isVisible()
        .catch(() => false)

      return hasUserMenu || hasLogoutButton || !currentUrl.includes('/login')
    } catch {
      return false
    }
  }

  /**
   * 檢查錯誤訊息
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 })
      return await this.errorMessage.textContent()
    } catch {
      return null
    }
  }

  /**
   * 檢查是否有錯誤訊息顯示
   */
  async hasError(): Promise<boolean> {
    const errorText = await this.getErrorMessage()
    return errorText !== null && errorText.length > 0
  }

  /**
   * 清空表單
   */
  async clearForm() {
    await this.emailInput.fill('')
    await this.passwordInput.fill('')
  }

  /**
   * 驗證表單欄位
   */
  async verifyFormElements() {
    const checks = [
      { element: this.emailInput, name: 'Email輸入框' },
      { element: this.passwordInput, name: '密碼輸入框' },
      { element: this.loginButton, name: '登入按鈕' },
    ]

    const results: Record<string, boolean> = {}

    for (const check of checks) {
      try {
        await check.element.waitFor({ state: 'visible', timeout: 3000 })
        results[check.name] = true
      } catch {
        results[check.name] = false
      }
    }

    return results
  }

  /**
   * 測試表單驗證
   */
  async testFormValidation() {
    // 測試空白表單提交
    await this.clearForm()
    await this.loginButton.click()
    await this.page.waitForTimeout(1000)

    const emptyFormError = await this.hasError()

    // 測試無效email格式
    await this.emailInput.fill('invalid-email')
    await this.passwordInput.fill('somepassword')
    await this.loginButton.click()
    await this.page.waitForTimeout(1000)

    const invalidEmailError = await this.hasError()

    return {
      emptyFormValidation: emptyFormError,
      emailValidation: invalidEmailError,
    }
  }

  /**
   * 點擊忘記密碼連結
   */
  async clickForgotPassword() {
    try {
      await this.forgotPasswordLink.click()
      await waitForPageLoad(this.page)
      return true
    } catch {
      return false
    }
  }

  /**
   * 點擊註冊連結
   */
  async clickRegisterLink() {
    try {
      await this.registerLink.click()
      await waitForPageLoad(this.page)
      return true
    } catch {
      return false
    }
  }

  /**
   * 測試登入流程效能
   */
  async testLoginPerformance(email: string, password: string) {
    const startTime = Date.now()

    await this.login(email, password)

    // 等待登入完成（成功或失敗）
    await Promise.race([
      this.page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {})

    const endTime = Date.now()
    const loginTime = endTime - startTime

    return {
      loginTime,
      isPerformant: loginTime < 5000, // 5秒內完成登入
      successful: await this.isLoginSuccessful(),
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
        formVisible: await this.loginForm.isVisible(),
        emailInputVisible: await this.emailInput.isVisible(),
        passwordInputVisible: await this.passwordInput.isVisible(),
        loginButtonVisible: await this.loginButton.isVisible(),
      }
    }

    return results
  }

  /**
   * 檢查頁面安全性標頭
   */
  async checkSecurityFeatures() {
    const response = await this.page.goto('/login')
    const headers = response?.headers() || {}

    return {
      hasCSP: !!headers['content-security-policy'],
      hasXFrameOptions: !!headers['x-frame-options'],
      isHTTPS: this.page.url().startsWith('https://'),
      response: response?.status(),
    }
  }

  /**
   * 等待載入指示器消失
   */
  async waitForLoadingComplete() {
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 })
    } catch {
      // 載入指示器可能不存在，繼續進行
    }
  }

  /**
   * 完整登入流程測試
   */
  async performCompleteLoginTest(email: string, password: string) {
    await this.navigate()
    await this.waitForLoad()

    const formElements = await this.verifyFormElements()

    await this.login(email, password)
    await this.waitForLoadingComplete()

    const loginSuccess = await this.isLoginSuccessful()
    const errorMessage = await this.getErrorMessage()

    return {
      formElementsPresent: Object.values(formElements).every(Boolean),
      loginAttempted: true,
      loginSuccessful: loginSuccess,
      errorMessage,
      finalUrl: this.page.url(),
    }
  }
}
