// js/kulcs/azonossag.js

// Felelősség: ⭐⭐ D128 (② — 13. pont, Csaba: KC1 (A)): AZ AZONOSSÁG SZÜLETÉSE ÉS A NEVE.
//
// ===== MIÉRT NEM A KULCS A NÉV =====
//
// A D128 előtt (és az ①-ben) az azonosság neve a nyilvános kulcsa volt. A csere-kulcs (a következő kezelő kulcs, előre lekötve)
// így csak egy aláírt állítás lehetne — és aki a kulcsot ellopja, aláírhatna egy MÁSIK lekötést, és egy új koinóban azt mutathatná
// be (az idő önbevallás, a „ki látta előbb” a hálózaté). ⭐ A KERI megoldása: a NÉV A SZÜLETÉS LENYOMATA („önmagát címző
// azonosító”). A születés EGYÜTT köti:
//   · az első kezelő kulcsot (`kulcs` — ez írja alá a készülék-tanúsítványokat, amíg kulcscsere nincs — ②b);
//   · a csere-kulcs nyilvános részének lenyomatát (`csere` — maga a kulcs csak a mentésben van, egyik készüléken sem: KC3 (A));
//   · a fizetési kulcs nyilvános részét (`fizetes` — KU4 (A): a pénz bevezetése így nem kíván új koinó-családot);
// és a név ebből jön: ugyanarra a névre más lekötés NEM LÉTEZHET. A név a kulcscsere után is marad (KU3 (A)).
//
// ===== AZ ALAK =====
//
// `{ tipus, kulcs, csere, fizetes, ido, alairas }` — az aláírás az első kulcsé (birtoklás: senki nem köthet le egy idegen kulcsot a
// saját csere-kulcsával). A név a születés ALÁÍRT RÉSZÉNEK lenyomata (`szuletesTartalma`). A születés a készülék-tanúsítványban
// (és a kizárásban) utazik: aki egy tanúsítványt ellenőriz, a nevet a születésből helyben ellenőrzi.
//
// ⚠️ NULLA FÜGGŐSÉG (6. szabály): Ed25519 és SHA-256 a beépített WebCryptóból.
//
// Használják: kulcs/keszulek.js (a tanúsítványok ellenőrzése), kulcs/kulcsTar.js (az azonosság a gépen), csere/titkositas.js (a
// kézfogás — szinkron), koino.js, a próbák.

import { lenyomat, lenyomatSzinkron, bajtokBase64Url, base64UrlBajtok } from '../esemeny/kanonikusAlak.js';

const ALGORITMUS = 'Ed25519';

/** A születés fajtája (a lenyomatolt tartalom része — semmi mással nem téveszthető össze). */
export const SZULETES_TIPUS = 'AzonossagSzuletes';

const AZONOSITO = /^[A-Za-z0-9_-]{43}$/;
const ALAIRAS = /^[A-Za-z0-9_-]{86}$/;
const MEZOK = 'alairas,csere,fizetes,ido,kulcs,tipus';

/** A születés aláírt része — ennek a lenyomata a NÉV, és ezt írja alá az első kulcs. */
export function szuletesTartalma(s) {
  return { tipus: s.tipus, kulcs: s.kulcs, csere: s.csere, fizetes: s.fizetes, ido: s.ido };
}

/**
 * A születés alakja — szinkron és olcsó. ⚠️ Csak az ALAK (az aláírás és a név a `szuletesEllenorzese`-é).
 * @returns {string|null} a hiba oka, vagy null
 */
export function szuletesAlakiHibaja(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return 'a születés egy objektum';
  if (Object.keys(s).sort().join(',') !== MEZOK) return 'a születés mezői: tipus, kulcs, csere, fizetes, ido, alairas';
  if (s.tipus !== SZULETES_TIPUS) return 'ez nem azonosság-születés';
  for (const m of ['kulcs', 'csere', 'fizetes']) {
    if (typeof s[m] !== 'string' || !AZONOSITO.test(s[m])) return 'a születés ' + m + ' mezője 43 jel';
  }
  if (new Set([s.kulcs, s.csere, s.fizetes]).size !== 3) return 'a születés három kulcsa három különböző';
  if (!Number.isSafeInteger(s.ido) || s.ido < 0) return 'a születés ideje egy nemnegatív egész';
  if (typeof s.alairas !== 'string' || !ALAIRAS.test(s.alairas)) return 'a születés aláírása 64 bájt';
  return null;
}

