// Small UI helpers: escaping, icons, toasts, bottom sheets, action registry, light/dark theme.
import { state, save } from './store.js';
import { picFor } from './pictures.js';
import { t, toW, wUnit, locale } from './i18n.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Icons are decoration for screen readers: the button or link around them carries the label.
const P = (d, extra = '') => `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const icon = {
  access: P('<circle cx="12" cy="4.5" r="2"/><path d="M4.5 8.5L12 10l7.5-1.5M12 10v4.5M12 14.5L8.5 21M12 14.5l3.5 6.5"/>'),
  plan: P('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18M8 15l2 2 4-4"/>'),
  list: P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  gym: P('<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>'),
  chart: P('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
  user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  check: P('<path d="M5 12l5 5L20 7"/>', 'stroke-width="3"'),
  pause: P('<path d="M9 5v14M15 5v14"/>', 'stroke-width="3"'),
  play: P('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  back: P('<path d="M15 18l-6-6 6-6"/>', 'stroke-width="2.5" class="dir"'),
  chev: P('<path d="M9 18l6-6-6-6"/>', 'stroke-width="2.5" class="dir"'),
  dots: P('<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>'),
  info: P('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  camera: P('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.5"'),
  x: P('<path d="M18 6L6 18M6 6l12 12"/>', 'stroke-width="2.5"'),
  fire: P('<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-8z" fill="currentColor" stroke="none"/>'),
  timer: P('<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2.5 1.5M10 2h4M12 2v4M19 5l1.5 1.5"/>'),
  clock: P('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>'),
  swap: P('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  sync: P('<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M3 21v-5h5"/>'),
  trash: P('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  edit: P('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  move: P('<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>'),
  up: P('<path d="M12 19V5M6 11l6-6 6 6"/>', 'stroke-width="2.5"'),
  down: P('<path d="M12 5v14M6 13l6 6 6-6"/>', 'stroke-width="2.5"'),
  gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  search: P('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
};

// Exercise thumbnail: the user's own photo if any, otherwise the maker's picture of the equipment.
// Cardio machines and offline-without-cache fall back to a plain line icon.
const CARDIO_ICON = P('<path d="M3 12h4l2-5 4 10 2-5h6"/>');
export function thumb(ex, photo, size = 'md') {
  if (photo) return `<div class="thumb ${size}"><img src="${photo}" alt=""></div>`;
  const fallback = `<span class="ico">${ex?.m === 'cardio' ? CARDIO_ICON : icon.gym}</span>`;
  const pic = picFor(ex);
  if (!pic) return `<div class="thumb ${size}">${fallback}</div>`;
  return `<div class="thumb pic ${pic.brand.toLowerCase()} ${size}">${fallback}<img src="${pic.url}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></div>`;
}

let toastTimer;
export function toast(msg) {
  let t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

let sheetOpener = null;
export function sheet(html) {
  const root = $('#sheet');
  if (!root.classList.contains('open')) sheetOpener = document.activeElement;
  root.innerHTML = `<div class="sheet-bg" data-act="sheet-close" aria-hidden="true"></div><div class="sheet-card" role="dialog" aria-modal="true" tabindex="-1"><div class="grab"></div>${html}</div>`;
  root.classList.add('open');
  // Screen readers start reading at the sheet, and the keyboard focus moves into it.
  const card = root.querySelector('.sheet-card');
  const h = card.querySelector('h2');
  if (h) { h.id = 'sheet-title'; card.setAttribute('aria-labelledby', 'sheet-title'); }
  card.focus({ preventScroll: true });
}
export function closeSheet() {
  const r = $('#sheet'); const was = r.classList.contains('open');
  r.classList.remove('open'); r.innerHTML = '';
  if (was && sheetOpener?.isConnected) sheetOpener.focus({ preventScroll: true });
  sheetOpener = null;
}

// Global action registry for data-act="name" click handlers and data-change inputs.
export const actions = {};
export const register = (obj) => Object.assign(actions, obj);

// ── Light / dark theme ── ('auto' follows the phone's setting)
const SUN = P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
const MOON = P('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
export const isDark = () => state.settings.theme === 'dark' || (state.settings.theme !== 'light' && darkMQ.matches);

export function applyTheme() {
  const th = state.settings.theme || 'auto';
  if (th === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = th;
  const bg = isDark() ? '#0e0f11' : '#f4f4f5';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bg));
  document.querySelectorAll('[data-act="toggle-theme"]').forEach(b => {
    b.innerHTML = isDark() ? SUN : MOON;
    b.setAttribute('aria-label', isDark() ? t('Switch to light mode') : t('Switch to dark mode'));
  });
  document.querySelectorAll('input[name="theme"]').forEach(r => { r.checked = r.value === th; });
}
// Accessibility settings (per phone): text size, high contrast, bigger buttons. CSS reads them from <html>.
const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
// Less motion: the setting in Accessibility, or the phone's own "reduce motion".
export const motionReduced = () => !!state.settings.reduceMotion || reduceMQ.matches;
export function applyA11y() {
  const st = state.settings, d = document.documentElement.dataset;
  if (motionReduced()) d.motion = 'reduce'; else delete d.motion;
  if (st.textSize && st.textSize !== 'normal') d.text = st.textSize; else delete d.text;
  if (st.contrast) d.contrast = 'high'; else delete d.contrast;
  if (st.bigButtons) d.big = '1'; else delete d.big;
}
export function setTheme(th) { state.settings.theme = th; save(); applyTheme(); }
darkMQ.addEventListener?.('change', applyTheme);
reduceMQ.addEventListener?.('change', () => applyA11y());

export const themeButton = () => `<button class="iconbtn" data-act="toggle-theme" aria-label="${isDark() ? t('Switch to light mode') : t('Switch to dark mode')}">${isDark() ? SUN : MOON}</button>`;
register({ 'toggle-theme': () => setTheme(isDark() ? 'light' : 'dark') });

export const fmtClock = (sec) => {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};
export const fmtDur = (sec) => sec < 60 ? t('{n} s', { n: sec }) : sec % 60 ? t('{n} min', { n: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` }) : t('{n} min', { n: sec / 60 });
// A weight as a number in the user's unit (lb or kg), for inputs and labels.
export const fmtKg = (kg) => String(toW(kg));
export const fmtDate = (ts) => new Date(ts).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });

export function setLabel(set, unit) {
  const w = set.kg ? ` × ${fmtKg(set.kg)} ${wUnit()}` : '';
  if (unit === 'sec') return t('{n} s', { n: set.reps }) + w;
  if (unit === 'min') return t('{n} min', { n: set.reps });
  return set.kg ? `${set.reps}${w}` : t('{n} reps', { n: set.reps });
}

// Resize an image file to a small JPEG data URL (for machine photos).
export function resizeImage(file, max = 480, q = 0.65) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', q));
    };
    img.onerror = reject;
    img.src = url;
  });
}
