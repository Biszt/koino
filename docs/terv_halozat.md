# ET-5 — A hálózati beállítások menüpont (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** ✅ **ET-5/1 – ET-5/6 eldöntve**, mind (A) (Csaba, 2026-11-09: *„rendben, elfogadom a javaslataidat.”*) · ➕ Csaba
> kiegészítése: *„még azt is beállíthatóvá kéne tenni, hogy a nem tudatpontos tárhelyet, mekkorára hagyja tágulni, mielőtt törölné a
> régieket.”* → 7. szakasz, ⏸️ **ET-5/7** Csabánál.
>
> Csaba (2026-11-08, a kérés és a korlátok — a kérelem, a kiszolgálási keret, a törzs-határ — összefoglalójánál): *„részletes, hálózati
> beállítások menüpontot is terveznünk kell majd.”*

## 1. A rövid válasz

**Ma a hálózati kapcsolók szét vannak szórva:** a legtöbb csak parancs (`kiszolgalas`, `cimjegyzek`, `kapu`, `tukor`, `felfedez`…), néhány
csak környezeti változó, és a lapon egyetlen ablak van (*„🤝 Társak…”*). Két döntés már előre jelezte a panelt: a **D109 — a kiszolgálási
keret** (KK5: *„kiindulás, a panelen állítható”*) és a **D120 — a törzs-határ: a nagy törzs elemenként, kérésre** (*„később a
beállításokban állítható, mint a többi határérték”*).

⭐ **A javaslat:** egy **„🌐 Hálózat” menüpont** a fő menüben, egy ablak öt résszel, és ugyanez parancsként (`halozat`). **Mindent látsz,
de csak a készüléked saját számait állítod;** amit mindenkinek egyformán kell tartania, azt az ablak megmutatja, és megmondja, miért nem
állítható.

⭐ **Az építése nem kíván költözést:** ezek helyi beállítások (nem esemény, nem terjed — a **D83 — a kiszolgálás és a szigorú (b)
időzítése** mintája), a **D123 — a program rétegei: „a számítás köt, a többi szabad”** szerint a szabad rétegben vannak. Bármikor
megépülhet, a többi témától függetlenül.

## 2. Ami ma van (a kódban megnézve)

- **A kiszolgálás módja** (D83/2): *„alap”* vagy *„mindent”* (a mindent-készülék a nagy szeleteket is egészében tartja, és a lezárt
  döntésekről összegzést ad — D95/1). Parancs: `kiszolgalas mindent|alap`. Koinónként tárolva.
- **A kiszolgálási keret** (D109): óránként 20 MB és 600 kérés (alap), 100 MB és 3000 (mindent); egy társ legfeljebb a negyedét, az
  idegenek együtt legfeljebb a felét vihetik; a kötéseim cseréje nem kerül alá. Parancs: `kiszolgalas keret <MB> <kérés>`. Koinónként.
- **A törzs-határ** (D120): 1 MB — ma nem állítható (csak a próbák szűkítik egy környezeti változóval).
- **A szeletenkénti DHT-hirdetés** (**D91 — a címjegyzék: a fa és a raj**, 3. pont): alapból 0, legfeljebb 50. Parancs: `cimjegyzek
  hirdetes <n>`. Készülékenként.
- **A társak** (az induló címek): a lapon is (*„🤝 Társak…”*).
- **A kapu:** az UDP-port (7373; ha foglalt, egy véletlen), a router megkérése (`kapu`), a külső cím (`tukor`, `kulsoport`), a pajzsfúrás
  (`pajzsfuro`), a helyi felfedezés (`felfedez` — kézi, *„ki van még ezen a wifin?”*).
