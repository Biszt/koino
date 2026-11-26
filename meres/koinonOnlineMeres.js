// meres/koinonOnlineMeres.js

// Felelősség: ⭐⭐ A 97. MÉRÉS — D130 ④ (a koinon fenntartó köre), Csaba elképzelése szerint (2026-11-26), az építés ELŐTT
// (`docs/koinon_atvizsgalas.md` 10.). Csaba: „20 - 50 online helyen … azt kéne számon tartani, hogy mennyien vannak online, egy adott
// egyezménynél. és ha ofline kerűl, az egyik tartó, akkor azt érzékelni kéne, és egy új eszköz lessz tartó” — „ne vándoróljon
// folyton, de a közös terhet, meg kell próbálnunk igazságossan szétosztani, úgy, hogy egy újabb általános egyezmény, azokhoz kerűljön,
// akik a legkevesebb általános egyezményt őrzik.”
//
// A szabály, amit mér: egy kosárnak (a koinon darabjának — benne az általános egyezmények EGÉSZBEN) MINDIG legyen T tartója ONLINE;
// ha kevesebb, egy új készülék lesz tartó (a kosarat egy online tartótól letölti); aki visszajön, tartó MARAD (az offline nem azonos
// az elmenttel — a Carbonite-minta, Chun és társai, 2006); a kosarat csak az elment tagok veszítik el.
//
// A kérdések:
//   A) hány tartó gyűlik össze egy kosárnál (a T és az elérhetőség aránya?), az órák hány részében van T-nél kevesebb online, és
//      hányban egy sem (akkor a kérő nem kapja meg);
//   B) ki legyen az új tartó — három szabály:
//      · sor: a kosár kulcs szerinti sorában a következő online készülék (a teherre nem néz);
//      · jelölt: a sorban következő 3 online készülék közül az, amelyik a legkevesebb általános egyezményt őrzi (a „két választás
//        ereje” — Azar és társai, 1994); a jelöltek a MOSTANI terhüket mondják meg (őket kérdezik);
//      · mindenki: az összes online készülék közül a legkevesebbet őrző — a terhekről szóló hír NAPONTA frissül (késik; Mitzenmacher,
//        2000: a késő hírre a „legkevesebb” torlódik);
//      mérve: a teher eloszlása (a legnagyobb az átlaghoz képest), az új tagok terhe, és hogy egy óra alatt hány új szerep jut egy
//      készülékre (a torlódás);
//   C) a pótlás forgalma, és mit változtat a nagyobb kosár (eggyel, kettővel sekélyebb), a T = 50, és ha a hiányt egyszerre pótolják.
//
// A modell: N0 alapító tag, a kosarak száma a mai képletből (2^floor(log2(N0 / r)), r = 20), minden készülék a kulcsa szerinti
// kosarat tartja (a természetes tartók — a ③). Az elérhetőség a 96. mérés három mintája, és egy negyedik: a telefonos minta ESTI
// alkalmakkal (a napi alkalmak 80%-a 17 és 23 óra között kezdődik — a napszak az alsó órákat mélyíti). Óránként: a kosár online
// tartóit megszámolja egy online tartó (a DHT-n — a pótláshoz forrás is kell: ha egy sincs online, abban az órában nincs pótlás);
// ha T-nél kevesebb, egyetlen új tartó lép be (változat: a teljes hiány egyszerre). A „stabil” koinoban senki nem megy el; a „fogyó”
// koinoban naponta a tagok 0,75%-a végleg elmegy (90 nap alatt ~49%), és 0,3% csatlakozik (az új tag a csatlakozáskor a saját
// kosarát tölti le). ⚠️ Egyszerűsítés: a mélység a futás alatt nem változik (a csatlakozók miatt sem). Az általános egyezmények
// száma tagonként 2 (feltevés — a koino még nem mérte), egyenként ~50 KB (a ② mérése: 35–91 KB).
//
// Futtatás: `node meres/koinonOnlineMeres.js` (nem próba: számokat ír ki, a `meres/eredmenyek.md` 97. szakaszába).
//
// ⭐⭐ A 98. MÉRÉS (2026-11-26, a KO14 (A) és a KO15 (A) után — a ④c átvizsgálása, kód előtt): a 97. mérés három dolgot „tudott”, amit
// a hálón máshogy kell megoldani — ez az E) szakasz méri meg, mit változtat rajta a háló:
//   · KI PÓTOL? A 97.-ben kosaranként óránként pontosan egy új tartó lépett be. A hálón a kosár MINDEN online tartója látja a hiányt,
//     és egymásról nem tudnak: a `sorsolas` szerint mindegyik 1/n eséllyel pótol (n: a látott tartók száma) — átlagosan egy, de néha
//     nulla, néha kettő-három;
//   · A DHT KÉSÉSE: a háló a lekapcsolt tartó hirdetését 30–60 percig még mutatja (58. mérés) — a `dhtKeses` szerint a látott szám az
//     ebben VAGY az előző órában fent lévő tartóké (a rosszabb eset: többet lát, mint ami van);
//   · HONNAN A JELÖLTEK? A 97.-ben a jelölt a kosár sorában következő online készülék volt (bárkit elér — ez egy DHT-ből vett véletlen
//     mintának felel meg). A hálón a pótló tartó a TÁRSAIT éri el olcsón: a kötéseit (`kotesek.js` — 3 rendszeres társ, legfeljebb 5:
//     itt a 3 sajátja és legfeljebb 2, aki őt kötötte meg), velük úgyis cserél, és a nyitó jelükből tudja, mennyit őriznek. A
//     `jeloltForras`: `sor` (a 97.), `kotesek` (csak az online kötések), `kotesek2` (és ha kevés, a kötéseim online kötései — a
//     kérdést a társam továbbadja). ⚠️ A kötések itt véletlenek (35. mérés), és az elment kötés helyett a készülék újat köt.
// Az alapértékek a 97. mérést adják vissza (a 98. kapcsolói külön véletlen-forrásból húznak).

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
// AZ ELÉRHETŐSÉG — a 96. mérés mintái (feltevések), és az esti változat
// ===================================
//
// · „mindig”: egy bekapcsolva hagyott gép — az órák 90%-ában fent;
// · „napi”: minden nap egy 2–6 órás alkalom, a kezdete naponta ±2 órát mozog;
// · „alkalmi”: a napok 2/7-én egy ilyen alkalom.
const MINTAK = {
  'gépes (30% mindig, 50% napi, 20% alkalmi)': { arany: [0.3, 0.5, 0.2], esti: false },
  'telefonos (10% mindig, 50% napi, 40% alkalmi)': { arany: [0.1, 0.5, 0.4], esti: false },
  'borúlátó (0% mindig, 40% napi, 60% alkalmi)': { arany: [0, 0.4, 0.6], esti: false },
  'telefonos, esti (mint a telefonos, a napi alkalmak 80%-a 17–23 óra között)': { arany: [0.1, 0.5, 0.4], esti: true }
};

