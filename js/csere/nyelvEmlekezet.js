// js/csere/nyelvEmlekezet.js

// Felelősség: ⭐⭐ D124 ③ — AKIVEL NEM ÉRTJÜK EGYMÁST (a D123 PR6-ja, az építés ③-a; `docs/protokoll_valtozat_atvizsgalas.md` 5. ③):
// társanként megjegyezve, órákig nem hívva, és kimondva — a lap alsó sávja és a `koino` parancs ebből mondja meg, hány társad fut
// régebbi vagy újabb programot, és mi a teendő.
//
// ===== MIT JEGYEZ =====
//
// Az őrjárat körének eredményeit (a kapu `kopog`-jának `eredmenyek`-jét): ha egy célnál nincs közös SZÁLLÍTÁS (a kopogás jele, ②)
// vagy közös NYELV (a munka első üzenetének jele, ①), az egy megfigyelés (`nincsKozos` — az iránnyal: a társ régebbi / újabb).
// ⭐ Társanként: a kötés tábla-aláírója alatt (egy társ több címe egy bejegyzés), a névtelen célnál a cím alatt.
//
// ⛔ NEM EGY CSOMAGRA (a ② tanulsága): a kopogás nem hitelesített — egy hamis „nincs közös” egy kört elvehet. Ezért a társ csak
// `NEM_ERTJUK_HATAR` EGYMÁS UTÁNI kör után kerül szünetre (mint a kopogtatók kudarc-számlálója, M3 (a)), és a lap is csak a
// megerősítetteket számolja. A szünet után a kör újra hívja — ha még mindig nem értjük egymást, egy megfigyelés is újra szünetet ad.
//
// ⭐ AMI TÖRLI: bármelyik munka, ami lement vele (a kör sikeres célja, vagy egy bekopogó munka — a hívó a társ aláírójával és a
// címével jelzi). Ha a társ frissített, és ő kopog be, a bejegyzés így azonnal eltűnik — a mi szünetünk őt nem zárja ki: a kapu a
// kopogására mindig felel.
//
// ⛔ Helyi feljegyzés, nem esemény: nem terjed, semmit nem dönt el a koinóban (3. szabály) — csak azt, kire kopogunk. Korlátos
// (`NEM_ERTJUK_KORLAT`), és a rég nem látott bejegyzés elévül (`NEM_ERTJUK_LATSZIK`). Készülék-szintű: a nyelv a programé, nem a
// koinóé (a család minden koinója ugyanazon a kapun beszél).
//
// ===== ⭐⭐ D124 ④ (⑦): AKIVEL MÉG A RÉGIN BESZÉLÜNK =====
//
// Ha egy munka a társsal a mi legújabbunknál RÉGEBBI nyelven vagy szállításon ment le (a fordító-szél, a kézfogás-választó), a
// társ csak a régit beszéli (a közös a két legújabb közül a kisebbik). Amíg a régi lépésünk dátuma messze van, ez rendben van —
// csendben fordítunk; ha `REGIN_ELORE_NAP` napon belül jön, a lap és a parancs kimondja: utána nem cseréltek, amíg nem frissít. A
// bejegyzés a `regin` alatt (társanként: a tábla-aláíró, különben a cím), a legutóbbi munka szerint; ha a közös a legújabb,
// törlődik. Ugyanaz az elévülés és korlát, mint a „nem értjük”-é.
//
// Hálózatot nem importál, fájlt nem ír (a tároló a `fajlTar.js`-é: `nyelvJegyzekTarolo`). Használja: koino.js (az őrjárat köre, a
// munka, a lap `/api/csere-allapot`-ja, a `koino` parancs), a próbák (`meres/nyelvProba.js`).

/** Ennyi egymás utáni körben látott „nincs közös” után nem hívjuk a társat (és a lap kimondja). */
export const NEM_ERTJUK_HATAR = 3;
/** Ennyi ideig nem hívjuk a megerősítetten nem értett társat. */
export const NEM_ERTJUK_SZUNET = 6 * 3600 * 1000;
/** A rég nem látott bejegyzés ennyi idő után elévül (a társ eltűnt — nem mondjuk tovább). */
export const NEM_ERTJUK_LATSZIK = 7 * 24 * 3600 * 1000;
/** Legfeljebb ennyi társat jegyzünk (a legrégebben látott esik ki). */
export const NEM_ERTJUK_KORLAT = 256;
/** ⭐ D124 ④ (⑦): ennyi nappal a régi lépés dátuma előtt szól a lap, ha van társad, aki csak a régit beszéli. */
export const REGIN_ELORE_NAP = 30;
/** A „régin” bejegyzés ideje ennél ritkábban frissül (a hétköznapi munka így nem ír minden alkalommal). */
const REGIN_FRISSITES = 3600 * 1000;

