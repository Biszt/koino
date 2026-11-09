// meres/nezetMeres.js — ⭐ A FELTÖLTÖTT NÉZET (92. mérés, D123 ⑤ — PR4, a közösség feltöltött nézetei)
//
// Felelősség: megméri a PR4 (B) két bizonytalan pontját, MIELŐTT a hogyanról dönteni kellene (`docs/nezetek_atvizsgalas.md`):
//
//   (a) A NÉZET-KÁRTYA A MAI PROGRAMON — átmegy-e a mai kapun egy új fajta kártya (három alakban: saját típussal és `nezet`
//       mezővel; gondolatként, `nezet` mezővel; és gondolatként, a kódot a szövegben megnevezve), mit őriz meg belőle a koinó
//       képe (a mag), mit lát belőle a mai pakli és a mai fájl-igény (a szállítás). Vagyis: kell-e hozzá a MAG változása —
//       az új számítás, vagyis új koinó-család volna (D127 — a bekapcsolódás) —, és mit lát egy még nem frissített társ.
//
//   (b) A BÖNGÉSZŐ ELSZIGETELÉSE — egy „rosszindulatú” nézet egy elszigetelt keretben (`<iframe sandbox="allow-scripts"
//       srcdoc>`, a nézet elé tett CSP-vel és anélkül) mit ér el: a lap kulcsát és tárát, a helyi kaput (kulccsal és anélkül),
//       és a KÜLVILÁGOT (fetch, kép, beacon, WebSocket, stíluslap, előtöltés, külső szkript, munkás, beágyazott keret, felugró
//       ablak, a lap elnavigálása, űrlap, önnavigáció, meta refresh, data:/blob: dokumentum, document.write, a CSP feloldása,
//       WebRTC). A „külvilág” egy második helyi kiszolgáló (minden kérését naplózza) és egy UDP-kapu (a WebRTC STUN/TURN-je).
//       A lap három változatban: a szülőnek nincs CSP-je (mint ma), `frame-src 'none'`, `frame-src 'self'`. A nézet négy
//       beállításban: K0 csak sandbox · K1 + a nézet CSP-je · K2 + `webrtc 'block'` · K3 + egy őr-szkript (a WebRTC
//       konstruktorai lefedve) — a K2 és a K3 csak a WebRTC-t méri. És egy KONTROLL (nem elszigetelve: a lapról és egy nyitott
//       keretből) — ha az sem jut ki, a „kifelé semmi” a böngészőé, nem az elszigetelésé.
//
// Nem önpróba: igen/nem-eket és számokat ad. Futtatás (a tár gyökeréből): node meres/nezetMeres.js [a|b] — az (a) magától lefut,
// a (b)-hez a kiírt címeket kell egy böngészőben megnyitni (egyenként, ~50 mp-ig; a lap lefuttatja a próbákat, és az eredményt
// visszaküldi). ⚠️ A kapu a valódi `js/felulet/kapu.js` (az öt őrrel és a fejléceivel) — a lap a mai lap helyzetében van.
// Környezet: `KOINO_MERES_CEL` = hurok (alap) | lan | teszt (a külvilág címe) · `KOINO_MERES_OLDALAK` (vesszővel: mely lapok) ·
// `KOINO_MERES_VARAKOZAS` (mp — meddig vár az eredményre).
// ⛔ A TANULSÁG (2026-11-08): a Claude asztali alkalmazás beépített böngészője az eredet nélküli (sandbox) keret MINDEN kérését a
// saját szűrőjével megállítja (`net::ERR_BLOCKED_BY_CLIENT`) — ott minden út „zártnak” látszott, a CSP nélküli is. Egy valódi
// böngészővel (fej nélküli Chrome, üres, ideiglenes profillal) kell mérni: `--headless=new --user-data-dir=<üres mappa> <cím>`.
// Használja: a 92. mérés (eredmenyek.md), docs/nezetek_atvizsgalas.md.

import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createSocket } from 'node:dgram';
import { randomBytes } from 'node:crypto';
import { tmpdir, networkInterfaces } from 'node:os';
import { join } from 'node:path';

