// meres/protokollMeres.js — ⭐ A TÜRELMES OLVASÓ (90. mérés, D123 ③ — PR6, a verziózott protokoll)
//
// Felelősség: megméri, mit tesz a MAI program egy olyan társ üzeneteivel, ami NÁLA ÚJABB — vagyis mi az, amit egy jövőbeli
// program a mai felé „ingyen” (nyelvváltozat nélkül) megtehet, és mi az, ami a cserét elakasztja. Két mai program cserél egy
// helyi UDP-résen, a védett (titkosított) vonalon — mint az őrjáratban —, és az EGYIK a saját kimenő üzeneteit „jövőbelivé”
// alakítja:
//   (a) alap — semmi nem változik (a viszonyítás);
//   (b) ismeretlen MEZŐ minden üzenetben (`"jovo":{…}`) — egy új program új adatot küld a meglévő üzenetekben;
//   (c) ismeretlen ÜZENET a nyitás után (`{"uzenet":"JOVO"}`) — egy új program új lépést tesz a menetbe;
//   (d) a NYITÁS egy nyelvváltozat-jellel (`"v":[1,2]`) — a PR6 jelének ára (bájtban) és az, hogy a mai program elviseli-e.
// Mindegyiknél: lement-e a csere (mindkét félnél megvan-e minden esemény), és ha nem, mi a megnevezett ok.
//
// Nem önpróba: számokat ad. Futtatás (a tár gyökeréből): node meres/protokollMeres.js
// Használja: a 90. mérés (eredmenyek.md), docs/protokoll_valtozat_atvizsgalas.md.

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSocket } from 'node:dgram';

import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese, koinoEsemenyei } from '../js/tar/esemenyTar.js';
import { parbeszed } from '../js/csere/vonal.js';
import { kezfogasUdpResen, udpKapcsolat } from '../js/csere/udpVonal.js';
import { ujEember } from './probaFuttato.js';

const KOINO = 'proba';
const mappak = [];

// ===== A KÉSZÜLÉKEK =====

async function ujTar() {
  const mappa = await mkdtemp(join(tmpdir(), 'koino-protokoll-'));
  mappak.push(mappa);
  return esemenyTarNyitasa(KOINO, mappa);
}

async function lanc(eember, hossz, elotag) {
  const esemenyek = [];
  for (let i = 1; i <= hossz; i++) esemenyek.push(await eember.tesz('GondolatLetrehozas', { cim: elotag + i, meret: 10 * i }));
  return esemenyek;
}

// ===== A „JÖVŐBELI” KÜLDŐ — a kimenő sorokat alakítja =====
//
// A `parbeszed` soronként egy JSON-üzenetet ír (`kapcsolat.write`). A burok minden kiírt sort átalakít a változat szerint, és
// összeadja a nyitás bájtjait (a d-hez).
function jovobeliKapcsolat(kapcsolat, valtozat, meres) {
  const eredeti = kapcsolat.write.bind(kapcsolat);
  let nyitasUtan = false;
  kapcsolat.write = (szoveg, ...tobbi) => {
    const sorok = String(szoveg).split('\n').filter(Boolean);
    const ki = [];
    for (const sor of sorok) {
      let u;
      try { u = JSON.parse(sor); } catch { ki.push(sor); continue; }
      if (valtozat === 'mezo') u.jovo = { valami: 'új adat', szam: 42 };
      if (valtozat === 'jel' && u.uzenet === 'NYITAS') u.v = [1, 2];
      const kiSor = JSON.stringify(u);
      if (u.uzenet === 'NYITAS') meres.nyitasBajt = Buffer.byteLength(kiSor + '\n');
      ki.push(kiSor);
      if (valtozat === 'uzenet' && u.uzenet === 'NYITAS' && !nyitasUtan) {
        nyitasUtan = true;
        ki.push(JSON.stringify({ uzenet: 'JOVO', valami: 'egy új lépés' }));
      }
    }
    return eredeti(ki.map((s) => s + '\n').join(''), ...tobbi);
  };
  return kapcsolat;
}

// ===== EGY CSERE =====

