// meres/kulcsMeres.js

// Felelősség: ⭐ A 93. MÉRÉS — A KULCS: TÖBB KÉSZÜLÉK ÉS A HELYREÁLLÍTÁS (az ET-3 átvizsgálása, 2026-11-13; a tervező ág terve:
// `docs/terv_kulcs.md`, az átvizsgálás: `docs/kulcs_atvizsgalas.md`). Nem önpróba: számokat és leleteket ad, programkód nélkül.
//
//   (a) A MAI ELÁGAZÁS — két készülék UGYANAZZAL a kulccsal, egy közös lánc-végről, egymásról nem tudva ír (offline, vagy két
//       őrjárat egy kulccsal): a valódi feloldás (`elagazasokFeloldasa` — sorszámonként a kisebb azonosító) mit hagy meg, és mi
//       lesz értelmetlen (egy pont, aminek a gondolata elveszett).
//   (b) A BEMONDOTT ÖSSZEG KÉT LÁNCON — a közös keret (ET-3/3 (A)) és a mai bizonyíték (D42 — a bemondott összeg; D81 — a
//       bizonyíték az eseménnyel utazik): a valódi `pontEsemenyMerlege` egy becsületes, két készüléket használó e-ember eseményeire,
//       (1) ha a két láncot EGYNEK számoljuk, (2) ha mindegyiket a SAJÁT készüléke rálátásán, (3) ha a keret készülékenként osztott.
//   (c) AZ ESEMÉNY MÉRETE — egy mai pont-esemény, egy `keszulek` mezővel, és egy beágyazott készülék-tanúsítvánnyal (6. szabály).
//   (d) A LÁNCOK ÖSSZEFÉSÜLÉSE — 2–3 készülék lánca, minden esemény mondja, a többiből meddig látott: egy rögzített sorrend (a
//       láthatóság szerint, a holtversenyben a kisebb azonosító) ára N eseményre.
//   (e) A BEÉPÍTETT KRIPTOGRÁFIA — mi van (Ed25519, X25519, HKDF, PBKDF2, AES-GCM), és a jelszavas darab-visszaadáshoz kellő
//       tetszőleges görbe-szorzás: a WebCrypto X25519-e a skalárt „csonkolja” (clamping) — mérve egy saját BigInt-létrával; a
//       titok-megosztás (7 darab, bármely 3) és a jelszó-nyújtás (PBKDF2) ideje.
//   (f) AZ ŐRZŐK MEGMARADÁSA — modell: n őrző, k kell, p az egy évi megmaradás; havi újraosztással és nélküle.
//
// Futtatás: node meres/kulcsMeres.js [a|b|c|d|e|f]   (argumentum nélkül mind)

import { kiir } from './naplo.js';
import { esemenyLetrehozasa } from '../js/esemeny/esemeny.js';
import { elagazasokFeloldasa } from '../js/allapot/allapotSzamitas.js';
import { pontEsemenyMerlege } from '../js/allapot/szabalyok.js';
import { kanonikusBajtok } from '../js/esemeny/kanonikusAlak.js';
import { webcrypto as wc, randomBytes } from 'node:crypto';

const RESZ = process.argv[2] ?? null;
const resz = (x) => !RESZ || RESZ === x;
const bajt = (e) => Buffer.byteLength(JSON.stringify(e));
const T0 = Date.UTC(2026, 10, 13);
const KOINO = 'K'.repeat(43);
const b64 = (u) => Buffer.from(u).toString('base64url');

async function kulcspar() {
  return wc.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
}

// ===================================
// (a) A MAI ELÁGAZÁS
// ===================================

