# A magyarázat-réteg (D129) — a kézikönyv és az ⓘ jelek

*A döntés: [`fejlesztesi_terv_fazis2.md`](fejlesztesi_terv_fazis2.md) D129 (Csaba, 2026-11-19 — MA1–MA8). Ez a dokumentum az
építés terve és naplója.*

## 1. Röviden

A felület szinte minden része mellé egy ⓘ jel kerül; rákattintva egy buborék magyaráz (MA1 (A), MA2 (B)). A magyarázatok
tartalma a **kézikönyv**: rendszer-entitások, amiket a program hoz (az alap-tartalom), a pakliban „A koinó kézikönyve” alatt
látszanak (MA6 (A)), és a közösség javaslattal módosítja őket (MA7 (A): módosítás és áthelyezés a kézikönyvön belül; MA8 (B):
óvatosabb alap-küszöb). A D14 alól kivételek (MA4 (B)), és az új programverzió a nem módosítottakat magától frissíti (MA5 (A)).

## 2. A legfontosabb megkötés: a SZÁMÍTÁS MAGJA nem kapja meg az alap-tartalmat

A számítás magja (`kodCsomag.js` `sajatMag` — a `ketReteg.js` és az `esemenyTar.js` import-zárványa, ma 25 fájl) nevezi meg, mit
számol egy koinó; ha a mag változik, az „más számítás” (D123 — a számítás köt, és a változása költözéssel jár). ⛔ Ha a kézikönyv
szövegei vagy akár csak a NEVEINEK listája a magba kerülne, minden új ⓘ (egy új menüpont magyarázata) „más számítás” lenne — és
az MA5 (A) épp azt mondja, hogy ez magától, költözés nélkül lépjen be.

⭐ **Ezért kettéválik:**
- **A mag** csak azt tudja, amit a DÖNTÉSHEZ tudnia kell: egy kézikönyv-entitás létezik, ha egy esemény rá mutat; a NEVÉT az
  esemény magával viszi (`adat.rendszer` — a nevek listája), és a mag a névből ellenőrzi az azonosítót. A nevét és a helyét
  (a szülőjét — a név útvonal: `kezikonyv/menu/kereses` szülője `kezikonyv/menu`) így minden program ugyanúgy számolja, akármelyik
  változat. A szövege a magban nincs (a cím és a szöveg `null`), amíg a közösség módosítással meg nem adja.
- **A program többi része** (a pakli, a vállalás, a lap — nem a mag) olvassa az alap-tartalom fájlját: a meg nem érintett
  kézikönyv-entitásokat ebből rajzolja, a szöveget innen veszi, ha a közösség nem módosította.

## 3. Az ① építése — a mag

1. **A név és az azonosító** (`js/esemeny/rendszerEntitas.js` — a mag része, kicsi és állandó): a név útvonal (`kezikonyv` a gyökér;
   szakaszai kisbetű, szám, kötőjel; legfeljebb 8 szint, 160 jel); az azonosító a névből (lenyomat — mindenkinél ugyanaz, MINDEN
   koinóban ugyanaz: így a gyermek koinó a szülő kézikönyvét folytatja, ahogy a gondolatokét is); a szülő neve az útvonalból.
2. **A koinó szabálya** (`koinoSzabalyok.js`): a születés `kezikonyv` szabálya — a kézikönyv alap-küszöbe (MA8 (B): legalább 3 nap
   = 259 200 mp a legkisebb döntési idő). ⛔ Az `ALAP_SZABALYOK` NEM kapja meg (a régi, mező nélküli születés így kézikönyv nélküli
   marad — a „mai értékek soha nem változnak”); az új születésbe a `teljesSzabalyok` írja.
3. **A kapu** (`esemeny.js` `alakiHiba`): az `adat.rendszer` — legfeljebb 8 név, mind érvényes útvonal.
4. **Az állapot** (`allapotSzamitas.js`): ha a koinónak van kézikönyv-szabálya, minden esemény `adat.rendszer` nevei — és
   a felmenőik — entitásként létrejönnek (`rendszer: <név>`, szerző és születés nélkül); MA4 (B): ⭐ a koinon 1 passzív pontjával
   (eredetileg a D14 kivételeként — lásd a naplót).