/** Egy lapos rács: az i. készülék a h. órában fent van-e (`fent[i * orak + h]`). */
function fentRacs(db, orak, { arany, esti }, v) {
  const fent = new Uint8Array(db * orak);
  for (let i = 0; i < db; i++) {
    const x = v();
    const fajta = x < arany[0] ? 'mindig' : x < arany[0] + arany[1] ? 'napi' : 'alkalmi';
    const kezdet = esti && v() < 0.8 ? 17 + Math.floor(v() * 6) : Math.floor(v() * 24);
    const hossz = 2 + Math.floor(v() * 5);
    const sor = i * orak;
    for (let nap = 0; nap * 24 < orak; nap++) {
      if (fajta === 'mindig') {
        for (let o = 0; o < 24 && nap * 24 + o < orak; o++) fent[sor + nap * 24 + o] = v() < 0.9 ? 1 : 0;
        continue;
      }
      if (fajta === 'alkalmi' && v() >= 2 / 7) continue;
      const k = (kezdet + Math.floor(v() * 5) - 2 + 24) % 24;
      for (let o = 0; o < hossz; o++) { const h = nap * 24 + k + o; if (h < orak) fent[sor + h] = 1; }
    }
  }
  return fent;
}

// ===================================
// A SZIMULÁCIÓ
// ===================================

