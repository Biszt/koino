// js/allapot/kezelesTerjesztes.js

// Felelősség: ⭐⭐ D128 (③b — 9.12): AZ AZONOSSÁG KEZELÉSE MINDEN KOINOMBA — HELYBEN.
//
// ===== MIÉRT =====
//
// A kizárás és a kulcscsere egy-egy koinoba bevitt ESEMÉNY (`Kizaras`, `Kulcscsere`): egy másik koino csak akkor tud róla, ha ott is
// bekerül. ⛔ A ③ előtt egy kulcscsere csak abba a koinoba jutott, ahol a parancsot kiadták — a többiben a tolvaj által felvett
// készülék tovább számított, egy kizárást pedig kézzel kellett volna koinonként bevinni.
//
// ===== A KEZELÉS-JEGYZÉK =====
//
// A készülék egy HELYI feljegyzésben (`kezeles.json` — nem esemény, nem terjed; mint a társ-lista) gyűjti, amit az azonossága
// kezeléséről BÁRHOL lát: a legerősebb kulcscsere-láncot (a születésével és a benne álló helyreállítások bizonyítékaival) és a
// kizárásokat. Minden koinojában, ahol az azonosságnak szelete van, beviszi, ami onnan hiányzik — a parancsok elején és az őrjárat
// minden körében (az éppen futó koinoba), a kezelő parancsok után (a kulcscsere, a kizárás, a papír visszavonása, a helyreállítás
// befejezése) minden koinojába. Két koino így a készüléken át ér egyet: amit az egyikben lát, azt a másikba is beviszi.
//
// ⭐ A jegyzék csak GYORSÍTÓTÁR: a kapu minden bevitt eseményt újra ellenőriz (a lánc aláírásait, a bizonyítékokat, a kizárás
// aláírását) — egy átírt jegyzék nem visz be hamisat, legfeljebb a kapu elveti. Egy sérült vagy idegen fájlból üres jegyzék lesz
// (D19 — a hiány nem hiba): a tárakból újra összegyűlik.
//
// ⭐⭐ D128 (③f — KH3 (A)): a jegyzék megjegyzi, mely kizárásokat adta ki EZ a készülék (`sajat` — az aláírásuk): a kulcscsere után csak
// ezeket írja alá újra az új kulccsal. ⛔ A más készülékről gyűjtötteket nem — egy tolvaj régi kulccsal aláírt kizárása így nem lesz
// érvényes.
//
// ⭐ Amit a kapu elvetett (pl. ezt a készüléket a kulcscsere nem sorolta fel — az eseményét a koino már nem fogadja), azt egy napig
// nem próbáljuk újra abban a koinoban (`elvetve`): különben minden parancs elején ugyanaz a hiba szólna.
//
// Használják: muveletek.js (`kezelesGondozasa`), koino.js (a parancsok eleje, az őrjárat köre, a kezelő parancsok), a próbák.

import { lancErosebbE, lancBejegyzesAlakiHibaja, bejegyzesJele, szuletesAlakiHibaja, KULCSCSERE_KORLAT,
  HELYREALLITAS_BEJEGYZES } from '../kulcs/azonossag.js';
import { kizarasAlakiHibaja } from '../kulcs/keszulek.js';

/** A jegyzék fájljának fajtája. */
export const KEZELES_JEGYZEK = 'koino-kezeles';

/** Egy jegyzék legfeljebb ennyi kizárást őriz (egy ember készülékei — a legrégebbi esik ki). */
export const JEGYZEK_KIZARAS_KORLAT = 64;

/** Ennyi ideig nem próbáljuk újra, amit egy koino kapuja elvetett. */
export const ELVETVE_SZUNET = 24 * 3600 * 1000;

/** Ennyi idő után az elvetés feljegyzése elévül (a jegyzék nem nő a végtelenig). */
const ELVETVE_ELEVULES = 7 * 24 * 3600 * 1000;

