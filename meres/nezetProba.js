// meres/nezetProba.js

// Felelősség: ⭐⭐ A KÖZÖSSÉG FELTÖLTÖTT NÉZETEINEK PRÓBÁJA (D126 — a D123 PR4-e; `js/allapot/nezetKartya.js`, `js/felulet/nezetFelulet.js`,
// a `nezet` parancs, a lap útjai, `felulet/js/koinoNezetKeret.js`):
//   · a KÁRTYA szabályai: a kód a szöveg ELSŐ fájl-blokkja; a kód UTF-8 szöveg; a bekapcsolás koinónként és a LENYOMATHOZ kötve (ha a
//     kód változik: `valtozott`), korlátosan, a hibás jegyzék-rész eldobva;
//   · a NÉZET-FELÜLET alakja: a keret tartalma (a CSP és az őr a LEGELEJÉN, a kliens, a kód), a válasz csak a kimondott mezőkkel, a
//     kérdés-készlet (az ismeretlen kérdés megnevezve, a darab korlátos);
//   · a PARANCSSOR (valódi folyamatokkal): a feltöltés (a kép a típust és a szöveget hordozza, a kód a szöveg törzsében, a fájl-igény
//     a kódot kéri), a lista, a kód, a be- és kikapcsolás (a bekapcsolás csak `igen`-nel), a hibás fájl és a sok pont megnevezve;
//   · a LAP ÚTJAI (a valódi felület): a feltöltés, a lista, a kártya (a kimondással), a keret csak bekapcsolva, a rossz lenyomat
//     megnevezve, a kérdések válaszai, a kikapcsolás és a `valtozott` állás; a lap CSP-je (`frame-src 'none'`);
//   · ⭐⭐ az ELSZIGETELÉS a VALÓDI lapon, fej nélküli Chrome-mal (a 92. mérés (b) részéből): egy „rosszindulatú” nézet a valódi
//     kapu mögött, a valódi keretben — a külvilágba (egy második helyi kiszolgáló és egy UDP-kapu) semmi nem jut ki, a lap kulcsa a
//     nézethez nem jut el, és közben a kérdéseire jó választ kap. ⛔ KONTROLLAL: ugyanaz a kérés a lapról kijut (a 92. mérés lelete:
//     egy szűrő mindent „zártnak” mutathat). Ha nincs Chrome a gépen, kimarad (mint az `sh`-t kívánó próbák).
//
// Használja: meres/mind.js (`nezet` — a `parancssor` csoportban).

import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir, networkInterfaces } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { createSocket } from 'node:dgram';

import {
  nezetSzovegBlokkjai, nezetKodja, kodSzovege, nezetJegyzekAlakja, nezetBekapcsolasa, nezetKikapcsolasa, nezetAllasa,
  NEZET_BEKAPCSOLT_KORLAT
} from '../js/allapot/nezetKartya.js';
import { NEZET_CSP, NEZET_OR, nezetKeretTartalma, nezetEntitasa, nezetKerdesAlakja, NEZET_LAP_DARAB } from '../js/felulet/nezetFelulet.js';
import { szovegDarabbol } from '../js/esemeny/szovegDarab.js';
import { probaGyujtemeny } from './probaFuttato.js';

const { proba, futtatas } = probaGyujtemeny('A közösség feltöltött nézetei (D126 — PR4)');

const futtat = promisify(execFile);
const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const mappak = [];
const varj = (ms) => new Promise((kesz) => setTimeout(kesz, ms));
const L = (c) => c.repeat(43);

async function ujMappa(elotag) {
  const m = await mkdtemp(join(tmpdir(), elotag));
  mappak.push(m);
  return m;
}

// ===== ⭐ A KÁRTYA SZABÁLYAI =====

// Rontás: (a) a kód az UTOLSÓ fájl-blokk → a második fájlt adja → bukik; (b) a sima szövegben is keres → bukik; (c) a hibás UTF-8-at
// elfogadja → bukik.
proba('⭐ a KÁRTYA: a szövege a leírás és a kód fájl-blokkja; a kód a szöveg ELSŐ fájl-blokkja (sima szövegben nincs); a kód UTF-8 szöveg', () => {
  const blokkok = nezetSzovegBlokkjai({ leiras: 'Egy <b>térkép</b>\nkét sor', kod: { lenyomat: L('A'), nev: 'C:\\x\\terkep.html' } });
  const ketFajl = [...blokkok, { tipus: 'fajl', url: '/api/fajl/' + L('B'), nev: 'masik.html' }];
  const kepElotte = [{ tipus: 'kep', url: '/api/fajl/' + L('K') }, ...blokkok];
  let hibasUtf = null;
  try { kodSzovege(new Uint8Array([0x3c, 0xff, 0xfe])); } catch (h) { hibasUtf = h.message; }
  let ures = null;
  try { kodSzovege(new Uint8Array(0)); } catch (h) { ures = h.message; }
  const jo = {
    alak: blokkok.length === 2 && blokkok[0].tipus === 'szoveg' && blokkok[0].tartalom === 'Egy &lt;b&gt;térkép&lt;/b&gt;<br>két sor'
      && blokkok[1].tipus === 'fajl' && blokkok[1].url === '/api/fajl/' + L('A') && blokkok[1].nev === 'terkep.html',
    leirasNelkul: nezetSzovegBlokkjai({ kod: { lenyomat: L('A'), nev: '' } }).length === 1
      && nezetSzovegBlokkjai({ kod: { lenyomat: L('A') } })[0].nev === 'nezet.html',
    elso: nezetKodja(ketFajl)?.lenyomat === L('A') && nezetKodja(kepElotte)?.lenyomat === L('A'),
    simaSzoveg: nezetKodja('/api/fajl/' + L('A')) === null && nezetKodja(null) === null
      && nezetKodja([{ tipus: 'fajl', url: 'https://idegen.example/x.html' }]) === null,
    utf: kodSzovege(new TextEncoder().encode('\uFEFF<p>é</p>')) === '<p>é</p>' && /UTF-8/.test(hibasUtf ?? '') && /üres/.test(ures ?? '')
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, blokkok }) + ')\n');
  return ok;
});

