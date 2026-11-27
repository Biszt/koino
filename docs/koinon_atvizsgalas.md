# A koinon — a közös tények őrzése (D130 — átvizsgálás, kód előtt)

*Csaba (2026-11-19): „hozzunk létre, egy koinon-t ami maga a program azon tárhelye, amit darabokban, replikálva, őriz meg, és neki,
mondjuk végtelen tudatpontja lenne, és minden entitást, 1 tudatpontal hozza létre. és itt, most eszembe jutott az, hogy az általános
egyezmények, mikor megszületnek, akkor azok kapnak, 1 tudatpontot a koinon-tól is, ezáltal biztosítva a létét.” — „rendben. jöhet az
1-es, aztán mehetsz tovább a 2-essel.”*

Az 1. lépés megépült (D129): a kézikönyv minden bejegyzése 1 passzív koinon-pontot kap (`js/esemeny/rendszerEntitas.js` `KOINON`), és
mivel kicsi, mindenki tartja. Ez a dokumentum a 2. lépés: **a koinon az általános egyezményekhez, a darabokra osztott, replikált
őrzéssel.** A görög koinón a közösséget, a közös ügyet jelenti — innen a „koino” is.

## 1. A mai helyzet (a kódból)

- **Az általános egyezmény egy entitás** (D27): az általános javaslat entitása, amely elfogadva általános egyezmény lett. A pontjai: a javaslattevő kezdő
  pontja (100) és a szavazók 1-1 pontja az általános javaslaton (D85/2).
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

## 2. Az ajánlás

1. **A koinon pontja:** egy általános javaslat a LEZÁRÁSA pillanatától, ha elfogadták, 1 passzív koinon-pontot kap — ugyanúgy, mint a
   kézikönyv: számított (a döntésből), minden készülék ugyanúgy kiszámolja, és örökre. A D14 így rá is kivétel nélkül igaz.
2. **Az őrzés — a koinon darabjai:** egy általános egyezmény az azonosítója szerint egy darabba esik. Minden készülék a kulcsa szerinti darabot
   vállalja egy olyan mélységen, hogy minden darabnak ~`r` tartója legyen (a készülékek számából becsülve), és a szomszéd szintet is
   (átfedés — ha egy darab tartói megfogynak, a durvább szint tartói még őrzik). Egy készülék terhe így ~`egyezmények × r / készülékek`
   — a koino növekedésével nem nő egy készülékre.
3. **Mit őriznek:** az általános egyezmény tényét és a hatályát — az általános javaslatot, a döntés tömör bizonyítékát (a lezárási összegzést), és az
   állásfoglalásokat (csatlakozik / tiltakozik / ütközik — e-emberenként az utolsó, tehát a tagok számával korlátos). A nyers szavazatok
   nem kellenek (a lezárási összegzés bizonyít helyettük); kis döntésnél a teljes esemény-készlet is lehet.
4. **A fenntartó kör:** az őrjárat ritkán (órás ütemben) megnézi, hány tartója van a darabjainak; ha kevés, a szomszéd szint
   tartóitól átveszi. Ez az 5.2 „külön munkája” — eddig sehol nem épült meg.

## 3. A kérdések (Csabáé)

- **KO1 — mi kap koinon-pontot?** (A) csak az elfogadott általános egyezmény ⭐ — a szerkesztési egyezmény hatása a gondolaton él (a
  gondolat a saját pontjaival marad meg), az elvetett általános javaslat nem általános egyezmény; (B) minden lezárt általános javaslat (az elvetett is — „a nem is
  tény”).
- **KO2 — ki őrzi?** (A) a koinon darabjai, a készülékek kulcsa szerint, ~`r` tartóval és a szomszéd szint átfedésével ⭐; (B) mindenki
  mindet (egyszerű, de egymillió általános egyezménynél nem fér el egy telefonon); (C) csak a „hely” tartói (akik az általános egyezmény feletti gondolaton
  pontot tartanak) — nem garantált, ha ők is elmennek.
- **KO3 — mit őriznek?** (A) a tényt és a hatályt tömören: az általános javaslat, a lezárási összegzés, az állásfoglalások ⭐; (B) a döntés minden
  eseményét (a szavazatokkal együtt — nagy döntésnél százezres).
- **KO4 — mennyi a példányszám (`r`)?** A skálázási terv szerint közösségi paraméter (D13/c — a koino születésében, mint a többi
  szabály), az alapértéke mérésből: ha egy készülék az idő 30%-ában elérhető, 10 példánynál 97% az esély, hogy legalább egy válaszol,
  20-nál 99,9%. ⭐ Ajánlás: alapból 20, a koino születése mondja ki.
- **KO5 — a kézikönyv?** Most mindenki tartja (kicsi). (A) maradjon így ⭐ — ha egyszer nagy lesz, ugyanide költözhet; (B) már most a
  koinon darabjaiba.

## 4. Amit az építés előtt mérni kell („mérj, ne saccolj”)

1. Egy általános egyezmény tömör alakjának mérete (az általános javaslat + a lezárási összegzés + az állásfoglalások) — kicsi és nagy döntésnél.
2. A darab-mélység becslése a készülékek számából: honnan tudja egy készülék, hány készülék van (a tagság, a címjegyzék, a raj)? Egy
   szimuláció: a becslés hibája mellett hány darab marad `r`-nél kevesebb tartóval.
3. A fenntartó kör terhe: hány üzenet/óra egy készülékre, egymillió tagnál.

## 5. A 95. mérés és az építés terve

**A mérés** (`meres/eredmenyek.md` 95.): a tömör alak 20–26 KB (a teljes döntés 1000 szavazónál 2,3 MB); a darabok tartói átfedés NÉLKÜL
is 13–31 a legrosszabb esetben (r = 20, kétszeres–négyszeres becslési hibával), átfedéssel a teher 3–6-szoros. Két lelet:
- ⛔ **a minta helyei a tömör alak saját lenyomatából** (az általános javaslat és a fák gyökerei — semmi szabadon választható mező): különben egy
  később érkező tartó a nyers szavazatok nélkül nem ellenőrizhetné; így az építő sem sorsolhat újra kedvezőbb helyeket;
- ⚠️ **a készülékszám becslése az ismert tagokból**: azt alá lehet becsülni (az csak terhet hoz), túl nem — a túlbecslés a veszélyes oldal.

**KO6 — az átfedés** (a KO2 (A) része volt: „a szomszéd szint átfedésével”): (A) ⭐ elhagyjuk — a mérés szerint nélküle is minden
darabnak 13+ tartója marad, az átfedés pedig háromszoros terhet hoz; (B) marad (a legrosszabb darab 47+ tartó, 4–6-szoros teher).

**Az építés:**
1. **A koinon-pont az általános egyezményen** (a mag): az elfogadott általános egyezmény a lezárásától 1 passzív koinon-pontot kap. ⚠️ A sorrend
   csapdája: a D14 az első fázisban fut, a döntés a másodikban — a 0 pontú általános egyezményt az első fázis már elfelejtené. A harmadik fázis
   (a végrehajtás) ezért a születéséből visszaveszi.
2. **A tömör alak**: a lezárási összegzés a saját lenyomatából kijelölt mintával (`lezarasiOsszegzes.js`), és a koinon-csomag (az
   általános javaslat, az összegzés, a minta, az állásfoglalások).
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
   születésben nincs: 20). Egy általános egyezmény a javaslata azonosítója szerint esik egy darabba (ugyanaz a lenyomat, mint a gyökér-darabé).
   ⚠️ *Az építéskor pontosítva (③c):* ugyanaz a számítás, a koinon SAJÁT sójával (a készüléké és az általános egyezményé is) — így a koinon
   tartói nem ugyanazok, mint a gyökér-darabé; és a cserében a két mélység közül a mélyebbik darab a közös (a napló).
2. **Mi van benne:** az elfogadott általános egyezmény tömör alakjának eseményei — az általános javaslat, a döntés tömör alakja (lásd KO7), az
   állásfoglalások, a minták eseményei. A darab a vonalon SZELETKÉNT megy (a gyökér-darab mintájára — felismerhető kulcs).
   ⚠️ *Az építéskor pontosítva (③c, a napló 2026-11-20):* az általános javaslat és a minták eseményei a `KoinonOsszegzes`-be BEÁGYAZVA utaznak,
   így a darab két fajtát hord: a `KoinonOsszegzes`-t és az állásfoglalásokat.
3. **A tartó döntése:** az ellenőrzött tömör alak a meglévő úton (D95/1 `osszegzesek`) adja a döntést — így a darab tartója a teljes
   szelet nélkül is tudja: elfogadva → a koinon pontja (①) → az általános egyezmény él.
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
  a buborék kéri). (A) ⭐ így rendben (a KO5 (B) szerint — a kézikönyv a koinoval nőhet); (B) a kézikönyv maradjon mindenkinél (a KO5
  visszavonása — kicsi, és az ⓘ így mindig azonnal a közösség szövegét mondja).

## 8. A ③d terve — a tartó döntése (2026-11-20, kód előtt)

**Ami a kódból látszik:** a darab tartója a ③c óta megkapja a `KoinonOsszegzes`-t és az állásfoglalásokat, de a képe az általános egyezményt
még nem ismeri: az általános javaslat eseménye csak a `KoinonOsszegzes` belsejében van (beágyazva), a tárban nincs.

