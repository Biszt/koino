# A tervező ág — a terv a munka előtt

*Létrehozva: 2026-11-08, Csaba kérésére.*

> Csaba (2026-11-08): *„miközben dolgozól a másik ágon, én fork-ot hajtottam végre, azért, hogy itt program írás nélkűl tudjunk
> előre haladni a koino tervezésével. így a terv egy kicsit előrébb tudna járni, a tényleges munkától. ezt vezesd fel a
> documentumok közé is.”*

## 1. A két ág, és hogy ne írjanak egymásra

2026-11-08 óta két session dolgozik egyszerre ugyanazon a tárón (`C:\koino`):

- **Az építő ág** — a megszokott munka: átvizsgálás, mérés, építés, próbák, commit. A közös dokumentumok (`CLAUDE.md`,
  `fejlesztesi_terv_fazis2.md`, `alappillerek.md`, `folyamatabra.md`, az átvizsgálások, `meres/eredmenyek.md`) az övéi.
- **A tervező ág** — programkód nélkül halad előre: a következő lépések terve, a nyitott kérdések előkészítése döntésre, a távolabbi
  részek (a pénz, a konszenzus, a titkos szavazás…) végiggondolása. Mire az építő odaér, a terv kész, és a döntések Csabánál vannak
  (vagy már megszülettek).

A szabályok:

1. **A tervező nem ír programot és mérő-szkriptet.** A `js/`, `felulet/`, `meres/`, `termux/`, `windows/` és a `koino.js` az
   építőé. Amit csak mérés dönthet el, azt a terv kimondja („mérendő: …”), és az építő méri meg az átvizsgáláskor — a „előbb a mérés,
   aztán az építés” elve így is áll.
2. **A tervező csak a saját fájljaiba ír:** ebbe, és az új tervdokumentumaiba (`docs/terv_<téma>.md`). A közös dokumentumokhoz nem
   nyúl — azokat az építő vezeti át, amikor a tervet átveszi (a javításokat is: 4. szakasz).
3. **A számozás külön:** a tervező témái **ET-1, ET-2, …** („előre-terv”) jelet kapnak, egy témán belül Csaba döntései **ET-4/1,
   ET-4/2, …** jelet. Amikor az építő átveszi őket, a következő D-szám lesz belőlük (a következő szabad: D127), mellette az ET-jel (pl.
   „D130 (ET-4/1)”).
4. **A commit csak a saját fájlra:** `git add <fájl>` és `git commit -F <üzenet> -- <fájl>` — a fájl megnevezése miatt a másik ág
   félkész (akár már hozzáadott) munkája sosem kerül bele.
5. **A D-szintű döntés Csabáé** — mindkét ágon döntési kérdésként.
6. **Az átadás:** egy téma végén a tervező kimondja, mi kész a tervben, mi a következő építési lépés, és mit kell előtte mérni; az
   építő ebből indítja az átvizsgálást (a megszokott módon, de már a kész tervvel).
7. **A hivatkozás:** egy D-szám mellett mindig ott áll a döntés címe is (Csaba, 2026-11-08: *„írd le a »címét« is, mert nem akarom
   kikeresni a dokumentumokban”*).

## 2. A kiinduló kép: a teljes P2P koino terve (2026-11-08)

*Az állapot a D126 lezárásakor: 126 tervezési döntés (D1–D126), 249 elágazás, 92 mérés, ~1430 önpróba, a program 375 fájl /
~7390 KB. Csaba még aznapi helyreigazításai benne vannak (4. szakasz).*

### 2.1 Mi a koino, és mi a Fázis 2

A **Kollektív Intelligencia Online** egy közösségi tér, amit a tagjai irányítanak. A tagok **e-emberek**: egyszerre tulajdonosok,
fejlesztők, moderátorok és felelősök. A lényeg a közös döntés: gondolatokból javaslatok, javaslatokból egyezmények születnek,
központi szereplő nélkül.

**A cél kezdettől az egyenrangú, skálázható P2P koino volt; a központi szerveres koino mindig csak lépcsőfok** (Csaba, 2026-11-08).
A **Fázis 1** (`koino_1.1`, a koino.hu) ez a lépcsőfok: a döntés-gépezetet bizonyította, ma befagyasztva fut. A **Fázis 2** a P2P
koino (`C:\koino`): a készüléken fut, szerver nélkül, aláírt eseményekkel. A **D22 (P2P az első kiadástól — nincs központi szerveres
kiadás)** azt mondta ki, hogy köztes, szerveres kiadás nem lesz. ⚠️ A sokat idézett mondata (*„a kis családi közösségeknek is P2P-nek
kell lenniük”*) nem a fordulat oka: a skálázhatóságról szólt — nincs külön, családi méretre szabott, nem skálázható működés.

A nyelv JavaScript maradt (**D23 — a megvalósítás nyelve: JavaScript marad**), a régi adat nem költözik (**D24 — új regisztráció
lesz**). A koino önálló program, a böngésző csak a rajzolója (**D29 — a futtatókörnyezet: a koino önálló program, nem böngésző**).

A koino **eszköz, nem közösség** (**D13 — a koino eszköz, nem közösség; a fork normál üzemmód**): bárki indíthat koinót (család,
osztály, munkahely, párt), és a szétválás normál működés, nem vészkijárat. Nincs „családi” és „globális” koino: egy program van, ami
nő — ezért a szerkezetének az első naptól a milliárdot kell bírnia. **Egy koinóval indulunk** (Csaba, 2026-11-08). ⚠️ **A mostani
koinók teszt koinók;** az „első koinó” az, amit Csaba majd szélesebb körben terjeszt (*„majd szólok, hogy melyeket akarom szélesebb
körben is terjeszteni”*). ⭐ **Ideiglenes megoldást kerülünk:** ha egy rész végleges alakja ismert, az elejétől úgy épül (Csaba,
2026-11-08).

