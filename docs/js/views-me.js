// Onboarding / edit profile, Profile & settings, Progress screens.
import { state, profile, profileList, createProfile, touchProfile, save, replaceState, exById, today } from './store.js';
import { esc, icon, register, toast, fmtDate, fmtKg, sheet, closeSheet, setTheme } from './ui.js';
import { GOALS, LEVELS, FOCUS, generatePlan, AREAS, areasFor, dayName, exPerDay, setDayAreas, fitDay, MAX_DAYS, MAX_EX_PER_DAY } from './planner.js';
import { startTour } from './tour.js';
import { INJURIES, MUSCLES } from './exercises.js';
import { lineChart, barChart } from './charts.js';
import { syncNow, syncEnabled, scheduleSync } from './sync.js';
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
  const personal = `
        <label class="field"><span>Name</span><input name="name" required value="${esc(p?.name || '')}" placeholder="Your name"></label>
        <div class="field"><span>Sex</span>${radio('sex', { female: 'Female', male: 'Male' }, s.sex)}</div>
        <div class="three">
          <label class="field"><span>Age</span><input name="age" type="number" inputmode="numeric" min="14" max="99" value="${s.age || ''}" required></label>
          <label class="field"><span>Height cm</span><input name="height" type="number" inputmode="numeric" min="120" max="230" value="${s.height || ''}" required></label>
          <label class="field"><span>Weight kg</span><input name="weight" type="number" inputmode="decimal" step="0.1" min="30" max="250" value="${s.weight || ''}" required></label>
        </div>
        <div class="field"><span>Experience</span>${radio('level', LEVELS, s.level)}</div>
        <div class="field"><span>Main goal</span>${radio('goal', Object.fromEntries(Object.entries(GOALS).map(([k, v]) => [k, v.name])), s.goal)}</div>
        <div class="field"><span>Training days per week</span>${radio('days', range(2, MAX_DAYS), days)}</div>`;
  const planFields = `
        <div class="field"><span>Exercises per workout day <small>(4 sets each, plus warm-up and cooldown)</small></span>${radio('exPerDay', range(1, MAX_EX_PER_DAY), exPerDay(s))}</div>
        ${mode === 'custom' ? `<div class="field"><span>Muscle areas per workout day <small>(leave a day empty and the app chooses)</small></span>
          ${Array.from({ length: days }, (_, i) => `<div class="dayareas"><b>${dayName(i)}</b>${checks('areas' + i, AREAS, areasFor(p, i))}</div>`).join('')}
        </div>` : ''}
        <div class="field"><span>Session length</span>${radio('minutes', { 30: '30 min', 45: '45 min', 60: '60 min', 75: '75 min' }, s.minutes)}</div>
        <div class="field"><span>Warm-up</span>${radio('warmup', { 0: 'None', 3: '3 min', 5: '5 min', 8: '8 min' }, s.warmup)}</div>
        <label class="toggle-line"><input type="checkbox" name="cardio" ${s.cardio ? 'checked' : ''}> Add a cardio finisher (treadmill, elliptical, stairs, bike)</label>
        <div class="field"><span>Injuries or limitations <small>(exercises that load these are avoided)</small></span>${checks('injuries', INJURIES, s.injuries || [])}</div>
        <div class="field"><span>Extra focus <small>(adds exercises for these)</small></span>${checks('focus', FOCUS, s.focus || [])}</div>`;
  const colour = `<div class="field"><span>Colour</span><div class="colors">${COLORS.map((c, i) => `<label><input type="radio" name="color" value="${c}" ${i === profileList().length % COLORS.length ? 'checked' : ''}><i style="background:${c}"></i></label>`).join('')}</div></div>`;
  const buttons = mode === 'new' ? `<button class="btn primary big" data-act="create-profile">Build my plan</button>`
    : mode === 'custom' ? `<button class="btn primary big" data-act="save-profile" data-mode="custom" data-rebuild="1">Build my custom plan</button>
                  <button class="btn" data-act="save-profile" data-mode="custom">Save without changing the plan</button>`
    : `<button class="btn primary big" data-act="save-profile" data-mode="edit" data-rebuild="1">Save & rebuild plan</button>
                  <button class="btn" data-act="save-profile" data-mode="edit">Save without changing the plan</button>`;
  return `<form id="pform" class="form" data-act-submit>
        ${mode !== 'custom' ? personal : ''}
        ${mode !== 'edit' ? planFields : ''}
        ${mode === 'new' ? colour : ''}
        ${buttons}
      </form>`;
}

