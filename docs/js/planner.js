// Builds a multi-week plan from a profile, and works out each session's sets, reps and weights.
import { MUSCLES, WARMUP, COOLDOWN } from './exercises.js';
import { allExercises, isAvailable, exById, lastLogFor, uid } from './store.js';
import { t, wStep, fmtW, listJoin } from './i18n.js';

export const PLAN_WEEKS = 12;
export const EX_PER_DAY = 4;   // default exercises per workout day (not counting warm-up and cardio finisher)
export const MAX_EX_PER_DAY = 8;
export const exPerDay = (st) => Math.max(1, Math.min(MAX_EX_PER_DAY, st?.exPerDay || EX_PER_DAY)); // the profile's choice, 1–8
// Exercises per workout day. An app-built plan (TEMPLATES) uses its own number, raised when the user adds extra exercises (plan.cap).
export const dayCap = (p) => {
  const tpl = TEMPLATES[p.plan?.template];
  return tpl ? Math.min(MAX_EX_PER_DAY, Math.max(tpl.perDay, p.plan.cap || 0)) : exPerDay(p.stats);
};
// Raises the number of exercises per day to n (max MAX_EX_PER_DAY), for an app-built or a custom plan.
export function raiseDayCap(p, n) {
  n = Math.min(MAX_EX_PER_DAY, n);
  if (n <= dayCap(p)) return;
  if (TEMPLATES[p.plan?.template]) p.plan.cap = n;
  else p.stats.exPerDay = n;
}
export const SETS = 4;         // sets per exercise
const PLAN_FMT = 3;            // bump when the plan shape changes (see upgradePlan)

export const dayName = (i) => t('Workout Day {x}', { x: 'ABCDEFG'[i] || i + 1 });
const planName = (st) => `${GOALS[st.goal]?.name || t('Training')} · ${t('{n} days a week', { n: st.days || 3 })}`;
// The plan's name in the current language (the stored name is in the language it was made in).
export const planTitle = (plan) => plan.template ? (TEMPLATES[plan.template]?.name || plan.name)
  : `${GOALS[plan.goal]?.name || t('Training')} · ${t('{n} days a week', { n: plan.days.length })}`;

// Muscle areas the user can pick for a workout day. pats: plan slots, taken in order.
export const AREAS = {
  chest: { name: 'Chest', pats: ['h-push', 'chest-iso', 'h-push', 'chest-iso'] },
  back: { name: 'Back', pats: ['v-pull', 'h-pull', 'h-pull', 'v-pull'] },
  shoulders: { name: 'Shoulders', pats: ['v-push', 'side-delt', 'rear-delt', 'side-delt'] },
  biceps: { name: 'Biceps', pats: ['biceps', 'biceps', 'biceps'] },
  triceps: { name: 'Triceps', pats: ['triceps', 'triceps', 'triceps'] },
  legs: { name: 'Legs', pats: ['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso'] },
  glutes: { name: 'Glutes', pats: ['glute', 'hinge', 'glute', 'lunge'] },
  calves: { name: 'Calves', pats: ['calf', 'calf'] },
  core: { name: 'Core / abs', pats: ['core', 'core', 'core'] },
};

// Muscle area of an exercise's main muscle, and the order areas are trained in a day (bigger muscles first).
const MUSCLE_AREA = {
  quads: 'legs', hamstrings: 'legs', adductors: 'legs', glutes: 'glutes', back: 'back', traps: 'back',
  chest: 'chest', shoulders: 'shoulders', 'rear-delts': 'shoulders', triceps: 'triceps', biceps: 'biceps',
  forearms: 'biceps', calves: 'calves', core: 'core',
};
export const AREA_ORDER = ['legs', 'glutes', 'back', 'chest', 'shoulders', 'triceps', 'biceps', 'calves', 'core'];
export const areaOfEx = (ex) => MUSCLE_AREA[ex?.m] || null;

// The muscle area an item of a day counts for: one of the day's chosen areas if it fits, else its main muscle's.
export function itemArea(day, it) {
  const ex = exById(it.exId);
  const own = areaOfEx(ex);
  const chosen = day?.muscles || [];
  if (own && chosen.includes(own)) return own;
  return chosen.find(a => AREAS[a]?.pats.includes(it.pat || ex?.pat)) || own || 'core';
}

