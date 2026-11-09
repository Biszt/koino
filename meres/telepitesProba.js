// meres/telepitesProba.js

// Felelősség: ⭐⭐ A TELEPÍTÉS A KÁRTYÁRÓL PRÓBÁJA (D125 — a D123 PR5-je; `js/tar/programTelepites.js`, `windows/csere.ps1`,
// `termux/csere.sh`, a `telepit` parancs):
//   · a KIÍRÁS: csak a teljes, ellenőrzött kóddal (egy hiányzó vagy hamis fájl semmit nem ír), a tiltott út megnevezve, és a kiírt mappa
//     a kártya kódját nevezi meg (ha nem, törlődik);
//   · a CSERE HELYE: a `-uj` és a `-regi` a program mellett; Windowson a git-tárat nem cseréljük, a telefonon a `.git` az új programmal megy;
//   · az előnézet RÉTEGEI (a mag, a felület, a többi);
//   · ⭐⭐ az ÉLES ÚT két programmal egy készüléken (valódi folyamatok): B (más felülettel) feltölt egy koino-verzió kártyát, A a `telepit`
//     paranccsal előnézi (más a kód, ugyanaz a mag, a felület változott), kiírja (a kiírt mappa a kártya kódját nevezi meg), és ⭐ Windowson
//     a valódi csere: A helyén B kódja fut (a felület felel), az előző a `-regi`-ben; a `telepit vissza` visszaállít; és egy nem induló
//     program (TK5) után a régi kerül vissza, kimondva;
//   · a telefon cseréje (`termux/csere.sh`) — ahol van `sh` (Windowson a Git Bash-sel): a mappák, a `.git` átvitele, az indítás és a
//     visszafordítás.
//
// Használja: meres/mind.js (`telepites` — a `parancssor` csoportban).

import { mkdtemp, mkdir, writeFile, readFile, rm, stat, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { connect } from 'node:net';

import { kodKiirasa, telepitesHelye, valtozasRetegei, kiirhatoUt } from '../js/tar/programTelepites.js';
import { kodCsomagKeszitese } from '../js/tar/kodCsomag.js';
import { probaGyujtemeny } from './probaFuttato.js';

const { proba, futtatas } = probaGyujtemeny('A telepítés a kártyáról (D125 — PR5)');

const futtat = promisify(execFile);
const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const mappak = [];
const varj = (ms) => new Promise((kesz) => setTimeout(kesz, ms));
const WINDOWS = process.platform === 'win32';

async function ujMappa(elotag) {
  const m = await mkdtemp(join(tmpdir(), elotag));
  mappak.push(m);
  return m;
}

/** Egy memóriabeli fájl-tár a kód-csomag tartalmaiból (a lenyomat → a bájtok). */
const memoriaOlvaso = (tartalmak) => async (l) => tartalmak.get(l) ?? null;

// ===== ⭐ A KIÍRÁS =====

// Rontás: (a) a kiírás a hiányzó fájlt átlépi → félkész mappa → bukik; (b) a lenyomatot nem nézi → a hamis fájl kiíródik → bukik; (c) a
// vizsga elmarad → a más kódot nevező mappa megmarad → bukik; (d) a tiltott út kiíródik → bukik.
proba('⭐ a KIÍRÁS: a teljes, ellenőrzött kód a kártya kódját nevező mappát adja; a hiányzó vagy a hamis fájl SEMMIT nem ír; a tiltott út és a más kódot nevező mappa megnevezve', async () => {
  const forras = await ujMappa('koino-tel-forras-');
  await mkdir(join(forras, 'js'), { recursive: true });
  await mkdir(join(forras, 'termux'), { recursive: true });
  await writeFile(join(forras, 'koino.js'), 'console.log(1)\r\n');
  await writeFile(join(forras, 'js', 'a.js'), 'export const a = 1;\n');
  await writeFile(join(forras, 'termux', 'indit.sh'), 'echo\n');
  const cs = await kodCsomagKeszitese(forras);
  const olvas = memoriaOlvaso(cs.tartalmak);
  const nev = async (fn) => { try { await fn(); return null; } catch (h) { return h.kod ?? h.message; } };
  const van = (ut) => stat(ut).then(() => true, () => false);
  const hova = join(await ujMappa('koino-tel-hova-'), 'koino-uj');
  const k = await kodKiirasa(cs.hivatkozas, cs.jegyzek, olvas, hova);
  const ujra = await kodCsomagKeszitese(hova);
  // a hiányzó: egy fájl nincs a tárban
  const hova2 = join(dirname(hova), 'hianyos');
  const hianyzo = await nev(() => kodKiirasa(cs.hivatkozas, cs.jegyzek, async (l) => (l === cs.jegyzek.fajlok[1][1] ? null : olvas(l)), hova2));
  // a hamis: egy fájl más bájtokkal
  const hova3 = join(dirname(hova), 'hamis');
  const hamis = await nev(() => kodKiirasa(cs.hivatkozas, cs.jegyzek,
    async (l) => (l === cs.jegyzek.fajlok[0][1] ? new TextEncoder().encode('mas') : olvas(l)), hova3));
  // a tiltott út, és a más kódot nevező mappa (egy fájl, amit a bejárás nem lát — a kiírt mappa neve más lenne)
  const tiltott = await nev(() => kodKiirasa(cs.hivatkozas, { fajlok: [['a/CON.js', cs.jegyzek.fajlok[0][1], 1]] }, olvas,
    join(dirname(hova), 'tiltott')));
  const binJegyzek = { fajta: cs.jegyzek.fajta, fajlok: [...cs.jegyzek.fajlok, ['x.bin', cs.jegyzek.fajlok[0][1], cs.jegyzek.fajlok[0][2]]]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1)) };
  const hova4 = join(dirname(hova), 'masnev');
  const masNev = await nev(() => kodKiirasa({ lenyomat: 'X'.repeat(43), bajt: 1 }, binJegyzek, olvas, hova4));
  const jo = {
    kiirva: k.fajl === 3 && ujra.hivatkozas.lenyomat === cs.hivatkozas.lenyomat && (await readFile(join(hova, 'koino.js'), 'utf8')) === 'console.log(1)\n',
    hianyzo: hianyzo === 'HIANYZO-FAJL' && !(await van(hova2)),
    hamis: hamis === 'ROSSZ-FAJL' && !(await van(hova3)),
    tiltott: tiltott === 'TILTOTT-UT' && !kiirhatoUt('a/b:c.js') && !kiirhatoUt('a/x.') && kiirhatoUt('felulet/js/a.b-c.js'),
    masNev: masNev === 'KIIRT-MAS' && !(await van(hova4))
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, hianyzo, hamis, tiltott, masNev }) + ')\n');
  return ok;
});

