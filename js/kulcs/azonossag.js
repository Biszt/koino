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

// ===================================
// ⭐⭐ D128 (②b — 7. pont, 14. pont: KC2 (A)): A KULCSCSERE
// ===================================
//
// Ha a kezelő kulcs elvész vagy ellopják, a CSERE-KULCS (a mentésből — KC3 (A)) aláír egy kulcscserét:
//   `{ tipus, azonossag, sorszam, csere, kulcs, kovetkezo, keszulekek, ido, alairas }`
//   · `csere` — a csere-kulcs nyilvános része: a lenyomata az ELŐZŐ lekötés (az első cserénél a születésé, utána az előző cseréé);
//   · `kulcs` — az ÚJ kezelő kulcs; `kovetkezo` — a következő csere-kulcs lenyomata (az új lekötés);
//   · `keszulekek` — a MEGMARADÓ készülékek (KC2 (A)): a régi kulcs által tanúsított többi készülék érvénytelen;
//   · `sorszam` — hányadik csere (1, 2, …): a láncot a sorszám és a lekötések fűzik egymáshoz.
// A NÉV marad (KU3 (A)): a kezelő kulcsot a születés és a cserék lánca mondja meg. A tolvaj, akinél csak a régi kulcs van, nem
// cserélhet kulcsot — a csere-kulcs nincs nála.
//
// ⭐⭐ D128 (②d — 17. pont, 9.13):
//   · `fizetes` — a fizetési kulcs nyilvános része a csere UTÁN (a születésé a lánc elején): a kulcscsere ezt is cserélheti (a 9.13
//     (c) rése — a fizetési kulcs titkos fele a kezelő kulcs mellett van, a laptop tolvaja azt is viszi);
//   · `kovetkezo: null` — a PAPÍR VISSZAVONÁSA (a 2. lépcsőn): a papír aláír egy utolsó bejegyzést, ami a kezelő kulcsot nem cseréli
//     (`kulcs` = a mostani), és a lekötése „a segítők” — utána csere-kulcs nem írhat alá; a helyreállítás a segítőké (②e).
//   · A KULCS-KORSZAK a KULCSVÁLTÁSOK száma (`kulcsKorszak`): a visszavonás nem nyit új korszakot — senki nem esik ki miatta.
//   · Két ág közül (ugyanaz a lekötés két bejegyzést írt alá — csak egy lopott vagy másolt papírral lehet) az ELTÉRÉS HELYÉN álló
//     bejegyzés ereje dönt (`lancErosebbE`): a visszavonás erősebb a papír kulcscseréjénél (a ②e-ben a segítők mindkettőnél) — a
//     „hosszabb nyer” helyett, amit a papír tolvaja a saját ágán tetszés szerint megnyerhetett volna (a 9.13 (b) rése).

/** A kulcscsere fajtája. */
export const KULCSCSERE_TIPUS = 'AzonossagKulcscsere';

/** Egy azonosság legfeljebb ennyi kulcscserét hordoz egy tanúsítványban (a lánc). */
export const KULCSCSERE_KORLAT = 16;

/** Egy kulcscsere legfeljebb ennyi megmaradó készüléket sorol fel. */
export const MARADO_KORLAT = 64;

const KULCSCSERE_MEZOK = 'alairas,azonossag,csere,fizetes,ido,keszulekek,kovetkezo,kulcs,sorszam,tipus';

/** A kulcscsere aláírt része (ezt írja alá a csere-kulcs). */
export function kulcscsereTartalma(c) {
  return { tipus: c.tipus, azonossag: c.azonossag, sorszam: c.sorszam, csere: c.csere, kulcs: c.kulcs, kovetkezo: c.kovetkezo,
    keszulekek: c.keszulekek, fizetes: c.fizetes, ido: c.ido };
}

/**
 * A kulcscsere alakja — szinkron. ⚠️ Csak az ALAK (a lánc és az aláírás a `kezeloKulcsLanc`-é).
 * @returns {string|null}
 */
