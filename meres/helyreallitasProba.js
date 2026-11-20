// meres/helyreallitasProba.js

// ⭐⭐ D128 (②e1 — 17. pont, 9.13): A HELYREÁLLÍTÁS A SEGÍTŐKKEL — a jóváhagyások, a megállítás és a szerepek szabálya.
//
// ⭐ Amit ez a lap bizonyít (egy koinoban, a tárból — `allapot/helyreallitas.js`):
//   1. az ISMERŐS út: a meghívó (régi ismerős) és két élő tanúsító kezd → elindul (7 nap); ha mindhárom véglegesít → teljes;
//   2. a három ember KÜLÖNBÖZŐ: a meghívó, aki maga is tanúsító, nem tölt be két helyet; ismerős nélkül (három idegen tanúsítóval)
//      nem indul; a saját jóváhagyás nem számít;
//   3. a VISSZAVONÁS a kezdést törli; a véglegesítés utáni visszavonás nem számít;
//   4. a MEGÁLLÍTÁS (az azonosság egy készülékéről) az 1. kört érvényteleníti — a véglegesítés után is; másé nem; a 2. kör csak a
//      megállított 1. kör után, négy élő tanúsítóval, kétszeres várakozással indul, és nem állítható meg;
//   5. a BEMUTATKOZÓ út: tíz KÖLCSÖNÖS bemutatkozó + két élő tanúsító (30 nap); az egyoldalú nem számít, kilenc nem elég;
//   6. a szabály tiszta függvénye (`elegendoUt`) a helyek kiosztásával; az alak a kapun.

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { probaGyujtemeny, ujEember, tesztKeszulek } from './probaFuttato.js';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese } from '../js/tar/esemenyTar.js';
import { helyreallitasokAllapota, elegendoUt, segitoAllasa, JOVAHAGYAS, MEGALLITAS, helyreallitasBizonyiteka,
  helyreallitasBizonyitekEllenorzese } from '../js/allapot/helyreallitas.js';
import { helyreallitasJele, helyreallitasJavaslatAlakiHibaja, helyreallitasBejegyzese, kezeloKulcsLanc, kulcscsereKeszitese,
  csereLenyomata, ujAzonossag, lancErosebbE, bejegyzesJele, helyreallitasFelvetele } from '../js/kulcs/azonossag.js';
import { tanusitvanyEllenorzese } from '../js/kulcs/keszulek.js';
import { allapotSzamitasa } from '../js/allapot/allapotSzamitas.js';
import { koinoEsemenyei } from '../js/tar/esemenyTar.js';
import { keszulekKezfogasEllenorzese, szemelyesKezfogasAlairasa } from '../js/csere/titkositas.js';
import { bajtokBase64Url } from '../js/esemeny/kanonikusAlak.js';
import { alakiHiba } from '../js/esemeny/esemeny.js';
import { helyreallitasJovahagyasa, helyreallitasMegallitasa, helyreallitasokGondozasa } from '../js/muveletek.js';
import { tarKulcscserei } from '../js/allapot/kizaras.js';
import { ujKerelem, kerelemSzovege, kerelemSzovegbol, kerelemEllenorzoKodja } from '../js/kulcs/helyreallitasKerelem.js';
import { javaslatKerelembol } from '../js/allapot/helyreallitas.js';
import { helyreallitasBefejezese, kulcsparBetoltese, kulcsparBiztositasa } from '../js/kulcs/kulcsTar.js';
import { azonossagNeve } from '../js/kulcs/azonossag.js';
import { kezelesGondozasa } from '../js/muveletek.js';   // ⭐⭐ D128 (③b)
import { tarKezelese, jegyzekbe, ujKezelesJegyzek } from '../js/allapot/kezelesTerjesztes.js';

const { proba, futtatas } = probaGyujtemeny('A helyreállítás a segítőkkel — a szerepek és a szabály (D128 ②e1)');

const KOINO = 'proba';

async function ujTar() {
  return esemenyTarNyitasa(KOINO, await mkdtemp(join(tmpdir(), 'koino-helyreallitas-')));
}

async function ment(tar, ...esemenyek) {
  for (const e of esemenyek) {
    const r = await esemenyMentese(tar, e);
    if (!r.mentve) throw new Error('nem menthető: ' + r.ok);
  }
}

/** Egy alapító kör (mind tag, tanúsíthat, 2. lépcsős) — `db` fővel. */
async function alapitoKor(db) {
  const tagok = [];
  for (let i = 1; i < db; i++) tagok.push(await ujEember(KOINO));
  const letrehozo = await ujEember(KOINO);
  const letrehozas = await letrehozo.tesz('KoinoLetrehozas', { nev: 'Próba', leiras: null, alapitok: tagok.map((t) => t.szerzo) });
  const esemenyek = [letrehozas];
  const kor = [{ eember: letrehozo, horgony: letrehozas.azonosito }];
  for (const t of tagok) {
    const be = await t.tesz('Belepes', { alapitas: letrehozas.azonosito });
    esemenyek.push(be);
    kor.push({ eember: t, horgony: be.azonosito });
  }
  return { kor, esemenyek };
}

/** Egy belépő (a saját szeletét nyitja). */
async function belepo() {
  const eember = await ujEember(KOINO);
  const esemeny = await eember.tesz('Belepes', {});
  return { eember, horgony: esemeny.azonosito, esemeny };
}

/** Egy állítás a másikról — a szeletébe, a saját horgonyommal. */
function allitas(ki, kirol, tipus, adat = {}) {
  return ki.eember.tesz(tipus, { kit: kirol.eember.szerzo, sajatBelepes: ki.horgony, ...adat }, undefined, { entitas: kirol.horgony });
}

