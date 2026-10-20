(function (root) {
  'use strict';
  function takeHome(gross, shipping, cost) {
    if (![gross, shipping, cost].every(function (n) { return Number.isFinite(n) && n > 0; })) return null;
    var yen = (gross - (gross * (0.1325 + 0.0135) + 0.40)) * 155 - shipping - cost;
    return { yen: yen, usd: yen / 155 };
  }
  function evaluate(row, settings) {
    settings = settings || {};
    var money = takeHome(row.gross, row.shipping, row.cost), warnings = [];

    function normalize(value) { return String(value || '').toLowerCase().replace(/ニコラ/g, 'nikora').replace(/腕時計/g, 'watches'); }
    var avoid = (settings.avoid || []).filter(function (rule) {
      var value = rule.type === 'brand' ? row.brand || (row.specifics || {}).Brand : row[rule.type];
      if (rule.type === 'category') value = String(value || '') + ' ' + (row.ruleTags || []).join(' ');
      return normalize(value).includes(normalize(rule.value));
    });
    if (money && money.yen / (row.gross * 155) * 100 < settings.marginFloor) warnings.push('利益率が下限未満');
    var discount = Number.isFinite(row.originalGross) ? (1 - row.gross / row.originalGross) * 100 : 0;
    if (discount > settings.discountLimit + 0.000001) warnings.push('割引率が上限を超えています');
    avoid.forEach(function (r) { warnings.push('避ける商品：' + r.value + '・' + r.reason); });
    return { warnings: warnings, avoided: avoid.length > 0, discountExceeded: discount > settings.discountLimit + 0.000001, duties: row.duties || settings.duties, takeHome: money };
  }
  function validateListing(draft, settings) {
    if (root.IdealData && root.IdealData.proposed) draft = root.IdealData.proposed(draft);
    settings = settings || {};
    var rules = evaluate(draft, settings);
    var checks = [], money = takeHome(draft.gross, draft.shipping, draft.cost);
    function add(id, label, status, reason, fixLabel, canFix) {
      checks.push({ id: id, label: label, status: status, reason: reason,
        canFix: status === 'ok' ? null : (canFix || 'self'), fixLabel: fixLabel || '',
        effect: status === 'block' || status === 'unknown' ? '修正するまで出品できません' : status === 'warn' ? '内容を確認して出品できます' : '出品を妨げません' });
    }
    var missing = (draft.required || ['Brand', 'Type']).filter(function (key) { return !String((draft.specifics || {})[key] || '').trim(); });
    if (!draft.title || !draft.title.trim()) missing.push('タイトル');
    if (!draft.description || !draft.description.trim()) missing.push('説明');
    if ((draft.title || '').length > 80) missing.push('タイトルを80文字以内に短縮');
    add('required', '必須項目', missing.length ? 'block' : 'ok', missing.length ? missing.join('・') + '。編集欄に入力してください。' : '必須項目は入力済みです。', '必須項目を入力');
    var confidence = draft.confidence;
    var categoryStatus = !draft.category || !Number.isFinite(confidence) || confidence < 60 ? 'block' : confidence < 85 ? 'warn' : 'ok';
    add('category', 'カテゴリの確度', categoryStatus, categoryStatus === 'block' ? '人が決めてください。候補を比較して選んでください。' : categoryStatus === 'warn' ? '候補を比較し、商品に合う分類を選んでください。' : '選択した分類を使用できます。', 'カテゴリ候補を選ぶ');
    add('photos', '画像', (draft.photos || []).length < 3 ? 'block' : draft.photoDamage ? 'warn' : 'ok', (draft.photos || []).length < 3 ? '写真が不足しています。元画像を3枚以上使ってください。' : draft.photoDamage ? '背景処理で被写体が消えすぎています。元画像を使って確認してください。' : '写真は3枚以上あります。', '元画像を使う');
    var risks = (draft.risks || []).slice();
    var text = [draft.title, draft.description, JSON.stringify(draft.specifics || {})].join(' ');
    [['電池内蔵|built.in battery', '電池内蔵'], ['本革|genuine leather', '本革'], ['製品安全|product safety', '製品安全'], ['商標未確認|trademark unverified', '商標の確認が必要']].forEach(function (rule) {
      if (new RegExp(rule[0], 'i').test(text) && !risks.includes(rule[1])) risks.push(rule[1]);
    });
    add('regulations', '禁止語・商標・規制', risks.length ? 'warn' : 'ok', risks.length ? risks.join('・') + '。根拠と配送条件を確認し、確認できない表記は説明から除いてください。' : '試作の検査対象に注意語はありません。実物の規制確認も必要です。', '説明を見直す');
    add('price', '価格と赤字', money === null ? 'unknown' : money.yen < 0 ? 'block' : money.yen / (draft.gross * 155) * 100 < (settings.marginFloor || 0) ? 'warn' : 'ok', money === null ? '— 計算できません。価格・送料・仕入れ値に確認済みの正の数を入力してください。' : money.yen < 0 ? '⚠ 赤字。価格を上げる／送料を見直す／仕入れ値を確認してください。' : money.yen / (draft.gross * 155) * 100 < (settings.marginFloor || 0) ? '利益率が下限未満。価格・送料・判断軸を確認してください。' : '例の手数料と費用を引いた手残りは赤字ではありません。', '価格を上げる／送料を見直す／仕入れ値を確認');
    var duplicate = root.IdealData && root.IdealData.duplicates ? root.IdealData.duplicates(draft).length > 0 : draft.duplicate;
    add('duplicate', '重複出品', duplicate ? 'block' : 'ok', duplicate ? '同じ商品が出品中です。出品管理で在庫と重複を確認してください。' : '試作データに重複はありません。', '出品管理を見る');
    var unset = [['shipping', '配送'], ['returns', '返品'], ['payment', '支払い']].filter(function (p) { return !(p[0] === 'shipping' && draft.shippingPolicy !== undefined ? draft.shippingPolicy : settings[p[0]]); }).map(function (p) { return p[1]; });
    add('policies', '配送・返品・支払いポリシーの設定', unset.length ? 'block' : 'ok', unset.length ? unset.join('・') + 'ポリシーが未設定です。この画面で選択してください。' : '配送・返品・支払いの設定があります。', 'ポリシーを選ぶ');
    add('duties', '関税の案内', ['DDP', 'DDU'].includes(rules.duties) ? 'ok' : 'block', ['DDP', 'DDU'].includes(rules.duties) ? rules.duties + ' の案内を表示します。負担する人を確認してください。' : 'DDP／DDUが未設定です。負担する人を選んでください。', '関税の案内を選ぶ');
    add('rules', '判断軸', rules.avoided || rules.discountExceeded ? 'block' : 'ok', rules.warnings.join('・') || '判断軸の条件内です');
    if (draft.sourceEnded || ['仕入れ元終了', '対象外'].includes(draft.preWithdrawState || draft.state)) add('availability', '仕入れ元・対象条件', 'block', '仕入れ元終了または対象外です。再出品できません');
    if (/genuine leather/i.test((draft.specifics || {}).Material || '') && /faux leather/i.test(draft.description || '')) add('material', '素材の一致', 'block', '素材の表記が一致していません');
    if (draft.repairIssue) add('repair', '内容の不一致', 'block', draft.repairIssue);
    if (root.IdealData && !root.IdealData.connection.connected) add('connection', '接続状態', 'block', '出品できません：eBay連携が切断中です');
    var blockers = checks.filter(function (c) { return c.status === 'block' || c.status === 'unknown'; });
    var warnings = checks.filter(function (c) { return c.status === 'warn'; });
    add('impact', '出品への影響', blockers.length ? 'block' : 'ok', blockers.length ? '停止理由を直すと出品できます。' : '試作内で出品できます。実際のサービスの成功を保証するものではありません。', '停止理由を直す');
    var order = { block: 0, unknown: 0, warn: 1, ok: 2 };
    checks.sort(function (a, b) { return order[a.status] - order[b.status]; });
    return { checks: checks, canPublish: blockers.length === 0, blockers: blockers, warnings: warnings, takeHome: money };
  }
  function canOverride(result, mode, reason) {
    return mode === '上級' && String(reason || '').trim().length >= 3 && result.blockers.length === 1 && result.blockers[0].id === 'price' && result.takeHome !== null && result.takeHome.yen < 0;
  }
  function recordOverride(draft, settings, mode, reason, decisions) {
    if (!canOverride(validateListing(draft, settings), mode, reason)) return false;
    decisions.push({ date: new Date().toISOString(), what: draft.title + '：赤字で出品', item: draft.title, gross: draft.gross, takeHome: takeHome(draft.gross, draft.shipping, draft.cost), listingId: 'published-' + draft.id, mode: mode, reason: reason.trim(), who: 'あなた' });
    return true;
  }
  var api = { evaluate: evaluate, validateListing: validateListing, takeHome: takeHome, canOverride: canOverride, recordOverride: recordOverride };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IdealChecks = api;
})(typeof window === 'undefined' ? globalThis : window);