### 2.2 A szabályok, amik minden döntést kötnek

**A nyolc szabály** (a platform-függetlenség — D30–D32):
1. A szállítás cserélhető.
2. Semmi nem múlik egyetlen címen vagy szolgáltatáson.
3. **A bizalom sosem a csatornából jön.** Egy eseményt soha nem fogadunk el azért, mert „megbízható helyről jött”. Minden esemény —
   a saját műveletem, a társtól jött, egy fájlból behozott — ugyanazon az ellenőrzésen megy át (az aláírás, a koinó, a szerző lánca,
   a bizonyíték). *Példa: ha egy rosszindulatú közvetítő azt adja tovább, hogy „Anna igennel szavazott”, de az esemény alatt nincs ott
   Anna aláírása, a kapu eldobja — mindegy, kitől jött.*
4. Mindig van kézi út (fájlba ki, fájlból be).
5. Nincs folyamatos kapcsolat: postaláda van, nem élő továbbító.
6. Nulla függőség, és az utazó adat kicsi marad.
7. A böngésző csak kliens.
8. Jogi védelemre nem tervezünk.

**A kilencedik, ami fölöttük áll:** a skálázhatóság szempontjából az első verziónak is késznek kell lennie. A szerkezet és az
illesztés milliárdos, a megvalósítás mögötte lehet egyszerű. A „végtelen” mércéje: egy készülék terhe nem a koinó méretétől függ,
hanem attól, amivel ő maga foglalkozik.

**D106 — a „végtelen” mércéje: a koinó saját határa, és a kimondott kivétel.** Minden rögzített szám a programban egy korlát. Kétféle
van: a **teher-korlát** azt fogja meg, mennyit dolgozik egy készülék (pl. legfeljebb 3 kötés) — ez rendben van, ettől marad kicsi a
teher. A **méret-korlát** viszont egy szám, ami a koinóval együtt nőne (pl. hány darabra osztjuk a koinó gyökerét). A szabály: egy
méret-korlát se fogyjon el hamarabb, mint maga a koinó — a koinó saját határa az, ahány entitást egyáltalán meg tud különböztetni
(~2^128). *Példa: a gyökér darabjainak száma 16 biten (65 536 darab) állt — egy nagy koinó kinőtte volna, ezért 144 bitre nőtt.* Ahol
ez túl drága lenne, ott **kimondott kivétel** áll, számmal és indokkal: a pontösszegek a mai számábrázolással ~900 milliárd e-emberig
pontosak (az emberiség ~87-szereséig) — ezért ott nem írtuk át az adatformátumot, hanem kimondtuk a határt.

**A munka elvei:** az egyszerű és változtatható jobb a teljesnél (ami ritka és nem végzetes, azt felírjuk, de nem építjük); a helyes
sorrend fontosabb, mint hogy minél hamarabb látsszon valami; amire egy lépés épül, azt nem halasztjuk; előbb a mérés, aztán az
építés; egy próba csak akkor bizonyít, ha elrontva bukik.

### 2.3 A döntés gépezete

- **A gondolat** a platform alapegysége. A **kategóriák** és a **gondolattípusok** rendszerezik — ezek is önálló entitások, mert róluk
  is a közösség dönt.
- **A tudatpont:** mindenkinek ugyanannyi (10 000). Nem elkölthető, csak szétosztható és bármikor átrendezhető. Prioritást fejez ki,
  nem szavazaterőt. Egyben tárolási vállalás is (**D3 — a tudatpont tárolási vállalás is**; **D26 — az entitás mérete**): aki pontot
  tesz egy entitásra, az a készülékén tárolja. Amire senki nem tesz pontot, az eltűnik (**D14 — a tartós mag = a csalás-elleni
  csontváz**: a felejtés a rendszer alapállapota).
- **A szerkesztési javaslat:** csak az tehet, akinek pontja van az érintett gondolaton. Módosít, áthelyez, töröl vagy egyesít; ha több
  entitást érint, érintettenként külön dől el, és mindnek teljesülnie kell (**D85 — a javaslat és az egyezmény ugyanolyan entitás,
  mint a gondolat**).
- **Az általános javaslat** a közösség álláspontja (**D27 — szerkesztési és általános javaslat/egyezmény**). ⏸️ **Nincs rendesen
  megtervezve** — napirenden (3. szakasz, ET-1). Az alkotmány, a 2/3-os rendszer és a program-frissítés mint gépezet elvetve (**D64 —
  az alkotmány**; **D66 — a megújulás = költözés, nem frissítés**: *„mind sok új élt hoznak létre”*).
- **A szavazás:** aki pontot tett az érintettre, egyenlő súllyal szavaz. A titkos, de ellenőrizhető szavazás (**D2 — szavazás: titkos,
  de ellenőrizhető, kiváltságos adatkezelő nélkül**) cél maradt, még nincs megépítve — napirenden (ET-2).
- **A küszöbök:** a tulajdonosok érték javaslatainak mediánja (**D4 — küszöb-kormányzás: medián + felelősség-elv**). A bizonyossági
  mutató szerint a döntés a minimum és a maximum döntési idő között zárul — annál hamarabb, minél egyértelműbb az eredmény és nagyobb a
  részvétel.
- **Az egyezmény** (**D17 — a konszenzus hatóköre és biztonsági alapja**) nem kihirdetés, hanem számítás. A prototípusban a szerver
  egy időzített feladattal lezárta a javaslatot, és beírta az adatbázisba, hogy „elfogadva” — valaki kimondta. A P2P koinóban nincs,
  aki kimondja: minden készülék maga számolja ki a nála lévő eseményekből (a javaslat, a szavazatok, a pontok, a küszöb-javaslatok, az
  idő), hogy a feltételek teljesültek-e. *Példa: Anna és Béla gépén ugyanaz a javaslat és ugyanaz a 12 szavazat van — mindkét gép
  ugyanazt számolja („elfogadva, kedd 18:00-kor”), anélkül, hogy egymást kérdeznék. Ha Béla gépére egy szavazat még nem jutott el, az
  ő gépe addig mást mutathat — ezért hosszúak a döntési idők, és ezért mondja ki a program, amit nem lát.* Az egyezmény ténye és
  hatálya külön áll (**D8 — egyezmény: tény ↔ hatály szétválasztása**), és a tény is csak addig él, amíg valaki tartja (D14).