export function onboardView(edit) {
  const first = !profileList().length;
  return {
    full: first,
    html: `<header class="bar">${first ? '<span></span>' : `<button class="iconbtn" data-act="back">${icon.back}</button>`}<h2>${edit ? 'Edit profile' : first ? 'Welcome 👋' : 'New profile'}</h2><span></span></header>
      ${first ? '<p class="lead">Let\'s build your personal plan. You can add more profiles afterwards, for example for a partner.</p><p class="muted small">This app gives general fitness guidance, not medical advice. If you have an injury or a health condition, or haven\'t trained for a long time, check with a doctor or physiotherapist first. Stop any exercise that hurts.</p>' : ''}
      ${profileForm(edit ? 'edit' : 'new')}
      ${edit ? '<p class="muted small">Exercises per day, muscle areas, session length, warm-up, cardio, injuries and extra focus are under Profile → Build your custom plan.</p>' : ''}`,
  };
}

export function customPlanView() {
  const p = profile();
  return {
    html: `<header class="bar"><button class="iconbtn" data-act="back">${icon.back}</button><h2>Build your custom plan</h2><span></span></header>
      <p class="muted small">Choose how each of your ${p.stats.days || 3} workout days looks. Change the number of days under Edit profile.</p>
      ${profileForm('custom')}`,
  };
}

// Reads only the fields that are on the form, so the edit and custom-plan screens each change their own part.
function readForm() {
  const f = document.getElementById('pform');
  if (!f.reportValidity()) return null;
  const fd = new FormData(f);
  const has = (n) => !!f.querySelector(`[name="${n}"]`);
  const stats = {};
  if (has('age')) Object.assign(stats, { sex: fd.get('sex'), age: +fd.get('age'), height: +fd.get('height'), weight: +fd.get('weight'), level: fd.get('level'), goal: fd.get('goal'), days: +fd.get('days') });
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
    toast(`Plan ready, ${p.name}!`);
    location.hash = '#/plan';
    // A new user gets the app tour once, right after making their first profile.
    if (first && !state.settings.tourDone) setTimeout(() => startTour(), 600);
  },
  'save-profile': (el) => {
    const d = readForm(); if (!d) return;
    const p = profile();
    if (d.name) p.name = d.name;
    const oldW = p.stats.weight;
    if (el.dataset.rebuild && p.plan && Object.keys(p.plan.done).length && !confirm('Rebuilding restarts your plan at week 1 (history is kept). Continue?')) return;
    p.stats = { ...p.stats, ...d.stats };
    if (d.stats.weight && d.stats.weight !== oldW) p.bodyweight.push({ date: today(), kg: d.stats.weight });
    if (el.dataset.rebuild) p.plan = generatePlan(p);
    else applyDayChanges(p);
    touchProfile(p); scheduleSync();
    toast('Saved'); location.hash = el.dataset.rebuild ? '#/plan' : '#/profile';
  },
});

