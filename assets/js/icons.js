(function () {
  'use strict';
  // Local line drawings; shared by the shell and navigation drawer.
  var paths = {
    wrench: 'M14 3a6 6 0 0 0-7 7L2 15a3 3 0 0 0 4 4l5-5a6 6 0 0 0 7-7l-4 4-3-3Z',
    mail: 'M3 5h18v14H3Z m0 0 9 7 9-7',
    'archive-x': 'M3 3h18v4H3Z M5 7v14h14V7 M9 11l6 6 M15 11l-6 6',
    sparkles: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z M4 2v4 M2 4h4 M20 18v4 M18 20h4',
    today: 'M3 3h7v7H3Z M14 3h7v4h-7Z M14 11h7v10h-7Z M3 14h7v7H3Z',
    sourcing: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    candidates: 'm3 6 8-4 8 4-8 4Z M3 6v10l7 4 M11 10v4 M21 21l-3-3 M19 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    import: 'M12 3v12 m-5-5 5 5 5-5 M3 16v5h18v-5',
    create: 'm4 15-1 6 6-1L21 8l-5-5Z M14 5l5 5 M13 21h8',
    listings: 'm3 6 9-4 9 4-9 4Z M3 6v12l9 4 9-4V6 M12 10v12 M7 4l10 4',
    orders: 'M2 4h12v13H2Z M14 9h4l4 5v3h-8 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    messages: 'M3 3h18v14H8l-5 4Z',
    returns: 'M3 4v6h6 M3 10a9 9 0 1 1 1 9',
    offers: 'm2 7 4-3 5 2 3-2 8 4-3 10-5 3-8-5Z M11 6l-4 5 3 2 5-4 5 5 M10 16l5 4',
    ads: 'M3 9h5l13-6v18L8 15H3Z M8 15l2 6H6l-2-6 M8 9v6',
    reports: 'M3 3v18h18 M7 17v-5 M12 17V7 M17 17V4',
    criteria: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M12 12l9-9',
    automation: 'M8 2v4 M16 2v4 M3 10h12 M12 21H3V4h18v7 M22 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M17 14v3l2 1',
    setup: 'm9 3-1 3-3 1-2 4 2 2-1 4 4 1 2 3 4-1 1-3 4-1 1-4-3-2V6l-4-1Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    bell: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z M10 21h4',
    theme: 'M21 12a9 9 0 1 1-9-9v18 M12 3a9 9 0 0 1 9 9',
    help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 9a3 3 0 1 1 5 2l-2 2 M12 16v1'
  };
  window.IdealIcons = function (name) {
    return '<svg class="line-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + paths[name] + '"/></svg>';
  };
})();
