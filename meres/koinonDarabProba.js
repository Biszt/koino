// meres/koinonDarabProba.js

// Felelősség: bizonyítani, hogy a KOINON DARABJAI (D130 ③c — `cimjegyzek.js`, `esemeny.js`, `szeletEgyeztetes.js`, a vonal)
// működnek: a darab kulcsa felismerhető (`n` jel), és nem keveredik a gyökér, a kereső-réteg és a koinon kulcsával; a mélység az
// ismert tagokból jön (`floor(log2(tagok / r))` — KO2 (A), 95. mérés); a koinon eseményei (a döntés tömör alakja, az
// állásfoglalások) a koinon kulcsához bejelentődnek, és a darab halmaza az egyezményük szerint szűr; a valódi cserén
// (UDP-rés, titkosítva) a KÖZÖS darab eseményei átjönnek — a szomszéd mélységű társsal a MÉLYEBB darab (KO6 (A): átfedés
// nélkül, mindkettőnél egészében megvan), a nem közösé nem, és a második csere a nyitásnál véget ér; a saját állásfoglalásom a
// csak küldő úton eljut a darab tartójához; a koinon kulcsa egészében sosem cserélődik; a zárt koinó nem tagja nem kap belőle.
//
// Futtatás: node meres/mind.js koinondarab

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSocket } from 'node:dgram';
import { createHash } from 'node:crypto';

import { probaGyujtemeny, ujEember, probaTanusitvanyok } from './probaFuttato.js';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese } from '../js/tar/esemenyTar.js';
import { csereUdpResen } from '../js/csere/udpVonal.js';
import { ujTablaKulcs, nyilvanosResz } from '../js/csere/tablaKulcs.js';
import { kezfogasAlairasa } from '../js/csere/titkositas.js';
import { egyeztetettEsemenyek, ervenyesKulcs, GYOKER_KULCS, KOINO_SZULETES_KULCS } from '../js/csere/szeletEgyeztetes.js';
import { bejelentesHelyei, szelet, KOINON_KULCS } from '../js/esemeny/esemeny.js';
import {
  koinonDarabKulcsa, koinonDarabBol, koinonDarabKulcsai, koinonLenyomata, koinonMelysege, kozosKoinonDarab,
  egyezmenyKoinonDarabKulcsa, darabbaEsik, gyokerDarabKulcsa, gyokerDarabBol, DARAB_MAX_MELYSEG
} from '../js/csere/cimjegyzek.js';
import { sajatKuldo, kuldoFogado } from '../js/allapot/osszegzoTartas.js';

const { proba, futtatas } = probaGyujtemeny('A koinon darabjai a cserében (D130 ③c)');

const KOINO = 'proba';
const mappak = [];
const ujMappa = async () => { const m = await mkdtemp(join(tmpdir(), 'koino-kndarab-')); mappak.push(m); return m; };

async function udpParos() {
  const egyik = createSocket({ type: 'udp4' });
  const masik = createSocket({ type: 'udp4' });
  await new Promise((t) => egyik.bind(0, '127.0.0.1', t));
  await new Promise((t) => masik.bind(0, '127.0.0.1', t));
  return { egyik, masik, egyikPort: egyik.address().port, masikPort: masik.address().port,
    bezar() { egyik.close(); masik.close(); } };
}

const alairoja = (t) => nyilvanosResz(t).alairo;
/** A készülék saját koinon-darabjának kulcsa az `m` mélységen. */
const darabKulcsa = (t, m) => koinonDarabKulcsai(alairoja(t), m)[0];
/** Az esemény egyezménye a kulcs darabjába esik-e. */
const esik = (e, kulcs) => { const d = koinonDarabBol(kulcs); return darabbaEsik(koinonLenyomata(szelet(e)), d.melyseg, d.darab); };
const egyezmenyAz = (s) => createHash('sha256').update('egyezmeny|' + s).digest('base64url');

/** Két tábla-kulcs, amelyekre a feltétel igaz. */
async function kulcsPar(feltetel) {
  const a = await ujTablaKulcs();
  for (let i = 0; i < 2000; i++) {
    const b = await ujTablaKulcs();
    if (feltetel(a, b)) return [a, b];
  }
  throw new Error('nem találtam megfelelő kulcspárt');
}

