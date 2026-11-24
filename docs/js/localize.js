// Translates the app's built-in data (exercise names and instructions, muscles, equipment, goals, …) into the
// chosen language once at start-up. The data keeps its English text in `en` copies, so this can run again.
// walkData() is also used by tools/i18n/extract.mjs to collect every text that needs a translation.
import { t } from './i18n.js';
import { EXERCISES, MUSCLES, INJURIES, WARMUP, COOLDOWN, MOTIONS, TEMPLATES as EX_TEMPLATES, PATTERN_NAMES } from './exercises.js';
import { GOALS, LEVELS, FOCUS, AREAS, TEMPLATES, TPL_PHASES, PLACES } from './planner.js';
import { EQUIPMENT, EQUIP_CATS, HOME_EQUIP } from './equipment.js';
import { POSITIONS, GRIPS, FEEL } from './identify.js';

// Calls fn(obj, key) for every translatable text field in the built-in data.
export function walkData(fn) {
  const values = (obj) => Object.keys(obj).forEach(k => fn(obj, k));
  const field = (list, f) => Object.values(list).forEach(o => { if (o && o[f] != null) fn(o, f); });
  [MUSCLES, INJURIES, MOTIONS, PATTERN_NAMES, LEVELS, POSITIONS, GRIPS, FEEL, PLACES].forEach(values);
  values(EQUIP_CATS);
  field(GOALS, 'name'); field(FOCUS, 'name'); field(AREAS, 'name');
  for (const tp of Object.values(TEMPLATES)) { fn(tp, 'name'); fn(tp, 'short'); fn(tp, 'blurb'); }
  TPL_PHASES.forEach(row => { fn(row, 0); fn(row, 1); });
  field(WARMUP, 'name'); field(COOLDOWN, 'name');
  for (const m of [...WARMUP, ...Object.values(COOLDOWN)]) if (m.how) values(m.how);
  for (const tp of Object.values(EX_TEMPLATES)) values(tp.steps);
  for (const e of EQUIPMENT) { fn(e, 'name'); fn(e, 'cat'); }
  for (const e of HOME_EQUIP) fn(e, 'name');
  for (const ex of EXERCISES) { fn(ex, 'name'); values(ex.steps); if (ex.tip) fn(ex, 'tip'); }
}

const EN = new WeakMap(); // object → { key: English text }

export function localizeData() {
  walkData((obj, k) => {
    let en = EN.get(obj);
    if (!en) { en = {}; EN.set(obj, en); }
    if (!(k in en)) en[k] = obj[k];
    obj[k] = t(en[k]);
  });
}
