// meres/papirProba.js

// ⭐⭐ D128 (②c — 16. pont, KC4 (A)): A CSERE-KULCS PAPÍRON — a betűcsoport-kód és a QR próbája.
//
// ⭐ Amit ez a lap bizonyít:
//   1. a kód oda-vissza UGYANAZT a kulcsot adja (14 csoport × 4 jel; a kulccsal aláírt adat a régi nyilvános féllel ellenőrizhető);
//   2. a kód ELNÉZŐ ott, ahol a téveszthető jelek (kisbetű, O/0, I/L/1, a csoportok elválasztása) — és SZIGORÚ máshol: MINDEN
//      egyetlen elírást és két jel minden felcserélését kimondja (kimerítően, minden helyen és minden jellel);
//   3. a kulcscsere a PAPÍRRÓL ugyanúgy megy, mint a fájlból;
//   4. a QR a szabvány szerint készül: a „HELLO WORLD” 1-M ismert kódszavai, a formátum- és a verzió-bitek ismert táblája, a
//      kapacitás-tábla pontjai, az igazító minták helyei;
//   5. ⭐⭐ egy PRÓBA-OLVASÓ — a kódolótól FÜGGETLENÜL írva (a szabvány jelöléseivel: i a sor, j az oszlop; a maszk-képletek, a
//      rögzített területek, a cikcakk és a Reed–Solomon szindrómák mind külön) — az 1–40. verzió mind a négy szintjén és mind a
//      nyolc maszkjával visszafejti a szöveget.
//   ⚠️ A végső próba a telefon kamerája (⑤ terep).

import { csereKodja, csereKodbol, csereKodQrja, kodTisztitasa, KOD_HOSSZ } from '../js/kulcs/papir.js';
import {
  qrKeszitese, qrTerminalra, adatKodolasa, rsMaradek, formatumBitek, verzioBitek, igazitoHelyek, nyersModulok, adatKodszavak,
  blokkFelosztas, ALFANUMERIKUS
} from '../js/kulcs/qr.js';
import { kulcsparBiztositasa, csereKulcsKiadasa, kulcscsereVegrehajtasa } from '../js/kulcs/kulcsTar.js';
import { azonossagNeve } from '../js/kulcs/azonossag.js';
import { probaGyujtemeny } from './probaFuttato.js';
// ⭐⭐ D128 (④a — KF1 (A)): a párosító kód
import { ujParositas, parositoSzovege, parositoSzovegbol, parositasBizonyitasa, parositasEllenorzoKodja, PAROSITO_ELOTAG }
  from '../js/csere/parositas.js';

const { proba, futtatas } = probaGyujtemeny('A csere-kulcs papíron — a betűcsoportok és a QR (D128 ②c)');

const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Egy friss csere-kulcs titkos fele (JWK). */
async function ujCsereJwk() {
  const k = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  return { jwk: await crypto.subtle.exportKey('jwk', k.privateKey), kulcspar: k };
}

/** Kivételt dob-e (és nem ad kulcsot). */
async function elutasitja(kod) {
  try { await csereKodbol(kod); return false; } catch { return true; }
}

/** Eldobható tároló a memóriában. */
function memoriaTarolo() {
  let mentett = null;
  return { fajl: '(memória)', irasokSzama: 0, async olvas() { return mentett; }, async ir(l) { mentett = l; this.irasokSzama++; } };
}

// ===== A BETŰCSOPORT-KÓD =====

proba('⭐ A kód oda-vissza UGYANAZ a kulcs: 14 csoport × 4 jel, és vele aláírva a régi nyilvános fél ellenőriz', async () => {
  const minta = /^1[0-9A-HJKMNP-TV-Z]{3}(-[0-9A-HJKMNP-TV-Z]{4}){13}$/;
  for (let i = 0; i < 20; i++) {
    const { jwk } = await ujCsereJwk();
    const kod = csereKodja(jwk);
    const vissza = await csereKodbol(kod);
    if (!minta.test(kod) || vissza.privatKulcs.d !== jwk.d || vissza.privatKulcs.x !== jwk.x) return false;
    if (vissza.mi !== 'koino-csere-kulcs') return false;
  }
  const { jwk, kulcspar } = await ujCsereJwk();
  const vissza = await csereKodbol(csereKodja(jwk));
  const titkos = await crypto.subtle.importKey('jwk', vissza.privatKulcs, { name: 'Ed25519' }, false, ['sign']);
  const adat = new TextEncoder().encode('koino');
  const alairas = await crypto.subtle.sign({ name: 'Ed25519' }, titkos, adat);
  return crypto.subtle.verify({ name: 'Ed25519' }, kulcspar.publicKey, alairas, adat);
});

