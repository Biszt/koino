// js/allapot/lancGyoker.js

// Felelősség: A SZERZŐ LÁNC-GYÖKERE (D63, D78, D81 — az A pillér 2. lépése): minden új saját esemény
// `lancGyoker`-e a szerző ESEMÉNY ELŐTTI két gyökerét hordozza —
//
//   lancGyoker(k) = { naplo: naplo(1..k-1), kiosztas: kiosztas(k-1), kapott: kapott(k-1) }     (összegzések: { l, d, o })
//
// ⭐⭐ D128 (9.9): a lánc a KÉSZÜLÉKÉ, és a harmadik fa a KAPOTT — adó készülékenként a tőle eddig átvett (halmozott) keret; a
// gyökér összege a kapott összesen. A lánc kerete egy eseménynél = az alapja + a kapott (`szabalyok.js` `lancLepese`).
//
// ⭐ D81: nem a lenyomatuk, hanem MAGUK — a bizonyíték az eseménnyel utazik, így aki az eseményt
// tartja, a szerző nélkül is ellenőrizni tudja. A PONT-esemény ezen felül az adatában hozza az
// entitása régi értékének bizonyítékát (`adat.bizonyitek`, a kiosztás-fából) — a kapu ellenőrzi
// (`pontEsemenyOnbizonyitasa`), és a szabály-réteg ebből a hézagos láncnál is BIZONYÍTOTTAN ítél.
//
//   · a NAPLÓ-FA gyökere: a szerző 1..k-1 sorszámú eseményeinek azonosítói, sorrendben (D63: így a
//     kettős lánc a szeletek között is lelepleződik — két aláírt gyökér ellentmond egymásnak);
//   · a KIOSZTÁS-FA gyökere: a szerző elfogadott tudatpont-állása (entitás → pont) a k-adik esemény
//     ELŐTT; a gyökér összege a kiosztott összeg (D42).
//
// ⭐ MIÉRT AZ ESEMÉNY ELŐTTI ÁLLAPOT (2026-09-27, a megvalósítás döntése — D78 „a pontos algoritmus a
// megvalósítás része"): így egy pont-esemény ÖNMAGÁBAN ellenőrizhető — a benne aláírt korábbi
// állapotból és egyetlen bizonyítékból (az entitás régi értéke) bárki kiszámolja az új összeget
// (`allapotValtozasa`), és összeveti a bemondottal. Nem kell hozzá a szerző előző eseménye.
//
// ⭐ EGY FORRÁS: a kiosztást ugyanaz az ítélet állítja elő (`pontEsemenyMerlege`), amit a
// szabály-réteg és a művelet-réteg (`sajatKiosztott`) is hív — különben a saját gyökerünk ellentmondana
// annak, amit a másik gép számol.
//
// ⚠️ HA A SAJÁT LÁNC NEM ÉP (hézag, elágazás vagy szakadás a saját eseményeink között — pl. egy
// visszatöltött kulcs a régi események nélkül), a lánc-gyökér `null`: nem kötünk el hamis naplót.
// Az ilyen esemény olyan, mint a D78 előtti régi: érvényes, csak nem horgonyoz.
//
// ⭐ A GYORSÍTÓTÁR (a mutató pillanatképének elve, D73): a szerzőnek a folytatáshoz a napló CSÚCSAI és
// a kiosztás kellenek — ezt a memória (folyamaton belül) és egy fájl (`lanc.json`, a folyamatok
// között) tartja. ⛔ Tiszta gyorsítótár: minden használat előtt összevetjük a lánccal — a lefedett
// utolsó sorszámon tényleg az az esemény áll-e. ⭐ Ez elég: az esemény azonosítója az `elozo`-láncon
// át az EGÉSZ addigi láncot elköti, tehát egy illő gyorsítótár pontosan annak a láncnak az állapota.
// A fájl tartalmát ezen felül egy ellenőrző-lenyomat köti (a csendes sérülés ellen); ha bármi nem
// illik, a láncból épül újra.
//
// Használják: muveletek.js (az új események aláírása), tar/esemenyTar.js (a kapu: a pont-esemény
// bizonyítéka), allapot/ellentmondas.js, a próbák.

