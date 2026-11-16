// meres/kezelesProba.js

// Felelősség: ⭐⭐ D128 (③b — 9.12): AZ AZONOSSÁG KEZELÉSE MINDEN KOINÓMBA, HELYBEN — bizonyítani, hogy a kezelés-jegyzék
// (`allapot/kezelesTerjesztes.js`) és a gondozása (`muveletek.js` `kezelesGondozasa`) azt teszi, amiért született:
//   1. a JEGYZÉK: az erősebb kulcscsere-lánc felváltja a mostanit, a gyengébb (és ugyanaz) nem; a kizárás egyszer kerül bele, egy
//      MÁSIK azonosságé nem; a sérült, idegen vagy régi fájlból üres jegyzék lesz;
//   2. a TERJESZTÉS: amit az A koinóban lát (a kizárást, a kulcscserét), azt a B koinóba is beviszi — ott a telefon eseménye kiesik;
//      másodszor semmit; ahol az azonosságomnak nincs szelete, oda semmit;
//   3. az ELVETÉS: amit a kapu nem fogadott, azt feljegyzi, és egy napig nem próbálja újra (utána igen);
//   4. ⭐ (③c) a SAJÁT KÉSZÜLÉK A CSERÉBEN: a laptop a határig ad (a koinó keretének 20%-a — KH1), a függő átadás a telefon részéhez
//      számít; a telefon a nekem szóló átadást egyszer veszi át; egy idegen, egy kizárt és egy másik koinóbeli készüléknek semmi.
//
// Futtatás: node meres/mind.js csak kezelesProba

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { probaGyujtemeny, ujEember, tesztKeszulek } from './probaFuttato.js';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese, koinoEsemenyei } from '../js/tar/esemenyTar.js';
import { allapotSzamitasa } from '../js/allapot/allapotSzamitas.js';
import { ujAzonossag, kulcscsereKeszitese, csereLenyomata } from '../js/kulcs/azonossag.js';
import { kizarasKeszitese } from '../js/kulcs/keszulek.js';
import { kezelesGondozasa, kulcscsereBevitele, keszulekKizarasa, sajatKeszulekTalalkozasa, keretAtvetelekGondozasa, sajatKeretem,
  atfolyasHatarAlap } from '../js/muveletek.js';
import { ujKezelesJegyzek, kezelesJegyzekBetoltese, jegyzekbe, tarKezelese, KEZELES_JEGYZEK, ELVETVE_SZUNET }
  from '../js/allapot/kezelesTerjesztes.js';
import { bajtokBase64Url } from '../js/esemeny/kanonikusAlak.js';

const { proba, futtatas } = probaGyujtemeny('A kezelés minden koinómba (D128 ③b)');

const KA = 'kezeles-a';
const KB = 'kezeles-b';
const KC = 'kezeles-c';

const ujKulcs = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));

async function ujTar(koino) {
  return esemenyTarNyitasa(koino, await mkdtemp(join(tmpdir(), 'koino-kezeles-')));
}

async function ment(tar, ...esemenyek) {
  for (const e of esemenyek) {
    const r = await esemenyMentese(tar, e);
    if (!r.mentve) throw new Error('nem menthető: ' + r.ok);
  }
}

/**
 * Az alapállás: egy azonosság (a csere-kulcsával) két készülékkel — a LAPTOP hozza létre az A és a B koinót (az azonosság horgonya
 * így a születés), a TELEFON mindkettőben ír egy gondolatot. A C koinót egy idegen hozza létre (ott az azonosságnak nincs szelete).
 */
async function alap() {
  const a = await ujAzonossag();
  a.kulcspar.szuletes = a.szuletes;
  const laptopK = await tesztKeszulek('laptop', a.kulcspar);
  const telefonK = await tesztKeszulek('telefon', a.kulcspar);
  const tarak = {};
  const telefonja = {};
  for (const K of [KA, KB]) {
    const laptop = await ujEember(K, laptopK);
    const telefon = await ujEember(K, telefonK);
    const letrehozas = await laptop.tesz('KoinoLetrehozas', { nev: 'Próba ' + K, leiras: null, alapitok: [] });
    telefonja[K] = await telefon.tesz('GondolatLetrehozas', { cim: 'A telefoné (' + K + ')' });
    tarak[K] = await ujTar(K);
    await ment(tarak[K], letrehozas, telefonja[K]);
  }
  const idegen = await ujEember(KC);
  tarak[KC] = await ujTar(KC);
  await ment(tarak[KC], await idegen.tesz('KoinoLetrehozas', { nev: 'Idegen', leiras: null, alapitok: [] }));
  const kornyezete = (K) => ({ koino: K, kulcspar: laptopK, szerzo: a.nev, tar: tarak[K] });
  return { a, laptopK, telefonK, tarak, telefonja, kornyezete };
}