// Puts a day's exercises in training order: bigger muscle areas first, and within an area compound lifts first.
// A day the user has put in their own order (day.manual) is left as it is.
export function sortDay(day) {
  if (day.manual) return false;
  const rank = (it) => {
    const a = AREA_ORDER.indexOf(itemArea(day, it));
    return (a < 0 ? 99 : a) * 2 + (exById(it.exId)?.iso ? 1 : 0);
  };
  const before = day.items.map(i => i.exId).join();
  day.items = day.items.map((it, k) => [it, k]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map(x => x[0]);
  return day.items.map(i => i.exId).join() !== before;
}

export const GOALS = {
  hypertrophy: { name: 'Build muscle', compound: { sets: 3, reps: [8, 10], rest: 90 }, iso: { sets: 3, reps: [10, 12], rest: 60 }, cardio: 0, factor: 1 },
  strength: { name: 'Strength', compound: { sets: 4, reps: [4, 6], rest: 150 }, iso: { sets: 3, reps: [8, 10], rest: 90 }, cardio: 0, factor: 1.1 },
  fatloss: { name: 'Lose fat / tone', compound: { sets: 3, reps: [10, 12], rest: 60 }, iso: { sets: 3, reps: [12, 15], rest: 45 }, cardio: 15, factor: 0.85 },
  general: { name: 'General fitness', compound: { sets: 3, reps: [8, 12], rest: 75 }, iso: { sets: 2, reps: [10, 15], rest: 60 }, cardio: 10, factor: 0.9 },
};

// ── App-built plans (TEMPLATES) ──
// Full-body plans: machines first, 4–6 exercises a day, 2–3 sets of 10–15 reps (TPL_RX), light start
// and slow progression. Each slot lists exercises in order of preference; the first one that is on in
// Gym Setup (and safe for the profile's injuries) is used.
// Split plans (AB, Upper / Lower) instead give each day muscle areas (areas) and follow the profile's goal (goalRx).
const TPL_DAYS = {
  fullA: [['leg-press', 'goblet-squat', 'smith-squat'], ['machine-chest-press', 'plate-chest-press', 'db-bench', 'pushup'],
    ['machine-row', 'seated-cable-row', 'plate-row', 'db-row'], ['glute-bridge', 'hip-thrust-machine'], ['db-lateral', 'cable-lateral'], ['plank', 'dead-bug']],
  fullB: [['goblet-squat', 'leg-press', 'sumo-squat'], ['lat-pulldown', 'close-pulldown', 'assisted-chin'],
    ['machine-shoulder-press', 'db-shoulder-press', 'smith-ohp'], ['db-rdl', 'back-ext', 'cable-pull-through'], ['leg-curl'], ['side-plank', 'dead-bug']],
  fullC: [['stepup', 'reverse-lunge', 'split-squat'], ['db-bench', 'machine-chest-press', 'pushup'],
    ['seated-cable-row', 'machine-row', 'db-row'], ['back-ext', 'glute-bridge'], ['abductor', 'cable-kickback'], ['dead-bug', 'plank']],
  // Short days: 4 exercises – legs, a push, a pull and hips/core – so each session is about 30 minutes.
  shortA: [['leg-press', 'goblet-squat', 'smith-squat'], ['machine-chest-press', 'plate-chest-press', 'db-bench', 'pushup'],
    ['machine-row', 'seated-cable-row', 'plate-row', 'db-row'], ['plank', 'dead-bug']],
  shortB: [['goblet-squat', 'leg-press', 'sumo-squat'], ['machine-shoulder-press', 'db-shoulder-press', 'smith-ohp'],
    ['lat-pulldown', 'close-pulldown', 'assisted-chin'], ['glute-bridge', 'hip-thrust-machine']],
  shortC: [['stepup', 'reverse-lunge', 'split-squat'], ['db-bench', 'machine-chest-press', 'pushup'],
    ['seated-cable-row', 'machine-row', 'db-row'], ['back-ext', 'db-rdl', 'glute-bridge']],
};

const AB_A = ['chest', 'biceps', 'back'], AB_B = ['shoulders', 'triceps', 'legs'];
const UP_AREAS = ['chest', 'back', 'shoulders', 'biceps', 'triceps'], LOW_AREAS = ['legs', 'glutes', 'calves', 'core'];
export const TEMPLATES = {
  starter: { name: 'Gentle start · 2 days a week', short: '2 days a week', days: ['fullA', 'fullB'], perDay: 6,
    blurb: 'The softest way in: two full-body days with a rest day or two between. Move up to 3 days when it feels easy.' },
  steady: { name: 'Full body · 3 days a week', short: '3 days a week', days: ['fullA', 'fullB', 'fullC'], perDay: 6,
    blurb: 'Three full-body days (for example Mon, Wed, Fri). Every muscle group is trained twice or more a week.' },
  short: { name: 'Short full body · 3 days a week', short: '3 short days a week', days: ['shortA', 'shortB', 'shortC'], perDay: 4,
    blurb: 'Three full-body days with only 4 exercises each – legs, a push, a pull and hips or core – so a session takes about 35–40 minutes with warm-up and cooldown.' },
  ab: { name: 'AB Plan · 4 days a week', short: '4 days a week', days: ['abA', 'abB', 'abA', 'abB'], perDay: 6, goalRx: true,
    areas: [AB_A, AB_B, AB_A, AB_B],
    blurb: 'Two workouts in turn, three muscle areas each: A is chest, biceps and back, B is shoulders, triceps and legs. Every area is trained twice a week. Sets and reps follow your goal.' },
  upperlower: { name: 'Upper / Lower · 4 days a week', short: '4 days a week', days: ['upper', 'lower', 'upper', 'lower'], perDay: 6, goalRx: true,
    areas: [UP_AREAS, LOW_AREAS, UP_AREAS, LOW_AREAS],
    blurb: 'Upper body and lower body days in turn: chest, back, shoulders and arms, then legs, glutes, calves and core. Every area is trained twice a week. Sets and reps follow your goal.' },
};
// The app-built plan that uses the gentle sets and reps of TPL_RX (null for split plans, which follow the goal).
export const tplRx = (plan) => (plan?.template && TEMPLATES[plan.template] && !TEMPLATES[plan.template].goalRx) ? plan.template : null;

// Sets, reps and rest per phase of a full-body app-built plan (bodyweight holds: seconds instead of reps).
const TPL_RX = {
  base: { sets: 2, reps: [12, 15], rest: 60, hold: [20, 30] },
  build: { sets: 3, reps: [10, 12], rest: 60, hold: [25, 40] },
  peak: { sets: 3, reps: [8, 10], rest: 75, hold: [30, 45] },
  deload: { sets: 2, reps: [10, 12], rest: 60, hold: [20, 30] },
};

// A short human summary of a full-body app-built plan's phases, for the info sheets.
export const TPL_PHASES = [
  ['Weeks 1–4', '2 sets × 12–15 reps, light weights. Learn the movements.'],
  ['Weeks 5–8', '3 sets × 10–12 reps. A bit more weight when all reps feel good.'],
  ['Weeks 9–11', '3 sets × 8–10 reps, heavier. Stay in control.'],
  ['Week 12', '2 sets × 10–12 reps, lighter. Recover.'],
];

export const templateExNames = (key, di) => (TPL_DAYS[TEMPLATES[key].days[di]] || []).map(alts => exById(alts[0])?.name).filter(Boolean);
// What a day of an app-built plan trains, for the plan list: its muscle areas, or its main exercises.
export const templateDayText = (key, di) => {
  const a = TEMPLATES[key].areas?.[di];
  return listJoin(a ? a.map(k => AREAS[k]?.name).filter(Boolean) : templateExNames(key, di));
};

function resolveSlot(st, ids, taken) {
  const inj = st.injuries || [], no = st.dislikes || [];
  for (const id of ids) {
    const e = exById(id);
    if (e && isAvailable(e) && !taken.includes(id) && !no.includes(id) && !e.avoid.some(a => inj.includes(a))) return e;
  }
  const pat = exById(ids[0])?.pat;
  return pat ? candidates({ ...st, level: 'beginner' }, pat, taken)[0] || null : null;
}

export function generateTemplatePlan(p, key) {
  const tpl = TEMPLATES[key], st = p.stats;
  const used = new Map();
  const days = tpl.days.map((dk, di) => {
    // Muscle areas the user picked for this day in the profile replace the plan's own exercises or areas.
    const own = (st.dayAreas?.[di] || []).filter(k => AREAS[k]);
    const muscles = own.length ? own : [...(tpl.areas?.[di] || [])];
    let items = [];
    if (muscles.length) items = itemsForAreas(st, muscles, rng(p.id + muscles.join() + di), used, [], tpl.perDay);
    else for (const alts of TPL_DAYS[dk]) {
      const ex = resolveSlot(st, alts, items.map(i => i.exId));
      if (ex) items.push({ exId: ex.id, pat: ex.pat });
    }
    let cardio = null;
    if (st.cardio) {
      const c = resolveSlot(st, ['incline-walk', 'elliptical', 'bike', 'upright-bike'], []);
      if (c) cardio = { exId: c.id, min: 8 };
    }
    const day = { key: dk, name: dayName(di), items, cardio, ...(muscles.length ? { muscles } : {}) };
    sortDay(day);
    return day;
  });
  // Split plans use the goal's sets and rests: shorten the rests (down to 45 s) if the longest day doesn't fit the session length.
  let restScale = 1;
  if (tpl.goalRx) {
    const budget = sessionBudget(st);
    const daySec = (sc) => Math.max(...days.map(d => d.items.reduce((a, it) => a + exerciseSeconds(prescribe(st, exById(it.exId), 1, sc)), 0)));
    while (restScale > 0.3 && daySec(restScale) > budget.lift + 120) restScale = +(restScale - 0.05).toFixed(2);
  }
  return {
    id: uid('plan'), version: (p.plan?.version || 0) + 1, createdAt: Date.now(), fmt: PLAN_FMT,
    name: tpl.name, weeks: PLAN_WEEKS, goal: tpl.goalRx ? st.goal : 'general', days, done: {}, restScale, edits: {}, template: key,
  };
}

export const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const LEVEL_NUM = { beginner: 1, intermediate: 2, advanced: 3 };
const LEVEL_F = { beginner: 0.6, intermediate: 1, advanced: 1.3 };

export const FOCUS = {
  glutes: { name: 'Glutes', pats: ['glute'] },
  legs: { name: 'Legs', pats: ['quad-iso', 'ham-iso'] },
  arms: { name: 'Arms', pats: ['biceps', 'triceps'] },
  chest: { name: 'Chest', pats: ['chest-iso'] },
  back: { name: 'Back', pats: ['h-pull'] },
  shoulders: { name: 'Shoulders', pats: ['side-delt'] },
  core: { name: 'Core / abs', pats: ['core'] },
  calves: { name: 'Calves', pats: ['calf'] },
};

const UPPER = new Set(['h-push', 'v-push', 'h-pull', 'v-pull', 'chest-iso', 'side-delt', 'rear-delt', 'traps', 'biceps', 'triceps']);
const LOWER = new Set(['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso', 'glute', 'adductor', 'calf']);

const DAYS = {
  fullA: { name: 'Full Body A', region: 'all', slots: ['squat', 'h-push', 'h-pull', 'v-push', 'core', 'biceps', 'triceps', 'lunge', 'calf'] },
  fullB: { name: 'Full Body B', region: 'all', slots: ['hinge', 'v-pull', 'h-push', 'lunge', 'side-delt', 'core', 'glute', 'triceps', 'biceps'] },
  fullC: { name: 'Full Body C', region: 'all', slots: ['squat', 'h-pull', 'v-push', 'glute', 'chest-iso', 'rear-delt', 'core', 'biceps', 'ham-iso'] },
  upperA: { name: 'Upper A', region: 'upper', slots: ['h-push', 'v-pull', 'v-push', 'h-pull', 'chest-iso', 'triceps', 'side-delt', 'core', 'biceps'] },
  upperB: { name: 'Upper B', region: 'upper', slots: ['v-pull', 'h-push', 'h-pull', 'v-push', 'rear-delt', 'biceps', 'triceps', 'core', 'traps'] },
  lowerA: { name: 'Lower A', region: 'lower', slots: ['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso', 'calf', 'core', 'glute'] },
  lowerB: { name: 'Lower B', region: 'lower', slots: ['hinge', 'glute', 'squat', 'lunge', 'ham-iso', 'adductor', 'calf', 'core'] },
  push: { name: 'Push', region: 'push', slots: ['h-push', 'v-push', 'h-push', 'chest-iso', 'side-delt', 'triceps', 'triceps', 'core'] },
  pull: { name: 'Pull', region: 'pull', slots: ['v-pull', 'h-pull', 'h-pull', 'rear-delt', 'biceps', 'biceps', 'traps', 'core'] },
  legs: { name: 'Legs', region: 'lower', slots: ['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso', 'glute', 'calf', 'core'] },
  upper: { name: 'Upper', region: 'upper', slots: ['h-push', 'h-pull', 'v-push', 'v-pull', 'chest-iso', 'biceps', 'triceps', 'core'] },
  lower: { name: 'Lower', region: 'lower', slots: ['hinge', 'squat', 'glute', 'lunge', 'ham-iso', 'quad-iso', 'calf', 'core'] },
};

const SPLITS = {
  2: { name: 'Full Body', days: ['fullA', 'fullB'] },
  3: { name: 'Full Body', days: ['fullA', 'fullB', 'fullC'] },
  4: { name: 'Upper / Lower', days: ['upperA', 'lowerA', 'upperB', 'lowerB'] },
  5: { name: 'Push / Pull / Legs + Upper / Lower', days: ['push', 'pull', 'legs', 'upper', 'lower'] },
  6: { name: 'Push / Pull / Legs ×2', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] },
  7: { name: 'Push / Pull / Legs ×2 + Full Body', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'fullA'] },
};
export const MAX_DAYS = 7;

