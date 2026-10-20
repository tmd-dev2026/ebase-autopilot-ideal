(function () {
  'use strict';
  var D = window.IdealData;
  D.candidates = [];
  D.importJobs = [];
  D.research = D.products.map(function (p, index) {
    return { id: p.id, product: p.id, name: p.name, images: p.images, condition: p.condition,
      brand: p.brand, category: p.ai.category, ruleTags: index === 1 ? ['電池内蔵'] : [],
      cost: p.cost, gross: index === 2 ? 30 : p.sale + 80, domestic: 600, international: 2000, duty: 500,
      market: index % 2 ? 'ふるいち' : 'こもれび市場',
      url: (index % 2 ? 'ふるいち' : 'こもれび市場') + '.example/' + p.id,
      risks: [ ['真贋の確認'], ['電池内蔵'], ['製品安全'], ['本革'], ['真贋の確認'], ['製品安全'] ][index], sold: 4 + index, active: 8 + index };
  }).concat([
    { id: 'desk-light', name: '卓上ライト（写真未取得）', images: [], condition: '中古', brand: '木陰工房', category: '照明', cost: 9000, gross: 100, domestic: 600, international: 2000, duty: 500, risks: ['製品安全'], sold: 3, active: 6, market: 'こもれび市場', url: 'こもれび市場.example/desk-light' },
    { id: 'cloth-case', name: '布の小物入れ（写真未取得）', images: [], condition: '中古', brand: '木陰工房', category: '小物', cost: 2000, gross: 80, domestic: 500, international: 1200, duty: 300, risks: ['真贋の確認'], sold: 2, active: 5, market: 'ふるいち', url: 'ふるいち.example/cloth-case' }
  ]);
  D.drafts.concat(D.listings).forEach(function (r) { var p = D.products.find(function (p) { return p.id === r.product; }); r.ruleTags = r.product === 'film-camera' ? ['電池内蔵'] : []; if (p) r.brand = p.brand; });
})();
