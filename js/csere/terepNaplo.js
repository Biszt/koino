// js/csere/terepNaplo.js

// Felelősség: ⭐⭐ D130 (⑤a — `docs/koinon_atvizsgalas.md` 14.; KO20 (A), KO21 (A)): A TEREP MŰSZEREI — tiszta függvények (hálózat
// és lemez nélkül — 1. szabály). A ④ minden száma modellen áll (a 96.–99. mérés elérhetőségi mintái feltevések, a KO17 ráhagyása a 98.
// mérés rosszabb esetéből); a terep méri meg, mennyire igaz. Ehhez három helyi napló kell — mind HELYI feljegyzés (nem esemény, nem
// terjed — 3. szabály), korlátos (9. szabály), és csak a `terep be` után ír (egy hétköznapi készüléken semmi nem gyűlik):
//   · a FENT-SZAKASZOK — mikor futott az őrjárat (percre pontosan; az indítók 1 perces körével), a külső címem lenyomatával;
//   · a SZÁMLÁLÁS naplója — a kosaraim minden számlálása (az idő, a kosár, a látott szám, a látott címek lenyomata);
//   · a PÓTLÁS naplója — minden pótlás (az indulás, a párján jelentkezés, a döntés, a felkérés sorsa).
// ⭐ Nyers IP-cím nem kerül a fájlba: a cím LENYOMATA a koino sójával (`cimLenyomata`) — a terep készülékei egymás címét így is
// párosítják (ugyanaz a só), de a fájlból a cím nem olvasható ki.
// És a TEREP-ELEMZÉS (`terepElemzese`): több készülék kivitt naplójából (`terep kivisz`) az elérhetőség profilja, a DHT KÉSÉSE (a
// látott címek közül ki volt valóban fent — és aki nem, mióta nem), a pótlások és a kosarak összegzése.
//
// Használják: a `koino.js` (az őrjárat és a `terep` parancs), a `meres/terepElemzes.js`, a próbák (`meres/terepProba.js`).

import { createHash } from 'node:crypto';
import { cimNormalizalasa } from './tarsak.js';

export const TEREP_FAJTA = 'koino-terep-1';
const SO = 'koino-terep-1';
/** A naplók korlátai (9. szabály): egy hét bőven belefér (a számlálás ~20 percenként kosaranként — egy hét ~500–1000). */
export const FENT_KORLAT = 2000;
export const SZAMLALAS_KORLAT = 4000;
export const POTLAS_KORLAT = 1000;
/** Egy számlálásnál legfeljebb ennyi lenyomat (egy kis terep-koinoban néhány cím — a korlát a nagy témák ellen). */
export const LENYOMAT_KORLAT = 50;
/** Ennyi szünet még ugyanaz a fent-szakasz (az indítók 1 perces köre — a házimunka ennél gyakrabban ír). */
export const FENT_TURES = 5 * 60 * 1000;

/**
 * Egy cím LENYOMATA a koino sójával (12 jel) — a fájlba ez kerül, nem a cím. Null, ha nem cím.
 * @param {string} koino
 * @param {string} cim
 * @returns {string|null}
 */
export function cimLenyomata(koino, cim) {
  const c = cimNormalizalasa(cim);
  if (!c) return null;
  return createHash('sha256').update(SO + '|' + String(koino) + '|' + c).digest('base64url').slice(0, 12);
}

/** Egy készülék lenyomata (a tábla-aláírójából — a kivitt fájlban a készülék neve). */
export function keszulekLenyomata(koino, alairo) {
  return createHash('sha256').update(SO + '|keszulek|' + String(koino) + '|' + String(alairo)).digest('base64url').slice(0, 12);
}

const LENYOMAT_MINTA = /^[A-Za-z0-9_-]{12}$/;
const lenyomatE = (x) => typeof x === 'string' && LENYOMAT_MINTA.test(x);
const jelE = (x) => typeof x === 'string' && /^\d{1,3}:\d{1,44}$/.test(x);

/** A fent-szakaszok (lemezről olvasva): `[[kezdet, vég, a külső cím lenyomata vagy null], …]`, a hibás kiesik. */
export function fentAlakja(x) {
  return (Array.isArray(x) ? x : [])
    .filter((s) => Array.isArray(s) && Number.isFinite(s[0]) && Number.isFinite(s[1]) && s[1] >= s[0] && (s[2] === null || lenyomatE(s[2])))
    .map((s) => [s[0], s[1], s[2]])
    .slice(-FENT_KORLAT);
}

