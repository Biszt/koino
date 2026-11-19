// felulet/js/koinoMagyarazat.js

// Felelősség: ⭐⭐ D129 (③) — AZ ⓘ JELEK ÉS A BUBORÉK — koinós többlet, a prototípusban nincs ilyen.
//
// Csaba (2026-11-19): „az információk, egy "i" jelre kattínva, előjön egy értehtő magyarázat, arra a részre. ilyen i betüket, szinte
// minden hova rakni kéne, a menübe, az összes modal ősszes részéhez, az alsósáv is kapjon i betüt, meg a fejléc is”.
//
//   · A HELYEK (`MAGYARAZAT_HELYEK`): egy CSS-választó (és ha kell, a felirat eleje) → egy kézikönyv-név. ⛔ Az örökölt, a
//     prototípussal BÁJTRA azonos fájlokhoz nem nyúlunk (`meres/kapuProba.js`): a jelet a lap KIRAJZOLÁSA UTÁN tesszük a helyére —
//     egy figyelő (`MutationObserver`) minden változás után megnézi, hol hiányzik (ahogy a `koinoModalok.js` is a modálok köré
//     írja a koinós többletet).
//   · A BUBORÉK (MA1 (A)): az ⓘ mellett nyílik, egy érintéssel bezárul, nem takarja el az ablakot (telefonon a lap alján); a
//     tartalma a kézikönyvé (`/api/kezikonyv/bejegyzes` — a program alap-tartalma, vagy a közösség módosítása, MA5 (A)): a cím,
//     a szöveg (MA2 (B): részletes), a részei (rájuk koppintva a buborék azokat mutatja — így egy sáv egyetlen ⓘ-je is mindent
//     elmagyaráz), honnan jön a szöveg, a rajta lévő pontok, és „📖 A kézikönyvben” — a gomb a pakliban a bejegyzéshez ugrik, ahol
//     tudatpontot tehetsz rá és jobbat javasolhatsz (MA6 (A), MA7 (A)).
//
// ⭐ A lap csak rajzol (7. szabály): a szöveget a program adja.
//
// Használja: `index.html` (betöltéskor indul).

import Modal from './components/modals/Modal.js';
import { apiGet } from './utils/apiHelper.js';
import { aktivEntitasMentese } from './utils/authHelper.js';

// ===================================
// A HELYEK
// ===================================

/**
 * Hova kerül ⓘ: a választó (a dokumentumban), ha kell a felirat (`felirat` — az elem szövegének eleje; ha `cimke` is van, annak
 * a belső elemnek a szövege, pontos egyezéssel), a kézikönyv-név, és hogyan (`mod`): `elejere` / `vegere` — az elem belsejébe,
 * elölre / hátra; `utana` — az elem mögé (testvérként: gomb mellé).
 * ⭐ A próba (`meres/kezikonyvProba.js`) nézi, hogy minden itteni név szerepel-e a program alap-tartalmában.
 */
// ⚠️ Csak a FŐ menü (`#hamburger-menu-kontener`): a kártyáknak is van menüjük ugyanazzal az elemmel, és néhány pontjuk ugyanúgy
// hangzik (pl. „Értesítési beállítások” — ott a kártyáé); azok a kártyák magyarázatai közé tartoznak.
const menuPont = (felirat, nev) => ({ hely: '#hamburger-menu-kontener .hamburger-menu-pont', cimke: '.hamburger-menu-pont__felirat',
  felirat, nev: 'kezikonyv/menu/' + nev, mod: 'vegere' });

