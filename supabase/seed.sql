-- Insert sample locations data
INSERT INTO locations (name, title, address, landmark, phone, line_id, hours, closed_days, parking, public_transport, features, specialties, coordinates, image, is_main) VALUES
('總店', '豪德茶業總店', '嘉義縣梅山鄉太和村一鄰八號', '梅山太和村農業區，群山環繞', '05-2561843', '@haudetea', '08:00-18:00', '週一公休', '農場免費停車場（20個車位）', '嘉義客運至太和村站，步行10分鐘', 
 '["農場直營，現採現賣", "產地導覽體驗服務", "農產品現場挑選，品質保證", "禮盒包裝服務，送禮自用兩相宜", "免費停車場，環境清幽", "農場導覽預約服務", "企業團購訂製服務", "季節水果現場品嚐"]'::jsonb,
 '["紅肉李", "高山茶葉", "季節水果", "有機蔬菜", "農產加工品", "蜂蜜"]'::jsonb,
 '{"lat": 23.5519, "lng": 120.5564}'::jsonb, '🏔️', true),

('嘉義店', '豪德茶業嘉義市區店', '嘉義市東區中山路218號', '嘉義火車站前商圈，文化路夜市旁', '05-2234567', '@haudetea-chiayi', '10:00-21:00', '無公休日', '路邊付費停車格', '嘉義火車站步行5分鐘',
 '["市區便利據點", "完整產品展示", "快速取貨服務", "夜市商圈優勢", "觀光客友善", "農場體驗預約", "宅配服務中心"]'::jsonb,
 '["觀光伴手禮", "精品茶葉", "季節禮盒", "農產零食", "咖啡豆"]'::jsonb,
 '{"lat": 23.4801, "lng": 120.4491}'::jsonb, '🏪', false);

-- Insert sample products data
INSERT INTO products (name, description, price, category, image_url, stock, is_active) VALUES
('有機紅肉李', '來自嘉義梅山高海拔地區的有機紅肉李，果實飽滿甜美，富含維生素C和膳食纖維。', 350.00, 'fruit', '/images/products/red-plum.jpg', 100, true),
('高山烏龍茶', '海拔1000公尺以上的高山烏龍茶，茶香清雅，回甘持久。', 800.00, 'tea', '/images/products/oolong-tea.jpg', 50, true),
('季節蔬菜箱', '當季新鮮有機蔬菜組合，每週配送不同品種，營養豐富。', 280.00, 'vegetable', '/images/products/vegetable-box.jpg', 30, true),
('農場蜂蜜', '天然無添加龍眼蜂蜜，由農場自養蜂群採集製作。', 450.00, 'processed', '/images/products/honey.jpg', 80, true);

-- Insert sample news data
INSERT INTO news (title, summary, content, category, tags, is_published, publish_date) VALUES
('春季紅肉李採收季開始', '2024年春季紅肉李進入採收期，歡迎預約農場體驗活動', '隨著春暖花開，豪德農場的紅肉李進入最佳採收期。今年的紅肉李品質特別好，果實飽滿，甜度更高。我們邀請大家來農場體驗親自採摘的樂趣，感受農場的自然美景。', 'farm-update', '["春季", "紅肉李", "採收", "農場體驗"]'::jsonb, true, '2024-03-15'),
('有機認證通過', '豪德農場正式通過有機農產品認證，為消費者提供更安心的農產品', '經過嚴格的檢驗程序，豪德農場正式取得有機農產品認證。這意味著我們的產品完全無農藥殘留，採用天然的種植方式，為消費者提供最健康、最安心的農產品。', 'certification', '["有機認證", "無農藥", "健康"]'::jsonb, true, '2024-02-20');

-- Insert sample schedule data
INSERT INTO schedule (title, location, date, time, status, products, description, contact, special_offer, weather_note) VALUES
('嘉義文化路夜市', '嘉義市東區文化路', '2024-03-20', '18:00-23:00', 'upcoming', '["紅肉李", "季節蔬菜", "蜂蜜"]'::jsonb, '嘉義文化路夜市固定攤位，每週三營業', '05-2561843', '滿300元送小包裝蜂蜜', '如遇雨天正常營業'),
('梅山農夫市集', '嘉義縣梅山鄉中山路', '2024-03-25', '08:00-14:00', 'upcoming', '["有機蔬菜", "高山茶葉", "農產加工品"]'::jsonb, '梅山鄉農夫市集，每月第四個週日', '05-2561843', '現場試吃，滿500元9折', '戶外市集，注意防曬');

-- Insert sample farm tour data
INSERT INTO farm_tour (title, season, months, price, duration, activities, includes, highlight, note, image, available) VALUES
('春季賞花採果體驗', '春季', '3-5月', 350.00, '半日遊（3-4小時）', '["果園導覽", "賞花拍照", "親手採摘紅肉李", "農產品DIY製作", "品嚐農場茶點"]'::jsonb, '["專業導覽", "採摘工具", "DIY材料", "午茶點心", "農產品試吃"]'::jsonb, '春暖花開時節，果園花朵盛開，是最美的拍照季節，還能親自體驗採摘樂趣', '需提前3天預約，建議穿著輕便服裝和運動鞋', '🌸', true),
('夏日避暑茶園行', '夏季', '6-8月', 280.00, '半日遊（3-4小時）', '["高山茶園參觀", "製茶過程體驗", "品茶教學", "茶園健行"]'::jsonb, '["專業茶師指導", "品茶用具", "茶葉知識手冊", "茶葉伴手禮"]'::jsonb, '夏日到高山茶園避暑，學習品茶知識，體驗製茶樂趣', '山區早晚溫差大，請攜帶薄外套', '🍃', true);

-- Insert sample culture data
INSERT INTO culture (title, description, content, category, year, is_featured) VALUES
('傳統農法的智慧傳承', '介紹豪德農場如何保持傳統農法，並結合現代技術', '豪德農場自創立以來，始終堅持傳統的農業種植方法。我們相信，祖先留下的農業智慧是珍貴的財富。在不使用化學農藥的前提下，我們採用輪作、有機肥料等傳統方法，同時結合現代的滴灌技術和土壤檢測，確保農產品的品質與安全。', 'farming', 2024, true),
('四季農作的循環之美', '描述農場一年四季的農作循環與自然生態', '在豪德農場，我們遵循自然的節律，春耕夏耘，秋收冬藏。每個季節都有不同的農作重點，春天播種蔬菜，夏天管理果樹，秋天收成採摘，冬天休養土地。這樣的循環不僅保護了土地的生機，也讓我們的農產品更加豐富多樣。', 'seasonal', 2024, true);

-- Insert sample reviews data
INSERT INTO reviews (customer_name, rating, comment, category, is_approved) VALUES
('王小明', 5, '農場的紅肉李真的很甜很好吃！而且老闆人很親切，會詳細介紹種植過程。', 'product', true),
('林美華', 4, '帶小朋友來體驗農場生活，小朋友玩得很開心，也學到很多農業知識。', 'farm-tour', true),
('張大哥', 5, '有機蔬菜新鮮又健康，每週都會訂購，品質很穩定。', 'product', true),
('陳太太', 5, '農場導覽很棒，可以看到真正的有機種植，環境也很優美。', 'farm-tour', true);