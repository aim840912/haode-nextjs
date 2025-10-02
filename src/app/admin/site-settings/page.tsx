'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminProtection from '@/components/features/admin/AdminProtection'
import ImageUploader from '@/components/admin/ImageUploader'
import { Save, RefreshCw, Home, Leaf, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { SETTING_KEYS } from '@/types/siteSettings'

interface Setting {
  key: string
  value: string
  type: string
  description: string | null
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [homeHeroImages, setHomeHeroImages] = useState<string[]>([])
  const [farmTourHeroBg, setFarmTourHeroBg] = useState<string>('')

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-settings')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '載入設定失敗')
      }

      const settingsMap: Record<string, Setting> = {}
      result.data.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting
      })

      setSettings(settingsMap)

      if (settingsMap[SETTING_KEYS.HOME_HERO_IMAGES]) {
        try {
          const images = JSON.parse(settingsMap[SETTING_KEYS.HOME_HERO_IMAGES].value)
          setHomeHeroImages(Array.isArray(images) ? images : [])
        } catch (_e) {
          setHomeHeroImages([])
        }
      }

      if (settingsMap[SETTING_KEYS.FARM_TOUR_HERO_BG]) {
        setFarmTourHeroBg(settingsMap[SETTING_KEYS.FARM_TOUR_HERO_BG].value)
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '載入設定失敗')
    } finally {
      setLoading(false)
    }
  }, [showMessage])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleAddHomeHeroImage = (imageUrl: string) => {
    setHomeHeroImages(prev => [...prev, imageUrl])
  }

  const handleRemoveHomeHeroImage = (index: number) => {
    setHomeHeroImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleFarmTourBgUpload = (imageUrl: string) => {
    setFarmTourHeroBg(imageUrl)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = [
        {
          key: SETTING_KEYS.HOME_HERO_IMAGES,
          value: JSON.stringify(homeHeroImages),
        },
        {
          key: SETTING_KEYS.FARM_TOUR_HERO_BG,
          value: farmTourHeroBg,
        },
      ]

      for (const update of updates) {
        const response = await fetch(`/api/site-settings?key=${update.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: update.value }),
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || '儲存失敗')
        }
      }

      showMessage('success', '設定已成功儲存')
      await loadSettings()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">載入設定中...</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">網站設定管理</h1>
                  <p className="text-sm text-gray-600 mt-1">管理首頁和農場體驗頁的圖片</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadSettings}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>重新載入</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? '儲存中...' : '儲存變更'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <div
              className={`rounded-lg p-4 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* 首頁設定 */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Home className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">首頁輪播圖片</h2>
            </div>

            <div className="space-y-6">
              {homeHeroImages.map((image, index) => (
                <div key={index} className="relative">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="relative w-full h-48">
                        <Image
                          src={image}
                          alt={`首頁圖片 ${index + 1}`}
                          fill
                          className="object-cover rounded-lg border-2 border-gray-200"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 break-all">{image}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveHomeHeroImage(index)}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="移除圖片"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <ImageUploader
                  label={`新增第 ${homeHeroImages.length + 1} 張輪播圖片`}
                  onUpload={handleAddHomeHeroImage}
                />
              </div>

              {homeHeroImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>尚未新增任何輪播圖片</p>
                  <p className="text-sm mt-1">建議新增 3-5 張圖片</p>
                </div>
              )}
            </div>
          </section>

          {/* 農場體驗頁設定 */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Leaf className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">農場體驗頁面背景圖片</h2>
            </div>

            <ImageUploader
              currentImage={farmTourHeroBg}
              label="背景圖片"
              onUpload={handleFarmTourBgUpload}
              onRemove={() => setFarmTourHeroBg('')}
            />

            {farmTourHeroBg && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">當前圖片路徑：</p>
                <p className="text-sm text-gray-800 break-all mt-1">{farmTourHeroBg}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminProtection>
  )
}
