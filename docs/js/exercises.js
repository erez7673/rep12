// Built-in exercise library.
// eq: equipment needed. "a+b" = needs a AND b, "x|y" = x OR y (alternatives). "none" = bodyweight.
// pat: plan slot (pattern). m: primary muscle. s: secondary muscles.
// pos/grip/mot: used by the "What is this machine?" picker.
// load: starting weight as a fraction of body weight (intermediate male; scaled for sex/level).
// perHand: weight is per dumbbell. assist: weight is assistance (higher = easier).
// home: a home / calisthenics exercise, used only on workout days set to Home or No equipment (never in gym plans).
// unit: 'reps' | 'sec' | 'min'.

export const MUSCLES = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', 'rear-delts': 'Rear delts', traps: 'Traps',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', quads: 'Quads', hamstrings: 'Hamstrings',
  glutes: 'Glutes', adductors: 'Inner thighs', calves: 'Calves', core: 'Core', cardio: 'Cardio',
};

export const INJURIES = {
  shoulder: 'Shoulder', elbow: 'Elbow', wrist: 'Wrist', neck: 'Neck',
  lowerback: 'Lower back', hip: 'Hip', knee: 'Knee', ankle: 'Ankle',
};

const E = (id, name, eq, pat, m, o = {}) => ({
  id, name, eq, pat, m,
  s: o.s || [], pos: o.pos || 'standing', grip: o.grip || 'none', mot: o.mot || '',
  iso: !!o.iso, lvl: o.lvl || 1, avoid: o.avoid || [], load: o.load ?? 0, inc: o.inc ?? 2.5,
  unit: o.unit || 'reps', assist: !!o.assist, perHand: !!o.perHand, home: !!o.home,
  steps: o.steps || [], tip: o.tip || '',
});

