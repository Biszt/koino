# ET-11 — Az átutalás várakozási ablaka és összeghatára (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** 🔍 tervezve · ✅ ET-11/3, ET-11/4 (Csaba, 2026-11-09) · ⏸️ ET-11/1, ET-11/2, ET-11/5 és a piac — Csaba válaszai és a
> javított javaslat a 7. szakaszban.

## 1. A rövid válasz

A **D16 — a pénz lassú, nyilvános és megtámadható** kimondta: a nagyobb átutalás késleltetve megy, és a várakozási ablakban megállítható —
így a kulcslopás **túlélhető**. Nyitva maradt: mekkora összeg fölött, mennyi ideig, ki állíthatja meg. A javaslat — az ET-3 (a kulcs) és
az ET-8 (a tanúk) döntéseivel összerakva:

- **Nagy átutalás:** ha egy nap alatt összesen a küldő **egyenlegének 10%-a** fölött küld (napi összeg — hogy ne lehessen apró tételekre
  bontani). A kisebb azonnal megy (a tanú-nyugták után).
- **Az ablak: 72 óra.** Annyi idő kell, hogy ha mindent elloptak, egy új készüléken a csere-kulccsal (ET-3) visszavedd az azonosságodat.
- **Megállítani könnyű, küldeni lassú:** a függő átutalást az azonosság **bármely másik készüléke** vagy a **csere-kulcs** azonnal
  megállíthatja. Más csak jelezhet, megállítani nem tud.
- **Az értesítés a többi készülékre megy** (a D16 kényszere: *„ne ugyanarra az eszközre, mint amin a kulcs van”*).

## 2. A mai terv (D16) és amire épül

- **D16:** *„A döntést nem elvesszük, hanem lelassítjuk és megdrágítjuk.”* A nagyobb átutalás késleltetve, nyilvánosan, a várakozási
  ablakban megtámadhatóan megy. Három eset: ha a kulcsodat ellopják, de neked is megvan, megállítod; ha ki is zártak, a helyreállítás
  beleér az ablakba; ha csak elvesztetted, a lassú út elég. *„Az ár őszintén: a koino-pénz nem lesz azonnali. Cserébe nem lesz
  visszafordíthatatlan.”*
- **ET-3 (a kulcs):** készülékkulcsok az azonosság kulcsa alatt; az előre lekötött csere-kulcs (papíron és darabolva a hálózatban).
- **ET-8 (a konszenzus):** az átutalás tanú-nyugtákkal válik biztossá.
- **D103 — a levél helyett a készülék saját értesítése:** a készülék maga szól (Windows, telefon).

## 3. A menet

1. Anna a telefonjáról 50 000 koinost küld Bélának; az egyenlege 200 000 — ez a 10%-os napi határ (20 000) fölött van → **függő
   átutalás**, 72 órás ablakkal.
2. A tanúk nyugtázzák (ET-8): a lépés helye foglalt, kettős költés nem lehet. A pénz **lekötve** — Anna nem költheti el, Béla még nem.
3. **Anna laptopja azonnal szól:** *„A telefonod 50 000 koinost küld Bélának — 72 óra múlva megy át. Ha nem te voltál: Megállítom.”*
4. Ha Anna nem állítja meg, 72 óra után a pénz Béláé. Béla lapján végig látszott: *„Függő: 50 000 Annától — csütörtök 14:00-kor jön.”*

*Ha a telefont ellopták:* Anna a laptopon megállítja, és a laptopról (az azonosság kulcsával) kizárja a telefont (ET-3). *Ha a laptop
nincs kéznél, és mindent elloptak:* egy új készüléken a csere-kulccsal (papír, vagy a jelszó és a hálózat) visszaveszi az azonosságát, és
onnan állítja meg — a 72 óra erre elég.

## 4. A részletek

- **A napi határ a saját egyenleghez mér:** egy rögzített összeg elavulna (a pénz mennyisége az osztalékkal évente nő), és a kis egyenlegűt
  túl lazán, a nagyot túl szigorúan fogná. A 24 órán belüli összes küldés számít — tíz darab 5000-es ugyanúgy függő lesz, mint egy
  50 000-es.
