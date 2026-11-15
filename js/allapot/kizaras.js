// js/allapot/kizaras.js

// Felelősség: ⭐⭐ D128 (①d — KU7 (A), 8.2, 9.10): A KIZÁRT KÉSZÜLÉK ESEMÉNYEI — melyik esemény nem számít, mert a készülékét
// az azonosság kizárta.
//
// ===== A SZABÁLY =====
//
// A kizárás-tanúsítványt (`kulcs/keszulek.js` — az azonosság kulcsa írja alá) egy `Kizaras` esemény hozza a koinóba: a
// felsorolt koinókba az örökös írja, és BÁRKI beviheti, akihez eljutott (a tartalma önmagát igazolja — mint az ellentmondás
// bizonyítéka, D80). Ahol megvan, ott a KIZÁRT kulccsal aláírt események a vágás UTÁN nem számítanak — a fel nem sorolt
// koinóban egyik sem (a vágás 0). ⭐ Nem elágazások és nem vádak: egyszerűen nem a te eseményeid (8.2 — nem a szabály
// szigorítása, D47, hanem annak kimondása, hogy nem tőled jöttek). A vágás után a láncot az örökös folytatja (`lanc` mező —
// `esemeny.js`): az ő eseményeit az ő kulcsa írja alá, ezek számítanak.
//
// ⭐ Ha egy készülékről több kizárás is van, a LEGKÉSŐBBI számít (az idő, holtversenyben a nagyobb aláírás) — az azonosság
// utolsó állítása, mint máshol (9.5). ⛔ Egy kizárás csak a SAJÁT azonossága készülékét zárhatja ki: a tanúsítvány azonossága
// az esemény szerzője kell legyen.
//
// Használják: allapot/allapotSzamitas.js (a számítás eleje), tar/esemenyTar.js (a lánc vége, a kapu), allapot/lancGyoker.js
// (a saját lánc-gyökér), muveletek.js (a saját lánc), a próbák.

import { kizarasAlakiHibaja, kizarasKoinoban } from '../kulcs/keszulek.js';
import { kulcscsereAlakiHibaja } from '../kulcs/azonossag.js';
import { esemenyKoinoja } from '../esemeny/esemeny.js';

/** A kizárás eseménytípusa. */
export const KIZARAS_ESEMENY = 'Kizaras';

/** ⭐⭐ D128 (②b): a kulcscsere eseménytípusa — a születést és a cserék láncát hozza (bárki beviheti, mint a kizárást). */
export const KULCSCSERE_ESEMENY = 'Kulcscsere';

/** Későbbi-e az `a` kizárás, mint a `b` (az idő, holtversenyben a nagyobb aláírás)? */
function kesobbiKizaras(a, b) {
  if (a.ido !== b.ido) return a.ido > b.ido;
  return a.alairas > b.alairas;
}

/**
 * A kizárások az eseményekből: kizárt készülék → a (legkésőbbi) kizárás-tanúsítvány. ⚠️ Az aláírást a kapu ellenőrizte (a
 * számítás a tárban lévőt hiszi el, mint az esemény aláírását); itt csak az alak.
 * @param {Iterable<Object>} esemenyek
 * @returns {Map<string, Object>}
 */
export function kizarasokEsemenyekbol(esemenyek) {
  const ki = new Map();
  for (const e of esemenyek ?? []) {
    if (e?.tipus !== KIZARAS_ESEMENY) continue;
    const k = e.adat?.kizaras;
    if (kizarasAlakiHibaja(k)) continue;
    const eddigi = ki.get(k.keszulek);
    if (!eddigi || kesobbiKizaras(k, eddigi)) ki.set(k.keszulek, k);
  }
  return ki;
}

/**
 * Kizárt-e az esemény: a készüléke (az aláírója) ki van zárva az azonosságától, és az esemény a koinóbeli vágás után van.
 * @param {Object} e
 * @param {Map<string, Object>} kizarasok - `kizarasokEsemenyekbol`
 * @returns {boolean}
 */
export function kizartE(e, kizarasok) {
  if (!kizarasok?.size || !e || typeof e.keszulek !== 'string') return false;
  const k = kizarasok.get(e.keszulek);
  if (!k || k.azonossag !== e.szerzo) return false;
  return e.sorszam > kizarasKoinoban(k, esemenyKoinoja(e)).vagas;
}

// ===================================
// ⭐⭐ D128 (②b — 14. pont, KC2 (A)): A KULCSCSERE UTÁN
// ===================================
//
// A kulcscsere felsorolja a MEGMARADÓ készülékeket; minden más készülék, amit egy RÉGEBBI korszak kulcsa tanúsított (a tolvaj
// által a régi kulccsal felvett is), érvénytelen — az eseményei nem számítanak (mint a kizárt készüléké a fel nem sorolt koinóban:
// nem a szabály szigorítása, hanem annak kimondása, hogy nem tőled jöttek). A csere UTÁN, az új kulccsal tanúsított készülék
// korszaka a hozott cserék száma — az nem esik ki. ⚠️ Ha egy készülék korszaka nem ismert (a lánca első eseménye — a tanúsítvánnyal
// — nincs a bemenetben), az eseménye számít: a hiány nem vád (D19); a kapu az ilyen készülék ÚJ eseményeit a tárban lévő
// tanúsítványa szerint ítéli.

/**
 * Az azonosságok legutóbbi kulcscseréje az eseményekből: név → { korszak, marado } — a leghosszabb lánc (holtversenyben a kisebb
 * utolsó aláírás). ⚠️ A lánc aláírásait a kapu ellenőrizte; itt csak az alak.
 * @returns {Map<string, {korszak: number, marado: Set<string>}>}
 */
