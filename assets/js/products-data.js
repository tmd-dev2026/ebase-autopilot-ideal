/* Single source of truth for the 6 demo products. Used by BOTH sites:
   - ebase-market-demo (架空フリマ「eBaseマーケット(デモ)」)
   - ebay-autopilot-demo (体験版)
   Keep the two copies identical. All brand names are fictional "twists" of real ones. All prices are examples. */
(function () {
  var products = [
    {
      id: 'holo-card', slug: 'holo-card', category: 'trading-card', template: 'トレカ',
      name: 'ポケミンカード ホロ加工 レアカード 1枚 美品 スリーブ付き',
      brand: 'ポケミン(架空ブランド)', model: 'ホロレア',
      cost: 14000, sale: 150, weightKg: 0.36, sizeCm: '9 × 6.5 × 0.1(カード本体)', listable: true,
      condition: '美品', conditionNote: '縁にごくわずかな使用感あり。傷・折れ・反りなし',
      seller: { name: 'seller_demo_01', rating: '評価 482(例)', area: '東京都' }, posted: '2026-10-12',
      shipFrom: '東京都', shipMethod: '梱包して発送(追跡あり)',
      images: [
        { file: 'holo-card-1.jpg', caption: '全体(表面)' },
        { file: 'holo-card-2.jpg', caption: '裏面' },
        { file: 'holo-card-3.jpg', caption: '縁と角のアップ' },
        { file: 'holo-card-4.jpg', caption: 'スリーブと保護ケース' }
      ],
      description: [
        'ホロ加工のレアカードです。購入後すぐスリーブに入れて保管していました。',
        '表面のホロはきれいで、目立つ傷や白欠けはありません。縁にごくわずかな使用感があります。',
        '折れ・反り・水濡れ・においはありません。',
        '付属品: ソフトスリーブ、トップローダー(硬質ケース)。',
        '折れ防止のため、厚紙で挟んで梱包して発送します。',
        '※ 写真は実物とは別のデモ用の画像です。'
      ],
      specs: [['ブランド', 'ポケミン(架空)'], ['種類', 'トレーディングカード(シングル)'], ['レアリティ', 'ホロレア'], ['状態', '美品'], ['言語', '日本語'], ['付属品', 'スリーブ・トップローダー'], ['サイズ', '約 9 × 6.5 cm'], ['重さ', '約 5 g(梱包後 約 0.36 kg の設定)']],
      ai: {
        titleEn: 'Pokemin Card Japanese Rare Holo Single Near Mint with Sleeve and Case Japan',
        category: 'Collectibles > Collectible Card Games > CCG Individual Cards',
        conditionEn: 'Near Mint',
        descriptionEn: [
          'Japanese rare holo trading card in near mint condition.',
          'The holo surface is clean with no visible scratches, whitening or creases. Very light edge wear only.',
          'Stored in a soft sleeve and a rigid top loader since purchase.',
          'Ships from Japan with tracking, packed between cardboard to prevent bending.'
        ],
        specifics: [['Brand', 'Pokemin'], ['Type', 'Trading Card'], ['Rarity', 'Holo Rare'], ['Language', 'Japanese'], ['Condition', 'Near Mint'], ['Country of Origin', 'Japan']],
        warnings: [{ level: '注意', text: 'コンディションの表記(Near Mint)と説明文の「ごくわずかな使用感」に、食い違いがないか確認してください。' }]
      }
    },
    {
      id: 'film-camera', slug: 'film-camera', category: 'camera', template: 'カメラ',
      name: 'ニコラ F3 35mm フィルム一眼レフ ボディ ブラック 動作品',
      brand: 'ニコラ(架空ブランド)', model: 'F3',
      cost: 24000, sale: 249, weightKg: 1.25, sizeCm: '15 × 10 × 8', listable: true,
      condition: '動作品(外観に使用感あり)', conditionNote: 'シャッター・巻き上げ・露出計の動作を確認済み。モルト(遮光材)は交換済み',
      seller: { name: 'seller_demo_02', rating: '評価 1,205(例)', area: '大阪府' }, posted: '2026-10-10',
      shipFrom: '大阪府', shipMethod: '梱包して発送(追跡・補償あり)',
      images: [
        { file: 'film-camera-1.jpg', caption: '全体(前面)' },
        { file: 'film-camera-2.jpg', caption: '背面とフィルム室' },
        { file: 'film-camera-3.jpg', caption: '上面(ダイヤルとファインダー)' },
        { file: 'film-camera-4.jpg', caption: '付属品(ストラップ・ボディキャップ)' }
      ],
      description: [
        '定番の35mmフィルム一眼レフ(ボディ)です。ブラック。',
        'シャッター全速、巻き上げ、露出計、セルフタイマーの動作を確認済みです。',
        'ファインダーにカビ・くもりはありません。ミラーとプリズムはきれいです。',
        '外観に細かな擦れ・塗装はがれがあります(写真をご確認ください)。',
        '遮光用のモルトは新品に交換済みです。電池は付属しません。',
        '付属品: ストラップ、ボディキャップ。レンズは付属しません。',
        '※ 写真は実物とは別のデモ用の画像です。'
      ],
      specs: [['ブランド', 'ニコラ(架空)'], ['型番', 'F3'], ['種類', '35mm フィルム一眼レフ(ボディのみ)'], ['状態', '動作品・外観に使用感'], ['マウント', 'Fマウント相当(架空)'], ['シャッター速度', '1/2000 〜 8秒'], ['付属品', 'ストラップ・ボディキャップ'], ['重さ', '約 0.72 kg(梱包後 約 1.25 kg の設定)']],
      ai: {
        titleEn: 'Nikora F3 35mm Film SLR Camera Body Black Working Light Seals Replaced Japan',
        category: 'Cameras & Photo > Film Photography > Film Cameras',
        conditionEn: 'Used - Good (tested and working)',
        descriptionEn: [
          'Classic 35mm film SLR camera body in black.',
          'Shutter at all speeds, film advance, light meter and self-timer tested and working.',
          'Viewfinder is clear with no fungus or haze. Light seals have been replaced.',
          'Some wear and paint loss on the body, please see the photos. Battery not included.',
          'Includes strap and body cap. No lens included.'
        ],
        specifics: [['Brand', 'Nikora'], ['Model', 'F3'], ['Type', '35mm SLR'], ['Format', '35mm'], ['Condition', 'Used - Good'], ['Country of Origin', 'Japan']],
        warnings: []
      }
    },
    {
      id: 'shoulder-bag', slug: 'shoulder-bag', category: 'bag', template: 'デフォルト',
      name: 'レザー ショルダーバッグ 黒 ノーブランド 金具つき 斜めがけ',
      brand: 'ノーブランド', model: 'なし',
      cost: 5800, sale: 89, weightKg: 0.9, sizeCm: '26 × 18 × 9', listable: true,
      condition: '中古・使用感あり', conditionNote: '角に擦れ、ストラップに小さなひび割れあり。内側はきれい',
      seller: { name: 'seller_demo_03', rating: '評価 96(例)', area: '神奈川県' }, posted: '2026-10-09',
      shipFrom: '神奈川県', shipMethod: '梱包して発送(追跡あり)',
      images: [
        { file: 'shoulder-bag-1.jpg', caption: '全体(前面)' },
        { file: 'shoulder-bag-2.jpg', caption: '背面' },
        { file: 'shoulder-bag-3.jpg', caption: '金具のアップ' },
        { file: 'shoulder-bag-4.jpg', caption: '内側とストラップ' }
      ],
      description: [
        '黒のレザー調ショルダーバッグです。ブランドの表示はないノーブランド品です。',
        '使用感があります。角に擦れ、ストラップに小さなひび割れがあります。内側はきれいです。',
        'フラップ式で、内側にファスナーつきのポケットが 1 つあります。',
        'ストラップは取り外せません。長さの調節ができます。',
        '※ 写真は実物とは別のデモ用の画像です。'
      ],
      specs: [['ブランド', 'ノーブランド'], ['種類', 'ショルダーバッグ'], ['素材', 'レザー調'], ['色', '黒'], ['状態', '中古・使用感あり'], ['サイズ', '約 26 × 18 × 9 cm'], ['重さ', '約 0.6 kg(梱包後 約 0.9 kg の設定)']],
      ai: {
        titleEn: 'Black Faux Leather Shoulder Bag Crossbody Unbranded with Metal Hardware Japan',
        category: 'Clothing, Shoes & Accessories > Women > Women\'s Bags & Handbags',
        conditionEn: 'Pre-owned',
        descriptionEn: ['Black faux leather flap shoulder bag, unbranded, with metal hardware.', 'Signs of use: corner scuffs and small cracks on the strap. The inside is clean.', 'One inner zip pocket. Adjustable, non-detachable strap.'],
        specifics: [['Brand', 'Unbranded'], ['Type', 'Shoulder Bag'], ['Color', 'Black'], ['Material', 'Faux Leather'], ['Condition', 'Pre-owned']],
        warnings: []
      }
    },
    {
      id: 'wrist-watch', slug: 'wrist-watch', category: 'watch', template: 'デフォルト',
      name: 'セイカ SEIKA 5 自動巻き 腕時計 メンズ シルバー文字盤 デイデイト',
      brand: 'セイカ(架空ブランド)', model: 'SEIKA 5',
      cost: 9800, sale: 159, weightKg: 0.35, sizeCm: '20 × 12 × 8(梱包後)', listable: true,
      condition: 'やや傷や汚れあり', conditionNote: '稼働良好。ガラスに細かい擦り傷。ベルトに使用感',
      seller: { name: 'seller_demo_04', rating: '評価 733(例)', area: '愛知県' }, posted: '2026-10-11',
      shipFrom: '愛知県', shipMethod: '梱包して発送(追跡あり)',
      images: [
        { file: 'wrist-watch-1.jpg', caption: '文字盤(全体)' },
        { file: 'wrist-watch-2.jpg', caption: '裏蓋' },
        { file: 'wrist-watch-3.jpg', caption: '側面とリューズ' },
        { file: 'wrist-watch-4.jpg', caption: 'ベルトとバックル' }
      ],
      description: [
        '自動巻きのメンズ腕時計です。シルバー文字盤、日付と曜日表示つき。',
        '稼働は良好で、巻き上げると問題なく動きます。精度は日差 +10 秒前後(個体差あり)。',
        'ガラスに細かい擦り傷、ケースとベルトに使用感があります。',
        '付属品: 本体のみ(箱・説明書なし)。ベルトは社外品に交換されています。',
        'ケース径 約 37mm、ラグ幅 18mm。',
        '※ 写真は実物とは別のデモ用の画像です。'
      ],
      specs: [['ブランド', 'セイカ(架空)'], ['型番', 'SEIKA 5'], ['ムーブメント', '自動巻き'], ['ケース径', '約 37 mm'], ['文字盤', 'シルバー'], ['表示', '日付・曜日'], ['状態', 'やや傷や汚れあり'], ['付属品', '本体のみ'], ['重さ', '約 0.09 kg(梱包後 約 0.35 kg の設定)']],
      ai: {
        titleEn: 'Seika 5 Automatic Men\'s Watch Silver Dial Day-Date 37mm Working Vintage Japan',
        category: 'Jewelry & Watches > Watches, Parts & Accessories > Wristwatches',
        conditionEn: 'Pre-owned (working, signs of wear)',
        descriptionEn: [
          'Automatic men\'s wristwatch with silver dial and day-date display.',
          'Running well. Fine scratches on the crystal, wear on the case and strap.',
          'Case diameter about 37mm, lug width 18mm. Aftermarket strap.',
          'Watch only, no box or papers.'
        ],
        specifics: [['Brand', 'Seika'], ['Model', 'Seika 5'], ['Movement', 'Automatic'], ['Case Size', '37 mm'], ['Dial Color', 'Silver'], ['Condition', 'Pre-owned']],
        warnings: []
      }
    },
    {
      id: 'fd-lens', slug: 'fd-lens', category: 'lens', template: 'カメラ',
      name: 'キヤノス FD 50mm F1.4 単焦点 マニュアルフォーカス レンズ 美品',
      brand: 'キヤノス(架空ブランド)', model: 'FD 50mm F1.4',
      cost: 12500, sale: 179, weightKg: 0.45, sizeCm: '12 × 10 × 10(梱包後)', listable: true,
      condition: '美品', conditionNote: 'カビ・くもり・バルサム切れなし。絞りの動作良好',
      seller: { name: 'seller_demo_05', rating: '評価 2,310(例)', area: '福岡県' }, posted: '2026-10-13',
      shipFrom: '福岡県', shipMethod: '梱包して発送(追跡・補償あり)',
      images: [
        { file: 'fd-lens-1.jpg', caption: '全体(側面)' },
        { file: 'fd-lens-2.jpg', caption: '前玉' },
        { file: 'fd-lens-3.jpg', caption: '後玉とマウント部' },
        { file: 'fd-lens-4.jpg', caption: 'キャップ類' }
      ],
      description: [
        '明るい標準レンズ(50mm F1.4)です。マニュアルフォーカス。',
        '光にかざして確認しましたが、カビ・くもり・バルサム切れはありません。',
        '絞りリングとピントリングは滑らかに動きます。絞り羽根に油じみはありません。',
        '前玉に極小のクリーニングマークが 1 点あります(写りに影響なし)。',
        '付属品: 前後キャップ。フードは付属しません。',
        '※ 写真は実物とは別のデモ用の画像です。'
      ],
      specs: [['ブランド', 'キヤノス(架空)'], ['型番', 'FD 50mm F1.4'], ['種類', '単焦点・標準'], ['フォーカス', 'マニュアル'], ['フィルター径', '52 mm'], ['状態', '美品'], ['付属品', '前後キャップ'], ['重さ', '約 0.23 kg(梱包後 約 0.45 kg の設定)']],
      ai: {
        titleEn: 'Kyanos FD 50mm f/1.4 Manual Focus Prime Lens Excellent Clear Optics Japan',
        category: 'Cameras & Photo > Lenses & Filters > Camera Lenses',
        conditionEn: 'Used - Excellent',
        descriptionEn: [
          'Fast 50mm f/1.4 standard prime lens, manual focus.',
          'Optics are clear with no fungus, haze or balsam separation. Aperture and focus rings move smoothly.',
          'One tiny cleaning mark on the front element that does not affect image quality.',
          'Includes front and rear caps. Hood not included.'
        ],
        specifics: [['Brand', 'Kyanos'], ['Focal Length', '50 mm'], ['Maximum Aperture', 'f/1.4'], ['Focus Type', 'Manual'], ['Condition', 'Used - Excellent'], ['Country of Origin', 'Japan']],
        warnings: []
      }
    },
    {
      id: 'figure-large', slug: 'figure-large', category: 'figure', template: 'デフォルト',
      name: 'アニメ 戦士 大型スタチュー フィギュア 約45cm 箱付き 台座あり',
      brand: 'ばんだ(架空ブランド)', model: 'スタチュー45',
      cost: 7500, sale: 90, weightKg: 4.1, sizeCm: '55 × 35 × 30(梱包後)', listable: true,
      condition: '箱付き・開封済み', conditionNote: '塗装に問題なし。箱に角つぶれあり',
      seller: { name: 'seller_demo_06', rating: '評価 311(例)', area: '北海道' }, posted: '2026-10-08',
      shipFrom: '北海道', shipMethod: '梱包して発送(追跡あり)',
      images: [
        { file: 'figure-large-1.jpg', caption: '全体(正面)' },
        { file: 'figure-large-2.jpg', caption: '背面' },
        { file: 'figure-large-3.jpg', caption: '顔のアップ' },
        { file: 'figure-large-4.jpg', caption: '箱(外箱)' }
      ],
      description: [
        'アニメの戦士をモチーフにした大型スタチュー(約45cm、架空のキャラクターです)。',
        '開封済み・展示のみ。塗装のはがれ、ぐらつきはありません。',
        '外箱は角つぶれと擦れがあります。内側の緩衝材は全て揃っています。',
        '台座つき。重量があるため、梱包は大きな箱になります(梱包後 約 4 kg)。',
        '※ 写真は実物とは別のデモ用の画像です。'
      ],
      specs: [['ブランド', 'ばんだ(架空)'], ['種類', 'スタチュー(大型フィギュア)'], ['高さ', '約 45 cm'], ['状態', '開封済み・展示のみ'], ['付属品', '外箱・台座・緩衝材'], ['重さ', '約 2.3 kg(梱包後 約 4.1 kg の設定)']],
      ai: {
        titleEn: 'Anime Warrior Large Statue Figure 45cm with Box and Base Japan Display Only',
        category: 'Collectibles > Animation Art & Characters > Anime',
        conditionEn: 'Used - Like New (opened, display only)',
        descriptionEn: [
          'Large anime warrior statue figure, about 45cm tall.',
          'Opened and displayed only. No paint wear, stable on the base.',
          'Outer box has corner dents and scuffs. All inner packing is included.',
          'Heavy item, will be shipped in a large box (about 4 kg).'
        ],
        specifics: [['Brand', 'Banda'], ['Type', 'Statue'], ['Height', '45 cm'], ['Condition', 'Used - Like New'], ['Country of Origin', 'Japan']],
        warnings: []
      }
    }
  ];
  var api = { products: products, source: { name: 'eBaseマーケット(デモ)', short: 'eBaseマーケット' }, imageDir: 'assets/img/' };
  if (typeof window !== 'undefined') window.DemoProducts = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
