// felulet/js/koinoTelepites.js

// Felelősség: ⭐⭐ D125 (D123 PR5) — A TELEPÍTÉS A KÁRTYÁRÓL A LAPON — koinós többlet, a prototípusban nincs ilyen:
//   · AZ ELŐNÉZET (TK2–TK4): egy koino-verzió kártya „Kód” fülének „⬇ Telepítés erre a készülékre…” gombja nyitja — ki tette fel,
//     hány pont van rajta, megvan-e minden fájlja (ha nem, a kód kérése — TK4), rétegenként mi változik a futó programhoz képest,
//     ⚠️ melyik koinóidban futnál más számítással (TK3 — kimondva, nem tiltva), és a figyelmeztetés: a kód a kulcsaiddal fut;
//   · A TELEPÍTÉS (TK1): a program kiírja a kártya kódját a régi mellé, és elindítja a cserét — a futó program leáll, az új egy
//     ÚJ lapon nyílik meg (a lap kulcsa indításonként új: ez a fül utána csak figyel — a kezdőlapot kérdezi, ami kulcs nélkül is
//     válaszol —, és kimondja, ha a program újraindult);
//   · A VISSZAÚT (TK5): „↩ Vissza az előző programra” — az előnézetben és a fő menü „🧬 A program ezen a készüléken…” ablakában;
//   · AZ EREDMÉNY: a lap betöltésekor, ha a program az imént cserélődött (vagy a nem induló újat visszafordította), egyszer kimondja
//     (a csere szkriptje írja: `/api/telepites` → `utolso`).
//
// ⭐ A lap csak rajzol (7. szabály): a kiírást, a cserét és a visszautat a program végzi (`koino.js` — ugyanaz, mint a `telepit`
// parancsé). Használja: `koinoVerzio.js` (a „Kód” fül gombja, és a betöltéskori kimondás), `foMenu.js` (a program ablaka).

import Modal from './components/modals/Modal.js';
import { apiGet, apiPost } from './utils/apiHelper.js';
import { kodKereseGomb } from './koinoTorzs.js';   // ⭐ D120 / TK4: a hiányzó kód kérése

const MODAL_KONTENER = 'modal-kontener';
const LATOTT_KULCS = 'koino-telepites-latott';   // a már kimondott eredmény ideje (ugyanazt csak egyszer mondjuk ki)
const EREDMENY_FRISS = 15 * 60 * 1000;            // ennél régebbi eredményt a betöltés nem mond ki

const html = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rovid = (az) => String(az ?? '').slice(0, 12) + '…';
const MI = { uj: '+ új', eltunt: '− eltűnt', mas: '~ más' };

/** Egy réteg változásai: a darabszám és (lenyitva) a fájlok. */
function retegHtml(nev, lista, figyelem = false) {
  if (!lista.length) return '<li class="koino-telepites__reteg">' + html(nev) + ': nem változik</li>';
  return '<li class="koino-telepites__reteg' + (figyelem ? ' koino-telepites__reteg--figyelem' : '') + '"><details><summary>'
    + html(nev) + ': ' + lista.length + ' fájl változik</summary><ul class="koino-telepites__fajlok">'
    + lista.map((x) => '<li><code>' + html(x.ut) + '</code> <span class="koino-telepites__mi">' + html(MI[x.mi] ?? x.mi) + '</span></li>').join('')
    + '</ul></details></li>';
}

/**
 * Vár, amíg a program újraindul — a lap RÉGI kulcsával kérdez: ha a régi program fut, felel (200); ha leállt, nincs kapcsolat; ha
 * az ÚJ fut, a régi kulcsot nem fogadja el (401/403 — a kulcs indításonként új). ⭐ Így az újraindulás akkor is látszik, ha a leállást
 * nem láttuk (gyorsabb volt, mint egy kérdés).
 */
async function ujrainditasFigyelese(jelez) {
  const kulcs = new URLSearchParams(location.search).get('kulcs') ?? '';
  let leallt = false;
  for (let i = 0; i < 120; i++) {
    await new Promise((kesz) => setTimeout(kesz, 1000));
    let allapot = 0;
    try { allapot = (await fetch('/api/telepites', { cache: 'no-store', headers: { 'X-Koino-Kulcs': kulcs } })).status; } catch { allapot = 0; }
    if (allapot === 0 && !leallt) { leallt = true; jelez('leallt'); }
    if (allapot === 401 || allapot === 403) { jelez('ujraindult'); return true; }
  }
  jelez(leallt ? 'nem-indult' : 'nem-allt-le');
  return false;
}

