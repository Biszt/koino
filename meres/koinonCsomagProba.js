// meres/koinonCsomagProba.js

// Felelősség: ⭐⭐ D130 (②) — AZ EGYEZMÉNY TÖMÖR ALAKJÁNAK PRÓBÁJA (`js/allapot/koinonCsomag.js`, `lezarasiOsszegzes.js`
// `onalloMintaHelyek`): a csomag épül, és a nyers szavazatok nélkül, az építő nélkül ellenőrizhető; a minta-helyek az összegzés
// saját lenyomatából jönnek (ugyanabból ugyanaz, másból más; véletlen helyekre készült mintát az ellenőrző elvet); minden hamisítás
// elbukik; az elvetett egyezmény csomagja elvetettnek mondja magát.
//
// Használja: meres/mind.js (`koinoncsomag` — az `allapot` csoportban).

import { probaGyujtemeny, ujEember, tagokkal, probaKiseroval } from './probaFuttato.js';
import { allapotSzamitasa } from '../js/allapot/allapotSzamitas.js';
import { koinonCsomagEpitese, koinonCsomagEllenorzese, KOINON_CSOMAG, koinonOsszegzesAdata, koinonOsszegzesEllenorzese, KOINON_OSSZEGZES }
  from '../js/allapot/koinonCsomag.js';
import { onalloMintaHelyek, lezarasiMintaHelyek, lezarasiOsszegzesEpitese, lezarasiMintakValasza } from '../js/allapot/lezarasiOsszegzes.js';
import { ALLASPONT_MUVELET } from '../js/allapot/szabalyok.js';
import { kiseroNelkul, KISERO_MEZO, szelet, bejelentesHelyei, alakiHiba } from '../js/esemeny/esemeny.js';

const { proba, futtatas } = probaGyujtemeny('Az egyezmény tömör alakja (D130 ②)');

const KEZDET = Date.UTC(2026, 10, 20);
const KESOBB = KEZDET + 9 * 24 * 3600 * 1000;
const KUSZOBOK = { elfogadasiKuszob: 51, reszveteliKuszob: 0, minimumDontesiIdo: 3600, maximumDontesiIdo: 7200 };
const masolat = (x) => JSON.parse(JSON.stringify(x));

/**
 * Egy döntés: a hely (egy gondolat) a gazdával és `szavazok` taggal (mind pontot tart rajta), egy javaslat, a szavazatok (az
 * első `ellenzok` ellenez), és a lezárás után állásfoglalások (a 2. tag csatlakozik, MAJD tiltakozik — az utolsó nyer).
 */
async function dontes({ szavazok = 12, ellenzok = 3, fajta = 'altalanos' } = {}) {
  const gazda = await ujEember();
  const ev = [];
  const g = await gazda.tesz('GondolatLetrehozas', { cim: 'A hely', meret: 10 }, KEZDET);
  ev.push(g, await gazda.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 100 }, KEZDET),
    await gazda.tesz('ErtekJavaslat', { entitas: g.azonosito, ertekek: KUSZOBOK }, KEZDET));
  const tagok = [];
  for (let i = 0; i < szavazok; i++) {
    const t = await ujEember();
    tagok.push(t);
    ev.push(await t.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 10 }, KEZDET + 10 + i));
  }
  const j = await gazda.tesz('Javaslat', fajta === 'altalanos'
    ? { fajta, erintett: g.azonosito, muvelet: ALLASPONT_MUVELET, valtozas: null, indoklas: 'Ez a közösség álláspontja.' }
    : { fajta, erintett: g.azonosito, muvelet: 'Modositas', valtozas: { cim: 'Új cím' }, indoklas: null }, KEZDET + 1000);
  ev.push(j, ...await gazda.szavaz(j, { szavazat: 'Tamogat' }, KEZDET + 2000));
  for (let i = 0; i < tagok.length; i++) ev.push(...await tagok[i].szavaz(j, { szavazat: i < ellenzok ? 'Ellenez' : 'Tamogat' }, KEZDET + 2100 + i));
  ev.push(await tagok[0].tesz('Allasfoglalas', { egyezmeny: j.azonosito, allas: 'csatlakozik' }, KESOBB),
    await tagok[1].tesz('Allasfoglalas', { egyezmeny: j.azonosito, allas: 'csatlakozik' }, KESOBB),
    await tagok[1].tesz('Allasfoglalas', { egyezmeny: j.azonosito, allas: 'tiltakozik' }, KESOBB + 1000),
    await tagok[2].tesz('Allasfoglalas', { egyezmeny: j.azonosito, allas: 'tiltakozik' }, KESOBB));
  const bemenet = await tagokkal(ev);
  const szamitok = allapotSzamitasa(bemenet).szamitok;
  const index = new Map(bemenet.map((e) => [e.azonosito, e]));
  // ⭐⭐ D128: a teljes tartó az eseményeket a készülékük tanúsítványával adja (a kísérő — a programban `kiseroAdo`)
  const olvas = async (az) => probaKiseroval(index.get(az) ?? null);
  const csomag = await koinonCsomagEpitese(szamitok, j, olvas);
  return { gazda, tagok, g, j, szamitok, olvas, csomag };
}

