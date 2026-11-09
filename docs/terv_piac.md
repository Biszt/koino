# ET-10 — A belső piac (terv, kód nélkül)

*A tervező ág dokumentuma ([`tervezo_ag.md`](tervezo_ag.md)), 2026-11-09. Programkód nem készült. A D-számok mellett a döntés címe áll.*

> **Állapot:** 🔍 tervezve · ⏸️ ET-10/1 – ET-10/5 Csabánál (6. szakasz).
>
> Csaba (2026-11-09): *„a piacot úgy képzeltem el, hogy az is csak egy tranzakció, csak a piacon keresztül ellenértéket is meg kell adni (ez
> lehet bármi: fiat pénz — akár készpénzben —, kriptopénz, vagy egy tehén, eper, vagy bármilyen ingóság). ezek jegyezve lesznek, és ezek
> fogják meghatározni a koinos értékét.”* — és: *„az utalási limit piac esetében függhetne a problémamentes üzleteken, ami végbement két fél
> között. pl. lenne egy kezdő felső limit, amit az össz koinosból határozunk meg, és ez minden sikeres üzletkötés után 50%-kal nőne.”*

## 1. A rövid válasz

**A piac egy feljegyzett ügylet:** ki ad mennyi koinost, és a másik fél mit ad érte — bármit (euró, kriptó, egy tehén, egy kosár eper).
Mindkét fél aláírja; a koinos-átutalás erre hivatkozik (a tanú-nyugták után végleges — ET-8); és ha megtörtént, mindketten visszaigazolják.
**Az ár** a feljegyzett ügyletekből derül ki — *„mindenki annyiért adja, amennyiért akarja, így fog megmutatkozni az értéke”* (Csaba,
2026-09-02).

**A limit — a véleményem: jó ötlet, és jól illik a koinóhoz:**
- **két ember közös múltjára épül**, nem egy személyre szabott pontszámra — így nem ütközik a **D49 — a jelzés tényt mutat, soha nem
  ítéletet** szabályával: mindenki ugyanonnan indul mindenkivel;
- **a hamis azonosság nem segít rajta:** ha egy csaló a saját hamis társaival köt sok ügyletet, az csak azokkal a párokkal emeli a limitet —
  egy valódi áldozattal ugyanúgy a kezdő határról indul;
- **a hosszú átverés drága:** hogy egy emberrel nagy összegben csaljon, előbb sok valódi, rendben lezárt ügyletet kell vele kötnie.

*Számokkal: ha a fejenkénti átlag 100 000, és a kezdő határ ennek 10%-a, akkor egy új partnerrel az első ügylet legfeljebb 10 000 koinos;
utána 15 000, az 5. után ~76 000, a 10. után ~577 000.*

## 2. Az ügylet menete

1. **Az ajánlat:** *„Eladok egy tehenet 500 000 koinosért”* vagy *„Veszek 1000 koinost, darabját 1 euróért”* — a piacon látszik, kereshető.
2. **A megállapodás:** a két fél **kölcsönösen aláírja** (mint a bemutatkozást — **D62 — a bemutatkozás lánc-esemény, és csak kölcsönösen
   számít**): ki ad mennyi koinost, és mit kap érte — a fajtája (euró, kriptó, állat, termény, tárgy…), a mennyisége, az egysége, és ha
   akarják, egy leírás.
3. **A koinos-átutalás** a megállapodásra hivatkozik; a tanú-nyugták után végleges (ET-8). A program ellenőrzi, hogy a pár limitjén belül
   van-e.
4. **A visszaigazolás:** mindkét fél aláírja: *„teljesült”* — vagy jelzi: *„probléma”*. A rendben lezárt ügylet növeli a pár limitjét; a
   probléma látszik (D19 — a rendszer bejelentő, nem bíró), és — ha így döntesz — visszaállítja a limitet.

**Az ellenérték a koinón kívül mozog** (a készpénzt, a tehenet a program nem látja) — ezért a visszaigazolás a két fél szava. A program
annyit tud: a koinos megmozdult, és mindketten azt mondták, rendben.

## 3. A limit — a részletek

