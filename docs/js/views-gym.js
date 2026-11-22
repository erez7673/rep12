// Exercise library, exercise details, Gym Setup and the "What is this machine?" picker.
import { state, profile, allExercises, exById, photoFor, isAvailable, eqOn, touchGym, touchProfile, uid, save } from './store.js';
import { esc, icon, thumb, register, toast, resizeImage, sheet, closeSheet } from './ui.js';
import { MUSCLES, MOTIONS, PATTERN_NAMES, TEMPLATES, INJURIES } from './exercises.js';
import { EQUIPMENT, EQUIP_CATS } from './equipment.js';
import { POSITIONS, GRIPS, FEEL, matchExercises, customExercise, identifyWithAI } from './identify.js';
import { lineChart } from './charts.js';
import { EQUIP_PIC } from './pictures.js';
import { hasAnim, animHTML, startAnims } from './anim.js';
import { generatePlan, dayFocus, sessionBudget, warmPref, dayCap, sortDay, raiseDayCap, MAX_EX_PER_DAY, dayName } from './planner.js';
import { t, toW, wUnit, unitText, listJoin } from './i18n.js';
import { rerender } from './app.js';
import { scheduleSync } from './sync.js';

const eqThumb = (id) => {
  const pic = EQUIP_PIC[id];
  return pic
    ? `<span class="thumb pic sm zoomable" data-act="pic-zoom" role="button" tabindex="0" aria-label="${t('Show the picture larger')}"><img src="${pic.url}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>`
    : `<span class="thumb sm"><span class="ico">${icon.gym}</span></span>`;
};
const eqName = (id) => EQUIPMENT.find(e => e.id === id)?.name || state.gym.machines.find(m => m.id === id)?.name || id;
const eqText = (eq) => eq === 'none' ? t('No equipment') : eq.split('|').map(alt => alt.split('+').map(eqName).join(' + ')).join(`  ${t('or')}  `);
// Exercise texts: custom exercises keep the language they were made in, and speeds or distances follow the unit setting.
const exText = (s) => unitText(t(s));

// ───────────── Library ─────────────
let filter = { q: '', m: '', availOnly: true };

function libraryList() {
  const q = filter.q.trim().toLowerCase();
  const list = allExercises().filter(e => (!filter.m || e.m === filter.m || e.s.includes(filter.m))
    && (!q || e.name.toLowerCase().includes(q) || MUSCLES[e.m].toLowerCase().includes(q))
    && (!filter.availOnly || isAvailable(e)))
    .sort((a, b) => (filter.m && a.m !== b.m ? (a.m === filter.m ? -1 : 1) : 0) || a.name.localeCompare(b.name));
  if (!list.length) return `<p class="muted center">${t('No exercises match.')}</p>`;
  return list.map(e => `<a class="exrow" href="#/ex/${encodeURIComponent(e.id)}">${thumb(e, photoFor(e.id))}
    <div class="exbody"><b class="exname">${esc(e.name)}</b><small>${esc(MUSCLES[e.m])}${e.s.length ? ' · ' + listJoin(e.s.map(x => MUSCLES[x])) : ''}</small></div>
    ${icon.chev}</a>`).join('');
}

export function libraryView() {
  const muscles = Object.entries(MUSCLES).filter(([k]) => k !== 'forearms');
  return {
    html: `<header class="top"><h1>${t('Exercises')}</h1></header>
      <label class="search">${icon.search}<input type="search" aria-label="${t('Search exercises')}" placeholder="${t('Search exercises')}" value="${esc(filter.q)}" data-input="lib-q"></label>
      <div class="chipscroll">
        <button class="chip sel ${!filter.m ? 'on' : ''}" data-act="lib-m" data-m="">${t('All')}</button>
        ${muscles.map(([k, v]) => `<button class="chip sel ${filter.m === k ? 'on' : ''}" data-act="lib-m" data-m="${k}">${esc(v)}</button>`).join('')}
      </div>
      <label class="toggle-line"><input type="checkbox" ${filter.availOnly ? 'checked' : ''} data-change="lib-avail"> ${t('Only what\'s available in my gym')}</label>
      <div class="exlist" id="liblist">${libraryList()}</div>`,
  };
}

register({
  'lib-q': (el) => { filter.q = el.value; document.getElementById('liblist').innerHTML = libraryList(); },
  'lib-m': (el) => { filter.m = el.dataset.m; rerender(); },
  'lib-avail': (el) => { filter.availOnly = el.checked; rerender(); },
});