// Rontás: (a) Windowson a git-tár is cserélhető → bukik; (b) a telefonon a `.git` nem megy az új programmal → bukik; (c) más rendszeren
// „lehet” → bukik.
proba('⭐ a CSERE HELYE: a `-uj` és a `-regi` a program mellett; Windowson a git-tárat nem cseréljük, a telefonon a `.git` az új programmal megy; más rendszeren nincs csere (kimondva)', async () => {
  const m = join(tmpdir(), 'valahol', 'koino');
  const w = await telepitesHelye(m, { platform: 'win32', termux: false, gitVan: false });
  const wGit = await telepitesHelye(m, { platform: 'win32', termux: false, gitVan: true });
  const t = await telepitesHelye(m, { platform: 'android', termux: true, gitVan: true });
  const l = await telepitesHelye(m, { platform: 'linux', termux: false, gitVan: false });
  const jo = {
    windows: w.lehet && w.platform === 'windows' && w.uj === m + '-uj' && w.regi === m + '-regi' && !w.gitVele,
    windowsGit: !wGit.lehet && /git-tár/.test(wGit.ok ?? ''),
    termux: t.lehet && t.platform === 'termux' && t.gitVele,
    mas: !l.lehet && /nincs megépítve/.test(l.ok ?? '')
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, w, wGit, t, l }) + ')\n');
  return ok;
});

// Rontás: a felület fájlja a „többi” közé kerül → bukik; a mag fájlja nem a magba → bukik.
proba('⭐ az ELŐNÉZET rétegei: a mag fájljai (bármelyik mag-jegyzékből), a felület (`felulet/`), a többi — az új, az eltűnt és a más fájl; a változatlan csak megszámolva', () => {
  const L = (c) => c.repeat(43);
  const kartya = { fajlok: [['felulet/a.js', L('A'), 1], ['js/allapot/ketReteg.js', L('M'), 1], ['js/csere/uj.js', L('U'), 1], ['koino.js', L('K'), 1]] };
  const sajat = { fajlok: [['felulet/a.js', L('B'), 1], ['js/allapot/ketReteg.js', L('N'), 1], ['js/csere/regi.js', L('R'), 1], ['koino.js', L('K'), 1]] };
  const r = valtozasRetegei(kartya, sajat, ['js/allapot/ketReteg.js']);
  const ok = r.mag.length === 1 && r.mag[0].ut === 'js/allapot/ketReteg.js' && r.mag[0].mi === 'mas'
    && r.felulet.length === 1 && r.felulet[0].mi === 'mas'
    && r.tobbi.length === 2 && r.tobbi.some((x) => x.ut === 'js/csere/uj.js' && x.mi === 'uj') && r.tobbi.some((x) => x.ut === 'js/csere/regi.js' && x.mi === 'eltunt')
    && r.ugyanaz === 1;
  if (!ok) process.stderr.write('    (' + JSON.stringify(r) + ')\n');
  return ok;
});

// ===== ⭐⭐ AZ ÉLES ÚT — két program egy készüléken =====