### 2.4 Az identitás

- **A kulcs maga a személy** (**D15 — a kulcs hitelesít, nem titkol; a helyreállítás több tanúból áll**). Személyes adat nem kerül a
  láncra (**D6 — személyes adat SOHA a láncra**); a név a profilban sózott lenyomattal szerepel, törölhető (**D88 — a név a
  profilban**).
  - ✅ **Kész:** a kulcs kimentése fájlba és visszatöltése (`mentes`, `visszatolt` — csak parancssorból; a lapon még nincs).
  - ❌ **Nincs megépítve:** a több-tanús helyreállítás (ha a kulcs és a mentés is elvész). Ma ilyenkor az azonosság elveszett.
  - ⚠️ **Több készülék:** a kulcs átvihető egy másik készülékre, de ha két készülék egymástól függetlenül ír alá, a saját lánc
    kettéágazik (**D82 — a kettős lánc: nem büntet**): mindenki ugyanazt az ágat számolja érvényesnek, a másik ág eseményei nem
    számítanak. Egy személy több készülékének nincs még kidolgozott útja — napirenden (ET-3).
- **A két lépcső** (**D56 — a két lépcsős beléptetés**): az 1. lépcső egy meghívó — ettől tag vagy, és minden mehet (gondolat, pont,
  javaslat, szavazat). A 2. lépcső három tanúsítás felhatalmazott tanúsítóktól — ez a pénztárca kapuja (**D11 — Sybil-pénz ütemezési
  szabály**: pénz csak bizonyított identitás után). A felhatalmazás megbízás, nem pontszám (**D60**). Az ellenőrzés a gyökérig megy, és
  mérten logaritmikus (**D59 — az ellenőrzés a gyökérig megy, mert mérve olcsó**). A papír nélküli emberrel ebben a verzióban nem
  számolunk (**D58**). ✅ **ET-4/1** (Csaba, 2026-11-08): az automatikus, számított 2. lépcső elvetve — **marad a felhatalmazásos
  rendszer**. ✅ **ET-4/2** (Csaba, 2026-11-08): **marad a D57 — a küszöb abszolút szám, nem rangsor**: az tanúsíthat, akinek
  legalább N felhatalmazása van; N-t a 2. lépcsősök érték javaslatainak mediánja adja (**D57/b**). *„rendben. maradjon ez.”*
- **A rendszer bejelentő, nem bíró** (**D19**): ami nem ellenőrizhető, azt kimondja. A „még nem értünk össze” jelzés tényt mutat, nem
  ítéletet (**D49 — a minimum kemény szabály, a jelzés tényt mutat**; **D55 — a nyíltság**).
- **A bemutatkozás** (**D62 — a bemutatkozás lánc-esemény, és csak kölcsönösen számít**): akik találkoztak, aláírják egymásnak; csak
  a kölcsönös számít.
- **A szeletelt világban** a tagság a tagnál utazik a bizonyítékával (**D93 — az identitás a szeletelt világban**), a 2. lépcső
  szúrópróbával igazolható (**D94**), a tagsági lánc korlátja 256 (**D113**).
- **A belépés a lapon** (**D121 — a meghívás a lapon**; **D122 — a meghívó kulcs: „egy bemásolás, és a következő csere után bent
  vagy”**).

### 2.5 Az adat: események, tárak, számítás

- **Minden művelet aláírt esemény**, a szerző láncán (**D63 — a lánc-gyökér: gördülő elköteleződés a saját láncra**). Módosítás és
  törlés nincs, csak hozzáfűzés. Minden esemény ugyanazon az egy kapun megy be (3. szabály).
- **A tár** (**D73 — az entitásonkénti tár alakja**) és mögötte **egy író** (**D70 — koinónként és készülékenként egy folyamat fűz a
  tárhoz**).
- **A szelet** (**D72 — a szeletelés: ki mit tart, és a szöveg külön darab**): egy entitás eseményei — a tárolás és a csere egysége.
- **Két tár** (**D75 — a két tár: tartós és átmeneti**): a tartós az, amit vállalok, az átmeneti az, amit csak láttam (eldobható).
  Ami nincs nálam, azt kérésre hozom el (**D76 — a kérelmezés**).
- **Az összegző Merkle-fa** (**D78**) teszi ellenőrizhetővé, amit egy készülék nem lát egészében (**D79 — a kiosztás-lista
  szúrópróbával**; **D80–D82 — az ellentmondás bizonyítéka, a kettős lánc**).
- **Az állapot nem tárolt, hanem számított.** A **mag** (**D123 — a program rétegei: „a számítás köt, a többi szabad”**) az a 17 fájl,
  ami a koinó képét és a kaput számolja; ha ez változik, költözés kell.

### 2.6 A hálózat

- **UDP mindenhol** (**D67 — a UDP marad a fő út**; **D69 — UDP mindenhol**), kopogás a fal órájához igazítva, postaláda (**D34**). A
  csere titkosított, a koinó alapból zárt (**D89 — ki olvashatja egy koinó tartalmát**).
- **A megtalálás:** a kötés (**D71 — a kopogás-kör a társat keresi, nem a címét**), a hirdetőtábla a DHT-n, a raj és a címjegyzék
  (**D91 — a címjegyzék: a fa és a raj**), a függő kérelem (**D92 — a kérelmezés útja és alakja**).
