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
import { esemenyKoinoja } from '../esemeny/esemeny.js';

/** A kizárás eseménytípusa. */
export const KIZARAS_ESEMENY = 'Kizaras';

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

/**
 * A számítás eleje: a kizárt események kiválnak (kimondva — D19), a többi marad.
 * @param {Array<Object>} esemenyek
 * @returns {{megmaradok: Array<Object>, kizartak: Array<Object>, kizarasok: Map<string, Object>}}
 */
export function kizartakSzurese(esemenyek) {
  const kizarasok = kizarasokEsemenyekbol(esemenyek);
  if (!kizarasok.size) return { megmaradok: esemenyek, kizartak: [], kizarasok };
  const megmaradok = [];
  const kizartak = [];
  for (const e of esemenyek) (kizartE(e, kizarasok) ? kizartak : megmaradok).push(e);
  return { megmaradok, kizartak, kizarasok };
}

/**
 * Egy azonosság kizárásai a tárból — a tár a `Kizaras` eseményeket a tanúsítvány azonossága szerint indexeli (`fajlTar.js`
 * `kizarasEsemenyei` — akárki hozta be; a lekérdezés kizárás nélkül üres és olcsó: a kapu MINDEN eseménynél kérdezi). A más tárak
 * (az átmeneti) a teljes listájukból szűrnek.
 * @param {Object} tar
 * @param {string|null} szerzo - az azonosság
 * @returns {Promise<Map<string, Object>>}
 */
export async function tarKizarasai(tar, szerzo) {
  if (typeof szerzo !== 'string') return new Map();
  const lista = typeof tar?.kizarasEsemenyei === 'function' ? await tar.kizarasEsemenyei(szerzo)
    : typeof tar?.betolt === 'function'
      ? (await tar.betolt()).filter((e) => e.tipus === KIZARAS_ESEMENY && e.adat?.kizaras?.azonossag === szerzo) : [];
  return kizarasokEsemenyekbol(lista);
}
