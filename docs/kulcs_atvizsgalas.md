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

**9.10 A kizárás és az örökös — a pontos alak** (az ①d terve, 2026-11-14 — a 9.4 és a KU7 (A) megvalósítása):
- **A kizárás-tanúsítvány** (`KeszulekKizaras` — az azonosság kulcsa írja alá, mint a készülék-tanúsítványt; koinók fölött):
  `{ tipus, azonossag, keszulek, koinok: [{ koino, vagas, orokos }], ido, alairas }`. A `keszulek` a kizárt; koinónként a VÁGÁS (a
  kizárt lánc utolsó még érvényes sorszáma — 0: egy sem) és az ÖRÖKÖS (az azonosság egy másik, tanúsított készüléke); a koinók
  rendezve, egyszer. Egy készüléket egyszer lehet kizárni (az első hiteles tanúsítvány számít — a második nem írhatja át a vágást).
- **Az esemény** (`Kizaras` — a tanúsítványt hozza a koinóba): a felsorolt koinókba az örökös írja (a saját láncán, az azonosság
  szeletébe); ⭐ és BÁRKI beviheti, akihez eljutott (mint az ellentmondás bizonyítékát — D80): a tartalma önmagát igazolja. Így jut el
  a fel nem sorolt koinóba is (a terjesztése a ③ hálózaté — 6. szakasz: ahova még nem ért el, ott addig számít).
- **A számítás:** egy koinóban, ahol a kizárás megvan, a kizárt kulccsal aláírt események a vágás UTÁN nem számítanak (a fel nem
  sorolt koinóban egyik sem — a vágás 0); nem elágazások, nem vádak — egyszerűen nem a te eseményeid (8.2: nem a szabály szigorítása,
  hanem annak kimondása, hogy nem tőled jöttek).
- **A folytatás:** a felsorolt koinóban a kizárt LÁNCÁT az örökös folytatja a vágás utáni sorszámokon — az eseményein egy új, aláírt,
  nem kötelező mező: `lanc` (a folytatott lánc kulcsa; `lancKulcsa(e) = e.lanc ?? e.keszulek`). A kapu csak akkor engedi be, ha a
  koinóban megvan a kizárás, az író az örökös, és a sorszám a vágás után van. ⭐ Így a lánc pontjai, a kerete (alap + kapott) és a
  szabad része az örökösnél vannak, és átrendezheti őket — a D42 gépezete változatlan, a lánc ugyanaz.
- **A próba:** két készülék, a telefon „ellopva”: a vágás után írt eseményei nem számítanak; a laptop folytatja a láncát (a pontjait
  átrendezi); egy idegen koinóban a telefon minden eseménye kiesik, amint a kizárás odaér; a hamis kizárás (más kulcs írta, más
  azonosság, nem tanúsított örökös) a kapun elbukik.
- **Az építés — ①d** (2026-11-14): `kulcs/keszulek.js` (`kizarasKeszitese`, `kizarasEllenorzese`, `kizarasKoinoban`), `allapot/kizaras.js`
  (`kizartakSzurese` — a számítás elején, az elágazás előtt; `kizartE`: csak a SAJÁT azonosság zárhat ki; több kizárásból a
  legkésőbbi; `tarKizarasai` — a saját lánc műveleteihez az azonosság eseményeiből), az esemény `lanc` mezője (`lancKulcsa`), a kapu
  (a kizárás aláírása; a folytatott láncot csak az örökös, a vágás után; a kizárt esemény nem elágazás), a lánc vége és a saját
  lánc-gyökér a kizárt események nélkül, `muveletek.js` `keszulekKizarasa` / `kizarasBevitele` (a folytatás: a környezet `keszulek`-je
  a kizárt lánc). Az állapot kimondja: `kizartak`. ⭐ A tár a `Kizaras` eseményeket a tanúsítvány azonossága szerint indexeli
  (`fajlTar.js` `kizarasEsemenyei`, a pillanatkép 5. változata): a kapu MINDEN eseménynél kérdezi — index nélkül az azonosság összes
  eseményének testét betöltené (a mérés: a képből nyitott tárban a kérdés egy testet tölt be). ⛔ Lelet: a pillanatkép alakjának
  ellenőrzése a mezők számát is nézi — az új mezővel minden kép eldobódott volna (néma lassulás); a próba fogta meg. A próba: „A
  KIZÁRÁS ÉS AZ ÖRÖKÖS”, „A FEL NEM SOROLT KOINÓBAN” (18 rontás). ⏭️ A
  kizárás terjesztése (a koinó-listák cseréje a készülékek között, a más által bevitt kizárás) a ③ hálózaté; a kezelése (a parancs, a
  lap) a ④-é. ⚠️ A folytatott lánc műveleteihez a kizárást az örökös saját `Kizaras` eseménye adja (a felsorolt koinókba ő viszi).

**9.11 A ② terve — a csere-kulcs lekötése, a kulcscsere, a mentés** (2026-11-15; ✅ **eldöntve** — Csaba: KC1 (A), KC2 (A), KC3 (A);
D128 13–15.):
- **A mai helyzet** (a kódban): az azonosság NEVE a nyilvános kulcsa (`kulcsTar.js`, a `szerzo`), a készülék-tanúsítványt ez a kulcs
  írja alá, és az ellenőrzés a névből veszi a kulcsot. A mentés ma a teljes kulcspár egy fájlban (`mentes` parancs). Csere-kulcs nincs.
- **A cél** (6. és 7. pont, terv_kulcs 5.1): az azonosság születésekor a KÖVETKEZŐ kulcs (a csere-kulcs) előre le van kötve — a láncon
  csak a lenyomata áll, maga a kulcs papíron vagy fájlban van, egyik készüléken sem. Ha az azonosság kulcsa elvész vagy ellopják, a
  csere-kulcs aláír egy kulcscserét (új kezelő kulcs, új lekötés); a tolvaj, akinél csak a régi kulcs van, nem cserélhet kulcsot. A
  születés a fizetési kulcs nyilvános részét is leköti (KU4 (A)).
- ⛔ **A gond, amit az építés előtt meg kell oldani:** ha a név maga az első kulcs (KU3 (A) mai olvasata), akkor a lekötés csak egy
  aláírt születés-tanúsítvány — és aki a kulcsot ellopta, aláírhat egy MÁSIKAT (a saját csere-kulcsával), és egy új koinóban azt
  mutathatja be. Az idő önbevallás (visszadátumozható); a „melyiket látták előbb” a hálózaté, és egy új koinó tagjai az eredetit nem
  látták. ⭐ A KERI megoldása: a NÉV A SZÜLETÉS LENYOMATA („önmagát címző azonosító”) — a születés az első kulcsot, a csere-kulcs
  lenyomatát és a fizetési kulcsot együtt köti, és a név ebből jön: ugyanarra a névre más lekötés nem létezhet.
- **KC1 — A lekötés köteléke:** (A) ⭐ **a név a születés lenyomata** — a születés (`{ kulcs, csere, fizetes, ido }`) minden koinóban a
  horgonnyal utazik, a tanúsítványok ellenőrzése belőle (és a kulcscserék láncából) veszi a mostani kezelő kulcsot; a név továbbra is
  43 jel, és a kulcscsere után is marad (KU3 (A) szelleme: a név nem változik). Ára: a név már nem maga a kulcs — a tanúsítvány
  ellenőrzéséhez a születés is kell (a horgony hozza). (B) a név marad az első kulcs, a születés egy külön tanúsítvány — egy tolvaj egy
  új koinóban más lekötést mutathat be; az elsőként látott számít, a terjesztés a ③-é.
- **KC2 — A kulcscsere után a régi kulccsal aláírtak** (a készülék-tanúsítványok, a kizárások): (A) ⭐ **a kulcscsere felsorolja a
  megmaradó készülékeket** — a többi (a tolvaj által a régi kulccsal felvett is) érvénytelen, a felsoroltak újra-tanúsítás nélkül
  maradnak; (B) ami a régi kulccsal a csere IDEJE előtt készült, marad — ⛔ az idő önbevallás, a tolvaj visszadátumozhat; (C) minden
  készüléket újra kell tanúsítani az új kulccsal (biztos, de minden készüléket elő kell venni).
- **KC3 — A csere-kulcs helye a születés után:** (A) ⭐ **csak a mentésben** — a születéskor a készülék megmutatja (papírra: szavak +
  QR; fájlba), megkéri, hogy mentsd el, és utána TÖRLI magáról (a terv: „egyik készüléken sincs”); (B) a készüléken is marad,
  jelszóval titkosítva — kényelmesebb, de egy lopás (a jelszó kitalálásával) viheti.
- **A sorrend az építésben** (a döntés után): ②a a születés és a név (KC1), a horgony hozza, a tanúsítványok ellenőrzése belőle →
  ②b a kulcscsere-tanúsítvány és a kezelő kulcs a láncból (KC2) → ②c a mentés és a visszaállítás (KC3; a mai `mentes` /
  `visszatolt` helyett: a csere-kulcs papíron vagy fájlban; a lap a ④-ben). ⛔ A mag változik → új koinó-család (mint a D128 eleje).
