/* =========================================================
   Utilidades: plantillas seguras, fechas (America/Managua), formato
   ========================================================= */

export const TZ = 'America/Managua';
export const LOCALE = 'es-NI';
// Nicaragua no aplica horario de verano: desplazamiento fijo UTC−6.
const OFFSET = '-06:00';

/* ---------- Plantillas HTML con escape automático ---------- */
class Raw {
  constructor(s) { this.s = String(s); }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(s);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function renderVal(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(renderVal).join('');
  return esc(v);
}
/** Plantilla etiquetada: escapa todo salvo valores marcados con raw() o creados con html``. */
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += renderVal(vals[i]) + strings[i + 1];
  return new Raw(out);
}
export const when = (cond, a, b = '') => (cond ? a : b);

/* ---------- Identificadores ---------- */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------- Fechas en America/Managua ---------- */
const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
/** Devuelve {date:'AAAA-MM-DD', time:'HH:mm'} en hora de Managua. */
export function localParts(d = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(d)).map((x) => [x.type, x.value]));
  const hour = p.hour === '24' ? '00' : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}` };
}
export function fromLocal(date, time = '00:00') { return new Date(`${date}T${time}:00${OFFSET}`); }
export function isoFromLocal(date, time) { return fromLocal(date, time).toISOString(); }
export function todayStr() { return localParts().date; }
export function nowTimeStr() { return localParts().time; }
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function addMonths(iso, n) {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString();
}
/** 0 = domingo … 6 = sábado */
export function dayOfWeek(dateStr) { return new Date(`${dateStr}T12:00:00Z`).getUTCDay(); }
export function daysBetween(a, b) { return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000); }
export function isValidDateStr(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime()); }
export function isValidTimeStr(s) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(s); }

const fmtCache = new Map();
function fmt(opts) {
  const key = JSON.stringify(opts);
  if (!fmtCache.has(key)) {
    let f;
    try { f = new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...opts }); } catch { f = new Intl.DateTimeFormat('es', { timeZone: TZ, ...opts }); }
    fmtCache.set(key, f);
  }
  return fmtCache.get(key);
}
export function fmtDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) { return fmt(opts).format(new Date(iso)); }
export function fmtDateStr(dateStr, opts) { return fmtDate(fromLocal(dateStr, '12:00'), opts); }
export function fmtLongDate(iso) { return capitalize(fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })); }
export function fmtShortDay(iso) { return capitalize(fmtDate(iso, { weekday: 'short', day: '2-digit', month: 'short' })); }
export function fmtTime(iso) { return localParts(iso).time; }
export function fmtDateTime(iso) { return `${fmtDate(iso, { day: 'numeric', month: 'short', year: 'numeric' })}, ${fmtTime(iso)}`; }
export function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 0) return fmtDateTime(iso);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  const today = todayStr();
  const d = localParts(iso).date;
  if (d === today) return `hoy, ${fmtTime(iso)}`;
  if (d === addDays(today, -1)) return `ayer, ${fmtTime(iso)}`;
  return fmtDateTime(iso);
}
export function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/** Matriz del mes (semanas de lunes a domingo) con fechas AAAA-MM-DD. */
export function monthMatrix(year, month /* 0-11 */) {
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const dow = (dayOfWeek(first) + 6) % 7; // lunes = 0
  let cur = addDays(first, -dow);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(cur); cur = addDays(cur, 1); }
    weeks.push(week);
    if (Number(cur.slice(5, 7)) - 1 !== month && w >= 3) break;
  }
  return weeks;
}

/* ---------- Formato ---------- */
export const money = (n) => `C$${Number(n).toLocaleString('es-NI')}`;
export function maskPhone(p) {
  const digits = String(p || '').replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const cc = digits.length > 8 ? `+${digits.slice(0, digits.length - 8)} ` : '';
  return `${cc}•••• ••${digits.slice(-2)}`;
}
export function initials(name) {
  return String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}
export function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
export function slug(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
export function normalize(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
export function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
export function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); }
export function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

/* ---------- Varios ---------- */
export function debounce(fn, ms = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
export function prefersReducedMotion() {
  return document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(v) {
  const s = String(v ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
/** Generador pseudoaleatorio determinista (para datos demo reproducibles). */
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function formData(form) {
  const out = {};
  new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });
  return out;
}
