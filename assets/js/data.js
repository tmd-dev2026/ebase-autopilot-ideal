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
    { id: 'fix', icon: '⚒', verb: '直す', label: '要修正の出品', explanation: '出品が止まった理由と、次に直す場所を確認します。' },
    { id: 'message', icon: '✉', verb: '返信する', label: '未返信メッセージ', explanation: '購入者の原文と返信案を読み、確認してから送信します。' },
    { id: 'offer', icon: '◇', verb: '判断する', label: '受信オファー', explanation: '購入者からの価格提案です。費用を引いた手残りで判断します。' },
    { id: 'shipment', icon: '▣', verb: '発送登録', label: '発送待ち', explanation: '発送した荷物の追跡番号をここに一度だけ入力します。' },
    { id: 'ended', icon: '⊘', verb: '取り下げる', label: '仕入れ元終了', explanation: '仕入れられなくなった商品の出品を終了します。' }
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
})();
