// meres/kezikonyvProba.js

// Felelősség: ⭐⭐ D129 (①, 2026-11-19) — A KÉZIKÖNYV MAGJA: a rendszer-entitás neve és azonosítója, a koino kézikönyv-szabálya,
// a kapu és a bejelentés, a születés nélküli létezés és a D14 kivétele (MA4 (B)), az óvatosabb alap-küszöb (MA8 (B)), és a
// vállalás (mindenki tartja a kézikönyv szeletét).
//
// Csaba: „ha létrehozzuk azt, hogy az összes i betü tartalmát, a rendszer létrehozza, strukturában, és az e-emberek javaslatokkal
// tudják módosítani. ezek lennének az első témák.”
//
// Használja: meres/mind.js (az `allapot` csoport).

import { probaGyujtemeny, ujEember, tagokkal } from './probaFuttato.js';
import { allapotSzamitasa } from '../js/allapot/allapotSzamitas.js';
import { javaslatokSzamitasa } from '../js/allapot/javaslatSzamitas.js';
import { vallalasSzamitasa } from '../js/allapot/vallalas.js';
import { alakiHiba, bejelentesHelyei, koinonHelyei, KOINON_KULCS } from '../js/esemeny/esemeny.js';
import { koinoSzabalyai, teljesSzabalyok, szabalyokAlakiHibaja, kezikonyvesE, KEZIKONYV_ALAP_KUSZOBOK, ALAP_SZABALYOK }
  from '../js/esemeny/koinoSzabalyok.js';
import { rendszerNevE, rendszerAzonosito, szuloNeve, nevEsFelmenoi, rendszerNevekAlakiHibaja, KEZIKONYV_GYOKER, KOINON, KOINON_PONT,
  KEZIKONYV_GYOKER_AZONOSITO } from '../js/esemeny/rendszerEntitas.js';
// ⭐⭐ D129 (②): a javaslatok szabályai, a végrehajtás, az alap-tartalom és az új programverzió
import { szerkesztesiEgyezmenyekAlkalmazasa } from '../js/allapot/szerkesztesiVegrehajtas.js';
import { alapTartalomAlakiHibaja, alapTartalomIndexe, programAlapTartalma, kezikonyvSzovege, programJavaslatai, bejegyzesLenyomata,
  ALAP_TARTALOM_FAJTA, kezikonyvKepbe, bekezdesBlokkok } from '../js/kezikonyv/kezikonyv.js';
// ⭐⭐ D129 (③): a felület ⓘ helyei (a forrásból olvasva — a modul böngészős, Node-ban nem tölthető be); a pakli számai
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { esemenyTarNyitasa } from '../js/tar/fajlTar.js';
import { esemenyMentese } from '../js/tar/esemenyTar.js';
import { helyiStatisztika, ujPakliNezet, kezikonyvBejegyzese } from '../js/allapot/pakli.js';
import { szovegDarabra } from '../js/esemeny/szovegDarab.js';
import { GYOKER_KULCS } from '../js/csere/szeletEgyeztetes.js';

const { proba, futtatas } = probaGyujtemeny('A kézikönyv (D129 ①–④)');

const NAP = 86400 * 1000;
const KEZDET = Date.UTC(2026, 10, 19);
const KERESES = 'kezikonyv/menu/kereses';

/**
 * Egy koino — a kézikönyv szabályával (az új születés) vagy nélküle (a régi) —, egy e-ember, aki a „menü / Keresés”
 * magyarázatára pontot tesz (a nevével), és egy hétköznapi gondolat.
 */
async function eset({ kezikonyv = true } = {}) {
  const alapito = await ujEember();
  const szuletes = await alapito.tesz('KoinoLetrehozas', { nev: 'Kézikönyv-próba', leiras: null, alapitok: [], zart: true,
    ...(kezikonyv ? { szabalyok: teljesSzabalyok() } : {}) }, KEZDET);
  const a = await ujEember();
  const K = rendszerAzonosito(KERESES);
  const pontK = await a.tesz('TudatpontRendezes', { entitas: K, pont: 100, szerep: 'aktiv', rendszer: [KERESES] }, KEZDET + 1000);
  const g = await a.tesz('GondolatLetrehozas', { cim: 'Hétköznapi gondolat', meret: 10 }, KEZDET + 2000);
  const pontG = await a.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 50, szerep: 'aktiv' }, KEZDET + 3000);
  return { alapito, szuletes, a, K, g, esemenyek: [szuletes, pontK, g, pontG] };
}

const allapotbol = async (esemenyek) => allapotSzamitasa(await tagokkal(esemenyek));

// ===================================
// 1. A NÉV ÉS AZ AZONOSÍTÓ
// ===================================