/** A koinó állapotából kiesett események azonosítói. */
async function kiesettek(tar, koino) {
  return new Set(allapotSzamitasa(await koinoEsemenyei(tar, koino)).kizartak.map((e) => e.azonosito));
}

// ===================================
// 1. A JEGYZÉK
// ===================================

proba('⭐⭐ A KEZELÉS-JEGYZÉK (③b) — az erősebb lánc felváltja a mostanit, a gyengébb és ugyanaz nem; a kizárás egyszer, egy MÁSIK azonosságé nem; a sérült, idegen vagy régi fájlból üres jegyzék', async () => {
  const a = await ujAzonossag();
  a.kulcspar.szuletes = a.szuletes;
  const FZ = await pub(await ujKulcs());
  const [K1, C1, K2, C2] = [await ujKulcs(), await ujKulcs(), await ujKulcs(), await ujKulcs()];
  const c1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(K1), await csereLenyomata(await pub(C1)), [], FZ);
  const c2 = await kulcscsereKeszitese(C1, a.nev, 2, await pub(K2), await csereLenyomata(await pub(C2)), [], FZ);
  // Egy MÁSIK ág ugyanazon a helyen: a papír visszavonása (`kovetkezo: null`) — erősebb a papír kulcscseréjénél (②d).
  const v1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(a.kulcspar), null, [], FZ);
  const lanc = (cserek) => ({ szuletes: a.szuletes, cserek, bizonyitekok: {} });
  const ures = ujKezelesJegyzek(a.nev);
  const j1 = jegyzekbe(ures, { lanc: lanc([c1]) });
  const j2 = jegyzekbe(j1.jegyzek, { lanc: lanc([c1, c2]) });
  const ugyanaz = jegyzekbe(j2.jegyzek, { lanc: lanc([c1, c2]) });
  const rovidebb = jegyzekbe(j2.jegyzek, { lanc: lanc([c1]) });
  const erosebbAg = jegyzekbe(j2.jegyzek, { lanc: lanc([v1]) });
  // Kizárások: egyszer; egy másik azonosságé nem.
  const k = await kizarasKeszitese(a.kulcspar, await pub(await ujKulcs()), []);
  const b = await ujAzonossag();
  b.kulcspar.szuletes = b.szuletes;
  const masik = await kizarasKeszitese(b.kulcspar, await pub(await ujKulcs()), []);
  const jk = jegyzekbe(ures, { kizarasok: [k, k, masik] });
  const jk2 = jegyzekbe(jk.jegyzek, { kizarasok: [k] });
  // A fájlból: a jó vissza; az idegen azonosságé, a sérült és a más fajta üres.
  const leiras = JSON.parse(JSON.stringify(jk.jegyzek));
  const vissza = kezelesJegyzekBetoltese(leiras, a.nev);
  const idegen = kezelesJegyzekBetoltese(leiras, b.nev);
  const serult = kezelesJegyzekBetoltese({ ...leiras, lanc: { szuletes: a.szuletes, cserek: 'x' }, kizarasok: [{ x: 1 }, k] }, a.nev);
  const masFajta = kezelesJegyzekBetoltese({ ...leiras, mi: 'valami' }, a.nev);
  const ok = {
    j1: j1.valtozott && j1.jegyzek.lanc.cserek.length === 1,
    j2: j2.valtozott && j2.jegyzek.lanc.cserek.length === 2,
    ugyanaz: !ugyanaz.valtozott, rovidebb: !rovidebb.valtozott && rovidebb.jegyzek.lanc.cserek.length === 2,
    erosebbAg: erosebbAg.valtozott && erosebbAg.jegyzek.lanc.cserek[0].kovetkezo === null,
    kizaras: jk.valtozott && jk.jegyzek.kizarasok.length === 1 && !jk2.valtozott,
    vissza: vissza.kizarasok.length === 1 && vissza.mi === KEZELES_JEGYZEK,
    idegen: idegen.kizarasok.length === 0 && idegen.azonossag === b.nev,
    serult: serult.lanc === null && serult.kizarasok.length === 1, masFajta: masFajta.kizarasok.length === 0
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify(ok) + ')\n');
  return Object.values(ok).every(Boolean);
});

// ===================================
// 2. A TERJESZTÉS
// ===================================

