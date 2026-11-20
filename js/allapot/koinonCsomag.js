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
  return tomorAlakEllenorzese({ javaslatAz: cs.javaslat, reszek: cs.reszek, allasfoglalasok: cs.allasfoglalasok,
    esemenye: async (az) => esemenye(az), tagE, alapKuszobok });
}

/**
 * ⭐ AZ ELLENŐRZÉS MAGJA — a csomagé és az eseményé (`KoinonOsszegzes`) is ezt hívja; a különbség csak az, honnan jönnek a
 * hivatkozott események (`esemenye`: a csomag táblájából, vagy a tárból — mindkét esetben a kísérő tanúsítvánnyal).
 * @param {Object} b
 * @param {string} b.javaslatAz
 * @param {Array<Object>} b.reszek - `[{ osszegzes, mintak }]` (a mintákban az események azonosítói)
 * @param {Array<string>} b.allasfoglalasok - az állásfoglalások azonosítói
 * @param {Function} b.esemenye - async (azonosító) → az esemény (kísérővel) vagy null
 * @returns {Promise<Object>} `{ rendben, ok?, elfogadva, lezaras, ellenorzott, nemEllenorizheto, osszegzesek }`
 */
async function tomorAlakEllenorzese({ javaslatAz, reszek, allasfoglalasok, esemenye, tagE, alapKuszobok }) {
  const hiba = (ok) => ({ rendben: false, ok });
  if (!Array.isArray(reszek) || !Array.isArray(allasfoglalasok)) return hiba('nem tömör egyezmény-alak');
  const mintaVissza = async (m) => (m && m.esemeny !== undefined ? { ...m, esemeny: await esemenye(m.esemeny) } : m);
  const lista = async (l) => (Array.isArray(l) ? Promise.all(l.map(mintaVissza)) : l);
  const mintakVissza = async (ms) => (!ms || typeof ms !== 'object' ? ms : {
    szavazat: await lista(ms.szavazat), nevezo: await lista(ms.nevezo),
    ertek: ms.ertek && typeof ms.ertek === 'object'
      ? Object.fromEntries(await Promise.all(Object.entries(ms.ertek).map(async ([n, l]) => [n, await lista(l)]))) : ms.ertek
  });

  const j = await esemenye(javaslatAz);
  if (j?.tipus !== 'Javaslat' || j.adat?.fajta !== 'altalanos') return hiba('nem általános javaslat');
  if (!(await esemenyEllenorzese(j)).rendben) return hiba('a javaslat nem hiteles');

  const entitasok = javaslatEntitasai(j).filter((je) => je.resz).map((je) => je.resz.entitas);
  if (reszek.length !== entitasok.length) return hiba('nem minden érintett része van meg');
  let elfogadva = true;
  let lezaras = 0;
  let ellenorzott = 0;
  let nemEllenorizheto = 0;
  const osszegzesek = [];
  for (const entitas of entitasok) {
    const r = reszek.find((x) => x?.osszegzes?.entitas === entitas);
    if (!r) return hiba('hiányzik egy rész összegzése');
    // ⛔ a helyeket MI számoljuk — a csomag nem mondhatja meg, hol nézzünk
    const v = await lezarasiOsszegzesEllenorzese({ osszegzes: r.osszegzes, javaslatEsemeny: j, helyek: onalloMintaHelyek(r.osszegzes),
      mintak: await mintakVissza(r.mintak), ...(tagE ? { tagE } : {}), ...(alapKuszobok ? { alapKuszobok } : {}) });
    if (!v.rendben) return hiba('egy rész: ' + v.ok);
    if (!v.allas?.kuszobTeljesul) elfogadva = false;
    lezaras = Math.max(lezaras, r.osszegzes.lezaras);
    ellenorzott += v.ellenorzott;
    nemEllenorizheto += v.nemEllenorizheto;
    osszegzesek.push(r.osszegzes);
  }

  const szerzok = new Set();
  for (const az of allasfoglalasok) {
    const a = await esemenye(az);
    if (a?.tipus !== 'Allasfoglalas' || a.adat?.egyezmeny !== j.azonosito) return hiba('idegen állásfoglalás');
    if (szerzok.has(a.szerzo)) return hiba('egy e-embertől két állásfoglalás');
    szerzok.add(a.szerzo);
    if (!(await esemenyEllenorzese(a)).rendben) return hiba('az állásfoglalás nem hiteles');
  }
  return { rendben: true, elfogadva, lezaras, ellenorzott, nemEllenorizheto, osszegzesek };
}

