(function (root) {
  'use strict';
  var checks = typeof module !== 'undefined' && module.exports ? require('./checks.js') : root.IdealChecks;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function margin(row) {
    var value = checks.takeHome(row.gross, row.shipping, row.cost);
    return value ? value.yen / (row.gross * 155) * 100 : null;
  }
  function avoided(row, list) {
    return checks.evaluate(row, { avoid: list }).avoided;
  }
  function preview(data, key, value) {
    var before = data.settings[key], drafts = data.drafts.filter(function (r) { return !r.published; });
    function affected(row, isDraft) {
      var oldRules = checks.evaluate(row, data.settings), next = Object.assign({}, data.settings); next[key] = value;
      return JSON.stringify(oldRules) !== JSON.stringify(checks.evaluate(row, next)) || (['shipping', 'returns', 'payment'].includes(key) && isDraft && before !== value);
    }
    if (key === 'tone') { var conversations = (before === value ? [] : data.conversations || []).filter(function (r) { return !r.replied || r.unread; }); return { count: before === value ? 0 : conversations.length, ids: conversations.map(function (r) { return r.id; }), names: conversations.map(function (r) { return r.buyerName; }), text: '返信案 ' + conversations.length + ' 件が変わります（例）' }; }
    var changedListings = data.listings.filter(function (r) { return affected(r, false); });
    var changedDrafts = drafts.filter(function (r) { return affected(r, true); });
    var changedResearch = (data.research || []).filter(function (r) { return affected(Object.assign({}, r, { shipping: r.domestic + r.international + r.duty }), false); });
    var rows = changedListings.concat(changedDrafts, changedResearch);
    return { listings: data.listings.length, drafts: drafts.length, count: rows.length, affectedListings: changedListings.length, affectedDrafts: changedDrafts.length, affectedResearch: changedResearch.length,
      ids: rows.map(function (r) { return r.id; }), names: rows.map(function (r) { return r.name || r.title; }),
      text: rows.length ? '出品 ' + changedListings.length + ' 件・下書き ' + changedDrafts.length + ' 件が変わります（出品' + data.listings.length + '件・下書き' + drafts.length + '件のうち・例）' + (changedResearch.length ? '・リサーチ ' + changedResearch.length + ' 件' : '') : '影響なし' };
  }
  var labels = { marginFloor: '利益率の下限（売値に対する手残りの割合 %）', discountLimit: '最大値下げ率 %', avoid: '避ける商品', tone: '返信のトーン', duties: '関税の既定', shipping: '配送ポリシー', returns: '返品ポリシー', payment: '支払いポリシー' };
  function describe(value) { return Array.isArray(value) ? value.map(function (r) { return ({ brand: 'ブランド', category: 'カテゴリ', condition: '状態' })[r.type] + '：' + r.value; }).join('・') || '指定なし' : String(value === '' ? '未設定' : value); }
  function save(data, key, value, reason, meta) {
    if (!Object.prototype.hasOwnProperty.call(data.settings, key) || String(reason || '').trim().length < 3) return null;
    if (['marginFloor', 'discountLimit'].includes(key) && (!Number.isFinite(value) || value < 0 || value > 100)) return null;
    if (JSON.stringify(data.settings[key]) === JSON.stringify(value)) return null;
    meta = meta || {};
    var impact = preview(data, key, value);
    var decision = { id: 'decision-' + (data.decisions.length + 1), source: meta.source || '判断軸', mode: meta.mode || (root.IdealCore ? root.IdealCore.mode : 'ふだん'), impact: clone(impact), tags: meta.tags || ['その他'], reviewDate: meta.reviewDate || '', version: 'モデル・判断軸 v10（試作の例）', date: new Date().toISOString(), who: 'あなた', key: key,
      from: clone(data.settings[key]), to: clone(value), reason: reason.trim() };
    decision.what = labels[key] + '：' + describe(decision.from) + ' → ' + describe(decision.to);
    decision.fromLabel = describe(decision.from); decision.toLabel = describe(decision.to);
    data.settings[key] = clone(value);
    data.decisions.push(decision);
    if (key === 'tone' && data.refreshReplyTone) data.refreshReplyTone();
    if (data.persist) data.persist();
    var undone = false;
    return function () {
      if (undone || JSON.stringify(data.settings[key]) !== JSON.stringify(decision.to) || data.decisions.some(function (d) { return d.key === key && d !== decision && d.date >= decision.date && data.decisions.indexOf(d) > data.decisions.indexOf(decision); })) { data.lastError = '後の操作があるため元に戻せません'; return false; }
      data.settings[key] = clone(decision.from);
      undone = true;
      data.decisions.push(Object.assign({}, decision, { id: 'decision-' + (data.decisions.length + 1), date: new Date().toISOString(), what: '取り消し：' + decision.what, undoOf: decision.id, from: clone(decision.to), to: clone(decision.from), fromLabel: decision.toLabel, toLabel: decision.fromLabel, reason: '直前の判断を取り消し' }));
      if (key === 'tone' && data.refreshReplyTone) data.refreshReplyTone();
      if (data.persist) data.persist();
      return true;
    };
  }
  function flagged(data) {
    return data.listings.filter(function (row) {
      return checks.evaluate(row, data.settings).warnings.length > 0;
    });
  }
  var api = { margin: margin, avoided: avoided, preview: preview, save: save, flagged: flagged };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IdealCriteria = api;
})(typeof window === 'undefined' ? globalThis : window);
