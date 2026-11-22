// AI personal coaches (Mia and Lucas): a friendly avatar with a speech bubble.
// No AI runs here: the words are fixed, translated texts picked by simple rules (see COACH-USAGE-PLAN.md).
// Always optional: per phone (state.settings.coach = 'mia' | 'lucas' | 'none', coachStyle = 'full' | 'key').
import { state, save, profile, exById } from './store.js';
import { t, unitText } from './i18n.js';
import { esc, icon, register, sheet, closeSheet, toast, motionReduced } from './ui.js';
import { say, speakOn } from './speak.js';
import { rerender } from './app.js';
import { dayFocus, planPhase, isCustom, currentWeek } from './planner.js';

// Switch to true when docs/media/coach/ has the approved pictures and clips (<coach>-idle.jpg, -letsgo.mp4 ...).
// Until then the whole feature stays hidden (testing: set state.settings.coachPreview = true).
const READY = false;
export const coachAvailable = () => READY || !!state.settings.coachPreview;

export const COACHES = { mia: { name: 'Mia' }, lucas: { name: 'Lucas' } };
export const coachKey = () => (coachAvailable() && COACHES[state.settings.coach]) ? state.settings.coach : null;
export const coachOn = () => !!coachKey();
export const coachName = () => COACHES[coachKey()]?.name || '';
// "Full" shows tips on My Plan, the day preview, the rest card and the exercise page; "key moments" only the start and the finish.
export const coachFull = () => coachOn() && state.settings.coachStyle !== 'key';

const trait = (k) => k === 'mia' ? t('Warm and upbeat') : t('Calm and steady');

// The few lines that differ between the coaches (everything else is shared and neutral).
const SIG = {
  mia: { greet: () => t('Hi, I\'m Mia! I\'ll cheer you on.'), start: () => t('Let\'s go!'), finish: () => t('Amazing work today!') },
  lucas: { greet: () => t('I\'m Lucas. We train steady, one set at a time.'), start: () => t('Time to train.'), finish: () => t('Well fought. Strong as a longship.') },
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
  `<span class="coach-av" style="--s:${size}px" aria-hidden="true"><b>${esc(COACHES[k].name[0])}</b><img src="media/coach/${k}-idle.jpg" alt="" onerror="this.remove()"></span>`;
const note = (text, size = 40, cls = '') => `<div class="coach-note ${cls}">${avatarHTML(size)}<p>${esc(text)}</p></div>`;
const closeX = () => `<button class="iconbtn sheet-x" data-act="sheet-close" aria-label="${t('Close')}">${icon.x}</button>`;

// My Plan: today's tip, or (for someone who has not chosen yet) a card that offers the coach.
export function coachPlanCard(p) {
  if (!coachAvailable() || !p?.plan) return '';
  if (coachFull()) return `<button class="coachcard" data-act="coach-open">${avatarHTML(44)}<span><b>${esc(coachName())}</b><small>${esc(dailyTip(p))}</small></span>${icon.chev}</button>`;
  if (!state.settings.coach && !state.settings.coachAsked)
    return `<button class="coachcard meet" data-act="coach-meet"><span class="coach-pair">${avatarHTML(40, 'mia')}${avatarHTML(40, 'lucas')}</span><span><b>${t('Meet your coach')}</b><small>${t('Pick a coach to cheer you on, or skip.')}</small></span>${icon.chev}</button>`;
  return '';
}
export const coachCardShown = () => coachFull();

export const coachDayLine = (day) => coachFull() ? note(t('Today: {focus}. Warm up first and take your time.', { focus: dayFocus(day) })) : '';

// The rest card of a workout: a tip for the exercise that comes next (its own tip, else the tip of the day).
export function coachRest(it) {
  if (!coachFull()) return '';
  const own = exById(it?.exId)?.tip;
  return `<div class="coach-rest">${avatarHTML(40)}<p>${esc(own ? unitText(t(own)) : dailyTip(profile()))}</p></div>`;
}

export const coachFinish = () => coachOn() ? note(sig('finish'), 44, 'finish') : '';
export const coachTipCard = (text) => coachFull()
  ? `<div class="card tip coach-tip">${avatarHTML(36)}<div><small>${t('Tip from {name}', { name: coachName() })}</small>${esc(text)}</div></div>` : '';
export const coachProfileRow = () => !coachAvailable() ? '' :
  `<button class="eqrow coach-row" data-act="coach-open"><span>${t('Coach')}</span><span class="muted">${esc(coachName() || t('No coach'))} ${icon.chev}</span></button>`;
export const coachSettingsBlock = () => !coachAvailable() ? '' :
  `<h3>${t('Coach')}</h3><div class="card list"><button class="eqrow" data-act="coach-open"><span>${esc(coachName() || t('No coach'))}</span>${icon.chev}</button></div>`;

// ── Moments ──
// "Let's go!" for two seconds when a workout starts. It never takes taps, so it can't block a button.
export function coachStart() {
  const k = coachKey();
  if (!k) return;
  const line = sig('start');
  document.getElementById('coach-overlay')?.remove();
  const el = document.createElement('div');
  el.id = 'coach-overlay';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="coach-av" style="--s:84px" aria-hidden="true"><b>${esc(COACHES[k].name[0])}</b><img src="media/coach/${k}-idle.jpg" alt="" onerror="this.remove()">${motionReduced() ? '' : `<video src="media/coach/${k}-letsgo.mp4" poster="media/coach/${k}-idle.jpg" muted autoplay playsinline onerror="this.remove()"></video>`}</span><p>${esc(line)}</p>`;
  document.body.append(el);
  if (speakOn()) say(line);
  setTimeout(() => el.remove(), 2200);
}
export const coachSpeakFinish = () => { if (coachOn() && speakOn()) say(sig('finish')); };

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
    ${Object.keys(COACHES).map(k => pickRow(k, null)).join('')}
    <button class="btn ghost" data-act="coach-pick" data-k="none">${t('No coach')}</button>
    <p class="muted small">${DISCLOSURE()}</p>`);
}

register({
  'coach-meet': () => openMeet(),
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
    if (k !== 'none') toast(sig('greet', k));
    if (then) setTimeout(then, 400); else rerender();
  },
  'coach-style': (el) => { state.settings.coachStyle = el.value; save(); rerender(); },
});
