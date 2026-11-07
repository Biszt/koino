# A protokoll nyelvváltozata — átvizsgálás (D123 ③, PR6 — 2026-11-06, kód nélkül)

> **Állapot:** ✅ **D124** (Csaba, 2026-11-06: *„minden javaslatodat elfogadom, mehetünk tovább.”* — PV1–PV6 mind (A)) · 🚧 az
> építés: ✅ ① a jel és az egyezés (elágazás 241) · ✅ ② a kopogás jele (elágazás 242) · ✅ ③ az emlékezet és a kimondás (elágazás
> 243) · ✅ ④ a fordító-szél, a kézfogás-választó és a régi lépések dátuma (elágazás 244) · ✅ ⑤ a kiírt alakok (elágazás 245) —
> a D124 építése kész.
>
> Csaba (2026-11-06): *„rendben értem. csinálhatod, a pr6-ot”*. Az
> elv a D123-ban eldőlt (PR6 (A) — a KZ5 válasza): *a programok kimondják, melyik nyelvváltozatot beszélik, és az új program egy
> ideig a régit is beszéli; a régit egy kimondott dátumig tartjuk.* Ez az átvizsgálás azt nézi meg, HOL és HOGYAN — a kód és a
> 90. mérés alapján. Kód még nem épült belőle (csak a mérő szkript: `meres/protokollMeres.js`).

## 1. A rövid válasz

A protokoll nem egy üzenet, hanem négy réteg (2.), és a mai program a négyből kettőben **türelmes olvasó**: az ismeretlen MEZŐT
és az ismeretlen kopogás-üzenetet átlépi — ezért az eddigi bővítések nagy része törés nélkül ment (a `cs`, a `kd`, a `FOGLALT`,
a `KESZ` + `kesobb`). ⛔ Az ismeretlen ÜZENET viszont a párbeszéd közepén elakasztja a cserét, és a hiba csak az egyik oldalon
látszik — a másik csak annyit tud, hogy „a társ nem válaszol” (90. mérés). Ami a legveszélyesebb: ha egy **közös számítás**
változik (a szelet-halmaz, egy lenyomat, egy DHT-téma), arra semmilyen hiba nem jön — a két program csendben mást hasonlít össze.

⭐ A javaslat (5.): **minden munka első üzenete kimondja a nyelvváltozatot** (`ny`: a legrégebbi és a legújabb, amit a program
beszél), mindkét fél ugyanabból a két számból ugyanazt a közöset számolja (új üzenet nélkül), és ha nincs közös, **mindkét fél
megnevezett hibával áll meg**, és a lap kimondja, ki a régebbi. Új változat csak valódi törésnél kell (a bővítés jellel megy, mint
eddig); a régit a program a **szélén fordítja**, a régi közös számításokat egy jegyzékben tartja, egy kimondott dátumig.

## 2. Mi a protokoll — a négy réteg (a leltár)

A program rétegei közül (`program_retegek_atvizsgalas.md` 3.) az **R2** a protokoll: amit két készülék egymásnak mond. A kódban négy
rétege van, és mindegyik máshogy viselkedik egy újabb társsal:

1. **A kopogás** (`udpKapu.js`, nyílt JSON): `KOPOG`, `HALLAK`, `FOGLALT`. ⭐ Türelmes: az ismeretlen mezőt és az ismeretlen üzenetet
   átlépi (a `FOGLALT` így jött be 2026-09-25-én: „egy régi társ nem ismeri, tehát figyelmen kívül hagyja”).
2. **A szállítás** (`titkositas.js`, `udpVonal.js`): a kézfogás-csomag (`0xa6` + 32 bájt — pontosan 33 bájt, különben eldobja), a
   titkosított csomag (`0xa5`), a sorszámok és a nyugták. ⛔ Az ismeretlen csomagot némán eldobja — egy szállítás-változás tehát
   csak annyit mutat, hogy a társ hallgat.
3. **A párbeszéd** (`vonal.js`): soronként egy JSON-üzenet, **41 féle** (`NYITAS`, `CIMEK`, `SZELETEK`, `ELTERO`, `RESZVETEL`,
   `TARTOMANYOK`, `ESEMENY`, `KEREK`, `KESZ`, `KELL`, `TAGSAG`, `KERELEM`, `FAJLKEREK`, `FAJLSZELET`, `VALASZ`, …). ⭐ Az ismeretlen
   mezőt átlépi (a mezőket név szerint olvassa); ⛔ az ismeretlen vagy a nem várt üzenetre megáll (`varj`: *„Várt üzenet: X,
   érkezett: Y”*). Minden munkának van ELSŐ üzenete: a cserénél és a kiszolgálásnál a `NYITAS`, a kérőnél a `KERELEM`, a
   fájl-randevún a `FAJLKEREK`, a válasznál a `VALASZ`.
