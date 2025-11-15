import { describe, it, expect } from 'vitest'
import { cn, conditionalClass, toggleClass } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('應該合併多個 className', () => {
      expect(cn('px-2 py-1', 'text-red-500')).toBe('px-2 py-1 text-red-500')
    })

    it('應該處理條件 className (使用 && 運算子)', () => {
      const isActive = true
      const isDisabled = false

      expect(cn('base-class', isActive && 'active')).toBe('base-class active')
      expect(cn('base-class', isDisabled && 'disabled')).toBe('base-class')
    })

    it('應該處理物件語法', () => {
      const isActive = true
      const isDisabled = false

      expect(cn('base-class', { active: isActive, disabled: isDisabled })).toBe('base-class active')
    })

    it('應該解決 Tailwind CSS 衝突 (後者覆蓋前者)', () => {
      // px-4 會覆蓋 px-2
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('應該過濾 falsy 值', () => {
      expect(cn('base', null, undefined, false, '', 'valid')).toBe('base valid')
    })

    it('應該處理空輸入', () => {
      expect(cn()).toBe('')
    })

    it('應該處理陣列輸入', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })
  })

  describe('conditionalClass', () => {
    it('應該在條件為 true 時返回 trueClass', () => {
      expect(conditionalClass(true, 'active', 'inactive')).toBe('active')
    })

    it('應該在條件為 false 時返回 falseClass', () => {
      expect(conditionalClass(false, 'active', 'inactive')).toBe('inactive')
    })

    it('應該在 falseClass 未提供時返回空字串', () => {
      expect(conditionalClass(false, 'active')).toBe('')
    })
  })

  describe('toggleClass', () => {
    it('應該在 isActive 為 true 時返回 activeClass', () => {
      expect(toggleClass(true, 'on', 'off')).toBe('on')
    })

    it('應該在 isActive 為 false 時返回 inactiveClass', () => {
      expect(toggleClass(false, 'on', 'off')).toBe('off')
    })

    it('應該在 inactiveClass 未提供時返回空字串', () => {
      expect(toggleClass(false, 'on')).toBe('')
    })
  })
})
