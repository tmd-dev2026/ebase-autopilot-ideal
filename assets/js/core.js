(function () {
  'use strict';
  var modes = ['はじめて', 'ふだん', '上級'], themes = ['auto', 'light', 'dark'];
  function read(key, fallback, allowed) { try { var value = window.localStorage.getItem(key); return allowed.includes(value) ? value : fallback; } catch (_) { return fallback; } }
  function save(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
  window.IdealScreens = {};
  window.IdealCore = {
    pageHeader: function (title) {
      return '<div class="page-header"><h1>' + this.escape(title) + '</h1><button class="legend-link" data-action="legend">印とは</button></div>' + (!this.legendDismissed ? '<p class="legend-hint">◆改 ✦新 ◇将来 は試作の印です <button data-action="dismiss-legend">閉じる</button></p>' : '');
    },
    modes: modes, themes: themes,
    mode: read('ideal-mode', 'ふだん', modes), theme: read('ideal-theme', 'auto', themes),
    setMode: function (value) { if (modes.includes(value)) { this.mode = value; save('ideal-mode', value); } },
    setTheme: function (value) { if (themes.includes(value)) { this.theme = value; save('ideal-theme', value); } },
    escape: function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    money: function (yen) { return yen == null || !Number.isFinite(yen) ? '—' : (yen < 0 ? '-' : '') + '¥' + Math.round(Math.abs(yen)).toLocaleString('ja-JP') + ' / ' + (yen < 0 ? '-' : '') + '$' + (Math.abs(yen) / 155).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '（例）'; },
    takeHome: function (gross, shipping, cost) { var result = window.IdealChecks.takeHome(gross, shipping, cost); return result ? result.yen : null; }
  };
})();