export function kulcscsereAlakiHibaja(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return 'a kulcscsere egy objektum';
  if (Object.keys(c).sort().join(',') !== KULCSCSERE_MEZOK) {
    return 'a kulcscsere mezői: tipus, azonossag, sorszam, csere, kulcs, kovetkezo, keszulekek, fizetes, ido, alairas';
  }
  if (c.tipus !== KULCSCSERE_TIPUS) return 'ez nem kulcscsere';
  for (const m of ['azonossag', 'csere', 'kulcs', 'fizetes']) {
    if (typeof c[m] !== 'string' || !AZONOSITO.test(c[m])) return 'a kulcscsere ' + m + ' mezője 43 jel';
  }
  // ⭐⭐ (②d) a `null` a papír visszavonása (a lekötés ezentúl a segítőké)
  if (c.kovetkezo !== null && (typeof c.kovetkezo !== 'string' || !AZONOSITO.test(c.kovetkezo))) {
    return 'a kulcscsere kovetkezo mezője 43 jel (vagy null: a papír visszavonása)';
  }
  if (c.csere === c.kulcs) return 'az új kezelő kulcs nem lehet a csere-kulcs';
  if (!Number.isSafeInteger(c.sorszam) || c.sorszam < 1 || c.sorszam > KULCSCSERE_KORLAT) {
    return 'a kulcscsere sorszáma 1–' + KULCSCSERE_KORLAT;
  }
  const k = c.keszulekek;
  if (!Array.isArray(k) || k.length > MARADO_KORLAT || !k.every((x) => typeof x === 'string' && AZONOSITO.test(x))) {
    return 'a megmaradó készülékek listája (legfeljebb ' + MARADO_KORLAT + ' kulcs)';
  }
  for (let i = 1; i < k.length; i++) if (!(k[i] > k[i - 1])) return 'a megmaradó készülékek rendezve, egyszer';
  if (!Number.isSafeInteger(c.ido) || c.ido < 0) return 'a kulcscsere ideje egy nemnegatív egész';
  if (typeof c.alairas !== 'string' || !ALAIRAS.test(c.alairas)) return 'a kulcscsere aláírása 64 bájt';
  return null;
}

/**
 * A kulcscsere elkészítése — a CSERE-KULCS írja alá (a mentésből; a gépen nem marad).
 * @param {CryptoKeyPair} csereKulcspar - a mostani csere-kulcs (a lenyomata a mostani lekötés)
 * @param {string} azonossag - a név
 * @param {number} sorszam - hányadik csere
 * @param {string} kulcs - az új kezelő kulcs nyilvános része
 * @param {string|null} kovetkezo - a következő csere-kulcs lenyomata (`csereLenyomata`) — ⭐ (②d) `null`: a papír visszavonása
 * @param {Array<string>} keszulekek - a megmaradó készülékek kulcsai
 * @param {string} fizetes - ⭐ (②d) a fizetési kulcs nyilvános része a csere után
 * @param {number} [ido]
 * @returns {Promise<Object>}
 */
export async function kulcscsereKeszitese(csereKulcspar, azonossag, sorszam, kulcs, kovetkezo, keszulekek, fizetes, ido = Date.now()) {
  console.log('kulcscsereKeszitese - KEZDÉS', { sorszam, marado: keszulekek.length, visszavonas: kovetkezo === null });
  const csere = bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', csereKulcspar.publicKey)));
  const c = { tipus: KULCSCSERE_TIPUS, azonossag, sorszam, csere, kulcs, kovetkezo, keszulekek: [...new Set(keszulekek)].sort(),
    fizetes, ido };
  const alairas = await crypto.subtle.sign({ name: ALGORITMUS }, csereKulcspar.privateKey, new TextEncoder().encode(await lenyomat(c)));
  const kesz = { ...c, alairas: bajtokBase64Url(new Uint8Array(alairas)) };
  const hiba = kulcscsereAlakiHibaja(kesz);
  if (hiba) throw new Error('kulcscsereKeszitese: ' + hiba);
  console.log('kulcscsereKeszitese - VÉGE');
  return kesz;
}

