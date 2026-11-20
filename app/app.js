// app.js — the guide's entry point: loads the trophy data, holds the UI
// state (current view, filters, selected trophy) and wires the controls to
// the renderers in render.js and the progress state in tracker.js.

import {
  loadState,
  setEarned,
  setSpoilerSafe,
  exportProgress,
  importProgress,
} from './tracker.js';
import {
  renderProgress,
  renderList,
  renderDetail,
  renderRoadmap,
  renderMissables,
  filterTrophies,
} from './render.js';

const params = new URLSearchParams(location.search);

let trophies = [];
let state = loadState();
let view = ['tracker', 'roadmap', 'missables'].includes(params.get('view'))
  ? params.get('view')
  : 'tracker';
let selectedId = Number(params.get('open')) || 28; // default: the one missable trophy
const filters = {
  kind: params.get('kind') || 'all',
  grade: 'all',
  query: params.get('q') || '',
};
if (params.get('spoiler') === '1') state.spoilerSafe = true;

const els = {
  list: document.getElementById('trophy-list'),
  detail: document.getElementById('detail'),
  showing: document.getElementById('showing-line'),
  roadmap: document.getElementById('view-roadmap'),
  missables: document.getElementById('view-missables'),
  tracker: document.getElementById('view-tracker'),
  search: document.getElementById('search'),
  grade: document.getElementById('grade-filter'),
  spoiler: document.getElementById('spoiler-toggle'),
};

function selectedTrophy() {
  return trophies.find((t) => t.id === selectedId) || null;
}

function renderAll() {
  renderProgress(state, trophies);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  els.tracker.hidden = view !== 'tracker';
  els.roadmap.hidden = view !== 'roadmap';
  els.missables.hidden = view !== 'missables';

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === filters.kind);
  });
  els.grade.value = filters.grade;
  if (els.search.value !== filters.query) els.search.value = filters.query;
  els.spoiler.checked = state.spoilerSafe;

  const shown = filterTrophies(trophies, filters);
  els.showing.textContent =
    `Showing ${shown.length} of ${trophies.length} trophies — select one to read its guide.`;
  renderList(els.list, shown, state, selectedId);
  renderDetail(els.detail, selectedTrophy(), state);
  if (view === 'roadmap') renderRoadmap(els.roadmap, trophies, state);
  if (view === 'missables') renderMissables(els.missables, trophies, state);
}

/* ---------------- controls ---------------- */

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    view = tab.dataset.view;
    renderAll();
  });
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    filters.kind = chip.dataset.kind;
    view = 'tracker';
    renderAll();
  });
});

els.grade.addEventListener('change', () => {
  filters.grade = els.grade.value;
  renderAll();
});

els.search.addEventListener('input', () => {
  filters.query = els.search.value;
  renderAll();
});

els.spoiler.addEventListener('change', () => {
  setSpoilerSafe(state, els.spoiler.checked);
  renderAll();
});

document.getElementById('export-btn').addEventListener('click', () => {
  exportProgress(state);
});

const importFile = document.getElementById('import-file');
document.getElementById('import-btn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;
  importProgress(file)
    .then((newState) => {
      state = newState;
      renderAll();
    })
    .catch(() => {
      els.showing.textContent = 'That file could not be imported as Leonida Legend progress.';
    });
  importFile.value = '';
});

/* ---------------- shared interactions (all views) ---------------- */

document.addEventListener('change', (event) => {
  const box = event.target.closest('[data-earn]');
  if (!box) return;
  setEarned(state, Number(box.dataset.earn), box.checked);
  renderAll();
});

document.addEventListener('click', (event) => {
  const row = event.target.closest('[data-open]');
  if (!row || event.target.closest('[data-earn]')) return;
  selectedId = Number(row.dataset.open);
  view = 'tracker';
  renderAll();
});

/* ---------------- boot ---------------- */

fetch('data/trophies.json')
  .then((res) => {
    if (!res.ok) throw new Error(`trophies.json: ${res.status}`);
    return res.json();
  })
  .then((data) => {
    trophies = data.trophies;
    if (!selectedTrophy()) selectedId = trophies[0].id;
    renderAll();
  })
  .catch((err) => {
    els.list.innerHTML = `<p class="note-box">The trophy data could not be loaded (${err.message}). Serve the app over HTTP — file:// pages cannot fetch the data file.</p>`;
  });