5. **A küszöb** (`javaslatSzamitas.js`): a kézikönyv-entitás alap-küszöbe a koinó kézikönyv-szabályáé (ha a tulajdonosai érték
   javaslattal mást nem mondanak).
6. **A bejelentés** (`esemeny.js` `bejelentesHelyei`): a kézikönyv-entitásra mutató esemény a kézikönyv GYÖKERÉNEK szeletébe is
   bejelentődik — így EGY szelet hordja az egész kézikönyvet.
7. **A vállalás** (`vallalas.js` — nem mag): a kézikönyves koinóban mindenki tartja a kézikönyv gyökerének szeletét (MA4 (B)
   következménye: a pont nélkül megmaradó módosítást is valakinek őriznie kell — mint a koinó születését).

⚠️ **Amit ez kimond:** a régi program az ismeretlen szabályú (kézikönyves) születést elutasítja — kézikönyves koinóhoz csak a
frissített program csatlakozhat. A régi (teszt) koinókban nincs kézikönyv. A mag változik → az új koinók új családot kezdenek
(mint a D128-nál).

⚠️ **Egy határ:** a mag bármely érvényes útvonalat elfogad (nem tudja, melyik nevet ismeri a program) — egy e-ember tehát
kitalált nevű kézikönyv-entitásra is tehet pontot. A lap ezt csak akkor mutatja, ha van rajta pont vagy módosítás. Az eseményei a
kézikönyv szeletébe kerülnek, amit mindenki tart: egy tag ide eseményeket tölthet — ⛔ ez ugyanaz a kockázat, mint a gyökér-darabé
(oda is bárki bejelenthet születést); a fék ugyanaz: a tagság (a meghívás).

## 4. A ② építése — a javaslatok és az új programverzió

**②a — a szabályok (a mag, `szabalyok.js`):** a szabály-réteg az entitás típusát a létrehozó eseményből ismeri — a
kézikönyv-entitásnak nincs ilyen, ezért a nevekből (minden esemény `adat.rendszer`-éből és a felmenőikből, mint az állapot) kap egy
saját típust (`Kezikonyv`) és szülőt. A `TILTOTT_MUVELETEK` mintájára: kézikönyv-entitáson **törlés és egyesítés nem indítható**
(MA7 (A)); az **áthelyezés csak kézikönyv-entitás alá** mehet (a cél is a kézikönyvé). A különváló kisebbség másolata
(`szerkesztesiVegrehajtas.js`) hétköznapi gondolat lesz (a D14 alá esik), de megjegyzi, melyik kézikönyv-névből vált ki
(`rendszerbol`) — így a lap az eredeti szöveget rajzolhatja, ha a közösség még nem módosította.

**②b — a nevek az eseményeken (a megőrzéshez):** hogy a pont nélkül megmaradó módosítás (MA4 (B)) újraszámolható legyen, a
DÖNTÉS minden eseménye a kézikönyv szeletébe kerül: a kézikönyv-entitásra tett pont és érték javaslat, a javaslat (az érintettek és
az áthelyezés céljának nevével), a javaslatra tett pont (D85/2), a szavazat és a lezárási összegzés (a javaslat neveivel). A
műveletek (`muveletek.js`) a neveket a környezettől kérdezik (`kornyezet.rendszerNevei`), amit a `koino.js` az alap-tartalomból és
az állapot kézikönyv-entitásaiból ad.

**Az alap-tartalom fájlja** (`js/kezikonyv/alapTartalom.json` — ⛔ a mag nem olvassa): `{ fajta: 'koino-kezikonyv-1',
bejegyzesek: [{ nev, cim, szoveg }] }` — a szülő a névből, a testvérek sorrendje a fájlé. A kezelője `js/kezikonyv/kezikonyv.js`
(betöltés, a név ↔ azonosító térkép, a megjelenítendő szöveg).