/**
 * ⭐⭐ A KEZELŐ KULCSOK LÁNCA — a születésből és a kulcscserékből: bejegyzésenként a kezelő kulcs (a 0. a születésé), a megmaradó
 * készülékek (a 0.-ban nincs ilyen lista) és a fizetési kulcs. Minden csere: az alakja jó, a név ugyanaz, a sorszáma a következő, a
 * csere-kulcsa az előző lekötésnek felel meg (a lenyomata), és a csere-kulcs írta alá. ⭐ (②d) A papír visszavonása után (a lekötés
 * `null`) csere-kulcs nem írhat alá.
 * ⭐⭐ (②e2) A HELYREÁLLÍTÁS bejegyzése (`AzonossagHelyreallitas`) nem aláírt: a segítők jóváhagyták — a bizonyítékát a kapu
 * ellenőrizte (`allapot/helyreallitas.js`), és a jelét felvette (`helyreallitasFelvetele`), vagy a hívó adja
 * (`beallitas.helyreallitasok`). A helye a láncban: a sorszáma, és az előző bejegyzés jele (`utan`); a lekötés nem köti (a segítők a
 * papír fölött állnak — a visszavonás után is).
 * @param {Object} szuletes
 * @param {Array<Object>} cserek - a kulcscserék (és helyreállítások), sorrendben (lehet üres)
 * @param {string} nev - a név (a születés lenyomata)
 * @param {{helyreallitasok?: Set<string>}} [beallitas] - az ismert (ellenőrzött) helyreállítások jelei
 * @returns {Promise<{rendben: boolean, ok?: string, kulcsok?: Array<string>, marado?: Array<Array<string>|null>,
 *   fizetesek?: Array<string>, lekotes?: string|null}>}
 */
export async function kezeloKulcsLanc(szuletes, cserek, nev, beallitas = {}) {
  const sz = await szuletesEllenorzese(szuletes, nev);
  if (!sz.rendben) return { rendben: false, ok: sz.ok };
  const lista = cserek ?? [];
  if (!Array.isArray(lista) || lista.length > KULCSCSERE_KORLAT) return { rendben: false, ok: 'a kulcscserék lánca hibás' };
  const kulcsok = [szuletes.kulcs];
  const marado = [null];
  const fizetesek = [szuletes.fizetes];
  let lekotes = szuletes.csere;
  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    const h = lancBejegyzesAlakiHibaja(c);
    if (h) return { rendben: false, ok: 'a ' + (i + 1) + '. kulcscsere: ' + h };
    if (c.azonossag !== nev || c.sorszam !== i + 1) return { rendben: false, ok: 'a ' + (i + 1) + '. kulcscsere nem ennek a láncnak a része' };
    // ⭐⭐ (②e2) A HELYREÁLLÍTÁS: a helye (az előző bejegyzés jele), a jele (a tartalomé), és hogy a bizonyítéka ismert.
    if (c.tipus === HELYREALLITAS_BEJEGYZES) {
      if (c.utan !== (i ? bejegyzesJele(lista[i - 1]) : null)) {
        return { rendben: false, ok: 'a ' + (i + 1) + '. bejegyzés (helyreállítás) nem az előző bejegyzés után áll' };
      }
      if (c.jel !== await helyreallitasJele(javaslatResze(c))) {
        return { rendben: false, ok: 'a ' + (i + 1) + '. bejegyzés (helyreállítás) jele nem a tartalmáé' };
      }
      if (!(beallitas.helyreallitasok?.has(c.jel) || ISMERT_HELYREALLITASOK.has(c.jel))) {
        return { rendben: false, ok: 'a ' + (i + 1) + '. bejegyzés (helyreállítás) bizonyítéka még nem ismert (D128 17. pont)', hianyzik: true };
      }
      kulcsok.push(c.kulcs);
      marado.push(c.keszulekek);
      fizetesek.push(c.fizetes);
      lekotes = c.kovetkezo;
      continue;
    }
    if (lekotes === null) {
      return { rendben: false, ok: 'a ' + (i + 1) + '. kulcscsere: a papírt visszavonták — csere-kulcs már nem írhat alá (D128 17. pont)' };
    }
    if (await csereLenyomata(c.csere) !== lekotes) {
      return { rendben: false, ok: 'a ' + (i + 1) + '. kulcscsere csere-kulcsa nem a lekötött (a tolvaj nem cserélhet kulcsot)' };
    }
    try {
      const k = await crypto.subtle.importKey('raw', base64UrlBajtok(c.csere), { name: ALGORITMUS }, false, ['verify']);
      const jo = await crypto.subtle.verify({ name: ALGORITMUS }, k, base64UrlBajtok(c.alairas),
        new TextEncoder().encode(await lenyomat(kulcscsereTartalma(c))));
      if (!jo) return { rendben: false, ok: 'a ' + (i + 1) + '. kulcscserét nem a csere-kulcs írta alá' };
    } catch (h2) {
      return { rendben: false, ok: 'a ' + (i + 1) + '. kulcscsere nem ellenőrizhető: ' + h2.message };
    }
    kulcsok.push(c.kulcs);
    marado.push(c.keszulekek);
    fizetesek.push(c.fizetes);
    lekotes = c.kovetkezo;
  }
  return { rendben: true, kulcsok, marado, fizetesek, lekotes };
}

