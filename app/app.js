// app.js — Leonida Legend entry point.
// Loads the trophy data, builds the tracker state, wires the controls, and
// re-renders on every change. URL parameters mirror the UI state so views
// can be linked and screenshotted: ?view=roadmap, ?view=missables,
// ?spoiler=1, ?q=rob, ?open=28.

import { createTracker } from './tracker.js';
import {
  renderProgress,
  renderTrackerView,
  renderRoadmapView,
  renderMissablesView,
  renderDetail,
} from './render.js';

const els = {
  list: document.getElementById('list-pane'),
  detail: document.getElementById('detail-pane'),
  progress: {
    count: document.getElementById('progress-count'),
    pct: document.getElementById('progress-pct'),
    fill: document.getElementById('progress-fill'),
    grades: document.getElementById('grade-counts'),
  },
  tabs: document.getElementById('view-tabs'),
  chips: document.getElementById('kind-chips'),
  grade: document.getElementById('grade-filter'),
  search: document.getElementById('search'),
  spoiler: document.getElementById('spoiler-safe'),
  exportBtn: document.getElementById('export-btn'),
  importFile: document.getElementById('import-file'),
};

const params = new URLSearchParams(location.search);
const tracker = createTracker();
if (params.get('spoiler') === '1') tracker.setSpoilerSafe(true);
if (params.get('spoiler') === '0') tracker.setSpoilerSafe(false);

const ui = {
  view: ['tracker', 'roadmap', 'missables'].includes(params.get('view')) ? params.get('view') : 'tracker',
  kind: 'all',
  grade: 'all',
  query: params.get('q') || '',
  selectedId: Number.parseInt(params.get('open') || '', 10) || null,
};

let trophies = [];

function ctx() {
  return { tracker, kind: ui.kind, grade: ui.grade, query: ui.query, selectedId: ui.selectedId };
}

function render() {
  renderProgress(els.progress, trophies, tracker);
  if (ui.view === 'roadmap') renderRoadmapView(els.list, trophies, ctx());
  else if (ui.view === 'missables') renderMissablesView(els.list, trophies, ctx());
  else renderTrackerView(els.list, trophies, ctx());
  const selected = trophies.find((t) => t.id === ui.selectedId) || null;
  renderDetail(els.detail, selected, ctx());
  for (const tab of els.tabs.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === ui.view);
  }
  els.spoiler.checked = tracker.isSpoilerSafe();
}

function select(id) {
  ui.selectedId = id;
  render();
}

function onEarnToggle(id) {
  tracker.toggle(id);
  render();
}

// Row clicks select a trophy; checkbox clicks toggle earned. Both panes use
// the same delegation so roadmap and missables rows behave like tracker rows.
function wirePane(pane) {
  pane.addEventListener('click', (event) => {
    const row = event.target.closest('[data-row]');
    if (row) select(Number(row.dataset.row));
  });
  pane.addEventListener('change', (event) => {
    const box = event.target.closest('[data-earn]');
    if (box) onEarnToggle(Number(box.dataset.earn));
  });
}
wirePane(els.list);
wirePane(els.detail);

els.tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-view]');
  if (!tab) return;
  ui.view = tab.dataset.view;
  if (ui.view === 'missables' && !trophies.some((t) => t.id === ui.selectedId && t.missable)) {
    const first = trophies.find((t) => t.missable);
    if (first) ui.selectedId = first.id;
  }
  render();
});

els.chips.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-kind]');
  if (!chip) return;
  ui.kind = chip.dataset.kind;
  for (const c of els.chips.querySelectorAll('.chip')) c.classList.toggle('active', c === chip);
  if (ui.view !== 'tracker') ui.view = 'tracker';
  render();
});

els.grade.addEventListener('change', () => {
  ui.grade = els.grade.value;
  if (ui.view !== 'tracker') ui.view = 'tracker';
  render();
});

els.search.addEventListener('input', () => {
  ui.query = els.search.value;
  if (ui.view !== 'tracker') ui.view = 'tracker';
  render();
});

els.spoiler.addEventListener('change', () => {
  tracker.setSpoilerSafe(els.spoiler.checked);
  render();
});

els.exportBtn.addEventListener('click', () => {
  const blob = new Blob([tracker.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(url);
});

els.importFile.addEventListener('change', async () => {
  const file = els.importFile.files[0];
  if (!file) return;
  try {
    tracker.importJSON(await file.text());
    render();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  els.importFile.value = '';
});

async function init() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  els.search.value = ui.query;
  if (ui.view === 'missables' && !trophies.some((t) => t.id === ui.selectedId)) {
    const first = trophies.find((t) => t.missable);
    if (first) ui.selectedId = first.id;
  }
  if (!trophies.some((t) => t.id === ui.selectedId)) {
    ui.selectedId = trophies[0] ? trophies[0].id : null;
  }
  render();
}

init();