async function csere(valtozat) {
  const anna = await ujEember(KOINO);
  const bela = await ujEember(KOINO);
  const annaE = await lanc(anna, 3, 'A');
  const belaE = await lanc(bela, 2, 'B');
  const jovo = await ujTar(); for (const e of annaE) await esemenyMentese(jovo, e);
  const mai = await ujTar(); for (const e of belaE) await esemenyMentese(mai, e);

  const egyik = createSocket({ type: 'udp4', reuseAddr: true });
  const masik = createSocket({ type: 'udp4', reuseAddr: true });
  await new Promise((t) => egyik.bind(0, '127.0.0.1', t));
  await new Promise((t) => masik.bind(0, '127.0.0.1', t));
  const meres = { nyitasBajt: null };
  const fel = async (halo, port, tar, jovobeli) => {
    const v = await kezfogasUdpResen(halo, '127.0.0.1', port);
    try {
      const k = udpKapcsolat(v, '127.0.0.1', port);
      k.setTimeout(8000, () => k.destroy(new Error('A másik fél nem válaszol (8000 ms)')));
      return await parbeszed(jovobeli ? jovobeliKapcsolat(k, valtozat, meres) : k, tar, KOINO);
    } finally {
      v.zar();
    }
  };
  const [j, m] = await Promise.allSettled([
    fel(egyik, masik.address().port, jovo, true),   // az alapnál a burok semmit nem alakít — csak a nyitás bájtjait méri
    fel(masik, egyik.address().port, mai, false)
  ]);
  egyik.close(); masik.close();
  const nalaJovo = (await koinoEsemenyei(jovo, KOINO)).length;
  const nalaMai = (await koinoEsemenyei(mai, KOINO)).length;
  const ok = (r) => (r.status === 'fulfilled' ? 'rendben' : (r.reason?.kod ? r.reason.kod + ' ' : '') + r.reason?.message);
  return { lement: nalaJovo === 5 && nalaMai === 5, nalaJovo, nalaMai, jovobeli: ok(j), mai: ok(m), nyitasBajt: meres.nyitasBajt };
}

// ===== A FUTTATÁS =====

const VALTOZATOK = [
  ['alap', '(a) alap — két mai program'],
  ['mezo', '(b) ismeretlen MEZŐ minden üzenetben'],
  ['uzenet', '(c) ismeretlen ÜZENET a nyitás után'],
  ['jel', '(d) a NYITÁS nyelvváltozat-jellel ("v":[1,2])']
];

// a naplózást (console.log) a mérés idejére elnémítjuk — csak az eredmény kell
const naplo = console.log; const figyel = console.warn;
console.log = () => {}; console.warn = () => {};
const eredmenyek = [];
for (const [valtozat, nev] of VALTOZATOK) {
  try { eredmenyek.push([nev, await csere(valtozat)]); }
  catch (h) { eredmenyek.push([nev, { hiba: h.message }]); }
}
console.log = naplo; console.warn = figyel;

console.log('A TÜRELMES OLVASÓ — egy „jövőbeli” program (A, 3 gondolat) és egy mai (B, 2 gondolat) cseréje a védett UDP-résen');
let alapNyitas = null;
for (const [nev, r] of eredmenyek) {
  if (r.hiba) { console.log('  ' + nev + ': MÉRÉSI HIBA — ' + r.hiba); continue; }
  if (nev.startsWith('(a)')) alapNyitas = r.nyitasBajt;
  console.log('  ' + nev);
  console.log('      lement: ' + (r.lement ? 'IGEN' : 'NEM') + ' (A-nál ' + r.nalaJovo + ', B-nél ' + r.nalaMai + ' gondolat; 5 a teljes)');
  console.log('      a jövőbeli fél: ' + r.jovobeli + ' | a mai fél: ' + r.mai);
  if (nev.startsWith('(d)') && alapNyitas) console.log('      a NYITÁS: ' + alapNyitas + ' → ' + r.nyitasBajt + ' bájt (+' + (r.nyitasBajt - alapNyitas) + ', nyíltan; a résen titkosítva megy)');
}
for (const m of mappak) await rm(m, { recursive: true, force: true });
process.exit(0);