/**
 * ⭐⭐ A TELEPÍTÉS ABLAKA — egy kártyára (az előnézet és a telepítés), vagy kártya nélkül (a program ezen a készüléken, a visszaút).
 * @param {{kartya?: string|null}} [b]
 */
export async function telepitesMegnyitasa({ kartya = null } = {}) {
  console.log('telepitesMegnyitasa - KEZDÉS', { kartya });
  const tartalom = document.createElement('div');
  tartalom.className = 'koino-telepites';
  const modal = new Modal(MODAL_KONTENER, {
    cim: kartya ? '⬇ Telepítés a kártyáról' : '🧬 A program ezen a készüléken',
    meret: 'alap',
    tartalom,
    gombok: [{ felirat: 'Bezárás', tipus: 'masodlagos', akcio: () => modal.bezaras() }]
  });
  let el = null;          // az előnézet (kártyával) vagy az állapot
  let megerosites = false;
  let folyamat = null;    // null | 'kuld' | 'leallt' | 'ujraindult' | 'nem-indult' | 'nem-allt-le'
  let csereMondat = '';

  const programHtml = (a) => '<p class="koino-telepites__leiras">A futó program: <code title="' + html(a.sajat?.lenyomat) + '">'
    + html(rovid(a.sajat?.lenyomat)) + '</code>' + (a.mag ? ' · a magja: <code title="' + html(a.mag.lenyomat ?? a.mag?.sajat?.lenyomat)
    + '">' + html(rovid(a.mag.lenyomat ?? a.mag?.sajat?.lenyomat)) + '</code>' : '') + '</p>'
    + (a.utolso?.mondat ? '<p class="koino-telepites__leiras">Az utolsó telepítés: ' + html(a.utolso.mondat) + '</p>' : '');

  const rajzol = () => {
    if (folyamat) {
      const allas = {
        kuld: 'A csere indul…',
        leallt: '⏳ A program leállt, a mappák helyet cserélnek, és az új indul — a lapja egy ÚJ fülön nyílik meg.',
        ujraindult: '✓ A program újraindult. A lapja egy új fülön nyílt meg (ott olvasod az eredményt — ha az új 30 mp alatt nem felelt '
          + 'volna, a régi fut újra). Ez a fül bezárható.',
        'nem-indult': '⚠ A program leállt, de két perc alatt nem indult újra. Indítsd el kézzel (az asztali „koino” ikon, vagy a Termuxban: '
          + 'koino) — az eredmény a koino-adat mappa telepites.json fájljában.',
        'nem-allt-le': '⚠ A program nem állt le — a csere talán el sem indult. Nézd meg a koino-adat mappa telepites.log fájlját.'
      }[folyamat];
      tartalom.innerHTML = '<p class="koino-telepites__leiras">' + html(csereMondat) + '</p><p class="koino-telepites__allas">'
        + html(allas) + '</p>';
      return;
    }
    if (!el) return;
    const hely = el.hely ?? {};
    const vissza = el.regiVan && hely.lehet
      ? '<div class="koino-telepites__gombok"><button type="button" class="koino-telepites__gomb" data-muvelet="vissza">↩ Vissza az '
        + 'előző programra</button></div><p class="koino-telepites__megjegyzes">Az előző program: ' + html(hely.regi) + ' (a következő '
        + 'cseréig megmarad).</p>'
      : '';
    if (!kartya) {
      tartalom.innerHTML = programHtml(el) + (hely.lehet ? '' : '<p class="koino-megjegyzes">A csere ezen a készüléken nem megy: '
        + html(hely.ok) + '</p>') + (vissza || '<p class="koino-telepites__megjegyzes">Előző program nincs: a visszaút az első csere '
        + 'után lesz. Telepíteni egy koino-verzió kártya „🧬 Kód” fülén lehet.</p>');
      return;
    }
    const k = el.kartya;
    let h = '<p class="koino-telepites__leiras">A kártya: <strong>' + html(k.cim) + '</strong> — feltöltötte <code title="'
      + html(k.szerzo) + '">' + html(rovid(k.szerzo)) + '</code>, ' + k.pont + ' tudatpont rajta (a közösség jelzése — nem engedély).</p>';
    if (el.ugyanaz) {
      tartalom.innerHTML = h + '<p class="koino-kod__egyezik">✓ Ezen a készüléken már ez a program fut — nincs mit telepíteni.</p>' + vissza;
      return;
    }
    h += '<p class="koino-telepites__leiras">A kód: <code title="' + html(el.kod?.lenyomat) + '">' + html(rovid(el.kod?.lenyomat))
      + '</code> · a futó: <code title="' + html(el.sajat?.lenyomat) + '">' + html(rovid(el.sajat?.lenyomat)) + '</code></p>';
    // ⭐ TK4: a fájlok
    h += el.osszes === null
      ? '<p class="koino-megjegyzes">A kód jegyzéke még nincs meg ezen a készüléken — kérd el (lent), és a következő csere hozza.</p>'
      : el.teljes ? '<p class="koino-telepites__leiras">A fájljai: mind megvan (' + el.osszes + ').</p>'
        : '<p class="koino-megjegyzes">A fájljai: ' + el.megvan + '/' + el.osszes + ' van meg — a telepítéshez mind kell. Kérd el (lent): '
          + 'a következő cserék hozzák.</p>';
    if (!el.teljes) h += '<div class="koino-telepites__keres"></div>';
    // ⭐ TK2: a rétegek
    if (el.retegek) {
      h += '<ul class="koino-telepites__retegek">'
        + retegHtml(el.mag?.egyezik === false ? '⚠ A számítás magja (más!)' : 'A számítás magja', el.retegek.mag, el.mag?.egyezik === false)
        + retegHtml('A felület', el.retegek.felulet) + retegHtml('A többi (a protokoll, a helyi viselkedés)', el.retegek.tobbi)
        + '</ul><p class="koino-telepites__megjegyzes">' + el.retegek.ugyanaz + ' fájl változatlan. A fájlokat a „🧬 Kód” fülön olvashatod.</p>';
    }
    // ⭐ TK3: a más mag koinónként
    if (el.mas?.length) {
      h += '<p class="koino-kod__mas">⚠ Ezekben a koinóidban MÁS SZÁMÍTÁSSAL futnál (más maggal születtek — ott a koinó képe eltérhet a '
        + 'többiekétől; ha ott maradsz, a régit futtasd): ' + el.mas.map((x) => '<strong>' + html(x.nev ?? rovid(x.koino)) + '</strong>').join(', ')
        + '</p>';
    }
    h += '<p class="koino-telepites__figyelem">' + html(el.figyelmeztetes) + '</p>';
    if (!hely.lehet) {
      h += '<p class="koino-megjegyzes">A csere ezen a készüléken nem megy: ' + html(hely.ok) + '</p>';
    } else if (el.teljes) {
      h += megerosites
        ? '<p class="koino-telepites__figyelem">Biztos? A futó program leáll, a kártya programja indul (a régi a ' + html(hely.regi)
          + ' mappában marad — a visszaút). Ha az új 30 mp alatt nem felel, a régi kerül vissza.</p><div class="koino-telepites__gombok">'
          + '<button type="button" class="koino-telepites__gomb" data-muvelet="megse">Mégse</button><button type="button" class="'
          + 'koino-telepites__gomb koino-telepites__gomb--fo" data-muvelet="telepitem">Igen, telepítem</button></div>'
        : '<div class="koino-telepites__gombok"><button type="button" class="koino-telepites__gomb koino-telepites__gomb--fo" '
          + 'data-muvelet="megerosites">⬇ Telepítem erre a készülékre…</button></div>';
    }
    tartalom.innerHTML = h + vissza;
    if (!el.teljes) {
      kodKereseGomb(k.azonosito).then((g) => { if (g) tartalom.querySelector('.koino-telepites__keres')?.appendChild(g); });
    }
  };

  const csere = async (ut, test) => {
    folyamat = 'kuld';
    rajzol();
    try {
      // ⚠️ MÉRVE (a böngészőben): ha a program a válasza előtt leállt, a kérés el sem bukott, csak függött — 15 mp után figyelünk
      const hatarido = new Promise((_, baj) => setTimeout(() => baj(new TypeError('nincs válasz 15 mp alatt')), 15000));
      csereMondat = (await Promise.race([apiPost(ut, test), hatarido])).mondat ?? '';
    } catch (hiba) {
      // ⚠️ ha a válasz a kapcsolat megszakadása miatt veszett el (a program a válasza előtt leállt), a csere valószínűleg elindult
      if (hiba instanceof TypeError) {
        csereMondat = 'A program a válasza előtt leállt — a csere valószínűleg elindult.';
        await ujrainditasFigyelese((allapot) => { folyamat = allapot; rajzol(); });
        return;
      }
      folyamat = null;
      megerosites = false;
      modal.hibaBeallitasa(hiba.message ?? 'A csere nem indult el.');
      rajzol();
      return;
    }
    await ujrainditasFigyelese((allapot) => { folyamat = allapot; rajzol(); });
  };

  tartalom.addEventListener('click', async (e) => {
    const gomb = e.target.closest('button[data-muvelet]');
    if (!gomb || gomb.disabled) return;
    e.stopPropagation();
    const muvelet = gomb.dataset.muvelet;
    if (muvelet === 'megerosites') { megerosites = true; rajzol(); return; }
    if (muvelet === 'megse') { megerosites = false; rajzol(); return; }
    if (muvelet === 'telepitem') await csere('telepites', { kartya });
    if (muvelet === 'vissza') await csere('telepites/vissza', {});
  });

  await modal.init();
  modal.megnyitas();
  try {
    el = await apiGet('telepites' + (kartya ? '?kartya=' + encodeURIComponent(kartya) : ''));
    rajzol();
  } catch (hiba) {
    tartalom.innerHTML = '<p class="koino-megjegyzes">Az előnézet most nem kérdezhető le: ' + html(hiba.message) + '</p>';
  }
  console.log('telepitesMegnyitasa - VÉGE', { ugyanaz: el?.ugyanaz ?? null, teljes: el?.teljes ?? null });
  return modal;
}

