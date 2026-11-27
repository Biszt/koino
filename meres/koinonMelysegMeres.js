// meres/koinonMelysegMeres.js

// Felelősség: ⭐⭐ A 99. MÉRÉS — D130 ④c4 (a mélység változása), a KO18 ELŐTT (`docs/koinon_atvizsgalas.md` 11., 7. pont). A 97–98.
// mérés a koinon mélységét állandónak vette („⚠️ Egyszerűsítés: a mélység a futás alatt nem változik”). Itt a koino NŐ (30 naponként
// kétszeresére), és a mélység az ismert tagok számával lépésenként nő (`floor(log2(tagok / r))` — a ③c képlete): egy KETTÉVÁLÁSNÁL
// minden kosár két félre válik, és minden tartónak a saját fele lesz a természetes kosara. A kérdés (KO18): MI LEGYEN A MÁSIK FÉLLEL
// annál, aki eddig az egészet tartotta? Három szabály:
//   (A) MINDENT MEGTART — a mostani szabály szó szerint (Csaba: „leadni csak a megtelt készülék ad le”): a természetes tartó a saját
//       felét természetesként, a másikat segítőként tartja tovább, egy segítő mindkét felét. ⚠️ A szerepek a mélységgel FINOMODNAK (a
//       félekre bomlanak): a számlálás és a kérő csak a kosár és a SZÜLŐJE témáján keres (`koinonKeresoKulcsai`), egy két szinttel
//       durvább szerepet senki nem látna. Vág: a nyitó jel határa (32 segítő — `KOINON_KOSAR_JEL_KORLAT`; a legújabb esik ki) és a keret
//       (256 MB — `leadandoSegitok`);
//   (B) A FELE MARAD — kettéváláskor minden szerep a felére szűkül: a természetes a saját felére, a segítő a kevesebb tartójú felére;
//       a másik felet azonnal leadja (ahol kell, a pótlás pótolja — ④c3);
//   (C) ÁTADJA — mindkét fél marad, de a nem saját fél (és egy segítő mindkét fele) csak addig, amíg NÉLKÜLE is megvan a látott cél:
//       ha egymás után 12 ellenőrzésen (az órák, amikor fent van) nélküle is legalább 25 tartó látszik, leadja — így nem vándorol
//       folyton (a 97. mérés kérése). A saját fele mindig marad.
// Mérve (a növekedés 120 napján): az elérhetőség — az órák hány részében van egy MOSTANI mélységű kosárnak 20-nál kevesebb VALÓBAN
// online tartója (a kosáron és a szülőjén — ahol a kérő keres), és hányban egy sem; ugyanez a kettéválások utáni 3 napban; a teher a
// végén (az átlag, a legnagyobb, az alapítóké, a keretnél hány készülék); a segítő szerepek száma (a jel határa); a pótlás forgalma
// (naponta, átlagosan és a legrosszabb napon); és hány szerepet adtak le (a kettéválásnál, az átadással, a keret és a jel határa miatt).
//
// A modell (a 97–98. mérés feltevései, ahol lehet): r = 20, a pótlás a ④c3 szerint — a látott cél 25 (KO17 (A)), a DHT késése a
// rosszabb esetben (a látott szám az ebben VAGY az előző órában fent lévő tartóké), a kosár minden online tartója 1/n eséllyel pótol
// (készülékenként óránként egy pótlás), a jelöltek egy DHT-minta 10 látott címe (a nemrég lekapcsoltak is elvisznek egy helyet — nem
// felelnek), a legkevesebbet őrző kapja (KO15 (A)); a jelölt elutasít, ha a kosár nem a mélységén van (±1), ha már tartja (a kosarat
// vagy egy ősét), ha a jel határán vagy a keret fölött van, és óránként legfeljebb egy új szerepet vállal (④c2). Az elérhetőség a 97.
// négy mintája. A koino 30 napig 640 tagon áll (a beállás — 5. mélység), utána 120 napig naponta nő (30 naponként kétszeres: ~10 240
// tag, 9. mélység — négy kettéválás). A „fogyó” változatban naponta a tagok 0,75%-a végleg elmegy (a csatlakozás ezt is pótolja), és
// az ismert tagok száma az elmentekkel együtt nő (a horgonyaik maradnak — a ③c): a mélység így mélyebb, mint amit az élők indokolnak.
// Egy készülék a kettéválást a globális változás (vagy a csatlakozása) után 0–48 órával veszi észre (a tagság a cseréken terjed), és
// csak fent; egy friss tag eggyel sekélyebben kezd (`frissElmarad` — a ③ alulbecslése: kevesebb tagot ismer). Az általános egyezmények
// száma tagonként 2 (feltevés — a 97. is), egyenként ~50 KB; a csatlakozáskor jönnek létre, a lenyomat-térben egyenletesen.
//
// Futtatás: `node meres/koinonMelysegMeres.js` (nem próba: számokat ír ki, a `meres/eredmenyek.md` 99. szakaszába; ~12 perc);
// `node meres/koinonMelysegMeres.js A` — csak egy szakasz: A (a négy szabály × két észrevételi idő, a négy mintán, növekvő és fogyó
// koino), B (változatok: a (C) türelme, a friss tag, az átmenet két másik javítása), D (a nagyszülő témáján is keres — KO19 (A)), C (egy
// ötödik kettéválás); `… egy <A|B|C|D vagy JSON> [minta-sorszám]` — egyetlen futás. `KOINO_DIAG=1`: egy nappal a kettéválás után a
// szerepek mélysége a mostanihoz képest (ebből jött a lelet: a nagyszülő szintjén ragadt segítő szerepek).
// ⭐ A LELET: a kettéválás utáni gödör LÁTHATÓSÁG, nem adathiány — az átmenetben a régi mélységű tartó a kosarát ürülni látja (aki már
// kettévált, a felét tartja), pótol, és egy mélyebb jelölt (±1) elvállalja a nagy régi kosarat; a következő kettéváláskor ez a szerep a
// nagyszülő szintjére kerül, ahol a kérő és a számláló nem keres.

