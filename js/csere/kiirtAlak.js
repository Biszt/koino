// js/csere/kiirtAlak.js

// Felelősség: ⭐⭐ D124 ⑤ (PV5 (A) — `docs/protokoll_valtozat_atvizsgalas.md` 5. ⑥) — A KIÍRT ALAKOK NEMZEDÉKEI, egy helyen: melyik
// alakot hányadik változatban írja és olvassa a program, és MEDDIG a régit. Hálózatot NEM nyit, semmit nem ír ki (1. szabály): a
// kiírt alakok moduljai (`tabla.js`, `meghivoRekesz.js`, `cimjegyzek.js`, `keresoReteg.js`, `helyiFelfedezes.js`, `meghivo.js`)
// a változat számával számolnak, és a hívó innen kérdezi, melyik változatokkal.
//
// ===== MI A KIÍRT ALAK, ÉS MIÉRT MÁS =====
//
// Amit a program nem egy társnak MOND (a kopogás, a párbeszéd — ott a jel egyeztet: ①–④), hanem KITESZ, és egy ismeretlen,
// akár jövőbeli program olvas el: a hirdetőtábla rekesze és a meghívó rekesze (BEP 44), a DHT-témák (BEP 5 — a címjegyzék, a
// kopogtatók, a kereső-régiók), a helyi kiáltás, és a meghívó szövege. Itt nincs kézfogás, tehát egyeztetni sem lehet: ha az
// alak változik, a régi olvasó egyszerűen NEM TALÁLJA az újat (más só, más téma — és ezt semmi nem mondja ki).
//
// ===== A SZABÁLY (PV5 (A)) =====
//
//   · ⭐ AZ ALAK HORDOZZA A SZÁMÁT: a változat a HELYÉBEN van (a rekesz sójában, a téma lenyomatában, a kiáltás rejtett jelében,
//     a meghívó előtagjában), nem csak a tartalmában — egy rekeszbe egy érték fér, a két változat nem írhatja felül egymást;
//   · ⭐ AZ ÁTMENET ALATT MINDKETTŐT: amíg a régi lépés él (a jegyzékben, a dátumig), az író MINDEN élő változatban kiír (két
//     rekesz, két téma, két kiáltás), az olvasó mindegyiket nézi (a legújabbtól) — a régi olvasó a régit találja meg, az új az újat;
//   · ⭐ A MAI ALAKOK AZ 1-ESEK, BÁJTRA VÁLTOZATLANOK (a meghívóé a 2-es — az már eddig is számot hordott): ami ma nem mond
//     számot, az az 1-es (mint a nyelv jele, ①). Így ez a lépés maga NEM törés: a mai és a régebbi programok ugyanott keresnek.
//     A szám a 2-estől jelenik meg az alakban (`szamozatlanUtan`: `koino-tabla-so` → `koino-tabla-so-2`; ahol már eddig is szám
//     állt — `koino-cimjegyzek-1`, `koino-felfedezes-1`, `koino-cim-1`, `koino-belepo-1` —, ott az a szám nő).
//   · ⭐ AHOL A RÉGI OLVASÓ LÁTJA, OTT KI IS MONDJA: a kiáltás a 2-estől a `v` mezőt is viszi, a meghívó az előtagjában a számot —
//     a mai olvasó ezekből megnevezi, ha az alak újabb (`ujabb-alak`: frissíts) vagy régebbi (`regebbi-alak`). A rekeszeknél és a
//     témáknál a régi olvasó nem lát semmit (más helyen keres) — ezért kell az átmenet.
//
// ===== A JEGYZÉK =====
//
//   REGI_KIIRT_ALAKOK = { [alak]: { [n]: { meddig: 'ÉÉÉÉ-HH-NN' } } }
//
// Egy bejegyzés az n és az n+1 közti lépés: az n-es alakot a program a `meddig` napjáig még írja és olvassa (a dátum
// `valtozatDatum.js` — ugyanaz a számítás, mint a nyelvé). ⭐ MA ÜRES. A próbák egy KITALÁLT következővel mérik végig
// (`kitalaltKiirtKeszlet`, `KOINO_PROBAALAK=<napok>`: minden alak eggyel újabb, a régi lépés dátuma ennyi nap múlva — negatív:
// már lejárt, a program csak az újat írja és olvassa).
//
// ⚠️ A meghívó szövegét a program csak a LEGÚJABB alakban írja (a telepítő sor, ami viszi, mindig a legújabb programot hozza);
// a régit a dátumig OLVASSA (egy meghívó egy hónapig él — a törés előtt kiadottak is beilleszthetők maradnak).
// ⚠️ Ára: az átmenet alatt a kiírás kétszer megy (a táblára, a rekeszbe, a témákra) — a DHT-forgalom erre az időre kétszeres.
//
// Használják: a kiírt alakok moduljai (fent), koino.js (az írók és az olvasók, a `koino` parancs), próbák.