**A terv (ehhez nem kell döntés — a 7. szakasz 3. pontja):** a tartó a tárában lévő `KoinonOsszegzes`-t ellenőrzi (önmagából), és ha
rendben: (1) a beágyazott általános javaslat eseményét a tárba menti (mint a két fokú tartás a lezárási összegzés szerkesztési vagy általános javaslatát — D95/1); (2) a
részek ellenőrzött összegzését a döntés kapja (`osszegzesek`, ugyanaz az út, mint a D95/1-é), ott, ahol az érintett szeletét nem
tartom egészében. Így a tartónál az általános javaslat elfogadva → a koinon pontja (①) → az általános egyezmény él — a helye (a gondolat, ami alatt áll)
nélkül is: a sosem látott szülőt a számítás nem bántja („hiány, nem tény” — D19). Az eredmény egy kis tárolóba kerül (ne kelljen
minden körben újra ellenőrizni), és a tömörítés a megmentett általános javaslatot megtartja. Ha egy általános javaslathoz több érvényes tömör alak van,
a legkisebb azonosítójú számít (KO8 (A)).

**⛔ A lelet (a kódból — `szabalyok.js`, az állásfoglalás joga):** állást az foglalhat, akinek pontja van az általános egyezmény helyén vagy
alatta (D27/4); a szabály ezt a szerző LÁNCÁBÓL és a FÁBÓL nézi. A darab tartója a hely ágát nem tartja: ma, amíg az általános egyezményt sem
ismeri, az állásfoglalás „nem ellenőrizhető” (számít, de jelölve — D19). ⚠️ A ③d után viszont az általános egyezményt ismerné, a helyét nem —
és a szabály ezt „nincs tudatpontod ezen az ágon” KIVÉTELNEK olvasná: egy hamis ítélet (a hiány tényként). Ugyanez a csapda, amit a
D85 T3 a szerkesztési javaslatnál és a szavazatnál a lánc-gyökeres önbizonyítással oldott meg — az állásfoglalás ezt sosem kapta meg. (A
szigorú (b) alatt ma is előfordul: aki a helyet tartja, de azt a mélyebb ágat nem, ahol a szerző pontja van.)

**A kérdés (Csabáé):**
- **KO10 — hogyan ítéljen a tartó az állásfoglalás jogáról, ha a hely ágát nem ismeri?** (A) ⭐ **nem ítél:** ha a helyet magát sem
  ismeri, az állásfoglalás „nem ellenőrizhető” (számít, de jelölve — a D19 szabálya, ugyanúgy, mint ma az ismeretlen általános egyezménynél).
  Kicsi (egy feltétel a szabályban, a mag része), a hatályt a tartó így mondja: „ennyien, ellenőrizetlenül” — a teljes ítélet annál,
  aki az ágat tartja; a szigorú (b) mélyebb-ág esetét nem javítja. (B) **az állásfoglalás maga bizonyítja a jogát** (a D85 T3
  mintája): a lánc-gyökeres állásfoglalás a szerző kiosztás-fájából hozza a pontját, és hogy az az entitás a hely alatt van — bárki
  ellenőrzi az ág nélkül. Teljes megoldás (a (b) esetét is javítja), de nagy: a „hely alatt van” bizonyítása az áthelyezések miatt
  nem egy születés-esemény, hanem egy út a fában; új mező, a kapu is nézi. (C) **a tartó a hatályt nem számolja** (csak a tényt
  őrzi: az általános egyezmény él, a hatály „nem ismert”) — az állásfoglalásokat csak továbbadja annak, aki ítélni tud.

## 9. A ③e terve — a kézikönyv a darabokban (2026-11-22, kód előtt)

**Ami ma van (a kódból):** minden kézikönyv-esemény (ami egy bejegyzés nevét hordja: a pont, az érték javaslat, a szerkesztési javaslat,
a szavazat, a lezárási összegzés — D129 ②) a kézikönyv GYÖKERÉNEK szeletébe is bejelentődik (`esemeny.js`), és ezt a szeletet mindenki
vállalja (`vallalas.js` — MA4 (B)). A koinon darabjai (③c) a koinon kulcsához bejelentett eseményeket az általános egyezményük (a
szeletük) szerint osztják el.

**A terv (döntés nem kell — a KO5 (B) és a KO9 (A) eldöntötte):**
1. **A bejelentés:** a kézikönyv-esemény a koinon kulcsához jelentődik be (a gyökér-szelet helyett). A darabját a bejegyzés NEVE adja (az
   azonosítója — `rendszerAzonosito`); több névnél (áthelyezés: a bejegyzés és a cél) mindegyiké. Egy helyen (`esemeny.js`
   `koinonHelyei`), és ezt nézi a darab halmaza (`szeletEgyeztetes.js`), a tartás és a tömörítés (`koinonMelysegem`), és a csak küldő út.
2. **A vállalás:** a kézikönyv gyökér-szelete helyett a darabomba eső bejegyzések (a program alap-tartalmának nevei és az eseményekben
   látott nevek) — így ezek kártyája „tartott”, a többié nem.
   ⚠️ *Az építéskor pontosítva (a napló 2026-11-22):* a vállalás a kézikönyvet nem tartja — csak a lap „tartott” jele kapja meg a darabom
   bejegyzéseit (a vállalásban 116 külön szelet volna: minden cserében ennyivel több egyeztetés, pedig az eseményeiket a darab hordja).
3. **A kérés (KO9 (A)):** a nem a darabomba eső bejegyzés közösségi módosítását a buborék és a Részletes adatok kéri. A kérelem a
   bejegyzés koinon-DARABJÁRA szól (a darab a döntés minden eseményét hordja, a szavazatokat is — a bejegyzés saját szelete nem), a
   megjegyzés kimondja, és a lap újrakérdez (a Részletes adatok mintájára).
4. **A régi gyökér-bejelentés megszűnik** — nem marad átmenetnek: a végleges alak ismert, és a koinok teszt koinok. ⚠️ A következménye: a
   régebbi programú készülék (pl. a telefon) a közösség új kézikönyv-módosításait a frissítéséig nem kapja meg (a régi gyökér-szeletben
   keresi). Kis koinoban (40 ismert tag alatt: egy darab — az egész koinon) minden készülék mindent tart: a változás a darabolás után látszik.

## 10. A ④ terve — a fenntartó kör (2026-11-26, kód előtt)

**Ami a kódból látszik:**
- **A címjegyzék-kör** (`koino.js` `cimjegyzekKor` — az őrjárat ~20 percenként; a DHT 30–60 perc alatt felejt, 58. mérés): a gyökér-darabomat,
  a kereső-régiómat és (a beállítás szerint, alapból 0) néhány vállalt szeletet hirdet a BitTorrent-DHT-n, vakított témán; minden hirdetett
  téma kopogtató PÁRJÁT figyeli (`cimjegyzek.js` `figyelendoKopogtatok`) — aki ott jelentkezik, felé a következő körben kopog (D92/1, a
  NAT mögött is). Egy téma ~3 KB (a `cimjegyzek.js` D92/1 megjegyzése).
- ⛔ **A koinon darabját ma senki nem hirdeti.** A darab kérelme (a buborék és a Részletes adatok — ③e) a `szelet` úton megy
  (`fuggoKerelemFelvetele`): a raj jegyzéke (a darab-kulcsot ott senki nem jelenti be), a kötéseim, az induló címek — és egy DHT-keresés a
  `szelet:<darab-kulcs>` témán, meg egy jelentkezés a párján; de azon a témán senki nem hirdet, és a párját senki nem figyeli. Vagyis ma a
  darabot csak az ismert társaim közül kaphatom meg.
- A tartó a darabot a vonalon kiszolgálja, ha az a saját darabja vagy annak egyik fele (`koinonMelysegem` `reszvetel`).
- Senki nem számolja, hány élő tartója van egy darabnak.

**⛔ Lelet (a kódból — a 95. mérés feltevése):** a mélység `floor(log2(ismert tagok / r))`, és az ismert tagok a horgonyok szerzői — az is,
aki évek óta nem nyitotta meg a koinot. A 95. mérés B) része a tartók számát úgy mérte, hogy minden ismert tag él. Ha a tagok fele elmegy,
egy darabnak ~r/2 tartója marad, és ez az idővel csak romlik: az ismert tagok száma soha nem csökken. Ez pontosan a 95. mérés „veszélyes
oldala” (a rendszeres túlbecslés) — csak nem a becslés hibájából, hanem abból, hogy a tagok elmennek. ⭐ A fenntartó kör ezért nem
kényelmi funkció: ez az egyetlen, ami az ÉLŐ tartókat méri.

**⛔ Lelet (számolva): egy órás pillanatkép nem dönthet.** A DHT csak az utolsó ~egy órában jelentkezett tartókat mutatja. Ha egy készülék az
idő 30%-ában elérhető, egy egészséges, 20 tartós darabnál átlagosan 6 látszik, és az órák 24%-ában 5-nél kevesebb; a 95. mérés legrosszabb,
13 tartós darabjánál átlagosan 3,9, és az órák 65%-ában 5-nél kevesebb — egy megfeleződött (10 tartós) darabnál 85%. A pillanatkép a kettőt
nem tudja szétválasztani. Ezért a számlálás egy hosszabb ablak (pl. 24 óra) KÜLÖNBÖZŐ hirdetőit gyűjti — de hogy ez mennyire pontos, az a
készülékek valódi elérhetőségén múlik, amit a koino még sosem mért (a skálázási terv 5.2 is „mérés kérdése”-nek mondja).