/**
 * @param {Object} b
 * @param {number} b.N0 - az alapító tagok száma
 * @param {{arany: Array<number>, esti: boolean}} b.minta - az elérhetőségi minta
 * @param {number} [b.T] - a cél: ennyi tartó legyen online
 * @param {'sor'|'jelolt'|'mindenki'} [b.szabaly] - ki legyen az új tartó
 * @param {number} [b.jeloltSzam] @param {boolean} [b.egyszerre] - a teljes hiány egy órában
 * @param {number} [b.melysegEltolas] - a kosarak mélysége a mai képlethez képest (−1: kétszer akkora kosarak)
 * @param {number} [b.napok] @param {number} [b.meresNapok] - az utolsó ennyi nap a mérés (előtte a beállás)
 * @param {number} [b.elmegy] - naponta a tagok ekkora része végleg elmegy @param {number} [b.csatlakozik] - N0 arányában naponta
 * @param {'sor'|'kotesek'|'kotesek2'} [b.jeloltForras] - ⭐ 98.: honnan a jelöltek (a `sor` a 97.)
 * @param {'egy'|'sorsolas'} [b.valasztas] - ⭐ 98.: óránként pontosan egy pótló (a 97.), vagy minden online tartó 1/n eséllyel
 * @param {boolean} [b.dhtKeses] - ⭐ 98.: a látott tartók az ebben vagy az előző órában fent lévők
 * @param {number} [b.kotesSzam] @param {number} [b.bejovoKorlat] - ⭐ 98.: a saját kötések, és legfeljebb ennyi, aki őt kötötte meg
 * @param {boolean} [b.jeloltKeses] - ⭐ 98.: a `sor` jelöltjei a DHT-n látott címek (az előző órában fent lévők is — ők nem felelnek)
 */
