// js/kulcs/kulcsTar.js

// Felelősség: a saját kulcspár létrehozása, tárolása, betöltése, kimentése és VISSZATÖLTÉSE.
//
// A KULCS A KOINÓBAN NEM JELSZÓ, HANEM SZEMÉLYAZONOSSÁG (D15): nem titkol, hanem
// HITELESÍT. A nyilvános fele a „neved" a hálózaton (32 bájt), a privát felével írod alá
// a cselekedeteidet. Nincs fiók, nincs jelszó, nincs bejelentkezés — a kulcs maga vagy te.
//
// EGY KULCS AZ EGÉSZ BELÉPŐ TÉRBEN (D25, Csaba döntése 2026-08-26): ugyanaz a kulcs
// azonosít a tér minden koinójában, mert csak így „jönnek át" a tanúsítások. A
// megjelenített NÉV viszont koinónként külön lehet.
//
// Ed25519-et használunk, a futtatókörnyezet saját WebCryptójából — mérve: a böngészőben
// és a Node-ban IS elérhető, külső kriptográfiai könyvtár nélkül. Ez egy olyan programnál,
// aminek a lényege, hogy senkiben nem kell megbízni, több mint kényelem.
//
// ⚠️ A TÁROLÓT KÍVÜLRŐL KAPJA (D29, 2026-08-28). Ez a fájl a kulcs LOGIKÁJÁT tudja
// (létrehozás, kimentés, visszatöltés); hogy hol lakik, azt a tároló dönti el
// (`olvas`/`ir`). Így a kulcs-kezelés egy példányban él, futtatókörnyezettől függetlenül.
//
// Használják: a program indulása és minden művelet; a `mentes` és a `visszatolt` parancs.
//
// ⚠️⚠️ 2026-09-15-IG EZ A FEJLÉC IGAZAT MONDOTT A LOGIKÁRÓL, ÉS MÉGIS FÉLREVEZETETT: a
// „visszatöltés" tényleg itt volt — de **senki nem hívta**, mert nem volt hozzá parancs.
// *Egy réteg, ami tud valamit, amit a kéz nem ér el, a 4. szabály szerint nincs kész.*

// ⚠️⚠️ A `bajtokBase64Url` ITT EGYSZER MÁR MÁSODPÉLDÁNYBAN ÉLT (2026-09-06-ig). Kívülről
// ártalmatlannak látszott — nyolc sor, és bájtra ugyanaz, mint a `kanonikusAlak.js`-beli.
// ⭐ De MINDKETTŐ AZONOSÍTÓT GYÁRT: ez itt a nyilvános kulcs nevét, az ott az esemény nevét.
// Ha valaha egyetlen karakterben eltérnek, két gép NÉMÁN ad más nevet ugyanannak — pontosan
// az a hibafajta, ami ellen a `kanonikusAlak.js` fejléce figyelmeztet. Egy kommentár erre
// nem védelem, csak illemtan; ezért nem megjegyzés került ide, hanem az egyik példány
// megszűnt. *Egy azonosító-számítás, egy helyen.*
//
// ⚠️ ÉS AMIÉRT EZ NEM SÉRTI A RÉTEGZÉST: a `kanonikusAlak.js` a fa LEGALSÓ modulja — ő maga
// SEMMIT nem importál, és ugyanazokra a futtatókörnyezeti alapokra épül (`btoa`,
// `TextEncoder`), mint ez a fájl. Nem az „esemény-réteget" hozzuk be, hanem a bájt-szintű
// alapot, ami alatta van.

import { bajtokBase64Url } from '../esemeny/kanonikusAlak.js';
// ⭐⭐ D128 (②a — KC1 (A)): az azonosság születése (a név a lenyomata).
import { ujAzonossag, szuletesKeszitese, szuletesEllenorzese, csereLenyomata, azonossagNeve, kezeloKulcsLanc, kulcscsereKeszitese,
  HELYREALLITAS_BEJEGYZES, helyreallitasFelvetele }
  from './azonossag.js';

// ⭐ Változatlanul innen is elérhető marad: aki a kulcs-réteget használja, tipikusan a
// kulcs olvasható alakja miatt nyúl a bájt-átalakítóhoz is. Egy megvalósítás, két kapu.
export { bajtokBase64Url };

// ===== ÁLLANDÓK =====