// ===================================
// A VÉLETLEN ÉS AZ ELÉRHETŐSÉG — a 97. mérés (`koinonOnlineMeres.js`) függvényei, változatlanul
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

const MINTAK = {
  'gépes (30% mindig, 50% napi, 20% alkalmi)': { arany: [0.3, 0.5, 0.2], esti: false },
  'telefonos (10% mindig, 50% napi, 40% alkalmi)': { arany: [0.1, 0.5, 0.4], esti: false },
  'borúlátó (0% mindig, 40% napi, 60% alkalmi)': { arany: [0, 0.4, 0.6], esti: false },
  'telefonos, esti (mint a telefonos, a napi alkalmak 80%-a 17–23 óra között)': { arany: [0.1, 0.5, 0.4], esti: true }
};

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
// A LENYOMAT-TÉR — a kosarak kulcsa „kupac-szám”: (1 << mélység) | darab (a szülő k >> 1, a felek 2k és 2k + 1)
// ===================================

const BITEK = 16;                       // a tér felbontása (a kosarak mélysége legfeljebb ennyi)
const VODOR = 1 << BITEK;
const EGYEZMENY_KB = 50;
const KERET_KB = 256 * 1024;            // ④c2: `KOINON_KERET_ALAP_MB`
const JEL_KORLAT = 32;                  // ④c1: `KOINON_KOSAR_JEL_KORLAT`
const JELOLT = 10;                      // KO15 (A)

const melyseg = (k) => 31 - Math.clz32(k);
const tartomany = (k) => { const m = melyseg(k); const d = k - (1 << m); return [d << (BITEK - m), (d + 1) << (BITEK - m)]; };
/** Az `a` kosár tartalmazza-e a `b`-t (ugyanaz, vagy egy őse). */
const ose = (a, b) => { const ma = melyseg(a), mb = melyseg(b); return ma <= mb && (b >>> (mb - ma)) === a; };
/** A kérő a kosár és a szülője témáján keres — a 0. mélységű szülőt senki nem hirdeti (`koinonKeresoKulcsai`). */
const keresoKulcsok = (k) => (melyseg(k) >= 2 ? [k, k >> 1] : [k]);

/** Egy Fenwick-fa a vödrök egyezmény-számára (az előtag-összeg: [0, i)). */
function fenwick(n) {
  const f = new Int32Array(n + 1);
  return {
    add(i, x) { for (i++; i <= n; i += i & -i) f[i] += x; },
    elotag(i) { let s = 0; for (; i > 0; i -= i & -i) s += f[i]; return s; }
  };
}

// ===================================
// A SZIMULÁCIÓ
// ===================================

/**
 * @param {Object} b
 * @param {{arany: Array<number>, esti: boolean}} b.minta
 * @param {'A'|'B'|'C'} b.szabaly - a kettéválás szabálya (fent)
 * @returns {Object} az eredmény (lent)
 */
