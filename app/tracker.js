// tracker.js — the tracker's progress state: what is earned, whether
// spoiler-safe mode is on, and moving that state in and out of the browser.
// State lives in localStorage only; export downloads it as a JSON file and
// import reads such a file back.

const STORAGE_KEY = 'leonidaLegend.progress.v1';

export function defaultState() {
  return { earned: [], spoilerSafe: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.earned)) return defaultState();
    return {
      earned: parsed.earned.filter((id) => Number.isInteger(id)),
      spoilerSafe: parsed.spoilerSafe === true,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota); the tracker still
    // works for the session, it just cannot persist.
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function setEarned(state, id, on) {
  const has = isEarned(state, id);
  if (on && !has) state.earned.push(id);
  if (!on && has) state.earned = state.earned.filter((x) => x !== id);
  saveState(state);
}

export function setSpoilerSafe(state, on) {
  state.spoilerSafe = on === true;
  saveState(state);
}

export function progressOf(state, trophies) {
  const byGrade = {};
  let earnedCount = 0;
  for (const t of trophies) {
    if (!byGrade[t.grade]) byGrade[t.grade] = { earned: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (isEarned(state, t.id)) {
      byGrade[t.grade].earned += 1;
      earnedCount += 1;
    }
  }
  const total = trophies.length;
  return {
    earnedCount,
    total,
    pct: total ? Math.round((earnedCount / total) * 100) : 0,
    byGrade,
  };
}

export function exportProgress(state) {
  const payload = JSON.stringify(
    { app: 'leonida-legend', version: 1, earned: state.earned, spoilerSafe: state.spoilerSafe },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-legend-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importProgress(file) {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.earned)) {
      throw new Error('That file does not hold Leonida Legend progress.');
    }
    const state = {
      earned: parsed.earned.filter((id) => Number.isInteger(id)),
      spoilerSafe: parsed.spoilerSafe === true,
    };
    saveState(state);
    return state;
  });
}