/** Egy javaslat (az új kezelő kulcs, az új készülék, az új fizetési kulcs — véletlen kulcsok). */
async function javaslat(beallitas = {}) {
  const kulcs = async () => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw',
    (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])).publicKey)));
  return { kulcs: await kulcs(), keszulekek: [await kulcs()], fizetes: await kulcs(), kovetkezo: null, kor: 1, elozo: null,
    sorszam: 1, utan: null, ido: 0, ...beallitas };
}

/** Egy jóváhagyás. */
function jovahagy(ki, kirol, j, fazis = 'kezdes') {
  return allitas(ki, kirol, JOVAHAGYAS, { javaslat: j, fazis });
}

/** Az alapállás: 5 fős alapító kör, X-et az első hívta meg (ő a régi ismerős). */
async function alap(db = 5) {
  const tar = await ujTar();
  const { kor, esemenyek } = await alapitoKor(db);
  const x = await belepo();
  await ment(tar, ...esemenyek, x.esemeny, await allitas(kor[0], x, 'Meghivas'));
  return { tar, kor, x };
}

/** Egy javaslat állapota. */
async function allapota(tar, x, j) {
  const jel = await helyreallitasJele(j);
  return (await helyreallitasokAllapota(tar, KOINO, x.horgony)).find((a) => a.jel === jel) ?? null;
}

// ===== AZ ISMERŐS ÚT =====

proba('⭐⭐ AZ ISMERŐS ÚT — a meghívó és két élő tanúsító kezd: elindul (7 nap); mindhárom véglegesít: teljes', async () => {
  const { tar, kor, x } = await alap();
  const j = await javaslat();
  await ment(tar, await jovahagy(kor[0], x, j), await jovahagy(kor[1], x, j));
  const ketto = await allapota(tar, x, j);
  await ment(tar, await jovahagy(kor[2], x, j));
  const harom = await allapota(tar, x, j);
  await ment(tar, await jovahagy(kor[0], x, j, 'veglegesites'), await jovahagy(kor[1], x, j, 'veglegesites'));
  const ketVegleges = await allapota(tar, x, j);
  await ment(tar, await jovahagy(kor[2], x, j, 'veglegesites'));
  const kesz = await allapota(tar, x, j);
  return !ketto.elindult && harom.elindult && harom.ut === 'ismeros' && harom.varakozasNap === 7 && !harom.teljes
    && !ketVegleges.teljes && kesz.teljes && kesz.veglegesitok.size === 3;
});

proba('⛔ A HÁROM EMBER KÜLÖNBÖZŐ — a tanúsító meghívó nem tölt be két helyet; ismerős nélkül (három idegen tanúsító) nem indul; a saját jóváhagyás nem számít; két sima tag nem élő tanúsító', async () => {
  const { tar, kor, x } = await alap();
  const j1 = await javaslat();
  await ment(tar, await jovahagy(kor[0], x, j1), await jovahagy(kor[1], x, j1));
  const ketHely = await allapota(tar, x, j1);
  const j2 = await javaslat();
  await ment(tar, await jovahagy(kor[1], x, j2), await jovahagy(kor[2], x, j2), await jovahagy(kor[3], x, j2));
  const idegenek = await allapota(tar, x, j2);
  // A saját jóváhagyás: X maga (a kapu az alakot engedi; a számítás a „magát senki” szabállyal veti el).
  const j3 = await javaslat();
  await ment(tar, await jovahagy(kor[1], x, j3), await jovahagy(kor[2], x, j3));
  const sajat = await x.eember.tesz(JOVAHAGYAS, { kit: x.eember.szerzo, sajatBelepes: x.horgony, javaslat: j3, fazis: 'kezdes' },
    undefined, { entitas: x.horgony });
  await esemenyMentese(tar, sajat);
  const sajattal = await allapota(tar, x, j3);
  // Két SIMA belépő (nem tanúsító) nem pótolja a két élő tanúsítót.
  const [s1, s2] = [await belepo(), await belepo()];
  await ment(tar, s1.esemeny, s2.esemeny);
  const j4 = await javaslat();
  await ment(tar, await jovahagy(kor[0], x, j4), await jovahagy(s1, x, j4), await jovahagy(s2, x, j4));
  const simak = await allapota(tar, x, j4);
  return !ketHely.elindult && idegenek.ut === null && !idegenek.elindult && !sajattal.elindult && !sajattal.kezdok.has(x.eember.szerzo)
    && simak.kezdok.size === 3 && !simak.elindult;
});

// ===== A VISSZAVONÁS =====

proba('⭐ A VISSZAVONÁS a kezdést törli (újra kezdhető); a véglegesítés UTÁNI visszavonás nem számít', async () => {
  const fazisok = (...f) => f.map((fazis, i) => ({ fazis, sorszam: i + 1 }));
  const tiszta = segitoAllasa(fazisok('kezdes', 'visszavonas')).kezdett === false
    && segitoAllasa(fazisok('kezdes', 'visszavonas', 'kezdes')).kezdett === true
    && segitoAllasa(fazisok('kezdes', 'veglegesites', 'visszavonas')).veglegesitett === true
    && segitoAllasa(fazisok('veglegesites')).veglegesitett === false
    && segitoAllasa(fazisok('kezdes', 'visszavonas', 'veglegesites')).veglegesitett === false;
  const { tar, kor, x } = await alap();
  const j = await javaslat();
  await ment(tar, await jovahagy(kor[0], x, j), await jovahagy(kor[1], x, j), await jovahagy(kor[2], x, j),
    await jovahagy(kor[2], x, j, 'visszavonas'));
  const visszavonva = await allapota(tar, x, j);
  await ment(tar, await jovahagy(kor[3], x, j));
  const potolva = await allapota(tar, x, j);
  return tiszta && !visszavonva.elindult && potolva.elindult;
});

