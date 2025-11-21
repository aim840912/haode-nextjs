const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestOrder() {
  const userId = '7cd12f3b-0fbf-48d9-bf78-e2513e6d397f'
  const now = new Date()
  const orderNumber =
    'TEST-' +
    now
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14)

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'pending',
      subtotal: 500,
      shipping_fee: 60,
      tax: 0,
      total_amount: 560,
      shipping_address: {
        name: '測試用戶',
        phone: '0912345678',
        street: '測試路123號',
        city: '台北市',
        postalCode: '100',
      },
      notes: '付款測試訂單',
    })
    .select()
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Order created:')
  console.log('  ID:', data.id)
  console.log('  Order Number:', data.order_number)
  console.log('  Total:', data.total_amount)
}

createTestOrder()
