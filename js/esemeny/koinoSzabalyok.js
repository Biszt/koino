// js/esemeny/koinoSzabalyok.js

// Felelősség: ⭐⭐ D118/2 (a bekapcsolódás ①b, 2026-10-24) — A KOINO SZABÁLYAI A SZÜLETÉSÉBEN, nem a programban.
//
// Az állapotot befolyásoló számok (a tudatpont-keret, a kategória-korlát, a tanúsítás-szám, a felhatalmazás
// alapértéke, a küszöbök alapértékei) a koino születésének (`KoinoLetrehozas`) `szabalyok` mezőjébe kerülnek. Ettől:
//   · egy szabály-változás nem programváltozás, hanem egy új koino születése ugyanazzal a programmal (D25 1. mód,
//     D13/b paraméter-pluralizmus);
//   · a szülő múltját (a bekapcsolódás) ugyanaz a kód számolja, a szülő szabályaival;
//   · a 15. mérés néma kettéhasadása (ugyanaz a koino-név, más állandó a két gépen) szerkezetileg megszűnik — az
//     állandó a koinohoz kötött, és a koino neve a születés lenyomata (D118/2, `esemeny.js`).
//
// ⭐ A program az új születésbe MINDEN szabályt kiír (`teljesSzabalyok`) — az új koino szabályai így teljesen a születésben
// állnak. ⚠️ A mező elhagyható: aminek nincs `szabalyok` mezője (a régi születések), vagy csak egy része van, az a hiányzókat
// a mai értékekkel számolja — ugyanazt, mint eddig (⛔ ezért a mai értékek soha nem változnak — lent). A hiányzó születésnél (még nem érkezett meg) is a mai értékek: a keret felső határa a mai 10 000, tehát a
// kapu a születés nélkül a legengedékenyebb — semmi érvényeset nem dob el (a szabály-réteg később a születés szerint ítél).
//
// ⛔ Ami NEM paraméter (KZ1): a modell része (a tagsághoz kötött események, a műveletek, a döntés képlete), a méret-korlát
// (a tagsági lánc mélysége — D106), és a készülék ellenőrzési mélysége. ⛔ A meghívó-szám (hány tag hívjon meg egy új
// embert) sem: a modell része, rögzítve 1 (Csaba, 2026-10-24: „maradjon 1 egyelőre” — `tagsag.js` egy meghívással és a
// legrövidebb lánccal számol; a 11–12. mérés szerint a nagyobb szám árcédula, nem védelem).
//
// Hálózatot és más modult nem importál — a kapu (`esemeny.js` `alakiHiba`) és a számítás egyaránt ide nyúl.
//
// Használják: `esemeny.js` (a mező alakja), `allapot/szabalyok.js`, `allapot/javaslatSzamitas.js`, `allapot/identitas.js`,
// `allapot/lezarasiOsszegzes.js`, `allapot/vallalas.js`, `allapot/lancGyoker.js`, `allapot/ellentmondas.js`,
// `muveletek.js`, `koino.js`.

// ===================================
// A MAI ÉRTÉKEK — egy helyen
// ===================================

/**
 * A koino szabályai, ha a születése mást nem mond (a régi koinok és a hiányzó születés).
 *
 * ⛔⛔ EZEK A SZÁMOK SOHA NEM VÁLTOZNAK. A program az új születésbe MINDEN szabályt kiír (`teljesSzabalyok`), tehát egy új
 * koino nem ezekre támaszkodik — de a régi alakú (mező nélküli) születés igen, és ha egy későbbi program itt mást mondana,
 * ugyanaz a régi koino két programon két állapotot számolna (a 15. mérés néma kettéhasadása — a megismételt mérés ezt
 * mutatja). Egy új koino más szabállyal: a születésébe írva, nem ide.
 */
export const ALAP_SZABALYOK = Object.freeze({
  tudatpontKeret: 10000,
  kategoriaKorlat: 3,
  tanusitasKell: 3,
  felhatalmazasKell: 5,
  alapKuszobok: Object.freeze({
    elfogadasiKuszob: 51,        // százalék: a támogatottság ekkora legyen a szavazók közt
    reszveteliKuszob: 0,         // százalék: ekkora részvétel kell (0 = nincs feltétel)
    minimumDontesiIdo: 1,        // másodperc — a reakció-ablak alsó határa (D4)
    maximumDontesiIdo: 604800    // másodperc: 7 nap
  })
});

