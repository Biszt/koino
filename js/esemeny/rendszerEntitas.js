// js/esemeny/rendszerEntitas.js

// Felelősség: ⭐⭐ D129 (①, 2026-11-19) — A RENDSZER-ENTITÁS NEVE ÉS AZONOSÍTÓJA (a kézikönyv: az ⓘ jelek magyarázatai és a
// fogalomtár).
//
// Csaba: „ha létrehozzuk azt, hogy az összes i betü tartalmát, a rendszer létrehozza, strukturában, és az e-emberek javaslatokkal
// tudják módosítani. ezek lennének az első témák.”
//
// ⭐ A rendszer-entitásnak NINCS születési eseménye: a program hozza (az alap-tartalom — a mag NEM olvassa, lásd lent). Az
// azonosítója a NEVÉBŐL számolódik — mindenkinél, minden koinoban ugyanaz (a gyermek koino így a szülő kézikönyvét folytatja,
// ahogy a gondolatokét is) —, így bárki tehet rá tudatpontot és javaslatot, mint egy e-ember gondolatára.
//
// ⭐ A NÉV ÚTVONAL: `kezikonyv` a gyökér, alatta `/`-rel elválasztott szakaszok (kisbetű, szám, kötőjel) — pl.
// `kezikonyv/menu/kereses`. A szülő az útvonalból jön (`kezikonyv/menu`), tehát a fa helyét is minden program ugyanúgy számolja.
//
// ⛔⛔ A MAG NEM KAPJA MEG AZ ALAP-TARTALMAT (a szövegeket, sőt a nevek listáját sem): ha megkapná, minden új ⓘ (egy új menüpont
// magyarázata) „más számítás” lenne (D123), pedig az MA5 (A) szerint magától, költözés nélkül lép be. A mag annyit tud, hogy egy
// kézikönyv-entitás LÉTEZIK, ha egy esemény rá mutat — a nevét az esemény hozza (`adat.rendszer`), és a mag a névből ellenőrzi az
// azonosítót. A szövegét a program többi része (a pakli, a lap) az alap-tartalomból adja, amíg a közösség nem módosítja.
//
// Hálózatot és más modult (a lenyomaton kívül) nem importál. Használják: `esemeny.js` (a kapu, a bejelentés),
// `allapot/allapotSzamitas.js` (a létrehozás), `allapot/javaslatSzamitas.js`, `allapot/vallalas.js`, `koino.js`, a próbák.

import { lenyomatSzinkron } from './kanonikusAlak.js';

// ===================================
// A NÉV
// ===================================

/** A kézikönyv gyökerének neve. */
export const KEZIKONYV_GYOKER = 'kezikonyv';

/** Egy név legfeljebb ennyi szakasz (a gyökérrel együtt). */
export const NEV_SZINT_KORLAT = 8;

/** Egy név legfeljebb ennyi jel. */
export const NEV_HOSSZ_KORLAT = 160;

/** Egy esemény legfeljebb ennyi rendszer-entitás nevét hozhatja (`adat.rendszer`). */
export const ESEMENY_NEV_KORLAT = 8;

const SZAKASZ_MINTA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Érvényes kézikönyv-név-e: `kezikonyv`, vagy alatta legfeljebb 7 szakasz (kisbetű, szám, kötőjel — nem kezdődhet és nem
 * végződhet kötőjellel), összesen legfeljebb 160 jel.
 * @param {*} nev
 * @returns {boolean}
 */
export function rendszerNevE(nev) {
  if (typeof nev !== 'string' || nev.length > NEV_HOSSZ_KORLAT) return false;
  const szakaszok = nev.split('/');
  if (szakaszok[0] !== KEZIKONYV_GYOKER || szakaszok.length > NEV_SZINT_KORLAT) return false;
  return szakaszok.every((sz) => SZAKASZ_MINTA.test(sz));
}

/**
 * A név szülőjének neve — a gyökérnek nincs (null).
 * @param {string} nev
 * @returns {string|null}
 */
export function szuloNeve(nev) {
  const i = nev.lastIndexOf('/');
  return i < 0 ? null : nev.slice(0, i);
}

