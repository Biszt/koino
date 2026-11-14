// meres/keszulekProba.js

// Felelősség: ⭐⭐ D128 (ET-3 — a kulcs: több készülék és a helyreállítás) — bizonyítani, hogy a KÉSZÜLÉK és a TANÚSÍTVÁNYA azt
// teszi, amiért született (az ①a lépés):
//   · a tanúsítványt az azonosság kulcsa írja alá — más kulccsal, átírva, fölös mezővel nem megy át;
//   · a lánc első eseménye hozza a tanúsítványt, a többi nem — az alak mást nem enged;
//   · a kapu csak tanúsított eseményt enged be: a lánc első eseménye nélkül „hiányzik”; egy idegen azonosság nevében írt esemény
//     (saját vagy semmilyen tanúsítvánnyal) elbukik; egy készüléket csak egy azonosság tanúsíthat;
//   · két készülék egy azonossággal: azonos sorszámuk nem elágazás, mindkét lánc bejut és számít;
//   · ⭐ (①b (2a)) a keret a horgony láncáé: a belépést író készülék kapja a koinó keretét, a többié 0 — a szabály-réteg és a tár
//     (a művelet, a vád) ugyanazt mondja;
//   · ⭐ (①b (2b)) a keret átadása és átvétele: a fogadó kerete nő (a lánc-gyökér kapott-fája), az adóé fogy; a csökkenő átadás, a
//     kereten túli átadás átvétele és az ismételt átvétel nem számít; a hamis kapott-bizonyíték a kapun elbukik; és az átvétel
//     az adó lánca nélkül, egyetlen eseményből ellenőrizhető;
//   · ⭐ (①b (2c)) az átfolyás: a különbség fele, a fogadó határáig — a még át nem vett átadás is a részéhez számít; egy tolvaj a
//     határnál megáll (a 93. (g) modellje);
//   · a készülék a gépen: létrejön, újranyitáskor ugyanaz, másik azonosságnál új;
//   · a csomag tanúsítvány-keresője csak a hiteles, a szerzőt és a készüléket nevező tanúsítványt veszi fel.
//
// Futtatás: node meres/mind.js keszulek

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { probaGyujtemeny, tesztKeszulek, ujEember, tagokkal } from './probaFuttato.js';
import {
  tanusitvanyKeszitese, tanusitvanyEllenorzese, tanusitvanyAlakiHibaja, eszkoz, keszulekBiztositasa
} from '../js/kulcs/keszulek.js';
import { esemenyLetrehozasa, esemenyEllenorzese, alakiHiba, elagazasE, tanusitvanyKereso, kiseroval, KISERO_MEZO }
  from '../js/esemeny/esemeny.js';
import { lenyomat, bajtokBase64Url } from '../js/esemeny/kanonikusAlak.js';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese, koinoEsemenyei } from '../js/tar/esemenyTar.js';
import { allapotSzamitasa } from '../js/allapot/allapotSzamitas.js';
import { lancAlapKerete } from '../js/allapot/lancGyoker.js';
import { TUDATPONT_KERET } from '../js/allapot/szabalyok.js';
import { tudatpontRendezese, szabadTudatpontjaim, keretAtadasa, keretAtvetele, keretAtfolyasa, atfolyasMerteke }
  from '../js/muveletek.js';
import { ujSajatHelye } from '../js/tar/esemenyTar.js';
import { lancUjEsemenyhez, KAPOTT_FAJTA, KAPOTT_HOSSZ } from '../js/allapot/lancGyoker.js';
import { ujAllapotFa, allapotBizonyitek } from '../js/esemeny/osszegzoFa.js';
import { ellentmondasEllenorzese } from '../js/allapot/ellentmondas.js';
import { keretAtvetelMerlege, ujLancAllas } from '../js/allapot/szabalyok.js';
import { sajatSzavazat } from '../js/allapot/javaslatSzamitas.js';

const { proba, futtatas } = probaGyujtemeny('A készülék és a tanúsítványa (D128 — ET-3)');

const KOINO = 'keszulek-proba';

/** Egy új, üres tár. */
async function ujTar() {
  return esemenyTarNyitasa(KOINO, await mkdtemp(join(tmpdir(), 'koino-keszulek-')));
}

/**
 * Egy esemény KÉZZEL aláírva — a rontás-próbákhoz (a `esemenyLetrehozasa` a hamis szerzőt nem engedné): a gondolat a megadott
 * mezőkkel, a lenyomata az azonosító, az aláírás a megadott kulccsal.
 */
async function kezzelAlairt(gondolat, privateKey) {
  const g = { entitas: null, entitasSorszam: 1, latott: [], lancGyoker: null, elozo: null, ido: Date.now(), ...gondolat };
  const azonosito = await lenyomat(g);
  const alairas = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, new TextEncoder().encode(azonosito));
  return { ...g, azonosito, alairas: bajtokBase64Url(new Uint8Array(alairas)) };
}

// ===================================
// 1. A TANÚSÍTVÁNY
// ===================================