/** A program (a követett és a még nem követett, de nem kizárt fájlok — a dokumentáció nélkül) egy mappába másolva. */
async function programMasolata(hova) {
  const { stdout } = await futtat('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: GYOKER, maxBuffer: 16 * 1024 * 1024 });
  for (const ut of stdout.split('\0').filter(Boolean)) {
    if (/^(docs|\.claude)\//.test(ut) || ['CLAUDE.md', 'LICENSE', '.gitignore'].includes(ut)) continue;
    const cel = join(hova, ...ut.split('/'));
    await mkdir(dirname(cel), { recursive: true });
    try { await writeFile(cel, await readFile(join(GYOKER, ut))); } catch { /* a lemezről hiányzik */ }
  }
}

/** Egy program parancsa (a program mappájából), egy adat-mappával: a kimenet (színek nélkül). */
async function parancs(program, adat, ervek, env = {}) {
  try {
    const { stdout, stderr } = await futtat(process.execPath, [join(program, 'koino.js'), ...ervek], {
      env: { ...process.env, KOINO_ADAT: adat, KOINO_NAPLO: '', KOINO_DHT_BELEPOK: 'nincs', KOINO_TUKOR: '127.0.0.1:9', ...env },
      timeout: 120000, maxBuffer: 16 * 1024 * 1024, windowsHide: true, cwd: dirname(program)
    });
    return (stdout + stderr).replace(/\x1b\[[0-9;]*m/g, '');
  } catch (h) {
    return (String(h.stdout ?? '') + String(h.stderr ?? '') + h.message).replace(/\x1b\[[0-9;]*m/g, '');
  }
}

/** Felel-e egy port (a felület). */
const felel = (port) => new Promise((kesz) => {
  const s = connect(port, '127.0.0.1');
  s.on('connect', () => { s.destroy(); kesz(true); });
  s.on('error', () => kesz(false));
});

/** A mappából futó node- és powershell-folyamatok leállítása (a próba takarítása — Windowson). */
function folyamatokLeallitasa(mappa) {
  if (!WINDOWS) return;
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and "
      + "$_.CommandLine.IndexOf('" + mappa.replace(/'/g, "''") + "', [StringComparison]::OrdinalIgnoreCase) -ge 0 -and $_.ProcessId -ne $PID }"
      + " | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"], { stdio: 'ignore', timeout: 60000 });
  } catch { /* takarítás */ }
}

/** Vár, amíg a `telepites.json` egy végső állapotot mond (vagy lejár az idő). */
async function telepitesEredmenye(adat, ms) {
  const hatar = Date.now() + ms;
  while (Date.now() < hatar) {
    try {
      const e = JSON.parse(await readFile(join(adat, 'telepites.json'), 'utf8'));
      if (e.allapot && e.allapot !== 'folyamatban') return e;
    } catch { /* még nincs */ }
    await varj(500);
  }
  return null;
}

/**
 * Két program egy készüléken: A (ez a program) a `<otthon>/koino`-ban, B egy másolat más felülettel (és ha `bTorzs`, más
 * `koino.js`-szel) a `<masik>/koino`-ban; B alapít egy koinót és feltölt egy koino-verzió kártyát (a kódja B-é).
 */
