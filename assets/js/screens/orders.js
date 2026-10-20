(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealAftersale, U = window.IdealAfterUI, e = C.escape;
  var filter = 'すべて';
  function flow(row) {
    var step = row.state === '仕入れ待ち' ? 0 : row.state === '発送待ち' ? (A.tracking(row.tracking).valid ? 2 : 1) : 3;
    return U.stepper(['仕入れ', '追跡番号', '発送登録', row.state === '発送済み' ? '完了（配達待ち）' : '完了'], step);
  }
  function balance(row) {
    var value = A.balance(row), net = value ? value.yen - row.refund * 155 : null;
    var loss = net !== null && net < 0 ? '<span class="loss">⚠ 赤字：' + (row.refund ? '返金による売上減少・費用が残るため' : '送料の見込み違い') + '</span>' : '';
    return '<div class="order-balance"><p class="balance-summary">' + U.profit(net) + (value ? '（確定）' : '') + ' ' + loss + '</p><details><summary>損益の内訳</summary><h3>確定の損益 ' + window.IdealMarks.component('balance') + '</h3>' +
      (value ? '<span class="badge-status" data-status="sold">確定</span>' : '<p>費用未確定：—。実送料が確定したら計算します。</p>') +
      '<dl><dt>売値</dt><dd>' + C.money(row.gross * 155) + '</dd><dt>手数料（13.25%＋1.35%＋固定額・例）</dt><dd>' + C.money((row.gross * 0.146 + 0.4) * 155) +
      '</dd><dt>実送料</dt><dd>' + C.money(row.actualShipping) + '</dd><dt>仕入れ値</dt><dd>' + C.money(row.cost) + '</dd><dt>返金済み</dt><dd>' + C.money(row.refund * 155) + '</dd></dl><p>' + U.profit(value ? value.yen - row.refund * 155 : null) + '</p>' +
      (row.actualShipping !== null && row.shipping !== row.actualShipping ? '<p>送料：見込み ' + C.money(row.shipping) + '／実際 ' + C.money(row.actualShipping) + ' · 差額 ' + C.money(row.actualShipping - row.shipping) + '</p>' : '') +
      (value && value.yen < 0 ? '<p class="loss">⚠ 赤字：送料の見込み違い</p><a href="#/criteria">次の出品から送料の見込みを見直す</a>' : '') + '</details></div>';
  }
  function render() {
    var counts = D.orders.reduce(function (v, r) { v[r.state] = (v[r.state] || 0) + 1; return v; }, {});
    if (filter !== 'すべて' && !counts[filter]) filter = 'すべて';
    return U.start('orders', '発送期限を確認して追跡番号を入力してください。') + '<section class="card after-screen ' + (C.mode === '上級' ? 'after-dense' : '') + '">' +
      U.heading('注文一覧', '仕入れから発送まで、同じ注文の流れに沿って進めます。', 'flow') +
      '<p>' + window.IdealHelp.term('見込み/確定', '確定') + '</p><div class="filters">' + ['すべて', '発送待ち', '仕入れ待ち', '発送済み', '完了'].filter(function (s) { return s === 'すべて' || counts[s]; }).map(function (s) {
        return '<button data-order-filter="' + s + '" aria-pressed="' + (filter === s) + '">' + s + ' ' + (s === 'すべて' ? D.orders.length : counts[s]) + '（例）</button>';
      }).join('') + '</div>' + D.orders.filter(function (r) { return filter === 'すべて' || r.state === filter; }).map(function (row, i) {
        return '<article class="after-row' + (C.mode === 'はじめて' && i === 0 ? ' next-step' : '') + '">' + U.product(row) +
          '<p><span class="badge-status" data-status="' + (row.state === '完了' ? 'sold' : 'scheduled') + '">' + e(row.state) + '</span> · 発送期限 ' + e(row.due) + '（例）' +
          (['発送待ち', '仕入れ待ち'].includes(row.state) ? row.due < '2026-10-20' ? ' · ! 期限超過' : ' · △ 期限が近い' : '') + '</p>' + flow(row) +
          (row.state === '発送待ち' ? U.trackingHTML(row) : row.state === '仕入れ待ち' ? '<p>仕入れ先：' + e(row.source) + '</p>' +
            (row.sourceEnded ? '<p role="alert">! 仕入れ先の販売が終了しています。仕入れを進められません。</p><a href="#/messages">キャンセル連絡の案内 → 購入者に連絡する</a>' : '') +
            U.button('source', row.id, '仕入れ完了にする', row.sourceEnded, true) : '<p>追跡番号：' + e(row.tracking) + '</p>') + balance(row) + '</article>';
      }).join('') + '</section>' + U.end('orders');
  }
  function bind(main) {
    main.onclick = function (event) {
      var b = event.target.closest('button');
      if (!b) return;
      if (b.dataset.orderFilter) { filter = b.dataset.orderFilter; window.IdealShell.render(); }
      if (b.dataset.after === 'source') {
        var row = D.orders.find(function (r) { return r.id === b.dataset.id; });
        if (!row || row.sourceEnded || row.state !== '仕入れ待ち') return;
        row.state = '発送待ち';
        window.IdealShell.toastUndo('仕入れ完了（試作）', function () { row.state = '仕入れ待ち'; });
        window.IdealShell.render();
      }
    };
  }
  window.IdealScreens.orders = { render: render, bind: bind, balance: balance };
})();
