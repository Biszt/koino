# Telepítés a kártyáról — átvizsgálás (D123 ④, PR5 — 2026-11-07, kód nélkül)

> **Állapot:** ✅ **D125** (Csaba, 2026-11-07: *„mindet elfogadom, mehetünk tovább.”* — TK1–TK5 mind (A)) · ✅ az építés ①–③
> (elágazás 247) · ✅ ④ a terepi próba (2026-11-08 — a telefonon a telepítés és a visszaút is lement; a lelete: a
> csere után a telefon nem nyit új fület → `koino lap`, és a Termuxban a címek koppintásra megnyílnak — elágazás 251). Az elv a D123-ban eldőlt (PR5 (B)): *„a kártya kód-csomagjából egy új
> programmappa a régi MELLÉ (minden fájl a lenyomata szerint ellenőrizve, a jegyzék lenyomata a kártya `kod`-ja), az e-ember maga
> indítja, a lap előtte megmutatja, ki tette fel, hány pont van rajta és mi változott (rétegenként); a régi mappa megmarad
> (visszaút), az adat mappán kívül van.”* Ez az átvizsgálás azt nézi meg, HOL és HOGYAN — a kód és a **91. mérés** alapján
> (`meres/kartyaTelepitesMeres.js`). Az egyetlen kód, ami belőle már készült: a mérés lelete (2.) — egy hiba javítása.

## 1. A rövid válasz

A kártyán a teljes program van (D119: a jegyzék és a fájlok, tartalom-címzetten), és a 91. mérés szerint **ebből egy működő
program összerakható**: a 367 fájl fél másodperc alatt kiíródik, mind a lenyomata szerint ellenőrizve, és a kiírt program elindul,
ugyanazzal a maggal. A telepítéshez tehát nem kell új adat — a munka a **csere** (a futó program leállítása, a mappák cseréje, az
újraindulás) és az, amit a lap **előtte** kimond.

⭐ A javaslat (4.): a kártya kódja egy `koino-uj` mappába kerül (ellenőrizve), és onnan a **mai frissítés lánca** fut tovább — ugyanaz,
amit a telepítő sor indít (PR7): az új telepítő leállítja a régit, a régit `koino-regi`-be teszi, az újat a helyére, és indít. A lap
előtte megmutatja a szerzőt, a pontot, rétegenként a változást, és ⚠️ hogy melyik koinódban lesz „más számítás”.

⛔ A mérés egy hibát is talált, ami a mai programban él (2.) — javítva.

## 2. A 91. mérés — a kártyából összerakott program

A mérés ennek a programnak a kód-csomagjából (ahogy a kártya ma készül — a git-munkakönyvtárból) rak össze egy mappát:

- **(a)** a kód-csomag: 367 fájl, 7,1 MB (a jegyzék 32 KB), ~250 ms;
- **(b)** a kiírás egy üres mappába, fájlonként a lenyomata szerint: ~0,5 s, egy rossz fájl sincs;
- **(c)** ⛔ **a kiírt mappa a saját kódjának MÁS nevet számolt**: a git nélküli mappát a program bejárja (nem a git kérdezi), és a
  bejárás szűrője a telepítőket (`termux/indit.sh`, `termux/telepit.sh`, `windows/indit.ps1`, `windows/koino.cmd`,
  `windows/telepit.ps1`) kihagyta — 362 fájl a 367-ből. A mag ugyanaz volt;
- **(d)** a kiírt program elindul (egy koinó születése és a `koino` parancs, egy üres adat-mappával — ~1,3 s), és a magja „ezen a
  készüléken is ez fut”;
- **(e)** ugyanez egy `.git` nélküli másolattal, ahogy a Windowsos telepítés a GitHub zip-jéből: ugyanaz a hiba.

