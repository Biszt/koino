// js/esemeny/esemeny.js

// Felelősség: egy ESEMÉNY létrehozása (aláírással) és ellenőrzése.
//
// A koino adata nem állapot, hanem esemény: „én, ekkor, ezt tettem" — aláírva. Az
// állapot (mely gondolatok léteznek, ki hova rendelt tudatpontot, mi a szavazás állása)
// ebből SZÁMÍTÓDIK (D17), nem a szerver állítja.
//
// EGY ESEMÉNY KÉT RÉSZBŐL ÁLL:
//   1. a GONDOLAT (koino, tipus, szerzo, elozo, sorszam, ido, adat) — ezt írjuk alá,
//   2. a BURKOLAT (azonosito, alairas) — ez a gondolatból SZÁRMAZIK.
// Az azonosító a gondolat lenyomata, tehát nem külön adat, hanem a gondolat neve. Ezért
// nem szerepelhet a lenyomatolt részben (önmagára hivatkozna).
//
// MIT ÍRUNK ALÁ? Az azonosítót — vagyis a gondolat lenyomatát. Így az aláírás
// ellenőrzéséhez elég az azonosító, az azonosító pedig igazolja a teljes gondolatot.
// (Ugyanaz a szerkezet, amit a git használ: a commit neve a gondolata lenyomata, az
// aláírás pedig arra a névre megy.)
//
// Használják: a tár-réteg és minden művelet (gondolat, tudatpont, javaslat, szavazat).

import { szabalyokAlakiHibaja } from './koinoSzabalyok.js';
import { lenyomat, base64UrlBajtok, bajtokBase64Url } from './kanonikusAlak.js';
// ⭐ D81: a lánc-gyökér két összegzés — az alakjukat itt nézzük (a fa egy forrás).
import { osszegzesAlakja } from './osszegzoFa.js';
// ⭐ D119 (①a): a koino programja és a koino-verzió kódja egy darab-hivatkozás (a kód-csomag jegyzéke — `tar/kodCsomag.js`).
import { szovegHivatkozasE } from './szovegDarab.js';
// ⭐⭐ D128: a készülék-tanúsítvány (az azonosság kulcsa írja alá — koinok fölött).
import { tanusitvanyAlakiHibaja, tanusitvanyEllenorzese, kizarasAlakiHibaja } from '../kulcs/keszulek.js';
import { szuletesAlakiHibaja, lancBejegyzesAlakiHibaja, KULCSCSERE_KORLAT, helyreallitasJavaslatAlakiHibaja, HELYREALLITAS_BEJEGYZES }
  from '../kulcs/azonossag.js';
// ⭐⭐ D129: a rendszer-entitások (a kézikönyv) nevei — a kapu az alakjukat nézi; ⭐⭐ D130 (③e): a bejelentés a koinon kulcsához viszi,
// a darabot a nevük azonosítója adja.
import { rendszerNevekAlakiHibaja, esemenyRendszerNevei, rendszerAzonosito } from './rendszerEntitas.js';

const ALGORITMUS = 'Ed25519';

// A gondolat mezői — EZEK és csakis ezek kerülnek a lenyomatba, ebben a sorrendben
// (a sorrend valójában mindegy, mert a kanonikus alak úgyis rendez — de a lista
// rögzítése azért fontos, hogy ne csússzon be véletlenül új mező a lenyomatba).
//
// ===== A BURKOLAT BŐVÜLT (2026-08-31, a Szakasz 3 / 3.1 lépése) =====
//
// Három mező került be, és MINDHÁROM ugyanazt a hiányt pótolja: ha a tárolást
// szeleteljük (entitásonként), a készülék már NEM látja egy szerző teljes láncát — tehát
// amit eddig a lánc végigjárásából tudtunk meg, azt ezentúl AZ ESEMÉNYNEK KELL HOZNIA.
//
//   entitas        — ⭐ A SZELET-KULCS. Melyik entitáshoz tartozik ez az esemény?
//   entitasSorszam — hányadik eseményem EZEN AZ ENTITÁSON (a `sorszam` entitás-szintű párja)
//   latott         — pár IDEGEN esemény azonosítója, amit már ismertem (horgony az időhöz)
//   lancGyoker     — ⭐ a szerző ESEMÉNY ELŐTTI naplójának és kiosztásának gyökere (D78, D81; lásd lentebb)
//
// ⚠️ MIÉRT A BURKOLATBAN, ÉS NEM AZ `adat`-BAN? Mert a tár-illesztőnek szeletelnie kell,
// és ehhez NEM SZABAD értenie a domaint. Ma az entitás típusonként más néven lapul az
// adatban (`adat.entitas`, `adat.erintett`, a szavazatnál pedig csak közvetve, a javaslaton
// keresztül). Egyetlen, típus-független szabály kell helyette:
//
//   ⭐ szelet(e) = e.entitas ?? e.azonosito
//
// A `null` jelentése tehát: „ez az esemény a SAJÁT szeletét nyitja" — így a gondolat-
// létrehozás (ami maga hozza létre az entitást) és a koino-létrehozás is befér a szabályba,
// külön eset nélkül. *(A saját azonosítót nem lehetne a mezőbe írni: önmagára hivatkozna.)*
//
// ⚠️ MIÉRT MOST? Mert a kanonikus alak bővítése KÉSŐBB NEM INGYENES: a régi eseményeket
// nem lehet újra aláírni (az aláírás a régi bájtokra szól), tehát kétféle eseményalak
// maradna örökre — és átállás közben két gép ugyanarra a tudásra MÁS ujjlenyomatot
// számolna, NÉMÁN. A tárban 2026-08-31-én 9 valódi esemény volt.
//
// ⚠️ MINDIG JELEN VANNAK (`null`, illetve `[]`), soha nem hiányoznak. A kanonikus alak a
// hiányzó mezőt kihagyja — ha hol lenne, hol nem, két majdnem-azonos esemény lenyomata
// magyarázhatatlanul eltérne. Ugyanaz a megfontolás, mint az `elozo: null`-nál.
//
// ===== ⏸️ A NEGYEDIK MEZŐ: LEFOGLALT HELY (Csaba döntése, 2026-09-02) =====
//
// A `lancGyoker` a szerző EGÉSZ addigi láncára kötne el egyetlen lenyomattal — nagyjából
// úgy, ahogy az `elozo` az előző eseményre mutat. ⭐ Ettől a kettős lánc bizonyítéka
// TÚLÉLNÉ az összenyomást: aki elágazik, két különböző gyökeret kötelez el magára, és a
// két aláírt állítása mond ellent egymásnak.
//
// ⚠️ DE MOST MÉG NINCS FOGYASZTÓJA. Ehhez az összegző Merkle-fa kell, ami a Szakasz 4
// munkája — és egy mező, aminek nincs fogyasztója, ROSSZ DEFINÍCIÓT kap. A kanonikus
// alakban pedig épp ez a drága hiba.
//
// ⭐ EZÉRT: a mező MOST bekerül, de MINDIG `null`. Amit később nem lehet olcsón megtenni,
// az egy mező HOZZÁADÁSA vagy ELVÉTELE — mert attól kétféle eseményalak lenne, és átállás
// közben két gép ugyanarra a tudásra MÁS ujjlenyomatot számolna, némán. Egy `null`-t
// értelmes értékre cserélni NEM ilyen: az csak egy másik érték, mint bármelyik másikban.
//
// ===== ✅ ÉS MOST MEGKAPTA AZ ÉRTELMÉT (D78, D81 — 2026-09-27) =====
//
// A `lancGyoker` a szerző ESEMÉNY ELŐTTI két gyökerének ÖSSZEGZÉSE: `{ naplo, kiosztas }` —
// a napló-fáé (az 1..sorszam−1 események azonosítói) és a kiosztás-fáé (entitás → pont; a
// gyökér összege a kiosztott összeg). ⭐ Nem a lenyomatuk, hanem maguk (D81: a bizonyíték az
// eseménnyel utazik): így aki az eseményt tartja, a szerző nélkül is ellenőrizni tudja. A
// pont-esemény ezen felül az adatában hozza az entitása régi értékének bizonyítékát.
// A `null` marad a régi (D78 előtti) eseményeké, és azé, akinek a saját lánca nem ép.
// ⭐ És ez pontosan az a csere, amit a 2026-09-02-i döntés olcsónak mondott: egy `null` helyén
// egy érték — a régi események érvényesek maradnak.
//
// ===== ⭐⭐ D128 (2026-11-13): KÉT ÚJ MEZŐ — A KÉSZÜLÉK =====
//
//   keszulek    — a KÉSZÜLÉKKULCS nyilvános része: ez írja alá az eseményt, és a lánc (sorszám, előző,
//                 lánc-gyökér) a készüléké. A `szerzo` marad az AZONOSSÁG (a név nem változik) — a tagság, a
//                 meghívás, a tanúsítás, a szavazat őt nevezi. ⛔ A kettő nem lehet ugyanaz (KU6 (A)).
//   tanusitvany — a készülék-tanúsítvány (`kulcs/keszulek.js`): az azonosság kulcsa aláírja, hogy a készülék az
//                 övé. ⭐ CSAK a lánc ELSŐ eseményén áll (`tanusitvanyKell`), máshol `null` — a kapu onnan ismeri
//                 meg, és a többi eseményt a tárban lévőhöz méri (KU2 (A): a tanúsítvány nem utazik minden eseményben).
//   lanc        — ⭐⭐ D128 (①d, 9.10): CSAK a folytatott láncon — az örökös a kizárt készülék láncát folytatja a vágás után; a
//                 mező a folytatott lánc kulcsa (`lancKulcsa`), az aláírás az örökösé. Máshol nincs (a lenyomat így a régi).
const TARTALOM_MEZOK = [
  'koino', 'tipus', 'szerzo', 'keszulek', 'lanc', 'elozo', 'sorszam', 'ido',
  'entitas', 'entitasSorszam', 'latott', 'lancGyoker', 'tanusitvany',
  'adat'
];

