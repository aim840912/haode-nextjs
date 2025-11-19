/**
 * Contact Info Fields Component
 *
 * 聯絡資訊欄位區塊
 * 包含姓名、Email、電話輸入欄位
 */

interface ContactInfoFieldsProps {
  customerName: string
  customerEmail: string
  customerPhone: string
  validation: {
    customer_name?: string
    customer_email?: string
    customer_phone?: string
  }
  onFieldChange: (
    field: 'customer_name' | 'customer_email' | 'customer_phone',
    value: string,
    validateNow?: boolean
  ) => void
  onFieldBlur: (field: 'customer_name' | 'customer_email' | 'customer_phone') => void
}

export function ContactInfoFields({
  customerName,
  customerEmail,
  customerPhone,
  validation,
  onFieldChange,
  onFieldBlur,
}: ContactInfoFieldsProps) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
        聯絡資訊
        <span className="text-red-500 ml-1">*</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">必填欄位</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 姓名 */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">姓名 *</label>
          <input
            type="text"
            value={customerName}
            onChange={e => onFieldChange('customer_name', e.target.value)}
            onBlur={() => onFieldBlur('customer_name')}
            className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
              validation.customer_name
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-slate-600'
            }`}
            placeholder="請輸入您的姓名"
            autoComplete="name"
            inputMode="text"
            required
          />
          {validation.customer_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validation.customer_name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">Email *</label>
          <input
            type="email"
            value={customerEmail}
            onChange={e => onFieldChange('customer_email', e.target.value)}
            onBlur={() => onFieldBlur('customer_email')}
            className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
              validation.customer_email
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-slate-600'
            }`}
            placeholder="example@email.com"
            autoComplete="email"
            inputMode="email"
            required
          />
          {validation.customer_email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validation.customer_email}
            </p>
          )}
        </div>

        {/* 電話 */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 dark:text-gray-200 mb-1 font-medium">
            聯絡電話 *
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={e => onFieldChange('customer_phone', e.target.value)}
            onBlur={() => onFieldBlur('customer_phone')}
            className={`w-full border rounded-lg px-4 py-3 sm:px-3 sm:py-2 text-gray-900 dark:text-gray-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
              validation.customer_phone
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-slate-600'
            }`}
            placeholder="0912-345-678"
            autoComplete="tel"
            inputMode="tel"
            required
          />
          {validation.customer_phone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {validation.customer_phone}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
