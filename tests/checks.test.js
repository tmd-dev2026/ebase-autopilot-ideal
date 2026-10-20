'use strict';
const assert = require('node:assert/strict');
const V = require('../assets/js/checks.js');
const settings = { shipping: 'tracked', returns: '30 days', payment: 'managed', duties: 'DDU' };
const fresh = () => ({ title: 'Example item', description: 'Example description', specifics: { Brand: 'Example', Type: 'Card' }, category: 'Cards', confidence: 95, photos: ['a', 'b', 'c'], gross: 120, shipping: 6500, cost: 7500 });
const check = (d, id, s = settings) => V.validateListing(d, s).checks.find(c => c.id === id);
let d = fresh(), result = V.validateListing(d, settings);
assert.equal(result.canPublish, true);
assert.ok(result.checks.every(c => c.status === 'ok'));
assert.ok(Math.abs(result.takeHome.yen - 1822.4) < 0.000001);
assert.equal(result.takeHome.usd, result.takeHome.yen / 155);
for (const c of result.checks) for (const key of ['id', 'label', 'status', 'reason', 'canFix', 'fixLabel', 'effect']) assert.ok(key in c);
d.specifics.Brand = ''; assert.equal(check(d, 'required').status, 'block'); assert.match(check(d, 'required').reason, /Brand/);
d.specifics.Brand = 'Example'; assert.equal(V.validateListing(d, settings).canPublish, true);
for (const [confidence, status] of [[85, 'ok'], [84, 'warn'], [60, 'warn'], [59, 'block'], [null, 'block'], [undefined, 'block']]) {
  d.confidence = confidence; assert.equal(check(d, 'category').status, status);
  if (status === 'block') assert.match(check(d, 'category').reason, /人が決めてください/);
}
d = fresh(); d.photos = []; assert.equal(check(d, 'photos').status, 'block');
d.photos = ['a', 'b', 'c']; d.photoDamage = true; assert.equal(check(d, 'photos').status, 'warn'); assert.equal(V.validateListing(d, settings).canPublish, true);
d.photoDamage = false; assert.equal(check(d, 'photos').status, 'ok');
d.risks = ['電池内蔵', '本革', '製品安全']; assert.equal(check(d, 'regulations').status, 'warn'); assert.match(check(d, 'regulations').reason, /配送条件/);
d = fresh(); d.gross = 90; result = V.validateListing(d, settings);
assert.equal(result.canPublish, false); assert.match(check(d, 'price').reason, /⚠ 赤字/);
for (const fix of ['価格を上げる', '送料を見直す', '仕入れ値を確認']) assert.ok(check(d, 'price').fixLabel.includes(fix));
for (const key of ['gross', 'shipping', 'cost']) for (const value of [0, null, undefined, NaN, Infinity, -1]) {
  const unknown = fresh(); unknown[key] = value;
  assert.equal(check(unknown, 'price').status, 'unknown'); assert.match(check(unknown, 'price').reason, /— 計算できません/); assert.equal(V.validateListing(unknown, settings).canPublish, false);
}
d = fresh(); d.duplicate = true; assert.equal(check(d, 'duplicate').status, 'warn');
for (const [key, label] of [['shipping', '配送'], ['returns', '返品'], ['payment', '支払い']]) {
  const s = { ...settings, [key]: '' }; assert.equal(check(d, 'policies', s).status, 'block'); assert.ok(check(d, 'policies', s).reason.includes(label));
}
assert.equal(check(d, 'duties', { ...settings, duties: '' }).status, 'block');
for (const duties of ['DDP', 'DDU']) assert.equal(check(d, 'duties', { ...settings, duties }).status, 'ok');
d = fresh(); d.gross = 90; const decisions = [];
for (const mode of ['はじめて', 'ふだん']) assert.equal(V.recordOverride(d, settings, mode, '在庫整理', decisions), false);
assert.equal(V.recordOverride(d, settings, '上級', '', decisions), false);
assert.equal(V.recordOverride(d, settings, '上級', '在庫整理', decisions), true);
assert.equal(decisions.length, 1); assert.equal(decisions[0].who, 'あなた'); assert.equal(decisions[0].reason, '在庫整理');
for (const mutate of [x => { x.specifics.Type = ''; }, x => { x.confidence = null; }, x => { x.gross = null; }]) {
  const blocked = fresh(); blocked.gross = 90; mutate(blocked); assert.equal(V.recordOverride(blocked, settings, '上級', '理由', decisions), false);
}
assert.equal(V.recordOverride(d, { ...settings, shipping: '' }, '上級', '理由', decisions), false);
d.gross = 150; assert.equal(V.validateListing(d, settings).canPublish, true);
console.log('PASS checks: every status, boundaries, fixes, unknown values, policies, duties and restricted recorded overrides');
const warningText = fresh(); warningText.description = '電池内蔵・本革・製品安全';
assert.equal(check(warningText, 'regulations').status, 'warn');
assert.match(check(warningText, 'regulations').reason, /電池内蔵.*本革.*製品安全/);
