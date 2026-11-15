// meres/kulcsProba.js

// A kulcs-réteg önpróbája — a SZEMÉLYAZONOSSÁG próbája (D15).
//
// ⛔⛔ EZ A LAP 2026-09-15-IG NEM LÉTEZETT, és ez a legfontosabb dolog, amit tudni kell
// róla. A koino legelső rétege — az, amiből az e-ember azonossága lesz — **egyetlen
// önpróba nélkül** állt: a 575 próbából nulla mérte. Közvetve persze futott (minden
// parancssor-próba gyárt és betölt kulcsot), de a `probaFuttato.js` a kulcsokat
// KÖZVETLENÜL a WebCryptótól kéri, nem ezen a rétegen át — vagyis a kimentés → visszatöltés
// köre, az őrei és a hibaágai mind méretlenek voltak.
//
// ⭐ Amit ez a lap bizonyít:
//   1. a kimentett kulcs VISSZAHOZZA ugyanazt az azonosságot — nem csak a szöveg egyezik,
//      hanem a visszatöltött kulccsal aláírt esemény is ellenőrizhető a régi szerzővel;
//   2. a visszatöltés NEM ír felül némán meglévő kulcsot (D15: a régi azonosság elveszne);
//   3. a hibás fájl NYOM NÉLKÜL bukik el — a tárhoz hozzá se nyúlunk;
//   4. a leírás `azonosito` mezője nem hihető el vakon: a névnek a KULCSBÓL kell jönnie.
//
// ⚠️ A tárolót memóriában adjuk (a réteg kívülről kapja — épp ezért próbázható fájl
// nélkül). A valódi fájl-utat és a parancsot a `parancssorProba.js` méri, külön folyamatban.

import {
  kulcsparLetrehozasa, kulcsparBetoltese, kulcsparBiztositasa,
  kulcsparLeirasa, kulcsparLeirasbol, kulcsparKimentese, kulcsparVisszatoltese,
  nyilvanosKulcsSzovegesen, rovidAzonosito, csereKulcsKiadasa
} from '../js/kulcs/kulcsTar.js';
import { azonossagNeve, csereLenyomata } from '../js/kulcs/azonossag.js';
import { esemenyLetrehozasa, esemenyEllenorzese } from '../js/esemeny/esemeny.js';
import { probaGyujtemeny } from './probaFuttato.js';
import { ujKeszulek } from '../js/kulcs/keszulek.js';   // ⭐⭐ D128

const { proba, futtatas } = probaGyujtemeny('A kulcs-réteg próbája — a személyazonosság');

/** Eldobható tároló a memóriában: ugyanaz a két művelet, mint a fájl-tárolóé. */
function memoriaTarolo(kezdet = null) {
  let mentett = kezdet;
  return {
    fajl: '(memória)',
    irasokSzama: 0,
    async olvas() { return mentett; },
    async ir(leiras) { mentett = leiras; this.irasokSzama++; }
  };
}

// ===== A KÖR: LÉTREHOZÁS → KIMENTÉS → VISSZATÖLTÉS =====

proba('⭐ A kimentett kulcs VISSZAHOZZA ugyanazt az azonosságot', async () => {
  const regi = memoriaTarolo();
  const kulcspar = (await kulcsparLetrehozasa(regi)).kulcspar;
  const kulcs = await nyilvanosKulcsSzovegesen(kulcspar.publicKey);
  // ⭐⭐ D128 (②a): a NÉV a születés lenyomata — a mentés a születést is hozza, a visszatöltés ugyanazt a nevet adja vissza.
  const azonosito = await azonossagNeve(kulcspar.szuletes);

  const fajl = await kulcsparKimentese(kulcspar);

  // Egy MÁSIK készülék, üres tárolóval — mint egy új telefon.
  const uj = memoriaTarolo();
  const eredmeny = await kulcsparVisszatoltese(uj, fajl);

  return eredmeny.azonosito === azonosito && eredmeny.kulcspar.szuletes?.alairas === kulcspar.szuletes.alairas
    && !!kulcspar.fizetesKulcs?.d && eredmeny.kulcspar.fizetesKulcs?.d === kulcspar.fizetesKulcs.d   // a fizetési kulcs is
    && (await nyilvanosKulcsSzovegesen(eredmeny.kulcspar.publicKey)) === kulcs;
});