**②c — az új programverzió (MA5 (A)):** a lap a kézikönyv-entitás szövegét a közösség módosításából veszi, ha van (az állapotban a
cím vagy a szöveg nem üres), különben a program alap-tartalmából — így a NEM módosított szöveg magától követi a programot. A
módosító javaslat megjegyzi, a program melyik szövegét váltotta (`adat.alapLenyomat` — a mag nem nézi); ha a program azóta mást
mond, a program felkínálja **a program által megírt javaslatot** (`adat.programJavaslata: true`), amit egy e-ember elindíthat. A
parancssor: `kezikonyv` (a lista: alap / módosított / a program új szöveget javasol), `kezikonyv javasol <név>`, és a `pont` meg a
`javaslat` parancs a nevet is elfogadja (`kezikonyv/menu/kereses`).

## 5. A további lépések

③ **A felület** — az ⓘ réteg (az örökölt, bájtra azonos fájlokhoz nem nyúl: a kirajzolás után teszi a helyére), a buborék az
entitás gombjával, a kézikönyv a pakliban, a struktúrában és a síkidomban. ④ **A szövegek** területenként, majd a fogalomtár.
⑤ **A próba**: minden ⓘ megtalálja a helyét, és minden névnek van szövege.

## 6. Napló

- **2026-11-19** — a terv; az ① építése indul.
- **2026-11-19** — ✅ **az ① kész** (`a309655`): 6 próba (`meres/kezikonyvProba.js`), 12 rontás mind bukik (⛔ az első változat a
  megkerülést — a név elhagyását — nem fogta meg: a nevesített javaslat neve „kisegítette” a név nélkülit; most egy másik
  entitásra mutat); az `esemenyProba` „a teljes = a mai értékek” próbája a kézikönyvvel kiegészítve. Teljes sor 1523/1523 + 2 ismert.
- **2026-11-19** — ✅ **a ② kész**: a szabályok (`szabalyok.js` — a `Kezikonyv` típus a nevekből; törlés, egyesítés tilos;
  áthelyezés csak kézikönyv alá), a különvált ág `rendszerbol`-ja, a nevek minden döntés-eseményen (`muveletek.js` — a
  `kornyezet.rendszerNevei`), az alap-tartalom (`js/kezikonyv/` — 7 bejegyzés: a gyökér és a hat fejezet), a `kezikonyv` parancs és
  a „program által megírt javaslat” (`kezikonyv javasol`; a próbák egy „újabb program” alap-tartalmát a `KOINO_KEZIKONYV_ALAP`-pal
  adják). Próba: +4 egység (`kezikonyvProba.js`, most 10) és +1 parancssor (a teljes út). ⛔ **Lelet (a parancssor-próba fogta
  meg):** a javaslattevő automatikus támogató szavazata (a `javaslatLetrehozasa` maga írja, nem a `szavazas`) nem vitte a nevet —
  pont nélkül ez a szavazat elveszett volna a kézikönyv szeletéből. 16 rontás mind bukik. ⚠️ Próba nélkül: a lezárási összegzés
  kihagyása a kézikönyv-entitásnál (`koino.js` — csak 1000 eseménynél nagyobb szeletre fut; védekező lépés).
