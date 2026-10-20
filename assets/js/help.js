(function () {
  'use strict';
  var C = window.IdealCore, e = C.escape, glossary = window.IdealGlossary;
  var issues = ['確認中：画像と説明の表示差', '修正中：過去の取り込みが欠ける', '修正済み：通知の件数ずれ（過去分も修復済み）'];
  var serial = 0, active = null;
  function term(key, label) {
    if (!glossary[key]) throw new Error('Unknown glossary key: ' + key);
    var id = 'term-' + (++serial), entry = glossary[key];
    return '<span class="term-wrap"><button type="button" class="term" data-term="' + e(key) + '" aria-expanded="false" aria-describedby="' + id + '">' + e(label || key) + '</button>' +
      '<span hidden class="term-popover" role="tooltip" id="' + id + '">目安：' + e(entry.definition) + '<br>なぜ大事か：' + e(entry.why) + '<br>表示場所：' + e(entry.where) + '</span></span>';
  }
  function closeTerm() {
    if (!active) return;
    var button = active;
    var popover = document.getElementById(button.getAttribute('aria-describedby'));
    if (popover) popover.hidden = true;
    button.setAttribute('aria-expanded', 'false'); active = null;
    if (button.isConnected) button.focus();
  }
  function toggleTerm(button) {
    if (active === button) { closeTerm(); return; }
    closeTerm(); active = button;
    document.getElementById(button.getAttribute('aria-describedby')).hidden = false;
    button.setAttribute('aria-expanded', 'true');
  }
  function knownIssues() { return '<h3>既知の不具合（例）</h3><ul>' + issues.map(function (text) { return '<li>' + e(text) + '</li>'; }).join('') + '</ul>'; }
  function results(query) {
    return Object.keys(glossary).filter(function (key) { return (key + glossary[key].definition).toLowerCase().includes(String(query || '').toLowerCase()); }).map(function (key) {
      var g = glossary[key];
      return '<article><h3>' + e(key) + '</h3><p>目安：' + e(g.definition) + '</p><p>なぜ大事か：' + e(g.why) + ' · 表示場所：' + e(g.where) + '</p></article>';
    }).join('') || '<p>該当する用語はありません。</p>';
  }
  function dialog(tab) {
    tab = tab || 'shortcuts';
    return '<h2>ヘルプ ' + window.IdealMarks.component('termHelp') + '</h2><div role="tablist" aria-label="ヘルプの種類">' + [['shortcuts', 'ショートカット'], ['glossary', '用語集'], ['issues', '既知の不具合']].map(function (t) {
      return '<button role="tab" id="help-tab-' + t[0] + '" aria-controls="help-panel" aria-selected="' + (t[0] === tab) + '" data-help-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div><div role="tabpanel" id="help-panel" aria-labelledby="help-tab-' + tab + '">' +
      (tab === 'issues' ? knownIssues() : tab === 'glossary' ? '<label>用語を検索<input type="search" id="glossary-search"></label><div id="glossary-results" aria-live="polite">' + results('') + '</div>' : '<p>Tab：次へ ／ Shift + Tab：前へ ／ Enter：操作 ／ Escape：閉じる ／ ?：ヘルプ</p><p>上級：今日・メッセージは j / k で移動、Enterで開く。メッセージの r は返信欄、作るの p は出品、判断軸の e はフォーカスした行を編集します。</p>') + '</div>';
  }
  window.IdealHelp = { term: term, closeTerm: closeTerm, toggleTerm: toggleTerm, knownIssues: knownIssues, results: results, dialog: dialog };
})();