/**
 * ⭐⭐ D128: A LÁNC KULCSA — a készülék kulcsa. Minden, ami LÁNCOT néz (a tár indexe, a sorszám, az előző, az
 * elágazás, az idő-monotonitás, a lánc-gyökér, a D42 állása, az író), ezt kérdezi; ami az AZONOSSÁGOT, az a
 * `szerzo`-t. ⭐ 43 jel, mint minden azonosító — a csere így kimondhatja. Egy készüléket csak egy azonosság
 * tanúsíthat (a kapu a másodikat elutasítja), így egy lánc egy azonosságé.
 * @param {Object} e
 * @returns {string}
 */
export function lancKulcsa(e) {
  // ⭐⭐ D128 (①d, 9.10): a folytatott láncon (az örökös a kizárt készülék láncát viszi tovább) a `lanc` mező.
  return e?.lanc ?? e?.keszulek;
}

/**
 * ⭐⭐ D128 (9.5 — Csaba: „legyen az idő”): KÉSŐBBI-e az `a` állítás, mint a `b` — ugyanannak az azonosságnak két állítása közül (az
 * érték javaslat, az állásfoglalás, a szavazat, a 2. lépcső bemondása: ahol az UTOLSÓ számít). EGY szabály minden helyen:
 *   · egy láncon (egy készüléken) a SORSZÁM dönt — ugyanaz, mint a D128 előtt (egy készüléknél semmi nem változik);
 *   · két készülék között az IDŐ (a sorszámok nem összevethetők), holtversenyben a nagyobb azonosító.
 * ⚠️ Egy rosszul járó óra csak a TE két állításod sorrendjét keverheti meg — másét nem (a kulcs az azonosságé).
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
export function kesobbiAllitas(a, b) {
  if (lancKulcsa(a) === lancKulcsa(b)) return a.sorszam > b.sorszam;
  if (a.ido !== b.ido) return a.ido > b.ido;
  return a.azonosito > b.azonosito;
}

/**
 * ⭐⭐ D128: hozza-e az esemény a készülék tanúsítványát? — a lánc ELSŐ eseménye: az 1. sorszám, a bekapcsolódás
 * (a szülőbeli láncot folytatja a gyermekben) és a gyermek születése (a létrehozó szülőbeli láncát folytatja). EGY
 * szabály az aláírásnak és a kapunak.
 * @param {{sorszam: number, tipus: string, adat?: Object}} e
 * @returns {boolean}
 */
export function tanusitvanyKell(e) {
  return e?.sorszam === 1 || e?.tipus === 'Bekapcsolodas'
    || (e?.tipus === 'KoinoLetrehozas' && e?.adat?.szulo !== undefined);
}

/**
 * ⭐ A SZELET-KULCS — melyik entitáshoz tartozik az esemény.
 *
 * Ez az egyetlen szabály, amit a tár-illesztőnek ismernie kell a szeleteléshez. Domain-
 * tudást nem igényel: vagy meg van mondva, vagy az esemény a saját szeletét nyitja.
 *
 * @param {Object} esemeny
 * @returns {string} az entitás azonosítója
 */
export function szelet(esemeny) {
  return esemeny.entitas ?? esemeny.azonosito;
}

/**
 * ⭐ EGY SZÜLETÉS SZÜLŐJE (a C 7. pontja, a gyerek-bejelentés): a `GondolatLetrehozas` `szulo`-ja,
 * vagy '' (a gyökér), ha legfelső szintű. Minden más eseménynél null — az nem születés.
 *
 * ⭐ A szülő köre ebből tudja meg, hogy új gondolat született: a születés a SZÜLŐ egyeztetett
 * halmazában is benne van (a szöveg nélkül — D72). ⚠️ Csak a születés: az áthelyezés (egyezmény)
 * az új szülőnél még nem hangzik el.
 *
 * Használják: tar/fajlTar.js (a mutató), csere/szeletEgyeztetes.js.
 *
 * @param {Object} e
 * @returns {string|null}
 */
export function szuleteseSzuloje(e) {
  if (e?.tipus !== 'GondolatLetrehozas') return null;
  return typeof e.adat?.szulo === 'string' ? e.adat.szulo : '';
}

/**
 * ⭐⭐ D85/1, D85/3 (Csaba, 2026-10-02): HOVA JELENTJÜK BE AZ ESEMÉNYT — a saját szeletén KÍVÜL.
 *
 * A gyerek-bejelentés (a C 7. pontja) általánosítása. Egy szelet egyeztetett halmazában a saját
 * eseményei mellett ott van minden, ami az ő entitásáról DÖNT vagy róla hír — így a tartói akkor is
 * mindent tudnak, ha a hír egy másik szeletben lakik:
 *
 *   · `GondolatLetrehozas` → a szülőjénél ('' = a gyökér) — „új gyereke született";
 *   · `Javaslat` → MINDEN érintettjénél — a javaslat a saját szeletében él (D85/1), de az érintett
 *     gondolat nem szavazó tartóinak is ki kell tudniuk számolni, megváltozik-e (D17, D85/3);
 *   · `Szavazat` → azokban a szeletekben, amelyekre a jogának bizonyítékát hozza (D85/2, T2: az érintett
 *     gondolat és a rész javaslat-entitása) — vagyis ahol számít. ⚠️ Csak a saját kiosztásában szereplő
 *     kulcs lehet itt (a kapu ellenőrzi), legfeljebb 64.
 *   · ⭐ D93/6 (E6, 2026-10-04): az IDENTITÁS-ÁLLÍTÁS (`Meghivas`, `Felhatalmazas`, `FelhatalmazasVisszavonasa`,
 *     `Tanusitas`, `Bemutatkozas`) — a MÁSIK szeletében él, és a SZERZŐ saját azonosság-szeletébe is bejelentjük
 *     (`adat.sajatBelepes`): így „kiről állított?” (kit tanúsított, kinek mutatkozott be) egyetlen szelet-kérdés, a
 *     szerző láncának átfésülése nélkül — a kontraszt-jelzés bemenete. ⚠️ A horgonyt a szerző mondja; a jelzés csak a
 *     szerző saját állításait számolja (egy idegen horgonyra mutató bejelentés nem hamisít semmit).
 *   · ⭐ D95/1: a `LezarasiOsszegzes` → az érintettjénél (`adat.entitas`).
 *   · ⭐⭐ D130 (③c): a `KoinonOsszegzes` és az `Allasfoglalas` → a KOINON kulcsánál is (`KOINON_KULCS`): a koinon darabjai
 *     innen szűrik a magukét (`szeletEgyeztetes.js`), mint a gyökér-darabok a gyökérhez bejelentett születésekből.
 *
 * ⛔ Csak azonosító alakú kulcs (D77: amit nem lehet a vonalon kimondani, az megakasztaná a cserét), és a
 * saját szelete nem (az úgyis az övé). ⭐ Az eseményből MAGÁBÓL olvasható — a tár mutatója más esemény
 * nélkül számolja ki (mint a szelet-kulcsot).
 *
 * Használják: tar/fajlTar.js (a mutató), csere/szeletEgyeztetes.js.
 *
 * @param {Object} e
 * @returns {Array<string>} tár-kulcsok ('' = a gyökér), ismétlés nélkül, rendezve
 */
