/* ===== EPHYRA FINANCE — UTILITIES ===== */
const U = {
  id: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
  money: (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  date: (d) => new Date(d).toLocaleDateString('pt-BR'),
  dateInput: (d) => (d ? new Date(d).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
  pct: (v, t) => t === 0 ? 0 : Math.min(((v / t) * 100), 100),
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  capitalize: (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '',
  truncate: (s, n = 30) => s && s.length > n ? s.slice(0, n) + '…' : s || '',
  el: (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; },
  qs: (sel) => document.querySelector(sel),
  qsa: (sel) => document.querySelectorAll(sel),
  on: (el, ev, fn) => el && el.addEventListener(ev, fn),
  daysBetween: (a, b) => Math.ceil(Math.abs(new Date(b) - new Date(a)) / 864e5),
  sameDay: (a, b) => new Date(a).toDateString() === new Date(b).toDateString(),
  monthYear: (d) => { const dt = new Date(d); return `${dt.getMonth()}-${dt.getFullYear()}`; },
  currentMonthYear: () => { const n = new Date(); return `${n.getMonth()}-${n.getFullYear()}`; }
};
