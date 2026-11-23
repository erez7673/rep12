// Onboarding / edit profile, Profile, Settings and Progress screens.
import { state, profile, profileList, createProfile, touchProfile, save, replaceState, exById, today } from './store.js';
import { esc, icon, register, toast, fmtDate, sheet, closeSheet, setTheme, applyA11y } from './ui.js';
import { say, canSpeak } from './speak.js';
import { coachAvailable, coachProfileRow, coachSettingsBlock, openMeet } from './coach.js';
import { GOALS, LEVELS, FOCUS, generatePlan, AREAS, areasFor, dayName, exPerDay, setDayAreas, fitDay, MAX_DAYS, MAX_EX_PER_DAY } from './planner.js';
import { startTour } from './tour.js';
import { INJURIES } from './exercises.js';
import { lineChart, barChart } from './charts.js';
import { syncNow, syncEnabled, scheduleSync } from './sync.js';
import { t, LANGS, langChoices, lang, isUS, toW, fromW, wUnit, fmtW, fmtH, toFtIn, locale } from './i18n.js';
import { rerender } from './app.js';

const COLORS = ['#2f7cf6', '#e84d8a', '#12a37f', '#f08a24', '#8b5cf6'];

// ───────────── Onboarding / edit profile / custom plan ─────────────
// mode: 'new' (whole form), 'edit' (personal details up to training days) or 'custom' (the plan settings).
const DEFAULT_STATS = { sex: 'female', level: 'beginner', goal: 'hypertrophy', days: 3, minutes: 45, warmup: 5, cardio: true, injuries: [], focus: [] };
const range = (a, b) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, i) => [a + i, String(a + i)]));