// Az algoritmus neve — a WebCrypto Ed25519-nél se kulcsgeneráláshoz, se aláíráshoz nem
// kér más paramétert (nincs görbe- és nincs hash-választás: ez a fajta egyszerűség épp
// az Ed25519 egyik erénye).
const ALGORITMUS = 'Ed25519';

// ===================================
// KULCSPÁR LÉTREHOZÁSA
// ===================================

/**
 * Új kulcspárt hoz létre, és elmenti a tárolóba.
 *
 * A privát kulcs KIMENTHETŐ (`extractable: true`) — Csaba döntése (2026-08-26). Indok: a
 * kulcsvesztés valós, hétköznapi kockázat, a mentés viszont egy lépés, míg a több-tanús
 * helyreállítás (D15) emberi és lassú.
 *
 * @param {Object} tarolo - { olvas, ir }
 * @returns {Promise<CryptoKeyPair>}
 */
export async function kulcsparLetrehozasa(tarolo) {
  console.log('kulcsparLetrehozasa - KEZDÉS');
  // ⭐⭐ D128 (②a — KC1 (A)): az azonosság SZÜLETÉSSEL jön létre — az első kulcs, a csere-kulcs (lenyomata) és a fizetési kulcs;
  // a név a születés lenyomata. A csere-kulcsot a hívó adja ki (KC3 (A) — a gépen nem marad).
  const { kulcspar, csere, fizetes, szuletes } = await ujAzonossag();
  await azonossagMentese(tarolo, kulcspar, szuletes, fizetes);
  kulcspar.szuletes = szuletes;
  console.log('kulcsparLetrehozasa - VÉGE');
  return { kulcspar, csere };
}

/** ⭐⭐ D128 (②a): az azonosság a tárolóba — a kezelő kulcs, a születése (a név), a fizetési kulcs. */
async function azonossagMentese(tarolo, kulcspar, szuletes, fizetes) {
  const fizetesKulcs = (await kulcsparLeirasa(fizetes)).privatKulcs;
  await tarolo.ir({ ...(await kulcsparLeirasa(kulcspar)), nev: await azonossagNeve(szuletes), szuletes, fizetesKulcs });
  kulcspar.fizetesKulcs = fizetesKulcs;
}

// ===================================
// KULCSPÁR BETÖLTÉSE
// ===================================

/**
 * Betölti a tárolóban lévő kulcspárt.
 * @param {Object} tarolo
 * @returns {Promise<CryptoKeyPair|null>} null, ha még nincs kulcs
 */
export async function kulcsparBetoltese(tarolo) {
  console.log('kulcsparBetoltese - KEZDÉS');

  const leiras = await tarolo.olvas();
  if (!leiras) {
    console.log('kulcsparBetoltese - VÉGE (még nincs kulcs)');
    return null;
  }
  // ⭐⭐ D128 (④a — KF1 (A), ET-3/4 (A)): a KEZELŐ NÉLKÜLI azonosság (egy felvett készülék — a telefon): a név, a születés és a lánc,
  // titkos kulcs nélkül. A kezelést kívánó parancsok kimondják, hogy ez a kezelő készüléken megy.
  if (leiras.mi === KEZELO_NELKULI) {
    if (!leiras.szuletes || !(await szuletesEllenorzese(leiras.szuletes)).rendben
        || (await azonossagNeve(leiras.szuletes)) !== leiras.nev) {
      throw new Error('A gépen lévő (kezelő nélküli) azonosság sérült — a fájl: ' + tarolo.fajl);
    }
    const cserek = Array.isArray(leiras.cserek) ? leiras.cserek : [];
    for (const c of cserek) if (c?.tipus === HELYREALLITAS_BEJEGYZES) helyreallitasFelvetele(c.jel);
    console.log('kulcsparBetoltese - VÉGE (kezelő nélküli)');
    return { privateKey: null, publicKey: null, szuletes: leiras.szuletes, ...(cserek.length ? { cserek } : {}), kezeloNelkul: true };
  }

  // ⭐⭐ D128 (②a): a születés — ha a tárolóban van, és ehhez a kulcshoz tartozik (az első kulcs írta alá). ⚠️ A régi (születés
  // nélküli) kulcsfájlnak a `kulcsparBiztositasa` ad születést — a név ezzel MEGVÁLTOZIK (új koinó-család).
  const kulcspar = await azonossagRaTetele(await kulcsparLeirasbol(leiras), leiras);
  console.log('kulcsparBetoltese - VÉGE (megvan)', { szuletes: !!kulcspar.szuletes });
  return kulcspar;
}

