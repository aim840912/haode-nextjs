/**
 * E2E 測試資料
 *
 * 包含測試過程中需要使用的假資料，避免測試相互影響
 */

export const testUsers = {
  // 管理員測試帳號
  admin: {
    email: 'admin@haude-test.com',
    password: 'Test123!@#',
    name: '測試管理員',
    role: 'admin',
  },

  // 一般使用者測試帳號
  user: {
    email: 'user@haude-test.com',
    password: 'Test123!@#',
    name: '測試使用者',
    role: 'user',
  },
}

export const testProducts = [
  {
    id: 'test-product-1',
    name: '測試有機蔬菜',
    category: '蔬菜類',
    price: 150,
    unit: '包',
    description: '新鮮有機蔬菜，適合測試使用',
    image: '/images/test-vegetable.jpg',
    available: true,
  },
  {
    id: 'test-product-2',
    name: '測試水果禮盒',
    category: '水果類',
    price: 580,
    unit: '盒',
    description: '精選水果禮盒，測試專用',
    image: '/images/test-fruit.jpg',
    available: true,
  },
]

export const testInquiry = {
  customerInfo: {
    name: '測試客戶',
    phone: '0912345678',
    email: 'test-customer@example.com',
    company: '測試公司',
  },
  message: '這是一個測試詢問訊息，請問產品是否有現貨？',
  product: testProducts[0],
}

export const testNews = {
  title: '【測試】豪德農場最新消息',
  subtitle: '測試用新聞副標題',
  content: '這是一則測試用的新聞內容，用於驗證新聞系統功能正常運作。',
  category: '產品動態',
  author: '豪德農場',
  image: '/images/test-news.jpg',
}

export const testCulture = {
  title: '測試時光典藏',
  subtitle: '測試副標題',
  description: '這是測試用的時光典藏內容，用於驗證文化頁面功能。',
  height: 'h-64',
  imageUrl: '/images/test-culture.jpg',
}

export const testSelectors = {
  // 通用選擇器
  common: {
    loading: '[data-testid="loading"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
  },

  // 導航選擇器
  navigation: {
    homeLink: 'a[href="/"]',
    productsLink: 'a[href="/products"]',
    newsLink: 'a[href="/news"]',
    cultureLink: 'a[href="/culture"]',
    contactLink: 'a[href="/contact"]',
    loginLink: 'a[href="/login"]',
    adminLink: 'a[href="/admin"]',
  },

  // 產品頁面選擇器
  products: {
    productCard: '[data-testid="product-card"]',
    productImage: '[data-testid="product-image"]',
    productName: '[data-testid="product-name"]',
    productPrice: '[data-testid="product-price"]',
    inquiryButton: '[data-testid="inquiry-button"]',
    searchInput: '[data-testid="search-input"]',
    searchButton: '[data-testid="search-button"]',
  },

  // 登入頁面選擇器
  login: {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[data-testid="login-error"]',
  },

  // 詢問表單選擇器
  inquiry: {
    nameInput: 'input[name="name"]',
    phoneInput: 'input[name="phone"]',
    emailInput: 'input[name="email"]',
    messageTextarea: 'textarea[name="message"]',
    submitButton: 'button[type="submit"]',
  },
}

// 測試用的等待時間
export const testTimeouts = {
  short: 2000, // 2秒 - 短等待
  medium: 5000, // 5秒 - 中等等待
  long: 10000, // 10秒 - 長等待
  navigation: 3000, // 3秒 - 頁面導航
  api: 5000, // 5秒 - API 請求
}

// 測試環境設定
export const testConfig = {
  baseUrl: 'http://localhost:3002',
  viewport: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
}
