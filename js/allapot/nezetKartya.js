// js/allapot/nezetKartya.js

// Felelősség: ⭐⭐ A NÉZET-KÁRTYA (D126 — a D123 PR4-e, NZ1–NZ3) szabályai, egy helyen — a program és a próba ugyanezt hívja:
//   · a KÁRTYA SZÖVEGE: a leírás és EGY csatolt HTML-fájl (a nézet kódja) — a mai szöveg-alak (blokk-tömb), mint egy kép vagy egy
//     csatolmány; a mag nem változik (NZ1 (A): a kép a típust megőrzi, a szöveget a mai szállítás viszi — 92. mérés (a));
//   · a KÓD: a szöveg ELSŐ fájl-blokkja (a lenyomata, a neve) — ha egy szerkesztési egyezmény a szöveget módosítja, a kód is
//     változhat; a bekapcsolás ezért a LENYOMATHOZ kötött (NZ1);
//   · a BEKAPCSOLÁS: koinónként (NZ2 (A) — a nézet csak a saját koinójában fut) és a kód lenyomatához kötve — a helyi jegyzék
//     (`<adat>/nezetek.json`) alakja, és hogy egy kártya most be van-e kapcsolva, ki, vagy a kódja azóta változott.
//
// ⭐ Helyi viselkedés (R3), nem számítás: a koinó képe ettől semmiben nem más (a kártya egy legfelső szintű entitás, mint a
// koino-verzió kártya — D119). A bekapcsolás nem esemény, nem terjed: a te készülékedé (D123 PR4 (B): „te kapcsolod be a saját
// készülékeden”).
//
// Használják: koino.js (a `nezet` parancs, a lap útjai), meres/nezetProba.js.

import { lenyomatUrlbol } from './fajlIgeny.js';

/** A nézet-kártya típusa (a létrehozó esemény `adat.tipus`-a — a koinó képe ezt megőrzi). */
export const NEZET_TIPUS = 'Nezet';

/** Ennyi nézet-kártyát nézünk egy koinóban (a legtöbb pontút) — 9. szabály: a lista korlátos, a pont a közösség jelzése. */
export const NEZET_LISTA_KORLAT = 64;

/** Egy koinóban legfeljebb ennyi bekapcsolt nézet (a helyi jegyzék korlátja). */
export const NEZET_BEKAPCSOLT_KORLAT = 64;

/** A helyi jegyzékben legfeljebb ennyi koinó (a legutóbb érintettek maradnak). */
export const NEZET_KOINO_KORLAT = 256;

const LENYOMAT = /^[A-Za-z0-9_-]{43}$/;

// ===================================
// A KÁRTYA SZÖVEGE ÉS A KÓDJA
// ===================================

/**
 * A nézet-kártya szövege: a leírás (ha van) és a kód fájl-blokkja — a szerkesztő blokk-alakjában, hogy a lap a szöveget
 * fordítás nélkül rajzolja (a fájl letölthető, mint egy csatolmány).
 * @param {{leiras?: string|null, kod: {lenyomat: string, nev: string}}} b
 * @returns {Array<Object>}
 */
export function nezetSzovegBlokkjai({ leiras = null, kod }) {
  if (!kod || !LENYOMAT.test(kod.lenyomat ?? '')) throw new Error('A nézet kódjának lenyomata hiányzik.');
  const blokkok = [];
  const l = typeof leiras === 'string' ? leiras.trim() : '';
  if (l) {
    // ⚠️ A szöveg-blokk tartalma a szerkesztőben HTML (a megjelenítő tisztítja) — a sima leírást itt jelek nélkül tesszük bele.
    const tiszta = l.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
      .replace(/\r?\n/g, '<br>');
    blokkok.push({ id: 'nezet-leiras', tipus: 'szoveg', tartalom: tiszta });
  }
  blokkok.push({ id: 'nezet-kod', tipus: 'fajl', url: '/api/fajl/' + kod.lenyomat, nev: kodNeve(kod.nev) });
  return blokkok;
}

/** A kód fájl-neve: a megadott, ha értelmes, különben `nezet.html` (a lap ezt mutatja; a lenyomat a név). */
export function kodNeve(nev) {
  const n = typeof nev === 'string' ? nev.trim().split(/[\\/]/).pop() : '';
  return n && n.length <= 200 ? n : 'nezet.html';
}

/**
 * ⭐ A NÉZET KÓDJA a (feloldott) szövegből: az ELSŐ fájl-blokk — a lenyomata és a neve. Sima szövegben (a régi alakban) nincs fájl.
 * @param {string|Array|null} szoveg - a kártya feloldott szövege (`szovegFeloldasa`)
 * @returns {{lenyomat: string, nev: string}|null}
 */
export function nezetKodja(szoveg) {
  if (!Array.isArray(szoveg)) return null;
  for (const b of szoveg) {
    if (b?.tipus !== 'fajl') continue;
    const lenyomat = lenyomatUrlbol(b.url);
    if (lenyomat) return { lenyomat, nev: kodNeve(b.nev) };
  }
  return null;
}

/**
 * A kód bájtjai szövegként (UTF-8, hibátlanul) — a nézet egy HTML-fájl; a hibás kódolású vagy üres fájlt nem tesszük fel.
 * @param {Uint8Array} bajtok
 * @returns {string}
 */
