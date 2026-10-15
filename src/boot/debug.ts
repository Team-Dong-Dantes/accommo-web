import { defineBoot } from '#q-app';

// On-screen console for devices with no dev tools (iPad Safari). Off unless the
// URL has ?debug (remembered for the tab; ?debug=0 turns it off). Logs
// console output, errors, fetch results and route changes. Remove once the
// iPad login redirect is diagnosed.
export default defineBoot(({ router }) => {
  try {
    const q = new URLSearchParams(location.search).get('debug');
    if (q === '0') sessionStorage.removeItem('debug');
    else if (q !== null) sessionStorage.setItem('debug', '1');
    if (sessionStorage.getItem('debug') !== '1') return;
  } catch {
    return;
  }

  const lines: string[] = [];
  const panel = document.createElement('pre');
  panel.style.cssText =
    'display:none;position:fixed;left:8px;right:8px;bottom:56px;max-height:55vh;overflow:auto;margin:0;padding:8px;z-index:2147483647;background:#111;color:#0f0;font:11px/1.35 monospace;white-space:pre-wrap;word-break:break-all;border-radius:8px';
  const btn = document.createElement('button');
  btn.textContent = 'Log';
  btn.style.cssText =
    'position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:10px 16px;border:0;border-radius:20px;background:#111;color:#0f0;font:600 13px monospace';
  btn.onclick = () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    panel.scrollTop = panel.scrollHeight;
  };
  const clear = document.createElement('button');
  clear.textContent = 'Clear';
  clear.style.cssText = btn.style.cssText.replace('right:12px', 'right:76px');
  clear.onclick = () => { lines.length = 0; panel.textContent = ''; };
  document.body.append(panel, btn, clear);

  const fmt = (a: unknown) => {
    if (a instanceof Error) return `${a.name}: ${a.message}`;
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  };
  const log = (tag: string, ...a: unknown[]) => {
    const t = new Date().toISOString().slice(11, 23);
    lines.push(`${t} ${tag} ${a.map(fmt).join(' ')}`);
    if (lines.length > 300) lines.shift();
    panel.textContent = lines.join('\n');
    if (panel.style.display !== 'none') panel.scrollTop = panel.scrollHeight;
  };

  for (const k of ['log', 'warn', 'error'] as const) {
    const orig = console[k].bind(console);
    console[k] = (...a: unknown[]) => { log(k.toUpperCase(), ...a); orig(...a); };
  }
  window.addEventListener('error', (e) => log('ERR', e.message, e.filename, e.lineno));
  window.addEventListener('unhandledrejection', (e) => log('REJ', e.reason));

  const f = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    const short = url.replace(/^https?:\/\/[^/]+/, '').slice(0, 70);
    const t0 = performance.now();
    try {
      const r = await f(input, init);
      log('NET', r.status, short, `${Math.round(performance.now() - t0)}ms`);
      return r;
    } catch (e) {
      log('NET FAIL', short, e);
      throw e;
    }
  };

  router.beforeEach((to, from) => { log('ROUTE ->', to.fullPath, 'from', from.fullPath); });
  router.afterEach((to, _from, failure) => { log('ROUTE done', to.fullPath, failure ? `FAILURE ${failure.message}` : 'ok'); });
  router.onError((e) => log('ROUTE ERROR', e));
});