- **A csere** szeletenként (**D74 — a tartomány-lenyomat**), a társ-emlékezettel (**D98**), újdonság nélkül fél körönként egyszer
  (**D99**), csak a vállalt szeletekben (**D95 — a szigorú (b) alakja**; **D97 — a közös halmaz és a raj a körben**), 24 órás
  kifutással (**D104 — a kifutás**).
- **A kérés és a korlátok:** a kérelem (**D92**), a kiszolgálási keret (**D109**), a törzs-határ (**D120 — a nagy törzs elemenként,
  kérésre**), a több forrás (**D114**). ⏸️ Csaba (2026-11-08): **részletes „Hálózati beállítások” menüpont** kell — napirenden (ET-5).
- **A keresés** (**D105 — a kereső-réteg alakja**; **D107**) és a **felderítés** (**D108**, **D112**).
- **A protokoll nyelvváltozata** (**D124 — „minden munka elején kimondva”**).

### 2.7 A felület

A lap a böngészőben fut, a helyi kapun át, öt őrrel (jelszó, Origin, Host, útvonal, JSON-írás). A prototípus kártyái bájtra
átjöttek; a koinós többlet köréjük épül: a pakli (**D100 — a ház**), a modálok és a bejáró (**D101**, **D102**), az alsó sáv, az
értesítés a készülék saját értesítőjén (**D103**), a belépő tér (**D25 — a belépő tér: a koinók családfája**), a csatlakozás, a
társak, a Struktúra, a Síkidom, a Keresés. A parancssor mindent tud, amit a lap — a rajzot kivéve (4. szabály).

### 2.8 A koinók családja és a program megújulása

- **D66 — a megújulás = költözés, nem frissítés:** a régit nem írjuk felül; aki akar, átköltözik.
- **D118 — a költözés alakja: a múlt közös, a jelenlét személyes.** A koinó neve a születése lenyomata, a szabályai a születésben
  állnak; másik szabály = másik koinó.
- **D119 — a koino-verzió kártya és a családi őrjárat:** egy gyermek-koinó születése, a kártyáján a teljes programmal.
- **D123 — a program rétegei**, és ami rá épült: **D124 (a protokoll nyelvváltozata)**, **D125 (telepítés a kártyáról)**, **D126 (a
  közösség feltöltött nézetei)**.
- **A kormányzás három szintje** (`kormanyzas.md`, **D12 — a három szint**): a gondolat és a program ugyanazzal a gépezettel dől el; a
  koinók sokasága felett nincs kormányzat. ⭐ **A kódról nem kell szavazás** (Csaba, 2026-11-08 — az építő ág `1453b06`): a program
  változása egy új koinó-verzió, és mindenki maga dönti el, átköltözik-e (D66). A forráskód-kormányzás öt lépcsőjéből így ennyi kell: a
  javaslat (egy koino-verzió kártya) és a bevezetés (a költözés). Ami még nincs (**N9 — elismerés-entitás + kinevezési rendszer**):
  - **az elismerés:** egy új entitás, amit az e-emberek egymásra „aggatnak”, az érintett beleegyezésével (pl. *„ért az adatbázisokhoz
    — 14-en ismerték el”*). Tájékoztat, nem jogosít: a szavazat egyenlő marad, de látszik, ki ért valamihez — így egy kód-javaslatnál
    nem kell se vakon szavazni, se szakértőkre bízni;
  - **a sürgősségi út:** ha baj van (pl. egy súlyos hiba a programban), nincs idő a hosszú döntésre. Erre a közösség kinevezett
    „őröket” választhat, időkorlátos megbízással, nyilvános lépésekkel és utólagos közösségi jóváhagyással. Ugyanez a minta lehet a
    kulcs-helyreállító bizottság is (D15) — de mindig **tanú, nem hatóság**: a szava önmagában soha nem elég.
  - ✅ **ET-6/1** (Csaba, 2026-11-08): **az elismerés egyelőre nem kell** — *„még nem biztos, hogy szükséges ez.”* A sürgősségi út
    nincs elvetve; a kulcs-helyreállításhoz bizottság nélküli megoldást keresünk (ET-3/1).

### 2.9 Ami még nincs: a pénz és a konszenzus

- **A pénz** (**D10 — alkotmányos kibocsátás + egyenlő osztalék**; **D11 — Sybil-pénz ütemezési szabály**; **D16 — a pénz lassú,
  nyilvános és megtámadható**; **D20 — öröklés: a pénz igen, a tudatpont és az azonosság soha**; és Csaba első konkrét terve,
  2026-09-02): egyenlő osztalék, feltétel nélkül, „a létezéséért”; az induló 10 koinos egy év alatt; évi 10% az összes pénzre,
  mindenkinek egyenlően; belső piac, ahol az ár a keresletből derül ki. Csak az identitás éles bizonyítása után indulhat.
  - ⚠️ **Az ellentmondás:** a 2026-09-02-i pénz-terv szerint a paramétereit a közösség később **2/3-os többséggel** írhatná át. Tíz
    nappal később a **D66** kimondta: *„nem kell 2/3-adot előidéző rendszer”* — vagyis 2/3-os szavazás nincs a koinóban. A pénz-terv
    tehát egy olyan eszközre hivatkozik, amit azóta elvetettünk: el kell dönteni, hogyan módosulnak a pénz paraméterei. A legközelebbi
    a D118 mintája: a paraméterek a koinó születésében állnak, és a változás egy gyermek-koinó, ahová költözni lehet.
  - ⏸️ Csaba (2026-11-08): a pénz a koinó-családban — egy másik változatban **100 000 koinos, egy év alatt**; és kérdés, hogy a 10% a
    már kiosztottat szorozza, vagy a még csak járót is. Napirenden (ET-7).
