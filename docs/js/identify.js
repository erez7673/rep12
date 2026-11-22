// "What is this machine?" – matches the user's answers against the exercise library,
// or builds a custom exercise from a movement template. Optional AI hook via Apps Script.
import { EXERCISES, TEMPLATES, MOTIONS } from './exercises.js';
import { state, uid } from './store.js';
import { t as tr } from './i18n.js';

export const POSITIONS = {
  seated: 'Sitting', lying: 'Lying (on back or front)', incline: 'Leaning back on an incline',
  standing: 'Standing', kneeling: 'Kneeling', hanging: 'Hanging / supported on arms',
};
export const GRIPS = {
  handles: 'Handles', bar: 'A straight or bent bar', cable: 'A cable with a handle or rope',
  'pad-arms': 'Pads against my arms', 'pad-legs': 'Pads against my legs', platform: 'A foot platform',
  dumbbell: 'Free weights', strap: 'Straps', none: 'Nothing – just my body',
};
export const FEEL = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Front of arms', triceps: 'Back of arms',
  quads: 'Front of thighs', hamstrings: 'Back of thighs', glutes: 'Glutes / butt', adductors: 'Inner thighs',
  calves: 'Calves', core: 'Abs / core',
};

const GRIP_NEAR = { handles: ['pad-arms', 'cable'], 'pad-arms': ['handles'], cable: ['handles'], bar: ['handles'], 'pad-legs': ['platform'], platform: ['pad-legs'] };

export function matchExercises(a) {
  const scored = [];
  for (const e of EXERCISES) {
    if (a.mot && e.mot !== a.mot) continue;
    let s = 6;
    if (a.pos && e.pos === a.pos) s += 2;
    if (a.grip) {
      if (e.grip === a.grip) s += 3;
      else if ((GRIP_NEAR[a.grip] || []).includes(e.grip)) s += 1;
      else s -= 2;
    }
    for (const f of a.feel || []) {
      if (e.m === f || (f === 'shoulders' && e.m === 'rear-delts')) s += 2;
      else if (e.s.includes(f)) s += 1;
    }
    // A photographed machine is more likely a machine than free weights.
    if (['dumbbell', 'none'].includes(e.grip) && a.grip !== e.grip) s -= 2;
    scored.push({ ex: e, score: s });
  }
  return scored.sort((x, y) => y.score - x.score).slice(0, 4);
}

// Builds a custom exercise for an unknown machine from the movement template.
export function customExercise(machine, a) {
  const t = TEMPLATES[a.mot] || TEMPLATES.hold;
  const m = (a.feel && a.feel[0]) || t.m;
  return {
    id: uid('cx'), custom: true, name: machine.name || `${MOTIONS[a.mot] || 'Custom'} machine`,
    eq: machine.id, pat: t.pat, m, s: (a.feel || []).slice(1).concat(t.s).filter((x, i, arr) => x !== m && arr.indexOf(x) === i),
    pos: a.pos || 'seated', grip: a.grip || 'handles', mot: a.mot, iso: !!t.iso, lvl: 1, avoid: [],
    load: t.pat === 'cardio' ? 0 : (t.iso ? 0.2 : 0.4), inc: 5, unit: t.pat === 'cardio' ? 'min' : 'reps',
    assist: false, perHand: false,
    steps: [...t.steps, tr('Start light: do one test set of 10 easy reps to learn the movement, then adjust the weight.')],
    tip: machine.brand || machine.model ? `${[machine.brand, machine.model].filter(Boolean).join(' ')}` : '',
  };
}

// Optional AI identification (disabled unless an AI-enabled Apps Script URL is configured).
export async function identifyWithAI(photo) {
  const { syncUrl, syncKey, aiEnabled } = state.settings;
  if (!aiEnabled || !syncUrl || !photo) return null;
  const res = await fetch(syncUrl, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'identify', key: syncKey, image: photo.split(',')[1] }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || 'AI failed');
  return j.result; // { name, mot, pos, grip, feel: [], steps: [] }
}