/** ⭐ D93/6: az identitás-állítások — a szerző azonosság-szeletébe is bejelentődnek (`bejelentesHelyei`). ⭐⭐ D128 (②e): a
 * helyreállítás jóváhagyása is (a segítő a saját szeletében is látja, kit hagyott jóvá). */
export const AZONOSSAG_ALLITASOK = new Set(['Meghivas', 'Felhatalmazas', 'FelhatalmazasVisszavonasa', 'Tanusitas',
  'Bemutatkozas', 'HelyreallitasJovahagyas']);

/** ⭐⭐ D128 (②e — 17. pont): a helyreállítás jóváhagyásának fázisai (a segítő egyszer cselekszik; a készüléke véglegesít). */
export const HELYREALLITAS_FAZISOK = new Set(['kezdes', 'veglegesites', 'visszavonas']);

/**
 * ⭐⭐ D130 (③c): A KOINON KULCSA — egy virtuális tár-kulcs (mint a gyökéré, a ''), ahová a koinon eseményei (a döntés tömör
 * alakja és az állásfoglalások) bejelentődnek; a darabjai ebből a halmazból szűrik a magukét. Érvényes alakú, 43 jeles
 * szöveg, amit egyetlen esemény azonosítója sem vehet fel (az azonosító lenyomat), és NEM darab-kulcs (a darab-kulcs két
 * nullára végződik — `cimjegyzek.js`). ⛔ Egészében sosem cserélődik (a vonal kizárja), csak a darabjai.
 */
export const KOINON_KULCS = '0'.repeat(42) + 'n';
/** ⭐ D130 (③c): a koinon eseménytípusai — a koinon kulcsához bejelentődnek. */
export const KOINON_TIPUSOK = new Set(['KoinonOsszegzes', 'Allasfoglalas']);

/**
 * ⭐⭐ D130 (③c, ③e): MELYIK KOINON-DARABBA esik egy esemény — EGY helyen (a darab halmaza, a tartás, a tömörítés és a csak küldő út
 * is ezt kérdezi). A koinon eseményénél az általános egyezménye (a szelete); a kézikönyv-eseménynél (KO5 (B)) a bejegyzés NEVE — az
 * azonosítója —, több névnél (az áthelyezés: a bejegyzés és a cél) mindegyiké: az esemény mindegyik darabba tartozik.
 * @param {Object} e
 * @returns {Array<string>} az azonosítók, amelyeknek a koinon-lenyomata a darabot adja (üres: nem koinon-esemény)
 */
export function koinonHelyei(e) {
  const helyek = [];
  if (KOINON_TIPUSOK.has(e?.tipus)) helyek.push(szelet(e));
  for (const nev of esemenyRendszerNevei(e)) {
    const az = rendszerAzonosito(nev);
    if (!helyek.includes(az)) helyek.push(az);
  }
  return helyek;
}

export function bejelentesHelyei(e) {
  const helyek = new Set();
  const sajat = szelet(e);
  const hozza = (k) => {
    if (k === '' || (typeof k === 'string' && AZONOSITO_MINTA.test(k) && k !== sajat)) helyek.add(k);
  };
  if (e?.tipus === 'GondolatLetrehozas') {
    hozza(szuleteseSzuloje(e));
  } else if (e?.tipus === 'Javaslat') {
    const lista = Array.isArray(e.adat?.erintettek) ? e.adat.erintettek.map((r) => r?.entitas)
      : [e.adat?.erintett];
    for (const k of lista) if (typeof k === 'string' && k !== '') hozza(k);
  } else if (e?.tipus === 'Szavazat') {
    // ⛔ CSAK lánc-gyökeres szavazatnál: a kapu csak akkor ellenőrzi a bizonyítékot (legfeljebb 64
    // azonosító, mind a saját kiosztásából — `hozottBizonyitekokOnbizonyitasa`). Gyökér nélkül a bizonyíték nem
    // számít (`szavazatSajatPontjai`), és bejelentést sem adhat — különben bármennyi, bármilyen szeletbe
    // be lehetne jelenteni egy szavazatot.
    const b = e.adat?.bizonyitek;
    if (e.lancGyoker && typeof e.lancGyoker === 'object' && b && typeof b === 'object' && !Array.isArray(b)) {
      for (const k of Object.keys(b)) if (k !== '') hozza(k);
    }
  } else if (AZONOSSAG_ALLITASOK.has(e?.tipus)) {
    hozza(e.adat?.sajatBelepes);
  } else if (e?.tipus === 'LezarasiOsszegzes') {
    // ⭐ D95/1: a lezárási összegzés a javaslat szeletében él, és az érintettjénél is hír (annak tartói ebből tudják meg
    // a nagy szeletű rész döntését).
    hozza(e.adat?.entitas);
  } else if (e?.tipus === 'KoinonOsszegzes') {
    // ⭐⭐ D130 (③a): a döntés tömör alakja (a lezárási összegzések) a javaslat szeletében él, és minden érintettjénél hír —
    // ugyanaz, mint a `LezarasiOsszegzes`-é, részenként (legfeljebb 64 — a javaslat érintettjeinek korlátja).
    const reszek = Array.isArray(e.adat?.reszek) ? e.adat.reszek.slice(0, 64) : [];
    for (const r of reszek) hozza(r?.osszegzes?.entitas);
  }
  // ⭐⭐ D130 (③c): a koinon eseményei a koinon kulcsánál is (a darabjaik ebből szűrnek — `koinonHelyei`). ⭐⭐ D130 (③e, KO5 (B)):
  // a kézikönyv-esemény is (ami egy bejegyzés nevét hozza) — eddig a kézikönyv GYÖKERÉNEK szeletébe ment, és azt mindenki tartotta
  // (MA4 (B)); most a bejegyzés koinon-darabjába, és azt a darab tartói őrzik (a koinon pontja a bejegyzést pont nélkül is megtartja).
  if (koinonHelyei(e).length) hozza(KOINON_KULCS);
  return [...helyek].sort();
}

// ===================================
// SEGÉD: A LENYOMATOLANDÓ RÉSZ KIEMELÉSE
// ===================================

/**
 * Kiveszi az eseményből azt a részt, amit a lenyomat fed.
 * @param {Object} esemeny
 * @returns {Object}
 */
function tartalomResz(esemeny) {
  const resz = {};
  for (const mezo of TARTALOM_MEZOK) {
    if (esemeny[mezo] !== undefined) resz[mezo] = esemeny[mezo];
  }
  return resz;
}

// ===================================
// ESEMÉNY LÉTREHOZÁSA
// ===================================

/**
 * Létrehoz egy aláírt eseményt.
 *
 * @param {Object} leiras
 * @param {string} leiras.koino - melyik koinohoz tartozik (D25: több koino egy készüléken)
 * @param {string} leiras.tipus - pl. 'GondolatLetrehozas'
 * @param {Object} leiras.adat - a művelet gondolata (típusfüggő)
 * @param {string|null} leiras.elozo - az előző SAJÁT eseményem azonosítója (az első: null)
 * @param {number} leiras.sorszam - hányadik a saját láncomban (az első: 1)
 * @param {number} [leiras.ido] - a szerző órája szerint (alapból: most)
 * @param {string|null} [leiras.entitas] - a SZELET-KULCS; null = az esemény a saját szeletét nyitja
 * @param {number} [leiras.entitasSorszam] - hányadik eseményem ezen az entitáson (alap: 1)
 * @param {Array<string>} [leiras.latott] - idegen események, amiket már ismertem (horgony)
 * @param {Object} kulcspar - ⭐⭐ D128: a KÉSZÜLÉK (`kulcs/keszulek.js` `eszkoz`): kulcspár + `azonossag` + `tanusitvany`
 * @returns {Promise<Object>} az aláírt esemény
 */