/** ⭐⭐ D128 (④a): a kezelő nélküli azonosság leírásának fajtája. */
export const KEZELO_NELKULI = 'koino-azonossag-keszulek';

/**
 * ⭐⭐ D128 (④a — KF1 (A)): egy FELVETT készülék azonossága a tárolóba — a név, a születés és a lánc (a kezelő küldte a párosításban),
 * titkos kulcs NÉLKÜL: ez a készülék csak a saját készülékkulcsával ír (a tanúsítványa a `keszulek.json`-ban).
 * @param {Object} tarolo
 * @param {{szuletes: Object, cserek?: Array<Object>}} azonossag
 * @returns {Promise<string>} a név
 */
export async function kezeloNelkuliAzonossagMentese(tarolo, { szuletes, cserek = [] }) {
  if (!szuletes || !(await szuletesEllenorzese(szuletes)).rendben) throw new Error('A kapott azonosság születése nem hiteles.');
  const nev = await azonossagNeve(szuletes);
  await tarolo.ir({ mi: KEZELO_NELKULI, valtozat: 1, nev, szuletes, ...(cserek.length ? { cserek } : {}) });
  return nev;
}

/**
 * Betölti a meglévő kulcspárt, vagy létrehoz egy újat, ha még nincs.
 * @param {Object} tarolo
 * @returns {Promise<{kulcspar: CryptoKeyPair, ujE: boolean}>}
 */
export async function kulcsparBiztositasa(tarolo) {
  console.log('kulcsparBiztositasa - KEZDÉS');

  const meglevo = await kulcsparBetoltese(tarolo);
  // ⛔⛔ D128 (②f — a próba fogta meg): ha a tárolt azonosságnak VAN születése, de nem tölthető be (a lánca nem ellenőrizhető, vagy a
  // kulcs nem a lánc végéé), az NEM a régi alak — új születés helyett megállunk: egy újraszületés némán új nevet adna, és az azonosság
  // (a pontok, a pénztárca) elveszne.
  if (meglevo && !meglevo.szuletes && (await tarolo.olvas())?.szuletes) {
    throw new Error('A gépen lévő azonosság nem tölthető be (a lánca nem ellenőrizhető, vagy a kulcs nem a lánc végéé) — '
      + 'új születést NEM adunk (a neved megváltozna). A fájl: ' + tarolo.fajl);
  }
  if (meglevo?.szuletes) {
    console.log('kulcsparBiztositasa - VÉGE (meglévő kulcs)');
    return { kulcspar: meglevo, ujE: false, csere: null };
  }
  if (meglevo) {
    // ⭐⭐ D128 (②a): a régi (születés nélküli) kulcs születést kap — új csere-kulccsal és fizetési kulccsal; a NÉV megváltozik.
    const ujak = await ujAzonossag();
    const nyilvanos = async (k) => nyilvanosKulcsSzovegesen(k.publicKey);
    const szuletes = await szuletesKeszitese(meglevo, await csereLenyomata(await nyilvanos(ujak.csere)), await nyilvanos(ujak.fizetes));
    await azonossagMentese(tarolo, meglevo, szuletes, ujak.fizetes);
    meglevo.szuletes = szuletes;
    console.log('kulcsparBiztositasa - VÉGE (a régi kulcs születést kapott)');
    return { kulcspar: meglevo, ujE: false, csere: ujak.csere, szuletettE: true };
  }

  const { kulcspar, csere } = await kulcsparLetrehozasa(tarolo);
  console.log('kulcsparBiztositasa - VÉGE (ÚJ kulcs készült)');
  return { kulcspar, ujE: true, csere };
}

/**
 * ⭐⭐ D128 (②a — KC3 (A)): a CSERE-KULCS kiadásra — a titkos fele, a név és a figyelmeztetés. A gépen nem maradhat: a hívó
 * kiírja (fájlba), megkéri, hogy vidd el, és töröld (②c: papírra is, szavakkal).
 * @param {CryptoKeyPair} csere
 * @param {string} nev - az azonosság neve
 * @returns {Promise<Object>}
 */
