// js/csere/nyelvValtozat.js

// Felelősség: A PROTOKOLL NYELVVÁLTOZATA (D124 — a D123 PR6-ja, 2026-11-06; `docs/protokoll_valtozat_atvizsgalas.md`) — egy
// helyen: melyik nyelvváltozatokat beszéli ez a program, hogyan mondja ki (a jel), és két jelből mi a közös nyelv. Hálózatot
// NEM nyit, üzenetet nem küld (1. szabály): a vonal (`vonal.js`) teszi a jelet minden munka első üzenetébe, és ezzel
// ellenőrzi a társét.
//
// ===== MIÉRT KELL =====
//
// Egy élő közösségben a régi és az új program EGYÜTT fut (nem frissít mindenki egy napon — a PR5 óta pedig mindenki maga dönt).
// A 90. mérés szerint a mai program az ismeretlen MEZŐT átlépi, az ismeretlen ÜZENETRE viszont megáll — és a hiba csak az ő
// oldalán kap nevet, az újabb fél csak annyit lát, hogy „a társ nem válaszol”. Ezért a program a munka ELEJÉN kimondja,
// melyik nyelvváltozatokat beszéli, és mindkét fél EZ ALAPJÁN dönt, mielőtt bármi újat tenne.
//
// ===== A JEL =====
//
//   `ny: [legrégebbi, legújabb]` — minden munka első üzenetében (`NYITAS`, `KERELEM`, `FAJLKEREK`, `VALASZ`; a fájl-randevú
//   kiszolgálójánál az első válaszban). ⛔ Ennek az alaknak SOHA nem szabad változnia: ez az, amit egy bármilyen régi és egy
//   bármilyen új program egyaránt elolvas. Aki nem küld jelet (a PR6 előtti program), az az **1-es** nyelvet beszéli.
//
// ===== AZ EGYEZÉS — új üzenet nélkül =====
//
// Mindkét fél ugyanazt a két jelet látja, tehát ugyanazt számolja: a közös nyelv a két „legújabb” közül a KISEBBIK, ha az
// legalább akkora, mint a két „legrégebbi” közül a NAGYOBBIK. Ha nincs ilyen, mindkét fél megnevezett hibával áll meg
// (`NINCS-KOZOS-NYELV` — és hogy a társ a régebbi vagy az újabb), nem csendben (a „nem-esemény néma”).
//
// ⭐ MIKOR KELL ÚJ SZÁM (D124 / PV1): csak TÖRÉSNÉL — ha egy régi programmal másképp működne (más alak, elhagyott lépés, más közös
// számítás: szelet-halmaz, lenyomat, DHT-téma). A bővítés jellel megy, szám nélkül: új mező mindig elhagyható, új lépés csak ha
// mindkét fél jelezte (`cs`, `kd`, `FOGLALT`, `KESZ` + `kesobb` — eddig is így). A törések gyűjtve jönnek: egy kiadás legfeljebb
// EGY új számot hoz (PV3); a régit a program legalább 6 hónapig beszéli, a szélén fordítva (PV2 — az építés ④-e).
//
// ===== ⭐ A SZÁLLÍTÁS JELE (D124 — az építés ②-e) =====
//
// A szállítás (a kézfogás, a titkosított csomag — `udpVonal.js`, `titkositas.js`) a párbeszéd ALATT van: ha az változik, a
// `NYITAS` el sem jut a társhoz, tehát azt a nyitás jele nem egyeztetheti. A szállítás saját jelét ezért a KOPOGÁS viszi
// (`KOPOG`, `HALLAK`, `FOGLALT` — `udpKapu.js`): `sz: [legrégebbi, legújabb]`, ugyanazzal a számítással. A kopogás türelmes (a
// régi kapu az ismeretlen mezőt átlépi); aki nem küld jelet, az az **1-es** szállítást beszéli. Ha nincs közös, a kézfogás el
// sem indul — és mindkét fél kimondja (a kapu `NINCS-KOZOS-SZALLITAS` jelzése). ⚠️ Ára: a kopogás nyílt — az úton ülő egy
// számot lát (melyik szállítás-nemzedék); a koino forgalom a kopogásról ma is felismerhető.
// ⚠️ A `sz` a kopogás mezője: a megbízható folyam darabjainak `sz`-e (a sorszám, `udpKapcsolat`) a titkosított csatornán belül
// él, `uzenet` nélkül — a kettő nem találkozik (a kapu az `uzenet` nélküli csomagot adatnak látja, a jelét nem nézi).
//
// Használják: csere/vonal.js (a nyelv jele és ellenőrzése), csere/udpKapu.js (a szállításé), a próbák (`meres/nyelvProba.js`).

