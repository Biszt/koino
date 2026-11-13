# A kulcs: több készülék és a helyreállítás — átvizsgálás (ET-3, 2026-11-13, kód nélkül)

> **Állapot:** 🔍 átvizsgálva · ⏸️ KU1–KU6 Csabánál. A terv a tervező ágé ([`terv_kulcs.md`](terv_kulcs.md) — ET-3/2 – ET-3/6
> eldöntve, mind (A)); Csaba (2026-11-13): *„kezdjük az et-3-al, de még a kódírás elött nézzük át a tervet, részletessen.”* → *„igen.”*
> (az átvizsgálás). Ez a dokumentum a tervet a mai kódhoz méri — a **93. mérés** alapján (`meres/kulcsMeres.js`). Programkód nem
> készült, csak a mérés.

## 1. A rövid válasz

**Az irány jó** — készülékkulcsok az azonosság kulcsa alatt, a csere-kulcs előre lekötve, a mentés papíron vagy fájlban és
darabolva a hálózatban. Három dolgot a kód mond meg, amit a terv nem mondott ki:

1. **A tudatpont-keret és a csalás bizonyítéka ma EGY láncra épül** (**D42 — a bemondott összeg**, **D63 — a lánc-gyökér**, **D78 — az
   összegző Merkle-fa**, **D79 — a teljes kiosztás-lista ellenőrzése**, **D81 — a bizonyíték az eseménnyel utazik**). Mérve (93.
   (b)): ha egy becsületes e-ember két készülékének láncát egynek számoljuk, a mai gépezet a telefon eseményét **hazugnak** látja
   („a bemondott összeg ellentmond a saját láncának”). És a D42 lényege — *„egyetlen eseményből eldől, a lánc többi része nélkül;
   szeletelt tárban ez az EGYETLEN mód a keret ellenőrzésére”* — a **közös keretnél elveszne**: egy esemény nem tudja, a másik
   készülék közben mennyit adott ki. → **KU1** (az ET-3/3 újra).
2. **A készülék felvételének a koinók FÖLÖTT kell érvényesnek lennie.** A kulcs minden koinódban ugyanaz (**D15 — a kulcs hitelesít,
   nem titkol**), egy esemény viszont koinóhoz kötött (a koinó neve az első aláírt mező — **D66 — a megújulás**). Egy koinóbeli
   `Keszulek` esemény a másik koinóban nem érvényes. → **KU2** (egy koinótól független tanúsítvány).
3. **A kulcs a hálózatban is aláír** — a csere kézfogásában (a tag ott bizonyítja magát), a hirdetőtáblán, a DHT-n, a meghívó
   rekeszében, a kereső-bejegyzések megújításában. Mindenhol ki kell mondani, melyik kulcs.

**Ami jó hír:** a szavazat már ma IDŐRENDBEN számít (az e-ember utolsó szavazata) — ha a szerző az azonosság marad, két készülék
szavazata magától rendben van; az író készülékenként egy (**D70 — a tár mögött az író áll**) — a készülék-lánc pontosan erre illik; a
láncok összefésülése olcsó (100 000 esemény ~30 ms — 93. (d)).

**A hálózati darabolt mentés nem a mag része** (csak a csere-kulcs lenyomata az) → később építhető, új koinó-család nélkül. A
kriptográfiája a legkockázatosabb: a jelszavas visszaadáshoz tetszőleges görbe-szorzás kell, a WebCrypto X25519-e viszont a skalárt
csonkolja (mérve: 20/20) — egy saját BigInt-létra kell (2,2 ms / szorzás, a WebCryptóval összevetve helyes).

## 2. A 93. mérés

**(a) A mai elágazás** — két készülék UGYANAZZAL a kulccsal, egy közös lánc-végről, egymásról nem tudva (gondolat + pont párok), a
valódi feloldással (`elagazasokFeloldasa`):
- 2+2 eseményből 2 elveszett, 6+4-ből 4, 10+10-ből 10, 20+6-ból 6 — **minden ütköző sorszámon egy esemény elvész**, a két ágból
  vegyesen (a kisebb azonosító marad); ami csak a hosszabb ág végén van, megmarad;
