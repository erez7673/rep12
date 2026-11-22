// Language and units.
// Text: t("English text", {vars}) returns the translation for the chosen language, or the English text.
// Translations live in lang/<code>.js as { id: text }, where lang/keys.js maps each id to its English text
// (tools/i18n/extract.mjs keeps keys.js up to date). Weights are always stored in kg and heights in cm;
// the helpers below convert for people who chose US units (lb, ft/in).
import { state, save } from './store.js';

export const LANGS = {
  en: 'English', es: 'Español', pt: 'Português', de: 'Deutsch', it: 'Italiano', fi: 'Suomi', sv: 'Svenska',
  zh: '中文', hi: 'हिन्दी', ar: 'العربية', he: 'עברית',
};
const RTL = ['ar', 'he'];
// Languages whose translation is finished; only these can be picked.
export const READY = ['en', 'es', 'pt', 'de', 'it', 'fi', 'sv', 'zh'];
export const langChoices = () => Object.fromEntries(Object.entries(LANGS).filter(([k]) => READY.includes(k)));

let byEn = null; // Map: English text → translation

// Language and units chosen on this phone. New users get their phone's language, and US units on a US phone.
// People who used the app before these settings existed keep English and metric.
export function initSettings() {
  const s = state.settings;
  const old = Object.keys(state.profiles).length > 0;
  const nav = (navigator.language || 'en').toLowerCase();
  if (!s.lang) s.lang = old ? 'en' : (READY.includes(nav.slice(0, 2)) ? nav.slice(0, 2) : 'en');
  if (!READY.includes(s.lang)) s.lang = 'en';
  if (!s.units) s.units = !old && /^en-(us|lr)|^es-us|-us$/.test(nav) ? 'us' : 'metric';
  save();
}

export const lang = () => state.settings.lang || 'en';

// Loads the chosen language before the first screen is drawn.
export async function loadLang() {
  const code = lang();
  document.documentElement.lang = code;
  document.documentElement.dir = RTL.includes(code) ? 'rtl' : 'ltr';
  if (code === 'en') { byEn = null; return; }
  try {
    const [{ KEYS }, { default: tr }] = await Promise.all([import('./lang/keys.js'), import(`./lang/${code}.js`)]);
    byEn = new Map();
    for (const [id, en] of Object.entries(KEYS)) if (tr[id]) byEn.set(en, tr[id]);
  } catch (e) { console.warn('language', code, e); byEn = null; }
}

export function t(s, vars) {
  let out = (byEn && byEn.get(s)) || s;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return out;
}

// Locale for dates and numbers.
export const locale = () => lang() === 'en' ? (isUS() ? 'en-US' : 'en-GB') : lang();

// ── Units ──
export const LB = 0.45359237;
export const isUS = () => state.settings.units === 'us';
export const wUnit = () => isUS() ? t('lb') : t('kg');
// kg → the number shown (lb or kg).
export const toW = (kg) => isUS() ? Math.round((kg || 0) / LB * 10) / 10 : Math.round((kg || 0) * 100) / 100;
// Number the user typed (lb or kg) → kg.
export const fromW = (v) => isUS() ? (+v || 0) * LB : (+v || 0);
export const fmtW = (kg) => `${toW(kg)} ${wUnit()}`;
// Weight step of an exercise (in kg): its metric step, or in US units the nearest 2.5 lb step
// (2–2.5 kg → 5 lb, 5 kg → 10 lb, 1.25 kg → 2.5 lb), as US dumbbells and plates go.
export const wStep = (inc) => isUS() ? Math.max(2.5, Math.round(inc / LB / 2.5) * 2.5) * LB : inc;
// Height: 170 cm or 5′ 7″.
export const toFtIn = (cm) => { const inch = Math.round((cm || 0) / 2.54); return [Math.floor(inch / 12), inch % 12]; };
export const fmtH = (cm) => { if (!isUS()) return `${cm} cm`; const [f, i] = toFtIn(cm); return `${f}′ ${i}″`; };
// Speeds and short distances inside exercise text.
export function unitText(s) {
  if (!isUS()) return s;
  return s
    .replace(/(\d+(?:\.\d+)?)–(\d+(?:\.\d+)?) km\/h/g, (m, a, b) => `${(a / 1.609).toFixed(1)}–${(b / 1.609).toFixed(1)} mph`)
    .replace(/(\d+)–(\d+) cm/g, (m, a, b) => `${Math.round(a / 2.54)}–${Math.round(b / 2.54)} in`);
}