/** Egy alapító és `n` állásfoglalása, mind más egyezményen (a próba egyezmény-azonosítói — a kapu a hivatkozást nem nézi). */
async function allasfoglalasok(n, jel = 'a') {
  const f = await ujEember(KOINO);
  const letrehozas = await f.tesz('KoinoLetrehozas', { nev: 'Koinon', leiras: null, alapitok: [], zart: false });
  const a = [];
  for (let i = 0; i < n; i++) {
    const egyezmeny = egyezmenyAz(jel + i);
    a.push(await f.tesz('Allasfoglalas', { egyezmeny, allas: 'csatlakozik', masik: null, indoklas: null }, undefined,
      { entitas: egyezmeny }));
  }
  return { f, letrehozas, a };
}

async function tar(esemenyek) {
  const t = await esemenyTarNyitasa(KOINO, await ujMappa());
  // ⭐⭐ D128: a lánc közepéről vett esemény a tanúsítványával (a próba-készülékek jegyzékéből — ahogy a kísérő hozná).
  for (const e of esemenyek) await esemenyMentese(t, e, { tanusitvanyok: probaTanusitvanyok([e]) });
  return t;
}

/** A csere: a valódi szeletekben senki nem vesz részt (a szigorú (b) helyett) — csak a koinon-darabokban. */
async function csere(tarA, tarB, tA, tB, { mA = null, mB = null, a = {}, b = {}, reszvesz = () => false } = {}) {
  const oldal = (t, m) => ({ tablaKulcs: nyilvanosResz(t), tablaAlairo: (atirat) => kezfogasAlairasa(t, atirat),
    reszvesz, ...(m !== null ? { koinonMelyseg: m } : {}) });
  const p = await udpParos();
  try {
    const [ra, rb] = await Promise.all([
      csereUdpResen(p.egyik, '127.0.0.1', p.masikPort, tarA, KOINO, { ...oldal(tA, mA), ...a }),
      csereUdpResen(p.masik, '127.0.0.1', p.egyikPort, tarB, KOINO, { ...oldal(tB, mB), ...b })
    ]);
    return { a: ra, b: rb };
  } finally { p.bezar(); }
}

/** Hány esemény van meg a tárban a listából. */
async function megvan(t, lista) {
  let n = 0;
  for (const e of lista) if (await t.esemeny(e.azonosito)) n++;
  return n;
}

// ===================================
// 1. A KULCS, A MÉLYSÉG, A BEJELENTÉS ÉS A HALMAZ
// ===================================

proba('⭐ a koinon-darab kulcsa érvényes vonal-kulcs, visszafejthető, és nem keveredik a gyökér-darabbal, a koinó születésével és a koinon kulcsával (az nem darab)', () => {
  const k = koinonDarabKulcsa(5, 29);
  const v = koinonDarabBol(k);
  const ki = {
    alak: k.length === 43 && ervenyesKulcs(k) && v?.melyseg === 5 && v?.darab === 29n,
    nemGyoker: gyokerDarabBol(k) === null && koinonDarabBol(gyokerDarabKulcsa(5, 29)) === null,
    koinonKulcs: ervenyesKulcs(KOINON_KULCS) && koinonDarabBol(KOINON_KULCS) === null && gyokerDarabBol(KOINON_KULCS) === null
      && KOINON_KULCS !== GYOKER_KULCS && KOINON_KULCS !== KOINO_SZULETES_KULCS,
    szuletes: koinonDarabBol(KOINO_SZULETES_KULCS) === null,
    // a készülék kulcsai: a saját darabja és annak két fele (a mélyebb szint) — a legmélyebb szinten csak a saját
    kulcsai: (() => {
      const [s, f0, f1] = koinonDarabKulcsai('a1', 7);
      const d = koinonDarabBol(s).darab;
      return koinonDarabBol(f0)?.melyseg === 8 && koinonDarabBol(f0).darab === 2n * d && koinonDarabBol(f1).darab === 2n * d + 1n
        && koinonDarabKulcsai('a1', DARAB_MAX_MELYSEG).length === 1 && koinonDarabKulcsai('a1', 0).length === 3;
    })()
  };
  if (!Object.values(ki).every(Boolean)) console.log('    (ami bukott: ' + Object.keys(ki).filter((x) => !ki[x]).join(', ') + ')');
  return Object.values(ki).every(Boolean);
});