// ───────────── Profile & settings ─────────────
export function profileView() {
  const p = profile();
  const s = p.stats;
  const st = state.settings;
  const last = st.lastSync ? new Date(st.lastSync).toLocaleString('en-GB') : 'never';
  return {
    html: `<header class="top"><h1>Profile</h1></header>
      <div class="card me"><span class="avatar lg" style="--c:${p.color}">${esc(p.name[0])}</span>
        <div><b>${esc(p.name)}</b><small>${s.age} y · ${s.height} cm · ${fmtKg(s.weight)} kg · ${esc(LEVELS[s.level])}</small>
        <small>${esc(GOALS[s.goal].name)} · ${s.days} days × ${s.minutes} min</small></div></div>
      <div class="card list">
        <a class="eqrow" href="#/onboard/edit"><span>Edit profile</span>${icon.chev}</a>
        <a class="eqrow" href="#/custom"><span>Build your custom plan</span>${icon.chev}</a>
        <button class="eqrow" data-act="tpl-open"><span>Ready-made plans (beginner, 50+)</span>${icon.chev}</button>
        <button class="eqrow" data-act="switch-profile"><span>Switch profile</span><span class="muted">${profileList().length} profiles ${icon.chev}</span></button>
        <a class="eqrow" href="#/onboard"><span>Add a profile</span>${icon.plus}</a>
        <a class="eqrow" href="#/gym"><span>Gym setup</span>${icon.chev}</a>
        <button class="eqrow" data-act="tour-start"><span>Take the app tour</span>${icon.chev}</button>
      </div>

      <h3>Appearance</h3>
      <div class="seg-ctl theme-ctl">${[['auto', 'Auto'], ['light', '☀️ Light'], ['dark', '🌙 Dark']].map(([k, v]) =>
        `<label><input type="radio" name="theme" value="${k}" ${(st.theme || 'auto') === k ? 'checked' : ''} data-change="set-theme"><span>${v}</span></label>`).join('')}</div>
      <p class="muted small">Auto follows your phone's setting.</p>

      <h3>Workout</h3>
      <div class="card list">
        <label class="eqrow"><span>Beep when rest ends</span><input type="checkbox" class="switch" ${st.sound ? 'checked' : ''} data-change="set-flag" data-k="sound"></label>
        <button class="eqrow" data-act="test-beep"><span>Test the beep</span><span class="muted">🔊</span></button>
      </div>
      <p class="muted small">The screen stays on during a workout so the timer can beep. Turn the phone's volume up and silent mode off.</p>

      <h3>Sync with Google Sheets</h3>
      <div class="card">
        <p class="muted small">Backs up all profiles and the gym setup to your own Google Sheet, and keeps your phones in sync. Set-up steps are in the README.</p>
        <label class="field"><span>Apps Script web app URL</span><input id="syncUrl" value="${esc(st.syncUrl)}" placeholder="https://script.google.com/macros/s/…/exec"></label>
        <label class="field"><span>Secret key (same as in the script)</span><input id="syncKey" value="${esc(st.syncKey)}" placeholder="your shared secret"></label>
        <div class="btnrow"><button class="btn" data-act="save-sync">Save</button><button class="btn primary" data-act="sync-now" ${syncEnabled() ? '' : 'disabled'}>${icon.sync} Sync now</button></div>
        <p class="muted small">Last sync: ${esc(last)}${st.lastSyncError ? ` · <span class="warn">${esc(st.lastSyncError)}</span>` : ''}</p>
        <label class="toggle-line"><input type="checkbox" ${st.aiEnabled ? 'checked' : ''} data-change="set-flag" data-k="aiEnabled"> Experimental: AI machine recognition (needs a Claude API key in the script)</label>
      </div>

      <h3>Backup</h3>
      <div class="card btnrow">
        <button class="btn" data-act="export">Export file</button>
        <label class="btn">Import file<input type="file" accept="application/json" hidden data-change="import"></label>
      </div>
      <button class="btn ghost danger" data-act="del-profile">Delete ${esc(p.name)}'s profile</button>
      <h3>About</h3>
      <div class="card"><p class="muted small">Your data stays on this phone. Nothing is sent anywhere unless you set up Google Sheets sync, which sends it only to your own sheet.</p>
        <p class="muted small">This app gives general fitness guidance, not medical advice. If you have an injury or a health condition, check with a doctor or physiotherapist before you start. Stop any exercise that hurts.</p></div>
      <p class="muted small center">Rep12 · v1.0</p>`,
  };
}

