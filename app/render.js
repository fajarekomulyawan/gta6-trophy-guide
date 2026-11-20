// Rendering for Leonida Legend: the tracker list, the roadmap, the missables view and the
// guide detail panel. Pure DOM building from the trophy data plus the tracker state.

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_LABEL = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

// Spoiler-safe hides a story trophy's name and description until it is earned.
export function isMasked(t, state) {
  return state.spoilerSafe && t.kind === 'story' && !state.earned.has(t.id);
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function gradeBadge(grade) {
  return el('span', `badge grade-${grade}`, grade);
}

function kindTag(t) {
  return el('span', 'tag kind-tag', KIND_LABEL[t.kind] ?? t.kind);
}

function missableFlag() {
  return el('span', 'tag missable-tag', 'MISSABLE');
}

// One trophy row: earned checkbox, grade badge, name + official description, tags.
// Clicking the row (not the checkbox) opens the guide in the detail panel.
export function trophyRow(t, state, handlers) {
  const masked = isMasked(t, state);
  const row = el('article', `trophy-row${state.earned.has(t.id) ? ' earned' : ''}${state.selectedId === t.id ? ' selected' : ''}`);
  row.dataset.id = String(t.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${masked ? 'hidden story trophy' : t.name} as earned`);
  box.addEventListener('change', () => handlers.toggle(t.id, box.checked));
  row.append(box);

  const main = el('div', 'row-main');
  const titleLine = el('div', 'row-title');
  titleLine.append(gradeBadge(t.grade));
  titleLine.append(el('strong', 'trophy-name', masked ? 'Hidden story trophy' : t.name));
  if (t.missable) titleLine.append(missableFlag());
  main.append(titleLine);
  main.append(el('p', 'trophy-desc', masked ? 'Name and description hidden by Spoiler-safe until earned.' : t.description));
  const meta = el('div', 'row-meta');
  meta.append(kindTag(t));
  meta.append(el('span', 'tag stage-tag', `Stage ${t.stage}`));
  main.append(meta);
  row.append(main);

  row.addEventListener('click', (e) => {
    if (e.target !== box) handlers.select(t.id);
  });
  return row;
}

// Header progress: overall count and percent, plus earned/total per grade.
export function renderHeader(state) {
  const total = state.trophies.length;
  const done = state.earned.size;
  document.getElementById('progress-count').textContent = `${done} of ${total} earned`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const parts = GRADE_ORDER.map((g) => {
    const all = state.trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => state.earned.has(t.id)).length;
    return `${g[0].toUpperCase()}${g.slice(1)} ${got}/${all.length}`;
  });
  document.getElementById('grade-counts').textContent = parts.join(' · ');
}

function matchesFilters(t, state) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function renderTracker(root, state, handlers) {
  root.replaceChildren();
  const shown = state.trophies.filter((t) => matchesFilters(t, state));
  root.append(el('p', 'results-line', `Showing ${shown.length} of ${state.trophies.length} trophies — select one to read its guide.`));
  if (state.kind === 'online' && shown.length === 0) {
    root.append(el('p', 'empty-note', 'This list has no online trophies: all 55 are offline and single-player, so there is nothing to earn in multiplayer.'));
  }
  if (shown.length === 0 && state.kind !== 'online') {
    root.append(el('p', 'empty-note', 'No trophies match the current filters. Loosen the search or pick another kind or grade.'));
  }
  for (const t of shown) root.append(trophyRow(t, state, handlers));
}

export function renderRoadmap(root, state, handlers, stages, trophiesInStage) {
  root.replaceChildren();
  root.append(el('p', 'results-line', 'The road to Vice Got a Price!: four stages, in order. Missable warnings appear inline where they bite.'));
  for (const s of stages) {
    const section = el('section', 'stage-block');
    section.append(el('h2', 'stage-title', s.title));
    section.append(el('p', 'stage-blurb', s.blurb));
    const list = trophiesInStage(state.trophies, s.stage);
    section.append(el('p', 'stage-count', `${list.length} trophies · ${list.filter((t) => state.earned.has(t.id)).length} earned`));
    for (const t of list) section.append(trophyRow(t, state, handlers));
    root.append(section);
  }
}

export function renderMissables(root, state, handlers) {
  root.replaceChildren();
  const missables = state.trophies.filter((t) => t.missable);
  root.append(el('h2', 'view-title', 'Missable trophies'));
  root.append(el('p', 'results-line',
    'Built from the official descriptions and the published guides: this list has exactly one trophy with a point of no return. ' +
    'Everything else can be finished in free-roam after the story — but there is no mission replay, so keep a manual save at every chapter break.'));
  for (const t of missables) root.append(trophyRow(t, state, handlers));

  const story = state.trophies.filter((t) => t.kind === 'story');
  const section = el('section', 'stage-block');
  section.append(el('h2', 'stage-title', 'Story trophies & Spoiler-safe'));
  if (state.spoilerSafe) {
    section.append(el('p', 'stage-blurb',
      `Spoiler-safe is ON: the ${story.length} story trophies below show as “Hidden story trophy” until you earn them. ` +
      'Their chapters and missions cannot be replayed, so play the story in order and the trophies take care of themselves.'));
    for (const t of story) section.append(trophyRow(t, state, handlers));
  } else {
    section.append(el('p', 'stage-blurb',
      'Spoiler-safe is OFF, so story trophy names and descriptions are visible in the tracker. Turn it on in the controls ' +
      'to hide the 13 story trophies until you earn them.'));
  }
  root.append(section);
}

// The detail panel: a trophy's official description, this guide's own words, its meta and its sources.
export function renderDetail(panel, state, handlers, stages) {
  panel.replaceChildren();
  const t = state.trophies.find((x) => x.id === state.selectedId);
  if (!t) {
    panel.append(el('h2', 'detail-title', 'How this guide works'));
    panel.append(el('p', 'detail-text',
      'Tick trophies off as you earn them — progress is saved in this browser and can be exported to a file and imported back. ' +
      'Select any trophy to read its guide: what to do, where and how, when it unlocks, and the sources it is built from.'));
    panel.append(el('p', 'detail-text',
      'One trophy in this list is missable: Positive Mental Attitude, whose first meditation spot appears in Chapter 1. ' +
      'The Roadmap view lays out the four stages to the platinum; the Missables view collects the warnings.'));
    const list = el('ul', 'detail-stages');
    for (const s of stages) list.append(el('li', '', s.title));
    panel.append(list);
    return;
  }

  const masked = isMasked(t, state);
  const head = el('div', 'detail-head');
  head.append(gradeBadge(t.grade));
  head.append(el('h2', 'detail-title', masked ? 'Hidden story trophy' : t.name));
  panel.append(head);
  panel.append(el('p', 'detail-desc', masked ? 'Name and description hidden by Spoiler-safe until earned.' : t.description));

  const meta = el('div', 'row-meta');
  meta.append(kindTag(t));
  meta.append(el('span', 'tag stage-tag', `Roadmap stage ${t.stage}`));
  if (t.missable) meta.append(missableFlag());
  panel.append(meta);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.addEventListener('change', () => handlers.toggle(t.id, box.checked));
  const label = el('label', 'detail-earned');
  label.append(box, document.createTextNode(' Earned'));
  panel.append(label);

  if (t.missable) {
    panel.append(el('p', 'missable-warning',
      'Missable: this trophy has a point of no return. Read the guide before you play past it — there is no mission replay.'));
  }
  if (masked) {
    panel.append(el('p', 'detail-text', 'Spoiler-safe is on, so this story trophy\u2019s guide stays hidden until you earn it.'));
    return;
  }
  panel.append(el('h3', 'detail-sub', 'Guide'));
  panel.append(el('p', 'detail-text', t.guide));
  panel.append(el('h3', 'detail-sub', 'Sources'));
  const sources = el('ul', 'source-list');
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.label;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a);
    sources.append(li);
  }
  panel.append(sources);
}
