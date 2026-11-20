// Leonida Legend — GTA VI trophy guide & tracker. Entry module: loads the trophy data,
// holds the UI state, wires the controls, and re-renders the current view on every change.
// Everything is a local file; with the network off the app works exactly the same.

import { loadEarned, saveEarned, loadSpoilerSafe, saveSpoilerSafe, exportProgress, importProgress } from './tracker.js';
import { STAGES, trophiesInStage } from './roadmap.js';
import { renderHeader, renderTracker, renderRoadmap, renderMissables, renderDetail } from './render.js';

const doc = await (await fetch('data/trophies.json')).json();

const state = {
  trophies: doc.trophies,
  earned: loadEarned(),
  spoilerSafe: loadSpoilerSafe(),
  view: 'tracker',
  kind: 'all',
  grade: 'all',
  query: '',
  selectedId: null,
};

const root = document.getElementById('view-root');
const panel = document.getElementById('detail');

const handlers = {
  toggle(id, checked) {
    if (checked) state.earned.add(id);
    else state.earned.delete(id);
    saveEarned(state.earned);
    render();
  },
  select(id) {
    state.selectedId = id;
    render();
  },
};

function render() {
  renderHeader(state);
  if (state.view === 'tracker') renderTracker(root, state, handlers);
  else if (state.view === 'roadmap') renderRoadmap(root, state, handlers, STAGES, trophiesInStage);
  else renderMissables(root, state, handlers);
  renderDetail(panel, state, handlers, STAGES);
}

// View tabs.
for (const btn of document.querySelectorAll('.view-btn')) {
  btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    for (const b of document.querySelectorAll('.view-btn')) b.classList.toggle('active', b === btn);
    render();
  });
}

// Kind filter chips.
for (const chip of document.querySelectorAll('#kind-chips .chip')) {
  chip.addEventListener('click', () => {
    state.kind = chip.dataset.kind;
    for (const c of document.querySelectorAll('#kind-chips .chip')) c.classList.toggle('active', c === chip);
    if (state.view !== 'tracker') {
      state.view = 'tracker';
      for (const b of document.querySelectorAll('.view-btn')) b.classList.toggle('active', b.dataset.view === 'tracker');
    }
    render();
  });
}

// Grade filter and text search.
document.getElementById('grade-filter').addEventListener('change', (e) => {
  state.grade = e.target.value;
  render();
});
document.getElementById('search').addEventListener('input', (e) => {
  state.query = e.target.value.trim();
  render();
});

// Spoiler-safe toggle.
const spoilerToggle = document.getElementById('spoiler-toggle');
spoilerToggle.checked = state.spoilerSafe;
spoilerToggle.addEventListener('change', () => {
  state.spoilerSafe = spoilerToggle.checked;
  saveSpoilerSafe(state.spoilerSafe);
  render();
});

// Export / import progress.
document.getElementById('export-btn').addEventListener('click', () => exportProgress(state.earned));
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state.earned = await importProgress(file, state.trophies);
    saveEarned(state.earned);
    render();
  } catch {
    alert('That file does not look like exported Leonida Legend progress.');
  }
  e.target.value = '';
});

render();
