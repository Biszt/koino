// js/allapot/helyreallitas.js

// Felelősség: ⭐⭐ D128 (②e1 — 17. pont, 9.13): A HELYREÁLLÍTÁS A SEGÍTŐKKEL — a jóváhagyások, a megállítás és a szerepek
// szabálya, egy koinoban (a tárból).
//
// ===== MIÉRT =====
//
// Csaba (2026-11-15), a kulcsok átbeszélése után: *„mi lessz a koinos megtakarításával? milenne, ha az elvesztés orvoslására,
// azokat az e-embereket vonnánk be, akik ismerik, tehát vagy a meghívója, vagy valakik azok közűl, akik már találkoztak vele?”*
// — és a szabály: *„legyen 3 ember, akik közűl 1, vagy a meghívója, vagy a 3 tanusítoja közűl, az egyik, és még két tanusító,
// akiknek van élő tanusíthatósága.”* (a bemutatkozók: *„legalább 10 legyen.”*)
//
// ===== A SZABÁLY =====
//
//   · a SZEREPEK (az azonosság — X — horgonyának szeletéből, az érvényes állításokból — `identitas.js` `allitasHelyben`):
//       régi ismerős  = aki X-et meghívta vagy tanúsította (`Meghivas`, `Tanusitas`);
//       bemutatkozó   = akivel X KÖLCSÖNÖSEN bemutatkozott (`Bemutatkozas` mindkét irányban — D62: az egyoldalú nem számít);
//       élő tanúsító  = akinek a tanúsítói joga most is él (`tanusithatE`, D60);
//   · az 1. KÖR: 1 régi ismerős + 2 élő tanúsító (az „ismerős út”, 7 nap), vagy 10 bemutatkozó + 2 élő tanúsító (a „bemutatkozó
//     út”, 30 nap) — mind KÜLÖNBÖZŐ azonosság; a bemutatkozó út MINDIG választható (Csaba: a program nem látja, hogy a meghívó
//     „nincs meg”);
//   · a MEGÁLLÍTÁS — X egy érvényes (nem kizárt, a kulcscsere által nem kiejtett) készülékének eseménye a saját szeletében — az 1.
//     kört érvényteleníti, bármikor;
//   · a 2. KÖR — CSAK egy megállított 1. kör után (az `elozo` ennek a jele): +2 élő tanúsító (4), kétszeres várakozás, és nem
//     állítható meg (a tolvajnál is lehet készülék);
//   · a FÁZISOK (Csaba: a segítő EGYSZER cselekszik): a kezdés (a segítő jóváhagy), a véglegesítés (a segítő KÉSZÜLÉKE — a várakozás
//     után, ha nem látott megállítást: ②e3), és a visszavonás (a segítő meggondolta magát) — a véglegesítés UTÁNI visszavonás nem
//     számít (egy kész helyreállítást egyetlen segítő nem fordíthat vissza).
//
// ⭐ A várakozást NEM ez a fájl méri (idő nélkül dönt — D17): a segítő készüléke csak a letelte után véglegesít (②e3). ⚠️ A kapu
// a jóváhagyást az alakja szerint engedi be; a szerepeket ez a számítás nézi.
//
// Használják: a lánc bejegyzése és a bizonyíték (②e2), a segítők készülékei (②e3), a parancsok (②f), a próbák.

import { allitasHelyben, tanusithatE, lepcso2E, ujIdentitasNezet } from './identitas.js';
import { esemenyLekerese, entitasEsemenyei, tarTanusitvanya, azonossagEsemenyei } from '../tar/esemenyTar.js';
import { helyreallitasJele, helyreallitasJavaslatAlakiHibaja, javaslatResze, helyreallitasBejegyzesAlakiHibaja, lancErosebbE,
  bejegyzesJele, HELYREALLITAS_BEJEGYZES, lancBejegyzesAlakiHibaja } from '../kulcs/azonossag.js';
import { memoriaTar, rogzitoTar } from '../tar/memoriaTar.js';
import { alakiHiba, esemenyEllenorzese, esemenyKoinoja, tanusitvanyKereso, azonositoAlaku } from '../esemeny/esemeny.js';
import { tarKizarasai, tarKulcscserei, kizartE, cserenKivulE, tanusitvanyKorszaka } from './kizaras.js';
import { sajatAllitasai } from './jelzesek.js';

// ===== AZ ÁLLANDÓK =====

