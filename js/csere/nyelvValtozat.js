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
// Használják: csere/vonal.js (a jel és az ellenőrzés), a próbák (`meres/nyelvProba.js`).

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
  if (!uzenet || typeof uzenet !== 'object' || !(NYELV_MEZO in uzenet)) return [...JEL_NELKUL];
  const p = uzenet[NYELV_MEZO];
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
  const hiba = new Error(k.irany === 'regebbi'
    ? 'Nincs közös nyelvünk: a társ programja régebbi (' + nyelvSzoveg(tars) + ' nyelv), az enyém ' + nyelvSzoveg(sajat)
      + ' — amíg nem frissít, nem cserélünk'
    : 'Nincs közös nyelvünk: a társ programja újabb (' + nyelvSzoveg(tars) + ' nyelv), az enyém ' + nyelvSzoveg(sajat)
      + ' — frissítsd a programot (a telepítő sorral)');
  hiba.kod = 'NINCS-KOZOS-NYELV';
  hiba.irany = k.irany;
  hiba.sajatNyelve = [...sajat];
  hiba.tarsNyelve = tars;
  throw hiba;
}
