// frontend/js/utils/javaslatMegnevezes.js

// ===== SZERKESZTÉSI / ÁLTALÁNOS JAVASLAT ÉS EGYEZMÉNY MEGNEVEZÉSE =====
// Felelősség: a javaslat- és egyezmény-kártya FELSŐ sorának (cím-sáv) szövegét
//   képzi a backend `javaslatTipus` enum-értékéből.
//   ⭐ Csaba (2026-11-20): „Az egyezményt, és a javaslat szót önmagában ne használjuk sehol. mindig vagy szerkesztési
//   javaslat/egyezmény, vagy általános javaslat/egyezmény.” Ezért a fajta áll elöl, a művelet zárójelben:
//   - a szerkesztési fajta: „Szerkesztési javaslat (módosítás)” / „Szerkesztési egyezmény (csomag)”;
//   - az általános fajta (a művelete az álláspont — `Allaspont`): „Általános javaslat” / „Általános egyezmény”.
//   (A prototípusban „Módosítási javaslat” / „Javaslat csomag” volt — a koinoban a prototípus már nincs befagyasztva.)
// Használják: JavaslatKartya, EgyezmenyKartya.

// A javaslatTipus enum főnévi alakjai (a zárójelbe).
const TIPUS_FONEV = {
  Torles:     'törlés',
  Modositas:  'módosítás',
  Egyesites:  'egyesítés',
  Athelyezes: 'áthelyezés',
  Csomag:     'csomag'
};

// Az általános javaslat (D27) művelete — a koino `szabalyok.js` `ALLASPONT_MUVELET`-je.
const ALLASPONT = 'Allaspont';

// ----- MEGNEVEZÉS KÉPZÉSE -----
// @param {string} javaslatTipus - a backend enum-értéke
//   (Torles / Modositas / Egyesites / Athelyezes / Csomag / Allaspont)
// @param {string} utotag - a második szó: 'javaslat' vagy 'egyezmény'
// @param {string} [fajta] - 'Szerkesztési' | 'Általános' (a kártya adataiból — `kartyaAdat.js` `javaslatFajta`)
// @returns {string} a fejléc felső sorának szövege
export function javaslatMegnevezes(javaslatTipus, utotag, fajta) {
  const altalanos = fajta === 'Általános' || javaslatTipus === ALLASPONT;
  if (altalanos) return `Általános ${utotag}`;
  const muvelet = TIPUS_FONEV[javaslatTipus];
  return `Szerkesztési ${utotag}` + (muvelet ? ` (${muvelet})` : '');
}
