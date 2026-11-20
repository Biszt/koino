# A koinon — a közös tények őrzése (D130 — átvizsgálás, kód előtt)

*Csaba (2026-11-19): „hozzunk létre, egy koinon-t ami maga a program azon tárhelye, amit darabokban, replikálva, őriz meg, és neki,
mondjuk végtelen tudatpontja lenne, és minden entitást, 1 tudatpontal hozza létre. és itt, most eszembe jutott az, hogy az általános
egyezmények, mikor megszületnek, akkor azok kapnak, 1 tudatpontot a koinon-tól is, ezáltal biztosítva a létét.” — „rendben. jöhet az
1-es, aztán mehetsz tovább a 2-essel.”*

Az 1. lépés megépült (D129): a kézikönyv minden bejegyzése 1 passzív koinon-pontot kap (`js/esemeny/rendszerEntitas.js` `KOINON`), és
mivel kicsi, mindenki tartja. Ez a dokumentum a 2. lépés: **a koinon az általános egyezményekhez, a darabokra osztott, replikált
őrzéssel.** A görög koinón a közösséget, a közös ügyet jelenti — innen a „koino” is.

## 1. A mai helyzet (a kódból)

- **Az általános egyezmény egy entitás** (D27): a javaslat entitása, amely elfogadva egyezmény lett. A pontjai: a javaslattevő kezdő
  pontja (100) és a szavazók 1-1 pontja a javaslaton (D85/2).
- ⛔ **Ha mindenki leveszi róla a pontját, a D14 elfelejti** (`allapotSzamitas.js` — a 0 pontú entitás kiesik). A tárolás is a
  pontokhoz kötött (a szigorú (b) — D97): a szeletét az tartja, akinek pontja van rajta, a levétel után még 24 óráig (a kifutás —
  D104). Utána az események a hálózatból is eltűnhetnek.
- ⛔ **Ez ellentmond a D27-nek:** *„A TÉNY örök (ez az egyezmény akkor, ott, érvényesen megszületett), a HATÁLY viszont él: hányan
  állnak mögötte MOST.”* (`muveletek.js`, az állásfoglalás kommentje). A hatály élő — de ma maga a tény is elveszhet.

**Ami már megvan, és amire építeni lehet:**
- **a koinon** (D129): passzív, számított pont — nem e-ember, nem szavaz, a részvétel nevezőjébe nem számít, senki nem írja alá;
- **a lezárási összegzés** (D95/1, `lezarasiOsszegzes.js`): egy lezárt döntés tömör, mintavétellel ellenőrizhető bizonyítéka — a
  végső számok, a küszöbök, a lezárás ideje és három fa gyökere (a szavazatoké, a nevezőé, az érték javaslatoké); a nyers szavazatok
  nélkül is ellenőrizhető;
- **a gyökér-darabok** (D95/4, `cimjegyzek.js`): a készülék a kulcsa szerinti darabot vállalja, a mélysége ±1 szintjén is — ⚠️ de ott
  a darabok számát az ELEMEK száma adja, nem a készülékeké: egy darabnak nem garantált tartója;
- **a skálázási terv 5.2** (Csaba korábbi mondata: *„nem egy eszközön kell rajta lennie, hanem elosztva, mindig a kellő mennyiségűre
  replikálva”*): a példányszám közösségi paraméter, és kell egy fenntartó kör, ami észreveszi, ha egy darab tartói megfogytak.

## 2. A javaslat

1. **A koinon pontja:** egy általános javaslat a LEZÁRÁSA pillanatától, ha elfogadták, 1 passzív koinon-pontot kap — ugyanúgy, mint a
   kézikönyv: számított (a döntésből), minden készülék ugyanúgy kiszámolja, és örökre. A D14 így rá is kivétel nélkül igaz.
