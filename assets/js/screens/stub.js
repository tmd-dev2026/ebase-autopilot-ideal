(function () {
  window.IdealStub = { render: function (route) { return '<section class="card"><h2>' + window.IdealCore.escape(window.IdealData.title(route)) + '</h2><p>この画面は次の段階で作ります</p></section>' + window.IdealMarks.card(route); } };
})();