proba('⭐⭐ A TANÚSÍTVÁNY: az azonosság kulcsa írja alá — a más kulccsal aláírt, az átírt, a fölös mezős és az azonosságot készülékként nevező elbukik', async () => {
  const k = await tesztKeszulek('laptop');
  const t = k.tanusitvany;
  const jo = (await tanusitvanyEllenorzese(t)).rendben;
  // Egy idegen kulcs írja alá ugyanazt (a mi azonosságunk nevében).
  const idegen = await tesztKeszulek();
  const masAlairta = await tanusitvanyKeszitese(idegen.azonossagKulcspar, k.keszulek, 'laptop');
  const hamis = { ...masAlairta, azonossag: t.azonossag };
  const atirt = { ...t, nev: 'telefon' };
  const masKeszulek = { ...t, keszulek: idegen.keszulek };
  const folos = { ...t, x: 1 };
  const onmaga = { ...t, keszulek: t.azonossag };
  const esetek = [
    ['ép', jo, true],
    ['más kulccsal aláírt', (await tanusitvanyEllenorzese(hamis)).rendben, false],
    ['átírt név', (await tanusitvanyEllenorzese(atirt)).rendben, false],
    ['átírt készülék', (await tanusitvanyEllenorzese(masKeszulek)).rendben, false],
    ['fölös mező', tanusitvanyAlakiHibaja(folos) !== null, true],
    ['az azonosság mint készülék', /nem lehet az azonosság/.test(tanusitvanyAlakiHibaja(onmaga) ?? ''), true]
  ];
  const rossz = esetek.filter(([, kapott, vart]) => kapott !== vart).map(([nev]) => nev);
  if (rossz.length) console.error('tanúsítvány — rossz esetek:', rossz);
  return !rossz.length;
});

// ===================================
// 2. A LÁNC ELSŐ ESEMÉNYE HOZZA
// ===================================

proba('⭐⭐ A LÁNC ELSŐ ESEMÉNYE HOZZA a tanúsítványt — a többi nem; a hiányzót, a nem-első helyen állót és a mást nevezőt az alak elveti', async () => {
  const k = await tesztKeszulek();
  const elso = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: 'Első' }, sorszam: 1 }, k);
  const masodik = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: 'Második' },
    sorszam: 2, elozo: elso.azonosito }, k);
  const idegen = await tesztKeszulek();
  const esetek = [
    ['az első hozza', elso.tanusitvany?.keszulek === k.keszulek && elso.szerzo === k.azonossag && elso.keszulek === k.keszulek, true],
    ['a második nem', masodik.tanusitvany === null, true],
    ['az első tanúsítvány nélkül', alakiHiba({ ...elso, tanusitvany: null }) !== null, true],
    ['a második tanúsítvánnyal', alakiHiba({ ...masodik, tanusitvany: k.tanusitvany }) !== null, true],
    ['az első más tanúsítványával', alakiHiba({ ...elso, tanusitvany: idegen.tanusitvany }) !== null, true],
    ['a készülék az azonosság', alakiHiba({ ...masodik, keszulek: masodik.szerzo }) !== null, true],
    ['az ép első', alakiHiba(elso) === null && (await esemenyEllenorzese(elso)).rendben, true]
  ];
  const rossz = esetek.filter(([, kapott, vart]) => kapott !== vart).map(([nev]) => nev);
  if (rossz.length) console.error('a lánc első eseménye — rossz esetek:', rossz);
  return !rossz.length;
});

// ===================================
// 3. A KAPU
// ===================================

proba('⭐⭐ A KAPU CSAK TANÚSÍTOTT ESEMÉNYT ENGED BE — a lánc első eseménye nélkül „hiányzik”, utána bejön; tanúsítvány-kereső nélkül az ellenőrzés sem megy át', async () => {
  const tar = await ujTar();
  const anna = await ujEember(KOINO);
  const e1 = await anna.tesz('GondolatLetrehozas', { cim: 'Első' });
  const e2 = await anna.tesz('GondolatLetrehozas', { cim: 'Második' });
  const elotte = await esemenyMentese(tar, e2);
  const elsoBe = await esemenyMentese(tar, e1);
  const utana = await esemenyMentese(tar, e2);
  const kereso = await esemenyEllenorzese(e2);   // kereső nélkül: a készülék tanúsítványa nem ismert
  const csakAlairas = await esemenyEllenorzese(e2, { csakAlairas: true });
  return elotte.mentve === false && elotte.hianyzik === true && elsoBe.mentve === true && utana.mentve === true
    && kereso.rendben === false && kereso.hianyzik === true && csakAlairas.rendben === true;
});

