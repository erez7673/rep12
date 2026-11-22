// My Plan, day preview, active workout and summary screens.
import { state, profile, exById, photoFor, isAvailable, touchProfile, save, lastLogFor } from './store.js';
import { esc, icon, thumb, register, sheet, closeSheet, toast, fmtClock, fmtKg, fmtDate, fmtDur, setLabel, themeButton } from './ui.js';
import { currentWeek, planProgress, dayFocus, planPhase, isCustom, buildSession, estimateMinutes, estimateCalories, swapOptions, generatePlan, sortDay, itemArea, editKey, AREAS, setDayAreas, exPerDay, dayCap, warmOptions, warmPref, sessionBudget, TEMPLATES, TPL_PHASES, generateTemplatePlan, templateDayText, tplRx, dayName, planTitle } from './planner.js';
import { MUSCLES } from './exercises.js';
import * as W from './workout.js';
import { say, setCue } from './speak.js';
import { coachPlanCard, coachDayLine, coachRest, coachFinish, coachStart, coachSpeakFinish } from './coach.js';
import { t, wUnit, fromW, toW, locale, listJoin } from './i18n.js';
import { rerender } from './app.js';
import { scheduleSync } from './sync.js';

let viewWeek = null;

// Close button for the top-right corner of a bottom sheet.
const closeX = () => `<button class="iconbtn sheet-x" data-act="sheet-close" aria-label="${t('Close')}">${icon.x}</button>`;

const avatar = (p) => `<div class="hdr-btns">${themeButton()}<button class="avatar" style="--c:${p.color}" data-act="switch-profile" aria-label="${t('Switch profile')}">${esc(p.name[0] || '?')}</button></div>`;

// Exercise name in the current language (logs keep the name from the day they were made).
const exName = (id, fallback) => exById(id)?.name || fallback || id;
const weightHead = (assist) => assist ? t('Assist {u}', { u: wUnit() }) : wUnit();

// ───────────── My Plan ─────────────
export function planView() {
  const p = profile();
  if (!p.plan) {
    return { html: `<header class="top"><h1>${t('Hi {name}', { name: esc(p.name) })}</h1>${avatar(p)}</header>
      <div class="card center"><p>${t('You don\'t have a plan yet.')}</p><button class="btn primary" data-act="make-plan">${t('Build my plan')}</button>
      <button class="btn" data-act="tpl-open">${t('Or choose an app-built plan')}</button></div>` };
  }
  const plan = p.plan;
  const cw = currentWeek(plan);
  const w = Math.min(plan.weeks, viewWeek || cw);
  const pct = planProgress(plan);
  const nextIdx = plan.days.findIndex((_, d) => !plan.done[`${w}-${d}`]);
  const doneThisWeek = plan.days.filter((_, d) => plan.done[`${w}-${d}`]).length;

  const segs = Array.from({ length: plan.weeks }, (_, i) => {
    const wk = i + 1;
    const n = plan.days.filter((_, d) => plan.done[`${wk}-${d}`]).length;
    const fill = n / plan.days.length * 100;
    return `<button class="seg ${wk === w ? 'cur' : ''}" data-act="pick-week" data-w="${wk}" aria-label="${t('Week {w}', { w: wk })}"><i style="width:${fill}%"></i></button>`;
  }).join('');

  const cards = plan.days.map((day, d) => {
    const done = plan.done[`${w}-${d}`];
    const next = d === nextIdx;
    const warn = day.items.some(it => { const ex = exById(it.exId); return !ex || !isAvailable(ex); });
    return `<a class="daycard ${done ? 'done' : ''} ${next ? 'next' : ''}" href="#/day/${w}/${d}">
      <span class="tick">${done ? icon.check : ''}</span>
      <span class="dc-body"><b>${esc(dayName(d))}</b><small>${esc(dayFocus(day))}</small>${warn ? `<em class="warn">${t('Some equipment is off – tap to swap')}</em>` : ''}</span>
      ${next ? `<span class="nextpill">${t('Next')}</span>` : ''}
    </a>`;
  }).join('');

  return {
    html: `<header class="top">
        <div><h1>${t('Week {w}', { w })} <span class="dim">${t('of {n}', { n: plan.weeks })}</span></h1>
        <button class="sub linklike" data-act="plan-info">${esc(planTitle(plan))} ${icon.chev}</button></div>
        ${avatar(p)}
      </header>
      <div class="weekbar">${segs}</div>
      <p class="phase">${esc(planPhase(plan, w).name)} · ${t('{a}/{b} done', { a: doneThisWeek, b: plan.days.length })}${w !== cw ? ` · <button class="linklike" data-act="pick-week" data-w="${cw}">${t('back to current week')}</button>` : ''}</p>
      ${coachPlanCard(p)}
      <div class="days">${cards}</div>
      <div class="statrow">
        <div class="stat"><b>${pct}%</b><small>${t('Plan complete')}</small></div>
        <div class="stat"><b>${p.history.length}</b><small>${t('Workouts logged')}</small></div>
        <div class="stat"><b>${p.stats.minutes}′</b><small>${t('Per session')}</small></div>
      </div>`,
  };
}

