// meres/koinonDarabProba.js

// Felelősség: bizonyítani, hogy a KOINON DARABJAI (D130 ③c — `cimjegyzek.js`, `esemeny.js`, `szeletEgyeztetes.js`, a vonal)
// működnek: a darab kulcsa felismerhető (`n` jel), és nem keveredik a gyökér, a kereső-réteg és a koinon kulcsával; a mélység az
// ismert tagokból jön (`floor(log2(tagok / r))` — KO2 (A), 95. mérés); a koinon eseményei (a döntés tömör alakja, az
// állásfoglalások) a koinon kulcsához bejelentődnek, és a darab halmaza az egyezményük szerint szűr; a valódi cserén
// (UDP-rés, titkosítva) a KÖZÖS darab eseményei átjönnek — a szomszéd mélységű társsal a MÉLYEBB darab (KO6 (A): átfedés
// nélkül, mindkettőnél egészében megvan), a nem közösé nem, és a második csere a nyitásnál véget ér; a saját állásfoglalásom a
// csak küldő úton eljut a darab tartójához; a koinon kulcsa egészében sosem cserélődik; a zárt koino nem tagja nem kap belőle.
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
import { bejelentesHelyei, szelet, KOINON_KULCS, koinonHelyei } from '../js/esemeny/esemeny.js';
import { rendszerAzonosito } from '../js/esemeny/rendszerEntitas.js';
import {
  koinonDarabKulcsa, koinonDarabBol, koinonDarabKulcsai, koinonLenyomata, koinonMelysege, kozosKoinonDarab,
  egyezmenyKoinonDarabKulcsa, darabbaEsik, gyokerDarabKulcsa, gyokerDarabBol, DARAB_MAX_MELYSEG,
  // ⭐⭐ D130 (④a): a kosarak a DHT-n
  koinonHirdetendoTemak, koinonKeresoKulcsai, cimjegyzekTema, figyelendoKopogtatok, temaKopogtatoja,
  // ⭐⭐ D130 (④b): a látott tartók és a látott cél
  koinonLatottTartok, koinonLatottCel, kosarSzamlalasSzovege, KOINON_KESES_RAHAGYAS,
  // ⭐⭐ D130 (④c1): a segítő kosarak a nyitó jelben
  koinonKosarKulcsai, kosarJelSzovege, kosarJelOlvasasa, kozosKoinonKosarak, koinonTeher, KOINON_KOSAR_JEL_KORLAT,
  // ⭐⭐ D130 (④c2): a felkérés és a keret
  kosarTartalmazza, leadandoSegitok, KOINON_KERET_ALAP_MB, KOINON_UJ_SZEREP_KOZ, KOINON_FUGGO_KORLAT
} from '../js/csere/cimjegyzek.js';
import { kerelemAlakja, felkeresValaszAlakja, KERELEM_FAJTAK, TOVABBADHATO_FAJTAK } from '../js/csere/kerelem.js';
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