// ===== A MEGÁLLÍTÁS ÉS A 2. KÖR =====

proba('⭐⭐ A MEGÁLLÍTÁS az 1. kört érvényteleníti (a véglegesítés után is) — másé nem; a 2. kör csak utána, 4 élő tanúsítóval, kétszeres várakozással, és nem állítható meg', async () => {
  const { tar, kor, x } = await alap(6);
  const j1 = await javaslat();
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, j1));
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, j1, 'veglegesites'));
  const elotte = await allapota(tar, x, j1);
  const jel1 = await helyreallitasJele(j1);
  // Egy MÁSIK ember „megállítása” (X szeletébe tett) nem számít.
  await ment(tar, await kor[4].eember.tesz(MEGALLITAS, { javaslat: jel1 }, undefined, { entitas: x.horgony }));
  const masikUtan = await allapota(tar, x, j1);
  // A 2. kör a megállítás ELŐTT: nem indul (az előzménye nincs megállítva).
  const j2 = await javaslat({ kor: 2, elozo: jel1 });
  for (const k of kor.slice(0, 5)) await ment(tar, await jovahagy(k, x, j2));
  const korai = await allapota(tar, x, j2);
  // X megállítja.
  await ment(tar, await x.eember.tesz(MEGALLITAS, { javaslat: jel1 }, undefined, { entitas: x.horgony }));
  const megallitva = await allapota(tar, x, j1);
  const masodik = await allapota(tar, x, j2);
  // A 2. kört is megállítaná — nem számít; 3 élő tanúsítóval (+ ismerős) nem elég.
  await ment(tar, await x.eember.tesz(MEGALLITAS, { javaslat: await helyreallitasJele(j2) }, undefined, { entitas: x.horgony }));
  for (const k of kor.slice(0, 5)) await ment(tar, await jovahagy(k, x, j2, 'veglegesites'));
  const masodikKesz = await allapota(tar, x, j2);
  const j3 = await javaslat({ kor: 2, elozo: jel1 });
  for (const k of kor.slice(0, 4)) await ment(tar, await jovahagy(k, x, j3));
  const keves = await allapota(tar, x, j3);
  return elotte.teljes && masikUtan.teljes && !korai.elindult && megallitva.megallitva && !megallitva.teljes
    && masodik.elindult && masodik.varakozasNap === 14 && masodikKesz.teljes && !keves.elindult;
});

// ===== A BEMUTATKOZÓ ÚT =====

proba('⭐⭐ A BEMUTATKOZÓ ÚT — tíz KÖLCSÖNÖS bemutatkozó + két élő tanúsító: elindul (30 nap); az egyoldalú nem számít, kilenc nem elég', async () => {
  const tar = await ujTar();
  const { kor, esemenyek } = await alapitoKor(3);
  const x = await belepo();
  await ment(tar, ...esemenyek, x.esemeny);
  const bemutatkozok = [];
  for (let i = 0; i < 10; i++) {
    const b = await belepo();
    await ment(tar, b.esemeny, await allitas(b, x, 'Bemutatkozas'));
    if (i > 0) await ment(tar, await allitas(x, b, 'Bemutatkozas'));   // az elsővel X nem mutatkozott be — egyoldalú
    bemutatkozok.push(b);
  }
  const j = await javaslat();
  for (const k of [kor[1], kor[2], ...bemutatkozok]) await ment(tar, await jovahagy(k, x, j));
  const kilenc = await allapota(tar, x, j);
  await ment(tar, await allitas(x, bemutatkozok[0], 'Bemutatkozas'));   // most már kölcsönös
  const tiz = await allapota(tar, x, j);
  return !kilenc.elindult && tiz.elindult && tiz.ut === 'bemutatkozo' && tiz.varakozasNap === 30;
});

// ===== A TISZTA SZABÁLY ÉS AZ ALAK =====

proba('⭐ A SZABÁLY TISZTA FÜGGVÉNYE — a helyek kiosztása: egy ember egy hely; a tanúsítót előbb a nem-bemutatkozók közül', async () => {
  const sz = (i, b, t) => ({ ismerosok: new Set(i), bemutatkozok: new Set(b), tanusitok: new Set(t) });
  const B10 = Array.from({ length: 10 }, (_, k) => 'b' + k);
  return elegendoUt(['i', 't1', 't2'], sz(['i'], [], ['t1', 't2']), 1) === 'ismeros'
    && elegendoUt(['i', 't1'], sz(['i'], [], ['i', 't1']), 1) === null
    && elegendoUt(['i', 't1', 't2'], sz(['i'], [], ['i', 't1', 't2']), 1) === 'ismeros'
    && elegendoUt(['i', 't1', 't2'], sz(['i'], [], ['t1', 't2']), 2) === null
    && elegendoUt(['i', 't1', 't2', 't3', 't4'], sz(['i'], [], ['t1', 't2', 't3', 't4']), 2) === 'ismeros'
    && elegendoUt([...B10, 't1', 't2'], sz([], B10, ['t1', 't2']), 1) === 'bemutatkozo'
    && elegendoUt([...B10, 't1'], sz([], B10, ['t1', 'b0']), 1) === null
    && elegendoUt([...B10, 't1', 't2', 'b10'], sz([], [...B10, 'b10'], ['t1', 'b10']), 1) === 'bemutatkozo'
    && elegendoUt(['i', 't1', 't2'], sz(['i'], [], ['t1', 't2']), 3) === null;
});

