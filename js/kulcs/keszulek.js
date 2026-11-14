// js/kulcs/keszulek.js

// Felelősség: ⭐⭐ D128 (ET-3 — a kulcs: több készülék és a helyreállítás) — A KÉSZÜLÉK ÉS A TANÚSÍTVÁNYA.
//
// ===== MIÉRT KÉT KULCS =====
//
// A D128 előtt egy kulcs volt minden: a név (az azonosság) és a mindennapi aláírás is. Két készülék
// ugyanazzal a kulccsal elágaztatta egymás láncát (93. (a): minden ütköző sorszámon egy esemény elveszett),
// és egy ellopott készüléket nem lehetett kizárni — a kulcs maga volt az azonosság.
//
// ⭐ Most:
//   · az AZONOSSÁG KULCSA (a régi kulcs — a név nem változik, `kulcsTar.js`) csak KEZEL: aláírja, hogy
//     egy készülékkulcs az övé (KU6 (A): így később papírra is tehető);
//   · a KÉSZÜLÉKKULCS (minden készüléknek saját — ez a fájl) írja alá a mindennapi eseményeket, a SAJÁT
//     láncán: két készülék soha nem ágaztatja el egymást.
//
// ===== A TANÚSÍTVÁNY — KOINÓK FÖLÖTT (KU2 (A)) =====
//
// `{ tipus, azonossag, keszulek, nev, ido, alairas }` — az azonosság kulcsa írja alá (a tartalom lenyomatát,
// mint az eseményét). ⭐ Nincs benne koinó: egy tanúsítvány az azonosság MINDEN koinójában érvényes (a kulcs is
// mindenhol ugyanaz — D25). Egy koinóban a készülék láncának ELSŐ eseménye hozza (`esemeny.js`
// `tanusitvanyKell`), és a kapu csak tanúsított eseményt enged be (`esemenyTar.js`).
//
// ⛔ A készülék kulcsa nem lehet az azonosság kulcsa: az azonosság nem ír a mindennapokban (KU6 (A)).
//
// ⚠️ NULLA FÜGGŐSÉG (6. szabály): Ed25519 a beépített WebCryptóból, mint az eseménynél.
//
// Használják: esemeny.js (az aláírás és az ellenőrzés), koino.js (a készülék a gépen), a próbák.

import { lenyomat, bajtokBase64Url, base64UrlBajtok } from '../esemeny/kanonikusAlak.js';
import { nyilvanosKulcsSzovegesen, kulcsparLeirasa, kulcsparLeirasbol } from './kulcsTar.js';

const ALGORITMUS = 'Ed25519';

/** A tanúsítvány fajtája (a lenyomatolt tartalom része — egy eseménnyel nem téveszthető össze). */
export const TANUSITVANY_TIPUS = 'KeszulekTanusitvany';

/** A készülék nevének felső határa (jelben) — a lapon mutatott név, pl. „laptop”, „telefon”. */
export const KESZULEK_NEV_KORLAT = 64;

const AZONOSITO = /^[A-Za-z0-9_-]{43}$/;
// Egy Ed25519-aláírás 64 bájt → 86 base64url jel.
const ALAIRAS = /^[A-Za-z0-9_-]{86}$/;
const MEZOK = 'alairas,azonossag,ido,keszulek,nev,tipus';

/** Az aláírt rész — ennek a lenyomatát írja alá az azonosság kulcsa. */
function tartalma(t) {
  return { tipus: t.tipus, azonossag: t.azonossag, keszulek: t.keszulek, nev: t.nev, ido: t.ido };
}

// ===================================
// AZ ALAK
// ===================================

/**
 * A tanúsítvány alakja — szinkron és olcsó (a kapu és az esemény alaki ellenőrzése is hívja).
 * ⚠️ Csak az ALAK: hogy tényleg az azonosság kulcsa írta-e alá, azt a `tanusitvanyEllenorzese` nézi.
 * @param {*} t
 * @returns {string|null} a hiba oka, vagy null
 */