import { ujEember } from './probaFuttato.js';
import { alakiHiba } from '../js/esemeny/esemeny.js';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese } from '../js/tar/esemenyTar.js';
import { koinoKepe } from '../js/allapot/ketReteg.js';
import { teljesSzabalyok } from '../js/esemeny/koinoSzabalyok.js';
import { entitasFajljai } from '../js/allapot/fajlIgeny.js';
import { pakliOldal } from '../js/allapot/pakli.js';
import { kapuNyitasa } from '../js/felulet/kapu.js';

const kiir = (s) => process.stdout.write(s + '\n');
const csendes = !process.env.KOINO_NAPLO;
if (csendes) { console.log = () => {}; console.warn = () => {}; }
const mappak = [];

// ===================================
// (a) A NÉZET-KÁRTYA A MAI PROGRAMON
// ===================================

const T0 = Date.UTC(2026, 0, 1);

async function nezetKartyaAMaiProgramon() {
  kiir('(a) A NÉZET-KÁRTYA A MAI PROGRAMON');
  const A = await ujEember('');
  const P = await A.tesz('KoinoLetrehozas', { nev: 'Nézet-mérés', leiras: null, alapitok: [], zart: true,
    szabalyok: teljesSzabalyok() }, T0);
  A.koinotValt(P.azonosito);
  const KOD = { lenyomat: 'N'.repeat(43), bajt: 4321 };
  const alakok = [
    ['saját típus + nezet mező', { tipus: 'Nezet', cim: 'Térkép', szoveg: null, szulo: null, nezet: { v: 1, kod: KOD }, meret: 10 }],
    ['gondolat + nezet mező', { cim: 'Térkép (gondolatként)', szoveg: null, szulo: null, nezet: { v: 1, kod: KOD }, meret: 10 }],
    ['gondolat, a kód a szövegben (blokk)', { cim: 'Térkép (a szövegben)', szulo: null, meret: 10,
      szoveg: [{ tipus: 'fajl', url: '/api/fajl/' + KOD.lenyomat, nev: 'nezet.html' }] }]
  ];
  const mappa = await mkdtemp(join(tmpdir(), 'koino-nezet-'));
  mappak.push(mappa);
  const tar = await esemenyTarNyitasa(P.azonosito, mappa);
  await esemenyMentese(tar, P);
  const esemenyek = [P];
  const azonositok = [];
  let ido = T0 + 100;
  for (const [nev, adat] of alakok) {
    const e = await A.tesz('GondolatLetrehozas', adat, ido++);
    const pont = await A.tesz('TudatpontRendezes', { entitas: e.azonosito, pont: 10 }, ido++);
    const m1 = await esemenyMentese(tar, e);
    const m2 = await esemenyMentese(tar, pont);
    esemenyek.push(e, pont);
    azonositok.push(e.azonosito);
    kiir('  ' + nev + ': az alak ' + (alakiHiba(e) ?? 'rendben') + ' · a kapu ' + (m1.mentve ? 'BEENGEDTE' : 'elvetette (' + m1.ok + ')')
      + ' · a pontja ' + (m2.mentve ? 'beengedve' : 'elvetve (' + m2.ok + ')'));
  }
  const kep = await koinoKepe(esemenyek, { koino: P.azonosito, most: T0 + 1000 });
  const pakli = await pakliOldal(tar, P.azonosito, { szerzo: A.szerzo, most: T0 + 1000, darab: 20 }).catch((h) => ({ hiba: h.message }));
  const lapon = new Map((pakli?.kartyak ?? pakli?.lista ?? []).map((k) => [k.azonosito, k]));
  alakok.forEach(([nev], i) => {
    const en = kep.allapot.entitasok.get(azonositok[i]);
    if (!en) { kiir('  ' + nev + ': a koinó képében NINCS'); return; }
    const fajlok = [...entitasFajljai(en)];
    const k = lapon.get(azonositok[i]);
    kiir('  ' + nev + ': a képben tipus=' + en.tipus + ', a nezet mező ' + ('nezet' in en ? 'MEGVAN' : 'nincs')
      + ', pont ' + en.osszesPont + ' · a fájl-igény: ' + (fajlok.length ? fajlok.map((l) => l.slice(0, 6) + '…').join(', ') : 'semmi')
      + ' · a mai pakliban: ' + (k ? 'tipus=' + k.tipus + ', a mezői: ' + Object.keys(k).filter((x) => /nezet|kod/i.test(x)).join(',') || '—' : 'nincs'));
  });
  if (pakli?.hiba) kiir('  (a pakli hibája: ' + pakli.hiba + ')');
  kiir('  a pakli kulcsai: ' + Object.keys(pakli ?? {}).join(', '));
}

