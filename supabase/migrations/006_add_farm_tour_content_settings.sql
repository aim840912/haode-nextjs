-- 新增農場導覽頁面動態內容設定
-- 用於「農場體驗」頁面的設施、FAQ、參觀資訊、參觀須知等內容管理

-- 插入農場設施設定
INSERT INTO site_settings (key, value, type, description) VALUES
  ('farm_tour.facilities',
   '[
     {
       "name": "品茶亭",
       "description": "傳統竹造涼亭，提供農場自產茶品品嚐",
       "features": ["茶藝設備", "山景視野", "文化體驗"]
     },
     {
       "name": "採果區域",
       "description": "分區種植不同水果，依季節開放採摘體驗",
       "features": ["紅肉李區", "季節水果", "有機栽培"]
     },
     {
       "name": "停車場",
       "description": "可容納30台汽車的免費停車空間",
       "features": ["免費停車", "遊覽車位", "無障礙設施"]
     }
   ]',
   'json',
   '農場設施導覽內容'
  ),

  -- 插入常見問題設定
  ('farm_tour.faqs',
   '[
     {
       "question": "農場的開放時間是？",
       "answer": "週二至週日：09:00 - 17:00\n週一公休（國定假日正常開放）\n※ 體驗活動請提前電話預約",
       "icon": "clock"
     },
     {
       "question": "如何前往農場？",
       "answer": "自行開車：國道4號 → 台3線 → 東關路\n大眾運輸：台中客運 → 和平區 → 農場接駁\n團體包車：可協助安排遊覽車接駁",
       "icon": "car"
     },
     {
       "question": "適合帶小孩嗎？",
       "answer": "非常適合！我們的體驗活動專為親子設計，提供：\n• 安全的採果環境\n• 適合兒童的活動設計\n• 休息區和洗手設施\n• 專業導覽解說",
       "icon": "users"
     },
     {
       "question": "費用包含哪些內容？",
       "answer": "體驗費用包含：\n• 專業導覽解說\n• 採果體驗（可帶走一定數量）\n• 農場茶飲品嚐\n• 免費停車",
       "icon": "banknote"
     }
   ]',
   'json',
   '常見問題與解答'
  ),

  -- 插入參觀資訊設定
  ('farm_tour.visit_info',
   '{
     "address": "嘉義縣梅山鄉太和村一鄰八號",
     "opening_hours": {
       "weekdays": "週二至週日：09:00 - 17:00",
       "closed": "週一公休（國定假日正常開放）",
       "note": "* 體驗活動請電話詢問"
     },
     "transportation": [
       { "type": "自行開車", "route": "國道4號→台3線→東關路" },
       { "type": "大眾運輸", "route": "台中客運→和平區→農場接駁" },
       { "type": "團體包車", "route": "可協助安排遊覽車接駁" }
     ],
     "contact": {
       "phone": "05-2561843",
       "line": "@haudetea",
       "email": "tour@haudetea.com"
     }
   }',
   'json',
   '參觀資訊（地址、時間、交通、聯絡方式）'
  ),

  -- 插入參觀須知設定
  ('farm_tour.visit_notes',
   '{
     "important": [
       "體驗活動請來電詢問詳情",
       "團體參觀請來電洽詢",
       "如遇天候不佳，活動可能調整或取消"
     ],
     "recommended_items": [
       "舒適的運動鞋或登山鞋",
       "帽子和防曬用品",
       "水壺（農場有飲水機）",
       "相機記錄美好時光"
     ],
     "special_services": [
       "免費農場導覽解說",
       "團體活動客製化規劃",
       "農產品宅配服務",
       "企業員工旅遊包套"
     ]
   }',
   'json',
   '參觀須知（重要提醒、建議攜帶、特別服務）'
  )

ON CONFLICT (key) DO NOTHING;

-- 註解說明
COMMENT ON COLUMN site_settings.key IS '設定鍵（唯一），例如: farm_tour.facilities';
COMMENT ON COLUMN site_settings.type IS 'json 類型用於儲存結構化資料（陣列或物件）';
