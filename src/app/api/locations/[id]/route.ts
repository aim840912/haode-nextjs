import { NextRequest, NextResponse } from 'next/server'
import { Location } from '@/types/location'

// 這應該與主要 route.ts 共享相同的資料存儲
// 在實際應用中，這會是資料庫查詢
let locations: Location[] = [
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
    isMain: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    isMain: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    isMain: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    isMain: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const location = locations.find(l => l.id === parseInt(id))
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const locationIndex = locations.findIndex(l => l.id === parseInt(id))
    
    if (locationIndex === -1) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }
    
    const updatedLocation = {
      ...locations[locationIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    locations[locationIndex] = updatedLocation
    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const locationIndex = locations.findIndex(l => l.id === parseInt(id))
    
    if (locationIndex === -1) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }
    
    locations.splice(locationIndex, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}