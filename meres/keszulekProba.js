// meres/keszulekProba.js

// Felelősség: ⭐⭐ D128 (ET-3 — a kulcs: több készülék és a helyreállítás) — bizonyítani, hogy a KÉSZÜLÉK és a TANÚSÍTVÁNYA azt
// teszi, amiért született (az ①a lépés):
//   · a tanúsítványt az azonosság kulcsa írja alá — más kulccsal, átírva, fölös mezővel nem megy át;
//   · a lánc első eseménye hozza a tanúsítványt, a többi nem — az alak mást nem enged;
//   · a kapu csak tanúsított eseményt enged be: a lánc első eseménye nélkül „hiányzik”; egy idegen azonosság nevében írt esemény
//     (saját vagy semmilyen tanúsítvánnyal) elbukik; egy készüléket csak egy azonosság tanúsíthat;
//   · két készülék egy azonossággal: azonos sorszámuk nem elágazás, mindkét lánc bejut és számít;
//   · ⭐ (①b (2a)) a keret a horgony láncáé: a belépést író készülék kapja a koino keretét, a többié 0 — a szabály-réteg és a tár
//     (a művelet, a vád) ugyanazt mondja;
//   · ⭐ (①b (2b)) a keret átadása és átvétele: a fogadó kerete nő (a lánc-gyökér kapott-fája), az adóé fogy; a csökkenő átadás, a
//     kereten túli átadás átvétele és az ismételt átvétel nem számít; a hamis kapott-bizonyíték a kapun elbukik; és az átvétel
//     az adó lánca nélkül, egyetlen eseményből ellenőrizhető;
//   · ⭐ (①b (2c)) az átfolyás: a különbség fele, a fogadó határáig — a még át nem vett átadás is a részéhez számít; egy tolvaj a
//     határnál megáll (a 93. (g) modellje);
//   · ⭐ (①b (3)) az azonosság pontja egy entitáson a készülékei pontjainak összege — az állapotban, az össz-pont fejlécében (a
//     levél a láncok pont-eseményeinek összege, a tartó mintái mindet hozzák) és a döntésben (a tulajdonos, a küszöb);
//   · ⭐ (①b (4)) a szavazás és a javaslattétel joga készülékenként: ahol a pont a másik készülékemen van, ez előbb 1 pontot tesz rá;
//   · ⭐ (①d) a kizárás és az örökös: a vágás utáni (ellopott) események nem számítanak, az örökös folytatja a láncot; a fel nem
//     sorolt koinoban a kizárt minden eseménye kiesik; a hamis kizárást és az illetéktelen folytatást a kapu elveti;
//   · a készülék a gépen: létrejön, újranyitáskor ugyanaz, másik azonosságnál új;
//   · a csomag tanúsítvány-keresője csak a hiteles, a szerzőt és a készüléket nevező tanúsítványt veszi fel.
//
// Futtatás: node meres/mind.js keszulek

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { probaGyujtemeny, tesztKeszulek, ujEember, tagokkal, probaKiseroval } from './probaFuttato.js';
import {
  osszPontokSzamitasa, reszfaLevelei, reszfaKarbantarto, reszfaGyokere, gyerekJegyzek, mintaHelyek, fejlecMintai,
  fejlecEllenorzese, OSSZPONT_FA, RESZFA_HOSSZ
} from '../js/allapot/osszPont.js';
import { teljesTarto } from '../js/allapot/osszegzoTartas.js';
import { javaslatokSzamitasa } from '../js/allapot/javaslatSzamitas.js';
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
import { tudatpontRendezese, szabadTudatpontjaim, keretAtadasa, keretAtvetele, keretAtfolyasa, atfolyasMerteke,
  javaslatLetrehozasa, szavazas, keszulekKizarasa, kizarasBevitele } from '../js/muveletek.js';
import { kizarasKeszitese } from '../js/kulcs/keszulek.js';
import { ujAzonossag, szuletesEllenorzese, szuletesKeszitese, csereLenyomata, azonossagNeve, kulcscsereKeszitese, kezeloKulcsLanc,
  lancErosebbE }
  from '../js/kulcs/azonossag.js';
import { szemelyesKezfogasAlairasa, keszulekKezfogasEllenorzese } from '../js/csere/titkositas.js';
import { ujSajatHelye } from '../js/tar/esemenyTar.js';
import { lancUjEsemenyhez, KAPOTT_FAJTA, KAPOTT_HOSSZ } from '../js/allapot/lancGyoker.js';
import { ujAllapotFa, allapotBizonyitek, allapotBeallitas, allapotGyokere } from '../js/esemeny/osszegzoFa.js';
import { ellentmondasEllenorzese } from '../js/allapot/ellentmondas.js';
import { tarKizarasai } from '../js/allapot/kizaras.js';
import { keretAtvetelMerlege, ujLancAllas } from '../js/allapot/szabalyok.js';
import { sajatSzavazat } from '../js/allapot/javaslatSzamitas.js';

const { proba, futtatas } = probaGyujtemeny('A készülék és a tanúsítványa (D128 — ET-3)');

const KOINO = 'keszulek-proba';

/** Egy új, üres tár. */
async function ujTar() {
  return esemenyTarNyitasa(KOINO, await mkdtemp(join(tmpdir(), 'koino-keszulek-')));
}

/**
 * ⭐⭐ D128 (②a): egy tanúsítvány SZABÁLYOSAN aláírva tetszőleges tartalommal (a rontás-próbákhoz: egy tolvaj a saját kulcsával
 * írhat alá egy idegen nevet — a születése nem az).
 */
