# ET-8 — A köteg-gyökér és a konszenzus: kell-e, és ha igen, mire (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült; a számokat egy rövid számolás adja, a
szimuláció az építőé (10. szakasz). A D-számok mellett a döntés címe áll.*

> **Állapot:** ✅ **eldöntve** (Csaba, 2026-11-09) — ET-8/1, ET-8/3, ET-8/4, ET-8/5 (A); ET-8/2: **naponta** (5.1) · ⏭️ átadható (11.
> szakasz).
>
> Csaba (2026-11-08): *„A köteg-gyökér elfogadása az utolsó valódi kutatási kérdés — ezt fejtsd ki.”* — és (2026-11-09): *„rendben, akkor
> vágjunk bele, az et-8-ba.”*

## 1. A rövid válasz

**A meglepő eredmény: a koino pénzéhez nem kell napi köteg-gyökér, amit mindenki elfogad.** A **D21 — a tartós mag replikációja** azt
tervezte, hogy minden nap egy közös „csúcs-szám” rögzíti az egész pénzállapotot, és egy választott kör aláírja. Ezt két dolog teszi
fölöslegessé — és egy harmadik indokolja, hogy ne is ezt építsük:

1. **Az átutaláshoz nem kell konszenzus.** A szakirodalom kimutatta (Guerraoui és munkatársai, 2019: *„a kriptovaluta konszenzus-száma
   1”*): ha egy számlát csak a gazdája költhet, a kettős költés ellen elég, ha **a küldő nem mutathat két különböző folytatást** — és ehhez
   nem kell, hogy mindenki megegyezzen mindenben, csak néhány **tanú**, akik nem nyugtáznak két különböző lépést ugyanarra a helyre. A
   koinóban ez már félig megvan: minden e-embernek saját lánca van, és a kettős lánc bizonyítéka is (**D80–D82**).
2. **A koinó-szintű számokhoz** (az osztalékhoz a létező pénz és a 2. lépcsősök száma) **nem kell az egész állapotról megegyezni**: elég,
   ha **naponta egy kis, véletlenül kiválasztott kör** aláírja a két számot (a régiók napi változásából számolva) — és abból jár a holnapi
   osztalék mindenkinek (ET-8/2 — eredetileg évente javasoltam, Csaba javítására naponta: 5.1).
3. **Az egész állapot ujjlenyomata egy nagy koinóban ki sem számolható** — ezt a szakasz4 terve már kimondta: *„a szeletelés óta egyetlen
   készülék sem ismer minden eseményt, tehát »a közösség állapotának lenyomata« milliárdnál nem is számítható ki — arra építeni a 9.
   szabályt sértené.”*

⚠️ **Ez a D17 — a konszenzus hatóköre és biztonsági alapja egy pontjának felülvizsgálata:** a D17 táblázata szerint a pénzhez globális
egyetértés kell. A szakirodalom szerint az átutaláshoz nem kell, csak a koinó-szintű számokhoz — és azokhoz is csak ritkán. *(A D17 maga
írta: „a levezetés saját következtetés … az irodalomhoz kell mérni, mielőtt kódot írunk.”)* A biztonság alapja ugyanaz marad: **a tanúk és
a kör valódi, különböző emberek** — vagyis az identitás-réteg (D17: *„a konszenzus biztonsága = az identitás-réteg biztonsága”*).

## 2. Mi a probléma, egy példán

*Annának 1000 koinosa van. Két készülékről (vagy szándékosan, egy másolt kulccsal) egyszerre fizet 1000-et Bélának és 1000-et Cilinek:
két aláírt esemény, ugyanazon a helyen a láncában (az 57. lépés). Béla gépe csak az elsőt látja, Cilié csak a másodikat. Mindketten átadják
az árut. Napokkal később a két ág találkozik — a D82 szerint a kisebb azonosítójú ág nyer, a másik kifizetés eltűnik. Valaki áru nélkül
maradt.*

Szerver nélkül nincs, aki azonnal megmondja, melyik az igazi. A kérdés: **hogyan tudhatja Béla még az áru átadása előtt, hogy Cilinek
ugyanez a pénz nem mehetett el?**

## 3. Amit már tudunk (a mai terv és a mai program)