proba('⭐⭐ KO2 (A), 95. mérés: a mélység az ismert tagokból — `floor(log2(tagok / r))`, 2r alatt 0 (egy darab), a koinó határán megáll', () => {
  const ki = {
    kicsi: koinonMelysege(0) === 0 && koinonMelysege(1) === 0 && koinonMelysege(39) === 0,
    kuszob: koinonMelysege(40) === 1 && koinonMelysege(79) === 1 && koinonMelysege(80) === 2,
    millio: koinonMelysege(1e6) === 15,
    r: koinonMelysege(10, 5) === 1 && koinonMelysege(9, 5) === 0,
    sapka: koinonMelysege(1e60) === DARAB_MAX_MELYSEG,
    // a lefelé kerekítés a tartók felé dönt: darabonként átlagosan legalább r tag
    tartok: [40, 100, 1000, 54321, 1e6].every((n) => n / 2 ** koinonMelysege(n) >= 20)
  };
  if (!Object.values(ki).every(Boolean)) console.log('    (ami bukott: ' + Object.keys(ki).filter((x) => !ki[x]).join(', ') + ')');
  return Object.values(ki).every(Boolean);
});

proba('⭐ a koinon eseményei (a döntés tömör alakja, az állásfoglalás) a koinon kulcsához is bejelentődnek — más esemény nem', async () => {
  const f = await ujEember(KOINO);
  const x = egyezmenyAz('b');
  const af = await f.tesz('Allasfoglalas', { egyezmeny: x, allas: 'tiltakozik', masik: null, indoklas: null }, undefined, { entitas: x });
  const ko = await f.tesz('KoinonOsszegzes', { javaslat: x, reszek: [], esemenyek: [], tanusitvanyok: [] }, undefined, { entitas: x });
  const g = await f.tesz('GondolatLetrehozas', { cim: 'G', meret: 10 });
  return bejelentesHelyei(af).includes(KOINON_KULCS) && bejelentesHelyei(ko).includes(KOINON_KULCS)
    && !bejelentesHelyei(g).includes(KOINON_KULCS) && szelet(af) === x && szelet(ko) === x;
});

proba('⭐⭐ a darab halmaza a koinon kulcsához bejelentettek közül azok, amelyeknek az EGYEZMÉNYE a darabba esik — egy egyezmény minden eseménye ugyanott', async () => {
  const { f, letrehozas, a } = await allasfoglalasok(40);
  // ugyanazon az egyezményen egy második állásfoglalás (a hatály él: a későbbi számít — a darab mindkettőt hordja)
  const masodik = await f.tesz('Allasfoglalas', { egyezmeny: a[0].adat.egyezmeny, allas: 'tiltakozik', masik: null, indoklas: null },
    undefined, { entitas: a[0].adat.egyezmeny });
  const g = await f.tesz('GondolatLetrehozas', { cim: 'G', meret: 10 });
  const t = await tar([letrehozas, ...a, masodik, g]);
  const kulcs = koinonDarabKulcsa(2, 1);
  const benne = (await egyeztetettEsemenyek(t, KOINO, kulcs)).map((e) => e.azonosito).sort();
  const vart = [...a, masodik].filter((e) => esik(e, kulcs)).map((e) => e.azonosito).sort();
  const egeszKoinon = (await egyeztetettEsemenyek(t, KOINO, koinonDarabKulcsa(0, 0))).length;
  return vart.length > 0 && benne.length === vart.length && benne.every((x, i) => x === vart[i])
    && benne.includes(a[0].azonosito) === benne.includes(masodik.azonosito) && egeszKoinon === a.length + 1;
});

