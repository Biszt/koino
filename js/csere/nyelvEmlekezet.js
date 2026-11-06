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

const IRANYOK = new Set(['regebbi', 'ujabb']);
const RETEGEK = new Set(['szallitas', 'nyelv']);

/** Üres jegyzék. */
export function uresNyelvJegyzek() {
  return { tarsak: {} };
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
  return { jegyzek: { tarsak: rendrakas(tarsak, most) }, szunetre, valtozott };
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
  return { tarsak };
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
 * @param {Object} j
 * @param {number} most
 * @returns {{ regebbi: number, ujabb: number, mondatok: string[] }}
 */
export function nyelvekKepe(j, most) {
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
  return { regebbi, ujabb, mondatok };
}
