import { createClient } from '@supabase/supabase-js';

// 使用 .env.local 中的實際 Supabase 實例
const supabaseUrl = 'https://bxlrtcagsuoijjolgdzs.supabase.co';
const supabaseKey = 'sb_publishable_MiP7LTM7Ok_Dd-CYIh6_Ag_eaZrbCLJ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Get all products without filter
const { data: allProducts, error: allError } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

if (allError) {
  console.log('Error getting all products:', allError);
}

console.log('=== All products (no filter) ===');
console.log('Total:', allProducts?.length || 0);
allProducts?.forEach(p => {
  console.log(`- ${p.name}: is_active=${p.is_active}, show_in_catalog=${p.show_in_catalog}`);
});

// Test 2: Get only active products
const { data: activeProducts, error: activeError } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });

if (activeError) {
  console.log('Error getting active products:', activeError);
}

console.log('\n=== Active products only ===');
console.log('Total:', activeProducts?.length || 0);
activeProducts?.forEach(p => {
  console.log(`- ${p.name}: is_active=${p.is_active}, show_in_catalog=${p.show_in_catalog}`);
});