function szimulacio({ minta, szabaly, N0 = 640, r = 20, T = 20, latottCel = 25, beallasNapok = 30, novekedesNapok = 120, duplazas = 30,
  elmegy = 0, egyezmenyPerTag = 2, atadasSor = 12, frissElmarad = 1, eszrevetel = 48, durvabbat = true, gyermekek = false,
  nagyszuloKeres = false, mag = 1 }) {
  // `nagyszuloKeres` — a kérő ÉS a számláló a nagyszülő-kosár témáján is keres (a 3. mélységtől; egy keresés, csak hiány esetén)
  const keresoKulcsai = (k) => (nagyszuloKeres && melyseg(k) >= 3 ? [k, k >> 1, k >> 2] : keresoKulcsok(k));
  // ⭐ Az átmenet javításai (a mérés lelete — lent): `eszrevetel` — hány órán belül veszi észre egy fent lévő készülék a kettéválást
  // (48: a tagság a cseréken terjed; 6: a társai nyitó jeléből — a mélységük a `knd`-ben, D110 mintájára); `durvabbat` — a jelölt
  // elvállal-e a mélységénél EGGYEL DURVÁBB kosarat (a ④c2 ±1-e; `false`: csak a sajátját vagy eggyel mélyebbet); `gyermekek` — a
  // számláló a kosár két FELÉNEK tartóit is látja (a kisebbik számot — együtt az egészet tartják).
  const v = veletlenForras(mag);
  const v2 = veletlenForras(mag + 99);
  const napok = beallasNapok + novekedesNapok;
  const orak = napok * 24;
  const meresKezdet = beallasNapok * 24;

  // ===== A TAGOK — az alapítók, a napi csatlakozás (az élők arányában) és az elmenés =====
  const szuletes = [], halal = [];
  const halalOra = (sz) => (elmegy > 0 ? sz + Math.floor(-Math.log(1 - v()) / elmegy * 24) : Infinity);
  for (let i = 0; i < N0; i++) { szuletes.push(0); halal.push(halalOra(0)); }
  const g = 2 ** (1 / duplazas) - 1;
  for (let nap = 0; nap < napok; nap++) {
    let el = 0;
    for (let i = 0; i < szuletes.length; i++) if (szuletes[i] <= nap * 24 && halal[i] > nap * 24) el++;
    const varhato = el * ((nap >= beallasNapok ? g : 0) + elmegy);
    const k = Math.floor(varhato) + (v() < varhato - Math.floor(varhato) ? 1 : 0);
    for (let j = 0; j < k; j++) { const sz = nap * 24 + Math.floor(v() * 24); szuletes.push(sz); halal.push(halalOra(sz)); }
  }
  const db = szuletes.length;
  const x = new Int32Array(db);
  for (let i = 0; i < db; i++) x[i] = Math.floor(v() * VODOR);
  const keses = new Int32Array(db);
  for (let i = 0; i < db; i++) keses[i] = Math.floor(v() * eszrevetel);
  const fent = fentRacs(db, orak, minta, v);
  for (let i = 0; i < db; i++) if (szuletes[i] > 0 && szuletes[i] < orak) fent[i * orak + szuletes[i]] = 1;
  const csatSor = [...Array(db).keys()].sort((a, b) => szuletes[a] - szuletes[b]);
  const halSor = [...Array(db).keys()].filter((i) => halal[i] < orak).sort((a, b) => halal[a] - halal[b]);

  // ===== AZ ÁLLAPOT =====
  const E = fenwick(VODOR);
  const darab = (k) => { const [a, b] = tartomany(k); return E.elotag(b) - E.elotag(a); };
  const szerepek = Array.from({ length: db }, () => []);     // { k, f: 0 természetes | 1 segítő | 2 örökölt (C), ido, sor }
  const tartok = new Map();                                   // kosár → a tartói
  const md = new Int8Array(db).fill(-1);                      // a készülék mélysége
  const ujSzerepOra = new Int32Array(db).fill(-1);
  const potloltOra = new Int32Array(db).fill(-1);
  const fentMost = new Uint8Array(db);
  const jel = new Int32Array(db);
  let belyeg = 0;
  const elok = [], eloHely = new Int32Array(db).fill(-1);
  let csatlakozott = 0, M = 0, Mvaltas = 0;
  const kettevalasok = [];
  const leadas = { kettevalas: 0, atadas: 0, keret: 0, jel: 0 };

  const hozzaad = (i, k, f, ido) => {
    szerepek[i].push({ k, f, ido, sor: 0 });
    let t = tartok.get(k);
    if (!t) tartok.set(k, (t = []));
    t.push(i);
  };
  const elvesz = (i, s) => {
    const l = szerepek[i];
    const p = l.indexOf(s);
    l[p] = l[l.length - 1]; l.pop();
    const t = tartok.get(s.k);
    const q = t.indexOf(i);
    t[q] = t[t.length - 1]; t.pop();
    if (!t.length) tartok.delete(s.k);
  };
  /** A teher (egyezmények száma): a szerepek uniója — a kupac-kosarak vagy egymásba esnek, vagy diszjunktak. */
  const teher = (i) => {
    const iv = szerepek[i].map((s) => tartomany(s.k)).sort((p, q) => p[0] - q[0] || q[1] - p[1]);
    let s = 0, veg = -1;
    for (const [a, b] of iv) { if (b <= veg) continue; s += E.elotag(b) - E.elotag(a); veg = b; }
    return s;
  };
  const tartjaE = (i, k) => szerepek[i].some((s) => ose(s.k, k));
  const segitoDb = (i) => szerepek[i].reduce((a, s) => a + (s.f !== 0 ? 1 : 0), 0);
  /** A legújabb segítő szerepek leadása, amíg a feltétel áll (a saját kosarat soha). */
  const legujabbLe = (i, kell, ok) => {
    while (kell()) {
      let u = null;
      for (const s of szerepek[i]) if (s.f !== 0 && (!u || s.ido > u.ido)) u = s;
      if (!u) return;
      elvesz(i, u);
      leadas[ok]++;
    }
  };
  const jelHatar = (i) => legujabbLe(i, () => segitoDb(i) > JEL_KORLAT, 'jel');
  const keretHatar = (i) => legujabbLe(i, () => teher(i) * EGYEZMENY_KB > KERET_KB, 'keret');
  const sajatKulcs = (i, m) => (1 << m) | (x[i] >> (BITEK - m));

  /** Egy kettéválás a készüléken (m → m + 1): a mélységén és fölötte lévő szerepei a felekre bomlanak, a szabály szerint. */
  const hasit = (i, h) => {
    const m = md[i];
    for (const s of szerepek[i].filter((y) => melyseg(y.k) <= m)) {
      elvesz(i, s);
      const c0 = s.k * 2, c1 = s.k * 2 + 1;
      if (s.f === 0) {
        const sajat = sajatKulcs(i, m + 1);
        hozzaad(i, sajat, 0, s.ido);
        const masik = sajat === c0 ? c1 : c0;
        if (szabaly === 'A') hozzaad(i, masik, 1, h);
        else if (szabaly === 'C' || szabaly === 'D') hozzaad(i, masik, 2, h);
        else leadas.kettevalas++;
      } else if (szabaly === 'B') {
        const n0 = tartok.get(c0)?.length ?? 0, n1 = tartok.get(c1)?.length ?? 0;
        hozzaad(i, n0 < n1 || (n0 === n1 && v2() < 0.5) ? c0 : c1, s.f, s.ido);
        leadas.kettevalas++;
      } else {
        const f = szabaly === 'C' || szabaly === 'D' ? 2 : s.f;
        hozzaad(i, c0, f, s.ido);
        hozzaad(i, c1, f, s.ido);
      }
    }
    md[i] = m + 1;
    jelHatar(i);
  };

  /**
   * A kosár látott tartói (a DHT-késéssel: az ebben vagy az előző órában fent lévők) a kosáron és a szülőjén. A `nagyszulo` csak a
   * mérés kérdése: a NAGYSZÜLŐ tartói is (ők is tartják, de a kérő ott nem keres — megvan-e az adat, csak nem látszik?).
   */
  const latott = (k, h, kesessel = true, nagyszulo = false, felek = false) => {
    belyeg++;
    let n = 0;
    const lat = (i) => fentMost[i] || (kesessel && h > 0 && szuletes[i] <= h - 1 && fent[i * orak + h - 1]);
    for (const kk of nagyszulo && melyseg(k) >= 3 ? [k, k >> 1, k >> 2] : keresoKulcsai(k)) {
      const t = tartok.get(kk);
      if (!t) continue;
      for (const i of t) {
        if (jel[i] === belyeg) continue;
        if (lat(i)) { jel[i] = belyeg; n++; }
      }
    }
    // a két fél tartói (a kisebbik szám — aki mindkettőt tartja, mindkettőben számít)
    if (felek && melyseg(k) < BITEK) {
      const fel = (kk) => { let c = 0; for (const i of tartok.get(kk) ?? []) if (jel[i] !== belyeg && lat(i)) c++; return c; };
      n += Math.min(fel(2 * k), fel(2 * k + 1));
    }
    return n;
  };

  // ===== A MÉRÉS GYŰJTŐI =====
  let kosarOra = 0, keves = 0, nulla = 0, onlineOssz = 0;
  let utanOra = 0, utanKeves = 0, utanNulla = 0, utanKevesNagyszulovel = 0, sekelyOra = 0, sekelyKeves = 0, regiArany = 0, fentArany = 0;
  const oraOnline = new Float64Array(24), oraDarab = new Float64Array(24);
  let potlasDb = 0, potlasKB = 0, legrosszabbNapKB = 0, napKB = 0, napElok = 0;
  let belepoKB = 0;

  // ===== AZ ÓRÁK =====
  let cs = 0, hs = 0;
  for (let h = 0; h < orak; h++) {
    // a csatlakozók (a mélységük eggyel sekélyebb lehet — ③ alulbecslés), az egyezményeik, és a globális mélység
    while (cs < db && szuletes[csatSor[cs]] <= h) {
      const i = csatSor[cs++];
      csatlakozott++;
      for (let e = 0; e < egyezmenyPerTag; e++) E.add(Math.floor(v() * VODOR), 1);
      const ujM = csatlakozott < 2 * r ? 0 : Math.min(BITEK, Math.floor(Math.log2(csatlakozott / r)));
      if (ujM > M) { M = ujM; Mvaltas = h; if (h >= meresKezdet) kettevalasok.push(h); }
      if (halal[i] <= h) continue;
      md[i] = Math.max(0, M - (szuletes[i] > 0 ? frissElmarad : 0));
      hozzaad(i, sajatKulcs(i, md[i]), 0, h);
      eloHely[i] = elok.length; elok.push(i);
      if (h >= meresKezdet) belepoKB += teher(i) * EGYEZMENY_KB;
    }
    // az elmentek (nem jönnek vissza — a szerepeik velük mennek)
    while (hs < halSor.length && halal[halSor[hs]] <= h) {
      const i = halSor[hs++];
      if (eloHely[i] < 0) continue;
      for (const s of [...szerepek[i]]) elvesz(i, s);
      const p = eloHely[i], u = elok[elok.length - 1];
      elok[p] = u; eloHely[u] = p; elok.pop(); eloHely[i] = -1;
    }
    for (const i of elok) fentMost[i] = fent[i * orak + h];
    // a mélység: a fent lévő készülék a kettéválást (a csatlakozása után) késve veszi észre
    for (const i of elok) {
      if (!fentMost[i] || md[i] >= M || h < Math.max(Mvaltas, szuletes[i]) + keses[i]) continue;
      while (md[i] < M) hasit(i, h);
    }
    // (C): az örökölt fél leadása, ha nélkülem is egymás után `atadasSor` ellenőrzésen megvan a látott cél. (C′, `D`): ha nélkülem is
    // megvan, 1/n eséllyel (n: a látott tartók nélkülem) — mint a pótlás sorsolása: kosaranként óránként átlagosan egy adja le
    if (szabaly === 'C' || szabaly === 'D') {
      for (const i of elok) {
        if (!fentMost[i]) continue;
        for (const s of szerepek[i].filter((y) => y.f === 2)) {
          const n = latott(s.k, h, true, false, gyermekek) - 1;
          s.sor = n >= latottCel ? s.sor + 1 : 0;
          if (szabaly === 'C' ? s.sor >= atadasSor : n >= latottCel && v2() < 1 / n) { elvesz(i, s); leadas.atadas++; }
        }
      }
    }
    // a pótlás (④c3): a kosár minden online tartója 1/n eséllyel, a DHT-minta 10 látott címéből a legkevesebbet őrző
    for (const k of [...tartok.keys()]) {
      if (melyseg(k) === 0) continue;
      const t = tartok.get(k);
      if (!t) continue;
      const fentiek = t.filter((i) => fentMost[i]);
      if (!fentiek.length) continue;
      const n = latott(k, h, true, false, gyermekek);
      if (n >= latottCel) continue;
      for (const j of fentiek) {
        if (potloltOra[j] === h || v2() >= 1 / n) continue;
        potloltOra[j] = h;
        let legjobb = -1, legjobbT = Infinity, talalt = 0;
        for (let p = 0; p < 400 && talalt < JELOLT; p++) {
          const c = elok[Math.floor(v2() * elok.length)];
          const lathato = fentMost[c] || (h > 0 && szuletes[c] <= h - 1 && fent[c * orak + h - 1]);
          if (c === j || !lathato || tartjaE(c, k)) continue;
          talalt++;
          const elteres = melyseg(k) - md[c];   // + : a kosár mélyebb a jelöltnél, − : durvább
          if (!fentMost[c] || Math.abs(elteres) > 1 || (!durvabbat && elteres < 0) || ujSzerepOra[c] === h
            || segitoDb(c) >= JEL_KORLAT) continue;
          const tc = teher(c);
          if (tc * EGYEZMENY_KB >= KERET_KB || tc >= legjobbT) continue;
          legjobb = c; legjobbT = tc;
        }
        if (legjobb < 0) continue;
        hozzaad(legjobb, k, 1, h);
        ujSzerepOra[legjobb] = h;
        if (h >= meresKezdet) { potlasDb++; const kb = (teher(legjobb) - legjobbT) * EGYEZMENY_KB; potlasKB += kb; napKB += kb; }
      }
    }
    // a keret (naponta: az egyezmények száma nő, a teher vele)
    if (h % 24 === 23) {
      for (const i of elok) keretHatar(i);
      if (h >= meresKezdet) { legrosszabbNapKB = Math.max(legrosszabbNapKB, napKB / Math.max(1, elok.length)); napElok += elok.length; }
      napKB = 0;
    }
    // ⚠️ DIAGNOSZTIKA (KOINO_DIAG): egy nappal a kettéválás után — a szerepek mélysége a mostanihoz képest, fajtánként és a készülék
    // mélysége szerint (kik a nagyszülő szintjén?)
    if (process.env.KOINO_DIAG && kettevalasok.length && h === kettevalasok[kettevalasok.length - 1] + 24) {
      const hist = {};
      for (const i of elok) for (const s of szerepek[i]) {
        const kulcs = 'szerep ' + (melyseg(s.k) - M) + ' · ' + ['term', 'seg', 'orok'][s.f] + ' · készülék ' + (md[i] - M);
        hist[kulcs] = (hist[kulcs] ?? 0) + 1;
      }
      console.log('DIAG h=' + h + ' M=' + M, JSON.stringify(Object.entries(hist).sort((a, b) => b[1] - a[1])));
    }
    // a mérés: a MOSTANI mélység kosarai — a valóban online tartók a kosáron és a szülőjén (ahol a kérő keres)
    if (h >= meresKezdet && M >= 1) {
      const utan = kettevalasok.some((s) => h >= s && h < s + 72);
      for (let d = 0; d < 2 ** M; d++) {
        const n = latott((1 << M) | d, h, false);
        kosarOra++; onlineOssz += n;
        if (n < T) keves++;
        if (n === 0) nulla++;
        oraOnline[h % 24] += n; oraDarab[h % 24]++;
        if (utan) {
          utanOra++; if (n < T) utanKeves++; if (n === 0) utanNulla++;
          if (latott((1 << M) | d, h, false, true) < T) utanKevesNagyszulovel++;
        }
      }
      // a még a RÉGI mélységen álló (fent lévő) kérő szemével: a régi kosarat kéri — a kosáron és a szülőjén keres, a felekén nem.
      // Súlyozva a régi mélységű fent lévők számával (ha senki nincs fent régin, senki nem kér régin).
      if (utan && M >= 2) {
        let regiFent = 0, fentDb = 0;
        for (const i of elok) if (fentMost[i]) { fentDb++; if (md[i] < M) regiFent++; }
        if (regiFent) {
          let kev = 0;
          for (let d = 0; d < 2 ** (M - 1); d++) if (latott((1 << (M - 1)) | d, h, false) < T) kev++;
          sekelyOra += regiFent; sekelyKeves += regiFent * kev / 2 ** (M - 1);
        }
        regiArany += regiFent; fentArany += fentDb;
      }
    }
  }

  // ===== AZ EREDMÉNY (az utolsó óra) =====
  const p = (t, q) => t[Math.min(t.length - 1, Math.floor(q * t.length))];
  const atl = (t) => t.reduce((a, b) => a + b, 0) / Math.max(1, t.length);
  const terhek = elok.map((i) => teher(i) * EGYEZMENY_KB / 1024).sort((a, b) => a - b);
  const alapitok = elok.filter((i) => szuletes[i] === 0).map((i) => teher(i) * EGYEZMENY_KB / 1024);
  const ujak = elok.filter((i) => szuletes[i] >= meresKezdet).map((i) => teher(i) * EGYEZMENY_KB / 1024);
  const segitok = elok.map(segitoDb).sort((a, b) => a - b);
  const mostaniTartok = [];
  for (let d = 0; d < 2 ** M; d++) {
    let n = 0;
    for (const kk of keresoKulcsai((1 << M) | d)) n += tartok.get(kk)?.length ?? 0;
    mostaniTartok.push(n);
  }
  mostaniTartok.sort((a, b) => a - b);
  let legalso = 0;
  for (let o = 1; o < 24; o++) if (oraOnline[o] / oraDarab[o] < oraOnline[legalso] / oraDarab[legalso]) legalso = o;
  return {
    M, elok: elok.length, csatlakozott, kettevalas: kettevalasok.length,
    koinonMB: E.elotag(VODOR) * EGYEZMENY_KB / 1024,
    keves: keves / Math.max(1, kosarOra), nulla: nulla / Math.max(1, kosarOra), onlineAtlag: onlineOssz / Math.max(1, kosarOra),
    legalsoOraAtlag: oraOnline[legalso] / Math.max(1, oraDarab[legalso]),
    utanKeves: utanKeves / Math.max(1, utanOra), utanNulla: utanNulla / Math.max(1, utanOra),
    utanKevesNagyszulovel: utanKevesNagyszulovel / Math.max(1, utanOra), sekelyKeves: sekelyKeves / Math.max(1, sekelyOra),
    regiArany: regiArany / Math.max(1, fentArany),
    teher: { atlag: atl(terhek), p99: p(terhek, 0.99), max: terhek[terhek.length - 1] ?? 0, alapito: atl(alapitok), uj: atl(ujak),
      keretnel: terhek.filter((t) => t >= KERET_KB / 1024 * 0.95).length },
    segito: { atlag: atl(segitok), max: segitok[segitok.length - 1] ?? 0, hataron: segitok.filter((s) => s >= JEL_KORLAT).length },
    tartoMedian: p(mostaniTartok, 0.5),
    potlasNaponta: potlasDb / novekedesNapok,
    potlasMBNaponta: potlasKB / 1024 / Math.max(1, napElok),
    legrosszabbNapMB: legrosszabbNapKB / 1024,
    belepoMB: belepoKB / 1024 / Math.max(1, csatlakozott - N0),
    leadas
  };
}