/** A csomag egy eseménye a táblából (az azonosítója szerint). */
const tablabol = (cs, az) => cs.esemenyek.find((e) => e.azonosito === az) ?? null;

/** Egy (kísérős) esemény a csomag táblájába — a hamisításokhoz: ugyanúgy, ahogy az építő teszi (kísérő nélkül + a tanúsítvány). */
function tablaba(cs, e) {
  if (e[KISERO_MEZO] && !cs.tanusitvanyok.some((t) => t.keszulek === e.keszulek)) cs.tanusitvanyok.push(e[KISERO_MEZO]);
  if (!cs.esemenyek.some((x) => x.azonosito === e.azonosito)) cs.esemenyek.push(kiseroNelkul(e));
  return e.azonosito;
}

// Rontás: (a) a minta-helyek valódi véletlenből (nem a lenyomatból) → az ellenőrzés bukik; (b) az ellenőrző véletlen helyeket
// sorsol → bukik; (c) az állásfoglalások közül az első marad (nem az utolsó) → bukik; (d) az eseményeket nem egyszer tartja (a
// minták beágyazva) → a méret-határ bukik.
proba('⭐⭐ D130 ②: a tömör alak épül, és a nyers szavazatok és az építő NÉLKÜL ellenőrizhető — az elfogadott általános egyezmény; az állásfoglalások e-emberenként az utolsó; minden esemény és tanúsítvány egyszer, a mérete korlátos',
  async () => {
    const d = await dontes();
    const v = await koinonCsomagEllenorzese(d.csomag);
    const meret = Buffer.byteLength(JSON.stringify(d.csomag));
    const allas = new Map(d.csomag.allasfoglalasok.map((az) => tablabol(d.csomag, az)).map((a) => [a?.szerzo, a?.adat?.allas]));
    const azonositok = d.csomag.esemenyek.map((e) => e.azonosito);
    const r = {
      alak: d.csomag?.fajta === KOINON_CSOMAG && d.csomag.reszek.length === 1 && d.csomag.javaslat === d.j.azonosito,
      rendben: v.rendben === true && v.elfogadva === true && v.ellenorzott >= 8,
      allasfoglalasok: d.csomag.allasfoglalasok.length === 3 && allas.get(d.tagok[1].szerzo) === 'tiltakozik'
        && allas.get(d.tagok[0].szerzo) === 'csatlakozik',
      egyszer: new Set(azonositok).size === azonositok.length && d.csomag.esemenyek.every((e) => !(KISERO_MEZO in e))
        && new Set(d.csomag.tanusitvanyok.map((t) => t.keszulek)).size === d.csomag.tanusitvanyok.length,
      meret: meret < 48 * 1024
    };
    process.stdout.write('    (a tömör alak 13 szavazóval: ' + (meret / 1024).toFixed(1).replace('.', ',') + ' KB — ' + azonositok.length
      + ' esemény, ' + d.csomag.tanusitvanyok.length + ' tanúsítvány)\n');
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify({ r, v, meret }) + ')\n'); return false; }
    return true;
  });

