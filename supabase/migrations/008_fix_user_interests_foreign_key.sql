-- 清理不存在的產品記錄
DELETE FROM user_interests 
WHERE product_id NOT IN (SELECT id FROM products);

-- 添加外鍵約束，當產品被刪除時自動刪除相關興趣記錄
ALTER TABLE user_interests 
ADD CONSTRAINT fk_user_interests_product 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE CASCADE;

-- 確保 product_id 使用正確的 UUID 格式
ALTER TABLE user_interests 
ALTER COLUMN product_id TYPE UUID USING product_id::UUID;