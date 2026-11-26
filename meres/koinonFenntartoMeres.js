// meres/koinonFenntartoMeres.js

// Felelősség: ⭐⭐ A 96. MÉRÉS — D130 ④ (a koinon fenntartó köre — KO11 (A), KO12 (A), 2026-11-26), az építés ELŐTT
// (`docs/koinon_atvizsgalas.md` 10.): a darab élő tartóinak SZÁMLÁLÁSA és a VÁLASZ, ha kevés.
//
// A kérdések (a KO12 (A) „a küszöb, az ablak és a visszalépés a 96. mérés szerint”):
//   A) mit lát a számláló — egy órás pillanatkép és egy 24 órás ablak (a különböző hirdetők) a valódi tartók arányában, három
//      elérhetőségi mintával (a koino még sosem mérte a készülékek elérhetőségét: ezek feltevések, nem tények);
//   B) a válasz: a SZOMSZÉD segít (a 2. szakasz 4. pontja: „a szomszéd szint tartóitól átveszi”) — ⛔ a saját darab számlálása nem
//      segítene: aki sekélyebbre lép, a TESTVÉR-darabot kapja meg, a sajátjának nem lesz több tartója. Ezért minden készülék a
//      testvér-darabja hirdetőit számolja (a természetes tartóit és a segítőit), és ha kevés, segít: a testvért is tartja és hirdeti
//      (eggyel sekélyebb). Hogy ne lengjen ki (mindenki egyszerre segít → sok → mindenki abbahagyja → kevés…): a segítés VALÓSZÍNŰSÉGE a
//      hiánnyal arányos, és a visszalépés küszöbe magasabb, mint a belépésé (hiszterézis). Mérve: a darabok valódi tartói az elment
//      tagok mellett, a segítők aránya (a teher) és a ki-be lépések száma.
//
// A modell: N ismert tag, ebből `elo` arányban élő készülék, véletlen kulccsal; a mélység mindenkinél floor(log2(N / r)) (a 95. mérés a
// becslés szórását már mérte — itt a fenntartó kör hatása a kérdés). Óránkénti lépés; egy készülék hirdetése abban az órában látszik,
// amikor fent van (a DHT 30–60 perc alatt felejt, a hirdetés 20 percenként — óvatos: csak a fent töltött óra). A számláló csak akkor
// néz, amikor ő maga is fent van. Döntés naponta egyszer (az első fent töltött órájában), 24 óra előzmény után.
//
// Futtatás: `node meres/koinonFenntartoMeres.js` (nem próba: számokat ír ki, a `meres/eredmenyek.md` 96. szakaszába).

// ===================================
// A VÉLETLEN — rögzített maggal (a futás megismételhető)
// ===================================

