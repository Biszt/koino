# A közösség feltöltött nézetei — átvizsgálás (D123 ⑤, PR4 — 2026-11-08, kód nélkül)

> **Állapot:** ✅ **D126 — MEGÉPÜLT** (Csaba, 2026-11-08: *„mindet elfogadom, mehetünk tovább”* — NZ1–NZ6 mind (A); az építés: 8.
> szakasz) · ✅ a terepi próba (2026-11-08, közös wifin: Brave, Android — kontrollal). Az elv a D123-ban eldőlt (PR4 (B)): *„olvasó nézetek elsőként: egy nézet
> egy kártya (mint a koino-verzió kártya — a kódja rajta, a pont rá a közösség jelzése), a lap elszigetelten futtatja (külön
> keretben, a kapu csak olvasó végpontokat ad neki), és te kapcsolod be a saját készülékeden.”* Ez az átvizsgálás azt nézi meg,
> HOL és HOGYAN — a kód és a **92. mérés** alapján (`meres/nezetMeres.js`). Programkód nem készült, csak a mérés.

## 1. A rövid válasz

**A kártya a mag változása nélkül megy.** A mai kapu egy új fajta kártyát átenged, és a koinó képe megőrzi a típusát (92. (a)).
Egy új MEZŐT viszont a kép eldob, és a mai szállítás sem visz. Ha tehát a nézet kódja a kártya **szövegében egy csatolt
HTML-fájl**, akkor a mai program mindent hordoz:
- a kapu átengedi, a kép megőrzi;
- a fájl-igény a kódot is elhozza;
- a még nem frissített társak is tárolják és továbbadják.

Költözés nem kell (D118).

**A böngésző el tudja szigetelni — de csak négy réteggel együtt.** A mérés egy „rosszindulatú” nézettel 30 utat próbált ki:
- **a sandbox egymagában kevés:** abból szinte minden kijut (fetch, kép, beacon, WebSocket, stíluslap, munkás, önnavigáció…);
- **a nézet elé tett CSP** minden betöltést lezár, és a nézet nem tudja feloldani;
- **a lap `frame-src` szabálya** megfogja a nézet elnavigálását;
- **egy kis őr-szkript** a WebRTC-t zárja, amit egyik CSP sem fog meg. A Chrome a `webrtc 'block'`-ot nem ismeri.

A négy réteggel a mért utak mind zárva. Kiderült az is, hogy a kulcs a nézethez nem jut el.

⚠️ **Ami nem zárható biztosan:** amit nem ismerünk. Ezért a második védvonal a **hatókör** (NZ2, NZ3). A nézet csak azt
látja, amit abban a koinóban minden tag lát — és a szerzője is tag. Amit kiszivárogtathatna, azt a szerzője amúgy is látja.

## 2. A 92. mérés

**(a) A nézet-kártya a mai programon** — egy koinóban három alakban, ponttal, a mai kapun át (`ujEember` aláírt eseményeivel):
- **saját típus (`Nezet`) + egy `nezet` mező:**
  - a kapu beengedi;
  - a képben a típus megmarad, de a `nezet` mező **elvész**;
  - a fájl-igény semmit nem kér;
  - a mai pakliban `tipus: 'Nezet'`, a lapon az alap-kártya rajzolja (a kártya-gyár ismeretlen típusnál ide esik).
- **gondolat + `nezet` mező:** ugyanígy — a képben egy sima gondolat, a mező elvész.
- **gondolat, a kód a szövegben** (egy fájl-blokk): a kapu beengedi, és a fájl-igény **a kód fájlját kéri** — a mai szállítás viszi.

⭐ Ebből: a saját típus a mag változása nélkül megy, egy új mező viszont csak az eseményben élne. A lapnak minden alkalommal a
létrehozó eseményt kellene olvasnia, a szállításnak új igény-forrás kellene, és a régi társak nem vinnék. A szövegben csatolt
fájlt mindenki viszi.

**(b) Az elszigetelés** — a nézet egy `<iframe sandbox="allow-scripts" srcdoc>` keretben fut, a valódi kapu mögött. A
„külvilág” egy második helyi kiszolgáló (minden kérését naplózza) és egy UDP-kapu (a WebRTC STUN/TURN-je). A lapnak három
változata van: CSP nélkül (mint ma), `frame-src 'none'`, `frame-src 'self'`. Fej nélküli Chrome 156-tal, üres profillal mértem.
A nézet a négy beállítás valamelyikében fut:
- **K0:** csak a sandbox;
- **K1:** a sandbox és a nézet CSP-je (`default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:
  blob:; font-src data:`);