import { lenyomat } from '../esemeny/kanonikusAlak.js';
import {
  levelOsszegzes, ujNaplo, naploHozzafuzes, naploCsucsGyokere, naploGyokere,
  ujAllapotFa, allapotBeallitas, allapotGyokere, osszegzesAlakja,
  allapotBizonyitek, allapotBizonyitekEllenorzese
} from '../esemeny/osszegzoFa.js';
import { lancLepese, ujLancAllas } from './szabalyok.js';
import { AZONOSITO_MINTA, azonositoAlaku, esemenyKoinoja, koinoSzuleteseE, lancKulcsa, PONT_TIPUSOK } from '../esemeny/esemeny.js';
import { alapHorgony, alapokAlapja, HORGONY_TIPUSOK } from './tagsag.js';   // ⭐⭐ D128 (9.9): a lánc alapja
import { koinoSzabalyai, ALAP_SZABALYOK } from '../esemeny/koinoSzabalyok.js';
import { lancNezete } from './koinoLanc.js';
import { kizartE, tarKizarasai } from './kizaras.js';   // ⭐⭐ D128 (①d): a kizárt készülék eseményei nem a lánc részei   // ⭐ D118 (⑤b): a szerző lánca a koinóban (a bekapcsolódó hozott előtagjával)

export const NAPLO_FAJTA = 'naplo';
export const KIOSZTAS_FAJTA = 'kiosztas';
export const KIOSZTAS_HOSSZ = 1;
export const KAPOTT_FAJTA = 'kapott';     // ⭐⭐ D128 (9.9): adó készülék → a tőle átvett halmozott keret
export const KAPOTT_HOSSZ = 1;

// A gyorsítótár alakjának változata (ha a tartalma változik, nő — a régit eldobjuk).
const TAR_VALTOZAT = 3;   // ⭐⭐ D128: a gyorsítótár egy LÁNCÉ (a készüléké), nem a szerzőé — és a kapottat is tartja (9.9)

/**
 * A lánc-gyökér a gyökerekből (D81: maguk az összegzések — csak a `l`, `d`, `o` mezőjük).
 * @param {{l: string, d: number, o: Array<number>}} naploGyoker
 * @param {{l: string, d: number, o: Array<number>}} kiosztasGyoker
 * @param {{l: string, d: number, o: Array<number>}} kapottGyoker - ⭐⭐ D128 (9.9)
 * @returns {{naplo: Object, kiosztas: Object, kapott: Object}}
 */
export function lancGyokerGyokerekbol(naploGyoker, kiosztasGyoker, kapottGyoker) {
  const tiszta = (x) => ({ l: x.l, d: x.d, o: [...x.o] });
  return { naplo: tiszta(naploGyoker), kiosztas: tiszta(kiosztasGyoker), kapott: tiszta(kapottGyoker) };
}

/** Két lánc-gyökér ugyanaz-e (mindkettő null, vagy ugyanaz a három gyökér)? */
export function azonosLancGyoker(a, b) {
  if (a === null || b === null) return a === b;
  const egy = (x, y) => x.l === y.l && x.d === y.d && x.o.length === y.o.length && x.o.every((v, i) => v === y.o[i]);
  return egy(a.naplo, b.naplo) && egy(a.kiosztas, b.kiosztas) && egy(a.kapott, b.kapott);
}

/**
 * ⭐⭐ A PONT-ESEMÉNY ÖNBIZONYÍTÁSA (D81) — a kapu hívja: ha a pont-esemény a lánc-gyökerét hordozza,
 * az adatában lennie kell az entitása régi értékének bizonyítékának, és illenie kell a saját aláírt
 * kiosztás-gyökeréhez. Ettől a szabály-réteg a bizonyíték számait (az összeget és a régi értéket)
 * hézag nélkül elhiheti — ahogy az aláírást is. ⚠️ Nem ítél a bemondásról: azt a szabály teszi.
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function pontEsemenyOnbizonyitasa(e) {
  // ⭐⭐ D128 (9.9): a keret átadása is pont-esemény (a levele a fogadó készülék kulcsa).
  if (!PONT_TIPUSOK.has(e?.tipus) || e.lancGyoker === null || e.lancGyoker === undefined) return { rendben: true };
  const entitas = e.adat?.entitas;
  if (typeof entitas !== 'string') return { rendben: false, ok: 'a pont-esemény entitása hiányzik' };
  const b = await allapotBizonyitekEllenorzese(KIOSZTAS_FAJTA, KIOSZTAS_HOSSZ, e.lancGyoker.kiosztas, entitas, e.adat.bizonyitek);
  return b.rendben ? { rendben: true }
    : { rendben: false, ok: 'a pont-esemény bizonyítéka hiányzik vagy nem illik a saját lánc-gyökeréhez (D81): ' + b.ok };
}

/**
 * ⭐⭐ D128 (9.9): A KERET ÁTVÉTELÉNEK ÖNBIZONYÍTÁSA — a kapu hívja (az átadás aláírását és tanúsítványát a kapu maga nézi):
 *   · a hozott átadás a saját bizonyítékával áll (illik a saját aláírt kiosztás-gyökeréhez — `pontEsemenyOnbizonyitasa`), és van
 *     lánc-gyökere (különben egy eseményből nem ellenőrizhető);
 *   · az átvétel bizonyítéka (az adó levelének régi értéke) illik az átvétel saját aláírt kapott-gyökeréhez.
 * ⚠️ Nem ítél az átvételről — azt a számítás teszi (`szabalyok.js` `keretAtvetelMerlege`).
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function keretAtvetelOnbizonyitasa(e) {
  if (e?.tipus !== 'KeretAtvetel') return { rendben: true };
  const at = e.adat?.atadas;
  if (!at || typeof at !== 'object' || !at.lancGyoker) {
    return { rendben: false, ok: 'a keret-átvétel átadása nem hordozza a lánc-gyökerét (egy eseményből nem ellenőrizhető)' };
  }
  const a = await pontEsemenyOnbizonyitasa(at);
  if (!a.rendben) return { rendben: false, ok: 'a keret-átvétel átadása: ' + a.ok };
  if (!e.lancGyoker?.kapott) return { rendben: false, ok: 'a keret-átvétel nem hordozza a kapott-gyökerét' };
  const b = await allapotBizonyitekEllenorzese(KAPOTT_FAJTA, KAPOTT_HOSSZ, e.lancGyoker.kapott, lancKulcsa(at), e.adat.bizonyitek);
  return b.rendben ? { rendben: true }
    : { rendben: false, ok: 'a keret-átvétel bizonyítéka nem illik a saját kapott-gyökeréhez: ' + b.ok };
}

/**
 * ⛔ Egy szavazat vagy javaslat legfeljebb ennyi bizonyítékot hordozhat (a szavazat részenként kettőt:
 * az érintettét és a javaslat-entitásáét; a javaslat érintettenként egyet). Felső korlát, hogy egy
 * kézzel írt esemény ne fújhassa fel magát.
 */