function szimulacio({ N0, minta, T = 20, szabaly = 'jelolt', jeloltSzam = 3, egyszerre = false, melysegEltolas = 0, napok = 90,
  meresNapok = 30, elmegy = 0, csatlakozik = 0, egyezmenyPerTag = 2, r = 20, mag = 1,
  jeloltForras = 'sor', valasztas = 'egy', dhtKeses = false, kotesSzam = 3, bejovoKorlat = 2, jeloltKeses = false }) {
  const v = veletlenForras(mag);
  // ⭐ 98.: a háló véletlene külön forrásból — a 97. mérés futása így bájtra ugyanaz marad
  const v2 = veletlenForras(mag + 98);
  const orak = napok * 24;
  const meresKezdet = (napok - meresNapok) * 24;

  // ===== A TAGOK: az alapítók (a 0. órában) és a csatlakozók =====
  const szuletes = new Array(N0).fill(0);
  for (let nap = 0; nap < napok; nap++) {
    const varhato = N0 * csatlakozik;
    const k = Math.floor(varhato) + (v() < varhato - Math.floor(varhato) ? 1 : 0);
    for (let j = 0; j < k; j++) szuletes.push(nap * 24 + Math.floor(v() * 24));
  }
  const db = szuletes.length;
  const halal = new Float64Array(db).fill(Infinity);
  if (elmegy > 0) for (let i = 0; i < db; i++) halal[i] = szuletes[i] + Math.floor(-Math.log(1 - v()) / elmegy * 24);
  const fent = fentRacs(db, orak, minta, v);
  for (let i = 0; i < db; i++) if (szuletes[i] > 0) fent[i * orak + szuletes[i]] = 1;   // a csatlakozáskor fent van

  // ===== A KOSARAK: a mai képlet mélysége (és az eltolása), a méretük, és a kulcs szerinti soruk =====
  const m = Math.max(0, Math.floor(Math.log2(N0 / r)) + melysegEltolas);
  const K = 2 ** m;
  const meret = new Int32Array(K);
  for (let e = 0; e < egyezmenyPerTag * N0; e++) meret[Math.floor(v() * K)]++;
  const sajat = new Int32Array(db);
  for (let i = 0; i < db; i++) sajat[i] = Math.floor(v() * K);
  const sorrend = [];
  for (let k = 0; k < K; k++) {
    const s = new Int32Array(db);
    for (let i = 0; i < db; i++) s[i] = i;
    for (let i = db - 1; i > 0; i--) { const j = Math.floor(v() * (i + 1)); const t = s[i]; s[i] = s[j]; s[j] = t; }
    sorrend.push(s);
  }

  // ===== AZ ÁLLAPOT =====
  const tarto = Array.from({ length: K }, () => []);
  const tartjaE = new Uint8Array(K * db);
  const teher = new Float64Array(db);        // hány általános egyezményt őriz
  const hirTeher = new Float64Array(db);     // a naponta frissülő hír (a „mindenki” szabályé)
  const fentMost = new Uint8Array(db);
  const dontetlen = new Float64Array(db);
  for (let i = 0; i < db; i++) dontetlen[i] = v();
  const felvesz = (k, i) => { tarto[k].push(i); tartjaE[k * db + i] = 1; teher[i] += meret[k]; };
  const csatlakozasSorrend = [...Array(db).keys()].sort((a, b) => szuletes[a] - szuletes[b]);
  let cs = 0;
  const elveszett = new Uint8Array(K);
  let kosarOra = 0, keves = 0, nulla = 0, onlineOssz = 0, potlas = 0, potlasMeret = 0, maxOraSzerep = 0;
  const oraOnline = new Float64Array(24), oraDarab = new Float64Array(24);

  // ===== ⭐ 98.: A KÖTÉSEK — a 3 saját (a csatlakozáskor véletlen élő tagok), és akik őt kötötték meg =====
  const kotesKell = jeloltForras !== 'sor';
  const kotesKi = kotesKell ? new Int32Array(db * kotesSzam).fill(-1) : null;
  const kotesBe = kotesKell ? Array.from({ length: db }, () => []) : null;
  const ujKotes = (i, h, mar) => {
    for (;;) {
      const p = Math.floor(v2() * db);
      if (p !== i && szuletes[p] <= h && halal[p] > h && !mar.includes(p)) { kotesBe[p].push(i); return p; }
    }
  };
  /** Az i. készülék társai a h. órában: a saját kötései (az elment helyett új), és legfeljebb `bejovoKorlat`, aki őt kötötte meg. */
  const tarsai = (i, h) => {
    const ki = [];
    for (let s = 0; s < kotesSzam; s++) {
      let p = kotesKi[i * kotesSzam + s];
      if (p < 0 || halal[p] <= h) { p = ujKotes(i, h, ki); kotesKi[i * kotesSzam + s] = p; }
      ki.push(p);
    }
    let be = 0;
    for (const p of kotesBe[i]) {
      if (be >= bejovoKorlat) break;
      if (halal[p] <= h || ki.includes(p)) continue;
      ki.push(p); be++;
    }
    return ki;
  };
  let kiserlet = 0, ures = 0;

  // ===== AZ ÓRÁK =====
  for (let h = 0; h < orak; h++) {
    while (cs < db && szuletes[csatlakozasSorrend[cs]] <= h) {
      const i = csatlakozasSorrend[cs++];
      if (halal[i] > h) felvesz(sajat[i], i);
      if (kotesKell && halal[i] > h) { const mar = []; for (let s = 0; s < kotesSzam; s++) mar.push(kotesKi[i * kotesSzam + s] = ujKotes(i, h, mar)); }
    }
    if (h % 24 === 0) hirTeher.set(teher);
    const online = [];
    for (let i = 0; i < db; i++) {
      const f = szuletes[i] <= h && h < halal[i] && fent[i * orak + h] ? 1 : 0;
      fentMost[i] = f;
      if (f) online.push(i);
    }
    const rendezett = szabaly === 'mindenki'
      ? online.slice().sort((a, b) => hirTeher[a] - hirTeher[b] || dontetlen[a] - dontetlen[b]) : null;
    // ki legyen az új tartó (csak online, és aki még nem tartja)
    const valaszt = (k) => {
      if (rendezett) { for (const i of rendezett) if (!tartjaE[k * db + i]) return i; return -1; }
      const s = sorrend[k];
      const kell = szabaly === 'sor' ? 1 : jeloltSzam;
      let legjobb = -1, talalt = 0;
      for (let p = 0; p < db && talalt < kell; p++) {
        const i = s[p];
        if (tartjaE[k * db + i]) continue;
        // ⭐ 98. (`jeloltKeses`): a DHT-ből vett minta a nemrég lekapcsoltak címét is adja — az a jelölt-helyek egyikét elviszi, de
        // nem felel (nem lehet belőle tartó)
        const lathato = fentMost[i] || (jeloltKeses && h > 0 && szuletes[i] <= h - 1 && halal[i] > h - 1 && fent[i * orak + h - 1] === 1);
        if (!lathato) continue;
        talalt++;
        if (fentMost[i] && (legjobb < 0 || teher[i] < teher[legjobb])) legjobb = i;
      }
      return legjobb;
    };
    // ⭐ 98.: a j. tartó jelöltjei a TÁRSAI közül (online, és még nem tartják): a kötései, és a `kotesek2`-nél a kötéseim online
    // kötései is (a kérdést a társam továbbadja) — legfeljebb `jeloltSzam`; a legkevesebbet őrző lesz az új tartó.
    const tarsValaszt = (k, j) => {
      let legjobb = -1, talalt = 0;
      const latta = new Set([j]);
      const nez = (p) => {
        if (latta.has(p)) return;
        latta.add(p);
        if (!fentMost[p] || tartjaE[k * db + p]) return;
        talalt++;
        if (legjobb < 0 || teher[p] < teher[legjobb]) legjobb = p;
      };
      const elso = tarsai(j, h);
      for (const p of elso) { if (talalt >= jeloltSzam) break; nez(p); }
      if (jeloltForras === 'kotesek2') {
        for (const p of elso) {
          if (talalt >= jeloltSzam) break;
          if (!fentMost[p]) continue;
          for (const q of tarsai(p, h)) { if (talalt >= jeloltSzam) break; nez(q); }
        }
      }
      return legjobb;
    };
    const oraSzerep = new Map();
    for (let k = 0; k < K; k++) {
      const t = tarto[k];
      let n = 0, nElozo = 0;
      for (let j = t.length - 1; j >= 0; j--) {
        const i = t[j];
        if (halal[i] <= h) { t[j] = t[t.length - 1]; t.pop(); tartjaE[k * db + i] = 0; continue; }   // elment — nem jön vissza
        n += fentMost[i];
        // ⭐ 98.: a DHT az előző órában fent lévő (most lekapcsolt) tartót még mutatja
        if (dhtKeses && !fentMost[i] && h > 0 && szuletes[i] <= h - 1 && fent[i * orak + h - 1]) nElozo++;
      }
      if (t.length === 0) { elveszett[k] = 1; continue; }
      if (h >= meresKezdet) {
        kosarOra++; onlineOssz += n;
        if (n < T) keves++;
        if (n === 0) nulla++;
        oraOnline[h % 24] += n; oraDarab[h % 24]++;
      }
      const latott = n + nElozo;
      if (latott >= T || n === 0) continue;   // elég látszik — vagy nincs forrás, ahonnan letölthetné
      // ⭐ 98.: ki pótol? — `egy`: óránként pontosan egy (a 97.; a kötéseknél egy véletlen online tartó); `sorsolas`: minden online
      // tartó 1/látott eséllyel (egymásról nem tudnak)
      const potlok = [];
      if (valasztas === 'sorsolas') {
        for (const i of t) if (fentMost[i] && v2() < 1 / latott) potlok.push(i);
      } else {
        let egyik = -1;
        if (kotesKell) { const on = t.filter((i) => fentMost[i]); egyik = on[Math.floor(v2() * on.length)]; }
        const kell = egyszerre ? T - n : 1;
        for (let x = 0; x < kell; x++) potlok.push(egyik);
      }
      for (const j of potlok) {
        const c = kotesKell ? tarsValaszt(k, j) : valaszt(k);
        if (kotesKell && h >= meresKezdet) { kiserlet++; if (c < 0) ures++; }
        if (c < 0) { if (kotesKell) continue; break; }
        felvesz(k, c);
        if (h >= meresKezdet) {
          potlas++; potlasMeret += meret[k];
          const s = (oraSzerep.get(c) ?? 0) + 1;
          oraSzerep.set(c, s);
          if (s > maxOraSzerep) maxOraSzerep = s;
        }
      }
    }
  }

  // ===== AZ EREDMÉNY (a 90. nap végén) =====
  const vege = orak - 1;
  const elok = [];
  for (let i = 0; i < db; i++) if (szuletes[i] <= vege && halal[i] > vege) elok.push(i);
  const rend = (t) => [...t].sort((a, b) => a - b);
  const p = (t, q) => t[Math.min(t.length - 1, Math.floor(q * t.length))];
  const atl = (t) => t.reduce((a, b) => a + b, 0) / Math.max(1, t.length);
  const terhek = rend(elok.map((i) => teher[i]));
  const ujak = elok.filter((i) => szuletes[i] > 0).map((i) => teher[i]);
  const alapitok = elok.filter((i) => szuletes[i] === 0).map((i) => teher[i]);
  const tartok = rend(tarto.map((t) => t.length));
  const segitoTeher = elok.reduce((a, i) => a + teher[i] - meret[sajat[i]], 0) / Math.max(1, elok.reduce((a, i) => a + teher[i], 0));
  let legalsoOra = 0;
  for (let o = 1; o < 24; o++) if (oraOnline[o] / oraDarab[o] < oraOnline[legalsoOra] / oraDarab[legalsoOra]) legalsoOra = o;
  return {
    m, K, elok: elok.length,
    tarto: { min: tartok[0], median: p(tartok, 0.5), max: tartok[tartok.length - 1] },
    keves: keves / Math.max(1, kosarOra), nulla: nulla / Math.max(1, kosarOra), onlineAtlag: onlineOssz / Math.max(1, kosarOra),
    legalsoOra, legalsoOraAtlag: oraOnline[legalsoOra] / Math.max(1, oraDarab[legalsoOra]),
    teher: { atlag: atl(terhek), p99: p(terhek, 0.99), max: terhek[terhek.length - 1] },
    ujArany: ujak.length ? atl(ujak) / atl(alapitok) : null,
    segitoTeher,
    potlasNaponta: potlas / meresNapok,
    potlasMBKeszulekenkentNaponta: potlasMeret * 50 / 1024 / Math.max(1, elok.length) / meresNapok,
    maxOraSzerep,
    elveszett: elveszett.reduce((a, b) => a + b, 0),
    // ⭐ 98.: a pótlási kísérletek hányadában nem volt egy jelölt sem a társak között
    uresArany: kiserlet ? ures / kiserlet : null
  };
}

