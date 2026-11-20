// js/allapot/koinonCsomag.js

// Felelősség: ⭐⭐ D130 (②) — AZ EGYEZMÉNY TÖMÖR ALAKJA: amit a koinon darabjainak tartói őriznek (KO3 (A): a tényt és a hatályt
// tömören). Hálózat nélkül (1. szabály): épít és ellenőriz; hogy min utazik és ki tartja, az a darabok dolga (③).
//
// ===== MIÉRT KELL =====
//
// Csaba (2026-11-19): „a koinon … maga a program azon tárhelye, amit darabokban, replikálva, őriz meg … az általános egyezmények,
// mikor megszületnek, akkor azok kapnak, 1 tudatpontot a koinon-tól is, ezáltal biztosítva a létét.” A létéhez a pont (①) nem elég:
// az eseményeinek is meg kell maradniuk valahol. A teljes döntés (minden szavazat) 1000 szavazónál ~2,3 MB — a koinon darabjai
// ezért a TÖMÖR alakot tartják (a 95. mérés: 20–26 KB):
//
//   · a JAVASLAT (az aláírt esemény — a tény maga);
//   · érintettenként a LEZÁRÁSI ÖSSZEGZÉS (D95/1: a végső számok, a küszöbök, a lezárás, a fák gyökerei — `lezarasiOsszegzes.js`) és
//     a MINTÁI — a helyeiket az összegzés SAJÁT lenyomata adja (`onalloMintaHelyek`), így a később érkező tartó az építő nélkül is
//     ellenőrizheti (a 95. mérés lelete), és az építő nem sorsolhat újra kedvezőbb helyeket;
//   · az ÁLLÁSFOGLALÁSOK (a hatály — D27): e-emberenként az utolsó (csatlakozik / tiltakozik / ütközik), tehát a tagok számával
//     korlátos.
//
// ⛔ Az ellenőrző a minta-helyeket MAGA számolja (nem a csomagból veszi): egy rossz csomag nem mondhatja meg, hol nézzen.
//
// Használják: a koinon darabjai (③ — a következő lépés), a próbák. ⚠️ NEM a mag része: a döntést a darab tartója a meglévő úton
// kapja (az ellenőrzött lezárási összegzés — D95/1, `osszegzesek`).

import { esemenyEllenorzese, kesobbiAllitas, kiseroNelkul, kiseroval, KISERO_MEZO } from '../esemeny/esemeny.js';
import { javaslatEntitasai } from './szabalyok.js';
import {
  lezarasiOsszegzesEpitese, lezarasiMintakValasza, lezarasiOsszegzesEllenorzese, onalloMintaHelyek
} from './lezarasiOsszegzes.js';

/** A tömör alak jele (és változata). */
export const KOINON_CSOMAG = 'koinon-csomag-1';

/**
 * Egy egyezmény állásfoglalásai — e-emberenként az utolsó (ugyanaz a szabály, mint a hatály számításánál — `javaslatSzamitas.js`
 * `hatalyokSzamitasa`: a saját láncban a nagyobb sorszám, két készülék között az idő), a szerzők szerint rendezve.
 * @param {Array<Object>} esemenyek
 * @param {string} egyezmeny
 * @returns {Array<Object>}
 */
export function utolsoAllasfoglalasok(esemenyek, egyezmeny) {
  const utolso = new Map();
  for (const e of esemenyek) {
    if (e?.tipus !== 'Allasfoglalas' || e.adat?.egyezmeny !== egyezmeny) continue;
    const eddigi = utolso.get(e.szerzo);
    if (!eddigi || kesobbiAllitas(e, eddigi)) utolso.set(e.szerzo, e);
  }
  return [...utolso.values()].sort((a, b) => (a.szerzo < b.szerzo ? -1 : a.szerzo > b.szerzo ? 1 : 0));
}

/**
 * ⭐ AZ ÉPÍTÉS — annál, aki a döntés teljes bemenetét tartja (a javaslat, a szavazatai, az érintettek pont- és érték-eseményei, az
 * állásfoglalások).
 * @param {Array<Object>} esemenyek - a számító események
 * @param {Object} javaslatEsemeny
 * @param {Function} esemenyOlvas - async (azonosító) → esemény (a minták aláírt eseményei)
 * @returns {Promise<Object|null>} null, ha egy rész összegzése nem épülhet (hiányzik a bemenete)
 */