export async function csereKulcsKiadasa(csere, nev) {
  return { mi: 'koino-csere-kulcs', valtozat: 1, nev,
    figyelmeztetes: 'Ez a CSERE-KULCSOD: ha a kulcsod elveszik vagy ellopják, ezzel szerezheted vissza az azonosságodat. '
      + 'Vidd el a gépről (papírra vagy pendrive-ra), és utána TÖRÖLD innen — egy ellopott gépen ne legyen.',
    privatKulcs: await crypto.subtle.exportKey('jwk', csere.privateKey) };
}

// ===================================
// A NYILVÁNOS KULCS OLVASHATÓ ALAKJA
// ===================================

/**
 * A nyilvános kulcs 32 bájtját szöveges azonosítóvá alakítja.
 *
 * base64url alakot használunk (43 karakter), mert rövidebb, mint a hexadecimális (64),
 * és biztonságosan szerepelhet URL-ben és fájlnévben is.
 *
 * @param {CryptoKey} nyilvanosKulcs
 * @returns {Promise<string>}
 */
export async function nyilvanosKulcsSzovegesen(nyilvanosKulcs) {
  const nyersBajtok = await crypto.subtle.exportKey('raw', nyilvanosKulcs);
  return bajtokBase64Url(new Uint8Array(nyersBajtok));
}

/**
 * Rövidített alak a kiíráshoz: az azonosító eleje és vége.
 * (Az emberi szem így ismeri fel; a teljes alak mindig elérhető.)
 * @param {string} azonosito
 * @returns {string}
 */
export function rovidAzonosito(azonosito) {
  if (!azonosito || azonosito.length <= 16) return azonosito;
  return azonosito.slice(0, 8) + '…' + azonosito.slice(-8);
}

// ===================================
// KIMENTÉS ÉS VISSZATÖLTÉS
// ===================================

/**
 * A kulcspár menthető leírása (sima objektum, JSON-ba írható).
 *
 * A privát kulcsot JWK alakban mentjük — ez a WebCrypto szabványos, szöveges formája,
 * amit vissza is tud olvasni. A leírás EGYETLEN dolgot tartalmaz, ami számít: a kulcsot.
 * Aki megszerzi, a nevedben tud aláírni.
 *
 * @param {CryptoKeyPair} kulcspar
 * @returns {Promise<Object>}
 */
export async function kulcsparLeirasa(kulcspar) {
  const privatJwk = await crypto.subtle.exportKey('jwk', kulcspar.privateKey);
  const azonosito = await nyilvanosKulcsSzovegesen(kulcspar.publicKey);

  return {
    mi: 'koino-kulcs',
    valtozat: 1,
    algoritmus: ALGORITMUS,
    azonosito,                       // a nyilvános kulcs olvasható alakja
    mentve: new Date().toISOString(),
    figyelmeztetes: 'Aki ezt a fájlt megszerzi, a nevedben tud aláírni. Őrizd biztos helyen.',
    privatKulcs: privatJwk
  };
}

/**
 * Egy kulcs-leírásból visszaállítja a kulcspárt.
 *
 * A nyilvános kulcs a privátból származik: a JWK `x` mezője MAGA a nyilvános kulcs,
 * ezért nem kell külön menteni — így a leírás kisebb, és nem tud „szétcsúszni".
 *
 * @param {Object} leiras
 * @returns {Promise<CryptoKeyPair>}
 */
export async function kulcsparLeirasbol(leiras) {
  if (leiras?.mi !== 'koino-kulcs') {
    throw new Error('Ez nem koino kulcs-leírás.');
  }

  const privateKey = await crypto.subtle.importKey(
    'jwk', leiras.privatKulcs, { name: ALGORITMUS }, true, ['sign']
  );

  const nyilvanosJwk = {
    kty: leiras.privatKulcs.kty,
    crv: leiras.privatKulcs.crv,
    x: leiras.privatKulcs.x
  };
  const publicKey = await crypto.subtle.importKey(
    'jwk', nyilvanosJwk, { name: ALGORITMUS }, true, ['verify']
  );

  // ⭐⭐ A NÉV A KULCSBÓL JÖN, NEM A FÁJL SZAVÁBÓL.
  //
  // Az `azonosito` mező KÉNYELEM: hogy a mentett fájlba ránézve lássuk, kié. De ő csak
  // BEMONDOTT adat — a valódi azonosító a nyilvános kulcsból SZÁMÍTHATÓ, és ez a kettő
  // eltérhet, ha a fájlt átírták vagy két mentés összekeveredett.
  //
  // ⭐ Ugyanaz az elv, mint a `fajlTar`-nál (*a típus a bájtokból jön, nem a kliens
  // szavából*) és amiért az eseményből kihagytuk az `entitasTipus`-t: **egy második,
  // hazudható forrás ugyanarról nem érték, hanem csapda** — előbb-utóbb valaki a mezőt
  // hiszi el. Itt a tét a személyazonosság (D15), ezért az eltérés NEM jelzés, hanem hiba.
  const szamitott = await nyilvanosKulcsSzovegesen(publicKey);
  if (leiras.azonosito && leiras.azonosito !== szamitott) {
    throw new Error('A kulcs-leírás HAZUDIK: a bemondott azonosító (' + leiras.azonosito
      + ') nem ez a kulcs (' + szamitott + '). A fájlt átírták vagy sérült.');
  }

  return { privateKey, publicKey };
}

