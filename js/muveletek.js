// js/muveletek.js

// Felelősség: a koino MŰVELETEI — amit egy e-ember tehet. Mindegyik ugyanazt a három
// lépést végzi: megkeresi a saját lánca végét, létrehoz egy ALÁÍRT eseményt, és elmenti.
//
// Ez a réteg köti össze a kulcsot, a láncot és a tárat. Fölötte már csak a felület van,
// alatta pedig nincs semmi, ami „engedélyezné" a műveletet — nincs szerver, aki
// jóváhagyná. Amit aláírsz, az megtörtént; hogy MI KÖVETKEZIK belőle, azt a számítás
// dönti el (D17).
//
// ===== A HÁROM ÖNHORDÓ MEZŐ (2026-08-31, a Szakasz 3 / 3.1 lépése) =====
//
// Ez a réteg TÖLTI KI a burkolat három új mezőjét, és ezért itt kell érteni, mire valók.
// Mindhárom ugyanazt a hiányt pótolja: ha a tárolást szeleteljük, a másik készülék már NEM
// látja egy szerző teljes láncát — tehát *ahol a tudás elfogy, ott az esemény hozza magával
// a bizonyítékát*.
//
//   entitas + entitasSorszam → melyik szelethez tartozom, és hányadikként (a hézag újra jel)
//   latott                   → horgony az időhöz (a visszadátumozás bizonyíthatóvá válik)
//   adat.kiosztva            → ⭐ D42: a tudatpont-keret EGYETLEN eseményből ellenőrizhető
//
// Használják: koino.js (a parancssori arc).

import {
  TUDATPONT_KERET, ALLASOK, javaslatEntitasai, erintettek, toredekAzonosito, lancLepese, ujLancAllas, keretAtvetelMerlege
} from './allapot/szabalyok.js';
// ⭐ D78 (az A pillér 2. lépése): a lánc-gyökér — a szerző esemény előtti naplója és kiosztása.
import { lancUjEsemenyhez, lancAlapKerete, lancAlapjai } from './allapot/lancGyoker.js';
import { alapokAlapja } from './allapot/tagsag.js';
import { kizarasKeszitese } from './kulcs/keszulek.js';   // ⭐⭐ D128 (①d): a kizárás-tanúsítvány
// ⭐ D80: az ellentmondás bizonyítéka — a bejelentés előtt magunk is ellenőrizzük.
import { ellentmondasEllenorzese } from './allapot/ellentmondas.js';
import { esemenyLetrehozasa, esemenyKoinoja, azonositoAlaku, KOINO_VERZIO, lancKulcsa, PONT_TIPUSOK, HELYREALLITAS_FAZISOK }
  from './esemeny/esemeny.js';
import { helyreallitasJavaslatAlakiHibaja, helyreallitasJele, helyreallitasBejegyzese } from './kulcs/azonossag.js';
import { helyreallitasokAllapota, helyreallitasBizonyiteka, azonossagLancaTarbol, javaslatElotagja, lancHelyreallitasai, segitoAllasa,
  JOVAHAGYAS } from './allapot/helyreallitas.js';   // ⭐⭐ D128 (②e)
import { tarKizarasai, tarKulcscserei, cserenKivulE, tanusitvanyKorszaka } from './allapot/kizaras.js';   // ⭐⭐ D128 (③c)
import { tarKezelese, jegyzekbe, kezelesHianyai, elvetesFeljegyzese, lancBizonyitekai, lancJele, ujKezelesJegyzek }
  from './allapot/kezelesTerjesztes.js';   // ⭐⭐ D128 (③b): a kezelés minden koinómba
import { lancNezete } from './allapot/koinoLanc.js';   // ⭐ D118 (③, ⑤b): a szerző lánca a koinóban, a jelen réteg szerint
import { koinoSzabalyai, teljesSzabalyok } from './esemeny/koinoSzabalyok.js';
// ⭐⭐ D129 (②b): a kézikönyv-nevek az eseményeken (a döntés minden eseménye a kézikönyv szeletébe kerül — MA4 (B))
import { esemenyRendszerNevei, ESEMENY_NEV_KORLAT } from './esemeny/rendszerEntitas.js';
import { kanonikusBajtok } from './esemeny/kanonikusAlak.js';
import { szovegDarabra } from './esemeny/szovegDarab.js';
// ⭐ D120: a szöveg blokkjaiban hivatkozott fájlok (a törzs méretéhez).
import { entitasFajljai } from './allapot/fajlIgeny.js';
// ⭐⭐ D126 (PR4): a nézet-kártya (a szövege: a leírás és a kód fájl-blokkja)
import { NEZET_TIPUS, nezetSzovegBlokkjai } from './allapot/nezetKartya.js';
// ⭐ D93: a tagság (a csomag kiadásához) és a tár-alapú lánc-gyűjtés.
import { tagsagiIndex, horgonyTagsaga, tagsagiLanc, TAGSAGI_CSOMAG } from './allapot/tagsag.js';
import {
  tagsagiEsemenyekGyujtese,
  // ⭐ D94: a 2. lépcső bemondása, és a tanúsítás bemondásának szűrése.
  lepcso2E, ervenyesTanusitasaim, alapitoHorgony, ujIdentitasNezet, LEPCSO_BEMONDAS
} from './allapot/identitas.js';
import {
  esemenyMentese, ujSajatHelye, sajatLancEsemenyei, azonossagEsemenyei, tarTanusitvanya,
  kovetkezoEntitasSorszam, horgonyok, esemenyLekerese, entitasEsemenyei, koinoEsemenyei
} from './tar/esemenyTar.js';

/**
 * ⭐⭐ D128: a környezet SAJÁT LÁNCA — a készülékem kulcsa (a `kulcspar` egy tanúsított készülék: `kulcs/keszulek.js` `eszkoz`).
 * A lánc (a sorszám, az előző, a lánc-gyökér, az entitás-sorszám) ezé; a `szerzo` az azonosságom.
 */
const sajatLanc = (kornyezet) => kornyezet.keszulek ?? kornyezet.kulcspar?.keszulek;
import { allapotSzamitasa } from './allapot/allapotSzamitas.js';
import { javaslatokSzamitasa } from './allapot/javaslatSzamitas.js';
import {
  CSOMAG_TIPUS, CSOMAG_BAJT_KORLAT, dontesBemenete, celbolHianyzik, csomagokra, bajt
} from './allapot/dontesiCsomag.js';

// ===== A TUDATPONT-KERET =====
// Mindenkinek UGYANANNYI tudatpontja van: nem elkölthető, csak szétosztható és bármikor
// átrendezhető.
//
// ⚠️ AZ ELLENŐRZÉS ITT KÉNYELEM, NEM VÉDELEM. Azért van, hogy ne írjunk alá olyan
// eseményt, ami sérti a keretet — de a VALÓDI őrzés a SZÁMÍTÁSBAN van (szabalyok.js),
// mert a másik gép felülete semmitől nem véd meg. A keret értéke onnan jön, egy
// példányban, hogy a kettő ne csúszhasson szét.
export { TUDATPONT_KERET };

// Hány horgonyt tegyünk egy határidő-mozgató eseményre? Egy is elég ahhoz, hogy az esemény
// bizonyíthatóan „azután" keletkezzen — és minden további horgony ~50 bájt.
const HORGONY_DARAB = 1;

// ⭐ A TANÚSÍTÁSNÁL TÖBB HORGONY KELL. Nem az időt kötjük meg vele, hanem azt bizonyítjuk,
// *kitől meddig láttam* a rólam szóló eseményeket — és ehhez több felhatalmazótól kell
// friss pontot fognunk. Az ár ~50 bájt horgonyonként.
const TANUSITAS_HORGONY = 5;

// ⭐ A BULI-ELISMERÉSNÉL többet fogunk, mert ez a rendszeres, „hivatalos" pont: ez köti el a
// legszorosabban, meddig látok. Az ára ~50 bájt horgonyonként, körönként egyszer.
const ELISMERES_HORGONY = 12;

// ===================================
// SEGÉD: ESEMÉNY LÉTREHOZÁSA ÉS MENTÉSE
// ===================================

/**
 * A közös váz: lánc vége → aláírt esemény → mentés.
 *
 * @param {Object} kornyezet - { koino, kulcspar, szerzo, tar }
 * @param {string} tipus
 * @param {Object} adat
 * @param {Object} [beallitas]
 * @param {string|null} [beallitas.entitas] - a SZELET-KULCS; null = az esemény a saját
 *        szeletét nyitja (koino- és gondolat-létrehozás)
 * @param {boolean} [beallitas.horgonyozzunk] - kérünk-e horgonyt (a határidőt mozgató
 *        eseményeknél igen: szavazat, tudatpont-rendezés, érték javaslat)
 * @returns {Promise<Object>} a létrehozott esemény
 */
/**
 * ⭐ D72 (2026-09-26): A SZÖVEG KÜLÖN DARAB. A szöveg bájtjai a környezet darab-tárába
 * (`kornyezet.darabTar` — a fájl-tár, ahol a képek is) kerülnek, és a HIVATKOZÁS jön vissza,
 * amit az esemény hordoz.
 *
 * ⚠️ ELŐBB A DARAB, CSAK UTÁNA AZ ESEMÉNY: így egy aláírt esemény soha nem hivatkozik olyan
 * darabra, ami a saját gépünkön nincs meg. (Ha az esemény mentése utána bukik, a darab
 * árván marad — ártalmatlan: a neve a tartalma.)
 *
 * ⛔ HA NINCS DARAB-TÁR, NEM TESSZÜK A SZÖVEGET CSENDBEN AZ ESEMÉNYBE — megnevezett hibával
 * leállunk. *Egy elhallgatott döntés-szegés rosszabb, mint egy megtagadott művelet.*
 *
 * @param {Object} kornyezet
 * @param {string|Array|Object|null} szoveg
 * @returns {Promise<Object|null>} a hivatkozás (vagy null, ha nincs szöveg)
 */
async function szovegDarabbaTetele(kornyezet, szoveg) {
  const { hivatkozas, bajtok } = await szovegDarabra(szoveg);
  if (!bajtok) return hivatkozas;
  if (!kornyezet.darabTar) {
    throw new Error('A szöveg külön darab (D72) — ehhez a környezetben darab-tár kell (darabTar).');
  }
  const irt = await kornyezet.darabTar.ir(bajtok);
  if (irt.lenyomat !== hivatkozas.lenyomat) {
    throw new Error('A darab-tár más lenyomatot adott, mint a szövegé — nem írunk alá rá hivatkozást.');
  }
  return torzsesHivatkozas(hivatkozas, szoveg, kornyezet.darabTar);
}

/**
 * ⭐ D120: A TÖRZS MÉRETE A HIVATKOZÁSBAN — a darab + a szövegben hivatkozott fájlok (a képek, a csatolmányok), egyszer
 * számolva. A fejlécen ebből látszik, mekkora a törzs, mielőtt bárki kérné (a letöltő a valódi méretet az első szeletből tudja,
 * és a határnál megáll). Fájl nélkül elmarad (a törzs maga a darab); ha egy fájl mérete nincs meg nálam, szintén — nem
 * tippelünk.
 */
async function torzsesHivatkozas(hivatkozas, szoveg, darabTar) {
  const fajlok = [...entitasFajljai({ szoveg })];
  if (!fajlok.length || typeof darabTar?.meret !== 'function') return hivatkozas;
  let torzs = hivatkozas.bajt;
  for (const l of fajlok) {
    const m = await darabTar.meret(l);
    if (!Number.isSafeInteger(m)) return hivatkozas;
    torzs += m;
  }
  return torzs > hivatkozas.bajt ? { ...hivatkozas, torzs } : hivatkozas;
}

async function esemenytTeszek(kornyezet, tipus, adat, beallitas = {}) {
  const { entitas = null } = beallitas;
  console.log('muveletek.esemenytTeszek - KEZDÉS', { tipus, entitas });

  // ⛔⛔ D70 (2026-09-26): A TÁR MÖGÖTT AZ ÍRÓ ÁLL. Egy készüléken több folyamat ír a saját
  // láncunkba (az őrjárat felszabadítása, a második ablak parancsa, a felület); az író a SAJÁT
  // új eseményt csak a lánc VÉGÉRE engedi. Ha közben egy másik folyamat írt, a válasz
  // „ELAVULT": frissítünk, és a lánc új végéről újra aláírunk. *Elágazás így nem születhet.*
  //
  // ⚠️ Az ADAT is újraszámolódhat (függvényként adva): a tudatpont bemondott összege a saját
  // láncból jön — egy közben beírt pont-esemény után a régi összeg hazudna (D42).
  for (let kiserlet = 1; ; kiserlet++) {
    // ⭐ EGY PILLANATKÉP próbálkozásonként: előbb amit MÁS folyamat írt (43. mérés), és utána
    // ugyanebből jön az adat (a bemondott összeg) ÉS a lánc vége. ⛔ Ha a kettő közé egy
    // frissítés esne, az összeg és a hely két különböző állapotról beszélne.
    await kornyezet.tar.frissit?.();
    const adatMost = typeof adat === 'function' ? await adat() : adat;
    const esemeny = await esemenyAlairasa(kornyezet, tipus, adatMost, beallitas);
    let eredmeny;
    try {
      eredmeny = await esemenyMentese(kornyezet.tar, esemeny, { ujSajat: true });
    } catch (hiba) {
      if (hiba.kod === 'ELAVULT' && kiserlet < ELAVULT_PROBAK) {
        console.log('muveletek.esemenytTeszek - elavult lánc-vég, újra', { kiserlet });
        continue;
      }
      throw hiba;
    }
    if (!eredmeny.mentve) {
      throw new Error('Az esemény nem menthető: ' + eredmeny.ok);
    }
    console.log('muveletek.esemenytTeszek - VÉGE', { azonosito: esemeny.azonosito });
    return esemeny;
  }
}

/**
 * ⭐⭐ D118/2 (①b): a koinó SZABÁLYAI a születéséből — lenyomat-nevű koinónál a születés azonosítója maga a koinó neve,
 * tehát egyetlen tár-kérdés. Ha nincs meg (vagy a régi alak), a mai értékek.
 * @returns {Promise<Object>} `koinoSzabalyok.js` `koinoSzabalyai` alakja
 */
export async function koinomSzabalyai(kornyezet) {
  if (kornyezet.koinoSzabalyok) return kornyezet.koinoSzabalyok;
  const szuletes = azonositoAlaku(kornyezet.koino) ? await kornyezet.tar?.esemeny?.(kornyezet.koino) : null;
  return koinoSzabalyai(szuletes ?? null);
}

/**
 * Egy szerző AZONOSSÁG-HORGONYA ebben a koinóban (D56): az alapítóé a `KoinoLetrehozas`, mindenki
 * másé a (legkorábbi) `Belepes` eseménye. ⚠️ A tárban lévő láncából — ha nincs meg, null (D19).
 * @returns {Promise<string|null>}
 */
export async function azonossagHorgonya(tar, koino, szerzo) {
  // ⭐⭐ D128: az azonosság MINDEN készülékének eseményei (a horgonyt bármelyik írhatta) — a legkorábbi idő szerint.
  const lanc = (await azonossagEsemenyei(tar, szerzo)).filter((e) => esemenyKoinoja(e) === koino)
    .sort((a, b) => (a.ido - b.ido) || (a.azonosito < b.azonosito ? -1 : 1));
  const belepes = lanc.find((e) => e.tipus === 'Belepes');
  if (belepes) return belepes.azonosito;
  // ⭐ D118 (④a): a bekapcsolódóé a bekapcsolódása, a létrehozóé (az alapítóé) a születés.
  return lanc.find((e) => e.tipus === 'Bekapcsolodas')?.azonosito
    ?? lanc.find((e) => e.tipus === 'KoinoLetrehozas')?.azonosito ?? null;
}

/**
 * ⭐⭐ AZ ELLENTMONDÁS BEJELENTÉSE (D80) — a bizonyíték a VÁDOLT azonosság-szeletébe kerül (mint a
 * meghívás és a tanúsítás a másikéba), mert aki a pontjait számolja, az oda úgyis ránéz.
 *
 * ⚠️ Előbb MAGUNK ellenőrizzük: hamis vádat nem írunk alá (a kapu amúgy is elutasítaná).
 *
 * @param {Object} kornyezet
 * @param {Object} adat - a bizonyíték (`ellentmondas.js`: kit, fajta, vadpont, és a fajta anyaga)
 */
export async function ellentmondasBejelentese(kornyezet, adat) {
  // ⭐ Előbb a hely: akinek nincs nálunk azonosság-szelete, arról nincs hova bejelenteni (⭐⭐ D128: és a készülékének
  // tanúsítványa sincs meg — a bizonyítéka nálunk úgysem ellenőrizhető).
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, adat?.kit);
  if (!horgony) {
    throw new Error('A vádoltnak nincs azonosság-szelete ebben a koinóban (se Belepes, se '
      + 'KoinoLetrehozas nálunk) — a bizonyíték nem helyezhető el (D80).');
  }
  const vad = await ellentmondasEllenorzese(adat, kornyezet.koino,
    // ⭐⭐ D128: a vádolt LÁNCÁNAK alapja — a kapottját a vádolt esemény aláírt előképe adja hozzá (`ellentmondas.js`).
    { tudatpontKeret: await lancAlapKerete(kornyezet.tar, kornyezet.koino, lancKulcsa(adat?.esemeny), adat?.kit),
      tanusitvany: kornyezet.tar });   // ⭐⭐ D128: a vádolt készülékének tanúsítványa a tárból
  if (!vad.rendben) throw new Error('A bizonyíték nem áll meg: ' + vad.ok);
  return esemenytTeszek(kornyezet, 'Ellentmondas', adat, { entitas: horgony });
}

