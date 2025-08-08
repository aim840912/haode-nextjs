'use client';

import { useState } from 'react';

// 所有門市據點資料
const storeLocations = [
  {
    id: 1,
    name: '總店',
    title: '豪德茶業總店',
    address: '南投縣埔里鎮中山路一段168號',
    landmark: '埔里酒廠對面，好找好停車',
    phone: '049-291-5678',
    lineId: '@haudetea',
    hours: '09:00-19:00',
    closedDays: '無公休日',
    parking: '店前免費停車場（30個車位）',
    publicTransport: '埔里轉運站步行5分鐘',
    features: [
      '現場品茶試飲，專人解說茶文化',
      '農產品現場挑選，品質保證',
      '禮盒包裝服務，送禮自用兩相宜',
      '免費停車場，交通便利',
      '農場導覽預約服務',
      '企業團購訂製服務'
    ],
    specialties: ['紅肉李', '精品咖啡', '季節水果', '有機蔬菜', '茶葉', '農產加工品'],
    coordinates: { lat: 23.9693, lng: 120.9417 },
    image: '🏪',
    isMain: true
  },
  {
    id: 2,
    name: '台北店',
    title: '豪德茶業台北旗艦店',
    address: '台北市中正區重慶南路一段100號',
    landmark: '台北車站Z10出口步行3分鐘',
    phone: '02-2345-6789',
    lineId: '@haudetea-taipei',
    hours: '10:00-21:00',
    closedDays: '週一公休',
    parking: '鄰近有付費停車場',
    publicTransport: '台北車站步行3分鐘',
    features: [
      '都會區最大展示空間',
      '完整產品線展示',
      '商務禮盒專區',
      '快速宅配服務',
      '企業採購諮詢',
      '品茶體驗空間'
    ],
    specialties: ['商務禮盒', '精品茶葉', '咖啡豆', '伴手禮'],
    coordinates: { lat: 25.0478, lng: 121.5170 },
    image: '🌆',
    isMain: false
  },
  {
    id: 3,
    name: '台中店',
    title: '豪德茶業台中分店',
    address: '台中市西區台灣大道二段200號',
    landmark: '廣三SOGO百貨旁',
    phone: '04-2345-6789',
    lineId: '@haudetea-taichung',
    hours: '10:00-20:00',
    closedDays: '週二公休',
    parking: '百貨公司地下停車場',
    publicTransport: '台中火車站搭公車15分鐘',
    features: [
      '百貨商圈據點',
      '購物便利性佳',
      '農場導覽預約',
      '在地配送服務',
      '親子友善空間'
    ],
    specialties: ['新鮮水果', '農場體驗券', '親子禮盒'],
    coordinates: { lat: 24.1477, lng: 120.6736 },
    image: '🏢',
    isMain: false
  },
  {
    id: 4,
    name: '高雄店',
    title: '豪德茶業高雄分店',
    address: '高雄市前金區中正四路300號',
    landmark: '高雄火車站商圈',
    phone: '07-345-6789',
    lineId: '@haudetea-kaohsiung',
    hours: '10:00-20:00',
    closedDays: '週二公休',
    parking: '火車站周邊停車場',
    publicTransport: '高雄火車站步行8分鐘',
    features: [
      '南台灣服務據點',
      '團購服務專區',
      '企業訂購服務',
      '快速物流配送'
    ],
    specialties: ['團購優惠', '企業訂購', '物流配送'],
    coordinates: { lat: 22.6273, lng: 120.3014 },
    image: '🌴',
    isMain: false
  }
];

