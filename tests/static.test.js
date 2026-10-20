'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const jsFiles = fs.readdirSync(path.join(root, 'assets/js'), { recursive: true }).filter(p => p.endsWith('.js'));
const html = read('index.html'), css = read('assets/css/app.css').replace(/\s*([{}:;,])\s*/g, '$1');
const sources = [html, css, read('assets/css/tokens.css'), read('assets/js/products-data.js'), ...jsFiles.map(p => read('assets/js/'+p))].join('\n');
const marks = read('assets/js/marks.js');
assert.match(marks, /incomingOffer: \['将来', '受信オファー\(購入者からのオファーの受信\)'\]/);
assert.doesNotMatch(marks, /\['改', '受信オファー\(/);
assert.match(marks, /inbox: \['改', '未返信メッセージを今日に出す'\]/);
assert.doesNotMatch(marks, /未返信メッセージ・オファーを今日に出す/);
assert.match(marks, /inlineOffer: \['改', '行の中でオファー'\]/);
for (const screen of ['today', 'offers']) {
  const source = read('assets/js/screens/' + screen + '.js');
  assert.ok(source.includes('この試作ではダミーで動きます。本物にするには eBay の新しい連携が必要です'));
  assert.ok(source.includes("'incomingOffer'"));
}
function network(s) { return /\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon\s*\(|importScripts\s*\()|https?:\/\/[^\s'"<]+|(?:src|href)\s*=\s*["'](?:https?:|\/\/)|url\(\s*["']?(?:https?:|\/\/)/i.test(s); }
assert.equal(network(sources), false);
for (const bad of ['fetch("x")', 'new XMLHttpRequest()', 'new WebSocket("x")', '<img src="https://cdn.invalid/x">', '@import "https://cdn.invalid"', 'url(//cdn.invalid/x)', 'navigator.sendBeacon("x")']) assert.equal(network(bad), true, bad);
assert.match(html, /name="robots" content="noindex,nofollow"/); assert.match(read('robots.txt'), /User-agent: \*\s+Disallow: \//);
assert.doesNotMatch(html, /type="module"/); assert.doesNotMatch(sources, /\b(?:alert|prompt)\s*\(/); // No native alert/prompt.
assert.doesNotMatch(read('assets/js/shell.js'), /window\.(?:confirm|alert|prompt)\s*\(/);
function fontSizes(s) { return [...s.matchAll(/font-size\s*:\s*([\d.]+)px|font\s*:\s*([\d.]+)px/g)].map(m => Number(m[1]||m[2])); }
assert.ok(fontSizes(css).length > 8); assert.ok(fontSizes(css).every(n=>n>=12)); assert.equal(fontSizes('.bad{font-size:11px}').every(n=>n>=12),false);
assert.match(css, /outline:3px solid/); assert.match(css, /prefers-reduced-motion/); assert.match(css, /min-height:44px/); assert.match(css, /min-width:1024px/);
assert.match(html, /href="#main"/); assert.match(html, /id="main" tabindex="-1"/);
function promiseCopy(s) { return /必ず稼げ|利益保証|収入保証|確実に儲|誰でも月収|guaranteed income/i.test(s); }
assert.equal(promiseCopy(sources),false); assert.equal(promiseCopy('利益保証'),true);
for (const label of ['今日','リサーチ','候補','取り込み','作る','出品管理','注文・発送','メッセージ','返品とクレーム','ウォッチャーとオファー','広告','収益とレポート','判断軸','自動処理','eBay連携と初期設定']) assert.ok(read('assets/js/data.js').includes(label));
for (const label of ['構想(未実装)','試作のため検索は動きません','この画面で困った','既知の不具合','この画面を運営に送る','元に戻す']) assert.ok(sources.includes(label));
// Text contrast for the actual token combinations used in the interface.
function luminance(hex) { const parts=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return parts[0]*0.2126+parts[1]*0.7152+parts[2]*0.0722; }
function ratio(a,b) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
const tokenBlocks=[...read('assets/css/tokens.css').matchAll(/\{([^{}]*--background:[^{}]*)\}/g)];
assert.ok(tokenBlocks.length>=2);
for (const block of tokenBlocks) { const colors=Object.fromEntries([...block[1].matchAll(/--([\w-]+):(#\w{6})/g)].map(m=>[m[1],m[2]])); for (const fg of ['foreground','muted-foreground','link','loss']) for (const bg of ['background','card','muted']) assert.ok(ratio(colors[fg],colors[bg])>=4.5,fg+' on '+bg); }
assert.ok(ratio('#eeeeee','#ffffff')<4.5);
// All local references exist; no build server or module loader required.
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) if (!match[1].startsWith('#')) assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
console.log('PASS static: offline policy with positive controls, robots, type sizes, accessibility hooks, contrast, copy and local assets');

assert.match(css, /\.mark\{[^}]*font-size:12px[^}]*height:22px/);
assert.match(css, /\.header-row\{[^}]*display:flex[^}]*min-height:40px[^}]*white-space:nowrap/);
assert.doesNotMatch(css, /\.(?:heading|tools|preferences)\s*\{/);
assert.match(css, /position:sticky;top:0;height:100vh;overflow-y:auto/);
assert.match(css, /\.metric\.estimated\{border-style:dashed/);
assert.match(css, /\.metric\.confirmed\{border-style:solid/);
assert.match(css, /\.task img\{width:40px;height:40px/);
assert.match(css, /\.desktop-preferences,\.desktop-label\{display:none/);
assert.equal((sources.match(/data-action="legend"/g) || []).length, 4); // Header, phone, footer and each screen's page header.
for (const block of tokenBlocks) {
  const colors=Object.fromEntries([...block[1].matchAll(/--([\w-]+):(#\w{6})/g)].map(m=>[m[1],m[2]]));
  for (const bg of ['primary','primary-hover']) assert.ok(ratio(colors['primary-foreground'],colors[bg])>=4.5);
}
console.log('PASS polish static: compact layout, mark sizing, sticky sidebar, responsive controls, legend entry points and filled-button contrast');