proba('⭐⭐ ÉS A BIZONYÍTÉK NEM A SZÖVEG: a visszatöltött kulccsal aláírt esemény ELLENŐRIZHETŐ',
  async () => {
    // ⚠️ Az azonosítók egyezése önmagában csak annyit mond, hogy a NYILVÁNOS fele
    // ugyanaz. Az azonosság attól azonosság, hogy a PRIVÁT felével tovább tudok írni —
    // ezt csak egy valódi aláírás bizonyítja.
    const elso = memoriaTarolo();
    const eredeti = (await kulcsparLetrehozasa(elso)).kulcspar;
    const szerzo = await azonossagNeve(eredeti.szuletes);   // ⭐⭐ D128 (②a): a név a születésből

    const uj = memoriaTarolo();
    const { kulcspar } = await kulcsparVisszatoltese(uj, await kulcsparKimentese(eredeti));

    // ⭐⭐ D128: az azonosság kulcsa nem ír a mindennapokban — tanúsít egy készüléket, és az ír a nevében.
    const esemeny = await esemenyLetrehozasa({
      koino: 'proba', tipus: 'GondolatLetrehozas', adat: { cim: 'A hazatérés' },
      elozo: null, sorszam: 1
    }, await ujKeszulek(kulcspar, 'új telefon'));

    const ellenorzes = await esemenyEllenorzese(esemeny);
    return ellenorzes.rendben === true && esemeny.szerzo === szerzo;
  });

proba('⭐ A nyilvános kulcsot NEM tároljuk külön — a privátból származik', async () => {
  // A fejléc állítása: „a JWK `x` mezője MAGA a nyilvános kulcs". Ha ez elromlana, a
  // leírás két helyen mondaná meg, ki vagy — és a kettő szétcsúszhatna.
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const leiras = await kulcsparLeirasa(kulcspar);

  const szoveg = JSON.stringify(leiras);
  return !('nyilvanosKulcs' in leiras)
    && typeof leiras.privatKulcs?.x === 'string'
    && szoveg.includes(leiras.privatKulcs.x);
});

// ===== AZ ŐRÖK =====

proba('⛔ Meglévő kulcsot NEM ír felül engedély nélkül — és a tárhoz HOZZÁ SEM NYÚL',
  async () => {
    const regiKulcs = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
    const regiLeiras = await kulcsparLeirasa(regiKulcs);

    const tarolo = memoriaTarolo(regiLeiras);
    tarolo.irasokSzama = 0;

    const masik = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
    let elakadt = false;
    try {
      await kulcsparVisszatoltese(tarolo, await kulcsparKimentese(masik));
    } catch (hiba) {
      elakadt = hiba.message.includes('MÁR VAN kulcs');
    }

    // ⭐ Nem elég, hogy hibát dobott: a réginek ÉRINTETLENÜL kell ott lennie.
    const most = await tarolo.olvas();
    return elakadt && tarolo.irasokSzama === 0 && most.azonosito === regiLeiras.azonosito;
  });

proba('⭐ …de KIMONDOTT engedéllyel felülír — és megnevezi, mit dobott el (D19)', async () => {
  const regiKulcs = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const regiLeiras = await kulcsparLeirasa(regiKulcs);
  const tarolo = memoriaTarolo(regiLeiras);

  const ujKulcs = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const eredmeny = await kulcsparVisszatoltese(
    tarolo, await kulcsparKimentese(ujKulcs), { felulir: true }
  );

  const most = await tarolo.olvas();
  return eredmeny.elhagyott === regiLeiras.azonosito
    && most.nev === eredmeny.azonosito   // ⭐⭐ D128 (②a): a tárolt fájl neve (a születésből)
    && eredmeny.azonosito !== regiLeiras.azonosito;
});

proba('⛔ Üres készüléken NINCS mit eldobni: az `elhagyott` null', async () => {
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const eredmeny = await kulcsparVisszatoltese(memoriaTarolo(), await kulcsparKimentese(kulcspar));
  return eredmeny.elhagyott === null;
});

// ===== A HIBÁS FÁJL =====

