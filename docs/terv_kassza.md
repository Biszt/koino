# ET-9 — Közös kasszák: projektre, a koinó-családnak, helyek szerint (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** ✅ **eldöntve** (Csaba, 2026-11-09: *„rendben, elfogadom a javaslataidat”* — ET-9/1 – ET-9/6 mind (A)) · az építés a
> pénzzel együtt, az ET-8 után (9. szakasz).
>
> Csaba (2026-11-09): *„beszéljük át, hogy létrehozhatók-e közös kasszák, amik el vannak különítve, egy projekthez, vagy bármihez? pl. egy
> új entitás típus, aminek lehet pénztárcája, vagy a teljes koino-családnak lehet-e egy közös kasszája? meg hogy globális többséggel
> kikényszeríthető-e, az évi 10%-ból egy bizonyos százalékot a közösbe irányítani?”* — és: *„lokációk szerint lehet-e közös kassza? pl. a
> 10%-nak 1%-a a globális kasszába, 2% a saját országába, 4% a saját régiós kasszájába, és 8% a saját települése kasszájába vándorolna, a
> maradék 85% meg hozzá.”*

## 1. A rövid válasz

**Igen — közös kassza létrehozható, és a koinó saját gépezetével működhet:**
- **A kassza egy entitás** (saját típus, egy gondolat alatt — pl. a projekt gondolata alatt —, vagy legfelül). Bárki befizethet bele;
  **kifizetni csak egy elfogadott „kifizetési javaslat” alapján** lehet — ugyanazzal a döntési gépezettel, mint minden mást (titkos
  szavazással), és a program automatikusan végrehajtja. Ez a **D8 — egyezmény: tény ↔ hatály** kimondott kivétele: *„a kassza-mozgató
  egyezmény végrehajtása kikényszeríthető — az egyetlen automatizálható való-világ-kar”*. A nagyobb kifizetés késleltetve, megtámadhatóan
  megy (**D16 — a pénz lassú, nyilvános és megtámadható**).
- **Az osztalék egy része a közösbe — igen, de nem szavazással:** az ET-7/3 szerint a pénz szabályai a koinó születésében állnak. Egy
  koinó születhet úgy, hogy az osztalék 15%-a kasszákba megy (a te felosztásod szerint) — és aki ezt akarja, abba a koinóba költözik.
  **Többséggel ráerőltetni nem lehet senkire**: aki nem ért egyet, a régi koinóban marad. *(A te szavaid a titkos szavazásnál: „ha a
  közösségnek ez nem tetszik, majd létrehoznak egy új koino verziót.”)*
- **A helyek szerinti kasszák is mehetnek** — a helyek a fában entitások (ország → régió → település), mindegyik alatt egy kassza;
  mindenki kimondja, melyik település kasszáját támogatja, a régió és az ország a fából következik. ⭐ A felosztásod szép elvet követ:
  **minél közelebb, annál több** (1% · 2% · 4% · 8%). ⚠️ Az ára: a „hol élsz” így nyilvános állítás lesz (6. szakasz).
- **A koinó-család közös kasszája** közös pénzkönyv nélkül: egy kassza egy koinóban él, és a család többi koinójából **kivezetéssel**
  (mint a költözésnél — ET-7/4) be lehet fizetni. Egy minden koinó fölötti, „világ” kassza nincs — a koinók fölött nincs kormányzat
  (**D12 — a három szint**).

## 2. A kassza

- **Egy saját típusú entitás** (`Kassza`), mint a nézet-kártya vagy a koino-verzió kártya: a címe a neve, a szövege a célja. Állhat egy
  gondolat alatt (*„a játszótér felújítása”* alatt a játszótér kasszája) vagy legfelül (a koinó közös kasszája).
- **Van egyenlege** a koinó pénzkönyvében (ET-7/4 — egy pénz, egy könyv, egy koinó).
- **Befizetés:** bárki átutalhat bele (egy átutalás, mint egy személynek) — vagy egy szabály irányít bele (4. szakasz).
- **Kifizetés:** egy **kifizetési javaslat** — *„a kasszából 50 000 koinost Annának, a festék árára”* —, ami ugyanúgy dől el, mint egy
  szerkesztési javaslat (küszöbök, titkos szavazás, bizonyosság, döntési idő). Ha elfogadják, a program **végrehajtja**: az összeg a
  kasszából a címzetthez kerül. A nagyobb összeg a D16 várakozási ablakán át megy (megtámadható).