export const EXERCISES = [
  // ───────── CHEST – presses ─────────
  E('bb-bench', 'Barbell Bench Press', 'barbell+bench-flat', 'h-push', 'chest', {
    s: ['triceps', 'shoulders'], pos: 'lying', grip: 'bar', mot: 'push-forward', lvl: 2, avoid: ['shoulder', 'wrist'], load: 0.6,
    steps: ['Lie on the bench with eyes under the bar, feet flat on the floor.', 'Grip slightly wider than shoulders, squeeze shoulder blades together.', 'Unrack, lower the bar to mid-chest with elbows ~45° from your body.', 'Press up until arms are straight. Use a spotter or safety arms when heavy.'],
    tip: 'Keep your butt on the bench and wrists stacked over elbows.' }),
  E('smith-bench', 'Smith Bench Press', 'smith+bench-flat', 'h-push', 'chest', {
    s: ['triceps', 'shoulders'], pos: 'lying', grip: 'bar', mot: 'push-forward', avoid: ['shoulder'], load: 0.5,
    steps: ['Place a flat bench under the Smith bar so the bar is above your lower chest.', 'Grip slightly wider than shoulders and twist the bar to unhook it.', 'Lower slowly to your chest, elbows ~45° from your body.', 'Press up to straight arms; twist the bar back onto the hooks at the end.'],
    tip: 'Set the safety stops just above chest height.' }),
  E('db-bench', 'Dumbbell Bench Press', 'dumbbells+bench-flat|dumbbells+bench-adj', 'h-push', 'chest', {
    s: ['triceps', 'shoulders'], pos: 'lying', grip: 'dumbbell', mot: 'push-forward', perHand: true, load: 0.2, inc: 2,
    steps: ['Sit with dumbbells on your thighs, then lie back and bring them to chest level.', 'Palms face forward (or slightly in), shoulder blades pulled back.', 'Press up until the dumbbells nearly touch above your chest.', 'Lower slowly until you feel a stretch in the chest.'],
    tip: 'Dumbbells are kinder to shoulders than a barbell.' }),
  E('db-incline', 'Incline Dumbbell Press', 'dumbbells+bench-adj', 'h-push', 'chest', {
    s: ['shoulders', 'triceps'], pos: 'incline', grip: 'dumbbell', mot: 'push-forward', perHand: true, load: 0.17, inc: 2,
    steps: ['Set the bench to 30°. Sit back with dumbbells at shoulder level.', 'Press up and slightly in over your upper chest.', 'Lower under control until elbows are just below the bench line.', 'Keep shoulder blades squeezed back the whole time.'],
    tip: 'Targets the upper chest.' }),
  E('smith-incline', 'Smith Incline Press', 'smith+bench-adj', 'h-push', 'chest', {
    s: ['shoulders', 'triceps'], pos: 'incline', grip: 'bar', mot: 'push-forward', load: 0.4,
    steps: ['Set an adjustable bench to 30° under the Smith bar.', 'The bar should come down to your upper chest.', 'Unhook, lower slowly to the upper chest.', 'Press up to straight arms, then re-hook.'] }),
  E('machine-chest-press', 'Machine Chest Press', 'chest-press-machine', 'h-push', 'chest', {
    s: ['triceps', 'shoulders'], pos: 'seated', grip: 'handles', mot: 'push-forward', load: 0.45, inc: 5,
    steps: ['Adjust the seat so the handles are at mid-chest height.', 'Sit with your back flat against the pad, feet on the floor.', 'Push the handles forward until arms are almost straight.', 'Return slowly until you feel a stretch in the chest.'],
    tip: 'A great, safe first press for beginners.' }),
  E('plate-chest-press', 'Plate-Loaded Chest Press', 'plate-chest-press', 'h-push', 'chest', {
    s: ['triceps', 'shoulders'], pos: 'seated', grip: 'handles', mot: 'push-forward', load: 0.4, inc: 5,
    steps: ['Load equal plates on both sides. Set the seat so handles are at mid-chest.', 'Sit back, grab the handles, shoulder blades back.', 'Press forward until arms are almost straight.', 'Lower slowly. Each arm moves independently – keep them even.'],
    tip: 'Weight shown is total plates loaded.' }),
  E('plate-incline-press', 'Plate-Loaded Incline Press', 'plate-incline-press', 'h-push', 'chest', {
    s: ['shoulders', 'triceps'], pos: 'seated', grip: 'handles', mot: 'push-forward', load: 0.35, inc: 5,
    steps: ['Load equal plates. Set the seat so handles start at upper-chest level.', 'Sit back with chest up and shoulder blades squeezed.', 'Press up and forward until arms are nearly straight.', 'Lower slowly to a comfortable stretch.'] }),
  E('pushup', 'Push-Up', 'none', 'h-push', 'chest', {
    s: ['triceps', 'shoulders', 'core'], pos: 'lying', grip: 'none', mot: 'push-forward', avoid: ['wrist'], load: 0,
    steps: ['Hands slightly wider than shoulders, body in a straight line.', 'Lower your chest to just above the floor, elbows ~45°.', 'Push back up to straight arms.', 'Too hard? Put hands on a bench or do them from your knees.'] }),

  // ───────── CHEST – flys ─────────
  E('pec-deck', 'Pec Deck Fly', 'pec-deck', 'chest-iso', 'chest', {
    pos: 'seated', grip: 'handles', mot: 'arms-together', iso: true, load: 0.3, inc: 5,
    steps: ['Set the seat so handles are at chest height. Set the arms to the front position.', 'Sit with back on the pad, grab the handles with a slight bend in the elbows.', 'Bring the handles together in front of your chest.', 'Open slowly until you feel a stretch, without going past your shoulders.'] }),
  E('cable-fly', 'Cable Crossover Fly', 'cable-crossover', 'chest-iso', 'chest', {
    pos: 'standing', grip: 'cable', mot: 'arms-together', iso: true, load: 0.08, inc: 2.5,
    steps: ['Set both pulleys to shoulder height with single handles.', 'Step forward into a split stance, slight lean forward.', 'With slightly bent elbows, bring the handles together in front of your chest.', 'Return slowly with control.'], tip: 'Weight shown is per side.' }),
  E('cable-fly-low', 'Low-to-High Cable Fly (Upper Chest)', 'cable-crossover', 'chest-iso', 'chest', {
    s: ['shoulders'], pos: 'standing', grip: 'cable', mot: 'arms-together', iso: true, load: 0.06, inc: 2.5,
    steps: ['Set both pulleys at the lowest position.', 'Stand in the middle, step forward, arms down and slightly back.', 'Sweep the handles up and together to upper-chest height.', 'Lower slowly.'], tip: 'Weight shown is per side.' }),
  E('cable-fly-high', 'Cable Decline Fly (High-to-Low)', 'cable-crossover', 'chest-iso', 'chest', {
    pos: 'standing', grip: 'cable', mot: 'arms-together', iso: true, load: 0.07, inc: 2.5,
    steps: ['Set both pulleys at the top.', 'Step forward with a slight lean, arms out wide.', 'Pull the handles down and together in front of your hips.', 'Return slowly.'], tip: 'Weight shown is per side.' }),
  E('db-fly', 'Dumbbell Fly', 'dumbbells+bench-flat|dumbbells+bench-adj', 'chest-iso', 'chest', {
    pos: 'lying', grip: 'dumbbell', mot: 'arms-together', iso: true, perHand: true, avoid: ['shoulder'], load: 0.08, inc: 2,
    steps: ['Lie on a bench, dumbbells above your chest, palms facing each other.', 'With a soft bend in the elbows, open your arms wide.', 'Stop when you feel a stretch (elbows about level with the bench).', 'Squeeze the dumbbells back together.'] }),
  E('incline-db-fly', 'Incline Dumbbell Fly', 'dumbbells+bench-adj', 'chest-iso', 'chest', {
    pos: 'incline', grip: 'dumbbell', mot: 'arms-together', iso: true, perHand: true, avoid: ['shoulder'], load: 0.07, inc: 2,
    steps: ['Set the bench to 30°.', 'Dumbbells above your upper chest, palms facing each other.', 'Open wide with soft elbows until you feel a stretch.', 'Bring them back together over your chest.'] }),

  // ───────── SHOULDERS ─────────
  E('db-shoulder-press', 'Seated Dumbbell Shoulder Press', 'dumbbells+bench-adj', 'v-push', 'shoulders', {
    s: ['triceps'], pos: 'seated', grip: 'dumbbell', mot: 'push-up', perHand: true, avoid: ['shoulder'], load: 0.14, inc: 2,
    steps: ['Set the bench upright (80–90°). Dumbbells at shoulder height, palms forward.', 'Brace your core and keep your back on the pad.', 'Press up until arms are straight overhead.', 'Lower to ear level.'] }),
  E('machine-shoulder-press', 'Machine Shoulder Press', 'shoulder-press-machine', 'v-push', 'shoulders', {
    s: ['triceps'], pos: 'seated', grip: 'handles', mot: 'push-up', avoid: ['shoulder'], load: 0.3, inc: 5,
    steps: ['Adjust the seat so handles start at shoulder height.', 'Sit with back on the pad, grip the handles.', 'Press up until arms are almost straight.', 'Lower slowly to the start.'] }),
  E('smith-ohp', 'Smith Seated Shoulder Press', 'smith+bench-adj', 'v-push', 'shoulders', {
    s: ['triceps'], pos: 'seated', grip: 'bar', mot: 'push-up', avoid: ['shoulder'], load: 0.3,
    steps: ['Set an upright bench under the Smith bar so the bar passes just in front of your face.', 'Grip slightly wider than shoulders.', 'Unhook and lower to chin level.', 'Press up to straight arms.'] }),
  E('bb-ohp', 'Standing Barbell Overhead Press', 'barbell+rack', 'v-push', 'shoulders', {
    s: ['triceps', 'core'], pos: 'standing', grip: 'bar', mot: 'push-up', lvl: 2, avoid: ['shoulder', 'lowerback'], load: 0.4,
    steps: ['Set the bar in the rack at collarbone height. Grip just outside shoulders.', 'Unrack, brace your core and squeeze your glutes.', 'Press the bar straight up, moving your head back slightly to let it pass.', 'Lock out overhead, then lower to the collarbone.'] }),
  E('arnold-press', 'Arnold Press', 'dumbbells+bench-adj', 'v-push', 'shoulders', {
    s: ['triceps'], pos: 'seated', grip: 'dumbbell', mot: 'push-up', lvl: 2, perHand: true, avoid: ['shoulder'], load: 0.11, inc: 2,
    steps: ['Sit upright, dumbbells in front of shoulders, palms facing you.', 'As you press up, rotate palms to face forward.', 'Finish with arms straight overhead.', 'Reverse the rotation as you lower.'] }),
  E('db-lateral', 'Dumbbell Lateral Raise', 'dumbbells', 'side-delt', 'shoulders', {
    pos: 'standing', grip: 'dumbbell', mot: 'raise-arms', iso: true, perHand: true, load: 0.05, inc: 1,
    steps: ['Stand tall, dumbbells at your sides, slight bend in the elbows.', 'Raise arms out to the sides until they reach shoulder height.', 'Lead with the elbows; pinkies slightly up.', 'Lower slowly – no swinging.'] }),
  E('cable-lateral', 'Cable Lateral Raise', 'cable-single|cable-crossover', 'side-delt', 'shoulders', {
    pos: 'standing', grip: 'cable', mot: 'raise-arms', iso: true, load: 0.03, inc: 1.25,
    steps: ['Set a pulley at the lowest position with a single handle.', 'Stand side-on, hold the handle with the far hand across your body.', 'Raise your arm out to the side to shoulder height.', 'Lower slowly. Do all reps, then switch sides.'] }),
  E('reverse-pec-deck', 'Reverse Pec Deck', 'pec-deck', 'rear-delt', 'rear-delts', {
    s: ['traps'], pos: 'seated', grip: 'handles', mot: 'arms-apart', iso: true, load: 0.2, inc: 5,
    steps: ['Set the machine arms to the back position. Sit facing the pad.', 'Grab the handles at shoulder height with straight-ish arms.', 'Sweep your arms back and out until in line with your body.', 'Return slowly.'] }),
  E('face-pull', 'Cable Face Pull', 'cable-single|cable-crossover', 'rear-delt', 'rear-delts', {
    s: ['traps'], pos: 'standing', grip: 'cable', mot: 'pull-toward', iso: true, load: 0.2, inc: 2.5,
    steps: ['Set the pulley at head height with the rope attachment.', 'Grab both rope ends, palms facing in, step back.', 'Pull the rope toward your face, splitting the ends beside your ears.', 'Squeeze shoulder blades, then return slowly.'], tip: 'Great for posture and shoulder health.' }),
  E('db-rear-fly', 'Bent-Over Dumbbell Rear Delt Fly', 'dumbbells', 'rear-delt', 'rear-delts', {
    s: ['traps'], pos: 'standing', grip: 'dumbbell', mot: 'arms-apart', iso: true, perHand: true, avoid: ['lowerback'], load: 0.05, inc: 1,
    steps: ['Hinge forward at the hips, back flat, dumbbells hanging below your chest.', 'With soft elbows, raise arms out to the sides.', 'Squeeze your upper back at the top.', 'Lower slowly.'] }),

  // ───────── BACK – vertical pulls ─────────
  E('lat-pulldown', 'Wide-Grip Lat Pulldown', 'lat-pulldown', 'v-pull', 'back', {
    s: ['biceps', 'rear-delts'], pos: 'seated', grip: 'bar', mot: 'pull-down', load: 0.55, inc: 5,
    steps: ['Adjust the thigh pad so your legs are locked in.', 'Grip the bar wider than shoulders, sit down with arms straight.', 'Pull the bar to your upper chest, leading with your elbows.', 'Let it rise slowly until arms are straight.'], tip: 'Chest up; don\'t lean back too far.' }),
  E('close-pulldown', 'Close-Grip Pulldown (V-handle)', 'lat-pulldown', 'v-pull', 'back', {
    s: ['biceps'], pos: 'seated', grip: 'handles', mot: 'pull-down', load: 0.55, inc: 5,
    steps: ['Attach a V-handle. Lock your legs under the pad.', 'Grip with palms facing each other, arms straight.', 'Pull the handle to your upper chest, elbows close to your body.', 'Return slowly.'] }),
  E('assisted-chin', 'Assisted Chin-Up', 'dip-station', 'v-pull', 'back', {
    s: ['biceps'], pos: 'kneeling', grip: 'handles', mot: 'pull-down', assist: true, load: 0.5, inc: 5,
    steps: ['Select the assistance weight – MORE weight = EASIER.', 'Grip the bar with palms facing you, shoulder-width.', 'Kneel (or stand) on the pad and hang with straight arms.', 'Pull up until your chin is above the bar, then lower slowly.'], tip: 'Progress by reducing the assistance.' }),
  E('pullup', 'Pull-Up', 'pullup-bar', 'v-pull', 'back', {
    s: ['biceps'], pos: 'hanging', grip: 'bar', mot: 'pull-down', lvl: 3, avoid: ['shoulder'], load: 0,
    steps: ['Hang from the bar, hands just wider than shoulders, palms away.', 'Pull your chest toward the bar, elbows driving down.', 'Get your chin over the bar.', 'Lower to straight arms under control.'] }),
  E('straight-arm-pulldown', 'Straight-Arm Cable Pulldown', 'cable-single|cable-crossover|lat-pulldown', 'v-pull', 'back', {
    pos: 'standing', grip: 'cable', mot: 'pull-down', iso: true, load: 0.2, inc: 2.5,
    steps: ['Set a pulley high with a straight bar or rope.', 'Step back, hinge slightly, arms straight in front at head height.', 'Keeping arms straight, sweep the bar down to your thighs.', 'Return slowly.'] }),

  // ───────── BACK – rows ─────────
  E('seated-cable-row', 'Seated Cable Row', 'cable-row', 'h-pull', 'back', {
    s: ['biceps', 'rear-delts'], pos: 'seated', grip: 'handles', mot: 'pull-toward', load: 0.5, inc: 5,
    steps: ['Sit with feet on the platform, knees slightly bent, grab the V-handle.', 'Sit tall with arms straight.', 'Pull the handle to your belly, squeezing shoulder blades together.', 'Return slowly without rounding your back.'] }),
  E('crossover-row', 'Cable Seated Crossover Row', 'cable-row|cable-crossover', 'h-pull', 'back', {
    s: ['rear-delts', 'biceps'], pos: 'seated', grip: 'cable', mot: 'pull-toward', load: 0.2, inc: 2.5,
    steps: ['Sit facing the low pulleys holding single handles in crossed hands (right handle in left hand).', 'Sit tall with arms straight.', 'Row both handles back toward your sides.', 'Return slowly.'] }),
  E('machine-row', 'Chest-Supported Machine Row', 'row-machine', 'h-pull', 'back', {
    s: ['biceps', 'rear-delts'], pos: 'seated', grip: 'handles', mot: 'pull-toward', load: 0.45, inc: 5,
    steps: ['Adjust the seat so handles are at chest height and your chest rests on the pad.', 'Grip the handles with arms straight.', 'Pull back, squeezing your shoulder blades.', 'Return slowly.'] }),
  E('plate-row', 'Machine Seated One-Arm Row', 'plate-row', 'h-pull', 'back', {
    s: ['biceps', 'rear-delts'], pos: 'seated', grip: 'handles', mot: 'pull-toward', load: 0.25, inc: 5,
    steps: ['Load plates. Set the seat so your chest is on the pad and the handles are reachable.', 'Grip one or both handles with arms straight.', 'Pull your elbow(s) back past your body.', 'Return slowly. If doing one arm at a time, do all reps then switch.'] }),
  E('db-row', 'One-Arm Dumbbell Row', 'dumbbells+bench-flat|dumbbells+bench-adj|dumbbells+furniture', 'h-pull', 'back', {
    s: ['biceps', 'rear-delts'], pos: 'kneeling', grip: 'dumbbell', mot: 'pull-toward', perHand: true, load: 0.25, inc: 2,
    steps: ['Put one knee and hand on a flat bench, back flat.', 'Hold a dumbbell in the other hand, arm straight.', 'Pull the dumbbell to your hip, elbow close to your body.', 'Lower slowly. Do all reps, then switch sides.'] }),
  E('incline-db-row', 'Chest-Supported Dumbbell Row', 'dumbbells+bench-adj', 'h-pull', 'back', {
    s: ['rear-delts', 'biceps'], pos: 'lying', grip: 'dumbbell', mot: 'pull-toward', perHand: true, load: 0.15, inc: 2,
    steps: ['Set the bench to 30–45°, lie face down on it.', 'Let the dumbbells hang straight down.', 'Row both up, squeezing your shoulder blades together.', 'Lower slowly.'], tip: 'Easy on the lower back.' }),
  E('bb-row', 'Barbell Bent-Over Row', 'barbell', 'h-pull', 'back', {
    s: ['biceps', 'rear-delts', 'hamstrings'], pos: 'standing', grip: 'bar', mot: 'pull-toward', lvl: 2, avoid: ['lowerback'], load: 0.5,
    steps: ['Hold the bar with an overhand grip, hinge at the hips until your torso is ~45°.', 'Keep your back flat and knees soft.', 'Pull the bar to your lower ribs.', 'Lower to straight arms.'] }),
  E('trx-row', 'TRX Row', 'trx', 'h-pull', 'back', {
    s: ['biceps', 'core'], pos: 'standing', grip: 'strap', mot: 'pull-toward', load: 0,
    steps: ['Hold the TRX handles, walk your feet forward and lean back with straight arms.', 'Keep your body in a straight line.', 'Pull your chest up to the handles.', 'Lower slowly. Walk feet further forward to make it harder.'] }),
  E('db-shrug', 'Dumbbell Shrug', 'dumbbells', 'traps', 'traps', {
    pos: 'standing', grip: 'dumbbell', mot: 'shrug', iso: true, perHand: true, avoid: ['neck'], load: 0.3, inc: 2,
    steps: ['Stand tall, dumbbells at your sides.', 'Lift your shoulders straight up toward your ears.', 'Hold for a second at the top.', 'Lower slowly. Don\'t roll your shoulders.'] }),
  E('smith-shrug', 'Smith Machine Shrug', 'smith', 'traps', 'traps', {
    pos: 'standing', grip: 'bar', mot: 'shrug', iso: true, avoid: ['neck'], load: 0.6, inc: 5,
    steps: ['Set the Smith bar at mid-thigh height.', 'Grip shoulder-width, stand tall with arms straight.', 'Shrug your shoulders straight up.', 'Lower slowly.'] }),

  // ───────── ARMS – biceps ─────────
  E('db-curl', 'Dumbbell Biceps Curl', 'dumbbells', 'biceps', 'biceps', {
    s: ['forearms'], pos: 'standing', grip: 'dumbbell', mot: 'curl', iso: true, perHand: true, load: 0.1, inc: 2,
    steps: ['Stand tall, dumbbells at your sides, palms forward.', 'Keep elbows pinned to your sides.', 'Curl the weights up to shoulder height.', 'Lower slowly to straight arms.'] }),
  E('hammer-curl', 'Hammer Curl', 'dumbbells', 'biceps', 'biceps', {
    s: ['forearms'], pos: 'standing', grip: 'dumbbell', mot: 'curl', iso: true, perHand: true, load: 0.1, inc: 2,
    steps: ['Hold dumbbells at your sides with palms facing each other.', 'Keep elbows still.', 'Curl up, keeping the thumbs on top.', 'Lower slowly.'] }),
  E('ez-curl', 'EZ-Bar Curl', 'ezbar', 'biceps', 'biceps', {
    s: ['forearms'], pos: 'standing', grip: 'bar', mot: 'curl', iso: true, avoid: ['wrist'], load: 0.2, inc: 2.5,
    steps: ['Hold the EZ bar on the angled grips, palms up.', 'Elbows at your sides.', 'Curl the bar up to your chest.', 'Lower slowly without swinging.'] }),
  E('preacher-curl', 'Preacher Curl', 'preacher+ezbar|preacher+dumbbells', 'biceps', 'biceps', {
    pos: 'seated', grip: 'bar', mot: 'curl', iso: true, avoid: ['elbow'], load: 0.15, inc: 2.5,
    steps: ['Adjust the seat so your armpits sit at the top of the pad.', 'Hold an EZ bar (or dumbbell) with arms on the pad.', 'Curl up until forearms are vertical.', 'Lower slowly, stopping just short of locking the elbows.'] }),
  E('cable-curl', 'Cable Curl', 'cable-single|cable-crossover', 'biceps', 'biceps', {
    pos: 'standing', grip: 'cable', mot: 'curl', iso: true, load: 0.15, inc: 2.5,
    steps: ['Set the pulley at the bottom with a straight bar or rope.', 'Stand facing the machine, elbows at your sides.', 'Curl the handle to your chest.', 'Lower slowly.'] }),
  E('incline-db-curl', 'Incline Dumbbell Curl', 'dumbbells+bench-adj', 'biceps', 'biceps', {
    pos: 'incline', grip: 'dumbbell', mot: 'curl', iso: true, lvl: 2, perHand: true, avoid: ['shoulder'], load: 0.07, inc: 2,
    steps: ['Set the bench to 45–60°, sit back with arms hanging straight down.', 'Palms forward.', 'Curl both dumbbells up without moving your upper arms.', 'Lower all the way down slowly.'] }),

  // ───────── ARMS – triceps ─────────
  E('rope-pushdown', 'Cable Rope Pushdown', 'cable-single|cable-crossover|lat-pulldown', 'triceps', 'triceps', {
    pos: 'standing', grip: 'cable', mot: 'extend-arm', iso: true, load: 0.15, inc: 2.5,
    steps: ['Set the pulley high with the rope attachment.', 'Elbows pinned at your sides, forearms up.', 'Push the rope down and split the ends at the bottom.', 'Return slowly to 90°.'] }),
  E('bar-pushdown', 'Straight-Bar Pushdown', 'cable-single|cable-crossover|lat-pulldown', 'triceps', 'triceps', {
    pos: 'standing', grip: 'cable', mot: 'extend-arm', iso: true, load: 0.18, inc: 2.5,
    steps: ['Set the pulley high with a straight or angled bar.', 'Grip overhand, elbows tucked in at your sides.', 'Push the bar down until arms are straight.', 'Return slowly.'] }),
  E('overhead-cable-ext', 'Overhead Cable Triceps Extension', 'cable-single|cable-crossover', 'triceps', 'triceps', {
    pos: 'standing', grip: 'cable', mot: 'extend-arm', iso: true, avoid: ['elbow', 'shoulder'], load: 0.12, inc: 2.5,
    steps: ['Set the pulley low with a rope. Face away from the machine, rope behind your head.', 'Step forward into a split stance, elbows pointing forward.', 'Straighten your arms overhead.', 'Bend the elbows slowly back.'] }),
  E('db-overhead-ext', 'Seated Dumbbell Overhead Extension', 'dumbbells+bench-adj', 'triceps', 'triceps', {
    pos: 'seated', grip: 'dumbbell', mot: 'extend-arm', iso: true, avoid: ['elbow', 'shoulder'], load: 0.15, inc: 2,
    steps: ['Sit upright, hold one dumbbell with both hands above your head.', 'Keep elbows pointing up and close.', 'Lower the dumbbell behind your head.', 'Straighten your arms back up.'] }),
  E('skull-crusher', 'EZ-Bar Skull Crusher', 'ezbar+bench-flat', 'triceps', 'triceps', {
    pos: 'lying', grip: 'bar', mot: 'extend-arm', iso: true, lvl: 2, avoid: ['elbow'], load: 0.15, inc: 2.5,
    steps: ['Lie on a bench holding an EZ bar above your chest.', 'Keep upper arms still, bend elbows to lower the bar toward your forehead.', 'Stop just above your head.', 'Straighten the arms back up.'] }),
  E('close-grip-smith', 'Close-Grip Smith Bench Press', 'smith+bench-flat', 'triceps', 'triceps', {
    s: ['chest'], pos: 'lying', grip: 'bar', mot: 'push-forward', avoid: ['wrist'], load: 0.4,
    steps: ['Lie under the Smith bar, grip shoulder-width.', 'Unhook and lower to your lower chest, elbows close to your body.', 'Press up to straight arms.', 'Re-hook at the end.'] }),
  E('assisted-dip', 'Assisted Dip', 'dip-station', 'triceps', 'triceps', {
    s: ['chest', 'shoulders'], pos: 'kneeling', grip: 'handles', mot: 'push-down', assist: true, avoid: ['shoulder'], load: 0.5, inc: 5,
    steps: ['Select the assistance weight – MORE weight = EASIER.', 'Grip the dip handles and kneel on the pad with arms straight.', 'Lower until your upper arms are about parallel to the floor.', 'Push back up to straight arms.'] }),
  E('triceps-machine', 'Machine Triceps Extension', 'triceps-machine', 'triceps', 'triceps', {
    pos: 'seated', grip: 'handles', mot: 'extend-arm', iso: true, load: 0.2, inc: 5,
    steps: ['Adjust the seat so your elbows line up with the machine\'s pivot point.', 'Rest your upper arms on the pad, grip the handles.', 'Push down/forward until your arms are straight.', 'Return slowly.'] }),
  E('bench-dip', 'Bench Dip', 'bench-flat|furniture', 'triceps', 'triceps', {
    s: ['chest'], pos: 'seated', grip: 'none', mot: 'push-down', avoid: ['shoulder', 'wrist'], load: 0,
    steps: ['Sit on the edge of a bench, hands beside your hips.', 'Slide your butt off the bench, legs bent.', 'Bend your elbows to lower your body about 10–15 cm.', 'Push back up.'] }),

  // ───────── LEGS – squat pattern ─────────
  E('leg-press', 'Leg Press', 'leg-press', 'squat', 'quads', {
    s: ['glutes', 'hamstrings'], pos: 'seated', grip: 'platform', mot: 'leg-push', avoid: ['knee'], load: 1.2, inc: 10,
    steps: ['Sit with your back flat on the pad, feet shoulder-width in the middle of the platform.', 'Release the safety handles.', 'Lower until your knees are at about 90°, keeping your lower back on the pad.', 'Push back up without locking your knees.'], tip: 'Feet higher = more glutes, lower = more quads.' }),
  E('bb-squat', 'Barbell Back Squat', 'barbell+rack', 'squat', 'quads', {
    s: ['glutes', 'core'], pos: 'standing', grip: 'bar', mot: 'leg-push', lvl: 2, avoid: ['knee', 'lowerback'], load: 0.7,
    steps: ['Set the bar in the rack at shoulder height and safety arms just below squat depth.', 'Bar on your upper back, feet shoulder-width, toes slightly out.', 'Brace, sit back and down until thighs are at least parallel.', 'Drive up through your whole foot.'] }),
  E('smith-squat', 'Smith Machine Squat', 'smith', 'squat', 'quads', {
    s: ['glutes'], pos: 'standing', grip: 'bar', mot: 'leg-push', avoid: ['knee'], load: 0.6,
    steps: ['Bar on your upper back, feet slightly in front of the bar.', 'Unhook the bar.', 'Squat down until thighs are about parallel.', 'Push back up, then re-hook.'] }),
  E('goblet-squat', 'Goblet Squat', 'dumbbells|kettlebells', 'squat', 'quads', {
    s: ['glutes', 'core'], pos: 'standing', grip: 'dumbbell', mot: 'leg-push', avoid: ['knee'], load: 0.25, inc: 2,
    steps: ['Hold one dumbbell vertically against your chest.', 'Feet shoulder-width, toes slightly out.', 'Squat down between your knees, chest up.', 'Stand back up.'] }),
  E('sumo-squat', 'Dumbbell Sumo Squat', 'dumbbells', 'squat', 'glutes', {
    s: ['adductors', 'quads'], pos: 'standing', grip: 'dumbbell', mot: 'leg-push', avoid: ['knee', 'hip'], load: 0.3, inc: 2,
    steps: ['Wide stance, toes pointed out, hold one dumbbell between your legs.', 'Keep your chest up.', 'Squat down, pushing knees out over toes.', 'Squeeze glutes to stand.'] }),
  E('hack-squat', 'Hack Squat Machine', 'hack-squat', 'squat', 'quads', {
    s: ['glutes'], pos: 'standing', grip: 'pad-arms', mot: 'leg-push', avoid: ['knee'], load: 0.6, inc: 5,
    steps: ['Stand on the platform with your back and shoulders against the pads.', 'Feet shoulder-width. Release the safety handles.', 'Lower until knees are at 90° or a bit deeper.', 'Push back up.'] }),

  // ───────── LEGS – hinge ─────────
  E('rdl', 'Barbell Romanian Deadlift', 'barbell', 'hinge', 'hamstrings', {
    s: ['glutes', 'back'], pos: 'standing', grip: 'bar', mot: 'hip-hinge', lvl: 2, avoid: ['lowerback'], load: 0.6,
    steps: ['Hold the bar at your thighs, feet hip-width, knees soft.', 'Push your hips back, sliding the bar down your legs.', 'Keep your back flat; stop when you feel a strong hamstring stretch.', 'Drive your hips forward to stand.'] }),
  E('db-rdl', 'Dumbbell Romanian Deadlift', 'dumbbells', 'hinge', 'hamstrings', {
    s: ['glutes'], pos: 'standing', grip: 'dumbbell', mot: 'hip-hinge', avoid: ['lowerback'], perHand: true, load: 0.2, inc: 2,
    steps: ['Hold dumbbells in front of your thighs, knees soft.', 'Push your hips back, dumbbells close to your legs.', 'Go down until you feel the hamstrings stretch, back flat.', 'Squeeze glutes to stand.'] }),
  E('smith-rdl', 'Smith Romanian Deadlift', 'smith', 'hinge', 'hamstrings', {
    s: ['glutes'], pos: 'standing', grip: 'bar', mot: 'hip-hinge', avoid: ['lowerback'], load: 0.5,
    steps: ['Set the Smith bar at mid-thigh, stand close with feet hip-width.', 'Unhook and push your hips back, back flat.', 'Lower until you feel the hamstrings stretch.', 'Drive hips forward to stand.'] }),
  E('deadlift', 'Conventional Deadlift', 'barbell', 'hinge', 'back', {
    s: ['glutes', 'hamstrings', 'traps'], pos: 'standing', grip: 'bar', mot: 'hip-hinge', lvl: 3, avoid: ['lowerback'], load: 0.9,
    steps: ['Bar over mid-foot, feet hip-width. Grip just outside your knees.', 'Shins to the bar, chest up, back flat, brace hard.', 'Push the floor away and stand up tall.', 'Lower by pushing your hips back.'] }),
  E('back-ext', '45° Back Extension', 'back-extension', 'hinge', 'glutes', {
    s: ['hamstrings', 'back'], pos: 'standing', grip: 'pad-legs', mot: 'hip-hinge', load: 0,
    steps: ['Set the pad just below your hip bones, heels under the foot pad.', 'Cross arms over your chest.', 'Lower your upper body by bending at the hips.', 'Squeeze your glutes to come back up to a straight line.'] }),
  E('cable-pull-through', 'Cable Pull-Through', 'cable-single|cable-crossover', 'hinge', 'glutes', {
    s: ['hamstrings'], pos: 'standing', grip: 'cable', mot: 'hip-hinge', load: 0.25, inc: 2.5,
    steps: ['Set a low pulley with the rope. Face away, rope between your legs.', 'Walk forward two steps, feet wide.', 'Hinge at the hips letting the rope go back between your legs.', 'Squeeze glutes to stand tall.'] }),

  // ───────── LEGS – single leg ─────────
  E('db-lunge', 'Dumbbell Walking Lunge', 'dumbbells', 'lunge', 'quads', {
    s: ['glutes'], pos: 'standing', grip: 'dumbbell', mot: 'leg-push', avoid: ['knee'], perHand: true, load: 0.12, inc: 2,
    steps: ['Hold dumbbells at your sides.', 'Take a long step forward and lower your back knee toward the floor.', 'Push through the front heel and step into the next lunge.', 'Reps count per leg.'] }),
  E('reverse-lunge', 'Dumbbell Reverse Lunge', 'dumbbells', 'lunge', 'glutes', {
    s: ['quads'], pos: 'standing', grip: 'dumbbell', mot: 'leg-push', avoid: ['knee'], perHand: true, load: 0.12, inc: 2,
    steps: ['Stand tall holding dumbbells.', 'Step one foot back and lower the back knee.', 'Push through the front heel to return.', 'Alternate legs; reps count per leg.'], tip: 'Easier on the knees than forward lunges.' }),
  E('split-squat', 'Bulgarian Split Squat', 'dumbbells+bench-flat|dumbbells+bench-adj|dumbbells+furniture', 'lunge', 'quads', {
    s: ['glutes'], pos: 'standing', grip: 'dumbbell', mot: 'leg-push', lvl: 2, avoid: ['knee'], perHand: true, load: 0.1, inc: 2,
    steps: ['Stand in front of a bench, put the top of your back foot on it.', 'Hold dumbbells at your sides.', 'Lower straight down until your front thigh is about parallel.', 'Push up through the front heel. Do all reps, then switch.'] }),
  E('stepup', 'Dumbbell Step-Up', 'dumbbells+bench-flat', 'lunge', 'glutes', {
    s: ['quads'], pos: 'standing', grip: 'dumbbell', mot: 'leg-push', avoid: ['knee'], perHand: true, load: 0.1, inc: 2,
    steps: ['Stand facing a flat bench holding dumbbells.', 'Place one whole foot on the bench.', 'Drive through that heel to stand on the bench.', 'Step down slowly. Do all reps, then switch.'] }),
  E('smith-split-squat', 'Smith Split Squat', 'smith', 'lunge', 'quads', {
    s: ['glutes'], pos: 'standing', grip: 'bar', mot: 'leg-push', avoid: ['knee'], load: 0.35,
    steps: ['Bar on your upper back, one foot forward and one back in a long stance.', 'Unhook the bar.', 'Lower the back knee toward the floor.', 'Push up through the front foot. Do all reps, then switch.'] }),

  // ───────── LEGS – isolation ─────────
  E('leg-extension', 'Leg Extension', 'leg-extension', 'quad-iso', 'quads', {
    pos: 'seated', grip: 'pad-legs', mot: 'leg-extend', iso: true, load: 0.35, inc: 5,
    steps: ['Adjust the back so your knees line up with the machine\'s pivot.', 'Set the shin pad just above your ankles.', 'Straighten your legs fully and squeeze the quads.', 'Lower slowly.'] }),
  E('leg-curl', 'Leg Curl Machine', 'leg-curl', 'ham-iso', 'hamstrings', {
    pos: 'seated', grip: 'pad-legs', mot: 'leg-curl', iso: true, load: 0.35, inc: 5,
    steps: ['Adjust so your knees line up with the pivot; lock the thigh pad down.', 'The leg pad sits just above your heels.', 'Curl your heels back/down as far as you can.', 'Return slowly.'] }),
  E('hip-thrust', 'Barbell Hip Thrust', 'barbell+bench-flat', 'glute', 'glutes', {
    s: ['hamstrings'], pos: 'seated', grip: 'bar', mot: 'hip-thrust', lvl: 2, load: 0.8,
    steps: ['Sit on the floor with your upper back against a bench, bar over your hips (use a pad).', 'Feet flat, hip-width, knees bent.', 'Drive your hips up until your body is straight from shoulders to knees.', 'Squeeze glutes at the top, lower slowly.'] }),
  E('smith-hip-thrust', 'Smith Hip Thrust', 'smith+bench-flat', 'glute', 'glutes', {
    s: ['hamstrings'], pos: 'seated', grip: 'bar', mot: 'hip-thrust', load: 0.7,
    steps: ['Place a bench sideways near the Smith machine. Upper back on the bench, bar over your hips (with a pad).', 'Feet flat, knees bent.', 'Unhook and push your hips up to a straight line.', 'Squeeze, then lower slowly.'] }),
  E('hip-thrust-machine', 'Hip Thrust Machine', 'hip-thrust-machine', 'glute', 'glutes', {
    s: ['hamstrings'], pos: 'seated', grip: 'pad-legs', mot: 'hip-thrust', load: 0.6, inc: 5,
    steps: ['Sit with your upper back on the pad and the belt/pad across your hips.', 'Feet flat on the platform.', 'Push your hips up until straight.', 'Squeeze glutes, lower slowly.'] }),
  E('glute-bridge', 'Glute Bridge', 'none', 'glute', 'glutes', {
    s: ['hamstrings'], pos: 'lying', grip: 'none', mot: 'hip-thrust', load: 0,
    steps: ['Lie on your back, knees bent, feet flat near your butt.', 'Push through your heels to lift your hips.', 'Squeeze your glutes at the top for 2 seconds.', 'Lower slowly.'] }),
  E('abductor', 'Hip Abduction Machine', 'abductor', 'glute', 'glutes', {
    pos: 'seated', grip: 'pad-legs', mot: 'legs-apart', iso: true, load: 0.5, inc: 5,
    steps: ['Sit with the pads on the outside of your knees.', 'Sit tall, hold the handles.', 'Push your knees outward as far as you can.', 'Return slowly.'], tip: 'Lean slightly forward to hit the upper glutes more.' }),
  E('adductor', 'Hip Adduction Machine', 'adductor', 'adductor', 'adductors', {
    pos: 'seated', grip: 'pad-legs', mot: 'legs-together', iso: true, load: 0.5, inc: 5,
    steps: ['Sit with the pads on the inside of your knees, legs apart.', 'Sit tall, hold the handles.', 'Squeeze your legs together.', 'Open slowly.'] }),
  E('cable-kickback', 'Cable Glute Kickback', 'cable-single|cable-crossover', 'glute', 'glutes', {
    pos: 'standing', grip: 'cable', mot: 'leg-back', iso: true, load: 0.08, inc: 2.5,
    steps: ['Attach an ankle strap to a low pulley and put it on one ankle.', 'Face the machine, hold it for support, slight forward lean.', 'Kick the leg straight back, squeezing the glute.', 'Return slowly. Do all reps, then switch.'] }),
  E('smith-calf', 'Smith Machine Calf Raise', 'smith', 'calf', 'calves', {
    pos: 'standing', grip: 'bar', mot: 'calf', iso: true, load: 0.6, inc: 5,
    steps: ['Bar on your upper back, balls of your feet on a plate or step.', 'Unhook the bar.', 'Rise up onto your toes as high as you can.', 'Lower your heels below the step for a stretch.'] }),
  E('leg-press-calf', 'Leg Press Calf Raise', 'leg-press', 'calf', 'calves', {
    pos: 'seated', grip: 'platform', mot: 'calf', iso: true, load: 0.8, inc: 10,
    steps: ['Sit in the leg press, put the balls of your feet on the bottom edge of the platform.', 'Legs almost straight. Keep the safety handles locked if possible.', 'Push the platform with your toes.', 'Let your heels come back for a stretch.'] }),
  E('db-calf', 'Single-Leg Dumbbell Calf Raise', 'dumbbells', 'calf', 'calves', {
    pos: 'standing', grip: 'dumbbell', mot: 'calf', iso: true, load: 0.15, inc: 2,
    steps: ['Stand on one foot on a step or plate, holding a dumbbell on the same side.', 'Hold something with the other hand for balance.', 'Rise up onto your toes.', 'Lower your heel down slowly. Do all reps, then switch.'] }),
  E('calf-machine', 'Seated Calf Raise Machine', 'calf-machine', 'calf', 'calves', {
    pos: 'seated', grip: 'pad-legs', mot: 'calf', iso: true, load: 0.4, inc: 5,
    steps: ['Sit with the pad on your lower thighs, balls of feet on the platform.', 'Release the safety lever.', 'Lift your heels as high as possible.', 'Lower slowly for a full stretch.'] }),

  // ───────── CORE ─────────
  E('plank', 'Plank', 'none', 'core', 'core', {
    pos: 'lying', grip: 'none', mot: 'hold', unit: 'sec', load: 0,
    steps: ['Forearms on the floor, elbows under shoulders.', 'Body in a straight line from head to heels.', 'Squeeze your glutes and brace your belly.', 'Hold for the time shown – breathe normally.'] }),
  E('side-plank', 'Side Plank', 'none', 'core', 'core', {
    pos: 'lying', grip: 'none', mot: 'hold', unit: 'sec', avoid: ['shoulder'], load: 0,
    steps: ['Lie on your side, elbow under shoulder.', 'Lift your hips so your body is straight.', 'Hold for the time shown.', 'Switch sides (time is per side).'] }),
  E('knee-raise', 'Arms Supported Bent Knee Raise', 'captains-chair|dip-station', 'core', 'core', {
    pos: 'hanging', grip: 'pad-arms', mot: 'core-flex', load: 0,
    steps: ['Stand in the knee-raise station, forearms on the pads, back against the pad.', 'Let your legs hang straight.', 'Raise your knees toward your chest, curling your pelvis up.', 'Lower slowly without swinging.'] }),
  E('hanging-leg-raise', 'Hanging Leg Raise', 'pullup-bar', 'core', 'core', {
    pos: 'hanging', grip: 'bar', mot: 'core-flex', lvl: 3, load: 0,
    steps: ['Hang from a pull-up bar.', 'Keep legs straight (or bent to make it easier).', 'Raise your legs to hip height or higher.', 'Lower slowly.'] }),
  E('cable-crunch', 'Kneeling Cable Crunch', 'cable-single|cable-crossover|lat-pulldown', 'core', 'core', {
    pos: 'kneeling', grip: 'cable', mot: 'core-flex', load: 0.3, inc: 2.5,
    steps: ['Set a high pulley with the rope. Kneel facing it, rope beside your head.', 'Keep your hips still.', 'Crunch down, bringing your elbows toward your knees.', 'Return slowly.'] }),
  E('woodchop', 'Wood Choppers (Cable)', 'cable-single|cable-crossover', 'core', 'core', {
    s: ['shoulders'], pos: 'standing', grip: 'cable', mot: 'core-rotate', load: 0.1, inc: 2.5,
    steps: ['Set a pulley high. Stand side-on, hold the handle with both hands.', 'Pull diagonally down across your body to the opposite hip.', 'Rotate through your torso and pivot your back foot.', 'Return slowly. Do all reps, then switch sides.'] }),
  E('db-woodchop', 'Dumbbell Wood Choppers', 'dumbbells', 'core', 'core', {
    s: ['shoulders'], pos: 'standing', grip: 'dumbbell', mot: 'core-rotate', load: 0.08, inc: 2,
    steps: ['Hold one dumbbell with both hands above one shoulder.', 'Chop it diagonally down to the opposite hip, rotating your torso.', 'Bend your knees slightly at the bottom.', 'Return to the start. Do all reps, then switch.'] }),
  E('pallof', 'Pallof Press', 'cable-single|cable-crossover', 'core', 'core', {
    pos: 'standing', grip: 'cable', mot: 'hold', load: 0.08, inc: 2.5,
    steps: ['Set a pulley at chest height. Stand side-on, hold the handle at your chest.', 'Step away so the cable is tight.', 'Press the handle straight out in front, resisting the pull.', 'Bring it back to your chest. Do all reps, then switch.'] }),
  E('dead-bug', 'Dead Bug', 'none', 'core', 'core', {
    pos: 'lying', grip: 'none', mot: 'core-flex', load: 0,
    steps: ['Lie on your back, arms up, knees bent at 90° over your hips.', 'Press your lower back into the floor.', 'Slowly extend one arm overhead and the opposite leg out.', 'Return and switch sides.'] }),
  E('decline-situp', 'Decline Sit-Up', 'decline-bench', 'core', 'core', {
    pos: 'lying', grip: 'pad-legs', mot: 'core-flex', lvl: 2, avoid: ['lowerback', 'neck'], load: 0,
    steps: ['Sit on the decline bench and hook your feet under the foot rollers.', 'Lie back until your back is on the pad, hands crossed on your chest.', 'Breathe out and curl up all the way until your upper body is upright.', 'Lower slowly, one vertebra at a time, without dropping back.'],
    tip: 'Too hard? Set a lower angle or reach your arms forward. Harder: hands by your ears, or hold a weight plate on your chest.' }),
  E('ab-machine', 'Ab Crunch Machine', 'ab-machine', 'core', 'core', {
    pos: 'seated', grip: 'handles', mot: 'core-flex', load: 0.3, inc: 5,
    steps: ['Adjust the seat, hold the handles or place arms on the pads.', 'Curl your torso forward and down.', 'Squeeze your abs.', 'Return slowly.'] }),
  E('rotary-torso', 'Rotary Torso Machine', 'rotary-torso', 'core', 'core', {
    pos: 'seated', grip: 'handles', mot: 'core-rotate', iso: true, avoid: ['lowerback'], load: 0.25, inc: 5,
    steps: ['Sit facing the handles and set the start angle to one side.', 'Brace your legs against the pads and hold the handles.', 'Turn your upper body slowly to the other side.', 'Return slowly. Do all reps, then switch sides.'], tip: 'Move slowly and keep the range comfortable for your back.' }),
  E('farmer-carry', 'Farmer\'s Carry', 'dumbbells', 'core', 'core', {
    s: ['traps', 'forearms'], pos: 'standing', grip: 'dumbbell', mot: 'carry', unit: 'sec', perHand: true, load: 0.35, inc: 2,
    steps: ['Pick up heavy dumbbells, one in each hand.', 'Stand tall, shoulders back.', 'Walk with short, steady steps for the time shown.', 'Put the weights down carefully.'] }),

  // ───────── CARDIO ─────────
  E('treadmill-intervals', 'Treadmill Intervals', 'treadmill', 'cardio', 'cardio', {
    pos: 'standing', grip: 'none', mot: 'cardio', unit: 'min', avoid: ['knee', 'ankle'],
    steps: ['2 min easy walk/jog to warm up.', 'Then repeat: 1 min fast (hard effort) + 1 min easy walk.', 'Finish with 2 min easy walking.', 'Use the side rails to step off safely when stopping.'] }),
  E('incline-walk', 'Incline Treadmill Walk', 'treadmill', 'cardio', 'cardio', {
    pos: 'standing', grip: 'none', mot: 'cardio', unit: 'min',
    steps: ['Set the incline to 8–12% and speed to 4.5–5.5 km/h.', 'Walk without holding the rails.', 'Aim for an effort where talking is possible but hard.', 'Lower the incline for the last minute.'], tip: 'Low impact and great for fat loss.' }),
  E('elliptical', 'Elliptical Cross-Trainer', 'elliptical', 'cardio', 'cardio', {
    pos: 'standing', grip: 'handles', mot: 'cardio', unit: 'min',
    steps: ['Step on and hold the moving handles.', 'Start at an easy resistance for 2 minutes.', 'Raise resistance to a steady, moderately hard effort.', 'Push and pull with your arms too.'] }),
  E('stair-climber', 'Stair Climber', 'stair-climber', 'cardio', 'cardio', {
    s: ['glutes'], pos: 'standing', grip: 'none', mot: 'cardio', unit: 'min', avoid: ['knee'],
    steps: ['Step on and start at a slow speed.', 'Stand tall; hold the rails lightly only for balance.', 'Step with your whole foot on each stair.', 'Increase speed gradually.'] }),
  E('bike', 'Recumbent Bike', 'bike', 'cardio', 'cardio', {
    pos: 'seated', grip: 'handles', mot: 'cardio', unit: 'min',
    steps: ['Adjust the seat so your knee is slightly bent at the bottom.', 'Start easy for 2 minutes.', 'Then 30 s hard / 60 s easy, or a steady moderate pace.', 'Cool down easy for the last 2 minutes.'], tip: 'Easiest on the knees.' }),
  E('upright-bike', 'Upright Bike', 'bike-upright', 'cardio', 'cardio', {
    pos: 'seated', grip: 'handles', mot: 'cardio', unit: 'min',
    steps: ['Adjust the seat so your knee is slightly bent at the bottom.', 'Start easy for 2 minutes.', 'Then 30 s hard / 60 s easy, or a steady moderate pace.', 'Cool down easy for the last 2 minutes.'] }),
  E('rower', 'Rowing Machine', 'rower', 'cardio', 'cardio', {
    s: ['back'], pos: 'seated', grip: 'handles', mot: 'cardio', unit: 'min', avoid: ['lowerback'],
    steps: ['Strap your feet in, grab the handle.', 'Push with your legs first, then lean back, then pull the arms.', 'Return in reverse: arms, body, legs.', 'Keep a steady rhythm.'] }),

  // ───────── HOME / CALISTHENICS (home: true – only on days set to Home or No equipment) ─────────
  // Push-up steps, easiest first (see PROGRESSIONS).
  E('wall-pushup', 'Wall Push-Up', 'none', 'h-push', 'chest', { home: true,
    s: ['triceps', 'shoulders'], mot: 'push-forward', avoid: ['wrist'],
    steps: ['Stand an arm\'s length from a wall, hands on it at chest height.', 'Bend your elbows and bring your chest towards the wall.', 'Push back to straight arms, body in one line.'],
    tip: 'Step further from the wall to make it harder.' }),
  E('incline-pushup', 'Incline Push-Up', 'furniture|bench-flat', 'h-push', 'chest', { home: true,
    s: ['triceps', 'shoulders', 'core'], mot: 'push-forward', avoid: ['wrist'],
    steps: ['Hands on the edge of a sturdy table, sofa or bench, a bit wider than shoulders.', 'Walk your feet back until your body is in a straight line.', 'Lower your chest to the edge, then push back up.'],
    tip: 'The lower the support, the harder it gets.' }),
  E('knee-pushup', 'Knee Push-Up', 'none', 'h-push', 'chest', { home: true,
    s: ['triceps', 'shoulders', 'core'], pos: 'lying', mot: 'push-forward', avoid: ['wrist', 'knee'],
    steps: ['Kneel with hands on the floor, a bit wider than shoulders.', 'Keep a straight line from knees to head.', 'Lower your chest to just above the floor, then push up.'] }),
  E('decline-pushup', 'Decline Push-Up', 'furniture|bench-flat', 'h-push', 'chest', { home: true, lvl: 2,
    s: ['shoulders', 'triceps', 'core'], pos: 'lying', mot: 'push-forward', avoid: ['wrist', 'shoulder'],
    steps: ['Hands on the floor, feet up on a chair, sofa or bench.', 'Keep your body straight from head to heels.', 'Lower your chest to the floor, then push up.'],
    tip: 'Works the upper chest and shoulders more.' }),
  E('archer-pushup', 'Archer Push-Up', 'none', 'h-push', 'chest', { home: true, lvl: 3,
    s: ['triceps', 'shoulders', 'core'], pos: 'lying', mot: 'push-forward', avoid: ['wrist', 'shoulder'],
    steps: ['Start in a push-up with hands very wide.', 'Lower towards one hand while the other arm stays almost straight.', 'Push back up and switch sides each rep.'],
    tip: 'A step towards the one-arm push-up.' }),
  E('diamond-pushup', 'Diamond Push-Up', 'none', 'triceps', 'triceps', { home: true, lvl: 2,
    s: ['chest', 'shoulders'], pos: 'lying', mot: 'push-forward', avoid: ['wrist', 'elbow'],
    steps: ['Hands close together under your chest, thumbs and fingers touching.', 'Lower your chest to your hands, elbows close to your body.', 'Push back up to straight arms.'],
    tip: 'Too hard? Do them from your knees.' }),
  E('pike-pushup', 'Pike Push-Up', 'none', 'v-push', 'shoulders', { home: true, lvl: 2,
    s: ['triceps'], mot: 'push-up', avoid: ['wrist', 'shoulder'],
    steps: ['Start in a push-up, then walk your feet in and lift your hips high.', 'Bend your elbows and lower the top of your head towards the floor.', 'Push back up until your arms are straight.'] }),
  E('elevated-pike-pushup', 'Feet-Up Pike Push-Up', 'furniture|bench-flat', 'v-push', 'shoulders', { home: true, lvl: 3,
    s: ['triceps'], mot: 'push-up', avoid: ['wrist', 'shoulder', 'neck'],
    steps: ['Feet on a chair or sofa, hands on the floor, hips high.', 'Lower your head towards the floor between your hands.', 'Push back up with control.'],
    tip: 'A step towards the handstand push-up.' }),
  E('band-press', 'Band Overhead Press', 'bands', 'v-push', 'shoulders', { home: true,
    s: ['triceps'], grip: 'handles', mot: 'push-up', avoid: ['shoulder'],
    steps: ['Stand on the middle of the band, ends at shoulder height.', 'Press both hands straight up over your head.', 'Lower slowly back to your shoulders.'] }),
  E('standing-db-press', 'Standing Dumbbell Shoulder Press', 'dumbbells|kettlebells', 'v-push', 'shoulders', { home: true,
    s: ['triceps', 'core'], grip: 'dumbbell', mot: 'push-up', avoid: ['shoulder', 'lowerback'], perHand: true, load: 0.12, inc: 2,
    steps: ['Stand tall with the weights at shoulder height.', 'Press up until your arms are straight, without leaning back.', 'Lower slowly to your shoulders.'] }),
  E('band-lateral', 'Band Lateral Raise', 'bands', 'side-delt', 'shoulders', { home: true, iso: true,
    grip: 'handles', mot: 'raise-arms', avoid: ['shoulder'],
    steps: ['Stand on the band, an end in each hand by your sides.', 'Raise your arms out to the sides to shoulder height, elbows soft.', 'Lower slowly.'] }),

  // Legs
  E('chair-squat', 'Sit-to-Stand (Chair Squat)', 'furniture|bench-flat', 'squat', 'quads', { home: true,
    s: ['glutes'], mot: 'leg-push', avoid: ['knee'],
    steps: ['Stand in front of a sturdy chair, feet hip-width apart.', 'Sit back and down until you lightly touch the seat.', 'Stand up by pushing through your whole foot.'],
    tip: 'Cross your arms on your chest; use your hands only if you need to.' }),
  E('air-squat', 'Bodyweight Squat', 'none', 'squat', 'quads', { home: true,
    s: ['glutes', 'hamstrings'], mot: 'leg-push', avoid: ['knee'],
    steps: ['Feet shoulder-width apart, toes slightly out.', 'Sit your hips back and down, chest up, knees over toes.', 'Go as low as feels good, then stand up.'] }),
  E('jump-squat', 'Jump Squat', 'none', 'squat', 'quads', { home: true, lvl: 2,
    s: ['glutes', 'calves'], mot: 'leg-push', avoid: ['knee', 'ankle'],
    steps: ['Squat down as in a bodyweight squat.', 'Jump up as high as you can.', 'Land softly on bent knees and go straight into the next squat.'],
    tip: 'Land quietly – soft knees protect your joints.' }),
  E('bw-reverse-lunge', 'Bodyweight Reverse Lunge', 'none', 'lunge', 'glutes', { home: true,
    s: ['quads', 'hamstrings'], mot: 'leg-push', avoid: ['knee'],
    steps: ['Stand tall, then take a big step backwards.', 'Lower your back knee towards the floor.', 'Push through the front foot to stand up. Switch legs.'] }),
  E('bw-bulgarian', 'Bodyweight Bulgarian Split Squat', 'furniture|bench-flat', 'lunge', 'quads', { home: true, lvl: 2,
    s: ['glutes'], mot: 'leg-push', avoid: ['knee'],
    steps: ['Stand in front of a chair or sofa and rest one foot behind you on it.', 'Lower your back knee towards the floor, front shin fairly upright.', 'Push up through the front foot. Do all reps, then switch legs.'] }),
  E('bw-sl-rdl', 'Single-Leg Romanian Deadlift (Bodyweight)', 'none', 'hinge', 'hamstrings', { home: true, lvl: 2,
    s: ['glutes', 'core'], mot: 'hip-hinge', avoid: ['lowerback'],
    steps: ['Stand on one leg, knee slightly bent.', 'Hinge forward at the hips while the other leg reaches back, back straight.', 'Stop when your body is near level, then stand back up. Switch legs.'],
    tip: 'Hold a wall with one hand at first for balance.' }),
  E('kb-swing', 'Kettlebell Swing', 'kettlebells|dumbbells', 'hinge', 'glutes', { home: true, lvl: 2,
    s: ['hamstrings', 'core'], grip: 'dumbbell', mot: 'hip-hinge', avoid: ['lowerback'], load: 0.16, inc: 4,
    steps: ['Feet a bit wider than shoulders, the weight held in both hands.', 'Hinge at the hips and swing the weight back between your legs.', 'Snap your hips forward to swing it to chest height. Let it fall back and repeat.'],
    tip: 'The power comes from your hips, not your arms.' }),
  E('sl-glute-bridge', 'Single-Leg Glute Bridge', 'none', 'glute', 'glutes', { home: true, lvl: 2,
    s: ['hamstrings'], pos: 'lying', mot: 'hip-thrust',
    steps: ['Lie on your back, one knee bent with the foot flat, the other leg straight.', 'Push through the heel and lift your hips until your body is straight.', 'Lower slowly. Do all reps, then switch legs.'] }),
  E('couch-hip-thrust', 'Sofa Hip Thrust', 'furniture|bench-flat', 'glute', 'glutes', { home: true, lvl: 2,
    s: ['hamstrings'], mot: 'hip-thrust',
    steps: ['Sit on the floor with your upper back against the edge of a sofa or bench.', 'Feet flat, push through your heels and lift your hips until level.', 'Squeeze your glutes at the top, then lower slowly.'],
    tip: 'Rest a dumbbell on your hips to make it harder.' }),
  E('wall-sit', 'Wall Sit', 'none', 'quad-iso', 'quads', { home: true, iso: true, unit: 'sec',
    s: ['glutes'], mot: 'leg-push', avoid: ['knee'],
    steps: ['Lean your back against a wall and slide down.', 'Stop with your knees bent about 90°, over your ankles.', 'Hold, breathing slowly.'] }),
  E('bw-calf-raise', 'Calf Raise (Bodyweight)', 'none', 'calf', 'calves', { home: true, iso: true,
    avoid: ['ankle'], mot: 'calf',
    steps: ['Stand with the balls of your feet on a step, heels hanging off. Hold on for balance.', 'Rise up onto your toes as high as you can.', 'Lower your heels slowly below the step.'] }),
  E('sl-calf-raise', 'Single-Leg Calf Raise (Bodyweight)', 'none', 'calf', 'calves', { home: true, iso: true, lvl: 2,
    avoid: ['ankle'], mot: 'calf',
    steps: ['Stand on one foot on a step, hold a wall for balance.', 'Rise up onto your toes as high as you can.', 'Lower slowly. Do all reps, then switch legs.'] }),

  // Back
  E('negative-pullup', 'Negative Pull-Up', 'pullup-bar', 'v-pull', 'back', { home: true,
    s: ['biceps'], grip: 'bar', mot: 'pull-down', avoid: ['shoulder', 'elbow'],
    steps: ['Use a chair to get your chin above the bar.', 'Lower yourself as slowly as you can, about 3–5 seconds, to straight arms.', 'Step back up and repeat.'],
    tip: 'The best way to build up to your first pull-up.' }),
  E('chinup', 'Chin-Up', 'pullup-bar', 'v-pull', 'back', { home: true, lvl: 2,
    s: ['biceps'], grip: 'bar', mot: 'pull-down', avoid: ['shoulder', 'elbow'],
    steps: ['Hang from the bar, palms facing you, hands shoulder-width apart.', 'Pull until your chin is over the bar.', 'Lower slowly to straight arms.'] }),
  E('band-pulldown', 'Band Lat Pulldown', 'bands', 'v-pull', 'back', { home: true,
    s: ['biceps'], grip: 'handles', mot: 'pull-down',
    steps: ['Fix the band high, for example over the top of a door.', 'Kneel facing it, arms reaching up.', 'Pull your elbows down to your sides, then let your arms go back up slowly.'] }),
  E('table-row', 'Table Row (Inverted Row)', 'furniture', 'h-pull', 'back', { home: true, lvl: 2,
    s: ['biceps', 'rear-delts'], pos: 'lying', grip: 'bar', mot: 'pull-toward',
    steps: ['Lie under a very sturdy table and grip its edge, hands shoulder-width.', 'Keep your body straight, heels on the floor.', 'Pull your chest up to the table edge, then lower slowly.'],
    tip: 'Test that the table cannot tip over before you start.' }),
  E('band-row', 'Band Row', 'bands', 'h-pull', 'back', { home: true,
    s: ['biceps', 'rear-delts'], pos: 'seated', grip: 'handles', mot: 'pull-toward',
    steps: ['Sit with legs straight and loop the band around your feet.', 'Pull the ends towards your waist, squeezing your shoulder blades.', 'Let your arms go forward slowly.'] }),
  E('superman', 'Superman', 'none', 'h-pull', 'back', { home: true,
    s: ['glutes'], pos: 'lying', mot: 'hip-hinge', avoid: ['lowerback'],
    steps: ['Lie face down, arms stretched out in front of you.', 'Lift your arms, chest and legs a little off the floor.', 'Hold for 2 seconds, then lower slowly.'] }),
  E('band-pull-apart', 'Band Pull-Apart', 'bands', 'rear-delt', 'rear-delts', { home: true, iso: true,
    s: ['traps'], grip: 'handles', mot: 'pull-toward',
    steps: ['Hold the band in front of you at chest height, arms straight.', 'Pull the band apart until it touches your chest.', 'Return slowly.'] }),
  E('prone-ytw', 'Prone Y-T-W Raise', 'none', 'rear-delt', 'rear-delts', { home: true, iso: true,
    s: ['traps'], pos: 'lying', mot: 'raise-arms',
    steps: ['Lie face down, forehead on a towel.', 'Lift your arms in a Y, then a T, then a W shape, thumbs up.', 'Each letter counts as one rep. Move slowly.'] }),

  // Arms
  E('band-curl', 'Band Biceps Curl', 'bands', 'biceps', 'biceps', { home: true, iso: true,
    s: ['forearms'], grip: 'handles', mot: 'curl',
    steps: ['Stand on the middle of the band, ends in your hands, palms forward.', 'Curl your hands up to your shoulders, elbows by your sides.', 'Lower slowly.'] }),
  E('band-pushdown', 'Band Triceps Pushdown', 'bands', 'triceps', 'triceps', { home: true, iso: true,
    grip: 'handles', mot: 'push-down', avoid: ['elbow'],
    steps: ['Fix the band high, for example over the top of a door.', 'Elbows by your sides, push your hands down until your arms are straight.', 'Let them come back up slowly.'] }),

  // Core
  E('hollow-hold', 'Hollow Body Hold', 'none', 'core', 'core', { home: true, lvl: 2, unit: 'sec',
    pos: 'lying', mot: 'hold', avoid: ['lowerback'],
    steps: ['Lie on your back and press your lower back into the floor.', 'Lift your shoulders and legs off the floor, arms reaching past your head.', 'Hold. Bend your knees to make it easier.'] }),
  E('mountain-climber', 'Mountain Climbers', 'none', 'core', 'core', { home: true, unit: 'sec',
    s: ['shoulders', 'quads'], pos: 'lying', mot: 'core-flex', avoid: ['wrist'],
    steps: ['Start in a push-up position, arms straight.', 'Drive one knee towards your chest, then switch legs quickly.', 'Keep your hips low and your back flat.'] }),
  E('lying-leg-raise', 'Lying Leg Raise', 'none', 'core', 'core', { home: true,
    pos: 'lying', mot: 'core-flex', avoid: ['lowerback'],
    steps: ['Lie on your back, hands under your hips.', 'Keep your legs together and raise them until they point up.', 'Lower slowly without letting your lower back arch.'] }),
  E('hanging-knee-raise', 'Hanging Knee Raise', 'pullup-bar', 'core', 'core', { home: true,
    grip: 'bar', mot: 'core-flex', avoid: ['shoulder'],
    steps: ['Hang from the bar with straight arms.', 'Pull your knees up towards your chest.', 'Lower slowly without swinging.'] }),

  // Home cardio (warm-up and finisher on Home days)
  E('jumping-jacks', 'Jumping Jacks or Marching', 'none', 'cardio', 'cardio', { home: true, unit: 'min', mot: 'cardio',
    steps: ['Jump your feet apart while raising your arms overhead, then back together.', 'For a quieter, gentler version, march on the spot with high knees.', 'Keep a steady pace you can breathe through.'] }),
];

