(function () {
  'use strict';
  var e = window.IdealCore.escape;
  var legend = { '現行': '今の本物にもある機能です。', '改': '本物の機能の形や置き場所を変えます。', '新': '新しく提案する構想です。', '将来': '外部連携や新しい API が必要です。この試作では動かしません。' };
  var mapping = {
    today: ['改', 'ダッシュボード「AI 優先対応」の発送待ち・取り下げに、現在は出ない未返信メッセージ・受信オファー・新規注文を加えて、ここに集約します。負担を減らし、次の行動を明確にします。上級では一覧で作業効率を保ちます。'],
    sourcing: ['改', '仕入れ情報と利益計算をつなぎ、判断と取り込みをまとめます。'], candidates: ['改', '商品管理の候補を仕入れの流れに置きます。'], import: ['改', '仕入れ情報の取り込みを作業順に置きます。'], create: ['改', 'AI処理と商品編集を、出品前チェックまでの流れにまとめます。'], listings: ['改', '出品管理に原因と次の一手を添えます。'], orders: ['改', '注文管理と発送処理の追跡入力をまとめます。'], messages: ['改', 'メッセージ受信箱から確認して返信できる流れにします。'], returns: ['新', '返品とクレームへの対応手順を売れたあとに置きます。'], offers: ['改', 'ウォッチャー分析とオファーをつなぎます。'], ads: ['現行', '広告管理を改善のグループに置きます。'], reports: ['改', '利益計算と収益の見込み・確定を区別します。'], criteria: ['改', '判断ページとAI処理の判断欄をまとめます。'], automation: ['新', '在庫監視・自動取り下げ・注文同期の状況と止め方を見える形にします。'], setup: ['改', '初回ガイドにeBay連携・ポリシー・販売実績・製品安全を集約します。']
  };
  var components = { cards: ['改', '要対応カード'], inline: ['新', 'その場で完結'], automation: ['新', '自動処理の状況'], numbers: ['改', '見込み/確定の区別'], inbox: ['改', '未返信メッセージ・オファーを今日に出す'] };
  function chip(mark, label) { return '<span class="mark" title="' + e(mark + '：' + (label || legend[mark])) + '"><span aria-hidden="true">' + ({ '現行': '●', '改': '◆', '新': '✦', '将来': '◇' })[mark] + '</span> ' + e(mark) + '</span>'; }
  window.IdealMarks = {
    chip: chip, component: function (key) { var c = components[key]; return chip(c[0], c[1]); },
    card: function (route) { var m = mapping[route]; return '<section class="card correspondence"><h2>本物との対応 ' + chip(m[0]) + '</h2><p>' + e(m[1]) + '</p></section>'; },
    legend: function () { return '<h2>試作の印</h2>' + Object.keys(legend).map(function (key) { return '<p><strong>' + key + '</strong> — ' + e(legend[key]) + '</p>'; }).join(''); }
  };
})();
