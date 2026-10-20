'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
let app, w, D, A, U, main;
function fresh() {
  app = boot(); w = app.window; D = w.IdealData; A = w.IdealAftersale; U = w.IdealAfterUI;
  main = app.node('main'); main.querySelector = s => app.node(s);
}
function route(name) { w.location.hash = '#/' + name; w.IdealShell.render(); }
function click(dataset) {
  main.onclick({ target: { closest: () => ({ dataset, hasAttribute: key => key === 'data-counter-offer' && dataset.counterOffer !== undefined }) } });
}
function undoLast() {
  const html = app.node('toasts').children.at(-1).innerHTML;
  assert.match(html, /元に戻す/);
  app.click('undo', html.match(/data-id="([^"]+)"/)[1]);
}
function badges() {
  assert.equal(D.badges().orders, D.orders.filter(r => r.state === '発送待ち').length);
  assert.equal(D.badges().messages, D.conversations.filter(r => r.unread).length);
  for (const [name, n] of Object.entries(D.badges())) {
    if (n) assert.match(w.IdealShell.nav(), new RegExp('data-badge="' + name + '"[^>]*>' + n + '</span>'));
    else assert.doesNotMatch(w.IdealShell.nav(), new RegExp('data-badge="' + name + '"'));
  }
}
fresh();
assert.equal(D.orders.length, 6); assert.equal(D.conversations.length, 5);
assert.equal(D.returnCases.length, 2); assert.equal(D.watchers.length, 6); assert.equal(D.ads.length, 5); assert.equal(D.sentOffers.length, 2);
assert.equal(new Set(D.orders.map(o => o.product)).size, 6);
assert.equal(D.conversations[0], D.items.find(i => i.id === 'message-watch'));
assert.equal(D.incomingOffer, D.items.find(i => i.id === 'offer-figure'));
badges();
for (const mode of w.IdealCore.modes) {
  w.IdealCore.setMode(mode);
  for (const name of ['orders', 'messages', 'returns', 'offers', 'ads', 'reports']) {
    route(name);
    assert.equal((main.innerHTML.match(/<h1>/g) || []).length, 1);
    assert.match(main.innerHTML, /本物との対応/);
    assert.doesNotMatch(main.innerHTML, /この画面は次の段階|undefined|NaN|⚒|✉|🚚/);
    assert.match(main.innerHTML, /（例）/);
    if (mode === 'はじめて') assert.match(main.innerHTML, /いまやること/);
    if (mode === '上級') assert.match(main.innerHTML, /after-dense/);
    const header = main.innerHTML.match(/<div class="page-header">(.*?)<\/div>/)[1];
    assert.ok((header.match(/class="primary"/g) || []).length <= 1);
  }
}
// Both shipment entry points share validation and require confirmation.
fresh();
for (const name of ['orders', 'today']) {
  route(name);
  const submit = value => app.listeners.submit({ preventDefault() {}, target: { dataset: { shipment: 'ship-camera' }, elements: { tracking: { value } } } });
  for (const invalid of ['', 'SHORT', 'TRACK 123', 'x'.repeat(31)]) { submit(invalid); app.click('confirm'); assert.equal(D.counts().shipment, 2); }
  assert.match(U.trackingHTML(D.orders[0]), /type="submit" disabled/);
  const reason = {}, button = {};
  const form = { dataset: { shipment: 'ship-camera' }, querySelector: s => s === '[data-tracking-reason]' ? reason : button };
  const input = { dataset: {}, name: 'tracking', value: 'TRACK-123', closest: () => form, setAttribute(k, v) { this[k] = v; } };
  app.listeners.input({ target: input });
  assert.equal(button.disabled, false); assert.equal(reason.textContent, '');
  assert.equal(D.items.find(i => i.id === 'ship-camera').tracking, 'TRACK-123');
  submit('TRACK-123'); assert.equal(D.counts().shipment, 2);
  assert.match(app.node('dialog').innerHTML, /追跡番号をeBayに登録します・購入者に発送通知が届きます・取り消せません/);
  app.click('close'); app.click('confirm'); assert.equal(D.counts().shipment, 2);
  submit('TRACK-123'); app.click('confirm');
  assert.equal(D.orders[0].state, '発送済み'); assert.equal(D.counts().shipment, 1); badges();
  assert.doesNotMatch(w.IdealToday.render(), /data-task="ship-camera"/);
  undoLast(); assert.equal(D.counts().shipment, 2); badges();
  D.orders[0].tracking = '';
}
assert.equal(D.prepareAftersale('ship', 'ship-camera', 'bad'), null);
assert.equal(D.executeAftersale({ kind: 'ship', id: 'ship-camera', value: 'TRACK-123' }), null);
route('orders'); assert.match(main.innerHTML, /期限超過/); assert.match(main.innerHTML, /期限が近い/);
assert.match(main.innerHTML, /source[^>]*disabled/); assert.match(main.innerHTML, /キャンセル連絡の案内/);
assert.match(main.innerHTML, /見込み ¥2,000 \/ \$12.90（例）／実際 ¥5,020/);
assert.match(main.innerHTML, /⚠ 赤字：送料の見込み違い/);
// Two-pane messages: a synthetic send click without a preview cannot send.
fresh(); route('messages');
click({ after: 'execute' }); assert.equal(D.conversations[0].sent.length, 0);
main.oninput({ target: { dataset: { reply: 'message-watch' }, value: 'Exact reply <safe>' } });
click({ after: 'message', id: 'message-watch' });
assert.equal(D.conversations[0].unread, true);
assert.match(main.innerHTML, /宛先：Alex Example/); assert.match(main.innerHTML, /Exact reply &lt;safe&gt;/);
assert.match(main.innerHTML, /data-after="execute"[^>]*>送信/);
click({ after: 'cancel' }); click({ after: 'execute' }); assert.equal(D.conversations[0].sent.length, 0);
click({ after: 'message', id: 'message-watch' });
D.conversations[0].draft = 'Changed after preview';
click({ after: 'execute' }); assert.equal(D.conversations[0].sent[0], 'Exact reply <safe>');
assert.equal(D.counts().message, 1); assert.equal(D.conversations[0].replied, true); badges();
assert.doesNotMatch(w.IdealToday.render(), /data-task="message-watch"/);
undoLast(); assert.equal(D.counts().message, 2); assert.equal(D.conversations[0].sent.length, 0); badges();
click({ conversation: 'message-delay' });
assert.match(main.innerHTML, /41%（例）/); assert.match(main.innerHTML, /人が書いてください。AIの案は参考です/);
click({ after: 'message', id: 'message-delay' });
assert.match(main.innerHTML.match(/aria-label="実行内容の確認"[\s\S]*/)[0], /人が書いてください/);
click({ after: 'cancel' }); click({ conversation: 'message-watch' });
assert.match(main.innerHTML, /92%（例）/); assert.doesNotMatch(main.innerHTML, /人が書いてください/);
click({ conversation: 'message-photo' }); assert.match(main.innerHTML, /&lt;img onerror=/); assert.doesNotMatch(main.innerHTML, /<img onerror=/);
// Stale confirmations are discarded across navigation and mode changes.
click({ after: 'message', id: 'message-photo' }); route('ads'); route('messages'); click({ after: 'execute' });
assert.equal(D.conversations[4].sent.length, 0);
click({ after: 'message', id: 'message-photo' }); w.IdealCore.setMode('上級'); w.IdealShell.render(); click({ after: 'execute' });
assert.equal(D.conversations[4].sent.length, 0);
// Actual message keyboard handler, including input guard.
const rowNodes = D.conversations.map(r => ({ dataset: { conversation: r.id }, focus() { app.document.activeElement = this; } }));
main.querySelectorAll = () => rowNodes;
app.document.activeElement = rowNodes[0];
main.onkeydown({ key: 'j', target: { tagName: 'BUTTON' }, preventDefault() {} }); assert.equal(app.document.activeElement, rowNodes[1]);
main.onkeydown({ key: 'k', target: { tagName: 'BUTTON' }, preventDefault() {} }); assert.equal(app.document.activeElement, rowNodes[0]);
main.onkeydown({ key: 'Enter', target: { tagName: 'BUTTON', dataset: { conversation: 'message-lens' } }, preventDefault() {} });
assert.match(main.innerHTML, /thread-open/);
main.onkeydown({ key: 'r', target: { tagName: 'MAIN' }, preventDefault() {} }); assert.equal(app.document.activeElement, app.node('#reply-text'));
main.onkeydown({ key: 'j', target: { tagName: 'TEXTAREA' }, preventDefault() { throw Error('input shortcut fired'); } });
// Today also uses the same guarded send handler and updates the inbox.
route('today'); app.node('[data-draft="message-watch"]').value = 'Today exact reply'; app.click('message', 'message-watch');
app.click('confirm'); assert.equal(D.conversations[0].sent[0], 'Today exact reply'); assert.equal(D.badges().messages, 1); undoLast(); badges();
// Refund is the second explicit click; preview never mutates orders.
fresh(); route('returns'); const caseRow = D.returnCases[0], order = D.orders.find(o => o.id === caseRow.orderId);
click({ after: 'execute' }); assert.equal(order.refund, 0);
click({ after: 'refund', id: caseRow.id }); assert.equal(order.refund, 0);
assert.match(main.innerHTML, /返金は取り消せない/); assert.match(main.innerHTML, /¥15,500 \/ \$100.00/);
assert.match(main.innerHTML, /¥-16,345 \/ \$-105.45/); assert.match(main.innerHTML, /手数料・実送料・仕入れ値が残るため/);
assert.match(main.innerHTML, /影響を理解して返金する（試作のみ）/); assert.match(main.innerHTML, /将来/);
click({ after: 'cancel' }); click({ after: 'execute' }); assert.equal(order.refund, 0);
click({ after: 'refund', id: caseRow.id }); click({ after: 'execute' }); assert.equal(order.refund, 100); assert.equal(caseRow.step, 4);
click({ after: 'execute' }); assert.equal(order.refund, 100);
undoLast(); assert.equal(order.refund, 0); assert.equal(caseRow.step, 1);
main.oninput({ target: { dataset: { caseDraft: caseRow.id }, value: 'Please share a photo.' } });
click({ after: 'case-message', id: caseRow.id }); assert.equal(caseRow.sent.length, 0);
assert.match(main.innerHTML, /宛先：Morgan Example/); click({ after: 'execute' }); assert.equal(caseRow.sent[0], 'Please share a photo.'); undoLast(); assert.equal(caseRow.sent.length, 0);
// Incoming loss blocks accept, including synthetic clicks. Watcher losses block all modes.
fresh(); route('offers');
assert.match(main.innerHTML, /data-after="accept"[^>]*disabled/);
click({ after: 'accept', id: 'offer-figure' }); click({ after: 'execute' }); assert.equal(D.counts().offer, 1);
click({ after: 'decline', id: 'offer-figure' }); assert.equal(D.counts().offer, 1);
click({ after: 'execute' }); assert.equal(D.counts().offer, 0); assert.equal(D.incomingOffer.outcome, '辞退');
assert.doesNotMatch(w.IdealToday.render(), /data-task="offer-figure"/); undoLast(); assert.equal(D.counts().offer, 1);
click({ after: 'counter', id: 'offer-figure' }); assert.match(main.innerHTML, /¥1,822/); click({ after: 'execute' }); assert.equal(D.counts().offer, 0); undoLast();
const watcher = D.watchers[5];
// Positive control uses real form input; changing cost gives a real negative result.
watcher.cost = 100000;
main.oninput({ target: { dataset: { discount: watcher.id }, value: '50', hasAttribute: () => false } });
assert.match(app.node('#offer-' + watcher.id).innerHTML, /赤字になるため送れません/);
assert.match(app.node('#offer-' + watcher.id).innerHTML, /data-after="watcher-offer"[^>]*disabled/);
for (const mode of w.IdealCore.modes) {
  w.IdealCore.setMode(mode); w.IdealShell.render();
  click({ after: 'watcher-offer', id: watcher.id }); click({ after: 'execute' }); assert.equal(D.sentOffers.length, 2);
}
watcher.cost = 1000; watcher.gross = 250; watcher.discount = 10;
w.IdealShell.render(); click({ after: 'watcher-offer', id: watcher.id });
assert.match(main.innerHTML, /ウォッチ8人にオファーを送ります・送信後は取り消せません/);
assert.equal(D.sentOffers.length, 2); click({ after: 'execute' }); assert.equal(D.sentOffers.length, 3);
assert.equal(D.sentOffers[2].gross, 225); assert.match(main.innerHTML, /返答待ち/); undoLast(); assert.equal(D.sentOffers.length, 2);
const ticket = D.prepareAftersale('watcher-offer', watcher.id, 10); watcher.cost = 100000;
assert.equal(D.executeAftersale(ticket), null); assert.equal(D.sentOffers.length, 2);
// Listing edits are reflected in watcher prices; offers do not change the listing price.
const linked = D.watchers[5];
linked.listing.gross = 300;
assert.equal(linked.gross, 300);
linked.listing.state = 'eBay終了';
assert.equal(D.prepareAftersale('watcher-offer', linked.id, 5), null);
// A changed financial impact must be previewed again.
const refundCase = D.returnCases[0];
const staleRefund = D.prepareAftersale('refund', refundCase.id);
D.orders.find(o => o.id === refundCase.orderId).actualShipping += 100;
assert.equal(D.executeAftersale(staleRefund), null);
// Ad effects and reversible switches.
fresh(); route('ads');
for (const text of ['効いている', '赤字になっている', 'データが少ない—']) assert.ok(main.innerHTML.includes(text));
click({ ad: 'ad-0' }); assert.equal(D.ads[0].on, false);
assert.match(main.innerHTML, /role="switch" aria-checked="false"/); assert.match(main.innerHTML, /止めると表示が減る可能性があります・いつでも再開できます/);
undoLast(); assert.equal(D.ads[0].on, true);
// Reports and 今日 use the same aggregates, with a full text alternative for the SVG.
route('reports'); const report = A.reports(D.orders, D.listings);
const sum = D.orders.filter(o => o.state === '完了').reduce((s, o) => s + A.balance(o).yen - o.refund * 155, 0);
assert.equal(report.confirmed, sum);
assert.equal(report.gap, D.orders.reduce((s, o) => s + (o.actualShipping === null ? 0 : o.actualShipping - o.shipping), 0));
assert.ok(main.innerHTML.includes(w.IdealCore.money(sum)));
assert.match(main.innerHTML, /<svg[^>]*role="img"/); assert.match(main.innerHTML, /グラフのテキスト代替/);
assert.match(main.innerHTML, /class="metric estimated"/); assert.match(main.innerHTML, /class="metric confirmed"/);
assert.match(main.innerHTML, /割合25%/); assert.match(main.innerHTML, /送料の見込み違い/);
for (const d of report.days) assert.ok(main.innerHTML.includes(w.IdealCore.money(d.yen)));
assert.ok(w.IdealToday.render().includes(w.IdealCore.money(sum)));
D.orders[4].actualShipping += 100; route('reports');
assert.equal(A.reports(D.orders, D.listings).confirmed, sum - 100);
assert.ok(main.innerHTML.includes(w.IdealCore.money(sum - 100)));
// Copy and offline rules cover every new production script, with positive controls.
const paths = ['aftersale.js', 'aftersale-ui.js', 'data-aftersale.js', ...['orders', 'messages', 'returns', 'offers', 'ads', 'reports'].map(r => 'screens/' + r + '.js')];
const source = paths.map(p => fs.readFileSync('assets/js/' + p, 'utf8')).join('\n');
const forbidden = /必ず稼げ|利益保証|収入保証|確実に儲|誰でも月収|guaranteed income|\b(?:Nike|Sony|Canon|Nikon|Rolex|Gucci)\b/i;
assert.equal(forbidden.test(source), false); assert.equal(forbidden.test('Sony'), true); assert.equal(forbidden.test('利益保証'), true);
assert.doesNotMatch(source, /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
assert.match(source, /手順は例です。eBayの最新の規定は eBay の画面で確認してください/);
const css = fs.readFileSync('assets/css/app.css', 'utf8');
assert.match(css, /\.after-table thead\s*\{\s*display: none/);
assert.match(css, /\.message-layout:not\(\.thread-open\) \.conversation-thread/);
assert.match(css, /\.after-screen button[^}]+min-height: 44px/);
assert.doesNotMatch(css, /font-size:\s*(?:[0-9]|1[01])px/);
console.log('PASS stage 3: six routes in three modes, shared state, guarded confirmations, refund impacts, live offers, loss blocks, switches, keyboard, escaping, reports and undo');