⛔ **A lelet súlya:** minden Windowsos telepítés (a zip-ből) ugyanarra a változatra más programnevet számolt, mint a telefon (a
git-munkakönyvtár) — a lap tájékoztató szintje („ℹ más felület”, D123 ①) tévesen szólhatott, és egy Windowson készült koino-verzió
kártya kódjából a telepítők hiányoztak. A mag nem érintett (a „⚠ más számítás” nem szólhatott tévesen). ⭐ **Javítva:** a bejárás a
telepítőket is viszi (`kodCsomag.js` `KODNAK_VALO`), és egy próba őrzi, hogy a git nélküli másolat ugyanazt a nevet számolja, mint a
git (`koinoVerzioProba.js`) — ha egyszer egy új fajta fájl kerül a programba, amit a bejárás nem lát, a próba bukik. A javítás után
a mérés (c)-je és (e)-je: 367 fájl, a név ugyanaz.

## 3. A mai helyzet

- **A kód a kártyán.** A koino-verzió kártya `kod`-ja a jegyzék hivatkozása; a jegyzék és a fájlok a fájl-tárban (a nevük a
  lenyomatuk). A vállaló minden fájlt tart; a nem vállaló a D120 óta csak kérésre hozza el (a „Kód” fül megmondja, hány van meg —
  `/api/kod?kartya=`).
- **A telepítés helye.** A telefonon `~/koino` (egy git-munkakönyvtár — a telepítő sor `git fetch` + `git reset`-tel frissít), a
  Windowson `%USERPROFILE%\koino` (git nélkül — a zip-ből; a sor a `koino-uj`-ba tölt, az új telepítő leállít, a régit
  `koino-regi`-be teszi, az újat a helyére, és indít — PR7). Az adat mindkét helyen a mappán KÍVÜL (`koino-adat`).
- **Egy program egy készüléken.** A családi őrjárat egy folyamatban a család minden koinóját futtatja (D119) — ugyanazzal a
  programmal, tehát ugyanazzal a MAGGAL. A lap koinónként kimondja, ha a futó mag nem a koinóé (D123 ①).
- **A kártyát bárki feltöltheti**, aki tag (a D14 pontjával). A kártya pontja a közösség jelzése, nem engedély.

## 4. A javaslat — a menet

1. **A lap a kártyán** („🧬 Kód” fül mellett): „⬇ Telepítés erre a készülékre…” — és a kézi út, egy parancs (`telepit <kártya>`;
   4. szabály).
2. **Az előnézet** (a telepítés előtt, egy ablakban): ki tette fel, hány pont van rajta; rétegenként mi változik a FUTÓ
   programhoz képest — a **mag** (más-e; és ⚠️ melyik koinóidban lesz „más számítás” — TK3), a **felület** (`felulet/`), a **többi**
   (a protokoll és a helyi viselkedés — fájlnév szerint; a protokoll SZÁMAI csak futtatva derülnének ki, a lap a kártya kódját nem
   futtatja); a változott fájlok listája (a „Kód” fülön olvashatók); és kimondva: *„a kód a kulcsaiddal fog futni — a lenyomat azt
   bizonyítja, hogy ez az a kód, amit a kártya megnevez, azt nem, hogy jó”*.
3. **Ha nincs meg minden fájl**, az előnézet megmondja (pl. „312/367”), és felajánlja az elhozást (a meglévő törzs-kérelem) — csak
   teljes, ellenőrzött kóddal telepít (TK4).
4. **A kiírás:** a kód a `koino-uj`-ba, fájlonként a lenyomata szerint; a kiírt mappa jegyzéke = a kártya `kod`-ja (a 2. lelet
   javítása óta ez teljesül).
5. **A csere a mai lánc** (TK1): a program az ÚJ mappa telepítőjét hívja — ugyanúgy, mint a telepítő sor —, az leállítja a futó
   régit, cserél, és indít; a lap a csere után az új programmal nyílik újra.
6. **A visszaút** (TK5): a régi a `koino-regi`-ben marad (a következő cseréig) — „↩ Vissza az előző programra” a lapon és egy
   parancs.

## 5. A kérdések (⏸️ Csabáé)