/**
 * ⭐⭐ AZ ÉSZLELT ELLENTMONDÁSOK BEJELENTÉSE (D82 sorrend ①) — az észlelő (`allapot/eszlelo.js`)
 * leletei, egyenként a vádolt azonosság-szeletébe. ⭐ Nem ismétli magát: ha a szeletben már ott van
 * ugyanez a bizonyíték (ugyanaz a fajta, ugyanaz a vádpont vagy vesztes), kihagyja — így az őrjárat
 * minden körben nyugodtan kereshet. Akinek nincs nálunk horgonya, arról most nem jelentünk (a
 * bizonyíték nem helyezhető el — D80), csak számoljuk.
 *
 * @param {Object} kornyezet
 * @param {Array<Object>} leletek - `Ellentmondas` adatok
 * @returns {Promise<{bejelentve: number, marVolt: number, nincsHorgony: number}>}
 */
export async function ellentmondasokBejelentese(kornyezet, leletek) {
  let bejelentve = 0, marVolt = 0, nincsHorgony = 0;
  for (const adat of leletek) {
    const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, adat.kit);
    if (!horgony) { nincsHorgony++; continue; }
    const ugyanaz = (x) => x.tipus === 'Ellentmondas' && x.adat?.kit === adat.kit && x.adat?.fajta === adat.fajta
      && (adat.fajta === 'elagazas' ? x.adat?.vesztes === adat.vesztes : x.adat?.vadpont === adat.vadpont);
    if ((await kornyezet.tar.szeletEsemenyei(horgony)).some(ugyanaz)) { marVolt++; continue; }
    await ellentmondasBejelentese(kornyezet, adat);
    bejelentve++;
  }
  return { bejelentve, marVolt, nincsHorgony };
}

// ⭐ Ennyiszer próbálunk újra, ha közben más folyamat írt a láncunkba. ⚠️ Nem várt verseny
// esetén egy-kettő; a korlát csak azért van, hogy semmi ne pörögjön a végtelenségig.
const ELAVULT_PROBAK = 20;

/**
 * A lánc mostani végéről aláír egy saját eseményt (még nem menti).
 * ⚠️ Nem frissít: a pillanatképet a hívó készíti (lásd fent).
 */
async function esemenyAlairasa(kornyezet, tipus, adat, beallitas) {
  const { entitas = null, horgonyozzunk = false } = beallitas;
  // ⭐ D118 (⑤b): a koinóbeli láncom végére (a nem bekapcsolódó gyermekbeli lánca 1-ről indul; a bekapcsolódás a lánc-pontja után).
  const veg = await ujSajatHelye(kornyezet.tar, sajatLanc(kornyezet), kornyezet.koino, tipus, adat);

  // A saját szeletét nyitó eseménynél az entitás-sorszám mindig 1 — nincs mihez képest
  // hányadiknak lennie, hiszen a szelet most keletkezik.
  const entitasSorszam = entitas === null
    ? 1
    : await kovetkezoEntitasSorszam(kornyezet.tar, kornyezet.koino, sajatLanc(kornyezet), entitas);

  // A horgony csak ott ér valamit, ahol van mihez kötni: a saját szeletét nyitó eseménynél
  // a szelet még üres.
  //
  // ⭐⭐ ÉS EGY MÁSODIK HORGONY-CÉL (9/c 4.5): a tanúsításnál NEM a másik szeletébe
  // horgonyzunk, hanem a SAJÁTUNKBA — mert ott van az, amit bizonyítani kell: *meddig
  // láttam a rólam szóló felhatalmazásokat és visszavonásokat.*
  const horgonySzelet = beallitas.horgonySzelet ?? entitas;
  const latott = (horgonyozzunk && horgonySzelet)
    ? await horgonyok(kornyezet.tar, kornyezet.koino, horgonySzelet, kornyezet.szerzo,
                      beallitas.horgonyDarab ?? HORGONY_DARAB)
    : [];

  // ⚠️ AZ IDŐ ÁTADHATÓ, ÉS EGYETLEN OKBÓL (5.7): ha két esemény **egy tett** (a javaslat
  // és a javaslattevő támogatása), akkor egy időbélyeget kell viselniük. ⛔ Különben nulla
  // döntési időnél a szavazat **késői** lenne — a javaslat a születése pillanatában zár,
  // és az egy ezredmásodperccel későbbi szavazat már nem számít bele (mérve).
  //
  // ⭐ Nem óra-hamisítás: a saját láncomban az idő nem lép VISSZA, csak áll egy pillanatra.
  //
  // ⭐⭐ D78, D81: A LÁNC-GYÖKÉR — az új esemény a szerző ESEMÉNY ELŐTTI naplóját (a kettős lánc a
  // szeletek között is lelepleződik, D63) és kiosztását hordozza; a PONT-esemény az entitása régi
  // értékének bizonyítékát is (D81: a bizonyíték az eseménnyel utazik — a bemondott összeg a szerző
  // nélkül is ellenőrizhető, D42). Ha a saját lánc nem ép, null (mint a D78 előtti eseményeké).
  // ⭐⭐ D128 (9.9): a keret átadása is pont-esemény (a levele a fogadó készülék kulcsa); az ÁTVÉTEL a kapott-fa bizonyítékát hozza
  // (az adó levelének régi értékét — `beallitas.kapottKulcs`).
  const pontEntitas = PONT_TIPUSOK.has(tipus) && typeof adat?.entitas === 'string' ? adat.entitas : null;
  const kapottKulcs = tipus === 'KeretAtvetel' && typeof beallitas.kapottKulcs === 'string' ? beallitas.kapottKulcs : null;
  // ⭐ D85/2 (T2): a SZAVAZAT a jogának bizonyítékát hozza — részenként az érintettre és a
  // javaslat-entitásra (a `szavazas` adja meg a kulcsokat).
  // ⭐ D85 T3 előfeltétele: a JAVASLAT is — érintettenként a javaslattevő pontjára.
  const szavazatKulcsok = (tipus === 'Szavazat' || tipus === 'Javaslat') && Array.isArray(beallitas.bizonyitekKulcsok)
    && beallitas.bizonyitekKulcsok.length ? beallitas.bizonyitekKulcsok : null;
  // ⭐ D118 (⑤b): a BEKAPCSOLÓDÁS nem horgonyoz — a lánc nézete a bekapcsolódással változik (előtte a szülőbeli előtag még nem a
  // gyermekbeli láncom), a következő eseményem már a hozott kiosztást köti.
  const { lancGyoker, bizonyitek, kapottBizonyitek } = tipus === 'Bekapcsolodas'
    ? { lancGyoker: null, bizonyitek: null, kapottBizonyitek: null }
    : await lancUjEsemenyhez(kornyezet.tar, kornyezet.koino, sajatLanc(kornyezet),
      veg.sorszam, kornyezet.lancTarolo ?? null, pontEntitas ?? szavazatKulcsok, kapottKulcs);
  const vegsoAdat = (pontEntitas || szavazatKulcsok) && bizonyitek ? { ...adat, bizonyitek }
    : kapottKulcs && kapottBizonyitek ? { ...adat, bizonyitek: kapottBizonyitek } : adat;
  return esemenyLetrehozasa(
    // ⭐⭐ D128 (①d): a folytatott lánc — ha a környezet egy másik (a kizárt) készülék láncát viszi (az örökös), a `lanc` mező.
    { koino: kornyezet.koino, tipus, adat: vegsoAdat, entitas, entitasSorszam, latott, lancGyoker, lanc: sajatLanc(kornyezet),
      ...(beallitas.ido !== undefined ? { ido: beallitas.ido } : {}), ...veg },
    kornyezet.kulcspar
  );
}

// ===================================
// SEGÉD: MENNYI TUDATPONTOT OSZTOTTAM KI EDDIG? (a D42-höz)
// ===================================

/**
 * Végigmegy a SAJÁT láncon, és kiszámolja, mennyi tudatpontot osztottam ki összesen — és
 * mennyi van most az adott entitáson.
 *
 * ⚠️ MIÉRT A SAJÁT LÁNCBÓL, ÉS MIÉRT NEM AZ ÁLLAPOTBÓL? Mert pontosan ugyanazt a számítást
 * kell végeznünk, amit a `szabalyok.js` végez majd az ellenőrzéskor — különben a bemondott
 * összeg nem egyezne azzal, amit a másik gép kiszámol, és a saját eseményünk mondana
 * ellent önmagának.
 *
 * ⭐ ÉS EZ AZ, AMI A D42-t ÉRTELMESSÉ TESZI: a saját láncát MINDENKI ismeri (ő írta). A
 * másik gép viszont a szeletelés után NEM — ezért kell bemondani neki.
 *
 * @param {Object} kornyezet
 * @param {string} entitas
 * @returns {Promise<{osszeg: number, regi: number}>}
 */
async function sajatKiosztott(kornyezet, entitas) {
  const { alap, alapok } = await sajatAlapjaim(kornyezet);
  // ⭐⭐ D118 (③): a JELEN réteg szerint — a bekapcsolódó (a létrehozó) szülőbeli pontjai is a láncom (a hozott kiosztás);
  // ugyanaz a szabály, amit a szabály-réteg a koinó képében lát (`jelenbenSzamit`), különben a bemondott összeg
  // ellentmondana a láncomnak.
  // ⭐ ④a: a saját bekapcsolódásom (a láncomban) mondja meg, mit hozok — a lánc-pontot és az elhagyott pontokat.
  // ⭐ D118 (⑤b): a LÁNCOM (a hozott előtaggal) adja a folytonosságot, a jelen réteg a súlyt — mint a szabály-rétegben, ahol a
  // láncon lévő, de a jelenből kizárt esemény ismert sorszám, nem hézag.
  const nezet = await lancNezete(kornyezet.tar, kornyezet.koino, sajatLanc(kornyezet));
  const lanc = (await sajatLancEsemenyei(kornyezet.tar, sajatLanc(kornyezet))).filter(nezet.tagja);
  // ⭐ D118/2: a keret a koinóé (a születéséből) — ⭐⭐ D128 (9.9): és a LÁNCÉ (a készülékemé): az alap (ha én írtam a horgonyt) +
  // a kapott (az átvételeim) — eseményenként, ugyanaz, amit a szabály-réteg használ (`lancLepese`).
  const allas = ujLancAllas();
  // ⭐ A folytonosságot is ugyanúgy követjük, mint a szabály (a saját láncunk rendes esetben
  // hézagtalan — de ha nem, az ítéletnek akkor is egyeznie kell).
  let folytonos = true;
  let vartSorszam = 1;

  for (const e of lanc) {
    if (e.sorszam !== vartSorszam) folytonos = false;
    vartSorszam = e.sorszam + 1;
    if (!nezet.szamit(e)) continue;

    // ⛔⛔ UGYANAZ AZ ÍTÉLET, NEM A MÁSOLATA (2026-09-26, 43. mérés): a szabály-réteg
    // függvényét hívjuk. Egy korábbi saját másolat az ELVETETT bemondást (pl. egy régi,
    // `kiosztva` nélküli eseményt) beleszámolta — és onnantól minden új pont-eseményünk
    // „ellentmondott a saját láncának".
    // ⭐ D118 (④a): a hozott (az ős láncából jött) pont-esemény a számított összeggel — ugyanaz, mint a szabály-rétegben.
    // ⭐⭐ D128 (9.9): a lépés a pont-eseményt (a keret átadását is) és az átvételt is könyveli; ami nem számít, az a régi értéket
    // hagyja érvényben.
    lancLepese(allas, e, folytonos, alap, alapok, nezet.hozott(e));
  }

  return { osszeg: allas.osszeg, regi: allas.pontok.get(entitas) ?? 0, keret: alap + allas.kapottOsszeg, allas, folytonos,
    alapok };
}

/**
 * ⭐⭐ D128 (9.9): a láncaim ALAPJA ebben a koinóban — a sajátomé (a koinó kerete, ha ez a készülék írta az azonosságom
 * horgonyát; különben 0), és a többi készülékemé (az átvételek ítéletéhez). A koinó kerete, ha a környezet szabályt ad.
 * @returns {Promise<{alap: number, alapok: Object}>}
 */
async function sajatAlapjaim(kornyezet) {
  if (kornyezet.koinoSzabalyok) {
    const k = kornyezet.koinoSzabalyok.tudatpontKeret;
    return { alap: k, alapok: { keret: k, horgonyLanca: null } };
  }
  const alapok = await lancAlapjai(kornyezet.tar, kornyezet.koino, kornyezet.szerzo);
  return { alap: alapokAlapja(alapok, sajatLanc(kornyezet)), alapok };
}

/**
 * ⭐ D119 (①a): mennyi tudatpontom szabad még ebben a koinóban (a keret − a kiosztott) — ugyanabból a számításból, mint a
 * bemondott összeg (`sajatKiosztott`). A koino-verzió ezzel néz meg előre, mielőtt a gyermek megszületne.
 * @param {Object} kornyezet
 * @returns {Promise<number>}
 */
export async function szabadTudatpontjaim(kornyezet) {
  const { osszeg, keret } = await sajatKiosztott(kornyezet, null);
  return keret - osszeg;
}

/**
 * ⭐⭐ D128 (9.9): a SAJÁT LÁNCOM (készülékem) kerete ebben a koinóban — az alap (a koinó kerete, ha ez a készülék írta az
 * azonosságom horgonyát; különben 0) + a kapott (amit a többi készülékemtől átvettem).
 * @param {Object} kornyezet
 * @returns {Promise<number>}
 */
export async function sajatKeretem(kornyezet) {
  return (await sajatKiosztott(kornyezet, null)).keret;
}

// ===================================
// ⭐⭐ D128 (9.9): A KERET ÁTADÁSA ÉS ÁTVÉTELE (két készülékem között)
// ===================================
//
// A keret készülékenként osztott (KU1 (B)): az első készüléké alapból az egész, a többié 0. A keret az ÁTADÁSSAL mozog: az adó a
// saját láncán aláírja (`KeretAtadas` — pont-esemény, a levele a fogadó kulcsa, a pontja a HALMOZOTT átadott összeg), a fogadó
// a saját láncán átveszi (`KeretAtvetel` — az adó aláírt átadását hozza). Mindkettő egy eseményből ellenőrizhető (D42, D81). ⭐ A
// visszaadás a másik irányú átadás. ⏭️ Az átfolyás (ki, mikor, mennyit — a határral) a (2c); a két készülék találkozása a ③.

/**
 * A keret ÁTADÁSA egy másik készülékemnek: a `tobblet` pontot a szabad részemből — a fogadó kulcsán a halmozott összeg nő.
 * @param {Object} kornyezet
 * @param {string} kinek - a fogadó készülék kulcsa (az azonosságom tanúsította — a tanúsítványa nálam van)
 * @param {number} tobblet - hány pontot adok most (pozitív egész)
 * @returns {Promise<Object>} az aláírt `KeretAtadas`
 */
export async function keretAtadasa(kornyezet, kinek, tobblet) {
  console.log('muveletek.keretAtadasa - KEZDÉS', { kinek, tobblet });
  if (!Number.isSafeInteger(tobblet) || tobblet < 1) throw new Error('Az átadott tudatpont csak pozitív egész lehet.');
  if (kinek === sajatLanc(kornyezet)) throw new Error('Önmagadnak nem adhatsz keretet — a fogadó egy másik készüléked.');
  const t = await tarTanusitvanya(kornyezet.tar, kinek);
  if (!t || t.azonossag !== kornyezet.szerzo) {
    throw new Error('A fogadó nem a te készüléked — a tanúsítványa az azonosságodtól nincs meg nálam.');
  }
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kornyezet.szerzo);
  if (!horgony) throw new Error('Ebben a koinóban nincs azonosság-szeleted (nem léptél be) — nincs mit átadni.');
  // ⭐ D70: az adat függvény — a bemondott összeg a friss láncomból.
  const adat = async () => {
    const { osszeg, regi, keret } = await sajatKiosztott(kornyezet, kinek);
    const kiosztva = osszeg + tobblet;
    if (kiosztva > keret) {
      throw new Error('Ennyi szabad tudatpontod nincs. Kereted ' + keret + ', ebből ' + osszeg + ' kiosztva.');
    }
    return { entitas: kinek, pont: regi + tobblet, kiosztva };
  };
  const uj = await esemenytTeszek(kornyezet, 'KeretAtadas', adat, { entitas: horgony });
  console.log('muveletek.keretAtadasa - VÉGE', { azonosito: uj.azonosito, pont: uj.adat.pont });
  return uj;
}

