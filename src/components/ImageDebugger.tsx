'use client';

import { useState } from 'react';

interface ImageDebuggerProps {
  imageUrl: string;
  className?: string;
}

export default function ImageDebugger({ imageUrl, className = '' }: ImageDebuggerProps) {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<string>('');

  const handleLoad = () => {
    console.log('✅ 圖片載入成功:', imageUrl);
    setLoadStatus('success');
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ 圖片載入失敗:', imageUrl, e);
    setLoadStatus('error');
    setErrorDetails('圖片載入失敗');
  };

  const testDirectAccess = async () => {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      console.log('直接存取測試:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('直接存取失敗:', error);
      return false;
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg p-4 ${className}`}>
      <div className="mb-2">
        <strong>圖片 URL:</strong>
        <div className="text-sm break-all bg-gray-100 p-2 rounded mt-1">
          {imageUrl}
        </div>
      </div>
      
      <div className="mb-2">
        <strong>載入狀態:</strong>
        <span className={`ml-2 px-2 py-1 rounded text-sm ${
          loadStatus === 'success' ? 'bg-green-100 text-green-800' :
          loadStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {loadStatus === 'success' ? '✅ 成功' :
           loadStatus === 'error' ? '❌ 失敗' :
           '⏳ 載入中'}
        </span>
      </div>

      {errorDetails && (
        <div className="mb-2 text-red-600 text-sm">
          <strong>錯誤詳情:</strong> {errorDetails}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={testDirectAccess}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          測試直接存取
        </button>
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          在新頁面開啟
        </a>
      </div>

      <div className="aspect-square bg-gray-100 border rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt="測試圖片"
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
}