/**
 * InfoSection 元件
 *
 * 顯示參觀資訊與參觀須知
 */

export function InfoSection() {
  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-amber-900 mb-6">參觀資訊</h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">農場地址</h4>
            <p className="text-gray-600">嘉義縣梅山鄉太和村一鄰八號</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">開放時間</h4>
            <div className="space-y-1 text-gray-600">
              <p>週二至週日：09:00 - 17:00</p>
              <p>週一公休（國定假日正常開放）</p>
              <p className="text-sm text-amber-600">* 體驗活動請電話詢問</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">交通方式</h4>
            <div className="space-y-2 text-gray-600 text-sm">
              <p>
                <strong>自行開車：</strong>國道4號→台3線→東關路
              </p>
              <p>
                <strong>大眾運輸：</strong>台中客運→和平區→農場接駁
              </p>
              <p>
                <strong>團體包車：</strong>可協助安排遊覽車接駁
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">聯絡資訊</h4>
            <div className="space-y-1 text-gray-600">
              <p>詢問專線：05-2561843</p>
              <p>LINE ID：@haudetea</p>
              <p>信箱：tour@haudetea.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-amber-900 mb-6">參觀須知</h3>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <h4 className="font-medium text-yellow-800 mb-2">重要提醒</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 體驗活動請來電詢問詳情</li>
              <li>• 團體參觀請來電洽詢</li>
              <li>• 如遇天候不佳，活動可能調整或取消</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
            <h4 className="font-medium text-green-800 mb-2">建議攜帶</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 舒適的運動鞋或登山鞋</li>
              <li>• 帽子和防曬用品</li>
              <li>• 水壺（農場有飲水機）</li>
              <li>• 相機記錄美好時光</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h4 className="font-medium text-blue-800 mb-2">特別服務</h4>
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
            電話詢問
          </button>
        </div>
      </div>
    </div>
  )
}