/** Az azonosság NEVE a születéséből (a születés aláírt részének lenyomata). */
export async function azonossagNeve(s) {
  return lenyomat(szuletesTartalma(s));
}

/** Ugyanaz szinkron (a kézfogás szinkron ellenőriz — `csere/titkositas.js`). */
export function azonossagNeveSzinkron(s) {
  return lenyomatSzinkron(szuletesTartalma(s));
}

/**
 * Egy azonosság születése: az első kulcs aláírja, hogy a csere-kulcsa és a fizetési kulcsa ez.
 * @param {CryptoKeyPair} kulcspar - az első kezelő kulcs
 * @param {string} csere - a csere-kulcs nyilvános részének LENYOMATA (`csereLenyomata`)
 * @param {string} fizetes - a fizetési kulcs nyilvános része (43 jel)
 * @param {number} [ido]
 * @returns {Promise<Object>} a születés
 */
export async function szuletesKeszitese(kulcspar, csere, fizetes, ido = Date.now()) {
  console.log('szuletesKeszitese - KEZDÉS');
  const kulcs = bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', kulcspar.publicKey)));
  const s = { tipus: SZULETES_TIPUS, kulcs, csere, fizetes, ido };
  const alairas = await crypto.subtle.sign({ name: ALGORITMUS }, kulcspar.privateKey,
    new TextEncoder().encode(await lenyomat(s)));
  const kesz = { ...s, alairas: bajtokBase64Url(new Uint8Array(alairas)) };
  const hiba = szuletesAlakiHibaja(kesz);
  if (hiba) throw new Error('szuletesKeszitese: ' + hiba);
  console.log('szuletesKeszitese - VÉGE');
  return kesz;
}

/** A csere-kulcs nyilvános részének lenyomata (a születés ezt köti — maga a kulcs csak a mentésben van). */
export async function csereLenyomata(csereNyilvanos) {
  return lenyomat({ tipus: 'CsereKulcs', kulcs: csereNyilvanos });
}

/**
 * A születés ellenőrzése: az alak, a NÉV (a lenyomata — ha meg van adva), és az első kulcs aláírása.
 * @param {Object} s
 * @param {string|null} [nev] - a várt név (pl. a tanúsítvány azonossága)
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function szuletesEllenorzese(s, nev = null) {
  const hiba = szuletesAlakiHibaja(s);
  if (hiba) return { rendben: false, ok: hiba };
  const tartalom = szuletesTartalma(s);
  const l = await lenyomat(tartalom);
  if (nev !== null && l !== nev) return { rendben: false, ok: 'a név nem ennek a születésnek a lenyomata' };
  try {
    const kulcs = await crypto.subtle.importKey('raw', base64UrlBajtok(s.kulcs), { name: ALGORITMUS }, false, ['verify']);
    const jo = await crypto.subtle.verify({ name: ALGORITMUS }, kulcs, base64UrlBajtok(s.alairas), new TextEncoder().encode(l));
    return jo ? { rendben: true } : { rendben: false, ok: 'a születést nem az első kulcs írta alá' };
  } catch (h) {
    return { rendben: false, ok: 'a születés nem ellenőrizhető: ' + h.message };
  }
}

/**
 * ⭐ ÚJ AZONOSSÁG: az első kezelő kulcs, a csere-kulcs és a fizetési kulcs, és a születés. ⛔ A csere-kulcs titkos felét a hívó
 * a MENTÉSBE adja (KC3 (A) — egyik készüléken sem marad); a fizetési kulcs a kezelő kulcs mellett él (az ET-11 dönti el, hova
 * kerül végleg).
 * @returns {Promise<{kulcspar: CryptoKeyPair, csere: CryptoKeyPair, fizetes: CryptoKeyPair, szuletes: Object, nev: string}>}
 */
export async function ujAzonossag() {
  console.log('ujAzonossag - KEZDÉS');
  const uj = () => crypto.subtle.generateKey({ name: ALGORITMUS }, true, ['sign', 'verify']);
  const [kulcspar, csere, fizetes] = [await uj(), await uj(), await uj()];
  const nyilvanos = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const szuletes = await szuletesKeszitese(kulcspar, await csereLenyomata(await nyilvanos(csere)), await nyilvanos(fizetes));
  const nev = await azonossagNeve(szuletes);
  console.log('ujAzonossag - VÉGE', { nev: nev.slice(0, 8) + '…' });
  return { kulcspar, csere, fizetes, szuletes, nev };
}
