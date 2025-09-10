import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyFix() {
  try {
    console.log('🔍 驗證修復結果...\n')

    // 1. 檢查特定詢價單
    const { data: specificInquiry, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', '0ed453f8-0961-4b68-9033-fc5cfbde3be7')
      .single()

    if (error) {
      console.error('❌ 查詢失敗:', error)
    } else if (specificInquiry) {
      console.log('🎯 問題詢價單狀態:')
      console.log('  ID:', specificInquiry.id.slice(0, 8) + '...')
      console.log('  類型:', specificInquiry.inquiry_type || 'NULL')
      console.log('  客戶:', specificInquiry.customer_name)
      console.log('  Email:', specificInquiry.customer_email)
      console.log('  建立時間:', new Date(specificInquiry.created_at).toLocaleString('zh-TW'))

      // 檢查是否有產品項目
      const { data: items } = await supabase
        .from('inquiry_items')
        .select('product_name, quantity')
        .eq('inquiry_id', specificInquiry.id)

      console.log('  產品項目:', items?.length || 0, '個')
      if (items && items.length > 0) {
        items.forEach(item => {
          console.log('    -', item.product_name, 'x', item.quantity)
        })
      }
    }

    // 2. 統計所有詢價單類型
    const { data: allInquiries } = await supabase.from('inquiries').select('inquiry_type')

    const stats = {
      total: allInquiries?.length || 0,
      product: allInquiries?.filter(i => i.inquiry_type === 'product').length || 0,
      farm_tour: allInquiries?.filter(i => i.inquiry_type === 'farm_tour').length || 0,
      null_type:
        allInquiries?.filter(i => i.inquiry_type === null || i.inquiry_type === undefined).length ||
        0,
    }

    console.log('\n📊 整體統計:')
    console.log('  總數:', stats.total)
    console.log('  產品詢價:', stats.product)
    console.log('  農場參觀:', stats.farm_tour)
    console.log('  NULL 類型:', stats.null_type)

    if (specificInquiry?.inquiry_type === 'product') {
      console.log('\n✅ 修復成功！詢價單已正確標記為產品詢價')
    } else {
      console.log('\n⚠️ 詢價單類型為:', specificInquiry?.inquiry_type || 'NULL')
    }
  } catch (err) {
    console.error('❌ 驗證錯誤:', err)
  }
}

verifyFix()
