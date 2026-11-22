// Spoken workout cues (Accessibility → Spoken workout cues): the phone says what happens next,
// for people who can't easily see the screen. Uses the phone's own text-to-speech in the app's language.
import { state } from './store.js';
import { locale, t } from './i18n.js';

const synth = () => window.speechSynthesis;
export const canSpeak = () => !!synth() && typeof SpeechSynthesisUtterance !== 'undefined';
export const speakOn = () => !!state.settings.speak && canSpeak();

// Says the text now, cutting off anything still being said. force: speak even when the setting is off (the test button).
export function say(text, force = false) {
  if (!text || !(force ? canSpeak() : speakOn())) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale();
    u.rate = 0.95;
    synth().cancel();
    synth().speak(u);
  } catch (e) { /* no voice on this phone */ }
}

// "Rest over. Leg Press, set 2 of 4." – what to do now in the workout s.
export function setCue(s, rest = false) {
  const it = s?.items?.[s.cur?.i];
  if (!it) return '';
  const a = s.cur.s + 1, b = it.sets.length;
  const what = a === b ? t('{name}, last set.', { name: it.name }) : t('{name}, set {a} of {b}.', { name: it.name, a, b });
  return rest ? t('Rest over.') + ' ' + what : what;
}