- és **értelmetlen keverék** marad: minden esetben 1–2 **árva pont** — egy megmaradt pont-esemény, aminek a gondolata elveszett.
- Az őrjárat magától is ír (a meghívás végrehajtása, a pontok felszabadítása, a lezárási összegzés, az ellentmondás bejelentése, a
  tagsági csomag, a 2. lépcső bemondása) — két őrjárat egy kulccsal folyamatosan ütközne.

**(b) A bemondott összeg két láncon** — egy becsületes e-ember, a keret 10 000; a laptop 8000-et tesz a „Könyvtár”-ra (bemondja:
összesen 8000), a telefon offline 1000-et a „Park”-ra (bemondja: összesen 1000 — a SAJÁT rálátása szerint). A valódi
`pontEsemenyMerlege`:
- **(1) a két lánc egynek számolva:** a laptop ✓, a telefon ⛔ *„a bemondott összeg ellentmond a saját láncának (bemondva 1000, a
  láncából 9000)”* — egy becsületes embert vádolna;
- **(2) mindegyik a saját készüléke rálátásán:** mindkettő ✓ — de a közös keret (9000 ≤ 10 000, vagy 3000-rel 11 000 > 10 000) egy
  KÜLÖN, közös sorrendű ellenőrzés, amihez minden készülék lánca kell;
- **(3) a keret készülékenként osztva** (9000 + 1000): mindkettő ✓, a 3000-es telefon ⛔ *„túllépi a keretet (3000 / 1000)”* — egyetlen
  eseményből eldől, offline is, a mai gépezet változatlan.

**(c) Az esemény mérete** — egy mai pont-esemény 624 B; egy `keszulek` mezővel 681 B (**+57 B**); egy beágyazott készülék-tanúsítvánnyal
947 B (+323 B, **+52%**). A tanúsítvány maga 251 B → ne minden eseményben utazzon (6. szabály), hanem készülékenként és koinónként
egyszer.

**(d) A láncok összefésülése** — 2–3 készülék, minden esemény mondja, a többi készülékből meddig látott; egy rögzített sorrend (a
láthatóság szerint, holtversenyben a kisebb azonosító): 1000 esemény ~0,1–0,7 ms, 10 000 ~5–7 ms, 100 000 ~23–29 ms — lineáris, egy
azonosság eseményein (9. szabály: a teher a saját eseményeivel nő).

**(e) A beépített kriptográfia** (Node 22): ✓ Ed25519, X25519, HKDF, AES-GCM, PBKDF2 (100 000 kör 32 ms, 600 000 kör 183 ms a
laptopon — a telefonon ~3–5×). ⛔ **A WebCrypto X25519 a skalárt csonkolja** (clamping): 20 véletlen skalárból a saját létra a
CSONKOLT skalárral 20/20-ban egyezik vele, a nyerssel 1/20-ban → a jelszavas visszaadás vak kiértékeléséhez (a skalár és az inverze
tetszőleges) saját számolás kell: a saját BigInt-létra **2,2 ms / szorzás** (ritka művelet — elég); a helyességét a WebCryptóval
összevetve mérjük. ✓ A titok-megosztás (Shamir, GF(256)): 32 B → 7 darab, bármely 3 visszaadja (0,7 ms), 2 nem; egy darab ~100 B.

**(f) Az őrzők megmaradása** (modell, nem terepi adat): 7 őrző, 3 kell — ha egy őrző egy év múlva 50% eséllyel elérhető, újraosztás
nélkül 77% marad meg, **havi újraosztással 99,99%**; 70%-nál 97%, illetve ~100%. ⭐ Az újraosztás a döntő (a készüléked végzi, amíg él).

## 3. A mai helyzet (a kódból)

- **A kulcs:** Ed25519 a WebCryptóból (`js/kulcs/kulcsTar.js`); az esemény `szerzo` mezője a nyilvános kulcs, az aláírt mezők
  (`esemeny.js` `TARTALOM_MEZOK`): koinó, típus, szerző, előző, sorszám, idő, szelet, látott, lánc-gyökér, adat.