// ===================================
// FUTTATÁS
// ===================================

const sz = (x, j = 1) => (Number.isFinite(x) ? x.toFixed(j).replace('.', ',') : '–');
const sor = (e) => 'T alatt ' + sz(e.keves * 100, 1) + '% (a kettéválás után 3 napig ' + sz(e.utanKeves * 100, 1)
  + '%; a nagyszülő tartóival ' + sz(e.utanKevesNagyszulovel * 100, 1) + '%; a régi mélységű kérőnek ' + sz(e.sekelyKeves * 100, 1)
  + '% — a fent lévők ' + sz(e.regiArany * 100, 0) + '%-a áll még a régin) · egy sem '
  + sz(e.nulla * 100, 2) + '% (utána ' + sz(e.utanNulla * 100, 2) + '%) · online átlag ' + sz(e.onlineAtlag, 0) + ' (a legalsó órában '
  + sz(e.legalsoOraAtlag, 0) + ') · tartó/kosár medián ' + e.tartoMedian + ' · teher átlag ' + sz(e.teher.atlag, 1) + ' MB, 99% '
  + sz(e.teher.p99, 1) + ', legnagyobb ' + sz(e.teher.max, 1) + ' MB, az alapítóké ' + sz(e.teher.alapito, 1) + ', az új tagoké '
  + sz(e.teher.uj, 1) + (e.teher.keretnel ? ' · ⚠️ a keretnél: ' + e.teher.keretnel + ' készülék' : '') + ' · segítő szerep átlag '
  + sz(e.segito.atlag, 1) + ', legfeljebb ' + e.segito.max + (e.segito.hataron ? ' (a jel határán: ' + e.segito.hataron + ')' : '')
  + ' · pótlás ' + sz(e.potlasMBNaponta, 2) + ' MB/készülék/nap (a legrosszabb napon ' + sz(e.legrosszabbNapMB, 2) + ') · leadva: '
  + 'kettéváláskor ' + e.leadas.kettevalas + ', átadással ' + e.leadas.atadas + ', a keret miatt ' + e.leadas.keret + ', a jel határa miatt '
  + e.leadas.jel;

