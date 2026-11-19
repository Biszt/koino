// js/kezikonyv/kezikonyv.js

// Felelősség: ⭐⭐ D129 (②, 2026-11-19) — A KÉZIKÖNYV ALAP-TARTALMA (a program hozza) és a megjelenítendő szöveg.
//
// ⛔⛔ NEM A MAG RÉSZE, és a mag nem is importálhatja (`kodCsomag.js` `sajatMag` — a `ketReteg.js` és az `esemenyTar.js`
// import-zárványa): ha a mag olvasná, minden új ⓘ (egy új menüpont magyarázata) „más számítás” lenne (D123), pedig az MA5 (A)
// szerint magától, költözés nélkül lép be. A mag csak a NEVEKET látja (az eseményekben — `esemeny/rendszerEntitas.js`); a
// szöveget a program többi része adja innen.
//
// ⭐ AZ MA5 (A) (Csaba, 2026-11-19): a NEM módosított szöveg magától követi a programot (a lap innen rajzolja); ahol a közösség
// módosított (az állapotban a cím vagy a szöveg nem üres), ott a program nem ír felül — ha a program azóta mást mond, mint amit a
// közösség módosítása váltott (`alapLenyomatok`), a program felkínálja a saját szövegét JAVASLATKÉNT (`programJavaslatai`), amit
// egy e-ember elindíthat.
//
// Az alap-tartalom fájlja: `alapTartalom.json` — `{ fajta: 'koino-kezikonyv-1', bejegyzesek: [{ nev, cim, szoveg }] }`; a szülő
// a névből jön, a testvérek sorrendje a fájlé.
//
// Használják: koino.js (a műveletek környezete, a `kezikonyv` parancs, a lap), a próbák.

import { readFileSync } from 'node:fs';
import { lenyomatSzinkron } from '../esemeny/kanonikusAlak.js';
import { rendszerNevE, rendszerAzonosito, szuloNeve, KEZIKONYV_GYOKER } from '../esemeny/rendszerEntitas.js';

/** Az alap-tartalom alakjának jele. */
export const ALAP_TARTALOM_FAJTA = 'koino-kezikonyv-1';

/** Egy bejegyzés címe legfeljebb ennyi jel, a szövege legfeljebb ennyi. */
const CIM_KORLAT = 200;
const SZOVEG_KORLAT = 20000;

// ===================================
// AZ ALAP-TARTALOM
// ===================================

/**
 * Az alap-tartalom alaki hibája: a fajta, a bejegyzések (érvényes, egyedi név; szöveges cím és szöveg a korlátokon belül), és
 * minden név szülője megelőzi (a gyökér az első).
 * @param {*} t
 * @returns {string|null}
 */
export function alapTartalomAlakiHibaja(t) {
  if (!t || typeof t !== 'object' || t.fajta !== ALAP_TARTALOM_FAJTA || !Array.isArray(t.bejegyzesek)) {
    return 'az alap-tartalom { fajta: \'' + ALAP_TARTALOM_FAJTA + '\', bejegyzesek: [...] }';
  }
  const latott = new Set();
  for (const b of t.bejegyzesek) {
    if (!b || !rendszerNevE(b.nev)) return 'érvénytelen név: ' + JSON.stringify(b?.nev);
    if (latott.has(b.nev)) return 'kétszer szereplő név: ' + b.nev;
    const sz = szuloNeve(b.nev);
    if (sz === null ? b.nev !== KEZIKONYV_GYOKER : !latott.has(sz)) return 'a szülője nem előzi meg: ' + b.nev;
    if (typeof b.cim !== 'string' || !b.cim.length || b.cim.length > CIM_KORLAT) return 'a cím 1–' + CIM_KORLAT + ' jel: ' + b.nev;
    if (typeof b.szoveg !== 'string' || b.szoveg.length > SZOVEG_KORLAT) return 'a szöveg legfeljebb ' + SZOVEG_KORLAT + ' jel: ' + b.nev;
    latott.add(b.nev);
  }
  if (t.bejegyzesek[0]?.nev !== KEZIKONYV_GYOKER) return 'az első bejegyzés a kézikönyv gyökere';
  return null;
}

/**
 * A bejegyzés szövegének lenyomata (a cím és a szöveg) — ezzel jegyzi meg a módosító javaslat, a program melyik szövegét
 * váltotta (MA5 (A)).
 * @param {{cim: string, szoveg: string}} b
 * @returns {string}
 */
export function bejegyzesLenyomata(b) {
  return lenyomatSzinkron({ fajta: 'kezikonyv-alap', cim: b.cim, szoveg: b.szoveg });
}

/**
 * Az alap-tartalom indexe: a bejegyzések (a sorrendjükben), név és azonosító szerint, a gyerekek listájával.
 * @param {Object} t - az alap-tartalom (érvényes)
 * @returns {{bejegyzesek: Array<Object>, nevSzerint: Map<string, Object>, azonositoSzerint: Map<string, Object>}}
 */