// Rontás: (a) az állás a lenyomatot nem nézi → `be` a más kódra → bukik; (b) a koinót nem nézi → egy másik koinóban is `be` → bukik;
// (c) a korlát elmarad → a 65. is bekapcsol → bukik; (d) a kikapcsolás a többit is viszi → bukik.
proba('⭐ a BEKAPCSOLÁS: koinónként és a kód LENYOMATÁHOZ kötve (más kód: `valtozott`), korlátosan; a kikapcsolás csak azt viszi; a hibás jegyzék-rész eldobva', () => {
  let j = nezetJegyzekAlakja(null);
  j = nezetBekapcsolasa(j, { koino: 'K1', kartya: L('a'), lenyomat: L('x'), cim: 'Térkép', most: 1000 });
  j = nezetBekapcsolasa(j, { koino: 'K1', kartya: L('b'), lenyomat: L('y'), most: 2000 });
  const be = nezetAllasa(j, 'K1', L('a'), L('x'));
  const valtozott = nezetAllasa(j, 'K1', L('a'), L('z'));
  const masKoino = nezetAllasa(j, 'K2', L('a'), L('x'));
  const kodNelkul = nezetAllasa(j, 'K1', L('a'), null);
  let teli = nezetJegyzekAlakja(null);
  for (let i = 0; i < NEZET_BEKAPCSOLT_KORLAT; i++) {
    teli = nezetBekapcsolasa(teli, { koino: 'K', kartya: String(i).padStart(43, 'k'), lenyomat: L('x'), most: i + 1 });
  }
  let korlat = null;
  try { nezetBekapcsolasa(teli, { koino: 'K', kartya: L('q'), lenyomat: L('x') }); } catch (h) { korlat = h.message; }
  const ujra = nezetBekapcsolasa(teli, { koino: 'K', kartya: '0'.padStart(43, 'k'), lenyomat: L('w'), most: 999 });
  const ki = nezetKikapcsolasa(j, { koino: 'K1', kartya: L('a') });
  const kiNemVolt = nezetKikapcsolasa(j, { koino: 'K1', kartya: L('c') });
  const szemet = nezetJegyzekAlakja({ koinok: { K1: { nezetek: { [L('a')]: { lenyomat: L('x'), ido: 5 }, rossz: { lenyomat: L('x'), ido: 1 },
    [L('b')]: { lenyomat: 'rövid', ido: 1 } } }, K3: 'x', K4: { nezetek: {} } } });
  const jo = {
    be: be.allas === 'be' && be.bekapcsolva.cim === 'Térkép',
    valtozott: valtozott.allas === 'valtozott' && kodNelkul.allas === 'valtozott',
    masKoino: masKoino.allas === 'ki',
    korlat: /64 nézet/.test(korlat ?? '') && ujra.koinok.K.nezetek['0'.padStart(43, 'k')].lenyomat === L('w'),
    ki: nezetAllasa(ki, 'K1', L('a'), L('x')).allas === 'ki' && nezetAllasa(ki, 'K1', L('b'), L('y')).allas === 'be' && kiNemVolt === j,
    szemet: Object.keys(szemet.koinok).join() === 'K1' && Object.keys(szemet.koinok.K1.nezetek).join() === L('a')
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, korlat }) + ')\n');
  return ok;
});

// ===== ⭐ A NÉZET-FELÜLET ALAKJA =====

// Rontás: (a) a kód a CSP elé kerül → bukik; (b) az őr elmarad → bukik; (c) a válasz minden pakli-mezőt átad → bukik; (d) az ismeretlen
// kérdés átmegy → bukik; (e) a darab nincs korlátozva → bukik.
proba('⭐ a NÉZET-FELÜLET: a keret tartalma a CSP-vel és az őrrel KEZDŐDIK (utána a kliens, a kód); a válasz csak a kimondott mezőkkel; az ismeretlen kérdés megnevezve, a darab korlátos', () => {
  const kod = '<!doctype html><script>alert(1)</script>';
  const t = nezetKeretTartalma(kod);
  const cspHely = t.indexOf('Content-Security-Policy');
  const orHely = t.indexOf(NEZET_OR);
  const kliensHely = t.indexOf('koinoNezet');
  const kodHely = t.indexOf(kod);
  const k = { azonosito: L('a'), tipus: 'Gondolat', cim: 'Cím', szulo: null, osszesPont: 5, agazatiPont: 7, hozzajarulok: 2, sajatPont: 3,
    szerzo: L('s'), letrehozva: 10, vanSzoveg: true, gondolatTipus: { azonosito: L('t'), nev: 'Kérdés', ikon: '?' },
    kategoriak: [{ azonosito: L('k'), nev: 'Kat', ikon: 'x' }], koinoForras: { tartom: true }, olvasatlanErtesitesek: 4, torzsMeret: 9,
    javaslat: { fajta: 'szerkesztesi', muvelet: 'modositas', statusz: 'folyamatban', erintett: L('a'), szavazhatok: true,
      tamogatottsagEzrelek: 600, reszveteliEzrelek: 300, szavazok: ['x'], erintettek: [{ entitas: L('a'), muvelet: 'modositas', cim: 'C' }] } };
  const n = nezetEntitasa(k);
  const kulcsok = Object.keys(n).sort().join(',');
  const ismeretlen = nezetKerdesAlakja('tarsak', {});
  const sok = nezetKerdesAlakja('entitasok', { darab: 1e9 });
  const rendezes = nezetKerdesAlakja('entitasok', { rendezes: 'titok' });
  const szovegRossz = nezetKerdesAlakja('szoveg', { azonosito: '../x' });
  const jo = {
    sorrend: t.startsWith('<!DOCTYPE html><meta http-equiv="Content-Security-Policy"') && cspHely < orHely && orHely < kliensHely
      && kliensHely < kodHely && t.endsWith(kod),
    csp: /default-src 'none'/.test(NEZET_CSP) && !/connect-src|\*|https?:/.test(NEZET_CSP) && /form-action 'none'/.test(NEZET_CSP),
    or: /RTCPeerConnection/.test(NEZET_OR) && /configurable: false/.test(NEZET_OR),
    mezok: kulcsok === 'agazatiPont,azonosito,cim,gondolatTipus,hozzajarulok,javaslat,kategoriak,letrehozva,osszesPont,sajatPont,szerzo,szulo,tipus,vanSzoveg'
      && !('ikon' in n.gondolatTipus) && !('szavazhatok' in n.javaslat) && !('szavazok' in n.javaslat) && !('cim' in n.javaslat.erintettek[0])
      && n.sajatPont === 3 && n.javaslat.tamogatottsagEzrelek === 600,
    ismeretlen: /Ismeretlen kérdés/.test(ismeretlen.hiba ?? ''),
    darab: sok.adat?.darab === NEZET_LAP_DARAB && sok.adat.rendezes === 'hierarchikus' && sok.adat.irany === 'novekvo'
      && /Ismeretlen rendezés/.test(rendezes.hiba ?? '') && /azonosítója/.test(szovegRossz.hiba ?? '')
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, kulcsok }) + ')\n');
  return ok;
});