- **A konszenzus és a köteg-gyökér** (**D7 — személy-alapú konszenzus**; **D17**; **D21 — a tartós mag replikációja**). Ma a koino
  konszenzus nélkül működik: minden, ami ma van, a szerzők saját láncából és determinisztikus számításból jön. Két dologhoz kell majd
  közös egyetértés: **az azonosság egyszeriségéhez** (ki tag) **és a pénzhez** (ki mennyit költött el — különben ugyanazt a pénzt két
  különböző társnak is el lehetne költeni). A D21 terve: ezeket egy Merkle-fába gyűjtjük, és naponta egy köteget zárunk — a köteg
  egyetlen 32 bájtos csúcs-száma a **köteg-gyökér**. Mindenkinek ugyanazt a gyökeret kell elfogadnia, különben két „valóság” lenne.
  **A kutatási kérdés: ki mondja ki, melyik gyökér az érvényes, szerver nélkül?** Bányászat (számítási erő) és letét (vagyon) kizárva
  (D7). A terv: a hitelesített e-emberek egy véletlenül kiválasztott köre írja alá — de a kiválasztásnak megjósolhatatlannak és
  befolyásolhatatlannak kell lennie (különben a támadó kivárja, hogy az ő emberei kerüljenek sorra), működnie kell, ha sokan nincsenek
  online, és el kell dönteni, mi történik, ha két gyökér is aláírást kap. A biztonsága pontosan annyi, amennyi az identitás-rétegé
  (D17). Napirenden (ET-8).
- **A titkos szavazás** (D2), az **egyesítés és a különválás** Csaba modellje szerint (`gepezet.md` 5.).

### 2.10 A nyitott ágak (az építőnél, 2026-11-08)

- **A terepen próbálandó:** a telefon cseréje a kártyáról (D125), a feltöltött nézet a telefon böngészőjében (D126), a két mobil
  közötti rés, az őrjárat egyszeri megállása.
- **Csabánál:** a koinó többi BEP 5 útja (BP1–BP4), az IPv6, a véletlen séta, az olcsóbb tábla-kulcs, a fájl-bájtok kézi útja, a hívás
  ötlete.
- **Még nem tervezett:** gyökér-koinó a lapról; a családi őrjárat terepi leletei.

## 3. A napirend — a megbeszélendő témák (ET)

*Csaba 2026-11-08-i kérései és kérdései. A sorrend Csabáé.*

- **ET-1 — Az általános javaslat és egyezmény** (D27): *„ez még nincsen rendessen megtervezve, ugye? ezt a tervről beszéljünk majd.”*
  → 🔍 **a terv: [`terv_altalanos.md`](terv_altalanos.md)** (2026-11-09) — a D27 → D64 → D66 útja ellentmondásos; ⭐ ugyanaz a döntési
  gépezet (titkos szavazással), az elfogadás tény, utána élő hatály (a szavazatok változhatnak, a lap: támogat · ellenez · néma), a kör
  a szülő tulajdonosai, következmény nélkül. ✅ **Eldöntve** (2026-11-09): az ütközés-jelölés helyett egy gondolat (az egyik egyezmény
  gyerekeként); címke csak egy adott napra, újraszámolható hivatkozásként — ⏭️ átadható az építőnek.
- **ET-2 — A szavazás, és a titkos, de ellenőrizhető szavazás** (D2): *„ezt is beszéljük át.”* → 🔍 **a terv:
  [`terv_szavazas.md`](terv_szavazas.md)** (2026-11-08) — a mai szavazás nyílt; a titkos szavazás megoldható (titkosított szavazat,
  csak az összeg nyílik, véletlen összesítők a jogosultak közül), de a menet közbeni eredmény (a bizonyossági mutató) miatt csak
  kötegekben, és kis csoportban nem ad titkot; ⭐ az első koinóban nyílt, a titkos a koinó születésében választható szabály. Lelet: a
  tartózkodás ma az elfogadás ellen hat. ✅ **Eldöntve** (2026-11-08/09): titkos szavazás önkéntes nyíltsággal, az első szélesebb körben
  terjesztett koinótól; a tartalom titkos, a részvétel látszik; csak az összeg nyílik, kötegekben; a tartózkodás a részvételbe számít,
  a támogatottságba nem — ⏭️ átadható az építőnek.
- **ET-3 — A kulcs: több készülék és a helyreállítás** (D15 — a kulcs hitelesít, nem titkol; D82 — a kettős lánc: nem büntet): *„ha
  valaki elhagyja? több készülékről is tudja használni a kulcsát?”* → 🔍 **a terv: [`terv_kulcs.md`](terv_kulcs.md)** (2026-11-08) —
  három kulcs (készülékkulcs, az azonosság kulcsa, előre lekötött csere-kulcs), a csere-kulcs darabolva, jelszóval, véletlen
  őrzőknél; ⚠️ a mag változása (az első éles koinó előtt). ✅ **ET-3/2 – ET-3/6 mind (A)** (Csaba, 2026-11-08: *„mindet
  elfogadom”*) — ⏭️ átadható az építőnek.
  - ⭐ **A több készülék** — Csaba: *„ne felejtsük el megtervezni, mert ez is fontos.”* Az első irány: a fő kulcs minden készüléknek
    saját, aláírt alkulcsot ad (minden készüléknek saját lánca — nincs elágazás).
  - ✅ **ET-3/1** (Csaba, 2026-11-08): a helyreállításhoz **választott bizottság nélküli** megoldást keresünk — *„egy randomizált,
    replikált, és titkosított automatikus folyamatot”*; a bizottság (N9) nincs teljesen elvetve. Az első két irány a kutatáshoz:
    (a) **jelszóval védett, darabolt kulcs-mentés** — a mentést a készülék darabokra osztja (titok-megosztás: bármely *k* darab
    visszaadja), a darabokat titkosítva véletlenül választott tagok őrzik, és automatikusan, korlátozott próbálkozásszámmal adják
    vissza annak, aki a jelszót tudja (a Signal-féle „biztonságos érték-visszaállítás” mintája, központi kiszolgáló nélkül); (b)
    **várakozási ablakos kulcscsere** — az új kulcs nyilvánosan bejelenti, hogy átveszi az azonosságot, és ha a régi kulcs egy
    hosszú ablakban (pl. 2 hét) nem tiltakozik, a véletlen tagok gépei automatikusan elfogadják (a D16 — a pénz lassú, nyilvános és
    megtámadható mintája). Mérendő/átgondolandó: a gyenge jelszó, az összejátszó darab-őrzők, és mi van, ha a gazdája meghalt.
