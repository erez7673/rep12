// App tour: a guided walk through every tab, shown automatically after the first profile is made
// and on demand from Profile → Take the app tour. Each step opens a screen, highlights one part of it
// and explains it in a card. "Skip" jumps to the next section, the X closes the tour.
import { state, save, profile } from './store.js';
import { currentWeek } from './planner.js';
import { icon, esc, closeSheet, register } from './ui.js';
import { t } from './i18n.js';
import { coachAvailable, coachCardShown } from './coach.js';

// Routes that depend on the plan: this week's first workout day and its first exercise.
const dayRoute = () => { const p = profile(); return p?.plan ? `#/day/${currentWeek(p.plan)}/0` : '#/plan'; };
const exRoute = () => { const id = profile()?.plan?.days[0]?.items[0]?.exId; return id ? `#/ex/${encodeURIComponent(id)}` : '#/exercises'; };

// sec: section name. route: screen to open (string or function). sel: part to highlight (none = card in the middle).
// Texts are English here and translated with t() when shown.
// fixed: the part doesn't scroll with the page (bottom tabs, Start button).
const STEPS = [
  // ── Profile ──
  { sec: 'Profile', route: '#/profile', title: 'Welcome to Rep12 👋', text: 'This short tour shows you around the app. Tap Next to go on, Skip to jump to the next part, or the X to close the tour. You can start it again any time from the Profile tab.' },
  { sec: 'Profile', route: '#/profile', sel: '#nav a[href="#/profile"]', fixed: true, title: 'The Profile tab', text: 'We start here, with your own details. The app\'s settings come right after.' },
  { sec: 'Profile', route: '#/profile', sel: '.card.me', title: 'Your profile', text: 'Your name, age, height, weight, experience, goal, and how many days a week you train. Your plan and starting weights are based on these.' },
  { sec: 'Profile', route: '#/profile', sel: 'a.eqrow[href="#/onboard/edit"]', title: 'Edit profile', text: 'Change your personal details, goal or training days per week. Choose "Save & rebuild plan" to get a new plan that fits.' },
  { sec: 'Profile', route: '#/profile', sel: 'a.eqrow[href="#/custom"]', title: 'Build your custom plan', text: 'Choose how many exercises each workout day has, which muscle areas each day trains, how long a session is, the warm-up, a cardio finisher, any injuries to protect, and extra focus areas. A custom plan keeps the same sets and reps all 12 weeks.' },
  { sec: 'Profile', route: '#/profile', sel: '[data-act="tpl-open"]', title: 'App-built plans', text: 'Plans with a set weekly layout: full-body plans for 2 or 3 days a week, the AB Plan and Upper / Lower for 4 days a week, and a Seated plan with no standing or floor work. Pick one instead of a custom plan if you prefer.' },
  { sec: 'Profile', route: '#/profile', sel: '.coach-row', when: () => coachAvailable(), title: 'Your coach', text: 'Pick Mia or Lucas, or no coach. Your coach cheers you on with short tips and messages. Change how often they speak, or turn them off, any time.' },
  { sec: 'Profile', route: '#/profile', sel: '[data-act="switch-profile"]', title: 'More than one person', text: 'Add a profile for someone else who trains on this phone, and switch between profiles here. Each person gets their own plan and history.' },
  { sec: 'Profile', route: '#/profile', sel: 'a.eqrow[href="#/gym"]', title: 'Gym setup', text: 'Tell the app which equipment your gym has, so your plan only uses what\'s there. More about this in the Gym tab.' },
  { sec: 'Profile', route: '#/profile', sel: '[data-act="tour-start"]', title: 'Take the tour again', text: 'Start this tour again from here whenever you need a refresher.' },
  { sec: 'Profile', route: '#/profile', sel: '.a11y-btn', title: 'Accessibility', text: 'The person icon opens the accessibility options: bigger text, high contrast, bigger buttons, less motion, and spoken cues during workouts. The app also works with VoiceOver and TalkBack.' },
  { sec: 'Profile', route: '#/profile', sel: '.gear', title: 'Settings', text: 'The gear opens the app\'s settings: language, units, light or dark, the rest timer beep, sync and backup.' },

  // ── Settings ──
  { sec: 'Settings', route: '#/settings', sel: '.lang-sel', title: 'Language', text: 'Choose the app\'s language. The app restarts in the new language; your data stays the same.' },
  { sec: 'Settings', route: '#/settings', sel: '.units-ctl', title: 'Units', text: 'Metric shows kilograms and centimetres. US shows pounds and feet. Switching only changes how weights and heights are shown.' },
  { sec: 'Settings', route: '#/settings', sel: '.theme-ctl', title: 'Light or dark', text: 'Choose a light or dark look. Auto follows your phone\'s setting.' },
  { sec: 'Settings', route: '#/settings', sel: '.a11y-row', title: 'Accessibility', text: 'The accessibility options are here too.' },
  { sec: 'Settings', route: '#/settings', sel: '.beep-card', title: 'Rest timer beep', text: 'The app beeps when your rest is over. Use "Test the beep" to check the volume. Keep silent mode off during workouts.' },
  { sec: 'Settings', route: '#/settings', sel: '.sync-card', title: 'Sync with Google Sheets (optional)', text: 'Backs up your data to your own Google Sheet and keeps several phones in step. The set-up steps are in the app\'s README. You can skip this.' },
  { sec: 'Settings', route: '#/settings', sel: '.backup-card', title: 'Backup', text: 'Save all your data to a file, or restore it from a file, for example when you get a new phone.' },
  { sec: 'Settings', route: '#/settings', sel: '.about-card', title: 'About', text: 'How your data is kept private, and a reminder that the app gives general guidance, not medical advice.' },

  // ── My Plan ──
  { sec: 'My Plan', route: '#/plan', sel: '#nav a[href="#/plan"]', fixed: true, title: 'The My Plan tab', text: 'Your 12-week plan. This is where you start every workout.' },
  { sec: 'My Plan', route: '#/plan', sel: '.weekbar', title: 'Your 12 weeks', text: 'Each bar is a week and fills up as you finish its workouts. Tap a week to look at it. A plan the app builds for you gets harder in steps, and week 12 is an easier recovery week. A plan from "Build your custom plan" keeps the same sets and reps every week.' },
  { sec: 'My Plan', route: '#/plan', sel: '[data-act="plan-info"]', title: 'About your plan', text: 'Tap the plan\'s name to see how it works, or to switch to an app-built plan.' },
  { sec: 'My Plan', route: '#/plan', sel: '.coachcard', when: () => coachCardShown(), title: 'Tip of the day', text: 'Your coach shares a tip here every day. Tap it to change the coach or how often they speak.' },
  { sec: 'My Plan', route: '#/plan', sel: '.days', title: 'Workout days', text: 'One card per workout day. "Next" marks the one to do now, and finished days get a tick. Tap a day to open it.' },

  // ── Workout day ──
  { sec: 'Workout day', route: dayRoute, title: 'A workout day', text: 'Here you see everything in one workout and can adjust it before you start. Changes apply to this day in every week.' },
  { sec: 'Workout day', route: dayRoute, sel: '.lead-chips', title: 'Muscle areas', text: 'The muscles this day trains. Tap to choose other areas, and the app picks fitting exercises.' },
  { sec: 'Workout day', route: dayRoute, sel: '[data-act="warm-open"]', title: 'Warm-up', text: 'A few minutes on a cardio machine, then a short mobility routine. Tap Change to pick the machine and the minutes.' },
  { sec: 'Workout day', route: dayRoute, sel: '.exlist [data-act="edit-sets"]', title: 'Sets, reps and weight', text: 'Each chip is one set. Tap Edit to change the reps or kg before you start. The first weights are estimates, so adjust them in your first week.' },
  { sec: 'Workout day', route: dayRoute, sel: '.exlist [data-act="move-open"]', title: 'Change the order', text: 'Move an exercise up or down in the workout.' },
  { sec: 'Workout day', route: dayRoute, sel: '.exlist [data-act="ex-menu"]', title: 'Swap or remove', text: 'See how to do the exercise, swap it for another one for the same muscles, or remove it from this day.' },
  { sec: 'Workout day', route: dayRoute, sel: '[data-act="cardio-open"]', title: 'Cardio finisher', text: 'Optional cardio at the end of the workout. Tap to choose the machine and the minutes, or leave it out.' },
  { sec: 'Workout day', route: dayRoute, sel: '[data-act="start-day"]', fixed: true, title: 'Start the workout', text: 'During the workout, tap ✓ after each set. The rest timer starts by itself and beeps when it\'s time for the next set. The screen stays on, and the weights go up as you get stronger.' },

  // ── Exercises ──
  { sec: 'Exercises', route: '#/exercises', sel: '#nav a[href="#/exercises"]', fixed: true, title: 'The Exercises tab', text: 'All the exercises in the app, with how-to videos.' },
  { sec: 'Exercises', route: '#/exercises', sel: '.search', title: 'Search and filter', text: 'Search by name, or tap a muscle to see only its exercises. "Only what\'s available in my gym" hides exercises for equipment you don\'t have.' },
  { sec: 'Exercises', route: exRoute, sel: '.hero', title: 'An exercise', text: 'Tap any exercise to open it. Under "How to do it" there is a short video (for most exercises) and step-by-step instructions.' },
  { sec: 'Exercises', route: exRoute, sel: '[data-act="add-to-day"]', title: 'Add to workout', text: 'Put this exercise into one of your workout days, as an extra exercise or in place of another one.' },
  { sec: 'Exercises', route: exRoute, sel: '[data-act="like"]', title: 'Like or avoid', text: 'Mark exercises you like or want to avoid. The app uses this the next time it builds your plan.' },

  // ── Gym ──
  { sec: 'Gym', route: '#/gym', sel: '#nav a[href="#/gym"]', fixed: true, title: 'The Gym tab', text: 'Your gym\'s equipment.' },
  { sec: 'Gym', route: '#/gym', sel: '.eqrow:has([data-change="eq-toggle"])', title: 'Gym setup', text: 'Switch off anything your gym doesn\'t have. Tap a picture to see it bigger.' },
  { sec: 'Gym', route: '#/gym', sel: '[data-act="rebuild-plan"]', title: 'Rebuild your plan', text: 'After changing the equipment, rebuild your plan so it only uses what\'s switched on.' },
  { sec: 'Gym', route: '#/gym', sel: '[data-href="#/identify"]', title: 'Don\'t know a machine?', text: 'Take a photo, answer a few questions about how it moves, and the app tells you which exercises you can do on it.' },

  // ── Timer ──
  { sec: 'Timer', route: '#/timer', sel: '#nav a[href="#/timer"]', fixed: true, title: 'The Timer tab', text: 'A countdown and a stopwatch for anything outside your plan, like a plank or a stretch.' },
  { sec: 'Timer', route: '#/timer', sel: '.timer-card', title: 'Countdown and stopwatch', text: 'Switch between them at the top. The countdown beeps when the time is up.' },

  // ── Progress ──
  { sec: 'Progress', route: '#/progress', sel: '#nav a[href="#/progress"]', fixed: true, title: 'The Progress tab', text: 'Charts of your workouts per week, your strength and your body weight. They fill up as you log workouts.' },
  { sec: 'Progress', route: '#/plan', title: 'You\'re all set!', text: 'Open your next workout day on My Plan and tap Start. Enjoy your training!' },
];

