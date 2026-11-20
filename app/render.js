// render.js — Leonida Legend
// Turns trophy data + tracker state into the three views (tracker, roadmap,
// missables) and the guide detail panel. Spoiler-safe masking lives here so
// every view hides unearned story trophies the same way.

import { STAGES, orderForStage } from './roadmap.js';

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_LABELS = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

export function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function isMasked(trophy, tracker) {
  return tracker.isSpoilerSafe() && trophy.kind === 'story' && !tracker.isEarned(trophy.id);
}

export function displayName(trophy, tracker) {
  return isMasked(trophy, tracker) ? 'Hidden story trophy' : trophy.name;
}

export function displayDesc(trophy, tracker) {
  return isMasked(trophy, tracker)
    ? 'Hidden by spoiler-safe mode until this trophy is earned.'
    : trophy.description;
}

function tagsHTML(trophy) {
  const parts = [
    `<span class="tag kind">${esc(KIND_LABELS[trophy.kind] || trophy.kind)}</span>`,
    `<span class="tag">Roadmap stage ${trophy.stage}</span>`,
  ];
  if (trophy.missable) parts.push('<span class="tag missable">MISSABLE</span>');
  return parts.join('');
}

export function rowHTML(trophy, ctx) {
  const earned = ctx.tracker.isEarned(trophy.id);
  const classes = ['trophy-row', earned ? 'earned' : '', ctx.selectedId === trophy.id ? 'selected' : '']
    .filter(Boolean)
    .join(' ');
  return `
  <article class="${classes}" data-row="${trophy.id}">
    <input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Mark earned">
    <div class="row-main">
      <div class="row-top">
        <span class="badge ${trophy.grade}">${esc(trophy.grade)}</span>
        <span class="row-name">${esc(displayName(trophy, ctx.tracker))}</span>
      </div>
      <div class="row-desc">${esc(displayDesc(trophy, ctx.tracker))}</div>
      <div class="row-tags">${tagsHTML(trophy)}</div>
    </div>
  </article>`;
}

export function matchesFilters(trophy, ctx) {
  if (ctx.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (ctx.kind !== 'all' && trophy.kind !== ctx.kind) {
    return false;
  }
  if (ctx.grade !== 'all' && trophy.grade !== ctx.grade) return false;
  const q = ctx.query.trim().toLowerCase();
  if (q && !`${trophy.name} ${trophy.description}`.toLowerCase().includes(q)) return false;
  return true;
}

export function renderProgress(els, trophies, tracker) {
  const total = trophies.length;
  const earned = tracker.earnedCount();
  els.count.textContent = `${earned} of ${total} earned`;
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  els.pct.textContent = `${pct}%`;
  els.fill.style.width = `${pct}%`;
  els.grades.innerHTML = GRADES.map((g) => {
    const inGrade = trophies.filter((t) => t.grade === g);
    const got = inGrade.filter((t) => tracker.isEarned(t.id)).length;
    const label = g[0].toUpperCase() + g.slice(1);
    return `<span>${label} <b>${got}/${inGrade.length}</b></span>`;
  }).join('');
}

export function renderTrackerView(pane, trophies, ctx) {
  const shown = trophies.filter((t) => matchesFilters(t, ctx));
  let note;
  if (ctx.kind === 'online') {
    note = 'This trophy list has no online trophies — every trophy can be earned solo, offline.';
  } else if (shown.length === 0) {
    note = 'No trophies match the current filters.';
  } else {
    note = `Showing ${shown.length} of ${trophies.length} trophies — select one to read its guide.`;
  }
  pane.innerHTML = `<p class="list-note">${esc(note)}</p>` + shown.map((t) => rowHTML(t, ctx)).join('');
}

export function renderRoadmapView(pane, trophies, ctx) {
  pane.innerHTML = STAGES.map((stage) => {
    const rows = orderForStage(trophies, stage.n);
    const got = rows.filter((t) => ctx.tracker.isEarned(t.id)).length;
    return `
    <section class="stage-block">
      <h2>${esc(stage.title)}</h2>
      <div class="stage-meta">${got} of ${rows.length} earned</div>
      <p class="stage-blurb">${esc(stage.blurb)}</p>
      ${rows.map((t) => rowHTML(t, ctx)).join('')}
    </section>`;
  }).join('');
}

export function renderMissablesView(pane, trophies, ctx) {
  const missables = trophies.filter((t) => t.missable);
  let html = `
    <div class="missable-banner"><strong>One missable trophy on this list.</strong>
    Positive Mental Attitude has a single point of no return: the Chapter 1 meditation at Jason's house
    can be skipped, and with no mission replay there is no way back for it in that playthrough.
    Everything else can be cleaned up in free-roam after the credits.</div>`;
  html += missables.map((t) => rowHTML(t, ctx)).join('');
  if (ctx.tracker.isSpoilerSafe()) {
    const hidden = trophies.filter((t) => isMasked(t, ctx.tracker));
    if (hidden.length > 0) {
      html += `<h2 style="color:var(--amber);font-size:1.05rem;margin:18px 0 8px;">Hidden by spoiler-safe mode</h2>`;
      html += `<p class="list-note">${hidden.length} unearned story trophies are masked right now. Earn one — or turn spoiler-safe off — to reveal it.</p>`;
      html += hidden.map((t) => rowHTML(t, ctx)).join('');
    }
  }
  pane.innerHTML = html;
}

export function renderDetail(pane, trophy, ctx) {
  if (!trophy) {
    pane.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, sources and roadmap stage.</p>';
    return;
  }
  const masked = isMasked(trophy, ctx.tracker);
  const earned = ctx.tracker.isEarned(trophy.id);
  const guide = masked
    ? '<p class="masked">Guide hidden by spoiler-safe mode until this trophy is earned.</p>'
    : `<p>${esc(trophy.guide)}</p>`;
  const warning = trophy.missable
    ? '<div class="missable-warning"><strong>Missable:</strong> this trophy has a point of no return. Read the guide before you play past it — there is no mission replay.</div>'
    : '';
  const sources = trophy.sources
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`)
    .join('');
  pane.innerHTML = `
    <div class="detail-meta">
      <span class="badge ${trophy.grade}">${esc(trophy.grade)}</span>
      ${tagsHTML(trophy)}
    </div>
    <h2>${esc(displayName(trophy, ctx.tracker))}</h2>
    <p class="official">${esc(displayDesc(trophy, ctx.tracker))}</p>
    <label class="detail-earned"><input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''}> Earned</label>
    ${warning}
    <h3>Guide</h3>
    ${guide}
    <h3>Sources</h3>
    <ul class="sources">${sources}</ul>`;
}
