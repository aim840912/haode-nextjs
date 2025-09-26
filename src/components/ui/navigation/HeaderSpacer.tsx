'use client'

import { useEffect, useState, useCallback } from 'react'

export default function HeaderSpacer() {
  // 設定合理的初始值以避免 hydration 錯誤和布局跳動
  const [headerHeight, setHeaderHeight] = useState(64)

  const updateHeight = useCallback(() => {
    const header = document.querySelector('header')
    if (header) {
      const height = header.offsetHeight
      setHeaderHeight(height)

      // 也可以設置 CSS 變數供其他地方使用
      document.documentElement.style.setProperty('--header-height', `${height}px`)
    }
  }, [])

  useEffect(() => {
    // 初始測量 - 添加小延遲確保 header 完全渲染
    const initialTimeout = setTimeout(() => {
      updateHeight()
    }, 100)

    // 也立即執行一次以避免過度延遲
    updateHeight()

    // 監聽視窗大小變化
    window.addEventListener('resize', updateHeight)

    // 監聽內容變化（如果有動態內容影響 Header 高度）
    let mutationObserver: MutationObserver | null = null
    let resizeObserver: ResizeObserver | null = null

    const header = document.querySelector('header')
    if (header) {
      // 使用 MutationObserver 監聽 DOM 變化
      mutationObserver = new MutationObserver(updateHeight)
      mutationObserver.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      })

      // 使用 ResizeObserver 監聽尺寸變化（更準確）
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          updateHeight()
        })
        resizeObserver.observe(header)
      }

      // 監聽漢堡選單動畫完成事件
      header.addEventListener('transitionend', updateHeight)

      // 監聽自定義選單狀態變化事件
      header.addEventListener('menuToggle', updateHeight)
    }

    // 監聽手機版選單狀態變化的全域事件
    const handleMenuStateChange = () => {
      // 延遲一點確保動畫完成
      setTimeout(updateHeight, 50)
      setTimeout(updateHeight, 300) // 再次確保動畫完成
    }

    document.addEventListener('mobileMenuToggle', handleMenuStateChange)

    return () => {
      clearTimeout(initialTimeout)
      window.removeEventListener('resize', updateHeight)
      document.removeEventListener('mobileMenuToggle', handleMenuStateChange)

      if (mutationObserver) {
        mutationObserver.disconnect()
      }

      if (resizeObserver) {
        resizeObserver.disconnect()
      }

      if (header) {
        header.removeEventListener('transitionend', updateHeight)
        header.removeEventListener('menuToggle', updateHeight)
      }
    }
  }, [updateHeight])

  return (
    <div
      style={{ paddingTop: `${headerHeight}px` }}
      className="shrink-0"
      aria-hidden="true"
      suppressHydrationWarning
    />
  )
}