proba('⛔⛔ IDEGEN AZONOSSÁG NEVÉBEN NEM LEHET ÍRNI — se a saját tanúsítvánnyal, se tanúsítvány nélkül, se egy másik készülék láncán, se hamisított tanúsítvánnyal', async () => {
  const tar = await ujTar();
  const anna = await ujEember(KOINO);
  const a1 = await anna.tesz('GondolatLetrehozas', { cim: 'Anna első' });
  await esemenyMentese(tar, a1);
  const tolvaj = await tesztKeszulek('tolvaj');
  // (1) Az 1. sorszámon Anna nevében, a tolvaj SAJÁT tanúsítványával: az alak elveti (a tanúsítvány nem Annát nevezi).
  const sajatTanusitvannyal = await kezzelAlairt({ koino: KOINO, tipus: 'GondolatLetrehozas', szerzo: anna.szerzo,
    keszulek: tolvaj.keszulek, sorszam: 1, tanusitvany: tolvaj.tanusitvany, adat: { cim: 'Hamis 1' } }, tolvaj.privateKey);
  // (2) A 2. sorszámon Anna nevében, tanúsítvány nélkül — a tolvaj készüléke nem ismert: hiányzik.
  const tanusitvanyNelkul = await kezzelAlairt({ koino: KOINO, tipus: 'GondolatLetrehozas', szerzo: anna.szerzo,
    keszulek: tolvaj.keszulek, sorszam: 2, tanusitvany: null, adat: { cim: 'Hamis 2' } }, tolvaj.privateKey);
  const m = [await esemenyMentese(tar, sajatTanusitvannyal), await esemenyMentese(tar, tanusitvanyNelkul)];
  // (3) A tolvaj előbb a SAJÁT láncát kezdi (a tanúsítványa így a tárban van), aztán Anna nevében ír rajta.
  const tolvajEmber = await ujEember(KOINO, tolvaj);
  await esemenyMentese(tar, await tolvajEmber.tesz('GondolatLetrehozas', { cim: 'A tolvaj saját' }));
  const sajatLancan = await kezzelAlairt({ koino: KOINO, tipus: 'GondolatLetrehozas', szerzo: anna.szerzo,
    keszulek: tolvaj.keszulek, sorszam: 2, tanusitvany: null, adat: { cim: 'Hamis 3' } }, tolvaj.privateKey);
  // (4) Anna készülékének kulcsát nevezi, de a tolvaj írta alá.
  const masAlairta = await kezzelAlairt({ koino: KOINO, tipus: 'GondolatLetrehozas', szerzo: anna.szerzo,
    keszulek: anna.keszulek, sorszam: 2, tanusitvany: null, elozo: a1.azonosito, adat: { cim: 'Hamis 4' } }, tolvaj.privateKey);
  // (5) Egy ÚJ készülék láncának első eseménye Anna nevében, egy HAMISÍTOTT tanúsítvánnyal: Annát és a tolvaj új készülékét
  // nevezi, de a tolvaj azonosság-kulcsa írta alá.
  const uj = await tesztKeszulek('tolvaj 2', tolvaj.azonossagKulcspar);
  const hamisT = { ...(await tanusitvanyKeszitese(tolvaj.azonossagKulcspar, uj.keszulek, 'laptop')), azonossag: anna.szerzo };
  const hamisTanusitvannyal = await kezzelAlairt({ koino: KOINO, tipus: 'GondolatLetrehozas', szerzo: anna.szerzo,
    keszulek: uj.keszulek, sorszam: 1, tanusitvany: hamisT, adat: { cim: 'Hamis 5' } }, uj.privateKey);
  for (const e of [sajatLancan, masAlairta, hamisTanusitvannyal]) m.push(await esemenyMentese(tar, e));
  const okok = m.map((r) => r.ok ?? '');
  const bejutott = (await koinoEsemenyei(tar, KOINO)).filter((e) => e.szerzo === anna.szerzo).length;
  return m.every((r) => r.mentve === false)
    && /a szerzőt és a készüléket nevezi/.test(okok[0]) && m[1].hianyzik === true
    && /másik azonosság tanúsítványát/.test(okok[2]) && /nem a készüléké/.test(okok[3])
    && /nem az azonosság kulcsa írta alá/.test(okok[4]) && bejutott === 1;
});

proba('⛔ EGY KÉSZÜLÉKET CSAK EGY AZONOSSÁG TANÚSÍTHAT — a második azonosság tanúsítványa ugyanarra a kulcsra a kapun elbukik', async () => {
  const tar = await ujTar();
  const anna = await ujEember(KOINO);
  await esemenyMentese(tar, await anna.tesz('GondolatLetrehozas', { cim: 'Anna' }));
  // Ugyanaz a készülékkulcs egy MÁSIK azonosság tanúsítványával (a készülék gazdája két azonosságot próbál egy láncra).
  const masik = await tesztKeszulek();
  const ketszeres = eszkoz(anna.kulcspar, await tanusitvanyKeszitese(masik.azonossagKulcspar, anna.keszulek, 'második'));
  const e = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: 'Másik név' }, sorszam: 1 }, ketszeres);
  const r = await esemenyMentese(tar, e);
  return (await esemenyEllenorzese(e)).rendben === true && r.mentve === false && /másik azonosság tanúsította/.test(r.ok ?? '');
});