export async function esemenyLetrehozasa(leiras, kulcspar) {
  console.log('esemenyLetrehozasa - KEZDÉS', { tipus: leiras.tipus, sorszam: leiras.sorszam });

  // ----- ⭐⭐ D128: A SZERZŐ AZ AZONOSSÁG, AZ ALÁÍRÓ A KÉSZÜLÉK -----
  // Nem név, nem fiók: a személyazonosság maga a kulcs (D15) — az azonosság kulcsa; a mindennapi aláírás a
  // készüléké, a tanúsítvánnyal.
  const nyersKulcs = await crypto.subtle.exportKey('raw', kulcspar.publicKey);
  const keszulek = bajtokBase64Url(new Uint8Array(nyersKulcs));
  const szerzo = kulcspar.azonossag;
  if (typeof szerzo !== 'string' || kulcspar.tanusitvany?.keszulek !== keszulek
      || kulcspar.tanusitvany?.azonossag !== szerzo) {
    throw new Error('esemenyLetrehozasa: a kulcspár nem tanúsított készülék (D128 — kulcs/keszulek.js eszkoz)');
  }

  const gondolat = {
    koino: leiras.koino,
    tipus: leiras.tipus,
    szerzo,
    keszulek,
    // ⭐⭐ D128 (①d, 9.10): a folytatott lánc (csak ha az örökös a kizárt készülék láncát viszi tovább — és ha más, mint az enyém).
    ...(typeof leiras.lanc === 'string' && leiras.lanc !== keszulek ? { lanc: leiras.lanc } : {}),
    elozo: leiras.elozo ?? null,
    sorszam: leiras.sorszam,
    // Az idő a SZERZŐ órája — tájékoztató adat, soha nem bizonyíték. A sorrendet a
    // saját láncban a `sorszam` adja, nem ez.
    ido: leiras.ido ?? Date.now(),

    // ----- A HÁROM ÚJ MEZŐ (lásd a TARTALOM_MEZOK melletti magyarázatot) -----
    // Mindhárom MINDIG jelen van, hogy a lenyomat kiszámítható maradjon.
    entitas: leiras.entitas ?? null,
    entitasSorszam: leiras.entitasSorszam ?? 1,
    // A horgony: idegen események, amiket a szerző a sajátja előtt már ismert. Üres tömb
    // is érvényes — akkor egyszerűen nincs mihez kötni az eseményt (D19: ez jelzés, nem vád).
    latott: Array.isArray(leiras.latott) ? [...leiras.latott] : [],
    // ⏸️ LEFOGLALT HELY — a jelentése a Szakasz 4-ben dől el (lásd fent). Addig `null`.
    lancGyoker: leiras.lancGyoker ?? null,
    // ⭐⭐ D128: a lánc első eseménye hozza a készülék tanúsítványát (`tanusitvanyKell`).
    tanusitvany: tanusitvanyKell(leiras) ? kulcspar.tanusitvany : null,

    adat: leiras.adat
  };

  // ----- AZ AZONOSÍTÓ: a gondolat lenyomata -----
  // Ha a gondolatban tört szám vagy más tiltott érték van, ez itt HIBÁT DOB — jobb
  // most kiderülnie, mint akkor, amikor két gép már nem ért egyet.
  const azonosito = await lenyomat(gondolat);

  // ----- AZ ALÁÍRÁS: az azonosítóra -----
  const alairasBajtok = await crypto.subtle.sign(
    { name: ALGORITMUS },
    kulcspar.privateKey,
    new TextEncoder().encode(azonosito)
  );

  const esemeny = {
    ...gondolat,
    azonosito,
    alairas: bajtokBase64Url(new Uint8Array(alairasBajtok))
  };

  console.log('esemenyLetrehozasa - VÉGE', { azonosito });
  return esemeny;
}

// ===================================
// ESEMÉNY ELLENŐRZÉSE
// ===================================

/**
 * Ellenőriz egy eseményt: valóban az állítólagos szerzőtől való-e, és változatlan-e.
 *
 * KÉT DOLGOT NÉZ MEG:
 *   1. az azonosító tényleg a gondolat lenyomata-e (nem babráltak a gondolatba),
 *   2. az aláírás a szerző kulcsával készült-e (tényleg ő írta alá).
 * A kettő együtt: a gondolat egyetlen bájtja sem változhatott a szerző óta.
 *
 * FONTOS, MIT NEM NÉZ: hogy a szerző jogosult-e a műveletre, hogy a lánc folytonos-e,
 * és hogy az idő igaz-e. Azok külön kérdések (tár-réteg, állapot-réteg).
 *
 * ⭐⭐ D128: AZ ALÁÍRÓ A KÉSZÜLÉK, ÉS A KÉSZÜLÉK AZ AZONOSSÁGÉ. Az aláírás a `keszulek` kulcsával készül; hogy a
 * készülék a `szerzo`-é, azt a tanúsítvány mondja meg — vagy maga az esemény hozza (a lánc első eseménye), vagy
 * a hívó adja (`beallitas.tanusitvany`: a készülék kulcsa → a már ELLENŐRZÖTT tanúsítvány vagy null — a kapu a
 * tárból, egy csomag ellenőrzője a csomagból és a tárból). ⛔ Ha egyik sincs, az esemény NEM rendben
 * (`hianyzik: true` — a csere elkérheti): egy hamis szerzőjű esemény így semmilyen úton nem megy át. Aki csak az
 * aláírást kérdezi (és az esemény útja úgyis a kapun megy), az kimondja: `csakAlairas: true`.
 *
 * @param {Object} esemeny
 * @param {{tanusitvany?: Function, csakAlairas?: boolean}} [beallitas]
 * @returns {Promise<{rendben: boolean, ok?: string, hianyzik?: boolean}>}
 */
export async function esemenyEllenorzese(esemeny, beallitas = {}) {
  // ----- ALAKI ELLENŐRZÉS -----
  const alaki = alakiHiba(esemeny);
  if (alaki) return { rendben: false, ok: alaki };

  // ----- 1. AZ AZONOSÍTÓ A GONDOLAT LENYOMATA-E? -----
  let ujraszamolt;
  try {
    ujraszamolt = await lenyomat(tartalomResz(esemeny));
  } catch (hiba) {
    return { rendben: false, ok: 'a gondolat nem hozható kanonikus alakra: ' + hiba.message };
  }
  if (ujraszamolt !== esemeny.azonosito) {
    return { rendben: false, ok: 'az azonosító nem a gondolat lenyomata (a gondolat megváltozott)' };
  }

  // ----- 2. AZ ALÁÍRÁS A KÉSZÜLÉK KULCSÁVAL KÉSZÜLT-E? (D128) -----
  try {
    const nyilvanosKulcs = await crypto.subtle.importKey(
      'raw', base64UrlBajtok(esemeny.keszulek), { name: ALGORITMUS }, false, ['verify']
    );
    const rendben = await crypto.subtle.verify(
      { name: ALGORITMUS },
      nyilvanosKulcs,
      base64UrlBajtok(esemeny.alairas),
      new TextEncoder().encode(esemeny.azonosito)
    );
    if (!rendben) return { rendben: false, ok: 'az aláírás nem a készüléké' };
  } catch (hiba) {
    return { rendben: false, ok: 'az aláírás nem ellenőrizhető: ' + hiba.message };
  }

  // ----- 3. ⭐⭐ D128: A KÉSZÜLÉK AZ AZONOSSÁGÉ-E? -----
  if (esemeny.tanusitvany !== null) {
    // A lánc első eseménye hozza — az alakja (és hogy a szerzőt és a készüléket nevezi) az `alakiHiba`-ban már megvolt.
    const t = await tanusitvanyEllenorzese(esemeny.tanusitvany);
    if (!t.rendben) return { rendben: false, ok: 'a készülék tanúsítványa: ' + t.ok };
    return { rendben: true };
  }
  if (beallitas.csakAlairas === true) return { rendben: true };
  let t = typeof beallitas.tanusitvany === 'function' ? await beallitas.tanusitvany(esemeny.keszulek) : null;
  // ⭐ A KÍSÉRŐ TANÚSÍTVÁNY (az utazó esemény aláíratlan burka — `KISERO_MEZO`): ha a hívó nem tud tanúsítványt, a küldő
  // mellékelhette. ⛔ A hívó tudása elsőbb (egy ismert készüléket a kísérő nem köthet máshoz) — ezért csak ha az nem tud.
  if (!t && esemeny[KISERO_MEZO] && typeof esemeny[KISERO_MEZO] === 'object'
      && (await tanusitvanyEllenorzese(esemeny[KISERO_MEZO])).rendben) {
    t = esemeny[KISERO_MEZO];
  }
  if (!t) return { rendben: false, ok: 'a készülék tanúsítványa nem ismert (a lánc első eseménye hozza)', hianyzik: true };
  if (t.azonossag !== esemeny.szerzo || t.keszulek !== esemeny.keszulek) {
    return { rendben: false, ok: 'a készülék egy másik azonosság tanúsítványát viseli' };
  }
  return { rendben: true };
}

// ===================================
// ⭐⭐ D128: A KÍSÉRŐ TANÚSÍTVÁNY — az utazó esemény burka
// ===================================
//
// Egy esemény a láncán KÍVÜL is utazik (egy szelet a cserében, egy kísérő, egy kérelem válasza, egy minta, egy
// kereső-bejegyzés) — a fogadónál a lánca első eseménye (a tanúsítvány) gyakran nincs meg. ⭐ A küldő ilyenkor az esemény mellé
// teszi a készülék tanúsítványát: egy ALÁÍRATLAN burok-mezőben (nincs a lenyomatban — az esemény neve és aláírása változatlan).
// A kapu ellenőrzi (önmagát igazolja — az azonosság kulcsa írta alá), feljegyzi a jegyzékbe, és az eseményt NÉLKÜLE menti.

