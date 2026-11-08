# ET-2 — A szavazás, és a titkos szavazás (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-08. Programkód nem készült; amit csak mérés dönthet el, az a
7. szakaszban „mérendő”. A D-számok mellett a döntés címe áll.*

> **Állapot:** 🔍 tervezve · Csaba első válaszai (2026-11-08): a tartózkodás nem maradhat a prototípus szerint (ET-2/6 — a javítás:
> 8. szakasz); ha titkos, akkor az első, szélesebb körben terjesztett koinótól, ideiglenes nyílt szakasz nélkül (ET-2/1); a titkos vagy
> nyílt etikai kérdése még nyitott (9. szakasz). ⏸️ ET-2/1 – ET-2/6 Csabánál.
>
> Csaba (2026-11-08), a kiinduló kép „aki pontot tett az érintettre, egyenlő súllyal szavaz — a titkos, de ellenőrizhető szavazás (D2)
> cél maradt” sorára: *„ezt is beszéljük át.”*

## 1. A rövid válasz

**A mai szavazás nyílt:** a szavazat egy aláírt esemény, a koinó minden tagja látja, ki hogyan szavazott. A **D2 — szavazás: titkos,
de ellenőrizhető, kiváltságos adatkezelő nélkül** célja (az eredmény ellenőrizhető, az egyéni szavazat nem fejthető vissza) nincs
megépítve.

**A titkos szavazás megoldható P2P-ben is** — a szavazat titkosítva megy, és csak az ÖSSZEG nyílik ki; a kinyitáshoz a jogosultak
közül véletlenül kiválasztott „összesítők” kellenek, akik közül egy-kettő egyedül semmit nem tud meg. **De négy dolog nehezíti:**
1. **A koino a menet közbeni eredményből számolja a lezárás idejét** (a bizonyossági mutató) — ha minden szavazat után kinyílna az
   összeg, az összeg változásából minden egyes szavazat kiolvasható volna. Ezért az eredmény csak **kötegekben** nyílhat ki.
2. **Kis csoportban az összeg maga árulkodik:** három szavazónál a 2:1 és a saját szavazatod sokat elárul a másik kettőről.
3. **A megvett szavazat:** a szavazó bizonyíthatja a vevőnek, hogyan szavazott (a titkosítás véletlen számával). Az újraszavazás
   a zárásig gyengíti ezt, de teljesen nem zárja ki.
4. **A mag változása:** a szavazat alakja és a számítás változik → költözés (**D66 — a megújulás = költözés, nem frissítés**).

⛔ *Az első változat javaslata („az első koinóban nyílt, a titkos egy későbbi verzióban”) visszavonva 2026-11-08: ideiglenes
megoldás lett volna. A mai javaslat az 5. szakaszban, a titkos vagy nyílt etikai kérdése a 9.-ben.*

## 2. A mai szavazás (a kódból — `js/allapot/javaslatSzamitas.js`)

- **Ki szavazhat:** akinek a szavazás pillanatában pontja van az érintett gondolaton ÉS magán a javaslaton (vagy a töredékén —
  **D85 — a javaslat és az egyezmény ugyanolyan entitás, mint a gondolat**). A passzív figyelő is szavazhat, és a szavazással
  aktívvá válik. Mindenki egyenlő súllyal, a pontjai számától függetlenül.
- **A szavazat** támogat, ellenez vagy tartózkodik; **megváltoztatható, de nem vonható vissza** (a láncon a későbbi számít; a pont
  levétele nem veszi vissza a szavazatot). A szavazó kérhet **különválást** is (ha a döntés ellene megy, külön ágra lép).
- **Az elfogadás:** a támogatók aránya az összes leadott szavazat között ≥ az elfogadási küszöb (ma 51%). ⚠️ **A tartózkodók a
  nevezőben vannak** — így a tartózkodás az elfogadás ellen hat. *Példa: 5 támogat, 4 ellenez, 2 tartózkodik → 5/11 = 45% < 51%:
  elvetve, pedig az igenek többen vannak a nemeknél.*
