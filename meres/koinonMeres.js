// meres/koinonMeres.js

// Felelősség: ⭐⭐ A 95. MÉRÉS — D130 (a koinon: a közös tények őrzése, darabokban, replikálva — 2026-11-19), az építés ELŐTT
// (`docs/koinon_atvizsgalas.md` 4.):
//   A) a TÖMÖR ALAK mérete: egy elfogadott általános egyezmény a teljes döntés-eseménykészlettel szemben, és tömören (a javaslat +
//      a lezárási összegzés — D95/1 — + a minta), 10, 100 és 1000 szavazóval;
//   B) a DARABOK TARTÓI: ha minden készülék csak BECSLI, hány készülék van, és ebből választ darab-mélységet (r = 20 tartóra), hány
//      tartója marad egy-egy entitásnak — pontos becsléssel, kétszeres és négyszeres hibával, a szomszéd szint átfedésével és
//      nélküle;
//   C) a fenntartó kör terhe (számolás).
//
// Futtatás: `node meres/koinonMeres.js` (nem próba: számokat ír ki, a `meres/eredmenyek.md` 95. szakaszába).

import { ujEember, tagokkal } from './probaFuttato.js';
import { allapotSzamitasa } from '../js/allapot/allapotSzamitas.js';
import { lezarasiOsszegzesEpitese, LEZARASI_MINTA } from '../js/allapot/lezarasiOsszegzes.js';
import { ALLASPONT_MUVELET } from '../js/allapot/szabalyok.js';
import { teljesSzabalyok } from '../js/esemeny/koinoSzabalyok.js';

const KEZDET = Date.UTC(2026, 10, 19);
const bajt = (x) => Buffer.byteLength(JSON.stringify(x));
const kb = (b) => (b / 1024).toFixed(1).replace('.', ',') + ' KB';

// ===================================
// A) A TÖMÖR ALAK
// ===================================

async function tomorAlak(szavazok) {
  const gazda = await ujEember();
  const szuletes = await gazda.tesz('KoinoLetrehozas', { nev: 'Mérés', leiras: null, alapitok: [], zart: true,
    szabalyok: teljesSzabalyok() }, KEZDET);
  const g = await gazda.tesz('GondolatLetrehozas', { cim: 'A hely', meret: 10 }, KEZDET + 1);
  const dontes = [];
  dontes.push(await gazda.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 100 }, KEZDET + 2));
  dontes.push(await gazda.tesz('ErtekJavaslat', { entitas: g.azonosito,
    ertekek: { elfogadasiKuszob: 51, reszveteliKuszob: 0, minimumDontesiIdo: 1, maximumDontesiIdo: 604800 } }, KEZDET + 2));
  const emberek = [];
  for (let i = 0; i < szavazok; i++) {
    const e = await ujEember();
    emberek.push(e);
    dontes.push(await e.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 10 }, KEZDET + 3));
  }
  const javaslat = await gazda.tesz('Javaslat', { fajta: 'altalanos',
    erintettek: [{ entitas: g.azonosito, muvelet: ALLASPONT_MUVELET, valtozas: { cim: 'Egy közös elv, amit elfogadunk' } }],
    indoklas: 'Mérés.' }, KEZDET + 1000);
  for (const e of emberek) dontes.push(...await e.szavaz(javaslat, { szavazat: 'Tamogat' }, KEZDET + 2000));
  const esemenyek = await tagokkal([szuletes, g, javaslat, ...dontes]);
  const allapot = allapotSzamitasa(esemenyek);
  const ep = await lezarasiOsszegzesEpitese(allapot.szamitok, javaslat, g.azonosito);
  const szavazatok = dontes.filter((x) => x.tipus === 'Szavazat');
  const atlagSzavazat = szavazatok.length ? szavazatok.reduce((n, x) => n + bajt(x), 0) / szavazatok.length : 0;
  // a minta: LEZARASI_MINTA levél — egy aláírt esemény és a fa-útja (≈ log2(n) × 44 B lenyomat) — becslés
  const ut = Math.ceil(Math.log2(Math.max(2, szavazok + 1))) * 44;
  const minta = LEZARASI_MINTA * 3 * (atlagSzavazat + ut);   // három fa (szavazat, nevező, érték) — felső becslés
  return {
    szavazok,
    teljes: bajt(javaslat) + dontes.reduce((n, x) => n + bajt(x), 0),
    javaslat: bajt(javaslat),
    osszegzes: ep ? bajt(ep.osszegzes) : null,
    minta: Math.round(minta),
    allasfoglalas: Math.round(atlagSzavazat)   // egy állásfoglalás nagyjából egy szavazat méretű
  };
}