export const SZAVAZAT_BIZONYITEK_KORLAT = 64;

/** Mely események hozhatnak kulcsonkénti bizonyítékot a saját kiosztásukból (D85/2 T2, D85 T3). */
const KULCSOS_BIZONYITEK_TIPUSOK = new Set(['Szavazat', 'Javaslat']);

/**
 * ⭐⭐ A SZAVAZAT ÖNBIZONYÍTÁSA (D85/2, T2 — Csaba, 2026-10-02) — a kapu hívja. A szavazati jog a
 * leadás pillanatában pontot kíván az érintett gondolaton ÉS a javaslaton (a töredékén); a szavazat
 * ezt MAGA bizonyítja a saját aláírt kiosztás-gyökeréből (a D81 mintája). Így a jog akkor is
 * eldönthető, ha a javaslat pont-eseményei nincsenek meg (a szigorú (b) alatt a gondolat nem szavazó
 * tartóinál). ⚠️ Nem ítél a jogról — azt a számítás teszi (`javaslatSzamitas.js`); itt csak az, hogy
 * minden hozott bizonyíték a saját gyökeréhez illik. A HIÁNYZÓ bizonyíték nem hiba: ott a szavazat
 * egyszerűen nem számít.
 *
 * ⭐⭐ A JAVASLAT IS (D85 T3 előfeltétele, 2026-10-03 — a T2 mintája): a javaslattevő jogosultsága (minden
 * érintetten pontja van, a javaslat ELŐTTI állása szerint) ugyanígy a saját kiosztás-fájából bizonyított —
 * különben a csak-G1-tartó a javaslattevő hézagos láncából ítélne, és a G2-es pontot „nincs”-nek látná.
 * @returns {Promise<{rendben: boolean, ok?: string}>}
 */
export async function hozottBizonyitekokOnbizonyitasa(e) {
  if (!KULCSOS_BIZONYITEK_TIPUSOK.has(e?.tipus) || e.lancGyoker === null || e.lancGyoker === undefined) {
    return { rendben: true };
  }
  const mi = e.tipus === 'Javaslat' ? 'a javaslat' : 'a szavazat';
  const b = e.adat?.bizonyitek;
  if (b === undefined || b === null) return { rendben: true };
  if (typeof b !== 'object' || Array.isArray(b)) return { rendben: false, ok: mi + ' bizonyítéka nem objektum' };
  const kulcsok = Object.keys(b);
  if (kulcsok.length > SZAVAZAT_BIZONYITEK_KORLAT) {
    return { rendben: false, ok: mi + ' túl sok bizonyítékot hoz (' + kulcsok.length + ')' };
  }
  for (const kulcs of kulcsok) {
    if (!AZONOSITO_MINTA.test(kulcs)) return { rendben: false, ok: mi + ' bizonyítékának kulcsa nem azonosító' };
    const v = await allapotBizonyitekEllenorzese(KIOSZTAS_FAJTA, KIOSZTAS_HOSSZ, e.lancGyoker.kiosztas, kulcs, b[kulcs]);
    if (!v.rendben) {
      return { rendben: false, ok: mi + ' bizonyítéka nem illik a saját lánc-gyökeréhez (D85/2, T2): ' + v.ok };
    }
  }
  return { rendben: true };
}