// ===================================
// ⭐⭐ D129: A KÉZIKÖNYV SZABÁLYA — CSAK AZ ÚJ SZÜLETÉSBEN
// ===================================
//
// A kézikönyv (a rendszer-entitások: az ⓘ jelek magyarázatai — `rendszerEntitas.js`) a koino szabálya: ha a születés `kezikonyv`
// mezőt visz, a koinoban a kézikönyv-entitások léteznek (a D14 alól kivételek), és a saját alap-küszöbükkel döntenek. ⛔ Az
// `ALAP_SZABALYOK` NEM kapja meg — a mező nélküli (régi) születés így kézikönyv NÉLKÜLI marad (a „mai értékek soha nem
// változnak”): ez az ELSŐ szabály, aminek a HIÁNYA is jelent valamit. Az új születésbe a `teljesSzabalyok` írja.
//
// ⭐ MA8 (B) (Csaba, 2026-11-19: „rendben”): ugyanaz a szabály (a pont-tartók döntenek), de óvatosabb alap-küszöbbel — legalább
// 3 nap döntési idő, hogy mások észrevehessék és csatlakozhassanak (a mai alap-küszöbbel egy ember 1 ponttal, egyedül, 1 mp alatt
// átírhatná). A küszöböt a tulajdonosok érték javaslattal ugyanúgy megváltoztathatják, mint bármely gondolatét.
//
// ⛔ EZEK A SZÁMOK SEM VÁLTOZNAK: egy részleges (kézzel írt) `kezikonyv` mező a hiányzókat innen veszi.
export const KEZIKONYV_ALAP_KUSZOBOK = Object.freeze({
  elfogadasiKuszob: 51,
  reszveteliKuszob: 0,
  minimumDontesiIdo: 259200,   // másodperc: 3 nap
  maximumDontesiIdo: 604800    // másodperc: 7 nap
});

// ===================================
// A HATÁROK — amit a kapu enged
// ===================================
//
// ⚠️ A tudatpont-keret felső határa a MAI érték: a D106 kivétele (a kanonikus alak „biztonságos egész” határa — egy ág
// össz-pontja ≤ e-ember × 10 000) erre a keretre van levezetve; nagyobb kerethez a kivételt újra kell számolni. És ettől
// a hiányzó születésnél a mai érték a legengedékenyebb.
const HATAROK = {
  tudatpontKeret: [1, 10000],
  kategoriaKorlat: [0, 16],
  tanusitasKell: [1, 16],
  felhatalmazasKell: [1, 1000]
};
const KUSZOB_HATAROK = {
  elfogadasiKuszob: [0, 100],
  reszveteliKuszob: [0, 100],
  minimumDontesiIdo: [0, 315360000],   // legfeljebb 10 év
  maximumDontesiIdo: [0, 315360000]
};

const egeszKozte = (x, [also, felso]) => Number.isSafeInteger(x) && x >= also && x <= felso;

/**
 * Egy küszöb-objektum alaki hibája (a koino alap-küszöbei és a kézikönyvé ugyanígy): csak ismert küszöbök, a határokon belül, és
 * a kiegészített alakban a legkisebb döntési idő nem nagyobb a legnagyobbnál.
 * @param {*} v
 * @param {Object} alap - amivel a hiányzókat kiegészítjük
 * @param {string} mi - a hibaüzenet alanya
 * @returns {string|null}
 */
function kuszobokAlakiHibaja(v, alap, mi) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return mi + ' egy objektum';
  for (const [kk, vv] of Object.entries(v)) {
    if (!KUSZOB_HATAROK[kk]) return 'ismeretlen küszöb a koino szabályaiban: ' + kk;
    if (!egeszKozte(vv, KUSZOB_HATAROK[kk])) return 'a(z) ' + kk + ' küszöb a határon kívül';
  }
  const k2 = { ...alap, ...v };
  if (k2.minimumDontesiIdo > k2.maximumDontesiIdo) return 'a legkisebb döntési idő nagyobb a legnagyobbnál';
  return null;
}

/**
 * A születés `szabalyok` mezőjének alakja — a kapu kérdezi. Csak ismert kulcsok, egész számok a határokon belül; a
 * küszöböknél a legkisebb döntési idő nem nagyobb a legnagyobbnál.
 * @returns {string|null} a hiba szövege, vagy null
 */
