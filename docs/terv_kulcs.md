# ET-3 — A kulcs: több készülék és a helyreállítás (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-08. Programkód nem készült; amit csak mérés dönthet el, az a
8. szakaszban „mérendő”. A D-számok mellett a döntés címe áll.*

> **Állapot:** ✅ **eldöntve** (Csaba, 2026-11-08: *„mindet elfogadom, jöhet a következő téma.”* — ET-3/2 – ET-3/6 mind (A)) · ⚠️
> **2026-11-13: az építő átvizsgálása** ([`kulcs_atvizsgalas.md`](kulcs_atvizsgalas.md), a 93. méréssel) — az **ET-3/3 újra nyitva**; a
> kérdéseket a **KU1–KU6** viszi, ⏸️ Csabánál. A tervező ág véleménye és két kiegészítése: 11. szakasz.
>
> Csaba (2026-11-08): *„ez már kész van (aggodalom: ha valaki elhagyja)? több készülékről is tudja használni a kulcsát?”* — *„rendben,
> majd ne felejtsük el megtervezni, mert ez is fontos.”* — és a helyreállításról (**ET-3/1**): *„kutassunk tovább, a kulcs
> helyreállítással kapcsolatban, egyébb megoldások után is, ami nem igényel választott bizottságot, hanem inkább, egy randomizált,
> replikált, és titkosított automatikus folyamatot.”*

## 1. A rövid válasz

**Az azonosság ne egyetlen kulcs legyen, hanem három, különböző dolgú kulcs:**

- **A készülékkulcs** — minden készüléknek saját. Ezzel ír alá a készülék a mindennapokban, a SAJÁT láncán; így két készülék soha nem
  ágaztatja el egymás láncát, és egyetlen esemény sem vész el. Ha egy készülék elvész, csak azt kell kizárni.
- **Az azonosság kulcsa** — a mai kulcs (a mai e-emberek neve tehát nem változik). Ez vesz fel és zár ki készüléket. Az első
  készüléken él, és a mentésben.
- **A csere-kulcs** — a belépéskor előre lekötve: a láncon csak a lenyomata áll, maga a kulcs egyik készüléken sincs. Egyetlen
  dolga van: ha az azonosság kulcsát ellopták, vagy minden elveszett, ez jelöl ki új azonosság-kulcsot. ⭐ Ettől egy tolvaj, aki a
  telefonoddal együtt az azonosság kulcsát is elviszi, sem veheti el végleg az azonosságodat — a csere-kulcs nincs nála.

**A csere-kulcs mentése bizottság nélkül** (ET-3/1): papíron vagy fájlban, ÉS darabolva a hálózatban — a darabokat titkosítva,
véletlenül választott tagok gépei őrzik, és automatikusan adják vissza annak, aki tudja a jelszót, korlátozott próbálkozással.

⚠️ **Ez a mag változása** (**D123 — a program rétegei: „a számítás köt, a többi szabad”**): hogy ki egy esemény szerzője és mi a
lánca, az a számítás része. A mag változása költözéssel jár (**D66 — a megújulás = költözés, nem frissítés**). Ezért érdemes **az
első éles koinó előtt** megépíteni — egy koinóval indulunk, és ha utána kellene, mindenkinek költöznie kellene.

## 2. A mai helyzet (a kódból)

- **A kulcs** Ed25519, a beépített WebCryptóból (`js/kulcs/kulcsTar.js`), az adat-mappában egy fájlban, kimenthetően. Egy kulcs az
  egész belépő térben (**D25 — a belépő tér: a koinók családfája**): minden koinódban ugyanaz.
- ✅ **Kész:** a kimentés fájlba és a visszatöltés (`mentes`, `visszatolt` — csak parancssorból; a lapon nincs, a „fejlesztésre vár”
  jelzés áll a helyén).
- **Egy kulcs = egy szerző = koinónként egy lánc.** Minden esemény sorszámot, előzményt és lánc-gyökeret hordoz (**D63 — a
  lánc-gyökér: gördülő elköteleződés a saját láncra**). A tagság (a belépés — a horgony), a meghívás, a tanúsítás, a tudatpont-keret
  mind ehhez a kulcshoz kötött.