export function kodSzovege(bajtok) {
  if (!bajtok?.length) throw new Error('A nézet fájlja üres.');
  let s;
  try {
    s = new TextDecoder('utf-8', { fatal: true }).decode(bajtok);
  } catch {
    throw new Error('A nézet fájlja nem UTF-8 szöveg — egy HTML-fájl kell (a szkript és a stílus benne).');
  }
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// ===================================
// A BEKAPCSOLÁS — a helyi jegyzék (`<adat>/nezetek.json`)
// ===================================
//
//   { koinok: { <koinó>: { ido, nezetek: { <kártya>: { lenyomat, ido, cim } } } } }

/** Üres jegyzék. */
export function uresNezetJegyzek() {
  return { koinok: {} };
}

/**
 * A jegyzék ellenőrzött alakja — a hibás részt eldobja, korlátosan (a legutóbb érintett koinók és nézetek maradnak).
 * @param {*} nyers
 * @returns {{koinok: Object}}
 */
export function nezetJegyzekAlakja(nyers) {
  const ki = uresNezetJegyzek();
  const koinok = nyers && typeof nyers === 'object' && nyers.koinok && typeof nyers.koinok === 'object' ? nyers.koinok : {};
  const jok = [];
  for (const [k, v] of Object.entries(koinok)) {
    if (!k || k.length > 200 || !v || typeof v !== 'object' || !v.nezetek || typeof v.nezetek !== 'object') continue;
    const nezetek = Object.entries(v.nezetek)
      .filter(([az, n]) => LENYOMAT.test(az) && LENYOMAT.test(n?.lenyomat ?? '') && Number.isFinite(n?.ido))
      .sort((a, b) => b[1].ido - a[1].ido).slice(0, NEZET_BEKAPCSOLT_KORLAT)
      .map(([az, n]) => [az, { lenyomat: n.lenyomat, ido: n.ido, cim: typeof n.cim === 'string' ? n.cim.slice(0, 200) : null }]);
    if (!nezetek.length) continue;
    jok.push([k, { ido: Number.isFinite(v.ido) ? v.ido : Math.max(...nezetek.map(([, n]) => n.ido)), nezetek: Object.fromEntries(nezetek) }]);
  }
  jok.sort((a, b) => b[1].ido - a[1].ido);
  ki.koinok = Object.fromEntries(jok.slice(0, NEZET_KOINO_KORLAT));
  return ki;
}

/**
 * Egy nézet bekapcsolása egy koinóban, a kód lenyomatához kötve (az új jegyzék — a régi változatlan).
 * @param {Object} j - a mostani jegyzék
 * @param {{koino: string, kartya: string, lenyomat: string, cim?: string|null, most?: number}} b
 */
export function nezetBekapcsolasa(j, { koino, kartya, lenyomat, cim = null, most = Date.now() }) {
  if (!koino) throw new Error('Melyik koinóban?');
  if (!LENYOMAT.test(kartya ?? '') || !LENYOMAT.test(lenyomat ?? '')) throw new Error('A kártya és a kód lenyomata kell.');
  const a = nezetJegyzekAlakja(j);
  const regi = a.koinok[koino]?.nezetek ?? {};
  if (!regi[kartya] && Object.keys(regi).length >= NEZET_BEKAPCSOLT_KORLAT) {
    throw new Error('Ebben a koinóban már ' + NEZET_BEKAPCSOLT_KORLAT + ' nézet van bekapcsolva — előbb kapcsolj ki egyet.');
  }
  a.koinok[koino] = { ido: most, nezetek: { ...regi, [kartya]: { lenyomat, ido: most, cim: cim ?? null } } };
  return nezetJegyzekAlakja(a);
}

/** Egy nézet kikapcsolása (az új jegyzék; ha nem volt bekapcsolva, ugyanazt adja vissza). */
export function nezetKikapcsolasa(j, { koino, kartya }) {
  const regi = j?.koinok?.[koino]?.nezetek;
  if (!regi?.[kartya]) return j;
  const a = nezetJegyzekAlakja(j);
  const { [kartya]: _el, ...marad } = a.koinok[koino].nezetek;
  if (Object.keys(marad).length) a.koinok[koino] = { ...a.koinok[koino], nezetek: marad };
  else delete a.koinok[koino];
  return a;
}

/**
 * ⭐ Egy kártya állása ezen a készüléken: `be` (bekapcsolva, és a kódja az, amit bekapcsoltál), `valtozott` (bekapcsoltad, de
 * azóta más a kódja — egy egyezmény módosította a szövegét: újra kell bekapcsolni), `ki`.
 * @param {Object} j - a jegyzék
 * @param {string} koino
 * @param {string} kartya
 * @param {string|null} lenyomat - a kártya MOSTANI kódjának lenyomata (null: nincs kódja)
 * @returns {{allas: 'be'|'ki'|'valtozott', bekapcsolva: Object|null}}
 */
export function nezetAllasa(j, koino, kartya, lenyomat) {
  const b = j?.koinok?.[koino]?.nezetek?.[kartya] ?? null;
  if (!b) return { allas: 'ki', bekapcsolva: null };
  return { allas: lenyomat && b.lenyomat === lenyomat ? 'be' : 'valtozott', bekapcsolva: b };
}
