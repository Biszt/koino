// meres/terepElemzes.js

// Felelősség: ⭐⭐ D130 (⑤c — `docs/koinon_atvizsgalas.md` 14.): A TEREP ELEMZÉSE — a terep készülékeinek kivitt naplóiból (`node
// koino.js terep kivisz <fájl>` minden készüléken) egy összegzés: készülékenként a valódi elérhetőség (az arány és a napszakos profil —
// a 96.–99. mérés mintáihoz mérve), a DHT KÉSÉSE (a terep-készülékek látott címei közül hány volt valóban fent, és aki nem, mióta nem —
// a KO17 ráhagyásához), a pótlások (indult, a párján jelentkezés, a közvetlen válaszok aránya, a döntések, a felkérések) és a kosarak
// látott száma. A számítás a `js/csere/terepNaplo.js` `terepElemzese`-je (tiszta, próbázott); ez csak beolvas és kiír.
//
// Futtatás: `node meres/terepElemzes.js <fájl1> <fájl2> …` (nem próba: számokat ír ki — egy új mérés a `meres/eredmenyek.md`-be).

import { readFile } from 'node:fs/promises';
import { terepElemzese, kivitelAlakja } from '../js/csere/terepNaplo.js';

const fajlok = process.argv.slice(2);
if (!fajlok.length) {
  console.log('Használat: node meres/terepElemzes.js <a készülékek kivitt fájljai> (node koino.js terep kivisz <fájl> minden készüléken)');
  process.exit(2);
}
const kivitelek = [];
for (const f of fajlok) {
  try {
    const x = JSON.parse(await readFile(f, 'utf8'));
    if (!kivitelAlakja(x)) { console.log('⚠ nem terep-napló (kihagyva): ' + f); continue; }
    kivitelek.push(x);
  } catch (hiba) {
    console.log('⚠ nem olvasható (kihagyva): ' + f + ' — ' + hiba.message);
  }
}
const e = terepElemzese(kivitelek);
const sz = (x, j = 0) => (Number.isFinite(x) ? x.toFixed(j).replace('.', ',') : '–');
const ido = (t) => (Number.isFinite(t) ? new Date(t).toLocaleString('hu-HU') : '–');

console.log('A TEREP ELEMZÉSE — ' + kivitelek.length + ' készülék' + (e.koinok.length > 1 ? ' ⚠ több koinoból: ' + e.koinok.join(', ') : ''));
console.log();
console.log('1. AZ ELÉRHETŐSÉG (a fent-szakaszokból, percre pontosan)');
for (const d of e.keszulekek) {
  console.log('  ' + d.keszulek + ': ' + sz((d.arany ?? NaN) * 100) + '% fent (' + ido(d.kezdet) + ' – ' + ido(d.veg) + ', ' + d.szakaszok
    + ' szakasz, ' + d.cimek + ' külső cím)');
  console.log('    napszak (0–23 óra, a fent töltött idő %-a): ' + d.profil.map((p) => (p === null ? '·' : sz(p * 100))).join(' '));
}
console.log();
console.log('2. A DHT KÉSÉSE (a terep-készülékek látott címei a számlálásokban)');
const k = e.keses;
const terepDb = k.fent + k.nemFent + k.sosem;
console.log('  ' + terepDb + ' látás egy másik terep-készülékről: ' + k.fent + ' alkalommal valóban fent volt (' + sz(terepDb ? k.fent / terepDb * 100 : NaN)
  + '%), ' + k.nemFent + ' alkalommal már nem (' + sz(terepDb ? k.nemFent / terepDb * 100 : NaN) + '%)' + (k.sosem ? ', ' + k.sosem
  + ' alkalommal előtte sem volt fent' : ''));
if (k.nemFent) console.log('  a nem fent lévők késése: medián ' + sz(k.median) + ' perc, legfeljebb ' + sz(k.legnagyobb) + ' perc');
console.log('  idegen (nem terep-készülék) cím: ' + k.idegen);
console.log('  ⭐ a látott szám ennyiszerese a valódinak a terep-készülékeknél: ' + sz(k.fent ? terepDb / k.fent : NaN, 2)
  + ' (a KO17 ráhagyása 1,25)');
console.log();
console.log('3. A PÓTLÁSOK');
const p = e.potlas;
console.log('  indult ' + p.indult + ', nem indult (nincs jelölt / a DHT nem felelt) ' + p.nincs + ', a minta párján is jelentkezett ' + p.parjan
  + ', döntés ' + p.dontes + ' (ebből választott ' + p.valasztott + '), a felkérés válasza ' + p.felkeres);
if (p.kozvetlenKerdezett) {
  console.log('  a párján jelentkezés előtt a közvetlen kopogásra ' + p.kozvetlenFelelt + ' jelölt felelt a ' + p.kozvetlenKerdezett + '-ből ('
    + sz(p.kozvetlenFelelt / p.kozvetlenKerdezett * 100) + '%)');
}
console.log();
console.log('4. A KOSARAK (a látott szám a számlálásokban)');
for (const y of e.kosarak) {
  console.log('  ' + y.jel + ': ' + y.db + ' számlálás, a látott szám mediánja ' + sz(y.median) + ', a cél alatt ' + y.kevesDb
    + ' alkalommal (' + sz(y.db ? y.kevesDb / y.db * 100 : NaN) + '%)');
}
