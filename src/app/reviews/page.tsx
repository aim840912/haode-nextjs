'use client'

import { useState } from 'react'
import ReviewForm from '@/components/ReviewForm'
import ReviewList from '@/components/ReviewList'
import SocialLinks from '@/components/SocialLinks'
import Link from 'next/link'

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'product' | 'farm-tour' | 'write'>('all')
  const [showForm, setShowForm] = useState(false)

  const tabs = [
    { id: 'all', label: '全部評價', category: undefined },
    { id: 'product', label: '產品評價', category: 'product' },
    { id: 'farm-tour', label: '農場體驗', category: 'farm-tour' },
    { id: 'write', label: '寫評價', category: undefined }
  ]

  return (
    <>
      {/* 結構化資料 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "豪德茶業",
            "url": "https://haude.com",
            "logo": "https://haude.com/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+886-4-2123-4567",
              "contactType": "customer service",
              "areaServed": "TW",
              "availableLanguage": "zh-TW"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "500",
              "bestRating": "5",
              "worstRating": "1"
            },
            "review": [
              {
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": "陳小華"
                },
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5"
                },
                "reviewBody": "從豪德農場買的紅肉李真的太好吃了！果肉飽滿多汁，甜度剛好，而且包裝很用心。"
              }
            ]
          })
        }}
      />
      <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-amber-900 mb-4">顧客心聲</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            聽聽我們珍貴顧客的真實分享，每一個回饋都是我們持續改進的動力
          </p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-amber-900 mb-2">500+</div>
            <div className="text-sm text-gray-600">總評價數</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">4.8</div>
            <div className="text-sm text-gray-600">平均評分</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
            <div className="text-sm text-gray-600">推薦率</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">200+</div>
            <div className="text-sm text-gray-600">回頭客</div>
          </div>
        </div>

        {/* 標籤導航 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'all' | 'product' | 'farm-tour' | 'write')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 內容區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要內容 */}
          <div className="lg:col-span-2">
            {activeTab === 'write' ? (
              <ReviewForm
                category="general"
                onSubmitSuccess={() => {
                  setActiveTab('all')
                  setShowForm(false)
                }}
              />
            ) : (
              <>
                {/* 精選評價區塊 */}
                {activeTab === 'all' && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                      <span className="mr-3">⭐</span>
                      精選評價
                    </h2>
                    <ReviewList
                      approved={true}
                      featured={true}
                      limit={3}
                      className="mb-8"
                    />
                  </div>
                )}

                {/* 所有評價 */}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    {activeTab === 'all' ? '所有評價' : 
                     activeTab === 'product' ? '產品評價' : '農場體驗心得'}
                  </h2>
                  <ReviewList
                    approved={true}
                    category={tabs.find(t => t.id === activeTab)?.category}
                  />
                </div>
              </>
            )}
          </div>

          {/* 側邊欄 */}
          <div className="space-y-6">
            {/* 快速分享 */}
            {activeTab !== 'write' && (
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">
                  分享您的體驗
                </h3>
                <p className="text-amber-800 text-sm mb-4">
                  您的意見對我們很重要，快來分享您的購買或體驗心得吧！
                </p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="w-full bg-amber-900 text-white py-2 px-4 rounded-lg hover:bg-amber-800 transition-colors mb-4"
                >
                  立即分享
                </button>
                <div className="border-t pt-4">
                  <p className="text-amber-700 text-xs mb-2">也可在社群分享：</p>
                  <SocialLinks size="sm" />
                </div>
              </div>
            )}

            {/* 聯絡資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                聯絡我們
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-3">📞</span>
                  <span>05-2561843</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3">✉️</span>
                  <span>aim660617@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3">📍</span>
                  <span>嘉義縣梅山鄉太和村一鄰八號</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3">⏰</span>
                  <span>週一至週日 9:00-18:00</span>
                </div>
              </div>
            </div>

            {/* 相關連結 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                探索更多
              </h3>
              <div className="space-y-3">
                <Link 
                  href="/products"
                  className="block text-amber-700 hover:text-amber-900 transition-colors"
                >
                  → 瀏覽產品
                </Link>
                <Link 
                  href="/farm-tour"
                  className="block text-amber-700 hover:text-amber-900 transition-colors"
                >
                  → 預約農場體驗
                </Link>
                <Link 
                  href="/schedule"
                  className="block text-amber-700 hover:text-amber-900 transition-colors"
                >
                  → 查看擺攤行程
                </Link>
                <Link 
                  href="/news"
                  className="block text-amber-700 hover:text-amber-900 transition-colors"
                >
                  → 最新消息
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 回到首頁按鈕 */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-block bg-amber-900 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-amber-800 transition-colors"
          >
            回到首頁
          </Link>
        </div>
      </div>
      </div>
    </>
  )
}