async function alairtTanusitvany(kulcspar, t) {
  const tartalom = { tipus: t.tipus, azonossag: t.azonossag, keszulek: t.keszulek, nev: t.nev, ido: t.ido };
  const alairas = await crypto.subtle.sign({ name: 'Ed25519' }, kulcspar.privateKey, new TextEncoder().encode(await lenyomat(tartalom)));
  return { ...tartalom, szuletes: t.szuletes, ...(t.cserek ? { cserek: t.cserek } : {}), alairas: bajtokBase64Url(new Uint8Array(alairas)) };
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
  // ⭐⭐ D128 (②a): (5a) csak a nevet írja át — a név nem a hozott születés lenyomata; (5b) Anna SAJÁT születését teszi bele — a
  // tanúsítványt nem Anna első kulcsa írta alá.
  const tolvajT = await tanusitvanyKeszitese(tolvaj.azonossagKulcspar, uj.keszulek, 'laptop');
  // A tolvaj a SAJÁT kulcsával szabályosan aláír egy tanúsítványt Anna nevére, a saját születésével — csak a név szabálya állítja meg.
  const hamisNev = await alairtTanusitvany(tolvaj.azonossagKulcspar, { ...tolvajT, azonossag: anna.szerzo });
  const hamisSzuletes = { ...tolvajT, azonossag: anna.szerzo, szuletes: anna.kulcspar.tanusitvany.szuletes };
  const elsoHamis = async (t, cim) => kezzelAlairt({ koino: KOINO, tipus: 'GondolatLetrehozas', szerzo: anna.szerzo,
    keszulek: uj.keszulek, sorszam: 1, tanusitvany: t, adat: { cim } }, uj.privateKey);
  for (const e of [sajatLancan, masAlairta, await elsoHamis(hamisNev, 'Hamis 5a'), await elsoHamis(hamisSzuletes, 'Hamis 5b')]) {
    m.push(await esemenyMentese(tar, e));
  }
  const okok = m.map((r) => r.ok ?? '');
  const bejutott = (await koinoEsemenyei(tar, KOINO)).filter((e) => e.szerzo === anna.szerzo).length;
  return m.every((r) => r.mentve === false)
    && /a szerzőt és a készüléket nevezi/.test(okok[0]) && m[1].hianyzik === true
    && /másik azonosság tanúsítványát/.test(okok[2]) && /nem a készüléké/.test(okok[3])
    && /a név nem ennek a születésnek a lenyomata/.test(okok[4]) && /nem az azonosság kulcsa írta alá/.test(okok[5]) && bejutott === 1;
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

proba('⭐⭐ A KERET A HORGONY LÁNCÁÉ (9.9) — a belépést író készülék kapja a koino keretét, a másiké 0: a pontja elvetődik; a tár (a művelet és a vád) ugyanígy látja', async () => {
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
// 4/c. ⭐⭐ AZ AZONOSSÁG PONTJA A KÉSZÜLÉKEI ÖSSZEGE (①b (3))
// ===================================

proba('⭐⭐ AZ AZONOSSÁG PONTJA A KÉSZÜLÉKEI ÖSSZEGE (①b (3)) — az állapotban 10 + 50; az össz-pont levele a két pont-esemény összege, a tartó mintái mindkettőt hozzák, a hamis levél lebukik', async () => {
  const { tar, laptop, telefon, g, kL, kT } = await ketKeszulek();
  await keretAtvetele(kT, await keretAtadasa(kL, telefon.keszulek, 300));
  const tp = await tudatpontRendezese(kT, g.azonosito, 50);
  const minden = await koinoEsemenyei(tar, KOINO);
  const allapot = allapotSzamitasa(minden);
  const ent = allapot.entitasok.get(g.azonosito);
  const kulcs = laptop.szerzo + '|' + g.azonosito;
  const pe = allapot.pontEsemenyek.get(kulcs);
  const lp = minden.find((e) => e.tipus === 'TudatpontRendezes' && e.keszulek === laptop.keszulek && e.adat.entitas === g.azonosito);
  // A fejléc: a tartó (a teljes tartás szerepe) mintákat ad — a minták a szerző levelére esnek, és mindkét pont-eseményt hozzák.
  const olvas = new Map(minden.map((e) => [e.azonosito, probaKiseroval(e)]));
  const karbantarto = reszfaKarbantarto();
  const tarto = teljesTarto({ teljesE: async () => true, kep: async () => ({ allapot, bemondasok: new Map() }), karbantarto,
    esemenyOlvas: async (az) => olvas.get(az) ?? null, lezarasiEsemenyek: async () => [] });
  const o = osszPontokSzamitasa(allapot.entitasok);
  const fa = await reszfaKarbantarto().fa(g.azonosito, reszfaLevelei(g.azonosito, allapot, o, gyerekJegyzek(allapot.entitasok)));
  const gyoker = await reszfaGyokere(fa);
  const helyek = mintaHelyek(gyoker.o[0], 8);
  const valasz = (await tarto.mintak({ szelet: { [g.azonosito]: helyek } })).szelet[g.azonosito];
  const kapott = new Map(valasz.esemenyek.map((e) => [e.azonosito, e]));
  const ell = await fejlecEllenorzese({ azonosito: g.azonosito, gyoker, helyek, mintak: valasz.mintak, esemenyek: kapott });
  // ⛔ A hamis levél: 60-at mond, de csak a laptop 10-es eseményét mutatja — és ugyanazt kétszer (20-ra).
  const hamis = async (ertek, pont) => {
    const f = ujAllapotFa(OSSZPONT_FA, RESZFA_HOSSZ);
    await allapotBeallitas(f, 'p:' + laptop.szerzo, ertek, [pont, 0, 0]);
    const gy = await allapotGyokere(f);
    const h = mintaHelyek(gy.o[0], 4);
    return fejlecEllenorzese({ azonosito: g.azonosito, gyoker: gy, helyek: h, mintak: await fejlecMintai(f, h), esemenyek: olvas });
  };
  const egyEsemeny = await hamis({ e: lp.azonosito }, 60);
  const ketszer = await hamis({ e: [lp.azonosito, lp.azonosito] }, 20);
  return ent?.hozzajarulok.get(laptop.szerzo)?.pont === 60 && ent.hozzajarulok.get(laptop.szerzo).szerep === 'aktiv'
    && ent.osszesPont === 60 && allapot.kiosztasok.get(kulcs) === 60
    && Array.isArray(pe) && pe.length === 2 && pe.includes(tp.azonosito) && pe.includes(lp.azonosito)
    && gyoker.o[0] === 60 && kapott.has(tp.azonosito) && kapott.has(lp.azonosito) && ell.rendben && ell.ellenorzott === 8
    && !egyEsemeny.rendben && /mást mond/.test(egyEsemeny.ok ?? '') && !ketszer.rendben && /mást mond/.test(ketszer.ok ?? '');
});

proba('⭐⭐ A DÖNTÉSBEN IS (①b (3)) — a laptop leveszi a pontját, a telefoné marad: az azonosság tulajdonos, a szavazata számít; a küszöbe a később mondott (a telefoné), nem a nagyobb sorszámú', async () => {
  // ⚠️ A döntés rétege egymagában (a keret szabálya nélkül — azt a fenti próbák mérik): a próba-segéd eseményei.
  const t0 = Date.UTC(2026, 0, 1);
  const NAP = 24 * 3600 * 1000;
  const laptop = await ujEember(KOINO);
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const b = await ujEember(KOINO);
  const c = await ujEember(KOINO);
  const g = await b.tesz('GondolatLetrehozas', { cim: 'Döntendő', meret: 500 }, t0);
  const lista = [g];
  const pont = async (ki, p, ido) => lista.push(await ki.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: p, szerep: 'aktiv' }, ido));
  await pont(b, 10, t0);
  await pont(c, 10, t0);
  await pont(telefon, 10, t0 + 1);                        // a telefon lánca: 1.
  await pont(laptop, 10, t0 + 2);                         // a laptop lánca: 1.
  await pont(laptop, 0, t0 + 3);                          // a laptop lánca: 2. — leveszi; a telefoné marad
  const kuszob = (x) => ({ entitas: g.azonosito,
    ertekek: { elfogadasiKuszob: x, reszveteliKuszob: 0, minimumDontesiIdo: 3600, maximumDontesiIdo: 7200 } });
  lista.push(await laptop.tesz('ErtekJavaslat', kuszob(60), t0 + 4));   // a laptop lánca: 3.
  lista.push(await telefon.tesz('ErtekJavaslat', kuszob(90), t0 + 5));  // a telefon lánca: 2. — de KÉSŐBB
  const javaslat = await b.tesz('Javaslat', { fajta: 'szerkesztesi', erintett: g.azonosito, muvelet: 'Modositas',
    valtozas: { cim: 'Új cím' }, indoklas: 'Jobb.' }, t0 + 1000);
  lista.push(javaslat);
  lista.push(...await b.szavaz(javaslat, { szavazat: 'Tamogat' }, t0 + 2000));
  lista.push(...await c.szavaz(javaslat, { szavazat: 'Ellenez' }, t0 + 2000));
  // A javaslaton is: a telefon 1 pontot tesz rá, a laptop rátesz, majd leveszi — az azonosságé a telefon 1 pontja marad.
  const jp = async (ki, p, ido) => lista.push(await ki.tesz('TudatpontRendezes', { entitas: javaslat.azonosito, pont: p }, ido));
  await jp(telefon, 1, t0 + 1500);
  await jp(laptop, 1, t0 + 1600);
  await jp(laptop, 0, t0 + 1700);
  lista.push(...await telefon.szavaz(javaslat, { szavazat: 'Tamogat' }, t0 + 2000));
  // Egy második javaslat, amire az azonosság NEM szavaz: aktív tulajdonosként (a telefon pontja aktív) a nevezőben van.
  const javaslat2 = await b.tesz('Javaslat', { fajta: 'szerkesztesi', erintett: g.azonosito, muvelet: 'Modositas',
    valtozas: { cim: 'Más cím' }, indoklas: 'Más.' }, t0 + 1100);
  lista.push(javaslat2, ...await b.szavaz(javaslat2, { szavazat: 'Tamogat' }, t0 + 2100));
  const bemenet = await tagokkal(lista);
  const allapot = allapotSzamitasa(bemenet);
  const dontesek = javaslatokSzamitasa(bemenet, allapot, t0 + 10 * NAP);
  const j = dontesek.get(javaslat.azonosito);
  const j2 = dontesek.get(javaslat2.azonosito);
  const ok = j?.szavazok === 3 && j.tamogatok === 2 && j.kuszobok?.elfogadasiKuszob === 90 && j.statusz === 'elvetve'
    && j2?.szavazok === 1 && j2.nevezo === 3;
  if (!ok) process.stderr.write('    (' + JSON.stringify({ j: [j?.szavazok, j?.tamogatok, j?.kuszobok?.elfogadasiKuszob, j?.statusz],
    j2: [j2?.szavazok, j2?.nevezo] }) + ')\n');
  return ok;
});

proba('⭐⭐ A SZAVAZÁS ÉS A JAVASLAT JOGA KÉSZÜLÉKENKÉNT (12. pont — (A)) — a pont a laptopon van: a telefon előbb magától 1 pontot tesz a gondolatra, és a javaslata, ill. a szavazata számít', async () => {
  const NAP = 24 * 3600 * 1000;
  const telefonPontja = (minden, telefon, g) => minden.find((e) => e.tipus === 'TudatpontRendezes' && e.keszulek === telefon.keszulek
    && e.adat.entitas === g.azonosito);
  // (a) A telefon tesz javaslatot a laptop gondolatára (a telefonnak itt még nincs pontja).
  const A = await ketKeszulek();
  await keretAtvetele(A.kT, await keretAtadasa(A.kL, A.telefon.keszulek, 300));
  const ja = await javaslatLetrehozasa(A.kT, { erintett: A.g.azonosito, muvelet: 'Modositas', valtozas: { cim: 'Új' }, indoklas: 'x' });
  const mindenA = await koinoEsemenyei(A.tar, KOINO);
  const allapotA = allapotSzamitasa(mindenA);
  const kiesettA = new Set(allapotA.kivetelek.map((k) => k.azonosito));
  // (b) A laptop tesz javaslatot, a telefon később ellenez — az azonosság utolsó állítása a telefoné.
  const B = await ketKeszulek();
  await keretAtvetele(B.kT, await keretAtadasa(B.kL, B.telefon.keszulek, 300));
  const jb = await javaslatLetrehozasa(B.kL, { erintett: B.g.azonosito, muvelet: 'Modositas', valtozas: { cim: 'Új' }, indoklas: 'x' });
  const szt = await szavazas(B.kT, jb.azonosito, 'Ellenez');
  // (c) Egy idegen azonosság gondolata és javaslata: az azonosságomnak sincs rajta pontja — a telefon NEM tesz rá pontot.
  const idegen = await ujEember(KOINO);
  const gc = await idegen.tesz('GondolatLetrehozas', { cim: 'Idegen' });
  const cp = await idegen.tesz('TudatpontRendezes', { entitas: gc.azonosito, pont: 10 });
  const jc = await idegen.tesz('Javaslat', { fajta: 'szerkesztesi', erintett: gc.azonosito, muvelet: 'Modositas',
    valtozas: { cim: 'X' }, indoklas: 'y' });
  for (let i = 0; i < 2; i++) for (const e of await tagokkal([gc, cp, jc])) await esemenyMentese(B.tar, e);
  await szavazas(B.kT, jc.azonosito, 'Tamogat');
  const mindenB = await koinoEsemenyei(B.tar, KOINO);
  const allapotB = allapotSzamitasa(mindenB);
  const db = javaslatokSzamitasa(allapotB.szamitok, allapotB, Date.now() + 10 * NAP).get(jb.azonosito);
  return telefonPontja(mindenA, A.telefon, A.g)?.adat?.pont === 1 && !kiesettA.has(ja.azonosito)
    && telefonPontja(mindenB, B.telefon, B.g)?.adat?.pont === 1 && szt.keszulek === B.telefon.keszulek
    && db?.szavazok === 1 && db.ellenzok === 1 && db.tamogatok === 0 && !telefonPontja(mindenB, B.telefon, gc);
});

// ===================================
// 4/d. ⭐⭐ A KIZÁRÁS ÉS AZ ÖRÖKÖS (①d — KU7 (A), 9.10)
// ===================================

proba('⭐⭐ A KIZÁRÁS ÉS AZ ÖRÖKÖS (①d) — az ellopott telefon vágás utáni pontja nem számít; a laptop folytatja a telefon láncát (átrendezi a pontját); a hamis kizárást és az illetéktelen folytatást a kapu elveti', async () => {
  const { tar, laptop, telefon, g, kL, kT } = await ketKeszulek();
  await keretAtvetele(kT, await keretAtadasa(kL, telefon.keszulek, 300));       // a telefon lánca: 1.
  const tp1 = await tudatpontRendezese(kT, g.azonosito, 50);                     // 2. — még a gazdáé
  // ⛔ A telefont ellopják: a tolvaj 200-at tesz a gondolatra (a lánca 3.).
  const tolvaj = await tudatpontRendezese(kT, g.azonosito, 200);
  // A laptop kizárja: a vágás a 2., az örökös a laptop.
  const { kizaras } = await keszulekKizarasa(kL, laptop.kulcspar.azonossagKulcspar, telefon.keszulek,
    [{ koino: KOINO, vagas: tp1.sorszam, orokos: laptop.keszulek }]);
  const kizarasUtan = allapotSzamitasa(await koinoEsemenyei(tar, KOINO));
  // Az örökös folytatja a telefon láncát (a vágás után — a 3. helyen, a tolvajé helyett): 50 → 20.
  const kO = { ...kL, keszulek: telefon.keszulek };
  const folytatas = await tudatpontRendezese(kO, g.azonosito, 20);
  const folytatas2 = await tudatpontRendezese(kO, g.azonosito, 25);   // a következő (a lánc-gyökér a tolvajé nélkül ép)
  await tudatpontRendezese(kO, g.azonosito, 20);
  const vegul = allapotSzamitasa(await koinoEsemenyei(tar, KOINO));
  // Egy másik gépen a tolvaj eseménye UTOLJÁRA érkezik: nem elágazás (nem a szerző eseménye — a kizárás miatt).
  const tar2 = await ujTar();
  const tolvajNelkul = (await koinoEsemenyei(tar, KOINO)).filter((e) => e.azonosito !== tolvaj.azonosito);
  for (let i = 0; i < 2; i++) for (const e of tolvajNelkul) await esemenyMentese(tar2, e);
  const mTolvaj = await esemenyMentese(tar2, tolvaj);
  // …és fordítva: a tolvajé már ott van, az örökös folytatása érkezik utoljára — az sem elágazás.
  const tar3 = await ujTar();
  const folytatasNelkul = (await koinoEsemenyei(tar, KOINO)).filter((e) => e.azonosito !== folytatas.azonosito);
  for (let i = 0; i < 2; i++) for (const e of folytatasNelkul) await esemenyMentese(tar3, e);
  const mFolytatas = await esemenyMentese(tar3, folytatas);
  // A tár a kizárást indexeli — a lemezről újranyitva és a pillanatképből is (a kapu így nem tölti be az azonosság minden eseményét).
  const hely = await mkdtemp(join(tmpdir(), 'koino-kizaras-'));
  const t1 = await esemenyTarNyitasa(KOINO, hely);
  for (let i = 0; i < 2; i++) for (const e of await koinoEsemenyei(tar, KOINO)) await esemenyMentese(t1, e);
  const lemezrol = await esemenyTarNyitasa(KOINO, hely, { kepKuszob: 1 });
  const kepbol = await esemenyTarNyitasa(KOINO, hely, { kepKuszob: 1 });
  // ⭐ A kizárások kérdése a képből nyitott tárban csak a kizárás testét tölti be (egyet), nem az azonosság minden eseményét.
  const kizarasokKepbol = await tarKizarasai(kepbol, laptop.szerzo);
  const betoltott = kepbol.mutatoAllapota().betoltottTest;
  const indexben = [(await lemezrol.kezelesEsemenyei(laptop.szerzo)).length, kizarasokKepbol.size,
    kepbol.mutatoAllapota().pillanatkepbol, betoltott];
  // ⛔ A kapu: a megváltoztatott kizárás (az aláírás nem illik rá), egy MÁSIK készülékem folytatása (nem az örökös), és a vágás
  // előtti helyre írt folytatás.
  let hamis = null;
  try { await kizarasBevitele(kL, { ...kizaras, koinok: [{ ...kizaras.koinok[0], vagas: 99 }] }); } catch (h) { hamis = h.message; }
  const tablet = await tesztKeszulek('tablet', laptop.kulcspar.azonossagKulcspar);
  await tar.tanusitvanyFelvetele(tablet.tanusitvany);
  let idegenOrokos = null;
  try {
    await tudatpontRendezese({ ...kL, kulcspar: tablet, keszulek: telefon.keszulek }, g.azonosito, 10);
  } catch (h) { idegenOrokos = h.message; }
  const korai = await esemenyLetrehozasa({ koino: KOINO, tipus: 'GondolatLetrehozas', adat: { cim: 'korai' }, entitas: null,
    entitasSorszam: 1, latott: [], lancGyoker: null, lanc: telefon.keszulek, sorszam: tp1.sorszam, elozo: tp1.elozo }, laptop.kulcspar);
  const mKorai = await esemenyMentese(tar, korai);
  const pont = (a) => a.entitasok.get(g.azonosito)?.hozzajarulok.get(laptop.szerzo)?.pont;
  return tolvaj.sorszam === 3 && kizarasUtan.kizartak.some((k) => k.azonosito === tolvaj.azonosito) && pont(kizarasUtan) === 60
    && folytatas.keszulek === laptop.keszulek && folytatas.lanc === telefon.keszulek && folytatas.sorszam === 3
    && !vegul.kivetelek.some((k) => k.azonosito === folytatas.azonosito) && pont(vegul) === 30
    && /nem hiteles/.test(hamis ?? '') && /örököse/.test(idegenOrokos ?? '') && !mKorai.mentve && /örököse/.test(mKorai.ok ?? '')
    && folytatas2.lancGyoker !== null && folytatas2.sorszam === 4 && mTolvaj.mentve && !mTolvaj.elagazas
    && mFolytatas.mentve && !mFolytatas.elagazas && indexben.join() === '1,1,true,1'
    // az alak: a folytatott lánc egy MÁSIK készülék kulcsa
    && !!alakiHiba({ ...folytatas, lanc: folytatas.keszulek });
});

proba('⛔ A FEL NEM SOROLT KOINOBAN A KIZÁRT MINDEN ESEMÉNYE KIESIK — amint a kizárás odaér (bárki beviheti); egy MÁSIK azonosság kizárása semmit nem zár ki', async () => {
  const KOINO2 = 'kizaras-proba-masik';
  const laptop = await ujEember(KOINO2);
  const telefon = await ujEember(KOINO2, await tesztKeszulek('telefon', laptop.kulcspar.azonossagKulcspar));
  const idegen = await ujEember(KOINO2);
  // A telefon gondolata — a laptop pontjával (a telefoné itt kizárás nélkül számít).
  const tg = await telefon.tesz('GondolatLetrehozas', { cim: 'A telefon gondolata' });
  const lp = await laptop.tesz('TudatpontRendezes', { entitas: tg.azonosito, pont: 10 });
  // A kizárás egy MÁSIK koinot sorol fel — ebben a koinoban a vágás 0: a telefon egyetlen eseménye sem számít.
  const kizaras = await kizarasKeszitese(laptop.kulcspar.azonossagKulcspar, telefon.keszulek,
    [{ koino: KOINO, vagas: 5, orokos: laptop.keszulek }]);
  const bevitel = await idegen.tesz('Kizaras', { kizaras });                    // bárki beviheti (D80 mintája)
  // Egy idegen azonosság „kizárja” a telefont — nem az övé: semmit nem zár ki.
  const idegenKizaras = await kizarasKeszitese(idegen.kulcspar.azonossagKulcspar, telefon.keszulek,
    [{ koino: KOINO2, vagas: 0, orokos: idegen.keszulek }]);
  const idegenBevitel = await idegen.tesz('Kizaras', { kizaras: idegenKizaras });
  const nelkule = allapotSzamitasa(await tagokkal([tg, lp]));
  const idegennel = allapotSzamitasa(await tagokkal([tg, lp, idegenBevitel]));
  const vele = allapotSzamitasa(await tagokkal([tg, lp, bevitel]));
  return nelkule.entitasok.has(tg.azonosito) && idegennel.entitasok.has(tg.azonosito) && idegennel.kizartak.length === 0
    && !vele.entitasok.has(tg.azonosito) && vele.kizartak.some((k) => k.azonosito === tg.azonosito)
    // az alak: a kizárás eseménye csak a tanúsítványt hozza
    && !alakiHiba(bevitel) && !!alakiHiba({ ...bevitel, adat: { kizaras, x: 1 } });
});

// ===================================
// 4/e. ⭐⭐ A NÉV A SZÜLETÉS LENYOMATA (② a — KC1 (A))
// ===================================

proba('⭐⭐ A NÉV A SZÜLETÉS LENYOMATA (②a — KC1 (A)) — az első kulcs, a csere-kulcs lenyomata és a fizetési kulcs együtt; egy tolvaj a kulccsal sem köthet le mást ugyanarra a névre; az átírt vagy idegen kulccsal aláírt születés elbukik', async () => {
  const a = await ujAzonossag();
  const jo = await szuletesEllenorzese(a.szuletes, a.nev);
  const csereKulcs = bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', a.csere.publicKey)));
  // ⛔ A tolvaj (az első kulccsal) egy MÁSIK csere-kulcsot köt le: a születése más nevet ad — a régi nevet nem kaphatja meg.
  const masCsere = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const masCsereNyilvanos = bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', masCsere.publicKey)));
  const tolvajSzuletes = await szuletesKeszitese(a.kulcspar, await csereLenyomata(masCsereNyilvanos), a.szuletes.fizetes);
  const tolvajNeve = await azonossagNeve(tolvajSzuletes);
  // ⛔ Az átírt születés (a csere-kulcs lenyomata) a régi névvel; az idegen kulccsal aláírt (a kulcs mezője a mienk).
  const atirt = await szuletesEllenorzese({ ...a.szuletes, csere: tolvajSzuletes.csere }, a.nev);
  const idegen = await ujAzonossag();
  const idegenAlairta = await szuletesEllenorzese({ ...idegen.szuletes, kulcs: a.szuletes.kulcs });
  // A készülék tanúsítványa a nevet és a születést hozza; a név a születésből ellenőrizhető.
  a.kulcspar.szuletes = a.szuletes;
  const k = await tesztKeszulek('laptop', a.kulcspar);
  return jo.rendben && a.szuletes.csere === await csereLenyomata(csereKulcs) && tolvajNeve !== a.nev
    && !atirt.rendben && /név nem ennek/.test(atirt.ok) && !idegenAlairta.rendben && /első kulcs/.test(idegenAlairta.ok)
    && k.azonossag === a.nev && k.tanusitvany.szuletes.alairas === a.szuletes.alairas
    && (await tanusitvanyEllenorzese(k.tanusitvany)).rendben;
});

proba('⭐⭐ A KULCSCSERE LÁNCA (②b) — a csere-kulcs írja alá, a kezelő kulcs a lánc végén; a tolvaj a régi kulccsal nem cserélhet, a régi kulccsal írt „új” tanúsítvány és a lánc nélküli új tanúsítvány elbukik — a kapu és a kézfogás útján is', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const ujKulcs = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const FZ = await pub(await ujKulcs());   // ⭐ (②d) a fizetési kulcs a csere után
  const a = await ujAzonossag();
  a.kulcspar.szuletes = a.szuletes;
  const laptop = await tesztKeszulek('laptop', a.kulcspar);
  // Az 1. csere: a csere-kulcs (a mentésből) írja alá — új kezelő kulcs, új lekötés, a laptop marad.
  const [K1, C1] = [await ujKulcs(), await ujKulcs()];
  const c1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(K1), await csereLenyomata(await pub(C1)), [laptop.keszulek], FZ);
  const lanc1 = await kezeloKulcsLanc(a.szuletes, [c1], a.nev);
  K1.szuletes = a.szuletes;
  K1.cserek = [c1];
  const telefon = await tesztKeszulek('telefon', K1);
  // A 2. csere: a C1 írja alá (az 1. csere lekötése).
  const [K2, C2] = [await ujKulcs(), await ujKulcs()];
  const c2 = await kulcscsereKeszitese(C1, a.nev, 2, await pub(K2), await csereLenyomata(await pub(C2)), [telefon.keszulek], FZ);
  const lanc2 = await kezeloKulcsLanc(a.szuletes, [c1, c2], a.nev);
  // ⛔ A tolvaj a RÉGI kezelő kulccsal (csere-kulcs nélkül) „cserél”: egy saját csere-kulccsal — a lekötés nem az övé.
  const X = await ujKulcs();
  const tolvajCsere = await kulcscsereKeszitese(X, a.nev, 1, await pub(await ujKulcs()), await csereLenyomata(await pub(await ujKulcs())), [], FZ);
  const tolvaj = await kezeloKulcsLanc(a.szuletes, [tolvajCsere], a.nev);
  // ⛔ A régi csere-kulccsal a 2. csere (a lekötés már a C1) · ⛔ az átírt csere (a megmaradók) · ⛔ a hiányzó láncszem (a 2. elsőként).
  const regiCserevel = await kezeloKulcsLanc(a.szuletes, [c1, await kulcscsereKeszitese(a.csere, a.nev, 2, await pub(K2),
    await csereLenyomata(await pub(C2)), [], FZ)], a.nev);
  const atirt = await kezeloKulcsLanc(a.szuletes, [{ ...c1, keszulekek: [] }], a.nev);
  const hezag = await kezeloKulcsLanc(a.szuletes, [c2], a.nev);
  // ⛔ A tanúsítványok: a régi kulccsal írt, de a láncot hozó; a lánc nélküli új.
  const regiKulccsal = await alairtTanusitvany(a.kulcspar, { ...telefon.tanusitvany });
  const lancNelkul = await alairtTanusitvany(K1, { ...telefon.tanusitvany, cserek: undefined });
  delete lancNelkul.cserek;
  // A kézfogás (szinkron) ugyanígy.
  const atirat = Buffer.from('egy kézfogás átirata');
  const jwk = await crypto.subtle.exportKey('jwk', telefon.privateKey);
  const ki = (t) => ({ sz: a.nev, k: telefon.keszulek, t, a: szemelyesKezfogasAlairasa(jwk, KOINO, atirat) });
  // ⛔ A tolvaj SAJÁT „lánca” (a saját csere-kulcsával) és az azzal kezelt kulcsa írja alá a tanúsítványt — a lekötés nem az övé.
  const tolvajKulcs = await ujKulcs();
  const tolvajLanc = await kulcscsereKeszitese(X, a.nev, 1, await pub(tolvajKulcs), await csereLenyomata(await pub(await ujKulcs())), [], FZ);
  const tolvajLancos = await alairtTanusitvany(tolvajKulcs, { ...telefon.tanusitvany, cserek: [tolvajLanc] });
  // ⛔ A rossz sorszám (a C1 írja alá — a lekötés jó —, de 1-es sorszámmal a 2. helyen).
  const rosszSorszam = await kezeloKulcsLanc(a.szuletes, [c1, await kulcscsereKeszitese(C1, a.nev, 1, await pub(K2),
    await csereLenyomata(await pub(C2)), [], FZ)], a.nev);
  // ⛔ Az átírt csere a tanúsítvány láncában (a megmaradók — az aláírás nem illik rá), a jó kulccsal aláírt tanúsítványban.
  const atirtLancos = await alairtTanusitvany(K1, { ...telefon.tanusitvany, cserek: [{ ...c1, keszulekek: [] }] });
  return !rosszSorszam.rendben && !(await tanusitvanyEllenorzese(tolvajLancos)).rendben
    && !keszulekKezfogasEllenorzese(ki(tolvajLancos), KOINO, atirat)
    && !(await tanusitvanyEllenorzese(atirtLancos)).rendben && !keszulekKezfogasEllenorzese(ki(atirtLancos), KOINO, atirat)
    && lanc1.rendben && lanc1.kulcsok.join() === [a.szuletes.kulcs, await pub(K1)].join() && lanc1.marado[1].join() === laptop.keszulek
    && lanc2.rendben && lanc2.kulcsok.at(-1) === await pub(K2)
    && telefon.tanusitvany.cserek?.length === 1 && (await tanusitvanyEllenorzese(telefon.tanusitvany)).rendben
    && (await tanusitvanyEllenorzese(laptop.tanusitvany)).rendben
    && !tolvaj.rendben && /nem a lekötött/.test(tolvaj.ok) && !regiCserevel.rendben && /nem a lekötött/.test(regiCserevel.ok)
    && !atirt.rendben && /nem a csere-kulcs írta alá/.test(atirt.ok) && !hezag.rendben
    && !(await tanusitvanyEllenorzese(regiKulccsal)).rendben && !(await tanusitvanyEllenorzese(lancNelkul)).rendben
    && keszulekKezfogasEllenorzese(ki(telefon.tanusitvany), KOINO, atirat)
    && !keszulekKezfogasEllenorzese(ki(regiKulccsal), KOINO, atirat) && !keszulekKezfogasEllenorzese(ki(lancNelkul), KOINO, atirat);
});