/** A kísérő tanúsítvány mezője (a burokban — nem a lenyomatolt rész). */
export const KISERO_MEZO = 'kiseroTanusitvany';

/** Az esemény a kísérő tanúsítvány nélkül (a tárolt alak). */
export function kiseroNelkul(e) {
  if (!e || typeof e !== 'object' || !(KISERO_MEZO in e)) return e;
  const { [KISERO_MEZO]: _, ...tiszta } = e;
  return tiszta;
}

/**
 * Az esemény a kísérő tanúsítvánnyal (ha nem a lánc első eseménye — az úgyis hozza).
 * @param {Object} e
 * @param {Object|null} t - a készülék tanúsítványa
 */
export function kiseroval(e, t) {
  if (!e || typeof e !== 'object' || e.tanusitvany || !t || t.keszulek !== e.keszulek) return e;
  return { ...e, [KISERO_MEZO]: t };
}

/**
 * ⭐⭐ D128: EGY TANÚSÍTVÁNY-KERESŐ az `esemenyEllenorzese`-nek — egy CSOMAG (beágyazott események: a tagsági lánc, a vád
 * bizonyítéka, a döntési csomag…) láncainak első eseményei hozzák a tanúsítványt (itt ellenőrizve), a többit az `alap` adja
 * (egy tár — a kapué —, vagy egy másik kereső). ⛔ Ami egyikben sincs, annak az eseménye nem megy át: egy csomagba ágyazott
 * hamis szerzőjű esemény így sem hamisíthat tagságot.
 * @param {Array<Object>} esemenyek - a csomag eseményei
 * @param {Object|Function|null} [alap] - egy tár (`tanusitvany(keszulek)`) vagy egy kereső függvény
 * @param {Array<Object>} [nyersek] - a csomag által KÜLÖN hozott tanúsítványok (pl. a döntési csomagé — a belső események láncának
 *   közepéről valók, a láncuk első eseménye nincs a csomagban); itt ellenőrizve
 * @returns {Promise<Function>} keszulek → tanúsítvány | null
 */
export async function tanusitvanyKereso(esemenyek, alap = null, nyersek = []) {
  const sajat = new Map();
  for (const e of esemenyek ?? []) {
    const k = e?.[KISERO_MEZO];
    if (k && typeof k === 'object' && !sajat.has(k.keszulek) && k.keszulek === e.keszulek && k.azonossag === e.szerzo
        && (await tanusitvanyEllenorzese(k)).rendben) sajat.set(k.keszulek, k);
    const t = e?.tanusitvany;
    if (!t || typeof t !== 'object' || sajat.has(e.keszulek) || t.keszulek !== e.keszulek || t.azonossag !== e.szerzo) continue;
    if ((await tanusitvanyEllenorzese(t)).rendben) sajat.set(e.keszulek, t);
  }
  for (const t of Array.isArray(nyersek) ? nyersek : []) {
    if (!t || typeof t !== 'object' || sajat.has(t.keszulek)) continue;
    if ((await tanusitvanyEllenorzese(t)).rendben) sajat.set(t.keszulek, t);
  }
  const tovabb = typeof alap === 'function' ? alap
    : typeof alap?.tanusitvany === 'function' ? (k) => alap.tanusitvany(k) : null;
  return async (k) => sajat.get(k) ?? (tovabb ? ((await tovabb(k)) ?? null) : null);
}

/**
 * ⭐ AZ AZONOSÍTÓ ALAKJA (D77, 2026-09-27): egy lenyomat — 43 base64url jel. EGY helyen, mert a
 * kapu (`alakiHiba`) és a csere vonala (`csere/szeletEgyeztetes.js`, a szelet-kulcs) ugyanezt
 * kérdezi: ha a kettő eltérne, egy kapun átjutott esemény megint kimondhatatlan kulcsot adna.
 */
export const AZONOSITO_MINTA = /^[A-Za-z0-9_-]{43}$/;

/** Azonosító alakú-e (szöveg, 43 base64url jel)? */
export const azonositoAlaku = (x) => typeof x === 'string' && AZONOSITO_MINTA.test(x);

// ===================================
// ⭐⭐ D118/2: MELYIK KOINOÉ EGY ESEMÉNY — A KOINO NEVE A SZÜLETÉSE LENYOMATA
// ===================================
//
// ⛔ A LELET (2026-10-24, mérve — `docs/koltozes_atvizsgalas.md` 3.): a koino neve szabad szöveg volt, és a születését
// három hely háromféleképp választotta (az állapot az utolsót, a tagság az elsőt, a kapu a saját láncból) — egy kívülálló
// egyetlen, azonos nevű `KoinoLetrehozas`-szal az alapító (és így minden tag) döntéseit „nem ellenőrizhetővé” tette.
//
// ⭐ Az új alak: a születés koino-mezője ÜRES (önmagát nem nevezheti meg — a lenyomata a tartalmából jön), és a koino
// neve a születés AZONOSÍTÓJA; minden más esemény ezt a nevet viszi. Egy második születés így MÁSIK koino — nincs mit
// választani. ⚠️ A régi alak (szabad név, a születés koino-mezője maga a név) csak a próbák kedvéért él: lenyomat-alakú
// névre soha nem vonatkozik, és a program új koinot csak az új alakban hoz létre.

/** Melyik koinoé az esemény? Az új alakú születésé a saját azonosítója, mindenki másé a koino-mezője. */
export function esemenyKoinoja(e) {
  if (!e || typeof e !== 'object') return undefined;
  if (e.koino === '' && e.tipus === 'KoinoLetrehozas') return e.azonosito;
  return e.koino;
}

/** A koino születése-e ez az esemény? Lenyomat-nevű koinonál CSAK az, amelyiknek az azonosítója maga a név. */
export function koinoSzuleteseE(e, koino) {
  if (!e || typeof e !== 'object' || e.tipus !== 'KoinoLetrehozas') return false;
  if (azonositoAlaku(koino)) return e.koino === '' && e.azonosito === koino;
  return e.koino === koino && !azonositoAlaku(e.koino);   // a régi alak (szabad név) — csak a próbákban
}

// ===================================
// ⭐⭐ D119 (①a): A KOINO-VERZIÓ — A GYERMEK SZÜLETÉSE A SZÜLŐBEN, A KÓDDAL
// ===================================
//
// Csaba ötlete (CS3, 2026-10-25): minden gyermek a szülőben egy KOINO-VERZIÓ entitással születik — a `kormanyzas.md` 2.
// szintje (a koino-verzió entitása). Egy legfelső szintű entitás (`GondolatLetrehozas`, `tipus: 'KoinoVerzio'` — a
// kategória és a gondolattípus mintájára: új esemény-fajta nélkül), a címe a gyermek neve, a gyermek ALÁÍRT születését
// magába ágyazza, és a kódot (a kód-csomag jegyzékét) is megnevezi. Ettől a szülő rendes cseréje (a gyökér darabjai) és a
// kézi út a gyermek HÍRÉT is viszi, és a „Kód” fülön a teljes program ellenőrizhető. A feltöltő a gyermek létrehozója; a
// pontot ugyanúgy rendeli hozzá, mint bármihez (D14 — pont nélkül nincs).

/** A koino-verzió entitás típusa. */
export const KOINO_VERZIO = 'KoinoVerzio';

/** Koino-verzió létrehozó eseménye-e? */
export function koinoVerzioE(e) {
  return !!e && typeof e === 'object' && e.tipus === 'GondolatLetrehozas' && e.adat?.tipus === KOINO_VERZIO;
}

/**
 * A koino születése egy eseménylistából — EGY szabály minden helyen (az állapot, a tagság, a kapu, a belépő tér).
 * Koino nélkül: az első új alakú születésé, ha van ilyen, különben a régi alaké. ⚠️ A régi alaknál több is lehet
 * (ezért volt a lelet): ott a legkisebb azonosító — determinisztikus, de hamisítható; az új alaknál egy lehet.
 * @param {Array<Object>} esemenyek
 * @param {string|null} [koino]
 * @returns {Object|null}
 */
export function koinoSzuleteseListabol(esemenyek, koino = null) {
  let legjobb = null;
  let ujAlaku = false;
  for (const e of esemenyek ?? []) {
    if (!e || e.tipus !== 'KoinoLetrehozas') continue;
    if (koino !== null ? !koinoSzuleteseE(e, koino) : azonositoAlaku(e.koino)) continue;
    const uj = e.koino === '';
    if (koino === null && ujAlaku && !uj) continue;
    if (!legjobb || (uj && !ujAlaku) || e.azonosito < legjobb.azonosito) legjobb = e;
    ujAlaku = ujAlaku || uj;
  }
  return legjobb;
}

