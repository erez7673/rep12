// AI personal coaches (Mia and Lucas): a friendly avatar with a speech bubble.
// No AI runs here: the words are fixed, translated texts picked by simple rules (see COACH-USAGE-PLAN.md).
// Always optional: per phone (state.settings.coach = a key of COACHES or 'none', coachStyle = 'full' | 'key').
import { state, save, profile, exById } from './store.js';
import { t, unitText } from './i18n.js';
import { esc, icon, register, sheet, closeSheet, motionReduced } from './ui.js';
import { say, speakOn } from './speak.js';
import { rerender } from './app.js';
import { dayFocus, planPhase, isCustom, currentWeek } from './planner.js';
import { WARMUP, COOLDOWN } from './exercises.js';

// Switch to true when docs/media/coach/ has the approved pictures and clips (<coach>-idle.jpg, -letsgo.mp4 ...).
// Until then the whole feature stays hidden on the public site (testing elsewhere: set state.settings.coachPreview = true).
const READY = true;
// On this computer and on the home network (a phone opening http://192.168.x.x:8765) the coach is always on, so it can be
// tried before the switch is flipped. The public site (github.io) never matches.
// Coach media version: bump when clips or pictures are replaced, so phones don't keep playing old copies.
const MV = '?v=2';
const DEV_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[\w-]+\.local)$/;
export const isDevHost = (host = globalThis.location?.hostname || '') => DEV_HOST.test(host);
export const coachAvailable = () => READY || isDevHost() || !!state.settings.coachPreview;

export const COACHES = {
  mia: { name: 'Mia' }, lucas: { name: 'Lucas' }, amara: { name: 'Amara' },
  kenji: { name: 'Kenji' }, priya: { name: 'Priya' }, mateo: { name: 'Mateo' },
};
export const coachKey = () => (coachAvailable() && COACHES[state.settings.coach]) ? state.settings.coach : null;
export const coachOn = () => !!coachKey();
export const coachName = () => COACHES[coachKey()]?.name || '';
// "Full" shows tips on My Plan, the day preview, the rest card and the exercise page; "key moments" only the start and the finish.
export const coachFull = () => coachOn() && state.settings.coachStyle !== 'key';

const TRAITS = {
  mia: () => t('Warm and upbeat'), lucas: () => t('Calm and steady'), amara: () => t('Warm and energetic'),
  kenji: () => t('Calm and precise'), priya: () => t('Cheerful and encouraging'), mateo: () => t('Playful and full of energy'),
};
const trait = (k) => TRAITS[k]?.() || '';

// The few lines that differ between the coaches (everything else is shared and neutral).
const SIG = {
  mia: { greet: () => t('Hi, I\'m Mia! I\'ll cheer you on.'), start: () => t('Let\'s go!'), finish: () => t('Amazing work today!') },
  lucas: { greet: () => t('I\'m Lucas. We train steady, one set at a time.'), start: () => t('Time to train.'), finish: () => t('Well fought. Strong as a longship.') },
  amara: { greet: () => t('I\'m Amara. You\'ve got more in you than you think.'), start: () => t('Let\'s do this!'), finish: () => t('That\'s how it\'s done. Proud of you!') },
  kenji: { greet: () => t('I\'m Kenji. Good form first, the weight will follow.'), start: () => t('Focus. One good rep at a time.'), finish: () => t('Clean work today. Well done.') },
  priya: { greet: () => t('Hi, I\'m Priya! Every small win counts.'), start: () => t('You\'ve got this!'), finish: () => t('Another win for you today!') },
  mateo: { greet: () => t('Hey, I\'m Mateo! You show up, I bring the energy.'), start: () => t('Let\'s get moving!'), finish: () => t('You showed up and crushed it!') },
};
const sig = (moment, k = coachKey()) => SIG[k]?.[moment]?.() || '';

