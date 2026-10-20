(function () {
  'use strict';
  window.IdealStub = {
    render: function (route) {
      var title = window.IdealData.title(route);
      return window.IdealCore.pageHeader(title) +
        '<section class="card"><h2>' + window.IdealCore.escape(title) + '</h2>' +
        '<p>この画面は次の段階で作ります</p></section>' + window.IdealMarks.card(route);
    }
  };
  window.IdealData.groups.forEach(function (group) {
    group[1].forEach(function (entry) {
      window.IdealScreens[entry[0]] = {
        render: function () { return window.IdealStub.render(entry[0]); }
      };
    });
  });
  window.IdealScreens.today = window.IdealToday;
})();