- ⚠️ **Két készülék ugyanazzal a kulccsal:** ha mindkettő ír, két esemény kapja ugyanazt a sorszámot — a lánc elágazik. A **D82 — a
  kettős lánc: nem büntet** szerint senki nem bünteti, de **sorszámonként** csak a kisebb azonosítójú esemény marad meg — vagyis
  mindkét ágból veszhet esemény, összevissza. *(Az építő pontosítása, 2026-11-13, a kódból: az első változat azt írta, hogy az egyik ág
  egészében nyer.)* ⛔ És
  nem csak a kézi műveletek írnak: az őrjárat magától is ír eseményt (a meghívás végrehajtása, a pontok felszabadítása, a lezárási
  összegzés, az ellentmondás bejelentése…) — két, ugyanazzal a kulccsal futó őrjárat szinte biztosan elágaztat.
- ❌ **Nincs:** a több-tanús helyreállítás (**D15 — a kulcs hitelesít, nem titkol; a helyreállítás több tanúból áll**) — ha a kulcs
  és a mentés is elvész, ma az azonosság elveszett.

## 3. Mit kell tudnia (a követelmények)

1. **Több készülék egyszerre, offline is,** és egyetlen esemény se vesszen el.
2. **Egy ellopott készülék kizárható;** a kár visszafordítható (D15), a pénz a várakozási ablakban megállítható (**D16 — a pénz
   lassú, nyilvános és megtámadható**).
3. **Ha minden elvész, helyreállítás választott bizottság nélkül** — véletlen, replikált, titkosított, automatikus (ET-3/1).
4. **Minden gép ugyanazt számolja** (**D17 — a konszenzus hatóköre**): nincs rangsor, nincs globális szám; a bizonyíték az
   eseménnyel utazik (**D81 — a bizonyíték az eseménnyel utazik**).
5. **Egy készülék terhe nem nő a koinóval** (9. szabály), és az utazó adat kicsi marad (6. szabály).
6. **Nulla függőség:** a beépített kriptográfiával (Ed25519, X25519, HKDF, PBKDF2, AES-GCM). Ami ezzel nem megy, az mérendő.
7. **Személyes adat nem kerül a láncra** (**D6 — személyes adat SOHA a láncra**) — a jelszó és a mentés sem.

## 4. A több készülék — három út

**(A) ⭐ Készülékkulcsok az azonosság kulcsa alatt.** Az azonosság kulcsa aláír egy `Keszulek` eseményt: *„ez a kulcs az én
készülékem (»telefon«)”*. A készülék ettől a saját kulcsával, a saját láncán ír, és a számítás az eseményeit az azonosság
nevében számolja. Két készülék láncából egy sorrend lesz: minden esemény megnevezi, a másik készülék láncából meddig látott (a mai
`latott` mező mintájára); ha két esemény egymásról nem tudott (mindkét készülék offline volt), egy rögzített szabály dönt közöttük
(a kisebb azonosító — mint a D82-ben), és a program kimondja.
- *Példa: a telefonon offline 3000 pontot teszel a „Park” gondolatra, a laptopon közben 8000-et a „Könyvtár”-ra. Együtt 11 000 —
  több, mint a keret. A két esemény nem tudott egymásról: a rögzített szabály szerint az egyik számít, a másik nem, és a lap kimondja:
  „a »Könyvtár«-ra tett pont nem fért bele a keretbe (a telefonon közben…)”.*
- **A kizárás:** az azonosság kulcsa aláír egy visszavonást, ami kimondja, a készülék láncából **meddig** érvényes (egy sorszámig —
  mint a befagyasztás: **D47 — az ellenőrzés az aláírás pillanatában történik, és befagy**). A tolvaj ezután írt eseményei nem számítanak — akkor sem, ha visszadátumozza őket.
- **Az új készülék felvétele:** a meglévő készülék és az új egy kóddal párosít (pl. QR), és a felvételt az azonosság kulcsa írja
  alá. ⏸️ Kérdés: a készülék maga is felvehet-e készüléket (ET-3/4).

**(B) Ugyanaz a kulcs, de a lánc összefésülhető.** Elágazáskor egy összefésülő esemény mindkét ágat beveszi. A kulcs-kezelés marad
a mai (`visszatolt`), de **egy ellopott készüléket nem lehet kizárni** — a kulcs maga az azonosság. A keret- és a szavazat-ütközés
ugyanúgy megoldandó. → csak a fél problémát oldja meg.

