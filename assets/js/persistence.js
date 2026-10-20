(function () {
  'use strict';
  var D = window.IdealData, C = window.IdealCore;
  var defaults = JSON.parse(JSON.stringify({ settings: D.settings, automations: D.automations }));
  D.savedFilters = null;
  D.refreshReplyTone = function () {
    D.conversations.forEach(function (r) {
      if (!r.baseDraft) r.baseDraft = r.draft;
      if (!r.replied && !r.manuallyEdited) r.draft = D.replySamples[D.settings.tone] + '\n' + r.baseDraft;
    });
  };
  D.persist = function () {
    try { window.localStorage.setItem('ideal-state-v10', JSON.stringify({ version: 10, settings: D.settings, decisions: D.decisions, automations: D.automations, savedFilters: D.savedFilters })); D.storageError = ''; }
    catch (_) { D.storageError = '保存できません。このセッション内で保持します。'; }
  };
  var push = Array.prototype.push;
  Object.defineProperty(D.decisions, 'push', { configurable: true, value: function () {
    var entries = Array.prototype.slice.call(arguments);
    entries.forEach(function (d, i) {
      var id = 'decision-' + (D.decisions.length + i + 1);
      Object.assign(d, { id: d.id || id, source: d.source || D.title(D.route(window.location.hash)), mode: d.mode || C.mode, impact: d.impact || { count: 1, names: [d.item || d.what], ids: d.listingId ? [d.listingId] : [] }, tags: d.tags || ['その他'], reviewDate: d.reviewDate || '', fromLabel: d.fromLabel || '未実行', toLabel: d.toLabel || d.what, version: d.version || 'モデル・判断軸 v10（試作の例）' });
    });
    var result = push.apply(this, entries); D.persist(); return result;
  } });
  try {
    var saved = JSON.parse(window.localStorage.getItem('ideal-state-v10') || 'null');
    if (saved && saved.version === 10 && saved.settings) {
      ['marginFloor', 'discountLimit'].forEach(function (k) { if (Number.isFinite(saved.settings[k]) && saved.settings[k] >= 0 && saved.settings[k] <= 100) D.settings[k] = saved.settings[k]; });
      ['tone', 'duties', 'shipping', 'returns', 'payment'].forEach(function (k) { if (typeof saved.settings[k] === 'string') D.settings[k] = saved.settings[k]; });
      if (!D.replySamples[D.settings.tone]) D.settings.tone = defaults.settings.tone;
      if (Array.isArray(saved.settings.avoid) && saved.settings.avoid.every(function (r) { return ['brand', 'category', 'condition'].includes(r.type) && typeof r.value === 'string' && typeof r.reason === 'string'; })) D.settings.avoid = saved.settings.avoid;
      if (Array.isArray(saved.decisions)) push.apply(D.decisions, saved.decisions);
      if (Array.isArray(saved.automations)) D.automations.forEach(function (a) { var r = saved.automations.find(function (r) { return r.id === a.id; }); if (r && typeof r.on === 'boolean') { a.on = r.on; if (Array.isArray(r.history)) a.history = r.history; } });
      if (saved.savedFilters && typeof saved.savedFilters.search === 'string' && typeof saved.savedFilters.filter === 'string' && ['date', 'price', 'name'].includes(saved.savedFilters.sort)) D.savedFilters = saved.savedFilters;
    }
  } catch (_) { D.storageError = '保存データを読み込めません。初期状態で開始しました。'; }
  D.refreshReplyTone();
  D.resetPreferences = function () {
    D.settings = JSON.parse(JSON.stringify(defaults.settings));
    D.automations.forEach(function (a, i) { Object.assign(a, JSON.parse(JSON.stringify(defaults.automations[i]))); });
    D.savedFilters = null;
    D.decisions.push({ date: new Date().toISOString(), who: 'あなた', what: '設定を初期状態に戻す', reason: '初期状態に戻す操作を確認', source: '設定' });
    D.refreshReplyTone(); D.persist();
  };
})();
