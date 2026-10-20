(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealAftersale, U = window.IdealAfterUI;
  var toggled = {};
  var impact = '止めると表示が減る可能性があります・いつでも再開できます';
  function render() {
    return U.start('ads', '広告費を引いた手残りを確認してください。') + '<section class="card after-screen ' + (C.mode === '上級' ? 'after-dense' : '') + '">' +
      U.heading('広告の効果', '広告費を引く前と後を比べ、続けるか判断します。') +
      '<p>広告への売上の帰属データ ' + window.IdealMarks.chip('現行') + ' → 手残りで判断 ' + window.IdealMarks.chip('改') + '。数値はすべて例です。売上への効果は保証できません。</p>' +
      '<table class="after-table"><caption>広告一覧（例）</caption><thead><tr><th>商品</th><th>広告率・費用</th><th>広告経由売上</th><th>手残り（広告前 → 広告後）</th><th>効果の判定・稼働</th></tr></thead><tbody>' + D.ads.map(function (r, i) {
        return '<tr' + (C.mode === 'はじめて' && i === 0 ? ' class="next-step"' : '') + '><td>' + U.product(r) + '</td><td>' + r.rate + '%（例） · ' + C.money(r.spend) + '</td><td>' + C.money(r.sales * 155) + '</td><td>' + U.profit(r.before) + ' → ' + U.profit(r.before === null ? null : r.before - r.spend) + '</td><td><div class="ad-controls"><span class="badge-status" data-status="' + (A.effect(r) === '効いている' ? 'active' : A.effect(r) === '赤字になっている' ? 'error' : 'draft') + '">' + A.effect(r) + '</span><button class="switch" role="switch" aria-checked="' + r.on + '" aria-label="' + C.escape(D.products.find(function (p) { return p.id === r.product; }).name) + 'の広告" data-ad="' + r.id + '"><span class="switch-track" aria-hidden="true"></span>' + (r.on ? 'ON・稼働中' : 'OFF・停止中') + '</button></div><p class="ad-impact' + (toggled[r.id] ? ' is-visible' : '') + '">' + impact + '</p>' + '</td></tr>';
      }).join('') + '</tbody></table></section>' + U.end('ads');
  }
  function bind(main) {
    main.onclick = function (event) {
      var b = event.target.closest('[data-ad]');
      if (!b) return;
      var row = D.ads.find(function (r) { return r.id === b.dataset.ad; });
      if (!row) return;
      var before = row.on;
      row.on = !row.on;
      toggled[row.id] = true;
      window.IdealShell.toastUndo((row.on ? '広告を再開しました' : '広告を停止しました。' + impact) + '（試作）', function () { row.on = before; });
      window.IdealShell.render();
    };
  }
  window.IdealScreens.ads = { render: render, bind: bind };
})();
