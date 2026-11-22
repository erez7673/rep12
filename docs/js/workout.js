// Active workout engine: set timer, rest timer, beeps and screen wake lock.
// Times are stored as timestamps so the timers stay correct if the phone locks or the app reloads.
import { state, save, profile, touchProfile } from './store.js';

let audio = null;
let wakeLock = null;

export function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch (e) { /* no audio */ }
}

export function beep(times = 3) {
  if (!state.settings.sound || !audio) return;
  for (let i = 0; i < times; i++) {
    const o = audio.createOscillator(), g = audio.createGain();
    const t = audio.currentTime + i * 0.3;
    o.frequency.value = i === times - 1 ? 1320 : 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(audio.destination);
    o.start(t); o.stop(t + 0.25);
  }
}

export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* not supported */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.session?.startedAt && !state.session.finishedAt) keepAwake(true);
});

// ── Session control ──
export const S = () => state.session;

export function start(session) {
  unlockAudio();
  session.startedAt = Date.now();
  session.cur = { i: firstOpen(session), s: 0 };
  session.cur.s = firstOpenSet(session.items[session.cur.i]);
  session.phase = 'work';
  session.workStart = Date.now();
  session.paused = null;
  session.pausedTotal = 0;
  state.session = session;
  save(true);
  keepAwake(true);
}

function firstOpen(s) { const i = s.items.findIndex(it => it.sets.some(x => !x.done)); return i < 0 ? 0 : i; }
function firstOpenSet(it) { const i = it ? it.sets.findIndex(x => !x.done) : 0; return i < 0 ? 0 : i; }

export function elapsed(s = S()) {
  if (!s?.startedAt) return 0;
  const end = s.finishedAt || s.paused || Date.now();
  return (end - s.startedAt - (s.pausedTotal || 0)) / 1000;
}

export function workElapsed(s = S()) {
  if (!s || s.phase !== 'work') return 0;
  return ((s.paused || Date.now()) - s.workStart) / 1000;
}

export function restLeft(s = S()) {
  if (!s || s.phase !== 'rest') return 0;
  return ((s.restEnd - (s.paused || Date.now())) / 1000);
}

export function togglePause() {
  const s = S();
  if (!s) return;
  if (s.paused) {
    const d = Date.now() - s.paused;
    s.pausedTotal += d;
    if (s.phase === 'rest') s.restEnd += d;
    if (s.phase === 'work') s.workStart += d;
    s.paused = null;
  } else s.paused = Date.now();
  save();
}

// Log the current set with the given reps / kg, then start resting.
export function logSet(i, si, reps, kg) {
  const s = S();
  const it = s.items[i];
  const set = it.sets[si];
  set.reps = reps; set.kg = kg; set.done = true; set.at = Date.now();
  if (s.paused) togglePause();
  const next = nextPointer(s, i, si);
  if (!next) { s.phase = 'ready'; s.cur = { i, s: si }; save(); return 'finished'; }
  s.cur = next;
  s.phase = 'rest';
  s.restTotal = it.rest;
  s.restEnd = Date.now() + it.rest * 1000;
  s.restFired = false; s.rest10 = false;
  save();
  return 'rest';
}

export function unlogSet(i, si) {
  const s = S();
  s.items[i].sets[si].done = false;
  save();
}

function nextPointer(s, i, si) {
  for (let a = i; a < s.items.length; a++) {
    const it = s.items[a];
    for (let b = (a === i ? si + 1 : 0); b < it.sets.length; b++) if (!it.sets[b].done) return { i: a, s: b };
  }
  for (let a = 0; a < s.items.length; a++) {
    const b = s.items[a].sets.findIndex(x => !x.done);
    if (b >= 0) return { i: a, s: b };
  }
  return null;
}

export function addRest(sec) {
  const s = S();
  if (s?.phase !== 'rest') return;
  s.restEnd += sec * 1000;
  s.restTotal = Math.max(5, (s.restTotal || 0) + sec);
  save();
}

export function skipRest() {
  const s = S();
  if (!s) return;
  s.phase = 'work';
  s.workStart = Date.now(); s.holdFired = false;
  save();
}

export function jumpTo(i, si) {
  const s = S();
  s.cur = { i, s: si };
  if (s.phase !== 'rest') { s.phase = 'work'; s.workStart = Date.now(); s.holdFired = false; }
  save();
}

// Called every tick by the UI. Returns 'rest-done' once when the rest timer runs out.
export function tick() {
  const s = S();
  if (!s || s.paused || s.finishedAt) return null;
  if (s.phase === 'rest' && restLeft(s) <= 0 && !s.restFired) {
    s.restFired = true;
    s.phase = 'work';
    s.workStart = Date.now(); s.holdFired = false;
    save();
    beep(3);
    return 'rest-done';
  }
  if (s.phase === 'rest' && !s.rest10 && s.restTotal > 20 && restLeft(s) <= 10) { s.rest10 = true; return 'rest-10'; }
  const it = s.items[s.cur?.i];
  if (s.phase === 'work' && it?.unit === 'sec') {
    const target = it.sets[s.cur.s]?.reps || 30;
    if (workElapsed(s) >= target && !s.holdFired) { s.holdFired = true; beep(2); return 'hold-done'; }
  }
  return null;
}

// Timed cardio blocks: k = 'warm' (warm-up machine) or 'cardio' (finisher).
export function startTimer(k) {
  const c = S()?.[k];
  if (!c) return;
  unlockAudio();
  c.endAt = Date.now() + c.min * 60000; c.fired = false; c.done = false;
  save();
}

export function timerDone(k) {
  const s = S(), c = s?.[k];
  if (!c) return;
  c.endAt = null; c.done = true;
  // After the warm-up, restart the set timer so it counts from the first real set.
  if (k === 'warm' && s.phase === 'work' && !s.items.some(it => it.sets.some(x => x.done))) s.workStart = Date.now();
  save();
}

export function finish() {
  const s = S();
  const p = state.profiles[s.profileId] || profile();
  s.finishedAt = Date.now();
  s.duration = Math.round(elapsed(s));
  const record = {
    id: s.id, planId: s.planId, week: s.week, dayIdx: s.dayIdx, title: s.title, focus: s.focus,
    date: s.startedAt, duration: s.duration,
    cardio: s.cardio && s.cardio.done ? { exId: s.cardio.exId, min: s.cardio.min } : null,
    items: s.items.map(it => ({ exId: it.exId, name: it.name, unit: it.unit, target: it.target, sets: it.sets.filter(x => x.done).map(x => ({ reps: x.reps, kg: x.kg, done: true })) }))
      .filter(it => it.sets.length),
  };
  if (p && p.id === s.profileId) {
    p.history.push(record);
    if (p.plan && p.plan.id === s.planId && s.week) p.plan.done[`${s.week}-${s.dayIdx}`] = s.id;
    touchProfile(p);
  }
  state.session = null;
  save(true);
  keepAwake(false);
  return record;
}

export function discard() {
  state.session = null;
  save(true);
  keepAwake(false);
}