export const MAGYARAZAT_HELYEK = Object.freeze([
  // ----- a menü: a panel tetején a menü egésze, és minden pontja (a gomb végén — a kattintása a menüpontot nem indítja) -----
  { hely: '#hamburger-menu-kontener .hamburger-menu-panel', nev: 'kezikonyv/menu', mod: 'elejere' },
  menuPont('Keresés', 'kereses'), menuPont('Struktúra nézet', 'struktura'), menuPont('Világtérkép', 'vilagterkep'),
  menuPont('Síkidom nézet', 'sikidom'), menuPont('Rendezés', 'rendezes'), menuPont('Nézetek…', 'nezetek'),
  menuPont('A tér — a koinóim', 'ter'), menuPont('Bekapcsolódás…', 'bekapcsolodas'),
  menuPont('Új koino-verzió (gyermek)…', 'koino-verzio'), menuPont('A program ezen a készüléken…', 'program'),
  menuPont('Felderítések', 'felderitesek'), menuPont('Az egész koinó felderítése…', 'felderites-egesz'),
  menuPont('Értesítések', 'ertesitesek'), menuPont('Értesítési beállítások', 'ertesitesi-beallitasok'),
  menuPont('Új gondolat létrehozása', 'uj-gondolat'), menuPont('Új kategória létrehozása', 'uj-kategoria'),
  menuPont('Új gondolat típus létrehozása', 'uj-gondolattipus'), menuPont('Új nézet…', 'uj-nezet'),
  menuPont('Meghívóim', 'meghivoim'), menuPont('Készülékeim', 'keszulekeim'), menuPont('Tudatpontok', 'tudatpontok'),
  menuPont('eember beállítások', 'eember-beallitasok'),
  // ----- a fejléc: a tér sávja (egy ⓘ — a részei a buborékból), a belépő sávja, az állapot-sor -----
  { hely: '#ter-sav', nev: 'kezikonyv/fejlec/ter-sav', mod: 'elejere' },
  { hely: '#belepes-sav', nev: 'kezikonyv/fejlec/belepes', mod: 'elejere' },
  { hely: '#allapot', nev: 'kezikonyv/fejlec/allapot', mod: 'elejere' },
  // ----- az alsó sáv: egyetlen ⓘ a sáv elején (telefonon egy sor — a részei a buborékból nyílnak) -----
  { hely: '.also-sav__infok', nev: 'kezikonyv/also-sav', mod: 'elejere' },
  // ----- a „📱 Készülékeim” ablak -----
  { hely: '.koino-keszulekek__leiras', nev: 'kezikonyv/ablak/keszulekeim', mod: 'vegere' },
  { hely: '.koino-keszulekek__keszulek .koino-keszulekek__fej', nev: 'kezikonyv/ablak/keszulekeim/keszulek', mod: 'vegere' },
  { hely: '.koino-keszulekek__hatar label', nev: 'kezikonyv/ablak/keszulekeim/hatar', mod: 'vegere' },
  { hely: '.koino-keszulekek button[data-kizar]', nev: 'kezikonyv/ablak/keszulekeim/kizaras', mod: 'utana' },
  { hely: '.koino-keszulekek h4', felirat: 'Új készülék', nev: 'kezikonyv/ablak/keszulekeim/felvetel', mod: 'vegere' },
  { hely: '.koino-keszulekek h4', felirat: 'A papír', nev: 'kezikonyv/ablak/keszulekeim/papir', mod: 'vegere' }
]);

const JEL_OSZTALY = 'koino-magyarazat__jel';

const html = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ===================================
// A JELEK ELHELYEZÉSE
// ===================================

/** Egy ⓘ jel (gomb-szerepű elem — gomb a gombban nem lehet). */
function jelKeszitese(nev) {
  const jel = document.createElement('span');
  jel.className = JEL_OSZTALY;
  jel.textContent = 'ⓘ';
  jel.setAttribute('role', 'button');
  jel.setAttribute('tabindex', '0');
  jel.setAttribute('aria-label', 'Magyarázat');
  jel.title = 'Magyarázat';
  jel.dataset.nev = nev;
  return jel;
}

/**
 * A hiányzó jelek a helyükre — minden lap-változás után fut (a figyelő), olcsón: csak ahol még nincs.
 * @param {ParentNode} [gyoker]
 * @returns {number} hány új jel került ki
 */
export function jelekElhelyezese(gyoker = document) {
  let uj = 0;
  for (const h of MAGYARAZAT_HELYEK) {
    for (const elem of gyoker.querySelectorAll(h.hely)) {
      if (h.felirat) {
        const szoveg = (h.cimke ? elem.querySelector(h.cimke)?.textContent : elem.textContent)?.trim() ?? '';
        if (h.cimke ? szoveg !== h.felirat : !szoveg.startsWith(h.felirat)) continue;
      }
      // ⭐ Ott van-e MÁR — a jelet nézzük, nem egy jelzést az elemen: a lap egyes részeit (a belépő sávja, az állapot-sor) minden
      // frissítéskor újraírja, és a jel ilyenkor eltűnik, az elem maga marad.
      const megvan = h.mod === 'utana'
        ? elem.nextElementSibling?.classList.contains(JEL_OSZTALY) && elem.nextElementSibling.dataset.nev === h.nev
        : [...elem.children].some((c) => c.classList.contains(JEL_OSZTALY) && c.dataset.nev === h.nev);
      if (megvan) continue;
      const jel = jelKeszitese(h.nev);
      if (h.mod === 'elejere') elem.prepend(jel);
      else if (h.mod === 'utana') elem.after(jel);
      else elem.append(jel);
      uj++;
    }
  }
  if (uj) console.log('koinoMagyarazat.jelekElhelyezese', { uj });
  return uj;
}