proba('⭐⭐ A KULCSCSERE UTÁN (②b — KC2 (A)) — a nem felsorolt, régi kulccsal felvett készülék eseményei nem számítanak (bárki bevitte a cserét); a felsorolt és az új kulccsal felvett igen; a kapu a kiesett készülék új eseményét nem engedi be, a hamis cserét elveti', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const ujKulcs = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const FZ = await pub(await ujKulcs());   // ⭐ (②d) a fizetési kulcs a csere után
  const a = await ujAzonossag();
  a.kulcspar.szuletes = a.szuletes;
  const laptopK = await tesztKeszulek('laptop', a.kulcspar);
  const telefonK = await tesztKeszulek('telefon', a.kulcspar);
  const laptop = await ujEember(KOINO, laptopK);
  const telefon = await ujEember(KOINO, telefonK);
  const idegen = await ujEember(KOINO);
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'A laptopé' });
  const tg = await telefon.tesz('GondolatLetrehozas', { cim: 'A telefoné (ellopták)' });
  // A csere: a laptop marad, a telefon (ellopták) nem; utána egy tablet az új kulccsal.
  const [K1, C1] = [await ujKulcs(), await ujKulcs()];
  const c1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(K1), await csereLenyomata(await pub(C1)), [laptopK.keszulek], FZ);
  K1.szuletes = a.szuletes;
  K1.cserek = [c1];
  const tablet = await ujEember(KOINO, await tesztKeszulek('tablet', K1));
  const tt = await tablet.tesz('GondolatLetrehozas', { cim: 'A tableté (az új kulccsal)' });
  const csere = await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [c1] });   // bárki beviheti
  const lista = await tagokkal([g, tg, tt]);
  const nelkule = allapotSzamitasa(lista);
  const vele = allapotSzamitasa([...lista, csere]);
  const kiesett = new Set(vele.kizartak.map((k) => k.azonosito));
  // A 2. csere (a C1-gyel): csak a tablet marad — a két csere-esemény közül a LEGUTÓBBI (a hosszabb lánc) számít: a laptop kiesik.
  const [K2, C2] = [await ujKulcs(), await ujKulcs()];
  const c2 = await kulcscsereKeszitese(C1, a.nev, 2, await pub(K2), await csereLenyomata(await pub(C2)), [tablet.keszulek], FZ);
  const csere2 = await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [c1, c2] });
  const kiesett2 = new Set(allapotSzamitasa([...lista, csere2, csere]).kizartak.map((k) => k.azonosito));
  // A kapu: a csere után a telefon új eseménye nem jön be, a laptopé igen; a hamis csere (a tolvaj saját csere-kulcsával) elbukik.
  const tar = await ujTar();
  for (let i = 0; i < 2; i++) for (const e of [...lista, csere]) await esemenyMentese(tar, e);
  const telefonUj = await esemenyMentese(tar, await telefon.tesz('GondolatLetrehozas', { cim: 'A tolvaj újabb' }));
  const laptopUj = await esemenyMentese(tar, await laptop.tesz('GondolatLetrehozas', { cim: 'A laptop újabb' }));
  const X = await ujKulcs();
  const hamisC = await kulcscsereKeszitese(X, a.nev, 1, await pub(await ujKulcs()), await csereLenyomata(await pub(await ujKulcs())),
    [telefonK.keszulek], FZ);
  const hamis = await esemenyMentese(tar, await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [hamisC] }));
  return nelkule.kizartak.length === 0 && kiesett.has(tg.azonosito) && !kiesett.has(g.azonosito) && !kiesett.has(tt.azonosito)
    && !telefonUj.mentve && /nem sorolta fel/.test(telefonUj.ok ?? '') && laptopUj.mentve
    && !hamis.mentve && /kulcscsere nem hiteles/.test(hamis.ok ?? '')
    && !!alakiHiba({ ...csere, adat: { ...csere.adat, x: 1 } })
    && kiesett2.has(g.azonosito) && kiesett2.has(tg.azonosito) && !kiesett2.has(tt.azonosito);
});

