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
    var described = button.getAttribute('aria-describedby'), popover = described && document.getElementById(described);
    if (!popover) { var node = document.createElement('span'); node.id = 'inline-term-popup-' + (++serial); node.className = 'term-popover'; node.textContent = glossary[button.dataset.term].definition; button.appendChild(node); button.setAttribute('aria-describedby', node.id); popover = node; }
    popover.hidden = false;
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
  // Tokenize markup, wrapping only display text; form values, SVG and existing help are left intact.
  function annotate(html) {
    var stack = [], voids = ['input', 'img', 'br', 'hr', 'meta', 'link', 'path'];
    return html.replace(/<[^>]*>|[^<]+/g, function (token) {
      if (token[0] === '<') {
        var end = /^<\//.test(token), match = token.match(/^<\/?([a-z0-9]+)/i);
        if (!match) return token;
        var tag = match[1].toLowerCase();
        if (end) { for (var i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { stack.length = i; break; } }
        else if (!voids.includes(tag) && !/\/>$/.test(token)) stack.push({ tag: tag, skip: /term-wrap|term-popover|data-term=/.test(token) || ['textarea', 'option', 'script', 'style', 'svg'].includes(tag), interactive: ['button', 'a', 'summary'].includes(tag) });
        return token;
      }
      if (stack.some(function (r) { return r.skip; })) return token;
      return token.replace(/シッピングポリシー|返品ポリシー|カテゴリの確度|見込み\/確定|手残り|関税|ポリシー|DDP|DDU|見込み|確定/g, function (word) {
        var key = ['見込み', '確定'].includes(word) ? '見込み/確定' : word;
        if (stack.some(function (r) { return r.interactive; })) return '<span class="term-inline" data-term="' + e(key) + '" role="button" tabindex="-1" title="' + e(glossary[key].definition) + '">' + word + '</span>';
        return term(key, word);
      });
    }).replace(/（例）(?:（例）)+/g, '（例）');
  }
  window.IdealHelp = { annotate: annotate, term: term, closeTerm: closeTerm, toggleTerm: toggleTerm, knownIssues: knownIssues, results: results, dialog: dialog };
})();
