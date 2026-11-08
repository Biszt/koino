// js/felulet/nezetFelulet.js

// Felelősség: ⭐⭐ A NÉZET-FELÜLET (D126 — a D123 PR4-e, NZ3–NZ6) a program oldalán: hogyan fut egy feltöltött nézet a lapon, és mit
// kérdezhet. Két dolog, egy helyen, mert együtt alkotják a nézet és a lap közötti szerződést:
//
//   · ⭐ A KERET TARTALMA (a 92. mérés négy rétegéből a kettő, ami a keret BELSEJÉBE kerül): a nézet kódja elé a CSP (minden
//     betöltés zárva — a nézet nem tudja feloldani: egy második, engedékenyebb CSP-t a böngésző a szigorúbbal metszi) és az ŐR (a
//     WebRTC ellen, amit egyik CSP sem fog meg — a Chrome a `webrtc 'block'`-ot nem ismeri), és a KLIENS (a `koinoNezet` objektum —
//     a kérdés és a válasz `postMessage`-en). A másik két réteg a lapé: a keret `sandbox="allow-scripts"` (`koinoNezetKeret.js`), és
//     a lap `frame-src 'none'`-ja (a kapu fejléce — `kapu.js`).
//   · ⭐ A KÉRDÉS-KÉSZLET (NZ4 (A)): egy külön, kicsi, SZÁMOZOTT felület (`NEZET_FELULET` — ma az 1-es), nem a lap belső útjai — azok
//     szabadon változnak (R4), és minden változásuk eltörné a nézeteket. A nézet a koinó KÖZÖS képét látja és azt, hogy melyik az én
//     kulcsom, a pontjaimmal (NZ3 (A)); meghívót, társat, értesítést, telepítést, kulcsot nem — írni nem tud (NZ6 (A): olvas, és
//     kérheti, hogy a lap megnyisson egy kártyát).
//
// ⚠️ A lap a nézet kérdéseit EGY úton adja tovább (`/api/nezet/kerdes`), a választ ez a fájl formálja (`nezetEntitasa` — csak a
// kimondott mezők mennek ki, egy új pakli-mező magától nem). A `fajl` kérdést és a `megnyit`-ot a lap maga válaszolja (a fájl a
// lenyomatával jön — a lenyomat a jogosultság, mint egy `<img>`-nél —, a megnyitás a lap dolga).
//
// Használják: koino.js (a lap útjai), meres/nezetProba.js.

import { RENDEZESEK } from '../allapot/pakli.js';

/** ⭐ A nézet-felület változata (NZ4): ha egyszer törik, egy új szám — és a lap a régit egy kimondott dátumig tartja (mint a D124). */
export const NEZET_FELULET = 1;

/** A kérdések, amiket a program válaszol (a lap a `fajl`-t és a `megnyit`-ot maga — `NEZET_LAP_KERDESEI`). */
export const NEZET_KERDESEK = Object.freeze(['koino', 'en', 'entitasok', 'szoveg']);
/** A kérdések, amiket a lap maga válaszol. */
export const NEZET_LAP_KERDESEI = Object.freeze(['fajl', 'megnyit']);

/** Egy `entitasok` kérdés legfeljebb ennyit ad egyszerre (a többit a `kovetkezo` kurzorral — 9. szabály). */
export const NEZET_LAP_DARAB = 100;

/**
 * ⭐ A bekapcsolás előtt kimondjuk (a lap ablaka és a `nezet be` parancs ugyanezt mondja): mit lát a nézet, mit nem, és hogy a rajza
 * nem bizonyíték.
 */
export const NEZET_KIMONDAS = Object.freeze({
  latja: 'a koinó közös képét (a kártyákat, a pontokat, a javaslatok állását, a szövegeket és a csatolt fájlokat), és hogy melyik a '
    + 'te kulcsod, a pontjaiddal',
  nemLatja: 'a lap jelszavát és a kulcsodat nem kapja, írni nem tud (pontot, javaslatot, szavazatot nem tesz), meghívót, társat, '
    + 'értesítést nem lát, és kifelé nem szólhat (a böngészőben mért kijutási utak zárva)',
  hamisRajz: 'Egy feltöltött nézet hamis rajzot is adhat — a döntés a lap saját kártyáin van.'
});

// ===================================
// A KERET TARTALMA — a CSP, az őr, a kliens és a kód
// ===================================