/** A jóváhagyás és a megállítás eseménye. */
export const JOVAHAGYAS = 'HelyreallitasJovahagyas';
export const MEGALLITAS = 'HelyreallitasMegallitas';

/** A régi ismerős: aki meghívta vagy tanúsította. */
export const ISMEROS_TIPUSOK = new Set(['Meghivas', 'Tanusitas']);

/** A bemutatkozó út: legalább ennyi bemutatkozó (Csaba: „legalább 10 legyen”). */
export const BEMUTATKOZO_KELL = 10;

/** Körönként ennyi élő tanúsító kell (az 1. körben 2, a megállítás után 4). */
export const TANUSITO_KELL = { 1: 2, 2: 4 };

/** A várakozás napokban (az 1. körben; a 2. körben kétszeres) — a segítők készülékei mérik (②e3). */
export const VARAKOZAS_NAP = { ismeros: 7, bemutatkozo: 30 };

// ===== A SZABÁLY — TISZTA =====

/**
 * Elegendők-e a résztvevők: az ISMERŐS út (1 régi ismerős + k élő tanúsító) vagy a BEMUTATKOZÓ út (10 bemutatkozó + k élő tanúsító)
 * — mind különböző azonosság (egy ember egy helyet tölt be). Tiszta, szinkron.
 * @param {Set<string>|Array<string>} resztvevok - akik jóváhagytak (a fázisban)
 * @param {{ismerosok: Set<string>, bemutatkozok: Set<string>, tanusitok: Set<string>}} szerepek
 * @param {number} kor - 1 vagy 2
 * @returns {'ismeros'|'bemutatkozo'|null}
 */
export function elegendoUt(resztvevok, szerepek, kor) {
  const k = TANUSITO_KELL[kor];
  if (!k) return null;
  const R = [...new Set(resztvevok)];
  const T = R.filter((y) => szerepek.tanusitok.has(y));
  if (T.length < k) return null;
  const I = R.filter((y) => szerepek.ismerosok.has(y));
  // Az ismerős út: van egy ismerős, akin kívül is marad k tanúsító.
  if (I.some((i) => T.filter((t) => t !== i).length >= k)) return 'ismeros';
  // A bemutatkozó út: a k tanúsítót előbb a nem-bemutatkozók közül vesszük; a maradék a bemutatkozók közül fogy el.
  const B = R.filter((y) => szerepek.bemutatkozok.has(y));
  const tanusitoKivul = T.filter((t) => !szerepek.bemutatkozok.has(t)).length;
  if (B.length - Math.max(0, k - tanusitoKivul) >= BEMUTATKOZO_KELL) return 'bemutatkozo';
  return null;
}

/**
 * Egy segítő fázisai (a saját sorrendjében — `entitasSorszam`) → kezdett-e (érvényben), véglegesített-e. A visszavonás a kezdést
 * törli; a véglegesítés után semmi nem számít (egy kész jóváhagyás nem fordítható vissza).
 * @param {Array<{fazis: string, sorszam: number}>} fazisok
 * @returns {{kezdett: boolean, veglegesitett: boolean}}
 */
export function segitoAllasa(fazisok) {
  let kezdett = false;
  for (const f of [...fazisok].sort((a, b) => a.sorszam - b.sorszam)) {
    if (f.fazis === 'kezdes') kezdett = true;
    else if (f.fazis === 'visszavonas') kezdett = false;
    else if (f.fazis === 'veglegesites' && kezdett) return { kezdett: true, veglegesitett: true };
  }
  return { kezdett, veglegesitett: false };
}

// ===== AZ ÁLLAPOT — A TÁRBÓL =====

/**
 * Egy azonosság (a horgonya egy koinoban) helyreállításainak ÁLLAPOTA — javaslatonként: a kezdők és a véglegesítők, a
 * megállítás, az út, és hogy elindult-e, teljes-e.
 * @param {Object} tar
 * @param {string} koino
 * @param {string} horgony - a helyreállítandó azonosság horgonya
 * @param {Object} [nezet]
 * @returns {Promise<Array<{jel: string, javaslat: Object, kezdok: Set<string>, veglegesitok: Set<string>,
 *   segitoHorgonyok: Map<string, string>, megallitva: boolean, elozoMegallitva: boolean, ut: string|null, elindult: boolean,
 *   teljes: boolean, varakozasNap: number|null}>>}
 */
