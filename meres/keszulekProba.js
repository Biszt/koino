// meres/keszulekProba.js

// Felelősség: ⭐⭐ D128 (ET-3 — a kulcs: több készülék és a helyreállítás) — bizonyítani, hogy a KÉSZÜLÉK és a TANÚSÍTVÁNYA azt
// teszi, amiért született (az ①a lépés):
//   · a tanúsítványt az azonosság kulcsa írja alá — más kulccsal, átírva, fölös mezővel nem megy át;
//   · a lánc első eseménye hozza a tanúsítványt, a többi nem — az alak mást nem enged;
//   · a kapu csak tanúsított eseményt enged be: a lánc első eseménye nélkül „hiányzik”; egy idegen azonosság nevében írt esemény
//     (saját vagy semmilyen tanúsítvánnyal) elbukik; egy készüléket csak egy azonosság tanúsíthat;
//   · két készülék egy azonossággal: azonos sorszámuk nem elágazás, mindkét lánc bejut és számít;
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
  // A pontjaik (egy gondolat pont nélkül nem él — D14), mindkét készülék a saját láncán.
  const lp = await laptop.tesz('TudatpontRendezes', { entitas: l1.azonosito, pont: 10 });
  const tp = await telefon.tesz('TudatpontRendezes', { entitas: t1.azonosito, pont: 10 });
  const m1 = await esemenyMentese(tar, l1);
  const m2 = await esemenyMentese(tar, t1);
  for (const e of [lp, tp]) await esemenyMentese(tar, e);
  const allapot = allapotSzamitasa(await tagokkal(await koinoEsemenyei(tar, KOINO)));
  return laptop.szerzo === telefon.szerzo && laptop.keszulek !== telefon.keszulek
    && l1.sorszam === 1 && t1.sorszam === 1 && !elagazasE(l1, t1)
    && m1.mentve && m2.mentve && !m2.elagazas
    && allapot.entitasok.has(l1.azonosito) && allapot.entitasok.has(t1.azonosito) && allapot.ellentmondasok.length === 0;
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