4. **A kiírt alakok** — amit a program nem egy társnak mond, hanem kitesz, és egy ismeretlen (akár jövőbeli) program olvas el:
   a hirdetőtábla bejegyzése és a meghívó rekesze (BEP 44), a DHT-témák képzése (BEP 5), a helyi felfedezés kiáltása, a meghívó
   szövege. Itt nincs kézfogás, tehát egyeztetni sem lehet. ⭐ A meghívó már most hordozza a változatát (`koino-meghivo:2:` — a
   régi alakra a lap azt mondja: „kérj újat”).

⭐ **És ami nem üzenet, mégis protokoll: a közös számítások.** A csere közben a két program ugyanazt számolja ki külön-külön — melyik
esemény melyik szeletbe tartozik (a szelet-halmaz), a nyitó lenyomatot, a gyökér-darabok és a kereső-régiók kulcsait, a DHT-témát
és a rekesz kulcsát. Ha ezek közül egy változik, nincs hibaüzenet: a két program csendben mást hasonlít össze, és a csere soha nem
konvergál (vagy kevesebbet visz át). Ez a legalattomosabb törés — a „nem-esemény néma”.

*Ami NEM a protokoll:* az esemény alakja és a kapu (az **R1** — a számítás magja: a változása költözés, D118), a BitTorrent-DHT
maga (idegen szabvány, nem a miénk), és a lap és a program közötti helyi kapu (`/api/…` — ugyanabból a mappából fut, mindig együtt
frissül; a PR4 nézetei majd ezt is érintik).

## 3. Eddig hogyan változott (a dokumentációból — nem teljes leltár)

A **tiszta törések** (a régi programmal a csere megállt, a telefont frissíteni kellett): 2026-09-26 a TCP helyett a UDP-rés (D69/2) ·
09-27 a `LENYOMAT`/`ALLAS` helyett a `NYITAS` és a tartomány-egyeztetés (D72 — ez az egyetlen, amit a program meg is nevez:
`REGI-PROTOKOLL`) · 10-03 a titkosítás (D89/1 — szándékosan ugyanabba a törésbe, mint a D85 szelet-halmaza, „így a telefont EGYSZER
kell frissíteni”) · 10-04 a tábla-kulcs a nyitásban és a `TAGSAG` kör (D93/3), és még egyszer a szelet-halmaz (D93/6, 63. elágazás).
Négy törés kilenc nap alatt — a fejlesztés legsűrűbb szakaszában.

A **kompatibilis bővítések** (jellel, törés nélkül): a `FOGLALT` (09-25), a `KESZ` + `kesobb` és a `FAJLNINCS` + `kesobb` (D109, a
kiszolgálási keret), a `NYITAS` `cs` jele (D119 ③ — *„a régi program nem küldi, akkor nincs családi kör”*), a `kd` (a kereső-régiók),
a fájl-randevú vége (`FAJLVEGE` — *„a régi program »nem fájl-kérés«-nek olvassa, és ugyanígy zár”*). ⭐ Vagyis a minta már
megvan: **egy új lépés csak akkor indul, ha mindkét fél jelezte** — a régi nem jelzi, tehát nála a régi menet fut.

⭐ A tanulság: a bővítések többsége jellel megoldható; a törés ritkább, de nagyobb — és a 10-09 óta a terepig *„nem kell
emlékeztetni”* szabály (Csaba) épp a törések miatt kellett. Egy élő közösségben ezt nem lehet megtenni.

## 4. A 90. mérés — a türelmes olvasó (`meres/protokollMeres.js`)

Két mai program cserél a védett UDP-résen (mint az őrjáratban); az egyik a saját kimenő üzeneteit „jövőbelivé” alakítja:

- **ismeretlen MEZŐ minden üzenetben** → a csere lement, mindkét félnél megvan mind az öt gondolat;
- **ismeretlen ÜZENET a nyitás után** → ⛔ a csere elakadt (3 és 2 gondolat): a mai fél *„Várt üzenet: CIMEK, érkezett: JOVO”*
  hibával megállt, a jövőbeli fél viszont csak *„A másik fél nem válaszol”* — **a valódi okot nem tudja meg**;
