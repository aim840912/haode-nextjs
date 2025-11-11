import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('請設定環境變數: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProductImagesTable() {
  try {
    console.log('🏗️  開始創建 product_images 表...\n')

    // 創建 product_images 表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id UUID NOT NULL,
        url TEXT NOT NULL,
        path TEXT NOT NULL,
        alt TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        size VARCHAR(20) NOT NULL DEFAULT 'medium',
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- 外鍵約束
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        
        -- 唯一約束：同一產品的圖片位置不能重複
        UNIQUE(product_id, position)
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL,
    })

    if (createError) {
      console.error('❌ 創建表失敗:', createError.message)
      return false
    }

    console.log('✅ product_images 表創建成功')

    // 創建索引
    const createIndexesSQL = `
      -- 產品 ID 索引 (用於查詢某產品的所有圖片)
      CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
      
      -- 位置索引 (用於排序)
      CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(product_id, position);
      
      -- URL 索引 (用於查找圖片)
      CREATE INDEX IF NOT EXISTS idx_product_images_url ON product_images(url);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL,
    })

    if (indexError) {
      console.warn('⚠️  創建索引時有警告:', indexError.message)
    } else {
      console.log('✅ 索引創建成功')
    }

    // 創建更新 updated_at 的觸發器
    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
      CREATE TRIGGER update_product_images_updated_at
          BEFORE UPDATE ON product_images
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: createTriggerSQL,
    })

    if (triggerError) {
      console.warn('⚠️  創建觸發器時有警告:', triggerError.message)
    } else {
      console.log('✅ 更新時間觸發器創建成功')
    }

    // 驗證表創建
    console.log('\n🔍 驗證表創建...')
    const { data: testData, error: testError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ 表創建驗證失敗:', testError.message)
      return false
    }

    console.log('✅ product_images 表創建完成並可正常使用\n')

    // 顯示表結構說明
    console.log('📋 表結構說明:')
    console.log('- id: 圖片唯一 ID (UUID)')
    console.log('- product_id: 關聯的產品 ID')
    console.log('- url: 圖片公開 URL')
    console.log('- path: 存儲路徑')
    console.log('- alt: 替代文字')
    console.log('- position: 排序位置 (0 = 主圖)')
    console.log('- size: 圖片尺寸 (thumbnail/medium/large)')
    console.log('- width/height: 圖片尺寸 (像素)')
    console.log('- file_size: 檔案大小 (bytes)')
    console.log('- created_at/updated_at: 創建/更新時間')

    return true
  } catch (error) {
    console.error('❌ 執行失敗:', error)
    return false
  }
}

// 檢查是否有 exec_sql 函數
async function checkExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  return !error
}

async function main() {
  const hasExecSql = await checkExecSqlFunction()

  if (!hasExecSql) {
    console.log('❌ Supabase 沒有 exec_sql 函數，需要手動執行 SQL')
    console.log('\n請在 Supabase Dashboard > SQL Editor 中執行以下 SQL:\n')

    console.log(`-- 創建 product_images 表
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  alt TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  size VARCHAR(20) NOT NULL DEFAULT 'medium',
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, position)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_product_images_url ON product_images(url);

-- 創建更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`)

    return
  }

  await createProductImagesTable()
}

main()
