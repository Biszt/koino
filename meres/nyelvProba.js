// meres/nyelvProba.js

// Felelősség: A PROTOKOLL NYELVVÁLTOZATÁNAK PRÓBÁJA (D124 — a D123 PR6-ja, az építés ①-e; `js/csere/nyelvValtozat.js`):
//   · a közös nyelv számítása — mindkét fél ugyanazt kapja; jel nélkül az 1-es; a hibás jel megnevezve;
//   · a CSERE a résen: közös nyelven lemegy (és mindkét fél ugyanazt a közöset mondja), közös nélkül MINDKÉT fél megnevezett
//     hibával áll meg, és semmi nem megy át;
//   · a KÉRELEM útjai (a szelet, a válasz, a fájl a cserénél és a fájl a randevún): közös nélkül a kérő ÉS a kiszolgáló is
//     megnevezve áll meg;
//   · ⭐⭐ (D124 / PV6) a VALÓDI régi program — a git-ből elővéve (a PR6 előtti utolsó program, jel nélkül) — a mai programmal:
//     cserélnek, a régi kérő megkapja a szeletét, a mai kérő is a régitől; és a mai „2-es” program a régit régebbinek nevezi.
//     Ha a régi program nincs meg (nincs git, vagy egy sekély klón a telefonon), a próba ezt kimondja, és kihagyja.
//   · ⭐⭐ (az építés ②-e) a SZÁLLÍTÁS JELE a kopogásban (`udpKapu.js`): közös szállításon munka indul (a közös számmal);
//     közös nélkül munka és visszakopogás nincs, mindkét kapu megnevezi az irányt, a kör bukása is megnevezve; a csomagok
//     szintjén: a válasz viszi a jelünket, egy társ sok kopogása egy jelzés, a hibás jel válasz nélkül, megnevezve; és a VALÓDI
//     régi kapu (a git-ből) a maival kopog és dolgozik, a mai „2-es” pedig a régit megnevezi.
//   · ⭐⭐ (az építés ③-a) AKIVEL NEM ÉRTJÜK EGYMÁST (`nyelvEmlekezet.js`): 3 egymás utáni kör után 6 óra szünet, egy kör egy
//     megfigyelés (egy társ több címe is), a siker törli, a kép csak a megerősítetteket mondja, iránnyal; a kapu a nyelv hiányát
//     is a kör eredményébe teszi; a tároló nem ír, ha nincs változás. (Az őrjárat egészét a parancssor-próba méri.)
//   · ⭐⭐ (az építés ④-e) A FORDÍTÓ-SZÉL ÉS A RÉGI NYELVEK JEGYZÉKE (`forditoSzel.js`): a lépések sorrendje kifelé és befelé,
//     az első üzenetek érintetlenek, a közös számítás a közös nyelvé, a legrégebbi beszélt nyelv a dátumokból; és egy KITALÁLT
//     2-es nyelvvel a résen (a csere, a szelet, a fájl a cserénél és a randevún, a válasz): az [1,2] az 1-essel a régin, a
//     2-essel (akinek az 1-es lépése lejárt) a 2-esen cserél, a régi szelet-párokkal (a vegyes pár szeletei nem térnek el), a
//     2-es és az 1-es megnevezve áll meg — és a VALÓDI régi program (a git-ből) a kitalált [1,2]-vel cserél;
//   · ⭐⭐ (④) A KÉZFOGÁS-VÁLASZTÓ: a szállítás nemzedékének részei a jegyzékből, a kapu feljegyzése a kézfogásnak; egy kitalált
//     2-es szállítással két kapu a közös nemzedékkel fog kezet (az 1-essel a régi kulcsokkal, a 2-essel az újakkal); és a kézi
//     PAJZSFÚRÓ kopogása is viszi a jelet: közös szállításon a rés után kezet fog, közös nélkül mindkét fél megnevezve kész;
//   · ⭐⭐ (④, a ⑦ dátuma) AKIVEL MÉG A RÉGIN BESZÉLÜNK: a lement munka feljegyzi (a legújabbon törli), és a kép csak akkor mondja ki,
//     ha a régi lépés dátuma 30 napon belül jön — rétegenként, a nappal és a teendővel.
//
// Használja: meres/mind.js (`nyelv` csoport, a `csere` csoportban is).

import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createSocket } from 'node:dgram';

import { esemenyTarNyitasa, fajlBlobTarolo } from '../js/tar/fajlTar.js';
import { esemenyMentese, koinoEsemenyei } from '../js/tar/esemenyTar.js';
import { parbeszed, fajlKiszolgalas } from '../js/csere/vonal.js';
import {
  csereUdpResen, szeletUdpResen, valaszUdpResen, fajlUdpResen, kezfogasUdpResen, udpKapcsolat, kerelemUdpResen
} from '../js/csere/udpVonal.js';
import {
  NYELV_LEGUJABB, sajatNyelv, nyelvKeszlet, tarsNyelve, kozosNyelv, nyelvEllenorzese,
  SZALLITAS_LEGUJABB, sajatSzallitas, szallitasKeszlet, tarsSzallitasa, szallitasEgyezese, szallitasFeljegyzese, feljegyzettSzallitas,
  lejaroValtozatok
} from '../js/csere/nyelvValtozat.js';
import { udpKapuNyitasa } from '../js/csere/udpKapu.js';
import {
  NEM_ERTJUK_HATAR, NEM_ERTJUK_SZUNET, NEM_ERTJUK_LATSZIK, NEM_ERTJUK_KORLAT, uresNyelvJegyzek, nyelvJegyzekAlakja, hivhatoE,
  nemErtjukKulcsa, korMegfigyelesei, ertjukFeljegyzese, nyelvekKepe, reginFeljegyzese, REGIN_ELORE_NAP
} from '../js/csere/nyelvEmlekezet.js';
import { nyelvJegyzekTarolo } from '../js/tar/fajlTar.js';
import {
  REGI_NYELVEK, ELSO_UZENETEK, KERHETO_SZAMITASOK, keszletEllenorzese, legregebbiBeszelt, lejaroNyelvek, vonalSzele,
  kitalaltNyelvKeszlet, REGI_SZALLITASOK, SZALLITAS_RESZEK, szallitasReszei, szallitasKeszletEllenorzese, kitalaltSzallitasKeszlet
} from '../js/csere/forditoSzel.js';
import { munkamenetKulcsai, ujEgyszeriKulcs } from '../js/csere/titkositas.js';
import { pajzsfurasTobbfele } from '../js/csere/pajzsfuro.js';
import { probaGyujtemeny, ujEember } from './probaFuttato.js';

const { proba, futtatas } = probaGyujtemeny('A protokoll nyelvváltozata (D124 — PR6)');

const KOINO = 'proba';
const mappak = [];
// ⭐ A próbák nem várják ki a 20 mp-es tétlenségi órát: a megnevezett hiba azonnal jön, a régi program néma oldala 3 mp után.
const TURELEM = 3000;
const varj = (ms) => new Promise((kesz) => setTimeout(kesz, ms));

// ===== A KÉSZÜLÉKEK =====

async function ujMappa(elotag) {
  const m = await mkdtemp(join(tmpdir(), elotag));
  mappak.push(m);
  return m;
}

async function ujTar(nyito = esemenyTarNyitasa) {
  return nyito(KOINO, await ujMappa('koino-nyelv-'));
}

async function ment(tar, esemenyek, mentes = esemenyMentese) {
  for (const e of esemenyek) await mentes(tar, e);
}

async function lanc(eember, hossz, elotag) {
  const esemenyek = [];
  for (let i = 1; i <= hossz; i++) esemenyek.push(await eember.tesz('GondolatLetrehozas', { cim: elotag + i, meret: 10 * i }));
  return esemenyek;
}

async function udpParos() {
  const egyik = createSocket({ type: 'udp4', reuseAddr: true });
  const masik = createSocket({ type: 'udp4', reuseAddr: true });
  await new Promise((t) => egyik.bind(0, '127.0.0.1', t));
  await new Promise((t) => masik.bind(0, '127.0.0.1', t));
  return { egyik, masik, egyikPort: egyik.address().port, masikPort: masik.address().port,
    bezar: () => { egyik.close(); masik.close(); } };
}

/** Két fél egyszerre, és mindkettő vége — a bukott oldal oka is (`kod`, `irany`). */
async function ketFel(a, b) {
  const [x, y] = await Promise.allSettled([a(), b()]);
  const alak = (r) => (r.status === 'fulfilled'
    ? { ok: true, ertek: r.value }
    : { ok: false, kod: r.reason?.kod ?? null, irany: r.reason?.irany ?? null, uzenet: r.reason?.message ?? String(r.reason) });
  return [alak(x), alak(y)];
}

const megnevezve = (r, irany) => !r.ok && r.kod === 'NINCS-KOZOS-NYELV' && r.irany === irany;

// ===== ⭐ A SZÁMÍTÁS =====

// Rontás: (a) a közös a két „legújabb” közül a NAGYOBBIK → [1,3] és [2,4] közöse 4 lenne → bukik; (b) jel nélkül nem az 1-es →
// a régi program „hibás jelű” lenne → bukik.
proba('⭐ a közös nyelv — mindkét fél ugyanazt számolja; jel nélkül az 1-es; a hibás jel és a közös hiánya megnevezve', () => {
  const k = (a, b) => kozosNyelv(a, b);
  const nev = (f) => { try { f(); return null; } catch (h) { return h.kod + (h.irany ? ':' + h.irany : ''); } };
  const jo = {
    mai: NYELV_LEGUJABB === 1 && sajatNyelv().join() === '1,1',
    beallitva: sajatNyelv({ nyelv: [2, 3] }).join() === '2,3' && sajatNyelv({ nyelv: 'rossz' }).join() === '1,1',
    egyforma: k([1, 1], [1, 1]).nyelv === 1,
    szimmetrikus: k([1, 2], [1, 1]).nyelv === 1 && k([1, 1], [1, 2]).nyelv === 1
      && k([1, 3], [2, 4]).nyelv === 3 && k([2, 4], [1, 3]).nyelv === 3,
    nincs: k([2, 2], [1, 1]).nyelv === null && k([2, 2], [1, 1]).irany === 'regebbi' && k([1, 1], [2, 2]).irany === 'ujabb',
    jelNelkul: tarsNyelve({ uzenet: 'NYITAS' }).join() === '1,1',
    hibasJel: [[0, 1], [2, 1], '1', [1.5, 2], [1], null].every((j) => tarsNyelve({ ny: j }) === null),
    ellenorzes: nyelvEllenorzese({ ny: [1, 4] }, [2, 3]) === 3
      && nev(() => nyelvEllenorzese({ ny: [2, 2] }, [1, 1])) === 'NINCS-KOZOS-NYELV:ujabb'
      && nev(() => nyelvEllenorzese({}, [2, 2])) === 'NINCS-KOZOS-NYELV:regebbi'
      && nev(() => nyelvEllenorzese({ ny: 'x' }, [1, 1])) === 'HIBAS-NYELVJEL'
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ')\n');
  return ok;
});