/**
 * ⭐⭐ D128 (8.1, KU1 (a)): AZ ÁTFOLYÁS MÉRTÉKE — két készülékem találkozásakor a több szabad ponttal rendelkező a különbség FELÉT
 * adja, de a fogadó RÉSZE (elhelyezett + szabad) nem lépheti túl a határt. ⭐ A határ az ADÓ szabálya (a lapon állítható — ④): egy
 * ellopott készülék így legfeljebb a határig gyűjthet, akárhányszor találkozik a becsületessel (93. (g): határ nélkül a tolvajnál
 * 10 találkozás után 4996 lett a saját 1000-es része helyett). A mag nem tud róla — a mag csak az átadást ellenőrzi.
 * @param {{adoSzabad: number, kapoSzabad: number, kapoResze: number, hatar: number}} a
 * @returns {number} hány pontot ad (0, ha semennyit)
 */
export function atfolyasMerteke({ adoSzabad, kapoSzabad, kapoResze, hatar }) {
  const fel = Math.floor((adoSzabad - kapoSzabad) / 2);
  const fer = hatar - kapoResze;
  return Math.max(0, Math.min(fel, fer));
}

/**
 * ⭐⭐ D128 (8.1): AZ ÁTFOLYÁS egy másik készülékem felé — a láncaink állásából (a táramban lévő láncából) annyit adok át, amennyit
 * az `atfolyasMerteke` mond. ⚠️ A még át nem vett átadásaim (amit adtam, de a lánca még nem vett át) a részéhez és a szabadjához
 * számítanak — különben minden találkozáskor újra adnék. ⏭️ A találkozás (mikor fut) a hálózattal jön (③), a határ a lappal (④).
 * @param {Object} kornyezet
 * @param {string} kinek - a másik készülékem kulcsa
 * @param {{hatar: number}} beallitas - a fogadó határa (az én szabályom)
 * @returns {Promise<{merteke: number, atadas: Object|null}>}
 */
export async function keretAtfolyasa(kornyezet, kinek, { hatar }) {
  console.log('muveletek.keretAtfolyasa - KEZDÉS', { kinek, hatar });
  if (!Number.isSafeInteger(hatar) || hatar < 0) throw new Error('A határ csak nemnegatív egész lehet.');
  const en = await sajatKiosztott(kornyezet, kinek);
  const o = await sajatKiosztott({ ...kornyezet, keszulek: kinek }, null);   // a fogadó lánca — ahogy a táramban áll
  const fuggo = Math.max(0, en.regi - (o.allas.kapott.get(sajatLanc(kornyezet)) ?? 0));
  const merteke = atfolyasMerteke({ adoSzabad: en.keret - en.osszeg, kapoSzabad: o.keret - o.osszeg + fuggo,
    kapoResze: o.keret + fuggo, hatar });
  const atadas = merteke > 0 ? await keretAtadasa(kornyezet, kinek, merteke) : null;
  console.log('muveletek.keretAtfolyasa - VÉGE', { merteke, fuggo });
  return { merteke, atadas };
}

/**
 * ⭐⭐ D128 (③c — 9.12, KH1 (A)): AZ ÁTFOLYÁS HATÁRÁNAK ALAPÉRTÉKE — a koinó keretének 20%-a (10 000-nél 2000). Csaba (2026-11-16):
 * „jó a 2000, de írdfel, hogy ezek az értékek, személyre szabhatók lesznek majd.” — ez csak az alapérték: a határt mindenki maga
 * szabja meg, készülékenként (a lapon — ④); addig ez érvényes.
 */
export const ATFOLYAS_HATAR_ARANY = 0.2;

/** Az átfolyás határának alapértéke egy kerethez (lefelé kerekítve). */
export function atfolyasHatarAlap(keret) {
  return Math.floor(keret * ATFOLYAS_HATAR_ARANY);
}

/**
 * ⭐⭐ D128 (③c): ÉRVÉNYES-E a készülékem ebben a koinóban — a tanúsítványa az azonosságomé, nincs kizárva, és a kulcscsere sem ejtette
 * ki (a tár szerint). Egy kizárt (ellopott) készüléknek semmit nem adunk, és tőle semmit nem veszünk át.
 * @param {Object} kornyezet
 * @param {string} keszulek
 * @returns {Promise<boolean>}
 */
export async function sajatKeszulekErvenyesE(kornyezet, keszulek) {
  const t = await tarTanusitvanya(kornyezet.tar, keszulek);
  if (!t || t.azonossag !== kornyezet.szerzo) return false;
  const kizarasok = await tarKizarasai(kornyezet.tar, kornyezet.szerzo);
  if (kizarasok.has(keszulek)) return false;
  const cserek = await tarKulcscserei(kornyezet.tar, kornyezet.szerzo);
  return !cserenKivulE({ szerzo: kornyezet.szerzo, keszulek }, cserek, new Map([[keszulek, tanusitvanyKorszaka(t)]]), kizarasok);
}

/**
 * ⭐⭐ D128 (③c — 9.12): A NEKEM SZÓLÓ ÁTADÁSOK ÁTVÉTELE — ha egy másik (érvényes) készülékem átadást írt nekem ebben a koinóban, és
 * még nem vettem át mindet (a halmozott összeg több, mint amit tőle kaptam), átveszem a legutolsót (az a halmozott — `keretAtvetele`).
 * ⭐ Találkozás nem kell: az átadás a cserével (vagy egy harmadik készülékkel) jön, és a parancsok elején, az őrjárat körében és a
 * saját készülékkel való csere után is lefut. ⚠️ Amit a számítás nem fogadna el (pl. az adó közben kiesett), azt kihagyja.
 * @param {Object} kornyezet
 * @returns {Promise<{atvetelek: Array<Object>, kihagyva: Array<string>}>}
 */
export async function keretAtvetelekGondozasa(kornyezet) {
  const en = sajatLanc(kornyezet);
  const utolsok = new Map();   // adó lánca → a legutolsó nekem szóló átadása
  for (const e of await azonossagEsemenyei(kornyezet.tar, kornyezet.szerzo)) {
    if (e.tipus !== 'KeretAtadas' || e.adat?.entitas !== en || esemenyKoinoja(e) !== kornyezet.koino) continue;
    const ado = lancKulcsa(e);
    if (ado === en) continue;
    const eddigi = utolsok.get(ado);
    if (!eddigi || e.sorszam > eddigi.sorszam) utolsok.set(ado, e);
  }
  const ki = { atvetelek: [], kihagyva: [] };
  if (!utolsok.size) return ki;
  const { allas } = await sajatKiosztott(kornyezet, null);
  for (const [ado, atadas] of utolsok) {
    if ((atadas.adat.pont ?? 0) <= (allas.kapott.get(ado) ?? 0)) continue;   // már átvettem
    try {
      ki.atvetelek.push(await keretAtvetele(kornyezet, atadas));
    } catch (hiba) {
      ki.kihagyva.push(ado);
      console.log('muveletek.keretAtvetelekGondozasa - kihagyva', { ado: ado.slice(0, 8), ok: hiba.message });
    }
  }
  if (ki.atvetelek.length) console.log('muveletek.keretAtvetelekGondozasa - VÉGE', { atvetelek: ki.atvetelek.length });
  return ki;
}

/**
 * ⭐⭐ D128 (③c — 9.12, KH1 (A)): A SAJÁT KÉSZÜLÉKEM A CSERÉBEN — ha a társ az én (érvényes) készülékem: a nekem szóló átadásait
 * átveszem, és ha nálam több a szabad pont, a különbség felét átadom neki, de a része legfeljebb a határig nő (`keretAtfolyasa` —
 * a határ az ADÓ szabálya; alapból a koinó keretének 20%-a). A határ fölött nem adok magától (a kérdés a lapé — ④). Egy kizárt vagy a
 * kulcscsere által kiejtett készüléknek semmit.
 * @param {Object} kornyezet
 * @param {string} tarsKeszulek - a társ készülékének kulcsa (a kapu kötéséből)
 * @param {{hatar?: number|null}} [beallitas]
 * @returns {Promise<{ervenyes: boolean, atvetelek: Array<Object>, merteke: number, atadas: Object|null}>}
 */
export async function sajatKeszulekTalalkozasa(kornyezet, tarsKeszulek, { hatar = null } = {}) {
  const ki = { ervenyes: false, atvetelek: [], merteke: 0, atadas: null };
  if (tarsKeszulek === sajatLanc(kornyezet) || !(await sajatKeszulekErvenyesE(kornyezet, tarsKeszulek))) return ki;
  if (!(await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kornyezet.szerzo))) return ki;   // itt nem vagyok tag
  console.log('muveletek.sajatKeszulekTalalkozasa - KEZDÉS', { tars: tarsKeszulek.slice(0, 8) });
  ki.ervenyes = true;
  ki.atvetelek = (await keretAtvetelekGondozasa(kornyezet)).atvetelek;
  // ⭐⭐ (④c) a személyes határ (a fogadó készülékre — a lapon vagy a `keszulek hatar`-ral), de a koinó keretén túl nem
  const keret = (await koinomSzabalyai(kornyezet)).tudatpontKeret;
  const h = Number.isSafeInteger(hatar) && hatar >= 0 ? Math.min(hatar, keret) : atfolyasHatarAlap(keret);
  const r = await keretAtfolyasa(kornyezet, tarsKeszulek, { hatar: h });
  ki.merteke = r.merteke;
  ki.atadas = r.atadas;
  console.log('muveletek.sajatKeszulekTalalkozasa - VÉGE', { atvetelek: ki.atvetelek.length, merteke: ki.merteke, hatar: h });
  return ki;
}

/**
 * A keret ÁTVÉTELE: egy másik készülékem nekem szóló átadását a saját láncomba veszem — a kapottam az adótól a halmozott
 * összegre nő. A tanúsítványát mellékelem, ha az átadás nem hozza (a kapu az átadás aláírását is ellenőrzi).
 * @param {Object} kornyezet
 * @param {Object} atadas - az adó aláírt `KeretAtadas`-a
 * @returns {Promise<Object>} az aláírt `KeretAtvetel`
 */
export async function keretAtvetele(kornyezet, atadas) {
  console.log('muveletek.keretAtvetele - KEZDÉS', { atadas: atadas?.azonosito });
  if (atadas?.tipus !== 'KeretAtadas' || atadas.szerzo !== kornyezet.szerzo || atadas.adat?.entitas !== sajatLanc(kornyezet)) {
    throw new Error('Ez nem egy másik készülékednek nekem szóló keret-átadása.');
  }
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kornyezet.szerzo);
  if (!horgony) throw new Error('Ebben a koinóban nincs azonosság-szeleted (nem léptél be).');
  const ado = lancKulcsa(atadas);
  // ⭐ Előre ugyanaz az ítélet, amit a számítás mond majd (`keretAtvetelMerlege`) — egy nem számító átvételt nem írunk alá.
  const { allas, folytonos, alapok } = await sajatKiosztott(kornyezet, null);
  const elore = keretAtvetelMerlege({ tipus: 'KeretAtvetel', szerzo: kornyezet.szerzo, keszulek: sajatLanc(kornyezet),
    adat: { atadas } }, allas, folytonos, alapok);
  if (elore.elvetve) throw new Error('Az átvétel nem számítana: ' + elore.elvetve);
  const t = atadas.tanusitvany ? null : await tarTanusitvanya(kornyezet.tar, ado);
  const uj = await esemenytTeszek(kornyezet, 'KeretAtvetel', { atadas, ...(t ? { tanusitvanyok: [t] } : {}) },
    { entitas: horgony, kapottKulcs: ado });
  console.log('muveletek.keretAtvetele - VÉGE', { azonosito: uj.azonosito });
  return uj;
}

// ===================================
// A KOINO LÉTREHOZÁSA
// ===================================

/**
 * Létrehoz egy koinót. A Szakasz 1-ben a MINIMUMOT tartalmazza (név, leírás); a D25
 * további paraméterei (belépési szabály, hitelesítési küszöb) a bizalmi hálóval együtt
 * jönnek majd, és a D13/c szerint amúgy is entitássá válnak.
 *
 * A szelet-kulcsa `null` — vagyis a saját szeletét nyitja.
 *
 * @param {Object} kornyezet
 * @param {string} nev
 * @param {string} [leiras]
 */
export function koinoLetrehozasa(kornyezet, nev, leiras, alapitok, beallitas = {}) {
  // ⭐⭐ AZ ALAPÍTÓ KÖR — és miért nem elég egyetlen alapító.
  //
  // A 2. lépcsőhöz (pénztárca) három tanúsítás kell felhatalmazott tanúsítóktól. Egyetlen
  // alapító viszont csak EGYET tud adni, és új tanúsító sem születhetne, mert ahhoz `N`
  // felhatalmazás kellene 2. lépcsősöktől — akikből szintén csak egy van.
  // ⚠️ **A koino tehát születésétől befagyna.** Ezért nevezhet meg a létrehozás egy alapító
  // kört: ők a rekurzió ALAPESETE, nem kivétel.
  //
  // *(Ha nincs megadva, a lista üres, és csak a létrehozó alapító — a régi
  // koino-létrehozások így is érvényesek maradnak.)*
  return esemenytTeszek(kornyezet, 'KoinoLetrehozas', {
    nev,
    leiras: leiras || null,
    alapitok: Array.isArray(alapitok) ? [...alapitok] : [],
    // ⭐⭐ D89/2 (Csaba, 2026-10-02/03): ZÁRT vagy NYÍLT — a létrehozáskor dől el, és nem változtatható.
    // Alapból ZÁRT (a nyílthoz ki kell mondani). A zárt koinó tartalmát a készülék csak tagnak adja ki —
    // ⚠️ a betartatás az E-vel jön (a tag a kézfogásban bizonyítja magát); addig a mező ott van, de nem tilt.
    zart: beallitas.zart !== false,
    // ⭐ D93/5 (D28/3): a koinó kötelező profil-mezői (pl. ['nev', 'telepules']) — ha nincs, a koinó nem vár profilt.
    ...(Array.isArray(beallitas.profil) && beallitas.profil.length ? { profil: [...beallitas.profil] } : {}),
    // ⭐⭐ D118/2 (①b): a koinó SZABÁLYAI — MIND (a megadottak a mai értékek helyén), hogy egy későbbi program alapértéke ne
    // írhassa át őket; a kapu ellenőrzi (`koinoSzabalyok.js`). Nem változtatható: egy másik szabály egy másik koinó (a bekapcsolódás).
    szabalyok: teljesSzabalyok(beallitas.szabalyok),
    // ⭐⭐ D118 (②a): a GYERMEK születése a szülő nevét és a létrehozó tagsági bizonyítékát hozza (KZ2 — `koinoLanc.js`).
    ...(beallitas.szulo ? { szulo: beallitas.szulo, szuloTagsag: beallitas.szuloTagsag } : {}),
    // ⭐⭐ D119 (A): amit a létrehozó a születésével NEM hoz (KZ3 (A) — a koino-verzió kártyáira tett pontja: a szülő ügye).
    ...(beallitas.szulo && Array.isArray(beallitas.elhagy) && beallitas.elhagy.length ? { elhagy: [...beallitas.elhagy] } : {}),
    // ⭐⭐ D119 (①a): a koinó PROGRAMJA — a kód-csomag jegyzékének hivatkozása (`tar/kodCsomag.js`): a kód köti a koinót.
    ...(beallitas.program ? { program: { ...beallitas.program } } : {}),
    // ⭐⭐ D123 (PR1): a koinó MAGJA — a számítás magjának hivatkozása (`tar/kodCsomag.js` `magJegyzeke`): ez köti a koinót egy
    // számításhoz; a teljes program (`program`) csak tájékoztat (a felület, a protokoll, a helyi viselkedés szabadon változhat).
    ...(beallitas.mag ? { mag: { lenyomat: beallitas.mag.lenyomat, bajt: beallitas.mag.bajt } } : {})
  });
}

/**
 * ⭐⭐ D119 (①a): A KOINO-VERZIÓ — egy gyermek születése a SZÜLŐBEN (a `kornyezet` a szülőé). Egy legfelső szintű entitás
 * (`GondolatLetrehozas`, `tipus: 'KoinoVerzio'` — a kategória mintájára): a címe a gyermek neve, a szövege a leírása (külön
 * darab — D72), és magába ágyazza a gyermek aláírt születését (`szuletes`) — ebből tudja a szülő, hogy van gyermeke —, a
 * kódot pedig a születés programjával nevezi meg (`kod`). A kapu a beágyazott születést a szülő születésével ellenőrzi.
 * ⚠️ A pontot a hívó rendeli hozzá (D14: pont nélkül az entitás nem létezik — mint a gondolatnál).
 * @param {Object} kornyezet - a szülő koinó környezete
 * @param {{szuletes: Object, leiras?: string, kodBajt?: number}} adatok - a gyermek születése (a programmal); a `kodBajt` a
 *   kód-csomag teljes mérete (a jegyzék és a fájlok — a tárolási vállalás mértékébe, D26)
 */