export function alapTartalomIndexe(t) {
  const h = alapTartalomAlakiHibaja(t);
  if (h) throw new Error('A kézikönyv alap-tartalma hibás: ' + h);
  const bejegyzesek = t.bejegyzesek.map((b, i) => Object.freeze({
    nev: b.nev, cim: b.cim, szoveg: b.szoveg, sorrend: i, szulo: szuloNeve(b.nev),
    azonosito: rendszerAzonosito(b.nev), lenyomat: bejegyzesLenyomata(b)
  }));
  return {
    bejegyzesek,
    nevSzerint: new Map(bejegyzesek.map((b) => [b.nev, b])),
    azonositoSzerint: new Map(bejegyzesek.map((b) => [b.azonosito, b]))
  };
}

let betoltott = null;

/**
 * A program alap-tartalma (egyszer olvasva, a fájl mellől). ⭐ A próbák egy másik fájlt adhatnak (`KOINO_KEZIKONYV_ALAP` — egy
 * „újabb program” alap-tartalma: az MA5 (A) útja így kézzel is végigjárható).
 * @returns {ReturnType<typeof alapTartalomIndexe>}
 */
export function programAlapTartalma() {
  if (!betoltott) {
    const ut = process.env.KOINO_KEZIKONYV_ALAP || new URL('./alapTartalom.json', import.meta.url);
    betoltott = alapTartalomIndexe(JSON.parse(readFileSync(ut, 'utf8')));
  }
  return betoltott;
}

// ===================================
// A MEGJELENÍTENDŐ SZÖVEG
// ===================================

/**
 * Egy kézikönyv-entitás megjelenítendő címe és szövege: mezőnként a közösségé, ha módosította (az állapotban nem üres), különben a
 * programé (MA5 (A) — így a nem módosított szöveg magától követi a programot). A különvált ág (`rendszerbol`) ugyanígy.
 * @param {Object} entitas - az állapot entitása (`rendszer` vagy `rendszerbol` mezővel)
 * @param {ReturnType<typeof alapTartalomIndexe>} [index]
 * @returns {{nev: string|null, cim: string|null, szoveg: string|null, modositott: boolean, ismert: boolean}}
 */
export function kezikonyvSzovege(entitas, index = programAlapTartalma()) {
  const nev = entitas?.rendszer ?? entitas?.rendszerbol ?? null;
  const b = nev ? index.nevSzerint.get(nev) : null;
  const sajatCim = entitas?.cim ?? null;
  const sajatSzoveg = entitas?.szoveg ?? null;
  return {
    nev,
    cim: sajatCim ?? b?.cim ?? null,
    szoveg: sajatSzoveg ?? b?.szoveg ?? null,
    modositott: sajatCim !== null || sajatSzoveg !== null,
    ismert: !!b
  };
}

// ===================================
// AZ ÚJ PROGRAMVERZIÓ (MA5 (A))
// ===================================

/**
 * Ahol a közösség módosított, de a program azóta mást mond, mint amit a módosítás váltott: a program által megírt javaslatok.
 *
 * A legutóbbi ELFOGADOTT módosító javaslat (`javaslatok` — a kép döntései) `alapLenyomatok`-ja mondja meg, a program melyik szövegét
 * váltotta; ha az eltér a program mai szövegének lenyomatától, a program felkínálja a mait. Ha a javaslat nem jegyezte meg (régi,
 * vagy kézzel írt), nem kínálunk (nem tudjuk, változott-e a program).
 * @param {Object} b
 * @param {Object} b.allapot - a kép állapota (a végrehajtás után)
 * @param {Map<string, Object>} b.javaslatok - a kép döntései (javaslat → állás)
 * @param {Map<string, Object>} b.esemenyek - azonosító → esemény (a javaslatok eseményei)
 * @param {ReturnType<typeof alapTartalomIndexe>} [b.index]
 * @returns {Array<{nev: string, azonosito: string, cim: string, szoveg: string, lenyomat: string}>}
 */
export function programJavaslatai({ allapot, javaslatok, esemenyek, index = programAlapTartalma() }) {
  const ki = [];
  for (const e of allapot.entitasok.values()) {
    if (e.rendszer === undefined || (e.cim === null && e.szoveg === null)) continue;
    const b = index.nevSzerint.get(e.rendszer);
    if (!b) continue;
    let legutobbi = null;
    for (const [az, j] of javaslatok) {
      if (j.statusz !== 'elfogadva') continue;
      if (!(j.reszek ?? []).some((r) => r.entitas === e.azonosito && r.muvelet === 'Modositas')) continue;
      if (!legutobbi || (j.lezarasIdeje ?? 0) > (legutobbi.j.lezarasIdeje ?? 0)) legutobbi = { az, j };
    }
    const valtott = legutobbi ? esemenyek.get(legutobbi.az)?.adat?.alapLenyomatok?.[e.rendszer] : undefined;
    if (typeof valtott !== 'string' || valtott === b.lenyomat) continue;
    ki.push({ nev: b.nev, azonosito: e.azonosito, cim: b.cim, szoveg: b.szoveg, lenyomat: b.lenyomat });
  }
  return ki;
}