const PUSH_PATS = new Set(['h-push', 'v-push', 'chest-iso', 'side-delt', 'triceps', 'core']);
const PULL_PATS = new Set(['v-pull', 'h-pull', 'rear-delt', 'biceps', 'traps', 'core']);

function regionAllows(region, pat) {
  if (pat === 'core') return true;
  if (region === 'all') return true;
  if (region === 'upper') return UPPER.has(pat);
  if (region === 'lower') return LOWER.has(pat);
  if (region === 'push') return PUSH_PATS.has(pat);
  if (region === 'pull') return PULL_PATS.has(pat);
  return false;
}

// Small deterministic random so the same profile gets a stable plan.
function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

export function candidates(stats, pat, exclude = []) {
  const lvl = LEVEL_NUM[stats.level] || 1;
  const injuries = stats.injuries || [];
  const dislikes = stats.dislikes || [];
  const base = allExercises().filter(e => e.pat === pat && isAvailable(e) && !exclude.includes(e.id)
    && !dislikes.includes(e.id) && !e.avoid.some(a => injuries.includes(a)));
  const fit = base.filter(e => e.lvl <= lvl);
  return fit.length ? fit : base.filter(e => e.lvl <= lvl + 1);
}

function pick(stats, pat, { exclude, used, rand, compoundFirst }) {
  const list = candidates(stats, pat, exclude);
  if (!list.length) return null;
  const likes = stats.likes || [];
  const beginner = stats.level === 'beginner';
  let best = null, bestScore = -1e9;
  for (const e of list) {
    let s = rand() * 2;
    if (likes.includes(e.id)) s += 10;
    s -= (used.get(e.id) || 0) * 4;
    if (compoundFirst && !e.iso) s += 2;
    if (beginner && ['handles', 'pad-arms', 'pad-legs', 'platform'].includes(e.grip)) s += 2;
    if (e.custom) s += 3; // prefer machines the user added
    if (s > bestScore) { bestScore = s; best = e; }
  }
  used.set(best.id, (used.get(best.id) || 0) + 1);
  return best;
}