- ⭐ **Az építés közben kiderült — a ③ két pontja ELŐRE kell** (2026-11-15): a csere kézfogása (`titkositas.js`
  `szemelyesKezfogasEllenorzese`) és a kereső megújítása (`keresoMegujitas.js`) a NEVET használta ellenőrző kulcsként — a KC1 (A) után
  (a név a születés lenyomata) eltörnének. ✅ **③a:** mindkettőt a KÉSZÜLÉK kulcsa írja alá (D128 10. pont): a kézfogásban a személy
  `{ sz, k, t, h, a }` — a készülék kulcsa (`k`) és a tanúsítványa (`t`, szinkron ellenőrizve: `keszulekKezfogasEllenorzese`); a
  megújítás `{ szerzo, k, ido, alairas }` — az a készülék újít, amelyiknek a pozitív pont-eseménye a csomagban van (az köti a kulcsát a
  szerzőhöz, tanúsítvány nélkül: `tulajdonosKeszulekeE`). A hálózaton az azonosság kulcsa ezzel már semmit nem ír alá. A próba:
  titkositas (a személyes aláírás — az idegen, a hamis tanúsítvány, az azonosság kulcsával írt aláírás nem elég), keresotar (L3) —
  5 rontás.
- ✅ **Az építés — ②a a születés és a név** (2026-11-15): `kulcs/azonossag.js` — a születés `{ tipus, kulcs, csere, fizetes, ido,
  alairas }` (az első kulcs írja alá), a NÉV a születés aláírt részének lenyomata (`azonossagNeve`; szinkron is, a kézfogásnak), a
  csere-kulcs lenyomata (`csereLenyomata`), `ujAzonossag`. A készülék- és a kizárás-tanúsítvány a születést HOZZA (+312 B — a
  tanúsítvány 605 B, 94. mérés): az ellenőrzés helyben nézi, hogy a név a születés lenyomata, és a születés kulcsa írta alá (a
  kulcscserék láncát a ②b teszi hozzá). `kulcsTar.js`: az azonosság a születéssel és a fizetési kulccsal a gépen; a régi (születés
  nélküli) kulcsfájl születést kap — a NÉV megváltozik (új koinó-család); a csere-kulcs kiadásra megy (`csereKulcsKiadasa` —
  `koino.js` a `csere-kulcs.json`-ba írja, és amíg ott van, minden induláskor szól: vidd el, töröld; a papír a ②c-vel). ⛔ **Lelet:**
  a mentés (`kulcsparKimentese`) csak a kulcsot vitte — a visszatöltés ÚJ születést (új nevet) adott volna, az azonosság elveszett
  volna; most a születést és a fizetési kulcsot is viszi (a próba fogta meg). A próba: keszulek („A NÉV A SZÜLETÉS LENYOMATA”, és a
  tolvaj a saját kulcsával szabályosan aláírt tanúsítványa egy idegen névre — csak a név szabálya állítja meg), kulcs (a születés, a
  csere-kulcs, a régi fájl, a mentés), titkositas (ugyanez a kézfogásban) — 8 rontás.
- ✅ **Az építés — ②b (1) a kulcscsere lánca** (2026-11-15): `azonossag.js` — a kulcscsere `{ tipus, azonossag, sorszam, csere, kulcs,
  kovetkezo, keszulekek, ido, alairas }` (a CSERE-KULCS írja alá; a lenyomata az előző lekötés — az elsőnél a születésé, utána az előző
  cseréé; a `kovetkezo` az új lekötés; a `keszulekek` a megmaradók — KC2 (A)), `kezeloKulcsLanc` (korszakonként a kezelő kulcs és a
  megmaradók). A tanúsítványok (a készüléké, a kizárásé) a cserék láncát is hozzák (`cserek` — csere nélkül nincs, a tanúsítvány a
  régi), és a lánc VÉGÉN álló kulcs írja alá őket; a kézfogás szinkron ugyanígy. ⛔ **Lelet:** a lánc-ellenőrzés emlékezetének kulcsa
  csak az aláírásokból állt — egy átírt tartalmú, de a régi aláírást hordozó csere a korábbi „rendben” eredményt kapta volna; most a
  teljes tartalom a kulcs (a próba fogta meg). A próba: „A KULCSCSERE LÁNCA” — a tolvaj a régi kulccsal nem cserélhet (a lekötés nem az
  övé), a régi csere-kulcs nem írhatja alá a 2. cserét, az átírt csere, a rossz sorszám, a hiányzó láncszem, a régi kulccsal írt „új”
  és a lánc nélküli új tanúsítvány elbukik, a kapu és a kézfogás útján is — 8 rontás.
- ✅ **Az építés — ②b (2)–(3) a kulcscsere után; a gépen és a parancs** (2026-11-15): a `Kulcscsere` esemény a születést és a cserék
  láncát hozza (bárki beviheti, mint a kizárást; a kapu a láncot ellenőrzi), a tár a kizárásokkal egy indexben tartja (`kezelesEsemenyei`,
  a pillanatkép 6. változata). A számítás (`allapot/kizaras.js` `kizartakSzurese`): egy azonosság LEGUTÓBBI cseréje (a leghosszabb lánc)
  után a régebbi korszakban tanúsított, nem felsorolt készülék eseményei kiesnek (kimondva: `kizartak`); a csere után az új kulccsal
  felvett készülék korszaka a hozott cserék száma — az marad. Ha egy készülék korszaka nem ismert (a lánca első eseménye — a
  tanúsítvánnyal — nincs a bemenetben), az eseménye számít (D19); a kapu a kiesett készülék ÚJ eseményét a tárban lévő tanúsítványa
  szerint elveti. `kulcsTar.js` `kulcscsereVegrehajtasa`: a csere-kulccsal (a mentésből) új kezelő kulcs és új lekötés, a név marad, a
  tároló a láncot tartja (betöltéskor a tárolt kulcs a lánc VÉGÉN álló kulcs kell legyen), a mentés a láncot is viszi; a régi (már
  felhasznált) csere-kulcs nem cserélhet. `muveletek.js` `kulcscsereBevitele`, `koino.js` `kulcscsere <csere-kulcs.json> [készülékek…]`
  (alapból ez a készülék marad; az új csere-kulcs a `csere-kulcs.json`-ba). A próba: „A KULCSCSERE UTÁN” (két cserével is), kulcs („a
  KULCSCSERE a gépen”), parancssor (a parancs) — 11 rontás. ⏭️ ②c: a mentés papíron (szavak + QR); a ③-ban a csere és a kizárás
  terjesztése a készülékek között, a ④ lapon a „📱 Készülékeim”.
- ✅ **Az építés — ②c a csere-kulcs papíron** (2026-11-15 — KC3 (A), KC4 (A)): `kulcs/papir.js` — a kód 56 jel, 14 csoport × 4: az
  első a változat, 52 a csere-kulcs 32 bájtos magja (Crockford-féle base32: az I, L, O, U nélkül), 3 az ellenőrzés. A visszaolvasás
  elnéző a téveszthető jelekkel (kisbetű, O → 0, I és L → 1, a csoportok elválasztása), a kulcspár a magból áll vissza (PKCS#8 — a
  nyilvános fele vele). ⭐ **Az ellenőrzés a jelek helyükkel súlyozott összege a 32 749 prím szerint** — így BIZTOSAN kimond minden
  egyetlen elírást és két jel minden felcserélését (az első változat a kulcs SHA-256-jából vett 15 bitet: az ugyanezt csak
  valószínűséggel tudta); ami mégis átcsúszna, az a kulcscserén a lekötésen akad el. `kulcs/qr.js` — saját QR-kódoló (nulla függőség,
  az ISO/IEC 18004 szerint): alfanumerikus és bájt mód, 1–40. verzió, L/M/Q/H, Reed–Solomon, a nyolc maszk büntetése; a terminálba a
  VILÁGOS modulok rajzolódnak (▀ ▄ █ — a terminálon a szín rögzítve, fehér a feketén). A csere-kód QR-je Q szint (a negyede sérülhet):
  az 5. verzió, 37×37 modul. `koino.js`: `papir` (a 14 csoport és a QR), `papir kesz <a leírt kód>` (a LEÍRT kódot összeveti a gépen
  lévő fájléval, és ha egyezik, a fájlt törli — a KC3 (A) „megkéri, hogy mentsd el, és utána törli magáról”-ja: a törlés előtt
  kiderül, ha a leírásba hiba csúszott), `kulcscsere <a kód>` (egyben vagy csoportonként). ⛔ **Lelet (a kézi kipróbálásból):** a
  `kulcscsere` a koinón kívül (ahol az azonosságnak nincs szelete) „Nem sikerült”-et írt — pedig a gépen a kulcs már kicserélődött, és
  a régi csere-kulcs elhasználódott; most ELŐBB a csere eredménye és az új csere-kulcs helye íródik ki, és a koinóba vitel `null`, ha
  ott nincs mit bevinni (a lánc a tanúsítványokkal jár). A próba: `papirProba.js` (15) — a kód oda-vissza, elnézően, kimerítően minden
  elírás (56 hely × 31 jel) és minden csere; a QR a szabvány ismert értékeivel (a „HELLO WORLD” 1-M kódszavai, a formátum 32 bitsora, a
  verzió bitjei, a teljes alfanumerikus kapacitás-tábla 160 pontja — a hibajavító táblák MÁSIK forrása —, az igazító minták helyei) és
  egy a kódolótól FÜGGETLENÜL írt próba-olvasóval (az 1–40. verzió mind a négy szinten, a maszkokkal; a Reed–Solomon szindrómák
  külön táblával); parancssor (a `papir`, a `papir kesz` elírt, idegen és jó kóddal, a kulcscsere a kódból, a koinón kívül) — 20
  rontás. ⚠️ A QR végső próbája a telefon kamerája (⑤ terep). ⭐ A ② a papírral ezzel kész; ⏭️ a D128 17. pontja (a helyreállítás a segítőkkel — 9.13) ②d–②f-ként, utána a
  ③ a hálózat (a kizárás és a kulcscsere terjesztése, a koinó-lista a készülékek között; az átfolyás határának alapértéke — Csaba döntése).