- **Saját lánc** (**D63 — a lánc-gyökér: gördülő elköteleződés a saját láncra**): minden e-ember eseményei sorszámozott, aláírt láncot
  alkotnak.
- **A kettős lánc nem büntet, de bizonyítékot ad** (**D80 — az ellentmondás bizonyítéka**, **D82 — a kettős lánc**): ha két esemény
  ugyanarra a sorszámra jut, egy `Ellentmondas` esemény mindkettőt egy helyre viszi, és minden gép ugyanazt választja.
- **A buli mint kézbesítési igazolás** (**D61**): *„a bulikörben mindenki aláírja, meddig lát”* — egy aláírt „eddig láttam” már ma is
  létezik (`Lattam`), és erős, mert a saját láncban van sorrend.
- **Az összegző Merkle-fa és a szúrópróba** (**D78**, **D79 — a teljes kiosztás-lista ellenőrzése szúrópróbával**): egy nagy összeg
  bizonyítékkal adható oda, és mintavétellel ellenőrizhető.
- **A pénz lassú** (**D16 — a pénz lassú, nyilvános és megtámadható**): nem kell másodpercek alatt véglegesnek lennie — a várakozási ablak
  amúgy is van.

## 4. Az átutalás — tanúkkal, konszenzus nélkül

**Az elv:** minden e-embernek van egy **állandó tanú-köre** — például 32 tag. A tanú egyetlen dolgot ígér: **egy e-ember egy lépésére csak
egyszer nyugtáz.** Ha egyszer aláírta, hogy *„Anna 57. lépése: 1000 Bélának”*, egy másik 57. lépést soha nem nyugtáz.

**A menet:**
1. Anna aláírja az átutalást a láncán (mint ma minden eseményt).
2. Az esemény eljut a tanúihoz (a mai csere útjain — postaláda, nem kell, hogy egyszerre online legyenek).
3. Minden tanú megnézi: ez Anna következő lépése-e, és van-e rá fedezet. Ha igen, és erre a helyre még semmit nem nyugtázott, aláír egy
   **nyugtát**.
4. **Béla akkor fogadja el**, ha az átutalás mellett legalább **22 nyugta** van a 32 tanútól (több mint kétharmad).

**Miért véd:** Cili is csak akkor fogadná el a másik 57. lépést, ha az is 22 nyugtát kapna. Két 22-es csoport a 32-ből legalább 12 tanúban
közös — **ennek a 12-nek kétszer kellett volna nyugtáznia**, amit egy becsületes tanú nem tesz meg. A kettős költéshez tehát legalább 12
csaló tanú kell Anna 32 tanúja közül. *(A kettős nyugta ráadásul maga a bizonyíték a tanú ellen — D80 mintájára.)*

**Mekkora az esély, hogy egy véletlen tanú-körben ennyi csaló van** (ha a 2. lépcsősök *p* része csal):
- 32 tanú, 22 nyugta: *p* = 10% mellett ~1 a 30 000-hez; 5% mellett ~1 a 46 millióhoz;
- 64 tanú, 43 nyugta: *p* = 10% mellett ~1 a 8 millióhoz;
- 16 tanú, 11 nyugta: *p* = 10% mellett ~1 a 300-hoz — kevés.

**Kik a tanúk — senki nem választhatja:**
- **2. lépcsős tagok** (a hamis azonosság drága — 3 tanúsítás kell hozzá, D56);
- a **DHT-n** azok, akiknek a neve a legközelebb esik az e-ember nevének lenyomatához — bárki kiszámolhatja, és a gazdája sem választhat
  (ugyanaz a fogás, mint a gyökér-darabnál és a címjegyzéknél — **D91 — a címjegyzék: a fa és a raj**). Egy nagy koinóban sincs szükség a
  tagok listájára (9. szabály).
- **Állandó kör, nem lépésenként új:** ha a kör lépésenként változna, a csaló addig próbálkozhatna, amíg egyszer rossz kört kap. Az
  állandó körnél egy azonosságnak egy esélye van — és új azonosság drága.
- **Kis koinóban** (pl. 10 2. lépcsős tag) a tanú-kör maga az egész közösség, és kétharmad nyugta kell — *„ismeritek egymást”* (D17).

**A véglegesség** ezzel a nyugták összegyűlésének ideje — percek vagy órák (a tanúk nem mind online). Ez belefér a D16 lassúságába, és a
nagyobb összegnél amúgy is ott a várakozási ablak.

