(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealAftersale, U = window.IdealAfterUI, e = C.escape;
  var confirm = U.controller(), counter = 120;
  function proposal(row) {
    var value = A.offer(row, row.discount), net = value && value.takeHome;
    var inactive = !row.listing || row.listing.state !== '出品中';
    var blocked = !net || net.yen < 0 || !row.watchers || inactive;
    if (inactive) return '<p class="muted offer-reason">出品中ではないため送れません・出品管理で対応</p>';
    return '<p class="offer-price">→ 新価格 ' + C.money(value ? value.gross * 155 : null) + ' · ' + U.profit(net ? net.yen : null) + '</p>' +
      (blocked ? '<p>' + (!value ? '割引率は1〜50%で入力してください' : !net ? '費用が不明なため送れません' : net.yen < 0 ? '赤字になるため送れません' : inactive ? '出品中ではないため送れません。出品管理で状態を確認してください' : 'ウォッチャーがいないため送れません') + '</p>' : '') + U.button('watcher-offer', row.id, '送信内容を確認', blocked, true);
  }
  function incoming() {
    var row = D.incomingOffer, value = A.takeHome(row.gross, row.shipping, row.cost), proposed = A.takeHome(counter, row.shipping, row.cost);
    return '<section class="card' + (C.mode === 'はじめて' ? ' next-step' : '') + '">' + U.heading('受信オファー', '提示された価格から費用を引いた手残りを確認して判断します。') +
      U.product(row) + '<p>提示価格 ' + C.money(row.gross * 155) + ' · ' + U.profit(value && value.yen) + '</p>' +
      (row.done ? '<p>✓ ' + e(row.outcome) + '（例）</p>' :
        '<p>' + (!value ? '費用が不明なため受けられません' : value.yen < 0 ? '赤字になるため受けられません' : 'この価格で取引を進められます（例）') + '</p>' +
        '<div class="incoming-controls">' + U.button('accept', row.id, '受ける', !value || value.yen < 0) + U.button('decline', row.id, '断る') +
        '<label>条件として出す価格 $（例）<input type="number" min="0.01" step="0.01" data-counter-offer value="' + counter + '"></label><div id="counter-preview">' + counterHTML(proposed) + '</div></div>') + '</section>';
  }
  function counterHTML(value) {
    return '<p class="counter-price">提案価格 ' + C.money(counter > 0 ? counter * 155 : null) + ' · ' + U.profit(value && value.yen) + '</p>' +
      (!value || value.yen < 0 ? '<p>赤字または不明な価格では条件を出せません</p>' : '') + U.button('counter', D.incomingOffer.id, '条件を出す', !value || value.yen < 0);
  }
  function render() {
    return U.start('offers', '受信オファーの手残りを確認してください。') + '<div class="after-screen ' + (C.mode === '上級' ? 'after-dense' : '') + '">' + incoming() +
      '<section class="card">' + U.heading('ウォッチャー分析 → そのままオファー送信', '見ている人の数と掲載日数を確認し、行の中で価格を試せます。', 'inlineOffer') +
      '<table class="after-table watcher-table"><caption>ウォッチャー分析（例）</caption><thead><tr><th>商品・理由</th><th>ウォッチ / 閲覧 / 日数</th><th>価格 / 仕入れ値</th><th>割引と手残り</th></tr></thead><tbody>' + D.watchers.map(function (row) {
        return '<tr><td>' + U.product(row) + '<p>掲載状態：' + e(row.listing ? row.listing.state : '—') + ' · <a href="#/listings">出品管理</a></p>' + (row.watchers >= 5 && row.days >= 30 ? '<p>ウォッチ' + row.watchers + '人・' + row.days + '日売れていない（例）</p>' : '<p>経過を見て判断します</p>') + '</td><td class="watcher-stats"><span>ウォッチ</span> ' + row.watchers + '人<br><span>閲覧</span> ' + row.views + '回<br><span>掲載日数</span> ' + row.days + '日（例）</td><td>価格 ' + C.money(row.gross * 155) + '<br>仕入れ値 ' + C.money(row.cost) + '</td><td>' +
          (row.listing && row.listing.state === '出品中' ? '<div class="offer-controls"><div class="discount-presets" role="group" aria-label="割引率">' + [5, 10, 15].map(function (n) {
            return '<button aria-pressed="' + (row.discount === n) + '" data-discount-preset="' + n + '" data-id="' + row.id + '">' + n + '%</button>';
          }).join('') + '</div><label>割引率 %（例・1〜50）<input type="number" min="1" max="50" data-discount="' + row.id + '" value="' + e(row.discount) + '"></label><div class="offer-preview" id="offer-' + row.id + '">' + proposal(row) + '</div></div>' : proposal(row)) + '</td></tr>';
      }).join('') + '</tbody></table></section>' + confirm.html() +
      '<section class="card">' + U.heading('送信済みオファー', '送った価格と購入者の返答を確認します。') +
      '<table class="after-table"><caption>結果：承諾 / 期限切れ / 辞退 / 返答待ち（例）</caption><thead><tr><th>商品</th><th>送信日</th><th>価格・人数</th><th>結果</th></tr></thead><tbody>' + D.sentOffers.map(function (r) {
        return '<tr><td>' + U.product(r) + '</td><td>' + e(r.date) + '（例）</td><td>' + C.money(r.gross * 155) + ' · ' + r.count + '人（例）</td><td>' + e(r.outcome) + '（例）</td></tr>';
      }).join('') + '</tbody></table></section></div>' + U.end('offers');
  }
  function bind(main) {
    main.oninput = function (event) {
      var t = event.target;
      if (t.dataset.discount) {
        var row = D.watchers.find(function (r) { return r.id === t.dataset.discount; });
        row.discount = Number(t.value);
        main.querySelector('#offer-' + row.id).innerHTML = proposal(row);
      }
      if (t.hasAttribute('data-counter-offer')) {
        counter = Number(t.value);
        main.querySelector('#counter-preview').innerHTML = counterHTML(A.takeHome(counter, D.incomingOffer.shipping, D.incomingOffer.cost));
      }
    };
    main.onclick = function (event) {
      var b = event.target.closest('button');
      if (!b || confirm.click(b.dataset.after)) return;
      var row = D.watchers.find(function (r) { return r.id === b.dataset.id; });
      if (b.dataset.discountPreset && row) { row.discount = Number(b.dataset.discountPreset); window.IdealShell.render(); }
      if (b.dataset.after === 'watcher-offer' && row) confirm.prepare('watcher-offer', row.id, row.discount);
      if (['accept', 'decline', 'counter'].includes(b.dataset.after)) confirm.prepare(b.dataset.after, D.incomingOffer.id, counter);
    };
  }
  window.IdealScreens.offers = { render: render, bind: bind, proposal: proposal };
})();