// ===================================
// FUTTATÁS
// ===================================

const sz = (x, j = 1) => x.toFixed(j).replace('.', ',');
const MB = (db) => sz(db * 50 / 1024, 1) + ' MB';
const sor = (e) => 'tartó/kosár medián ' + e.tarto.median + ' (' + e.tarto.min + '–' + e.tarto.max + ') · T alatt ' + sz(e.keves * 100, 1)
  + '% · egy sem ' + sz(e.nulla * 100, 2) + '% · online átlag ' + sz(e.onlineAtlag, 0) + ' (a legalsó órában ' + sz(e.legalsoOraAtlag, 0)
  + ') · teher átlag ' + sz(e.teher.atlag, 0) + ' (' + MB(e.teher.atlag) + '), 99% ' + sz(e.teher.p99 / e.teher.atlag, 2)
  + '×, legnagyobb ' + sz(e.teher.max / e.teher.atlag, 2) + '×' + (e.ujArany === null ? '' : ', az új tagoké ' + sz(e.ujArany, 2) + '×')
  + ' · segítő teher ' + sz(e.segitoTeher * 100, 0) + '% · pótlás ' + sz(e.potlasMBKeszulekenkentNaponta, 2) + ' MB/készülék/nap'
  + ' · egy órában legfeljebb ' + e.maxOraSzerep + ' új szerep egy készüléken' + (e.elveszett ? ' · ⛔ ELVESZETT kosár: ' + e.elveszett : '')
  + (e.uresArany === null ? '' : ' · a kísérletek ' + sz(e.uresArany * 100, 0) + '%-ában nem volt jelölt');

