# ET-6 — A sürgősségi út: a vészfék (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** ✅ **eldöntve** (Csaba, 2026-11-09: *„rendben, minden javaslatodat elfogadom.”* — ET-6/2 – ET-6/7 mind (A)) · az átadás:
> 9. szakasz. *(Az ET-6/1 — az elismerés egyelőre nem kell — 2026-11-08-án
> eldőlt.)*
>
> Csaba (2026-11-08): *„ezt nem vetem el teljesen, de azért még kutassunk tovább … egyéb megoldások után is, ami nem igényel választott
> bizottságot, hanem inkább, egy randomizált, replikált, és titkosított automatikus folyamatot.”*

## 1. A rövid válasz

**Az eredeti ötlet** (**N9 — elismerés-entitás + kinevezési (őr) rendszer**, 2026-07-16, még a központi szerver idején): ha baj van, a
közösség által kinevezett *„őrök”* gyorsan léphetnek, időkorlátos megbízással, nyilvánosan, utólagos jóváhagyással.

**Azóta három dolog megváltozott:**
- **a kulcs-helyreállításhoz nem kell bizottság** — az ET-3 megoldotta a te kérésed szerint: a csere-kulcs darabjait véletlen tagok gépei
  őrzik titkosítva, és automatikusan adják vissza (ET-3/1);
- **a programhibát nem lehet „gyorsan kijavítani” mindenkinél** — a javítás egy új verzió, és mindenki maga dönt a költözésről (**D66 —
  a megújulás = költözés, nem frissítés**); nincs, aki egy javítást rátolna a koinóra;
- **van már egy véletlen kör, amit senki nem választ** — a napi kör (ET-8/2, ET-8/4).

⭐ **Ezért a javaslat: őrök helyett egy vészfék.** Ha valami most romlik el, azt **ideiglenesen meg lehet állítani**, amíg a rendes
döntés utoléri. **Nincs választás és nincs állandó hatalom:**
- a féket a **napi kör** húzza meg — egy véletlen, minden nap más csoport, akit senki nem választ;
- a fék **csak megállít**: pénzt nem mozgat, nem töröl, szabályt nem módosít, senkit nem zár ki, és verziót sem ajánl;
- **legfeljebb 72 óráig** tart, utána a rendes döntés folytatja, vagy magától feloldódik.

*Tanú, nem hatóság* (N9) — a fék szava önmagában semmit nem dönt el véglegesen.

## 2. Mi lehet vészhelyzet — és mire van már válasz

- **Ellopott vagy elveszett kulcs** → az ET-3: a készülék kizárása, a csere-kulcs. *Nincs teendő.*
- **A hálózat elárasztása** → a **D109 — a kiszolgálási keret**: minden készülék maga védekezik. *Nincs teendő.*
- **Egy rossz tartalom** (pl. valaki más lakcíme, fenyegetés) → a rendes törlési javaslat lehet gyors (a **bizonyossági mutató**: nagy
  részvételnél a legrövidebb döntési időn zárul) — **de közben terjed**. ⚠️ Ehhez kell a fék.
- **Egy súlyos programhiba** (pl. a pénz hamisítható) → a javítás egy új verzió (D66) — **de amíg mindenki átköltözik, a hibát ki lehet
  használni**. ⚠️ Ehhez kell a fék.
- **Egy pénz elleni támadás** (pl. egy sikeres kettős költés) → a tanúk bizonyítékot adnak (ET-8) — **de a kár közben nő**. ⚠️ Ehhez kell
  a fék.

## 3. Mit lehet megállítani — zárt lista

A **D19 — a rendszer BEJELENTŐ, nem BÍRÓ** első korlátja szerint csak meghatározott esetek válthatják ki, különben a napirendet el
lehetne árasztani. Három fék:

1. **💰 A pénz:** a tanúk új átutalást nem nyugtáznak (ET-8). A már végleges átutalások maradnak. Az osztalék jóváírása megy tovább, mert
   azt mindenki gépe magának számolja.
2. **📄 Egy entitás törzse:** a szöveg, a képek és a fájlok — a gépek nem adják tovább, a lap nem mutatja. A *csontváz* marad: a pontok,
   a javaslatok, a szavazás (**D72 — a szeletelés: ki mit tart, és a szöveg külön darab** — a törzs külön darab, ezért ez lehetséges).
   Így a törlési javaslat lefuthat, miközben a tartalom nem terjed.