proba('⛔ Ami nem koino kulcs-leírás, azt elutasítja', async () => {
  const tarolo = memoriaTarolo();
  let elakadt = false;
  try {
    await kulcsparVisszatoltese(tarolo, JSON.stringify({ mi: 'valami-mas', privatKulcs: {} }));
  } catch (hiba) {
    elakadt = hiba.message.includes('nem koino kulcs-leírás');
  }
  return elakadt && tarolo.irasokSzama === 0;
});

proba('⛔ A „nem is JSON" MÁS hiba, mint a „nem koino kulcs" (D19)', async () => {
  let uzenet = '';
  try {
    await kulcsparVisszatoltese(memoriaTarolo(), 'szia, ez egy sima szöveg');
  } catch (hiba) {
    uzenet = hiba.message;
  }
  // A kettőt nem szabad összemosni: az egyik rossz fájl, a másik rossz TARTALMÚ fájl.
  return uzenet.includes('nem JSON') && !uzenet.includes('koino kulcs-leírás');
});

proba('⭐⭐ A NÉV A KULCSBÓL JÖN: az átírt `azonosito` mezőt LELEPLEZI', async () => {
  // ⚠️ Ez a mai őr (2026-09-15). Korábban a bemondott azonosítót senki nem vetette össze
  // a kulccsal — vagyis egy átírt mentésre a program ismeretlen néven hivatkozott volna.
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const leiras = await kulcsparLeirasa(kulcspar);
  const hamis = { ...leiras, azonosito: 'A'.repeat(43) };

  const tarolo = memoriaTarolo();
  let elakadt = false;
  try {
    await kulcsparVisszatoltese(tarolo, JSON.stringify(hamis));
  } catch (hiba) {
    elakadt = hiba.message.includes('HAZUDIK');
  }
  return elakadt && tarolo.irasokSzama === 0;
});

proba('⚠️ …de NEM mond nemet mindenre: az `azonosito` nélküli leírás átmegy', async () => {
  // ⭐ A párja az előzőnek — enélkül egy „mindent elutasítok" őr is zöld lenne.
  // Az `azonosito` KÉNYELMI mező (hogy a fájlra ránézve lássuk, kié): ha hiányzik, a
  // kulcs attól még teljes értékű, mert a név belőle SZÁMÍTHATÓ.
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const leiras = await kulcsparLeirasa(kulcspar);
  delete leiras.azonosito;

  const eredmeny = await kulcsparVisszatoltese(memoriaTarolo(), JSON.stringify(leiras));
  return eredmeny.azonosito === (await nyilvanosKulcsSzovegesen(kulcspar.publicKey));
});

proba('⛔ És a HIBÁS kulcs is lelepleződik: az átírt privát kulcs nem tölthető vissza', async () => {
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const leiras = await kulcsparLeirasa(kulcspar);
  // Egy karakter a privát kulcsban — a `d` mező az, ami valóban te vagy.
  const rontott = {
    ...leiras,
    azonosito: undefined,
    privatKulcs: { ...leiras.privatKulcs, d: 'A'.repeat(leiras.privatKulcs.d.length) }
  };

  const tarolo = memoriaTarolo();
  let elakadt = false;
  try {
    await kulcsparVisszatoltese(tarolo, JSON.stringify(rontott));
  } catch {
    elakadt = true;          // a WebCrypto vagy az azonosító-ellenőrzés fogja meg
  }
  return elakadt && tarolo.irasokSzama === 0;
});

// ===== A BETÖLTÉS ÉS A LÉTREHOZÁS =====

proba('⭐ `kulcsparBiztositasa`: üres készüléken ÚJ kulcs, utána már a MEGLÉVŐ', async () => {
  const tarolo = memoriaTarolo();

  const elso = await kulcsparBiztositasa(tarolo);
  const masodik = await kulcsparBiztositasa(tarolo);

  const a = await nyilvanosKulcsSzovegesen(elso.kulcspar.publicKey);
  const b = await nyilvanosKulcsSzovegesen(masodik.kulcspar.publicKey);

  // ⚠️ Az `ujE` nem dísz: EZ mondja meg a parancssornak, hogy kiírja-e a „mentsd el"-t.
  return elso.ujE === true && masodik.ujE === false && a === b;
});

