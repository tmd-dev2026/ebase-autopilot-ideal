(function (root) {
  'use strict';
  var node = typeof module !== 'undefined' && module.exports;
  var V = node ? require('./checks.js') : root.IdealChecks;
  var A = node ? require('./criteria.js') : root.IdealCriteria;
  function costs(row) {
    var shipping = row.domestic + row.international + row.duty;
    var total = V.takeHome(row.gross, shipping, row.cost);
    return { shipping: shipping, fee: row.gross * 155 - shipping - row.cost - (total ? total.yen : NaN), takeHome: total,
      margin: A.margin({ gross: row.gross, shipping: shipping, cost: row.cost }) };
  }
  function gate(data, row, mode, reason) {
    var c = costs(row);
    if (!c.takeHome) return { blocked: true, reason: '— 計算できません。費用を確認してください。' };
    if (A.avoided(row, data.settings.avoid)) return { blocked: true, reason: '判断軸で避ける設定です。判断軸を見直してください。' };
    if (c.takeHome.yen < 0) return { blocked: true, reason: '⚠ 赤字のため取り込めません。費用を見直してください。' };
    var floor = c.margin < data.settings.marginFloor;
    return { blocked: floor && !(mode === '上級' && String(reason || '').trim().length >= 3), override: floor,
      reason: floor ? '利益率の下限未満。価格・費用または判断軸を確認してください。' : '' };
  }
  function add(data, id) {
    if (data.candidates.some(function (c) { return c.id === id; })) return false;
    data.candidates.push({ id: id, state: data.drafts.some(function (d) { return d.sourceId === id; }) ? '取り込み済み' : '検討中' }); return true;
  }
  function remove(data, id) {
    var index = data.candidates.findIndex(function (c) { return c.id === id; });
    if (index < 0) return null;
    var item = data.candidates.splice(index, 1)[0];
    return function () { if (!data.candidates.some(function (c) { return c.id === id; })) data.candidates.splice(index, 0, item); };
  }
  function imported(data, row) { return data.drafts.find(function (d) { return d.sourceId === row.id; }); }
  function importRow(data, row, mode, reason) {
    if (imported(data, row)) return { status: '重複', reason: 'すでに取り込み済み', draft: imported(data, row) };
    var check = gate(data, row, mode, reason);
    if (check.blocked) return { status: '失敗', reason: check.reason };
    var p = data.products.find(function (p) { return p.id === row.product; }) || row;
    var draft = { id: 'source-' + row.id, sourceId: row.id, product: row.product || row.id, sourceProduct: p,
      title: p.ai ? p.ai.titleEn : row.name, description: p.ai ? p.ai.descriptionEn.join('\n') : '',
      specifics: p.ai ? Object.fromEntries(p.ai.specifics) : {}, required: ['Brand', 'Type'],
      category: row.category, confidence: p.ai ? 92 : 0, candidates: [row.category],
      photos: (p.images || []).slice(), risks: row.risks.slice(), gross: row.gross,
      shipping: costs(row).shipping, cost: row.cost, condition: row.condition, brand: row.brand };
    data.drafts.push(draft);
    var candidate = data.candidates.find(function (c) { return c.id === row.id; });
    if (candidate) candidate.state = '取り込み済み';
    if (check.override) data.decisions.push({ date: new Date().toISOString(), who: 'あなた', what: row.name + '：利益率の下限未満で取り込み', reason: reason.trim() });
    data.steps[4][1] = true;
    return { status: '完了', reason: '作る で内容を確認してください', draft: draft };
  }
  function resolve(data, url) {
    var normalized = String(url).trim().replace(/^[a-z]+:\/\//i, '').replace(/\/$/, '');
    var row = data.research.find(function (r) { return r.url === normalized; });
    if (row) return { row: row };
    return { status: '失敗', reason: /^(こもれび市場|ふるいち)\.example\//.test(normalized) ? 'ページが見つからない。商品URLを確認してください。' : '対応していないサイト。対応サイト(例)のURLを使ってください。' };
  }
  var api = { costs: costs, gate: gate, add: add, remove: remove, imported: imported, importRow: importRow, resolve: resolve };
  if (node) module.exports = api; else root.IdealSourcing = api;
})(typeof window === 'undefined' ? globalThis : window);