proba('⭐⭐ D129 (①): a kézikönyv-név útvonal (kezikonyv/…), az azonosító a névből (mindenkinél ugyanaz), a szülő az útvonalból',
  async () => {
    const jo = [KEZIKONYV_GYOKER, 'kezikonyv/menu', KERESES, 'kezikonyv/ablak/keszulekeim/hatar-2'];
    const rossz = ['', 'menu', 'masik/menu', 'kezikonyv/', 'kezikonyv//x', 'kezikonyv/Menu', 'kezikonyv/-x', 'kezikonyv/x-',
      'kezikonyv/á', 'kezikonyv/' + 'a/'.repeat(7) + 'a', 'kezikonyv/' + 'a'.repeat(160), null, 7];
    const r = {
      jo: jo.every(rendszerNevE), rossz: !rossz.some(rendszerNevE),
      azonos: rendszerAzonosito(KERESES) === rendszerAzonosito(KERESES) && /^[A-Za-z0-9_-]{43}$/.test(rendszerAzonosito(KERESES))
        && rendszerAzonosito(KERESES) !== rendszerAzonosito('kezikonyv/menu'),
      gyoker: KEZIKONYV_GYOKER_AZONOSITO === rendszerAzonosito(KEZIKONYV_GYOKER),
      szulo: szuloNeve(KERESES) === 'kezikonyv/menu' && szuloNeve(KEZIKONYV_GYOKER) === null,
      felmenok: nevEsFelmenoi(KERESES).join(',') === 'kezikonyv,kezikonyv/menu,' + KERESES,
      lista: rendszerNevekAlakiHibaja(undefined) === null && rendszerNevekAlakiHibaja([KERESES]) === null
        && !!rendszerNevekAlakiHibaja([]) && !!rendszerNevekAlakiHibaja([KERESES, KERESES])
        && !!rendszerNevekAlakiHibaja(Array.from({ length: 9 }, (_, i) => 'kezikonyv/x' + i)) && !!rendszerNevekAlakiHibaja('kezikonyv')
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify(r) + ')\n'); return false; }
    return true;
  });

// ===================================
// 2. A KOINO SZABÁLYA
// ===================================

proba('⭐⭐ D129 (①): a kézikönyv a koino szabálya — az új születésben van (≥ 3 nap), a régiben (mező nélkül) nincs; a kapu az alakját nézi',
  async () => {
    const uj = teljesSzabalyok();
    const { szuletes: ujSz } = await eset();
    const { szuletes: regiSz } = await eset({ kezikonyv: false });
    const k = koinoSzabalyai(ujSz);
    const r = {
      uj: uj.kezikonyv?.alapKuszobok?.minimumDontesiIdo === 259200 && KEZIKONYV_ALAP_KUSZOBOK.minimumDontesiIdo === 259200
        && szabalyokAlakiHibaja(uj) === null,
      // ⛔ a „mai értékek” nem kapják meg — a régi születés kézikönyv nélküli marad
      alap: ALAP_SZABALYOK.kezikonyv === undefined && !kezikonyvesE(ALAP_SZABALYOK),
      ujKoino: kezikonyvesE(k) && k.kezikonyv.alapKuszobok.minimumDontesiIdo === 259200 && Object.isFrozen(k.kezikonyv)
        && Object.isFrozen(k.kezikonyv.alapKuszobok),
      regiKoino: !kezikonyvesE(koinoSzabalyai(regiSz)) && koinoSzabalyai(regiSz) === ALAP_SZABALYOK,
      reszleges: koinoSzabalyai({ ...ujSz, adat: { ...ujSz.adat, szabalyok: { kezikonyv: {} } } }).kezikonyv.alapKuszobok
        .maximumDontesiIdo === KEZIKONYV_ALAP_KUSZOBOK.maximumDontesiIdo,
      megadott: teljesSzabalyok({ kezikonyv: { alapKuszobok: { minimumDontesiIdo: 600 } } }).kezikonyv.alapKuszobok.minimumDontesiIdo === 600,
      kapu: !!szabalyokAlakiHibaja({ kezikonyv: 1 }) && !!szabalyokAlakiHibaja({ kezikonyv: { mas: 1 } })
        && !!szabalyokAlakiHibaja({ kezikonyv: { alapKuszobok: { minimumDontesiIdo: 700000 } } })
        && !!szabalyokAlakiHibaja({ kezikonyv: { alapKuszobok: { ismeretlen: 1 } } })
        && szabalyokAlakiHibaja({ kezikonyv: {} }) === null && alakiHiba(ujSz) === null
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify(r) + ')\n'); return false; }
    return true;
  });

// ===================================
// 3. A KAPU ÉS A BEJELENTÉS
// ===================================

// ⭐⭐ D130 (③e, KO5 (B)): a kézikönyv-esemény a koinon kulcsához jelentődik be (eddig — D129 — a kézikönyv gyökér-szeletébe, amit
// mindenki tartott), a darabját a bejegyzés neve adja (`koinonHelyei`); a hétköznapi esemény nem. Rontás: a bejelentés a régi
// gyökér-szeletbe megy → bukik.
proba('⭐⭐ D129 (①), D130 (③e): a kapu az adat.rendszer alakját nézi; a kézikönyv-esemény a koinon kulcsához jelentődik be (a kézikönyv gyökér-szeletébe nem), a darabját a bejegyzés neve adja',
  async () => {
    const { a, K, esemenyek } = await eset();
    const pontK = esemenyek[1];
    const rossz = await a.tesz('TudatpontRendezes', { entitas: K, pont: 5, szerep: 'aktiv', rendszer: ['menu/kereses'] }, KEZDET + 5000);
    const ures = await a.tesz('TudatpontRendezes', { entitas: K, pont: 5, szerep: 'aktiv', rendszer: [] }, KEZDET + 6000);
    const r = {
      jo: alakiHiba(pontK) === null, rossz: !!alakiHiba(rossz), ures: !!alakiHiba(ures),
      bejelentes: bejelentesHelyei(pontK).includes(KOINON_KULCS) && !bejelentesHelyei(pontK).includes(KEZIKONYV_GYOKER_AZONOSITO),
      darab: koinonHelyei(pontK).length === 1 && koinonHelyei(pontK)[0] === K,
      hetkoznapi: !bejelentesHelyei(esemenyek[3]).includes(KOINON_KULCS) && koinonHelyei(esemenyek[3]).length === 0
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify(r) + ')\n'); return false; }
    return true;
  });