- **Az ébrentartás** (Termux): csak környezeti változóval kapcsolható ki.
- **Megnézhető:** a vállalásom (`vallalas`), a tár tömörítése (`tomorit`), az elmúlt óra kiszolgálása (`kiszolgalas`).
- **A nem vállalt (nem tudatpontos) adat** — három külön, korlátos tár, mindegyikből a legrégebben megnézett megy ki (a 7. szakasz
  részletezi): az átmeneti tár (az események, **20 MB**), a fájl-tár nem vállalt része (a képek és a csatolt fájlok, **50 MB**), és a
  felderítések rögzített adata (**1 GB**). ⚠️ Egyik sem állítható ma: a kód megjegyzése *„készülékenként állítható”*-t ír, de bekötve
  nincs — a fájl-tárét csak a próbák szűkítik egy környezeti változóval.

## 3. Az ablak — öt rész

1. **📡 Állapot** (csak nézni):
   - hány társ, mikor volt az utolsó csere, a kötéseim (legfeljebb 3);
   - kívülről hogy látszom (a külső cím és port), sikerült-e a router-nyitás, a DHT elérhető-e;
   - a forgalom: az elmúlt órában, ma és ebben a hónapban, kifelé és befelé (5. kérdés);
   - a tár: a tartós és az átmeneti mérete, a vállalt szeletek száma — és egy *„Tömörítés”* gomb;
   - a *„később”*-ek (D109, KK6): hányszor mondtam, hányszor mondták nekem.
2. **📤 Mennyit adok:** a mód (alap / mindent) és a keret (MB és kérés óránként) — az alsó határral (3. kérdés).
3. **📥 Mennyit hozok:** a törzs-határ (alapból 1 MB) — ami fölötte van és nem vállaltam, azt csak kérésre hozza.
4. **🤝 Kikkel és hol:** a társak (a meglévő ablak), a helyi felfedezés gombja, a szeletenkénti DHT-hirdetés (0–50), a port, a router
   megkérése (be/ki).
5. **📱 A készülék:** a takarékos mód (4. kérdés), a havi figyelmeztetés (5. kérdés), az ébrentartás (be/ki).
6. **💾 Tárhely** (Csaba kiegészítése — 7. szakasz): a nem vállalt adat kerete, a felderítéseké, a tartós tár mérete (csak nézni), és a
   *„Tömörítés”* gomb (az Állapotból ide kerül).

**⛔ Nem állítható, de látszik — a miértjével:**
- a koinó szabályai (a mag — D123): ezek a koinó képét számolják; aki mást számol, az másik koinóban van;
- a kopogás üteme (minden percfordulón — **D115 — a kopogás saját üteme**): a két félnek egyszerre kell kopognia — a 41. mérés szerint
  ha az egyik páros, a másik páratlan percben kopog, soha nem találkoznak;
- a kifutás (**D104 — a kifutás: a pont levétele után még 24 óráig tartom a szeletet**): a többiek számítanak rá, hogy addig megtalálnak;
- az elsőbbség szerkezete (**D108 — a felderítés és a kiszolgálási keret**): egy társ legfeljebb a negyedét, az idegenek legfeljebb a
  felét — hogy az ismerőseidnek mindig maradjon hely. *(A keret nagysága a tiéd; a felosztása közös.)*

**A parancssor mindent tud, amit az ablak** (a lap csak rajzol — 7. szabály): `halozat` kiírja az egészet, `halozat <beállítás> <érték>`
állít.

## 4. A számok és a 9. szabály

Minden állítható szám **korlátos** (van alsó és felső határa), és egyik sem függ a koinó méretétől — így a beállítás nem teheti a
készülék terhét a koinóval együtt növővé (*„a végtelen”* próbája). A felső határok: a keret legfeljebb a *„mindent”* kiinduló számának
tízszerese, a DHT-hirdetés legfeljebb 50 (ma is), a törzs-határ legfeljebb 128 MB (a D109 szerint egy törzs-válasz ennyi lehet).

## 5. A takarékos mód és a havi figyelmeztetés