export function sessionBudget(stats) {
  const g = GOALS[stats.goal] || GOALS.general;
  const minutes = stats.minutes || 45;
  const warm = stats.warmup ?? 5;
  const cool = 5;
  let cardio = stats.cardio ? (g.cardio || 10) : 0;
  if (minutes <= 30) cardio = Math.min(cardio, 8);
  if (minutes - warm - cool - cardio < 20) cardio = 0; // lifting comes first when time is short
  return { minutes, warm, cool, cardio, lift: Math.max(15, minutes - warm - cool - cardio) * 60 };
}

export function exerciseSeconds(rx) {
  const work = rx.unit === 'sec' ? rx.reps[1] : 40;
  return rx.sets * (work + rx.rest) + 60;
}

export function generatePlan(p) {
  const st = p.stats;
  const split = SPLITS[st.days] || SPLITS[3];
  const used = new Map();
  const budget = sessionBudget(st);
  const focusPats = (st.focus || []).flatMap(f => FOCUS[f]?.pats || []);
  const rand = rng(p.id + st.goal + st.days + (p.plan?.version || 0));

  const days = split.days.map((key, di) => {
    // Muscle areas the user picked for this day (profile first, older plans kept them on the day).
    const muscles = areasFor(p, di);
    const items = muscles.length ? itemsForAreas(st, muscles, rand, used) : autoItems(st, key, focusPats, rand, used);
    let cardio = null;
    if (budget.cardio) {
      const c = pick(st, 'cardio', { exclude: [], used, rand });
      if (c) cardio = { exId: c.id, min: budget.cardio };
    }
    const day = { key, name: dayName(di), items, cardio, ...(muscles?.length ? { muscles } : {}) };
    sortDay(day);
    return day;
  });

  // Sets are fixed, so shorten the rests (down to 45 s) if the longest day doesn't fit the session length.
  let restScale = 1;
  const daySec = (sc) => Math.max(...days.map(d => d.items.reduce((a, it) => a + exerciseSeconds(prescribe(st, exById(it.exId), 1, sc)), 0)));
  while (restScale > 0.3 && daySec(restScale) > budget.lift + 120) restScale = +(restScale - 0.05).toFixed(2);

  return {
    id: uid('plan'), version: (p.plan?.version || 0) + 1, createdAt: Date.now(), fmt: PLAN_FMT,
    name: planName(st),
    weeks: PLAN_WEEKS, goal: st.goal, days, done: {}, restScale, edits: {},
  };
}