register({
  'pick-week': (el) => { viewWeek = +el.dataset.w; rerender(); },
  'make-plan': () => { const p = profile(); p.plan = generatePlan(p); touchProfile(p); scheduleSync(); rerender(); toast(t('Plan ready!')); },
  'plan-info': () => {
    const p = profile(); const plan = p.plan;
    const n = dayCap(p);
    const extras = listJoin([t('warm-up'), ...(p.stats.cardio ? [t('cardio finisher')] : [])]);
    sheet(`<h2>${esc(planTitle(plan))}</h2>
      <p class="muted">${t('{w} weeks · {d} days per week · {m} min sessions', { w: plan.weeks, d: plan.days.length, m: p.stats.minutes })}</p>
      ${tplRx(plan) ? `<ul class="plain"><li><b>${t('Every day:')}</b> ${t('{n} exercises, plus warm-up{walk} and cooldown. Tap any day to swap, add or remove exercises and to change sets, reps and weight.', { n: dayCap(p), walk: plan.days[0]?.cardio ? t(', a short walk') : '' })}</li>
        ${TPL_PHASES.map(([a, b]) => `<li><b>${esc(a)}:</b> ${esc(b)}</li>`).join('')}</ul>`
      : `<ul class="plain">
        <li><b>${t('Every day:')}</b> ${t('{n} × 4 sets, plus {extras} and cooldown. Open a day to choose its muscle areas or change the warm-up.', { n: n === 1 ? t('1 exercise') : t('{n} exercises', { n }), extras })}</li>
        ${isCustom(plan) ? `<li><b>${t('Custom plan:')}</b> ${t('the same sets and reps every week. Build a plan from Edit profile if you want the app to make it harder in steps.')}</li>` : `
        <li><b>${t('Weeks 1–4')}:</b> ${t('learn the movements, find your working weights.')}</li>
        <li><b>${t('Weeks 5–8')}:</b> ${t('more reps per set.')}</li>
        <li><b>${t('Weeks 9–11')}:</b> ${['strength', 'hypertrophy'].includes(p.stats.goal) ? t('heavier with fewer reps.') : t('keep building reps and weight.')}</li>
        <li><b>${t('Week 12')}:</b> ${t('deload – lighter so your body recovers.')}</li>`}
      </ul>`}
      <p class="muted">${t('The app raises the weight automatically when you hit the top of the rep range on every set. Tap the sets on a day to change reps or weight.')}</p>
      <button class="btn" data-act="tpl-open">${t('App-built plans')}</button>
      <button class="btn" data-act="go" data-href="#/profile">${t('Plan settings')}</button>`);
  },
  'tpl-open': () => {
    const cur = profile().plan?.template;
    sheet(`${closeX()}<h2>${t('App-built plans')}</h2>
      <p class="muted small">${t('Plans with a set weekly layout, filled with exercises that fit your equipment. The full-body plans start light, with 2–3 sets of 10–15 reps. The AB and Upper / Lower plans follow your goal. You can still swap, add or remove exercises and change sets, reps and weight on every day.')}</p>
      ${Object.entries(TEMPLATES).map(([k, tp]) => `<div class="card">
        <b>${esc(tp.name)}</b>${cur === k ? ` <span class="pill">${t('Current')}</span>` : ''}
        <p class="muted small">${esc(tp.blurb)}</p>
        <ul class="plain">${tp.days.map((_, di) => `<li><b>${esc(dayName(di))}:</b> ${esc(templateDayText(k, di))}</li>`).join('')}</ul>
        <button class="btn primary" data-act="tpl-use" data-k="${k}">${cur === k ? t('Restart this plan') : t('Use this plan')}</button></div>`).join('')}
      <button class="btn ghost" data-act="sheet-close">${t('Cancel')}</button>`);
  },
  'tpl-use': (el) => {
    const p = profile();
    if (p.plan && Object.keys(p.plan.done).length && !confirm(t('A new plan restarts at week 1 (your history is kept). Continue?'))) return;
    // A split plan brings its own muscle areas per day, so the areas picked for the old plan are cleared.
    if (TEMPLATES[el.dataset.k]?.areas) delete p.stats.dayAreas;
    p.plan = generateTemplatePlan(p, el.dataset.k);
    viewWeek = null;
    touchProfile(p); scheduleSync(); closeSheet(); location.hash = '#/plan'; rerender(); toast(t('Plan ready!'));
  },
  'switch-profile': () => {
    const list = Object.values(state.profiles);
    sheet(`<h2>${t('Who\'s training?')}</h2>
      ${list.map(p => `<button class="row" data-act="use-profile" data-id="${p.id}"><span class="avatar sm" style="--c:${p.color}">${esc(p.name[0])}</span><b>${esc(p.name)}</b>${p.id === state.activeProfile ? `<span class="pill">${t('Active')}</span>` : ''}</button>`).join('')}
      <button class="btn" data-act="go" data-href="#/onboard">${icon.plus} ${t('Add a profile')}</button>`);
  },
  'use-profile': (el) => { state.activeProfile = el.dataset.id; viewWeek = null; save(); closeSheet(); rerender(); },
});

// ───────────── Day preview ─────────────
let preview = null;

// Move sheet: the day's exercises in order, the chosen one highlighted, with Move up / Move down.
function openMoveSheet(d, i) {
  const p = profile(); const day = p.plan.days[d];
  const n = day.items.length;
  sheet(`${closeX()}<h2>${t('Change the order')}</h2>
    <p class="muted small">${esc(dayName(d))} · ${t('for all weeks')}</p>
    <ol class="movelist">${day.items.map((it, k) => `<li class="${k === i ? 'on' : ''}">${esc(exName(it.exId))}</li>`).join('')}</ol>
    <div class="btnrow">
      <button class="btn" data-act="move-step" data-d="${d}" data-i="${i}" data-by="-1" ${i === 0 ? 'disabled' : ''}>${icon.up} ${t('Move up')}</button>
      <button class="btn" data-act="move-step" data-d="${d}" data-i="${i}" data-by="1" ${i === n - 1 ? 'disabled' : ''}>${icon.down} ${t('Move down')}</button>
    </div>
    ${day.manual ? `<button class="btn ghost" data-act="move-auto" data-d="${d}" data-i="${i}">${t('Back to the app\'s order (bigger muscles first)')}</button>` : ''}
    <button class="btn primary" data-act="sheet-close">${t('Done')}</button>`);
}