// ───────────── Exercise details ─────────────
export function exerciseView(id) {
  const ex = exById(id);
  const back = `<header class="bar"><button class="iconbtn" data-act="back" aria-label="${t('Back')}">${icon.back}</button><h2></h2><span></span></header>`;
  if (!ex) return { html: back + `<p>${t('Exercise not found.')}</p>` };
  const p = profile();
  const photo = photoFor(ex.id);
  const liked = (p.stats.likes || []).includes(ex.id);
  const disliked = (p.stats.dislikes || []).includes(ex.id);
  const avoid = ex.avoid.filter(a => (p.stats.injuries || []).includes(a)).map(a => INJURIES[a] || a);
  const weighted = ex.unit === 'reps' && ex.load;
  const pts = p.history.flatMap(h => h.items.filter(it => it.exId === ex.id).map(it => ({ x: h.date, y: Math.max(...it.sets.map(s => weighted ? toW(s.kg || 0) : s.reps || 0)) })));
  const machines = state.gym.machines.filter(m => (m.exerciseIds || []).includes(ex.id));
  const steps = `<ol class="steps">${ex.steps.map(s => `<li>${esc(exText(s))}</li>`).join('')}</ol>`;
  return {
    html: `${back}
      <div class="hero">${photo ? `<img src="${photo}" alt="">` : thumb(ex, null, 'xl')}</div>
      <h1 class="title">${esc(ex.name)}</h1>
      <div class="chips">
        <span class="chip on">${esc(MUSCLES[ex.m])}</span>${ex.s.map(x => `<span class="chip">${esc(MUSCLES[x])}</span>`).join('')}
        <span class="chip">${esc(PATTERN_NAMES[ex.pat] || '')}</span>
      </div>
      <p class="muted">${icon.gym} ${esc(eqText(ex.eq))}${isAvailable(ex) ? '' : ` · <b class="warn">${t('not in your gym setup')}</b>`}</p>
      ${p.plan ? `<button class="btn primary" data-act="add-to-day" data-id="${ex.id}">${icon.plus} ${t('Add to workout')}</button>` : ''}
      ${machines.length ? `<p class="muted">${t('Your machine:')} ${listJoin(machines.map(m => esc([m.name, m.brand, m.model].filter(Boolean).join(' · '))))}</p>` : ''}
      ${avoid.length ? `<div class="card warncard">⚠️ ${t('Marked as risky for your {parts} – go light or swap it.', { parts: esc(listJoin(avoid)) })}</div>` : ''}
      <h3>${t('How to do it')}</h3>
      ${hasAnim(ex.id) ? `${animHTML(ex, p.stats.sex)}
        <details class="card moves-card"><summary><b>${t('Written steps')}</b></summary>${steps}</details>`
      : steps}
      ${ex.tip ? `<div class="card tip">💡 ${esc(exText(ex.tip))}</div>` : ''}
      ${ex.assist ? `<div class="card tip">${t('On assisted machines the weight helps you – more weight = easier. The app lowers it as you get stronger.')}</div>` : ''}
      ${ex.perHand ? `<p class="muted">${t('Weight shown is per dumbbell.')}</p>` : ''}
      <h3>${t('Your history')}</h3>
      <div class="card">${lineChart(pts, { unit: weighted ? ' ' + wUnit() : '' })}</div>
      <div class="btnrow">
        <button class="btn ${liked ? 'primary' : ''}" data-act="like" data-id="${ex.id}">👍 ${liked ? t('Favourite') : t('I like this')}</button>
        <button class="btn ${disliked ? 'danger' : ''}" data-act="dislike" data-id="${ex.id}">👎 ${disliked ? t('Avoided') : t('Avoid it')}</button>
      </div>
      <p class="muted small">${t('Likes and dislikes are used next time you rebuild your plan.')}</p>`,
    after: () => startAnims(exById),
  };
}