- **TK1 — Hol és hogyan cseréljen?** (A) ⭐ **a mai frissítés láncán:** a kód a `koino-uj`-ba, és onnan az új telepítő cserél
  (leállítás, `koino-regi`, az új a helyére, indítás) — a Windowson ez ma is így megy (PR7); a telefonon a csere új (ma a git
  frissít helyben), és ⚠️ a `~/koino` git-tár: a javaslat, hogy a `.git` mappa az új programmal MEGY (a munkakönyvtár a kártyáé, a
  git-tár marad) — így a telepítő sor később is frissít (a `git reset` a GitHub legújabbjára állítja; a kártya kódját felülírja,
  ahogy ma is); (B) verziónként külön mappa és egy mutató az adat-mappában, melyik fut (több visszaút, de az indítók, a telepítő sor
  és a lap is a mutatót követné — több új rész).
- **TK2 — Mit mondjon a lap előtte, és legyen-e küszöb?** (A) ⭐ **az előnézet (4. 2.), küszöb nélkül:** a szerző, a pont, a
  rétegenkénti változás, a mag koinónként, a figyelmeztetés — és az e-ember dönt (a jelenlét személyes; a pont tájékoztat);
  (B) küszöb: csak a koinó legtöbb pontú kártyája, vagy egy pont-arány fölött telepíthető (a közösség „engedélye” — de a pont
  prioritás, nem szavazat: D-fogalom).
- **TK3 — Ha a kártya magja más, mint egy koinódé?** Egy program fut a készüléken (D119), tehát a család minden koinója az új maggal
  számol: ahol a koinó más maggal született, ott a lap „⚠ más számítás”-t mond (a koinó képe ott eltérhet a többiekétől). (A) ⭐
  **kimondva, nem tiltva:** az előnézet megnevezi ezeket a koinókat („a Szülő-koinóban más számítással futnál — ha ott maradsz, a
  régit futtasd”), a telepítés mehet; (B) tiltva, amíg az érintett koinóban tag vagy (biztonságosabb, de aki átköltözött, a régit
  még nem hagyta el — a szülőben maradó tagságot a mai program nem tudja „elhagyottnak” látni); (C) koinónként külön program (a
  családi őrjárat több folyamat) — nem most: a D119 egy folyamatra épült.
- **TK4 — Ha nincs meg minden fájl?** (A) ⭐ **az előnézet kimondja és felajánlja az elhozást** (a törzs-kérelem — a vállalóktól),
  telepíteni csak a teljes kóddal lehet; (B) a telepítés maga kéri el, és vár (egy gombnyomás, de a lap percekig „telepít”, és a
  hiba oka elmosódik: a hálózat vagy a kód).
- **TK5 — A visszaút és a nem induló program.** (A) ⭐ **a régi a `koino-regi`-ben marad** (a következő cseréig — mint a PR7-nél),
  „↩ Vissza az előző programra” a lapon és parancsként; és ⭐ ha az új program 30 mp-en belül nem felel (a felület nem indul — egy
  hibás kód), a telepítő a régit teszi vissza és indítja, kimondva; (B) csak a kézi visszaút (egyszerűbb, de egy el sem induló
  programból a lap nem érhető el — a visszaút akkor a parancssoré).

## 6. Amit ez nem old meg (kimondott határok)

- **A kód jóságát.** A lenyomat csak azt bizonyítja, hogy a kód az, amit a kártya megnevez. A védelem az éberség (a kód olvasható a
  „Kód” fülön, az előnézet a változott fájlokat mutatja) és a kilépés joga (D123 PR5).
- **A Node-ot.** A kártya a programot hozza, a futtatót nem; egy Node-ot igénylő változás (új beépített modul) a régi Node-on nem
  indulna — a TK5 (A) ezt is visszafordítja.
- **A koinónkénti programot** (TK3 (C)) — egy készülék egy programot futtat.
- **A protokoll SZÁMAIT előre** — a nyelv, a szállítás és a kiírt alakok változata a kártya kódjából csak futtatva derülne ki; a
  lap a kártya kódját nem futtatja. A kimondás a telepítés UTÁN jön (D124 ③ — a társak felé).

## 7. Az építés sorrendje (ha a kérdések eldőlnek)

