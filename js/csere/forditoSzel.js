// js/csere/forditoSzel.js

// Felelősség: A RÉGI NYELVEK JEGYZÉKE ÉS A FORDÍTÓ-SZÉL (D124 — az építés ④-e; `docs/protokoll_valtozat_atvizsgalas.md` 5. ④
// és ⑦) — egy helyen: melyik régi nyelvváltozatot beszéli még a program, MEDDIG, és HOGYAN. Hálózatot NEM nyit, üzenetet nem
// küld (1. szabály): a vonal (`vonal.js` — az üzenetsora) kéri tőle a szélét, amikor a közös nyelv eldőlt.
//
// ===== MIÉRT A SZÉLÉN (PV2 (A)) =====
//
// A csere logikája (a `vonal.js` párbeszéde) mindig a LEGÚJABB nyelvet beszéli. Ha a társsal csak egy régebbin van közös, a
// vonal SZÉLE fordít: a kimenő üzenetet a régi alakra (`le`), a bejövőt az újra (`fel`) — a logika nem tud róla, és nincs
// benne „ha a társ régi, akkor …” elágazás. Így a régi nyelv kódja egy helyen él (a jegyzék egy bejegyzésében), és a dátum
// után egy mozdulattal kivehető.
//
// ===== A JEGYZÉK =====
//
//   REGI_NYELVEK = { [n]: { meddig: 'ÉÉÉÉ-HH-NN', le(u), fel(u), szamitasok: { nev: fuggveny } } }
//
// Egy bejegyzés az n és az n+1 közti LÉPÉS: amit a program az n-es nyelvhez még tud. A `le` az n+1-es alakból az n-est készíti,
// a `fel` fordítva; a `szamitasok` a közös számítások n-es változatai — ahol nem alak, hanem SZÁMÍTÁS változott (a szelet-pár
// lenyomata, egy halmaz): ott a régi függvény megmarad, és a csere a közös nyelv szerint kéri (`szamitas`). A kérhető nevek
// (`KERHETO_SZAMITASOK`) azok, amelyeket a vonal valóban kér — egy itt bejegyzett, de sehol nem kért régi számítás a betöltéskor
// hiba (a 4. szabály-hiány ellen: a réteg kész volna, és az éles út nem hívná).
//
// ⭐ A `meddig` a KÓDBAN áll (⑦; PV3: legalább 6 hónap a kiadástól): azon a napon (UTC) a program a régit már nem beszéli. A
// legrégebbi nyelve EBBŐL a jegyzékből jön (`legregebbiBeszelt`), nem egy külön számból — két forrás elcsúszna (egy nyelv,
// amit a program „beszél”, de nincs hozzá fordítója). A régi társ onnantól megnevezett hibát kap (`NINCS-KOZOS-NYELV`), és a ③
// emlékezete kimondja. ⚠️ A rossz órájú készülék a dátumot korábban vagy később éri el (6. — kimondott határ).
//
// ⛔ AZ ELSŐ ÜZENETEK (`NYITAS`, `KERELEM`, `FAJLKEREK`, `VALASZ`, `FAJLVEGE`) SOHA NEM FORDÍTÓDNAK: az alakjuk örök (a régi és az új
// program egyaránt olvassa — ① ), az újdonság bennük legfeljebb mező. A szél ezeket átengedi — akárhányadik is a vonalon.
// ⚠️ A nyitás SZÁMAI (a nyitó lenyomat, a `gyd`, a `kd`) a közös nyelv előtt készülnek, tehát a saját legújabb szerint: ha egy
// törés épp ezek számítását érinti, a vegyes pár nyitása nem egyezik, és a csere a régi párokon egyeztet — helyesen, csak a
// „nincs újdonság” gyors útja nélkül (lásd `vonal.js` — a nyitás után a párok újraszámolása).
//
// ⭐ MA ÜRES: a program csak az 1-es nyelvet beszéli. A próbák egy KITALÁLT 2-essel mérik végig (`kitalaltNyelvKeszlet` — a
// `KOINO_PROBANYELV` környezeti változóval egy valódi folyamat is ilyen lehet, mint a `KOINO_KERET`).
//
// ===== ⭐⭐ ÉS A SZÁLLÍTÁS: NEM SZÉL, HANEM VÁLASZTÓ =====
//
//   REGI_SZALLITASOK = { [n]: { meddig: 'ÉÉÉÉ-HH-NN', reszek: { nev: fuggveny } } }
//
// A szállítás (a kézfogás, a titkosított csomag — `titkositas.js`) nem fordítható: egy régi társsal a RÉGI kézfogás kell. A közös
// szállítást a kopogás jele adja (D124 ②, `udpKapu.js`); a kapu társanként feljegyzi (`szallitasFeljegyzese` — a foglalathoz és a
// címhez), és a kézfogás (`udpVonal.js` `kezfogasUdpResen`) onnan olvassa, és annak a nemzedéknek a RÉSZEIVEL fog kezet
// (`szallitasReszei`) — az őr a rétegben van, nem a hívókban (egy út megtenné, a másik elfelejtené). A lépés, a dátum és a
// legrégebbi beszélt nemzedék ugyanúgy megy, mint a nyelvnél (`legregebbiBeszelt`). ⭐ MA ÜRES; a próbák egy kitalált 2-essel
// mérik (`kitalaltSzallitasKeszlet`, `KOINO_PROBASZALLITAS`): más címkékkel más kulcs — a régi kulccsal a társ nem érti.
//
// Használják: csere/nyelvValtozat.js (a készletek és a legrégebbi változat), csere/vonal.js (a szél — az üzenetsorban),
// csere/udpVonal.js (a kézfogás-választó), próbák.