proba('⭐⭐ KO6 (A): a KÖZÖS darab két készülék közt — egy mélységen a közös darab; szomszéd mélységen a MÉLYEBB (a sekélyebbnek a fele), a lenyomata a sekélyebb jeléből; nem egymásba esőnél és két szint távolságnál nincs', () => {
  const l = (x) => ['L' + x + '0', 'L' + x + '1', 'L' + x + '2'];
  let azonos = null, nemAzonos = null, beagyazott = null, nemBeagyazott = null;
  for (let i = 0; i < 4000 && !(azonos && nemAzonos && beagyazott && nemBeagyazott); i++) {
    const a = 'a' + i, b = 'b' + i;
    const ka = koinonDarabKulcsai(a, 3), kb3 = koinonDarabKulcsai(b, 3), kb4 = koinonDarabKulcsai(b, 4);
    if (ka[0] === kb3[0]) azonos ??= [a, b];
    else nemAzonos ??= [a, b];
    if (ka.slice(1).includes(kb4[0])) beagyazott ??= [a, b, ka.indexOf(kb4[0])];
    else nemBeagyazott ??= [a, b];
  }
  const egy = ([a, b]) => kozosKoinonDarab({ alairo: a, melyseg: 3, lenyomatok: l('a') }, { alairo: b, melyseg: 3, lenyomatok: l('b') });
  const r1 = egy(azonos);
  const [ba, bb, hely] = beagyazott;
  const r2 = kozosKoinonDarab({ alairo: ba, melyseg: 3, lenyomatok: l('a') }, { alairo: bb, melyseg: 4, lenyomatok: l('b') });
  const r2t = kozosKoinonDarab({ alairo: bb, melyseg: 4, lenyomatok: l('b') }, { alairo: ba, melyseg: 3, lenyomatok: l('a') });
  const ki = {
    egyMelysegen: r1?.kulcs === koinonDarabKulcsai(azonos[0], 3)[0] && r1.a === 'La0' && r1.b === 'Lb0' && egy(nemAzonos) === null,
    szomszed: r2?.kulcs === koinonDarabKulcsai(bb, 4)[0] && r2.a === 'La' + hely && r2.b === 'Lb0',
    tukor: r2t?.kulcs === r2?.kulcs && r2t.a === r2.b && r2t.b === r2.a,
    nemBeagyazott: kozosKoinonDarab({ alairo: nemBeagyazott[0], melyseg: 3, lenyomatok: l('a') },
      { alairo: nemBeagyazott[1], melyseg: 4, lenyomatok: l('b') }) === null,
    ketSzint: kozosKoinonDarab({ alairo: 'x', melyseg: 0, lenyomatok: l('a') }, { alairo: 'y', melyseg: 2, lenyomatok: l('b') }) === null
  };
  if (!Object.values(ki).every(Boolean)) console.log('    (ami bukott: ' + Object.keys(ki).filter((x) => !ki[x]).join(', ') + ')');
  return Object.values(ki).every(Boolean);
});

// ===================================
// 2. A CSERE
// ===================================

proba('⭐⭐ KÖZÖS darab (a 0. mélység mindenkié): az állásfoglalások átjönnek, a második csere a nyitásnál véget ér — koinon-jel nélkül (a régi program; rontás) semmi, és a csere nem drágul', async () => {
  const { letrehozas, a } = await allasfoglalasok(6);
  const [tA, tB] = await kulcsPar(() => true);
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r1 = await csere(tarA, tarB, tA, tB, { mA: 0, mB: 0 });
  const jott = await megvan(tarB, a);
  const r2 = await csere(tarA, tarB, tA, tB, { mA: 0, mB: 0 });
  const tarC = await tar([letrehozas]);
  const r3 = await csere(tarA, tarC, tA, tB, { mA: 0, mB: null });
  const ki = {
    atjott: jott === a.length && r1.b.uj === a.length,
    masodik: r2.b.egyeztetoUzenetek === 0 && r2.b.uj === 0,
    regi: (await megvan(tarC, a)) === 0 && r3.b.egyeztetoUzenetek === 0 && r3.a.egyeztetoUzenetek === 0
  };
  if (!Object.values(ki).every(Boolean)) console.log('    (ami bukott: ' + Object.keys(ki).filter((x) => !ki[x]).join(', ') + ')');
  return Object.values(ki).every(Boolean);
});

proba('⭐⭐ KO6 (A): SZOMSZÉD mélységű társak — a mélyebbik darabja jön át (a sekélyebbnek a fele), a másik fele nem; a második csere a nyitásnál véget ér', async () => {
  const m = 2;
  const { letrehozas, a } = await allasfoglalasok(60, 'sz');
  // B darabja (m+1) az A darabjának (m) egyik fele
  const [tA, tB] = await kulcsPar((x, y) => koinonDarabKulcsai(alairoja(x), m).slice(1).includes(darabKulcsa(y, m + 1)));
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r1 = await csere(tarA, tarB, tA, tB, { mA: m, mB: m + 1 });
  const bKulcs = darabKulcsa(tB, m + 1);
  const aKulcs = darabKulcsa(tA, m);
  const bent = a.filter((e) => esik(e, bKulcs));
  const masikFel = a.filter((e) => esik(e, aKulcs) && !esik(e, bKulcs));
  const kint = a.filter((e) => !esik(e, aKulcs));
  const r2 = await csere(tarA, tarB, tA, tB, { mA: m, mB: m + 1 });
  const ki = {
    bent: bent.length > 0 && (await megvan(tarB, bent)) === bent.length && r1.b.uj === bent.length,
    masikFel: masikFel.length > 0 && (await megvan(tarB, masikFel)) === 0,
    kint: (await megvan(tarB, kint)) === 0,
    masodik: r2.b.egyeztetoUzenetek === 0 && r2.b.uj === 0
  };
  if (!Object.values(ki).every(Boolean)) console.log('    (ami bukott: ' + Object.keys(ki).filter((x) => !ki[x]).join(', ') + ')');
  return Object.values(ki).every(Boolean);
});