import { lepesLejarata, legregebbiBeszelt, napMulva, probaNapok } from './valtozatDatum.js';

// ===== A MAI ALAKOK =====

/** ⭐ A kiírt alakok legújabb változata — a mai program ezeket írja. Új számot csak az alak törése hoz (PV1). */
export const KIIRT_ALAKOK = Object.freeze({ tabla: 1, rekesz: 1, tema: 1, kialtas: 1, meghivo: 2 });

/** Az alakok neve a kimondáshoz (a `koino` parancs). */
export const KIIRT_ALAK_NEVEK = Object.freeze({
  tabla: 'tábla', rekesz: 'rekesz', tema: 'témák', kialtas: 'kiáltás', meghivo: 'meghívó'
});

/** ⭐ A régi kiírt alakok jegyzéke — MA ÜRES (minden alakból csak a legújabbat írjuk és olvassuk). */
export const REGI_KIIRT_ALAKOK = Object.freeze({});

const MAI_KIIRT_KESZLET = Object.freeze({ legujabb: KIIRT_ALAKOK, lepesek: REGI_KIIRT_ALAKOK });

/**
 * ⛔ Egy kiírt-alak készlet alakja (a betöltéskor és a próbákban): minden ismert alaknak van legújabb változata (pozitív egész), és
 * más alak nincs; a lépések 1 ≤ n < legújabb, mindegyiknek érvényes `meddig`-je van. Hibánál DOB — a hibás jegyzék programozási
 * hiba.
 */
export function kiirtKeszletEllenorzese(k) {
  const hiba = (m) => { throw new Error('A kiírt-alak készlet hibás: ' + m); };
  if (!k || typeof k !== 'object' || !k.legujabb || typeof k.legujabb !== 'object') hiba('nincs legújabb változat');
  for (const alak of Object.keys(KIIRT_ALAKOK)) {
    if (!Number.isSafeInteger(k.legujabb[alak]) || k.legujabb[alak] < 1) hiba('a(z) „' + alak + '” legújabb változata nem pozitív egész');
  }
  for (const alak of Object.keys(k.legujabb)) if (!(alak in KIIRT_ALAKOK)) hiba('ismeretlen alak: „' + alak + '”');
  for (const [alak, lepesek] of Object.entries(k.lepesek ?? {})) {
    if (!(alak in KIIRT_ALAKOK)) hiba('ismeretlen alak a jegyzékben: „' + alak + '”');
    for (const [nev, l] of Object.entries(lepesek ?? {})) {
      const n = Number(nev);
      if (!Number.isSafeInteger(n) || String(n) !== nev || n < 1 || n >= k.legujabb[alak]) {
        hiba('a(z) „' + alak + '” lépésének száma (' + nev + ') nem 1 és a legújabb közé esik');
      }
      if (Number.isNaN(lepesLejarata(l?.meddig))) hiba('a(z) „' + alak + '” ' + n + '. lépésének dátuma (' + l?.meddig + ') nem ÉÉÉÉ-HH-NN');
    }
  }
  return k;
}
kiirtKeszletEllenorzese(MAI_KIIRT_KESZLET);