## 5. Az osztalék számai — egy kis kör (✅ naponta — 5.1)

Az osztalék (ET-7) a létező pénz 10%-a, egyenlően a 2. lépcsősök között — ehhez két koinó-szintű szám kell: **a létező pénz összege** és
**a 2. lépcsősök száma**. Ezt egy készülék egy nagy koinóban nem tudja megszámolni. Ha viszont minden gép mást számolna, mindenki más
osztalékot írna jóvá — a pénzkönyv szétesne. Tehát egy **közös** szám kell.

**Az első javaslat** *(⛔ két ponton javítva az 5.1-ben: naponta, és a számlálás a régiók napi változásából)*: évente egyszer egy
**véletlen, kicsi kör** (pl. 64 2. lépcsős tag, ugyanúgy a DHT-ról, az év számának lenyomatához legközelebbiek) mindenki a saját
tudásából kiszámolja a két számot, és **legalább kétharmaduk ugyanazt az értéket írja alá** (ha kicsit
eltérnek, a középső értéket). Ebből jön az évre rögzített **napi osztalék**, amit mindenki gépe a saját láncán magának jóváír (és a kasszák
részét — ET-9). Ha a kör egy évben nem áll össze, az előző évi érték marad.

*Miért nem egy előre megírt ütemterv (bizottság nélkül):* ha az osztalék egyszerűen évente 10%-kal nőne, az csak állandó létszámnál adná
ki a létező pénz 10%-át. *Példa: ha egy koinó tíz év alatt nagyon megnő, és a tagok többsége új (még csak az induló 100 000-rel), a napi
osztalék addigra a létező pénz ~25%-a lenne, nem 10%-a.* Az évenkénti mérés ezt kiigazítja. *(A Duniter is félévente számolja újra.)*

### 5.1 Évente, hetente vagy naponta? (Csaba, 2026-11-09)

Csaba: *„az évente, szerintem túl ritka, főleg az elején, amikor 1 év alatt több száz %-ot is nőhet a már kiosztott koinos. mi lenne, ha
hetente számolnák az osztalékot, vagy naponta? mennyire drága naponta kiszámolni az osztalékot, az osztalék kifizetése előtt?”*

**Igaza van.** Az osztalék a fejenkénti átlag (a létező pénz / a 2. lépcsősök száma) 10%-a — és ez az első évben a legmozgékonyabb: az
induláskor senki nem kapott még semmit (az átlag ~0), egy év múlva ~100 000. *Egy évi kör az év elején ~0-t mondana — egész évben szinte
semmi osztalék nem járna.*

⛔ **Egy javítás a tervemen:** fent azt írtam, hogy a kör tagjai *„a saját tudásukból kiszámolják a két számot”*. Egy nagy koinóban ez nem
megy — egyetlen gép sem tudja megszámolni a létező pénzt és a 2. lépcsősöket (ezért kell a kör egyáltalán). ⭐ **A számlálás is a fát
követi, és csak a változást kell számolni:**
- a két szám egyik napról a másikra **a változásokból** jön: *a tegnapi szám + az új 2. lépcsősök − akik kiestek*; *a tegnapi pénz + a
  szabály szerint keletkezett pénz (az induló részletek és az osztalék) + a kivezetésekből bejött − a kivezetéssel kiment*;
- a napi változást **régiónként** számolják a DHT-n (mint a gyökér darabjait és a kereső-régiókat): minden régió a saját napi
  változását egy összegző fával (**D78**) adja fel, a kör összeadja, és szúrópróbával ellenőrzi (**D79**) — egy gép terhe a saját régiója
  marad (9. szabály).

**A napi kör ára — kicsi:**
- **Minden gépnek:** naponta egyszer egy aláírt nyilatkozat jut el hozzá (a két szám, a napi osztalék, és legalább 43 aláírás a 64-ből) —
  **kb. 5 KB naponta**, kevesebb, mint négy „nincs újdonság” csere (6. szabály: egy ilyen csere 1,2–1,7 KB).
- **A kör tagjainak:** a régiók napi összegét összeadni és aláírni — percek, a nap bármely részében (postaláda, nem kell egyszerre online
  lenniük).
