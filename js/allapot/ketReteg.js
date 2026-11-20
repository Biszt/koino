// js/allapot/ketReteg.js

// Felelősség: ⭐⭐ D118 (a bekapcsolódás ③, 2026-10-24) — A KOINO KÉPE KÉT RÉTEGBEN: a múlt az ős szabályaival, a jelen a
// koinoéval.
//
// A számítás három fázis (`allapotSzamitasa` → `javaslatokSzamitasa` → `szerkesztesiEgyezmenyekAlkalmazasa`). Egy
// szülőre épülő koinonál a bemenet (a koino-szabály szerint — `koinoLanc.js`, ②b) az ősök vágás előtti eseményeit is
// hordozza; ez a modul két rétegre bontja:
//
//   · A MÚLT (a talaj): nemzedékenként, a gyökértől lefelé — az ős eseményei az ŐS szabályaival (a születéséből), a vágás
//     pillanatára számolva, és az ős saját múltjával (rekurzívan). Ebből a gyermekbe a LEZÁRT döntések kerülnek át,
//     rögzítve (D118/3: mindenki szavazatával, a szülő küszöbeivel — nem fordulhatnak meg).
//   · A JELEN: a koino saját eseményei, és az ősökéből a szerkezet (mindenkié) és a súly (csak a bekapcsolódóké, a
//     lánc-pontjukig — `jelenbenSzamit`), a koino szabályaival; a D14 itt ítél.
//   · A VÉGREHAJTÁS: a múlt rögzített és a jelen elfogadott egyezményei egy sorban (a lejárat szerint, ugyanazzal a kóddal) —
//     az entitások a vágáskori alakjukat kapják, és a jelen változásai arra épülnek.
//
// ⭐ Szülő nélküli koinonál (és a régi alaknál) a kép UGYANAZ, mint eddig: a bemenet egyetlen réteg.
//
// ⚠️ A múlt nem változik, csak bővül (a csere hozza a késve érkezőt) — a múlt képe gyorsítótárban, a bemenete szerint.
//
// Hálózatot és tárat nem érint — a bemenet egy esemény-lista. Használják: `koino.js` (`kepetKeszit`), `allapot/pakli.js`.

import { allapotSzamitasa, koinonPontokRa } from './allapotSzamitas.js';
import { javaslatokSzamitasa } from './javaslatSzamitas.js';
import { szerkesztesiEgyezmenyekAlkalmazasa } from './szerkesztesiVegrehajtas.js';
import { lancBekapcsolodoi, jelenbenSzamit, lancbanVan } from './koinoLanc.js';
import { javaslatEntitasai } from './szabalyok.js';
import { esemenyKoinoja, azonositoAlaku, koinoSzuleteseE, lancKulcsa } from '../esemeny/esemeny.js';
import { lenyomatSzinkron } from '../esemeny/kanonikusAlak.js';

// ===================================
// A SZÜLETÉSEK LÁNCA A BEMENETBŐL
// ===================================

/**
 * A koino születéseinek lánca a bemenetből (a gyermektől a gyökér felé) — a bemenet a koino-szabály szerint a lánc
 * születéseit is hordozza (②b). Ahol egy születés hiányzik, ott véget ér.
 * @param {Array<Object>} esemenyek
 * @param {string} koino
 * @returns {Array<Object>}
 */
export function lancBemenetbol(esemenyek, koino) {
  const szuletesek = new Map();
  for (const e of esemenyek) {
    if (e?.tipus === 'KoinoLetrehozas' && e.koino === '' && azonositoAlaku(e.azonosito)) szuletesek.set(e.azonosito, e);
  }
  const lanc = [];
  const lattuk = new Set();
  let nev = koino;
  while (azonositoAlaku(nev) && !lattuk.has(nev)) {
    lattuk.add(nev);
    const e = szuletesek.get(nev);
    if (!e || !koinoSzuleteseE(e, nev)) break;
    lanc.push(e);
    nev = typeof e.adat?.szulo === 'string' ? e.adat.szulo : null;
  }
  return lanc;
}

// ===================================
// A KÉP
// ===================================

/**
 * ⭐⭐ A KOINO KÉPE — a három fázis, szülőre épülő koinonál két rétegben.
 * @param {Array<Object>} esemenyek - a koino bemenete (a koino-szabály szerint — `koinoBemenete`)
 * @param {Object} beallitas
 * @param {string} [beallitas.koino] - a koino neve (ha nincs, egy réteg)
 * @param {number} [beallitas.most]
 * @param {Map} [beallitas.osszegzesek] - a jelen réteg ellenőrzött lezárási összegzései (D95/1)
 * @param {Set<string>} [beallitas.csakAtmeneti] - a D14 kivétele (B/2)
 * @param {Function} [beallitas.nemTartott] - a D14 kivétele (D97)
 * @param {Map<string, number>} [beallitas.bekapcsolodok] - a legfelső bekapcsolódás további bekapcsolódói — lánc (⭐⭐ D128: készülék) → pont (a ③ próbáinak; a ④-ig)
 * @returns {Promise<{allapot: Object, javaslatok: Map, mult: Object|null}>} a `mult`: a szülő vágáskori képe (ha van)
 */
