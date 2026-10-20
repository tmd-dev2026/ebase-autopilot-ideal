'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
const read = file => fs.readFileSync(file, 'utf8');
const css = read('assets/css/app.css').replace(/\s*([{}:;,])\s*/g, '$1');
const tokens = read('assets/css/tokens.css');
const html = read('index.html');
const app = boot();
const D = app.window.IdealData;

// Header is a sibling before the sidebar/workspace, spanning both columns.
assert.match(html, /<header id="header"><\/header><aside id="sidebar"/);
assert.doesNotMatch(html, /class="workspace"><header/);
assert.match(css, /header\{[^}]*grid-column:1\/-1/);
assert.match(app.node('header').innerHTML, /data-action="home"[^>]*>[\s\S]*eBase Autopilot/);
assert.match(app.node('header').innerHTML, /data-action="legend">構想\(未実装\)/);
app.click('home');
assert.equal(app.window.location.hash, '#/today');
assert.match(css, /grid-template-columns:240px minmax\(0,1fr\)/);
assert.match(css, /#sidebar\{[^}]*width:240px[^}]*border-right:1px solid var\(--sidebar-border\)/);
assert.match(css, /\.nav-group h2\{[^}]*background:var\(--sidebar-border\)[^}]*padding:4px 10px[^}]*border-radius:6px/);
assert.doesNotMatch(app.window.IdealShell.nav(), /<details|<summary|aria-expanded|chevron/);
assert.equal((app.window.IdealShell.nav().match(/<svg /g) || []).length, 15);
assert.match(read('assets/js/icons.js'), /stroke-width="1.5"/);
assert.doesNotMatch(read('assets/js/icons.js'), /https?:|<img|<use|@import/);

for (const mode of app.window.IdealCore.modes) {
  app.window.IdealCore.setMode(mode);
  for (const [, entries] of D.groups) {
    for (const [route] of entries) {
      const screen = app.window.IdealScreens[route].render();
      assert.equal((screen.match(/<h1>/g) || []).length, 1, route + ' ' + mode);
      assert.ok(screen.startsWith('<div class="page-header"><h1>'), route);
      assert.match(screen, /class="card correspondence">[\s\S]*<\/section>$/);
    }
  }
}
assert.match(css, /\.page-header\{[^}]*height:44px[^}]*border-bottom:1px solid var\(--border-subtle\)/);
assert.match(css, /body\{[^}]*font:13px/);
assert.match(css, /main\{[^}]*max-width:1400px[^}]*padding:12px/);
assert.match(css, /\.card\{[^}]*border-radius:6px[^}]*padding:12px[^}]*box-shadow:var\(--shadow-card\)/);
assert.match(css, /\.mark\{[^}]*font-size:12px[^}]*height:22px[^}]*color:var\(--muted-foreground\)/);
function coloredRail(source) { return /border-left\s*:\s*4px\s+solid/.test(source); }
assert.equal(coloredRail(css), false);
assert.equal(coloredRail('.bad { border-left: 4px solid red; }'), true);
assert.doesNotMatch(css, /font-size:(?:[0-9]|1[01])px/);
assert.match(css, /@media\(max-width:1023px\)[\s\S]*\.segmented button,\.nav-group a,\.legend-link\{min-height:44px/);
for (const name of ['sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-accent', 'sidebar-border', 'sidebar-ring', 'shadow-card', 'shadow-pop']) {
  assert.equal((tokens.match(new RegExp('--' + name + ':', 'g')) || []).length, 3, name);
}
const stateChip = app.window.IdealScreens.listings.stateChip;
for (const [state, status] of [['下書き', 'draft'], ['予約済み', 'scheduled'], ['出品中', 'active'], ['売却済', 'sold'], ['eBay終了', 'ended'], ['要修正', 'error']]) {
  assert.match(stateChip(state), new RegExp('class="badge-status" data-status="' + status + '"'));
}
assert.match(stateChip('注意'), /status-warning/);
assert.match(css, /\.badge-status::before\{[^}]*width:8px[^}]*height:8px/);
assert.match(css, /data-status="draft"\]\{[^}]*--_dot:transparent[^}]*--_ring:var\(--neutral-solid\)/);
assert.match(css, /data-status="sold"\]\{[^}]*--_dot:var\(--sold-solid\)/);
console.log('PASS reskin: full-width shell, local icons, 15 routes × 3 modes, density, phone targets, tokens and six status styles');
