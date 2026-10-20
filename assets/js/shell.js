(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, T = window.IdealToday, M = window.IdealMarks, e = C.escape;
  var route, pending, returnFocus, supportScreen, previousMode, previousHash;
  var undoCallbacks = {}, undoSerial = 0;
  var dialog = document.getElementById('dialog');
  var icon = window.IdealIcons;
  function nav() {
    var badges = D.badges();
    return (D.connection.connected ? '' : '<p class="muted">△ eBay連携が切断中（例）</p>') + D.groups.map(function (group) {
      return '<div class="nav-group">' + (group[0] ? '<h2>' + group[0] + '</h2>' : '') +
        group[1].map(function (entry) {
          var id = entry[0];
          var badgeLabel = (id === 'listings' ? '要修正 ' : id === 'orders' ? '要対応 ' : id === 'messages' ? '未返信 ' : '要対応 ') + badges[id] + ' 件（例）';
          return '<a href="#/' + id + '"' + (id === 'today' ? ' class="pinned"' : '') +
            (route === id ? ' aria-current="page"' : '') + '>' + icon(id) +
            '<span class="nav-label">' + entry[1] + '</span>' +
            (badges[id] ? '<span class="badge" data-badge="' + id + '" aria-label="' + badgeLabel + '" title="' + badgeLabel + '">' + badges[id] + '</span>' : '') + '</a>';
        }).join('') + '</div>';
    }).join('');
  }
  function open(content) { returnFocus = document.activeElement; dialog.innerHTML = '<div class="dialog-top"><span id="dialog-title">理想のオートパイロット・試作</span><button data-action="close" aria-label="閉じる">閉じる ×</button></div>' + window.IdealHelp.annotate(content); dialog.showModal(); var first = dialog.querySelector && dialog.querySelector('button, input, textarea, select, a[href]'); if (first) first.focus(); }
  function close() { dialog.close(); pending = null; if (returnFocus && returnFocus.isConnected) returnFocus.focus(); else { var display = document.querySelector('[data-action="display"]'); if (display && display.getClientRects && display.getClientRects().length) display.focus(); else document.getElementById('main').focus(); } }
  function closeRouteOverlays() {
    pending = null;
    returnFocus = null;
    window.IdealAfterUI.cancelPending();
    window.IdealHelp.closeTerm();
    if (dialog.open) dialog.close();
    ['search-form', 'notifications'].forEach(function (id) {
      var panel = document.getElementById(id);
      if (panel) panel.hidden = true;
    });
  }
  function confirmOperation(entry, payload, execute) {
    var v = window.IdealChecks.validateListing(entry, D.settings), money = payload.takeHome || v.takeHome;
    var warnings = payload.warnings || v.warnings.map(function (r) { return r.reason; });
    open('<h2>実行内容の確認</h2><p>' + e(entry.title || entry.name) + '</p><p>価格 ' + C.money(entry.gross * 155) + ' · 手残り ' + C.money(money && money.yen) + '</p><p>警告 ' + warnings.length + ' 件あります</p><ul>' + warnings.map(function (w) { return '<li>' + e(w) + '</li>'; }).join('') + '</ul><p>' + e(payload.text || (payload.options && payload.options.schedule ? '指定日時に予約します。' : '出品管理の出品中に追加します。')) + '</p><p>元に戻せるか：試作内では取り下げできます。実際の出品履歴は取り消せません。</p><button data-action="confirm">内容を確認して実行</button><button data-action="close">やめる</button>');
    pending = execute;
  }
  function confirmPublication(entry, options, execute) {
    var ticket = D.preparePublication(entry, options);
    if (!ticket) { toast('出品できません：停止理由・接続状態を確認してください'); return; }
    confirmOperation(entry, ticket, function () { execute(ticket); });
  }
  var visibleToasts = [];
  function toast(text, id, continueMaking) {
    var node = document.createElement('div'); node.className = 'toast';
    var continueId = typeof continueMaking === 'string' ? continueMaking : D.drafts[D.drafts.length - 1].id, isDraft = D.drafts.some(function (r) { return r.id === continueId; });
    node.innerHTML = '<span>' + e(text) + '</span>' + (continueMaking ? '<a href="#/' + (isDraft ? 'create/' : 'listings/') + e(continueId) + '">' + (isDraft ? '作る で続ける' : '既存の出品を見る') + '</a>' : '') + (id ? '<button data-action="undo" data-id="' + id + '">元に戻す</button>' : '') + '<button data-action="dismiss" aria-label="通知を閉じる">×</button>';
    function remove() { if (node.remove) node.remove(); else { var box = document.getElementById('toasts'); if (Array.isArray(box.children)) box.children = box.children.filter(function (n) { return n !== node; }); } visibleToasts = visibleToasts.filter(function (n) { return n !== node; }); }
    var timer;
    function pause() { if (timer && window.clearTimeout) window.clearTimeout(timer); }
    function resume() { pause(); if (window.setTimeout) timer = window.setTimeout(remove, 8000); }
    node.onmouseenter = node.onfocusin = pause; node.onmouseleave = node.onfocusout = resume;
    node.dismissToast = remove; visibleToasts.push(node);
    document.getElementById('toasts').appendChild(node);
    while (visibleToasts.length > 2) visibleToasts[0].dismissToast(); resume();
  }
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
      '<button class="support-button" data-action="support" aria-label="この画面で困った"><span class="phone-label">この画面で困った</span><span class="desktop-label">この画面で困った</span></button>' +
      '<div class="desktop-preferences">' + modeControl() + '</div>' +
      '<span class="demo-user">例: デモユーザー</span>' +
      '<button class="display-button" data-action="display" aria-haspopup="dialog" aria-label="表示：モード・テーマ・キーボード操作">' + '表示モード' + '</button></div></div>' +
      '<form id="search-form" class="search-popover" hidden><label class="sr-only" for="search">検索</label><input id="search" type="search" placeholder="画面内を検索" aria-describedby="search-note"><button>検索</button><p id="search-note">試作のため検索は動きません</p></form>' +
      '<div id="notifications" class="notifications" hidden></div>';
  }
  function render() {
    var routeChanged = previousHash !== window.location.hash;
    if (routeChanged) closeRouteOverlays();
    var focused = document.activeElement, focusData = focused && focused.dataset ? Object.assign({}, focused.dataset) : {}, action = focused && focused.dataset ? focused.dataset.action : '', actionId = focused && focused.dataset ? focused.dataset.id : '';
    window.IdealHelp.closeTerm();
    var normalized = D.normalizeHash(window.location.hash); if (normalized !== window.location.hash) window.history.replaceState(null, '', normalized);
    var nextRoute = D.route(normalized);
    if (route !== nextRoute || previousMode !== C.mode) { window.IdealAfterUI.cancelPending(); pending = null; }
    previousMode = C.mode;
    route = nextRoute;
    if (!/^#\//.test(window.location.hash) || window.location.hash.split('/')[1] !== route) window.history.replaceState(null, '', '#/' + route);
    previousHash = window.location.hash;
    document.documentElement.setAttribute('data-theme', C.theme);
    document.title = D.title(route) + ' | 理想のオートパイロット（構想）';
    document.getElementById('sidebar').innerHTML = '<nav aria-label="作業順">' + nav() + '</nav><p class="sidebar-note">試作・ダミーデータ</p>';
    document.getElementById('header').innerHTML = header();
    var main = document.getElementById('main');
    main.onclick = main.oninput = main.onchange = main.onsubmit = main.onkeydown = null;
    document.getElementById('main').innerHTML = window.IdealScreens[route].render();
    if (window.IdealScreens[route].bind) window.IdealScreens[route].bind(document.getElementById('main'));
    var screenClick = main.onclick; if (screenClick) main.onclick = function (event) { var term = event.target.closest('[data-term]'); if (term && term.dataset && term.dataset.term) return; screenClick(event); };
    document.getElementById('tabs').innerHTML = [['today', '今日'], ['sourcing', '仕入れ'], ['create', '出品'], ['orders', '売れたあと']].map(function (r) { return '<a href="#/' + r[0] + '"' + (route === r[0] ? ' aria-current="page"' : '') + '>' + r[1] + '</a>'; }).join('') + '<button data-action="drawer">もっと</button>';
    if (!dialog.open) ['conversation', 'select', 'list', 'bulk', 'edit'].some(function (key) { if (focusData[key] === undefined) return false; var selector = '[data-' + key + '="' + focusData[key] + '"]' + (focusData.id ? '[data-id="' + focusData.id + '"]' : ''); var node = main.querySelector && main.querySelector(selector); if (node) node.focus(); return !!node; });
    if (action && !dialog.open) { var candidates = document.querySelectorAll('[data-action]'); Array.prototype.some.call(candidates, function (n) { if (n.dataset.action === action && n.dataset.id === actionId) { n.focus(); return true; } return false; }); }
    if (routeChanged) main.focus({ preventScroll: true });
  }
  function confirmAftersale(kind, id, value) {
    var ticket = D.prepareAftersale(kind, id, value);
    if (!ticket) return;
    var html = window.IdealAfterUI.confirmHTML(ticket)
      .replace('data-after="execute"', 'data-action="confirm"')
      .replace('data-after="cancel"', 'data-action="close"');
    open(html);
    pending = function () {
      var undo = D.executeAftersale(ticket);
      if (!undo) return;
      render();
      document.getElementById('main').focus();
      toastUndo('実行しました（試作内のみ）', undo);
    };
  }
  function finish(id, label) { if (D.resolve(id)) { render(); document.getElementById('main').focus(); toast(label + '（試作内のみ）', id); } }
  function confirm(item, label, text, apply) { pending = null; open('<h2>実行内容の確認</h2><p>' + e(text) + '</p><p>対象1件。実際の送信・連携は行いません。試作内では元に戻せます。</p><button data-action="confirm">確認して実行（試作）</button><button data-action="close">キャンセル</button>'); pending = function () { if (apply) apply(); finish(item.id, label); }; }
  function jump() {
    closeRouteOverlays();
    render();
    document.getElementById('main').focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Notification links still expand and focus their specific task.
    var id = window.location.hash.split('/')[2];
    if (route === 'criteria' && id) { var setting = document.getElementById('setting-' + id); if (setting) { setting.focus(); setting.scrollIntoView({ block: 'center' }); } }
    var target = route === 'today' && id && document.getElementById('item-' + id);
    if (target) {
      target.open = true;
      target.querySelector('summary').focus();
    }
  }
  document.addEventListener('click', function (event) {
    if (event.target.closest('.skip')) { event.preventDefault(); document.getElementById('main').focus(); return; }
    var term = event.target.closest('[data-term]');
    if (term) { window.IdealHelp.toggleTerm(term); return; }
    var tab = event.target.closest('[data-help-tab]');
    if (tab) { dialog.innerHTML = '<div class="dialog-top"><span id="dialog-title">ヘルプ</span><button data-action="close">閉じる ×</button></div>' + window.IdealHelp.dialog(tab.dataset.helpTab); dialog.querySelector('#help-tab-' + tab.dataset.helpTab).focus(); return; }
    var b = event.target.closest('[data-action]');
    if (!b) { if (event.target.closest('#dialog a')) close(); return; }
    var action = b.dataset.action, id = b.dataset.id, item = D.items.find(function (i) { return i.id === id; });
    if (action === 'reset-preferences') { open('<h2>初期状態に戻す</h2><p>判断軸・自動処理・保存した検索条件を初期状態に戻します。判断の履歴は残します。</p><button data-action="confirm">初期状態に戻す</button><button data-action="close">やめる</button>'); pending = function () { D.resetPreferences(); render(); }; }
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
    if (action === 'shortcuts') open(window.IdealHelp.dialog());

    if (action === 'notifications') {
      var notes = document.getElementById('notifications'); notes.hidden = !notes.hidden; b.setAttribute('aria-expanded', String(!notes.hidden));
      notes.innerHTML = '<h2>対応が必要な通知</h2>' + (D.active().slice(0, 3).map(function (i) { return '<p><a href="#/today/' + i.id + '">' + e(D.categories.find(function (c) { return c.id === i.category; }).label + '：' + D.products.find(function (p) { return p.id === i.product; }).name) + '</a></p>'; }).join('') || '<p>対応が必要な通知はありません。</p>');
    }
    if (action === 'support') { supportScreen = D.title(route); open('<h2>この画面で困った</h2>' + window.IdealHelp.knownIssues() + '<form id="support-form"><p>対象画面：' + e(supportScreen) + '</p><label>困った内容<textarea name="report" required></textarea></label><button>この画面を運営に送る（試作）</button></form>'); }
    if (action === 'dismiss') { if (b.parentElement.dismissToast) b.parentElement.dismissToast(); else b.parentElement.remove(); }
    if (action === 'dismiss-legend') { C.legendDismissed = true; render(); }
    if (action === 'undo') { if (undoCallbacks[id]) { var restored = undoCallbacks[id](); delete undoCallbacks[id]; if (restored === false) { toast(D.lastError || '後の操作があるため元に戻せません'); return; } } else D.undo(id); b.parentElement.remove(); render(); document.getElementById('main').focus(); toast('元に戻しました'); }
    if (action === 'automation') {
      var a = D.automations.find(function (v) { return v.id === id; });
      if (!a) return;
      function applyAutomation(on, confirmed, reason) {
        var undo = D.setAutomation(id, on, confirmed, reason);
        if (!undo) return;
        render(); toastUndo(a.name + (on ? 'を再開しました（試作）' : 'を停止しました（試作）'), undo);
      }
      if (a.on) {
        open('<h2>自動処理を停止しますか</h2><p>' + e(D.automationImpact(a)) + '</p><label>停止する理由（3文字以上）<textarea id="automation-reason"></textarea></label><button data-action="confirm">影響を確認してOFFにする</button><button data-action="close">やめる</button>');
        pending = function () { var reason = document.getElementById('automation-reason').value; if (String(reason || '').trim().length < 3) { toast('停止する理由を3文字以上で入力してください'); return; } applyAutomation(false, true, reason); };
      } else applyAutomation(true, false);
    }
    if (action === 'fix') { var repaired = D.repair(id); render(); toast(repaired && repaired.result.canPublish ? '修正しました。出品前に確認が必要です（試作の例）' : '停止理由が残っています（試作の例）'); }
    if (action === 'message') {
      var draft = document.querySelector('[data-draft="' + id + '"]').value.trim();
      if (!draft) { toast('返信文を入力してください'); return; }
      confirmAftersale('message', id, draft);
    }
    if (action === 'ended') { var endedRow = D.listings.find(function (r) { return r.taskId === id; }), ticket = D.bulkPreview([endedRow.id], 'withdraw'); confirmOperation(endedRow, ticket, function () { var undo = D.applyBulk(ticket); render(); if (undo) toastUndo('取り下げました（試作）', undo); }); }
    if (['accept', 'decline', 'counter'].includes(action)) {
      var gross = action === 'counter' ? Number(document.querySelector('[data-counter="' + id + '"]').value) : item.gross;
      var value = C.takeHome(gross, item.shipping, item.cost);
      if (action !== 'decline' && (!Number.isFinite(gross) || gross <= 0 || value === null || value < 0)) { open('<h2>価格を確認してください</h2>' + T.profit(item, gross) + '<p>赤字または不明な価格では実行できません。価格を見直すか辞退してください。</p>'); return; }
      confirmAftersale(action, id, gross);
    }
    if (action === 'confirm' && pending) { var perform = pending; close(); perform(); }
  });
  document.addEventListener('toggle', function (event) { if (event.target.matches && event.target.matches('[data-task]')) { var button = event.target.querySelector('[data-action="expand"]'); if (button) button.setAttribute('aria-expanded', String(event.target.open)); } }, true);
  document.addEventListener('input', function (event) {
    var t = event.target;
    if (t.id === 'glossary-search') document.getElementById('glossary-results').innerHTML = window.IdealHelp.results(t.value);
    if (t.dataset.draft) D.items.find(function (i) { return i.id === t.dataset.draft; }).draft = t.value;
    if (t.name === 'tracking') {
      var form = t.closest('form'), row = D.orders.find(function (r) { return r.id === form.dataset.shipment; });
      if (!row) return;
      row.tracking = t.value;
      var check = window.IdealAftersale.tracking(t.value);
      form.querySelector('[data-tracking-reason]').textContent = check.reason;
      var counter = form.querySelector('[data-tracking-count]'); if (counter) counter.textContent = t.value.length + ' / 30文字';
      form.querySelector('button[type="submit"]').disabled = !check.valid;
      t.setAttribute('aria-invalid', String(!check.valid));
    }
  });
  document.addEventListener('submit', function (event) {
    event.preventDefault(); var form = event.target;
    if (form.id === 'search-form') toast('試作のため検索は動きません');
    if (form.id === 'support-form') { close(); toast('「' + supportScreen + '」の相談を受け付けました（試作・運営には送信されません）'); }
    if (form.dataset.shipment) {
      var tracking = window.IdealAftersale.tracking(form.elements.tracking.value);
      if (!tracking.valid) { toast(tracking.reason); return; }
      confirmAftersale('ship', form.dataset.shipment, tracking.value);
    }
  });
  document.addEventListener('keydown', function (event) {
    if (dialog.open && event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (dialog.open && event.key === 'Tab' && dialog.querySelectorAll) { var stops = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]')).filter(function (n) { return !n.hidden; }); if (stops.length) { var first = stops[0], last = stops[stops.length - 1]; if (event.shiftKey && (document.activeElement === first || !stops.includes(document.activeElement))) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && (document.activeElement === last || !stops.includes(document.activeElement))) { event.preventDefault(); first.focus(); } } return; }
    var termButton = event.target.closest && event.target.closest('[data-term]');
    if (termButton && ['Enter', ' '].includes(event.key)) { event.preventDefault(); window.IdealHelp.toggleTerm(termButton); return; }
    if (event.key === 'Escape') { window.IdealHelp.closeTerm(); var search = document.getElementById('search-form'); if (search && !search.hidden) { search.hidden = true; var searchButton = document.querySelector('[data-action="search"]'); searchButton.setAttribute('aria-expanded', 'false'); searchButton.focus(); } var notes = document.getElementById('notifications'); if (notes && !notes.hidden) { notes.hidden = true; var bell = document.querySelector('[data-action="notifications"]'); bell.setAttribute('aria-expanded', 'false'); bell.focus(); } }
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.key === '?' && !dialog.open) { event.preventDefault(); open(window.IdealHelp.dialog()); }
    if (C.mode === '上級' && route === 'today' && !dialog.open && ['j', 'k'].includes(event.key)) { var rows = Array.from(document.querySelectorAll('[data-task] > summary')), index = rows.indexOf(document.activeElement); if (rows.length) { event.preventDefault(); rows[index < 0 ? (event.key === 'j' ? 0 : rows.length - 1) : (index + (event.key === 'j' ? 1 : -1) + rows.length) % rows.length].focus(); } }
  });
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  window.addEventListener('hashchange', jump);
  window.IdealShell = { render: render, nav: nav, toast: toast, toastUndo: toastUndo, confirmPublication: confirmPublication, confirmOperation: confirmOperation };
  Object.keys(window.IdealScreens).forEach(function (key) { var original = window.IdealScreens[key].render; window.IdealScreens[key].render = function () { return window.IdealHelp.annotate(original.apply(this, arguments)); }; });
  render();
})();
