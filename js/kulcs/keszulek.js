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
import { szuletesAlakiHibaja, azonossagNeve, kezeloKulcsLanc, kulcscsereAlakiHibaja, KULCSCSERE_KORLAT }
  from './azonossag.js';   // ⭐⭐ D128 (②a — KC1 (A); ②b — a kulcscserék lánca)

const ALGORITMUS = 'Ed25519';

/** A tanúsítvány fajtája (a lenyomatolt tartalom része — egy eseménnyel nem téveszthető össze). */
export const TANUSITVANY_TIPUS = 'KeszulekTanusitvany';

/** A készülék nevének felső határa (jelben) — a lapon mutatott név, pl. „laptop”, „telefon”. */
export const KESZULEK_NEV_KORLAT = 64;

const AZONOSITO = /^[A-Za-z0-9_-]{43}$/;
// Egy Ed25519-aláírás 64 bájt → 86 base64url jel.
const ALAIRAS = /^[A-Za-z0-9_-]{86}$/;
// ⭐⭐ D128 (②a — KC1 (A)): a tanúsítvány az azonosság SZÜLETÉSÉT is hozza — a név annak lenyomata, az aláíró kulcs az övé.
const MEZOK = 'alairas,azonossag,ido,keszulek,nev,szuletes,tipus';
// ⭐⭐ D128 (②b): egy kulcscsere UTÁN a tanúsítvány a cserék láncát is hozza (`cserek`) — a kezelő kulcs a lánc végén.
const MEZOK_CSEREKKEL = 'alairas,azonossag,cserek,ido,keszulek,nev,szuletes,tipus';

/** ⭐⭐ D128 (②b): a hozott kulcscserék lánca — alakilag (üres vagy hiányzik: a születés kulcsa kezel). */
function cserekAlakiHibaja(cserek) {
  if (cserek === undefined) return null;
  if (!Array.isArray(cserek) || !cserek.length || cserek.length > KULCSCSERE_KORLAT) {
    return 'a kulcscserék lánca 1–' + KULCSCSERE_KORLAT + ' csere';
  }
  for (const c of cserek) {
    const h = kulcscsereAlakiHibaja(c);
    if (h) return 'a kulcscserék lánca: ' + h;
  }
  return null;
}

/**
 * ⭐⭐ D128 (②a): az AZONOSSÁG — a kezelő kulcspár és a születése együtt (`kulcsTar.js` adja: a kulcspárra tett `szuletes` mező).
 * A név a születés lenyomata; a tanúsítványok ezt a születést hordozzák.
 */
async function azonossagAdatai(azonossagKulcspar) {
  const szuletes = azonossagKulcspar?.szuletes;
  if (szuletesAlakiHibaja(szuletes)) throw new Error('az azonosság születése hiányzik (D128 ②a — kulcs/azonossag.js)');
  // ⭐⭐ D128 (②b): a kulcscserék lánca (ha volt csere) — a tanúsítvány ezt hozza, a kezelő kulcs a lánc végén.
  const cserek = Array.isArray(azonossagKulcspar.cserek) && azonossagKulcspar.cserek.length ? azonossagKulcspar.cserek : null;
  return { szuletes, azonossag: await azonossagNeve(szuletes), cserek };
}

/**
 * ⭐ Egy ellenőrzött kezelő-lánc emlékezete (a születés és a cserék aláírásai + a név → a lánc): a kapu sok tanúsítványt néz, a lánc
 * ugyanaz — egyszer elég. Korlátos (a legrégebbi esik ki). ⭐⭐ D128 (②b): a lánc végén álló kulcs a kezelő kulcs.
 */