const TIPS = [
  () => t('Warm up first: a few easy sets before your working weight protect your joints.'),
  () => t('Slow and controlled beats heavy and sloppy. Lower the weight for two seconds.'),
  () => t('Breathe out when you push, breathe in when you lower.'),
  () => t('Drink some water between sets.'),
  () => t('Sleep is when muscles grow. Aim for seven hours or more.'),
  () => t('Add weight only when every rep of every set felt good.'),
  () => t('Skipped a day? Just do the next workout. One missed day changes nothing.'),
  () => t('Keep your back straight and your belly tight on every lift.'),
  () => t('Rest 60 to 90 seconds between sets so you can lift well on the next one.'),
  () => t('Log every set. What you write down is what you can beat next week.'),
  () => t('A short walk after training helps you recover.'),
  () => t('Pain is not the same as effort. If something hurts, stop or swap the exercise.'),
];
const PHASE_TIPS = {
  base: () => t('Weeks 1–4: learn the movements and find your working weights. Don\'t chase heavy yet.'),
  build: () => t('Weeks 5–8: a few more reps per set. Add weight only when every rep feels good.'),
  peak: () => t('Weeks 9–11: heavier weights and fewer reps. Stay in control.'),
  deload: () => t('Week 12 is lighter on purpose. Recover, then start the next plan.'),
};

// Tip of the day: changes every day; app-built plans also get a tip for their current phase.
export function dailyTip(p) {
  const pool = [...TIPS];
  if (p?.plan && !isCustom(p.plan)) pool.push(PHASE_TIPS[planPhase(p.plan, currentWeek(p.plan)).key] || TIPS[0]);
  const d = new Date();
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
  return pool[day % pool.length]();
}

// ── Pieces of markup ──
// The coach's picture: the initial shows until the picture loads (and stays if there is none).
export const avatarHTML = (size = 40, k = coachKey()) => !k ? '' :
  `<span class="coach-av" style="--s:${size}px" aria-hidden="true"><b>${esc(COACHES[k].name[0])}</b><img src="media/coach/${k}-idle.jpg${MV}" alt="" onerror="this.remove()"></span>`;
const note = (text, size = 40, cls = '') => `<div class="coach-note ${cls}">${avatarHTML(size)}<p>${esc(text)}</p></div>`;
// A full-screen clip of the coach (portrait 3:4, the whole figure, edges fading into the dimmed screen).
// Its first frame (<coach>-<id>.jpg) shows under it, and alone when the clip can't load or Reduce motion is on.
const stageHTML = (k, id) => `<span class="coach-stage" aria-hidden="true"><img src="media/coach/${k}-${id}.jpg${MV}" alt="" onerror="this.remove()">${motionReduced() ? '' : `<video src="media/coach/${k}-${id}.mp4${MV}" muted autoplay playsinline onerror="this.remove()"></video>`}</span>`;
const closeX = () => `<button class="iconbtn sheet-x" data-act="sheet-close" aria-label="${t('Close')}">${icon.x}</button>`;

// My Plan: today's tip, or (for someone who has not chosen yet) a card that offers the coach.
export function coachPlanCard(p) {
  if (!coachAvailable() || !p?.plan) return '';
  if (coachFull()) return `<button class="coachcard" data-act="coach-open">${avatarHTML(44)}<span><b>${esc(coachName())}</b><small>${esc(dailyTip(p))}</small></span>${icon.chev}</button>`;
  if (!state.settings.coach && !state.settings.coachAsked)
    return `<button class="coachcard meet" data-act="coach-meet"><span class="coach-pair">${Object.keys(COACHES).map(k => avatarHTML(32, k)).join('')}</span><span><b>${t('Meet your coach')}</b><small>${t('Pick a coach to cheer you on, or skip.')}</small></span>${icon.chev}</button>`;
  return '';
}
export const coachCardShown = () => coachFull();

export const coachDayLine = (day) => coachFull() ? note(t('Today: {focus}. Warm up first and take your time.', { focus: dayFocus(day) })) : '';

// The rest card of a workout: a tip for the exercise that comes next (its own tip, else the tip of the day).
// On every rest the coach breathes calmly in a small looping clip, with a reminder to breathe.
export function coachRest(it) {
  if (!coachFull()) return '';
  const own = exById(it?.exId)?.tip;
  const tip = esc(own ? unitText(t(own)) : dailyTip(profile()));
  const k = coachKey();
  if (!motionReduced())
    return `<div class="coach-rest breathe"><span class="coach-clip" aria-hidden="true"><img src="media/coach/${k}-breathe.jpg${MV}" alt="" onerror="this.remove()"><video src="media/coach/${k}-breathe.mp4${MV}" muted autoplay loop playsinline onerror="this.remove()"></video></span><p><b>${t('Breathe slowly and recover.')}</b> ${tip}</p></div>`;
  return `<div class="coach-rest">${avatarHTML(40)}<p>${tip}</p></div>`;
}