/**
 * ⭐⭐ D128 (②d): a KULCS-KORSZAK — hány KULCSVÁLTÁS van a láncban, és az utolsó kulcsváltás megmaradó készülékei. A kezelő kulcsot
 * nem cserélő bejegyzés (a papír visszavonása) nem nyit új korszakot: miatta senki nem esik ki. Szinkron, tiszta (a mag része).
 * @param {string|undefined} szuletesKulcs - a születés kulcsa (a 0. korszaké)
 * @param {Array<Object>|undefined} cserek
 * @returns {{korszak: number, marado: Array<string>|null}}
 */
export function kulcsKorszak(szuletesKulcs, cserek) {
  let korszak = 0;
  let marado = null;
  let elozo = szuletesKulcs;
  for (const c of cserek ?? []) {
    if (c?.kulcs === elozo) continue;
    korszak++;
    marado = Array.isArray(c?.keszulekek) ? c.keszulekek : [];
    elozo = c?.kulcs;
  }
  return { korszak, marado };
}

/**
 * Egy bejegyzés EREJE két ág eltérésénél: a papír kulcscseréje 0, a papír visszavonása 1, a segítők helyreállítása 2 (az 1. kör), ill.
 * 3 (a megállítás utáni 2. kör) — a segítők a papír fölött állnak (9.13 4. pont).
 */
function bejegyzesEreje(c) {
  if (c?.tipus === HELYREALLITAS_BEJEGYZES) return 1 + (c.kor === 2 ? 2 : 1);
  return c?.kovetkezo === null ? 1 : 0;
}

/** ⭐⭐ (②e2) Egy lánc-bejegyzés JELE: a kulcscseréé az aláírása, a helyreállításé a javaslat jele. */
export function bejegyzesJele(c) {
  return c?.tipus === HELYREALLITAS_BEJEGYZES ? c?.jel : c?.alairas;
}

/**
 * ⭐⭐ D128 (②d): két kulcscsere-lánc közül az ERŐSEBB-e az `a` (ugyanannak a névnek két ága). Ha az egyik a másik eleje, a hosszabb
 * (a folytatás) erősebb; különben az ELTÉRÉS HELYÉN álló bejegyzés ereje dönt, holtversenyben a kisebb aláírás. ⛔ Nem a hosszabb
 * ág nyer: a papír tolvaja a saját ágát tetszés szerint hosszabbíthatná (9.13 (b)). Szinkron, tiszta (a mag része).
 * @param {Array<Object>} a
 * @param {Array<Object>} b
 * @returns {boolean}
 */
export function lancErosebbE(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && bejegyzesJele(a[i]) === bejegyzesJele(b[i])) i++;
  if (i === n) return a.length > b.length;
  const ea = bejegyzesEreje(a[i]);
  const eb = bejegyzesEreje(b[i]);
  if (ea !== eb) return ea > eb;
  return bejegyzesJele(a[i]) < bejegyzesJele(b[i]);
}

/**
 * ⭐⭐ D128 (②d): az `elotag` lánc eleje-e a `lanc`-nak (az aláírásaik szerint) — egy tanúsítvány a NYERTES ágon született-e.
 * @param {Array<Object>|undefined} elotag
 * @param {Array<string>} alairasok - a nyertes lánc aláírásai
 * @returns {boolean}
 */
export function lancElejeE(elotag, alairasok) {
  const e = elotag ?? [];
  if (e.length > alairasok.length) return false;
  for (let i = 0; i < e.length; i++) if (bejegyzesJele(e[i]) !== alairasok[i]) return false;
  return true;
}

