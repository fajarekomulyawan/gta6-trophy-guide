// main.ts — Leonida Legend hand-in.
// Copies the static app (app/) and the screenshots (screenshots/) into the
// output directory, then writes dossier.json there with buildDossier from
// the vendored make.fun frontend module. The dossier is a pure function of
// the copied files, so two runs over the same entry produce identical bytes.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const GUIDE_TITLE = 'Leonida Legend — GTA VI Trophy Guide & Tracker';

const entryDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(entryDir, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(entryDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 2 * 1024 * 1024,
  screenshots: { max: 8, max_bytes: 4 * 1024 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const data = JSON.parse(readFileSync(join(entryDir, 'app', 'data', 'trophies.json'), 'utf8'));
console.log(
  `${GUIDE_TITLE}: handed in with ${data.trophies.length} trophies; dossier.json is ${dossier.byteLength} bytes.`,
);
