// felulet/js/koinoNezetKeret.js

// Felelősség: ⭐⭐ EGY FELTÖLTÖTT NÉZET FUTTATÁSA A LAPON (D126 — a D123 PR4-e; NZ4–NZ6) — koinós többlet, a prototípusban nincs ilyen:
//   · A KERET (NZ5 (A)): a pakli helyén, egész lapon, felirattal (*„🧩 <cím> — feltöltött nézet: olvas, nem ír”*) és bezárással;
//     egy `<iframe sandbox="allow-scripts">` — semmi más engedély, `allow-same-origin` sem —, a tartalma `srcdoc`, amit a program
//     állít össze (a nézet CSP-je, az őr, a kliens és a kód — `js/felulet/nezetFelulet.js`). A keret semmit nem tölt be: a kódot a
//     lap kéri a programtól. A negyedik réteg a lap saját CSP-je (`frame-src 'none'` — a kapu fejléce). ⭐ A 92. mérés: a négy
//     réteggel a mért 30 kijutási út zárva, a sandbox egymagában kevés.
//   · A BESZÉD (NZ4 (A) — a nézet-felület 1): csak a SAJÁT keretünk üzenetére felelünk (`e.source`), csak a kimondott kérdésekre. A
//     `koino`, `en`, `entitasok`, `szoveg` kérdést a program válaszolja (`/api/nezet/kerdes` — és csak a bekapcsolt nézetét); a
//     `fajl`-t a lap (a bájtok a lenyomatukkal — a nézet `blob:`-ot csinál belőle, mert a CSP csak ezt engedi); a `megnyit`-ot is a
//     lap (NZ6 (A): a kártya a pakliban nyílik meg — a cselekvés a lap saját ablakában marad, a te kezeddel —, és egy gomb visz
//     vissza a nézethez). Ha egy csere újat hozott, a lap szól (`valtozas`).
//   · ⛔ Egyszerre legfeljebb néhány kérdés lehet úton — egy elszabadult nézet ne terhelje a programot.
//
// Használja: `koinoNezet.js` (a „🧩 Nézetek…” ablak és a kártya gombja).

import { apiGet, apiPost } from './utils/apiHelper.js';
import { aktivEntitasMentese } from './utils/authHelper.js';

/** A nézet-felület változata, amit ez a lap beszél (a program is ezt mondja — `/api/nezet/keret` `felulet`). */
export const NEZET_FELULET = 1;
const UTON_KORLAT = 4;                       // egyszerre ennyi kérdés lehet úton
const FAJL_KORLAT = 4 * 1024 * 1024;         // egy `fajl` válasz legfeljebb ennyi bájt
const LENYOMAT = /^[A-Za-z0-9_-]{43}$/;

const html = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** A futó nézet (egyszerre egy): `{ kartya, cim, doboz, keret, uton, rejtve }`. */
let futo = null;
let visszaGomb = null;

// ===================================
// A FUTTATÁS — a pakli helyén
// ===================================

/**
 * Egy bekapcsolt nézet megnyitása a pakli helyén. Ha a program nem adja a keretet (nincs bekapcsolva, a kódja változott, még
 * nincs meg), a hibát dobja — a hívó mondja ki.
 * @param {{kartya: string}} b
 */
