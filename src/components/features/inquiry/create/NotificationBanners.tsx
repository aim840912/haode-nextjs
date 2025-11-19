/**
 * Notification Banners Component
 *
 * 通知橫幅元件集合
 * 包含自動保存提示、訪客提示、智慧預填提示等
 */

interface NotificationBannersProps {
  isLoggedIn: boolean
  showAutoSaveNotice: boolean
  isAutoSaving: boolean
  isDirty: boolean
}

export function NotificationBanners({
  isLoggedIn,
  showAutoSaveNotice,
  isAutoSaving,
  isDirty,
}: NotificationBannersProps) {
  return (
    <>
      {/* 自動保存恢復提示 */}
      {showAutoSaveNotice && (
        <div className="mt-2 flex items-center justify-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2 px-4">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          已恢復之前自動保存的表單內容
        </div>
      )}

      {/* 自動儲存指示器 */}
      {isAutoSaving && (
        <div className="mt-2 flex items-center justify-center text-sm text-blue-600">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
          正在自動儲存...
        </div>
      )}
      {isDirty && !isAutoSaving && !showAutoSaveNotice && (
        <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          表單已自動儲存
        </div>
      )}

      {/* 訪客提示橫幅 */}
      {!isLoggedIn && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
                訪客也可以提交詢價!
              </p>
              <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                已登入會員可享有更快速的回覆和訂單追蹤。
                <a href="/login" className="underline ml-1 font-medium">
                  點此登入
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 智慧預填提示（僅已登入時顯示） */}
      {isLoggedIn && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                已自動填入您的個人資料
              </p>
              <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                姓名、Email、電話和地址已從您的帳戶資訊自動填入，您可以隨時修改。
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