proba('⭐⭐ A KEZELÉS MINDEN KOINÓMBA (③b) — a kizárás és a kulcscsere, amit az A koinóban lát, a B-be is bekerül (a jegyzéken át): ott a telefon eseménye kiesik; másodszor semmi; ahol nincs szeletem, oda semmi', async () => {
  const { a, laptopK, telefonK, tarak, telefonja, kornyezete } = await alap();
  // A laptop az A koinóban kizárja a telefont (a vágás: a telefon gondolata — az a lopás előtti).
  await keszulekKizarasa(kornyezete(KA), a.kulcspar, telefonK.keszulek,
    [{ koino: KA, vagas: telefonja[KA].sorszam, orokos: laptopK.keszulek }]);
  const bElotte = await kiesettek(tarak[KB], KB);
  // A gondozás az A-ban: a jegyzékbe veszi (A-ban már bent van — nem visz be semmit).
  const gA = await kezelesGondozasa(kornyezete(KA), null);
  // A B-ben: beviszi a kizárást.
  const gB = await kezelesGondozasa(kornyezete(KB), gA.jegyzek);
  const bUtana = await kiesettek(tarak[KB], KB);
  const aUtana = await kiesettek(tarak[KA], KA);
  // Másodszor semmi; a C-be (nincs szeletem) semmi.
  const gB2 = await kezelesGondozasa(kornyezete(KB), gB.jegyzek);
  const gC = await kezelesGondozasa({ ...kornyezete(KC) }, gB2.jegyzek);
  const cKezelese = await tarKezelese(tarak[KC], a.nev);
  // A kulcscsere: az A-ba a laptop viszi be (csak a laptop marad); a B-be a gondozás.
  const FZ = await pub(await ujKulcs());
  const [K1, C1] = [await ujKulcs(), await ujKulcs()];
  const c1 = await kulcscsereKeszitese(a.csere, a.nev, 1, await pub(K1), await csereLenyomata(await pub(C1)), [laptopK.keszulek], FZ);
  await kulcscsereBevitele(kornyezete(KA), a.szuletes, [c1]);
  const gA3 = await kezelesGondozasa(kornyezete(KA), gB2.jegyzek);
  const gB3 = await kezelesGondozasa(kornyezete(KB), gA3.jegyzek);
  const bLanc = (await tarKezelese(tarak[KB], a.nev)).lanc;
  const gB4 = await kezelesGondozasa(kornyezete(KB), gB3.jegyzek);
  const ok = {
    bElotte: !bElotte.has(telefonja[KB].azonosito),
    gA: !gA.lanc && !gA.kizarasok.length && gA.valtozott && gA.jegyzek.kizarasok.length === 1,
    gB: gB.kizarasok.length === 1 && !gB.hibak.length,
    bUtana: bUtana.has(telefonja[KB].azonosito),          // a B-t a kizárás nem sorolja fel: a telefon minden eseménye kiesik
    aUtana: !aUtana.has(telefonja[KA].azonosito),         // az A-ban a vágásig megmarad
    gB2: !gB2.lanc && !gB2.kizarasok.length && !gB2.valtozott,
    gC: !gC.lanc && !gC.kizarasok.length && !gC.hibak.length && !gC.valtozott && !cKezelese.lanc && !cKezelese.kizarasok.length,
    gA3: gA3.valtozott && gA3.jegyzek.lanc?.cserek.length === 1 && !gA3.lanc,
    gB3: !!gB3.lanc && bLanc?.cserek[0].alairas === c1.alairas && !gB3.hibak.length,
    gB4: !gB4.lanc && !gB4.kizarasok.length
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify(ok) + ')\n');
  return Object.values(ok).every(Boolean);
});

// ===================================
// 3. AZ ELVETÉS
// ===================================

