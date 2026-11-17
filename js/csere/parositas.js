// js/csere/parositas.js

// Felelősség: ⭐⭐ D128 (④a — KF1 (A), Csaba, 2026-11-16: „rendben, legyen az (A)”): A MÁSODIK KÉSZÜLÉK FELVÉTELE — PÁROSÍTÁS A
// HÁLÓZATON.
//
// ===== MIÉRT =====
//
// Új készüléket csak az azonosság kulcsa vehet fel (ET-3/4 (A)), és az csak a kezelő készüléken van (KU6 (A)). A második készülék
// (a telefon) így nem kapja meg az azonosság kulcsát — csak a TANÚSÍTVÁNYÁT: a kezelő aláírja, hogy ez a készülékkulcs az övé.
// ⛔ A D128 előtt (és a ④ előtt) a második készülék a kulcsfájl átmásolásával született — az azonosság kulcsa így minden
// készüléken ott volt, és egy ellopott telefonnal a tolvaj a laptopot is kizárhatta.
//
// ===== AZ ÚT (KF1 (A) — ahogy a Signal, a WhatsApp Web párosít) =====
//
//   1. A kezelő (a laptop) kiír egy PÁROSÍTÓ KÓDOT és QR-t (`koino-parosit.1.…`): a címei és a kapuja portja, a tábla-aláírója (ebből
//      tudja az új készülék, hogy a valódi laptoppal beszél), egy egyszeri TITOK, a név (az azonosság) és a lejárat (10 perc). A
//      laptop a párosítás idejére kaput nyit, és vár.
//   2. Az új készülék (a telefon) beolvassa (a kamera a QR-ből szöveget ad), és kopog a laptopra: kézfogás (védett rés — a
//      `udpVonal.js` mint minden munkánál), a laptop bemutatja a tábla-kulcsát (aláírva a kézfogás átiratát — a kódban lévővel
//      egyeznie kell), a telefon elküldi a KÉSZÜLÉKKULCSÁT és a nevét, a titok BIZONYÍTÁSÁVAL (HMAC a titokkal — a kézfogás
//      átiratához kötve: egy lehallgatott bizonyítás másik beszélgetésben nem ér semmit, és a titok maga nem utazik).
//   3. A laptop aláírja a tanúsítványt (az azonosság kulcsával), és visszaküldi — az azonosság nyilvános részeivel (a név, a születés,
//      a kulcscserék lánca) és a koinó-listájával. A titok egyszer használható.
//   4. Mindkét gép kiír egy 6 jeles ELLENŐRZŐ KÓDOT (a titokból és a készülékkulcsból) — összeveted: ha nem egyezik, nem a te telefonod
//      került fel (a lap — ④b — a kizárást kínálja).
//
// ⚠️ A két gépnek el kell érnie egymást: ugyanazon a hálózaton (a laptop helyi címei) vagy egy továbbított porton át. A vonalon a
// párosítás saját üzenetei mennek (`PAROSITAS_NYIT`, `PAROSITAS`, `PAROSITAS_KESZ` — JSON-sorok, mint a cserében); a csere
// párbeszédéhez (`vonal.js` `parbeszed`) nem nyúlunk.
//
// ⚠️ NULLA FÜGGŐSÉG (6. szabály): a HMAC és a véletlen a beépített `node:crypto`-ból.
//
// Használják: koino.js (a `keszulek felvesz` a kezelőn, a `keszulek csatlakoz` az új készüléken), a próbák.

import { createHmac, createHash, randomBytes } from 'node:crypto';
import { udpKapcsolat, kezfogasUdpResen } from './udpVonal.js';
import { uzenetSor } from './vonal.js';
import { kezfogasAlairasa, kezfogasAlairasEllenorzese } from './titkositas.js';

/** A párosító kód előtagja (a változat benne — egy későbbi alak külön előtagot kap). */
export const PAROSITO_ELOTAG = 'koino-parosit.1.';

/** Ennyi ideig érvényes egy párosító kód (a laptop addig vár). */
export const PAROSITAS_ELETTARTAM = 10 * 60 * 1000;

/** A kódban legfeljebb ennyi cím. */
const CIM_KORLAT = 8;

/** Egy párosító beszélgetés legfeljebb ennyi ideig vár a társra. */
const VARAKOZAS = 15000;

const AZONOSITO = /^[A-Za-z0-9_-]{43}$/;
const TITOK = /^[A-Za-z0-9_-]{22}$/;   // 16 bájt base64url-ben
const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford (mint a papír és a helyreállítás kódjai)

/**
 * Egy új párosítás: a titok és a kód (a címek, a tábla-aláíró, a név, a lejárat).
 * @param {{cimek: Array<{hoszt: string, port: number}>, tablaAlairo: string, nev: string, most?: number}} b
 * @returns {{kod: Object, titok: string}}
 */
