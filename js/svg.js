/* =====================================================================
   svg.js ─ 商品示意圖與介面圖示產生器
   ---------------------------------------------------------------------
   全站不使用任何外部圖片，所有圖示都是由這裡用程式畫出來的 SVG。
   商品示意圖：window.getProductSVG(kind, options)
     kind    ─ laptop / desktop / tv / monitor / gpu / cpu / ram / ssd
     options ─ { stroke: 主線顏色, dim: 次要線顏色 }（可省略）
   介面圖示：window.getIcon(name)
   ===================================================================== */
(function () {
  'use strict';

  // 預設線條顏色：直接吃 CSS 變數，深色／淺色都能用
  var MAIN = 'var(--accent)';
  var DIM = 'var(--text-dim)';

  // 產生重複元素的小工具（例如機殼散熱孔、CPU 針腳、記憶體金手指）
  function repeat(count, fn) {
    var out = '';
    for (var i = 0; i < count; i++) { out += fn(i); }
    return out;
  }

  // 八種商品示意圖的畫法，皆為線條風格、透明底
  var SHAPES = {

    // 掀蓋筆電（側前視角）
    laptop: function (c) {
      return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' +
        '<path d="M52 30h96a5 5 0 0 1 5 5v67H47V35a5 5 0 0 1 5-5z"/>' +
        '<path d="M28 102h144l14 20H14z"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2" stroke-linecap="round">' +
        '<rect x="58" y="41" width="84" height="50" rx="2"/>' +
        '<path d="M84 112h32"/>' +
        '<path d="M66 96h68"/>' +
        '</g></svg>';
    },

    // 直立機殼（含前面板開孔）
    desktop: function (c) {
      // 前面板的網狀散熱孔，用小圓點排列才看得出是機殼而不是文件
      var mesh = repeat(25, function (i) {
        var cx = 76 + (i % 5) * 12;
        var cy = 60 + Math.floor(i / 5) * 11;
        return '<circle cx="' + cx + '" cy="' + cy + '" r="1.9"/>';
      });
      return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round">' +
        '<rect x="62" y="8" width="76" height="124" rx="7"/>' +
        '<path d="M62 46h76"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2" stroke-linecap="round">' +
        '<rect x="72" y="20" width="36" height="7" rx="3.5"/>' +
        '<circle cx="126" cy="31" r="5"/>' +
        mesh +
        '<rect x="74" y="116" width="12" height="8" rx="2"/>' +
        '<rect x="92" y="116" width="12" height="8" rx="2"/>' +
        '<circle cx="122" cy="120" r="3"/>' +
        '</g></svg>';
    },

    // 大尺寸電視（含底座）
    tv: function (c) {
      return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="14" y="16" width="172" height="96" rx="6"/>' +
        '<path d="M82 112l-7 16M118 112l7 16"/>' +
        '<path d="M58 128h84"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2">' +
        '<rect x="24" y="26" width="152" height="76" rx="2"/>' +
        '</g></svg>';
    },

    // 顯示器（含單腳架）
    monitor: function (c) {
      return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="24" y="14" width="152" height="92" rx="6"/>' +
        '<path d="M100 106v16"/>' +
        '<path d="M74 130l6-8h40l6 8z"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2">' +
        '<rect x="34" y="24" width="132" height="72" rx="2"/>' +
        '</g></svg>';
    },

    // 顯示卡（含雙風扇與金手指）
    gpu: function (c) {
      var blades = function (cx, cy) {
        return repeat(4, function (i) {
          var a = (Math.PI / 4) * i;
          var x1 = (cx + Math.cos(a) * 16).toFixed(1);
          var y1 = (cy + Math.sin(a) * 16).toFixed(1);
          var x2 = (cx - Math.cos(a) * 16).toFixed(1);
          var y2 = (cy - Math.sin(a) * 16).toFixed(1);
          return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"/>';
        });
      };
      var fingers = repeat(8, function (i) {
        var x = 44 + i * 9;
        return '<path d="M' + x + ' 98v10"/>';
      });
      return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round">' +
        '<path d="M24 34h150v64H24z"/>' +
        '<circle cx="70" cy="66" r="21"/>' +
        '<circle cx="128" cy="66" r="21"/>' +
        '<path d="M174 26v80"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2" stroke-linecap="round">' +
        blades(70, 66) + blades(128, 66) +
        '<rect x="96" y="24" width="32" height="10" rx="2"/>' +
        '<path d="M38 98h78"/>' + fingers +
        '</g></svg>';
    },

    // 處理器（含針腳方格）
    cpu: function (c) {
      var pins = repeat(25, function (i) {
        var cx = 50 + (i % 5) * 10;
        var cy = 50 + Math.floor(i / 5) * 10;
        return '<circle cx="' + cx + '" cy="' + cy + '" r="1.8"/>';
      });
      var legs = repeat(4, function (i) {
        var p = 36 + i * 18;
        return '<path d="M' + p + ' 16v-8M' + p + ' 124v8M16 ' + p + 'h-8M124 ' + p + 'h8"/>';
      });
      return '<svg viewBox="0 0 140 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="16" y="16" width="108" height="108" rx="8"/>' +
        legs +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2" stroke-linecap="round">' +
        '<rect x="40" y="40" width="60" height="60" rx="3"/>' +
        '<path d="M28 40l12-12"/>' +
        pins +
        '</g></svg>';
    },

    // 記憶體條（含金手指與防插反缺口）
    ram: function (c) {
      var chips = repeat(8, function (i) {
        var x = 22 + i * 21;
        return '<rect x="' + x + '" y="32" width="15" height="24" rx="2"/>';
      });
      var fingers = repeat(18, function (i) {
        var x = 20 + i * 9;
        if (x > 96 && x < 116) { return ''; }
        return '<path d="M' + x + ' 64v10"/>';
      });
      return '<svg viewBox="0 0 200 100" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round">' +
        '<path d="M12 22h176v42H12z"/>' +
        '<path d="M100 64v14"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2" stroke-linecap="round">' +
        chips + fingers +
        '<path d="M12 64h176"/>' +
        '</g></svg>';
    },

    // 2.5 吋固態硬碟
    ssd: function (c) {
      var holes = repeat(4, function (i) {
        var cx = i % 2 === 0 ? 42 : 158;
        var cy = i < 2 ? 40 : 100;
        return '<circle cx="' + cx + '" cy="' + cy + '" r="3.5"/>';
      });
      return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="' + c.main + '" stroke-width="3" stroke-linejoin="round">' +
        '<rect x="26" y="24" width="148" height="92" rx="8"/>' +
        '</g>' +
        '<g fill="none" stroke="' + c.dim + '" stroke-width="2" stroke-linecap="round">' +
        '<rect x="56" y="42" width="88" height="42" rx="3"/>' +
        '<path d="M68 56h64M68 68h40"/>' +
        '<rect x="112" y="98" width="52" height="10" rx="2"/>' +
        holes +
        '</g></svg>';
    }
  };

  /**
   * 取得商品示意圖（回傳可直接插入 HTML 的 SVG 字串）
   * @param {string} kind 圖示種類，支援 laptop/desktop/tv/monitor/gpu/cpu/ram/ssd
   * @param {object} options 可選的 { stroke, dim } 顏色覆寫
   */
  window.getProductSVG = function (kind, options) {
    var opt = options || {};
    var colors = { main: opt.stroke || MAIN, dim: opt.dim || DIM };
    var draw = SHAPES[kind] || SHAPES.desktop;
    return draw(colors);
  };

  /* ---------- 介面圖示（24x24 線條風格） ---------- */
  var ICONS = {
    cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h2.5l2.6 11.2A2 2 0 0 0 9 15.8h9.4a2 2 0 0 0 2-1.6L22 7H6"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    truck: '<path d="M1 5h11v11H1zM12 9h5l4 4v3h-9z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/>',
    handshake: '<path d="M2 11l4-4 4 3 2-1 2 1 4-3 4 4-5 6-3-2-2 2-2-2-3 2z"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    tag: '<path d="M11 2H3v8l11 11 8-8z"/><circle cx="7" cy="6" r="1.6"/>',
    search: '<circle cx="10.5" cy="10.5" r="7"/><path d="M16 16l5 5"/>',
    wrench: '<path d="M14.5 3a5.5 5.5 0 0 0-5 7.6L3 17v4h4l6.4-6.5A5.5 5.5 0 1 0 14.5 3z"/>',
    phone: '<path d="M7 2h4l1.5 5-2.5 1.5a11 11 0 0 0 5.5 5.5L17 11.5 22 13v4a3 3 0 0 1-3 3A17 17 0 0 1 2 5a3 3 0 0 1 3-3z"/>',
    mail: '<rect x="2" y="4.5" width="20" height="15" rx="2"/><path d="M3 6l9 7 9-7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l4 2.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    line: '<path d="M21 10.2C21 6.2 17 3 12 3S3 6.2 3 10.2c0 3.6 3.2 6.6 7.5 7.2.3.1.7.3.6.8l-.3 1.6c-.1.4.2.8.7.6 2.4-1 7.5-4.4 9-7.8.3-.7.5-1.5.5-2.2z"/>',
    facebook: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M16 7.5h-1.6A1.9 1.9 0 0 0 12.5 9.4V21"/><path d="M9.8 12.8h5"/>',
    check: '<path d="M4 12.5l5 5L20 6"/>'
  };

  /**
   * 取得介面圖示（回傳可直接插入 HTML 的 SVG 字串）
   * @param {string} name 圖示名稱
   */
  window.getIcon = function (name) {
    var path = ICONS[name];
    if (!path) { return ''; }
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      path + '</svg>';
  };
})();