/**
 * Kimentés szövegként (ezt írjuk fájlba, ezt viszi el a felhasználó).
 * @param {CryptoKeyPair} kulcspar
 * @returns {Promise<string>}
 */
export async function kulcsparKimentese(kulcspar) {
  if (kulcspar?.kezeloNelkul) {
    throw new Error('Ezen a készüléken nincs az azonosság kulcsa (felvett készülék) — a mentés a kezelő készülékeden megy.');
  }
  // ⭐⭐ D128 (②a): az AZONOSSÁG mentése a születésével és a fizetési kulccsal — e nélkül a visszatöltött kulcs ÚJ születést (új
  // nevet) kapna, és az azonosság elveszne.
  const leiras = await kulcsparLeirasa(kulcspar);
  const szuletes = kulcspar.szuletes;
  return JSON.stringify(szuletes ? { ...leiras, nev: await azonossagNeve(szuletes), szuletes,
    ...(kulcspar.cserek?.length ? { cserek: kulcspar.cserek } : {}),   // ⭐⭐ D128 (②b): a kulcscserék lánca is
    ...(kulcspar.fizetesKulcs ? { fizetesKulcs: kulcspar.fizetesKulcs } : {}) } : leiras, null, 2);
}

/** ⭐⭐ D128 (②a): a leírásból a születés és a fizetési kulcs a kulcspárra — ha a születés ehhez a kulcshoz tartozik. */
async function azonossagRaTetele(kulcspar, leiras) {
  const kulcs = await nyilvanosKulcsSzovegesen(kulcspar.publicKey);
  if (!leiras?.szuletes || !(await szuletesEllenorzese(leiras.szuletes)).rendben) return kulcspar;
  // ⭐⭐ D128 (②b): egy kulcscsere UTÁN a tárolt kulcs a lánc VÉGÉN álló kezelő kulcs (nem a születésé) — a lánc a fájlban van.
  const cserek = Array.isArray(leiras.cserek) ? leiras.cserek : [];
  // ⭐⭐ D128 (②f): a SAJÁT tárolónkban álló helyreállítás hiteles — ide csak a bizonyíték ellenőrzése után került (a befejezés), és
  // aki ezt a fájlt átírhatja, a titkos kulcsot is kicserélhetné. A nyilvántartás folyamatonként él: az új folyamat innen tudja.
  for (const c of cserek) if (c?.tipus === HELYREALLITAS_BEJEGYZES) helyreallitasFelvetele(c.jel);
  const lanc = await kezeloKulcsLanc(leiras.szuletes, cserek, await azonossagNeve(leiras.szuletes));
  if (lanc.rendben && lanc.kulcsok.at(-1) === kulcs) {
    kulcspar.szuletes = leiras.szuletes;
    if (cserek.length) kulcspar.cserek = cserek;
    if (leiras.fizetesKulcs) kulcspar.fizetesKulcs = leiras.fizetesKulcs;
  }
  return kulcspar;
}

/**
 * A gépen lévő azonosság és a PAPÍR (a csere-kulcs) összevetése: az azonosság születéssel bír, a leírás csere-kulcs, ennek az
 * azonosságnak a mostani lekötése — és ⭐ (②d) a papírt még nem vonták vissza.
 * @returns {Promise<{regi: Object, nev: string, csereKulcspar: CryptoKeyPair, cserek: Array<Object>}>}
 */
