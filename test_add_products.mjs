import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxlrtcagsuoijjolgdzs.supabase.co';
const supabaseKey = 'sb_secret_dcIa080eUatHIVYYwQUFZw_wUovKzgp'; // 使用服務密鑰

const supabase = createClient(supabaseUrl, supabaseKey);

// 新增幾個測試產品
const testProducts = [
  {
    name: '測試產品1',
    description: '這是測試產品1的描述',
    price: 100,
    category: 'test',
    image_url: '/images/placeholder.jpg',
    stock: 10,
    is_active: true,
    show_in_catalog: true
  },
  {
    name: '測試產品2',
    description: '這是測試產品2的描述',
    price: 200,
    category: 'test',
    image_url: '/images/placeholder.jpg',
    stock: 5,
    is_active: false, // 已下架
    show_in_catalog: true
  },
  {
    name: '測試產品3',
    description: '這是測試產品3的描述',
    price: 300,
    category: 'test',
    image_url: '/images/placeholder.jpg',
    stock: 0,
    is_active: false, // 已下架
    show_in_catalog: false
  }
];

console.log('正在新增測試產品...');
for (const product of testProducts) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) {
    console.error(`新增產品 ${product.name} 失敗:`, error);
  } else {
    console.log(`成功新增產品: ${data.name} (is_active: ${data.is_active})`);
  }
}

// 檢查所有產品
console.log('\n檢查資料庫中的所有產品:');
const { data: allProducts, error: allError } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

if (allError) {
  console.error('查詢失敗:', allError);
} else {
  console.log(`總共 ${allProducts.length} 個產品:`);
  allProducts.forEach(p => {
    console.log(`- ${p.name}: is_active=${p.is_active}, show_in_catalog=${p.show_in_catalog}`);
  });
}
