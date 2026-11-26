// meres/esemenyProba.js — az esemény-réteg önpróbája (Szakasz 1 / 3. lépés)
//
// Azt bizonyítja, hogy egy esemény hamisíthatatlan: bármit írunk át benne, az ellenőrzés
// bukik — és hogy a kettős cselekvés leleplezhető.

import {
  esemenyLetrehozasa, esemenyEllenorzese, elagazasE, bejelentesHelyei, esemenyKoinoja, koinoSzuleteseE, koinoSzuleteseListabol
} from '../js/esemeny/esemeny.js';
import { probaGyujtemeny, tesztKeszulek } from './probaFuttato.js';
import { koinoSzabalyai, ALAP_SZABALYOK, teljesSzabalyok, szabalyokAlakiHibaja } from '../js/esemeny/koinoSzabalyok.js';
import { KOINON_PELDANY } from '../js/csere/cimjegyzek.js';   // ⭐⭐ D130 (③f): a címjegyzék alapértéke a koino szabályaiból

const { proba, futtatas } = probaGyujtemeny('Az aláírt esemény próbája');

// Két külön kulcspár: egy „sajátunk" és egy „idegen", a hamisítás próbájához
const kulcspar = await tesztKeszulek();
const idegenKulcspar = await tesztKeszulek();

// Egy minta-esemény, amivel a legtöbb próba dolgozik
const alapLeiras = {
  koino: 'proba-koino',
  tipus: 'GondolatLetrehozas',
  adat: { cim: 'Az első gondolat', szoveg: 'Árvíztűrő tükörfúrógép' },
  elozo: null,
  sorszam: 1
};
const esemeny = await esemenyLetrehozasa(alapLeiras, kulcspar);