async function ketProgram({ bValtozas = null } = {}) {
  const otthon = await ujMappa('koino-tel-otthon-');
  const masik = await ujMappa('koino-tel-masik-');
  const A = join(otthon, 'koino'), B = join(masik, 'koino'), adat = join(otthon, 'koino-adat');
  await programMasolata(A);
  await cp(A, B, { recursive: true });
  await writeFile(join(B, 'felulet', 'css', 'kartyarol.css'), '/* felulet/css/kartyarol.css — a próba B programja */\n');
  if (bValtozas) await bValtozas(B);
  const szul = await parancs(B, adat, ['koino', 'Telepítés-próba']);
  const kv = await parancs(B, adat, ['koinoverzio', 'A B program', 'pont=10']);
  const kartya = (kv.match(/kártyával \(([A-Za-z0-9_-]+)/) ?? [])[1] ?? null;
  return { otthon, A, B, adat, kartya, szul, kv };
}

// Rontás: (a) az előnézet a futó programot nem veti össze → „ugyanaz” → bukik; (b) a felület változása nem a felületnél → bukik; (c) a
// kiírás a kártya helyett a futó programot írja → a kiírt mappa neve más → bukik.
proba('⭐⭐ az ÉLES ÚT: B (más felülettel) feltölt egy kártyát; A a `telepit` paranccsal előnézi (más kód, ugyanaz a mag, a felület változott, minden fájl megvan) és kiírja a régi mellé — a kiírt mappa a kártya kódját nevezi meg, A maga változatlan', async () => {
  const k = await ketProgram();
  if (!k.kartya) { process.stderr.write('    (nincs kártya: ' + k.kv.replace(/\s+/g, ' ').slice(-400) + ')\n'); return false; }
  const elo = await parancs(k.A, k.adat, ['telepit', k.kartya]);
  const kiir = await parancs(k.A, k.adat, ['telepit', k.kartya, 'kiir']);
  const uj = join(k.otthon, 'koino-uj');
  const ujNev = await kodCsomagKeszitese(uj).then((c) => c.hivatkozas.lenyomat, () => null);
  const bNev = (await kodCsomagKeszitese(k.B)).hivatkozas.lenyomat;
  const aNev = (await kodCsomagKeszitese(k.A)).hivatkozas.lenyomat;
  const allapot = await parancs(k.A, k.adat, ['telepit']);
  const jo = {
    elonezet: /TELEPÍTÉS A KÁRTYÁRÓL — előnézet/.test(elo) && /a futó: /.test(elo) && /mind megvan/.test(elo)
      && /a mag ugyanaz/.test(elo) && /a felületen 1 fájl \(felulet\/css\/kartyarol\.css \+\)/.test(elo) && /kulcsaiddal/.test(elo),
    kiirva: /A kártya kódja kiírva/.test(kiir) && ujNev === bNev,
    aValtozatlan: aNev !== bNev && !(await stat(join(k.A, 'felulet', 'css', 'kartyarol.css')).then(() => true, () => false)),
    allapot: /A PROGRAM ezen a készüléken/.test(allapot) && /előző program nincs/.test(allapot)
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify(jo) + ')\n    (előnézet: ' + elo.replace(/\s+/g, ' ').slice(0, 900)
    + ')\n    (kiírás: ' + kiir.replace(/\s+/g, ' ').slice(-400) + ')\n');
  return ok;
});

/** A program felülete egy porton (a kulcsot a kiírt címből olvassuk — ahogy egy ember) és egy hívó. */
async function felulete(program, adat, port, env = {}) {
  // ⚠️ ha egy rontás miatt mégis cserét indítana, az se nyisson látható ablakot és böngészőt
  const folyamat = spawn(process.execPath, [join(program, 'koino.js'), 'felulet', String(port)], {
    env: { ...process.env, KOINO_ADAT: adat, KOINO_NAPLO: '', KOINO_DHT_BELEPOK: 'nincs', KOINO_TUKOR: '127.0.0.1:9',
      KOINO_FELULET_PORT: String(port), KOINO_CSERE_REJTETT: 'igen', KOINO_BONGESZO: 'nem', KOINO_CSERE_VARAKOZAS: '5', ...env },
    stdio: ['ignore', 'pipe', 'pipe'], cwd: dirname(program), windowsHide: true
  });
  let kimenet = '';
  const kulcs = await new Promise((kesz, baj) => {
    const ido = setTimeout(() => baj(new Error('a felület nem indult el: ' + kimenet.slice(-300))), 20000);
    folyamat.stdout.on('data', (d) => {
      kimenet += d;
      const t = kimenet.match(/kulcs=([A-Za-z0-9_-]+)/);
      if (t) { clearTimeout(ido); kesz(t[1]); }
    });
  });
  const hiv = async (ut, b = {}) => {
    const v = await fetch('http://127.0.0.1:' + port + ut, { ...b, headers: { 'Content-Type': 'application/json', 'X-Koino-Kulcs': kulcs } });
    return { allapot: v.status, adat: await v.json().catch(() => null) };
  };
  return { folyamat, hiv };
}

// Rontás: (a) a GET nem az előnézetet adja → bukik; (b) a POST a hiányos kártyát is telepítené → bukik; (c) a visszaút előző program
// nélkül is indulna → bukik.
proba('⭐⭐ a LAP útjai (`/api/telepites`): az előnézet a kártyára (a rétegek, a fájlok, a visszaút állása), a program állapota kártya nélkül; a visszaút előző program nélkül megnevezve áll meg; a már futó program nem telepíthető', async () => {
  const k = await ketProgram();
  if (!k.kartya) return false;
  const f = await felulete(k.A, k.adat, 8067);
  try {
    const { allapot } = await f.hiv('/api/pakli').catch(() => ({ allapot: 0 }));
    // a kártya teljes azonosítója (a lap ezt adja) — a koinó esemény-fájljából
    const { readdir } = await import('node:fs/promises');
    let teljes = null;
    for (const m of await readdir(k.adat)) {
      const sorok = await readFile(join(k.adat, m, 'esemenyek.jsonl'), 'utf8').catch(() => '');
      for (const s of sorok.split('\n').filter(Boolean)) {
        const e = JSON.parse(s);
        if (e.adat?.tipus === 'KoinoVerzio' && String(e.azonosito).startsWith(k.kartya.replace(/…$/, ''))) teljes = e.azonosito;
      }
    }
    const el = await f.hiv('/api/telepites?kartya=' + encodeURIComponent(teljes ?? k.kartya));
    const ures = await f.hiv('/api/telepites');
    const vissza = await f.hiv('/api/telepites/vissza', { method: 'POST', body: '{}' });
    // A saját programja egy kártyán (a kódja az, ami fut) — nem telepíthető
    const kv = await parancs(k.A, k.adat, ['koinoverzio', 'Az A program', 'pont=10']);
    const rovidA = (kv.match(/kártyával \(([A-Za-z0-9_-]+)/) ?? [])[1] ?? '';
    let sajatKartya = null;
    for (const m of await readdir(k.adat)) {
      const sorok = await readFile(join(k.adat, m, 'esemenyek.jsonl'), 'utf8').catch(() => '');
      for (const s of sorok.split('\n').filter(Boolean)) {
        const e = JSON.parse(s);
        if (e.adat?.tipus === 'KoinoVerzio' && rovidA && String(e.azonosito).startsWith(rovidA)) sajatKartya = e.azonosito;
      }
    }
    const sajat = await f.hiv('/api/telepites', { method: 'POST', body: JSON.stringify({ kartya: sajatKartya }) });
    const jo = {
      felulet: allapot !== 0,
      elonezet: el.allapot === 200 && el.adat?.ugyanaz === false && el.adat?.teljes === true && el.adat?.mag?.egyezik === true
        && el.adat?.retegek?.felulet?.some((x) => x.ut === 'felulet/css/kartyarol.css' && x.mi === 'uj') && el.adat?.regiVan === false
        && /kulcsaiddal/.test(el.adat?.figyelmeztetes ?? ''),
      allapot: ures.allapot === 200 && !!ures.adat?.sajat?.lenyomat && ures.adat?.regiVan === false && 'utolso' in (ures.adat ?? {}),
      vissza: vissza.allapot === 400 && /Nincs előző program/.test(vissza.adat?.hiba ?? ''),
      sajat: !!sajatKartya && sajat.allapot === 400 && /már ez a program fut/.test(sajat.adat?.hiba ?? '')
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, el: el.adat?.hiba ?? null, vissza: vissza.adat }) + ')\n');
    return ok;
  } finally {
    f.folyamat.kill();
    await varj(500);
    folyamatokLeallitasa(k.otthon);   // ha egy rontás miatt mégis csere indult
  }
});

