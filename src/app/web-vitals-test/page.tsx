'use client';

import { useEffect, useState } from 'react';
import { measureLCP, measureCLS, measureImageLoadingMetrics } from '@/utils/web-vitals-test';

interface VitalsResult {
  lcp?: number;
  cls?: number;
  message: string;
  isGood?: boolean;
  isNeedsImprovement?: boolean;
  isPoor?: boolean;
}

interface ImageMetrics {
  totalImages: number;
  lazyImages: number;
  eagerImages: number;
  nextjsImages: number;
  lazyPercentage: string;
  nextjsPercentage: string;
  message: string;
}

export default function WebVitalsTestPage() {
  const [lcpResult, setLcpResult] = useState<VitalsResult | null>(null);
  const [clsResult, setClsResult] = useState<VitalsResult | null>(null);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      setIsLoading(true);
      
      // 同時執行所有測試
      const [lcp, cls, images] = await Promise.all([
        measureLCP(),
        measureCLS(),
        measureImageLoadingMetrics()
      ]);
      
      setLcpResult(lcp as VitalsResult);
      setClsResult(cls as VitalsResult);
      setImageMetrics(images as ImageMetrics);
      setIsLoading(false);
    };

    // 等待頁面完全載入後才開始測試
    if (document.readyState === 'complete') {
      runTests();
    } else {
      window.addEventListener('load', runTests);
      return () => window.removeEventListener('load', runTests);
    }
  }, []);

  const getScoreColor = (result: VitalsResult | null) => {
    if (!result) return 'text-gray-500';
    if (result.isGood) return 'text-green-600';
    if (result.isNeedsImprovement) return 'text-yellow-600';
    if (result.isPoor) return 'text-red-600';
    return 'text-gray-500';
  };

  const getScoreBackground = (result: VitalsResult | null) => {
    if (!result) return 'bg-gray-100';
    if (result.isGood) return 'bg-green-100';
    if (result.isNeedsImprovement) return 'bg-yellow-100';
    if (result.isPoor) return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Core Web Vitals 測試結果
          </h1>
          <p className="text-gray-600">
            驗證圖片優化和懶載入的效果
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">正在測量 Web Vitals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* LCP 卡片 */}
            <div className={`p-6 rounded-lg shadow-md ${getScoreBackground(lcpResult)}`}>
              <h3 className="text-lg font-semibold mb-2">
                Largest Contentful Paint (LCP)
              </h3>
              <div className={`text-2xl font-bold ${getScoreColor(lcpResult)}`}>
                {lcpResult?.lcp ? `${lcpResult.lcp.toFixed(0)}ms` : 'N/A'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {lcpResult?.message}
              </p>
              <div className="mt-3 text-xs">
                <div className="text-green-600">✓ 好: ≤ 2.5s</div>
                <div className="text-yellow-600">⚠ 需要改進: 2.5s - 4.0s</div>
                <div className="text-red-600">✗ 差: &gt; 4.0s</div>
              </div>
            </div>

            {/* CLS 卡片 */}
            <div className={`p-6 rounded-lg shadow-md ${getScoreBackground(clsResult)}`}>
              <h3 className="text-lg font-semibold mb-2">
                Cumulative Layout Shift (CLS)
              </h3>
              <div className={`text-2xl font-bold ${getScoreColor(clsResult)}`}>
                {clsResult?.cls ? `${clsResult.cls.toFixed(3)}%` : 'N/A'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {clsResult?.message}
              </p>
              <div className="mt-3 text-xs">
                <div className="text-green-600">✓ 好: ≤ 0.1</div>
                <div className="text-yellow-600">⚠ 需要改進: 0.1 - 0.25</div>
                <div className="text-red-600">✗ 差: &gt; 0.25</div>
              </div>
            </div>

            {/* 圖片優化卡片 */}
            <div className="p-6 rounded-lg shadow-md bg-blue-100 md:col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">
                圖片優化分析
              </h3>
              {imageMetrics && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">總圖片數:</span> {imageMetrics.totalImages}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Next.js Image:</span> {imageMetrics.nextjsImages} ({imageMetrics.nextjsPercentage}%)
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">懶載入圖片:</span> {imageMetrics.lazyImages} ({imageMetrics.lazyPercentage}%)
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">立即載入:</span> {imageMetrics.eagerImages}
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    {imageMetrics.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">優化建議</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>已實施 Next.js Image 組件自動優化</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>已實施智能懶載入策略（前6個產品優先載入）</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>已優化 Intersection Observer 設置（提前200px載入）</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">ℹ</span>
              <span>建議在生產環境中測試以獲得更準確的結果</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新測試
          </button>
        </div>
      </div>
    </div>
  );
}