- **A megállítás egy aláírt esemény** a függő átutalásra hivatkozva; a tanúk ugyanúgy nyugtázzák. ⚠️ Az „időben” a tanúk órája szerint
  értendő: a megállítás akkor hat, ha a nyugtái a határidő előtt összegyűltek (az építéskor pontosítandó).
- **Egy kizárt készülék** (ET-3: a visszavonás kimondja, meddig érvényes a lánca) függő átutalásai automatikusan megállnak.
- **Más csak jelezhet:** bárki (pl. a címzett, vagy aki gyanút fog) nyilvánosan jelezheti, hogy egy függő átutalás gyanús — ez látszik,
  de nem állít meg semmit (D19 — a rendszer bejelentő, nem bíró). Különben bárki megbéníthatná bárki más fizetését.
- **A kassza kifizetése** (ET-9): az elfogadott nagy kifizetés is 72 órát vár; ezalatt a kassza tulajdonosai egy visszavonó javaslattal
  megállíthatják (ha az az ablakon belül elfogadást kap).
- **A határ és az ablak a koinó születési szabályai** (ET-7/3): egy másik koinó-verzió mást mondhat.
- **Ha csak egy készüléked van:** a lap figyelmeztet — *„Az átutalásaid értesítése nem jut el máshová. Vegyél fel egy második készüléket,
  vagy tartsd kéznél a papíron mentett csere-kulcsodat.”*

## 5. Amit nem old meg

- **Ha a tolvaj a csere-kulcsot is megszerzi** (a papírt és a jelszót is): akkor az azonosság az övé lesz — ez ellen csak a csere-kulcs jó
  őrzése véd (ET-3).
- **Ha 72 óráig nem nézel a készülékeidre:** az ablak lejár. Hosszabb ablak biztonságosabb, de minden nagy fizetést lassít.
- **A becsapott küldő** (Anna önként küld egy csalónak): a koino nem bíró — az ablak ezt nem fogja meg, hacsak Anna meg nem gondolja magát.

## 6. A kérdések (⏸️ Csabáé)

- **ET-11/1 — Mi számít nagy átutalásnak?** (A) ⭐ ha egy nap alatt összesen a küldő egyenlegének 10%-a fölött küld; (B) egy rögzített
  összeg fölött (a születési szabályban) — a pénz mennyisége nő, a határ elavul; (C) minden átutalás vár.
- **ET-11/2 — Az ablak hossza:** (A) ⭐ 72 óra; (B) 24 óra (gyorsabb, de egy teljes lopás után kevés lehet a visszavételhez); (C) az összeggel
  nő (pl. az egyenleg felénél 7 nap).
- **ET-11/3 — Ki állíthatja meg:** (A) ⭐ az azonosság bármely másik készüléke és a csere-kulcs — azonnal; más csak jelezhet; (B) csak az
  azonosság kulcsa; (C) bárki (a D16 „bárki reagálhat” szó szerinti olvasata) — mindenki megbéníthatná mindenki fizetését.
- **ET-11/4 — Az értesítés:** (A) ⭐ az azonosság többi készüléke azonnal szól, a készülék saját értesítőjével; egy készüléknél a lap
  figyelmeztet; (B) minden készülék szól, a küldő is (a küldő értesítése egy tolvajnak is szól — a D16 szerint nem segít).
- **ET-11/5 — A kassza nagy kifizetése:** (A) ⭐ ugyanúgy 72 órát vár; ezalatt egy visszavonó javaslat megállíthatja; (B) nincs külön ablak
  (a döntési idő elég).

## 7. Csaba válaszai (2026-11-09) és a javított javaslat

### 7.1 A határ mindenkire ugyanaz (ET-11/1)

Csaba: *„akkor ne a saját kasszájához mérjük, hanem az összes koinoshoz, amit naponta kiszámolnak a tanúk. így mindenkire ugyanaz
vonatkozik.”*