// ===================================
// 4. A LÉTEZÉS ÉS A KOINON
// ===================================

proba('⭐⭐ D129 (①, MA4 (B), a koinon): a kézikönyv-entitás születés nélkül létezik (a felmenőivel), a koinon 1 passzív pontjával; a közösség pontjainak levétele után sem felejtődik el (a koinoné marad) — a hétköznapi gondolat igen; kézikönyv nélküli koinoban nincs',
  async () => {
    const { a, K, g, esemenyek } = await eset();
    const elotte = await allapotbol(esemenyek);
    const e = elotte.entitasok.get(K);
    const menu = elotte.entitasok.get(rendszerAzonosito('kezikonyv/menu'));
    const gyoker = elotte.entitasok.get(KEZIKONYV_GYOKER_AZONOSITO);
    const levesz = [
      await a.tesz('TudatpontRendezes', { entitas: K, pont: 0, szerep: 'aktiv', rendszer: [KERESES] }, KEZDET + 10000),
      await a.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 0, szerep: 'aktiv' }, KEZDET + 11000)
    ];
    const utana = await allapotbol([...esemenyek, ...levesz]);
    const regi = await eset({ kezikonyv: false });
    const regiAllapot = await allapotbol(regi.esemenyek);
    const koinon = (x) => x?.hozzajarulok?.get(KOINON);
    const r = {
      // a közösség 100 pontja és a koinon 1-e
      letezik: e?.rendszer === KERESES && e.osszesPont === 100 + KOINON_PONT && e.szerzo === null && e.cim === null
        && e.szulo === rendszerAzonosito('kezikonyv/menu') && koinon(e)?.pont === KOINON_PONT && koinon(e).szerep === 'passziv',
      felmenok: menu?.rendszer === 'kezikonyv/menu' && menu.szulo === KEZIKONYV_GYOKER_AZONOSITO && gyoker?.rendszer === KEZIKONYV_GYOKER
        && gyoker.szulo === null && menu.osszesPont === KOINON_PONT && koinon(gyoker)?.pont === KOINON_PONT,
      // ⭐ MA4 (B): a közösség pontjainak levétele után is megvan — a koinon pontjával (a D14 KIVÉTEL NÉLKÜL vonatkozik rá); a
      // hétköznapi gondolatot a D14 elfelejti
      marad: utana.entitasok.get(K)?.osszesPont === KOINON_PONT && utana.entitasok.has(rendszerAzonosito('kezikonyv/menu'))
        && !utana.entitasok.has(g.azonosito),
      regi: !regiAllapot.entitasok.has(regi.K) && !regiAllapot.entitasok.has(KEZIKONYV_GYOKER_AZONOSITO)
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify(r) + ')\n'); return false; }
    return true;
  });

// ===================================
// 5. AZ ÓVATOSABB ALAP-KÜSZÖB (MA8 (B))
// ===================================

proba('⭐⭐ D129 (①, MA8 (B)): a kézikönyv-entitás javaslata a kézikönyv óvatosabb alap-küszöbével dönt (≥ 3 nap) — a név elhagyásával sem kerülhető meg; a hétköznapi gondolaté a koinoé',
  async () => {
    const { a, K, g, esemenyek } = await eset();
    // ⛔ A név nélküli javaslat egy MÁSIK kézikönyv-entitásra mutat, amelynek a nevét csak a javaslattevő pont-eseménye hozza —
    // így a nevesített javaslat neve nem „segítheti ki”: a döntés a koino minden eseményéből ismeri fel.
    const RENDEZES = 'kezikonyv/menu/rendezes';
    const K2 = rendszerAzonosito(RENDEZES);
    const pontK2 = await a.tesz('TudatpontRendezes', { entitas: K2, pont: 30, szerep: 'aktiv', rendszer: [RENDEZES] }, KEZDET + 4000);
    const modosit = (entitas, rendszer) => a.tesz('Javaslat', { fajta: 'szerkesztesi', erintett: entitas, muvelet: 'Modositas',
      valtozas: { cim: 'Érthetőbb' }, indoklas: 'próba', ...(rendszer ? { rendszer } : {}) }, KEZDET + 20000);
    const jNevvel = await modosit(K, [KERESES]);
    const jNevNelkul = await modosit(K2, null);
    const jG = await modosit(g.azonosito, null);
    const szavazatok = [...await a.szavaz(jNevvel, { szavazat: 'Tamogat' }, KEZDET + 21000),
      ...await a.szavaz(jNevNelkul, { szavazat: 'Tamogat' }, KEZDET + 21000), ...await a.szavaz(jG, { szavazat: 'Tamogat' }, KEZDET + 21000)];
    const allapot = await allapotbol([...esemenyek, pontK2, jNevvel, jNevNelkul, jG, ...szavazatok]);
    const most = KEZDET + NAP;   // egy nap múlva: a hétköznapi már eldőlt, a kézikönyvé még nem
    const javaslatok = javaslatokSzamitasa(allapot.szamitok, allapot, most);
    const kNevvel = javaslatok.get(jNevvel.azonosito);
    const kNevNelkul = javaslatok.get(jNevNelkul.azonosito);
    const kG = javaslatok.get(jG.azonosito);
    const r = {
      nevvel: kNevvel?.kuszobok?.minimumDontesiIdo === 259200 && kNevvel.statusz !== kG?.statusz,
      nevNelkul: kNevNelkul?.kuszobok?.minimumDontesiIdo === 259200,
      hetkoznapi: kG?.kuszobok?.minimumDontesiIdo === ALAP_SZABALYOK.alapKuszobok.minimumDontesiIdo,
      // ⭐⭐ a koinon nem szavaz, és a részvétel nevezőjébe sem számít: az egyetlen e-ember szavazata teljes részvétel
      koinonNemSzavaz: kNevvel?.reszveteliEzrelek === 1000 && kNevvel.szavazok === 1
    };
    if (!Object.values(r).every(Boolean)) {
      process.stderr.write('    (' + JSON.stringify({ r, kNevvel: { k: kNevvel?.kuszobok, s: kNevvel?.statusz },
        kG: { k: kG?.kuszobok, s: kG?.statusz } }) + ')\n');
      return false;
    }
    return true;
  });