// The muscle areas chosen for workout day di (empty = the app chooses).
export function areasFor(p, di) {
  const a = p.stats.dayAreas?.[di] ?? p.plan?.days?.[di]?.muscles ?? [];
  return a.filter(k => AREAS[k]);
}

// Default exercises for a day of the split (the day's slots plus the profile's extra focus).
function autoItems(st, key, focusPats, rand, used, keep = [], n = exPerDay(st)) {
  const t = DAYS[key] || DAYS.fullA;
  const slots = [...t.slots];
  // Insert focus slots after the first two big lifts.
  slots.splice(2, 0, ...focusPats.filter(fp => regionAllows(t.region, fp)));
  const items = [...keep];
  for (const pat of slots) {
    if (items.length >= n) break;
    const ex = pick(st, pat, { exclude: items.map(i => i.exId), used, rand, compoundFirst: items.length < 2 });
    if (ex) items.push({ exId: ex.id, pat });
  }
  return items;
}

// Exercises for the chosen muscle areas, taking one from each area in turn.
// e.g. chest + biceps → chest press, curl, chest fly, curl.
function itemsForAreas(st, areas, rand, used, keep = [], n = exPerDay(st)) {
  const fill = () => areas.map(a => [...(AREAS[a]?.pats || [])]);
  let queues = fill();
  const items = [...keep];
  let added = true;
  while (items.length < n && added) {
    added = false;
    // With many exercises a day the area lists run out: start them over, picking other exercises for the same areas.
    if (!queues.some(q => q.length)) queues = fill();
    while (items.length < n && queues.some(q => q.length)) {
      for (const q of queues) {
        if (items.length >= n) break;
        const pat = q.shift();
        if (!pat) continue;
        const ex = pick(st, pat, { exclude: items.map(i => i.exId), used, rand, compoundFirst: items.length < 2 });
        if (ex) { items.push({ exId: ex.id, pat }); added = true; }
      }
    }
  }
  return items;
}