export function kulcscserekEsemenyekbol(esemenyek) {
  const ki = new Map();
  for (const e of esemenyek ?? []) {
    if (e?.tipus !== KULCSCSERE_ESEMENY) continue;
    const cs = e.adat?.cserek;
    if (!Array.isArray(cs) || !cs.length || cs.some((c) => kulcscsereAlakiHibaja(c))) continue;
    const nev = cs[0].azonossag;
    const utolso = cs[cs.length - 1];
    const eddigi = ki.get(nev);
    if (!eddigi || cs.length > eddigi.korszak || (cs.length === eddigi.korszak && utolso.alairas < eddigi.alairas)) {
      ki.set(nev, { korszak: cs.length, marado: new Set(utolso.keszulekek), alairas: utolso.alairas });
    }
  }
  return ki;
}

/**
 * A készülékek KORSZAKA (a tanúsítványuk hozott cseréinek száma) — a láncuk első eseményéből (az hozza a tanúsítványt), és ha a
 * hívó adja, a tár ismert tanúsítványaiból.
 * @param {Iterable<Object>} esemenyek
 * @param {Map<string, Object>|null} [tanusitvanyok]
 * @returns {Map<string, number>}
 */
export function keszulekKorszakai(esemenyek, tanusitvanyok = null) {
  const ki = new Map();
  for (const e of esemenyek ?? []) {
    if (e?.tanusitvany && typeof e.keszulek === 'string') ki.set(e.keszulek, e.tanusitvany.cserek?.length ?? 0);
  }
  for (const [k, t] of tanusitvanyok ?? []) if (!ki.has(k) && t) ki.set(k, t.cserek?.length ?? 0);
  return ki;
}

/**
 * Kiesik-e az esemény a kulcscsere miatt: az azonosságának van kulcscseréje, a készüléke nincs a megmaradók között, és egy RÉGEBBI
 * korszakban tanúsították. Ismeretlen korszak: nem esik ki (D19).
 */
export function cserenKivulE(e, kulcscserek, korszakok) {
  const c = kulcscserek?.get(e?.szerzo);
  if (!c || typeof e.keszulek !== 'string' || c.marado.has(e.keszulek)) return false;
  const k = korszakok?.get(e.keszulek);
  return k !== undefined && k < c.korszak;
}

/**
 * A számítás eleje: a kizárt események kiválnak (kimondva — D19), a többi marad. ⭐⭐ D128 (②b): és a kulcscsere által nem
 * felsorolt, régebbi korszakú készülékek eseményei is.
 * @param {Array<Object>} esemenyek
 * @param {{tanusitvanyok?: Map<string, Object>}} [beallitas]
 * @returns {{megmaradok: Array<Object>, kizartak: Array<Object>, kizarasok: Map<string, Object>}}
 */
export function kizartakSzurese(esemenyek, beallitas = {}) {
  const kizarasok = kizarasokEsemenyekbol(esemenyek);
  const kulcscserek = kulcscserekEsemenyekbol(esemenyek);
  if (!kizarasok.size && !kulcscserek.size) return { megmaradok: esemenyek, kizartak: [], kizarasok };
  const korszakok = kulcscserek.size ? keszulekKorszakai(esemenyek, beallitas.tanusitvanyok ?? null) : null;
  const megmaradok = [];
  const kizartak = [];
  for (const e of esemenyek) (kizartE(e, kizarasok) || cserenKivulE(e, kulcscserek, korszakok) ? kizartak : megmaradok).push(e);
  return { megmaradok, kizartak, kizarasok };
}

/**
 * Egy azonosság kizárásai a tárból — a tár a `Kizaras` eseményeket a tanúsítvány azonossága szerint indexeli (`fajlTar.js`
 * `kezelesEsemenyei` — a kizárásokkal együtt a kulcscseréket is, akárki hozta be; a lekérdezés kizárás nélkül üres és olcsó: a kapu MINDEN eseménynél kérdezi). A más tárak
 * (az átmeneti) a teljes listájukból szűrnek.
 * @param {Object} tar
 * @param {string|null} szerzo - az azonosság
 * @returns {Promise<Map<string, Object>>}
 */
export async function tarKizarasai(tar, szerzo) {
  return kizarasokEsemenyekbol(await tarKezelesEsemenyei(tar, szerzo));
}

/** ⭐⭐ D128 (②b): egy azonosság kulcscseréi a tárból (ugyanabból az indexből, mint a kizárások). */
export async function tarKulcscserei(tar, szerzo) {
  return kulcscserekEsemenyekbol(await tarKezelesEsemenyei(tar, szerzo));
}

/** Egy azonosság KEZELÉS-eseményei (a kizárások és a kulcscserék) — a tár indexéből, vagy a teljes listából szűrve. */
async function tarKezelesEsemenyei(tar, szerzo) {
  if (typeof szerzo !== 'string') return [];
  if (typeof tar?.kezelesEsemenyei === 'function') return tar.kezelesEsemenyei(szerzo);
  if (typeof tar?.betolt !== 'function') return [];
  return (await tar.betolt()).filter((e) => kezelesAzonossaga(e) === szerzo);
}

/** ⭐⭐ D128: egy kezelés-esemény azonossága (a tár ez szerint indexeli) — a kizárásé, ill. a kulcscseréé; más eseménynél null. */
export function kezelesAzonossaga(e) {
  if (e?.tipus === KIZARAS_ESEMENY && typeof e.adat?.kizaras?.azonossag === 'string') return e.adat.kizaras.azonossag;
  if (e?.tipus === KULCSCSERE_ESEMENY && typeof e.adat?.cserek?.[0]?.azonossag === 'string') return e.adat.cserek[0].azonossag;
  return null;
}