/**
 * ⭐ AZ EREDMÉNY A BETÖLTÉSKOR: ha a program az imént cserélődött (vagy visszafordult), egyszer kimondja — ugyanazt az eredményt
 * ugyanabban a böngészőben csak egyszer (a `localStorage` jegyzi — ha nincs, minden betöltéskor, amíg friss).
 */
export async function telepitesEredmenyenekKimondasa() {
  let a;
  try { a = await apiGet('telepites'); } catch { return; }
  const u = a?.utolso;
  if (!u || !u.mikor || !['kesz', 'visszafordult', 'bukott'].includes(u.allapot) || Date.now() - u.mikor > EREDMENY_FRISS) return;
  let latott = null;
  try { latott = localStorage.getItem(LATOTT_KULCS); } catch { /* privát ablak */ }
  if (latott === String(u.mikor)) return;
  try { localStorage.setItem(LATOTT_KULCS, String(u.mikor)); } catch { /* privát ablak */ }
  console.log('telepitesEredmenyenekKimondasa', { allapot: u.allapot });
  const tartalom = document.createElement('div');
  tartalom.className = 'koino-telepites';
  tartalom.innerHTML = '<p class="' + (u.allapot === 'kesz' ? 'koino-kod__egyezik' : 'koino-kod__mas') + '">' + html(u.mondat) + '</p>'
    + (a.regiVan && a.hely?.lehet ? '<p class="koino-telepites__megjegyzes">Ha mégsem ezt akarod: a fő menü „🧬 A program ezen a '
      + 'készüléken…” ablakában visszaállhatsz az előzőre.</p>' : '');
  const modal = new Modal(MODAL_KONTENER, {
    cim: u.allapot === 'kesz' ? (u.vissza ? '↩ Visszaálltál' : '⬇ Telepítve') : '⚠ A telepítés',
    meret: 'alap',
    tartalom,
    gombok: [{ felirat: 'Rendben', tipus: 'masodlagos', akcio: () => modal.bezaras() }]
  });
  await modal.init();
  modal.megnyitas();
}