proba('⛔ AZ ALAK — a hibás javaslatú jóváhagyás és a hibás megállítás a kapun elbukik; a javaslat jele a tartalomé', async () => {
  const { tar, kor, x } = await alap(3);
  const j = await javaslat();
  const rosszak = [{ ...j, kor: 3 }, { ...j, elozo: 'A'.repeat(43) }, { ...j, sorszam: 2 }, { ...j, keszulekek: [j.kulcs, j.kulcs] },
    { ...j, x: 1 }, { ...j, kovetkezo: 'rövid' }];
  const elbuknak = [];
  for (const r of rosszak) elbuknak.push(!(await esemenyMentese(tar, await jovahagy(kor[0], x, r))).mentve);
  const rosszFazis = await esemenyMentese(tar, await jovahagy(kor[0], x, j, 'mindegy'));
  const rosszMegallitas = await esemenyMentese(tar, await x.eember.tesz(MEGALLITAS, { javaslat: 'x' }, undefined, { entitas: x.horgony }));
  const jel1 = await helyreallitasJele(j);
  const jel2 = await helyreallitasJele({ ...j });
  const masik = await helyreallitasJele({ ...j, ido: 1 });
  return elbuknak.every(Boolean) && !rosszFazis.mentve && !rosszMegallitas.mentve && jel1 === jel2 && jel1 !== masik
    && helyreallitasJavaslatAlakiHibaja(j) === null && !!alakiHiba(await jovahagy(kor[0], x, { ...j, kor: 0 }));
});

// ===== A MŰVELETEK =====

proba('⭐ A MŰVELETEK — a jóváhagyás a helyreállítandó szeletébe kerül és számít; a megállítás a saját szeletembe; a saját helyreállításomat és a hibás javaslatot nem írja alá', async () => {
  const { tar, kor, x } = await alap();
  const kornyezete = (ki) => ({ koino: KOINO, kulcspar: ki.eember.kulcspar, szerzo: ki.eember.szerzo, tar });
  const j = await javaslat();
  for (const k of kor.slice(0, 3)) {
    await helyreallitasJovahagyasa(kornyezete(k), { kit: x.eember.szerzo, horgonya: x.horgony, sajatBelepes: k.horgony }, j);
  }
  const elindult = await allapota(tar, x, j);
  const m = await helyreallitasMegallitasa(kornyezete(x), await helyreallitasJele(j));
  const megallitva = await allapota(tar, x, j);
  const hibak = [];
  for (const [ki, adatok, jj] of [
    [x, { kit: x.eember.szerzo, horgonya: x.horgony, sajatBelepes: x.horgony }, j],
    [kor[0], { kit: x.eember.szerzo, horgonya: x.horgony, sajatBelepes: kor[0].horgony }, { ...j, kor: 5 }]
  ]) {
    try { await helyreallitasJovahagyasa(kornyezete(ki), adatok, jj); hibak.push(null); } catch (h) { hibak.push(h.message); }
  }
  return elindult.elindult && m.entitas === x.horgony && megallitva.megallitva && /saját helyreállításodat/.test(hibak[0] ?? '')
    && /javaslata hibás/.test(hibak[1] ?? '');
});

// ===== ⭐⭐ ②e2: A BIZONYÍTÉK ÉS A LÁNC =====

/** Egy teljes helyreállítás (a meghívó + két élő tanúsító, mindkét fázis) — a tár, X, a javaslat és a jele. */
async function teljesHelyreallitas(beallitas = {}) {
  const { tar, kor, x } = await alap();
  const j = await javaslat(beallitas);
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, j));
  const reszleges = await helyreallitasBizonyiteka(tar, KOINO, x.horgony, await helyreallitasJele(j)).then(() => 'kész', (h) => h.message);
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, j, 'veglegesites'));
  return { tar, kor, x, j, jel: await helyreallitasJele(j), reszleges };
}

proba('⭐⭐ A BIZONYÍTÉK (②e2) — a teljes helyreállításból összeáll, és egy MEMÓRIABELI tárban ugyanarra jut; a megcsonkított, a hamisított és a más jelű bejegyzéshez adott nem megy át; a félkész nem áll össze', async () => {
  const { x, j, jel, tar, reszleges } = await teljesHelyreallitas();
  const bejegyzes = await helyreallitasBejegyzese(x.eember.szerzo, j);
  const b = await helyreallitasBizonyiteka(tar, KOINO, x.horgony, jel);
  const jo = await helyreallitasBizonyitekEllenorzese(b, bejegyzes);
  // Megcsonkítva: egy véglegesítés hiányzik.
  const egyVeglegesites = b.esemenyek.findIndex((e) => e.tipus === JOVAHAGYAS && e.adat.fazis === 'veglegesites');
  const csonka = await helyreallitasBizonyitekEllenorzese({ ...b, esemenyek: b.esemenyek.filter((_, i) => i !== egyVeglegesites) }, bejegyzes);
  // Hamisítva: a kihagyott véglegesítés HELYÉN egy hamis — a segítő kezdését átírva véglegesítésre (az aláírás nem illik; aláírás-
  // ellenőrzés nélkül a helyreállítás teljesnek látszana).
  const kihagyott = b.esemenyek[egyVeglegesites];
  const kezdese = b.esemenyek.find((e) => e.tipus === JOVAHAGYAS && e.adat.fazis === 'kezdes' && e.szerzo === kihagyott.szerzo);
  const hamisEsemenyek = [...b.esemenyek.filter((_, i) => i !== egyVeglegesites),
    { ...kezdese, azonosito: 'H'.repeat(43), adat: { ...kezdese.adat, fazis: 'veglegesites' }, entitasSorszam: kezdese.entitasSorszam + 100 }];
  const hamis = await helyreallitasBizonyitekEllenorzese({ ...b, esemenyek: hamisEsemenyek }, bejegyzes);
  // Egy MÁSIK koino eseménye a bizonyítékban — kimondottan elutasítva.
  const idegenKoinobol = await (await ujEember('masik')).tesz('Belepes', {});
  const idegenKoino = await helyreallitasBizonyitekEllenorzese({ ...b, esemenyek: [...b.esemenyek, idegenKoinobol] }, bejegyzes);
  // Más bejegyzés (más kulccsal) — a jel nem illik.
  const masik = await helyreallitasBizonyitekEllenorzese(b, await helyreallitasBejegyzese(x.eember.szerzo, { ...j, kulcs: j.fizetes }));
  // Egy másik azonosság nevében.
  const idegen = await helyreallitasBizonyitekEllenorzese(b, { ...bejegyzes, azonossag: j.kulcs });
  const r = { jo: jo.rendben, csonka: !csonka.rendben, hamis: !hamis.rendben, masik: !masik.rendben, idegen: !idegen.rendben,
    idegenKoino: !idegenKoino.rendben && /másik koinoé/.test(idegenKoino.ok ?? ''),
    reszleges: /még nem teljes/.test(reszleges) };
  if (Object.values(r).some((v) => !v)) process.stderr.write('    (' + JSON.stringify({ r, jo, csonka, hamis }) + ')\n');
  return Object.values(r).every(Boolean);
});

