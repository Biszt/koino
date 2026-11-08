# ET-2 — A szavazás, és a titkos szavazás (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-08. Programkód nem készült; amit csak mérés dönthet el, az a
7. szakaszban „mérendő”. A D-számok mellett a döntés címe áll.*

> **Állapot:** 🔍 tervezve · ⏸️ ET-2/1 – ET-2/6 Csabánál (6. szakasz).
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

⭐ **A javaslatom:** az első koinóban a szavazás **nyílt marad**, kimondva — ez illik a **D55 — a nyíltság** szelleméhez (*„a koino a
nyíltságról szól”*). A titkos szavazás egy **a koinó születésében választható szabály** legyen (mint a többi szabály: **D118 — a
költözés alakja**), amit egy későbbi koinó-verzió hoz — a módja ez a terv. Ha viszont már az első koinóban titkosat akarsz, az is
megtervezhető (6. szakasz).

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

## 5. A javaslat

- **Az első koinóban (C):** nyílt szavazás, kimondva a lapon (*„a szavazatod a koinó tagjai számára látható”*).
- **A titkos szavazás (A) módon, a koinó születésében választható szabályként,** egy későbbi koinó-verzióban: a titkosság *X*
  jogosult felett kapcsol be, az összeg *m* szavazatonként nyílik, az összesítők a jogosultak közül, a javaslat azonosítójából
  számolt véletlennel.
- **A tartózkodás** (a mai szabály, a prototípus öröksége): maradjon, de a lap mondja ki, hogy az elfogadás ellen hat (ET-2/6).

## 6. A kérdések (⏸️ Csabáé)

- **ET-2/1 — Kell-e titkos szavazás, és mikor?** (A) ⭐ az első koinóban nyílt (a D55 szellemében, kimondva); a titkos szavazás a koinó
  születésében választható szabály, egy későbbi verzióban; (B) már az első koinóban titkos; (C) soha — a D2 elvetve.
- **ET-2/2 — Ha titkos, mi titkos?** (A) ⭐ hogy ki HOGYAN szavazott; hogy KI szavazott, az látszik (a részvételhez és a jogosultsághoz
  kell); (B) az is, hogy ki szavazott (névtelen szavazás).
- **ET-2/3 — Ha titkos, a módszer:** (A) ⭐ titkosított szavazat, csak az összeg nyílik, véletlen összesítők a jogosultak közül;
  (B) névtelen szavazat (gyűrű-aláírás).
- **ET-2/4 — Ha titkos, a lezárás ideje:** (A) ⭐ az összeg kötegekben nyílik (legalább *m* új szavazat, vagy a határidő), a lezárás
  ideje a legutóbb kinyílt összegből; (B) a korai lezárás csak a részvételből, az eredmény a végén nyílik.
- **ET-2/5 — Kis csoportban:** (A) ⭐ titkos csak legalább *X* jogosult felett (*X* a koinó szabálya); alatta nyílt, kimondva; (B) mindig
  titkos — de a kis összeg úgyis árulkodik.
- **ET-2/6 — A tartózkodás:** (A) ⭐ marad, ahogy a prototípusban (a leadott szavazatok közt számít, így az elfogadás ellen hat), és a
  lap kimondja; (B) a tartózkodás csak a részvételbe számítson, a támogatottságba ne (5 igen, 4 nem, 2 tartózkodás → 5/9 = 56%:
  elfogadva). ⚠️ A (B) a mag változása, és eltér a prototípustól.

## 7. Mérendő (az építőnek, ha a titkos szavazás sorra kerül)

- **A kriptográfia a beépítettel:** az „összeadható titkosítás” és a bizonyítékai egy elliptikus görbén (vagy egy prímszám-csoportban)
  számolnak; a WebCrypto ezt közvetlenül nem adja — saját, nagy egészes számolással mennyi idő egy szavazat a telefonon.
- **A szavazat mérete** a bizonyítékokkal (6. szabály: az utazó adat kicsi).
- **Az összesítők elérhetősége:** hány összesítő kell (*n*, *t*), hogy egy 7 napos döntés alatt a kötegek és a zárás biztosan
  kinyíljon.
- **A valódi jogosulti létszámok:** milyen gyakori a kis csoport (a terepi koinók adataiból) — ebből a *X* és az *m* kiinduló értéke.

## Napló

- **2026-11-08** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-2/1 – ET-2/6 Csabánál.