const N0 = 10000;   // r = 20 mellett 8. mélység: 256 kosár, kosaranként átlagosan ~39 természetes tartó, ~78 általános egyezmény
const KOINOK = {
  'stabil (senki nem megy el)': {},
  'fogyó (naponta 0,75% elmegy, 0,3% csatlakozik)': { elmegy: 0.0075, csatlakozik: 0.003 }
};
const SZABALYOK = { 'sor': 'sor', 'jelölt (3)': 'jelolt', 'mindenki (napi hír)': 'mindenki' };

const csak = process.argv[2];   // pl. `node meres/koinonOnlineMeres.js A` — csak egy szakasz
const kezdes = Date.now();

if (!csak || csak === 'A') {
  console.log('A)+B) N0 = ' + N0 + ', r = 20 (8. mélység, 256 kosár), T = 20 online, 90 nap (a mérés az utolsó 30-on), egyesével pótolva');
  for (const [nev, minta] of Object.entries(MINTAK)) {
    for (const [knev, kb] of Object.entries(KOINOK)) {
      console.log('  ' + nev + ' · ' + knev);
      for (const [snev, szabaly] of Object.entries(SZABALYOK)) {
        const e = szimulacio({ N0, minta, szabaly, ...kb });
        console.log('    ' + snev + ': ' + sor(e));
      }
    }
  }
}