- **A régiók tartóinak:** a saját régiójuk napi változása (új 2. lépcsősök, kivezetések) — ritka események, elhanyagolható munka.

**A kifizetés:** a ma kimondott számokból jár a holnapi osztalék (egy nap csúszással — a kör a napot lezárva számol). Ha egy nap a kör nem
áll össze, az előző napi érték marad.

**Hetente** is mehet (a forgalom heti ~5 KB), de az első hónapokban egy hét alatt is sokat változik az átlag — a napi kör ára olyan kicsi,
hogy nem éri meg ritkítani.

## 6. A kasszák egyenlege — a kifizetés hozza a bizonyítékát

Egy kassza (ET-9) befizetései sok ember láncán vannak (egy ország kasszájáé milliókén). Egy kifizetéshez nem kell mindenkinek tudnia a
teljes egyenleget — **a kifizetési javaslat hozza a bizonyítékát**: a befizetések összegző fájának csúcsát, amit bárki szúrópróbával
ellenőrizhet (**D79** mintájára — *„a bizonyíték az eseménnyel utazik”*, **D81**). A kassza korábbi kifizetései a kassza saját szeletében
vannak, sorrendben (a lezárásuk szerint), tehát minden gép ugyanazt számolja: egy kifizetés csak akkor érvényes, ha a bizonyított
befizetésekből a korábbi kifizetések után még telik rá.

## 7. A költözés pénze (a kivezetés)

A kivezetés (ET-7/4) egy átutalás a régi koinóból az újba: a régi koinóban ugyanúgy tanú-nyugtákat kap, mint bármely átutalás, és az új
koinó a nyugtákkal együtt fogadja el fedezetként. Így a régi koinóban ugyanaz a pénz nem költhető el még egyszer — ezt a régi koinó tanúi
tanúsítják, nem a régi koinó egészének egyetértése. *(A **D66/6** őszinte korlátja — „a kivezetés csak akkor ér valamit, ha a régi koino is
megszünteti azt a pénzt” — így a tanúk nyugtájával válik ellenőrizhetővé.)*

## 8. Ami marad (kimondott határok)

- **A tanúk többsége csalhat** — ha egy koinóban sok a hamis 2. lépcsős azonosság (a 4. szakasz számai). Ez nem új kockázat: minden a
  2. lépcső hitelességén áll (D17). A köztes méret veszélyzónája (**D18 — az identitás-réteg**, 0. pont) itt is áll.
- **A tanúk nem mindig elérhetők** — a nyugta késhet. Ha egy tanú-kör tartósan kevés nyugtát ad, a kör frissítése kell (pl. évente, az
  osztalék körével együtt — ⏸️ az építéskor).
- **A DHT-n a nevek közelsége kijátszható?** A név a kulcsból jön, és kulcsot bárki ingyen generálhat — egy támadó tehát kereshet olyan
  kulcsot, ami közel esik egy kiszemelt e-emberhez. De tanú csak 2. lépcsős lehet: minden ilyen kulcsnak 3 tanúsítást kell szereznie.
  Hogy ez elég drága-e, mérendő.
- **A teljes pénzállapot** egyik gépen sincs meg — és nem is kell (1/3. pont).

## 9. A kérdések (⏸️ Csabáé)

- **ET-8/1 — Az átutalás:** (A) ⭐ tanú-nyugtákkal, konszenzus nélkül — állandó tanú-kör (pl. 32, ebből 22 nyugta), a DHT-ról, 2. lépcsős
  tagokból; (B) napi köteg-gyökér, amit egy választott kör aláír (a D21 eredeti terve) — minden pénzmozgást egy napi közös állapotba
  zár, ami egy nagy koinóban egy gépen sem számolható ki.
- ✅ **ET-8/2 — Az osztalék számai** (Csaba: *„igen.”*): (A) ⭐ **naponta** egy véletlen kis kör mondja ki (kétharmados
  aláírással), a régiók napi változásából; a holnapi osztalék a mai számokból; ha nincs kör, az előző napi érték (5.1); (B) hetente;
  ~~évente~~ (az első évben ~0-t mondana); (C) előre megírt ütemterv, kör nélkül (gyors növekedésnél eltér a 10%-tól).