2. **Az őrzés — a koinon darabjai:** egy egyezmény az azonosítója szerint egy darabba esik. Minden készülék a kulcsa szerinti darabot
   vállalja egy olyan mélységen, hogy minden darabnak ~`r` tartója legyen (a készülékek számából becsülve), és a szomszéd szintet is
   (átfedés — ha egy darab tartói megfogynak, a durvább szint tartói még őrzik). Egy készülék terhe így ~`egyezmények × r / készülékek`
   — a koinó növekedésével nem nő egy készülékre.
3. **Mit őriznek:** az egyezmény tényét és a hatályát — a javaslatot, a döntés tömör bizonyítékát (a lezárási összegzést), és az
   állásfoglalásokat (csatlakozik / tiltakozik / ütközik — e-emberenként az utolsó, tehát a tagok számával korlátos). A nyers szavazatok
   nem kellenek (a lezárási összegzés bizonyít helyettük); kis döntésnél a teljes esemény-készlet is lehet.
4. **A fenntartó kör:** az őrjárat ritkán (órás ütemben) megnézi, hány tartója van a darabjainak; ha kevés, a szomszéd szint
   tartóitól átveszi. Ez az 5.2 „külön munkája” — eddig sehol nem épült meg.

## 3. A kérdések (Csabáé)

- **KO1 — mi kap koinon-pontot?** (A) csak az elfogadott általános egyezmény ⭐ — a szerkesztési egyezmény hatása a gondolaton él (a
  gondolat a saját pontjaival marad meg), az elvetett javaslat nem egyezmény; (B) minden lezárt javaslat (az elvetett is — „a nem is
  tény”).
- **KO2 — ki őrzi?** (A) a koinon darabjai, a készülékek kulcsa szerint, ~`r` tartóval és a szomszéd szint átfedésével ⭐; (B) mindenki
  mindet (egyszerű, de egymillió egyezménynél nem fér el egy telefonon); (C) csak a „hely” tartói (akik az egyezmény feletti gondolaton
  pontot tartanak) — nem garantált, ha ők is elmennek.
- **KO3 — mit őriznek?** (A) a tényt és a hatályt tömören: a javaslat, a lezárási összegzés, az állásfoglalások ⭐; (B) a döntés minden
  eseményét (a szavazatokkal együtt — nagy döntésnél százezres).
- **KO4 — mennyi a példányszám (`r`)?** A skálázási terv szerint közösségi paraméter (D13/c — a koinó születésében, mint a többi
  szabály), az alapértéke mérésből: ha egy készülék az idő 30%-ában elérhető, 10 példánynál 97% az esély, hogy legalább egy válaszol,
  20-nál 99,9%. ⭐ Javaslat: alapból 20, a koinó születése mondja ki.
- **KO5 — a kézikönyv?** Most mindenki tartja (kicsi). (A) maradjon így ⭐ — ha egyszer nagy lesz, ugyanide költözhet; (B) már most a
  koinon darabjaiba.

## 4. Amit az építés előtt mérni kell („mérj, ne saccolj”)

1. Egy általános egyezmény tömör alakjának mérete (a javaslat + a lezárási összegzés + az állásfoglalások) — kicsi és nagy döntésnél.
2. A darab-mélység becslése a készülékek számából: honnan tudja egy készülék, hány készülék van (a tagság, a címjegyzék, a raj)? Egy
   szimuláció: a becslés hibája mellett hány darab marad `r`-nél kevesebb tartóval.
3. A fenntartó kör terhe: hány üzenet/óra egy készülékre, egymillió tagnál.

## 5. A 95. mérés és az építés terve

**A mérés** (`meres/eredmenyek.md` 95.): a tömör alak 20–26 KB (a teljes döntés 1000 szavazónál 2,3 MB); a darabok tartói átfedés NÉLKÜL
is 13–31 a legrosszabb esetben (r = 20, kétszeres–négyszeres becslési hibával), átfedéssel a teher 3–6-szoros. Két lelet:
- ⛔ **a minta helyei a tömör alak saját lenyomatából** (a javaslat és a fák gyökerei — semmi szabadon választható mező): különben egy
  később érkező tartó a nyers szavazatok nélkül nem ellenőrizhetné; így az építő sem sorsolhat újra kedvezőbb helyeket;