// The note on the workout summary: the coach and the finish line; tapping it plays the cheer again.
export const coachFinish = () => coachOn() ? `<button class="coach-note finish" data-act="coach-cheer">${avatarHTML(56)}<p>${esc(sig('finish'))}</p></button>` : '';
export const coachTipCard = (text) => coachFull()
  ? `<div class="card tip coach-tip">${avatarHTML(36)}<div><small>${t('Tip from {name}', { name: coachName() })}</small>${esc(text)}</div></div>` : '';
export const coachProfileRow = () => !coachAvailable() ? '' :
  `<button class="eqrow coach-row" data-act="coach-open"><span>${t('Coach')}</span><span class="muted">${esc(coachName() || t('No coach'))} ${icon.chev}</span></button>`;
export const coachSettingsBlock = () => !coachAvailable() ? '' :
  `<h3>${t('Coach')}</h3><div class="card list"><button class="eqrow" data-act="coach-open"><span>${esc(coachName() || t('No coach'))}</span>${icon.chev}</button></div>`;

// ── Moments ──
// The coach fills the screen for one clip (about 5 s): "Let's go!" when a workout starts, the cheer when it is finished.
// A tap anywhere closes it; it also closes by itself when the clip ends (after 2.5 s with Reduce motion).
// A coach without a clean clip for a moment uses another of their own clips (Lucas's high five kept adding a wristband
// or losing his tattoo, so he cheers instead).
const CLIP_STANDIN = { lucas: { highfive: 'cheer' } };
// onClose runs once the moment is gone (used to start the app tour after the Meet card).
function moment(id, line, onClose) {
  const k = coachKey();
  if (!k) { onClose?.(); return; }
  document.getElementById('coach-overlay')?.remove();
  const el = document.createElement('div');
  el.id = 'coach-overlay';
  el.setAttribute('role', 'status');
  el.innerHTML = `<button class="iconbtn sheet-x" aria-label="${t('Close')}">${icon.x}</button>${stageHTML(k, CLIP_STANDIN[k]?.[id] || id)}<p>${esc(line)}</p>`;
  let timer;
  let done = false;
  const close = () => { if (done) return; done = true; clearTimeout(timer); el.classList.add('out'); setTimeout(() => { el.remove(); onClose?.(); }, 250); };
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); close(); });
  const v = el.querySelector('video');
  if (v) v.addEventListener('ended', () => { timer = setTimeout(close, 400); });
  timer = setTimeout(close, v ? 6500 : 2500); // fallback when the clip never plays
  document.body.append(el);
  if (speakOn()) say(line);
}
export const coachStart = () => moment('letsgo', sig('start'));

// ── Warm-up and cool-down moves shown by the coaches ──
// One coach per move, spread across all six (the user's choice, 2026-11-24); everyone sees the same clip, whichever
// coach they picked (or none). Made in Google Flow: warm-up moves are clips (media/coach/moves/<id>.mp4 + .jpg first
// frame); stretches are held still, so they are a picture only (<id>.jpg), because the video model kept changing the pose.
// A move gets its button only once its id is in MOVES_READY ('clip' or 'still') and the approved files are committed.
export const MOVE_COACH = {
  'arm-openers': 'mateo', 'warm-squats': 'amara', march: 'priya', 'overhead-reach': 'lucas',
  'chest-stretch': 'mia', 'childs-pose': 'kenji', 'shoulder-stretch': 'mia', 'triceps-stretch': 'priya',
  'behind-back-stretch': 'mateo', 'quad-stretch': 'amara', 'hamstring-stretch': 'kenji', 'glute-stretch': 'mia',
  'calf-stretch': 'lucas', cobra: 'priya', breathing: 'kenji',
};
const MOVES_READY = { 'arm-openers': 'clip', 'warm-squats': 'clip', march: 'clip', 'overhead-reach': 'clip', cobra: 'still', 'quad-stretch': 'still', 'shoulder-stretch': 'still', 'glute-stretch': 'still', 'calf-stretch': 'still', 'chest-stretch': 'still', 'triceps-stretch': 'still', 'hamstring-stretch': 'still', 'childs-pose': 'still', breathing: 'clip', 'behind-back-stretch': 'still' };
export const moveHasClip = (id) => !!id && !!MOVES_READY[id] && coachAvailable();
const moveOf = (id) => [...WARMUP, ...Object.values(COOLDOWN)].find(m => m.id === id);
const moveName = (id) => moveOf(id)?.name || '';
// Small play button for a move in a list (nothing when the move has no clip yet).
export const movePlay = (m) => moveHasClip(m?.id)
  ? `<button class="iconbtn move-play" data-act="move-clip" data-id="${m.id}" aria-label="${esc(t('Show me: {move}', { move: moveName(m.id) }))}">${icon.play}</button>` : '';