**A terv:**
1. **④a A hirdetés:** ha a koinon mélysége legalább 1 (különben egy darab van — az egész koinon —, és azt minden tag tartja: a gyökér
   hirdetése elég), a címjegyzék-kör a koinon-darabomat is hirdeti, a `szelet` fajtával a darab-kulcson. Így a kérő MEGLÉVŐ útja (a
   DHT-keresés és a jelentkezés a párján) változtatás nélkül megtalálja, és a tartó a párját magától figyeli (a `figyelendoKopogtatok` a
   `szelet` párokat már nézi). Hogy mit hirdet (csak a darabját, vagy a két felét is): KO11.
2. **④b A számlálás:** óránként egy keresés a saját darabom témáján — a hirdetők címei (magamon kívül) egy kis helyi jegyzékbe, időponttal;
   a jegyzék egy ablak (pl. 24 óra) különböző címeit adja. ⚠️ A cím nem készülék (egy készülék két címen is jelentkezhet, egy hamis hirdető
   sokon): a szám tájékoztató, nem bizonyíték (3. szabály). Kimondva: a `vallalas` sora („… · a darabomnak az utolsó 24 órában N tartója
   látszott”) és az őrjárat naplója.
3. **④c A válasz, ha kevés** (a 2. szakasz 4. pontja — „ha kevés, a szomszéd szint tartóitól átveszi”; a KO6 (A) óta átfedés nincs, így ez
   azt jelenti: eggyel sekélyebbre lépek, a szülő-darabot tartom, vagyis a testvér-darabot is): KO12.
4. **④d A próba:** a parancssoron, a születés kis `r`-jével (`koinonPeldany=1` — ③f) és egy helyi DHT-hálóval (a meglévő címjegyzék-próbák
   mintájára — `halo.belepo`): a tartó hirdeti a darabját, a kérő az ismert társai NÉLKÜL, a DHT-ről találja meg, a `vallalas` kimondja a
   látott tartókat; a válasz (KO12) a jegyzék adataival.

**A kérdések (Csabáé):**
- **KO11 — mit hirdessen a tartó?** (A) ⭐ **csak a saját darabját** (egy téma és a párja körönként — ~6 KB, napi ~0,5 MB a ~3 KB-os
  témából számolva, csak a 40+ tagú koinoban). A mélységet mindenki ugyanabból számolja (az ismert tagokból), így a tartók többsége egy
  mélységen van; egy kettes hatvány határán a fele eggyel mélyebben — ott a kérő a saját mélységű tartókat találja (a fele elég). (B) **a
  darabját és a két felét** (három téma — napi ~1,4 MB): a szomszéd mélységű kérő is mindet megtalálja.
- **KO12 — mit tegyen, ha a darabjának kevés tartója látszik?** (A) ⭐ **eggyel sekélyebbre lép** (a szülő-darabot tartja: kétszer annyi
  teher neki, a testvér-darabnak egy új tartó), amíg a darab tartói újra elegen nem lesznek; a küszöb (pl. 24 óra alatt r/2 különböző
  hirdető), az ablak és a visszalépés a **96. mérés** (szimuláció: elérhetőségi minták, elmenő tagok) szerint, az építés előtt. ⭐ Csak a
  biztonságos irányba hat: több tartó, több teher — kevesebb soha. Egy hamis hirdető-sereg legfeljebb a lépést akadályozza meg (akkor a
  95. mérés alap-becslése marad), egy elnémított DHT pedig csak terhet hoz. (B) **csak kimondja** (a `vallalas`, a napló) — a beavatkozás a
  terepi adatok után; addig a halott tagok miatti fogyás csak látszik, nem javul.

**A 96. mérés (2026-11-26, a KO11 (A) és a KO12 (A) után — `meres/eredmenyek.md` 96.):**
- ⭐ *Pontosítás (a mérés tervezésekor):* a KO12 (A) „ha a darabjának kevés tartója látszik” mondata így nem működne — aki sekélyebbre lép, a
  TESTVÉR-darabot kapja meg, a sajátjának nem lesz több tartója. A segítség a szomszédtól jön (a 2. szakasz 4. pontja: „a szomszéd szint
  tartóitól átveszi”): mindenki a testvér-darabja hirdetőit számolja, és ha kevés, a testvért is tartja.
- ⛔ **A lelet:** a DHT-n látott hirdetők száma főleg a SZÁMLÁLÓ saját elérhetőségét méri, nem a tartókét: egy 24 órás ablak a valódi tartók
  mediánban 53 / 27 / 11%-át mutatja (gépes / telefonos / borúlátó minta — feltevések), a ritkán fent lévő számlálónál 4–6%-ot. Egy küszöb
  rajta egy egészséges koinoban is a készülékek 62–100%-át küldené segíteni (24 órás ablak; 7 napossal 26–85%) — kétszeres teher, és a
  megfogyott darabot nem választja külön. A viszonyszám (a testvér a saját darabomhoz mérve) a számláló elérhetőségét kiejti, de az
  egyenletes fogyást ezért nem látja. Csak a sokat fent lévő készülék lát megbízhatóan (egészséges koinoban ~1% segít), de kevesen vannak:
  a tagok felénél a medián 10 → 13 (gépes), 10 → 11 (telefonos), csupa-telefonos koinoban 10 marad.
- ⛔ **És ami a KO12 mögött van:** az egy szinttel sekélyebb lépés legfeljebb kétszerez, és a szomszéd csak az EGYENLŐTLENSÉGET javíthatja.
  Az elment tagok miatti EGYENLETES fogyás gyógyírja maga a mélység: hogy a készülék az ismert tagok helyett az ÉLŐ tagokból számoljon.
  Ehhez viszont a valódi elérhetőséget kell ismerni — amit a koino még sosem mért.

**A kérdés (Csabáé):**
- **KO13 — mi legyen a ④ válaszával a 96. mérés után?** (A) **a sokat fent lévő készülékek segítenek** (v4: aki a héten az órák legalább
  felében fent van, az számol, és ha a testvér-darabja kevés hirdetőt mutat, azt is tartja) — biztonságos és egészséges koinoban szinte
  ingyen, de a segítsége kicsi, és az elment tagok gondját nem oldja meg. (B) ⭐ **most csak a hirdetés és a számlálás** (④a, ④b — a
  kimondással és egy kis helyi naplóval a saját fent töltött óráimról): a terepen ez méri meg a valódi elérhetőséget, és a válasz — az
  elment tagokkal együtt — a terepi adatokból, egy külön átvizsgálással. A hirdetés magában is hasznos: a darab kérelme már nem csak az
  ismert társaimhoz jut el. (C) **az élő tagok becslése most** (a mélység az ismert tagok helyett az élőkből — pl. a sokat fent lévő
  készülékek megfigyeléséből, a társak között terjesztve, mint a D110 tanult mélysége, de csak sekélyebbre): ez oldaná meg a gondot, de
  új átvizsgálás és mérés kell hozzá — a valódi elérhetőség nélkül ugyanarra a feltevésre épülne.

**⭐ Csaba elképzelése (2026-11-26 — a KO13 helyett):** *„én ezt úgy képzeltem el, hogy a kézikönyvet, mindenki tárólja, az általános
egyzményeket, meg csak 20 - 50 online helyen, de egyben, nem darabokban … szerintem azt kéne, számon tartani, hogy mennyien vannak
online, egy adott egyezménynél. és ha ofline kerűl, az egyik tartó, akkor azt érzékelni kéne, és egy új eszköz lessz tartó.”* — *„ne
vándoróljon folyton, de a közös terhet, meg kell próbálnunk igazságossan szétosztani, úgy, hogy egy újabb általános egyezmény, azokhoz
kerűljön, akik a legkevesebb általános egyezményt őrzik.”* Ebből:
1. **A kézikönyvet mindenki tartja** → a KO5 visszakerül (A)-ra: a ③e egy része visszafordul (a kézikönyv-esemény újra egy mindenkitől
   vállalt szeletbe kerül, a KO9 (A) „kérésre látszik” megszűnik). 40 ismert tag alatt ez ma is így működik.
2. **Az általános egyezmény egészben** — ez már így van: a darab egy KOSÁR, benne egész általános egyezmények (az azonosítójuk szerint). A
   kosár az adminisztráció miatt kell: általános egyezményenként külön hirdetve egy 400-at tartó készülék napi ~170 MB-ot hirdetne.
3. **Mindig T tartó ONLINE**: a tartók az éppen online tartókat számolják; ha kevesebb, egy új készülék lesz tartó.
4. **Nem vándorol folyton**: ⭐ *pontosítva (a beszélgetésben):* az offline nem azonos az elmenttel — aki visszajön, tartó MARAD (a
   Carbonite-minta, Chun és társai, 2006); így a tartók száma beáll arra, amennyinél mindig elég van online, és csak az elment tagok
   példányát kell pótolni. Leadni csak a megtelt készülék ad le.
5. **Az új teher a legkevesebbet őrzőhöz**: ⭐ *pontosítva:* nem mindenki közül (a késő hírre mindenki ugyanazt választaná), hanem néhány
   jelölt közül a legkevesebbet őrző (a „két választás ereje” — Azar és társai, 1994).

**A 97. mérés** (`meres/eredmenyek.md` 97. — szimuláció, 10 000 tag, 256 kosár, T = 20, 90 nap, a 96. mérés három elérhetőségi mintája és egy
esti telefonos; stabil és fogyó koino):
- ⭐ **A szabály működik:** egyik mintán, egyik koinoban sem volt olyan óra, amikor egy kosárnak egy tartója sem volt online, és egy kosár sem
  veszett el; T-nél kevesebb a stabil koinoban az órák 0,1–1,3%-ában, a fogyóban 1,5–7,2%-ában. A tartók száma MAGÁTÓL áll be (az elérhetőség
  ismerete nélkül): 67 / 125 / 289 / 86 kosaranként (~1,2–1,4 × T / az átlagos elérhetőség). A 96. mérés gondja nem jön elő: az „online most”
  pont az, amire a kérőnek szüksége van, a számláló saját elérhetősége nem torzít.