/**
 * A fent-szakasz bővítése: ha a legutolsó szakasz vége legfeljebb `FENT_TURES` régi, és a külső cím lenyomata ugyanaz, a vége most;
 * különben új szakasz `[most, most, k]`. Korlátos (a legrégebbi esik ki).
 * @param {Array} fent @param {{most: number, k?: string|null}} b
 * @returns {Array} az új lista
 */
export function fentFeljegyzes(fent, { most, k = null }) {
  const lista = fentAlakja(fent);
  const u = lista[lista.length - 1];
  if (u && most >= u[1] && most - u[1] <= FENT_TURES && u[2] === k) u[1] = most;
  else if (!u || most >= u[1]) lista.push([most, most, k]);
  return lista.slice(-FENT_KORLAT);
}

/** A napló (lemezről olvasva): a számlálás és a pótlás bejegyzései, a hibás kiesik. */
export function naploAlakja(x) {
  const szamlalas = (Array.isArray(x?.szamlalas) ? x.szamlalas : [])
    .filter((s) => s && Number.isFinite(s.t) && jelE(s.k) && Number.isInteger(s.l) && Number.isInteger(s.c) && Array.isArray(s.a))
    .map((s) => ({ t: s.t, k: s.k, l: s.l, c: s.c, sz: [0, 1, 2].includes(s.sz) ? s.sz : 0, a: s.a.filter(lenyomatE).slice(0, LENYOMAT_KORLAT) }))
    .slice(-SZAMLALAS_KORLAT);
  const potlas = (Array.isArray(x?.potlas) ? x.potlas : [])
    .filter((p) => p && Number.isFinite(p.t) && typeof p.e === 'string' && jelE(p.k))
    .slice(-POTLAS_KORLAT);
  return { szamlalas, potlas };
}

/**
 * Egy számlálás bejegyzése: a kosár jele (`m:d`), a látott szám és a cél, hogy a szülőre (1) / a nagyszülőre (2) is ránézett-e, és a
 * látott címek lenyomata (legfeljebb `LENYOMAT_KORLAT`).
 */
export function szamlalasBejegyzes({ most, jel, latott, cel, szulovel = false, nagyszulovel = false, cimek = [], koino }) {
  const a = [...new Set([...cimek].map((c) => cimLenyomata(koino, c)).filter(Boolean))].slice(0, LENYOMAT_KORLAT);
  return { t: most, k: jel, l: latott, c: cel, sz: nagyszulovel ? 2 : szulovel ? 1 : 0, a };
}

/** Egy bejegyzés hozzáadása egy korlátos listához. */
export function hozzafuz(lista, bejegyzes, korlat) {
  return [...(Array.isArray(lista) ? lista : []), bejegyzes].slice(-korlat);
}

// ===================================
// A TEREP-ELEMZÉS
// ===================================