/** Egy üres jegyzék az azonosságnak. */
export function ujKezelesJegyzek(azonossag) {
  return { mi: KEZELES_JEGYZEK, valtozat: 1, azonossag, lanc: null, kizarasok: [], sajat: [], elvetve: {} };
}

/** A lánc helyreállításainak jelei (azokhoz kell bizonyíték). */
function helyreallitasJelei(cserek) {
  return (cserek ?? []).filter((c) => c?.tipus === HELYREALLITAS_BEJEGYZES).map((c) => c.jel);
}

/** Egy jegyzékbeli lánc alakja: a születés, 1–16 bejegyzés (ennek az azonosságnak), a bizonyítékok objektuma. */
function lancAlakiHibaja(l, azonossag) {
  if (!l || typeof l !== 'object' || Array.isArray(l)) return 'a lánc egy objektum';
  if (szuletesAlakiHibaja(l.szuletes)) return 'a lánc születése hibás';
  if (!Array.isArray(l.cserek) || !l.cserek.length || l.cserek.length > KULCSCSERE_KORLAT) return 'a lánc 1–16 bejegyzés';
  if (l.cserek.some((c) => lancBejegyzesAlakiHibaja(c))) return 'a lánc egy bejegyzése hibás';
  if (l.cserek[0].azonossag !== azonossag) return 'a lánc egy másik azonosságé';
  if (!l.bizonyitekok || typeof l.bizonyitekok !== 'object' || Array.isArray(l.bizonyitekok)) return 'a bizonyítékok egy objektum';
  return null;
}

/** Ugyanaz-e a két lánc (a bejegyzéseik jelei szerint). */
function ugyanazALanc(a, b) {
  return a.length === b.length && a.every((c, i) => bejegyzesJele(c) === bejegyzesJele(b[i]));
}

/**
 * A jegyzék a tárolt leírásból — egy sérült, régi vagy MÁSIK azonosságé helyett üres (a tárakból újra összegyűlik).
 * @param {Object|null} leiras - a `kezeles.json` tartalma
 * @param {string} azonossag - az azonosságom neve
 * @returns {Object} jegyzék
 */
export function kezelesJegyzekBetoltese(leiras, azonossag) {
  if (!leiras || leiras.mi !== KEZELES_JEGYZEK || leiras.azonossag !== azonossag) return ujKezelesJegyzek(azonossag);
  const lanc = leiras.lanc && !lancAlakiHibaja(leiras.lanc, azonossag) ? leiras.lanc : null;
  const kizarasok = (Array.isArray(leiras.kizarasok) ? leiras.kizarasok : [])
    .filter((k) => !kizarasAlakiHibaja(k) && k.azonossag === azonossag).slice(-JEGYZEK_KIZARAS_KORLAT);
  const elvetve = {};
  if (leiras.elvetve && typeof leiras.elvetve === 'object' && !Array.isArray(leiras.elvetve)) {
    for (const [koino, jelek] of Object.entries(leiras.elvetve)) {
      if (!jelek || typeof jelek !== 'object' || Array.isArray(jelek)) continue;
      const tiszta = Object.fromEntries(Object.entries(jelek).filter(([, ido]) => Number.isSafeInteger(ido)));
      if (Object.keys(tiszta).length) elvetve[koino] = tiszta;
    }
  }
  const bent = new Set(kizarasok.map((k) => k.alairas));
  const sajat = (Array.isArray(leiras.sajat) ? leiras.sajat : []).filter((a) => typeof a === 'string' && bent.has(a));
  return { ...ujKezelesJegyzek(azonossag), lanc, kizarasok, sajat, elvetve };
}

/**
 * Amit egy TÁR tud az azonosság kezeléséről: a `Kulcscsere` események láncai közül a legerősebb (`lancErosebbE` — nem a hosszabb),
 * a születésével és a benne álló helyreállítások bizonyítékaival (amelyik esemény hozta), és a kizárások (aláírásonként egyszer).
 * ⚠️ A tárban lévőt hiszi el — oda csak kapun át kerül esemény.
 * @param {Object} tar
 * @param {string} azonossag
 * @returns {Promise<{lanc: {szuletes: Object, cserek: Array<Object>, bizonyitekok: Object}|null, kizarasok: Array<Object>}>}
 */