function profileForm(mode) {
  const p = mode === 'new' ? null : profile();
  const s = p?.stats || DEFAULT_STATS;
  const radio = (name, map, val, attrs = '') => `<div class="seg-ctl">${Object.entries(map).map(([k, v]) => `<label><input type="radio" name="${name}" value="${k}" ${String(val) === String(k) ? 'checked' : ''} ${attrs}><span>${esc(v)}</span></label>`).join('')}</div>`;
  const checks = (name, map, vals) => `<div class="chipwrap">${Object.entries(map).map(([k, v]) => `<label class="chk"><input type="checkbox" name="${name}" value="${k}" ${vals.includes(k) ? 'checked' : ''}><span>${esc(typeof v === 'string' ? v : v.name)}</span></label>`).join('')}</div>`;
  const days = s.days || 3;
  const [ft, inch] = toFtIn(s.height);
  const height = isUS()
    ? `<div class="field"><span>${t('Height')}</span><div class="two">
          <label class="unitin"><input name="hft" type="number" inputmode="numeric" min="4" max="7" value="${s.height ? ft : ''}" required><i>ft</i></label>
          <label class="unitin"><input name="hin" type="number" inputmode="numeric" min="0" max="11" value="${s.height ? inch : ''}" required><i>in</i></label></div></div>`
    : `<label class="field"><span>${t('Height cm')}</span><input name="height" type="number" inputmode="numeric" min="120" max="230" value="${s.height || ''}" required></label>`;
  const personal = `
        <label class="field"><span>${t('Name')}</span><input name="name" required value="${esc(p?.name || '')}" placeholder="${t('Your name')}"></label>
        <div class="field"><span>${t('Sex')}</span>${radio('sex', { female: t('Female'), male: t('Male') }, s.sex)}</div>
        <div class="${isUS() ? 'two' : 'three'}">
          <label class="field"><span>${t('Age')}</span><input name="age" type="number" inputmode="numeric" min="14" max="99" value="${s.age || ''}" required></label>
          ${isUS() ? '' : height}
          <label class="field"><span>${t('Weight {u}', { u: wUnit() })}</span><input name="weight" type="number" inputmode="decimal" step="0.1" min="${isUS() ? 66 : 30}" max="${isUS() ? 550 : 250}" value="${s.weight ? toW(s.weight) : ''}" required></label>
        </div>
        ${isUS() ? height : ''}
        <div class="field"><span>${t('Experience')}</span>${radio('level', LEVELS, s.level)}</div>
        <div class="field"><span>${t('Main goal')}</span>${radio('goal', Object.fromEntries(Object.entries(GOALS).map(([k, v]) => [k, v.name])), s.goal)}</div>
        <div class="field"><span>${t('Training days per week')}</span>${radio('days', range(2, MAX_DAYS), days)}</div>`;
  const planFields = `
        <div class="field"><span>${t('Exercises per workout day')} <small>${t('(4 sets each, plus warm-up and cooldown)')}</small></span>${radio('exPerDay', range(1, MAX_EX_PER_DAY), exPerDay(s))}</div>
        ${mode === 'custom' ? `<div class="field"><span>${t('Muscle areas per workout day')} <small>${t('(leave a day empty and the app chooses)')}</small></span>
          ${Array.from({ length: days }, (_, i) => `<div class="dayareas"><b>${esc(dayName(i))}</b>${checks('areas' + i, AREAS, areasFor(p, i))}</div>`).join('')}
        </div>` : ''}
        <div class="field"><span>${t('Session length')}</span>${radio('minutes', { 30: t('{n} min', { n: 30 }), 45: t('{n} min', { n: 45 }), 60: t('{n} min', { n: 60 }), 75: t('{n} min', { n: 75 }) }, s.minutes)}</div>
        <div class="field"><span>${t('Warm-up')}</span>${radio('warmup', { 0: t('None'), 3: t('{n} min', { n: 3 }), 5: t('{n} min', { n: 5 }), 8: t('{n} min', { n: 8 }) }, s.warmup)}</div>
        <label class="toggle-line"><input type="checkbox" name="cardio" ${s.cardio ? 'checked' : ''}> ${t('Add a cardio finisher (treadmill, elliptical, stairs, bike)')}</label>
        <div class="field"><span>${t('Injuries or limitations')} <small>${t('(exercises that load these are avoided)')}</small></span>${checks('injuries', INJURIES, s.injuries || [])}</div>
        <div class="field"><span>${t('Extra focus')} <small>${t('(adds exercises for these)')}</small></span>${checks('focus', FOCUS, s.focus || [])}</div>`;
  const colour = `<div class="field"><span>${t('Colour')}</span><div class="colors">${COLORS.map((c, i) => `<label><input type="radio" name="color" value="${c}" ${i === profileList().length % COLORS.length ? 'checked' : ''}><i style="background:${c}"></i></label>`).join('')}</div></div>`;
  const buttons = mode === 'new' ? `<button class="btn primary big" data-act="create-profile">${t('Build my plan')}</button>`
    : mode === 'custom' ? `<button class="btn primary big" data-act="save-profile" data-mode="custom" data-rebuild="1">${t('Build my custom plan')}</button>
                  <button class="btn" data-act="save-profile" data-mode="custom">${t('Save without changing the plan')}</button>`
    : `<button class="btn primary big" data-act="save-profile" data-mode="edit" data-rebuild="1">${t('Save & rebuild plan')}</button>
                  <button class="btn" data-act="save-profile" data-mode="edit">${t('Save without changing the plan')}</button>`;
  return `<form id="pform" class="form" data-act-submit>
        ${mode !== 'custom' ? personal : ''}
        ${mode !== 'edit' ? planFields : ''}
        ${mode === 'new' ? colour : ''}
        ${buttons}
      </form>`;
}

const DISCLAIMER = () => t('This app gives general fitness guidance, not medical advice. If you have an injury or a health condition, or haven\'t trained for a long time, check with a doctor or physiotherapist first. Stop any exercise that hurts.');

export function onboardView(edit) {
  const first = !profileList().length;
  return {
    full: first,
    html: `<header class="bar">${first ? `<button class="iconbtn a11y-btn" data-act="go" data-href="#/access" aria-label="${t('Accessibility')}">${icon.access}</button>` : `<button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button>`}<h2>${edit ? t('Edit profile') : first ? t('Welcome') + ' 👋' : t('New profile')}</h2><span></span></header>
      ${first ? `<p class="lead">${t('Let\'s build your personal plan. You can add more profiles afterwards, for example for a partner.')}</p>
        <p class="muted small">${DISCLAIMER()}</p>
        <div class="card list"><a class="eqrow" href="#/settings"><span>${t('Language and units')}</span><span class="muted">${esc(LANGS[lang()])} · ${isUS() ? 'lb, ft' : 'kg, cm'} ${icon.chev}</span></a></div>` : ''}
      ${profileForm(edit ? 'edit' : 'new')}
      ${edit ? `<p class="muted small">${t('Exercises per day, muscle areas, session length, warm-up, cardio, injuries and extra focus are under Profile → Build your custom plan.')}</p>` : ''}`,
  };
}

