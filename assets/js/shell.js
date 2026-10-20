(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, T = window.IdealToday, M = window.IdealMarks, e = C.escape;
  var route, pending, returnFocus, supportScreen;
  var undoCallbacks = {}, undoSerial = 0;
  var dialog = document.getElementById('dialog');
  var icon = window.IdealIcons;
  function nav() {
    var badges = D.badges();
    return D.groups.map(function (group) {
      return '<div class="nav-group">' + (group[0] ? '<h2>' + group[0] + '</h2>' : '') +
        group[1].map(function (entry) {
          var id = entry[0];
          var badgeLabel = (id === 'listings' ? '要修正 ' : id === 'orders' ? '発送待ち ' : id === 'messages' ? '未返信 ' : '要対応 ') + badges[id] + ' 件（例）';
          return '<a href="#/' + id + '"' + (id === 'today' ? ' class="pinned"' : '') +
            (route === id ? ' aria-current="page"' : '') + '>' + icon(id) +
            '<span class="nav-label">' + entry[1] + '</span>' +
            (badges[id] ? '<span class="badge" data-badge="' + id + '" aria-label="' + badgeLabel + '" title="' + badgeLabel + '">' + badges[id] + '</span>' : '') + '</a>';
        }).join('') + '</div>';
    }).join('');
  }
  function open(content) { returnFocus = document.activeElement; dialog.innerHTML = '<div class="dialog-top"><span id="dialog-title">理想のオートパイロット・試作</span><button data-action="close" aria-label="閉じる">閉じる ×</button></div>' + content; dialog.showModal(); }
  function close() { dialog.close(); pending = null; if (returnFocus && returnFocus.isConnected) returnFocus.focus(); else { var display = document.querySelector('[data-action="display"]'); if (display && display.getClientRects && display.getClientRects().length) display.focus(); else document.getElementById('main').focus(); } }
  function toast(text, id) { var node = document.createElement('div'); node.className = 'toast'; node.innerHTML = '<span>' + e(text) + '</span>' + (id ? '<button data-action="undo" data-id="' + id + '">元に戻す</button>' : '') + '<button data-action="dismiss" aria-label="通知を閉じる">×</button>'; document.getElementById('toasts').appendChild(node); }
  function toastUndo(text, callback) {
    var id = 'screen-undo-' + (++undoSerial);
    undoCallbacks[id] = callback;
    toast(text, id);
  }
  function modeControl() {
    return '<div class="segmented" role="group" aria-label="表示モード">' + C.modes.map(function (mode) {
      return '<button data-action="mode" data-id="' + mode + '" aria-pressed="' + (C.mode === mode) + '">' + mode + '</button>';
    }).join('') + '</div>';
  }
  function themeHelp() {
    var themes = { auto: '自動', light: 'ライト', dark: 'ダーク' };
    return '<button class="icon-button" data-action="theme" aria-label="テーマ：' + themes[C.theme] + '。押すと切り替え" title="テーマ：' + themes[C.theme] + '">' + icon('theme') +
      '</button><button class="icon-button" data-action="shortcuts" aria-label="キーボード操作">' + icon('help') + '</button>';
  }
  function preferences() { return modeControl() + themeHelp(); }
  function header() {
    return '<div class="header-row">' +
      '<button class="brand" data-action="home" aria-label="eBase Autopilot：今日へ">' + icon('sparkles') + '<span>eBase Autopilot</span></button>' +
      '<button class="concept" data-action="legend">構想(未実装)</button>' +
      '<button class="phone-brand" data-action="legend" aria-label="eBase Autopilot：構想(未実装)の凡例を開く">' + icon('sparkles') + '<span>eBase Autopilot<span class="concept-pill">構想(未実装)</span></span></button>' +
      '<div class="header-actions">' +
      '<button class="icon-button" data-action="search" aria-label="検索" aria-expanded="false" aria-controls="search-form">' + icon('sourcing') + '</button>' +
      '<button class="icon-button bell" data-action="notifications" aria-expanded="false" aria-controls="notifications" aria-label="通知を開く：' + D.counts().total + '件（例）">' + icon('bell') + '<span class="notification-count" aria-hidden="true">' + D.counts().total + '</span></button>' +
      '<div class="desktop-preferences">' + themeHelp() + '</div>' +
      '<button class="support-button" data-action="support" aria-label="この画面で困った"><span class="phone-label" aria-hidden="true">' + icon('help') + '</span><span class="desktop-label">この画面で困った</span></button>' +
      '<div class="desktop-preferences">' + modeControl() + '</div>' +
      '<span class="demo-user">例: デモユーザー</span>' +
      '<button class="display-button" data-action="display" aria-haspopup="dialog" aria-label="表示：モード・テーマ・キーボード操作">' + icon('criteria') + '</button></div></div>' +
      '<form id="search-form" class="search-popover" hidden><label class="sr-only" for="search">検索</label><input id="search" type="search" placeholder="画面内を検索" aria-describedby="search-note"><button>検索</button><p id="search-note">試作のため検索は動きません</p></form>' +
      '<div id="notifications" class="notifications" hidden></div>';
  }
  function render() {
    var focused = document.activeElement, action = focused && focused.dataset ? focused.dataset.action : '', actionId = focused && focused.dataset ? focused.dataset.id : '';
    route = D.route(window.location.hash);
    if (!/^#\//.test(window.location.hash) || window.location.hash.split('/')[1] !== route) window.history.replaceState(null, '', '#/' + route);
    document.documentElement.setAttribute('data-theme', C.theme);
    document.title = D.title(route) + ' | 理想のオートパイロット（構想）';
    document.getElementById('sidebar').innerHTML = '<nav aria-label="作業順">' + nav() + '</nav><p class="sidebar-note">試作・ダミーデータ</p>';
    document.getElementById('header').innerHTML = header();
    var main = document.getElementById('main');
    main.onclick = main.oninput = main.onchange = main.onsubmit = main.onkeydown = null;
    document.getElementById('main').innerHTML = window.IdealScreens[route].render();
    if (window.IdealScreens[route].bind) window.IdealScreens[route].bind(document.getElementById('main'));
    document.getElementById('tabs').innerHTML = [['today', '今日'], ['sourcing', '仕入れ'], ['create', '出品'], ['orders', '売れたあと']].map(function (r) { return '<a href="#/' + r[0] + '"' + (route === r[0] ? ' aria-current="page"' : '') + '>' + r[1] + '</a>'; }).join('') + '<button data-action="drawer">もっと</button>';
    if (action) { var candidates = document.querySelectorAll('[data-action]'); Array.prototype.some.call(candidates, function (n) { if (n.dataset.action === action && n.dataset.id === actionId) { n.focus(); return true; } return false; }); }
  }
  function finish(id, label) { if (D.resolve(id)) { render(); document.getElementById('main').focus(); toast(label + '（試作内のみ）', id); } }
  function confirm(item, label, text, apply) { pending = null; open('<h2>実行内容の確認</h2><p>' + e(text) + '</p><p>対象1件。実際の送信・連携は行いません。試作内では元に戻せます。</p><button data-action="confirm">確認して実行（試作）</button><button data-action="close">キャンセル</button>'); pending = function () { if (apply) apply(); finish(item.id, label); }; }
  function jump() {
    render();
    document.getElementById('main').focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Notification links still expand and focus their specific task.
    var id = window.location.hash.split('/')[2];
    var target = id && document.getElementById('item-' + id);
    if (target) {
      target.open = true;
      target.querySelector('summary').focus();
    }
  }
  document.addEventListener('click', function (event) {
    if (event.target.closest('.skip')) { event.preventDefault(); document.getElementById('main').focus(); return; }
    var b = event.target.closest('[data-action]');
    if (!b) { if (event.target.closest('#dialog a')) close(); return; }
    var action = b.dataset.action, id = b.dataset.id, item = D.items.find(function (i) { return i.id === id; });
    if (action === 'home') window.location.hash = '#/today';
    if (action === 'close') close();
    if (action === 'mode') { C.setMode(id); render(); if (dialog.open && dialog.querySelector && dialog.querySelector('.display-settings')) { dialog.querySelector('.display-settings').innerHTML = preferences(); dialog.querySelector('[data-id="' + id + '"]').focus(); } }
    if (action === 'display') open('<h2>表示</h2><div class="display-settings">' + preferences() + '</div>');
    if (action === 'theme') { C.setTheme(({ auto: 'light', light: 'dark', dark: 'auto' })[C.theme]); render(); if (dialog.open && dialog.querySelector && dialog.querySelector('.display-settings')) { dialog.querySelector('.display-settings').innerHTML = preferences(); dialog.querySelector('[data-action="theme"]').focus(); } }
    if (action === 'search') { var search = document.getElementById('search-form'); search.hidden = !search.hidden; b.setAttribute('aria-expanded', String(!search.hidden)); if (!search.hidden) document.getElementById('search').focus(); }
    if (action === 'expand') { event.preventDefault(); var row = document.getElementById('item-' + id); row.open = !row.open; b.setAttribute('aria-expanded', String(row.open)); }
    if (action === 'category') { event.preventDefault(); T.filter = 'all'; render(); var card = document.getElementById('category-' + id) || document.getElementById('item-' + D.active().find(function (i) { return i.category === id; }).id); if (card) { card.scrollIntoView({ block: 'start' }); card.focus(); } }
    if (action === 'filter') { T.filter = id; render(); }
    if (action === 'legend') open(M.legend());
    if (action === 'drawer') open('<h2>すべての作業</h2><nav>' + nav() + '</nav>');
    if (action === 'shortcuts') open('<h2>キーボード操作</h2><p>Tab：次の操作へ ／ Shift + Tab：前へ ／ Escape：パネルを閉じる ／ ?：このヘルプ</p><p>上級の今日：j / k で項目移動、Enterで項目を開閉。開いた項目ではTabで操作を選び、Enterで実行します。</p>');
    if (action === 'notifications') {
      var notes = document.getElementById('notifications'); notes.hidden = !notes.hidden; b.setAttribute('aria-expanded', String(!notes.hidden));
      notes.innerHTML = '<h2>対応が必要な通知</h2>' + (D.active().slice(0, 3).map(function (i) { return '<p><a href="#/today/' + i.id + '">' + e(D.categories.find(function (c) { return c.id === i.category; }).label + '：' + D.products.find(function (p) { return p.id === i.product; }).name) + '</a></p>'; }).join('') || '<p>対応が必要な通知はありません。</p>');
    }
    if (action === 'support') { supportScreen = D.title(route); open('<h2>この画面で困った</h2><h3>既知の不具合（例）</h3><ul><li>確認中：画像と説明の表示差</li><li>修正中：過去の取り込みが欠ける</li><li>修正済み：通知の件数ずれ（過去分も修復済み）</li></ul><form id="support-form"><p>対象画面：' + e(supportScreen) + '</p><label>困った内容<textarea name="report" required></textarea></label><button>この画面を運営に送る（試作）</button></form>'); }
    if (action === 'dismiss') b.parentElement.remove();
    if (action === 'undo') { if (undoCallbacks[id]) { undoCallbacks[id](); delete undoCallbacks[id]; } else D.undo(id); b.parentElement.remove(); render(); document.getElementById('main').focus(); toast('元に戻しました'); }
    if (action === 'automation') { var a = D.automations.find(function (v) { return v.id === id; }); a.on = !a.on; render(); toast(a.name + (a.on ? 'を再開しました（試作）' : 'を停止しました（試作）。' + a.impact)); }
    if (action === 'fix') finish(id, '修正しました');
    if (action === 'message') { var draft = document.querySelector('[data-draft="' + id + '"]').value.trim(); if (!draft) { toast('返信文を入力してください'); return; } confirm(item, '返信を送信しました', '送信する返信文：' + draft, function () { item.draft = draft; }); }
    if (action === 'ended') confirm(item, '取り下げました', '対象1件・eBay上の出品を終了します・再出品が必要。実際の操作は取り消せません。');
    if (['accept', 'decline', 'counter'].includes(action)) {
      var gross = action === 'counter' ? Number(document.querySelector('[data-counter="' + id + '"]').value) : item.gross;
      var value = C.takeHome(gross, item.shipping, item.cost);
      if (action !== 'decline' && (!Number.isFinite(gross) || gross <= 0 || value === null || value < 0)) { open('<h2>価格を確認してください</h2>' + T.profit(item, gross) + '<p>赤字または不明な価格では実行できません。価格を見直すか辞退してください。</p>'); return; }
      confirm(item, action === 'counter' ? '価格を再提案しました' : action === 'accept' ? 'オファーを承諾しました' : 'オファーを辞退しました', '価格 ' + C.money(gross * 155) + ' ／ ' + (value < 0 ? '⚠ 赤字 ' : '') + '手残り ' + C.money(value) + (action === 'decline' ? '。辞退すると、この提案では取引しません。' : '。この価格で進めます。'));
    }
    if (action === 'confirm' && pending) { var perform = pending; close(); perform(); }
  });
  document.addEventListener('toggle', function (event) { if (event.target.matches && event.target.matches('[data-task]')) { var button = event.target.querySelector('[data-action="expand"]'); if (button) button.setAttribute('aria-expanded', String(event.target.open)); } }, true);
  document.addEventListener('input', function (event) { var t = event.target; if (t.dataset.draft) D.items.find(function (i) { return i.id === t.dataset.draft; }).draft = t.value; if (t.name === 'tracking') D.items.find(function (i) { return i.id === t.closest('form').dataset.shipment; }).tracking = t.value; });
  document.addEventListener('submit', function (event) {
    event.preventDefault(); var form = event.target;
    if (form.id === 'search-form') toast('試作のため検索は動きません');
    if (form.id === 'support-form') { close(); toast('「' + supportScreen + '」の相談を受け付けました（試作・運営には送信されません）'); }
    if (form.dataset.shipment) { var tracking = form.elements.tracking.value.trim(); if (!tracking) { toast('追跡番号を入力してください'); return; } finish(form.dataset.shipment, '追跡番号 ' + tracking + ' で発送登録しました'); }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { var search = document.getElementById('search-form'); if (search && !search.hidden) { search.hidden = true; var searchButton = document.querySelector('[data-action="search"]'); searchButton.setAttribute('aria-expanded', 'false'); searchButton.focus(); } var notes = document.getElementById('notifications'); if (notes && !notes.hidden) { notes.hidden = true; var bell = document.querySelector('[data-action="notifications"]'); bell.setAttribute('aria-expanded', 'false'); bell.focus(); } }
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.key === '?' && !dialog.open) { event.preventDefault(); open('<h2>ショートカット</h2><p>Tabで移動、Enterで操作、Escapeで閉じる。上級の今日では j / k で項目移動できます。</p>'); }
    if (C.mode === '上級' && route === 'today' && !dialog.open && ['j', 'k'].includes(event.key)) { var rows = Array.from(document.querySelectorAll('[data-task] > summary')), index = rows.indexOf(document.activeElement); if (rows.length) { event.preventDefault(); rows[index < 0 ? (event.key === 'j' ? 0 : rows.length - 1) : (index + (event.key === 'j' ? 1 : -1) + rows.length) % rows.length].focus(); } }
  });
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  window.addEventListener('hashchange', jump);
  window.IdealShell = { render: render, nav: nav, toast: toast, toastUndo: toastUndo };
  render();
})();
