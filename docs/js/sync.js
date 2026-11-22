// Sync profiles and the gym setup with a Google Sheet through a Google Apps Script web app.
// Newest version wins (compared by updatedAt). See apps-script/Code.gs.
import { state, save } from './store.js';
import { t } from './i18n.js';

let timer = null;
let running = false;

async function call(body) {
  const { syncUrl, syncKey } = state.settings;
  const res = await fetch(syncUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // simple request → no CORS preflight
    body: JSON.stringify({ ...body, key: syncKey }),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || t('Sync failed'));
  return j;
}

export const syncEnabled = () => !!(state.settings.syncUrl && state.settings.syncKey);

export async function syncNow() {
  if (!syncEnabled() || running || !navigator.onLine) return { skipped: true };
  running = true;
  try {
    const { items } = await call({ action: 'pull' });
    let pulled = 0;
    const remoteTimes = {};
    for (const [key, row] of Object.entries(items || {})) {
      remoteTimes[key] = row.updatedAt;
      if (key === 'gym') {
        if (row.updatedAt > (state.gym.updatedAt || 0)) { state.gym = row.data; pulled++; }
      } else if (key.startsWith('profile:')) {
        const id = key.slice(8);
        const local = state.profiles[id];
        if (!local || row.updatedAt > (local.updatedAt || 0)) { state.profiles[id] = row.data; pulled++; }
      }
    }
    if (!state.activeProfile || !state.profiles[state.activeProfile]) state.activeProfile = Object.keys(state.profiles)[0] || null;

    const push = [];
    if ((state.gym.updatedAt || 0) > (remoteTimes.gym || 0)) push.push({ key: 'gym', updatedAt: state.gym.updatedAt, data: state.gym });
    for (const p of Object.values(state.profiles)) {
      const k = `profile:${p.id}`;
      if ((p.updatedAt || 0) > (remoteTimes[k] || 0)) push.push({ key: k, updatedAt: p.updatedAt, data: p });
    }
    if (push.length) await call({ action: 'push', items: push });
    state.settings.lastSync = Date.now();
    state.settings.lastSyncError = '';
    save(true);
    return { pulled, pushed: push.length };
  } catch (e) {
    state.settings.lastSyncError = String(e.message || e);
    save();
    throw e;
  } finally { running = false; }
}

export function scheduleSync(delay = 4000) {
  if (!syncEnabled()) return;
  clearTimeout(timer);
  timer = setTimeout(() => syncNow().catch(e => console.warn('sync', e)), delay);
}