export default function LocationsPage() {
  const [selectedStore, setSelectedStore] = useState(storeLocations[0]);
  const [showMap, setShowMap] = useState(false);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
  };

  const openMap = (store) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${store.coordinates.lat},${store.coordinates.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16 mt-20 lg:mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-light text-amber-900 mb-4">門市據點</h1>
          <p className="text-xl text-gray-700">全台四間門市，就近選購優質農產品</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Store Selection Tabs */}
        <div className="flex flex-wrap justify-center mb-12 bg-white rounded-lg shadow-sm p-2">
          {storeLocations.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreSelect(store)}
              className={`px-6 py-3 rounded-lg font-medium transition-all m-1 ${
                selectedStore.id === store.id
                  ? 'bg-amber-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{store.image}</span>
              {store.name}
              {store.isMain && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">總店</span>}
            </button>
          ))}
        </div>

        {/* Selected Store Details */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Store Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">{selectedStore.image}</span>
                <div>
                  <h2 className="text-2xl font-bold text-amber-900">{selectedStore.title}</h2>
                  {selectedStore.isMain && (
                    <span className="inline-block mt-1 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                      🏪 總店
                    </span>
                  )}
                </div>
              </div>

              {/* Address & Contact */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <span className="mr-3 text-lg">📍</span>
                  <div>
                    <p className="font-medium text-gray-800">{selectedStore.address}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedStore.landmark}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-lg">📞</span>
                  <a href={`tel:${selectedStore.phone}`} className="text-amber-900 hover:underline font-medium">
                    {selectedStore.phone}
                  </a>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-lg">💬</span>
                  <span className="text-gray-700">LINE ID: {selectedStore.lineId}</span>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-lg">⏰</span>
                  <div>
                    <span className="text-gray-700">營業時間: {selectedStore.hours}</span>
                    <span className="ml-2 text-sm text-gray-500">({selectedStore.closedDays})</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-lg">🚗</span>
                  <span className="text-gray-700">{selectedStore.parking}</span>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 text-lg">🚌</span>
                  <span className="text-gray-700">{selectedStore.publicTransport}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`tel:${selectedStore.phone}`}
                  className="flex-1 bg-amber-900 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-amber-800 transition-colors"
                >
                  📞 立即來電
                </a>
                <button
                  onClick={() => openMap(selectedStore)}
                  className="flex-1 border-2 border-amber-900 text-amber-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-900 hover:text-white transition-colors"
                >
                  🗺️ 查看地圖
                </button>
              </div>
            </div>

            {/* Store Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                <span className="mr-2">✨</span>門市特色服務
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
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                <span className="mr-2">🗺️</span>門市位置
              </h3>
              <div className="aspect-video bg-gradient-to-br from-green-100 to-amber-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">{selectedStore.image}</div>
                  <p className="text-gray-600 mb-4">互動式地圖</p>
                  <button
                    onClick={() => openMap(selectedStore)}
                    className="bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    在 Google Maps 中查看
                  </button>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">{selectedStore.landmark}</p>
              </div>
            </div>

            {/* Store Specialties */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                <span className="mr-2">🌟</span>主打商品
              </h3>
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

            {/* Store Stats */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-amber-900 mb-6 text-center">門市資訊一覽</h3>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-amber-900">
                    {selectedStore.hours.split('-')[1].split(':')[0] - selectedStore.hours.split('-')[0].split(':')[0]}
                  </div>
                  <div className="text-sm text-gray-600">營業小時</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900">
                    {selectedStore.closedDays === '無公休日' ? '7' : '6'}
                  </div>
                  <div className="text-sm text-gray-600">營業天數/週</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900">{selectedStore.specialties.length}</div>
                  <div className="text-sm text-gray-600">主打商品</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900">{selectedStore.features.length}</div>
                  <div className="text-sm text-gray-600">特色服務</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Stores Quick Reference */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-amber-900 mb-8">全台門市快速查詢</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {storeLocations.map((store) => (
              <div
                key={store.id}
                className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                  selectedStore.id === store.id ? 'ring-2 ring-amber-900' : ''
                }`}
                onClick={() => handleStoreSelect(store)}
              >
                <div className="text-center mb-4">
                  <span className="text-3xl">{store.image}</span>
                  <h4 className="font-bold text-gray-800 mt-2">{store.name}</h4>
                  {store.isMain && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">總店</span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-2">📞</span>
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">⏰</span>
                    <span>{store.hours}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📍</span>
                    <span className="truncate">{store.address.split(' ')[0]} {store.address.split(' ')[1]}</span>
                  </div>
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
              📞 聯絡 {selectedStore.name}
            </a>
            <a 
              href="/products"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition-colors"
            >
              🛒 線上購買
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}