proba('⛔ AMIT A KAPU ELVETETT, EGY NAPIG NEM PRÓBÁLJA ÚJRA (③b) — a jegyzékben egy hamis kizárás: a kapu elveti, a jegyzék feljegyzi; egy óra múlva nem próbálja, egy nap múlva újra', async () => {
  const { a, tarak, kornyezete } = await alap();
  const jo = await kizarasKeszitese(a.kulcspar, await pub(await ujKulcs()), []);
  const hamis = { ...jo, ido: jo.ido + 1 };   // az alak jó, az aláírás nem illik rá
  const j = jegyzekbe(ujKezelesJegyzek(a.nev), { kizarasok: [hamis] }).jegyzek;
  const most = Date.now();
  const g1 = await kezelesGondozasa(kornyezete(KB), j, { most });
  const g2 = await kezelesGondozasa(kornyezete(KB), g1.jegyzek, { most: most + 3600 * 1000 });
  const g3 = await kezelesGondozasa(kornyezete(KB), g1.jegyzek, { most: most + ELVETVE_SZUNET + 1000 });
  // Egy MÁSIK koinóban (A) az elvetés nem számít — ott megpróbálja.
  const gA = await kezelesGondozasa(kornyezete(KA), g1.jegyzek, { most: most + 3600 * 1000 });
  const bent = (await tarKezelese(tarak[KB], a.nev)).kizarasok.length;
  const ok = {
    g1: g1.hibak.length === 1 && /nem hiteles/.test(g1.hibak[0]) && g1.valtozott && !!g1.jegyzek.elvetve[KB]?.[hamis.alairas],
    g2: g2.hibak.length === 0 && g2.kizarasok.length === 0,
    g3: g3.hibak.length === 1, gA: gA.hibak.length === 1, bent: bent === 0
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify(ok) + ')\n');
  return Object.values(ok).every(Boolean);
});

// ===================================
// 4. ⭐ (③c) A SAJÁT KÉSZÜLÉK A CSERÉBEN
// ===================================

proba('⭐⭐ A SAJÁT KÉSZÜLÉK A CSERÉBEN (③c — KH1) — a laptop a határig ad (10 000-ből 2000, nem a különbség felét); másodszor semmit (a függő átadás számít); a telefon egyszer veszi át; egy magasabb határnál a különbség fele a határig; idegennek, kizártnak, másik koinóban semmi', async () => {
  const { a, laptopK, telefonK, tarak, kornyezete } = await alap();
  const kL = kornyezete(KA);
  const kT = { koino: KA, kulcspar: telefonK, szerzo: a.nev, tar: tarak[KA] };
  const s1 = await sajatKeszulekTalalkozasa(kL, telefonK.keszulek);
  const s2 = await sajatKeszulekTalalkozasa(kL, telefonK.keszulek);
  const g1 = await keretAtvetelekGondozasa(kT);
  const g2 = await keretAtvetelekGondozasa(kT);
  const telefonKerete = await sajatKeretem(kT);
  const s3 = await sajatKeszulekTalalkozasa(kL, telefonK.keszulek);
  // Egy magasabb (személyes) határ: a laptop szabadja 8000, a telefoné 2000 → a fele 3000, de a telefon része 3000-ig nőhet → 1000.
  const s4 = await sajatKeszulekTalalkozasa(kL, telefonK.keszulek, { hatar: 3000 });
  // Egy idegen készülék (más azonosság); a másik koinóban (B — a telefon ott is tag, de itt nem vagyok adó: a horgonyt én írtam, ott
  // is a teljes keret az enyém — a próba: a C, ahol nincs szeletem).
  const idegen = await tesztKeszulek('idegen');
  await tarak[KA].tanusitvanyFelvetele(idegen.tanusitvany);   // a tanúsítványa nálam van — de egy MÁSIK azonosságé
  const s5 = await sajatKeszulekTalalkozasa(kL, idegen.keszulek);
  const s6 = await sajatKeszulekTalalkozasa(kornyezete(KC), telefonK.keszulek);
  // A kizárt telefonnak semmit (és tőle semmit nem veszünk át).
  await keszulekKizarasa(kL, a.kulcspar, telefonK.keszulek, [{ koino: KA, vagas: 1, orokos: laptopK.keszulek }]);
  const s7 = await sajatKeszulekTalalkozasa(kL, telefonK.keszulek, { hatar: 9000 });
  const ok = {
    alap: atfolyasHatarAlap(10000) === 2000,
    s1: s1.ervenyes && s1.merteke === 2000 && s1.atadas?.adat?.pont === 2000,
    s2: s2.ervenyes && s2.merteke === 0 && !s2.atadas,
    g1: g1.atvetelek.length === 1 && !g1.kihagyva.length, g2: !g2.atvetelek.length && !g2.kihagyva.length,
    telefonKerete: telefonKerete === 2000,
    s3: s3.merteke === 0, s4: s4.merteke === 1000,
    s5: !s5.ervenyes && s5.merteke === 0, s6: !s6.ervenyes && s6.merteke === 0,
    s7: !s7.ervenyes && s7.merteke === 0
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify({ ok, s1: s1.merteke, s4: s4.merteke }) + ')\n');
  return Object.values(ok).every(Boolean);
});

export default async function (csendes) {
  return futtatas(csendes);
}