// ===================================
// 6. A VÁLLALÁS
// ===================================

// ⭐⭐ D130 (③e, KO5 (B)): a vállalás a kézikönyvet NEM tartja külön szeletként (eddig — D129 MA4 (B) — a gyökér-szeletét mindenki
// vállalta): a bejegyzések eseményei a koinon darabjaiban vannak — a darabomba esőket a koinon-darab cseréje hozza, és a tömörítés a
// koinon szabálya szerint tartja meg (a darabon belüli tartást a parancssor-próba méri). Rontás: a régi sor (a gyökér-szelet a
// vállalásban) → bukik.
proba('⭐⭐ D129 (①), D130 (③e): a vállalás a kézikönyvet nem tartja külön szeletként — a bejegyzéseit a koinon darabjai hordják',
  async () => {
    const v = vallalasSzamitasa([], { kezikonyv: true, kezikonyvBejegyzesek: [rendszerAzonosito('kezikonyv/menu')] });
    const r = {
      nemKulon: !v.szeletek.has(KEZIKONYV_GYOKER_AZONOSITO) && !v.szeletek.has(rendszerAzonosito('kezikonyv/menu'))
        && v.szeletek.size === 0 && !('kezikonyv' in v)
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify(r) + ')\n'); return false; }
    return true;
  });

// ===================================
// 7. ②a — A JAVASLATOK SZABÁLYAI (MA7 (A))
// ===================================

proba('⭐⭐ D129 (②a, MA7 (A)): kézikönyv-entitáson a törlés és az egyesítés nem indítható; áthelyezni csak kézikönyv-entitás alá lehet (a gyökérre és hétköznapi gondolat alá nem); a módosítás és a kézikönyvön belüli áthelyezés mehet',
  async () => {
    const { a, K, g, esemenyek } = await eset();
    const ABLAK = 'kezikonyv/ablak';
    const K2 = rendszerAzonosito(ABLAK);
    const pontK2 = await a.tesz('TudatpontRendezes', { entitas: K2, pont: 20, szerep: 'aktiv', rendszer: [ABLAK] }, KEZDET + 4000);
    const javasol = (erintettek, rendszer, ido) => a.tesz('Javaslat', { fajta: 'szerkesztesi', erintettek, indoklas: 'próba',
      ...(rendszer ? { rendszer } : {}) }, ido);
    const torol = await javasol([{ entitas: K, muvelet: 'Torles', valtozas: null }], [KERESES], KEZDET + 20000);
    const egyesit = await javasol([{ entitas: K, muvelet: 'Egyesites', valtozas: { cim: 'X' } },
      { entitas: g.azonosito, muvelet: 'Egyesites', valtozas: null }], [KERESES], KEZDET + 20001);
    const kiG = await javasol([{ entitas: K, muvelet: 'Athelyezes', valtozas: { szulo: g.azonosito } }], [KERESES], KEZDET + 20002);
    const kiGyoker = await javasol([{ entitas: K, muvelet: 'Athelyezes', valtozas: { szulo: null } }], [KERESES], KEZDET + 20003);
    const belul = await javasol([{ entitas: K, muvelet: 'Athelyezes', valtozas: { szulo: K2 } }], [KERESES, ABLAK], KEZDET + 20004);
    const modosit = await javasol([{ entitas: K, muvelet: 'Modositas', valtozas: { cim: 'Érthetőbb' } }], [KERESES], KEZDET + 20005);
    const allapot = await allapotbol([...esemenyek, pontK2, torol, egyesit, kiG, kiGyoker, belul, modosit]);
    const kiesett = new Map(allapot.kivetelek.map((k) => [k.azonosito, k.ok ?? k.indok ?? '']));
    const r = {
      torol: kiesett.has(torol.azonosito), egyesit: kiesett.has(egyesit.azonosito),
      kiG: kiesett.has(kiG.azonosito), kiGyoker: kiesett.has(kiGyoker.azonosito),
      belul: !kiesett.has(belul.azonosito), modosit: !kiesett.has(modosit.azonosito),
      uzenet: /kézikönyv/.test(JSON.stringify(allapot.kivetelek.find((k) => k.azonosito === torol.azonosito) ?? ''))
    };
    if (!Object.values(r).every(Boolean)) {
      process.stderr.write('    (' + JSON.stringify({ r, kivetelek: allapot.kivetelek.map((k) => JSON.stringify(k).slice(0, 160)) }) + ')\n');
      return false;
    }
    return true;
  });