**(C) Egy elsődleges készülék, a többi csak távirányító.** A másodlagos készülék a műveletet az elsődlegesnek küldi, az ír alá.
Folyamatos kapcsolatot kíván (5. szabály: nincs folyamatos kapcsolat) → elvetendő.

⭐ **Javaslat: (A).** A mai azonosságok változatlanok maradnak (a mai kulcs lesz az azonosság kulcsa), és ugyanez a szerkezet adja a
kizárást és a helyreállítást is. *(Mások is így csinálják: a Keybase és a Matrix „kereszt-aláírása” is készülékkulcsokkal dolgozik.)*

## 5. A helyreállítás — bizottság nélkül (ET-3/1)

### 5.1 A csere-kulcs — előre lekötve

A belépéskor (és minden csere után) az azonosság **leköti a következő kulcsát**: a láncra csak a csere-kulcs lenyomata kerül. Amíg
nincs rá szükség, a csere-kulcs egyik készüléken sincs. Ha kell, a csere-kulcs aláír egy **kulcscserét**: új azonosság-kulcs, új
lekötött csere-kulcs, és hogy a régi kulcs láncából meddig érvényes minden.

⭐ **Miért ez a lényeg:** aki ellopja a telefonodat, és rajta az azonosság kulcsát, az a nevedben írhat (D15: ez visszafordítható),
de **nem cserélhet kulcsot** — a csere-kulcs nincs nála. Te a csere-kulccsal átveszed, és ami a csere után a régi kulccsal születik,
az nem számít. *(Ez a KERI „elő-rotáció” mintája — egy nyílt szabvány-tervezet a decentralizált azonosságok kulcscseréjére.)*

### 5.2 A csere-kulcs mentése — darabolva, jelszóval, véletlen tagoknál

A készüléked a csere-kulcsot **darabokra osztja** úgy, hogy bármely *k* darab együtt visszaadja, de *k*-nál kevesebb semmit nem
árul el (Shamir-féle titokmegosztás). Például 7 darab, ebből bármely 3 elég.

- **Véletlen:** a darabokat a koinó véletlenül választott tagjainak gépei őrzik. Az őrzők nem tudják, kinek a darabját őrzik (egy
  vakított jel alatt van), és egy darabból semmit nem tudnak meg.
- **Titkosított és jelszóhoz kötött:** egy darabot csak az kap vissza, aki tudja a jelszót — és az őrző gépe számolja a rossz
  próbálkozásokat (pl. 5 rossz után egy hétig nem felel). Így egy gyenge jelszót sem lehet végigpróbálgatni. *(Ez a „jelszóval
  védett titokmegosztás” — Bagherzandi–Jarecki–Saxena–Lu, 2011; Jarecki–Kiayias–Krawczyk–Xu, 2016: „hogyan védd a pénztárcádat
  online”. A Signal is így menti a kulcsokat, csak ott a darabokat egy központi kiszolgáló őrzi.)*
- **Replikált és automatikus:** ha egy őrző eltűnik (elhagyja a koinót, elveszti a gépét), a készüléked magától újraosztja a
  darabokat új őrzőkre. Egy darab ~100 bájt: az őrzőnek ez semmi teher.
- **A visszaállítás:** új készülék + a jelszó → a gép megkeresi az őrzőket (a hálózat mai útjain: a DHT-n, a kérelemmel), *k*
  darabot visszakap, összerakja a csere-kulcsot, és aláírja a kulcscserét. Senki nem dönt: a gépek a szabályt hajtják végre.
- **És papíron is:** a csere-kulcs kiírható papírra vagy fájlba (ma is van mentés) — ha a jelszót elfelejted, ez marad.

### 5.3 A veszteségek, és mi segít rajtuk

| Mi veszett el | Mi segít |
|---|---|
| Egy készülék (a többi megvan) | Egy másik készülékről kizárod; a lopott készülék eseményei a kimondott sorszám után nem számítanak. |
| Egy készülék az azonosság kulcsával (lopás) | A csere-kulcs (papír, vagy jelszó + a hálózat): kulcscsere; a tolvaj nem cserélhet kulcsot. |
| Minden készülék, de a papír megvan | Új készülék a papírról: kulcscsere. |
| Minden készülék és a papír, de a jelszót tudod | A hálózatból: az őrzők automatikusan visszaadják a darabokat. |
| Minden, és a jelszót is elfelejtetted | Ma: új regisztráció (az azonosság elveszett) — később a tanúk vagy a sürgősségi út (N9). |