export async function koinoVerzioLetrehozasa(kornyezet, { szuletes, leiras, kodBajt = 0 }) {
  if (!szuletes?.adat?.program) throw new Error('A koino-verzió a gyermek születését hozza, a programjával (a kód-csomaggal).');
  const entitas = {
    tipus: KOINO_VERZIO,
    cim: szuletes.adat.nev,
    szoveg: await szovegDarabbaTetele(kornyezet, leiras || null),
    szulo: null,
    gyermek: szuletes.azonosito,
    szuletes,
    kod: { ...szuletes.adat.program }
  };
  // ⭐ D26: a tárolási vállalás mértéke — a koino-verzió törzse a kód is.
  entitas.meret = kanonikusBajtok(entitas).length + (entitas.szoveg?.bajt ?? 0) + kodBajt;
  return esemenytTeszek(kornyezet, 'GondolatLetrehozas', entitas);
}

/**
 * ⭐⭐ D126 (NZ1 (A)): A NÉZET-KÁRTYA — a közösség egy feltöltött nézete (a D123 PR4-e). Egy legfelső szintű entitás
 * (`GondolatLetrehozas`, `tipus: 'Nezet'` — a koino-verzió kártya mintájára): a címe a nézet neve, a SZÖVEGE a leírás és EGY csatolt
 * HTML-fájl, a nézet kódja (`nezetKartya.js` `nezetSzovegBlokkjai`). ⭐ Így a mag nem változik: a kép a típust megőrzi, a szöveget
 * (és a benne csatolt fájlt) a mai szállítás viszi, a még nem frissített társak is (92. mérés (a)). A kód csak szerkesztési
 * egyezménnyel változhat (a szöveg módosítása).
 * ⚠️ A kód fájlja már a fájl-tárban kell legyen (a hívó tette oda) — a szöveg törzs-mérete így a kódot is mondja (D120). A pontot a
 * hívó rendeli hozzá (D14: pont nélkül nincs).
 * @param {Object} kornyezet
 * @param {{cim: string, leiras?: string|null, kod: {lenyomat: string, nev: string}}} adatok
 */
export async function nezetLetrehozasa(kornyezet, { cim, leiras = null, kod }) {
  if (typeof cim !== 'string' || !cim.trim()) throw new Error('Mi legyen a nézet neve (a kártya címe)?');
  const entitas = {
    tipus: NEZET_TIPUS,
    cim: cim.trim(),
    szoveg: await szovegDarabbaTetele(kornyezet, nezetSzovegBlokkjai({ leiras, kod })),
    szulo: null
  };
  // ⭐ D26: a tárolási vállalás mértéke — a nézet törzse a kódja is (a szöveg törzse: a darab és a csatolt fájl).
  entitas.meret = kanonikusBajtok(entitas).length + (entitas.szoveg?.torzs ?? entitas.szoveg?.bajt ?? 0);
  return esemenytTeszek(kornyezet, 'GondolatLetrehozas', entitas);
}

// ===================================
// A BELÉPÉS ÉS A MEGHÍVÁS — az 1. lépcső (D56)
// ===================================

/**
 * ⭐⭐ A KÖZÖS VÁZ: „állítok valamit VALAKI MÁSRÓL."
 *
 * A meghívás, a felhatalmazás és a tanúsítás **pontosan ugyanolyan alakú** — csak a
 * jelentésük más. Ezért egy helyen írjuk le, és ha az alak változik, egy helyen változik.
 *
 * Két dolog teszi ellenőrizhetővé, és mindkettő szándékos:
 *
 *   · `entitas` = a MÁSIK horgonya → az esemény az ő szeletébe kerül, tehát a „hányan
 *     állították ezt rólam?" kérdés **egyetlen szelet-lekérdezés** (3.2), akárhányan vagyunk;
 *   · `adat.sajatBelepes` = az ÉN horgonyom → aki ellenőrzi, **ne keresse** a láncomat,
 *     hanem egy lépéssel tovább tudjon menni visszafelé. *(A D42 mintája: ahol a tudás
 *     elfogy, ott az esemény hozza a bizonyítékát.)*
 *
 * ⚠️ A `kit` mező sem díszlet: enélkül egy idegen szeletébe tett esemény is beszámítana.
 * Az ellenőrzés összeveti a horgony szerzőjével.
 */
function allitokRola(kornyezet, tipus, { kit, horgonya, sajatBelepes, profil, felhatalmazasok, nyilatkozat }, beallitas = {}) {
  if (typeof kit !== 'string' || typeof horgonya !== 'string') {
    throw new Error('Kell a másik fél kulcsa és a horgonya.');
  }
  if (typeof sajatBelepes !== 'string') {
    throw new Error('Meg kell adni a SAJÁT horgonyodat is — enélkül a másik gép nem tudja '
      + 'ellenőrizni, hogy te magad jogosult vagy-e rá.');
  }
  // ⭐ D93/5: a meghívás megnevezheti a meghívott profiljának lenyomatát (a meghívó ezzel tanúsítja a nevet — D28/2).
  const adat = { kit, sajatBelepes, ...(tipus === 'Meghivas' && typeof profil === 'string' ? { profil } : {}),
    // ⭐ D122: a meghívó nyilatkozata (a meghívó kiállításakor: a meghívott valódi személy, és tudomása szerint még nem csatlakozott
    // ehhez a koinóhoz) — állítás, a számítás nem ellenőrzi; a visszacsatolásnak bizonyíték (D56).
    ...(tipus === 'Meghivas' && nyilatkozat === true ? { nyilatkozat: true } : {}),
    // ⛔ A TANÚSÍTÁS BEMONDÁSA (D47) — 2026-10-04-ig ITT ELVESZETT (a 9/c 4.5 óta csak `{ kit, sajatBelepes }` ment ki), így
    // egy nem alapító tanúsító kézi tanúsítása soha nem számított („nem mondta be, mire támaszkodott”). A D94 próbája találta.
    ...(tipus === 'Tanusitas' && Array.isArray(felhatalmazasok) ? { felhatalmazasok } : {}) };
  return esemenytTeszek(kornyezet, tipus, adat,
    { entitas: horgonya, horgonyozzunk: !!beallitas.horgonySzelet, ...beallitas });
}

/**
 * ⭐⭐ D93/5: A PROFIL (D28 a D88 alakjában) — a darab (a koinó kötelező mezői + egy véletlen só) a fájl-tárba kerül,
 * az esemény (a SAJÁT azonosság-szeletembe) csak a darab lenyomatát hordozza: só nélkül egy név kitalálható volna,
 * így nem. A törlés: a darabot senki nem szolgálja ki tovább (D88/2); az utolsó Profil számít (D28/3).
 * @param {Object} kornyezet - { tar, koino, kulcspar, darabTar }
 * @param {Object} mezok - pl. { nev, telepules }
 * @returns {Promise<Object>} a Profil esemény
 */
export async function profilMegadasa(kornyezet, mezok) {
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kornyezet.szerzo);
  if (!horgony) throw new Error('Előbb lépj be (belep) — a profil a saját azonosság-szeletedbe kerül.');
  if (!kornyezet.darabTar) throw new Error('A profil külön darab (D88) — ehhez darab-tár kell (darabTar).');
  const tiszta = {};
  for (const [k, v] of Object.entries(mezok ?? {})) if (/^[a-z]{1,32}$/.test(k) && typeof v === 'string') tiszta[k] = v.normalize('NFC');
  const so = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url');
  const bajtok = kanonikusBajtok({ mezok: tiszta, so });
  const { lenyomat } = await kornyezet.darabTar.ir(bajtok);
  return esemenytTeszek(kornyezet, 'Profil', { lenyomat }, { entitas: horgony });
}

/**
 * ⭐⭐ D93/2: A TAGSÁGI CSOMAG KIADÁSA — ha tag vagyok, a legrövidebb láncom eseményeinek másolata a SAJÁT
 * azonosság-szeletembe (a D85 T3 mintája). Ha már van ugyanilyen (vagy rövidebb) csomagom, nem írok újat.
 * @returns {Promise<{kiadva: boolean, ok: string, melyseg?: number, esemeny?: Object}>}
 */
/** ⭐ D94: a folyamat emléke — melyik tanúsítás-halmazt néztük már végig (koinó + horgony → az azonosítók). */
const LEPCSO_BEMONDAS_EMLEK = new Map();

/**
 * ⭐⭐ D94: A 2. LÉPCSŐ BEMONDÁSA — a 2. lépcsős a SAJÁT azonosság-szeletébe aláírva bemondja, mely tanúsításaira
 * támaszkodik (a D47 mintája: a tanúsító a felhatalmazásait mondja be). A szúrópróba CSAK ezt követi — a szeletbe
 * szórt állításokat nem. ⭐ Csak a TÉNYLEG érvényes tanúsítások kerülnek bele (tanúsítónként egy): a szúrópróba minden
 * bemondott tételt megkövetel. Ha a lista nem változott, nem ad ki újat; az alapítónak nem kell.
 * @returns {Promise<{kiadva: boolean, ok: string, esemeny?: Object}>}
 */
export async function lepcsoBemondasKiadasa(kornyezet) {
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kornyezet.szerzo);
  if (!horgony) return { kiadva: false, ok: 'nincs horgonyom (belep)' };
  if (await alapitoHorgony(kornyezet.tar, kornyezet.koino, horgony)) {
    return { kiadva: false, ok: 'alapító — a 2. lépcsőm a koinó létrehozásából következik' };
  }
  // ⚠️ Az őrjárat minden körben hív: ha a szeletemben lévő tanúsítások halmaza azóta nem változott, nem számolunk újra
  // (különben egy odaszórt hamis tanúsítás minden körben teljes újraszámolást váltana ki). Folyamatonkénti emlék.
  const sajatTanusitasok = (await entitasEsemenyei(kornyezet.tar, kornyezet.koino, horgony))
    .filter((e) => e.tipus === 'Tanusitas').map((e) => e.azonosito).sort().join(',');
  const emlekKulcs = kornyezet.koino + '|' + horgony;
  if (LEPCSO_BEMONDAS_EMLEK.get(emlekKulcs) === sajatTanusitasok) {
    return { kiadva: false, ok: 'a tanúsításaim nem változtak' };
  }
  const tanusitasok = await ervenyesTanusitasaim(kornyezet.tar, kornyezet.koino, horgony, ujIdentitasNezet());
  LEPCSO_BEMONDAS_EMLEK.set(emlekKulcs, sajatTanusitasok);
  if (!tanusitasok.length) return { kiadva: false, ok: 'még nincs elég érvényes tanúsításom' };
  const regi = (await entitasEsemenyei(kornyezet.tar, kornyezet.koino, horgony))
    .filter((e) => e.tipus === LEPCSO_BEMONDAS && e.szerzo === kornyezet.szerzo)
    .sort((a, b) => b.sorszam - a.sorszam)[0];
  const ugyanaz = regi && regi.adat.tanusitasok.length === tanusitasok.length
    && tanusitasok.every((t) => regi.adat.tanusitasok.includes(t));
  if (ugyanaz) return { kiadva: false, ok: 'már bemondtam (' + tanusitasok.length + ' tanúsítás)' };
  const esemeny = await esemenytTeszek(kornyezet, LEPCSO_BEMONDAS, { tanusitasok }, { entitas: horgony });
  return { kiadva: true, ok: 'bemondva (' + tanusitasok.length + ' tanúsítás)', esemeny };
}

/**
 * ⭐ D95/1: A LEZÁRÁSI ÖSSZEGZÉS KIADÁSA — a nagy szelet TELJES tartója (az önkéntes) adja ki egy lezárt döntésről; a
 * javaslat szeletébe kerül, és az érintetthez bejelentődik (`esemeny.js`). A tartalmát az összegző tartó a mintákkal
 * ellenőrzi — az aláírás csak azt mondja meg, ki adta ki.
 * @param {Object} kornyezet
 * @param {Object} osszegzes - `lezarasiOsszegzesEpitese` összegzése
 */
export function lezarasiOsszegzesKiadasa(kornyezet, osszegzes) {
  return esemenytTeszek(kornyezet, 'LezarasiOsszegzes', osszegzes, { entitas: osszegzes.javaslat });
}

/**
 * ⭐⭐ D130 (③a, KO7 (A), KO8 (A)): A DÖNTÉS TÖMÖR ALAKJÁNAK KIADÁSA — egy elfogadott általános egyezményről, aki a teljes bemenetét
 * tartja: a javaslat szeletébe kerül, és az érintettjeihez bejelentődik (`esemeny.js`). A tartalmát bárki ellenőrzi a mintákkal (a
 * helyek a saját lenyomatából — `koinonCsomag.js`) — az aláírás csak azt mondja meg, ki adta ki.
 * @param {Object} kornyezet
 * @param {Object} adat - `koinonOsszegzesAdata(csomag)` (`{ javaslat, reszek }`)
 */
export function koinonOsszegzesKiadasa(kornyezet, adat) {
  return esemenytTeszek(kornyezet, 'KoinonOsszegzes', adat, { entitas: adat.javaslat });
}

export async function tagsagiCsomagKiadasa(kornyezet) {
  const szerzo = kornyezet.szerzo;
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, szerzo);
  if (!horgony) return { kiadva: false, ok: 'nincs horgonyom (belep)' };
  const esemenyek = await tagsagiEsemenyekGyujtese(kornyezet.tar, kornyezet.koino, horgony);
  const idx = tagsagiIndex(esemenyek, kornyezet.koino);
  const r = horgonyTagsaga(idx, horgony);
  if (!r.igen) return { kiadva: false, ok: r.ok };
  if (r.melyseg === 0) {
    // ⭐ D118 (④b): a bekapcsolódott horgonya maga a bizonyíték (a bekapcsolódás — a tagsági kísérők viszik), az alapítóé a születés.
    return { kiadva: false, melyseg: 0, ok: idx.horgonyok.get(horgony)?.tipus === 'Bekapcsolodas'
      ? 'bekapcsolódott — a horgonyom maga a bizonyíték (a bekapcsolódásom)' : 'alapító — a láncom maga a koinó létrehozása' };
  }
  const lanc = tagsagiLanc(idx, horgony);
  // Van-e már legalább ilyen rövid csomagom (a meglévő csomag mélysége a saját láncából számítható)?
  for (const e of esemenyek) {
    if (e.tipus !== TAGSAGI_CSOMAG || e.szerzo !== szerzo || e.entitas !== horgony) continue;
    const m = horgonyTagsaga(tagsagiIndex(e.adat.lanc, kornyezet.koino), horgony);
    if (m.igen && m.melyseg <= r.melyseg) return { kiadva: false, ok: 'már van csomagom (' + m.melyseg + '. szint)', melyseg: m.melyseg };
  }
  // ⭐⭐ D128: a lánc eseményeinek (és a sajátomnak) a készülék-tanúsítványa is — a lánc egy eseménye nem mindig az írója
  // láncának első eseménye (pl. egy meghívó másik készülékről hív).
  const tanusitvanyok = [];
  for (const k of new Set([...lanc.filter((x) => !x.tanusitvany).map((x) => x.keszulek), sajatLanc(kornyezet)])) {
    const t = await tarTanusitvanya(kornyezet.tar, k);
    if (t) tanusitvanyok.push(t);
  }
  const esemeny = await esemenytTeszek(kornyezet, TAGSAGI_CSOMAG, { lanc, tanusitvanyok }, { entitas: horgony });
  return { kiadva: true, ok: 'kiadva (' + r.melyseg + '. szint, ' + lanc.length + ' esemény)', melyseg: r.melyseg, esemeny };
}

/**
 * ⭐ BELÉPÉS: megnyitom a SAJÁT azonosság-szeletemet ebben a koinóban.
 *
 * Ez még nem tagság — csak annyit mond: *„ide szeretnék tartozni."* A tagság ebből és a
 * kapott meghívásokból SZÁMÍTÓDIK (`allapot/identitas.js`), nem ez az esemény adja.
 *
 * ⭐ A szelet-kulcsa `null`, tehát a saját szeletét nyitja: a szelet neve maga az esemény
 * azonosítója lesz. **Ez a horgonyom** — erre mutatnak majd a rólam szóló események
 * (meghívás, később felhatalmazás és tanúsítás), és ettől lesz a „hányan hívtak be?”
 * kérdés EGYETLEN szelet-lekérdezés.
 *
 * ⚠️ MIÉRT ÜRES AZ `adat`? Mert a **D28** szerint a tagság ténye és a személyes adatok KÉT
 * KÜLÖN esemény: a `Belepes` a tagságé, a `Profil` a névé és a lakóhelyé. Így a tagság
 * bizonyítéka nem tartalmaz személyes adatot — különben a létszám ellenőrzése egyben a
 * névsor kiadása volna.
 *
 * @param {Object} kornyezet
 * @param {string} [alapitas] - ⭐ CSAK ALAPÍTÓKNAK: a koino-létrehozás eseményének
 *        azonosítója. Aki benne van a létrehozás `alapitok` listájában, ezzel mutatja meg,
 *        hogy oda tartozik — és ő a rekurzió alapesete, meghívás nélkül.
 */
export function belepes(kornyezet, alapitas) {
  const adat = typeof alapitas === 'string' ? { alapitas } : {};
  return esemenytTeszek(kornyezet, 'Belepes', adat);
}