proba('⭐⭐ A KÍSÉRŐ TANÚSÍTVÁNY ÉS A VÁRAKOZÓ SOR — a lánc közepéről jövő esemény a kísérővel bejut (a burok nélkül tárolva, a tanúsítvány a jegyzékbe), utána a lánc többi eseménye kísérő nélkül is; ami a tanúsítványa előtt jön, az a megérkezésekor bejön', async () => {
  const anna = await ujEember(KOINO);
  const [e1, e2, e3, e4] = [await anna.tesz('GondolatLetrehozas', { cim: '1' }), await anna.tesz('GondolatLetrehozas', { cim: '2' }),
    await anna.tesz('GondolatLetrehozas', { cim: '3' }), await anna.tesz('GondolatLetrehozas', { cim: '4' })];
  // (a) a kísérő burok
  const t1 = await ujTar();
  const m2 = await esemenyMentese(t1, kiseroval(e2, anna.kulcspar.tanusitvany));
  const tarolt = await t1.esemeny(e2.azonosito);
  const m3 = await esemenyMentese(t1, e3);
  // (b) a várakozó sor: a 4. a lánc első eseménye előtt jön, és vele együtt bejön
  const t2 = await ujTar();
  const m4 = await esemenyMentese(t2, e4);
  const m1 = await esemenyMentese(t2, e1);
  return m2.mentve === true && !!tarolt && !(KISERO_MEZO in tarolt) && m3.mentve === true
    && m4.mentve === false && m4.hianyzik === true && m1.mentve === true && (m1.kesobbBejottek ?? []).includes(e4.azonosito)
    && !!(await t2.esemeny(e4.azonosito));
});

// ===================================
// 4. KÉT KÉSZÜLÉK, EGY AZONOSSÁG
// ===================================

proba('⭐⭐ KÉT KÉSZÜLÉK, EGY AZONOSSÁG — azonos sorszámuk nem elágazás: mindkét lánc bejut, és az állapotban mindkettő eseményei számítanak', async () => {
  const tar = await ujTar();
  const laptop = await ujEember(KOINO);
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const l1 = await laptop.tesz('GondolatLetrehozas', { cim: 'A laptopról' });
  const t1 = await telefon.tesz('GondolatLetrehozas', { cim: 'A telefonról' });
  // A pontjaik (egy gondolat pont nélkül nem él — D14) — ⭐ D128 (9.9): a keret a belépést író laptopé, ő ad mindkettőre.
  const lp = await laptop.tesz('TudatpontRendezes', { entitas: l1.azonosito, pont: 10 });
  const lt = await laptop.tesz('TudatpontRendezes', { entitas: t1.azonosito, pont: 10 });
  const m1 = await esemenyMentese(tar, l1);
  const m2 = await esemenyMentese(tar, t1);
  for (const e of [lp, lt]) await esemenyMentese(tar, e);
  const allapot = allapotSzamitasa(await tagokkal(await koinoEsemenyei(tar, KOINO)));
  return laptop.szerzo === telefon.szerzo && laptop.keszulek !== telefon.keszulek
    && l1.sorszam === 1 && t1.sorszam === 1 && !elagazasE(l1, t1)
    && m1.mentve && m2.mentve && !m2.elagazas
    && allapot.entitasok.has(l1.azonosito) && allapot.entitasok.has(t1.azonosito) && allapot.ellentmondasok.length === 0;
});

proba('⭐⭐ AZ AZONOSSÁG UTOLSÓ ÁLLÍTÁSA (9.5 — „legyen az idő”) — két készülék között az IDŐ dönt (az érték javaslatnál és a szavazatnál), egy láncon a sorszám', async () => {
  const laptop = await ujEember(KOINO);
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'Küszöbös' }, 1000);
  const p = await laptop.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 100 }, 1001);
  const kuszob = (e) => ({ entitas: g.azonosito, ertekek: { elfogadasiKuszob: e, reszveteliKuszob: 0, minimumDontesiIdo: 60, maximumDontesiIdo: 120 } });
  // a laptop (a lánca 3.-a) 2000-kor 60-at mond, a telefon (a lánca 1.-e) később, 3000-kor 70-et — a telefoné az utolsó
  const l60 = await laptop.tesz('ErtekJavaslat', kuszob(60), 2000);
  const t70 = await telefon.tesz('ErtekJavaslat', kuszob(70), 3000);
  const idoben = allapotSzamitasa(await tagokkal([g, p, l60, t70])).entitasok.get(g.azonosito)?.kuszobok?.elfogadasiKuszob;
  // fordítva: a telefoné a korábbi (1500) — a laptopé marad
  const t70korai = await telefon.tesz('ErtekJavaslat', kuszob(70), 1500);
  const korai = allapotSzamitasa(await tagokkal([g, p, l60, t70korai])).entitasok.get(g.azonosito)?.kuszobok?.elfogadasiKuszob;
  // a saját szavazat: a laptop 4000-kor támogat, a telefon 5000-kor ellenez — az ellenzés az utolsó
  const j = 'J'.repeat(43);
  const szl = await laptop.tesz('Szavazat', { javaslat: j, szavazat: 'Tamogat' }, 4000);
  const szt = await telefon.tesz('Szavazat', { javaslat: j, szavazat: 'Ellenez' }, 5000);
  const szavazat = sajatSzavazat([szl, szt], j, laptop.szerzo);
  return idoben === 70 && korai === 60 && szavazat === 'Ellenez';
});

