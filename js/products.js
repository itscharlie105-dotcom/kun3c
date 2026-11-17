/* =====================================================================
   products.js ─ 商品資料檔
   ---------------------------------------------------------------------
   【如何新增一件商品】
   1. 把下面「可複製的空白範本」整段複製。
   2. 貼到最下面 window.PRODUCTS 陣列的最後一筆商品後面（記得前一筆結尾要有逗號）。
   3. 逐欄把內容改成你的商品資料，存檔。
   4. 重新整理瀏覽器，首頁件數、列表、篩選、搜尋都會自動更新，不用改別的檔案。

   【注意事項】
   - id 絕對不可以重複，建議用「分類縮寫-編號」，例如 lap-06、pc-06、tv-06。
   - 中文字要用單引號 '  包起來，數字不用引號。
   - 每一筆商品用大括號 { } 包起來，彼此之間用逗號分開。
   - 最後一筆商品後面不要加逗號。

   【可複製的空白範本】──────────────────────────────────
   {
     // 唯一代號，不可重複（只用英文、數字、減號）
     id: 'lap-99',
     // 商品名稱：客人在列表上看到的標題
     name: '商品名稱',
     // 分類：只能填 laptop（筆電）/ desktop（桌上型主機）/ tv（電視與顯示器）/ parts（零組件與周邊）
     category: 'laptop',
     // 品牌
     brand: '品牌',
     // 售價（新台幣整數，不要加逗號與 NT$）
     price: 0,
     // 原價：用來顯示折扣幅度與刪除線；不想顯示就填 null
     originalPrice: null,
     // 成色分級：只能填 'A+' / 'A' / 'B' / 'C'（說明見購物須知頁）
     condition: 'A',
     // 保固天數：填 0 表示無保固
     warrantyDays: 30,
     // 庫存數量：填 0 會自動顯示「已售出」並停用購買按鈕
     stock: 1,
     // 規格表：想加幾列就加幾列，label 是項目名稱、value 是內容
     specs: [
       { label: 'CPU', value: '' }
     ],
     // 賣點標籤：會變成一顆一顆的小標籤
     highlights: [],
     // 誠實說明瑕疵：寫清楚外觀或功能上的缺點，詳情頁會用琥珀色區塊強調
     notes: '',
     // 商品照片路徑：填 'images/檔名.jpg' 就用真實照片，填 null 則自動畫 SVG 示意圖
     image: null,
     // 示意圖樣式：laptop / desktop / tv / monitor / gpu / cpu / ram / ssd
     svgKind: 'laptop',
     // 上架日期（YYYY-MM-DD）：用於「最新上架」排序
     createdAt: '2026-01-01'
   }
   ─────────────────────────────────────────────────────
   ===================================================================== */

