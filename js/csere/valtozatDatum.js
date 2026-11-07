// js/csere/valtozatDatum.js

// Felelősség: ⭐ D124 (④, ⑤) — A RÉGI LÉPÉSEK DÁTUMA, egy helyen: a régi nyelveké és szállításoké (`forditoSzel.js`) és a régi
// kiírt alakoké (`kiirtAlak.js`). Egy jegyzék-bejegyzés az n és az n+1 közti LÉPÉS, a `meddig` napjával (ÉÉÉÉ-HH-NN, UTC): azon a
// napon a program az n-est már nem beszéli (nem írja, nem olvassa). A legrégebbi még élő változat a legújabbtól lefelé jön, amíg a
// lépés megvan, és a dátuma még nem jött el.
//
// ⚠️ Szándékosan FÜGGŐSÉG NÉLKÜL: a kiírt alakok modulját a tiszta számítások (`cimjegyzek.js`, `meghivo.js`) is betöltik, a
// fordító-szél pedig a szelet-egyeztetést — ha a dátum ott élne, a kettő körbe töltené egymást. Két másolat helyett egy hely
// (a két sorrend tükörképe: egy forrásból).
//
// Használják: csere/forditoSzel.js, csere/kiirtAlak.js, próbák.

/** Egy nap ezredmásodpercben. */
export const NAP = 24 * 60 * 60 * 1000;
const DATUM = /^(\d{4})-(\d{2})-(\d{2})$/;

/** ⭐ A `meddig` napjának kezdete (UTC, ezredmásodperc) — vagy NaN, ha nem érvényes dátum. */
export function lepesLejarata(meddig) {
  const t = typeof meddig === 'string' ? DATUM.exec(meddig) : null;
  if (!t) return NaN;
  const ms = Date.UTC(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  return new Date(ms).toISOString().slice(0, 10) === meddig ? ms : NaN;
}

/**
 * ⭐ A legrégebbi változat, ami MOST még él: a legújabbtól lefelé, amíg a lépés megvan, és a dátuma még nem jött el.
 * @param {{legujabb: number, lepesek: Object}} keszlet
 * @param {number} most - ezredmásodperc (Date.now())
 */
export function legregebbiBeszelt(keszlet, most) {
  let n = keszlet.legujabb;
  while (n > 1) {
    const l = keszlet.lepesek?.[n - 1];
    if (!l || !(most < lepesLejarata(l.meddig))) break;
    n--;
  }
  return n;
}

/**
 * ⭐ A lépések dátumai a legrégebbi élő változattól (⑦ — a lap 30 nappal előtte szól): `[{ nyelv, meddig, napMulva }]` (a `nyelv`
 * a lépés alsó változata — a nyelvé, a szállításé és egy kiírt alaké ugyanígy).
 */
export function lejaroNyelvek(keszlet, most) {
  const lista = [];
  for (let n = legregebbiBeszelt(keszlet, most); n < keszlet.legujabb; n++) {
    const meddig = keszlet.lepesek[n].meddig;
    lista.push({ nyelv: n, meddig, napMulva: Math.ceil((lepesLejarata(meddig) - most) / NAP) });
  }
  return lista;
}

/** ⚠️ CSAK PRÓBÁNAK: a `napok` múlva eljövő nap (ÉÉÉÉ-HH-NN, UTC) — a kitalált lépések dátuma. */
export const napMulva = (napok, most) => new Date(Math.floor((most + napok * NAP) / NAP) * NAP).toISOString().slice(0, 10);

/**
 * ⚠️ CSAK PRÓBÁNAK: a kitalált lépés dátuma napokban a környezetből (`KOINO_PROBANYELV=10`, `KOINO_PROBAALAK=-1`: lejárt) — vagy
 * null, ha nincs beállítva.
 */
export function probaNapok(nev) {
  const v = globalThis.process?.env?.[nev];
  return typeof v === 'string' && /^-?\d{1,4}$/.test(v) ? Number(v) : null;
}
