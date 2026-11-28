// meres/terepProba.js

// Felelősség: ⭐⭐ D130 (⑤a — `docs/koinon_atvizsgalas.md` 14.): A TEREP MŰSZEREINEK tiszta próbái (`js/csere/terepNaplo.js`): a cím
// lenyomata (a koino sójával — nyers cím nem kerül a fájlba), a fent-szakaszok (a tűrésen belül egy szakasz, a külső cím váltásakor
// új), a naplók alakja és korlátja, és a TEREP-ELEMZÉS egy kitalált két-készülékes terepen (az elérhetőség a terep egész idején, a DHT
// késése, az idegen cím, a pótlások és a kosarak összegzése). A valódi programban a `parancssorProba.js` ⑤a-próbája méri.
//
// Használják: a `meres/mind.js` (a csere csoport).

import { probaGyujtemeny } from './probaFuttato.js';
import {
  cimLenyomata, keszulekLenyomata, fentFeljegyzes, fentAlakja, naploAlakja, szamlalasBejegyzes, hozzafuz, terepElemzese, kivitelAlakja,
  TEREP_FAJTA, FENT_TURES, FENT_KORLAT, SZAMLALAS_KORLAT, LENYOMAT_KORLAT
} from '../js/csere/terepNaplo.js';

const { proba, futtatas } = probaGyujtemeny('A terep műszerei (D130 ⑤a)');

