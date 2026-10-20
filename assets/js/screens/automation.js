(function () {
  'use strict';
  var C = window.IdealCore, D = window.IdealData, M = window.IdealMarks, e = C.escape;
  function render() {
    return C.pageHeader('自動処理') + '<p class="muted">このブラウザに保存(試作) · ' + e(D.storageError || '') + '</p><button data-action="reset-preferences">初期状態に戻す</button>' + '<section class="card"><h2>自動処理の ON/OFF ' + M.component('automationSwitch') + '</h2><p class="muted">テナントごとの ON/OFF の保存は新しい設定が必要＝運営側の作業が要る</p>' +
      (C.mode === 'はじめて' ? '<p>いまやること：何を見て動くかを確認し、必要なら停止できます。</p>' : '') +
      '</section><div class="automation-grid ' + (C.mode === '上級' ? 'after-dense' : '') + '">' + D.automations.map(function (a) {
        var dependency = a.id === 'withdraw' && !D.automations.find(function (r) { return r.id === 'stock'; }).on;
        var paused = dependency || !D.connection.connected && ['stock', 'sync'].includes(a.id);
        return '<section class="card"><div class="automation-heading"><h2>' + (a.id === 'stock' ? window.IdealHelp.term('在庫監視') : e(a.name)) + '</h2><button class="switch" role="switch" aria-checked="' + a.on + '" aria-label="' + e(a.name) + '" data-action="automation" data-id="' + a.id + '"><span class="switch-track" aria-hidden="true"></span>' + (a.on ? 'ON' : 'OFF') + '</button></div>' +
          (dependency ? '<p class="notice">自動取り下げは在庫監視に依存します。在庫監視OFFのため新しい検知はありません。</p>' : '') + '<p>最終実行 ' + a.minutes + '分前（例） · 次の実行まで：' + (paused ? (dependency ? '在庫監視OFFのため停止（例）' : '連携切断のため停止（例）') : a.on ? a.next + '分（例）' : '停止中') + '</p><dl><dt>直近の結果</dt><dd>' + e(a.result) + '（例）</dd>' +
          '<dt>根拠（何を見て動くか）</dt><dd>' + e(a.basis) + '</dd><dt>止めたときの影響</dt><dd>' + e(D.automationImpact(a)) + '</dd></dl><details><summary>履歴・結果の表示 ' + M.component('automationHistory') + '</summary><ul>' +
          a.history.slice(0, 5).map(function (run) { return '<li data-run>' + e(run.time + ' · ' + run.result + (run.who ? ' · ' + run.who + ' · 理由：' + run.reason : ' · 試作の例')) + '</li>'; }).join('') + '</ul></details></section>';
      }).join('') + '</div>' + M.card('automation');
  }
  window.IdealScreens.automation = { render: render };
})();