// ⭐⭐ D128 (②d — 17. pont, 9.13): A PAPÍR VISSZAVONÁSA ÉS AZ ERŐSEBB ÁG. A visszavonás (a papír utolsó aláírása, a lekötés `null`)
// a kezelő kulcsot nem cseréli — senki nem esik ki; utána papír nem írhat alá (a kapu is elveti). Ha a papírt ellopták, és a tolvaj
// ugyanarra a helyre kulcscserét írt (és a saját ágát meg is hosszabbította): a visszavonás az ERŐSEBB — nem a hosszabb ág nyer —, és a
// tolvaj ágán tanúsított készülék kiesik. ⛔ És a ②b rése: két egyforma hosszú papír-ág közül a VESZTESEN tanúsított készülék is
// kiesik (a ②b-ben a korszak-száma nem volt kisebb, és megmaradt).
proba('⭐⭐ A PAPÍR VISSZAVONÁSA ÉS AZ ERŐSEBB ÁG (②d — 17. pont) — a visszavonás után papír nem ír alá, és a saját készülékeid közül senki nem esik ki; a tolvaj hosszabb papír-ága a visszavonás ellen veszít, a rajta tanúsított készülék kiesik; két egyforma ágból a vesztesen tanúsított is', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const ujKulcs = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const FZ = await pub(await ujKulcs());
  const a = await ujAzonossag();
  a.kulcspar.szuletes = a.szuletes;
  const laptop = await ujEember(KOINO, await tesztKeszulek('laptop', a.kulcspar));
  const telefon = await ujEember(KOINO, await tesztKeszulek('telefon', a.kulcspar));
  const idegen = await ujEember(KOINO);
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'A laptopé' });
  const tg = await telefon.tesz('GondolatLetrehozas', { cim: 'A telefoné' });
  // A VISSZAVONÁS: ugyanaz a kezelő kulcs, a lekötés null.
  const v = await kulcscsereKeszitese(a.csere, a.nev, 1, a.szuletes.kulcs, null, [], a.szuletes.fizetes);
  const vLanc = await kezeloKulcsLanc(a.szuletes, [v], a.nev);
  const utana = await kezeloKulcsLanc(a.szuletes, [v, await kulcscsereKeszitese(a.csere, a.nev, 2, await pub(await ujKulcs()),
    await csereLenyomata(await pub(await ujKulcs())), [], FZ)], a.nev);
  // A TOLVAJ a papírral (másolat): ugyanarra a helyre kulcscserét ír, és a saját ágát meghosszabbítja; az új kulcsával felvesz egy
  // készüléket.
  const [KT1, CT1, KT2, CT2] = [await ujKulcs(), await ujKulcs(), await ujKulcs(), await ujKulcs()];
  const t1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(KT1), await csereLenyomata(await pub(CT1)), [], FZ);
  const t2 = await kulcscsereKeszitese(CT1, a.nev, 2, await pub(KT2), await csereLenyomata(await pub(CT2)), [], FZ);
  KT2.szuletes = a.szuletes;
  KT2.cserek = [t1, t2];
  const tolvajK = await ujEember(KOINO, await tesztKeszulek('tolvaj', KT2));
  const xg = await tolvajK.tesz('GondolatLetrehozas', { cim: 'A tolvajé' });
  const lista = await tagokkal([g, tg, xg]);
  const vEsemeny = await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [v] });
  const tEsemeny = await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [t1, t2] });
  const csakVissza = new Set(allapotSzamitasa([...lista, vEsemeny]).kizartak.map((k) => k.azonosito));
  const mindketto = new Set(allapotSzamitasa([...lista, tEsemeny, vEsemeny]).kizartak.map((k) => k.azonosito));
  const csakTolvaj = new Set(allapotSzamitasa([...lista, tEsemeny]).kizartak.map((k) => k.azonosito));
  // KÉT EGYFORMA PAPÍR-ÁG (a ②b rése): mindkettő az 1. helyen cserél, mindkettőn felvesznek egy készüléket.
  const [P1, Q1, P2, Q2] = [await ujKulcs(), await ujKulcs(), await ujKulcs(), await ujKulcs()];
  const p1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(P1), await csereLenyomata(await pub(Q1)), [laptop.keszulek], FZ);
  const p2 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(P2), await csereLenyomata(await pub(Q2)), [laptop.keszulek], FZ);
  P1.szuletes = a.szuletes;
  P1.cserek = [p1];
  P2.szuletes = a.szuletes;
  P2.cserek = [p2];
  const egyik = await ujEember(KOINO, await tesztKeszulek('tablet', P1));
  const masik = await ujEember(KOINO, await tesztKeszulek('tablet2', P2));
  const eg = await egyik.tesz('GondolatLetrehozas', { cim: 'Az egyik ágon' });
  const mg = await masik.tesz('GondolatLetrehozas', { cim: 'A másik ágon' });
  const lista2 = await tagokkal([g, eg, mg]);
  const ketAg = new Set(allapotSzamitasa([...lista2, await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [p1] }),
    await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [p2] })]).kizartak.map((k) => k.azonosito));
  // A kapu: a visszavonás után a papírral írt csere nem jön be.
  const tar = await ujTar();
  for (let i = 0; i < 2; i++) for (const e of [...lista, vEsemeny]) await esemenyMentese(tar, e);
  const kapun = await esemenyMentese(tar, await idegen.tesz('Kulcscsere', { szuletes: a.szuletes,
    cserek: [v, await kulcscsereKeszitese(a.csere, a.nev, 2, await pub(await ujKulcs()), await csereLenyomata(await pub(await ujKulcs())),
      [], FZ)] }));
  // ⭐ Az erő nem véletlen: 16 különböző tolvaj-kulcscsere ellen a visszavonás MINDIG erősebb (az aláírás szerinti döntés 1/2^16
  // eséllyel adná ugyanezt).
  let mindigVisszavonas = true;
  for (let i = 0; i < 16; i++) {
    const t = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(await ujKulcs()), await csereLenyomata(await pub(await ujKulcs())), [], FZ);
    if (!lancErosebbE([v], [t]) || lancErosebbE([t], [v])) mindigVisszavonas = false;
  }
  const r = {
    vLanc: vLanc.rendben && vLanc.lekotes === null && vLanc.kulcsok[1] === a.szuletes.kulcs && vLanc.fizetesek[1] === a.szuletes.fizetes,
    utana: !utana.rendben && /visszavonták/.test(utana.ok ?? ''),
    senkiNemEsikKi: !csakVissza.has(g.azonosito) && !csakVissza.has(tg.azonosito) && csakVissza.has(xg.azonosito),
    visszavonasNyer: mindketto.has(xg.azonosito) && !mindketto.has(g.azonosito) && !mindketto.has(tg.azonosito),
    tolvajEgyedul: csakTolvaj.has(g.azonosito) && csakTolvaj.has(tg.azonosito) && !csakTolvaj.has(xg.azonosito),
    ketAg: ketAg.has(eg.azonosito) !== ketAg.has(mg.azonosito) && !ketAg.has(g.azonosito),
    erosebb: mindigVisszavonas && lancErosebbE([v], [t1, t2]) && !lancErosebbE([t1, t2], [v]) && lancErosebbE([t1, t2], [t1])
      && lancErosebbE([p1], [p2]) !== lancErosebbE([p2], [p1]),
    kapu: !kapun.mentve && /visszavonták/.test(kapun.ok ?? '')
  };
  if (Object.values(r).some((x) => !x)) process.stderr.write('    (' + JSON.stringify(r) + ')\n');
  return Object.values(r).every(Boolean);
});

