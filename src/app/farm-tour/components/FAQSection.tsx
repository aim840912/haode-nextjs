/**
 * FAQSection 元件
 *
 * 顯示常見問題與解答
 */

import { Clock, Car, Users2, Banknote, type LucideIcon } from 'lucide-react'
import type { FAQItem } from '@/types/siteSettings'

interface FAQSectionProps {
  faqs: FAQItem[]
}

// 圖示映射
const iconMap: Record<string, LucideIcon> = {
  clock: Clock,
  car: Car,
  users: Users2,
  banknote: Banknote,
}

export function FAQSection({ faqs }: FAQSectionProps) {
  return (
    <div className="bg-gray-50 dark:bg-slate-900 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-12">
          常見問題
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const Icon = iconMap[faq.icon] || Clock
            return (
              <details
                key={index}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden group"
              >
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors list-none flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    {faq.question}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {faq.answer}
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </div>
  )
}