## 6. Ami ebből a többi részt érinti

- **A mag és a költözés** (1. szakasz): a szerző és a lánc értelme a számításban van → az első éles koinó előtt.
- **A belépés és a meghívás** (**D56 — a két lépcsős beléptetés**; **D122 — a meghívó kulcs**): a meghívás és a tanúsítás továbbra is
  az azonosságra szól (a mai kulcsra és a horgonyra) — nem a készülékre.
- **A pénz** (D16): a nagyobb átutalás várakozási ablaka a lopott készüléket is megfogja; a kulcscsere az ablakon belül megállíthatja.
- **A lap:** a kulcs mentése (ma csak parancssorból), a készülékek listája („📱 Készülékeim” — felvétel, kizárás), a mentés állása
  („a csere-kulcsod 7 darabja közül 6 őrzője elérhető”). A „Hálózati beállítások” (ET-5) mellé illik.

## 7. A kérdések (⏸️ Csabáé)

- **ET-3/2 — A több készülék útja:** (A) ⭐ készülékkulcsok az azonosság kulcsa alatt (a mai kulcs marad az azonosság); (B) ugyanaz a
  kulcs, összefésülhető lánc (a lopott készülék nem zárható ki); (C) elsődleges készülék, a többi távirányító (folyamatos kapcsolatot
  kíván).
- **ET-3/3 — A tudatpont-keret két készülék között:** (A) ⭐ közös keret; ha két készülék egymásról nem tudva túllépi, a rögzített
  sorrend dönt, és a lap kimondja; (B) a keret készülékenként felosztva (pl. telefon 3000, laptop 7000) — offline biztos, de egy
  készülék nem használhatja a másik részét.
- **ET-3/4 — Ki vehet fel új készüléket:** (A) ⭐ csak az azonosság kulcsa (ami az első készüléken és a mentésben él); (B) bármelyik
  készülék — kényelmesebb, de egy lopott készülék is vehetne fel újat (a kizárása az általa felvetteket is kizárná).
- **ET-3/5 — A csere-kulcs mentése:** (A) ⭐ papíron vagy fájlban ÉS darabolva a hálózatban, jelszóval; (B) csak papíron vagy fájlban
  (mint ma); (C) csak a hálózatban.
- **ET-3/6 — Ha minden elveszett, a jelszó is:** (A) ⭐ egyelőre új regisztráció, kimondva — a tanúk vagy a sürgősségi út (N9) később;
  (B) már most a tanúk is (a D15 eredeti terve) — de ahhoz kell valaki, aki eldönti, hogy a tanúk elegek-e.

## 8. Mérendő (az építőnek, az átvizsgáláskor)

- **A mai elágazás:** két készülék ugyanazzal a kulccsal, két őrjárattal — hány esemény vész el egy nap alatt (a probléma súlya).
- **Az esemény mérete** a készülékkulccsal (a felvétel bizonyítéka az eseménnyel utazik — +hány bájt; 6. szabály).
- **A láncok összefésülése:** egy azonosság 2–3 készülékének láncából egy sorrend — mennyibe kerül a számításban.
- **Az őrzők megmaradása:** hány véletlen őrző kell, hogy egy év múlva is meglegyen *k* darab (a lemorzsolódás a terepi adatokból).
- **A jelszavas darab-visszaadás a beépített kriptográfiával:** a „jelszóval védett titokmegosztás” egy vak kiértékelést kíván egy
  elliptikus görbén; a WebCrypto ezt közvetlenül nem adja — megvalósítható-e a meglévő X25519-cel, vagy egy egyszerű saját
  számolással (ritka művelet, lehet lassú).

## 9. Az átadás (az építőnek)

**A döntések** (Csaba, 2026-11-08, mind (A)): **ET-3/2** készülékkulcsok az azonosság kulcsa alatt (a mai kulcs az azonosság) ·
**ET-3/3** közös tudatpont-keret, a túllépést a rögzített sorrend dönti el, kimondva · **ET-3/4** új készüléket csak az azonosság
kulcsa vehet fel · **ET-3/5** a csere-kulcs papíron vagy fájlban ÉS darabolva a hálózatban, jelszóval · **ET-3/6** ha minden elveszett,
a jelszó is: egyelőre új regisztráció, kimondva. Az elv (ET-3/1): a helyreállítás választott bizottság nélkül.