// ===== ⭐⭐ A CSERE =====

/** Egy csere a védett résen: A (3 gondolat) és B (2 gondolat), mindkettő a saját nyelvével. */
async function csere(nyelvA, nyelvB) {
  const anna = await ujEember(KOINO), bela = await ujEember(KOINO);
  const tarA = await ujTar(); await ment(tarA, await lanc(anna, 3, 'A'));
  const tarB = await ujTar(); await ment(tarB, await lanc(bela, 2, 'B'));
  const p = await udpParos();
  try {
    const [a, b] = await ketFel(
      () => csereUdpResen(p.egyik, '127.0.0.1', p.masikPort, tarA, KOINO, { nyelv: nyelvA, varakozasiIdo: TURELEM }),
      () => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, tarB, KOINO, { nyelv: nyelvB, varakozasiIdo: TURELEM }));
    return { a, b, nalaA: (await koinoEsemenyei(tarA, KOINO)).length, nalaB: (await koinoEsemenyei(tarB, KOINO)).length };
  } finally {
    p.bezar();
  }
}

// Rontás: (a) a `parbeszed` nem ellenőrzi az első üzenetet → B (az 1-es) nem nevezi meg → bukik; (b) a NYITAS jel nélkül megy →
// a „2-es” A-t B 1-esnek látja, és nem áll meg → bukik; (c) a közös számítása rossz → a [1,3]/[2,4] nem 3 → bukik.
proba('⭐⭐ a CSERE: közös nyelven lemegy (mindkét fél ugyanazt a közöset mondja); közös nélkül MINDKÉT fél megnevezve áll meg, és semmi nem megy át', async () => {
  const kozosEgy = await csere([1, 2], [1, 1]);
  const kozosHarom = await csere([1, 3], [2, 4]);
  const nincs = await csere([2, 2], [1, 1]);
  const jo = {
    kozosEgy: kozosEgy.a.ok && kozosEgy.b.ok && kozosEgy.a.ertek.nyelv === 1 && kozosEgy.b.ertek.nyelv === 1
      && kozosEgy.nalaA === 5 && kozosEgy.nalaB === 5,
    kozosHarom: kozosHarom.a.ok && kozosHarom.b.ok && kozosHarom.a.ertek.nyelv === 3 && kozosHarom.b.ertek.nyelv === 3,
    // ⭐ A a „2-es” — neki B a régebbi; B-nek A az újabb. Mindkettő megnevezi, és egyik sem kapott semmit.
    nincsA: megnevezve(nincs.a, 'regebbi'),
    nincsB: megnevezve(nincs.b, 'ujabb'),
    semmiNemMentAt: nincs.nalaA === 3 && nincs.nalaB === 2
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify([nincs.a, nincs.b].map((r) => r.uzenet ?? 'rendben')) + ')\n');
  return ok;
});

// ===== ⭐⭐ A KÉRELEM ÚTJAI =====

/** ⭐ A fájl-randevú passzív kiszolgálója a védett résen (mint a `fajlRandevu` kiszolgáló fázisa). */
async function randevuKiszolgalo(halo, port, olvas, beallitas) {
  const v = await kezfogasUdpResen(halo, '127.0.0.1', port);
  const k = udpKapcsolat(v, '127.0.0.1', port);
  k.setTimeout(TURELEM, () => k.destroy(new Error('a társ nem kért semmit (' + TURELEM + ' ms)')));
  try {
    return await fajlKiszolgalas(k, olvas, beallitas);
  } finally {
    await k.kiurites();
    k.end();
    v.zar();
  }
}

/** ⭐ A csere-oldali fájl-kiszolgálás: a `parbeszed` a fájl-ágon (a gazda a résen). */
async function vedettParbeszed(halo, port, tar, beallitas) {
  const v = await kezfogasUdpResen(halo, '127.0.0.1', port);
  const k = udpKapcsolat(v, '127.0.0.1', port);
  k.setTimeout(TURELEM, () => k.destroy(new Error('A másik fél nem válaszol (' + TURELEM + ' ms)')));
  try {
    return await parbeszed(k, tar, KOINO, beallitas);
  } finally {
    v.zar();
  }
}

// Rontás: (a) a szelet-kérő nem nézi a társ NYITAS-át → a kérő nem nevezi meg (csak a tétlenségi óráig vár) → bukik; (b) a
// kérelem jel nélkül megy → a kiszolgáló a „2-es” kérőt 1-esnek látja, és nem áll meg → bukik; (c) a válasz-vivő nem nézi a
// NYITAS-t → bukik; (d) a fájl-kérő nem nézi az első válasz jelét → bukik (mindkét fájl-úton); (e) a randevú kiszolgálója nem
// ellenőrzi a kérést → bukik.
proba('⭐⭐ a KÉRELEM útjai (szelet, válasz, fájl a cserénél, fájl a randevún): közös nyelv nélkül a kérő ÉS a kiszolgáló is megnevezve áll meg', async () => {
  const anna = await ujEember(KOINO);
  const g = await anna.tesz('GondolatLetrehozas', { cim: 'Egy szelet', meret: 10 });
  const szolgalo = await ujTar(); await ment(szolgalo, [g]);
  const blobHely = await ujMappa('koino-nyelv-blob-');
  const blob = fajlBlobTarolo(KOINO, blobHely);
  const { lenyomat } = await blob.ir(new Uint8Array(3000).fill(7));
  const vendegBlob = fajlBlobTarolo(KOINO, await ujMappa('koino-nyelv-vendeg-'));
  const eredmeny = {};
  const egy = async (nev, kero, kiszolgalo) => {
    const p = await udpParos();
    try { eredmeny[nev] = await ketFel(() => kero(p), () => kiszolgalo(p)); }
    finally { p.bezar(); }
  };
  // a kérő a „2-es”, a kiszolgáló a mai (1-es)
  await egy('szelet',
    async (p) => szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await ujTar(), KOINO, g.azonosito, { nyelv: [2, 2], varakozasiIdo: TURELEM }),
    (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO, { nyelv: [1, 1], varakozasiIdo: TURELEM }));
  await egy('valasz',
    (p) => valaszUdpResen(p.egyik, '127.0.0.1', p.masikPort, KOINO, { az: 'proba-valasz', fajta: 'szelet', kulcs: g.azonosito },
      { nyelv: [2, 2], varakozasiIdo: TURELEM }),
    (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO,
      { nyelv: [1, 1], varakozasiIdo: TURELEM, valaszFogado: async () => true }));
  await egy('fajlCsere',
    (p) => fajlUdpResen(p.egyik, '127.0.0.1', p.masikPort, vendegBlob, KOINO, lenyomat, { nyelv: [2, 2], varakozasiIdo: TURELEM }),
    (p) => vedettParbeszed(p.masik, p.egyikPort, szolgalo, { nyelv: [1, 1], fajlOlvas: (l) => blob.olvas(l) }));
  await egy('fajlRandevu',
    (p) => fajlUdpResen(p.egyik, '127.0.0.1', p.masikPort, vendegBlob, KOINO, lenyomat, { nyelv: [2, 2], varakozasiIdo: TURELEM }),
    (p) => randevuKiszolgalo(p.masik, p.egyikPort, (l) => blob.olvas(l), { nyelv: [1, 1] }));
  const jo = Object.fromEntries(Object.entries(eredmeny).map(([nev, [kero, kiszolgalo]]) =>
    [nev, megnevezve(kero, 'regebbi') && megnevezve(kiszolgalo, 'ujabb')]));
  jo.fajlNemJott = (await vendegBlob.olvas(lenyomat)) === null;
  const ok = Object.values(jo).every(Boolean);
  if (!ok) {
    const okok = Object.fromEntries(Object.entries(eredmeny).map(([n, [a, b]]) => [n, [a.ok ? 'rendben' : a.kod + ' ' + a.uzenet,
      b.ok ? 'rendben' : b.kod + ' ' + b.uzenet]]));
    process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify(okok) + ')\n');
  }
  return ok;
});

// ===== ⭐⭐⭐ A VALÓDI RÉGI PROGRAM (D124 / PV6) =====
//
// A PR6 előtti utolsó program (2026-11-06, `520aefa` — a nyelv-jel nélkül: az 1-es nyelv), a git-ből egy ideiglenes mappába
// elővéve (a `js/`), és onnan betöltve — a mai programmal UGYANAZON a résen. Nem a mai program „régi módban”: a régi kód
// maga (D124 / PV6 (A)). ⚠️ Ha a régi program nincs meg (nincs git, vagy egy sekély klón — a telefonon), a próba kimondja.
const REGI_PROGRAM = '520aefa';
let regiBetoltve;

async function regiProgram() {
  if (regiBetoltve !== undefined) return regiBetoltve;
  regiBetoltve = null;
  const gyoker = join(dirname(fileURLToPath(import.meta.url)), '..');
  const git = (ervek, bemenet) => execFileSync('git', ervek,
    { cwd: gyoker, input: bemenet, maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] });
  let elotag, utak;
  try {
    elotag = git(['rev-parse', '--show-prefix']).toString().trim();
    utak = git(['ls-tree', '-r', '--name-only', REGI_PROGRAM, '--', elotag + 'js']).toString().split('\n').filter(Boolean);
  } catch { return null; }
  if (!utak.length) return null;
  // ⭐ Egy git-hívással mind (a `cat-file --batch`: fejléc-sor, a tartalom, egy sorvég — fájlonként).
  const kimenet = git(['cat-file', '--batch'], utak.map((u) => REGI_PROGRAM + ':' + u).join('\n') + '\n');
  const hely = await ujMappa('koino-regi-program-');
  let i = 0;
  for (const ut of utak) {
    const sorveg = kimenet.indexOf(10, i);
    const [, tipus, meret] = kimenet.subarray(i, sorveg).toString().split(' ');
    if (tipus !== 'blob') return null;
    const tartalom = kimenet.subarray(sorveg + 1, sorveg + 1 + Number(meret));
    i = sorveg + 1 + Number(meret) + 1;
    const cel = join(hely, ut.slice(elotag.length));
    await mkdir(dirname(cel), { recursive: true });
    await writeFile(cel, tartalom);
  }
  const betolt = (ut) => import(pathToFileURL(join(hely, ut)).href);
  regiBetoltve = {
    // ⭐ A régi kapu is (a ② próbájának): az `520aefa` kapuja a D124 ② előtti — a kopogása jel nélkül megy.
    udpKapu: await betolt('js/csere/udpKapu.js'),
    udpVonal: await betolt('js/csere/udpVonal.js'),
    fajlTar: await betolt('js/tar/fajlTar.js'),
    esemenyTar: await betolt('js/tar/esemenyTar.js')
  };
  return regiBetoltve;
}