export async function tarKezelese(tar, azonossag) {
  const esemenyek = typeof tar?.kezelesEsemenyei === 'function' ? await tar.kezelesEsemenyei(azonossag)
    : (typeof tar?.betolt === 'function' ? await tar.betolt() : []);
  let lanc = null;
  const bizonyitekok = {};
  const kizarasok = new Map();
  for (const e of esemenyek ?? []) {
    if (e?.tipus === 'Kulcscsere') {
      const cs = e.adat?.cserek;
      if (!Array.isArray(cs) || !cs.length || cs.some((c) => lancBejegyzesAlakiHibaja(c)) || cs[0].azonossag !== azonossag) continue;
      for (const [jel, b] of Object.entries(e.adat?.bizonyitekok ?? {})) bizonyitekok[jel] ??= b;
      if (!lanc || lancErosebbE(cs, lanc.cserek)) lanc = { szuletes: e.adat.szuletes, cserek: cs };
    } else if (e?.tipus === 'Kizaras') {
      const k = e.adat?.kizaras;
      if (!kizarasAlakiHibaja(k) && k.azonossag === azonossag && !kizarasok.has(k.alairas)) kizarasok.set(k.alairas, k);
    }
  }
  if (lanc) {
    lanc.bizonyitekok = {};
    for (const jel of helyreallitasJelei(lanc.cserek)) if (bizonyitekok[jel]) lanc.bizonyitekok[jel] = bizonyitekok[jel];
  }
  return { lanc, kizarasok: [...kizarasok.values()] };
}

/**
 * A JEGYZÉKBE veszi, amit egy tár (vagy a saját kulcsfájlom) tud: az erősebb lánc felváltja a mostanit (ugyanannak a láncnak a
 * hiányzó bizonyítékai kiegészülnek); az új kizárások hozzájönnek. Tiszta függvény.
 * @param {Object} jegyzek
 * @param {{lanc?: Object|null, kizarasok?: Array<Object>}} tudas
 * @returns {{jegyzek: Object, valtozott: boolean}}
 */
export function jegyzekbe(jegyzek, { lanc = null, kizarasok = [], sajatKizarasok = [] } = {}) {
  const az = jegyzek.azonossag;
  let ujLanc = jegyzek.lanc;
  let valtozott = false;
  const hozott = lanc ? { ...lanc, bizonyitekok: lanc.bizonyitekok ?? {} } : null;
  if (hozott && !lancAlakiHibaja(hozott, az)) {
    const kell = helyreallitasJelei(hozott.cserek);
    const sajat = (bizonyitekok) => Object.fromEntries(kell.filter((j) => bizonyitekok?.[j]).map((j) => [j, bizonyitekok[j]]));
    if (!ujLanc || lancErosebbE(hozott.cserek, ujLanc.cserek)) {
      ujLanc = { szuletes: hozott.szuletes, cserek: hozott.cserek, bizonyitekok: sajat(hozott.bizonyitekok) };
      valtozott = true;
    } else if (ugyanazALanc(hozott.cserek, ujLanc.cserek)) {
      const hianyzok = kell.filter((j) => !ujLanc.bizonyitekok[j] && hozott.bizonyitekok[j]);
      if (hianyzok.length) {
        ujLanc = { ...ujLanc, bizonyitekok: { ...ujLanc.bizonyitekok, ...Object.fromEntries(hianyzok.map((j) => [j, hozott.bizonyitekok[j]])) } };
        valtozott = true;
      }
    }
  }
  const ismert = new Set(jegyzek.kizarasok.map((k) => k.alairas));
  const ujKizarasok = [...jegyzek.kizarasok];
  for (const k of kizarasok ?? []) {
    if (kizarasAlakiHibaja(k) || k.azonossag !== az || ismert.has(k.alairas)) continue;
    ismert.add(k.alairas);
    ujKizarasok.push(k);
    valtozott = true;
  }
  // ⭐⭐ (③f) az itt kiadott kizárások aláírásai (csak ami a jegyzékben van)
  const vegso = ujKizarasok.slice(-JEGYZEK_KIZARAS_KORLAT);
  const bent = new Set(vegso.map((k) => k.alairas));
  const sajat = [...new Set([...(jegyzek.sajat ?? []), ...(sajatKizarasok ?? [])])].filter((a) => bent.has(a));
  if (sajat.length !== (jegyzek.sajat ?? []).length) valtozott = true;
  return { jegyzek: { ...jegyzek, lanc: ujLanc, kizarasok: vegso, sajat }, valtozott };
}