3. **📢 A riasztás:** egy rövid szöveg a koinó minden lapján (*„A mostani verzióban súlyos hiba van — ne utalj, amíg…”*). ⚠️ **Verziót
   nem ajánlhat** — különben a riasztás a legjobb csali lenne (*„költözz ide most!”*). A javítást a rendes úton találja meg mindenki (a
   koino-verzió kártyák, a mag eltérésének figyelmeztetése — **D123 — a program rétegei: „a számítás köt, a többi szabad”**).

## 4. Ki húzhatja meg

1. **Jelezni bármely 2. lépcsős tag tud:** megadja, melyik fékről van szó, a tárgyát (pl. az entitást), az indoklást, és ha van, a
   bizonyítékot. Személyenként **hetente egyszer** — a napirend elárasztása ellen.
2. **A napi kör dönt:** az a véletlen kör, ami aznap az osztalék számait is aláírja (ET-8/2 — pl. 64 2. lépcsős tag a DHT-n, akiket senki
   nem választ, ET-8/4). A gépük értesíti őket (**D103 — a levél helyett a készülék saját értesítése**).
   - **A fék akkor lép életbe**, ha **12 órán belül a kör fele igent mond.** Egy hamisan meghúzott fék legfeljebb 72 óra kellemetlenség,
     ezért elég a fele; a csalók aránya egy véletlen 64-es körben a fél közelébe sem jut.
   - **Kis koinóban** (kevesebb 2. lépcsős tag, mint a kör) a kör az egész közösség — mint az ET-8-ban.
3. **A kör szavazata titkos**, önkéntes nyíltsággal — ugyanúgy, mint minden szavazás (ET-2). Csak az igenek száma látszik, így a kör
   tagjait nem lehet megfélemlíteni. *(Ez a te „titkosított” szavad itt.)*

**Miért a napi kör, és miért nem jelzésenként új sorsolás?** Ha a kör a jelzésből születne (pl. a jelzés lenyomatához legközelebbiek), a
jelző addig írhatná át a jelzését, amíg neki kedvező kört nem kap. A napi kört senki nem tudja elmozdítani.

## 5. Meddig, és mi utána

- **Legfeljebb 72 óra.** Ez egy hétvégét is átível, és elég a rendes döntésnek, ha sokan részt vesznek.
- **Minden fékhez a program egy gondolatot nyit** (a D19 szerint): felismerhető (a rendszer hozta), gazdát kap (a jelző és az érintett),
  és határideje van. **Ott dönt a közösség rendes javaslattal:** meghosszabbítja, vagy feloldja.
- **Ha 72 óra alatt nem dönt, a fék magától feloldódik.**
  - ⚠️ A D19 negyedik korlátja pénznél a fagyasztást hagyja meg alapnak, de az elve ugyanaz: *„a nem-döntés nem lehet a támadó
    nyeresége”*.
  - Itt a támadó nyeresége épp a fagyasztás volna (egy hamis riasztással megbénítani a koinó pénzét), ezért itt az alap a feloldás.
- **Ugyanarra a tárgyra** a 72 óra után új féket csak a rendes döntés húzhat — a fékek nem fűzhetők egymás után a végtelenig.

## 6. Az automatikus fék — ahol a gép maga látja a bajt

A legtöbb vészhelyzetben ember kell, aki megítéli. **Egy esetben nem:** ha a program **gépileg ellenőrizhető bizonyítékot** talál arra,
hogy a pénz szabálya megtört. Ilyen bizonyíték:
- két egymásnak ellentmondó átutalás, mindegyik a saját 22 nyugtájával — vagyis egy sikeres kettős költés;
- a napi kör két egymásnak ellentmondó, aláírt száma.

Ilyenkor ⭐ **a pénz-fék magától, testület nélkül életbe lép 72 órára**, és nyílik a D19-gondolat. **Hamis riasztás itt nem lehet:** a
bizonyítékot nem lehet hamisítani, és ha valaki szándékosan előállítja, akkor épp a baj történt meg. *Ez a te „automatikus” szavad itt.*

## 7. A kérdések (⏸️ Csabáé)

- **ET-6/2 — Kell-e, és milyen alakban:** (A) ⭐ csak vészfék (megállítás, legfeljebb 72 óra), a „tanú, nem hatóság” határral; (B) a régi
  N9-alak: kinevezett őrök időkorlátos megbízással; (C) semmi — a rendes döntés elég (a bizonyossági mutató gyorsít, ha sokan vesznek
  részt).
