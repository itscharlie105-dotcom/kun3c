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
  }
];