/**
 * Egy saját esemény hatása az állásra — a szabály ítéletével (`szabalyok.js` `lancLepese` — a szabály-réteg UGYANEZT hívja).
 * ⚠️ A saját láncot itt mindig hézagtalanul ismerjük (különben a lánc-gyökér null), tehát folytonos.
 * ⭐ D118/2: a keret a koinóé — ⭐⭐ D128 (9.9): a láncé (az alap + a kapott). ⭐ D118 (⑤b): a hozott (az ős láncából jött)
 * pont-esemény a számított összeggel — mint a szabály-rétegben.
 * @returns {'pont'|'kapott'|null} melyik fa változott (ami nem számít, az a régi értéket hagyja érvényben)
 */
function allasLepese(allas, e, alap, alapok, hozott = false) {
  const merleg = lancLepese(allas, e, true, alap, alapok, hozott);
  if (!merleg || merleg.elvetve) return null;
  return e.tipus === 'KeretAtvetel' ? 'kapott' : 'pont';
}

/** A kiosztás-FA az állásból (csak a pozitív pontok levelek — a 0 nem tulajdon, D14). */
async function kiosztasFaja(pontok) {
  const fa = ujAllapotFa(KIOSZTAS_FAJTA, KIOSZTAS_HOSSZ);
  for (const [kulcs, pont] of pontok) if (pont > 0) await allapotBeallitas(fa, kulcs, null, [pont]);
  return fa;
}

/** ⭐⭐ D128 (9.9): a kapott-FA (adó készülék → a tőle átvett halmozott keret; csak a pozitívak). */
async function kapottFaja(kapott) {
  const fa = ujAllapotFa(KAPOTT_FAJTA, KAPOTT_HOSSZ);
  for (const [kulcs, pont] of kapott) if (pont > 0) await allapotBeallitas(fa, kulcs, null, [pont]);
  return fa;
}

// ===================================
// A TELJES ÚJRASZÁMOLÁS — a láncból (a próbák mércéje, és a ③-tól a teljes láncot tartó ellenőrzőé)
// ===================================

/**
 * ⭐ A szerző TELJES állapota a k-adik esemény előtt — a láncból, gyorsítótár nélkül: a napló
 * levelei és gyökere, a kiosztás FÁJA és gyökere, és a lánc-gyökér. ⭐ Ebből állítja elő a szerző a
 * bizonyítékot (a ③ lépés: a kiosztás egy entitásának bizonyítéka, a napló egy eseményéé).
 *
 * @param {Array<Object>} elozmenyek - a szerző eseményei, sorszám szerint 1-től, hézag nélkül
 * @param {number} [alap] - ⭐⭐ D128 (9.9): a lánc alapja (a koinó kerete vagy 0) — a kerete az alap + a kapott
 * @param {Object} [nezet] - ⭐ D118 (⑤b): a szerző lánca a koinóban (`koinoLanc.js` `lancNezete`) — a kiosztásba csak a
 *        jelen réteg eseményei számítanak, a hozottak a számított összeggel; nélküle minden esemény a saját koinóé
 * @param {Object} [alapok] - ⭐⭐ D128 (9.9): az azonosság láncainak alapjai (`lancAlapjai` — az átvételek ítéletéhez); nélküle
 *        mindegyiké az `alap`
 * @returns {Promise<Object|null>} null, ha a lánc nem ép
 */
export async function lancAllapotaLancbol(elozmenyek, alap = ALAP_SZABALYOK.tudatpontKeret, nezet = null, alapok = null) {
  const allas = ujLancAllas();
  const alapjai = alapok ?? { keret: alap, horgonyLanca: null };
  const naploLevelek = [];
  let elozo = null;
  for (let i = 0; i < elozmenyek.length; i++) {
    const e = elozmenyek[i];
    if (e.sorszam !== i + 1 || (e.elozo ?? null) !== elozo) return null;
    naploLevelek.push(await levelOsszegzes(NAPLO_FAJTA, e.azonosito));
    if (!nezet || nezet.szamit(e)) allasLepese(allas, e, alap, alapjai, nezet ? nezet.hozott(e) : false);
    elozo = e.azonosito;
  }
  const naploGyoker = await naploGyokere(NAPLO_FAJTA, naploLevelek);
  const kiosztasFa = await kiosztasFaja(allas.pontok);
  const kiosztasGyoker = await allapotGyokere(kiosztasFa);
  const kapottFa = await kapottFaja(allas.kapott);
  const kapottGyoker = await allapotGyokere(kapottFa);
  return {
    naploLevelek, naploGyoker, kiosztasFa, kiosztasGyoker, kapottFa, kapottGyoker, osszeg: allas.osszeg,
    kapottOsszeg: allas.kapottOsszeg, lancGyoker: lancGyokerGyokerekbol(naploGyoker, kiosztasGyoker, kapottGyoker)
  };
}