export function ujParositas({ cimek, tablaAlairo, nev, most = Date.now() }) {
  const titok = randomBytes(16).toString('base64url');
  const kod = { c: cimek.slice(0, CIM_KORLAT).map((c) => [c.hoszt, c.port]), a: tablaAlairo, t: titok, n: nev,
    l: most + PAROSITAS_ELETTARTAM };
  const h = parositoKodAlakiHibaja(kod);
  if (h) throw new Error('A párosító kód nem állítható össze: ' + h);
  return { kod, titok };
}

/** A párosító kód alakja — a hiba oka, vagy null. */
export function parositoKodAlakiHibaja(k) {
  if (!k || typeof k !== 'object' || Array.isArray(k)) return 'a kód egy objektum';
  if (Object.keys(k).sort().join(',') !== 'a,c,l,n,t') return 'a kód mezői: c, a, t, n, l';
  if (!Array.isArray(k.c) || !k.c.length || k.c.length > CIM_KORLAT) return 'a címek: 1–' + CIM_KORLAT;
  for (const c of k.c) {
    if (!Array.isArray(c) || c.length !== 2 || typeof c[0] !== 'string' || !c[0].length || c[0].length > 64
      || !Number.isInteger(c[1]) || c[1] < 1 || c[1] > 65535) return 'egy cím: [hoszt, port]';
  }
  if (typeof k.a !== 'string' || !AZONOSITO.test(k.a)) return 'a tábla-aláíró egy nyilvános kulcs';
  if (typeof k.t !== 'string' || !TITOK.test(k.t)) return 'a titok 16 bájt';
  if (typeof k.n !== 'string' || !AZONOSITO.test(k.n)) return 'a név egy azonosság neve';
  if (!Number.isSafeInteger(k.l) || k.l < 0) return 'a lejárat egy időpont';
  return null;
}

/** A párosító kód szövege (egy sor — a QR ezt hordozza). */
export function parositoSzovege(kod) {
  return PAROSITO_ELOTAG + Buffer.from(JSON.stringify(kod), 'utf8').toString('base64url');
}

/** A párosító kód a szövegből (a beolvasott QR, vagy egy bemásolt sor — a szóközöket elnézi). ⛔ Hibás alakra hibát dob. */
export function parositoSzovegbol(szoveg) {
  const s = String(szoveg ?? '').replace(/\s+/g, '');
  if (!s.startsWith(PAROSITO_ELOTAG)) throw new Error('Ez nem párosító kód (' + PAROSITO_ELOTAG + '…).');
  let kod;
  try { kod = JSON.parse(Buffer.from(s.slice(PAROSITO_ELOTAG.length), 'base64url').toString('utf8')); }
  catch { throw new Error('A párosító kód sérült (nem olvasható).'); }
  const h = parositoKodAlakiHibaja(kod);
  if (h) throw new Error('A párosító kód hibás: ' + h);
  return kod;
}

/** A titok bizonyítása — a kézfogás átiratához és a készülékkulcshoz kötve (a titok maga nem utazik). */
export function parositasBizonyitasa(titok, atirat, keszulek) {
  return createHmac('sha256', Buffer.from(titok, 'base64url'))
    .update('koino-parositas-1|').update(atirat).update('|' + keszulek).digest('base64url');
}

/** Az ELLENŐRZŐ KÓD (6 jel, `XXX-XXX`) — a titokból és a készülékkulcsból: a két gép ugyanazt írja ki, ha ugyanazt a párosítást látja. */
export function parositasEllenorzoKodja(titok, keszulek) {
  const b = createHash('sha256').update('koino-parositas-kod-1|' + titok + '|' + keszulek).digest();
  let ki = '';
  for (let i = 0; i < 6; i++) ki += ABC[b[i] & 31];
  return ki.slice(0, 3) + '-' + ki.slice(3);
}

/** Egy JSON-sor a kapcsolatra. */
function kuldes(kapcsolat, uzenet) {
  kapcsolat.write(JSON.stringify(uzenet) + '\n');
}

/** A következő üzenet adott fajtából (a többit — pl. egy késve érkező ismétlést — átugorja), korlátos várakozással. */
async function varas(sor, uzenet) {
  for (let i = 0; i < 8; i++) {
    const u = await sor.kovetkezo();
    if (u?.uzenet === uzenet) return u;
  }
  throw new Error('Várt üzenet: ' + uzenet);
}

/** A kapcsolat a védett résen, a párosítás idejére (a hívó zárja). */
function parositoKapcsolat(res, tars) {
  const kapcsolat = udpKapcsolat(res, tars.cim, tars.port, { torlodasJel: 'nincs' });
  kapcsolat.setTimeout(VARAKOZAS, () => kapcsolat.destroy(new Error('A másik fél nem válaszol (' + VARAKOZAS + ' ms)')));
  return kapcsolat;
}