proba('⭐⭐ A HELYREÁLLÍTÁS A LÁNCBAN (②e2) — csak ismert bizonyítékkal érvényes; a helye és a jele kötött; a papír visszavonása után is; a kezelő kulcs, a fizetési kulcs és a lekötés az övé; a segítők erősebbek a papírnál; a vele felvett készülék tanúsítványa érvényes', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const ujKulcs = () => crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const a = await ujAzonossag();
  const nev = a.nev;
  // Az 1. helyen.
  const UJ = await ujKulcs();
  const j1 = { ...(await javaslat()), kulcs: await pub(UJ), kovetkezo: await csereLenyomata(await pub(await ujKulcs())) };
  const h1 = await helyreallitasBejegyzese(nev, j1);
  const ismeretlen = await kezeloKulcsLanc(a.szuletes, [h1], nev);
  const ismert = await kezeloKulcsLanc(a.szuletes, [h1], nev, { helyreallitasok: new Set([h1.jel]) });
  const atirt = await kezeloKulcsLanc(a.szuletes, [{ ...h1, kulcs: j1.fizetes }], nev, { helyreallitasok: new Set([h1.jel]) });
  // A papír visszavonása UTÁN (a 2. helyen): a helye az előző bejegyzés jele után.
  const v = await kulcscsereKeszitese(a.csere, nev, 1, a.szuletes.kulcs, null, [], a.szuletes.fizetes);
  const j2 = await javaslat({ sorszam: 2, utan: bejegyzesJele(v) });
  const h2 = await helyreallitasBejegyzese(nev, j2);
  const visszavonasUtan = await kezeloKulcsLanc(a.szuletes, [v, h2], nev, { helyreallitasok: new Set([h2.jel]) });
  const rosszHely = await helyreallitasBejegyzese(nev, await javaslat({ sorszam: 2, utan: 'A'.repeat(43) }));
  const rosszHelyen = await kezeloKulcsLanc(a.szuletes, [v, rosszHely], nev, { helyreallitasok: new Set([rosszHely.jel]) });
  // Az erő: a helyreállítás erősebb a papír cseréjénél és a visszavonásnál; a 2. kör az 1.-nél.
  const papir = await kulcscsereKeszitese(a.csere, nev, 1, await pub(await ujKulcs()), await csereLenyomata(await pub(await ujKulcs())), [],
    a.szuletes.fizetes);
  const h1b = await helyreallitasBejegyzese(nev, await javaslat({ kor: 2, elozo: h1.jel }));
  // ⭐ Az erő nem véletlen: 8 friss párnál MINDIG a helyreállítás nyer a visszavonás ellen, és a 2. kör az 1. ellen (az aláírás vagy a jel
  // szerinti döntés 1/2^8 eséllyel adná ugyanezt).
  let mindigEros = true;
  for (let i = 0; i < 8; i++) {
    const hx = await helyreallitasBejegyzese(nev, await javaslat());
    const hy = await helyreallitasBejegyzese(nev, await javaslat({ kor: 2, elozo: hx.jel }));
    if (!lancErosebbE([hx], [v]) || lancErosebbE([v], [hx]) || !lancErosebbE([hy], [hx]) || lancErosebbE([hx], [hy])) mindigEros = false;
  }
  // A nyilvántartásba vett helyreállítás után a vele felvett készülék tanúsítványa érvényes.
  UJ.szuletes = a.szuletes;
  UJ.cserek = [h1];
  const tablet = await tesztKeszulek('tablet', UJ);
  const elotte = await tanusitvanyEllenorzese(tablet.tanusitvany);
  helyreallitasFelvetele(h1.jel);
  const utana = await tanusitvanyEllenorzese(tablet.tanusitvany);
  const r = {
    ismeretlen: !ismeretlen.rendben && ismeretlen.hianyzik === true,
    ismert: ismert.rendben && ismert.kulcsok[1] === j1.kulcs && ismert.fizetesek[1] === j1.fizetes && ismert.lekotes === j1.kovetkezo,
    atirt: !atirt.rendben && /jele nem a tartalmáé/.test(atirt.ok ?? ''),
    visszavonasUtan: visszavonasUtan.rendben && visszavonasUtan.kulcsok[2] === j2.kulcs,
    rosszHelyen: !rosszHelyen.rendben && /nem az előző bejegyzés után/.test(rosszHelyen.ok ?? ''),
    ero: mindigEros && lancErosebbE([h1], [papir]) && !lancErosebbE([papir], [h1]) && lancErosebbE([v, h2], [v]) && lancErosebbE([h1], [v])
      && lancErosebbE([h1b], [h1]) && !lancErosebbE([h1], [h1b]),
    tanusitvany: !elotte.rendben && utana.rendben
  };
  if (Object.values(r).some((x) => !x)) process.stderr.write('    (' + JSON.stringify({ r, elotte, utana, ismeretlen }) + ')\n');
  return Object.values(r).every(Boolean);
});