- **📱 Takarékos mód** (egy kapcsoló a mért, drága hálózatra): a keret és a törzs-határ a negyedére (5 MB és 150 kérés óránként, 256 KB),
  nincs szeletenkénti DHT-hirdetés, és nincs *„mindent”*. **Kézzel kapcsolod** — a készülék nem mindig mondja meg a programnak, hogy mért
  hálózaton van; ahol a böngésző megmondja, a lap rákérdez (*„Mobilneten vagy — bekapcsolod a takarékos módot?”*), de magától nem kapcsol.
- **A havi figyelmeztetés:** megadhatsz egy havi számot (pl. 2 GB); ha a forgalom átlépi, a készülék értesít (D103), és felajánlja a
  takarékos módot. ⚠️ **Nem állít le semmit magától** — egy néma leállás után a koinó *„nem működik”*, és senki nem tudja, miért (a
  *„nem-esemény néma”* tanulsága).

## 6. A kérdések (⏸️ Csabáé)

- **ET-5/1 — A hely és a forma:** (A) ⭐ egy *„🌐 Hálózat”* menüpont a fő menüben, egy ablak öt résszel (Állapot · Mennyit adok · Mennyit
  hozok · Kikkel és hol · A készülék), és ugyanez parancsként (`halozat`); (B) a meglévő ablakokban szétszórva.
- **ET-5/2 — Mit lehet állítani:** (A) ⭐ csak a készülék saját számait (a mód, a keret, a törzs-határ, a DHT-hirdetés, a port, a router
  megkérése, a takarékos mód, a havi figyelmeztetés, az ébrentartás); a közöset (a mag, a kopogás üteme, a kifutás, az elsőbbség
  szerkezete) az ablak megmutatja a miértjével; (B) mindent állíthatóvá tenni — akkor a hálózat szétesik (aki más ütemben kopog, senkivel
  nem találkozik).
- **ET-5/3 — Alsó határ a kiszolgálásnál:** (A) ⭐ a keret nem mehet az alap kiinduló számának negyede alá (5 MB és 150 kérés óránként) —
  aki szeletet tart, annak a többiek kérésére is felelnie kell (a tartós tár az, amit vállalok — **D75 — a két tár: tartós és
  átmeneti**); (B) nincs alsó határ (0 is lehet — aki így állítja, csak a kötéseivel cserél).
- **ET-5/4 — A takarékos mód:** (A) ⭐ egy kapcsoló: minden a negyedére (ez épp az alsó határ), nincs DHT-hirdetés és *„mindent”*; kézzel
  kapcsolod, a lap csak rákérdez, ha a böngésző mobilnetet jelez; (B) nincs külön mód — a számokat egyenként állítod.
- **ET-5/5 — A havi adatkeret:** (A) ⭐ figyelmeztetés: egy általad megadott havi szám átlépésekor értesítés és a takarékos mód
  felajánlása — semmi nem áll le magától; (B) kemény plafon: elérve a készülék csak a kötéseivel cserél a hónap végéig.
- **ET-5/6 — Készülékenként vagy koinónként:** ma a keret és a mód koinónként van tárolva, a DHT-hirdetés készülékenként. (A) ⭐
  készülékenként egy beállítás (a telefon adatkerete egy, akárhány koinód van): a keret a futó koinók közt egyenlően oszlik, az ablak
  koinónként bontva mutatja a forgalmat; (B) koinónként külön (három koinóval háromszoros a forgalom).

## 7. A nem vállalt adat tárhelye (Csaba kiegészítése, 2026-11-09)

> *„még azt is beállíthatóvá kéne tenni, hogy a nem tudatpontos tárhelyet, mekkorára hagyja tágulni, mielőtt törölné a régieket.”*

**Ma (a kódban megnézve)** a készülék háromféle adatot tart, amire nem tett tudatpontot — mindhárom korlátos, és ha betelt, a
**legrégebben megnézett** megy ki (**D75 — a két tár: tartós (vállalt) és átmeneti (látott, eldobható)**, az SK11 szerint):
- **az átmeneti tár** — a böngészés közben elhozott események: **20 MB** koinónként;
- **a fájl-tár nem vállalt része** — a képek és a csatolt fájlok: **50 MB**; védett a vállalt, a saját, a profil-kép, és ami 24 órán belül
  érkezett;
