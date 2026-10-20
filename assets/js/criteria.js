(function (root) {
  'use strict';
  var checks = typeof module !== 'undefined' && module.exports ? require('./checks.js') : root.IdealChecks;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function margin(row) {
    var value = checks.takeHome(row.gross, row.shipping, row.cost);
    return value ? value.yen / (row.gross * 155) * 100 : null;
  }
  function avoided(row, list) {
    return (list || []).some(function (rule) {
      var value = rule.type === 'brand' ? (row.specifics || {}).Brand || row.brand : row[rule.type];
      return String(value || '').toLowerCase().includes(rule.value.toLowerCase());
    });
  }
  function preview(data, key, value) {
    var before = data.settings[key], drafts = data.drafts.filter(function (r) { return !r.published; });
    function affected(row, isDraft) {
      if (JSON.stringify(before) === JSON.stringify(value)) return false;
      if (key === 'marginFloor') return margin(row) !== null && margin(row) < value && margin(row) >= before;
      if (key === 'discountLimit') return value < before && Number.isFinite(row.originalGross) && (1 - row.gross / row.originalGross) * 100 > value;
      if (key === 'avoid') return avoided(row, value) !== avoided(row, before);
      if (['duties', 'shipping', 'returns', 'payment', 'tone'].includes(key)) return isDraft;
      return false;
    }
    var changedListings = data.listings.filter(function (r) { return affected(r, false); });
    var changedDrafts = drafts.filter(function (r) { return affected(r, true); });
    var rows = changedListings.concat(changedDrafts);
    return { listings: data.listings.length, drafts: drafts.length, count: rows.length, affectedListings: changedListings.length, affectedDrafts: changedDrafts.length,
      ids: rows.map(function (r) { return r.id; }), names: rows.map(function (r) { return r.name || r.title; }),
      text: rows.length ? '出品 ' + changedListings.length + ' 件・下書き ' + changedDrafts.length + ' 件が変わります（出品' + data.listings.length + '件・下書き' + drafts.length + '件のうち・例）' : '影響なし' };
  }
  function save(data, key, value, reason) {
    if (!Object.prototype.hasOwnProperty.call(data.settings, key) || String(reason || '').trim().length < 3) return null;
    if (['marginFloor', 'discountLimit'].includes(key) && (!Number.isFinite(value) || value < 0 || value > 100)) return null;
    if (JSON.stringify(data.settings[key]) === JSON.stringify(value)) return null;
    var decision = { date: new Date().toISOString(), who: 'あなた', key: key,
      from: clone(data.settings[key]), to: clone(value), reason: reason.trim() };
    decision.what = key + '：' + JSON.stringify(decision.from) + ' → ' + JSON.stringify(decision.to);
    data.settings[key] = clone(value);
    data.decisions.push(decision);
    return function () {
      if (data.decisions[data.decisions.length - 1] !== decision) return false;
      data.settings[key] = clone(decision.from);
      data.decisions.pop();
      return true;
    };
  }
  function flagged(data) {
    return data.listings.filter(function (row) {
      return (margin(row) !== null && margin(row) < data.settings.marginFloor) || avoided(row, data.settings.avoid);
    });
  }
  var api = { margin: margin, avoided: avoided, preview: preview, save: save, flagged: flagged };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IdealCriteria = api;
})(typeof window === 'undefined' ? globalThis : window);
