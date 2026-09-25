// Injected before any page script: virtualizes JS time so the page can be
// rendered frame-by-frame deterministically. CSS animations/transitions are
// driven through the Web Animations API from the same clock.
(() => {
  const W = window;
  const realSetTimeout = W.setTimeout.bind(W);
  const realSetInterval = W.setInterval.bind(W);
  const realClearInterval = W.clearInterval.bind(W);
  const realPerfNow = performance.now.bind(performance);
  const OrigDate = W.Date;
  const epoch = OrigDate.now();
  let vt = realPerfNow(); // start where the real clock is

  function VDate(...a) {
    if (!(this instanceof VDate)) return new OrigDate(epoch + (vt - startVt)).toString();
    return a.length ? new OrigDate(...a) : new OrigDate(epoch + (vt - startVt));
  }
  const startVt = vt;
  VDate.prototype = OrigDate.prototype;
  VDate.now = () => epoch + (vt - startVt);
  VDate.parse = OrigDate.parse;
  VDate.UTC = OrigDate.UTC;
  W.Date = VDate;
  performance.now = () => vt;

  const timers = new Map();
  let tid = 1;
  W.setTimeout = (fn, ms, ...args) => {
    const id = tid++;
    timers.set(id, { fn, at: vt + Math.max(0, +ms || 0), args, every: 0 });
    return id;
  };
  W.setInterval = (fn, ms, ...args) => {
    const id = tid++;
    const every = Math.max(4, +ms || 0);
    timers.set(id, { fn, at: vt + every, args, every });
    return id;
  };
  W.clearTimeout = W.clearInterval = (id) => { timers.delete(id); };

  let rafs = new Map();
  let rid = 1;
  W.requestAnimationFrame = (fn) => { const id = rid++; rafs.set(id, fn); return id; };
  W.cancelAnimationFrame = (id) => { rafs.delete(id); };

  // --- CSS animations & transitions follow the virtual clock ---
  const seen = new WeakMap();
  function syncAnimations() {
    let list = [];
    try { list = document.getAnimations(); } catch (e) {}
    for (const a of list) {
      let s = seen.get(a);
      if (!s) {
        const cur = typeof a.currentTime === 'number' ? a.currentTime : 0;
        s = { base: Math.min(cur, 34), v0: vt };
        seen.set(a, s);
        try { a.pause(); } catch (e) {}
      }
      try { a.currentTime = s.base + (vt - s.v0); } catch (e) {}
    }
  }

  // --- smooth scrollIntoView / scrollTo on elements, tweened on virtual time ---
  const tweens = new Set();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function tweenScroll(el, to, dur = 420) {
    const from = el.scrollTop;
    for (const t of tweens) if (t.el === el) tweens.delete(t);
    tweens.add({ el, from, to, t0: vt, dur });
  }
  function scrollParent(node) {
    let p = node.parentElement;
    while (p && p !== document.body) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
      p = p.parentElement;
    }
    return null;
  }
  const origSIV = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (opts) {
    const sp = scrollParent(this);
    if (sp && opts && typeof opts === 'object' && opts.behavior === 'smooth') {
      const r = this.getBoundingClientRect();
      const pr = sp.getBoundingClientRect();
      let target = sp.scrollTop;
      if (opts.block === 'end') target += r.bottom - pr.bottom;
      else target += r.top - pr.top;
      target = Math.max(0, Math.min(target, sp.scrollHeight - sp.clientHeight));
      tweenScroll(sp, target);
      return;
    }
    return origSIV.call(this, opts);
  };
  function runTweens() {
    for (const t of tweens) {
      const k = Math.min(1, (vt - t.t0) / t.dur);
      t.el.scrollTop = t.from + (t.to - t.from) * ease(k);
      if (k >= 1) tweens.delete(t);
    }
  }

  function runTimersUntil(target) {
    for (let guard = 0; guard < 10000; guard++) {
      let next = null;
      for (const [id, t] of timers) if (t.at <= target && (!next || t.at < next[1].at)) next = [id, t];
      if (!next) break;
      const [id, t] = next;
      if (t.at > vt) vt = t.at;
      if (t.every) t.at += t.every; else timers.delete(id);
      try { typeof t.fn === 'function' ? t.fn(...t.args) : (0, eval)(t.fn); } catch (e) { console.error(e); }
    }
    vt = Math.max(vt, target);
  }
  function frame() {
    const cbs = rafs; rafs = new Map();
    for (const fn of cbs.values()) { try { fn(vt); } catch (e) { console.error(e); } }
  }

  W.__vt = { get now() { return vt; }, live: true };
  W.__advance = (ms, step = 1000 / 60) => {
    const end = vt + ms;
    while (vt < end - 1e-6) {
      const target = Math.min(end, vt + step);
      runTimersUntil(target);
      runTweens();
      frame();
    }
    syncAnimations();
    return vt;
  };
  // Live mode: follow the real clock until the recorder takes over.
  let last = realPerfNow();
  const liveId = realSetInterval(() => {
    const now = realPerfNow();
    if (W.__vt.live) W.__advance(now - last);
    last = now;
  }, 16);
  W.__restartAnims = () => {
    let list = [];
    try { list = document.getAnimations(); } catch (e) {}
    for (const a of list) { seen.set(a, { base: 0, v0: vt }); try { a.pause(); a.currentTime = 0; } catch (e) {} }
  };
  W.__stopLive = () => { W.__vt.live = false; realClearInterval(liveId); syncAnimations(); };
})();