// ===================================
// ⭐⭐ D128 (②e — 17. pont, 9.13): A HELYREÁLLÍTÁS JAVASLATA
// ===================================
//
// Ha minden elveszett (vagy a kezelő kulcs egy tolvajnál van), az azonosságot a SEGÍTŐK állítják helyre: egy régi ismerős és két
// élő tanúsító (vagy tíz bemutatkozó és két élő tanúsító) jóváhagyja a JAVASLATOT, és a várakozás után a készülékük véglegesíti
// (`allapot/helyreallitas.js`). A javaslat:
//   `{ kulcs, keszulekek, fizetes, kovetkezo, kor, elozo, sorszam, utan, ido }`
//   · `kulcs` — az új kezelő kulcs; `keszulekek` — a megmaradó régi készülékek (üres is lehet); `fizetes` — az új fizetési kulcs;
//   · `kovetkezo` — az 1. lépcsőn az új papír lekötése, a 2. lépcsőn `null` (ott nincs papír);
//   · `kor` — 1, vagy 2 (egy megállított 1. kör után: `elozo` az 1. kör jele);
//   · `sorszam`, `utan` — a lánc HELYE, amit folytat: a sorszáma, és az előző bejegyzés jele (az 1. helyen `null`);
//   · `ido` — a javaslat ideje (tájékoztató; a várakozást a segítők készülékei mérik, a saját órájukon).
// A JELE a tartalom lenyomata — a jóváhagyások és a megállítás erre hivatkoznak.

/** A helyreállítás köre: 1, és egy megállított 1. kör után 2. */
export const HELYREALLITAS_KOROK = [1, 2];

const JAVASLAT_MEZOK = 'elozo,fizetes,ido,keszulekek,kor,kovetkezo,kulcs,sorszam,utan';

/**
 * A helyreállítás javaslatának alakja — szinkron. ⚠️ Csak az ALAK (a jóváhagyások szabálya az `allapot/helyreallitas.js`-é).
 * @returns {string|null}
 */
export function helyreallitasJavaslatAlakiHibaja(j) {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return 'a javaslat egy objektum';
  if (Object.keys(j).sort().join(',') !== JAVASLAT_MEZOK) {
    return 'a javaslat mezői: kulcs, keszulekek, fizetes, kovetkezo, kor, elozo, sorszam, utan, ido';
  }
  for (const m of ['kulcs', 'fizetes']) if (typeof j[m] !== 'string' || !AZONOSITO.test(j[m])) return 'a javaslat ' + m + ' mezője 43 jel';
  if (j.kovetkezo !== null && (typeof j.kovetkezo !== 'string' || !AZONOSITO.test(j.kovetkezo))) {
    return 'a javaslat kovetkezo mezője 43 jel (vagy null: a 2. lépcsőn nincs papír)';
  }
  const k = j.keszulekek;
  // ⭐ (②f) üres is lehet: ha minden elveszett, egyetlen régi készülék sem marad (az új a helyreállítás UTÁN, az új kulccsal kerül fel)
  if (!Array.isArray(k) || k.length > MARADO_KORLAT || !k.every((x) => typeof x === 'string' && AZONOSITO.test(x))) {
    return 'a javaslat készülékei: 0–' + MARADO_KORLAT + ' kulcs';
  }
  for (let i = 1; i < k.length; i++) if (!(k[i] > k[i - 1])) return 'a javaslat készülékei rendezve, egyszer';
  if (!HELYREALLITAS_KOROK.includes(j.kor)) return 'a javaslat köre 1 vagy 2';
  if (j.kor === 1 ? j.elozo !== null : (typeof j.elozo !== 'string' || !AZONOSITO.test(j.elozo))) {
    return 'az 1. kör javaslata előzmény nélküli, a 2. köré a megállított 1. kör jelét nevezi meg';
  }
  if (!Number.isSafeInteger(j.sorszam) || j.sorszam < 1 || j.sorszam > KULCSCSERE_KORLAT) {
    return 'a javaslat sorszáma 1–' + KULCSCSERE_KORLAT;
  }
  if (j.sorszam === 1 ? j.utan !== null
    : (typeof j.utan !== 'string' || !(AZONOSITO.test(j.utan) || ALAIRAS.test(j.utan)))) {
    return 'a javaslat az előző bejegyzés jele után áll (az 1. helyen null)';
  }
  if (!Number.isSafeInteger(j.ido) || j.ido < 0) return 'a javaslat ideje egy nemnegatív egész';
  return null;
}

/** A javaslat JELE — a tartalom lenyomata (a jóváhagyások és a megállítás erre hivatkoznak). */
export async function helyreallitasJele(j) {
  return lenyomat({ tipus: 'HelyreallitasJavaslat', ...j });
}