- ⚠️ **a készülékszám becslése az ismert tagokból**: azt alá lehet becsülni (az csak terhet hoz), túl nem — a túlbecslés a veszélyes oldal.

**KO6 — az átfedés** (a KO2 (A) része volt: „a szomszéd szint átfedésével”): (A) ⭐ elhagyjuk — a mérés szerint nélküle is minden
darabnak 13+ tartója marad, az átfedés pedig háromszoros terhet hoz; (B) marad (a legrosszabb darab 47+ tartó, 4–6-szoros teher).

**Az építés:**
1. **A koinon-pont az egyezményen** (a mag): az elfogadott általános egyezmény a lezárásától 1 passzív koinon-pontot kap. ⚠️ A sorrend
   csapdája: a D14 az első fázisban fut, a döntés a másodikban — a 0 pontú egyezményt az első fázis már elfelejtené. A harmadik fázis
   (a végrehajtás) ezért a születéséből visszaveszi.
2. **A tömör alak**: a lezárási összegzés a saját lenyomatából kijelölt mintával (`lezarasiOsszegzes.js`), és a koinon-csomag (a
   javaslat, az összegzés, a minta, az állásfoglalások).
3. **A koinon darabjai**: a mélység az ismert tagokból (`floor(log2(tagok / r))`, r a születésből — KO4), a készülék a kulcsa szerinti
   darabot vállalja (`vallalas.js`), a csere a darab szeletét egyezteti (mint a gyökér-darabét); a kézikönyv is ide költözik (KO5 (B)).
4. **A fenntartó kör**: a darab hirdetése és a tartóinak megszámlálása a címjegyzéken, órás ütemben.
5. **A terep.**

## 7. A ③ terve — a koinon darabjai (2026-11-20, kód előtt)

**Ami megvan, és amire épül (a kódból):** a darabolás eszköze (`cimjegyzek.js` `keszulekDarabjai(so, aláíró, bitek)` — a készülék
tábla-aláírójából, egy CÉLHOZ kötött sóval; a gyökér és a kereső-réteg már így oszt), a darab mint SZELET a vonalon (`szeletEgyeztetes.js`
— a gyökér-darab felismerhető kulcsa; a halmaza egy eseménylista), a tömör alak (②) és az ellenőrzött lezárási összegzés útja a
döntésbe (D95/1 — `osszegzesek`). ⭐ A kapu az ismeretlen ESEMÉNYTÍPUST nem tiltja (csak a mezők alakját nézi): egy új típust a régi
program átenged és tárol, csak nem érti — nem törés.

**A terv:**
1. **A darab:** `keszulekDarabjai('koinon', aláíró, bitek)`, `bitek = floor(log2(ismert tagok / r))` (r a születésből — KO4; a régi
   születésben nincs: 20). Egy egyezmény a javaslata azonosítója szerint esik egy darabba (ugyanaz a lenyomat, mint a gyökér-darabé).
   ⚠️ *Az építéskor pontosítva (③c):* ugyanaz a számítás, a koinon SAJÁT sójával (a készüléké és az egyezményé is) — így a koinon
   tartói nem ugyanazok, mint a gyökér-darabé; és a cserében a két mélység közül a mélyebbik darab a közös (a napló).
2. **Mi van benne:** az elfogadott általános egyezmény tömör alakjának eseményei — a javaslat, a döntés tömör alakja (lásd KO7), az
   állásfoglalások, a minták eseményei. A darab a vonalon SZELETKÉNT megy (a gyökér-darab mintájára — felismerhető kulcs).
   ⚠️ *Az építéskor pontosítva (③c, a napló 2026-11-20):* a javaslat és a minták eseményei a `KoinonOsszegzes`-be BEÁGYAZVA utaznak,
   így a darab két fajtát hord: a `KoinonOsszegzes`-t és az állásfoglalásokat.