export function tanusitvanyAlakiHibaja(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return 'a tanúsítvány egy objektum';
  if (Object.keys(t).sort().join(',') !== MEZOK) return 'a tanúsítvány mezői: tipus, azonossag, keszulek, nev, ido, alairas';
  if (t.tipus !== TANUSITVANY_TIPUS) return 'ez nem készülék-tanúsítvány';
  if (typeof t.azonossag !== 'string' || !AZONOSITO.test(t.azonossag)) return 'a tanúsítvány azonossága egy nyilvános kulcs';
  if (typeof t.keszulek !== 'string' || !AZONOSITO.test(t.keszulek)) return 'a tanúsítvány készüléke egy nyilvános kulcs';
  if (t.azonossag === t.keszulek) return 'a készülék kulcsa nem lehet az azonosság kulcsa (D128: az azonosság csak kezel)';
  if (typeof t.nev !== 'string' || !t.nev.length || t.nev.length > KESZULEK_NEV_KORLAT) {
    return 'a készülék neve 1–' + KESZULEK_NEV_KORLAT + ' jel';
  }
  if (!Number.isSafeInteger(t.ido) || t.ido < 0) return 'a tanúsítvány ideje egy nemnegatív egész';
  if (typeof t.alairas !== 'string' || !ALAIRAS.test(t.alairas)) return 'a tanúsítvány aláírása 64 bájt';
  return null;
}

// ===================================
// KÉSZÍTÉS ÉS ELLENŐRZÉS
// ===================================

/**
 * Az azonosság kulcsa aláírja: „ez a készülékkulcs az enyém (»nev«)”.
 * @param {CryptoKeyPair} azonossagKulcspar - az azonosság kulcsa (a régi, „személyes” kulcs)
 * @param {string} keszulek - a készülékkulcs nyilvános része (43 jel)
 * @param {string} nev - a készülék neve (pl. „laptop”)
 * @param {number} [ido]
 * @returns {Promise<Object>} a tanúsítvány
 */
export async function tanusitvanyKeszitese(azonossagKulcspar, keszulek, nev, ido = Date.now()) {
  console.log('tanusitvanyKeszitese - KEZDÉS', { nev });
  const azonossag = await nyilvanosKulcsSzovegesen(azonossagKulcspar.publicKey);
  const t = { tipus: TANUSITVANY_TIPUS, azonossag, keszulek, nev, ido };
  const alairas = await crypto.subtle.sign({ name: ALGORITMUS }, azonossagKulcspar.privateKey,
    new TextEncoder().encode(await lenyomat(t)));
  const kesz = { ...t, alairas: bajtokBase64Url(new Uint8Array(alairas)) };
  const hiba = tanusitvanyAlakiHibaja(kesz);
  if (hiba) throw new Error('tanusitvanyKeszitese: ' + hiba);
  console.log('tanusitvanyKeszitese - VÉGE');
  return kesz;
}

/**
 * Valóban az azonosság kulcsa írta-e alá, és változatlan-e?
 * @param {Object} t
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function tanusitvanyEllenorzese(t) {
  const hiba = tanusitvanyAlakiHibaja(t);
  if (hiba) return { rendben: false, ok: hiba };
  try {
    const kulcs = await crypto.subtle.importKey('raw', base64UrlBajtok(t.azonossag), { name: ALGORITMUS }, false, ['verify']);
    const jo = await crypto.subtle.verify({ name: ALGORITMUS }, kulcs, base64UrlBajtok(t.alairas),
      new TextEncoder().encode(await lenyomat(tartalma(t))));
    return jo ? { rendben: true } : { rendben: false, ok: 'a tanúsítványt nem az azonosság kulcsa írta alá' };
  } catch (h) {
    return { rendben: false, ok: 'a tanúsítvány nem ellenőrizhető: ' + h.message };
  }
}

// ===================================
// A KÉSZÜLÉK — a kulcspárja és a tanúsítványa együtt
// ===================================
//
// ⭐ Az „eszköz” egy kulcspár (aláírásra), mellette a két név és a tanúsítvány: `{ publicKey, privateKey,
// azonossag, keszulek, tanusitvany }`. Az `esemenyLetrehozasa` ezt kapja: a szerző az `azonossag`, a
// `keszulek` mező a készülék kulcsa, az aláírás a készülékkulccsal, és a lánc első eseménye a tanúsítványt is
// hozza.

/**
 * Egy kulcspárból és a tanúsítványából eszköz.
 * @param {CryptoKeyPair} kulcspar - a KÉSZÜLÉK kulcspárja
 * @param {Object} tanusitvany
 * @returns {Object} eszköz
 */