export async function nezetFuttatasa({ kartya }) {
  console.log('nezetFuttatasa - KEZDÉS', { kartya });
  const k = await apiGet('nezet/keret?kartya=' + encodeURIComponent(kartya));
  if (k.felulet !== NEZET_FELULET) {
    throw new Error('Ezt a nézetet a program a(z) ' + k.felulet + '. nézet-felülettel adja, a lap a(z) ' + NEZET_FELULET + '.-et beszéli.');
  }
  nezetBezarasa({ frissit: false });
  const pakli = document.getElementById('pakli');
  const doboz = document.createElement('section');
  doboz.className = 'koino-nezet-futas';
  doboz.setAttribute('aria-label', 'Feltöltött nézet: ' + (k.cim ?? ''));
  doboz.innerHTML = '<div class="koino-nezet-futas__sav"><span class="koino-nezet-futas__felirat" title="A nézet a közösség feltöltött '
    + 'kódja: a koinó közös képét látja, írni nem tud, és kifelé nem szólhat. A rajza nem bizonyíték — a döntés a lap saját kártyáin '
    + 'van.">🧩 ' + html(k.cim) + ' — feltöltött nézet: olvas, nem ír</span><button type="button" class="koino-nezet-futas__bezar" '
    + 'data-muvelet="bezar">✕ Bezárás</button></div>';
  const keret = document.createElement('iframe');
  keret.className = 'koino-nezet-futas__keret';
  // ⛔ CSAK `allow-scripts`: a nézet eredete így „null” — a lap tárát, sütijét, DOM-ját nem éri el, a kapu (Origin-őr) nem szolgálja ki.
  keret.setAttribute('sandbox', 'allow-scripts');
  keret.setAttribute('referrerpolicy', 'no-referrer');
  keret.setAttribute('title', 'Feltöltött nézet: ' + (k.cim ?? ''));
  keret.srcdoc = k.srcdoc;
  doboz.appendChild(keret);
  doboz.querySelector('[data-muvelet="bezar"]').addEventListener('click', () => nezetBezarasa());
  if (pakli?.parentNode) pakli.parentNode.insertBefore(doboz, pakli.nextSibling);
  else document.body.appendChild(doboz);
  lapElrejtese(true);
  futo = { kartya: k.kartya, cim: k.cim, doboz, keret, uton: 0, rejtve: false };
  console.log('nezetFuttatasa - VÉGE', { kartya: k.kartya, bajt: k.kod?.bajt ?? null });
  return futo;
}

/** A nézet bezárása (a pakli visszajön, és frissül — a nézet alatt a csere hozhatott újat). */
export function nezetBezarasa({ frissit = true } = {}) {
  if (!futo) return;
  console.log('nezetBezarasa', { kartya: futo.kartya });
  futo.doboz.remove();
  futo = null;
  visszaGombEltavolitasa();
  lapElrejtese(false);
  if (frissit) window.aktivPakli?.frissites?.();
}

/** Fut-e most egy nézet (és melyik). */
export function futoNezet() {
  return futo ? { kartya: futo.kartya, cim: futo.cim, rejtve: futo.rejtve } : null;
}

/** A pakli (és a hozzá tartozó lap-elemek) elrejtése a nézet idejére — vagy vissza. */
function lapElrejtese(rejt) {
  const pakli = document.getElementById('pakli');
  if (pakli) pakli.hidden = rejt;
  const tovabb = document.getElementById('tovabb');
  if (tovabb && rejt) tovabb.hidden = true;
  // ⚠️ A testvér-jelző kacsacsőrei a lap aljára (`body`) kerülnek, és a pakli újrakérdezése vissza is teszi őket — a nézet fölött
  // ne lebegjenek: amíg a nézet látszik, a lap jele (`koino-nezet-fut`) rejti őket (és a pakli állapot-sorát).
  document.body.classList.toggle('koino-nezet-fut', rejt);
}

// ===================================
// ⭐ A „MEGNYIT” (NZ6 (A)) — a kártya a pakliban, és vissza a nézethez
// ===================================

async function kartyaMegnyitasa(azonosito) {
  if (!futo) return;
  console.log('nezet - kártya megnyitása', { azonosito });
  nezetElrejtese();
  aktivEntitasMentese(azonosito, 'Gondolat');
  await window.aktivPakli?.init?.(azonosito, 'Gondolat');
  document.dispatchEvent(new CustomEvent('koino:aktivEntitasValtozas', { detail: { entitasId: azonosito } }));
}