const SZABALYOK = { '(A) mindent megtart': 'A', '(B) a fele marad': 'B', '(C) átadja (12 ellenőrzés után)': 'C',
  '(C′) átadja sorsolással (1/n)': 'D' };
const KOINOK = {
  'növekvő (30 naponként kétszeres)': {},
  'növekvő, fogyó tagsággal (naponta 0,75% elmegy)': { elmegy: 0.0075 }
};

const csak = process.argv[2];
const kezdes = Date.now();

if (csak === 'egy') {
  // egyetlen futás (az időmérés és a gyors ránézés): `node meres/koinonMelysegMeres.js egy <A|B|C|D vagy JSON-beállítás> [minta-sorszám]`
  const minta = Object.values(MINTAK)[Number(process.argv[4] ?? 1)];
  const b = (process.argv[3] ?? 'B').startsWith('{') ? JSON.parse(process.argv[3]) : { szabaly: process.argv[3] ?? 'B' };
  console.log(sor(szimulacio({ minta, ...b })));
}

if (!csak || csak === 'A') {
  console.log('A) A KETTÉVÁLÁS SZABÁLYA — 640 tag (5. mélység) 30 nap beállás, utána 120 nap növekedés; r = 20, a valóban online cél 20, a'
    + ' látott 25 (DHT-késéssel), 10 jelölt, a keret 256 MB, a jel 32 segítő');
  for (const [nev, minta] of Object.entries(MINTAK)) {
    for (const [knev, kb] of Object.entries(KOINOK)) {
      let fej = null;
      for (const [snev, szabaly] of Object.entries(SZABALYOK)) {
        // az észrevétel: 48 óra (a tagság a cseréken terjed — a mai út), 6 óra (a társak nyitó jeléből — javaslat)
        for (const eszrevetel of [48, 6]) {
          const e = szimulacio({ minta, szabaly, eszrevetel, ...kb });
          if (!fej) {
            fej = '  ' + nev + ' · ' + knev + ' — a végén ' + e.elok + ' élő tag (' + e.csatlakozott + ' ismert), ' + e.M + '. mélység, '
              + e.kettevalas + ' kettéválás; a koinon ' + sz(e.koinonMB, 0) + ' MB (egy kosár ~' + sz(e.koinonMB / 2 ** e.M, 1) + ' MB); a'
              + ' csatlakozó a saját kosarát ' + sz(e.belepoMB, 1) + ' MB-tal tölti le';
            console.log(fej);
          }
          console.log('    ' + snev + ' · ' + eszrevetel + ' órás észrevétel: ' + sor(e));
        }
      }
    }
  }
}

