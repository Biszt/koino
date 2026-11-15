// js/kulcs/papir.js

// Felelősség: ⭐⭐ D128 (②c — 15. pont KC3 (A), 16. pont KC4 (A)): A CSERE-KULCS PAPÍRON — betűcsoportokban.
//
// A csere-kulcs (a következő kezelő kulcs aláírója — `kulcs/azonossag.js`) csak a mentésben él: fájlban (`csere-kulcs.json`) és
// PAPÍRON. A papír alakja (Csaba, 2026-11-15: „(A) Betűcsoportok”): 14 csoport, csoportonként 4 jel —
//
//   [1 jel: a változat] [52 jel: a kulcs 32 bájtja] [3 jel: az ellenőrzés]  = 56 jel  →  pl. 1K7Q-M2XA-P…
//
// ⭐ Az ábécé a Crockford-féle base32: a 0–9 és az A–Z az I, L, O, U NÉLKÜL — így semmi nem téveszthető össze (a visszaolvasás a
// kis- és nagybetűt egynek veszi, az O-t 0-nak, az I-t és az L-t 1-nek, a kötőjelet és a szóközt kihagyja).
//
// ⭐⭐ Az ELLENŐRZÉS 3 jel (15 bit): az első 53 jel értékének a HELYÉVEL súlyozott összege (1·j₁ + 2·j₂ + … + 53·j₅₃) a 32 749
// prím szerint. Ezért BIZTOSAN kimondja:
//   · minden EGYETLEN elírást (egy jel eltérése: k·Δ, ahol k ≤ 53 és |Δ| ≤ 31 — a szorzat kisebb a prímnél, nem lehet nulla);
//   · két jel minden FELCSERÉLÉSÉT az első 53 között (bármilyen távolságból: (j − i)·(a − b), ugyanígy), és a 3 ellenőrző jel
//     között is (más összeget írnak le).
// A többféle hibát 32 749-ből egyszer engedheti át — és akkor sem cserél rossz kulccsal: a kulcscsere a LEKÖTÉSEN akad el (a rossz
// kulcs lenyomata nem a lekötött — `kulcsTar.js` kulcscsereVegrehajtasa).
//
// ⚠️ NULLA FÜGGŐSÉG (6. szabály): a WebCrypto (az Ed25519 kulcs a magjából — PKCS#8 — áll vissza, a nyilvános fele vele).
//
// Használják: koino.js (a csere-kulcs kiírása, a kulcscsere a kódból), a próbák.

import { base64UrlBajtok } from '../esemeny/kanonikusAlak.js';
import { qrKeszitese } from './qr.js';

/** A Crockford-féle base32 ábécé (I, L, O, U nélkül). */
const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A papír-alak változata (az első jel). */
const VALTOZAT = '1';

/** Egy csoport ennyi jel; a kód ennyi jel (kötőjelek nélkül). */
export const CSOPORT = 4;
export const KOD_HOSSZ = 56;

/** Az Ed25519 PKCS#8 előtagja a 32 bájtos maghoz (RFC 8410). */
const PKCS8_ELOTAG = [0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20];

/** Bájtok → base32 jelek (a bitek sorban, a végén nullákkal kiegészítve). */
function base32(bajtok, jelek) {
  let ki = '';
  let puffer = 0;
  let bitek = 0;
  for (const b of bajtok) {
    puffer = (puffer << 8) | b;
    bitek += 8;
    while (bitek >= 5) {
      ki += ABC[(puffer >>> (bitek - 5)) & 31];
      bitek -= 5;
    }
    puffer &= (1 << bitek) - 1;
  }
  if (bitek > 0) ki += ABC[(puffer << (5 - bitek)) & 31];
  return ki.slice(0, jelek);
}

/** Base32 jelek → bájtok (a megadott számú bájt). */
function base32Bajtok(szoveg, bajtSzam) {
  const ki = new Uint8Array(bajtSzam);
  let puffer = 0;
  let bitek = 0;
  let i = 0;
  for (const c of szoveg) {
    puffer = (puffer << 5) | ABC.indexOf(c);
    bitek += 5;
    if (bitek >= 8 && i < bajtSzam) {
      ki[i++] = (puffer >>> (bitek - 8)) & 255;
      bitek -= 8;
      puffer &= (1 << bitek) - 1;
    }
  }
  return ki;
}