proba('⭐⭐ A KERET A HORGONY LÁNCÁÉ (9.9) — a belépést író készülék kapja a koinó keretét, a másiké 0: a pontja elvetődik; a tár (a művelet és a vád) ugyanígy látja', async () => {
  const tar = await ujTar();
  const laptop = await ujEember(KOINO);
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'Közös' });
  const lp = await laptop.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 10 });
  const tp = await telefon.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 5 });
  const lista = await tagokkal([g, lp, tp]);
  const allapot = allapotSzamitasa(lista);
  const ent = allapot.entitasok.get(g.azonosito);
  const elvetett = allapot.kivetelek.find((k) => k.azonosito === tp.azonosito);
  // A tár: a belépés (a horgony) a laptop láncán — két menetben (a lánc eleje előbb, a tanúsítvány miatt).
  for (let i = 0; i < 2; i++) for (const e of lista) await esemenyMentese(tar, e);
  const belepes = lista.find((e) => e.tipus === 'Belepes' && e.szerzo === laptop.szerzo);
  const laptopKerete = await lancAlapKerete(tar, KOINO, laptop.keszulek);
  const telefonKerete = await lancAlapKerete(tar, KOINO, telefon.keszulek);
  // ⭐ Ha a telefon KÉSŐBB maga is belép (egy második horgony), a keret marad a laptopé — a LEGKORÁBBI horgony dönt.
  const masodik = await telefon.tesz('Belepes', {}, belepes.ido + 1000);
  const lista2 = [...lista, masodik];
  const ent2 = allapotSzamitasa(lista2).entitasok.get(g.azonosito);
  for (let i = 0; i < 2; i++) await esemenyMentese(tar, masodik);
  const telefonKerete2 = await lancAlapKerete(tar, KOINO, telefon.keszulek);
  return belepes?.keszulek === laptop.keszulek && ent?.osszesPont === 10 && !!elvetett && /keret/.test(elvetett.ok)
    && laptopKerete === TUDATPONT_KERET && telefonKerete === 0
    && ent2?.osszesPont === 10 && telefonKerete2 === 0 && (await lancAlapKerete(tar, KOINO, laptop.keszulek)) === TUDATPONT_KERET;
});

proba('⭐⭐ A MŰVELET IS A LÁNC KERETÉVEL SZÁMOL (9.9) — a telefonnak 0 szabad pontja van, és a pont-rendezése elutasítva; a laptop a teljes kerettel ír', async () => {
  const tar = await ujTar();
  const laptop = await ujEember(KOINO);
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'Közös' });
  const lp = await laptop.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 10 });
  const lista = await tagokkal([g, lp]);
  for (let i = 0; i < 2; i++) for (const e of lista) await esemenyMentese(tar, e);
  const kornyezete = (ki) => ({ koino: KOINO, kulcspar: ki.kulcspar, szerzo: ki.szerzo, tar });
  const telefonSzabad = await szabadTudatpontjaim(kornyezete(telefon));
  let telefonHiba = null;
  try { await tudatpontRendezese(kornyezete(telefon), g.azonosito, 5); } catch (h) { telefonHiba = h.message; }
  const laptopSzabad = await szabadTudatpontjaim(kornyezete(laptop));
  const uj = await tudatpontRendezese(kornyezete(laptop), g.azonosito, 20);
  return telefonSzabad === 0 && /Kereted 0/.test(telefonHiba ?? '') && laptopSzabad === TUDATPONT_KERET - 10
    && uj?.adat?.pont === 20 && uj.keszulek === laptop.keszulek;
});

// ===================================
// 4/b. ⭐⭐ A KERET ÁTADÁSA ÉS ÁTVÉTELE (①b (2b) — 9.9)
// ===================================

/** Egy laptop (a belépéssel — a teljes kerettel), egy telefon (ugyanaz az azonosság), egy gondolat a laptop 10 pontjával — tárban. */
async function ketKeszulek() {
  const tar = await ujTar();
  const laptop = await ujEember(KOINO);
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'Közös' });
  const lp = await laptop.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 10 });
  const lista = await tagokkal([g, lp]);
  for (let i = 0; i < 2; i++) for (const e of lista) await esemenyMentese(tar, e);
  // A két készülék találkozott (③): egymás tanúsítványát ismerik — a telefoné így a laptop tárában is megvan.
  await tar.tanusitvanyFelvetele(telefon.kulcspar.tanusitvany);
  const kornyezete = (ki) => ({ koino: KOINO, kulcspar: ki.kulcspar, szerzo: ki.szerzo, tar });
  return { tar, laptop, telefon, g, kL: kornyezete(laptop), kT: kornyezete(telefon) };
}

/**
 * Egy esemény a művelet NÉLKÜL — a lánc végére, a lánc-gyökérrel és a bizonyítékkal (amit a művelet nem írna alá: a csökkenő átadás,
 * a kereten túli átadás, az ismételt vagy hamis bizonyítékú átvétel). `kapottKulcs`: átvételnél az adó (a kapott-fa bizonyítéka).
 */