proba('⭐⭐ D129 (②a): a kézikönyv-módosításnál a különváló kisebbség ága HÉTKÖZNAPI gondolat (nem kézikönyv), de megjegyzi, honnan vált ki — a lap az eredeti szöveget rajzolja',
  async () => {
    const { a, K, esemenyek } = await eset();
    const b = await ujEember();
    const c = await ujEember();
    const ertek = await a.tesz('ErtekJavaslat', { entitas: K, rendszer: [KERESES],
      ertekek: { elfogadasiKuszob: 51, reszveteliKuszob: 0, minimumDontesiIdo: 1, maximumDontesiIdo: 604800 } }, KEZDET + 4000);
    const pontB = await b.tesz('TudatpontRendezes', { entitas: K, pont: 40, szerep: 'aktiv', rendszer: [KERESES] }, KEZDET + 4000);
    const pontC = await c.tesz('TudatpontRendezes', { entitas: K, pont: 10, szerep: 'aktiv', rendszer: [KERESES] }, KEZDET + 4000);
    const j = await a.tesz('Javaslat', { fajta: 'szerkesztesi', rendszer: [KERESES],
      erintettek: [{ entitas: K, muvelet: 'Modositas', valtozas: { cim: 'ÚJ CÍM' } }] }, KEZDET + 5000);
    const sz = [...await a.szavaz(j, { szavazat: 'Tamogat', kulonvalasIgeny: false }, KEZDET + 6000),
      ...await b.szavaz(j, { szavazat: 'Tamogat', kulonvalasIgeny: false }, KEZDET + 6000),
      ...await c.szavaz(j, { szavazat: 'Ellenez', kulonvalasIgeny: true }, KEZDET + 6000)];
    const allapot = await allapotbol([...esemenyek, ertek, pontB, pontC, j, ...sz]);
    const javaslatok = javaslatokSzamitasa(allapot.szamitok, allapot, KEZDET + 8 * NAP);
    const v = await szerkesztesiEgyezmenyekAlkalmazasa(allapot, javaslatok);
    const fo = allapot.entitasok.get(K);
    const ag = [...allapot.entitasok.values()].find((e) => e.rendszerbol === KERESES);
    const r = {
      elfogadva: javaslatok.get(j.azonosito)?.statusz === 'elfogadva' && (v?.kulonvalasok?.length ?? 0) === 1,
      fo: fo?.rendszer === KERESES && fo.cim === 'ÚJ CÍM',
      ag: !!ag && ag.rendszer === undefined && ag.cim === null && ag.hozzajarulok.has(c.szerzo),
      // a lap az ágnak az eredeti (program) szövegét rajzolja, a főágnak a közösségét
      szoveg: kezikonyvSzovege(ag ?? {}, alapTartalomIndexe(probaTartalom('A keresés'))).cim === 'A keresés'
        && kezikonyvSzovege(fo ?? {}, alapTartalomIndexe(probaTartalom('A keresés'))).cim === 'ÚJ CÍM'
    };
    if (!Object.values(r).every(Boolean)) {
      process.stderr.write('    (' + JSON.stringify({ r, statusz: javaslatok.get(j.azonosito)?.statusz, kv: v?.kulonvalasok,
        ag: ag && { cim: ag.cim, rendszer: ag.rendszer, rendszerbol: ag.rendszerbol } }) + ')\n');
      return false;
    }
    return true;
  });

// ===================================
// 8. AZ ALAP-TARTALOM ÉS A MEGJELENÍTETT SZÖVEG
// ===================================

/** Egy próba-alap-tartalom: a gyökér, a menü és a keresés (a keresés címe megadható — „egy újabb program”). */
function probaTartalom(keresesCime, keresesSzovege = 'Így keresel.') {
  return { fajta: ALAP_TARTALOM_FAJTA, bejegyzesek: [
    { nev: 'kezikonyv', cim: 'Kézikönyv', szoveg: 'A gyökér.' },
    { nev: 'kezikonyv/menu', cim: 'Menü', szoveg: 'A menü.' },
    { nev: KERESES, cim: keresesCime, szoveg: keresesSzovege }
  ] };
}

