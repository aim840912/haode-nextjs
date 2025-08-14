'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import LoadingSpinner, { LoadingButton } from '@/components/LoadingSpinner';
import OptimizedImage from '@/components/OptimizedImage';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { cart, totalItems, totalPrice } = useCart();
  const { success, error } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: '台灣'
    }
  });

  // 模擬訂單資料
  const [orders] = useState([
    {
      id: 'order-001',
      date: '2024-01-14',
      status: 'delivered',
      total: 680,
      items: [
        { name: '高山紅肉李', quantity: 1, price: 680 }
      ]
    },
    {
      id: 'order-002', 
      date: '2024-01-10',
      status: 'processing',
      total: 450,
      items: [
        { name: '精品濾掛咖啡', quantity: 1, price: 450 }
      ]
    }
  ]);

  // 初始化表單資料
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || '台灣'
        }
      });
    }
  }, [user]);

  // 路由保護
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      });
      
      setIsEditing(false);
      success('資料更新成功', '您的個人資料已更新');
    } catch (err) {
      error('更新失敗', '請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return '處理中';
      case 'shipped': return '已出貨';
      case 'delivered': return '已送達';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-36 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 會被路由保護重定向
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">會員中心</h1>
          <p className="text-gray-600">歡迎回來，{user.name}</p>
        </div>

        <div className="lg:grid lg:grid-cols-4 gap-8">
          {/* 側邊導航 */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-amber-100 text-amber-900' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  👤 個人資料
                </button>
                <button
                  onClick={() => setActiveTab('cart')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'cart' 
                      ? 'bg-amber-100 text-amber-900' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🛒 購物車 ({totalItems})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-amber-100 text-amber-900' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📦 訂單記錄
                </button>
              </nav>
            </div>
          </div>

          {/* 主要內容 */}
          <div className="lg:col-span-3">
            {/* 個人資料 Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">個人資料</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      編輯資料
                    </button>
                  ) : (
                    <div className="space-x-6">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <LoadingButton
                        loading={isSaving}
                        onClick={handleSave}
                        className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800"
                      >
                        儲存
                      </LoadingButton>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* 基本資料 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">基本資料</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-600 text-sm">({isEditing ? '無法修改' : '聯絡用信箱'})</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="請輸入電話號碼"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.phone || '未設定'}</p>
                      )}
                    </div>
                  </div>

                  {/* 地址資料 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">地址資料</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">國家</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.country || '未設定'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          placeholder="請輸入城市"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.city || '未設定'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">街道地址</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          placeholder="請輸入詳細地址"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.street || '未設定'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">郵遞區號</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address.postalCode"
                          value={formData.address.postalCode}
                          onChange={handleInputChange}
                          placeholder="請輸入郵遞區號"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                        />
                      ) : (
                        <p className="text-gray-900">{user.address?.postalCode || '未設定'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 購物車 Tab */}
            {activeTab === 'cart' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">購物車預覽</h2>
                  <Link 
                    href="/cart"
                    className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    前往購物車
                  </Link>
                </div>

                {cart.items.length > 0 ? (
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={item.product.images?.[0] || '/images/placeholder.jpg'}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                          <p className="text-gray-600">數量: {item.quantity}</p>
                          <p className="text-amber-900 font-semibold">NT$ {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>總計 ({totalItems} 件)</span>
                        <span className="text-amber-900">NT$ {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-600 mb-4">購物車是空的</p>
                    <Link 
                      href="/products"
                      className="inline-block px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      開始購物
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 訂單記錄 Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">訂單記錄</h2>
                
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">訂單 #{order.id}</h3>
                            <p className="text-gray-600 text-sm">{order.date}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{item.name} x {item.quantity}</span>
                              <span>NT$ {item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <span className="font-semibold">總計</span>
                          <span className="font-bold text-amber-900">NT$ {order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600">尚無訂單記錄</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}