async function nyersen(tar, ember, tipus, adat, { kapottKulcs = null, hamisKapott = false, bizonyitekKulcs = null } = {}) {
  const veg = await ujSajatHelye(tar, ember.keszulek, KOINO, tipus, adat);
  // `bizonyitekKulcs`: az átadás bizonyítéka egy MÁSIK levélé (a hamis bizonyíték).
  const r = await lancUjEsemenyhez(tar, KOINO, ember.keszulek, veg.sorszam, null,
    tipus === 'KeretAtadas' ? bizonyitekKulcs ?? adat.entitas : null, kapottKulcs);
  // A hamis: az üres kapott-fa bizonyítéka (mintha még semmit nem vettem volna át) — a valódi gyökérhez nem illik.
  const kapottB = hamisKapott ? await allapotBizonyitek(ujAllapotFa(KAPOTT_FAJTA, KAPOTT_HOSSZ), kapottKulcs) : r.kapottBizonyitek;
  const bizonyitek = tipus === 'KeretAtadas' ? r.bizonyitek : kapottB;
  return esemenyLetrehozasa({ koino: KOINO, tipus, adat: { ...adat, bizonyitek }, entitas: null, entitasSorszam: 1, latott: [],
    lancGyoker: r.lancGyoker, ...veg }, ember.kulcspar);
}

proba('⭐⭐ A KERET ÁTADÁSA ÉS ÁTVÉTELE (9.9) — a laptop átad, a telefon átveszi: a telefon kerete nő (a kapott-fában), a laptopé fogy; az állapot mindhármat számolja', async () => {
  const { tar, laptop, telefon, g, kL, kT } = await ketKeszulek();
  const telefonElotte = await szabadTudatpontjaim(kT);
  const a1 = await keretAtadasa(kL, telefon.keszulek, 300);
  const laptopUtana = await szabadTudatpontjaim(kL);
  const v1 = await keretAtvetele(kT, a1);
  const telefonUtana = await szabadTudatpontjaim(kT);
  const tp = await tudatpontRendezese(kT, g.azonosito, 50);
  // A második átadás halmozott: a fogadó levele 300 → 400.
  const a2 = await keretAtadasa(kL, telefon.keszulek, 100);
  const v2 = await keretAtvetele(kT, a2);
  const telefonVegul = await szabadTudatpontjaim(kT);
  let ujra = null;
  try { await keretAtvetele(kT, a1); } catch (h) { ujra = h.message; }
  // A következő eseménye már a 400-as kapottat köti (a gyorsítótárból folytatva).
  const tp2 = await tudatpontRendezese(kT, g.azonosito, 60);
  const allapot = allapotSzamitasa(await koinoEsemenyei(tar, KOINO));
  const kiesett = new Set(allapot.kivetelek.map((k) => k.azonosito));
  // ⛔ A becsületes telefon ellen nincs vád: a pontja a kapott keretével számít, a következő eseménye ezt az állapotot köti. A vád
  // a lánc ALAPJÁT kapja (0) — a kapottat az esemény aláírt előképe adja hozzá.
  const vad = await ellentmondasEllenorzese({ kit: telefon.szerzo, fajta: 'folytonossag', vadpont: v2.sorszam, esemeny: tp,
    kovetkezo: v2 }, KOINO, { tudatpontKeret: 0, tanusitvany: (k) => tar.tanusitvany(k) });
  return v2.elozo === tp.azonosito && vad.rendben === false && /nincs ellentmondás/.test(vad.ok ?? '') && telefonElotte === 0 && a1.adat.pont === 300 && a1.adat.kiosztva === 310 && laptopUtana === TUDATPONT_KERET - 310
    && telefonUtana === 300 && tp.lancGyoker.kapott.o[0] === 300 && a2.adat.pont === 400 && v2.lancGyoker.kapott.o[0] === 300
    && telefonVegul === 350 && /nem számítana/.test(ujra ?? '')
    && tp2.lancGyoker.kapott.o[0] === 400 && [a1, v1, tp, a2, v2, tp2].every((e) => !kiesett.has(e.azonosito)) && laptop.szerzo === telefon.szerzo;
});

