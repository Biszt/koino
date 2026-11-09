# ET-11 — Az átutalás várakozási ablaka és összeghatára (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** 🔍 tervezve · ⏸️ ET-11/1 – ET-11/5 Csabánál (6. szakasz).

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

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-11/1 – ET-11/5 Csabánál.