const usedElsewhere = (p, dayIdx) => {
  const used = new Map();
  p.plan.days.forEach((d, i) => { if (i !== dayIdx) d.items.forEach(it => used.set(it.exId, (used.get(it.exId) || 0) + 1)); });
  return used;
};

// Sets the muscle areas of one day (saved in the profile) and picks new exercises for them.
// An empty list means the app chooses again; the day's current exercises are kept.
export function setDayAreas(p, dayIdx, areas, seed = Date.now()) {
  const day = p.plan.days[dayIdx];
  p.stats.dayAreas ||= [];
  p.stats.dayAreas[dayIdx] = [...areas];
  if (areas.length) {
    day.muscles = [...areas];
    day.items = itemsForAreas(p.stats, areas, rng(p.id + areas.join() + seed), usedElsewhere(p, dayIdx), [], dayCap(p));
  } else {
    delete day.muscles;
  }
  delete day.manual; // new exercises: back to the app's order
  fitDay(p, dayIdx);
  sortDay(day);
}

// Makes every workout day follow the muscle areas chosen in the profile, and keeps each day in training order.
// Runs at start-up and after a sync, so it is deterministic (same result on both phones).
export function applyProfileAreas(p) {
  if (!p.plan) return false;
  let changed = false;
  p.plan.days.forEach((day, d) => {
    const want = (p.stats.dayAreas?.[d] || []).filter(k => AREAS[k]);
    if (want.length && want.join() !== (day.muscles || []).join()) { setDayAreas(p, d, want, 'profile' + d); changed = true; }
    if (sortDay(day)) changed = true;
  });
  return changed;
}

// Makes a day have exactly the profile's number of exercises: extra ones are dropped, missing ones are added.
export function fitDay(p, dayIdx) {
  const day = p.plan.days[dayIdx];
  const n = dayCap(p);
  if (day.items.length > n) { day.items = day.items.slice(0, n); return; }
  if (day.items.length === n) return;
  const rand = rng(p.id + dayIdx + Date.now());
  const used = usedElsewhere(p, dayIdx);
  const areas = day.muscles || [];
  day.items = areas.length ? itemsForAreas(p.stats, areas, rand, used, day.items, n)
    : autoItems(p.stats, day.key, (p.stats.focus || []).flatMap(f => FOCUS[f]?.pats || []), rand, used, day.items, n);
  sortDay(day);
}

// Plans made by older versions are moved to the current format; progress (done weeks) and history are kept.
export function upgradePlan(p) {
  if (!p.plan || p.plan.fmt === PLAN_FMT) return false;
  const old = p.plan;
  if (old.fmt === 2) { // same exercises, only the names changed ("Full Body A" → "Workout Day A")
    old.days.forEach((d, i) => { d.name = dayName(i); });
    old.name = planName(p.stats);
    for (const h of p.history || []) if (h.planId === old.id && old.days[h.dayIdx]) h.title = dayName(h.dayIdx);
    old.fmt = PLAN_FMT;
    return true;
  }
  const fresh = generatePlan({ ...p, plan: { version: (old.version || 1) - 1 } });
  p.plan = { ...fresh, id: old.id, version: old.version, createdAt: old.createdAt, done: old.done || {}, ...(old.custom ? { custom: true } : {}) };
  return true;
}

export function dayFocus(day) {
  const names = (day.muscles || []).map(a => AREAS[a]?.name).filter(Boolean);
  if (!names.length) for (const it of day.items) {
    const ex = exById(it.exId);
    if (!ex) continue;
    for (const m of [ex.m]) if (!names.includes(MUSCLES[m])) names.push(MUSCLES[m]);
  }
  if (day.cardio) names.push(MUSCLES.cardio);
  if (names.length <= 1) return names.join('');
  return t('{list} & {last}', { list: listJoin(names.slice(0, -1)), last: names[names.length - 1] });
}

// Phase of the 12-week program.
export function phaseOf(week) {
  if (week >= 12) return { key: 'deload', name: t('Deload week – lighter, recover') };
  if (week >= 9) return { key: 'peak', name: t('Phase 3 · Heavier, fewer reps') };
  if (week >= 5) return { key: 'build', name: t('Phase 2 · More volume') };
  return { key: 'base', name: t('Phase 1 · Learn & build the base') };
}