- **a NYITÁS egy nyelvváltozat-jellel** (`"v":[1,2]`) → lement; a nyitás 135 → 145 bájt (+10, titkosítva megy). Egy „nincs újdonság”
  csere 1,2–1,7 KB (43., 57. mérés) — a jel ára < 1%.

⭐ Ebből: **a jel bevezetése maga nem törés** — a mai program elviseli; a jövőbeli programnak viszont tudnia kell, kivel beszél,
MIELŐTT új lépést tesz, különben a hiba az ő oldalán néma.

## 5. A javaslat

**① A jel.** A program egy helyen mondja ki, melyik nyelvváltozatokat beszéli: a legrégebbit és a legújabbat (`ny: [1, 1]` — a mai
nyelv az **1-es**; aki nem küld jelet, az is 1-es, vagyis a mai és a régebbi programok mind). A jel **minden munka első üzenetében**
megy (`NYITAS`, `KERELEM`, `FAJLKEREK`, `VALASZ`). ⛔ Az első üzenet alakját nem törjük: mindig a legrégebbi beszélt alakban megy,
az újdonság legfeljebb mező — így a régi program is elolvassa, és tudja, hogy nem érti a folytatást.

**② Az egyezés — új üzenet nélkül.** Mindkét fél ugyanazt a két jelet látja, tehát ugyanazt számolja: a közös nyelv a két
„legújabb” közül a kisebbik, ha az legalább akkora, mint a két „legrégebbi” közül a nagyobbik. (A minta megvan: ki nyit, a
nagyobb lenyomat dönti el — egyik fél sem kérdez.) A párbeszéd onnantól a közös nyelven megy.

**③ Ha nincs közös nyelv** — mindkét fél **megnevezett hibával** áll meg (`NINCS-KOZOS-NYELV`, és hogy a társ régebbi vagy újabb), a
társat (a kötését) **megjegyzi, és órákig nem kérdezi újra** (mint a kopogtatók kudarc-számlálója, M3 (a)), és a lap kimondja: *„2
társad régebbi programot futtat — amíg nem frissítenek, nem cseréltek”*, illetve *„a társaid újabb programot futtatnak — frissíts
(a telepítő sorral)”*. A `koino` parancs ugyanezt írja.

**④ A régi nyelv: a szélén fordítva.** A csere logikája mindig a legújabb nyelvet beszéli; ahol egy régi társsal beszél, a vonal
**széle** fordít (a kimenő üzenetet a régi alakra, a bejövőt az újra). Ahol nem alak, hanem **közös számítás** változik (a
szelet-halmaz, egy lenyomat), ott a régi számítás külön függvényként megmarad, **egy jegyzékben** (melyik változathoz, meddig) — a
csere a közös nyelv szerint kéri. Így a régi kód egy helyen él, és a dátum után egy mozdulattal kivehető.

**⑤ A kopogás és a szállítás.** A szállítás (a kézfogás, a titkosított csomag) a párbeszéd ALATT van — azt a `NYITAS` nem
egyeztetheti. A szállítás saját jelét a **kopogás** viszi (`KOPOG`, `HALLAK`: `sz: [1, 1]` — a kopogás türelmes, a régi elviseli); ha
nincs közös, a kézfogás el sem indul, és ugyanúgy kimondva. ⚠️ Ára: a kopogás nyílt — az úton ülő egy számot lát (melyik
szállítás-nemzedék); a koino forgalom a kopogásról ma is felismerhető.

**⑥ A kiírt alakok.** Mindegyik a saját alakjában hordozza a változatát (mint a meghívó `:2:`-je), és az átmenet alatt az új program
**mindkét alakot írja és olvassa** (két rekesz, két téma) — a régi olvasó a régit találja meg, az új az újat.

**⑦ A törések gyűjtése.** Egy kiadás legfeljebb egy új nyelvváltozatot hoz: a töréseket összegyűjtjük (ahogy a D89/1 a D85
törésébe került). A dátum a kódban áll (a jegyzékben); a lap 30 nappal előtte szól, ha még van társad, aki csak a régit beszéli.

## 6. Amit ez nem old meg (kimondott határok)

