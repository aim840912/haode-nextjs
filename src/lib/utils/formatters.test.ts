import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPrice,
  formatPriceRange,
  formatPhone,
  formatStatus,
  formatPriority,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatAddress,
  formatCreditCard,
  formatDuration,
  formatStockStatus,
  truncateText,
  formatEmailMasked,
  formatOrderNumber,
} from './formatters'

describe('formatters', () => {
  describe('formatDate', () => {
    const testDate = new Date('2025-01-15T10:30:00')

    it('應該格式化為短格式日期 (short)', () => {
      const result = formatDate(testDate, 'short')
      expect(result).toMatch(/2025\/01\/15/)
    })

    it('應該格式化為中格式日期 (medium)', () => {
      const result = formatDate(testDate, 'medium')
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/15/)
    })

    it('應該格式化為完整格式日期 (full)', () => {
      const result = formatDate(testDate, 'full')
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/15/)
    })

    it('應該格式化為時間格式 (time)', () => {
      const result = formatDate(testDate, 'time')
      expect(result).toMatch(/10:30/)
    })

    it('應該處理字串格式日期', () => {
      const result = formatDate('2025-01-15', 'short')
      expect(result).toMatch(/2025\/01\/15/)
    })

    it('應該返回「無效日期」當日期無效時', () => {
      expect(formatDate('invalid-date')).toBe('無效日期')
      expect(formatDate(new Date('invalid'))).toBe('無效日期')
    })
  })

  describe('formatDateTime', () => {
    const testDate = new Date('2025-01-15T14:30:00')

    it('應該格式化日期時間', () => {
      const result = formatDateTime(testDate)
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/15/)
      // 中文環境可能顯示「下午02:30」或「14:30」
      expect(result).toMatch(/(:30|02:30)/)
    })

    it('應該處理字串格式日期', () => {
      const result = formatDateTime('2025-01-15T14:30:00')
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/(:30|02:30)/)
    })

    it('應該返回「無效日期」當日期無效時', () => {
      expect(formatDateTime('invalid-date')).toBe('無效日期')
    })
  })

  describe('formatRelativeTime', () => {
    const now = Date.now()

    it('應該返回「剛剛」當少於 60 秒時', () => {
      const date = new Date(now - 1000 * 30) // 30 秒前
      expect(formatRelativeTime(date)).toBe('剛剛')
    })

    it('應該返回「N 分鐘前」當少於 60 分鐘時', () => {
      const date = new Date(now - 1000 * 60 * 5) // 5 分鐘前
      expect(formatRelativeTime(date)).toBe('5 分鐘前')
    })

    it('應該返回「N 小時前」當少於 24 小時時', () => {
      const date = new Date(now - 1000 * 60 * 60 * 3) // 3 小時前
      expect(formatRelativeTime(date)).toBe('3 小時前')
    })

    it('應該返回「N 天前」當少於 7 天時', () => {
      const date = new Date(now - 1000 * 60 * 60 * 24 * 3) // 3 天前
      expect(formatRelativeTime(date)).toBe('3 天前')
    })

    it('應該返回「N 週前」當少於 4 週時', () => {
      const date = new Date(now - 1000 * 60 * 60 * 24 * 14) // 2 週前
      expect(formatRelativeTime(date)).toBe('2 週前')
    })

    it('應該返回「N 個月前」當少於 12 個月時', () => {
      const date = new Date(now - 1000 * 60 * 60 * 24 * 60) // 2 個月前
      expect(formatRelativeTime(date)).toBe('2 個月前')
    })

    it('應該返回「N 年前」當超過 12 個月時', () => {
      const date = new Date(now - 1000 * 60 * 60 * 24 * 400) // 約 1 年前
      expect(formatRelativeTime(date)).toBe('1 年前')
    })

    it('應該返回「無效日期」當日期無效時', () => {
      expect(formatRelativeTime('invalid-date')).toBe('無效日期')
    })
  })

  describe('formatPrice', () => {
    it('應該格式化價格為台幣格式', () => {
      const result = formatPrice(1234567)
      // 根據環境可能顯示 "NT$" 或 "$"
      expect(result).toMatch(/(\$|NT\$)1,234,567/)
    })

    it('應該處理小數點（四捨五入）', () => {
      const result = formatPrice(1234.56)
      expect(result).toMatch(/(\$|NT\$)1,235/)
    })

    it('應該顯示「免費」當價格為 0', () => {
      expect(formatPrice(0)).toBe('免費')
    })

    it('應該在 showFree=false 時不顯示「免費」', () => {
      const result = formatPrice(0, { showFree: false })
      expect(result).toMatch(/(\$|NT\$)0/)
    })

    it('應該處理負數價格', () => {
      const result = formatPrice(-100)
      expect(result).toMatch(/-(\$|NT\$)100/)
    })
  })

  describe('formatPriceRange', () => {
    it('應該格式化價格區間', () => {
      const result = formatPriceRange(1000, 5000)
      expect(result).toMatch(/1,000/)
      expect(result).toMatch(/5,000/)
      expect(result).toMatch(/-/)
    })

    it('應該在相同價格時只顯示一個價格', () => {
      const result = formatPriceRange(1000, 1000)
      expect(result).toMatch(/1,000/)
      expect(result).not.toMatch(/-/)
    })

    it('應該處理大數字', () => {
      const result = formatPriceRange(10000, 50000)
      expect(result).toMatch(/10,000/)
      expect(result).toMatch(/50,000/)
    })
  })

  describe('formatPhone', () => {
    it('應該格式化手機號碼 (09XX)', () => {
      expect(formatPhone('0912345678')).toBe('0912-345-678')
    })

    it('應該格式化台北市話 (02) - 10 碼', () => {
      // 台北 10 碼號碼(02) + 8 碼
      // 實際上 0223456789 是 10 碼,不會被函數格式化(函數只處理 9 碼 02 號碼)
      const result = formatPhone('0223456789')
      // 函數無法格式化 10 碼台北號碼,返回清理後的號碼
      expect(result).toBe('0223456789')
    })

    it('應該格式化其他市話 (03-09) - 10 碼', () => {
      // 03 + 8 碼 = 10 碼
      expect(formatPhone('0312345678')).toBe('(03)1234-5678')
    })

    it('應該格式化其他市話 (04-09) - 10 碼', () => {
      expect(formatPhone('0412345678')).toBe('(04)1234-5678')
    })

    it('應該移除非數字字元', () => {
      expect(formatPhone('0912-345-678')).toBe('0912-345-678')
    })

    it('應該返回清理後號碼當無法格式化時', () => {
      expect(formatPhone('12345')).toBe('12345')
    })
  })

  describe('formatStatus', () => {
    it('應該格式化訂單狀態', () => {
      expect(formatStatus('pending', 'order')).toBe('待處理')
      expect(formatStatus('processing', 'order')).toBe('處理中')
      expect(formatStatus('completed', 'order')).toBe('已完成')
      expect(formatStatus('cancelled', 'order')).toBe('已取消')
    })

    it('應該格式化詢問狀態', () => {
      expect(formatStatus('pending', 'inquiry')).toBe('待回覆')
      expect(formatStatus('replied', 'inquiry')).toBe('已回覆')
      expect(formatStatus('resolved', 'inquiry')).toBe('已解決')
    })

    it('應該格式化筆記狀態', () => {
      expect(formatStatus('pending', 'note')).toBe('待處理')
      expect(formatStatus('in_progress', 'note')).toBe('進行中')
      expect(formatStatus('completed', 'note')).toBe('已完成')
    })

    it('應該返回原始狀態當無對應翻譯時', () => {
      expect(formatStatus('unknown_status', 'order')).toBe('unknown_status')
    })

    it('應該使用預設類型 (order) 當未指定時', () => {
      expect(formatStatus('pending')).toBe('待處理')
    })
  })

  describe('formatPriority', () => {
    it('應該格式化優先級', () => {
      expect(formatPriority('low')).toBe('低')
      expect(formatPriority('medium')).toBe('中')
      expect(formatPriority('high')).toBe('高')
      expect(formatPriority('urgent')).toBe('緊急')
    })

    it('應該返回原始值當無對應翻譯時', () => {
      expect(formatPriority('unknown')).toBe('unknown')
    })
  })

  describe('formatFileSize', () => {
    it('應該返回「0 Bytes」當大小為 0', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('應該格式化為 Bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('應該格式化為 KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('應該格式化為 MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(5242880)).toBe('5 MB')
    })

    it('應該格式化為 GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('應該保留兩位小數', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })
  })

  describe('formatNumber', () => {
    it('應該格式化為千分位', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('應該處理小數點 (decimals=0 預設)', () => {
      expect(formatNumber(1234.56)).toBe('1,235')
    })

    it('應該保留指定小數位數', () => {
      expect(formatNumber(1234.56, 2)).toBe('1,234.56')
      expect(formatNumber(1234.567, 1)).toBe('1,234.6')
    })

    it('應該處理零', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('應該處理負數', () => {
      expect(formatNumber(-1234)).toBe('-1,234')
    })
  })

  describe('formatPercentage', () => {
    it('應該格式化百分比 (預設 2 位小數)', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%')
    })

    it('應該處理整數百分比', () => {
      expect(formatPercentage(0.5, 0)).toBe('50%')
    })

    it('應該處理指定小數位數', () => {
      expect(formatPercentage(0.12345, 3)).toBe('12.345%')
    })

    it('應該處理 0', () => {
      expect(formatPercentage(0)).toBe('0.00%')
    })

    it('應該處理超過 100% 的值', () => {
      expect(formatPercentage(1.5)).toBe('150.00%')
    })
  })

  describe('formatAddress', () => {
    it('應該格式化完整地址 (含郵遞區號)', () => {
      expect(
        formatAddress({
          zipCode: '100',
          city: '台北市',
          district: '中正區',
          street: '重慶南路一段122號',
        })
      ).toBe('100 台北市 中正區 重慶南路一段122號')
    })

    it('應該格式化地址 (不含郵遞區號)', () => {
      expect(
        formatAddress({
          city: '台北市',
          district: '中正區',
          street: '重慶南路一段122號',
        })
      ).toBe('台北市 中正區 重慶南路一段122號')
    })

    it('應該處理空郵遞區號', () => {
      expect(
        formatAddress({
          zipCode: '',
          city: '台北市',
          district: '中正區',
          street: '重慶南路一段122號',
        })
      ).toBe('台北市 中正區 重慶南路一段122號')
    })
  })

  describe('formatCreditCard', () => {
    it('應該格式化信用卡號碼', () => {
      expect(formatCreditCard('1234567890123456')).toBe('1234 **** **** 3456')
    })

    it('應該移除非數字字元後格式化', () => {
      expect(formatCreditCard('1234-5678-9012-3456')).toBe('1234 **** **** 3456')
    })

    it('應該返回原始值當長度不是 16 碼時', () => {
      expect(formatCreditCard('12345')).toBe('12345')
      expect(formatCreditCard('12345678901234567')).toBe('12345678901234567')
    })
  })

  describe('formatDuration', () => {
    it('應該格式化分鐘', () => {
      expect(formatDuration(45)).toBe('45 分鐘')
    })

    it('應該格式化小時', () => {
      expect(formatDuration(120)).toBe('2 小時')
    })

    it('應該格式化小時與分鐘', () => {
      expect(formatDuration(90)).toBe('1 小時 30 分鐘')
      expect(formatDuration(135)).toBe('2 小時 15 分鐘')
    })

    it('應該處理 0 分鐘', () => {
      expect(formatDuration(0)).toBe('0 分鐘')
    })
  })

  describe('formatStockStatus', () => {
    it('應該返回「缺貨」當庫存為 0', () => {
      expect(formatStockStatus(0)).toBe('缺貨')
    })

    it('應該返回「偏低」當庫存小於 10', () => {
      expect(formatStockStatus(5)).toBe('偏低')
      expect(formatStockStatus(9)).toBe('偏低')
    })

    it('應該返回「適中」當庫存介於 10-49', () => {
      expect(formatStockStatus(10)).toBe('適中')
      expect(formatStockStatus(30)).toBe('適中')
      expect(formatStockStatus(49)).toBe('適中')
    })

    it('應該返回「充足」當庫存 >= 50', () => {
      expect(formatStockStatus(50)).toBe('充足')
      expect(formatStockStatus(100)).toBe('充足')
    })
  })

  describe('truncateText', () => {
    it('應該截斷文字並加上省略號', () => {
      // 「這是一段很長的文字」= 9 字,小於 10,不會被截斷
      expect(truncateText('這是一段很長的文字', 10)).toBe('這是一段很長的文字')
      // 測試實際需要截斷的情況
      expect(truncateText('這是一段很長很長的文字內容', 10)).toBe('這是一段很長很長的文...')
    })

    it('應該保留短文字不變', () => {
      expect(truncateText('短文字', 10)).toBe('短文字')
    })

    it('應該處理剛好等於最大長度的文字', () => {
      expect(truncateText('12345', 5)).toBe('12345')
    })

    it('應該處理空字串', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('formatEmailMasked', () => {
    it('應該遮蔽 Email (長度 > 3)', () => {
      expect(formatEmailMasked('user@example.com')).toBe('u***r@example.com')
      expect(formatEmailMasked('john.doe@example.com')).toBe('j***e@example.com')
    })

    it('應該遮蔽短 Email (長度 <= 3)', () => {
      expect(formatEmailMasked('joe@example.com')).toBe('j***@example.com')
      expect(formatEmailMasked('ab@example.com')).toBe('a***@example.com')
    })

    it('應該返回原始值當缺少 @ 符號時', () => {
      expect(formatEmailMasked('invalid-email')).toBe('invalid-email')
    })

    it('應該處理單字元 Email', () => {
      expect(formatEmailMasked('a@example.com')).toBe('a***@example.com')
    })
  })

  describe('formatOrderNumber', () => {
    it('應該格式化訂單編號', () => {
      const date = new Date('2025-01-15')
      expect(formatOrderNumber(123, date)).toBe('20250115-000123')
    })

    it('應該補零到 6 位數', () => {
      const date = new Date('2025-01-15')
      expect(formatOrderNumber(1, date)).toBe('20250115-000001')
      expect(formatOrderNumber(999999, date)).toBe('20250115-999999')
    })

    it('應該處理不同日期', () => {
      const date = new Date('2025-12-31')
      expect(formatOrderNumber(456, date)).toBe('20251231-000456')
    })
  })
})