proba('⛔⛔ A KERET NEM SZAPORODHAT — a csökkenő átadás, a kereten túli átadás átvétele és az ismételt átvétel nem számít; a hamis kapott-bizonyíték a kapun elbukik', async () => {
  const { tar, laptop, telefon, g, kL, kT } = await ketKeszulek();
  const a1 = await keretAtadasa(kL, telefon.keszulek, 300);
  const v1 = await keretAtvetele(kT, a1);
  // ⛔ Egy átadás, aminek a bizonyítéka egy másik levélé (a gondolaté): a kapu elveti (D81).
  const rosszBiz = await nyersen(tar, laptop, 'KeretAtadas', { entitas: telefon.keszulek, pont: 900, kiosztva: 910 },
    { bizonyitekKulcs: g.azonosito });
  const m0 = await esemenyMentese(tar, rosszBiz);
  // ⛔ A laptop „visszaveszi”: a halmozott átadás 300 → 100 (a telefon a 300-at már átvette).
  const csokkent = await nyersen(tar, laptop, 'KeretAtadas', { entitas: telefon.keszulek, pont: 100, kiosztva: 10 + 100 });
  const m1 = await esemenyMentese(tar, csokkent);
  // ⛔ A telefon többet ad vissza, mint a kerete (300): 400 — a laptop átvétele nem számíthat.
  const tullep = await nyersen(tar, telefon, 'KeretAtadas', { entitas: laptop.keszulek, pont: 400, kiosztva: 400 });
  const m2 = await esemenyMentese(tar, tullep);
  let elore = null;
  try { await keretAtvetele(kL, tullep); } catch (h) { elore = h.message; }
  const tulAtvetel = await nyersen(tar, laptop, 'KeretAtvetel', { atadas: tullep }, { kapottKulcs: telefon.keszulek });
  const m3 = await esemenyMentese(tar, tulAtvetel);
  // ⛔ Ugyanaz az átadás másodszor.
  const ismetelt = await nyersen(tar, telefon, 'KeretAtvetel', { atadas: a1 }, { kapottKulcs: laptop.keszulek });
  const m4 = await esemenyMentese(tar, ismetelt);
  // ⛔ A hamis kapott-bizonyíték (mintha még semmit nem vett volna át) — a kapu elveti.
  const a2 = await keretAtadasa(kL, telefon.keszulek, 50);
  const hamis = await nyersen(tar, telefon, 'KeretAtvetel', { atadas: a2 }, { kapottKulcs: laptop.keszulek, hamisKapott: true });
  const m5 = await esemenyMentese(tar, hamis);
  // ⛔ Egy átírt átadás (a pontja 5000 — az aláírás nem illik rá): a kapu elveti.
  const hamisAtadas = await nyersen(tar, telefon, 'KeretAtvetel', { atadas: { ...a2, adat: { ...a2.adat, pont: 5000 } } },
    { kapottKulcs: laptop.keszulek });
  const m6 = await esemenyMentese(tar, hamisAtadas);
  const allapot = allapotSzamitasa(await koinoEsemenyei(tar, KOINO));
  const ok = (e) => allapot.kivetelek.find((k) => k.azonosito === e.azonosito)?.ok ?? '';
  // A telefon saját lánc-gyökere sem számolja a kereten túli átadását (a következő eseménye a 0-s kiosztást köti).
  return ismetelt.lancGyoker.kiosztas.o[0] === 0 && !m0.mentve && m1.mentve && m2.mentve && m3.mentve && m4.mentve && !m5.mentve && !m6.mentve && !!v1
    && /halmozott/.test(ok(csokkent)) && /keretet/.test(ok(tullep)) && /átadás nem számít/.test(ok(tulAtvetel))
    && /nem hoz újat/.test(ok(ismetelt)) && /nem számítana/.test(elore ?? '');
});

proba('⛔ CSAK A MÁSIK KÉSZÜLÉKEM IDE SZÓLÓ ÁTADÁSA VEHETŐ ÁT — a kapu (az alak) és a számítás is elveti a máshová szólót; az önmagának szóló átadást az alak', async () => {
  const { tar, laptop, telefon, kL } = await ketKeszulek();
  const a1 = await keretAtadasa(kL, telefon.keszulek, 300);
  // A laptop maga venné át a telefonnak szóló (és a saját) átadását.
  const rossz = await nyersen(tar, laptop, 'KeretAtvetel', { atadas: a1 }, { kapottKulcs: laptop.keszulek });
  const m1 = await esemenyMentese(tar, rossz);
  const szamitas = keretAtvetelMerlege(rossz, ujLancAllas(), true, { keret: TUDATPONT_KERET, horgonyLanca: null });
  // Az önmagának szóló átadás.
  const onmaga = await nyersen(tar, laptop, 'KeretAtadas', { entitas: laptop.keszulek, pont: 10, kiosztva: 320 });
  const m2 = await esemenyMentese(tar, onmaga);
  return !m1.mentve && /átvétel/.test(m1.ok ?? '') && /ide szóló/.test(szamitas.elvetve ?? '') && !m2.mentve
    && /másik készülék/.test(m2.ok ?? '');
});

proba('⭐⭐ AZ ÁTVÉTEL EGY ESEMÉNYBŐL ELLENŐRIZHETŐ — az adó lánca nélkül is: a telefon pontja a kapott keretével számít', async () => {
  const { laptop, telefon, g, kL, kT } = await ketKeszulek();
  const a1 = await keretAtadasa(kL, telefon.keszulek, 200);
  const v1 = await keretAtvetele(kT, a1);
  const tp = await tudatpontRendezese(kT, g.azonosito, 150);
  // Egy harmadik gép csak a gondolatot, a laptop első pontját és a telefon láncát látja — a laptop átadását csak az átvételben.
  const lista = await tagokkal([g, v1, tp]);
  const allapot = allapotSzamitasa(lista);
  const kiesett = new Set(allapot.kivetelek.map((k) => k.azonosito));
  return !lista.some((e) => e.azonosito === a1.azonosito) && !kiesett.has(v1.azonosito) && !kiesett.has(tp.azonosito)
    && v1.keszulek === telefon.keszulek && laptop.keszulek !== telefon.keszulek;
});