async function papirAzonossagnak(tarolo, csereLeiras) {
  const regi = await kulcsparBetoltese(tarolo);
  if (!regi?.szuletes) throw new Error('Ezen a gépen nincs születéssel bíró azonosság — nincs mit cserélni.');
  if (csereLeiras?.mi !== 'koino-csere-kulcs' || !csereLeiras.privatKulcs) throw new Error('Ez nem csere-kulcs (koino-csere-kulcs).');
  const nev = await azonossagNeve(regi.szuletes);
  if (csereLeiras.nev && csereLeiras.nev !== nev) throw new Error('Ez a csere-kulcs egy MÁSIK azonosságé.');
  const privateKey = await crypto.subtle.importKey('jwk', csereLeiras.privatKulcs, { name: ALGORITMUS }, true, ['sign']);
  const { kty, crv, x } = csereLeiras.privatKulcs;
  const publicKey = await crypto.subtle.importKey('jwk', { kty, crv, x }, { name: ALGORITMUS }, true, ['verify']);
  const cserek = regi.cserek ?? [];
  const lekotes = cserek.length ? cserek[cserek.length - 1].kovetkezo : regi.szuletes.csere;
  if (lekotes === null) {
    throw new Error('A papírodat már visszavontad (D128 17. pont) — a csere-kulcs nem ír alá többé; a helyreállítás a segítőidé.');
  }
  if (await csereLenyomata(x) !== lekotes) {
    throw new Error('Ez a csere-kulcs nem a mostani lekötés (egy korábbi cseréé, vagy egy másik azonosságé) — vele nem cserélhetsz.');
  }
  return { regi, nev, csereKulcspar: { privateKey, publicKey }, cserek };
}

/**
 * ⭐⭐ D128 (②b — 7. pont, 14. pont: KC2 (A)): A KULCSCSERE a gépen — a csere-kulcs (a mentésből) aláírja: új kezelő kulcs, új
 * lekötés (az új csere-kulcs — kiadásra), és a MEGMARADÓ készülékek. A név marad; a tároló az új kulcsot a lánccal tartja. ⭐ (②d) És
 * új FIZETÉSI kulcs (a régi titkos fele a régi kezelő kulcs mellett volt — aki azt vitte, ezt is: 9.13 (c)).
 * @param {Object} tarolo
 * @param {Object} csereLeiras - a csere-kulcs kiadása (`csereKulcsKiadasa` — `{ mi: 'koino-csere-kulcs', privatKulcs }`)
 * @param {Array<string>} marado - a megmaradó készülékek kulcsai
 * @returns {Promise<{kulcspar: CryptoKeyPair, csere: CryptoKeyPair, kulcscsere: Object, cserek: Array<Object>, nev: string}>}
 */
export async function kulcscsereVegrehajtasa(tarolo, csereLeiras, marado) {
  console.log('kulcscsereVegrehajtasa - KEZDÉS', { marado: marado.length });
  const { regi, nev, csereKulcspar, cserek } = await papirAzonossagnak(tarolo, csereLeiras);
  const uj = () => crypto.subtle.generateKey({ name: ALGORITMUS }, true, ['sign', 'verify']);
  const [kulcspar, ujCsere, ujFizetes] = [await uj(), await uj(), await uj()];
  const kulcscsere = await kulcscsereKeszitese(csereKulcspar, nev, cserek.length + 1,
    await nyilvanosKulcsSzovegesen(kulcspar.publicKey), await csereLenyomata(await nyilvanosKulcsSzovegesen(ujCsere.publicKey)), marado,
    await nyilvanosKulcsSzovegesen(ujFizetes.publicKey));
  const ujCserek = [...cserek, kulcscsere];
  const fizetesKulcs = (await kulcsparLeirasa(ujFizetes)).privatKulcs;
  await tarolo.ir({ ...(await kulcsparLeirasa(kulcspar)), nev, szuletes: regi.szuletes, cserek: ujCserek, fizetesKulcs });
  Object.assign(kulcspar, { szuletes: regi.szuletes, cserek: ujCserek, fizetesKulcs });
  console.log('kulcscsereVegrehajtasa - VÉGE', { sorszam: kulcscsere.sorszam });
  return { kulcspar, csere: ujCsere, kulcscsere, cserek: ujCserek, nev };
}