/**
 * A KEZELŐ oldala (a laptop): a kapuja egy bekopogóval kezet fog, bemutatja a tábla-kulcsát, és ha a társ a titok bizonyításával
 * kéri, aláírja a tanúsítványát (a `tanusito` — a hívó adja: az azonosság kulcsa nála van).
 * @param {Object} halo - a kapu nyers résje (a munka kapja)
 * @param {{cim: string, port: number}} tars
 * @param {{tablaKulcs: Object, tablaLeiras: Object, titok: string, tanusito: Function}} b - a tábla-kulcs nyilvános része és a
 *   leírása (az aláíráshoz), a párosítás titka, és a tanúsító: `({keszulek, nev}) → Promise<{tanusitvany, azonossag, koinok}>`
 * @returns {Promise<{keszulek: string, nev: string, ellenorzo: string}|null>} a felvett készülék (null, ha a bizonyítás nem stimmelt)
 */
export async function parositasKiszolgalasa(halo, tars, { tablaKulcs, tablaLeiras, titok, tanusito }) {
  console.log('parositasKiszolgalasa - KEZDÉS', { tars: tars.cim + ':' + tars.port });
  const res = await kezfogasUdpResen(halo, tars.cim, tars.port);
  const kapcsolat = parositoKapcsolat(res, tars);
  try {
    const sor = uzenetSor(kapcsolat);
    kuldes(kapcsolat, { uzenet: 'PAROSITAS_NYIT', tabla: tablaKulcs, aa: kezfogasAlairasa(tablaLeiras, res.atirat) });
    const k = await varas(sor, 'PAROSITAS');
    const jo = typeof k.keszulek === 'string' && AZONOSITO.test(k.keszulek) && typeof k.nev === 'string' && k.nev.length <= 64
      && typeof k.b === 'string' && k.b === parositasBizonyitasa(titok, res.atirat, k.keszulek);
    if (!jo) {
      kuldes(kapcsolat, { uzenet: 'PAROSITAS_KESZ', tiltva: 'a párosítás titka nem stimmel (lejárt, vagy egy másik kód)' });
      await kapcsolat.kiurites?.();
      console.log('parositasKiszolgalasa - VÉGE (elutasítva)');
      return null;
    }
    const v = await tanusito({ keszulek: k.keszulek, nev: k.nev });
    kuldes(kapcsolat, { uzenet: 'PAROSITAS_KESZ', tanusitvany: v.tanusitvany, azonossag: v.azonossag, koinok: v.koinok ?? [],
      ...(Number.isInteger(v.kapuPort) ? { kapuPort: v.kapuPort } : {}) });
    await kapcsolat.kiurites?.();
    console.log('parositasKiszolgalasa - VÉGE', { keszulek: k.keszulek.slice(0, 8) });
    return { keszulek: k.keszulek, nev: k.nev, ellenorzo: parositasEllenorzoKodja(titok, k.keszulek) };
  } finally {
    kapcsolat.end();
    res.zar();
  }
}

/**
 * Az ÚJ KÉSZÜLÉK oldala (a telefon): kezet fog a laptoppal, ellenőrzi, hogy a tábla-kulcsa a kódban lévő (a valódi laptop), és a
 * titok bizonyításával kéri a tanúsítványát.
 * @param {Object} halo
 * @param {{cim: string, port: number}} tars
 * @param {{kod: Object, keszulek: string, nev: string}} b - a párosító kód, a készülékkulcsom és a nevem
 * @returns {Promise<{tanusitvany: Object, azonossag: Object, koinok: Array<Object>, ellenorzo: string}>}
 */
export async function parositasKerese(halo, tars, { kod, keszulek, nev }) {
  console.log('parositasKerese - KEZDÉS', { tars: tars.cim + ':' + tars.port });
  const res = await kezfogasUdpResen(halo, tars.cim, tars.port);
  const kapcsolat = parositoKapcsolat(res, tars);
  try {
    const sor = uzenetSor(kapcsolat);
    const nyit = await varas(sor, 'PAROSITAS_NYIT');
    if (nyit.tabla?.alairo !== kod.a || !kezfogasAlairasEllenorzese(kod.a, res.atirat, nyit.aa)) {
      throw new Error('A társ nem az a készülék, amelyik a párosító kódot kiírta (a tábla-kulcsa más).');
    }
    kuldes(kapcsolat, { uzenet: 'PAROSITAS', keszulek, nev, b: parositasBizonyitasa(kod.t, res.atirat, keszulek) });
    const v = await varas(sor, 'PAROSITAS_KESZ');
    if (v.tiltva) throw new Error('A laptop nem vett fel: ' + v.tiltva);
    if (!v.tanusitvany || !v.azonossag) throw new Error('A laptop válasza hiányos (nincs tanúsítvány).');
    console.log('parositasKerese - VÉGE');
    // ⭐ a kezelő ŐRJÁRATÁNAK portja (a párosító kapu a párosítás után bezárul — a cserék oda mennek), és a cím, amin elértük
    const kapuPort = Number.isInteger(v.kapuPort) && v.kapuPort > 0 && v.kapuPort < 65536 ? v.kapuPort : null;
    return { tanusitvany: v.tanusitvany, azonossag: v.azonossag, koinok: Array.isArray(v.koinok) ? v.koinok : [],
      ellenorzo: parositasEllenorzoKodja(kod.t, keszulek), tarsCim: tars.cim, kapuPort };
  } finally {
    kapcsolat.end();
    res.zar();
  }
}
