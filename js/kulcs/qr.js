// js/kulcs/qr.js

// Felelősség: ⭐⭐ D128 (②c — 16. pont, KC4 (A)): A QR-KÓD — a csere-kulcs papír-alakja mellé („mellette QR”), és később ami még
// képernyőről vagy papírról készülékre megy (a ④ lap: a második készülék felvétele).
//
// ⚠️ NULLA FÜGGŐSÉG (6. szabály): saját kódoló az ISO/IEC 18004 szerint — a szerkezete a széles körben ellenőrzött Nayuki-féle
// kódolóét követi (a hibajavító táblák két számsora, a nyers modulszám képlete, a blokkok felosztása belőlük):
//   1. a szöveg bitekké: alfanumerikus mód (0–9, A–Z, szóköz, $%*+-./:), különben bájt (UTF-8);
//   2. a legkisebb verzió (1–40), amibe a kért hibajavítási szinttel (L, M, Q, H) belefér; lezárás, kitöltés (0xEC, 0x11);
//   3. blokkokra bontás, Reed–Solomon hibajavító szavak (GF(256), 0x11D), összefésülés;
//   4. a mátrix: kereső, időzítő, igazító minták, a formátum (és 7-től a verzió) helye, a kódszavak cikcakkban;
//   5. a nyolc maszk közül a legkisebb büntetésű (a szabvány négy szabálya).
//
// ⭐ Amit a próba mér (`meres/papirProba.js`): a „HELLO WORLD” 1-M ismert kódszavai, a formátum- és verzió-bitek ismert értékei, a
// szabvány kapacitás-táblájának pontjai, és egy próba-olvasó, ami a kész mátrixból visszafejti a szöveget (a hibajavító szavak
// ellenőrzésével). ⚠️ A végső próba a telefon kamerája (⑤ terep).
//
// Használják: koino.js (a csere-kulcs papírra — a terminálba rajzolva), a próbák.

// ===== A SZABVÁNY TÁBLÁI =====

/** A hibajavítási szint jele a formátum-bitekben. */
const FORMATUM_JEL = { L: 1, M: 0, Q: 3, H: 2 };

/** Blokkonként ennyi hibajavító kódszó — verziónként (a 0. index nem használt). */
const HIBAJAVITO = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
};

/** A blokkok száma — verziónként. */
const BLOKKOK = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20,
    21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35,
    37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48,
    51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57,
    60, 63, 66, 70, 74, 77, 81]
};

/** Az alfanumerikus mód jelkészlete (a sorszám a jel értéke). */
export const ALFANUMERIKUS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/** Egy verzió adat-modulainak száma (a minták, a formátum és a verzió helye nélkül). */
export function nyersModulok(verzio) {
  let n = (16 * verzio + 128) * verzio + 64;
  if (verzio >= 2) {
    const igazito = Math.floor(verzio / 7) + 2;
    n -= (25 * igazito - 10) * igazito - 55;
    if (verzio >= 7) n -= 36;
  }
  return n;
}

/** Egy verzió és szint adat-kódszavainak száma (a hibajavítók nélkül). */
export function adatKodszavak(verzio, szint) {
  return Math.floor(nyersModulok(verzio) / 8) - HIBAJAVITO[szint][verzio] * BLOKKOK[szint][verzio];
}

/** A darabszám mezőjének hossza bitben. */
function darabBitek(mod, verzio) {
  const i = verzio < 10 ? 0 : verzio < 27 ? 1 : 2;
  return mod === 'alfanumerikus' ? [9, 11, 13][i] : [8, 16, 16][i];
}

// ===== A SZÖVEG BITEKKÉ =====

/** A szöveg egyetlen szegmense: a mód, a darabszám és az adat bitjei. */
function szegmens(szoveg) {
  const bitek = [];
  const ir = (ertek, hossz) => { for (let i = hossz - 1; i >= 0; i--) bitek.push((ertek >>> i) & 1); };
  if ([...szoveg].every((c) => ALFANUMERIKUS.includes(c))) {
    for (let i = 0; i + 1 < szoveg.length; i += 2) {
      ir(ALFANUMERIKUS.indexOf(szoveg[i]) * 45 + ALFANUMERIKUS.indexOf(szoveg[i + 1]), 11);
    }
    if (szoveg.length % 2) ir(ALFANUMERIKUS.indexOf(szoveg.at(-1)), 6);
    return { mod: 'alfanumerikus', jel: 0b0010, darab: szoveg.length, bitek };
  }
  const bajtok = new TextEncoder().encode(szoveg);
  for (const b of bajtok) ir(b, 8);
  return { mod: 'bajt', jel: 0b0100, darab: bajtok.length, bitek };
}

