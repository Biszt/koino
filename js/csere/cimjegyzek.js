// js/csere/cimjegyzek.js

// Felelősség: A CÍMJEGYZÉK (G — D84/2, D90, D91): „mi kinél van" — a hash-elhelyezés tiszta számításai.
// Hálózatot NEM nyit (1. szabály): a téma és a gyökér-darab számítása; hogy mi viszi a DHT-ra, az a hívóé.
//
// ===== A DÖNTÉS (D91, Csaba, 2026-10-03) =====
//
// ⭐ A „mi kinél van" FŐ ÚTJA a FA és a RAJ (a skálázási terv 4.2): a tartók a szelet cseréjekor egymás
// készülék-azonosítóját adják át, a szülő tartói a gyerekekét is — a böngészés a fa bejárása, a titkosított
// cserén belül. ⭐ A HASH-ELHELYEZÉS CSAK KÉT HELYEN: a GYÖKÉR DARABJAI (D90 — a legfelső szintnek nincs
// szülője) és a KÖZVETLEN KERESÉS azonosító alapján (gyorsító, elhagyható). A közege most a BitTorrent-DHT
// (BEP 5) VAKÍTOTT témával: a téma a koino azonosítójával sózott lenyomat — aki nem ismeri a koinot, nem tudja
// kiszámolni, hol keresse (a Hyperswarm mintája; D89/2: a zárt koino címjegyzéke nem olvasható ki).
//
// ⚠️ A cím NÉV NÉLKÜL (SK2, D6), bizalom nem jár vele (3. szabály — a hamis cím elérhetetlenséget okoz,
// nem hamisítást), és CSAK a vállalt szeletet hirdetjük, a megnézettet soha (D75/3).
//
// Használják: koino.js (a hirdetés és a keresés), a mérések, a próbák.

import { createHash } from 'node:crypto';
// ⭐⭐ D130 (③f): a koinon példányszámának alapértéke a koino szabályai közül (EGY forrás — a mező nélküli születésé is ez)
import { ALAP_SZABALYOK } from '../esemeny/koinoSzabalyok.js';
// ⭐⭐ D130 (④b): egy cím összehasonlítható alakja (a látott tartók címenként egyszer — hálózat nélküli, tiszta függvény)
import { cimNormalizalasa } from './tarsak.js';

/** A téma fajtái: egy szelet közvetlen keresése, a gyökér egy darabja, a kopogtató, és a kereső-réteg régiója (D105). */
export const TEMA_FAJTAK = ['szelet', 'gyoker', 'kopogtato', 'kereso'];

/**
 * A VAKÍTOTT TÉMA — 20 bájt (a BEP 5 `info_hash` mérete): `H("koino-cimjegyzek-1" ‖ koino ‖ fajta ‖ kulcs)`.
 * ⭐ A koino azonosítója a só: kívülálló nem tudja kiszámolni (a zárt koino a titkosított csere óta nem adja
 * ki), a DHT-gépek csak egy értelmezhetetlen lenyomatot látnak.
 *
 * ⭐⭐ D124 ⑤ (PV5 (A)): A TÉMA HORDOZZA A VÁLTOZATÁT — a címke száma a témák változata (`n`; a mai az 1-es, bájtra
 * változatlanul: `koino-cimjegyzek-1`). Egy törés után a 2-es téma máshol van: az átmenet alatt a hirdető mindkettőn bejelent, a
 * kereső mindkettőn néz (`kiirtAlak.js` — a hívó a változatonkénti témát kéri: `hirdetendoTemak` és `figyelendoKopogtatok`
 * `temak`-ja). Egy régi kereső így a régin találja meg az újat, egy új az újon a régit.
 *
 * @param {string} koino
 * @param {'szelet'|'gyoker'} fajta
 * @param {string|number} kulcs - a szelet azonosítója, vagy a gyökér-darab sorszáma
 * @param {number} [n] - a témák változata (a mai az 1-es)
 * @returns {Buffer} 20 bájt
 */
export function cimjegyzekTema(koino, fajta, kulcs, n = 1) {
  if (!TEMA_FAJTAK.includes(fajta)) throw new Error('ismeretlen téma-fajta: ' + fajta);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('a téma változata pozitív egész');
  return createHash('sha256').update('koino-cimjegyzek-' + n).update('|').update(String(koino)).update('|')
    .update(fajta).update('|').update(String(kulcs)).digest().subarray(0, 20);
}

// ===================================
// ⭐⭐ D106 (Csaba, 2026-10-15): A DARAB-SZÁM SZÉLESSÉGE — a koino saját határáig
// ===================================
//
// A „végtelen” mércéje (D106): egy méret-korlát se legyen szűkebb, mint a koino SAJÁT határa — az azonosító-tér (egy
// entitás neve a 256 bites lenyomata; ~2^128 entitás fölött két név véletlenül egybeeshet, ennél többet a koino semmilyen
// formában nem tud megkülönböztetni). A darab-szám ezért nem 16 bites (az ~16,8 millió legfelső szintű gondolatnál
// megállt volna, és onnan a darab a koinoval nőtt volna), hanem a lenyomat annyi bitje, amennyi a mélységhez kell —
// legfeljebb `GYOKER_MAX_MELYSEG`, amennyi a 43 jeles kulcsba fér. A koino határához ~120 bit kell, a kereső-réteg
// indexéhez (ami ezt a mintát veszi át, D105) ~124. ⚠️ A darab száma ezért `BigInt`: a JS-szám 2^53 fölött pontatlan.
//
// ⭐ D105 (2026-10-16): a darab-számítás KÖZÖS — a gyökér darabjai (`g`) és a kereső-réteg régiói (`k` — `keresoReteg.js`)
// ugyanazt a lenyomat-teret, kulcs-alakot és mélység-becslést használják, más „sóval” (a felhasználás nevével). Egy helyen,
// hogy a kettő ne térhessen el egymástól; a gyökér függvényei vékony burkolók (bájtra ugyanazt adják, mint előtte).

/** ⭐ D106: a legnagyobb mélység — 144 bit: amennyi a kulcsba fér (36 hexa jegy), a koino saját határán túl. */
export const GYOKER_MAX_MELYSEG = 144;
/** ⭐ D105: ugyanaz a szélesség minden darab-számításnak (a gyökér és a kereső-réteg). */
export const DARAB_MAX_MELYSEG = GYOKER_MAX_MELYSEG;

const LENYOMAT_BAJT = DARAB_MAX_MELYSEG / 8;
const GYOKER_SO = 'koino-gyoker-darab-1';

/**
 * ⭐ A DARAB-LENYOMAT (közös): egy szöveg helye a lenyomat-térben — a `so` (a felhasználás neve) és a szöveg
 * lenyomatának első `DARAB_MAX_MELYSEG` bitje. Minden mélység darabja ennek az előtagja (a darabok egymásba ágyazottak: a
 * mélyebb a sekélyebb fele).
 * @param {string} so
 * @param {string} szoveg
 * @returns {bigint}
 */
export function darabLenyomata(so, szoveg) {
  const h = createHash('sha256').update(so).update(String(szoveg)).digest();
  return BigInt('0x' + h.subarray(0, LENYOMAT_BAJT).toString('hex'));
}

/**
 * A lenyomat első `bitek` bitje — a darab száma azon a mélységen.
 * @param {bigint} lenyomat
 * @param {number} bitek - 0..`DARAB_MAX_MELYSEG`
 * @returns {bigint}
 */
export function lenyomatDarabja(lenyomat, bitek) {
  if (!Number.isInteger(bitek) || bitek < 0 || bitek > DARAB_MAX_MELYSEG) {
    throw new Error('a darab-bitek 0 és ' + DARAB_MAX_MELYSEG + ' között');
  }
  return bitek === 0 ? 0n : lenyomat >> BigInt(DARAB_MAX_MELYSEG - bitek);
}

/**
 * ⭐ D106: egy azonosító GYÖKÉR-LENYOMATA — a darab-számítás lenyomatának első `GYOKER_MAX_MELYSEG` bitje.
 * @param {string} azonosito
 * @returns {bigint}
 */
export function gyokerLenyomata(azonosito) {
  return darabLenyomata(GYOKER_SO, azonosito);
}

/**
 * A GYÖKÉR-DARAB (D90): egy legfelső szintű gondolat melyik darabba esik — az azonosítója lenyomatának első
 * `bitek` bitje. Mindenki ugyanígy számolja (bárki tudja, ki tudhatja — D84/2). ⭐ 16 bitig ugyanaz a szám, mint a
 * D106 előtt (a lenyomat ugyanaz, csak hosszabb darabja olvasható).
 *
 * @param {string} azonosito
 * @param {number} bitek - 0..`GYOKER_MAX_MELYSEG` (2^bitek darab)
 * @returns {bigint}
 */
export function gyokerDarabja(azonosito, bitek) {
  if (!Number.isInteger(bitek) || bitek < 0 || bitek > GYOKER_MAX_MELYSEG) {
    throw new Error('a darab-bitek 0 és ' + GYOKER_MAX_MELYSEG + ' között');
  }
  if (bitek === 0) return 0n;
  return lenyomatDarabja(gyokerLenyomata(azonosito), bitek);
}

/**
 * Egy KÉSZÜLÉK darabjai (közös) — a tábla-aláírójából, a `so` szerinti helyen, `darab` egymást követő darab (a
 * példányszám így a készülékek számából jön: N készülék, 2^bitek darab → darabonként N·darab / 2^bitek).
 *
 * @param {string} so - a felhasználás neve (a gyökér és a kereső-réteg más helyre teszi ugyanazt a készüléket)
 * @param {string} alairo - a tábla-kulcs aláírója (a készülék neve, nem az azonosság — D6)
 * @param {number} bitek
 * @param {number} [darab]
 * @returns {Array<bigint>}
 */
