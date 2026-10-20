'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
const app = boot(), w = app.window, D = w.IdealData, C = w.IdealCore, H = w.IdealHelp;
const main = app.node('main');
main.querySelector = s => app.node(s);
function route(name) { w.location.hash = '#/' + name; w.IdealShell.render(); }
function click(dataset) { main.onclick({ target: { closest: () => ({ dataset, hasAttribute: key => key === 'data-rate' && dataset.rate !== undefined }) } }); }
function undo() { app.click('undo', app.node('toasts').children.at(-1).innerHTML.match(/data-id="([^"]+)"/)[1]); }
for (const mode of C.modes) {
  C.setMode(mode);
  for (const [name] of D.groups.flatMap(g => g[1])) {
    route(name);
    assert.equal((main.innerHTML.match(/<h1>/g) || []).length, 1);
    assert.match(main.innerHTML, /本物との対応/);
    assert.doesNotMatch(main.innerHTML, /undefined|NaN|⚒|✉|🚚/);
    const header = main.innerHTML.match(/<div class="page-header">(.*?)<\/div>/)[1];
    assert.ok((header.match(/class="primary"/g) || []).length <= 1);
  }
}
route('automation');
assert.equal(D.automations.length, 4);
assert.equal((main.innerHTML.match(/data-run/g) || []).length, 20);
app.click('automation', 'stock'); assert.equal(D.automations[0].on, true);
assert.match(app.node('dialog').innerHTML, /既に処理した出品・注文は元に戻りません/);
assert.match(app.node('dialog').innerHTML, /いつでもONで再開/);
app.click('close'); app.click('confirm'); assert.equal(D.automations[0].on, true);
app.click('automation', 'stock'); app.click('confirm'); assert.equal(D.automations[0].on, false);
route('today'); assert.match(main.innerHTML, /aria-label="在庫監視" aria-checked="false"/);
undo(); assert.equal(D.automations[0].on, true);
app.click('automation', 'stock'); app.click('confirm');
app.click('automation', 'stock'); assert.equal(D.automations[0].on, true); assert.equal(app.node('dialog').open, false);
assert.equal(D.setAutomation('stock', false, false), null);
app.click('automation', 'stock'); route('criteria'); app.click('confirm');
assert.equal(D.automations[0].on, true, 'navigation discards a pending stop');
app.click('close');
route('setup');
main.onchange({ target: { id: 'disconnect-demo', checked: true } });
assert.equal(D.connection.connected, false); assert.equal(D.steps[0][1], false);
assert.ok(main.innerHTML.indexOf('出品できません') < main.innerHTML.indexOf('再連携の手順'));
assert.match(main.innerHTML, /setup-row next-step[^]*?eBay連携/);
assert.match(w.IdealShell.nav(), /連携が切断中/);
route('today'); assert.match(main.innerHTML, /在庫監視と注文同期が止まります/);
route('setup'); click({ setup: '0' }); click({ completeStep: '0' });
assert.equal(D.connection.connected, true); assert.equal(D.steps[0][1], true);
click({ setup: '1' }); click({ completeStep: '1' });
C.setMode('はじめて'); route('today'); assert.match(main.innerHTML, /✓ 完了：ポリシー/);
assert.match(main.innerHTML, /いまやること：販売実績を入力する/);
D.steps.forEach(s => { s[1] = true; }); assert.doesNotThrow(() => w.IdealToday.render());
route('criteria'); assert.match(main.innerHTML, /まずこの3つだけ/);
click({ edit: 'marginFloor' });
main.oninput({ target: { value: '99', hasAttribute: () => true } });
assert.match(app.node('#criteria-impact').innerHTML, /件が変わります/);
app.node('#criteria-reason').value = '';
app.node('#criteria-context').value = 'ab';
const submit = () => main.onsubmit({ preventDefault() {}, target: { id: 'criteria-form' } });
submit(); assert.equal(D.settings.marginFloor, 10);
app.node('#criteria-reason').value = 'その他';
app.node('#criteria-context').value = '<img onerror=x>';
submit(); assert.equal(D.settings.marginFloor, 99);
assert.match(main.innerHTML, /&lt;img onerror=x&gt;/); assert.doesNotMatch(main.innerHTML, /<img onerror=x>/);
assert.match(w.IdealScreens.create.validation(D.drafts[0]), /利益率が下限未満/);
assert.match(w.IdealScreens.listings.render(), /判断軸で要確認：[1-9]/);
click({ criteria: 'undo' }); assert.equal(D.settings.marginFloor, 10);
C.setMode('上級'); route('criteria'); assert.match(main.innerHTML, /criteria-table/);
main.onkeydown({ key: 'e', target: { tagName: 'TR', closest: () => ({ dataset: { settingRow: 'tone' } }) }, preventDefault() {} });
assert.match(main.innerHTML, /返信のトーンを編集/);
// Actual keyboard handler opens the tooltip; Escape returns focus.
const button = { isConnected: true, expanded: false, getAttribute: () => 'test-tip', setAttribute(k, v) { this[k] = v; }, focus() { app.document.activeElement = this; } };
for (const key of ['Enter', ' ']) {
  app.listeners.keydown({ key, target: { tagName: 'BUTTON', closest: () => button }, preventDefault() {} });
  assert.equal(button['aria-expanded'], 'true'); assert.equal(app.node('test-tip').hidden, false);
  app.listeners.keydown({ key: 'Escape', target: { tagName: 'BUTTON' } });
  assert.equal(button['aria-expanded'], 'false'); assert.equal(app.node('test-tip').hidden, true);
  assert.equal(app.document.activeElement, button);
}
for (const [key, term] of Object.entries(w.IdealGlossary)) {
  assert.ok(term.definition && term.why && term.where);
  assert.match(H.term(key), /aria-describedby=/);
  assert.doesNotMatch(term.definition, /\d|%|米国|カナダ|欧州|必ず|保証/);
}
assert.equal(w.IdealGlossary['全件リセットの効果'].definition, D.resetWording);
assert.match(w.IdealGlossary['Economy 配送'].definition, /対象国・料金は eBay の画面で確認/);
app.click('shortcuts'); assert.match(app.node('dialog').innerHTML, /role="tablist"/);
for (const tab of ['shortcuts', 'glossary', 'issues']) assert.match(H.dialog(tab), new RegExp('help-tab-' + tab + '"[^>]*aria-selected="true"'));
app.node('dialog').querySelector = selector => app.node(selector);
app.listeners.click({ target: { closest: selector => selector === '[data-help-tab]' ? { dataset: { helpTab: 'glossary' } } : null } });
assert.match(app.node('dialog').innerHTML, /id="glossary-search"/);
app.listeners.input({ target: { id: 'glossary-search', value: 'DDP', dataset: {} } });
assert.match(app.node('glossary-results').innerHTML, /<h3>DDP/);
assert.doesNotMatch(app.node('glossary-results').innerHTML, /<h3>返品ポリシー/);
assert.match(H.results('DDP'), /<h3>DDP/); assert.doesNotMatch(H.results('DDP'), /<h3>返品ポリシー/);
assert.match(H.results('no-such-term'), /該当する用語はありません/);
assert.ok(H.dialog('issues').includes(H.knownIssues()));
app.click('support'); assert.ok(app.node('dialog').innerHTML.includes(H.knownIssues()));
const paths = fs.readdirSync('assets/js/screens').map(p => 'assets/js/screens/' + p).concat(['assets/js/criteria.js', 'assets/js/glossary.js', 'assets/js/help.js']);
const source = paths.map(p => fs.readFileSync(p, 'utf8')).join('\n');
for (const match of source.matchAll(/IdealHelp\.term\('([^']+)'/g)) assert.ok(w.IdealGlossary[match[1]], match[1]);
for (const name of ['create', 'criteria', 'automation', 'returns', 'orders', 'reports']) assert.match(w.IdealScreens[name].render(), /data-term=/);
assert.doesNotMatch(source, /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
console.log('PASS stage 4a: all routes × modes, guarded shared switches, setup state, live criteria, escaping, keyboard terms, glossary and help');