export async function koinoKepe(esemenyek, beallitas = {}) {
  const koino = beallitas.koino ?? null;
  const most = beallitas.most ?? Date.now();
  const lanc = koino ? lancBemenetbol(esemenyek, koino) : [];
  if (lanc.length < 2) return { ...(await haromFazis(esemenyek, koino, most, beallitas, null)), mult: null };
  // ⭐ A bekapcsolódók nemzedékenként: a létrehozó (a születésével) és a bekapcsolódók (a bemenet bekapcsolódásaiból — ④a).
  const bekapcsolodok = lancBekapcsolodoi(lanc, beallitas.bekapcsolodok instanceof Map ? beallitas.bekapcsolodok : null, esemenyek);
  return nemzedekKepe(esemenyek, lanc, bekapcsolodok, 0, most, beallitas);
}

/** A `lanc[i]` koino képe `most`-kor: a múltja (ha van) a vágásakor, rögzítve; a jelene. */
async function nemzedekKepe(esemenyek, lanc, bekapcsolodok, i, most, beallitas) {
  let mult = null;
  let rogzitettek = null;
  if (i + 1 < lanc.length) {
    mult = await multKepe(esemenyek, lanc, bekapcsolodok, i + 1, lanc[i].ido, beallitas);
    // ⭐ A vágáskor LEZÁRT döntések (elfogadva, elvetve, nem ismert) — a folyamatban lévők a jelenben folytatódnak, ha a
    // javaslattevő bekapcsolódott (KZ6 (A): a nem bekapcsolódóé nem — a javaslata nincs a jelen bemenetében).
    rogzitettek = new Map([...mult.javaslatok].filter(([, j]) => j.statusz !== 'folyamatban'));
  }
  const bemenet = esemenyek.filter((e) => jelenbenSzamit(e, lanc, i, bekapcsolodok));
  // ⭐⭐ D118 (⑤b): a szerzők LÁNCA ebben a nemzedékben (`lancbanVan`) — a láncon kívüli ős-esemény (a nem bekapcsolódó múltja) külön
  // ág: nem elágazás és nem idő-visszalépés a gyermekbeli láncához képest; és a láncon lévő, de a jelenből kizárt esemény (a
  // tagsági csomag, az ős születése, az elhagyott pont) ismert sorszám, nem hézag — különben a bekapcsolódó hazug bemondása csak
  // jelzés volna (mérve).
  // ⭐⭐ D128: a lánc a készüléké (`lancKulcsa`).
  const lancAga = (e) => (lancbanVan(e, lanc, i, bekapcsolodok) ? lancKulcsa(e) : lancKulcsa(e) + '|' + esemenyKoinoja(e));
  const ismertSorszamok = new Map();
  // ⭐ D119 (A): az elhagyott pont (a láncon van, a jelenből kizárt) entitása — a D14 ítélhet róla (a bekapcsolódó 0-t hoz rá).
  const elhagyottPontok = new Set();
  for (const e of esemenyek) {
    if (!lancbanVan(e, lanc, i, bekapcsolodok) || jelenbenSzamit(e, lanc, i, bekapcsolodok)) continue;
    if (!ismertSorszamok.has(lancKulcsa(e))) ismertSorszamok.set(lancKulcsa(e), new Set());
    ismertSorszamok.get(lancKulcsa(e)).add(e.sorszam);
    if (e.tipus === 'TudatpontRendezes' && azonositoAlaku(e.adat?.entitas)) elhagyottPontok.add(e.adat.entitas);
  }
  const kep = await haromFazis(bemenet, lanc[i].azonosito, most, { ...beallitas, lancAga, ismertSorszamok, elhagyottPontok },
    rogzitettek);
  return { ...kep, mult };
}

// A múlt képei: kulcs → kép (a bemenet lenyomata szerint — a múlt csak bővül, és akkor új a kulcs).
const multGyorsitotar = new Map();
const MULT_EMLEK = 8;