import { createHash } from 'node:crypto';
import { szeletParok } from './szeletEgyeztetes.js';
import {
  ujEgyszeriKulcs, kezfogasCsomag, kezfogasCsomagbol, munkamenetKulcsai, csomagTitkositasa, csomagKititkositasa
} from './titkositas.js';

// ===== A JEGYZÉK =====

/** ⭐ A régi nyelvek jegyzéke — MA ÜRES (a program csak az 1-es nyelvet beszéli). Az alakját a betöltés ellenőrzi. */
export const REGI_NYELVEK = Object.freeze({});

/**
 * ⛔ Az első üzenetek: az alakjuk örök, a szél soha nem fordítja őket. A `FAJLVEGE` is ilyen: a fájl-randevú végén egy ÚJ,
 * csak küldő kapcsolaton megy (`udpVonal.js`), és a kiszolgáló a kapcsolat első üzeneteként olvassa — a közös nyelv előtt.
 */
export const ELSO_UZENETEK = Object.freeze(new Set(['NYITAS', 'KERELEM', 'FAJLKEREK', 'VALASZ', 'FAJLVEGE']));

/** A közös számítások, amelyeket a vonal a közös nyelv szerint KÉR (`szamitas(nev, …)`) — csak ezek jegyezhetők be. */
export const KERHETO_SZAMITASOK = Object.freeze(['szeletParok']);