- **ET-6/3 — Mit lehet megállítani:** (A) ⭐ a pénzt (az új átutalások nyugtázását), egy entitás törzsét (nem adják tovább, a lap nem
  mutatja), és a riasztást (verziót nem ajánlhat); (B) csak a pénzt.
- **ET-6/4 — Ki dönt:** (A) ⭐ a napi kör (ET-8), a fele igenjével 12 órán belül; jelezni bármely 2. lépcsős tag tud, hetente egyszer;
  (B) jelzésenként új sorsolás (a jelző befolyásolhatja); (C) az egész koinó szavaz (lassú — épp ez a baj).
- **ET-6/5 — A kör szavazata:** (A) ⭐ titkos, önkéntes nyíltsággal (az ET-2 szerint), csak az igenek száma látszik; (B) nyilvános (a
  felelősség miatt).
- **ET-6/6 — Meddig és mi utána:** (A) ⭐ legfeljebb 72 óra; a program D19-gondolatot nyit, ott a rendes döntés meghosszabbíthatja vagy
  feloldhatja; ha nem dönt, a fék magától feloldódik; ugyanarra a tárgyra újra csak a rendes döntés húzhatja; (B) a fék a rendes döntésig
  marad (egy hamis riasztás így végtelen fagyasztás lehet).
- **ET-6/7 — Az automatikus fék:** (A) ⭐ igen — gépileg ellenőrizhető bizonyítéknál (sikeres kettős költés, a napi kör ellentmondó
  számai) a pénz-fék testület nélkül életbe lép 72 órára; (B) nem, mindig a kör dönt.

## 8. Az építés

A fék **a mag része**, mert azt változtatja, mit nyugtáznak a tanúk és mit mutat a koinó képe (D123), ezért költözéssel jár (D66). A napi
körre épül (ET-8), ezért **a pénzzel együtt** épül, az ET-8 után. Amíg nincs pénz, a legsúlyosabb vészhelyzet (a pénz) még nem létezik. A
D-számot az építő adja.

## 9. A döntések és az átadás (Csaba, 2026-11-09)

**ET-6/2** őrök helyett vészfék: csak megállít, legfeljebb 72 órára, *„tanú, nem hatóság”* · **ET-6/3** zárt lista: a pénz (az új
átutalások nyugtázása), egy entitás törzse (nem adják tovább, a lap nem mutatja — a csontváz marad), a riasztás (verziót nem ajánlhat) ·
**ET-6/4** a napi kör dönt (ET-8), a fele igenjével 12 órán belül; jelezni bármely 2. lépcsős tag tud, hetente egyszer; kis koinóban a kör
az egész közösség · **ET-6/5** a kör szavazata titkos, önkéntes nyíltsággal (ET-2), csak az igenek száma látszik · **ET-6/6** legfeljebb
72 óra; a program D19-gondolatot nyit, ott a rendes döntés meghosszabbíthatja vagy feloldhatja; döntés nélkül magától feloldódik;
ugyanarra a tárgyra újra csak a rendes döntés húzhatja · **ET-6/7** gépileg ellenőrizhető bizonyítéknál (sikeres kettős költés, a napi kör
ellentmondó számai) a pénz-fék testület nélkül, 72 órára.

**A közös dokumentumokba (az építőnek):**
- az **N9 — elismerés-entitás + kinevezési (őr) rendszer** lezárul: az elismerés egyelőre nem kell (ET-6/1); a kulcs-helyreállító
  bizottság helyett a véletlen, titkosított darabőrzés (ET-3/1); a kinevezett őrök helyett a vészfék (ET-6);
- a **D19 — a rendszer BEJELENTŐ, nem BÍRÓ** zárt listája bővül a vészfékkel; a negyedik korlát (az alapértelmezett kimenet) a fékre
  feloldás — az elve szerint (*„a nem-döntés nem lehet a támadó nyeresége”*).

**Az építés:** a mag része (költözés — D66), a napi körre épül, ezért a pénzzel együtt, az ET-8 után. A D-számot az építő adja.

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-6/2 – ET-6/7 Csabánál.
- **2026-11-09** — ✅ ET-6/2 – ET-6/7 mind (A) (9. szakasz).