// ===== A MAI NYELV =====

/** A legrégebbi nyelvváltozat, amit ez a program még beszél. */
export const NYELV_LEGREGEBBI = 1;
/** A legújabb nyelvváltozat, amit ez a program beszél. ⭐ Új számot csak törés hoz (lásd fent). */
export const NYELV_LEGUJABB = 1;
/** A jel mezője az első üzenetekben. ⛔ A neve és az alakja (`[a, b]`) soha nem változik. */
export const NYELV_MEZO = 'ny';
/** Aki nem küld jelet: a PR6 előtti program — az 1-es nyelv. */
const JEL_NELKUL = Object.freeze([1, 1]);

/** Érvényes nyelv-pár: két biztonságos egész, 1 ≤ a ≤ b. */
function ervenyesPar(p) {
  return Array.isArray(p) && p.length === 2 && Number.isSafeInteger(p[0]) && Number.isSafeInteger(p[1])
    && p[0] >= 1 && p[0] <= p[1];
}

/**
 * A saját nyelv — a program állandói, vagy (a próbáknak) a hívó adta pár (`beallitas.nyelv`).
 * @param {Object} [beallitas]
 * @returns {number[]} [legrégebbi, legújabb]
 */
export function sajatNyelv(beallitas) {
  const n = beallitas?.nyelv;
  return ervenyesPar(n) ? [n[0], n[1]] : [NYELV_LEGREGEBBI, NYELV_LEGUJABB];
}

/** A jel, egy üzenetbe szórva: `{ ny: [a, b] }`. */
export function nyelvJel(sajat) {
  return { [NYELV_MEZO]: [sajat[0], sajat[1]] };
}

/**
 * A társ nyelve az üzenetéből. Jel nélkül az 1-es (a PR6 előtti program); hibás jelnél null.
 * @param {Object} uzenet
 * @returns {number[]|null}
 */
export function tarsNyelve(uzenet) {
  return jelbol(uzenet, NYELV_MEZO);
}

/** Egy jel az üzenetből — a nyelvé és a szállításé ugyanígy: jel nélkül az 1-es, hibás jelnél null. */
function jelbol(uzenet, mezo) {
  if (!uzenet || typeof uzenet !== 'object' || !(mezo in uzenet)) return [...JEL_NELKUL];
  const p = uzenet[mezo];
  return ervenyesPar(p) ? [p[0], p[1]] : null;
}

/**
 * ⭐ A közös nyelv — mindkét fél ugyanazt számolja (a két jel szimmetrikus).
 * @returns {{ nyelv: number } | { nyelv: null, irany: 'regebbi'|'ujabb' }} az `irany` a TÁRSRÓL szól
 */
export function kozosNyelv(sajat, tars) {
  const legujabb = Math.min(sajat[1], tars[1]);
  const legregebbi = Math.max(sajat[0], tars[0]);
  if (legujabb >= legregebbi) return { nyelv: legujabb };
  return { nyelv: null, irany: tars[1] < sajat[0] ? 'regebbi' : 'ujabb' };
}

const nyelvSzoveg = (p) => (p[0] === p[1] ? p[0] + '.' : p[0] + '–' + p[1] + '.');

/**
 * ⭐⭐ A társ első üzenetének ellenőrzése: a közös nyelv, vagy megnevezett hiba.
 *   · `NINCS-KOZOS-NYELV` — `irany` ('regebbi': a társ programja régebbi; 'ujabb': az övé újabb), `sajatNyelve`, `tarsNyelve`;
 *   · `HIBAS-NYELVJEL` — a jel ott van, de nem az örök alakban (egy hibás vagy rosszindulatú társ).
 * @param {Object} uzenet - a társ első üzenete
 * @param {number[]} sajat - `sajatNyelv(...)`
 * @returns {number} a közös nyelv
 */