/**
 * A lánc-gyökér alakja (D81): `{ naplo, kiosztas }` — két összegzés (`{ l, d, o }`), semmi más; a
 * napló összeg nélküli, a kiosztás egy összeget (a pontot) visz, és a napló darabja a sorszám − 1.
 * ⚠️ Csak az ALAK: hogy a gyökerek a szerző láncához illenek-e, azt a bizonyítékok döntik el.
 */
export function lancElokepAlakja(x, sorszam) {
  const osszegzes = (y, hossz) => !!y && typeof y === 'object' && Object.keys(y).length === 3
    && osszegzesAlakja(y, hossz);
  // ⭐⭐ D128 (9.9): a HARMADIK gyökér a kapott (a többi készülékemtől átvett keret — adónként a halmozott összeg).
  return !!x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length === 3
    && osszegzes(x.naplo, 0) && osszegzes(x.kiosztas, 1) && osszegzes(x.kapott, 1) && x.naplo.d === sorszam - 1;
}

/**
 * ⭐⭐ D128 (9.9): a PONT-ESEMÉNYEK — amik a kiosztás-fában egy levelet állítanak (a bemondott összeggel, D42; a saját
 * bizonyítékukkal, D81): a gondolatra tett pont és a keret ÁTADÁSA egy másik készülékemnek (a levél kulcsa a fogadó készülék
 * kulcsa). ⚠️ Az átadás nem gondolat-pont: az állapot a gondolatok pontjai közé nem számolja (csak a `TudatpontRendezes`-t).
 */
export const PONT_TIPUSOK = new Set(['TudatpontRendezes', 'KeretAtadas']);

/**
 * ⭐ AZ ALAKI ELLENŐRZÉS ÖNMAGÁBAN — szinkron és olcsó (2026-09-24, 40. mérés).
 *
 * ⛔ MIÉRT VÁLT KÜLÖN: a kapu (`esemenyEllenorzese`) ezt is, a drága részt is (lenyomat +
 * aláírás) elvégzi. ⭐ A CSERE viszont a SAJÁT tárát nézi, amit egyszer már egy kapu
 * beengedett — ott az aláírás nem változhatott, csak a SZABÁLY: egy régebbi programmal
 * tárolt esemény ma alakilag érvénytelen lehet (a 2026-08-31-i három új mező előtti alak, vagy
 * a D77 előtti, nem azonosító alakú `entitas` / `szulo`). Az ilyet a csere ne hirdesse és ne
 * küldje: *amit egyetlen mai kapu sem enged be, az a mai protokoll számára nem létezik.* Egy
 * szabály, két hívó — különben elcsúszhatnának.
 *
 * @param {Object} esemeny
 * @returns {string|null} a hiba oka, vagy `null`, ha alakilag rendben van
 */