// Rontás: (a) a jel nélküli üzenet nem az 1-es → a mai a régit „hibás jelűnek” látja, a csere elakad → bukik; (b) a mai NYITAS
// egy új, a régi számára ismeretlen ÜZENETET hozna → a régi megáll (a 90. mérés (c)-je) → bukik; (c) a „2-es” mai nem nevezi
// meg a régit → bukik.
proba('⭐⭐⭐ a VALÓDI régi program (a PR6 előtti, a git-ből) a maival: cserélnek, a régi kérő megkapja a szeletét és a mai is a régitől; a mai „2-es” a régit régebbinek nevezi', async () => {
  const regi = await regiProgram();
  if (!regi) { process.stdout.write('    (a régi program (' + REGI_PROGRAM + ') nincs meg a git-történetben — kihagyva)\n'); return true; }
  const regiTar = () => ujTar(regi.fajlTar.esemenyTarNyitasa);
  const regiMent = (tar, es) => ment(tar, es, regi.esemenyTar.esemenyMentese);
  const anna = await ujEember(KOINO), bela = await ujEember(KOINO);
  const annaE = await lanc(anna, 3, 'A'), belaE = await lanc(bela, 2, 'B');

  // ① csere: a régi (A) és a mai (B, 1-es)
  const tarA = await regiTar(); await regiMent(tarA, annaE);
  const tarB = await ujTar(); await ment(tarB, belaE);
  let p = await udpParos();
  const [csA, csB] = await ketFel(
    () => regi.udpVonal.csereUdpResen(p.egyik, '127.0.0.1', p.masikPort, tarA, KOINO, { varakozasiIdo: TURELEM }),
    () => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, tarB, KOINO, { varakozasiIdo: TURELEM }));
  p.bezar();
  const csereLement = csA.ok && csB.ok && csB.ertek.nyelv === 1
    && (await regi.esemenyTar.koinoEsemenyei(tarA, KOINO)).length === 5 && (await koinoEsemenyei(tarB, KOINO)).length === 5;

  // ② a régi kérő a mai kiszolgálótól, és a mai kérő a régitől — egy szelet
  const g = annaE[0];
  const maiSzolgalo = await ujTar(); await ment(maiSzolgalo, [g]);
  const regiSzolgalo = await regiTar(); await regiMent(regiSzolgalo, [g]);
  p = await udpParos();
  const [rk] = await ketFel(
    async () => regi.udpVonal.szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await regiTar(), KOINO, g.azonosito, { varakozasiIdo: TURELEM }),
    () => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, maiSzolgalo, KOINO, { varakozasiIdo: TURELEM }));
  p.bezar();
  p = await udpParos();
  const [mk] = await ketFel(
    async () => szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await ujTar(), KOINO, g.azonosito, { varakozasiIdo: TURELEM }),
    () => regi.udpVonal.csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, regiSzolgalo, KOINO, { varakozasiIdo: TURELEM }));
  p.bezar();

  // ③ a mai „2-es” és a régi: a mai megnevezi, és semmit nem kap
  const tarC = await regiTar(); await regiMent(tarC, annaE);
  const tarD = await ujTar(); await ment(tarD, belaE);
  p = await udpParos();
  const [, ketto] = await ketFel(
    () => regi.udpVonal.csereUdpResen(p.egyik, '127.0.0.1', p.masikPort, tarC, KOINO, { varakozasiIdo: TURELEM }),
    () => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, tarD, KOINO, { nyelv: [2, 2], varakozasiIdo: TURELEM }));
  p.bezar();

  const jo = {
    csereLement,
    regiKeroKapta: rk.ok && rk.ertek.kapott >= 1,
    maiKeroKapta: mk.ok && mk.ertek.kapott >= 1,
    kettesMegnevezi: megnevezve(ketto, 'regebbi') && (await koinoEsemenyei(tarD, KOINO)).length === 2
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify([csA, csB, rk, mk, ketto].map((r) => r.ok ? 'rendben' : r.kod + ' ' + r.uzenet)) + ')\n');
  return ok;
});

// ===== ⭐⭐ A SZÁLLÍTÁS JELE A KOPOGÁSBAN (az építés ②-e) =====

/** Egy kapu hamis munkával (a `nyito` a mai vagy a régi program kapuja): feljegyzi a munkákat (a társsal) és a jelzéseket. */
async function szKapu(nyito, szallitas) {
  const naplo = { munkak: [], jelzesek: [] };
  const kapu = await nyito({
    port: 0, szallitas, bekopogoKorlat: 3,
    jelez: (e) => naplo.jelzesek.push(e),
    munka: async (halo, tars) => { naplo.munkak.push(tars); await varj(100); return { uj: 0 }; }
  });
  return { kapu, naplo };
}

/** Az A kapu kopog a B-re (egy kör); a végén a kör, és mindkét kapu naplója. */
async function kopogas(nyitoA, szA, nyitoB, szB) {
  const a = await szKapu(nyitoA, szA), b = await szKapu(nyitoB, szB);
  try {
    const kor = await a.kapu.kopog([{ cim: '127.0.0.1', port: b.kapu.port }], { idokorlat: TURELEM });
    await varj(300);
    return { kor, a: a.naplo, b: b.naplo };
  } finally {
    a.kapu.zar();
    b.kapu.zar();
  }
}

/** Egyetlen `NINCS-KOZOS-SZALLITAS` jelzés, ebben az irányban. */
const szMegnevezve = (naplo, irany) =>
  naplo.jelzesek.filter((e) => e.mi === 'NINCS-KOZOS-SZALLITAS').length === 1
  && naplo.jelzesek.some((e) => e.mi === 'NINCS-KOZOS-SZALLITAS' && e.irany === irany);

/** A kör bukása megnevezve (`nincsKozos`, az iránnyal), és munka egyik oldalon sem. */
const korMegnevezi = (k, irany) => k.kor.nincsKozos === 1 && k.kor.sikeres === 0
  && k.kor.eredmenyek[0]?.nincsKozos?.irany === irany && /Nincs közös szállításunk/.test(k.kor.eredmenyek[0]?.hiba ?? '');

// Rontás: (a) a szállítás egyezése a NAGYOBBIK „legújabbat” veszi → [1,3]/[2,4] nem 3 → bukik; (b) jel nélkül nem az 1-es → a
// régi kapu „hibás jelű” lenne → bukik; (c) a hibás jel nem null → bukik.
proba('⭐ a SZÁLLÍTÁS jele — ugyanaz a számítás: jel nélkül az 1-es; a hibás jel és a közös hiánya megnevezve (dobás nélkül)', () => {
  const e = (u, s) => szallitasEgyezese(u, s);
  const jo = {
    mai: SZALLITAS_LEGUJABB === 1 && sajatSzallitas().join() === '1,1',
    beallitva: sajatSzallitas({ szallitas: [2, 3] }).join() === '2,3' && sajatSzallitas({ szallitas: [3, 2] }).join() === '1,1',
    jelNelkul: tarsSzallitasa({ uzenet: 'KOPOG', tol: 'x' }).join() === '1,1' && e({ uzenet: 'KOPOG' }, [1, 1]).szallitas === 1,
    kozos: e({ sz: [2, 4] }, [1, 3]).szallitas === 3 && e({ sz: [1, 3] }, [2, 4]).szallitas === 3,
    nincs: e({ sz: [2, 2] }, [1, 1]).szallitas === null && e({ sz: [2, 2] }, [1, 1]).irany === 'ujabb'
      && e({}, [2, 2]).irany === 'regebbi' && /régebbi/.test(e({}, [2, 2]).uzenet),
    hibas: [[0, 1], [2, 1], 'x', [1], null].every((j) => e({ sz: j }, [1, 1]).hibas === true),
    // ⭐ A nyelv jele nem a szállításé (két külön mező): a `ny` nem számít bele.
    kulonMezo: e({ ny: [5, 5] }, [1, 1]).szallitas === 1 && tarsNyelve({ sz: [5, 5] }).join() === '1,1'
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ')\n');
  return ok;
});

// Rontás: (a) a kapu a kopogást jel nélkül küldi → a „2-es” kopogását a mai 1-esnek látja, munkát kezd → bukik; (b) a KOPOG-ágban
// nincs ellenőrzés → a kapu visszakopog (BEKOPOGO-CEL) → bukik; (c) a HALLAK-ágban nincs ellenőrzés → munka indul → bukik; (d) a
// nincs-közösre nem megy HALLAK → a kopogó kör „nem felelt”-et mond, nem nevezi meg → bukik; (e) a kör nem könyveli → bukik;
// (f) a munka nem kapja a közös számot → bukik.
proba('⭐⭐ a KOPOGÁS jele: közös szállításon munka (a közös számmal); közös nélkül se munka, se visszakopogás — mindkét kapu és a kör is megnevezi, mindkét irányban', async () => {
  const kozosEgy = await kopogas(udpKapuNyitasa, [1, 2], udpKapuNyitasa, [1, 1]);
  const kozosHarom = await kopogas(udpKapuNyitasa, [1, 3], udpKapuNyitasa, [2, 4]);
  const ujabbKopog = await kopogas(udpKapuNyitasa, [2, 2], udpKapuNyitasa, [1, 1]);
  const regebbiKopog = await kopogas(udpKapuNyitasa, [1, 1], udpKapuNyitasa, [2, 2]);
  const munkaSzammal = (k, n) => k.kor.sikeres === 1 && [k.a, k.b].every((x) => x.munkak.length === 1 && x.munkak[0].szallitas === n);
  const semmi = (k) => k.a.munkak.length === 0 && k.b.munkak.length === 0
    && ![k.a, k.b].some((x) => x.jelzesek.some((e) => e.mi === 'BEKOPOGO-CEL' || e.mi === 'ATFURVA'));
  const jo = {
    kozosEgy: munkaSzammal(kozosEgy, 1),
    kozosHarom: munkaSzammal(kozosHarom, 3),
    // ⭐ A „2-es” kopog: neki a mai régebbi, a mainak ő újabb — és a kör a bukást megnevezi.
    ujabbKopog: korMegnevezi(ujabbKopog, 'regebbi') && szMegnevezve(ujabbKopog.a, 'regebbi') && szMegnevezve(ujabbKopog.b, 'ujabb')
      && semmi(ujabbKopog),
    // ⭐ A mai kopog a „2-es”-re: a mai kör tudja meg, hogy a társ újabb — a „2-es” HALLAK-jából (a jelével).
    regebbiKopog: korMegnevezi(regebbiKopog, 'ujabb') && szMegnevezve(regebbiKopog.a, 'ujabb')
      && szMegnevezve(regebbiKopog.b, 'regebbi') && semmi(regebbiKopog)
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) {
    const kep = (k) => ({ kor: k.kor.eredmenyek.map((e) => e.hiba ?? 'rendben'), a: k.a.jelzesek.map((e) => e.mi + (e.irany ? ':' + e.irany : '')),
      b: k.b.jelzesek.map((e) => e.mi + (e.irany ? ':' + e.irany : '')), munka: [k.a.munkak.length, k.b.munkak.length] });
    process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify([ujabbKopog, regebbiKopog].map(kep)) + ')\n');
  }
  return ok;
});