- **A teher kicsi:** átlagosan 7–34 MB egy készüléken (tagonként 2 általános egyezménnyel — feltevés), a pótlás legfeljebb 0,25 MB naponta;
  a teher nagyobbik része (42–89%) a segítő szerep. A kis koinoban (640 tag) egy kosarat a tagok 11–55%-a tart.
- ⛔ **A „mindenki közül a legkevesebbet őrző” torlódik:** a legnagyobb teher az átlag 30–144-szerese, egy készülékre egy órában 242 új szerep
  jut, az új tagokra az átlag 3,6–7,2-szerese. ⭐ **10 jelölt közül a legkevesebbet őrző:** a legnagyobb teher az átlag 1,2–1,9-szerese (az esti
  mintán 3,2–3,3 — a hiány óráiban csak a bekapcsolva hagyott gépek vannak fent, nekik kell átvenniük). 3 jelölttel 1,6–2,5 (esti 4,3–4,5), a
  sorban következővel (a teherre nem nézve) 2,5–6,9.
- A hiány egyszerre pótlása és a nagyobb kosár nem éri meg; a T = 50 a terhet 2,2–2,4-szerezi, és a fogyó koinoban az egyesével pótlás nem
  győzi (T alatt 3,7–16,7%).
- ⚠️ **Nem mérte:** hogyan találja meg a hiányt észlelő tartó a jelölteket a hálón, és hogyan kérdezi meg a terhüket (a szimulációban ez
  „tudott”); a DHT késését; a mélység változását; a valódi elérhetőséget (a terep).

**A ④ új terve** (a KO12 (A) „eggyel sekélyebbre lép” helyett a pótlás; a KO11 (A) — csak a saját darabját — értelme: a KOSARAIT, a feleit nem):
1. **④a A hirdetés:** a tartó a kosarait hirdeti (a sajátját és a segítő kosarait — a 97. mérés mintáin átlagosan 2–7), a `szelet` fajtával a
   darab-kulcson, ha a koinon mélysége legalább 1. Kosaranként ~0,4 MB naponta, a fent töltött időre.
2. **④b A számlálás:** óránként a kosaraim témáján az ONLINE tartók (a pillanatkép — a 24 órás ablak és a saját fent töltött óráim naplója
   nem kell); kimondva a `vallalas` sorában és az őrjárat naplójában.
3. **④c A pótlás:** ha egy kosaramnak T-nél kevesebb tartója van online, egyetlen új tartó (óránként kosaranként egy) a jelöltek közül (KO15); a
   visszatérő tartó marad; leadni csak a megtelt készülék ad le. ⚠️ Kód előtt egy átvizsgálás: a jelöltek megtalálása és megkérdezése a hálón,
   és hogy a bevallott teher hamisítható (ez csak az igazságosságot rontja, a biztonságot nem — a kosár így is kap tartót).
4. **④d A próba** (a helyi DHT-hálóval), utána a kézikönyv (1. pont) és a terep.

**A kérdések (Csabáé):**
- **KO14 — a célszám (T) és a születés:** (A) ⭐ **T = 20 online, ugyanaz a szám, mint a mélység `r`-je** — egy szabály marad a születésben (a
  `koinonPeldany` jelentése „a koinon online őrzői darabonként” lesz); mérve: egy sincs online 0%, a teher 7–34 MB. (B) **T = 50** — a teher
  2,2–2,4-szerese, és a fogyó koinoban gyorsabb pótlás kellene (az egyesével pótlással T alatt 3,7–16,7%). (C) **T külön szabály** a
  születésben (az `r` a mélységé, a T az online célé).
- **KO15 — ki legyen az új tartó?** (A) ⭐ **10 jelölt közül a legkevesebbet őrző** (a legnagyobb teher az átlag 1,2–1,9-szerese, az esti
  mintán 3,2–3,3); (B) **3 jelölt közül** (1,6–2,5, esti 4,3–4,5); (C) **mindenki közül a legkevesebbet őrző** (a szabály szó szerint) — ⛔
  mérve torlódik (30–144-szeres, az új tagokra 3,6–7,2-szeres), nem ajánlott.

✅ **Csaba (2026-11-26): „Igen, mindkettő (A)”** — **KO14 (A)**: a célszám T = 20 online, ugyanaz, mint a mélység `r`-je (a születés
`koinonPeldany` szabálya: „a koinon online őrzői darabonként”); **KO15 (A)**: az új tartó 10 jelölt közül a legkevesebbet őrző.

## 11. A ④c átvizsgálása — a pótlás a hálón (2026-11-26, kód előtt)

A 97. mérés három dolgot „tudott”, amit a hálón meg kell oldani: hogy kosaranként óránként pontosan EGY tartó pótol, hogy a DHT az
„online most”-ot mutatja, és hogy a pótló bárkit elér jelöltnek. A terv két kérdést is nyitva hagyott: hogyan kérdezi meg a jelölteket,
és mit tesz a hamisítás. **Amit a kódban láttam:**
- egy készülék 3 (legfeljebb 5) kötést tart (`kotesek.js` — a rendszeres társai), egy körben legfeljebb ~8 társra kopog
  (`kopogasCeljai`). A társ a nyitó jel `knd` mezőjében a koinon-darabját mondja (a mélységet és három rövid lenyomatot); a darabot a
  másik fél a tábla-aláírójából számolja (`koinonDarabKulcsai`). ⚠️ Egy SEGÍTŐ kosár (ami nem az aláírásból jön) ma nem fér a jelbe —
  így a többi tartójával sem egyeztetődne;
- egy DHT-keresés témánként legfeljebb 100 címet ad (`dht.js` `TARS_KORLAT`; IPv4, BEP 5), a hirdetés 20 percenként ismétlődik
  (`HIRDETES_KOZ`), a háló 30–60 perc alatt felejt (58. mérés);
- a kopogtató út (D92/1 — a randevú a DHT-n): a kérő a téma PÁRJÁN jelentkezik, a hirdetők a címjegyzék-körükben (~20 perc) meglátják,
  és 30 percig (`KOPOGTATO_ELEVULES`) minden körben felé kopognak — így két NAT között is megnyílik a rés (60. mérés: ~20% → ~76%);
- minden készülék a saját gyökér-darabját hirdeti (D91/3 — mit hirdet egy készülék): egy gyökér-darab témájának hirdetői a most (és a
  nemrég) fent lévő készülékek EGYENLETES mintája, a koinon kosaraitól függetlenül.

**A 98. mérés** (`meres/eredmenyek.md` 98. — a 97. szimulátora, három új kapcsolóval):
1. ⭐ **Ki pótol? — sorsolással.** A kosár online tartói egymásról nem tudnak, és nem is kell: mindegyik 1/n eséllyel pótol (n: a
   látott tartók száma) — átlagosan egy pótló, és a kép a 97.-é (a tartók, a teher, a 20 alatti órák ugyanazok). Kérdés nincs.
2. **A DHT késése** (a lekapcsolt tartó 30–60 percig még látszik; a mérés a rosszabb esetet vette — a valóság a késés nélküli és ez
   között van): a látott szám nagyobb a valóságosnál, ezért kevesebb a tartó (~20%-kal), a valóban online átlag 20–25 (a 97.-ben 25–30),
   és az órák 9–46%-ában 20 alatt van — de egy sincs online soha (0%). Ha a látott cél 25, a rosszabb esetben a 97. képe jön vissza
   (24–30 online, a legalsó órában 23–27, a teher a 97.-é); késés nélkül ez 17–21%-kal több terhet jelent (legfeljebb ~42 MB). → KO17.
3. ⛔ **A kötések nem jó jelölt-forrás:** 3–5 társból egy adott órában kevés van fent — a gépesen kívüli mintákon a kísérletek 63–98%-ában
   egy jelölt sincs, a teher a kevés fent lévő társra torlódik (5–16-szoros), és a pótlás lemarad. A továbbadás (a kötések kötései)
   alig segít. ⭐ **A DHT-minta működik:** egy téma hirdetői (a nemrég lekapcsoltak címével együtt) szinte a 10 teljes jelölt képét adják.
   → KO16.

**A többi pont (a kódból és a mérésekből — kérdés nélkül, a ④ építésében):**
4. **A jelöltek megkérdezése — a nyitó jelben.** A tartott kosaraknak (a saját és a segítő kosarak) úgyis a jelbe kell kerülniük,
   különben a segítő kosár a többi tartójával nem egyeztetődik: a `knd` a tartott kosarak listáját viszi, felülről korlátosan (9.
   szabály — a megtelt készülék nem vállal többet). Ebből a pótló a csere elején tudja a jelölt terhét: a kosarak összege, a mélységükkel
   súlyozva, hogy egy kettéválás ne duplázza. A felkérés egy új kérelem-fajta (a kosár kulcsával). A jelölt három dolgot néz, mielőtt
   elfogadja: nincs-e tele (a kerete); érvényes koinon-kosár-e a kulcs a mélységén; és maga is látja-e a hiányt (egy saját DHT-keresés,
   ~3 KB). Az utolsó azt zárja ki, hogy egy idegen olyan kosarakkal terhelje, amelyeknek nincs rá szükségük. Ha elfogad, ugyanabban a
   cserében letölti a kosarat a pótlótól (a meglévő szelet-úton), a szerepét helyben feljegyzi (helyi feljegyzés, nem esemény — 3.
   szabály), és onnantól hirdet, számol és pótol.