async function elagazas() {
  kiir('\n(a) A MAI ELÁGAZÁS — két készülék ugyanazzal a kulccsal, egy közös lánc-végről, egymásról nem tudva');
  const k = await kulcspar();
  // a közös előtag: 3 esemény
  let elozo = null;
  const elotag = [];
  for (let i = 1; i <= 3; i++) {
    const e = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: 'közös ' + i }, elozo, sorszam: i, ido: T0 + i,
      entitas: null }, k);
    elotag.push(e);
    elozo = e.azonosito;
  }
  // a két készülék: gondolat + pont párok (a pont a saját gondolatára mutat)
  const ag = async (nev, parok, ido0) => {
    const ki = [];
    let el = elozo;
    let s = 3;
    for (let i = 0; i < parok; i++) {
      const g = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: nev + ' ' + i }, elozo: el, sorszam: ++s,
        ido: ido0 + i * 2, entitas: null }, k);
      const p = await esemenyLetrehozasa({ koino: KOINO, tipus: 'TudatpontRendezes', adat: { entitas: g.azonosito, pont: 10 }, elozo: g.azonosito,
        sorszam: ++s, ido: ido0 + i * 2 + 1, entitas: g.azonosito }, k);
      ki.push(g, p);
      el = p.azonosito;
    }
    return ki;
  };
  for (const [a, b] of [[1, 1], [3, 2], [5, 5], [10, 3]]) {
    const A = await ag('laptop', a, T0 + 1000);
    const B = await ag('telefon', b, T0 + 2000);
    const { ervenyesek, ellentmondasok } = elagazasokFeloldasa([...elotag, ...A, ...B]);
    const marad = new Set(ervenyesek.map((e) => e.azonosito));
    const aMarad = A.filter((e) => marad.has(e.azonosito)).length;
    const bMarad = B.filter((e) => marad.has(e.azonosito)).length;
    // értelmetlen: megmaradt pont, aminek a gondolata elveszett
    const arva = [...A, ...B].filter((e) => e.tipus === 'TudatpontRendezes' && marad.has(e.azonosito) && !marad.has(e.adat.entitas)).length;
    kiir('  a laptop ' + A.length + ', a telefon ' + B.length + ' eseményt írt → megmaradt ' + aMarad + ' + ' + bMarad + ', elveszett '
      + (A.length + B.length - aMarad - bMarad) + ' · ütköző sorszám: ' + ellentmondasok.length + ' · árva pont (a gondolata elveszett): ' + arva);
  }
  kiir('  ⭐ sorszámonként EGY marad (a kisebb azonosító) — a két ágból vegyesen; ami csak az egyikben van (a hosszabb vége), megmarad.');
}

// ===================================
// (b) A BEMONDOTT ÖSSZEG KÉT LÁNCON
// ===================================