- **Páronként és mindkét irányban:** Anna és Béla között egy limit van, akárki fizet koinost.
- **A kezdő határ** a napi kör fejenkénti átlagából (ET-8/2) — mindenkire ugyanaz, és a koinóval együtt nő.
- **A növekedés:** minden kölcsönösen visszaigazolt ügylet után 50%-kal.
- **Ha probléma volt:** ⏸️ kérdés (ET-10/3) — a javaslatom: a pár limitje visszaáll a kezdőre.
- **A nagy első ügylet** (pl. egy autó egy idegentől): több részletben, egymás után megkötve — minden rendben lezárt rész növeli a limitet.
  ⚠️ A piacon kívül egy sima átutalás (ellenérték nélkül) limit nélkül is mehet — a limit védőkorlát, nem börtön; de az ilyen átutalás nem
  kerül be a piac árai közé, és a pár múltjába sem.

## 4. Az ár — tájékoztatás, nem döntés

A koinos ára a feljegyzett ügyletekből számolható: egységenként (koinos / euró, koinos / kg eper…) a legutóbbi ügyletek **mediánja** — egy
kiugró, hamis ügylet így nem mozdítja el. ⭐ **Ez tájékoztatás, nem döntés:** semmi nem épül rá a számításban, ezért elég, ha minden gép a
saját maga ismert ügyleteiből számolja — nem kell rá közös szám (és így nem nő a teher a koinóval — 9. szabály).

## 5. A nyilvánosság

Az ügylet a koinón belül **nyilvános** — ki, mennyi koinos, milyen ellenérték, mennyi (a pénz nyilvános — D16; és ebből lesz az ár). A
részletes leírás elhagyható. ⚠️ Ha valaki nem akarja, hogy a vásárlása látsszon, egy sima átutalással fizethet — de az nem kerül a piac
árai közé.

## 6. A kérdések (⏸️ Csabáé)

- **ET-10/1 — Az ajánlat:** (A) ⭐ egy entitás (*„Ajánlat”* típus, egy *„Piac”* ág alatt) — a létrehozó pontja tartja életben; ha leveszi,
  elfelejtődik (**D14 — a tartós mag = a csalás-elleni csontváz**) — így magától lejár, és kereshető, vitatható; (B) egy könnyű, lejáró
  esemény (nem entitás — nem kell rá pont, de nem is kereshető a fában).
- **ET-10/2 — Az ügylet:** (A) ⭐ kölcsönösen aláírt megállapodás (a koinos és az ellenérték: fajta, mennyiség, egység, leírás), az
  átutalás erre hivatkozik, és mindkét fél visszaigazolja (*„teljesült”* / *„probléma”*); (B) csak egy átutalás, egy „ellenérték”
  megjegyzéssel (egyoldalú — nincs pár-múlt, nincs limit).
- **ET-10/3 — A limit** (Csaba ötlete): (A) ⭐ páronként: a kezdő határ a fejenkénti átlag 10%-a, minden visszaigazolt ügylet után +50%,
  probléma után vissza a kezdőre; (B) ugyanez, de probléma után csak felére esik; (C) személyenként (az összes partnerrel kötött ügylet
  számít) — ezt a hamis társak felfújhatják.
- **ET-10/4 — Az ár:** (A) ⭐ tájékoztató, minden gép a saját ismert ügyleteiből számolja (egységenkénti medián); (B) a napi kör mondja ki
  (közös szám — de semmi nem épül rá, fölösleges teher).
- **ET-10/5 — A nyilvánosság:** (A) ⭐ az ügylet a koinón belül nyilvános (ebből lesz az ár), a leírás elhagyható; (B) az ellenérték csak a
  két félnél (akkor nincs ár).

## 7. Ami nem ez a terv

- **A vita rendezése:** ha valaki „problémát” jelez, a program nem dönt (D19) — a közösség látja; egy vita-gondolat nyitható alatta.
- **A jogi kérdések** (adó, pénzügyi szabályozás) — a koino nem tervez jogi védelemre (8. szabály); a koinók maguk felelnek a saját
  környezetükért.

## Napló

- **2026-11-09** — a terv elkészült (a tervező ág, kód nélkül); ⏸️ ET-10/1 – ET-10/5 Csabánál.
