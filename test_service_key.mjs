import { createClient } from '@supabase/supabase-js';

// 使用服務密鑰查詢
const supabaseUrl = 'https://bxlrtcagsuoijjolgdzs.supabase.co';
const supabaseServiceKey = 'sb_secret_dcIa080eUatHIVYYwQUFZw_wUovKzgp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test 1: Get all products with service key
const { data: allProducts, error: allError } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

if (allError) {
  console.log('Error getting all products:', allError);
}

console.log('=== All products (service key) ===');
console.log('Total:', allProducts?.length || 0);
allProducts?.forEach(p => {
  console.log(`- ${p.name}: is_active=${p.is_active}, show_in_catalog=${p.show_in_catalog}`);
});