const IRANYOK = new Set(['regebbi', 'ujabb']);
const RETEGEK = new Set(['szallitas', 'nyelv']);

/** Üres jegyzék. */
export function uresNyelvJegyzek() {
  return { tarsak: {}, regin: {} };
}

const idopont = (x) => (Number.isFinite(x) && x > 0 ? x : null);
const par = (p) => (Array.isArray(p) && p.length === 2 && p.every((x) => Number.isSafeInteger(x) && x >= 1) && p[0] <= p[1]
  ? [p[0], p[1]] : null);

/**
 * A beolvasott jegyzék ellenőrzött alakja — ami nem illik, kiesik (egy sérült fájl nem törheti el az őrjáratot vagy a lapot).
 * @param {*} nyers
 */
export function nyelvJegyzekAlakja(nyers) {
  const j = uresNyelvJegyzek();
  // ⭐ D124 ④: akivel a régin beszélünk (a változat-szám, ha a mi legújabbunknál régebbi; különben null)
  const r = nyers?.regin;
  if (r && typeof r === 'object' && !Array.isArray(r)) {
    const szam = (x) => (Number.isSafeInteger(x) && x >= 1 ? x : null);
    for (const [kulcs, b] of Object.entries(r)) {
      if (typeof kulcs !== 'string' || kulcs.length > 128 || !b || typeof b !== 'object' || !idopont(b.utoljara)) continue;
      const nyelv = szam(b.nyelv), szallitas = szam(b.szallitas);
      if (nyelv === null && szallitas === null) continue;
      j.regin[kulcs] = { nyelv, szallitas, utoljara: b.utoljara };
    }
  }
  const t = nyers?.tarsak;
  if (!t || typeof t !== 'object' || Array.isArray(t)) return j;
  for (const [kulcs, b] of Object.entries(t)) {
    if (typeof kulcs !== 'string' || kulcs.length > 128 || !b || typeof b !== 'object') continue;
    if (!IRANYOK.has(b.irany) || !RETEGEK.has(b.mi) || !idopont(b.utoljara)) continue;
    j.tarsak[kulcs] = {
      mi: b.mi, irany: b.irany, sajat: par(b.sajat), tars: par(b.tars),
      egymasUtan: Number.isInteger(b.egymasUtan) && b.egymasUtan > 0 ? b.egymasUtan : 1,
      utoljara: b.utoljara, szunetEddig: idopont(b.szunetEddig)
    };
  }
  return j;
}

/**
 * ⭐ Hívható-e most a társ (a szünete lejárt, vagy nincs).
 * @param {Object} j - a jegyzék
 * @param {string} kulcs - a társ kulcsa (`nemErtjukKulcsa`)
 * @param {number} most
 */
export function hivhatoE(j, kulcs, most) {
  const b = j?.tarsak?.[kulcs];
  return !b?.szunetEddig || b.szunetEddig <= most;
}

/** A társ kulcsa: a kötés tábla-aláírója, ha van, különben a cím. */
export function nemErtjukKulcsa({ alairo = null, cim, port }) {
  return typeof alairo === 'string' && alairo ? alairo : cim + ':' + port;
}

/**
 * ⭐⭐ Egy kör megfigyelései: a kör (első menetének) eredményei. A sikeres cél bejegyzése törlődik; a `nincsKozos` egy megfigyelés
 * (egy körben társanként egy); ami a határt eléri, szünetre kerül. A többi (nem felelt, foglalt, elbukott) nem bizonyít semmit —
 * a számláló marad.
 * @param {Object} j - a jegyzék
 * @param {Array<Object>} eredmenyek - a kapu `kopog`-jának eredményei
 * @param {(e: Object) => string} kulcsa - az eredmény célja → a társ kulcsa
 * @param {number} most
 * @returns {{ jegyzek: Object, szunetre: Array<{kulcs: string, irany: string, mi: string}>, valtozott: boolean }}
 */