- **A számítás magjának változását** — az költözés (D118), nem nyelvváltozat. A nyelvváltozat a koinótól független (a készüléké): két
  koinó ugyanazon a nyelven beszél (a családi csere) — ezért nem lehet a mag része (PR6 (C) — elvetve).
- **A rossz órát:** ha egy készülék órája rossz, a dátum korábban vagy később zár. A jelzés kimondja a dátumot — az e-ember látja.
- **A biztonsági zárást:** ha egy régi nyelvben hiba van, a dátum előtt is le lehet zárni — de csak kimondva, a kiadásban.
- **A régi kód árát:** a régi nyelv ideig-óráig kód marad (fordító, régi számítás) — a dátumig. Ezért a gyűjtés (⑦).

## 7. A kérdések (⏸️ Csabáé)

- **PV1 — Mikor kell új nyelvváltozat?** (A) ⭐ **csak törésnél:** a bővítés jellel megy (új mező mindig elhagyható; új lépés csak ha
  mindkét fél jelezte — ahogy eddig); új szám akkor kell, ha egy régi programmal másképp működne (más alak, elhagyott lépés, más
  közös számítás); (B) minden protokoll-változás új szám (egyszerűbb szabály, de minden apró bővítéshez régi kódot tartunk).
- **PV2 — Hogyan beszéli a régit?** (A) ⭐ **a szélén fordítva**, a régi közös számítások egy jegyzékben (5. ④); (B) elágazások a csere
  logikájában (`ha a társ régi, akkor …`) — gyorsabb megírni, de a régi kód szétszóródik, és nehéz kivenni.
- **PV3 — Meddig?** (A) ⭐ **legalább 6 hónapig** a kiadástól, a töréseket gyűjtve (egy kiadás legfeljebb egy új változat — 5. ⑦);
  (B) 3 hónapig; (C) mindig csak az előző változatot (két gyors törés után a legrégebbi kiesik — szeptemberben ez napok lettek volna).
- **PV4 — Ha nincs közös nyelv?** (A) ⭐ **mindkét fél kimondva megáll**, a társat órákig nem kérdezi újra, a lap és a parancs megmondja
  az irányt és a teendőt (5. ③); (B) csendben kihagyja a társat (⛔ nem javaslom — a „nem-esemény néma”: épp ezt mérte a 90.).
- **PV5 — A kiírt alakok** (tábla, rekesz, DHT-témák, helyi kiáltás)? (A) ⭐ **az alak hordozza a számát, az átmenet alatt mindkettőt
  írjuk és olvassuk** (5. ⑥); (B) a kiírt alakok változása tiszta törés marad (egyszerűbb — de a régi program az új társat egyáltalán
  nem találja meg, és ezt semmi nem mondja ki).
- **PV6 — A próba: mi ellen mérjük?** (A) ⭐ **a valódi régi program ellen:** a próba a git-ből elővesz egy rögzített régebbi változatot
  (a mai, PR6 előtti programot — az 1-es nyelv jel nélkül), és a mai programmal cserélteti; ugyanígy egy kitalált 2-es változattal
  a fordító-szél is végigmegy; (B) csak a mai program „régi módban” (gyorsabb, de a régi kódot nem méri — a régi program jel nélküli
  viselkedése éppen az, amit tudni kell).

## 8. Az építés sorrendje (ha a kérdések eldőlnek)