- **K2:** a K1 és a `webrtc 'block'`;
- **K3:** a K1 és az őr-szkript.

A mért eredmények:
- **Már a sandbox (K0) zárja:**
  - a lap címét, DOM-ját és tárát (localStorage, süti, IndexedDB: `SecurityError`); a `referrer` üres, az eredet `null`;
  - a felugró ablakot, a lap elnavigálását és az űrlapot;
  - a kapu `fetch`-ét, a kulccsal is — az eredet nélküli kérést a kapu Origin-őre elveti.
- **⛔ A K0-ból kijut:**
  - fetch, kép, beacon, WebSocket, stíluslap és háttérkép, előtöltés, külső szkript, munkás (worker), beágyazott keret;
  - a `document.write`-tal írt kép, az önnavigáció, a meta refresh, a data: és a blob: dokumentum;
  - ⚠️ és ha a kulcs kiszivárogna, egy **képpel a kapu kiszolgálna** egy olvasó kérést (a kulcs a címben is elfogadott).
- **A nézet CSP-je (K1)** mindezt zárja, a kulcsos képet is. Nem oldható fel: egy második, engedékenyebb CSP-t a böngésző a
  szigorúbbal metszi. A `document.write` és a data:/blob: dokumentum is örökli. Kijut viszont:
  - az **önnavigáció** és a **meta refresh**;
  - a **WebRTC** (10 UDP-csomag).
- **A lap `frame-src 'none'`** (vagy `'self'`) a nézet saját elnavigálását is megfogja (a konzol: *„Framing … violates frame-src”*).
  A srcdoc keret közben ugyanúgy fut — a `'none'` a lap saját kereteit is tiltja; ma a lapon nincs keret.
- **A WebRTC** a K0-ban, a K1-ben és a K2-ben is kimegy — a Chrome a `webrtc 'block'`-ot nem ismeri. **Az őr-szkript (K3)**
  zárja: a nézet kódja előtt fut, és nem konfigurálható tulajdonsággal fedi le az `RTCPeerConnection`-t és társait. Egy friss
  belső kerettel nem kerülhető meg: az a nézetnek idegen eredet (`SecurityError`).
- **src-ből** (a kapu egy lapja a keretben, nem srcdoc) semmi nem fut: a kapu `X-Frame-Options: DENY` fejléce nem engedi.

⛔ **A mérés lelete — egy vak ellenőrzés:** a Claude asztali alkalmazás beépített böngészőjében minden út „zártnak” látszott,
a CSP nélküli is. A keret kérését ott az alkalmazás saját szűrője állítja meg (`net::ERR_BLOCKED_BY_CLIENT`), nem a böngésző
motorja. Csak a beépített **kontroll** mutatta meg: a lapról és egy nem elszigetelt keretből a kérés kijutott. A mérés ezért
fej nélküli Chrome-mal ismételve. A JS-szintű eredmények (`SecurityError`, a `frame-src`, a WebRTC) a két böngészőben
ugyanazok voltak.

## 3. A mai helyzet

**A lap és a kapu** (`js/felulet/kapu.js`):
- csak a hurok-címen fut, öt őrrel (jelszó, Origin, Host, útvonal, JSON-írás);
- a jelszó a lap címében (`?kulcs=`), fejlécben megy tovább, és a böngésző tárába nem kerül;
- a kapu minden válasza `X-Frame-Options: DENY` és `Referrer-Policy: no-referrer` fejlécet kap;
- CSP-je ma nincs, a lapon keret (iframe) nincs;
- a jelszó nélkül elérhető út egyetlen: a fájl (`/api/fajl/<lenyomat>` — a lenyomat maga a jogosultság).

**Az `/api/`** ~55 utat szolgál ki a lapnak. Köztük titkok is vannak: a meghívók, a társak címei, az értesítések, a telepítés,
a profil-adatok. Egy nézet ezek közül egyiket se kapja.

**A kártya-minta (D119):** a koino-verzió kártya egy saját típusú legfelső szintű entitás (`GondolatLetrehozas`,
`tipus: 'KoinoVerzio'`). A mag csak ennél a típusnál őrzi meg a kódot a képben (`allapotSzamitas.js`); a lap a gondolat
kártyájával rajzolja, és a „🧬 Kód” fület teszi rá. Egy új típus ugyanígy jöhet — csak a kódja nem egy új mezőben, hanem a
szövegében (92. (a)).

**A változtatás:** egy entitás címe és szövege szerkesztési egyezménnyel változhat, más nem (`szerkesztesiVegrehajtas.js`).

