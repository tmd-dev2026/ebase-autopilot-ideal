(function () {
  'use strict';
  var modes = ['はじめて', 'ふだん', '上級'], themes = ['auto', 'light', 'dark'];
  function read(key, fallback, allowed) { try { var value = window.localStorage.getItem(key); return allowed.includes(value) ? value : fallback; } catch (_) { return fallback; } }
  function save(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
  window.IdealCore = {
    modes: modes, themes: themes,
    mode: read('ideal-mode', 'ふだん', modes), theme: read('ideal-theme', 'auto', themes),
    setMode: function (value) { if (modes.includes(value)) { this.mode = value; save('ideal-mode', value); } },
    setTheme: function (value) { if (themes.includes(value)) { this.theme = value; save('ideal-theme', value); } },
    escape: function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    money: function (yen) { return yen == null || !Number.isFinite(yen) ? '—' : '¥' + Math.round(yen).toLocaleString('ja-JP') + ' / $' + (yen / 155).toFixed(2) + '（例）'; },
    takeHome: function (gross, shipping, cost) { return [gross, shipping, cost].every(Number.isFinite) ? (gross - (gross * (0.1325 + 0.0135) + 0.40)) * 155 - shipping - cost : null; }
  };
})();