// ===== ⭐⭐ A PARANCSSOR — valódi folyamatokkal =====

/** A program egy parancsa egy adat-mappával: a kimenet (színek nélkül). */
async function parancs(adat, ervek, env = {}) {
  try {
    const { stdout, stderr } = await futtat(process.execPath, [join(GYOKER, 'koino.js'), ...ervek], {
      env: { ...process.env, KOINO_ADAT: adat, KOINO_NAPLO: '', KOINO_DHT_BELEPOK: 'nincs', KOINO_TUKOR: '127.0.0.1:9', ...env },
      timeout: 120000, maxBuffer: 16 * 1024 * 1024, windowsHide: true, cwd: GYOKER
    });
    return (stdout + stderr).replace(/\x1b\[[0-9;]*m/g, '');
  } catch (h) {
    return (String(h.stdout ?? '') + String(h.stderr ?? '') + h.message).replace(/\x1b\[[0-9;]*m/g, '');
  }
}

/** A koinó eseményei (az adat-mappa minden koinójából). */
async function esemenyek(adat) {
  const ki = [];
  for (const m of await readdir(adat).catch(() => [])) {
    const sorok = await readFile(join(adat, m, 'esemenyek.jsonl'), 'utf8').catch(() => '');
    for (const s of sorok.split('\n').filter(Boolean)) ki.push({ koino: m, e: JSON.parse(s) });
  }
  return ki;
}

const NEZET_HTML = '<!doctype html>\n<title>Próba</title>\n<p>Egy próba-nézet — é, ő, ű</p>\n';

/** Egy friss koinó egy nézettel (a parancssorból). */
async function koinoNezettel(elotag, html = NEZET_HTML) {
  const otthon = await ujMappa(elotag);
  const adat = join(otthon, 'adat');
  const fajl = join(otthon, 'terkep.html');
  await writeFile(fajl, html);
  await parancs(adat, ['koino', 'Nézet-próba']);
  const uj = await parancs(adat, ['nezet', 'uj', fajl, 'A térkép', 'pont=12', 'leiras=Egy próba-nézet']);
  const x = (await esemenyek(adat)).find((y) => y.e.adat?.tipus === 'Nezet') ?? null;
  return { otthon, adat, fajl, uj, e: x?.e ?? null, koino: x?.koino ?? null, kartya: x?.e?.azonosito ?? null };
}

// Rontás: (a) a kártya `Gondolat` típussal születik → bukik; (b) a kód nem a szövegben → a fájl-igény nem kéri → bukik; (c) a `nezet be`
// `igen` nélkül is bekapcsol → bukik; (d) a kikapcsolás nem ír → bukik.
proba('⭐⭐ a PARANCSSOR: `nezet uj` (a kép a típust és a szöveget hordozza, a kód a szöveg törzsében, a fájl-igény a kódot kéri), a lista, a kód, a bekapcsolás csak `igen`-nel (a lenyomathoz kötve), a kikapcsolás', async () => {
  const k = await koinoNezettel('koino-nezet-ps-');
  if (!k.e) { process.stderr.write('    (nincs nézet-kártya: ' + k.uj.slice(-300) + ')\n'); return false; }
  const darab = await readFile(join(k.adat, k.koino, 'fajlok', k.e.adat.szoveg.lenyomat)).catch(() => null);
  const szoveg = darab ? szovegDarabbol(new Uint8Array(darab)) : null;
  const kod = nezetKodja(szoveg);
  const fajlok = await parancs(k.adat, ['fajlok']);
  const lista = await parancs(k.adat, ['nezet']);
  const kodKi = await parancs(k.adat, ['nezet', 'kod', k.kartya.slice(0, 10)]);
  const elonezet = await parancs(k.adat, ['nezet', 'be', k.kartya.slice(0, 10)]);
  const jegyzekElotte = await readFile(join(k.adat, 'nezetek.json'), 'utf8').catch(() => null);
  const be = await parancs(k.adat, ['nezet', 'be', k.kartya.slice(0, 10), 'igen']);
  const jegyzek = JSON.parse(await readFile(join(k.adat, 'nezetek.json'), 'utf8').catch(() => '{}'));
  const listaBe = await parancs(k.adat, ['nezet']);
  const ki = await parancs(k.adat, ['nezet', 'ki', k.kartya.slice(0, 10)]);
  const jegyzekKi = JSON.parse(await readFile(join(k.adat, 'nezetek.json'), 'utf8').catch(() => '{}'));
  const bekapcsolt = Object.values(jegyzek.koinok ?? {})[0]?.nezetek?.[k.kartya];
  const jo = {
    kartya: k.e.adat.tipus === 'Nezet' && k.e.adat.cim === 'A térkép' && k.e.adat.szulo === null && /A nézet feltöltve: „A térkép”/.test(k.uj),
    szoveg: Number.isSafeInteger(k.e.adat.szoveg?.torzs) && k.e.adat.szoveg.torzs === k.e.adat.szoveg.bajt + Buffer.byteLength(NEZET_HTML)
      && k.e.adat.meret > k.e.adat.szoveg.torzs && Array.isArray(szoveg) && szoveg[0]?.tartalom === 'Egy próba-nézet'
      && kod?.nev === 'terkep.html',
    fajlIgeny: /\(2 \/ 2 megvan\)/.test(fajlok),
    lista: /„A térkép” · 12 pont · terkep\.html · kikapcsolva/.test(lista),
    kod: kodKi.includes(NEZET_HTML.trim()) && kodKi.includes(kod?.lenyomat ?? '?'),
    elonezet: /Mit lát: a koinó közös képét/.test(elonezet) && /hamis rajzot/.test(elonezet) && /nezet be .* igen/.test(elonezet)
      && jegyzekElotte === null,
    be: /✓ Bekapcsolva/.test(be) && bekapcsolt?.lenyomat === kod?.lenyomat && /🧩 bekapcsolva/.test(listaBe),
    ki: /kikapcsolva ezen a készüléken/.test(ki) && Object.keys(jegyzekKi.koinok ?? {}).length === 0
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, e: k.e.adat, lista: lista.slice(-300), be: be.slice(-200), elonezet: elonezet.slice(-400) }) + ')\n');
  return ok;
});