/**
 * ⭐ A kiírt-alak készlet — a mai, a hívóé (`beallitas.kiirtKeszlet` — a próbáknak), vagy a kitalált következő
 * (`KOINO_PROBAALAK=<napok>` — csak próbának, mint a `KOINO_PROBANYELV`).
 */
export function kiirtKeszlet(beallitas) {
  if (beallitas?.kiirtKeszlet && typeof beallitas.kiirtKeszlet === 'object') return beallitas.kiirtKeszlet;
  const napok = probaNapok('KOINO_PROBAALAK');
  return napok === null ? MAI_KIIRT_KESZLET : kitalaltKiirtKeszlet(napok);
}

/**
 * ⭐⭐ AZ ÉLŐ VÁLTOZATOK egy alakból — a legújabbtól a legrégebbi még élőig (a sorrend számít: az író mindegyikbe ír, az olvasó a
 * legújabbal kezd).
 * @param {'tabla'|'rekesz'|'tema'|'kialtas'|'meghivo'} alak
 * @param {Object} [beallitas]
 * @param {number} [most]
 * @returns {number[]} pl. `[1]` (ma), `[2, 1]` (az átmenet alatt)
 */
export function eloAlakok(alak, beallitas, most = Date.now()) {
  const k = kiirtKeszlet(beallitas);
  const legujabb = k.legujabb?.[alak];
  if (!Number.isSafeInteger(legujabb)) throw new Error('ismeretlen kiírt alak: ' + alak);
  const egy = { legujabb, lepesek: k.lepesek?.[alak] ?? {} };
  const ki = [];
  for (let n = legujabb, also = legregebbiBeszelt(egy, most); n >= also; n--) ki.push(n);
  return ki;
}

/**
 * ⭐ Egy olvasott alak iránya az élő változatokhoz képest: null (él — olvassuk), 'ujabb' (újabb programtól jött: frissíts) vagy
 * 'regebbi' (a régi lépése lejárt, vagy sosem volt).
 * @param {number} n
 * @param {number[]} elok - `eloAlakok(...)`
 */
export function alakIranya(n, elok) {
  if (elok.includes(n)) return null;
  return n > elok[0] ? 'ujabb' : 'regebbi';
}

/**
 * ⭐ A számozott címke, ahol a mai alak NEM hordott számot: az 1-es a mai szöveg (bájtra — a régi program ezt számolja), a
 * 2-estől `alap-n`.
 */
export function szamozatlanUtan(alap, n) {
  return n === 1 ? alap : alap + '-' + n;
}

/** A készülék kiírt alakjai a kimondáshoz: `tábla 1 · rekesz 1 · témák 1 · kiáltás 1 · meghívó 2` (az átmenetben `1–2`). */
export function kiirtAlakokKepe(beallitas, most = Date.now()) {
  return Object.keys(KIIRT_ALAKOK).map((alak) => {
    const e = eloAlakok(alak, beallitas, most);
    return KIIRT_ALAK_NEVEK[alak] + ' ' + (e.length === 1 ? String(e[0]) : e[e.length - 1] + '–' + e[0]);
  }).join(' · ');
}

// ===== ⚠️ A KITALÁLT KÖVETKEZŐ — CSAK PRÓBÁNAK =====

/**
 * ⚠️ CSAK PRÓBÁNAK: minden alak eggyel újabb (a tábla, a rekesz, a témák és a kiáltás 2-es, a meghívó 3-as), a régi lépés dátuma
 * `napok` múlva. A kitalált alak csak a SZÁMÁBAN más (más só, más téma, más rejtett jel, más előtag — a tartalom ugyanaz): épp az,
 * amit a szabály mér — hogy a régi olvasó a régit, az új az újat találja meg.
 * @param {number} napok
 * @param {number} [most]
 */
export function kitalaltKiirtKeszlet(napok, most = Date.now()) {
  const meddig = napMulva(napok, most);
  const legujabb = {}, lepesek = {};
  for (const [alak, n] of Object.entries(KIIRT_ALAKOK)) {
    legujabb[alak] = n + 1;
    lepesek[alak] = { [n]: { meddig } };
  }
  return kiirtKeszletEllenorzese({ kitalalt: true, legujabb, lepesek });
}
