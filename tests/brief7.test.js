'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { boot } = require('./app.test.js');
const app = boot(), w = app.window, D = w.IdealData, U = w.IdealAfterUI;
const css = fs.readFileSync('assets/css/app.css', 'utf8');
for (const mode of w.IdealCore.modes) {
  w.IdealCore.setMode(mode);
  for (const [, entries] of D.groups) for (const [route] of entries) {
    const html = w.IdealScreens[route].render();
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.doesNotMatch(html, /データ・金額・件数/);
  }
  for (const route of ['orders', 'returns']) {
    const html = w.IdealScreens[route].render();
    const flows = [...html.matchAll(/<ol class="stepper">(.*?)<\/ol>/g)];
    assert.equal(flows.length, route === 'orders' ? D.orders.length : D.returnCases.length);
    for (const [, flow] of flows) {
      assert.equal((flow.match(/aria-current="step"/g) || []).length, 1);
      assert.equal((flow.match(/<li /g) || []).length, route === 'orders' ? 4 : 5);
      assert.doesNotMatch(flow, /○|✓|→ 現在/);
    }
  }
  const offers = w.IdealScreens.offers.render();
  const incomingChip = w.IdealMarks.component('incomingOffer');
  assert.match(incomingChip, /title="将来：受信オファー/);
  assert.doesNotMatch(incomingChip, /改/);
  assert.ok(offers.includes('<h2>受信オファー ' + incomingChip + '</h2>'));
  const today = w.IdealToday.render();
  const note = '<p class="muted">この試作ではダミーで動きます。本物にするには eBay の新しい連携が必要です</p>';
  for (const html of [today, offers]) {
    assert.ok(html.includes(note));
    assert.ok(html.includes(incomingChip));
  }
  if (mode !== '上級') {
    const heading = [...today.matchAll(/<h2>.*?<\/h2>/g)].find(match => match[0].includes('受信オファー'));
    assert.ok(heading && heading[0].includes(incomingChip));
  }
  for (const route of ['today', 'offers']) {
    const mapping = w.IdealMarks.card(route);
    assert.ok(mapping.includes('受信オファーは本物には受信の仕組みがなく、eBay の新しい連携が必要(将来)'));
    assert.ok(mapping.includes('ウォッチャーからの送信は現行のオファー送信を使います'));
  }
  for (const row of D.watchers) {
    const hasInput = offers.includes('data-discount="' + row.id + '"');
    assert.equal(hasInput, row.listing.state === '出品中');
    if (!hasInput) assert.doesNotMatch(w.IdealScreens.offers.proposal(row), /<input|<button/);
  }
}
assert.ok(D.watchers.some(r => r.listing.state === '出品中'));
assert.ok(D.watchers.some(r => r.listing.state !== '出品中'));
assert.match(U.stepper(['A', 'B', 'C'], 1), /is-done[\s\S]*<svg[\s\S]*is-current[\s\S]*is-upcoming/);
for (const row of D.orders) {
  const html = w.IdealScreens.orders.balance(row);
  assert.match(html, /balance-summary[\s\S]*手残り[\s\S]*<details><summary>損益の内訳/);
  assert.doesNotMatch(html, /<details[^>]*\bopen/);
}
const lossOrder = D.orders.find(o => w.IdealAftersale.balance(o)?.yen < 0);
assert.match(w.IdealScreens.orders.balance(lossOrder).split('<details>')[0], /⚠ 赤字：送料の見込み違い/);
assert.match(w.IdealScreens.returns.render(), /<section class="card[^>]*><p class="compact-notice">手順は例/);
assert.match(U.trackingHTML(D.orders[0]), /tracking-controls[\s\S]*<input[\s\S]*<button class="primary" type="submit"[\s\S]*tracking-reason/);
const thread = w.IdealScreens.messages.thread(D.conversations[0]);
assert.match(thread, /thread-header[\s\S]*Alex Example[\s\S]*listing-product[\s\S]*badge-status/);
assert.match(thread, /<textarea rows="4"/);
assert.equal((thread.match(/class="primary"/g) || []).length, 1);
assert.match(w.IdealScreens.messages.thread(D.conversations.find(r => r.confidence < 70)), /class="warning-notice" role="alert"/);
assert.match(css, /\.conversation-thread \[data-after="back"\] \{ display: none;/);
assert.match(css, /@media \(max-width: 1023px\) \{[^@]*\.conversation-thread \[data-after="back"\] \{ display: inline-flex;/);
assert.match(css, /@media \(max-width: 599px\) \{[^@]*\.stepper \{ flex-direction: column;/);
assert.match(css, /tracking-controls label[^}]*280px/);
assert.match(css, /\.offer-controls input \{ width: 72px;/);
const days = w.IdealAftersale.reports(D.orders, D.listings).days;
assert.equal(days.length, 7);
assert.ok(days.some(d => d.count === 0 && d.yen === null));
const sample = days.map((d, i) => ({ ...d, yen: i === 0 ? -100 : i === 1 ? 200 : i === 2 ? 0 : null }));
const chart = w.IdealScreens.reports.chart(sample);
assert.match(chart, /viewBox="0 0 640 200" role="img" aria-label="[^"]*赤字/);
assert.match(chart, /fill="var\(--primary\)"/);
assert.match(chart, /fill="var\(--loss\)"/);
assert.doesNotMatch(chart, /fill="(?:#000(?:000)?|black|currentColor)"/);
assert.equal((chart.match(/<rect /g) || []).length, 3); // Confirmed zero is a real bar, empty days are ticks.
assert.equal((chart.match(/>—<\/text>/g) || []).length, 4);
assert.equal((chart.match(/font-size="12"/g) || []).length, 14);
assert.match(w.IdealScreens.reports.render(), /<details class="chart-table"><summary>表で見る<\/summary><table[\s\S]*グラフのテキスト代替/);
const zeroOrder = { ...D.orders.find(o => o.state === '完了'), gross: 100, cost: 10000, actualShipping: 3175, refund: 0 };
const zeroDay = w.IdealAftersale.reports([zeroOrder], []).days.find(d => d.date === zeroOrder.date);
assert.equal(Math.round(zeroDay.yen), 0);
assert.equal(zeroDay.count, 1);
const ads = w.IdealScreens.ads.render();
assert.match(ads, /badge-status[^>]*data-status="draft"[^>]*>出品停止中/);
assert.match(ads, /class="switch" role="switch"[\s\S]*switch-track/);
assert.doesNotMatch(ads, /ad-impact is-visible/);
assert.match(css, /tr:hover \.ad-impact, tr:focus-within \.ad-impact, \.ad-impact.is-visible \{ display: block;/);
console.log('PASS BRIEF7: all-route headers, shared steppers, collapsed balances, message layout, inactive offers, chart loss/zero/empty days, text alternative and ad styling');