**Jó — és a napi kör (ET-8/2) ezt már kimondja.** A javaslat: a határ a **fejenkénti átlag** (a létező pénz osztva a 2. lépcsősök
számával) **10%-a naponta**. Ez mindenkire ugyanaz, és a koinóval együtt nő. *Példa: ha az átlag 100 000, a napi határ 10 000 — Annára és
Bélára egyformán.* ⚠️ Az *összes* pénzhez mérni egy nagy koinóban óriási határt adna (milliárd fő × 100 000), ezért az átlagot javaslom —
ha mégis az összeshez akarod, egy nagyon kicsi rész kell (pl. milliomod), ami a létszámmal együtt elavul.

### 7.2 A változó ablak — az összegtől igen, a kapcsolatoktól óvatosan (ET-11/2)

Csaba: *„az ablak hossza is legyen változó, ami a tranzakció mennyiségétől, és az érintettek hitelesség-mutatójától függ (itt a
találkozási tengerben lévő kapcsolataira gondolok).”*

- **Az összegtől: igen.** *Példa: a napi határ fölött 24 óra, az átlag felénél 72 óra, az átlagnál nagyobb összegnél 7 nap.*
- **A kapcsolatoktól — egy ütközés, amit el kell mondanom:** a **D49 — a jelzés tényt mutat, soha nem ítéletet** három védőkorlátja közül az
  egyik: *„a jelzés tájékoztat, nem jogosít — vékony hálótól semmilyen jog nem csökken”*. Ha a kevesebb kapcsolat hosszabb ablakot jelent,
  akkor a vékony háló egy jogot csökkent (lassabb a pénze). És a mérések szerint a *„kevés kapcsolata van”* jelzés a becsületes tagok
  **31–45%-át** érintené — épp a magányosokat és a frissen érkezetteket. *(Az ET-4/1-ben ugyanezért vetetted el a számított hitelességet a
  2. lépcsőnél.)*
- ⭐ **A javaslat:** az ablak csak az **összegtől** függjön; a kapcsolatok **tájékoztatásként** látszanak a címzettnek (*„Annát 40-en
  ismerik személyesen”*) — és ő dönti el, mikor adja át az árut (7.3).

### 7.3 A piac és az ablak (ET-11/3 kiegészítése)

Csaba: *„a piaci tranzakció esetében gondot jelenthet az, ha a küldő visszavonhatja az utalását, miután megkapta az ellenértéket. amúgy én
nem látom annak a préda értékét, hogy valaki készülékével utalok magamnak koinost, mivel teljesen nyomon követhető. a lebukás garantált.”*

**Az első felében igazad van:** ha a tolvaj magának utal, a nyoma ott van — a pénz egy ismert, 2. lépcsős azonossághoz megy. **De a piac
nyit egy másik utat:** a tolvaj Anna telefonjáról nem magának utal, hanem **Bélának, aki cserébe készpénzt ad neki** (vagy egy tehenet). A
koinos-nyom Bélához vezet, aki becsületes — a tolvaj a készpénzzel eltűnt. Ez ellen véd az ablak: Anna megállítja — de akkor Béla marad
pórul, ha már átadta a készpénzt.

⭐ **A javaslat — a piaci ügylet is ablakot kap, de:**
- **a megállítás lopás-bejelentés:** aki egy piaci ügyletet megállít, azzal kimondja, hogy *„nem én küldtem”* — és a küldő készülék ezzel
  automatikusan kizáródik (ET-3). Így a megállítás nem használható olcsó meggondolásra (*„megkaptam a tehenet, visszaveszem a pénzt”*): a
  saját készülékeddel fizetett, majd megállított ügylet egy nyilvános lopás-bejelentés, ami a készülékedet viszi;
- **az eladó látja, mikor végleges:** *„Függő: 50 000 Annától — csütörtök 14:00-tól nem visszavonható”* — és ő dönti el, átadja-e előbb
  az árut (a kockázatot vállalva) vagy kivárja;
- **a határ alatti ügylet azonnal végleges** (a mindennapi kis vásárlás nem vár).

### 7.4 A kassza nagy kifizetése (ET-11/5) — mire gondoltam, és a javított javaslat

Csaba: *„itt nem tudom, hogy mire gondolsz.”*

**Mire gondoltam:** az ET-9-ben eldöntöttük, hogy egy kasszából (pl. a játszótér kasszájából) csak elfogadott kifizetési javaslattal lehet
pénzt kivenni — *„120 000 Annának a festékre”*. A kérdés az volt, hogy egy ilyen elfogadott, nagy kifizetés is várjon-e még 72 órát.

