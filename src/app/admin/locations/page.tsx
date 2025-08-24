'use client'

import { useState, useEffect } from 'react'
import { Location } from '@/types/location'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import AdminProtection from '@/components/AdminProtection'

export default function LocationsAdmin() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!user) {
      alert('請先登入')
      return
    }
    
    if (!confirm('確定要刪除此門市嗎？')) return
    
    try {
      await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      setLocations(locations.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting location:', error)
      alert('刪除失敗')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  return (
    <AdminProtection>
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">門市管理</h1>
          <div className="space-x-4">
            {user?.role === 'admin' && (
              <Link 
                href="/admin/locations/add"
                className="bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
              >
                新增門市
              </Link>
            )}
            <Link 
              href="/locations"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              查看門市頁面
            </Link>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Location Header */}
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 text-center relative">
                <div className="mb-3">
                  {location.image ? (
                    location.image.startsWith('data:') || location.image.startsWith('/') ? (
                      <img 
                        src={location.image} 
                        alt={location.title}
                        className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                        <span className="text-gray-400 text-sm">無圖片</span>
                      </div>
                    )
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                      <span className="text-gray-400 text-sm">無圖片</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{location.title}</h3>
                <div className="text-sm text-gray-600">{location.name}</div>
                {location.isMain && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    總店
                  </span>
                )}
              </div>

              {/* Location Details */}
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <span className="mr-2 text-sm">📍</span>
                    <span className="text-sm text-gray-700">{location.address}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm">📞</span>
                    <span className="text-sm text-gray-700">{location.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm">⏰</span>
                    <span className="text-sm text-gray-700">{location.hours}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm">📅</span>
                    <span className="text-sm text-gray-700">{location.closedDays}</span>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">特色服務</h4>
                  <div className="text-xs text-gray-600">
                    {location.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center mb-1">
                        <span className="mr-1 text-green-500">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                    {location.features.length > 2 && (
                      <div className="text-gray-500">
                        ...等 {location.features.length} 項服務
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">主打商品</h4>
                  <div className="flex flex-wrap gap-1">
                    {location.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                        {specialty}
                      </span>
                    ))}
                    {location.specialties.length > 3 && (
                      <span className="text-xs text-gray-500">+{location.specialties.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                {user?.role === 'admin' ? (
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/locations/${location.id}/edit`}
                      className="flex-1 bg-amber-600 text-white px-3 py-2 rounded text-sm text-center hover:bg-amber-700 transition-colors"
                    >
                      編輯
                    </Link>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      刪除
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-2">
                    需要管理員權限
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">尚無門市資料</p>
            {user?.role === 'admin' && (
              <Link 
                href="/admin/locations/add"
                className="inline-block bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
              >
                新增第一個門市
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
    </AdminProtection>
  )
}