function bemondott() {
  kiir('\n(b) A BEMONDOTT ÖSSZEG KÉT LÁNCON — egy becsületes e-ember, két készülék, a keret 10 000');
  const KERET = 10000;
  // a laptop: 8000 a „Könyvtár”-ra (ő ezt mondja be: összesen 8000); a telefon offline, a laptopról nem tud: 1000 a „Park”-ra
  // (összesen 1000 — a SAJÁT rálátása szerint)
  const laptop = { adat: { entitas: 'Konyvtar', pont: 8000, kiosztva: 8000 } };
  const telefon = { adat: { entitas: 'Park', pont: 1000, kiosztva: 1000 } };
  const telefon3 = { adat: { entitas: 'Park', pont: 3000, kiosztva: 3000 } };
  const ures = { pontok: new Map(), osszeg: 0 };
  const laptopUtan = { pontok: new Map([['Konyvtar', 8000]]), osszeg: 8000 };
  const r = (m) => (m.elvetve ? '⛔ ELVETVE — ' + m.elvetve : m.jelzes ? '⚠ jelzés — ' + m.jelzes : '✓ számít (összesen ' + m.ujOsszeg + ')');
  kiir('  (1) a két lánc EGYNEK számolva (a laptop eseménye után a telefoné, hézag nélkül):');
  kiir('      a laptop: ' + r(pontEsemenyMerlege(laptop, ures, true, KERET)));
  kiir('      a telefon: ' + r(pontEsemenyMerlege(telefon, laptopUtan, true, KERET)));
  kiir('      → a becsületes telefon „hazudott” — a mai gépezet egy két készüléket használó embert vádolna.');
  kiir('  (2) mindegyik a SAJÁT készüléke rálátásán (a telefon a laptopét nem látta), utána a közös keret külön:');
  const t2 = pontEsemenyMerlege(telefon, ures, true, KERET);
  kiir('      a telefon a saját rálátásán: ' + r(t2) + ' · a közös összeg 8000 + 1000 = 9000 ≤ 10 000 → mindkettő számít');
  kiir('      ha a telefon 3000-et tesz: a saját rálátásán ' + r(pontEsemenyMerlege(telefon3, ures, true, KERET))
    + ' · a közös összeg 11 000 > 10 000 → a rögzített sorrendben a későbbi nem fér bele (kimondva)');
  kiir('      → KÉT ellenőrzés kell: a bemondás a készülék rálátásán (a mai gépezet, készülékenként), és a keret a közös sorrendben (új).');
  kiir('  (3) a keret készülékenként osztva (a laptop 9000, a telefon 1000):');
  kiir('      a laptop: ' + r(pontEsemenyMerlege(laptop, ures, true, 9000)) + ' · a telefon: ' + r(pontEsemenyMerlege(telefon, ures, true, 1000)));
  kiir('      a telefon 3000-zel: ' + r(pontEsemenyMerlege(telefon3, ures, true, 1000)) + ' — offline is biztos, a mai gépezet változatlan');
}

// ===================================
// (c) AZ ESEMÉNY MÉRETE
// ===================================

async function meret() {
  kiir('\n(c) AZ ESEMÉNY MÉRETE — egy pont-esemény ma, egy `keszulek` mezővel, és egy beágyazott készülék-tanúsítvánnyal');
  const azonossag = await kulcspar();
  const keszulek = await kulcspar();
  const pub = async (k) => b64(new Uint8Array(await wc.subtle.exportKey('raw', k.publicKey)));
  const e = await esemenyLetrehozasa({ koino: KOINO, tipus: 'TudatpontRendezes', adat: { entitas: 'E'.repeat(43), pont: 120, kiosztva: 3400 },
    elozo: 'P'.repeat(43), sorszam: 57, ido: T0, entitas: 'E'.repeat(43), entitasSorszam: 3, latott: ['L'.repeat(43)] }, keszulek);
  const ma = bajt(e);
  const keszulekMezo = { ...e, keszulek: await pub(keszulek) };
  // a tanúsítvány: az azonosság kulcsa aláírja: „ez a kulcs az én készülékem” — koinótól függetlenül
  const tan = { azonossag: await pub(azonossag), keszulek: await pub(keszulek), nev: 'telefon', ido: T0 };
  const alairas = b64(new Uint8Array(await wc.subtle.sign('Ed25519', azonossag.privateKey, kanonikusBajtok(tan))));
  const tanusitvany = { ...tan, alairas };
  const beagyazva = { ...keszulekMezo, tanusitvany };
  kiir('  ma: ' + ma + ' B · + a `keszulek` mező: ' + bajt(keszulekMezo) + ' B (+' + (bajt(keszulekMezo) - ma) + ') · + a beágyazott tanúsítvány: '
    + bajt(beagyazva) + ' B (+' + (bajt(beagyazva) - ma) + ')');
  kiir('  a tanúsítvány maga: ' + bajt(tanusitvany) + ' B — ⭐ ha minden eseményben utazna, minden esemény ~' + Math.round(100 * (bajt(beagyazva) - ma) / ma)
    + '%-kal nőne; ha készülékenként és koinónként EGYSZER (a készülék első eseménye hozza, vagy a kérelem kéri el), az esemény csak a mezővel nő.');
}