/**
 * Az ADAT-KÓDSZAVAK: mód, darabszám, adat, lezárás, kitöltés — a legkisebb verzióval, amibe belefér.
 * @returns {{verzio: number, kodszavak: number[], mod: string}}
 */
export function adatKodolasa(szoveg, szint = 'M', legkisebbVerzio = 1) {
  if (!Object.hasOwn(FORMATUM_JEL, szint)) throw new Error('qr: ismeretlen hibajavítási szint: ' + szint);
  const sz = szegmens(String(szoveg));
  for (let verzio = legkisebbVerzio; verzio <= 40; verzio++) {
    const kapacitas = adatKodszavak(verzio, szint) * 8;
    const db = darabBitek(sz.mod, verzio);
    const hossz = 4 + db + sz.bitek.length;
    if (sz.darab >= 2 ** db || hossz > kapacitas) continue;
    const bitek = [];
    const ir = (ertek, n) => { for (let i = n - 1; i >= 0; i--) bitek.push((ertek >>> i) & 1); };
    ir(sz.jel, 4);
    ir(sz.darab, db);
    bitek.push(...sz.bitek);
    ir(0, Math.min(4, kapacitas - bitek.length));   // a lezárás (legfeljebb 4 nulla)
    ir(0, (8 - bitek.length % 8) % 8);              // bájthatárig
    const kodszavak = [];
    for (let i = 0; i < bitek.length; i += 8) kodszavak.push(parseInt(bitek.slice(i, i + 8).join(''), 2));
    for (let p = 0xEC; kodszavak.length < kapacitas / 8; p ^= 0xEC ^ 0x11) kodszavak.push(p);
    return { verzio, kodszavak, mod: sz.mod };
  }
  throw new Error('qr: a szöveg túl hosszú (' + sz.darab + ' jel) a ' + szint + ' szinthez');
}

// ===== REED–SOLOMON (GF(256), a 0x11D polinommal) =====