export async function helyreallitasokAllapota(tar, koino, horgony, nezet = ujIdentitasNezet()) {
  console.log('helyreallitasokAllapota - KEZDÉS', { horgony });
  const horgonyEsemeny = await esemenyLekerese(tar, horgony);
  if (!horgonyEsemeny) {
    console.log('helyreallitasokAllapota - VÉGE (nincs horgony)');
    return [];
  }
  const X = horgonyEsemeny.szerzo;
  const szelet = await entitasEsemenyei(tar, koino, horgony);

  // ----- 1. A SZEREPEK ALAPJA: ki hívta meg, tanúsította, ki mutatkozott be neki (kölcsönösen) -----
  const ismerosok = new Set();
  const feleBemutatkozott = new Set();
  for (const e of szelet) {
    const tipus = ISMEROS_TIPUSOK.has(e.tipus) || e.tipus === 'Bemutatkozas' ? e.tipus : null;
    if (!tipus) continue;
    if (!(await allitasHelyben(tar, koino, e, horgonyEsemeny, tipus, nezet)).ervenyes) continue;
    (tipus === 'Bemutatkozas' ? feleBemutatkozott : ismerosok).add(e.szerzo);
  }
  // ⭐ D62: a bemutatkozás csak KÖLCSÖNÖSEN számít — X is bemutatkozott neki (X saját állítása, a saját szeletébe bejelentve).
  const tole = new Set();
  for (const e of await sajatAllitasai(tar, koino, horgony, X)) {
    if (e.tipus === 'Bemutatkozas' && typeof e.adat?.kit === 'string') tole.add(e.adat.kit);
  }
  const bemutatkozok = new Set([...feleBemutatkozott].filter((y) => tole.has(y)));

  // ----- 2. A JÓVÁHAGYÁSOK: javaslatonként, segítőnként a fázisok -----
  const javaslatok = new Map();
  for (const e of szelet) {
    if (e.tipus !== JOVAHAGYAS || helyreallitasJavaslatAlakiHibaja(e.adat?.javaslat)) continue;
    const h = await allitasHelyben(tar, koino, e, horgonyEsemeny, JOVAHAGYAS, nezet);
    if (!h.ervenyes) continue;
    const jel = await helyreallitasJele(e.adat.javaslat);
    let j = javaslatok.get(jel);
    if (!j) javaslatok.set(jel, j = { javaslat: e.adat.javaslat, segitok: new Map() });
    let s = j.segitok.get(e.szerzo);
    if (!s) j.segitok.set(e.szerzo, s = { horgony: h.allitoHorgony, fazisok: [] });
    s.fazisok.push({ fazis: e.adat.fazis, sorszam: e.entitasSorszam ?? 0 });
  }

  // ----- 3. A MEGÁLLÍTÁSOK: X érvényes készülékéről, a saját szeletében -----
  const kizarasok = await tarKizarasai(tar, X);
  const kulcscserek = await tarKulcscserei(tar, X);
  const megallitott = new Set();
  for (const e of szelet) {
    if (e.tipus !== MEGALLITAS || e.szerzo !== X || typeof e.adat?.javaslat !== 'string') continue;
    if (kizartE(e, kizarasok)) continue;
    if (kulcscserek.size) {
      const t = e.tanusitvany ?? await tarTanusitvanya(tar, e.keszulek);
      if (t && cserenKivulE(e, kulcscserek, new Map([[e.keszulek, tanusitvanyKorszaka(t)]]), kizarasok)) continue;
    }
    megallitott.add(e.adat.javaslat);
  }

  // ----- 4. AZ ÉLŐ TANÚSÍTÓK — a segítők közül (egyszer nézzük meg mindegyiket) -----
  const segitoHorgonyok = new Map();
  for (const j of javaslatok.values()) for (const [y, s] of j.segitok) segitoHorgonyok.set(y, s.horgony);
  const tanusitok = new Set();
  for (const [y, hy] of segitoHorgonyok) if ((await tanusithatE(tar, koino, hy, nezet)).igen) tanusitok.add(y);
  const szerepek = { ismerosok, bemutatkozok, tanusitok };

  // ----- 5. JAVASLATONKÉNT -----
  const ki = [];
  for (const [jel, j] of javaslatok) {
    const kezdok = new Set();
    const veglegesitok = new Set();
    for (const [y, s] of j.segitok) {
      const a = segitoAllasa(s.fazisok);
      if (a.kezdett) kezdok.add(y);
      if (a.veglegesitett) veglegesitok.add(y);
    }
    const kor = j.javaslat.kor;
    const megallitva = kor === 1 && megallitott.has(jel);
    const elozoMegallitva = kor === 2 ? megallitott.has(j.javaslat.elozo) : true;
    const ut = elegendoUt(kezdok, szerepek, kor);
    const teljesUt = elegendoUt(veglegesitok, szerepek, kor);
    ki.push({
      jel, javaslat: j.javaslat, kezdok, veglegesitok, segitoHorgonyok: new Map([...j.segitok].map(([y, s]) => [y, s.horgony])),
      megallitva, elozoMegallitva, ut,
      elindult: !!ut && !megallitva && elozoMegallitva,
      teljes: !!teljesUt && !megallitva && elozoMegallitva,
      varakozasNap: ut ? VARAKOZAS_NAP[ut] * kor : null
    });
  }
  ki.sort((a, b) => (a.jel < b.jel ? -1 : a.jel > b.jel ? 1 : 0));
  console.log('helyreallitasokAllapota - VÉGE', { javaslatok: ki.length, teljes: ki.filter((x) => x.teljes).length });
  return ki;
}

