// meres/helyreallitasProba.js

// ⭐⭐ D128 (②e1 — 17. pont, 9.13): A HELYREÁLLÍTÁS A SEGÍTŐKKEL — a jóváhagyások, a megállítás és a szerepek szabálya.
//
// ⭐ Amit ez a lap bizonyít (egy koinóban, a tárból — `allapot/helyreallitas.js`):
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

import { probaGyujtemeny, ujEember } from './probaFuttato.js';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese } from '../js/tar/esemenyTar.js';
import { helyreallitasokAllapota, elegendoUt, segitoAllasa, JOVAHAGYAS, MEGALLITAS } from '../js/allapot/helyreallitas.js';
import { helyreallitasJele, helyreallitasJavaslatAlakiHibaja } from '../js/kulcs/azonossag.js';
import { bajtokBase64Url } from '../js/esemeny/kanonikusAlak.js';
import { alakiHiba } from '../js/esemeny/esemeny.js';
import { helyreallitasJovahagyasa, helyreallitasMegallitasa } from '../js/muveletek.js';

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
  const rosszak = [{ ...j, kor: 3 }, { ...j, elozo: 'A'.repeat(43) }, { ...j, sorszam: 2 }, { ...j, keszulekek: [] },
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

export default async function (csendes) {
  return futtatas(csendes);
}
