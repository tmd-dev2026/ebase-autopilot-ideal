(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, M = window.IdealMarks, e = C.escape;
  var effects = ['出品・在庫監視・注文同期', '下書きの配送・返品・支払い条件', '販売者情報の確認', '商品の安全情報の確認', '最初の出品内容の確認'];
  var opened = null;
  function render() {
    var first = D.steps.findIndex(function (s) { return !s[1]; });
    return C.pageHeader('eBay連携と初期設定') + D.connectionWarning() + '<section class="card"><h2>診断と影響の先出し ' + M.component('setupDiagnostics') + '</h2><p>接続・手順・診断はすべて例です。実際の eBay の動作を示すものではありません。</p>' +
      '<label class="demo-switch"><input type="checkbox" role="switch" aria-checked="' + (!D.connection.connected) + '" id="disconnect-demo"' + (!D.connection.connected ? ' checked' : '') + '>試作用の切替：連携が切れた場合の表示を見る</label>' +
      (!D.connection.connected ? '<div><h3>再連携の手順（例）</h3><ol><li>eBay の接続先を確認</li><li>認証内容を確認</li><li>下の次の一手から接続例を復旧</li></ol></div>' : '') +
      D.steps.map(function (step, index) {
        return '<article class="setup-row ' + (index === first ? 'next-step' : '') + '"><h3>' + e(step[0]) + (index === first ? ' · いまやること' : '') + '</h3><p>' + (step[1] ? '✓ 完了' : '○ 未完了') + '（例）' + (index === 0 ? ' · 接続状態：' + (D.connection.connected ? '接続中' : '切断') + ' · 有効期限：' + e(D.connection.expires) : '') + '</p><p class="muted">影響：' + e(effects[index]) + '</p>' +
          (index === 1 ? '<p><span class="chip">配送：' + e(D.settings.shipping || '—') + '</span> <span class="chip">返品：' + e(D.settings.returns || '—') + '</span> <span class="chip">支払い：' + e(D.settings.payment || '—') + '</span></p>' : '') +
          (step[1] ? '' : '<button data-setup="' + index + '">次の一手：' + e(step[2]) + '</button>') +
          (opened === index ? '<div><p>例の内容を確認し、初期設定の進捗に反映します。実際の登録は行いません。</p>' + (index === 1 ? '<a href="#/criteria/shipping">ポリシーの既定を確認する</a>' : '') + '<button data-complete-step="' + index + '">確認済みにする（試作）</button></div>' : '') + '</article>';
      }).join('') + '<article class="setup-row"><h3>為替</h3><p>✓ 例の固定値：¥155 / $1（例） · 手残りの円換算に使用</p></article></section>' + M.card('setup');
  }
  function bind(main) {
    main.onchange = function (event) {
      if (event.target.id === 'disconnect-demo') { D.setConnection(!event.target.checked); window.IdealShell.render(); }
    };
    main.onclick = function (event) {
      var b = event.target.closest('button'); if (!b) return;
      if (b.dataset.setup !== undefined) opened = Number(b.dataset.setup);
      if (b.dataset.completeStep !== undefined) {
        var index = Number(b.dataset.completeStep), before = D.steps[index][1];
        D.completeStep(index); opened = null;
        window.IdealShell.toastUndo('初期設定の進捗を更新しました（例）', function () { D.steps[index][1] = before; if (index === 0) D.setConnection(before); });
      }
      if (b.hasAttribute('data-rate')) window.IdealShell.toast('換算は固定の例：¥155 / $1。実際の為替は取得しません。');
      window.IdealShell.render();
    };
  }
  window.IdealScreens.setup = { render: render, bind: bind };
})();