export function korMegfigyelesei(j, eredmenyek, kulcsa, most) {
  const tarsak = { ...(j?.tarsak ?? {}) };
  let valtozott = false;
  const szunetre = [];
  const latott = new Set();
  // ⭐ Előbb a sikerek: ha a társ egyik címén lement a munka, egy másik címén látott „nincs közös” nem őt mutatja.
  const sikeres = new Set((eredmenyek ?? []).filter((e) => e?.cel && e.ok && !e.kihagyva).map(kulcsa));
  for (const k of sikeres) if (tarsak[k]) { delete tarsak[k]; valtozott = true; }
  for (const e of eredmenyek ?? []) {
    if (!e?.cel || e.ok || e.kihagyva || !e.nincsKozos) continue;
    const n = e.nincsKozos;
    if (!IRANYOK.has(n.irany)) continue;
    const k = kulcsa(e);
    if (sikeres.has(k) || latott.has(k)) continue;
    latott.add(k);
    const regi = tarsak[k];
    const egymasUtan = (regi?.egymasUtan ?? 0) + 1;
    const szunetben = regi?.szunetEddig && regi.szunetEddig > most;
    const ujSzunet = egymasUtan >= NEM_ERTJUK_HATAR && !szunetben;
    tarsak[k] = {
      mi: RETEGEK.has(n.mi) ? n.mi : 'nyelv', irany: n.irany, sajat: par(n.sajat), tars: par(n.tars), egymasUtan,
      utoljara: most, szunetEddig: ujSzunet ? most + NEM_ERTJUK_SZUNET : regi?.szunetEddig ?? null
    };
    if (ujSzunet) szunetre.push({ kulcs: k, irany: n.irany, mi: tarsak[k].mi });
    valtozott = true;
  }
  if (!valtozott) return { jegyzek: j, szunetre, valtozott };
  return { jegyzek: { ...j, tarsak: rendrakas(tarsak, most) }, szunetre, valtozott };
}

/**
 * ⭐ Egy munka lement a társsal — értjük egymást: a bejegyzései (a tábla-aláírója és a címe alatt) törlődnek.
 * @param {Object} j
 * @param {Array<string|null>} kulcsok
 * @returns {Object} a jegyzék (ugyanaz az objektum, ha nem volt mit törölni — a tároló így nem ír)
 */
export function ertjukFeljegyzese(j, kulcsok) {
  const torlendo = (kulcsok ?? []).filter((k) => typeof k === 'string' && j?.tarsak?.[k]);
  if (!torlendo.length) return j;
  const tarsak = { ...j.tarsak };
  for (const k of torlendo) delete tarsak[k];
  return { ...j, tarsak };
}

/**
 * ⭐⭐ D124 ④ (⑦): egy lement munka közös nyelve és szállítása a társsal. Ha valamelyik régebbi a mi legújabbunknál, feljegyezzük
 * (a társ csak a régit beszéli); ha a közös a legújabb, a bejegyzés törlődik. Amit a munka nem mondott meg (null — nem csere volt),
 * az a régi bejegyzésé marad.
 * @param {Object} j
 * @param {string|null} kulcs - a társ kulcsa (`nemErtjukKulcsa`)
 * @param {{nyelv: number|null, szallitas: number|null}} kozos - a munka közös nyelve és szállítása
 * @param {{nyelv: number, szallitas: number}} legujabb - a mi legújabbunk
 * @param {number} most
 * @returns {Object} a jegyzék (ugyanaz az objektum, ha nincs változás — a tároló így nem ír)
 */
export function reginFeljegyzese(j, kulcs, kozos, legujabb, most) {
  if (typeof kulcs !== 'string' || !kulcs) return j;
  const ny = Number.isSafeInteger(kozos?.nyelv) ? kozos.nyelv : null;
  const sz = Number.isSafeInteger(kozos?.szallitas) ? kozos.szallitas : null;
  if (ny === null && sz === null) return j;
  const regi = j?.regin?.[kulcs] ?? null;
  const nyelv = ny === null ? regi?.nyelv ?? null : ny < legujabb.nyelv ? ny : null;
  const szallitas = sz === null ? regi?.szallitas ?? null : sz < legujabb.szallitas ? sz : null;
  if (nyelv === null && szallitas === null) {
    if (!regi) return j;
    const regin = { ...j.regin };
    delete regin[kulcs];
    return { ...j, regin };
  }
  if (regi && regi.nyelv === nyelv && regi.szallitas === szallitas && most - regi.utoljara < REGIN_FRISSITES) return j;
  return { ...j, regin: rendrakas({ ...(j?.regin ?? {}), [kulcs]: { nyelv, szallitas, utoljara: most } }, most) };
}