/**
 * ⭐⭐ D128 (②d — 17. pont, 9.13 5. pont): A PAPÍR VISSZAVONÁSA (a 2. lépcsőn). A papír aláír egy utolsó bejegyzést: a kezelő kulcs
 * és a fizetési kulcs MARAD (új korszak nem nyílik, senki nem esik ki), a lekötés `null` — ezentúl csere-kulcs nem írhat alá; a
 * helyreállítás a segítőké. ⚠️ A papír írja alá, nem a kezelő kulcs: különben a laptop tolvaja kapcsolhatná át.
 * @param {Object} tarolo
 * @param {Object} csereLeiras - a csere-kulcs (a fájlból vagy a papír kódjából)
 * @returns {Promise<{kulcspar: CryptoKeyPair, visszavonas: Object, cserek: Array<Object>, nev: string}>}
 */
export async function papirVisszavonasa(tarolo, csereLeiras) {
  console.log('papirVisszavonasa - KEZDÉS');
  const { regi, nev, csereKulcspar, cserek } = await papirAzonossagnak(tarolo, csereLeiras);
  const fizetes = cserek.length ? cserek[cserek.length - 1].fizetes : regi.szuletes.fizetes;
  const visszavonas = await kulcscsereKeszitese(csereKulcspar, nev, cserek.length + 1,
    await nyilvanosKulcsSzovegesen(regi.publicKey), null, [], fizetes);
  const ujCserek = [...cserek, visszavonas];
  await tarolo.ir({ ...(await kulcsparLeirasa(regi)), nev, szuletes: regi.szuletes, cserek: ujCserek,
    ...(regi.fizetesKulcs ? { fizetesKulcs: regi.fizetesKulcs } : {}) });
  regi.cserek = ujCserek;
  console.log('papirVisszavonasa - VÉGE', { sorszam: visszavonas.sorszam });
  return { kulcspar: regi, visszavonas, cserek: ujCserek, nev };
}

/**
 * ⭐⭐ D128 (②f — 17. pont): A HELYREÁLLÍTÁS BEFEJEZÉSE az új készüléken — a kérelem titkaival (a kezelő és a fizetési kulcs) és a
 * helyreállítás `Kulcscsere` eseményével (a segítő adta ki): a lánc hiteles, és a VÉGÉN az én kezelő kulcsom és fizetési kulcsom
 * áll — akkor ez a gép ennek az azonosságnak a kezelője. ⚠️ A helyreállítás bizonyítékát a hívó előbb ellenőrzi (a nyilvántartásba
 * veszi — `allapot/helyreallitas.js`); itt a lánc. ⛔ Meglévő azonosságot csak kimondott `felulir`-ral ír felül (D15).
 * @param {Object} tarolo
 * @param {{kulcs: Object, fizetes: Object, csere: Object}} titkok - a kérelem titkos kulcsai (JWK)
 * @param {Object} esemeny - a helyreállítás `Kulcscsere` eseménye
 * @param {{felulir?: boolean}} [beallitas]
 * @returns {Promise<{kulcspar: CryptoKeyPair, nev: string, papir: Object|null, elhagyott: string|null}>}
 */
export async function helyreallitasBefejezese(tarolo, titkok, esemeny, { felulir = false } = {}) {
  console.log('helyreallitasBefejezese - KEZDÉS');
  if (esemeny?.tipus !== 'Kulcscsere' || !esemeny.adat?.szuletes || !Array.isArray(esemeny.adat.cserek)) {
    throw new Error('Ez nem a helyreállítás eseménye (Kulcscsere).');
  }
  const { szuletes, cserek } = esemeny.adat;
  const nev = await azonossagNeve(szuletes);
  const lanc = await kezeloKulcsLanc(szuletes, cserek, nev);
  if (!lanc.rendben) throw new Error('A helyreállítás lánca nem hiteles: ' + lanc.ok);
  if (lanc.kulcsok[lanc.kulcsok.length - 1] !== titkok.kulcs?.x || lanc.fizetesek[lanc.fizetesek.length - 1] !== titkok.fizetes?.x) {
    throw new Error('Ez a helyreállítás nem a te kérelmedé (a lánc végén más kulcs áll).');
  }
  const meglevo = await kulcsparBetoltese(tarolo);
  if (meglevo && !felulir) {
    throw new Error('Ezen a készüléken már van azonosság — ha mégis ezt akarod: … felulir');
  }
  const privateKey = await crypto.subtle.importKey('jwk', titkok.kulcs, { name: ALGORITMUS }, true, ['sign']);
  const { kty, crv, x } = titkok.kulcs;
  const publicKey = await crypto.subtle.importKey('jwk', { kty, crv, x }, { name: ALGORITMUS }, true, ['verify']);
  const kulcspar = { privateKey, publicKey };
  await tarolo.ir({ ...(await kulcsparLeirasa(kulcspar)), nev, szuletes, cserek, fizetesKulcs: titkok.fizetes });
  Object.assign(kulcspar, { szuletes, cserek, fizetesKulcs: titkok.fizetes });
  const papir = lanc.lekotes !== null && lanc.lekotes === await csereLenyomata(titkok.csere?.x) ? titkok.csere : null;
  const elhagyott = meglevo ? await nyilvanosKulcsSzovegesen(meglevo.publicKey) : null;
  console.log('helyreallitasBefejezese - VÉGE', { papir: !!papir });
  return { kulcspar, nev, papir, elhagyott };
}