3. **A tartó döntése:** az ellenőrzött tömör alak a meglévő úton (D95/1 `osszegzesek`) adja a döntést — így a darab tartója a teljes
   szelet nélkül is tudja: elfogadva → a koinon pontja (①) → az egyezmény él.
4. **A kézikönyv** (KO5 (B)): a bejegyzései a darabokba, az azonosítójuk szerint (a „mindenki tartja” helyett).

**A kérdések (Csabáé):**
- **KO7 — hogyan utazik a döntés tömör alakja** (az összegzés nem esemény)? (A) ⭐ egy új ALÁÍRT eseményben (`KoinonOsszegzes`: a
  tömör alak a hivatkozott események nélkül) — a meglévő csere-úton, a régi program átengedi (nem törés); bárki ellenőrzi (a minták
  önállók — ②), tehát az aláíró nem kap bizalmat, csak a nevét adja; (B) egy új üzenet a cserében — protokoll-törés (D124: új
  nyelvváltozat, a régiekkel nem beszél).
- **KO8 — ki írja meg?** (A) ⭐ bárki, aki a döntés teljes bemenetét tartja, és még nem lát érvényeset (a lezárás után — az őrjárat);
  ha több is készül, a tartó egyet tart meg (a legkisebb azonosítójút) — a tartalmuk úgyis ugyanaz; (B) csak a javaslattevő — ha ő
  eltűnik, sosem készül el.
- **KO9 — a kézikönyv a darabokban — a következmény most látszik:** a közösség módosításait az a készülék, amelyik a bejegyzés darabját
  nem tartja, csak KÉRÉSRE látja (mint bármely nem tartott kártyát — a program szövege mindenkinél ott van, a módosítás egy kérésnyire,
  a buborék kéri). (A) ⭐ így rendben (a KO5 (B) szerint — a kézikönyv a koinóval nőhet); (B) a kézikönyv maradjon mindenkinél (a KO5
  visszavonása — kicsi, és az ⓘ így mindig azonnal a közösség szövegét mondja).

## 6. Napló

- **2026-11-19** — az átvizsgálás (kód nélkül); a KO1–KO5 Csabánál.
- **2026-11-19** — ✅ **Csaba: „ko1-4: (A) ko5: (B)”** → **D130** (`fejlesztesi_terv_fazis2.md`). A KO5 (B) a D129 „a kézikönyv
  szeletét mindenki tartja” következményét váltja: a kézikönyv is a koinon darabjaiba kerül. ⏭️ A 95. mérés (a 4. szakasz három
  kérdése), utána az építés terve.
- **2026-11-19** — a 95. mérés (`meres/koinonMeres.js`): a tömör alak 20–26 KB, a darabok átfedés nélkül is 13+ tartóval; két lelet
  (a minta a tömör alak saját lenyomatából; a becslés az ismert tagokból). ⏸️ KO6 (az átfedés) Csabánál. Az építés terve: 5. szakasz.
- **2026-11-19** — ✅ **Csaba: „ko6: (A)”** — átfedés nélkül (a D130 3. pontja átvezetve). ⏭️ Előbb a D129 ④ (a szövegek), utána a D130
  építése (az 5. szakasz 1–5. lépése).