/** Egy nyers foglalat, ami a kapura kopog, és feljegyzi, mit kapott vissza. */
async function nyersKopogo() {
  const s = createSocket({ type: 'udp4' });
  await new Promise((kesz) => s.bind(0, '127.0.0.1', kesz));
  const kapott = [];
  s.on('message', (adat) => { try { kapott.push(JSON.parse(adat.toString('utf8'))); } catch { kapott.push(null); } });
  return { kapott, kuld: (u, port) => s.send(JSON.stringify(u), port, '127.0.0.1'), zar: () => s.close() };
}

// Rontás: (a) a válasz jel nélkül megy → bukik; (b) a „változott” mindig igaz (minden kopogásra egy jelzés) → bukik; (c) a hibás
// jelre is HALLAK megy → bukik; (d) a jel nélküli kopogás nem az 1-es (nem kap HALLAK-ot és visszakopogást) → bukik.
proba('⭐ a kopogás jele a csomagban: a válasz viszi a mi jelünket; egy társ sok kopogása EGY jelzés; a hibás jel válasz nélkül, megnevezve; a jel nélküli az 1-es', async () => {
  const b = await szKapu(udpKapuNyitasa, [1, 1]);
  const uj = await nyersKopogo(), hibas = await nyersKopogo(), regi = await nyersKopogo();
  try {
    for (let i = 0; i < 3; i++) {
      uj.kuld({ uzenet: 'KOPOG', tol: 'uj', sz: [2, 3] }, b.kapu.port);
      hibas.kuld({ uzenet: 'KOPOG', tol: 'hibas', sz: 'x' }, b.kapu.port);
      await varj(60);
    }
    regi.kuld({ uzenet: 'KOPOG', tol: 'regi' }, b.kapu.port);
    await varj(300);
    const jelzes = (mi) => b.naplo.jelzesek.filter((e) => e.mi === mi);
    const jel = (u) => JSON.stringify(u?.sz) === '[1,1]';
    const jo = {
      valaszJellel: uj.kapott.length === 3 && uj.kapott.every((u) => u?.uzenet === 'HALLAK' && jel(u)),
      egyJelzes: jelzes('NINCS-KOZOS-SZALLITAS').length === 1 && jelzes('NINCS-KOZOS-SZALLITAS')[0].irany === 'ujabb'
        && jelzes('NINCS-KOZOS-SZALLITAS')[0].tars.join() === '2,3',
      hibasValaszNelkul: hibas.kapott.length === 0 && jelzes('HIBAS-SZALLITASJEL').length === 1,
      jelNelkulEgyes: regi.kapott.some((u) => u?.uzenet === 'HALLAK' && jel(u)) && regi.kapott.some((u) => u?.uzenet === 'KOPOG' && jel(u)),
      munkaNincs: b.naplo.munkak.length === 0
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify({ uj: uj.kapott, hibas: hibas.kapott, regi: regi.kapott }) + ')\n');
    return ok;
  } finally {
    uj.zar(); hibas.zar(); regi.zar(); b.kapu.zar();
  }
});

// Rontás: (a) a jel nélküli kopogás nem az 1-es → a mai a régit nem szolgálja ki (nincs munka) → bukik; (b) a mai kopogás egy új,
// a régi számára ismeretlen ÜZENETTEL jönne → a régi nem felel → bukik; (c) a „2-es” mai a régi HALLAK-jára munkát kezd → bukik.
proba('⭐⭐⭐ a VALÓDI régi kapu (a D124 ② előtti, a git-ből) a maival: kopogásra mindkét irányban munka indul (a mainál az 1-es szállítással); a mai „2-es” a régit megnevezi, és munkát nem kezd', async () => {
  const regi = await regiProgram();
  if (!regi) { process.stdout.write('    (a régi program (' + REGI_PROGRAM + ') nincs meg a git-történetben — kihagyva)\n'); return true; }
  const regiNyit = regi.udpKapu.udpKapuNyitasa;
  const regiKopog = await kopogas(regiNyit, undefined, udpKapuNyitasa, undefined);
  const maiKopog = await kopogas(udpKapuNyitasa, undefined, regiNyit, undefined);
  const kettesKopog = await kopogas(udpKapuNyitasa, [2, 2], regiNyit, undefined);
  const regiKopogKetteshez = await kopogas(regiNyit, undefined, udpKapuNyitasa, [2, 2]);
  const jo = {
    regiKopog: regiKopog.kor.sikeres === 1 && regiKopog.a.munkak.length === 1 && regiKopog.b.munkak.length === 1
      && regiKopog.b.munkak[0].szallitas === 1,
    maiKopog: maiKopog.kor.sikeres === 1 && maiKopog.a.munkak.length === 1 && maiKopog.a.munkak[0].szallitas === 1
      && maiKopog.b.munkak.length === 1,
    kettesMegnevezi: korMegnevezi(kettesKopog, 'regebbi') && kettesKopog.a.munkak.length === 0 && szMegnevezve(kettesKopog.a, 'regebbi'),
    // ⚠️ A régi kapu a „2-es” HALLAK-jára a maga munkáját elkezdi (ő a jelet nem ismeri — a valódi munkája a kézfogásnál bukna); a
    // „2-es” viszont nem kezd, és megnevezi.
    kettesNemKezd: regiKopogKetteshez.b.munkak.length === 0 && szMegnevezve(regiKopogKetteshez.b, 'regebbi')
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) {
    const kep = (k) => ({ kor: k.kor.eredmenyek.map((e) => e.hiba ?? 'rendben'), munka: [k.a.munkak.length, k.b.munkak.length],
      a: k.a.jelzesek.map((e) => e.mi), b: k.b.jelzesek.map((e) => e.mi) });
    process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify([regiKopog, maiKopog, kettesKopog, regiKopogKetteshez].map(kep)) + ')\n');
  }
  return ok;
});

// ===== ⭐⭐ AKIVEL NEM ÉRTJÜK EGYMÁST (az építés ③-a) =====

// Rontás: (a) a határ 1 (egy kör elég) → az első kör után már szünet és kép → bukik; (b) egy körben társanként nem egy megfigyelés
// (a kötés két címe kettőnek számít) → 2 kör után szünet → bukik; (c) a „nem felelt” nulláz → bukik; (d) a siker nem töröl → bukik;
// (e) a lejárt szünet után egy megfigyelés nem ad újra szünetet → bukik; (f) a kép a meg nem erősítettet is számolja → bukik; (g)
// az elévült bejegyzés is számít → bukik.
proba('⭐⭐ AKIVEL NEM ÉRTJÜK EGYMÁST: 3 egymás utáni kör után 6 óra szünet; egy kör egy megfigyelés (a kötés több címe is); a „nem felelt” nem nulláz, a siker töröl; a kép csak a megerősítetteket mondja, iránnyal', () => {
  const T0 = 1_800_000_000_000, PERC = 60 * 1000;
  const P = 'P'.repeat(43);
  const ujabb = { mi: 'szallitas', irany: 'ujabb', sajat: [1, 1], tars: [2, 2] };
  const regebbi = { mi: 'nyelv', irany: 'regebbi', sajat: [2, 2], tars: [1, 1] };
  const e = (cim, port, n) => ({ cim, port, cel: { cim, port }, ok: !n, ...(n ? { hiba: 'nincs közös', nincsKozos: n } : {}) });
  const nemFelelt = (cim, port) => ({ cim, port, cel: { cim, port }, ok: false, hiba: 'nem felelt' });
  // ⭐ A kötés (P) két címe: 10.0.0.1:1 és 10.0.0.2:1 — a hívó a cél címéből tudja az aláírót.
  const kulcsa = (x) => nemErtjukKulcsa({ alairo: x.cel.port === 1 ? P : null, cim: x.cel.cim, port: x.cel.port });
  const R = '10.0.0.9:9';
  let j = uresNyelvJegyzek();
  const kor = (eredmenyek, t) => { const m = korMegfigyelesei(j, eredmenyek, kulcsa, t); j = m.jegyzek; return m; };
  const ketto = [e('10.0.0.1', 1, ujabb), e('10.0.0.2', 1, ujabb), e('10.0.0.9', 9, regebbi)];

  const k1 = kor(ketto, T0);
  const egyKorEgy = j.tarsak[P]?.egymasUtan === 1 && j.tarsak[R]?.egymasUtan === 1 && !k1.szunetre.length
    && nyelvekKepe(j, T0).mondatok.length === 0 && hivhatoE(j, P, T0);
  const kozben = kor([nemFelelt('10.0.0.1', 1), nemFelelt('10.0.0.9', 9)], T0 + PERC);
  const nemFeleltMarad = kozben.valtozott === false && j.tarsak[P].egymasUtan === 1;
  kor(ketto, T0 + 2 * PERC);
  const k3 = kor(ketto, T0 + 3 * PERC);
  const kep = nyelvekKepe(j, T0 + 3 * PERC);
  const harmadikra = k3.szunetre.map((x) => x.kulcs).sort().join() === [P, R].sort().join()
    && !hivhatoE(j, P, T0 + 3 * PERC + 1) && !hivhatoE(j, R, T0 + 3 * PERC + 1)
    && hivhatoE(j, P, T0 + 3 * PERC + NEM_ERTJUK_SZUNET + 1);
  const kepJo = kep.ujabb === 1 && kep.regebbi === 1
    && /^1 társad újabb programot futtat — frissíts \(a telepítő sorral\)/.test(kep.mondatok[0] ?? '')
    && /^1 társad régebbi programot futtat — amíg nem frissít, nem cseréltek/.test(kep.mondatok[1] ?? '');
  // ⭐ A szünet után a kör újra hívja — ha még mindig nem értjük egymást, EGY megfigyelés is újra szünetet ad.
  const utana = T0 + 3 * PERC + NEM_ERTJUK_SZUNET + 2;
  const k4 = kor([e('10.0.0.9', 9, regebbi)], utana);
  const ujraSzunet = k4.szunetre.length === 1 && k4.szunetre[0].kulcs === R && !hivhatoE(j, R, utana + 1);
  // ⭐ A siker (a kötés MÁSIK címén) törli; az `ertjukFeljegyzese` is — és ha nincs mit törölni, ugyanazt az objektumot adja.
  kor([e('10.0.0.2', 1)], utana + PERC);
  const sikerTorol = !j.tarsak[P] && hivhatoE(j, P, utana + PERC);
  const elotte = j;
  const ugyanaz = ertjukFeljegyzese(j, ['nincs-ilyen', null]) === elotte;
  j = ertjukFeljegyzese(j, [R]);
  const ertjukTorol = !j.tarsak[R] && Object.keys(j.tarsak).length === 0;
  // ⭐ Elévülés és korlát: a rég nem látott nem számít; a jegyzék nem nő a korlát fölé.
  let k = uresNyelvJegyzek();
  for (let i = 0; i < NEM_ERTJUK_HATAR; i++) k = korMegfigyelesei(k, [e('10.1.0.1', 7, ujabb)], kulcsa, T0 + i).jegyzek;
  const elevul = nyelvekKepe(k, T0 + NEM_ERTJUK_HATAR).ujabb === 1 && nyelvekKepe(k, T0 + NEM_ERTJUK_LATSZIK + NEM_ERTJUK_HATAR + 1).ujabb === 0;
  // ⭐ A többes szám: „velük”, „frissítenek”.
  let t2 = uresNyelvJegyzek();
  for (let i = 0; i < NEM_ERTJUK_HATAR; i++) {
    t2 = korMegfigyelesei(t2, [e('10.3.0.1', 7, ujabb), e('10.3.0.2', 7, ujabb), e('10.3.0.3', 7, regebbi), e('10.3.0.4', 7, regebbi)],
      kulcsa, T0 + i).jegyzek;
  }
  const tm = nyelvekKepe(t2, T0 + NEM_ERTJUK_HATAR).mondatok;
  const tobbes = /^2 társad újabb programot futtat — frissíts \(a telepítő sorral\), különben velük nem cseréltek$/.test(tm[0] ?? '')
    && /^2 társad régebbi programot futtat — amíg nem frissítenek, nem cseréltek$/.test(tm[1] ?? '');
  const sok = Array.from({ length: NEM_ERTJUK_KORLAT + 40 }, (_, i) => e('10.2.' + (i >> 8) + '.' + (i & 255), 7, ujabb));
  const korlatos = Object.keys(korMegfigyelesei(uresNyelvJegyzek(), sok, kulcsa, T0).jegyzek.tarsak).length === NEM_ERTJUK_KORLAT;
  // ⭐ A sérült fájl: ami nem illik, kiesik.
  const alak = nyelvJegyzekAlakja({ tarsak: { rossz: { irany: 'oldalt', mi: 'nyelv', utoljara: T0 }, szoveg: 'x',
    jo: { mi: 'szallitas', irany: 'ujabb', utoljara: T0, egymasUtan: 3, sajat: [1, 1], tars: [2, 2], szunetEddig: T0 + 5 } } });
  const serultJo = Object.keys(alak.tarsak).join() === 'jo' && alak.tarsak.jo.egymasUtan === 3
    && Object.keys(nyelvJegyzekAlakja('szemét').tarsak).length === 0;
  const jo = { egyKorEgy, nemFeleltMarad, harmadikra, kepJo, ujraSzunet, sikerTorol, ugyanaz, ertjukTorol, elevul, tobbes, korlatos,
    serultJo };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ')\n');
  return ok;
});