// ===================================
// (d) A LÁNCOK ÖSSZEFÉSÜLÉSE
// ===================================

function osszefesules() {
  kiir('\n(d) A LÁNCOK ÖSSZEFÉSÜLÉSE — d készülék, minden esemény mondja, a többi készülék láncából meddig látott');
  // modell: a készülékek felváltva írnak, és véletlenül „szinkronizálnak” (ekkor a másik láncának végét látják)
  const general = (d, n) => {
    const lancok = Array.from({ length: d }, () => []);
    const latott = Array.from({ length: d }, () => new Array(d).fill(0));
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * d);
      if (Math.random() < 0.2) for (let m = 0; m < d; m++) latott[k][m] = lancok[m].length;   // szinkron
      lancok[k].push({ az: randomBytes(8).toString('hex'), kesz: k, s: lancok[k].length + 1, lat: [...latott[k]] });
    }
    return lancok;
  };
  // a rendezés: egy esemény akkor jöhet, ha a saját előzője és minden, amit látott, már bent van; holtversenyben a kisebb azonosító
  const rendez = (lancok) => {
    const d = lancok.length;
    const fej = new Array(d).fill(0);
    const ki = [];
    const n = lancok.reduce((s, l) => s + l.length, 0);
    while (ki.length < n) {
      let legjobb = null;
      for (let k = 0; k < d; k++) {
        const e = lancok[k][fej[k]];
        if (!e) continue;
        if (e.lat.some((x, m) => m !== k && x > fej[m])) continue;   // még nem jöhet
        if (!legjobb || e.az < legjobb.az) legjobb = e;
      }
      if (!legjobb) throw new Error('kör');
      ki.push(legjobb);
      fej[legjobb.kesz]++;
    }
    return ki;
  };
  for (const d of [2, 3]) {
    for (const n of [1000, 10000, 100000]) {
      const l = general(d, n);
      const t = performance.now();
      const r = rendez(l);
      kiir('  ' + d + ' készülék, ' + n + ' esemény: ' + (performance.now() - t).toFixed(1) + ' ms (' + r.length + ' rendezve)');
    }
  }
  kiir('  ⭐ egy azonosság eseményein, lineárisan (lépésenként d jelölt) — a teher a saját eseményeivel nő, nem a koinóval (9. szabály).');
}

// ===================================
// (e) A BEÉPÍTETT KRIPTOGRÁFIA
// ===================================

const P = 2n ** 255n - 19n;
const A24 = 121665n;
const mod = (a) => ((a % P) + P) % P;
function hatvany(a, e) { let r = 1n; a = mod(a); while (e > 0n) { if (e & 1n) r = r * a % P; a = a * a % P; e >>= 1n; } return r; }
/** Az X25519 létra (RFC 7748) tetszőleges skalárral — csonkolás NÉLKÜL. */
function letra(k, u) {
  let x1 = u, x2 = 1n, z2 = 0n, x3 = u, z3 = 1n, csere = 0n;
  for (let t = 254n; t >= 0n; t--) {
    const kt = (k >> t) & 1n;
    csere ^= kt;
    if (csere) { [x2, x3] = [x3, x2]; [z2, z3] = [z3, z2]; }
    csere = kt;
    const A = mod(x2 + z2), AA = A * A % P, B = mod(x2 - z2), BB = B * B % P, E = mod(AA - BB);
    const C = mod(x3 + z3), D = mod(x3 - z3), DA = D * A % P, CB = C * B % P;
    x3 = mod((DA + CB) ** 2n); z3 = mod(x1 * mod((DA - CB) ** 2n));
    x2 = AA * BB % P; z2 = mod(E * mod(AA + A24 * E));
  }
  if (csere) { [x2, x3] = [x3, x2]; [z2, z3] = [z3, z2]; }
  return x2 * hatvany(z2, P - 2n) % P;
}
const leBigInt = (u8) => u8.reduce((a, b, i) => a + (BigInt(b) << (8n * BigInt(i))), 0n);
const csonkol = (u8) => { const k = Uint8Array.from(u8); k[0] &= 248; k[31] &= 127; k[31] |= 64; return k; };