function gfSzorzas(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

/** A generátor-polinom (a gyökei α^0 … α^(fok-1)), a legmagasabb tag nélkül. */
function rsOszto(fok) {
  const ki = new Array(fok).fill(0);
  ki[fok - 1] = 1;
  let gyok = 1;
  for (let i = 0; i < fok; i++) {
    for (let j = 0; j < fok; j++) {
      ki[j] = gfSzorzas(ki[j], gyok);
      if (j + 1 < fok) ki[j] ^= ki[j + 1];
    }
    gyok = gfSzorzas(gyok, 0x02);
  }
  return ki;
}

/** A hibajavító szavak: az adat maradéka a generátor-polinommal osztva. */
export function rsMaradek(adat, fok) {
  const oszto = rsOszto(fok);
  const ki = new Array(fok).fill(0);
  for (const b of adat) {
    const tenyezo = b ^ ki.shift();
    ki.push(0);
    for (let i = 0; i < fok; i++) ki[i] ^= gfSzorzas(oszto[i], tenyezo);
  }
  return ki;
}

/**
 * A blokkok felosztása: blokkonként az adat-kódszavak száma (a rövidebbek elöl, a hosszabbak egy kódszóval többet visznek), és a
 * blokkonkénti hibajavító szavak száma.
 */
export function blokkFelosztas(verzio, szint) {
  const blokkSzam = BLOKKOK[szint][verzio];
  const fok = HIBAJAVITO[szint][verzio];
  const nyers = Math.floor(nyersModulok(verzio) / 8);
  const rovidek = blokkSzam - nyers % blokkSzam;
  const rovidHossz = Math.floor(nyers / blokkSzam);
  return { fok, adatHosszak: Array.from({ length: blokkSzam }, (_, i) => rovidHossz - fok + (i < rovidek ? 0 : 1)) };
}

/** Blokkokra bontás, hibajavítás, összefésülés — a mátrixba kerülő kódszavak sora. */
export function blokkokOsszefesulese(adat, verzio, szint) {
  const { fok, adatHosszak } = blokkFelosztas(verzio, szint);
  const blokkok = [];
  let k = 0;
  for (const n of adatHosszak) {
    const d = adat.slice(k, k + n);
    k += n;
    blokkok.push({ d, h: rsMaradek(d, fok) });
  }
  const ki = [];
  for (let i = 0; i < Math.max(...adatHosszak); i++) for (const b of blokkok) if (i < b.d.length) ki.push(b.d[i]);
  for (let i = 0; i < fok; i++) for (const b of blokkok) ki.push(b.h[i]);
  return ki;
}

// ===== A MÁTRIX =====

/** Az igazító minták középpontjainak sor- (és oszlop-) helyei. */
export function igazitoHelyek(verzio) {
  if (verzio === 1) return [];
  const db = Math.floor(verzio / 7) + 2;
  const lepes = Math.floor((verzio * 8 + db * 3 + 5) / (db * 4 - 4)) * 2;
  const ki = [6];
  for (let hely = verzio * 4 + 10; ki.length < db; hely -= lepes) ki.splice(1, 0, hely);
  return ki;
}

/** A formátum 15 bitje (a szint, a maszk, BCH-javítás, a 0x5412 maszk). */
export function formatumBitek(szint, maszk) {
  const adat = (FORMATUM_JEL[szint] << 3) | maszk;
  let m = adat;
  for (let i = 0; i < 10; i++) m = (m << 1) ^ ((m >>> 9) * 0x537);
  return ((adat << 10) | m) ^ 0x5412;
}

/** A verzió 18 bitje (7-től; BCH-javítás). */
export function verzioBitek(verzio) {
  let m = verzio;
  for (let i = 0; i < 12; i++) m = (m << 1) ^ ((m >>> 11) * 0x1F25);
  return (verzio << 12) | m;
}

/** A nyolc maszk (x az oszlop, y a sor). */
const MASZKOK = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
  (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
  (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
];
export { MASZKOK };

/** A formátum két példánya (és a mindig sötét modul). */
function formatumIrasa(tesz, meret, bitek) {
  const bit = (i) => ((bitek >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) tesz(8, i, bit(i));
  tesz(8, 7, bit(6));
  tesz(8, 8, bit(7));
  tesz(7, 8, bit(8));
  for (let i = 9; i < 15; i++) tesz(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) tesz(meret - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) tesz(8, meret - 15 + i, bit(i));
  tesz(8, meret - 8, true);
}

/** A rögzített minták (kereső, időzítő, igazító), a formátum és a verzió helye. */
function alapMinta(verzio) {
  const meret = verzio * 4 + 17;
  const modulok = Array.from({ length: meret }, () => new Uint8Array(meret));
  const rogzitett = Array.from({ length: meret }, () => new Uint8Array(meret));
  const tesz = (x, y, sotet) => { modulok[y][x] = sotet ? 1 : 0; rogzitett[y][x] = 1; };
  for (let i = 0; i < meret; i++) {
    tesz(6, i, i % 2 === 0);
    tesz(i, 6, i % 2 === 0);
  }
  for (const [kx, ky] of [[3, 3], [meret - 4, 3], [3, meret - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = kx + dx;
        const y = ky + dy;
        if (x < 0 || y < 0 || x >= meret || y >= meret) continue;
        const tav = Math.max(Math.abs(dx), Math.abs(dy));
        tesz(x, y, tav !== 2 && tav !== 4);
      }
    }
  }
  const helyek = igazitoHelyek(verzio);
  const utolso = helyek.length - 1;
  helyek.forEach((ax, i) => helyek.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === utolso) || (i === utolso && j === 0)) return;   // a kereső minták helye
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) tesz(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }));
  formatumIrasa(tesz, meret, 0);   // a helye lefoglalva — a maszk után írjuk be
  if (verzio >= 7) {
    const v = verzioBitek(verzio);
    for (let i = 0; i < 18; i++) {
      const sotet = ((v >>> i) & 1) === 1;
      const a = meret - 11 + i % 3;
      const b = Math.floor(i / 3);
      tesz(a, b, sotet);
      tesz(b, a, sotet);
    }
  }
  return { meret, modulok, rogzitett, tesz };
}

/** A kódszavak cikcakkban, jobbról balra két oszloponként (a 6. oszlop az időzítőé). */
function kodszavakElhelyezese(modulok, rogzitett, meret, kodszavak) {
  let i = 0;
  for (let jobb = meret - 1; jobb >= 1; jobb -= 2) {
    if (jobb === 6) jobb = 5;
    const felfele = ((jobb + 1) & 2) === 0;
    for (let lepes = 0; lepes < meret; lepes++) {
      const y = felfele ? meret - 1 - lepes : lepes;
      for (let j = 0; j < 2; j++) {
        const x = jobb - j;
        if (rogzitett[y][x] || i >= kodszavak.length * 8) continue;
        modulok[y][x] = (kodszavak[i >>> 3] >>> (7 - (i & 7))) & 1;
        i++;
      }
    }
  }
}

/** A maszk rárakása (vagy levétele — ugyanaz a művelet) a nem rögzített modulokra. */
function maszkolas(modulok, rogzitett, meret, maszk) {
  const f = MASZKOK[maszk];
  for (let y = 0; y < meret; y++) for (let x = 0; x < meret; x++) if (!rogzitett[y][x] && f(x, y)) modulok[y][x] ^= 1;
}