5. **Az elérés:** a minta címeire (egy keresés, legfeljebb 100 cím) közvetlenül kopog, és ha kevesebb mint 10 felelt, a minta
   témájának párján a kopogtató úton jelentkezik. ⚠️ A kopogtató út a téma MINDEN fent lévő hirdetőjét hívja 30 percig, és egy kis
   mélységű gyökér-darabnak száz fölötti hirdetője is lehet. Ezért egy felkérés legfeljebb 10 cserét folytat le, a többi a meglévő
   „később” (D109 KK6 — a kiszolgálás kerete) választ kapja; ezt a ④d próbája méri meg. Az ára egy pótlásnak egy keresés (~3 KB) és
   legfeljebb 10 rövid csere. Egy készülék a 97–98. mérésben naponta legfeljebb ~0,25 MB-ot tölt le pótlásként.
6. **A hamisítás — négy fajta, egyik sem vesz el tartót:**
   - *a bevallott teher* (a jel): aki többet mond, az potyázik (a terhét más viszi — csak az igazságosság romlik), aki kevesebbet, az
     magára vesz többet;
   - *a hamis hirdető* (a DHT): sok hamis cím egy kosár témáján a látott számot felviszi, és elnyomja a pótlást. Ekkor a kosár a
     természetes tartóira esik vissza (a tábla-aláírásból — a ③ képe, ~r…2r tartó) és a meglévő segítőire, akik maradnak: soha nem
     kevesebb, mint a ④ nélkül. Olcsó védelem: a látott számban egy IPv4-cím egynek számít, akárhány porton hirdet. Az alulszámolás a
     biztonságos irány: két telefon egy router mögött egynek látszik, és ez egy fölösleges tartót hoz, nem kevesebbet. Egy valódi
     támadáshoz annyi cím kell, amennyi a látott cél;
   - *a hamis felkérő*: tartalmat nem hamisíthat (az események aláírtak, a `KoinonOsszegzes`-t a tartó ellenőrzi — ③d, a tartó
     döntése), csak terhet adhatna — azt a jelölt saját hiány-keresése és a kerete korlátozza;
   - *az elnémított téma* (a DHT-gépek semmit nem adnak vissza): minden tartó hiányt lát, és pótol — csak teher (a biztonságos irány).
     Korlát: egy készülék óránként legfeljebb egy pótlást végez és egy új szerepet vállal, és a kerete fölött semmit.
7. **A mélység változása** (a 97–98. nem mérte). A mélység csak nő, mert az ismert tagok száma csak nő. Kettéváláskor a tartó mindkét
   felét megtartja, letöltés nélkül, és az adatban mért terhe nem változik: a saját fele természetes marad, a másik fél segítő szerep
   lesz (ugyanaz a szabály: csak a megtelt készülék adja le). Az átmenetben a két mélység együtt él, és egy új tag is sekélyebben
   kezd (kevesebb tagot ismer). A mélyebb számláló nem látja a sekélyebb tartókat, pedig azok az egész kosarát tartják — ez fölösleges
   pótlást hozna. Ezért pótlás előtt egy második pillantás jön a szülő-kosár témájára: egy keresés, csak hiány esetén. A kérő
   ugyanígy a saját mélységén és a szülőén keres. ⭐ *Pontosítva (a ④a építésekor):* a gyökértől eltérően a gyermekekén NEM — a
   mélyebb tartó a darabnak csak a felét tartja, és a fél válasz a kérelmet „megjött”-nek jelölné; a 0. mélységű szülőn sem (azt senki
   nem hirdeti).
8. **A leadás — csak a megtelt készülék ad le:** egy készülékenkénti keret (beállítás: mennyit adok a koinonnak). Fölötte nem vállal
   új szerepet, és ha a keretet lejjebb veszik, a legújabb segítő szerepeit leadja: nem hirdeti tovább őket, a látott szám csökken, és
   mások pótolnak. A mért teher 7–42 MB; az alapérték a ④c része, ennél jóval nagyobb.

**A kérdések (Csabáé):**
- **KO16 — honnan jöjjenek a jelöltek?** (A) ⭐ **a DHT-ről** (egy véletlen gyökér-darab témájának hirdetői — minden készülék egyet
  hirdet, így a most fent lévők egyenletes mintája; elérni közvetlen kopogással és a kopogtató úton, legfeljebb 10-et): a 98. mérésben
  szinte a 10 teljes jelölt képe (a legnagyobb teher az átlag 1,3–2,2-szerese, az esti mintán 3,6). (B) **a kötésekből** (és a
  továbbadással a kötéseik közül): új út nem kell, de a kísérletek 12–98%-ában nincs jelölt, a teher 3,5–16,8-szoros, és a pótlás
  lemarad.
- **KO17 — a DHT késése: mennyi legyen a LÁTOTT cél?** (A) ⭐ **25 — a születés `koinonPeldany`-ja 20 marad** („ennyi legyen valóban
  online”), a program a látott számra egy rögzített ráhagyást tesz (1,25×, a 98. mérés rosszabb esetéből). Így a rosszabb esetben is a
  97. képe jön (valóban online átlag 24–30, a legalsó órában 23–27), késés nélkül viszont 17–21%-kal több teher (legfeljebb ~42 MB). A
  ráhagyás a terepen mért késéssel később pontosítható. (B) **20 — a T = r szó szerint**: 14–21%-kal kevesebb teher, de a rosszabb
  esetben a valóban online átlag 20–25, és az órák 9–46%-ában 20 alatt (egy sincs online: 0%).

✅ **Csaba (2026-11-26): „Igen, mindkettő (A)”** — **KO16 (A)**: a jelöltek a DHT-ről (egy véletlen gyökér-darab témájának hirdetői,
legfeljebb 10); **KO17 (A)**: a látott cél 25 — a születés `koinonPeldany`-ja (20) a valóban online őrzők száma, a program a látott
számra 1,25-ös ráhagyást tesz (a terepen mért késéssel pontosítható).

**A ④ terve a 98. mérés után** (a 10. szakasz „új terve” helyett):
1. **④a A hirdetés:** a tartó a kosarait hirdeti (a sajátját és a segítő kosarait) a saját mélységén. A nyitó jel a tartott kosarakat
   viszi (felülről korlátosan), a csere a közös kosarakat egyezteti, a kérő a mélységén és a szülőén keres. ✅ **Kész (2026-11-26)** —
   a hirdetés és a kérő útja: `cimjegyzek.js` `koinonHirdetendoTemak` (a `szelet` fajtán, a darab-kulcson; a 0. mélységen semmi) és
   `koinonKeresoKulcsai` (a darab és a szülője); `koino.js` `koinonKosaraim` (ma a saját kosár — a ④c teszi mellé a segítő kosarakat),
   a `sajatHirdetendoTemak` (a címjegyzék-kör), a `fuggoKerelemFelvetele` (a szülő témáján is jelentkezik és keres), a `vallalas` sora
   („a koinon a DHT-n: …”) és a `cimjegyzek hirdet` („koinon-kosár m:d”). ⏭️ A nyitó jel a ④c-vel (addig nincs segítő kosár).
2. **④b A számlálás:** óránként, minden tartott kosárra: a téma különböző IPv4-címei (és saját maga). Ha a látott cél (KO17) alatt van,
   egy második pillantás a szülő-kosárra. Kimondva a `vallalas` sorában és az őrjárat naplójában. ⭐ *A ④a építésekor a kódból:* a
   hirdetés (`dht.js` `bejelent`) a bejelentés előtt úgyis lekéri a téma hirdetőit (`get_peers` — a válasz `kereses.tarsak`-ja), így a
   számlálás a címjegyzék-kör saját találatából jöhet, többlet-forgalom nélkül, ~20 percenként. ✅ **Kész (2026-11-26)** —
   `cimjegyzek.js` `koinonLatottTartok` (címenként egyszer, a saját címeim — a gép címei és a mért külső — helyett egyszer én),
   `koinonLatottCel` (a `koinonPeldany` 1,25-szöröse, felfelé — `KOINON_KESES_RAHAGYAS`, KO17 (A)) és `kosarSzamlalasSzovege`;
   `koino.js` `kosaraimSzamlalasa` (a hirdetés találatából; a cél alatt a szülő-kosár témájára is ránéz; ha egyetlen DHT-gép sem felelt,
   a régi szám marad) — a `cimjegyzek hirdet` és az őrjárat címjegyzék-köre hívja; a helyi jegyzék `<koino>/koinon-tartok.json`
   (`fajlTar.js` `koinonTartokTarolo` — helyi megfigyelés, nem esemény); kimondva: az őrjárat naplójában („🧺 … a koinon-kosaram
   (m:d): N tartó látszik a DHT-n, a cél C”, a cél alatt pirosan), a `cimjegyzek hirdet` kosár-sorában és a `vallalas`-ban (hány perce).