// A GF(256) titok-megosztás (Shamir) — bájtonként, a 0x11b polinommal.
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
{ let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x ^= (x << 1) ^ ((x & 0x80) ? 0x11b : 0); x &= 0xff; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; }
const gmul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
const gdiv = (a, b) => (a ? EXP[(LOG[a] + 255 - LOG[b]) % 255] : 0);
function oszt(titok, n, k) {
  const darabok = Array.from({ length: n }, (_, i) => ({ x: i + 1, y: new Uint8Array(titok.length) }));
  for (let j = 0; j < titok.length; j++) {
    const egyutthato = [titok[j], ...randomBytes(k - 1)];
    for (const d of darabok) { let y = 0; for (let m = k - 1; m >= 0; m--) y = gmul(y, d.x) ^ egyutthato[m]; d.y[j] = y; }
  }
  return darabok;
}
function osszerak(darabok) {
  const ki = new Uint8Array(darabok[0].y.length);
  for (let j = 0; j < ki.length; j++) {
    let s = 0;
    for (const a of darabok) {
      let l = 1;
      for (const b of darabok) if (a !== b) l = gmul(l, gdiv(b.x, a.x ^ b.x));
      s ^= gmul(a.y[j], l);
    }
    ki[j] = s;
  }
  return ki;
}

async function kripto() {
  kiir('\n(e) A BEÉPÍTETT KRIPTOGRÁFIA (Node ' + process.version + ')');
  const van = async (nev, fv) => { try { await fv(); kiir('  ✓ ' + nev); } catch (h) { kiir('  ✗ ' + nev + ' — ' + h.message); } };
  await van('Ed25519 (aláírás)', async () => { const k = await kulcspar(); await wc.subtle.sign('Ed25519', k.privateKey, new Uint8Array(4)); });
  await van('X25519 (kulcs-egyeztetés)', async () => { const a = await wc.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
    const b = await wc.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
    await wc.subtle.deriveBits({ name: 'X25519', public: b.publicKey }, a.privateKey, 256); });
  await van('HKDF', async () => { const k = await wc.subtle.importKey('raw', new Uint8Array(32), 'HKDF', false, ['deriveBits']);
    await wc.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(16), info: new Uint8Array(0) }, k, 256); });
  await van('AES-GCM', async () => { const k = await wc.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    await wc.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(12) }, k, new Uint8Array(32)); });
  // a jelszó-nyújtás ideje
  const jelszo = await wc.subtle.importKey('raw', new TextEncoder().encode('korte-alma-12'), 'PBKDF2', false, ['deriveBits']);
  for (const it of [100000, 600000]) {
    const t = performance.now();
    await wc.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(16), iterations: it }, jelszo, 256);
    kiir('  ✓ PBKDF2 ' + it + ' kör: ' + (performance.now() - t).toFixed(0) + ' ms (a telefonon ~3–5×)');
  }
  // ⭐ a csonkolás: a WebCrypto X25519-e clamp(r)·P-t számol, nem r·P-t — a saját létra mindkettőt tudja
  const pkcs8 = (k32) => Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), Buffer.from(k32)]);
  const alap = new Uint8Array(32); alap[0] = 9;
  const alapKulcs = await wc.subtle.importKey('raw', alap, { name: 'X25519' }, true, []);
  let egyezikCsonkolva = 0, egyezikNyersen = 0;
  const PROBA = 20;
  for (let i = 0; i < PROBA; i++) {
    const r = randomBytes(32);
    const priv = await wc.subtle.importKey('pkcs8', pkcs8(r), { name: 'X25519' }, false, ['deriveBits']);
    const w = leBigInt(new Uint8Array(await wc.subtle.deriveBits({ name: 'X25519', public: alapKulcs }, priv, 256)));
    if (letra(leBigInt(csonkol(r)), 9n) === w) egyezikCsonkolva++;
    const nyers = leBigInt(r) & ((1n << 255n) - 1n);
    if (letra(nyers, 9n) === w) egyezikNyersen++;
  }
  kiir('  ⭐ X25519 a WebCryptóban, ' + PROBA + ' véletlen skalár: a saját létra CSONKOLT skalárral ' + egyezikCsonkolva + '/' + PROBA
    + ' egyezik, NYERS skalárral ' + egyezikNyersen + '/' + PROBA + ' → a WebCrypto csak csonkolt skalárral szoroz');
  const t = performance.now();
  const M = 20;
  for (let i = 0; i < M; i++) letra(leBigInt(randomBytes(32)) & ((1n << 255n) - 1n), 9n);
  kiir('  ⭐ a saját BigInt-létra (tetszőleges skalár): ' + ((performance.now() - t) / M).toFixed(1) + ' ms / szorzás — a jelszavas '
    + 'visszaadás egy-két szorzás őrzőnként, ritkán → elég gyors; ⚠️ de a helyessége a mi felelősségünk (a fenti egyezés méri)');
  // a titok-megosztás
  const titok = randomBytes(32);
  const t2 = performance.now();
  const d = oszt(titok, 7, 3);
  const ossze = osszerak([d[1], d[4], d[6]]);
  const ketto = osszerak([d[0], d[3]]);
  kiir('  ✓ Shamir GF(256): 32 B titok → 7 darab (bármely 3): ' + (performance.now() - t2).toFixed(2) + ' ms; 3 darabból vissza: '
    + (Buffer.compare(Buffer.from(ossze), titok) === 0 ? 'egyezik' : 'NEM') + '; 2 darabból: ' + (Buffer.compare(Buffer.from(ketto), titok) === 0 ? 'egyezik (!)' : 'más (helyes)'));
  kiir('  egy darab: 1 + 32 B, AES-GCM-mel csomagolva ~61 B, a vakított jellel és a fejléccel ~100 B');
}