/**
 * A lánc-gyökér a szerző 1..k-1 sorszámú eseményeiből — a k-adik eseményhez. Gyorsítótár nélkül.
 * @returns {Promise<Object|null>} null, ha a lánc nem ép
 */
export async function lancGyokerLancbol(elozmenyek, alap, nezet = null, alapok = null) {
  return (await lancAllapotaLancbol(elozmenyek, alap, nezet, alapok))?.lancGyoker ?? null;
}

/**
 * ⭐ D118/2 (①b): a koinó tudatpont-kerete a tárból — lenyomat-nevű koinónál a születés azonosítója maga a koinó neve
 * (egy kérdés); ha nincs meg (vagy a régi alak), a mai érték.
 */
export async function koinoKerete(tar, koino) {
  const szuletes = azonositoAlaku(koino) ? await tar?.esemeny?.(koino) : null;
  return koinoSzabalyai(szuletes ?? null).tudatpontKeret;
}

/**
 * ⭐⭐ D128 (9.9): egy azonosság LÁNCAINAK ALAPJA a tárból — lánc → a koinó kerete, ha ez a lánc írta az azonosság alap-horgonyát
 * (`tagsag.js` `alapHorgony` — ugyanaz a szabály, mint a szabály-rétegben), 0, ha egy másik lánca; ha a horgony nincs meg nálunk,
 * mindegyiké a koinó kerete. ⛔ D123 PR2: ADAT, nem függvény (`tagsag.js` `alapokAlapja` számol belőle); a `kulcs`-a a kerete és a
 * horgony lánca (a gyorsítótár ehhez köti a képét).
 * @param {Object} tar
 * @param {string} koino
 * @param {string|null} szerzo - az azonosság
 * @returns {Promise<{keret: number, horgonyLanca: string|null, kulcs: string}>}
 */
export async function lancAlapjai(tar, koino, szerzo) {
  const keret = await koinoKerete(tar, koino);
  const mind = { keret, horgonyLanca: null, kulcs: keret + '|' };
  if (typeof szerzo !== 'string' || typeof tar?.azonossagEsemenyei !== 'function') return mind;
  const horgonyok = (await tar.azonossagEsemenyei(szerzo)).filter((e) => HORGONY_TIPUSOK.has(e?.tipus)
    && (e.tipus !== 'KoinoLetrehozas' ? esemenyKoinoja(e) === koino : koinoSzuleteseE(e, koino)));
  const h = alapHorgony(horgonyok);
  if (!h) return mind;
  const horgonyLanca = lancKulcsa(h);
  return { keret, horgonyLanca, kulcs: keret + '|' + horgonyLanca };
}

/** Egy lánc (készülék) azonossága a tárból — a lánc első eseményéből (egy készüléket egy azonosság tanúsíthat). */
async function lancSzerzoje(tar, lanc) {
  if (typeof lanc !== 'string') return null;
  if (typeof tar?.sorszamSzerint === 'function') {
    const elso = (await tar.sorszamSzerint(lanc, 1))[0];
    if (typeof elso?.szerzo === 'string') return elso.szerzo;
  }
  return typeof tar?.lancEsemenyei === 'function' ? (await tar.lancEsemenyei(lanc))[0]?.szerzo ?? null : null;
}

/**
 * ⭐⭐ D128 (9.9): egy LÁNC (készülék) ALAP-kerete a tárból (`lancAlapjai`). ⚠️ A teljes kerete az alap + a kapott — a kapott
 * eseményenként más (a lánc-gyökér harmadik fája): a vád-ellenőrzés (`ellentmondas.js`) a vádolt esemény aláírt kapottját adja
 * hozzá, a művelet a saját láncából számolja (`muveletek.js` `sajatKiosztott`).
 * @param {Object} tar
 * @param {string} koino
 * @param {string} lanc - a lánc kulcsa (a készüléké)
 * @param {string|null} [szerzo] - az azonosság (ha nincs megadva, a lánc eseményeiből)
 * @returns {Promise<number>}
 */
export async function lancAlapKerete(tar, koino, lanc, szerzo = null) {
  if (typeof lanc !== 'string') return koinoKerete(tar, koino);
  return alapokAlapja(await lancAlapjai(tar, koino, szerzo ?? await lancSzerzoje(tar, lanc)), lanc);
}

// ===================================
// A GYORSÍTÓTÁRAS ÚT — a szerző minden új eseményénél
// ===================================

// tár → (szerző → állapot): a folyamaton belüli emlékezet.
const memoria = new WeakMap();

