// Stand-alone timer (bottom bar → Timer): a stopwatch and a countdown with presets.
// Works without a workout. Times are stored as timestamps so they keep running when the phone locks.
// Kept on this phone only (state.timer is not synced).
import { state, save } from './store.js';
import { icon, register, fmtClock } from './ui.js';
import { t as tr } from './i18n.js';
import * as W from './workout.js';
import { rerender } from './app.js';

const PRESETS = [30, 45, 60, 90, 120, 180];

function T() {
  state.timer ||= {};
  const t = state.timer;
  t.mode ||= 'countdown';
  t.sw ||= { acc: 0, startAt: null };
  t.cd ||= { total: 60, left: 60, endAt: null, fired: false };
  return t;
}

const swSec = (t = T()) => (t.sw.acc + (t.sw.startAt ? Date.now() - t.sw.startAt : 0)) / 1000;
const cdSec = (t = T()) => Math.max(0, t.cd.endAt ? (t.cd.endAt - Date.now()) / 1000 : t.cd.left);

// Called by the app's 250 ms loop: updates the numbers on screen and beeps when the countdown ends.
export function timerTick() {
  const t = state.timer;
  if (!t) return;
  if (t.cd?.endAt && !t.cd.fired && Date.now() >= t.cd.endAt) {
    t.cd.fired = true; t.cd.endAt = null; t.cd.left = 0;
    W.beep(4); save();
    if (location.hash === '#/timer') rerender();
  }
  for (const el of document.querySelectorAll('[data-t="tsw"]')) el.textContent = fmtClock(Math.floor(swSec(t)));
  for (const el of document.querySelectorAll('[data-t="tcd"]')) el.textContent = fmtClock(Math.ceil(cdSec(t)));
}

export function timerView() {
  const t = T();
  const tab = (k, label) => `<button class="${t.mode === k ? 'on' : ''}" data-act="t-mode" data-k="${k}">${label}</button>`;
  let body;
  if (t.mode === 'stopwatch') {
    const running = !!t.sw.startAt;
    body = `<div class="bigtime" data-t="tsw">${fmtClock(Math.floor(swSec(t)))}</div>
      <p>${tr('Counts up. Handy for planks, holds or timing your rests.')}</p>
      <div class="hd-btns">
        <button class="pillbtn light" data-act="t-sw">${running ? tr('Pause') : swSec(t) ? tr('Continue') : tr('Start')}</button>
        <button class="pillbtn" data-act="t-sw-reset" ${swSec(t) ? '' : 'disabled'}>${tr('Reset')}</button>
      </div>`;
  } else {
    const running = !!t.cd.endAt;
    const left = cdSec(t);
    body = `<div class="bigtime" data-t="tcd">${fmtClock(Math.ceil(left))}</div>
      <p>${running ? tr('The phone beeps when the time is up.') : left ? tr('Set to {time}.', { time: fmtClock(t.cd.total) }) : tr('Time is up!')}</p>
      <div class="hd-btns">
        <button class="pillbtn" data-act="t-cd-add" data-v="-15">${tr('−15 s')}</button>
        <button class="pillbtn" data-act="t-cd-add" data-v="15">${tr('+15 s')}</button>
        <button class="pillbtn light" data-act="t-cd">${running ? tr('Pause') : left && left < t.cd.total ? tr('Continue') : tr('Start')}</button>
        <button class="pillbtn" data-act="t-cd-reset">${tr('Reset')}</button>
      </div>`;
  }
  return {
    html: `<header class="top"><h1>${tr('Timer')}</h1></header>
      <div class="tabs2">${tab('countdown', tr('Countdown'))}${tab('stopwatch', tr('Stopwatch'))}</div>
      <div class="timer-card hd">${body}</div>
      ${t.mode === 'countdown' ? `<h3>${tr('Quick set')}</h3>
        <div class="choices grid3">${PRESETS.map(s => `<button class="choice ${t.cd.total === s ? 'on' : ''}" data-act="t-cd-set" data-v="${s}">${s < 60 ? tr('{n} s', { n: s }) : fmtClock(s)}</button>`).join('')}</div>` : ''}
      <p class="muted small">${icon.info} ${tr('The timer keeps running when you switch tabs or lock the phone. During a workout the rest timer still runs on its own.')}</p>
      <button class="btn ghost" data-act="toggle-sound-t">${tr('Sound')}: ${state.settings.sound ? tr('On') : tr('Off')}</button>`,
  };
}

const done = () => { save(); rerender(); };
const setCd = (sec) => { const t = T(); sec = Math.max(5, Math.min(3600, sec)); t.cd = { total: sec, left: sec, endAt: null, fired: false }; };

register({
  't-mode': (el) => { T().mode = el.dataset.k; done(); },
  't-sw': () => {
    const t = T(); W.unlockAudio();
    if (t.sw.startAt) { t.sw.acc += Date.now() - t.sw.startAt; t.sw.startAt = null; } else t.sw.startAt = Date.now();
    done();
  },
  't-sw-reset': () => { T().sw = { acc: 0, startAt: null }; done(); },
  't-cd': () => {
    const t = T(); W.unlockAudio();
    if (t.cd.endAt) { t.cd.left = cdSec(t); t.cd.endAt = null; }
    else { if (!t.cd.left) t.cd.left = t.cd.total; t.cd.endAt = Date.now() + t.cd.left * 1000; t.cd.fired = false; }
    done();
  },
  't-cd-add': (el) => {
    const t = T(); const v = +el.dataset.v;
    if (t.cd.endAt) t.cd.endAt = Math.max(Date.now() + 1000, t.cd.endAt + v * 1000);
    else setCd(Math.round(cdSec(t) || t.cd.total) + v);
    done();
  },
  't-cd-set': (el) => { setCd(+el.dataset.v); done(); },
  't-cd-reset': () => { setCd(T().cd.total); done(); },
  'toggle-sound-t': () => { state.settings.sound = !state.settings.sound; W.unlockAudio(); if (state.settings.sound) W.beep(1); done(); },
});