// Rontás: (a) a lenyomat csak a javaslatot nézi (nem az egész összegzést) → a más összegzés ugyanazt adja → bukik; (b) a véletlen
// helyekre készült minta is átmegy (az ellenőrző a csomag helyeit hinné) → bukik.
proba('⭐⭐ D130 ②: a minta-helyek az összegzés SAJÁT lenyomatából — ugyanabból ugyanazok, egy más összegzésből mások; egy véletlen helyekre készült mintát az ellenőrző elvet (az építő nem választhat helyet)',
  async () => {
    const d = await dontes();
    const o = d.csomag.reszek[0].osszegzes;
    const h1 = JSON.stringify(onalloMintaHelyek(o));
    const h2 = JSON.stringify(onalloMintaHelyek(masolat(o)));
    const h3 = JSON.stringify(onalloMintaHelyek({ ...masolat(o), lezaras: o.lezaras + 1 }));
    // egy építő, aki a saját (véletlen) helyeire válaszol — a csomag alakjában (a táblával), hogy csak a helyek legyenek rosszak
    const ep = await lezarasiOsszegzesEpitese(d.szamitok, d.j, o.entitas);
    const nyers = await lezarasiMintakValasza(ep.epito, lezarasiMintaHelyek(ep.osszegzes), d.olvas);
    const veletlen = masolat(d.csomag);
    const at = (m) => (m && m.esemeny ? { ...m, esemeny: tablaba(veletlen, m.esemeny) } : m);
    veletlen.reszek = [{ osszegzes: ep.osszegzes, mintak: { szavazat: nyers.szavazat.map(at), nevezo: nyers.nevezo.map(at),
      ertek: Object.fromEntries(Object.entries(nyers.ertek).map(([n, l]) => [n, l.map(at)])) } }];
    const vv = await koinonCsomagEllenorzese(veletlen);
    const r = { ugyanaz: h1 === h2, mas: h1 !== h3, veletlenElvetve: vv.rendben === false && /nem a kért helyre/.test(vv.ok ?? '') };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify({ r, vv }) + ')\n'); return false; }
    return true;
  });

// Rontás: (a) az állásfoglalás egyezményét nem nézi → átmegy → bukik; (b) a kettőzést nem nézi → átmegy; (c) a javaslat aláírását
// nem nézi → átmegy; (d) a fajtát nem nézi → átmegy; (e) a részek számát nem nézi → átmegy; (f) a táblában nem talált esemény helyett a
// régit adja vissza → átmegy.
proba('⭐⭐ D130 ②: a hamisítás elbukik — egy minta eseménye kicserélve, az összegzés számai átírva, idegen vagy kettőzött állásfoglalás, átírt javaslat, szerkesztési javaslat, hiányzó rész, hiányzó esemény a táblában, átírt tanúsítvány',
  async () => {
    const d = await dontes();
    const cs = d.csomag;
    const valtozat = (fv) => { const m = masolat(cs); fv(m); return m; };
    const elsoMinta = cs.reszek[0].mintak.szavazat[0]?.esemeny;
    // (a hamisított elemek is kísérővel és a táblában — hogy CSAK a célzott ellenőrzés fogja meg őket)
    const masikSzavazat = cs.esemenyek.find((e) => e.tipus === 'Szavazat' && e.azonosito !== elsoMinta)?.azonosito;
    const idegen = probaKiseroval(await d.tagok[3].tesz('Allasfoglalas', { egyezmeny: d.g.azonosito, allas: 'csatlakozik' }, KESOBB));
    const ketszer = probaKiseroval(await d.tagok[0].tesz('Allasfoglalas', { egyezmeny: d.j.azonosito, allas: 'tiltakozik' }, KESOBB + 5000));
    const szerk = await dontes({ fajta: 'szerkesztesi' });
    const esetek = {
      mintaEsemeny: valtozat((m) => { m.reszek[0].mintak.szavazat[0].esemeny = masikSzavazat; }),
      szamok: valtozat((m) => { m.reszek[0].osszegzes.szamok.tamogatok += 1; }),
      idegenAllas: valtozat((m) => { m.allasfoglalasok.push(tablaba(m, idegen)); }),
      kettozott: valtozat((m) => { m.allasfoglalasok.push(tablaba(m, ketszer)); }),
      atirtJavaslat: valtozat((m) => { tablabol(m, m.javaslat).adat.indoklas = 'Más indoklás.'; }),
      szerkesztesi: szerk.csomag,
      hianyzoResz: valtozat((m) => { m.reszek = []; }),
      hianyzoEsemeny: valtozat((m) => { m.esemenyek = m.esemenyek.filter((e) => e.azonosito !== elsoMinta); }),
      atirtTanusitvany: valtozat((m) => {
        const e = tablabol(m, elsoMinta);
        const t = m.tanusitvanyok.find((x) => x.keszulek === e?.keszulek);
        if (t) t.ido = (t.ido ?? 0) + 1; else m.tanusitvanyok = [];
      })
    };
    const ered = {};
    for (const [nev, c] of Object.entries(esetek)) ered[nev] = await koinonCsomagEllenorzese(c);
    const eredeti = await koinonCsomagEllenorzese(cs);
    const ok = eredeti.rendben === true && !!masikSzavazat && Object.values(ered).every((v) => v.rendben === false);
    if (!ok) process.stderr.write('    (' + JSON.stringify({ eredeti, ered: Object.fromEntries(Object.entries(ered).map(([k, v]) => [k, v.rendben + ' ' + (v.ok ?? '')])) }) + ')\n');
    return ok;
  });