// ⭐⭐ WINDOWSON A VALÓDI CSERE (`windows/csere.ps1`): A fut (a felülete egy próba-porton), a `telepit <kártya> igen` után A helyén B kódja
// fut, az előző a `-regi`-ben; a `telepit vissza` visszaállít. Rontás: (a) a szkript nem cserél → A helyén A → bukik; (b) a régit nem
// teszi a `-regi`-be → a visszaút nincs → bukik; (c) nem indít → a felület nem felel → (a TK5 visszafordít) → bukik.
proba('⭐⭐⭐ WINDOWSON A CSERE: a futó A helyén a kártya programja indul (a felület felel), az előző a `-regi`-ben; a `telepit vissza` visszaállít — mindkétszer az eredmény kimondva', async () => {
  if (!WINDOWS) { process.stdout.write('    (nem Windows — a csere.ps1 próbája kihagyva)\n'); return true; }
  const k = await ketProgram();
  if (!k.kartya) return false;
  const PORT = 8061;
  const env = { KOINO_FELULET_PORT: String(PORT), KOINO_BONGESZO: 'nem', KOINO_CSERE_REJTETT: 'igen', KOINO_CSERE_VARAKOZAS: '30' };
  const futo = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(k.A, 'windows', 'indit.ps1')],
    { env: { ...process.env, KOINO_ADAT: k.adat, ...env }, stdio: 'ignore', windowsHide: true, cwd: k.otthon });
  try {
    for (let i = 0; i < 60 && !(await felel(PORT)); i++) await varj(500);
    const elotte = await felel(PORT);
    const igen = await parancs(k.A, k.adat, ['telepit', k.kartya, 'igen'], env);
    const e1 = await telepitesEredmenye(k.adat, 90000);
    const bNev = (await kodCsomagKeszitese(k.B)).hivatkozas.lenyomat;
    const helyenNev = await kodCsomagKeszitese(k.A).then((c) => c.hivatkozas.lenyomat, () => null);
    const regiVan = await stat(join(k.otthon, 'koino-regi', 'koino.js')).then(() => true, () => false);
    const utana = await felel(PORT);
    await writeFile(join(k.adat, 'telepites.json'), '{}');
    const vissza = await parancs(k.A, k.adat, ['telepit', 'vissza'], env);
    const e2 = await telepitesEredmenye(k.adat, 90000);
    const visszaNev = await kodCsomagKeszitese(k.A).then((c) => c.hivatkozas.lenyomat, () => null);
    const regiNev = await kodCsomagKeszitese(join(k.otthon, 'koino-regi')).then((c) => c.hivatkozas.lenyomat, () => null);
    const jo = {
      elotte,
      indult: /A csere elindult/.test(igen),
      kesz: e1?.allapot === 'kesz' && /kártyáról telepített program fut/.test(e1?.mondat ?? ''),
      helyen: helyenNev === bNev && regiVan && utana,
      vissza: /A visszaút elindult/.test(vissza) && e2?.allapot === 'kesz' && visszaNev !== bNev && regiNev === bNev && (await felel(PORT))
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, e1, e2 }) + ')\n    (igen: ' + igen.replace(/\s+/g, ' ').slice(-300) + ')\n');
    return ok;
  } finally {
    futo.kill();
    folyamatokLeallitasa(k.otthon);
    await varj(1000);
  }
});

