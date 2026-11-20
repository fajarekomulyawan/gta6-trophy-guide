// roadmap.js — the platinum roadmap: four stages, in the order a player
// should work them, with the reasoning for each stage. Which trophies sit in
// which stage is each trophy's own "stage" field in data/trophies.json,
// assigned from the official descriptions.

export const STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — The Story, With One Warning',
    blurb:
      'Play the campaign in chapter order and take every story trophy as it comes. ' +
      'One moment in Chapter 1 is the whole list\u2019s only point of no return: the meditation at Jason\u2019s house ' +
      '(Positive Mental Attitude) can be skipped, and with no mission replay there is no going back for it — do it when it is offered, ' +
      'and keep a manual save at every chapter break. Start the cheap habits here too: scan new vehicles and tag WAiNK spots as you pass them.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Collectibles & The Big Sweep',
    blurb:
      'With the map open, sweep Leonida region by region: finish the meditation spots, complete three Collectible Card sets, ' +
      'WAiNK at 100 locations, discover 100 vehicles, register 10 of them with Scooter Bros, and set foot in all 52 areas. ' +
      'These overlap heavily — one thorough pass per region moves all of them at once.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Activities, Strands & Feats',
    blurb:
      'Everything repeatable lives here: gold medals in all 42 Shooting Range challenges, 250 stunts, the drone races and 20 race wins, ' +
      'the five character strands plus Strangers & Freaks, the robbery feats, 50 challenges and the one-off set pieces like the VCIA departure. ' +
      'None of it can be missed, so work it at your own pace and tick off whatever your Stage 2 sweep left behind.',
  },
  {
    stage: 4,
    title: 'Stage 4 — 100% Completion & The Platinum',
    blurb:
      'The long pole: the 100% Completion checklist (A Long Road), which asks for roughly 60% of everything in the game and only becomes ' +
      'viewable after the story. When the last of the other 54 trophies lands, the platinum (Vice Got a Price!) follows automatically. ' +
      'Note: this trophy list contains no online trophies, so no stage of the roadmap needs an online session.',
  },
];

export function trophiesInStage(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

export function stageProgress(trophies, stage, isEarnedFn) {
  const list = trophiesInStage(trophies, stage);
  const earned = list.filter((t) => isEarnedFn(t.id)).length;
  return { earned, total: list.length };
}
