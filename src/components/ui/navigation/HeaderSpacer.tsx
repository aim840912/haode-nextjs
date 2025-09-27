'use client'

import { useEffect } from 'react'

export default function HeaderSpacer() {
  // 由於 Header 已統一為固定高度（60px），我們可以簡化 HeaderSpacer
  const HEADER_HEIGHT = 60

  useEffect(() => {
    // 設置 CSS 變數供其他地方使用（如首頁的負邊距）
    document.documentElement.style.setProperty('--header-height', `${HEADER_HEIGHT}px`)
  }, [])

  return (
    <div style={{ paddingTop: `${HEADER_HEIGHT}px` }} className="shrink-0" aria-hidden="true" />
  )
}