proba('A kód ELNÉZŐ a téveszthető jelekkel: kisbetű, O → 0, I és L → 1, szóköz vagy semmi a csoportok között', async () => {
  const { jwk } = await ujCsereJwk();
  const kod = csereKodja(jwk);
  const valtozatok = [
    kod.toLowerCase(),
    kod.replace(/-/g, ' '),
    kod.replace(/-/g, ''),
    '  ' + kod.replace(/-/g, '  ') + '\n',
    kod.replace(/0/g, 'O'),
    kod.replace(/1/g, 'I'),
    kod.replace(/1/g, 'l')
  ];
  for (const v of valtozatok) if ((await csereKodbol(v)).privatKulcs.d !== jwk.d) return false;
  return kodTisztitasa(kod).length === KOD_HOSSZ;
});

proba('⭐⭐ MINDEN egyetlen elírást kimond — mind az 56 helyen, mind a 31 másik jellel (és az U-val)', async () => {
  for (let k = 0; k < 3; k++) {
    const kod = kodTisztitasa(csereKodja((await ujCsereJwk()).jwk));
    for (let i = 0; i < KOD_HOSSZ; i++) {
      for (const c of ABC + 'U') {
        if (c === kod[i]) continue;
        if (!(await elutasitja(kod.slice(0, i) + c + kod.slice(i + 1)))) return false;
      }
    }
  }
  return true;
});

proba('⭐⭐ Két jel MINDEN felcserélését kimondja — az első 53 között bármilyen távolságból, és az ellenőrző jelek között', async () => {
  let probalt = 0;
  for (let k = 0; k < 2; k++) {
    const kod = kodTisztitasa(csereKodja((await ujCsereJwk()).jwk));
    const parok = [];
    for (let i = 0; i < 53; i++) for (let j = i + 1; j < 53; j++) parok.push([i, j]);
    parok.push([53, 54], [53, 55], [54, 55]);
    for (const [i, j] of parok) {
      if (kod[i] === kod[j]) continue;
      const t = [...kod];
      [t[i], t[j]] = [t[j], t[i]];
      if (!(await elutasitja(t.join('')))) return false;
      probalt++;
    }
  }
  return probalt > 2000;
});

proba('A rossz hossz és az üres kód: kimondja, és nem ad kulcsot', async () => {
  const kod = kodTisztitasa(csereKodja((await ujCsereJwk()).jwk));
  let uzenet = '';
  try { await csereKodbol(kod.slice(0, 55)); } catch (h) { uzenet = h.message; }
  return /56 jel/.test(uzenet) && await elutasitja(kod + '0') && await elutasitja('') && await elutasitja(null)
    && await elutasitja('2' + kod.slice(1));
});

proba('⭐ A KULCSCSERE A PAPÍRRÓL: a kódból ugyanúgy cserél, mint a fájlból — és az elírt kód a tárhoz sem nyúl', async () => {
  const tarolo = memoriaTarolo();
  const elso = await kulcsparBiztositasa(tarolo);
  const nev = await azonossagNeve(elso.kulcspar.szuletes);
  const kod = csereKodja((await csereKulcsKiadasa(elso.csere, nev)).privatKulcs);
  const irasok = tarolo.irasokSzama;
  const t = [...kodTisztitasa(kod)];
  t[20] = t[20] === 'A' ? 'B' : 'A';
  let elirva = null;
  try { await kulcscsereVegrehajtasa(tarolo, await csereKodbol(t.join('')), []); } catch (h) { elirva = h.message; }
  if (!/elírás/.test(elirva ?? '') || tarolo.irasokSzama !== irasok) return false;
  const r = await kulcscsereVegrehajtasa(tarolo, await csereKodbol(kod), []);
  return r.nev === nev && r.kulcscsere.sorszam === 1 && tarolo.irasokSzama === irasok + 1;
});

// ===== A QR — A SZABVÁNY ISMERT ÉRTÉKEI =====

