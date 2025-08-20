import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjuuyyqvqsluvuwihivp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdXV5eXF2cXNsdXZ1d2loaXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NTA1MDcsImV4cCI6MjA1MDIyNjUwN30.-y0oI0FtKDq8qKPrSEr2FlKlLa20c7m3w1tYQ2KKOOI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Get all products without filter
const { data: allProducts, error: allError } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

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

console.log('\n=== Active products only ===');
console.log('Total:', activeProducts?.length || 0);
activeProducts?.forEach(p => {
  console.log(`- ${p.name}: is_active=${p.is_active}, show_in_catalog=${p.show_in_catalog}`);
});