- **ET-4 — A hitelesség mértéke és a pénztárca:** ✅ **ET-4/1** (Csaba, 2026-11-08): *„inkább ismét elvetem, az automatizált 2.
  lépcsős hitelesítést. maradjunk, a meghatalmazásos rendszernél, ahol a közösség tagjai, hatalmaznak fel másokat arra, hogy igazoljanak
  e-embereket, a 2. lépcsős hitelesítéshez. így sem minden felhatalmazott igazolhat, hanem csak az 1/3-uk (akiknek a legtöbb van).”*
  ✅ **ET-4/2** (Csaba: *„rendben. maradjon ez.”*): **marad a D57**. A háttér: a „felső harmad” pontosan a D57 előtti alak; a **D57 — a küszöb abszolút szám, nem rangsor** (2026-09-06)
  azért váltotta fel „legalább N felhatalmazás”-ra (N = a 2. lépcsősök érték javaslatainak mediánja — **D57/b**), mert a rangsorhoz
  mindenki felhatalmazás-számát ismerni kellene (9. szabály), és egy becslés készülékenként mást mondana arról, ki tanúsíthat. Csaba
  ennek tudatában a D57 mellett döntött; a felső harmad szándéka N beállításával érhető el. — Az eredeti kérdés: *„ha a találkozási rendszer elkészül, és kitalálunk egy matematikát arra, hogy valaki
  mennyire hitelesített, és ehhez kötjük automatikusan a kriptotárcát, az milyen lenne? tudjuk számszerűsíteni az e-emberek
  kapcsolati tengerben elfoglalt helyét, bizonyosság szempontjából? Nem volna egy rossz következmény, ha szükségesek lennének a
  bemutatkozó bulik.”* Kapcsolódik: D18/3 (folytonos igazolás — Csaba ötlete, 2026-08-25), D44 (a tanúsítási keret), D49 (a jelzés
  tájékoztat, nem jogosít), D50/D62 (a bemutatkozások), D55, és a méréssel kizárt irányok (`fejlesztesi_terv_fazis2.md`, a D49 után).
- **ET-5 — A hálózati beállítások menüpont:** *„részletes, hálózati beállítások menüpontot is terveznünk kell majd.”* → 🔍 **a terv:
  [`terv_halozat.md`](terv_halozat.md)** (2026-11-09) — ⭐ egy „🌐 Hálózat” menüpont öt résszel és a `halozat` parancs; csak a
  készülék saját számai állíthatók (a közös — a mag, a kopogás üteme, a kifutás, az elsőbbség — látszik, a miértjével); alsó határ a
  kiszolgálásnál, takarékos mód, havi figyelmeztetés (nem leállás), készülékenként egy beállítás. Költözés nem kell (D123: a szabad
  réteg). ✅ ET-5/1 – ET-5/6 mind (A) (2026-11-09); ➕ Csaba: a nem vállalt adat tárhelye is állítható legyen → ⏸️ ET-5/7 Csabánál.
- **ET-6 — Az elismerés és a sürgősségi út** (N9 — elismerés-entitás + kinevezési rendszer): ✅ **ET-6/1** — az elismerés egyelőre
  nem kell; a sürgősségi út nyitva.
- **ET-7 — A pénz a koinó-családban** (D10, D16, N10): 100 000 koinos egy év alatt; a 10% alapja (a kiosztott, vagy a járandóság is);
  a paraméterek módosítása a D66 után. → 🔍 **a terv: [`terv_penz.md`](terv_penz.md)** (2026-11-09) — ⭐ a 10% a létező pénzre; a
  szabályok a születésben, a változás költözés; minden koinónak saját pénzkönyve, a költöző pénze kivezetéssel átjön, az induló összeg
  és az osztalék a jelenléttel megy (egyszer jár). ✅ **Eldöntve** (2026-11-09, mind (A)) — az építés feltétele a D11 és az ET-8.
- **ET-8 — A köteg-gyökér és a konszenzus** (D17, D21, N8). ⚠️ A pénz tervezéséből: az osztalékhoz és a kasszákhoz koinó-szintű számok
  kellenek (a létező pénz, a 2. lépcsősök száma, a kasszák egyenlege). → 🔍 **a terv:
  [`terv_konszenzus.md`](terv_konszenzus.md)** (2026-11-09) — ⭐ napi köteg-gyökér nem kell: az átutalás tanú-nyugtákkal (állandó
  tanú-kör a DHT-ról, 2. lépcsősökből — a szakirodalom szerint a pénz átutalásához nem kell konszenzus), az osztalék számai évente egy
  véletlen kis kör aláírásával, a kasszák kifizetése a bizonyítékával; ⚠️ a D17 egy pontjának felülvizsgálata. ✅ **Eldöntve**
  (2026-11-09): mind (A), az osztalék számai **naponta** — ⏭️ átadható (a szimulációkkal kezdve); a pénz és a kasszák ez után.