// Rontás: (a) a nem UTF-8 fájl is feltöltődik → bukik; (b) a szabad pontnál több is mehet → bukik.
proba('⭐ a PARANCSSOR hibái: a nem UTF-8 fájl és a szabadnál több pont megnevezve — kártya nem születik', async () => {
  const otthon = await ujMappa('koino-nezet-hiba-');
  const adat = join(otthon, 'adat');
  await parancs(adat, ['koino', 'Nézet-próba']);
  await writeFile(join(otthon, 'kep.bin'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe, 0x00]));
  await writeFile(join(otthon, 'jo.html'), '<p>x</p>');
  const binaris = await parancs(adat, ['nezet', 'uj', join(otthon, 'kep.bin'), 'Kép']);
  const sok = await parancs(adat, ['nezet', 'uj', join(otthon, 'jo.html'), 'Sok', 'pont=999999']);
  const nincs = await parancs(adat, ['nezet', 'be', L('Q')]);
  const kartyak = (await esemenyek(adat)).filter((x) => x.e.adat?.tipus === 'Nezet');
  const jo = {
    binaris: /nem UTF-8/.test(binaris),
    sok: /csak \d+ szabad/.test(sok),
    nincs: /Nincs ilyen/.test(nincs),
    nemSzuletett: kartyak.length === 0
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, binaris: binaris.slice(-200), sok: sok.slice(-200) }) + ')\n');
  return ok;
});

// ===== ⭐⭐ A LAP ÚTJAI — a valódi felület =====

/** A felület egy porton (a kulcsot a kiírt címből olvassuk) és egy hívó. */
async function felulete(adat, port) {
  const folyamat = spawn(process.execPath, [join(GYOKER, 'koino.js'), 'felulet', String(port)], {
    env: { ...process.env, KOINO_ADAT: adat, KOINO_NAPLO: '', KOINO_DHT_BELEPOK: 'nincs', KOINO_TUKOR: '127.0.0.1:9', KOINO_BONGESZO: 'nem' },
    stdio: ['ignore', 'pipe', 'pipe'], cwd: GYOKER, windowsHide: true
  });
  let kimenet = '';
  const kulcs = await new Promise((kesz, baj) => {
    const ido = setTimeout(() => baj(new Error('a felület nem indult el: ' + kimenet.slice(-300))), 30000);
    folyamat.stdout.on('data', (d) => {
      kimenet += d;
      const t = kimenet.match(/kulcs=([A-Za-z0-9_-]+)/);
      if (t) { clearTimeout(ido); kesz(t[1]); }
    });
  });
  const hiv = async (ut, b = {}) => {
    const v = await fetch('http://127.0.0.1:' + port + ut, { ...b, headers: { 'Content-Type': 'application/json', 'X-Koino-Kulcs': kulcs } });
    return { allapot: v.status, adat: await v.json().catch(() => null), fejlec: v.headers };
  };
  return { folyamat, hiv, kulcs, port };
}

// Rontás: (a) a keret kikapcsolva is jön → bukik; (b) a rossz lenyomattal is bekapcsol → bukik; (c) a kérdés kikapcsolva is felel → bukik;
// (d) a `valtozott` állásnál a keret jön → bukik; (e) a kapu CSP-je elmarad → bukik.
proba('⭐⭐ a LAP útjai: feltöltés, lista, a kártya a kimondással; a keret és a kérdés csak bekapcsolva (a rossz lenyomat, a kikapcsolt és a `valtozott` megnevezve); a válaszok; a lap CSP-je', async () => {
  const otthon = await ujMappa('koino-nezet-lap-');
  const adat = join(otthon, 'adat');
  await parancs(adat, ['koino', 'Nézet-lap-próba']);
  await parancs(adat, ['gondolat', 'Egy gondolat', 'a gondolat szövege']);
  const f = await felulete(adat, 8091);
  try {
    const html = '<!doctype html><p>A lapról feltöltött nézet</p>';
    const fel = await f.hiv('/api/nezet', { method: 'POST', body: JSON.stringify({ cim: 'Lapról', leiras: 'próba', pont: 7, nev: 'lap.html',
      adat: Buffer.from(html).toString('base64') }) });
    const kartya = fel.adat?.kartya;
    const lista = await f.hiv('/api/nezetek');
    const egy = await f.hiv('/api/nezet?kartya=' + kartya);
    const keretKi = await f.hiv('/api/nezet/keret?kartya=' + kartya);
    const kerdesKi = await f.hiv('/api/nezet/kerdes', { method: 'POST', body: JSON.stringify({ kartya, kerdes: 'koino' }) });
    const rossz = await f.hiv('/api/nezet/be', { method: 'POST', body: JSON.stringify({ kartya, lenyomat: L('Z') }) });
    const be = await f.hiv('/api/nezet/be', { method: 'POST', body: JSON.stringify({ kartya, lenyomat: fel.adat?.kod?.lenyomat }) });
    const keret = await f.hiv('/api/nezet/keret?kartya=' + kartya);
    const kerdez = (kerdes, a = null) => f.hiv('/api/nezet/kerdes', { method: 'POST', body: JSON.stringify({ kartya, kerdes, adat: a }) });
    const koino = await kerdez('koino');
    const en = await kerdez('en');
    const ent = await kerdez('entitasok', { darab: 50 });
    const gondolat = (ent.adat?.valasz?.entitasok ?? []).find((e) => e.cim === 'Egy gondolat');
    const szoveg = gondolat ? await kerdez('szoveg', { azonosito: gondolat.azonosito }) : null;
    const tilos = await kerdez('tarsak');
    const idegen = await f.hiv('/api/nezet/keret?kartya=' + L('Q'));
    const lap = await fetch('http://127.0.0.1:' + f.port + '/');
    const en2 = await f.hiv('/api/en');
    // a `valtozott`: a jegyzékben más lenyomat áll (mintha egy egyezmény új kódot hozott volna)
    const j = JSON.parse(await readFile(join(adat, 'nezetek.json'), 'utf8'));
    const koinoNev = Object.keys(j.koinok)[0];
    j.koinok[koinoNev].nezetek[kartya].lenyomat = L('M');
    await writeFile(join(adat, 'nezetek.json'), JSON.stringify(j));
    const valtozott = await f.hiv('/api/nezet?kartya=' + kartya);
    const keretValtozott = await f.hiv('/api/nezet/keret?kartya=' + kartya);
    await f.hiv('/api/nezet/be', { method: 'POST', body: JSON.stringify({ kartya, lenyomat: fel.adat?.kod?.lenyomat }) });
    const ki = await f.hiv('/api/nezet/ki', { method: 'POST', body: JSON.stringify({ kartya }) });
    const keretUtana = await f.hiv('/api/nezet/keret?kartya=' + kartya);
    const jo = {
      feltoltes: fel.allapot === 200 && fel.adat?.kod?.nev === 'lap.html' && fel.adat?.pont === 7,
      lista: lista.allapot === 200 && lista.adat?.kartyak?.length === 1 && lista.adat.kartyak[0].allas === 'ki' && lista.adat.felulet === 1,
      kartya: egy.allapot === 200 && egy.adat?.megvan === true && /közös képét/.test(egy.adat?.kimondas?.latja ?? '')
        && /hamis rajzot/.test(egy.adat?.kimondas?.hamisRajz ?? ''),
      kikapcsolva: keretKi.allapot === 403 && keretKi.adat?.kod === 'KI' && kerdesKi.allapot === 403,
      rossz: rossz.allapot === 400 && rossz.adat?.kod === 'VALTOZOTT',
      keret: be.allapot === 200 && keret.allapot === 200 && keret.adat?.srcdoc?.startsWith('<!DOCTYPE html><meta http-equiv="Content-Security-Policy"')
        && keret.adat.srcdoc.endsWith(html) && !keret.adat.srcdoc.includes(f.kulcs),
      valaszok: koino.adat?.valasz?.nev === 'Nézet-lap-próba' && koino.adat.valasz.felulet === 1 && koino.adat.valasz.nezet?.kartya === kartya
        && en.adat?.valasz?.kulcs === en2.adat?.azonosito && !!gondolat && gondolat.sajatPont > 0
        && (ent.adat?.valasz?.entitasok ?? []).some((e) => e.tipus === 'Nezet' && e.azonosito === kartya)
        && szoveg?.adat?.valasz?.szoveg === 'a gondolat szövege',
      tilos: tilos.allapot === 400 && /Ismeretlen kérdés/.test(tilos.adat?.hiba ?? ''),
      idegen: idegen.allapot === 404,
      csp: lap.headers.get('content-security-policy') === "frame-src 'none'",
      valtozott: valtozott.adat?.allas === 'valtozott' && keretValtozott.allapot === 403 && keretValtozott.adat?.kod === 'VALTOZOTT',
      ki: ki.allapot === 200 && keretUtana.allapot === 403
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, fel: fel.adat, keret: keret.adat?.hiba, koino: koino.adat, ent: ent.adat?.hiba }) + ')\n');
    return ok;
  } finally {
    f.folyamat.kill();
    await varj(500);
  }
});

