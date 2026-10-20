(function () {
  window.IdealStub = { render: function (route) { return '<section class="card"><h2>' + window.IdealCore.escape(window.IdealData.title(route)) + '</h2><p>この画面は次の段階で作ります</p></section>' + window.IdealMarks.card(route); } };
  window.IdealData.groups.forEach(function (group) {
    group[1].forEach(function (entry) {
      window.IdealScreens[entry[0]] = { render: function () { return window.IdealStub.render(entry[0]); } };
    });
  });
  window.IdealScreens.today = window.IdealToday;
})();
