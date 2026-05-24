// Polls Last-Modified on key files and reloads on change. No-op outside localhost.
(() => {
  if (!/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname)) return;
  const files = ['/app.js', '/style.css', '/index.html'];
  const stamps = new Map();
  let primed = false;

  async function tick() {
    let changed = false;
    for (const f of files) {
      try {
        const r = await fetch(f + '?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        const stamp = r.headers.get('last-modified') || r.headers.get('etag') || '';
        if (primed && stamps.get(f) !== stamp) changed = true;
        stamps.set(f, stamp);
      } catch {}
    }
    primed = true;
    if (changed) { console.log('[livereload] reloading'); location.reload(); }
    else setTimeout(tick, 400);
  }
  tick();
})();
