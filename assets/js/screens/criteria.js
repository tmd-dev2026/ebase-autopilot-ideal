(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealCriteria, M = window.IdealMarks, e = C.escape;
  var editing = '', proposed, latestUndo, editingSource = '判断軸';
  var labels = { marginFloor: '利益率の下限（売値に対する手残りの割合 %）', avoid: '避ける商品', tone: '返信のトーン', discountLimit: '値下げの下限（元の価格から最大何%まで）', duties: '関税の既定', shipping: '配送ポリシー', returns: '返品ポリシー', payment: '支払いポリシー' };
  var explanations = { marginFloor: '売値に対する手残りの割合が下限未満なら警告します。', avoid: '扱わない商品と理由を残します。', tone: 'AI返信案で使う文体の例を選びます。', discountLimit: '元の価格から下げてよい幅を決めます。', duties: '下書きで使う関税の負担案内を揃えます。', shipping: '下書きで使う配送条件を揃えます。', returns: '下書きで使う返品条件を揃えます。', payment: '下書きで使う支払い条件を揃えます。' };
  var options = { tone: ['丁寧', 'フレンドリー', '簡潔'], duties: ['DDU', 'DDP'], shipping: ['', 'Tracked delivery'], returns: ['', 'Returns within 30 days'], payment: ['', 'Managed payments'] };
  var samples = D.replySamples;
  function describe(value) {
    return Array.isArray(value) ? value.map(function (r) { return ({ brand: 'ブランド', category: 'カテゴリ', condition: '状態' })[r.type] + '：' + r.value + '（' + r.reason + '）'; }).join(' / ') : String(value || '—');
  }
  function impactHTML() {
    var impact = A.preview(D, editing, proposed);
    function names(list) { return '<ul>' + list.map(function (name) { return '<li>' + e(name) + '</li>'; }).join('') + '</ul>'; }
    return '<h3>影響プレビュー ' + M.component('criteriaImpact') + '</h3><p>' + e(impact.text) + '</p>' + names(impact.names.slice(0, 5)) +
      (impact.count > 5 ? '<details><summary>ほか ' + (impact.count - 5) + ' 件</summary>' + names(impact.names.slice(5)) + '</details>' : '');
  }
  function editor() {
    var control;
    if (editing === 'avoid') {
      control = '<div class="avoid-chips">' + proposed.map(function (rule, i) {
        return '<span class="chip">' + e(describe([rule])) + '<button type="button" data-remove-avoid="' + i + '" aria-label="' + e(rule.value) + 'を削除">×</button></span>';
      }).join('') + '</div><div class="field-grid"><label>種類<select id="avoid-type"><option value="brand">ブランド</option><option value="category">カテゴリ</option><option value="condition">状態</option></select></label><label>避ける名前<input id="avoid-value"></label><label>項目の理由<input id="avoid-reason"></label></div><button type="button" data-criteria="add">避ける商品を追加</button>';
    } else if (editing === 'tone') {
      control = '<fieldset class="tone-options"><legend>返信のトーン</legend>' + options.tone.map(function (tone) {
        return '<label><input type="radio" name="tone" data-criteria-value value="' + e(tone) + '"' + (tone === proposed ? ' checked' : '') + '><span>' + e(tone) + '<br><span lang="en">' + e(samples[tone]) + '</span></span></label>';
      }).join('') + '</fieldset>';
    } else if (options[editing]) {
      control = '<label>' + e(labels[editing]) + '<select data-criteria-value>' + options[editing].map(function (v) { return '<option value="' + e(v) + '"' + (v === proposed ? ' selected' : '') + '>' + e(v || '未設定') + '</option>'; }).join('') + '</select></label>';
    } else {
      control = '<label>' + e(labels[editing]) + '（例）<input data-criteria-value type="number" min="0" max="100" value="' + e(proposed) + '"></label>';
    }
    return '<form id="criteria-form" novalidate class="criteria-editor"><h2>' + e(labels[editing]) + 'を編集</h2>' + control +
      '<div id="criteria-impact" aria-live="polite">' + impactHTML() + '</div>' +
      '<label>理由<select id="criteria-reason" required><option value="">選んでください</option>' + (editing === 'tone' ? ['返信の印象', '受信者の反応', 'その他'] : ['手数料', '為替', '返品', '競合価格', 'その他']).map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select></label>' +
      '<label>判断の背景（3文字以上）<textarea id="criteria-context" required minlength="3"></textarea></label>' +
      '<label>次回見直し日（任意）<input type="date" id="criteria-review-date"></label><p id="criteria-error" role="status"></p><button class="primary">理由を記録して保存</button><button type="button" data-criteria="cancel">やめる</button></form>';
  }
  function render() {
    if (D.pendingSettingChange) { editing = D.pendingSettingChange.key; proposed = D.pendingSettingChange.value; editingSource = D.pendingSettingChange.source; D.pendingSettingChange = null; }
    var advanced = C.mode === '上級';
    var groups = [['価格の考え方', ['marginFloor', 'discountLimit']], ['避ける商品', ['avoid']], ['返信のトーン', ['tone']], ['関税・配送ポリシー', ['duties', 'shipping', 'returns', 'payment']]];
    var terms = { marginFloor: '手残り', duties: 'DDU', shipping: 'シッピングポリシー', returns: '返品ポリシー' };
    var rows = groups.map(function (group) {
      return '<h3>' + group[0] + '</h3>' + group[1].map(function (key) {
        var label = e(labels[key]) + (terms[key] ? '（' + window.IdealHelp.term(terms[key]) + (key === 'duties' ? ' / ' + window.IdealHelp.term('DDP') : '') + '）' : '');
        return '<div id="setting-' + key + '" tabindex="0" data-setting-row="' + key + '"><div class="setting-row"><div><strong>' + label + '</strong>' + (C.mode === 'はじめて' ? '<p class="muted">' + e(explanations[key]) + '</p>' : '') + '</div><div>' + e(describe(D.settings[key])) + '</div>' +
          (advanced ? '<span data-impact-count>影響 ' + A.preview(D, key, editing === key ? proposed : D.settings[key]).count + ' 件（例）</span>' : '') + '<button data-edit="' + key + '">編集</button></div>' + (editing === key ? editor() : '') + '</div>';
      }).join('');
    }).join('');
    return C.pageHeader('判断軸') + '<p class="muted">このブラウザに保存(試作) · ' + e(D.storageError || '') + '</p><button data-action="reset-preferences">初期状態に戻す</button>' + '<section class="card criteria-settings' + (advanced ? ' criteria-table' : '') + '"><p>一度決めた基準を使い続け、変えた理由も残します。</p>' +
      (C.mode === 'はじめて' ? '<p>まずこの3つだけ：利益率の下限・避ける商品・返信のトーン</p>' : advanced ? '<p>行にフォーカスして e：編集</p>' : '') + rows + '</section>'  + '<section class="card"><h2>判断の履歴 ' + M.component('criteriaHistory') + '</h2>' +
      (D.decisions.slice().reverse().map(function (d, index) { return '<p>' + e(d.date + ' · ' + d.who + ' · ' + d.what + ' · 理由：' + d.reason) + '</p><p class="muted">' + e((d.id || '') + ' · ' + (d.source || '') + ' · ' + (d.mode || '') + ' · ' + (d.fromLabel || '') + ' → ' + (d.toLabel || '') + ' · ' + (d.tags || []).join('・') + ' · 次回見直し日：' + (d.reviewDate || '未指定') + ' · 影響 ' + ((d.impact || {}).count || 0) + ' 件：' + ((d.impact || {}).names || []).join('・') + ' · ' + (d.version || 'モデル・判断軸 v10（試作の例）')) + '</p>' + (index === 0 && latestUndo && d.key ? '<button data-criteria="undo">元に戻す</button>' : ''); }).join('') || '<p>判断はまだありません。</p>') + '</section>' + M.card('criteria');
  }
  function start(key) {
    editing = key; editingSource = '判断軸'; proposed = JSON.parse(JSON.stringify(D.settings[key]));
    window.IdealShell.render();
    var field = document.querySelector('#criteria-form input, #criteria-form select');
    if (field) field.focus();
  }
  function bind(main) {
    main.onclick = function (event) {
      var b = event.target.closest('button'); if (!b) return;
      if (b.dataset.edit) { start(b.dataset.edit); return; }
      if (b.dataset.criteria === 'cancel') editing = '';
      if (b.dataset.criteria === 'undo' && latestUndo && latestUndo() === false) window.IdealShell.toast(D.lastError || '後の操作があるため元に戻せません');
      if (b.dataset.removeAvoid !== undefined) proposed.splice(Number(b.dataset.removeAvoid), 1);
      if (b.dataset.criteria === 'add') {
        var value = main.querySelector('#avoid-value').value.trim(), reason = main.querySelector('#avoid-reason').value.trim();
        if (!value || !reason) { window.IdealShell.toast('避ける名前と項目の理由を入力してください'); return; }
        proposed.push({ type: main.querySelector('#avoid-type').value, value: value, reason: reason });
      }
      if (b.dataset.criteria || b.dataset.removeAvoid !== undefined) window.IdealShell.render();
    };
    main.oninput = function (event) {
      if (!event.target.hasAttribute('data-criteria-value')) return;
      proposed = ['marginFloor', 'discountLimit'].includes(editing) ? (event.target.value === '' ? NaN : Number(event.target.value)) : event.target.value;
      main.querySelector('#criteria-impact').innerHTML = window.IdealHelp.annotate(impactHTML());
      var cell = main.querySelector('#setting-' + editing + ' [data-impact-count]');
      if (cell) cell.textContent = '影響 ' + A.preview(D, editing, proposed).count + ' 件（例）';
    };
    main.onsubmit = function (event) {
      if (event.target.id !== 'criteria-form') return;
      event.preventDefault();
      var reason = main.querySelector('#criteria-reason').value, context = main.querySelector('#criteria-context').value.trim();
      if (!reason || context.length < 3) { main.querySelector('#criteria-error').textContent = '理由と3文字以上の背景が必要です。'; return; }
      var undo = A.save(D, editing, proposed, reason + '：' + context, { mode: C.mode, source: editingSource, tags: [reason], reviewDate: (main.querySelector('#criteria-review-date') || {}).value || '' });
      if (!undo) { main.querySelector('#criteria-error').textContent = (['marginFloor', 'discountLimit'].includes(editing) ? '数値は0〜100で入力してください。' : '変更内容を確認してください。同じ設定は保存しません。'); return; }
      latestUndo = undo; editing = '';
      window.IdealShell.render(); window.IdealShell.toastUndo('判断と理由を保存しました（試作）', undo);
    };
    main.onkeydown = function (event) {
      if (C.mode !== '上級' || event.key !== 'e' || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
      var row = event.target.closest('[data-setting-row]');
      if (row) { event.preventDefault(); start(row.dataset.settingRow); }
    };
  }
  window.IdealScreens.criteria = { render: render, bind: bind };
})();