export function keszulekDarabjai(so, alairo, bitek, darab = 1) {
  const kezdo = lenyomatDarabja(darabLenyomata(so, 'keszulek|' + alairo), bitek);
  const osszes = 1n << BigInt(bitek);
  const ki = [];
  const kert = Number.isInteger(darab) && darab > 0 ? BigInt(darab) : 0n;
  for (let i = 0n; i < kert && i < osszes; i++) ki.push((kezdo + i) % osszes);
  return ki;
}

/**
 * Egy készülék melyik gyökér-darabokért felel — a tábla-aláírójából (`keszulekDarabjai`, a gyökér sójával).
 * @param {string} alairo
 * @param {number} bitek
 * @param {number} [darab]
 * @returns {Array<bigint>}
 */
export function sajatGyokerDarabjai(alairo, bitek, darab = 1) {
  return keszulekDarabjai(GYOKER_SO, alairo, bitek, darab);
}

// ===================================
// ⭐⭐ D95/4: A GYÖKÉR DARABJAI A CSERÉBEN
// ===================================
//
// A gyökér (a legfelső szintű gondolatok születése) nem egészében cserélődik, hanem darabonként: egy darab „szeletként”
// megy a vonalon. A KULCSA egy felismerhető, 43 jeles (a vonal kulcs-mintájának megfelelő) szöveg — nullák, egy jel (`g`),
// a mélység (2 hex), a darab (hexa jegyek) és két nulla —, amit egyetlen esemény azonosítója sem vehet fel, és amiből bárki
// visszafejti, mit jelent: a halmazát bárki kiszámolja a saját tárából (a gyökérhez bejelentett születések közül a darabba
// esők). ⭐ D106: a darab jegyeinek száma a mélységből jön — 16 mélységig négy (34 nullával, bájtra a D106 előtti kulcs),
// fölötte annyi, amennyi a darabhoz kell (a 144-es mélységen 36, két nullával); a nullák a 43 jelet töltik ki. Egy darabnak
// egyetlen kulcsa van (a jegyek száma kötött). ⭐ D105: a kereső-réteg régiójának kulcsa ugyanez az alak, `k` jellel; ⭐⭐ D130
// (③c): a koinon darabjáé `n` jellel. ⭐ A
// készülék a saját darabjában a mélysége ±1 szintjén vesz részt — a mélységet ki-ki a maga tudásából becsli, és a
// szomszédos becslésűek így is találkoznak (a darabok egymásba ágyazottak: a mélyebb darab a sekélyebb fele).

const KULCS_HOSSZ = 43;
/**
 * A darab-kulcsok jele: `g` — a gyökér darabja (D95/4), `k` — a kereső-réteg régiója (D105), `n` — a koinon darabja (D130).
 * ⛔ Nem lehet hexa jegy (a nullák és a mélység közt állna), és nem lehet `s` (a koino születésének kulcsa — `szeletEgyeztetes.js`).
 */
export const DARAB_JELEK = ['g', 'k', 'n'];
const DARAB_MINTA = /^(0+)([gkn])([0-9a-f]{2})([0-9a-f]{4,36})00$/;

/** Hány hexa jegyen áll egy darab a kulcsban (16 mélységig 4 — a D106 előtti alak). */
const darabJegyei = (melyseg) => Math.max(4, Math.ceil(melyseg / 4));

/**
 * Egy darab kulcsa a vonalon (közös).
 * @param {string} jel - `g` (a gyökér darabja), `k` (a kereső-réteg régiója) vagy `n` (a koinon darabja)
 * @param {number} melyseg - 0..`DARAB_MAX_MELYSEG`
 * @param {bigint|number} darab - 0..2^mélység − 1
 * @returns {string}
 */
export function darabKulcsa(jel, melyseg, darab) {
  if (!DARAB_JELEK.includes(jel)) throw new Error('ismeretlen darab-jel: ' + jel);
  if (!Number.isInteger(melyseg) || melyseg < 0 || melyseg > DARAB_MAX_MELYSEG) {
    throw new Error('a mélység 0 és ' + DARAB_MAX_MELYSEG + ' között');
  }
  const d = typeof darab === 'bigint' ? darab : Number.isSafeInteger(darab) ? BigInt(darab) : null;
  if (d === null || d < 0n || d >= 1n << BigInt(melyseg)) throw new Error('a darab 0 és 2^mélység között');
  const jegyek = darabJegyei(melyseg);
  return '0'.repeat(KULCS_HOSSZ - 5 - jegyek) + jel + melyseg.toString(16).padStart(2, '0')
    + d.toString(16).padStart(jegyek, '0') + '00';
}

/**
 * Egy darab-kulcsból a jel, a mélység és a darab — vagy null, ha nem darab-kulcs (vagy érvénytelen, vagy nem a darab
 * egyetlen kulcsa: a jegyek száma a mélységé).
 * @returns {{jel: string, melyseg: number, darab: bigint}|null}
 */
export function darabKulcsBol(kulcs) {
  if (typeof kulcs !== 'string' || kulcs.length !== KULCS_HOSSZ) return null;
  const t = DARAB_MINTA.exec(kulcs);
  if (!t) return null;
  const melyseg = parseInt(t[3], 16);
  if (melyseg > DARAB_MAX_MELYSEG || t[4].length !== darabJegyei(melyseg)) return null;
  const darab = BigInt('0x' + t[4]);
  if (darab >= 1n << BigInt(melyseg)) return null;
  return { jel: t[2], melyseg, darab };
}

/**
 * Egy gyökér-darab kulcsa a vonalon.
 * @param {number} melyseg - 0..`GYOKER_MAX_MELYSEG`
 * @param {bigint|number} darab - 0..2^mélység − 1
 * @returns {string}
 */
export function gyokerDarabKulcsa(melyseg, darab) {
  return darabKulcsa('g', melyseg, darab);
}

/**
 * A kulcsból a mélység és a darab — vagy null, ha nem gyökér-darab kulcs (a kereső-régióé sem az).
 * @returns {{melyseg: number, darab: bigint}|null}
 */
export function gyokerDarabBol(kulcs) {
  const d = darabKulcsBol(kulcs);
  return d && d.jel === 'g' ? { melyseg: d.melyseg, darab: d.darab } : null;
}

/**
 * Beleesik-e egy elem egy darabba — a darab-lenyomatából (`darabLenyomata`: egy lenyomat, minden mélységre).
 * @param {bigint} lenyomat
 * @param {number} melyseg
 * @param {bigint|number} darab
 */
export function darabbaEsik(lenyomat, melyseg, darab) {
  return (lenyomat >> BigInt(DARAB_MAX_MELYSEG - melyseg)) === BigInt(darab);
}

/**
 * ⭐ A MÉLYSÉG BECSLÉSE A SAJÁT DARABBÓL (közös): a szigorú (b) alatt senki nem látja az egészet, csak a darabjait. Minden
 * s mélységen a becslés: a SAJÁT s-mélységű darabomban ismert elemek × 2^s — ahol a darabot egészében ismerem, ez a teljes
 * szám becslése; sekélyebben (ahol csak a darabomat ismerem) kisebb. Ezért a MAXIMUM, azokon a mélységeken, ahol legalább
 * fél darabnyi adat van (különben a zaj vinné el); ha egyiken sincs, az ismert elemek száma. ⚠️ Két gép becslése eltérhet —
 * a részvétel ezért ±1 mélységű. ⭐ D106: a mélység `DARAB_MAX_MELYSEG`-ig mehet; a mélyebb darab a sekélyebb része, ezért
 * elég a maradékot szűrni (a munka a saját darabom méretével arányos).
 *
 * @param {Array<bigint>} lenyomatok - az ismert elemek darab-lenyomata
 * @param {bigint} sajat - a készülék darab-lenyomata (ugyanazzal a sóval)
 * @param {number} cel - egy darabba nagyjából ennyi elem essen
 * @returns {{melyseg: number, becsles: number}}
 */
export function melysegBecslese(lenyomatok, sajat, cel) {
  let maradek = Array.isArray(lenyomatok) ? lenyomatok : [];
  const c = Number.isFinite(cel) && cel > 0 ? cel : 1;
  let becsles = maradek.length;
  for (let s = 1; s <= DARAB_MAX_MELYSEG; s++) {
    const d = sajat >> BigInt(DARAB_MAX_MELYSEG - s);
    maradek = maradek.filter((x) => darabbaEsik(x, s, d));
    if (maradek.length < c / 2) break;           // mélyebben már csak kevesebb lesz
    becsles = Math.max(becsles, maradek.length * 2 ** s);
  }
  return { melyseg: darabMelysege(becsles, c), becsles };
}

/**
 * ⭐ A DARAB-MÉLYSÉG (közös) az elemek számából: annyi bit, hogy egy darabba ~`cel` jusson — kis halmaznál 0, és
 * logaritmikusan nő (a „végtelen”: egy darab mérete nem nő a koinoval — D106: `DARAB_MAX_MELYSEG`-ig).
 * @param {number} elemek
 * @param {number} cel
 * @returns {number} 0..`DARAB_MAX_MELYSEG`
 */
export function darabMelysege(elemek, cel) {
  const n = Number.isFinite(elemek) && elemek > 0 ? elemek : 0;
  const c = Number.isFinite(cel) && cel > 0 ? cel : 1;
  if (n <= c) return 0;
  return Math.min(DARAB_MAX_MELYSEG, Math.ceil(Math.log2(n / c)));
}