// ===================================
// B) A DARABOK TARTÓI — szimuláció
// ===================================

const BITEK = 52;
const veletlen = () => Math.floor(Math.random() * 2 ** BITEK);
const elotag = (x, m) => (m <= 0 ? 0 : Math.floor(x / 2 ** (BITEK - m)));

/**
 * N készülék; mindegyik becsli N-et (a hibája egyenletes a log-térben [1/hiba, hiba] között), és a mélysége
 * max(0, floor(log2(becsles / r))); a darabját vállalja ezen a szinten, és ha `atfedes`, a durvább (−1) szinten is.
 */
function tartok({ N, r = 20, hiba = 1, atfedes = true, mintak = 20000 }) {
  const szintek = new Map();   // mélység → (előtag → tartók száma)
  const hozzaad = (m, x) => {
    if (m < 0) return;
    let t = szintek.get(m);
    if (!t) { t = new Map(); szintek.set(m, t); }
    const p = elotag(x, m);
    t.set(p, (t.get(p) ?? 0) + 1);
  };
  let vallalt = 0;
  for (let i = 0; i < N; i++) {
    const kulcs = veletlen();
    const f = Math.exp((Math.random() * 2 - 1) * Math.log(hiba));
    const m = Math.max(0, Math.floor(Math.log2(Math.max(1, N * f) / r)));
    hozzaad(m, kulcs);
    vallalt += 2 ** -m;
    if (atfedes && m > 0) { hozzaad(m - 1, kulcs); vallalt += 2 ** -(m - 1); }
  }
  const db = [];
  for (let i = 0; i < mintak; i++) {
    const e = veletlen();
    let n = 0;
    for (const [m, t] of szintek) n += t.get(elotag(e, m)) ?? 0;
    db.push(n);
  }
  db.sort((a, b) => a - b);
  const p = (q) => db[Math.min(db.length - 1, Math.floor(q * db.length))];
  return {
    N, hiba, atfedes, min: db[0], p1: p(0.01), median: p(0.5),
    otAlatt: (db.filter((x) => x < 5).length / db.length * 100).toFixed(2) + '%',
    nulla: (db.filter((x) => x === 0).length / db.length * 100).toFixed(3) + '%',
    // egy készülék átlagos terhe az entitások arányában (r/N az ideális)
    teher: (vallalt / N / (r / N)).toFixed(2) + '× az ideálisnak'
  };
}

// ===================================
// FUTTATÁS
// ===================================

console.log('A) A TÖMÖR ALAK (egy elfogadott általános egyezmény)');
for (const v of [10, 100, 1000]) {
  const t = await tomorAlak(v);
  const tomor = t.javaslat + (t.osszegzes ?? 0) + t.minta;
  console.log('  ' + v + ' szavazó: teljes ' + kb(t.teljes) + ' · tömör ' + kb(tomor) + ' (javaslat ' + kb(t.javaslat) + ', összegzés '
    + (t.osszegzes === null ? '—' : kb(t.osszegzes)) + ', minta ~' + kb(t.minta) + ') · egy állásfoglalás ~' + kb(t.allasfoglalas));
}

console.log('B) A DARABOK TARTÓI (r = 20)');
for (const N of [100, 10000, 1000000]) {
  for (const hiba of [1, 2, 4]) {
    for (const atfedes of [true, false]) {
      if (N === 1000000 && !atfedes && hiba !== 2) continue;
      const t = tartok({ N, hiba, atfedes, mintak: N >= 1000000 ? 10000 : 20000 });
      console.log('  N=' + N + ' hiba=' + hiba + '× ' + (atfedes ? 'átfedéssel' : 'átfedés nélkül') + ': min ' + t.min + ' · 1% '
        + t.p1 + ' · medián ' + t.median + ' · 5 alatt ' + t.otAlatt + ' · 0 tartó ' + t.nulla + ' · teher ' + t.teher);
    }
  }
}

console.log('C) A FENNTARTÓ KÖR: készülékenként 2 darab (a szint és az átfedés) — óránként 2 bejelentés és 2 lekérdezés a címjegyzéken');