window.PRODUCTS = [

  /* ===== 真實商品（由實拍照片與規格建立） ===== */
  {
    id: 'lap-06',
    name: 'ASUS VivoBook 15 X507MA 文書筆電',
    category: 'laptop',
    brand: 'ASUS',
    price: 3500,
    originalPrice: null,
    condition: 'A',
    warrantyDays: 30,
    stock: 1,
    specs: [
      { label: 'CPU', value: 'Intel Celeron N4000 1.10GHz（2核心 2執行緒）' },
      { label: '記憶體', value: '8GB DDR4 2400MHz（尚有一個空插槽可加裝）' },
      { label: '硬碟', value: '240GB SSD（系統顯示約 224GB）' },
      { label: '螢幕', value: '15.6吋' },
      { label: '顯示晶片', value: 'Intel UHD Graphics 600' },
      { label: '作業系統', value: 'Windows 10 家用版' },
      { label: '電池健康度', value: '約 96%（31,968 / 33,156 mWh）' }
    ],
    highlights: ['電池健康度 96%', '附原廠充電器', '記憶體可再加裝一條', '文書、追劇、線上課程都夠用'],
    notes: '二手整理機（非一手自用），已完成基本功能測試。上蓋與掌托有正常二手使用痕跡，詳細外觀以實拍照片為準。',
    // 檢測紀錄：只填實拍照片與截圖可以證明的項目，其餘留白顯示「未檢測」
    inspection: {
      date: '2026-07-20',
      power: true,
      battery: '96%（31,968 / 33,156 mWh）',
      disk: '240GB SSD，系統顯示 224GB',
      memory: '8GB DDR4 2400MHz，已使用 1 / 2 插槽',
      appearance: '!上蓋與掌托有正常使用痕跡，以實拍照片為準'
    },
    images: [
      'images/lap-06-1.jpg',
      'images/lap-06-2.jpg',
      'images/lap-06-3.jpg',
      'images/lap-06-4.jpg',
      'images/lap-06-5.jpg'
    ],
    svgKind: 'laptop',
    createdAt: '2026-11-16'
  },

  /* ===== 筆記型電腦 ===== */
  {
    // 唯一代號，不可重複
    id: 'lap-01',
    // 商品名稱
    name: 'ThinkPad X390 商務筆電',
    // 分類：laptop / desktop / tv / parts
    category: 'laptop',
    // 品牌
    brand: 'Lenovo',
    // 售價（新台幣整數）
    price: 8900,
    // 原價，用來顯示折扣幅度；不想顯示填 null
    originalPrice: 26800,
    // 成色分級：A+ / A / B / C
    condition: 'A',
    // 保固天數，0 表示無保固
    warrantyDays: 30,
    // 庫存數量，0 會顯示「已售出」
    stock: 1,
    // 規格表，想加幾列就加幾列
    specs: [
      { label: 'CPU', value: 'Intel i5-8265U' },
      { label: '記憶體', value: '16GB DDR4' },
      { label: '硬碟', value: '512GB NVMe SSD' },
      { label: '螢幕', value: '13.3吋 FHD' },
      { label: '作業系統', value: 'Windows 11 Pro' }
    ],
    // 賣點標籤
    highlights: ['電池健康度 89%', '已換新鍵盤膜', '附原廠變壓器'],
    // 誠實說明瑕疵
    notes: 'C 面有兩道細微使用痕跡，不影響操作。',
    // 填圖片路徑則用真實照片，null 則用 SVG 示意圖
    image: null,
    // 對應 getProductSVG 的 8 種圖示
    svgKind: 'laptop',
    // 用於「最新上架」排序
    createdAt: '2026-11-01'
  },

  /* 以下商品欄位意義與上面第一筆完全相同，說明請看檔首的空白範本。 */
  {
    id: 'lap-02',
    name: 'MacBook Air M1 13吋',
    category: 'laptop',
    brand: 'Apple',
    price: 16800,
    originalPrice: 31900,
    condition: 'A+',
    warrantyDays: 30,
    stock: 2,
    specs: [
      { label: '處理器', value: 'Apple M1（8 核心）' },
      { label: '記憶體', value: '8GB 統一記憶體' },
      { label: '硬碟', value: '256GB SSD' },
      { label: '螢幕', value: '13.3吋 Retina' },
      { label: '電池循環', value: '142 次' }
    ],
    highlights: ['電池循環僅 142 次', '原廠盒裝完整', '已更新至最新系統'],
    notes: '機身四角無碰撞、螢幕無亮點；附原廠 30W 充電器。',
    image: null,
    svgKind: 'laptop',
    createdAt: '2026-11-08'
  },
  {
    id: 'lap-03',
    name: 'Dell Latitude 5420 商務筆電',
    category: 'laptop',
    brand: 'Dell',
    price: 9800,
    originalPrice: 38000,
    condition: 'B',
    warrantyDays: 14,
    stock: 1,
    specs: [
      { label: 'CPU', value: 'Intel i5-1145G7' },
      { label: '記憶體', value: '16GB DDR4' },
      { label: '硬碟', value: '512GB NVMe SSD' },
      { label: '螢幕', value: '14吋 FHD IPS' },
      { label: '連接埠', value: 'Thunderbolt 4 x2' }
    ],
    highlights: ['鍵盤背光正常', '指紋辨識可用', '已重灌乾淨系統'],
    notes: '上蓋有一處約 1 公分刮痕、掌托邊緣有掉漆，所有功能正常。',
    image: null,
    svgKind: 'laptop',
    createdAt: '2026-10-21'
  },
  {
    id: 'lap-04',
    name: 'ASUS Vivobook 15 文書筆電',
    category: 'laptop',
    brand: 'ASUS',
    price: 6500,
    originalPrice: 19900,
    condition: 'B',
    warrantyDays: 7,
    stock: 3,
    specs: [
      { label: 'CPU', value: 'Intel i3-1115G4' },
      { label: '記憶體', value: '8GB DDR4' },
      { label: '硬碟', value: '256GB SSD（已升級）' },
      { label: '螢幕', value: '15.6吋 FHD' },
      { label: '重量', value: '約 1.8 公斤' }
    ],
    highlights: ['適合文書與追劇', '鍵盤手感良好', '支援 HDMI 外接電視'],
    notes: '底殼有輕微刮痕，電池健康度約 78%，建議搭配電源使用。',
    image: null,
    svgKind: 'laptop',
    createdAt: '2026-10-12'
  },
  {
    id: 'lap-05',
    name: 'HP EliteBook 840 G6 金屬機身筆電',
    category: 'laptop',
    brand: 'HP',
    price: 7900,
    originalPrice: 34000,
    condition: 'C',
    warrantyDays: 14,
    stock: 0,
    specs: [
      { label: 'CPU', value: 'Intel i5-8365U' },
      { label: '記憶體', value: '16GB DDR4' },
      { label: '硬碟', value: '512GB NVMe SSD' },
      { label: '螢幕', value: '14吋 FHD' },
      { label: '作業系統', value: 'Windows 11 Pro' }
    ],
    highlights: ['全金屬機身', '支援 USB-C 快充', '已換新電池'],
    notes: '上蓋有明顯壓痕與掉漆（可提供實拍照片），螢幕與鍵盤功能完全正常。',
    image: null,
    svgKind: 'laptop',
    createdAt: '2026-09-28'
  },

  /* ===== 桌上型主機 ===== */
  {
    id: 'pc-01',
    name: 'Dell OptiPlex 3080 Micro 迷你主機',
    category: 'desktop',
    brand: 'Dell',
    price: 5800,
    originalPrice: 22000,
    condition: 'A',
    warrantyDays: 30,
    stock: 2,
    specs: [
      { label: 'CPU', value: 'Intel i5-10500T' },
      { label: '記憶體', value: '16GB DDR4' },
      { label: '硬碟', value: '512GB NVMe SSD' },
      { label: '體積', value: '約 1.2 公升' },
      { label: '作業系統', value: 'Windows 11 Pro' }
    ],
    highlights: ['體積小可藏在螢幕後', '支援雙螢幕輸出', '附原廠變壓器'],
    notes: '外殼僅有輕微使用痕跡，已清理內部灰塵並更換散熱膏。',
    image: null,
    svgKind: 'desktop',
    createdAt: '2026-11-05'
  },
  {
    id: 'pc-02',
    name: 'HP ProDesk 600 G5 SFF 主機',
    category: 'desktop',
    brand: 'HP',
    price: 4900,
    originalPrice: 19800,
    condition: 'B',
    warrantyDays: 14,
    stock: 2,
    specs: [
      { label: 'CPU', value: 'Intel i5-9500' },
      { label: '記憶體', value: '8GB DDR4' },
      { label: '硬碟', value: '256GB SSD + 1TB HDD' },
      { label: '擴充', value: 'PCIe x16 可加裝顯卡' },
      { label: '電源', value: '原廠 180W' }
    ],
    highlights: ['可自行升級顯卡', '雙硬碟配置', '內建 DisplayPort x2'],
    notes: '機殼側板有刮痕，前面板其中一個 USB 孔較鬆但可正常使用。',
    image: null,
    svgKind: 'desktop',
    createdAt: '2026-10-18'
  },
  {
    id: 'pc-03',
    name: '自組電競主機 i5-10400F + GTX 1660 SUPER',
    category: 'desktop',
    brand: '自組',
    price: 13800,
    originalPrice: null,
    condition: 'A',
    warrantyDays: 30,
    stock: 1,
    specs: [
      { label: 'CPU', value: 'Intel i5-10400F' },
      { label: '顯示卡', value: 'GTX 1660 SUPER 6GB' },
      { label: '記憶體', value: '16GB DDR4 3200' },
      { label: '硬碟', value: '1TB NVMe SSD' },
      { label: '電源', value: '550W 銅牌' }
    ],
    highlights: ['1080p 高特效遊戲順跑', '已做 8 小時燒機測試', '內部整線完成'],
    notes: '二手機殼側透玻璃有細微刮痕，所有風扇已更新。',
    image: null,
    svgKind: 'desktop',
    createdAt: '2026-11-09'
  },
  {
    id: 'pc-04',
    name: 'Lenovo ThinkCentre M920q 迷你主機',
    category: 'desktop',
    brand: 'Lenovo',
    price: 6800,
    originalPrice: 24000,
    condition: 'A+',
    warrantyDays: 30,
    stock: 1,
    specs: [
      { label: 'CPU', value: 'Intel i5-8500T' },
      { label: '記憶體', value: '16GB DDR4' },
      { label: '硬碟', value: '512GB NVMe SSD' },
      { label: '無線網路', value: '內建 Wi-Fi + 藍牙' },
      { label: '體積', value: '約 1 公升' }
    ],
    highlights: ['近全新外觀', '支援 VESA 螢幕背掛', '低噪音運轉'],
    notes: '外觀幾乎無痕，僅底部有原廠貼紙殘膠。',
    image: null,
    svgKind: 'desktop',
    createdAt: '2026-11-10'
  },
  {
    id: 'pc-05',
    name: 'Acer Aspire TC 文書主機',
    category: 'desktop',
    brand: 'Acer',
    price: 3900,
    originalPrice: 15900,
    condition: 'C',
    warrantyDays: 7,
    stock: 0,
    specs: [
      { label: 'CPU', value: 'Intel i3-9100' },
      { label: '記憶體', value: '8GB DDR4' },
      { label: '硬碟', value: '1TB HDD' },
      { label: '光碟機', value: 'DVD 燒錄機' },
      { label: '作業系統', value: 'Windows 11 Home' }
    ],
    highlights: ['適合純文書列印', '保留光碟機', '價格最優惠'],
    notes: '前面板有明顯刮痕與泛黃、機殼底部有一處凹陷，功能正常。',
    image: null,
    svgKind: 'desktop',
    createdAt: '2026-09-15'
  },

  /* ===== 電視與顯示器 ===== */
  {
    id: 'tv-01',
    name: 'LG 55UP7750 55吋 4K 智慧電視',
    category: 'tv',
    brand: 'LG',
    price: 9800,
    originalPrice: 26900,
    condition: 'A',
    warrantyDays: 30,
    stock: 1,
    specs: [
      { label: '尺寸', value: '55 吋' },
      { label: '解析度', value: '3840 x 2160（4K）' },
      { label: '面板', value: 'IPS 直下式' },
      { label: '系統', value: 'webOS 智慧聯網' },
      { label: '連接埠', value: 'HDMI x3 / USB x2' }
    ],
    highlights: ['螢幕無亮點無漏光', '附原廠遙控器與腳座', '支援手機無線投影'],
    notes: '背殼有輕微刮痕，面板與背光測試正常。',
    image: null,
    svgKind: 'tv',
    createdAt: '2026-11-02'
  },
  {
    id: 'tv-02',
    name: 'Samsung UA50AU7700 50吋 4K 電視',
    category: 'tv',
    brand: 'Samsung',
    price: 8200,
    originalPrice: 21900,
    condition: 'B',
    warrantyDays: 14,
    stock: 1,
    specs: [
      { label: '尺寸', value: '50 吋' },
      { label: '解析度', value: '4K UHD' },
      { label: '系統', value: 'Tizen 智慧聯網' },
      { label: '影像', value: '支援 HDR10+' },
      { label: '連接埠', value: 'HDMI x3' }
    ],
    highlights: ['畫面無壞點', '原廠遙控器', '已校正基本色溫'],
    notes: '邊框右下角有一道約 3 公分刮痕，背板輕微變形但不影響顯示。',
    image: null,
    svgKind: 'tv',
    createdAt: '2026-10-26'
  },
  {
    id: 'tv-03',
    name: 'Sony KM-43X80K 43吋 4K 電視',
    category: 'tv',
    brand: 'Sony',
    price: 8800,
    originalPrice: 22900,
    condition: 'A',
    warrantyDays: 30,
    stock: 0,
    specs: [
      { label: '尺寸', value: '43 吋' },
      { label: '解析度', value: '4K HDR' },
      { label: '系統', value: 'Google TV' },
      { label: '處理器', value: 'X1 影像處理器' },
      { label: '連接埠', value: 'HDMI x4' }
    ],
    highlights: ['內建各大影音 App', '畫質銳利適合客廳', '含原廠語音遙控器'],
    notes: '外觀良好，僅底座有輕微摩擦痕。',
    image: null,
    svgKind: 'tv',
    createdAt: '2026-10-05'
  },
  {
    id: 'mon-01',
    name: 'Dell U2419H 24吋 IPS 螢幕',
    category: 'tv',
    brand: 'Dell',
    price: 2800,
    originalPrice: 9900,
    condition: 'A',
    warrantyDays: 30,
    stock: 4,
    specs: [
      { label: '尺寸', value: '24 吋' },
      { label: '解析度', value: '1920 x 1080' },
      { label: '面板', value: 'IPS 三面窄邊框' },
      { label: '更新率', value: '60Hz' },
      { label: '介面', value: 'HDMI / DP / USB Hub' }
    ],
    highlights: ['無亮點無漏光', '可升降旋轉支架', '附 DP 訊號線'],
    notes: '背面有保養貼紙痕跡，面板狀況良好。',
    image: null,
    svgKind: 'monitor',
    createdAt: '2026-11-03'
  },
  {
    id: 'mon-02',
    name: 'AOC 27G2 27吋 144Hz 電競螢幕',
    category: 'tv',
    brand: 'AOC',
    price: 4200,
    originalPrice: 8990,
    condition: 'B',
    warrantyDays: 14,
    stock: 2,
    specs: [
      { label: '尺寸', value: '27 吋' },
      { label: '解析度', value: '1920 x 1080' },
      { label: '更新率', value: '144Hz IPS' },
      { label: '反應時間', value: '1ms MPRT' },
      { label: '介面', value: 'HDMI x2 / DP' }
    ],
    highlights: ['144Hz 電競面板', '支援 FreeSync', '附原廠腳架'],
    notes: '機身背面有明顯刮痕、底座有掉漆，面板顯示正常。',
    image: null,
    svgKind: 'monitor',
    createdAt: '2026-10-09'
  },

  /* ===== 零組件與周邊 ===== */
  {
    id: 'gpu-01',
    name: 'MSI RTX 3060 12GB 顯示卡',
    category: 'parts',
    brand: 'MSI',
    price: 6800,
    originalPrice: 12900,
    condition: 'A',
    warrantyDays: 14,
    stock: 2,
    specs: [
      { label: '核心', value: 'GeForce RTX 3060' },
      { label: '記憶體', value: '12GB GDDR6' },
      { label: '介面', value: 'PCIe 4.0 x16' },
      { label: '輸出', value: 'HDMI x1 / DP x3' },
      { label: '建議電源', value: '550W 以上' }
    ],
    highlights: ['非礦卡、附測試截圖', '已更換散熱膏並清理風扇', '1080p 遊戲主力卡'],
    notes: '擋板有輕微氧化，風扇運轉無異音。',
    image: null,
    svgKind: 'gpu',
    createdAt: '2026-11-06'
  },
  {
    id: 'gpu-02',
    name: 'ASUS RTX 2060 SUPER 8GB 顯示卡',
    category: 'parts',
    brand: 'ASUS',
    price: 4500,
    originalPrice: null,
    condition: 'B',
    warrantyDays: 7,
    stock: 1,
    specs: [
      { label: '核心', value: 'GeForce RTX 2060 SUPER' },
      { label: '記憶體', value: '8GB GDDR6' },
      { label: '介面', value: 'PCIe 3.0 x16' },
      { label: '輸出', value: 'HDMI x1 / DP x3' },
      { label: '建議電源', value: '500W 以上' }
    ],
    highlights: ['效能接近 RTX 3060', '已重上散熱膏', '附擋板螺絲'],
    notes: '外殼有明顯刮痕，其中一顆風扇運轉時有輕微風切聲。',
    image: null,
    svgKind: 'gpu',
    createdAt: '2026-10-14'
  },
  {
    id: 'cpu-01',
    name: 'Intel i5-12400F 處理器',
    category: 'parts',
    brand: 'Intel',
    price: 3200,
    originalPrice: 5990,
    condition: 'A+',
    warrantyDays: 14,
    stock: 3,
    specs: [
      { label: '核心', value: '6 核 12 執行緒' },
      { label: '時脈', value: '2.5GHz / 最高 4.4GHz' },
      { label: '腳位', value: 'LGA 1700' },
      { label: '快取', value: '18MB' },
      { label: '內顯', value: '無內建顯示（需搭配顯卡）' }
    ],
    highlights: ['針腳完整無彎折', '已通過燒機測試', '遊戲性價比首選'],
    notes: '僅處理器本體，不含原廠散熱器與外盒。',
    image: null,
    svgKind: 'cpu',
    createdAt: '2026-11-04'
  },
  {
    id: 'ram-01',
    name: 'Kingston DDR4-3200 16GB 記憶體（8GB x2）',
    category: 'parts',
    brand: 'Kingston',
    price: 1180,
    originalPrice: 2400,
    condition: 'A',
    warrantyDays: 30,
    stock: 5,
    specs: [
      { label: '容量', value: '16GB（8GB x 2）' },
      { label: '規格', value: 'DDR4-3200 桌機用' },
      { label: '時序', value: 'CL16' },
      { label: '電壓', value: '1.35V' },
      { label: '相容', value: 'Intel / AMD 平台' }
    ],
    highlights: ['雙通道成對販售', '金手指無氧化', 'MemTest 通過無錯誤'],
    notes: '散熱片有輕微使用痕跡，無彎針無氧化。',
    image: null,
    svgKind: 'ram',
    createdAt: '2026-10-30'
  },
  {
    id: 'ssd-01',
    name: 'Crucial MX500 1TB 2.5吋 SSD',
    category: 'parts',
    brand: 'Crucial',
    price: 1680,
    originalPrice: 2890,
    condition: 'A',
    warrantyDays: 30,
    stock: 4,
    specs: [
      { label: '容量', value: '1TB' },
      { label: '規格', value: '2.5吋 SATA III' },
      { label: '讀取', value: '最高 560MB/s' },
      { label: '寫入', value: '最高 510MB/s' },
      { label: '健康度', value: '97%' }
    ],
    highlights: ['通電時間低、健康度 97%', '適合舊筆電升級', '附安裝說明'],
    notes: '外殼有輕微螺絲痕，已完整清除原始資料。',
    image: null,
    svgKind: 'ssd',
    createdAt: '2026-10-24'
  }
];