// ===================================
// (f) AZ ŐRZŐK MEGMARADÁSA
// ===================================

function orzok() {
  kiir('\n(f) AZ ŐRZŐK MEGMARADÁSA — modell (nem terepi adat): n őrző, k kell; p: egy őrző egy év múlva is elérhető');
  const binom = (n, m) => { let r = 1; for (let i = 1; i <= m; i++) r = r * (n - m + i) / i; return r; };
  const legalabb = (n, k, q) => { let s = 0; for (let m = k; m <= n; m++) s += binom(n, m) * q ** m * (1 - q) ** (n - m); return s; };
  for (const p of [0.5, 0.7, 0.9]) {
    const sor = [];
    for (const [n, k] of [[5, 3], [7, 3], [9, 3]]) {
      const ujraosztas = Math.pow(legalabb(n, k, Math.pow(p, 1 / 12)), 12);   // havonta újraosztva (a hiányzók pótolva)
      sor.push(n + '/' + k + ': újraosztás nélkül ' + (100 * legalabb(n, k, p)).toFixed(1) + '%, havi újraosztással ' + (100 * ujraosztas).toFixed(2) + '%');
    }
    kiir('  p = ' + p + ' → ' + sor.join(' · '));
  }
  kiir('  ⭐ az újraosztás (a készüléked, amíg él) a döntő: vele 7/3 még p = 0,5-nél is ~99%; ha a készülék is elveszett, az újraosztás megáll.');
}

if (resz('a')) await elagazas();
if (resz('b')) bemondott();
if (resz('c')) await meret();
if (resz('d')) osszefesules();
if (resz('e')) await kripto();
if (resz('f')) orzok();
kiir('');