/** A büntetés (a szabvány négy szabálya) — a legkisebbet adó maszk nyer. */
function buntetes(modulok, meret) {
  let pont = 0;
  const vonalak = [];
  for (let y = 0; y < meret; y++) vonalak.push(Array.from(modulok[y]));
  for (let x = 0; x < meret; x++) vonalak.push(modulok.map((sor) => sor[x]));
  for (const v of vonalak) {
    let hossz = 1;
    for (let i = 1; i <= v.length; i++) {
      if (i < v.length && v[i] === v[i - 1]) { hossz++; continue; }
      if (hossz >= 5) pont += hossz - 2;
      hossz = 1;
    }
    const s = '0000' + v.join('') + '0000';
    for (const minta of ['00001011101', '10111010000']) {
      for (let i = s.indexOf(minta); i !== -1; i = s.indexOf(minta, i + 1)) pont += 40;
    }
  }
  for (let y = 0; y + 1 < meret; y++) {
    for (let x = 0; x + 1 < meret; x++) {
      const c = modulok[y][x];
      if (c === modulok[y][x + 1] && c === modulok[y + 1][x] && c === modulok[y + 1][x + 1]) pont += 3;
    }
  }
  let sotet = 0;
  for (const sor of modulok) for (const c of sor) sotet += c;
  const ossz = meret * meret;
  pont += Math.max(0, Math.ceil(Math.abs(sotet * 20 - ossz * 10) / ossz) - 1) * 10;
  return pont;
}

// ===== A KÜLSŐ FELÜLET =====

/**
 * A QR-KÓD mátrixa.
 * @param {string} szoveg
 * @param {{szint?: 'L'|'M'|'Q'|'H', maszk?: number, legkisebbVerzio?: number}} [beallitas]
 * @returns {{verzio: number, szint: string, maszk: number, meret: number, mod: string, modulok: Uint8Array[]}}
 *   (`modulok[y][x]` = 1 a sötét modul)
 */
export function qrKeszitese(szoveg, { szint = 'M', maszk, legkisebbVerzio = 1 } = {}) {
  const { verzio, kodszavak, mod } = adatKodolasa(szoveg, szint, legkisebbVerzio);
  const { meret, modulok, rogzitett, tesz } = alapMinta(verzio);
  kodszavakElhelyezese(modulok, rogzitett, meret, blokkokOsszefesulese(kodszavak, verzio, szint));
  let valasztott = maszk;
  if (valasztott === undefined) {
    let legjobb = Infinity;
    for (let m = 0; m < 8; m++) {
      maszkolas(modulok, rogzitett, meret, m);
      formatumIrasa(tesz, meret, formatumBitek(szint, m));
      const p = buntetes(modulok, meret);
      if (p < legjobb) { legjobb = p; valasztott = m; }
      maszkolas(modulok, rogzitett, meret, m);
    }
  }
  if (!(valasztott >= 0 && valasztott <= 7)) throw new Error('qr: a maszk 0–7');
  maszkolas(modulok, rogzitett, meret, valasztott);
  formatumIrasa(tesz, meret, formatumBitek(szint, valasztott));
  return { verzio, szint, maszk: valasztott, meret, mod, modulok };
}

/**
 * A QR TERMINÁLBA rajzolva — két modulsor egy szövegsorban (▀ ▄ █). ⭐ A VILÁGOS modulok rajzolódnak (a csend-zónával együtt): a
 * sötét hátterű terminálon (Termux, Windows Terminal) így a sötét modul a háttér. A `szinesen` a színt rögzíti (fehér a feketén) —
 * így a világos hátterű terminálon is jó.
 * @param {{modulok: Uint8Array[], meret: number}} qr
 * @param {{keret?: number, szinesen?: boolean}} [beallitas]
 * @returns {string[]} a sorok
 */
export function qrTerminalra(qr, { keret = 4, szinesen = false } = {}) {
  const n = qr.meret + 2 * keret;
  const vilagos = (x, y) => {
    const mx = x - keret;
    const my = y - keret;
    return mx < 0 || my < 0 || mx >= qr.meret || my >= qr.meret || !qr.modulok[my][mx];
  };
  const sorok = [];
  for (let y = 0; y < n; y += 2) {
    let s = '';
    for (let x = 0; x < n; x++) {
      const fent = vilagos(x, y);
      const lent = y + 1 < n && vilagos(x, y + 1);
      s += fent && lent ? '█' : fent ? '▀' : lent ? '▄' : ' ';
    }
    sorok.push(szinesen ? '\x1b[97;40m' + s + '\x1b[0m' : s);
  }
  return sorok;
}