if (!csak || csak === 'B') {
  // a (C) átadásának türelme, a friss tag mélysége, és az átmenet két másik javítása (a 6 órás észrevétel mellett)
  console.log('B) VÁLTOZATOK (a telefonos és az esti mintán, növekvő koino, 6 órás észrevétel)');
  const VALTOZATOK = {
    '(C) átadja, 4 ellenőrzés után': { szabaly: 'C', atadasSor: 4 },
    '(C) átadja, 24 ellenőrzés után': { szabaly: 'C', atadasSor: 24 },
    '(A) a friss tag a mostani mélységen kezd': { szabaly: 'A', frissElmarad: 0 },
    '(C) a friss tag a mostani mélységen kezd': { szabaly: 'C', frissElmarad: 0 },
    '(C) a jelölt durvább kosarat nem vállal': { szabaly: 'C', durvabbat: false },
    '(C) a számláló a két fél tartóit is látja': { szabaly: 'C', gyermekek: true }
  };
  for (const nev of ['telefonos (10% mindig, 50% napi, 40% alkalmi)', 'telefonos, esti (mint a telefonos, a napi alkalmak 80%-a 17–23 óra között)']) {
    console.log('  ' + nev);
    for (const [vnev, vb] of Object.entries(VALTOZATOK)) {
      console.log('    ' + vnev + ': ' + sor(szimulacio({ minta: MINTAK[nev], eszrevetel: 6, ...vb })));
    }
  }
}

