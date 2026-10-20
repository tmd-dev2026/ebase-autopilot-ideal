'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const scripts = [...source('index.html').matchAll(/<script defer src="assets\/js\/([^"]+)"/g)].map(m => m[1]).filter(p => p !== 'shell.js');
function boot(storage = {}) {
  const listeners = {}, nodes = {};
  function node(id) { return nodes[id] || (nodes[id] = { id, dataset: {}, innerHTML: '', hidden: true, value: '', children: [], setAttribute(k,v) { this[k] = v; }, appendChild(n) { this.children.push(n); }, focus() { document.activeElement = this; }, showModal() { this.open = true; }, close() { this.open = false; }, addEventListener(k,fn) { this[k] = fn; } }); }
  const document = { activeElement: null, documentElement: node('html'), getElementById: node, querySelectorAll: () => [], querySelector: selector => node(selector), addEventListener(k,fn) { listeners[k] = fn; }, createElement: () => ({}) };
  const window = { localStorage: { getItem: k => storage[k], setItem: (k,v) => { storage[k] = v; } }, location: { hash: '#/today' }, scrollTo(options) { window.lastScroll = options; window.scrollCalls = (window.scrollCalls || 0) + 1; }, history: { replaceState: (_,__,hash) => { window.location.hash = hash; } }, addEventListener: (k,fn) => { listeners[k] = fn; } };
  const context = vm.createContext({ window, document });
  scripts.forEach(file => vm.runInContext(source('assets/js/' + file), context));
  vm.runInContext(source('assets/js/shell.js'), context);
  function click(action,id) { const b = { dataset: { action, id }, setAttribute(k,v) { this[k] = v; }, parentElement: { remove() {} } }; listeners.click({ preventDefault() {}, target: { closest: selector => selector === '[data-action]' ? b : null } }); }
  return { window, document, nodes, node, context, listeners, click };
}
function undoToast(app) {
  const token = app.node('toasts').children.at(-1).innerHTML.match(/data-id="([^"]+)"/)[1];
  app.click('undo', token);
}
let app = boot(), { IdealData: D, IdealCore: C, IdealToday: T, IdealMarks: M } = app.window;
assert.equal(D.products.length, 6);
assert.deepEqual(JSON.parse(JSON.stringify(D.counts())), { total: 9, fix: 3, message: 2, offer: 1, shipment: 2, ended: 1 });
assert.deepEqual(JSON.parse(JSON.stringify(D.badges())), { today: 9, listings: 3, messages: 2, orders: 2 });
Object.entries(D.badges()).forEach(([route,count]) => assert.match(app.window.IdealShell.nav(), new RegExp('data-badge="' + route + '"[^>]*>' + count + '</span>')));
D.groups.flatMap(g => g[1]).forEach(([route]) => {
  assert.equal(D.route('#/' + route), route);
  app.window.location.hash = '#/' + route;
  app.window.IdealShell.render();
  const html = app.nodes.main.innerHTML;
  assert.match(html, /本物との対応/); assert.match(html, /class="mark"/); assert.match(app.nodes.header.innerHTML, /data-action="legend"/);
  assert.match(html, new RegExp('<h1>' + D.title(route) + '</h1>'));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  if (!['today', 'create', 'listings', 'orders', 'messages', 'returns', 'offers', 'ads', 'reports', 'criteria', 'automation', 'setup', 'sourcing', 'candidates', 'import'].includes(route)) { assert.match(html, /この画面は次の段階で作ります/); assert.doesNotMatch(html, /data-task/); }
});
app.window.location.hash = '#/missing'; app.window.IdealShell.render(); assert.equal(app.window.location.hash, '#/today');
assert.equal(D.route('#/today/fix-card'), 'today');
assert.match(T.render(), /data-category="fix"/); // Positive control before hiding.
D.items.filter(i => i.category === 'fix').forEach(i => D.resolve(i.id));
assert.doesNotMatch(T.render(), /data-category="fix"/); assert.doesNotMatch(app.window.IdealShell.nav(), /data-badge="listings"/);
D.items.forEach(i => D.undo(i.id));
D.items.forEach(i => { const before = D.counts().total; assert.equal(D.resolve(i.id), true); assert.equal(D.counts().total, before - 1); assert.equal(D.resolve(i.id), false); D.undo(i.id); assert.equal(D.counts().total, before); });
D.items.forEach(i => D.resolve(i.id)); assert.match(T.render(), /今日の対応は終わりました/); assert.doesNotMatch(T.render(), /data-category=/); assert.doesNotMatch(app.window.IdealShell.nav(), /data-badge=/);
D.items.forEach(i => D.undo(i.id));
C.setMode('はじめて'); assert.match(T.render(), /class="card checklist"/); assert.match(T.render(), /next-step/); assert.doesNotMatch(T.render(), /dense-list/);
C.setMode('上級'); assert.match(T.render(), /dense-list/); assert.match(T.render(), /class="filters"/); assert.doesNotMatch(T.render(), /class="card checklist"/);
C.setMode('ふだん'); assert.doesNotMatch(T.render(), /checklist|dense-list|class="filters"/);
const storage = {}; const saved = boot(storage); saved.window.IdealCore.setMode('上級'); saved.window.IdealCore.setTheme('dark');
const reloaded = boot(storage); assert.equal(reloaded.window.IdealCore.mode, '上級'); assert.equal(reloaded.window.IdealCore.theme, 'dark');
for (const theme of ['auto', 'light', 'dark']) { saved.window.IdealCore.setTheme(theme); assert.equal(boot(storage).window.IdealCore.theme, theme); }
const throwing = new Proxy({}, { get() { throw Error('blocked'); }, set() { throw Error('blocked'); } });
const blocked = boot(throwing); assert.equal(blocked.window.IdealCore.mode, 'ふだん'); assert.equal(blocked.window.IdealCore.theme, 'auto'); assert.doesNotThrow(() => { blocked.window.IdealCore.setMode('上級'); blocked.window.IdealCore.setTheme('dark'); });
assert.ok(Math.abs(C.takeHome(90, 6500, 7500) - (-2148.7)) < 0.00001);
assert.ok(Math.abs(C.takeHome(120, 6500, 7500) - 1822.4) < 0.00001);
assert.equal(C.takeHome(null,6500,7500), null); assert.equal(C.money(null), '—'); assert.equal(C.money(NaN), '—');
assert.match(T.profit(D.items.find(i => i.category === 'offer'), 90), /class="loss".*⚠ 赤字/); assert.doesNotMatch(T.profit(D.items.find(i => i.category === 'offer'), 120), /⚠ 赤字/);
assert.equal(C.escape('<img onerror="x">&\''), '&lt;img onerror=&quot;x&quot;&gt;&amp;&#39;');
D.products[0].name = '<script>alert("x")</script>'; D.items[0].cause = '<img src=x onerror=x>'; D.items[3].draft = '</textarea><script>x</script>';
assert.match(T.render(), /&lt;script&gt;/); assert.doesNotMatch(T.render(), /<script>|<img src=x/); assert.match(T.render(), /&lt;\/textarea&gt;/);
// Exercise actual delegated UI actions, confirmations and undo.
app = boot(); D = app.window.IdealData;
app.click('fix','fix-card'); assert.equal(D.counts().total, 8); assert.match(app.nodes.toasts.children.at(-1).innerHTML, /元に戻す/);
app.click('undo','fix-card'); assert.equal(D.counts().total, 9);
app.node('[data-draft="message-watch"]').value = 'Checked reply'; app.click('message','message-watch'); assert.equal(D.counts().total,9); assert.match(app.nodes.dialog.innerHTML, /Checked reply/); app.click('close'); assert.equal(D.counts().total,9);
app.click('message','message-watch'); app.click('confirm'); assert.equal(D.counts().message,1); undoToast(app);
app.click('accept','offer-figure'); assert.match(app.nodes.dialog.innerHTML, /赤字/); assert.doesNotMatch(app.nodes.dialog.innerHTML, /data-action="confirm"/); assert.equal(D.counts().offer,1); app.click('close');
app.node('[data-counter="offer-figure"]').value = '120'; app.click('counter','offer-figure'); assert.match(app.nodes.dialog.innerHTML, /1,822/); assert.equal(D.counts().offer,1); app.click('confirm'); assert.equal(D.counts().offer,0); undoToast(app);
app.click('decline','offer-figure'); app.click('confirm'); assert.equal(D.counts().offer,0); undoToast(app);
app.click('ended','ended-bag'); assert.match(app.nodes.dialog.innerHTML, /対象1件・eBay上の出品を終了します・再出品が必要/); assert.equal(D.counts().ended,1); app.click('confirm'); assert.equal(D.counts().ended,0); app.click('undo','ended-bag');
app.listeners.submit({ preventDefault() {}, target: { dataset: { shipment:'ship-camera' }, elements: { tracking: { value: 'TRACK-EXAMPLE' } } } }); assert.equal(D.counts().shipment,2); assert.match(app.nodes.dialog.innerHTML, /取り消せません/); app.click('confirm'); assert.equal(D.counts().shipment,1); undoToast(app);
app.listeners.submit({ preventDefault() {}, target: { dataset: { shipment:'ship-camera' }, elements: { tracking: { value: '   ' } } } }); assert.equal(D.counts().shipment,2);
app.click('automation','stock'); assert.equal(D.automations[0].on,true); app.click('confirm'); assert.equal(D.automations[0].on,false); app.click('automation','stock'); assert.equal(D.automations[0].on,true);
app.click('notifications'); assert.equal((app.nodes.notifications.innerHTML.match(/href=/g)||[]).length,3);
app.click('support'); assert.match(app.nodes.dialog.innerHTML, /対象画面：今日/); app.listeners.submit({ preventDefault() {}, target: { id: 'support-form', dataset: {} } }); assert.match(app.nodes.toasts.children.at(-1).innerHTML, /今日.*送信されません/);
app.click('mode','上級'); assert.match(app.nodes.main.innerHTML,/dense-list/); app.click('filter','offer'); assert.equal((app.nodes.main.innerHTML.match(/data-task=/g)||[]).length,1);
console.log('PASS app: routes, counts, visibility, modes, persistence failures, money, escaping and interactive actions');