// ⭐⭐ TK5 WINDOWSON: a kártya programja nem indul (a felülete azonnal kilép) — a szkript a régit teszi vissza, a nem induló a `-hibas`-ba,
// és kimondja (`visszafordult`). Rontás: a vizsga elmarad (mindig „kész”) → bukik; a visszatevés elmarad → A helyén a nem induló → bukik.
proba('⭐⭐⭐ TK5 WINDOWSON: ha a kártya programja nem indul, a régi kerül vissza (a nem induló a `-hibas`-ba), és fut — kimondva', async () => {
  if (!WINDOWS) { process.stdout.write('    (nem Windows — kihagyva)\n'); return true; }
  const k = await ketProgram({
    bValtozas: async (B) => {
      const f = join(B, 'koino.js');
      const s = await readFile(f, 'utf8');
      // ⚠️ a próba hibás programja: a felülete azonnal kilép (a többi parancsa — a kártya feltöltése — megy)
      await writeFile(f, s.replace("// koino.js", "// koino.js\nif (process.argv[2] === 'felulet') process.exit(3);"));
    }
  });
  if (!k.kartya) { process.stderr.write('    (nincs kártya: ' + k.kv.replace(/\s+/g, ' ').slice(-300) + ')\n'); return false; }
  const PORT = 8063;
  const env = { KOINO_FELULET_PORT: String(PORT), KOINO_BONGESZO: 'nem', KOINO_CSERE_REJTETT: 'igen', KOINO_CSERE_VARAKOZAS: '8' };
  try {
    const aNev = (await kodCsomagKeszitese(k.A)).hivatkozas.lenyomat;
    await parancs(k.A, k.adat, ['telepit', k.kartya, 'igen'], env);
    const e = await telepitesEredmenye(k.adat, 90000);
    const helyenNev = await kodCsomagKeszitese(k.A).then((c) => c.hivatkozas.lenyomat, () => null);
    const hibas = await stat(join(k.otthon, 'koino-hibas', 'koino.js')).then(() => true, () => false);
    const allapot = await parancs(k.A, k.adat, ['telepit'], env);
    const jo = {
      visszafordult: e?.allapot === 'visszafordult' && /nem felelt — a régi fut újra/.test(e?.mondat ?? ''),
      helyen: helyenNev === aNev && hibas && (await felel(PORT)),
      parancs: /az utolsó telepítés: ⚠ Az új program 8 mp alatt nem felelt/.test(allapot)
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, e }) + ')\n    (állapot: ' + allapot.replace(/\s+/g, ' ').slice(0, 400) + ')\n');
    return ok;
  } finally {
    folyamatokLeallitasa(k.otthon);
    await varj(1000);
  }
});

// ===== ⭐⭐ A TELEFON CSERÉJE (`termux/csere.sh`) — ahol van `sh` (Windowson a Git Bash-sel) =====
//
// Egy pici próba-program (a `felulet` parancsa egy porton figyel, és kiírja a lap címét — amit a valódi `termux/indit.sh` vár), és a
// VALÓDI `indit.sh` és `csere.sh`. ⚠️ A `pkill` itt nincs (a Termuxban a `procps` hozza): a próba a lépések között maga állítja le a
// futó próba-programot — a leállítás maga a telefonon próbálható. Rontás: (a) a `.git` nem megy az új programmal → bukik; (b) a
// visszaút nem cserél → bukik; (c) a nem induló újat nem fordítja vissza → bukik.

const PROBA_PROGRAM = (jel, hibas = false) => `// koino.js — a csere próba-programja (${jel})
import { createServer } from 'node:http';
${hibas ? "if (process.argv[2] === 'felulet') process.exit(3);\n" : ''}if (process.argv[2] === 'felulet') {
  const port = Number(process.argv[3]);
  createServer((k, v) => v.end(${JSON.stringify(jel)})).listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port + '/?kulcs=proba'));
}
`;

/** Egy próba-program mappája: a `koino.js`, a valódi `termux/indit.sh`, és (ha `git`) egy kitalált `.git`. */
async function probaProgram(hova, jel, { hibas = false, git = false } = {}) {
  await mkdir(join(hova, 'termux'), { recursive: true });
  await writeFile(join(hova, 'koino.js'), PROBA_PROGRAM(jel, hibas));
  await writeFile(join(hova, 'termux', 'indit.sh'), await readFile(join(GYOKER, 'termux', 'indit.sh')));
  if (git) { await mkdir(join(hova, '.git'), { recursive: true }); await writeFile(join(hova, '.git', 'HEAD'), 'ref: refs/heads/main\n'); }
}