proba('⭐⭐ D129 (②): az alap-tartalom alakja (a program fájlja érvényes; a hibásat a betöltő nem fogadja); a megjelenített szöveg mezőnként a közösségé, ha módosította, különben a programé',
  async () => {
    const jo = probaTartalom('A keresés');
    const hibak = [
      { ...jo, fajta: 'mas' },
      { ...jo, bejegyzesek: jo.bejegyzesek.slice(1) },                               // a gyökér nélkül
      { ...jo, bejegyzesek: [jo.bejegyzesek[0], jo.bejegyzesek[2], jo.bejegyzesek[1]] },   // a szülő később
      { ...jo, bejegyzesek: [...jo.bejegyzesek, jo.bejegyzesek[2]] },                // kétszer
      { ...jo, bejegyzesek: [...jo.bejegyzesek, { nev: 'kezikonyv/menu/x', cim: '', szoveg: '' }] },
      { ...jo, bejegyzesek: [...jo.bejegyzesek, { nev: 'menu/x', cim: 'x', szoveg: '' }] }
    ];
    const index = alapTartalomIndexe(jo);
    const program = programAlapTartalma();
    const sz1 = kezikonyvSzovege({ rendszer: KERESES, cim: null, szoveg: null }, index);
    const sz2 = kezikonyvSzovege({ rendszer: KERESES, cim: 'Saját', szoveg: null }, index);
    const sz3 = kezikonyvSzovege({ rendszer: 'kezikonyv/nincs', cim: null, szoveg: null }, index);
    const r = {
      jo: alapTartalomAlakiHibaja(jo) === null, hibak: hibak.every((t) => !!alapTartalomAlakiHibaja(t)),
      program: program.bejegyzesek[0].nev === KEZIKONYV_GYOKER && program.bejegyzesek.length >= 7
        && program.nevSzerint.get(KEZIKONYV_GYOKER).azonosito === KEZIKONYV_GYOKER_AZONOSITO,
      index: index.azonositoSzerint.get(rendszerAzonosito(KERESES))?.nev === KERESES
        && index.nevSzerint.get(KERESES).lenyomat === bejegyzesLenyomata({ cim: 'A keresés', szoveg: 'Így keresel.' }),
      programe: sz1.cim === 'A keresés' && sz1.szoveg === 'Így keresel.' && !sz1.modositott && sz1.ismert,
      kozossege: sz2.cim === 'Saját' && sz2.szoveg === 'Így keresel.' && sz2.modositott,
      ismeretlen: sz3.cim === null && !sz3.ismert
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify(r) + ')\n'); return false; }
    return true;
  });

// ===================================
// 9. ②c — AZ ÚJ PROGRAMVERZIÓ (MA5 (A))
// ===================================

proba('⭐⭐ D129 (②c, MA5 (A)): a program által megírt javaslat — ahol a közösség módosított, és a program azóta mást mond, a program felkínálja a mai szövegét; ahol nem változott, vagy ahol a közösség nem módosított, nem',
  async () => {
    const regi = alapTartalomIndexe(probaTartalom('A keresés'));
    const uj = alapTartalomIndexe(probaTartalom('A keresés (a 🔍 gomb)'));
    const K = rendszerAzonosito(KERESES);
    const M = rendszerAzonosito('kezikonyv/menu');
    const j = { azonosito: 'J', tipus: 'Javaslat', adat: { alapLenyomatok: { [KERESES]: regi.nevSzerint.get(KERESES).lenyomat } } };
    const javaslatok = new Map([['J', { statusz: 'elfogadva', lezarasIdeje: 5, reszek: [{ entitas: K, muvelet: 'Modositas' }] }]]);
    const allapot = { entitasok: new Map([
      [K, { azonosito: K, rendszer: KERESES, cim: 'Közösségi', szoveg: null }],
      [M, { azonosito: M, rendszer: 'kezikonyv/menu', cim: null, szoveg: null }]
    ]) };
    const esemenyek = new Map([['J', j]]);
    const ujban = programJavaslatai({ allapot, javaslatok, esemenyek, index: uj });
    const regiben = programJavaslatai({ allapot, javaslatok, esemenyek, index: regi });
    const megjegyzesNelkul = programJavaslatai({ allapot, javaslatok,
      esemenyek: new Map([['J', { ...j, adat: {} }]]), index: uj });
    const r = {
      ujban: ujban.length === 1 && ujban[0].nev === KERESES && ujban[0].cim === 'A keresés (a 🔍 gomb)',
      regiben: regiben.length === 0, megjegyzesNelkul: megjegyzesNelkul.length === 0
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify({ r, ujban }) + ')\n'); return false; }
    return true;
  });

// ===================================
// 10. ③ — A KÉZIKÖNYV A PAKLIBAN ÉS AZ ⓘ HELYEI
// ===================================