// ⚠️ A `kiosztasFa` (a kiosztás FÁJA) csak a memóriában él — a fájl a pontokat tartja, a fa a
// bizonyítékhoz kérésre épül belőlük (egy pont-eseménynél).
const uresAllapot = (lanc) => ({
  lanc, sorszam: 0, utolso: null, naplo: ujNaplo(NAPLO_FAJTA),
  osszeg: 0, pontok: new Map(), kiosztasGyoker: null, kiosztasFa: null,
  kapottOsszeg: 0, kapott: new Map(), kapottGyoker: null, kapottFa: null   // ⭐⭐ D128 (9.9)
});

/** A gyorsítótár tartalmának ellenőrző-lenyomata (a csendes sérülés ellen). */
const ellenorzoje = (adat) => lenyomat(['lanc-gyorsitotar', adat.v, adat.lanc, adat.sorszam, adat.utolso,
  adat.csucsok, adat.osszeg, adat.pontok, adat.kiosztasGyoker, adat.nezet ?? '',
  adat.kapottOsszeg, adat.kapott, adat.kapottGyoker, adat.alapKulcs]);

/**
 * A fájlból olvasott gyorsítótár — ha ép. ⛔ Egy gyorsítótárban sem bízunk vakon: ha rossz kiosztás-
 * gyökeret adna, a szerző egy HAMIS gyökeret írna alá, és egy szúrópróba (D79) csalásnak látná. Ezért
 * a tartalmát egy ellenőrző-lenyomat köti, és a belső számai is egyezzenek.
 */
async function fajlbolAllapot(adat, lanc) {
  if (!adat || adat.v !== TAR_VALTOZAT || adat.lanc !== lanc) return null;
  try {
    if (adat.ell !== await ellenorzoje(adat)) return null;
  } catch {
    return null;                         // kanonikus alakra sem hozható: sérült
  }
  if (!Number.isSafeInteger(adat.sorszam) || adat.sorszam < 0) return null;
  if (!Array.isArray(adat.csucsok) || !adat.csucsok.every((cs) => cs && Number.isSafeInteger(cs.meret)
      && cs.meret > 0 && osszegzesAlakja(cs.osszegzes, 0))) return null;
  if (!Array.isArray(adat.pontok) || !adat.pontok.every((p) => Array.isArray(p) && typeof p[0] === 'string'
      && Number.isSafeInteger(p[1]) && p[1] >= 0)) return null;
  if (!Number.isSafeInteger(adat.osszeg) || !osszegzesAlakja(adat.kiosztasGyoker, KIOSZTAS_HOSSZ)) return null;
  // ⭐⭐ D128 (9.9): a kapott (adó → halmozott) és a gyökere; a kép a lánc alapjához kötött (`alapKulcs`).
  if (!Array.isArray(adat.kapott) || !adat.kapott.every((p) => Array.isArray(p) && typeof p[0] === 'string'
      && Number.isSafeInteger(p[1]) && p[1] >= 0)) return null;
  if (!Number.isSafeInteger(adat.kapottOsszeg) || !osszegzesAlakja(adat.kapottGyoker, KAPOTT_HOSSZ)
      || typeof adat.alapKulcs !== 'string') return null;
  // ⚠️ Belső szám-egyezést (a napló mérete, a kiosztás összege) nem nézünk külön: a tartalmat az
  // ellenőrző-lenyomat köti, a láncra pedig az utolsó azonosító (rontás-próba: a kettő mellett nem
  // mérhető — egy őr, ami semmit nem fog meg, csak azt hiteti el, hogy véd).
  const naplo = { ...ujNaplo(NAPLO_FAJTA), csucsok: adat.csucsok };
  const pontok = new Map(adat.pontok);
  // ⚠️ A keret nélküli (régebbi) fájl a mai kerettel készült.
  const keret = adat.keret ?? ALAP_SZABALYOK.tudatpontKeret;
  if (!Number.isSafeInteger(keret)) return null;
  return { lanc, sorszam: adat.sorszam, utolso: adat.utolso ?? null, naplo, osszeg: adat.osszeg, pontok,
    kiosztasGyoker: adat.kiosztasGyoker, kiosztasFa: null, keret, nezet: typeof adat.nezet === 'string' ? adat.nezet : '',
    kapottOsszeg: adat.kapottOsszeg, kapott: new Map(adat.kapott), kapottGyoker: adat.kapottGyoker, kapottFa: null,
    alapKulcs: adat.alapKulcs };
}