/** Segéd: egy nyilvános kulcs szöveges alakja. */
async function szerzoje(kp) {
  const nyers = await crypto.subtle.exportKey('raw', kp.publicKey);
  let sz = ''; for (const b of new Uint8Array(nyers)) sz += String.fromCharCode(b);
  return btoa(sz).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ===== A HELYES ESET =====

// ⭐⭐ D85/1, D85/3 (2026-10-02): HOVA JELENTJÜK BE AZ ESEMÉNYT a saját szeletén kívül — a születést a
// szülőnél, a javaslatot MINDEN érintettjénél, a szavazatot a jogának bizonyítéka szerint (és csak a
// lánc-gyökeres szavazatét: azt ellenőrzi a kapu). Csak azonosító alakú kulcs, és a saját szelet nem.
proba('⭐⭐ D85: a BEJELENTÉS HELYEI — születés a szülőnél, javaslat minden érintettnél, szavazat a bizonyítékánál',
  async () => {
    const [A, B, J, T, S] = ['A', 'B', 'J', 'T', 'S'].map((b) => b.repeat(43));
    const egyenlo = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    const gyoker = bejelentesHelyei({ tipus: 'GondolatLetrehozas', azonosito: A, entitas: null, adat: { cim: 'x' } });
    const gyerek = bejelentesHelyei({ tipus: 'GondolatLetrehozas', azonosito: B, entitas: null, adat: { szulo: A } });
    const javaslat = bejelentesHelyei({ tipus: 'Javaslat', azonosito: J, entitas: null,
      adat: { erintettek: [{ entitas: B }, { entitas: A }, { entitas: A }, { entitas: 'nem-azonosito' }] } });
    const regiJavaslat = bejelentesHelyei({ tipus: 'Javaslat', azonosito: J, entitas: null, adat: { erintett: A } });
    const bizonyitek = { [A]: {}, [J]: {}, [T]: {}, rossz: {} };
    const szavazat = bejelentesHelyei({ tipus: 'Szavazat', azonosito: S, entitas: J, lancGyoker: { naplo: {}, kiosztas: {} },
      adat: { javaslat: J, bizonyitek } });
    const gyokerNelkul = bejelentesHelyei({ tipus: 'Szavazat', azonosito: S, entitas: J, lancGyoker: null,
      adat: { javaslat: J, bizonyitek } });
    const pont = bejelentesHelyei({ tipus: 'TudatpontRendezes', azonosito: S, entitas: A, adat: { entitas: A } });
    return egyenlo(gyoker, ['']) && egyenlo(gyerek, [A])
      && egyenlo(javaslat, [A, B].sort())            // ismétlés és nem-azonosító nélkül
      && egyenlo(regiJavaslat, [A])                  // a régi (egy-érintettes) alak is
      && egyenlo(szavazat, [A, T].sort())            // a saját szelete (J) és a „rossz" kulcs nélkül
      && gyokerNelkul.length === 0                   // ⛔ gyökér nélkül a bizonyíték nem jelent be
      && pont.length === 0;
  });

proba('A frissen létrehozott esemény ellenőrzése RENDBEN', async () => {
  const e = await esemenyEllenorzese(esemeny);
  return e.rendben === true;
});

// ===== HAMISÍTÁSI KÍSÉRLETEK — mindegyiknek BUKNIA kell =====

proba('A GONDOLAT átírása bukik', async () => {
  const hamis = { ...esemeny, adat: { ...esemeny.adat, cim: 'Átírt cím' } };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

proba('A SZERZŐ átírása bukik (más nevében nem lehet aláírni)', async () => {
  const hamis = { ...esemeny, szerzo: await szerzoje(idegenKulcspar) };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

proba('Az IDŐ átírása bukik', async () => {
  const hamis = { ...esemeny, ido: esemeny.ido + 1 };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

proba('A SORSZÁM átírása bukik', async () => {
  const hamis = { ...esemeny, sorszam: 99 };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

proba('Az AZONOSÍTÓ meghamisítása bukik', async () => {
  const hamis = { ...esemeny, azonosito: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

proba('Az ALÁÍRÁS egyetlen karakterének átírása bukik', async () => {
  const elso = esemeny.alairas[0] === 'A' ? 'B' : 'A';
  const hamis = { ...esemeny, alairas: elso + esemeny.alairas.slice(1) };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

proba('IDEGEN kulccsal aláírt, de a mi nevünkre írt esemény bukik', async () => {
  // A támadó a saját kulcsával ír alá, de a `szerzo` mezőbe a MI kulcsunkat teszi
  const idegenEsemeny = await esemenyLetrehozasa(alapLeiras, idegenKulcspar);
  const hamis = { ...idegenEsemeny, szerzo: await szerzoje(kulcspar) };
  return (await esemenyEllenorzese(hamis)).rendben === false;
});

// ===== A SAJÁT LÁNC =====

proba('A lánc FOLYTATÁSA nem ellentmondás (a szavazat módosítható)', async () => {
  const masodik = await esemenyLetrehozasa(
    { ...alapLeiras, sorszam: 2, elozo: esemeny.azonosito, adat: { cim: 'Második' } },
    kulcspar
  );
  return elagazasE(esemeny, masodik) === false;
});

proba('A lánc ELÁGAZÁSA ellentmondás (kettős cselekvés lelepleződik)', async () => {
  // Ugyanaz a szerző, ugyanaz a sorszám, MÁS gondolat → két aláírás ugyanarról a pontról
  const masik = await esemenyLetrehozasa(
    { ...alapLeiras, adat: { cim: 'Titokban másik' } },
    kulcspar
  );
  const mindketto = (await esemenyEllenorzese(esemeny)).rendben
                 && (await esemenyEllenorzese(masik)).rendben;
  // A LÉNYEG: mindkettő ÉRVÉNYES aláírás — épp ezért bizonyítják együtt a csalást
  return mindketto && elagazasE(esemeny, masik) === true;
});

proba('Két KÜLÖNBÖZŐ ember azonos sorszáma nem elágazás', async () => {
  const masikEmbere = await esemenyLetrehozasa(alapLeiras, idegenKulcspar);
  return elagazasE(esemeny, masikEmbere) === false;
});

// ===== A SZIGORÍTÁS ÉRVÉNYESÜL =====

proba('TÖRT szám az adatban már a létrehozáskor hibát dob', async () => {
  try {
    await esemenyLetrehozasa({ ...alapLeiras, adat: { arany: 66.7 } }, kulcspar);
    return false;
  } catch (h) { return h.message.includes('EGÉSZ'); }
});

// ⛔⛔ D77 (2026-09-27, Csaba — az átnézés mérése nyomán): az `entitas` és a születés `szulo`-ja
// SZELET-KULCS, amit a csere a vonalon kimond — ezért csak azonosító alakú (43 base64url jel) vagy
// null lehet. Előtte bármilyen szöveg átjutott, és egyetlen ilyen esemény a társsal folytatott
// minden cserét megakasztotta (a csere próbája: `csereProba.js`, „KI NEM MONDHATÓ”).
// ⚠️ Mindkét próba a HELYES alakot is beengedi — különben egy mindent elutasító kapu is átmenne.

proba('⛔⛔ D77: a nem azonosító alakú ENTITAS-t a kapu elutasítja — az azonosító alakút beengedi', async () => {
  const rossz = ['x', '', 'a'.repeat(42), 'a'.repeat(44), 'a'.repeat(42) + '/', 'a'.repeat(42) + '='];
  for (const entitas of rossz) {
    const e = await esemenyLetrehozasa(
      { ...alapLeiras, tipus: 'TudatpontRendezes', adat: { pont: 1 }, entitas }, kulcspar);
    const ered = await esemenyEllenorzese(e);
    if (ered.rendben || !ered.ok.includes('entitas')) return false;
  }
  const jo = await esemenyLetrehozasa(
    { ...alapLeiras, tipus: 'TudatpontRendezes', adat: { pont: 1 }, entitas: esemeny.azonosito }, kulcspar);
  return (await esemenyEllenorzese(jo)).rendben === true;
});

proba('⛔⛔ D77: a gondolat nem azonosító alakú SZULO-ját a kapu elutasítja — a null és az azonosító mehet', async () => {
  for (const szulo of ['x', '', 5, 'a'.repeat(44)]) {
    const e = await esemenyLetrehozasa({ ...alapLeiras, adat: { ...alapLeiras.adat, szulo } }, kulcspar);
    const ered = await esemenyEllenorzese(e);
    if (ered.rendben || !ered.ok.includes('szulo')) return false;
  }
  for (const szulo of [null, esemeny.azonosito]) {
    const e = await esemenyLetrehozasa({ ...alapLeiras, adat: { ...alapLeiras.adat, szulo } }, kulcspar);
    if (!(await esemenyEllenorzese(e)).rendben) return false;
  }
  // ⭐ Csak a SZÜLETÉSRE vonatkozik: más típus `szulo`-ja (pl. a kategória-fa) nem szelet-kulcs.
  const kategoria = await esemenyLetrehozasa(
    { ...alapLeiras, tipus: 'KategoriaLetrehozas', adat: { nev: 'K', szulo: 'x' } }, kulcspar);
  return (await esemenyEllenorzese(kategoria)).rendben === true;
});

// ===== ⭐⭐ D118/2: A KOINO NEVE A SZÜLETÉSE LENYOMATA =====
//
// A lelet (2026-10-24, `docs/koltozes_atvizsgalas.md` 3.): a szabad koino-név mellett egy második, azonos nevű születés
// átvette az alapító helyét. Az új alakban a születés koino-mezője üres, és a koino neve a születés azonosítója.

const szuletesLeiras = {
  koino: '', tipus: 'KoinoLetrehozas', adat: { nev: 'Új alakú', leiras: null, alapitok: [], zart: true },
  elozo: null, sorszam: 1
};

proba('⭐⭐ D118/2: az új alakú születés koinoja a SAJÁT lenyomata — minden más eseményé a koino-mezője', async () => {
  const sz = await esemenyLetrehozasa(szuletesLeiras, kulcspar);
  const tovabb = await esemenyLetrehozasa({ ...alapLeiras, koino: sz.azonosito, elozo: sz.azonosito, sorszam: 2 }, kulcspar);
  const regi = await esemenyLetrehozasa({ ...szuletesLeiras, koino: 'regi-nev' }, kulcspar);
  return (await esemenyEllenorzese(sz)).rendben === true && esemenyKoinoja(sz) === sz.azonosito
    && esemenyKoinoja(tovabb) === sz.azonosito && esemenyKoinoja(esemeny) === 'proba-koino'
    && esemenyKoinoja(regi) === 'regi-nev' && esemenyKoinoja(null) === undefined;
});

proba('⛔⛔ D118/2: a kapu elutasítja a lenyomat-nevet mondó születést és az üres koino-nevű nem-születést — a két jó alakot beengedi',
  async () => {
    const sz = await esemenyLetrehozasa(szuletesLeiras, kulcspar);
    const hamis = await esemenyLetrehozasa({ ...szuletesLeiras, koino: sz.azonosito }, idegenKulcspar);
    const uresGondolat = await esemenyLetrehozasa({ ...alapLeiras, koino: '' }, kulcspar);
    const h = await esemenyEllenorzese(hamis);
    const u = await esemenyEllenorzese(uresGondolat);
    // ⚠️ A helyes alakokat beengedi (különben egy mindent elutasító kapu is átmenne): az új és a régi alakú születést.
    const regi = await esemenyLetrehozasa({ ...szuletesLeiras, koino: 'regi-nev' }, kulcspar);
    return !h.rendben && /születés/.test(h.ok) && !u.rendben && /üres koino-név/.test(u.ok)
      && (await esemenyEllenorzese(sz)).rendben === true && (await esemenyEllenorzese(regi)).rendben === true;
  });

proba('⭐⭐ D118/2: a koino születése EGY szabállyal — lenyomat-nevű koinonál csak az, aminek az azonosítója maga a név',
  async () => {
    const valodi = await esemenyLetrehozasa(szuletesLeiras, kulcspar);
    const K = valodi.azonosito;
    // Egy másik új alakú születés (másik koino), és egy régi alakú, ami a K nevet mondja (a kapu elvetné — egy lista
    // mégis tartalmazhatja).
    const masik = await esemenyLetrehozasa({ ...szuletesLeiras, adat: { ...szuletesLeiras.adat, nev: 'Másik' } }, idegenKulcspar);
    const hamis = await esemenyLetrehozasa({ ...szuletesLeiras, koino: K, adat: { ...szuletesLeiras.adat, nev: 'Hamis' } },
      idegenKulcspar);
    for (const sor of [[valodi, masik, hamis], [hamis, masik, valodi], [masik, hamis, valodi]]) {
      if (koinoSzuleteseListabol(sor, K) !== valodi) return false;
    }
    if (!koinoSzuleteseE(valodi, K) || koinoSzuleteseE(hamis, K) || koinoSzuleteseE(masik, K)) return false;
    // ⭐ A régi alak (szabad név — csak a próbák): több is lehet, és MINDIG a legkisebb azonosító, a sorrendtől függetlenül.
    const r1 = await esemenyLetrehozasa({ ...szuletesLeiras, koino: 'regi' }, kulcspar);
    const r2 = await esemenyLetrehozasa({ ...szuletesLeiras, koino: 'regi' }, idegenKulcspar);
    const kisebb = r1.azonosito < r2.azonosito ? r1 : r2;
    return koinoSzuleteseListabol([r1, r2], 'regi') === kisebb && koinoSzuleteseListabol([r2, r1], 'regi') === kisebb
      // Koino nélkül az új alakú elöl; a lenyomat-nevet mondó (hamis) soha.
      && koinoSzuleteseListabol([r1, valodi, r2]) === valodi && koinoSzuleteseListabol([hamis]) === null;
  });

// ===== ⭐⭐ D118/2 (①b): A KOINO SZABÁLYAI A SZÜLETÉSBEN — a mező alakja a kapun =====
//
// A születés `szabalyok` mezője az állapotot befolyásoló számokat hordozza (`koinoSzabalyok.js`). A kapu csak ismert
// kulcsot enged, egész számot a határokon belül — különben egy hibás születés minden készüléken mást számolna (a
// keretet túllépő szám a kanonikus alak „biztonságos egész” kivételét is áttörné, D106).

proba('⭐⭐ D118/2 (①b): a születés szabályai a kapun — a jó alakot beengedi, az ismeretlen kulcsot, a határon kívülit, a nem számot és a fordított döntési időt elveti',
  async () => {
    const szuletesSzabalyokkal = (szabalyok) => esemenyLetrehozasa(
      { ...szuletesLeiras, adat: { ...szuletesLeiras.adat, szabalyok } }, kulcspar);
    const jok = [
      { tudatpontKeret: 500 },
      { tudatpontKeret: 10000, kategoriaKorlat: 0, tanusitasKell: 1, felhatalmazasKell: 1000 },
      { alapKuszobok: { elfogadasiKuszob: 66, reszveteliKuszob: 10 } },
      { alapKuszobok: { minimumDontesiIdo: 3600, maximumDontesiIdo: 3600 } }
    ];
    const rosszak = [
      [{ meghivoKell: 2 }, /ismeretlen szabály/],                  // ⛔ a meghívó-szám nem paraméter (Csaba, 2026-10-24)
      [{ tudatpontKeret: 10001 }, /határon kívül/],                // a D106 kivétele a mai keretre van levezetve
      [{ tudatpontKeret: 0 }, /határon kívül/],
      [{ kategoriaKorlat: 17 }, /határon kívül/],              // (a tört számot már a kanonikus alak sem írja alá)
      [{ tanusitasKell: '3' }, /határon kívül/],
      [{ alapKuszobok: { elfogadasiKuszob: 101 } }, /küszöb a határon kívül/],
      [{ alapKuszobok: { kuszob: 51 } }, /ismeretlen küszöb/],
      [{ alapKuszobok: { minimumDontesiIdo: 700000 } }, /legkisebb döntési idő/],   // a mai legnagyobb 604 800
      [[500], /objektum/]
    ];
    for (const sz of jok) {
      const e = await szuletesSzabalyokkal(sz);
      if ((await esemenyEllenorzese(e)).rendben !== true) return false;
    }
    for (const [sz, minta] of rosszak) {
      const v = await esemenyEllenorzese(await szuletesSzabalyokkal(sz));
      if (v.rendben || !minta.test(v.ok)) { console.log('    (átment vagy más okkal bukott:', JSON.stringify(sz), v.ok, ')'); return false; }
    }
    // ⚠️ A régi (mező nélküli) születés változatlanul érvényes.
    return (await esemenyEllenorzese(await esemenyLetrehozasa(szuletesLeiras, kulcspar))).rendben === true;
  });

proba('⭐ D118/2 (①b): a koino szabályai a születésből — ami nincs megadva, a mai érték; a hiányzó, a régi és a hibás születés a mai értékeket adja',
  async () => {
    const sz = await esemenyLetrehozasa({ ...szuletesLeiras, adat: { ...szuletesLeiras.adat,
      szabalyok: { tudatpontKeret: 500, alapKuszobok: { elfogadasiKuszob: 66 } } } }, kulcspar);
    const k = koinoSzabalyai(sz);
    const hibas = { ...sz, adat: { ...sz.adat, szabalyok: { tudatpontKeret: -1 } } };
    return k.tudatpontKeret === 500 && k.kategoriaKorlat === ALAP_SZABALYOK.kategoriaKorlat
      && k.alapKuszobok.elfogadasiKuszob === 66
      && k.alapKuszobok.maximumDontesiIdo === ALAP_SZABALYOK.alapKuszobok.maximumDontesiIdo
      && koinoSzabalyai(null) === ALAP_SZABALYOK && koinoSzabalyai(await esemenyLetrehozasa(szuletesLeiras, kulcspar)) === ALAP_SZABALYOK
      && koinoSzabalyai(hibas) === ALAP_SZABALYOK && koinoSzabalyai(esemeny) === ALAP_SZABALYOK
      && ALAP_SZABALYOK.tudatpontKeret === 10000 && Object.isFrozen(k) && Object.isFrozen(k.alapKuszobok);
  });

proba('⭐ D118/2 (①b): az új születésbe írt szabályok TELJESEK — a megadottak a mai értékek helyén, és a kapun átmennek',
  async () => {
    const t = teljesSzabalyok({ tudatpontKeret: 500, alapKuszobok: { elfogadasiKuszob: 66 } });
    const ures = teljesSzabalyok();
    const kulcsok = (o) => Object.keys(o).sort().join(',');
    t.alapKuszobok.reszveteliKuszob = 7;   // sima objektum (az esemény adata) — a mai értékeket nem érinti
    // ⭐⭐ D129: az új születés a mai értékek MELLETT a kézikönyv szabályát is viszi — az az első szabály, ami az `ALAP_SZABALYOK`-ban
    // nincs (a régi, mező nélküli születés kézikönyv nélküli marad; `kezikonyvProba.js`).
    const { kezikonyv: _k, ...uresAlap } = ures;
    return t.tudatpontKeret === 500 && t.alapKuszobok.elfogadasiKuszob === 66 && t.kategoriaKorlat === ALAP_SZABALYOK.kategoriaKorlat
      && kulcsok(t) === kulcsok({ ...ALAP_SZABALYOK, kezikonyv: null }) && kulcsok(t.alapKuszobok) === kulcsok(ALAP_SZABALYOK.alapKuszobok)
      && JSON.stringify(uresAlap) === JSON.stringify(ALAP_SZABALYOK) && !!ures.kezikonyv && szabalyokAlakiHibaja(ures) === null
      && ALAP_SZABALYOK.alapKuszobok.reszveteliKuszob === 0
      && (await esemenyEllenorzese(await esemenyLetrehozasa({ ...szuletesLeiras, adat: { ...szuletesLeiras.adat, szabalyok: t } },
        kulcspar))).rendben === true;
  });

// ===== ⭐⭐ D130 (③f, KO4 (A)): A KOINON PÉLDÁNYSZÁMA A SZÜLETÉSBEN =====
//
// A koinon egy darabjának ennyi tartója legyen (`r` — a darab-mélység ebből és az ismert tagokból). A koino születése mondja ki:
// az új születésbe a program kiírja (alapból 20), a megadott felülírja, a mező nélküli (a ③f előtti) születés 20-at ad — pontosan
// azt, amivel a program a ③f előtt minden koinoban számolt —, és a kapu a határon kívülit (0, egymillió fölött, nem egész) elveti.
// A címjegyzék alapértéke ugyanez (egy forrás). Rontás: az `ALAP_SZABALYOK` nélküle → a régi születés `undefined`-ot ad → bukik;
// a `HATAROK` nélküle → a kapu „ismeretlen szabály”-t mond a jóra → bukik; a `teljesSzabalyok` kihagyja → az új születés nem
// mondja ki → bukik.
proba('⭐⭐ D130 (③f): a koinon példányszáma a születésben — az új születés kiírja (20), a megadott felülírja, a régi (mező nélküli) születés 20, a kapu a határon kívülit elveti',
  async () => {
    const szuletesSzabalyokkal = (szabalyok) => esemenyLetrehozasa(
      { ...szuletesLeiras, adat: { ...szuletesLeiras.adat, szabalyok } }, kulcspar);
    const uj = teljesSzabalyok();
    const megadott = teljesSzabalyok({ koinonPeldany: 5 });
    const regiAlak = await szuletesSzabalyokkal({ tudatpontKeret: 500 });   // a ③f előtti alak: szabályok, de példányszám nélkül
    const ki = {
      alap: ALAP_SZABALYOK.koinonPeldany === 20 && KOINON_PELDANY === ALAP_SZABALYOK.koinonPeldany,
      ujKiirja: uj.koinonPeldany === 20 && megadott.koinonPeldany === 5,
      regi: koinoSzabalyai(regiAlak).koinonPeldany === 20 && koinoSzabalyai(regiAlak).tudatpontKeret === 500
        && koinoSzabalyai(await esemenyLetrehozasa(szuletesLeiras, kulcspar)).koinonPeldany === 20
        && koinoSzabalyai(null).koinonPeldany === 20,
      szamol: koinoSzabalyai(await szuletesSzabalyokkal(megadott)).koinonPeldany === 5,
      kapuJo: (await esemenyEllenorzese(await szuletesSzabalyokkal({ koinonPeldany: 1 }))).rendben === true
        && (await esemenyEllenorzese(await szuletesSzabalyokkal({ koinonPeldany: 1000000 }))).rendben === true
        && (await esemenyEllenorzese(await szuletesSzabalyokkal(megadott))).rendben === true,
      kapuRossz: true
    };
    for (const v of [0, 1000001, -3, '20']) {
      const e = await esemenyEllenorzese(await szuletesSzabalyokkal({ koinonPeldany: v }));
      if (e.rendben || !/koinonPeldany szabály a határon kívül/.test(e.ok)) ki.kapuRossz = false;
    }
    if (!Object.values(ki).every(Boolean)) console.log('    (ami bukott: ' + Object.keys(ki).filter((k) => !ki[k]).join(', ') + ')');
    return Object.values(ki).every(Boolean);
  });

// ===== TÁJÉKOZTATÓ MÉRÉS =====

proba('Egy esemény mérete ésszerű (< 1 KB) — ⭐⭐ D128 (②a): a lánc ELSŐ eseménye a tanúsítvánnyal (benne az azonosság születésével) < 1,5 KB', async () => {
  // ⚠️ A minta-esemény a lánc első eseménye: a készülék tanúsítványát hozza (a születéssel ~600 B — 94. mérés) — egy lánc minden
  // további eseménye nélküle utazik.
  const masodik = await esemenyLetrehozasa({ ...alapLeiras, sorszam: 2, elozo: esemeny.azonosito }, kulcspar);
  const meret = new TextEncoder().encode(JSON.stringify(masodik)).length;
  const elsoMeret = new TextEncoder().encode(JSON.stringify(esemeny)).length;
  console.log('    (egy esemény mérete: ' + meret + ' bájt, a lánc első eseménye: ' + elsoMeret + ' bájt)');
  return meret < 1024 && elsoMeret < 1536;
});

export default futtatas;
