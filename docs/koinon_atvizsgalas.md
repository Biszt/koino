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

## 5. Napló

- **2026-11-19** — az átvizsgálás (kód nélkül); a KO1–KO5 Csabánál.
