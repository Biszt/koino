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
   a felmenőik — entitásként létrejönnek (`rendszer: <név>`, szerző és születés nélkül); a D14 felejtése kihagyja őket (MA4 (B)).
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
