# ET-1 — Az általános javaslat és egyezmény (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** ✅ **eldöntve** (Csaba, 2026-11-09) — ET-1/1 – ET-1/4 (A), ET-1/5 és ET-1/6 Csaba felvetése szerint (7. szakasz) · ⏭️
> átadható az építőnek (8. szakasz).
>
> Csaba (2026-11-08), a kiinduló kép „az általános javaslat a közösség álláspontja; az egyezményéhez csatlakozni, tiltakozni, ütközést
> jelölni lehet” sorára: *„ez még nincsen rendesen megtervezve, ugye? ezt a tervről beszéljünk majd.”*

## 1. A rövid válasz

**Igen, nincs rendesen megtervezve — a terve háromszor fordult, és a vége ellentmondásos:**
1. **D27 — szerkesztési és általános javaslat/egyezmény** (2026-08-27): az általános egyezmény élő (csatlakozás, tiltakozás,
   ütközés), a hatóköre lefelé terjed (a gyökérben mindenki).
2. **D64 — az alkotmány** (2026-09-10): az általános ág helyére egy külön entitás, 2/3-os küszöbbel, a passzívakkal együtt, döntési idő
   nélkül, élő állapotként.
3. **D66 — a megújulás = költözés, nem frissítés** (2026-09-12): *„nem kell alkotmány, nem kell 2/3-adot előidéző rendszer … maradunk a
   prototípus szerinti funkcióknál.”* — az alkotmány elvetve; hogy a D27 általános ága ettől visszaállt-e, azt senki nem mondta ki.

**A kódban** a D27 szerinti változat él, csak a parancssorból (`altalanos`, `allast`); a lapon nincs útja.

⭐ **A javaslatom — a már eldöntöttekből összerakva:** az általános javaslat ugyanazzal a gépezettel dől el, mint a szerkesztési
(küszöbök, tartózkodás, bizonyosság, döntési idő — és ET-2 óta titkos szavazással). Az elfogadás egy **tény**: az egyezmény
megszületett. Utána az egyezmény **él**: a szavazatok a döntés után is változtathatók, és a lap mindig mutatja, mekkora a **mostani**
támogatottsága (támogat · ellenez · néma). Automatikus következmény nincs — *„csak látható lesz, hogy megfordult a közhangulat, és a
következtetést az emberek vonják le”* (Csaba, D27/6). Szavazni a szülő gondolat pont-tulajdonosai szavazhatnak, mint a szerkesztésinél.

## 2. A mai kód (`javaslatSzamitas.js`, `szabalyok.js`, `muveletek.js`)

- **Az általános javaslat** egy `Javaslat` esemény `fajta: 'altalanos'` jellel, egy helyen (egy entitáson) álló „álláspont” művelettel.
  Ugyanaz a szavazás és lezárás dönti el, mint a szerkesztésit; elfogadáskor semmi nem hajtódik végre — az egyezmény maga az álláspont.
- **Az élő hatály:** egy külön esemény (`Allasfoglalas`: csatlakozik · tiltakozik · ütközik), emberenként az utolsó számít. A lap
  (ha lenne útja) felsorolná, kik csatlakoztak és kik tiltakoznak — **nyilvánosan, név szerint**.
- **A hatókör:** állást az foglalhat, akinek pontja van az egyezmény helyén vagy annak bármely leszármazottján (D27/4 — a hierarchikus
  tudatpont itt jogosultság).
- ⚠️ **Két ütközés a már eldöntöttekkel:**
  - a név szerinti csatlakozás és tiltakozás **nyílt szavazás** — ez ütközik az **ET-2/1-gyel** (titkos szavazás, önkéntes
    nyíltsággal);
  - a lefelé terjedő hatókör részvételi nevezője (a gyökérben: a koinó minden tagja) **nem számolható helyben** egy nagy koinóban —
    ütközik a 9. szabállyal (egy készülék terhe nem nőhet a koinóval).

## 3. Mit kell tudnia

1. **A közösség álláspontja** legyen kimondható: *„fogadjuk el ezt az elvet”*, *„szervezzünk találkozót”*, *„a parkot ne építsék be”*.
2. **A tény és a hatály külön** (**D8 — egyezmény: tény ↔ hatály szétválasztása**): hogy megszületett, az marad; hogy ma mennyien
   állnak mögötte, az élő.
3. **Az új tagok** csatlakozhassanak egy régi egyezményhez újraszavazás nélkül (a D27 „bootstrap” érve: egy tízfős közösség döntése ne
   maradjon „tíz ember döntése” ezer emberen).