**9.12 A ③ terve — a hálózat: a saját készülékek találkozása és a kezelés eljuttatása** (2026-11-15; ✅ KH1 és KH2 eldöntve
2026-11-16)

*Ami már eldőlt (D128):* a készülékek találkozáskor kicserélik a koinó-listájukat (4. pont); a keret magától átfolyik, amikor
találkoznak — a fogadó-oldali határig, a határ az adó szabálya (a lapon állítható), fölötte az adó megkérdez (5. pont); a kézfogás és
a kereső megújítása a készülékkulccsal (10. pont — ✅ ③a). Ami a ③-ban épül:
- **③b A kezelés minden koinómba — helyben.** A kizárás és a kulcscsere egy-egy koinóba bevitt ESEMÉNY: egy másik koinó csak akkor
  tud róla, ha ott is bekerül. ⛔ Ma egy kulcscsere csak abba a koinóba jut, ahol a parancsot kiadták — a többiben a tolvaj által
  felvett készülék tovább számít. Ezért minden készülék, amikor fut, a SAJÁT összes koinójába beviszi az azonossága kezelését: a cserék
  láncát (a `kulcs.json`-ból, vagy amit bármelyik koinójában lát) és a kizárásokat (amit bármelyik koinójában lát; a felsorolt
  koinókba, és abba, ahol a kizárt készüléknek eseménye van).
- **③c A saját készülék a cserében.** A kézfogás a társ nevét a készülék tanúsítványával bizonyítja (③a) — ha a név az enyém, a társ
  a saját készülékem. Ilyenkor (1) a nekem szóló keret-átadást magától átveszem (`keretAtvetele`); (2) ha nálam több a szabad pont,
  átadok a határig (`keretAtfolyasa`); a határ fölött nem adok magától (a kérdés a ④ lapé).
- **③d A koinó-lista.** A saját készülékek a titkosított cserében megmondják egymásnak, mely koinókban vannak, és ott hol tart a
  láncuk (csak a saját készülék kapja; a láncra soha — D6). Ebből készül a kizárás koinónkénti vágása: a felsorolt koinóban a vágásig
  megmarad, ami jogos volt; a fel nem soroltban minden kiesik.
- **③e** A csere állásában a lánc mezője `szerzo` → `lanc` (belső átnevezés).

*A kérdések:*
- **KH1 — az átfolyás határának alapértéke.** A határ: a fogadó készülék része (elhelyezett + szabad pontjai) magától legfeljebb
  ennyi lehet — vagyis ennyi a legtöbb, amit egy ellopott készülék vihet (93. (g)). A keret ma 10 000. A 93. (g) becsületes
  használata (a telefon naponta 300-at tesz le, a 3. naptól 150-et levesz, esténként találkozik a laptoppal) 10 nap alatt sem
  2000-es, sem 3000-es határnál nem akadt el. Ha a telefon a fő eszközöd, és sok pontot tesz le, egy alacsony határ hamarabb
  megállítja — akkor az adó (a laptop) kérdez, a határ pedig a lapon (④) készülékenként átírható. (A) a keret 20%-a (2000);
  (B) 30% (3000); (C) a fele (5000); (D) nincs magától átfolyás, minden átadás kérdez.
  ✅ **Eldöntve (2026-11-16) — (A), személyre szabható alapértékként.** Csaba: *„jó a 2000, de írdfel, hogy ezek az értékek,
  személyre szabhatók lesznek majd.”* Vagyis a 2000 csak az ALAPÉRTÉK — az, ami addig érvényes, amíg az e-ember át nem írja; a
  határt mindenki maga szabja meg, készülékenként (a lapon — ④). A keret (10 000) nem ilyen: az mindenkinek ugyanannyi (a tudatpont
  alapelve).
- **KH2 — ahová egyik másik készülékem sem jár.** Ha az ellopott telefon egy olyan koinóban is tag, ahol egyik másik készüléked sem
  (a laptop sem): a kizárást és a kulcscserét oda csak az viheti be, aki ott van. (A) a koinó-lista a koinó nevét hozza, és a
  kezelő készülék (ahol a kizárást vagy a kulcscserét kiadod) magától csatlakozik oda — csak a bevitelhez (pontja ott nincs, a láncán
  egy-két esemény); (B) nem: ott a tolvaj készüléke tovább számít, amíg valamelyik másik készüléked be nem lép oda. ⚠️ Amit a
  telefon az utolsó találkozás UTÁN lépett be, arról a laptop egyik esetben sem tud.
  ✅ **Eldöntve (2026-11-16) — (A).** A példa, amin Csaba eldöntötte: a telefon a „Kertváros”-ban és az „Olvasókör”-ben tag, a
  laptop csak a Kertvárosban; az Olvasókörben a telefon tartja a koinó TELJES keretét (az írta a horgonyt — `tagsag.js`
  `alapHorgony`), és a KH1 határa sem fékezi (az csak két saját készülék között számít). Csaba: *„IGEN MEHETÜNK TOVÁBB”*.

*Az építés:*
- ✅ **③b — a kezelés minden koinómba, helyben** (2026-11-16): `allapot/kezelesTerjesztes.js` — a KEZELÉS-JEGYZÉK (`kezeles.json`,
  készülék-szintű helyi feljegyzés, mint a társ-lista): a legerősebb kulcscsere-lánc (a születésével és a benne álló helyreállítások
  bizonyítékaival) és a kizárások, amit a készülék BÁRMELYIK koinójában látott, és a saját kulcsfájljának lánca. `muveletek.js`
  `kezelesGondozasa`: egy koinóban a jegyzékbe veszi, amit ott lát, és ha az azonosságnak ott szelete van, beviszi, ami onnan hiányzik
  (előbb a láncot — a kapu így a helyreállításait is felveszi —, utána a kizárásokat). ⭐ A jegyzék csak gyorsítótár: a kapu mindent
  újra ellenőriz. Amit a kapu elvetett (pl. ezt a készüléket a kulcscsere nem sorolta fel), azt egy napig nem próbálja újra abban a
  koinóban. Bizonyíték nélkül egy helyreállítást tartalmazó láncot nem visz be (kimondja). `koino.js`: a gondozás minden parancs
  elején és az őrjárat minden körében (az éppen futó koinóba — a családi őrjárat a család minden koinójába); a `kulcscsere` és a
  `papir visszavon` MINDEN koinóba beviszi (`kezelesMindenKoinomba` — a tér koinói); a `helyreallitas befejez` a láncot a
  bizonyítékokkal a jegyzékbe írja (a kulcsfájl a bizonyítékot nem őrzi). ⭐ **Új parancs: `kizar`** — a készülékeim listája (a
  tanúsítványuk neve, koinónként a láncuk vége, a kizártak); `kizar <készülék — a neve vagy a kulcsa eleje> [orokos <készülék>]` a
  kizárás: koinónként a VÁGÁS a kizárt lánc vége, ameddig ez a készülék ismeri (a koinó-lista — ③d — nélkül is: ahol a kezelő is
  tag, a saját tárából tudja), az örökös ez a készülék; a kizárás minden koinómba bekerül. ⚠️ A kizárás a terv „a felsorolt koinókba,
  és ahol a kizárt készüléknek eseménye van” helyett MINDEN koinómba megy, ahol az azonosságomnak szelete van: egy tolvaj a telefonnal
  később is írhat egy olyan koinóban, ahol tag vagyok — ott a kizárás már várja. A próba: `kezelesProba.js` (a jegyzék; a terjesztés
  az A koinóból a B-be — ott a telefon eseménye kiesik —, másodszor semmi, ahol nincs szeletem, oda semmi; az elvetés egy napig), a
  helyreállítás a bizonyítékkal a másik koinóba (`helyreallitasProba.js`), a parancssor (a `kizar` listája és a kizárás két koinóba;
  egy másik készülékem kizárása az A-ból egy B-beli parancs elején a B-be; a kulcscsere két koinóba; a ②f befejezése a jegyzékbe)
  — 15 rontás. ⚠️ Az őrjárat körének hívását csak a parancsok elejéé méri (ugyanaz a függvény).
