// App shell: router, bottom navigation, event delegation and the timer loop.
import { state, profile, touchProfile } from './store.js';
import { upgradePlan, dayCap, applyProfileAreas, dayName } from './planner.js';
import { t, initSettings, loadLang } from './i18n.js';
import { localizeData } from './localize.js';
import { actions, icon, $, closeSheet, fmtClock, applyTheme } from './ui.js';
import * as W from './workout.js';
import { syncNow, syncEnabled, scheduleSync } from './sync.js';
import { planView, dayView, sessionView, summaryView } from './views-plan.js';
import { libraryView, exerciseView, gymView, identifyView } from './views-gym.js';
import { onboardView, customPlanView, profileView, settingsView, progressView } from './views-me.js';
import { timerView, timerTick } from './views-timer.js';
import './tour.js';

const ROUTES = [
  [/^#?\/?$/, () => planView()],
  [/^#\/plan$/, () => planView()],
  [/^#\/day\/(\d+)\/(\d+)$/, (m) => dayView(+m[1], +m[2])],
  [/^#\/session$/, () => sessionView()],
  [/^#\/summary\/(.+)$/, (m) => summaryView(m[1])],
  [/^#\/exercises$/, () => libraryView()],
  [/^#\/ex\/(.+)$/, (m) => exerciseView(decodeURIComponent(m[1]))],
  [/^#\/gym$/, () => gymView()],
  [/^#\/timer$/, () => timerView()],
  [/^#\/identify$/, () => identifyView()],
  [/^#\/progress$/, () => progressView()],
  [/^#\/profile$/, () => profileView()],
  [/^#\/settings$/, () => settingsView()],
  [/^#\/onboard(\/edit)?$/, (m) => onboardView(!!m[1])],
  [/^#\/custom$/, () => customPlanView()],
];

const TABS = [
  ['#/plan', 'My Plan', icon.plan],
  ['#/exercises', 'Exercises', icon.list],
  ['#/gym', 'Gym', icon.gym],
  ['#/timer', 'Timer', icon.timer],
  ['#/progress', 'Progress', icon.chart],
  ['#/profile', 'Profile', icon.user],
]; // labels are translated with t() when drawn

let current = null;

export function render() {
  const hash = location.hash || '#/plan';
  if (!profile() && !hash.startsWith('#/onboard') && hash !== '#/settings') { location.replace('#/onboard'); return; }
  let view = null;
  for (const [re, fn] of ROUTES) { const m = hash.match(re); if (m) { view = fn(m); break; } }
  if (!view) { location.replace('#/plan'); return; }
  current = view;
  const main = $('#view');
  main.innerHTML = view.html;
  main.className = view.cls || '';
  const full = view.full; // full-screen views hide the nav
  $('#nav').hidden = !!full || !profile();
  const seg = (hash.split('/')[1] || 'plan');
  const tab = { day: 'plan', summary: 'plan', session: 'plan', ex: 'exercises', identify: 'gym', onboard: 'profile', custom: 'profile', settings: 'profile' }[seg] || seg;
  $('#nav').innerHTML = TABS.map(([href, label, ic]) =>
    `<a href="${href}" class="${href === '#/' + tab ? 'on' : ''}">${ic}<span>${t(label)}</span></a>`).join('');
  fitNav();
  renderLiveBar(hash);
  if (!view.keepScroll) window.scrollTo(0, 0);
  view.after?.();
}

// Shrinks a tab label that is wider than its tab (long translations), down to 8.5 px, so text and icon stay whole.
function fitNav() {
  for (const s of document.querySelectorAll('#nav a span')) {
    s.style.fontSize = '';
    const room = s.parentElement.clientWidth - 4;
    if (room <= 0) continue; // bar hidden
    let f = 11;
    while (s.scrollWidth > room && f > 8.5) s.style.fontSize = (f -= 0.5) + 'px';
  }
}
addEventListener('resize', fitNav);

export function rerender() {
  const y = window.scrollY;
  const v = current;
  if (v) v.keepScroll = true;
  render();
  window.scrollTo(0, y);
}

function renderLiveBar(hash) {
  const bar = $('#livebar');
  const s = state.session;
  if (!s?.startedAt || hash === '#/session') { bar.hidden = true; return; }
  bar.hidden = false;
  bar.innerHTML = `<a href="#/session"><span class="pulse"></span><b>${dayName(s.dayIdx)}</b><span data-t="live">${fmtClock(W.elapsed())}</span><span class="go">${t('Resume')} <i class="arw">›</i></span></a>`;
}

// ── Timer loop ──
setInterval(() => {
  timerTick();
  const ev = W.tick();
  if (ev === 'rest-done' || ev === 'hold-done') { if (location.hash === '#/session') rerender(); }
  const s = state.session;
  if (!s?.startedAt) return;
  for (const el of document.querySelectorAll('[data-t]')) {
    const k = el.dataset.t;
    if (k === 'elapsed' || k === 'live') el.textContent = fmtClock(W.elapsed());
    else if (k === 'rest') el.textContent = fmtClock(Math.ceil(W.restLeft()));
    else if (k === 'work') {
      const it = s.items[s.cur?.i];
      if (it?.unit === 'sec') { const left = (it.sets[s.cur.s]?.reps || 0) - W.workElapsed(); el.textContent = left > 0 ? fmtClock(Math.ceil(left)) : 'Done!'; }
      else el.textContent = fmtClock(W.workElapsed());
    } else if (k === 'restbar') {
      const pct = s.restTotal ? Math.max(0, Math.min(100, W.restLeft() / s.restTotal * 100)) : 0;
      el.style.width = pct + '%';
    } else if ((k === 'cardio' || k === 'warm') && s[k]?.endAt) {
      // Timed cardio (warm-up machine or finisher): beep once when the time is up.
      const left = (s[k].endAt - Date.now()) / 1000;
      el.textContent = left > 0 ? fmtClock(Math.ceil(left)) : 'Done!';
      if (left <= 0 && !s[k].fired) { s[k].fired = true; W.timerDone(k); W.beep(4); rerender(); }
    }
  }
}, 250);

// ── Event delegation ──
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (!fn) return console.warn('no action', el.dataset.act);
  e.preventDefault();
  fn(el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el && actions[el.dataset.change]) actions[el.dataset.change](el, e);
});
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (el && actions[el.dataset.input]) actions[el.dataset.input](el, e);
});
document.addEventListener('submit', (e) => e.preventDefault());
document.addEventListener('focusin', (e) => {
  if (e.target.matches('input[type=number]')) setTimeout(() => e.target.select?.(), 0);
});

actions['sheet-close'] = () => closeSheet();
actions['go'] = (el) => { closeSheet(); location.hash = el.dataset.href; };
actions['back'] = () => history.length > 1 ? history.back() : (location.hash = '#/plan');

window.addEventListener('hashchange', () => { closeSheet(); render(); });

// ── Start ──
// Move plans made by older app versions to the current format (4 exercises × 4 sets).
function upgradePlans() {
  let changed = false;
  for (const p of Object.values(state.profiles)) {
    let c = upgradePlan(p);
    // No day may have more exercises than set in the profile.
    for (const day of p.plan?.days || []) if (day.items.length > dayCap(p)) { day.items = day.items.slice(0, dayCap(p)); c = true; }
    // Workout days follow the muscle areas chosen under Profile → Build your custom plan, bigger muscles first.
    if (applyProfileAreas(p)) c = true;
    if (c) { touchProfile(p); changed = true; }
  }
  if (changed) scheduleSync();
  return changed;
}

// Language and units first, so the first screen is drawn in the chosen language.
initSettings();
await loadLang();
localizeData();

upgradePlans();
applyTheme();
render();
applyTheme();
if (syncEnabled()) syncNow().then(r => { if (upgradePlans() || r?.pulled) rerender(); }).catch(() => {});
window.addEventListener('online', () => syncEnabled() && syncNow().catch(() => {}));
if (state.session?.startedAt) W.keepAwake(true);

if ('serviceWorker' in navigator && location.protocol === 'https:') { // not on localhost, so edits show up while developing
  navigator.serviceWorker.register('./sw.js').catch(e => console.warn('sw', e));
}