export function customPlanView() {
  const p = profile();
  return {
    html: `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2>${t('Build your custom plan')}</h2><span></span></header>
      <p class="muted small">${t('Choose how each of your {n} workout days looks. Change the number of days under Edit profile.', { n: p.stats.days || 3 })}</p>
      <p class="muted small">${t('A custom plan keeps the same sets and reps all 12 weeks. A plan built from Edit profile gets harder in steps.')}</p>
      ${profileForm('custom')}`,
  };
}

// Reads only the fields that are on the form, so the edit and custom-plan screens each change their own part.
// Weight and height are always stored in kg and cm.
function readForm() {
  const f = document.getElementById('pform');
  if (!f.reportValidity()) return null;
  const fd = new FormData(f);
  const has = (n) => !!f.querySelector(`[name="${n}"]`);
  const stats = {};
  if (has('age')) {
    const height = has('hft') ? Math.round((+fd.get('hft') * 12 + +fd.get('hin')) * 2.54) : +fd.get('height');
    const weight = Math.round(fromW(fd.get('weight')) * 10) / 10;
    Object.assign(stats, { sex: fd.get('sex'), age: +fd.get('age'), height, weight, level: fd.get('level'), goal: fd.get('goal'), days: +fd.get('days') });
  }
  if (has('minutes')) Object.assign(stats, { minutes: +fd.get('minutes'), warmup: +fd.get('warmup'), cardio: fd.get('cardio') === 'on', injuries: fd.getAll('injuries'), focus: fd.getAll('focus'), exPerDay: +fd.get('exPerDay') || 4 });
  if (has('areas0')) stats.dayAreas = Array.from({ length: profile().stats.days || 3 }, (_, i) => fd.getAll('areas' + i));
  return { name: has('name') ? fd.get('name').trim() : null, color: fd.get('color'), stats };
}

// After saving without a rebuild: apply changed muscle areas, then give every day the chosen number of exercises.
function applyDayChanges(p) {
  if (!p.plan) return;
  p.plan.days.forEach((day, d) => {
    const want = (p.stats.dayAreas?.[d] || []).filter(k => AREAS[k]);
    if (want.join() !== (day.muscles || []).join()) setDayAreas(p, d, want);
    else fitDay(p, d);
  });
}

register({
  'create-profile': () => {
    const d = readForm(); if (!d) return;
    d.stats.likes = []; d.stats.dislikes = [];
    const first = !profileList().length;
    const p = createProfile(d);
    p.plan = generatePlan(p);
    touchProfile(p); scheduleSync(1000);
    toast(t('Plan ready, {name}!', { name: p.name }));
    location.hash = '#/plan';
    // A new user gets the app tour once, right after making their first profile.
    const tour = first && !state.settings.tourDone;
    // Every new profile meets the coaches (the coach is per phone, so the current one shows as chosen);
    // the tour starts once the card is answered.
    if (coachAvailable()) setTimeout(() => openMeet(tour ? () => startTour() : null), 500);
    else if (tour) setTimeout(() => startTour(), 600);
  },
  'save-profile': (el) => {
    const d = readForm(); if (!d) return;
    const p = profile();
    if (d.name) p.name = d.name;
    const oldW = p.stats.weight;
    if (el.dataset.rebuild && p.plan && Object.keys(p.plan.done).length && !confirm(t('Rebuilding restarts your plan at week 1 (history is kept). Continue?'))) return;
    p.stats = { ...p.stats, ...d.stats };
    if (d.stats.weight && Math.abs(d.stats.weight - oldW) > 0.05) p.bodyweight.push({ date: today(), kg: d.stats.weight });
    if (el.dataset.rebuild) p.plan = generatePlan(p);
    else applyDayChanges(p);
    // Saved from "Build your custom plan": the plan keeps the same sets and reps every week.
    if (el.dataset.mode === 'custom' && p.plan && !p.plan.template) p.plan.custom = true;
    touchProfile(p); scheduleSync();
    toast(t('Saved')); location.hash = el.dataset.rebuild ? '#/plan' : '#/profile';
  },
});