// A plan saved from "Build your custom plan" keeps the same sets and reps all 12 weeks (no phases, no deload).
// Plans the app builds (new profile, Edit profile → rebuild, app-built plans) step up through the phases.
export const isCustom = (plan) => !!plan?.custom && !plan?.template;
export function planPhase(plan, week) {
  return isCustom(plan) ? { key: 'base', name: t('Custom plan · same sets and reps every week') } : phaseOf(week);
}

// Sets / reps / rest for an exercise in a given week. Always SETS sets; the phases change reps and weight.
export function prescribe(stats, ex, week, restScale = 1, tpl = null, custom = false) {
  if (tpl) {
    const b = TPL_RX[phaseOf(week).key];
    const hold = ex.unit === 'sec';
    return { sets: b.sets, reps: [...(hold ? b.hold : b.reps)], rest: Math.max(45, Math.round((hold ? 45 : b.rest) * restScale / 15) * 15), unit: ex.unit };
  }
  const g = GOALS[stats.goal] || GOALS.general;
  const b = ex.iso ? g.iso : g.compound;
  let reps = [...b.reps], rest = b.rest;
  const ph = custom ? 'base' : phaseOf(week).key;
  if (ph === 'build') reps = reps.map(r => r + (stats.goal === 'strength' ? 1 : 2));
  if (ph === 'peak' && (stats.goal === 'strength' || stats.goal === 'hypertrophy')) reps = reps.map(r => Math.max(3, r - 2));
  if (ex.unit === 'sec') {
    const add = custom ? 0 : Math.min(30, (week - 1) * 3);
    reps = [30 + add, 45 + add];
    rest = 60;
  }
  rest = Math.max(45, Math.round(rest * restScale / 15) * 15);
  return { sets: SETS, reps, rest, unit: ex.unit };
}

// Rounds to the weights a gym has: steps of 2.5 kg (or the exercise's step), or 5 lb in US units.
const round = (v, inc) => { const g = wStep(inc); return Math.max(0, Math.round(v / g) * g); };

export function estimateWeight(stats, ex) {
  if (!ex.load) return 0;
  const bw = stats.weight || 70;
  const sexF = stats.sex === 'female' ? 0.6 : 1;
  const lvlF = LEVEL_F[stats.level] || 1;
  const g = GOALS[stats.goal] || GOALS.general;
  if (ex.assist) {
    const assistF = { beginner: 1.3, intermediate: 1, advanced: 0.6 }[stats.level] || 1;
    return round(bw * ex.load * assistF * (stats.sex === 'female' ? 1.2 : 1), ex.inc);
  }
  return Math.max(ex.inc, round(bw * ex.load * sexF * lvlF * g.factor, ex.inc));
}

// Suggests the weight and reps for the next session based on the last time this exercise was logged.
export function suggest(p, ex, rx, week) {
  const last = lastLogFor(p, ex.id);
  let kg, reps = rx.reps[0], estimated = false, note = '';
  if (!last && p.startKg?.[ex.id] != null) {
    kg = p.startKg[ex.id]; // weight the user set in a day preview before ever logging this exercise
  } else if (!last) {
    kg = estimateWeight(tplRx(p.plan) ? { ...p.stats, level: 'beginner', goal: 'general' } : p.stats, ex);
    estimated = !!ex.load;
    if (estimated) note = t('Starting estimate – tap the sets to change it.');
  } else {
    const done = last.item.sets.filter(s => s.done);
    const lastKg = done.reduce((m, s) => Math.max(m, s.kg || 0), 0);
    const top = (last.item.target?.reps || rx.reps)[1];
    const allTop = done.length >= Math.min(2, last.item.sets.length) && done.every(s => (s.reps || 0) >= top);
    const minReps = Math.min(...done.map(s => s.reps || 0));
    if (allTop && ex.load) {
      kg = ex.assist ? Math.max(0, lastKg - wStep(ex.inc)) : lastKg + wStep(ex.inc);
      note = ex.assist ? t('Less assistance – you hit all reps last time!') : t('+{w} – you hit all reps last time!', { w: fmtW(wStep(ex.inc)) });
      reps = rx.reps[0];
    } else {
      kg = lastKg;
      reps = Math.min(rx.reps[1], Math.max(rx.reps[0], minReps + 1));
      if (!ex.load) reps = Math.min(rx.reps[1] + 5, Math.max(rx.reps[0], minReps + 1));
    }
  }
  if (planPhase(p.plan, week).key === 'deload' && kg) { kg = ex.assist ? kg * 1.15 : round(kg * 0.85, ex.inc); note = t('Deload week – lighter on purpose.'); }
  return { kg: round(kg, ex.inc), reps, estimated, note };
}

// Reps/kg the user typed in the day preview, per week + day + exercise.
export const editKey = (week, dayIdx, exId) => `${week}-${dayIdx}-${exId}`;