- ✅ **③c — a saját készülék a cserében** (2026-11-16): a kapu kötése (a társ tábla-aláírója → a személye) mostantól a társ
  KÉSZÜLÉKÉT is megjegyzi (a bizonyításban benne van) — ebből tudja a csere, hogy a társ a saját készülékem, és melyik. ⛔ **Lelet (a
  terv helyesbítése):** a 9.12 fent azt feltételezte, hogy a kézfogás MINDIG megmondja a társ nevét — valójában a személyét a kapu
  bizonyítási köre (`TAGSAG`) hozza, első találkozáskor (nyílt és zárt koinóban is — D121 MH7 (A)), utána a kötés emlékszik; egy ③c
  előtti, a saját nevemhez kötött, de készülék nélküli kötést a kapu egyszer újra kér. ⛔ **Lelet (a parancssor-próba fogta meg):** egy
  új telefon még semmit nem írt (kerete sincs, hát nem is írhat) — a tanúsítványa nem volt a laptop tárában, és a laptop nem ismerte el
  a saját készülékének; most a saját készülékem tanúsítványát (a kézfogás ellenőrizte) a kötéskor a tárba veszem. `muveletek.js`:
  `atfolyasHatarAlap` (a koinó keretének 20%-a, 10 000-nél 2000 — KH1: csak az alapérték, a személyes határ a lappal jön — ④),
  `sajatKeszulekErvenyesE` (a tanúsítványa az azonosságomé, nincs kizárva, a kulcscsere nem ejtette ki — egy kizárt telefonnak
  semmit), `keretAtvetelekGondozasa` (a nekem szóló, még át nem vett átadás átvétele — a parancsok elején és az őrjárat körében is:
  ehhez találkozás nem kell, az átadás a cserével jön), `sajatKeszulekTalalkozasa` (a csere után: az átvételek, és ha nálam több a
  szabad pont, az átfolyás a határig — `keretAtfolyasa`; a határ fölött nem ad magától). `koino.js`: a horog a csere végén
  (`resMunka` — a hívó és a figyelő oldalon is). A próba: `kezelesProba.js` („A SAJÁT KÉSZÜLÉK A CSERÉBEN” — a határ, a függő átadás,
  az egyszeri átvétel, egy magasabb határ, az idegen, a más koinóbeli és a kizárt készülék), parancssor (a laptop és a friss telefon
  cseréje: a kötés a készülékkel, a 2000-es átadás, a telefon egy parancs elején átveszi) — 9 rontás. ⚠️ Az őrjárat körének átvételét
  csak a parancsok elejéé méri (ugyanaz a függvény).
- ✅ **③d — a koinó-lista és a csatlakozás (KH2 (A))** (2026-11-16): a saját készülékek a cserében megmondják egymásnak, mely
  koinókban vannak, és ott hol tart a láncuk — a `CIMEK` üzenet elhagyható `kl` mezője (`csere/vonal.js`), CSAK a saját
  készülékemnek (a kapu kötése szerint: az én nevem és egy másik készülékem), és a fogadó is csak tőle fogadja el; a kapott listát a
  bizonyítási kör UTÁN dolgozza fel (első találkozáskor épp az köti meg, hogy a társ a saját készülékem). A készülék megjegyzi
  (`sajatkeszulekek.json` — helyi feljegyzés, nem esemény; D6: a láncra soha). A `kizar` ebből a kizárt készülék listájának koinóit is
  felsorolja (a vágás a nagyobbik: amit a készülék a legutóbbi találkozáskor mondott, és amit én láttam), és ahová a listából tudok,
  de ezen a készüléken nincs, oda CSATLAKOZIK (KH2 (A) — csak a bevitelhez: kiírja a koinó őrjáratának indító parancsát, ha nem fut);
  amint a koinó eseményei megjönnek, egy ottani parancs elején (vagy az őrjáratában) a kezelés-jegyzékből a kizárás bekerül. A
  `kulcscsere` ugyanígy csatlakozik a fel nem sorolt készülékeim listáinak koinóihoz. A `kizar` listája a koinó-listából ismert
  készülékeket is mutatja (egy új telefon még semmit nem írt — a nevét a kapu által a tárba vett tanúsítványa adja). ⛔ **Lelet (a
  parancssor-próba fogta meg):** ha a telefonnál a koinó születése még nem volt meg, a kapuja nem kérte a laptop személyét — a
  telefon nem tudta, hogy a társ a saját laptopja, és a laptop a telefon listáját sem kapta meg; a valóságban a következő csere pótolja
  (addigra a születés megjön), a próba ezért a születéssel indul. ⚠️ **A vágás korlátja:** a lista is, a saját tár is azt mondja,
  ameddig a készülék a lánca végén tartott — ha a tolvaj a lopás után még találkozott a laptoppal, az ő eseményei is a vágásig
  számítanak (a lap — ④ — mutatja a lánc végét, és ott a vágás állítható). **③e:** a csere ÁLLÁSÁBAN a lánc mezője `szerzo` →
  `lanc` (a lista `szerzok` → `lancok`; belső — a dróton nem utazik, a próbák mércéje). A próba: parancssor (a lista a saját
  készülékek között, az idegennek nem; a kizárás az Olvasókört is felsorolja, a laptop csatlakozik, és az események után beviszi; a
  kulcscsere is csatlakozik), a csere-próba (az átnevezés) — 10 rontás.
- ✅ **KH3 — a régi készülék MÚLTJA a kulcscsere és a helyreállítás után** (a ③b próbájának felállításakor derült ki, egy
  mérő-szkripttel ellenőrizve; eldöntve 2026-11-16 — (A)): a kulcscsere (és a helyreállítás) után minden FEL NEM SOROLT régi készülék
  MINDEN eseménye kiesik a számításból — a lopás vagy az elvesztés előttiek is: a belépése (a tagság), a pontjai, a szavazatai
  (`allapot/kizaras.js` `cserenKivulE` — a KC2 (A) szó szerint). Ha minden készülék elveszett, és a segítők visszaadják az
  azonosságot, a NÉV és a pénztárca megmarad, de a koinókban olyan, mintha sosem lett volna ott — épp az, ami ellen a 17. pont
  született („mi lessz a koinos megtakarításával?”). És fordítva: egy RÉGI kulccsal aláírt kizárás (a tolvajé, akinél az azonosság
  kulcsa volt) ma a megmaradónak felsorolt laptopot is kizárja — a KC2 (A) „a felsoroltak … maradnak”-ja ellenére.
  (A) ⭐ a kizárás vágása itt is érvényes: a kulcscsere (vagy a helyreállítás) UTÁN az új kezelő kulccsal aláírt kizárás a régi
  készülék vágásig tartó múltját megtartja (a tagságát, a pontjait — az örökös folytatja a láncát); kizárás nélkül a régi készülék
  minden eseménye kiesik, mint ma (a tolvaj ismeretlen készülékei); egy régi kulccsal aláírt kizárás a megmaradót nem zárhatja ki, és
  a kulcscsere után a jegyzék kizárásait a készülék az új kulccsal újra aláírja. A helyreállítás után az új készülék, amint egy
  koinóban látja a régi készülékeit, felajánlja a kizárásukat (a `kizar` listája). (B) marad, ahogy van (a múlt elvész). (C) a
  kulcscsere előtti események mind maradnak — ⛔ a tolvaj régi kulccsal felvett készülékeié is.
  ✅ **Eldöntve (2026-11-16) — (A).** Csaba: *„rendben. mehetünk, tovább, ha kész a próbasór.”* — a ③f építi (a ③d–③e után).
- ✅ **③f — KH3 (A): a régi készülék múltja** (2026-11-16): `allapot/kizaras.js` (a mag) — `kizarasMostaniE`: ha az azonosságnak van
  nyertes kulcscsere-lánca, csak az a kizárás számít, amelynek a lánca annak az eleje, és ugyanannyi kulcsváltással (a MOSTANI kezelő
  kulcs írta alá); `kizarasokEsemenyekbol` és `tarKizarasai` (a kapu, a lánc-gyökér, a műveletek ebből dolgoznak) csak ezeket adja;
  `cserenKivulE`: a mostani kulccsal kizárt régi készülék NEM esik ki a kulcscsere miatt — a kizárás vágása dönt (`kizartE`), a
  múltja a vágásig megmarad, és a kapu a vágás utáni eseményét beengedi, de az nem számít (mint a kizárt készüléké eddig is). A
  kezelés-jegyzék megjegyzi, mely kizárásokat adta ki EZ a készülék (`sajat`); a `kulcscsere` ezeket (készülékenként a
  legutolsót, a megmaradók és önmaga nélkül) az új kulccsal újra aláírja — ⛔ a más készülékről gyűjtötteket NEM: egy tolvaj régi
  kulccsal aláírt kizárása így nem válhat érvényessé. A `kizar` listája jelzi a régebbi kulccsal tanúsított, még ki nem zárt
  készüléket („kizárás nélkül a múltja nem számít; a kizárása a vágásig megtartja”); a `helyreallitas befejez` kimondja, hogy a régi
  készülékek múltját a kizárásuk tartja meg. A próba: `keszulekProba.js` („A RÉGI KÉSZÜLÉK MÚLTJA A KULCSCSERE UTÁN” — kizárás
  nélkül minden kiesik; az új kulccsal kizárva a vágásig megmarad; a régi kulcsú kizárás a felsorolt laptopot nem zárja ki, és a
  telefon múltját sem tartja meg; a tárból olvasott kizárások; a kapu), parancssor (a kulcscsere a SAJÁT kizárást újra aláírja, a
  gyűjtöttet nem; a lista jelzése) — 8 rontás.