// Rontás: (a) a kapu a munka bukásából nem teszi át a nyelv hiányát (`nincsKozos`) → bukik; (b) a szállítás hiánya réteg nélkül
// megy → bukik; (c) a tároló változás nélkül is ír → a fájl ott van → bukik; (d) a sérült fájl eltöri az olvasást → bukik.
proba('⭐ a kör eredménye a NYELV hiányát is mondja (a munka bukásából: `nincsKozos`, a réteggel); a jegyzék tárolója nem ír, ha nincs változás, és a sérült fájl üres', async () => {
  // ① a kapu: a munka a nyelv hiányával bukik (mint a `parbeszed` megnevezett hibája) → a kör eredménye megnevezi
  const nyelvHiba = () => {
    const h = new Error('Nincs közös nyelvünk: a társ programja újabb (2. nyelv), az enyém 1.');
    Object.assign(h, { kod: 'NINCS-KOZOS-NYELV', irany: 'ujabb', sajatNyelve: [1, 1], tarsNyelve: [2, 2] });
    return h;
  };
  const a = await udpKapuNyitasa({ port: 0, jelez: () => {}, munka: async () => { await varj(50); throw nyelvHiba(); } });
  const b = await udpKapuNyitasa({ port: 0, jelez: () => {}, munka: async () => { await varj(50); throw nyelvHiba(); } });
  let kor;
  try { kor = await a.kopog([{ cim: '127.0.0.1', port: b.port }], { idokorlat: TURELEM }); } finally { a.zar(); b.zar(); }
  const n = kor.eredmenyek[0]?.nincsKozos;
  const nyelvben = kor.eredmenyek[0]?.ok === false && n?.mi === 'nyelv' && n.irany === 'ujabb' && n.tars?.join() === '2,2';
  // a szállítás hiánya a réteggel (a ② útja)
  const sz = await kopogas(udpKapuNyitasa, [2, 2], udpKapuNyitasa, [1, 1]);
  const szallitasban = sz.kor.eredmenyek[0]?.nincsKozos?.mi === 'szallitas';
  // ② a tároló
  const hely = await ujMappa('koino-nyelvek-');
  const t = nyelvJegyzekTarolo(hely, nyelvJegyzekAlakja);
  await t.modosit((j) => ertjukFeljegyzese(j, ['senki']));
  const nemIrt = await readFile(t.fajl).then(() => false, () => true);
  await t.modosit((j) => korMegfigyelesei(j, [{ cim: 'x', port: 1, cel: { cim: 'x', port: 1 }, ok: false,
    nincsKozos: { mi: 'nyelv', irany: 'regebbi', sajat: [2, 2], tars: [1, 1] } }], (e) => e.cel.cim + ':' + e.cel.port, Date.now()).jegyzek);
  const irt = (await t.olvas()).tarsak['x:1']?.egymasUtan === 1;
  await writeFile(t.fajl, '{ ez nem json');
  const serult = Object.keys((await t.olvas()).tarsak).length === 0;
  const jo = { nyelvben, szallitasban, nemIrt, irt, serult };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify(kor.eredmenyek) + ')\n');
  return ok;
});

// ===== ⭐⭐ A FORDÍTÓ-SZÉL ÉS A RÉGI NYELVEK JEGYZÉKE (az építés ④-e) =====

/** Egy kitalált 3 nyelvű készlet: a fordítók a nyomukat hagyják az üzeneten — így a sorrendjük látszik. */
function haromNyelvu(meddig1, meddig2) {
  const nyom = (jel) => (u) => ({ ...u, nyom: (u.nyom ?? '') + jel });
  return { legujabb: 3, lepesek: {
    1: { meddig: meddig1, le: nyom('L1'), fel: nyom('F1'), szamitasok: { szeletParok: () => 'regi-1' } },
    2: { meddig: meddig2, le: nyom('L2'), fel: nyom('F2') } } };
}

// Rontás: (a) a `le` lépések fordított sorrendben → 'L1L2' → bukik; (b) a szél az első üzenetet is fordítja → bukik; (c) a
// közös számítás a legújabbé (nem a közös nyelvé) → bukik; (d) a legrégebbi nem a dátumból jön (a lejárt lépés is számít) →
// bukik; (e) egy kérhető számítást a vonal nem kér → bukik; (f) a kitalált nyelv nem a környezetből jön → bukik.
proba('⭐⭐ a FORDÍTÓ-SZÉL szabálya: kifelé a legújabbtól lefelé, befelé a közöstől fölfelé; az első üzenet érintetlen; a közös számítás a közös nyelvé; a legrégebbi beszélt nyelv a jegyzék dátumaiból; a jegyzék alakja ellenőrizve', async () => {
  const most = Date.UTC(2026, 10, 7, 12);
  const k = haromNyelvu('2027-06-01', '2027-06-01');
  const sz1 = vonalSzele(k, [1, 3], 1), sz2 = vonalSzele(k, [1, 3], 2), sz3 = vonalSzele(k, [1, 3], 3);
  const u = { uzenet: 'CIMEK', udp: [] };
  const mai = () => 'mai';
  const dob = (x) => { try { keszletEllenorzese(x); return false; } catch { return true; } };
  const vonalForras = await readFile(new URL('../js/csere/vonal.js', import.meta.url), 'utf8');
  // a kitalált 2-es a környezetből (mint egy valódi folyamatban)
  const regiKornyezet = process.env.KOINO_PROBANYELV;
  process.env.KOINO_PROBANYELV = '200';
  const kitalalt12 = sajatNyelv().join() === '1,2' && nyelvKeszlet().kitalalt === true;
  process.env.KOINO_PROBANYELV = '-1';
  const kitalalt2 = sajatNyelv().join() === '2,2';
  if (regiKornyezet === undefined) delete process.env.KOINO_PROBANYELV; else process.env.KOINO_PROBANYELV = regiKornyezet;
  const kk = kitalaltNyelvKeszlet(200);
  const kitalaltAlak = JSON.stringify(vonalSzele(kk, [1, 2], 2).ki(u)) === '{"u2":"CIMEK","udp":[]}'
    && JSON.stringify(vonalSzele(kk, [1, 2], 1).ki(u)) === JSON.stringify(u)
    && (() => { try { vonalSzele(kk, [1, 2], 2).be(u); return false; } catch { return true; } })();
  const jo = {
    mai: Object.keys(REGI_NYELVEK).length === 0 && NYELV_LEGUJABB === 1 && sajatNyelv().join() === '1,1'
      && nyelvKeszlet().legujabb === 1 && vonalSzele(nyelvKeszlet(), [1, 1], 1).azonos,
    legregebbi: legregebbiBeszelt(k, most) === 1
      && legregebbiBeszelt(haromNyelvu('2026-11-07', '2027-06-01'), most) === 2    // a dátum napján már nem
      && legregebbiBeszelt(haromNyelvu('2027-06-01', '2026-01-01'), most) === 3    // a felső lejárt: az alsó sem érhető el
      && legregebbiBeszelt({ legujabb: 3, lepesek: { 2: k.lepesek[2] } }, most) === 2,   // a hiányzó lépés: a lánc megszakad
    kiSorrend: sz1.ki(u).nyom === 'L2L1' && sz2.ki(u).nyom === 'L2' && sz3.ki(u) === u,
    beSorrend: sz1.be(u).nyom === 'F1F2' && sz2.be(u).nyom === 'F2' && sz3.be(u) === u,
    azonos: sz3.azonos && !sz1.azonos,
    elsoErintetlen: [...ELSO_UZENETEK].every((n) => { const x = { uzenet: n }; return sz1.ki(x) === x && sz1.be(x) === x; }),
    szamitas: sz1.szamitas('szeletParok', mai)() === 'regi-1' && sz2.szamitas('szeletParok', mai) === mai
      && sz3.szamitas('szeletParok', mai) === mai,
    lejaro: lejaroNyelvek(k, most).map((x) => x.nyelv).join() === '1,2' && lejaroNyelvek(k, most)[0].napMulva === 206
      && lejaroNyelvek(haromNyelvu('2026-11-07', '2027-06-01'), most).map((x) => x.nyelv).join() === '2',
    ellenorzes: !!keszletEllenorzese(k) && [
      { legujabb: 2, lepesek: { 1: { meddig: '2027-02-30', le: mai, fel: mai } } },        // nincs ilyen nap
      { legujabb: 2, lepesek: { 1: { meddig: '2027-02-01', le: mai } } },                  // nincs fel-fordító
      { legujabb: 2, lepesek: { 2: { meddig: '2027-02-01', le: mai, fel: mai } } },        // a lépés nem a legújabb alatt
      { legujabb: 2, lepesek: { 1: { meddig: '2027-02-01', le: mai, fel: mai, szamitasok: { ismeretlen: mai } } } }
    ].every(dob),
    // ⭐ a 4. szabály-hiány ellen: minden kérhető számítást a vonal valóban kér
    vonalKeri: KERHETO_SZAMITASOK.length > 0 && KERHETO_SZAMITASOK.every((nev) => vonalForras.includes("szamitas('" + nev + "'")),
    kitalalt12, kitalalt2, kitalaltAlak
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ')\n');
  return ok;
});