⛔ **A javított javaslat: ne várjon.** Az ablak a **lopott kulcs** ellen véd — egy kassza kifizetését viszont nem egy kulcs indítja, hanem
egy napokig tartó, nyilvános szavazás. Ellopni nincs mit, és a megállításra (egy visszavonó javaslatra) a szavazás ideje alatt amúgy is van
mód. → **(B) a kassza kifizetésének nincs külön ablaka.**

## 8. Túlbonyolítjuk? (Csaba, 2026-11-09)

Csaba: *„ebben a példában Béla nem becsületes, hiszen megállapodott Annával. egyébként nekem nem jut eszembe olyan visszaélés, amit ne
tartana vissza az a tény, hogy a tranzakciók nyomonkövethetők, de visszatart az, ha van időablak. ezt beszéljük át, mert lehet, hogy túl
bonyolítjuk.”*

**Amiben igaza van:**
- **Ha Béla személyesen ad át készpénzt** valakinek, aki Anna nevében jön, de nem Anna — az Béla kockázata (a megállapodás Annával szólt).
- **A koinón belül minden nyom egy ismert azonossághoz vezet.** Aki magának vagy egy cinkosának utal, lebukik — a 2. lépcső mögött valódi,
  tanúsított ember áll (az első koinóban névvel és településsel).

**Az egyetlen eset, ahol a nyom nem segít, de az ablak igen:** egy **kívülálló** (nem koinó-tag) ellopja Anna telefonját, és a koinosait
**online** eladja: Béla banki átutalással vagy kriptóval fizet egy külső számlára, és „Annától” (a lopott kulccsal aláírva) megkapja a
koinost. Béla nem tisztességtelen — csak egy aláírásban bízott. A koinos-nyom Bélánál véget ér, a pénz-nyom a koinón kívül van. *(A
rendőrség a banki nyomon elkaphatja — de az már nem a koino.)*

**Erre van egy egyszerűbb védelem is, mint az ablak:** a koino **a nagyobb átutaláshoz a készülékén kéri a PIN-kódodat** (a készülékkulcs
jelszóval védett — ET-3). A telefon-tolvaj így nem tud küldeni. Ez helyi dolog: a protokollhoz, a tanúkhoz, a piachoz nem kell hozzányúlni.

**A lehetőségek:**
- **(A) ⭐ nincs várakozási ablak** — a védelem a nyomonkövethetőség (a koinón belül), a PIN a nagyobb átutaláshoz (a kívülálló
  telefon-tolvaj ellen), és a kulcs-szerkezet (ET-3: az ellopott készülék kizárható, a csere-kulccsal visszaveszed az azonosságodat). ⚠️
  Ez a **D16 — a pénz lassú, nyilvános és megtámadható** felülvizsgálata: egy ellopott pénz (ha a tolvaj a PIN-t is tudja) nem hozható
  vissza a programmal.
- **(B) a várakozási ablak csak annak, aki bekapcsolja** a saját fiókjára (mint egy bankkártya napi limitje) — az eladó látja, ha a vevő
  fiókjának van ablaka.
- **(C) a teljes D16** — a 7. szakasz alakja (ablak az összeg szerint, a megállítás lopás-bejelentés).

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-11/1 – ET-11/5 Csabánál.
- **2026-11-09** — ✅ ET-11/3 (a piaci kiegészítéssel), ET-11/4. Csaba: a határ az összes pénzhez (→ a fejenkénti átlag 10%-a); a változó
  ablak (→ az összegtől igen, a kapcsolatoktól nem — D49, a 31–45%); a piac és az ablak (→ a megállítás lopás-bejelentés, kizárja a küldő
  készüléket); ET-11/5 elmagyarázva, a javaslat javítva: nincs külön ablak (7.).
- **2026-11-09** — Csaba: *„lehet, hogy túl bonyolítjuk”* — az egyetlen eset, ahol a nyom nem segít (a kívülálló telefon-tolvaj online
  eladása); az egyszerűbb védelem: PIN a nagyobb átutaláshoz; három lehetőség (8.).