**9.13 A helyreállítás a segítőkkel** (2026-11-15 — D128 17. pont; ✅ eldöntve; a 9.12 (a ③) a ②d–②f után)

*Ami előzte:* a kulcsok és az esetek átbeszélésekor (Csaba: „beszéljük át, még egyszer az összes kúlcs fajtát, és az összes esetet,
amik miatt kellenek”) három rés jött elő a kódból: (a) a papír egyedül egy üres gépen nem elég — a `kulcscsere` a gépen lévő
születést kéri (`kulcsTar.js` `kulcscsereVegrehajtasa`), és a papír a nevet sem hozza; (b) ha a papírt ellopják, a tolvaj
kulcscserét írhat, és két ág közül ma a HOSSZABB nyer (`allapot/kizaras.js` `kulcscserekEsemenyekbol`) — a tolvaj a sajátját
tetszés szerint hosszabbíthatja; (c) a fizetési kulcs titkos fele a `kulcs.json`-ban, az azonosság kulcsa mellett van, és a kulcscsere
nem cseréli. Csaba: *„nem tettszik. túl bonyolúlt, és nem is véd rendessen. főleg, ez »Minden elvész (készülékek és papír): új
regisztráció« nem tettszik, mert mi lessz a koinos megtakarításával? milenne, ha az elvesztés orvoslására, azokat az e-embereket
vonnánk be, akik ismerik, tehát vagy a meghívója, vagy valakik azok közűl, akik már találkoztak vele?”* — majd a papírról:
„az első lépcsősőkenek, legyen papirjuk is, mert lehet, hogy nincs elég ember, aki tanusíthatná őket. A 2. lépcsős hitelesítés, viszont már feltételehez köti, a legalább, 3 meghatalmazottal vakó bemutatkozást, ezért ott már ne legyen papír, mert az ott már visszaélésekre is lehet használni, ha a tolvaj kezébe jut.”

*A döntés eddig (D128 17. pont):* az 1. lépcsőn a papír a segítők mellett; a 2. lépcsőn csak a segítők.
- **A segítők** (Csaba: *„legyen 3 ember, akik közűl 1, vagy a meghívója, vagy a 3 tanusítoja közűl, az egyik, és még két tanusító,
  akiknek van élő tanusíthatósága. mi a véleményed?”*) — nem előre vezetett lista, hanem a 2. lépcső mércéje: EGY, aki a régi énedet
  ismeri (a meghívód vagy egy tanúsítód — ő köti az új kulcsot a régi azonossághoz: „ez ugyanaz az ember”), és KÉT tanúsító, akinek
  most is él a joga (D60 — ők azt erősítik meg, amit a 2. lépcsőnél: létező, külön ember áll előttük).
- **Ha a régi ismerős már nincs meg** (a meghívó és mindhárom tanúsító kikopott): a bemutatkozók (D62) pótolják — Csaba: *„A
  bemutatkozók is jók, csak akkor abból, legalább 10 legyen.”*
- **A várakozás** (Csaba: „rendben”): a folytonosság egyetlen emberen áll — ha ő rosszhiszemű, két tanúsítót talál maga mellé. Ezért a
  helyreállítás várakozás után lép életbe; közben minden meglévő készülék értesítést kap, és megállíthatja. (Az elrettentés mellette
  már megvan: a rossz tanúsító elveszíti a szerepét — `identitas.js`, 4.5.)
- **Minden koinóban érvényes** (Csaba: „rendben”): a lépcső és a tanúsítói jog koinónként van, a kulcs koinók fölött — a helyreállítás
  a bizonyítékát (ki hagyta jóvá, és hogy ott tanúsító volt) magával viszi (D93: „a bizonyíték a tagnál utazik”); különben a tolvaj a
  többi koinóban továbbra is te lennél.

- **A várakozás hossza, a bemutatkozók útja, a megállítás után** (Csaba: *„minden javaslatodat, elfogadom, mehetünk tovább.”*): a
  rendes úton **7 nap**; a bemutatkozók útján (a 10 bemutatkozó a régi ismerőst pótolja, a két élő tanúsító mellett) **30 nap**;
  **megállítás után** újrakezdhető, de **5 ember** kell (egy régi ismerős és négy élő tanúsító), **kétszeres várakozással** (14, ill. 60
  nap), és ezt már **nem lehet megállítani** — a jogos tulajdonos két további tanúsítót könnyen talál, a csalónak öt embert kell
  becsapnia, és közben a valódi tulajdonosnak bőven van ideje szólni nekik.

*A terv — az építő megoldása (a döntések megvalósítása):*
1. **Két fázis — a várakozást a SEGÍTŐK KÉSZÜLÉKEI őrzik.** A P2P-ben nincs közös óra, és az esemény ideje önbevallás (egy
   visszadátumozott helyreállítás átugraná a várakozást). Ezért a helyreállítás két aláírás-körből áll: **(a) a kezdés** — a segítők
   aláírják (az új kezelő kulcs, az új készülék, az új fizetési kulcs, az 1. lépcsőn az új papír lekötése); a koinókba kerül, és az
   azonosság minden meglévő készüléke értesítést kap; **(b) a véglegesítés** — ugyanazok aláírják újra, de egy segítő készüléke CSAK
   akkor, ha a SAJÁT órája szerint letelt a várakozás a saját kezdés-aláírása óta, és nem látott megállítást. ⭐ A számítás így időt
   nem néz (D17 — egy eredmény mindenütt ugyanaz): a helyreállítás érvényes, ha a kezdés és a véglegesítés megvan, a segítők szerepe
   bizonyított, és (az 1. körben) nincs megállítás. Egy segítő, aki a várakozást átugorja, ugyanúgy hazudik, mint aki csalót igazol — a
   bizalom ugyanaz, új feltevés nincs.
2. **A megállítás** — az azonosság egy, a kezdéskor érvényes készülékének aláírt eseménye, a kezdésre hivatkozik. Bármikor jön, az 1.
   kört érvényteleníti — ha az már véglegesült, visszamenőleg (mint a kizárás, D128 4. pont). Utána a 2. kör (5 segítő, kétszeres
   várakozás), amit már semmi nem állít meg.
3. **A szerep bizonyítéka** — a segítő a jóváhagyása mellé hozza, hogy azon a koinón, ahol aláír, a meghívód, a tanúsítód, a
   bemutatkozód, illetve élő tanúsító (a D93 csomagja: az identitás eseményei a gyökérig — mérve logaritmikus, 12.2). Így bármelyik
   koinód ellenőrizheti — egy koinóban jóváhagyott helyreállítás mindegyikben érvényes.
4. **A segítők erősebbek a papírnál** — a kulcscserék láncában ugyanattól a lekötéstől induló két ág közül a segítők által jóváhagyott
   nyer (a mai „a hosszabb nyer” helyett, ami a papír tolvaját segítette — a (b) rés). Papír a papír ellen (csak lopott vagy másolt
   papírral lehet) nem dönt: a segítők döntenek.
5. **A papír visszavonása a 2. lépcsőn** — amikor egy koinóban eléred a 2. lépcsőt, a program egyszer kéri a papír kódját, és a papír
   aláír egy utolsó cserét: a lekötés ezentúl „a segítők” (nem újabb papír) — utána papír nem írhat alá. ⚠️ Nem az azonosság kulcsa írja
   alá: különben a laptop tolvaja kapcsolhatná át. Ha a papír már elveszett, a 4. pont véd: aki megtalálja, azt a segítők felülírják.
6. **A fizetési kulcs** — a kulcscsere és a helyreállítás új fizetési kulcsot is köt (a születésé a lánc elején áll) — a (c) rés.
7. **Az új készülék** — üres gépen a nevedet (43 jel) sem tudod (az (a) rés): a segítőd készüléke hozza — a koinójában ismer, a
   horgonyod a születéssel ott van —, a D121 mintájára (két ember, két gomb, egy összevetett kód).