- **2026-11-20** — ✅ **az ① kész: a koinon pontja az elfogadott általános egyezményen** (a mag — Csaba: „rendben, mehetünk tovább”).
  `allapotSzamitas.js` `koinonPontokRa` (EGY forrás: 1 passzív pont, kétszer nem; a tagok pontjai után — a hozzájárulók sorrendje
  mindkét úton ugyanaz) és az első fázis `koinonEgyezmenyek` beállítása (a pont a D14 ELŐTT); `ketReteg.js` `haromFazis` (most
  exportálva): a döntés után az elfogadott általános egyezmények entitásai (a javaslaté, több érintettnél a töredékeké; a múlt
  rögzített döntései is) — ha egyiket sem felejtette el az első kör, a pont HELYBEN kerül rá; ha igen (mindenki levette a pontját), az
  első két fázis ÚJRA fut a halmazzal, így az egyezmény a helyén marad a gyerekeivel (a sorrend csapdája — 5. szakasz). A koinon nem
  szavaz, a nevezőbe nem számít; a lezárt döntés nem változik. Próba: +2 (`egyezmenyProba.js` — a lezárás után, csak az elfogadott
  általános; a pont nélküli megmarad a helyén és a gyerekével, az elvetett elfelejtődik), 6 rontás mind bukik; az `allapot` csoport
  389/389, a D123 mag-próbái 6/6. ⚠️ A mag változott (D123: más számítás — a mostani teszt koinókban a lap kimondja). ⏭️ ② a tömör alak.
- **2026-11-20** — ✅ **a ② kész: az egyezmény tömör alakja** (`js/allapot/koinonCsomag.js` — NEM a mag része): a javaslat, érintettenként
  a lezárási összegzés és a mintái, az állásfoglalások (e-emberenként az utolsó — ugyanaz a szabály, mint a hatálynál). ⭐ A minta
  helyei az összegzés SAJÁT lenyomatából (`lezarasiOsszegzes.js` `onalloMintaHelyek` — UGYANAZ a sorsoló, csak a véletlen forrása a
  lenyomat-lánc; a 95. mérés lelete): bárki ugyanazokat számolja, az építő nem választhat helyet, és az ellenőrző a helyeket MAGA
  számolja. ⛔ **Lelet (a méret mérése):** a beágyazott alak 13 szavazónál 83 KB — 66 KB-ja ismétlés (52 mintában 17–32 különböző
  esemény, mindegyik a kísérő tanúsítványával); ⭐ most minden esemény és tanúsítvány EGYSZER (táblában), a minták, a javaslat és az
  állásfoglalások hivatkoznak: 13 szavazónál ~35–44 KB, 301-nél ~91 KB (a 95. mérés becslése — 20–26 KB — kihagyta a négy küszöb-napló
  mintáit és a tanúsítványokat: helyesbítve az `eredmenyek.md`-ben). Próba: +4 (`koinonCsomagProba.js`, az `allapot` csoportban — az
  építés és az ellenőrzés a nyers szavazatok és az építő nélkül; a helyek önállósága; kilenc hamisítás; az elvetett egyezmény), 8 rontás
  mind bukik; a lezárási összegzés próbái 12/12, a D123 mag-próbái 6/6. ⏭️ ③ a koinon darabjai.
- **2026-11-20** — a ③ terve (7. szakasz); ✅ **Csaba: „elfogadom, a javaslataidat, mehetünk tovább”** — KO7 (A) a tömör alak egy új
  aláírt eseményben (`KoinonOsszegzes`), KO8 (A) bárki írja, aki a teljes bemenetet tartja, KO9 (A) a kézikönyv a darabokban (kérésre
  látszik). ⏭️ A ③ építése: ③a az esemény (alakja, ellenőrzése a tárból), ③b ki és mikor írja (az őrjárat), ③c a darab a vonalon és a
  vállalásban, ③d a tartó döntése (D95/1 út), ③e a kézikönyv a darabokba, ③f az `r` a születésben (KO4).