4. **Nincs automatikus következmény** (**D19 — a rendszer bejelentő, nem bíró**).
5. **Titkos szavazás** (ET-2), és **helyben számolható kör** (9. szabály).
6. **Nincs új gépezet**, ha nem muszáj (D66: *„mind sok új élt hoznak létre”*).

## 4. A javasolt alak

**A születés — ugyanaz, mint a szerkesztési javaslatnál:**
- egy gondolat alatt áll (vagy legfelül — akkor a saját pont-tulajdonosai szavaznak);
- szavazni az szavazhat, akinek pontja van a szülő gondolaton és magán a javaslaton (**D85 — a javaslat és az egyezmény ugyanolyan
  entitás, mint a gondolat**);
- a küszöbök a tulajdonosok mediánja (**D4**), a tartózkodás az ET-2/6 szerint, a lezárás a bizonyossági mutatóval;
- ha elfogadják: **az egyezmény megszületett** (a tény, a lezárás pillanatával).

**Az élet — a döntés után:**
- **a szavazatok tovább változtathatók**, határidő nélkül; aki most kerül a körbe (pontot tesz a szülőre), most szavazhat. A csatlakozás
  és a tiltakozás így egyszerűen **egy szavazat a meglévő egyezményre** (titkosan, mint minden szavazat);
- a lap **a mostani támogatottságot** mutatja, három számmal: **támogat · ellenez · néma** (aki a körben van, de nem szavazott — a D64
  megjelenítési követelménye, *„a puszta státusz elhallgatná a különbséget aközött, amit elutasítottak, és amiről nem szóltak”*), a
  születéskori mellett;
- a titkos szavazás kötegei (ET-2/4) itt is érvényesek: a mostani összeg *m* új szavazatonként nyílik ki;
- **önkéntes nyíltság:** aki akarja, nyilvánosan kimondhatja (*„csatlakozom”*) — ez nem számít bele, csak tájékoztat; így senki nem
  ellenőrizheti, hogyan szavazott valaki (a megvett szavazat ellen — ET-2).

**A viszonyok:**
- **az ütközés:** bárki megjelölheti, hogy két egyezmény ellentmond egymásnak (egy nyilvános, aláírt állítás) — csak láthatóvá teszi,
  nem old fel semmit (D19);
- **teljes értékű entitás** (D27/5): módosítható, áthelyezhető, törölhető (szerkesztési javaslattal), és lehetnek gyerekei (ahol
  megvitatják). Az áthelyezésnél a szavazatok átjönnek, de csak azok számítanak, akik az új szülőn is tulajdonosok (Csaba, D64/4: *„a jó
  elv az jó elv, mindenhol”*).

**Az elfogyás:** ha senki nem tart rajta pontot, az egyezmény elfelejtődik (**D14 — a tartós mag = a csalás-elleni csontváz**) — nem
kell „hatályon kívül helyezni”.

*Példa: a „Park” gondolat alatt 12-en tartanak pontot. Anna javasolja: „A park keleti részét hagyjuk vadon.” 7 igen, 2 nem, 1
tartózkodik → elfogadva, az egyezmény megszületett (a tény: október 3.). Fél év múlva már 40-en tartanak pontot a „Park”-on; közülük
25-en szavaztak az egyezményre (a régiek szavazata megmaradt, az újak csatlakoztak vagy tiltakoztak). A lap: „megszületett október 3-án
78%-kal · ma: 18 támogat, 7 ellenez, 15 néma”. Ha a többség megfordul, a lap ezt mutatja — a következtetést az emberek vonják le, pl.
egy módosító vagy törlő javaslattal.*

## 5. Ami ebből változik (az építőnek)

- **A számítás** (a mag — `javaslatSzamitas.js`): az elfogadott általános javaslat szavazatai a lezárás után is számítanak, a „mostani
  állás” számolódik (a tény változatlan); az `Allasfoglalas` csatlakozik/tiltakozik ága megszűnik (helyette szavazat), az ütközik ága
  marad; a hatókör a szülő saját tulajdonosai (a D27/4 lefelé terjedő köre helyett).
- **A lap:** az általános javaslat létrehozása (ma csak parancsból), a kártyán a három szám, az ütközés-jelölés és az önkéntes nyilvános
  kiállás.
- ⚠️ **A mag változása** — az ET-2-vel (titkos szavazás) és az ET-3-mal (a kulcs) együtt, egy költözésben, **az első szélesebb körben
  terjesztett koinó előtt**.

## 6. A kérdések (⏸️ Csabáé)

