'use client';

import { useState, useEffect } from 'react';
import { FarmTourActivity } from '@/types/farmTour';

// 農場設施
const farmFacilities = [
  {
    name: '觀光步道',
    description: '全長2公里的環山步道，可欣賞整個果園風光',
    icon: '🚶‍♂️',
    features: ['景觀台', '休息涼亭', '解說牌']
  },
  {
    name: '品茶亭',
    description: '傳統竹造涼亭，提供農場自產茶品品嚐',
    icon: '🍵',
    features: ['茶藝設備', '山景視野', '文化體驗']
  },
  {
    name: '採果區域',
    description: '分區種植不同水果，依季節開放採摘體驗',
    icon: '🌳',
    features: ['紅肉李區', '季節水果', '有機栽培']
  },
  {
    name: '教學中心',
    description: '農業教學與DIY活動空間，設備齊全',
    icon: '🏫',
    features: ['投影設備', 'DIY工具', '展示空間']
  },
  {
    name: '農場餐廳',
    description: '提供使用農場食材的特色料理',
    icon: '🍽️',
    features: ['在地食材', '景觀用餐', '素食選擇']
  },
  {
    name: '停車場',
    description: '可容納30台汽車的免費停車空間',
    icon: '🚗',
    features: ['免費停車', '遊覽車位', '無障礙設施']
  }
];