- **A részvétel:** a szavazók aránya az aktív tulajdonosok (és a szavazók) között ≥ a részvételi küszöb (ma 0%).
- **A küszöbök** a tulajdonosok érték javaslatainak mediánja (**D4 — küszöb-kormányzás: medián + felelősség-elv**).
- **A bizonyossági mutató és a lezárás:** a mutató = (a támogatás és az ellenzés különbsége + a részvétel) / 2, ezrelékben. Minél
  nagyobb, annál hamarabb zárul a döntés a minimum (ma 1 mp) és a maximum (ma 7 nap) döntési idő között. *Példa: 10 jogosultból 8
  szavaz, 7 támogat, 1 ellenez → különbség 750‰, részvétel 800‰ → mutató 775‰ → a lezárás a 7 napnak kb. 22%-ánál, ~1,6 nap után.*
- **A lezárás időrendben:** a határidő utáni szavazat nem számít (a határidő nem mozoghat vissza egy késői szavazattól).
- **Az egyezmény számítás** (**D17 — a konszenzus hatóköre**): minden gép a nála lévő eseményekből ugyanazt számolja.

## 3. Mit kér a D2, és miért nehéz P2P-ben

A D2: *az eredmény hitelesíthető, az egyéni szavazat nem fejthető vissza, senkinél nincs többlet-adat.* A szerveres prototípusban
az üzemeltető láthatta a szavazatokat (a D2 ezt kimondta). P2P-ben nincs üzemeltető — de nincs megbízható számláló sem.

1. **Nincs, aki számoljon.** Ha a szavazatot titkosítjuk, valakinek ki kell nyitnia — és az a valaki ne láthassa az egyes
   szavazatokat. Ehhez a kulcsot darabolni kell több ember között (mint a csere-kulcsot az ET-3-ban), és csak az összeget szabad
   kinyitni.
2. **A menet közbeni eredmény.** A koino a lezárás idejét a pillanatnyi állásból számolja (2. szakasz). Ha az összeg minden szavazat
   után kinyílna, az egymás utáni összegek különbségéből minden szavazat kiolvasható volna. → **Kötegek:** az összeg csak akkor nyílik
   ki, ha legalább *m* új szavazat jött (pl. 5), vagy a határidőkor; a lezárás ideje a legutóbb kinyílt összegből számolódik — minden
   gépen ugyanúgy.
3. **Kis csoportban az összeg árulkodik.** Ezen semmilyen titkosítás nem segít: ha hárman szavaztok, és az eredmény 3:0, mindenki
   tudja, ki hogyan szavazott. → A titkosság csak **legalább *X* jogosult** felett értelmes; alatta a szavazás nyílt, kimondva.
4. **A megvett vagy kikényszerített szavazat** (a D2 eredeti oka). A titkosított szavazatnál a szavazó a titkosítás véletlen
   számával bizonyíthatja, mit adott le. Ha a zárásig újraszavazhat, a vevő nem lehet biztos benne, hogy nem szavazott utána újra —
   de azt, hogy újraszavazott-e, a láncból látja. ⚠️ Teljes védelmet ez nem ad; ez kutatás-közeli (a D2 is „célként” mondja).
5. **Mindenki ugyanazt számolja** (D17), és **egy készülék terhe nem nő a koinóval** (9. szabály): az összesítőket nem lehet egy
   globális listából választani — csak a javaslat saját jogosultjai közül, a javaslat azonosítójából számolt véletlennel (amit minden
   gép ugyanígy számol).

## 4. Az utak

**(A) ⭐ Titkosított szavazat, csak az összeg nyílik ki** (az „összeadható titkosítás” — a Helios szavazórendszer mintája):
- a javaslat születésekor a jogosultak közül véletlenül kiválasztott *n* **összesítő** közösen létrehoz egy kulcsot (egyikük sem
  ismeri egészében);