/** A javaslat jele szinkron. */
export function helyreallitasJeleSzinkron(j) {
  return lenyomatSzinkron({ tipus: 'HelyreallitasJavaslat', ...j });
}

// ===== ⭐⭐ D128 (②e2): A HELYREÁLLÍTÁS A LÁNCBAN =====
//
// A teljes helyreállítás (a segítők mindkét fázisa megvan — `allapot/helyreallitas.js`) a kulcscserék láncába egy
// `AzonossagHelyreallitas` bejegyzéssel kerül: `{ tipus, azonossag, ...a javaslat, jel }`. Nem aláírt — a bizonyítéka (a
// `Kulcscsere` esemény hozza) a segítők eseményei; a kapu ellenőrzi, és a jelét a NYILVÁNTARTÁSBA veszi: a tanúsítványok és a
// kézfogás (tár nélkül, szinkron is) innen tudják, hogy a bejegyzés hiteles. ⚠️ A nyilvántartás folyamatonként él (a kapu tölti — a
// tárban lévő `Kulcscsere` eseményekből is); amit nem ismer, az „még nem ismert” (D19 — nem vád).

/** A helyreállítás bejegyzésének fajtája (a kulcscserék láncában). */
export const HELYREALLITAS_BEJEGYZES = 'AzonossagHelyreallitas';

const HELYREALLITAS_BEJEGYZES_MEZOK = 'azonossag,elozo,fizetes,ido,jel,keszulekek,kor,kovetkezo,kulcs,sorszam,tipus,utan';

/** A bejegyzés javaslat-része (ennek a lenyomata a jel). */
export function javaslatResze(c) {
  return { kulcs: c.kulcs, keszulekek: c.keszulekek, fizetes: c.fizetes, kovetkezo: c.kovetkezo, kor: c.kor, elozo: c.elozo,
    sorszam: c.sorszam, utan: c.utan, ido: c.ido };
}

/** A helyreállítás bejegyzésének alakja — szinkron. */
export function helyreallitasBejegyzesAlakiHibaja(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return 'a helyreállítás bejegyzése egy objektum';
  if (Object.keys(c).sort().join(',') !== HELYREALLITAS_BEJEGYZES_MEZOK) {
    return 'a helyreállítás bejegyzése: tipus, azonossag, jel és a javaslat mezői';
  }
  if (c.tipus !== HELYREALLITAS_BEJEGYZES) return 'ez nem a helyreállítás bejegyzése';
  if (typeof c.azonossag !== 'string' || !AZONOSITO.test(c.azonossag)) return 'a helyreállítás azonossága 43 jel';
  if (typeof c.jel !== 'string' || !AZONOSITO.test(c.jel)) return 'a helyreállítás jele 43 jel';
  return helyreallitasJavaslatAlakiHibaja(javaslatResze(c));
}

/** Egy lánc-bejegyzés alakja — a kulcscseréé vagy a helyreállításé. */
export function lancBejegyzesAlakiHibaja(c) {
  return c?.tipus === HELYREALLITAS_BEJEGYZES ? helyreallitasBejegyzesAlakiHibaja(c) : kulcscsereAlakiHibaja(c);
}

/** A helyreállítás bejegyzése egy (teljes) javaslatból. */
export async function helyreallitasBejegyzese(azonossag, javaslat) {
  return { tipus: HELYREALLITAS_BEJEGYZES, azonossag, ...javaslat, jel: await helyreallitasJele(javaslat) };
}

/** Az ellenőrzött (a bizonyítékát a kapu látta) helyreállítások jelei — folyamatonként. */
const ISMERT_HELYREALLITASOK = new Set();

/** Egy helyreállítás jele ismert-e (a bizonyítékát ellenőrizték). */
export function helyreallitasIsmertE(jel) {
  return ISMERT_HELYREALLITASOK.has(jel);
}

/** Egy ellenőrzött helyreállítás felvétele (a kapu — a bizonyíték után, vagy a tárban lévő eseményekből). */
export function helyreallitasFelvetele(jel) {
  if (typeof jel === 'string' && AZONOSITO.test(jel)) ISMERT_HELYREALLITASOK.add(jel);
}

/** A csere-kulcs lenyomata szinkron (a kézfogás láncához — `csere/titkositas.js`). */
export function csereLenyomataSzinkron(csereNyilvanos) {
  return lenyomatSzinkron({ tipus: 'CsereKulcs', kulcs: csereNyilvanos });
}