proba('⛔ Üres tárolóból a betöltés NULLÁT ad — nem hibát (a hiány nem baj, D19)', async () => {
  return (await kulcsparBetoltese(memoriaTarolo())) === null;
});

proba('⭐ A rövid alak felismerhető marad: az azonosító eleje ÉS vége is látszik', async () => {
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const azonosito = await nyilvanosKulcsSzovegesen(kulcspar.publicKey);
  const rovid = rovidAzonosito(azonosito);

  return rovid.startsWith(azonosito.slice(0, 8))
    && rovid.endsWith(azonosito.slice(-8))
    && rovid.length < azonosito.length;
});

proba('⭐ A leírás KIMONDJA, mi az és mivel jár (nem néma JSON)', async () => {
  const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
  const leiras = await kulcsparLeirasa(kulcspar);

  // A fájl önmagát magyarázza: aki rátalál, tudja, mit tart a kezében.
  return leiras.mi === 'koino-kulcs'
    && typeof leiras.figyelmeztetes === 'string'
    && leiras.figyelmeztetes.length > 0
    && leiras.algoritmus === 'Ed25519';
});

proba('⭐ A leírásból visszaállított kulcspár ÖNMAGÁBAN is működik (aláír és ellenőriz)',
  async () => {
    const kulcspar = (await kulcsparLetrehozasa(memoriaTarolo())).kulcspar;
    const vissza = await kulcsparLeirasbol(await kulcsparLeirasa(kulcspar));
    vissza.szuletes = kulcspar.szuletes;   // ⭐⭐ D128 (②a): a kulcs-szintű leírás a kulcsot hozza — a születés az azonosságé

    const esemeny = await esemenyLetrehozasa({
      koino: 'proba', tipus: 'GondolatLetrehozas', adat: { cim: 'próba' },
      elozo: null, sorszam: 1
    }, await ujKeszulek(vissza, 'próba'));   // ⭐⭐ D128: a visszaállított kulcs tanúsít egy készüléket

    return (await esemenyEllenorzese(esemeny)).rendben === true;
  });

// ===== ⭐⭐ D128 (②a — KC1 (A), KC3 (A)): A SZÜLETÉS ÉS A CSERE-KULCS =====

proba('⭐⭐ (②a) az azonosság SZÜLETÉSSEL jön létre: a csere-kulcs kiadásra megy (a lenyomata a születésben), újranyitva ugyanaz a név; a régi (születés nélküli) kulcsfájl születést kap', async () => {
  const tarolo = memoriaTarolo();
  const uj = await kulcsparBiztositasa(tarolo);
  const nev = await azonossagNeve(uj.kulcspar.szuletes);
  const kiadas = await csereKulcsKiadasa(uj.csere, nev);
  const csereNyilvanos = await nyilvanosKulcsSzovegesen(uj.csere.publicKey);
  const ujra = await kulcsparBiztositasa(tarolo);
  // A régi alak: csak a kulcs — a biztosítás születést ad neki (új csere-kulccsal), és a név már a születésé.
  const regiKulcs = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const regiTarolo = memoriaTarolo(await kulcsparLeirasa(regiKulcs));
  const regi = await kulcsparBiztositasa(regiTarolo);
  return uj.ujE && !!uj.csere && kiadas.mi === 'koino-csere-kulcs' && kiadas.nev === nev && kiadas.privatKulcs?.x === csereNyilvanos
    && uj.kulcspar.szuletes.csere === await csereLenyomata(csereNyilvanos) && (await tarolo.olvas()).privatKulcs.d !== undefined
    && !JSON.stringify(await tarolo.olvas()).includes(kiadas.privatKulcs.d)
    && !ujra.ujE && ujra.csere === null && (await azonossagNeve(ujra.kulcspar.szuletes)) === nev
    && regi.szuletettE === true && !!regi.csere && regi.kulcspar.szuletes.kulcs === await nyilvanosKulcsSzovegesen(regiKulcs.publicKey)
    && (await regiTarolo.olvas()).nev === await azonossagNeve(regi.kulcspar.szuletes);
});

export default async function (csendes) {
  return futtatas(csendes);
}