① ✅ **A jel és az egyezés** (a négy első üzenet jele, a nyelvváltozat egy helyen, a közös nyelv számítása, a megnevezett hiba mindkét
félnél) + a próbák a valódi régi programmal (PV6). Ez maga NEM törés: a mai program az 1-es, a régi jel nélkül is az. *(Megépült
2026-11-06: a jel neve `ny` lett — a NYITAS-ban a `pv` már foglalt (a részvételi halmaz változata), a `v` könnyen összekeverhető vele; `js/csere/nyelvValtozat.js`, `meres/nyelvProba.js`. ⛔ A
próba egy valódi hibát talált: a megnevezett hiba előtt a kimenő sort ki kell üríteni, különben a jelünk a zárásban elveszik.)* →
② ✅ **a kopogás jele** (a szállításé, `sz`). *(Megépült 2026-11-06: minden kopogás-üzenet — `KOPOG`, `HALLAK`, `FOGLALT` — viszi,
egy helyen, a kapu `kuld`-jában; +11 bájt kopogásonként. Közös szállítás nélkül a kapu se munkát, se visszakopogást nem indít, de a
`KOPOG`-ra `HALLAK`-kal felel, hogy a társ a mi jelünket is lássa — így mindkét kapu kimondja (`NINCS-KOZOS-SZALLITAS`, társanként
egyszer), és a kör bukása is megnevezett (`nincsKozos`, a mondat az iránnyal és a teendővel). Új kopogás-üzenet nem kellett. A
közös szám a munkához is átér (`tars.szallitas` — a ④ kézfogás-választójának). A próba a valódi régi kapuval is (a git-ből). ⚠️ A
kopogás nem hitelesített: egy hamis „nincs közös” egy kört elvehet, mint ma egy hamis FOGLALT — a ③ emlékezetének ezért nem elég
egyetlen csomag.)* → ③ ✅ **az emlékezet és a kimondás** (társanként megjegyezve, a lap alsó sávja, a `koino`
parancs). *(Megépült 2026-11-07: `js/csere/nyelvEmlekezet.js` + a készülék-szintű `nyelvek.json`. Az őrjárat körének eredményei — a
kapu a nyelv hiányát (①, a munka bukásából) is a kör eredményébe teszi, ugyanabban az alakban, mint a szállításét (②): `nincsKozos`,
a réteggel és az iránnyal. Társanként (a kötés tábla-aláírója, különben a cím) egy körben egy megfigyelés; **3 egymás utáni kör**
után **6 óra szünet** (mint a kopogtatók számlálója, M3 (a) — a ② tanulsága: nem egy csomagra), utána egy megfigyelés is újra
szünetet ad. A „nem felelt” nem nulláz; bármelyik lement munka törli — a frissített társ bekopogása is (a szünet csak a mi
kopogásunkat fogja meg, a kapu közben is felel). A kimondás egy helyen (`nyelvekKepe`): az őrjárat naplója, a lap alsó sávja
(`/api/csere-allapot` → `nyelvek`: „⚠ frissíts” / „⚠ N régebbi társ”, a teljes mondat a címkében) és a `koino` parancs („A
protokoll ezen a készüléken: nyelv 1, szállítás 1 — ⚠ 2 társad újabb programot futtat — frissíts …”). A parancssor-próba két
valódi „2-es” készülékkel (`KOINO_SZALLITAS`, `KOINO_NYELV` — csak próbának) méri, a frissítést is.)* → ④ ✅ **a fordító-szél és a régi számítások jegyzéke** — üresen, de egy kitalált 2-es változattal végigpróbálva (különben a
réteg kész, és az éles út nem hívja — a 4. szabály-hiány). *(Megépült 2026-11-07: `js/csere/forditoSzel.js`. ⭐ **A szél a vonal
üzenetsorában** (`vonal.js` `uzenetSor`): a közös nyelv eldőlte után (`nyelvRogzitese`) a kivett üzenet a logika alakjára, a
kimenő (`ki`) a közös nyelv alakjára fordítva megy — minden munka-út egy helyen (a csere, a kérelmek, a válasz, a fájl a cserénél
és a randevún); a randevú kiszolgálójának első, jeles válaszát a kérő a jel után fordítja. ⛔ Az első üzenetek (`NYITAS`, `KERELEM`,
`FAJLKEREK`, `VALASZ` — és a `FAJLVEGE`, ami egy új kapcsolat első üzenete) soha nem fordítódnak. ⭐ **A legrégebbi beszélt nyelv
a jegyzékből jön** (a lépések dátumaiból — a `NYELV_LEGREGEBBI` szám kikerült: két forrás elcsúszott volna); a dátum napján a
régi kiesik, és a társa megnevezett hibát kap (③). ⭐ **A közös számítás** a közös nyelv szerint (`sor.szamitas` — ma a
szelet-párok; a kérhető nevek listáját a betöltés és a próba ellenőrzi). ⚠️ A nyitás számai a közös nyelv ELŐTT készülnek (a saját
legújabb szerint): egy számítás-törés alatt a vegyes pár nyitása nem egyezik, és a régi párokon egyeztet — helyesen, a gyors út
nélkül (kimondott ár). ⭐ **A szállítás: nem szél, hanem választó** — a kapu a kopogásból a közös szállítást a foglalathoz és a
címhez feljegyzi, a kézfogás onnan olvassa, és annak a nemzedéknek a részeivel fog kezet (`szallitasReszei`; feljegyzés nélkül a
legrégebbivel). ⛔ Az építés lelete: a kézi `pajzsfuro` parancs saját kopogása a ②-ből kimaradt — most az is viszi a jelet, és
közös nélkül megnevezve kész. ⛔ A próba lelete: a kapu a saját szállítását csak a nyitáskor számolta — egy napokig futó
postaládán a lejárt régit is mondta volna (a kézfogás némán bukott volna); most minden kopogásnál. ⭐ **A ⑦ dátuma:** ha egy társ csak a régit beszéli (a lement munka közös nyelve vagy szállítása
régebbi a legújabbunknál — `nyelvek.json` `regin`), és a régi lépés 30 napon belül lejár, a lap alsó sávja és a `koino`
parancs kimondja, a nappal. A próba egy KITALÁLT 2-essel (`KOINO_PROBANYELV`, `KOINO_PROBASZALLITAS` — a lépés dátuma napokban):
az alak más (az üzenet neve más mezőben), a szelet-párok lenyomata más, a kézfogás kulcsai mások — az [1,2] az 1-essel a régin,
a lejárt lépésű 2-essel a 2-esen cserél, a valódi régi programmal (a git-ből) is.)* → ⑤ ✅ **a kiírt alakok** szabálya (PV5) és a
meglévők változatjele. *(Megépült 2026-11-07: `js/csere/kiirtAlak.js` — alakonként a legújabb szám (a tábla, a meghívó rekesze, a
DHT-témák és a kiáltás 1-es, a meghívó 2-es) és a régi alakok jegyzéke, MA ÜRESEN, lépésenként a dátummal (a dátum számítása egy
helyen: `valtozatDatum.js` — a nyelvé is onnan). ⭐ **A mai alakok az 1-esek, bájtra változatlanul** — a git-ből elővett régi
program ugyanazt számolja; ami ma nem mond számot, az az 1-es (mint a jel nélküli nyelv), ez a lépés tehát maga nem törés. ⭐ **A
szám a HELYBEN van**, nem csak a tartalomban: a tábla és a meghívó rekeszének sójában (`koino-tabla-so-2`,
`koino-meghivo-rekesz-2`), a téma címkéjében (`koino-cimjegyzek-2`), a kiáltás rejtett jelében (és a `v` mezőben), a meghívó
előtagjában — egy BEP 44 rekeszbe egy érték fér: ha a két alak egy helyre írna, a frissebb a régit felülírná. ⭐ **Az átmenet
alatt mindkettő**: az őrjárat és a parancsok minden élő alakba írnak (a tábla, a rekesz, a témák bejelentése, a kiáltás) és
mindegyikben néznek (a legújabbtól); a válaszoló a hallott alakban felel; a meghívót a program csak a legújabb alakban írja (a
telepítő sor a legújabb programot hozza), de a dátumig a régit is olvassa. ⭐ **Ahol a régi olvasó lát, ott kimondja**: a mai
olvasó a más alakú kiáltást (`ujabb-alak` / `regebbi-alak`) és a más számú meghívót az iránnyal nevezi meg — ⛔ az építés
lelete: eddig minden más számú meghívóra a „régi alakú — kérj újat” állt, egy újabb programmal kiadottra is (fordítva), és a
régi kiáltás-olvasó a más számú kiáltást csendben „másik koinónak” veszi; a `koino` parancs kimondja a kiírt alakokat. ⚠️ A
rekeszeknél és a témáknál a régi olvasó nem lát semmit (más helyen keres) — ezért kell az átmenet; a lejárt lépés után a régi és
az új egymást nem találja meg (kimondott határ — a lap a ⑦ dátumát a nyelvnél mondja). ⚠️ Ára: az átmenet alatt a DHT-kiírás
kétszer megy. A próba egy kitalált következővel (`KOINO_PROBAALAK` — csak a számában más): `nyelvProba.js` +4 (a régi program
ellen, a kiáltás valódi foglalatokon), a parancssor-próba +3 (három valódi folyamat a táblán és a témákon; a meghívó rekesze az
M8 útján, mindkét irányban).)*

*Kapcsolódik:* `program_retegek_atvizsgalas.md` (D123, R2, PR6), `koltozes_atvizsgalas.md` (KZ5), `meres/eredmenyek.md` 90., a
`vonal.js` fejléce (a párbeszéd), az `udpKapu.js` fejléce (a kopogás), a `titkositas.js` fejléce (a kézfogás).