// ───────────── Profile ─────────────
export function profileView() {
  const p = profile();
  const s = p.stats;
  const n = profileList().length;
  return {
    html: `<header class="top"><h1>${t('Profile')}</h1><span class="hdr-btns"><button class="iconbtn a11y-btn" data-act="go" data-href="#/access" aria-label="${t('Accessibility')}">${icon.access}</button><button class="iconbtn gear" data-act="go" data-href="#/settings" aria-label="${t('Settings')}">${icon.gear}</button></span></header>
      <div class="card me"><span class="avatar lg" style="--c:${p.color}">${esc(p.name[0])}</span>
        <div><b>${esc(p.name)}</b><small>${t('{n} y', { n: s.age })} · ${fmtH(s.height)} · ${fmtW(s.weight)} · ${esc(LEVELS[s.level])}</small>
        <small>${esc(GOALS[s.goal].name)} · ${t('{d} days × {m} min', { d: s.days, m: s.minutes })}</small></div></div>
      <div class="card list">
        <a class="eqrow" href="#/onboard/edit"><span>${t('Edit profile')}</span>${icon.chev}</a>
        <a class="eqrow" href="#/custom"><span>${t('Build your custom plan')}</span>${icon.chev}</a>
        <button class="eqrow" data-act="tpl-open"><span>${t('App-built plans')}</span>${icon.chev}</button>
        ${coachProfileRow()}
        <button class="eqrow" data-act="switch-profile"><span>${t('Switch profile')}</span><span class="muted">${n === 1 ? t('1 profile') : t('{n} profiles', { n })} ${icon.chev}</span></button>
        <a class="eqrow" href="#/onboard"><span>${t('Add a profile')}</span>${icon.plus}</a>
        <a class="eqrow" href="#/gym"><span>${t('Gym setup')}</span>${icon.chev}</a>
        <button class="eqrow" data-act="tour-start"><span>${t('Take the app tour')}</span>${icon.chev}</button>
      </div>
      <button class="btn ghost danger" data-act="del-profile">${t('Delete {name}\'s profile', { name: esc(p.name) })}</button>`,
  };
}

// ───────────── Accessibility (icon on Profile and on the welcome screen; also in Settings) ─────────────
export function accessView() {
  const st = state.settings;
  const size = st.textSize || 'normal';
  const sw = (k, label, help) => `<label class="eqrow"><span>${label}${help ? `<small>${help}</small>` : ''}</span><input type="checkbox" class="switch" ${st[k] ? 'checked' : ''} data-change="set-a11y" data-k="${k}"></label>`;
  return {
    html: `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2>${t('Accessibility')}</h2><span></span></header>
      <h3>${t('Text size')}</h3>
      <div class="seg-ctl text-ctl" role="radiogroup" aria-label="${t('Text size')}">${[['normal', t('Normal')], ['large', t('Large')], ['xl', t('Extra large')]].map(([k, v]) =>
        `<label><input type="radio" name="textSize" value="${k}" ${size === k ? 'checked' : ''} data-change="set-text"><span>${v}</span></label>`).join('')}</div>
      <p class="muted small">${t('Makes all the text in the app bigger. Your phone\'s own text size setting is not changed.')}</p>

      <h3>${t('Seeing the screen')}</h3>
      <div class="card list a11y-card">
        ${sw('contrast', t('High contrast'), t('Darker text, stronger lines and colours that stand out more.'))}
        ${sw('bigButtons', t('Bigger buttons'), t('Larger buttons and more space between them, so they are easier to tap.'))}
        ${sw('reduceMotion', t('Reduce motion'), t('Exercise clips stay still until you play them, and sliding and fading stop. Your phone\'s own setting is followed too.'))}
      </div>

      <h3>${t('Spoken workout cues')}</h3>
      <div class="card list speak-card">
        ${canSpeak() ? sw('speak', t('Speak during workouts'), t('The phone says when a set is logged, when 10 seconds of rest are left, when rest is over and which set is next.'))
          : `<p class="muted small">${t('This phone has no text-to-speech voice for the app.')}</p>`}
        ${canSpeak() ? `<button class="eqrow" data-act="test-voice"><span>${t('Test the voice')}</span><span aria-hidden="true">🔊</span></button>` : ''}
      </div>
      <p class="muted small">${t('Uses your phone\'s voice in the app\'s language. Turn the volume up and silent mode off.')}</p>

      <h3>${t('Screen readers')}</h3>
      <div class="card"><p class="muted small">${t('Rep12 works with VoiceOver (iPhone) and TalkBack (Android): every button has a spoken name. Turn them on in your phone\'s accessibility settings.')}</p></div>`,
  };
}