/**
 * A név és MINDEN felmenője, a gyökértől lefelé (`kezikonyv`, `kezikonyv/menu`, `kezikonyv/menu/kereses`).
 * @param {string} nev
 * @returns {Array<string>}
 */
export function nevEsFelmenoi(nev) {
  const szakaszok = nev.split('/');
  return szakaszok.map((_, i) => szakaszok.slice(0, i + 1).join('/'));
}

// ===================================
// AZ AZONOSÍTÓ
// ===================================

/**
 * A rendszer-entitás azonosítója a nevéből — a javaslat töredékeinek mintájára (`szabalyok.js` `toredekAzonosito`): a kanonikus
 * alak lenyomata, a `fajta` mezővel elválasztva minden más levezetett azonosítótól. Szinkron (az állapot-számítás szinkron).
 * @param {string} nev - érvényes kézikönyv-név
 * @returns {string} 43 jeles azonosító
 */
export function rendszerAzonosito(nev) {
  return lenyomatSzinkron({ fajta: 'kezikonyv', nev });
}

/** A kézikönyv gyökerének azonosítója (ennek a szeletébe jelentődik be minden kézikönyv-esemény, és ezt tartja mindenki). */
export const KEZIKONYV_GYOKER_AZONOSITO = rendszerAzonosito(KEZIKONYV_GYOKER);

// ===================================
// ⭐⭐ A KOINON — a közösség közös tárhelye mint tudatpont-tartó
// ===================================
//
// Csaba (2026-11-19): „hozzunk létre, egy koinon-t ami maga a program azon tárhelye, amit darabokban, replikálva, őriz meg, és neki,
// mondjuk végtelen tudatpontja lenne, és minden entitást, 1 tudatpontal hozza létre.” (A görög koinón: a közösség, a közös ügy — ebből
// a „koino” is.) A kézikönyv-entitás így NEM kivétel a D14 alól (amire senki nem rak tudatpontot, azt a koino elfelejti): 1 pontja
// mindig van — a koinoné. A közösség módosítása ezért pont nélkül is megmarad (MA4 (B)).
//
// ⛔ A koinon NEM e-ember: nem szavaz, nem javasol, nem ad érték javaslatot; a pontja PASSZÍV (a részvétel nevezőjébe nem számít), nem
// a tudatpont-keretből jön, és senki nem írja alá — minden készülék ugyanúgy számolja (a kézikönyvnél a nevekből). A szerző-kulcsok
// 43 jelesek; a „koinon” név velük nem ütközhet.

/** A koinon mint tartó (a hozzájárulók között ezen a néven áll). */
export const KOINON = 'koinon';

/** A koinon pontja egy kézikönyv-entitáson. */
export const KOINON_PONT = 1;

/** A koinon hozzájárulása (a hozzájárulók alakjában — passzív). */
export function koinonHozzajarulasa() {
  return { pont: KOINON_PONT, szerep: 'passziv' };
}

/**
 * Egy esemény rendszer-neveinek alaki hibája (a kapu kérdezi): hiányozhat; ha megvan, legfeljebb 8 érvényes név, ismétlés nélkül.
 * @param {*} nevek - az `adat.rendszer` mező
 * @returns {string|null} a hiba szövege, vagy null
 */
export function rendszerNevekAlakiHibaja(nevek) {
  if (nevek === undefined) return null;
  if (!Array.isArray(nevek) || nevek.length === 0 || nevek.length > ESEMENY_NEV_KORLAT) {
    return 'a rendszer-entitások neveinek listája 1–' + ESEMENY_NEV_KORLAT + ' név';
  }
  if (!nevek.every(rendszerNevE)) return 'érvénytelen kézikönyv-név (kezikonyv/… — kisbetű, szám, kötőjel)';
  if (new Set(nevek).size !== nevek.length) return 'egy kézikönyv-név kétszer';
  return null;
}

/**
 * Egy esemény rendszer-nevei (érvényes listánál; különben üres).
 * @param {Object} e
 * @returns {Array<string>}
 */
export function esemenyRendszerNevei(e) {
  const n = e?.adat?.rendszer;
  return n !== undefined && !rendszerNevekAlakiHibaja(n) ? n : [];
}
