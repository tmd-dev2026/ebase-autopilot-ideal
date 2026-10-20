(function (root) {
  'use strict';
  var checks = typeof module !== 'undefined' && module.exports ? require('./checks.js') : root.IdealChecks;
  function tracking(value) {
    var text = String(value || '').trim();
    return { value: text, valid: /^[A-Za-z0-9-]{8,30}$/.test(text),
      reason: !text ? '追跡番号を入力してください' : /^[A-Za-z0-9-]{8,30}$/.test(text) ? '' : '英数字・ハイフンで8〜30文字を入力してください' };
  }
  function balance(order) {
    return checks.takeHome(order.gross, order.actualShipping, order.cost);
  }
  function refundImpact(order, dollars) {
    var before = balance(order);
    if (!before || !Number.isFinite(dollars) || dollars <= 0 || dollars > order.gross) return null;
    var yen = dollars * 155, remaining = before.yen - yen;
    return { yen: yen, usd: dollars, remaining: remaining, remainingUsd: remaining / 155, loss: remaining < 0 };
  }
  function offer(row, discount) {
    if (!Number.isFinite(discount) || discount < 1 || discount > 50) return null;
    var gross = Math.round(row.gross * (1 - discount / 100) * 100) / 100;
    return { gross: gross, takeHome: checks.takeHome(gross, row.shipping, row.cost) };
  }
  function effect(row) {
    if (!Number.isFinite(row.before) || !Number.isFinite(row.spend)) return 'データが少ない—';
    if (row.before - row.spend < 0) return '赤字になっている';
    return row.sales > 0 && row.spend > 0 ? '効いている' : 'データが少ない—';
  }
  function reports(orders, listings) {
    // Fixed example week; repeatable offline and independent of the system clock.
    var sold = orders.filter(function (o) { return o.date >= '2026-10-19' && o.date <= '2026-10-25'; });
    var completed = sold.filter(function (o) { return o.state === '完了' && balance(o); });
    function net(o) { return balance(o).yen - (o.refund || 0) * 155; }
    var confirmed = completed.reduce(function (sum, o) { return sum + net(o); }, 0);
    var active = listings.filter(function (r) { return r.state === '出品中'; });
    var estimates = active.map(function (r) { return checks.takeHome(r.gross, r.shipping, r.cost); });
    var estimate = estimates.some(function (v) { return !v; }) ? null : estimates.reduce(function (sum, v) { return sum + v.yen * 0.25; }, 0);
    var gaps = sold.map(function (o) { return { id: o.id, estimate: o.shipping, actual: o.actualShipping, gap: o.actualShipping === null ? null : o.actualShipping - o.shipping }; });
    var days = ['19', '20', '21', '22', '23', '24', '25'].map(function (day) {
      var date = '2026-10-' + day;
      var daily = completed.filter(function (o) { return o.date === date; });
      return { date: date, count: daily.length, yen: daily.length ? daily.reduce(function (sum, o) { return sum + net(o); }, 0) : null };
    });
    return { confirmed: confirmed, estimate: estimate, completed: completed, activeCount: active.length,
      gaps: gaps, gap: gaps.reduce(function (sum, g) { return sum + (g.gap === null ? 0 : g.gap); }, 0), days: days };
  }
  var api = { tracking: tracking, balance: balance, refundImpact: refundImpact, offer: offer,
    takeHome: checks.takeHome, lowConfidence: function (n) { return !Number.isFinite(n) || n < 70; }, effect: effect, reports: reports };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IdealAftersale = api;
})(typeof window === 'undefined' ? globalThis : window);