- **ET-9 — Közös kasszák** (Csaba, 2026-11-09): projektre, a koinó-családnak, helyek szerint (*„a 10%-nak 1%-a a globális kasszába, 2% a
  saját országába, 4% a régiós kasszájába, 8% a települése kasszájába, a maradék 85% meg hozzá”*), és hogy többséggel kikényszeríthető-e.
  → 🔍 **a terv: [`terv_kassza.md`](terv_kassza.md)** — ⭐ a kassza egy entitás, kifizetés elfogadott kifizetési javaslattal; az osztalék
  része a közösbe a születési szabályban (többséggel nem kényszeríthető); a helyek a fában; ⚠️ a hely nyilvános állítás (D6). ✅
  **Eldöntve** (2026-11-09, mind (A)) — az építés a pénzzel, az ET-8 után.
- **ET-10 — A belső piac** (a vételi és eladási szándék, *„jegyezve legyen”*). Csaba elképzelése (2026-11-09): *„a piacot úgy képzeltem
  el, hogy az is csak egy tranzakció, csak a piacon keresztül ellenértéket is meg kell adni (ez lehet bármi: fiat pénz — akár készpénzben
  —, kriptopénz, vagy egy tehén, eper, vagy bármilyen ingóság). ezek jegyezve lesznek, és ezek fogják meghatározni a koinos értékét.”*
  → 🔍 **a terv: [`terv_piac.md`](terv_piac.md)** (2026-11-09) — ⭐ egy kölcsönösen aláírt ügylet (a koinos és az ellenérték), az
  átutalás erre hivatkozik, mindkét fél visszaigazolja; Csaba limit-ötlete: páronként egy kezdő határ (a fejenkénti átlagból), minden
  rendben lezárt ügylet után +50%; az ár tájékoztató medián. ✅ **Eldöntve** (2026-11-09, mind (A)) — az építés a pénzzel, az ET-8 után.
- **ET-12 — Az öröklés** (Csaba, 2026-11-09: *„még eszembe jutott valami, ami kimaradt. az öröklési rendszer.”* — D20, D18/7) → 🔍 **a
  terv: [`terv_orokles.md`](terv_orokles.md)** — ⭐ lepecsételt örökös-jegyzék (a fizetési kulccsal), a halál a D18/7 szerint (3 tanú, 30
  nap, eszkaláció), végrendelet nélkül a település kasszájába (a koinó nem tart családi adatot — a D20 egy pontjának felülvizsgálata).
  ✅ **Eldöntve** (2026-11-09): ET-12/1 – ET-12/4 (A), ET-12/5 (B): örökös csak 2. lépcsős lehet — *„csak a 2. lépcsősöknek van
  pénztárcája”* (Csaba); ET-12/6 (A): előre beírható, de csak az kap, aki a halál megállapításakor élő 2. lépcsős. Az építés: a halál az
  identitás-réteggel (D18), a végrendelet a pénzzel, az ET-8 után.
- **ET-11 — Az átutalás ablaka és összeghatára** (D16). → 🔍 **a terv: [`terv_atutalas.md`](terv_atutalas.md)** (2026-11-09) — ⭐ nagy
  átutalás: egy nap alatt az egyenleg 10%-a fölött; 72 órás ablak; megállítani a többi készülék és a csere-kulcs tudja, azonnal; az
  értesítés a többi készülékre megy. ✅ **Eldöntve** (2026-11-09) — Csaba egyszerűsítése: **nincs várakozási ablak** (a D16
  felülvizsgálva); a védelem a koino saját kódja minden átutalás véglegesítésekor (egy külön fizetési kulcsot nyit), a nyomonkövethetőség
  és a kulcs-szerkezet; az értesítés marad.

## 4. Átvezetendő javítások a közös dokumentumokba (az építőnek)

Csaba helyreigazításai (2026-11-08) a tervező ág első összefoglalójára — a hibás állítások a közös dokumentumokból jöttek:

1. **A D22 oka** (`CLAUDE.md` „A projekt / Két tár” része, `fejlesztesi_terv_fazis2.md` D22): *„nem ez az oka. ez a mondat, akkor
   született, amikor a skálázhatóság prioritásáról beszéltük, hogy nincs külön családi méretre szabott működés, ami nem skálázható. A
   központi szerveres koino, mindig is csak lépcsőfok volt. az egyenrangú skálázható p2p volt a cél.”*
2. **A siker mércéje** (`fejlesztesi_terv_fazis2.md` D13: *„Siker-mérce változik: … hány koino létezik”*): *„én nem állítok ilyet.”*
3. **A két koinó** (`fejlesztesi_terv_fazis2.md`, „🌓 KÉT KOINO INDUL, NEM EGY”, 2026-09-02): *„ilyet sem mondtam. eggyel indulunk.”* —
   a dokumentumban 2026-09-02-ről ez az idézet áll: *„Eldöntöttem, hogy legalább 2 koinót fogok indítani.”*; a mai döntés: **egy
   koinóval indulunk**.

## 5. A tervező ág naplója

- **2026-11-08** — a tervező ág indul (Csaba forkja a D126 építése közben). A kiinduló kép: a 2. szakasz.
- **2026-11-08** — Csaba átnézte a kiinduló képet: három helyreigazítás (4. szakasz), magyarázatok a nem érthető pontokhoz (a 3.
  szabály, D106, D17, N9, a 2/3 és a D66, a köteg-gyökér — a 2. szakaszba beírva), és a napirend (3. szakasz, ET-1 – ET-8). A D-számok
  mellé a címük került.
- **2026-11-08** — Csaba döntései: **ET-4/1** (marad a felhatalmazásos 2. lépcső, az automatikus elvetve), **ET-6/1** (az elismerés
  egyelőre nem kell), **ET-3/1** (a kulcs-helyreállítás bizottság nélkül: véletlen, replikált, titkosított, automatikus — kutatandó);
  a több készülék fontos (ET-3). Nyitott: **ET-4/2** (a felső harmad vagy a D57). A jelek alakja: téma ET-n, döntés ET-n/m.
