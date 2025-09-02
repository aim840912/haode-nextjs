import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('請設定環境變數: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProductImagesTable() {
  try {
    console.log('🏗️  準備創建 product_images 表...\n');
    console.log('由於 Supabase 限制，請手動在 Supabase Dashboard 執行以下 SQL:\n');
    console.log('1. 登入 https://supabase.com/dashboard');
    console.log('2. 選擇你的專案');
    console.log('3. 前往 SQL Editor');
    console.log('4. 建立新查詢並貼上以下 SQL:\n');

    const sql = `-- 創建 product_images 表
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  alt TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  size VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (size IN ('thumbnail', 'medium', 'large')),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一約束：同一產品的圖片位置不能重複
  UNIQUE(product_id, position)
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_product_images_url ON product_images(url);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 套用觸發器到 product_images 表
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 為 products 表添加便利視圖
CREATE OR REPLACE VIEW products_with_images AS
SELECT 
    p.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', pi.id,
                'url', pi.url,
                'path', pi.path,
                'alt', pi.alt,
                'position', pi.position,
                'size', pi.size,
                'width', pi.width,
                'height', pi.height,
                'file_size', pi.file_size,
                'created_at', pi.created_at,
                'updated_at', pi.updated_at
            ) ORDER BY pi.position
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::json
    ) AS images_data
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id;

-- 測試資料插入 (可選)
-- INSERT INTO product_images (product_id, url, path, alt, position, size) 
-- VALUES ('你的產品UUID', 'https://example.com/image.jpg', '/path/to/image.jpg', '測試圖片', 0, 'medium');
`;

    console.log(sql);
    console.log('\n5. 執行查詢');
    console.log('6. 如果成功，應該看到 "Success. No rows returned." 的訊息\n');

    // 嘗試簡單的驗證查詢
    console.log('⏳ 等待表創建完成後，執行驗證...');
    console.log('💡 你可以按 Enter 鍵繼續驗證，或按 Ctrl+C 退出');

    // 在 Node.js 中監聽鍵盤輸入
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      if (key[0] === 3) { // Ctrl+C
        console.log('\n👋 退出腳本');
        process.exit();
      }
      
      if (key[0] === 13) { // Enter
        console.log('\n🔍 驗證 product_images 表...');
        
        try {
          const { data, error } = await supabase
            .from('product_images')
            .select('*')
            .limit(1);

          if (error) {
            if (error.message.includes('does not exist')) {
              console.log('❌ 表尚未創建，請先在 Supabase Dashboard 執行 SQL');
            } else {
              console.log('❌ 驗證失敗:', error.message);
            }
          } else {
            console.log('✅ product_images 表已成功創建並可使用');
            console.log('📊 表結構驗證通過\n');
            
            // 檢查視圖
            const { data: viewData, error: viewError } = await supabase
              .from('products_with_images')
              .select('*')
              .limit(1);

            if (viewError) {
              console.log('⚠️  視圖創建可能失敗:', viewError.message);
            } else {
              console.log('✅ products_with_images 視圖創建成功');
            }
          }
        } catch (err) {
          console.log('❌ 驗證過程出錯:', err);
        }
        
        process.exit();
      }
    });

  } catch (error) {
    console.error('❌ 腳本執行失敗:', error);
  }
}

createProductImagesTable();