/** Egy ős (`lanc[i]`) képe a vágáskor (`vagas`) — gyorsítótárból, ha a múlt bemenete azóta nem változott. */
async function multKepe(esemenyek, lanc, bekapcsolodok, i, vagas, beallitas) {
  const nevek = new Set(lanc.slice(i).map((sz) => sz.azonosito));
  const azonositok = esemenyek.filter((e) => nevek.has(esemenyKoinoja(e))).map((e) => e.azonosito).sort();
  const kulcs = lanc[i].azonosito + '|' + vagas + '|' + lenyomatSzinkron(azonositok);
  const kesz = multGyorsitotar.get(kulcs);
  if (kesz) return kesz;
  const kep = await nemzedekKepe(esemenyek, lanc, bekapcsolodok, i, vagas, { csakAtmeneti: beallitas.csakAtmeneti,
    nemTartott: beallitas.nemTartott });
  if (multGyorsitotar.size >= MULT_EMLEK) multGyorsitotar.delete(multGyorsitotar.keys().next().value);
  multGyorsitotar.set(kulcs, kep);
  return kep;
}

/**
 * ⭐⭐ D130 (①, KO1 (A)): az elfogadott ÁLTALÁNOS egyezmények entitásai (a javaslaté — több érintettnél a töredékeké). A múlt
 * rögzített döntései is (a `rogzitettek` másolatai a döntések közt állnak). Ha a javaslat eseménye nincs a számítók közt, az
 * azonosítója maga.
 * @param {Map<string, Object>} javaslatok - a második fázis döntései
 * @param {Array<Object>} szamitok - az első fázis számító eseményei
 * @returns {Set<string>}
 */
function koinonosEgyezmenyek(javaslatok, szamitok) {
  const ki = new Set();
  let esemenyek = null;
  for (const [az, j] of javaslatok) {
    if (j.fajta !== 'altalanos' || j.statusz !== 'elfogadva') continue;
    esemenyek ??= new Map(szamitok.filter((e) => e.tipus === 'Javaslat').map((e) => [e.azonosito, e]));
    const e = esemenyek.get(az);
    for (const x of e ? javaslatEntitasai(e) : [{ azonosito: az }]) ki.add(x.azonosito);
  }
  return ki;
}

/**
 * A három fázis egy rétegen — és KÖZTÜK a koinon pontja az elfogadott általános egyezményeken (D130 ①).
 *
 * ⚠️ A SORREND CSAPDÁJA: a D14 (a 0 pontú entitás elfelejtése) az ELSŐ fázisban fut, a döntés a MÁSODIKBAN — a koinon pontja
 * pedig a döntésből következik. Ha egy elfogadott általános egyezményről mindenki levette a pontját, az első fázis már elfelejtette
 * (és a gyerekeit a felmenőjéhez tette). ⭐ Ilyenkor az első két fázis ÚJRA fut, a halmazzal (`koinonEgyezmenyek` — a pontja a D14
 * előtt kerül rá): az egyezmény a helyén marad, a gyerekeivel. A döntések ugyanazok (a koinon nem szavaz, a nevezőbe nem számít,
 * a lezárt döntés a lezárásakor rögzült). Ha egyiket sem felejtette el, a pont helyben kerül rá (ugyanazzal a függvénnyel) —
 * kétszeres számolás csak a ritka esetben.
 */
export async function haromFazis(bemenet, koino, most, beallitas = {}, rogzitettek = null) {
  const allapotBeallitas = {
    ...(koino ? { koino } : {}),
    ...(beallitas.csakAtmeneti ? { csakAtmeneti: beallitas.csakAtmeneti } : {}),
    ...(beallitas.nemTartott ? { nemTartott: beallitas.nemTartott } : {}),
    ...(beallitas.lancAga ? { lancAga: beallitas.lancAga, ismertSorszamok: beallitas.ismertSorszamok } : {}),
    ...(beallitas.elhagyottPontok?.size ? { elhagyottPontok: beallitas.elhagyottPontok } : {})
  };
  const dontesBeallitas = {
    ...(beallitas.osszegzesek ? { osszegzesek: beallitas.osszegzesek } : {}),
    ...(rogzitettek ? { rogzitettek } : {})
  };
  let allapot = allapotSzamitasa(bemenet, allapotBeallitas);
  let javaslatok = javaslatokSzamitasa(allapot.szamitok, allapot, most, dontesBeallitas);
  // ----- ⭐⭐ D130 (①): A KOINON PONTJA -----
  const koinonos = koinonosEgyezmenyek(javaslatok, allapot.szamitok);
  if (koinonos.size) {
    const elfelejtett = new Set(allapot.elfelejtettek);
    if ([...koinonos].some((az) => elfelejtett.has(az))) {
      allapot = allapotSzamitasa(bemenet, { ...allapotBeallitas, koinonEgyezmenyek: koinonos });
      javaslatok = javaslatokSzamitasa(allapot.szamitok, allapot, most, dontesBeallitas);
    } else {
      koinonPontokRa(allapot.entitasok, koinonos);
    }
  }
  await szerkesztesiEgyezmenyekAlkalmazasa(allapot, javaslatok);
  return { allapot, javaslatok };
}
