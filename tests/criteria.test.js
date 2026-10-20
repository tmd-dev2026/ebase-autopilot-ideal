'use strict';
const assert = require('node:assert/strict');
const A = require('../assets/js/criteria.js');
const V = require('../assets/js/checks.js');
const data = {
  settings: { marginFloor: 10, discountLimit: 30, avoid: [], tone: '丁寧', duties: 'DDU', shipping: 'Tracked delivery', returns: 'Returns within 30 days', payment: 'Managed payments' },
  listings: [
    { id: 'l1', name: '低利益', gross: 100, originalGross: 120, shipping: 2000, cost: 9000, category: '電池内蔵', brand: 'Example', condition: 'ジャンク' },
    { id: 'l2', name: '高利益', gross: 200, shipping: 2000, cost: 5000 }
  ],
  drafts: [{ id: 'd1', title: '下書き', gross: 100, shipping: 2000, cost: 9000, category: '電池内蔵' }], decisions: []
};
assert.ok(Math.abs(A.margin(data.listings[0]) - 14.032258064516128) < 1e-9);
let impact = A.preview(data, 'marginFloor', 20);
assert.equal(impact.count, 2);
assert.deepEqual(impact.ids, ['l1', 'd1']);
assert.deepEqual(impact.names, ['低利益', '下書き']);
assert.equal(impact.listings, 2); assert.equal(impact.drafts, 1);
assert.deepEqual(A.preview(data, 'marginFloor', 80).ids, ['l1', 'l2', 'd1']);
assert.equal(A.preview(data, 'marginFloor', 5).text, '影響なし');
for (const [type, value, ids] of [['category', '電池内蔵', ['l1', 'd1']], ['brand', 'Example', ['l1']], ['condition', 'ジャンク', ['l1']]]) {
  assert.deepEqual(A.preview(data, 'avoid', [{ type, value, reason: '確認が必要' }]).ids, ids);
}
assert.equal(A.preview(data, 'discountLimit', 40).text, '影響なし');
assert.deepEqual(A.preview(data, 'discountLimit', 10).ids, ['l1']);
for (const [key, value] of [['duties', 'DDP'], ['shipping', ''], ['returns', ''], ['payment', ''], ['tone', '簡潔']]) {
  assert.deepEqual(A.preview(data, key, value).ids, ['d1']);
}
assert.equal(A.save(data, 'marginFloor', 20, ''), null);
assert.equal(A.save(data, 'marginFloor', 20, 'ab'), null);
assert.equal(A.save(data, 'marginFloor', NaN, '理由あり'), null);
const undo = A.save(data, 'marginFloor', 20, '送料を見直したため');
assert.equal(data.settings.marginFloor, 20);
assert.equal(data.decisions[0].from, 10); assert.equal(data.decisions[0].to, 20);
assert.match(data.decisions[0].what, /10 → 20/); assert.equal(data.decisions[0].who, 'あなた');
assert.ok(data.decisions[0].date); assert.equal(undo(), true);
assert.equal(data.settings.marginFloor, 10); assert.equal(data.decisions.length, 0); assert.equal(undo(), false);
const draft = { ...data.drafts[0], description: 'Description', specifics: { Brand: 'Example', Type: 'Example' }, confidence: 92, photos: [1, 2, 3] };
const price = () => V.validateListing(draft, data.settings).checks.find(c => c.id === 'price');
assert.equal(price().status, 'ok');
A.save(data, 'marginFloor', 20, '手残りを確保するため');
assert.equal(price().status, 'warn'); assert.match(price().reason, /利益率が下限未満/);
assert.equal(V.validateListing(draft, data.settings).canPublish, true);
draft.gross = 30;
assert.equal(price().status, 'block'); assert.equal(V.validateListing(draft, data.settings).canPublish, false);
console.log('PASS criteria: exact impact sets, all setting types, positive controls, reasons, before/after, undo and shared margin validation');

impact = A.preview(data, 'tone', '簡潔');
assert.equal(impact.affectedListings, 0);
assert.equal(impact.affectedDrafts, 1);
assert.match(impact.text, /出品 0 件・下書き 1 件が変わります（出品2件・下書き1件のうち/);
assert.equal(impact.count, impact.affectedListings + impact.affectedDrafts);