/**
 * ⭐ A GYÖKÉR MÉLYSÉGÉNEK BECSLÉSE (`melysegBecslese` a gyökér céljával).
 * @param {Array<bigint>} szuletesek - az ismert gyökér-születések gyökér-lenyomata (`gyokerLenyomata(az)`)
 * @param {bigint} sajat - a készülék gyökér-lenyomata (`gyokerLenyomata('keszulek|' + aláíró)`)
 * @param {number} [cel]
 * @returns {{melyseg: number, becsles: number}}
 */
export function gyokerMelysegBecslese(szuletesek, sajat, cel = GYOKER_DARAB_CEL) {
  return melysegBecslese(szuletesek, sajat, Number.isFinite(cel) && cel > 0 ? cel : GYOKER_DARAB_CEL);
}

/**
 * Egy készülék darab-kulcsai (közös): a saját darabja a mélysége −1, 0, +1 szintjén (0 és `DARAB_MAX_MELYSEG` között).
 * @param {string} so
 * @param {string} jel
 * @param {string} alairo - a tábla-kulcs aláírója
 * @param {number} melyseg
 * @returns {Array<string>}
 */
export function keszulekDarabKulcsai(so, jel, alairo, melyseg) {
  const ki = [];
  for (let m = Math.max(melyseg - 1, 0); m <= Math.min(melyseg + 1, DARAB_MAX_MELYSEG); m++) {
    ki.push(darabKulcsa(jel, m, keszulekDarabjai(so, alairo, m, 1)[0]));
  }
  return ki;
}

/**
 * A készülék gyökér-darabjainak kulcsai: a saját darabja a mélysége −1, 0, +1 szintjén.
 * @param {string} alairo - a tábla-kulcs aláírója
 * @param {number} melyseg
 * @returns {Array<string>}
 */
export function gyokerDarabKulcsai(alairo, melyseg) {
  return keszulekDarabKulcsai(GYOKER_SO, 'g', alairo, melyseg);
}

/**
 * ⭐ A NYITÁS GYÖKÉR-JELE (`gyd` — D95/4): a mélységem és a darabjaim rövid lenyomata egy szövegben, `m:l1:l2:l3` (a
 * kulcsokat a társ számolja a tábla-aláírómból). ⚠️ Minden cserén utazik, ezért tömör (6. szabály).
 * @param {number} melyseg
 * @param {Array<string|null>} lenyomatok - a darabjaim (`gyokerDarabKulcsai` sorrendjében) 11 jeles lenyomata, vagy null
 */
export function gyokerJelSzovege(melyseg, lenyomatok) {
  return melyseg + ':' + lenyomatok.map((x) => x ?? '').join(':');
}

/**
 * …és az olvasása: null, ha nem ilyen alakú, vagy a mélység a határon kívül van (⭐ D106: 0..`GYOKER_MAX_MELYSEG`,
 * legfeljebb három számjegy).
 * @returns {{melyseg: number, lenyomatok: Array<string|null>}|null}
 */
export function gyokerJelOlvasasa(szoveg) {
  if (typeof szoveg !== 'string' || !/^\d{1,3}(:[A-Za-z0-9_-]{0,11}){1,3}$/.test(szoveg)) return null;
  const g = szoveg.split(':');
  const melyseg = parseInt(g[0], 10);
  if (melyseg > GYOKER_MAX_MELYSEG) return null;
  return { melyseg, lenyomatok: g.slice(1).map((x) => x || null) };
}

// ===================================
// ⭐⭐ D130 (③c — KO2 (A), KO4, KO6 (A)): A KOINON DARABJAI
// ===================================
//
// Az elfogadott általános egyezmények tényét és hatályát (a `KoinonOsszegzes` — a döntés tömör alakja — és az állásfoglalások)
// a koinon DARABJAI őrzik: egy egyezmény az azonosítója szerint egy darabba esik, a készülék a tábla-aláírója szerinti darabot
// tartja. ⭐ A gyökér-darab mintája (ugyanaz a lenyomat-tér és kulcs-alak, a koinon sójával, `n` jellel) — két eltéréssel:
// - **a mélység a TARTÓK számából jön, nem az elemekéből** (KO2 (A)): annyi bit, hogy egy darabnak ~`r` tartója legyen
//   (`floor(log2(tagok / r))` — a 95. mérés). A tagok száma az ISMERT tagoké: azt alulbecsülni lehet (az csak terhet hoz),
//   túlbecsülni nem (a veszélyes oldal — kevesebb tartó);
// - **átfedés nélkül** (KO6 (A)): a készülék CSAK a saját mélységén lévő darabját tartja (nem a szomszéd szintet is). A cserében
//   a szomszéd mélységű társsal a kettő közös része egyeztetődik — a MÉLYEBB darab (a sekélyebbnek az egyik fele: mindkettőnél
//   egészében megvan) —, nem a sekélyebb (az a mélyebb becslésűnél csak félig). Ezért a jel a saját darab mellett a két felét
//   viszi (a gyökéré a ±1 szintet).

const KOINON_SO = 'koino-koinon-darab-1';
/**
 * ⭐ KO4: a koinon példányszáma (egy darab ennyi tartója) — az ALAPÉRTÉK (20). ⭐⭐ D130 (③f): a koino a születésében mondja ki
 * (`koinoSzabalyok.js` `koinonPeldany`); ez csak a mező nélküli születésé és a megadott nélküli hívásé.
 */
export const KOINON_PELDANY = ALAP_SZABALYOK.koinonPeldany;

/**
 * Egy egyezmény (a javaslata azonosítója) KOINON-LENYOMATA — a darab-számítás lenyomata a koinon sójával.
 * @param {string} azonosito
 * @returns {bigint}
 */
export function koinonLenyomata(azonosito) {
  return darabLenyomata(KOINON_SO, azonosito);
}

/**
 * Egy egyezmény koinon-darabjának kulcsa egy mélységen (a javaslata azonosítójából).
 * @param {string} azonosito
 * @param {number} melyseg
 * @returns {string}
 */
export function egyezmenyKoinonDarabKulcsa(azonosito, melyseg) {
  return koinonDarabKulcsa(melyseg, lenyomatDarabja(koinonLenyomata(azonosito), melyseg));
}

/**
 * Egy koinon-darab kulcsa a vonalon.
 * @param {number} melyseg - 0..`DARAB_MAX_MELYSEG`
 * @param {bigint|number} darab - 0..2^mélység − 1
 * @returns {string}
 */
export function koinonDarabKulcsa(melyseg, darab) {
  return darabKulcsa('n', melyseg, darab);
}

/**
 * A kulcsból a mélység és a darab — vagy null, ha nem koinon-darab kulcs.
 * @returns {{melyseg: number, darab: bigint}|null}
 */
export function koinonDarabBol(kulcs) {
  const d = darabKulcsBol(kulcs);
  return d && d.jel === 'n' ? { melyseg: d.melyseg, darab: d.darab } : null;
}

/**
 * A készülék koinon-darabjának kulcsai: a SAJÁT darabja a mélységén, és a két FELE eggyel mélyebben (a legmélyebb szinten csak
 * a saját). A NYITÁS jele ezek rövid lenyomatát viszi, ebben a sorrendben (a társ a tábla-aláírómból ugyanezeket számolja).
 * ⭐ KO6 (A): mindhármat egészében tartom (a felek a darabom részei) — a sekélyebb társsal a darabom, a mélyebbel annak a fele
 * a közös, és mindkettő lenyomata a jelben van.
 * @param {string} alairo
 * @param {number} melyseg
 * @returns {Array<string>}
 */
export function koinonDarabKulcsai(alairo, melyseg) {
  const d = keszulekDarabjai(KOINON_SO, alairo, melyseg, 1)[0];
  const ki = [koinonDarabKulcsa(melyseg, d)];
  if (melyseg < DARAB_MAX_MELYSEG) ki.push(koinonDarabKulcsa(melyseg + 1, 2n * d), koinonDarabKulcsa(melyseg + 1, 2n * d + 1n));
  return ki;
}

/**
 * ⭐ KO2 (A), 95. mérés: A KOINON MÉLYSÉGE a tagok számából — `floor(log2(tagok / r))`: 2^mélység ≤ tagok / r, így egy
 * darabra átlagosan legalább `r` tartó jut (a lefelé kerekítés a tartók felé dönt). Kevés tagnál (2r alatt) 0 — egy darab:
 * mindenki mindent tart.
 * @param {number} tagok - az ismert tagok száma
 * @param {number} [r] - a példányszám
 * @returns {number} 0..`DARAB_MAX_MELYSEG`
 */
export function koinonMelysege(tagok, r = KOINON_PELDANY) {
  const n = Number.isFinite(tagok) && tagok > 0 ? tagok : 0;
  const p = Number.isFinite(r) && r >= 1 ? r : KOINON_PELDANY;
  if (n < 2 * p) return 0;
  return Math.min(DARAB_MAX_MELYSEG, Math.floor(Math.log2(n / p)));
}

/**
 * ⭐ KO6 (A): A KÖZÖS KOINON-DARAB két készülék között — a két darab közül a KISEBBIK, ha benne van a nagyobbikban (egy
 * mélységen: ha ugyanaz; szomszéd mélységen: ha a mélyebbé a sekélyebbé egyik fele) — az mindkettőnél egészében megvan. A
 * lenyomata a mélyebbnél a saját darabjáé, a sekélyebbnél a megfelelő feléé (a jelben ott van). Mindkét fél ugyanezt számolja
 * (a két nyitásból). ⛔ Két szint távolságnál nincs közös darab (a jel a saját szintet és a felét viszi).
 * @param {{alairo: string, melyseg: number, lenyomatok: Array<string|null>}} a - a jel (`koinonDarabKulcsai` sorrendjében)
 * @param {{alairo: string, melyseg: number, lenyomatok: Array<string|null>}} b
 * @returns {{kulcs: string, a: string|null, b: string|null}|null}
 */
