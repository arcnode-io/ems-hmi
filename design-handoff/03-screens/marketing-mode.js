// marketing-mode.js — URL-driven theme/chrome locking for marketing-site captures.
//
// Contract:
//   ?theme=light  → render only the Solarpunk (light) column, centered
//   ?theme=dark   → render only the Sovereign (dark) column, centered
//   ?chrome=off   → hide page header, column labels, and meta lines (just the device frame)
//
// Implementation strategy: this script runs BEFORE Babel transpiles the App component,
// sets data attributes on <html>, and injects CSS rules that use :has() to hide the
// off-theme column and chrome elements. The App itself is unchanged — we just hide.
//
// Detection: the existing prototype HTML uses `.col-label.sov` for the dark/Sovereign
// column and `.col-label.solr` for the light/Solarpunk column. We key off those.

(function () {
  var params = new URLSearchParams(window.location.search);
  var theme  = params.get('theme');   // 'light' | 'dark' | null
  var chrome = params.get('chrome');  // 'off' | null

  if (!theme && !chrome) return; // normal review mode — do nothing

  var html = document.documentElement;
  if (theme === 'light' || theme === 'dark') html.setAttribute('data-marketing-theme', theme);
  if (chrome === 'off') html.setAttribute('data-marketing-chrome', 'off');

  var css = [
    /* hide the OFF-theme column (mobile bundles: .col, vertical-stack desktop bundles: .row) */
    'html[data-marketing-theme="light"] .stage .col:has(.col-label.sov)   { display: none !important; }',
    'html[data-marketing-theme="dark"]  .stage .col:has(.col-label.solr)  { display: none !important; }',
    'html[data-marketing-theme="light"] .stage .row:has(.row-label.sov)   { display: none !important; }',
    'html[data-marketing-theme="dark"]  .stage .row:has(.row-label.solr)  { display: none !important; }',

    /* hide chrome */
    'html[data-marketing-chrome="off"] .header,',
    'html[data-marketing-chrome="off"] .col-label,',
    'html[data-marketing-chrome="off"] .col-meta,',
    'html[data-marketing-chrome="off"] .row-label,',
    'html[data-marketing-chrome="off"] .row-meta { display: none !important; }',

    /* tighten stage when one column is hidden */
    'html[data-marketing-theme] .stage { gap: 0 !important; padding: 0 !important; min-height: 100vh; }',
    'html[data-marketing-theme] body   { background: ' +
      'linear-gradient(90deg, #050505 0%, #0a0a0a 100%) !important;' +
      ' }',
    'html[data-marketing-theme="light"] body { background: ' +
      'linear-gradient(90deg, #d8d0bf 0%, #c8bea8 100%) !important;' +
      ' }',
    'html[data-marketing-theme] .col { gap: 0 !important; }',
    'html[data-marketing-theme] .row { gap: 0 !important; }',
  ].join('\n');

  var style = document.createElement('style');
  style.id = '__marketing-mode';
  style.textContent = css;
  document.head.appendChild(style);
})();
