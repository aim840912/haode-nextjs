import { BarChart3, Database, Link2 as LinkIcon } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 歡迎區塊 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">歡迎回來！</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          豪德農場管理中心 - 使用左側選單快速存取各項功能
        </p>
      </div>

      {/* 系統資訊 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">系統資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-300">網站分析：</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Google Analytics 4 已啟用
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">追蹤狀態：</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">正常運作</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">資料庫：</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Supabase 連線正常
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">環境：</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {process.env.NODE_ENV === 'production' ? '正式環境' : '開發環境'}
            </span>
          </div>
        </div>
      </div>

      {/* 快速連結 */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <h3 className="flex items-center space-x-2 text-lg font-medium text-blue-900 dark:text-blue-300 mb-3">
          <LinkIcon className="h-5 w-5" />
          <span>外部連結</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Google Analytics 控制台</span>
            <span className="text-xs">↗</span>
          </a>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <Database className="h-4 w-4" />
            <span>Supabase 資料庫</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