// ===================================
// ⭐⭐ D130 (③a, KO7 (A)): A DÖNTÉS TÖMÖR ALAKJA EGY ALÁÍRT ESEMÉNYBEN — `KoinonOsszegzes`
// ===================================
//
// Csaba (2026-11-20, KO7 (A)): a lezárási összegzés nem esemény — a darab tartójához egy aláírt eseményben jut el, a meglévő
// csere-úton (a kapu az ismeretlen típust nem tiltja: a régi program átengedi, csak nem érti — nem protokoll-törés). Az esemény a
// csomag DÖNTÉS-része: a javaslat azonosítója és a részek (az összegzések és a mintáik — az események azonosítóival). ⛔ Az
// állásfoglalások NEM kerülnek bele: a hatály ÉL (D27) — azok külön események, a darab hordja őket, és mindig a legutóbbi számít. A
// hivatkozott események (a javaslat, a minták) a tárban vannak (a darab szeletében utaznak), a kísérővel.
// ⭐ Az aláíró nem kap bizalmat (a tartalmát a minták igazolják); KO8 (A): bárki írhatja, aki a teljes bemenetet tartja.

/** Az esemény típusa. */
export const KOINON_OSSZEGZES = 'KoinonOsszegzes';

/** Egy rész legfeljebb ennyi lehet egy eseményben (a javaslat érintettjeinek korlátja — a szavazat bizonyítéka is ennyi). */
export const KOINON_OSSZEGZES_RESZ_KORLAT = 64;

/**
 * A `KoinonOsszegzes` esemény adata a csomagból (a döntés-rész — az állásfoglalások nélkül).
 * @param {Object} cs - a `koinonCsomagEpitese` csomagja
 * @returns {{javaslat: string, reszek: Array<Object>}}
 */
export function koinonOsszegzesAdata(cs) {
  return { javaslat: cs.javaslat, reszek: cs.reszek };
}

/**
 * A `KoinonOsszegzes` esemény ellenőrzése — a hivatkozott eseményekkel a tárból (az olvasó a kísérőt adja). ⚠️ Az esemény
 * aláírását a kapu nézi (a tárba csak hiteles kerül); itt a TARTALMA: a javaslat hiteles általános javaslat, minden érintettjéről
 * van összegzés, és az a saját lenyomatából számolt helyeken vett mintákkal igaz. Az állásfoglalásokat nem nézi (azok külön élnek).
 * @param {Object} e - az esemény
 * @param {Function} esemenyOlvas - async (azonosító) → esemény (kísérővel) vagy null
 * @param {Object} [b] - `{ tagE, alapKuszobok }`
 * @returns {Promise<Object>} mint a csomagé; `osszegzesek`: az ellenőrzött lezárási összegzések (a D95/1 útjára)
 */
export async function koinonOsszegzesEllenorzese(e, esemenyOlvas, { tagE, alapKuszobok } = {}) {
  const a = e?.adat;
  if (e?.tipus !== KOINON_OSSZEGZES || !a || typeof a.javaslat !== 'string' || !Array.isArray(a.reszek)
      || !a.reszek.length || a.reszek.length > KOINON_OSSZEGZES_RESZ_KORLAT) {
    return { rendben: false, ok: 'nem a döntés tömör alakja' };
  }
  if (e.entitas !== a.javaslat) return { rendben: false, ok: 'nem a javaslat szeletében él' };
  return tomorAlakEllenorzese({ javaslatAz: a.javaslat, reszek: a.reszek, allasfoglalasok: [],
    esemenye: async (az) => (typeof az === 'string' ? (await esemenyOlvas(az)) ?? null : null), tagE, alapKuszobok });
}
