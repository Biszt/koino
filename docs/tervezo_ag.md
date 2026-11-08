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
   nyúl — azokat az építő vezeti át, amikor a tervet átveszi.
3. **A számozás külön:** a tervező javaslatai és Csaba rájuk hozott döntései **ET1, ET2, …** („előre-terv”) jelet kapnak. Amikor az
   építő átveszi őket, a következő D-szám lesz belőlük, mellette az ET-jel (pl. „D130 (ET4)”). Így a két ág sosem ad két döntésnek
   ugyanazt a számot.
4. **A commit csak a saját fájlra:** `git add <fájl>` és `git commit -F <üzenet> -- <fájl>` — a fájl megnevezése miatt a másik ág
   félkész (akár már hozzáadott) munkája sosem kerül bele.
5. **A D-szintű döntés Csabáé** — mindkét ágon döntési kérdésként.
6. **Az átadás:** egy téma végén a tervező kimondja, mi kész a tervben, mi a következő építési lépés, és mit kell előtte mérni; az
   építő ebből indítja az átvizsgálást (a megszokott módon, de már a kész tervvel).

## 2. A kiinduló kép: a teljes P2P koino terve (2026-11-08)

*Az állapot a D126 lezárásakor: 126 tervezési döntés (D1–D126), 249 elágazás, 92 mérés, ~1430 önpróba, a program 375 fájl /
~7390 KB. A D126 (a feltöltött nézetek) a fork pillanatában megépült, a próbái zöldek, a teljes sor és a commit az építő ágon zárul.*

### 2.1 Mi a koino, és mi a Fázis 2

A **Kollektív Intelligencia Online** egy közösségi tér, amit a tagjai irányítanak. A tagok **e-emberek**: egyszerre tulajdonosok,
fejlesztők, moderátorok és felelősök. A lényeg a közös döntés: gondolatokból javaslatok, javaslatokból egyezmények születnek,
központi szereplő nélkül.

A **Fázis 1** (`koino_1.1`, a koino.hu) a központi szerveres prototípus. Bebizonyította a döntés-gépezetet; ma befagyasztva fut. A
**Fázis 2** a P2P koino (`C:\koino`): a készüléken fut, szerver nélkül, aláírt eseményekkel. A fordulat oka (D22): *„a kis családi
közösségeknek is P2P-nek kell lenniük.”* A nyelv JavaScript maradt (D23), a régi adat nem költözik — új regisztráció lesz (D24).
A koino önálló program (Node — D29), a böngésző csak a rajzolója (7. szabály).

A koino **eszköz, nem közösség** (D13): bárki indíthat koinót — család, osztály, munkahely, párt. A szétválás (fork) normál
üzemmód, nem vésznyílás; a siker mércéje az, hány koinó létezik. Ahol egy erkölcsi kérdésre nincs egyértelmű válasz, ott nem
választunk, hanem kettéosztunk: legalább két koinó indul (az egyikben a teljes név és a település kötelező, a másik enyhébb). Nincs
„családi” és „globális” koino: egy program van, ami nő — ezért a szerkezetének az első naptól a milliárdot kell bírnia.

### 2.2 A szabályok, amik minden döntést kötnek

- **A platform-függetlenség nyolc szabálya:** a szállítás cserélhető; semmi nem múlik egyetlen címen; a bizalom sosem a csatornából
  jön (egy kapu van: `esemenyMentese`); mindig van kézi út (fájlba ki, fájlból be); nincs folyamatos kapcsolat (postaláda, nem élő
  továbbító); nulla függőség, és az utazó adat kicsi marad; a böngésző csak kliens; jogi védelemre nem tervezünk.
- **A kilencedik, ami fölöttük áll:** a skálázhatóság szempontjából az első verziónak is késznek kell lennie. A szerkezet és az
  illesztés milliárdos, a megvalósítás mögötte lehet egyszerű. A „végtelen” mércéje: egy készülék terhe nem a koinó méretétől függ,
  hanem attól, amivel ő maga foglalkozik. A méret-korlát nem lehet szűkebb a koinó saját határánál; ahol ez drága, ott kimondott
  kivétel áll (D106).