**A következő építési lépés:** egy átvizsgálás a 8. szakasz méréseivel (a mai elágazás súlya, az esemény mérete, a láncok
összefésülése, az őrzők megmaradása, a jelszavas darab-visszaadás a beépített kriptográfiával). ⚠️ A mag változása — **az első éles
koinó előtt**; a D-számot az építő adja (ET-3/2 – ET-3/6).

## 10. Kiegészítés az ET-11-ből (2026-11-09)

A pénz átutalásához egy **fizetési kulcs** is kell: minden e-embernek egy, ami a készülékein csak a koino saját kódjával titkosítva van
meg; az átutaláson ennek az aláírása is ott van (a tanúk csak így nyugtázzák). A készülékkulcs marad a mindennapi, automatikus eseményekre.
Ha a kód elveszett, a csere-kulccsal új fizetési kulcs és új kód adható meg. Részletek: [`terv_atutalas.md`](terv_atutalas.md) 9.

## 11. Az építő átnézése (2026-11-13) — és amit ebből a terv átvesz

Az építő az ET-3 kódolása előtt a tervet a mai kóddal vetette össze. **Az iránya stimmel** (a gond valós és gyakori — az őrjárat is ír;
az alap kész — **D70 — egy író: koinónként és készülékenként egyetlen folyamat fűz a tárhoz**). **Három dolgot viszont a terv nem mondott
ki** — ezekben igaza van, a tervező ág átveszi.

### 11.1 A tudatpont-keret és a csalás bizonyítéka ma EGY láncra épül (az ET-3/3 újra — KU1)

Minden pont-esemény bemondja, mennyi a szerzőjének összesen kiosztva (**D42 — a bemondott összeg: a keret egyetlen eseményből
ellenőrizhető**), és a program ezt a szerző láncával veti össze — erre épül a **D63 — a lánc-gyökér**, a **D78 — az összegző Merkle-fa**,
a **D79 — a teljes kiosztás-lista ellenőrzése: szúrópróbával** és a **D81 — a bizonyíték az eseménnyel utazik**.

*A 93. mérés (b): a laptop 8000 pontot tesz a „Könyvtár”-ra, a telefon offline 1000-et a „Park”-ra, és bemondja: „összesen 1000” — ő csak
a saját láncát ismeri. A két láncot egynek számolva a mai gépezet a telefont hazugnak látja („bemondva 1000, a láncából 9000”): egy
becsületes, két készüléket használó embert vádolna meg.* ⛔ Ez a mai legfontosabb garanciát sértené: **becsületes láncra nem állítható
össze vád** — és a D42 lényegét is: *„egyetlen eseményből eldől”*.

**A tervező ág véleménye: KU1 (B)** — a készülékenként osztott keret; a garancia így **a szerkezetből** jön, nem egy újonnan épített
gépezet helyességéből, és a mérés szerint a D42 változatlan marad. ⭐ **Egy kiegészítéssel** (az átvizsgálás (B)-jében a részeket az
azonosság kulcsa osztja újra):
- **a keret magától áramlik a készülékeid között, amikor találkoznak:** a több szabad ponttal rendelkező készülék a saját aláírt
  eseményével átad a másiknak (a bizonyíték az eseménnyel utazik, D81). **Ehhez nem kell az azonosság kulcsa** — ami a KU6 (A) után akár
  papíron is lehet, és akkor minden átrendezéshez elő kellene venni. Egy lopott készülék ezzel semmit nem nyer: csak a saját részét
  adhatja oda, és csak a te másik készülékednek;
- **az ára** (kimondva): egy készülék csak a saját maga tett pontot rendezheti át — ha a telefonon a laptopon tett pontot veszed le, a lap
  kimondja: *„ezt a laptop végzi el, amikor legközelebb fut”*, és a laptop magától végrehajtja;
- **egy kizárt készülék része nem ragad be:** a kizárás a keretrészét (és a pontjait) a kizáró készülékre viszi.

### 11.2 A készülék felvétele és kizárása a koinók FÖLÖTT (KU2)