export function kozosKoinonDarab(a, b) {
  // ⭐⭐ D130 (④c1): a darab a jelből is jöhet (`darab` — egy SEGÍTŐ kosár: nem a tábla-aláírásból számolt), különben az aláírásból
  const darabja = (x) => (typeof x.darab === 'bigint' ? x.darab : keszulekDarabjai(KOINON_SO, x.alairo, x.melyseg, 1)[0]);
  const l = (x, i) => x.lenyomatok[i] ?? null;
  if (a.melyseg === b.melyseg) {
    const d = darabja(a);
    return d === darabja(b) ? { kulcs: koinonDarabKulcsa(a.melyseg, d), a: l(a, 0), b: l(b, 0) } : null;
  }
  const [sekely, mely] = a.melyseg < b.melyseg ? [a, b] : [b, a];
  if (mely.melyseg !== sekely.melyseg + 1) return null;
  const dm = darabja(mely);
  if ((dm >> 1n) !== darabja(sekely)) return null;
  const sekelyL = l(sekely, 1 + Number(dm & 1n));
  const melyL = l(mely, 0);
  return { kulcs: koinonDarabKulcsa(mely.melyseg, dm), a: a === sekely ? sekelyL : melyL, b: b === sekely ? sekelyL : melyL };
}

// ===================================
// ⭐⭐ D130 (④c1 — `koinon_atvizsgalas.md` 11., 4. pont): A SEGÍTŐ KOSARAK A NYITÓ JELBEN
// ===================================
//
// A segítő kosár (amit a ④c pótlása ad egy készüléknek a sajátja mellé) nem a tábla-aláírásból jön, ezért a társ nem tudja
// kiszámolni: a nyitó jel `knk` mezője viszi — kosaranként a mélysége, a darab száma és a három rövid lenyomat (a kosáré és a két
// feléé, mint a saját darabé a `knd`-ben). ⭐ Ebből a társ két dolgot tud: (1) a KÖZÖS kosarakat (`kozosKoinonKosarak` — a saját és a
// segítő kosarak bármely párja, ugyanazon vagy szomszéd mélységen, mint a `kozosKoinonDarab`), így a segítő kosár a többi tartójával
// egyeztetődik; (2) a TERHÉT (`koinonTeher`) — a ④c pótlásának jelöltjei ebből választanak. ⚠️ A bevallott teher hamisítható: aki
// többet mond, potyázik, aki kevesebbet, magára vesz többet — tartót egyik sem vesz el (a 11. szakasz 6. pontja). A régebbi program a
// mezőt nem nézi: vele csak a saját darab egyeztetődik (mint eddig).

/** ⭐ 9. szabály: a nyitó jel legfeljebb ennyi segítő kosarat visz (a megtelt készülék nem vállal többet). */
export const KOINON_KOSAR_JEL_KORLAT = 32;

/**
 * Egy kosár kulcsai a jelhez: a kosár maga és a két fele (a legmélyebb szinten csak maga) — a `koinonDarabKulcsai` párja, az
 * aláírás helyett a megadott darabbal.
 * @param {number} melyseg
 * @param {bigint} darab
 * @returns {Array<string>}
 */
export function koinonKosarKulcsai(melyseg, darab) {
  const ki = [koinonDarabKulcsa(melyseg, darab)];
  if (melyseg < DARAB_MAX_MELYSEG) ki.push(koinonDarabKulcsa(melyseg + 1, 2n * darab), koinonDarabKulcsa(melyseg + 1, 2n * darab + 1n));
  return ki;
}

/** Egy segítő kosár a jelben: `m:d:l:l0:l1` (a darab hexában, az üres lenyomat üres). */
export function kosarJelSzovege({ melyseg, darab, lenyomatok = [] }) {
  return melyseg + ':' + darab.toString(16) + ':' + [0, 1, 2].map((i) => lenyomatok[i] ?? '').join(':');
}

/**
 * …és az olvasása: null, ha nem ilyen alakú, a mélység 1 és a határ közé nem esik (a 0. mélységű kosár az egész koinon — azt
 * mindenki tartja, segítő nem lehet), vagy a darab a mélységen kívül van.
 * @returns {{melyseg: number, darab: bigint, lenyomatok: Array<string|null>}|null}
 */
export function kosarJelOlvasasa(szoveg) {
  if (typeof szoveg !== 'string' || !/^\d{1,3}:[0-9a-f]{1,36}(:[A-Za-z0-9_-]{0,11}){3}$/.test(szoveg)) return null;
  const g = szoveg.split(':');
  const melyseg = parseInt(g[0], 10);
  if (melyseg < 1 || melyseg > DARAB_MAX_MELYSEG) return null;
  const darab = BigInt('0x' + g[1]);
  if (darab >= (1n << BigInt(melyseg))) return null;
  return { melyseg, darab, lenyomatok: g.slice(2).map((x) => x || null) };
}

/**
 * ⭐ A KÖZÖS KOSARAK két készülék között — a két fél minden tartott kosarának (a saját és a segítő kosarak) bármely párjára a
 * `kozosKoinonDarab` (ugyanaz a darab, vagy szomszéd mélységen a mélyebb, ha a sekélyebbnek fele), kulcsonként egyszer.
 * @param {Array<{alairo?: string, darab?: bigint, melyseg: number, lenyomatok: Array<string|null>}>} sajatok
 * @param {Array<{alairo?: string, darab?: bigint, melyseg: number, lenyomatok: Array<string|null>}>} ovek
 * @returns {Array<{kulcs: string, a: string|null, b: string|null}>} az `a` a saját oldal lenyomata, a `b` a társé
 */
export function kozosKoinonKosarak(sajatok = [], ovek = []) {
  const ki = new Map();
  for (const a of sajatok) {
    for (const b of ovek) {
      const k = kozosKoinonDarab(a, b);
      if (k && !ki.has(k.kulcs)) ki.set(k.kulcs, k);
    }
  }
  return [...ki.values()];
}

/**
 * ⭐ A TEHER a jelből — a tartott kosarak a koinon hányad részét adják (a mélységükkel súlyozva: egy kettéválás így nem
 * duplázza — a két fél ugyanannyi, mint az egész). A kosarak átfedését nem vonja le (a jel nem szól róla): a szám bevallás.
 * @param {Array<{melyseg: number}>} kosarak
 * @returns {number}
 */
export function koinonTeher(kosarak = []) {
  let t = 0;
  for (const k of Array.isArray(kosarak) ? kosarak : []) if (Number.isInteger(k?.melyseg) && k.melyseg >= 0) t += 2 ** -k.melyseg;
  return t;
}

// ===================================
// ⭐⭐ D130 (④a — KO11 (A), a 98. mérés után): A KOINON KOSARAI A DHT-N
// ===================================
//
// A tartó a KOSARAIT hirdeti (a koinon darabja egy kosár — benne egész általános egyezmények): a sajátját, és a ④c-től a segítő
// kosarait is. ⭐ A `szelet` fajtával, a darab-kulcson: így a kérő MEGLÉVŐ útja — a jelentkezés a téma párján (D92/1), a DHT-keresés
// a téma hirdetőire — változtatás nélkül eléri, és a tartó a párt magától figyeli (`figyelendoKopogtatok` a `szelet` párokat nézi).
// ⛔ A 0. mélységen nincs mit hirdetni: egy darab van — az egész koinon —, és azt minden tag tartja (a gyökér hirdetése elég).
// Az ára kosaranként egy téma és a párja körönként (~6 KB, ~20 percenként — napi ~0,4 MB a fent töltött időre).

/**
 * A hirdetendő koinon-kosarak témái — a nem koinon-darab kulcsot, a 0. mélységűt és az ismétlést kihagyja.
 * @param {Object} b
 * @param {string} b.koino
 * @param {Array<string>} b.kosarak - a tartott kosarak darab-kulcsai (elöl a saját)
 * @param {number[]} [b.valtozatok] - ⭐ D124 ⑤: a témák élő változatai, a legújabbtól
 * @returns {Array<{fajta: 'szelet', kulcs: string, tema: Buffer, temak: Buffer[]}>}
 */
export function koinonHirdetendoTemak({ koino, kosarak = [], valtozatok = [1] }) {
  const ki = [];
  for (const k of Array.isArray(kosarak) ? kosarak : []) {
    const d = typeof k === 'string' ? koinonDarabBol(k) : null;
    if (!d || d.melyseg === 0 || ki.some((t) => t.kulcs === k)) continue;
    ki.push(temaValtozatokkal('szelet', k, (n) => cimjegyzekTema(koino, 'szelet', k, n), valtozatok));
  }
  return ki;
}