async function fajlba(a) {
  const adat = {
    v: TAR_VALTOZAT, lanc: a.lanc, sorszam: a.sorszam, utolso: a.utolso, csucsok: a.naplo.csucsok,
    osszeg: a.osszeg, pontok: [...a.pontok], kiosztasGyoker: a.kiosztasGyoker, keret: a.keret, nezet: a.nezet ?? '',
    kapottOsszeg: a.kapottOsszeg, kapott: [...a.kapott], kapottGyoker: a.kapottGyoker, alapKulcs: a.alapKulcs
  };
  return { ...adat, ell: await ellenorzoje(adat) };
}

/** Illik-e az állapot a lánchoz: a lefedett utolsó sorszámon tényleg az az (egyetlen) esemény áll? */
async function illikALanchoz(tar, nezet, a) {
  if (a.sorszam === 0) return true;
  const ott = (await tar.sorszamSzerint(a.lanc, a.sorszam)).filter(nezet.tagja);
  return ott.length === 1 && ott[0].azonosito === a.utolso;
}

/**
 * A szerző állapota az 1..meddig sorszámú eseményei után — a gyorsítótárból, a hiányzó végét a
 * láncból pótolva.
 * @returns {Promise<Object|null>} null, ha a saját lánc nem ép (hézag, elágazás, szakadás)
 */
async function allapotIg(tar, koino, lanc, meddig, tarolo) {
  // ⭐⭐ D128 (9.9): a lánc ALAPJA (`keret` — a kerete az alap + a kapott), és az azonosság többi láncáé (az átvételek ítéletéhez).
  const szerzo = await lancSzerzoje(tar, lanc);
  const alapjai = await lancAlapjai(tar, koino, szerzo);
  const keret = alapokAlapja(alapjai, lanc);
  // ⭐⭐ D128 (①d, 9.10): a kizárt készülék vágás utáni eseményei nem a lánc részei (az örökös folytatja).
  const kizarasok = await tarKizarasai(tar, szerzo);
  const lancon = (e) => nezet.tagja(e) && !kizartE(e, kizarasok);
  // ⭐⭐ D118 (⑤b): a szerző LÁNCA a koinóban — a bekapcsolódóé a hozott előtaggal (a napló a teljes láncot fedi), a kiosztás a
  // jelen réteg szerint (a hozott pontok a számított összeggel, az elhagyottak nélkül). Eddig a koinó nevére szűrt: a
  // bekapcsolódó lánca az 1. sorszámon „nem ép” volt, és a gyermekbeli eseményei lánc-gyökér nélkül születtek.
  const nezet = await lancNezete(tar, koino, lanc);
  let tarbeli = memoria.get(tar);
  if (!tarbeli) { tarbeli = new Map(); memoria.set(tar, tarbeli); }

  // ----- Honnan indulunk: memória → fájl → üres -----
  let a = null;
  // ⚠️ A fájl hibája nem hiba: a gyorsítótár elhagyható, a lánc pótolja.
  const fajlbol = tarolo ? await fajlbolAllapot(await tarolo.olvas().catch(() => null), lanc) : null;
  for (const jelolt of [tarbeli.get(lanc), fajlbol]) {
    // ⭐ D118/2: a kép a koinó keretével készült — ha azóta megjött a születés (más kerettel), a lánc újraszámolja.
    // ⭐ D118 (⑤b): és a lánc nézetével (ha azóta bekapcsolódtam, más a lánc és a kiosztás).
    if (jelolt && jelolt.sorszam <= meddig && jelolt.keret === keret && (jelolt.nezet ?? '') === nezet.kulcs
        && jelolt.alapKulcs === alapjai.kulcs && await illikALanchoz(tar, nezet, jelolt)) {
      a = jelolt; break;
    }
  }
  if (!a) a = { ...uresAllapot(lanc), keret, nezet: nezet.kulcs, alapKulcs: alapjai.kulcs };
  const indulo = a.sorszam;

  // ----- A hiányzó vég a láncból -----
  let pontValtozott = a.kiosztasGyoker === null;
  let kapottValtozott = a.kapottGyoker === null;
  const naplo = a.naplo;
  const pontok = new Map(a.pontok);
  const kapott = new Map(a.kapott);
  const allas = { osszeg: a.osszeg, pontok, kapott, kapottOsszeg: a.kapottOsszeg };
  let utolso = a.utolso;
  let uj = naplo;
  for (let s = a.sorszam + 1; s <= meddig; s++) {
    const ott = (await tar.sorszamSzerint(lanc, s)).filter(lancon);
    if (ott.length !== 1 || (ott[0].elozo ?? null) !== utolso) {
      console.warn('lancGyoker - a saját lánc nem ép (hézag, elágazás vagy szakadás) — nem horgonyzunk',
        { sorszam: s, talalat: ott.length });
      return null;
    }
    uj = await naploHozzafuzes(uj, await levelOsszegzes(NAPLO_FAJTA, ott[0].azonosito));
    if (nezet.szamit(ott[0])) {
      const mi = allasLepese(allas, ott[0], keret, alapjai, nezet.hozott(ott[0]));
      if (mi === 'pont') pontValtozott = true;
      else if (mi === 'kapott') kapottValtozott = true;
    }
    utolso = ott[0].azonosito;
  }
  const kiosztasFa = pontValtozott ? await kiosztasFaja(pontok) : a.kiosztasFa;
  const kapottFa = kapottValtozott ? await kapottFaja(kapott) : a.kapottFa;
  const kesz = {
    lanc, sorszam: meddig, utolso, naplo: uj, osszeg: allas.osszeg, pontok, kiosztasFa, keret, nezet: nezet.kulcs,
    kiosztasGyoker: pontValtozott ? await allapotGyokere(kiosztasFa) : a.kiosztasGyoker,
    kapottOsszeg: allas.kapottOsszeg, kapott, kapottFa, alapKulcs: alapjai.kulcs,
    kapottGyoker: kapottValtozott ? await allapotGyokere(kapottFa) : a.kapottGyoker
  };

  tarbeli.set(lanc, kesz);
  if (tarolo && meddig !== indulo) {
    await tarolo.ir(await fajlba(kesz)).catch((hiba) =>
      console.warn('lancGyoker - a gyorsítótár nem írható (nem baj, a lánc pótolja)', { hiba: hiba.message }));
  }
  return kesz;
}