/** ⭐⭐ D128 (②d): a papír él-e még (a lekötés egy csere-kulcs lenyomata — nem vonták vissza). */
export function papirEl(kulcspar) {
  const cserek = kulcspar?.cserek ?? [];
  return (cserek.length ? cserek[cserek.length - 1].kovetkezo : kulcspar?.szuletes?.csere) != null;
}

/**
 * Egy korábban kimentett kulcsfájl visszatöltése — és elmentése a tárolóba.
 *
 * ⛔⛔ EZ AZ EGYETLEN MŰVELET A KOINÓBAN, AMI ELDOB VALAMIT. Mindenütt máshol
 * hozzáfűzünk: az esemény-tár csak `hozzafuz`-t tud, eseményt soha nem módosítunk. Itt
 * viszont egy meglévő kulcs FELÜLÍRÓDNA — és a D15 szerint az nem „egy fájl", hanem az
 * e-ember maga: a régi kulcshoz tartozó lánc, tagság és tanúsítások mind elérhetetlenné
 * válnának, mert senki más nem tud helyette aláírni.
 *
 * ⭐ Ezért alapból NEM ír felül, és a `felulir` KIMONDOTT engedély kell hozzá. Az őr itt
 * van, nem a parancssorban — ugyanaz az érv, mint a javaslathoz tartozó szavazatnál: ha a
 * hívóra bíznánk, az egyik út megtenné, a másik elfelejtené.
 *
 * ⚠️ És a sorrend sem véletlen: ELŐBB a fájlt ellenőrizzük, csak AZUTÁN nyúlunk a tárhoz.
 * Egy hibás fájl így nyom nélkül elbukik.
 *
 * @param {Object} tarolo - { olvas, ir }
 * @param {string} fajlTartalom
 * @param {{ felulir?: boolean }} beallitas
 * @returns {Promise<{kulcspar: CryptoKeyPair, azonosito: string, elhagyott: string|null}>}
 */
export async function kulcsparVisszatoltese(tarolo, fajlTartalom, beallitas = {}) {
  console.log('kulcsparVisszatoltese - KEZDÉS', { felulir: beallitas.felulir === true });

  let leiras;
  try {
    leiras = JSON.parse(fajlTartalom);
  } catch {
    // ⚠️ D19: a „nem is JSON" más hiba, mint a „nem koino kulcs" — ne mosódjon össze.
    throw new Error('Ez a fájl nem olvasható: nem JSON.');
  }

  const kulcspar = await azonossagRaTetele(await kulcsparLeirasbol(leiras), leiras);
  // ⭐⭐ D128 (②a): a NÉV a születésből (ha a fájl hozza) — különben a kulcs (a régi alak; a betöltés születést ad neki).
  const azonosito = (typeof leiras.nev === 'string' && leiras.nev) || await nyilvanosKulcsSzovegesen(kulcspar.publicKey);

  const meglevo = await tarolo.olvas();
  if (meglevo && beallitas.felulir !== true) {
    // ⚠️ A meglévő fájlban az `azonosito` mező hiányozhat (kézzel szerkesztették) — a
    // hiányt KIMONDJUK, nem írunk a helyére `undefined`-ot (D19).
    throw new Error('Ezen a készüléken MÁR VAN kulcs ('
      + (rovidAzonosito(meglevo.nev ?? meglevo.azonosito) || 'ismeretlen azonosítójú')
      + '), a visszatöltés pedig ELDOBNÁ. Ha tényleg ezt akarod, mondd ki: `felulir`.');
  }

  await tarolo.ir(leiras);

  console.log('kulcsparVisszatoltese - VÉGE', { azonosito });
  return { kulcspar, azonosito, elhagyott: meglevo?.nev ?? meglevo?.azonosito ?? null };
}