- **A munka elvei:** az egyszerű és változtatható jobb a teljesnél (ami ritka és nem végzetes, azt felírjuk, de nem építjük); a
  helyes sorrend fontosabb, mint hogy minél hamarabb látsszon valami; amire egy lépés épül, azt nem halasztjuk (az alappillér elve);
  előbb a mérés, aztán az építés; egy próba csak akkor bizonyít, ha elrontva bukik.

### 2.3 A döntés gépezete

- **A gondolat** a platform alapegysége. A **kategóriák** és a **gondolattípusok** rendszerezik — ezek is önálló entitások, mert róluk
  is a közösség dönt.
- **A tudatpont:** mindenkinek ugyanannyi (10 000). Nem elkölthető, csak szétosztható és bármikor átrendezhető. Prioritást fejez ki,
  nem szavazaterőt. Egyben **tárolási vállalás** is (D3, D26): aki pontot tesz egy entitásra, az a készülékén tárolja. Amire senki
  nem tesz pontot, az eltűnik — a felejtés a rendszer alapállapota (D14).
- **A javaslat:** csak az tehet, akinek pontja van az érintett gondolaton. A **szerkesztési** javaslat módosít, áthelyez, töröl vagy
  egyesít; ha több entitást érint, érintettenként külön dől el, és mindegyiknek teljesülnie kell (a töredék-modell). Az **általános**
  javaslat a közösség álláspontja: az egyezménye élő, csatlakozni, tiltakozni és ütközést jelölni lehet hozzá (D27). Az alkotmány, a
  2/3-os rendszer és a program-frissítés mint gépezet elvetve (D64–D66): *„mind sok új élt hoznak létre.”*
- **A szavazás:** aki pontot tett az érintettre, egyenlő súllyal szavaz. ⚠️ A D2 célja — titkos, de ellenőrizhető szavazás, kiváltságos
  adatkezelő nélkül — még nincs megépítve.
- **A küszöbök:** a tulajdonosok érték javaslatainak mediánja (D4), a felelősség-elvvel: amit a tulajdonosok nem védenek be, azt a
  rendszer sem védi helyettük. A **bizonyossági mutató** szerint a döntés a minimum és a maximum döntési idő között zárul — annál
  hamarabb, minél egyértelműbb az eredmény és nagyobb a részvétel.
- **Az egyezmény** nem kihirdetés, hanem **számítás** (D17): ugyanabból az eseményhalmazból mindenki ugyanazt kapja. Ugyanolyan
  entitás, mint a gondolat (D85). A ténye és a hatálya külön áll (D8), és a tény is csak addig él, amíg valaki tartja (D14).

### 2.4 Az identitás

- **A kulcs maga a személy** (Ed25519 — D15): hitelesít, nem titkol; a helyreállítás több tanúból áll. Személyes adat soha nem kerül
  a láncra (D6); a név a profilban sózott lenyomattal szerepel, a darabja törölhető (D88).
- **A két lépcső (D56):** az **1. lépcső** egy meghívó — ettől tag vagy, és minden mehet: gondolat, tudatpont, javaslat, szavazat. A
  **2. lépcső** három tanúsítás felhatalmazott tanúsítóktól — ez a pénztárca kapuja (D11). A felhatalmazás megbízás, nem pontszám
  (D60). Az ellenőrzés a gyökérig megy, és mérten logaritmikus (D59). Ebben a verzióban a papír nélküli emberrel nem számolunk (D58).
- **A rendszer bejelentő, nem bíró (D19):** ami nem ellenőrizhető, azt kimondja. A kontraszt-jelzés („még nem értünk össze”) tényt
  mutat, nem ítéletet.
- **A szeletelt világban** a tagság a tagnál utazik a bizonyítékával (D93), a 2. lépcső szúrópróbával igazolható (D94), a tagsági lánc
  korlátja 256 (D113).
- **A belépés a lapon (D121–D122):** a meghívó egyetlen bemásolt sor (a telepítő és a meghívó együtt); a meghívott gépe az első
  cserénél bizonyítja, hogy nála a titok, és a meghívó gépe magától meghívja.

### 2.5 Az adat: események, tárak, számítás

- **Minden művelet aláírt esemény,** kanonikus alakban, a szerző láncán (sorszám, előző, lánc-gyökér — D63). Módosítás és törlés
  nincs, csak hozzáfűzés. Minden esemény ugyanazon az egy kapun megy be — a sajátom, a társé, a fájlból hozott is.