const LANC_EMLEK = new Map();
const LANC_EMLEK_KORLAT = 4096;
async function kezeloLancRendben(szuletes, cserek, nev) {
  // ⛔ A kulcs a TELJES tartalom (nem csak az aláírások): egy átírt, de a régi aláírást hordozó csere különben a korábbi
  // „rendben” eredményt kapná vissza (a próba mérte).
  const kulcs = JSON.stringify([szuletes ?? null, cserek ?? [], nev]);
  if (LANC_EMLEK.has(kulcs)) return LANC_EMLEK.get(kulcs);
  const r = await kezeloKulcsLanc(szuletes, cserek ?? [], nev);
  LANC_EMLEK.set(kulcs, r);
  while (LANC_EMLEK.size > LANC_EMLEK_KORLAT) LANC_EMLEK.delete(LANC_EMLEK.keys().next().value);
  return r;
}

/**
 * Az aláírt rész — ennek a lenyomatát írja alá az azonosság kulcsa. ⭐ Kiadva: a hálózat (`csere/titkositas.js`) a kézfogásban
 * szinkron ellenőrzi ugyanezt (EGY forrás a tartalomnak).
 */
export function tanusitvanyTartalma(t) {
  return tartalma(t);
}

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
  const mezok = Object.keys(t).sort().join(',');
  if (mezok !== MEZOK && mezok !== MEZOK_CSEREKKEL) {
    return 'a tanúsítvány mezői: tipus, azonossag, keszulek, nev, ido, szuletes, (cserek,) alairas';
  }
  const ch = cserekAlakiHibaja(t.cserek);
  if (ch) return ch;
  if (t.tipus !== TANUSITVANY_TIPUS) return 'ez nem készülék-tanúsítvány';
  if (typeof t.azonossag !== 'string' || !AZONOSITO.test(t.azonossag)) return 'a tanúsítvány azonossága egy nyilvános kulcs';
  if (typeof t.keszulek !== 'string' || !AZONOSITO.test(t.keszulek)) return 'a tanúsítvány készüléke egy nyilvános kulcs';
  if (t.azonossag === t.keszulek) return 'a készülék kulcsa nem lehet az azonosság kulcsa (D128: az azonosság csak kezel)';
  const sh = szuletesAlakiHibaja(t.szuletes);
  if (sh) return 'a tanúsítvány az azonosság születését hozza: ' + sh;
  if (t.szuletes.kulcs === t.keszulek) return 'a készülék kulcsa nem lehet a kezelő kulcs (D128: az azonosság csak kezel)';
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
  const { szuletes, azonossag, cserek } = await azonossagAdatai(azonossagKulcspar);
  const t = { tipus: TANUSITVANY_TIPUS, azonossag, keszulek, nev, ido };
  const alairas = await crypto.subtle.sign({ name: ALGORITMUS }, azonossagKulcspar.privateKey,
    new TextEncoder().encode(await lenyomat(t)));
  const kesz = { ...t, szuletes, ...(cserek ? { cserek } : {}), alairas: bajtokBase64Url(new Uint8Array(alairas)) };
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
  // ⭐⭐ D128 (②a): a név a születés lenyomata, és a születést az első kulcs írta alá; ⭐⭐ (②b) a kulcscserék lánca után a
  // tanúsítványt a lánc VÉGÉN álló kezelő kulcs írja alá (a korszaka a hozott cserék száma).
  const lanc = await kezeloLancRendben(t.szuletes, t.cserek, t.azonossag);
  if (!lanc.rendben) return { rendben: false, ok: 'a tanúsítvány születése: ' + lanc.ok };
  try {
    const kulcs = await crypto.subtle.importKey('raw', base64UrlBajtok(lanc.kulcsok.at(-1)), { name: ALGORITMUS }, false, ['verify']);
    const jo = await crypto.subtle.verify({ name: ALGORITMUS }, kulcs, base64UrlBajtok(t.alairas),
      new TextEncoder().encode(await lenyomat(tartalma(t))));
    return jo ? { rendben: true } : { rendben: false, ok: 'a tanúsítványt nem az azonosság kulcsa írta alá' };
  } catch (h) {
    return { rendben: false, ok: 'a tanúsítvány nem ellenőrizhető: ' + h.message };
  }
}