- a szavazat erre a kulcsra titkosítva megy, egy bizonyítékkal, hogy érvényes (pontosan egy a három lehetőségből) — a szavazat
  alá van írva, tehát az, hogy KI szavazott, látszik (a részvételhez és a jogosultsághoz kell);
- bárki össze tudja „szorozni” a titkosított szavazatokat: az eredmény a titkosított összeg;
- legalább *t* összesítő együtt kinyitja az összeget (egy bizonyítékkal, hogy jól nyitották ki), kötegekben (3/2. pont);
- *t*-nél kevesebb összesítő együtt sem tud meg semmit egyetlen szavazatról sem.
- *Ára:* a szavazat ~0,5–1 KB-tal nagyobb; az összesítőknek el kell érhetőnek lenniük (a kötegekhez és a záráshoz); a kriptográfia
  a beépítettnél többet kíván (mérendő).

**(B) Névtelen szavazat** (gyűrű-aláírás: „a jogosultak egyike írta alá, de nem tudni, melyik”): a szavazat tartalma nyílt, csak a
szerzője rejtett — az összeg így bármikor látszik, és a korai lezárás változatlan.
- *Ára:* kis csoportban a „rejtek” kicsi (3 jogosultnál 3 ember közül egy); az aláírás mérete a jogosultak számával nő (9. szabály);
  a szavazatot névtelenül is el kell juttatni (különben a beküldő gépe elárulja); és a különválási igény nem lehet névtelen.

**(C) Marad a nyílt szavazás** — a D2 cél marad, kimondva. Egyszerű, ma is működik, és illik a nyíltsághoz (D55).

**(D) „Önösszesítő” szavazás** (mindenki szavazata együtt nyitja ki magát): csak akkor ad eredményt, ha MINDEN jogosult szavazott —
a koinóban a részvétel részleges, és menet közbeni eredmény sincs. → nem illik.

## 5. A javaslat (2026-11-08 — Csaba első válaszai után)

- **Ha titkos** (ET-2/1): az **első, szélesebb körben terjesztett koinótól** így megy, ideiglenes nyílt szakasz nélkül — az (A) úton:
  titkosított szavazat, csak az összeg nyílik, az összesítők a jogosultak közül, a javaslat azonosítójából számolt véletlennel.
- **A kötegek:** az összeg kinyílik, ha legalább *m* új szavazat jött, VAGY ha minden jogosult szavazott, VAGY a határidőkor. ⭐ Így
  az egyedüli tulajdonos saját gondolatának szerkesztése továbbra is azonnali (ő az egyetlen jogosult: a szavazatával „mindenki
  szavazott”).
- **Egy út, nem kettő:** kis csoportban is titkosított, és a lap kimondja, hogy kevés szavazónál a titok gyenge (a végeredmény sokat
  elárul). Nincs külön „nyílt mód” — kevesebb a hibalehetőség.
- **A tartózkodás** (✅ ET-2/6): a támogatottságba nem számít, a részvételbe igen — így a bizonyosságot növeli, és rövidebb lesz a
  döntési idő (8. szakasz).

## 6. A kérdések (⏸️ Csabáé)

- **ET-2/1 — Titkos vagy nyílt?** (A) ⭐ titkos, az első szélesebb körben terjesztett koinótól — a nyíltság önkéntes: bárki kimondhatja
  a saját állását, de senki nem kényszeríthető rá (9. szakasz); (B) nyílt, mindig — a D2 elvetve. *(Csaba még nem biztos az etikai
  kérdésben; a két oldal a 9. szakaszban.)*
- **ET-2/2 — Ha titkos, mi titkos?** (A) ⭐ hogy ki HOGYAN szavazott; hogy KI szavazott, az látszik (a részvételhez és a jogosultsághoz
  kell); (B) az is, hogy ki szavazott (névtelen szavazás).