/** Az ellenőrzés prímje (a legnagyobb 2^15 alatt). */
const PRIM = 32749;

/** Az ellenőrző rész: a jelek helyükkel súlyozott összege a prím szerint — 3 jel (15 bit). */
function ellenorzes(jelek) {
  let osszeg = 0;
  for (let i = 0; i < jelek.length; i++) osszeg = (osszeg + (i + 1) * ABC.indexOf(jelek[i])) % PRIM;
  return ABC[osszeg >> 10] + ABC[(osszeg >> 5) & 31] + ABC[osszeg & 31];
}

/** A kód csoportokban (kötőjellel). */
function csoportokban(kod) {
  return kod.match(new RegExp('.{1,' + CSOPORT + '}', 'g')).join('-');
}

/**
 * A csere-kulcs PAPÍR-ALAKJA — a titkos fele (a JWK `d` mezője, a 32 bájtos mag) betűcsoportokban.
 * @param {Object} privatJwk - a csere-kulcs titkos fele (`{ kty, crv, d, x }`)
 * @returns {string} pl. `1K7Q-M2XA-…` (14 csoport)
 */
export function csereKodja(privatJwk) {
  const mag = base64UrlBajtok(privatJwk?.d ?? '');
  if (mag.length !== 32) throw new Error('csereKodja: a csere-kulcs titkos fele 32 bájt (Ed25519)');
  const jelek = VALTOZAT + base32(mag, 52);
  return csoportokban(jelek + ellenorzes(jelek));
}

/** A beírt kód tisztítása: nagybetű, O→0, I/L→1, a kötőjel, a szóköz és az írásjel nélkül. */
export function kodTisztitasa(beirt) {
  return String(beirt ?? '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
}

/**
 * A PAPÍRRÓL VISSZA: a kódból a csere-kulcs (a mag → PKCS#8 → a kulcspár, a nyilvános fele vele) — a `kulcscsere` ugyanúgy veszi,
 * mint a fájlt. ⛔ Elírásnál (rossz hossz, idegen jel, nem illő ellenőrzés) kimondja, és nem ad kulcsot.
 * @param {string} beirt
 * @returns {Promise<{mi: string, valtozat: number, privatKulcs: Object}>}
 */
export async function csereKodbol(beirt) {
  const kod = kodTisztitasa(beirt);
  if (kod.length !== KOD_HOSSZ) {
    throw new Error('A csere-kulcs kódja ' + KOD_HOSSZ + ' jel (14 csoport × 4) — ez ' + kod.length + '. Elírás?');
  }
  if ([...kod].some((c) => !ABC.includes(c))) throw new Error('A kódban idegen jel van (U?) — elírás?');
  if (kod.slice(53) !== ellenorzes(kod.slice(0, 53))) {
    throw new Error('A kód ellenőrzése nem illik — valahol elírás van (nézd át csoportonként).');
  }
  if (kod[0] !== VALTOZAT) throw new Error('Ismeretlen kód-változat: ' + kod[0]);
  const mag = base32Bajtok(kod.slice(1, 53), 32);
  const pkcs8 = new Uint8Array([...PKCS8_ELOTAG, ...mag]);
  const kulcs = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, true, ['sign']);
  const privatKulcs = await crypto.subtle.exportKey('jwk', kulcs);
  return { mi: 'koino-csere-kulcs', valtozat: 1, privatKulcs: { kty: privatKulcs.kty, crv: privatKulcs.crv, d: privatKulcs.d,
    x: privatKulcs.x } };
}

/**
 * ⭐ A CSERE-KÓD QR-JE — Q szint: a kód negyede sérülhet (a papír évekig áll, gyűrődik), és még olvasható. A 69 jel (a kötőjelekkel —
 * így a beolvasó is a leírt alakot mutatja) alfanumerikus módban az 5. verzióba fér: 37×37 modul.
 * @param {string} kod - a `csereKodja` kimenete
 */
export function csereKodQrja(kod) {
  return qrKeszitese(kod, { szint: 'Q' });
}
