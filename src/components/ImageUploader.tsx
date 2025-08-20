'use client';

import { useState, useRef, useCallback } from 'react';
import { validateImageFile, compressImage, getImagePreviewUrl } from '@/lib/image-utils';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';

interface UploadedImage {
  id: string;
  url?: string;
  path: string;
  size: 'thumbnail' | 'medium' | 'large';
  file?: File;
  preview?: string;
}

interface ImageUploaderProps {
  productId: string;
  onUploadSuccess?: (images: UploadedImage[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  generateMultipleSizes?: boolean;
  enableCompression?: boolean;
  className?: string;
  acceptedTypes?: string[];
}

export default function ImageUploader({
  productId,
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  allowMultiple = true,
  generateMultipleSizes = false,
  enableCompression = true,
  className = '',
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImages, setPreviewImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    // 驗證檔案
    for (const file of fileArray) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        onUploadError?.(validation.error || '檔案驗證失敗');
      }
    }

    if (validFiles.length === 0) return;

    // 檢查檔案數量限制
    if (previewImages.length + validFiles.length > maxFiles) {
      onUploadError?.(` exceeds maximum allowed files (${maxFiles})`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newImages: UploadedImage[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(((i + 1) / validFiles.length) * 100);

        // 可選的圖片壓縮
        let processedFile = file;
        if (enableCompression) {
          try {
            processedFile = await compressImage(file);
          } catch (error) {
            console.warn('圖片壓縮失敗，使用原檔案:', error);
          }
        }

        // 生成本地預覽（立即顯示）
        const preview = await getImagePreviewUrl(processedFile);
        console.log(`🖼️ 生成本地預覽: ${preview.substring(0, 50)}...`);

        // 先創建本地預覽圖片對象，讓用戶立即看到
        const tempImage: UploadedImage = {
          id: `temp-${productId}-${Date.now()}-${i}`,
          url: '',
          path: '',
          size: 'medium',
          file: processedFile,
          preview: preview
        };

        // 立即添加到預覽列表
        setPreviewImages(prev => [...prev, tempImage]);

        try {
          // 上傳到伺服器
          const result = await uploadImageToServer(processedFile, productId, generateMultipleSizes);
          
          if (generateMultipleSizes && result.multiple) {
            // 多尺寸上傳結果 - 直接替換臨時預覽
            const uploadedImages: UploadedImage[] = [];
            Object.entries(result.urls).forEach(([size, urlData]) => {
              const url = (urlData as any).url;
              console.log(`📷 多尺寸上傳成功 ${size}:`, url);
              uploadedImages.push({
                id: `${productId}-${size}-${Date.now()}-${i}`,
                url: url,
                path: (urlData as any).path,
                size: size as 'thumbnail' | 'medium' | 'large',
                file: processedFile,
                preview: url // 使用 Supabase URL
              });
            });
            
            // 用上傳成功的圖片替換臨時預覽
            setPreviewImages(prev => [
              ...prev.filter(img => img.id !== tempImage.id),
              ...uploadedImages
            ]);
            newImages.push(...uploadedImages);
          } else {
            // 單一尺寸上傳結果
            console.log(`📷 單一尺寸上傳成功:`, result.url);
            const uploadedImage: UploadedImage = {
              id: `${productId}-${result.size}-${Date.now()}-${i}`,
              url: result.url,
              path: result.path,
              size: result.size,
              file: processedFile,
              preview: result.url // 使用 Supabase URL
            };
            
            // 用上傳成功的圖片替換臨時預覽
            setPreviewImages(prev => prev.map(img => 
              img.id === tempImage.id ? uploadedImage : img
            ));
            newImages.push(uploadedImage);
          }
        } catch (uploadError) {
          // 上傳失敗，保留本地預覽並更新 ID
          console.error('上傳失敗，保留本地預覽:', uploadError);
          setPreviewImages(prev => prev.map(img => 
            img.id === tempImage.id 
              ? { ...img, id: `local-${productId}-${Date.now()}-${i}` }
              : img
          ));
          throw uploadError; // 重新拋出錯誤，讓外層 catch 處理
        }
      }

      onUploadSuccess?.(newImages);

    } catch (error) {
      console.error('上傳失敗:', error);
      onUploadError?.(error instanceof Error ? error.message : '上傳失敗');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [productId, maxFiles, previewImages.length, generateMultipleSizes, enableCompression, onUploadSuccess, onUploadError]);

  const uploadImageToServer = async (
    file: File,
    productId: string,
    generateMultipleSizes: boolean
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    formData.append('generateMultipleSizes', generateMultipleSizes.toString());
    formData.append('compress', 'false'); // 已在前端壓縮

    const response = await fetch('/api/upload/images', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '上傳失敗');
    }

    const result = await response.json();
    return result.data;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleRemoveImage = async (imageId: string) => {
    const imageToRemove = previewImages.find(img => img.id === imageId);
    if (!imageToRemove) return;

    try {
      // 從伺服器刪除
      await fetch('/api/upload/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath: imageToRemove.path })
      });

      // 從預覽中移除
      setPreviewImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('刪除圖片失敗:', error);
      onUploadError?.('刪除圖片失敗');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上傳區域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? '放開以上傳圖片' : '拖放圖片到這裡'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              或者{' '}
              <button
                type="button"
                onClick={openFileDialog}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                點擊選擇檔案
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              支援 JPEG、PNG、WebP、AVIF 格式，單檔最大 10MB
              {allowMultiple && ` (最多 ${maxFiles} 個檔案)`}
            </p>
          </div>
        </div>

        {/* 上傳進度 */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <div className="mt-2 text-sm text-gray-600">
                上傳中... {Math.round(uploadProgress)}%
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 圖片預覽 */}
      {previewImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">已上傳的圖片</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                  <Image
                    src={image.preview || image.url || '/images/placeholder.jpg'}
                    alt={`上傳的圖片 (${image.size})`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    priority={true}
                    onError={() => {
                      console.warn('預覽圖片載入失敗:', image.preview, image.url);
                    }}
                    onLoad={() => {
                      console.log('圖片載入成功:', image.preview || image.url);
                    }}
                  />
                </div>
                
                {/* 圖片資訊 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {image.size}
                  </p>
                </div>

                {/* 刪除按鈕 */}
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="刪除圖片"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上傳統計 */}
      {previewImages.length > 0 && (
        <div className="text-sm text-gray-500 border-t pt-3">
          已上傳 {previewImages.length} 個檔案
          {maxFiles > 0 && ` / 最多 ${maxFiles} 個`}
        </div>
      )}
    </div>
  );
}

// 簡化版的單圖片上傳元件
export function SingleImageUploader({
  productId,
  onUploadSuccess,
  onUploadError,
  initialImage,
  size = 'medium',
  className = ''
}: {
  productId: string;
  onUploadSuccess?: (image: UploadedImage) => void;
  onUploadError?: (error: string) => void;
  initialImage?: string;
  size?: 'thumbnail' | 'medium' | 'large';
  className?: string;
}) {
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(
    initialImage ? {
      id: 'initial',
      url: initialImage,
      path: '',
      size
    } : null
  );

  const handleUploadSuccess = (images: UploadedImage[]) => {
    if (images.length > 0) {
      const newImage = images[0];
      setCurrentImage(newImage);
      onUploadSuccess?.(newImage);
    }
  };

  return (
    <div className={className}>
      {currentImage && (
        <div className="mb-4">
          <div className="aspect-square w-32 rounded-lg overflow-hidden border border-gray-200 relative">
            <Image
              src={currentImage.url || '/images/placeholder.jpg'}
              alt="當前圖片"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      
      <ImageUploader
        productId={productId}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={onUploadError}
        maxFiles={1}
        allowMultiple={false}
        generateMultipleSizes={false}
      />
    </div>
  );
}