proba('⭐ „HELLO WORLD” 1-M: a szabvány ismert adat- és hibajavító kódszavai', async () => {
  const { verzio, kodszavak, mod } = adatKodolasa('HELLO WORLD', 'M');
  const adat = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
  const hibajavito = [196, 35, 39, 119, 235, 215, 231, 226, 93, 23];
  return verzio === 1 && mod === 'alfanumerikus' && JSON.stringify(kodszavak) === JSON.stringify(adat)
    && JSON.stringify(rsMaradek(adat, 10)) === JSON.stringify(hibajavito);
});

proba('⭐ A formátum mind a 32 bitsora és a verzió bitjei a szabvány táblája szerint', async () => {
  const tabla = {
    L: ['111011111000100', '111001011110011', '111110110101010', '111100010011101', '110011000101111', '110001100011000',
      '110110001000001', '110100101110110'],
    M: ['101010000010010', '101000100100101', '101111001111100', '101101101001011', '100010111111001', '100000011001110',
      '100111110010111', '100101010100000'],
    Q: ['011010101011111', '011000001101000', '011111100110001', '011101000000110', '010010010110100', '010000110000011',
      '010111011011010', '010101111101101'],
    H: ['001011010001001', '001001110111110', '001110011100111', '001100111010000', '000011101100010', '000001001010101',
      '000110100001100', '000100000111011']
  };
  for (const [szint, sorok] of Object.entries(tabla)) {
    for (let m = 0; m < 8; m++) if (formatumBitek(szint, m) !== parseInt(sorok[m], 2)) return false;
  }
  const verziok = { 7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3, 40: 0x28C69 };
  return Object.entries(verziok).every(([v, b]) => verzioBitek(Number(v)) === b);
});

// ⭐ A szabvány alfanumerikus kapacitás-táblája (jel / verzió / szint) — a kódoló hibajavító tábláinak MÁSIK forrása: a 160 pont a
// táblák minden verziójának adat-kódszavait méri (a két számsor szorzatát a nyers modulszámból kivonva).
const ALFANUMERIKUS_KAPACITAS = {
  1: [25, 20, 16, 10], 2: [47, 38, 29, 20], 3: [77, 61, 47, 35],
  4: [114, 90, 67, 50], 5: [154, 122, 87, 64], 6: [195, 154, 108, 84],
  7: [224, 178, 125, 93], 8: [279, 221, 157, 122], 9: [335, 262, 189, 143],
  10: [395, 311, 221, 174], 11: [468, 366, 259, 200], 12: [535, 419, 296, 227],
  13: [619, 483, 352, 259], 14: [667, 528, 376, 283], 15: [758, 600, 426, 321],
  16: [854, 656, 470, 365], 17: [938, 734, 531, 408], 18: [1046, 816, 574, 452],
  19: [1153, 909, 644, 493], 20: [1249, 970, 702, 557], 21: [1352, 1035, 742, 587],
  22: [1460, 1134, 823, 640], 23: [1588, 1248, 890, 672], 24: [1704, 1326, 963, 744],
  25: [1853, 1451, 1041, 779], 26: [1990, 1542, 1094, 864], 27: [2132, 1637, 1172, 910],
  28: [2223, 1732, 1263, 958], 29: [2369, 1839, 1322, 1016], 30: [2520, 1994, 1429, 1080],
  31: [2677, 2113, 1499, 1150], 32: [2840, 2238, 1618, 1226], 33: [3009, 2369, 1700, 1307],
  34: [3183, 2506, 1787, 1394], 35: [3351, 2632, 1867, 1431], 36: [3537, 2780, 1966, 1530],
  37: [3729, 2894, 2071, 1591], 38: [3927, 3054, 2181, 1658], 39: [4087, 3220, 2298, 1774],
  40: [4296, 3391, 2420, 1852]
};

