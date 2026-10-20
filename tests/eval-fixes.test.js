'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
function fresh() { const a = boot(); a.node('main').querySelector = s => a.node(s); return a; }
let a = fresh(), D = a.window.IdealData, V = a.window.IdealChecks;
// A1: a real repair changes content; unrelated blockers survive.
let row = D.listings[0]; D.settings.avoid = [];
row.title = ''; assert.equal(D.repair(row.id).result.canPublish, false); assert.equal(row.state, '要修正');
assert.equal(row.condition, '美品・縁に使用感あり'); row.title = 'Repaired item';
assert.equal(D.repair(row.id).result.canPublish, true); assert.equal(row.state, 'AI処理済');
// A2: direct publish cannot bypass confirmation; stale/frozen payload cannot publish.
let draft = D.drafts[0]; assert.equal(D.publish(draft.id), false);
let ticket = D.preparePublication(draft, {}); draft.gross++; assert.equal(D.publish(draft.id, { ticket }), false);
ticket = D.preparePublication(draft, {}); assert.ok(D.publish(draft.id, { ticket })); assert.equal(D.publish(draft.id, { ticket }), false);
a = fresh(); D = a.window.IdealData; row = D.listings[5];
// A3–4: rates, loss, unknown, stale and replayed bulk tickets.
for (const rate of [0, -10, 100, 200, '', NaN]) assert.equal(D.bulkPreview([row.id], 'price', rate).valid, false);
D.settings.discountLimit = 100;
for (let rate = 1; rate <= 50; rate++) assert.equal(D.bulkPreview([row.id], 'price', rate).valid, true);
assert.equal(D.bulkPreview([row.id], 'price', 90, 'ふだん', '理由あり').valid, false);
assert.equal(D.bulkPreview([row.id], 'price', 90, '上級', '理由あり').valid, true);
row.cost = null; assert.equal(D.bulkPreview([row.id], 'price', 10, '上級', '理由あり').unknown, 1); assert.equal(D.bulkPreview([row.id], 'price', 10, '上級', '理由あり').valid, false); row.cost = 7500;
ticket = D.bulkPreview([row.id], 'price', 10); row.gross++; assert.equal(D.applyBulk(ticket), null);
ticket = D.bulkPreview([row.id], 'price', 10); assert.equal(typeof D.applyBulk(ticket), 'function'); assert.equal(D.applyBulk(ticket), null);
// A5: older case-message undo cannot undo a later refund; balance is independently bounded.
let c = D.returnCases[0]; let undoMessage = D.executeAftersale(D.prepareAftersale('case-message', c.id, 'Reviewing the case.'));
assert.equal(typeof D.executeAftersale(D.prepareAftersale('refund', c.id)), 'function');
assert.equal(undoMessage(), false); assert.equal(c.refunded, true); c.refunded = false; assert.equal(D.prepareAftersale('refund', c.id), null);
// A6–8: disconnected operations, derived setup, duplicate identity, buyer-only shipping.
D.setConnection(false); assert.equal(D.preparePublication(D.drafts[0], {}), null); assert.equal(D.prepareAftersale('message', 'message-watch', 'Hello'), null); assert.equal(D.prepareAftersale('watcher-offer', D.watchers[5].id, 10), null);
assert.equal(D.steps[0][1], false); D.settings.shipping = ''; assert.equal(D.steps[1][1], false); D.completeStep(1); assert.equal(D.steps[1][1], false);
const n = D.drafts.length, imported = a.window.IdealSourcing.importRow(D, D.research[0], 'ふだん'); assert.equal(imported.status, '重複'); assert.equal(D.drafts.length, n);
draft = D.drafts[0]; draft.shipping = 12345; draft.buyerShipping = 500;
assert.doesNotMatch(a.window.IdealScreens.create.preview(draft), /12,345/); assert.match(a.window.IdealScreens.create.preview(draft), /500/);
// A9: lowering a threshold reports disappearing warnings.
D.settings.marginFloor = 99; assert.ok(a.window.IdealCriteria.preview(D, 'marginFloor', 0).count > 0);
assert.match(a.window.IdealScreens.orders.balance(D.orders[0]), /見込み/); assert.doesNotMatch(a.window.IdealScreens.orders.balance(D.orders[0]), />確定</);
console.log('PASS BRIEF10 A: repair validation, confirmation, bulk guards/tickets, refund conflicts, readiness, duplicates, buyer costs, rule impact and financial wording');
a = fresh(); D = a.window.IdealData;
assert.equal(D.counts().message, 4); assert.equal(D.badges().messages, D.conversations.filter(r => !r.replied).length);
assert.equal(D.counts().case, 2); assert.equal(D.badges().returns, 2); assert.equal(D.counts().source, 1);
assert.equal(D.active()[0].id, 'ship-camera');
let today = a.window.IdealToday.render(); assert.match(today, /期限超過/); assert.match(today, /あと 1 日/); assert.equal((today.match(/<strong>まずこれ<\/strong>/g) || []).length, 1);
assert.ok(today.indexOf('data-category="shipment"') < today.indexOf('data-category="fix"'));
D.conversations.push({ id: 'new-message', product: 'holo-card', unread: false, replied: false, sent: [], draft: 'Reply', summary: 'Question' }); assert.equal(D.counts().message, 5); assert.equal(D.badges().messages, 5);
D.returnCases.forEach(r => { r.closed = true; }); assert.equal(D.counts().case, 0); assert.doesNotMatch(a.window.IdealToday.render(), /data-category="case"/);
a.window.IdealCore.setMode('はじめて'); today = a.window.IdealToday.render(); assert.doesNotMatch(today, /まずは、次の一手から/); assert.match(today, /配送・返品・支払いの約束/);
assert.equal(D.orders.find(o => o.id === D.conversations.find(r => r.id === 'message-delay').orderId).state, '発送済み');
assert.ok(D.orders.every(o => o.inventoryId && o.listingNote));
console.log('PASS BRIEF10 B: full inbox, dynamic badges, cases, unfulfillable orders, urgency, sample integrity and single beginner guide');
// C: scan display text on every route; editable values and help definitions are not display labels.
a = fresh(); D = a.window.IdealData;
function uncoveredTerms(html) {
  const stack = [], misses = [];
  for (const token of html.match(/<[^>]*>|[^<]+/g) || []) {
    if (token[0] === '<') {
      const m = token.match(/^<(\/?)([\w-]+)/); if (!m) continue;
      const tag = m[2];
      if (m[1]) { const i = stack.map(x => x.tag).lastIndexOf(tag); if (i >= 0) stack.length = i; }
      else if (!['input', 'img', 'br', 'hr', 'path', 'meta', 'link'].includes(tag) && !token.endsWith('/>')) stack.push({ tag, exempt: /data-term=|term-popover/.test(token) || ['textarea', 'option', 'svg'].includes(tag) });
    } else if (!stack.some(x => x.exempt) && /手残り|関税|ポリシー|DDP|DDU|カテゴリの確度|見込み|確定/.test(token)) misses.push(token);
  }
  return misses;
}
assert.deepEqual(uncoveredTerms('<p>手残り</p>'), ['手残り']);
for (const [route, screen] of Object.entries(a.window.IdealScreens)) assert.deepEqual(uncoveredTerms(screen.render()), [], route);
assert.match(a.window.IdealGlossary.DDP.definition, /例|目安/); assert.match(a.window.IdealGlossary.DDU.definition, /迷ったら/);
assert.equal(a.window.IdealCore.money(-2148.7), '-¥2,149 / -$13.86（例）'); assert.match(a.window.IdealCore.money(1550000), /\$10,000.00/);
let timers = new Map(), timerId = 0;
a.window.setTimeout = (fn, ms) => { assert.equal(ms, 8000); timers.set(++timerId, fn); return timerId; };
a.window.clearTimeout = id => timers.delete(id);
a.window.IdealShell.toast('one'); a.window.IdealShell.toast('two'); a.window.IdealShell.toast('three'); assert.equal(a.node('toasts').children.length, 2);
let toast = a.node('toasts').children.at(-1); toast.onfocusin(); assert.equal(timers.has(timerId), false); toast.onfocusout(); timers.get(timerId)(); assert.equal(a.node('toasts').children.length, 1);
const css10 = fs.readFileSync('assets/css/app.css', 'utf8');
assert.match(css10, /@media \(max-width: 1023px\)[\s\S]*\.listings-table[^}]*display: block/);
assert.match(css10, /\.task-facts[^}]*white-space: normal; overflow: visible; text-overflow: clip/);
assert.match(css10, /\.final-bar button, a \{ min-height: 44px; min-width: 44px/);
assert.match(css10, /\.toasts \{ position: static/); assert.match(css10, /content: attr\(data-label\)/);
assert.match(a.window.IdealScreens.reports.render(), /data-label="売値"/);
assert.equal(D.prepareAftersale('counter', 'offer-figure', 99999), null);
assert.ok(D.prepareAftersale('counter', 'offer-figure', 120));
console.log('PASS BRIEF10 C: rendered glossary coverage, formatting, toast limit/timer/pause, phone cards/wrapping/taps, labelled reports and counter range');
// D1–3: withdrawing preserves failures; all rule consumers use the same real metadata.
a = fresh(); D = a.window.IdealData; V = a.window.IdealChecks;
row = D.listings[0]; assert.equal(typeof D.applyBulk(D.bulkPreview([row.id], 'withdraw')), 'function');
assert.equal(row.preWithdrawState, '要修正'); assert.equal(D.bulkPreview([row.id], 'relist').count, 0); assert.equal(D.applyBulk(D.bulkPreview([row.id], 'relist')), null);
let validRow = D.listings[5]; D.applyBulk(D.bulkPreview([validRow.id], 'withdraw')); assert.equal(D.bulkPreview([validRow.id], 'relist').count, 1); assert.equal(typeof D.applyBulk(D.bulkPreview([validRow.id], 'relist')), 'function');
assert.equal(D.bulkPreview([validRow.id], 'price', 99, '上級', '価格調整').valid, false);
assert.equal(D.bulkPreview([validRow.id], 'price', 40, 'ふだん').valid, false);
assert.equal(D.bulkPreview([validRow.id], 'price', 40, '上級', '価格調整').valid, true);
assert.equal(D.prepareAftersale('watcher-offer', D.watchers[5].id, 40), null);
let offerTicket = D.prepareAftersale('watcher-offer', D.watchers[5].id, 10); assert.ok(offerTicket);
assert.equal(D.prepareAftersale('watcher-offer', D.watchers[5].id, 10), null); D.cancelAftersale(offerTicket);
offerTicket = D.prepareAftersale('watcher-offer', D.watchers[5].id, 10); assert.equal(typeof D.executeAftersale(offerTicket), 'function'); assert.equal(D.prepareAftersale('watcher-offer', D.watchers[5].id, 10), null);
for (const rule of [{ type: 'brand', value: 'ニコラ', reason: 'ブランド確認' }, { type: 'brand', value: 'Nikora', reason: 'ブランド確認' }, { type: 'category', value: '腕時計', reason: '配送の確認' }]) {
  D.settings.avoid = [];
  const impact = a.window.IdealCriteria.preview(D, 'avoid', [rule]);
  const expected = D.listings.concat(D.drafts.filter(d => !d.published), D.research).filter(r => V.evaluate(r, { ...D.settings, avoid: [rule] }).avoided).map(r => r.id);
  assert.deepEqual(Array.from(impact.ids), Array.from(expected)); assert.ok(expected.length > 0);
  a.window.IdealCriteria.save(D, 'avoid', [rule], '条件を統一する');
  for (const r of D.drafts.filter(r => expected.includes(r.id))) assert.equal(V.validateListing(r, D.settings).checks.find(c => c.id === 'rules').status, 'block');
  for (const r of D.research.filter(r => expected.includes(r.id))) assert.match(a.window.IdealSourcing.gate(D, r, 'ふだん').reason, /避ける設定/);
}
D.settings.avoid = [{ type: 'category', value: '電池内蔵', reason: '配送の確認' }];
const removed = a.window.IdealCriteria.preview(D, 'avoid', []);
assert.ok(removed.ids.includes('film-camera')); assert.ok(removed.ids.includes('draft-1')); assert.ok(removed.ids.includes('listing-1')); assert.ok(!removed.ids.includes('listing-0'));
const beforeTone = D.conversations[0].draft;
assert.equal(a.window.IdealCriteria.preview(D, 'tone', '簡潔').count, 4);
a.window.IdealCriteria.save(D, 'tone', '簡潔', '返信を短くする'); assert.notEqual(D.conversations[0].draft, beforeTone); assert.match(D.conversations[0].draft, /I will check and reply/);
// D4–6: keyboard handlers retain useful focus and modal Tab/Esc is bounded.
a = fresh(); D = a.window.IdealData; a.window.IdealCore.setMode('上級');
let main10 = a.node('main');
a.window.location.hash = '#/messages'; a.window.IdealShell.render();
let conversations = D.conversations.map(r => { const n = a.node('[data-conversation="' + r.id + '"]'); n.dataset = { conversation: r.id }; n.tagName = 'BUTTON'; return n; });
main10.querySelectorAll = () => conversations;
function key10(key, target, extra = {}) { main10.onkeydown({ key, target, preventDefault() {}, ...extra }); }
key10('j', main10); key10('j', conversations[0]); assert.equal(a.document.activeElement, conversations[1]);
key10('Enter', conversations[1]); assert.equal(a.document.activeElement.dataset.conversation, conversations[1].dataset.conversation);
key10('r', conversations[1]); assert.equal(a.document.activeElement, a.node('#reply-text'));
a.window.location.hash = '#/listings'; a.window.IdealShell.render();
let controls = a.window.IdealScreens.listings.rows().map(r => { const n = a.node('[data-select="' + r.id + '"]'); n.dataset = { select: r.id }; n.tagName = 'INPUT'; return n; });
main10.querySelectorAll = () => controls;
controls[0].focus(); key10(' ', controls[0]); assert.equal(a.document.activeElement, controls[0]); assert.match(main10.innerHTML, /選択した 1 件/);
key10('j', controls[0]); assert.equal(a.document.activeElement, controls[1]); key10('k', controls[1]); assert.equal(a.document.activeElement, controls[0]);
key10(' ', controls[2], { shiftKey: true }); assert.match(main10.innerHTML, /選択した 3 件/);
key10('a', controls[2], { ctrlKey: true }); assert.match(main10.innerHTML, /選択した 12 件/);
key10('b', controls[2]); assert.equal(a.document.activeElement, a.node('.bulk-bar'));
const opener10 = a.node('opener'); opener10.isConnected = true; opener10.focus();
const first10 = a.node('modal-first'), last10 = a.node('modal-last'); a.node('dialog').querySelector = () => first10; a.node('dialog').querySelectorAll = () => [first10, last10];
first10.hidden = last10.hidden = false; a.click('legend'); assert.equal(a.document.activeElement, first10); last10.focus();
a.listeners.keydown({ key: 'Tab', target: last10, preventDefault() {} }); assert.equal(a.document.activeElement, first10);
a.listeners.keydown({ key: 'Tab', shiftKey: true, target: first10, preventDefault() {} }); assert.equal(a.document.activeElement, last10);
a.listeners.keydown({ key: 'Escape', target: last10, preventDefault() {} }); assert.equal(a.document.activeElement, opener10); assert.equal(a.node('dialog').open, false);
// D7–8: automation is truthful, changes have who/when/why, preferences round trip safely.
const store10 = {}; a = boot(store10); D = a.window.IdealData;
assert.equal(D.setAutomation('stock', false, true, ''), null); assert.equal(typeof D.setAutomation('stock', false, true, '在庫を手動確認'), 'function');
assert.match(a.window.IdealScreens.listings.render(), /監視停止中/); assert.match(a.window.IdealScreens.automation.render(), /依存/); assert.match(a.window.IdealToday.render(), /新しい検知はありません/);
assert.equal(D.automations[0].history[0].who, 'あなた'); assert.match(D.automations[0].history[0].time, /^\d{4}-/); assert.equal(D.automations[0].history[0].reason, '在庫を手動確認');
a.window.IdealCriteria.save(D, 'marginFloor', 25, '費用を見直す', { tags: ['手数料'], reviewDate: '2026-11-01' });
D.savedFilters = { search: 'カメラ', filter: '要修正', sort: 'name' }; D.persist();
let reload10 = boot(store10).window.IdealData; assert.equal(reload10.settings.marginFloor, 25); assert.equal(reload10.automations[0].on, false); assert.equal(reload10.savedFilters.search, 'カメラ'); assert.equal(reload10.decisions.length, D.decisions.length);
let blockedStorage10 = new Proxy({}, { get() { throw Error('blocked'); }, set() { throw Error('blocked'); } });
assert.doesNotThrow(() => { const b = boot(blockedStorage10); b.window.IdealCriteria.save(b.window.IdealData, 'marginFloor', 20, '費用を確認'); b.window.IdealData.persist(); });
// D9–11: confirmed publication increases counts and produces full append-only decisions.
a = fresh(); D = a.window.IdealData;
const low = D.drafts[2]; assert.equal(D.preparePublication(low, { mode: '上級', reason: '短' }), null);
ticket = D.preparePublication(low, { mode: '上級', reason: '在庫を整理' }); const count10 = D.listings.length;
assert.ok(D.publish(low.id, { mode: '上級', reason: '在庫を整理', ticket })); assert.equal(D.listings.length, count10 + 1);
for (const entry of D.decisions) { assert.ok(entry.id && entry.source && entry.mode && entry.impact && entry.tags && entry.version); assert.ok('reviewDate' in entry); assert.ok(entry.item && entry.listingId && entry.takeHome && Number.isFinite(entry.gross)); }
let undo10 = a.window.IdealCriteria.save(D, 'marginFloor', 20, '手数料の確認', { tags: ['手数料'], reviewDate: '2026-12-01' });
const decision10 = D.decisions.at(-1), length10 = D.decisions.length; assert.equal(undo10(), true); assert.equal(D.decisions.length, length10 + 1); assert.equal(D.decisions.at(-1).undoOf, decision10.id); assert.ok(D.decisions.includes(decision10)); assert.match(decision10.what, /売値に対する手残りの割合 %/); assert.doesNotMatch(decision10.what, /marginFloor/);
// D12–16: thread-bound tickets, ranges, reset destination and hash normalization.
a = fresh(); D = a.window.IdealData; main10 = a.node('main'); a.window.location.hash = '#/messages'; a.window.IdealShell.render();
function screenClick10(dataset) { main10.onclick({ target: { closest: () => ({ dataset }) } }); }
screenClick10({ after: 'message' }); screenClick10({ conversation: D.conversations[1].id }); screenClick10({ after: 'execute' }); assert.equal(D.conversations[0].sent.length, 0); assert.equal(D.conversations[1].sent.length, 0);
assert.ok(D.prepareAftersale('message', D.conversations[0].id, 'a'.repeat(2000))); assert.equal(D.prepareAftersale('message', D.conversations[0].id, 'a'.repeat(2001)), null);
assert.equal(a.window.IdealAftersale.tracking('A'.repeat(30)).valid, true); assert.equal(a.window.IdealAftersale.tracking('A'.repeat(31)).valid, false);
assert.match(a.window.IdealAfterUI.trackingHTML(D.orders[0]), /0 \/ 30文字/);
row = D.listings[0]; D.applyBulk(D.bulkPreview([row.id], 'reset')); assert.equal(row.state, 'AI処理済'); assert.equal(D.counts().fix, 2);
for (const [hash, route] of [['#/listings/../create', 'today'], ['#/unknown', 'today'], ['#/listings/%2e%2e/create', 'today'], ['#/create/draft-1', 'create'], ['#/today/ship-camera', 'today']]) { assert.equal(D.route(hash), route); a.window.location.hash = hash; a.window.IdealShell.render(); assert.equal(D.route(a.window.location.hash), route); }
D.conversations[0].confidence = 17; D.conversations[0].reason = '個別の根拠'; assert.match(a.window.IdealScreens.messages.thread(D.conversations[0]), /17%/); assert.match(a.window.IdealScreens.messages.thread(D.conversations[0]), /個別の根拠/);
console.log('PASS BRIEF10 D: relist, rule parity, offer idempotency, tone, keyboard/focus, automation, persistence, publication/history, thread scope, limits and route normalization');
// Final controls: newly arriving domain records and causes that cannot be automatically repaired.
a = fresh(); D = a.window.IdealData;
const newProblem = { ...D.listings[5], id: 'new-problem', sourceId: 'new-problem', state: '要修正', cause: '寸法の確認が必要', taskId: null };
D.listings.push(newProblem); assert.equal(D.counts().fix, 4); assert.equal(D.repair(newProblem.id).result.canPublish, false); assert.equal(newProblem.state, '要修正');
const sourceEnded10 = D.listings.find(r => r.state === '仕入れ元終了'); assert.equal(D.repair(sourceEnded10.id).result.canPublish, false); assert.equal(sourceEnded10.state, '仕入れ元終了');
const completedChat10 = D.conversations.find(r => r.replied); completedChat10.unread = true; assert.equal(D.counts().message, 5);
// All three create entry points wait for explicit confirmation.
a = fresh(); D = a.window.IdealData; main10 = a.node('main'); a.window.location.hash = '#/create/draft-0'; a.window.IdealCore.setMode('上級'); a.window.IdealShell.render();
const originalListings10 = D.listings.length;
screenClick10({ make: 'publish' }); assert.equal(D.listings.length, originalListings10); assert.match(a.node('dialog').innerHTML, /警告 1 件あります/); assert.match(a.node('dialog').innerHTML, /被写体/); a.click('close');
key10('p', { tagName: 'MAIN' }); assert.equal(D.listings.length, originalListings10); a.click('confirm'); assert.equal(D.listings.length, originalListings10 + 1);
screenClick10({ make: 'withdraw-result' }); assert.equal(D.listings.at(-1).state, '出品中'); a.click('confirm'); assert.equal(D.listings.at(-1).state, 'eBay終了');
// Import card and deep-link select the exact imported draft, not the previous selection.
a = fresh(); D = a.window.IdealData; const source10 = D.research[0];
const duplicate10 = a.window.IdealSourcing.importRow(D, source10, 'ふだん'); D.importJobs = [{ url: source10.url, ...duplicate10 }];
const card10 = a.window.IdealScreens.import.render(); assert.match(card10, /<img width="80"/); assert.ok(card10.includes('#/create/' + duplicate10.draft.id)); assert.ok(card10.includes(a.window.IdealCore.money(duplicate10.draft.gross * 155)));
a.window.location.hash = '#/create/draft-2'; a.window.IdealShell.render(); assert.match(a.node('main').innerHTML, /price-stop/); assert.ok(a.node('main').innerHTML.includes('value="30"')); assert.match(a.node('main').innerHTML, /追跡あり配送/);
// Setting form uses Japanese inline validation; avoiding products never shows numeric errors.
main10 = a.node('main'); a.window.location.hash = '#/criteria'; a.window.IdealShell.render(); screenClick10({ edit: 'avoid' });
assert.match(main10.innerHTML, /id="criteria-form" novalidate/);
a.node('#criteria-reason').value = ''; a.node('#criteria-context').value = ''; main10.onsubmit({ preventDefault() {}, target: { id: 'criteria-form' } }); assert.match(a.node('#criteria-error').textContent, /理由と3文字以上/);
a.node('#criteria-reason').value = 'その他'; a.node('#criteria-context').value = '変更なし'; main10.onsubmit({ preventDefault() {}, target: { id: 'criteria-form' } }); assert.doesNotMatch(a.node('#criteria-error').textContent, /数値/);
screenClick10({ edit: 'tone' }); assert.match(main10.innerHTML, /返信の印象/); assert.match(main10.innerHTML, /受信者の反応/);
D.settings.marginFloor = 88; D.resetPreferences(); assert.equal(D.settings.marginFloor, 10); assert.equal(D.savedFilters, null); assert.match(D.decisions.at(-1).what, /初期状態/);
console.log('PASS BRIEF10 final controls: dynamic inbox, unrepaired causes, unavailable sources, direct confirmation handlers, import continuity and inline validation');
// A9: the in-create policy selector preserves its proposal and requires the shared settings history flow.
a = fresh(); D = a.window.IdealData; main10 = a.node('main'); a.window.location.hash = '#/create'; a.window.IdealShell.render();
main10.onchange({ target: { dataset: { setting: 'duties' }, value: 'DDP', hasAttribute: () => false } });
assert.equal(D.settings.duties, 'DDU'); a.window.IdealShell.render(); assert.match(main10.innerHTML, /id="criteria-form"/);
a.node('#criteria-reason').value = '返品'; a.node('#criteria-context').value = '費用を確認する'; main10.onsubmit({ preventDefault() {}, target: { id: 'criteria-form' } });
assert.equal(D.settings.duties, 'DDP'); assert.equal(D.decisions.at(-1).source, '作る'); assert.ok(D.decisions.at(-1).impact.count > 0);
assert.equal(D.normalizeHash('#/create/not-a-draft'), '#/create'); assert.equal(D.normalizeHash('#/listings/foo/bar'), '#/listings');
const mixed10 = D.bulkPreview(['listing-3', 'listing-9', 'listing-10'], 'withdraw'); assert.equal(mixed10.count, 1); assert.equal(mixed10.skipped.length, 2);
D.applyBulk(D.bulkPreview(['listing-0'], 'reset')); assert.doesNotMatch(a.window.IdealScreens.listings.render(), /data-state-category="undefined"/);
console.log('PASS BRIEF10 shared policy proposal, normalized detail hashes and applicable-only bulk counts');
// Concrete repair controls: the initial causes are present in the listing data itself.
a = fresh(); D = a.window.IdealData; D.settings.avoid = [];
const camera10 = D.listings[1], bag10 = D.listings[2];
assert.equal(camera10.shippingPolicy, ''); assert.equal(a.window.IdealChecks.validateListing(camera10, D.settings).canPublish, false);
assert.equal(D.repair(camera10.id).result.canPublish, true); assert.equal(camera10.shippingPolicy, D.settings.shipping); assert.equal(camera10.state, 'AI処理済');
assert.equal(bag10.specifics.Material, 'Genuine leather'); assert.equal(a.window.IdealChecks.validateListing(bag10, D.settings).checks.find(c => c.id === 'material').status, 'block');
assert.equal(D.repair(bag10.id).result.canPublish, true); assert.equal(bag10.specifics.Material, 'Faux leather'); assert.match(bag10.description, /faux leather/i);
// An alternate watcher row cannot prepare a second offer for the same audience.
const watcher10 = D.watchers[5]; ticket = D.prepareAftersale('watcher-offer', watcher10.id, 10); assert.ok(ticket);
D.watchers.push({ ...watcher10, id: 'same-audience' }); assert.equal(D.prepareAftersale('watcher-offer', 'same-audience', 10), null); D.cancelAftersale(ticket);
watcher10.listing.gross = 150; assert.equal(D.counterRange().max, 150); assert.equal(D.prepareAftersale('counter', D.incomingOffer.id, 151), null);
console.log('PASS concrete policy/material repairs and shared offer audience/current-price bounds');
assert.match(a.window.IdealScreens.reports.chart([{ date: '2026-10-20', yen: -2149 }]), />-¥2,149</);
assert.doesNotMatch(a.window.IdealScreens.reports.chart([{ date: '2026-10-20', yen: -2149 }]), /¥-/);
// Route changes close a real publication confirm and discard its pending action.
for (const destination of ['#/listings', '#/create/draft-1']) {
  a = fresh(); D = a.window.IdealData; main10 = a.node('main');
  a.window.location.hash = '#/create/draft-0'; a.listeners.hashchange();
  const count = D.listings.length;
  screenClick10({ make: 'publish' });
  assert.equal(a.node('dialog').open, true);
  assert.match(a.node('dialog').innerHTML, /data-action="confirm"/);
  assert.equal(D.listings.length, count);
  a.window.location.hash = destination; a.listeners.hashchange();
  assert.equal(a.node('dialog').open, false);
  assert.equal(a.document.activeElement, main10);
  a.click('confirm'); // Even a stale confirmation event must do nothing.
  assert.equal(D.listings.length, count);
  assert.ok(!D.drafts[0].published);
  a.window.location.hash = '#/create/draft-0'; a.listeners.hashchange();
  screenClick10({ make: 'publish' }); a.click('confirm');
  assert.equal(D.listings.length, count + 1); // Positive control: fresh confirmation works.
}
console.log('PASS route changes close publication confirms, discard pending actions and focus main');
for (const action of ['shortcuts', 'support', 'drawer', 'display', 'search', 'notifications']) {
  a = fresh();
  a.click(action);
  const panel = a.node(action === 'search' ? 'search-form' : action === 'notifications' ? 'notifications' : 'dialog');
  const modal = panel === a.node('dialog');
  assert.equal(modal ? panel.open : !panel.hidden, true);
  a.window.location.hash = '#/listings'; a.listeners.hashchange();
  assert.equal(modal ? panel.open : !panel.hidden, false);
  assert.equal(a.document.activeElement, a.node('main'));
}