/** Az elévült bejegyzések ki, és a korlát (a legrégebben látott esik ki). */
function rendrakas(tarsak, most) {
  const elo = Object.entries(tarsak).filter(([, b]) => most - b.utoljara <= NEM_ERTJUK_LATSZIK);
  elo.sort((a, b) => b[1].utoljara - a[1].utoljara);
  return Object.fromEntries(elo.slice(0, NEM_ERTJUK_KORLAT));
}

/**
 * ⭐⭐ A KIMONDÁS — a lapnak és a parancsnak ugyanaz: hány MEGERŐSÍTETT (a határt elért, nem elévült) társ fut régebbi, és hány
 * újabb programot, és a mondatok a teendővel. ⚠️ A lap ebből csak kiír (nem számol).
 * ⭐⭐ D124 ④ (⑦): ÉS akivel még a régin beszélünk, ha a régi lépésünk dátuma `REGIN_ELORE_NAP` napon belül jön — a `lejarok`
 * a készülék lejáró lépései (`nyelvValtozat.js` `lejaroValtozatok`; ha nincs megadva, ez a rész néma).
 * @param {Object} j
 * @param {number} most
 * @param {{nyelv: Array, szallitas: Array}} [lejarok]
 * @returns {{ regebbi: number, ujabb: number, lejaro: number, mondatok: string[] }}
 */
export function nyelvekKepe(j, most, lejarok = null) {
  let regebbi = 0, ujabb = 0;
  for (const b of Object.values(j?.tarsak ?? {})) {
    if (b.egymasUtan < NEM_ERTJUK_HATAR || most - b.utoljara > NEM_ERTJUK_LATSZIK) continue;
    if (b.irany === 'regebbi') regebbi++;
    else ujabb++;
  }
  const mondatok = [];
  // ⭐ Az újabb az előbbi: ott NEKED van teendőd.
  if (ujabb) {
    mondatok.push(ujabb + ' társad újabb programot futtat — frissíts (a telepítő sorral), különben ' + (ujabb === 1 ? 'vele' : 'velük')
      + ' nem cseréltek');
  }
  if (regebbi) {
    mondatok.push(regebbi + ' társad régebbi programot futtat — amíg nem ' + (regebbi === 1 ? 'frissít' : 'frissítenek')
      + ', nem cseréltek');
  }
  // ⭐ D124 ④ (⑦): akivel még a régin beszélünk, és a régi lépésünk hamarosan lejár — rétegenként egy mondat
  const lejaroTarsak = new Set();
  for (const [mi, nev] of [['nyelv', 'nyelvet'], ['szallitas', 'szállítást']]) {
    const lepesek = Array.isArray(lejarok?.[mi]) ? lejarok[mi] : [];
    let db = 0, legkorabbi = null, legregebbi = null;
    for (const [kulcs, b] of Object.entries(j?.regin ?? {})) {
      const v = b[mi];
      if (!Number.isSafeInteger(v) || most - b.utoljara > NEM_ERTJUK_LATSZIK || !lepesek.some((x) => x.nyelv === v)) continue;
      // a v-t addig beszéljük, amíg a v-től fölfelé MINDEN lépésünk él: a legkorábbi dátumuk a határ
      const hatar = lepesek.filter((x) => x.nyelv >= v).reduce((a, x) => (!a || x.napMulva < a.napMulva ? x : a), null);
      if (!hatar || hatar.napMulva > REGIN_ELORE_NAP) continue;
      db++;
      lejaroTarsak.add(kulcs);
      if (!legkorabbi || hatar.napMulva < legkorabbi.napMulva) legkorabbi = hatar;
      if (legregebbi === null || v < legregebbi) legregebbi = v;
    }
    if (db) {
      mondatok.push(db + ' társad még csak a régi (' + legregebbi + '.) ' + nev + ' beszéli — a programod ' + legkorabbi.napMulva
        + ' nap múlva (' + legkorabbi.meddig + ') már nem beszéli: ha addig nem ' + (db === 1 ? 'frissít' : 'frissítenek')
        + ', utána nem cseréltek');
    }
  }
  return { regebbi, ujabb, lejaro: lejaroTarsak.size, mondatok };
}