/**
 * ⭐⭐ D130 (④a — `koinon_atvizsgalas.md` 11., 7. pont): HOL KERESI A KÉRŐ egy koinon-darab tartóit — a darab saját témáján, és a
 * SZÜLŐJÉÉN: a sekélyebb tartó az egész szülőt tartja, benne a kért darabot is (a mélység csak nő, és egy új tag sekélyebben kezd —
 * kevesebb tagot ismer). ⛔ A gyermekekén NEM (a gyökértől eltérően): a mélyebb tartó a darabnak csak a felét tartja, és a fél válasz
 * a kérelmet „megjött”-nek jelölné. A 0. mélységű szülőt senki nem hirdeti (ott mindenki mindent tart), arra nem kell jelentkezni.
 * ⭐⭐ D130 (④c4 — KO19 (A), a 99. mérés): és a NAGYSZÜLŐJÉÉN (a 3. mélységtől): egy kettéválás átmenetében a durvább szerepek a
 * nagyszülő szintjére kerülnek — az adat megvan, csak a szülőnél tovább senki nem keresett (a kettéválás utáni gödör láthatóság volt).
 * @param {string} kulcs - egy koinon-darab kulcsa
 * @returns {Array<string>} a darab-kulcsok, elöl a kért, utána a szülő és a nagyszülő — nem koinon-darab kulcsra üres
 */
export function koinonKeresoKulcsai(kulcs) {
  const d = typeof kulcs === 'string' ? koinonDarabBol(kulcs) : null;
  if (!d) return [];
  const ki = [kulcs];
  if (d.melyseg >= 2) ki.push(koinonDarabKulcsa(d.melyseg - 1, d.darab >> 1n));
  if (d.melyseg >= 3) ki.push(koinonDarabKulcsa(d.melyseg - 2, d.darab >> 2n));
  return ki;
}

// ===================================
// ⭐⭐ D130 (④b — KO14 (A), KO17 (A), a 98. mérés): A KOSÁR LÁTOTT TARTÓI
// ===================================
//
// Csaba (2026-11-26): „azt kéne számon tartani, hogy mennyien vannak online, egy adott egyezménynél”. A tartó a kosara témáján a
// DHT-n látott hirdetőket számolja (a hirdetés saját keresésének találatából — többlet-forgalom nélkül), és ha kevés, a SZÜLŐ-kosár
// hirdetőit is (a sekélyebb tartó az egész szülőt tartja — `koinonKeresoKulcsai`). Két szabály (`koinon_atvizsgalas.md` 11.):
// - **egy IPv4-cím egynek számít**, akárhány porton hirdet (6. pont): egy hamis hirdető-sereghez így annyi cím kell, amennyi a cél. Az
//   alulszámolás a biztonságos irány — két telefon egy router mögött egynek látszik, az egy fölösleges tartót hoz, nem kevesebbet;
// - **a saját címeim nem számítanak** (a korábbi hirdetésem még a DHT-n van — a 30–60 perces felejtés): helyettük egyszer magamat. A
//   velem egy router mögötti társ így szintén kimarad (alulszámolás — a biztonságos irány).
// ⭐ KO17 (A): a LÁTOTT cél a koino `koinonPeldany`-jának (a valóban online őrzők száma) 1,25-szöröse — a DHT a lekapcsolt tartót még
// 30–60 percig mutatja, és a 98. mérés rosszabb esetében ez a ráhagyás adja vissza a „valóban 20 online” képét.

/** ⭐ KO17 (A): a DHT késésének ráhagyása — a látott cél a példányszám ennyiszerese (a 98. mérés rosszabb esetéből; terepen pontosítható). */
export const KOINON_KESES_RAHAGYAS = 1.25;

/**
 * A látott cél: ennyi tartónak kell a DHT-n látszania egy kosáron (felfelé kerekítve — a több tartó felé).
 * @param {number} r - a koino példányszáma (`koinonPeldany`)
 * @returns {number}
 */
export function koinonLatottCel(r = KOINON_PELDANY) {
  const p = Number.isFinite(r) && r >= 1 ? r : KOINON_PELDANY;
  return Math.ceil(p * KOINON_KESES_RAHAGYAS);
}

/**
 * A kosár LÁTOTT TARTÓI: a saját témája és (ha megnézte) a szülő-kosár hirdetőinek különböző címei — a saját címeim nélkül —, és
 * egyszer én magam.
 * @param {Object} b
 * @param {Array<{cim: string, port: number}>} [b.tarsak] - a kosár témájának hirdetői
 * @param {Array<{cim: string, port: number}>} [b.szuloTarsak] - a szülő-kosár témájának hirdetői (a második pillantás)
 * @param {Array<string>} [b.sajatCimek] - a gépem címei és a mért külső címem
 * @returns {number} legalább 1 (én)
 */
export function koinonLatottTartok({ tarsak = [], szuloTarsak = [], sajatCimek = [], sajatIs = true } = {}) {
  // ⭐⭐ D130 (④c2): a felkért jelölt még nem tartó — ő magát nem számolja (`sajatIs: false`)
  return (sajatIs === false ? 0 : 1) + koinonLatottCimek({ tarsak, szuloTarsak, sajatCimek }).size;
}

/**
 * ⭐⭐ D130 (⑤a): a kosár LÁTOTT CÍMEI — a `koinonLatottTartok` halmaza (címenként egyszer, a saját címeim nélkül), egy helyen: a
 * terep számlálás-naplója pontosan ezeket jegyzi fel (lenyomatként), amiket a számlálás számol.
 * @returns {Set<string>} a normalizált címek
 */
export function koinonLatottCimek({ tarsak = [], szuloTarsak = [], sajatCimek = [] } = {}) {
  const sajat = new Set((Array.isArray(sajatCimek) ? sajatCimek : []).map(cimNormalizalasa));
  const cimek = new Set();
  for (const t of [...(Array.isArray(tarsak) ? tarsak : []), ...(Array.isArray(szuloTarsak) ? szuloTarsak : [])]) {
    const c = cimNormalizalasa(t?.cim);
    if (c && !sajat.has(c)) cimek.add(c);
  }
  return cimek;
}

// ===================================
// ⭐⭐ D130 (④c2 — `koinon_atvizsgalas.md` 11., 4., 6., 8. pont): A FELKÉRÉS ÉS A KERET
// ===================================
//
// A felkért jelölt maga dönt: a gyors ellenőrzés a kérelem kiszolgálásakor (a kerete, a kosár érvényes-e a mélységén, tartja-e már),
// a hiány megnézése később, a saját címjegyzék-körében (egy DHT-keresés — a csere közben nem várhat rá). ⭐ A hiány saját megnézése
// zárja ki, hogy egy idegen olyan kosarakkal terhelje, amelyeknek nincs rá szükségük (a 6. pont: a hamis felkérő csak terhet adhatna
// — ezt a jelölt keresése és a kerete korlátozza). Az ütem: óránként legfeljebb egy új szerep felkérésre. A keret: amennyit a
// készülék a koinonnak ad — fölötte nem vállal, és ha a keretet lejjebb veszik, a legújabb segítő szerepeit leadja (Csaba: „leadni
// csak a megtelt készülék ad le”).

/** A keret alapértéke (MB) — a 97–98. mérés terhe 7–42 MB; ennél jóval nagyobb (a 11. szakasz 8. pontja). */
export const KOINON_KERET_ALAP_MB = 256;
/** Óránként legfeljebb egy új szerep felkérésre (a 11. szakasz 6. pontja — az elnémított téma korlátja is). */
export const KOINON_UJ_SZEREP_KOZ = 60 * 60 * 1000;
/** Legfeljebb ennyi függő felkérés (9. szabály), és egy ennyi idő után elévül. */
export const KOINON_FUGGO_KORLAT = 4;
export const KOINON_FUGGO_ELEVULES = 60 * 60 * 1000;

/**
 * Tartalmazza-e a `kulso` kosár a `belso`-t (ugyanaz, vagy a belső a külső része: mélyebb, és az előtagja a külső darabja).
 * @param {{melyseg: number, darab: bigint}} kulso
 * @param {{melyseg: number, darab: bigint}} belso
 * @returns {boolean}
 */
export function kosarTartalmazza(kulso, belso) {
  if (!kulso || !belso || kulso.melyseg > belso.melyseg) return false;
  return (belso.darab >> BigInt(belso.melyseg - kulso.melyseg)) === kulso.darab;
}

/**
 * ⭐ A KERET FÖLÖTT: mely segítő szerepeket adja le a készülék — a legújabbakat, amíg a teher a keret alá nem kerül (a saját kosár
 * soha: azt a tábla-aláírás adja). Az össz-teher egyszer számolja az eseményt (két tartott kosár átfedhet); a leadott kosár a SAJÁT
 * terhét vonja le — átfedésnél ez több a valódi csökkenésnél, így a leadás inkább korábban áll meg (több tartó marad — a biztonságos
 * irány).
 * @param {Object} b
 * @param {Array<{kulcs: string, ido: number, bajt: number}>} b.segitok
 * @param {number} b.osszBajt - az össz-teher (minden tartott kosár, eseményenként egyszer)
 * @param {number} b.keretBajt
 * @returns {Array<string>} a leadandó kulcsok, a legújabbtól
 */
export function leadandoSegitok({ segitok = [], osszBajt = 0, keretBajt = Infinity } = {}) {
  let ossz = Number.isFinite(osszBajt) ? osszBajt : 0;
  const ki = [];
  for (const s of [...segitok].sort((a, b) => (b.ido ?? 0) - (a.ido ?? 0))) {
    if (ossz <= keretBajt) break;
    ki.push(s.kulcs);
    ossz -= Number.isFinite(s.bajt) ? s.bajt : 0;
  }
  return ki;
}