export default function FarmTourPage() {
  const [selectedActivity, setSelectedActivity] = useState<FarmTourActivity | null>(null);
  const [activeTab, setActiveTab] = useState('activities');
  const [seasonalActivities, setSeasonalActivities] = useState<FarmTourActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/farm-tour');
      const data = await response.json();
      setSeasonalActivities(data);
    } catch (error) {
      console.error('Error fetching farm tour activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (activity: FarmTourActivity) => {
    setSelectedActivity(activity);
  };

  const closeModal = () => {
    setSelectedActivity(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative flex items-center justify-center bg-gradient-to-br from-green-100 via-amber-50 to-orange-100 pt-32 pb-20 min-h-screen">
        <div className="text-center relative z-10">
          <div className="text-center max-w-7xl mx-auto px-6 mb-8">
            <h1 className="text-6xl md:text-8xl font-light text-amber-900 mb-6">
              豪德觀光果園
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto">
              走進山間果園，體驗四季農情，品味自然恩賜
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => setActiveTab('activities')}
                className="bg-amber-900 text-white px-8 py-4 rounded-full hover:bg-amber-800 transition-colors text-lg"
              >
                🌱 季節體驗活動
              </button>
              <button 
                onClick={() => setActiveTab('facilities')}
                className="border-2 border-amber-900 text-amber-900 px-8 py-4 rounded-full hover:bg-amber-900 hover:text-white transition-colors text-lg"
              >
                🏞️ 農場設施導覽
              </button>
            </div>
            
            {/* Management Buttons */}
            <div className="flex flex-col md:flex-row gap-3">
              <a 
                href="/admin/farm-tour"
                className="px-6 py-3 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>🌿</span>
                <span>果園管理</span>
              </a>
              <a 
                href="/admin/farm-tour/add"
                className="px-6 py-3 bg-amber-600 text-white rounded-full text-sm hover:bg-amber-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>➕</span>
                <span>新增體驗</span>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-green-200 via-amber-200 to-orange-200"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Navigation Tabs */}
        <div className="flex mb-12 bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'activities' 
                ? 'bg-amber-900 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🌱 季節體驗活動
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'facilities' 
                ? 'bg-amber-900 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🏞️ 農場設施
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'info' 
                ? 'bg-amber-900 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📍 參觀資訊
          </button>
        </div>

        {/* 季節體驗活動 */}
        {activeTab === 'activities' && (
          <div>
            <h2 className="text-3xl font-light text-center text-amber-900 mb-12">四季農園體驗</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">載入體驗活動中...</div>
              </div>
            ) : seasonalActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">目前沒有可預約的體驗活動</div>
                <p className="text-sm text-gray-400">敬請期待更多精彩活動</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {seasonalActivities.map((activity) => (
                <div key={activity.id} className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all ${!activity.available ? 'opacity-75' : ''}`}>
                  {/* Activity Header */}
                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-8 text-center">
                    <div className="text-6xl mb-4">{activity.image}</div>
                    <h3 className="text-2xl font-bold text-amber-900 mb-2">{activity.title}</h3>
                    <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
                      <span className="bg-white px-3 py-1 rounded-full">{activity.season}</span>
                      <span className="bg-white px-3 py-1 rounded-full">{activity.months}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Highlight */}
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
                      <p className="text-amber-800 font-medium">{activity.highlight}</p>
                    </div>

                    {/* Activities List */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">活動內容</h4>
                      <div className="space-y-2">
                        {activity.activities.map((act, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-green-500">✓</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div className="flex items-center">
                        <span className="mr-2">💰</span>
                        <span className="font-bold text-amber-900">NT$ {activity.price}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        <span>{activity.duration}</span>
                      </div>
                    </div>

                    {/* Includes */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">費用包含</h4>
                      <div className="flex flex-wrap gap-2">
                        {activity.includes.map((include, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {include}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Note */}
                    <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-700 text-sm">💡 {activity.note}</p>
                    </div>

                    {/* Booking Button */}
                    <button
                      onClick={() => openBookingModal(activity)}
                      disabled={!activity.available}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        activity.available 
                          ? 'bg-amber-900 text-white hover:bg-amber-800' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {activity.available ? '立即預約體驗' : '暫停開放'}
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {/* 農場設施 */}
        {activeTab === 'facilities' && (
          <div>
            <h2 className="text-3xl font-light text-center text-amber-900 mb-12">農場設施導覽</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {farmFacilities.map((facility, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3">{facility.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-800">{facility.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-center">{facility.description}</p>
                  <div className="space-y-2">
                    {facility.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 360度農場導覽 */}
            <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-center text-amber-900 mb-8">360度農場虛擬導覽</h3>
              <div className="aspect-video bg-gradient-to-br from-green-100 to-amber-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-gray-600 mb-4">沉浸式農場體驗</p>
                  <button className="bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors">
                    開始虛擬導覽
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 參觀資訊 */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-amber-900 mb-6">參觀資訊</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">📍</span>農場地址
                  </h4>
                  <p className="text-gray-600 ml-6">台中市和平區東關路一段100號</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">⏰</span>開放時間
                  </h4>
                  <div className="ml-6 space-y-1 text-gray-600">
                    <p>週二至週日：09:00 - 17:00</p>
                    <p>週一公休（國定假日正常開放）</p>
                    <p className="text-sm text-amber-600">* 體驗活動需提前預約</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">🚗</span>交通方式
                  </h4>
                  <div className="ml-6 space-y-2 text-gray-600 text-sm">
                    <p><strong>自行開車：</strong>國道4號→台3線→東關路</p>
                    <p><strong>大眾運輸：</strong>台中客運→和平區→農場接駁</p>
                    <p><strong>團體包車：</strong>可協助安排遊覽車接駁</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">💰</span>入園費用
                  </h4>
                  <div className="ml-6 space-y-1 text-gray-600">
                    <p>一般入園：NT$ 100 / 人</p>
                    <p>12歲以下兒童：NT$ 50 / 人</p>
                    <p className="text-sm text-green-600">* 可折抵農場消費</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">📞</span>聯絡資訊
                  </h4>
                  <div className="ml-6 space-y-1 text-gray-600">
                    <p>預約專線：04-2123-4567</p>
                    <p>LINE ID：@haudefarm</p>
                    <p>信箱：tour@haudefarm.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-amber-900 mb-6">預約須知</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ 重要提醒</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 體驗活動需提前3天預約</li>
                    <li>• 團體（15人以上）請提前一週預約</li>
                    <li>• 如遇天候不佳，活動可能調整或取消</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <h4 className="font-medium text-green-800 mb-2">👕 建議攜帶</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 舒適的運動鞋或登山鞋</li>
                    <li>• 帽子和防曬用品</li>
                    <li>• 水壺（農場有飲水機）</li>
                    <li>• 相機記錄美好時光</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <h4 className="font-medium text-blue-800 mb-2">🎁 特別服務</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 免費農場導覽解說</li>
                    <li>• 團體活動客製化規劃</li>
                    <li>• 農產品宅配服務</li>
                    <li>• 企業員工旅遊包套</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  📞 立即電話預約
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-amber-900">{selectedActivity.title}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
                  <div className="text-4xl mb-2">{selectedActivity.image}</div>
                  <p className="text-amber-800 font-medium">{selectedActivity.highlight}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">預約資訊</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">參加日期</label>
                      <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">參加人數</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option>1人</option>
                        <option>2人</option>
                        <option>3-5人</option>
                        <option>6-10人</option>
                        <option>團體（11人以上）</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">聯絡姓名</label>
                      <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">聯絡電話</label>
                      <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">特殊需求或備註</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                    placeholder="如有素食需求、行動不便或其他特殊需求請註明"
                  ></textarea>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>預估費用</span>
                    <span className="text-amber-900">NT$ {selectedActivity.price} / 人</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">* 實際費用依參加人數調整，確認預約後通知</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    取消
                  </button>
                  <button className="flex-1 bg-amber-900 text-white py-3 rounded-lg hover:bg-amber-800 transition-colors">
                    確認預約
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-green-600 to-amber-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">體驗山間農情，感受自然之美</h2>
          <p className="text-green-100 mb-8 text-lg">
            歡迎來到豪德觀光果園，在這裡您可以親近土地、體驗農作、品味自然
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a 
              href="tel:04-2123-4567"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              📞 電話預約
            </a>
            <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
              📍 查看地圖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}