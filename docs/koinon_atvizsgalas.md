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
2. **Mi van benne:** az elfogadott általános egyezmény tömör alakjának eseményei — a javaslat, a döntés tömör alakja (lásd KO7), az
   állásfoglalások, a minták eseményei. A darab a vonalon SZELETKÉNT megy (a gyökér-darab mintájára — felismerhető kulcs).
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