const PERC = 60 * 1000;
const medianja = (t) => { if (!t.length) return null; const s = [...t].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/** Egy kivitt fájl (a `terep kivisz` eredménye) alakja — vagy null. */
export function kivitelAlakja(x) {
  if (!x || x.fajta !== TEREP_FAJTA || typeof x.koino !== 'string' || !lenyomatE(x.keszulek)) return null;
  return { koino: x.koino, keszulek: x.keszulek, ido: Number.isFinite(x.ido) ? x.ido : 0, fent: fentAlakja(x.fent), ...naploAlakja(x) };
}

/**
 * ⭐ A TEREP-ELEMZÉS több készülék kivitt naplójából.
 * @param {Array<Object>} kivitelek - a `terep kivisz` fájljai (egy koinoból)
 * @param {{ora?: Function}} [b] - a napszak (0–23) egy időponthoz (alapból a helyi óra; a próba egy rögzítettet ad)
 * @returns {Object} készülékenként az elérhetőség (az arány és a napszakos profil), a DHT késése (a terep-készülékek látott címeinél: hány
 *   volt valóban fent, a nem fent lévők késése percben — medián és legnagyobb —, és hány cím idegen), a pótlások és a kosarak összegzése
 */
export function terepElemzese(kivitelek, { ora = (t) => new Date(t).getHours() } = {}) {
  const k = (Array.isArray(kivitelek) ? kivitelek : []).map(kivitelAlakja).filter(Boolean);
  const koinok = [...new Set(k.map((x) => x.koino))];
  // ===== 1. AZ ELÉRHETŐSÉG — percenként: fent volt-e (a fent-szakaszok szerint), a TEREP EGÉSZ IDEJE alatt (az összes készülék első
  // és utolsó bejegyzése között — ⚠️ nem a készülék saját első és utolsó bejegyzése között: úgy egy egyszer fent lévő készülék 100% volna)
  const mind = k.flatMap((x) => x.fent);
  const ablakKezdet = mind.length ? Math.min(...mind.map((s) => s[0])) : null;
  const ablakVeg = mind.length ? Math.max(...mind.map((s) => s[1])) : null;
  const keszulekek = k.map((x) => {
    const fent = [...x.fent].sort((p, q) => p[0] - q[0]);
    const kezdet = fent.length ? fent[0][0] : null;
    const veg = fent.length ? Math.max(...fent.map((s) => s[1])) : null;
    const osszOra = new Array(24).fill(0), fentOra = new Array(24).fill(0);
    let osszPerc = 0, fentPerc = 0;
    if (ablakKezdet !== null) {
      let i = 0;
      for (let t = ablakKezdet; t <= ablakVeg; t += PERC) {
        while (i < fent.length && fent[i][1] < t) i++;
        const f = i < fent.length && fent[i][0] <= t && t <= fent[i][1];
        const o = ora(t);
        osszOra[o]++; osszPerc++;
        if (f) { fentOra[o]++; fentPerc++; }
      }
    }
    return { keszulek: x.keszulek, szakaszok: fent.length, kezdet, veg, arany: osszPerc ? fentPerc / osszPerc : null,
      profil: osszOra.map((n, o) => (n ? fentOra[o] / n : null)), fent,
      cimek: new Set(fent.map((s) => s[2]).filter(Boolean)) };
  });
  const cimGazdaja = new Map();
  for (const d of keszulekek) for (const c of d.cimek) cimGazdaja.set(c, d);
  const fentVolt = (d, t) => d.fent.some((s) => s[0] - FENT_TURES <= t && t <= s[1] + FENT_TURES);
  const utolsoVege = (d, t) => { let v = null; for (const s of d.fent) if (s[1] <= t && (v === null || s[1] > v)) v = s[1]; return v; };
  // ===== 2. A DHT KÉSÉSE — a számlálások látott címei közül a terep-készülékeké =====
  let fentDb = 0, nemFentDb = 0, idegenDb = 0, sosemDb = 0;
  const kesesek = [];
  for (const x of k) {
    const sajat = keszulekek.find((d) => d.keszulek === x.keszulek);
    for (const s of x.szamlalas) {
      for (const l of s.a) {
        const d = cimGazdaja.get(l);
        if (!d) { idegenDb++; continue; }
        if (d === sajat) continue;
        if (fentVolt(d, s.t)) { fentDb++; continue; }
        const v = utolsoVege(d, s.t);
        if (v === null) { sosemDb++; continue; }
        nemFentDb++;
        kesesek.push((s.t - v) / PERC);
      }
    }
  }
  // ===== 3. A PÓTLÁSOK =====
  const potlasok = k.flatMap((x) => x.potlas);
  const db = (e) => potlasok.filter((p) => p.e === e).length;
  const parjan = potlasok.filter((p) => p.e === 'parjan');
  const dontesek = potlasok.filter((p) => p.e === 'dontes');
  // ===== 4. A KOSARAK — a látott szám és a cél =====
  const kosarak = new Map();
  for (const s of k.flatMap((x) => x.szamlalas)) {
    const y = kosarak.get(s.k) ?? { jel: s.k, db: 0, kevesDb: 0, latott: [] };
    y.db++; if (s.l < s.c) y.kevesDb++; y.latott.push(s.l);
    kosarak.set(s.k, y);
  }
  return {
    koinok,
    keszulekek: keszulekek.map(({ fent, cimek, ...d }) => ({ ...d, cimek: cimek.size })),
    keses: { fent: fentDb, nemFent: nemFentDb, sosem: sosemDb, idegen: idegenDb, median: medianja(kesesek),
      legnagyobb: kesesek.length ? Math.max(...kesesek) : null, percek: kesesek },
    potlas: { indult: db('indult'), nincs: db('nincs'), parjan: parjan.length, dontes: dontesek.length,
      valasztott: dontesek.filter((p) => p.v === true).length, felkeres: db('felkeres'),
      kozvetlenFelelt: parjan.reduce((a, p) => a + (Number.isInteger(p.f) ? p.f : 0), 0),
      kozvetlenKerdezett: parjan.reduce((a, p) => a + (Number.isInteger(p.n) ? p.n : 0), 0) },
    kosarak: [...kosarak.values()].map((y) => ({ jel: y.jel, db: y.db, kevesDb: y.kevesDb, median: medianja(y.latott) }))
  };
}