✅ **A 91. mérés lelete** (a git nélküli bejárás a telepítőket is viszi — elágazás 246) → ✅ ① **a kiírás és az ellenőrzés** → ✅ ②
**a csere** a két platformon és a **visszaút** → ✅ ③ **a lap** → ⏭️ ④ **terepi próba** (laptop + telefon: egy kártyáról telepítve,
és vissza). *(Megépült 2026-11-07/08 — elágazás 247:* **① a kiírás** (`js/tar/programTelepites.js` `kodKiirasa`: előbb minden fájl beolvasva és ellenőrizve — megvan-e, a mérete és a lenyomata a jegyzéké-e, az útja biztonságos-e —, csak utána ír; a kiírt mappa kód-csomagja a kártya `kod`-ját kell nevezze, különben törlődik; megnevezett hibák: `HIANYZO-FAJL`, `ROSSZ-FAJL`, `TILTOTT-UT`, `KIIRT-MAS`) és **az előnézet** (`telepitesElonezete` — a szerző, a pont, a fájlok állása, a rétegek: `valtozasRetegei`, a mag koinónként: a készülék koinóinak születési magja a kártya kódjáéhoz képest) · **② a csere** a FUTÓ program saját szkriptjével (`windows/csere.ps1`, `termux/csere.sh` — az adat-mappába másolva, leválasztva): leállít, a régi a `-regi`-be (a telefonon a `.git` az új programmal megy), az új a helyére, indít (Windowson egy új ablakban, mint az asztali ikon; a telefonon a háttérben), és 30 mp-ig vár, hogy feleljen — ha nem, a régit teszi vissza (a nem induló a `-hibas`-ba); a visszaút a `-regi`-vel helyet cserél; az eredmény az adat-mappa `telepites.json`-ja (és `telepites.log`). ⛔ **Mérve:** a leválasztott (`detached`) PowerShell konzol nélkül azonnal kilép — ezért egy rövid PowerShell a `Start-Process`-szel indítja a szkriptet, saját rejtett ablakban; a kártya és a kód neve base64url (kötőjellel is kezdődhet — a PowerShell paraméternévnek venné): környezetben megy; a szkript 4 mp-et vár a leállítás előtt (1,5 mp alatt a hívó felület a válasza előtt leállt). **A parancs:** `telepit` (az állapot) · `telepit <kártya>` (az előnézet) · `telepit <kártya> kiir` · `telepit <kártya> igen` · `telepit vissza`. · **③ a lap:** a „🧬 Kód” fül „⬇ Telepítés erre a készülékre…” gombja → az előnézet (`felulet/js/koinoTelepites.js`) → „Igen, telepítem”; a fő menü „🧬 A program ezen a készüléken…” (a kód, az utolsó telepítés, „↩ Vissza az előző programra”); a lap kulcsa indításonként új, ezért a régi fül a RÉGI kulcsával figyel (ha a válasz „engedély nincs”, már az új fut), az új program a saját lapját nyitja meg, és az az eredményt betöltéskor egyszer kimondja. Böngészőben végigjárva (a telepítés és a visszaút). **A próbák:** `meres/telepitesProba.js` (8 — a kiírás szabályai, a csere helye, a rétegek, az éles út két programmal, a lap útjai, a valódi windowsos csere előre és vissza, a TK5 visszafordítás, a telefon szkriptje a Git Bash-sel a valódi `indit.sh`-val), a meghívó-próba a `csere.ps1` BOM-jával és értelmezésével; 16 rontás, mind bukik. ⚠️ **A terepen próbálandó:** a telefon futó koinójának leállítása (`pkill` — itt nincs) és a háttérben indulás; egy valódi koino-verzió kártya egy másik készülékről.)*

*Kapcsolódik:* `program_retegek_atvizsgalas.md` (D123, PR5), `csaladi_orjarat_atvizsgalas.md` (D119 — a koino-verzió kártya, a
kód-csomag), `torzs_hatar_atvizsgalas.md` (D120 — a kártya kódja elemként), `meres/eredmenyek.md` 91., `windows/telepit.ps1` és
`termux/telepit.sh` (a mai frissítés lánca).
