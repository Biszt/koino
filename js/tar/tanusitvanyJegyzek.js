// js/tar/tanusitvanyJegyzek.js

// Felelősség: ⭐⭐ D128 (ET-3 — a kulcs: több készülék és a helyreállítás) — A KÉSZÜLÉK-TANÚSÍTVÁNYOK JEGYZÉKE egy készüléken.
//
// Egy tanúsítványt a lánc első eseménye hoz (`esemeny.js` `tanusitvanyKell`); a tár ezt az eseményből ismeri. ⭐ De egy esemény
// a láncán KÍVÜL is utazik: egy döntési csomagban, egy lezárási összegzés mintájában, egy kérelem válaszában — ott a lánc első
// eseménye nincs vele (más szeleté), csak a tanúsítványa (D81: a bizonyíték az eseménnyel utazik). Ami így jött, azt a kapu
// ide jegyzi fel, és a tár ezután ebből is felel (`tanusitvany(keszulek)`).
//
// ⭐ KOINÓTÓL FÜGGETLEN (KU2 (A)): a tanúsítvány az azonosság minden koinójában érvényes — ezért a jegyzék a készülék mappájában
// van (a koinók mappái fölött), egy fájlban (`tanusitvanyok.jsonl`, soronként egy). Csak hozzáfűzés; két folyamat írhatja (a
// kettőzött sor ártalmatlan). ⛔ Egy gyorsítótárban sem bízunk vakon: beolvasáskor minden tanúsítványt újra ellenőrzünk.
// ⛔ Egy készüléket csak egy azonosság tanúsíthat: ami egy már ismert készüléket egy MÁSIK azonossághoz kötne, azt elvetjük.
//
// Használják: tar/fajlTar.js, tar/atmenetiTar.js (a `tanusitvany` és a `tanusitvanyFelvetele`), a kapu (`esemenyTar.js`).

import { readFile, appendFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tanusitvanyEllenorzese } from '../kulcs/keszulek.js';

/**
 * A jegyzék egy mappában.
 * @param {string} mappa - a készülék mappája (a koinók mappái fölött)
 * @returns {{fajl: string, keres: Function, felvesz: Function}}
 */
export function tanusitvanyJegyzek(mappa) {
  const fajl = join(mappa, 'tanusitvanyok.jsonl');
  const ismert = new Map();          // készülék → tanúsítvány (ellenőrizve)
  let olvasottMeret = -1;

  /** A fájl (újra)olvasása — csak ha a mérete változott (egy másik folyamat írt bele). */
  async function betolt() {
    let szoveg;
    try {
      const { size } = await stat(fajl);
      if (size === olvasottMeret) return;
      szoveg = await readFile(fajl, 'utf8');
      olvasottMeret = size;
    } catch {
      return;                          // még nincs jegyzék
    }
    for (const sor of szoveg.split('\n')) {
      if (!sor.trim()) continue;
      let t;
      try { t = JSON.parse(sor); } catch { continue; }
      if (!t || typeof t !== 'object' || ismert.has(t.keszulek)) continue;
      if ((await tanusitvanyEllenorzese(t)).rendben) ismert.set(t.keszulek, t);
    }
  }

  return {
    fajl,

    /**
     * Egy készülék tanúsítványa, ha a jegyzékben van.
     * @param {string} keszulek
     * @returns {Promise<Object|null>}
     */
    async keres(keszulek) {
      if (!ismert.has(keszulek)) await betolt();
      return ismert.get(keszulek) ?? null;
    },

    /**
     * Egy tanúsítvány felvétele — ellenőrzés után; ha a készüléket már egy MÁSIK azonosság tanúsította, elvetjük.
     * @param {Object} t
     * @returns {Promise<boolean>} igaz, ha a jegyzékben van (most vagy már előtte)
     */
    async felvesz(t) {
      if (!t || typeof t !== 'object') return false;
      if (!ismert.has(t.keszulek)) await betolt();
      const meglevo = ismert.get(t.keszulek);
      if (meglevo) return meglevo.azonossag === t.azonossag;
      if (!(await tanusitvanyEllenorzese(t)).rendben) return false;
      await mkdir(mappa, { recursive: true });
      await appendFile(fajl, JSON.stringify(t) + '\n');
      ismert.set(t.keszulek, t);
      console.log('tanusitvanyJegyzek - felvéve', { keszulek: t.keszulek.slice(0, 8) + '…' });
      return true;
    }
  };
}