- **2026-11-19** — ✅ **a ③ kész**: a program oldala — a pakli képe (`pakli.js` `kepetKerni`) a kézikönyvvel (`kezikonyv.js`
  `kezikonyvKepbe`: a meg nem érintett bejegyzések virtuálisan, a megérintettek a megjelenítendő szöveggel és a `kezikonyv` jellel —
  `forras: program|kozosseg`), így a pakli, a struktúra, a síkidom és a keresés külön kód nélkül mutatja; a `GET
  /api/kezikonyv/bejegyzes?nev=` (a buborék — a részeivel); a „tartott” szeletek a kézikönyv azonosítóival (a pontjaik ismertek); az
  alsó sáv számai a kézikönyv nélkül (a „📄 gondolatok”, és a „🔭 még nem ismert” — ⛔ a gyökér ismert része a kézikönyvvel a
  tartó bemondását elnyelte volna). A felület (`felulet/js/koinoMagyarazat.js` + CSS): a helyek (választó → név), a figyelő
  (`MutationObserver` — az örökölt fájlok érintetlenül), a buborék (a részei közt lépkedve, „‹”-gel vissza; „📖 A kézikönyvben” a
  pakliban a bejegyzéshez ugrik; telefonon a lap alján). Az első helyek: az alsó sáv (EGY ⓘ a sáv elején — telefonon egy sor; a
  részei a buborékból nyílnak) és a „📱 Készülékeim” ablak (az azonosság, a készülék sora, a határ, a kizárás, az új készülék, a
  papír). Az alap-tartalom 26 bejegyzés (az alsó sáv 13 része és a Készülékeim 6 része részletesen — MA2 (B); a kódhoz igazítva:
  az őrjárat alapból 5 perces, a kizárás nem vonható vissza). Böngészőben végigjárva (asztali és telefonos méret). Próba: +3
  egység (most 13), +1 parancssor; 9 rontás mind bukik. ⏭️ A ④-hez feljegyezve: a kártya a szöveg bekezdéseit egybefolyatja (az
  örökölt megjelenítő); a „📱 Készülékeim” saját szövegeiben belső kód áll („D128 17. pont”) — a ④ ezeket is átírja.
  ⛔ **Lelet (a teljes sor fogta meg — 4 parancssor-próba):** a lap fájában most ott a kézikönyv (MA6 (A)), és ⭐ a bejáró
  (`pakli.js` `biztosElotag`) egy helyet csak akkor mondott biztosnak, ha a pontja nagyobb egy ismeretlené lehetségesnél — a
  kézikönyv 0 pontos bejegyzései így SOHA nem lettek volna biztosak, és a lap örökké „a sor folytatódhat”-ot mondott volna. Most: ha
  semmi ismeretlen nem előzheti meg (a korlát 0), a kézikönyv-bejegyzés helye is biztos (rontással őrizve). A Struktúra, a Síkidom és a
  lapos lista próbái a valódi gondolatokat ugyanúgy mérik, mellettük a kézikönyvet a méretével (a lapos „hierarchikus” lista az ágakat
  az azonosítók szerint rakja egymás után — ez eddig is így volt).
  ⛔ **Lelet (a második teljes sor — szeszélyes, ~minden hatodik futás):** a nézet-próba (D126) a nézet-felület alap rendezésével
  (`hierarchikus`, növekvő — az ágak az azonosítók szerint) kérte az első 20 entitást, és az elsőt választotta: a kézikönyv ága
  (a gyökere állandó azonosítójával) a véletlen azonosítójú gondolat elé kerülhetett, és kitolta a lapról. A program helyes (a nézet a
  koinó egész fáját látja, abban a kézikönyvet is); a két nézet-próba most pont szerint kér, és név szerint választ — a kézikönyv
  méretétől függetlenül. A bukás kiírása a nézet válaszait és a koinó eseményeit is mondja (eddig nem látszott, melyik kérdés ment
  félre).
  ⛔ **Lelet (a harmadik teljes sor — az FL1 próba):** a pakli alapból „a legerősebb gyökérrel” nyílik, holtversenyben az azonosító
  dönt — egy még ismeretlen pontú (0) közösségi gondolat és a kézikönyv 0 pontos gyökere közül így néha a kézikönyv nyílt meg. Egy
  külön szabály (azonos pontnál a közösség a kézikönyv előtt) után ⭐ **Csaba döntése (2026-11-19): „ugyan úgy kell rendezni a rendszer
  entitás típusú kártyákat is, mint az többit”** — a külön szabály kikerült: a kézikönyv kártyáira ugyanaz a sorrend vonatkozik (pont
  szerint, holtversenyben az azonosító). Az FL1 próba most a mért gondolatot nevezve kéri (nem a holtversenyre hagyatkozik).
