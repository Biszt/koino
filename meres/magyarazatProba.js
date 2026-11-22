// meres/magyarazatProba.js

// Felelősség: ⭐⭐ D129 (⑤) — AZ ⓘ JELEK PRÓBÁJA A FELÜLETEN (Csaba, 2026-11-20 — MA10 (C): „a kettő együtt”):
//   · a FÁJLOKBAN (gyors, minden helyre): minden ⓘ-hely címének darabjai — az osztály- és azonosító-nevek, a választó értékei, és a
//     felirat, amiről a hely a gombot / az ablakot felismeri — ott vannak a felület programjában (a `koinoMagyarazat.js`-en és a
//     stíluslapokon kívül). ⛔ Ha valaki egy elemet átnevez, az ⓘ némán eltűnne a lapról (nincs hibaüzenet) — ez a próba megfogja;
//   · a VALÓDI LAPON (fej nélküli Chrome-mal, mint a nézet-próba — csomag nélkül, a Node beépített WebSocketjével): egy friss koino
//     felületén az ⓘ ténylegesen kikerül (az alsó sáv, az állapot-sor, a kártya, a fő menü és a kártya menüje — a kettő nem keveredik,
//     a Keresés ablakának címe), a buborék a program szövegével nyílik, és az ⓘ kattintása a menüpontot NEM indítja el. ⛔ Kézzel már
//     volt ilyen hiba: a figyelő egy háttérfülön beragadt, és a menü ⓘ-i ki sem kerültek (④a). Ha nincs Chrome a gépen, kimarad.
//
// Használja: meres/mind.js (`magyarazat` — a `felulet` csoportban).

import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

import { programAlapTartalma } from '../js/kezikonyv/kezikonyv.js';
import { probaGyujtemeny } from './probaFuttato.js';

const { proba, futtatas } = probaGyujtemeny('Az ⓘ jelek a felületen (D129 ⑤ — MA10 (C))');

const futtat = promisify(execFile);
const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const FELULET = join(GYOKER, 'felulet');
const mappak = [];
const varj = (ms) => new Promise((kesz) => setTimeout(kesz, ms));

async function ujMappa(elotag) {
  const m = await mkdtemp(join(tmpdir(), elotag));
  mappak.push(m);
  return m;
}

// ===================================
// 1. A FÁJLOKBAN — minden hely címe létezik a felület programjában
// ===================================

/**
 * Az ⓘ-helyek darabjai a `koinoMagyarazat.js` forrásából: a választók (`hely`, `cimke` — a segédfüggvényeké is), a feliratok
 * (`felirat: '…'`, és a menüpont-segédek első érve). A választóból az osztály- és azonosító-nevek és az attribútum-értékek.
 * @param {string} forras
 * @returns {{valasztok: string[], feliratok: string[], darabok: string[]}}
 */
