// js/tar/programTelepites.js

// Felelősség: ⭐⭐ D125 (D123 PR5) — A TELEPÍTÉS A KÁRTYÁRÓL, a program oldalán (`docs/kartya_telepites_atvizsgalas.md`): a koino-verzió
// kártya kódjának kiírása egy új mappába a régi MELLÉ, a kiírt mappa vizsgája, az előnézet rétegei (mi változik a futó programhoz
// képest), és a csere helye (hova kerül az új, hova a régi — és mikor NEM cserélünk). Hálózatot nem nyit; a mappák CSERÉJE (a futó
// program leállítása, az átnevezés, az indítás és a visszafordítás) a platform szkriptjéé (`windows/csere.ps1`, `termux/csere.sh`).
//
// ===== A KIÍRÁS (TK4: csak a teljes, ellenőrzött kóddal) =====
//
// A kártya kódja a fájl-tárban van (D119: a jegyzék és a fájlok, a nevük a lenyomatuk). A kiírás ELŐBB mindent beolvas és ellenőriz
// (megvan-e, a mérete és a lenyomata a jegyzéké-e, az útja biztonságos-e) — csak ha mind jó, akkor ír; így egy hiányzó vagy hamis fájl
// nem hagy félkész mappát. A kiírás után a mappa kód-csomagja (`kodCsomagKeszitese` — git nélkül bejárva) UGYANAZT a nevet kell adja,
// mint a kártya `kod`-ja (a 91. mérés lelete óta teljesül); ha nem, a mappa törlődik, és a telepítés megnevezve áll meg.
// ⚠️ A lenyomat azt bizonyítja, hogy a kód az, amit a kártya megnevez — azt nem, hogy jó (D125 / TK2).
//
// ===== A CSERE HELYE (TK1) =====
//
// A program mappája mellett: `<név>-uj` (az új, a kiírás helye) és `<név>-regi` (a régi — a visszaút, a következő cseréig). A
// telepítő sorok `koino`, `koino-uj`, `koino-regi` nevet használnak (PR7) — ugyanez a minta. ⛔ Egy git-tárat Windowson nem cserélünk
// (az egy fejlesztő munkakönyvtára — a PR7 telepítője sem); a TELEFONON a `~/koino` a telepítő sor sekély klónja: ott a `.git` az új
// programmal megy (a sor így később is a GitHubról frissít — TK1).
//
// Használják: koino.js (a `telepit` parancs és a lap — `/api/telepites`), a próbák (`meres/telepitesProba.js`).

import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { join, dirname, basename, resolve, sep } from 'node:path';

import { bajtLenyomat } from '../esemeny/kanonikusAlak.js';
import { kodCsomagKeszitese } from './kodCsomag.js';

/** A kártyáról telepítés egy út-szakasza: csak ezek a jelek (a program fájljai ilyenek; egy Windowson tiltott név nem lehet). */
const SZAKASZ_MINTA = /^[A-Za-z0-9_+@-][A-Za-z0-9._+@-]*$/;
const WINDOWS_FOGLALT = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

/** Megnevezett hiba (a hívó és a lap a `kod`-ból tudja, mi a teendő). */
function hiba(kod, uzenet, tobb = {}) {
  const h = new Error(uzenet);
  h.kod = kod;
  Object.assign(h, tobb);
  return h;
}

/** Biztonságos-e egy jegyzékbeli út a kiíráshoz (a jegyzék alakját a `kodJegyzekAlakja` már nézte — ez a lemez felőli őr). */
export function kiirhatoUt(ut) {
  if (typeof ut !== 'string' || !ut || ut.length > 512) return false;
  return ut.split('/').every((sz) => SZAKASZ_MINTA.test(sz) && !sz.endsWith('.') && !WINDOWS_FOGLALT.test(sz));
}

/**
 * ⭐⭐ A KÁRTYA KÓDJÁNAK KIÍRÁSA — előbb minden fájl beolvasva és ellenőrizve, aztán a mappa (üresen újra) és a fájlok, végül a vizsga.
 * @param {{lenyomat: string, bajt: number}} kod - a kártya `kod`-ja (a jegyzék hivatkozása)
 * @param {{fajlok: Array}} jegyzek - a kártya jegyzéke (`kodJegyzekOlvasasa`)
 * @param {Function} olvas - async (lenyomat) → Uint8Array|null (a fájl-tár)
 * @param {string} hova - az új mappa (`telepitesHelye(...).uj`)
 * @returns {Promise<{fajl: number, bajt: number, hova: string}>}
 * @throws `HIANYZO-FAJL` (`hianyzik`, `osszes`), `ROSSZ-FAJL` (`ut`), `TILTOTT-UT` (`ut`), `KIIRT-MAS` (a kiírt mappa neve)
 */