// "Add to workout": pick one of the plan's workout days (as many as the profile's days per week).
// Cardio exercises become that day's finisher, or the warm-up machine.
function addToDaySheet(ex) {
  const p = profile();
  const cardio = ex.pat === 'cardio';
  sheet(`<h2>${t('Add to workout')}</h2>
    <p class="muted small">${esc(ex.name)} – ${cardio ? t('as the cardio finisher of:') : t('added to every week of:')}</p>
    ${p.plan.days.map((day, d) => {
      const has = cardio ? day.cardio?.exId === ex.id : day.items.some(it => it.exId === ex.id);
      const full = !cardio && day.items.length >= dayCap(p);
      return `<button class="row" data-act="add-to-day-pick" data-id="${ex.id}" data-d="${d}" ${has ? 'disabled' : ''}>
        <span><b>${esc(dayName(d))}</b><small>${esc(dayFocus(day))}${full && !has ? ` · ${t('has {n} – tap to add or swap', { n: day.items.length })}` : ''}</small></span>${has ? `<span class="pill">${t('Already in it')}</span>` : full ? icon.swap : icon.plus}</button>`;
    }).join('')}
    ${cardio ? `<button class="row" data-act="add-to-warm" data-id="${ex.id}"><span><b>${t('Use as my warm-up')}</b><small>${t('All workout days')}</small></span>${icon.plus}</button>` : ''}
    <button class="btn ghost" data-act="sheet-close">${t('Cancel')}</button>`);
}

register({
  'add-to-day': (el) => addToDaySheet(exById(el.dataset.id)),
  'add-to-day-pick': (el) => {
    const p = profile(); const ex = exById(el.dataset.id); const d = +el.dataset.d; const day = p.plan.days[d];
    if (ex.pat === 'cardio') {
      day.cardio = { exId: ex.id, min: day.cardio?.min || sessionBudget(p.stats).cardio || 10 };
      toast(t('Cardio finisher of {day}', { day: dayName(d) }));
    } else if (day.items.length >= dayCap(p)) {
      // The day already has the number of exercises set in the profile: add it as an extra one, or replace one.
      const n = day.items.length + 1;
      sheet(`<h2>${t('Add or swap')}</h2>
        <p class="muted small">${t('{day} has {n} exercises.', { day: esc(dayName(d)), n: day.items.length })}</p>
        ${n <= MAX_EX_PER_DAY ? `<button class="row" data-act="add-to-day-extra" data-id="${ex.id}" data-d="${d}">${icon.plus}<span><b>${t('Add {name}', { name: esc(ex.name) })}</b><small>${t('{day} gets {n} exercises', { day: esc(dayName(d)), n })}${dayCap(p) < n ? t(', and you can have up to {n} on every workout day', { n }) : ''}</small></span></button>`
          : `<p class="muted small">${t('{n} exercises is the most a day can have.', { n: MAX_EX_PER_DAY })}</p>`}
        <h3>${t('Or swap it for')}</h3>
        ${day.items.map((it, i) => { const o = exById(it.exId); return o ? `<button class="row" data-act="add-to-day-replace" data-id="${ex.id}" data-d="${d}" data-i="${i}">${thumb(o, photoFor(o.id), 'sm')}<span><b>${esc(o.name)}</b><small>${esc(MUSCLES[o.m])}</small></span>${icon.swap}</button>` : ''; }).join('')}
        <button class="btn ghost" data-act="sheet-close">${t('Cancel')}</button>`);
      return;
    } else {
      day.items.push({ exId: ex.id, pat: ex.pat });
      sortDay(day);
      toast(t('Added to {day} ({a} of {b})', { day: dayName(d), a: day.items.length, b: dayCap(p) }));
    }
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
  },
  'add-to-day-extra': (el) => {
    const p = profile(); const ex = exById(el.dataset.id); const d = +el.dataset.d; const day = p.plan.days[d];
    if (day.items.some(it => it.exId === ex.id) || day.items.length >= MAX_EX_PER_DAY) return;
    day.items.push({ exId: ex.id, pat: ex.pat });
    raiseDayCap(p, day.items.length);
    sortDay(day);
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
    toast(t('Added to {day} ({n} exercises)', { day: dayName(d), n: day.items.length }));
  },
  'add-to-day-replace': (el) => {
    const p = profile(); const ex = exById(el.dataset.id); const d = +el.dataset.d; const day = p.plan.days[d];
    day.items[+el.dataset.i] = { exId: ex.id, pat: ex.pat };
    sortDay(day);
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
    toast(t('{name} is now in {day}', { name: ex.name, day: dayName(d) }));
  },
  'add-to-warm': (el) => {
    const p = profile();
    p.warm = { ...warmPref(p), exId: el.dataset.id };
    if (!p.warm.min) p.warm.min = 5;
    touchProfile(p); scheduleSync(); closeSheet(); toast(t('Set as your warm-up'));
  },
});