proba('⭐ A kapacitás a szabvány táblája szerint — alfanumerikus mind a 40 verzió mind a négy szintjén (160 pont), bájt a 40.-en', async () => {
  const szintek = ['L', 'M', 'Q', 'H'];
  for (const [v, sor] of Object.entries(ALFANUMERIKUS_KAPACITAS)) {
    for (let s = 0; s < 4; s++) {
      if (adatKodolasa('A'.repeat(sor[s]), szintek[s]).verzio !== Number(v)) return false;
      let kovetkezo;
      try { kovetkezo = adatKodolasa('A'.repeat(sor[s] + 1), szintek[s]).verzio; } catch { kovetkezo = 41; }
      if (kovetkezo !== Number(v) + 1) return false;
    }
  }
  const bajt = { L: 2953, M: 2331, Q: 1663, H: 1273 };
  for (const [szint, n] of Object.entries(bajt)) {
    if (adatKodolasa('a'.repeat(n), szint).verzio !== 40) return false;
    let tul = false;
    try { adatKodolasa('a'.repeat(n + 1), szint); } catch { tul = true; }
    if (!tul) return false;
  }
  return true;
});

proba('Az igazító minták helyei a szabvány táblája szerint (2., 7., 15., 16., 32., 36., 40. verzió)', async () => {
  const tabla = {
    1: [], 2: [6, 18], 7: [6, 22, 38], 15: [6, 26, 48, 70], 16: [6, 26, 50, 74], 32: [6, 34, 60, 86, 112, 138],
    36: [6, 24, 50, 76, 102, 128, 154], 40: [6, 30, 58, 86, 114, 142, 170]
  };
  return Object.entries(tabla).every(([v, h]) => JSON.stringify(igazitoHelyek(Number(v))) === JSON.stringify(h));
});

// ===== ⭐⭐ A PRÓBA-OLVASÓ — a kódolótól függetlenül =====

/** A maszkok a szabvány jelöléseivel (i a sor, j az oszlop). */
const MASZK_KEPLETEK = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0
];

/** GF(256) a 0x11D polinommal — hatvány- és logaritmus-táblával (a kódoló bitenként szoroz). */
const EXP = new Array(512);
const LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11D;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const gfSzor = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

/** Egy blokk (adat ‖ hibajavító) szindrómái nullák-e: a kódszó-polinom gyökei α^0 … α^(fok-1). */
function szindromakNullak(kodszo, fok) {
  for (let k = 0; k < fok; k++) {
    let s = 0;
    for (const c of kodszo) s = gfSzor(s, EXP[k]) ^ c;
    if (s !== 0) return false;
  }
  return true;
}

/**
 * A PRÓBA-OLVASÓ: a mátrixból (m[i][j], i a sor) vissza a szöveg. Kivételt dob, ha bármi nem a szabvány szerint áll.
 * @returns {{szoveg: string, verzio: number, szint: string, maszk: number}}
 */