// Stage 1b: compact controls, informational marks, and data-driven summaries.
app = boot(); D = app.window.IdealData; T = app.window.IdealToday; M = app.window.IdealMarks;
assert.equal((app.nodes.header.innerHTML.match(/class="header-row"/g) || []).length, 1);
assert.doesNotMatch(app.nodes.header.innerHTML, /class="(?:heading|tools|preferences)"|<select/);
assert.match(app.nodes.header.innerHTML, /data-action="search"[^>]*aria-label="検索"/);
app.click('search'); assert.equal(app.nodes['search-form'].hidden, false);
app.click('search'); assert.equal(app.nodes['search-form'].hidden, true);
app.listeners.submit({ preventDefault() {}, target: { id: 'search-form', dataset: {} } });
assert.match(app.nodes.toasts.children.at(-1).innerHTML, /試作のため検索は動きません/);
for (const label of ['ライト', 'ダーク', '自動']) { app.click('theme'); assert.ok(app.nodes.header.innerHTML.includes('テーマ：' + label)); }
app.click('display'); assert.match(app.nodes.dialog.innerHTML, /display-settings/); assert.match(app.nodes.dialog.innerHTML, /表示モード/); app.click('close');
for (const mark of ['現行', '改', '新', '将来']) { const chip = M.chip(mark); assert.match(chip, /^<span class="mark"/); assert.doesNotMatch(chip, /<button|data-action|tabindex/); assert.ok(chip.includes(mark)); assert.match(chip, /aria-hidden="true"/); }
function checkSummary() {
  const html = T.render(), counts = D.counts();
  assert.ok(html.includes('class="total">' + counts.total + '</span>'));
  assert.ok(html.includes('今日 ' + (D.items.length - counts.total) + ' 件 対応済み / 全 ' + D.items.length + ' 件（例）'));
  for (const cat of D.categories) {
    const pill = new RegExp('class="chip"[^>]*data-id="' + cat.id + '"[^>]*>' + cat.label + ' ' + counts[cat.id] + '（例）');
    if (counts[cat.id]) assert.match(html, pill); else assert.doesNotMatch(html, new RegExp('class="chip"[^>]*data-id="' + cat.id + '"'));
  }
}
checkSummary(); app.click('fix', 'fix-card'); checkSummary(); app.click('undo', 'fix-card'); checkSummary();
for (const cat of D.categories) {
  const item = D.items.find(i => i.category === cat.id), html = T.itemHTML(item, false);
  assert.equal((html.match(/class="primary row-action"/g) || []).length, 1);
  assert.match(html, new RegExp('data-action="expand"[^>]*>' + cat.verb + '</button>'));
  assert.match(html, /class="task-facts"/); assert.doesNotMatch(html, /確認する/);
  app.click('expand', item.id); assert.equal(app.node('item-' + item.id).open, true);
  app.click('expand', item.id); assert.equal(app.node('item-' + item.id).open, false);
}
for (const state of [false, true]) {
  app.click('automation', 'stock');
  if (!state) { assert.equal(D.automations[0].on, true); app.click('confirm'); }
  assert.match(app.nodes.main.innerHTML, new RegExp('role="switch" aria-label="在庫監視" aria-checked="' + state + '"'));
  if (!state) assert.match(app.nodes.main.innerHTML, /class="stop-effect">停止の影響：仕入れ元の在庫変化/);
  else assert.doesNotMatch(app.nodes.main.innerHTML, /class="stop-effect"/);
}
assert.match(T.render(), /<details><summary>詳しく<\/summary>/);
assert.match(T.render(), /見込み\(まだ確定ではありません\)/); assert.match(T.render(), /class="metric-label">確定</);
assert.ok(T.render().includes(app.window.IdealCore.money(app.window.IdealAftersale.reports(D.orders, D.listings).estimate))); assert.match(T.render(), /未確定の追加費用：—/);
for (const heading of T.render().matchAll(/<h2>(.*?)<\/h2>/g)) assert.ok((heading[1].match(/class="mark"/g) || []).length <= 2);
console.log('PASS polish: header, search, theme cycle, display menu, chips, summary, row verbs, expansion, switches and metric labels');

module.exports = { boot };