proba('⭐⭐ A KAPU ÉS A MÁSIK KOINO (②e2) — a helyreállítás Kulcscsere eseménye a bizonyítékával egy MÁSIK koinoba is bejut; bizonyíték nélkül és csonka bizonyítékkal nem; utána az új kulccsal felvett készülék eseménye bejut, a régi (nem felsorolt) készüléké kiesik', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const UJ = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const { tar, x, j, jel } = await teljesHelyreallitas({ kulcs: await pub(UJ) });
  const nev = x.eember.szerzo;
  const szuletes = x.eember.kulcspar.azonossagKulcspar.szuletes;
  const h = await helyreallitasBejegyzese(nev, j);
  const b = await helyreallitasBizonyiteka(tar, KOINO, x.horgony, jel);
  // A MÁSIK koino (B): X ott is tag (egy másik, régi készülékével), és van ott egy gondolata.
  const B = 'masik';
  const tarB = await esemenyTarNyitasa(B, await mkdtemp(join(tmpdir(), 'koino-helyreallitas-b-')));
  const xB = await ujEember(B, await tesztKeszulek('regi', x.eember.kulcspar.azonossagKulcspar));
  const xBbe = await xB.tesz('Belepes', {});
  const regiGondolat = await xB.tesz('GondolatLetrehozas', { cim: 'A régi készülékről', meret: 1, szulo: null });
  const idegenB = await ujEember(B);
  await ment(tarB, xBbe, regiGondolat, await idegenB.tesz('Belepes', {}));   // a bevivő tanúsítványa a tárban
  const bevisz = (adat) => idegenB.tesz('Kulcscsere', adat, undefined, { entitas: xBbe.azonosito });
  // Bizonyíték nélkül: az alak nem engedi.
  const nelkule = await esemenyMentese(tarB, await bevisz({ szuletes, cserek: [h] }));
  // Csonka bizonyítékkal: a lánc bejegyzése nem ismert.
  const csonkaB = { ...b, esemenyek: b.esemenyek.filter((e) => !(e.tipus === JOVAHAGYAS && e.adat.fazis === 'veglegesites')) };
  const csonkaval = await esemenyMentese(tarB, await bevisz({ szuletes, cserek: [h], bizonyitekok: { [jel]: csonkaB } }));
  // A teljes bizonyítékkal: bejut.
  const jo = await esemenyMentese(tarB, await bevisz({ szuletes, cserek: [h], bizonyitekok: { [jel]: b } }));
  // Az új kulccsal felvett készülék.
  UJ.szuletes = szuletes;
  UJ.cserek = [h];
  const ujB = await ujEember(B, await tesztKeszulek('uj', UJ));
  const ujGondolat = await ujB.tesz('GondolatLetrehozas', { cim: 'Az új készülékről', meret: 1, szulo: null });
  const ujBe = await esemenyMentese(tarB, ujGondolat);
  const kizartak = new Set(allapotSzamitasa(await koinoEsemenyei(tarB, B)).kizartak.map((e) => e.azonosito));
  const r = {
    nelkule: !nelkule.mentve && /bizonyítékai/.test(nelkule.ok ?? ''),
    csonkaval: !csonkaval.mentve && /bizonyítéka még nem ismert/.test(csonkaval.ok ?? ''),
    jo: jo.mentve, ujBe: ujBe.mentve, regiKiesik: kizartak.has(regiGondolat.azonosito), ujMarad: !kizartak.has(ujGondolat.azonosito)
  };
  if (Object.values(r).some((v) => !v)) process.stderr.write('    (' + JSON.stringify({ r, nelkule: nelkule.ok, csonkaval: csonkaval.ok, jo: jo.ok, ujBe: ujBe.ok }) + ')\n');
  return Object.values(r).every(Boolean);
});

proba('⭐ A KÉZFOGÁS (②e2) — a helyreállított azonosság új készüléke csak akkor bizonyít, ha a helyreállítás bizonyítékát a folyamat már látta (a nyilvántartás)', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const a = await ujAzonossag();
  const UJ = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const h = await helyreallitasBejegyzese(a.nev, { ...(await javaslat()), kulcs: await pub(UJ) });
  UJ.szuletes = a.szuletes;
  UJ.cserek = [h];
  const uj = await tesztKeszulek('uj', UJ);
  const atirat = Buffer.from('a kézfogás átirata');
  const ki = { sz: a.nev, k: uj.keszulek, t: uj.tanusitvany,
    a: szemelyesKezfogasAlairasa(await crypto.subtle.exportKey('jwk', uj.privateKey), KOINO, atirat) };
  const elotte = keszulekKezfogasEllenorzese(ki, KOINO, atirat);
  helyreallitasFelvetele(h.jel);
  const utana = keszulekKezfogasEllenorzese(ki, KOINO, atirat);
  const atirtJellel = keszulekKezfogasEllenorzese({ ...ki, t: { ...ki.t, cserek: [{ ...h, kulcs: h.fizetes }] } }, KOINO, atirat);
  return !elotte && utana && !atirtJellel;
});

