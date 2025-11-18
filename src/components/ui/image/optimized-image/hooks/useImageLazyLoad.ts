import { useState, useEffect, useRef } from 'react'

interface UseImageLazyLoadOptions {
  priority?: boolean
  lazy?: boolean
  threshold?: number
}

/**
 * Intersection Observer 懶加載 Hook
 */
export function useImageLazyLoad({
  priority = false,
  lazy = true,
  threshold = 0.1,
}: UseImageLazyLoadOptions) {
  const [, setIsInView] = useState(priority || !lazy)
  const [shouldLoad, setShouldLoad] = useState(priority || !lazy)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority || !lazy || shouldLoad) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin: '200px', // 提前 200px 開始載入，提供更平滑的體驗
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, lazy, shouldLoad, threshold])

  return {
    imgRef,
    shouldLoad,
  }
}