3. **④c A pótlás:** 1/n eséllyel; a jelöltek a KO16 szerint, legfeljebb 10, a jelük szerint a legkevesebbet őrző; a felkérés és a jelölt
   három ellenőrzése; óránként legfeljebb egy pótlás és egy új szerep; a szerep helyben feljegyezve; leadás csak a keret fölött.
   ⭐ *Négy részlépésben (2026-11-27):*
   - ✅ **④c1 a segítő szerepek** — a helyi jegyzék (`<koino>/koinon-szerepek.json`, `fajlTar.js` `koinonSzerepTarolo` — nem esemény), a
     `koinon kosarak | segit <m:d> | lead <m:d>` parancs (a pótlás is ide ír; kézzel egy bekapcsolva hagyott gép önként is vállalhat);
     a `koinonMelysegem` a segítőket is tartja (a részvétel, a tömörítés megtartása, a kézikönyv-bejegyzések — bármelyik kosárban); a
     nyitó jel `knk` mezője viszi őket (`m:d:l:l0:l1`, legfeljebb 32 — `cimjegyzek.js` `kosarJelSzovege`/`kosarJelOlvasasa`), a csere
     a két fél BÁRMELY tartott kosarából számolja a közöseket (`kozosKoinonKosarak` — ugyanazon vagy szomszéd mélységen), a régebbi
     program a mezőt nem nézi; a hirdetés és a számlálás a segítőkre is; a jelből a teher (`koinonTeher` — a ④c3 jelöltjeihez).
     ⚠️ *Mérve a próbán:* egy friss tag az első cseréjén még csak magát ismeri (0. mélység — az egész koinon az övé), és mindent felvesz
     (a ③ alulbecslése — a biztonságos irány, de egy nagy koinoban egy új tagnak egyszeri teher; a ④c4 része);
   - ✅ **④c2 a felkérés** (2026-11-27) — egy új kérelem-fajta (`felkeres`, a kosár kulcsával — `kerelem.js`; nem adható tovább; a
     válasz `megnezem` / `mar` / `elutasitva` + ok). A jelölt (`kerelemKiszolgaloja().felkeres`) a GYORS ellenőrzést a csere közben
     végzi (a koinon egy darab-e; a kosár a mélységén ±1; tartja-e már — `kosarTartalmazza`; a jel határa; a kerete; legfeljebb 4 függő
     felkérés), és feljegyzi (a `koinon-szerepek.json` `fuggo`-ja, a felkérő címével); a HIÁNYT a címjegyzék-körében maga is megnézi
     (`koinonFelkeresekFeldolgozasa` — a kosár és ha kevés, a szülője témáján, magát nem számolva; ha egyetlen DHT-gép sem felelt,
     vár), óránként legfeljebb egy új szerepet vállal, és a vállalt kosarat elkéri (függő kérelem a felkérő címével és a kosár témáin).
     A keret: `<koino>/koinon-keret.json` (MB, alapból 256 — `koinon keret [MB]`); a teher a tartott kosaraimba eső koinon-események
     mérete; a keret fölött a legújabb segítő szerepeim leadom (`leadandoSegitok`) — a címjegyzék-kör és a `koinon keret` is. Kézzel:
     `koinon felker <m:d> <cím> <port>`, `koinon felkeresek`; a `koinon kosarak` a szerep eredetét, a váró felkéréseket és a keretet is
     mutatja; az őrjárat naplója kimondja (🤝);
   - ④c3 **a pótlás** — a látott cél alatt 1/n eséllyel, óránként legfeljebb egy; a jelöltek egy véletlen gyökér-darab témájáról (KO16
     (A)), legfeljebb 10, közvetlen kopogással és a kopogtató úton; a nyitó jelükből a legkevesebbet őrző kapja a felkérést;
   - ④c4 **a mélység változása** (a 7. pont): mi legyen kettéváláskor a kosár másik felével — ⏸️ **KO18**, előtte mérés (a teher a
     koino növekedésével).
4. **④d A próba:** helyi DHT-hálóval (`halo.belepo`), rontásokkal: hamis hirdető, hamis felkérő, megtelt jelölt, mélység-váltás, a
   kopogtató-vihar korlátja. Utána a kézikönyv mindenkinél (KO5 (A) — a ③e egy része visszafordul), majd a ⑤ terep (a valódi
   elérhetőség és a DHT késése — ebből a ráhagyás).

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
  exportálva): a döntés után az elfogadott általános egyezmények entitásai (az általános javaslaté, több érintettnél a töredékeké; a múlt
  rögzített döntései is) — ha egyiket sem felejtette el az első kör, a pont HELYBEN kerül rá; ha igen (mindenki levette a pontját), az
  első két fázis ÚJRA fut a halmazzal, így az általános egyezmény a helyén marad a gyerekeivel (a sorrend csapdája — 5. szakasz). A koinon nem
  szavaz, a nevezőbe nem számít; a lezárt döntés nem változik. Próba: +2 (`egyezmenyProba.js` — a lezárás után, csak az elfogadott
  általános; a pont nélküli megmarad a helyén és a gyerekével, az elvetett elfelejtődik), 6 rontás mind bukik; az `allapot` csoport
  389/389, a D123 mag-próbái 6/6. ⚠️ A mag változott (D123: más számítás — a mostani teszt koinokban a lap kimondja). ⏭️ ② a tömör alak.
- **2026-11-20** — ✅ **a ② kész: az általános egyezmény tömör alakja** (`js/allapot/koinonCsomag.js` — NEM a mag része): az általános javaslat, érintettenként
  a lezárási összegzés és a mintái, az állásfoglalások (e-emberenként az utolsó — ugyanaz a szabály, mint a hatálynál). ⭐ A minta
  helyei az összegzés SAJÁT lenyomatából (`lezarasiOsszegzes.js` `onalloMintaHelyek` — UGYANAZ a sorsoló, csak a véletlen forrása a
  lenyomat-lánc; a 95. mérés lelete): bárki ugyanazokat számolja, az építő nem választhat helyet, és az ellenőrző a helyeket MAGA
  számolja. ⛔ **Lelet (a méret mérése):** a beágyazott alak 13 szavazónál 83 KB — 66 KB-ja ismétlés (52 mintában 17–32 különböző
  esemény, mindegyik a kísérő tanúsítványával); ⭐ most minden esemény és tanúsítvány EGYSZER (táblában), a minták, az általános javaslat és az
  állásfoglalások hivatkoznak: 13 szavazónál ~35–44 KB, 301-nél ~91 KB (a 95. mérés becslése — 20–26 KB — kihagyta a négy küszöb-napló
  mintáit és a tanúsítványokat: helyesbítve az `eredmenyek.md`-ben). Próba: +4 (`koinonCsomagProba.js`, az `allapot` csoportban — az
  építés és az ellenőrzés a nyers szavazatok és az építő nélkül; a helyek önállósága; kilenc hamisítás; az elvetett általános egyezmény), 8 rontás
  mind bukik; a lezárási összegzés próbái 12/12, a D123 mag-próbái 6/6. ⏭️ ③ a koinon darabjai.
- **2026-11-20** — a ③ terve (7. szakasz); ✅ **Csaba: „elfogadom, a javaslataidat, mehetünk tovább”** — KO7 (A) a tömör alak egy új
  aláírt eseményben (`KoinonOsszegzes`), KO8 (A) bárki írja, aki a teljes bemenetet tartja, KO9 (A) a kézikönyv a darabokban (kérésre
  látszik). ⏭️ A ③ építése: ③a az esemény (alakja, ellenőrzése a tárból), ③b ki és mikor írja (az őrjárat), ③c a darab a vonalon és a
  vállalásban, ③d a tartó döntése (D95/1 út), ③e a kézikönyv a darabokba, ③f az `r` a születésben (KO4).
- **2026-11-20** — ✅ **a ③a kész: a `KoinonOsszegzes` esemény.** `koinonCsomag.js`: az ellenőrzés közös MAGJA
  (`tomorAlakEllenorzese` — a csomagé a tábláiból, az eseményé a tárból kapja a hivatkozott eseményeket, a kísérővel; az ellenőrzött
  összegzéseket is visszaadja a ③d-nek), `koinonOsszegzesAdata` (a csomag döntés-része — ⛔ az állásfoglalások NEM: a hatály él),
  `koinonOsszegzesEllenorzese` (a tartalom — az aláírást a kapu nézi; az általános javaslat szeletében kell élnie); `muveletek.js`
  `koinonOsszegzesKiadasa`; `esemeny.js` `bejelentesHelyei` (az érintettjeinél is hír, mint a `LezarasiOsszegzes`, legfeljebb 64);
  `koinoLanc.js` (a múlt rétegéé — a gyermek jelenébe nem jön át). A kapu átengedi (az ismeretlen típust nem tiltja, méret-korlátja
  nincs). Próba: +1 (`koinonCsomagProba.js`), 3 rontás mind bukik.
- **2026-11-20** — ✅ **a ③b kész: ki és mikor adja ki** (KO8 (A)). `koino.js` `koinonOsszegzesekKiadasa` (a koino-példány része, a
  lezárási összegzés kiadásának mintájára): a jelen réteg elfogadott általános egyezményei közül ott, ahol az általános javaslat szeletét és
  minden érintettjéét EGÉSZÉBEN tartom (a vállalásomban, nem összegezve — ⛔ egy hiányzó szavazattal hamis összegzés születne);
  kihagyja, ahol már én kiadtam, vagy ahol az általános javaslat szeletében már van érvényes (bárkitől); a kiadás előtt a saját csomagját is
  ellenőrzi. Az őrjárat háztartása hívja (a lezárási összegzés után), és kézzel a `koinon` parancs (listáz is: van-e érvényes tömör
  alak). Próba: +1 parancssor (a teljes tartó kiadja, a második kör nem), 1 rontás bukik. ⚠️ Próba nélkül: a „teljes bemenet”
  feltétele (ahhoz két készülék kell, egy részleges tartással) — a terepen.