export function eszkoz(kulcspar, tanusitvany) {
  return { publicKey: kulcspar.publicKey, privateKey: kulcspar.privateKey,
    azonossag: tanusitvany.azonossag, keszulek: tanusitvany.keszulek, tanusitvany };
}

/**
 * Új készülékkulcs, az azonosság tanúsítványával — a memóriában (a tárolás a `keszulekBiztositasa`-é).
 * @param {CryptoKeyPair} azonossagKulcspar
 * @param {string} [nev]
 * @returns {Promise<Object>} eszköz
 */
export async function ujKeszulek(azonossagKulcspar, nev = 'készülék') {
  const kulcspar = await crypto.subtle.generateKey({ name: ALGORITMUS }, true, ['sign', 'verify']);
  const keszulek = await nyilvanosKulcsSzovegesen(kulcspar.publicKey);
  return eszkoz(kulcspar, await tanusitvanyKeszitese(azonossagKulcspar, keszulek, nev));
}

/**
 * ⭐ A KÉSZÜLÉK A GÉPEN: betölti a készülékkulcsot és a tanúsítványát a tárolóból (`keszulek.json`), vagy ha
 * nincs (vagy egy MÁSIK azonosságé — pl. a kulcs visszatöltése után), újat készít, és az azonosság kulcsával
 * tanúsítja.
 * @param {{olvas: Function, ir: Function}} tarolo
 * @param {CryptoKeyPair} azonossagKulcspar
 * @param {string} [nev]
 * @returns {Promise<{eszkoz: Object, ujE: boolean}>}
 */
export async function keszulekBiztositasa(tarolo, azonossagKulcspar, nev = 'készülék') {
  console.log('keszulekBiztositasa - KEZDÉS', { nev });
  const azonossag = await nyilvanosKulcsSzovegesen(azonossagKulcspar.publicKey);
  const leiras = await tarolo.olvas();
  if (leiras?.mi === 'koino-keszulek' && leiras.tanusitvany?.azonossag === azonossag
      && (await tanusitvanyEllenorzese(leiras.tanusitvany)).rendben) {
    const kulcspar = await kulcsparLeirasbol(leiras.kulcs);
    if (await nyilvanosKulcsSzovegesen(kulcspar.publicKey) === leiras.tanusitvany.keszulek) {
      console.log('keszulekBiztositasa - VÉGE (meglévő)');
      return { eszkoz: eszkoz(kulcspar, leiras.tanusitvany), ujE: false };
    }
  }
  const kulcspar = await crypto.subtle.generateKey({ name: ALGORITMUS }, true, ['sign', 'verify']);
  const keszulek = await nyilvanosKulcsSzovegesen(kulcspar.publicKey);
  const tanusitvany = await tanusitvanyKeszitese(azonossagKulcspar, keszulek, nev);
  await tarolo.ir({ mi: 'koino-keszulek', valtozat: 1, kulcs: await kulcsparLeirasa(kulcspar), tanusitvany });
  console.log('keszulekBiztositasa - VÉGE (ÚJ készülékkulcs)');
  return { eszkoz: eszkoz(kulcspar, tanusitvany), ujE: true };
}
