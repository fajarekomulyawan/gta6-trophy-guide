// tracker.js — Leonida Legend
// Owns the player's progress state: which trophies are earned, and whether
// spoiler-safe mode is on. State persists in localStorage and can be exported
// to / imported from a JSON file so a checklist survives between browsers.

const STORAGE_KEY = 'leonida-legend-state-v1';

function blankState() {
  return { earned: [], spoilerSafe: false };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : [],
      spoilerSafe: parsed.spoilerSafe === true,
    };
  } catch {
    return blankState();
  }
}

export function createTracker() {
  const stored = readStored();
  const earned = new Set(stored.earned);
  let spoilerSafe = stored.spoilerSafe;

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned], spoilerSafe }));
    } catch {
      // Storage can be unavailable (private mode, quotas); the tracker still
      // works for the session, it just will not persist.
    }
  }

  return {
    isEarned: (id) => earned.has(id),
    earnedCount: () => earned.size,
    earnedIds: () => [...earned],
    toggle(id) {
      if (earned.has(id)) earned.delete(id);
      else earned.add(id);
      persist();
      return earned.has(id);
    },
    isSpoilerSafe: () => spoilerSafe,
    setSpoilerSafe(on) {
      spoilerSafe = on === true;
      persist();
    },
    exportJSON() {
      return JSON.stringify(
        { app: 'leonida-legend', version: 1, earned: [...earned].sort((a, b) => a - b), spoilerSafe },
        null,
        2,
      );
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(list)) throw new Error('No earned list found in that file.');
      earned.clear();
      for (const n of list) if (Number.isInteger(n)) earned.add(n);
      if (typeof parsed.spoilerSafe === 'boolean') spoilerSafe = parsed.spoilerSafe;
      persist();
      return earned.size;
    },
  };
}