A kulcsod minden koinódban ugyanaz (**D25 — a belépő tér: a koinók családfája**), egy esemény viszont koinóhoz kötött — ezért a felvétel
és a kizárás **egy koinótól független, aláírt tanúsítvány**. **A tervező ág véleménye: KU2 (A).** ⭐ **Egy kiegészítéssel:** a kizárás
határa **sorszám** (nem idő — azt vissza lehet dátumozni, **D47 — az ellenőrzés az aláírás pillanatában történik, és befagy**), a sorszám
viszont koinónként más; ezért a kizárás koinónként felsorolja a határt, és **ahol egy koinó nincs felsorolva, ott a kizárt készülék
egyetlen eseménye sem számít** — egy tolvaj így egy új koinóban sem léphet fel a nevedben. A lap a felsorolást magától kitölti.

### 11.3 A többi kérdés — a tervező ág véleménye

- **Az esemény alakja** (az átvizsgálás 4.1): a szerző marad az azonosság, és jön egy új aláírt `keszulek` mező; a lánc a (szerző,
  készülék) páré — egyetért: ez az, amit a terv 4. szakaszának (A)-ja mondott (*„a számítás az eseményeit az azonosság nevében
  számolja”*), most kimondva.
- **KU3 — a név a kulcscsere után:** (A) — marad; a nevet a csere-tanúsítványok lánca köti az aktuális kulcshoz.
- **KU4 — a fizetési kulcs:** (A) — a lenyomata már most, a csere-kulccsal együtt. *Ha csak a pénzzel jönne, az azonosság kulcsa nem
  írhatná alá biztonságosan (egy tolvaj előbb köthetné le a sajátját) — a csere-kulcsnak kellene, vagy új koinó-család.*
- **KU5 — a sorrend:** (A) — most a mag; a hálózati darabolt mentés később, saját átvizsgálással. *Nem ideiglenes megoldás: a mag
  végleges alakja épül meg (a csere-kulcs lenyomata), a hálózati mentés a szabad rétegben kiegészítés (**D123 — a program rétegei: „a
  számítás köt, a többi szabad”**). Az ET-3/5 döntése áll, csak a sorrend ez.*
- **KU6 — az azonosság kulcsa csak kezel:** (A) — és a 11.1 kiegészítése (az áramlás a készülékek között) épp ettől lesz fontos.
- **A szavazat:** nem kell külön kérdés — a mérés szerint a szavazat ma is időrendben számít (az utolsó), és a szerző az azonosság marad.
  *(A tervező ág az első átnézésnél ET-3/9-ként külön kérdést javasolt — visszavonva.)*

### 11.4 Egy pontosítás az átvizsgáláshoz (a kódból, 2026-11-13)

Az átvizsgálás 1. szakaszának 3. pontja szerint a kulcs a hirdetőtáblán és a meghívó rekeszében is aláír. A kód szerint **a hirdetőtábla
már ma sem a személyes kulccsal ír** (a készülék saját tábla-kulcsa, szándékosan a személytől elválasztva — `tablaKulcs.js`, D6), **és a
meghívó rekesze sem** (a meghívó titkából származtatott kulcs — `meghivoRekesz.js`) — az átvizsgálás 4. szakaszának 5. pontja (*„a tábla
és a DHT készülékenként”*) ezzel egyezik. A személyes kulcsot a **kézfogás** (`titkositas.js`) és a **kereső megújítása**
(`keresoMegujitas.js`) használja — ott kell a készülékkulcs és a tanúsítvány.

## Napló

- **2026-11-08** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-3/2 – ET-3/6 Csabánál.
- **2026-11-08** — Csaba: *„mindet elfogadom”* — ET-3/2 – ET-3/6 mind (A); átadható az építőnek (9. szakasz).
- **2026-11-13** — az építő átvizsgálása ([`kulcs_atvizsgalas.md`](kulcs_atvizsgalas.md), 93. mérés): a keret és a bizonyíték egy láncra
  épül → ⏸️ ET-3/3 újra (KU1); a kérdéseket a KU1–KU6 viszi. A tervező ág véleménye (11. szakasz): mind (A), a KU1-nél (B); két
  kiegészítés (a keret magától áramlik a készülékek között, az azonosság kulcsa nélkül; a kizárásban fel nem sorolt koinóban a készülék
  egyetlen eseménye sem számít); egy pontosítás (a hirdetőtábla és a meghívó rekesze már ma sem a személyes kulccsal ír). Az első
  átnézéskor felvett ET-3/7 – ET-3/9 visszavonva (a KU-k viszik).
