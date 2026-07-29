import {
  APP_VERSION,
  SCHEMA_VERSION,
  STORAGE_KEY,
  addMissingDefaultHabits,
  createDefaultState,
  ensureWeek,
  syncOpenWeekPlans,
  validateImportedData,
} from "./core.mjs";

export function loadState(now = new Date()) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState(now);
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return createDefaultState(now);
    }
    const state = validateImportedData(parsed);
    state.meta.appVersion = APP_VERSION;
    const defaultsAdded = addMissingDefaultHabits(state, now);
    ensureWeek(state, now);
    if (defaultsAdded) syncOpenWeekPlans(state, now);
    return state;
  } catch (error) {
    console.warn("Lokale Daten konnten nicht geladen werden.", error);
    return createDefaultState(now);
  }
}

export function saveState(state) {
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function replaceState(candidate, now = new Date()) {
  const state = validateImportedData(candidate);
  state.meta.appVersion = APP_VERSION;
  const defaultsAdded = addMissingDefaultHabits(state, now);
  ensureWeek(state, now);
  if (defaultsAdded) syncOpenWeekPlans(state, now);
  saveState(state);
  return state;
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