export async function kodKiirasa(kod, jegyzek, olvas, hova) {
  console.log('kodKiirasa - KEZDÉS', { fajl: jegyzek?.fajlok?.length, hova });
  const tartalmak = [];
  let hianyzik = 0;
  for (const [ut, lenyomat, bajt] of jegyzek.fajlok) {
    if (!kiirhatoUt(ut)) throw hiba('TILTOTT-UT', 'A kártya kódjában egy út nem írható ki biztonságosan: ' + ut, { ut });
    const t = await Promise.resolve(olvas(lenyomat)).catch(() => null);
    if (!t) { hianyzik++; continue; }
    if (t.length !== bajt || (await bajtLenyomat(t)) !== lenyomat) {
      throw hiba('ROSSZ-FAJL', 'A kártya kódjának egy fájlja nem az, amit a jegyzék megnevez: ' + ut, { ut });
    }
    tartalmak.push([ut, t]);
  }
  if (hianyzik) {
    throw hiba('HIANYZO-FAJL', 'A kártya kódjából ' + hianyzik + ' fájl még nincs meg ezen a készüléken (a ' + jegyzek.fajlok.length
      + '-ből) — előbb hozd el', { hianyzik, osszes: jegyzek.fajlok.length });
  }
  const gyoker = resolve(hova);
  await rm(gyoker, { recursive: true, force: true });
  await mkdir(gyoker, { recursive: true });
  let bajt = 0;
  for (const [ut, t] of tartalmak) {
    const cel = resolve(gyoker, ...ut.split('/'));
    if (!cel.startsWith(gyoker + sep)) throw hiba('TILTOTT-UT', 'A kártya kódjában egy út kilépne a mappából: ' + ut, { ut });
    await mkdir(dirname(cel), { recursive: true });
    await writeFile(cel, t);
    bajt += t.length;
  }
  // ⭐ a vizsga: a kiírt mappa ugyanazt a kódot nevezi-e meg (git nélkül bejárva — ahogy majd a futó program)
  const cs = await kodCsomagKeszitese(gyoker);
  if (cs.hivatkozas.lenyomat !== kod.lenyomat) {
    await rm(gyoker, { recursive: true, force: true });
    throw hiba('KIIRT-MAS', 'A kiírt program más kódot nevez meg, mint a kártya (' + cs.hivatkozas.lenyomat.slice(0, 12) + '… — a kártyáé '
      + kod.lenyomat.slice(0, 12) + '…) — nem telepítem', { kiirt: cs.hivatkozas });
  }
  console.log('kodKiirasa - VÉGE', { fajl: tartalmak.length, bajt });
  return { fajl: tartalmak.length, bajt, hova: gyoker };
}

/**
 * ⭐ A CSERE HELYE (TK1): az új és a régi mappa a program mappája mellett, és hogy a csere egyáltalán mehet-e.
 * @param {string} programGyoker - a futó program mappája
 * @param {{platform?: string, termux?: boolean, gitVan?: boolean}} [k] - a készülék (a próbáknak megadható)
 * @returns {Promise<{lehet: boolean, ok: string|null, platform: string, mappa: string, uj: string, regi: string, gitVele: boolean}>}
 */
export async function telepitesHelye(programGyoker, k = {}) {
  const mappa = resolve(programGyoker);
  const nev = basename(mappa);
  const otthon = dirname(mappa);
  const platform = k.platform ?? process.platform;
  const termux = k.termux ?? /com\.termux/.test(process.env.PREFIX ?? '');
  const gitVan = k.gitVan ?? (await stat(join(mappa, '.git')).then(() => true, () => false));
  const ki = { platform: termux ? 'termux' : platform === 'win32' ? 'windows' : platform, mappa,
    uj: join(otthon, nev + '-uj'), regi: join(otthon, nev + '-regi'), gitVele: false, lehet: true, ok: null };
  if (ki.platform !== 'windows' && ki.platform !== 'termux') {
    return { ...ki, lehet: false, ok: 'ezen a rendszeren (' + platform + ') a csere nincs megépítve — a kiírt programot kézzel indíthatod: '
      + ki.uj };
  }
  if (gitVan && ki.platform === 'windows') {
    return { ...ki, lehet: false, ok: 'a program mappája egy git-tár (' + mappa + ') — egy fejlesztő munkakönyvtárát nem cserélem le' };
  }
  return { ...ki, gitVele: gitVan };
}

/**
 * ⭐⭐ AZ ELŐNÉZET RÉTEGEI (TK2): mi változik a kártya kódjában a FUTÓ programhoz képest — fájlonként (új, eltűnt, más), rétegenként:
 * a MAG (a két mag-jegyzék útjai közül bármelyikben), a FELÜLET (`felulet/`), és a TÖBBI (a protokoll és a helyi viselkedés — a
 * fájlnév szerint; a protokoll SZÁMAI csak futtatva derülnének ki).
 * @param {{fajlok: Array}} kartyaJegyzek
 * @param {{fajlok: Array}} sajatJegyzek
 * @param {Array<string>} magUtak - a két mag fájljai együtt (a kártyáé és a futóé)
 * @returns {{mag: Array, felulet: Array, tobbi: Array, ugyanaz: number}} a listák elemei `{ ut, mi: 'uj'|'eltunt'|'mas' }`
 */
export function valtozasRetegei(kartyaJegyzek, sajatJegyzek, magUtak = []) {
  const k = new Map(kartyaJegyzek.fajlok.map((f) => [f[0], f[1]]));
  const s = new Map(sajatJegyzek.fajlok.map((f) => [f[0], f[1]]));
  const mag = new Set(magUtak);
  const ki = { mag: [], felulet: [], tobbi: [], ugyanaz: 0 };
  for (const ut of [...new Set([...k.keys(), ...s.keys()])].sort()) {
    const mi = !s.has(ut) ? 'uj' : !k.has(ut) ? 'eltunt' : k.get(ut) !== s.get(ut) ? 'mas' : null;
    if (!mi) { ki.ugyanaz++; continue; }
    (mag.has(ut) ? ki.mag : ut.startsWith('felulet/') ? ki.felulet : ki.tobbi).push({ ut, mi });
  }
  return ki;
}