/**
 * ⭐⭐ D127 (a bekapcsolódás: a szülőben megmaradsz): A BEKAPCSOLÓDÁS — a gyermekben; a saját szeletét nyitja (a horgonyom ott). A
 * szülőben nem írunk semmit (KÖ4 (A)): ott a teljes súlyommal megmaradok, és tovább dolgozhatok. ⚠️ A szülőbeli láncomat a
 * megnevezett (vágás előtti utolsó) eseménye után folytatja: a hívó gondoskodik róla, hogy a gyermek tárában a láncom vége az
 * legyen (az első kitöltés — `koino.js` `bekapcsolodasVegrehajtasa`); a kapu ellenőrzi.
 * @param {Object} adat - `{ szulo, lanc: { sorszam, azonosito }, szuloTagsag, elhagy? }`
 */
export function bekapcsolodas(kornyezet, adat) {
  return esemenytTeszek(kornyezet, 'Bekapcsolodas', adat, { entitas: null });
}

/**
 * ⭐ MEGHÍVÁS: behívok valakit a koinóba.
 *
 * Az esemény a MEGHÍVOTT szeletébe kerül (`entitas` = az ő horgonya), nem az enyémbe —
 * ettől lesz a „hányan hívták be X-et?” kérdés korlátos, akárhányan vagyunk.
 *
 * ⭐⭐ ÉS MAGÁVAL HOZZA A BIZONYÍTÉKÁT: az `adat.sajatBelepes` az ÉN horgonyomra mutat,
 * hogy aki ellenőrzi, ne KERESSE a láncomat, hanem egyetlen lépéssel tovább tudjon menni
 * visszafelé. Ugyanaz a minta, mint a D42 bemondott összegénél.
 *
 * ⚠️ A `kit` mező (a meghívott nyilvános kulcsa) sem díszlet: enélkül egy idegen szeletébe
 * tett meghívás is beszámítana. Az ellenőrzés összeveti a horgony szerzőjével.
 *
 * @param {Object} kornyezet
 * @param {Object} adatok
 * @param {string} adatok.kit - a meghívott nyilvános kulcsa
 * @param {string} adatok.horgonya - a meghívott `Belepes` eseményének azonosítója
 * @param {string} adatok.sajatBelepes - a SAJÁT horgonyom (alapítónál a koino-létrehozás)
 */
export function meghivas(kornyezet, adatok) {
  return allitokRola(kornyezet, 'Meghivas', adatok);
}

/**
 * ⭐ FELHATALMAZÁS: rábízom valakire a tanúsítást (D56, D60).
 *
 * ⭐⭐ **MEGBÍZÁS, NEM PONTSZÁM.** A felületen ez így jelenik meg: *„27-en bízták rá a
 * tanúsítást"* — soha nem *„becsületesség: 27"*. A különbség nem szépészeti: egy nyilvános
 * **jellem-szám** hírnév-rendszerré romlik (amit a D18/1 kizárt és a D49/b tilt), míg ez
 * **tény**, és nem az emberről szól, hanem arról, amit **mások tettek**.
 *
 * ⚠️ Csak **2. lépcsős** felhatalmazása számít, és **emberenként egy** — a számítás
 * (`identitas.js`) ezt érvényesíti, nem ez a művelet. *A zárt választótestület nélkül a
 * támadó hamis azonosságai egymást hatalmaznák fel.*
 *
 * @param {Object} kornyezet
 * @param {Object} adatok - { kit, horgonya, sajatBelepes }
 */
export function felhatalmazas(kornyezet, adatok) {
  return allitokRola(kornyezet, 'Felhatalmazas', adatok);
}

/**
 * ⭐ TANÚSÍTÁS: a 2. lépcső — ettől lesz valakinek pénztárcája (D11, D56).
 *
 * ⚠️ **EGYETLEN, EGYFORMA MONDAT** (D45): *„létező, külön ember"*. Akárhogy győződött meg
 * róla a tanú — ismeri, kérdezett másoktól, vagy igazolványt kért —, az esemény ugyanaz.
 * **Nem lehet ráírni, hogy „igazolvánnyal ellenőrizve"**, mert akkor elkerülhetetlen volna
 * a nyomás, hogy a fontos dolgokhoz csak az „erős" fajta számítson.
 *
 * @param {Object} kornyezet
 * @param {Object} adatok - { kit, horgonya, sajatBelepes }
 */
export async function tanusitas(kornyezet, adatok) {
  // ⭐⭐ A BEMONDÁS (D42-minta): a tanúsítás magával viszi, MIRE TÁMASZKODOTT — azoknak a
  // felhatalmazásoknak az azonosítóit, amik aláíráskor érvényben voltak.
  //
  // ⚠️ MIÉRT KELL? Mert a **visszavonás** (4.5) csak ELŐRE hat: aki elveszíti a megbízást,
  // az többet nem tanúsíthat, de a **már kiadott tanúsításai érvényben maradnak** (D47).
  // Globális óra nélkül ezt csak úgy lehet ellenőrizni, ha az esemény maga mondja meg, mi
  // volt igaz akkor — és az események soha nem tűnnek el, tehát a bemondás örökre
  // ellenőrizhető. *Enélkül néhány ember összebeszélve becsületes emberek tömegétől venné
  // el a pénztárcát.*
  const felhatalmazasok = adatok.felhatalmazasok
    ?? await sajatFelhatalmazasaim(kornyezet, adatok.sajatBelepes);

  // ⭐⭐ ÉS A HORGONY A SAJÁT SZELETEMBE (9/c 4.5, Csaba kérdése nyomán).
  //
  // A bemondás önmagában nem elég: aki elveszítette a megbízását, a RÉGI felhatalmazásokra
  // hivatkozva tovább tanúsíthatna. Ezért az esemény azt is elköti, **meddig láttam a
  // rólam szóló eseményeket** — és ha egy visszavonás ezen belülre esik, akkor
  // **bizonyíthatóan tudtam róla**, mégis aláírtam.
  //
  // ⚠️ Amit ez NEM zár le: aki szándékosan RÉGI horgonyt választ. ⭐ Azt a **buli** teszi
  // feltűnővé (D61): ha mindenki minden körben horgonyoz, az elavult horgony nem „gyanús",
  // hanem kilóg egy ritmusból, amit mindenki más tart.
  return allitokRola(kornyezet, 'Tanusitas', { ...adatok, felhatalmazasok },
    { horgonySzelet: adatok.sajatBelepes, horgonyDarab: TANUSITAS_HORGONY });
}

/**
 * ⭐⭐ BEMUTATKOZÁS: „találkoztunk" (9/c 4.6, D62).
 *
 * Olcsóbb és sűrűbb állítás, mint a tanúsítás: nem azt mondja, hogy *„létező, külön ember"*,
 * csak azt, hogy **találkoztunk**. Ettől a közösség társas hálója **láthatóvá** válik — és
 * ez az, ami a kontraszt-jelzést élessé teszi.
 *
 * ⭐⭐ MIÉRT KELL KÖLCSÖNÖSNEK LENNIE? Mert **egyoldalúan bárki bármit állíthat**: ha az én
 * puszta bejegyzésem számítana, a támadó **ingyen gyártana sűrűséget** — pont azt, amit a
 * jelzés keres. Ezért egy bemutatkozás csak akkor számít, ha **mindkét fél aláírta**.
 *
 * ⭐ ÉS A KÖLCSÖNÖSSÉG ELLENŐRZÉSÉHEZ NEM KELL ÚJ LEKÉRDEZÉS. Két meglévő kérdés metszete:
 *
 *     „ki állította, hogy találkozott velem?"  → az én SZELETEM (3.2)
 *     „kiről állítottam én ugyanezt?"          → a saját LÁNCOM
 *
 * ⚠️ EZ LÁNC-ESEMÉNY, NEM HELYI LISTA — *Csaba döntése (2026-09-06), a **D50** felülírása.*
 * A korábbi „ne legyen belőle társas térkép" aggály **nem Csabáé volt**, hanem Claude-é; a
 * **D55** (nyíltság) óta a bemutatkozás vállalt dolog. ⭐ És a szeletelés (Szakasz 3) miatt
 * a lépték sem esik el: fejenként pár száz esemény a SAJÁT szeletben, és senki nem tárolja
 * az egészet — csak azt kéred le, akire ránézel.
 *
 * @param {Object} kornyezet
 * @param {Object} adatok - { kit, horgonya, sajatBelepes }
 */
export function bemutatkozas(kornyezet, adatok) {
  return allitokRola(kornyezet, 'Bemutatkozas', adatok);
}

/**
 * ⭐⭐ „ESZERINT LÁTOK" — a buli-elismerés (D61, Csaba ötlete).
 *
 * A bulikörben mindenki aláírja, **meddig lát** a saját szeletében: a `latott` mezőbe a
 * rólam szóló legfrissebb események kerülnek (felhatalmazások, visszavonások, tanúsítások).
 *
 * ⭐⭐⭐ MIÉRT EZ ZÁRJA BE A RÉST? Mert a **saját láncomban VAN sorrend** (a `sorszam`, amit
 * csak én írhatok). Ha egyszer aláírtam, hogy egy visszavonást láttam, akkor minden KÉSŐBBI
 * saját eseményem — a lánc sorszáma szerint — **bizonyíthatóan azután** keletkezett. Nincs
 * szükség globális órára: elég a saját láncom rendje.
 *
 * ⚠️ ÉS EZ NEM KÜLSŐ IGAZSÁG, HANEM SAJÁT ÁLLÍTÁS. Senki nem kényszerít rám semmit: én
 * mondom meg, meddig látok. Aki offline volt, nem ír alá semmit — rá nem vonatkozik, és nem
 * is büntetjük érte (D19). ⭐ Aki viszont SOHA nem ír alá ilyet, miközben mindenki más
 * minden körben igen, az **kilóg a ritmusból** — és azt a jelzés mutatja meg, nem a szabály.
 *
 * @param {Object} kornyezet
 * @param {string} sajatBelepes - a saját horgonyom
 */
export function lattam(kornyezet, sajatBelepes) {
  if (typeof sajatBelepes !== 'string') {
    throw new Error('Az elismeréshez meg kell adni a saját horgonyodat.');
  }
  return esemenytTeszek(kornyezet, 'Lattam', {}, {
    entitas: sajatBelepes,
    horgonyozzunk: true,
    horgonySzelet: sajatBelepes,
    horgonyDarab: ELISMERES_HORGONY
  });
}

/**
 * ⭐ VISSZAVONOM A FELHATALMAZÁST (9/c 4.5).
 *
 * A felhatalmazás **az enyém**: én adtam, én veszem vissza — egyoldalúan, indoklás nélkül.
 * ⚠️ A tanúsítás NEM ilyen: az állítás a múltról, azt nem lehet visszavonni (D46) — mert
 * ha lehetne, néhány ember összebeszélve bárkit kiléptethetne utólag.
 *
 * ⭐ A számítás „az utolsó nyer" mintát követi (mint a tudatpont): ha a legutóbbi
 * állításom róla visszavonás, akkor nincs érvényben a felhatalmazásom.
 *
 * @param {Object} kornyezet
 * @param {Object} adatok - { kit, horgonya, sajatBelepes }
 */
export function felhatalmazasVisszavonasa(kornyezet, adatok) {
  return allitokRola(kornyezet, 'FelhatalmazasVisszavonasa', adatok);
}

/**
 * A saját, ÉRVÉNYBEN LÉVŐ felhatalmazásaim azonosítói — a tanúsítás bemondásához.
 *
 * ⚠️ „Az utolsó nyer": akinek a legutóbbi állítása rólam visszavonás, azt kihagyjuk.
 * Ugyanaz a szabály, amit az `identitas.js` alkalmaz az ellenőrzéskor — és azért itt is
 * leírjuk, mert a kettőnek egyeznie kell, különben a saját eseményünk mondana ellent
 * önmagának (a D42 tanulsága).
 */
async function sajatFelhatalmazasaim(kornyezet, sajatBelepes) {
  if (typeof sajatBelepes !== 'string') return [];
  const szelet = await entitasEsemenyei(kornyezet.tar, kornyezet.koino, sajatBelepes);

  const utolso = new Map();   // felhatalmazó → { sorszam, azonosito, vissza }
  for (const e of szelet) {
    if (e.tipus !== 'Felhatalmazas' && e.tipus !== 'FelhatalmazasVisszavonasa') continue;
    if (e.adat?.kit !== kornyezet.szerzo) continue;
    const sorszam = e.entitasSorszam ?? 1;
    const eddigi = utolso.get(e.szerzo);
    if (!eddigi || sorszam >= eddigi.sorszam) {
      utolso.set(e.szerzo, {
        sorszam,
        azonosito: e.azonosito,
        esemeny: e,
        vissza: e.tipus === 'FelhatalmazasVisszavonasa'
      });
    }
  }

  const azonositok = [];
  // ⭐ D94: csak az a felhatalmazás kerül a bemondásba, akinek a felhatalmazója 2. LÉPCSŐS (ellenőrizve) — a szúrópróba
  // minden bemondott tételt megkövetel, és a szeletembe bárki tehet felhatalmazást.
  const nezet = ujIdentitasNezet();
  for (const [, allapot] of utolso) {
    if (allapot.vissza) continue;
    const ado = allapot.esemeny.adat?.sajatBelepes;
    if (typeof ado === 'string' && (await lepcso2E(kornyezet.tar, kornyezet.koino, ado, nezet)).igen) {
      azonositok.push(allapot.azonosito);
    }
  }
  return azonositok;
}

// ===================================
// GONDOLAT LÉTREHOZÁSA
// ===================================

/**
 * Új gondolatot hoz létre.
 *
 * A MÉRET (D26) itt születik meg: a gondolat kanonikus alakjának bájthossza. Ez az az
 * adat, ami a hivatkozásban utazik majd — hogy aki tudatpontot akar rá tenni, előre
 * tudja, mekkora tárolást vállal.
 *
 * ⭐ A szelet-kulcsa `null`: a gondolat MAGA hozza létre a szeletét, és a szelet neve az
 * esemény azonosítója lesz. (A saját azonosítót nem lehetne a mezőbe írni — önmagára
 * hivatkozna —, ezért mondja ki a `szelet()` szabály, hogy a `null` ezt jelenti.)
 *
 * ⭐ BESOROLÁS (5.4): a gondolat megkaphat EGY gondolattípust és LEGFELJEBB HÁROM
 * kategóriát. Mindkettő önálló entitásra mutató azonosító — a korlátot a `szabalyok.js`
 * érvényesíti, nem ez a függvény. *A művelet-réteg kényelmet ad, a szabály-réteg véd.*
 *
 * @param {Object} kornyezet
 * @param {Object} adatok - { cim, szoveg, szulo, gondolatTipus, kategoriak }
 */
export async function gondolatLetrehozasa(
  kornyezet, { cim, szoveg, szulo, gondolatTipus, kategoriak }
) {
  const gondolat = {
    tipus: 'Gondolat',
    cim,
    // ⭐ D72: a szöveg KÜLÖN DARAB — az esemény csak a hivatkozást hordozza (szovegDarab.js).
    szoveg: await szovegDarabbaTetele(kornyezet, szoveg || null),
    szulo: szulo || null,
    gondolatTipus: gondolatTipus || null,
    kategoriak: Array.isArray(kategoriak) ? kategoriak : []
  };

  // A méret a gondolat SAJÁT adatára vonatkozik (a burkolat és az aláírás nélkül) — ⭐ D72: a
  // külön darab is beleszámít, mert a tartó azt is tárolja (D26: a tárolási vállalás mértéke).
  gondolat.meret = kanonikusBajtok(gondolat).length + (gondolat.szoveg?.bajt ?? 0);

  return esemenytTeszek(kornyezet, 'GondolatLetrehozas', gondolat);
}

// ===================================
// KATEGÓRIA ÉS GONDOLATTÍPUS (Szakasz 5.4)
// ===================================
//
// ⭐⭐ EZ A KÉT TÍPUS 2026-09-06-IG NEM LÉTEZETT A KOINÓBAN — a végpont-térkép találata
// volt (`docs/szakasz5_terv.md` 7. szakasz, 2. pont): a prototípus tíz végpontja mögött
// nem volt esemény. A domain-fogalom viszont mindig is megvolt: *„a kategóriák és a
// gondolattípusok rendszerezik a gondolatokat."*
//
// ⚠️ MIÉRT NINCS ÚJ ESEMÉNY-FAJTA? Mert a `GondolatLetrehozas` az ÁLTALÁNOS entitás-
// létrehozás, és az `adat.tipus` különbözteti meg a fajtákat — ez a szerkezet a Szakasz 1
// óta így van (`allapotSzamitas.js`: `adat.tipus ?? 'Gondolat'`). Új esemény-név
// bevezetése minden meglévő tárat érvénytelenítene, cserébe semmit nem adna.
//
// ⭐ ÉS MIÉRT ÖNÁLLÓ ENTITÁS, NEM MEZŐ? Mert így ugyanaz jár nekik, mint bármely más
// entitásnak: tudatpont, javaslat, küszöbök, egyezmény. Egy kategória neve is
// **közösségi döntéssel** változik — nem egy mező átírásával.

