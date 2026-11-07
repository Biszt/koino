// meres/kartyaTelepitesMeres.js — ⭐ A KÁRTYÁBÓL ÖSSZERAKOTT PROGRAM (91. mérés, D123 ④ — PR5, telepítés a kártyáról)
//
// Felelősség: megméri, mi történik, ha a koino-verzió kártya KÓD-CSOMAGJÁBÓL (a jegyzék és a fájlok — D119) egy programmappát
// rakunk össze a készüléken — vagyis amit a PR5 (B) „telepítés a kártyáról” tenne, még a lap és a csere nélkül:
//   (a) a kód-csomag ennek a programnak a mappájából (a git-munkakönyvtárból — ahogy a kártya ma készül);
//   (b) egy üres mappába kiírva, fájlonként a lenyomata szerint ellenőrizve (az idő és a méret);
//   (c) a kiírt mappa kód-csomagja — ⭐ UGYANAZ-e a neve (a git nélküli mappát a program bejárja, nem a git kérdezi), és a magja;
//   (d) elindul-e a kiírt program (egy parancs egy üres adat-mappával), és ugyanazt a magot és programot nevezi-e meg;
//   (e) ugyanez egy git nélküli másolattal, ahogy a Windowsos telepítő a GitHub zip-jéből teszi (a követett fájlok, `.git` nélkül).
//
// Nem önpróba: számokat ad. Futtatás (a tár gyökeréből): node meres/kartyaTelepitesMeres.js
// Használja: a 91. mérés (eredmenyek.md), docs/kartya_telepites_atvizsgalas.md.

import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { kodCsomagKeszitese, magJegyzeke } from '../js/tar/kodCsomag.js';
import { bajtLenyomat } from '../js/esemeny/kanonikusAlak.js';

const futtat = promisify(execFile);
const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const mappak = [];
const KB = (b) => (b / 1024).toFixed(1) + ' KB';

async function ujMappa(elotag) {
  const m = await mkdtemp(join(tmpdir(), elotag));
  mappak.push(m);
  return m;
}

/** A mag neve egy mappából (a kód-csomag függvényével — ahogy a futó program is számolja). */
async function magNeve(gyoker) {
  const m = await magJegyzeke((ut) => readFile(join(gyoker, ut)).catch(() => null));
  return { lenyomat: m.hivatkozas.lenyomat, fajlok: m.jegyzek.fajlok.length };
}

/** A kiírás: a jegyzék minden fájlja a tartalmából, a lenyomata szerint ellenőrizve. */
async function kiiras(csomag, hova) {
  const kezdet = performance.now();
  let bajt = 0, rossz = 0;
  for (const [ut, lenyomat, meret] of csomag.jegyzek.fajlok) {
    const t = csomag.tartalmak.get(lenyomat);
    if (!t || t.length !== meret || (await bajtLenyomat(t)) !== lenyomat) { rossz++; continue; }
    const cel = join(hova, ...ut.split('/'));
    await mkdir(dirname(cel), { recursive: true });
    await writeFile(cel, t);
    bajt += t.length;
  }
  return { fajl: csomag.jegyzek.fajlok.length, bajt, rossz, ms: Math.round(performance.now() - kezdet) };
}

