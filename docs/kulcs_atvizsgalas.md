# A kulcs: több készülék és a helyreállítás — átvizsgálás (ET-3, 2026-11-13, kód nélkül)

> **Állapot:** ✅ **eldöntve — D128** (Csaba, 2026-11-13: *„rendben, minden javaslatodat elfogadom. mehetünk tovább.”* — KU1–KU7 mind
> ⭐, a KU1-ben a határ (a)) · a tervező ág válaszolt (8. szakasz: két kiegészítés, egy helyesbítés, a KU3–KU6-ban az (A)). A terv a tervező ágé ([`terv_kulcs.md`](terv_kulcs.md) — ET-3/2 – ET-3/6
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
3. **A személyes kulcs a hálózatban KÉT helyen ír alá** — a csere kézfogásában (a tag ott bizonyítja magát) és a kereső-bejegyzések
   megújításában; ezt a kettőt kell a készülékkulcsra tenni. *(Helyesbítve a tervező ág nyomán, a kódban ellenőrizve: a hirdetőtábla
   már ma a készülék saját tábla-kulcsával ír — D6, szándékosan elválasztva a személytől —, a meghívó rekesze a meghívó titkából
   számolt kulccsal; az első változat ezeket is a személyes kulcsnak tulajdonította.)*

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
- **A kulcs a hálózatban:** a személyes kulcs a `titkositas.js` `szemelyesKezfogasAlairasa`-ban (a kézfogás — `koino.js`, az
  `udpVonal.js` ellenőrzi) és a `keresoMegujitas.js`-ben (a tulajdonos személyes aláírása). ⭐ A hirdetőtábla NEM ezzel ír: a
  `tablaKulcs.js` a készülék saját kulcsa (*„EZ SOHA NEM AZ AZONOSSÁGOD”* — D6); a `meghivoRekesz.js` a meghívóból számolt
  kulcspárral; a `dht.js` csak a kapott kulcspárt használja.
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
5. **A hálózat:** a kézfogásban a készülékkulcs + a tanúsítvány (a tagságot az azonosság hozza); a kereső megújítását a készülék írja
   alá, az azonosság nevében. A tábla és a DHT már ma készülékenkénti (a tábla-kulcs — D6), a rekesz a meghívóé: ott nincs teendő.
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
    **+ a tervező kiegészítése (8.1): az átfolyás** — a részeket nem az azonosság kulcsa osztja újra, hanem találkozáskor magától
    átfolynak (az átadást a több szabad ponttal rendelkező készülék írja alá). ⛔ Határ nélkül egy ellopott készülék a többi összes
    szabad pontját magához húzza (93. (g)) → **a határ helye:** (a) ⭐ **az adó készülék szabálya** — magától csak a fogadó határáig
    (a lapon állítható), fölötte az adó megkérdez; a mag nem tud róla, és a változtatásához nem kell az azonosság kulcsa; (b) a határ
    a készülék tanúsítványában (a mag ellenőrzi, de változtatni csak az azonosság kulcsával — papírról); (c) határ nélkül ⛔.
- **KU2 — A készülék felvétele:** (A) ⭐ egy koinótól független tanúsítvány, a készülék első eseménye hozza egy koinóban, a kérelem
  elkéri (+57 B eseményenként); (B) koinónként egy `Keszulek` esemény (a készüléket minden koinódban külön kell felvenni); (C) a
  tanúsítvány minden eseményben (+52%). **+ a tervező kiegészítése (8.2):** ahol egy koinó nincs felsorolva a kizárásban, ott a
  kizárt készülék egyetlen eseménye sem számít (egy tolvaj új koinóban sem léphet fel a nevedben).
- **KU3 — A név a kulcscsere után:** (A) ⭐ marad — a név az első kulcs, a mostani aláíró kulcsot a csere-tanúsítványok lánca mondja
  meg; (B) a kulcscsere új nevet ad, a régire egy átirányítás.
- **KU4 — A fizetési kulcs** (az ET-11 — az átutalás): (A) ⭐ a nyilvános része már az azonosság születésében lekötve — a pénz
  bevezetése így nem kíván új koinó-családot, és (a tervező érve) egy tolvaj nem köthetné le előbb a sajátját; (B) a pénzzel együtt
  (akkor új család).
- **KU5 — A sorrend:** (A) ⭐ most a mag része (a készülék, a tanúsítvány, a kizárás, a keret, a csere-kulcs lekötése, a kulcscsere, a
  papír- és fájl-mentés); a darabolt hálózati mentés később, saját átvizsgálással; (B) mind egyszerre.
- **KU6 — Az azonosság kulcsa a mindennapokban:** (A) ⭐ csak kezel (felvesz, kizár, keretet oszt); az első készülék is saját
  készülékkulccsal ír — így az azonosság kulcsa később akár papírra is tehető; (B) az első készüléken egyben a készülékkulcs (egyszerűbb,
  de egy lopásnál a kezelés és a mindennapi lánc együtt vész).
- **KU7 — Egy kizárt (elveszett) készülék elhelyezett pontjai** (új — a 8.1 ára nyitotta meg: egy készülék csak a maga tett pontjait
  rendezheti át, egy elveszett készülék pedig már soha nem fut):
  - (A) ⭐ **az örökös átveszi:** a kizárás megnevezi a másik készülékedet; az koinónként egy átvétellel folytatja a kizárt készülék
    vágásig érvényes elhelyezéseit és a szabad részét — a pontok a gondolatokon maradnak, és ezentúl ő rendezi át őket. (Az átvétel
    egyszer kívánja a kizárt lánc vágásig tartó részét — a bizonyítéka az eseménnyel utazik, mint a D81-nél; az építésnél mérjük.)
  - (B) a vágásnál felszabadulnak: a pontok lekerülnek a gondolatokról, a rész az örökösé. ⛔ Egy gondolat, amin csak ezek a pontok
    voltak, megszűnik (nincs 0 tudatpontos entitás).
  - (C) befagynak: ott maradnak, de senki nem rendezheti át őket — ⛔ ellentmond annak, hogy a tudatpont bármikor átrendezhető.

## 6. Amit ez nem old meg (kimondott határok)

- **A kizárás terjedése:** koinónként jut el; ahol még nem ért oda, ott a tolvaj eseménye addig számít (D19 — kimondva). A pénznél az
  ET-11 fizetési kulcsa véd (a készülékkulccsal nem lehet átutalni).
- **Ha minden elveszett, a jelszó is:** új regisztráció (az ET-3/6), kimondva.
- **A kriptográfia:** a jelszavas visszaadáshoz a görbe-szorzás mellé egy „hash-to-curve” (Elligator) és a skalár-inverz is saját kód
  lesz — ennek külön átvizsgálás és mérés jár (a darabolt mentéssel).
- **A mag változik** → a régi koinók „más számítást” mutatnak; az első szélesebb körben terjesztett koinó már ezzel születik.

## 7. Az építés sorrendje (ha a kérdések eldőlnek)

① **a mag:** az esemény `keszulek` mezője, a (szerző, készülék) lánc, a tanúsítvány és a kizárás (a kizárás örökösével — KU7), a
keret (KU1 szerint — az átadással, 8.1), a sorrend az azonosság eseményei között → ② **a csere-kulcs** lekötése, a kulcscsere, a papír- és fájl-mentés (a lapon is) → ③ **a hálózat:** a
kézfogás és a kereső megújítása a készülékkulccsal (a tábla és a rekesz már ma sem a személyes kulccsal ír) → ④ **a lap:** „📱 Készülékeim” (a felvétel kóddal, a
kizárás, a keret részei, a mentés állása) → ⑤ **a próbák és a terep:** két készülék, egy azonosság (a laptop és a telefon) → ⑥
**később:** a darabolt hálózati mentés (saját átvizsgálással).

## 8. A tervező ág válasza (2026-11-13) és a mérlegelése

A tervező ág (Csaba közvetítésével): a KU3–KU6-ban az (A), a szavazatról nem kell kérdés (93.: ma is az utolsó szavazat számít); és
két kiegészítés, egy helyesbítés.

**8.1 Az átfolyás** (a KU1 (B)-hez): *a keret magától átfolyik a készülékeid között, amikor találkoznak; ha az azonosság kulcsa
papíron van (KU6), nem kell minden átrendezéshez elővenni. Az átadást a több szabad ponttal rendelkező készülék írja alá; egy ellopott
készülék csak a saját részét adhatja oda, és csak a te másik készülékednek. Az ára: egy készülék csak a maga tett pontjait rendezheti
át — a laptopon tett pontot a telefonról levéve azt a laptop hajtja végre, amikor legközelebb fut, és a lap ezt meg is mondja.*
- ✓ **Az irány jó, és a D42-t megtartja:** az átadás az adó láncában van (a része onnan egyetlen eseményből látszik), a fogadó a saját
  láncában veszi át (az adó aláírt átadására hivatkozva — kétszer nem veheti át). Az adás oldalán a tolvaj valóban nem nyer semmit.
- ⛔ **A fogadás oldalán viszont igen** (93. (g)): ha a tolvaj minden szabad pontját azonnal elhelyezi, a „több szabad pont ad” szabály
  miatt a becsületes laptop minden találkozáskor utánatölt — 10 találkozás után a tolvajnál 4996 (a saját 1000-es részének ötszöröse,
  a laptop teljes szabad kerete). A találkozáshoz nem kell egy hálózat: a két készülék az interneten is megtalálja egymást.
- ⭐ **A javítás: egy fogadó-oldali határ** — magától csak addig folyik, amíg a fogadó része (elhelyezett + szabad) el nem éri a határt;
  fölötte az ADÓ készülék megkérdez (az adó a te kezedben lévő, becsületes készülék — a tolvaj ezt nem tudja átállítani). Mérve: 2000-es
  határnál a tolvajnál 2000 marad, akárhány találkozás után; a becsületes telefon (napi 300) 10 napból egyszer sem akadt el. ⭐ A határ
  így az adó készülék SZABÁLYA, nem a magé: a mag csak az átadást ellenőrzi (azonos azonosság, nem kizárt fogadó, az adó szabad részéből).
  Kettőnél több készüléknél a tolvaj legfeljebb a becsületes készülékenkénti határok összegét gyűjtheti — ezt a lap mutassa.
- ✓ **Az ár elfogadható**, de egy kérdést nyit: mi lesz egy **elveszett** készülék elhelyezett pontjaival, ha az már soha nem fut? → **KU7**.

**8.2 A kizárás** (a KU2-höz): *ahol egy koinó nincs felsorolva a kizárásban, ott a kizárt készülék egyetlen eseménye sem számít — így
egy tolvaj egy új koinóban sem léphet fel a nevedben.*
- ✓ Egyetértek. **Kimondva két következménye:** (1) ez visszamenőleges — a D47 (az ellenőrzés az aláírás pillanatában történik, és befagy)
  a szabály szigorítását tartja előre hatónak; a kizárás nem szigorítás, hanem annak kimondása, hogy azok az események nem tőled jöttek.
  (2) Egy ELVESZETT (nem ellopott) készülék becsületes eseményei egy olyan koinóban, amiről a többi készüléked nem tud, mind elvesznek. ⭐ A
  készülékeid ezért találkozáskor a koinó-listájukat is kicserélik, hogy a kizárás mindet felsorolhassa.
- A 6. szakasz első határa marad: ahova a kizárás még nem ért el, ott a tolvaj eseménye addig számít.

**8.3 A helyesbítés:** *a hirdetőtábla és a meghívó rekesze már ma sem a személyes kulccsal ír; a személyes kulcsot csak a csere
kézfogása és a kereső-bejegyzések megújítása használja.* — ✓ **Igaz**, a kódban ellenőrizve (`tablaKulcs.js`: a készülék saját
kulcsa, D6; `meghivoRekesz.js`: a meghívóból számolt kulcspár; `titkositas.js` `szemelyesKezfogasAlairasa`; `keresoMegujitas.js`). Az 1.
3. pontja, a 3., a 4. 5. pontja és a 7. ③ lépése javítva — a hálózati rész két helyre szűkül.

**8.4 Az építésben:** az ① magba az átadás (az adó és a fogadó eseménye) és a kizárás örököse (KU7) is bekerül; a határ a ④ lapé
(„📱 Készülékeim”: a részek, a határok, a függő átrendezések — *„a laptop hajtja végre, amikor legközelebb fut”*).

## 9. Az ① mag szerkezete (az építés terve — D128 után, 2026-11-13)

**9.1 Két kulcs az eseményen.** A `szerzo` az azonosság (a név); új aláírt mező a **`keszulek`** (a készülékkulcs nyilvános része — mindig
jelen, és nem lehet a szerző: KU6 (A)); az aláírás a készülékkulccsal. **A lánc kulcsa** a (szerző, készülék) pár — a D118 `lancAga`
horgára: minden, ami LÁNCOT néz (a tár indexe, a sorszám, az előző, az elágazás, az idő-monotonitás, a lánc-gyökér, a D42-állás, az
író), ezt kérdezi; ami az AZONOSSÁGOT (a tagság, a horgony, a meghívás, a tanúsítás, a szavazat, az ellentmondás vádlottja), az a
szerzőt. A pontok (lánc, entitás) szerint állnak, az azonosság pontja egy entitáson ezek összege.

**9.2 A készülék-tanúsítvány** (koinók fölött): `{ azonossag, keszulek, nev, ido }` + az azonosság kulcsának aláírása. **Egy koinóban
a készülék láncának ELSŐ eseménye hozza** — egy új burkolat-mezőben, a `tanusitvany`-ban (mindig jelen; csak a lánc első eseményén nem
üres: az 1. sorszámon, a `Bekapcsolodas`-on és a gyermek születésén, ami a szülőbeli láncot folytatja). *(Az építés pontosítása: egy
külön bemutató esemény a lánc sorszámait eltolná; így a második készülék is ugyanúgy hozza, mint az első — a horgonytól
függetlenül.)* **A kapu** egy eseményt csak akkor enged be, ha a tanúsítványa ismert — a tárból, vagy maga az esemény hozza; különben
„hiányzik” (a csere elkéri, mint ma a gyermek születését). ⭐ Így minden számítás — a tagság és a meghívás is — csak tanúsított eseményt
lát: egy hamis szerzőjű esemény be sem jut. A csomagokba ágyazott eseményeknél (a tagsági csomag, a vád bizonyítéka, a gyermek
születése…) ugyanez: a tanúsítvány a csomagból vagy a tárból. **A lánc kulcsa a gyakorlatban a készülék kulcsa** (43 jel, mint
minden azonosító — a csere így kimondhatja): egy készüléket csak egy azonosság tanúsíthat, a kapu a második azonosság tanúsítványát
elutasítja.

**9.3 A keret** (KU1): láncónként. Az alap a koinó kerete annak a láncnak, amelyik az azonosság horgonyát írta (abban a koinóban az
„első készülék” az, amelyikkel beléptél), a többié 0. A lánc-gyökér harmadik összegzése a **kapott** (adónként a halmozottan átvett
pont) → a D42: `kiosztva ≤ alap + kapott`, egyetlen eseményből. **Az átadás** (`KeretAtadas`, az adó láncában): a kiosztás-fában a fogadó
készülék alatt a halmozott átadott pont (a bemondott összege ezzel nő). **Az átvétel** (`KeretAtvetel`, a fogadó láncában): az adó
aláírt átadását hozza, és a kapott-fában az adó értékét a halmozott átadottra emeli — ugyanazt kétszer nem lehet átvenni, mert a
halmozott érték nem nő tőle. **A határ** az adó őrjáratának szabálya (a lapon állítható — 8.1).

**9.4 A kizárás és az örökös** (KU7): a kizárás-tanúsítvány (az azonosság kulcsa írja alá) megnevezi a készüléket, koinónként a vágást
(sorszám) és az örököst. Egy `KeszulekKizaras` esemény hozza a koinóidba (az örökös írja, mindegyikbe). A felsorolt koinóban a vágás
utáni, a kizárt kulccsal írt események nem számítanak, és **a láncot az örökös folytatja** (a vágás utáni sorszámokon az örökös kulcsa ír
alá): a lánc pontjai és a része így nála vannak, és átrendezheti őket. A fel nem sorolt koinóban a kizárt készülék egyetlen eseménye
sem számít (8.2). Ahova a kizárás még nem ért el, ott addig számít (6.) — a terjesztése a ③ hálózaté.

**9.5 A sorrend az azonosság eseményei között** — ✅ **eldöntve: az idő** (Csaba, 2026-11-14: *„legyen az idő, mehetünk tovább”*): ahol az azonosság UTOLSÓ állítása számít (az
érték javaslat, az állásfoglalás, a profil), ott ma a lánc sorszáma dönt — két készülék láncának sorszámai viszont nem összevethetők. A
4. szakasz 3. pontja a `latott` mintáját javasolta (minden esemény mondja, a többi készülékem láncából meddig látott). ⭐ Az építés
egyszerűbbet javasol: **az idő dönt, mint a szavazatnál ma** (holtversenyben az azonosító) — egy szabály a szavazattal, új mező és új
bájt nélkül; és csak a TE két állításod közül választ (egy rosszul járó óra a saját eseményeid sorrendjét keverheti meg, másét nem —
a lap figyelmeztet, ha a készülékeid órái eltérnek).

**9.6 A lépések** (mindegyik után a teljes próbasor): **①a** az esemény `keszulek` és `tanusitvany` mezője, a lánc kulcsa mindenhol, a készülékkulcs a
gépen és a tanúsítvány a kapuban — egy készülékkel minden úgy megy, mint ma · **①b** a második készülék (a felvétel,
a pontok és az utolsó állítás az azonosságra, a `keszulek` parancs; a próba: két készülék egy azonossággal, offline is) · **①c** a keret
(a kapott-fa, az átadás és az átvétel, az átfolyás a határral) · **①d** a kizárás és az örökös.

**9.8 Az ①b sorrendje** (2026-11-14 — Csaba: *„aztán mehetsz is tovább, folytatólagosan a lépésekkel”*; a szavazat joga: **(A)
készülékenként** — D128 12.): a második készülék pontjai a keret nélkül nem értelmezhetők (az alapszabály nélkül minden készüléknek
teljes kerete lenne — kétszeres keret), ezért az ①b és az ①c EGY lépés: **(1)** az azonosság utolsó állítása időrendben (9.5) ·
**(2)** a keret: az alap a horgony láncáé, a többié 0 + a kapott (az átadás és az átvétel) · **(3)** a pontok az azonosságra összegezve,
a bizonyítékok (a fejléc levelei) láncónként · **(4)** a szavazás: a készülék előbb 1 pontot tesz az érintettre, ha ott nincs pontja.
Mind folyamaton belüli próbával (két készülék, egy azonosság, offline is). A második készülék LÉTREHOZÁSA (a parancs, a lap, a
kézfogás a készülékkulccsal) a ③–④ lépéssel jön — addig a hálózaton egy készülék él.

**9.9 A keret pontos alakja** (az ①b (2) terve, 2026-11-14 — a 9.3 megvalósítása):
- **Egy lánc kerete = az alap + a kapott.** Az **alap** a koinó kerete annak a láncnak, amelyik az azonosság HORGONYÁT írta ebben a
  koinóban (a `Belepes`, a `KoinoLetrehozas`, a `Bekapcsolodas` — a tagság úgyis tudja), minden más láncé 0. A **kapott** a
  lánc-gyökér HARMADIK összegzése (`{ naplo, kiosztas, kapott }`): adó készülékenként a halmozottan átvett pont — a gyökér összege
  a kapott összesen. ⭐ Így a D42 (a bemondott összeg) továbbra is egyetlen eseményből dönt: `kiosztva ≤ alap + kapott`.
- **Az átadás** (`KeretAtadas` — a 9.3 szerint saját típus) **a pont-esemény gépezetével:** a kiosztás-fában a levele a FOGADÓ
  KÉSZÜLÉK kulcsa, a pontja a halmozottan átadott összeg; az adó bemondott összege ettől nő — a D42 és a D81 (a bizonyíték az
  eseménnyel utazik) változatlan. ⭐ Miért nem `TudatpontRendezes`: a halmozott átadás nem csökkenhet (különben a fogadó által már
  átvett pont az adónál is felszabadulna), és ezt egy eseményből csak a típus mondhatja meg — egy készülékkulcs és egy
  entitás-azonosító alakra ugyanaz; az azonosság gondolat-pontjai közé pedig nem is tartozik.
- **Az átvétel** (`KeretAtvetel`, a fogadó láncán): hozza az adó aláírt átadását (ugyanannak az azonosságnak egy készüléke, a fogadó
  kulcsának szól), és a kapott-fában az adó levelét a halmozott összegre emeli (a régi értékének bizonyítékával, mint a pont-esemény).
  ⛔ Ugyanazt kétszer átvenni nem lehet nyerni: a levél a halmozott összeg, nem nő tőle. Ha az átadás maga elbukik (az adó keretén
  túl), az átvétel sem számít.
- **Az átfolyás** (8.1) az adó szabálya (a határral) — a művelet adja; a két készülék találkozása (a hálózat) a ③-ban köti be.
- **Az építés — (2a) az alap** (2026-11-14): `tagsag.js` `alapHorgony` (az azonosság horgonyai közül a LEGKORÁBBI — idő, holtversenyben
  a kisebb azonosító; ha egy második készülék később maga is belép, a keret marad az elsőé) és `azonossagAlapjai`/`alapokAlapja` (a szabály-réteg
  láncónkénti kerete — ADATKÉNT, nem beadott függvényként: D123 PR2), `lancGyoker.js` `lancAlapjai`/`lancAlapKerete` (ugyanaz a tárból — a lánc-gyökér, a művelet, a kapu és az észlelő vád-ellenőrzése
  ezt kérdezi), `muveletek.js` `sajatKeretem` (a szabad pontjaim és a pont-rendezés a KÉSZÜLÉKEM keretével). Ha a horgony nincs meg
  nálunk, a lánc kerete a koinóé (a tagság nélküli pont úgysem számít — D93/1). A próba: `keszulekProba.js` „A KERET A HORGONY
  LÁNCÁÉ” és „A MŰVELET IS A LÁNC KERETÉVEL SZÁMOL” (7 rontás). ⚠️ A vád-ellenőrzés kerete (a bemondás és a folytonosság vádja a
  keretet túllépő pont-eseménynél) most a lánc alapja — próbát a (2b)-vel kap, amikor a kapott miatt a lánc kerete egy ESEMÉNYHEZ
  kötött érték lesz (a vádpontkori kapott, a lánc-gyökérből), nem a láncé egészében.
- **Az építés — (2b) a kapott** (2026-11-14). Az átadás (`KeretAtadas`) a pont-esemény gépezetével (`esemeny.js` `PONT_TIPUSOK`: a
  kiosztás-fa levele, a bemondott összeg — D42 —, a saját bizonyíték — D81 —, a vád), és HALMOZOTT: a szabály a csökkenőt elveti
  (`pontEsemenyMerlege`). Az alakja lánc-gyökeret kíván (különben egy eseményből nem ellenőrizhető). A visszaadás a másik irányú
  átadás.
  · **A lánc-gyökér** `{ naplo, kiosztas, kapott }` (`lancGyoker.js` `KAPOTT_FAJTA`, `lancGyokerGyokerekbol`); a gyorsítótár a kapottat is
    tartja (3. változat), és a lánc alapjához köti a képét.
  · **EGY FORRÁS:** `szabalyok.js` `lancLepese` (a pont-esemény a kiosztásra, az átvétel a kapottra; a keret az esemény előtt az
    alap + a kapott) — a szabály-réteg, a saját lánc-gyökér és a művelet (`sajatKiosztott`) ugyanezt hívja. Hézagnál a kapott az
    esemény aláírt kapott-gyökeréből (mint a D81-nél az összeg).
  · **Az átvétel ítélete egy eseményből** (`keretAtvetelMerlege`): az átadás az azonosság egy másik készülékének ide szóló
    `KeretAtadas`-a, a saját bizonyítékával megáll, és belefér az adó akkori keretébe (az alapja + az aláírt kapottja); a fogadó
    levele csak NŐHET (az ismételt átvétel nem hoz semmit). Az adó bizonyított vádpontja után az átadásai nem számítanak.
  · **A kapu** az átvétel átadásának aláírását és tanúsítványát (a tárból vagy a mellékelt `tanusitvanyok`-ból) és a kapott-fa
    bizonyítékát nézi (`keretAtvetelOnbizonyitasa`).
  · **A vád** (`ellentmondas.js`): a hívó a lánc ALAPJÁT adja, a kapottat a vádolt esemény aláírt előképe (a vádpontkori kapott).
    ⏭️ A kapott-fa folytonosságának vádja (két szomszédos esemény kapott-gyökere nem egymásból jön) a (2c) után, saját lépésben.
  · **A művelet:** `keretAtadasa(kornyezet, kinek, tobblet)`, `keretAtvetele(kornyezet, atadas)` (előre ugyanazzal az ítélettel —
    nem számító átvételt nem ír alá); `sajatKeretem` = az alap + a kapott. A keret mozgása koinónként él: a gyermek jelenébe nem
    jön át (`koinoLanc.js` `JELENBOL_KIZART`).
  · A próba: `keszulekProba.js` „A KERET ÁTADÁSA ÉS ÁTVÉTELE”, „A KERET NEM SZAPORODHAT”, „CSAK A MÁSIK KÉSZÜLÉKEM IDE SZÓLÓ
    ÁTADÁSA”, „AZ ÁTVÉTEL EGY ESEMÉNYBŐL ELLENŐRIZHETŐ” (20 rontás — a (2a) próbái az adatként átadott alappal újra).
- **Az építés — (2c) az átfolyás** (2026-11-14): `muveletek.js` `atfolyasMerteke` (a 93. (g) modellje: a több szabad ponttal
  rendelkező a különbség FELÉT adja, de a fogadó része — elhelyezett + szabad — nem lépheti túl a határt) és `keretAtfolyasa(kornyezet,
  kinek, { hatar })` (a két lánc állásából a táramban; a még át nem vett átadásom a fogadó részéhez és szabadjához számít — különben
  minden találkozáskor újra adnék). A próba: „AZ ÁTFOLYÁS A HATÁRIG” (3 rontás). ⏭️ Hogy MIKOR fut (a két készülék találkozása), az
  a ③; a határ beállítása a ④ lapé. ❓ A határ ALAPÉRTÉKE nyitott — Csaba dönti el, amikor a ③ magától futtatja (a 93. (g) a 10 000-es
  keretnél 2000-et és 3000-et mért).
- **Az építés — (3) az azonosság pontja a készülékei összege** (2026-11-14): a pont a LÁNCÉ (láncónként az utolsó), az azonosság
  pontja egy entitáson a láncai összege — `allapotSzamitas.js` (a hozzájárulók, a kiosztási főkönyv; a szerep aktív, ha bármely
  pozitív lánca aktív), `javaslatSzamitas.js` (a tulajdonos, a javaslat-entitás pontja; a nevező bizonyítéka a legkisebb azonosítójú
  pozitív aktív láncé). Az össz-pont levele a szerzőé marad (az egyezmény átvitele szerzőnként visz pontot), és a láncai
  pont-eseményeinek ÖSSZEGE: egy készüléknél egy azonosító (semmi nem változik), többnél a lista — a kérdező mindet ellenőrzi
  (különböző láncok, mind a szerzőé, az összegük a levél; legfeljebb 16), a tartó mindet elküldi (`osszegzoTartas.js`).
  ⭐ Közben kiderült: a döntés számításában az érték javaslat még a sorszámot nézte két készülék között is (a ①b (1) kimaradt
  helye) — most az időt (`kesobbiAllitas`). A kereső (K3) bejegyzése tulajdonosonként egy pont-eseményt visz — egy azonosság egyszer
  számít, a rangsora a legnagyobb láncáé (a lap ④ mondja meg, ha ez számít). A próba: `keszulekProba.js` „AZ AZONOSSÁG PONTJA A
  KÉSZÜLÉKEI ÖSSZEGE” (az állapot, a fejléc a tartó mintáival, a hamis levél) és „A DÖNTÉSBEN IS” (10 rontás).
- **Az építés — (4) a szavazás és a javaslattétel joga készülékenként** (12. pont, Csaba: (A)): ahol ennek a készüléknek nincs
  pontja, de az azonosságnak (egy másik készüléknek) van, a művelet előbb magától 1 pontot tesz rá a saját részéből
  (`muveletek.js` `keszulekPontjaHaAzonossagome`) — a jog így a saját láncából bizonyítható (D85). Ha a készüléknek nincs szabad
  pontja, a pont-rendezés kimondja (a keret az átadással jön). A próba: „A SZAVAZÁS ÉS A JAVASLAT JOGA KÉSZÜLÉKENKÉNT” (a javaslat,
  a szavazat, és az idegen gondolat, ahol nem tesz pontot — 5 rontás).

**9.7 Az ①a építése — ami közben kiderült** (2026-11-13/14):
- **A tanúsítvány a láncán kívül utazó eseménnyel is utazik.** A 9.2 szerint a lánc első eseménye hozza — de egy esemény sokszor
  NÉLKÜLE utazik: egy szelet a cserében, egy tagsági kísérő, egy kérelem vagy egy összegző válasza, egy döntési csomag, egy
  kereső-bejegyzés. A fogadónál a lánc első eseménye (más szeleté) gyakran nincs meg — és a kapu ezért elutasította volna (a
  próbasor 1276 próbájából 84 bukott ezen). ⭐ A megoldás három darab:
  - **a kísérő burok** (`esemeny.js` `KISERO_MEZO` = `kiseroTanusitvany`): a küldő az esemény mellé teszi a készülék tanúsítványát,
    egy ALÁÍRATLAN mezőben (nincs a lenyomatban — az esemény neve és aláírása változatlan); a kapu ellenőrzi (önmagát igazolja), és
    az eseményt NÉLKÜLE menti. A vonal készülékenként az első küldött eseményhez teszi (`kiseroAdo`), a kérelem, az összegző és a
    kereső-bejegyzés minden eseményhez (ott a fogadó egyenként ellenőriz);
  - **a csomagok** a belső eseményeik tanúsítványát viszik (a döntési és a tagsági csomag `tanusitvanyok` mezője), és a kapu a
    csomag beágyazott eseményeinek tanúsítványából a csomag szerzőjét is igazolja;
  - **a készülék tanúsítvány-jegyzéke** (`tar/tanusitvanyJegyzek.js`, `<adat>/tanusitvanyok.jsonl` — koinótól független, mert a
    tanúsítvány is az): amit a kapu mellékelve kapott (vagy a lánc első eseményéből), azt feljegyzi; a tár ebből is felel, és az
    átmeneti tár eldobott eseményével a tudás nem vész el.
- **A várakozó sor:** ami a tanúsítványa előtt érkezik (a köteg sorrendje nem a láncé), azt a kapu tárolónként egy korlátos,
  memóriabeli sorba teszi, és amint a tanúsítvány bejön, újra a kapura engedi (`esemenyTar.js`). A csere kötegében a tanúsítványt
  hozó események mennek előre. ⚠️ Egy cserén belül később bejött eseményt a futó csere állása még nem hirdet — a következő igen.
- **A lánc kulcsa a csere állásában** is a készüléké (a mező neve `szerzo` maradt — a ③ hálózati lépés nevezi át).
- **A kézfogás** még az azonosság kulcsával bizonyít — a ③ teszi át a készülékkulcsra.
- **A D124 (a protokoll nyelvváltozata) két „valódi régi program” próbája** ismert hiba: a git-ből vett régi program a D128 előtti
  család — a mai eseményt (a készülék írja alá) elveti, és a mai kapu a régit; az első D128 utáni régi programmal áll helyre.

*Kapcsolódik:* [`terv_kulcs.md`](terv_kulcs.md) (a tervező ág — ET-3), [`terv_atutalas.md`](terv_atutalas.md) (ET-11 — a fizetési kulcs),
`meres/eredmenyek.md` 93., `js/kulcs/kulcsTar.js`, `js/allapot/szabalyok.js` (D42), `js/allapot/allapotSzamitas.js` (az elágazás).