// ───────────── Settings (gear on the Profile screen) ─────────────
export function settingsView() {
  const st = state.settings;
  const last = st.lastSync ? new Date(st.lastSync).toLocaleString(locale()) : t('never');
  const seg = (name, act, cur, opts) => `<div class="seg-ctl ${name}-ctl">${opts.map(([k, v]) =>
    `<label><input type="radio" name="${name}" value="${k}" ${cur === k ? 'checked' : ''} data-change="${act}"><span>${v}</span></label>`).join('')}</div>`;
  return {
    html: `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2>${t('Settings')}</h2><span></span></header>
      <h3>${t('Language')}</h3>
      <div class="card"><select class="selectline lang-sel" data-change="set-lang" aria-label="${t('Language')}">${Object.entries(langChoices()).map(([k, v]) =>
        `<option value="${k}" ${lang() === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>

      <h3>${t('Units')}</h3>
      ${seg('units', 'set-units', st.units || 'metric', [['metric', t('Metric (kg, cm)')], ['us', t('US (lb, ft)')]])}
      <p class="muted small">${t('Your data is kept the same; only how weights and heights are shown changes.')}</p>

      <h3>${t('Appearance')}</h3>
      ${seg('theme', 'set-theme', st.theme || 'auto', [['auto', t('Auto')], ['light', '☀️ ' + t('Light')], ['dark', '🌙 ' + t('Dark')]])}
      <p class="muted small">${t('Auto follows your phone\'s setting.')}</p>

      <h3>${t('Accessibility')}</h3>
      <div class="card list"><a class="eqrow a11y-row" href="#/access"><span>${icon.access} ${t('Text size, contrast, bigger buttons, spoken cues')}</span>${icon.chev}</a></div>

      ${coachSettingsBlock()}

      <h3>${t('Workout')}</h3>
      <div class="card list beep-card">
        <label class="eqrow"><span>${t('Beep when rest ends')}</span><input type="checkbox" class="switch" ${st.sound ? 'checked' : ''} data-change="set-flag" data-k="sound"></label>
        <button class="eqrow" data-act="test-beep"><span>${t('Test the beep')}</span><span class="muted">🔊</span></button>
      </div>
      <p class="muted small">${t('The screen stays on during a workout so the timer can beep. Turn the phone\'s volume up and silent mode off.')}</p>

      <h3>${t('Sync with Google Sheets')}</h3>
      <div class="card sync-card">
        <p class="muted small">${t('Backs up all profiles and the gym setup to your own Google Sheet, and keeps your phones in sync. Set-up steps are in the README.')}</p>
        <label class="field"><span>${t('Apps Script web app URL')}</span><input id="syncUrl" value="${esc(st.syncUrl)}" placeholder="https://script.google.com/macros/s/…/exec"></label>
        <label class="field"><span>${t('Secret key (same as in the script)')}</span><input id="syncKey" value="${esc(st.syncKey)}" placeholder="${t('your shared secret')}"></label>
        <div class="btnrow"><button class="btn" data-act="save-sync">${t('Save')}</button><button class="btn primary" data-act="sync-now" ${syncEnabled() ? '' : 'disabled'}>${icon.sync} ${t('Sync now')}</button></div>
        <p class="muted small">${t('Last sync: {when}', { when: esc(last) })}${st.lastSyncError ? ` · <span class="warn">${esc(st.lastSyncError)}</span>` : ''}</p>
        <label class="toggle-line"><input type="checkbox" ${st.aiEnabled ? 'checked' : ''} data-change="set-flag" data-k="aiEnabled"> ${t('Experimental: AI machine recognition (needs a Claude API key in the script)')}</label>
      </div>

      <h3>${t('Backup')}</h3>
      <div class="card btnrow backup-card">
        <button class="btn" data-act="export">${t('Export file')}</button>
        <label class="btn">${t('Import file')}<input type="file" accept="application/json" hidden data-change="import"></label>
      </div>

      <h3>${t('About')}</h3>
      <div class="card about-card"><p class="muted small">${t('Your data stays on this phone. Nothing is sent anywhere unless you set up Google Sheets sync, which sends it only to your own sheet.')}</p>
        <p class="muted small">${DISCLAIMER()}</p></div>
      <p class="muted small center">Rep12 · v1.1</p>`,
  };
}

register({
  'set-flag': (el) => { state.settings[el.dataset.k] = el.checked; save(); },
  'set-a11y': (el) => {
    state.settings[el.dataset.k] = el.checked; save(); applyA11y();
    if (el.dataset.k === 'speak' && el.checked) say(t('Spoken workout cues are on.'));
  },
  'set-text': (el) => { state.settings.textSize = el.value; save(); applyA11y(); },
  'test-voice': () => say(t('{name}, set {a} of {b}.', { name: exById('leg-press')?.name || 'Leg Press', a: 2, b: 4 }), true),
  'set-theme': (el) => { setTheme(el.value); },
  // A new language needs a fresh start so every screen and the exercise texts are loaded in it.
  'set-lang': (el) => { state.settings.lang = el.value; save(true); location.reload(); },
  'set-units': (el) => { state.settings.units = el.value; save(); rerender(); },
  'save-sync': () => {
    state.settings.syncUrl = document.getElementById('syncUrl').value.trim();
    state.settings.syncKey = document.getElementById('syncKey').value.trim();
    save(true); toast(t('Saved')); rerender();
  },
  'sync-now': async () => {
    toast(t('Syncing…'));
    try { const r = await syncNow(); toast(r.skipped ? t('Offline or not set up') : t('Synced · {a} updated, {b} sent', { a: r.pulled, b: r.pushed })); }
    catch (e) { toast(t('Sync failed: {msg}', { msg: e.message })); }
    rerender();
  },
  'export': () => {
    const blob = new Blob([JSON.stringify({ ...state, session: null }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rep12-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  'import': async (el) => {
    const f = el.files?.[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.profiles) throw new Error(t('Not a backup file from this app'));
      if (!confirm(t('Replace all data on this phone with the backup?'))) return;
      data.settings = { ...data.settings, ...state.settings };
      replaceState(data); toast(t('Backup restored')); location.hash = '#/plan'; rerender();
    } catch (e) { toast(t('Import failed: {msg}', { msg: e.message })); }
  },
  'del-profile': () => {
    const p = profile();
    if (!confirm(t('Delete {name}\'s profile and all their history from this phone? This cannot be undone.', { name: p.name }))) return;
    delete state.profiles[p.id];
    state.activeProfile = Object.keys(state.profiles)[0] || null;
    save(true); location.hash = state.activeProfile ? '#/plan' : '#/onboard';
  },
});

// ───────────── Progress ─────────────
let progEx = null;

export function progressView() {
  const p = profile();
  const h = p.history;
  const now = Date.now();
  const monthAgo = now - 30 * 864e5;
  const volume = toW(h.reduce((a, r) => a + r.items.reduce((b, it) => b + it.sets.reduce((c, x) => c + (it.unit === 'reps' ? x.reps * x.kg : 0), 0), 0), 0));

  // Workouts per week, last 8 weeks.
  const weekStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = thisWeek - (7 - i) * 7 * 864e5;
    const n = h.filter(r => r.date >= start && r.date < start + 7 * 864e5).length;
    return { label: new Date(start).toLocaleDateString(locale(), { day: 'numeric', month: 'numeric' }), y: n };
  });

  // Exercises with history.
  const exIds = [...new Set(h.flatMap(r => r.items.filter(it => it.unit === 'reps').map(it => it.exId)))]
    .sort((a, b) => (exById(b)?.load ? 1 : 0) - (exById(a)?.load ? 1 : 0));
  if (!progEx || !exIds.includes(progEx)) progEx = exIds[0] || null;
  const ex = progEx && exById(progEx);
  const exPts = progEx ? h.flatMap(r => r.items.filter(it => it.exId === progEx).map(it => {
    const best = it.sets.reduce((m, s) => Math.max(m, ex?.load ? (s.kg || 0) * (1 + (s.reps || 0) / 30) : s.reps || 0), 0);
    return { x: r.date, y: ex?.load ? toW(best) : Math.round(best * 10) / 10 };
  })) : [];

  const bw = p.bodyweight.map(b => ({ x: new Date(b.date).getTime(), y: toW(b.kg) }));
  const big = isUS() ? (volume >= 100000 ? Math.round(volume / 1000) + 'k' : Math.round(volume).toLocaleString(locale())) : (volume >= 10000 ? Math.round(volume / 1000) + 't' : Math.round(volume));

  return {
    html: `<header class="top"><h1>${t('Progress')}</h1></header>
      <div class="statrow">
        <div class="stat"><b>${h.length}</b><small>${t('Workouts')}</small></div>
        <div class="stat"><b>${h.filter(r => r.date > monthAgo).length}</b><small>${t('Last 30 days')}</small></div>
        <div class="stat"><b>${big}</b><small>${t('{u} lifted', { u: wUnit() })}</small></div>
      </div>
      <h3>${t('Workouts per week')}</h3>
      <div class="card">${barChart(weeks)}</div>

      <h3>${t('Strength')}</h3>
      <div class="card">
        ${exIds.length ? `<select class="selectline" data-change="prog-ex">${exIds.map(id => `<option value="${id}" ${id === progEx ? 'selected' : ''}>${esc(exById(id)?.name || id)}</option>`).join('')}</select>
        ${lineChart(exPts, { unit: ex?.load ? ' ' + wUnit() : '' })}
        <p class="muted small">${ex?.load ? t('Estimated 1-rep max from your best set (Epley formula).') : t('Best reps per session.')}</p>` : `<p class="muted">${t('Log a workout to see your strength trends.')}</p>`}
      </div>

      <h3>${t('Body weight')}</h3>
      <div class="card">${lineChart(bw, { unit: ' ' + wUnit() })}
        <div class="btnrow"><input id="bwIn" aria-label="${t('Today\'s weight ({u})', { u: wUnit() })}" type="number" inputmode="decimal" step="0.1" placeholder="${t('Today\'s weight ({u})', { u: wUnit() })}"><button class="btn" data-act="add-bw">${t('Add')}</button></div>
      </div>

      <h3>${t('History')}</h3>
      <div class="card list">${h.length ? [...h].reverse().slice(0, 40).map(r => `<a class="eqrow" href="#/summary/${r.id}"><span><b>${esc(r.dayIdx != null ? dayName(r.dayIdx) : t(r.title))}</b><small>${fmtDate(r.date)} · ${t('{n} min', { n: Math.round(r.duration / 60) })} · ${t('{n} exercises', { n: r.items.length })}</small></span>${icon.chev}</a>`).join('') : `<p class="muted">${t('No workouts yet.')}</p>`}</div>`,
  };
}

register({
  'prog-ex': (el) => { progEx = el.value; rerender(); },
  'add-bw': () => {
    const typed = +document.getElementById('bwIn').value;
    const v = Math.round(fromW(typed) * 10) / 10;
    if (!typed || v < 30 || v > 250) return toast(t('Enter a weight in {u}', { u: wUnit() }));
    const p = profile();
    const d = today();
    p.bodyweight = p.bodyweight.filter(b => b.date !== d);
    p.bodyweight.push({ date: d, kg: v });
    p.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
    p.stats.weight = v;
    touchProfile(p); scheduleSync(); rerender(); toast(t('Weight saved'));
  },
});