- **ET-2/3 — Ha titkos, a módszer:** (A) ⭐ titkosított szavazat, csak az összeg nyílik, véletlen összesítők a jogosultak közül;
  (B) névtelen szavazat (gyűrű-aláírás).
- **ET-2/4 — Ha titkos, a lezárás ideje:** (A) ⭐ az összeg kötegekben nyílik (legalább *m* új szavazat, vagy ha mindenki szavazott,
  vagy a határidő), a lezárás ideje a legutóbb kinyílt összegből; (B) a korai lezárás csak a részvételből, az eredmény a végén nyílik.
- **ET-2/5 — Kis csoportban:** (A) ⭐ ott is titkosított, és a lap kimondja, hogy a titok gyenge (egy út); (B) *X* jogosult alatt nyílt
  (két út — a korábbi javaslat).
- ✅ **ET-2/6 — A tartózkodás** (Csaba, 2026-11-08): a támogatottsági arányt nem módosítja, a részvételt növeli, ezért a bizonyossági
  mutatót is növeli, és rövidebb lesz a döntési idő (8. szakasz). ⚠️ A mag változása.

## 7. Mérendő (az építőnek, ha a titkos szavazás sorra kerül)

- **A kriptográfia a beépítettel:** az „összeadható titkosítás” és a bizonyítékai egy elliptikus görbén (vagy egy prímszám-csoportban)
  számolnak; a WebCrypto ezt közvetlenül nem adja — saját, nagy egészes számolással mennyi idő egy szavazat a telefonon.
- **A szavazat mérete** a bizonyítékokkal (6. szabály: az utazó adat kicsi).
- **Az összesítők elérhetősége:** hány összesítő kell (*n*, *t*), hogy egy 7 napos döntés alatt a kötegek és a zárás biztosan
  kinyíljon.
- **A valódi jogosulti létszámok:** milyen gyakori a kis csoport (a terepi koinók adataiból) — ebből a *X* és az *m* kiinduló értéke.

## 8. A tartózkodás javítása (ET-2/6)

Csaba (2026-11-08): *„ezt orvosolni kell. van javaslatod?”* — *„ne maradjon úgy, mint a prototípusban.”* — és a javaslatom
helyesbítése: ✅ *„a tartózkodás, a támogatottsági arányt nem módosítja, a részvételt viszont növeli, ezért a bizonyossági mutatót is
növeli, ezért rövidebb lesz a döntési idő.”*

**✅ A szabály (ET-2/6, Csaba döntése):**
- **A támogatottság:** az igenek aránya az igenek és a nemek között — a tartózkodás nem számít bele:
  `igen × 100 ≥ elfogadási küszöb × (igen + nem)` (egész aritmetikával, mint ma). Ha senki nem mondott se igent, se nemet, nincs
  elfogadás.
- **A részvétel:** a tartózkodó részt vett — beszámít (`igen + nem + tartózkodik` a nevezőhöz).
- **Az egyértelműség** (a bizonyossági mutató egyik fele): az igenek és a nemek különbsége az igenek és a nemek között — a tartózkodás
  ebbe sem számít.
- **A bizonyossági mutató** = (egyértelműség + részvétel) / 2, ezért **a tartózkodás növeli** (a részvételen át), és **rövidebb lesz a
  döntési idő**.

*Példa — 11 jogosult, a küszöb 51%, a döntési idő 1 mp – 7 nap:*
- *5 igen, 4 nem, 2 tartózkodik: támogatottság 5/9 = 56% → **elfogadva**; egyértelműség 1/9 = 111‰, részvétel 11/11 = 1000‰ → mutató
  556‰ → a döntés kb. **3,1 nap** után zárul;*
- *ha a 2 tartózkodó nem szavaz: ugyanúgy elfogadva, de a részvétel 9/11 = 818‰ → mutató 465‰ → kb. **3,7 nap**.*