**A szabályok** a típust a létrehozó eseményből olvassák; egy ismeretlen típus gondolatként viselkedik. Egyesíteni csak
gondolatot és kategóriát lehet, a helyi keresés csak a gondolatokat, a kategóriákat és a gondolattípusokat nézi — mint a
koino-verzió kártyánál.

## 4. A javaslat — a menet

1. **A feltöltés:** a fő menü „🧩 Új nézet…” — egy HTML-fájl, egy cím, egy leírás és a pont (D14: pont nélkül nincs). Ebből egy
   `Nezet` típusú kártya lesz, a szövegében a leírás és a fájl-blokk. Parancssorból: `nezet uj <fájl> "<cím>" [pont=N]`
   (4. szabály). A pontot tevő tárolja a kódot is (D3, D26 — ahogy egy csatolmányt).
2. **A kártya a pakliban:** 🧩 jel; a „Kód” fül a HTML-t olvashatóan mutatja (mint a koino-verzió kártyán); a pont a közösség
   jelzése.
3. **A bekapcsolás a saját készüléken:** „🧩 Bekapcsolom ezen a készüléken”. Előtte egy ablak mondja ki:
   - ki tette fel, és hány pont van rajta;
   - mit lát a nézet: a koinó közös képét (NZ3);
   - mit nem: a kulcsodat nem kapja, írni nem tud, kifelé nem szólhat (a mért utak);
   - és *„egy feltöltött nézet hamis rajzot is adhat — a döntés a lap saját kártyáin van”*.

   A bekapcsolás **koinónként** és **a kód lenyomatához kötve** kerül az adat-mappába (`<adat>/nezetek.json`). Ha egy egyezmény
   új kódot hoz (a szöveg módosítása), a nézet kikapcsol, és a lap megmondja, mi változott.
4. **A futtatás:** a fő menü „🧩 Nézetek…” — a koinó nézet-kártyái pont szerint, a bekapcsoltak elöl. A nézet a pakli helyén fut
   (NZ5), egy felirattal (*„🧩 <cím> — feltöltött nézet: olvas, nem ír”*) és egy bezáró gombbal.
5. **A nézet-felület** — a nézet és a lap közötti beszéd, `postMessage`-en. A lap csak a saját keretének üzenetére felel
   (`e.source`), és csak ezekre a kérdésekre:
   - `koino` — a név és a szabályok;
   - `entitasok` — a közös kép: azonosító, típus, cím, szülő, besorolás, pontok, szerző, idő, a javaslat állapota;
   - `szoveg(azonosító)`;
   - `fajl(lenyomat)` — bájtokban: a nézet `blob:`-ot csinál belőle, mert a CSP csak ezt engedi;
   - `en` — a saját pontjaim (NZ3);
   - `megnyit(azonosító)` — a lap megnyitja a kártyát (NZ6);
   - `valtozas` — a lap szól, ha a csere újat hozott.

   Nincs írás, meghívó, társ, értesítés, telepítés, kulcs. A felület változata számozott (NZ4).
6. **A négy réteg** (a 92. mérés szerint):
   - a keret `sandbox="allow-scripts"` — semmi más engedély, `allow-same-origin` sem;
   - a nézet elé (a srcdoc legelejére) a CSP és az őr-szkript;
   - a lap CSP-je `frame-src 'none'` (a kapu fejléce vagy a lap `<meta>`-ja);
   - a kód a lapé: a lap kéri a fájlt a kaputól, és srcdoc-ként adja a keretnek. A keret semmit nem tölt be.

   ⛔ Az örökölt felület-fájlokhoz (`frontend/js` bájtra) nem kell nyúlni — minden a koinós többletben épül
   (`felulet/js/koinoNezet*.js`).

## 5. A kérdések (⏸️ Csabáé)

- **NZ1 — Hol a nézet kódja, és ki változtathatja?**
  - (A) ⭐ **a saját típusú kártya (`Nezet`) szövegében, egy csatolt HTML-fájlként.** Egy fájl: a szkript és a stílus benne.
    A mag nem változik, a mai szállítás viszi, a még nem frissített társak is. Változni csak szerkesztési egyezménnyel tud
    (a szöveg módosítása), és a bekapcsolás a lenyomathoz kötött, tehát az új kódot mindenki maga kapcsolja be újra.
  - (B) egy külön, változhatatlan `nezet.kod` mező, mint a koino-verzió kártyán (az új változat új kártya). De a mai mag ezt
    a képben nem őrzi meg (92. (a)), a szállítás új igény-forrást kíván, és a régi társak nem viszik.
  - (C) a mag bővítése (a kép is ismerje a mezőt) — költözés, elvetendő.