- **ET-1/1 — Kell-e általános javaslat az első koinóban?** (A) ⭐ igen, a 4. szakasz alakjában — a hely megvan (a kódban is), és a
  szerkezete a magot érinti, tehát most érdemes eldönteni; (B) nem, csak a szerkesztési (a D66 „prototípus szerinti funkciók”
  olvasata) — később egy új koinó-verzió hozhatja.
- **ET-1/2 — Mi az általános egyezmény?** (A) ⭐ egy döntés (a szerkesztési gépezettel) — utána élő hatály: a szavazatok változhatnak, a
  lap a mostani támogatottságot mutatja; (B) csak élő állapot, döntési idő nélkül (a D64 alakja, 2/3 nélkül: az egyezmény az, aminek
  MOST megvan a küszöbe) — nincs „megszületett” tény; (C) csak egyszeri döntés, élő hatály nélkül.
- **ET-1/3 — Kik szavazhatnak?** (A) ⭐ a szülő gondolat pont-tulajdonosai (mint a szerkesztésinél — helyben számolható); (B) a szülő és
  minden leszármazottja (D27/4 — a gyökérben a koinó minden tagja) — a részvétel nevezője egy nagy koinóban nem számolható helyben
  (9. szabály).
- **ET-1/4 — A csatlakozás és a tiltakozás:** (A) ⭐ titkos szavazat a meglévő egyezményre; a nyilvános „csatlakozom” önkéntes, és nem
  számít bele (ET-2/1); (B) nyilvános, név szerinti állásfoglalás, ami számít (a mai kód) — ez nyílt szavazás lenne.
- **ET-1/5 — Az ütközés-jelölés:** (A) ⭐ marad — bárki megjelölheti, hogy két egyezmény ellentmond egymásnak; csak látható (D19); (B)
  kivesszük.
- **ET-1/6 — Ha a mostani támogatottság a küszöb alá esik:** (A) ⭐ csak a számok látszanak (a születéskori és a mostani), címke nélkül
  — *„a következtetést az emberek vonják le”* (Csaba, D27/6); (B) egy számított címke: „hatályos” / „hatályát vesztette” (a tény
  marad, a címke csak bejelent).

## 7. Csaba két felvetése (2026-11-09)

### 7.1 Az ütközés-jelölés helyett egy gondolat (ET-1/5)

Csaba: *„lehet, hogy kivehetnénk, mert nem biztos, hogy van fontos szerepe, mert bárki létrehozhat, mondjuk egy olyan gondolattípust,
aminek az a neve, hogy egyezmények ütközése, majd létrehoz egy gondolatot, ezzel a típussal, amiben entitás-hivatkozással megjelöli az
egyezményt, amivel szerinte ütközik. mielőtt kivesszük, mondd el a véleményedet.”*

**A vélemény: egyetértek — vegyük ki.** A gondolat a jobb eszköz, és többet tud, mint a külön jelölés:
- **ugyanaz a gépezet, nem új él** (D66): gondolat, gondolattípus, entitás-hivatkozás — mind megvan;
- **a jelölés maga is súlyt kap:** pontot lehet rá tenni (mennyien gondolják így), vitatható (gyerekei lehetnek), és ha senkit nem érdekel,
  elfelejtődik (D14) — a külön jelölés csak egy név volt egy listán;
- **a mag kisebb lesz:** az `Allasfoglalas` esemény teljesen megszűnhet (a csatlakozás és a tiltakozás az ET-1/4 óta szavazat).

**Egy dologra érdemes figyelni — a láthatóság:** a külön jelölés az egyezmény saját szeletébe került, ezért az egyezmény kártyája
mutatta volna. Egy gondolat szövegében álló hivatkozást viszont a hivatkozott egyezmény nem „tud”: a koinóban nincs visszafelé mutató
kérdés („ki hivatkozik rám?” — ez a kereső-réteg kérdése). ⭐ **A megoldás a gépezeten belül:** az ütközés-gondolat az egyik egyezmény
**gyereke** legyen (D27/5: *„az egyezménynek is lehetnek gyerekei, ahol az e-emberek megvitatják a témát”*) — így annak a fájában
látszik —, és a másikra hivatkozással mutasson. Ha mindkét oldalon látszania kell, két gondolat (mindkét egyezmény alatt egy).

### 7.2 A címke helyett az állás egy adott napon (ET-1/6)

Csaba: *„ha a címke tényleg ütközik a skálázhatósággal, vagy nagyon drága, akkor nem kell címke. viszont nekem eszembe jutott egy
olyan, hogy alap esetben nincsen címkéje, de felderítéssel »screenshotolhatja« az akkori állást, amit megoszthat másokkal, hogy ebben a
dátumban ez volt az állás, és arra a dátumra kaphat címkét. erről mi a véleményed?”*

