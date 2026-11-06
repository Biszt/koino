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
//
// Használja: meres/mind.js (`nyelv` csoport, a `csere` csoportban is).

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createSocket } from 'node:dgram';

import { esemenyTarNyitasa, fajlBlobTarolo } from '../js/tar/fajlTar.js';
import { esemenyMentese, koinoEsemenyei } from '../js/tar/esemenyTar.js';
import { parbeszed, fajlKiszolgalas } from '../js/csere/vonal.js';
import {
  csereUdpResen, szeletUdpResen, valaszUdpResen, fajlUdpResen, kezfogasUdpResen, udpKapcsolat
} from '../js/csere/udpVonal.js';
import {
  NYELV_LEGREGEBBI, NYELV_LEGUJABB, sajatNyelv, tarsNyelve, kozosNyelv, nyelvEllenorzese
} from '../js/csere/nyelvValtozat.js';
import { probaGyujtemeny, ujEember } from './probaFuttato.js';

const { proba, futtatas } = probaGyujtemeny('A protokoll nyelvváltozata (D124 — PR6)');

const KOINO = 'proba';
const mappak = [];
// ⭐ A próbák nem várják ki a 20 mp-es tétlenségi órát: a megnevezett hiba azonnal jön, a régi program néma oldala 3 mp után.
const TURELEM = 3000;

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
    mai: NYELV_LEGREGEBBI === 1 && NYELV_LEGUJABB === 1 && sajatNyelv().join() === '1,1',
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
async function randevuKiszolgalo(halo, port, olvas, nyelv) {
  const v = await kezfogasUdpResen(halo, '127.0.0.1', port);
  const k = udpKapcsolat(v, '127.0.0.1', port);
  k.setTimeout(TURELEM, () => k.destroy(new Error('a társ nem kért semmit (' + TURELEM + ' ms)')));
  try {
    return await fajlKiszolgalas(k, olvas, { nyelv });
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
    (p) => randevuKiszolgalo(p.masik, p.egyikPort, (l) => blob.olvas(l), [1, 1]));
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

export default async function (csendes) {
  const eredmeny = await futtatas(csendes);
  for (const m of mappak) await rm(m, { recursive: true, force: true });
  return eredmeny;
}