// ===================================
// ⭐⭐ D130 (④c3 — KO15 (A), KO16 (A), a 98. mérés; `koinon_atvizsgalas.md` 11., 1., 4., 5. pont): A PÓTLÁS
// ===================================
//
// Ha egy kosaramnak a látott cél alatt van a tartója, a kosár online tartói — egymásról nem tudva — SORSOLNAK: mindegyik
// kosaranként óránként egyszer, 1/n eséllyel (n: a látott tartók), így átlagosan egy pótol (a 98. mérés 1. pontja: a kép a 97.-é).
// A pótló egy VÉLETLEN GYÖKÉR-DARAB témájának hirdetőit veszi mintának (KO16 (A) — minden készülék a saját gyökér-darabját hirdeti,
// így a most fent lévők egyenletes mintája), legfeljebb 10-et kérdez meg: közvetlen kopogással a címükön, és a minta témájának
// PÁRJÁN a kopogtató úton (a NAT mögöttiek ott látják, és felé kopognak). A kérdezés egy PRÓBA-FELKÉRÉS (`kerdes`): a jelölt a gyors
// ellenőrzését elvégzi (a kerete, a mélysége, tartja-e már), de nem jegyzi fel; a válaszát a NYITÓ JELE kíséri, amiből a pótló a
// terhét látja (`nyitasTerhe`). Az igazi felkérést csak a legkevesebbet őrző kapja (KO15 (A)) — a hiányt ő maga is megnézi (④c2).
// ⚠️ Korlát: egy készülék óránként legfeljebb egy pótlást kezd (a 6. pont — az elnémított téma is legfeljebb ennyi terhet hoz).
// ⚠️ A jelöltek címenként (cím ÉS port) számítanak, nem IPv4-enként: egy router mögötti két telefon két jelölt. Egy hamis hirdető
// így elfoglalhatja egy minta helyeit — de ezzel csak EGY pótlást ront el (a következő órában egy másik véletlen darab a minta),
// tartót nem vesz el (a 6. pont).

/** KO15 (A): ennyi jelölt közül a legkevesebbet őrző kapja a felkérést. */
export const KOINON_JELOLT_KORLAT = 10;
/** Kosaranként óránként egy sorsolás, és készülékenként óránként legfeljebb egy pótlás (a 98. mérés üteme; a 6. pont korlátja). */
export const KOINON_POTLAS_KOZ = 60 * 60 * 1000;
/**
 * A jelöltek gyűjtése legfeljebb ennyi ideig tart, ha a minta nem merül ki előbb: a kopogtató út hirdetői ~20 percenként néznek rá
 * a párra (a címjegyzék-körük), és onnan 30 percig kopognak.
 */
export const KOINON_JELOLT_IDO = 30 * 60 * 1000;

/**
 * A sorsolás: a kosár n látott tartója közül átlagosan egy pótol — mindegyik 1/n eséllyel (n legalább 1).
 * @param {number} latott
 * @param {Function} [veletlen] - [0, 1) közötti szám
 * @returns {boolean}
 */
export function potlasSorsolasa(latott, veletlen = Math.random) {
  const n = Number.isFinite(latott) && latott >= 1 ? latott : 1;
  return veletlen() < 1 / n;
}

/**
 * Egy véletlen darab a mélységen (a minta gyökér-darabja): a bájtok számának alsó `melyseg` bitje — a 0. mélységen 0.
 * @param {number} melyseg
 * @param {Uint8Array} bajtok - legalább ⌈melyseg / 8⌉ véletlen bájt
 * @returns {bigint}
 */
export function veletlenDarab(melyseg, bajtok) {
  if (!Number.isInteger(melyseg) || melyseg <= 0) return 0n;
  const hex = Buffer.from(bajtok ?? []).toString('hex');
  return BigInt.asUintN(melyseg, BigInt('0x' + (hex || '0')));
}

/**
 * A minta jelöltjei: címenként (cím:port) egyszer, a saját címeim és a kizártak (a kosár látott tartói — ők már tartják) nélkül,
 * véletlen sorrendben. A hívó az elejéből veszi a `KOINON_JELOLT_KORLAT`-ot; a lista hossza a minta mérete (a kimerüléshez).
 * @param {Object} b
 * @param {Array<{cim: string, port: number}>} [b.minta] - a gyökér-darab témájának hirdetői
 * @param {Array<{cim: string, port: number}>} [b.sajat] - a saját címeim (a gép címei a kapu portjával, a mért külső cím)
 * @param {Array<{cim: string, port: number}>} [b.kizart]
 * @param {Function} [b.veletlen]
 * @returns {Array<{cim: string, port: number}>}
 */
