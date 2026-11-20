// meres/magyarazatProba.js

// Felelősség: ⭐⭐ D129 (⑤) — AZ ⓘ JELEK PRÓBÁJA A FELÜLETEN (Csaba, 2026-11-20 — MA10 (C): „a kettő együtt”):
//   · a FÁJLOKBAN (gyors, minden helyre): minden ⓘ-hely címének darabjai — az osztály- és azonosító-nevek, a választó értékei, és a
//     felirat, amiről a hely a gombot / az ablakot felismeri — ott vannak a felület programjában (a `koinoMagyarazat.js`-en és a
//     stíluslapokon kívül). ⛔ Ha valaki egy elemet átnevez, az ⓘ némán eltűnne a lapról (nincs hibaüzenet) — ez a próba megfogja;
//   · a VALÓDI LAPON (fej nélküli Chrome-mal, mint a nézet-próba — csomag nélkül, a Node beépített WebSocketjével): egy friss koinó
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

export default async function (csendes) {
  const eredmeny = await futtatas(csendes);
  for (const m of mappak) await rm(m, { recursive: true, force: true }).catch(() => {});
  return eredmeny;
}