/** ⚠️ A kitalált 2-es: [1,2] (a régit is beszéli) és [2,2] (az 1-es lépése lejárt). */
const KITALALT_12 = () => ({ nyelvKeszlet: kitalaltNyelvKeszlet(200) });
const KITALALT_2 = () => ({ nyelvKeszlet: kitalaltNyelvKeszlet(-1) });

/** Egy csere a résen, mindkét fél a saját beállításával (a nyelv-készlettel). */
async function resCsere(tarA, bA, tarB, bB, nyitoA = csereUdpResen, nyitoB = csereUdpResen) {
  const p = await udpParos();
  try {
    return await ketFel(
      () => nyitoA(p.egyik, '127.0.0.1', p.masikPort, tarA, KOINO, { ...bA, varakozasiIdo: TURELEM }),
      () => nyitoB(p.masik, '127.0.0.1', p.egyikPort, tarB, KOINO, { ...bB, varakozasiIdo: TURELEM }));
  } finally {
    p.bezar();
  }
}

const lement = (r, nyelv) => r.ok && r.ertek.nyelv === nyelv;
const nala = async (tar) => (await koinoEsemenyei(tar, KOINO)).length;

// Rontás: (a) az üzenetsor nem fordít befelé → az [1,2] a 2-es alakot nem érti → bukik; (b) a kimenő nem a szélen megy → a
// 2-es az 1-es alakot nem érti → bukik; (c) a szél nem a közös nyelvre fordít (mindig a legújabbat beszéli) → az 1-es nem érti
// → bukik; (d) a közös számítás nem a közös nyelvé (a párok nem számolódnak újra) → a vegyes pár szeletei mind eltérnek →
// bukik; (e) a legrégebbi nem a dátumból jön → a [2,2] az 1-essel is cserélne → bukik; (f) a nyitás nem a legújabb számításával
// megy → a vegyes pár nyitása egyezne (a kitalált 2-es nem hű a valódihoz) → bukik.
proba('⭐⭐⭐ a KITALÁLT 2-ES NYELV a csere résén: az [1,2] az 1-essel a régin cserél (a régi szelet-párokkal — egy szelet sem tér el), a 2-essel a 2-esen (a gyors úton); a lejárt 1-es lépésű 2-es és az 1-es megnevezve áll meg', async () => {
  const anna = await ujEember(KOINO), bela = await ujEember(KOINO);
  const annaE = await lanc(anna, 3, 'A'), belaE = await lanc(bela, 2, 'B');
  // ① az [1,2] és az 1-es: lemegy az 1-esen; a második (nincs újdonság) csere egy szeletet sem lát eltérőnek
  const tar12 = await ujTar(); await ment(tar12, annaE);
  const tar1 = await ujTar(); await ment(tar1, belaE);
  const [a1, b1] = await resCsere(tar12, KITALALT_12(), tar1, {});
  const egyesLement = lement(a1, 1) && lement(b1, 1) && await nala(tar12) === 5 && await nala(tar1) === 5;
  const [a1b, b1b] = await resCsere(tar12, KITALALT_12(), tar1, {});
  // ⚠️ a nyitó lenyomat a saját LEGÚJABB (a 2-es) számítása szerint megy (a közös nyelv előtt készül), ezért a vegyes pár
  // nyitása nem egyezik: az első szint lefut (a gyors út elmarad — a kimondott ára) — és a régi párokon egy szeletet sem talál eltérőnek
  const regiParok = lement(a1b, 1) && lement(b1b, 1) && a1b.ertek.elteroSzeletek === 0 && b1b.ertek.elteroSzeletek === 0
    && a1b.ertek.egyeztetoUzenetek > 0;
  // ② az [1,2] és a [2,2]: lemegy a 2-esen; a második csere a gyors úton (a 2-es lenyomat mindkettőnél ugyanaz)
  const tarC = await ujTar(); await ment(tarC, annaE);
  const tarD = await ujTar(); await ment(tarD, belaE);
  const [c2, d2] = await resCsere(tarC, KITALALT_12(), tarD, KITALALT_2());
  const kettesLement = lement(c2, 2) && lement(d2, 2) && await nala(tarC) === 5 && await nala(tarD) === 5;
  const [c2b, d2b] = await resCsere(tarC, KITALALT_12(), tarD, KITALALT_2());
  const gyorsUt = lement(c2b, 2) && lement(d2b, 2) && c2b.ertek.egyeztetoUzenetek === 0 && d2b.ertek.egyeztetoUzenetek === 0;
  // ③ a [2,2] és az 1-es: nincs közös — mindkettő megnevezi, semmi nem megy át
  const tarE = await ujTar(); await ment(tarE, annaE);
  const tarF = await ujTar(); await ment(tarF, belaE);
  const [e3, f3] = await resCsere(tarE, KITALALT_2(), tarF, {});
  const nincs = megnevezve(e3, 'regebbi') && megnevezve(f3, 'ujabb') && await nala(tarE) === 3 && await nala(tarF) === 2;
  const jo = { egyesLement, regiParok, kettesLement, gyorsUt, nincs };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) {
    const r = (x) => (x.ok ? { nyelv: x.ertek.nyelv, elt: x.ertek.elteroSzeletek, egy: x.ertek.egyeztetoUzenetek } : x.kod + ' ' + x.uzenet);
    process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify([a1, b1, a1b, b1b, c2, d2, c2b, d2b, e3, f3].map(r)) + ')\n');
  }
  return ok;
});

// Rontás: (a) a randevú kérője az első (jeles) választ nem fordítja → a 2-es kiszolgálótól nem jön a fájl → bukik; (b) a
// kiszolgáló a választ nem a szélen küldi → bukik; (c) a kérelem kimenője (a MINTAKEREK) nem a szélen megy → bukik; (d) a
// törzs fájlja a kérelem során nem fordítva jön → bukik. ⚠️ A szelet-kérő kimenője (a zárt koinó TAGSAG-ja) itt nem mérve.
proba('⭐⭐ a KITALÁLT 2-ES NYELV a kérelem útjain (a szelet, a fejlécek, a törzs, a fájl a cserénél és a randevún, a válasz): az [1,2] kérő a 2-estől és az 1-estől is megkapja, és a 2-es kérő az [1,2]-től', async () => {
  const anna = await ujEember(KOINO);
  const g = await anna.tesz('GondolatLetrehozas', { cim: 'Egy szelet', meret: 10 });
  const szolgalo = await ujTar(); await ment(szolgalo, [g]);
  const blob = fajlBlobTarolo(KOINO, await ujMappa('koino-nyelv4-blob-'));
  const { lenyomat } = await blob.ir(new Uint8Array(70000).fill(9));   // két szelet: a második már a nyelv eldőlte után
  const eredmeny = {};
  const egy = async (nev, kero, kiszolgalo, ellenor) => {
    const p = await udpParos();
    try {
      const [k, sz] = await ketFel(() => kero(p), () => kiszolgalo(p));
      eredmeny[nev] = { ok: k.ok && sz.ok && await ellenor(k.ertek), kero: k.ok ? 'rendben' : k.kod + ' ' + k.uzenet,
        kiszolgalo: sz.ok ? 'rendben' : sz.kod + ' ' + sz.uzenet };
    } finally {
      p.bezar();
    }
  };
  const kapott = (r) => r.kapott >= 1;
  for (const [nev, kiszolgaloB] of [['szelet2', KITALALT_2()], ['szelet1', {}]]) {
    await egy(nev,
      async (p) => szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await ujTar(), KOINO, g.azonosito,
        { ...KITALALT_12(), varakozasiIdo: TURELEM }),
      (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO, { ...kiszolgaloB, varakozasiIdo: TURELEM }),
      kapott);
  }
  await egy('szelet2kero',
    async (p) => szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await ujTar(), KOINO, g.azonosito,
      { ...KITALALT_2(), varakozasiIdo: TURELEM }),
    (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO, { ...KITALALT_12(), varakozasiIdo: TURELEM }),
    kapott);
  for (const [nev, kiszolgaloB] of [['randevu2', KITALALT_2()], ['randevu1', {}]]) {
    const vendeg = fajlBlobTarolo(KOINO, await ujMappa('koino-nyelv4-vendeg-'));
    await egy(nev,
      (p) => fajlUdpResen(p.egyik, '127.0.0.1', p.masikPort, vendeg, KOINO, lenyomat, { ...KITALALT_12(), varakozasiIdo: TURELEM }),
      (p) => randevuKiszolgalo(p.masik, p.egyikPort, (l) => blob.olvas(l), kiszolgaloB),
      async () => (await vendeg.olvas(lenyomat))?.length === 70000);
  }
  {
    const vendeg = fajlBlobTarolo(KOINO, await ujMappa('koino-nyelv4-vendeg-'));
    await egy('fajlCsere2',
      (p) => fajlUdpResen(p.egyik, '127.0.0.1', p.masikPort, vendeg, KOINO, lenyomat, { ...KITALALT_12(), varakozasiIdo: TURELEM }),
      (p) => vedettParbeszed(p.masik, p.egyikPort, szolgalo, { ...KITALALT_2(), fajlOlvas: (l) => blob.olvas(l) }),
      async () => (await vendeg.olvas(lenyomat))?.length === 70000);
  }
  // a fejlécek (FEJLECEK → MINTAKEREK → MINTAK) és a törzs (TORZS → a fájl szeletei ugyanazon a soron) a 2-estől
  const kiszolgalo = {
    fejlecek: async () => ({ valasz: { lista: [] }, tartja: true, mintak: async (kert) => ({ mintak: { kert }, esemenyek: [] }) }),
    torzs: async () => [lenyomat]
  };
  await egy('fejlecek2',
    (p) => kerelemUdpResen(p.egyik, '127.0.0.1', p.masikPort, KOINO, { fajta: 'fejlecek', kulcs: g.azonosito, n: 1 },
      { ...KITALALT_12(), varakozasiIdo: TURELEM, mintaValaszto: () => ({ x: [1] }) }),
    (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO,
      { ...KITALALT_2(), varakozasiIdo: TURELEM, kerelemKiszolgalo: kiszolgalo }),
    async (r) => r.kiszolgalta === true && JSON.stringify(r.mintak) === '{"kert":{"x":[1]}}');
  {
    const vendeg = fajlBlobTarolo(KOINO, await ujMappa('koino-nyelv4-vendeg-'));
    await egy('torzs2',
      (p) => kerelemUdpResen(p.egyik, '127.0.0.1', p.masikPort, KOINO, { fajta: 'torzs', kulcs: g.azonosito },
        { ...KITALALT_12(), varakozasiIdo: TURELEM, blob: vendeg }),
      (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO,
        { ...KITALALT_2(), varakozasiIdo: TURELEM, kerelemKiszolgalo: kiszolgalo, fajlOlvas: (l) => blob.olvas(l) }),
      async (r) => r.fajlok?.[0]?.kesz === true && (await vendeg.olvas(lenyomat))?.length === 70000);
  }
  let valaszJott = false;
  await egy('valasz2',
    (p) => valaszUdpResen(p.egyik, '127.0.0.1', p.masikPort, KOINO, { az: 'proba-valasz4', fajta: 'szelet', kulcs: g.azonosito },
      { ...KITALALT_12(), varakozasiIdo: TURELEM }),
    (p) => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, szolgalo, KOINO,
      { ...KITALALT_2(), varakozasiIdo: TURELEM, valaszFogado: async () => { valaszJott = true; return true; } }),
    async () => valaszJott);
  const jo = Object.fromEntries(Object.entries(eredmeny).map(([n, e]) => [n, e.ok]));
  const ok = Object.keys(jo).length === 9 && Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(eredmeny) + ')\n');
  return ok;
});