function veletlenForras(mag) {
  let a = mag >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===================================
// AZ ELÉRHETŐSÉG — három minta (feltevések)
// ===================================
//
// · „mindig”: egy bekapcsolva hagyott gép — az órák 90%-ában fent;
// · „napi”: minden nap egy 2–6 órás alkalom, a kezdete naponta ±2 órát mozog (a telefon este);
// · „alkalmi”: a napok 2/7-én egy ilyen alkalom.
const MINTAK = {
  'gépes (30% mindig, 50% napi, 20% alkalmi)': [0.3, 0.5, 0.2],
  'telefonos (10% mindig, 50% napi, 40% alkalmi)': [0.1, 0.5, 0.4],
  'borúlátó (0% mindig, 40% napi, 60% alkalmi)': [0, 0.4, 0.6]
};

function fentRacs(keszulekek, orak, arany, v) {
  const fent = keszulekek.map(() => new Uint8Array(orak));
  for (const f of fent) {
    const x = v();
    const fajta = x < arany[0] ? 'mindig' : x < arany[0] + arany[1] ? 'napi' : 'alkalmi';
    const kezdet = Math.floor(v() * 24);
    const hossz = 2 + Math.floor(v() * 5);
    for (let nap = 0; nap * 24 < orak; nap++) {
      if (fajta === 'mindig') {
        for (let o = 0; o < 24 && nap * 24 + o < orak; o++) f[nap * 24 + o] = v() < 0.9 ? 1 : 0;
        continue;
      }
      if (fajta === 'alkalmi' && v() >= 2 / 7) continue;
      const k = (kezdet + Math.floor(v() * 5) - 2 + 24) % 24;
      for (let o = 0; o < hossz; o++) { const h = nap * 24 + k + o; if (h < orak) f[h] = 1; }
    }
  }
  return fent;
}

// ===================================
// A SZIMULÁCIÓ
// ===================================

/**
 * @param {Object} b
 * @param {number} b.N - az ismert tagok száma
 * @param {number} b.elo - az élő készülékek aránya
 * @param {Array<number>} b.arany - az elérhetőségi minta
 * @param {boolean} b.szabaly - fut-e a válasz (a segítés)
 * @param {number} [b.r] @param {number} [b.ablak] - órában @param {number} [b.le] - a belépés küszöbe (látott hirdető)
 * @param {number} [b.fel] - a visszalépés küszöbe @param {number} [b.napok] @param {number} [b.mag]
 */
function szimulacio({ N, elo, arany, szabaly, r = 20, ablak = 24, le = r / 2, fel = 1.5 * r, napok = 30, mag = 1,
  viszony = false, csakErosek = 0 }) {
  const v = veletlenForras(mag);
  const m = Math.max(1, Math.floor(Math.log2(N / r)));
  const darabSzam = 2 ** m;
  const db = Math.round(N * elo);
  const darab = Array.from({ length: db }, () => Math.floor(v() * darabSzam));
  const testver = (d) => d ^ 1;
  const orak = napok * 24;
  const fent = fentRacs(darab, orak, arany, v);
  const segit = new Uint8Array(db);       // a testvér-darabot is tartja (eggyel sekélyebb)
  const latott = darab.map(() => new Map());   // a testvér hirdetői: készülék → utoljára mikor
  const sajatLatott = darab.map(() => new Map());   // a saját darabom hirdetői (a segítés valószínűségéhez)
  const utolsoDontes = new Int32Array(db).fill(-1);
  let valtas = 0;
  const pillanat = [];                    // A): egy órás pillanatkép a valódi tartók arányában
  // darabonként a hirdetők (óránként újraépítve)
  for (let h = 0; h < orak; h++) {
    const hirdetok = Array.from({ length: darabSzam }, () => []);
    for (let i = 0; i < db; i++) {
      if (!fent[i][h]) continue;
      hirdetok[darab[i]].push(i);
      if (segit[i]) hirdetok[testver(darab[i])].push(i);
    }
    for (let i = 0; i < db; i++) {
      if (!fent[i][h]) continue;
      for (const j of hirdetok[testver(darab[i])]) if (j !== i) latott[i].set(j, h);
      for (const j of hirdetok[darab[i]]) if (j !== i) sajatLatott[i].set(j, h);
      if (h === orak - 1 - 12) pillanat.push(hirdetok[darab[i]].length);
      // a döntés: naponta egyszer, a teljes ablak előzménye után
      if (!szabaly || h < Math.max(24, ablak) || (utolsoDontes[i] >= 0 && h - utolsoDontes[i] < 24)) continue;
      utolsoDontes[i] = h;
      // ⭐ változat (D): csak a sokat fent lévő készülék számol és segít — a saját fent töltött órái az utolsó héten
      if (csakErosek > 0) {
        let o = 0;
        for (let k = Math.max(0, h - 167); k <= h; k++) o += fent[i][k];
        if (o / Math.min(168, h + 1) < csakErosek) {
          if (segit[i]) { segit[i] = 0; valtas++; }
          continue;
        }
      }
      const ablakban = (t) => { let n = 0; for (const [j, mikor] of t) { if (h - mikor < ablak) n++; else t.delete(j); } return n; };
      const c = ablakban(latott[i]);
      const sajat = ablakban(sajatLatott[i]) + 1;
      // ⭐ változat (A): a testvér látott hirdetői a SAJÁT darabom látott hirdetőihez mérve (ugyanazokban az órákban néztem
      // mindkettőt — a saját elérhetőségem kiesik); a küszöbök ekkor arányok (a fele alatt be, másfélszerese fölött ki)
      const kevés = viszony ? c < sajat / 2 : c < le;
      const sok = viszony ? c >= sajat * 1.5 : c >= fel;
      if (!segit[i] && kevés) {
        // ⭐ a hiánnyal arányosan (a darabom látott tartói között szétosztva) — mindenki egyszerre ne lépjen
        const hiany = viszony ? sajat - c : r - c;
        if (v() < Math.min(1, hiany / sajat)) { segit[i] = 1; valtas++; }
      } else if (segit[i] && sok) { segit[i] = 0; valtas++; }
    }
  }
  // az eredmény: a darabok valódi (élő) tartói — természetes + segítő
  const tarto = new Array(darabSzam).fill(0);
  for (let i = 0; i < db; i++) { tarto[darab[i]]++; if (segit[i]) tarto[testver(darab[i])]++; }
  const termeszetes = new Array(darabSzam).fill(0);
  for (let i = 0; i < db; i++) termeszetes[darab[i]]++;
  // a 24 órás ablak (a szabály nélkül is): a saját darab látott hirdetői a valódi tartók arányában, a nap végén
  const ablakArany = [];
  for (let i = 0; i < db; i++) {
    let n = 0;
    for (const [, mikor] of sajatLatott[i]) if (orak - 1 - mikor < ablak) n++;
    ablakArany.push((n + 1) / Math.max(1, tarto[darab[i]]));
  }
  const rend = (t) => [...t].sort((a, b) => a - b);
  const p = (t, q) => t[Math.min(t.length - 1, Math.floor(q * t.length))];
  const ter = rend(termeszetes), tt = rend(tarto), aa = rend(ablakArany);
  return {
    m, darabSzam, db,
    termeszetes: { min: ter[0], p10: p(ter, 0.1), median: p(ter, 0.5) },
    tarto: { min: tt[0], p10: p(tt, 0.1), median: p(tt, 0.5), le: tt.filter((x) => x < le).length },
    segito: segit.reduce((a, b) => a + b, 0) / db,
    valtasNaponta: valtas / db / napok,
    pillanatAtlag: pillanat.reduce((a, b) => a + b, 0) / Math.max(1, pillanat.length),
    ablakArany: { p10: p(aa, 0.1), median: p(aa, 0.5) }
  };
}

// ===================================
// FUTTATÁS
// ===================================

const sz = (x, j = 1) => x.toFixed(j).replace('.', ',');
const N = 640;   // r = 20 mellett 5. mélység: 32 darab, darabonként átlagosan 20 ismert tag

console.log('A) MIT LÁT A SZÁMLÁLÓ — a saját darab látott hirdetői a valódi tartók arányában (minden tag él, a szabály nélkül)');
for (const [nev, arany] of Object.entries(MINTAK)) {
  const e = szimulacio({ N, elo: 1, arany, szabaly: false });
  console.log('  ' + nev + ': órás pillanatkép átlag ' + sz(e.pillanatAtlag) + ' hirdető (~20 tartóból) · 24 órás ablak: medián '
    + sz(e.ablakArany.median * 100, 0) + '%, a legalsó tized ' + sz(e.ablakArany.p10 * 100, 0) + '%');
}

const VALTOZATOK = {
  'v1 · mindenki számol, 24 órás ablak, 10 alatt be / 30 fölött ki': {},
  'v2 · mindenki számol, 7 napos ablak': { ablak: 168, napok: 45 },
  'v3 · viszonyszám (a testvér a saját darabom látott hirdetőinek fele alatt)': { viszony: true },
  'v4 · csak a sokat fent lévő (a héten az órák ≥ 50%-ában), 24 órás ablak': { csakErosek: 0.5 }
};
console.log('B) A VÁLASZ — a szomszéd segít (r = 20; a tartók: a darabok valódi, élő tartói a 30. napon)');
for (const [vnev, vb] of Object.entries(VALTOZATOK)) {
  console.log('  ' + vnev);
  for (const [nev, arany] of Object.entries(MINTAK)) {
    for (const elo of [1, 0.5, 0.3]) {
      const nelkul = szimulacio({ N, elo, arany, szabaly: false });
      const vele = szimulacio({ N, elo, arany, szabaly: true, ...vb });
      console.log('    ' + nev.split(' ')[0] + ', él ' + sz(elo * 100, 0) + '%: szabály nélkül min ' + nelkul.tarto.min + ' · tized '
        + nelkul.tarto.p10 + ' · medián ' + nelkul.tarto.median + ' → vele min ' + vele.tarto.min + ' · tized ' + vele.tarto.p10
        + ' · medián ' + vele.tarto.median + ' · segít ' + sz(vele.segito * 100, 0) + '% · ki-be ' + sz(vele.valtasNaponta * 30, 2)
        + '/készülék/hó');
    }
  }
}