proba('⭐ a koinon-darab kulcsa érvényes vonal-kulcs, visszafejthető, és nem keveredik a gyökér-darabbal, a koino születésével és a koinon kulcsával (az nem darab)', () => {
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

proba('⭐⭐ KO2 (A), 95. mérés: a mélység az ismert tagokból — `floor(log2(tagok / r))`, 2r alatt 0 (egy darab), a koino határán megáll', () => {
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

// ===================================
// ⭐⭐ D130 (③e, KO5 (B)): A KÉZIKÖNYV A DARABOKBAN
// ===================================

/** Egy alapító és `n` pont-eseménye `n` kézikönyv-bejegyzésen (a nevük a darabjukat adja). */
async function kezikonyvPontok(n, jel = 'k') {
  const f = await ujEember(KOINO);
  const letrehozas = await f.tesz('KoinoLetrehozas', { nev: 'Kézikönyves', leiras: null, alapitok: [], zart: false });
  const k = [];
  for (let i = 0; i < n; i++) {
    const nev = 'kezikonyv/proba-' + jel + '-' + i;
    k.push(await f.tesz('TudatpontRendezes', { entitas: rendszerAzonosito(nev), pont: 1, szerep: 'aktiv', rendszer: [nev] }));
  }
  return { f, letrehozas, k };
}
/** A kézikönyv-esemény (valamelyik bejegyzése) a kulcs darabjába esik-e. */
const nevSzerintEsik = (e, kulcs) => {
  const d = koinonDarabBol(kulcs);
  return koinonHelyei(e).some((x) => darabbaEsik(koinonLenyomata(x), d.melyseg, d.darab));
};

// Rontás: a darab halmaza a szeletből szűr (nem a névből) → a pont-esemény szelete a bejegyzés, de a két-nevű esemény a második
// darabból kimarad → bukik; a bejelentés a régi gyökér-szeletbe megy (a koinon kulcsához nem) → a halmaz üres → bukik.
proba('⭐⭐ D130 (③e, KO5 (B)): a kézikönyv-esemény a koinon kulcsához jelentődik be, és a bejegyzése NEVE szerinti darabba esik — egy két-nevű esemény (az áthelyezés: a bejegyzés és a cél) mindkét darabban; a hétköznapi esemény egyikben sem', async () => {
  const { f, letrehozas, k } = await kezikonyvPontok(40);
  const kulcs0 = koinonDarabKulcsa(1, 0);
  const kulcs1 = koinonDarabKulcsa(1, 1);
  // két bejegyzés, amelyik a két külön darabba esik — egy esemény mindkettő nevével
  const n0 = k.find((e) => nevSzerintEsik(e, kulcs0));
  const n1 = k.find((e) => nevSzerintEsik(e, kulcs1));
  const ketNevu = await f.tesz('TudatpontRendezes', { entitas: n0.entitas, pont: 2, szerep: 'aktiv',
    rendszer: [...n0.adat.rendszer, ...n1.adat.rendszer] });
  const g = await f.tesz('GondolatLetrehozas', { cim: 'G', meret: 10 });
  const t = await tar([letrehozas, ...k, ketNevu, g]);
  const halmaz = async (kulcs) => (await egyeztetettEsemenyek(t, KOINO, kulcs)).map((e) => e.azonosito);
  const h0 = await halmaz(kulcs0);
  const h1 = await halmaz(kulcs1);
  const r = {
    bejelentes: k.every((e) => bejelentesHelyei(e).includes(KOINON_KULCS)) && !bejelentesHelyei(g).includes(KOINON_KULCS),
    nevSzerint: k.every((e) => h0.includes(e.azonosito) === nevSzerintEsik(e, kulcs0) && h1.includes(e.azonosito) === nevSzerintEsik(e, kulcs1)),
    ketDarabban: h0.includes(ketNevu.azonosito) && h1.includes(ketNevu.azonosito),
    hetkoznapi: !h0.includes(g.azonosito) && !h1.includes(g.azonosito),
    egesz: (await halmaz(koinonDarabKulcsa(0, 0))).length === k.length + 1
  };
  if (!Object.values(r).every(Boolean)) console.log('    (' + JSON.stringify({ r, h0: h0.length, h1: h1.length }) + ')');
  return Object.values(r).every(Boolean);
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

// Rontás: a fogadó szűrője (`szeletbeTartozik`) a kézikönyv-eseményt nem a neve szerint sorolja → a közös darab eseményei nem jönnek át
// → bukik.
proba('⭐⭐ D130 (③e): a KÉZIKÖNYV a cserében — a közös darabba eső bejegyzések eseményei átjönnek, a másik darabéi nem (a nem tartott bejegyzés közösségi módosítása kérésre jön — KO9 (A))', async () => {
  const m = 1;
  const { f, letrehozas, k: pontok } = await kezikonyvPontok(40, 'cs');
  // ⚠️ egy döntés-esemény is (mint a pont egy kézikönyv-bejegyzés szerkesztési javaslatán): a SZELETE a javaslat, a NEVE a bejegyzés —
  // a darabját a neve adja (a szeletéből nem jönne ki ugyanaz)
  const javaslaton = [];
  for (let i = 0; i < 20; i++) {
    const nev = pontok[i].adat.rendszer[0];
    javaslaton.push(await f.tesz('TudatpontRendezes', { entitas: egyezmenyAz('jv' + i), pont: 1, szerep: 'aktiv', rendszer: [nev] }));
  }
  const k = [...pontok, ...javaslaton];
  const [tA, tB] = await kulcsPar((x, y) => darabKulcsa(x, m) === darabKulcsa(y, m));
  const kozos = darabKulcsa(tA, m);
  const tarA = await tar([letrehozas, ...k]);
  const tarB = await tar([letrehozas]);
  const r1 = await csere(tarA, tarB, tA, tB, { mA: m, mB: m });
  const bent = k.filter((e) => nevSzerintEsik(e, kozos));
  const kint = k.filter((e) => !nevSzerintEsik(e, kozos));
  const ki = {
    bent: bent.length > 0 && (await megvan(tarB, bent)) === bent.length && r1.b.uj === bent.length,
    kint: kint.length > 0 && (await megvan(tarB, kint)) === 0,
    javaslaton: javaslaton.some((e) => nevSzerintEsik(e, kozos)) && javaslaton.some((e) => !nevSzerintEsik(e, kozos))
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

proba('⛔ zárt koinoban a NEM TAGNAK nem jár a koinon — a közös darab kimarad, és a csere nem csúszik el', async () => {
  const { letrehozas, a } = await allasfoglalasok(6, 'za');
  const [tA, tB] = await kulcsPar(() => true);
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r = await csere(tarA, tarB, tA, tB, { mA: 0, mB: 0,
    a: { zartKapu: async () => ({ szabad: false, kell: false, ok: 'próba', szeletek: [letrehozas.azonosito] }) } });
  return r.a.tarsKorlatozva && (await megvan(tarB, a)) === 0;
});

// ===================================
// ⭐⭐ D130 (④a — KO11 (A), a 98. mérés után): A KOSARAK A DHT-N
// ===================================

// A tartó a kosarait a `szelet` fajtán hirdeti, a darab-kulcson — a kérő meglévő útja (a téma párja, D92/1) így éri el, és a tartó a
// párt magától figyeli. Rontás: a 0. mélységű kosarat is hirdeti → az `egy` bukik; más fajtán/kulcson hirdet → a `tema` vagy a `par`
// bukik; az ismétlést vagy a nem darab-kulcsot nem szűri → a `szures` bukik.
proba('⭐⭐ D130 (④a): a kosár témája a `szelet` fajtán, a darab-kulcson — a 0. mélységen nincs, az ismétlés és a nem darab-kulcs kimarad, és a párját a tartó figyeli', () => {
  const k = koinonDarabKulcsa(3, 5);
  const t = koinonHirdetendoTemak({ koino: KOINO, kosarak: [k, k, koinonDarabKulcsa(0, 0), gyokerDarabKulcsa(3, 5), 'nem-kulcs', null] });
  const ket = koinonHirdetendoTemak({ koino: KOINO, kosarak: [k], valtozatok: [2, 1] });
  const figyelt = figyelendoKopogtatok({ koino: KOINO, alairo: 'a1', hirdetett: t });
  const ki = {
    egy: koinonHirdetendoTemak({ koino: KOINO, kosarak: [koinonDarabKulcsa(0, 0)] }).length === 0,
    szures: t.length === 1 && t[0].fajta === 'szelet' && t[0].kulcs === k,
    tema: t[0].tema.equals(cimjegyzekTema(KOINO, 'szelet', k)),
    valtozat: ket[0].temak.length === 2 && ket[0].temak[0].equals(cimjegyzekTema(KOINO, 'szelet', k, 2))
      && ket[0].temak[1].equals(cimjegyzekTema(KOINO, 'szelet', k, 1)),
    par: figyelt.some((f) => f.tema.equals(temaKopogtatoja(KOINO, 'szelet', k)))
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A kérő a darab saját témáján és a SZÜLŐJÉÉN keres (a sekélyebb tartó az egészet tartja) — a gyermekekén nem (fél válasz), a 0.
// mélységű szülőn nem (senki nem hirdeti). Rontás: a szülő helyett a gyermek → a `szulo` bukik; a 0. mélység is → az `elso` bukik.
proba('⭐⭐ D130 (④a): a kérő a darab témáján és a szülőjéén keres — a szülő tartalmazza a darabot; a 0. mélységű szülőn és a gyermekeken nem', () => {
  const k = koinonDarabKulcsa(4, 11);
  const [sajat, szulo, ...tobb] = koinonKeresoKulcsai(k);
  const sz = koinonDarabBol(szulo);
  // a szülő az egészet tartja: egy egyezmény, ami a darabba esik, a szülőbe is
  let tartalmazza = true;
  for (let i = 0; i < 200; i++) {
    const az = 'e' + i;
    const l = koinonLenyomata(az);
    if (darabbaEsik(l, 4, 11n) && !darabbaEsik(l, sz.melyseg, sz.darab)) tartalmazza = false;
  }
  const ki = {
    sajat: sajat === k && tobb.length === 0,
    szulo: sz?.melyseg === 3 && sz.darab === 5n && tartalmazza,
    elso: koinonKeresoKulcsai(koinonDarabKulcsa(1, 1)).length === 1,
    nemDarab: koinonKeresoKulcsai(gyokerDarabKulcsa(4, 11)).length === 0 && koinonKeresoKulcsai('x').length === 0
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// ===================================
// ⭐⭐ D130 (④b — KO14 (A), KO17 (A)): A KOSÁR LÁTOTT TARTÓI
// ===================================

// A látott cél a példányszám 1,25-szöröse, felfelé kerekítve (KO17 (A) — a DHT késésének ráhagyása). Rontás: lefelé kerekít → az
// r = 7 (8,75) 8 lesz → bukik; a ráhagyás nélkül → az r = 20 20 lesz → bukik.
proba('⭐⭐ D130 (④b, KO17 (A)): a látott cél a példányszám 1,25-szöröse, felfelé kerekítve — 20 → 25, 1 → 2, 7 → 9', () =>
  KOINON_KESES_RAHAGYAS === 1.25 && koinonLatottCel(20) === 25 && koinonLatottCel(1) === 2 && koinonLatottCel(7) === 9
    && koinonLatottCel(4) === 5 && koinonLatottCel() === 25 && koinonLatottCel(0) === 25);

// Címenként egyszer (a port nem számít), a saját címeim helyett egyszer én, a szülő-kosár hirdetői hozzáadódnak (ismétlés nélkül).
// Rontás: a portot is számolja → a `port` bukik; a saját címemet is → a `sajat` bukik; magamat nem → az `ures` bukik.
proba('⭐⭐ D130 (④b): a látott tartók címenként egyszer, a saját címeim nélkül, egyszer én — a szülő-kosár hirdetőivel együtt', () => {
  const t = (cim, port = 1) => ({ cim, port });
  const ki = {
    ures: koinonLatottTartok() === 1 && koinonLatottTartok({ tarsak: [] }) === 1,
    port: koinonLatottTartok({ tarsak: [t('10.0.0.1', 1), t('10.0.0.1', 2), t('10.0.0.1', 3), t('10.0.0.2')] }) === 3,
    sajat: koinonLatottTartok({ tarsak: [t('127.0.0.1', 8081), t('203.0.113.5', 4000), t('10.0.0.1')],
      sajatCimek: ['127.0.0.1', '203.0.113.5'] }) === 2,
    alak: koinonLatottTartok({ tarsak: [t('::ffff:10.0.0.1'), t('10.0.0.1')] }) === 2,
    szulo: koinonLatottTartok({ tarsak: [t('10.0.0.1')], szuloTarsak: [t('10.0.0.1', 9), t('10.0.0.3')] }) === 3,
    szoveg: kosarSzamlalasSzovege({ latott: 3, cel: 25, szulovel: true }) === '3 tartó látszik a DHT-n (a szülő-kosáréval együtt), a cél 25 — kevés'
      && kosarSzamlalasSzovege({ latott: 25, cel: 25 }) === '25 tartó látszik a DHT-n, a cél 25'
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// ===================================
// ⭐⭐ D130 (④c1): A SEGÍTŐ KOSARAK A NYITÓ JELBEN ÉS A CSERÉBEN
// ===================================

// A jel alakja oda-vissza; a 0. mélységű, a mélységen kívüli és a hibás alakú kosár null; a kulcsok a kosár és a két fele; a teher
// a mélységgel súlyozva (egy kettéválás nem duplázza). Rontás: a 0. mélységet is elfogadja → a `nulla` bukik; a darabot nem nézi a
// mélységhez → a `kivul` bukik; a teher a kosarak száma → a `teher` bukik.
proba('⭐⭐ D130 (④c1): a segítő kosár jele (`m:d:l:l0:l1`) oda-vissza — a 0. mélység, a mélységen kívüli darab és a hibás alak nem; a teher a mélységgel súlyozva', () => {
  const k = { melyseg: 3, darab: 5n, lenyomatok: ['AAAAAAAAAAA', null, 'BBBBBBBBBBB'] };
  const sz = kosarJelSzovege(k);
  const vissza = kosarJelOlvasasa(sz);
  const [kk, f0, f1] = koinonKosarKulcsai(3, 5n);
  const ki = {
    alak: sz === '3:5:AAAAAAAAAAA::BBBBBBBBBBB',
    vissza: vissza?.melyseg === 3 && vissza.darab === 5n && vissza.lenyomatok[0] === 'AAAAAAAAAAA' && vissza.lenyomatok[1] === null
      && vissza.lenyomatok[2] === 'BBBBBBBBBBB',
    nulla: kosarJelOlvasasa('0:0:::') === null,
    kivul: kosarJelOlvasasa('2:4:::') === null && kosarJelOlvasasa('2:3:::') !== null,
    hibas: kosarJelOlvasasa('x') === null && kosarJelOlvasasa('2:3::') === null && kosarJelOlvasasa(null) === null
      && kosarJelOlvasasa('2:3:' + 'A'.repeat(12) + '::') === null,
    kulcsok: koinonDarabBol(kk).darab === 5n && koinonDarabBol(f0).melyseg === 4 && koinonDarabBol(f0).darab === 10n
      && koinonDarabBol(f1).darab === 11n && koinonKosarKulcsai(DARAB_MAX_MELYSEG, 0n).length === 1,
    teher: koinonTeher([{ melyseg: 1 }, { melyseg: 2 }]) === 0.75 && koinonTeher([{ melyseg: 2 }, { melyseg: 2 }]) === koinonTeher([{ melyseg: 1 }])
      && koinonTeher([]) === 0,
    korlat: KOINON_KOSAR_JEL_KORLAT === 32
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A közös kosarak a két fél MINDEN tartott kosarából (a saját darab az aláírásból, a segítő a jelből): két segítő egy kosáron, a
// saját és a társ segítője, szomszéd mélységen a mélyebb; kulcsonként egyszer. Rontás: csak a saját darabot nézi → a `segito` bukik.
proba('⭐⭐ D130 (④c1): a KÖZÖS kosarak a saját és a segítő kosarakból — két segítő egy kosáron, a saját és a társ segítője, szomszéd mélységen a mélyebb; kulcsonként egyszer', async () => {
  const m = 2;
  const [tA, tB] = await kulcsPar((x, y) => darabKulcsa(x, m) !== darabKulcsa(y, m));
  const ka = koinonDarabBol(darabKulcsa(tA, m));
  const ures = [null, null, null];
  const sajatA = { alairo: alairoja(tA), melyseg: m, lenyomatok: ['L', null, null] };
  const sajatB = { alairo: alairoja(tB), melyseg: m, lenyomatok: ures };
  // egy kosár, ami egyiküknek sem a sajátja
  const kb = koinonDarabBol(darabKulcsa(tB, m));
  const masik = [0n, 1n, 2n, 3n].find((d) => d !== ka.darab && d !== kb.darab);
  const ki = {
    nincs: kozosKoinonKosarak([sajatA], [sajatB]).length === 0,
    segito: (() => { const k = kozosKoinonKosarak([sajatA], [sajatB, { melyseg: m, darab: ka.darab, lenyomatok: ['M', null, null] }]);
      return k.length === 1 && k[0].kulcs === darabKulcsa(tA, m) && k[0].a === 'L' && k[0].b === 'M'; })(),
    ketSegito: (() => { const k = kozosKoinonKosarak([sajatA, { melyseg: m, darab: masik, lenyomatok: ['X', null, null] }],
      [sajatB, { melyseg: m, darab: masik, lenyomatok: ['Y', null, null] }]);
      return k.length === 1 && koinonDarabBol(k[0].kulcs).darab === masik && k[0].a === 'X' && k[0].b === 'Y'; })(),
    szomszed: (() => { const k = kozosKoinonKosarak([{ melyseg: m, darab: masik, lenyomatok: ['P', 'Q', 'R'] }],
      [{ melyseg: m + 1, darab: 2n * masik + 1n, lenyomatok: ['S', null, null] }]);
      return k.length === 1 && koinonDarabBol(k[0].kulcs).melyseg === m + 1 && k[0].a === 'R' && k[0].b === 'S'; })(),
    egyszer: kozosKoinonKosarak([sajatA, { melyseg: m, darab: ka.darab, lenyomatok: ['L', null, null] }],
      [{ melyseg: m, darab: ka.darab, lenyomatok: ['M', null, null] }]).length === 1
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A valódi cserén: (1) B egy kosarat SEGÍTŐKÉNT tart (a jelben viszi), ami A saját kosara — a kosár eseményei átjönnek, a többi nem, és
// a második csere a nyitásnál véget ér; (2) két segítő (egyiknek sem a sajátja) ugyanígy; (3) a régi program (jel nélkül) semmit nem
// kap. Rontás: a vonal a `knk`-t nem küldi vagy nem olvassa → az (1) és a (2) semmit nem kap → bukik.
proba('⭐⭐ D130 (④c1): a SEGÍTŐ kosár a cserében — a nyitó jel viszi, a kosár eseményei átjönnek (a többi nem); két segítő között is; jel nélkül (a régi program) semmi', async () => {
  const m = 2;
  const { letrehozas, a } = await allasfoglalasok(40, 'sg');
  // (1) A saját kosara K, B-é nem — B segítőként tartja
  const [tA, tB] = await kulcsPar((x, y) => darabKulcsa(x, m) !== darabKulcsa(y, m));
  const K = darabKulcsa(tA, m);
  const kd = koinonDarabBol(K);
  const segitoK = [{ melyseg: m, darab: kd.darab }];
  const bentK = a.filter((e) => esik(e, K));
  const tarA = await tar([letrehozas, ...a]);
  const tarB = await tar([letrehozas]);
  const r1 = await csere(tarA, tarB, tA, tB, { mA: m, mB: m, b: { koinonSegitok: segitoK } });
  const r2 = await csere(tarA, tarB, tA, tB, { mA: m, mB: m, b: { koinonSegitok: segitoK } });
  // (2) egy H kosár, ami C-nek és D-nek sem a sajátja — mindkettő segítőként tartja. ⚠️ A két saját kosár is különbözzön: ha egyezne,
  // annak eseményei is átjönnének (a teljes soron így bukott el); és a H-t a pár UTÁN választjuk (a `kulcsPar` az első kulcsot rögzíti —
  // ha annak a saját kosara volna a H, nem találna párt)
  const [tC, tD] = await kulcsPar((x, y) => darabKulcsa(x, m) !== darabKulcsa(y, m));
  const hd = [0n, 1n, 2n, 3n].find((d) => koinonDarabKulcsa(m, d) !== darabKulcsa(tC, m) && koinonDarabKulcsa(m, d) !== darabKulcsa(tD, m));
  const H = koinonDarabKulcsa(m, hd);
  const segitoH = [{ melyseg: m, darab: hd }];
  const bentH = a.filter((e) => esik(e, H));
  const tarC = await tar([letrehozas, ...a]);
  const tarD = await tar([letrehozas]);
  const r3 = await csere(tarC, tarD, tC, tD, { mA: m, mB: m, a: { koinonSegitok: segitoH }, b: { koinonSegitok: segitoH } });
  // (3) a régi program: E-nek nincs segítő-jele
  const tarE = await tar([letrehozas]);
  await csere(tarC, tarE, tC, tD, { mA: m, mB: m, a: { koinonSegitok: segitoH } });
  const kiD = await megvan(tarD, a);
  const ki = {
    egy: bentK.length > 0 && (await megvan(tarB, bentK)) === bentK.length && (await megvan(tarB, a)) === bentK.length
      && r1.b.uj === bentK.length,
    masodik: r2.b.egyeztetoUzenetek === 0 && r2.b.uj === 0,
    ketSegito: bentH.length > 0 && (await megvan(tarD, bentH)) === bentH.length && kiD === bentH.length && r3.b.uj === bentH.length,
    regi: (await megvan(tarE, a)) === 0
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (ami bukott: ' + Object.keys(ki).filter((x) => !ki[x]).join(', ')
    + ' · ' + JSON.stringify({ bentK: bentK.length, bentH: bentH.length, r1: r1.b.uj, r3: r3.b.uj, kiD }) + ')\n');
  return Object.values(ki).every(Boolean);
});

// ===================================
// ⭐⭐ D130 (④c2): A FELKÉRÉS ÉS A KERET
// ===================================

// A kosár-tartalmazás (ugyanaz, vagy a belső a külső része), a felkért jelölt magát nem számolja, és a keret fölött a legújabb
// szerepek esnek ki, amíg a teher a keret alá nem kerül. Rontás: a tartalmazás a mélységet nem nézi → a `tart` bukik; a leadás a
// legrégebbit adja le → a `leadas` bukik; a jelölt magát is számolja → a `jelolt` bukik.
proba('⭐⭐ D130 (④c2): a kosár-tartalmazás, a felkért jelölt magát nem számolja, és a keret fölött a LEGÚJABB segítő szerepek esnek ki — amíg a teher a keret alá nem kerül', () => {
  const k = (melyseg, darab) => ({ melyseg, darab });
  const ki = {
    tart: kosarTartalmazza(k(1, 1n), k(1, 1n)) && kosarTartalmazza(k(1, 1n), k(3, 6n)) && kosarTartalmazza(k(1, 1n), k(3, 7n))
      && !kosarTartalmazza(k(1, 1n), k(3, 3n)) && !kosarTartalmazza(k(3, 6n), k(1, 1n)) && !kosarTartalmazza(null, k(1, 1n)),
    jelolt: koinonLatottTartok({ tarsak: [{ cim: '10.0.0.1', port: 1 }], sajatIs: false }) === 1
      && koinonLatottTartok({ tarsak: [], sajatIs: false }) === 0 && koinonLatottTartok({ tarsak: [] }) === 1,
    leadas: JSON.stringify(leadandoSegitok({ segitok: [{ kulcs: 'regi', ido: 1, bajt: 30 }, { kulcs: 'uj', ido: 3, bajt: 30 },
      { kulcs: 'kozep', ido: 2, bajt: 30 }], osszBajt: 100, keretBajt: 50 })) === '["uj","kozep"]',
    alatta: leadandoSegitok({ segitok: [{ kulcs: 'a', ido: 1, bajt: 30 }], osszBajt: 50, keretBajt: 50 }).length === 0,
    allandok: KOINON_KERET_ALAP_MB === 256 && KOINON_UJ_SZEREP_KOZ === 3600000 && KOINON_FUGGO_KORLAT === 4
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

// A felkérés kérelme: koinon-kosár az 1. mélységtől (a 0. és a nem darab-kulcs nem), nem adható tovább; a válasz három állapot,
// minden más „elutasítva”. Rontás: a 0. mélységű kosarat is elfogadja → a `nulla` bukik; a felkérés továbbadható → a `tovabb` bukik.
proba('⭐⭐ D130 (④c2): a felkérés kérelme egy koinon-kosár az 1. mélységtől, nem adható tovább; a válasz megnézem / már tartom / elutasítva', () => {
  const ki = {
    fajta: KERELEM_FAJTAK.includes('felkeres'),
    jo: JSON.stringify(kerelemAlakja({ fajta: 'felkeres', kulcs: koinonDarabKulcsa(2, 3n), n: 5 }))
      === JSON.stringify({ fajta: 'felkeres', kulcs: koinonDarabKulcsa(2, 3n) }),
    nulla: kerelemAlakja({ fajta: 'felkeres', kulcs: koinonDarabKulcsa(0, 0n) }) === null,
    nemDarab: kerelemAlakja({ fajta: 'felkeres', kulcs: gyokerDarabKulcsa(2, 3) }) === null
      && kerelemAlakja({ fajta: 'felkeres', kulcs: egyezmenyAz('x') }) === null,
    tovabb: !TOVABBADHATO_FAJTAK.includes('felkeres'),
    valasz: felkeresValaszAlakja({ allapot: 'megnezem' }).allapot === 'megnezem' && felkeresValaszAlakja({ allapot: 'mar', ok: ' x ' }).ok === 'x'
      && felkeresValaszAlakja({ allapot: 'akarmi' }).allapot === 'elutasitva' && felkeresValaszAlakja(null).allapot === 'elutasitva'
      && felkeresValaszAlakja({ allapot: 'elutasitva', ok: 'y'.repeat(500) }).ok.length === 160
  };
  if (!Object.values(ki).every(Boolean)) process.stdout.write('    (' + JSON.stringify(ki) + ')\n');
  return Object.values(ki).every(Boolean);
});

export default async function () {
  const eredmeny = await futtatas();
  for (const m of mappak) await rm(m, { recursive: true, force: true });
  return eredmeny;
}