proba('⭐⭐ D129 (③, MA6 (A)): a kézikönyv a pakli képében — a meg nem érintett bejegyzések virtuálisan (a program szövegével), a megérintettek a megjelenítendő szöveggel és a forrásuk jelével; a különvált ág az eredeti szöveggel',
  async () => {
    const index = alapTartalomIndexe(probaTartalom('A keresés'));
    const K = rendszerAzonosito(KERESES);
    const M = rendszerAzonosito('kezikonyv/menu');
    const G = 'x'.repeat(43);
    const entitasok = new Map([
      [M, { azonosito: M, rendszer: 'kezikonyv/menu', cim: 'Közösségi menü', szoveg: null, szulo: KEZIKONYV_GYOKER_AZONOSITO }],
      [G, { azonosito: G, rendszerbol: KERESES, cim: null, szoveg: null, szulo: M }],
      ['h'.repeat(43), { azonosito: 'h'.repeat(43), cim: 'Hétköznapi', szoveg: null, szulo: null }]
    ]);
    const uj = kezikonyvKepbe(entitasok, index);
    const k = entitasok.get(K);
    const m = entitasok.get(M);
    const g = entitasok.get(G);
    // ⭐ D129 (④b): a képben a sima szöveg bekezdésenkénti blokk (`bekezdesBlokkok`) — itt a blokkok tartalmát olvassuk vissza
    const blokkSzovege = (sz) => (Array.isArray(sz) && sz.every((b) => b.tipus === 'szoveg') ? sz.map((b) => b.tartalom).join('\n\n') : null);
    const r = {
      uj: uj === 2 && entitasok.has(KEZIKONYV_GYOKER_AZONOSITO) && entitasok.get(KEZIKONYV_GYOKER_AZONOSITO).szulo === null,
      virtualis: k?.virtualis === true && k.cim === 'A keresés' && k.szulo === M && k.osszesPont === KOINON_PONT
        && k.hozzajarulok.get(KOINON)?.szerep === 'passziv' && k.kezikonyv?.forras === 'program'
        && k.hozzajarulok instanceof Map && blokkSzovege(k.szoveg) === 'Így keresel.',
      modositott: m.cim === 'Közösségi menü' && blokkSzovege(m.szoveg) === 'A menü.' && m.kezikonyv?.forras === 'kozosseg',
      ag: g.cim === 'A keresés' && blokkSzovege(g.szoveg) === 'Így keresel.',
      hetkoznapi: entitasok.get('h'.repeat(43)).kezikonyv === undefined
    };
    if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify({ r, uj }) + ')\n'); return false; }
    return true;
  });

proba('⭐⭐ D129 (④b): a szöveg a kártya alakjában — a sima szöveg bekezdésenként egy blokk (a jelei kódolva, a sortörés <br>), a blokk és a hivatkozás változatlan; a buborék a közösség darabban tartott szövegét feloldja, és ha nincs meg, kimondja',
  async () => {
    // ----- a bekezdések -----
    const bl = bekezdesBlokkok('Első & <b>"\'.\nmég\n\n  Második  \n \n');
    const tomb = [{ id: 'b1', tipus: 'szoveg', tartalom: 'x' }];
    const hiv = { lenyomat: 'l'.repeat(43), bajt: 10 };
    const bekezdes = bl.length === 2 && bl.every((b) => b.tipus === 'szoveg') && bl[0].id !== bl[1].id
      && bl[0].tartalom === 'Első &amp; &lt;b&gt;&quot;&#39;.<br>még' && bl[1].tartalom === 'Második'
      && bekezdesBlokkok(tomb) === tomb && bekezdesBlokkok(hiv) === hiv && bekezdesBlokkok(null) === null;
    // ----- a buborék: a program szövege blokkokban; a közösség darabban tartott szövege feloldva -----
    const mappa = await mkdtemp(join(tmpdir(), 'koino-kezikonyv-'));
    try {
      const tar = await esemenyTarNyitasa('kb', mappa);
      const a = await ujEember('kb');
      const K = rendszerAzonosito(KERESES);
      const szuletes = await a.tesz('KoinoLetrehozas', { nev: 'Buborék', leiras: null, alapitok: [], zart: true,
        szabalyok: teljesSzabalyok() }, KEZDET);
      const ertek = await a.tesz('ErtekJavaslat', { entitas: K, rendszer: [KERESES],
        ertekek: { elfogadasiKuszob: 51, reszveteliKuszob: 0, minimumDontesiIdo: 1, maximumDontesiIdo: 604800 } }, KEZDET + 1000);
      const pont = await a.tesz('TudatpontRendezes', { entitas: K, pont: 50, szerep: 'aktiv', rendszer: [KERESES] }, KEZDET + 1000);
      const kozossegi = [{ id: 'k1', tipus: 'szoveg', tartalom: '<b>Közösségi</b> szöveg', formatas: { felkover: false, dolt: false, meret: 'kozepes' } }];
      const { hivatkozas, bajtok } = await szovegDarabra(kozossegi);
      const j = await a.tesz('Javaslat', { fajta: 'szerkesztesi', rendszer: [KERESES],
        erintettek: [{ entitas: K, muvelet: 'Modositas', valtozas: { szoveg: hivatkozas } }] }, KEZDET + 2000);
      const sz = await a.szavaz(j, { szavazat: 'Tamogat', kulonvalasIgeny: false }, KEZDET + 3000);
      for (const e of [szuletes, ertek, pont, j, ...sz]) await esemenyMentese(tar, e);
      const kerdes = (nev, darabOlvas) => kezikonyvBejegyzese(tar, 'kb', { nev, most: KEZDET + 8 * NAP, darabOlvas,
        nezet: ujPakliNezet({ tartott: async () => new Set([K]) }) });
      const megvan = await kerdes(KERESES, async (l) => (l === hivatkozas.lenyomat ? bajtok : null));
      const nincsMeg = await kerdes(KERESES, async () => null);
      const program = await kerdes('kezikonyv/also-sav', undefined);
      const programSzovege = programAlapTartalma().nevSzerint.get('kezikonyv/also-sav').szoveg;
      // a darab kanonikus alakban áll (a kulcsok rendezve) — a tartalmat vetjük össze, nem a kulcsok sorrendjét
      const rendezve = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([p], [q]) => (p < q ? -1 : 1))) : v));
      const r = {
        bekezdes,
        megvan: megvan?.forras === 'kozosseg' && rendezve(megvan.szoveg) === rendezve(kozossegi) && !megvan.szovegHianyzik,
        nincsMeg: nincsMeg?.szoveg === null && nincsMeg.szovegHianyzik === true,
        program: program?.forras === 'program' && Array.isArray(program.szoveg)
          && program.szoveg.length === programSzovege.split(/\n\s*\n/).filter((p) => p.trim()).length && program.szovegHianyzik === undefined
      };
      if (!Object.values(r).every(Boolean)) {
        process.stderr.write('    (' + JSON.stringify({ r, bl, megvan: megvan && { forras: megvan.forras, szoveg: megvan.szoveg },
          nincsMeg: nincsMeg && { szoveg: nincsMeg.szoveg, h: nincsMeg.szovegHianyzik } }) + ')\n');
        return false;
      }
      return true;
    } finally {
      await rm(mappa, { recursive: true, force: true });
    }
  });

