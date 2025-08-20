import { createClient } from '@supabase/supabase-js';

// 使用服務密鑰查詢
const supabaseUrl = 'https://bxlrtcagsuoijjolgdzs.supabase.co';
const supabaseServiceKey = 'sb_secret_dcIa080eUatHIVYYwQUFZw_wUovKzgp';
const supabaseAnonKey = 'sb_publishable_MiP7LTM7Ok_Dd-CYIh6_Ag_eaZrbCLJ';

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

const productId = '51d7d58c-c0cc-4193-8d5c-edd98ac9ddb1';

// 用管理員客戶端查詢
const { data: adminData, error: adminError } = await adminClient
  .from('products')
  .select('*')
  .eq('id', productId)
  .single();

if (adminError) {
  console.log('管理員客戶端錯誤:', adminError);
} else {
  console.log('管理員客戶端找到產品:', adminData.name, '(is_active:', adminData.is_active, ')');
}

// 用匿名客戶端查詢
const { data: anonData, error: anonError } = await anonClient
  .from('products')
  .select('*')
  .eq('id', productId)
  .single();

if (anonError) {
  console.log('匿名客戶端錯誤:', anonError.message);
} else {
  console.log('匿名客戶端找到產品:', anonData.name, '(is_active:', anonData.is_active, ')');
}