/**
 * ⭐ A nézet CSP-je (92. mérés, K1): minden betöltés zárva — a nézet saját szkriptje és stílusa fut, képet és betűt csak `data:` /
 * `blob:` címről mutathat (a fájlt a lap bájtokban adja, abból a nézet `blob:`-ot csinál). ⛔ `connect-src`, `form-action`,
 * `frame-src`, `worker-src` a `default-src 'none'`-ból: zárva.
 */
export const NEZET_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; "
  + "font-src data:; media-src data: blob:; base-uri 'none'; form-action 'none'";

/**
 * ⭐ Az ŐR (92. mérés, K3): a nézet kódja ELŐTT fut, és nem konfigurálható, nem írható tulajdonsággal fedi le a WebRTC belépőit —
 * a nézet így nem nyithat UDP-utat kifelé. Egy friss belső kerettel sem kerülhető meg (az a nézetnek idegen eredet; és a CSP a
 * keretet amúgy is tiltja).
 */
export const NEZET_OR = '(function () { ["RTCPeerConnection", "webkitRTCPeerConnection", "RTCDataChannel", "RTCRtpSender", '
  + '"RTCRtpReceiver", "RTCIceCandidate", "RTCSessionDescription"].forEach(function (k) { try { Object.defineProperty(window, k, '
  + '{ value: undefined, writable: false, configurable: false }); } catch (e) {} }); })();';

/**
 * ⭐ A KLIENS — a `koinoNezet` objektum a nézetben: `kerdez(kerdes, adat)` → ígéret a válaszra; `figyel(esemeny, fv)` (ma a
 * `valtozas`: a csere újat hozott). A lapnak `postMessage`-en szól (`{ koinoNezet: 1, id, kerdes, adat }`), és csak a szülője
 * üzenetére figyel. Nem írható felül (a nézet kódja ez után fut).
 */
export const NEZET_KLIENS = '(function () { "use strict"; var V = ' + NEZET_FELULET + '; var varok = {}; var szam = 0; var figyelok = {};'
  + ' window.addEventListener("message", function (e) { if (e.source !== window.parent) return; var u = e.data;'
  + ' if (!u || typeof u !== "object" || u.koinoNezet !== V) return;'
  + ' if (u.id != null && varok[u.id]) { var v = varok[u.id]; delete varok[u.id]; if (u.hiba != null) v[1](new Error(String(u.hiba))); else v[0](u.valasz); return; }'
  + ' if (typeof u.esemeny === "string" && figyelok[u.esemeny]) figyelok[u.esemeny].forEach(function (f) { try { f(u.adat); } catch (x) {} }); });'
  + ' var k = { valtozat: V,'
  + ' kerdez: function (kerdes, adat) { return new Promise(function (jo, rossz) { var id = ++szam; varok[id] = [jo, rossz];'
  + ' window.parent.postMessage({ koinoNezet: V, id: id, kerdes: String(kerdes), adat: adat === undefined ? null : adat }, "*"); }); },'
  + ' figyel: function (esemeny, fv) { if (typeof fv === "function") (figyelok[esemeny] = figyelok[esemeny] || []).push(fv); } };'
  + ' try { Object.defineProperty(window, "koinoNezet", { value: Object.freeze(k), writable: false, configurable: false }); } catch (e) {} })();';

/**
 * ⭐ A keret teljes tartalma (`srcdoc`): a CSP és az őr a LEGELEJÉN (a böngésző a fejbe teszi őket, mielőtt a nézet bármit futtatna),
 * a kliens, és a nézet kódja változatlanul.
 * @param {string} kod - a nézet HTML-je
 * @returns {string}
 */
export function nezetKeretTartalma(kod) {
  return '<!DOCTYPE html><meta http-equiv="Content-Security-Policy" content="' + NEZET_CSP + '">'
    + '<script>' + NEZET_OR + '<\/script><script>' + NEZET_KLIENS + '<\/script>\n' + String(kod ?? '');
}

// ===================================
// A VÁLASZOK ALAKJA — csak a kimondott mezők
// ===================================

const egesz = (x) => (Number.isSafeInteger(x) ? x : 0);
const szoveg = (x) => (typeof x === 'string' ? x : null);
const besorolas = (b) => (b && typeof b === 'object' ? { azonosito: szoveg(b.azonosito), nev: szoveg(b.nev) } : null);

