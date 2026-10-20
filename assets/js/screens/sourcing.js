(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, S = window.IdealSourcing, M = window.IdealMarks, e = C.escape;
  var query = '', pasted = '', notice = '', overrideId = '', lastImported = null;
  var future = 'eBay の売れた実績の取得には制約があり、この試作ではダミーです。本物にするには新しい取得方法の確認が要ります';
  var risks = {
    '電池内蔵': ['電池内蔵', '電池の種類と配送条件を仕入れ前に確認してください。'],
    '本革': ['本革', '素材の種類と輸入条件を確認してください。'],
    '製品安全': ['製品安全チェック', '対象商品の安全情報を確認してください。'],
    '真贋の確認': ['真贋の確認', '正規品と判断できる根拠を確認してください。']
  };
  function rowById(id) { return D.research.find(function (r) { return r.id === id; }); }
  function profit(row) {
    var money = S.costs(row).takeHome;
    return '<span class="' + (money && money.yen < 0 ? 'loss' : '') + '">手残り ' + (money && money.yen < 0 ? '⚠ 赤字 ' : '') + C.money(money && money.yen) + '（例）</span>';
  }
  function continuation(item) { return '<a href="#/' + (D.drafts.includes(item) ? 'create/' : 'listings/') + e(item.id) + '">' + (D.drafts.includes(item) ? '作る で続ける' : '既存の出品を見る') + '</a>'; }
  function next(row) {
    if (S.imported(D, row)) return continuation(S.imported(D, row));
    var gate = S.gate(D, row, C.mode);
    return '<p id="stop-' + row.id + '" class="muted">' + e(gate.reason) + (gate.reason ? ' <a href="#/criteria">この判断軸を見る/直す</a>' : '') + '</p>' +
      '<button data-source="import" data-id="' + row.id + '" aria-describedby="stop-' + row.id + '"' + (gate.blocked ? ' disabled' : '') + '>取り込む</button>' +
      (gate.override && C.mode === '上級' ? '<button data-source="override" data-id="' + row.id + '">理由を記録して取り込む</button>' : '') +
      (overrideId === row.id && gate.override && C.mode === '上級' ? '<form id="source-override"><label>判断の理由（3文字以上）<textarea name="reason" required minlength="3"></textarea></label><button>この判断で取り込む（理由を記録）</button></form>' : '');
  }
  function researchRow(row) {
    var cost = S.costs(row);
    return '<article class="card research-row"><div class="research-heading">' + (row.images.length ? '<img src="assets/img/' + e(row.images[0].file) + '" alt="" width="40" height="40">' : '<span class="photo-placeholder">写真なし</span>') + '<h2>' + e(row.name) + '</h2></div><p>' + e(row.market) + ' · 仕入れ値 ' + C.money(row.cost) + '（例）</p><p class="muted">URL例：' + e(row.url) + '</p>' +
      '<h3>全コスト込みの利益 ' + M.component('sourcingProfit') + '</h3><dl class="cost-breakdown">' +
      [['売値', row.gross * 155], ['仕入れ値', row.cost], ['国内送料', row.domestic], ['国際送料', row.international], ['手数料 13.25%＋1.35%＋$0.40 / ¥62', cost.fee], ['関税の目安', row.duty]].map(function (pair) { return '<div><dt>' + pair[0] + '</dt><dd>' + C.money(pair[1]) + '（例）</dd></div>'; }).join('') + '</dl><p>為替 ¥155 / $1（例） · ' + profit(row) + '</p>' +
      '<div class="market-facts"><p>相場の比較材料 ' + M.component('sourcingSales') + ' · 同じ商品の売れた例 ' + row.sold + ' 件(例)・出品中 ' + row.active + ' 件(例)</p><details><summary>取得の制約について</summary><p>' + future + '</p></details></div>' +
      '<p class="source-rule-result">' + e(S.gate(D, row, C.mode).reason || '判断軸の条件内です') + '</p><div class="source-risks"><h3>規制・禁止の確認 ' + M.component('sourcingRisk') + '</h3>' + row.risks.map(function (risk) { return '<p><span class="chip">' + e(risk) + '</span> ' + e(risks[risk][1]) + ' 用語：' + window.IdealHelp.term(risks[risk][0]) + '</p>'; }).join('') + '</div>' +
      '<div class="source-actions"><button data-source="candidate" data-id="' + row.id + '"' + (D.candidates.some(function (c) { return c.id === row.id; }) ? ' disabled' : '') + '>候補に入れる</button>' + next(row) + '</div></article>';
  }
  function research() {
    var found = D.research.filter(function (r) { return (r.name + r.url + r.category + r.brand).toLowerCase().includes(query.toLowerCase()); });
    if (!found.length) found = D.research;
    return '<section class="card"><form id="research-search"><label>URLまたはキーワード<input name="query" value="' + e(query) + '"></label><button>検索</button></form><p>試作のため結果は例です。キーワードに一致する商品を表示し、一致がない場合は全件を表示します。</p></section>' + found.map(researchRow).join('');
  }
  function candidates() {
    return '<section class="card"><h2>候補 ' + M.component('sourcingCandidates') + '</h2><p>合計 ' + D.candidates.length + ' 件（例） · ' + ['検討中', '取り込み済み', '見送り'].map(function (state) { return state + ' ' + D.candidates.filter(function (c) { return c.state === state; }).length + ' 件（例）'; }).join(' · ') + '</p>' +
      (D.candidates.length ? D.candidates.map(function (candidate) {
        var row = rowById(candidate.id);
        return '<article class="candidate-row"><h3>' + e(row.name) + '</h3><span class="chip">' + candidate.state + '</span> ' + profit(row) + (candidate.state === '見送り' ? '<button data-source="resume" data-id="' + row.id + '">検討を再開</button>' : next(row)) +
          (candidate.state === '検討中' ? '<button data-source="skip" data-id="' + row.id + '">見送る</button>' : '') + '<button data-source="remove" data-id="' + row.id + '">候補から削除</button></article>';
      }).join('') : '<p>候補はまだありません。<a href="#/sourcing">リサーチで候補を探す</a></p>') + '</section>';
  }
  function imports() {
    return '<section class="card"><h2>URLから取り込み ' + M.component('sourcingImport') + '</h2><form id="source-urls"><label>商品URL（1行に1件）<textarea name="urls" required>' + e(pasted) + '</textarea></label><button>取り込みを開始（例）</button></form><p class="muted">対応サイト(例)：架空の「こもれび市場」「ふるいち」。外部通信は行いません。</p><p>入力例：こもれび市場.example/holo-card</p><p>試作では取得中の表示後に結果が出ます。そのままお待ちください。</p></section><section class="card" aria-live="polite"><h2>取り込み結果</h2>' +
      (D.importJobs.map(function (job) { return '<article class="import-job"><p>' + e(job.url) + '</p><p>取得中 → ' + e(job.status) + ' · ' + e(job.reason || '') + '</p>' + (job.draft ? '<h3>' + e(job.draft.title || job.draft.name) + '</h3>' + (job.draft.photos || []).slice(0, 1).map(function (p) { return '<img width="80" src="assets/img/' + e(p.file) + '" alt="取り込んだ商品">'; }).join('') + '<p>' + C.money(job.draft.gross * 155) + '</p><a href="#/' + (D.drafts.includes(job.draft) ? 'create/' : 'listings/') + job.draft.id + '">次の一手：' + (D.drafts.includes(job.draft) ? '作る へ' : '既存の出品を見る') + '</a>' : job.row ? next(job.row) : '') + '</article>'; }).join('') || '<p>まだ取り込んでいません。</p>') + '</section>';
  }
  function render(route) {
    return C.pageHeader(D.title(route)) + (C.mode === 'はじめて' ? '<p class="next-step">いまやること：' + ({ sourcing: '費用と警告を確認し、候補に入れるか取り込んでください。', candidates: '候補の手残りを確認して取り込んでください。', import: '例の商品URLを入力し、結果から作るへ進んでください。' })[route] + '</p>' : '') +
      '<div class="sourcing-content ' + (C.mode === '上級' ? 'source-dense' : '') + '"><p role="status">' + e(notice) + (lastImported ? ' ' + continuation(lastImported) : '') + '</p>' + ({ sourcing: research, candidates: candidates, import: imports })[route]() + '</div>' + M.card(route);
  }
  function doImport(row, reason) {
    var result = S.importRow(D, row, C.mode, reason);
    notice = result.status + '：' + result.reason; overrideId = ''; lastImported = result.draft || null;
    window.IdealShell.render(); window.IdealShell.toast(notice, null, result.draft && result.draft.id);
    return result;
  }
  function bind(main) {
    main.onclick = function (event) {
      var button = event.target.closest('[data-source]'); if (!button) return;
      var id = button.dataset.id, action = button.dataset.source, row = rowById(id);
      if (!row) return;
      if (action === 'import') { doImport(row); return; }
      if (action === 'override') overrideId = id;
      if (action === 'candidate' && S.add(D, id)) window.IdealShell.toastUndo('候補に追加しました（例）', function () { S.remove(D, id); });
      if (action === 'remove') { var undo = S.remove(D, id); if (undo) window.IdealShell.toastUndo('候補から削除しました', undo); }
      if (action === 'skip' || action === 'resume') {
        var item = D.candidates.find(function (c) { return c.id === id; }), before = item.state;
        item.state = action === 'skip' ? '見送り' : '検討中';
        window.IdealShell.toastUndo('候補の状態を更新しました', function () { item.state = before; });
      }
      window.IdealShell.render();
    };
    main.onsubmit = function (event) {
      var form = event.target;
      if (!['research-search', 'source-urls', 'source-override'].includes(form.id)) return;
      event.preventDefault();
      if (form.id === 'research-search') query = form.elements.query.value.trim();
      if (form.id === 'source-override') { doImport(rowById(overrideId), form.elements.reason.value); return; }
      if (form.id === 'source-urls') {
        pasted = form.elements.urls.value;
        var jobs = pasted.split(/\n/).map(function (url) { return url.trim(); }).filter(Boolean).map(function (url) { return { url: url, status: '取得中' }; });
        D.importJobs = jobs;
        window.IdealShell.render();
        var finish = function () {
          jobs.forEach(function (job) {
            var result = S.resolve(D, job.url);
            if (result.row) { job.row = result.row; result = S.importRow(D, result.row, C.mode); }
            Object.assign(job, result);
          });
          var completed = jobs.filter(function (j) { return j.draft; }); lastImported = completed.length ? completed[completed.length - 1].draft : null;
          window.IdealShell.render(); window.IdealShell.toast('取り込み結果を確認してください（例）', null, lastImported && lastImported.id);
        };
        if (window.setTimeout) window.setTimeout(finish, 350); else Promise.resolve().then(finish);
        return;
      }
      window.IdealShell.render();
    };
  }
  ['sourcing', 'candidates', 'import'].forEach(function (route) { window.IdealScreens[route] = { render: function () { return render(route); }, bind: bind }; });
})();