/**
 * ⭐ A LÁNC-GYÖKÉR (és a pont-esemény bizonyítéka) EGY ÚJ SAJÁT ESEMÉNYHEZ — a `sorszam`-adik
 * eseményhez, az 1..sorszam-1 állapotából.
 *
 * @param {Object} tar
 * @param {string} koino
 * @param {string} lanc - ⭐⭐ D128: a lánc kulcsa (a készülék kulcsa — `lancKulcsa`)
 * @param {number} sorszam - az új esemény sorszáma (a lánc vége + 1)
 * @param {Object} [tarolo] - a gyorsítótár fájlja (`lancTarolo`); nélküle csak a memória
 * @param {string|Array<string>|null} [entitas] - pont-eseménynél az entitás (a régi értékének
 *        bizonyítéka); szavazatnál a kulcsok listája (D85/2) — kulcsonként egy bizonyíték
 * @param {string|null} [kapottKulcs] - ⭐⭐ D128 (9.9): átvételnél az adó készülék (a kapott-fa levelének bizonyítéka)
 * @returns {Promise<{lancGyoker: Object|null, bizonyitek: Object|null, kapottBizonyitek: Object|null, keret: number|null}>}
 *          null-ok, ha a saját lánc nem ép; a `keret` a lánc kerete az új esemény előtt (az alap + a kapott)
 */
export async function lancUjEsemenyhez(tar, koino, lanc, sorszam, tarolo = null, entitas = null, kapottKulcs = null) {
  const a = await allapotIg(tar, koino, lanc, sorszam - 1, tarolo);
  if (!a) return { lancGyoker: null, bizonyitek: null, kapottBizonyitek: null, keret: null };
  const lancGyoker = lancGyokerGyokerekbol(await naploCsucsGyokere(a.naplo), a.kiosztasGyoker, a.kapottGyoker);
  let bizonyitek = null;
  if (typeof entitas === 'string') {
    // A fa a pontokból épül (a fájlból jött állapotnak csak a pontjai vannak meg) — egyszer.
    if (!a.kiosztasFa) a.kiosztasFa = await kiosztasFaja(a.pontok);
    bizonyitek = await allapotBizonyitek(a.kiosztasFa, entitas);
  } else if (Array.isArray(entitas) && entitas.length) {
    // ⭐ D85/2: a SZAVAZAT több entitásra hoz bizonyítékot (részenként az érintettére és a
    // javaslat-entitásáéra) — kulcsonként egyet.
    if (!a.kiosztasFa) a.kiosztasFa = await kiosztasFaja(a.pontok);
    bizonyitek = {};
    for (const kulcs of entitas) bizonyitek[kulcs] = await allapotBizonyitek(a.kiosztasFa, kulcs);
  }
  let kapottBizonyitek = null;
  if (typeof kapottKulcs === 'string') {
    if (!a.kapottFa) a.kapottFa = await kapottFaja(a.kapott);
    kapottBizonyitek = await allapotBizonyitek(a.kapottFa, kapottKulcs);
  }
  return { lancGyoker, bizonyitek, kapottBizonyitek, keret: a.keret + a.kapottOsszeg };
}

/** A lánc-gyökér egy új saját eseményhez (a bizonyíték nélkül). */
export async function lancGyokerUjEsemenyhez(tar, koino, lanc, sorszam, tarolo = null) {
  return (await lancUjEsemenyhez(tar, koino, lanc, sorszam, tarolo)).lancGyoker;
}
