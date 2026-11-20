// Leonida Legend — hand-in program for the gta6-trophy-guide-01 entry
// (Node 22, standard library only). The guide itself is the static app in
// app/ beside this file; this program hands it in: it copies app/ and
// screenshots/ to the output directory and writes dossier.json there, built
// with the kit's vendored library, exactly as the scorer builds it.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const GUIDE_TITLE = 'Leonida Legend — GTA VI Trophy Guide & Tracker';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the bounty's own (RULES.txt, The gate): only text_max_bytes
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse — 993 app entries, 48 MiB of app, at most 4 screenshots of at most
// 256 KiB each.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);

const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = Array.isArray(data) ? data : data.trophies;
console.log(
  `${GUIDE_TITLE}: handed in with ${trophies.length} trophies, dossier ${dossier.byteLength} bytes.`,
);
