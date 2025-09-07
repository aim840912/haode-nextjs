// 簡化版本的 Core Web Vitals 測試工具
// 用於驗證圖片優化的效果

export function measureLCP() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ lcp: 0, message: 'Server side - no measurement' });
      return;
    }

    let lcp = 0;
    
    // 使用 Performance Observer 測量 LCP
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          lcp = lastEntry.startTime;
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // 3秒後回傳結果
      setTimeout(() => {
        observer.disconnect();
        resolve({ 
          lcp, 
          message: lcp > 0 ? `LCP: ${lcp.toFixed(2)}ms` : 'LCP not measured',
          isGood: lcp <= 2500,
          isNeedsImprovement: lcp > 2500 && lcp <= 4000,
          isPoor: lcp > 4000
        });
      }, 3000);
    } catch (error) {
      resolve({ lcp: 0, message: 'LCP measurement not supported', error });
    }
  });
}

export function measureCLS() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ cls: 0, message: 'Server side - no measurement' });
      return;
    }

    let cls = 0;
    
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number }
          if (clsEntry.hadRecentInput) return;
          cls += clsEntry.value;
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      setTimeout(() => {
        observer.disconnect();
        resolve({ 
          cls: cls * 100, // 轉換為百分比
          message: `CLS: ${(cls * 100).toFixed(3)}%`,
          isGood: cls <= 0.1,
          isNeedsImprovement: cls > 0.1 && cls <= 0.25,
          isPoor: cls > 0.25
        });
      }, 3000);
    } catch (error) {
      resolve({ cls: 0, message: 'CLS measurement not supported', error });
    }
  });
}

export function measureImageLoadingMetrics() {
  if (typeof window === 'undefined') return Promise.resolve({ message: 'Server side' });
  
  return new Promise((resolve) => {
    const images = document.querySelectorAll('img');
    const metrics = {
      totalImages: images.length,
      lazyImages: 0,
      eagerImages: 0,
      loadedImages: 0,
      nextjsImages: 0
    };

    images.forEach((img) => {
      if (img.loading === 'lazy') metrics.lazyImages++;
      if (img.loading === 'eager') metrics.eagerImages++;
      if (img.complete) metrics.loadedImages++;
      if (img.getAttribute('data-nimg')) metrics.nextjsImages++;
    });

    resolve({
      ...metrics,
      lazyPercentage: ((metrics.lazyImages / metrics.totalImages) * 100).toFixed(1),
      nextjsPercentage: ((metrics.nextjsImages / metrics.totalImages) * 100).toFixed(1),
      message: `圖片優化分析: ${metrics.nextjsImages}/${metrics.totalImages} 使用Next.js Image, ${metrics.lazyImages}/${metrics.totalImages} 懶載入`
    });
  });
}