*Az építés sorrendje* (a ② folytatása, a ③ előtt): **②d** a lánc két aláírója és a fizetési kulcs (a kulcscsere-bejegyzés papírral
vagy a segítőkkel; „a segítők erősebbek”; a papír visszavonása) → **②e** a helyreállítás (a kezdés, a véglegesítés, a megállítás, a két
kör, a szerepek bizonyítéka) → **②f** a parancsok (a helyreállítás kezdése az új készüléken, a segítés, a megállítás, a papír
visszavonása) → **③** (a 9.12 — a terjesztés a helyreállítással és a megállítással bővül, és az értesítéssel) → ④ → ⑤.
- ✅ **Az építés — ②d a papír visszavonása, az erősebb ág, a fizetési kulcs** (2026-11-15): `azonossag.js` — a kulcscsere új
  mezője a `fizetes` (a fizetési kulcs a csere UTÁN; a születésé a lánc elején — a (c) rés); a `kovetkezo: null` a PAPÍR
  VISSZAVONÁSA (a kezelő kulcs marad; utána csere-kulcs nem ír alá — `kezeloKulcsLanc`, így a kapu is); a KORSZAK a kulcsváltások
  száma (`kulcsKorszak` — a visszavonás miatt senki nem esik ki); két ág közül az ELTÉRÉS HELYÉN álló bejegyzés ereje dönt
  (`lancErosebbE` — a visszavonás erősebb a papír kulcscseréjénél; a ②e-ben a segítők mindkettőnél), nem a hosszabb (a (b) rés:
  a tolvaj a saját ágát tetszés szerint hosszabbíthatta). `allapot/kizaras.js`: a nyertes lánc aláírásai — a VESZTES ágon tanúsított
  készülék kiesik (`lancElejeE`), hacsak a nyertes utolsó kulcsváltása fel nem sorolja. ⛔ **Lelet:** a ②b-ben két egyforma hosszú
  ág közül a vesztesen tanúsított készülék MEGMARADT (a korszak-száma nem volt kisebb a nyertesénél) — a próba fogta meg.
  `kulcsTar.js`: `papirVisszavonasa` (a papír utolsó aláírása — nem a kezelő kulcsé), `papirEl`; a kulcscsere új fizetési kulcsot
  ad (a titkos fele a tárolóban). `koino.js`: `papir visszavon <a papír kódja | csere-kulcs.json>` (a fájlt is törli, és a
  visszavonást a koinóba is beviszi); az állapot (és a `papir`) a 2. lépcsőn szól, amíg a papír él (az alapító — az alapító kör —
  rögtön 2. lépcsős). A próba: keszulek („A PAPÍR VISSZAVONÁSA ÉS AZ ERŐSEBB ÁG”), kulcs („(②d) a PAPÍR VISSZAVONÁSA a gépen”),
  parancssor (a parancs és a figyelmeztetés) — 13 rontás. ⏭️ ②e: a helyreállítás a segítőkkel.
- **A ②e két kérdése** (2026-11-15 — Csaba: *„minden javaslatodat elfogadom, mehetünk tovább.”*): **(1) a segítők EGYSZER
  cselekszenek** — a kezdéskor jóváhagynak (a kód összevetésével); a készülékük a várakozás után MAGÁTÓL véglegesít, ha közben nem jött
  megállítás, és ő maga nem vonta vissza a jóváhagyását (a (B) — a végén mindhárom újra — elakadna, ha egyikük épp nem ér rá);
  **(2) a bemutatkozós út MINDIG választható** (a 30 napos várakozással) — a program nem tudja megállapítani, hogy a meghívó és a
  tanúsítók „nincsenek meg” (meghaltak, vagy csak nem segítenek); a hosszabb idő a védelem.
- **A ②e szerkezete** (az építő terve, a kódból — 2026-11-15):
  · **Hol él a helyreállítás:** abban a koinóban (A), ahol a segítők tagok — az azonosság (X) horgonyának SZELETÉBEN, a meglévő
    „állítás másról” alakkal (`kit` = X, `sajatBelepes` = a segítő horgonya — mint a meghívás és a tanúsítás, `identitas.js`):
    `HelyreallitasJovahagyas { kit, sajatBelepes, javaslat, szerep, fazis }` (a `javaslat`: az új kezelő kulcs, az új készülék, az
    új fizetési kulcs, az 1. lépcsőn az új papír lekötése, a kör, a 2. körben a megállított 1. kör jele; a `fazis`: kezdés,
    véglegesítés, visszavonás), és `HelyreallitasMegallitas { javaslat }` — X egy meglévő készülékéé. Az új készüléknek még nincs
    azonossága (nem írhat): a javaslatot a kódjából (a D121 mintája) az első segítő teszi be a jóváhagyásával.
  · **A szerepek** (az A eseményeiből): régi ismerős = X meghívója vagy tanúsítója (az ő `Meghivas`/`Tanusitas` eseménye X
    szeletében); bemutatkozó = `Bemutatkozas` X-ről (D62); élő tanúsító = `tanusithatE` (a felhatalmazása él). A szabály: (1. kör)
    1 régi ismerős + 2 élő tanúsító, vagy 10 bemutatkozó + 2 élő tanúsító — három (ill. tizenkét) KÜLÖNBÖZŐ azonosság; (2. kör) +2
    élő tanúsító, és CSAK egy megállított 1. kör után (különben egy csaló rögtön a megállíthatatlan 2. körrel kezdene).
  · **A bizonyíték** (a minden koinóban érvényesség — a D93/2 tagsági csomag mintája): a `Kulcscsere` esemény lánca egy
    `AzonossagHelyreallitas` bejegyzéssel zárul, és HOZZA a bizonyítékát: A születését, a jóváhagyásokat (mindkét fázist), és a
    szerepek eseményeit (a meghívást vagy a tanúsítást, a bemutatkozásokat, és az élő tanúsítók láncát a gyökérig — mérve
    logaritmikus, 12.2). Bármelyik kapu (B koinóé is) a csomagból egy memóriabeli tárat épít, és ugyanazzal a `identitas.js`-sel
    ellenőrzi (A koinójaként, teljes ellenőrzéssel — szúrópróba nélkül, hogy minden készülék ugyanarra jusson). ⭐ A számítás (a mag)
    a tagsági csomag mintájára a kapura bízza az aláírásokat és a szerepeket; ő a lánc alakját és a bejegyzések erejét nézi. ⚠️ A
    maradék kockázat: a csomag összeállítója egy felhatalmazás VISSZAVONÁSÁT kihagyhatja — B koinó nem látja; A koinó készülékei
    igen, és a várakozás és a megállítás ez ellen is véd.
  · **A lánc:** a helyreállítás bejegyzése a legerősebb (a 2. kör az 1.-nél is) — `lancErosebbE`; a kezelő kulcs láncát
    (`kezeloKulcsLanc`) a kapu által ELLENŐRZÖTT helyreállítások halmazával (adatként — D123 PR2) kérdezzük; a kézfogás a tár
    halmazát kapja.
  · **Az építés:** **②e1** az események és a szerepek (a jóváhagyás, a megállítás, a visszavonás; a kör és az út szabálya — egy
    koinóban, a tárból) → **②e2** a lánc bejegyzése és a bizonyíték (a csomag, a kapu, a kezelő kulcs, az erő, a kizárás, a kézfogás)
    → **②e3** a segítők készülékei (a várakozás utáni magától véglegesítés; az értesítés X készülékein) → **②f** a parancsok (az új
    készüléken a kérelem kódja és a befejezés; a segítés, a visszavonás, a megállítás).
- ✅ **Az építés — ②e1 az események és a szerepek** (2026-11-15): `azonossag.js` — a javaslat alakja
  (`helyreallitasJavaslatAlakiHibaja`: az új kezelő kulcs, az új készülék(ek), az új fizetési kulcs, a papír lekötése vagy `null`,
  a kör és az előzmény, a lánc helye — sorszám és az előző bejegyzés jele) és a JELE (`helyreallitasJele` — a tartalom lenyomata).
  `esemeny.js`: a `HelyreallitasJovahagyas` (állítás másról, a helyreállítandó szeletébe — a segítő a saját szeletében is látja:
  `AZONOSSAG_ALLITASOK`) és a `HelyreallitasMegallitas` (a saját szeletbe, a javaslat jelével) alakja. `allapot/helyreallitas.js`:
  `helyreallitasokAllapota` — javaslatonként a kezdők és a véglegesítők (`segitoAllasa`: a visszavonás a kezdést törli, a véglegesítés
  után semmi nem számít), a megállítás (X érvényes — nem kizárt, a kulcscsere által nem kiejtett — készülékéről), az út
  (`elegendoUt`: egy ember egy hely; a tanúsítót előbb a nem-bemutatkozók közül), a 2. kör feltétele (a megállított 1. kör), a
  várakozás napjai. A szerepek: a régi ismerős a meghívás és a tanúsítás érvényes állítójából, a bemutatkozó a KÖLCSÖNÖS
  bemutatkozásból (D62 — az egyoldalú nem számít; a jelzések `sajatAllitasai`-val), az élő tanúsító a `tanusithatE`-ből
  (`identitas.js` `allitasHelyben` így exportált). `muveletek.js`: `helyreallitasJovahagyasa`, `helyreallitasMegallitasa`. A próba:
  `helyreallitasProba.js` (8 — az ismerős út, a különböző emberek, a visszavonás, a megállítás és a 2. kör, a bemutatkozó út, a tiszta
  szabály, az alak, a műveletek) — 16 rontás. ⏭️ ②e2: a lánc bejegyzése és a bizonyíték.