// Rontás: (a) a szél a régi programnak is a legújabbat beszéli → a régi nem érti → bukik; (b) a régi, jel nélküli társ nem az
// 1-es → bukik.
proba('⭐⭐⭐ a VALÓDI régi program (a git-ből) és a KITALÁLT [1,2]: cserélnek (az 1-esen), és a szeletet mindkét irányban megkapják', async () => {
  const regi = await regiProgram();
  if (!regi) { process.stdout.write('    (a régi program (' + REGI_PROGRAM + ') nincs meg a git-történetben — kihagyva)\n'); return true; }
  const regiTar = () => ujTar(regi.fajlTar.esemenyTarNyitasa);
  const regiMent = (tar, es) => ment(tar, es, regi.esemenyTar.esemenyMentese);
  const anna = await ujEember(KOINO), bela = await ujEember(KOINO);
  const annaE = await lanc(anna, 3, 'A'), belaE = await lanc(bela, 2, 'B');
  const tarA = await regiTar(); await regiMent(tarA, annaE);
  const tarB = await ujTar(); await ment(tarB, belaE);
  const [csA, csB] = await resCsere(tarA, {}, tarB, KITALALT_12(), regi.udpVonal.csereUdpResen, csereUdpResen);
  const csereLement = csA.ok && lement(csB, 1)
    && (await regi.esemenyTar.koinoEsemenyei(tarA, KOINO)).length === 5 && await nala(tarB) === 5;
  const g = annaE[0];
  const maiSzolgalo = await ujTar(); await ment(maiSzolgalo, [g]);
  const regiSzolgalo = await regiTar(); await regiMent(regiSzolgalo, [g]);
  let p = await udpParos();
  const [rk] = await ketFel(
    async () => regi.udpVonal.szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await regiTar(), KOINO, g.azonosito, { varakozasiIdo: TURELEM }),
    () => csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, maiSzolgalo, KOINO, { ...KITALALT_12(), varakozasiIdo: TURELEM }));
  p.bezar();
  p = await udpParos();
  const [mk] = await ketFel(
    async () => szeletUdpResen(p.egyik, '127.0.0.1', p.masikPort, await ujTar(), KOINO, g.azonosito, { ...KITALALT_12(), varakozasiIdo: TURELEM }),
    () => regi.udpVonal.csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, regiSzolgalo, KOINO, { varakozasiIdo: TURELEM }));
  p.bezar();
  const jo = { csereLement, regiKeroKapta: rk.ok && rk.ertek.kapott >= 1, kitalaltKeroKapta: mk.ok && mk.ertek.kapott >= 1 };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify([csA, csB, rk, mk].map((r) => r.ok ? 'rendben' : r.kod + ' ' + r.uzenet)) + ')\n');
  return ok;
});

// ===== ⭐⭐ A KÉZFOGÁS-VÁLASZTÓ (az építés ④-e) =====

// Rontás: (a) a részek nem a nemzedéké (mindig a mai) → az 1-es lépés a kitalált kulcsot adná → bukik; (b) a legrégebbi
// szállítás nem a dátumból → a lejárt is [1,2] → bukik; (c) a feljegyzés más foglalatra is átlát → bukik; (d) a kitalált
// szállítás nem a környezetből → bukik.
proba('⭐⭐ a SZÁLLÍTÁS nemzedékei: a részek a közös nemzedéké (a lépésé, különben a mai); a legrégebbi a dátumból; a kapu feljegyzése foglalatonként és címenként, korlátosan; a készlet alakja ellenőrizve', () => {
  const most = Date.now();
  const k = kitalaltSzallitasKeszlet(200, most);
  const r1 = szallitasReszei(k, 1), r2 = szallitasReszei(k, 2);
  const a = ujEgyszeriKulcs(), b = ujEgyszeriKulcs();
  // az 1-es részei a mai kulcsot adják, a 2-esé mást (mindkét oldal a saját nemzedékével ugyanazt)
  const kulcs1 = r1.munkamenetKulcsai(a, b.nyilvanos).kuldo, kulcs2 = r2.munkamenetKulcsai(a, b.nyilvanos).kuldo;
  const mai = munkamenetKulcsai(a, b.nyilvanos).kuldo;
  const halo1 = {}, halo2 = {};
  szallitasFeljegyzese(halo1, '10.0.0.1', 5, 2);
  for (let i = 0; i < 1030; i++) szallitasFeljegyzese(halo2, '10.0.1.' + (i % 250), 1000 + i, 1);
  const regiKornyezet = process.env.KOINO_PROBASZALLITAS;
  process.env.KOINO_PROBASZALLITAS = '200';
  const kornyezet12 = sajatSzallitas().join() === '1,2' && szallitasKeszlet().kitalalt === true
    && lejaroValtozatok().szallitas.map((x) => x.nyelv).join() === '1';
  process.env.KOINO_PROBASZALLITAS = '-1';
  const kornyezet2 = sajatSzallitas().join() === '2,2' && lejaroValtozatok().szallitas.length === 0;
  if (regiKornyezet === undefined) delete process.env.KOINO_PROBASZALLITAS; else process.env.KOINO_PROBASZALLITAS = regiKornyezet;
  const dob = (x) => { try { szallitasKeszletEllenorzese(x); return false; } catch { return true; } };
  const jo = {
    mai: Object.keys(REGI_SZALLITASOK).length === 0 && sajatSzallitas().join() === '1,1' && szallitasKeszlet().legujabb === 1
      && SZALLITAS_RESZEK.every((n) => typeof szallitasReszei(szallitasKeszlet(), 1)[n] === 'function'),
    reszek: kulcs1.equals(mai) && !kulcs2.equals(mai) && r2.munkamenetKulcsai(a, b.nyilvanos).kuldo.equals(kulcs2)
      && r1.csomagTitkositasa === r2.csomagTitkositasa,
    lejart: sajatSzallitas({ szallitasKeszlet: kitalaltSzallitasKeszlet(-1, most) }).join() === '2,2'
      && sajatSzallitas({ szallitasKeszlet: k }).join() === '1,2',
    feljegyzes: feljegyzettSzallitas(halo1, '10.0.0.1', 5) === 2 && feljegyzettSzallitas(halo2, '10.0.0.1', 5) === null
      && feljegyzettSzallitas(halo1, '10.0.0.1', 6) === null && feljegyzettSzallitas(halo2, '10.0.1.0', 1000) === null
      && feljegyzettSzallitas(halo2, '10.0.1.29', 2029) === 1,
    ellenorzes: [
      { legujabb: 2, lepesek: { 1: { meddig: '2027-13-01', reszek: {} } } },
      { legujabb: 2, lepesek: { 1: { meddig: '2027-01-01', reszek: { ismeretlen: () => 1 } } } },
      { legujabb: 1, lepesek: { 1: { meddig: '2027-01-01', reszek: {} } } }
    ].every(dob),
    kornyezet12, kornyezet2
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ')\n');
  return ok;
});

/**
 * Egy kapu, a munkája: kézfogás (a kapu feljegyzése szerint — a hívó nem mondja meg) és egy csere a védett résen. A munkák
 * (a közös szállítással) a `munkak`-ban.
 */
async function valasztoKapu(keszlet, tar) {
  const munkak = [];
  const sz = keszlet ? { szallitasKeszlet: keszlet } : {};
  const kapu = await udpKapuNyitasa({ port: 0, jelez: () => {}, ...sz,
    munka: async (halo, t) => {
      const v = await kezfogasUdpResen(halo, t.cim, t.port, { ...sz, varakozasiIdo: TURELEM });
      try {
        const cs = await csereUdpResen(v, t.cim, t.port, tar, KOINO, { varakozasiIdo: TURELEM });
        munkak.push({ szallitas: v.szallitas, ok: true });
        return cs;
      } catch (hiba) {
        munkak.push({ szallitas: v.szallitas, ok: false, hiba: hiba.message });
        throw hiba;
      } finally {
        v.zar();
      }
    } });
  return { kapu, munkak };
}

/** A kopogó (A) és a kopogott (B) kapu — a két munka végéig (az `elotte` a kapuk nyitása után, a kopogás előtt fut). */
async function valasztoKopogas(kA, kB, elotte = null) {
  const anna = await ujEember(KOINO), bela = await ujEember(KOINO);
  const tarA = await ujTar(); await ment(tarA, await lanc(anna, 3, 'A'));
  const tarB = await ujTar(); await ment(tarB, await lanc(bela, 2, 'B'));
  const a = await valasztoKapu(kA, tarA), b = await valasztoKapu(kB, tarB);
  let kor = null;
  try {
    if (elotte) elotte();
    kor = await a.kapu.kopog([{ cim: '127.0.0.1', port: b.kapu.port }], { idokorlat: 3 * TURELEM });
    for (let i = 0; i < 40 && (a.munkak.length < 1 || b.munkak.length < 1); i++) await varj(100);
  } finally {
    a.kapu.zar();
    b.kapu.zar();
  }
  return { a: a.munkak, b: b.munkak, nalaA: await nala(tarA), nalaB: await nala(tarB), kor };
}