// ===================================
// (b) A BÖNGÉSZŐ ELSZIGETELÉSE
// ===================================

/** A nézet elé tett CSP (a javaslat): csak a saját beágyazott szkriptje és stílusa, kép csak data:/blob:, semmi kapcsolat. */
const NEZET_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:";

/** A lap három változata (a szülő CSP-je). */
const OLDALAK = [
  ['szulo-nincs', null],
  ['szulo-none', "frame-src 'none'"],
  ['szulo-self', "frame-src 'self'"]
];

const CEL = process.env.KOINO_MERES_CEL ?? 'hurok';
const OLDALAKBOL = (process.env.KOINO_MERES_OLDALAK ?? '').split(',').filter(Boolean).length
  ? OLDALAK.filter(([n]) => process.env.KOINO_MERES_OLDALAK.split(',').includes(n)) : OLDALAK;

/** A próbák — mind a nézetben fut. `K` a külvilág címe (a próba jelével), `jel(nev, ertek)` a lapnak szól. */
const PROBAK = [
  ['szulo-cime', "try { jel('ért', parent.location.href); } catch (e) { jel('ért', e.name); }"],
  ['szulo-dom', "try { jel('ért', parent.document.title); } catch (e) { jel('ért', e.name); }"],
  ['hivatkozo', "jel('referrer', document.referrer || '(üres)'); jel('hely', location.href); jel('eredet', location.origin);"],
  ['tar', "try { localStorage.setItem('x', '1'); jel('localStorage', 'írható'); } catch (e) { jel('localStorage', e.name); }"
    + " try { jel('süti', document.cookie || '(üres)'); } catch (e) { jel('süti', e.name); }"
    + " try { indexedDB.open('x').onerror = function () { jel('indexedDB', 'hiba'); }; jel('indexedDB', 'nyitható?'); } catch (e) { jel('indexedDB', e.name); }"],
  ['kapu-fetch', "fetch('/api/titok?p=' + P).then(function (r) { jel('ért', 'állapot ' + r.status); }).catch(function (e) { jel('ért', 'elakadt: ' + e.name); });"],
  ['kapu-fetch-kulccsal', "fetch('/api/titok?p=' + P, { headers: { 'X-Koino-Kulcs': KULCS } }).then(function (r) { return r.text().then(function (t) { jel('ért', 'állapot ' + r.status + ' ' + t.slice(0, 40)); }); }).catch(function (e) { jel('ért', 'elakadt: ' + e.name); });"],
  ['kapu-kep-kulccsal', "var i = new Image(); i.onload = function () { jel('ért', 'betöltött'); }; i.onerror = function () { jel('ért', 'onerror'); }; i.src = '/api/titok?kulcs=' + KULCS + '&p=' + P;"],
  ['kapu-nyilt-fetch', "fetch('/api/nyilt/x?p=' + P).then(function (r) { jel('ért', 'állapot ' + r.status); }).catch(function (e) { jel('ért', 'elakadt: ' + e.name); });"],
  ['kapu-nyilt-kep', "var i = new Image(); i.onload = function () { jel('ért', 'betöltött'); }; i.onerror = function () { jel('ért', 'onerror'); }; i.src = '/api/nyilt/x?p=' + P;"],
  ['kulso-fetch', "fetch(K + 'fetch', { mode: 'no-cors' }).then(function () { jel('ért', 'elment'); }).catch(function (e) { jel('ért', 'elakadt: ' + e.name); });"],
  ['kulso-kep', "var i = new Image(); i.onerror = function () { jel('ért', 'onerror'); }; i.src = K + 'kep';"],
  ['kulso-beacon', "try { jel('ért', navigator.sendBeacon(K + 'beacon', 'x') ? 'sorba téve' : 'false'); } catch (e) { jel('ért', e.name); }"],
  ['kulso-websocket', "try { var w = new WebSocket('ws://' + KULSO + '/ws?p=' + P); w.onerror = function () { jel('ért', 'onerror'); }; } catch (e) { jel('ért', e.name); }"],
  ['kulso-stilus', "var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = K + 'stilus'; document.head.appendChild(l);"
    + " document.body.style.backgroundImage = 'url(' + K + 'hatter)'; jel('ért', 'beillesztve');"],
  ['kulso-elotoltes', "var l = document.createElement('link'); l.rel = 'prefetch'; l.href = K + 'prefetch'; document.head.appendChild(l);"
    + " var m = document.createElement('link'); m.rel = 'preload'; m.as = 'image'; m.href = K + 'preload'; document.head.appendChild(m); jel('ért', 'beillesztve');"],
  ['kulso-szkript', "var s = document.createElement('script'); s.onerror = function () { jel('ért', 'onerror'); }; s.src = K + 'szkript'; document.head.appendChild(s);"],
  ['munkas', "try { var w = new Worker(URL.createObjectURL(new Blob([\"fetch('\" + K + \"munkas', { mode: 'no-cors' })\"], { type: 'text/javascript' })));"
    + " w.onerror = function () { jel('ért', 'onerror'); }; jel('ért', 'létrejött'); } catch (e) { jel('ért', e.name); }"],
  ['kulso-keret', "var f = document.createElement('iframe'); f.src = K + 'keret'; document.body.appendChild(f); jel('ért', 'beillesztve');"],
  ['felugro', "try { var w = window.open(K + 'felugro'); jel('ért', w ? 'megnyílt' : 'null'); } catch (e) { jel('ért', e.name); }"],
  ['urlap', "try { var f = document.createElement('form'); f.action = K + 'urlap'; f.method = 'GET'; document.body.appendChild(f); f.submit(); jel('ért', 'elküldve?'); } catch (e) { jel('ért', e.name); }"],
  ['csp-feloldas', "var m = document.createElement('meta'); m.httpEquiv = 'Content-Security-Policy'; m.content = 'default-src *'; document.head.appendChild(m);"
    + " var i = new Image(); i.onerror = function () { jel('ért', 'onerror'); }; i.src = K + 'feloldva';"],
  ['document-write', "jel('ért', 'előtte'); document.open(); document.write('<img src=\"' + K + 'irt\">'); document.close();"],
  ['webrtc', "var R = window.RTCPeerConnection; jel('konstruktor', typeof R); try { var pc = new R({ iceServers: [{ urls: 'stun:' + LAN + ':' + UDP }, { urls: 'turn:' + LAN + ':' + UDP, username: 'p-' + P, credential: 'x' }] });"
    + " pc.createDataChannel('x'); var n = 0; pc.onicecandidate = function (e) { if (e.candidate) { n++; jel('jelölt', e.candidate.type + ' ' + (e.candidate.address || '?')); } else jel('gyűjtés', 'vége (' + n + ')'); };"
    + " pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { jel('ért', 'ajánlat kész'); }).catch(function (e) { jel('ért', e.name); }); } catch (e) { jel('ért', e.name); }"],
  // ⭐ ugyanez egy FRISS belső keret konstruktorával (egy őr-szkript a nézet saját ablakát fedi le, a friss keretét nem)
  ['webrtc-friss-keret', "var f = document.createElement('iframe'); document.body.appendChild(f); var R = f.contentWindow && f.contentWindow.RTCPeerConnection;"
    + " jel('konstruktor', typeof R); try { var pc = new R({ iceServers: [{ urls: 'stun:' + LAN + ':' + UDP }] }); pc.createDataChannel('x');"
    + " pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { jel('ért', 'ajánlat kész'); }).catch(function (e) { jel('ért', e.name); }); } catch (e) { jel('ért', e.name); }"],
  // ⚠️ A navigálók UTOLJÁRA (a keretük elhagyja a nézetet — utána nem szólhat)
  ['lap-elnavigalasa', "try { top.location.href = K + 'top'; jel('ért', 'nem dobott'); } catch (e) { jel('ért', e.name); }"],
  ['onnavigacio', "jel('ért', 'indul'); location.href = K + 'nav';"],
  ['meta-frissites', "var m = document.createElement('meta'); m.httpEquiv = 'refresh'; m.content = '0;url=' + K + 'frissites'; document.head.appendChild(m); jel('ért', 'beillesztve');"],
  ['data-dokumentum', "jel('ért', 'indul'); location.href = 'data:text/html,' + encodeURIComponent('<img src=\"' + K + 'data\">');"],
  ['blob-dokumentum', "jel('ért', 'indul'); location.href = URL.createObjectURL(new Blob(['<img src=\"' + K + 'blob\">'], { type: 'text/html' }));"]
];