export function helyekDarabjai(forras) {
  const kezdet = forras.indexOf('const menuPont');
  const veg = forras.indexOf(']);', forras.indexOf('export const MAGYARAZAT_HELYEK'));
  const resz = forras.slice(kezdet, veg);
  const valasztok = [...resz.matchAll(/(?:hely|cimke): '([^']+)'/g)].map((m) => m[1]);
  const feliratok = [...[...resz.matchAll(/felirat: '([^']+)'/g)].map((m) => m[1]),
    ...[...resz.matchAll(/[mM]enuPont\('([^']+)'/g)].map((m) => m[1])];
  const darabok = new Set();
  for (const v of valasztok) {
    for (const m of v.matchAll(/[.#]([A-Za-z_][\w-]*)/g)) darabok.add(m[1]);
    for (const m of v.matchAll(/\[[\w-]+[~|^$*]?="([^"]+)"\]/g)) darabok.add(m[1]);
  }
  return { valasztok, feliratok, darabok: [...darabok] };
}

/** A felület programja (JS és HTML — a `koinoMagyarazat.js` és a stíluslapok nélkül: azokban minden név „megvan”). */
async function feluletForrasa() {
  const fajlok = (await readdir(FELULET, { recursive: true })).map((f) => String(f).replace(/\\/g, '/'))
    .filter((f) => /\.(js|html)$/.test(f) && !f.endsWith('koinoMagyarazat.js'));
  return (await Promise.all(fajlok.map((f) => readFile(join(FELULET, f), 'utf8')))).join('\n');
}

// Rontás: (a) egy hely osztálynevét elírjuk (az elem nincs) → bukik; (b) egy ablak-címet elírunk (a felirat nincs) → bukik; (c) a
// darabolás a koinoMagyarazat.js-t is beleolvassa (minden név „megvan”) → a (a) nem bukna — ezért a forrás nélküle.
proba('⭐⭐ D129 ⑤ (MA10 (C)) a fájlokban: minden ⓘ-hely címe — az osztály- és azonosító-nevek, a választó értékei, a felismerő feliratok — ott van a felület programjában (egy átnevezett elemről az ⓘ némán eltűnne)',
  async () => {
    const forras = await readFile(join(FELULET, 'js', 'koinoMagyarazat.js'), 'utf8');
    const { valasztok, feliratok, darabok } = helyekDarabjai(forras);
    const program = await feluletForrasa();
    const hianyzoDarab = darabok.filter((d) => !program.includes(d));
    const hianyzoFelirat = feliratok.filter((f) => !program.includes(f));
    const r = { sok: valasztok.length >= 60 && feliratok.length >= 30 && darabok.length >= 50, darab: hianyzoDarab.length === 0,
      felirat: hianyzoFelirat.length === 0 };
    if (!Object.values(r).every(Boolean)) {
      process.stderr.write('    (' + JSON.stringify({ r, valasztok: valasztok.length, feliratok: feliratok.length, darabok: darabok.length,
        hianyzoDarab, hianyzoFelirat }) + ')\n');
      return false;
    }
    return true;
  });

// ===================================
// 2. A VALÓDI LAPON — fej nélküli Chrome-mal
// ===================================

/** A program egy parancsa egy adat-mappával. */
async function parancs(adat, ervek) {
  try {
    const { stdout, stderr } = await futtat(process.execPath, [join(GYOKER, 'koino.js'), ...ervek], {
      env: { ...process.env, KOINO_ADAT: adat, KOINO_NAPLO: '', KOINO_DHT_BELEPOK: 'nincs', KOINO_TUKOR: '127.0.0.1:9' },
      timeout: 120000, maxBuffer: 16 * 1024 * 1024, windowsHide: true, cwd: GYOKER
    });
    return stdout + stderr;
  } catch (h) {
    return String(h.stdout ?? '') + String(h.stderr ?? '') + h.message;
  }
}

/** A felület egy porton (a kulcsot a kiírt címből olvassuk). */
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
  return { folyamat, kulcs, port };
}

/** A telepített Chrome (vagy Edge, Chromium) — vagy null (a próba kimarad). `KOINO_CHROME` felülírja. (Mint a nézet-próbában.) */
function chromeHelye() {
  const jeloltek = [process.env.KOINO_CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  return jeloltek.find((j) => j && existsSync(j)) ?? null;
}

/** Egy CDP-kapcsolat (Chrome DevTools Protocol — a Node beépített WebSocketjével). */
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
  const kuld = (method, params = {}) => new Promise((kesz, baj) => {
    const id = ++szam;
    varok.set(id, [kesz, baj]);
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { kuld, esemenyek, zar: () => ws.close() };
}

/** Egy kifejezés kiértékelése a lapban (ígéretet is megvár) — az értéke. */
async function ertekel(cdp, kifejezes) {
  const v = await cdp.kuld('Runtime.evaluate', { expression: kifejezes, awaitPromise: true, returnByValue: true });
  if (v.exceptionDetails) throw new Error(v.exceptionDetails.exception?.description ?? v.exceptionDetails.text);
  return v.result?.value;
}

/**
 * A lapon végigjárt helyek: az ⓘ-k nevei felületenként, egy buborék (a Keresés menüpontjáé — és hogy a menüpont NEM indult el), a
 * Keresés ablakának címe, a kártya menüje. A lap saját moduljait használja (a Modal az ablak bezárásához). JSON-ként adja vissza.
 */
const LAP_BEJARASA = `(async () => {
  const varj = (ms) => new Promise((r) => setTimeout(r, ms));
  const nevek = (gy) => gy ? [...gy.querySelectorAll('.koino-magyarazat__jel')].map((j) => j.dataset.nev) : [];
  const { default: Modal } = await import('./js/components/modals/Modal.js');
  const zar = async () => { for (let i = 0; i < 6 && Modal.vanNyitottModal(); i++) { Modal.legfelsoModalBezarasa(); await varj(300); } };
  const ki = {};
  ki.lap = nevek(document);
  // ----- a fő menü -----
  document.querySelector('#hamburger-menu-kontener .hamburger-gomb').click();
  await varj(800);
  ki.menu = nevek(document.querySelector('#hamburger-menu-kontener'));
  // ----- egy buborék: a Keresés menüpontjának ⓘ-je (a menüpont maga nem indulhat el) -----
  document.querySelector('#hamburger-menu-kontener [data-nev="kezikonyv/menu/kereses"]')?.click();
  for (let i = 0; i < 20 && !document.querySelector('.koino-magyarazat__buborek .koino-magyarazat__cim'); i++) await varj(250);
  ki.buborekCim = document.querySelector('.koino-magyarazat__buborek .koino-magyarazat__cim')?.textContent ?? null;
  ki.buborekSzoveg = document.querySelector('.koino-magyarazat__buborek .koino-magyarazat__szoveg')?.textContent?.length ?? 0;
  ki.keresesElindult = !!document.querySelector('.modal-panel:has(.kereses-modal)');
  document.querySelector('.koino-magyarazat__bezar')?.click();
  await varj(300);
  // ----- a Keresés ablaka (a menüpontra kattintva): a címénél ⓘ -----
  [...document.querySelectorAll('#hamburger-menu-kontener .hamburger-menu-pont')]
    .find((p) => p.querySelector('.hamburger-menu-pont__felirat')?.textContent.trim() === 'Keresés')?.click();
  for (let i = 0; i < 20 && !document.querySelector('.modal-panel:has(.kereses-modal) .modal-cim .koino-magyarazat__jel'); i++) await varj(250);
  ki.ablak = nevek(document.querySelector('.modal-panel:has(.kereses-modal) .modal-cim'));
  await zar();
  // ----- a kiválasztott kártya és a menüje -----
  const k = document.querySelector('.pakli-kartya--kivalasztott');
  ki.kartya = nevek(k?.querySelector('.pakli-kartya__ikon-sor--tudatpont'));
  k?.querySelector('.pakli-kartya__hamburger-kontener .hamburger-gomb')?.click();
  await varj(1200);
  ki.kartyaMenu = nevek(k?.querySelector('.pakli-kartya__hamburger-kontener'));
  return JSON.stringify(ki);
})()`;

// Rontás: (a) a fő menü helyének választója elírva → a menü ⓘ-i nincsenek → bukik; (b) az ⓘ kattintása továbbmegy (nincs
// stopPropagation) → a Keresés elindul → bukik; (c) a buborék útvonala nem ad bejegyzést → a buborék üres → bukik; (d) a figyelő
// nem fut újra (csak az induláskori elhelyezés) → a menü és az ablak ⓘ-i nincsenek → bukik.
proba('⭐⭐ D129 ⑤ (MA10 (C)) a valódi lapon (fej nélküli Chrome): az ⓘ kikerül (az alsó sáv, az állapot-sor, a kártya, a fő menü és a kártya menüje — nem keveredve —, a Keresés ablakának címe), a buborék a program szövegével nyílik, és az ⓘ a menüpontot nem indítja el',
  async () => {
    const chrome = chromeHelye();
    if (!chrome) { process.stdout.write('    (nincs Chrome a gépen — a böngészős ⓘ-próba kihagyva; KOINO_CHROME=<út>)\n'); return true; }
    if (typeof WebSocket !== 'function') { process.stdout.write('    (a Node-ban nincs WebSocket — a böngészős próba kihagyva)\n'); return true; }
    const otthon = await ujMappa('koino-magyarazat-');
    const adat = join(otthon, 'adat');
    await parancs(adat, ['koino', 'Magyarázat-próba']);
    await parancs(adat, ['gondolat', 'Egy gondolat', 'a gondolat szövege']);
    const f = await felulete(adat, 8097);
    const profil = await ujMappa('koino-magyarazat-profil-');
    const b = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
      '--remote-allow-origins=*', '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore', windowsHide: true });
    let cdp = null;
    try {
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
      await cdp.kuld('Page.navigate', { url: 'http://127.0.0.1:' + f.port + '/?kulcs=' + f.kulcs });
      for (let i = 0; i < 100 && !cdp.esemenyek.some((e) => e.method === 'Page.loadEventFired'); i++) await varj(200);
      // a lap betölti a paklit és a sávokat (a figyelő 30 ms-onként rak ki) — várunk, amíg a kártya ⓘ-je is kint van
      for (let i = 0; i < 60; i++) {
        if (await ertekel(cdp, "!!document.querySelector('.pakli-kartya__ikon-sor--tudatpont > .koino-magyarazat__jel')")) break;
        await varj(250);
      }
      const ki = JSON.parse(await ertekel(cdp, LAP_BEJARASA));
      const alap = programAlapTartalma();
      const osszes = [...ki.lap, ...ki.menu, ...ki.ablak, ...ki.kartya, ...ki.kartyaMenu];
      const r = {
        lap: ki.lap.includes('kezikonyv/also-sav') && ki.lap.includes('kezikonyv/fejlec/allapot') && ki.lap.includes('kezikonyv/kartya'),
        menu: ki.menu.includes('kezikonyv/menu') && ki.menu.filter((n) => n.startsWith('kezikonyv/menu/')).length >= 20
          && !ki.menu.some((n) => n.startsWith('kezikonyv/kartya/')),
        buborek: ki.buborekCim === alap.nevSzerint.get('kezikonyv/menu/kereses').cim && ki.buborekSzoveg > 50,
        nemIndult: ki.keresesElindult === false,
        ablak: ki.ablak.includes('kezikonyv/menu/kereses'),
        kartya: ki.kartya.includes('kezikonyv/kartya'),
        kartyaMenu: ki.kartyaMenu.includes('kezikonyv/kartya/menu') && ki.kartyaMenu.includes('kezikonyv/kartya/menu/javaslat')
          && ki.kartyaMenu.length >= 10 && !ki.kartyaMenu.some((n) => n.startsWith('kezikonyv/menu/')),
        // minden kikerült név a program alap-tartalmában van (különben a buborék „nincs magyarázat”-ot mondana)
        nevek: osszes.every((n) => alap.nevSzerint.has(n))
      };
      if (!Object.values(r).every(Boolean)) {
        process.stderr.write('    (' + JSON.stringify({ r, ki }).slice(0, 1600) + ')\n');
        return false;
      }
      return true;
    } finally {
      cdp?.zar();
      b.kill();
      f.folyamat.kill();
      await varj(800);
    }
  });

// ===================================
// 3. ⛔ A BETÖLTÉSRE VÁRÓ PAKLI — az ⓘ és az ütem (Csaba, 2026-11-21: „5 másodpercenként, rángatozik egyet a felület, amikor a pakli
//    tetején vagyok, és látszódnak ezek: … ⏳ betöltés: a hiányzó részeket az őrjárat hozza el”)
// ===================================
//
// Mérve a lapon (a két őrjárat állt, a hiányzó rész nem jöhetett meg): a csendes újrakérdezés SAJÁT válasza a kezdő 4 mp-re állította
// vissza az ütemet (az időzítő épp üres volt), tehát a lap örökké 6 mp-enként kérdezett; és minden körben újraírta az állapot-sort, a
// `textContent` pedig az ⓘ-t is levette — a figyelő 30 ms múlva tette vissza, a sor addig elugrott.

/** A lap betöltése ELŐTT (CDP): a fa-szelet válasza `betoltes`-t mond, mintha egy rész még úton volna (a program maga nem változik). */
const BETOLTES_CSOMAGOLO = `(() => {
  const eredeti = window.fetch.bind(window);
  window.fetch = async (cim, ...tobbi) => {
    const v = await eredeti(cim, ...tobbi);
    if (!String(cim).includes('pakli/hierarchikus')) return v;
    const adat = await v.clone().json();
    adat.betoltes = true;
    adat.kitolKerni = 1;
    return new Response(JSON.stringify(adat), { status: v.status, headers: { 'Content-Type': 'application/json' } });
  };
})()`;

/**
 * A lapon: megvárjuk az állapot-sor ⓘ-jét, leállítjuk a lap saját időzítőjét (és ami épp úton volt, lefut), majd két csendes
 * újrakérdezés kézzel — közben figyeljük, lekerül-e a jel. Végül egy MÁS szöveg: az új szöveg kint, a jel ugyanaz az elem.
 */
const BETOLTES_PROBA = `(async () => {
  const varj = (ms) => new Promise((r) => setTimeout(r, ms));
  const p = window.aktivPakli;
  const sor = document.querySelector('#allapot');
  const jelE = () => sor?.querySelector(':scope > .koino-magyarazat__jel') ?? null;
  for (let i = 0; i < 60 && !(jelE() && p?.megjelenitettKulcs && sor.textContent.includes('betöltés')); i++) await varj(250);
  const jel = jelE();
  const ki = { vanJel: !!jel, szoveg: sor?.textContent ?? '' };
  if (!jel || !p) return JSON.stringify(ki);
  p._ujrakerdezesLeallitasa();
  for (let i = 0; i < 20 && p.ujrakerdezesFut; i++) await varj(100);
  await varj(300);
  p._ujrakerdezesLeallitasa();
  let levette = 0;
  new MutationObserver((m) => { for (const x of m) for (const n of x.removedNodes) if (n === jel) levette++; })
    .observe(sor, { childList: true });
  ki.koz0 = p.ujrakerdezesKoz;
  await p._ujrakerdezes();
  ki.koz1 = p.ujrakerdezesKoz;
  await p._ujrakerdezes();
  ki.koz2 = p.ujrakerdezesKoz;
  p._ujrakerdezesLeallitasa();
  await varj(100);
  ki.levette = levette;
  p._allapot('Más szöveg — a próba írta', 'betoltes');
  ki.ujSzoveg = sor.textContent;
  ki.ugyanazAJel = jelE() === jel;
  await varj(100);
  ki.levetteVegul = levette;
  return JSON.stringify(ki);
})()`;

// Rontás: (a) a pakli-válasz jelzése az újrakérdezés alatt is újraindítja az ütemet (a `ujrakerdezesFut` feltétel nélkül) → a köz nem
// nő → bukik; (b) az állapot-sor ismét `textContent`-tel íródik → a jel lekerül → bukik; (c) a más szöveg a jel nélkül íródik ki →
// a jel lekerül, nem ugyanaz → bukik.
proba('⛔ (Csaba, 2026-11-21: „5 másodpercenként rángatozik”) a betöltésre váró pakli a valódi lapon: a csendes újrakérdezés egyre ritkább (a saját válasza nem állítja vissza a kezdő 4 mp-re), és az állapot-sor ⓘ-je közben egyszer sem kerül le — más szövegnél sem',
  async () => {
    const chrome = chromeHelye();
    if (!chrome) { process.stdout.write('    (nincs Chrome a gépen — a böngészős próba kihagyva; KOINO_CHROME=<út>)\n'); return true; }
    if (typeof WebSocket !== 'function') { process.stdout.write('    (a Node-ban nincs WebSocket — a böngészős próba kihagyva)\n'); return true; }
    const otthon = await ujMappa('koino-betoltes-');
    const adat = join(otthon, 'adat');
    await parancs(adat, ['koino', 'Betöltés-próba']);
    await parancs(adat, ['gondolat', 'Egy gondolat', 'a gondolat szövege']);
    const f = await felulete(adat, 8096);
    const profil = await ujMappa('koino-betoltes-profil-');
    const b = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
      '--remote-allow-origins=*', '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore', windowsHide: true });
    let cdp = null;
    try {
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
      await cdp.kuld('Page.addScriptToEvaluateOnNewDocument', { source: BETOLTES_CSOMAGOLO });
      await cdp.kuld('Page.navigate', { url: 'http://127.0.0.1:' + f.port + '/?kulcs=' + f.kulcs });
      for (let i = 0; i < 100 && !cdp.esemenyek.some((e) => e.method === 'Page.loadEventFired'); i++) await varj(200);
      const ki = JSON.parse(await ertekel(cdp, BETOLTES_PROBA));
      const r = {
        betoltesLatszik: ki.vanJel && ki.szoveg.includes('⏳ betöltés'),
        ritkul: ki.koz1 > ki.koz0 && ki.koz2 > ki.koz1,
        jelMaradt: ki.levette === 0 && ki.levetteVegul === 0,
        masSzoveg: String(ki.ujSzoveg ?? '').endsWith('Más szöveg — a próba írta') && ki.ugyanazAJel === true
      };
      if (!Object.values(r).every(Boolean)) {
        process.stderr.write('    (' + JSON.stringify({ r, ki }).slice(0, 1200) + ')\n');
        return false;
      }
      return true;
    } finally {
      cdp?.zar();
      b.kill();
      f.folyamat.kill();
      await varj(800);
    }
  });

// ===================================
// 4. ⭐ A RÉSZLETES ADATOK a valódi lapon (Csaba, 2026-11-20: „a részletes adatok, menüpont, még nem mutatja az adatokat, … szerintem
//    az vólna a jó, ha megnyitáskór, még csak a kérelem tőrténne meg, és a csere/cserék hozná el, a friss adatokat, és ezt a modal
//    jelezné”)
// ===================================
//
// Az örökölt ablak a prototípus alakját olvassa — a lap fordít (`kartyaAdat.js` `reszletekAdatta`). A sorok egy friss koino saját
// gondolatán: a létrehozás ideje, a pontok, a hozzájárulók, a szerkesztő (te). A betöltés: a lap betöltése ELŐTT egy `fetch`-csomagoló a
// részletek válaszába `betoltes`-t és egy megjegyzést tesz (mintha a szelet úton volna) — a megjegyzés a lista alá kerül, az
// újrakérdezés megy (4 mp után), és az ablak bezárása után leáll.

const RESZLETEK_CSOMAGOLO = `(() => {
  const eredeti = window.fetch.bind(window);
  window.__reszletekKeres = 0;
  window.fetch = async (cim, ...tobbi) => {
    const v = await eredeti(cim, ...tobbi);
    if (!/\\/api\\/gondolat\\/[^/]+\\/reszletek/.test(String(cim))) return v;
    window.__reszletekKeres += 1;
    const adat = await v.clone().json();
    adat.betoltes = true;
    adat.kitolKerni = 1;
    adat.koinoMegjegyzes = '⏳ próba-megjegyzés: az őrjárat hozza';
    return new Response(JSON.stringify(adat), { status: v.status, headers: { 'Content-Type': 'application/json' } });
  };
})()`;

const RESZLETEK_PROBA = `(async () => {
  const varj = (ms) => new Promise((r) => setTimeout(r, ms));
  const p = window.aktivPakli;
  for (let i = 0; i < 60 && !(p?.megjelenitettKulcs && (p.kartyaPeldanyok ?? []).length); i++) await varj(250);
  // a pakli a legerősebb gyökérrel nyílik (a kézikönyv — D129): a próba gondolatára lépünk
  const { apiGet } = await import('./js/utils/apiHelper.js');
  const lap = await apiGet('pakli?rendezes=ido&irany=csokkeno&darab=50');
  const az = (lap?.kartyak ?? []).find((k) => k.cim === 'Egy gondolat')?.azonosito;
  if (az) await p.init(az, 'Gondolat');
  const kartya = (p?.kartyaPeldanyok ?? []).find((k) => k?.entitas?.adatok?.cim === 'Egy gondolat');
  if (!kartya) return JSON.stringify({ nincsKartya: true });
  const { default: ReszletekModal } = await import('./js/components/modals/ReszletekModal.js');
  const m = new ReszletekModal('modal-kontener', { entitas: kartya.entitas });
  await m.init();
  await m.megnyitas();
  await varj(300);
  const sorok = {};
  for (const s of document.querySelectorAll('#reszletek-modal-lista .reszletek-modal__sor')) {
    const c = s.querySelector('.reszletek-modal__cimke')?.textContent?.trim();
    const e = [...s.querySelectorAll('.reszletek-modal__ertek')].map((x) => x.textContent.trim()).join(' | ');
    if (c) sorok[c] = e;
  }
  const lista = document.getElementById('reszletek-modal-lista');
  const ki = { sorok, megj: lista?.parentElement?.querySelector(':scope > .koino-megjegyzes')?.textContent ?? null,
    ora: !!m._koinoReszletekOra, proba: m._koinoReszletekProba ?? 0, keresElotte: window.__reszletekKeres };
  await varj(4600);
  ki.keresUjra = window.__reszletekKeres;
  ki.sorokUtana = document.querySelectorAll('#reszletek-modal-lista .reszletek-modal__sor').length;
  m.bezaras();
  const zaraskor = window.__reszletekKeres;
  await varj(7000);
  ki.keresZarasUtan = window.__reszletekKeres - zaraskor;
  return JSON.stringify(ki);
})()`;

// Rontás: (a) a fordítás kimarad (a `prototipusUtvonala` részletek-ága nélkül) → a sorok „—” → bukik; (b) a megjegyzés nem kerül ki
// → bukik; (c) az újrakérdezés a bezárt ablaknál is fut → bukik.
proba('⭐ (Csaba, 2026-11-20) a RÉSZLETES ADATOK a valódi lapon: a sorok a koino adatait mutatják (nem „—”), a program megjegyzése a lista alatt, betöltés alatt csendes újrakérdezés — és az ablak bezárása után leáll',
  async () => {
    const chrome = chromeHelye();
    if (!chrome) { process.stdout.write('    (nincs Chrome a gépen — a böngészős próba kihagyva; KOINO_CHROME=<út>)\n'); return true; }
    if (typeof WebSocket !== 'function') { process.stdout.write('    (a Node-ban nincs WebSocket — a böngészős próba kihagyva)\n'); return true; }
    const otthon = await ujMappa('koino-reszletek-');
    const adat = join(otthon, 'adat');
    await parancs(adat, ['koino', 'Részletek-próba']);
    await parancs(adat, ['gondolat', 'Egy gondolat', 'a gondolat szövege']);
    const f = await felulete(adat, 8095);
    const profil = await ujMappa('koino-reszletek-profil-');
    const b = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
      '--remote-allow-origins=*', '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore', windowsHide: true });
    let cdp = null;
    try {
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
      await cdp.kuld('Page.addScriptToEvaluateOnNewDocument', { source: RESZLETEK_CSOMAGOLO });
      await cdp.kuld('Page.navigate', { url: 'http://127.0.0.1:' + f.port + '/?kulcs=' + f.kulcs });
      for (let i = 0; i < 100 && !cdp.esemenyek.some((e) => e.method === 'Page.loadEventFired'); i++) await varj(200);
      const ki = JSON.parse(await ertekel(cdp, RESZLETEK_PROBA));
      const s = ki.sorok ?? {};
      const r = {
        sorok: !!s['Létrehozva'] && s['Létrehozva'] !== '—' && s['Összes (entitáson)'] === '100' && s['Saját pontod'] === '100'
          && String(s['Hozzájárulók'] ?? '').startsWith('1') && String(s['Szerkesztő'] ?? '').startsWith('te — '),
        megjegyzes: ki.megj === '⏳ próba-megjegyzés: az őrjárat hozza',
        ujrakerdez: ki.ora === true && ki.proba === 1 && ki.keresUjra > ki.keresElotte && ki.sorokUtana > 5,
        leall: ki.keresZarasUtan === 0
      };
      if (!Object.values(r).every(Boolean)) {
        process.stderr.write('    (' + JSON.stringify({ r, ki }).slice(0, 1400) + ')\n');
        return false;
      }
      return true;
    } finally {
      cdp?.zar();
      b.kill();
      f.folyamat.kill();
      await varj(800);
    }
  });

// ===================================
// 5. ⭐⭐ D130 (③e, KO9 (A)): A BUBORÉK, ha a bejegyzés nem a koinon-darabomba esik
// ===================================
//
// A program a darabot elkéri, és kimondja (`koinoMegjegyzes`, `betoltes`) — itt egy `fetch`-csomagoló mondja (egy darabos koinoban
// minden bejegyzés a darabomba esik). A buborék a megjegyzést kiírja, csendben újrakérdez (4 mp után), és a bezárása után leáll.

const BUBOREK_CSOMAGOLO = `(() => {
  const eredeti = window.fetch.bind(window);
  window.__buborekKeres = 0;
  window.fetch = async (cim, ...tobbi) => {
    const v = await eredeti(cim, ...tobbi);
    if (!String(cim).includes('/api/kezikonyv/bejegyzes')) return v;
    window.__buborekKeres += 1;
    const adat = await v.clone().json();
    adat.betoltes = true;
    adat.kitolKerni = 1;
    adat.koinoMegjegyzes = '⏳ próba: a bejegyzés darabját az őrjárat hozza';
    return new Response(JSON.stringify(adat), { status: v.status, headers: { 'Content-Type': 'application/json' } });
  };
})()`;

const BUBOREK_PROBA = `(async () => {
  const varj = (ms) => new Promise((r) => setTimeout(r, ms));
  let jel = null;
  for (let i = 0; i < 60 && !jel; i++) { jel = document.querySelector('#allapot > .koino-magyarazat__jel'); if (!jel) await varj(250); }
  if (!jel) return JSON.stringify({ nincsJel: true });
  jel.click();
  for (let i = 0; i < 40 && !document.querySelector('.koino-magyarazat__buborek .koino-magyarazat__cim'); i++) await varj(150);
  const ki = { megj: document.querySelector('.koino-magyarazat__buborek .koino-magyarazat__megjegyzes')?.textContent ?? null,
    keresElotte: window.__buborekKeres };
  await varj(4600);
  ki.keresUjra = window.__buborekKeres;
  ki.cimUtana = document.querySelector('.koino-magyarazat__buborek .koino-magyarazat__cim')?.textContent ?? null;
  document.querySelector('.koino-magyarazat__bezar')?.click();
  const zaraskor = window.__buborekKeres;
  await varj(7000);
  ki.keresZarasUtan = window.__buborekKeres - zaraskor;
  ki.buborekMaradt = !!document.querySelector('.koino-magyarazat__buborek');
  return JSON.stringify(ki);
})()`;

// Rontás: (a) a buborék a megjegyzést nem írja ki → bukik; (b) a bezárás az újrakérdezést nem állítja le → bukik.
proba('⭐⭐ D130 (③e, KO9 (A)) a BUBORÉK a valódi lapon, ha a bejegyzés nem a darabomba esik: a program megjegyzése kint, csendes újrakérdezés — és a bezárása után leáll',
  async () => {
    const chrome = chromeHelye();
    if (!chrome) { process.stdout.write('    (nincs Chrome a gépen — a böngészős próba kihagyva; KOINO_CHROME=<út>)\n'); return true; }
    if (typeof WebSocket !== 'function') { process.stdout.write('    (a Node-ban nincs WebSocket — a böngészős próba kihagyva)\n'); return true; }
    const otthon = await ujMappa('koino-buborek-');
    const adat = join(otthon, 'adat');
    await parancs(adat, ['koino', 'Buborék-próba']);
    await parancs(adat, ['gondolat', 'Egy gondolat', 'a gondolat szövege']);
    const f = await felulete(adat, 8093);
    const profil = await ujMappa('koino-buborek-profil-');
    const b = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
      '--remote-allow-origins=*', '--user-data-dir=' + profil, 'about:blank'], { stdio: 'ignore', windowsHide: true });
    let cdp = null;
    try {
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
      await cdp.kuld('Page.addScriptToEvaluateOnNewDocument', { source: BUBOREK_CSOMAGOLO });
      await cdp.kuld('Page.navigate', { url: 'http://127.0.0.1:' + f.port + '/?kulcs=' + f.kulcs });
      for (let i = 0; i < 100 && !cdp.esemenyek.some((e) => e.method === 'Page.loadEventFired'); i++) await varj(200);
      const ki = JSON.parse(await ertekel(cdp, BUBOREK_PROBA));
      const r = {
        megjegyzes: ki.megj === '⏳ próba: a bejegyzés darabját az őrjárat hozza',
        ujrakerdez: ki.keresUjra > ki.keresElotte && !!ki.cimUtana,
        leall: ki.keresZarasUtan === 0 && ki.buborekMaradt === false
      };
      if (!Object.values(r).every(Boolean)) {
        process.stderr.write('    (' + JSON.stringify({ r, ki }).slice(0, 900) + ')\n');
        return false;
      }
      return true;
    } finally {
      cdp?.zar();
      b.kill();
      f.folyamat.kill();
      await varj(800);
    }
  });

export default async function (csendes) {
  const eredmeny = await futtatas(csendes);
  for (const m of mappak) await rm(m, { recursive: true, force: true }).catch(() => {});
  return eredmeny;
}
