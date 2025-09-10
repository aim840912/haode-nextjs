export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-light text-amber-900 mb-4">服務條款</h1>
          <p className="text-xl text-gray-700">豪德農場服務使用條款</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">服務條款</h2>

            <div className="space-y-6 text-gray-700">
              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">服務概述</h3>
                <p>
                  歡迎使用豪德農場（以下簡稱「本公司」）提供的網站和服務。使用本服務即表示您同意遵守以下服務條款。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">帳戶註冊</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>您必須提供準確、完整的註冊資訊</li>
                  <li>您有責任保護帳戶安全和密碼機密性</li>
                  <li>您對帳戶下的所有活動負責</li>
                  <li>發現未經授權使用時應立即通知我們</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">產品與服務</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>所有產品資訊僅供參考，實際商品以收到的產品為準</li>
                  <li>產品價格和供應情況可能隨時變更</li>
                  <li>我們保留拒絕或取消訂單的權利</li>
                  <li>產品圖片僅供參考，實際商品可能略有差異</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">訂購與付款</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>訂單確認後即構成購買合約</li>
                  <li>付款方式包括現金、轉帳等指定方式</li>
                  <li>所有價格均以新台幣計算</li>
                  <li>如有價格錯誤，我們保留更正的權利</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">配送與退換貨</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>配送時間依產品類型和地區而定</li>
                  <li>新鮮農產品特性，恕不接受無理由退換貨</li>
                  <li>如商品有瑕疵或損壞，請於收貨後24小時內聯絡我們</li>
                  <li>退換貨需符合相關條件和程序</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">使用限制</h3>
                <p>您同意不會：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>用於任何非法或未經授權的目的</li>
                  <li>侵犯他人的智慧財產權</li>
                  <li>上傳或傳輸有害內容</li>
                  <li>干擾網站正常運作</li>
                  <li>繞過安全措施或限制</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">智慧財產權</h3>
                <p>
                  本網站的所有內容，包括但不限於文字、圖片、商標、設計等，均為本公司或其授權方所有，受智慧財產權法保護。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">責任限制</h3>
                <p>
                  在法律允許的範圍內，本公司對於因使用本服務而產生的任何間接、特殊或衍生性損害不承擔責任。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">條款修改</h3>
                <p>本公司保留隨時修改本服務條款的權利。修改後的條款將在本網站公布並立即生效。</p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">適用法律</h3>
                <p>本服務條款受中華民國法律管轄。任何爭議應由台灣嘉義地方法院管轄。</p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">聯絡資訊</h3>
                <p>如有任何疑問，請聯絡我們：</p>
                <ul className="list-none space-y-1 mt-2">
                  <li>電話：05-2561843</li>
                  <li>電子郵件：aim840912@gmail.com</li>
                  <li>地址：嘉義縣梅山鄉太和村一鄰八號</li>
                </ul>
              </section>

              <div className="bg-amber-50 p-4 rounded-lg mt-8">
                <p className="text-sm text-amber-800">最後更新日期：2024年12月</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