/** A lap (a mai lap helyzetében: a kapu szolgálja ki, a kulcs a címsorban). `__B__` helyére a beállítás kerül. */
function lapHtml(nev, szuloCsp) {
  return '<!doctype html><html lang="hu"><head><meta charset="utf-8">'
    + (szuloCsp ? '<meta http-equiv="Content-Security-Policy" content="' + szuloCsp + '">' : '')
    + '<title>nézet-mérés ' + nev + '</title></head><body><h1>Nézet-mérés: ' + nev + '</h1><p id="all">fut…</p><div id="keretek"></div>'
    + '<script>\n' + LAP_SZKRIPT.replace('__B__', JSON.stringify({ oldal: nev })) + '\n<\/script></body></html>';
}

// ⚠️ A lap szkriptje szándékosan régi stílusú (var, function, összefűzés) — a Node-beli sablon nem nyúl bele.
const LAP_SZKRIPT = String.raw`
var B = __B__;
var KULCS = new URLSearchParams(location.search).get('kulcs');
var A = JSON.parse(document.getElementById('adatok').textContent);
var uzenetek = [];
window.addEventListener('message', function (e) { if (e.data && e.data.proba) uzenetek.push(e.data); });
function kapu(ut, test) {
  return fetch(ut, { method: test ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Koino-Kulcs': KULCS },
    body: test ? JSON.stringify(test) : undefined }).then(function (r) { return r.json(); });
}
function varj(ms) { return new Promise(function (k) { setTimeout(k, ms); }); }
var OR = '<script>(function () { ["RTCPeerConnection", "webkitRTCPeerConnection", "RTCDataChannel"].forEach(function (k) {'
  + ' try { Object.defineProperty(window, k, { value: undefined, writable: false, configurable: false }); } catch (e) {} }); })();<\/script>';
function srcdoc(cimke, kod, cfg) {
  var meta = function (c) { return '<meta http-equiv="Content-Security-Policy" content="' + c + '">'; };
  var elo = cfg === 'K0' ? '' : cfg === 'K2' ? meta(A.nezetCsp + "; webrtc 'block'") : cfg === 'K3' ? meta(A.nezetCsp) + OR : meta(A.nezetCsp);
  var seged = 'var P = ' + JSON.stringify(cimke) + '; var KULCS = ' + JSON.stringify(KULCS) + '; var KULSO = ' + JSON.stringify(A.kulsoCim)
    + '; var UDP = ' + A.udp + '; var LAN = ' + JSON.stringify(A.lan) + '; var K = "http://" + KULSO + "/kulso?p=" + P + "&m=";'
    + ' function jel(n, e) { parent.postMessage({ proba: P, nev: n, ertek: String(e) }, "*"); } jel("fut", 1);';
  return '<!doctype html><html><head>' + elo + '<meta charset="utf-8"></head><body><p>nézet</p><script>' + seged
    + ' try { ' + kod + ' } catch (e) { jel("kivétel", e.name + ": " + e.message); }<\/script></body></html>';
}
function keret(cimke, kod, cfg) {
  var f = document.createElement('iframe');
  f.setAttribute('sandbox', 'allow-scripts');
  f.srcdoc = srcdoc(cimke, kod, cfg);
  f.width = 120; f.height = 60;
  document.getElementById('keretek').appendChild(f);
  return f;
}
async function kontroll() {
  // ⭐ A KONTROLL: egyáltalán eljut-e egy kérés a külvilágba ebben a böngészőben — a lapról magáról, egy NEM elszigetelt
  // keretből, és egy src-ből töltött keretből. Ha ezek sem jutnak ki, a „kifelé semmi” a böngészőé, nem az elszigetelésé.
  await kapu('/api/most', { p: B.oldal + '/kontroll' });
  var k = 'http://' + A.kulsoCim + '/kulso?p=' + B.oldal + '/kontroll&m=';
  new Image().src = k + 'lap-kep';
  fetch(k + 'lap-fetch', { mode: 'no-cors' }).catch(function () {});
  var n = document.createElement('iframe');
  n.srcdoc = '<img src="' + k + 'nyitott-keret-kep">';
  document.getElementById('keretek').appendChild(n);
  var s = document.createElement('iframe');
  s.src = k + 'keret-src';
  document.getElementById('keretek').appendChild(s);
  var t = document.createElement('iframe');
  t.src = '/api/nezet-oldal?kulcs=' + KULCS + '&p=' + B.oldal + '/kontroll-sajat';
  document.getElementById('keretek').appendChild(t);
  await varj(2500);
}
async function fut() {
  await kontroll();
  var probak = A.probak;
  var webrtcE = function (p) { return p[0].indexOf('webrtc') === 0; };
  for (var cfg of ['K0', 'K1', 'K2', 'K3']) {
    // a WebRTC-n kívül egyszerre (mindegyik a saját keretében) — a K2 és a K3 csak a WebRTC-t méri
    if (cfg === 'K0' || cfg === 'K1') {
      await kapu('/api/most', { p: B.oldal + '/' + cfg + '/egyutt' });
      var keretek = [];
      for (var i = 0; i < probak.length; i++) {
        if (webrtcE(probak[i])) continue;
        keretek.push(keret(B.oldal + '/' + cfg + '/' + probak[i][0], probak[i][1], cfg));
      }
      await varj(4000);
      keretek.forEach(function (f) { f.remove(); });
    }
    // a WebRTC egyenként (az UDP-csomagot az idő köti hozzá)
    var ws = probak.filter(webrtcE);
    for (var j = 0; j < ws.length; j++) {
      var cimke = B.oldal + '/' + cfg + '/' + ws[j][0];
      await kapu('/api/most', { p: cimke });
      var f = keret(cimke, ws[j][1], cfg);
      await varj(4000);
      f.remove();
    }
    await kapu('/api/most', { p: null });
  }
  // ⚠️ src-ből (nem srcdoc): a kapu fejléceivel (X-Frame-Options: DENY) betölthető-e egyáltalán?
  var s = document.createElement('iframe');
  s.setAttribute('sandbox', 'allow-scripts');
  s.src = '/api/nezet-oldal?kulcs=' + KULCS + '&p=' + B.oldal + '/src';
  document.getElementById('keretek').appendChild(s);
  await varj(2500);
  document.getElementById('all').textContent = 'kész — az eredmény a programnál';
  await kapu('/api/eredmeny', { oldal: B.oldal, ua: navigator.userAgent, uzenetek: uzenetek });
}
fut().catch(function (e) { document.getElementById('all').textContent = 'hiba: ' + e.message; });
`;