export async function koinonCsomagEpitese(esemenyek, javaslatEsemeny, esemenyOlvas) {
  console.log('koinonCsomagEpitese - KEZDÉS', { javaslat: javaslatEsemeny?.azonosito?.slice(0, 8) });
  const reszek = [];
  for (const je of javaslatEntitasai(javaslatEsemeny)) {
    if (!je.resz) continue;
    const ep = await lezarasiOsszegzesEpitese(esemenyek, javaslatEsemeny, je.resz.entitas);
    if (!ep) return null;
    const mintak = await lezarasiMintakValasza(ep.epito, onalloMintaHelyek(ep.osszegzes), esemenyOlvas);
    reszek.push({ osszegzes: ep.osszegzes, mintak });
  }
  // ⭐⭐ D128: a csomag eseményei a készülékük tanúsítványával utaznak (a kísérő — `esemeny.js` `kiseroval`): a javaslat és az
  // állásfoglalások is ugyanazon az olvasón át jönnek, mint a minták (a program olvasója a kísérőt adja — `kiseroAdo`).
  const olvasva = async (e) => (await esemenyOlvas(e.azonosito)) ?? e;
  // ⭐ EGYSZER MINDEN (a méret mérése, 2026-11-20): 52 minta közt 17–32 különböző esemény van (egy érték javaslat mind a négy
  // küszöb naplójában ott áll), és mindegyik a kísérő tanúsítványával — 13 szavazónál 83 KB, ebből 66 KB az ismétlés. ⭐ Ezért a
  // csomag minden eseményt EGYSZER tart (kísérő nélkül — `esemenyek`), a tanúsítványokat készülékenként EGYSZER (`tanusitvanyok`),
  // a minták és a javaslat, az állásfoglalások csak az azonosítóra hivatkoznak. Az ellenőrző visszaállítja (`kiseroval`).
  const esemenyTabla = new Map();
  const tanusitvanyTabla = new Map();
  const tabla = (e) => {
    if (!e || typeof e !== 'object') return e ?? null;
    if (e[KISERO_MEZO]) tanusitvanyTabla.set(e[KISERO_MEZO].keszulek, e[KISERO_MEZO]);
    esemenyTabla.set(e.azonosito, kiseroNelkul(e));
    return e.azonosito;
  };
  const mintaTablaba = (m) => (m && m.esemeny ? { ...m, esemeny: tabla(m.esemeny) } : m);
  for (const r of reszek) {
    r.mintak = { szavazat: r.mintak.szavazat.map(mintaTablaba), nevezo: r.mintak.nevezo.map(mintaTablaba),
      ertek: Object.fromEntries(Object.entries(r.mintak.ertek).map(([n, l]) => [n, l.map(mintaTablaba)])) };
  }
  const javaslat = tabla(await olvasva(javaslatEsemeny));
  const allasfoglalasok = [];
  for (const a of utolsoAllasfoglalasok(esemenyek, javaslatEsemeny.azonosito)) allasfoglalasok.push(tabla(await olvasva(a)));
  const rendezve = (m, kulcs) => [...m.values()].sort((a, b) => (a[kulcs] < b[kulcs] ? -1 : a[kulcs] > b[kulcs] ? 1 : 0));
  const csomag = { fajta: KOINON_CSOMAG, javaslat, reszek, allasfoglalasok,
    esemenyek: rendezve(esemenyTabla, 'azonosito'), tanusitvanyok: rendezve(tanusitvanyTabla, 'keszulek') };
  console.log('koinonCsomagEpitese - VÉGE', { reszek: reszek.length, allasfoglalasok: csomag.allasfoglalasok.length });
  return csomag;
}

/**
 * ⭐ AZ ELLENŐRZÉS — a darab tartójánál, a nyers szavazatok nélkül: a javaslat hiteles általános javaslat; minden érintettjéről
 * van összegzés, és az a SAJÁT lenyomatából számolt helyeken vett mintákkal igaz (`lezarasiOsszegzesEllenorzese`); az
 * állásfoglalások hitelesek, erre az egyezményre szólnak, és e-emberenként egy van. ⛔ Egyetlen hiba az egészet elveti.
 * @param {Object} cs - a csomag
 * @param {Object} [b]
 * @param {Function} [b.tagE] - async (szerző) → true | false | null (nem ellenőrizhető)
 * @param {Object} [b.alapKuszobok] - a koinó alap-küszöbei (a születéséből)
 * @returns {Promise<{rendben: boolean, ok?: string, elfogadva?: boolean, lezaras?: number, ellenorzott?: number, nemEllenorizheto?: number}>}
 */