// Steps from easiest to hardest. Once every set reaches the top of the rep range the app suggests the next
// step (planner.js nextStep), and the exercise's ⋯ sheet offers the easier and harder steps.
export const PROGRESSIONS = [
  ['wall-pushup', 'incline-pushup', 'knee-pushup', 'pushup', 'decline-pushup', 'archer-pushup'],
  ['pike-pushup', 'elevated-pike-pushup'],
  ['chair-squat', 'air-squat', 'jump-squat'],
  ['bw-reverse-lunge', 'bw-bulgarian'],
  ['glute-bridge', 'sl-glute-bridge', 'couch-hip-thrust'],
  ['negative-pullup', 'chinup', 'pullup'],
  ['superman', 'band-row', 'table-row'],
  ['dead-bug', 'plank', 'hollow-hold'],
  ['lying-leg-raise', 'hanging-knee-raise', 'hanging-leg-raise'],
  ['bw-calf-raise', 'sl-calf-raise'],
];

// Warm-up and cooldown moves (seconds each).
export const WARMUP = [
  { name: 'Easy cardio (bike, elliptical or treadmill)', sec: 180 },
  { name: 'Arm circles forward and back', sec: 30 },
  { name: 'Bodyweight squats', sec: 30 },
  { name: 'Hip circles / leg swings', sec: 30 },
  { name: 'Band or light-cable pull-aparts / face pulls', sec: 30 },
  { name: 'Light warm-up set of the first exercise', sec: 60 },
];

