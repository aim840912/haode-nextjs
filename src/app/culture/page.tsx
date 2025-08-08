'use client'

import { useState } from 'react'

// 農業文化內容資料 - 瀑布流佈局
const cultureItems = [
  {
    id: 1,
    title: '創業初期歷史',
    subtitle: '1862年創立',
    description: '豪德茶業在清朝同治年間創立，以傳統手工製茶起家，見證台灣農業發展的起點。',
    color: 'bg-gradient-to-br from-amber-500 to-amber-700',
    height: 'h-64',
    textColor: 'text-white',
    emoji: '🏮'
  },
  {
    id: 2,
    title: '手工採茶工藝',
    subtitle: '傳統技術',
    description: '堅持手工採摘嫩芽，確保每片茶葉的品質。',
    color: 'bg-gradient-to-br from-green-400 to-green-600',
    height: 'h-48',
    textColor: 'text-white',
    emoji: '🍃'
  },
  {
    id: 3,
    title: '節氣農作智慧',
    subtitle: '順應自然',
    description: '依循二十四節氣進行農事活動，與大自然和諧共處，這是祖先留下的珍貴智慧。',
    color: 'bg-gradient-to-br from-teal-400 to-teal-600',
    height: 'h-72',
    textColor: 'text-white',
    emoji: '🌾'
  },
  {
    id: 4,
    title: '古法炒製',
    subtitle: '百年工藝',
    description: '傳承古老炒茶技術，每一步都是藝術。',
    color: 'bg-gradient-to-br from-orange-400 to-orange-600',
    height: 'h-56',
    textColor: 'text-white',
    emoji: '🔥'
  },
  {
    id: 5,
    title: '農村生活記憶',
    subtitle: '純樸歲月',
    description: '體驗純樸的農村日常生活，感受慢節奏的美好時光。',
    color: 'bg-gradient-to-br from-rose-400 to-rose-600',
    height: 'h-60',
    textColor: 'text-white',
    emoji: '🏡'
  },
  {
    id: 6,
    title: '傳統農具',
    subtitle: '工具文化',
    description: '從犁田到收穫，每一件農具都承載著農民的智慧與汗水。',
    color: 'bg-gradient-to-br from-brown-400 to-brown-600',
    height: 'h-68',
    textColor: 'text-white',
    emoji: '🛠️'
  },
  {
    id: 7,
    title: '豐收慶典',
    subtitle: '感恩大地',
    description: '感謝土地恩賜的傳統慶祝活動。',
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    height: 'h-52',
    textColor: 'text-white',
    emoji: '🎉'
  },
  {
    id: 8,
    title: '技藝傳承',
    subtitle: '師徒相承',
    description: '師傅帶徒弟，口耳相傳的技術傳承，確保百年工藝不失傳。',
    color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    height: 'h-64',
    textColor: 'text-white',
    emoji: '👨‍🏫'
  },
  {
    id: 9,
    title: '日治時期發展',
    subtitle: '技術革新',
    description: '引進新式製茶技術，品質獲得日本市場認可，奠定現代化基礎。',
    color: 'bg-gradient-to-br from-purple-400 to-purple-600',
    height: 'h-76',
    textColor: 'text-white',
    emoji: '⚙️'
  },
  {
    id: 10,
    title: '文化教育推廣',
    subtitle: '傳承使命',
    description: '透過教育活動推廣農業文化。',
    color: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    height: 'h-48',
    textColor: 'text-white',
    emoji: '📚'
  },
  {
    id: 11,
    title: '現代化轉型',
    subtitle: '科技結合',
    description: '傳統文化與現代科技的完美結合，開創農業新篇章。',
    color: 'bg-gradient-to-br from-blue-400 to-blue-600',
    height: 'h-72',
    textColor: 'text-white',
    emoji: '🔬'
  },
  {
    id: 12,
    title: '永續發展',
    subtitle: '綠色未來',
    description: '為未來世代保留珍貴的農業文化資產，建設永續綠色農業。',
    color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    height: 'h-68',
    textColor: 'text-white',
    emoji: '🌱'
  }
]

export default function CulturePage() {
  const [selectedItem, setSelectedItem] = useState<any>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16 mt-20 lg:mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-light text-amber-900 mb-4">歲月留影</h1>
              <p className="text-xl text-gray-700">用鏡頭記錄農家生活的點點滴滴，每一張照片都是時光的見證</p>
            </div>
            <div className="flex space-x-3">
              <a 
                href="/admin/culture"
                className="px-4 py-2 bg-orange-600 text-white rounded-full text-sm hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <span>📸</span>
                <span>影像管理</span>
              </a>
              <a 
                href="/admin/culture/add"
                className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>➕</span>
                <span>新增照片</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Masonry Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-0">
          {cultureItems.map((item) => (
            <div
              key={item.id}
              className={`${item.color} ${item.height} p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl break-inside-avoid mb-0`}
              onClick={() => setSelectedItem(item)}
            >
              <div className={`${item.textColor} h-full flex flex-col justify-between`}>
                <div>
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <div className="text-sm opacity-80 mb-2">{item.subtitle}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="inline-flex items-center text-sm opacity-80">
                    <span className="mr-2">📖</span>
                    了解更多
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="text-4xl mr-4">{selectedItem.emoji}</div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{selectedItem.subtitle}</div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Large Color Block */}
              <div className={`${selectedItem.color} aspect-video rounded-xl mb-6 flex items-center justify-center`}>
                <div className={`${selectedItem.textColor} text-center`}>
                  <div className="text-6xl mb-4 opacity-70">{selectedItem.emoji}</div>
                  <div className="text-xl font-semibold opacity-90">{selectedItem.title}</div>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  {selectedItem.description}
                </p>

                {/* Extended content based on item */}
                <div className="bg-amber-50 rounded-lg p-6 border-l-4 border-amber-400">
                  <h4 className="font-semibold text-amber-900 mb-3">💡 文化深度解析</h4>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    {selectedItem.id <= 4 && '歷史的足跡見證了豪德茶業從創立到現代化的完整發展歷程，每個階段都有其獨特的文化價值與時代意義。'}
                    {selectedItem.id > 4 && selectedItem.id <= 8 && '傳統工藝的傳承不僅是技術的延續，更是文化精神的體現，每一個細節都蘊含著深厚的農業智慧。'}
                    {selectedItem.id > 8 && '現代農業的發展需要在保持傳統文化底蘊的同時，融入科技創新，這是永續發展的關鍵所在。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Section */}
      <div className="bg-amber-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">想親身體驗這些美好時光？</h2>
          <p className="text-amber-100 mb-8 text-lg">
            歡迎參加我們的農場導覽活動，一起創造屬於您的美好回憶
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a 
              href="/farm-tour"
              className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              🌱 預約農場體驗
            </a>
            <a 
              href="/schedule"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition-colors"
            >
              📅 查看擺攤行程
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}