// A lenyomat: 12 jel, ugyanarra a címre ugyanaz (a normalizálás után is), koinonként más, a cím nem olvasható ki belőle. Rontás: a só
// nélkül (koinonként ugyanaz) → a `koinonkent` bukik; a normalizálás nélkül → az `ipv4` bukik.
proba('⭐⭐ D130 (⑤a): a cím lenyomata — 12 jel, ugyanarra ugyanaz (a ::ffff: alakra is), koinonként más, a cím nincs benne', () => {
  const l = cimLenyomata('K1', '10.0.0.5');
  const ki = {
    alak: typeof l === 'string' && /^[A-Za-z0-9_-]{12}$/.test(l) && !l.includes('10.0.0.5'),
    ugyanaz: cimLenyomata('K1', '10.0.0.5') === l,
    ipv4: cimLenyomata('K1', '::ffff:10.0.0.5') === l,
    koinonkent: cimLenyomata('K2', '10.0.0.5') !== l,
    masCim: cimLenyomata('K1', '10.0.0.6') !== l,
    ures: cimLenyomata('K1', '') === null && cimLenyomata('K1', null) === null,
    keszulek: /^[A-Za-z0-9_-]{12}$/.test(keszulekLenyomata('K1', 'aláíró')) && keszulekLenyomata('K1', 'a') !== keszulekLenyomata('K1', 'b')
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A fent-szakaszok: a tűrésen belül a szakasz nyúlik; nagyobb szünetnél új; a külső cím váltásakor új; a régebbi időpont nem ír át
// semmit; a korlát a legrégebbit veti el. Rontás: a tűrés nélkül (mindig új) → a `nyulik` bukik; a cím nélkül (váltásnál is nyúlik) →
// a `cimValtas` bukik.
proba('⭐⭐ D130 (⑤a): a fent-szakaszok — a tűrésen belül egy szakasz nyúlik, nagyobb szünetnél és a külső cím váltásakor új; korlátos', () => {
  const t0 = 1e12;
  let f = fentFeljegyzes([], { most: t0, k: 'aaaaaaaaaaaa' });
  f = fentFeljegyzes(f, { most: t0 + 60000, k: 'aaaaaaaaaaaa' });
  const nyulik = f.length === 1 && f[0][1] === t0 + 60000;
  f = fentFeljegyzes(f, { most: t0 + 60000 + FENT_TURES + 1, k: 'aaaaaaaaaaaa' });
  const szunet = f.length === 2;
  f = fentFeljegyzes(f, { most: f[1][1] + 60000, k: 'bbbbbbbbbbbb' });
  const cimValtas = f.length === 3 && f[2][2] === 'bbbbbbbbbbbb';
  const regi = fentFeljegyzes(f, { most: t0, k: 'bbbbbbbbbbbb' });
  let sok = [];
  for (let i = 0; i < FENT_KORLAT + 5; i++) sok = fentFeljegyzes(sok, { most: t0 + i * (FENT_TURES + 1000), k: null });
  const ki = {
    nyulik, szunet, cimValtas,
    regi: JSON.stringify(regi) === JSON.stringify(f),
    korlat: sok.length === FENT_KORLAT && sok[0][0] === t0 + 5 * (FENT_TURES + 1000),
    alak: fentAlakja([[1, 2, null], [3, 1, null], ['x', 2, null], [5, 6, 'rossz']]).length === 1
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify({ ki, f }) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A napló alakja és korlátja: a hibás bejegyzés kiesik; a számlálás bejegyzése a címeket lenyomatként viszi (egyszer, legfeljebb 50),
// a szülő / nagyszülő jelével; a korlátos lista a legrégebbit veti el. Rontás: a cím nyersen kerül a bejegyzésbe → a `nyersNincs` bukik.
proba('⭐⭐ D130 (⑤a): a napló — a számlálás a címeket lenyomatként viszi (egyszer, legfeljebb 50), a hibás bejegyzés kiesik, korlátos', () => {
  const b = szamlalasBejegyzes({ most: 5, jel: '2:3', latott: 4, cel: 2, nagyszulovel: true, cimek: ['10.0.0.1', '10.0.0.1', '::ffff:10.0.0.2'], koino: 'K' });
  const sok = szamlalasBejegyzes({ most: 5, jel: '1:0', latott: 1, cel: 2, cimek: Array.from({ length: 80 }, (_, i) => '10.1.0.' + i), koino: 'K' });
  const n = naploAlakja({ szamlalas: [b, { t: 1, k: 'rossz', l: 1, c: 2, a: [] }, { t: 2, k: '1:0', l: 1.5, c: 2, a: [] }],
    potlas: [{ t: 3, e: 'indult', k: '1:0' }, { t: 4, e: 'indult', k: 'x' }] });
  let lista = [];
  for (let i = 0; i < SZAMLALAS_KORLAT + 3; i++) lista = hozzafuz(lista, { i }, SZAMLALAS_KORLAT);
  const ki = {
    bejegyzes: b.t === 5 && b.k === '2:3' && b.l === 4 && b.c === 2 && b.sz === 2 && b.a.length === 2,
    nyersNincs: !JSON.stringify(b).includes('10.0.0'),
    lenyomatKorlat: sok.a.length === LENYOMAT_KORLAT && sok.sz === 0,
    hibasKiesik: n.szamlalas.length === 1 && n.potlas.length === 1,
    korlat: lista.length === SZAMLALAS_KORLAT && lista[0].i === 3
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify({ ki, b }) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A TEREP-ELEMZÉS egy kitalált terepen: két készülék (X 3 órán át fent, D az első órában), X számlálásai — 30 percnél D-t látja (fent
// volt), 90 percnél is (D 60 perce lekapcsolt → 30 perces késés), 100 percnél egy idegen címet; a saját címét nem. Az elérhetőség a terep
// EGÉSZ idején (D: 1/3); a pótlások és a kosarak összegzése. Rontás: az elérhetőség a készülék saját ablakán → a `dArany` bukik; a késés a
// szakasz ELEJÉTŐL számolva → a `keses` bukik; a saját cím is számít → a `sajatNem` bukik.
proba('⭐⭐ D130 (⑤a): a terep-elemzés — az elérhetőség a terep egész idején, a DHT késése (fent / már nem, percben), az idegen cím, a pótlások és a kosarak', () => {
  const t0 = Date.UTC(2026, 10, 30, 0, 0, 0);
  const P = 60 * 1000;
  const lX = cimLenyomata('K', '10.0.0.1'), lD = cimLenyomata('K', '10.0.0.2'), lIdegen = cimLenyomata('K', '10.9.9.9');
  const X = { fajta: TEREP_FAJTA, koino: 'K', keszulek: keszulekLenyomata('K', 'X'), ido: t0, fent: [[t0, t0 + 180 * P, lX]],
    szamlalas: [
      { t: t0 + 30 * P, k: '1:0', l: 2, c: 2, sz: 0, a: [lD] },
      { t: t0 + 90 * P, k: '1:0', l: 2, c: 2, sz: 0, a: [lD, lX] },
      { t: t0 + 100 * P, k: '1:0', l: 1, c: 2, sz: 0, a: [lIdegen] }
    ],
    potlas: [{ t: t0 + 101 * P, e: 'indult', k: '1:0' }, { t: t0 + 104 * P, e: 'parjan', k: '1:0', f: 1, n: 4 },
      { t: t0 + 130 * P, e: 'dontes', k: '1:0', f: 3, v: true }, { t: t0 + 131 * P, e: 'felkeres', k: '1:0', a: 'megnezem' }] };
  const D = { fajta: TEREP_FAJTA, koino: 'K', keszulek: keszulekLenyomata('K', 'D'), ido: t0, fent: [[t0, t0 + 60 * P, lD]], szamlalas: [], potlas: [] };
  const e = terepElemzese([X, D, { fajta: 'más' }], { ora: (t) => new Date(t).getUTCHours() });
  const dK = e.keszulekek.find((d) => d.keszulek === D.keszulek);
  const xK = e.keszulekek.find((d) => d.keszulek === X.keszulek);
  const ki = {
    ketKeszulek: e.keszulekek.length === 2 && e.koinok.length === 1,
    dArany: Math.abs(dK.arany - 61 / 181) < 0.01 && Math.abs(xK.arany - 1) < 1e-9,
    profil: dK.profil[0] === 1 && dK.profil[1] < 0.05 && dK.profil[3] === 0 && xK.profil[2] === 1,
    keses: e.keses.fent === 1 && e.keses.nemFent === 1 && e.keses.median === 30,
    sajatNem: e.keses.fent + e.keses.nemFent + e.keses.sosem === 2,
    idegen: e.keses.idegen === 1,
    potlas: e.potlas.indult === 1 && e.potlas.parjan === 1 && e.potlas.dontes === 1 && e.potlas.valasztott === 1 && e.potlas.felkeres === 1
      && e.potlas.kozvetlenFelelt === 1 && e.potlas.kozvetlenKerdezett === 4,
    kosarak: e.kosarak.length === 1 && e.kosarak[0].db === 3 && e.kosarak[0].kevesDb === 1 && e.kosarak[0].median === 2,
    alak: kivitelAlakja({ fajta: 'más' }) === null && kivitelAlakja({ ...X, keszulek: 'rövid' }) === null
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify({ ki, keses: e.keses, dK: { arany: dK.arany, profil: dK.profil.slice(0, 4) } }) + ')\n');
  return Object.values(ki).every(Boolean);
});

export default async function () {
  return futtatas();
}