- ✅ **Az építés — ②e2 a lánc bejegyzése és a bizonyíték** (2026-11-15): `tar/memoriaTar.js` — a RÖGZÍTŐ tár (egy valódi tár köré:
  feljegyzi, mit olvasott ki a szerep-ellenőrzés) és a MEMÓRIABELI tár (egy esemény-listából, ugyanazokkal a műveletekkel).
  `allapot/helyreallitas.js`: `helyreallitasBizonyiteka` (a teljes helyreállítás olvasásai a rögzítő tárral — TELJES ellenőrzéssel:
  a keret végtelen, szúrópróba nincs, minden kapu ugyanarra jut) és `helyreallitasBizonyitekEllenorzese` (az alak; minden esemény
  hiteles és A koinóé; a horgony a helyreállítandóé; a memóriabeli tárban a helyreállítás TELJES, a bejegyzés jelével). Mérve: az
  alapító körrel 11 esemény, 13 KB. `azonossag.js`: a lánc új bejegyzése, az `AzonossagHelyreallitas` (`{ tipus, azonossag, ...a
  javaslat, jel }` — nem aláírt; a helye a sorszám és az előző bejegyzés jele; a lekötés nem köti — a visszavonás után is), az ereje
  (2, a 2. körben 3 — a segítők a papír fölött), a lánc-jel (`bejegyzesJele` — a kulcscseréé az aláírása), és a NYILVÁNTARTÁS (az
  ellenőrzött helyreállítások jelei, folyamatonként: `helyreallitasFelvetele`, `helyreallitasIsmertE`) — a `kezeloKulcsLanc` innen
  (vagy a hívó halmazából) tudja, hogy a bejegyzés hiteles; a „még nem ismert” nem végleges ítélet (`keszulek.js`: nem kerül az
  emlékezetbe). A kapu (`esemenyTar.js`): előbb a szerző tárban lévő helyreállításai a nyilvántartásba, és egy érkező `Kulcscsere`
  bizonyítékai — ha átmennek, a jelük is (a bizonyíték önmagát igazolja). A `Kulcscsere` esemény (`esemeny.js`) a láncban álló
  helyreállítások bizonyítékait PONTOSAN hozza (`bizonyitekok`: jel → bizonyíték). A kézfogás (`titkositas.js`, szinkron) a
  nyilvántartásból; a folyamat induláskor a tár összes helyreállítását felveszi (`fajlTar.js` `kezelesAzonossagai`, `koino.js`). ⭐ A
  MAG: a kapu így az `identitas.js`-t is importálja — a mag része lett (a helyreállítás elfogadásáról az identitás szabályai döntenek);
  a belső `feltetel` váza a kimondott listán (D123 PR2). A próba: `helyreallitasProba.js` (+4 — a bizonyíték: csonka, hamisított,
  más jelű, más azonosságé, idegen koinóé; a lánc; a kapu egy MÁSIK koinóban: bizonyíték nélkül és csonkával nem, utána az új készülék
  be, a régi ki; a kézfogás) — 14 rontás. ⏭️ ②e3: a segítők készülékei (a várakozás utáni magától véglegesítés és a Kulcscsere
  bevitele a bizonyítékkal; az értesítés X készülékein).
- ✅ **Az építés — ②e3 a segítők készülékei** (2026-11-16 — Csaba: „a segítők EGYSZER cselekszenek”): `muveletek.js`
  `helyreallitasokGondozasa` — minden helyreállításnál, amit az azonosságom jóváhagyott (és nem vont vissza, nem véglegesített): ha a
  SAJÁT ÓRÁM szerint letelt a várakozás a kezdésemtől (az út és a kör napjai), és nem jött megállítás, VÉGLEGESÍT; ha a helyreállítás
  így (vagy már korábban) TELJES, és a koinóban még nincs bent, a láncot (a tárból, a javaslat helyéig — `allapot/helyreallitas.js`
  `azonossagLancaTarbol`, `javaslatElotagja`) a bejegyzéssel és a bizonyítékokkal (a lánc-elejében álló korábbi helyreállításokéval is)
  egy `Kulcscsere` eseményben BEVISZI — egyszer. A koinó idő nélkül dönt (D17); a várakozást a segítő készüléke méri. `koino.js`:
  minden parancs elején és az őrjárat minden körében (a hibája nem akaszt meg semmit); az állapot SZÓL, ha valaki az én
  helyreállításomat kezdte (a segítők száma, az út, a várakozás, és a `megallit <jel>` parancs); a `megallit` csak az én
  azonosságomról szóló javaslatot fogadja el. A próba: „A SEGÍTŐ KÉSZÜLÉKE” (a várakozás előtt nem, utána igen; a harmadik véglegesítő
  beviszi — egyszer; megállítás után senki) — 5 rontás. ⏭️ ②f: a parancsok (az új készüléken a kérelem és a befejezés; a segítés, a
  visszavonás), a parancssor-próba a megállítással és az értesítéssel.
- ✅ **Az építés — ②f a parancsok** (2026-11-16): `kulcs/helyreallitasKerelem.js` — a KÉRELEM (az új kezelő, fizetési és papír-kulcs —
  a titkok az új készüléken maradnak —, és a megtartandó régi készülékek): egy sor szöveg (`koino-helyreallitas.1.…`) és QR, mellette
  az ELLENŐRZŐ KÓD (6 jel, a kérelem lenyomatából — a két ember szóban összeveti, a D121 mintája; a segítő be is írja, és a gépe csak
  egyezőnél hagy jóvá: egy kicserélt kérelem nem csúszik át). `allapot/helyreallitas.js` `javaslatKerelembol` — ha egy másik segítő
  már kezdte, a MEGLÉVŐ javaslatot adja (mindenki ugyanazt hagyja jóvá), különben újat (a lánc helye a tárból; a 2. lépcsőn papír
  nélkül). `kulcsTar.js` `helyreallitasBefejezese` — a lánc végén az én kulcsom és fizetési kulcsom áll → ez a gép az azonosság
  kezelője (meglévő azonosságot csak `felulir`-ral; az 1. lépcsőn az új papír a `csere-kulcs.json`-ba). A javaslat készülék-listája
  üres is lehet (ha minden elveszett). `koino.js`: `helyreallitas kerelem` és `helyreallitas befejez <fájl>` (a kulcs-biztosítás
  ELŐTT — mint a visszatöltés; folyamatban lévő kérelem mellett, azonosság nélkül más parancs nem fut), `segit <horgony> <kérelem>
  <ellenőrző kód> [masodik <jel>]`, `segit visszavon <horgony> <jel>`, `segit kiad <horgony> <fájl>`; a gondozás órája a
  `KOINO_ORAELTOLAS` (egy elcsúszott óra — a próba ezzel ugorja át a 7 napot). ⛔ **Lelet (a parancssor-próba fogta meg):** a
  befejezés után a következő indulás ÚJ SZÜLETÉST adott — új nevet, a visszakapott azonosság elveszett volna. Két ok: (1) a
  nyilvántartás folyamatonként él, az új folyamat nem tudta, hogy a saját `kulcs.json`-jában álló helyreállítás hiteles — most a
  betöltés a SAJÁT tárolóban álló helyreállítást felveszi (oda csak a bizonyíték ellenőrzése után került; aki ezt a fájlt átírhatja, a
  titkos kulcsot is kicserélhetné); (2) a biztosítás a születéssel bíró, de be nem tölthető azonosságot „régi alaknak” vette, és
  újraszülte — most megáll („új születést NEM adunk”), és a fájlhoz nem nyúl (egy sérült lánc sem vihetné el így a nevet). A próba:
  helyreallitas („A KÉRELEM ÉS A BEFEJEZÉS”), kulcs (a be nem tölthető azonosság), parancssor (a teljes út: kérelem, három segítő az
  ellenőrző kóddal — a rossz kód nem megy —, az értesítés a régi készüléken, a várakozás után a véglegesítés és a bevitel, a kiadás, a
  befejezés UGYANAZZAL a névvel) — 10 rontás. ⭐ A D128 17. pontja ezzel megépült; ⏭️ ③ a hálózat (9.12 — KH1, KH2 még nyitott).

**9.14 A ④ terve — a lap: „📱 Készülékeim” és a második készülék felvétele** (2026-11-16; ✅ KF1 eldöntve: (A))

*Ami már eldőlt:* új készüléket csak az azonosság kulcsa vesz fel, ami a kezelő készüléken és a mentésben él (ET-3/4 (A)); a
tanúsítvány koinók fölött érvényes (KU2 (A)); az azonosság kulcsa csak kezel (KU6 (A)). ⚠️ **Ami ma van:** második készülék csak a
`kulcs.json` átmásolásával jön létre — így az azonosság kulcsa (a kezelés: a kizárás, a kulcscsere, a felvétel) MINDEN készüléken
ott van, és egy ellopott telefonnal a tolvaj a laptopot is kizárhatja (a ③f után a papíros kulcscsere ezt rendbe teszi — de ehhez a
papír kell). A ③ próbái is így állították fel a két készüléket. A ④-ben a második készülék CSAK a tanúsítványát kapja meg.

*Ami a ④-ben épül:*
- **④a A felvétel.** Az új készülék „kezelő nélküli”: a kulcsfájlja a nevet, a születést és a láncot hordozza, titkos kulcs nélkül;
  a kezelést kívánó parancsok (`kizar`, a felvétel, a `papir`) kimondják, hogy ez a kezelő készüléken megy. A papíros kulcscsere
  innen is megy — utána ez a készülék a kezelő.