function lanCim() {
  for (const lista of Object.values(networkInterfaces())) {
    for (const c of lista ?? []) if (c.family === 'IPv4' && !c.internal) return c.address;
  }
  return '127.0.0.1';
}

async function elszigeteles() {
  kiir('');
  kiir('(b) A BÖNGÉSZŐ ELSZIGETELÉSE');
  const mappa = await mkdtemp(join(tmpdir(), 'koino-nezet-lap-'));
  mappak.push(mappa);

  // ----- a külvilág: egy HTTP-kiszolgáló és egy UDP-kapu, mindent naplóznak -----
  let most = null;
  const kulsoNaplo = [];                 // { p, m, mod, ido }
  const udpNaplo = [];                   // { p (a lap által épp futtatott), bajt, honnan }
  const kulso = createServer((keres, valasz) => {
    const u = new URL(keres.url, 'http://x');
    kulsoNaplo.push({ p: u.searchParams.get('p'), m: u.searchParams.get('m') ?? u.pathname, mod: keres.method, ido: Date.now() });
    valasz.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    valasz.end('<p>külső</p>');
  });
  kulso.on('upgrade', (keres, foglalat) => {
    const u = new URL(keres.url, 'http://x');
    kulsoNaplo.push({ p: u.searchParams.get('p'), m: 'websocket', mod: 'UPGRADE', ido: Date.now() });
    foglalat.destroy();
  });
  await new Promise((k) => kulso.listen(0, CEL === 'lan' ? '0.0.0.0' : '127.0.0.1', k));
  const udp = createSocket('udp4');
  udp.on('message', (b, honnan) => udpNaplo.push({ p: most, bajt: b.length, honnan: honnan.address }));
  await new Promise((k) => udp.bind(0, '0.0.0.0', k));
  const lan = lanCim();

  // ----- a kapu: a valódi, a lap helyzetében -----
  const kapuNaplo = [];                  // { ut, p, origin, kulcs }
  const eredmenyek = new Map();
  let kesz;
  const mind = new Promise((k) => { kesz = k; });
  const jelszo = randomBytes(24).toString('base64url');
  const kapu = await kapuNyitasa({
    mappa, port: 0, jelszo,
    jelszoMentes: (ut) => ut.startsWith('/api/nyilt/'),
    kezelo: async ({ modszer, utvonal, kereses, test }) => {
      if (utvonal === '/api/most') { most = test?.p ?? null; return { adat: { ok: true } }; }
      if (utvonal === '/api/eredmeny' && modszer === 'POST') {
        eredmenyek.set(test.oldal, test);
        if (eredmenyek.size === OLDALAKBOL.length) kesz();
        return { adat: { ok: true } };
      }
      if (utvonal === '/api/titok' || utvonal.startsWith('/api/nyilt/') || utvonal === '/api/nezet-oldal') {
        kapuNaplo.push({ ut: utvonal, p: kereses.get('p') });
        if (utvonal === '/api/nezet-oldal') {
          return { nyers: Buffer.from('<!doctype html><script>parent.postMessage({ proba: "src", nev: "fut", ertek: "1" }, "*")</script>'),
            tipus: 'text/html; charset=utf-8' };
        }
        return { adat: { titok: 'A-LAP-TITKA' } };
      }
      return null;
    }
  });
  // a kezelő nem látja a fejléceket — a kapu őrei előtte döntenek; a kapuNaplo tehát azt mondja: AZ ŐRÖKÖN ÁTJUTOTT.
  // ⭐ A NÉZET KÜLVILÁGA (`KOINO_MERES_CEL`): `hurok` — a 127.0.0.1 (a kiszolgáló naplóz); `lan` — a gép helyi hálózati címe (a
  // kiszolgáló naplóz); `teszt` — egy nyilvános, de nem létező cím (TEST-NET-1, 192.0.2.1 — csak a böngésző hálózati naplója mutatja,
  // elindult-e a kérés, és mi állította meg). ⚠️ A Chrome helyi-hálózat védelme (Local Network Access) a helyi címeket külön kezeli.
  const kulsoCim = CEL === 'teszt' ? '192.0.2.1' : (CEL === 'lan' ? lan : '127.0.0.1') + ':' + kulso.address().port;
  const adatok = { kulso: kulso.address().port, kulsoCim, udp: udp.address().port, lan, nezetCsp: NEZET_CSP, probak: PROBAK };
  for (const [nev, csp] of OLDALAKBOL) {
    const html = lapHtml(nev, csp).replace('<div id="keretek">',
      '<script type="application/json" id="adatok">' + JSON.stringify(adatok).replace(/</g, '\\u003c') + '</script><div id="keretek">');
    await writeFile(join(mappa, nev + '.html'), html);
  }
  kiir('  A külvilág (' + CEL + '): http://' + kulsoCim + ' · UDP ' + lan + ':' + adatok.udp);
  kiir('  Nyisd meg egyenként (a lap lefut, és visszaküldi az eredményt):');
  for (const [nev] of OLDALAKBOL) kiir('    http://127.0.0.1:' + kapu.port + '/' + nev + '.html?kulcs=' + jelszo);

  const idokorlat = Number(process.env.KOINO_MERES_VARAKOZAS ?? 900) * 1000;
  await Promise.race([mind, new Promise((k) => setTimeout(k, idokorlat))]);
  await new Promise((k) => setTimeout(k, 1500));          // a késve érkező kérések

  // ----- a táblázat -----
  for (const [oldal] of OLDALAKBOL) {
    const er = eredmenyek.get(oldal);
    kiir('');
    kiir('  === ' + oldal + (er ? ' — ' + er.ua : ' — ⚠️ nem jött eredmény'));
    if (!er) continue;
    const kontroll = kulsoNaplo.filter((k) => k.p === oldal + '/kontroll').map((k) => k.m);
    const sajat = kapuNaplo.some((k) => k.p === oldal + '/kontroll-sajat');
    kiir('  -- KONTROLL (nem elszigetelve): a külvilágba eljutott: ' + (kontroll.length ? [...new Set(kontroll)].join(', ') : '⚠️ SEMMI')
      + ' · a lap saját keretének kérése (a kapuhoz): ' + (sajat ? 'megérkezett' : '⚠️ nem érkezett meg'));
    const CFG_NEV = { K0: 'K0: csak sandbox', K1: 'K1: sandbox + a nézet CSP-je', K2: "K2: K1 + webrtc 'block'",
      K3: 'K3: K1 + őr-szkript (a WebRTC konstruktorai lefedve)' };
    for (const cfg of ['K0', 'K1', 'K2', 'K3']) {
      kiir('  -- ' + CFG_NEV[cfg]);
      for (const [pnev] of PROBAK) {
        if ((cfg === 'K2' || cfg === 'K3') && !pnev.startsWith('webrtc')) continue;
        const cimke = oldal + '/' + cfg + '/' + pnev;
        const jelek = er.uzenetek.filter((u) => u.proba === cimke);
        const futott = jelek.some((u) => u.nev === 'fut');
        const mondta = jelek.filter((u) => u.nev !== 'fut').map((u) => u.nev + '=' + u.ertek).join('; ');
        const ki = kulsoNaplo.filter((k) => k.p === cimke).map((k) => k.m);
        const kapun = kapuNaplo.filter((k) => k.p === cimke).map((k) => k.ut);
        const udpDb = pnev.startsWith('webrtc') ? udpNaplo.filter((u) => u.p === cimke).length : null;
        kiir('    ' + pnev.padEnd(20) + (futott ? '' : '⚠️ NEM FUTOTT ') + (mondta || '—')
          + (ki.length ? '  ⛔ KIJUTOTT: ' + [...new Set(ki)].join(',') : '  · kifelé semmi')
          + (kapun.length ? '  ⚠️ A KAPU KISZOLGÁLTA: ' + kapun.join(',') : '')
          + (udpDb !== null ? '  · UDP-csomag: ' + udpDb : ''));
      }
    }
    const src = er.uzenetek.some((u) => u.proba === 'src');
    const srcKapun = kapuNaplo.some((k) => k.p === oldal + '/src');
    kiir('  -- src-ből (a kapu fejléceivel): a kapu ' + (srcKapun ? 'kiszolgálta' : 'nem kapta meg') + ', a keretben ' + (src ? 'FUTOTT' : 'nem futott'));
    const kulonUdp = udpNaplo.filter((u) => u.p && u.p.startsWith(oldal + '/') && !u.p.includes('/webrtc')).length;
    if (kulonUdp) kiir('  -- UDP-csomag a WebRTC-n kívüli ablakban: ' + kulonUdp);
  }
  const nincsCimke = kulsoNaplo.filter((k) => !k.p);
  if (nincsCimke.length) kiir('  (a külvilág jel nélküli kérései: ' + nincsCimke.map((k) => k.m).join(', ') + ')');
  await kapu.zar();
  kulso.closeAllConnections?.();
  await new Promise((k) => kulso.close(k));
  udp.close();
}

// ===================================
// FUTTATÁS
// ===================================

try {
  if (process.argv[2] !== 'b') await nezetKartyaAMaiProgramon();
  if (process.argv[2] !== 'a') await elszigeteles();
} finally {
  for (const m of mappak) await rm(m, { recursive: true, force: true });
}
