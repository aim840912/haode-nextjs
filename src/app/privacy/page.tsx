export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-light text-amber-900 mb-4">隱私政策</h1>
          <p className="text-xl text-gray-700">豪德農場隱私權保護政策</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">隱私權保護政策</h2>

            <div className="space-y-6 text-gray-700">
              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">資料收集</h3>
                <p>
                  豪德農場（以下簡稱「本公司」）承諾保護您的隱私權。本隱私權政策說明本公司如何收集、使用和保護您在使用我們網站和服務時提供的個人資料。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">收集的資料類型</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>個人識別資料（如姓名、電子郵件地址、電話號碼）</li>
                  <li>訂購和付款資訊</li>
                  <li>網站使用資料和 cookies</li>
                  <li>客戶服務互動記錄</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">資料使用目的</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>處理訂單和提供服務</li>
                  <li>改善網站功能和用戶體驗</li>
                  <li>發送重要通知和行銷資訊（經您同意）</li>
                  <li>客戶服務和技術支援</li>
                  <li>法律合規要求</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">資料保護措施</h3>
                <p>
                  我們實施適當的技術和組織措施來保護您的個人資料，防止未經授權的存取、使用、揭露、修改或銷毀。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">Cookie 使用</h3>
                <p>
                  本網站使用 cookies 來改善您的瀏覽體驗。您可以透過瀏覽器設定來管理 cookies 偏好。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">您的權利</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>查閱您的個人資料</li>
                  <li>更正不正確的資料</li>
                  <li>要求刪除資料</li>
                  <li>限制資料處理</li>
                  <li>資料可攜權</li>
                  <li>撤回同意</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">聯絡我們</h3>
                <p>如果您對本隱私權政策有任何疑問或需要行使您的權利，請透過以下方式聯絡我們：</p>
                <ul className="list-none space-y-1 mt-2">
                  <li>電話：05-2561843</li>
                  <li>電子郵件：aim840912@gmail.com</li>
                  <li>地址：嘉義縣梅山鄉太和村一鄰八號</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-medium text-gray-800 mb-3">政策更新</h3>
                <p>
                  本公司保留隨時修改本隱私權政策的權利。任何重大變更將在本網站上公布，並在適用時通知您。
                </p>
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