- **a felderítések rögzített adata** (**D112 — a felderítés**): **1 GB** — ezt te kérted el egy ágból, ezért külön kerete van.

Ami kiesik, az nem vész el: bárki más tartja, aki pontot tett rá, és a következő megnézéskor újra elhozza a készülék (a tartalma a
lenyomatából ellenőrizhető). **A tartós tár** (amire pontot tettél) nem tartozik ide: azt vállaltad, a méretét a tudatpontjaid adják, nem
egy beállítás.

⭐ **A javaslat — a 💾 Tárhely részben két szám:**
- **🗂️ A böngészésből megmaradt adat** — egyetlen szám a két első tárra együtt (alapból a mai **70 MB**: 20 + 50); a program ugyanabban
  az arányban osztja el az események és a fájlok közt. *Egy embernek egy szám érthető; hogy a mögötte lévő két tár hogyan osztozik, az a
  program dolga.*
- **🔭 A felderítések** — külön szám (alapból **1 GB**), mert ezt kifejezetten te kérted el.

**A határok** (a 9. szabály: minden szám korlátos):
- **alul 10 MB** — kisebb tárral a lap ugyanazt újra és újra elhozná, vagyis a kis tár több forgalom;
- **felül a szabad hely fele** a beállításkor; és ha a lemez közben megtelik, a program a keretet magától szűkíti — és ezt **kimondja**
  (értesítés), nem csendben teszi.

**A többi beállítással így illeszkedik:**
- **készülékenként egy szám** (ET-5/6): a koinók közt egyenlően oszlik, mint a keret;
- **a takarékos mód nem szűkíti** (ET-5/4): a kisebb tár több újraletöltés, vagyis épp több forgalom;
- **a „mindent” készülék** mindent tart — nála a szám szürke, a miértjével;
- **az ablak mutatja**, mennyi van most benne, és mennyi esett ki az utóbbi napon (ha sok, érdemes nagyobbra venni).

- **ET-5/7 — A nem vállalt adat tárhelye:** (A) ⭐ két szám: a böngészésből megmaradt adat (egy szám az eseményekre és a fájlokra együtt,
  alapból 70 MB) és a felderítések (alapból 1 GB); a határok: alul 10 MB, felül a szabad hely fele; ha a lemez megtelik, a program szűkít
  és szól; készülékenként, a koinók közt egyenlően; (B) három külön szám (az események, a fájlok, a felderítések), a mai tárak szerint.

## 8. A döntések és az átadás (Csaba, 2026-11-09)

**ET-5/1** egy „🌐 Hálózat” menüpont a fő menüben (most hat résszel: Állapot · Mennyit adok · Mennyit hozok · Kikkel és hol · A készülék
· Tárhely), és a `halozat` parancs · **ET-5/2** csak a készülék saját számai állíthatók, a közös (a mag, a kopogás üteme, a kifutás, az
elsőbbség szerkezete) látszik a miértjével · **ET-5/3** a keret alsó határa óránként 5 MB és 150 kérés · **ET-5/4** takarékos mód: egy
kézi kapcsoló, minden a negyedére, nincs DHT-hirdetés és „mindent”; a lap rákérdez, ha a böngésző mobilnetet jelez · **ET-5/5** a havi
adatkeret figyelmeztet, nem állít le · **ET-5/6** készülékenként egy beállítás, a keret a futó koinók közt egyenlően · ⏸️ **ET-5/7** nyitva.

**Az építés:** a szabad rétegben (D123) — költözés nélkül, bármikor, a többi témától függetlenül. A D-számot az építő adja.

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-5/1 – ET-5/6 Csabánál.
- **2026-11-09** — ✅ ET-5/1 – ET-5/6 mind (A); Csaba kiegészítése (a nem vállalt adat tárhelye) → 7. szakasz, ⏸️ ET-5/7.