export const COOLDOWN = {
  chest: { name: 'Doorway chest stretch', sec: 30 },
  back: { name: 'Child\'s pose / lat stretch', sec: 30 },
  shoulders: { name: 'Cross-body shoulder stretch (each side)', sec: 40 },
  triceps: { name: 'Overhead triceps stretch (each side)', sec: 30 },
  biceps: { name: 'Wall biceps stretch', sec: 30 },
  quads: { name: 'Standing quad stretch (each side)', sec: 40 },
  hamstrings: { name: 'Seated hamstring stretch', sec: 40 },
  glutes: { name: 'Figure-four glute stretch (each side)', sec: 40 },
  calves: { name: 'Wall calf stretch (each side)', sec: 30 },
  core: { name: 'Cobra stretch', sec: 30 },
  general: { name: 'Slow deep breathing, lying down', sec: 60 },
};

// Picker motions → plain-language choices.
export const MOTIONS = {
  'push-forward': 'Push away from my chest',
  'push-up': 'Push up overhead',
  'push-down': 'Push my body up / push down (dip)',
  'pull-toward': 'Pull toward my body (row)',
  'pull-down': 'Pull down from above / pull myself up',
  'arms-together': 'Bring my arms together in front',
  'arms-apart': 'Open my arms out / back',
  'raise-arms': 'Lift my arms out to the sides',
  'shrug': 'Lift my shoulders up',
  'curl': 'Bend my elbows (curl)',
  'extend-arm': 'Straighten my elbows',
  'leg-push': 'Push with my legs (squat / press)',
  'leg-extend': 'Straighten my knees (kick up)',
  'leg-curl': 'Bend my knees (pull heels back)',
  'hip-hinge': 'Bend forward at the hips and stand up',
  'hip-thrust': 'Push my hips up',
  'leg-back': 'Kick my leg backward',
  'legs-apart': 'Push my legs apart',
  'legs-together': 'Squeeze my legs together',
  'calf': 'Rise up on my toes',
  'core-flex': 'Crunch / raise my knees',
  'core-rotate': 'Twist my torso',
  'hold': 'Hold still (anti-movement)',
  'cardio': 'Walk / run / pedal / climb',
};

