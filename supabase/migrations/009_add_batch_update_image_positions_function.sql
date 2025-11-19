-- 批次更新圖片排序位置的 RPC Function
-- 用於優化 ProductImageService 的 N+1 查詢問題

CREATE OR REPLACE FUNCTION batch_update_image_positions(
  p_product_id uuid,
  p_updates jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_image_id text;
  v_position int;
BEGIN
  -- 驗證產品 ID
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION '產品 ID 不能為空';
  END IF;

  -- 驗證更新資料
  IF p_updates IS NULL OR jsonb_typeof(p_updates) != 'object' THEN
    RAISE EXCEPTION '更新資料格式錯誤';
  END IF;

  -- 批次更新所有圖片位置
  FOR v_image_id, v_position IN
    SELECT key, value::int
    FROM jsonb_each_text(p_updates)
  LOOP
    UPDATE images
    SET display_position = v_position,
        updated_at = now()
    WHERE id = v_image_id::uuid
      AND module = 'products'
      AND entity_id = p_product_id;

    -- 驗證更新是否成功
    IF NOT FOUND THEN
      RAISE EXCEPTION '圖片不存在或不屬於指定產品: %', v_image_id;
    END IF;
  END LOOP;
END;
$$;

-- 添加註解
COMMENT ON FUNCTION batch_update_image_positions(uuid, jsonb) IS '批次更新產品圖片的排序位置，用於優化單次更新的 N+1 查詢問題';