/**
 * A közös váz: kategória és gondolattípus ugyanaz, csak a `tipus` más.
 *
 * ⚠️ A NÉV a `cim` mezőbe kerül. Ez szándékos: a koinóban MINDEN entitásnak `cim`-e van,
 * és így az állapot-számítás, a rendezés, a keresés és az egyezmény-végrehajtás
 * változtatás nélkül működik rajtuk. A prototípus kártyái `nev`-et olvasnak — azt a
 * felület fordítja (`felulet/js/kartyaAdat.js`).
 */
async function besorolasLetrehozasa(kornyezet, tipus, { nev, leiras, ikon, szulo }) {
  const entitas = {
    tipus,
    cim: nev,
    // ⭐ D72: a leírás is szöveg — külön darab, ahogy a gondolaté.
    szoveg: await szovegDarabbaTetele(kornyezet, leiras || null),
    szulo: szulo || null,
    // ⭐ Az ikon lehet EMOJI vagy URL — az örökölt kártya mindkettőt kezeli (URL-nél képet
    // rak ki, egyébként szöveget). Emojival tehát nem kell hozzá feltöltés, ami a P2P-ben
    // amúgy sincs megoldva (D3).
    ikon: ikon || null
  };

  entitas.meret = kanonikusBajtok(entitas).length + (entitas.szoveg?.bajt ?? 0);
  return esemenytTeszek(kornyezet, 'GondolatLetrehozas', entitas);
}

/**
 * Új kategória.
 * @param {Object} adatok - { nev, leiras, ikon, szulo }
 */
export function kategoriaLetrehozasa(kornyezet, adatok) {
  return besorolasLetrehozasa(kornyezet, 'Kategoria', adatok);
}

/**
 * Új gondolattípus (kérdés, válasz, témakör, ismeret, feladat…).
 * @param {Object} adatok - { nev, leiras, ikon, szulo }
 */
export function gondolatTipusLetrehozasa(kornyezet, adatok) {
  return besorolasLetrehozasa(kornyezet, 'GondolatTipus', adatok);
}

// ===================================
// TUDATPONT-RENDEZÉS
// ===================================

/**
 * Tudatpontot rendel egy entitáshoz (vagy átrendezi/elveszi).
 *
 * ⭐ A D42 ITT ÉL: az esemény magával viszi az `adat.kiosztva` mezőt — mennyi tudatpontom
 * van ÖSSZESEN kiosztva ezen esemény után. Ettől a keret EGYETLEN eseményből ellenőrizhető
 * (`kiosztva <= 10 000`), nem kell hozzá a lánc többi része.
 *
 * ⭐⭐ ÉS A CSALÁS BIZONYÍTÉKA POZITÍVVÁ VÁLIK. Aki elhallgat egy pont-eseményt, annak a
 * bemondott összege sem stimmel — és akkor KÉT SAJÁT ALÁÍRT ÁLLÍTÁSA mond ellent egymásnak.
 * Ma a bizonyíték egy HIÁNY (kétértelmű: támadás vagy lemaradás?), és nem átadható. A
 * bemondott összeggel a bizonyíték átadható: odaadom a két eseményt, bárki ellenőrzi.
 *
 * @param {Object} kornyezet
 * @param {string} entitas - az entitás azonosítója
 * @param {number} pont - egész szám; 0 = elveszem a pontomat (és ezzel a vállalást is)
 * @param {string} [szerep] - 'aktiv' (alap) vagy 'passziv' (figyelő, nem szavaz)
 * @param {number} [_marKiosztott] - ⚠️ ELAVULT: már nem használjuk, a saját láncból
 *        számoljuk (különben a bemondott összeg elcsúszhatna attól, amit az ellenőrző
 *        kiszámol). A paraméter csak a régi hívások kedvéért maradt meg.
 */
export async function tudatpontRendezese(kornyezet, entitas, pont, szerep = 'aktiv', _marKiosztott,
                                         beallitas = {}) {
  if (!Number.isInteger(pont) || pont < 0) {
    throw new Error('A tudatpont csak egész szám lehet, és nem lehet negatív.');
  }
  // ⭐⭐ D129 (②b): a kézikönyv-entitásra (vagy egy kézikönyv-javaslatra — a hívó adja) tett pont a nevét is viszi
  const nevek = Array.isArray(beallitas.rendszer) ? beallitas.rendszer : rendszerNevekKornyezetbol(kornyezet, [entitas]);

  // ⭐ D70: az adat FÜGGVÉNY — ha közben más folyamat írt a láncunkba, az `esemenytTeszek` a
  // friss láncból újraszámolja a bemondott összeget, mielőtt újra aláírna.
  const adat = async () => {
    // A tudatpont ÁTRENDEZHETŐ: ami ezen az entitáson már ott van, az nem „új" kiadás.
    // ⭐ D118/2: a koinó kerete — ⭐⭐ D128 (9.9): a készülékemé (az alap + a kapott).
    const { osszeg, regi, keret } = await sajatKiosztott(kornyezet, entitas);
    const kiosztva = osszeg - regi + pont;

    if (kiosztva > keret) {
      throw new Error(
        'Ennyi tudatpontod nincs. Kereted ' + keret +
        ', ebből máshol ' + (osszeg - regi) + ' van kiosztva.'
      );
    }
    return { entitas, pont, szerep, kiosztva, ...nevMezo(nevek) };
  };

  return esemenytTeszek(
    kornyezet,
    'TudatpontRendezes',
    adat,
    // a tudatpont mozgatja a részvételi arányt → a határidőt is. ⭐ D85: a javaslattevő pontja a
    // javaslat időbélyegét viseli (`beallitas.ido`), hogy a támogató szavazata ELŐTT számítson.
    { entitas, horgonyozzunk: true, ...(beallitas.ido !== undefined ? { ido: beallitas.ido } : {}) }
  );
}


// ===================================
// ⭐⭐⭐ ÁLLÁSFOGLALÁS — az ÁLTALÁNOS egyezmény ÉLŐ marad (D27)
// ===================================
//
// *„A TÉNY örök (ez az egyezmény akkor, ott, érvényesen megszületett), a HATÁLY viszont
// él: hányan állnak mögötte MOST."*
//
// ⭐ HÁROM MŰVELET, EGY ALAK — ugyanaz az érv, mint a `meghivas`/`felhatalmazas`/`tanusitas`
// hármasnál: közös váz, más jelentés. Ha az alak változik, egy helyen változik.
//
//   · **csatlakozik** — *„én is egyetértek ezzel"*, akár jóval a döntés után;
//   · **tiltakozik** — *„én már nem"*: a támogatás visszavonása, ellenkezés;
//   · **utkozik**    — *„ez a kettő ellentmond egymásnak"* (ilyenkor kell a `masik`).
//
// ⭐⭐ ÉS „AZ UTOLSÓ NYER", e-emberenként: aki csatlakozott, majd tiltakozik, annál a
// tiltakozás számít. *Ettől lesz a hatály élő — külön visszavonás-mechanizmus nélkül*,
// ugyanúgy, ahogy a tudatpontnál.
//
// ⛔ ÉS SEMMI AUTOMATIKUS NEM KÖVETKEZIK BELŐLE (D27/6): sem a tiltakozók többsége, sem az
// ütközés nem érvénytelenít semmit. A rendszer **bejelent, nem bíráskodik** (D19) — a vita
// helye az egyezmény alatti gyerek-gondolatokban van.
//
// ⚠️ A JOGOSULTSÁGOT a `szabalyok.js` őrzi: állást az foglalhat, akinek tudatpontja van
// azon az entitáson, ami alatt az egyezmény áll — vagy annak bármely leszármazottján
// (D27/4). *A hely határozza meg a hatókört.*

// ⚠️⚠️ ITT KORÁBBAN EGY MÁSODIK DEFINÍCIÓ ÁLLT (javítva 2026-09-10). A komment azt
// állította, hogy „a `szabalyok.js` is innen veszi" — a `szabalyok.js`-ben pedig ugyanez a
// mondat állt fordítva. **Két lista, két komment, egyik sem igaz.** A szabályt a SZÁMÍTÁS
// őrzi, ezért a forrás is ott van; ez a fájl onnan importálja, és tovább is adja, hogy a
// hívóknak (`koino.js`) ne kelljen két helyről szedniük.
export { ALLASOK };

/**
 * Állást foglal egy általános egyezményről.
 *
 * @param {Object} kornyezet
 * @param {string} egyezmeny - az egyezmény (= a javaslat) azonosítója
 * @param {string} allas - 'csatlakozik' | 'tiltakozik' | 'utkozik'
 * @param {Object} [beallitas] - { masik, indoklas }
 */
export async function allasfoglalas(kornyezet, egyezmeny, allas, beallitas = {}) {
  if (!ALLASOK.includes(allas)) {
    throw new Error('Érvénytelen állás: ' + allas + ' (csatlakozik | tiltakozik | utkozik)');
  }
  const { masik = null, indoklas = null } = beallitas;
  if (allas === 'utkozik' && typeof masik !== 'string') {
    throw new Error('Az ütközés-jelöléshez meg kell nevezni a MÁSIK egyezményt.');
  }

  const esemeny = await esemenyLekerese(kornyezet.tar, egyezmeny);
  if (!esemeny) throw new Error('Nem ismerem ezt az egyezményt: ' + egyezmeny);

  // ⭐ A szelet-kulcs maga az egyezmény: az állásfoglalások oda kerülnek, ahol az
  // egyezmény és a döntés többi bemenete van.
  return esemenytTeszek(
    kornyezet, 'Allasfoglalas',
    { egyezmeny, allas, masik: allas === 'utkozik' ? masik : null, indoklas },
    { entitas: egyezmeny, horgonyozzunk: true }
  );
}

// ===================================
// ÉRTÉK JAVASLAT (küszöbök)
// ===================================

/**
 * Küszöbértékeket javasol egy entitáshoz. Az érvényes küszöb a tulajdonosok
 * javaslatainak MEDIÁNJA (D4) — tehát ez nem parancs, hanem szavazat a küszöbről.
 *
 * Horgonyzunk: az érték javaslat a MIN/MAX döntési időt is átírhatja, tehát mozgatja a
 * határidőt.
 *
 * @param {Object} kornyezet
 * @param {string} entitas
 * @param {Object} ertekek - { elfogadasiKuszob, reszveteliKuszob, minimumDontesiIdo, maximumDontesiIdo }
 */
export function ertekJavaslat(kornyezet, entitas, ertekek) {
  return esemenytTeszek(
    kornyezet, 'ErtekJavaslat', { entitas, ertekek, ...nevMezo(rendszerNevekKornyezetbol(kornyezet, [entitas])) },
    { entitas, horgonyozzunk: true }
  );
}

// ===================================
// ⭐⭐ D129 (②b): A KÉZIKÖNYV-NEVEK AZ ESEMÉNYEKEN
// ===================================
//
// A pont nélkül megmaradó közösségi módosítás (MA4 (B)) csak akkor számolható újra, ha a DÖNTÉS minden eseménye megmarad — ezért
// mind a kézikönyv szeletébe kerül (`esemeny.js` `bejelentesHelyei`): ehhez a kézikönyv-entitásra mutató esemény a nevét viszi
// (`adat.rendszer`). A neveket a környezet adja (`kornyezet.rendszerNevei` — a `koino.js` az alap-tartalomból és a parancssorban
// megnevezettekből); a javaslatból eredőket (a szavazat, a javaslatra tett pont) a javaslat eseménye.

/**
 * Az entitások kézikönyv-nevei a környezettől (ha nincs ilyen szolgáltatás — a próbák egy része —, üres).
 * @param {Object} kornyezet
 * @param {Array<string|null|undefined>} azonositok
 * @returns {Array<string>} rendezve, ismétlés nélkül, legfeljebb `ESEMENY_NEV_KORLAT`
 */
function rendszerNevekKornyezetbol(kornyezet, azonositok) {
  const f = kornyezet?.rendszerNevei;
  if (typeof f !== 'function') return [];
  const nevek = f(azonositok.filter((x) => typeof x === 'string'));
  return [...new Set(Array.isArray(nevek) ? nevek : [])].sort().slice(0, ESEMENY_NEV_KORLAT);
}

/** Az adat `rendszer` mezője (csak ha van név). */
function nevMezo(nevek) {
  return nevek.length ? { rendszer: nevek } : {};
}

// ===================================
// JAVASLAT
// ===================================

/**
 * ⭐ D85/5: a kezdő pont szétosztása a töredékek között — a prototípus
 * `elosztottTudatpontokKiszamitasa`-ja szerint: mindegyik kap 1-et, a maradék körbe jár.
 *
 * @param {number} osszes - a kezdő pont (legalább annyi, ahány töredék)
 * @param {number} darab - a töredékek száma
 * @returns {Array<number>}
 */
export function kezdoPontokElosztasa(osszes, darab) {
  if (osszes < darab) {
    throw new Error('A kezdő pont kevesebb, mint a töredékek száma (' + osszes + ' < ' + darab
      + ') — minden töredékre legalább 1 kell.');
  }
  const elosztas = new Array(darab).fill(1);
  let maradek = osszes - darab;
  for (let i = 0; maradek > 0; i = (i + 1) % darab, maradek--) elosztas[i]++;
  return elosztas;
}

/**
 * Javaslatot tesz. A `fajta` dönti el, mi történik elfogadáskor (D27):
 *   'szerkesztesi' → a koino végrehajtja a változást
 *   'altalanos'    → nem történik semmi automatikusan; az egyezmény MAGA az álláspont
 *
 * A szelet-kulcs az ELSŐ érintett entitás — így a javaslat és a rá adott szavazatok
 * ugyanabban a szeletben lesznek, mint a döntés többi bemenete (tudatpontok, érték
 * javaslatok).
 *
 * ===== ⭐⭐ TÖBB ÉRINTETT, ENTITÁSONKÉNTI MŰVELETTEL (2026-09-07) =====
 *
 * A prototípus `erintettEntitasok`-ja **tömb**, és minden eleme **saját műveletet** hordoz
 * (`javaslat.js`). Ez teszi lehetővé az **egyesítést** (két forrás, egy eredmény) és a
 * `Csomag` javaslatot (vegyes műveletek egy döntésben). A koino ezt most átveszi.
 *
 * ⚠️ A RÉGI HÍVÁSI ALAK IS MŰKÖDIK (`{ erintett, muvelet, valtozas }`) — egy elemű listává
 * alakul. Nem kényelemből: a **régi események** is ilyenek, és azokat nem lehet újraírni
 * (az aláírás a régi bájtokra szól). Ha a hívó alakja eltérne az esemény alakjától, a kettő
 * előbb-utóbb szétcsúszna.
 *
 * ===== ⭐⭐ D85 (Csaba, 2026-10-02): LÉTREHOZÁS → PONT A JAVASLATRA → SZAVAZAT, EGY LÉPÉSBEN =====
 *
 * A javaslat is entitás (D14: pont nélkül nem létezik), és a szavazati jog a javaslaton tett pontot
 * is kívánja (D85/2) — ezért a kezdő pont a művelet része, nem a hívóé (2026-10-02-ig az öt hívó
 * mind külön tette fel, a szavazat UTÁN). Egy érintettnél a javaslatra kerül; többnél a TÖREDÉKEKRE
 * oszlik (D85/5), a prototípus szerint: mindegyikre legalább 1, a maradék körbe.
 *
 * @param {Object} kornyezet
 * @param {Object} adatok - { erintettek: [{entitas, muvelet, valtozas}], indoklas, fajta, pont }
 *        vagy a RÉGI alak: { erintett, muvelet, valtozas, indoklas, fajta, pont }
 *        — a `pont` a kezdő tudatpont (alapból töredékenként 1); több érintettnél ennyi oszlik szét
 */
// ===================================
// ⭐⭐ D128 (①d — KU7 (A), 9.10): A KÉSZÜLÉK KIZÁRÁSA ÉS AZ ÖRÖKÖS
// ===================================

/**
 * A kizárás BEVITELE ebbe a koinóba: a tanúsítványát (az azonosság kulcsa írta alá) egy `Kizaras` esemény hozza, a kizárt
 * azonosságának szeletébe. ⭐ Bárki beviheti, akihez eljutott (mint az ellentmondás bizonyítékát — D80); a felsorolt koinókba az
 * örökös hozza, a folytatás előtt.
 * @param {Object} kornyezet
 * @param {Object} kizaras - a kizárás-tanúsítvány (`kulcs/keszulek.js` `kizarasKeszitese`)
 * @returns {Promise<Object>} a `Kizaras` esemény
 */
export async function kizarasBevitele(kornyezet, kizaras) {
  console.log('muveletek.kizarasBevitele - KEZDÉS', { keszulek: kizaras?.keszulek?.slice(0, 8) });
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kizaras?.azonossag);
  if (!horgony) {
    throw new Error('A kizárt azonosságnak nincs azonosság-szelete ebben a koinóban — a kizárás nem helyezhető el (D80).');
  }
  return esemenytTeszek(kornyezet, 'Kizaras', { kizaras }, { entitas: horgony });
}

// ===================================
// ⭐⭐ D128 (②e1 — 17. pont, 9.13): A HELYREÁLLÍTÁS A SEGÍTŐKKEL
// ===================================

