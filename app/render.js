// render.js — every view of the guide, built from the trophy data and the
// tracker state: the tracker list, the detail panel, the roadmap view and
// the missables view. Spoiler-safe masking lives here so no view can leak a
// story trophy's name or description before it is earned.

import { STAGES, trophiesInStage, stageProgress } from './roadmap.js';
import { isEarned, progressOf } from './tracker.js';

export const GRADE_LABEL = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KIND_LABEL = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function isMasked(trophy, state) {
  return state.spoilerSafe && trophy.kind === 'story' && !isEarned(state, trophy.id);
}

function shownName(trophy, state) {
  return isMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

function shownDesc(trophy, state) {
  return isMasked(trophy, state)
    ? 'Hidden by Spoiler-safe until this trophy is earned.'
    : trophy.description;
}

export function gradeBadge(grade) {
  return `<span class="grade grade-${grade}">${GRADE_LABEL[grade]}</span>`;
}

function tagsHtml(trophy) {
  const missable = trophy.missable ? '<span class="tag missable">MISSABLE</span>' : '';
  return `<span class="tag">${KIND_LABEL[trophy.kind]}</span>` +
    `<span class="tag stage">Roadmap stage ${trophy.stage}</span>${missable}`;
}

/* ---------------- progress header ---------------- */

export function renderProgress(state, trophies) {
  const p = progressOf(state, trophies);
  document.getElementById('progress-count').textContent = `${p.earnedCount} of ${p.total} earned`;
  document.getElementById('progress-pct').textContent = `${p.pct}%`;
  document.getElementById('progress-fill').style.width = `${p.pct}%`;
  const order = ['platinum', 'gold', 'silver', 'bronze'];
  document.getElementById('progress-grades').textContent = order
    .map((g) => `${GRADE_LABEL[g]} ${p.byGrade[g].earned}/${p.byGrade[g].total}`)
    .join(' · ');
}

/* ---------------- tracker list ---------------- */

export function filterTrophies(trophies, filters) {
  const q = filters.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind === 'missable' && !t.missable) return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function trophyRowHtml(trophy, state, selectedId) {
  const earned = isEarned(state, trophy.id);
  const classes = ['trophy-row', earned ? 'earned' : '', trophy.id === selectedId ? 'selected' : '']
    .filter(Boolean)
    .join(' ');
  return `<article class="${classes}" data-open="${trophy.id}">
    <input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(shownName(trophy, state))} as earned">
    <div class="trophy-main">
      <div class="trophy-name">${gradeBadge(trophy.grade)}${esc(shownName(trophy, state))}</div>
      <div class="trophy-desc">${esc(shownDesc(trophy, state))}</div>
      <div class="trophy-tags">${tagsHtml(trophy)}</div>
    </div>
  </article>`;
}

export function renderList(container, trophies, state, selectedId) {
  if (!trophies.length) {
    container.innerHTML = '<p class="note-box">No trophies match these filters. The official list has no online trophies, so the Online filter is empty by design.</p>';
    return;
  }
  container.innerHTML = trophies.map((t) => trophyRowHtml(t, state, selectedId)).join('');
}

/* ---------------- detail panel ---------------- */

export function renderDetail(el, trophy, state) {
  if (!trophy) {
    el.innerHTML = '<p class="detail-empty">Select a trophy on the left to read its guide — what to do, where it fits on the roadmap, and the sources the guide is built from.</p>';
    return;
  }
  const earned = isEarned(state, trophy.id);
  const masked = isMasked(trophy, state);
  const warn = trophy.missable
    ? '<div class="warn"><strong>Missable:</strong> this trophy has a point of no return. Read the guide before you play past it — there is no mission replay.</div>'
    : '';
  const guide = masked
    ? '<p class="masked">Guide hidden by Spoiler-safe until this trophy is earned.</p>'
    : `<p>${esc(trophy.guide)}</p>`;
  const sources = masked
    ? ''
    : `<h3>SOURCES</h3><ul>${trophy.sources
        .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`)
        .join('')}</ul>`;
  el.innerHTML = `
    <div>${gradeBadge(trophy.grade)}<span class="tag">${KIND_LABEL[trophy.kind]}</span></div>
    <h2>${esc(shownName(trophy, state))}</h2>
    <p class="official">${esc(shownDesc(trophy, state))}</p>
    <div class="trophy-tags">${tagsHtml(trophy)}</div>
    <label class="earn-line"><input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''}> Earned</label>
    ${warn}
    <h3>GUIDE</h3>
    ${guide}
    ${sources}`;
}

/* ---------------- roadmap view ---------------- */

function miniRowHtml(trophy, state) {
  const earned = isEarned(state, trophy.id);
  const flag = trophy.missable ? '<span class="tag missable">MISSABLE</span>' : '';
  const warn = trophy.missable
    ? '<span class="masked"> — do the Chapter 1 meditation when it is offered; it cannot be recovered later.</span>'
    : '';
  return `<div class="mini-row" data-open="${trophy.id}">
    <span class="dot" style="background: var(--${trophy.grade})"></span>
    <span class="mini-name">${esc(shownName(trophy, state))}</span>
    ${flag}
    <span class="mini-state">${earned ? 'Earned' : KIND_LABEL[trophy.kind]}</span>
  </div>${warn ? `<div class="mini-row">${warn}</div>` : ''}`;
}

export function renderRoadmap(el, trophies, state) {
  const blocks = STAGES.map((s) => {
    const list = trophiesInStage(trophies, s.stage);
    const sp = stageProgress(trophies, s.stage, (id) => isEarned(state, id));
    const rows = list.map((t) => miniRowHtml(t, state)).join('');
    return `<section class="stage-block">
      <h2>${esc(s.title)}</h2>
      <div class="stage-count">${sp.earned} of ${sp.total} earned in this stage</div>
      <p class="blurb">${esc(s.blurb)}</p>
      ${rows}
    </section>`;
  }).join('');
  el.innerHTML = '<p class="note-box">The roadmap is built from the official trophy descriptions: story first (with the one missable step flagged where it happens), then the collectible sweep, then the repeatable activities, and the 100% checklist last.</p>' + blocks;
}

/* ---------------- missables view ---------------- */

export function renderMissables(el, trophies, state) {
  const missables = trophies.filter((t) => t.missable);
  const cards = missables
    .map((t) => {
      const earned = isEarned(state, t.id);
      const sources = t.sources
        .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`)
        .join('');
      return `<section class="stage-block">
        <div>${gradeBadge(t.grade)}<span class="tag missable">MISSABLE</span></div>
        <h2>${esc(t.name)}</h2>
        <p class="official">${esc(t.description)}</p>
        <label class="earn-line"><input type="checkbox" data-earn="${t.id}" ${earned ? 'checked' : ''}> Earned</label>
        <div class="warn"><strong>Point of no return:</strong> the Chapter 1 meditation at Jason\u2019s house can be skipped, and there is no mission replay. Do it the moment it is offered and keep a manual save at the chapter break.</div>
        <h3>GUIDE</h3><p>${esc(t.guide)}</p>
        <h3>SOURCES</h3><ul>${sources}</ul>
      </section>`;
    })
    .join('');
  const story = trophies.filter((t) => t.kind === 'story');
  const storyRows = story.map((t) => miniRowHtml(t, state)).join('');
  el.innerHTML = `
    <p class="note-box">This list has exactly <strong>one</strong> missable trophy. Everything else can be earned in free-roam after the story, so nothing else needs a warning — but this one does:</p>
    ${cards}
    <section class="stage-block">
      <h2>Story trophies &amp; Spoiler-safe</h2>
      <p class="blurb">With Spoiler-safe on, unearned story trophies are masked below (and everywhere else in the guide) until they are earned. Earned ones show in full.</p>
      ${storyRows}
    </section>`;
}