- **2026-11-20** — ✅ **a ③a kész: a `KoinonOsszegzes` esemény.** `koinonCsomag.js`: az ellenőrzés közös MAGJA
  (`tomorAlakEllenorzese` — a csomagé a tábláiból, az eseményé a tárból kapja a hivatkozott eseményeket, a kísérővel; az ellenőrzött
  összegzéseket is visszaadja a ③d-nek), `koinonOsszegzesAdata` (a csomag döntés-része — ⛔ az állásfoglalások NEM: a hatály él),
  `koinonOsszegzesEllenorzese` (a tartalom — az aláírást a kapu nézi; a javaslat szeletében kell élnie); `muveletek.js`
  `koinonOsszegzesKiadasa`; `esemeny.js` `bejelentesHelyei` (az érintettjeinél is hír, mint a `LezarasiOsszegzes`, legfeljebb 64);
  `koinoLanc.js` (a múlt rétegéé — a gyermek jelenébe nem jön át). A kapu átengedi (az ismeretlen típust nem tiltja, méret-korlátja
  nincs). Próba: +1 (`koinonCsomagProba.js`), 3 rontás mind bukik.
- **2026-11-20** — ✅ **a ③b kész: ki és mikor adja ki** (KO8 (A)). `koino.js` `koinonOsszegzesekKiadasa` (a koinó-példány része, a
  lezárási összegzés kiadásának mintájára): a jelen réteg elfogadott általános egyezményei közül ott, ahol a javaslat szeletét és
  minden érintettjéét EGÉSZÉBEN tartom (a vállalásomban, nem összegezve — ⛔ egy hiányzó szavazattal hamis összegzés születne);
  kihagyja, ahol már én kiadtam, vagy ahol a javaslat szeletében már van érvényes (bárkitől); a kiadás előtt a saját csomagját is
  ellenőrzi. Az őrjárat háztartása hívja (a lezárási összegzés után), és kézzel a `koinon` parancs (listáz is: van-e érvényes tömör
  alak). Próba: +1 parancssor (a teljes tartó kiadja, a második kör nem), 1 rontás bukik. ⚠️ Próba nélkül: a „teljes bemenet”
  feltétele (ahhoz két készülék kell, egy részleges tartással) — a terepen.
- **2026-11-20** — ⭐ **a ③c előtt: a `KoinonOsszegzes` BEÁGYAZVA** (a KO7 (A)-n belül — továbbra is egy aláírt esemény a meglévő
  csere-úton). ⛔ **Lelet (a darab tervezésekor, a kódból):** a fogadó egy eseményről MAGÁBÓL dönti el, hogy átveszi-e
  (`szeletEgyeztetes.js` `szeletbeTartozik` — a vonal ezzel szűr). A minták eseményei (egy tudatpont-rendezés, egy érték javaslat)
  a saját szeletükben laknak, magukról nem mondják meg, hogy egy koinon-darab részei — hivatkozva a darab tartója nem kapná meg
  őket, és a tömör alak nála ellenőrizhetetlen maradna. ⭐ Ezért az esemény a csomag tábláit is hordja (a javaslat és a minták
  eseményei egyszer, a tanúsítványaik készülékenként egyszer — a döntési és a tagsági csomag mintájára), és **önmagából
  ellenőrizhető, tár nélkül**. Az állásfoglalások továbbra sem (a hatály él — D27), és a táblából is kimaradnak a csak általuk
  használt események és tanúsítványok. Mérve: 13 szavazónál az esemény 33,0 KB (15 esemény, 9 tanúsítvány) — a csomag 34,4 KB; a
  vonal sor-korlátja 8 MB. `koinonCsomag.js`: `tablaFeloldo` (a csomag és az esemény közös tábla-olvasója), `koinonOsszegzesAdata`
  (a táblák, szűrve), `koinonOsszegzesEllenorzese(e)` (olvasó nélkül); `koino.js` két hívása ennek megfelelően. Próba: a ③a
  átírva (önmagából ellenőriz; a hiányos esemény a táblából hiányzik; a táblák benne, az állásfoglalások eseményei nem), 5 rontás
  mind bukik; a ③b parancssori próbája rendben. ⏭️ A ③c: a darab — a kulcsa, a bejelentése, a vonalon és a vállalásban.