/**
 * ⭐ Egy entitás a nézetnek (NZ3 (A)): a közös kép mezői és a saját pontom — a pakli kártyájából, mezőnként kimondva. ⛔ Ami nincs
 * itt, az nem megy ki (a lap belső mezői — a tartás, a felderítés, az értesítések számlálója — nem).
 * @param {Object} k - egy `pakliOldal` kártya
 */
export function nezetEntitasa(k) {
  const j = k?.javaslat ?? null;
  return {
    azonosito: szoveg(k?.azonosito),
    tipus: szoveg(k?.tipus),
    cim: szoveg(k?.cim) ?? '',
    szulo: szoveg(k?.szulo),
    gondolatTipus: besorolas(k?.gondolatTipus),
    kategoriak: (Array.isArray(k?.kategoriak) ? k.kategoriak : []).map(besorolas).filter(Boolean),
    osszesPont: egesz(k?.osszesPont),
    agazatiPont: egesz(k?.agazatiPont),
    hozzajarulok: egesz(k?.hozzajarulok),
    sajatPont: egesz(k?.sajatPont),
    szerzo: szoveg(k?.szerzo),
    letrehozva: Number.isFinite(k?.letrehozva) ? k.letrehozva : null,
    vanSzoveg: k?.vanSzoveg === true,
    javaslat: j ? {
      fajta: szoveg(j.fajta),
      muvelet: szoveg(j.muvelet),
      statusz: szoveg(j.statusz),
      erintett: szoveg(j.erintett),
      erintettek: (Array.isArray(j.erintettek) ? j.erintettek : []).map((r) => ({ entitas: szoveg(r?.entitas), muvelet: szoveg(r?.muvelet) })),
      dontesiIdo: Number.isFinite(j.dontesiIdo) ? j.dontesiIdo : null,
      lezarasIdeje: Number.isFinite(j.lezarasIdeje) ? j.lezarasIdeje : null,
      tamogatottsagEzrelek: egesz(j.tamogatottsagEzrelek),
      ellenzoiEzrelek: egesz(j.ellenzoiEzrelek),
      tartozkodoiEzrelek: egesz(j.tartozkodoiEzrelek),
      reszveteliEzrelek: egesz(j.reszveteliEzrelek),
      egyezmeny: !!j.egyezmeny
    } : null
  };
}

/**
 * Egy kérdés alakja (a lapról jön, a nézet szava): melyik kérdés, és az adata — a hibásat megnevezve elutasítjuk.
 * @param {*} kerdes
 * @param {*} adat
 * @returns {{kerdes: string, adat: Object}|{hiba: string}}
 */
export function nezetKerdesAlakja(kerdes, adat) {
  if (!NEZET_KERDESEK.includes(kerdes)) {
    return { hiba: 'Ismeretlen kérdés a nézet-felületen (' + NEZET_FELULET + '): ' + String(kerdes).slice(0, 40) };
  }
  const a = adat && typeof adat === 'object' && !Array.isArray(adat) ? adat : {};
  if (kerdes === 'szoveg' && (typeof a.azonosito !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(a.azonosito))) {
    return { hiba: 'A `szoveg` kérdéshez egy entitás azonosítója kell.' };
  }
  if (kerdes === 'entitasok') {
    const darab = Number.isSafeInteger(a.darab) ? Math.min(Math.max(a.darab, 1), NEZET_LAP_DARAB) : NEZET_LAP_DARAB;
    // a sorrend a pakli négy rendezése közül (alapból a fa sorrendje: a szülő a gyermekei előtt)
    const rendezes = a.rendezes === undefined || a.rendezes === null ? 'hierarchikus' : a.rendezes;
    if (!RENDEZESEK.includes(rendezes)) return { hiba: 'Ismeretlen rendezés: ' + String(rendezes).slice(0, 40) + ' — választható: ' + RENDEZESEK.join(', ') };
    const irany = a.irany === 'csokkeno' || (a.irany == null && rendezes !== 'hierarchikus') ? 'csokkeno' : 'novekvo';
    return { kerdes, adat: { kurzor: typeof a.kurzor === 'string' ? a.kurzor.slice(0, 1024) : null, darab, rendezes, irany } };
  }
  return { kerdes, adat: kerdes === 'szoveg' ? { azonosito: a.azonosito } : {} };
}