// ===== ⭐⭐ ②e3: A SEGÍTŐ KÉSZÜLÉKE =====

proba('⭐⭐ A SEGÍTŐ KÉSZÜLÉKE (②e3) — a várakozás előtt nem véglegesít, utána igen (a saját órája szerint); ha teljes, beviszi a Kulcscserét a bizonyítékkal — egyszer; megállítás után nem véglegesít', async () => {
  const NAP = 86400 * 1000;
  const kornyezete = (tar, ki) => ({ koino: KOINO, kulcspar: ki.eember.kulcspar, szerzo: ki.eember.szerzo, tar });
  // 1. A rendes út.
  const { tar, kor, x } = await alap();
  const X = x.eember.szerzo;
  const j = await javaslat();
  const jel = await helyreallitasJele(j);
  for (const k of kor.slice(0, 3)) {
    await helyreallitasJovahagyasa(kornyezete(tar, k), { kit: X, horgonya: x.horgony, sajatBelepes: k.horgony }, j);
  }
  const most = Date.now();
  const gond = (k, nap) => helyreallitasokGondozasa(kornyezete(tar, k), { most: most + nap * NAP });
  const korai = await gond(kor[0], 6);
  const g0 = await gond(kor[0], 8);
  const kozben = await allapota(tar, x, j);
  const g1 = await gond(kor[1], 8);
  const g2 = await gond(kor[2], 8);
  const ujra = await gond(kor[0], 9);
  const masikUjra = await gond(kor[1], 9);
  const cserek = await tarKulcscserei(tar, X);
  // 2. Megállítva: X egy készüléke megállítja — a 7. nap után sem véglegesít senki.
  const m = await alap();
  const jm = await javaslat();
  for (const k of m.kor.slice(0, 3)) {
    await helyreallitasJovahagyasa(kornyezete(m.tar, k), { kit: m.x.eember.szerzo, horgonya: m.x.horgony, sajatBelepes: k.horgony }, jm);
  }
  await helyreallitasMegallitasa(kornyezete(m.tar, m.x), await helyreallitasJele(jm));
  const megallitva = await helyreallitasokGondozasa(kornyezete(m.tar, m.kor[0]), { most: most + 8 * NAP });
  const r = {
    korai: !korai.veglegesitettek.length && !korai.bevittek.length,
    g0: g0.veglegesitettek[0] === jel && !g0.bevittek.length && !kozben.teljes,
    g1: g1.veglegesitettek[0] === jel && !g1.bevittek.length,
    g2: g2.veglegesitettek[0] === jel && g2.bevittek[0] === jel,
    egyszer: !ujra.veglegesitettek.length && !ujra.bevittek.length && !masikUjra.bevittek.length,
    lancban: cserek.get(X)?.korszak === 1 && cserek.get(X)?.alairasok[0] === jel,
    megallitva: !megallitva.veglegesitettek.length
  };
  if (Object.values(r).some((v) => !v)) process.stderr.write('    (' + JSON.stringify({ r, g0, g2 }) + ')\n');
  return Object.values(r).every(Boolean);
});

// ===== ⭐⭐ ②f: A KÉRELEM ÉS A BEFEJEZÉS =====

/** Eldobható tároló a memóriában. */
function memoriaTarolo() {
  let mentett = null;
  return { fajl: '(memória)', irasokSzama: 0, async olvas() { return mentett; }, async ir(l) { mentett = l; this.irasokSzama++; } };
}