function qrOlvasasa(m) {
  const n = m.length;
  const verzio = (n - 17) / 4;
  if (!Number.isInteger(verzio) || verzio < 1 || verzio > 40) throw new Error('rossz méret: ' + n);
  const szam = (bitek) => bitek.reduce((a, b) => a * 2 + b, 0);
  // 1. A FORMÁTUM — két példány, a legfelső bit elöl.
  const elso = szam([...[0, 1, 2, 3, 4, 5, 7, 8].map((j) => m[8][j]), ...[7, 5, 4, 3, 2, 1, 0].map((i) => m[i][8])]);
  const masodik = szam([...[1, 2, 3, 4, 5, 6, 7].map((k) => m[n - k][8]), ...[8, 7, 6, 5, 4, 3, 2, 1].map((k) => m[8][n - k])]);
  if (elso !== masodik) throw new Error('a formátum két példánya eltér');
  if (m[n - 8][8] !== 1) throw new Error('a mindig sötét modul világos');
  const nyers = elso ^ 0x5412;
  const szint = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' }[nyers >> 13];
  const maszk = (nyers >> 10) & 7;
  if (formatumBitek(szint, maszk) !== elso) throw new Error('a formátum hibajavító bitjei nem illenek');
  // 2. A VERZIÓ (7-től) — két példány.
  if (verzio >= 7) {
    let jobbFent = 0;
    let balLent = 0;
    for (let k = 17; k >= 0; k--) {
      jobbFent = jobbFent * 2 + m[Math.floor(k / 3)][n - 11 + (k % 3)];
      balLent = balLent * 2 + m[n - 11 + (k % 3)][Math.floor(k / 3)];
    }
    if (jobbFent !== balLent || jobbFent >> 12 !== verzio || jobbFent !== verzioBitek(verzio)) throw new Error('a verzió nem illik');
  }
  // 3. A RÖGZÍTETT TERÜLETEK — téglalapokként.
  const foglalt = Array.from({ length: n }, () => new Uint8Array(n));
  const fog = (i0, j0, h, w) => { for (let i = i0; i < i0 + h; i++) for (let j = j0; j < j0 + w; j++) foglalt[i][j] = 1; };
  fog(0, 0, 9, 9);
  fog(0, n - 8, 9, 8);
  fog(n - 8, 0, 8, 9);
  fog(6, 0, 1, n);
  fog(0, 6, n, 1);
  const helyek = igazitoHelyek(verzio);
  for (const ai of helyek) {
    for (const aj of helyek) {
      if ((ai < 9 && aj < 9) || (ai < 9 && aj > n - 9) || (ai > n - 9 && aj < 9)) continue;
      fog(ai - 2, aj - 2, 5, 5);
    }
  }
  if (verzio >= 7) {
    fog(0, n - 11, 6, 3);
    fog(n - 11, 0, 3, 6);
  }
  let szabad = 0;
  for (const sor of foglalt) for (const c of sor) szabad += 1 - c;
  if (szabad !== nyersModulok(verzio)) throw new Error('a szabad modulok száma ' + szabad + ', a képlet ' + nyersModulok(verzio));
  // 4. A CIKCAKK — jobbról, két oszloponként, felfelé kezdve; a 6. oszlop kimarad; a maszk levéve.
  const bitek = [];
  let felfele = true;
  for (let jobb = n - 1; jobb > 0; jobb -= 2) {
    if (jobb === 6) jobb--;
    for (let k = 0; k < n; k++) {
      const i = felfele ? n - 1 - k : k;
      for (const j of [jobb, jobb - 1]) if (!foglalt[i][j]) bitek.push(m[i][j] ^ (MASZK_KEPLETEK[maszk](i, j) ? 1 : 0));
    }
    felfele = !felfele;
  }
  const kodszoSzam = Math.floor(bitek.length / 8);
  if (bitek.slice(kodszoSzam * 8).some((b) => b !== 0)) throw new Error('a maradék bitek nem nullák');
  const kodszavak = [];
  for (let k = 0; k < kodszoSzam; k++) kodszavak.push(szam(bitek.slice(k * 8, k * 8 + 8)));
  // 5. A BLOKKOK — szétfésülve, a szindrómák nullák.
  const { fok, adatHosszak } = blokkFelosztas(verzio, szint);
  const blokkok = adatHosszak.map(() => []);
  let p = 0;
  for (let i = 0; i < Math.max(...adatHosszak); i++) adatHosszak.forEach((h, b) => { if (i < h) blokkok[b].push(kodszavak[p++]); });
  const javitok = adatHosszak.map(() => []);
  for (let i = 0; i < fok; i++) for (let b = 0; b < adatHosszak.length; b++) javitok[b].push(kodszavak[p++]);
  if (p !== kodszavak.length) throw new Error('a kódszavak száma nem illik');
  blokkok.forEach((b, k) => { if (!szindromakNullak([...b, ...javitok[k]], fok)) throw new Error('a ' + k + '. blokk szindrómája nem nulla'); });
  const adat = blokkok.flat();
  if (adat.length !== adatKodszavak(verzio, szint)) throw new Error('az adat-kódszavak száma nem illik');
  // 6. A SZEGMENS.
  const adatBitek = adat.flatMap((b) => [7, 6, 5, 4, 3, 2, 1, 0].map((k) => (b >> k) & 1));
  let q = 0;
  const olvas = (h) => { const v = szam(adatBitek.slice(q, q + h)); q += h; return v; };
  const mod = olvas(4);
  const sav = verzio < 10 ? 0 : verzio < 27 ? 1 : 2;
  let szoveg;
  if (mod === 0b0010) {
    const db = olvas([9, 11, 13][sav]);
    szoveg = '';
    for (let k = 0; k + 1 < db; k += 2) {
      const v = olvas(11);
      szoveg += ALFANUMERIKUS[Math.floor(v / 45)] + ALFANUMERIKUS[v % 45];
    }
    if (db % 2) szoveg += ALFANUMERIKUS[olvas(6)];
  } else if (mod === 0b0100) {
    const db = olvas([8, 16, 16][sav]);
    szoveg = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(Array.from({ length: db }, () => olvas(8))));
  } else {
    throw new Error('ismeretlen mód: ' + mod);
  }
  if (adatBitek.slice(q, q + 4).some((b) => b !== 0)) throw new Error('a lezárás nem nulla');
  return { szoveg, verzio, szint, maszk };
}