/** A nézet félre (a keret él tovább), a pakli elő, és egy gomb vissza a nézethez. */
function nezetElrejtese() {
  if (!futo || futo.rejtve) return;
  futo.rejtve = true;
  futo.doboz.hidden = true;
  lapElrejtese(false);
  visszaGombEltavolitasa();
  visszaGomb = document.createElement('button');
  visszaGomb.type = 'button';
  visszaGomb.className = 'koino-nezet-vissza';
  visszaGomb.textContent = '🧩 Vissza a nézethez: ' + (futo.cim ?? '');
  visszaGomb.addEventListener('click', () => {
    if (!futo) return;
    futo.rejtve = false;
    futo.doboz.hidden = false;
    lapElrejtese(true);
    visszaGombEltavolitasa();
  });
  document.body.appendChild(visszaGomb);
}

function visszaGombEltavolitasa() {
  visszaGomb?.remove();
  visszaGomb = null;
}

// ===================================
// ⭐ A BESZÉD — a nézet-felület 1 (postMessage)
// ===================================

function kuld(keret, uzenet, atad = []) {
  try { keret.contentWindow?.postMessage({ koinoNezet: NEZET_FELULET, ...uzenet }, '*', atad); } catch { /* a keret közben bezárult */ }
}

window.addEventListener('message', async (e) => {
  const f = futo;
  // ⛔ Csak a saját keretünk üzenete (az eredete „null” — a sandbox), és csak a nézet-felület alakja.
  if (!f || e.source !== f.keret.contentWindow) return;
  const u = e.data;
  if (!u || typeof u !== 'object' || u.koinoNezet !== NEZET_FELULET || !Number.isSafeInteger(u.id) || typeof u.kerdes !== 'string') return;
  if (f.uton >= UTON_KORLAT) {
    kuld(f.keret, { id: u.id, hiba: 'Túl sok kérdés egyszerre (legfeljebb ' + UTON_KORLAT + ') — várd meg a válaszokat.' });
    return;
  }
  f.uton++;
  try {
    if (u.kerdes === 'fajl') {
      const l = u.adat?.lenyomat;
      if (typeof l !== 'string' || !LENYOMAT.test(l)) throw new Error('A `fajl` kérdéshez egy fájl lenyomata kell.');
      const v = await fetch('/api/fajl/' + encodeURIComponent(l));
      if (!v.ok) throw new Error(v.status === 404 ? 'Ez a fájl még nincs meg ezen a készüléken.' : 'A fájl most nem olvasható (' + v.status + ').');
      const bajtok = await v.arrayBuffer();
      if (bajtok.byteLength > FAJL_KORLAT) throw new Error('A fájl túl nagy egy nézetnek (' + bajtok.byteLength + ' bájt).');
      kuld(f.keret, { id: u.id, valasz: { lenyomat: l, meret: bajtok.byteLength, bajtok } }, [bajtok]);
    } else if (u.kerdes === 'megnyit') {
      const az = u.adat?.azonosito;
      if (typeof az !== 'string' || !LENYOMAT.test(az)) throw new Error('A `megnyit` kérdéshez egy entitás azonosítója kell.');
      kuld(f.keret, { id: u.id, valasz: { megnyitva: true } });
      await kartyaMegnyitasa(az);
    } else {
      const v = await apiPost('nezet/kerdes', { kartya: f.kartya, kerdes: u.kerdes, adat: u.adat ?? null });
      kuld(f.keret, { id: u.id, valasz: v.valasz ?? null });
    }
  } catch (hiba) {
    kuld(f.keret, { id: u.id, hiba: hiba.message ?? String(hiba) });
  } finally {
    f.uton--;
  }
});

// ⭐ Ha a menüből (Keresés, Struktúra…) egy kártyára lépnek, a nézet félreáll (a gombbal vissza).
document.addEventListener('koino:aktivEntitasValtozas', () => nezetElrejtese());

// ⭐ Ha egy csere újat hozott (az alsó sáv jelzése), a nézet is megtudja.
document.addEventListener('koino:csereUjat', () => {
  if (futo) kuld(futo.keret, { esemeny: 'valtozas', adat: { ido: Date.now() } });
});