proba('⭐⭐ AZ ÁTFOLYÁS A HATÁRIG (8.1 — 93. (g)) — a különbség fele, a fogadó része a határig; a függő átadás is számít; a tolvaj a határnál megáll', async () => {
  // A modell: a 93. (g) ellopott telefonja — minden szabad pontját azonnal elhelyezi; határ 2000-nél ott marad.
  let laptopSzabad = 4000, telefonResz = 1000;
  for (let t = 0; t < 10; t++) {
    const m = atfolyasMerteke({ adoSzabad: laptopSzabad, kapoSzabad: 0, kapoResze: telefonResz, hatar: 2000 });
    laptopSzabad -= m; telefonResz += m;
  }
  // Ha a határ messze van, a különbség FELE (a kettő szabadja kiegyenlítődik): 1000 és 200 → 400.
  const fele = atfolyasMerteke({ adoSzabad: 1000, kapoSzabad: 200, kapoResze: 200, hatar: 5000 });
  // A művelet: a laptop 9990 szabad, a telefon 0 — a határ 3000.
  const { g, telefon, kL, kT } = await ketKeszulek();
  const elso = await keretAtfolyasa(kL, telefon.keszulek, { hatar: 3000 });
  const ujra = await keretAtfolyasa(kL, telefon.keszulek, { hatar: 3000 });   // a telefon még nem vette át: nem ad újra
  await keretAtvetele(kT, elso.atadas);
  const atvetelUtan = await keretAtfolyasa(kL, telefon.keszulek, { hatar: 3000 });
  await tudatpontRendezese(kT, g.azonosito, 2500);                            // a telefon elhelyez — a része 3000 marad
  const elhelyezesUtan = await keretAtfolyasa(kL, telefon.keszulek, { hatar: 3000 });
  return fele === 400 && telefonResz === 2000 && laptopSzabad === 3000
    && elso.merteke === 3000 && elso.atadas?.adat?.pont === 3000 && ujra.merteke === 0 && ujra.atadas === null
    && atvetelUtan.merteke === 0 && elhelyezesUtan.merteke === 0 && (await szabadTudatpontjaim(kT)) === 500;
});

// ===================================
// 5. A KÉSZÜLÉK A GÉPEN
// ===================================

proba('⭐ A KÉSZÜLÉK A GÉPEN — létrejön, újranyitáskor ugyanaz, és egy másik azonosságnál újat tanúsít', async () => {
  let tartalom = null;
  const tarolo = { olvas: async () => tartalom, ir: async (x) => { tartalom = JSON.parse(JSON.stringify(x)); } };
  const az = await tesztKeszulek();
  const elso = await keszulekBiztositasa(tarolo, az.azonossagKulcspar, 'laptop');
  const ujra = await keszulekBiztositasa(tarolo, az.azonossagKulcspar, 'laptop');
  const masik = await tesztKeszulek();
  const masikNal = await keszulekBiztositasa(tarolo, masik.azonossagKulcspar, 'laptop');
  // A betöltött készülékkel írt esemény ellenőrizhető (a privát fele is visszajött).
  const e = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: 'x' }, sorszam: 1 }, ujra.eszkoz);
  return elso.ujE === true && ujra.ujE === false && ujra.eszkoz.keszulek === elso.eszkoz.keszulek
    && ujra.eszkoz.azonossag === az.azonossag && masikNal.ujE === true && masikNal.eszkoz.azonossag === masik.azonossag
    && masikNal.eszkoz.keszulek !== elso.eszkoz.keszulek && (await esemenyEllenorzese(e)).rendben;
});

// ===================================
// 6. A CSOMAG TANÚSÍTVÁNY-KERESŐJE
// ===================================

proba('⭐ A CSOMAG TANÚSÍTVÁNY-KERESŐJE csak a hiteles, a szerzőt és a készüléket nevező tanúsítványt veszi fel — a többit a tárból kéri', async () => {
  const anna = await ujEember(KOINO);
  const e1 = await anna.tesz('GondolatLetrehozas', { cim: 'Első' });
  const bela = await ujEember(KOINO);
  const b1 = await bela.tesz('GondolatLetrehozas', { cim: 'Béla első' });
  // Egy csomagbeli esemény, aminek a tanúsítványát átírták (a név): a kereső nem veszi fel.
  const atirt = { ...b1, tanusitvany: { ...b1.tanusitvany, nev: 'hamis' } };
  const k1 = await tanusitvanyKereso([e1, atirt]);
  const tarbol = { tanusitvany: async (k) => (k === bela.keszulek ? bela.kulcspar.tanusitvany : null) };
  const k2 = await tanusitvanyKereso([e1, atirt], tarbol);
  return (await k1(anna.keszulek))?.azonossag === anna.szerzo && (await k1(bela.keszulek)) === null
    && (await k2(bela.keszulek))?.azonossag === bela.szerzo;
});

export default futtatas;
