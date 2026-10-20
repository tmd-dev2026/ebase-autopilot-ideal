(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, V = window.IdealChecks, M = window.IdealMarks, e = C.escape;
  var selected = D.drafts[0].id, resultRow = null;
  function current() { return D.drafts.find(function (d) { return d.id === selected; }); }
  function product(d) { return D.products.find(function (p) { return p.id === d.product; }) || d.sourceProduct; }
  function field(label, key, value, type) {
    return '<label>' + e(label) + '<input data-field="' + e(key) + '" type="' + (type || 'text') + '" value="' + e(value) + '"' + (key === 'title' ? ' maxlength="80"' : type === 'number' ? ' min="0" step="0.01"' : '') + '></label>';
  }
  function gallery(photos) {
    return '<div class="gallery">' + photos.map(function (p) { return '<img src="assets/img/' + e(p.file) + '" alt="' + e(p.caption) + '" width="40" height="40">'; }).join('') + '</div>';
  }
  function preview(d) {
    return '<h2>eBay に出る形 ' + M.component('preview') + '</h2>' + gallery(d.photos) +
      '<h3>' + e(d.title) + '</h3><p>Price: ' + C.money(d.gross > 0 ? d.gross * 155 : null) + '</p><p>Shipping: ' + C.money(d.shipping > 0 ? d.shipping : null) + '</p>' +
      '<table><caption>Item specifics</caption><tbody>' + Object.keys(d.specifics).map(function (key) { return '<tr><th scope="row">' + e(key) + '</th><td>' + e(d.specifics[key]) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<p class="description">' + e(d.description) + '</p><p>Category: ' + e(d.category) + '</p><p>Import duties: ' + (D.settings.duties === 'DDP' ? 'Seller pays (DDP)' : D.settings.duties === 'DDU' ? 'Buyer pays (DDU)' : '—') + '</p>' +
      '<p>Shipping policy: ' + e(D.settings.shipping || '—') + '<br>Returns: ' + e(D.settings.returns || '—') + '<br>Payment: ' + e(D.settings.payment || '—') + '</p>';
  }
  var targets = { required: 'edit-content', category: 'category-edit', regulations: 'edit-content', price: 'price-edit', policies: 'policy-edit', duties: 'policy-edit', impact: 'edit-content' };
  function validation(d) {
    var v = V.validateListing(d, D.settings);
    return '<h2>' + window.IdealHelp.term('自動検証') + ' ' + M.component('checks') + '</h2><p role="status">' + (v.canPublish ? '出品できます' : 'あと' + v.blockers.length + 'か所直すと出せます') + '</p><p class="' + (v.takeHome && v.takeHome.yen < 0 ? 'loss' : '') + '">見込み' + window.IdealHelp.term('手残り') + '：' + (v.takeHome && v.takeHome.yen < 0 ? '⚠ 赤字 ' : '') + C.money(v.takeHome && v.takeHome.yen) + '</p><small>例：為替155円、手数料13.25%＋1.35%＋$0.40 / ¥62。送料・仕入れ値を差し引きます。</small>' +
      '<p>送料：' + C.money(d.shipping > 0 ? d.shipping : null) + ' · 仕入れ値：' + C.money(d.cost > 0 ? d.cost : null) + '</p><ul class="check-list ' + (C.mode === '上級' ? 'compact-checks' : '') + '">' + v.checks.map(function (check) {
        var labels = { ok: '✓ 確認済み', warn: '△ 注意', block: '⛔ 停止', unknown: '？ 不明' };
        var fix = '';
        if (check.status !== 'ok') {
          if (check.id === 'photos') fix = '<button data-make="photos">元画像を使う</button>';
          else if (check.id === 'duplicate') fix = '<a class="chip" href="#/listings">出品管理を見る</a>';
          else if (check.id === 'price') fix = ['価格を上げる', '送料を見直す', '仕入れ値を確認'].map(function (label, i) { return '<button data-focus="' + ['gross', 'shipping', 'cost'][i] + '">' + label + '</button>'; }).join('');
          else fix = '<button data-jump="' + targets[check.id] + '">' + e(check.fixLabel) + '</button>';
        }
        return '<li><strong>' + labels[check.status] + ' · ' + (check.id === 'category' ? window.IdealHelp.term('カテゴリの確度') : e(check.label)) + '</strong><p>' + e(check.reason) + '</p>' + (C.mode === 'はじめて' ? '<small>' + e(check.effect) + '。下の操作から確認できます。</small>' : '') + fix + (check.id === 'price' ? '<a href="#/criteria/marginFloor">この判断軸を見る/直す</a>' : '') + '</li>';
      }).join('') + '</ul>';
  }
  function finalBar(d) {
    var v = V.validateListing(d, D.settings);
    var reason = v.canPublish ? '' : v.takeHome && v.takeHome.yen < 0 ? '赤字のため出せません' : v.blockers.map(function (c) { return c.label + '：' + c.reason; }).join(' / ');
    var override = C.mode === '上級' && V.canOverride(v, C.mode, '確認');
    return '<p>対象1件（例）。内容を確認して出品します。試作内では取り下げできます。実際の出品履歴は取り消せません。</p>' +
      '<p>警告 ' + v.warnings.length + ' 件を確認しました</p><p id="publish-reason">' + e(reason) + '</p>' +
      '<div class="action-wrap"><button class="primary" data-make="publish" aria-describedby="publish-reason"' + (v.canPublish ? '' : ' disabled') + '>出品する</button>' +
      '<label>予約日時（例）<input id="schedule-time" type="datetime-local"></label><button data-make="schedule"' + (v.canPublish ? '' : ' disabled') + '>予約する</button><button data-make="save">下書きに戻す</button></div>' +
      (override ? '<details><summary>赤字の判断の記録 ' + M.component('decision') + '</summary><label>理由<select id="override-reason"><option value="">選んでください</option><option>在庫整理のため</option><option>検証用の販売のため</option><option>その他</option></select></label><label>判断の背景（必須）<textarea id="override-context"></textarea></label><button data-make="override">この判断で出す(理由を記録)</button></details>' : '') + '<p id="make-feedback" role="status"></p>';
  }
  function history() {
    return '<details class="card"><summary>あなたの判断の記録 ' + M.component('decision') + '</summary>' + (D.decisions.map(function (d) { return '<p>' + e(d.date + ' · ' + d.who + ' · ' + d.what + ' · ' + d.reason) + '</p>'; }).join('') || '<p>判断はまだ記録されていません。</p>') + '</details>';
  }
  function render() {
    var d = current(), p = product(d);
    var list = '<section class="card"><h2>取り込み済み(未出品)</h2><div class="draft-list">' + D.drafts.filter(function (x) { return !x.published; }).map(function (x, i) { return '<button data-draft-id="' + x.id + '" aria-pressed="' + (x.id === selected) + '">' + e(product(x).name) + ' · 例 ' + (i + 1) + '</button>'; }).join('') + '</div><form id="import-example"><label>URLから取り込む<input name="url" required placeholder="架空の商品のURLを入力"></label><label>試作で選ぶ商品<select name="draft">' + D.drafts.filter(function (x) { return !x.published; }).map(function (x) { return '<option value="' + x.id + '">' + e(product(x).name) + '</option>'; }).join('') + '</select></label><button>取り込む（例）</button><small>入力は送信せず、選んだダミー商品を表示します。</small></form></section>';
    var result = resultRow ? '<section class="card" role="status"><h2>' + (resultRow.state === '予約済み' ? '予約しました' : '出品しました') + '(試作のため実際には何も送っていません)</h2><p>次は出品管理で状態を確認してください。</p><a class="chip" href="#/listings">出品管理へ</a><button data-make="withdraw-result">取り消し(取り下げ)</button><small>対象1件。出品を終了して下書きへ戻します。試作内だけの操作です。</small></section>' : '';
    if (d.published) return C.pageHeader('作る') + list + result + history() + M.card('create');
    return C.pageHeader('作る') + (C.mode === 'はじめて' ? '<p class="next-step">取り込み → 確認 → 出品：いまは自動検証で停止理由を直してください。</p>' : C.mode === '上級' ? '<p class="muted">p：出品可能な内容を出品します（入力中を除く）。</p>' : '') + list + result +
      '<div class="make-grid"><div class="make-source"><section class="card"><h2>取り込んだ内容</h2><h3>' + e(p.name) + '</h3><p>状態：' + e(p.condition + ' · ' + (p.conditionNote || '状態を確認してください')) + '</p><p>価格：' + C.money(p.cost) + '</p><p>仕入れ先：架空フリマ「こもれび市場」</p>' + gallery(p.images) + '</section><section class="card" id="buyer-preview">' + preview(d) + '</section></div><div class="make-review">' +
      '<section class="card" id="edit-content"><h2>AI が作った英語の出品内容</h2>' + field('タイトル', 'title', d.title) + '<small id="title-counter">' + d.title.length + ' / 80文字</small><label>説明<textarea data-field="description">' + e(d.description) + '</textarea></label><div class="field-grid">' + Object.keys(d.specifics).map(function (key) { return field(key + (d.required.includes(key) ? '（必須）' : ''), 'specific:' + key, d.specifics[key]); }).join('') + '</div>' +
      '<div id="category-edit"><label>カテゴリ候補<select data-category-choice><option value="">候補から選ぶ</option>' + d.candidates.map(function (c) { return '<option value="' + e(c) + '">' + e(c) + '</option>'; }).join('') + '</select></label><p id="category-confidence">' + e(d.category) + ' · 確度 ' + (Number.isFinite(d.confidence) ? d.confidence + '%（例）' : '—') + '</p></div>' +
      '<div class="field-grid" id="price-edit">' + field('販売価格 $（例・円換算はプレビュー）', 'gross', d.gross, 'number') + field('送料 ¥（例）', 'shipping', d.shipping, 'number') + field('仕入れ値 ¥（例）', 'cost', d.cost, 'number') + '</div><fieldset id="policy-edit"><legend>共通のポリシーと関税の案内（例）</legend>' +
      [['shipping', '配送', 'Tracked delivery'], ['returns', '返品', 'Returns within 30 days'], ['payment', '支払い', 'Managed payments'], ['duties', '関税', 'DDU', 'DDP']].map(function (a) { return '<label>' + a[1] + '<select data-setting="' + a[0] + '"><option value="">未設定</option>' + a.slice(2).map(function (v) { return '<option' + (D.settings[a[0]] === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select></label>'; }).join('') + '<small>' + window.IdealHelp.term('DDP') + ' / ' + window.IdealHelp.term('DDU') + '：負担の案内の目安です。共通設定はこのセッションの全下書きに使います。</small></fieldset></section>' +
      '<section class="card" id="listing-checks">' + validation(d) + '</section><section class="card final-bar" id="final-bar">' + finalBar(d) + '</section></div></div>' + history() + M.card('create');
  }
  function refresh(main) {
    var d = current();
    main.querySelector('#buyer-preview').innerHTML = preview(d);
    main.querySelector('#listing-checks').innerHTML = validation(d);
    main.querySelector('#final-bar').innerHTML = finalBar(d);
    main.querySelector('#title-counter').textContent = d.title.length + ' / 80文字';
  }
  function publish(main, kind) {
    var options = {}, feedback = main.querySelector('#make-feedback');
    if (kind === 'schedule') {
      options.schedule = main.querySelector('#schedule-time').value;
      if (!options.schedule || !Number.isFinite(Date.parse(options.schedule)) || Date.parse(options.schedule) <= Date.now()) { feedback.textContent = '未来の予約日時を入力してください（例）。'; return; }
    }
    if (kind === 'override') {
      var reason = main.querySelector('#override-reason').value, context = main.querySelector('#override-context').value.trim();
      if (!reason || !context) { feedback.textContent = '理由を選び、判断の背景を入力してください。'; return; }
      options.mode = C.mode; options.reason = reason + '：' + context;
    }
    var row = D.publish(selected, options);
    if (!row) { if (feedback) feedback.textContent = '停止理由を確認してください。'; return; }
    resultRow = row; window.IdealShell.render();
  }
  function bind(main) {
    main.oninput = function (event) {
      var t = event.target, key = t.dataset.field, d = current();
      if (!key) return;
      if (key.indexOf('specific:') === 0) d.specifics[key.slice(9)] = t.value;
      else d[key] = ['gross', 'shipping', 'cost'].includes(key) ? (t.value === '' ? null : Number(t.value)) : t.value;
      refresh(main);
    };
    main.onchange = function (event) {
      var t = event.target;
      if (t.hasAttribute('data-category-choice') && t.value) { D.chooseCategory(current(), t.value); window.IdealShell.render(); }
      if (t.dataset.setting) { D.settings[t.dataset.setting] = t.value; refresh(main); }
    };
    main.onsubmit = function (event) {
      if (event.target.id !== 'import-example') return;
      event.preventDefault(); selected = event.target.elements.draft.value; resultRow = null; window.IdealShell.render();
    };
    main.onclick = function (event) {
      var b = event.target.closest('button'); if (!b) return;
      if (b.dataset.draftId) { selected = b.dataset.draftId; resultRow = null; window.IdealShell.render(); return; }
      if (b.dataset.focus) main.querySelector('[data-field="' + b.dataset.focus + '"]').focus();
      if (b.dataset.jump) { var section = main.querySelector('#' + b.dataset.jump); section.scrollIntoView({ block: 'center' }); section.querySelector('input,select,textarea').focus(); }
      var action = b.dataset.make;
      if (action === 'photos') { current().photos = product(current()).images.slice(); current().photoDamage = false; refresh(main); }
      if (['publish', 'schedule', 'override'].includes(action)) publish(main, action);
      if (action === 'save') { window.IdealShell.toast('下書きに戻しました。入力はこのセッション中に保持されます。'); window.IdealShell.render(); }
      if (action === 'withdraw-result') {
        D.listings = D.listings.filter(function (r) { return r.id !== resultRow.id; });
        D.drafts.find(function (d) { return d.id === resultRow.draftId; }).published = false;
        resultRow = null; window.IdealShell.render();
      }
    };
    main.onkeydown = function (event) {
      if (C.mode === '上級' && event.key === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) && !event.target.isContentEditable && V.validateListing(current(), D.settings).canPublish && !current().published) { event.preventDefault(); publish(main, 'publish'); }
    };
  }
  window.IdealScreens.create = { render: render, bind: bind, preview: preview, validation: validation, finalBar: finalBar };
})();