- **2026-11-20** — ⭐ **a ③c előtt: a `KoinonOsszegzes` BEÁGYAZVA** (a KO7 (A)-n belül — továbbra is egy aláírt esemény a meglévő
  csere-úton). ⛔ **Lelet (a darab tervezésekor, a kódból):** a fogadó egy eseményről MAGÁBÓL dönti el, hogy átveszi-e
  (`szeletEgyeztetes.js` `szeletbeTartozik` — a vonal ezzel szűr). A minták eseményei (egy tudatpont-rendezés, egy érték javaslat)
  a saját szeletükben laknak, magukról nem mondják meg, hogy egy koinon-darab részei — hivatkozva a darab tartója nem kapná meg
  őket, és a tömör alak nála ellenőrizhetetlen maradna. ⭐ Ezért az esemény a csomag tábláit is hordja (az általános javaslat és a minták
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
  D129-nél). `szeletEgyeztetes.js`: a darab halmaza a koinon kulcsához bejelentettek közül azok, amelyeknek az ÁLTALÁNOS EGYEZMÉNYE (a
  szelet-kulcsuk) a darabba esik — egy általános egyezmény minden eseménye egy darabban —, a változat-jele és a fogadó szűrője. `vonal.js`: a
  `knd` jel, a közös eltérő darab, a részvétel; ⛔ a koinon kulcsa egészében sosem cserélődik („mindent” módban sem), a régi program
  (jel nélkül) semmit nem lát belőle, és a csere nem drágul. `koino.js`: `koinonMelysegem` (az ismert tagok — a horgonyok szerzői —,
  a tár eseményszáma szerint gyorsítótárazva; `r` = 20 a ③f-ig), a csere beállítása, a tömörítés megtartja a darabom eseményeit, a
  csak küldő út a saját koinon-eseményemet az általános egyezménye darabja alatt is felajánlja, és a `vallalas` kimondja (a mélység, az ismert
  tagok, a darab általános egyezményei és eseményei). ⚠️ A `vallalas.js` nem változott: a darab — mint a gyökéré — a csere, a tömörítés és a
  csak küldő út szintjén él. ⛔ A zárt koino nem tagja nem kap belőle (a vonal korlátja, mint a gyökérnél) — a parancssori próba
  első futása ezen bukott (a vendég egy alapból zárt koinoba csak csatlakozott, nem lépett be): a kód helyes volt, a próba nyílt
  koinoval fut. Próba: +11 (`koinonDarabProba.js`, a `csere` csoportban), 12 rontás mind bukik; +1 parancssor (a szigorú vendég az
  általános egyezmény szelete nélkül megkapja a tömör alakot és az állásfoglalást, a `vallalas` kimondja, a tömörítés után is megvan), 2 rontás
  bukik; a `csere` csoport 488/488 + 2 ismert (a fél-jel előtt); ⭐ a TELJES sor (a mag és a csere változott): 1556/1556 + 2 ismert
  (a D124 két „valódi régi program” próbája). ⚠️ Próba nélkül: a `koino.js` csak küldő ágának koinon-kulcsa (a
  mechanizmust a darab-próba a saját kulcsaival méri; a valódi programban 1+ mélység kell hozzá — 2r tag —, és a darab helye a
  készülékkulcson múlik) — a terepen. ⏭️ ③d a tartó döntése (a D95/1 útján), ④ a darab hirdetése a címjegyzéken.
- **2026-11-20** — a ③d terve (8. szakasz). ⛔ Lelet: a ③d után a tartó az általános egyezményt ismerné, a helyét nem — és az állásfoglalás
  jogát a szabály hamis kivételnek olvasná. ⏸️ **KO10** (a tartó ítélete az állásfoglalás jogáról) Csabánál.
- **2026-11-21** — ✅ **Csaba: „rendben”** — **KO10 (A): a tartó nem ítél.** ✅ **A ③d kész: a tartó döntése.** `koinonCsomag.js`: az
  ellenőrzés részenként a döntést (az összegzés és a számaiból számolt állás) és az általános javaslat eseményét (a kísérőjével) is visszaadja;
  `fajlTar.js` `koinonTarolo` (a koino mappájában `koinon.json` — a már ellenőrzött tömör alakok, hogy ne kelljen körönként újra);
  `koino.js` `koinonOsszegzesekFelvetele` (az őrjárat háztartása és a `koinon` parancs hívja; körönként legfeljebb 16): a tárban lévő
  `KoinonOsszegzes`-t önmagából ellenőrzi, az általános javaslatot a tárba menti, a részek döntését a jegyzékbe; `ellenorzottOsszegzesek` (EGY
  út a parancssornak és a lapnak — D95/1) onnan adja a döntésnek, ott, ahol a rész szeletét nem tartom egészében (ha több érvényes
  van, a legkisebb azonosítójú — KO8 (A)); a tömörítés megtartja a megmentett általános javaslatot. Így a darab tartójánál: elfogadva → a koinon
  pontja (①) → az általános egyezmény ott áll a képében, a helye nélkül is. ⛔ **Lelet (a parancssori próba első futása):** a tartó a
  HELYET ismerte (a legfelső szintű gondolat születését a gyökér-darabja hozta), csak a pontjait nem — a KO10 első alakja („ha a
  helyet sem ismeri”) itt nem fogott, és a szabály az állásfoglalást mégis hamis kivételnek olvasta. ⭐ **A KO10 (A) végleges alakja**
  (`szabalyok.js`): a „nincs pontja ezen az ágon” csak HÉZAGTALANUL ismert láncról állítható — ha a szerző láncát hézagosan látjuk
  (a pont-eseménye a hely szeletében maradt), „nem ellenőrizhető” (számít, jelölve — D19); ugyanaz a mérce, mint a keret-szabályé
  (`folytonos`). Ha a helyet sem ismerjük, szintén. Ez a szigorú (b) régi esetét is megoldja (aki a helyet tartja, de a mélyebb ágat
  nem). A parancssor a művelet nevét magyarul írja (a nyers „Allaspont” helyett „Álláspont”). Próba: +1 `egyezmenyProba` (a KO10 három
  esete: ismeretlen hely, hézagos lánc, hézagtalan lánc), +1 parancssor (a szigorú vendég a `koinon` után a képében látja az általános
  egyezményt, a hatályával), 4 rontás mind bukik. ⏭️ ③e a kézikönyv a darabokba, ③f az `r` a születésben, ④ a fenntartó kör.
- **2026-11-22** — ✅ **A ③e kész: a kézikönyv a koinon darabjaiban** (KO5 (B), KO9 (A); a terv a 9. szakaszban). `esemeny.js`
  `koinonHelyei` (EGY helyen: melyik koinon-darabba esik egy esemény — a koinon eseményénél az általános egyezménye, a kézikönyv-eseménynél
  a bejegyzése NEVE, több névnél mindegyiké), és a kézikönyv-esemény a koinon kulcsához jelentődik be (a gyökér-szelet helyett);
  `szeletEgyeztetes.js` (a darab halmaza és a fogadó szűrője), `koino.js` (a tartás, a tömörítés, a csak küldő út) ugyanezt kérdezi. ⛔
  **Építés közbeni lelet:** a terv a vállalásba tette volna a darabom bejegyzéseit — de az 116 külön szeletet adott volna a cserének
  (minden körben 116 szelettel több egyeztetés), pedig az eseményeiket a koinon-darab már hordja. Ezért a vállalás a kézikönyvet nem
  tartja (`vallalas.js`), csak a lap „tartott” jele kapja meg a darabom bejegyzéseit (`tartottSzeleteim` → `kezikonyvBejegyzeseim`: a
  program alap-tartalmának nevei és az eseményekben látott nevek, a darabomra szűrve). A nem a darabomba eső bejegyzésnél a buborék és a
  Részletes adatok a bejegyzés koinon-DARABJÁT kéri (abban a szavazatok is ott vannak — a bejegyzés saját szeletében nem), a megjegyzés
  kimondja (`kezikonyvMegjegyzes`), és a buborék csendben újrakérdez (4 mp-től egyre ritkábban, bezáráskor leáll). A `vallalas` parancs
  sora: „… · N kézikönyv-bejegyzés, M kézikönyv-esemény”. Kis koinoban (40 ismert tag alatt) egy darab van: minden készülék mindet tartja,
  a viselkedés nem változik. Próba: +2 `koinonDarabProba` (a darab halmaza a név szerint — a két-nevű esemény mindkét darabban; a
  kézikönyv a cserében — a javaslat-szeletű döntés-esemény is a neve szerint), 2 `kezikonyvProba` az új szabályra, +1 parancssor (két
  ismert tag és r = 1: két darab — a vállalás a bejegyzések egy részét tartja, a kívüli buboréka és Részletes adatai a darabot kéri), +1
  `magyarazatProba` (fej nélküli Chrome: a buborék megjegyzése, újrakérdezés, bezárás után leáll); 10 rontás mind bukik. ⏭️ ③f az `r` a
  születésben (KO4), ④ a fenntartó kör (a darab hirdetése — addig a darab kérelme az ismert társakhoz megy).