- **Ki dönt róla:** 7. szakasz, ET-9/2.
- **Nem kap osztalékot** — osztalék csak a 2. lépcsős e-embereknek jár (**D18/8**).
- **Ha senki nem tart rajta pontot** (D14), a kassza nem tűnhet el a pénzzel együtt — ⏸️ ez kérdés: a pénze visszaszáll a szülő kasszájára,
  vagy a koinó közös kasszájába (7. szakasz, ET-9/6).

## 3. A projekt-kassza

*Példa: a „Falu” koinóban Béla gondolatot ír: „Újítsuk fel a játszóteret.” Alá kassza kerül. Tizenöten befizetnek összesen 300 000
koinost. Béla kifizetési javaslatot tesz: „120 000 a festékre és a csavarokra, Annának, aki megveszi.” A kassza pont-tulajdonosai
szavaznak; elfogadva — a program átutalja. A maradék 180 000 a kasszában marad a következő lépésre.*

## 4. Az osztalék egy része a közösbe — a te felosztásod

**A szabály a koinó születésében** (ET-7/3): *az osztalék 1%-a a koinó kasszájába, 2% az ország, 4% a régió, 8% a település kasszájába,
85% a személyé.*

*Számokkal (az ET-7 példája: fejenként évi 10 000 koinos osztalék): 100 a koinóé, 200 az országé, 400 a régióé, 800 a településé, 8500
a személyé. Egy 500 fős település kasszája így évente ~400 000 koinost kap.*

- **Az egyenlőség megmarad:** mindenki osztalékának ugyanaz a része megy a közösbe — fejenként egyformán (D10 — egyenlő osztalék).
- **Csak az osztalékból**, nem az induló összegből (a te javaslatod szerint: „a 10%-nak”).
- **Aki nem választott helyet:** ⏸️ kérdés (ET-9/5) — az ajánlásom: a része a következő meglévő szintre megy (nincs település → a
  régióé; semmi → a koinó kasszájáé). Különben megérné nem választani, és a 15% elmaradna.

## 5. A helyek szerinti kasszák

- **A helyek entitások a fában:** egy „Hely” gondolattípussal *Magyarország → Pest megye → Szentendre* — ugyanúgy, mint bármely gondolat
  (pont, javaslat, átnevezés, egyesítés). Mindegyik alatt egy kassza.
- **Mindenki egyszer kimondja** (egy aláírt eseménnyel), **melyik település kasszáját támogatja**; a régió és az ország a település
  felmenőiből következik. Ez bármikor megváltoztatható (költözéskor).
- **A „globális” kassza** a koinó közös kasszája (a legfelső szinten) — nem a világé (a koinók fölött nincs szint).

## 6. ⚠️ Amit tudni kell

1. **A hely nyilvános állítás lesz.** Hogy melyik település kasszáját támogatod, az egy aláírt esemény a láncon — és a kasszák egyenlegét
   minden gépnek ki kell tudnia számolni, tehát ezt látnia kell. ⚠️ Ez ütközik a **D6 — személyes adat SOHA a láncra** szabállyal. Két
   enyhítés: (a) **támogatás, nem lakcím** — bárki azt a települést választja, amelyiket támogatni akarja (a te első koinódban a
   település amúgy is kötelező és nyilvános: **D55 — a nyíltság**); (b) ez kimondott **kivétel** a D6 alól, csak erre a mezőre.
2. **Ki dönt egy ország kasszájáról?** Ha csak a befizetők (az ország „lakói”), egy nagy országnál ez milliók köre — a részvétel nevezőjét
   egy készülék nem tudja helyben megszámolni (9. szabály). Ha a kassza pont-tulajdonosai (mint minden entitásnál), akkor bárki beleszólhat,
   aki pontot tesz rá — akár más országból is. ⭐ A középút: **a pont-tulajdonosok közül azok, akik oda tartoznak** — a „tartozást” mindenki
   a saját láncán bizonyítja (a hely-választásával), a kör pedig a pont-tulajdonosokra korlátos (7. szakasz, ET-9/2).
3. **A kasszák egyenlege és az osztalék maga is koinó-szintű szám.** Az osztalékhoz tudni kell a létező pénz összegét és a 2. lépcsősök
   számát; egy ország kasszájához az összes befizető részét. Egy készülék ezt egy nagy koinóban nem tudja megszámolni — ezt a napi köteg
   (az ET-8, a köteg-gyökér) mondhatja ki, mint az egyenlegeket. → **a kasszák az ET-8 után építhetők**, a pénzzel együtt.
