// js/tar/memoriaTar.js

// Felelősség: ⭐⭐ D128 (②e2 — 17. pont, 9.13): A MEMÓRIABELI TÁR és a RÖGZÍTŐ TÁR — a helyreállítás bizonyítékához.
//
// A helyreállítás (a segítők jóváhagyása) egy koinóban (A) történik, de MINDEN koinóban érvényes (Csaba: „rendben”): a bizonyítéka
// magával viszi azokat az eseményeket, amikből a szerepek kiszámolhatók (a D93/2 tagsági csomag mintája). Ehhez két dolog kell:
//   · a RÖGZÍTŐ TÁR (\`rogzitoTar\`) — egy valódi tár köré tett burok, ami feljegyzi, mit olvasott ki belőle a szerep-ellenőrzés
//     (\`allapot/helyreallitas.js\` \`helyreallitasokAllapota\`): ami kellett a döntéshez, az a bizonyíték;
//   · a MEMÓRIABELI TÁR (\`memoriaTar\`) — a bizonyítékból: ugyanazokat a műveleteket adja, amiket a szerep-ellenőrzés kér
//     (\`esemeny\`, \`szeletEsemenyei\`, \`bejelentesek\`, \`lancEsemenyei\`, \`azonossagEsemenyei\`, \`kezelesEsemenyei\`, \`tanusitvany\`,
//     \`sorszamSzerint\`, \`betolt\`) — így bármelyik kapu ugyanazzal a kóddal számolja újra (egy szabály, egy forrás).
// ⚠️ Csak olvas: írni nem lehet bele (a bizonyíték nem nő).
//
// Használják: allapot/helyreallitas.js (a bizonyíték összeállítása és ellenőrzése), a próbák.

import { szelet, bejelentesHelyei, lancKulcsa } from '../esemeny/esemeny.js';
import { kezelesAzonossaga } from '../allapot/kizaras.js';

/**
 * Memóriabeli, csak olvasható tár egy esemény-listából (és a tanúsítványokból).
 * @param {Array<Object>} esemenyek
 * @param {Array<Object>} [tanusitvanyok]
 * @returns {Object} a tár-műveletek
 */
export function memoriaTar(esemenyek, tanusitvanyok = []) {
  const azon = new Map();
  for (const e of esemenyek ?? []) if (e && typeof e.azonosito === 'string' && !azon.has(e.azonosito)) azon.set(e.azonosito, e);
  const lista = [...azon.values()];
  const tan = new Map();
  for (const t of tanusitvanyok ?? []) if (t && typeof t.keszulek === 'string' && !tan.has(t.keszulek)) tan.set(t.keszulek, t);
  const szerint = (f) => lista.filter(f);
  return {
    mi: 'memoriaTar',
    async esemeny(azonosito) { return azon.get(azonosito); },
    async szeletEsemenyei(entitas) { return szerint((e) => szelet(e) === entitas); },
    async bejelentesek(horgony) { return szerint((e) => bejelentesHelyei(e).includes(horgony)); },
    async lancEsemenyei(lanc) { return szerint((e) => lancKulcsa(e) === lanc); },
    async azonossagEsemenyei(szerzo) { return szerint((e) => e.szerzo === szerzo); },
    async kezelesEsemenyei(azonossag) { return szerint((e) => kezelesAzonossaga(e) === azonossag); },
    async sorszamSzerint(lanc, sorszam) { return szerint((e) => lancKulcsa(e) === lanc && e.sorszam === sorszam); },
    async tanusitvany(keszulek) { return tan.get(keszulek) ?? null; },
    async betolt() { return [...lista]; }
  };
}

/**
 * A RÖGZÍTŐ TÁR — egy valódi tár köré: ugyanazok az olvasó műveletek, és minden kiolvasott eseményt és tanúsítványt feljegyez.
 * @param {Object} tar
 * @returns {{tar: Object, esemenyek: () => Array<Object>, tanusitvanyok: () => Array<Object>}}
 */
export function rogzitoTar(tar) {
  const latott = new Map();
  const tanusitvanyok = new Map();
  const jegyez = (x) => {
    for (const e of Array.isArray(x) ? x : [x]) {
      if (!e || typeof e.azonosito !== 'string') continue;
      latott.set(e.azonosito, e);
      if (e.tanusitvany && typeof e.tanusitvany.keszulek === 'string') tanusitvanyok.set(e.tanusitvany.keszulek, e.tanusitvany);
    }
    return x;
  };
  const burok = {
    mi: 'rogzitoTar',
    async esemeny(azonosito) { return jegyez(await tar.esemeny(azonosito)); },
    async szeletEsemenyei(entitas) { return jegyez(await tar.szeletEsemenyei(entitas)); },
    async lancEsemenyei(lanc) { return jegyez(await tar.lancEsemenyei(lanc)); },
    async sorszamSzerint(lanc, sorszam) { return jegyez(await tar.sorszamSzerint(lanc, sorszam)); },
    async betolt() { return jegyez(await tar.betolt()); },
    async tanusitvany(keszulek) {
      const t = typeof tar.tanusitvany === 'function' ? await tar.tanusitvany(keszulek) : null;
      if (t) tanusitvanyok.set(keszulek, t);
      return t ?? null;
    }
  };
  // A választható műveletek: csak ha a valódi tár is tudja (különben a hívó a maga útján megy — és az is rögzítve van).
  for (const m of ['bejelentesek', 'azonossagEsemenyei', 'kezelesEsemenyei']) {
    if (typeof tar[m] === 'function') burok[m] = async (x) => jegyez(await tar[m](x));
  }
  return { tar: burok, esemenyek: () => [...latott.values()], tanusitvanyok: () => [...tanusitvanyok.values()] };
}