export function potlasJeloltjei({ minta = [], sajat = [], kizart = [], veletlen = Math.random } = {}) {
  const kulcs = (t) => cimNormalizalasa(t?.cim) + ':' + Number(t?.port);
  const tilos = new Set([...(Array.isArray(sajat) ? sajat : []), ...(Array.isArray(kizart) ? kizart : [])].map(kulcs));
  const ki = new Map();
  for (const t of Array.isArray(minta) ? minta : []) {
    const cim = cimNormalizalasa(t?.cim);
    const port = Number(t?.port);
    if (!cim || !Number.isInteger(port) || port <= 0 || port >= 65536) continue;
    const k = cim + ':' + port;
    if (!tilos.has(k) && !ki.has(k)) ki.set(k, { cim, port });
  }
  const lista = [...ki.values()];
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(veletlen() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

/**
 * A jelölt TERHE a nyitó jeléből: a tartott kosarai (`knd` — a saját darabja, `knk` — a segítő kosarai) a koinon hányad részét adják
 * (`koinonTeher`). Null, ha a jel nem mond semmit (a `knd` nélküli program).
 * @param {{knd?: string, knk?: Array<string>}|null} jel
 * @returns {number|null}
 */
export function nyitasTerhe(jel) {
  const g = gyokerJelOlvasasa(jel?.knd);
  if (!g) return null;
  const knk = (Array.isArray(jel?.knk) ? jel.knk : []).slice(0, KOINON_KOSAR_JEL_KORLAT).map(kosarJelOlvasasa).filter(Boolean);
  return koinonTeher([g, ...knk]);
}

/**
 * A VÁLASZTÁS (KO15 (A)): a „megnézem”-et mondók közül a legkisebb terhű — holtversenyben a korábban felelt; az ismeretlen terhű
 * (jel nélküli) a végére áll. Null, ha egy jelölt sem vállalná.
 * @param {Array<{allapot: string, teher: number|null, ido: number}>} jeloltek
 * @returns {Object|null}
 */
export function potlasValasztasa(jeloltek = []) {
  const t = (x) => (Number.isFinite(x.teher) ? x.teher : Infinity);
  const jok = (Array.isArray(jeloltek) ? jeloltek : []).filter((x) => x?.allapot === 'megnezem');
  jok.sort((a, b) => t(a) - t(b) || (a.ido ?? 0) - (b.ido ?? 0));
  return jok[0] ?? null;
}

/**
 * ⭐⭐ D130 (④d3 — `koinon_atvizsgalas.md` 11., 5. pont; 13., 4. pont): A KOPOGTATÓ ÚT CSAK KEVÉS KÖZVETLEN VÁLASZ UTÁN. A minta témájának
 * PÁRJÁN jelentkezve a téma minden hirdetője 30 percig felém kopog (a 99. utáni próba mérte: mind a négy jelölt kérőt látott, pedig a
 * kérdezésre 3 másodperc alatt közvetlenül feleltek — és egy kis koinoban minden pótló ezt teszi: a vihar a pótlók számával szorzódik).
 * Ezért a kérdezés előbb csak a címükre kopog, és ennyi őrjárat-kör után, ha addig kevés jelölt felelt, jelentkezik a párján (a NAT
 * mögöttiek ott látnak meg). ⚠️ A kör hossza: a kód alapértéke 5 perc, de a telepített indítók (`termux/indit.sh`, `windows/indit.ps1`
 * — `KOINO_KOR`) 1 perccel indítják az őrjáratot: a közvetlen próba így ~3 perc (5 perces körrel ~15).
 */
export const KOINON_KOZVETLEN_KOROK = 3;

/**
 * Kell-e a kopogtató út: letelt a közvetlen próba (`korok`), és kevesebben feleltek, mint amennyi a döntéshez kell.
 * @param {{korok: number, felelt: number, meret: number}} b
 * @returns {boolean}
 */
export function kopogtatoUtKell({ korok = 0, felelt = 0, meret = 0 } = {}) {
  return korok >= KOINON_KOZVETLEN_KOROK && felelt < Math.min(KOINON_JELOLT_KORLAT, Math.max(1, meret));
}

/**
 * Eldőlhet-e a pótlás: a minta kimerült (mind felelt, legfeljebb `korlat`), vagy letelt a gyűjtés ideje (⭐ ④d3: a `kezdet` a párján
 * jelentkezés ideje, ha volt — a kopogtató útnak idő kell: a hirdetők ~20 percenként néznek rá).
 * @param {{felelt: number, minta: number, kezdet: number, most?: number}} b
 * @returns {boolean}
 */
export function potlasDonthet({ felelt = 0, minta = 0, kezdet = 0, most = Date.now() } = {}) {
  return felelt >= Math.min(KOINON_JELOLT_KORLAT, Math.max(1, minta)) || most - kezdet >= KOINON_JELOLT_IDO;
}

/** A teher szövege: a koinon hány százaléka (a napló és a `koinon kosarak`). */
export function teherSzazalek(t) {
  if (!Number.isFinite(t)) return '?';
  const sz = t * 100;
  return (sz >= 10 ? sz.toFixed(0) : sz >= 1 ? sz.toFixed(1) : sz.toPrecision(2)).replace('.', ',') + '%';
}

/**
 * Egy pótlás indulásának mondata (a napló és a `koinon potol`).
 * @param {{eredmeny: string, minta?: string, jeloltek?: number, meret?: number, latott?: number, cel?: number}} x
 * @returns {string}
 */
export function potlasIndulasSzovege(x) {
  const elo = Number.isFinite(x?.latott) ? 'a kosaramnak ' + x.latott + ' tartó látszik (a cél ' + x.cel + '), kisorsoltak (1/'
    + Math.max(1, x.latott) + ')' : 'kézzel';
  if (x?.eredmeny === 'indult') {
    return elo + ' — ' + x.jeloltek + ' jelöltet kérdezek a DHT-mintáról (a ' + x.minta + ' gyökér-darab hirdetői'
      + (x.meret > x.jeloltek ? ', ' + x.meret + ' közül' : '') + '; a legkevesebbet őrző kapja a felkérést)';
  }
  if (x?.eredmeny === 'nincs jelolt') return elo + ', de a mintán nincs jelölt (a ' + x.minta + ' gyökér-darab hirdetői közül)';
  if (x?.eredmeny === 'nem felelt') return elo + ', de a DHT most nem felelt — a következő körben újra';
  return 'már folyik egy pótlás — egyszerre egy';
}

/**
 * Egy pótlás eredményének mondata (a napló, a `koinon kosarak` és a `koinon potol` ugyanígy mondja).
 * @param {{valasztott?: {cim: string, port: number, teher: number|null}|null, felelt?: number, ok?: string,
 *   felkeres?: {allapot: string, ok: string|null}}} e
 * @returns {string}
 */
export function potlasEredmenySzovege(e) {
  if (!e?.valasztott) return 'nem volt jelölt (' + (e?.ok ?? (e?.felelt ?? 0) + ' jelölt felelt, egyik sem vállalná') + ')';
  const v = e.valasztott;
  const f = e.felkeres;
  return (e.felelt ?? 0) + ' jelölt felelt; a legkevesebbet őrző (' + v.cim + ':' + v.port + ', a koinon ' + teherSzazalek(v.teher)
    + '-át őrzi) kapta a felkérést' + (!f ? ' — még nem értem el' : f.allapot === 'megnezem'
      ? ': megnézi (a hiányt maga is megnézi, és ha valódi, vállalja)' : f.allapot === 'mar' ? ': már tartja' : ': nem vállalja — ' + (f.ok ?? '?'));
}

// ===================================
// ⭐⭐ D130 (④c4 — KO18 (C), KO19 (A), a 99. mérés; `koinon_atvizsgalas.md` 12.): A KETTÉVÁLÁS ÉS AZ ÁTADÁS
// ===================================
//
// A mélység csak nő (az ismert tagok száma csak nő). Ha EGGYEL nő, a régi saját kosaram két félre válik: az egyik az új saját kosaram,
// a MÁSIK FELE (és minden segítő kosaram mindkét fele) ÖRÖKÖLT szerep lesz — a szerep finomodik, különben a kérő és a számláló nem
// látná (a 99. mérés: a nagyszülőnél tovább senki nem keres). ⚠️ Csak az a fél, amelyben TÉNYLEG van eseményem: amit nem kaptam meg
// (egy friss tag a sekély becslésén semmit nem kap egy nagy koinoban — a közös kosár csak szomszéd mélységen van), azt nem hirdethetem
// tartóként. Több szint ugrásnál (egy friss tag tanul, vagy sokáig nem voltam fent) nincs örökölt szerep: a régi mélységem nem volt
// kiforrott, a segítőim maradnak (a nagyszülő-pillantás látja őket). Az ÁTADÁS (KO18 (C) — Csaba szabályának egyetlen kivétele: „leadni
// csak a megtelt készülék ad le”): ha nélkülem is legalább a látott cél látszik 12 egymás utáni ellenőrzésen (óránként legfeljebb egy
// számít — a 99. mérés ellenőrzése egy fent töltött óra), az örökölt szerepet leadom; ha egyszer kevés, a sor elölről kezdődik.

/** KO18 (C): ennyi egymás utáni ellenőrzés után adom át az örökölt szerepet. */
export const KOINON_ATADAS_SOR = 12;
/** Egy ellenőrzés legfeljebb ennyi időnként számít (a címjegyzék-kör ~20 percenként fut). */
export const KOINON_ELLENORZES_KOZ = 50 * 60 * 1000;

/**
 * A KETTÉVÁLÁS SZEREPEI: ha a mélységem pontosan eggyel nőtt, a régi saját kosaram másik fele és a régi mélységemen (vagy fölötte)
 * lévő segítő kosaraim mindkét fele örökölt szerep — de csak az a fél, amelyben van eseményem; a mélyebb segítők változatlanok.
 * @param {Object} b
 * @param {number} b.regi - a régi mélységem
 * @param {number} b.uj - az új mélységem
 * @param {string} b.regiSajat - a régi saját kosaram kulcsa
 * @param {string} b.ujSajat - az új saját kosaram kulcsa
 * @param {Object} [b.segito] - a segítő szerepeim: { <kulcs>: { ido, ok, orokolt? } }
 * @param {Function} [b.vanBenne] - (kulcs) → van-e eseményem ebben a kosárban
 * @param {number} [b.most]
 * @returns {{segito: Object, orokolt: Array<string>, elengedett: Array<string>}} az új jegyzék, az új örökölt kulcsok, és a segítő
 *   szerepek, amelyeknek egyik felében sincs eseményem (azok megszűnnek)
 */
export function kettevalasSzerepei({ regi, uj, regiSajat, ujSajat, segito = {}, vanBenne = () => true, most = Date.now() }) {
  const ki = { ...segito };
  const orokolt = [], elengedett = [];
  if (!Number.isInteger(regi) || uj !== regi + 1) return { segito: ki, orokolt, elengedett };
  const felei = (k) => { const d = koinonDarabBol(k); return d ? [koinonDarabKulcsa(d.melyseg + 1, 2n * d.darab), koinonDarabKulcsa(d.melyseg + 1, 2n * d.darab + 1n)] : []; };
  const felvesz = (k, x) => {
    if (k === ujSajat || ki[k] || !vanBenne(k)) return false;
    ki[k] = x;
    orokolt.push(k);
    return true;
  };
  // a régi saját kosaram másik fele
  for (const f of felei(regiSajat)) if (f !== ujSajat) felvesz(f, { ido: most, ok: 'kettéválás', orokolt: true });
  // a segítő kosaraim a régi mélységemen vagy fölötte: mindkét fele (az eredeti idejével — a keret a legújabbat adja le előbb)
  for (const [k, x] of Object.entries(segito)) {
    const d = koinonDarabBol(k);
    if (!d || d.melyseg > regi || d.melyseg >= DARAB_MAX_MELYSEG) continue;
    delete ki[k];
    let marad = false;
    for (const f of felei(k)) marad = felvesz(f, { ido: x?.ido ?? most, ok: x?.ok ?? 'kettéválás', orokolt: true }) || marad || f === ujSajat;
    if (!marad) elengedett.push(k);
  }
  return { segito: ki, orokolt, elengedett };
}

/**
 * Egy örökölt kosár ELLENŐRZÉSE a számláláskor: ha nélkülem (`latott − 1`) is legalább a cél látszik, az ellenőrzés számít (óránként
 * legfeljebb egy); ha nem, a sor elölről kezdődik. A `KOINON_ATADAS_SOR`-adik után átadom.
 * @param {{sor?: number, sorIdo?: number, latott: number, cel: number, most?: number}} b - a `latott` velem együtt
 * @returns {{sor: number, sorIdo: number, atad: boolean}}
 */
export function orokoltEllenorzese({ sor = 0, sorIdo = 0, latott = 0, cel, most = Date.now() } = {}) {
  let s = Number.isInteger(sor) && sor > 0 ? sor : 0;
  let t = Number.isFinite(sorIdo) ? sorIdo : 0;
  if (latott - 1 >= cel) {
    if (most - t >= KOINON_ELLENORZES_KOZ) { s += 1; t = most; }
  } else {
    s = 0; t = 0;
  }
  return { sor: s, sorIdo: t, atad: s >= KOINON_ATADAS_SOR };
}

/**
 * Egy kettéválás mondata (a napló és a `koinon kosarak`).
 * @param {{regi: number, uj: number, orokolt?: Array<string>, elengedett?: Array<string>, levagott?: Array<string>}} x
 * @returns {string}
 */
export function kettevalasSzovege(x) {
  const jel = (k) => { const d = koinonDarabBol(k); return d ? d.melyseg + ':' + d.darab : '?'; };
  if (x?.uj !== x?.regi + 1) {
    return 'a koinon-mélységem ' + x?.regi + ' → ' + x?.uj + ' (több szint egyszerre — örökölt szerep nélkül; KO18 (C))';
  }
  return 'kettéválás (a koinon-mélységem ' + x.regi + ' → ' + x.uj + '): ' + (x.orokolt?.length
    ? x.orokolt.length + ' örökölt szerep (' + x.orokolt.map(jel).join(', ') + ') — átadom, ha nélkülem is megvan'
    : 'örökölt szerep nincs (a másik félben nincs eseményem)')
    + (x.elengedett?.length ? ' · ' + x.elengedett.length + ' segítő szerep megszűnt (egyik felében sincs eseményem)' : '')
    + (x.levagott?.length ? ' · a jel határán ' + x.levagott.length + ' levágva (a legújabbak)' : '') + ' (KO18 (C))';
}

/**
 * Egy kosár számlálásának mondata — a napló, a `cimjegyzek hirdet` és a `vallalas` ugyanígy mondja (egy helyen).
 * ⭐⭐ D130 (④c4 — KO19 (A)): ha a nagyszülőre is ránézett, azt is.
 * @param {{latott: number, cel: number, szulovel?: boolean, nagyszulovel?: boolean}} x
 * @returns {string}
 */
export function kosarSzamlalasSzovege(x) {
  return x.latott + ' tartó látszik a DHT-n' + (x.nagyszulovel ? ' (a szülő- és a nagyszülő-kosáréval együtt)'
    : x.szulovel ? ' (a szülő-kosáréval együtt)' : '') + ', a cél ' + x.cel + (x.latott < x.cel ? ' — kevés' : '');
}

// ===================================
// ⭐⭐ D91/3 (Csaba, 2026-10-03, az 58. mérés után): MIT HIRDET EGY KÉSZÜLÉK
// ===================================
//
// Az 58. mérés: a BitTorrent-DHT a hirdetést 30–60 perc alatt elfelejti — egy téma ~20 percenként ismételve
// ~0,65 MB/nap. Ezért: (1) MINDEN készülék a saját GYÖKÉR-DARABJÁT hirdeti (egy téma — a csere forgalmának
// töredéke); (2) a SZELETENKÉNTI hirdetés csak KÉSZÜLÉKENKÉNTI beállítással (alapból 0 — egy PC, amelyiknek nem
// számít a forgalom, néhányat hirdethet; egy telefonon 100 szelet ~65 MB/nap volna); (3) keresni bárki kereshet,
// igény szerint (~3 KB).

/** A hirdetés ismétlésének üteme — a háló 30–60 perc alatt felejt (58. mérés). */
export const HIRDETES_KOZ = 20 * 60 * 1000;

/** Egy gyökér-darabba nagyjából ennyi legfelső szintű gondolat essen. */
export const GYOKER_DARAB_CEL = 256;

/**
 * ⭐ A GYÖKÉR-DARAB MÉLYSÉGE a legfelső szintű gondolatok számából: annyi bit, hogy egy darabba ~`GYOKER_DARAB_CEL`
 * jusson. Kis koinoban 0 („az egész gyökér egy darab”), és logaritmikusan nő (a „végtelen”: egy darab mérete nem
 * nő a koinoval — ⭐ D106: a koino saját határáig, `GYOKER_MAX_MELYSEG`-ig; a D106 előtt 16-nál megállt). ⚠️ A kereső
 * ugyanabból az adatból ugyanazt számolja; ha nem talál, a szomszédos mélységet próbálja (a becslés két gépen eltérhet).
 * @param {number} legfelsoDarab
 * @returns {number} 0..`GYOKER_MAX_MELYSEG`
 */
export function gyokerMelysege(legfelsoDarab, cel = GYOKER_DARAB_CEL) {
  return darabMelysege(legfelsoDarab, Number.isFinite(cel) && cel > 0 ? cel : GYOKER_DARAB_CEL);
}

/** Egy gyökér-darab témája (a mélység is benne van — más mélység, más téma; `n`: a témák változata — D124 ⑤). */
export function gyokerDarabTemaja(koino, melyseg, darab, n = 1) {
  return cimjegyzekTema(koino, 'gyoker', melyseg + ':' + darab, n);
}

/**
 * ⭐ A HIRDETENDŐ TÉMÁK: a saját gyökér-darabom (mindig), és a vállalt szeleteim közül legfeljebb
 * `szeletHirdetes` darab (a hívó sorrendjében — elöl a legfontosabb). ⛔ Csak vállalt szelet (a megnézett soha).
 *
 * @param {Object} b
 * @param {string} b.koino
 * @param {string} b.alairo - a tábla-kulcs aláírója (a készülék neve, nem az azonosság — D6)
 * @param {number} b.legfelsoDarab - a legfelső szintű gondolatok száma (a mélységhez)
 * @param {Array<string>} [b.vallaltSzeletek] - a vállalt szeletek, fontossági sorrendben
 * @param {number} [b.szeletHirdetes] - készülékenkénti beállítás (alapból 0)
 * @param {number[]} [b.valtozatok] - ⭐ D124 ⑤: a témák élő változatai, a legújabbtól (`kiirtAlak.js` `eloAlakok('tema')`)
 * @returns {Array<{fajta: string, kulcs: string, tema: Buffer, temak: Buffer[]}>} a `tema` a legújabb változaté, a `temak`
 *   mindegyiké (a hirdető mindegyiken bejelent)
 */
export function hirdetendoTemak({ koino, alairo, legfelsoDarab, vallaltSzeletek = [], szeletHirdetes = 0, melyseg: adott = null,
  valtozatok = [1] }) {
  // ⭐ D95/4: ha a hívó a mélységet a csere becsléséből adja (`gyokerMelysegBecslese`), azt használjuk — egy forrás.
  const melyseg = Number.isInteger(adott) ? adott : gyokerMelysege(legfelsoDarab);
  const [darab] = sajatGyokerDarabjai(alairo, melyseg, 1);
  const ki = [temaValtozatokkal('gyoker', melyseg + ':' + darab, (n) => gyokerDarabTemaja(koino, melyseg, darab, n), valtozatok)];
  const db = Number.isInteger(szeletHirdetes) && szeletHirdetes > 0 ? szeletHirdetes : 0;
  for (const k of vallaltSzeletek.filter((x) => typeof x === 'string' && x !== '').slice(0, db)) {
    ki.push(temaValtozatokkal('szelet', k, (n) => cimjegyzekTema(koino, 'szelet', k, n), valtozatok));
  }
  return ki;
}

/**
 * ⭐ D124 ⑤: egy téma minden élő változatában — `{ fajta, kulcs, tema, temak }` (a `tema` a legújabb, a régi hívóknak és a
 * próbáknak). A `valtozatok` a legújabbtól; üres vagy hibás lista a mai 1-es.
 */
export function temaValtozatokkal(fajta, kulcs, kepzo, valtozatok = [1]) {
  const v = Array.isArray(valtozatok) && valtozatok.length && valtozatok.every((n) => Number.isSafeInteger(n) && n >= 1)
    ? valtozatok : [1];
  const temak = v.map((n) => kepzo(n));
  return { fajta, kulcs, tema: temak[0], temak };
}

// ===================================
// ⭐⭐ D92/1 (b): A KOPOGTATÓ TÉMÁK — a randevú a DHT-n
// ===================================
//
// NAT mögött egy idegen kopogása nem jut át (36/d); ha viszont a tartó TUDJA, hogy valaki kér tőle, a következő
// buliban ő is kopog, és a rés megnyílik (60. mérés: T = 3 tartónál 20% → 76%). A „kérnek tőled” hír a DHT-n jut el:
// a kérő a BEP 5-tel bejelenti a CÍMÉT egy kopogtató témán, a tartó időnként ránéz. Két fajta téma:
//   · a KÉSZÜLÉKÉ — `kopogtato | keszulek:<tábla-aláíró>`: ha a kérő ismeri a tartót (a raj-jegyzékből);
//   · egy HIRDETETT TÉMA PÁRJA — `kopogtato | <fajta>:<kulcs>`: ha csak annyit tud, hogy a gyökér egy darabját (vagy
//     egy szeletet) valaki hirdeti — a DHT puszta címet ad, azonosítót nem. ⭐ Így egy új készülék is elér egy
//     gyökér-darab tartót, anélkül hogy tudná, ki az.
// A tartó a saját készülék-témáján és minden hirdetett témájának párján néz körül (~3 KB témánként, a hirdetés
// ütemében). ⚠️ A cím név nélküli, bizalom nem jár vele (3. szabály); aki ismeri a koinot és a témát, az látja, hány
// cím kopogtat (azt nem, mit kér — D92/1).

/** Egy készülék kopogtató témája (a tábla-aláírójából — a készülék neve, nem az azonosság, D6; `n`: a témák változata). */
export function keszulekKopogtatoTemaja(koino, alairo, n = 1) {
  return cimjegyzekTema(koino, 'kopogtato', 'keszulek:' + alairo, n);
}

/** Egy hirdetett téma párja: ahol a hirdetőit kérni lehet (`fajta` 'gyoker' vagy 'szelet'; `n`: a témák változata). */
export function temaKopogtatoja(koino, fajta, kulcs, n = 1) {
  // ⭐ D107 L4 (④c): a kereső-régió párja is — a felajánló ezen jelentkezik, ha a régió tartóját közvetlenül nem éri el.
  if (fajta !== 'gyoker' && fajta !== 'szelet' && fajta !== 'kereso') throw new Error('ismeretlen hirdetett téma: ' + fajta);
  return cimjegyzekTema(koino, 'kopogtato', fajta + ':' + kulcs, n);
}

/**
 * Amit egy készülék figyel: a saját kopogtató témája és minden hirdetett témájának párja.
 * @param {Object} b
 * @param {string} b.koino
 * @param {string} b.alairo
 * @param {Array<{fajta: string, kulcs: string}>} b.hirdetett - `hirdetendoTemak` eredménye
 * @param {number[]} [b.valtozatok] - ⭐ D124 ⑤: a témák élő változatai, a legújabbtól (mindegyiken néz)
 * @returns {Array<{fajta: string, kulcs: string, tema: Buffer, temak: Buffer[]}>}
 */
export function figyelendoKopogtatok({ koino, alairo, hirdetett = [], valtozatok = [1] }) {
  const ki = [temaValtozatokkal('keszulek', alairo, (n) => keszulekKopogtatoTemaja(koino, alairo, n), valtozatok)];
  for (const t of hirdetett) {
    if (t.fajta === 'gyoker' || t.fajta === 'szelet' || t.fajta === 'kereso') {
      ki.push(temaValtozatokkal(t.fajta, t.kulcs, (n) => temaKopogtatoja(koino, t.fajta, t.kulcs, n), valtozatok));
    }
  }
  return ki;
}