export function alakiHiba(esemeny) {
  if (!esemeny || typeof esemeny !== 'object') return 'nem objektum';
  // ⚠️ A HÁROM ÚJ MEZŐ IS KÖTELEZŐ (2026-08-31). Ez szándékos szigor: a kanonikus alak a
  // hiányzó mezőt kihagyja, tehát egy régi alakú esemény ÖNMAGÁBAN érvényesnek látszana —
  // és akkor KÉTFÉLE eseményalak élne egymás mellett. Ki lehetne hagyni a mezőket, hogy a
  // szabály-réteg ne tudjon rájuk támaszkodni. Egy alak van, nem kettő.
  // (A `null` érvényes érték: az `entitas: null` azt jelenti, „a saját szeletét nyitja".)
  for (const mezo of [
    'koino', 'tipus', 'szerzo', 'keszulek', 'sorszam', 'ido',
    'entitas', 'entitasSorszam', 'latott', 'lancGyoker', 'tanusitvany',
    'azonosito', 'alairas'
  ]) {
    if (esemeny[mezo] === undefined) return 'hiányzó mező: ' + mezo;
  }

  // ----- ⭐⭐ D128: AZ AZONOSSÁG ÉS A KÉSZÜLÉK -----
  // Két nyilvános kulcs, és nem ugyanaz (KU6 (A): az azonosság csak kezel). A tanúsítvány a lánc első eseményén áll
  // (`tanusitvanyKell`), ott a szerzőt és a készüléket nevezi — máshol null (egy alak van, nem kettő).
  if (!azonositoAlaku(esemeny.szerzo) || !azonositoAlaku(esemeny.keszulek)) return 'a szerző és a készülék egy-egy nyilvános kulcs';
  if (esemeny.keszulek === esemeny.szerzo) return 'a készülék kulcsa nem lehet az azonosság kulcsa (D128)';
  // ⭐⭐ D128 (①d, 9.10): a folytatott lánc egy MÁSIK készülék kulcsa (a kizárté) — hogy a kizárás valóban ide engedi-e (az
  // örökös, a vágás után), azt a kapu nézi a koino kizárásával.
  if (esemeny.lanc !== undefined && (!azonositoAlaku(esemeny.lanc) || esemeny.lanc === esemeny.keszulek
      || esemeny.lanc === esemeny.szerzo)) {
    return 'a folytatott lánc egy MÁSIK készülék kulcsa';
  }
  if (!Number.isSafeInteger(esemeny.sorszam) || esemeny.sorszam < 1) return 'a sorszam csak 1-nél nem kisebb egész lehet';
  if (tanusitvanyKell(esemeny)) {
    const t = esemeny.tanusitvany;
    const h = tanusitvanyAlakiHibaja(t);
    if (h) return 'a lánc első eseménye a készülék tanúsítványát hozza: ' + h;
    if (t.azonossag !== esemeny.szerzo || t.keszulek !== esemeny.keszulek) {
      return 'a tanúsítvány a szerzőt és a készüléket nevezi';
    }
  } else if (esemeny.tanusitvany !== null) {
    return 'tanúsítványt csak a lánc első eseménye hoz';
  }

  // ----- ⭐⭐ D118/2: A KOINO NEVE -----
  // Az üres koino-név csak az új alakú születésé (annak a neve a saját lenyomata); és születés nem nevezhet meg
  // lenyomat-alakú koinot — az egy létező koino második, hamis születése lenne (a lelet).
  if (typeof esemeny.koino !== 'string') return 'a koino csak szöveg lehet';
  if (esemeny.koino === '' && esemeny.tipus !== 'KoinoLetrehozas') return 'üres koino-név csak a koino születésén állhat';
  if (esemeny.tipus === 'KoinoLetrehozas' && azonositoAlaku(esemeny.koino)) {
    return 'a koino születése nem nevezhet meg koinot: a koino neve a születés saját lenyomata';
  }
  // ⭐⭐ D118/2 (①b): a koino SZABÁLYAI a születésben — csak ismert kulcsok, a határokon belül (`koinoSzabalyok.js`).
  if (esemeny.tipus === 'KoinoLetrehozas') {
    const hiba = szabalyokAlakiHibaja(esemeny.adat?.szabalyok);
    if (hiba) return hiba;
    // ⭐⭐ D118 (②a): a GYERMEK születése a szülő nevét (a születése lenyomatát) és a létrehozó tagsági bizonyítékát hozza
    // — csak új alakban. Itt az alak; a bizonyítékot a kapu a szülő születésével együtt ellenőrzi (`koinoLanc.js`).
    const sz = esemeny.adat?.szulo;
    const t = esemeny.adat?.szuloTagsag;
    if (sz !== undefined) {
      if (esemeny.koino !== '' || !azonositoAlaku(sz)) return 'a szülő csak egy új alakú születés neve lehet (a lenyomata)';
      if (!t || typeof t !== 'object' || Array.isArray(t) || !azonositoAlaku(t.horgony) || !Array.isArray(t.lanc)
          || t.lanc.length > 1024) {
        return 'a gyermek születése a létrehozó tagsági bizonyítékát hozza ({ horgony, lanc })';
      }
      // ⭐⭐ D119 (Csaba: „(A) Nem költözik”): a létrehozó a születésével bekapcsolódik, és a bekapcsolódáshoz hasonlóan elhagyhat
      // (KZ3 (A)) — a program a koino-verzió kártyáira tett pontjait magától elhagyja (a kártya a szülő ügye).
      const el = esemeny.adat?.elhagy;
      if (el !== undefined && (!Array.isArray(el) || el.length > 1024 || !el.every(azonositoAlaku))) {
        return 'az elhagyott pontok listája entitás-azonosítók listája';
      }
    } else if (t !== undefined) {
      return 'tagsági bizonyíték csak a szülőt megnevező születésen állhat';
    } else if (esemeny.adat?.elhagy !== undefined) {
      return 'elhagyott pont csak a gyermek születésén állhat (a létrehozó a születésével bekapcsolódik)';
    }
    // ⭐⭐ D119 (①a): a koino PROGRAMJA — a kód-csomag jegyzékének hivatkozása (a kód neve); csak új alakban.
    const pr = esemeny.adat?.program;
    if (pr !== undefined && (esemeny.koino !== '' || !szovegHivatkozasE(pr))) {
      return 'a koino programja a kód-csomag hivatkozása ({ lenyomat, bajt }) — csak új alakú születésen';
    }
    // ⭐⭐ D123 (PR1): a koino MAGJA — a számítás magjának (a kép és a kapu import-zárványa, `tar/kodCsomag.js` `magJegyzeke`)
    // hivatkozása: ennek kell egy koino-n belül mindenkinél azonosnak lennie; a többi réteg szabadon változhat.
    const mg = esemeny.adat?.mag;
    if (mg !== undefined && (esemeny.koino !== '' || !szovegHivatkozasE(mg) || mg.torzs !== undefined)) {
      return 'a koino magja a mag-jegyzék hivatkozása ({ lenyomat, bajt }) — csak új alakú születésen';
    }
  }
  // ⭐⭐ D118 (a költözés alakja) → ⭐⭐ D127 (a bekapcsolódás: a szülőben megmaradsz): EGY esemény, a gyermekben — az alakja (a
  // bizonyítékot a kapu nézi, a koino és a szülő születésével). A szülőben nem írunk semmit (D127/KÖ4 (A)): a bekapcsolódó ott marad
  // a teljes súlyával, és tovább dolgozhat — a két koino párhuzamos.
  if (esemeny.tipus === 'Bekapcsolodas') {
    const a = esemeny.adat ?? {};
    if (esemeny.entitas !== null) return 'a bekapcsolódás a saját szeletét nyitja (ez a horgonyom a gyermekben)';
    if (!azonositoAlaku(a.szulo)) return 'a bekapcsolódás a szülőt nevezi meg';
    if (!a.lanc || typeof a.lanc !== 'object' || !Number.isSafeInteger(a.lanc.sorszam) || a.lanc.sorszam < 1
        || !azonositoAlaku(a.lanc.azonosito)) {
      return 'a bekapcsolódás a szülőbeli láncom vágás előtti utolsó eseményét nevezi meg ({ sorszam, azonosito })';
    }
    const t = a.szuloTagsag;
    if (!t || typeof t !== 'object' || Array.isArray(t) || !azonositoAlaku(t.horgony) || !Array.isArray(t.lanc)
        || t.lanc.length > 1024) {
      return 'a bekapcsolódás a tagsági bizonyítékomat hozza a szülőből ({ horgony, lanc })';
    }
    if (a.elhagy !== undefined && (!Array.isArray(a.elhagy) || a.elhagy.length > 1024 || !a.elhagy.every(azonositoAlaku))) {
      return 'az elhagyott pontok listája entitás-azonosítók listája';
    }
  }

  // ----- A HÁROM ÚJ MEZŐ ALAKJA -----
  // ⛔ D77 (2026-09-27, Csaba): az `entitas` nem akármilyen szöveg, hanem egy AZONOSÍTÓ — a szelet
  // kulcsa, és a csere ezt mondja ki a vonalon. Az átnézés mérte: egy kapun átjutott `"x"` kulcs a
  // társsal folytatott MINDEN cserét megakasztotta (HIBAS-EGYEZTETES).
  if (esemeny.entitas !== null && !azonositoAlaku(esemeny.entitas)) {
    return 'az entitas csak azonosító vagy null lehet';
  }
  if (!Number.isInteger(esemeny.entitasSorszam) || esemeny.entitasSorszam < 1) {
    return 'az entitasSorszam csak 1-nél nem kisebb egész lehet';
  }
  if (!Array.isArray(esemeny.latott) || esemeny.latott.some((a) => typeof a !== 'string')) {
    return 'a latott csak azonosítók tömbje lehet';
  }
  // ⭐ A lánc-gyökér (D63, D78, D81): a szerző ESEMÉNY ELŐTTI két gyökere — vagy null (a D78 előtti
  // események, és ha a szerző saját lánca nem ép). ⛔ Pontosan két összegzés, és a napló darabja a
  // sorszám − 1 (annyi eseménye volt előtte): egy alak van, nem kettő.
  if (esemeny.lancGyoker !== null && !lancElokepAlakja(esemeny.lancGyoker, esemeny.sorszam)) {
    return 'a lancGyoker csak a három gyökér (napló, kiosztás, kapott) vagy null lehet';
  }

  // ----- ⛔ D77: A SZÜLETÉS SZÜLŐJE — mert az is szelet-kulcs lesz -----
  // A gyerek-bejelentés (a C 7. pontja) a születést a SZÜLŐ körében is kimondja (`szuleteseSzuloje`):
  // a szülő tehát ugyanúgy kulcs a vonalon, mint az `entitas`. Hiányzó vagy `null` szülő: legfelső
  // szintű gondolat.
  // ⭐ D89/2: a koino zártsága csak igaz/hamis lehet (hiányozhat — a régi koino: zárt).
  if (esemeny.tipus === 'KoinoLetrehozas' && esemeny.adat?.zart !== undefined
      && typeof esemeny.adat.zart !== 'boolean') {
    return 'a koino zart mezője csak igaz vagy hamis lehet';
  }
  if (esemeny.tipus === 'GondolatLetrehozas') {
    const szulo = esemeny.adat?.szulo;
    if (szulo !== undefined && szulo !== null && !azonositoAlaku(szulo)) {
      return 'a gondolat szulo-ja csak azonosító vagy null lehet';
    }
  }
  // ----- ⭐⭐ D129: A RENDSZER-ENTITÁSOK NEVEI — bármely esemény hozhatja (ami kézikönyv-entitásra mutat) -----
  // A mag a névből ellenőrzi az azonosítót és ebből hozza létre az entitást (`rendszerEntitas.js`); itt az alak.
  {
    const hiba = rendszerNevekAlakiHibaja(esemeny.adat?.rendszer);
    if (hiba) return hiba;
  }
  // ----- ⭐⭐ D119 (①a): A KOINO-VERZIÓ — legfelső szintű, a gyermek születését és a kódját hozza -----
  // Itt az alak (a beágyazott születésé is); az aláírást és a tagsági bizonyítékot a kapu nézi, a szülő születésével
  // (`koinoLanc.js` `koinoVerzioEllenorzese`).
  if (koinoVerzioE(esemeny)) {
    const a = esemeny.adat;
    const sz = a.szuletes;
    if (a.szulo !== undefined && a.szulo !== null) return 'a koino-verzió legfelső szintű entitás (nincs szülője)';
    if (esemeny.entitas !== null) return 'a koino-verzió a saját szeletét nyitja';
    if (!azonositoAlaku(a.gyermek) || !szovegHivatkozasE(a.kod)) return 'a koino-verzió a gyermek nevét és a kódját nevezi meg';
    if (!sz || typeof sz !== 'object' || Array.isArray(sz) || sz.tipus !== 'KoinoLetrehozas' || sz.koino !== ''
        || sz.azonosito !== a.gyermek || sz.adat?.szulo !== esemeny.koino || sz.szerzo !== esemeny.szerzo) {
      return 'a koino-verzió a gyermek születését hozza (ennek a koinonak a gyermeke, a feltöltő hozta létre)';
    }
    const pr = sz.adat.program;
    if (!szovegHivatkozasE(pr) || pr.lenyomat !== a.kod.lenyomat || pr.bajt !== a.kod.bajt || pr.torzs !== a.kod.torzs) {
      return 'a koino-verzió kódja a gyermek születésének programja';
    }
    if (a.cim !== sz.adat.nev) return 'a koino-verzió címe a gyermek neve';
    const h = alakiHiba(sz);
    if (h) return 'a koino-verzió születése: ' + h;
  }
  // ----- ⭐ D93/5: A PROFIL — a koino kötelező mezői, a Profil esemény, a meghívás tanúsítása -----
  if (esemeny.tipus === 'KoinoLetrehozas' && esemeny.adat?.profil !== undefined) {
    const p = esemeny.adat.profil;
    if (!Array.isArray(p) || p.length > 8 || !p.every((m) => typeof m === 'string' && /^[a-z]{1,32}$/.test(m))) {
      return 'a koino profil-mezői: legfeljebb 8 kisbetűs név';
    }
  }
  if (esemeny.tipus === 'Profil' && (!azonositoAlaku(esemeny.adat?.lenyomat) || !azonositoAlaku(esemeny.entitas))) {
    return 'a Profil esemény a horgonyhoz szól, és a darab lenyomatát hordozza';
  }
  if (esemeny.tipus === 'Meghivas' && esemeny.adat?.profil !== undefined && esemeny.adat.profil !== null
      && !azonositoAlaku(esemeny.adat.profil)) {
    return 'a meghívás profil-lenyomata csak azonosító alakú lehet';
  }
  if (esemeny.tipus === 'TagsagiCsomag' && (!Array.isArray(esemeny.adat?.lanc) || !azonositoAlaku(esemeny.entitas))) {
    return 'a tagsági csomag a horgonyhoz szól, és a lánc eseményeit hordozza';
  }
  // ⭐⭐ D128 (9.9): a KERET ÁTADÁSA — az azonosság egy MÁSIK készülékének (a kulcsa a kiosztás-fa levele), és csak a lánc-gyökérrel
  // (a saját bizonyítékával): így egyetlen eseményből ellenőrizhető (D42, D81) — az átvétel ezt hozza.
  if (esemeny.tipus === 'KeretAtadas') {
    const a = esemeny.adat;
    if (!a || !azonositoAlaku(a.entitas) || a.entitas === esemeny.keszulek || esemeny.lancGyoker === null) {
      return 'a keret-átadás egy másik készülék kulcsának szól, és a lánc-gyökerével (a saját bizonyítékával) jár';
    }
  }
  // ⭐⭐ D128 (9.9): a KERET ÁTVÉTELE — az azonosság egy másik készülékének EZ a készülék szóló átadását hozza (ugyanebből a
  // koinoból), a lánc-gyökérrel (a kapott-fa bizonyítékával).
  if (esemeny.tipus === 'KeretAtvetel') {
    const at = esemeny.adat?.atadas;
    if (!at || typeof at !== 'object' || Array.isArray(at) || at.tipus !== 'KeretAtadas' || at.szerzo !== esemeny.szerzo
      || at.adat?.entitas !== esemeny.keszulek || lancKulcsa(at) === esemeny.keszulek
      || esemenyKoinoja(at) !== esemenyKoinoja(esemeny) || esemeny.lancGyoker === null) {
      return 'a keret-átvétel az azonosság egy másik készülékének ide szóló átadását hozza, a lánc-gyökerével';
    }
  }
  // ⭐⭐ D128 (①d, 9.10): a KIZÁRÁS — az eseménye a kizárás-tanúsítványt hozza (csak azt); az aláírását a kapu nézi.
  if (esemeny.tipus === 'Kizaras') {
    const a = esemeny.adat;
    const h = a && typeof a === 'object' && !Array.isArray(a) && Object.keys(a).length === 1
      ? kizarasAlakiHibaja(a.kizaras) : 'a kizárás eseménye a kizárás-tanúsítványt hozza ({ kizaras })';
    if (h) return 'a kizárás eseménye: ' + h;
  }
  // ⭐⭐ D128 (②b): a KULCSCSERE — az eseménye a születést és a cserék láncát hozza; a láncot a kapu ellenőrzi. ⭐⭐ (②e2) Ha a
  // láncban a segítők HELYREÁLLÍTÁSA áll, mindegyikének a BIZONYÍTÉKA is (`bizonyitekok`: jel → bizonyíték — pontosan ezek); a
  // bizonyítékot a kapu ellenőrzi (`allapot/helyreallitas.js`).
  if (esemeny.tipus === 'Kulcscsere') {
    const a = esemeny.adat;
    const cs = a?.cserek;
    const kulcsok = a && typeof a === 'object' && !Array.isArray(a) ? Object.keys(a).sort().join(',') : '';
    let h = kulcsok !== 'cserek,szuletes' && kulcsok !== 'bizonyitekok,cserek,szuletes'
      ? 'a kulcscsere eseménye a születést és a cserék láncát hozza ({ szuletes, cserek[, bizonyitekok] })'
      : szuletesAlakiHibaja(a.szuletes)
        ?? (!Array.isArray(cs) || !cs.length || cs.length > KULCSCSERE_KORLAT ? 'a cserék lánca 1–' + KULCSCSERE_KORLAT + ' csere'
          : cs.map(lancBejegyzesAlakiHibaja).find((x) => x) ?? null);
    if (!h) {
      const jelek = cs.filter((c) => c.tipus === HELYREALLITAS_BEJEGYZES).map((c) => c.jel).sort().join(',');
      const b = a.bizonyitekok;
      const hozott = b === undefined ? '' : b && typeof b === 'object' && !Array.isArray(b) ? Object.keys(b).sort().join(',') : null;
      if (hozott !== jelek || (b !== undefined && !jelek)) {
        h = 'a láncban álló helyreállítások bizonyítékai (pontosan ezek): bizonyitekok';
      }
    }
    if (h) return 'a kulcscsere eseménye: ' + h;
  }
  // ⭐⭐ D128 (②e — 17. pont, 9.13): a HELYREÁLLÍTÁS JÓVÁHAGYÁSA — állítás MÁSRÓL (a helyreállítandó szeletébe: `kit` = ő,
  // `sajatBelepes` = a segítő horgonya), a javaslattal és a fázissal; a szerepeket és a szabályt az `allapot/helyreallitas.js` nézi.
  if (esemeny.tipus === 'HelyreallitasJovahagyas') {
    const a = esemeny.adat;
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).sort().join(',') !== 'fazis,javaslat,kit,sajatBelepes'
      || !azonositoAlaku(a.kit) || !azonositoAlaku(a.sajatBelepes) || !HELYREALLITAS_FAZISOK.has(a.fazis)
      || !azonositoAlaku(esemeny.entitas)) {
      return 'a helyreállítás jóváhagyása a helyreállítandó horgonyához szól: { kit, sajatBelepes, javaslat, fazis }';
    }
    const h = helyreallitasJavaslatAlakiHibaja(a.javaslat);
    if (h) return 'a helyreállítás jóváhagyása: ' + h;
  }
  // ⭐⭐ D128 (②e): a helyreállítás MEGÁLLÍTÁSA — a helyreállítandó azonosság egy meglévő készülékéé, a saját horgonyához szól, és
  // a javaslat jelét nevezi meg (csak azt).
  if (esemeny.tipus === 'HelyreallitasMegallitas') {
    const a = esemeny.adat;
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).join(',') !== 'javaslat' || !azonositoAlaku(a.javaslat)
      || !azonositoAlaku(esemeny.entitas)) {
      return 'a helyreállítás megállítása a saját horgonyhoz szól, és a javaslat jelét nevezi meg ({ javaslat })';
    }
  }
  // ⭐ D94: a 2. lépcső bemondása — a saját horgonyhoz szól, és a tanúsítások azonosítóit hordozza (1–16, ismétlés nélkül).
  if (esemeny.tipus === 'LepcsoBemondas') {
    const t = esemeny.adat?.tanusitasok;
    if (!azonositoAlaku(esemeny.entitas) || !Array.isArray(t) || !t.length || t.length > 16
      || !t.every(azonositoAlaku) || new Set(t).size !== t.length) {
      return 'a 2. lépcső bemondása a horgonyhoz szól, és 1–16 különböző tanúsítás azonosítóját hordozza';
    }
  }
  return null;
}

