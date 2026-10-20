(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, A = window.IdealAftersale, U = window.IdealAfterUI, e = C.escape;
  var selected = D.conversations[0].id, opened = false, confirm = U.controller();
  function thread(row) {
    return U.heading('購入者との会話', '原文と根拠を読み、送る文面を確認してください。', 'human') +
      '<div class="thread-header"><h3>' + e(row.buyerName) + '</h3>' + U.product(row) + '<span class="badge-status" data-status="' + (row.replied ? 'sold' : 'scheduled') + '">' + (row.unread ? '未読' : row.replied ? '返信済み' : '既読・未返信') + '</span></div><p>購入者の原文（English・そのまま）</p><blockquote lang="en">' + e(row.buyer) + '</blockquote><p class="thread-summary"><strong>日本語の要約：</strong>' + e(row.summary) + '</p>' +
      '<p class="thread-meta muted">根拠：' + e(row.reason) + ' · 確信度 ' + (Number.isFinite(row.confidence) ? row.confidence + '%（例）' : '—') + '</p>' +
      (A.lowConfidence(row.confidence) ? '<p class="warning-notice" role="alert">人が書いてください。AIの案は参考です</p>' : '') +
      row.sent.map(function (s) { return '<p>送信済み（試作）</p><blockquote lang="en">' + e(s) + '</blockquote>'; }).join('') +
      '<p class="muted">返信のトーン：' + e(D.settings.tone) + '（AI生成時に使う文体の例）</p><p lang="en">' + e(D.replySamples[D.settings.tone]) + '</p><label>AI返信案（English・編集できます）<textarea rows="4" maxlength="2000" id="reply-text" data-reply="' + e(row.id) + '">' + e(row.draft) + '</textarea><span id="reply-counter">' + row.draft.length + ' / 2000文字</span></label>' + U.button('message', row.id, '確認して送信', !row.draft.trim(), true);
  }
  function render() {
    var row = D.conversations.find(function (r) { return r.id === selected; });
    return U.start('messages', '未読の会話を開き、返信案を確認してください。') +
      (C.mode === '上級' ? '<p>j / k：一覧を移動 · Enter：開く · r：返信欄へ</p>' : '') +
      '<div class="message-layout after-screen ' + (opened ? 'thread-open ' : '') + (C.mode === '上級' ? 'after-dense' : '') + '"><section class="card conversation-list">' + U.heading('受信箱', '未読の会話には「未読」と表示します。') +
      D.conversations.map(function (r) {
        return '<button class="conversation' + (C.mode === 'はじめて' && r.id === D.conversations[0].id ? ' next-step' : '') + '" data-conversation="' + e(r.id) + '" aria-pressed="' + (r.id === selected) + '">' + U.product(r) + '<span>' + e(r.buyerName) + ' · ' + (r.unread ? '● 未読' : r.replied ? '✓ 返信済み' : '既読・未返信') + '</span><span class="conversation-snippet">' + e(r.buyer) + '</span></button>';
      }).join('') + '</section><section class="card conversation-thread">' + U.button('back', '', '一覧に戻る') + thread(row) + confirm.html() + '</section></div>' + U.end('messages');
  }
  function bind(main) {
    main.oninput = function (event) {
      var t = event.target;
      if (!t.dataset.reply) return;
      var row = D.conversations.find(function (r) { return r.id === t.dataset.reply; }); row.draft = t.value; row.manuallyEdited = true;
      main.querySelector('#reply-counter').textContent = t.value.length + ' / 2000文字';
      var b = main.querySelector('[data-after="message"]');
      if (b) b.disabled = !t.value.trim() || t.value.length > 2000;
    };
    main.onclick = function (event) {
      var b = event.target.closest('button');
      if (!b) return;
      if (b.dataset.conversation) { U.cancelPending(); selected = b.dataset.conversation; opened = true; window.IdealShell.render(); }
      if (confirm.click(b.dataset.after)) return;
      if (b.dataset.after === 'back') { opened = false; window.IdealShell.render(); }
      if (b.dataset.after === 'message') confirm.prepare('message', selected, D.conversations.find(function (r) { return r.id === selected; }).draft);
    };
    main.onkeydown = function (event) {
      if (C.mode !== '上級' || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey) return;
      var rows = Array.from(main.querySelectorAll('[data-conversation]'));
      var index = rows.indexOf(document.activeElement);
      if (['j', 'k'].includes(event.key) && rows.length) {
        event.preventDefault();
        rows[index < 0 ? 0 : (index + (event.key === 'j' ? 1 : -1) + rows.length) % rows.length].focus();
      }
      if (event.key === 'Enter' && event.target.dataset.conversation) {
        event.preventDefault(); U.cancelPending(); selected = event.target.dataset.conversation; opened = true; window.IdealShell.render();
      }
      if (event.key === 'r') { event.preventDefault(); opened = true; window.IdealShell.render(); main.querySelector('#reply-text').focus(); }
    };
  }
  window.IdealScreens.messages = { render: render, bind: bind, thread: thread };
})();