4. **A koinó-család kasszája:** egy kassza egy koinóban él; a család többi koinójából kivezetéssel lehet bele fizetni (a szülőben
   megszűnik, a kassza koinójában megjelenik — ET-7/4). Egy közös családi pénzkönyv ellentmondana az ET-7/4-nek (minden koinónak saját
   könyve), és a verziók pénz-szabályai eltérhetnek.

## 7. A kérdések (⏸️ Csabáé)

- **ET-9/1 — A kassza:** (A) ⭐ egy saját típusú entitás (egy gondolat alatt vagy legfelül); bárki befizethet; kifizetés csak elfogadott
  kifizetési javaslattal, amit a program végrehajt (a D16 ablakával); (B) minden entitásnak lehet pénztárcája (minden entitás szereplő a
  pénzkönyvben — bonyolultabb, és nem kell).
- **ET-9/2 — Ki dönt egy kassza kifizetéseiről:** (A) ⭐ a kassza pont-tulajdonosai — a helyek kasszájánál közülük azok, akik oda
  tartoznak; (B) mindig csak a pont-tulajdonosok (bárhonnan); (C) csak a befizetők (egy nagy kasszánál helyben nem számolható).
- **ET-9/3 — Az osztalék egy része a közösbe:** (A) ⭐ a koinó születési szabálya mondja meg (pl. a te felosztásod) — többséggel nem
  kényszeríthető senkire; aki mást akar, új koinó-verzió; (B) mediánnal állítható, a koinón belül.
- **ET-9/4 — A helyek szerinti kasszák:** (A) ⭐ igen: a helyek entitások a fában, mindenki kimondja, melyik települést támogatja (a régió
  és az ország a fából); a D6 alóli kivétel kimondva; (B) nem — csak önkéntes projekt-kasszák.
- **ET-9/5 — Aki nem választ helyet:** (A) ⭐ a része a következő meglévő szintre megy (végül a koinó kasszájába); (B) megmarad nála.
- **ET-9/6 — Ha egy kasszán senki nem tart pontot:** (A) ⭐ a pénze a szülő kasszájába száll (ha nincs, a koinó közös kasszájába) — a
  kassza addig nem tűnik el, amíg van pénze; (B) a kassza pénze a befizetőkhöz kerül vissza, arányosan.

## 8. Ami nem ez a terv

- **A belső piac** (ET-10) és **az átutalás ablaka és összeghatára** (ET-11, D16).
- **Ki mondja ki, melyik pénzmozgás érvényes, és a koinó-szintű számokat** (a létező pénz, a 2. lépcsősök száma, a kasszák egyenlege) —
  az ET-8, a köteg-gyökér.

## 9. A döntések és az átadás (Csaba, 2026-11-09)

**ET-9/1** a kassza egy saját típusú entitás (egy gondolat alatt vagy legfelül); bárki befizethet; kifizetés csak elfogadott kifizetési
javaslattal, amit a program végrehajt, a D16 ablakával · **ET-9/2** a kifizetésekről a kassza pont-tulajdonosai döntenek — a helyek
kasszájánál közülük azok, akik oda tartoznak · **ET-9/3** az osztalék egy része a közösbe: a koinó születési szabálya mondja meg (pl.
1% · 2% · 4% · 8% · 85%) — többséggel nem kényszeríthető senkire · **ET-9/4** helyek szerinti kasszák: a helyek entitások a fában,
mindenki kimondja, melyik települést támogatja (a régió és az ország a fából); a D6 alóli kivétel kimondva, csak erre · **ET-9/5** aki
nem választ helyet, annak a része a következő meglévő szintre megy (végül a koinó kasszájába) · **ET-9/6** ha egy kasszán senki nem tart
pontot, a pénze a szülő kasszájába száll (ha nincs, a koinó közös kasszájába).

**Az építés:** a pénzzel (ET-7) együtt, a D11 és az ET-8 után — a kasszák egyenlegét és az osztalék koinó-szintű számait a napi köteg
mondja ki. A D-számot az építő adja.

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-9/1 – ET-9/6 Csabánál.
- **2026-11-09** — ✅ ET-9/1 – ET-9/6 mind (A) (9. szakasz).
