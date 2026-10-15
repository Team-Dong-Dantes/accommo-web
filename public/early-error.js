// Paints a startup failure on screen instead of leaving a white page. Classic
// script so it runs even when the module bundle fails to load or parse (older
// Safari). Silent unless the app has not mounted; ?debug is not needed.
(function () {
  var seen = [];
  function show(msg) {
    var app = document.getElementById('q-app');
    if (app && app.children.length) return;
    seen.push(msg);
    var box = document.getElementById('early-error');
    if (!box) {
      box = document.createElement('pre');
      box.id = 'early-error';
      box.style.cssText = 'position:fixed;inset:0;z-index:2147483647;margin:0;padding:16px;overflow:auto;background:#fff;color:#b00020;font:12px/1.4 monospace;white-space:pre-wrap;word-break:break-all';
      document.body.appendChild(box);
    }
    box.textContent = 'accommo failed to start\n\n' + seen.join('\n\n') + '\n\n' + navigator.userAgent;
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    show(t && t !== window && (t.src || t.href) ? 'Failed to load ' + (t.src || t.href) : (e.message || 'error') + ' ' + (e.filename || '') + ':' + (e.lineno || ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    show('Unhandled: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason));
  });
})();