if (!csak || csak === 'C') {
  const VALTOZATOK = {
    'jelölt (10)': { jeloltSzam: 10 },
    'jelölt, a hiány egyszerre': { egyszerre: true },
    'jelölt, kétszer akkora kosarak (7. mélység)': { melysegEltolas: -1 },
    'jelölt, négyszer akkora kosarak (6. mélység)': { melysegEltolas: -2 },
    'jelölt, T = 50': { T: 50 }
  };
  console.log('C) VÁLTOZATOK (N0 = ' + N0 + ', a jelölt szabállyal)');
  for (const [nev, minta] of Object.entries(MINTAK)) {
    for (const [knev, kb] of Object.entries(KOINOK)) {
      console.log('  ' + nev + ' · ' + knev);
      for (const [vnev, vb] of Object.entries(VALTOZATOK)) {
        const e = szimulacio({ N0, minta, szabaly: 'jelolt', ...kb, ...vb });
        console.log('    ' + vnev + ': ' + sor(e));
      }
    }
  }
}

if (!csak || csak === 'D') {
  console.log('D) A KIS KOINO (N0 = 640: 5. mélység, 32 kosár, ~20 természetes tartó; jelölt, T = 20)');
  for (const [nev, minta] of Object.entries(MINTAK)) {
    for (const [knev, kb] of Object.entries(KOINOK)) {
      const e = szimulacio({ N0: 640, minta, szabaly: 'jelolt', ...kb });
      console.log('  ' + nev.split(' (')[0] + ' · ' + knev.split(' (')[0] + ': ' + sor(e) + ' · egy kosarat a tagok '
        + sz(e.tarto.median / e.elok * 100, 0) + '%-a tart');
    }
  }
}

if (!csak || csak === 'E') {
  // ⭐⭐ A 98. MÉRÉS — a háló három eltérése a 97.-től (KO14 (A): T = 20; KO15 (A): 10 jelölt)
  const HALO = {
    '97. (sor, pontosan egy)': { jeloltSzam: 10 },
    'sorsolás': { jeloltSzam: 10, valasztas: 'sorsolas' },
    'sorsolás + DHT-késés': { jeloltSzam: 10, valasztas: 'sorsolas', dhtKeses: true },
    'DHT-minta (10 látott cím) + sorsolás + DHT-késés': { jeloltSzam: 10, valasztas: 'sorsolas', dhtKeses: true, jeloltKeses: true },
    'kötések (≤5) + sorsolás + DHT-késés': { jeloltSzam: 10, valasztas: 'sorsolas', dhtKeses: true, jeloltForras: 'kotesek' },
    'kötések és továbbadás (10) + sorsolás + DHT-késés': { jeloltSzam: 10, valasztas: 'sorsolas', dhtKeses: true, jeloltForras: 'kotesek2' },
    // a DHT-késés kiegyenlítése: a LÁTOTT cél 25 — a rosszabb esetű késéssel, és késés nélkül (amennyibe a ráhagyás kerül)
    'látott cél 25: DHT-minta + sorsolás + DHT-késés': { jeloltSzam: 10, valasztas: 'sorsolas', dhtKeses: true, jeloltKeses: true, T: 25 },
    'látott cél 25: sorsolás, késés nélkül': { jeloltSzam: 10, valasztas: 'sorsolas', T: 25 }
  };
  console.log('E) A 98. MÉRÉS — A HÁLÓ (N0 = ' + N0 + ', T = 20, 10 jelölt)');
  for (const [nev, minta] of Object.entries(MINTAK)) {
    for (const [knev, kb] of Object.entries(KOINOK)) {
      console.log('  ' + nev + ' · ' + knev);
      for (const [hnev, hb] of Object.entries(HALO)) {
        const e = szimulacio({ N0, minta, szabaly: 'jelolt', ...kb, ...hb });
        console.log('    ' + hnev + ': ' + sor(e));
      }
    }
  }
}

console.log('(' + sz((Date.now() - kezdes) / 1000, 0) + ' s)');
