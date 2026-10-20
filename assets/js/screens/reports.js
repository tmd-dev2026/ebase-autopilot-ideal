(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealAftersale, U = window.IdealAfterUI, e = C.escape;
  function chart(days) {
    var max = Math.max.apply(null, days.map(function (d) { return Math.abs(d.yen || 0); }).concat([1]));
    var description = days.map(function (d) {
      return d.date.slice(5) + '：' + (d.yen === null ? '確定注文なし —' : (d.yen < 0 ? '赤字 ' : '') + C.money(d.yen));
    }).join('、');
    return '<svg class="weekly-chart" viewBox="0 0 640 200" role="img" aria-label="' + e('日別の確定手残り（例）。' + description) + '"><path d="M12 95H628" stroke="var(--border)"/>' + days.map(function (d, i) {
      var x = 48 + i * 90, h = Math.abs(d.yen || 0) / max * 62;
      var bar = d.yen === null ? '<path d="M' + (x - 8) + ' 95h16" stroke="var(--muted-foreground)" opacity="0.35"/>' :
        '<rect x="' + (x - 20) + '" y="' + (d.yen >= 0 ? 95 - h : 95) + '" width="40" height="' + Math.max(h, 1) + '" rx="2" fill="var(' + (d.yen < 0 ? '--loss' : '--primary') + ')"/>';
      return bar + '<text x="' + x + '" y="' + (d.yen === null ? 80 : d.yen >= 0 ? 87 - h : 111 + h) + '" text-anchor="middle" font-size="12" fill="var(--foreground)">' +
        (d.yen === null ? '—' : (d.yen < 0 ? '-' : '') + '¥' + Math.round(Math.abs(d.yen)).toLocaleString('ja-JP')) + '</text><text x="' + x + '" y="192" text-anchor="middle" font-size="12" fill="var(--muted-foreground)">' + d.date.slice(5) + '</text>';
    }).join('') + '</svg>';
  }
  function render() {
    var r = A.reports(D.orders, D.listings);
    var losses = r.completed.filter(function (o) { return A.balance(o).yen - o.refund * 155 < 0; });
    return U.start('reports', '確定の手残りと送料の差額を確認してください。') + '<div class="after-screen ' + (C.mode === '上級' ? 'after-dense' : '') + '">' +
      '<section class="card">' + U.heading('今週の手残り', '販売済みの確定した数字と、まだ売れていない見込みを分けて読みます。', 'numbers') +
      '<p>' + window.IdealHelp.term('見込み/確定') + '</p><p>期間：2026-10-19〜2026-10-25（例）</p><div class="metrics"><div class="metric estimated"><h3>見込み（まだ確定ではありません）</h3><p>' + U.profit(r.estimate) + '</p><p class="muted">出品中 ' + r.activeCount + ' 件 × 各商品の見込み手残り × 今週売れる割合25%（例）。費用は出品管理の設定。売れる保証ではありません。</p></div><div class="metric confirmed"><h3>確定</h3><p>' + U.profit(r.confirmed) + '</p><p>販売済みのうち完了・費用確定の注文 ' + r.completed.length + ' 件（例）。返金済み額を差し引きます。未完了は集計対象外です。</p></div></div></section>' +
      '<section class="card">' + U.heading('確定の注文内訳', 'この表の手残りを合計したものが、上の確定金額です。') +
      '<table class="after-table"><caption>完了した注文（例）</caption><thead><tr><th>商品</th><th>売値</th><th>手数料</th><th>実送料・仕入れ値</th><th>返金・確定手残り</th></tr></thead><tbody>' + r.completed.map(function (o) {
        return '<tr><td data-label="商品">' + U.product(o) + '</td><td data-label="売値">' + C.money(o.gross * 155) + '</td><td data-label="手数料">' + C.money((o.gross * 0.146 + 0.4) * 155) + '</td><td data-label="実送料・仕入れ値">' + C.money(o.actualShipping) + ' / ' + C.money(o.cost) + '</td><td data-label="返金・確定手残り">返金 ' + C.money(o.refund * 155) + ' · ' + U.profit(A.balance(o).yen - o.refund * 155) + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><th colspan="4">確定合計</th><td>' + C.money(r.confirmed) + '</td></tr></tfoot></table>' +
      '<h3>赤字の注文</h3>' + (losses.map(function (o) { return '<p class="loss">⚠ 赤字：' + e(D.products.find(function (p) { return p.id === o.product; }).name) + ' · ' + (o.refund ? '返金による売上減少・費用が残るため' : '送料の見込み違い') + ' · ' + C.money(A.balance(o).yen - o.refund * 155) + '</p>'; }).join('') || '<p>赤字の注文はありません。</p>') + '</section>' +
      '<section class="card">' + U.heading('週の日別推移', '中央線より下の棒は赤字です。数値は表でも確認できます。') + chart(r.days) +
      '<details class="chart-table"><summary>表で見る</summary><table class="after-table"><caption>日別の確定手残り・グラフのテキスト代替（例）</caption><thead><tr><th>日付</th><th>確定手残り</th></tr></thead><tbody>' + r.days.map(function (d) { return '<tr><th scope="row">' + d.date + '（例）</th><td data-label="確定手残り">' + U.profit(d.yen) + '</td></tr>'; }).join('') + '</tbody></table></details></section>' +
      '<section class="card">' + U.heading('送料の見込み違い', '各注文の見積りと実送料を比べます。実送料が不明の注文は差額合計に含めません。', 'shippingGap') +
      '<table class="after-table"><caption>今週の全注文の送料比較（例）</caption><thead><tr><th>注文</th><th>見込み</th><th>実際</th><th>差額（実際 − 見込み）</th></tr></thead><tbody>' + r.gaps.map(function (g) { return '<tr><th scope="row">' + U.product(D.orders.find(function (o) { return o.id === g.id; })) + '</th><td data-label="見込み">' + C.money(g.estimate) + '</td><td data-label="実際">' + C.money(g.actual) + '</td><td data-label="差額">' + C.money(g.gap) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><th colspan="3">判明分の差額合計</th><td>' + C.money(r.gap) + '</td></tr></tfoot></table><a href="#/criteria">次の出品から送料の見込みを見直す</a></section></div>' + U.end('reports');
  }
  window.IdealScreens.reports = { render: render, chart: chart, bind: function () {} };
})();
