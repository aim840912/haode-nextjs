/**
 * 統一的格式化工具函數
 *
 * 提供可重用的資料格式化邏輯，避免程式碼重複
 */

/**
 * 格式化台灣日期
 *
 * @example
 * ```ts
 * formatDate(new Date('2025-01-15'), 'full')
 * // "2025年1月15日 星期三"
 *
 * formatDate('2025-01-15', 'short')
 * // "2025/01/15"
 *
 * formatDate('2025-01-15', 'medium')
 * // "2025年1月15日"
 * ```
 */
export function formatDate(
  date: string | Date,
  format: 'full' | 'short' | 'medium' | 'time' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // 檢查日期有效性
  if (isNaN(d.getTime())) {
    return '無效日期'
  }

  switch (format) {
    case 'short':
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

    case 'medium':
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

    case 'full':
      return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })

    case 'time':
      return d.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      })

    default:
      return d.toLocaleDateString('zh-TW')
  }
}

/**
 * 格式化日期時間
 *
 * @example
 * ```ts
 * formatDateTime(new Date())
 * // "2025年1月15日 14:30"
 * ```
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return '無效日期'
  }

  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化相對時間（多久之前）
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5))
 * // "5 分鐘前"
 *
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 60 * 24))
 * // "1 天前"
 * ```
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return '無效日期'
  }

  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) {
    return '剛剛'
  } else if (minutes < 60) {
    return `${minutes} 分鐘前`
  } else if (hours < 24) {
    return `${hours} 小時前`
  } else if (days < 7) {
    return `${days} 天前`
  } else if (weeks < 4) {
    return `${weeks} 週前`
  } else if (months < 12) {
    return `${months} 個月前`
  } else {
    return `${years} 年前`
  }
}

/**
 * 格式化台幣價格
 *
 * @example
 * ```ts
 * formatPrice(1234567) // "NT$ 1,234,567"
 * formatPrice(1234.56) // "NT$ 1,235"
 * formatPrice(0) // "免費"
 * ```
 */
export function formatPrice(price: number, options?: { showFree?: boolean }): string {
  const { showFree = true } = options || {}

  if (price === 0 && showFree) {
    return '免費'
  }

  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * 格式化價格區間
 *
 * @example
 * ```ts
 * formatPriceRange(1000, 5000) // "NT$ 1,000 - NT$ 5,000"
 * formatPriceRange(1000, 1000) // "NT$ 1,000"
 * ```
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, { showFree: false })
  }

  return `${formatPrice(minPrice, { showFree: false })} - ${formatPrice(maxPrice, { showFree: false })}`
}

/**
 * 格式化電話號碼
 *
 * @example
 * ```ts
 * formatPhone('0912345678') // "0912-345-678"
 * formatPhone('0223456789') // "(02)2345-6789"
 * formatPhone('0312345678') // "(03)123-4567"
 * ```
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  // 手機號碼: 0912-345-678
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // 台北市話: (02)2345-6789
  if (cleaned.length === 9 && cleaned.startsWith('02')) {
    return `(02)${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // 其他市話: (03)123-4567 或 (04)1234-5678
  if (cleaned.length === 9 && /^0[3-9]/.test(cleaned)) {
    return `(${cleaned.slice(0, 2)})${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }

  if (cleaned.length === 10 && /^0[3-9]/.test(cleaned)) {
    return `(${cleaned.slice(0, 2)})${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // 無法格式化，返回原始清理後的號碼
  return cleaned
}

/**
 * 格式化狀態文字
 *
 * @example
 * ```ts
 * formatStatus('pending') // "待處理"
 * formatStatus('completed') // "已完成"
 * ```
 */
