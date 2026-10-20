(function () {
  'use strict';
  var groups = [
    ['', [['today', '今日']]],
    ['仕入れ', [['sourcing', 'リサーチ'], ['candidates', '候補'], ['import', '取り込み']]],
    ['出品', [['create', '作る'], ['listings', '出品管理']]],
    ['売れたあと', [['orders', '注文・発送'], ['messages', 'メッセージ'], ['returns', '返品とクレーム']]],
    ['改善', [['offers', 'ウォッチャーとオファー'], ['ads', '広告'], ['reports', '収益とレポート']]],
    ['判断軸と設定', [['criteria', '判断軸'], ['automation', '自動処理'], ['setup', 'eBay連携と初期設定']]]
  ];
  var categories = [
    { id: 'fix', icon: 'wrench', verb: '直す', label: '要修正の出品', explanation: '出品が止まった理由と、次に直す場所を確認します。' },
    { id: 'message', icon: 'mail', verb: '返信する', label: '未返信メッセージ', explanation: '購入者の原文と返信案を読み、確認してから送信します。' },
    { id: 'offer', icon: 'offers', verb: '判断する', label: '受信オファー', explanation: '購入者からの価格提案です。費用を引いた手残りで判断します。' },
    { id: 'shipment', icon: 'orders', verb: '発送登録', label: '発送待ち', explanation: '発送した荷物の追跡番号をここに一度だけ入力します。' },
    { id: 'ended', icon: 'archive-x', verb: '取り下げる', label: '仕入れ元終了', explanation: '仕入れられなくなった商品の出品を終了します。' }
  ];
  var items = [
    { id: 'fix-card', category: 'fix', product: 'holo-card', cause: '状態の説明と選択した状態が違います', canFix: 'はい。説明に合わせて状態を確認できます', effect: '公開を停止しています', next: '状態を「美品・縁に使用感あり」に揃える' },
    { id: 'fix-camera', category: 'fix', product: 'film-camera', cause: '配送ポリシーが未選択です', canFix: 'はい。追跡・補償ありの設定を選べます', effect: '出品できません', next: '配送ポリシーを「追跡・補償あり」に設定する' },
    { id: 'fix-bag', category: 'fix', product: 'shoulder-bag', cause: '素材の表記が一致していません', canFix: 'はい。商品説明で確認できます', effect: '公開前の確認が必要です', next: '素材を「レザー調」に揃える' },
    { id: 'message-watch', category: 'message', product: 'wrist-watch', buyer: 'Does it come with a box?', summary: '箱が付属するか確認しています。', draft: 'Thank you for asking. The watch comes without a box.', reason: '付属品欄の「本体のみ」を参照。確信度：高（例）' },
    { id: 'message-lens', category: 'message', product: 'fd-lens', buyer: 'Are both lens caps included?', summary: '前後のキャップが付属するか確認しています。', draft: 'Thank you for asking. Both front and rear caps are included.', reason: '付属品欄の「前後キャップ」を参照。確信度：高（例）' },
    { id: 'offer-figure', category: 'offer', product: 'figure-large', gross: 90, shipping: 6500, cost: 7500 },
    { id: 'ship-camera', category: 'shipment', product: 'film-camera', country: '米国', due: '10月21日（例）' },
    { id: 'ship-watch', category: 'shipment', product: 'wrist-watch', country: 'カナダ', due: '10月22日（例）' },
    { id: 'ended-bag', category: 'ended', product: 'shoulder-bag', reason: '仕入れ元で売り切れのため'  }
  ];
  var automations = [
    { id: 'stock', name: '在庫監視', minutes: 4, result: '仕入れ元終了を1件検知', basis: '仕入れ元の掲載状態を比較', impact: '仕入れ元の在庫変化を検知できなくなります', on: true },
    { id: 'withdraw', name: '自動取り下げ', minutes: 8, result: '対象なし・取り下げ0件', basis: '在庫監視で終了が確定した商品が対象', impact: '在庫切れ商品の出品終了を手動で行う必要があります', on: true },
    { id: 'sync', name: '注文同期', minutes: 2, result: '発送待ち2件を確認', basis: '未発送の注文を照合', impact: '新しい注文がこの画面に反映されなくなります', on: true }
  ];
  window.IdealData = {
    groups: groups, categories: categories, items: items, automations: automations,
    products: window.DemoProducts.products,
    steps: [['eBay連携', true, '接続状態を確認する', 'setup'], ['ポリシー', false, '配送・返品の条件を設定する', 'setup'], ['販売実績', false, '販売実績を入力する', 'setup'], ['製品安全', false, '製品安全の情報を確認する', 'setup'], ['最初の取り込み', false, '候補の商品を取り込む', 'import']],
    active: function () { return items.filter(function (item) { return !item.done; }); },
    counts: function () { var c = { total: 0 }; categories.forEach(function (cat) { c[cat.id] = 0; }); this.active().forEach(function (item) { c[item.category]++; c.total++; }); return c; },
    badges: function () { var c = this.counts(); return { today: c.total, listings: c.fix, messages: c.message, orders: c.shipment }; },
    resolve: function (id) { var item = items.find(function (i) { return i.id === id; }); if (!item || item.done) return false; item.done = true; return true; },
    undo: function (id) { var item = items.find(function (i) { return i.id === id; }); if (item) item.done = false; },
    route: function (hash) { var route = (hash || '').replace(/^#\//, '').split('/')[0]; return groups.some(function (g) { return g[1].some(function (r) { return r[0] === route; }); }) ? route : 'today'; },
    title: function (route) { return groups.flatMap(function (g) { return g[1]; }).find(function (r) { return r[0] === route; })[1]; }
  };
  var D = window.IdealData;
  D.decisions = [];
  D.replySamples = { '丁寧': 'Thank you for your question. I would be happy to help.', 'フレンドリー': 'Hi! Thanks for asking. Happy to help!', '簡潔': 'Thanks. I will check and reply.' };
  D.connection = { connected: true, expires: '2026-12-31（例）' };
  D.automations.push({ id: 'ads-sync', name: '広告費同期', minutes: 6, result: '広告費の例を照合', basis: '広告費の記録を照合', impact: '広告費の表示が更新されなくなります', on: true });
  D.automations.forEach(function (a) {
    a.next = 10 - a.minutes;
    a.history = [0, 1, 2, 3, 4].map(function (i) { return { time: (a.minutes + i * 10) + '分前（例）', result: a.result }; });
  });
  D.automationImpact = function (a) { return a.impact + '。いつでもONで再開できます。既に処理した出品・注文は元に戻りません（例）。'; };
  D.setAutomation = function (id, on, confirmed) {
    var a = D.automations.find(function (row) { return row.id === id; });
    if (!a || (!on && !confirmed) || a.on === on) return null;
    var before = a.on;
    a.on = on;
    return function () { a.on = before; };
  };
  D.connectionWarning = function () { return D.connection.connected ? '' : '<p class="notice">例：出品できません・在庫監視と注文同期が止まります・既に出ている出品はそのまま残ります <a href="#/setup">再連携の手順へ</a></p>'; };
  D.setConnection = function (connected) { D.connection.connected = connected; D.steps[0][1] = connected; };
  D.completeStep = function (index) {
    if (!D.steps[index]) return;
    D.steps[index][1] = true;
    if (index === 0) D.setConnection(true);
  };
  D.settings = { marginFloor: 10, discountLimit: 30, tone: '丁寧', avoid: [{ type: 'category', value: '電池内蔵', reason: '配送条件の確認が必要' }, { type: 'condition', value: 'ジャンク', reason: '動作確認が難しい' }], shipping: 'Tracked delivery', returns: 'Returns within 30 days', payment: 'Managed payments', duties: 'DDU' };
  function draft(product, index) {
    return { id: 'draft-' + index, product: product.id, title: product.ai.titleEn,
      description: product.ai.descriptionEn.join('\n'), specifics: Object.fromEntries(product.ai.specifics),
      required: ['Brand', 'Type'], category: product.ai.category, confidence: 92,
      candidates: [product.ai.category, 'Collectibles > Other Collectibles'],
      photos: product.images.slice(), photoDamage: index === 0, risks: [],
      gross: product.sale + 80, shipping: 2000, cost: product.cost, duplicate: false };
  }
  D.drafts = D.products.slice(0, 3).map(draft);
  D.drafts[1].specifics.Type = '';
  D.drafts[1].confidence = 45;
  D.drafts[2].gross = 30;
  D.drafts[1].condition = 'ジャンク';
  D.drafts[1].brand = 'Example';
  var states = ['要修正', '要修正', '要修正', '仕入元終了', '出品中', '出品中', '予約済み', '要判断', '注意', 'eBay終了', '対象外', '出品中'];
  D.listings = states.map(function (state, index) {
    var product = D.products[index % 6], task = index < 3 ? items[index] : index === 3 ? items[8] : null;
    if (task) product = D.products.find(function (p) { return p.id === task.product; });
    return { id: 'listing-' + index, product: product.id, name: product.name + ' / 例 ' + (index + 1),
      category: index === 0 ? '電池内蔵' : product.ai.category, condition: product.condition, brand: product.ai.specifics[0][1], originalGross: product.sale + 80,
      state: state, taskId: task && task.id, gross: product.sale + 80, shipping: 2000, cost: product.cost,
      date: '2026-10-' + String(10 + index % 9), stock: state === '仕入元終了' ? '終了を検知' : '監視中・4分前に確認（例）',
      cause: task ? (task.cause || task.reason) : state === '要判断' ? 'カテゴリを人が選ぶ必要があります' : state === '注意' ? '画像の背景処理を確認してください' : '現在の状態を確認してください',
      next: task ? (task.next || '取り下げてください') : '内容を確認してから再出品してください',
      original: index === 0 ? 'The condition description does not match the selected condition.' : index === 1 ? 'Shipping policy is required.' : 'Please review the listing details.' };
  });
  // The 今日 tasks and listings share completion state in both directions.
  D.listings.filter(function (row) { return row.taskId; }).forEach(function (row) {
    var task = items.find(function (item) { return item.id === row.taskId; });
    var pendingState = row.state;
    Object.defineProperty(task, 'done', { configurable: true, enumerable: true,
      get: function () { return row.state !== pendingState; },
      set: function (done) { row.state = done ? (pendingState === '仕入元終了' ? 'eBay終了' : '出品中') : pendingState; }
    });
  });
  D.listingCounts = function () {
    return D.listings.reduce(function (counts, row) { counts[row.state] = (counts[row.state] || 0) + 1; return counts; }, {});
  };
  D.publish = function (id, options) {
    options = options || {};
    var entry = D.drafts.find(function (d) { return d.id === id; });
    if (!entry || entry.published) return false;
    if (options.schedule && (!Number.isFinite(Date.parse(options.schedule)) || Date.parse(options.schedule) <= Date.now())) return false;
    var result = window.IdealChecks.validateListing(entry, D.settings);
    if (!result.canPublish && !window.IdealChecks.recordOverride(entry, D.settings, options.mode, options.reason, D.decisions)) return false;
    var row = { id: 'published-' + id, product: entry.product, name: entry.title, state: options.schedule ? '予約済み' : '出品中',
      gross: entry.gross, shipping: entry.shipping, cost: entry.cost, date: options.schedule || new Date().toISOString().slice(0, 10),
      stock: '監視中（例）', cause: '', next: '', original: '', draftId: id };
    D.listings.push(row); entry.published = true;
    return row;
  };
  D.chooseCategory = function (entry, value) {
    if (!entry.candidates.includes(value)) return;
    entry.category = value; entry.confidence = 100;
    D.decisions.push({ date: new Date().toISOString(), what: entry.title + '：カテゴリ選択', reason: '商品の種類に合うため：' + value, who: 'あなた' });
  };
  D.resetWording = '失敗表示を消して「AI処理済」に戻します。この操作では出品の予約はしません(自動出品の設定によってはあとで対象になることがあります)。';
  D.bulkPreview = function (ids, action, percent) {
    var rows = D.listings.filter(function (r) { return ids.includes(r.id); });
    var valid = ['price', 'withdraw', 'relist', 'reset'].includes(action) && rows.length > 0;
    if (action === 'price' && (!Number.isFinite(percent) || percent <= 0 || percent >= 100)) valid = false;
    var losses = rows.filter(function (r) {
      var value = window.IdealChecks.takeHome(action === 'price' ? r.gross * (1 - percent / 100) : r.gross, r.shipping, r.cost);
      return value && value.yen < 0;
    }).length;
    return { ids: rows.map(function (r) { return r.id; }), action: action, percent: percent, count: rows.length, losses: losses, valid: valid,
      text: { price: '選択した商品の販売価格を一律で下げます。', withdraw: 'eBay上の出品を終了します。実際には再出品が必要です。', relist: '内容を再確認して出品中に戻します。', reset: D.resetWording }[action],
      undo: '試作内では元に戻せます。実際の出品・取り下げの履歴は消せません。' };
  };
  D.applyBulk = function (preview) {
    var current = D.bulkPreview(preview.ids, preview.action, preview.percent);
    if (!current.valid) return null;
    var rows = D.listings.filter(function (r) { return preview.ids.includes(r.id); });
    if (preview.action === 'relist' && rows.some(function (r) {
      var value = window.IdealChecks.takeHome(r.gross, r.shipping, r.cost);
      return !value || value.yen < 0 || ['要修正', '要判断', '仕入元終了', '対象外'].includes(r.state);
    })) return null;
    var snapshots = rows.map(function (r) { return Object.assign({}, r); });
    rows.forEach(function (r) {
      if (preview.action === 'price') r.gross *= 1 - preview.percent / 100;
      if (preview.action === 'withdraw') r.state = 'eBay終了';
      if (preview.action === 'relist') r.state = '出品中';
      if (preview.action === 'reset') { r.state = '対象外'; r.cause = 'AI処理済'; r.next = '自動出品の設定を確認してください'; }
    });
    return function () { rows.forEach(function (r, index) { Object.assign(r, snapshots[index]); }); };
  };
})();