proba('⭐ D130 ②: az ELVETETT általános javaslat csomagja is ellenőrizhető — és elvetettnek mondja magát (a koinon pontját nem kapja meg)',
  async () => {
    const d = await dontes({ szavazok: 12, ellenzok: 10 });
    const v = await koinonCsomagEllenorzese(d.csomag);
    if (!(v.rendben === true && v.elfogadva === false)) { process.stderr.write('    (' + JSON.stringify(v) + ')\n'); return false; }
    return true;
  });

// Rontás: (a) az esemény nem jelentődik be az érintettnél → bukik; (b) a szelet-kulcsát nem nézi (más szeletben is elfogadja) →
// bukik; (c) az állásfoglalások is az eseménybe kerülnek (a hatály megfagyna) → bukik.
proba('⭐⭐ D130 ③a: a döntés tömör alakja egy ALÁÍRT eseményben (KoinonOsszegzes, KO7 (A)) — a csomagból írva, a tárból ellenőrizve (a hivatkozott események kísérővel); a javaslat szeletében él, az érintettnél is bejelentődik; az állásfoglalások nincsenek benne; a meghamisított, a hiányos és a más szeletű elbukik',
  async () => {
    const d = await dontes();
    const adat = koinonOsszegzesAdata(d.csomag);
    const e = await d.gazda.tesz(KOINON_OSSZEGZES, adat, KESOBB, { entitas: d.j.azonosito });
    const v = await koinonOsszegzesEllenorzese(e, d.olvas);
    const hamis = masolat(e);
    hamis.adat.reszek[0].osszegzes.szamok.tamogatok += 1;
    const elsoMinta = adat.reszek[0].mintak.szavazat[0]?.esemeny;
    const hianyos = await koinonOsszegzesEllenorzese(e, async (az) => (az === elsoMinta ? null : d.olvas(az)));
    const masSzelet = { ...masolat(e), entitas: d.g.azonosito };
    const r = {
      rendben: v.rendben === true && v.elfogadva === true && v.osszegzesek?.length === 1 && v.osszegzesek[0].entitas === d.g.azonosito,
      szelet: szelet(e) === d.j.azonosito && bejelentesHelyei(e).includes(d.g.azonosito),
      kapu: alakiHiba(e) === null,
      hatalyNelkul: !('allasfoglalasok' in e.adat),
      hamis: (await koinonOsszegzesEllenorzese(hamis, d.olvas)).rendben === false,
      hianyos: hianyos.rendben === false,
      masSzelet: (await koinonOsszegzesEllenorzese(masSzelet, d.olvas)).rendben === false
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify({ r, v, hianyos }) + ')\n'); return false; }
    return true;
  });

export default futtatas;
