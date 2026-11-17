/* =====================================================================
   app.js ─ 全站共用邏輯（頁首頁尾、購物車、篩選、渲染）
   不使用任何外部函式庫，可在 file:// 下直接執行。
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var PRODUCTS = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  var icon = window.getIcon || function () { return ''; };
  var productSVG = window.getProductSVG || function () { return ''; };

  var CART_KEY = 'kun3c_cart';     // 購物車儲存鍵值
  var ORDER_KEY = 'kun3c_orders';  // 歷史訂單儲存鍵值

  // 四大分類（順序＝頁面顯示順序）
  var CATEGORIES = [
    { key: 'laptop', name: '筆記型電腦', kind: 'laptop', desc: '商務、文書、輕薄機' },
    { key: 'desktop', name: '桌上型主機', kind: 'desktop', desc: '迷你主機、文書機、電競機' },
    { key: 'tv', name: '電視與顯示器', kind: 'tv', desc: '4K 電視、IPS／電競螢幕' },
    { key: 'parts', name: '零組件與周邊', kind: 'gpu', desc: '顯卡、CPU、記憶體、SSD' }
  ];

  // 成色分級（白話解釋同時用於商品詳情頁與購物須知頁）
  var CONDITIONS = [
    { key: 'A+', name: '近全新', cls: 'cond-ap', desc: '幾乎沒有使用痕跡，外觀接近新品。' },
    { key: 'A', name: '良好', cls: 'cond-a', desc: '僅有輕微使用痕跡，正常使用距離不易察覺。' },
    { key: 'B', name: '使用痕跡明顯', cls: 'cond-b', desc: '功能完全正常，外觀有刮痕或掉漆。' },
    { key: 'C', name: '外觀瑕疵品', cls: 'cond-c', desc: '功能正常，外觀有明顯損傷，價格最優惠。' }
  ];

  /* ---------------- 小工具 ---------------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  // 轉義字串，避免商品資料中的特殊符號破壞版面
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 價格格式化：8900 → NT$ 8,900
  function money(n) { return 'NT$ ' + Number(n || 0).toLocaleString('zh-TW'); }

  // 個位數補零：7 → 07
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // 日期時間格式化：2026/11/12 22:28
  function formatDateTime(d) {
    return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) { return PRODUCTS[i]; }
    }
    return null;
  }

  function conditionMeta(key) {
    for (var i = 0; i < CONDITIONS.length; i++) {
      if (CONDITIONS[i].key === key) { return CONDITIONS[i]; }
    }
    return CONDITIONS[1];
  }

  function categoryMeta(key) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].key === key) { return CATEGORIES[i]; }
    }
    return null;
  }

  // 折扣百分比（沒有原價或原價低於售價時回傳 0）
  function discountPct(p) {
    if (!p.originalPrice || p.originalPrice <= p.price) { return 0; }
    return Math.round((1 - p.price / p.originalPrice) * 100);
  }

  /* ---------------- localStorage 安全存取 ---------------- */
  var memoryStore = {};
  function storeGet(key) {
    try {
      var v = window.localStorage.getItem(key);
      if (v !== null) { return v; }
    } catch (e) { /* 瀏覽器停用儲存時改用記憶體 */ }
    return memoryStore[key] === undefined ? null : memoryStore[key];
  }
  function storeSet(key, value) {
    memoryStore[key] = value;
    try { window.localStorage.setItem(key, value); } catch (e) { /* 忽略寫入失敗 */ }
  }

  /* ---------------- 每日抽獎（lucky.js 沒載入時全部靜音） ---------------- */

  // 活動是不是開著；lucky.js 沒載到或設定關閉時，全站入口都不會出現
  function luckyOn() {
    return !!(window.Lucky && window.Lucky.enabled());
  }

  /* ---------------- 聯絡管道（Facebook／LINE…） ---------------- */

  // 把 LINE ID 前後的全形括號與空白去掉
  function lineId() {
    return String(CFG.lineId || '').replace(/[【】\s]/g, '');
  }
  // 目前使用的管道名稱：有填 contactUrl 就用 contactChannel，否則預設是 LINE
  function channelName() {
    if (CFG.contactUrl) { return CFG.contactChannel || '訊息'; }
    return CFG.contactChannel || 'LINE';
  }
  // 把文字裡的 {管道} 換成實際的管道名稱，例如「用 {管道} 問問」→「用 Facebook 問問」
  function channelLabel(text) {
    return String(text == null ? '' : text).replace(/\{管道\}/g, channelName());
  }
  // 依管道挑圖示：Facebook／Messenger 用 f 圖示，其餘用對話框圖示
  function channelIcon() {
    return /face|messenger/i.test(channelName()) ? icon('facebook') : icon('line');
  }
  // 聯絡管道是否已設定完成（仍是待填狀態就回傳 false）
  function contactReady() {
    if (CFG.contactUrl) { return true; }
    var id = lineId();
    return !!id && id.indexOf('待填') < 0 && id !== 'LINE_ID';
  }
  // 聯絡按鈕要連去哪裡：未設定時導向聯絡頁的表單區，避免壞連結
  function contactHref() {
    if (CFG.contactUrl) { return CFG.contactUrl; }
    if (!contactReady()) { return 'about.html#contact-form'; }
    return 'https://line.me/ti/p/~' + encodeURIComponent(lineId());
  }

  /* ---------------- 購物車 ---------------- */

  function cartRead() {
    var raw = storeGet(CART_KEY);
    var list = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }
    if (!Array.isArray(list)) { list = []; }
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i] || {};
      var p = findProduct(item.id);
      if (!p || p.stock <= 0) { continue; }           // 商品被刪除或已售出就自動移除
      var qty = parseInt(item.qty, 10) || 1;
      qty = Math.max(1, Math.min(qty, p.stock));       // 數量不可超過庫存
      out.push({ id: p.id, qty: qty });
    }
    return out;
  }

  function cartWrite(list) {
    storeSet(CART_KEY, JSON.stringify(list));
    updateBadge();
  }

  function cartCount() {
    var list = cartRead(), n = 0;
    for (var i = 0; i < list.length; i++) { n += list[i].qty; }
    return n;
  }

  function cartAdd(id, qty) {
    var p = findProduct(id);
    if (!p || p.stock <= 0) { return false; }
    var list = cartRead(), found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].qty = Math.min(p.stock, list[i].qty + (qty || 1));
        found = true;
      }
    }
    if (!found) { list.push({ id: id, qty: Math.min(p.stock, qty || 1) }); }
    cartWrite(list);
    return true;
  }

  function cartSetQty(id, qty) {
    var p = findProduct(id);
    if (!p) { return; }
    var list = cartRead();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list[i].qty = Math.max(1, Math.min(p.stock, qty)); }
    }
    cartWrite(list);
  }

  function cartRemove(id) {
    var list = cartRead(), out = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== id) { out.push(list[i]); }
    }
    cartWrite(out);
  }

  function cartClear() { cartWrite([]); }

  function updateBadge() {
    var n = cartCount();
    $$('[data-cart-badge]').forEach(function (el) {
      el.textContent = String(n);
      if (n > 0) { el.removeAttribute('hidden'); } else { el.setAttribute('hidden', ''); }
    });
  }

  /* ---------------- 共用畫面片段 ---------------- */

  // 取得逐台檢測報告（inspect.js 提供）
  function inspectionOf(p) {
    return typeof window.getInspection === 'function'
      ? window.getInspection(p)
      : { has: false };
  }

  // 檢測報告區塊：沒有填檢測資料的商品就不顯示
  function inspectPanelHTML(p) {
    var rep = inspectionOf(p);
    if (!rep.has) { return ''; }
    var MARK = {
      pass: '<span class="ins-mark is-pass" aria-hidden="true">✓</span>',
      note: '<span class="ins-mark is-note" aria-hidden="true">!</span>',
      none: '<span class="ins-mark is-none" aria-hidden="true">–</span>'
    };
    var LABEL = { pass: '通過', note: '注意', none: '未檢測' };
    var rows = rep.rows.map(function (r) {
      return '<li class="ins-row is-' + r.status + '">' +
        MARK[r.status] +
        '<span class="ins-label">' + esc(r.label) +
        '<small>' + esc(r.hint) + '</small></span>' +
        '<span class="ins-result"><span class="sr-only">' + LABEL[r.status] + '：</span>' +
        esc(r.text) + '</span></li>';
    }).join('');

    var counts = [];
    if (rep.summary.pass) { counts.push(rep.summary.pass + ' 項通過'); }
    if (rep.summary.note) { counts.push(rep.summary.note + ' 項註記'); }
    if (rep.summary.none) { counts.push(rep.summary.none + ' 項未檢測'); }

    return '<section class="panel panel-pad ins-panel">' +
      '<div class="ins-head">' +
        '<h2 class="section-title" style="font-size:1.2rem;margin:0">這台我們檢查了什麼</h2>' +
        (rep.date ? '<span class="ins-date">檢測日期 ' + esc(rep.date) +
          (CFG.inspector ? '　檢測人員 ' + esc(CFG.inspector) : '') + '</span>' : '') +
      '</div>' +
      '<p class="ins-summary">' + esc(counts.join('、')) + '</p>' +
      '<ul class="ins-list">' + rows + '</ul>' +
      '<p class="hint ins-note">這是<strong>這一台</strong>實際的檢測紀錄，不是通用的流程說明。' +
      '沒有做到的項目我們就寫未檢測，不會先打勾。想看哪一項的實拍或數據，問我們就補給你。</p>' +
      '</section>';
  }

  // 取得「這台適合做什麼」的評估（fit.js 提供，載入失敗時回傳空結果）
  function fitnessOf(p) {
    return typeof window.getFitness === 'function' ? window.getFitness(p) : { kind: 'none' };
  }

  // 五顆點的程度條
  function meterHTML(score) {
    var cls = score >= 4 ? 'is-high' : (score >= 3 ? 'is-mid' : 'is-low');
    var dots = '';
    for (var i = 1; i <= 5; i++) {
      dots += '<span class="fit-dot' + (i <= score ? ' on' : '') + '"></span>';
    }
    return '<span class="fit-meter ' + cls + '" role="img" aria-label="5 分中的 ' +
      score + ' 分">' + dots + '</span>';
  }

  // 商品卡上的「適合」小標籤（最多三個）
  function fitTagsHTML(p) {
    var fit = fitnessOf(p);
    if (fit.kind !== 'computer' || !fit.good.length) { return ''; }
    return '<div class="tag-row fit-tags">' + fit.good.slice(0, 3).map(function (u) {
      return '<span class="tag tag-ok">' + icon('check') + esc(u.short) + '</span>';
    }).join('') + '</div>';
  }

  // 商品詳情頁的「這台適合做什麼」區塊
  function fitPanelHTML(p) {
    var fit = fitnessOf(p);
    if (fit.kind === 'computer') {
      var rows = fit.uses.map(function (u) {
        return '<li class="fit-row">' +
          '<span class="fit-label">' + esc(u.label) +
          '<small>' + esc(u.hint) + '</small></span>' +
          meterHTML(u.score) + '</li>';
      }).join('');
      return '<section class="panel panel-pad fit-panel">' +
        '<h2 class="section-title" style="font-size:1.2rem">這台適合做什麼？</h2>' +
        '<p class="fit-verdict">' + esc(fit.verdict) + '</p>' +
        '<ul class="fit-list">' + rows + '</ul>' +
        '<p class="hint fit-note">依照這台的規格（' + esc(fit.basis) +
        '）自動評估的參考值，不是實測跑分。' +
        '不確定夠不夠用，直接問我們，我們會老實說。</p>' +
        '</section>';
    }
    if (fit.kind === 'screen') {
      var lines = fit.notes.map(function (n) {
        return '<li class="fit-row"><span class="fit-label">' + esc(n.label) +
          '<small>' + esc(n.note) + '</small></span>' +
          '<strong class="fit-value">' + esc(n.value) + '</strong></li>';
      }).join('');
      return '<section class="panel panel-pad fit-panel">' +
        '<h2 class="section-title" style="font-size:1.2rem">這台放在哪裡剛剛好？</h2>' +
        '<ul class="fit-list">' + lines + '</ul>' +
        '<p class="hint fit-note">建議值供參考，實際還是看你的空間與習慣。</p>' +
        '</section>';
    }
    return '';
  }

  // 取出商品的照片清單：支援 images 陣列（多張），也相容舊的 image 單張欄位
  function photosOf(p) {
    if (Array.isArray(p.images)) {
      return p.images.filter(function (src) { return !!src; });
    }
    return p.image ? [p.image] : [];
  }

  // 商品圖：有照片就用真實照片的第一張，否則自動畫 SVG 示意圖
  function mediaHTML(p, size) {
    var cls = 'media media--' + size;
    var photos = photosOf(p);
    var label = esc(p.name) + (photos.length ? '' : ' 示意圖');
    var inner = photos.length
      ? '<img src="' + esc(photos[0]) + '" alt="" loading="lazy">'
      : productSVG(p.svgKind);
    return '<div class="' + cls + '" role="img" aria-label="' + label + '">' + inner + '</div>';
  }

  // 商品詳情頁的照片相簿（大圖 ＋ 縮圖列）
  function galleryHTML(p, photos) {
    var thumbs = photos.map(function (src, i) {
      return '<button class="gallery-thumb" type="button" data-photo="' + i + '"' +
        (i === 0 ? ' aria-current="true"' : '') +
        ' aria-label="第 ' + (i + 1) + ' 張照片"><img src="' + esc(src) +
        '" alt="" loading="lazy"></button>';
    }).join('');
    return '<div class="gallery">' +
      '<button class="gallery-main" type="button" id="gallery-main" aria-label="放大檢視商品照片">' +
      '<img id="gallery-img" src="' + esc(photos[0]) + '" alt="' + esc(p.name) + ' 照片 1">' +
      '</button>' +
      (photos.length > 1
        ? '<div class="gallery-thumbs" role="group" aria-label="' + esc(p.name) + ' 的照片">' +
          thumbs + '</div>'
        : '') +
      '<p class="hint gallery-hint">' +
      (photos.length > 1 ? '共 ' + photos.length + ' 張照片，' : '') +
      '點照片可以放大看細節。</p></div>';
  }

  // 相簿互動：縮圖切換、點大圖放大檢視、鍵盤左右切換與 Esc 關閉
  function initGallery(p, photos) {
    var current = 0;
    var mainBtn = $('#gallery-main');
    var mainImg = $('#gallery-img');
    var box = null;

    function show(index) {
      current = (index + photos.length) % photos.length;
      var alt = p.name + ' 照片 ' + (current + 1);
      mainImg.src = photos[current];
      mainImg.alt = alt;
      $$('.gallery-thumb').forEach(function (btn, i) {
        if (i === current) { btn.setAttribute('aria-current', 'true'); }
        else { btn.removeAttribute('aria-current'); }
      });
      if (box) {
        $('#lightbox-img', box).src = photos[current];
        $('#lightbox-img', box).alt = alt;
        $('#lightbox-step', box).textContent = (current + 1) + ' / ' + photos.length;
      }
    }

    function closeBox() {
      if (!box) { return; }
      document.body.removeChild(box);
      document.body.style.overflow = '';
      box = null;
      mainBtn.focus();
    }

    function openBox() {
      if (box) { return; }
      box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', p.name + ' 的照片');
      box.innerHTML =
        '<img id="lightbox-img" src="' + esc(photos[current]) + '" alt="' +
          esc(p.name) + ' 照片 ' + (current + 1) + '">' +
        '<p class="lightbox-step" id="lightbox-step">' + (current + 1) + ' / ' +
          photos.length + '</p>' +
        (photos.length > 1
          ? '<button class="lightbox-nav lightbox-prev" type="button" aria-label="上一張照片">' +
            icon('chevron-left') + '</button>' +
            '<button class="lightbox-nav lightbox-next" type="button" aria-label="下一張照片">' +
            icon('chevron-right') + '</button>'
          : '') +
        '<button class="lightbox-close" type="button" aria-label="關閉放大檢視">' +
          icon('close') + '</button>';
      document.body.appendChild(box);
      document.body.style.overflow = 'hidden';
      box.addEventListener('click', function (ev) {
        if (ev.target.closest('.lightbox-prev')) { show(current - 1); }
        else if (ev.target.closest('.lightbox-next')) { show(current + 1); }
        else if (ev.target.closest('.lightbox-close') || ev.target === box) { closeBox(); }
      });
      $('.lightbox-close', box).focus();
    }

    mainBtn.addEventListener('click', openBox);

    var thumbWrap = $('.gallery-thumbs');
    if (thumbWrap) {
      thumbWrap.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-photo]');
        if (btn) { show(Number(btn.getAttribute('data-photo'))); }
      });
    }

    document.addEventListener('keydown', function (ev) {
      if (box) {
        if (ev.key === 'Escape') { closeBox(); }
        else if (ev.key === 'ArrowLeft') { show(current - 1); }
        else if (ev.key === 'ArrowRight') { show(current + 1); }
      }
    });
  }

  // 這個成色的標準保固天數（設定檔沒寫就回 0，等於不啟用這個制度）
  function standardWarranty(cond) {
    var map = CFG.warrantyByCondition || {};
    return Number(map[cond]) || 0;
  }

  // 這台實際的保固天數：以成色的標準保固為下限，商品標更久就用商品標的
  function warrantyOf(p) {
    return Math.max(Number(p.warrantyDays) || 0, standardWarranty(p.condition));
  }

  function condBadge(p) {
    var c = conditionMeta(p.condition);
    return '<span class="cond ' + c.cls + '">' + esc(c.key) + ' ' + esc(c.name) + '</span>';
  }

  function warrantyTag(p) {
    var days = warrantyOf(p);
    if (days > 0) {
      return '<span class="tag tag-ok">' + icon('shield') + '保固 ' + days + ' 天</span>';
    }
    return '<span class="tag">無保固</span>';
  }

  function stockTag(p) {
    if (p.stock <= 0) { return '<span class="tag">已售出</span>'; }
    if (p.stock <= 2) { return '<span class="tag tag-warn">僅剩 ' + p.stock + ' 件</span>'; }
    return '';
  }

  function priceRow(p) {
    var off = discountPct(p);
    return '<div class="price-row"><span class="price">' + money(p.price) + '</span>' +
      (p.originalPrice ? '<span class="price-old">' + money(p.originalPrice) + '</span>' : '') +
      (off > 0 ? '<span class="price-off">省 ' + off + '%</span>' : '') + '</div>';
  }

  // 商品卡（首頁精選、列表頁、推薦商品共用）
  function productCard(p) {
    var sold = p.stock <= 0;
    var specs = (p.specs || []).slice(0, 2).map(function (s) {
      return '<li>' + esc(s.label) + '：' + esc(s.value) + '</li>';
    }).join('');
    var btn = sold
      ? '<button class="btn btn-block" type="button" disabled>已售出</button>'
      : '<button class="btn btn-primary btn-block" type="button" data-add="' + esc(p.id) + '">' +
        icon('cart') + '加入購物車</button>';
    var photoCount = photosOf(p).length;
    var countBadge = photoCount > 1
      ? '<span class="photo-count">' + icon('camera') + photoCount + ' 張實拍</span>'
      : '';
    return '<article class="card' + (sold ? ' is-sold' : '') + '">' +
           (sold ? '<span class="ribbon-sold">已售出</span>' : '') +
      countBadge +
      mediaHTML(p, 'card') +
      '<div class="card-body">' +
        '<div class="tag-row">' + condBadge(p) + warrantyTag(p) + stockTag(p) +
          (inspectionOf(p).has
            ? '<span class="tag tag-accent">' + icon('check') + '檢測報告</span>' : '') +
        '</div>' +
        '<span class="card-brand">' + esc(p.brand) + '</span>' +
        '<h3 class="card-title"><a href="product.html?id=' + encodeURIComponent(p.id) + '">' +
          esc(p.name) + '</a></h3>' +
        '<ul class="card-spec">' + specs + '</ul>' +
        fitTagsHTML(p) +
        '<div class="card-foot">' + priceRow(p) + btn + '</div>' +
      '</div></article>';
  }

  function emptyState(title, text, btnHTML) {
    return '<div class="empty-state">' + icon('box') +
      '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (btnHTML || '') + '</div>';
  }

  /* ---------------- 頁首與頁尾（由 config 動態產生） ---------------- */

  function brandMark() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="4" y="6" width="24" height="16" rx="3"/><path d="M12 26h8M16 22v4"/></svg>';
  }

  function navLink(href, label, current) {
    return '<li><a href="' + href + '"' + (current ? ' aria-current="page"' : '') + '>' +
      esc(label) + '</a></li>';
  }

  function headerHTML(page) {
    var en = CFG.storeNameEn ? '<span class="brand-en">' + esc(CFG.storeNameEn) + '</span>' : '';
    var dd = CATEGORIES.map(function (c) {
      return '<li><a href="products.html?category=' + c.key + '">' + esc(c.name) + '</a></li>';
    }).join('');
    var nav = navLink('index.html', '首頁', page === 'home') +
      navLink('products.html', '全部商品', page === 'products') +
      navLink('helper.html', '選購小幫手', page === 'helper') +
      (luckyOn() ? navLink('lucky.html', '每日抽獎', page === 'lucky') : '') +
      '<li><details class="nav-dd"><summary>商品分類</summary>' +
      '<ul class="nav-dd-menu">' + dd + '</ul></details></li>' +
      navLink('guide.html', '購物須知', page === 'guide') +
      navLink('about.html', '關於我們', page === 'about') +
      navLink('orders.html', '訂單紀錄', page === 'orders');

    return '<div class="header-inner wrap">' +
      '<a class="brand" href="index.html"><span class="brand-mark">' + brandMark() + '</span>' +
      '<span class="brand-text"><strong class="brand-zh">' + esc(CFG.storeName || '') + '</strong>' +
      en + '</span></a>' +
      '<nav class="primary-nav" id="primary-nav" aria-label="主要導覽"><ul class="nav-list">' +
      nav + '</ul></nav>' +
      '<a class="cart-link" href="cart.html" aria-label="購物車"' +
      (page === 'cart' ? ' aria-current="page"' : '') + '>' + icon('cart') +
      '<span class="cart-badge" data-cart-badge hidden>0</span></a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" ' +
      'aria-label="開啟主選單">' + icon('menu') + '</button></div>';
  }

  function footerHTML() {
    var cats = CATEGORIES.map(function (c) {
      return '<a href="products.html?category=' + c.key + '">' + esc(c.name) + '</a>';
    }).join('');
    var tel = String(CFG.phone || '').replace(/[^0-9+]/g, '');
    return '<div class="wrap footer-grid">' +
      '<div class="footer-col">' +
        '<h3>關於本店</h3>' +
        '<p><strong>' + esc(CFG.storeName || '') + '</strong><br>' + esc(CFG.slogan || '') + '</p>' +
        '<p>' + esc(CFG.delivery || '') + '</p>' +
        contactButton('btn btn-contact btn-sm', '用 {管道} 聯絡我們') +
      '</div>' +
      '<div class="footer-col"><h3>聯絡資訊</h3><ul class="footer-links">' +
        '<li><a href="tel:' + esc(tel) + '">' + esc(CFG.phone || '') + '</a></li>' +
        '<li><a href="mailto:' + esc(CFG.email || '') + '">' + esc(CFG.email || '') + '</a></li>' +
        '<li>營業時間：' + esc(CFG.hours || '') + '</li>' +
      '</ul></div>' +
      '<div class="footer-col"><h3>快速連結</h3><div class="footer-links">' +
        '<a href="index.html">首頁</a><a href="products.html">全部商品</a>' +
        '<a href="helper.html">選購小幫手</a>' +
        '<a href="guide.html">購物須知</a><a href="about.html">關於我們</a>' +
        '<a href="cart.html">購物車</a><a href="orders.html">訂單紀錄</a>' +
      '</div></div>' +
      '<div class="footer-col"><h3>商品分類</h3><div class="footer-links">' + cats + '</div></div>' +
      '</div>' +
      '<div class="wrap footer-bottom"><span>© ' + new Date().getFullYear() + ' ' +
      esc(CFG.storeName || '') + '　二手商品，成色與規格以實機為準。</span>' +
      '<span>營業時間 ' + esc(CFG.hours || '') + '</span></div>';
  }

  // 聯絡按鈕下面那一行小字（例如「訊息由店長的女兒代為回覆」）
  function contactNoteHTML() {
    if (!CFG.contactNote || !contactReady()) { return ''; }
    return '<small class="contact-note">' + esc(CFG.contactNote) + '</small>';
  }

  // 產生一顆聯絡按鈕；聯絡管道尚未設定時會自動改成導向聯絡表單
  function contactButton(cls, label) {
    var ready = contactReady();
    var text = ready ? channelLabel(label) : '填表單聯絡我們';
    var link = '<a class="' + cls + '" href="' + esc(contactHref()) + '"' +
      (ready ? ' target="_blank" rel="noopener"' : '') + '>' + channelIcon() + esc(text) + '</a>';
    var note = contactNoteHTML();
    return note ? '<span class="contact-wrap">' + link + note + '</span>' : link;
  }

  // 幫寫在 HTML 裡的聯絡按鈕補上同一行說明（只會補一次）
  function addContactNote(el) {
    if (!CFG.contactNote || !contactReady()) { return; }
    var parent = el.parentNode;
    if (!parent || (parent.className || '').indexOf('contact-wrap') >= 0) { return; }
    var wrap = document.createElement('span');
    wrap.className = 'contact-wrap';
    parent.insertBefore(wrap, el);
    wrap.appendChild(el);
    var note = document.createElement('small');
    note.className = 'contact-note';
    note.textContent = CFG.contactNote;
    wrap.appendChild(note);
  }

  // 導覽列互動：漢堡選單、分類下拉、Esc 關閉
  function initNav(header) {
    var toggle = $('.nav-toggle', header);
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? '關閉主選單' : '開啟主選單');
        toggle.innerHTML = icon(open ? 'close' : 'menu');
      });
    }
    document.addEventListener('click', function (ev) {
      var dd = $('.nav-dd', header);
      if (dd && dd.open && !dd.contains(ev.target)) { dd.open = false; }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') { return; }
      var dd = $('.nav-dd', header);
      if (dd) { dd.open = false; }
      if (header.classList.contains('nav-open') && toggle) { toggle.click(); }
    });
  }

  /* ---------------- 把 config 的值填進 HTML ---------------- */
  function fillSlots(root) {
    $$('[data-icon]', root).forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-icon'));
    });
    $$('[data-cfg]', root).forEach(function (el) {
      var key = el.getAttribute('data-cfg');
      if (CFG[key] != null) { el.textContent = channelLabel(CFG[key]); }
    });
    $$('[data-cfg-tel]', root).forEach(function (el) {
      el.href = 'tel:' + String(CFG.phone || '').replace(/[^0-9+]/g, '');
      el.textContent = CFG.phone || '';
    });
    $$('[data-cfg-mail]', root).forEach(function (el) {
      el.href = 'mailto:' + (CFG.email || '');
      el.textContent = CFG.email || '';
    });
    $$('[data-line]', root).forEach(function (el) {
      var ready = contactReady();
      el.setAttribute('href', contactHref());
      if (ready) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      } else {
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }
      var label = channelLabel(el.getAttribute('data-line') || '用 {管道} 問問');
      el.innerHTML = channelIcon() + esc(ready ? label : '填表單聯絡我們');
      addContactNote(el);
    });
  }

  /* ---------------- 提示訊息 ---------------- */
  var toastTimer = null;
  function showToast(text) {
    var old = $('.toast');
    if (old) { old.parentNode.removeChild(old); }
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = icon('check') + '<span>' + esc(text) + '</span>';
    document.body.appendChild(el);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 2200);
  }

  /* ---------------- 複製文字 ---------------- */
  function copyText(text, btn) {
    var original = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', original);
    function done(ok) {
      btn.innerHTML = icon(ok ? 'check' : 'copy') + (ok ? '已複製 ✓' : '請手動選取複製');
      window.setTimeout(function () { btn.innerHTML = icon('copy') + esc(original); }, 2000);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); },
        function () { done(fallback()); });
    } else {
      done(fallback());
    }
  }

  /* ---------------- 表單驗證 ---------------- */
  var RULES = {
    required: function (v) { return v.trim() ? '' : '這個欄位必填，請填寫。'; },
    phone: function (v) {
      // 去掉空白與符號後，必須是 0 開頭的 9~10 碼（手機與市話都適用）
      var digits = v.replace(/\D/g, '');
      return /^0\d{8,9}$/.test(digits) ? '' : '請輸入正確的電話，例如 0912-345-678 或 02-1234-5678。';
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : '請輸入正確的 Email，例如 abc@gmail.com。';
    }
  };

  function setFieldError(el, msg) {
    var box = document.getElementById('err-' + el.id);
    if (box) { box.textContent = msg; }
    if (msg) { el.classList.add('is-invalid'); el.setAttribute('aria-invalid', 'true'); }
    else { el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); }
  }

  function validateForm(form) {
    var ok = true, first = null;
    $$('[data-rules]', form).forEach(function (el) {
      var wrapper = el.closest('.field');
      if (el.disabled || (wrapper && wrapper.hasAttribute('hidden'))) {
        setFieldError(el, '');
        return;
      }
      var rules = el.getAttribute('data-rules').split('|');
      var value = el.value || '';
      var msg = '';
      for (var i = 0; i < rules.length; i++) {
        if (!rules[i] || !RULES[rules[i]]) { continue; }
        if (rules[i] !== 'required' && !value.trim()) { continue; }
        msg = RULES[rules[i]](value);
        if (msg) { break; }
      }
      setFieldError(el, msg);
      if (msg) { ok = false; if (!first) { first = el; } }
    });
    if (first) { first.focus(); }
    return ok;
  }

  // 失焦時即時清掉已修正的錯誤訊息
  function bindLiveValidate(form) {
    $$('[data-rules]', form).forEach(function (el) {
      el.addEventListener('blur', function () {
        if (el.classList.contains('is-invalid')) { validateForm(form); }
      });
    });
  }

  /* ---------------- 首頁 ---------------- */
  function initHome() {
    var catBox = $('#cat-grid');
    if (catBox) {
      catBox.innerHTML = CATEGORIES.map(function (c) {
        var n = PRODUCTS.filter(function (p) { return p.category === c.key; }).length;
        return '<a class="card cat-card" href="products.html?category=' + c.key + '">' +
          '<div class="cat-media" role="img" aria-label="' + esc(c.name) + '圖示">' +
          productSVG(c.kind) + '</div>' +
          '<h3>' + esc(c.name) + '</h3><p>' + esc(c.desc) + '</p>' +
          '<span class="cat-count">' + n + ' 件商品</span></a>';
      }).join('');
    }
    // 每日抽獎入口：有券的話直接把券的狀態寫在首頁上
    var luckyBand = $('#home-lucky');
    if (luckyBand && luckyOn()) {
      luckyBand.removeAttribute('hidden');
      var c = window.Lucky.coupon();
      if (c) {
        var left = window.Lucky.daysLeft(c);
        $('#home-lucky-title').textContent = '你有一張 ' + money(c.amount) + ' 折價券';
        $('#home-lucky-text').textContent = '滿 ' + money(c.min) + ' 可用，' +
          (left === 0 ? '今天是最後一天' : '還有 ' + left + ' 天到期') +
          '。今天也別忘了再抽一次，抽到更大的才會換。';
        $('#home-lucky-btn').textContent = '去抽今天這一次';
      }
    }

    var feat = $('#featured-grid');
    if (feat) {
      var list = PRODUCTS.slice().sort(function (a, b) {
        // 有貨的排前面，再依上架日期由新到舊
        var aSold = a.stock <= 0 ? 1 : 0;
        var bSold = b.stock <= 0 ? 1 : 0;
        if (aSold !== bSold) { return aSold - bSold; }
        if (a.createdAt === b.createdAt) { return b.price - a.price; }
        return a.createdAt < b.createdAt ? 1 : -1;
      }).slice(0, 8);
      feat.innerHTML = list.map(productCard).join('');
    }
  }

  /* ---------------- 商品列表頁 ---------------- */

  var PRICE_PRESETS = [
    { label: '3,000 以下', min: '', max: '3000' },
    { label: '3,000–6,000', min: '3000', max: '6000' },
    { label: '6,000–10,000', min: '6000', max: '10000' },
    { label: '10,000 以上', min: '10000', max: '' }
  ];

  function parseQuery() {
    var raw = window.location.search;
    if (!raw && window.location.hash.indexOf('?') >= 0) {
      raw = window.location.hash.slice(window.location.hash.indexOf('?'));
    }
    var out = {};
    raw.replace(/^[?#]+/, '').split('&').forEach(function (pair) {
      if (!pair) { return; }
      var i = pair.indexOf('=');
      var k = decodeURIComponent(i < 0 ? pair : pair.slice(0, i));
      var v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
      out[k] = v;
    });
    return out;
  }

  function initProducts() {
    var form = $('#filter-form');
    var grid = $('#product-grid');
    var countEl = $('#result-count');
    var searchInput = $('#keyword');
    var sortSelect = $('#sort');
    var aside = $('#filter-aside');
    var suppressHash = false;

    // 篩選面板（由 JS 產生，分類與成色件數自動計算）
    form.innerHTML =
      '<div class="filter-group"><h3>商品類別</h3>' +
      CATEGORIES.map(function (c) {
        var n = PRODUCTS.filter(function (p) { return p.category === c.key; }).length;
        return '<label class="check"><input type="checkbox" name="category" value="' + c.key + '">' +
          '<span>' + esc(c.name) + '</span><span class="check-count">' + n + '</span></label>';
      }).join('') + '</div>' +

      '<div class="filter-group"><h3>價格區間</h3><div class="price-inputs">' +
      '<label class="sr-only" for="price-min">最低價格</label>' +
      '<input class="input" type="number" id="price-min" name="min" min="0" step="100" placeholder="最低" inputmode="numeric">' +
      '<span>–</span>' +
      '<label class="sr-only" for="price-max">最高價格</label>' +
      '<input class="input" type="number" id="price-max" name="max" min="0" step="100" placeholder="最高" inputmode="numeric">' +
      '</div><div class="price-presets">' +
      PRICE_PRESETS.map(function (p, i) {
        return '<button class="btn btn-ghost btn-sm" type="button" data-preset="' + i + '">' +
          esc(p.label) + '</button>';
      }).join('') + '</div></div>' +

      '<div class="filter-group"><h3>商品成色</h3>' +
      CONDITIONS.map(function (c) {
        var n = PRODUCTS.filter(function (p) { return p.condition === c.key; }).length;
        return '<label class="check"><input type="checkbox" name="condition" value="' + esc(c.key) + '">' +
          '<span>' + esc(c.key) + '　' + esc(c.name) + '</span>' +
          '<span class="check-count">' + n + '</span></label>';
      }).join('') + '</div>' +

      '<div class="filter-group"><h3>我要拿來做什麼</h3>' +
      '<p class="hint" style="margin:-4px 0 8px">勾起來只會顯示跑得動的機器</p>' +
      (window.FIT_USES || []).map(function (u) {
        return '<label class="check"><input type="checkbox" name="use" value="' + u.key + '">' +
          '<span>' + esc(u.label) + '</span></label>';
      }).join('') + '</div>' +

      '<div class="filter-group"><h3>其他條件</h3>' +
      '<label class="check"><input type="checkbox" name="warranty" value="1"><span>只看有保固</span></label>' +
      '<label class="check"><input type="checkbox" name="stock" value="1"><span>只看有庫存</span></label>' +
      '</div>' +
      '<button class="btn btn-ghost btn-block" type="button" id="clear-filter">清除所有篩選</button>';

    // 手機版篩選面板展開／收合
    var filterToggle = $('#filter-toggle');
    if (filterToggle) {
      filterToggle.addEventListener('click', function () {
        var collapsed = aside.getAttribute('data-collapsed') !== 'false';
        aside.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
        filterToggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
      });
    }

    function readState() {
      var q = parseQuery();
      return {
        cats: q.category ? q.category.split(',').filter(Boolean) : [],
        uses: q.use ? q.use.split(',').filter(Boolean) : [],
        conds: q.condition ? q.condition.split(',').filter(Boolean) : [],
        min: q.min || '',
        max: q.max || '',
        q: q.q || '',
        sort: q.sort || 'new',
        warranty: q.warranty === '1',
        stock: q.stock === '1'
      };
    }

    function stateToQuery(s) {
      var parts = [];
      if (s.cats.length) { parts.push('category=' + s.cats.join(',')); }
      if (s.uses.length) { parts.push('use=' + s.uses.join(',')); }
      if (s.conds.length) { parts.push('condition=' + s.conds.map(encodeURIComponent).join(',')); }
      if (s.min) { parts.push('min=' + encodeURIComponent(s.min)); }
      if (s.max) { parts.push('max=' + encodeURIComponent(s.max)); }
      if (s.q) { parts.push('q=' + encodeURIComponent(s.q)); }
      if (s.sort && s.sort !== 'new') { parts.push('sort=' + s.sort); }
      if (s.warranty) { parts.push('warranty=1'); }
      if (s.stock) { parts.push('stock=1'); }
      return parts.join('&');
    }

    // 把目前的篩選條件同步到網址，方便直接把連結貼給客人
    function syncUrl(s) {
      var qs = stateToQuery(s);
      var file = window.location.pathname.split('/').pop() || 'products.html';
      try {
        window.history.replaceState(null, '', file + (qs ? '?' + qs : ''));
      } catch (e) {
        suppressHash = true;
        window.location.hash = qs ? '?' + qs : '';
        window.setTimeout(function () { suppressHash = false; }, 0);
      }
    }

    function applyStateToForm(s) {
      $$('input[name="category"]', form).forEach(function (el) {
        el.checked = s.cats.indexOf(el.value) >= 0;
      });
      $$('input[name="condition"]', form).forEach(function (el) {
        el.checked = s.conds.indexOf(el.value) >= 0;
      });
      $$('input[name="use"]', form).forEach(function (el) {
        el.checked = s.uses.indexOf(el.value) >= 0;
      });
      $('#price-min', form).value = s.min;
      $('#price-max', form).value = s.max;
      $('input[name="warranty"]', form).checked = s.warranty;
      $('input[name="stock"]', form).checked = s.stock;
      searchInput.value = s.q;
      sortSelect.value = s.sort;
    }

    function formToState() {
      return {
        cats: $$('input[name="category"]:checked', form).map(function (el) { return el.value; }),
        uses: $$('input[name="use"]:checked', form).map(function (el) { return el.value; }),
        conds: $$('input[name="condition"]:checked', form).map(function (el) { return el.value; }),
        min: $('#price-min', form).value,
        max: $('#price-max', form).value,
        q: searchInput.value,
        sort: sortSelect.value,
        warranty: $('input[name="warranty"]', form).checked,
        stock: $('input[name="stock"]', form).checked
      };
    }

    function matches(p, s) {
      if (s.cats.length && s.cats.indexOf(p.category) < 0) { return false; }
      if (s.uses.length) {
        // 勾了用途就只留跑得動的電腦（4 分以上），電視與零組件不列入
        var fit = fitnessOf(p);
        if (fit.kind !== 'computer') { return false; }
        var ok = true;
        s.uses.forEach(function (key) {
          var hit = false;
          fit.uses.forEach(function (u) {
            if (u.key === key && u.score >= 4) { hit = true; }
          });
          if (!hit) { ok = false; }
        });
        if (!ok) { return false; }
      }
      if (s.conds.length && s.conds.indexOf(p.condition) < 0) { return false; }
      if (s.min !== '' && p.price < Number(s.min)) { return false; }
      if (s.max !== '' && p.price > Number(s.max)) { return false; }
      if (s.warranty && !(warrantyOf(p) > 0)) { return false; }
      if (s.stock && p.stock <= 0) { return false; }
      if (s.q) {
        var hay = [p.name, p.brand].concat(
          (p.specs || []).map(function (x) { return x.label + ' ' + x.value; }),
          p.highlights || []
        ).join(' ').toLowerCase();
        if (hay.indexOf(s.q.trim().toLowerCase()) < 0) { return false; }
      }
      return true;
    }

    function sortList(list, sort) {
      return list.slice().sort(function (a, b) {
        // 不論怎麼排序，已售出的一律沉到最後，把版面留給買得到的機器
        var aSold = a.stock <= 0 ? 1 : 0;
        var bSold = b.stock <= 0 ? 1 : 0;
        if (aSold !== bSold) { return aSold - bSold; }
        if (sort === 'price-asc') { return a.price - b.price; }
        if (sort === 'price-desc') { return b.price - a.price; }
        if (a.createdAt === b.createdAt) { return b.price - a.price; }
        return a.createdAt < b.createdAt ? 1 : -1;
      });
    }

    function render(s) {
      var list = sortList(PRODUCTS.filter(function (p) { return matches(p, s); }), s.sort);
      countEl.textContent = '共 ' + list.length + ' 件商品';
      grid.innerHTML = list.length
        ? list.map(productCard).join('')
        : emptyState('找不到符合條件的商品', '試著放寬價格區間，或是告訴我們你想找什麼機型。',
          '<div class="hero-actions" style="justify-content:center">' +
          '<button class="btn btn-primary" type="button" id="clear-filter-empty">清除篩選</button>' +
          '<a class="btn btn-ghost" href="about.html#wanted">告訴我們你想找什麼</a></div>');
    }

    function update(fromForm) {
      var s = fromForm ? formToState() : readState();
      if (!fromForm) { applyStateToForm(s); }
      syncUrl(s);
      render(s);
    }

    form.addEventListener('change', function () { update(true); });
    form.addEventListener('click', function (ev) {
      var preset = ev.target.closest('[data-preset]');
      if (preset) {
        var p = PRICE_PRESETS[Number(preset.getAttribute('data-preset'))];
        $('#price-min', form).value = p.min;
        $('#price-max', form).value = p.max;
        update(true);
        return;
      }
      if (ev.target.closest('#clear-filter')) {
        form.reset();
        searchInput.value = '';
        sortSelect.value = 'new';
        update(true);
      }
    });
    $('#price-min', form).addEventListener('input', debounce(function () { update(true); }, 350));
    $('#price-max', form).addEventListener('input', debounce(function () { update(true); }, 350));
    searchInput.addEventListener('input', debounce(function () { update(true); }, 200));
    sortSelect.addEventListener('change', function () { update(true); });
    grid.addEventListener('click', function (ev) {
      if (ev.target.closest('#clear-filter-empty')) {
        form.reset();
        searchInput.value = '';
        sortSelect.value = 'new';
        update(true);
      }
    });
    window.addEventListener('hashchange', function () {
      if (!suppressHash) { update(false); }
    });
    window.addEventListener('popstate', function () { update(false); });

    update(false);
  }

  // 輸入框防抖，避免每打一個字就重畫整個列表
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, wait);
    };
  }

  /* ---------------- 商品詳情頁 ---------------- */
  function initProduct() {
    var box = $('#detail');
    var q = parseQuery();
    var p = findProduct(q.id || '');

    if (!p) {
      box.innerHTML = emptyState('找不到這件商品', '它可能已經售出或網址有誤。',
        '<a class="btn btn-primary" href="products.html">回商品列表</a>');
      var relBox = $('#related-section');
      if (relBox) { relBox.setAttribute('hidden', ''); }
      return;
    }

    document.title = p.name + '｜' + (CFG.storeName || '');
    var crumb = $('#crumb-name');
    var cat = categoryMeta(p.category);
    if (crumb) { crumb.textContent = p.name; }
    var crumbCat = $('#crumb-cat');
    if (crumbCat && cat) {
      crumbCat.textContent = cat.name;
      crumbCat.href = 'products.html?category=' + cat.key;
    }

    var c = conditionMeta(p.condition);
    var sold = p.stock <= 0;
    var specRows = (p.specs || []).map(function (s) {
      return '<tr><th scope="row">' + esc(s.label) + '</th><td>' + esc(s.value) + '</td></tr>';
    }).join('');
    var highlights = (p.highlights || []).map(function (h) {
      return '<span class="tag tag-accent">' + icon('check') + esc(h) + '</span>';
    }).join('');

    var photos = photosOf(p);
    box.innerHTML =
      '<div class="detail-layout">' +
        '<div>' + (photos.length ? galleryHTML(p, photos) : mediaHTML(p, 'big')) + '</div>' +
        '<div>' +
          '<span class="card-brand">' + esc(p.brand) + '</span>' +
          '<h1 class="detail-title">' + esc(p.name) + '</h1>' +
          '<div class="tag-row">' + condBadge(p) + warrantyTag(p) + stockTag(p) + '</div>' +
          '<div class="detail-price">' + priceRow(p) + '</div>' +
          '<p class="cond-explain"><strong>成色 ' + esc(c.key) + '（' + esc(c.name) + '）：</strong>' +
            esc(c.desc) + '</p>' +
          '<div class="detail-meta">' +
            '<div>' + icon('shield') + '<span>保固：<strong>' +
              (warrantyOf(p) > 0 ? warrantyOf(p) + ' 天店家保固' : '本件無保固') + '</strong>' +
              (standardWarranty(p.condition) > 0
                ? '<small>成色 ' + esc(c.key) + ' 的標準保固是 ' +
                  standardWarranty(p.condition) + ' 天　<a href="guide.html#warranty">看保固規則</a></small>'
                : '') + '</span></div>' +
            '<div>' + icon('box') + '<span>庫存：<strong>' +
              (sold ? '已售出' : '尚有 ' + p.stock + ' 件') + '</strong></span></div>' +
            '<div>' + icon('truck') + '<span>取貨：<strong>' + esc(CFG.delivery || '') +
              '</strong></span></div>' +
          '</div>' +
          (sold
            ? '<p class="tag tag-warn">這件商品已經售出，歡迎用 ' + esc(channelName()) +
              ' 詢問是否有同款機器。</p>'
            : '<div class="buy-row">' +
              '<div class="qty"><button type="button" id="qty-minus" aria-label="減少數量">' +
                icon('minus') + '</button>' +
              '<output id="qty-value" for="qty-minus qty-plus" aria-live="polite">1</output>' +
              '<button type="button" id="qty-plus" aria-label="增加數量">' + icon('plus') + '</button></div>' +
              '<button class="btn btn-primary" type="button" data-add="' + esc(p.id) +
                '" data-qty="1">' + icon('cart') + '加入購物車</button>' +
              '</div>') +
          '<div class="buy-row">' + contactButton('btn btn-contact', '直接用 {管道} 詢問這台') +
            '<a class="btn btn-ghost" href="cart.html">前往購物車</a></div>' +
          '<p class="eco-line">' + icon('leaf') +
            '<span><strong>買這台，等於少製造一台。</strong>電腦的碳排放大多發生在製造階段，' +
            '讓還能用的機器繼續被使用，就不用再排一次。' +
            '<a href="guide.html#eco">看估算與出處</a></span></p>' +
        '</div>' +
      '</div>' +
      '<div class="section">' +
        fitPanelHTML(p) +
        inspectPanelHTML(p) +
        '<h2 class="section-title" style="margin-top:28px">完整規格</h2>' +
        '<div class="panel"><table class="spec-table"><caption class="sr-only">' +
          esc(p.name) + ' 規格表</caption><tbody>' + specRows + '</tbody></table></div>' +
        (highlights ? '<h2 class="section-title" style="margin-top:28px">本機賣點</h2>' +
          '<div class="tag-row">' + highlights + '</div>' : '') +
        (p.notes ? '<div class="notes-box"><h3>誠實說明（請先看完再下單）</h3><p>' +
          esc(p.notes) + '</p></div>' : '') +
      '</div>';

    if (photos.length) { initGallery(p, photos); }

    // 數量選擇器
    var qtyValue = $('#qty-value');
    if (qtyValue) {
      var addBtn = $('[data-add]', box);
      var setQty = function (n) {
        var v = Math.max(1, Math.min(p.stock, n));
        qtyValue.textContent = String(v);
        addBtn.setAttribute('data-qty', String(v));
        $('#qty-minus').disabled = v <= 1;
        $('#qty-plus').disabled = v >= p.stock;
      };
      $('#qty-minus').addEventListener('click', function () {
        setQty(Number(qtyValue.textContent) - 1);
      });
      $('#qty-plus').addEventListener('click', function () {
        setQty(Number(qtyValue.textContent) + 1);
      });
      setQty(1);
    }

    // 同類別推薦商品
    var rel = $('#related-grid');
    if (rel) {
      var list = PRODUCTS.filter(function (x) {
        return x.category === p.category && x.id !== p.id;
      }).sort(function (a, b) { return (b.stock > 0) - (a.stock > 0); }).slice(0, 4);
      if (list.length) {
        rel.innerHTML = list.map(productCard).join('');
      } else {
        var section = $('#related-section');
        if (section) { section.setAttribute('hidden', ''); }
      }
    }
  }

  /* ---------------- 購物車與結帳 ---------------- */
  function shippingMethod() {
    var checked = $('input[name="method"]:checked');
    return checked ? checked.value : '宅配';
  }

  function initCart() {
    var emptyBox = $('#cart-empty');
    var mainBox = $('#cart-main');
    var itemsBox = $('#cart-items');
    var form = $('#checkout-form');
    var addressField = $('#field-address');

    function totals() {
      var list = cartRead(), subtotal = 0;
      list.forEach(function (it) {
        var p = findProduct(it.id);
        if (p) { subtotal += p.price * it.qty; }
      });
      var ship = 0;
      if (shippingMethod() === '宅配' && subtotal > 0 &&
          subtotal < Number(CFG.freeShippingThreshold || 0)) {
        ship = Number(CFG.shippingFee || 0);
      }
      // 折價券只折商品總額，不折運費；免運門檻也用折扣前的金額判斷
      var cp = luckyOn()
        ? window.Lucky.applyTo(subtotal)
        : { has: false, usable: false, amount: 0, min: 0, gap: 0, coupon: null };
      return {
        list: list, subtotal: subtotal, ship: ship, cp: cp,
        discount: cp.amount, total: subtotal + ship - cp.amount
      };
    }

    function renderSummary() {
      var t = totals();
      $('#sum-subtotal').textContent = money(t.subtotal);
      $('#sum-ship').textContent = t.ship > 0 ? money(t.ship) : '免運 NT$ 0';
      $('#sum-total').textContent = money(t.total);
      renderCouponRow(t);
      var hint = $('#ship-hint');
      var gap = Number(CFG.freeShippingThreshold || 0) - t.subtotal;
      if (shippingMethod() === '面交') {
        hint.textContent = '汐止面交免運費，下單後用 ' + channelName() + ' 約時間地點。';
      } else if (gap > 0) {
        hint.textContent = '再買 ' + money(gap) + ' 即可享宅配免運。';
      } else {
        hint.textContent = '已達免運門檻，宅配免運費。';
      }
    }

    // 結帳摘要裡的折價券那一列：有券就折，沒到低消就說還差多少
    function renderCouponRow(t) {
      var row = $('#sum-coupon-row');
      var note = $('#coupon-note');
      if (!row || !note) { return; }
      if (!luckyOn()) {
        row.setAttribute('hidden', '');
        note.setAttribute('hidden', '');
        return;
      }
      var cp = t.cp;
      if (cp.usable) {
        row.removeAttribute('hidden');
        $('#sum-coupon').textContent = '-' + money(cp.amount);
        $('#sum-coupon-code').textContent = cp.coupon.code;
        note.setAttribute('hidden', '');
      } else if (cp.has) {
        row.setAttribute('hidden', '');
        note.removeAttribute('hidden');
        note.innerHTML = '你有一張 <strong>' + money(cp.coupon.amount) + '</strong> 折價券，' +
          '滿 ' + money(cp.min) + ' 才能用，還差 <strong>' + money(cp.gap) + '</strong>。';
      } else {
        row.setAttribute('hidden', '');
        note.removeAttribute('hidden');
        note.innerHTML = '還沒有折價券？<a href="lucky.html">每天可以抽一次</a>，最高折 ' +
          money(500) + '。';
      }
    }

    // keepFocus：重新渲染後把鍵盤焦點移回剛才按的按鈕
    function render(keepFocus) {
      var list = cartRead();
      if (!list.length) {
        emptyBox.removeAttribute('hidden');
        mainBox.setAttribute('hidden', '');
        return;
      }
      emptyBox.setAttribute('hidden', '');
      mainBox.removeAttribute('hidden');
      itemsBox.innerHTML = list.map(function (it) {
        var p = findProduct(it.id);
        return '<div class="cart-item">' + mediaHTML(p, 'thumb') +
          '<div class="cart-item-main">' +
            '<h3><a href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a></h3>' +
            '<p>' + esc(p.brand) + '｜成色 ' + esc(p.condition) + '｜單價 ' + money(p.price) + '</p>' +
            '<button class="btn-remove" type="button" data-remove="' + esc(p.id) + '">' +
              icon('trash') + '移除</button>' +
          '</div>' +
          '<div class="qty"><button type="button" data-dec="' + esc(p.id) + '" aria-label="減少 ' +
            esc(p.name) + ' 數量"' + (it.qty <= 1 ? ' disabled' : '') + '>' + icon('minus') + '</button>' +
            '<output aria-live="polite">' + it.qty + '</output>' +
            '<button type="button" data-inc="' + esc(p.id) + '" aria-label="增加 ' + esc(p.name) +
            ' 數量"' + (it.qty >= p.stock ? ' disabled' : '') + '>' + icon('plus') + '</button></div>' +
          '<div class="cart-item-sub"><span class="price">' + money(p.price * it.qty) + '</span></div>' +
        '</div>';
      }).join('');
      renderSummary();
      if (keepFocus) {
        var back = $(keepFocus, itemsBox);
        if (back && !back.disabled) { back.focus(); }
      }
    }

    itemsBox.addEventListener('click', function (ev) {
      var dec = ev.target.closest('[data-dec]');
      var inc = ev.target.closest('[data-inc]');
      var rm = ev.target.closest('[data-remove]');
      if (dec) {
        var id1 = dec.getAttribute('data-dec');
        cartSetQty(id1, qtyOf(id1) - 1);
        render('[data-dec="' + id1 + '"]');
      } else if (inc) {
        var id2 = inc.getAttribute('data-inc');
        cartSetQty(id2, qtyOf(id2) + 1);
        render('[data-inc="' + id2 + '"]');
      } else if (rm) {
        cartRemove(rm.getAttribute('data-remove'));
        render();
      }
    });

    function qtyOf(id) {
      var list = cartRead();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { return list[i].qty; }
      }
      return 1;
    }

    // 選擇取貨方式：宅配才顯示地址並設為必填
    $$('input[name="method"]', form).forEach(function (el) {
      el.addEventListener('change', function () {
        var home = shippingMethod() === '宅配';
        if (home) {
          addressField.removeAttribute('hidden');
          $('#address').setAttribute('data-rules', 'required');
        } else {
          addressField.setAttribute('hidden', '');
          $('#address').setAttribute('data-rules', '');
          setFieldError($('#address'), '');
        }
        renderSummary();
      });
    });

    bindLiveValidate(form);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!validateForm(form)) { return; }
      var t = totals();
      if (!t.list.length) { return; }
      var order = buildOrder(t, form);
      storeOrder(order);
      if (order.coupon && luckyOn()) { window.Lucky.spend(); }
      cartClear();
      showOrderDone(order);
    });

    render();
  }

  // 產生訂單編號：日期 + 四位亂數
  function orderNumber() {
    var d = new Date();
    var rnd = String(Math.floor(1000 + Math.random() * 9000));
    return 'KUN' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + rnd;
  }

  function buildOrder(t, form) {
    var d = new Date();
    var method = shippingMethod();
    var items = t.list.map(function (it) {
      var p = findProduct(it.id);
      return { id: p.id, name: p.name, price: p.price, qty: it.qty, subtotal: p.price * it.qty };
    });
    var lines = [];
    lines.push('【' + (CFG.storeName || '') + '　訂單】');
    lines.push('訂單編號：' + orderNumber());
    lines.push('下單時間：' + formatDateTime(d));
    lines.push('--------------------------------');
    lines.push('【商品明細】');
    items.forEach(function (it, i) {
      lines.push((i + 1) + '. ' + it.name + ' x' + it.qty + '　' + money(it.subtotal));
    });
    lines.push('--------------------------------');
    lines.push('商品總額：' + money(t.subtotal));
    lines.push('運費：' + (t.ship > 0 ? money(t.ship) : 'NT$ 0（免運）'));
    if (t.discount > 0) {
      lines.push('折價券：-' + money(t.discount) + '（' + t.cp.coupon.code + '）');
    }
    lines.push('應付總額：' + money(t.total));
    lines.push('--------------------------------');
    lines.push('【取貨資訊】');
    lines.push('姓名：' + $('#name', form).value.trim());
    lines.push('電話：' + $('#phone', form).value.trim());
    lines.push('Email：' + $('#email', form).value.trim());
    lines.push('取貨方式：' + method);
    if (method === '宅配') {
      lines.push('宅配地址：' + $('#address', form).value.trim());
    } else {
      lines.push('面交地點：' +
        channelLabel(CFG.meetupArea || '面交地點以 {管道} 約定為準'));
    }
    var note = $('#note', form).value.trim();
    lines.push('備註：' + (note || '無'));
    lines.push('--------------------------------');
    lines.push('※ 請把這段訂單內容貼到 ' + channelName() + ' 給我們，我們會回覆付款與取貨方式。');

    var text = lines.join('\n');
    return {
      no: lines[1].replace('訂單編號：', ''),
      createdAt: d.toISOString(),
      items: items,
      subtotal: t.subtotal,
      shipping: t.ship,
      discount: t.discount,
      coupon: t.discount > 0 ? t.cp.coupon.code : '',
      total: t.total,
      method: method,
      text: text
    };
  }

  // 讀出歷史訂單（最新的排最前面）
  function readOrders() {
    var raw = storeGet(ORDER_KEY);
    var list = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) { list = []; }
    }
    return Array.isArray(list) ? list : [];
  }

  // 寫回歷史訂單，最多保留 50 筆
  function writeOrders(list) {
    storeSet(ORDER_KEY, JSON.stringify(list.slice(0, 50)));
  }

  // 把訂單存進 localStorage 的歷史紀錄
  function storeOrder(order) {
    var list = readOrders();
    list.unshift(order);
    writeOrders(list);
  }

  function showOrderDone(order) {
    $('#cart-main').setAttribute('hidden', '');
    $('#cart-empty').setAttribute('hidden', '');
    var done = $('#order-done');
    done.removeAttribute('hidden');
    $('#order-no').textContent = order.no;
    $('#order-text').value = order.text;
    fillSlots(done);
    var copyBtn = $('#copy-order');
    copyBtn.innerHTML = icon('copy') + '複製訂單內容';
    copyBtn.addEventListener('click', function () { copyText(order.text, copyBtn); });
    done.scrollIntoView({ block: 'start' });
    window.setTimeout(function () { $('#order-no').focus(); }, 0);
  }

  /* ---------------- 每日抽獎頁 ---------------- */
  function initLucky() {
    var offBox = $('#lucky-off');
    var onBox = $('#lucky-on');
    if (!offBox || !onBox) { return; }

    if (!luckyOn()) {
      offBox.removeAttribute('hidden');
      fillSlots(offBox);
      return;
    }
    onBox.removeAttribute('hidden');

    var L = window.Lucky;
    var joinForm = $('#lucky-join');
    var mainBox = $('#lucky-main');
    var reel = $('#lucky-reel');
    var goBtn = $('#lucky-go');
    var resultBox = $('#lucky-result');
    var subNote = $('#lucky-sub');
    var table = L.prizeTable();
    var spinning = false;

    // 獎項的顯示名稱（0 元就是銘謝惠顧）
    function prizeName(amount) {
      return amount > 0 ? money(amount) : '銘謝惠顧';
    }

    /* ----- 機率公開表 ----- */
    $('#odds-body').innerHTML = table.map(function (row) {
      return '<tr><th scope="row">' +
        (row.amount > 0
          ? '<span class="odds-amount">' + money(row.amount) + ' 折價券</span>'
          : '<span class="odds-none">銘謝惠顧</span>') +
        '</th><td>' + row.percent.toFixed(2) + '%</td><td>' +
        (row.amount > 0 ? '滿 ' + money(row.min) : '—') + '</td></tr>';
    }).join('');

    var ev = 0;
    table.forEach(function (row) { ev += row.amount * row.percent / 100; });
    $('#odds-ev').innerHTML = '平均每抽一次的期望值是 <strong>' + money(Math.round(ev)) +
      '</strong>，券的有效期限是 <strong>' + L.couponDays() + ' 天</strong>，' +
      '最低消費一律是面額的 20 倍（也就是最多折掉訂單的 5%）。';

    /* ----- 抽獎機的格子 ----- */
    reel.innerHTML = table.map(function (row) {
      return '<li class="lucky-slot' + (row.amount > 0 ? '' : ' is-blank') + '">' +
        '<span class="lucky-slot-main">' + prizeName(row.amount) + '</span>' +
        '<span class="lucky-slot-sub">' +
        (row.amount > 0 ? '滿 ' + money(row.min) : '下次再來') + '</span></li>';
    }).join('');
    var slots = $$('.lucky-slot', reel);

    /* ----- 目前持有的券 ----- */
    function renderWallet() {
      var c = L.coupon();
      var box = $('#lucky-wallet');
      if (!c) {
        box.innerHTML = '<div class="panel panel-pad wallet wallet--empty">' +
          '<p><strong>目前沒有折價券。</strong>抽一次看看，最高可以抽到 ' +
          money(500) + ' 的折抵。</p></div>';
        return;
      }
      var left = L.daysLeft(c);
      box.innerHTML = '<div class="panel wallet">' +
        '<div class="wallet-main">' +
          '<span class="wallet-label">你的折價券</span>' +
          '<span class="wallet-amount">' + money(c.amount) + '</span>' +
          '<span class="wallet-min">滿 ' + money(c.min) + ' 可用</span>' +
        '</div>' +
        '<div class="wallet-side">' +
          '<span class="wallet-code">' + esc(c.code) + '</span>' +
          '<span class="wallet-exp' + (left <= 1 ? ' is-soon' : '') + '">' +
            esc(c.expiresAt) + ' 到期' +
            (left === 0 ? '（今天最後一天）' : '（還有 ' + left + ' 天）') + '</span>' +
          '<a class="btn btn-ghost" href="products.html">去挑一台</a>' +
        '</div></div>';
    }

    /* ----- 抽獎按鈕的狀態 ----- */
    function renderButton() {
      var gate = L.canDraw();
      var st = L.state();
      if (gate.ok) {
        goBtn.disabled = false;
        goBtn.textContent = '今天還沒抽，抽一次';
        subNote.textContent = '每天可以抽一次，過午夜 12 點就會重置。';
      } else {
        goBtn.disabled = true;
        goBtn.textContent = '今天已經抽過了';
        subNote.textContent = '明天再來抽一次。抽到比手上更大的才會換，不會愈抽愈小。';
      }
      $('#lucky-stat').textContent = '手機 ' + st.phone.slice(0, 4) + '***' +
        st.phone.slice(-3) + '　已抽 ' + st.draws + ' 次' +
        (st.best > 0 ? '　最佳紀錄 ' + money(st.best) : '');
    }

    /* ----- 跑格子動畫；使用者偏好減少動態時直接顯示結果 ----- */
    function spin(targetIndex, done) {
      var reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function land() {
        slots.forEach(function (el, i) {
          el.classList.toggle('is-active', i === targetIndex);
        });
        done();
      }
      if (reduce || slots.length < 2) { land(); return; }

      var totalTicks = slots.length * 3 + targetIndex + 1;
      var tick = 0;
      var delay = 55;
      function step() {
        slots.forEach(function (el, i) {
          el.classList.toggle('is-active', i === tick % slots.length);
        });
        tick += 1;
        if (tick >= totalTicks) { land(); return; }
        if (totalTicks - tick <= 5) { delay += 70; }
        window.setTimeout(step, delay);
      }
      step();
    }

    /* ----- 結果文案 ----- */
    function resultText(r) {
      if (r.outcome === 'none') {
        return '<span class="r-none">銘謝惠顧</span>這次沒抽到，明天再來一次。';
      }
      if (r.outcome === 'new') {
        return '<span class="r-win">抽到 ' + money(r.amount) + '！</span>' +
          '券已經放進你的卡包，結帳時會自動折抵。';
      }
      if (r.outcome === 'upgrade') {
        return '<span class="r-win">升級成 ' + money(r.amount) + '！</span>' +
          '原本那張 ' + money(r.previous) + ' 已經換掉了。';
      }
      if (r.outcome === 'renew') {
        return '<span class="r-win">又抽到 ' + money(r.amount) + '</span>' +
          '面額一樣，有效期限幫你重新算，等於續命成功。';
      }
      return '<span class="r-keep">抽到 ' + money(r.amount) + '</span>' +
        '比你手上那張 ' + money(r.previous) + ' 小，所以<strong>幫你留著原本那張</strong>。';
    }

    /* ----- 綁事件 ----- */
    goBtn.addEventListener('click', function () {
      if (spinning || !L.canDraw().ok) { return; }
      spinning = true;
      goBtn.disabled = true;
      goBtn.textContent = '抽獎中…';
      resultBox.innerHTML = '';

      var r = L.draw();
      if (!r.ok) { spinning = false; renderButton(); return; }

      var index = 0;
      for (var i = 0; i < table.length; i++) {
        if (table[i].amount === r.amount) { index = i; break; }
      }
      spin(index, function () {
        spinning = false;
        resultBox.innerHTML = resultText(r);
        renderWallet();
        renderButton();
      });
    });

    $('#lucky-leave').addEventListener('click', function () {
      if (!window.confirm('換一組號碼會清掉目前的券和抽獎紀錄，而且救不回來。確定要換嗎？')) {
        return;
      }
      L.leave();
      showJoinOrMain();
    });

    joinForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = $('#lucky-phone');
      var out = L.join(input.value);
      var err = $('#lucky-join-err');
      if (!out.ok) {
        err.textContent = out.message;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      err.textContent = '';
      input.removeAttribute('aria-invalid');
      showJoinOrMain();
      goBtn.focus();
    });

    function showJoinOrMain() {
      var joined = L.state().joined;
      joinForm.toggleAttribute('hidden', joined);
      mainBox.toggleAttribute('hidden', !joined);
      if (joined) {
        renderWallet();
        renderButton();
      } else {
        $('#lucky-phone').value = '';
        $('#lucky-join-err').textContent = '';
      }
    }

    showJoinOrMain();
  }

  /* ---------------- 訂單紀錄頁 ---------------- */
  function initOrders() {
    var box = $('#orders-view');
    var tools = $('#orders-tools');

    function render() {
      var list = readOrders();
      if (!list.length) {
        tools.setAttribute('hidden', '');
        box.innerHTML = emptyState('這台電腦還沒有訂單紀錄',
          '在購物車送出訂單後，訂單內容就會自動留在這裡，方便你隨時複製重傳。',
          '<a class="btn btn-primary" href="products.html">去逛商品</a>');
        return;
      }
      tools.removeAttribute('hidden');
      $('#orders-count').textContent = '共 ' + list.length + ' 筆訂單紀錄';
      box.innerHTML = list.map(function (o, i) {
        var qty = (o.items || []).reduce(function (n, it) {
          return n + (Number(it.qty) || 0);
        }, 0);
        var when = o.createdAt ? formatDateTime(new Date(o.createdAt)) : '';
        var items = (o.items || []).map(function (it) {
          return '<li>' + esc(it.name) + ' x' + (Number(it.qty) || 0) + '　' +
            money(it.subtotal) + '</li>';
        }).join('');
        return '<article class="panel panel-pad order-card">' +
          '<header class="order-card-head">' +
            '<span class="order-id">' + esc(o.no || '') + '</span>' +
            '<span class="tag ' + (o.method === '面交' ? 'tag-ok' : 'tag-accent') + '">' +
              icon(o.method === '面交' ? 'handshake' : 'truck') + esc(o.method || '') + '</span>' +
            '<span class="price">' + money(o.total) + '</span>' +
          '</header>' +
          '<p class="order-meta">' + esc(when) + '　｜　共 ' + qty + ' 件商品' +
          (o.discount > 0 ? '　｜　折價券 -' + money(o.discount) : '') + '</p>' +
          '<details class="acc order-detail"><summary>看訂單明細</summary>' +
            '<div class="acc-body"><ul class="order-items">' + items + '</ul>' +
            '<label class="sr-only" for="order-text-' + i + '">訂單內容</label>' +
            '<textarea class="order-text" id="order-text-' + i + '" readonly>' +
              esc(o.text || '') + '</textarea></div></details>' +
          '<div class="order-card-actions">' +
            '<button class="btn btn-primary btn-sm" type="button" data-copy="' + i + '">' +
              icon('copy') + '複製訂單內容</button>' +
            contactButton('btn btn-contact btn-sm', '用 {管道} 傳給店家') +
            '<button class="btn-remove" type="button" data-del="' + i + '">' +
              icon('trash') + '刪除這筆</button>' +
          '</div></article>';
      }).join('');
    }

    box.addEventListener('click', function (ev) {
      var copyBtn = ev.target.closest('[data-copy]');
      var delBtn = ev.target.closest('[data-del]');
      var list = readOrders();
      if (copyBtn) {
        var order = list[Number(copyBtn.getAttribute('data-copy'))];
        if (order) { copyText(order.text, copyBtn); }
      } else if (delBtn) {
        var idx = Number(delBtn.getAttribute('data-del'));
        var target = list[idx];
        if (target && window.confirm('確定要刪除訂單 ' + target.no + ' 的紀錄嗎？刪除後無法復原。')) {
          list.splice(idx, 1);
          writeOrders(list);
          render();
        }
      }
    });

    $('#clear-orders').addEventListener('click', function () {
      if (window.confirm('確定要清除這台電腦上的全部訂單紀錄嗎？刪除後無法復原。')) {
        writeOrders([]);
        render();
      }
    });

    render();
  }

  /* ---------------- 選購小幫手 ---------------- */

  function condRank(key) {
    return { 'A+': 4, 'A': 3, 'B': 2, 'C': 1 }[key] || 2;
  }

  function initHelper() {
    var form = $('#quiz-form');
    if (!form) { return; }
    var out = $('#quiz-result');
    var submitted = false;

    // 第一題的選項直接取用 fit.js 的用途清單，兩邊永遠一致
    $('#quiz-uses').innerHTML = (window.FIT_USES || []).map(function (u) {
      return '<label class="quiz-option"><input type="checkbox" name="use" value="' +
        esc(u.key) + '">' +
        '<span class="quiz-option-main">' + esc(u.label) + '</span>' +
        '<span class="quiz-option-sub">' + esc(u.hint) + '</span></label>';
    }).join('');

    function pickedValue(name, fallback) {
      var el = $('input[name="' + name + '"]:checked', form);
      return el ? el.value : fallback;
    }

    function readAnswers() {
      var budgetKey = pickedValue('budget', 'any');
      var range = { min: 0, max: 0 };
      if (budgetKey !== 'any') {
        var parts = budgetKey.split('-');
        range.min = Number(parts[0]) || 0;
        range.max = Number(parts[1]) || 0;
      }
      return {
        uses: $$('input[name="use"]:checked', form).map(function (el) { return el.value; }),
        type: pickedValue('type', 'any'),
        care: pickedValue('care', 'price'),
        budgetKey: budgetKey,
        budget: range
      };
    }

    // 候選機器：有庫存的電腦，依照類型（與預算）過濾
    function candidates(a, ignoreBudget) {
      return PRODUCTS.filter(function (p) {
        if (p.stock <= 0) { return false; }
        if (p.category !== 'laptop' && p.category !== 'desktop') { return false; }
        if (a.type !== 'any' && p.category !== a.type) { return false; }
        if (!ignoreBudget) {
          if (a.budget.min && p.price < a.budget.min) { return false; }
          if (a.budget.max && p.price > a.budget.max) { return false; }
        }
        return true;
      });
    }

    function rank(items, a) {
      var maxPrice = 1;
      items.forEach(function (p) { maxPrice = Math.max(maxPrice, p.price); });
      var scored = [];
      items.forEach(function (p) {
        var fit = fitnessOf(p);
        if (fit.kind !== 'computer') { return; }
        var picked = a.uses.length
          ? fit.uses.filter(function (u) { return a.uses.indexOf(u.key) >= 0; })
          : fit.uses;
        var min = 5, sum = 0;
        picked.forEach(function (u) { min = Math.min(min, u.score); sum += u.score; });
        // 勾了用途卻有一項跑不動就不推薦，免得客人買回去失望
        if (a.uses.length && min <= 2) { return; }
        var avg = sum / picked.length;
        var score = avg * 10;
        if (a.care === 'price') { score += (1 - p.price / maxPrice) * 6; }
        if (a.care === 'power') { score += avg * 2; }
        if (a.care === 'look') { score += condRank(p.condition) * 1.6; }
        if (a.care === 'warranty') { score += Math.min(warrantyOf(p), 30) / 30 * 6; }
        scored.push({ p: p, fit: fit, picked: picked, avg: avg, score: score });
      });
      scored.sort(function (x, y) { return y.score - x.score; });
      return scored;
    }

    // 第一名的推薦理由，直接回答客人「最在意的那一點」
    function topReason(entry, a) {
      if (a.care === 'price') { return '在符合你需求的機器裡，這台最便宜。'; }
      if (a.care === 'power') { return '在符合你需求的機器裡，這台跑起來最順。'; }
      if (a.care === 'look') {
        var c = conditionMeta(entry.p.condition);
        return '成色 ' + c.key + '（' + c.name + '），是這幾台裡外觀最好的。';
      }
      return warrantyOf(entry.p) > 0
        ? '保固 ' + warrantyOf(entry.p) + ' 天，是這幾台裡最長的。'
        : '這台在你的條件裡整體最合適。';
    }

    // 第二、三名就講它跟第一名的差別在哪
    function altReason(entry, top) {
      if (entry.p.price < top.p.price) {
        return '比最推薦的那台便宜 ' + money(top.p.price - entry.p.price) + '。';
      }
      if (entry.avg > top.avg) { return '效能比最推薦的那台再好一點。'; }
      if (condRank(entry.p.condition) > condRank(top.p.condition)) {
        return '外觀成色比最推薦的那台更好。';
      }
      if (warrantyOf(entry.p) > warrantyOf(top.p)) {
        return '保固比最推薦的那台更長。';
      }
      return '另一個同樣合適的選擇。';
    }

    var RANK_LABEL = ['最推薦', '第二選擇', '第三選擇'];

    function recCard(entry, index, top, a) {
      var meters = entry.picked.map(function (u) {
        return '<li class="fit-row"><span class="fit-label">' + esc(u.label) + '</span>' +
          meterHTML(u.score) + '</li>';
      }).join('');
      return '<li class="rec-item">' +
        '<div class="rec-card">' +
          '<span class="rec-rank' + (index === 0 ? ' is-top' : '') + '">' +
            RANK_LABEL[index] + '</span>' +
          productCard(entry.p) +
        '</div>' +
        '<div class="rec-why panel panel-pad">' +
          '<h3>為什麼推薦這台</h3>' +
          '<p class="rec-reason">' +
            esc(index === 0 ? topReason(entry, a) : altReason(entry, top)) + '</p>' +
          '<ul class="fit-list">' + meters + '</ul>' +
          '<p class="hint">' + esc(entry.fit.basis) + '</p>' +
          '<p style="margin:14px 0 0"><a class="btn btn-ghost btn-sm" href="product.html?id=' +
            encodeURIComponent(entry.p.id) + '">看完整規格與照片</a></p>' +
        '</div></li>';
    }

    function answerSummary(a) {
      var parts = [];
      if (a.uses.length) {
        parts.push((window.FIT_USES || []).filter(function (u) {
          return a.uses.indexOf(u.key) >= 0;
        }).map(function (u) { return u.label; }).join('、'));
      }
      parts.push({ laptop: '筆記型電腦', desktop: '桌上型主機', any: '筆電或桌機都可以' }[a.type]);
      parts.push({
        '0-5000': '5,000 元以內', '5000-10000': '5,000～10,000 元',
        '10000-20000': '10,000～20,000 元', '20000-0': '20,000 元以上', any: '預算還不確定'
      }[a.budgetKey]);
      parts.push({
        price: '最在意便宜', power: '最在意跑得順',
        look: '最在意外觀', warranty: '最在意保固'
      }[a.care]);
      return parts.join('｜');
    }

    function moreLink(a) {
      var qs = [];
      if (a.uses.length) { qs.push('use=' + a.uses.join(',')); }
      if (a.type !== 'any') { qs.push('category=' + a.type); }
      if (a.budget.min) { qs.push('min=' + a.budget.min); }
      if (a.budget.max) { qs.push('max=' + a.budget.max); }
      qs.push('stock=1');
      return 'products.html?' + qs.join('&');
    }

    function run() {
      var a = readAnswers();
      var list = rank(candidates(a, false), a);
      var relaxed = false;
      if (!list.length && (a.budget.min || a.budget.max)) {
        list = rank(candidates(a, true), a);
        relaxed = true;
      }

      var html = '<div class="section-head" style="margin-top:36px">' +
        '<h2 class="section-title">' +
        (list.length ? '我們建議這 ' + Math.min(3, list.length) + ' 台' : '目前沒有完全符合的機器') +
        '</h2><p>依照你的回答：' + esc(answerSummary(a)) + '</p></div>';

      if (!list.length) {
        html += emptyState('店裡目前沒有符合的機器',
          '可以放寬一點條件再試一次，或是留下需求，有收到符合的機器我們會第一時間通知你。',
          '<div class="hero-actions" style="justify-content:center">' +
          '<a class="btn btn-primary" href="about.html#wanted">留下我想找的機型</a>' +
          '<a class="btn btn-ghost" href="products.html">看全部商品</a></div>');
      } else {
        if (relaxed) {
          html += '<div class="notes-box"><h3>稍微超出預算</h3>' +
            '<p style="margin-bottom:0">你設定的預算內目前沒有完全符合的機器，' +
            '下面是最接近的幾台，價格稍微高一點。</p></div>';
        }
        var top = list[0];
        html += '<ol class="rec-list">' + list.slice(0, 3).map(function (entry, i) {
          return recCard(entry, i, top, a);
        }).join('') + '</ol>';
        html += '<div class="callout" style="margin-top:20px"><p>' +
          '這是依照規格自動挑出來的建議，不是絕對答案。' +
          '不確定哪一台適合你，直接把你的用途告訴我們，老闆會憑經驗給你意見。</p>' +
          '<p style="margin:12px 0 0"><a class="btn btn-ghost btn-sm" href="' + moreLink(a) +
          '">看所有符合條件的機器</a></p></div>';
      }

      out.innerHTML = html;
      out.removeAttribute('hidden');
      submitted = true;
      out.scrollIntoView({ block: 'start' });
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      run();
    });
    // 已經看過結果之後，改答案就即時更新
    form.addEventListener('change', function () {
      if (submitted) { run(); }
    });
    $('#quiz-reset').addEventListener('click', function () {
      form.reset();
      out.setAttribute('hidden', '');
      out.innerHTML = '';
      submitted = false;
      form.scrollIntoView({ block: 'start' });
    });
  }

  /* ---------------- 關於我們：兩張表單（收購詢價／找機器需求單） ---------------- */

  // 產生 mailto 連結，讓客人一鍵開啟郵件軟體，收件者與內容都先填好
  function mailtoHref(subject, body) {
    return 'mailto:' + (CFG.email || '') +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  // 表單送出後：收起表單、把內容顯示出來，並備好 Email／複製／私訊三種送出方式
  function showFormResult(cfg) {
    cfg.form.setAttribute('hidden', '');
    var done = $(cfg.done);
    done.removeAttribute('hidden');
    $(cfg.textBox).value = cfg.text;

    var mail = $(cfg.mailBtn);
    mail.setAttribute('href', mailtoHref(cfg.subject, cfg.text));
    mail.innerHTML = icon('mail') + '用 Email 寄給我們';

    fillSlots(done);

    var copyBtn = $(cfg.copyBtn);
    copyBtn.innerHTML = icon('copy') + cfg.copyLabel;
    copyBtn.addEventListener('click', function () { copyText(cfg.text, copyBtn); });
    done.scrollIntoView({ block: 'start' });
  }

  function initAbout() {
    var quote = $('#quote-form');
    if (quote) {
      bindLiveValidate(quote);
      quote.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!validateForm(quote)) { return; }
        var name = $('#q-name', quote).value.trim();
        var lines = [];
        lines.push('【' + (CFG.storeName || '') + '　收購詢價】');
        lines.push('姓名：' + name);
        lines.push('聯絡方式：' + $('#q-contact', quote).value.trim());
        lines.push('品項類別：' + $('#q-category', quote).value);
        lines.push('型號：' + ($('#q-model', quote).value.trim() || '未提供'));
        lines.push('狀況描述：' + ($('#q-desc', quote).value.trim() || '未提供'));
        lines.push('期望價格：' + ($('#q-price', quote).value.trim() || '由店家評估'));
        lines.push('--------------------------------');
        lines.push('※ 這是客人填寫的收購詢價單。');
        showFormResult({
          form: quote,
          done: '#quote-done',
          textBox: '#quote-text',
          mailBtn: '#mail-quote',
          copyBtn: '#copy-quote',
          copyLabel: '複製詢價內容',
          subject: '【收購詢價】' + name,
          text: lines.join('\n')
        });
      });
    }

    var wanted = $('#wanted-form');
    if (wanted) {
      bindLiveValidate(wanted);
      wanted.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!validateForm(wanted)) { return; }
        var name = $('#w-name', wanted).value.trim();
        var lines = [];
        lines.push('【' + (CFG.storeName || '') + '　找機器需求單】');
        lines.push('姓名：' + name);
        lines.push('聯絡方式：' + $('#w-contact', wanted).value.trim());
        lines.push('想找的類別：' + $('#w-category', wanted).value);
        lines.push('機型或用途：' + $('#w-need', wanted).value.trim());
        lines.push('預算：' + ($('#w-budget', wanted).value.trim() || '未指定'));
        lines.push('希望多久內要：' + $('#w-when', wanted).value);
        lines.push('備註：' + ($('#w-note', wanted).value.trim() || '無'));
        lines.push('--------------------------------');
        lines.push('※ 這是客人填寫的找機器需求單，有符合的機器進來請回覆他。');
        showFormResult({
          form: wanted,
          done: '#wanted-done',
          textBox: '#wanted-text',
          mailBtn: '#mail-wanted',
          copyBtn: '#copy-wanted',
          copyLabel: '複製需求內容',
          subject: '【找機器需求單】' + name,
          text: lines.join('\n')
        });
      });
    }
  }

  /* ---------------- 啟動 ---------------- */
  function boot() {
    var page = document.body.getAttribute('data-page') || '';

    var header = $('#site-header');
    if (header) {
      header.innerHTML = headerHTML(page);
      initNav(header);
    }
    var footer = $('#site-footer');
    if (footer) { footer.innerHTML = footerHTML(); }

    // 頁面標題也跟著 config 的店名走（商品詳情頁會再換成商品名稱）
    var pageTitle = document.body.getAttribute('data-title');
    document.title = pageTitle
      ? pageTitle + '｜' + (CFG.storeName || '')
      : (CFG.storeName || '') + '｜' + (CFG.slogan || '');

    fillSlots(document);

    // 全站「加入購物車」按鈕
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('[data-add]') : null;
      if (!btn) { return; }
      var id = btn.getAttribute('data-add');
      var qty = parseInt(btn.getAttribute('data-qty') || '1', 10) || 1;
      var p = findProduct(id);
      if (cartAdd(id, qty)) {
        showToast('已加入購物車：' + p.name + ' x' + qty);
      }
    });

    if (page === 'home') { initHome(); }
    else if (page === 'products') { initProducts(); }
    else if (page === 'product') { initProduct(); }
    else if (page === 'cart') { initCart(); }
    else if (page === 'orders') { initOrders(); }
    else if (page === 'helper') { initHelper(); }
    else if (page === 'lucky') { initLucky(); }
    else if (page === 'about') { initAbout(); }

    updateBadge();
    openHashSection();
  }

  // 用 #id 連到購物說明頁的某一節時，自動把那一節展開
  function openHashSection() {
    var id = (location.hash || '').slice(1);
    if (!id) { return; }
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') {
      el.open = true;
      el.scrollIntoView();
    }
  }

  window.addEventListener('hashchange', openHashSection);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