export function szabalyokAlakiHibaja(sz) {
  if (sz === undefined) return null;
  if (!sz || typeof sz !== 'object' || Array.isArray(sz)) return 'a koino szabályai egy objektum';
  for (const [k, v] of Object.entries(sz)) {
    if (k === 'alapKuszobok') {
      const h = kuszobokAlakiHibaja(v, ALAP_SZABALYOK.alapKuszobok, 'a küszöbök alapértékei');
      if (h) return h;
      continue;
    }
    // ⭐⭐ D129: a kézikönyv szabálya — egy objektum, egyetlen ismert mezővel (a kézikönyv alap-küszöbe; hiányozhat).
    if (k === 'kezikonyv') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return 'a kézikönyv szabálya egy objektum';
      for (const kk of Object.keys(v)) if (kk !== 'alapKuszobok') return 'ismeretlen mező a kézikönyv szabályában: ' + kk;
      if (v.alapKuszobok !== undefined) {
        const h = kuszobokAlakiHibaja(v.alapKuszobok, KEZIKONYV_ALAP_KUSZOBOK, 'a kézikönyv alap-küszöbei');
        if (h) return h;
      }
      continue;
    }
    if (!HATAROK[k]) return 'ismeretlen szabály a koino születésében: ' + k;
    if (!egeszKozte(v, HATAROK[k])) return 'a(z) ' + k + ' szabály a határon kívül (' + HATAROK[k].join('–') + ')';
  }
  return null;
}

/**
 * Az új születésbe írandó szabályok: MIND, a megadottak a mai értékek helyén. ⭐ Így az új koino szabályai teljesen a
 * születésében állnak, és egy későbbi program alapértéke nem írhatja át őket (fent). +206 bájt, egyszer koinonként.
 * @param {Object} [megadott] - az eltérő szabályok (`{ tudatpontKeret: 500, alapKuszobok: { elfogadasiKuszob: 66 } }`)
 * @returns {Object} sima (nem fagyasztott) objektum — az esemény adata
 */
export function teljesSzabalyok(megadott = {}) {
  const { alapKuszobok, kezikonyv, ...tobbi } = megadott ?? {};
  const { alapKuszobok: alapK, ...alap } = ALAP_SZABALYOK;
  // ⭐⭐ D129: az új születés a kézikönyv szabályát is viszi (az `ALAP_SZABALYOK`-ban nincs — a régi születés kézikönyv nélküli)
  return { ...alap, ...tobbi, alapKuszobok: { ...alapK, ...(alapKuszobok ?? {}) },
    kezikonyv: { alapKuszobok: { ...KEZIKONYV_ALAP_KUSZOBOK, ...(kezikonyv?.alapKuszobok ?? {}) } } };
}

/**
 * A koino szabályai a születéséből — a mai értékekkel kiegészítve (ami nincs megadva, az a mai). A hiányzó vagy régi
 * születés: a mai értékek.
 * @param {Object|null} szuletes - a koino `KoinoLetrehozas` eseménye
 * ⭐⭐ D129: ha a születés a kézikönyv szabályát viszi, a `kezikonyv` mező (`{ alapKuszobok }`, a hiányzók a
 * `KEZIKONYV_ALAP_KUSZOBOK`-ból); ha nem, a mező NINCS — a koinoban nincs kézikönyv.
 * @returns {{tudatpontKeret: number, kategoriaKorlat: number, tanusitasKell: number, felhatalmazasKell: number,
 *   alapKuszobok: Object, kezikonyv?: {alapKuszobok: Object}}}
 */
export function koinoSzabalyai(szuletes) {
  const sz = szuletes?.tipus === 'KoinoLetrehozas' ? szuletes.adat?.szabalyok : undefined;
  if (!sz || szabalyokAlakiHibaja(sz)) return ALAP_SZABALYOK;
  return Object.freeze({
    ...ALAP_SZABALYOK,
    ...Object.fromEntries(Object.entries(sz).filter(([k]) => k !== 'alapKuszobok' && k !== 'kezikonyv')),
    alapKuszobok: Object.freeze({ ...ALAP_SZABALYOK.alapKuszobok, ...(sz.alapKuszobok ?? {}) }),
    ...(sz.kezikonyv ? { kezikonyv: Object.freeze({
      alapKuszobok: Object.freeze({ ...KEZIKONYV_ALAP_KUSZOBOK, ...(sz.kezikonyv.alapKuszobok ?? {}) }) }) } : {})
  });
}

/**
 * ⭐⭐ D129: van-e a koinoban kézikönyv (a születése viszi-e a szabályát).
 * @param {Object} szabalyok - a `koinoSzabalyai` eredménye
 * @returns {boolean}
 */
export function kezikonyvesE(szabalyok) {
  return !!szabalyok?.kezikonyv;
}