/** Egy jegyzékbeli tétel jele (az elvetés feljegyzéséhez): a láncé az utolsó bejegyzés jele, a kizárásé az aláírása. */
export function lancJele(lanc) {
  return bejegyzesJele(lanc.cserek[lanc.cserek.length - 1]);
}

/** Elvetette-e a koino kapuja nemrég (az `ELVETVE_SZUNET`-en belül)? */
function nemregElvetve(jegyzek, koino, jel, most) {
  const ido = jegyzek.elvetve?.[koino]?.[jel];
  return Number.isSafeInteger(ido) && most - ido < ELVETVE_SZUNET;
}

/**
 * Ami a jegyzékből EBBŐL A TÁRBÓL HIÁNYZIK: a lánc, ha erősebb a tárban lévőnél (és minden helyreállításához van bizonyíték — anélkül a
 * kapu nem ellenőrizhetné), és a kizárások, amelyek nincsenek a tárban. Amit a koino kapuja nemrég elvetett, az nem hiányzik.
 * @param {{lanc: Object|null, kizarasok: Array<Object>}} tarnal - `tarKezelese`
 * @param {Object} jegyzek
 * @param {string} koino
 * @param {number} [most]
 * @returns {{lanc: Object|null, kizarasok: Array<Object>, bizonyitekNelkul: boolean}}
 */
export function kezelesHianyai(tarnal, jegyzek, koino, most = Date.now()) {
  let lanc = null;
  let bizonyitekNelkul = false;
  const l = jegyzek.lanc;
  if (l && (!tarnal.lanc || lancErosebbE(l.cserek, tarnal.lanc.cserek)) && !nemregElvetve(jegyzek, koino, lancJele(l), most)) {
    if (helyreallitasJelei(l.cserek).every((j) => l.bizonyitekok[j])) lanc = l;
    else bizonyitekNelkul = true;
  }
  const megvan = new Set(tarnal.kizarasok.map((k) => k.alairas));
  const kizarasok = jegyzek.kizarasok.filter((k) => !megvan.has(k.alairas) && !nemregElvetve(jegyzek, koino, k.alairas, most));
  return { lanc, kizarasok, bizonyitekNelkul };
}

/**
 * Az elvetés feljegyzése (a koino kapuja nem fogadta) — és a régi feljegyzések elévülése. Tiszta függvény.
 * @returns {Object} jegyzék
 */
export function elvetesFeljegyzese(jegyzek, koino, jelek, most = Date.now()) {
  const elvetve = {};
  for (const [k, m] of Object.entries(jegyzek.elvetve ?? {})) {
    const friss = Object.fromEntries(Object.entries(m).filter(([, ido]) => most - ido < ELVETVE_ELEVULES));
    if (Object.keys(friss).length) elvetve[k] = friss;
  }
  if (jelek.length) elvetve[koino] = { ...(elvetve[koino] ?? {}), ...Object.fromEntries(jelek.map((j) => [j, most])) };
  return { ...jegyzek, elvetve };
}

/** A Kulcscsere esemény bizonyítékai: pontosan a lánc helyreállításaié (az esemény alakja ezt kívánja), vagy null, ha nincs. */
export function lancBizonyitekai(lanc) {
  const jelek = helyreallitasJelei(lanc.cserek);
  return jelek.length ? Object.fromEntries(jelek.map((j) => [j, lanc.bizonyitekok[j]])) : null;
}
