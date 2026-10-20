(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, M = window.IdealMarks, e = C.escape;
  var search = '', filter = '', sort = 'date', selected = [], expanded = '', impact = null, undo = null, notice = '', saved = D.savedFilters, anchor = null;
  var autoOpen = false, autoUndone = false;
  var autoChanges = [
    { label: '説明の末尾', before: '配送案内なし', after: '追跡配送の案内あり', reason: '共通の配送設定と一致させました' },
    { label: '画像の順番', before: '裏面が先頭', after: '全体写真が先頭', reason: '元画像の順序を使いました' },
    { label: '関税の案内', before: '案内なし', after: 'DDUの説明あり', reason: '共通設定を参照しました。過去の出品 3 件にも反映（例）' }
  ];
  // Applied example repairs are represented in the listing records, so undo changes data too.
  D.listings.slice(0, 3).forEach(function (row, i) { row.autoRepair = autoChanges[i].after; row.dutiesNotice = autoChanges[2].after; });
  function rows() {
    return D.listings.filter(function (row) { return (!filter || row.state === filter) && (row.name + row.cause).toLowerCase().includes(search.toLowerCase()); }).sort(function (a, b) {
      return sort === 'price' ? a.gross - b.gross : sort === 'name' ? a.name.localeCompare(b.name, 'ja') : b.date.localeCompare(a.date);
    });
  }
  function stateChip(state) {
    var category = ({ 'AI処理済': '対象外', '下書き': '対象外', '売却済': '対象外', '予約済': '出品中', '出品中': '出品中', '予約済み': '出品中', '要修正': '要修正', '要判断': '要判断', '注意': '注意', '仕入れ元終了': '注意', 'eBay終了': '対象外', '対象外': '対象外' })[state];
    var status = ({ 'AI処理済': 'draft', '下書き': 'draft', '予約済み': 'scheduled', '予約済': 'scheduled', '出品中': 'active', '売却済': 'sold', '要修正': 'error', '要判断': 'error', '注意': 'error', '仕入れ元終了': 'ended', 'eBay終了': 'ended', '対象外': 'ended' })[state] || 'draft';
    var warning = ['要判断', '注意'].includes(state);
    var label = ({ '予約済み': '予約済', 'eBay終了': '終了' })[state] || state;
    return '<span class="badge-status' + (warning ? ' status-warning' : '') + '" data-status="' + status + '" data-state-category="' + category + '">' + e(label) + '</span>';
  }
  function detail(row) {
    var canFix = !['仕入れ元終了', '対象外'].includes(row.state);
    return '<div class="listing-detail"><h3>失敗の原因＋直し方 ' + M.component('failure') + '</h3><dl><dt>原因</dt><dd>' + e(row.cause || '出品を妨げる問題はありません') + '</dd><dt>自分で直せるか</dt><dd>' + (canFix ? 'はい。下の内容を確認して直せます。' : '再出品には仕入れ元・対象条件の確認が必要です。') + '</dd><dt>出品への影響</dt><dd>' + (['要修正', '要判断'].includes(row.state) ? '確認が終わるまで出品できません。' : '現在の状態：' + e(row.state)) + '</dd><dt>次にやること</dt><dd>' + e(row.next || '在庫と掲載内容を確認してください') + '</dd></dl>' +
      (row.state === '要修正' ? '<p>反映する内容：' + e(row.next) + '</p><button data-list="fix" data-id="' + row.id + '">この内容で直す</button>' : row.state === '要判断' ? '<label>分類を確認<select id="row-category"><option value="">候補を選ぶ</option><option>Collectibles</option><option>Other Collectibles</option></select></label><button data-list="decide" data-id="' + row.id + '">選んだ分類を記録する</button>' : row.state === '注意' ? '<button data-list="fix" data-id="' + row.id + '">元画像に戻して直す</button>' : '') +
      '<details><summary>eBayの原文(そのまま)</summary><pre>' + e(row.original || '—') + '</pre></details>' + (row.autoRepair ? '<p>自動修正の結果（試作の例）：' + e(row.autoRepair + ' · 関税の案内：' + row.dutiesNotice) + '</p>' : '') + '</div>';
  }
  function table() {
    var visible = rows();
    return '<table class="listings-table"><caption>出品一覧 · ' + visible.length + ' 件（例）</caption><thead><tr><th>選択</th><th>商品と状態</th><th>価格・見込み手残り</th><th>出品日・在庫監視</th><th>操作</th></tr></thead><tbody>' + visible.map(function (row) {
      var p = D.products.find(function (p) { return p.id === row.product; }), value = window.IdealChecks.takeHome(row.gross, row.shipping, row.cost);
      return '<tr><td><label class="row-select"><input type="checkbox" data-select="' + row.id + '"' + (selected.includes(row.id) ? ' checked' : '') + '><span class="sr-only">' + e(row.name) + 'を選択</span></label></td><td><div class="listing-product"><img src="assets/img/' + e(p.images[0].file) + '" alt="' + e(p.name) + '" width="40" height="40"><div><strong>' + e(row.name) + '</strong><br>' + stateChip(row.state) + (row.state !== '出品中' ? '<small>' + e(row.cause + ' · ' + row.next) + '</small>' : '') + '</div></div></td><td><span>価格 ' + C.money(row.gross > 0 ? row.gross * 155 : null) + '</span><br><span class="' + (value && value.yen < 0 ? 'loss' : '') + '">手残り ' + (value && value.yen < 0 ? '⚠ 赤字 ' : '') + C.money(value && value.yen) + '</span></td><td>' + e(row.date) + '（例）<small>' + e(!D.automations.find(function (a) { return a.id === 'stock'; }).on || !D.connection.connected ? '監視停止中' : row.stock) + '</small></td><td><button class="primary" data-list="detail" data-id="' + row.id + '" aria-expanded="' + (expanded === row.id) + '">' + (row.state === '要修正' ? '直す' : row.state === '要判断' ? '判断する' : '内容を見る') + '</button></td></tr>' + (expanded === row.id ? '<tr class="detail-row"><td colspan="5">' + detail(row) + '</td></tr>' : '');
    }).join('') + '</tbody></table>' + (!visible.length ? '<p>条件に合う出品はありません。</p>' : '');
  }
  function autoNotice() {
    return '<section class="card"><h2>' + (autoUndone ? '自動修正を元に戻しました' : '自動で直しました（試作の例）') + ' ' + M.component('repair') + '</h2><ul>' + autoChanges.map(function (c) { return '<li>' + e(c.label + '：' + (autoUndone ? c.before : c.after) + ' · ' + c.reason) + '</li>'; }).join('') + '</ul><button class="button-small" data-list="auto-detail">内容を見る（差分）</button><button class="button-small" data-list="auto-undo"' + (autoUndone ? ' disabled' : '') + '>元に戻す</button><button class="legend-link" data-action="support">既知の不具合</button>' +
      (autoOpen ? '<div><h3>修正前 → 修正後（例）</h3>' + autoChanges.map(function (c) { return '<p>' + e(c.label + '：' + c.before + ' → ' + c.after + '。根拠：' + c.reason) + '</p>'; }).join('') + '<p>対象は各1件、関税の案内は過去3件の例です。元に戻すと修正前の内容に戻ります。</p><a class="chip" href="#/today">今日で自動処理を停止・再開する</a></div>' : '') + '</section>';
  }
  function impactHTML() {
    if (!impact) return '';
    return '<section class="card impact-preview" role="region" aria-label="一括操作の影響プレビュー" tabindex="-1"><h2>一括操作の影響プレビュー ' + M.component('bulk') + '</h2><p>赤字件数・元に戻せるか ' + M.component('bulkSafety') + '</p><p>対象' + impact.count + '件（例）</p><p>' + e(impact.text) + '</p>' + (impact.action === 'price' ? '<p>' + impact.percent + '%値下げ · ⚠ 赤字になる商品 ' + impact.losses + ' 件（例）。赤字・上限超過は上級の理由記録が必要です。利益不明は実行できません。</p><a href="#/criteria/discountLimit">この判断軸を見る/直す</a>' : '') + '<p>利益不明 ' + impact.unknown + ' 件</p><ul>' + impact.skipped.map(function (r) { return '<li>' + e(r.name + '：対象外・' + r.reason) + '</li>'; }).join('') + '</ul><p>' + e(impact.undo) + '</p><button data-list="execute"' + (impact.valid ? '' : ' disabled') + '>実行</button><button data-list="cancel">やめる</button></section>';
  }
  function bulkBar() { return (selected.length ? '<section class="card bulk-bar" tabindex="-1"><h2>選択した ' + selected.length + ' 件（例）</h2><label>値下げ率 %（例）<input id="bulk-percent" type="number" value="10" min="1" max="90"></label><label>上級の例外理由（3文字以上）<input id="bulk-reason"></label>' + [['price', '価格を一律で下げる'], ['withdraw', '取り下げ'], ['relist', '再出品'], ['reset', 'リセット']].map(function (a) { return '<button data-bulk="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</section>' : ''); }
  function render() {
    saved = D.savedFilters;
    var deep = window.location.hash.split('/')[2]; if (D.listings.some(function (r) { return r.id === deep; })) { expanded = deep; filter = ''; search = ''; }
    var counts = D.listingCounts();
    return C.pageHeader('出品管理') + '<p class="muted">このブラウザに保存(試作) · 上級：j/k 移動、Space 選択、Shift で範囲、Ctrl/Cmd+A 全選択、b 一括操作へ</p>' + '<p class="muted">判断軸で要確認：' + window.IdealCriteria.flagged(D).length + ' 件（例）</p>' + autoNotice() + bulkBar() + '<section class="card"><h2>出品一覧</h2><div class="listing-toolbar"><label>出品を検索<input id="listing-search" type="search" value="' + e(search) + '"></label><label>並べ替え<select id="listing-sort">' + [['date', '出品日の新しい順'], ['price', '価格の低い順'], ['name', '名前順']].map(function (a) { return '<option value="' + a[0] + '"' + (a[0] === sort ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select></label></div><div class="filters"><button data-state="" aria-pressed="' + !filter + '">すべて ' + D.listings.length + '（例）</button>' + Object.keys(counts).filter(function (state) { return counts[state] > 0; }).map(function (state) { return '<button data-state="' + state + '" aria-pressed="' + (filter === state) + '">' + state + ' ' + counts[state] + '（例）</button>'; }).join('') + '</div>' +
      (C.mode === '上級' ? '<button data-list="save-filter">現在の条件を保存</button><button data-list="load-filter"' + (saved ? '' : ' disabled') + '>保存した条件を使う</button>' : '') + '<button data-list="select-all">表示中を全選択 / 解除</button><div id="listing-results">' + table() + '</div></section>' +
      impactHTML() +
      (notice ? '<div class="card" role="status">' + e(notice) + (undo ? '<button data-list="undo">元に戻す</button>' : '') + '</div>' : '') + M.card('listings');
  }
  function bind(main) {
    main.oninput = function (event) {
      if (event.target.id === 'listing-search') { search = event.target.value; main.querySelector('#listing-results').innerHTML = window.IdealHelp.annotate(table()); }
    };
    main.onchange = function (event) {
      var t = event.target;
      if (t.id === 'listing-sort') { sort = t.value; window.IdealShell.render(); }
      if (t.dataset.select) { anchor = t.dataset.select; selected = selected.filter(function (id) { return id !== t.dataset.select; }); if (t.checked) selected.push(t.dataset.select); impact = null; window.IdealShell.render(); }
    };
    main.onkeydown = function (event) {
      if (C.mode !== '上級' || event.altKey || event.target.isContentEditable || /TEXTAREA|SELECT/.test(event.target.tagName) || event.target.tagName === 'INPUT' && !event.target.dataset.select) return;
      var controls = Array.from(main.querySelectorAll('[data-select]')), index = controls.indexOf(document.activeElement);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') { event.preventDefault(); selected = rows().map(function (r) { return r.id; }); impact = null; window.IdealShell.render(); return; }
      if (event.ctrlKey || event.metaKey) return;
      if (['j', 'k'].includes(event.key) && controls.length) { event.preventDefault(); controls[index < 0 ? 0 : (index + (event.key === 'j' ? 1 : -1) + controls.length) % controls.length].focus(); }
      if (event.key === ' ' && event.target.dataset.select) { event.preventDefault(); select(event.target.dataset.select, event.shiftKey); }
      if (event.key === 'b') { event.preventDefault(); var bar = main.querySelector('.bulk-bar'); if (bar) { bar.focus(); if (bar.scrollIntoView) bar.scrollIntoView({ block: 'nearest' }); } }
    };
    function select(id, range) {
      var ids = rows().map(function (r) { return r.id; });
      if (range && anchor && ids.includes(anchor)) { var a = ids.indexOf(anchor), b = ids.indexOf(id); selected = Array.from(new Set(selected.concat(ids.slice(Math.min(a, b), Math.max(a, b) + 1)))); }
      else { selected = selected.includes(id) ? selected.filter(function (v) { return v !== id; }) : selected.concat(id); anchor = id; }
      impact = null; window.IdealShell.render(); var control = main.querySelector('[data-select="' + id + '"]'); if (control) control.focus();
    }
    main.onclick = function (event) {
      if (event.target.dataset && event.target.dataset.select && event.shiftKey) { event.preventDefault(); select(event.target.dataset.select, true); return; }
      var b = event.target.closest('button'); if (!b) return;
      var action = b.dataset.list, row = D.listings.find(function (r) { return r.id === b.dataset.id; });
      if (action === 'select-all') { var ids = rows().map(function (r) { return r.id; }); selected = ids.every(function (id) { return selected.includes(id); }) ? [] : ids; impact = null; }
      if (b.hasAttribute('data-state')) { filter = b.dataset.state; impact = null; }
      if (b.dataset.bulk) {
        impact = D.bulkPreview(selected, b.dataset.bulk, Number(main.querySelector('#bulk-percent').value), C.mode, main.querySelector('#bulk-reason').value);
        if (!impact.valid) notice = '値下げ率は1〜50%。上級のみ理由3文字以上で90%まで。赤字・利益不明・判断軸の上限も確認してください。';
      }
      if (action === 'execute') {
        var restore = D.applyBulk(impact);
        if (restore) { notice = '一括操作を実行しました（試作）。'; rememberUndo(restore, notice); impact = null; selected = []; }
        else notice = '出品できない商品があります。赤字・不明値・要修正・仕入れ元の状態を確認してください。';
      }
      if (action === 'cancel') impact = null;
      if (action === 'detail') expanded = expanded === row.id ? '' : row.id;
      if (action === 'fix' || action === 'decide') {
        if (action === 'decide') {
          var value = main.querySelector('#row-category').value;
          if (!value) { window.IdealShell.toast('分類を選んでください。'); return; }
          D.decisions.push({ date: new Date().toISOString(), what: row.name + '：カテゴリ選択', reason: '商品の種類を確認：' + value, who: 'あなた' });
        }
        if (action === 'decide') { row.category = value; row.confidence = 100; }
        var snapshot = Object.assign({}, row);
        var repaired = D.repair(row.id);
        if (repaired && repaired.result.canPublish) window.IdealShell.confirmPublication(row, {}, function (ticket) { if (D.consumePublication(ticket, row, {}) && window.IdealChecks.validateListing(row, D.settings).canPublish) { row.state = '出品中'; window.IdealShell.render(); } });
        notice = '内容を修正しました（試作）。';
        var repairedSignature = JSON.stringify(row);
        rememberUndo(function () { if (JSON.stringify(row) !== repairedSignature) { D.lastError = '後の操作があるため元に戻せません'; return false; } Object.assign(row, snapshot); return true; }, notice); expanded = '';
      }
      if (action === 'undo') restoreLast();
      if (action === 'save-filter') { saved = { search: search, filter: filter, sort: sort }; D.savedFilters = saved; D.persist(); notice = 'このブラウザに検索条件を保存しました（試作）。'; }
      if (action === 'load-filter') saved = D.savedFilters;
      if (action === 'load-filter' && saved) { search = saved.search; filter = saved.filter; sort = saved.sort; }
      if (action === 'auto-detail') autoOpen = !autoOpen;
      if (action === 'auto-undo') { D.listings.slice(0, 3).forEach(function (r, i) { r.autoRepair = autoChanges[i].before; r.dutiesNotice = autoChanges[2].before; }); autoUndone = true; }
      if (action || b.hasAttribute('data-state') || b.dataset.bulk) {
        window.IdealShell.render();
        if (impact) main.querySelector('.impact-preview').focus();
      }
    };
  }
  function rememberUndo(restore, message) {
    var done = false;
    function once() {
      if (done) return false;
      if (restore() === false) { notice = D.lastError || '後の操作があるため元に戻せません'; return false; }
      done = true;
      if (undo === once) undo = null;
      notice = '元に戻しました（試作）。'; return true;
    }
    undo = once;
    window.IdealShell.toastUndo(message, once);
  }
  function restoreLast() { if (undo && undo() !== false) { undo = null; notice = '元に戻しました（試作）。'; } }
  window.IdealScreens.listings = { render: render, bind: bind, rows: rows, stateChip: stateChip, restoreLast: restoreLast };
})();