export function nyelvEllenorzese(uzenet, sajat) {
  const tars = tarsNyelve(uzenet);
  if (!tars) {
    const hiba = new Error('A társ nyelv-jele hibás (' + JSON.stringify(uzenet?.[NYELV_MEZO]) + ') — nem cserélünk vele');
    hiba.kod = 'HIBAS-NYELVJEL';
    throw hiba;
  }
  const k = kozosNyelv(sajat, tars);
  if (k.nyelv !== null) return k.nyelv;
  const hiba = new Error(nincsKozosSzovege('nyelvünk', 'nyelv', k.irany, tars, sajat));
  hiba.kod = 'NINCS-KOZOS-NYELV';
  hiba.irany = k.irany;
  hiba.sajatNyelve = [...sajat];
  hiba.tarsNyelve = tars;
  throw hiba;
}

/** A közös hiányának mondata — az irány szerint a teendővel (a nyelvnél és a szállításnál ugyanaz). */
function nincsKozosSzovege(mi, egyseg, irany, tars, sajat) {
  return irany === 'regebbi'
    ? 'Nincs közös ' + mi + ': a társ programja régebbi (' + nyelvSzoveg(tars) + ' ' + egyseg + '), az enyém ' + nyelvSzoveg(sajat)
      + ' — amíg nem frissít, nem cserélünk'
    : 'Nincs közös ' + mi + ': a társ programja újabb (' + nyelvSzoveg(tars) + ' ' + egyseg + '), az enyém ' + nyelvSzoveg(sajat)
      + ' — frissítsd a programot (a telepítő sorral)';
}

// ===== ⭐ A SZÁLLÍTÁS (az építés ②-e — a kopogásban) =====

/** A legrégebbi szállítás-nemzedék, amit ez a program még beszél (a kézfogás és a titkosított csomag alakja). */
export const SZALLITAS_LEGREGEBBI = 1;
/** A legújabb szállítás-nemzedék. ⭐ Új számot csak a szállítás törése hoz (más kézfogás, más csomag-alak). */
export const SZALLITAS_LEGUJABB = 1;
/** A jel mezője a kopogás üzeneteiben. ⛔ A neve és az alakja (`[a, b]`) soha nem változik. */
export const SZALLITAS_MEZO = 'sz';

/**
 * A saját szállítás — a program állandói, vagy (a próbáknak) a hívó adta pár (`beallitas.szallitas`).
 * @returns {number[]} [legrégebbi, legújabb]
 */
export function sajatSzallitas(beallitas) {
  const n = beallitas?.szallitas;
  return ervenyesPar(n) ? [n[0], n[1]] : [SZALLITAS_LEGREGEBBI, SZALLITAS_LEGUJABB];
}

/** A jel, egy kopogás-üzenetbe szórva: `{ sz: [a, b] }`. */
export function szallitasJel(sajat) {
  return { [SZALLITAS_MEZO]: [sajat[0], sajat[1]] };
}

/** A társ szállítása a kopogásából. Jel nélkül az 1-es (a D124 ② előtti program); hibás jelnél null. */
export function tarsSzallitasa(uzenet) {
  return jelbol(uzenet, SZALLITAS_MEZO);
}

/**
 * ⭐⭐ A társ kopogásának szállítás-jele — DOBÁS NÉLKÜL (a kapu egy csomag-figyelőben dönt, nem egy munkában):
 *   · `{ szallitas: n }` — a közös szállítás;
 *   · `{ szallitas: null, irany, sajat, tars, uzenet }` — nincs közös (`irany` a TÁRSRÓL szól: 'regebbi' | 'ujabb');
 *   · `{ szallitas: null, hibas: true, uzenet }` — a jel ott van, de nem az örök alakban.
 * @param {Object} uzenet - a társ kopogás-üzenete
 * @param {number[]} sajat - `sajatSzallitas(...)`
 */
export function szallitasEgyezese(uzenet, sajat) {
  const tars = tarsSzallitasa(uzenet);
  if (!tars) {
    return { szallitas: null, hibas: true,
      uzenet: 'A társ szállítás-jele hibás (' + JSON.stringify(uzenet?.[SZALLITAS_MEZO]) + ') — nem fogunk vele kezet' };
  }
  const k = kozosNyelv(sajat, tars);
  if (k.nyelv !== null) return { szallitas: k.nyelv };
  return { szallitas: null, irany: k.irany, sajat: [...sajat], tars,
    uzenet: nincsKozosSzovege('szállításunk', 'szállítás', k.irany, tars, sajat) };
}