export function dayView(w, d) {
  const p = profile();
  const plan = p.plan;
  if (!plan || !plan.days[d]) return { html: `<p>${t('Not found')}</p>` };
  preview = buildSession(p, w, d);
  const day = plan.days[d];
  const mins = estimateMinutes(preview);
  const done = plan.done[`${w}-${d}`];
  const rec = done && p.history.find(h => h.id === done);

  // Grouped under a header per muscle area (the plan keeps bigger muscles first).
  let lastArea = null;
  const items = preview.items.map((it, i) => {
    const ex = exById(it.exId);
    const avail = isAvailable(ex);
    const area = itemArea(day, day.items.find(x => x.exId === it.exId) || { exId: it.exId });
    const header = area !== lastArea ? `<h4 class="exgroup">${esc(AREAS[area]?.name || '')}</h4>` : '';
    lastArea = area;
    return `${header}<div class="exrow">
      <a href="#/ex/${encodeURIComponent(ex.id)}" aria-label="${esc(t('How to do it') + ': ' + ex.name)}">${thumb(ex, photoFor(ex.id))}</a>
      <div class="exbody">
        <a href="#/ex/${encodeURIComponent(ex.id)}" class="exname">${esc(ex.name)}</a>
        <button class="chips editable" data-act="edit-sets" data-w="${w}" data-d="${d}" data-i="${i}" aria-label="${t('Edit reps and weight')}">${it.sets.map(s => `<span class="chip">${setLabel(s, it.unit)}</span>`).join('')}<span class="chip edit">${icon.edit} ${t('Edit')}</span></button>
        ${!avail ? `<em class="warn">${t('Equipment marked as not available – swap it')}</em>` : it.note ? `<small class="note">${esc(it.note)}</small>` : ''}
      </div>
      ${preview.items.length > 1 ? `<button class="iconbtn" data-act="move-open" data-d="${d}" data-i="${i}" aria-label="${t('Move up or down')}">${icon.move}</button>` : ''}
      <button class="iconbtn" data-act="ex-menu" data-d="${d}" data-i="${i}" aria-label="${t('Options')}">${icon.dots}</button>
    </div>
    <div class="rest">${t('Rest: {n} s', { n: it.rest })}</div>`;
  }).join('');

  return {
    cls: 'with-cta',
    html: `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2>${esc(dayName(d))}</h2><span></span></header>
      <button class="chips editable lead-chips" data-act="areas-open" data-d="${d}" aria-label="${t('Choose muscle areas')}">${(day.muscles?.length ? day.muscles.map(a => AREAS[a]?.name) : [dayFocus(day)]).filter(Boolean).map(n => `<span class="chip on">${esc(n)}</span>`).join('')}<span class="chip edit">${icon.edit} ${t('Muscle areas')}</span></button>
      <div class="statrow">
        <div class="stat">${icon.clock}<b>${t('{n} min', { n: mins })}</b><small>${t('Workout time')}</small></div>
        <div class="stat">${icon.fire}<b>${estimateCalories(p.stats, mins)}</b><small>${t('Calories (est.)')}</small></div>
      </div>
      <p class="phase">${t('Week {w}', { w })} · ${esc(planPhase(plan, w).name)}</p>
      ${coachDayLine(day)}
      ${rec ? `<a class="card donecard" href="#/summary/${rec.id}">${icon.check} ${t('Done on {date} – view log', { date: fmtDate(rec.date) })}</a>` : ''}
      <h3>${t('Warm-up')}</h3>
      ${preview.warm ? `<div class="exrow"><a href="#/ex/${encodeURIComponent(preview.warm.exId)}" aria-label="${esc(t('How to do it') + ': ' + (exById(preview.warm.exId)?.name || ''))}">${thumb(exById(preview.warm.exId))}</a>
          <div class="exbody"><b class="exname">${esc(exName(preview.warm.exId, preview.warm.name))}</b>
          <button class="chips editable" data-act="warm-open" aria-label="${t('Change warm-up')}"><span class="chip">${t('{n} min', { n: preview.warm.min })}</span><span class="chip edit">${icon.edit} ${t('Change')}</span></button></div></div>
        ${preview.warmup.length ? `<button class="row mobility-btn" data-act="mobility-open" data-w="${w}" data-d="${d}">${icon.info}<span><b>${t('Then a quick mobility routine')}</b><small>${t('{n} moves', { n: preview.warmup.length })} · ${t('{n} min', { n: Math.round(preview.warmup.reduce((a, m) => a + m.sec, 0) / 60) })}</small></span><span class="chev arw">›</span></button>` : ''}`
      : `<button class="btn" data-act="warm-open">${icon.plus} ${t('Add a warm-up')}</button>`}
      <h3>${t('Exercise List')}</h3>
      <div class="exlist">${items}</div>
      <h3>${t('Cardio finisher')}</h3>
      ${preview.cardio ? `<div class="exrow"><a href="#/ex/${encodeURIComponent(preview.cardio.exId)}" aria-label="${esc(t('How to do it') + ': ' + (exById(preview.cardio.exId)?.name || ''))}">${thumb(exById(preview.cardio.exId))}</a>
          <div class="exbody"><b class="exname">${esc(exName(preview.cardio.exId, preview.cardio.name))}</b>
          <button class="chips editable" data-act="cardio-open" data-d="${d}" aria-label="${t('Change cardio finisher')}"><span class="chip">${t('{n} min', { n: preview.cardio.min })}</span><span class="chip edit">${icon.edit} ${t('Change')}</span></button></div></div>`
      : `<button class="btn" data-act="cardio-open" data-d="${d}">${icon.plus} ${t('Add a cardio finisher')}</button>`}
      <h3>${t('Cooldown stretches')}</h3>
      <ul class="moves">${preview.cooldown.map(m => `<li>${esc(m.name)}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul>
      <div class="cta"><button class="btn primary big" data-act="start-day" data-w="${w}" data-d="${d}">${state.session?.startedAt ? t('Start (replaces current workout)') : done ? t('Do it again') : t('Start')}</button></div>`,
  };
}

// Bottom sheet to change the reps / weight of each set before the workout.
function openSetEditor(w, d, i) {
  const p = profile();
  const it = buildSession(p, w, d).items[i];
  if (!it) return;
  const ex = exById(it.exId);
  const edited = !!p.plan.edits?.[editKey(w, d, it.exId)];
  const attrs = (k, f) => `data-change="pv-set" data-w="${w}" data-d="${d}" data-ex="${it.exId}" data-k="${k}" data-f="${f}"`;
  sheet(`<h2>${esc(exName(it.exId, it.name))}</h2>
    <p class="muted small">${t('Week {w} · target {a}–{b} {u}. Changing a set also changes the sets after it.', { w, a: it.target.reps[0], b: it.target.reps[1], u: it.unit === 'sec' ? t('s') : t('reps') })}</p>
    <table class="sets"><thead><tr><th>${t('Set')}</th><th>${it.unit === 'sec' ? t('Sec') : t('Reps')}</th><th>${weightHead(it.assist)}</th></tr></thead><tbody>
    ${it.sets.map((s, k) => `<tr><td><span class="setno">${k + 1}</span></td>
      <td><input type="number" inputmode="numeric" min="0" value="${s.reps}" ${attrs(k, 'reps')} aria-label="${t('Set {n}: {what}', { n: k + 1, what: it.unit === 'sec' ? t('Sec') : t('Reps') })}"></td>
      <td>${ex.load || s.kg ? `<input type="number" inputmode="decimal" min="0" step="0.5" value="${fmtKg(s.kg)}" ${attrs(k, 'kg')} aria-label="${t('Set {n}: {what}', { n: k + 1, what: wUnit() })}">` : `<span class="muted">${t('body weight')}</span>`}</td></tr>`).join('')}
    </tbody></table>
    ${edited ? `<button class="btn ghost" data-act="pv-reset" data-w="${w}" data-d="${d}" data-i="${i}" data-ex="${it.exId}">${t('Back to the app\'s suggestion')}</button>` : ''}
    <button class="btn primary" data-act="sheet-close">${t('Done')}</button>`);
}

// Bottom sheet to pick the muscle areas of a workout day; saving picks new exercises for those areas.
let areaSel = null;
function openAreas(d) {
  const day = profile().plan.days[d];
  areaSel ||= [...(day.muscles || [])];
  sheet(`<h2>${t('{day}: muscle areas', { day: esc(dayName(d)) })}</h2>
    <p class="muted small">${t('Pick one or more. The app chooses {n} exercise(s) for them (set the number under Profile → Build your custom plan) from the equipment in your gym. You can still swap or remove single exercises afterwards.', { n: dayCap(profile()) })}</p>
    <div class="choices grid">${Object.entries(AREAS).map(([k, a]) => `<button class="choice ${areaSel.includes(k) ? 'on' : ''}" data-act="areas-toggle" data-d="${d}" data-k="${k}">${esc(a.name)}</button>`).join('')}</div>
    <button class="btn primary" data-act="areas-save" data-d="${d}" ${areaSel.length ? '' : 'disabled'}>${t('Pick exercises for these areas')}</button>
    ${day.muscles?.length ? `<button class="btn ghost" data-act="areas-clear" data-d="${d}">${t('Let the app choose the areas')}</button>` : ''}`);
}

// Minutes stepper used by the warm-up and cardio sheets.
const stepper = (act, setAct, val, extra = '') => `<label class="field"><span>${t('Minutes')}</span>
      <div class="stepper"><button class="pillbtn dark" data-act="${act}" ${extra} data-v="-1" aria-label="${t('One minute less')}">−</button>
      <input type="number" inputmode="numeric" min="0" max="60" value="${val}" data-change="${setAct}" ${extra}>
      <button class="pillbtn dark" data-act="${act}" ${extra} data-v="1" aria-label="${t('One minute more')}">+</button></div></label>`;

// Bottom sheet to pick the warm-up machine and how long it runs.
function openWarm() {
  const p = profile();
  const wp = warmPref(p);
  const opts = warmOptions();
  sheet(`<h2>${t('Warm-up')}</h2>
    <p class="muted small">${t('Used for all your workout days. In the workout, tap Start and the app beeps when the time is up.')}</p>
    ${stepper('warm-min', 'warm-min-set', wp.min)}
    <h3>${t('Machine')}</h3>
    ${opts.length ? opts.map(e => `<button class="row ${e.id === wp.exId ? 'sel' : ''}" data-act="warm-pick" data-ex="${e.id}">${thumb(e, photoFor(e.id), 'sm')}<span><b>${esc(e.name)}</b></span>${e.id === wp.exId ? `<span class="pill">${t('Selected')}</span>` : ''}</button>`).join('')
      : `<p class="muted">${t('No cardio machines are on in Gym Setup.')}</p>`}
    <button class="btn primary" data-act="sheet-close">${t('Done')}</button>`);
}

// Bottom sheet to pick the cardio finisher machine and minutes for one workout day (all weeks).
function openCardio(d) {
  const p = profile();
  const c = p.plan.days[d]?.cardio;
  const opts = warmOptions();
  const min = c?.min ?? 0;
  sheet(`${closeX()}<h2>${t('Cardio finisher')}</h2>
    <p class="muted small">${t('Used on {day} in every week. Set the minutes to 0 to leave it out.', { day: esc(dayName(d)) })}</p>
    ${stepper('cardio-min', 'cardio-min-set', min, `data-d="${d}"`)}
    <h3>${t('Machine')}</h3>
    ${opts.length ? opts.map(e => `<button class="row ${e.id === c?.exId ? 'sel' : ''}" data-act="cardio-pick" data-d="${d}" data-ex="${e.id}">${thumb(e, photoFor(e.id), 'sm')}<span><b>${esc(e.name)}</b></span>${e.id === c?.exId ? `<span class="pill">${t('Selected')}</span>` : ''}</button>`).join('')
      : `<p class="muted">${t('No cardio machines are on in Gym Setup.')}</p>`}
    <button class="btn primary" data-act="sheet-close">${t('Done')}</button>`);
}

function saveCardio(d, patch) {
  const p = profile();
  const day = p.plan.days[d];
  const opts = warmOptions();
  const cur = day.cardio || {};
  // A new finisher starts on the usual length for the profile's goal, on the first machine that's on.
  const next = { exId: cur.exId || opts[0]?.id, min: cur.exId ? cur.min : (sessionBudget(p.stats).cardio || 10), ...patch };
  if (!next.exId) return;
  next.min = Math.max(0, Math.min(60, Math.round(next.min || 0)));
  day.cardio = next;
  // Also update a workout of this day that's open but whose finisher hasn't started yet.
  const s = state.session;
  if (s?.startedAt && s.profileId === p.id && s.planId === p.plan.id && s.dayIdx === d && !(s.cardio?.endAt || s.cardio?.done)) {
    const ex = exById(next.exId);
    s.cardio = next.min > 0 && ex ? { exId: ex.id, name: ex.name, min: next.min, done: false } : null;
    save();
  }
  touchProfile(p); scheduleSync(); rerender(); openCardio(d);
}

// Pop-up with the mobility moves that follow the warm-up machine.
function openMobility(w, d) {
  const moves = buildSession(profile(), w, d).warmup;
  sheet(`${closeX()}<h2>${t('Quick mobility routine')}</h2>
    <p class="muted small">${t('Do these right after the warm-up machine.')}</p>
    <ul class="moves">${moves.map(m => `<li>${esc(m.name)}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul>
    <button class="btn primary" data-act="sheet-close">${t('Done')}</button>`);
}

function saveWarm(patch) {
  const p = profile();
  p.warm = { ...warmPref(p), ...patch };
  p.warm.min = Math.max(0, Math.min(60, Math.round(p.warm.min || 0)));
  // Also update a workout that's open but whose warm-up hasn't started yet.
  const s = state.session;
  if (s?.startedAt && s.profileId === p.id && !(s.warm?.endAt || s.warm?.done)) {
    const ex = exById(p.warm.exId);
    s.warm = p.warm.min > 0 && ex ? { exId: ex.id, name: ex.name, min: p.warm.min, done: false } : null;
    save();
  }
  touchProfile(p); scheduleSync(); rerender(); openWarm();
}

register({
  'areas-open': (el) => { areaSel = null; openAreas(+el.dataset.d); },
  'areas-toggle': (el) => {
    const k = el.dataset.k; const i = areaSel.indexOf(k);
    if (i >= 0) areaSel.splice(i, 1); else areaSel.push(k);
    openAreas(+el.dataset.d);
  },
  'areas-save': (el) => {
    const p = profile(); const d = +el.dataset.d;
    setDayAreas(p, d, areaSel);
    areaSel = null;
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
    toast(t('New exercises picked for all weeks'));
  },
  'areas-clear': (el) => {
    const p = profile(); setDayAreas(p, +el.dataset.d, []);
    areaSel = null; touchProfile(p); scheduleSync(); closeSheet(); rerender();
  },
  'warm-open': () => openWarm(),
  'warm-pick': (el) => saveWarm({ exId: el.dataset.ex }),
  'warm-min': (el) => saveWarm({ min: warmPref(profile()).min + +el.dataset.v }),
  'warm-min-set': (el) => saveWarm({ min: +el.value || 0 }),
  'cardio-open': (el) => openCardio(+el.dataset.d),
  'cardio-pick': (el) => saveCardio(+el.dataset.d, { exId: el.dataset.ex }),
  'cardio-min': (el) => { const d = +el.dataset.d; saveCardio(d, { min: (profile().plan.days[d].cardio?.min || 0) + +el.dataset.v }); },
  'cardio-min-set': (el) => saveCardio(+el.dataset.d, { min: +el.value || 0 }),
  'mobility-open': (el) => openMobility(+el.dataset.w, +el.dataset.d),
  'start-day': (el) => {
    if (state.session?.startedAt && !confirm(t('A workout is already in progress. Discard it and start this one?'))) return;
    const p = profile();
    const s = buildSession(p, +el.dataset.w, +el.dataset.d);
    W.start(s);
    location.hash = '#/session';
    coachStart();
  },
  'ex-menu': (el) => {
    const d = +el.dataset.d, i = +el.dataset.i;
    const p = profile();
    const it = p.plan.days[d].items[i];
    const ex = exById(it.exId);
    const opts = swapOptions(p.stats, p.plan, d, i);
    const area = AREAS[itemArea(p.plan.days[d], it)]?.name || '';
    sheet(`${closeX()}<h2>${esc(ex.name)}</h2>
      <button class="row" data-act="go" data-href="#/ex/${encodeURIComponent(ex.id)}">${icon.info}<b>${t('How to do it')}</b></button>
      <h3>${t('Swap for another {area} exercise', { area: esc(area) })} <small class="muted">(${opts.length})</small></h3>
      ${opts.length ? opts.map(o => `<button class="row" data-act="swap" data-d="${d}" data-i="${i}" data-ex="${o.id}">${thumb(o, photoFor(o.id), 'sm')}<span><b>${esc(o.name)}</b><small>${esc(MUSCLES[o.m])}</small></span></button>`).join('') : `<p class="muted">${t('No alternatives with your current gym setup.')}</p>`}
      <button class="row danger" data-act="remove-ex" data-d="${d}" data-i="${i}">${icon.trash}<b>${t('Remove from this day')}</b></button>`);
  },
  'move-open': (el) => openMoveSheet(+el.dataset.d, +el.dataset.i),
  'move-step': (el) => {
    const p = profile(); const d = +el.dataset.d, i = +el.dataset.i, j = i + +el.dataset.by;
    const day = p.plan.days[d];
    if (j < 0 || j >= day.items.length) return;
    [day.items[i], day.items[j]] = [day.items[j], day.items[i]];
    day.manual = true;
    touchProfile(p); scheduleSync(); rerender(); openMoveSheet(d, j);
  },
  'move-auto': (el) => {
    const p = profile(); const d = +el.dataset.d; const day = p.plan.days[d];
    const id = day.items[+el.dataset.i]?.exId;
    delete day.manual; sortDay(day);
    touchProfile(p); scheduleSync(); rerender(); openMoveSheet(d, Math.max(0, day.items.findIndex(x => x.exId === id)));
  },
  'edit-sets': (el) => openSetEditor(+el.dataset.w, +el.dataset.d, +el.dataset.i),
  'pv-set': (el) => {
    const w = +el.dataset.w, d = +el.dataset.d, exId = el.dataset.ex, k = +el.dataset.k, f = el.dataset.f;
    const p = profile();
    const it = buildSession(p, w, d).items.find(x => x.exId === exId);
    if (!it) return;
    const sets = it.sets.map(s => ({ reps: s.reps, kg: s.kg }));
    // Weights are typed in the user's unit and stored in kg.
    const v = f === 'kg' ? fromW(Math.max(0, +el.value || 0)) : Math.max(0, +el.value || 0);
    // Carry the change to the following sets, like in the workout screen.
    for (let j = k; j < sets.length; j++) {
      sets[j][f] = v;
      const inp = document.querySelector(`#sheet input[data-k="${j}"][data-f="${f}"]`);
      if (inp && j > k) inp.value = f === 'kg' ? fmtKg(v) : v;
    }
    p.plan.edits ||= {};
    p.plan.edits[editKey(w, d, exId)] = sets;
    // Before the first log, a typed weight also becomes the starting weight for later weeks.
    if (f === 'kg' && !lastLogFor(p, exId)) { p.startKg ||= {}; p.startKg[exId] = v; }
    touchProfile(p); scheduleSync(); rerender();
  },
  'pv-reset': (el) => {
    const p = profile(); const { w, d, ex, i } = el.dataset;
    delete p.plan.edits?.[editKey(+w, +d, ex)];
    if (p.startKg) delete p.startKg[ex];
    touchProfile(p); scheduleSync(); rerender(); openSetEditor(+w, +d, +i);
  },
  'swap': (el) => {
    const p = profile();
    const day = p.plan.days[+el.dataset.d];
    const ex = exById(el.dataset.ex);
    day.items[+el.dataset.i] = { exId: ex.id, pat: ex.pat };
    sortDay(day);
    touchProfile(p); scheduleSync(); closeSheet(); rerender(); toast(t('Exercise swapped for all weeks'));
  },
  'remove-ex': (el) => {
    const p = profile();
    p.plan.days[+el.dataset.d].items.splice(+el.dataset.i, 1);
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
  },
});

// ───────────── Active workout ─────────────
let openItem = null;

export function sessionView() {
  const s = state.session;
  if (!s?.startedAt) return { html: `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2>${t('Workout')}</h2><span></span></header><div class="card center"><p>${t('No workout in progress.')}</p><a class="btn primary" href="#/plan">${t('Go to my plan')}</a></div>` };
  const cur = s.items[s.cur.i];
  const set = cur?.sets[s.cur.s];
  if (openItem === null || openItem >= s.items.length) openItem = s.cur.i;
  const allDone = s.items.every(it => it.sets.every(x => x.done));
  const resting = s.phase === 'rest';

  let head;
  const wc = s.warm;
  if (wc?.endAt && !wc.done) {
    head = `<div class="hd">
      <small>${t('WARM-UP')} · ${esc(exName(wc.exId, wc.name))} · ${t('{n} min', { n: wc.min })}</small>
      <div class="bigtime" data-t="warm">${fmtClock(Math.ceil((wc.endAt - Date.now()) / 1000))}</div>
      <p>${t('The phone beeps when the time is up.')}</p>
      <div class="hd-btns"><button class="pillbtn light" data-act="timer-stop" data-k="warm">${t('Finish warm-up now')}</button></div></div>`;
  } else if (resting) {
    head = `<div class="hd rest-hd">
      <small>${t('REST · next: {name} · set {a}/{b}', { name: esc(exName(cur.exId, cur.name)), a: s.cur.s + 1, b: cur.sets.length })}</small>
      <div class="bigtime" data-t="rest">${fmtClock(Math.ceil(W.restLeft()))}</div>
      <div class="restbar"><i data-t="restbar"></i></div>
      <div class="hd-btns">
        <button class="pillbtn" data-act="rest-add" data-v="-15">${t('−15 s')}</button>
        <button class="pillbtn" data-act="rest-add" data-v="15">${t('+15 s')}</button>
        <button class="pillbtn light" data-act="rest-skip">${t('Skip rest')}</button>
      </div>${coachRest(s.items[s.cur.i])}</div>`;
  } else if (allDone || s.phase === 'ready') {
    head = `<div class="hd"><div class="bigline">${t('All sets done')} 🎉</div><p>${s.cardio && !s.cardio.done ? t('Finish with cardio and the cooldown, then tap Finish.') : t('Finish with the cooldown, then tap Finish.')}</p>
      <div class="hd-btns"><button class="pillbtn light" data-act="finish">${t('Finish workout')}</button></div></div>`;
  } else {
    const timed = cur.unit === 'sec';
    head = `<div class="hd">
      <div class="hd-row">
        <div class="bigline">${timed ? `${set.reps}<span class="x">${t('s')}</span>` : `${set.reps}<span class="x">×</span>`}${set.kg || !timed ? `<span class="kgbox">${fmtKg(set.kg)} ${wUnit()}</span>` : ''}</div>
        <div class="roundbtns">
          <button class="round" data-act="pause" aria-label="${t('Pause')}">${s.paused ? icon.play : icon.pause}</button>
          <button class="round" data-act="log-cur" aria-label="${t('Log set')}">${icon.check}</button>
        </div>
      </div>
      <div class="hd-name"><b>${esc(exName(cur.exId, cur.name))}</b><button class="iconbtn inv" data-act="go" data-href="#/ex/${encodeURIComponent(cur.exId)}" aria-label="${t('How to do it')}">${icon.info}</button></div>
      <small>${t('Set {a} of {b}', { a: s.cur.s + 1, b: cur.sets.length })} · ${timed ? t('hold timer') : t('set timer')} <b data-t="work">${fmtClock(W.workElapsed())}</b>${s.paused ? ' · ' + t('PAUSED') : ''}</small>
    </div>`;
  }

  const items = s.items.map((it, i) => {
    const e = exById(it.exId);
    const doneN = it.sets.filter(x => x.done).length;
    if (i !== openItem) {
      return `<div class="exrow ${doneN === it.sets.length ? 'complete' : ''}" data-act="open-item" data-i="${i}">
        ${thumb(e, photoFor(it.exId))}
        <div class="exbody"><b class="exname">${esc(exName(it.exId, it.name))}</b>
        <div class="chips">${it.sets.map(x => `<span class="chip ${x.done ? 'on' : ''}">${setLabel(x, it.unit)}</span>`).join('')}</div></div>
        <span class="count">${doneN}/${it.sets.length}</span>
      </div><div class="rest">${t('Rest: {n}', { n: fmtClock(it.rest) })}</div>`;
    }
    const unitLbl = it.unit === 'sec' ? t('Sec') : t('Reps');
    return `<div class="exopen">
      <div class="exrow flat">${thumb(e, photoFor(it.exId))}<div class="exbody"><a class="exname blue" href="#/ex/${encodeURIComponent(it.exId)}">${esc(exName(it.exId, it.name))}</a>${it.note ? `<small class="note">${esc(it.note)}</small>` : ''}</div>
        <button class="iconbtn" data-act="sess-menu" data-i="${i}" aria-label="${t('More options')}">${icon.dots}</button></div>
      <table class="sets"><thead><tr><th>${t('Set')}</th><th>${unitLbl}</th><th>${weightHead(it.assist)}</th><th>${t('Log')}</th></tr></thead><tbody>
      ${it.sets.map((x, si) => {
        const isCur = s.cur.i === i && s.cur.s === si && !x.done;
        return `<tr class="${x.done ? 'done' : ''} ${isCur ? 'cur' : ''}">
          <td><button class="setno" data-act="jump" data-i="${i}" data-s="${si}">${si + 1}</button></td>
          <td><input type="number" inputmode="numeric" min="0" value="${x.reps}" data-change="set-val" data-i="${i}" data-s="${si}" data-f="reps" aria-label="${t('Set {n}: {what}', { n: si + 1, what: unitLbl })}"></td>
          <td><input type="number" inputmode="decimal" min="0" step="0.5" value="${fmtKg(x.kg)}" data-change="set-val" data-i="${i}" data-s="${si}" data-f="kg" aria-label="${t('Set {n}: {what}', { n: si + 1, what: wUnit() })}"></td>
          <td><button class="logbtn ${x.done ? 'on' : ''}" data-act="log-row" data-i="${i}" data-s="${si}" aria-label="${t('Log set {n}', { n: si + 1 })}">${icon.check}</button></td>
        </tr>`;
      }).join('')}
      </tbody></table>
      <button class="linklike small" data-act="add-set" data-i="${i}">${icon.plus} ${t('Add set')}</button>
    </div><div class="rest">${t('Rest: {n}', { n: fmtClock(it.rest) })}</div>`;
  }).join('');

  const fresh = s.items.every(it => it.sets.every(x => !x.done));
  // Timed cardio card, used for the warm-up machine (k = 'warm') and the finisher (k = 'cardio').
  const timerCard = (k, label) => {
    const c = s[k];
    if (!c) return '';
    const running = c.endAt && !c.done;
    return `<div class="card cardio-card">
      <a href="#/ex/${encodeURIComponent(c.exId)}" aria-label="${esc(t('How to do it') + ': ' + (exById(c.exId)?.name || ''))}">${thumb(exById(c.exId), photoFor(c.exId), 'sm')}</a>
      <div><b>${esc(exName(c.exId, c.name))}</b><small>${label} · ${t('{n} min', { n: c.min })}${c.done ? ' · ' + t('done') + ' ✓' : ''}</small></div>
      ${running ? `<b class="bigtime sm" data-t="${k}">${fmtClock(Math.ceil((c.endAt - Date.now()) / 1000))}</b><button class="pillbtn" data-act="timer-stop" data-k="${k}">${t('Stop')}</button>`
        : `${k === 'warm' ? `<button class="iconbtn" data-act="warm-open" aria-label="${t('Change warm-up')}">${icon.edit}</button>` : !c.done && s.planId === profile().plan.id ? `<button class="iconbtn" data-act="cardio-open" data-d="${s.dayIdx}" aria-label="${t('Change cardio finisher')}">${icon.edit}</button>` : ''}<button class="pillbtn dark" data-act="timer-start" data-k="${k}">${c.done ? t('Again') : t('Start')}</button>`}
    </div>`;
  };
  const warm = `${timerCard('warm', t('Warm-up'))}
    ${s.warmup.length ? `<details class="card moves-card" ${fresh ? 'open' : ''}><summary><b>${t('Then: quick mobility')}</b> · ${t('{n} min', { n: Math.round(s.warmup.reduce((a, m) => a + m.sec, 0) / 60) })}</summary>
    <ul class="moves">${s.warmup.map((m, k) => `<li class="${m.done ? 'struck' : ''}" data-act="tick-move" data-list="warmup" data-k="${k}">${esc(t(m.name))}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul></details>` : ''}`;

  const cardio = timerCard('cardio', t('Finisher'));

  const cool = `<details class="card moves-card" ${allDone ? 'open' : ''}><summary><b>${t('Cooldown')}</b> · ${t('stretches')}</summary>
    <ul class="moves">${s.cooldown.map((m, k) => `<li class="${m.done ? 'struck' : ''}" data-act="tick-move" data-list="cooldown" data-k="${k}">${esc(t(m.name))}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul></details>`;

  return {
    full: true, cls: 'session',
    html: `<div class="sess-head ${resting ? 'resting' : ''}">
        <div class="sess-top"><button class="iconbtn inv" data-act="go" data-href="#/plan" aria-label="${t('Back')}">${icon.back}</button><span>${esc(dayName(s.dayIdx))} · <b data-t="elapsed">${fmtClock(W.elapsed())}</b></span><span class="hdr-btns"><a class="iconbtn inv" href="#/timer" aria-label="${t('Timer')}">${icon.timer}</a><button class="iconbtn inv" data-act="sess-options" aria-label="${t('More options')}">${icon.dots}</button></span></div>
        ${head}
      </div>
      <div class="sess-body">
        ${warm}
        <div class="exlist">${items}</div>
        ${cardio}
        ${cool}
        <button class="btn primary big" data-act="finish">${t('Finish workout')}</button>
        <button class="btn ghost" data-act="discard">${t('Discard workout')}</button>
      </div>`,
  };
}

function readRow(i, si) {
  const row = document.querySelector(`input[data-i="${i}"][data-s="${si}"][data-f="reps"]`);
  const kg = document.querySelector(`input[data-i="${i}"][data-s="${si}"][data-f="kg"]`);
  const set = state.session.items[i].sets[si];
  return { reps: row ? +row.value || 0 : set.reps, kg: kg ? fromW(+kg.value || 0) : set.kg };
}

function doLog(i, si) {
  const s = state.session;
  const set = s.items[i].sets[si];
  if (set.done) { W.unlogSet(i, si); rerender(); return; }
  W.unlockAudio();
  const v = readRow(i, si);
  const r = W.logSet(i, si, v.reps, v.kg);
  openItem = s.cur.i;
  if (r === 'finished') { toast(t('All sets logged!') + ' 💪'); say(t('All sets logged! Tap Finish to save the workout.')); }
  else say(t('Set done. Rest {n} seconds.', { n: s.items[i].rest }) + ' ' + t('Next:') + ' ' + setCue(s));
  rerender();
}

register({
  'log-cur': () => { const s = state.session; doLog(s.cur.i, s.cur.s); },
  'log-row': (el) => doLog(+el.dataset.i, +el.dataset.s),
  'set-val': (el) => {
    const s = state.session; const i = +el.dataset.i, si = +el.dataset.s, f = el.dataset.f;
    const it = s.items[i];
    const v = f === 'kg' ? fromW(+el.value || 0) : +el.value || 0;
    it.sets[si][f] = v;
    // Carry a changed value to the following sets that aren't logged yet.
    for (let k = si + 1; k < it.sets.length; k++) if (!it.sets[k].done) it.sets[k][f] = v;
    save(); rerender();
  },
  'pause': () => { W.togglePause(); rerender(); },
  'rest-add': (el) => { W.addRest(+el.dataset.v); rerender(); },
  'rest-skip': () => { W.skipRest(); rerender(); },
  'open-item': (el) => {
    const i = +el.dataset.i; openItem = i;
    const it = state.session.items[i];
    const si = it.sets.findIndex(x => !x.done);
    if (si >= 0 && state.session.phase !== 'rest') W.jumpTo(i, si);
    rerender();
  },
  'jump': (el) => { W.jumpTo(+el.dataset.i, +el.dataset.s); openItem = +el.dataset.i; rerender(); },
  'add-set': (el) => {
    const it = state.session.items[+el.dataset.i];
    const last = it.sets[it.sets.length - 1];
    it.sets.push({ reps: last.reps, kg: last.kg, done: false });
    save(); rerender();
  },
  'tick-move': (el) => { const m = state.session[el.dataset.list][+el.dataset.k]; m.done = !m.done; save(); rerender(); },
  'timer-start': (el) => { W.startTimer(el.dataset.k); if (el.dataset.k === 'warm') window.scrollTo(0, 0); rerender(); },
  'timer-stop': (el) => { W.timerDone(el.dataset.k); rerender(); },
  'sess-menu': (el) => {
    const i = +el.dataset.i; const it = state.session.items[i];
    sheet(`<h2>${esc(exName(it.exId, it.name))}</h2>
      <button class="row" data-act="go" data-href="#/ex/${encodeURIComponent(it.exId)}">${icon.info}<b>${t('How to do it')}</b></button>
      <button class="row" data-act="set-rest" data-i="${i}" data-v="-15"><b>${t('Rest −15 s')}</b><small>${t('now {n} s', { n: it.rest })}</small></button>
      <button class="row" data-act="set-rest" data-i="${i}" data-v="15"><b>${t('Rest +15 s')}</b></button>
      <button class="row" data-act="del-set" data-i="${i}"><b>${t('Remove last set')}</b></button>
      <button class="row danger" data-act="skip-ex" data-i="${i}"><b>${t('Skip this exercise today')}</b></button>`);
  },
  'set-rest': (el) => { const it = state.session.items[+el.dataset.i]; it.rest = Math.max(15, it.rest + +el.dataset.v); save(); closeSheet(); rerender(); },
  'del-set': (el) => { const it = state.session.items[+el.dataset.i]; if (it.sets.length > 1) it.sets.pop(); save(); closeSheet(); rerender(); },
  'skip-ex': (el) => {
    const s = state.session; s.items.splice(+el.dataset.i, 1);
    if (!s.items.length) { closeSheet(); W.discard(); location.hash = '#/plan'; return; }
    const ni = s.items.findIndex(it => it.sets.some(x => !x.done));
    s.cur = { i: Math.max(0, ni), s: ni >= 0 ? s.items[ni].sets.findIndex(x => !x.done) : 0 };
    openItem = s.cur.i; save(); closeSheet(); rerender();
  },
  'sess-options': () => sheet(`<h2>${t('Workout')}</h2>
      <button class="row" data-act="toggle-sound"><b>${t('Sound')}</b><span class="pill">${state.settings.sound ? t('On') : t('Off')}</span></button>
      <button class="row" data-act="test-beep"><b>${t('Test beep')}</b></button>
      <button class="row danger" data-act="discard"><b>${t('Discard workout')}</b></button>`),
  'toggle-sound': () => { state.settings.sound = !state.settings.sound; save(); closeSheet(); },
  'test-beep': () => { W.unlockAudio(); W.beep(3); },
  'finish': () => {
    const s = state.session;
    const left = s.items.reduce((a, it) => a + it.sets.filter(x => !x.done).length, 0);
    const logged = s.items.reduce((a, it) => a + it.sets.filter(x => x.done).length, 0);
    if (!logged) { if (confirm(t('No sets logged. Discard this workout?'))) { W.discard(); location.hash = '#/plan'; } return; }
    if (left && !confirm(t('{n} set(s) not logged. Finish anyway?', { n: left }))) return;
    closeSheet();
    const rec = W.finish();
    coachSpeakFinish();
    openItem = null;
    scheduleSync(500);
    location.hash = `#/summary/${rec.id}`;
  },
  'discard': () => {
    if (!confirm(t('Discard this workout? Logged sets will be lost.'))) return;
    closeSheet(); W.discard(); openItem = null; location.hash = '#/plan';
  },
});

// ───────────── Summary ─────────────
export function summaryView(id) {
  const p = profile();
  const rec = p.history.find(h => h.id === id);
  if (!rec) return { html: `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2>${t('Workout')}</h2><span></span></header><p>${t('Not found')}</p>` };
  const sets = rec.items.reduce((a, it) => a + it.sets.length, 0);
  const volume = Math.round(toW(rec.items.reduce((a, it) => a + it.sets.reduce((b, x) => b + (it.unit === 'reps' ? x.reps * x.kg : 0), 0), 0)));
  // Personal records: best weight this session vs. all earlier sessions.
  const prs = [];
  const idx = p.history.indexOf(rec);
  for (const it of rec.items) {
    if (it.unit !== 'reps') continue;
    const best = Math.max(...it.sets.map(x => x.kg || 0));
    if (!best) continue;
    const prev = p.history.slice(0, idx).flatMap(h => h.items.filter(x => x.exId === it.exId)).flatMap(x => x.sets.map(y => y.kg || 0));
    if (prev.length && best > Math.max(...prev)) prs.push(`${exName(it.exId, it.name)}: ${fmtKg(best)} ${wUnit()}`);
  }
  const mins = Math.round(rec.duration / 60);
  const title = rec.dayIdx != null ? dayName(rec.dayIdx) : t(rec.title);
  return {
    html: `<header class="bar"><button class="iconbtn" data-act="go" data-href="#/plan" aria-label="${t('Back')}">${icon.back}</button><h2>${esc(title)}</h2><span></span></header>
      ${coachFinish()}
      <p class="lead">${fmtDate(rec.date)}${rec.week ? ` · ${t('Week {w}', { w: rec.week })}` : ''}</p>
      <div class="statrow">
        <div class="stat"><b>${t('{n} min', { n: mins })}</b><small>${t('Duration')}</small></div>
        <div class="stat"><b>${sets}</b><small>${t('Sets')}</small></div>
        <div class="stat"><b>${volume.toLocaleString(locale())}</b><small>${t('{u} lifted', { u: wUnit() })}</small></div>
      </div>
      <div class="card"><b>${icon.fire} ${t('{n} kcal', { n: estimateCalories(p.stats, mins) })}</b> <span class="muted">${t('estimated')}</span></div>
      ${prs.length ? `<div class="card pr"><b>🏆 ${t('New personal bests')}</b><ul class="plain">${prs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <h3>${t('Log')}</h3>
      <div class="exlist">${rec.items.map(it => `<div class="exrow">${thumb(exById(it.exId), photoFor(it.exId))}<div class="exbody"><b class="exname">${esc(exName(it.exId, it.name))}</b><div class="chips">${it.sets.map(x => `<span class="chip on">${setLabel(x, it.unit)}</span>`).join('')}</div></div></div>`).join('')}
      ${rec.cardio ? `<div class="exrow">${thumb(exById(rec.cardio.exId))}<div class="exbody"><b class="exname">${esc(exName(rec.cardio.exId, MUSCLES.cardio))}</b><div class="chips"><span class="chip on">${t('{n} min', { n: rec.cardio.min })}</span></div></div></div>` : ''}</div>
      <button class="btn primary big" data-act="go" data-href="#/plan">${t('Done')}</button>
      <button class="btn ghost" data-act="del-record" data-id="${rec.id}">${t('Delete this log')}</button>`,
  };
}

register({
  'del-record': (el) => {
    if (!confirm(t('Delete this workout log? This cannot be undone.'))) return;
    const p = profile();
    p.history = p.history.filter(h => h.id !== el.dataset.id);
    if (p.plan) for (const k of Object.keys(p.plan.done)) if (p.plan.done[k] === el.dataset.id) delete p.plan.done[k];
    touchProfile(p); scheduleSync(); location.hash = '#/plan';
  },
});