- **NZ2 — Hol futhat egy nézet?**
  - (A) ⭐ **csak abban a koinóban, ahol a kártyája van.** A szerzője ott tag: amit a nézet lát, azt ő is látja. Egy másik
    koinóban egy másik kártya kell (ugyanaz a fájl feltölthető, és ugyanazzal a lenyomattal jelenik meg).
  - (B) minden koinódban, ahol bekapcsolod. Kényelmesebb, de így egy zárt koinó tartalma egy kívülálló szerző kódja elé
    kerül — egy ismeretlen szivárgási út tétje megnő.
- **NZ3 — Mit lásson a nézet?**
  - (A) ⭐ **a koinó közös képét, és hogy melyik az én kulcsom, a pontjaimmal.** Mint a pakli: a „saját pontod” ma is ott
    van. A pontok alá vannak írva, a kulcsok a közös képben amúgy is látszanak.
  - (B) csak a közös képet — a nézet nem tudja, ki nézi; a „saját pontjaim” nézet nem építhető.
- **NZ4 — Milyen felületen beszéljen a nézet a lappal?**
  - (A) ⭐ **egy külön, kicsi, számozott kérdés-készleten** (a 4. menet 5. pontja). A nézet kimondja, melyik változatot
    beszéli, és a lap a régit egy kimondott dátumig tartja, mint a protokoll (D124).
  - (B) a lap saját `/api/` olvasó útjain, szűrve. Nem kell új felület, de a lap belső útjai (a prototípus alakjai) szabadon
    változnak (R4), és minden változásuk eltörné a nézeteket.
- **NZ5 — Hol jelenjen meg?**
  - (A) ⭐ **a pakli helyén, egész lapon,** a fő menüből, felirattal és bezárással.
  - (B) kártyánként egy fülként (egy nézet egy kártyát mutat — a „Kód” fül mintájára). Később, a nézet-felület egy
    `kartya` kérdésével.
- **NZ6 — Mit tehet a nézet a lapon?**
  - (A) ⭐ **olvas, és „megnyit”:** kérheti, hogy a lap megnyisson egy kártyát. A cselekvés (pont, javaslat, szavazat) a lap
    saját ablakában marad, a te kezeddel — így egy térkép-szerű nézetből is lehet dolgozni.
  - (B) csak olvas (a nézet egy kép, nem navigátor).
  - (C) cselekvés megerősítéssel — a PR4 (C), később.

## 6. Amit ez nem old meg (kimondott határok)

- **Amit nem ismerünk.** A mérés 30 utat nézett; egy ismeretlen szivárgási utat a négy réteg nem garantáltan zár. A második
  védvonal a hatókör (NZ2) és a közös kép (NZ3) — amit a nézet kiszivárogtathatna, azt a szerzője tagként amúgy is látja.
  Ami ezen túl kimehetne: hogy (és mikor) használod a nézetét. A DNS-előtöltést a mérés nem nézte.
- **A böngészőket.** A mérés Chrome 156-é (Windows, fej nélkül). A telefon Chrome-ja a terepen próbálandó; a Firefox és a
  Safari nem mérve. A `webrtc 'block'` CSP-t a Chrome nem ismeri — ezért az őr-szkript.
- **A rajz igazságát.** A nézet hamis számokat is mutathat (egy javaslatot nyertesnek rajzolhat). Ez ellen a felirat véd
  (*„feltöltött nézet”*), és hogy a döntés a lap saját kártyáin van — a lenyomat itt is csak azt bizonyítja, hogy ez az a kód
  (mint a PR5-nél).
- **A teljesítményt.** Egy nagy koinó képe `postMessage`-en — nem mérve; az építéskor mérendő.
- **A parancssort.** A nézet egy rajzoló (7. szabály: a böngésző cserélhető rajzoló). A parancssor a feltöltést, a „Kód”-ot és
  a be/kikapcsolást tudja, a rajzot nem.

## 7. Az építés sorrendje (ha a kérdések eldőlnek)

① **a kártya:** a feltöltés, a „Kód” fül, a `nezet` parancs → ② **a keret és a négy réteg** (a lap CSP-je, a sandbox, a nézet
CSP-je és az őr), és **a nézet-felület 1** → ③ **a bekapcsolás** (`nezetek.json`, a lenyomat, koinónként) és a fő menü →
④ **a próbák:** a 92. mérés (b) részéből önpróba, fej nélküli Chrome-mal. Ha nincs Chrome a gépen, kimarad — mint a `sh`-t
kívánó próbák. → ⑤ **terepi próba** (a telefon böngészője).