/**
 * A HELYREÁLLÍTÁS JÓVÁHAGYÁSA (egy segítőé) — állítás a helyreállítandóról: az ő szeletébe kerül (`kit` = ő, `sajatBelepes` = az
 * én horgonyom — mint a meghívás és a tanúsítás), a javaslattal és a fázissal. A szerepeket és a szabályt a számítás nézi
 * (`allapot/helyreallitas.js`); itt csak az alak és az, hogy magamat nem hagyhatom jóvá.
 * @param {Object} kornyezet
 * @param {{kit: string, horgonya: string, sajatBelepes: string}} adatok - a helyreállítandó (a neve és a horgonya), és az én horgonyom
 * @param {Object} javaslat - `kulcs/azonossag.js` `helyreallitasJavaslatAlakiHibaja` szerinti alak
 * @param {'kezdes'|'veglegesites'|'visszavonas'} [fazis]
 * @returns {Promise<Object>} a `HelyreallitasJovahagyas` esemény
 */
export async function helyreallitasJovahagyasa(kornyezet, { kit, horgonya, sajatBelepes }, javaslat, fazis = 'kezdes') {
  console.log('muveletek.helyreallitasJovahagyasa - KEZDÉS', { fazis });
  const h = helyreallitasJavaslatAlakiHibaja(javaslat);
  if (h) throw new Error('A helyreállítás javaslata hibás: ' + h);
  if (!HELYREALLITAS_FAZISOK.has(fazis)) throw new Error('A fázis: kezdes, veglegesites vagy visszavonas.');
  if (!azonositoAlaku(kit) || !azonositoAlaku(horgonya)) throw new Error('Kell a helyreállítandó neve és a horgonya.');
  if (kit === kornyezet.szerzo) throw new Error('A saját helyreállításodat nem hagyhatod jóvá — ehhez segítők kellenek.');
  if (!azonositoAlaku(sajatBelepes)) throw new Error('Előbb neked is be kell lépned ebbe a koinóba (a horgonyod kell).');
  return esemenytTeszek(kornyezet, 'HelyreallitasJovahagyas', { kit, sajatBelepes, javaslat, fazis }, { entitas: horgonya });
}

/**
 * A HELYREÁLLÍTÁS MEGÁLLÍTÁSA — az azonosság egy meglévő készülékéről, a saját szeletébe: „ezt nem én kértem”. Az 1. kört
 * érvényteleníti (a 2. kör — 5 segítő, kétszeres várakozás — nem állítható meg).
 * @param {Object} kornyezet
 * @param {string} jel - a javaslat jele (`helyreallitasJele`)
 * @returns {Promise<Object>} a `HelyreallitasMegallitas` esemény
 */
export async function helyreallitasMegallitasa(kornyezet, jel) {
  console.log('muveletek.helyreallitasMegallitasa - KEZDÉS');
  if (!azonositoAlaku(jel)) throw new Error('Melyik helyreállítást? (a javaslat jele — 43 jel)');
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, kornyezet.szerzo);
  if (!horgony) throw new Error('Ebben a koinóban nincs azonosság-szeleted — itt nincs mit megállítani.');
  return esemenytTeszek(kornyezet, 'HelyreallitasMegallitas', { javaslat: jel }, { entitas: horgony });
}

/** Egy nap ezredmásodpercben (a helyreállítás várakozása napokban áll). */
const NAP_MS = 86400 * 1000;

/**
 * ⭐⭐ D128 (②e3 — 17. pont, Csaba: „a segítők EGYSZER cselekszenek”): A SEGÍTŐ KÉSZÜLÉKÉNEK GONDOZÁSA ebben a koinóban — minden
 * helyreállításnál, amit az azonosságom jóváhagyott (és nem vont vissza, nem véglegesített):
 *   · ha a SAJÁT ÓRÁM szerint letelt a várakozás (a kezdésemtől — az út és a kör szerinti napok), és nem jött megállítás (és a 2.
 *     körnél az 1. meg van állítva), VÉGLEGESÍT;
 *   · ha a helyreállítás így (vagy már korábban) TELJES, és a koinóban még nincs bent: a láncot (a tárból — a javaslat helyéig) a
 *     helyreállítás bejegyzésével és a BIZONYÍTÉKOKKAL egy `Kulcscsere` eseményben beviszi (bárki beviheti — önmagát igazolja).
 * ⭐ Idő nélkül dönt a koinó (D17) — a várakozást itt, a segítő készülékén mérjük.
 * @param {Object} kornyezet
 * @param {{most?: number}} [beallitas] - a „most” (a próbáknak)
 * @returns {Promise<{veglegesitettek: Array<string>, bevittek: Array<string>}>} a javaslatok jelei
 */
export async function helyreallitasokGondozasa(kornyezet, { most = Date.now() } = {}) {
  const { tar, koino, szerzo } = kornyezet;
  const sajatok = (await azonossagEsemenyei(tar, szerzo))
    .filter((e) => e.tipus === JOVAHAGYAS && esemenyKoinoja(e) === koino && typeof e.entitas === 'string');
  const ki = { veglegesitettek: [], bevittek: [] };
  if (!sajatok.length) return ki;
  console.log('muveletek.helyreallitasokGondozasa - KEZDÉS', { jovahagyasaim: sajatok.length });
  // Horgonyonként, javaslatonként a fázisaim.
  const csoportok = new Map();
  for (const e of sajatok) {
    const jel = await helyreallitasJele(e.adat.javaslat);
    const kulcs = e.entitas + '|' + jel;
    if (!csoportok.has(kulcs)) csoportok.set(kulcs, { horgony: e.entitas, jel, javaslat: e.adat.javaslat, kit: e.adat.kit, fazisok: [] });
    csoportok.get(kulcs).fazisok.push({ fazis: e.adat.fazis, sorszam: e.entitasSorszam ?? 0, ido: e.ido });
  }
  for (const c of csoportok.values()) {
    const allas = segitoAllasa(c.fazisok);
    let a = (await helyreallitasokAllapota(tar, koino, c.horgony)).find((x) => x.jel === c.jel);
    if (!a) continue;
    if (allas.kezdett && !allas.veglegesitett && a.ut && !a.megallitva && a.elozoMegallitva) {
      // A kezdésem ideje: az utolsó visszavonásom utáni első kezdés.
      const rendezett = [...c.fazisok].sort((x, y) => x.sorszam - y.sorszam);
      let kezdesIdo = null;
      for (const f of rendezett) {
        if (f.fazis === 'visszavonas') kezdesIdo = null;
        else if (f.fazis === 'kezdes' && kezdesIdo === null) kezdesIdo = f.ido;
      }
      if (kezdesIdo !== null && most - kezdesIdo >= a.varakozasNap * NAP_MS) {
        const sajatBelepes = await azonossagHorgonya(tar, koino, szerzo);
        await helyreallitasJovahagyasa(kornyezet, { kit: c.kit, horgonya: c.horgony, sajatBelepes }, c.javaslat, 'veglegesites');
        ki.veglegesitettek.push(c.jel);
        a = (await helyreallitasokAllapota(tar, koino, c.horgony)).find((x) => x.jel === c.jel);
      }
    }
    if (!a?.teljes) continue;
    // TELJES — bent van-e már (egy Kulcscsere, aminek a láncában ez a jel áll)?
    const lanc = await azonossagLancaTarbol(tar, c.kit);
    if (lanc.lancok.some((cs) => cs.some((x) => x.jel === c.jel))) continue;
    const elotag = javaslatElotagja(lanc, c.javaslat);
    if (!lanc.szuletes || !elotag) continue;   // a tár nem ismeri a láncot a javaslat helyéig (D19 — később)
    const bejegyzes = await helyreallitasBejegyzese(c.kit, c.javaslat);
    const cserek = [...elotag, bejegyzes];
    const bizonyitekok = { [c.jel]: await helyreallitasBizonyiteka(tar, koino, c.horgony, c.jel) };
    // A lánc-elejében álló korábbi helyreállítások bizonyítékai is kellenek (a Kulcscsere pontosan hozza őket).
    let hianyos = false;
    for (const jel of lancHelyreallitasai(elotag)) {
      if (!lanc.bizonyitekok[jel]) { hianyos = true; break; }
      bizonyitekok[jel] = lanc.bizonyitekok[jel];
    }
    if (hianyos) continue;
    await kulcscsereBevitele(kornyezet, lanc.szuletes, cserek, bizonyitekok);
    ki.bevittek.push(c.jel);
  }
  console.log('muveletek.helyreallitasokGondozasa - VÉGE', ki);
  return ki;
}

/**
 * ⭐⭐ D128 (②b): a KULCSCSERE bevitele ebbe a koinóba — a születés és a cserék lánca (önmagát igazolja: bárki beviheti, mint a
 * kizárást), az azonosság szeletébe. A koinó ettől tudja, hogy a régi kulccsal felvett, nem felsorolt készülékek eseményei nem számítanak.
 * ⭐ (②c) Ha az azonosság ebben a koinóban NEM TAG (nincs azonosság-szelete), itt nincs mit bevinni: `null` — nem hiba (a csere a
 * gépen már megtörtént, és a lánca a tanúsítványokkal jár, ha később belép).
 * @param {Object} kornyezet
 * @param {Object} szuletes
 * @param {Array<Object>} cserek
 * @returns {Promise<Object|null>} a `Kulcscsere` esemény (`null`, ha itt nincs szelete)
 */
export async function kulcscsereBevitele(kornyezet, szuletes, cserek, bizonyitekok = null) {
  console.log('muveletek.kulcscsereBevitele - KEZDÉS', { cserek: cserek?.length });
  const horgony = await azonossagHorgonya(kornyezet.tar, kornyezet.koino, cserek?.[0]?.azonossag);
  if (!horgony) {
    console.log('muveletek.kulcscsereBevitele - VÉGE (ebben a koinóban nincs szelete)');
    return null;
  }
  // ⭐⭐ (②e2) a láncban álló helyreállítások bizonyítékai (jel → bizonyíték) — ha vannak
  return esemenytTeszek(kornyezet, 'Kulcscsere', { szuletes, cserek, ...(bizonyitekok ? { bizonyitekok } : {}) }, { entitas: horgony });
}

/**
 * Egy készülékem KIZÁRÁSA (az azonosság kulcsával): a tanúsítvány koinónként a vágással és az örökössel, és a bevitele ebbe a
 * koinóba (a többi felsorolt koinóba az örökös viszi — ott is `kizarasBevitele`). ⚠️ Az azonosság kulcsa kell hozzá (KU6:
 * később papírról).
 * @param {Object} kornyezet
 * @param {CryptoKeyPair} azonossagKulcspar
 * @param {string} kizart - a kizárt készülék kulcsa
 * @param {Array<{koino: string, vagas: number, orokos: string}>} koinok
 * @returns {Promise<{kizaras: Object, esemeny: Object}>}
 */
export async function keszulekKizarasa(kornyezet, azonossagKulcspar, kizart, koinok) {
  const kizaras = await kizarasKeszitese(azonossagKulcspar, kizart, koinok);
  if (kizaras.azonossag !== kornyezet.szerzo) throw new Error('Csak a saját azonosságod készülékét zárhatod ki.');
  return { kizaras, esemeny: await kizarasBevitele(kornyezet, kizaras) };
}

// ===================================
// ⭐⭐ D128 (③b — 9.12): AZ AZONOSSÁGOM KEZELÉSE MINDEN KOINÓMBA — HELYBEN
// ===================================

/**
 * Az azonosságom kezelése EBBE A KOINÓBA: a jegyzékbe veszi, amit itt lát (a legerősebb kulcscsere-láncot a bizonyítékaival, a
 * kizárásokat), és ha az azonosságomnak itt szelete van, beviszi, ami innen hiányzik — előbb a láncot (a kapu így a benne álló
 * helyreállításokat is felveszi), utána a kizárásokat. Amit a kapu elvet, azt feljegyzi (`elvetve` — egy napig nem próbálja újra).
 * ⚠️ A jegyzék tárolása a hívóé (`koino.js` — `kezeles.json`): ez a függvény a régit kapja, az újat adja vissza.
 * @param {Object} kornyezet
 * @param {Object|null} jegyzek - `allapot/kezelesTerjesztes.js` (null: üres)
 * @param {{most?: number}} [beallitas]
 * @returns {Promise<{jegyzek: Object, valtozott: boolean, lanc: Object|null, kizarasok: Array<Object>, hibak: Array<string>,
 *   bizonyitekNelkul: boolean}>} a bevitt események és a kapu elvetéseinek okai
 */
export async function kezelesGondozasa(kornyezet, jegyzek, { most = Date.now() } = {}) {
  const { tar, koino, szerzo } = kornyezet;
  const itt = await tarKezelese(tar, szerzo);
  let { jegyzek: j, valtozott } = jegyzekbe(jegyzek ?? ujKezelesJegyzek(szerzo), itt);
  const ki = { jegyzek: j, valtozott, lanc: null, kizarasok: [], hibak: [], bizonyitekNelkul: false };
  const h = kezelesHianyai(itt, j, koino, most);
  ki.bizonyitekNelkul = h.bizonyitekNelkul;
  if (!h.lanc && !h.kizarasok.length) return ki;
  if (!(await azonossagHorgonya(tar, koino, szerzo))) return ki;   // itt nincs szeletem — nincs hová bevinni
  console.log('muveletek.kezelesGondozasa - KEZDÉS', { koino, lanc: !!h.lanc, kizarasok: h.kizarasok.length });
  const elvetettek = [];
  if (h.lanc) {
    try {
      ki.lanc = await kulcscsereBevitele(kornyezet, h.lanc.szuletes, h.lanc.cserek, lancBizonyitekai(h.lanc));
    } catch (hiba) {
      ki.hibak.push('a kulcscsere: ' + hiba.message);
      elvetettek.push(lancJele(h.lanc));
    }
  }
  for (const k of h.kizarasok) {
    try {
      ki.kizarasok.push(await kizarasBevitele(kornyezet, k));
    } catch (hiba) {
      ki.hibak.push('a kizárás: ' + hiba.message);
      elvetettek.push(k.alairas);
    }
  }
  if (elvetettek.length) {
    ki.jegyzek = elvetesFeljegyzese(ki.jegyzek, koino, elvetettek, most);
    ki.valtozott = true;
  }
  console.log('muveletek.kezelesGondozasa - VÉGE', { lanc: !!ki.lanc, kizarasok: ki.kizarasok.length, hibak: ki.hibak.length });
  return ki;
}

/**
 * ⭐⭐ D128 (12. pont — Csaba, 2026-11-14: (A)): mennyi pontja van az AZONOSSÁGOMNAK (bármely készülékemnek) az entitáson — a
 * tárban lévő láncaim utolsó pont-eseményeiből (láncónként a legnagyobb sorszámú). A szavazás és a javaslattétel ebből tudja,
 * hogy a jog egy MÁSIK készülékemé: ilyenkor ez a készülék előbb magától 1 pontot tesz rá a saját részéből (a jogot az esemény a
 * saját láncából bizonyítja — D85). ⚠️ Csak a kiváltó: a jogról a számítás dönt.
 * @param {Object} kornyezet
 * @param {string} entitas
 * @returns {Promise<number>}
 */
async function azonossagomPontja(kornyezet, entitas) {
  const utolso = new Map();   // lánc → az utolsó pont-eseménye ezen az entitáson
  for (const e of await azonossagEsemenyei(kornyezet.tar, kornyezet.szerzo)) {
    if (e.tipus !== 'TudatpontRendezes' || e.adat?.entitas !== entitas || esemenyKoinoja(e) !== kornyezet.koino) continue;
    const eddigi = utolso.get(lancKulcsa(e));
    if (!eddigi || e.sorszam > eddigi.sorszam) utolso.set(lancKulcsa(e), e);
  }
  let osszeg = 0;
  for (const e of utolso.values()) if (e.adat.pont > 0) osszeg += e.adat.pont;
  return osszeg;
}

/**
 * ⭐⭐ D128 (12. pont): ha ennek a készüléknek nincs pontja az entitáson, de az azonosságomnak (egy másik készülékemnek) van,
 * 1 pontot tesz rá a saját részéből — a jog így a saját láncából bizonyítható. ⛔ Ha a készüléknek nincs szabad pontja, a
 * pont-rendezés kimondja (a keret az átadással jön).
 * @returns {Promise<boolean>} van-e (most már) pontja a készüléknek az entitáson
 */
async function keszulekPontjaHaAzonossagome(kornyezet, entitas, ido) {
  if ((await sajatKiosztott(kornyezet, entitas)).regi > 0) return true;
  if ((await azonossagomPontja(kornyezet, entitas)) <= 0) return false;
  await tudatpontRendezese(kornyezet, entitas, 1, 'aktiv', undefined, ido !== undefined ? { ido } : {});
  return true;
}