// ===================================
// 5. A KÉSZÜLÉK A GÉPEN
// ===================================

// ⭐⭐ D128 (③f — KH3 (A), Csaba, 2026-11-16): A RÉGI KÉSZÜLÉK MÚLTJA A KULCSCSERE UTÁN. A kulcscsere a telefont nem sorolja fel: kizárás
// nélkül minden eseménye kiesik (a lopás előtti is). Ha az ÚJ kulccsal kizárják (a vágás a lopás előtti eseménynél), a vágásig megmarad.
// Egy RÉGI kulccsal aláírt kizárás (a tolvajé, akinél a régi kulcs volt) a megmaradónak felsorolt laptopot nem zárja ki — a csere előtt
// kizárta volna —, és a telefon múltját sem tartja meg.
proba('⭐⭐ A RÉGI KÉSZÜLÉK MÚLTJA A KULCSCSERE UTÁN (③f — KH3 (A)) — kizárás nélkül a telefon minden eseménye kiesik; az ÚJ kulccsal aláírt kizárás a vágásig megtartja; a RÉGI kulccsal aláírt a felsorolt laptopot nem zárja ki (a csere előtt kizárta volna), és a telefon múltját sem tartja meg', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const ujKulcs = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const FZ = await pub(await ujKulcs());
  const a = await ujAzonossag();
  a.kulcspar.szuletes = a.szuletes;
  const laptopK = await tesztKeszulek('laptop', a.kulcspar);
  const telefonK = await tesztKeszulek('telefon', a.kulcspar);
  const laptop = await ujEember(KOINO, laptopK);
  const telefon = await ujEember(KOINO, telefonK);
  const idegen = await ujEember(KOINO);
  const g = await laptop.tesz('GondolatLetrehozas', { cim: 'A laptopé' });
  const t1 = await telefon.tesz('GondolatLetrehozas', { cim: 'A telefoné — a lopás előtt' });
  const t2 = await telefon.tesz('GondolatLetrehozas', { cim: 'A tolvajé' });
  const [K1, C1] = [await ujKulcs(), await ujKulcs()];
  const c1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(K1), await csereLenyomata(await pub(C1)), [laptopK.keszulek], FZ);
  K1.szuletes = a.szuletes;
  K1.cserek = [c1];
  const csere = await idegen.tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [c1] });
  const vagas = [{ koino: KOINO, vagas: t1.sorszam, orokos: laptopK.keszulek }];
  const kiz = (k) => idegen.tesz('Kizaras', { kizaras: k });
  const ujKizaras = await kiz(await kizarasKeszitese(K1, telefonK.keszulek, vagas));
  const regiKizaras = await kiz(await kizarasKeszitese(a.kulcspar, telefonK.keszulek, vagas));
  const tolvajKizarasa = await kizarasKeszitese(a.kulcspar, laptopK.keszulek, []);
  const tolvaje = await kiz(tolvajKizarasa);
  const lista = await tagokkal([g, t1, t2]);
  const kiesett = (extra) => new Set(allapotSzamitasa([...lista, ...extra]).kizartak.map((e) => e.azonosito));
  const csakCsere = kiesett([csere]);
  const ujjal = kiesett([csere, ujKizaras]);
  const regivel = kiesett([csere, regiKizaras]);
  const tolvajjal = kiesett([csere, tolvaje]);
  const csereNelkulTolvaj = kiesett([tolvaje]);
  // A kapu: az új kulccsal kizárt telefon egy a vágás UTÁNI új eseménye bejön (nem a kulcscsere ejti ki), de nem számít; a laptopé is.
  const tar = await ujTar();
  for (let i = 0; i < 2; i++) for (const e of [...lista, csere, ujKizaras]) await esemenyMentese(tar, e);
  const t3 = await telefon.tesz('GondolatLetrehozas', { cim: 'A tolvaj újabbja' });
  const mT3 = await esemenyMentese(tar, t3);
  const tarban = new Set(allapotSzamitasa(await koinoEsemenyei(tar, KOINO)).kizartak.map((e) => e.azonosito));
  // A tárból olvasott kizárások (a kapu, a lánc-gyökér, a műveletek ebből dolgoznak): a tolvaj régi kulcsú kizárása a csere után nincs köztük.
  const tar2 = await ujTar();
  // (két friss készülék hozza be — mindkettőnek az első eseménye, a láncuk így hézagtalan)
  for (let i = 0; i < 2; i++) for (const e of lista) await esemenyMentese(tar2, e);
  await esemenyMentese(tar2, await (await ujEember(KOINO)).tesz('Kizaras', { kizaras: tolvajKizarasa }));
  const csereElott = (await tarKizarasai(tar2, a.nev)).has(laptopK.keszulek);
  await esemenyMentese(tar2, await (await ujEember(KOINO)).tesz('Kulcscsere', { szuletes: a.szuletes, cserek: [c1] }));
  const csereUtan = (await tarKizarasai(tar2, a.nev)).has(laptopK.keszulek);
  const ok = {
    tarbol: csereElott && !csereUtan,
    csakCsere: csakCsere.has(t1.azonosito) && csakCsere.has(t2.azonosito) && !csakCsere.has(g.azonosito),
    ujjal: !ujjal.has(t1.azonosito) && ujjal.has(t2.azonosito) && !ujjal.has(g.azonosito),
    regivel: regivel.has(t1.azonosito) && regivel.has(t2.azonosito),
    tolvajjal: !tolvajjal.has(g.azonosito), csereNelkulTolvaj: csereNelkulTolvaj.has(g.azonosito),
    kapu: mT3.mentve && tarban.has(t3.azonosito) && !tarban.has(t1.azonosito)
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify({ ok, t3: mT3.ok }) + ')\n');
  return Object.values(ok).every(Boolean);
});

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
