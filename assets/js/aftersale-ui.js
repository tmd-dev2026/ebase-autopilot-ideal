(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealAftersale, e = C.escape;
  function button(action, id, label, disabled, primary) {
    return '<button' + (primary ? ' class="primary"' : '') + ' data-after="' + action + '" data-id="' + e(id) + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }
  function product(row) {
    var p = D.products.find(function (p) { return p.id === row.product; });
    return '<span class="listing-product"><img src="assets/img/' + e(p.images[0].file) + '" alt="" width="40" height="40"><strong>' + e(p.name) + '</strong></span>';
  }
  function profit(value) {
    return '<span class="' + (value !== null && value < 0 ? 'loss' : '') + '">' + (value !== null && value < 0 ? '⚠ 赤字 ' : '') + '手残り ' + C.money(value) + '</span>';
  }
  function heading(title, explanation, mark) {
    return '<h2>' + e(title) + (mark ? ' ' + window.IdealMarks.component(mark) : '') + '</h2>' +
      (C.mode === 'はじめて' ? '<p class="muted">' + e(explanation) + '</p>' : '');
  }
  function start(route, next) {
    return C.pageHeader(D.title(route)) +
      (C.mode === 'はじめて' ? '<p class="next-step">いまやること：' + e(next) + '</p>' : '');
  }
  function confirmHTML(ticket) {
    if (!ticket) return '';
    var html = '<section class="card impact-preview" tabindex="-1" aria-label="実行内容の確認"><h2>' +
      (ticket.kind === 'refund' ? '返金の影響プレビュー ' + window.IdealMarks.component('refund') : '実行内容の確認') + '</h2><p>' + e(ticket.text) + '</p>';
    if (ticket.kind.includes('message')) {
      if (ticket.kind === 'message' && A.lowConfidence(ticket.row.confidence)) html += '<p class="warning-notice" role="alert">人が書いてください。AIの案は参考です</p>';
      html += '<pre lang="en">' + e(ticket.value) + '</pre>';
    } else if (ticket.kind === 'ship') html += '<p>追跡番号：' + e(ticket.value) + '</p>';
    else if (ticket.kind === 'refund') {
      html += '<p>返金額 ' + C.money(ticket.impact.yen) + '</p><p>返金後 ' + profit(ticket.impact.remaining) + '</p>' +
        (ticket.impact.loss ? '<p class="loss">⚠ 赤字：売上を返金しても手数料・実送料・仕入れ値が残るため。</p>' : '') +
        '<p>返金の実行 ' + window.IdealMarks.chip('将来') + '：eBay APIの連携が必要です。ここではダミーデータだけを変更します。</p>';
    } else html += '<p>価格 ' + C.money(ticket.value * 155) + ' · ' + profit(ticket.kind === 'watcher-offer' ? ticket.impact.takeHome.yen : ticket.impact && ticket.impact.yen) + '</p>';
    return html + '<p>対象1件（例）。試作内だけ元に戻せます。</p>' + button('execute', '', ticket.kind === 'refund' ? '影響を理解して返金する（試作のみ）' : ticket.kind.includes('message') ? '送信' : '確認して実行（試作）') + button('cancel', '', '戻る') + '</section>';
  }
  // A screen owns its pending confirmation. Leaving it or changing mode discards the ticket.
  var controllers = [];
  function controller() {
    var pending = null, scope = '';
    controllers.push(function () { D.cancelAftersale(pending); pending = null; });
    return {
      html: function () {
        var current = window.location.hash + C.mode;
        if (scope !== current) { D.cancelAftersale(pending); pending = null; scope = current; }
        return confirmHTML(pending);
      },
      prepare: function (kind, id, value) {
        D.cancelAftersale(pending);
        pending = D.prepareAftersale(kind, id, value);
        scope = window.location.hash + C.mode;
        window.IdealShell.render();
        var region = document.querySelector('.impact-preview');
        if (pending && region) region.focus();
      },
      click: function (action) {
        if (action !== 'execute' && action !== 'cancel') return false;
        if (scope !== window.location.hash + C.mode) { D.cancelAftersale(pending); pending = null; }
        if (action === 'execute') {
          var undo = D.executeAftersale(pending);
          if (undo) window.IdealShell.toastUndo('実行しました（試作内のみ）', undo);
          else if (pending) window.IdealShell.toast('内容が変わりました。影響をもう一度確認してください。');
        } else D.cancelAftersale(pending);
        pending = null;
        window.IdealShell.render();
        document.getElementById('main').focus();
        return true;
      }
    };
  }
  function stepper(labels, current) {
    return '<ol class="stepper">' + labels.map(function (label, i) {
      var done = i < current;
      return '<li class="step ' + (done ? 'is-done' : i === current ? 'is-current' : 'is-upcoming') + '"' +
        (i === current ? ' aria-current="step"' : '') + '><span class="step-circle" aria-hidden="true">' +
        (done ? '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 8 3 3 7-7"/></svg>' : i + 1) +
        '</span><span>' + e(label) + (done ? '<span class="sr-only">（完了）</span>' : '') + '</span></li>';
    }).join('') + '</ol>';
  }
  function trackingHTML(row) {
    var check = A.tracking(row.tracking);
    return '<form class="tracking-form" data-shipment="' + e(row.id) + '"><div class="tracking-controls"><label>追跡番号<input name="tracking" autocomplete="off" maxlength="30" value="' + e(row.tracking) + '" aria-describedby="tracking-' + e(row.id) + '"></label><button class="primary" type="submit"' + (check.valid ? '' : ' disabled') + '>発送登録</button></div><p class="tracking-reason muted" id="tracking-' + e(row.id) + '" data-tracking-reason role="status">' + e(check.reason) + '</p></form>';
  }
  window.IdealAfterUI = { button: button, stepper: stepper, product: product, profit: profit, heading: heading, start: start,
    cancelPending: function () { controllers.forEach(function (cancel) { cancel(); }); },
    controller: controller, confirmHTML: confirmHTML, trackingHTML: trackingHTML,
    end: function (route) { return window.IdealMarks.card(route); } };
})();
