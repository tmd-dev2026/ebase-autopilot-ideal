'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
const app = boot();
const { window: w, document, listeners, node } = app;
const main = node('main');
main.querySelector = selector => node(selector);
// Navigation resets scrolling; ordinary rerenders and bulk focus do not.
w.location.hash = '#/listings';
listeners.hashchange();
assert.equal(document.activeElement, main);
assert.deepEqual(JSON.parse(JSON.stringify(w.lastScroll)), { top: 0, left: 0, behavior: 'instant' });
const calls = w.scrollCalls;
w.IdealShell.render();
assert.equal(w.scrollCalls, calls);
main.onchange({ target: { dataset: { select: 'listing-4' }, checked: true } });
node('#bulk-percent').value = '10';
main.onclick({ target: { closest: () => ({ dataset: { bulk: 'price' }, hasAttribute: () => false }) } });
assert.equal(document.activeElement, node('.impact-preview'));
assert.equal(w.scrollCalls, calls);
// Notification deep links retain their item expansion and focus.
const summary = node('notification-summary');
node('item-fix-card').querySelector = () => summary;
w.location.hash = '#/today/fix-card';
listeners.hashchange();
assert.equal(node('item-fix-card').open, true);
assert.equal(document.activeElement, summary);
assert.equal(w.scrollCalls, calls + 1);
w.location.hash = '#/missing';
listeners.hashchange();
assert.equal(w.location.hash, '#/today');
assert.equal(document.activeElement, main);
const nav = w.IdealShell.nav();
for (const [route, count] of Object.entries(w.IdealData.badges())) {
  const badge = nav.match(new RegExp('<span class="badge" data-badge="' + route + '"([^>]*)>([^<]*)</span>'));
  assert.ok(badge);
  assert.equal(badge[2], String(count));
  assert.match(badge[1], new RegExp('aria-label="[^" ]+ ' + count + ' 件（例）"'));
  assert.match(badge[1], new RegExp('title="[^" ]+ ' + count + ' 件（例）"'));
}
assert.match(nav, /aria-label="発送待ち 2 件（例）"/);
const header = node('header').innerHTML;
assert.match(header, /class="phone-brand" data-action="legend"[^>]*>[\s\S]*class="concept-pill">構想\(未実装\)/);
for (const action of ['search', 'notifications', 'support', 'display']) {
  assert.match(header, new RegExp('data-action="' + action + '"[^>]*aria-label="[^\"]+"'));
}
const make = w.IdealScreens.create.render();
assert.match(make, /class="make-source">[\s\S]*取り込んだ内容[\s\S]*id="buyer-preview"[\s\S]*<div class="make-review">[\s\S]*id="edit-content"[\s\S]*id="listing-checks"[\s\S]*id="final-bar"/);
for (const id of ['buyer-preview', 'edit-content', 'listing-checks', 'final-bar']) {
  assert.equal((make.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1);
}
for (const mode of ['ふだん', '上級']) {
  w.IdealCore.setMode(mode);
  const today = w.IdealToday.render();
  // The future feature mark uses ◇; category icons must still use SVG.
  const incomingChip = w.IdealMarks.component('incomingOffer');
  assert.equal(today.split(incomingChip).length - 1, 1);
  assert.match(incomingChip, /<span aria-hidden="true">◇<\/span> 将来/);
  assert.doesNotMatch(today.replace(incomingChip, ''), /⚒|✉|◇|▣|⊘|undefined/);
  for (const cat of w.IdealData.categories) assert.ok(today.includes(w.IdealIcons(cat.icon)));
}
const css = fs.readFileSync('assets/css/app.css', 'utf8').replace(/\s*([{}:;,])\s*/g, '$1');
assert.match(css, /\.nav-label\{[^}]*white-space:nowrap[^}]*overflow:hidden[^}]*text-overflow:ellipsis/);
assert.match(css, /\.row-select input\{width:44px;height:44px/);
assert.match(css, /@media\(min-width:1024px\)\{\s*\.row-select\{[^}]*width:32px;height:32px[^}]*\}\.row-select input\{width:18px;height:18px;min-height:18px/);
assert.match(css, /\.make-grid,\.field-grid\{[^}]*gap:12px;align-items:start/);
assert.match(css, /#import-example,#edit-content,#policy-edit\{display:grid;gap:12px/);
assert.match(css, /\.bulk-bar label\{[^}]*gap:4px;font-size:12px/);
assert.match(css, /\.button-small\{height:32px;min-height:32px;padding:0 8px/);
assert.doesNotMatch(css, /\.header-row\{[^}]*flex-wrap:wrap/);
assert.match(css, /\.concept-pill\{[^}]*height:24px/);
assert.match(css, /\.phone-brand\{[^}]*min-height:44px/);
console.log('PASS BRIEF5: navigation and in-page focus, numeric accessible badges, create columns, local category icons and responsive density');
