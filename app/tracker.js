// Tracker state for Leonida Legend: which trophies are earned, plus the spoiler-safe setting.
// Progress lives in localStorage so it survives reloads, and can be exported to a JSON file
// and imported back on any machine. Earned trophies are stored by their official list id.

const PROGRESS_KEY = 'leonida-legend-progress-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-safe';

export function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

export function loadSpoilerSafe() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

export function saveSpoilerSafe(on) {
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
}

// Download the current progress as a small JSON file the reader keeps.
export function exportProgress(earned) {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, earned: [...earned].sort((a, b) => a - b) }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// Read an exported progress file back. Accepts this app's { earned: [ids] } object or a bare
// array, and matches entries by trophy id or, failing that, by official name.
export async function importProgress(file, trophies) {
  const data = JSON.parse(await file.text());
  const list = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(list)) throw new Error('no earned list in file');
  const byName = new Map(trophies.map((t) => [t.name, t.id]));
  const ids = new Set();
  for (const item of list) {
    if (Number.isInteger(item) && trophies.some((t) => t.id === item)) ids.add(item);
    else if (typeof item === 'string' && byName.has(item)) ids.add(byName.get(item));
  }
  return ids;
}
