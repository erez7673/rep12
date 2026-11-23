// Exercise animations: a simple side-view character doing the movement on a line drawing of the equipment,
// with the muscles the exercise works lit up (main muscle bright, helper muscles lighter).
// Drawn as SVG by the app itself – no video files, works offline and follows light/dark mode.
//
// Each exercise is described by where the body sits and where the hands and feet go, at the start (p = 0)
// and the end of the effort (p = 1). Elbows and knees are worked out from that (two-joint inverse kinematics),
// so the hands stay on the handles and the feet on the platform while the equipment moves.
import { MUSCLES } from './exercises.js';
import { esc, motionReduced } from './ui.js';
import { t } from './i18n.js';

// Body sizes in drawing units (the picture is 260 × 220, floor at y = 205).
const L = { torso: 60, neck: 8, head: 12, upper: 32, fore: 30, thigh: 46, shin: 44, foot: 13 };
const FLOOR = 205;

// ── Small geometry helpers ──
const rad = (d) => d * Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (v, k) => [v[0] * k, v[1] * k];
const dir = (deg) => [Math.cos(rad(deg)), Math.sin(rad(deg))];
const lerp = (a, b, p) => a + (b - a) * p;
const lerpPt = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
const f = (n) => Math.round(n * 10) / 10;

// Two-joint reach: from root towards target with segment lengths a and b. bend +1/−1 picks the side of the joint.
function reach(root, target, a, b, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const d = Math.max(Math.abs(a - b) + 0.5, Math.min(a + b - 0.5, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const joint = add(root, mul([Math.cos(base + bend * alpha), Math.sin(base + bend * alpha)], a));
  const end = add(root, mul([Math.cos(base), Math.sin(base)], d));
  return [joint, end];
}

// ── SVG pieces ──
const line = (a, b, cls, w) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" class="${cls}" stroke-width="${w}"/>`;
const frame = (a, b, w = 4) => line(a, b, 'eq', w);
const pad = (a, b, w = 10) => line(a, b, 'pad', w);
const circ = (c, r, cls) => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" class="${cls}"/>`;
const rect = (x, y, w, h, cls = 'eq-box') => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="3" class="${cls}"/>`;
const floor = () => frame([14, FLOOR], [246, FLOOR], 3);

// Weight stack inside a tower: the top plates rise with the effort.
function stack(x, y, w, h, p, lift = 28) {
  let s = rect(x, y, w, h);
  const plates = 7, ph = 6, bottom = y + h - 6;
  for (let i = 0; i < plates; i++) {
    const up = i >= plates - 3 ? lift * p : 0;
    s += `<rect x="${f(x + 4)}" y="${f(bottom - (i + 1) * (ph + 1) - up)}" width="${w - 8}" height="${ph}" rx="1.5" class="plate"/>`;
  }
  return s + frame([x + w / 2, y + 4], [x + w / 2, bottom - plates * (ph + 1) - lift * p], 1.5);
}

// Muscle highlight: a strip along part of a body segment, on its front (+1) or back (−1) side.
function strip(a, b, side, kind, from, to, off, w, cls) {
  const u = unit(a, b);
  // "Front" of the torso and shin is the left-hand normal, of thigh and arms the right-hand normal (facing right).
  const n = kind === 'torso' ? [-u[1], u[0]] : [u[1], -u[0]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const o = mul(n, off * side);
  return line(add(add(a, mul(u, len * from)), o), add(add(a, mul(u, len * to)), o), cls, w);
}

function muscles(j, list, cls) {
  let s = '';
  for (const m of list) {
    if (m === 'chest') s += strip(j.hip, j.sh, 1, 'torso', 0.62, 0.9, 6, 9, cls);
    else if (m === 'core') s += strip(j.hip, j.sh, 1, 'torso', 0.12, 0.55, 6, 8, cls);
    else if (m === 'back') s += strip(j.hip, j.sh, -1, 'torso', 0.4, 0.88, 6, 10, cls);
    else if (m === 'traps') s += strip(j.hip, j.sh, -1, 'torso', 0.86, 1.08, 5, 7, cls);
    else if (m === 'shoulders') s += circ(j.sh, 7.5, cls + ' dot');
    else if (m === 'rear-delts') s += circ(add(j.sh, mul(j.back, 4)), 6, cls + ' dot');
    else if (m === 'biceps') s += strip(j.sh, j.el, 1, 'limb', 0.2, 0.85, 2.5, 6, cls);
    else if (m === 'triceps') s += strip(j.sh, j.el, -1, 'limb', 0.15, 0.85, 2.5, 6, cls);
    else if (m === 'forearms') s += strip(j.el, j.hand, 1, 'limb', 0.15, 0.8, 0, 6, cls);
    else if (m === 'quads') s += strip(j.hip, j.knee, 1, 'limb', 0.18, 0.88, 3.5, 8, cls);
    else if (m === 'hamstrings') s += strip(j.hip, j.knee, -1, 'limb', 0.18, 0.88, 3.5, 8, cls);
    else if (m === 'adductors') s += strip(j.hip, j.knee, 1, 'limb', 0.15, 0.6, 0, 6, cls);
    else if (m === 'glutes') s += circ(add(j.hip, mul(j.back, 6)), 8.5, cls + ' dot');
    else if (m === 'calves') s += strip(j.knee, j.ankle, -1, 'torso', 0.1, 0.6, 3, 7, cls);
  }
  return s;
}

// ── The character ──
function body(def, p, ex) {
  const t = def.torso(p);
  const td = dir(t.ang);
  const hip = t.hip, sh = add(hip, mul(td, L.torso));
  const head = add(sh, mul(td, L.neck + L.head));
  const back = [td[1], -td[0]]; // points to the character's back
  const far = [-4, -3];         // the limbs on the far side are drawn a little up and back, lighter

  const limbs = (o) => {
    const S = add(sh, o), H = add(hip, o);
    const [el, hand] = reach(S, add(def.hand(p), o), L.upper, L.fore, def.armBend);
    const [knee, ankle] = reach(H, add(def.foot(p), o), L.thigh, L.shin, def.legBend);
    const toe = add(ankle, mul(def.footDir ? def.footDir(p) : [1, 0], L.foot));
    return { S, H, el, hand, knee, ankle, toe };
  };
  const F = limbs(far), N = limbs([0, 0]);
  const draw = (k, cls) => line(k.H, k.knee, cls, 14) + line(k.knee, k.ankle, cls, 10) + line(k.ankle, k.toe, cls, 7)
    + line(k.S, k.el, cls, 10) + line(k.el, k.hand, cls, 8.5) + circ(k.hand, 4.5, cls + '-fill');
  const j = { hip, sh, back, el: N.el, hand: N.hand, knee: N.knee, ankle: N.ankle };

  // Torso muscles go under the near arm, limb and shoulder muscles on top.
  const lit = (keys) => muscles(j, (ex.s || []).filter(m => keys.includes(m)), 'mus sec') + muscles(j, [ex.m].filter(m => keys.includes(m)), 'mus pri');
  const TORSO = ['chest', 'core', 'back', 'traps', 'glutes'];
  const all = [ex.m, ...(ex.s || [])];
  return draw(F, 'far')
    + line(hip, sh, 'skin', 22) + line(sh, add(sh, mul(td, L.neck + 2)), 'skin', 8) + circ(head, L.head, 'skin-fill')
    + lit(TORSO)
    + draw(N, 'skin')
    + lit(all.filter(m => !TORSO.includes(m)));
}

// ── Exercises ──
// torso(p): hip position and torso angle (degrees, −90 = straight up, facing right).
// hand(p) / foot(p): where the hands and feet are. back(p) is drawn behind the body, front(p) in front of it.
const pivotArc = (c, r, a0, a1) => (p) => add(c, mul(dir(lerp(a0, a1, p)), r));

const chestHand = (p) => lerpPt([128, 99], [164, 97], p); // handles at mid-chest height, pushed straight forward
const legDir = dir(-40), legSide = [-legDir[1], legDir[0]];    // leg press sled runs at about 40°
const legHip = [115, 165];
const legFoot = (p) => add(legHip, mul(legDir, lerp(62, 86, p)));
const pullHand = (p) => lerpPt([128, 42], [134, 106], p); // from arms straight overhead to the upper chest

const DEFS = {
  'machine-chest-press': {
    words: ['Push forward', 'Return slowly'],
    torso: () => ({ hip: [112, 150], ang: -98 }),
    hand: chestHand, foot: () => [150, FLOOR - 2], armBend: 1, legBend: -1,
    back: (p) => stack(44, 34, 30, 171, p) + frame([74, 40], [110, 20], 5) + circ([110, 20], 5, 'eq-fill')
      + pad([99, 147], [91, 86], 11) + frame([95, 120], [74, 120]) + pad([92, 157], [138, 157], 9)
      + frame([115, 161], [115, FLOOR]) + floor(),
    front: (p) => { const h = chestHand(p); return frame([110, 20], h, 6) + frame([h[0], h[1] - 7], [h[0], h[1] + 7], 5); },
  },
  'leg-press': {
    words: ['Push the platform away', 'Bend your knees slowly'],
    torso: () => ({ hip: legHip, ang: -140 }),
    hand: () => [112, 160], foot: legFoot, armBend: 1, legBend: -1,
    footDir: () => mul(legSide, -1),
    back: (p) => {
      const c = add(legFoot(p), mul(legDir, 5));
      const rail = add(add(legHip, mul(legDir, 62)), mul(legSide, 42));
      return frame(add(rail, mul(legDir, -70)), add(rail, mul(legDir, 75)), 5)
        + frame(add(rail, mul(legDir, -70)), [add(rail, mul(legDir, -70))[0], FLOOR], 5)
        + frame(add(rail, mul(legDir, 75)), [add(rail, mul(legDir, 75))[0], FLOOR], 5)
        + frame(add(c, mul(legSide, 20)), add(c, mul(legSide, 42)), 5)
        + circ(add(add(c, mul(legDir, 16)), mul(legSide, 26)), 15, 'plate-big') + circ(add(add(c, mul(legDir, 16)), mul(legSide, 26)), 3, 'eq-fill')
        + pad(add(legHip, [6, 10]), add(add(legHip, mul(dir(-140), L.torso)), [6, 10]), 11) + pad([102, 177], [138, 172], 9)
        + frame([110, 180], [110, FLOOR]) + frame([112, 158], [112, 172], 4) + floor();
    },
    front: (p) => { const c = add(legFoot(p), mul(legDir, 5)); return frame(add(c, mul(legSide, -24)), add(c, mul(legSide, 22)), 7); },
  },
  'lat-pulldown': {
    words: ['Pull the bar to your chest', 'Let it rise slowly'],
    torso: () => ({ hip: [120, 160], ang: -100 }),
    hand: pullHand, foot: () => [170, FLOOR - 2], armBend: 1, legBend: -1,
    back: (p) => stack(196, 12, 28, 193, p, 30) + frame([150, 12], [224, 12], 5) + circ([150, 17], 5, 'eq-fill')
      + frame(add(pullHand(p), [0, -2]), [150, 17], 1.8)
      + pad([100, 166], [142, 166], 9) + frame([121, 170], [121, FLOOR]) + frame([164, 142], [196, 142], 4) + floor(),
    front: (p) => { const h = pullHand(p); return frame([h[0] - 12, h[1] + 3], [h[0] + 12, h[1] - 1], 5) + circ([162, 147], 7, 'pad-fill'); },
  },
};

// Exercises with a 3D video clip in media/anim/<id>-m.mp4 and <id>-f.mp4 (male and female mannequin).
// A clip replaces the drawn animation; the profile's sex picks which one is shown.
const VIDEOS = new Set([
  'leg-press',
  // Batch 1
  'machine-chest-press', 'machine-shoulder-press', 'pec-deck', 'lat-pulldown', 'seated-cable-row', 'machine-row',
  'leg-extension', 'leg-curl', 'hack-squat', 'hip-thrust-machine',
  // Batch 2
  'bb-bench', 'smith-bench', 'db-bench', 'db-incline', 'smith-incline',
  'plate-chest-press', 'plate-incline-press', 'pushup', 'cable-fly', 'db-fly',
  // Batch 3
  'db-shoulder-press', 'smith-ohp', 'bb-ohp', 'arnold-press', 'db-lateral', 'cable-lateral',
  'face-pull', 'db-rear-fly', 'close-pulldown', 'assisted-chin',
  // Batch 4
  'reverse-pec-deck', 'pullup', 'straight-arm-pulldown', 'crossover-row', 'plate-row',
  'db-row', 'incline-db-row', 'bb-row', 'trx-row', 'db-shrug',
  // Batch 5
  'smith-shrug', 'db-curl', 'hammer-curl', 'ez-curl', 'preacher-curl', 'cable-curl',
  'incline-db-curl', 'rope-pushdown', 'bar-pushdown', 'overhead-cable-ext',
  // Batch 6
  'db-overhead-ext', 'skull-crusher', 'close-grip-smith', 'assisted-dip', 'triceps-machine',
  'bench-dip', 'bb-squat', 'smith-squat', 'goblet-squat', 'sumo-squat',
  // Batch 7
  'rdl', 'db-rdl', 'smith-rdl', 'deadlift', 'back-ext', 'cable-pull-through', 'db-lunge',
  'reverse-lunge', 'split-squat', 'stepup',
  // Batch 8
  'hip-thrust', 'smith-hip-thrust', 'glute-bridge', 'abductor', 'adductor', 'cable-kickback',
  'db-calf', 'calf-machine',
  // Batch 9
  'cable-fly-low', 'cable-fly-high', 'incline-db-fly', 'smith-split-squat', 'plank', 'side-plank',
  'knee-raise', 'hanging-leg-raise', 'cable-crunch', 'dead-bug',
]);

export const hasClip = (id) => VIDEOS.has(id);
export const hasAnim = (id) => VIDEOS.has(id) || !!DEFS[id];

// Where the effort is in the loop: push (1.1 s), hold, return slowly (1.6 s), pause.
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
function phase(ms) {
  const u = (ms / 1000) % 3.4;
  if (u < 1.1) return [ease(u / 1.1), 0];
  if (u < 1.4) return [1, 0];
  if (u < 3.0) return [1 - ease((u - 1.4) / 1.6), 1];
  return [0, 1];
}

export function svgFor(id, ex, p) {
  const d = DEFS[id];
  return (d.back?.(p) || '') + body(d, p, ex) + (d.front?.(p) || '');
}

// Markup for an exercise's animation and muscle legend. Call startAnims() after it is on the page.
export function animHTML(ex, sex) {
  if (!hasAnim(ex.id)) return '';
  const leg = (cls, list) => list.map(m => `<span><i class="${cls}"></i>${esc(MUSCLES[m] || m)}</span>`).join('');
  if (VIDEOS.has(ex.id)) {
    const f = `media/anim/${ex.id}-${sex === 'male' ? 'm' : 'f'}`;
    return `<figure class="anim vid">
      <video src="${f}.mp4" poster="${f}.jpg" ${motionReduced() ? 'controls preload="metadata"' : 'autoplay loop preload="auto"'} muted playsinline aria-label="${esc(t('{name} animation', { name: ex.name }))}"></video>
      <figcaption><span class="legend">${leg('pri', [ex.m])}${leg('sec', ex.s || [])}</span></figcaption>
    </figure>`;
  }
  return `<figure class="anim" data-anim="${ex.id}">
      <svg viewBox="0 0 260 220" role="img" aria-label="${esc(t('{name} animation', { name: ex.name }))}">${svgFor(ex.id, ex, 0)}</svg>
      <figcaption><b data-anim-word>${esc(t(DEFS[ex.id].words[0]))}</b>
        <span class="legend">${leg('pri', [ex.m])}${leg('sec', ex.s || [])}</span></figcaption>
    </figure>`;
}

// Runs every animation on the page; each one stops by itself when its element is removed.
export function startAnims(exById) {
  for (const el of document.querySelectorAll('[data-anim]')) {
    if (el.dataset.running || motionReduced()) continue; // reduced motion: the first frame stays
    el.dataset.running = '1';
    const id = el.dataset.anim, ex = exById(id), svg = el.querySelector('svg'), word = el.querySelector('[data-anim-word]');
    let lastWord = 0;
    const t0 = performance.now();
    const step = (now) => {
      if (!el.isConnected) return;
      const [p, w] = phase(now - t0);
      svg.innerHTML = svgFor(id, ex, p);
      if (w !== lastWord) { lastWord = w; word.textContent = t(DEFS[id].words[w]); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