proba('⭐⭐ D129 (③): az alsó sáv számai — a kézikönyv nem gondolat (a „📄” nem számolja), és nem ismert rész a gyökérnél (a „🔭 még nem ismert” a tartó bemondásából a kézikönyv nélkül számol)',
  async () => {
    const mappa = await mkdtemp(join(tmpdir(), 'koino-kezikonyv-'));
    try {
      const tar = await esemenyTarNyitasa('kk', mappa);
      const alapito = await ujEember('kk');
      const szuletes = await alapito.tesz('KoinoLetrehozas', { nev: 'Számok', leiras: null, alapitok: [], zart: true,
        szabalyok: teljesSzabalyok() }, KEZDET);
      const g = await alapito.tesz('GondolatLetrehozas', { cim: 'Egy gondolat', meret: 10 }, KEZDET + 1000);
      const p = await alapito.tesz('TudatpontRendezes', { entitas: g.azonosito, pont: 50 }, KEZDET + 1000);
      for (const e of [szuletes, g, p]) await esemenyMentese(tar, e);
      // a gyökér tartója szerint a gyökér alatt 3 entitás van (ebből 1-et ismerek) — a kézikönyv nem része
      const st = await helyiStatisztika(tar, 'kk', { nezet: ujPakliNezet({ tartott: async () => new Set([g.azonosito]) }),
        fejlecTudas: new Map([[GYOKER_KULCS, { gy: 3, ad: 3 }]]) });
      const r = { gondolat: st.gondolatokSzama === 1, ismeretlen: st.ismeretlenSzama === 2 };
      if (!Object.values(r).every(Boolean)) { process.stderr.write('    (' + JSON.stringify({ r, st }) + ')\n'); return false; }
      return true;
    } finally {
      await rm(mappa, { recursive: true, force: true });
    }
  });

proba('⭐⭐ D129 (③): a felület minden ⓘ-helyének neve szerepel a program alap-tartalmában (különben a buborék „nincs magyarázat”-ot mondana)',
  async () => {
    const forras = await readFile(new URL('../felulet/js/koinoMagyarazat.js', import.meta.url), 'utf8');
    const kezdet = forras.indexOf('export const MAGYARAZAT_HELYEK');
    const helyek = forras.slice(kezdet, forras.indexOf(']);', kezdet));
    // a `nev: '…'` alakú bejegyzések, és a menüpontok (`menuPont('<felirat>', '<név vége>')` → `kezikonyv/menu/<név vége>`; a
    // kártya menüjéé — ⭐ D129 (④b) — `kartyaMenuPont(…)` → `kezikonyv/kartya/menu/<név vége>`; a kettő nem keveredhet)
    // ⛔ az előtagot a segédfüggvény SAJÁT soráról olvassuk (nem a próba mondja meg) — különben egy elírt előtag átcsúszna
    const elotag = (fv) => forras.match(new RegExp('const ' + fv + ' = [^;]*?nev: \'([^\']+)\' \\+ nev'))?.[1] ?? '(nincs)';
    const nevek = [...[...helyek.matchAll(/nev: '([^']+)'/g)].map((m) => m[1]),
      ...[...helyek.matchAll(/(?<![A-Za-z])menuPont\('[^']*', '([^']+)'\)/g)].map((m) => elotag('menuPont') + m[1]),
      ...[...helyek.matchAll(/kartyaMenuPont\('[^']*', '([^']+)'\)/g)].map((m) => elotag('kartyaMenuPont') + m[1])];
    if (!nevek.includes('kezikonyv/kartya/menu/javaslat') || !nevek.includes('kezikonyv/menu/kereses')) {
      process.stderr.write('    (a két menü-alak közül valamelyiket nem olvasta a próba)\n');
      return false;
    }
    const alap = programAlapTartalma();
    const hianyzik = nevek.filter((n) => !alap.nevSzerint.has(n));
    if (nevek.length < 5 || hianyzik.length) { process.stderr.write('    (' + JSON.stringify({ nevek, hianyzik }) + ')\n'); return false; }
    return true;
  });

export default async function (csendes) {
  return futtatas(csendes);
}