/** Véletlen szöveg: alfanumerikus vagy kisbetűs (bájt mód), adott hosszal. */
function veletlenSzoveg(hossz, alfanumerikusan) {
  const jelek = alfanumerikusan ? ALFANUMERIKUS : 'abcdefghijklmnopqrstuvwxyz0123456789?!';
  return Array.from({ length: hossz }, () => jelek[Math.floor(Math.random() * jelek.length)]).join('');
}

/** A legtöbb jel, ami egy verzióba és szintbe fér. */
function kapacitas(verzio, szint, alfanumerikusan) {
  const sav = verzio < 10 ? 0 : verzio < 27 ? 1 : 2;
  const bitek = adatKodszavak(verzio, szint) * 8 - 4 - (alfanumerikusan ? [9, 11, 13][sav] : [8, 16, 16][sav]);
  return alfanumerikusan ? Math.floor(bitek / 11) * 2 + (bitek % 11 >= 6 ? 1 : 0) : Math.floor(bitek / 8);
}

proba('⭐⭐ A PRÓBA-OLVASÓ visszafejti: az 1–40. verzió mind a négy szintje (a verzió tele), mind a nyolc maszk', async () => {
  const szintek = ['L', 'M', 'Q', 'H'];
  for (let verzio = 1; verzio <= 40; verzio++) {
    for (let s = 0; s < 4; s++) {
      const alfa = (verzio + s) % 2 === 0;
      const szoveg = veletlenSzoveg(kapacitas(verzio, szintek[s], alfa), alfa);
      const maszk = (verzio * 4 + s) % 8;
      const qr = qrKeszitese(szoveg, { szint: szintek[s], maszk });
      const o = qrOlvasasa(qr.modulok);
      if (qr.verzio !== verzio || o.szoveg !== szoveg || o.verzio !== verzio || o.szint !== szintek[s] || o.maszk !== maszk) {
        return false;
      }
    }
  }
  return true;
});

proba('A maszk-választás: a kódoló maga választ (és az olvasó a választottal fejti vissza) — rövid és ékezetes szövegre is', async () => {
  const szovegek = ['HELLO WORLD', 'koino', 'Árvíztűrő tükörfúrógép — 🗳', veletlenSzoveg(150, true), veletlenSzoveg(300, false)];
  const latott = new Set();
  for (const szoveg of szovegek) {
    for (const szint of ['L', 'M', 'Q', 'H']) {
      const qr = qrKeszitese(szoveg, { szint });
      latott.add(qr.maszk);
      const o = qrOlvasasa(qr.modulok);
      if (o.szoveg !== szoveg || o.maszk !== qr.maszk) return false;
    }
  }
  return latott.size >= 3;
});

proba('Az olvasó nem vak: egy átbillentett adat-modul, egy rossz formátum-bit, a rossz verzió — mind kivétel', async () => {
  const qr = qrKeszitese(veletlenSzoveg(200, true), { szint: 'M', maszk: 2 });
  const masol = () => qr.modulok.map((sor) => Uint8Array.from(sor));
  const n = qr.meret;
  const dob = (m) => { try { qrOlvasasa(m); return false; } catch { return true; } };
  const adatban = masol();
  adatban[n - 1][n - 1] ^= 1;
  const formatumban = masol();
  formatumban[8][0] ^= 1;
  const verzioban = masol();
  verzioban[0][n - 11] ^= 1;
  verzioban[n - 11][0] ^= 1;
  return qr.verzio >= 7 && dob(adatban) && dob(formatumban) && dob(verzioban) && !dob(masol());
});

// ===== A CSERE-KÓD QR-JE ÉS A TERMINÁL =====

proba('⭐ A csere-kód QR-je: Q szint, 5. verzió (37×37), alfanumerikus — és visszaolvasva ugyanaz a kulcs', async () => {
  const { jwk } = await ujCsereJwk();
  const kod = csereKodja(jwk);
  const qr = csereKodQrja(kod);
  const o = qrOlvasasa(qr.modulok);
  return qr.szint === 'Q' && qr.verzio === 5 && qr.meret === 37 && qr.mod === 'alfanumerikus' && o.szoveg === kod
    && (await csereKodbol(o.szoveg)).privatKulcs.d === jwk.d;
});