// ===================================
// A BUBORÉK
// ===================================

let nyitott = null;   // { buborek, jel }

/** A nyitott buborék bezárása. */
function buborekBezarasa() {
  if (!nyitott) return;
  nyitott.buborek.remove();
  nyitott = null;
}

/** A buborék a jel mellé (alá, ha elfér; különben fölé) — telefonon a CSS a lap aljára teszi. */
function buborekHelyezese(buborek, jel) {
  const r = jel.getBoundingClientRect();
  const b = buborek.getBoundingClientRect();
  const lent = window.innerHeight - r.bottom;
  const top = lent >= b.height + 12 || lent >= r.top ? r.bottom + 6 : Math.max(8, r.top - b.height - 6);
  const left = Math.min(Math.max(8, r.left - 16), Math.max(8, window.innerWidth - b.width - 8));
  buborek.style.top = Math.round(top) + 'px';
  buborek.style.left = Math.round(left) + 'px';
}

/** A szöveg bekezdésekre (üres sor választ el). */
function bekezdesek(szoveg) {
  return String(szoveg ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => '<p>' + html(p).replace(/\n/g, '<br>') + '</p>').join('');
}

/**
 * Egy bejegyzés a buborékban (a részei közt lépkedve ugyanabban a buborékban, „‹ vissza”-val).
 * @param {HTMLElement} jel - amelyik ⓘ nyitotta
 * @param {string} nev - a kézikönyv-név
 * @param {Array<string>} [elozok] - a visszalépéshez
 */
async function buborekNyitasa(jel, nev, elozok = []) {
  console.log('koinoMagyarazat.buborekNyitasa - KEZDÉS', { nev });
  if (!nyitott || nyitott.jel !== jel) {
    buborekBezarasa();
    const buborek = document.createElement('div');
    buborek.className = 'koino-magyarazat__buborek';
    buborek.setAttribute('role', 'dialog');
    buborek.setAttribute('aria-label', 'Magyarázat');
    document.body.append(buborek);
    nyitott = { buborek, jel };
  }
  const { buborek } = nyitott;
  buborek.innerHTML = '<p class="koino-magyarazat__betoltes">Betöltés…</p>';
  buborekHelyezese(buborek, jel);
  let b;
  try {
    b = await apiGet('kezikonyv/bejegyzes?nev=' + encodeURIComponent(nev));
  } catch (hiba) {
    buborek.innerHTML = '<div class="koino-magyarazat__fej"><span></span><button type="button" class="koino-magyarazat__bezar" '
      + 'aria-label="Bezárás">✕</button></div><p>Ehhez még nincs magyarázat (' + html(hiba.message) + ').</p>';
    buborek.querySelector('.koino-magyarazat__bezar').onclick = buborekBezarasa;
    return;
  }
  if (!nyitott || nyitott.buborek !== buborek) return;   // közben bezárták
  const forras = !b.ismert ? 'Ezt a programod nem ismeri — a közösség hozta létre.'
    : b.forras === 'kozosseg' ? '✍️ A közösség módosította.' : '📦 A program szövege.';
  // ⭐⭐ a koinon pontja (mindig 1 — a közösség közös tárhelye őrzi) külön: a közösség pontjait mondjuk
  const kozossegi = Math.max(0, (b.osszesPont ?? 0) - (b.koinonPont ?? 0));
  const pont = kozossegi > 0
    ? ' · ' + kozossegi.toLocaleString() + ' tudatpont van rajta' + (b.sajatPont > 0 ? ' (tőled ' + b.sajatPont.toLocaleString() + ')' : '')
    : '';
  const reszek = (b.gyerekek ?? []).length
    ? '<div class="koino-magyarazat__reszek"><span>Részei:</span><ul>' + b.gyerekek.map((g) =>
      '<li><button type="button" class="koino-magyarazat__resz" data-nev="' + html(g.nev) + '">' + html(g.cim ?? g.nev) + '</button></li>')
      .join('') + '</ul></div>'
    : '';
  buborek.innerHTML = '<div class="koino-magyarazat__fej">'
    + (elozok.length ? '<button type="button" class="koino-magyarazat__vissza" aria-label="Vissza">‹</button>' : '')
    + '<h4 class="koino-magyarazat__cim">' + html(b.cim ?? nev) + '</h4>'
    + '<button type="button" class="koino-magyarazat__bezar" aria-label="Bezárás">✕</button></div>'
    + '<div class="koino-magyarazat__szoveg">' + bekezdesek(b.szoveg) + '</div>'
    + reszek
    + (b.programJavaslat ? '<p class="koino-magyarazat__ajanlat">⭐ A program új szöveget javasol ehhez — a kézikönyvben elindíthatod.</p>' : '')
    + '<div class="koino-magyarazat__lab"><span>' + html(forras + pont) + '</span>'
    + '<button type="button" class="koino-magyarazat__gomb" title="A pakliban: tudatpontot tehetsz rá, és jobbat javasolhatsz">'
    + '📖 A kézikönyvben</button></div>';
  buborek.querySelector('.koino-magyarazat__bezar').onclick = buborekBezarasa;
  buborek.querySelector('.koino-magyarazat__vissza')?.addEventListener('click', () => buborekNyitasa(jel, elozok.at(-1), elozok.slice(0, -1)));
  for (const r of buborek.querySelectorAll('.koino-magyarazat__resz')) {
    r.addEventListener('click', () => buborekNyitasa(jel, r.dataset.nev, [...elozok, nev]));
  }
  buborek.querySelector('.koino-magyarazat__gomb').addEventListener('click', () => kezikonyvbenMegnyitas(b.azonosito));
  buborekHelyezese(buborek, jel);
  console.log('koinoMagyarazat.buborekNyitasa - VÉGE', { nev, forras: b.forras });
}