// ===================================
// ⭐⭐ D128 (①d — KU7 (A), 9.10): A KIZÁRÁS-TANÚSÍTVÁNY
// ===================================
//
// `{ tipus, azonossag, keszulek, koinok: [{ koino, vagas, orokos }], ido, alairas }` — az azonosság kulcsa írja alá, mint a
// készülék-tanúsítványt; koinók fölött. A `keszulek` a KIZÁRT; koinónként a VÁGÁS (a kizárt lánc utolsó még érvényes sorszáma —
// 0: egy sem) és az ÖRÖKÖS (az azonosság egy másik készüléke, ő folytatja a láncot). ⭐ Ahol egy koinó nincs felsorolva, ott a
// kizárt készülék egyetlen eseménye sem számít (8.2) — a vágás ott 0, örökös nincs. Nem a szabály szigorítása (D47), hanem annak
// kimondása, hogy azok az események nem tőled jöttek.

/** A kizárás-tanúsítvány fajtája (a lenyomatolt tartalom része). */
export const KIZARAS_TIPUS = 'KeszulekKizaras';

/** Egy kizárás legfeljebb ennyi koinót sorol fel. */
export const KIZARAS_KOINO_KORLAT = 256;

const KIZARAS_MEZOK = 'alairas,azonossag,ido,keszulek,koinok,szuletes,tipus';   // ⭐⭐ (②a): a születéssel
const KIZARAS_MEZOK_CSEREKKEL = 'alairas,azonossag,cserek,ido,keszulek,koinok,szuletes,tipus';   // ⭐⭐ (②b): és a lánccal

/** A kizárás aláírt része. */
function kizarasTartalma(k) {
  return { tipus: k.tipus, azonossag: k.azonossag, keszulek: k.keszulek, koinok: k.koinok, ido: k.ido };
}

/**
 * A kizárás-tanúsítvány alakja — szinkron és olcsó. ⚠️ Csak az ALAK (az aláírás a `kizarasEllenorzese`-é).
 * @returns {string|null} a hiba oka, vagy null
 */
export function kizarasAlakiHibaja(k) {
  if (!k || typeof k !== 'object' || Array.isArray(k)) return 'a kizárás egy objektum';
  const mezok = Object.keys(k).sort().join(',');
  if (mezok !== KIZARAS_MEZOK && mezok !== KIZARAS_MEZOK_CSEREKKEL) {
    return 'a kizárás mezői: tipus, azonossag, keszulek, koinok, ido, szuletes, (cserek,) alairas';
  }
  const ch = cserekAlakiHibaja(k.cserek);
  if (ch) return ch;
  const sh = szuletesAlakiHibaja(k.szuletes);
  if (sh) return 'a kizárás az azonosság születését hozza: ' + sh;
  if (k.tipus !== KIZARAS_TIPUS) return 'ez nem kizárás-tanúsítvány';
  if (typeof k.azonossag !== 'string' || !AZONOSITO.test(k.azonossag)) return 'a kizárás azonossága egy nyilvános kulcs';
  if (typeof k.keszulek !== 'string' || !AZONOSITO.test(k.keszulek)) return 'a kizárt készülék egy nyilvános kulcs';
  if (k.azonossag === k.keszulek) return 'az azonosság kulcsa nem zárható ki (az a kulcscsere — ②)';
  if (!Array.isArray(k.koinok) || k.koinok.length > KIZARAS_KOINO_KORLAT) {
    return 'a kizárás koinói egy lista (legfeljebb ' + KIZARAS_KOINO_KORLAT + ')';
  }
  let elozo = null;
  for (const x of k.koinok) {
    if (!x || typeof x !== 'object' || Array.isArray(x) || Object.keys(x).sort().join(',') !== 'koino,orokos,vagas') {
      return 'a kizárás egy koinója: { koino, vagas, orokos }';
    }
    if (typeof x.koino !== 'string' || !x.koino.length || x.koino.length > 200) return 'a kizárás koinója egy név';
    if (elozo !== null && !(x.koino > elozo)) return 'a kizárás koinói rendezve, egyszer';
    elozo = x.koino;
    if (!Number.isSafeInteger(x.vagas) || x.vagas < 0) return 'a vágás egy nemnegatív egész (a még érvényes utolsó sorszám)';
    if (typeof x.orokos !== 'string' || !AZONOSITO.test(x.orokos) || x.orokos === k.keszulek || x.orokos === k.azonossag) {
      return 'az örökös az azonosság egy MÁSIK készüléke';
    }
  }
  if (!Number.isSafeInteger(k.ido) || k.ido < 0) return 'a kizárás ideje egy nemnegatív egész';
  if (typeof k.alairas !== 'string' || !ALAIRAS.test(k.alairas)) return 'a kizárás aláírása 64 bájt';
  return null;
}