/** A kiírt program egy parancsa egy üres adat-mappával: kilépési kód és a kimenet eleje. */
async function parancs(gyoker, adat, ...ervek) {
  try {
    const { stdout } = await futtat(process.execPath, [join(gyoker, 'koino.js'), ...ervek], {
      env: { ...process.env, KOINO_ADAT: adat, KOINO_NAPLO: '', KOINO_DHT_BELEPOK: 'nincs', KOINO_TUKOR: '127.0.0.1:9' },
      timeout: 60000, maxBuffer: 16 * 1024 * 1024, windowsHide: true
    });
    return { kod: 0, ki: stdout.replace(/\x1b\[[0-9;]*m/g, '') };
  } catch (h) {
    return { kod: h.code ?? 1, ki: String(h.stdout ?? '').replace(/\x1b\[[0-9;]*m/g, '') + String(h.stderr ?? '').slice(0, 400) };
  }
}

async function meres() {
  console.log('91. mérés — a kártyából összerakott program\n');
  // (a)
  const t0 = performance.now();
  const eredeti = await kodCsomagKeszitese(GYOKER);
  const eredetiMag = await magNeve(GYOKER);
  console.log('(a) a kód-csomag a git-munkakönyvtárból: ' + eredeti.jegyzek.fajlok.length + ' fájl, ' + KB(eredeti.hivatkozas.torzs)
    + ' (a jegyzék ' + KB(eredeti.hivatkozas.bajt) + '), ' + Math.round(performance.now() - t0) + ' ms — a név: '
    + eredeti.hivatkozas.lenyomat.slice(0, 12) + '…, a mag: ' + eredetiMag.lenyomat.slice(0, 12) + '… (' + eredetiMag.fajlok + ' fájl)');

  // (b)
  const hely = await ujMappa('koino-kartyabol-');
  const k = await kiiras(eredeti, hely);
  console.log('(b) a kiírás egy üres mappába: ' + k.fajl + ' fájl, ' + KB(k.bajt) + ', ' + k.ms + ' ms, a lenyomat szerint rossz: ' + k.rossz);

  // (c)
  const ujra = await kodCsomagKeszitese(hely);
  const ujraMag = await magNeve(hely);
  const hianyzik = eredeti.jegyzek.fajlok.map((f) => f[0]).filter((u) => !ujra.jegyzek.fajlok.some((g) => g[0] === u));
  const tobblet = ujra.jegyzek.fajlok.map((f) => f[0]).filter((u) => !eredeti.jegyzek.fajlok.some((g) => g[0] === u));
  console.log('(c) a kiírt mappa kód-csomagja (git nélkül, bejárva): ' + ujra.jegyzek.fajlok.length + ' fájl — a név '
    + (ujra.hivatkozas.lenyomat === eredeti.hivatkozas.lenyomat ? 'UGYANAZ' : '⛔ MÁS (' + ujra.hivatkozas.lenyomat.slice(0, 12) + '…)')
    + '; a mag ' + (ujraMag.lenyomat === eredetiMag.lenyomat ? 'ugyanaz' : '⛔ más'));
  if (hianyzik.length) console.log('    a bejárásból kimarad (' + hianyzik.length + '): ' + hianyzik.join(', '));
  if (tobblet.length) console.log('    a bejárásban többlet (' + tobblet.length + '): ' + tobblet.join(', '));

  // (d)
  const adat = await ujMappa('koino-kartyabol-adat-');
  const t1 = performance.now();
  const sz = await parancs(hely, adat, 'koino', 'Kártya-próba');
  const ko = await parancs(hely, adat, 'koino');
  const magSor = (ko.ki.match(/A születése nem nevez meg magot[^\n]*|A számítás magja: [^\n]*/) ?? [''])[0];
  console.log('(d) a kiírt program fut: a születés kilépési kódja ' + sz.kod + ', a `koino` parancsé ' + ko.kod + ' ('
    + Math.round(performance.now() - t1) + ' ms) — ' + (magSor ? '„' + magSor.slice(0, 110) + '”' : '⛔ nincs mag-sor: ' + ko.ki.slice(0, 200)));
  const programSor = (ko.ki.match(/A programja: [^\n]*|A születése nem nevez meg teljes programot[^\n]*/) ?? [''])[0];
  if (programSor) console.log('    „' + programSor.slice(0, 140) + '”');

  // (e) a git nélküli másolat (mint a GitHub zip-je: a követett fájlok)
  const zip = await ujMappa('koino-zipbol-');
  const { stdout } = await futtat('git', ['ls-files', '-z'], { cwd: GYOKER, maxBuffer: 16 * 1024 * 1024 });
  let masolt = 0;
  for (const ut of stdout.split('\0').filter(Boolean)) {
    const cel = join(zip, ...ut.split('/'));
    await mkdir(dirname(cel), { recursive: true });
    try { await writeFile(cel, await readFile(join(GYOKER, ut))); masolt++; } catch { /* a lemezről hiányzik */ }
  }
  const zipCsomag = await kodCsomagKeszitese(zip);
  const zipHiany = eredeti.jegyzek.fajlok.map((f) => f[0]).filter((u) => !zipCsomag.jegyzek.fajlok.some((g) => g[0] === u));
  console.log('(e) a git nélküli másolat (mint a zip-ből — ' + masolt + ' követett fájl, a dokumentációval): ' + zipCsomag.jegyzek.fajlok.length
    + ' fájl a csomagban — a név ' + (zipCsomag.hivatkozas.lenyomat === eredeti.hivatkozas.lenyomat ? 'UGYANAZ' : '⛔ MÁS')
    + (zipHiany.length ? '; kimarad: ' + zipHiany.join(', ') : ''));
}

try {
  await meres();
} finally {
  for (const m of mappak) await rm(m, { recursive: true, force: true });
}
