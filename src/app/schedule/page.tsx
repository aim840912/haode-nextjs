'use client';

import { useState, useEffect } from 'react';
import SocialLinks from '@/components/SocialLinks';
import { useAuth } from '@/lib/auth-context';

interface ScheduleItem {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  products: string[];
  description: string;
  contact: string;
  specialOffer: string;
  weatherNote: string;
  createdAt: string;
  updatedAt: string;
}

// 模擬固定門市資料
const permanentStores = [
  {
    id: 1,
    name: '總店',
    address: '嘉義縣梅山鄉太和村一鄰八號',
    phone: '05-2561843',
    hours: '08:00 - 18:00',
    services: ['農場直營', '產地導覽體驗', '農產品現場挑選', '禮盒包裝服務', '農場導覽預約', '企業團購訂製']
  },
  {
    id: 2,
    name: '嘉義店',
    address: '嘉義市東區中山路218號',
    phone: '05-2234567',
    hours: '10:00 - 21:00',
    services: ['市區便利據點', '完整產品展示', '快速取貨服務', '農場體驗預約', '宅配服務中心']
  }
];

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState('market');
  const [marketSchedule, setMarketSchedule] = useState<ScheduleItem[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // 從 API 獲取擺攤行程資料
  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true);
        const response = await fetch('/api/schedule');
        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }
        const data = await response.json();
        setMarketSchedule(data);
        setFilteredSchedule(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  const filterByStatus = (status: 'all' | 'upcoming' | 'ongoing' | 'completed') => {
    if (status === 'all') {
      setFilteredSchedule(marketSchedule);
    } else {
      setFilteredSchedule(marketSchedule.filter(item => item.status === status));
    }
  };

  const getStatusColor = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming': return '即將到來';
      case 'ongoing': return '進行中';
      case 'completed': return '已結束';
      default: return '未知';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('zh-TW', options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl font-light text-amber-900 mb-4">擺攤行程 & 門市據點</h1>
              <p className="text-xl text-gray-700">想要現場選購新鮮農產品？來找我們吧！</p>
            </div>
            {user && user.role === 'admin' && (
              <div className="flex space-x-3">
                <a
                  href="/admin/schedule"
                  className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <span>行程管理</span>
                </a>
                <a
                  href="/admin/schedule/add"
                  className="px-4 py-2 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>新增行程</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex mb-8 bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${activeTab === 'market'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            市集擺攤行程
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${activeTab === 'stores'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            固定門市據點
          </button>
        </div>

        {activeTab === 'market' && (
          <div>
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => filterByStatus('all')}
                className="px-4 py-2 bg-amber-500 text-white border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                全部行程
              </button>
              <button
                onClick={() => filterByStatus('upcoming')}
                className="px-4 py-2 bg-green-500 border border-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                即將到來
              </button>
              <button
                onClick={() => filterByStatus('completed')}
                className="px-4 py-2 bg-gray-500 border border-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                已結束
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                <p className="mt-4 text-gray-600">載入行程資料中...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">❌ {error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  重新載入
                </button>
              </div>
            )}

            {/* Market Schedule Cards */}
            {!loading && !error && (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredSchedule.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    目前沒有符合條件的行程
                  </div>
                ) : (
                  filteredSchedule.map((schedule) => (
                    <div key={schedule.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{schedule.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(schedule.status as 'upcoming' | 'ongoing' | 'completed')}`}>
                          {getStatusText(schedule.status as 'upcoming' | 'ongoing' | 'completed')}
                        </span>
                      </div>

                      {/* Date and Time */}
                      <div className="flex items-center mb-3 text-amber-700">
                        <span className="mr-2">📅</span>
                        <span className="font-medium">{formatDate(schedule.date)}</span>
                      </div>
                      <div className="flex items-center mb-3 text-gray-600">
                        <span className="mr-2">⏰</span>
                        <span>{schedule.time}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-start mb-4 text-gray-600">
                        <span className="mr-2 mt-1">📍</span>
                        <div>
                          <div className="font-medium">{schedule.location}</div>
                          <div className="text-sm mt-1">{schedule.description}</div>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">販售商品：</div>
                        <div className="flex flex-wrap gap-2">
                          {schedule.products.map((product, index) => (
                            <span key={index} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Special Offer */}
                      {schedule.specialOffer && (
                        <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                          <div className="text-sm font-medium text-orange-700">🎁 特別優惠</div>
                          <div className="text-sm text-orange-600 mt-1">{schedule.specialOffer}</div>
                        </div>
                      )}

                      {/* Weather Note */}
                      {schedule.weatherNote && schedule.status === 'upcoming' && (
                        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                          <div className="text-sm font-medium text-blue-700">⛅ 天氣提醒</div>
                          <div className="text-sm text-blue-600 mt-1">{schedule.weatherNote}</div>
                        </div>
                      )}

                      {/* Contact */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2">📞</span>
                          <span className="text-sm">{schedule.contact}</span>
                        </div>
                        {schedule.status === 'upcoming' && (
                          <button className="bg-amber-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors">
                            設定提醒
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stores' && (
          <div>
            <div className="grid md:grid-cols-3 gap-6">
              {permanentStores.map((store) => (
                <div key={store.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col h-full">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{store.name}</h3>

                  <div className="flex-grow">
                    {/* Address */}
                    <div className="flex items-start mb-3 text-gray-600">
                      <span className="mr-2 mt-1">📍</span>
                      <span className="text-sm">{store.address}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center mb-3 text-gray-600">
                      <span className="mr-2">📞</span>
                      <span className="text-sm">{store.phone}</span>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center mb-4 text-gray-600">
                      <span className="mr-2">⏰</span>
                      <span className="text-sm">{store.hours}</span>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">提供服務：</div>
                      <div className="space-y-1 min-h-[120px]">
                        {store.services.map((service, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-green-500">✓</span>
                            <span>{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;
                      window.open(googleMapsUrl, '_blank');
                    }}
                    className="w-full bg-amber-900 text-white py-2 rounded-lg text-sm hover:bg-amber-800 transition-colors mt-auto"
                  >
                    查看地圖
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact CTA Section */}
      <div className="bg-amber-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">找不到合適的時間地點？</h2>
          <p className="text-amber-100 mb-8 text-lg">
            我們也接受團購訂單和企業採購，歡迎來電洽詢客製化服務
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <a
              href="tel:05-2561843"
              className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              📞 立即來電詢問
            </a>
            <a
              href="/products"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition-colors"
            >
              🛒 線上訂購
            </a>
            <div className="flex items-center space-x-3">
              <span className="text-amber-100 text-sm">追蹤更多消息：</span>
              <SocialLinks size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}