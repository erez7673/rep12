// Gym Setup: the equipment a typical commercial gym has.
// seen: common in most gyms (marks the defaults).
// on: enabled by default for plan building.

export const EQUIP_CATS = [
  'Free weights', 'Benches & racks', 'Cable machines', 'Weight-stack machines',
  'Plate-loaded machines', 'Bodyweight stations', 'Cardio',
];

const Q = (id, name, cat, seen, on = seen) => ({ id, name, cat, seen, on });

export const EQUIPMENT = [
  Q('dumbbells', 'Dumbbells (rack)', 'Free weights', true),
  Q('barbell', 'Olympic barbell + plates', 'Free weights', true),
  Q('ezbar', 'EZ bar / fixed barbells', 'Free weights', true),
  Q('kettlebells', 'Kettlebells', 'Free weights', false, false),
  Q('bands', 'Resistance bands', 'Free weights', false, false),

  Q('bench-flat', 'Flat bench', 'Benches & racks', true),
  Q('bench-adj', 'Adjustable bench', 'Benches & racks', true),
  Q('rack', 'Power rack / squat rack', 'Benches & racks', true),
  Q('smith', 'Smith machine', 'Benches & racks', true),
  Q('preacher', 'Preacher curl bench', 'Benches & racks', true),
  Q('decline-bench', 'Decline / sit-up bench', 'Benches & racks', false, false),

  Q('cable-single', 'Cable column (adjustable pulley)', 'Cable machines', true),
  Q('cable-crossover', 'Cable crossover / dual pulley', 'Cable machines', true),
  Q('lat-pulldown', 'Lat pulldown', 'Cable machines', false, true),
  Q('cable-row', 'Seated cable row (low pulley)', 'Cable machines', false, true),

  Q('chest-press-machine', 'Chest press machine', 'Weight-stack machines', true),
  Q('shoulder-press-machine', 'Shoulder press machine', 'Weight-stack machines', true),
  Q('pec-deck', 'Pec deck / rear delt fly', 'Weight-stack machines', false, true),
  Q('row-machine', 'Seated row machine (chest supported)', 'Weight-stack machines', false, true),
  Q('leg-extension', 'Leg extension', 'Weight-stack machines', true),
  Q('leg-curl', 'Leg curl (seated or lying)', 'Weight-stack machines', false, true),
  Q('abductor', 'Hip abduction (outer thigh)', 'Weight-stack machines', true),
  Q('adductor', 'Hip adduction (inner thigh)', 'Weight-stack machines', true),
  Q('triceps-machine', 'Triceps extension machine', 'Weight-stack machines', false, false),
  Q('rotary-torso', 'Rotary torso (seated twist)', 'Weight-stack machines', true),
  Q('ab-machine', 'Ab crunch machine', 'Weight-stack machines', false, false),
  Q('calf-machine', 'Seated calf raise', 'Weight-stack machines', false, false),

  Q('plate-chest-press', 'Plate-loaded chest press', 'Plate-loaded machines', true),
  Q('plate-incline-press', 'Plate-loaded incline press', 'Plate-loaded machines', true),
  Q('plate-row', 'Plate-loaded row', 'Plate-loaded machines', false, true),
  Q('leg-press', 'Leg press', 'Plate-loaded machines', false, true),
  Q('hack-squat', 'Hack squat', 'Plate-loaded machines', false, false),
  Q('hip-thrust-machine', 'Hip thrust machine', 'Plate-loaded machines', false, false),

  Q('pullup-bar', 'Pull-up bar', 'Bodyweight stations', true),
  Q('dip-station', 'Assisted chin / dip machine', 'Bodyweight stations', true),
  Q('captains-chair', 'Knee-raise station (captain\'s chair)', 'Bodyweight stations', false, true),
  Q('back-extension', '45° back extension bench', 'Bodyweight stations', false, true),
  Q('trx', 'TRX suspension straps', 'Bodyweight stations', true),

  Q('treadmill', 'Treadmills', 'Cardio', true),
  Q('elliptical', 'Elliptical cross-trainers', 'Cardio', true),
  Q('stair-climber', 'Stair climber', 'Cardio', true),
  Q('bike', 'Exercise bike (recumbent)', 'Cardio', true),
  Q('bike-upright', 'Exercise bike (upright)', 'Cardio', true),
  Q('rower', 'Rowing machine', 'Cardio', true),
];

// Home equipment (Gym tab → Home equipment), used by workout days set to Home. Stored in state.gym.home
// ({ id: true }), synced with the gym record. Body weight ('none') is always available.
// The ids match the gym's where it is the same thing, so an exercise's eq string works in both places.
export const HOME_EQUIP = [
  { id: 'pullup-bar', name: 'Pull-up bar (in a doorway)' },
  { id: 'furniture', name: 'Sturdy chair, sofa or table' },
  { id: 'bands', name: 'Resistance bands' },
  { id: 'dumbbells', name: 'Dumbbells' },
  { id: 'kettlebells', name: 'Kettlebell' },
];