export async function javaslatLetrehozasa(kornyezet, adatok) {
  const { erintett, muvelet, valtozas, indoklas, fajta } = adatok;
  const kezdoPont = Number.isInteger(adatok.pont) && adatok.pont > 0 ? adatok.pont : null;

  // A régi, egy-érintettes hívás listává alakul — így egyetlen alak megy az eseménybe.
  const lista = Array.isArray(adatok.erintettek)
    ? adatok.erintettek
    : (typeof erintett === 'string'
        ? [{ entitas: erintett, muvelet: muvelet || 'Modositas', valtozas: valtozas || null }]
        : []);

  if (!lista.length) {
    throw new Error('A javaslatnak legalább egy érintett entitást meg kell neveznie.');
  }

  // ⭐ Minden elem TELJES: entitás + művelet + változás. A hiányzó mezőt itt töltjük ki, nem
  // az olvasóknál — így a kanonikus alak sem lesz hol ilyen, hol olyan.
  const erintettek = [];
  for (const r of lista) {
    const valtozas = r.valtozas ?? null;
    erintettek.push({
      entitas: r.entitas,
      muvelet: r.muvelet || 'Modositas',
      // ⭐ D72: a javasolt ÚJ szöveg is külön darab — a javaslat a hivatkozását hordozza.
      valtozas: valtozas && typeof valtozas === 'object' && 'szoveg' in valtozas
        ? { ...valtozas, szoveg: await szovegDarabbaTetele(kornyezet, valtozas.szoveg) }
        : valtozas
    });
  }

  // ⭐⭐ D128 (12. pont): a javaslattétel joga is a KÉSZÜLÉKÉ — ahol a pont egy másik készülékemen van, ez előbb 1 pontot tesz rá.
  for (const r of erintettek) await keszulekPontjaHaAzonossagome(kornyezet, r.entitas);

  // ⭐⭐ D129 (②b, ②c): a kézikönyv-érintettek (és az áthelyezés céljának) nevei; a kézikönyv-módosítás azt is megjegyzi, a program
  // melyik szövegét váltja (`alapLenyomatok` — MA5 (A): ebből tudja a program később, hogy azóta mást mond-e); és ha a program
  // által megírt javaslat, azt is (a lap kimondja).
  const nevek = rendszerNevekKornyezetbol(kornyezet, [...erintettek.map((r) => r.entitas),
    ...erintettek.filter((r) => r.muvelet === 'Athelyezes').map((r) => r.valtozas?.szulo)]);
  const alapLenyomatok = {};
  if (typeof kornyezet.alapLenyomata === 'function') {
    for (const r of erintettek) {
      if (r.muvelet !== 'Modositas') continue;
      for (const n of rendszerNevekKornyezetbol(kornyezet, [r.entitas])) {
        const l = kornyezet.alapLenyomata(n);
        if (typeof l === 'string') alapLenyomatok[n] = l;
      }
    }
  }

  const javaslat = await esemenytTeszek(
    kornyezet,
    'Javaslat',
    {
      fajta: fajta === 'altalanos' ? 'altalanos' : 'szerkesztesi',
      erintettek,
      indoklas: indoklas || null,
      ...nevMezo(nevek),
      ...(Object.keys(alapLenyomatok).length ? { alapLenyomatok } : {}),
      ...(adatok.programJavaslata === true ? { programJavaslata: true } : {})
    },
    // ⭐⭐ D85/1 (Csaba, 2026-10-02): A JAVASLAT A SAJÁT SZELETÉBEN ÉL, mint egy gondolat (az `entitas`
    // üres → a saját azonosítója a szelet). Minden érintettjénél BEJELENTÉSKÉNT jelenik meg
    // (`esemeny.js`: `bejelentesHelyei`) — a gondolat tartói így is mindent tudnak, ami róla dönt.
    // *(2026-10-02-ig az első érintett szeletébe került: „a szeletnek egyetlen gazdája lehet".)*
    // ⭐⭐ D85 T3 előfeltétele (a T2 mintája): a javaslat a jogának bizonyítékát hozza — érintettenként a
    // javaslattevő pontját a saját kiosztás-fájából. A csak-G1-tartó így a G2-es pontot is ellenőrzi.
    { bizonyitekKulcsok: erintettek.map((r) => r.entitas) }
  );

  // ===================================
  // ⭐⭐ D85: A KEZDŐ PONT A JAVASLATRA (vagy a töredékeire) — A SZAVAZAT ELŐTT
  // ===================================
  //
  // ⚠️ Ugyanaz az időbélyeg, mint a javaslaté (mint a szavazatnál lent): az időrendi számítás így
  // a saját lánc sorrendjében veszi — előbb a pont, aztán a szavazat.
  const entitasai = javaslatEntitasai(javaslat);
  const elosztas = kezdoPontokElosztasa(kezdoPont ?? entitasai.length, entitasai.length);
  for (let i = 0; i < entitasai.length; i++) {
    await tudatpontRendezese(kornyezet, entitasai[i].azonosito, elosztas[i], 'aktiv', undefined,
      { ido: javaslat.ido, rendszer: esemenyRendszerNevei(javaslat) });   // ⭐⭐ D129: a javaslat nevei
  }

  // ===================================
  // ⭐⭐ ÉS A JAVASLATTEVŐ TÁMOGATÓ SZAVAZATA — UGYANEBBEN A LÉPÉSBEN
  // ===================================
  //
  // ⛔⛔ EZ HIÁNYZOTT, ÉS MÉRHETŐ KÁRT OKOZOTT (2026-09-12, Csaba helyreigazítása).
  // A prototípus a javaslat létrehozásakor **automatikusan lead egy támogató szavazatot**
  // (`javaslatService.js:635` — *„Automatikus támogató szavazat"*). A koino ezt nem tette,
  // és emiatt egy **egytulajdonosú** entitás saját szerkesztési javaslata **0 szavazattal,
  // ELVETVE** zárult — pontosan az ellenkezője annak, aminek történnie kell.
  //
  // ⭐ Csaba kimondása: *„a prototípusban is csak javaslat → egyezmény mentén lehet
  // szerkeszteni, csak mivel ő az egyetlen tulajdonosa, ezért 100% támogatottság mellett
  // azonnal megtörténik."* ⚠️ **A 100% nem jön magától** — ezt a szavazat adja.
  //
  // ⭐ MIÉRT ITT, ÉS NEM A HÍVÓBAN? Mert ez nem kényelem, hanem **a javaslattétel
  // jelentésének része**: aki javasol valamit, az támogatja. Ha a hívóra bíznánk, pontosan
  // ez történne újra — az egyik hívó megteszi, a másik elfelejti, és a koino két úton
  // máshogy viselkedne.
  //
  // ⚠️ KÉT ALÁÍRT ESEMÉNY, nem egy — és ez rendben van: a saját készülékem a saját
  // kulcsommal két külön állítást tesz (*„ezt javaslom"* és *„támogatom"*). Precedens: a
  // `javaslat` parancs a tudatpontot is külön eseményként rendeli hozzá.
  await esemenytTeszek(
    kornyezet, 'Szavazat',
    // ⭐⭐ D129 (②b): a kézikönyv-javaslat támogató szavazata is a javaslat neveit viszi (a kézikönyv szeletébe)
    { javaslat: javaslat.azonosito, szavazat: 'Tamogat', kulonvalasIgeny: false, ...nevMezo(esemenyRendszerNevei(javaslat)) },
    // ⛔⛔ UGYANAZ AZ IDŐBÉLYEG, mint a javaslaté — lásd az `esemenytTeszek` `ido` ágát.
    // Nélküle nulla döntési időnél a saját szavazatom **késői** lenne, és a javaslat
    // 0%-kal, ELVETVE zárna — mérve, 2026-09-12.
    // ⭐ D85/2 (T2): a szavazati jog bizonyítéka minden részre (az érintettre és a javaslat-entitásra)
    // — a javaslattevőnek mindegyiken van pontja (a szabály-réteg 3. szabálya és a fenti lépés).
    // ⭐ D85/1: a szavazat a JAVASLAT szeletébe kerül (arról szól); az érintettekhez a bizonyítéka
    // kulcsai szerint jelentődik be.
    { entitas: javaslat.azonosito, horgonyozzunk: true, ido: javaslat.ido,
      bizonyitekKulcsok: entitasai.flatMap((je) => (je.resz ? [je.resz.entitas, je.azonosito] : [])) }
  );

  // ⭐ A JAVASLAT eseményét adjuk vissza, nem a szavazatét — a hívót az érdekli.
  return javaslat;
}

// ===================================
// SZAVAZAT
// ===================================

/**
 * Szavazás egy javaslatra.
 *
 * ⭐⭐ A KÜLÖNVÁLÁSI IGÉNY (2026-09-08, a prototípus `kulonvalasIgeny` mezője).
 *
 * *„Ha a döntés nem a te álláspontodat követi, szeretnél külön ágat?"* — aki ezt kéri, és a
 * vesztes oldalon marad, az a **saját változatával** léphet külön ágra, a tudatpontjával
 * együtt. *„Aki elmegy, viszi a súlyát."*
 *
 * ⛔ TARTÓZKODÁSNÁL A SZÁNDÉK MINDIG HAMIS, és ezt ITT kényszerítjük ki — pontosan úgy,
 * ahogy a prototípus `szavazatService`-e (1/b lépés): *„aki nem foglalt állást, nem válik
 * külön, ő a főágon marad."* ⭐ Egy helyen döntjük el, hogy ne csúszhasson szét kétféle
 * igazságra: a felület kérdése csak kérdés, a szabály itt van.
 *
 * @param {Object} kornyezet
 * @param {string} javaslat - a javaslat azonosítója
 * @param {string} szavazat - 'Tamogat' | 'Ellenez' | 'Tartozkodik'
 * @param {boolean} [kulonvalasIgeny] - kér-e külön ágat, ha a döntés ellene megy
 */
export async function szavazas(kornyezet, javaslat, szavazat, kulonvalasIgeny = false) {
  if (!['Tamogat', 'Ellenez', 'Tartozkodik'].includes(szavazat)) {
    throw new Error('Érvénytelen szavazat: ' + szavazat);
  }

  // ⛔ A tartózkodó SOSEM válik külön (lásd fent).
  const igeny = szavazat === 'Tartozkodik' ? false : !!kulonvalasIgeny;

  // Melyik entitásról szól a javaslat? Ez adja a szelet-kulcsot.
  const javaslatEsemeny = await esemenyLekerese(kornyezet.tar, javaslat);
  if (!javaslatEsemeny) {
    throw new Error('Nem ismerem ezt a javaslatot: ' + javaslat);
  }
  // ⭐ D85/1 (2026-10-02): a szavazat a JAVASLAT szeletébe kerül — arról szól, ahogy a tudatpont-esemény
  // annak a szeletébe, amire vonatkozik. Az érintett gondolatokhoz a bizonyítéka kulcsai szerint
  // jelentődik be (`bejelentesHelyei`). *(Korábban: az első érintett szeletébe.)*
  const entitas = javaslat;

  // ⭐⭐ D85/2 (Csaba, 2026-10-02): A SZAVAZATI JOG A JAVASLATON IS PONTOT KÍVÁN. Ahol a szavazó jogosult
  // (pontja van az érintetten), de a rész javaslat-entitásán (a javaslaton / a töredékén) még nincs, a
  // művelet 1 pontot tesz rá — UGYANAZZAL az időbélyeggel, a szavazat ELŐTT, ahogy a javaslattevőnél is.
  // ⚠️ A szabály a SZÁMÍTÁSBAN van (`javaslatSzamitas.js`); ez itt csak az, hogy a gomb ne legyen
  // némán hatástalan.
  const ido = Date.now();
  const bizonyitekKulcsok = [];
  // ⭐⭐ D129 (②b): a kézikönyv-javaslat szavazata (és a javaslatra tett pont) a javaslat neveit viszi — a kézikönyv szeletébe
  const nevek = esemenyRendszerNevei(javaslatEsemeny);
  for (const je of javaslatEntitasai(javaslatEsemeny)) {
    if (!je.resz) continue;
    // ⭐⭐ D128 (12. pont, Csaba: (A)): a jog KÉSZÜLÉKENKÉNT — ha a pont egy másik készülékemen van, ez előbb 1 pontot tesz rá.
    if (!(await keszulekPontjaHaAzonossagome(kornyezet, je.resz.entitas, ido))) continue;   // itt nem jogosult
    // ⭐ T2: a jogosult részek mindkét kulcsára bizonyíték megy a szavazattal.
    bizonyitekKulcsok.push(je.resz.entitas, je.azonosito);
    if ((await sajatKiosztott(kornyezet, je.azonosito)).regi > 0) continue;      // már van pontja rajta
    await tudatpontRendezese(kornyezet, je.azonosito, 1, 'aktiv', undefined, { ido, rendszer: nevek });
  }

  return esemenytTeszek(
    kornyezet, 'Szavazat', { javaslat, szavazat, kulonvalasIgeny: igeny, ...nevMezo(nevek) },
    { entitas, horgonyozzunk: true, ido, bizonyitekKulcsok }
  );
}

// ===================================
// ⭐⭐ D85 T3: A DÖNTÉSI CSOMAG KIADÁSA
// ===================================

/**
 * A lezárt, több érintettes javaslatok döntési csomagjainak kiadása (D85 T3, a (B) — Csaba, 2026-10-03).
 *
 * Minden lezárt javaslatnál, érintettenként: ami a döntés bemenetéből (`dontesBemenete`) a cél szeletéből
 * hiányzik (`celbolHianyzik`), és amit még egyetlen meglévő csomag sem hozott oda, az aláírt csomag(ok)ba
 * kerül, a cél TÖREDÉKÉNEK szeletébe. ⭐ Ismételhető: ha már minden ott van, nem ír semmit (az őrjárat minden
 * körben hívhatja); ha később több látszik (egy kései szinkron hozott még valamit a lezárás előttről), csak
 * azt pótolja. ⚠️ Bárki kiadhatja, akinél a bemenet megvan — alapból a javaslattevő teszi (minden érintetten
 * van pontja, tehát minden érintett szeletét tartja); a kapu a tartalmat nézi, nem a kiadót.
 *
 * @param {Object} kornyezet
 * @param {Object} [beallitas]
 * @param {string|null} [beallitas.javaslat] - csak ez a javaslat (alapból mind)
 * @param {boolean} [beallitas.csakSajat] - csak a saját javaslataim (az őrjárat így hívja)
 * @param {number} [beallitas.most] - az idő (a lezárás eldöntéséhez)
 * @param {number} [beallitas.korlat] - a darabolás korlátja bájtban (a próbáknak)
 * @returns {Promise<{kiadva: Array<Object>, javaslatok: number}>}
 */
export async function dontesiCsomagokKiadasa(kornyezet, beallitas = {}) {
  const most = beallitas.most ?? Date.now();
  const korlat = beallitas.korlat ?? CSOMAG_BAJT_KORLAT;
  const esemenyek = await koinoEsemenyei(kornyezet.tar, kornyezet.koino);
  const allapot = allapotSzamitasa(esemenyek);

  // A lezárt, több érintettes javaslatok (a számító eseményekből — ami nem számít, annak nincs döntése).
  const jelolt = allapot.szamitok.filter((e) => e.tipus === 'Javaslat'
    && erintettek(e.adat).length > 1
    && (!beallitas.javaslat || e.azonosito === beallitas.javaslat)
    && (!beallitas.csakSajat || e.szerzo === kornyezet.szerzo));
  if (!jelolt.length) return { kiadva: [], javaslatok: 0 };
  const dontesek = javaslatokSzamitasa(allapot.szamitok, allapot, most);

  // Ami a meglévő csomagok egy-egy töredékébe már eljutott.
  const vitt = new Map();   // töredék → Set(azonosító)
  for (const e of esemenyek) {
    if (e.tipus !== CSOMAG_TIPUS || !Array.isArray(e.adat?.esemenyek)) continue;
    if (!vitt.has(e.entitas)) vitt.set(e.entitas, new Set());
    for (const x of e.adat.esemenyek) vitt.get(e.entitas).add(x?.azonosito);
  }

  const kiadva = [];
  let javaslatok = 0;
  for (const j of jelolt) {
    const d = dontesek.get(j.azonosito);
    if (!d || most < d.lezarasIdeje) continue;          // még nyitva: a bemenet még változhat
    javaslatok++;
    const bemenet = dontesBemenete(allapot.szamitok, j, d.lezarasIdeje);
    for (const { entitas: cel } of erintettek(j.adat)) {
      const toredek = toredekAzonosito(j.azonosito, cel);
      const marOtt = vitt.get(toredek) ?? new Set();
      const hianyzik = celbolHianyzik(bemenet, cel)
        .filter((e) => e.azonosito !== j.azonosito && !marOtt.has(e.azonosito));
      for (const darab of csomagokra(hianyzik, korlat - bajt(j))) {
        // ⭐⭐ D128: a belső események készülékeinek tanúsítványai (a lánc első eseménye a cél tartójánál nincs meg).
        const belul = [j, ...darab];
        const tanusitvanyok = [];
        for (const k of new Set(belul.filter((x) => !x.tanusitvany).map((x) => x.keszulek))) {
          const t = await tarTanusitvanya(kornyezet.tar, k);
          if (t) tanusitvanyok.push(t);
        }
        kiadva.push(await esemenytTeszek(kornyezet, CSOMAG_TIPUS,
          { javaslat: j.azonosito, cel, esemenyek: belul, tanusitvanyok }, { entitas: toredek }));
      }
    }
  }
  return { kiadva, javaslatok };
}