// Generic how-to templates for custom machines, by motion.
export const TEMPLATES = {
  'push-forward': { pat: 'h-push', m: 'chest', s: ['triceps', 'shoulders'], steps: ['Adjust the seat so the handles line up with the middle of your chest.', 'Sit with your back flat on the pad and shoulder blades pulled back.', 'Push forward until your arms are almost straight – don\'t lock the elbows.', 'Return slowly (2–3 s) until you feel a stretch in the chest.'] },
  'push-up': { pat: 'v-push', m: 'shoulders', s: ['triceps'], steps: ['Adjust the seat so the handles start at shoulder height.', 'Back flat on the pad, core braced.', 'Press up until arms are almost straight.', 'Lower slowly back to shoulder height.'] },
  'push-down': { pat: 'triceps', m: 'triceps', s: ['chest'], steps: ['Set a weight that lets you do the reps with good form (on assisted machines more weight = easier).', 'Start with arms straight, shoulders down away from your ears.', 'Lower by bending your elbows to about 90°.', 'Push back up to straight arms.'] },
  'pull-toward': { pat: 'h-pull', m: 'back', s: ['biceps', 'rear-delts'], steps: ['Adjust the seat/chest pad so you can reach the handles with straight arms.', 'Sit tall with chest up.', 'Pull the handles toward your body, squeezing your shoulder blades together.', 'Return slowly until your arms are straight.'] },
  'pull-down': { pat: 'v-pull', m: 'back', s: ['biceps'], steps: ['Adjust the seat or knee pad so you are locked in.', 'Start with arms straight overhead.', 'Pull down, driving your elbows toward your hips.', 'Return slowly to straight arms.'] },
  'arms-together': { pat: 'chest-iso', m: 'chest', s: [], iso: true, steps: ['Adjust the seat so handles are at chest height.', 'Slight bend in the elbows and keep it fixed.', 'Bring your arms together in front of your chest and squeeze.', 'Open slowly until you feel a stretch.'] },
  'arms-apart': { pat: 'rear-delt', m: 'rear-delts', s: ['traps'], iso: true, steps: ['Adjust so the handles are at shoulder height.', 'Arms almost straight in front of you.', 'Sweep your arms back and out until in line with your body.', 'Return slowly.'] },
  'raise-arms': { pat: 'side-delt', m: 'shoulders', s: [], iso: true, steps: ['Adjust so the pivot lines up with your shoulders.', 'Start with arms by your sides.', 'Lift your arms out to the sides up to shoulder height.', 'Lower slowly.'] },
  'shrug': { pat: 'traps', m: 'traps', s: [], iso: true, steps: ['Stand or sit tall holding the handles.', 'Lift your shoulders straight up toward your ears.', 'Pause 1 s at the top.', 'Lower slowly.'] },
  'curl': { pat: 'biceps', m: 'biceps', s: ['forearms'], iso: true, steps: ['Adjust so your elbows line up with the machine\'s pivot point.', 'Upper arms on the pad, palms up.', 'Curl the handles up toward your shoulders.', 'Lower slowly to almost straight arms.'] },
  'extend-arm': { pat: 'triceps', m: 'triceps', s: [], iso: true, steps: ['Adjust so your elbows line up with the machine\'s pivot point.', 'Upper arms on the pad.', 'Straighten your arms fully and squeeze the triceps.', 'Return slowly.'] },
  'leg-push': { pat: 'squat', m: 'quads', s: ['glutes', 'hamstrings'], steps: ['Adjust the seat/back pad so your knees are at ~90° at the start.', 'Feet shoulder-width, back flat on the pad.', 'Push through your whole foot until legs are almost straight.', 'Lower slowly – don\'t let your lower back lift off the pad.'] },
  'leg-extend': { pat: 'quad-iso', m: 'quads', s: [], iso: true, steps: ['Line your knees up with the pivot point.', 'Pad just above your ankles.', 'Straighten your legs and squeeze.', 'Lower slowly.'] },
  'leg-curl': { pat: 'ham-iso', m: 'hamstrings', s: [], iso: true, steps: ['Line your knees up with the pivot point.', 'Pad just above your heels.', 'Curl your heels back as far as possible.', 'Return slowly.'] },
  'hip-hinge': { pat: 'hinge', m: 'hamstrings', s: ['glutes', 'back'], steps: ['Set up so the pad or weight is at hip level.', 'Keep your back flat, knees slightly bent.', 'Bend forward at the hips until you feel the hamstrings stretch.', 'Squeeze your glutes to come back up.'] },
  'hip-thrust': { pat: 'glute', m: 'glutes', s: ['hamstrings'], steps: ['Upper back on the pad, pad or belt across your hips.', 'Feet flat, knees bent ~90° at the top.', 'Push your hips up and squeeze your glutes.', 'Lower slowly.'] },
  'leg-back': { pat: 'glute', m: 'glutes', s: [], iso: true, steps: ['Set the pad behind your heel or knee.', 'Hold the handles and keep your torso still.', 'Push your leg back and squeeze the glute.', 'Return slowly. Switch legs.'] },
  'legs-apart': { pat: 'glute', m: 'glutes', s: [], iso: true, steps: ['Sit with pads on the outside of your knees.', 'Sit tall.', 'Push your knees apart.', 'Return slowly.'] },
  'legs-together': { pat: 'adductor', m: 'adductors', s: [], iso: true, steps: ['Sit with pads on the inside of your knees.', 'Sit tall.', 'Squeeze your legs together.', 'Return slowly.'] },
  'calf': { pat: 'calf', m: 'calves', s: [], iso: true, steps: ['Balls of your feet on the edge of the platform.', 'Legs straight (standing) or pad on thighs (seated).', 'Rise as high as you can onto your toes.', 'Lower slowly for a full stretch.'] },
  'core-flex': { pat: 'core', m: 'core', s: [], steps: ['Adjust the seat and hold the handles.', 'Breathe out and crunch forward, curling your spine.', 'Squeeze your abs for 1 s.', 'Return slowly.'] },
  'core-rotate': { pat: 'core', m: 'core', s: [], steps: ['Sit or stand tall, hips facing forward.', 'Rotate your torso to one side against the resistance.', 'Return slowly to the middle.', 'Do all reps, then switch sides.'] },
  'hold': { pat: 'core', m: 'core', s: [], steps: ['Get into position with a braced core.', 'Hold still against the resistance.', 'Breathe steadily.', 'Release slowly.'] },
  'cardio': { pat: 'cardio', m: 'cardio', s: [], steps: ['Start at an easy level for 2 minutes.', 'Increase to a moderately hard effort.', 'Keep a steady rhythm and good posture.', 'Finish with 2 minutes easy.'] },
};

export const PATTERN_NAMES = {
  'h-push': 'Chest press', 'v-push': 'Shoulder press', 'h-pull': 'Row', 'v-pull': 'Pulldown',
  'chest-iso': 'Chest fly', 'side-delt': 'Side delts', 'rear-delt': 'Rear delts', traps: 'Traps',
  biceps: 'Biceps', triceps: 'Triceps', squat: 'Squat / leg press', hinge: 'Hip hinge',
  lunge: 'Single-leg', 'quad-iso': 'Quads', 'ham-iso': 'Hamstrings', glute: 'Glutes',
  adductor: 'Inner thighs', calf: 'Calves', core: 'Core', cardio: 'Cardio',
};