- **A lánc egy szerzőé:** az elágazás sorszámonként oldódik fel (`allapotSzamitas.js`), és erre épül: a bemondás és a folytonosság
  (`szabalyok.js`), a lánc-gyökér (`lancGyoker.js`), a vád és az elágazás bizonyítéka (`ellentmondas.js`, `eszlelo.js`), a lánc-kör
  (`lancEllenorzes.js`), a bekapcsolódás lánc-pontja (`koinoLanc.js`), a lánc vége (`iro.js`), az idő-monotonitás.
- **A kulcs a hálózatban:** `titkositas.js` (a kézfogás), `tabla.js` (a hirdetőtábla), `dht.js`, `meghivoRekesz.js`,
  `keresoMegujitas.js` (a tulajdonos személyes aláírása).
- **A szavazat:** a javaslatonkénti szavazatok időrendben (`javaslatSzamitas.js`) — az e-ember utolsó szavazata számít.
- **A mentés:** `mentes` / `visszatolt` (a parancssor; a lapon nincs).

## 4. A javaslat — a menet

1. **Az esemény alakja:** a `szerzo` marad az AZONOSSÁG (a név nem változik), és jön egy új aláírt mező: **`keszulek`** — a
   készülékkulcs nyilvános része; az aláírás a készülékkulccsal. A lánc (sorszám, előző, lánc-gyökér) a **(szerző, készülék)** páré.
   ⭐ Így minden, ami a szerzőre épül — a tagság, a meghívás, a tanúsítás, a szavazat —, változatlan marad; a láncra épülő rész
   készülékenként fut (a mai gépezet, csak a kulcsa más).
2. **A készülék-tanúsítvány** (KU2): az azonosság kulcsa aláírja, koinótól függetlenül: *„ez a kulcs az én készülékem (»telefon«)”*.
   Egy koinóban a készülék első eseménye hozza (D81), és ha hiányzik, a kérelem elkéri; az esemény csak a `keszulek` mezővel nő (+57 B).
   **A kizárás** is tanúsítvány: a készülék láncából koinónként meddig érvényes (**D47 — az ellenőrzés az aláírás pillanatában
   történik, és befagy**).
3. **A sorrend egy azonosság eseményei között:** a `latott` mintájára minden esemény mondja, a többi készülékem láncából meddig
   látott; egy rögzített sorrend (93. (d)). Ami ehhez kell: a szavazatnál semmi (ma is időrend), a keretnél a KU1.
4. **A keret** (KU1) — a mérés szerint a készülékenként osztott keret (93. (b)(3)) tartja meg a D42-t; a közös kerethez egy új,
   minden készülék láncát kívánó ellenőrzés kell.
5. **A hálózat:** a kézfogásban a készülékkulcs + a tanúsítvány (a tagságot az azonosság hozza); a tábla és a DHT készülékenként
   (minden készülék a saját címét hirdeti); a kereső megújítását a készülék írja alá, az azonosság nevében.
6. **A csere-kulcs:** az azonosság születésében lekötve (a lenyomata — a **KERI** „elő-rotáció” mintája); a **kulcscsere** is
   koinótól független tanúsítvány (a csere-kulcs írja alá: új azonosság-kulcs, új lekötés). A név a kulcscsere után is marad (KU3).
7. **A mentés:** most a csere-kulcs papíron vagy fájlban (a mai `mentes` mintájára, a lapon is); a darabolt hálózati mentés később
   (KU5), saját átvizsgálással — nem mag.
8. **A fizetési kulcs** (az ET-11-ből): a nyilvános része már az azonosság születésében lekötve? (KU4)
9. **A lap:** „📱 Készülékeim” — a készülékek, a felvétel egy kóddal (QR), a kizárás, a keret részei (KU1), a mentés állása.

## 5. A kérdések (⏸️ Csabáé)

- **KU1 — A tudatpont-keret két készülék között** (az ET-3/3 újra, a mérés fényében):
  - (A) **közös keret** (az ET-3/3 (A)): két ellenőrzés kell — a bemondás a készülék saját rálátásán (a mai gépezet), és egy új, közös
    sorrendű keret-ellenőrzés, ami az azonosság MINDEN készülékének láncát kívánja. ⛔ A D42 („egyetlen eseményből eldől”) elveszne: a
    szeletelt tárban egy szelet tartója nem tudná eldönteni, hogy egy pont belefér-e, amíg a többi készülék láncát el nem kéri.
  - (B) ⭐ **készülékenként osztott keret:** az azonosság kiosztja a keretet a készülékei között (az első készüléké alapból az egész);
    egy készülék a részét maga adja vissza (a saját eseményével), az azonosság kulcsa osztja újra. A D42 és a bizonyítékok változatlanok,
    offline is biztos. Ára: egy offline készülék része addig az övé, és a lap mutatja a részeket.
