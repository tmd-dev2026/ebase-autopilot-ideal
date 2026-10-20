'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
let app = boot();
let D = app.window.IdealData, C = app.window.IdealCore, screens = app.window.IdealScreens;
const main = app.node('main');
main.querySelector = selector => app.node(selector);
function route(name) { app.window.location.hash = '#/' + name; app.window.IdealShell.render(); }
function button(dataset) { return { dataset, hasAttribute: key => key === 'data-state' && 'state' in dataset }; }
function click(dataset) { main.onclick({ target: { closest: () => button(dataset) } }); }
function input(key, value) { main.oninput({ target: { dataset: { field: key }, value } }); }
function changeCategory(value) { main.onchange({ target: { dataset: {}, value, hasAttribute: key => key === 'data-category-choice' } }); }
assert.equal(D.listings.length, 12);
assert.equal(D.drafts.length, 3);
assert.equal(D.listingCounts()['要修正'], D.counts().fix);
assert.ok(Object.keys(screens).includes('create'));
route('create');
assert.match(main.innerHTML, /取り込み済み\(未出品\)/);
assert.match(screens.create.finalBar(D.drafts[0]), /data-make="publish"[^>]*>出品する/);
assert.match(screens.create.finalBar(D.drafts[0]), /警告 1 件あります/);
click({ draftId: 'draft-1' });
assert.match(main.innerHTML, /data-make="publish"[^>]* disabled/);
assert.match(main.innerHTML, /必須項目|人が決めてください/);
assert.equal(D.publish('draft-1'), false);
input('specific:Type', 'Camera');
assert.match(app.node('#final-bar').innerHTML, /data-make="publish"[^>]* disabled/);
D.settings.avoid = []; D.drafts[1].condition = '中古'; changeCategory(D.drafts[1].candidates[0]);
assert.equal(D.decisions.length, 1);
assert.match(D.decisions[0].reason, /商品の種類/);
assert.doesNotMatch(screens.create.finalBar(D.drafts[1]), /data-make="publish"[^>]* disabled/);
input('title', 'Updated <example> title');
assert.match(app.node('#buyer-preview').innerHTML, /Updated &lt;example&gt; title/);
assert.equal(app.node('#title-counter').textContent, '23 / 80文字');
input('gross', '400');
assert.match(app.node('#buyer-preview').innerHTML, /\$400\.00/);
assert.match(app.node('#buyer-preview').innerHTML, /¥62,000/);
click({ make: 'publish' }); assert.equal(D.listings.length, 12); app.click('confirm');
assert.equal(D.listings.length, 13);
assert.equal(D.listings.at(-1).name, 'Updated <example> title');
assert.match(main.innerHTML, /出品しました\(試作のため実際には何も送っていません\)/);
route('listings'); assert.match(main.innerHTML, /Updated &lt;example&gt; title/);
route('create'); click({ make: 'withdraw-result' }); assert.equal(D.listings.at(-1).state, '出品中'); app.click('confirm'); assert.equal(D.listings.at(-1).state, 'eBay終了'); assert.equal(D.drafts[1].published, true);
click({ draftId: 'draft-2' });
assert.match(main.innerHTML, /赤字のため出せません/);
assert.doesNotMatch(main.innerHTML, /data-make="override"/);
C.setMode('上級'); app.window.IdealShell.render(); assert.match(main.innerHTML, /data-make="override"/);
app.node('#override-reason').value = '在庫整理のため'; app.node('#override-context').value = '';
click({ make: 'override' }); assert.equal(D.listings.length, 13); assert.match(app.node('#make-feedback').textContent, /背景/);
app.node('#override-context').value = '保管場所の整理'; click({ make: 'override' }); app.click('confirm');
assert.equal(D.listings.length, 14); assert.equal(D.decisions.at(-1).who, 'あなた'); assert.match(D.decisions.at(-1).reason, /保管場所/);
// Schedule validation and session-only import really run through screen handlers.
click({ draftId: 'draft-0' }); app.node('#schedule-time').value = '';
click({ make: 'schedule' }); assert.equal(D.listings.length, 14);
app.node('#schedule-time').value = '2099-12-01T12:00'; click({ make: 'schedule' }); app.click('confirm');
assert.equal(D.listings.at(-1).state, '予約済み'); assert.match(main.innerHTML, /予約しました/);
// Listings: expand/fix and shared data, bulk preview/cancel/execute/undo.
D.settings.avoid = [];
route('listings');
click({ list: 'detail', id: 'listing-0' });
assert.match(main.innerHTML, /The condition description does not match the selected condition\./);
assert.match(main.innerHTML, /eBayの原文\(そのまま\)/);
for (const label of ['原因', '自分で直せるか', '出品への影響', '次にやること']) assert.ok(main.innerHTML.includes(label));
click({ list: 'fix', id: 'listing-0' });
assert.equal(D.listingCounts()['要修正'], 2); assert.equal(D.counts().fix, 2); assert.equal(D.badges().listings, 2);
assert.match(app.window.IdealToday.render(), /要修正の出品 2（例）/);
click({ list: 'undo' }); assert.equal(D.counts().fix, 3);
for (const row of D.listings.slice(0, 3)) { click({ list: 'detail', id: row.id }); click({ list: 'fix', id: row.id }); }
assert.equal(D.counts().fix, 0); assert.doesNotMatch(main.innerHTML, /data-state="要修正"/); assert.doesNotMatch(app.window.IdealShell.nav(), /data-badge="listings"/);
click({ list: 'undo' }); assert.equal(D.counts().fix, 1); assert.match(main.innerHTML, /data-state="要修正"/);
click({ state: '要修正' }); assert.equal(screens.listings.rows().length, 1);
click({ state: '' });
main.oninput({ target: { id: 'listing-search', value: 'missing search example' } }); assert.equal(screens.listings.rows().length, 0);
main.oninput({ target: { id: 'listing-search', value: '' } });
const ids = ['listing-4', 'listing-5'];
ids.forEach(id => main.onchange({ target: { dataset: { select: id }, checked: true } }));
app.node('#bulk-percent').value = '90'; const before = ids.map(id => D.listings.find(r => r.id === id).gross);
click({ bulk: 'price' });
assert.deepEqual(ids.map(id => D.listings.find(r => r.id === id).gross), before);
assert.match(main.innerHTML, /対象2件/); assert.match(main.innerHTML, /⚠ 赤字になる商品 2 件/);
click({ list: 'cancel' }); assert.deepEqual(ids.map(id => D.listings.find(r => r.id === id).gross), before);
click({ bulk: 'price' }); click({ list: 'execute' });
assert.deepEqual(ids.map(id => D.listings.find(r => r.id === id).gross), before);
app.node('#bulk-percent').value = '10'; click({ bulk: 'price' }); click({ list: 'execute' });
ids.forEach((id, i) => assert.ok(Math.abs(D.listings.find(r => r.id === id).gross - before[i] * 0.9) < 1e-8));
assert.match(app.node('toasts').children.at(-1).innerHTML, /元に戻す/);
click({ list: 'undo' }); assert.deepEqual(ids.map(id => D.listings.find(r => r.id === id).gross), before);
for (const action of ['reset', 'withdraw', 'relist']) {
  if (action === 'relist') ids.forEach(id => { D.listings.find(r => r.id === id).state = 'eBay終了'; });
  const snapshot = JSON.stringify(D.listings);
  const preview = D.bulkPreview(ids, action, 10);
  assert.equal(preview.count, 2);
  if (action === 'reset') { assert.match(preview.text, /出品の予約はしません/); assert.doesNotMatch(preview.text, /自動出品されません/); }
  const restore = D.applyBulk(preview); assert.equal(typeof restore, 'function');
  if (action === 'reset') assert.equal(D.listings.find(r => r.id === ids[0]).state, 'AI処理済');
  restore(); assert.equal(JSON.stringify(D.listings), snapshot);
}
assert.equal(D.bulkPreview(ids, 'price', 100).valid, false);
assert.equal(D.applyBulk(D.bulkPreview(['listing-2'], 'relist', 10)), null);
click({ list: 'auto-detail' }); assert.match(main.innerHTML, /修正前 → 修正後/);
assert.equal(D.listings[0].dutiesNotice, 'DDUの説明あり');
click({ list: 'auto-undo' }); assert.equal(D.listings[0].dutiesNotice, '案内なし');
D.listings[0].cause = '<img src=x>'; route('listings'); assert.doesNotMatch(main.innerHTML, /<img src=x>/);
D.drafts[1].description = '</p><script>bad</script>'; assert.match(screens.create.preview(D.drafts[1]), /&lt;script&gt;/);
const css = fs.readFileSync('assets/css/app.css', 'utf8');
assert.match(css, /@media \(max-width: 800px\)[\s\S]*\.listings-table[^}]+display: block/);
assert.match(css, /\.listings-table thead\s*\{\s*display: none/);
assert.match(css, /\.row-select input\s*\{\s*width: 44px;\s*height: 44px/);
assert.match(css, /\.final-bar\s*\{\s*position: sticky;\s*bottom: 72px/);
const copy = ['assets/js/checks.js', 'assets/js/screens/make.js', 'assets/js/screens/listings.js'].map(p => fs.readFileSync(p, 'utf8')).join('\n');
const prohibited = /必ず稼げ|利益保証|収入保証|確実に儲|誰でも月収|guaranteed income|\b(?:Nike|Sony|Canon|Nikon|Rolex|Gucci)\b/i;
assert.equal(prohibited.test(copy), false); assert.equal(prohibited.test('Sony'), true); assert.equal(prohibited.test('利益保証'), true);
console.log('PASS stage 2: live editing, fixes, publication, schedule, override, shared counts, bulk previews, undo, original wording, escaping and responsive CSS');
// A fresh screen also exercises import and the real keyboard handler.
app = boot(); D = app.window.IdealData; C = app.window.IdealCore;
const freshMain = app.node('main'); freshMain.querySelector = selector => app.node(selector);
app.window.location.hash = '#/create'; app.window.IdealShell.render();
app.window.location.hash = '#/create/draft-0'; app.window.IdealShell.render();
C.setMode('上級'); app.window.IdealShell.render();
freshMain.onkeydown({ key: 'p', target: { tagName: 'INPUT' }, preventDefault() {} }); assert.equal(D.listings.length, 12);
freshMain.onkeydown({ key: 'p', target: { tagName: 'MAIN' }, preventDefault() {} }); assert.equal(D.listings.length, 12); app.click('confirm'); assert.equal(D.listings.length, 13);
assert.equal(D.publish('draft-0'), false);
// Toast undo uses a unique action callback and cannot repeat an old undo.
let undone = 0;
app.window.IdealShell.toastUndo('test', () => { undone++; });
const html = app.node('toasts').children.at(-1).innerHTML;
const token = html.match(/data-id="([^"]+)"/)[1];
app.click('undo', token); app.click('undo', token); assert.equal(undone, 1);