proba('⭐⭐ A KÉRELEM ÉS A BEFEJEZÉS (②f) — a kérelem szövege oda-vissza, az ellenőrző kódja a tartalmáé; a javaslat a kérelemből (a második segítő a meglévőt kapja); az új készüléken a befejezés UGYANAZT a nevet adja (és az 1. lépcsőn a papírt); idegen kérelemmel nem; meglévő azonosságot csak felulir-ral', async () => {
  const { tar, kor, x } = await alap();
  const X = x.eember.szerzo;
  const { kerelem, titkok } = await ujKerelem();
  const szoveg = kerelemSzovege(kerelem);
  const oda = JSON.stringify(kerelemSzovegbol(szoveg)) === JSON.stringify(kerelem);
  const kod = await kerelemEllenorzoKodja(kerelem);
  const masikKod = await kerelemEllenorzoKodja({ ...kerelem, fizetes: kerelem.kulcs.slice(0, 42) + 'A' });
  let rosszSzoveg = null;
  try { kerelemSzovegbol(szoveg.replace('koino-helyreallitas.1.', 'koino-helyreallitas.1.x')); } catch (h) { rosszSzoveg = h.message; }
  const elso = await javaslatKerelembol(tar, KOINO, x.horgony, kerelem);
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, elso.javaslat));
  const masodik = await javaslatKerelembol(tar, KOINO, x.horgony, kerelem);
  // A 2. lépcsőn (egy alapító — az alapító kör) a javaslat papírt NEM köt le (Csaba: „ott már ne legyen papír”).
  const alapitoJavaslat = (await javaslatKerelembol(tar, KOINO, kor[4].horgony, kerelem)).javaslat;
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, elso.javaslat, 'veglegesites'));
  const jel = await helyreallitasJele(elso.javaslat);
  const h = await helyreallitasBejegyzese(X, elso.javaslat);
  const b = await helyreallitasBizonyiteka(tar, KOINO, x.horgony, jel);
  const esemeny = await kor[3].eember.tesz('Kulcscsere', { szuletes: x.eember.kulcspar.azonossagKulcspar.szuletes, cserek: [h],
    bizonyitekok: { [jel]: b } }, undefined, { entitas: x.horgony });
  helyreallitasFelvetele(jel);
  // Az új készülék.
  const t = memoriaTarolo();
  const r = await helyreallitasBefejezese(t, titkok, esemeny);
  const betoltve = await kulcsparBetoltese(t);
  // Idegen kérelem titkaival nem; meglévő azonosságot csak felulir-ral.
  let idegen = null;
  try { await helyreallitasBefejezese(memoriaTarolo(), (await ujKerelem()).titkok, esemeny); } catch (hiba) { idegen = hiba.message; }
  const t2 = memoriaTarolo();
  await kulcsparBiztositasa(t2);
  let felulirNelkul = null;
  try { await helyreallitasBefejezese(t2, titkok, esemeny); } catch (hiba) { felulirNelkul = hiba.message; }
  const felulirral = await helyreallitasBefejezese(t2, titkok, esemeny, { felulir: true });
  const ok = {
    oda, kod: /^[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(kod) && kod !== masikKod, rosszSzoveg: /hibás/.test(rosszSzoveg ?? ''),
    javaslat: elso.uj && !masodik.uj && (await helyreallitasJele(masodik.javaslat)) === jel && elso.javaslat.kovetkezo === kerelem.csere
      && elso.javaslat.sorszam === 1 && elso.javaslat.utan === null && alapitoJavaslat.kovetkezo === null,
    befejez: r.nev === X && !!r.papir && betoltve?.szuletes && (await azonossagNeve(betoltve.szuletes)) === X,
    idegen: /nem a te kérelmedé/.test(idegen ?? ''), felulirNelkul: /már van azonosság/.test(felulirNelkul ?? ''),
    felulirral: felulirral.nev === X && !!felulirral.elhagyott
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify(ok) + ')\n');
  return Object.values(ok).every(Boolean);
});

// ===== ⭐⭐ ③b: A HELYREÁLLÍTÁS A BIZONYÍTÉKAIVAL A TÖBBI KOINOBA =====

proba('⭐⭐ (③b) A HELYREÁLLÍTÁS A MÁSIK KOINOBA IS — a kezelés-jegyzék a tárból a bizonyítékkal veszi fel; a visszakapott azonosság új készüléke a B koinoba beviszi (a bizonyítékkal — ott is hiteles); bizonyíték nélkül nem viszi be, és kimondja', async () => {
  const pub = async (k) => bajtokBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey)));
  const UJ = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const { tar, kor, x } = await alap();
  const X = x.eember.szerzo;
  const szuletes = x.eember.kulcspar.azonossagKulcspar.szuletes;
  // A B koinot a régi készülék hozta létre (az azonosság horgonya ott a születés).
  const KB = 'proba-b';
  const xB = await ujEember(KB, x.eember.kulcspar);
  const tarB = await esemenyTarNyitasa(KB, await mkdtemp(join(tmpdir(), 'koino-helyreallitas-b-')));
  await ment(tarB, await xB.tesz('KoinoLetrehozas', { nev: 'B', leiras: null, alapitok: [] }));
  // A teljes helyreállítás az A-ban (a segítők), a bizonyítékkal bevíve.
  const j = await javaslat({ kulcs: await pub(UJ) });
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, j));
  for (const k of kor.slice(0, 3)) await ment(tar, await jovahagy(k, x, j, 'veglegesites'));
  const jel = await helyreallitasJele(j);
  const h = await helyreallitasBejegyzese(X, j);
  await ment(tar, await kor[3].eember.tesz('Kulcscsere', { szuletes, cserek: [h],
    bizonyitekok: { [jel]: await helyreallitasBizonyiteka(tar, KOINO, x.horgony, jel) } }, undefined, { entitas: x.horgony }));
  // Az új készülék (az új kulcs tanúsítja — a lánca a helyreállítás).
  UJ.szuletes = szuletes;
  UJ.cserek = [h];
  const ujK = await tesztKeszulek('uj', UJ);
  const kA = { koino: KOINO, kulcspar: ujK, szerzo: X, tar };
  const kB = { koino: KB, kulcspar: ujK, szerzo: X, tar: tarB };
  const gA = await kezelesGondozasa(kA, null);
  // Bizonyíték nélkül (a jegyzékben csak a lánc): nem viszi be, és kimondja.
  const csupasz = jegyzekbe(ujKezelesJegyzek(X), { lanc: { szuletes, cserek: [h], bizonyitekok: {} } }).jegyzek;
  const gBnelkul = await kezelesGondozasa(kB, csupasz);
  const bElotte = (await tarKezelese(tarB, X)).lanc;
  const gB = await kezelesGondozasa(kB, gA.jegyzek);
  const bUtana = (await tarKezelese(tarB, X)).lanc;
  const ok = {
    gA: !gA.lanc && !!gA.jegyzek.lanc?.bizonyitekok?.[jel],
    gBnelkul: !gBnelkul.lanc && gBnelkul.bizonyitekNelkul && !bElotte,
    gB: !!gB.lanc && !gB.hibak.length && bUtana?.cserek[0].jel === jel && !!bUtana.bizonyitekok[jel]
  };
  if (Object.values(ok).some((v) => !v)) process.stderr.write('    (' + JSON.stringify({ ok, hibak: gB.hibak }) + ')\n');
  return Object.values(ok).every(Boolean);
});

export default async function (csendes) {
  return futtatas(csendes);
}
