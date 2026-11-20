// roadmap.js — Leonida Legend
// The four-stage route to the platinum. Stage membership comes from each
// trophy's "stage" field in data/trophies.json; this module adds the stage
// titles, the reasoning behind each stage, and the play order inside Stage 1
// (story beats in chapter order, with the missable step placed where it
// actually happens — during Chapter 1).

export const STAGES = [
  {
    n: 1,
    title: 'Stage 1 — Story playthrough',
    blurb:
      'Play the campaign from Gone Fishing to the final mission. The story trophies below are listed in chapter order and cannot be missed — except one collectible step that lives inside this stage: the Chapter 1 meditation at Jason\u2019s house (Positive Mental Attitude). Take it the moment it is offered, keep a manual save at each chapter break, and never use cheats, which disable trophy earning.',
  },
  {
    n: 2,
    title: 'Stage 2 — Collectibles & exploration',
    blurb:
      'Sweep Leonida region by region: meditation spots, collectible card sets, WAiNK locations, vehicle discoveries and full map exploration. These overlap heavily — one good sweep per region feeds them all — and the habits built here (scanning vehicles, tagging locations) also pay into the 100% checklist.',
  },
  {
    n: 3,
    title: 'Stage 3 — Activities & free-roam feats',
    blurb:
      'Everything the open world offers after the story: stranger strands, shooting-range golds, races, stunts, robberies, challenges and the one-off feats. None of it is missable and free-roam continues after the credits, so work it at your own pace, gang by gang and region by region.',
  },
  {
    n: 4,
    title: 'Stage 4 — 100% and the platinum',
    blurb:
      'The endgame. This list has no online trophies, so nothing here needs another player: finish the 100% Completion checklist (viewable after the story via Touch Pad, then Progress, then Stats) and the platinum, Vice Got a Price!, unlocks on its own the moment the other 54 are earned.',
  },
];

// Stage 1 play order: opening mission, Chapter 1, the missable meditation
// (done during Chapter 1), Chapters 2–4, the named story missions, and the
// final mission last.
const STAGE1_ORDER = [2, 3, 28, 4, 5, 6, 8, 9, 10, 11, 12, 13, 7];

export function orderForStage(trophies, stage) {
  const inStage = trophies.filter((t) => t.stage === stage);
  if (stage !== 1) return inStage;
  const rank = new Map(STAGE1_ORDER.map((id, i) => [id, i]));
  return [...inStage].sort((a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99));
}