export function openMoveClip(id) {
  const k = MOVE_COACH[id];
  if (!k || !moveHasClip(id)) return;
  const src = `media/coach/moves/${id}`;
  sheet(`<button class="iconbtn sheet-x" data-act="sheet-close" aria-label="${t('Close')}">${icon.x}</button>
    <h2>${esc(moveName(id))}</h2>
    <div class="move-clip">${motionReduced() || MOVES_READY[id] === 'still' ? `<img src="${src}.jpg${MV}" alt="">`
      : `<video src="${src}.mp4${MV}" poster="${src}.jpg${MV}" muted autoplay loop playsinline></video>`}</div>
    <p class="muted small">${t('{coach} shows you how.', { coach: esc(COACHES[k].name) })}</p>
    ${moveOf(id)?.how ? `<ol class="steps">${moveOf(id).how.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    <button class="btn primary" data-act="sheet-close">${t('Done')}</button>`);
}
register({ 'move-clip': (el) => openMoveClip(el.dataset.id) });

// When a workout is finished: a high five for a milestone or a finished week, a thumbs up for a personal best,
// else the cheer. ev = { count: workouts logged, week: the week just finished (or null), pr: true for a personal best }.
const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400, 500];
export function coachFinishMoment(ev = {}) {
  if (MILESTONES.includes(ev.count)) return moment('highfive', t('{n} workouts done. High five!', { n: ev.count }));
  if (ev.week) return moment('highfive', t('Week {w} done. High five!', { w: ev.week }));
  if (ev.pr) return moment('thumbsup', t('New personal best. Well done!'));
  return moment('cheer', sig('finish'));
}

// A new phase of an app-built plan, once per plan and phase, on My Plan ("Tips and messages" style only).
// A new plan is noted silently, so its first phase doesn't trigger it.
const PHASE_MOMENT = {
  build: () => ['letsgo', t('New phase: more reps per set. You\'re getting stronger!')],
  peak: () => ['letsgo', t('New phase: heavier weights. Stay in control!')],
  deload: () => ['breathe', t('Last week: lighter on purpose. Recover well!')],
};
function coachPhase(p) {
  if (!coachFull() || !p?.plan || isCustom(p.plan)) return false;
  const key = planPhase(p.plan, currentWeek(p.plan)).key;
  const seen = state.settings.coachPhase || {};
  if (seen.plan === p.plan.id && seen.key === key) return false;
  const first = seen.plan !== p.plan.id;
  state.settings.coachPhase = { plan: p.plan.id, key }; save();
  if (first || !PHASE_MOMENT[key]) return false;
  const [clip, line] = PHASE_MOMENT[key]();
  moment(clip, line);
  return true;
}

// My Plan moments: a new phase first, else welcome back (only one at a time).
export const coachPlanMoment = (p) => { if (!coachPhase(p)) coachWelcome(p); };

// A line on the Progress screen, picked by simple rules from the workout history.
export function coachProgress(p) {
  if (!coachFull() || !p) return '';
  const h = p.history || [], now = Date.now();
  const last = h.length ? Math.max(...h.map(r => r.date || 0)) : 0;
  const week = h.filter(r => r.date > now - 7 * 864e5).length;
  const month = h.filter(r => r.date > now - 30 * 864e5).length;
  let line;
  if (!h.length) line = t('Finish your first workout and your progress shows up here.');
  else if (now - last >= 7 * 864e5) line = t('It\'s been a while. One workout this week gets you back on track.');
  else if (week >= (p.stats.days || 3)) line = t('All your workouts this week are done. Great consistency!');
  else if (month >= 8) line = t('{n} workouts in the last 30 days. You\'re building a real habit.', { n: month });
  else line = t('Every workout counts. Keep showing up and the charts will rise.');
  return note(line, 44, 'progress-coach');
}

// Welcome back on My Plan after a week or more without a workout (once per break; "Tips and messages" style only).
function coachWelcome(p) {
  if (!coachFull() || !p?.history?.length) return;
  const last = Math.max(...p.history.map(h => h.date || 0));
  if (Date.now() - last < 7 * 864e5 || state.settings.coachWelcomed === last) return;
  state.settings.coachWelcomed = last; save();
  moment('wave', t('Welcome back! Start a little lighter today and build up again.'));
}

// ── Choosing a coach ──
let afterPick = null;
const pickRow = (k, cur) => `<button class="row coach-pick ${cur === k ? 'sel' : ''}" data-act="coach-pick" data-k="${k}" aria-pressed="${cur === k}">
  ${avatarHTML(56, k)}<span><b>${COACHES[k].name}</b><small>${trait(k)}</small><small>${esc(sig('greet', k))}</small></span>${cur === k ? `<span class="pill">${t('Current')}</span>` : ''}</button>`;
const DISCLOSURE = () => t('The coaches are AI-generated characters. Their tips come from the app, not from a person, and are general guidance, not medical advice.');

// First-time card: choose a coach or skip. then = what to do after (e.g. start the app tour).
export function openMeet(then) {
  afterPick = then || null;
  sheet(`${closeX()}<h2>${t('Meet your coach')}</h2>
    <p class="muted small">${t('Pick a coach to cheer you on, or skip. You can change this any time under Profile → Coach.')}</p>
    ${Object.keys(COACHES).map(k => pickRow(k, state.settings.coach)).join('')}
    <button class="btn ghost" data-act="coach-pick" data-k="none">${t('No coach')}</button>
    <p class="muted small">${DISCLOSURE()}</p>`);
}

register({
  'coach-meet': () => openMeet(),
  'coach-cheer': () => moment('cheer', sig('finish')),
  'coach-open': () => {
    const cur = state.settings.coach, st = state.settings.coachStyle || 'full';
    sheet(`${closeX()}<h2>${t('Your coach')}</h2>
      ${coachOn() ? note(dailyTip(profile()), 56, 'big') : ''}
      ${Object.keys(COACHES).map(k => pickRow(k, cur)).join('')}
      <button class="row coach-pick ${cur === 'none' || !cur ? 'sel' : ''}" data-act="coach-pick" data-k="none" aria-pressed="${cur === 'none' || !cur}"><span><b>${t('No coach')}</b></span></button>
      <h3>${t('How often')}</h3>
      <div class="seg-ctl coachstyle-ctl" role="radiogroup" aria-label="${t('How often')}">${[['full', t('Tips and messages')], ['key', t('Only the start and the finish')]].map(([k, v]) =>
        `<label><input type="radio" name="coachStyle" value="${k}" ${st === k ? 'checked' : ''} data-change="coach-style"><span>${v}</span></label>`).join('')}</div>
      <p class="muted small">${DISCLOSURE()}</p>`);
  },
  'coach-pick': (el) => {
    const k = el.dataset.k;
    state.settings.coach = k; state.settings.coachAsked = true; save();
    closeSheet();
    const then = afterPick; afterPick = null;
    // The chosen coach introduces themself full screen: the wave clip and their greeting.
    if (k !== 'none') { if (!then) rerender(); setTimeout(() => moment('wave', sig('greet', k), then), 300); }
    else if (then) setTimeout(then, 400); else rerender();
  },
  'coach-style': (el) => { state.settings.coachStyle = el.value; save(); rerender(); },
});
