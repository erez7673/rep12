// Pictures of exercises and equipment, all our own (no maker pictures):
// 1. an exercise with a how-to clip shows the clip's still (media/anim/<id>-m|f.jpg, by the profile's sex, like the clip);
// 2. a piece of equipment shows the still of a typical exercise done on it (EQ_STILL);
// 3. equipment with no clip at all shows our own product picture made in Google Flow (media/equip/<id>.jpg, EQ_PHOTO).
// Anything else falls back to a line icon in thumb() (ui.js).
import { profile } from './store.js';
import { hasClip } from './anim.js';

// Equipment id → the exercise whose clip still shows it best.
const EQ_STILL = {
  dumbbells: 'db-curl', barbell: 'deadlift', ezbar: 'ez-curl',
  'bench-flat': 'db-bench', 'bench-adj': 'db-incline', rack: 'bb-squat', smith: 'smith-squat', preacher: 'preacher-curl',
  'calf-machine': 'calf-machine', 'plate-chest-press': 'plate-chest-press', 'plate-incline-press': 'plate-incline-press',
  'plate-row': 'plate-row', 'leg-press': 'leg-press', 'hack-squat': 'hack-squat', 'hip-thrust-machine': 'hip-thrust-machine',
  'pullup-bar': 'pullup', 'captains-chair': 'knee-raise', 'back-extension': 'back-ext', trx: 'trx-row', none: 'pushup',
  'cable-single': 'face-pull', 'cable-crossover': 'cable-fly', 'lat-pulldown': 'lat-pulldown', 'cable-row': 'seated-cable-row',
  'chest-press-machine': 'machine-chest-press', 'pec-deck': 'pec-deck', 'row-machine': 'machine-row',
  'leg-extension': 'leg-extension', 'leg-curl': 'leg-curl', 'triceps-machine': 'triceps-machine',
  'shoulder-press-machine': 'machine-shoulder-press', abductor: 'abductor', adductor: 'adductor', 'dip-station': 'assisted-dip',
};
// Equipment with our own product picture (white background) in media/equip/.
const EQ_PHOTO = new Set(['kettlebells', 'decline-bench', 'ab-machine', 'rotary-torso',
  'treadmill', 'elliptical', 'stair-climber', 'bike', 'bike-upright', 'rower']);

const sexKey = () => profile()?.stats?.sex === 'male' ? 'm' : 'f';
const still = (exId) => ({ kind: 'still', url: `media/anim/${exId}-${sexKey()}.jpg` });

// Picture for a piece of equipment: { kind: 'still' | 'photo', url } or null.
export function equipPic(id) {
  if (EQ_STILL[id] && hasClip(EQ_STILL[id])) return still(EQ_STILL[id]);
  if (EQ_PHOTO.has(id)) return { kind: 'photo', url: `media/equip/${id}.jpg` };
  return null;
}

// Picture for an exercise: its own clip still, else the picture of the first piece of equipment it uses.
export function picFor(ex) {
  if (!ex) return null;
  if (hasClip(ex.id)) return still(ex.id);
  const first = String(ex.eq || 'none').split('|')[0].split('+')[0];
  // A body-weight exercise without its own clip gets the line icon, not another exercise's picture.
  return first === 'none' ? null : equipPic(first);
}