proba('A terminál-rajz: a VILÁGOS modulok rajzolódnak (a csend-zónával), két modulsor egy sorban — visszaolvasva ugyanaz', async () => {
  const qr = csereKodQrja(csereKodja((await ujCsereJwk()).jwk));
  const keret = 4;
  const sorok = qrTerminalra(qr, { keret });
  const n = qr.meret + 2 * keret;
  if (sorok.length !== Math.ceil(n / 2) || sorok.some((s) => [...s].length !== n)) return false;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const c = [...sorok[y >> 1]][x];
      const vilagosnakRajzolt = y % 2 === 0 ? c === '█' || c === '▀' : c === '█' || c === '▄';
      const mx = x - keret;
      const my = y - keret;
      const belul = mx >= 0 && my >= 0 && mx < qr.meret && my < qr.meret;
      if (vilagosnakRajzolt !== (!belul || qr.modulok[my][mx] === 0)) return false;
    }
  }
  const szines = qrTerminalra(qr, { szinesen: true });
  return szines.every((s, i) => s === '\x1b[97;40m' + sorok[i] + '\x1b[0m');
});

// ===================================
// ⭐⭐ D128 (④a — KF1 (A)): A PÁROSÍTÓ KÓD
// ===================================

proba('⭐⭐ A PÁROSÍTÓ KÓD (④a — KF1 (A)) — oda-vissza (szóközökkel is); a hibás alakot, az idegen előtagot és a sérültet kimondja; a titok bizonyítása a kézfogás átiratához ÉS a készülékhez kötött; az ellenőrző kód a titoké és a készüléké', async () => {
  const A = 'A'.repeat(43);
  const N = 'N'.repeat(43);
  const { kod, titok } = ujParositas({ cimek: [{ hoszt: '192.168.1.5', port: 7374 }, { hoszt: '127.0.0.1', port: 7374 }],
    tablaAlairo: A, nev: N, most: 1000 });
  const szoveg = parositoSzovege(kod);
  const vissza = parositoSzovegbol('  ' + szoveg.slice(0, 40) + '\n ' + szoveg.slice(40) + ' ');
  const hiba = (fn) => { try { fn(); return null; } catch (h) { return h.message; } };
  const idegen = hiba(() => parositoSzovegbol('koino-meghivo.1.' + szoveg.slice(PAROSITO_ELOTAG.length)));
  const serult = hiba(() => parositoSzovegbol(PAROSITO_ELOTAG + '%%%'));
  const rosszAlak = hiba(() => parositoSzovegbol(parositoSzovege({ ...kod, a: 'rövid' })));
  const folos = hiba(() => parositoSzovegbol(parositoSzovege({ ...kod, x: 1 })));
  const atirat1 = Buffer.from('atirat-1');
  const atirat2 = Buffer.from('atirat-2');
  const K1 = 'K'.repeat(43);
  const K2 = 'L'.repeat(43);
  const b = parositasBizonyitasa(titok, atirat1, K1);
  const ok = {
    oda: JSON.stringify(vissza) === JSON.stringify(kod) && kod.l === 1000 + 10 * 60 * 1000 && /^[A-Za-z0-9_-]{22}$/.test(titok),
    idegen: /nem párosító kód/.test(idegen ?? ''), serult: /sérült|hibás/.test(serult ?? ''),
    rosszAlak: /hibás/.test(rosszAlak ?? ''), folos: /hibás/.test(folos ?? ''),
    bizonyitas: b === parositasBizonyitasa(titok, atirat1, K1) && b !== parositasBizonyitasa(titok, atirat2, K1)
      && b !== parositasBizonyitasa(titok, atirat1, K2) && b !== parositasBizonyitasa(ujParositas({ cimek: kod.c.map(([hoszt, port]) =>
        ({ hoszt, port })), tablaAlairo: A, nev: N }).titok, atirat1, K1),
    kod: /^[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(parositasEllenorzoKodja(titok, K1))
      && parositasEllenorzoKodja(titok, K1) === parositasEllenorzoKodja(titok, K1)
      && parositasEllenorzoKodja(titok, K1) !== parositasEllenorzoKodja(titok, K2)
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify(ok) + ')\n');
  return Object.values(ok).every(Boolean);
});

export default async function (csendes) {
  return futtatas(csendes);
}
