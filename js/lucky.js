/* =====================================================================
   lucky.js ─ 每日抽獎與折價券
   ---------------------------------------------------------------------
   規則都寫在 js/config.js 的 lottery 區塊，這裡只負責執行：

     ・每天可以抽一次（以裝置上的日期判斷，過午夜就可以再抽）
     ・同時只會有一張折價券
     ・抽到比手上這張小的，保留原本那張；抽到一樣大的，效期重新計算
     ・抽到比手上這張大的，換成新的那張（舊的立刻作廢）
     ・每張券有有效天數，過期自動消失

   所有資料只存在這台裝置的 localStorage，不會送到任何伺服器。
   這也表示：換手機、換瀏覽器、清除瀏覽資料，紀錄就會不見。
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'kun3c_lucky';
  var memoryStore = {};

  /* ---------------- 儲存（和 app.js 一樣有記憶體備援） ---------------- */
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

  /* ---------------- 設定 ---------------- */
  function cfg() {
    return (window.SITE_CONFIG && window.SITE_CONFIG.lottery) || {};
  }

  // 活動有沒有開；設定檔把 enabled 改成 false，全站的抽獎入口都會消失
  function enabled() {
    return cfg().enabled === true && prizeList().length > 0;
  }

  // 獎項清單（過濾掉寫壞的資料，權重不必剛好加到 10000）
  function prizeList() {
    var raw = cfg().prizes;
    if (!raw || Object.prototype.toString.call(raw) !== '[object Array]' || !raw.length) {
      return [];
    }
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var amount = Number(raw[i] && raw[i].amount) || 0;
      var weight = Number(raw[i] && raw[i].weight) || 0;
      if (weight > 0) { out.push({ amount: amount, weight: weight }); }
    }
    return out;
  }

  function couponDays() {
    return Number(cfg().couponDays) || 7;
  }

  // 這張券的最低消費金額（＝面額 × 設定的倍數）
  function minSpendFor(amount) {
    var mult = Number(cfg().minMultiple) || 0;
    return amount * mult;
  }

  /* ---------------- 日期工具（一律用裝置的當地日期） ---------------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function dayKey(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function addDays(d, n) {
    var out = new Date(d.getTime());
    out.setDate(out.getDate() + n);
    return out;
  }

  // 兩個 YYYY-MM-DD 相差幾天（b - a）
  function daysBetween(a, b) {
    var x = new Date(a + 'T00:00:00');
    var y = new Date(b + 'T00:00:00');
    return Math.round((y.getTime() - x.getTime()) / 86400000);
  }

  /* ---------------- 狀態讀寫 ---------------- */
  function emptyState() {
    return { phone: '', lastDraw: '', draws: 0, best: 0, coupon: null };
  }

  function read() {
    var raw = storeGet(KEY);
    var st = null;
    if (raw) {
      try { st = JSON.parse(raw); } catch (e) { st = null; }
    }
    if (!st || typeof st !== 'object') { st = emptyState(); }
    if (typeof st.phone !== 'string') { st.phone = ''; }
    if (typeof st.lastDraw !== 'string') { st.lastDraw = ''; }
    st.draws = Number(st.draws) || 0;
    st.best = Number(st.best) || 0;
    // 過期的券直接丟掉，不要留在資料裡混淆
    if (st.coupon && !couponAlive(st.coupon)) { st.coupon = null; }
    return st;
  }

  function write(st) {
    storeSet(KEY, JSON.stringify(st));
  }

  // 券還活著嗎（有面額，而且今天還沒超過到期日）
  function couponAlive(c) {
    if (!c || !(Number(c.amount) > 0) || !c.expiresAt) { return false; }
    return daysBetween(dayKey(new Date()), c.expiresAt) >= 0;
  }

  /* ---------------- 券碼 ---------------- */
  // 格式：K3C-面額-手機末3碼-到期日MMDD-4碼亂數
  // 例：K3C-300-275-1124-8F2A
  // 這組碼是給老闆核對用的，不是密碼：真正的把關是出示畫面與手機號碼要對得上。
  function makeCode(amount, phone, expiresAt) {
    var tail = String(phone || '').replace(/\D/g, '').slice(-3) || '000';
    var mmdd = expiresAt.slice(5).replace('-', '');
    var chars = 'ACDEFGHJKLMNPQRTUVWXY34679';
    var rnd = '';
    for (var i = 0; i < 4; i++) {
      rnd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'K3C-' + amount + '-' + tail + '-' + mmdd + '-' + rnd;
  }

  function makeCoupon(amount, phone) {
    var today = new Date();
    var expires = dayKey(addDays(today, couponDays() - 1));
    return {
      amount: amount,
      min: minSpendFor(amount),
      issuedAt: dayKey(today),
      expiresAt: expires,
      code: makeCode(amount, phone, expires)
    };
  }

  /* ---------------- 對外 API ---------------- */
  window.Lucky = {

    enabled: enabled,

    // 公開的機率表：給抽獎頁與購物須知頁顯示，數字只有一個來源
    prizeTable: function () {
      var list = prizeList();
      var total = 0;
      var i;
      for (i = 0; i < list.length; i++) { total += list[i].weight; }
      var out = [];
      for (i = 0; i < list.length; i++) {
        out.push({
          amount: list[i].amount,
          min: minSpendFor(list[i].amount),
          percent: total > 0 ? (list[i].weight / total) * 100 : 0
        });
      }
      return out;
    },

    couponDays: couponDays,
    minSpendFor: minSpendFor,

    // 目前的狀態（複製一份出去，外面改不到裡面）
    state: function () {
      var st = read();
      return {
        phone: st.phone,
        joined: !!st.phone,
        draws: st.draws,
        best: st.best,
        lastDraw: st.lastDraw,
        coupon: st.coupon ? JSON.parse(JSON.stringify(st.coupon)) : null
      };
    },

    // 用手機號碼當會員編號；換一組號碼等於換一個人，紀錄會重來
    join: function (phone) {
      var digits = String(phone || '').replace(/\D/g, '');
      if (!/^09\d{8}$/.test(digits)) {
        return { ok: false, message: '請填 09 開頭的 10 碼手機號碼。' };
      }
      var st = read();
      if (st.phone && st.phone !== digits) { st = emptyState(); }
      st.phone = digits;
      write(st);
      return { ok: true };
    },

    leave: function () {
      write(emptyState());
    },

    // 今天還能不能抽
    canDraw: function () {
      var st = read();
      if (!enabled()) { return { ok: false, reason: 'off' }; }
      if (!st.phone) { return { ok: false, reason: 'guest' }; }
      if (st.lastDraw === dayKey(new Date())) { return { ok: false, reason: 'done' }; }
      return { ok: true };
    },

    /**
     * 抽一次
     * @returns {object} { ok, amount, coupon, outcome, reason }
     *   outcome：'none' 沒中｜'new' 拿到第一張｜'upgrade' 換成更大的
     *            'renew' 同面額、效期重算｜'keep' 抽到比較小的，留原本那張
     */
    draw: function () {
      var gate = this.canDraw();
      if (!gate.ok) { return { ok: false, reason: gate.reason }; }

      var st = read();
      var list = prizeList();
      var total = 0;
      var i;
      for (i = 0; i < list.length; i++) { total += list[i].weight; }

      var roll = Math.random() * total;
      var amount = 0;
      for (i = 0; i < list.length; i++) {
        roll -= list[i].weight;
        if (roll < 0) { amount = list[i].amount; break; }
      }

      st.lastDraw = dayKey(new Date());
      st.draws += 1;
      if (amount > st.best) { st.best = amount; }

      var had = st.coupon && couponAlive(st.coupon) ? st.coupon : null;
      var outcome;

      if (amount <= 0) {
        outcome = 'none';
      } else if (!had) {
        st.coupon = makeCoupon(amount, st.phone);
        outcome = 'new';
      } else if (amount > had.amount) {
        st.coupon = makeCoupon(amount, st.phone);
        outcome = 'upgrade';
      } else if (amount === had.amount) {
        st.coupon = makeCoupon(amount, st.phone);
        outcome = 'renew';
      } else {
        outcome = 'keep';
      }

      write(st);
      return {
        ok: true,
        amount: amount,
        outcome: outcome,
        previous: had ? had.amount : 0,
        coupon: st.coupon ? JSON.parse(JSON.stringify(st.coupon)) : null
      };
    },

    // 手上這張券（沒有或已過期時回傳 null）
    coupon: function () {
      var st = read();
      return st.coupon ? JSON.parse(JSON.stringify(st.coupon)) : null;
    },

    // 這張券還剩幾天（今天到期回傳 0）
    daysLeft: function (c) {
      if (!c || !c.expiresAt) { return 0; }
      return Math.max(0, daysBetween(dayKey(new Date()), c.expiresAt));
    },

    /**
     * 這筆金額可以折多少
     * @param {number} subtotal 商品總額（不含運費）
     * @returns {object} { has, usable, amount, min, gap, coupon }
     */
    applyTo: function (subtotal) {
      var c = this.coupon();
      var sum = Number(subtotal) || 0;
      if (!enabled() || !c) {
        return { has: false, usable: false, amount: 0, min: 0, gap: 0, coupon: null };
      }
      var min = Number(c.min) || 0;
      var usable = sum >= min;
      return {
        has: true,
        usable: usable,
        amount: usable ? Math.min(c.amount, sum) : 0,
        min: min,
        gap: usable ? 0 : min - sum,
        coupon: c
      };
    },

    // 下單成功後把券收走（一張券只能用一次）
    spend: function () {
      var st = read();
      st.coupon = null;
      write(st);
    }
  };
})();
