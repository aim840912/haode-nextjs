/**
 * TrustSection 元件
 *
 * 顯示社會證明區塊，包含認證標章
 */

import { Award, Star, CheckCircle, Heart } from 'lucide-react'

export function TrustSection() {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">值得信賴的農場體驗</h2>

        {/* 認證標章 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="flex flex-col items-center text-center p-6 bg-green-50 rounded-xl">
            <Award className="w-12 h-12 mb-3 text-green-600" />
            <h3 className="font-bold text-gray-800 mb-1">有機認證</h3>
            <p className="text-sm text-gray-600">通過有機農業認證</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-amber-50 rounded-xl">
            <Star className="w-12 h-12 mb-3 text-amber-500" />
            <h3 className="font-bold text-gray-800 mb-1">觀光農場</h3>
            <p className="text-sm text-gray-600">合格觀光果園</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl">
            <CheckCircle className="w-12 h-12 mb-3 text-blue-600" />
            <h3 className="font-bold text-gray-800 mb-1">食安把關</h3>
            <p className="text-sm text-gray-600">嚴格品質控管</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-xl">
            <Heart className="w-12 h-12 mb-3 text-purple-600" />
            <h3 className="font-bold text-gray-800 mb-1">親子友善</h3>
            <p className="text-sm text-gray-600">適合全家同樂</p>
          </div>
        </div>
      </div>
    </div>
  )
}