## 8. Az építés (D126, 2026-11-08)

**A kártya:** egy `Nezet` típusú legfelső szintű entitás (`muveletek.js` `nezetLetrehozasa`); a szövege a leírás és a kód fájl-blokkja
(`nezetKartya.js` `nezetSzovegBlokkjai`). A kód a szöveg ELSŐ fájl-blokkja (`nezetKodja`) — így egy egyezmény, ami a szöveget módosítja,
a kódot is cserélheti. A törzs mérete (D120) a kódot is mondja, a tárolási vállalás (D26) is.

**A bekapcsolás:** `<adat>/nezetek.json` — koinónként (NZ2), kártyánként a kód lenyomatával (NZ1); legfeljebb 64 nézet egy koinóban, 256
koinó. Az állás: `be` (a mostani kód az, amit bekapcsoltál), `valtozott` (más a kódja — kikapcsolva, újra meg kell nézni), `ki`. A lap a
lenyomatot, amit az e-ember látott, maga küldi (ha közben más kód jött, nem kapcsol be).

**A futtatás:** a lap a programtól kéri a keret tartalmát (`/api/nezet/keret` — csak bekapcsolva, ugyanazzal a kóddal): a nézet CSP-je és az
őr a legelején, a kliens (`koinoNezet`), a kód (`nezetFelulet.js` `nezetKeretTartalma`). A keret `sandbox="allow-scripts"`, a pakli helyén;
a lap CSP-je `frame-src 'none'` (a kapu minden válaszán).

**A nézet-felület 1:** a nézetben `koinoNezet.kerdez(kérdés, adat)` és `koinoNezet.figyel('valtozas', fv)`. A kérdések:
- `koino` → a név, a szabályok, a felület száma, és a nézet saját kártyája;
- `en` → az én kulcsom;
- `entitasok` `{ kurzor?, darab ≤ 100, rendezes?, irany? }` → egy oldal a közös képből (`kovetkezo` kurzorral), mezőnként kimondva
  (azonosító, típus, cím, szülő, besorolás, pontok, a saját pontom, szerző, idő, a javaslat állása);
- `szoveg` `{ azonosito }` → a szöveg (blokkok vagy sima szöveg);
- `fajl` `{ lenyomat }` → a bájtok (`ArrayBuffer`) — a nézet `blob:`-ot vagy `data:`-t csinál belőle (mindkettő mérve a valódi lapon);
- `megnyit` `{ azonosito }` → a lap a pakliban megnyitja a kártyát, és egy gomb visz vissza a nézethez.

A lap csak a saját keretének üzenetére felel, egyszerre legfeljebb 4 kérdés lehet úton.

**A mérés a valódi lapon** (`meres/nezetProba.js`, fej nélküli Chrome): a kontroll (a lapról egy kérés, egy kép és a WebRTC UDP-je)
kijut; a nézetből a 92. mérés útjai (a fetch, a kép, a beacon, a WebSocket, a stílus, az előtöltés, a szkript, a munkás, a keret, a
felugró, az űrlap, a CSP-feloldás, a WebRTC — a friss belső keretével is —, az önnavigáció, a meta refresh, a data:/blob: dokumentum, a
`document.write`, a lap elnavigálása) semmit nem juttatnak ki; a lap címe, DOM-ja és tára `SecurityError`; a kulcs se a keret tartalmában,
se a nézet dokumentumában nincs.

⛔ **Az építés lelete:**
- a Chrome a sandbox-keretet KÜLÖN FOLYAMATBA teszi — a próba csak a keret saját DevTools-munkamenetén éri el (`Target.setAutoAttach`);
- egy második, „engedékeny” CSP (`default-src *`) a `data:` és a `blob:` képet is TILTJA: a böngésző a két szabályt metszi, és a `*` ezeket
  nem fedi — a nézet feloldási kísérlete tehát csak szigorít. (A próbában ez a képek után fut, egy friss keretben.)

*Kapcsolódik:* `program_retegek_atvizsgalas.md` (D123, PR4), `csaladi_orjarat_atvizsgalas.md` (D119 — a koino-verzió kártya),
`kartya_telepites_atvizsgalas.md` (D125 — a „Kód” fül, a lenyomat határa), `felulet_terv.md` (a 7. szabály), `js/felulet/kapu.js`
(az öt őr), `meres/eredmenyek.md` 92.