export function formatStatus(status: string, type: 'order' | 'inquiry' | 'note' = 'order'): string {
  const statusMaps = {
    order: {
      pending: '待處理',
      processing: '處理中',
      shipped: '已出貨',
      delivered: '已送達',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
    },
    inquiry: {
      pending: '待回覆',
      replied: '已回覆',
      resolved: '已解決',
      closed: '已關閉',
    },
    note: {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      blocked: '阻塞中',
    },
  }

  const map = statusMaps[type]
  return map[status as keyof typeof map] || status
}

/**
 * 格式化優先級
 *
 * @example
 * ```ts
 * formatPriority('high') // "高"
 * formatPriority('low') // "低"
 * ```
 */
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急',
  }
  return priorityMap[priority] || priority
}

/**
 * 格式化檔案大小
 *
 * @example
 * ```ts
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 * formatFileSize(1073741824) // "1 GB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化數字為千分位
 *
 * @example
 * ```ts
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.56, 2) // "1,234.56"
 * ```
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * 格式化百分比
 *
 * @example
 * ```ts
 * formatPercentage(0.1234) // "12.34%"
 * formatPercentage(0.5, 0) // "50%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化地址
 *
 * @example
 * ```ts
 * formatAddress({
 *   zipCode: '100',
 *   city: '台北市',
 *   district: '中正區',
 *   street: '重慶南路一段122號'
 * })
 * // "100 台北市中正區重慶南路一段122號"
 * ```
 */
export function formatAddress(address: {
  zipCode?: string
  city: string
  district: string
  street: string
}): string {
  const parts: string[] = []

  if (address.zipCode) {
    parts.push(address.zipCode)
  }

  parts.push(address.city)
  parts.push(address.district)
  parts.push(address.street)

  return parts.join(' ')
}

/**
 * 格式化信用卡號碼（遮蔽中間數字）
 *
 * @example
 * ```ts
 * formatCreditCard('1234567890123456') // "1234 **** **** 3456"
 * ```
 */
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')

  if (cleaned.length !== 16) {
    return cardNumber
  }

  return `${cleaned.slice(0, 4)} **** **** ${cleaned.slice(12)}`
}

/**
 * 格式化持續時間（分鐘）
 *
 * @example
 * ```ts
 * formatDuration(90) // "1 小時 30 分鐘"
 * formatDuration(45) // "45 分鐘"
 * formatDuration(120) // "2 小時"
 * ```
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} 分鐘`
  }

  if (mins === 0) {
    return `${hours} 小時`
  }

  return `${hours} 小時 ${mins} 分鐘`
}

/**
 * 格式化庫存狀態
 *
 * @example
 * ```ts
 * formatStockStatus(100) // "充足"
 * formatStockStatus(5) // "偏低"
 * formatStockStatus(0) // "缺貨"
 * ```
 */
export function formatStockStatus(stock: number): string {
  if (stock === 0) return '缺貨'
  if (stock < 10) return '偏低'
  if (stock < 50) return '適中'
  return '充足'
}

/**
 * 截斷文字並加上省略號
 *
 * @example
 * ```ts
 * truncateText('這是一段很長的文字', 10) // "這是一段很長的..."
 * truncateText('短文字', 10) // "短文字"
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}

/**
 * 格式化 Email（遮蔽部分字元）
 *
 * @example
 * ```ts
 * formatEmailMasked('user@example.com') // "u***@example.com"
 * ```
 */
export function formatEmailMasked(email: string): string {
  const [localPart, domain] = email.split('@')

  if (!domain) {
    return email
  }

  if (localPart.length <= 3) {
    return `${localPart.charAt(0)}***@${domain}`
  }

  return `${localPart.charAt(0)}***${localPart.charAt(localPart.length - 1)}@${domain}`
}

/**
 * 格式化訂單編號
 *
 * @example
 * ```ts
 * formatOrderNumber(123, new Date('2025-01-15'))
 * // "20250115-000123"
 * ```
 */
export function formatOrderNumber(orderId: number, orderDate: Date): string {
  const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '')
  const paddedId = orderId.toString().padStart(6, '0')
  return `${dateStr}-${paddedId}`
}