- **A tár:** egy hozzáfűzhető adatfájl és egy mutató (D73), mögötte az **író** (D70): koinónként és készülékenként egy folyamat fűz.
- **A szelet** (D72) egy entitás eseményei — ez a tárolás és a csere egysége. A szöveg, a kép és a kód külön, tartalom-címzett
  darab (a neve a lenyomata).
- **Két tár (D75):** a **tartós** az, amit vállalok (amire pontot tettem, a saját azonosságom, a koinó születése); az **átmeneti**
  az, amit csak láttam (eldobható, ≤ 20 MB). Ami nincs nálam, azt **kérésre** hozom el (D76).
- **Az összegző Merkle-fa** (D78) teszi ellenőrizhetővé, amit egy készülék nem tud egészében látni: a kiosztás-listát szúrópróbával
  (D79), az ellentmondást bizonyítékkal (D80–D82 — a kettős lánc nem büntet, hanem a két ágat egy helyre hozza).
- **Az állapot nem tárolt, hanem számított** (`koinoKepe`). A **mag** (D123) az a 17 fájl, ami a koinó képét és a kaput számolja: ha
  ez változik, más lesz a számítás — ez költözést kíván.

### 2.6 A hálózat

- **UDP mindenhol** (D67, D69): állandó UDP-kapu, kopogás a fal órájához igazítva (a két rés középen találkozik), postaláda (D34). A
  csere titkosított (X25519 + AES-256-GCM); a koinó alapból **zárt** — a tartalmát csak tag kapja (D89).
- **A megtalálás:** a meghívó címei, a helyi felfedezés; a tartós kapcsolat a **kötés** (K = 3, a neve a tábla-kulcs, nem a cím —
  D71) és a **hirdetőtábla** (a DHT-n, BEP 44 — ha valaki címet vált); a tartalom szerint a **raj** és a **címjegyzék** (BEP 5, vakított
  témák — D91), két NAT között a **függő kérelem** (D92).
- **A csere** szeletenként, két szinten: előbb a szeletek lenyomatai, aztán az eltérők tartományai (D74); a társ-emlékezettel csak az
  azóta változott (D98); újdonság nélkül fél körönként egyszer (D99). A **szigorú (b)** szerint egy készülék csak a vállalt szeleteiben
  vesz részt (D95, D97), és 24 óráig még tartja, amiről levette a pontját (D104).
- **A kérelem** (D87, D92): fejlécek, szúrópróba, szelet, törzs. A **kiszolgálási keret** (D109) óránként korlátozza, mennyit adok
  másnak; a **törzs-határ** (D120) szerint a nem vállalt nagy fájl csak kérésre jön; a fájl több forrásból is jöhet (D114).
- **A kereső-réteg** (D105, D107): szavanként két kulcs a DHT-n (az egész szó és az első négy betű), csak tag szerzők, osztódó fiók,
  aláírt megújítás. A **felderítés** (D108, D112) egy ág egyszeri pillanatképe.
- **A protokoll nyelvváltozata** (D124): minden munka elején mindkét fél kimondja, mit beszél; a régit egy kimondott dátumig fordítja.

### 2.7 A felület

A lap a böngészőben fut, a helyi kapun át: csak a hurok-címen, öt őrrel (jelszó, Origin, Host, útvonal, JSON-írás). A prototípus
kártyái bájtra átjöttek; a koinós többlet köréjük épül. Ott van a pakli (D100), a modálok és a bejáró (D101–D102), az alsó sáv, az
értesítés a készülék saját értesítőjén (D103), a belépő tér (a koinóid — D25), a csatlakozás, a társak, a Struktúra, a Síkidom és a
Keresés. A parancssor mindent tud, amit a lap — a rajzot kivéve (4. szabály).

### 2.8 A koinók családja és a program megújulása

- **A megújulás költözés, nem frissítés** (D66): a régi koinót nem írjuk felül; aki akar, átköltözik az újba.
- **A költözés** (D118): a múlt közös, a jelenlét személyes. A gyermek a szülőre épül, a vágásig átírás nélkül, de súlyt csak a
  beköltözők hoznak. A koinó neve a születése lenyomata, a szabályai a születésében állnak.
