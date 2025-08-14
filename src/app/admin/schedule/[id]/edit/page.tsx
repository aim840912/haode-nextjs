'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScheduleItem } from '@/types/schedule'
import { Product } from '@/types/product'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function EditSchedule({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [scheduleId, setScheduleId] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const { user, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: '',
    time: '',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed',
    products: [] as string[],
    description: '',
    contact: '',
    specialOffer: '',
    weatherNote: ''
  })

  const marketSuggestions = [
    '台中逢甲夜市',
    '台北士林夜市', 
    '高雄六合夜市',
    '彰化員林市集',
    '台南花園夜市',
    '桃園中壢夜市'
  ]

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.filter((p: Product) => p.isActive))
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [])

  const fetchSchedule = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/schedule/${id}`)
      if (response.ok) {
        const schedule: ScheduleItem = await response.json()
        setFormData({
          title: schedule.title,
          location: schedule.location,
          date: schedule.date,
          time: schedule.time,
          status: schedule.status,
          products: schedule.products,
          description: schedule.description,
          contact: schedule.contact,
          specialOffer: schedule.specialOffer || '',
          weatherNote: schedule.weatherNote || ''
        })
      } else {
        alert('行程不存在')
        router.push('/admin/schedule')
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
      alert('載入失敗')
    } finally {
      setInitialLoading(false)
    }
  }, [router])

  useEffect(() => {
    params.then(({ id }) => {
      setScheduleId(id)
      fetchSchedule(id)
      fetchProducts()
    })
  }, [params, fetchSchedule, fetchProducts])

  // 載入中狀態
  if (isLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入</h1>
          <p className="text-gray-600 mb-8">此頁面需要管理員權限才能存取</p>
          <div className="space-x-4">
            <Link 
              href="/login"
              className="inline-block bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              立即登入
            </Link>
            <Link 
              href="/"
              className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/schedule')
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProductChange = (productName: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productName)
        ? prev.products.filter(p => p !== productName)
        : [...prev.products, productName]
    }))
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="text-center text-gray-900 font-medium">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin/schedule"
              className="text-purple-600 hover:text-purple-800"
            >
              ← 回到行程管理
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">編輯擺攤行程</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                市集/夜市名稱 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                list="market-suggestions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="輸入市集或夜市名稱"
              />
              <datalist id="market-suggestions">
                {marketSuggestions.map(market => (
                  <option key={market} value={market} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                狀態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              >
                <option value="upcoming">即將到來</option>
                <option value="ongoing">進行中</option>
                <option value="completed">已結束</option>
              </select>
            </div>
          </div>

          {/* 地點 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              詳細地址 *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="完整地址，包含縣市區域"
            />
          </div>

          {/* 日期時間 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                日期 *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                時間 *
              </label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                placeholder="例如：17:00 - 23:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              地點描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="攤位位置、交通資訊等補充說明"
            />
          </div>

          {/* 販售商品 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              販售商品 *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((product) => (
                <label key={product.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.products.includes(product.name)}
                    onChange={() => handleProductChange(product.name)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 flex items-center">
                    <span className="mr-1">{product.emoji}</span>
                    {product.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              已選擇 {formData.products.length} 項商品
            </div>
          </div>

          {/* 聯絡資訊和優惠 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                聯絡電話 *
              </label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="聯絡電話"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                特別優惠
              </label>
              <input
                type="text"
                name="specialOffer"
                value={formData.specialOffer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="例如：買二送一、滿額折扣等"
              />
            </div>
          </div>

          {/* 天氣備註 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              天氣備註
            </label>
            <input
              type="text"
              name="weatherNote"
              value={formData.weatherNote}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="例如：如遇雨天取消、有遮陽棚等"
            />
          </div>

          {/* 預覽區 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">即時預覽</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{formData.title || '市集名稱'}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                  formData.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {formData.status === 'upcoming' ? '即將到來' : 
                   formData.status === 'ongoing' ? '進行中' : '已結束'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <div>📅 {formData.date ? new Date(formData.date).toLocaleDateString('zh-TW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '請選擇日期'}</div>
                <div>⏰ {formData.time || '請輸入時間'}</div>
                <div>📍 {formData.location || '請輸入地址'}</div>
                <div>📞 {formData.contact || '請輸入聯絡電話'}</div>
              </div>

              {formData.description && (
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-medium">描述：</div>
                  <div>{formData.description}</div>
                </div>
              )}

              {formData.products.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">販售商品：</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.products.map((product, index) => (
                      <span key={index} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.specialOffer && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-2 rounded-r text-sm mb-3">
                  <div className="text-orange-700 font-medium">🎁 特別優惠</div>
                  <div className="text-orange-600">{formData.specialOffer}</div>
                </div>
              )}

              {formData.weatherNote && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded-r text-sm">
                  <div className="text-blue-700 font-medium">🌤️ 天氣備註</div>
                  <div className="text-blue-600">{formData.weatherNote}</div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-3">
                更新時間：{new Date().toLocaleDateString('zh-TW')}
              </div>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-6">
            <Link
              href="/admin/schedule"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || formData.products.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '更新行程'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}