- **2026-11-08** — **ET-3** megtervezve: [`terv_kulcs.md`](terv_kulcs.md); ⏸️ ET-3/2 – ET-3/6 Csabánál.
- **2026-11-08** — **ET-3/2 – ET-3/6 mind (A)** — az ET-3 eldöntve, átadható az építőnek. A következő téma: ET-2 (a szavazás).
- **2026-11-08** — **ET-2** megtervezve: [`terv_szavazas.md`](terv_szavazas.md); ⏸️ ET-2/1 – ET-2/6 Csabánál.
- **2026-11-08** — Csaba az ET-2-ről: a tartózkodás nem maradhat (javaslat: részvétel, de nem dönt, csak lassít); ha titkos, az
  elejétől (nincs ideiglenes nyílt szakasz); az etikai kérdés nyitott. A mostani koinók teszt koinók; ideiglenes megoldást kerülünk.
- **2026-11-09** — ✅ **ET-5/1 – ET-5/6** (A); Csaba kiegészítése: *„a nem tudatpontos tárhelyet, mekkorára hagyja tágulni, mielőtt
  törölné a régieket”* → a 💾 Tárhely rész, ⏸️ ET-5/7.
- **2026-11-09** — **ET-5** megtervezve: [`terv_halozat.md`](terv_halozat.md) (a mai kapcsolók a kódból összegyűjtve); ⏸️ ET-5/1 –
  ET-5/6 Csabánál.
- **2026-11-09** — ✅ **ET-12/6** (A) — az öröklés eldöntve. Nyitva: ET-5 (a hálózati beállítások), ET-6 (a sürgősségi út).
- **2026-11-09** — ✅ **ET-12/1 – ET-12/4** (A), **ET-12/5** (B) — Csaba: pénztárcája csak a 2. lépcsősnek van (ez az átutalásra és a
  piacra is áll); ⏸️ ET-12/6 (a ki nem fizethető rész).
- **2026-11-09** — **ET-12** (az öröklés) felvéve és megtervezve: [`terv_orokles.md`](terv_orokles.md); ⏸️ ET-12/1 – ET-12/5 Csabánál.
- **2026-11-09** — ✅ **ET-10/1 – ET-10/5** (A) — a piac eldöntve. Nyitva: ET-5 (a hálózati beállítások), ET-6 (a sürgősségi út).
- **2026-11-09** — **ET-10** megtervezve: [`terv_piac.md`](terv_piac.md) (Csaba limit-ötletével: páronként, +50% rendben lezárt
  ügyletenként); ⏸️ ET-10/1 – ET-10/5 Csabánál.
- **2026-11-09** — ✅ **ET-11 eldöntve:** nincs várakozási ablak (a D16 felülvizsgálva); a koino saját kódja minden átutaláskor (a
  fizetési kulcs — az ET-3 kiegészítése).
- **2026-11-09** — ET-11: ✅ ET-11/3, ET-11/4; a határ a fejenkénti átlaghoz, a változó ablak, a piac és a kassza — a javított javaslat
  a terv 7. szakaszában; Csaba piac-elképzelése az ET-10-be.
- **2026-11-09** — **ET-11** megtervezve: [`terv_atutalas.md`](terv_atutalas.md); ⏸️ ET-11/1 – ET-11/5 Csabánál.
- **2026-11-09** — ✅ **ET-8/2: naponta** — az ET-8 eldöntve, átadható (a szimulációkkal kezdve).
- **2026-11-09** — ✅ **ET-8/1, ET-8/3, ET-8/4, ET-8/5** (A); az ET-8/2 nyitott: Csaba szerint az évi kör ritka → javaslat: naponta (a
  napi változás régiónként számolva — a tervem javítva).
- **2026-11-09** — **ET-8** megtervezve: [`terv_konszenzus.md`](terv_konszenzus.md); ⏸️ ET-8/1 – ET-8/5 Csabánál.
- **2026-11-09** — ✅ **ET-9/1 – ET-9/6** (A) — a közös kasszák eldöntve.
- **2026-11-09** — ✅ **ET-7/1 – ET-7/4** (A). Új témák: **ET-9** (közös kasszák — megtervezve: [`terv_kassza.md`](terv_kassza.md); ⏸️
  ET-9/1 – ET-9/6 Csabánál), **ET-10** (a belső piac), **ET-11** (az átutalás ablaka, D16).
- **2026-11-09** — Csaba: *„rendben.”* — az ET-1, ET-2, ET-3 egy költözésben, az első szélesebb körben terjesztett koinó előtt; a
  kezdést Csaba mondja meg az építőnek. **ET-7** megtervezve: [`terv_penz.md`](terv_penz.md); ⏸️ ET-7/1 – ET-7/4 Csabánál.
- **2026-11-09** — ✅ **ET-1 eldöntve** (ET-1/1 – ET-1/4 (A); ET-1/5: nincs külön ütközés-jelölés, gondolattal; ET-1/6: címke csak egy
  adott napra) — átadható az építőnek. ⭐ Az ET-1, az ET-2 és az ET-3 mind a magot érinti: egy költözésben, az első szélesebb körben
  terjesztett koinó előtt.
- **2026-11-09** — **ET-1** megtervezve: [`terv_altalanos.md`](terv_altalanos.md); ⏸️ ET-1/1 – ET-1/6 Csabánál.
- **2026-11-09** — ✅ **ET-2/1 – ET-2/6** eldöntve (titkos, önkéntes nyíltsággal; a csomag (A)) — az ET-2 átadható az építőnek.
- **2026-11-08** — ✅ **ET-2/6:** a tartózkodás a támogatottsági arányt nem módosítja, a részvételt növeli → a bizonyosság nő, a
  döntési idő rövidül.
- **2026-11-08** — **ET-4/2:** marad a D57 (legalább N felhatalmazás, N a 2. lépcsősök mediánja). Az ET-4 ezzel lezárult: a 2. lépcső
  terve nem változik.