/** A futó próba-program válasza a porton (melyik program felel) — vagy null. */
const kiFelel = async (port) => {
  try { return await (await fetch('http://127.0.0.1:' + port + '/')).text(); } catch { return null; }
};

/** A mappából futó folyamatok leállítása — a mappa (egyedi) nevével keresve (a Git Bash a saját alakjában írja az utat). */
function nevvelLeallitas(nev) {
  if (!WINDOWS) {
    try { execFileSync('pkill', ['-f', nev], { stdio: 'ignore' }); } catch { /* nincs ilyen */ }
    return;
  }
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and "
      + "$_.CommandLine.Contains('" + nev + "') -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force "
      + "-ErrorAction SilentlyContinue }"], { stdio: 'ignore', timeout: 60000 });
  } catch { /* takarítás */ }
}

proba('⭐⭐⭐ A TELEFON CSERÉJE (`termux/csere.sh`, a valódi `indit.sh`-val): az új a helyére, a `.git` vele megy, a régi a `-regi`-ben, az új felel; a visszaút cserél; a nem induló új után a régi fut újra (a nem induló a `-hibas`-ban) — mindhárom kimondva', async () => {
  let shVan = false;
  try { shVan = execFileSync('sh', ['-c', 'echo igen'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === 'igen'; } catch { shVan = false; }
  if (!shVan) { process.stdout.write('    (nincs sh — a telefon cseréjének próbája kihagyva)\n'); return true; }
  const otthon = await ujMappa('koino-tel-sh-');
  const nev = otthon.split(/[\\/]/).pop();
  const ut = (x) => join(otthon, x).replace(/\\/g, '/');
  const PORT = 8065;
  const adat = ut('koino-adat');
  await mkdir(adat, { recursive: true });
  const szkript = join(adat, 'csere.sh');
  await writeFile(szkript, await readFile(join(GYOKER, 'termux', 'csere.sh')));
  const futtatas = (mod) => new Promise((kesz) => {
    const p = spawn('sh', [szkript.replace(/\\/g, '/'), ut('koino'), ut('koino-uj'), ut('koino-regi'), adat, String(PORT), mod],
      { env: { ...process.env, KOINO_ADAT: adat, KOINO_FELULET_PORT: String(PORT), KOINO_CSERE_VARAKOZAS: '10', KOINO_CSERE_KOD: 'proba-kod' },
        stdio: 'ignore', cwd: otthon, windowsHide: true });
    p.on('exit', (k) => kesz(k));
    p.on('error', () => kesz(-1));
  });
  const eredmeny = async () => JSON.parse(await readFile(join(adat, 'telepites.json'), 'utf8').catch(() => '{}'));
  const van = (x) => stat(join(otthon, ...x.split('/'))).then(() => true, () => false);
  try {
    await probaProgram(join(otthon, 'koino'), 'REGI', { git: true });
    await probaProgram(join(otthon, 'koino-uj'), 'UJ');
    const k1 = await futtatas('telepites');
    const e1 = await eredmeny();
    const f1 = await kiFelel(PORT);
    const git1 = (await van('koino/.git/HEAD')) && !(await van('koino-regi/.git'));
    const regi1 = await van('koino-regi/koino.js');
    nevvelLeallitas(nev);
    await varj(800);
    const k2 = await futtatas('vissza');
    const e2 = await eredmeny();
    const f2 = await kiFelel(PORT);
    const git2 = (await van('koino/.git/HEAD')) && !(await van('koino-regi/.git'));
    nevvelLeallitas(nev);
    await varj(800);
    // a nem induló új (a régi „REGI” fut a helyén)
    await probaProgram(join(otthon, 'koino-uj'), 'HIBAS', { hibas: true });
    const k3 = await futtatas('telepites');
    const e3 = await eredmeny();
    const f3 = await kiFelel(PORT);
    const jo = {
      telepites: k1 === 0 && e1.allapot === 'kesz' && f1 === 'UJ' && git1 && regi1 && e1.kod === 'proba-kod',
      vissza: k2 === 0 && e2.allapot === 'kesz' && e2.vissza === true && f2 === 'REGI' && git2,
      visszafordult: k3 === 2 && e3.allapot === 'visszafordult' && f3 === 'REGI' && (await van('koino-hibas/koino.js'))
        && (await van('koino/.git/HEAD')) && /nem felelt — a régi fut újra/.test(e3.mondat ?? '')
    };
    const ok = Object.values(jo).every(Boolean);
    if (!ok) {
      const naplo = await readFile(join(adat, 'telepites.log'), 'utf8').catch(() => '');
      process.stderr.write('    (' + JSON.stringify({ jo, k1, k2, k3, f1, f2, f3, e1: e1.allapot, e2: e2.allapot, e3: e3.allapot }) + ')\n'
        + '    (napló: ' + naplo.replace(/\s+/g, ' ').slice(-700) + ')\n');
    }
    return ok;
  } finally {
    nevvelLeallitas(nev);
    await varj(800);
  }
});

// ===== ⭐ A TELEFON: `koino lap` és a kattintható címek (Csaba, 2026-11-09 — a PR5 terepi próbájának lelete) =====

// Rontás: (a) a `koino lap` a régi (első) címet adja → a második futás címe helyett az első → bukik; (b) nem nézi, hogy a felület
// felel-e → a leállt felületre is „A lap: …” → bukik; (c) a telepítő a meglévő beállítást is felülírja / kétszer írja be → bukik.
proba('⭐ a TELEFON (sh): `koino lap` a FUTÓ felület címét adja (egy újraindulás után az újat), leállt felületnél kimondja; a telepítő a kattintható címeket bekapcsolja — egyszer, és a kimondott beállításhoz nem nyúl', async () => {
  let shVan = false;
  try { shVan = execFileSync('sh', ['-c', 'echo igen'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === 'igen'; } catch { shVan = false; }
  if (!shVan) { process.stdout.write('    (nincs sh — a telefon parancsainak próbája kihagyva)\n'); return true; }
  const otthon = await ujMappa('koino-tel-lap-');
  const ut = (x) => join(otthon, x).replace(/\\/g, '/');
  const adat = join(otthon, 'koino-adat');
  await mkdir(adat, { recursive: true });
  const { createServer } = await import('node:http');
  const kiszolgalo = createServer((k, v) => v.end('x'));
  await new Promise((kesz) => kiszolgalo.listen(0, '127.0.0.1', kesz));
  const port = kiszolgalo.address().port;
  // a napló: egy régebbi indítás címe, utána a mostanié (az indító a naplót újraírja — itt mindkettő benne, a mostani a végén)
  await writeFile(join(adat, 'felulet.log'), 'A felület fut.\n  http://127.0.0.1:' + port + '/?kulcs=REGI_KULCS\n'
    + 'A felület fut.\n  http://127.0.0.1:' + port + '/?kulcs=UJ_KULCS\n');
  const sh = (ervek, env = {}) => new Promise((kesz) => {
    const p = spawn('sh', ervek, { env: { ...process.env, KOINO_ADAT: ut('koino-adat'), KOINO_FELULET_PORT: String(port), ...env },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let ki = '';
    p.stdout.on('data', (d) => { ki += d; });
    p.stderr.on('data', (d) => { ki += d; });
    p.on('close', (kod) => kesz({ kod, ki }));
  });
  const indito = join(GYOKER, 'termux', 'indit.sh').replace(/\\/g, '/');
  const fut = await sh([indito, 'lap']);
  kiszolgalo.close();
  await varj(300);
  const nemFut = await sh([indito, 'lap']);
  // a telepítő: egy ál-Termux ($PREFIX/bin), üres otthon — a beállítás egyszer kerül be; a kimondott `false` marad
  const prefix = join(otthon, 'prefix');
  await mkdir(join(prefix, 'bin'), { recursive: true });
  const telepito = join(GYOKER, 'termux', 'telepit.sh').replace(/\\/g, '/');
  const tenv = { PREFIX: prefix.replace(/\\/g, '/'), HOME: ut('otthon'), KOINO_INDITAS: 'nem' };
  await mkdir(join(otthon, 'otthon'), { recursive: true });
  const t1 = await sh([telepito], tenv);
  const t2 = await sh([telepito], tenv);
  const tul = await readFile(join(otthon, 'otthon', '.termux', 'termux.properties'), 'utf8').catch(() => '');
  await mkdir(join(otthon, 'masik', '.termux'), { recursive: true });
  await writeFile(join(otthon, 'masik', '.termux', 'termux.properties'), 'terminal-onclick-url-open = false\n');
  await sh([telepito], { ...tenv, HOME: ut('masik') });
  const masik = await readFile(join(otthon, 'masik', '.termux', 'termux.properties'), 'utf8');
  const jo = {
    fut: fut.kod === 0 && fut.ki.includes('A lap: http://127.0.0.1:' + port + '/?kulcs=UJ_KULCS') && !fut.ki.includes('REGI_KULCS'),
    nemFut: nemFut.kod === 1 && /most nem fut/.test(nemFut.ki),
    beallitas: (tul.match(/^terminal-onclick-url-open = true$/gm) ?? []).length === 1 && /koppintásra megnyílnak/.test(t1.ki)
      && !/koppintásra megnyílnak/.test(t2.ki) && /koino lap/.test(t1.ki),
    kimondott: masik === 'terminal-onclick-url-open = false\n'
  };
  const ok = Object.values(jo).every(Boolean);
  if (!ok) process.stderr.write('    (' + JSON.stringify({ jo, fut, nemFut, t1: t1.ki.slice(-300), tul, masik }) + ')\n');
  return ok;
});

export default async function (csendes) {
  const eredmeny = await futtatas(csendes);
  for (const m of mappak) await rm(m, { recursive: true, force: true }).catch(() => {});
  return eredmeny;
}