function toggleIn(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
register({
  'like': (el) => { const p = profile(); p.stats.likes ||= []; p.stats.dislikes ||= []; toggleIn(p.stats.likes, el.dataset.id); p.stats.dislikes = p.stats.dislikes.filter(x => x !== el.dataset.id); touchProfile(p); rerender(); },
  'dislike': (el) => { const p = profile(); p.stats.likes ||= []; p.stats.dislikes ||= []; toggleIn(p.stats.dislikes, el.dataset.id); p.stats.likes = p.stats.likes.filter(x => x !== el.dataset.id); touchProfile(p); rerender(); },
});

// ───────────── Gym Setup ─────────────
export function gymView() {
  const total = EQUIPMENT.length + state.gym.machines.length;
  const on = EQUIPMENT.filter(e => eqOn(e.id)).length + state.gym.machines.filter(m => m.on !== false).length;
  const machines = state.gym.machines;
  return {
    html: `<header class="top"><div><h1>${t('Gym Setup')}</h1><p class="sub">${t('{a}/{b} items on', { a: on, b: total })}</p></div></header>
      <button class="btn primary big" data-act="go" data-href="#/identify">${icon.camera} ${t('Add a machine with a photo')}</button>
      <p class="muted small">${t('Switch off anything your gym doesn\'t have. The plan only uses items that are on.')}</p>
      ${machines.length ? `<h3>${t('My machines')}</h3><div class="exlist">${machines.map(m => {
        const exs = (m.exerciseIds || []).map(exById).filter(Boolean);
        return `<div class="exrow"><span class="zoomable" data-act="pic-zoom" role="button" tabindex="0" aria-label="${t('Show the picture larger')}" data-title="${esc(m.name)}">${m.photo ? `<div class="thumb md"><img src="${m.photo}" alt=""></div>` : thumb(exs[0])}</span>
          <div class="exbody"><b class="exname">${esc(m.name)}</b><small>${esc([m.brand, m.model].filter(Boolean).join(' · '))}</small>
          <div class="chips">${exs.map(e => `<a class="chip on" href="#/ex/${encodeURIComponent(e.id)}">${esc(e.name)}</a>`).join('')}</div></div>
          <button class="iconbtn" data-act="machine-menu" data-id="${m.id}" aria-label="${t('More options')}">${icon.dots}</button></div>`;
      }).join('')}</div>` : ''}
      ${EQUIP_CATS.map(cat => `<h3>${esc(cat)}</h3><div class="card list">${EQUIPMENT.filter(e => e.cat === cat).map(e => `
        <label class="eqrow"><span class="eqname">${eqThumb(e.id)}<span>${esc(e.name)}</span></span>
        <input type="checkbox" class="switch" ${eqOn(e.id) ? 'checked' : ''} data-change="eq-toggle" data-id="${e.id}"></label>`).join('')}</div>`).join('')}
      <div class="card"><p><b>${t('Changed the equipment?')}</b> ${t('Rebuild your plan so it only uses what\'s on.')}</p><button class="btn" data-act="rebuild-plan">${t('Rebuild my plan')}</button></div>`,
  };
}

register({
  // Tap a picture in Gym Setup to see it big. preventDefault (in app.js) stops the tap from flipping the row's switch.
  'pic-zoom': (el) => {
    const img = el.querySelector('img');
    if (!img) return;
    const title = el.dataset.title || el.closest('.eqrow')?.querySelector('.eqname > span:last-child')?.firstChild?.textContent || '';
    sheet(`<h2>${esc(title.trim())}</h2>
      <div class="zoom-pic"><img src="${img.src}" alt="" referrerpolicy="no-referrer"></div>
      <button class="btn" data-act="sheet-close">${t('Close')}</button>`);
  },
  'eq-toggle': (el) => { state.gym.enabled[el.dataset.id] = el.checked; touchGym(); scheduleSync(); },
  'rebuild-plan': () => {
    if (!confirm(t('Rebuild your plan with the current equipment? Your logged history is kept, but plan progress restarts at week 1.'))) return;
    const p = profile(); const custom = p.plan?.custom; p.plan = generatePlan(p); if (custom) p.plan.custom = true; touchProfile(p); scheduleSync(); toast(t('Plan rebuilt')); location.hash = '#/plan';
  },
  'machine-menu': (el) => {
    const m = state.gym.machines.find(x => x.id === el.dataset.id);
    sheet(`<h2>${esc(m.name)}</h2>
      ${m.photo ? `<img class="sheet-photo" src="${m.photo}" alt="">` : ''}
      <button class="row" data-act="machine-rename" data-id="${m.id}"><b>${t('Rename')}</b></button>
      <button class="row" data-act="machine-toggle" data-id="${m.id}"><b>${m.on === false ? t('Mark as available') : t('Mark as not available')}</b></button>
      <button class="row danger" data-act="machine-del" data-id="${m.id}">${icon.trash}<b>${t('Delete machine')}</b></button>`);
  },
  'machine-rename': (el) => {
    const m = state.gym.machines.find(x => x.id === el.dataset.id);
    const n = prompt(t('Machine name'), m.name);
    if (n) { m.name = n.trim(); const cx = state.gym.customEx.find(e => e.eq === m.id); if (cx) cx.name = m.name; touchGym(); scheduleSync(); }
    closeSheet(); rerender();
  },
  'machine-toggle': (el) => { const m = state.gym.machines.find(x => x.id === el.dataset.id); m.on = m.on === false; touchGym(); scheduleSync(); closeSheet(); rerender(); },
  'machine-del': (el) => {
    if (!confirm(t('Delete this machine and its photo? Custom exercises made for it are removed too.'))) return;
    const id = el.dataset.id;
    state.gym.machines = state.gym.machines.filter(x => x.id !== id);
    state.gym.customEx = state.gym.customEx.filter(e => e.eq !== id);
    touchGym(); scheduleSync(); closeSheet(); rerender();
  },
});

// ───────────── "What is this machine?" picker ─────────────
let wiz = null;
const newWiz = () => ({ step: 0, photo: null, name: '', brand: '', model: '', pos: '', grip: '', mot: '', feel: [] });

const STEPS = 6; // photo, position, contact, movement, feel, result

export function identifyView() {
  wiz ||= newWiz();
  const st = wiz.step;
  const dots = Array.from({ length: STEPS }, (_, i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('');
  const choice = (field, map) => `<div class="choices">${Object.entries(map).map(([k, v]) => `<button class="choice ${wiz[field] === k ? 'on' : ''}" data-act="wiz-pick" data-f="${field}" data-v="${k}">${esc(v)}</button>`).join('')}</div>`;
  let body = '';
  if (st === 0) {
    body = `<h2>${t('Take a photo of the machine')}</h2>
      <p class="muted">${t('It\'s saved with the machine so you recognise it later.')}</p>
      <label class="photo-drop">${wiz.photo ? `<img src="${wiz.photo}" alt="">` : `${icon.camera}<span>${t('Tap to take a photo')}</span>`}
        <input type="file" accept="image/*" capture="environment" data-change="wiz-photo" hidden></label>
      <label class="field"><span>${t('Name (if you know it)')}</span><input value="${esc(wiz.name)}" data-input="wiz-text" data-f="name" placeholder="${t('e.g. Seated row')}"></label>
      <div class="two">
        <label class="field"><span>${t('Brand')}</span><input value="${esc(wiz.brand)}" data-input="wiz-text" data-f="brand" placeholder="${t('optional')}"></label>
        <label class="field"><span>${t('Model (on the frame plate)')}</span><input value="${esc(wiz.model)}" data-input="wiz-text" data-f="model" placeholder="${t('optional')}"></label>
      </div>
      ${state.settings.aiEnabled ? `<button class="btn" data-act="wiz-ai" ${wiz.photo ? '' : 'disabled'}>✨ ${t('Identify with AI')}</button>` : ''}
      <button class="btn primary big" data-act="wiz-next">${t('Next')}</button>`;
  } else if (st === 1) {
    body = `<h2>${t('How is your body positioned?')}</h2>${choice('pos', POSITIONS)}`;
  } else if (st === 2) {
    body = `<h2>${t('What do you hold or push against?')}</h2>${choice('grip', GRIPS)}`;
  } else if (st === 3) {
    body = `<h2>${t('What movement do you make?')}</h2><p class="muted">${t('Try the machine with no weight if you\'re not sure.')}</p>${choice('mot', MOTIONS)}`;
  } else if (st === 4) {
    body = `<h2>${t('Where do you feel it?')} <small class="muted">${t('(optional, pick any)')}</small></h2>
      <div class="choices grid">${Object.entries(FEEL).map(([k, v]) => `<button class="choice ${wiz.feel.includes(k) ? 'on' : ''}" data-act="wiz-feel" data-v="${k}">${esc(v)}</button>`).join('')}</div>
      <button class="btn primary big" data-act="wiz-next">${t('Show matches')}</button>`;
  } else {
    const matches = matchExercises(wiz);
    body = `<h2>${t('Is it one of these?')}</h2>
      ${wiz.photo ? `<img class="wiz-photo" src="${wiz.photo}" alt="">` : ''}
      ${matches.length ? matches.map(({ ex }) => `<div class="card match">
        <div class="exrow flat">${thumb(ex)}<div class="exbody"><b class="exname">${esc(ex.name)}</b><small>${esc(MUSCLES[ex.m])} · ${esc(eqText(ex.eq))}</small></div></div>
        <ol class="steps small">${ex.steps.slice(0, 3).map(s => `<li>${esc(exText(s))}</li>`).join('')}</ol>
        <button class="btn primary" data-act="wiz-save" data-ex="${ex.id}">${t('Yes, this is it')}</button></div>`).join('')
      : `<p class="muted">${t('No close match in the library.')}</p>`}
      <div class="card"><p><b>${t('None of these?')}</b> ${t('Create a custom exercise from your answers – the app writes short instructions for this type of movement.')}</p>
      <button class="btn" data-act="wiz-custom">${t('Create custom exercise')}</button></div>`;
  }
  return {
    full: true,
    html: `<header class="bar"><button class="iconbtn" data-act="wiz-back" aria-label="${t('Back')}">${icon.back}</button><h2>${t('What is this machine?')}</h2><button class="iconbtn" data-act="wiz-cancel" aria-label="${t('Cancel')}">${icon.x}</button></header>
      <div class="wizdots">${dots}</div>${body}`,
  };
}

function saveMachine(exerciseIds, extra = {}) {
  const m = { id: uid('m'), name: wiz.name.trim() || extra.name || t('My machine'), brand: wiz.brand, model: wiz.model.trim(), photo: wiz.photo, exerciseIds, on: true, createdAt: Date.now(), answers: { pos: wiz.pos, grip: wiz.grip, mot: wiz.mot, feel: wiz.feel } };
  state.gym.machines.push(m);
  return m;
}

register({
  'wiz-back': () => { if (!wiz || wiz.step === 0) { wiz = null; history.back(); return; } wiz.step--; rerender(); },
  'wiz-cancel': () => { wiz = null; location.hash = '#/gym'; },
  'wiz-next': () => {
    if (wiz.step === 3 && !wiz.mot) return toast(t('Pick a movement'));
    wiz.step = Math.min(5, wiz.step + 1); rerender();
  },
  'wiz-pick': (el) => { wiz[el.dataset.f] = el.dataset.v; wiz.step++; rerender(); },
  'wiz-feel': (el) => { toggleIn(wiz.feel, el.dataset.v); rerender(); },
  'wiz-text': (el) => { wiz[el.dataset.f] = el.value; },
  'wiz-photo': async (el) => {
    const f = el.files?.[0];
    if (!f) return;
    try { wiz.photo = await resizeImage(f); rerender(); } catch (e) { toast(t('Could not read that photo')); }
  },
  'wiz-ai': async () => {
    toast(t('Asking AI…'));
    try {
      const r = await identifyWithAI(wiz.photo);
      if (!r) return toast(t('AI is not set up'));
      Object.assign(wiz, { name: wiz.name || r.name || '', pos: r.pos || '', grip: r.grip || '', mot: r.mot || '', feel: r.feel || [] });
      wiz.step = r.mot ? 5 : 1; rerender();
    } catch (e) { toast(t('AI failed: {msg}', { msg: e.message })); }
  },
  'wiz-save': (el) => {
    const ex = exById(el.dataset.ex);
    // Turn on the equipment this exercise needs (first option).
    for (const id of ex.eq.split('|')[0].split('+')) if (id !== 'none') state.gym.enabled[id] = true;
    saveMachine([ex.id], { name: ex.name });
    touchGym(); scheduleSync();
    wiz = null;
    toast(t('Machine saved'));
    location.hash = `#/ex/${encodeURIComponent(ex.id)}`;
  },
  'wiz-custom': () => {
    if (!wiz.mot) return toast(t('Pick a movement first'));
    const m = saveMachine([], { name: t('{kind} machine', { kind: PATTERN_NAMES[TEMPLATES[wiz.mot]?.pat] || t('Custom') }) });
    const cx = customExercise(m, wiz);
    m.exerciseIds = [cx.id];
    state.gym.customEx.push(cx);
    touchGym(); scheduleSync();
    wiz = null;
    toast(t('Custom exercise created'));
    location.hash = `#/ex/${encodeURIComponent(cx.id)}`;
  },
});
