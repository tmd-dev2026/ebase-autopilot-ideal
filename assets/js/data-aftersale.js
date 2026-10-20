(function () {
  'use strict';
  var D = window.IdealData, A = window.IdealAftersale;
  function task(id) { return D.items.find(function (i) { return i.id === id; }); }
  D.orders = [
    ['ship-camera', 'film-camera', '発送待ち', 240, 2000, 2100, 18000, '2026-10-19'],
    ['ship-watch', 'wrist-watch', '発送待ち', 200, 2000, 2000, 14000, '2026-10-20'],
    ['order-bag', 'shoulder-bag', '仕入れ待ち', 180, 2000, null, 12000, '2026-10-20'],
    ['order-lens', 'fd-lens', '発送済み', 210, 2000, 2300, 13000, '2026-10-20'],
    ['order-card', 'holo-card', '完了', 100, 2000, 5020, 9000, '2026-10-19'],
    ['order-figure', 'figure-large', '完了', 220, 6500, 6500, 7500, '2026-10-20']
  ].map(function (r, i) {
    return { id: r[0], product: r[1], state: r[2], gross: r[3], shipping: r[4], actualShipping: r[5], cost: r[6], date: r[7],
      tracking: i > 2 ? 'DEMO-TRACK-000' + i : '', due: i === 0 ? '2026-10-19' : '2026-10-21',
      source: '架空フリマ「こもれび市場」', sourceEnded: i === 2, refund: 0 };
  });
  D.orders.slice(0, 2).forEach(function (row) {
    var item = task(row.id);
    Object.defineProperty(item, 'done', { configurable: true, enumerable: true,
      get: function () { return row.state !== '発送待ち'; },
      set: function (done) { row.state = done ? '発送済み' : '発送待ち'; } });
    Object.defineProperty(item, 'tracking', { configurable: true, enumerable: true,
      get: function () { return row.tracking; }, set: function (v) { row.tracking = v; } });
    item.due = row.due + '（例）';
  });
  D.conversations = [task('message-watch'), task('message-lens')];
  D.conversations.forEach(function (r, i) {
    r.buyerName = ['Alex Example', 'Robin Example'][i]; r.confidence = 92;
    r.unread = true; r.replied = false; r.sent = [];
    Object.defineProperty(r, 'done', { configurable: true, enumerable: true,
      get: function () { return r.replied && !r.unread; }, set: function (done) { r.replied = done; r.unread = !done; } });
  });
  [
    ['message-card', 'holo-card', 'Jamie Example', 'Thank you, it arrived safely.', '無事に届いたと連絡しています。', 'Thank you for letting me know.', 92, '配送状況欄：配達完了'],
    ['message-delay', 'film-camera', 'Taylor Example', 'The parcel has not arrived. Can you guarantee delivery tomorrow?', '到着が遅れており、明日届くか心配しています。', 'I will check the tracking status and get back to you.', 41, '追跡欄：輸送中。到着日は確認できません'],
    ['message-photo', 'shoulder-bag', 'Casey Example', 'Could you send a photo of the inside? <img onerror="example">', '内側の写真を希望しています。', 'I will check whether an additional photo is available.', 92, '写真欄：内側の写真なし']
  ].forEach(function (r, i) {
    D.conversations.push({ id: r[0], product: r[1], buyerName: r[2], buyer: r[3], summary: r[4], draft: r[5], confidence: r[6], reason: r[7], unread: false, replied: i === 0, sent: i === 0 ? ['Thank you for letting me know.'] : [] });
  });
  D.incomingOffer = task('offer-figure');
  D.incomingOffer.outcome = '';
  D.incomingOffer.listingId = D.listings.find(function (r) { return r.product === D.incomingOffer.product && r.state === '出品中'; }).id;
  D.counterRange = function () { var listing = D.listings.find(function (r) { return r.id === D.incomingOffer.listingId; }); var gross = listing ? listing.gross : 0; return { min: window.IdealCore.mode === '上級' ? 0 : gross * 0.5, max: gross }; };
  Object.defineProperty(D.incomingOffer, 'done', { configurable: true, enumerable: true,
    get: function () { return !!this.outcome; }, set: function (v) { this.outcome = v ? '対応済み' : ''; } });
  D.returnCases = [
    { id: 'return-card', orderId: 'order-card', kind: '返品リクエスト', original: 'The item is not as described.', summary: '説明と状態が違うという連絡です。', amount: 100, step: 1, buyerName: 'Morgan Example', draft: 'Please describe the difference and share photos so I can review it.', sent: [] },
    { id: 'claim-lens', orderId: 'order-lens', kind: '未着クレーム', original: 'The item has not arrived.', summary: '荷物が届いていないという連絡です。', amount: 210, step: 1, buyerName: 'Robin Example', draft: 'I will review the tracking information and contact you with an update.', sent: [] }
  ];
  D.watchers = D.products.map(function (p, i) {
    var listing = D.listings.find(function (r) { return r.product === p.id && r.state === '出品中'; }) ||
      D.listings.find(function (r) { return r.product === p.id; });
    return { id: 'watchers-' + i, product: p.id, listing: listing || null, watchers: [8, 3, 5, 2, 0, 8][i], views: [120, 40, 76, 28, 4, 82][i], days: [30, 12, 21, 8, 4, 30][i],
      gross: listing ? listing.gross : p.sale + 80, shipping: listing ? listing.shipping : 2000, cost: listing ? listing.cost : p.cost, discount: 10 };
  });
  // Watcher price and costs remain linked when listing management edits a listing.
  D.watchers.forEach(function (row) {
    if (row.listing) ['gross', 'shipping', 'cost'].forEach(function (key) {
      Object.defineProperty(row, key, { enumerable: true, get: function () { return row.listing[key]; }, set: function (value) { row.listing[key] = value; } });
    });
  });
  D.sentOffers = [
    { id: 'past-1', product: 'holo-card', gross: 150, count: 3, outcome: '承諾', date: '2026-10-18' },
    { id: 'past-2', product: 'fd-lens', gross: 180, count: 2, outcome: '期限切れ', date: '2026-10-19' }
  ];
  D.ads = D.products.slice(0, 5).map(function (p, i) {
    return { id: 'ad-' + i, product: p.id, rate: [3, 5, 4, 2, 3][i], spend: [900, 4500, 0, 600, 300][i], sales: [220, 150, 0, 180, 120][i], before: [4200, 3000, null, 2800, 1700][i], on: true };
  });
  // Orders represent earlier sales of separate inventory units; repair rows are new stock.
  D.orders.forEach(function (o) { o.inventoryId = 'sold-' + o.id; o.listingNote = '販売済みの別在庫。現在の修正対象とは別の商品個体です（例）'; });
  D.conversations.find(function (r) { return r.id === 'message-delay'; }).product = 'fd-lens';
  D.conversations.find(function (r) { return r.id === 'message-delay'; }).orderId = 'order-lens';
  D.conversations.forEach(function (r) { r.reason = r.reason.replace(/。確信度：[^。]+/, ''); });
  D.categories.push({ id: 'case', icon: 'returns', verb: '対応する', label: '返品・クレーム', explanation: '未完了のケースを確認し購入者へ返信します。' }, { id: 'source', icon: 'orders', verb: '購入者へ連絡', label: '仕入れ不能の注文', explanation: '売れた商品の仕入れ元が終了しています。購入者へ連絡してください。' });
  D.syncTasks = function () {
    function link(record, category, done, resolve) {
      if (D.items.some(function (r) { return r.id === record.id; })) return;
      var item = { id: record.id, category: category, product: record.product || D.orders.find(function (o) { return o.id === record.orderId; }).product };
      if (category === 'message') { item = record; item.category = category; }
      Object.defineProperty(item, 'done', { configurable: true, enumerable: true, get: done, set: resolve }); D.items.push(item);
    }
    D.conversations.filter(function (r) { return !r.replied || r.unread; }).forEach(function (r) { link(r, 'message', function () { return r.replied && !r.unread; }, function (v) { r.replied = v; r.unread = !v; }); });
    D.listings.forEach(function (r) {
      if (!['要修正', '仕入れ元終了'].includes(r.state) || D.items.some(function (i) { return i.id === r.taskId || i.listingId === r.id; })) return;
      var item = { id: 'task-' + r.id, listingId: r.id, product: r.product, category: r.state === '要修正' ? 'fix' : 'ended', canFix: 'はい。停止理由を確認してください', effect: '検証が終わるまで出品できません', reason: r.cause };
      r.taskId = item.id;
      ['cause', 'next'].forEach(function (key) { Object.defineProperty(item, key, { enumerable: true, get: function () { return r[key]; }, set: function (v) { r[key] = v; } }); });
      var state = r.state; Object.defineProperty(item, 'done', { enumerable: true, get: function () { return r.state !== state; }, set: function (v) { r.state = v ? 'AI処理済' : state; } }); D.items.push(item);
    });
    D.orders.forEach(function (r) {
      if (r.state === '発送待ち') link(r, 'shipment', function () { return r.state !== '発送待ち'; }, function (v) { r.state = v ? '発送済み' : '発送待ち'; });
      if (r.sourceEnded) link(r, 'source', function () { return r.state !== '仕入れ待ち' || r.contacted; }, function (v) { r.contacted = v; });
    });
    D.returnCases.forEach(function (r) { link(r, 'case', function () { return r.step >= 4 || r.closed; }, function (v) { r.closed = v; }); });
  };
  D.priority = function (item) {
    var order = D.orders.find(function (o) { return o.id === item.id; });
    if (item.category === 'shipment' && order.due < '2026-10-20') return 0;
    if (item.category === 'case' && !D.returnCases.find(function (r) { return r.id === item.id; }).replied) return 1;
    if (item.category === 'source' || item.category === 'offer' && A.takeHome(item.gross, item.shipping, item.cost).yen < 0) return 2;
    if (item.category === 'message') return 3;
    if (item.category === 'fix') return 4;
    return 5;
  };
  D.active = function () { D.syncTasks(); return D.items.filter(function (r) { return !r.done; }).sort(function (a, b) { return D.priority(a) - D.priority(b) || String((D.orders.find(function (o) { return o.id === a.id; }) || {}).due || '').localeCompare(String((D.orders.find(function (o) { return o.id === b.id; }) || {}).due || '')); }); };
  D.badges = function () { var c = D.counts(); return { today: c.total, listings: c.fix, messages: c.message, orders: c.shipment + c.source, returns: c.case }; };
  D.syncTasks();
  D.ads.forEach(function (ad) { ad.listing = D.listings.find(function (r) { return r.product === ad.product && r.state === '出品中'; }); ad.on = !!ad.listing; });
  // Only prepare() issues a one-use confirmation ticket. The exact previewed values are frozen.
  var tickets = new WeakSet(), pendingOffers = new Map();
  D.prepareAftersale = function (kind, id, value) {
    var row, impact, text;
    if (['message', 'case-message', 'watcher-offer', 'counter', 'accept'].includes(kind) && !D.connection.connected) { D.lastError = '送信できません：eBay連携が切断中です'; return null; }
    if (kind === 'ship') {
      row = D.orders.find(function (r) { return r.id === id; });
      var valid = A.tracking(value);
      if (!row || row.state !== '発送待ち' || !valid.valid) return null;
      value = valid.value;
      text = '追跡番号をeBayに登録します・購入者に発送通知が届きます・取り消せません（試作内では元に戻せます）';
    } else if (kind === 'message' || kind === 'case-message') {
      row = (kind === 'message' ? D.conversations : D.returnCases).find(function (r) { return r.id === id; });
      value = String(value || '').trim();
      if (!row || !value || value.length > 2000) return null;
      text = '宛先：' + row.buyerName + '。以下の文面を送信します。送信後は取り消せません。';
    } else if (kind === 'refund') {
      row = D.returnCases.find(function (r) { return r.id === id; });
      if (!row || row.refunded) return null;
      var order = D.orders.find(function (o) { return o.id === row.orderId; });
      impact = A.refundImpact(order, row.amount);
      if (!impact) return null;
      value = row.amount;
      text = '返金は取り消せない操作です。対象1件（例）。手数料・送料・仕入れ値が残る前提の例です。';
    } else if (kind === 'watcher-offer') {
      row = D.watchers.find(function (r) { return r.id === id; });
      impact = row && A.offer(row, Number(value));
      if (D.sentOffers.some(function (o) { return o.product === row.product && o.outcome === '返答待ち'; })) return null;
      var offerRules = window.IdealChecks.evaluate(Object.assign({}, row.listing, { gross: impact && impact.gross }), D.settings);
      if (Number(value) > D.settings.discountLimit || offerRules.avoided || offerRules.discountExceeded) { D.lastError = '判断軸の割引上限または避ける商品に該当するため送れません'; return null; }
      if (!impact || !impact.takeHome || impact.takeHome.yen < 0 || !row.watchers || !row.listing || row.listing.state !== '出品中') return null;
      value = impact.gross;
      text = 'ウォッチ' + row.watchers + '人にオファーを送ります・送信後は取り消せません（例）';
    } else if (['accept', 'decline', 'counter'].includes(kind)) {
      row = D.incomingOffer;
      if (row.id !== id || row.done) return null;
      value = kind === 'counter' ? Number(value) : row.gross;
      var range = D.counterRange(), listed = range.max;
      if (kind === 'counter' && (value <= 0 || value > listed || value < range.min)) { D.lastError = '再提案価格は出品価格の50〜100%で入力してください（上級でも出品価格以下）'; return null; }
      impact = A.takeHome(value, row.shipping, row.cost);
      if (kind !== 'decline' && (!impact || impact.yen < 0)) return null;
      text = ({ accept: 'この価格で受けます', decline: 'この提案を断ります', counter: 'この価格で条件を出します' })[kind] + '。対象1件・送信後は取り消せません。';
    } else return null;
    if (kind === 'watcher-offer' && pendingOffers.has(row.product)) return null;
    var ticket = Object.freeze({ kind: kind, id: id, audience: kind === 'watcher-offer' ? row.product : null, value: value, text: text, impact: impact, row: row });
    tickets.add(ticket);
    if (kind === 'watcher-offer') pendingOffers.set(row.product, ticket);
    return ticket;
  };
  D.executeAftersale = function (ticket) {
    if (!ticket || !tickets.has(ticket)) return null;
    tickets.delete(ticket); pendingOffers.delete(ticket.audience);
    var row = ticket.row, kind = ticket.kind, value = ticket.value;
    // Revalidate changing balances and states before applying a confirmed action.
    var check = D.prepareAftersale(kind, ticket.id, kind === 'watcher-offer' ? row.discount : value);
    if (!check || check.value !== value || check.text !== ticket.text || JSON.stringify(check.impact) !== JSON.stringify(ticket.impact)) return null;
    tickets.delete(check); pendingOffers.delete(ticket.audience);
    var fields = kind === 'ship' ? ['state', 'tracking'] : kind === 'message' ? ['sent', 'unread', 'replied'] : kind === 'case-message' ? ['sent', 'unread', 'replied', 'step'] : kind === 'refund' ? ['refunded', 'step'] : ['outcome'];
    var snapshot = {}; fields.forEach(function (key) { snapshot[key] = Array.isArray(row[key]) ? row[key].slice() : row[key]; });
    var order, refundBefore, log;
    if (kind === 'ship') { row.tracking = value; row.state = '発送済み'; }
    else if (kind === 'message' || kind === 'case-message') { row.sent.push(value); row.unread = false; row.replied = true; if (kind === 'case-message') row.step = Math.max(row.step, 3); }
    else if (kind === 'refund') {
      order = D.orders.find(function (o) { return o.id === row.orderId; }); refundBefore = order.refund;
      order.refund += value; row.refunded = true; row.step = 4;
    } else if (kind === 'watcher-offer') {
      log = { id: 'sent-' + (D.sentOffers.length + 1), product: row.product, gross: value, count: row.watchers, outcome: '返答待ち', date: '2026-10-20' };
      D.sentOffers.push(log);
    } else row.outcome = { accept: '承諾', decline: '辞退', counter: '条件を送信' }[kind];
    var undone = false, after = JSON.stringify(fields.map(function (k) { return row[k]; }));
    return function () {
      if (undone) return false;
      if (after !== JSON.stringify(fields.map(function (k) { return row[k]; })) || (order && order.refund !== refundBefore + value)) { D.lastError = '後の操作があるため元に戻せません'; return false; }
      undone = true;
      Object.keys(snapshot).forEach(function (key) { if (snapshot[key] !== undefined) row[key] = snapshot[key]; else delete row[key]; });
      if (order) order.refund = refundBefore;
      if (log) D.sentOffers.splice(D.sentOffers.indexOf(log), 1);
      return true;
    };
  };
  D.cancelAftersale = function (ticket) { if (ticket) { tickets.delete(ticket); pendingOffers.delete(ticket.audience); } };
})();