// ===================================
// ⭐⭐ AZ ELSZIGETELÉS A VALÓDI LAPON — fej nélküli Chrome-mal (a 92. mérés (b) részéből)
// ===================================

/** A telepített Chrome (vagy Edge, Chromium) — vagy null (a próba kimarad). `KOINO_CHROME` felülírja. */
function chromeHelye() {
  const jeloltek = [process.env.KOINO_CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  return jeloltek.find((j) => j && existsSync(j)) ?? null;
}

/** Egy CDP-kapcsolat (Chrome DevTools Protocol — a Node beépített WebSocketjével, csomag nélkül). */
async function cdpKapcsolat(cim) {
  const ws = new WebSocket(cim);
  await new Promise((kesz, baj) => { ws.onopen = kesz; ws.onerror = () => baj(new Error('a CDP nem kapcsolódott')); });
  let szam = 0;
  const varok = new Map();
  const esemenyek = [];
  ws.onmessage = (m) => {
    const u = JSON.parse(m.data);
    if (u.id && varok.has(u.id)) {
      const [kesz, baj] = varok.get(u.id);
      varok.delete(u.id);
      if (u.error) baj(new Error(u.error.message)); else kesz(u.result);
    } else if (u.method) esemenyek.push(u);
  };
  const kuld = (method, params = {}, sessionId = undefined) => new Promise((kesz, baj) => {
    const id = ++szam;
    varok.set(id, [kesz, baj]);
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  return { kuld, esemenyek, zar: () => ws.close() };
}

/**
 * Egy kifejezés kiértékelése — a lapban, vagy a nézet keretében (`hol`: `{ sessionId }`, ha a keret külön folyamatban fut — a Chrome a
 * sandbox-keretet elszigeteli —, vagy `{ contextId }`, ha a lap folyamatában). A visszaadott érték.
 */
async function ertekel(cdp, kifejezes, hol = null) {
  const v = await cdp.kuld('Runtime.evaluate', { expression: kifejezes, awaitPromise: true, returnByValue: true,
    ...(hol?.contextId ? { contextId: hol.contextId } : {}) }, hol?.sessionId);
  if (v.exceptionDetails) throw new Error(v.exceptionDetails.exception?.description ?? v.exceptionDetails.text);
  return v.result?.value;
}

/**
 * A nézet keretének helye a CDP-ben (a lap egyetlen gyermek-kerete) — vár rá. Ha a Chrome külön folyamatba tette (a sandbox-keret
 * elszigetelése), a csatolt munkamenete (`{ sessionId }`); különben a végrehajtási környezete a lapban (`{ contextId }`).
 * @param {number} elozo - ennyi csatolás volt a megnyitás előtt (az újat keressük)
 */
async function nezetKornyezete(cdp, elozo, ms = 15000) {
  const hatar = Date.now() + ms;
  while (Date.now() < hatar) {
    const csatolt = cdp.esemenyek.filter((e) => e.method === 'Target.attachedToTarget' && e.params.targetInfo?.type === 'iframe');
    if (csatolt.length > elozo) return { sessionId: csatolt[csatolt.length - 1].params.sessionId };
    const fa = await cdp.kuld('Page.getFrameTree');
    const gyermek = fa.frameTree.childFrames?.[0]?.frame?.id ?? null;
    if (gyermek) {
      const k = [...cdp.esemenyek].reverse().find((e) => e.method === 'Runtime.executionContextCreated'
        && e.params.context.auxData?.frameId === gyermek && e.params.context.auxData?.isDefault);
      if (k) return { contextId: k.params.context.id };
    }
    await varj(200);
  }
  return null;
}

/** Eddig hány keret-munkamenet csatolódott (a következő megnyitás újat hoz). */
const csatolasok = (cdp) => cdp.esemenyek.filter((e) => e.method === 'Target.attachedToTarget' && e.params.targetInfo?.type === 'iframe').length;

/** Egy helyi IPv4 a LAN-on (a WebRTC kontrollja ide küld — a hurok-címre a böngésző nem gyűjt jelöltet), vagy null. */
function lanCim() {
  for (const lista of Object.values(networkInterfaces())) {
    for (const c of lista ?? []) if (c.family === 'IPv4' && !c.internal) return c.address;
  }
  return null;
}

/**
 * ⭐ A „rosszindulatú” nézet (a valódi nézet kódja — a kártya szövegében): a kérdései, és a nem navigáló kijutási utak. Az eredmény a
 * saját ablakában (`EREDMENY`) — a próba a CDP-vel olvassa ki a keretéből. `__K__` a külvilág címe, `__WS__` a WebSocketé, `__UDP__` a
 * STUN/TURN célja.
 */
const ROSSZ_NEZET = String.raw`<!doctype html><html><head><title>Rossz nézet</title></head><body><p id="all">fut…</p><script>
var E = window.EREDMENY = { probak: {}, valaszok: {}, hibak: {} };
var K = '__K__';
function jel(nev, ertek) { E.probak[nev] = String(ertek); }
function proba(nev, fv) { try { fv(); } catch (e) { jel(nev, 'kivétel: ' + e.name); } }
proba('szulo-cime', function () { jel('szulo-cime', parent.location.href); });
proba('szulo-dom', function () { jel('szulo-dom', parent.document.title); });
proba('tar', function () { localStorage.setItem('x', '1'); jel('tar', 'írható'); });
proba('suti', function () { jel('suti', document.cookie || '(üres)'); });
jel('eredet', location.origin);
proba('kapu-fetch', function () { fetch('/api/en').then(function (r) { jel('kapu-fetch', 'állapot ' + r.status); }).catch(function (e) { jel('kapu-fetch', 'elakadt ' + e.name); }); });
proba('kulso-fetch', function () { fetch(K + 'fetch', { mode: 'no-cors' }).then(function () { jel('kulso-fetch', 'elment'); }).catch(function (e) { jel('kulso-fetch', 'elakadt ' + e.name); }); });
proba('kulso-kep', function () { var i = new Image(); i.onload = function () { jel('kulso-kep', 'betöltött'); }; i.onerror = function () { jel('kulso-kep', 'onerror'); }; i.src = K + 'kep'; });
proba('kulso-beacon', function () { jel('kulso-beacon', navigator.sendBeacon(K + 'beacon', 'x') ? 'sorba téve' : 'false'); });
proba('kulso-websocket', function () { var w = new WebSocket('__WS__'); w.onerror = function () { jel('kulso-websocket', 'onerror'); }; w.onopen = function () { jel('kulso-websocket', 'NYITVA'); }; });
proba('kulso-stilus', function () { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = K + 'stilus'; document.head.appendChild(l); document.body.style.backgroundImage = 'url(' + K + 'hatter)'; jel('kulso-stilus', 'beillesztve'); });
proba('kulso-elotoltes', function () { var l = document.createElement('link'); l.rel = 'prefetch'; l.href = K + 'prefetch'; document.head.appendChild(l); jel('kulso-elotoltes', 'beillesztve'); });
proba('kulso-szkript', function () { var s = document.createElement('script'); s.onerror = function () { jel('kulso-szkript', 'onerror'); }; s.src = K + 'szkript'; document.head.appendChild(s); });
proba('munkas', function () { var w = new Worker(URL.createObjectURL(new Blob(["fetch('" + K + "munkas', { mode: 'no-cors' })"], { type: 'text/javascript' }))); w.onerror = function () { jel('munkas', 'onerror'); }; jel('munkas', 'létrejött'); });
proba('kulso-keret', function () { var f = document.createElement('iframe'); f.src = K + 'keret'; document.body.appendChild(f); jel('kulso-keret', 'beillesztve'); });
proba('felugro', function () { var w = window.open(K + 'felugro'); jel('felugro', w ? 'megnyílt' : 'null'); });
proba('urlap', function () { var f = document.createElement('form'); f.action = K + 'urlap'; f.method = 'GET'; document.body.appendChild(f); f.submit(); jel('urlap', 'elküldve?'); });
proba('webrtc', function () { var R = window.RTCPeerConnection || window.webkitRTCPeerConnection; jel('webrtc', typeof R); if (R) { var pc = new R({ iceServers: [{ urls: 'stun:__UDP__' }] }); pc.createDataChannel('x'); pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }); } });
proba('webrtc-friss-keret', function () { var f = document.createElement('iframe'); document.body.appendChild(f); var R = f.contentWindow && f.contentWindow.RTCPeerConnection; jel('webrtc-friss-keret', typeof R); if (R) { var pc = new R({ iceServers: [{ urls: 'stun:__UDP__' }] }); pc.createDataChannel('x'); pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }); } });
// ⭐ a blob: kép (a CSP ezt engedi — a fajl válaszából így rajzol egy nézet)
proba('blob-kep', function () { var png = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='); var b = new Uint8Array(png.length); for (var x = 0; x < png.length; x++) b[x] = png.charCodeAt(x); var i = new Image(); i.onload = function () { jel('blob-kep', 'betöltött'); }; i.onerror = function () { jel('blob-kep', 'onerror'); }; i.src = URL.createObjectURL(new Blob([b], { type: 'image/png' })); });
proba('data-kep', function () { var png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; var i = new Image(); i.onload = function () { jel('data-kep', 'betöltött'); }; i.onerror = function () { jel('data-kep', 'onerror'); }; i.src = 'data:image/png;base64,' + png; });
proba('filereader-kep', function () { var png = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='); var b = new Uint8Array(png.length); for (var x = 0; x < png.length; x++) b[x] = png.charCodeAt(x); var r = new FileReader(); r.onload = function () { var i = new Image(); i.onload = function () { jel('filereader-kep', 'betöltött'); }; i.onerror = function () { jel('filereader-kep', 'onerror'); }; i.src = r.result; }; r.onerror = function () { jel('filereader-kep', 'olvasási hiba'); }; r.readAsDataURL(new Blob([b], { type: 'image/png' })); });
// ⭐ a kérdések (a nézet-felület 1)
var kn = window.koinoNezet;
jel('kliens', kn && kn.valtozat);
function kerd(nev, kerdes, adat) { return kn.kerdez(kerdes, adat).then(function (v) { E.valaszok[nev] = v; return v; }, function (h) { E.hibak[nev] = h.message; }); }
Promise.all([kerd('koino', 'koino'), kerd('en', 'en'), kerd('entitasok', 'entitasok', { darab: 20 }), kerd('tilos', 'tarsak')]).then(function () {
  var g = (E.valaszok.entitasok && E.valaszok.entitasok.entitasok || []).filter(function (e) { return e.tipus === 'Gondolat'; })[0];
  var sajat = E.valaszok.koino && E.valaszok.koino.nezet && E.valaszok.koino.nezet.kartya;
  return Promise.all([g ? kerd('szoveg', 'szoveg', { azonosito: g.azonosito }) : null, sajat ? kerd('sajatSzoveg', 'szoveg', { azonosito: sajat }) : null]);
}).then(function () {
  var s = E.valaszok.sajatSzoveg && E.valaszok.sajatSzoveg.szoveg;
  var f = Array.isArray(s) ? s.filter(function (b) { return b.tipus === 'fajl'; })[0] : null;
  return f ? kn.kerdez('fajl', { lenyomat: f.url.split('/').pop() }).then(function (v) { E.valaszok.fajl = { meret: v.meret, eleje: new TextDecoder().decode(new Uint8Array(v.bajtok)).slice(0, 15) }; }, function (h) { E.hibak.fajl = h.message; }) : null;
}).then(function () { setTimeout(function () { E.kesz = true; document.getElementById('all').textContent = 'kész'; }, 2500); });
</script></body></html>`;

/**
 * A navigáló utak és a CSP feloldása (mindegyik egy friss nézetben fut — a navigáló keret elhagyja a nézetet; a második, `default-src *`
 * CSP pedig a `data:` és a `blob:` képet is tiltaná utána — a böngésző a kettőt metszi).
 */
const NAVIGALOK = [
  ['csp-feloldas', "var m = document.createElement('meta'); m.httpEquiv = 'Content-Security-Policy'; m.content = 'default-src *'; document.head.appendChild(m);"
    + " var i = new Image(); i.src = K + 'feloldva'; 'beillesztve'"],
  ['lap-elnavigalasa', "try { top.location.href = K + 'top'; 'nem dobott' } catch (e) { e.name }"],
  ['onnavigacio', "location.href = K + 'nav'; 'indul'"],
  ['meta-frissites', "var m = document.createElement('meta'); m.httpEquiv = 'refresh'; m.content = '0;url=' + K + 'frissites'; document.head.appendChild(m); 'beillesztve'"],
  ['data-dokumentum', "location.href = 'data:text/html,' + encodeURIComponent('<img src=\"' + K + 'data\">'); 'indul'"],
  ['blob-dokumentum', "location.href = URL.createObjectURL(new Blob(['<img src=\"' + K + 'blob\">'], { type: 'text/html' })); 'indul'"],
  ['document-write', "document.open(); document.write('<img src=\"' + K + 'irt\">'); document.close(); 'írva'"]
];

// Rontás: (a) a keret `allow-same-origin`-t is kap → a lap címe olvasható, a tár írható → bukik; (b) az őr elmarad a keret tartalmából →
// a WebRTC kimegy (ha van LAN) / a konstruktor él → bukik; (c) a kapu CSP-je elmarad → az önnavigáció kijut → bukik; (d) a nézet CSP-je
// elmarad → a fetch, a kép… kijut → bukik; (e) a lap a kérdést nem a saját keretének válaszolja → nincs válasz → bukik.
proba('⭐⭐ az ELSZIGETELÉS a valódi lapon (fej nélküli Chrome, kontrollal): a nézetből semmi nem jut ki (a kontroll a lapról kijut), a lap kulcsa nem jut el hozzá — és a kérdéseire jó választ kap', async () => {
  const chrome = chromeHelye();
  if (!chrome) { process.stdout.write('    (nincs Chrome a gépen — a böngészős elszigetelés próbája kihagyva; KOINO_CHROME=<út>)\n'); return true; }
  if (typeof WebSocket !== 'function') { process.stdout.write('    (a Node-ban nincs WebSocket — a böngészős próba kihagyva)\n'); return true; }
  // ----- a külvilág: egy HTTP-kiszolgáló (minden kérését naplózza) és két UDP-kapu (a nézeté és a kontrollé) -----
  const naplo = [];
  const kulso = createServer((k, v) => { naplo.push(k.url); v.writeHead(200, { 'content-type': 'text/plain' }); v.end('x'); });
  kulso.on('upgrade', (k, s) => { naplo.push('WS ' + k.url); s.destroy(); });
  await new Promise((kesz) => kulso.listen(0, '127.0.0.1', kesz));
  const K = 'http://127.0.0.1:' + kulso.address().port + '/';
  const udpNaplo = { nezet: 0, kontroll: 0 };
  const udp = createSocket('udp4');
  const udpK = createSocket('udp4');
  udp.on('message', () => { udpNaplo.nezet++; });
  udpK.on('message', () => { udpNaplo.kontroll++; });
  await new Promise((kesz) => udp.bind(0, '0.0.0.0', kesz));
  await new Promise((kesz) => udpK.bind(0, '0.0.0.0', kesz));
  const lan = lanCim();
  // ----- a koinó a rossz nézettel, bekapcsolva -----
  const otthon = await ujMappa('koino-nezet-chrome-');
  const adat = join(otthon, 'adat');
  await parancs(adat, ['koino', 'Elszigetelés-próba']);
  await parancs(adat, ['gondolat', 'Egy gondolat', 'a gondolat szövege']);
  const kod = ROSSZ_NEZET.replace(/__K__/g, K).replace('__WS__', 'ws://127.0.0.1:' + kulso.address().port + '/ws')
    .replace(/__UDP__/g, (lan ?? '127.0.0.1') + ':' + udp.address().port);
  await writeFile(join(otthon, 'rossz.html'), kod);
  await parancs(adat, ['nezet', 'uj', join(otthon, 'rossz.html'), 'Rossz nézet', 'pont=10']);
  const kartya = (await esemenyek(adat)).find((x) => x.e.adat?.tipus === 'Nezet')?.e?.azonosito;
  await parancs(adat, ['nezet', 'be', kartya, 'igen']);
  const f = await felulete(adat, 8094);
  const profil = await ujMappa('koino-nezet-profil-');
  const b = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
    '--remote-allow-origins=*', '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let cdp = null;
  try {
    // a DevTools portja a profil `DevToolsActivePort` fájljában
    let port = null;
    for (let i = 0; i < 100 && !port; i++) {
      await varj(200);
      port = (await readFile(join(profil, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0].trim() || null;
    }
    if (!port) throw new Error('a Chrome nem nyitott DevTools-portot');
    const lapok = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    cdp = await cdpKapcsolat(lapok.find((l) => l.type === 'page').webSocketDebuggerUrl);
    await cdp.kuld('Page.enable');
    await cdp.kuld('Runtime.enable');
    // ⚠️ a Chrome a sandbox-keretet külön folyamatba teheti — a keretek munkamenetei így csatolódnak (és futnak tovább)
    await cdp.kuld('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
    await cdp.kuld('Page.navigate', { url: 'http://127.0.0.1:' + f.port + '/?kulcs=' + f.kulcs });
    for (let i = 0; i < 100 && !cdp.esemenyek.some((e) => e.method === 'Page.loadEventFired'); i++) await varj(200);
    await varj(3000);
    // ----- ⛔ A KONTROLL: a lapról a külvilágba (és ha van LAN, a WebRTC UDP-je) -----
    await ertekel(cdp, "fetch('" + K + "kontroll-fetch', { mode: 'no-cors' }).then(() => 'elment', (e) => 'elakadt ' + e.name)");
    await ertekel(cdp, "new Promise((kesz) => { const i = new Image(); i.onload = i.onerror = () => kesz(1); i.src = '" + K + "kontroll-kep'; })");
    if (lan) {
      await ertekel(cdp, "(() => { const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:" + lan + ':' + udpK.address().port + "' }] });"
        + " pc.createDataChannel('x'); return pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => 'kész'); })()");
    }
    // ----- a nézet megnyitása a valódi úton (a lap modulja) -----
    const elotte = csatolasok(cdp);
    await ertekel(cdp, "import('./js/koinoNezetKeret.js').then((m) => m.nezetFuttatasa({ kartya: '" + kartya + "' })).then(() => 'fut')");
    const ctx = await nezetKornyezete(cdp, elotte);
    let E = null;
    for (let i = 0; i < 60 && ctx; i++) {
      await varj(250);
      E = await ertekel(cdp, 'window.EREDMENY && window.EREDMENY.kesz ? JSON.stringify(window.EREDMENY) : null', ctx).catch(() => null);
      if (E) break;
    }
    E = E ? JSON.parse(E) : null;
    const srcdocKulcs = await ertekel(cdp, "document.querySelector('.koino-nezet-futas__keret').srcdoc.includes('" + f.kulcs + "')");
    // a nézet saját dokumentumában és címében sincs ott (a keretében kiértékelve)
    const nezetbenKulcs = ctx ? await ertekel(cdp, "(document.documentElement.outerHTML + location.href + document.referrer).includes('" + f.kulcs + "')", ctx) : null;
    const sandbox = await ertekel(cdp, "document.querySelector('.koino-nezet-futas__keret').getAttribute('sandbox')");
    // ----- a navigáló utak: mindegyik egy friss nézetben (a próba a nézet keretében futtatja — ugyanazok a korlátok) -----
    const nav = {};
    for (const [nev, kifejezes] of NAVIGALOK) {
      const n0 = csatolasok(cdp);
      await ertekel(cdp, "import('./js/koinoNezetKeret.js').then((m) => m.nezetFuttatasa({ kartya: '" + kartya + "' })).then(() => 'fut')");
      await varj(1500);
      const c = await nezetKornyezete(cdp, n0);
      nav[nev] = c ? await ertekel(cdp, 'var K = "' + K + '"; ' + kifejezes, c).catch((h) => 'kivétel: ' + h.message.slice(0, 60)) : 'nincs keret';
      await varj(1500);
    }
    await varj(2000);
    // ----- az ítélet -----
    const kifele = naplo.filter((u) => !/^\/kontroll-/.test(u));
    const p = E?.probak ?? {};
    const gondolat = (E?.valaszok?.entitasok?.entitasok ?? []).find((e) => e.cim === 'Egy gondolat');
    const en = await f.hiv('/api/en');
    const jo = {
      kontroll: naplo.includes('/kontroll-fetch') && naplo.includes('/kontroll-kep') && (!lan || udpNaplo.kontroll > 0),
      lefutott: !!E && E.kesz === true,
      semmiKifele: kifele.length === 0 && udpNaplo.nezet === 0,
      szulo: /SecurityError/.test(p['szulo-cime'] ?? '') && /SecurityError/.test(p['szulo-dom'] ?? '') && /SecurityError/.test(p.tar ?? '')
        && p.eredet === 'null',
      kulcs: nezetbenKulcs === false && srcdocKulcs === false && sandbox === 'allow-scripts',
      webrtc: p.webrtc === 'undefined' && p['webrtc-friss-keret'] !== 'function',
      kapu: !/állapot 200/.test(p['kapu-fetch'] ?? ''),
      kepek: p['blob-kep'] === 'betöltött' && p['data-kep'] === 'betöltött' && p['filereader-kep'] === 'betöltött',
      valaszok: p.kliens === '1' && E?.valaszok?.koino?.nev === 'Elszigetelés-próba' && E?.valaszok?.en?.kulcs === en.adat?.azonosito
        && !!gondolat && E?.valaszok?.szoveg?.szoveg === 'a gondolat szövege' && /Ismeretlen kérdés/.test(E?.hibak?.tilos ?? '')
        && E?.valaszok?.fajl?.meret === Buffer.byteLength(kod) && E.valaszok.fajl.eleje === '<!doctype html>'
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, naplo, udpNaplo, lan, probak: p, hibak: E?.hibak, nav }) + ')\n');
    return ok;
  } finally {
    cdp?.zar();
    b.kill();
    f.folyamat.kill();
    kulso.close();
    udp.close();
    udpK.close();
    await varj(800);
  }
});

export default async function (csendes) {
  const eredmeny = await futtatas(csendes);
  for (const m of mappak) await rm(m, { recursive: true, force: true }).catch(() => {});
  return eredmeny;
}
