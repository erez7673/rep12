// App state, persisted to localStorage. Profiles and gym are synced to Google Sheets (see sync.js).
import { EXERCISES } from './exercises.js';
import { EQUIPMENT } from './equipment.js';

const KEY = 'fressi.v1'; // old app name; kept so existing data on phones is not lost

const blank = () => ({
  v: 1,
  activeProfile: null,
  profiles: {},
  gym: { enabled: {}, machines: [], customEx: [], home: {}, updatedAt: 0 },
  settings: { syncUrl: '', syncKey: '', sound: true, theme: 'auto', lastSync: 0 },
  session: null,
});

export let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch (e) { console.warn('load failed', e); }
  return blank();
}

let saveTimer = null;
export function save(now = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { alert('Could not save – phone storage may be full. Try removing machine photos.'); }
  };
  if (now) write(); else saveTimer = setTimeout(write, 150);
}
window.addEventListener('pagehide', () => save(true));

export function replaceState(next) { state = { ...blank(), ...next }; save(true); }

export const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Profiles ──
export const profile = () => state.profiles[state.activeProfile] || null;
export const profileList = () => Object.values(state.profiles).sort((a, b) => a.createdAt - b.createdAt);

export function touchProfile(p = profile()) { if (p) { p.updatedAt = Date.now(); save(); } }
export function touchGym() { state.gym.updatedAt = Date.now(); save(); }

export function createProfile(data) {
  const id = uid('p');
  state.profiles[id] = {
    id, createdAt: Date.now(), updatedAt: Date.now(),
    name: data.name, color: data.color || '#2f7cf6',
    stats: data.stats, plan: null, history: [], bodyweight: [],
  };
  if (data.stats.weight) state.profiles[id].bodyweight.push({ date: today(), kg: data.stats.weight });
  state.activeProfile = id;
  save();
  return state.profiles[id];
}

// ── Equipment & exercises ──
export function eqOn(id) {
  if (id === 'none') return true;
  if (id in state.gym.enabled) return state.gym.enabled[id];
  const m = state.gym.machines.find(x => x.id === id);
  if (m) return m.on !== false;
  const e = EQUIPMENT.find(x => x.id === id);
  return e ? e.on : false;
}

// Where a workout day is done: undefined = the gym (Gym Setup), 'home' = Home equipment, 'bare' = body weight only.
export function eqAt(id, at) {
  if (!at) return eqOn(id);
  if (id === 'none') return true;
  return at === 'home' && !!state.gym.home?.[id];
}

export function isAvailable(ex, at) {
  return ex.eq.split('|').some(alt => alt.split('+').every(id => eqAt(id, at)));
}

export function allExercises() { return [...EXERCISES, ...state.gym.customEx]; }

const exCache = new Map();
export function exById(id) {
  return EXERCISES.find(e => e.id === id) || state.gym.customEx.find(e => e.id === id) || exCache.get(id) || null;
}

// Photo of a machine linked to this exercise (if the user photographed one).
export function photoFor(exId) {
  const m = state.gym.machines.find(x => x.photo && (x.exerciseIds || []).includes(exId));
  return m ? m.photo : null;
}

// ── History helpers ──
export function lastLogFor(p, exId) {
  for (let i = p.history.length - 1; i >= 0; i--) {
    const item = p.history[i].items.find(it => it.exId === exId && it.sets.some(s => s.done));
    if (item) return { session: p.history[i], item };
  }
  return null;
}

export function today() { return new Date().toISOString().slice(0, 10); }