// ===================================
// ⭐⭐ D128 (②e2 — 9.13 3. pont): A BIZONYÍTÉK — a helyreállítás minden koinoban érvényes
// ===================================
//
// A helyreállítás A koinoban teljes (a segítők mindkét fázisa megvan); B koino ezt A eseményei nélkül nem látná. Ezért a lánc
// bejegyzése mellé (a `Kulcscsere` esemény hozza) a BIZONYÍTÉK kerül: azok az A-beli események (és a tanúsítványaik), amiket a
// szerep-ellenőrzés kiolvasott — a RÖGZÍTŐ TÁR jegyezte fel (`tar/memoriaTar.js`). Bármelyik kapu ezekből egy MEMÓRIABELI tárat
// épít, és ugyanazzal a függvénnyel (`helyreallitasokAllapota`) számolja újra — egy szabály, egy forrás (a D93/2 mintája).
// ⭐ TELJES ellenőrzéssel (a keret végtelen, szúrópróba nincs): minden kapu ugyanarra jut. ⚠️ A maradék kockázat (9.13): az
// összeállító egy felhatalmazás VISSZAVONÁSÁT kihagyhatja — A koino készülékei látják, a várakozás és a megállítás ez ellen is véd.

/** A bizonyíték legfeljebb ennyi eseményt hoz (a tagsági csomag korlátja nagyságrendjében). */
export const BIZONYITEK_KORLAT = 4096;

const BIZONYITEK_MEZOK = 'esemenyek,horgony,jel,koino,tanusitvanyok';

/** A teljes ellenőrzés nézete: a keret végtelen — szúrópróba nincs, minden kapu ugyanarra jut. */
function teljesNezet() {
  return ujIdentitasNezet({ keret: Infinity });
}

/**
 * A BIZONYÍTÉK ÖSSZEÁLLÍTÁSA — a helyreállítás teljes ebben a koinoban: amit a szerep-ellenőrzés kiolvasott (a rögzítő tárral), az
 * a bizonyíték (és a koino születése, a szabályaihoz).
 * @param {Object} tar
 * @param {string} koino
 * @param {string} horgony - a helyreállítandó horgonya ebben a koinoban
 * @param {string} jel - a javaslat jele
 * @returns {Promise<{koino: string, horgony: string, jel: string, esemenyek: Array<Object>, tanusitvanyok: Array<Object>}>}
 */
export async function helyreallitasBizonyiteka(tar, koino, horgony, jel) {
  console.log('helyreallitasBizonyiteka - KEZDÉS', { horgony });
  const r = rogzitoTar(tar);
  const a = (await helyreallitasokAllapota(r.tar, koino, horgony, teljesNezet())).find((x) => x.jel === jel);
  if (!a?.teljes) throw new Error('A helyreállítás ebben a koinoban még nem teljes — nincs mit bizonyítani.');
  if (azonositoAlaku(koino)) await r.tar.esemeny(koino);   // a koino születése (a szabályai — D118/2)
  const b = { koino, horgony, jel, esemenyek: r.esemenyek(), tanusitvanyok: r.tanusitvanyok() };
  if (b.esemenyek.length > BIZONYITEK_KORLAT) throw new Error('A bizonyíték túl nagy (' + b.esemenyek.length + ' esemény).');
  console.log('helyreallitasBizonyiteka - VÉGE', { esemenyek: b.esemenyek.length, tanusitvanyok: b.tanusitvanyok.length });
  return b;
}

