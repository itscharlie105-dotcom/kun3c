/* =====================================================================
   inspect.js ─ 逐台檢測報告
   ---------------------------------------------------------------------
   把老闆本來就在做的檢測，變成客人看得到的紀錄。
   在 js/products.js 的商品裡加上 inspection 欄位就會顯示，例如：

       inspection: {
         date: '2026-11-16',      // 檢測日期
         power: true,             // true = 通過
         battery: '96%',          // 填文字 = 實際量到的數值（也算通過）
         appearance: '!上蓋有刮痕', // 開頭加驚嘆號 = 有狀況要提醒
         camera: 'na'             // na = 這台沒有這個東西
       },

   沒有寫到的項目會顯示「未檢測」——寧可留白，也不要打假的勾。
   桌上型主機會自動把螢幕、鍵盤、電池、鏡頭標成不適用。
   ===================================================================== */
(function () {
  'use strict';

  // 標準檢測項目（顯示順序就是這個順序）
  var ITEMS = [
    { key: 'power', label: '開機與系統', hint: '可正常開機、系統運作正常' },
    { key: 'screen', label: '螢幕', hint: '亮點、漏光、顯示異常', skip: ['desktop'] },
    { key: 'keyboard', label: '鍵盤與觸控板', hint: '每一顆按鍵逐一測試', skip: ['desktop'] },
    { key: 'battery', label: '電池健康度', hint: '實際量測的剩餘容量', skip: ['desktop'] },
    { key: 'disk', label: '硬碟狀態', hint: '容量與健康度' },
    { key: 'memory', label: '記憶體測試', hint: '容量確認與記憶體測試' },
    { key: 'burnin', label: '燒機與溫度', hint: '長時間壓力測試與溫度監控' },
    { key: 'fan', label: '散熱與清潔', hint: '內部除塵、更換散熱膏' },
    { key: 'ports', label: '連接埠', hint: 'USB、HDMI、耳機孔逐孔測試' },
    { key: 'wifi', label: '無線網路與藍牙', hint: '連線測試' },
    { key: 'audio', label: '喇叭與麥克風', hint: '播放與收音測試' },
    { key: 'camera', label: '視訊鏡頭', hint: '畫面與視訊軟體測試', skip: ['desktop'] },
    { key: 'wipe', label: '資料抹除與重灌', hint: '清除前任資料、重新安裝系統' },
    { key: 'appearance', label: '外觀檢查', hint: '刮痕、掉漆、碰撞，以實拍照片為準' }
  ];

  // 把一個欄位的值轉成狀態與顯示文字
  function parseValue(v) {
    if (v === true) { return { status: 'pass', text: '通過' }; }
    if (v === false) { return { status: 'na', text: '不適用' }; }
    if (typeof v === 'number') { return { status: 'pass', text: String(v) }; }
    if (typeof v === 'string') {
      var t = v.trim();
      if (!t) { return { status: 'none', text: '未檢測' }; }
      if (t === 'na' || t === '不適用') { return { status: 'na', text: '不適用' }; }
      if (t.charAt(0) === '!' || t.charAt(0) === '！') {
        return { status: 'note', text: t.slice(1).trim() || '有狀況' };
      }
      if (t === 'pass' || t === '通過') { return { status: 'pass', text: '通過' }; }
      return { status: 'pass', text: t };
    }
    return { status: 'none', text: '未檢測' };
  }

  /**
   * 取得某件商品的檢測報告
   * @param {object} p 商品物件
   * @returns {object} { has, date, rows, summary }
   */
  window.getInspection = function (p) {
    if (!p || !p.inspection || typeof p.inspection !== 'object') {
      return { has: false };
    }
    var data = p.inspection;
    var summary = { pass: 0, note: 0, none: 0, na: 0 };
    var rows = [];

    ITEMS.forEach(function (item) {
      var raw = data[item.key];
      var auto = item.skip && item.skip.indexOf(p.category) >= 0;
      // 這台本來就沒有這個零件，又沒有特別填寫，就不列出來
      if (auto && raw === undefined) { summary.na += 1; return; }
      var parsed = parseValue(raw);
      if (parsed.status === 'na') { summary.na += 1; return; }
      summary[parsed.status] += 1;
      rows.push({
        key: item.key,
        label: item.label,
        hint: item.hint,
        status: parsed.status,
        text: parsed.text
      });
    });

    return {
      has: rows.length > 0,
      date: data.date || '',
      rows: rows,
      summary: summary
    };
  };

  // 讓新增商品工具取得同一份項目清單
  window.INSPECT_ITEMS = ITEMS;
})();