- **A koino-verzió kártya** (D119): egy gyermek-koinó születése, a kártyáján a teljes program kódja; a közös gyökerű koinókat egy
  **családi őrjárat** cseréli.
- **A program rétegei** (D123): a koinó a számítás **magját** nevezi meg — ez köt; a protokoll, a helyi viselkedés és a felület szabadon
  változhat. Erre épült a protokoll nyelvváltozata (D124), a **telepítés a kártyáról** (D125: a régi mellé, a futó program cserél, 30
  mp után visszafordít) és a **közösség feltöltött nézetei** (D126: a kód a kártya szövegében, csak a saját koinójában, négy réteg
  mögött elszigetelve; olvas és „megnyit”, írni nem tud).
- **A kormányzás három szintje** (`kormanyzas.md`): a gondolat és a program ugyanazzal a gépezettel dől el (önalkalmazás — nincs
  végtelen torony); a koinók sokasága felett nincs kormányzat, mert nincs mit eldönteni — egy koinó léte tény. A forráskód-kormányzás
  öt lépcsőjéből a javaslat, a döntés és a bevezetés (a költözés) áll; az **elismerés** (a hozzáértés látható, de nem ad jogot) és a
  **sürgősségi út** (N9) még nincs.

### 2.9 Ami még nincs: a pénz és a konszenzus

- **A pénz** (D10, D11, D16, D20 és Csaba első konkrét terve, 2026-09-02): a pénzteremtés szabálya közösségi, de lassan és drágán
  módosítható; **egyenlő osztalék**, feltétel nélkül, „csak úgy, a létezéséért”; az induló 10 koinos egy év alatt (a mennyiséget a
  létszámhoz köti, később nem módosítható), és évi 10% az összes pénzre, mindenkinek egyenlően szétosztva (2/3-dal módosítható);
  belső piac, ahol az ár a keresletből derül ki; legalább 3 e-ember hozza létre. ⚠️ Ez a terv javaslat, nem lezárt döntés
  (csak a feltétel nélküliség eldöntött) — és a 2/3-os módosítása ütközik a D66-tal, ami a 2/3-os rendszert elvetette: ez tervezendő. Lassú, nyilvános és megtámadható: a nagyobb átutalás
  késleltetve, a várakozási ablakban megállítható (D16). Örökölhető — a tudatpont és az azonosság nem (D20). ⛔ **Csak az identitás
  éles bizonyítása után indulhat** (D11). A kiköltözésnél a pénz kivezetése is ide tartozik.
- **A konszenzus** (D7, D17): globális egyetértés csak két dologhoz kell — az azonosság egyszeriségéhez és a pénzhez; minden más saját
  lánc-következetesség és determinisztikus számítás. Személy-alapú (egy ember, egy érvényesítő hang), nem munka- és nem vagyon-alapú.
  A köteg-gyökér elfogadása és az érvényesítők befolyásolhatatlan kiválasztása **az utolsó valódi kutatási kérdés** (N8).
- **A titkos szavazás** (D2) — cél, ma még nem képesség.
- **Az egyesítés és a különválás** Csaba modellje szerint (`gepezet.md` 5.) — terv, nyitott kérdésekkel.

### 2.10 A nyitott ágak (2026-11-08)

- **A terepen próbálandó:** a telefon cseréje a kártyáról (D125 — a futó koinó leállítása, a háttérben indulás), a feltöltött nézet a
  telefon böngészőjében (D126), a két mobil közötti rés (🅱️), az őrjárat egyszeri megállása (2026-11-05 — a processzoridőt mérjük).
- **Csabánál:** a koinó többi BEP 5 útja (BP1–BP4, átvizsgálva); az IPv6 (kettős kapu); a régebbi kérdések — a véletlen séta, az olcsóbb
  tábla-kulcs, a fájl-bájtok kézi útja, a hívás ötlete.
- **Még nem tervezett részletesen:** gyökér-koinó a lapról (ma csak parancsból); a családi őrjárat terepi leletei; a meghívás mellékes
  megfigyelései.

## 3. A tervező ág naplója

- **2026-11-08** — a tervező ág indul (Csaba forkja a D126 építése közben). A kiinduló kép: a 2. szakasz.