const SECTIONS = [...new Set(STEPS.map(s => s.sec))];
let LIST = STEPS; // the steps of this run: steps that depend on a feature (the coach) are left out when it is not there
let at = -1; // current step, -1 = no tour
let root = null;

export const tourOpen = () => at >= 0;

export function startTour(from = 0) {
  closeSheet();
  state.settings.tourDone = true; save();
  LIST = STEPS.filter(s => !s.when || s.when());
  at = from;
  if (!root) {
    root = document.createElement('div');
    root.id = 'tour';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    // Taps and swipes on the dimmed page do nothing while the tour is open.
    root.addEventListener('touchmove', (e) => { if (!e.target.closest('.tour-card')) e.preventDefault(); }, { passive: false });
    document.body.append(root);
  }
  show();
}

function endTour() {
  at = -1;
  root?.remove(); root = null;
}

function show() {
  const st = LIST[at];
  const route = typeof st.route === 'function' ? st.route() : st.route;
  if (location.hash !== route) { location.hash = route; setTimeout(place, 120); }
  else place();
}

// Highlights the step's part of the screen and puts the card where it doesn't cover it.
function place() {
  if (at < 0 || !root) return;
  const st = LIST[at];
  let el = st.sel ? document.querySelector(st.sel) : null;
  if (el && !el.getClientRects().length) el = null;
  const vh = window.innerHeight;
  if (el && !st.fixed) {
    const r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > vh * 0.55) window.scrollBy(0, r.top - vh * 0.2);
  }
  const r = el?.getBoundingClientRect();
  const secIdx = SECTIONS.indexOf(st.sec);
  const inSec = LIST.filter(s => s.sec === st.sec);
  const nextSec = SECTIONS[secIdx + 1];
  const last = at === LIST.length - 1;
  const cardTop = r && (r.top + r.bottom) / 2 > vh * 0.5;
  root.innerHTML = `
    ${r ? spot(r, vh) : '<div class="tour-dim"></div>'}
    <div class="tour-card ${cardTop ? 'at-top' : ''}">
      <button class="tour-x" data-act="tour-close" aria-label="${t('Close the tour')}">${icon.x}</button>
      <small class="tour-sec">${esc(t(st.sec))} · ${t('{a} of {b}', { a: inSec.indexOf(st) + 1, b: inSec.length })}</small>
      <h2>${esc(t(st.title))}</h2>
      <p>${esc(t(st.text))}</p>
      <div class="tour-btns">
        ${at > 0 ? `<button class="tour-btn" data-act="tour-back">${t('Previous')}</button>` : ''}
        ${nextSec ? `<button class="tour-btn" data-act="tour-skip">${t('Skip to {section}', { section: esc(t(nextSec)) })} <i class="arw">›</i></button>` : ''}
        <button class="tour-btn primary" data-act="tour-next">${last ? t('Finish') : t('Next')}</button>
      </div>
    </div>`;
  // A part taller than the free space (or a long translation) would end up under the card: highlight only the visible part.
  const sp = root.querySelector('.tour-spot'), card = root.querySelector('.tour-card');
  if (sp && card) {
    const c = card.getBoundingClientRect(), s = sp.getBoundingClientRect();
    if (!cardTop && s.bottom > c.top - 8) sp.style.height = Math.max(40, c.top - 8 - s.top) + 'px';
    if (cardTop && s.top < c.bottom + 8) { const top = c.bottom + 8; sp.style.height = Math.max(40, s.bottom - top) + 'px'; sp.style.top = top + 'px'; }
  }
}

// The highlight: the part's box plus a small margin, kept inside the screen (the bottom tabs touch its edge).
function spot(r, vh) {
  const top = Math.max(2, r.top - 6), bottom = Math.min(vh - 2, r.bottom + 6);
  const left = Math.max(2, r.left - 6), right = Math.min(window.innerWidth - 2, r.right + 6);
  return `<div class="tour-spot" style="top:${top}px;left:${left}px;width:${right - left}px;height:${bottom - top}px"></div>`;
}

register({
  'tour-start': () => startTour(),
  'tour-close': () => endTour(),
  'tour-next': () => { if (at >= LIST.length - 1) endTour(); else { at++; show(); } },
  'tour-back': () => { if (at > 0) { at--; show(); } },
  'tour-skip': () => {
    const next = LIST.findIndex((s, k) => k > at && s.sec !== LIST[at].sec);
    if (next < 0) endTour(); else { at = next; show(); }
  },
});

window.addEventListener('resize', () => { if (at >= 0) place(); });
document.addEventListener('keydown', (e) => { if (at >= 0 && e.key === 'Escape') endTour(); });
