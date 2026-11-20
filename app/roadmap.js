// The platinum roadmap: four stages built from the official trophy descriptions.
// Stage text is this guide's own; the trophies in each stage come from their "stage" field
// in data/trophies.json, and missable warnings are rendered inline from their "missable" flag.

export const STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Story playthrough',
    blurb:
      'Play the campaign in chapter order: the opening mission, Chapters 1 to 4, the named story missions and the finale. ' +
      'Story trophies pop as chapters and missions complete. Pause for the one flagged missable that lives in this stage: ' +
      'the Chapter 1 meditation behind Positive Mental Attitude. There is no mission replay, so keep a manual save at ' +
      'every chapter break, and start the habits that pay off later — scan vehicles, tag WAiNK spots, sample each activity once.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Collectibles & exploration',
    blurb:
      'Sweep Leonida for the collection trophies: complete card sets, WAiNK locations, vehicle discoveries and Scooter Bros ' +
      'registrations, plus all 52 areas for The Goodtime State. The meditation spots left over from Stage 1 are finished ' +
      'here too. Work region by region and let the map fill in as you go.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Activities & side content',
    blurb:
      'Everything the open world offers: shooting-range golds, drone races and 20 race wins, 250 stunts, 50 challenges, ' +
      'the stranger and character strands (Andy, Kenton, Billy, Randy, Tyrone, Bret), the robbery ladder from shops to ' +
      'bank vaults, and every one-off feat. Free-roam continues after the credits, so nothing here can be locked away.',
  },
  {
    stage: 4,
    title: 'Stage 4 — 100% and the platinum',
    blurb:
      'This list has no online trophies — all 55 are offline, so there is no multiplayer stage to plan. Close out the ' +
      '100% Completion checklist (A Long Road), the longest single requirement, and the moment the other 54 trophies ' +
      'are all earned, the platinum — Vice Got a Price! — is awarded automatically.',
  },
];

export function trophiesInStage(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

export function missablesInStage(trophies, stage) {
  return trophies.filter((t) => t.stage === stage && t.missable);
}