- **④b A lap: „📱 Készülékeim”** — a készülékek (a nevük, koinónként a láncuk vége, a kizártak, a régebbi kulccsal tanúsítottak), a
  felvétel, a kizárás (a vágás állítható), a keret részei és a személyes határ (készülékenként — KH1: csak az alapérték a 20%), a
  mentés (a papír) állása.
- **④c A személyes határ** — a fogadó készülékenként, a lapon; a `sajatKeszulekTalalkozasa` ezt kapja az alapérték helyett.

*A kérdés:*
- **KF1 — hogyan kerül a tanúsítvány az új készülékre?** (A) ⭐ **párosító kóddal, a hálózaton:** a laptop (a kezelő) kiír egy
  párosító kódot és QR-t (benne a címei és egy egyszeri titok — a D121 meghívójának mintája); a telefon kamerája beolvassa, a
  telefon ezzel kapcsolódik a laptophoz, elküldi a készülékkulcsát, a laptop aláírja és visszaküldi a tanúsítványt — közben mindkét
  gép kiír egy 6 jeles ellenőrző kódot (mint a helyreállításnál), amit összevetsz; egy beolvasás, és kész (ahogy a Signal, a
  WhatsApp Web párosít). (B) **két kóddal, hálózat nélkül:** a telefon kiír egy kérelem-kódot (14 négyjeles csoport, mint a papír),
  amit a laptopba begépelsz; a laptop QR-t mutat a tanúsítvánnyal, amit a telefon kamerája beolvas. (C) **fájllal** (mint a mai
  mentés — a fájlt át kell vinni).
  ✅ **Eldöntve (2026-11-16) — (A).** Csaba: *„rendben, legyen az (A). mehetünk tovább”*.

*Az építés:*
- ✅ **④a — a felvétel (a parancsok)** (2026-11-16): `csere/parositas.js` — a PÁROSÍTÓ KÓD (`koino-parosit.1.…`: a kezelő címei és a
  kapuja portja, a tábla-aláírója, egy 16 bájtos egyszeri titok, az azonosság neve, a lejárat — 10 perc), a titok BIZONYÍTÁSA (HMAC a
  titokkal, a kézfogás átiratához és a készülékkulcshoz kötve — a titok maga nem utazik, és egy lehallgatott bizonyítás másik
  beszélgetésben nem ér semmit), az ELLENŐRZŐ KÓD (6 jel, a titokból és a készülékkulcsból), és a két oldal a védett résen, saját
  üzenetekkel (`PAROSITAS_NYIT` — a kezelő a tábla-kulcsával aláírja az átiratot, ebből tudja az új készülék, hogy a kódot kiíró géppel
  beszél; `PAROSITAS`; `PAROSITAS_KESZ` — a tanúsítvány, az azonosság nyilvános részei, a koinók a beceneveikkel); a csere
  párbeszédéhez nem nyúl. `kulcsTar.js`: a KEZELŐ NÉLKÜLI azonosság (`koino-azonossag-keszulek` — a név, a születés, a lánc, titkos
  kulcs nélkül): betölthető, a biztosítás nem szül újat, a mentés kimondja, hogy ez a kezelőn megy; `keszulek.js`: egy felvett készülék
  magát nem tanúsíthatja. `koino.js`: `keszulek felvesz` (a kezelőn — a kód és a QR, a kapu a párosítás idejére nyitva, legfeljebb 10
  percig; a felvett készüléket a saját készülékei közé jegyzi a nevével) és `keszulek csatlakoz <kód> [nev=…] [felulir]` (az új
  készüléken, a kulcs-biztosítás ELŐTT — mint a helyreállítás: a tanúsítványt ellenőrzi, a kezelő nélküli azonosságot és a
  készülékkulcsot menti, a koinókat a kezelő beceneveivel ismertté teszi, a kezelőt társnak veszi); a kezelést kívánó parancsok (a
  `kizar`, a felvétel, a papír visszavonása, a mentés) a felvett készüléken kimondják, hogy a kezelőn mennek; a papíros kulcscsere
  innen is megy. ⛔ **Lelet (a parancssor-próba fogta meg):** a frissen felvett telefonnál a koinó születése még nincs meg, ezért az
  első cserében a kapuja nem kéri a laptop személyét, és a koinó-listák nem cserélődnek (a ③d korlátja — itt a szokásos eset) — a
  laptop listáján a telefon nem látszott; most a felvételkor a kezelő rögtön feljegyzi (a nevével). ⚠️ A két gépnek el kell érnie
  egymást (ugyanaz a hálózat, vagy egy továbbított port — a kód a kezelő helyi címeit hordozza). A próba: `papirProba.js` (a kód
  oda-vissza, a hibás alakok, a bizonyítás kötése, az ellenőrző kód), `kulcsProba.js` (a kezelő nélküli azonosság), parancssor (a
  rossz titok és az idegen kezelő nem megy; a valódival a két ellenőrző kód egyezik; a telefonon nincs titkos kulcs, a kizárás és a
  felvétel a kezelőé; a csere után a telefon keretet kap) — 10 rontás. ⏭️ ④b a lap („📱 Készülékeim”), ④c a személyes határ.
- ✅ **④c — a személyes határ** (2026-11-16; KH1 — Csaba: *„ezek az értékek, személyre szabhatók lesznek majd”*): `keszulek hatar
  <készülék> <pont | alap>` — a saját készülékemnek magától legfeljebb ennyit adok (a határ az ADÓ szabálya — KU1 (a): ezen a
  készüléken él, a `sajatkeszulekek.json`-ban, a fogadó készülékenként); az `alap` a koinó keretének 20%-a; a koinó keretén túl a
  határ sem ér (`sajatKeszulekTalalkozasa` — `Math.min`). A koinó-lista fogadása és a felvétel feljegyzése a határt megtartja. A
  `kizar` listája kimondja (a sor végén — ⛔ az első változat a név után írta, és ez a ③d-próba „régebbi kulcs” sorát szétvágta).
  A próba: parancssor (az 1000-es határral a csere után 1000 megy — közben a koinó-lista is megjön, és a határ megmarad; a lista; az
  `alap`; a rossz érték) — 4 rontás. A lapon (④b) ugyanez állítható.
- ✅ **④b — a lap: „📱 Készülékeim”** (2026-11-16): a fő menü „Fiók” csoportjában. A készülékek (a nevük, a rövid kulcsuk, koinónként a
  láncuk vége és amit a koinó-listájukban mondtak, a jelek: „ez a készülék”, „kizárva”, „régebbi kulcs”), a HATÁR készülékenként
  (üresen az alap), a KIZÁRÁS (a második kattintás erősít meg), az ÚJ KÉSZÜLÉK FELVÉTELE (a program a lap folyamatában párosít — a lap
  a TELEPÍTŐ SORT kapja a párosító kóddal és a QR-ét: a telefonon EGY bemásolt sor a Termuxba telepít/frissít és párosít; 📋 a Termuxba,
  💻 Windowsra, Mégse; a lap kérdezi az állását, és ha a telefon felkerült, kimondja az ellenőrző kódot), és a PAPÍR állása (él-e, a
  gépen van-e még a fájlja, a 2. lépcső figyelmeztetése). Egy felvett készüléken a felvétel és a kizárás nem látszik — a lap kimondja,
  hogy az a kezelőn megy. ⭐ A lap csak rajzol: a parancs és a lap ugyanazt hívja (`koino.js` `keszulekKizarasaItt`,
  `parositasInditasa`, `szemelyesHatarBeallitasa`, `keszulekekLapja`, `qrSvg` — a `kizar` és a `keszulek` parancs is ezekre épül át).
  Az API: `GET /api/keszulekek`, `GET|POST /api/keszulek/felvetel`, `POST /api/keszulek/felvetel/megse`, `POST /api/keszulek/hatar`,
  `POST /api/keszulek/kizar`. Az indítók (`termux/indit.sh`, `windows/indit.ps1`) a párosító kódot (`koino-parosit.1.…` — a telepítő
  sor végén) felismerik, és előbb `keszulek csatlakoz`-t futtatnak; ⛔ ha nem sikerül, NEM indulnak tovább (az indulás új azonosságot
  szülne). ⛔ **Lelet (a böngészős kipróbálás fogta meg):** a Mégse után a lap még a „vár” állást kapta (a párosítás lezárása a válasz
  után futott le), és a felvétel gombja nem jött vissza — most a Mégse megvárja a lezárást. A próba: parancssor (a lap API-ja: a lista, a
  felvétel — ugyanaz a párosítás másodszorra, a Mégse után új; a telefon a lap kódjával felkerül, az ellenőrző kód egyezik; a határ — a
  rossz nem megy; a kizárás — a saját nem megy; a menüpont, az ablak és a stílusa kiszolgálva) — 7 rontás; böngészőben ránézve (a lista,
  a QR, a gombok, a papír). ⚠️ Az indítók párosító ága próba nélkül (a terepen — ⑤).

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