/**
 * A BIZONYÍTÉK ELLENŐRZÉSE — bármelyik kapu: az alak, minden esemény hiteles (aláírás, tanúsítvány) és A koinoé, a horgony a
 * helyreállítandóé, és a memóriabeli tárban a helyreállítás TELJES, ugyanazzal a jellel, mint a bejegyzés.
 * @param {Object} b - a bizonyíték
 * @param {Object} bejegyzes - a lánc `AzonossagHelyreallitas` bejegyzése
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function helyreallitasBizonyitekEllenorzese(b, bejegyzes) {
  console.log('helyreallitasBizonyitekEllenorzese - KEZDÉS');
  const nem = (ok) => {
    console.log('helyreallitasBizonyitekEllenorzese - VÉGE (nem)', { ok });
    return { rendben: false, ok };
  };
  const bh = helyreallitasBejegyzesAlakiHibaja(bejegyzes);
  if (bh) return nem('a bejegyzés: ' + bh);
  if (!b || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).sort().join(',') !== BIZONYITEK_MEZOK) {
    return nem('a bizonyíték alakja: { koino, horgony, jel, esemenyek, tanusitvanyok }');
  }
  if (typeof b.koino !== 'string' || !b.koino || !azonositoAlaku(b.horgony) || b.jel !== bejegyzes.jel) {
    return nem('a bizonyíték koinoja, horgonya és jele (a bejegyzésé)');
  }
  if (!Array.isArray(b.esemenyek) || !b.esemenyek.length || b.esemenyek.length > BIZONYITEK_KORLAT
    || !Array.isArray(b.tanusitvanyok) || b.tanusitvanyok.length > BIZONYITEK_KORLAT) {
    return nem('a bizonyíték eseményei (1–' + BIZONYITEK_KORLAT + ') és tanúsítványai');
  }
  if (await helyreallitasJele(javaslatResze(bejegyzes)) !== bejegyzes.jel) return nem('a bejegyzés jele nem a tartalmáé');
  // Minden esemény hiteles és A koinoé.
  const kereso = await tanusitvanyKereso(b.esemenyek, null, b.tanusitvanyok);
  for (const e of b.esemenyek) {
    if (alakiHiba(e)) return nem('egy esemény alakja hibás');
    if (esemenyKoinoja(e) !== b.koino) return nem('egy esemény másik koinoé');
    if (!(await esemenyEllenorzese(e, { tanusitvany: kereso })).rendben) return nem('egy esemény nem hiteles');
  }
  const horgonyEsemeny = b.esemenyek.find((e) => e.azonosito === b.horgony);
  if (!horgonyEsemeny || horgonyEsemeny.szerzo !== bejegyzes.azonossag) return nem('a horgony nem a helyreállítandóé');
  if (azonositoAlaku(b.koino) && !b.esemenyek.some((e) => e.azonosito === b.koino && e.tipus === 'KoinoLetrehozas')) {
    return nem('a koino születése hiányzik');
  }
  const mem = memoriaTar(b.esemenyek, b.tanusitvanyok);
  const a = (await helyreallitasokAllapota(mem, b.koino, b.horgony, teljesNezet())).find((x) => x.jel === b.jel);
  if (!a?.teljes) return nem('a bizonyítékból a helyreállítás nem teljes');
  console.log('helyreallitasBizonyitekEllenorzese - VÉGE (rendben)');
  return { rendben: true };
}

// ===================================
// ⭐⭐ D128 (②e3): AZ AZONOSSÁG LÁNCA A TÁRBÓL — a segítő készüléke ebből építi a helyreállítás `Kulcscsere` eseményét
// ===================================

/**
 * Egy azonosság LÁNCA a tárból: a születése, a láncok (a `Kulcscsere` eseményekből és a készülékei tanúsítványaiból) közül az
 * erősebb, és a benne álló helyreállítások bizonyítékai (a `Kulcscsere` eseményekből). ⚠️ Amit a tár ismer — nem több.
 * @param {Object} tar
 * @param {string} nev - az azonosság neve
 * @returns {Promise<{szuletes: Object|null, cserek: Array<Object>, lancok: Array<Array<Object>>, bizonyitekok: Object}>}
 */