register({
  'set-flag': (el) => { state.settings[el.dataset.k] = el.checked; save(); },
  'set-theme': (el) => { setTheme(el.value); },
  'save-sync': () => {
    state.settings.syncUrl = document.getElementById('syncUrl').value.trim();
    state.settings.syncKey = document.getElementById('syncKey').value.trim();
    save(true); toast('Saved'); rerender();
  },
  'sync-now': async () => {
    toast('Syncing…');
    try { const r = await syncNow(); toast(r.skipped ? 'Offline or not set up' : `Synced · ${r.pulled} updated, ${r.pushed} sent`); }
    catch (e) { toast('Sync failed: ' + e.message); }
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
      if (!data.profiles) throw new Error('Not a backup file from this app');
      if (!confirm('Replace all data on this phone with the backup?')) return;
      data.settings = { ...data.settings, ...state.settings };
      replaceState(data); toast('Backup restored'); location.hash = '#/plan'; rerender();
    } catch (e) { toast('Import failed: ' + e.message); }
  },
  'del-profile': () => {
    const p = profile();
    if (!confirm(`Delete ${p.name}'s profile and all their history from this phone? This cannot be undone.`)) return;
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
  const volume = Math.round(h.reduce((a, r) => a + r.items.reduce((b, it) => b + it.sets.reduce((c, x) => c + (it.unit === 'reps' ? x.reps * x.kg : 0), 0), 0), 0));

  // Workouts per week, last 8 weeks.
  const weekStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = thisWeek - (7 - i) * 7 * 864e5;
    const n = h.filter(r => r.date >= start && r.date < start + 7 * 864e5).length;
    return { label: new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric' }), y: n };
  });

  // Exercises with history.
  const exIds = [...new Set(h.flatMap(r => r.items.filter(it => it.unit === 'reps').map(it => it.exId)))]
    .sort((a, b) => (exById(b)?.load ? 1 : 0) - (exById(a)?.load ? 1 : 0));
  if (!progEx || !exIds.includes(progEx)) progEx = exIds[0] || null;
  const ex = progEx && exById(progEx);
  const exPts = progEx ? h.flatMap(r => r.items.filter(it => it.exId === progEx).map(it => {
    const best = it.sets.reduce((m, s) => Math.max(m, ex?.load ? (s.kg || 0) * (1 + (s.reps || 0) / 30) : s.reps || 0), 0);
    return { x: r.date, y: Math.round(best * 10) / 10 };
  })) : [];

  const bw = p.bodyweight.map(b => ({ x: new Date(b.date).getTime(), y: b.kg }));

  return {
    html: `<header class="top"><h1>Progress</h1></header>
      <div class="statrow">
        <div class="stat"><b>${h.length}</b><small>Workouts</small></div>
        <div class="stat"><b>${h.filter(r => r.date > monthAgo).length}</b><small>Last 30 days</small></div>
        <div class="stat"><b>${volume >= 10000 ? Math.round(volume / 1000) + 't' : volume}</b><small>kg lifted</small></div>
      </div>
      <h3>Workouts per week</h3>
      <div class="card">${barChart(weeks)}</div>

      <h3>Strength</h3>
      <div class="card">
        ${exIds.length ? `<select class="selectline" data-change="prog-ex">${exIds.map(id => `<option value="${id}" ${id === progEx ? 'selected' : ''}>${esc(exById(id)?.name || id)}</option>`).join('')}</select>
        ${lineChart(exPts, { unit: ex?.load ? ' kg' : '' })}
        <p class="muted small">${ex?.load ? 'Estimated 1-rep max from your best set (Epley formula).' : 'Best reps per session.'}</p>` : '<p class="muted">Log a workout to see your strength trends.</p>'}
      </div>

      <h3>Body weight</h3>
      <div class="card">${lineChart(bw, { unit: ' kg' })}
        <div class="btnrow"><input id="bwIn" type="number" inputmode="decimal" step="0.1" placeholder="Today's weight (kg)"><button class="btn" data-act="add-bw">Add</button></div>
      </div>

      <h3>History</h3>
      <div class="card list">${h.length ? [...h].reverse().slice(0, 40).map(r => `<a class="eqrow" href="#/summary/${r.id}"><span><b>${esc(r.title)}</b><small>${fmtDate(r.date)} · ${Math.round(r.duration / 60)} min · ${r.items.length} exercises</small></span>${icon.chev}</a>`).join('') : '<p class="muted">No workouts yet.</p>'}</div>`,
  };
}

register({
  'prog-ex': (el) => { progEx = el.value; rerender(); },
  'add-bw': () => {
    const v = +document.getElementById('bwIn').value;
    if (!v || v < 30 || v > 250) return toast('Enter a weight in kg');
    const p = profile();
    const t = today();
    p.bodyweight = p.bodyweight.filter(b => b.date !== t);
    p.bodyweight.push({ date: t, kg: v });
    p.bodyweight.sort((a, b) => a.date.localeCompare(b.date));
    p.stats.weight = v;
    touchProfile(p); scheduleSync(); rerender(); toast('Weight saved');
  },
});