proba('⭐ NEM közös darab (egy mélységen, más darab): semmi nem jön át, és a csere az első szint nélkül véget ér', async () => {
  const m = 2;
  const { letrehozas, a } = await allasfoglalasok(24, 'nk');
  const [tA, tB] = await kulcsPar((x, y) => darabKulcsa(x, m) !== darabKulcsa(y, m));
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r = await csere(tarA, tarB, tA, tB, { mA: m, mB: m });
  return (await megvan(tarB, a)) === 0 && r.b.egyeztetoUzenetek === 0 && r.b.elteroSzeletek === 0;
});

proba('⭐⭐ a SAJÁT állásfoglalásom a csak küldő úton eljut az egyezmény darabjának tartójához (ahol én nem vagyok tartó)', async () => {
  const m = 2;
  const [tA, tB] = await kulcsPar((x, y) => darabKulcsa(x, m) !== darabKulcsa(y, m));
  const b = await ujEember(KOINO);
  const letrehozas = await b.tesz('KoinoLetrehozas', { nev: 'Koinon', leiras: null, alapitok: [], zart: false });
  // B állásfoglalásai közül egy, amelyiknek az egyezménye A darabjába esik (m-en), B-ébe nem.
  let x = null;
  for (let i = 0; i < 400 && !x; i++) {
    const egyezmeny = egyezmenyAz('ku' + i);
    if (esik({ entitas: egyezmeny }, darabKulcsa(tA, m)) && !esik({ entitas: egyezmeny }, darabKulcsa(tB, m))) {
      x = await b.tesz('Allasfoglalas', { egyezmeny, allas: 'csatlakozik', masik: null, indoklas: null }, undefined, { entitas: egyezmeny });
    }
  }
  const tarA = await tar([letrehozas]);
  const tarB = await tar([letrehozas, x]);
  const darabjai = (t) => new Set(koinonDarabKulcsai(alairoja(t), m));
  const kulcsai = (e) => [e.entitas ?? e.azonosito, egyezmenyKoinonDarabKulcsa(szelet(e), m)];
  const kuldo = sajatKuldo({ tar: tarB, koino: KOINO, szerzo: b.szerzo, kulcsai,
    halmazkent: async (k) => (koinonDarabBol(k) ? darabjai(tB).has(k) : true) });
  const fogado = kuldoFogado({ tar: tarA, fogadhato: async (k) => darabjai(tA).has(k) });
  const r = await csere(tarA, tarB, tA, tB, { mA: m, mB: m,
    a: { kuldoKerem: fogado.kerem }, b: { kuldoSzeletek: (szabad) => kuldo.lista(szabad) } });
  return !!(await tarA.esemeny(x.azonosito)) && r.b.kezbesitve.includes(x.azonosito);
});

proba('⛔ a koinon kulcsa EGÉSZÉBEN sosem cserélődik — „mindent” módban is csak az egyezmények szeletei térnek el', async () => {
  const { letrehozas, a } = await allasfoglalasok(5, 'mi');
  const [tA, tB] = await kulcsPar(() => true);
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r = await csere(tarA, tarB, tA, tB, { reszvesz: () => true });
  return (await megvan(tarB, a)) === a.length && r.b.elteroSzeletek === a.length;
});

proba('⛔ zárt koinóban a NEM TAGNAK nem jár a koinon — a közös darab kimarad, és a csere nem csúszik el', async () => {
  const { letrehozas, a } = await allasfoglalasok(6, 'za');
  const [tA, tB] = await kulcsPar(() => true);
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r = await csere(tarA, tarB, tA, tB, { mA: 0, mB: 0,
    a: { zartKapu: async () => ({ szabad: false, kell: false, ok: 'próba', szeletek: [letrehozas.azonosito] }) } });
  return r.a.tarsKorlatozva && (await megvan(tarB, a)) === 0;
});

export default async function () {
  const eredmeny = await futtatas();
  for (const m of mappak) await rm(m, { recursive: true, force: true });
  return eredmeny;
}