/** A bejegyzés a pakliban: a nyitott ablakok bezárulnak, a pakli a bejegyzéshez ugrik. */
async function kezikonyvbenMegnyitas(azonosito) {
  console.log('koinoMagyarazat.kezikonyvbenMegnyitas', { azonosito });
  buborekBezarasa();
  for (let i = 0; i < 10 && Modal.vanNyitottModal(); i++) Modal.legfelsoModalBezarasa();
  aktivEntitasMentese(azonosito, 'Gondolat');
  await window.aktivPakli?.init?.(azonosito, 'Gondolat');
}

// ===================================
// AZ INDÍTÁS
// ===================================

/** A figyelő és a kattintások — egyszer, a lap betöltésekor. */
export function magyarazatInditasa() {
  console.log('koinoMagyarazat.magyarazatInditasa - KEZDÉS');
  jelekElhelyezese();
  let utemezve = false;
  new MutationObserver(() => {
    if (utemezve) return;
    utemezve = true;
    // ⛔ NEM `requestAnimationFrame`: a háttérben (egy nem látható fülön) a böngésző azt nem futtatja — a figyelő beragadt, és több
    // ⓘ nem került ki (a böngészős kipróbálás lelete). Az időzítő a háttérben is lefut.
    setTimeout(() => { utemezve = false; jelekElhelyezese(); }, 30);
  }).observe(document.body, { childList: true, subtree: true });

  // ⭐ Az ⓘ kattintása (és Enter/szóköz) — a szülő elem (gomb, címke, menüpont) ne kapja meg.
  const nyit = (esemeny) => {
    const jel = esemeny.target.closest?.('.' + JEL_OSZTALY);
    if (!jel) return false;
    esemeny.preventDefault();
    esemeny.stopPropagation();
    if (nyitott?.jel === jel) buborekBezarasa();
    else buborekNyitasa(jel, jel.dataset.nev);
    return true;
  };
  document.addEventListener('click', (e) => {
    if (nyit(e)) return;
    if (nyitott && !nyitott.buborek.contains(e.target)) buborekBezarasa();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nyitott) { buborekBezarasa(); e.stopPropagation(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains(JEL_OSZTALY)) nyit(e);
  }, true);
  console.log('koinoMagyarazat.magyarazatInditasa - VÉGE');
}