// Builds the concrete session (what the workout screen runs) for a plan day.
export function buildSession(p, week, dayIdx) {
  const day = p.plan.days[dayIdx];
  const st = p.stats;
  const budget = sessionBudget(st);
  const items = day.items.map(it => {
    const ex = exById(it.exId);
    if (!ex) return null;
    const rx = prescribe(st, ex, week, p.plan.restScale || 1, tplRx(p.plan), isCustom(p.plan));
    const sg = suggest(p, ex, rx, week);
    const edit = p.plan.edits?.[editKey(week, dayIdx, ex.id)];
    const sets = Array.from({ length: rx.sets }, (_, k) => {
      const e = edit?.[k];
      return { reps: e?.reps ?? sg.reps, kg: e?.kg ?? sg.kg, done: false };
    });
    return {
      exId: ex.id, name: ex.name, unit: ex.unit, rest: rx.rest, assist: ex.assist,
      target: { reps: rx.reps, kg: sg.kg }, note: edit ? t('Edited by you') : sg.note, estimated: sg.estimated && !edit,
      sets,
    };
  }).filter(Boolean);

  // Warm-up: a timed cardio machine the user picks (same for every day), then a short mobility routine.
  const wp = warmPref(p);
  const warmEx = wp.min > 0 && exById(wp.exId);
  const warm = warmEx ? { exId: warmEx.id, name: warmEx.name, min: wp.min, done: false } : null;
  const warmup = warm ? WARMUP.slice(1).map(m => ({ ...m })) : [];
  const muscles = new Set(items.map(i => exById(i.exId)?.m).filter(Boolean));
  const cool = [...muscles].map(m => COOLDOWN[m]).filter(Boolean).slice(0, 5);
  cool.push(COOLDOWN.general);
  const cardio = day.cardio?.min > 0 && exById(day.cardio.exId) ? { exId: day.cardio.exId, name: exById(day.cardio.exId).name, min: day.cardio.min, done: false } : null;

  return {
    id: uid('s'), profileId: p.id, planId: p.plan.id, week, dayIdx, title: dayName(dayIdx),
    focus: dayFocus(day), startedAt: null, items, warm, warmup, cooldown: cool, cardio,
    budget,
  };
}

// Cardio machines that can be used for the warm-up (only what's on in Gym Setup).
export const warmOptions = () => allExercises().filter(e => e.pat === 'cardio' && isAvailable(e));

// The profile's warm-up choice: machine + minutes. Defaults to the exercise bike for the profile's warm-up length.
export function warmPref(p) {
  const opts = warmOptions();
  let exId = p.warm?.exId;
  if (!opts.some(e => e.id === exId)) exId = (opts.find(e => e.id === 'bike') || opts[0])?.id || null;
  return { exId, min: p.warm?.min ?? p.stats.warmup ?? 5 };
}

export function estimateMinutes(session) {
  const lift = session.items.reduce((a, it) => a + exerciseSeconds({ sets: it.sets.length, rest: it.rest, unit: it.unit, reps: it.target.reps }), 0);
  const warm = session.warmup.reduce((a, m) => a + m.sec, 0);
  const cool = session.cooldown.reduce((a, m) => a + m.sec, 0);
  return Math.round((lift + warm + cool) / 60 + (session.cardio ? session.cardio.min : 0) + (session.warm ? session.warm.min : 0));
}

export function estimateCalories(stats, minutes) {
  return Math.round(5 * (stats.weight || 70) * minutes / 60); // ~5 MET resistance training
}

// ── Plan progress ──
export function currentWeek(plan) {
  for (let w = 1; w <= plan.weeks; w++) {
    for (let d = 0; d < plan.days.length; d++) if (!plan.done[`${w}-${d}`]) return w;
  }
  return plan.weeks;
}

export function planProgress(plan) {
  const total = plan.weeks * plan.days.length;
  return Math.round(Object.keys(plan.done).length / total * 100);
}

// Every exercise for the same muscle area as the item (on in Gym Setup, safe for the profile's injuries),
// the same kind of movement first.
export function swapOptions(stats, plan, dayIdx, itemIdx) {
  const day = plan.days[dayIdx];
  const it = day.items[itemIdx];
  const area = itemArea(day, it);
  const inDay = new Set(day.items.map(i => i.exId));
  const inj = stats.injuries || [], no = stats.dislikes || [];
  const pats = AREAS[area]?.pats || [];
  return allExercises()
    .filter(e => e.pat !== 'cardio' && !inDay.has(e.id) && isAvailable(e) && !no.includes(e.id) && !e.avoid.some(a => inj.includes(a))
      && (areaOfEx(e) === area || pats.includes(e.pat)))
    .sort((a, b) => (b.pat === it.pat) - (a.pat === it.pat) || (areaOfEx(b) === area) - (areaOfEx(a) === area) || a.iso - b.iso || a.name.localeCompare(b.name));
}