- **KU2 — A készülék felvétele:** (A) ⭐ egy koinótól független tanúsítvány, a készülék első eseménye hozza egy koinóban, a kérelem
  elkéri (+57 B eseményenként); (B) koinónként egy `Keszulek` esemény (a készüléket minden koinódban külön kell felvenni); (C) a
  tanúsítvány minden eseményben (+52%).
- **KU3 — A név a kulcscsere után:** (A) ⭐ marad — a név az első kulcs, a mostani aláíró kulcsot a csere-tanúsítványok lánca mondja
  meg; (B) a kulcscsere új nevet ad, a régire egy átirányítás.
- **KU4 — A fizetési kulcs** (az ET-11 — az átutalás): (A) ⭐ a nyilvános része már az azonosság születésében lekötve — a pénz
  bevezetése így nem kíván új koinó-családot; (B) a pénzzel együtt (akkor új család).
- **KU5 — A sorrend:** (A) ⭐ most a mag része (a készülék, a tanúsítvány, a kizárás, a keret, a csere-kulcs lekötése, a kulcscsere, a
  papír- és fájl-mentés); a darabolt hálózati mentés később, saját átvizsgálással; (B) mind egyszerre.
- **KU6 — Az azonosság kulcsa a mindennapokban:** (A) ⭐ csak kezel (felvesz, kizár, keretet oszt); az első készülék is saját
  készülékkulccsal ír — így az azonosság kulcsa később akár papírra is tehető; (B) az első készüléken egyben a készülékkulcs (egyszerűbb,
  de egy lopásnál a kezelés és a mindennapi lánc együtt vész).

## 6. Amit ez nem old meg (kimondott határok)

- **A kizárás terjedése:** koinónként jut el; ahol még nem ért oda, ott a tolvaj eseménye addig számít (D19 — kimondva). A pénznél az
  ET-11 fizetési kulcsa véd (a készülékkulccsal nem lehet átutalni).
- **Ha minden elveszett, a jelszó is:** új regisztráció (az ET-3/6), kimondva.
- **A kriptográfia:** a jelszavas visszaadáshoz a görbe-szorzás mellé egy „hash-to-curve” (Elligator) és a skalár-inverz is saját kód
  lesz — ennek külön átvizsgálás és mérés jár (a darabolt mentéssel).
- **A mag változik** → a régi koinók „más számítást” mutatnak; az első szélesebb körben terjesztett koinó már ezzel születik.

## 7. Az építés sorrendje (ha a kérdések eldőlnek)

① **a mag:** az esemény `keszulek` mezője, a (szerző, készülék) lánc, a tanúsítvány és a kizárás, a keret (KU1 szerint), a sorrend az
azonosság eseményei között → ② **a csere-kulcs** lekötése, a kulcscsere, a papír- és fájl-mentés (a lapon is) → ③ **a hálózat:** a
kézfogás, a tábla, a DHT, a meghívó rekesze, a kereső a készülékkulccsal → ④ **a lap:** „📱 Készülékeim” (a felvétel kóddal, a
kizárás, a keret részei, a mentés állása) → ⑤ **a próbák és a terep:** két készülék, egy azonosság (a laptop és a telefon) → ⑥
**később:** a darabolt hálózati mentés (saját átvizsgálással).

*Kapcsolódik:* [`terv_kulcs.md`](terv_kulcs.md) (a tervező ág — ET-3), [`terv_atutalas.md`](terv_atutalas.md) (ET-11 — a fizetési kulcs),
`meres/eredmenyek.md` 93., `js/kulcs/kulcsTar.js`, `js/allapot/szabalyok.js` (D42), `js/allapot/allapotSzamitas.js` (az elágazás).