/**
 * Az azonosság kulcsa aláírja: „ez a készülék nem az enyém többé — koinónként eddig a sorszámig, onnan az örökös folytatja”.
 * @param {CryptoKeyPair} azonossagKulcspar
 * @param {string} keszulek - a kizárt készülék kulcsa
 * @param {Array<{koino: string, vagas: number, orokos: string}>} koinok
 * @param {number} [ido]
 * @returns {Promise<Object>} a kizárás-tanúsítvány
 */
export async function kizarasKeszitese(azonossagKulcspar, keszulek, koinok, ido = Date.now()) {
  console.log('kizarasKeszitese - KEZDÉS', { koinok: koinok.length });
  const { szuletes, azonossag, cserek } = await azonossagAdatai(azonossagKulcspar);
  const rendezett = [...koinok].map((x) => ({ koino: x.koino, vagas: x.vagas, orokos: x.orokos }))
    .sort((a, b) => (a.koino < b.koino ? -1 : a.koino > b.koino ? 1 : 0));
  const k = { tipus: KIZARAS_TIPUS, azonossag, keszulek, koinok: rendezett, ido };
  const alairas = await crypto.subtle.sign({ name: ALGORITMUS }, azonossagKulcspar.privateKey,
    new TextEncoder().encode(await lenyomat(k)));
  const kesz = { ...k, szuletes, ...(cserek ? { cserek } : {}), alairas: bajtokBase64Url(new Uint8Array(alairas)) };
  const hiba = kizarasAlakiHibaja(kesz);
  if (hiba) throw new Error('kizarasKeszitese: ' + hiba);
  console.log('kizarasKeszitese - VÉGE');
  return kesz;
}

/**
 * Valóban az azonosság kulcsa írta-e alá a kizárást, és változatlan-e?
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function kizarasEllenorzese(k) {
  const hiba = kizarasAlakiHibaja(k);
  if (hiba) return { rendben: false, ok: hiba };
  const lanc = await kezeloLancRendben(k.szuletes, k.cserek, k.azonossag);
  if (!lanc.rendben) return { rendben: false, ok: 'a kizárás születése: ' + lanc.ok };
  try {
    const kulcs = await crypto.subtle.importKey('raw', base64UrlBajtok(lanc.kulcsok.at(-1)), { name: ALGORITMUS }, false, ['verify']);
    const jo = await crypto.subtle.verify({ name: ALGORITMUS }, kulcs, base64UrlBajtok(k.alairas),
      new TextEncoder().encode(await lenyomat(kizarasTartalma(k))));
    return jo ? { rendben: true } : { rendben: false, ok: 'a kizárást nem az azonosság kulcsa írta alá' };
  } catch (h) {
    return { rendben: false, ok: 'a kizárás nem ellenőrizhető: ' + h.message };
  }
}

/**
 * A kizárás egy koinóban: a vágás és az örökös — ha a koinó nincs felsorolva, a vágás 0 (a kizárt egyetlen eseménye sem
 * számít), örökös nincs.
 * @returns {{vagas: number, orokos: string|null}}
 */
export function kizarasKoinoban(k, koino) {
  const x = (k?.koinok ?? []).find((y) => y.koino === koino);
  return x ? { vagas: x.vagas, orokos: x.orokos } : { vagas: 0, orokos: null };
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
  const { azonossag } = await azonossagAdatai(azonossagKulcspar);   // ⭐⭐ D128 (②a): a név a születésből
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
