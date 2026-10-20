(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, U = window.IdealAfterUI, e = C.escape;
  var confirm = U.controller();
  var steps = ['受付', '状況確認', '購入者へ連絡', '返金/返送の判断', '完了'];
  var next = ['受付内容を読んでください', '商品説明・写真・追跡記録を確認してください', '購入者に状況を聞いてください', 'eBayの画面で条件を確認し、返金や返送を判断してください', '対応は完了しています'];
  function render() {
    return U.start('returns', '受付内容と注文の記録を確認してください。') +
      '<div class="after-screen ' + (C.mode === '上級' ? 'after-dense' : '') + '">' + D.returnCases.map(function (row, i) {
        var order = D.orders.find(function (o) { return o.id === row.orderId; });
        return '<section class="card' + (C.mode === 'はじめて' && i === 0 ? ' next-step' : '') + '">' + (i === 0 ? '<p class="compact-notice">手順は例です。eBayの最新の規定は eBay の画面で確認してください</p>' : '') + U.heading(row.kind, '記録を確認してから、購入者への連絡と返金・返送を判断します。') + U.product(order) +
          '<p>対象金額 ' + C.money(row.amount * 155) + '</p><blockquote lang="en">' + e(row.original) + '</blockquote><p>' + e(row.summary) + '</p>' +
          U.stepper(steps, row.step) +
          '<p><strong>次にやること：</strong>' + next[row.step] + '</p>' + (row.step < 3 ? U.button('case-next', row.id, '確認して次の手順へ') : '') +
          '<label>購入者に送る文面（AIの案・編集できます）<textarea data-case-draft="' + e(row.id) + '">' + e(row.draft) + '</textarea></label>' +
          U.button('case-message', row.id, '確認して送信', !row.draft.trim()) + row.sent.map(function (s) { return '<p>送信済み（試作）</p><blockquote lang="en">' + e(s) + '</blockquote>'; }).join('') +
          '<p>返金の実行 ' + window.IdealMarks.chip('将来') + '：外部API未接続。ダミーデータのみ操作します。</p>' +
          (row.refunded ? '<p>✓ 返金済み（試作）</p>' : U.button('refund', row.id, '返金する — 影響を確認')) + '</section>';
      }).join('') + '</div>' + confirm.html() + U.end('returns');
  }
  function bind(main) {
    main.oninput = function (event) {
      var t = event.target;
      if (t.dataset.caseDraft) {
        D.returnCases.find(function (r) { return r.id === t.dataset.caseDraft; }).draft = t.value;
        var button = main.querySelector('[data-after="case-message"][data-id="' + t.dataset.caseDraft + '"]');
        if (button) button.disabled = !t.value.trim();
      }
    };
    main.onclick = function (event) {
      var b = event.target.closest('[data-after]');
      if (!b || confirm.click(b.dataset.after)) return;
      var row = D.returnCases.find(function (r) { return r.id === b.dataset.id; });
      if (!row) return;
      if (b.dataset.after === 'refund') confirm.prepare('refund', row.id);
      if (b.dataset.after === 'case-message') confirm.prepare('case-message', row.id, row.draft);
      if (b.dataset.after === 'case-next' && row.step < 3) {
        var before = row.step;
        row.step++;
        window.IdealShell.toastUndo('確認した手順を記録しました（試作）', function () { row.step = before; });
        window.IdealShell.render();
      }
    };
  }
  window.IdealScreens.returns = { render: render, bind: bind };
})();
