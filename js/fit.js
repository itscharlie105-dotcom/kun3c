/* =====================================================================
   fit.js ─ 用途適合度評分引擎
   ---------------------------------------------------------------------
   把商品的規格（CPU、記憶體、硬碟、顯卡）翻譯成客人聽得懂的白話：
   「這台適合文書與追劇，但剪片和玩遊戲會吃力。」

   分數是從 js/products.js 裡既有的 specs 欄位自動算出來的，
   老闆不用多填任何東西。如果覺得某一項算得不準，可以在商品資料裡加上
   fit 欄位手動蓋過，例如：
       fit: { game: 2, creative: 4 }
   對應的項目代號：office 文書／web 追劇／meeting 視訊／
                   multi 多工／creative 修圖剪片／game 玩遊戲
   ===================================================================== */
(function () {
  'use strict';

  // 六種用途（顯示順序就是這個順序）
  var USES = [
    { key: 'office', short: '文書', label: '文書處理', hint: 'Word、Excel、PowerPoint' },
    { key: 'web', short: '追劇', label: '上網追劇', hint: '瀏覽網頁、YouTube、Netflix' },
    { key: 'meeting', short: '視訊課', label: '視訊與線上課', hint: 'Google Meet、Zoom' },
    { key: 'multi', short: '多工', label: '同時開很多程式', hint: '一堆分頁、邊開影片邊打字' },
    { key: 'creative', short: '修圖剪片', label: '修圖與剪片', hint: 'Photoshop、剪短片' },
    { key: 'game', short: '玩遊戲', label: '玩遊戲', hint: 'LOL、原神等 3D 遊戲' }
  ];

  // 把商品的名稱與所有規格值串成一段文字，方便比對關鍵字
  function textOf(p) {
    var parts = [p.name || '', p.brand || ''];
    (p.specs || []).forEach(function (s) {
      parts.push((s.label || '') + ' ' + (s.value || ''));
    });
    (p.highlights || []).forEach(function (h) { parts.push(h); });
    return parts.join(' ');
  }

  // 取出某一列規格的內容（找不到就回傳空字串）
  function specValue(p, keyword) {
    var found = '';
    (p.specs || []).forEach(function (s) {
      if (!found && String(s.label || '').indexOf(keyword) >= 0) { found = String(s.value || ''); }
    });
    return found;
  }

  /* ---------- CPU 等級 1~5 ---------- */
  function cpuTier(text) {
    var t = text.toLowerCase();

    // Apple 自家晶片：M 系列整體表現都很好
    if (/\bm[1-4]\b/.test(t)) {
      return { score: /\b(pro|max|ultra)\b/.test(t) ? 5 : 4.5, name: 'Apple M 系列' };
    }
    // 入門文書型處理器
    if (/celeron|pentium|atom|\bn[0-9]{4}\b|athlon/.test(t)) {
      return { score: 1.5, name: '入門文書處理器' };
    }

    var m = t.match(/\b(?:core\s*)?i([3579])[-\s]?(\d{4,5})/);
    if (m) {
      var level = Number(m[1]);
      var model = m[2];
      var gen = model.length >= 5
        ? Number(model.slice(0, 2))
        : (model.charAt(0) === '1' ? Number(model.slice(0, 2)) : Number(model.charAt(0)));
      var base = { 3: 2.3, 5: 3.3, 7: 4.2, 9: 4.8 }[level];
      // 世代加減分：第 10 代以後偏新，第 7 代以前偏舊
      if (gen >= 12) { base += 0.5; }
      else if (gen >= 10) { base += 0.3; }
      else if (gen <= 7) { base -= 0.4; }
      // 低電壓版本（U/T 結尾）持續效能較弱
      if (/\d{4,5}[ut]\b/.test(t)) { base -= 0.2; }
      return { score: Math.max(1, Math.min(5, base)), name: 'Intel i' + level };
    }

    var r = t.match(/ryzen\s*([3579])/);
    if (r) {
      var rl = Number(r[1]);
      return { score: { 3: 2.4, 5: 3.4, 7: 4.3, 9: 4.8 }[rl], name: 'AMD Ryzen ' + rl };
    }
    return { score: 2.5, name: '一般處理器' };
  }

  /* ---------- 記憶體容量 ---------- */
  function ramGB(p, text) {
    var v = specValue(p, '記憶體') || specValue(p, '容量') || text;
    var m = String(v).match(/(\d+)\s*GB/i);
    return m ? Number(m[1]) : 0;
  }

  /* ---------- 硬碟型態 ---------- */
  function diskKind(p, text) {
    var v = (specValue(p, '硬碟') + ' ' + text).toLowerCase();
    if (/nvme|ssd/.test(v)) { return 'ssd'; }
    if (/hdd|轉速|7200/.test(v)) { return 'hdd'; }
    return 'unknown';
  }

  /* ---------- 獨立顯卡等級 0~5 ---------- */
  function gpuTier(text) {
    var t = text.toLowerCase();
    var m = t.match(/rtx\s*(\d{4})/);
    if (m) {
      var n = Number(m[1]);
      if (n >= 4070 || n >= 3070) { return { score: 5, name: 'RTX ' + n }; }
      if (n >= 3060 || n >= 2060) { return { score: 4.2, name: 'RTX ' + n }; }
      return { score: 3.8, name: 'RTX ' + n };
    }
    var g = t.match(/gtx\s*(\d{3,4})/);
    if (g) {
      var gn = Number(g[1]);
      if (gn >= 1660) { return { score: 3.6, name: 'GTX ' + gn }; }
      if (gn >= 1050) { return { score: 2.8, name: 'GTX ' + gn }; }
      return { score: 2, name: 'GTX ' + gn };
    }
    if (/radeon\s*rx|arc\s*a\d/.test(t)) { return { score: 3.2, name: '獨立顯卡' }; }
    return { score: 0, name: '' };
  }

  function clamp(n) { return Math.max(1, Math.min(5, Math.round(n))); }

  /* ---------- 電腦類（筆電／桌機）的評分 ----------
     分數的意思：5 非常順　4 很夠用　3 可以但不算快　2 勉強　1 不建議
     刻意抓得保守一點：寧可客人收到覺得比預期好，也不要寫得太美。 */
  function scoreComputer(p) {
    var text = textOf(p);
    var cpu = cpuTier(text);
    var ram = ramGB(p, text);
    var disk = diskKind(p, text);
    var gpu = gpuTier(text);

    var isSSD = disk === 'ssd';
    var isHDD = disk === 'hdd';
    // 記憶體對不同用途的影響幅度不同，各自給一組級距
    var ramMulti = ram >= 32 ? 4.2 : (ram >= 16 ? 3.4 : (ram >= 8 ? 1.8 : 0.5));
    var ramCreate = ram >= 32 ? 1.8 : (ram >= 16 ? 1.2 : (ram >= 8 ? 0.3 : -0.5));
    var ram8 = ram >= 8;

    var raw = {
      // 文書：門檻低，但硬碟是不是 SSD 影響開機與開檔速度最明顯
      office: 2.0 + cpu.score * 0.55 + (isSSD ? 0.8 : (isHDD ? -1.0 : 0)) + (ram8 ? 0.4 : -1.0),
      // 追劇：幾乎所有機器都放得動，差別在操作順不順
      web: 2.4 + cpu.score * 0.45 + (isSSD ? 0.6 : (isHDD ? -0.8 : 0)) + (ram8 ? 0.4 : -0.8),
      // 視訊課：鏡頭與瀏覽器要同時跑，比文書吃效能
      meeting: 1.2 + cpu.score * 0.75 + (isSSD ? 0.4 : (isHDD ? -0.6 : 0)) +
        (ram8 ? 0.5 : -1.2) + (ram >= 16 ? 0.4 : 0),
      // 多工：記憶體決定一切，硬碟慢的話切換也會卡
      multi: 0.2 + ramMulti + cpu.score * 0.45 + (isSSD ? 0.5 : (isHDD ? -1.2 : 0)),
      // 修圖剪片：CPU 與記憶體為主，有獨立顯卡才會真的快
      creative: cpu.score * 0.65 + ramCreate + gpu.score * 0.3 +
        (isSSD ? 0.3 : (isHDD ? -0.8 : 0)),
      // 遊戲：沒有獨立顯卡就跑不動 3D 遊戲，內顯較新的可以玩輕度遊戲
      game: gpu.score > 0
        ? (gpu.score * 0.9 + cpu.score * 0.2)
        : (cpu.score >= 3.3 ? 2 : 1)
    };

    // 只有 8GB 記憶體時，多工最多只能給 4（再快的 CPU 也擋不住記憶體不夠）
    if (ram && ram <= 8 && raw.multi > 4) { raw.multi = 4; }
    // 沒有獨立顯卡又不是 Apple M 系列時，剪片最多給 3
    if (gpu.score === 0 && cpu.score < 4.5 && raw.creative > 3) { raw.creative = 3; }

    var basis = [];
    if (cpu.name) { basis.push(cpu.name); }
    if (ram) { basis.push(ram + 'GB 記憶體'); }
    if (isSSD) { basis.push('SSD'); }
    if (isHDD) { basis.push('傳統硬碟'); }
    if (gpu.name) { basis.push(gpu.name); }
    return { raw: raw, basis: basis.join('・') };
  }

  /* ---------- 電視與螢幕：換成看得懂的觀看建議 ---------- */
  function screenAdvice(p) {
    var text = textOf(p);
    var inch = 0;
    var m = (specValue(p, '尺寸') || text).match(/(\d{2})\s*(?:吋|inch)/i);
    if (m) { inch = Number(m[1]); }
    var is4k = /4k|3840|2160/i.test(text);
    var hz = 0;
    var h = text.match(/(\d{2,3})\s*hz/i);
    if (h) { hz = Number(h[1]); }

    var lines = [];
    var isMonitor = p.svgKind === 'monitor';

    if (isMonitor) {
      // 桌上型螢幕是坐在桌前看的，不適用電視的觀看距離公式
      if (inch) {
        lines.push({
          label: '螢幕大小',
          value: inch + ' 吋',
          note: inch >= 27 ? '桌面夠大的話很好用，看試算表、剪片都舒服'
            : (inch >= 24 ? '最常見的尺寸，文書與追劇都適合' : '適合空間有限的桌面')
        });
      }
      if (hz >= 120) {
        lines.push({ label: '更新率', value: hz + 'Hz', note: '畫面流暢，打遊戲會有明顯差別' });
      } else if (hz) {
        lines.push({ label: '更新率', value: hz + 'Hz', note: '文書、上網與追劇完全足夠' });
      }
      if (is4k) {
        lines.push({ label: '畫質', value: '4K 高解析度', note: '字很細緻，適合修圖或大量文件' });
      }
      return lines;
    }

    if (inch) {
      // 4K 可以坐比較近；FHD 需要坐遠一點才不會看到顆粒
      var low = Math.round(inch * (is4k ? 1.5 : 2.5) * 2.54 / 100 * 10) / 10;
      var high = Math.round(inch * (is4k ? 2.5 : 3.5) * 2.54 / 100 * 10) / 10;
      lines.push({
        label: '建議觀看距離',
        value: low + '～' + high + ' 公尺',
        note: inch >= 50 ? '適合客廳' : (inch >= 40 ? '適合套房或小客廳' : '適合書房、臥室')
      });
    }
    if (is4k) {
      lines.push({ label: '畫質', value: '4K 高解析度', note: '看字清楚，靠近看也不會有顆粒感' });
    }
    if (hz >= 120) {
      lines.push({ label: '更新率', value: hz + 'Hz', note: '畫面流暢，打遊戲會有明顯差別' });
    } else if (hz) {
      lines.push({ label: '更新率', value: hz + 'Hz', note: '文書與追劇足夠' });
    }
    return lines;
  }

  /**
   * 取得商品的「適合做什麼」評估
   * @param {object} p 商品物件
   * @returns {object} { kind, uses, verdict, good, basis, notes }
   */
  window.getFitness = function (p) {
    if (!p) { return { kind: 'none' }; }

    if (p.category === 'tv') {
      var advice = screenAdvice(p);
      return advice.length
        ? { kind: 'screen', notes: advice }
        : { kind: 'none' };
    }
    if (p.category !== 'laptop' && p.category !== 'desktop') {
      return { kind: 'none' };
    }

    var result = scoreComputer(p);
    var override = p.fit || {};
    var uses = USES.map(function (u) {
      var score = override[u.key] != null ? Number(override[u.key]) : clamp(result.raw[u.key]);
      return {
        key: u.key,
        short: u.short,
        label: u.label,
        hint: u.hint,
        score: Math.max(1, Math.min(5, Math.round(score)))
      };
    });

    var good = uses.filter(function (u) { return u.score >= 4; });
    var weak = uses.filter(function (u) { return u.score <= 2; });

    var verdict;
    if (good.length) {
      verdict = '適合' + good.map(function (u) { return u.label; }).join('、');
      verdict += weak.length
        ? '；' + weak.map(function (u) { return u.label; }).join('、') + '會比較吃力。'
        : '，日常使用都很夠。';
    } else {
      verdict = '基本的上網與文書可以應付，比較吃效能的工作會辛苦一點。';
    }

    return {
      kind: 'computer',
      uses: uses,
      good: good,
      verdict: verdict,
      basis: result.basis
    };
  };

  // 讓其他程式也能取得用途清單（商品列表的篩選會用到）
  window.FIT_USES = USES;
})();