// Rontás: (a) a kapu nem jegyzi fel a közös szállítást → mindkét fél a legrégebbijével fog kezet → az [1,2] és a [2,2] nem
// érti egymást → bukik; (b) a kézfogás a feljegyzést nem olvassa → ugyanígy bukik; (c) a kézfogás a legújabbal fog kezet (nem
// a közössel) → az [1,2] és az 1-es nem érti egymást → bukik; (d) a részek nem a közös nemzedékéi → bukik; (e) a kapu a saját
// szállítását csak a nyitáskor számolja → a futó kapun lejárt régi lépést is mondja, a kézfogás némán bukik → bukik.
proba('⭐⭐⭐ a KÉZFOGÁS-VÁLASZTÓ a kapun: egy kitalált 2-es szállítással a kopogás után a közös nemzedékkel fognak kezet — az 1-essel az 1-essel, a csak 2-essel a 2-essel —, és a csere mindkét esetben lemegy; a FUTÓ kapun lejárt régi lépés után megnevezve nincs közös', async () => {
  const egyes = await valasztoKopogas(kitalaltSzallitasKeszlet(200), null);
  const kettes = await valasztoKopogas(kitalaltSzallitasKeszlet(200), kitalaltSzallitasKeszlet(-1));
  // ⭐ a régi lépés dátuma a már nyitott kapun jön el (mint egy napokig futó postaládán): a kopogás már a [2,2]-t mondja
  const k = kitalaltSzallitasKeszlet(200);
  const futon = await valasztoKopogas(k, null, () => { k.lepesek[1].meddig = '2000-01-01'; });
  const nk = futon.kor?.eredmenyek?.[0]?.nincsKozos;
  const rendben = (x, n) => x.a.length === 1 && x.b.length === 1 && x.a[0].ok && x.b[0].ok
    && x.a[0].szallitas === n && x.b[0].szallitas === n && x.nalaA === 5 && x.nalaB === 5;
  const jo = { egyes: rendben(egyes, 1), kettes: rendben(kettes, 2),
    futon: futon.a.length === 0 && futon.b.length === 0 && nk?.mi === 'szallitas' && nk.irany === 'regebbi' && nk.sajat?.join() === '2,2' };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ' | ' + JSON.stringify({ egyes, kettes, futon: { ...futon, kor: futon.kor?.eredmenyek } }) + ')\n');
  return ok;
});

/** Két kézi pajzsfúró egymásra (rögzített portokon); az átfúrt résen a kézfogás a fúrás feljegyzése szerint. */
async function ketFuro(kA, kB, portA, portB, indulA = null) {
  const fel = { a: [], b: [] };
  const egy = (keszlet, sajatPort, tarsPort, nev) => pajzsfurasTobbfele(sajatPort, [{ cim: '127.0.0.1', port: tarsPort }], {
    idokorlat: 3 * TURELEM, koz: 100, sajatCimMerese: false, ...(keszlet ? { szallitasKeszlet: keszlet } : {}),
    utana: (e) => { if (e.mi === 'NINCS-KOZOS-SZALLITAS') fel[nev].push(e); if (e.mi === 'INDUL' && nev === 'a' && indulA) indulA(); },
    atfurt: async (allapot, halo) => {
      const v = await kezfogasUdpResen(halo, allapot.cim, allapot.port,
        { ...(keszlet ? { szallitasKeszlet: keszlet } : {}), varakozasiIdo: TURELEM });
      fel[nev].push({ mi: 'KEZET-FOGTUNK', szallitas: v.szallitas });
      v.zar();
    }
  });
  const [ra, rb] = await Promise.all([egy(kA, portA, portB, 'a'), egy(kB, portB, portA, 'b')]);
  return { ra, rb, fel };
}

// Rontás: (a) a fúró kopogása jel nélkül megy → a „2-es” a fúrót 1-esnek látja, és kezet fogna → bukik; (b) a fúró nem jegyzi
// fel a közöset → a kézfogás a legrégebbivel → bukik; (c) a közös nélküli cél nem „kész” → a fúrás az ablak végéig tart, és nem
// nevez meg → bukik; (d) a fúró a saját szállítását csak egyszer számolja → a fúrás alatt lejárt régit is mondja → bukik.
proba('⭐⭐ a kézi PAJZSFÚRÓ is viszi a szállítás jelét: közös szállításon a rés után a közös nemzedékkel fog kezet; közös nélkül mindkét fúró megnevezve, az ablak vége előtt kész', async () => {
  const kozos = await ketFuro(kitalaltSzallitasKeszlet(200), kitalaltSzallitasKeszlet(-1), 7991, 7993);
  const kezdet = Date.now();
  const nincs = await ketFuro(kitalaltSzallitasKeszlet(-1), null, 7995, 7997);
  const nincsIdo = Date.now() - kezdet;
  // ⭐ a régi lépés a fúrás indulásakor jár le (mint egy vég nélkül fúró parancsnál): a kopogás már a [2,2]-t mondja
  const k = kitalaltSzallitasKeszlet(200);
  const futon = await ketFuro(k, null, 7999, 8001, () => { k.lepesek[1].meddig = '2000-01-01'; });
  const kezet = (x) => x.length === 1 && x[0].mi === 'KEZET-FOGTUNK' && x[0].szallitas === 2;
  const jo = {
    kozos: kozos.ra.atfurtak.length === 1 && kozos.rb.atfurtak.length === 1 && kezet(kozos.fel.a) && kezet(kozos.fel.b),
    nincs: nincs.ra.atfurtak.length === 0 && nincs.rb.atfurtak.length === 0
      && nincs.ra.celok[0]?.nincsKozos?.irany === 'regebbi' && nincs.rb.celok[0]?.nincsKozos?.irany === 'ujabb'
      && nincs.fel.a.length === 1 && nincs.fel.b.length === 1,
    hamarKesz: nincsIdo < 2 * TURELEM,
    futon: futon.ra.atfurtak.length === 0 && futon.ra.celok[0]?.nincsKozos?.irany === 'regebbi' && futon.fel.a.length === 1
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ ...jo, nincsIdo, kozos: kozos.fel, nincs: nincs.fel,
    celok: [nincs.ra.celok, nincs.rb.celok] }) + ')\n');
  return ok;
});

// ===== ⭐⭐ AKIVEL MÉG A RÉGIN BESZÉLÜNK (④ — a ⑦ dátuma) =====

// Rontás: (a) a legújabbon lement munka nem törli → bukik; (b) a nem csere (null) munka törli → bukik; (c) a kép a 30 napon túli
// dátumot is kimondja → bukik; (d) a kép a már nem beszélt (a legrégebbi alatti) változatot is számolja → bukik; (e) a határ
// nem a v-től fölfelé a legkorábbi → bukik; (f) a „nem értjük” rész eldobja a régin-bejegyzéseket → bukik.
proba('⭐⭐ AKIVEL MÉG A RÉGIN BESZÉLÜNK: a régebbi közös nyelvű munka feljegyzi, a legújabbon lement törli; a lap csak 30 napon belüli dátumnál szól — rétegenként, a nappal és a teendővel', () => {
  const T0 = Date.UTC(2026, 10, 7, 12);
  const NAP = 24 * 3600 * 1000;
  const legujabb = { nyelv: 2, szallitas: 2 };
  let j = uresNyelvJegyzek();
  j = reginFeljegyzese(j, 'A', { nyelv: 1, szallitas: 2 }, legujabb, T0);
  j = reginFeljegyzese(j, 'B', { nyelv: 1, szallitas: 1 }, legujabb, T0);
  j = reginFeljegyzese(j, 'C', { nyelv: 2, szallitas: 2 }, legujabb, T0);
  const feljegyezve = Object.keys(j.regin).sort().join() === 'A,B' && j.regin.A.szallitas === null && j.regin.B.szallitas === 1;
  const ugyanaz = reginFeljegyzese(j, 'A', { nyelv: 1, szallitas: 2 }, legujabb, T0 + 60000) === j
    && reginFeljegyzese(j, 'A', { nyelv: null, szallitas: null }, legujabb, T0) === j;
  // a „nem értjük” lépései nem dobják el
  const megmarad = Object.keys(ertjukFeljegyzese(korMegfigyelesei(j, [{ cim: 'x', port: 1, cel: { cim: 'x', port: 1 }, ok: false,
    nincsKozos: { mi: 'nyelv', irany: 'ujabb', sajat: [1, 2], tars: [3, 3] } }], () => 'x:1', T0).jegyzek, ['x:1']).regin).length === 2;
  // a lejáró lépések (a nyelvnél 10, a szállításnál 40 nap múlva)
  const lejarok = (nyNap, szNap) => ({ nyelv: [{ nyelv: 1, meddig: '2026-11-17', napMulva: nyNap }],
    szallitas: [{ nyelv: 1, meddig: '2026-12-17', napMulva: szNap }] });
  const kep = nyelvekKepe(j, T0, lejarok(10, 40));
  const mindketto = nyelvekKepe(j, T0, lejarok(10, 20));
  const messze = nyelvekKepe(j, T0, lejarok(REGIN_ELORE_NAP + 1, 40));
  // a már nem beszélt változat (a legrégebbi lépésünk a 2-es — az 1-est elhagytuk): nem „hamarosan”, hanem már most nincs közös
  // (azt a „nem értjük” mondja ki), tehát itt nem számít
  const nemBeszelt = nyelvekKepe(j, T0, { nyelv: [{ nyelv: 2, meddig: '2026-11-12', napMulva: 5 }], szallitas: [] });
  const nincsMegadva = nyelvekKepe(j, T0);
  // a határ a v-től fölfelé a legkorábbi: a 3 nyelvű készüléken az 1-es a 2-es lépés (5 nap) dátumán is elvész
  const harom = nyelvekKepe({ tarsak: {}, regin: { D: { nyelv: 1, szallitas: null, utoljara: T0 } } }, T0,
    { nyelv: [{ nyelv: 1, meddig: '2027-01-01', napMulva: 55 }, { nyelv: 2, meddig: '2026-11-12', napMulva: 5 }], szallitas: [] });
  // a legújabbon lement munka törli; a rég nem látott elévül
  const torolve = Object.keys(reginFeljegyzese(j, 'B', { nyelv: 2, szallitas: 2 }, legujabb, T0).regin).join() === 'A';
  const elevult = nyelvekKepe(j, T0 + NEM_ERTJUK_LATSZIK + NAP, lejarok(10, 20)).lejaro === 0;
  const jo = {
    feljegyezve, ugyanaz, megmarad, torolve, elevult,
    kep: kep.lejaro === 2 && kep.mondatok.length === 1
      && kep.mondatok[0] === '2 társad még csak a régi (1.) nyelvet beszéli — a programod 10 nap múlva (2026-11-17) már nem beszéli:'
        + ' ha addig nem frissítenek, utána nem cseréltek',
    mindketto: mindketto.lejaro === 2 && mindketto.mondatok.length === 2
      && /^1 társad még csak a régi \(1\.\) szállítást beszéli — a programod 20 nap múlva \(2026-12-17\) már nem beszéli: ha addig nem frissít, utána/.test(mindketto.mondatok[1]),
    messze: messze.lejaro === 0 && messze.mondatok.length === 0,
    nemBeszelt: nemBeszelt.lejaro === 0 && nincsMegadva.lejaro === 0,
    harom: harom.lejaro === 1 && /5 nap múlva \(2026-11-12\)/.test(harom.mondatok[0] ?? ''),
    alak: Object.keys(nyelvJegyzekAlakja(JSON.parse(JSON.stringify(j))).regin).length === 2
      && Object.keys(nyelvJegyzekAlakja({ regin: { X: { nyelv: 0, utoljara: T0 }, Y: { nyelv: 1 } } }).regin).length === 0
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, kep, mindketto, harom }) + ')\n');
  return ok;
});

export default async function (csendes) {
  const eredmeny = await futtatas(csendes);
  for (const m of mappak) await rm(m, { recursive: true, force: true });
  return eredmeny;
}