- **2026-11-19** — ⭐⭐ **A KOINON** (Csaba: „hozzunk létre, egy koinon-t … minden entitást, 1 tudatpontal hozza létre” — „rendben.
  jöhet az 1-es, aztán mehetsz tovább a 2-essel”): a D14 kivétele helyett minden kézikönyv-entitáson 1 passzív pont a koinóné
  (`rendszerEntitas.js` `KOINON`, `KOINON_PONT`; az állapotban és a pakli virtuális bejegyzésein ugyanúgy). Kikerült: a D14
  kivétele és a bejáró külön szabálya (a 0 pontos kézikönyv-bejegyzés helye) — a kézikönyvre is ugyanaz a szabály vonatkozik, mint
  bármely kártyára. A koinon nem szavaz, nem javasol, a részvétel nevezőjébe nem számít (a döntés a pont-eseményekből számol — a
  koinonnak nincs ilyen); az ágak össz-pontjában esemény nélküli levél (mint az egyezmény által átvitt pont); a különválásnál a
  koinon mindig marad (a főág nem ürül ki). A buborék és a `kezikonyv` parancs a közösség pontjait mondja (a koinon 1-e nélkül).
  Következmény: egy friss koinóban a kézikönyv gyökere (a bejegyzései koinon-pontjaival) a legerősebb gyökér lehet — a pakli azzal
  nyílik, amíg a közösség gondolatai nem erősebbek. ⏭️ D130: a koinon az általános egyezményekhez, a darabokra osztott, replikált
  őrzéssel.
- **2026-11-19** — ✅ **a ④a kész: a menü és a fejléc.** Az ⓘ a fő menü minden pontján (22) és a panel tetején (a menü egészéről),
  a fejlécben a tér sávján (5 részével: vissza, rendezés, frissítés, csatlakozás, társak), a belépő sávján és az állapot-soron. Az
  alap-tartalom +30 bejegyzés (most 56). A menüpontot a felirata azonosítja — a pont saját címke-eleme, pontos egyezéssel (az
  ikon és a számláló külön elemben áll, így a felirat tiszta). A szövegek a kódhoz igazítva: hat állítás kikerült vagy szűkült, mert a kódban nem
  találtam alátámasztást (a síkidom a paklit is odaugratja; a tér kártyáinak számai név szerint; az értesítések összefoglaló küldése;
  az új gondolat ablakában a szülő választása; a meghívó nyilatkozatának „felelsz érte” része; a koinon pontja az egyezményeken — az
  csak a D130 után igaz). ⛔ **Leletek (a böngészős kipróbálás):** ① a kártyák saját menüje ugyanazt az elemet viseli, és
  néhány pontja ugyanúgy hangzik — 30 ⓘ lett volna; a helyek most csak a fő menüre (`#hamburger-menu-kontener`) szólnak, a kártyák
  menüje a ④b-é. ② A belépő sávját és az állapot-sort a lap minden frissítéskor újraírja — az „ez már megjelölt” jelzés az elemen
  maradt, a jel nem; most a jel tényleges jelenlétét nézzük. ③ ⭐ A figyelő `requestAnimationFrame`-mel ütemezett — egy nem látható
  fülön a böngésző azt nem futtatja, és a menü ⓘ-i ki sem kerültek (kézi hívásra igen: +25); most időzítővel (30 ms). ④ Az
  állapot-sor és a tér sávja a lap zöld hátterén ül — a zöld jel elveszett rajta; ott is világos jel. A buborék a menüpont ⓘ-jére
  kattintva nyílik, és a menüpontot magát nem indítja el (a „Keresés” ablaka zárva marad). Próba: a névellenőrzés (minden ⓘ-hely
  neve szerepel az alap-tartalomban) a `menuPont(…)` alakot is olvassa.