export async function azonossagLancaTarbol(tar, nev) {
  let szuletes = null;
  const lancok = [];
  const bizonyitekok = {};
  const jelolt = (cs) => {
    if (Array.isArray(cs) && cs.length && !cs.some((c) => lancBejegyzesAlakiHibaja(c)) && cs[0].azonossag === nev) lancok.push(cs);
  };
  const kezeles = typeof tar?.kezelesEsemenyei === 'function' ? await tar.kezelesEsemenyei(nev) : [];
  for (const e of kezeles) {
    if (e?.tipus !== 'Kulcscsere') continue;
    szuletes ??= e.adat?.szuletes ?? null;
    jelolt(e.adat?.cserek);
    for (const [jel, b] of Object.entries(e.adat?.bizonyitekok ?? {})) bizonyitekok[jel] ??= b;
  }
  for (const e of await azonossagEsemenyei(tar, nev)) {
    if (!e?.tanusitvany) continue;
    szuletes ??= e.tanusitvany.szuletes ?? null;
    jelolt(e.tanusitvany.cserek);
  }
  let cserek = [];
  for (const cs of lancok) if (lancErosebbE(cs, cserek)) cserek = cs;
  return { szuletes, cserek, lancok, bizonyitekok };
}

/**
 * A helyreállítás bejegyzésének HELYE a lánc(ok)ban: az a lánc-eleje, amit a javaslat folytat (`sorszam - 1` hosszú, az utolsó jele
 * az `utan`) — vagy null, ha a tár nem ismeri.
 * @returns {Array<Object>|null}
 */
export function javaslatElotagja(lanc, javaslat) {
  const n = javaslat.sorszam - 1;
  if (n === 0) return [];
  for (const cs of [lanc.cserek, ...lanc.lancok]) {
    if (cs.length >= n && bejegyzesJele(cs[n - 1]) === javaslat.utan) return cs.slice(0, n);
  }
  return null;
}

/** A láncban álló helyreállítások jelei. */
export function lancHelyreallitasai(cserek) {
  return cserek.filter((c) => c?.tipus === HELYREALLITAS_BEJEGYZES).map((c) => c.jel);
}

/**
 * ⭐⭐ D128 (②f): A JAVASLAT A KÉRELEMBŐL — a segítő gépe ebből hagy jóvá. Ha a kérelemre már van javaslat (egy másik segítő
 * kezdte — ugyanaz a kulcs, a fizetési kulcs, a készülékek, a kör és az előzmény), AZT adja (mindenki ugyanazt hagyja jóvá); különben
 * újat: a lánc HELYE a tárból (`azonossagLancaTarbol` — a következő sorszám, az utolsó bejegyzés jele), és a papír lekötése a 2.
 * lépcsőn NINCS (Csaba: „ott már ne legyen papír”), az 1. lépcsőn a kérelem papírja.
 * @param {Object} tar
 * @param {string} koino
 * @param {string} horgony - a helyreállítandó horgonya
 * @param {{kulcs: string, fizetes: string, csere: string|null, keszulekek: Array<string>}} kerelem
 * @param {{kor?: number, elozo?: string|null, ido?: number}} [beallitas]
 * @returns {Promise<{javaslat: Object, uj: boolean}>}
 */
export async function javaslatKerelembol(tar, koino, horgony, kerelem, { kor = 1, elozo = null, ido = Date.now() } = {}) {
  const ugyanaz = (j) => j.kulcs === kerelem.kulcs && j.fizetes === kerelem.fizetes && j.kor === kor && j.elozo === elozo
    && JSON.stringify(j.keszulekek) === JSON.stringify(kerelem.keszulekek);
  const meglevo = (await helyreallitasokAllapota(tar, koino, horgony)).find((a) => ugyanaz(a.javaslat));
  if (meglevo) return { javaslat: meglevo.javaslat, uj: false };
  const horgonyEsemeny = await esemenyLekerese(tar, horgony);
  if (!horgonyEsemeny) throw new Error('Nem ismerem ezt a horgonyt — előbb a koino cseréje (vagy behoz).');
  const lanc = await azonossagLancaTarbol(tar, horgonyEsemeny.szerzo);
  const utolso = lanc.cserek[lanc.cserek.length - 1];
  const masodik = (await lepcso2E(tar, koino, horgony, ujIdentitasNezet({ keret: Infinity }))).igen;
  const javaslat = { kulcs: kerelem.kulcs, keszulekek: [...kerelem.keszulekek], fizetes: kerelem.fizetes,
    kovetkezo: masodik ? null : kerelem.csere, kor, elozo, sorszam: lanc.cserek.length + 1,
    utan: utolso ? bejegyzesJele(utolso) : null, ido };
  const h = helyreallitasJavaslatAlakiHibaja(javaslat);
  if (h) throw new Error('A javaslat nem állítható össze: ' + h);
  return { javaslat, uj: true };
}