if (!csak || csak === 'D') {
  // az átmenet másik hídja: a kérő és a számláló a nagyszülő témáján is keres — a társak bevallott mélysége nélkül
  console.log('D) A NAGYSZÜLŐ TÉMÁJÁN IS KERES (a kérő és a számláló; (C) és (C′), növekvő és fogyó koino)');
  for (const nev of ['gépes (30% mindig, 50% napi, 20% alkalmi)', 'telefonos (10% mindig, 50% napi, 40% alkalmi)',
    'borúlátó (0% mindig, 40% napi, 60% alkalmi)', 'telefonos, esti (mint a telefonos, a napi alkalmak 80%-a 17–23 óra között)']) {
    for (const [knev, kb] of Object.entries(KOINOK)) {
      console.log('  ' + nev.split(' (')[0] + ' · ' + knev.split(' (')[0]);
      for (const [snev, szabaly] of Object.entries(SZABALYOK)) {
        if (szabaly !== 'C' && szabaly !== 'D') continue;
        for (const eszrevetel of [48, 6]) {
          console.log('    ' + snev + ' · ' + eszrevetel + ' órás észrevétel, a nagyszülőn is: '
            + sor(szimulacio({ minta: MINTAK[nev], szabaly, eszrevetel, nagyszuloKeres: true, ...kb })));
        }
      }
    }
  }
}

if (!csak || csak === 'C') {
  // merre tart a teher: még egy kettéválás (150 nap növekedés — ~20 000 tag, 10. mélység)
  console.log('C) EGY ÖTÖDIK KETTÉVÁLÁS (150 nap növekedés; a telefonos minta, növekvő koino, 6 órás észrevétel)');
  const minta = MINTAK['telefonos (10% mindig, 50% napi, 40% alkalmi)'];
  for (const [snev, szabaly] of Object.entries(SZABALYOK)) {
    const e = szimulacio({ minta, szabaly, eszrevetel: 6, novekedesNapok: 150 });
    console.log('  ' + snev + ' — ' + e.elok + ' tag, ' + e.M + '. mélység, a koinon ' + sz(e.koinonMB, 0) + ' MB: ' + sor(e));
  }
}

console.log('(' + sz((Date.now() - kezdes) / 1000, 0) + ' s)');