- **2026-11-26** — ✅ **A ③f kész: a példányszám (`r`) a koino születésében** (KO4 (A); Csaba: „Igen, jöhet a ③f”). `koinoSzabalyok.js`:
  `koinonPeldany` az `ALAP_SZABALYOK`-ban (20 — a mező nélküli, a ③f előtti születés így pontosan azt kapja, amivel a program addig
  számolt; a „mai értékek soha nem változnak” elve érintetlen: új kulcs, nem új érték) és a kapu határai között (1 – 1 000 000: legalább
  egy tartó; a felső határ csak a szemét ellen — ennyinél 2 millió tag alatt egy darab van). Az új születésbe a `teljesSzabalyok` kiírja,
  a gyermek a szülőétől örökli (a meg nem adottat), a `koino` parancs `koinonPeldany=N`-nel fogadja, a szabályok sora kimondja, a lap
  koino-verzió ablaka „A koinon őrzői darabonként” mezővel mutatja. `cimjegyzek.js` `KOINON_PELDANY` = az alapérték innen (egy
  forrás). `koino.js` `koinonMelysegem`: az `r` a koino szabályaiból (a még meg nem érkezett születésnél az alapérték — a születés
  megérkezése az eseményszámmal a gyorsítótárat is frissíti); a `vallalas` sora a koino `r`-jét mondja. ⛔ A ③c–③e próbák környezeti
  kapcsolója (`KOINO_KOINON_PELDANY`) megszűnt — a ③e parancssori próbája most a születésbe írja (`koinonPeldany=1`): amíg A csak magát
  ismeri, egy darab; B belépése után kettő (a valódi úton). A kézikönyv „koinon” fogalma kimondja (alapból 20, a gyermek örökli). ⚠️ Egy
  ③f előtti program az új kulcsot ismeretlen szabálynak látja, és az új születést (a koino-verzió kártyájába ágyazottat is) elveti — a
  frissítéséig abba a koinoba nem jut be; ugyanígy járt a D129 előtti program a `kezikonyv` szabállyal. A régi (mező nélküli) születésű
  koinokat ez nem érinti. Próba: +1 `esemenyProba` (az alapérték, a kiírás, a felülírás, a régi alak, a kapu hat
  esete), a D118/2 (①b) parancssori próbája (a születés viszi, a sor kimondja), a D118 (②a) gyermek-próba (örököl), a ③e próba a
  születésből; 6 rontás mind bukik (8 ellenőrzésben). ⏭️ ④ a fenntartó kör (a darab hirdetése és a tartóinak megszámlálása), ⑤ a terep.
- **2026-11-26** — a ④ terve (10. szakasz; Csaba: „Igen, jöhet a ④”). ⛔ Két lelet: a koinon darabját ma senki nem hirdeti (a kérelem csak
  az ismert társaimhoz jut), és az ismert tagok becslése az elment tagokat is számolja — a darabok élő tartói az idővel fogynak, és ezt ma
  semmi nem látja. Egy órás pillanatkép a tartókról nem dönthet (30%-os elérhetőségnél a 13 és a 10 tartós darab alig különbözik): hosszabb
  ablak kell. ⏸️ **KO11** (mit hirdet a tartó) és **KO12** (mit tesz, ha kevés tartót lát) Csabánál; a KO12 (A)-nál a küszöb a 96. mérésből.
- **2026-11-26** — ✅ **Csaba: „Igen, mindkettő (A)”** — **KO11 (A)**: csak a saját darabját hirdeti; **KO12 (A)**: eggyel sekélyebbre lép
  (a fejlesztési terv D130 10–11. pontja). ⏭️ A 96. mérés (a küszöb, az ablak, a visszalépés), utána az építés (④a–④d).
- **2026-11-26** — ⛔ **a 96. mérés** (`meres/koinonFenntartoMeres.js`): a látott hirdetők száma a számláló elérhetőségét méri, nem a
  tartókét — egy küszöb rajta egészséges koinoban is a készülékek többségét segítésbe küldené; csak a sokat fent lévő lát megbízhatóan, és
  az elment tagok gondját nem a szomszéd, hanem az élő tagokból számolt mélység oldaná meg (a 10. szakasz vége). ⏸️ **KO13** Csabánál.
- **2026-11-26** — ⭐ **Csaba elképzelése a KO13 helyett** (a 10. szakasz vége): a kézikönyvet mindenki tartja (a KO5 vissza (A)-ra), az
  általános egyezmények egészben, mindig T tartó ONLINE, ha kevesebb, egy új készülék lesz tartó; nem vándorol folyton (aki visszajön,
  marad); az új teher a legkevesebbet őrzőhöz. ✅ **A 97. mérés** (`meres/koinonOnlineMeres.js`, Csaba: „Igen, mérd meg”): működik — egyik
  mintán sem volt kosár online tartó nélkül, a tartók száma magától áll be (67–289 kosaranként), a teher 7–34 MB; a „mindenki közül a
  legkevesebbet őrző” szó szerint torlódik (30–144-szeres), 10 jelölt közül a legkevesebbet őrző teljesíti a szándékot (1,2–1,9-szeres).
  A KO12 (A) helyett a pótlás (a ④ új terve). ⏸️ **KO14** (a célszám) és **KO15** (ki legyen az új tartó) Csabánál.
- **2026-11-26** — ✅ **Csaba: „Igen, mindkettő (A)”** — **KO14 (A)**: T = 20 online (ugyanaz, mint az `r`); **KO15 (A)**: 10 jelölt
  közül a legkevesebbet őrző. ⭐ **A ④c átvizsgálása és a 98. mérés** (a 11. szakasz): a sorsolás (1/n) nem árt; a DHT késése a látott
  számot növeli (a rosszabb esetben ~20%-kal kevesebb tartó, de egy sincs online soha); ⛔ a kötések nem jó jelölt-forrás (12–98%-ban
  nincs jelölt), ⭐ a DHT-minta igen. A jelöltek a nyitó jelből (a tartott kosarak listája — úgyis kell), a felkérés a jelölt három
  ellenőrzésével, a hamisítás négy fajtája (egyik sem vesz el tartót), a mélység-váltás második pillantása, a keret. ⏸️ **KO16**
  (honnan a jelöltek) és **KO17** (a látott cél) Csabánál.
- **2026-11-26** — ✅ **Csaba: „Igen, mindkettő (A)”** — **KO16 (A)**: a jelöltek a DHT-ről; **KO17 (A)**: a látott cél 25 (1,25× a
  `koinonPeldany`-ra). ⏭️ Az építés: ④a → ④b → ④c → ④d.
- **2026-11-26** — ✅ **④a: a kosár a DHT-n** (a 11. szakasz terve, 1. pont): a tartó a kosarát a darab-kulcs `szelet` témáján hirdeti
  (a 0. mélységen nem), a kérő a darab és a szülője témáján jelentkezik és keres (a gyermekekén nem — a fél válasz miatt). Három próba
  (két tiszta a `koinonDarabProba`-ban, egy a parancssoron egy hamis DHT-vel: a társ nélküli kérő a szülő-kosár témáján megtalálja a
  tartót), mindkét rontásra bukik. ⏭️ ④b a számlálás.
- **2026-11-26** — ✅ **④b: a kosár látott tartói** (Csaba: „Igen, jöhet a ④b”; a 11. szakasz terve, 2. pont): a címjegyzék-kör a
  hirdetés saját keresésének találatából számol (többlet-forgalom nélkül), címenként egyszer, a saját címeim nélkül, egyszer magamat; a
  látott cél (25 — r = 20-nál) alatt a szülő-kosárra is ránéz; a szám a helyi jegyzékbe, a naplóba, a `cimjegyzek hirdet`-be és a
  `vallalas`-ba. Három próba (két tiszta, egy a parancssoron: hamis DHT idegen címekkel, négy ismert tag, és az őrjárat naplója),
  mindhárom rontásra (a port is számít; nincs második pillantás; a saját címem is számít) bukik. ⏭️ ④c a pótlás.
- **2026-11-27** — ✅ **④c1: a segítő szerepek** (Csaba: „Igen, jöhet a ④c”; a ④c négy részlépésre bontva — a 11. szakasz terve, 3.
  pont): a helyi jegyzék, a `koinon kosarak | segit | lead`, a nyitó jel `knk` mezője, a közös kosarak bármely párból, a tömörítés
  megtartja, a hirdetés és a számlálás a segítőkre is. Négy próba (három a `koinonDarabProba`-ban: a jel, a közös kosarak, a valódi
  csere; egy a parancssoron). ⚠️ A parancssori próba első két alakja két rontás mellett is átment — a szerző a saját eseményeit a csak
  küldő úton annak is odaadja, aki a kosarat tartja, és egy friss tag az első cseréjén a 0. mélységen mindent felvesz; a végleges
  alakban (előbb mindenki megismeri egymást, az egyezmény utána születik, és a vendég nem a szerzővel cserél) mindhárom rontásra
  (a csere nem kapja meg a segítőket; a tömörítés csak a saját darabot tartja; a jel nem viszi) bukik. ⏭️ ④c2 a felkérés.
- **2026-11-27** — ✅ **④c2: a felkérés** (Csaba: „Igen, jöhet a ④c2”): a `felkeres` kérelem, a jelölt gyors ellenőrzése a csere
  közben és a hiány saját megnézése a címjegyzék-körében (magát nem számolva), óránként egy új szerep, a vállalt kosár elkérése, a
  keret és a leadás fölötte; kézzel `koinon felker | felkeresek | keret`. Három próba (két tiszta, egy a parancssoron egy hamis DHT-vel:
  már tartja, nem a mélységén, nincs hiány, vállalja, vár az ütem miatt, a keret betelt), mindhárom rontásra (nem nézi a hiányt; nincs
  ütem; a gyors ellenőrzés nem nézi a már tartottat) bukik. ⏭️ ④c3 a pótlás.