// ===================================
// KÉT ESEMÉNY ÜTKÖZÉSE — A SAJÁT LÁNC ELÁGAZÁSA
// ===================================

/**
 * Megnézi, hogy két esemény ELLENTMOND-e egymásnak.
 *
 * A koino nem MEGAKADÁLYOZZA a kettős cselekvést, hanem LELEPLEZI (D17/D19). Ha valaki
 * két különböző eseményt ír alá ugyanarról a pontról a saját láncán — azonos szerző,
 * azonos sorszám, de más azonosító —, akkor a két aláírás ÖNMAGÁBAN bizonyíték. Nem
 * kell hozzá bíró: mindkettőt ő írta alá.
 *
 * (Ha viszont csak FOLYTATJA a láncát egy újabb sorszámmal, az nem ellentmondás — a
 * szavazatot például szabad módosítani, ahogy ma is.)
 *
 * @param {Object} egyik
 * @param {Object} masik
 * @returns {boolean} igaz, ha a kettő elágazás (ellentmondás)
 */
export function elagazasE(egyik, masik) {
  // ⭐⭐ D128: egy lánc a (szerző, készülék) páré — két készülék azonos sorszáma nem elágazás.
  return egyik.szerzo === masik.szerzo && lancKulcsa(egyik) === lancKulcsa(masik)
    && esemenyKoinoja(egyik) === esemenyKoinoja(masik)
    && egyik.sorszam === masik.sorszam
    && egyik.azonosito !== masik.azonosito;
}
