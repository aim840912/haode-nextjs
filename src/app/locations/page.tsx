'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Location } from '@/types/location'
import Link from 'next/link'
import SimpleImage, { AvatarSimpleImage } from '@/components/SimpleImage'
import { logger } from '@/lib/logger'

// 驗證圖片 URL 是否有效（避免 emoji 或無效 URL 傳遞給 Image 組件）
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false
  // 檢查是否包含 emoji 字符
  const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  if (emojiRegex.test(url)) return false
  // 檢查是否為有效的相對或絕對路徑
  return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')
}

export default function LocationsPage() {
  const [storeLocations, setStoreLocations] = useState<Location[]>([])
  const [selectedStore, setSelectedStore] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const result = await response.json()
      
      // 處理統一 API 回應格式
      const data = result.data || result
      
      // 確保 data 是陣列
      if (Array.isArray(data)) {
        setStoreLocations(data)
        if (data.length > 0) {
          setSelectedStore(data[0])
        }
      } else {
        logger.error('API 回應格式錯誤：locations data 不是陣列', new Error('非陣列格式'), { result, module: 'LocationsPage', action: 'fetchLocations' })
        setStoreLocations([])
      }
    } catch (error) {
      logger.error('Error fetching locations', error as Error, { module: 'LocationsPage', action: 'fetchLocations' })
    } finally {
      setLoading(false)
    }
  }

  const handleStoreSelect = (store: Location) => {
    setSelectedStore(store)
  }

  const openMap = (store: Location) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`
    window.open(googleMapsUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-900 font-medium">無門市資料</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <h1 className="text-4xl font-light text-amber-900 mb-4">門市據點</h1>
          <p className="text-xl text-gray-700">全台四間門市，就近選購優質農產品</p>
          {user?.role === 'admin' && (
            <Link
              href="/admin/locations"
              className="absolute top-0 right-6 flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors"
            >
              管理門市
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Store Selection Tabs */}
        <div className="flex flex-wrap justify-center mb-12 bg-white rounded-lg shadow-sm p-2">
          {storeLocations.map(store => (
            <button
              key={store.id}
              onClick={() => handleStoreSelect(store)}
              className={`px-6 py-3 rounded-lg font-medium transition-all m-1 ${
                selectedStore?.id === store.id
                  ? 'bg-amber-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {store.name}
              {store.isMain && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                  總店
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Selected Store Details */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Store Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {isValidImageUrl(selectedStore.image) && (
                    <AvatarSimpleImage
                      src={selectedStore.image}
                      alt={selectedStore.title}
                      size="lg"
                      className="mr-4 rounded-lg"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-amber-900">{selectedStore.title}</h2>
                    {selectedStore.isMain && (
                      <span className="inline-block mt-1 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                        總店
                      </span>
                    )}
                  </div>
                </div>
                {user && user.role === 'admin' && (
                  <Link
                    href={`/admin/locations/${selectedStore.id}/edit`}
                    className="flex items-center px-3 py-2 text-sm font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    編輯
                  </Link>
                )}
              </div>

              {/* Address & Contact */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <span className="mr-3 text-amber-600">●</span>
                  <div>
                    <p className="font-medium text-gray-800">{selectedStore.address}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedStore.landmark}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-amber-600">●</span>
                  <a
                    href={`tel:${selectedStore.phone}`}
                    className="text-amber-900 hover:underline font-medium"
                  >
                    {selectedStore.phone}
                  </a>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-amber-600">●</span>
                  <span className="text-gray-700">LINE ID: {selectedStore.lineId}</span>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-amber-600">●</span>
                  <div>
                    <span className="text-gray-700">營業時間: {selectedStore.hours}</span>
                    <span className="ml-2 text-sm text-gray-500">({selectedStore.closedDays})</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-amber-600">●</span>
                  <span className="text-gray-700">{selectedStore.parking}</span>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-amber-600">●</span>
                  <span className="text-gray-700">{selectedStore.publicTransport}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`tel:${selectedStore.phone}`}
                  className="flex-1 bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-amber-800 transition-colors"
                >
                  立即來電
                </a>
                <button
                  onClick={() => openMap(selectedStore)}
                  className="flex-1 border-2 border-amber-900 text-amber-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-900 hover:text-white transition-colors"
                >
                  查看地圖
                </button>
              </div>
            </div>

            {/* Store Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                門市特色服務
              </h3>
              <div className="space-y-3">
                {selectedStore.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <span className="mr-3 text-green-500">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map and Specialties */}
          <div className="space-y-8">
            {/* Interactive Map Area */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">門市位置</h3>
              <div className="text-center mb-4">
                <button
                  onClick={() => openMap(selectedStore)}
                  className="bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
                >
                  在 Google Maps 中查看
                </button>
              </div>
              <div className="aspect-video bg-gradient-to-br from-green-100 to-amber-100 rounded-lg overflow-hidden relative">
                {isValidImageUrl(selectedStore.image) ? (
                  <SimpleImage
                    src={selectedStore.image}
                    alt={`${selectedStore.name}門市位置`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 70vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">🏔️</div>
                    <span className="text-gray-600 text-lg font-medium">{selectedStore.name}</span>
                    <span className="text-gray-400 text-sm mt-1">門市位置圖片</span>
                  </div>
                )}
              </div>
              <div className="text-center mt-4">
                <p className="text-gray-600 text-sm">{selectedStore.landmark}</p>
              </div>
            </div>

            {/* Store Specialties */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">主打商品</h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedStore.specialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg text-center font-medium"
                  >
                    {specialty}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Stores Quick Reference */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-amber-900 mb-8">全台門市快速查詢</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {storeLocations.map(store => (
              <div
                key={store.id}
                className={`bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl flex flex-col h-full ${
                  selectedStore?.id === store.id ? 'ring-2 ring-amber-900' : ''
                }`}
              >
                <div className="text-center mb-4">
                  <h4 className="font-bold text-gray-800">{store.name}</h4>
                  {store.isMain && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      總店
                    </span>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <span className="mr-2 text-amber-600">●</span>
                      <span>{store.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-amber-600">●</span>
                      <span>{store.hours}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-amber-600">●</span>
                      <span className="truncate">
                        {store.address.split(' ')[0]} {store.address.split(' ')[1]}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-800 mb-2">提供服務：</h5>
                    <div className="space-y-1 min-h-[120px]">
                      {store.features?.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <span className="mr-2 text-green-500">✓</span>
                          <span>{feature}</span>
                        </div>
                      )) || (
                        // 如果沒有 features，顯示佔位內容
                        <div className="text-xs text-gray-500">服務資訊載入中...</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                  <button
                    onClick={() => handleStoreSelect(store)}
                    className="bg-amber-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors"
                  >
                    選擇門市
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      openMap(store)
                    }}
                    className="border border-amber-900 text-amber-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-900 hover:text-white transition-colors"
                  >
                    查看地圖
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA Section */}
      <div className="bg-amber-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">找到最近的門市了嗎？</h2>
          <p className="text-amber-100 mb-8 text-lg">
            四間門市都提供完整的農產品選購服務，歡迎就近前往體驗
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href={`tel:${selectedStore.phone}`}
              className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              聯絡 {selectedStore.name}
            </a>
            <a
              href="/products"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition-colors"
            >
              線上購買
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