- **2026-11-20** — ✅ **a ③c kész: a koinon darabja a cserében** (KO2 (A), KO6 (A) — a gyökér-darab mintájára). `cimjegyzek.js`: az
  `n` jelű darab-kulcs (a gyökér `g`-je és a kereső-réteg `k`-ja mellett), a koinon saját sója, a mélység `koinonMelysege(tagok, r)` =
  `floor(log2(tagok / r))` (2r tag alatt 0: egy darab, mindenki mindent tart); a készülék kulcsai a saját darabja és annak két fele.
  ⛔ **Lelet (a tervezéskor, a kódból):** a gyökér-darab a mélysége ±1 szintjén vesz részt, és a LEGSEKÉLYEBB közös darabot egyezteti
  — átfedés nélkül (KO6 (A)) ez rossz volna: a sekélyebb darab a mélyebb becslésű készüléknél csak félig van meg, a csere a másik felét
  is áttolná neki. ⭐ A koinonnál a közös darab a KISEBBIK (a mélyebb — `kozosKoinonDarab`), ezért a NYITÁS `knd` jele a saját darab
  mellett a két FELE lenyomatát viszi (a gyökéré a ±1 szintet): a szomszéd mélységű társ így pontosan a közös részt látja.
  `esemeny.js`: a `KOINON_KULCS` (virtuális tár-kulcs, mint a gyökéré a '' — nem darab-kulcs); a `KoinonOsszegzes` és az
  `Allasfoglalas` oda is bejelentődik (⚠️ a mag változott — D123; a régi tár pillanatképe az első olvasáskor újraépül, mint a
  D129-nél). `szeletEgyeztetes.js`: a darab halmaza a koinon kulcsához bejelentettek közül azok, amelyeknek az EGYEZMÉNYE (a
  szelet-kulcsuk) a darabba esik — egy egyezmény minden eseménye egy darabban —, a változat-jele és a fogadó szűrője. `vonal.js`: a
  `knd` jel, a közös eltérő darab, a részvétel; ⛔ a koinon kulcsa egészében sosem cserélődik („mindent” módban sem), a régi program
  (jel nélkül) semmit nem lát belőle, és a csere nem drágul. `koino.js`: `koinonMelysegem` (az ismert tagok — a horgonyok szerzői —,
  a tár eseményszáma szerint gyorsítótárazva; `r` = 20 a ③f-ig), a csere beállítása, a tömörítés megtartja a darabom eseményeit, a
  csak küldő út a saját koinon-eseményemet az egyezménye darabja alatt is felajánlja, és a `vallalas` kimondja (a mélység, az ismert
  tagok, a darab egyezményei és eseményei). ⚠️ A `vallalas.js` nem változott: a darab — mint a gyökéré — a csere, a tömörítés és a
  csak küldő út szintjén él. ⛔ A zárt koinó nem tagja nem kap belőle (a vonal korlátja, mint a gyökérnél) — a parancssori próba
  első futása ezen bukott (a vendég egy alapból zárt koinóba csak csatlakozott, nem lépett be): a kód helyes volt, a próba nyílt
  koinóval fut. Próba: +11 (`koinonDarabProba.js`, a `csere` csoportban), 12 rontás mind bukik; +1 parancssor (a szigorú vendég az
  egyezmény szelete nélkül megkapja a tömör alakot és az állásfoglalást, a `vallalas` kimondja, a tömörítés után is megvan), 2 rontás
  bukik; a `csere` csoport 488/488 + 2 ismert (a fél-jel előtt); ⭐ a TELJES sor (a mag és a csere változott): 1556/1556 + 2 ismert
  (a D124 két „valódi régi program” próbája). ⚠️ Próba nélkül: a `koino.js` csak küldő ágának koinon-kulcsa (a
  mechanizmust a darab-próba a saját kulcsaival méri; a valódi programban 1+ mélység kell hozzá — 2r tag —, és a darab helye a
  készülékkulcson múlik) — a terepen. ⏭️ ③d a tartó döntése (a D95/1 útján), ④ a darab hirdetése a címjegyzéken.