const NAP = 24 * 60 * 60 * 1000;
const DATUM = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A `meddig` napjának kezdete (UTC, ezredmásodperc) — vagy NaN, ha nem érvényes dátum. */
function lejarat(meddig) {
  const t = typeof meddig === 'string' ? DATUM.exec(meddig) : null;
  if (!t) return NaN;
  const ms = Date.UTC(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  return new Date(ms).toISOString().slice(0, 10) === meddig ? ms : NaN;
}

/**
 * ⛔ Egy nyelv-készlet alakja (a betöltéskor és a próbákban): `legujabb` ≥ 1; a lépések 1 ≤ n < legujabb, mindegyiknek érvényes
 * `meddig`-je, `le`-je és `fel`-je van, a `szamitasok` csak kérhető neveket tartalmaz, függvényekkel. Hibánál DOB — a hibás
 * jegyzék programozási hiba, nem a társ dolga.
 */
export function keszletEllenorzese(k) {
  const hiba = (m) => { throw new Error('A nyelv-készlet hibás: ' + m); };
  if (!k || typeof k !== 'object' || !Number.isSafeInteger(k.legujabb) || k.legujabb < 1) hiba('a legújabb nyelv nem pozitív egész');
  for (const [nev, l] of Object.entries(k.lepesek ?? {})) {
    const n = Number(nev);
    if (!Number.isSafeInteger(n) || String(n) !== nev || n < 1 || n >= k.legujabb) hiba('a lépés száma (' + nev + ') nem 1 és a legújabb közé esik');
    if (!l || typeof l.le !== 'function' || typeof l.fel !== 'function') hiba('a ' + n + '. lépésnek nincs le- és fel-fordítója');
    if (Number.isNaN(lejarat(l.meddig))) hiba('a ' + n + '. lépés dátuma (' + l.meddig + ') nem ÉÉÉÉ-HH-NN');
    for (const [sz, f] of Object.entries(l.szamitasok ?? {})) {
      if (!KERHETO_SZAMITASOK.includes(sz)) hiba('a ' + n + '. lépés „' + sz + '” számítását a vonal nem kéri');
      if (typeof f !== 'function') hiba('a ' + n + '. lépés „' + sz + '” számítása nem függvény');
    }
  }
  for (const sz of Object.keys(k.mai ?? {})) if (!KERHETO_SZAMITASOK.includes(sz)) hiba('a „' + sz + '” mai számítását a vonal nem kéri');
  return k;
}
keszletEllenorzese({ legujabb: 1, lepesek: REGI_NYELVEK });

/**
 * ⭐ A legrégebbi nyelv, amit a program MOST még beszél: a legújabbtól lefelé, amíg a lépés megvan, és a dátuma még nem jött el.
 * @param {{legujabb: number, lepesek: Object}} keszlet
 * @param {number} most - ezredmásodperc (Date.now())
 */
export function legregebbiBeszelt(keszlet, most) {
  let n = keszlet.legujabb;
  while (n > 1) {
    const l = keszlet.lepesek?.[n - 1];
    if (!l || !(most < lejarat(l.meddig))) break;
    n--;
  }
  return n;
}

/**
 * ⭐ A lépések dátumai a legrégebbi beszélt nyelvtől (⑦ — a lap 30 nappal előtte szól): `[{ nyelv, meddig, napMulva }]`.
 */
export function lejaroNyelvek(keszlet, most) {
  const lista = [];
  for (let n = legregebbiBeszelt(keszlet, most); n < keszlet.legujabb; n++) {
    const meddig = keszlet.lepesek[n].meddig;
    lista.push({ nyelv: n, meddig, napMulva: Math.ceil((lejarat(meddig) - most) / NAP) });
  }
  return lista;
}

// ===== A SZÉL =====

/**
 * ⭐⭐ A FORDÍTÓ-SZÉL egy vonalra, a közös nyelv eldőlte után.
 *   · `ki(u)` — a logika üzenete a vonal (a közös nyelv) alakjában: a legújabbtól a közösig a `le` lépések;
 *   · `be(u)` — a vonal üzenete a logika alakjában: a közöstől a legújabbig a `fel` lépések (dobhat: a társ üzenete nem a közös
 *     nyelv alakja — a hívó megnevezett hibának veszi);
 *   · `szamitas(nev, mai)` — a közös számítás a közös nyelven: az első lépésé a közöstől fölfelé, amelyik bejegyezte; ha
 *     egyik sem, a mai (a legújabb).
 * Az első üzenetek érintetlenek. A közös = a legújabb esetén (a hétköznapi) a szél azonos: semmit nem fordít.
 * ⚠️ A hiányzó lépés azonos alakot jelent — a próbák `nyelv` párja (a jegyzéken kívül) így beszélhet „régit”.
 * @param {Object} keszlet - `{ legujabb, lepesek, logika?, mai? }` (a `logika` és a `mai` csak a kitalált nyelvé — lent)
 * @param {number[]} sajat - [legrégebbi, legújabb]
 * @param {number} nyelv - a közös nyelv
 */
export function vonalSzele(keszlet, sajat, nyelv) {
  const lepesek = keszlet?.lepesek ?? {};
  const logika = keszlet?.logika ?? null;
  const le = [], fel = [];
  // kifelé a legújabbtól lefelé, befelé a közöstől fölfelé (a legalsó lépés fordít először)
  for (let n = sajat[1] - 1; n >= nyelv; n--) if (lepesek[n]) le.push(lepesek[n].le);
  for (let n = nyelv; n < sajat[1]; n++) if (lepesek[n]) fel.push(lepesek[n].fel);
  const azonos = !logika && !le.length;
  return {
    nyelv,
    azonos,
    ki(u) {
      if (azonos || !u || typeof u !== 'object' || ELSO_UZENETEK.has(u.uzenet)) return u;
      let x = logika ? logika.ki(u) : u;
      for (const f of le) x = f(x);
      return x;
    },
    be(u) {
      if (azonos || !u || typeof u !== 'object' || ELSO_UZENETEK.has(u.uzenet)) return u;
      let x = u;
      for (const f of fel) x = f(x);
      return logika ? logika.be(x) : x;
    },
    szamitas(nev, mai) {
      for (let n = nyelv; n < sajat[1]; n++) {
        const f = lepesek[n]?.szamitasok?.[nev];
        if (typeof f === 'function') return f;
      }
      return keszlet?.mai?.[nev] ?? mai;
    }
  };
}

// ===== ⭐⭐ A SZÁLLÍTÁS NEMZEDÉKEI =====

/** ⭐ A régi szállítás-nemzedékek jegyzéke — MA ÜRES (a program csak az 1-es szállítást beszéli). */
export const REGI_SZALLITASOK = Object.freeze({});

/** A szállítás részei — a kézfogás és a védett rés ezeket kéri a közös nemzedéktől. */
export const SZALLITAS_RESZEK = Object.freeze(['ujEgyszeriKulcs', 'kezfogasCsomag', 'kezfogasCsomagbol', 'munkamenetKulcsai',
  'csomagTitkositasa', 'csomagKititkositasa']);
const MAI_SZALLITAS_RESZEI = Object.freeze({ ujEgyszeriKulcs, kezfogasCsomag, kezfogasCsomagbol, munkamenetKulcsai,
  csomagTitkositasa, csomagKititkositasa });

/** ⛔ Egy szállítás-készlet alakja (mint a nyelvé, de a lépésnek fordító helyett részei vannak). Hibánál DOB. */
export function szallitasKeszletEllenorzese(k) {
  const hiba = (m) => { throw new Error('A szállítás-készlet hibás: ' + m); };
  if (!k || typeof k !== 'object' || !Number.isSafeInteger(k.legujabb) || k.legujabb < 1) hiba('a legújabb nemzedék nem pozitív egész');
  const reszek = (r, hol) => {
    for (const [nev, f] of Object.entries(r ?? {})) {
      if (!SZALLITAS_RESZEK.includes(nev)) hiba(hol + ' „' + nev + '” része ismeretlen');
      if (typeof f !== 'function') hiba(hol + ' „' + nev + '” része nem függvény');
    }
  };
  for (const [nev, l] of Object.entries(k.lepesek ?? {})) {
    const n = Number(nev);
    if (!Number.isSafeInteger(n) || String(n) !== nev || n < 1 || n >= k.legujabb) hiba('a lépés száma (' + nev + ') nem 1 és a legújabb közé esik');
    if (Number.isNaN(lejarat(l?.meddig))) hiba('a ' + n + '. lépés dátuma (' + l?.meddig + ') nem ÉÉÉÉ-HH-NN');
    reszek(l.reszek, 'a ' + n + '. lépés');
  }
  reszek(k.mai, 'a mai');
  return k;
}
szallitasKeszletEllenorzese({ legujabb: 1, lepesek: REGI_SZALLITASOK });

/**
 * ⭐⭐ A KÉZFOGÁS-VÁLASZTÓ: az n-es szállítás részei — részenként az első lépésé n-től fölfelé, amelyik bejegyezte; ha egyik
 * sem, a mai (a legújabb — a kitalált próba-szállításé a `mai`-ja).
 */
export function szallitasReszei(keszlet, n) {
  const ki = {};
  for (const nev of SZALLITAS_RESZEK) {
    let f = null;
    for (let i = n; i < keszlet.legujabb && !f; i++) f = keszlet.lepesek?.[i]?.reszek?.[nev] ?? null;
    ki[nev] = f ?? keszlet.mai?.[nev] ?? MAI_SZALLITAS_RESZEI[nev];
  }
  return Object.freeze(ki);
}

// ===== ⚠️ A KITALÁLT 2-ES NYELV — CSAK PRÓBÁNAK =====
//
// A mai logika az 1-est beszéli, tehát egy kitalált 2-eshez a próbának kell egy belső réteg (`logika`), ami a logika 1-es
// alakját a 2-esre teszi — ez az, amit egy valódi 2-es kiadásban maga a logika tenne. A kitalált 2-es:
//   · az ALAK: az üzenet neve nem az `uzenet`, hanem a `u2` mezőben jön — egy 1-es program az ilyet nem érti (a „Várt
//     üzenet: …” hibával áll meg), és a 2-es a jel nélküli, 1-es alakú üzenetet sem (megnevezve dob);
//   · egy közös SZÁMÍTÁS: a szelet-párok lenyomata más (egy előtaggal újra lenyomatolva) — a 2-esek egymás közt ezt számolják,
//     az 1-essel a régit (a jegyzékből). Ha a vonal nem a közös nyelv szerint kérné, a vegyes pár minden szelete eltérne.
// Az 1-es lépés dátuma `napok` múlva jön el (negatív: már lejárt — a program akkor csak a 2-est beszéli).

const KITALALT_MEZO = 'u2';

/** A logika (1-es alakú) üzenete a kitalált 2-es alakban. */
function kitalaltAlakba(u) {
  const { uzenet, ...tobbi } = u;
  return { [KITALALT_MEZO]: uzenet, ...tobbi };
}

/** A kitalált 2-es alakú üzenet 1-es alakban — dob, ha nem 2-es alakú. */
function kitalaltbol(u) {
  if (typeof u?.[KITALALT_MEZO] !== 'string' || 'uzenet' in u) {
    throw new Error('nem a kitalált 2-es alak (' + JSON.stringify(u?.uzenet ?? null) + ')');
  }
  const { [KITALALT_MEZO]: uzenet, ...tobbi } = u;
  return { uzenet, ...tobbi };
}

/** A kitalált 2-es szelet-párjai: ugyanazok a kulcsok, más lenyomattal. */
async function kitalaltSzeletParok(tar, koino, reszvesz) {
  return (await szeletParok(tar, koino, reszvesz)).map((p) => {
    const i = p.lastIndexOf(':');
    return p.slice(0, i + 1) + createHash('sha256').update('kitalalt-2:' + p.slice(i + 1)).digest('base64url');
  });
}

/** A `napok` múlva eljövő nap (ÉÉÉÉ-HH-NN, UTC) — a kitalált lépések dátuma. */
const napMulva = (napok, most) => new Date(Math.floor((most + napok * NAP) / NAP) * NAP).toISOString().slice(0, 10);

/**
 * ⚠️ CSAK PRÓBÁNAK: a kitalált 2-es nyelv készlete — az 1-es lépés dátuma `napok` múlva.
 * @param {number} napok
 * @param {number} [most]
 */
export function kitalaltNyelvKeszlet(napok, most = Date.now()) {
  const meddig = napMulva(napok, most);
  return keszletEllenorzese({
    legujabb: 2,
    kitalalt: true,
    logika: { ki: kitalaltAlakba, be: kitalaltbol },
    mai: { szeletParok: kitalaltSzeletParok },
    lepesek: { 1: { meddig, le: kitalaltbol, fel: kitalaltAlakba, szamitasok: { szeletParok } } }
  });
}

// ===== ⚠️ A KITALÁLT 2-ES SZÁLLÍTÁS — CSAK PRÓBÁNAK =====
//
// A kézfogás-csomag ugyanaz, a kulcsok viszont más címkékből jönnek: aki a 2-essel fog kezet egy 1-essel (vagy fordítva), annak a
// csomagjait a társ nem tudja kititkosítani (eldobja — a munka „nem válaszol”-lal bukik). Az 1-es lépés dátuma `napok` múlva.

const KITALALT_CIMKEK = Object.freeze({ atirat: 'kitalalt-kezfogas-2', csere: 'kitalalt-csere-2' });

/**
 * ⚠️ CSAK PRÓBÁNAK: a kitalált 2-es szállítás készlete.
 * @param {number} napok
 * @param {number} [most]
 */
export function kitalaltSzallitasKeszlet(napok, most = Date.now()) {
  return szallitasKeszletEllenorzese({
    legujabb: 2,
    kitalalt: true,
    mai: { munkamenetKulcsai: (sajat, tars) => munkamenetKulcsai(sajat, tars, KITALALT_CIMKEK) },
    lepesek: { 1: { meddig: napMulva(napok, most), reszek: { munkamenetKulcsai } } }
  });
}
