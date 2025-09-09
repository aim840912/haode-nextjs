import { Page, expect } from '@playwright/test'
import { testTimeouts } from '../fixtures/test-data'

/**
 * 測試輔助函數
 *
 * 提供常用的測試操作和斷言，減少重複程式碼
 */

/**
 * 等待頁面載入完成
 */
export async function waitForPageLoad(page: Page, timeout = testTimeouts.navigation) {
  await page.waitForLoadState('networkidle', { timeout })
}

/**
 * 等待元素出現
 */
export async function waitForElement(page: Page, selector: string, timeout = testTimeouts.medium) {
  await page.waitForSelector(selector, { timeout })
}

/**
 * 安全的頁面導航
 */
export async function navigateToPage(page: Page, url: string) {
  await page.goto(url)
  await waitForPageLoad(page)
}

/**
 * 填寫表單欄位
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [fieldName, value] of Object.entries(formData)) {
    const selector = `input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`
    await page.fill(selector, value)
  }
}

/**
 * 點擊按鈕並等待回應
 */
export async function clickAndWait(page: Page, selector: string, waitFor?: string) {
  await page.click(selector)

  if (waitFor) {
    await page.waitForSelector(waitFor)
  } else {
    await page.waitForLoadState('networkidle')
  }
}

/**
 * 檢查元素是否可見
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector)
    return await element.isVisible()
  } catch {
    return false
  }
}

/**
 * 檢查元素文字內容
 */
export async function expectElementText(page: Page, selector: string, expectedText: string) {
  const element = page.locator(selector)
  await expect(element).toContainText(expectedText)
}

/**
 * 等待 API 請求完成
 */
export async function waitForApiResponse(page: Page, apiPath: string, timeout = testTimeouts.api) {
  const responsePromise = page.waitForResponse(
    response => response.url().includes(apiPath) && response.status() === 200,
    { timeout }
  )
  return responsePromise
}

/**
 * 截圖並儲存（用於除錯）
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `screenshot-${name}-${timestamp}.png`
  await page.screenshot({
    path: `tests/e2e/results/${filename}`,
    fullPage: true,
  })
  return filename
}

/**
 * 驗證頁面標題
 */
export async function expectPageTitle(page: Page, expectedTitle: string) {
  await expect(page).toHaveTitle(expectedTitle)
}

/**
 * 驗證頁面 URL
 */
export async function expectPageUrl(page: Page, expectedPath: string) {
  await expect(page).toHaveURL(new RegExp(`.*${expectedPath}.*`))
}

/**
 * 等待並處理彈出對話框
 */
export async function handleDialog(page: Page, accept = true) {
  page.on('dialog', async dialog => {
    if (accept) {
      await dialog.accept()
    } else {
      await dialog.dismiss()
    }
  })
}

/**
 * 驗證響應式設計 - 檢查元素在不同螢幕尺寸下的顯示
 */
export async function checkResponsiveElement(
  page: Page,
  selector: string,
  viewports: Array<{ name: string; width: number; height: number }>
) {
  const results: Record<string, boolean> = {}

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(500) // 等待元素調整
    results[viewport.name] = await isElementVisible(page, selector)
  }

  return results
}

/**
 * 清理測試資料（如果需要）
 */
export async function cleanupTestData(page: Page, dataType: string) {
  // 這裡可以實作清理邏輯，例如刪除測試期間建立的資料
  console.log(`Cleaning up test data for: ${dataType}`)
}

/**
 * 生成隨機測試資料
 */
export function generateTestData(type: 'email' | 'phone' | 'name' | 'company'): string {
  const timestamp = Date.now()

  switch (type) {
    case 'email':
      return `test-${timestamp}@haude-test.com`
    case 'phone':
      return `0912${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`
    case 'name':
      return `測試用戶${timestamp}`
    case 'company':
      return `測試公司${timestamp}`
    default:
      return `test-data-${timestamp}`
  }
}

/**
 * 模擬使用者操作延遲
 */
export async function humanDelay(page: Page, min = 500, max = 1500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  await page.waitForTimeout(delay)
}

/**
 * 驗證表單驗證錯誤
 */
export async function expectValidationError(page: Page, fieldName: string, errorMessage?: string) {
  const errorSelector = `[data-testid="${fieldName}-error"], .error, .invalid-feedback`
  await waitForElement(page, errorSelector)

  if (errorMessage) {
    await expectElementText(page, errorSelector, errorMessage)
  }
}
