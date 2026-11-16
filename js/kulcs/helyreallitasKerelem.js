// js/kulcs/helyreallitasKerelem.js

// Felelősség: ⭐⭐ D128 (②f — 17. pont, 9.13): A HELYREÁLLÍTÁS KÉRELME — amit az ÚJ készülék (aki helyre akarja állítani magát)
// a segítőinek átad: az új kezelő kulcs, az új fizetési kulcs, az új papír (csere-kulcs) lenyomata, és a megtartandó régi készülékek.
//
// ===== AZ ALAK =====
//
// Szöveg (egy sor — a segítő bemásolja, vagy a QR-ből olvassa):
//   koino-helyreallitas.1.<kulcs>.<fizetes>.<csere vagy ->.<készülékek vesszővel, vagy ->
// A base64url jelek között a pont nem fordul elő — ezért ez a határoló. ⭐ Mellé az ELLENŐRZŐ KÓD (6 jel, a Crockford-ábécéből: a
// kérelem lenyomatának eleje): a két ember szóban összeveti (a D121 mintája: két ember, két gomb, egy összevetett kód) — a segítő a
// kódot be is írja, és a gépe csak egyező kódnál hagy jóvá. Így egy kicserélt kérelem (egy csaló a saját kulcsát csempészné be) nem
// csúszik át észrevétlenül.
//
// A TITKOK (a három titkos kulcs) az új készüléken maradnak (`helyreallitas-kerelem.json` — `koino.js`), amíg a helyreállítás véget
// nem ér (`helyreallitas befejez`).
//
// Használják: koino.js (a `helyreallitas` és a `segit` parancs), allapot/helyreallitas.js (a javaslat a kérelemből), a próbák.

import { lenyomat, base64UrlBajtok } from '../esemeny/kanonikusAlak.js';
import { csereLenyomata, MARADO_KORLAT } from './azonossag.js';

/** A kérelem szövegének eleje (a változattal). */
export const KERELEM_ELOTAG = 'koino-helyreallitas.1.';

const AZONOSITO = /^[A-Za-z0-9_-]{43}$/;
const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A kérelem alakja — szinkron. */
export function kerelemAlakiHibaja(k) {
  if (!k || typeof k !== 'object') return 'a kérelem egy objektum';
  if (!AZONOSITO.test(k.kulcs ?? '') || !AZONOSITO.test(k.fizetes ?? '')) return 'a kérelem kulcsa és fizetési kulcsa 43 jel';
  if (k.csere !== null && !AZONOSITO.test(k.csere ?? '')) return 'a kérelem papír-lenyomata 43 jel (vagy nincs)';
  const d = k.keszulekek;
  if (!Array.isArray(d) || d.length > MARADO_KORLAT || !d.every((x) => AZONOSITO.test(x))) {
    return 'a kérelem készülékei: 0–' + MARADO_KORLAT + ' kulcs';
  }
  for (let i = 1; i < d.length; i++) if (!(d[i] > d[i - 1])) return 'a kérelem készülékei rendezve, egyszer';
  if (new Set([k.kulcs, k.fizetes]).size !== 2) return 'a kezelő és a fizetési kulcs különböző';
  return null;
}

/** A kérelem SZÖVEGE (egy sor). */
export function kerelemSzovege(k) {
  const h = kerelemAlakiHibaja(k);
  if (h) throw new Error('kerelemSzovege: ' + h);
  return KERELEM_ELOTAG + [k.kulcs, k.fizetes, k.csere ?? '-', k.keszulekek.length ? k.keszulekek.join(',') : '-'].join('.');
}

/**
 * A kérelem a szövegéből — ⛔ hibás alaknál kimondja.
 * @param {string} szoveg
 * @returns {{kulcs: string, fizetes: string, csere: string|null, keszulekek: Array<string>}}
 */
export function kerelemSzovegbol(szoveg) {
  const s = String(szoveg ?? '').trim();
  if (!s.startsWith(KERELEM_ELOTAG)) throw new Error('Ez nem helyreállítási kérelem (' + KERELEM_ELOTAG + '…).');
  const reszek = s.slice(KERELEM_ELOTAG.length).split('.');
  if (reszek.length !== 4) throw new Error('A helyreállítási kérelem négy részből áll — elírás?');
  const k = { kulcs: reszek[0], fizetes: reszek[1], csere: reszek[2] === '-' ? null : reszek[2],
    keszulekek: reszek[3] === '-' ? [] : reszek[3].split(',') };
  const h = kerelemAlakiHibaja(k);
  if (h) throw new Error('A helyreállítási kérelem hibás: ' + h);
  return k;
}

/**
 * A kérelem ELLENŐRZŐ KÓDJA — 6 jel (`ABC-DEF`), a kérelem lenyomatának eleje: a két ember szóban összeveti.
 * @returns {Promise<string>}
 */
export async function kerelemEllenorzoKodja(k) {
  const b = base64UrlBajtok(await lenyomat({ tipus: 'HelyreallitasKerelem', kulcs: k.kulcs, fizetes: k.fizetes, csere: k.csere,
    keszulekek: k.keszulekek }));
  let bitek = 0;
  let puffer = 0;
  let ki = '';
  for (const x of b) {
    puffer = (puffer << 8) | x;
    bitek += 8;
    while (bitek >= 5 && ki.length < 6) {
      ki += ABC[(puffer >>> (bitek - 5)) & 31];
      bitek -= 5;
    }
    puffer &= (1 << bitek) - 1;
    if (ki.length >= 6) break;
  }
  return ki.slice(0, 3) + '-' + ki.slice(3, 6);
}

/** A beírt ellenőrző kód tisztítva (nagybetű, O → 0, I/L → 1, a kötőjel nélkül) — az összevetéshez. */
export function ellenorzoKodTisztitasa(kod) {
  return String(kod ?? '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
}

/**
 * ÚJ KÉRELEM — három friss kulcs (a kezelő, a fizetési, a papír) és a megtartandó régi készülékek.
 * @param {Array<string>} [keszulekek]
 * @returns {Promise<{kerelem: Object, titkok: {kulcs: Object, fizetes: Object, csere: Object}}>} (a titkok JWK-k)
 */
export async function ujKerelem(keszulekek = []) {
  const uj = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const [K, F, C] = [await uj(), await uj(), await uj()];
  const jwk = (k) => crypto.subtle.exportKey('jwk', k.privateKey);
  const titkok = { kulcs: await jwk(K), fizetes: await jwk(F), csere: await jwk(C) };
  const kerelem = { kulcs: titkok.kulcs.x, fizetes: titkok.fizetes.x, csere: await csereLenyomata(titkok.csere.x),
    keszulekek: [...new Set(keszulekek)].sort() };
  const h = kerelemAlakiHibaja(kerelem);
  if (h) throw new Error('ujKerelem: ' + h);
  return { kerelem, titkok };
}