export async function koinonCsomagEllenorzese(cs, { tagE, alapKuszobok } = {}) {
  const hiba = (ok) => ({ rendben: false, ok });
  if (!cs || typeof cs !== 'object' || cs.fajta !== KOINON_CSOMAG || !Array.isArray(cs.reszek) || !Array.isArray(cs.allasfoglalasok)
      || !Array.isArray(cs.esemenyek) || !Array.isArray(cs.tanusitvanyok)) {
    return hiba('nem tömör egyezmény-alak');
  }
  // ----- a táblákból vissza: az azonosítóból az esemény, a készülékéből a kísérő tanúsítvány (a hitelességét az esemény
  // ellenőrzése nézi — `esemenyEllenorzese`); ami nincs a táblában, az nincs (null — a hivatkozó elem elbukik) -----
  const esemenyTabla = new Map(cs.esemenyek.filter((e) => typeof e?.azonosito === 'string').map((e) => [e.azonosito, e]));
  const tanusitvanyTabla = new Map(cs.tanusitvanyok.filter((t) => typeof t?.keszulek === 'string').map((t) => [t.keszulek, t]));
  const esemenye = (az) => {
    const e = typeof az === 'string' ? esemenyTabla.get(az) : null;
    return e ? kiseroval(e, tanusitvanyTabla.get(e.keszulek) ?? null) : null;
  };
  const mintaVissza = (m) => (m && m.esemeny !== undefined ? { ...m, esemeny: esemenye(m.esemeny) } : m);
  const mintakVissza = (ms) => (!ms || typeof ms !== 'object' ? ms : {
    szavazat: Array.isArray(ms.szavazat) ? ms.szavazat.map(mintaVissza) : ms.szavazat,
    nevezo: Array.isArray(ms.nevezo) ? ms.nevezo.map(mintaVissza) : ms.nevezo,
    ertek: ms.ertek && typeof ms.ertek === 'object'
      ? Object.fromEntries(Object.entries(ms.ertek).map(([n, l]) => [n, Array.isArray(l) ? l.map(mintaVissza) : l])) : ms.ertek
  });

  const j = esemenye(cs.javaslat);
  if (j?.tipus !== 'Javaslat' || j.adat?.fajta !== 'altalanos') return hiba('nem általános javaslat');
  if (!(await esemenyEllenorzese(j)).rendben) return hiba('a javaslat nem hiteles');

  const entitasok = javaslatEntitasai(j).filter((je) => je.resz).map((je) => je.resz.entitas);
  if (cs.reszek.length !== entitasok.length) return hiba('nem minden érintett része van meg');
  let elfogadva = true;
  let lezaras = 0;
  let ellenorzott = 0;
  let nemEllenorizheto = 0;
  for (const entitas of entitasok) {
    const r = cs.reszek.find((x) => x?.osszegzes?.entitas === entitas);
    if (!r) return hiba('hiányzik egy rész összegzése');
    // ⛔ a helyeket MI számoljuk — a csomag nem mondhatja meg, hol nézzünk
    const v = await lezarasiOsszegzesEllenorzese({ osszegzes: r.osszegzes, javaslatEsemeny: j, helyek: onalloMintaHelyek(r.osszegzes),
      mintak: mintakVissza(r.mintak), ...(tagE ? { tagE } : {}), ...(alapKuszobok ? { alapKuszobok } : {}) });
    if (!v.rendben) return hiba('egy rész: ' + v.ok);
    if (!v.allas?.kuszobTeljesul) elfogadva = false;
    lezaras = Math.max(lezaras, r.osszegzes.lezaras);
    ellenorzott += v.ellenorzott;
    nemEllenorizheto += v.nemEllenorizheto;
  }

  const szerzok = new Set();
  for (const az of cs.allasfoglalasok) {
    const a = esemenye(az);
    if (a?.tipus !== 'Allasfoglalas' || a.adat?.egyezmeny !== j.azonosito) return hiba('idegen állásfoglalás');
    if (szerzok.has(a.szerzo)) return hiba('egy e-embertől két állásfoglalás');
    szerzok.add(a.szerzo);
    if (!(await esemenyEllenorzese(a)).rendben) return hiba('az állásfoglalás nem hiteles');
  }
  return { rendben: true, elfogadva, lezaras, ellenorzott, nemEllenorizheto };
}