- **ET-8/3 — A kasszák egyenlege:** (A) ⭐ a kifizetési javaslat hozza a bizonyítékát (összegző fa, szúrópróba), a kassza kifizetései a
  saját szeletében, sorrendben; (B) a kasszák egyenlegét is a kör mondja ki (egy összeg minden kasszára — nagyobb napi teher).
- **ET-8/4 — A tanúk és a kör kiválasztása:** (A) ⭐ a DHT-n, a lenyomathoz legközelebbi 2. lépcsős tagok — bárki kiszámolja, senki nem
  választja; (B) ellenőrizhető sorsolással (mindenki maga sorsol, és bizonyítja — az Algorand mintája; a beépített kriptográfiával
  mérendő).
- **ET-8/5 — A D17 felülvizsgálata:** (A) ⭐ elfogadod, hogy a pénzhez nem kell globális konszenzus — csak küldőnkénti következetesség
  (tanúk) és egy kis kör a koinó-szintű számokra (✅ naponta); (B) maradjon a D17 eredeti alakja (a pénzhez globális egyetértés kell).

## 10. Mérendő (az építőnek — szimulációval, mielőtt kód készül)

- **A tanú-kör mérete és a nyugta-küszöb** (16/32/64) a csalók arányának függvényében — a kettős költés esélye és a nyugták
  összegyűlésének ideje (a mai terepi elérhetőséggel: a telefonok alszanak).
- **A DHT-közelség kijátszása:** mennyibe kerül egy támadónak, hogy egy kiszemelt e-ember tanú-körébe sok csalót juttasson.
- **A napi kör és a régiók számlálása:** a régiók napi összegző fája (méret, szúrópróba), és hogy kétharmad aláírás naponta összegyűlik-e
  (a telefonok alszanak).
- **A kassza bizonyítéka:** a befizetések összegző fája egy nagy kasszánál — méret és a szúrópróba ára.

## 11. Az átadás (az építőnek)

**A döntések** (Csaba, 2026-11-09): **ET-8/1** az átutalás tanú-nyugtákkal, konszenzus nélkül (állandó tanú-kör, pl. 32, ebből 22
nyugta) · **ET-8/2** az osztalék két koinó-szintű száma **naponta**, egy véletlen kis kör kétharmados aláírásával, a régiók napi
változásából (összegző fa, szúrópróba); a holnapi osztalék a mai számokból, kör nélkül az előző napi érték · **ET-8/3** a kassza
kifizetése hozza a bizonyítékát · **ET-8/4** a tanúk és a kör a DHT-ról, a lenyomathoz legközelebbi 2. lépcsős tagok · **ET-8/5** a D17
felülvizsgálva: a pénzhez nem kell globális konszenzus — csak küldőnkénti következetesség és a napi kör a koinó-szintű számokra (a D21
napi köteg-gyökere nem épül meg).

**A következő építési lépés:** a 10. szakasz szimulációi (a tanú-kör mérete, a DHT-közelség kijátszása, a napi kör és a régiók
számlálása, a kassza bizonyítéka) — **előbb a mérés**. Ez a pénz (ET-7) és a kasszák (ET-9) alapja: azok ez után épülhetnek, a D11 (az
identitás éles bizonyítása) mellett. A D-számot az építő adja.

*Irodalom, ha mélyebbre kell: Guerraoui, Kuznetsov, Monti, Pavlovič, Seredinschi: „The Consensus Number of a Cryptocurrency” (PODC 2019)
és „AT2: Asynchronous Trustworthy Transfers”; „Scalable Byzantine Reliable Broadcast” (DISC 2019 — a mintavételes tanú-kör); Gilad és
mtsai: „Algorand” (SOSP 2017 — a sorsolt bizottság); a KERI tanú-nyugtái; a Duniter/Ğ1 egyetemes osztaléka.*

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-8/1 – ET-8/5 Csabánál.
- **2026-11-09** — ✅ ET-8/1, ET-8/3, ET-8/4, ET-8/5 (A). Csaba: az évi kör túl ritka → a napi kör ára (kb. 5 KB/nap/gép) és egy javítás:
  a két számot a kör sem tudja a saját gépén megszámolni — a napi változás régiónként, összegző fával (5.1).
- **2026-11-09** — ✅ ET-8/2: naponta (Csaba: *„igen.”*) — az ET-8 eldöntve, átadható (11.).
