'use client'

import Link from 'next/link'
import SocialLinks from '@/components/features/social/SocialLinks'

// Contact Information SVG Icons
const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
)

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
  </svg>
)

const EmailIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)

const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.734H7.759c-.345 0-.63-.285-.63-.63 0-.346.285-.63.63-.63h4.096c.345 0 .63.284.63.63 0 .345-.285.63-.63.63H10.14v4.145z" />
    <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm6.056 14.024c0 .719-.603 1.319-1.319 1.319H7.263c-.716 0-1.319-.6-1.319-1.319V9.976c0-.719.603-1.319 1.319-1.319h9.474c.716 0 1.319.6 1.319 1.319v4.048z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="bg-amber-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* 公司簡介 */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-bold">豪德茶業</h3>
              <span className="ml-3 text-amber-200 text-sm">HAUDE TEA</span>
            </div>
            <p className="text-amber-100 mb-4 leading-relaxed">
              傳承百年茶文化，座落梅山群峰的豪德農場，以自然農法呈現四季最美的農產滋味。
              堅持有機無毒栽培，為您帶來最純淨的台灣高山農產品。
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-amber-200 text-sm">追蹤我們：</span>
              <SocialLinks size="sm" />
            </div>
          </div>

          {/* 快速連結 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-amber-200">快速連結</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  產品介紹
                </Link>
              </li>
              <li>
                <Link
                  href="/farm-tour"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  農場參觀
                </Link>
              </li>
              <li>
                <Link
                  href="/schedule"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  擺攤行程
                </Link>
              </li>
              <li>
                <Link
                  href="/locations"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  門市據點
                </Link>
              </li>
              <li>
                <Link href="/culture" className="text-amber-100 hover:text-white transition-colors">
                  歲月留影
                </Link>
              </li>
            </ul>
          </div>

          {/* 聯絡資訊 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-amber-200">聯絡資訊</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div suppressHydrationWarning={true}>
                  <LocationIcon className="w-5 h-5 mr-3 text-amber-300 flex-shrink-0" />
                </div>
                <span className="text-amber-100 text-sm leading-relaxed">
                  嘉義縣梅山鄉太和村一鄰八號
                </span>
              </div>
              <div className="flex items-center">
                <div suppressHydrationWarning={true}>
                  <PhoneIcon className="w-5 h-5 mr-3 text-amber-300 flex-shrink-0" />
                </div>
                <a
                  href="tel:05-2561843"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  05-2561843
                </a>
              </div>
              <div className="flex items-center">
                <div suppressHydrationWarning={true}>
                  <EmailIcon className="w-5 h-5 mr-3 text-amber-300 flex-shrink-0" />
                </div>
                <a
                  href="mailto:aim840912@gmail.com"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  aim840912@gmail.com
                </a>
              </div>
              <div className="flex items-center">
                <div suppressHydrationWarning={true}>
                  <LineIcon className="w-5 h-5 mr-3 text-amber-300 flex-shrink-0" />
                </div>
                <span className="text-amber-100 text-sm">LINE ID: @haudetea</span>
              </div>
              <div className="flex items-center">
                <div suppressHydrationWarning={true}>
                  <ClockIcon className="w-5 h-5 mr-3 text-amber-300 flex-shrink-0" />
                </div>
                <span className="text-amber-100 text-sm">營業時間: 08:00-18:00 (週一公休)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 版權資訊 */}
        <div className="border-t border-amber-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-amber-200 text-sm">
            <p>© 2024 豪德茶業 Haude Tea Company. 版權所有</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors">
                隱私政策
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                服務條款
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