⚠️ **A kimondott következmény:** sok tartózkodás mellett kevés igen is gyorsan elfogad (pl. 1 igen, 0 nem, 20 tartózkodik: 100%,
teljes részvétel → gyors zárás). Ezt csak a közösség által állított küszöbök fogják meg (a részvételi küszöb ezt nem — a tartózkodás
részvétel).

⚠️ **A mag változása** (`javaslatSzamitas.js` `allasSzamokbol`): a mostani teszt koinók után, az első, szélesebb körben terjesztett
koinó előtt.

## 9. Titkos vagy nyílt — az etikai kérdés (ET-2/1)

Csaba (2026-11-08): *„legyen már az első koino-ban titkos. (az első koino alatt, nem a mostani koino-kat értem. most még csak teszt
koino-kat hozunk létre, majd szólok, hogy melyeket akarom szélesebb körben is terjeszteni.) ideiglenes megoldásokat ha lehet kerüljük
el, szóval ha későbbi verzióban titkosra tervezzük, akkor az legyen, de én még mindig nem vagyok bizonyos a titkos vs nyílt szavazás
etikai kérdésében.”* → Az 5. szakasz „először nyílt, később titkos” javaslata **visszavonva**: ideiglenes megoldás lett volna.

**A titkos szavazás mellett:**
- **A nyomás ellen:** a főnök, a család, a közösség nem látja, hogyan szavaztál — mindenki a meggyőződése szerint szavazhat.
- ⭐ **A megvett szavazat ellen — ez a legerősebb érv nagy léptékben:** nyílt szavazásnál a vevő MAGA látja a láncon, hogyan
  szavaztál, tehát a vásárlás biztos üzlet. Titkosnál csak a szavazó saját „bizonyítékát” kapja meg, amit egy későbbi újraszavazás
  érvénytelenít — a vásárlás bizonytalan üzlet lesz.
- A szavazás titkossága a demokráciák bevált szabálya, és a D2 eredeti oka.

**A nyílt szavazás mellett:**
- **Az átláthatóság:** látszik, ki mit támogat — lehet vele érvelni, és a vita nyílt.
- **A nyíltság szelleme** (D55 — a nyíltság: *„a koino a nyíltságról szól”*).
- **Egyszerűbb:** nincs összesítő, nincs köteg, minden gép bármikor számolhat.

**A közös pont:** a titkos szavazás nem tiltja a nyíltságot, csak **önkéntessé teszi**: bárki kimondhatja a saját állását nyilvánosan
(egy hozzászólásban, a javaslat szövegében), ha akarja — de senki nem kényszeríthető rá, és senki nem ellenőrizheti a szavazatát. ⭐
Így olvasva a D55 nem ütközik vele: a D55 az **azonosság** nyíltságáról szól (ki vagy — a bizalomhoz ez kell), a szavazás titka a
**vélemény** szabadságáról. *(A D2 is így választotta szét: a tudatpont nyilvános — „mi fontos nekem” —, a szavazat titkos — „mit
gondolok róla”.)*

**A kis csoport** (ET-2/5) ettől független: ott a végeredmény úgyis sokat elárul. Ha a szavazás mindig titkosított, ott is az — csak a
lap kimondja, hogy kevés szavazónál a titok gyenge.

## Napló

- **2026-11-08** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-2/1 – ET-2/6 Csabánál.
- **2026-11-08** — Csaba: a tartózkodás nem maradhat (a javítás: 8.); ha titkos, az elejétől — az „először nyílt” javaslat visszavonva;
  az etikai kérdés még nyitott (a két oldal: 9.).
- **2026-11-08** — ✅ **ET-2/6** (Csaba): a tartózkodás a támogatottságba nem, a részvételbe igen — a bizonyosságot növeli, a döntési
  időt rövidíti (a javaslatom, hogy lassítson, helyesbítve).