**Előbb a kérdésre:** a címke **nem drága és nem ütközik a skálázással** — az ET-1/3 óta a kör a szülő saját tulajdonosai (egy szelet),
a mostani állás helyben számolható, a címke egy összehasonlítás (a mostani támogatottság a küszöbhöz). Az ellene szóló ok nem a költség
volt, hanem a jelentés: *„a következtetést az emberek vonják le”* (D27/6).

**A felvetésről: jó ötlet — egy pontosítással.** A koinóban az állás nem egy kép, hanem **számítás** (D17): ugyanabból az eseményhalmazból
bárki ugyanazt kapja, egy múltbeli időpontra is (a szavazatoknak ideje van, a titkos szavazás kötegei aláírt események). Ezért a
„képernyőkép” helyett egy **hivatkozás** a jobb: *„az egyezmény állása 2027. március 1-jén”* — aki megkapja, a saját gépén kiszámolja, és
ugyanazt látja. ⭐ Így **nem lehet meghamisítani** (egy kép hamisítható, egy számítás nem), nem kell tárolni, és nem kell senkiben
megbízni.
- **Alap esetben:** a mostani számok címke nélkül (támogat · ellenez · néma).
- **Egy időpontra** (a kártyán: „📷 Az állás egy adott napon…”): a számok az akkori állás szerint, **és a címke arra a napra** —
  *„2027. március 1-jén: a küszöb felett (64% ≥ 51%)”*. Ez tény egy múltbeli pillanatról, nem ítélet a mostaniról (D19).
- **A megosztás:** a hivatkozás (az egyezmény és a dátum) bemásolható egy gondolatba vagy elküldhető — a másik gépe kiszámolja.
- ⚠️ **Ami kell hozzá:** a gépnek meglegyenek az akkori szavazatok (ha a szeletet nem tartja, a kérelem hozza — D76); a titkos szavazásnál az
  akkori állás az akkor utoljára kinyílt köteg (ET-2/4).

## 8. Az átadás (az építőnek)

**A döntések** (Csaba, 2026-11-09):
- **ET-1/1** — az első szélesebb körben terjesztett koinóban van általános javaslat, a 4. szakasz alakjában;
- **ET-1/2** — egy döntés a szerkesztési gépezettel (titkos szavazással), az elfogadás tény; utána élő hatály: a szavazatok
  változhatnak, a lap a mostani támogatottságot mutatja (támogat · ellenez · néma);
- **ET-1/3** — szavazni a szülő gondolat pont-tulajdonosai szavazhatnak (helyben számolható);
- **ET-1/4** — a csatlakozás és a tiltakozás titkos szavazat; a nyilvános kiállás önkéntes, és nem számít bele;
- **ET-1/5** — ✅ *„rendben, így jó lesz.”* — **nincs külön ütközés-jelölés**: az ütközést egy gondolat mondja ki (ha kell, egy saját
  gondolattípussal), az egyik egyezmény **gyerekeként**, a másikra entitás-hivatkozással; az `Allasfoglalas` esemény megszűnik;
- **ET-1/6** — ✅ **alap esetben nincs címke** (a mostani számok látszanak); **egy adott napra** az állás újraszámolható
  hivatkozásként kérhető és megosztható (az egyezmény és a dátum), és arra a napra címkét kap (*„2027. március 1-jén: a küszöb
  felett”*).

**A következő építési lépés:** egy átvizsgálás (a mai `Allaspont` és `Allasfoglalas` kivezetése, a lezárás utáni szavazatok és a
„mostani állás” a számításban, a múltbeli időpont állása a titkos szavazás kötegeivel, a lap: az általános javaslat létrehozása, a három
szám, az „📷 Az állás egy adott napon…”). ⚠️ A mag változása — az ET-2-vel és az ET-3-mal **egy költözésben**, az első szélesebb körben
terjesztett koinó előtt. A D-számot az építő adja.

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-1/1 – ET-1/6 Csabánál.
- **2026-11-09** — ✅ ET-1/1 – ET-1/4 (A). Csaba két felvetése: az ütközés-jelölés helyett egy gondolat (a vélemény: egyetértek, az
  egyik egyezmény gyerekeként), és a címke helyett az állás egy adott napon (a vélemény: jó, de hivatkozásként, nem képként — 7.).
- **2026-11-09** — ✅ Csaba: *„rendben, így jó lesz.”* — ET-1/5 és ET-1/6 a 7. szakasz szerint; az ET-1 eldöntve, átadható (8.).
