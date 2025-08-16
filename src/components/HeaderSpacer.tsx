'use client'

import { useEffect, useState } from 'react'

export default function HeaderSpacer() {
  const [headerHeight, setHeaderHeight] = useState(0)
  
  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header')
      if (header) {
        const height = header.offsetHeight
        setHeaderHeight(height)
        
        // 也可以設置 CSS 變數供其他地方使用
        document.documentElement.style.setProperty('--header-height', `${height}px`)
      }
    }
    
    // 初始測量
    updateHeight()
    
    // 監聽視窗大小變化
    window.addEventListener('resize', updateHeight)
    
    // 監聽內容變化（如果有動態內容影響 Header 高度）
    const observer = new MutationObserver(updateHeight)
    const header = document.querySelector('header')
    if (header) {
      observer.observe(header, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      })
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight)
      observer.disconnect()
    }
  }, [])
  
  return (
    <div 
      style={{ paddingTop: `${headerHeight}px` }}
      className="shrink-0"
      aria-hidden="true"
    />
  )
}