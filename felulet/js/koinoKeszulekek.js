// felulet/js/koinoKeszulekek.js

// Felelősség: ⭐⭐ D128 (④b — 9.14) — „📱 KÉSZÜLÉKEIM” A LAPON — koinós többlet, a prototípusban nincs ilyen:
//   · A KÉSZÜLÉKEK: a nevük, a rövid kulcsuk, koinónként a láncuk vége (és amit a koinó-listájukban mondtak — ③d), a kizártak, a
//     régebbi kulccsal tanúsítottak (KH3 (A): kizárás nélkül a múltjuk nem számít);
//   · A FELVÉTEL (KF1 (A)): „➕ Új készülék felvétele” — a program párosítást indít (a kapu a párosítás idejére nyitva), a lap a
//     telepítő sort mutatja a párosító kóddal és a QR-ét (a telefon kamerája szöveggé olvassa — egy sor a Termuxba), és vár; ha a
//     telefon felkerült, az ellenőrző kódot (a telefonon ugyanezt kell látnod);
//   · A KIZÁRÁS: egy készülék kizárása (kétszeri kattintással — a második megerősít); a koinók, ahová bekerült;
//   · A HATÁR (④c — KH1): a saját készülékemnek magától legfeljebb ennyit adok — készülékenként; üresen az alap (a keret 20%-a);
//   · A PAPÍR: él-e, a gépen van-e még a fájlja, és a 2. lépcső figyelmeztetése.
// Egy FELVETT készüléken (az azonosság kulcsa nincs rajta) a felvétel és a kizárás nem látszik — a lap kimondja, hogy az a kezelőn megy.
//
// ⭐ A lap csak rajzol (7. szabály): a listát, a párosítást, a kizárást és a határt a program végzi (`koino.js` `keszulekekLapja`,
// `parositasLaprol`, `keszulekKizarasaItt`, `szemelyesHatarBeallitasa` — ugyanaz, mint a `kizar` és a `keszulek` parancsé).
//
// Használja: `foMenu.js`.

import Modal from './components/modals/Modal.js';
import { apiGet, apiPost } from './utils/apiHelper.js';

const MODAL_KONTENER = 'modal-kontener';
const KERDEZES = 2000;   // a párosítás állását ennyi ms-onként kérdezzük

const html = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const koinoNeve = (x) => (x.nev ? '„' + x.nev + '”' : String(x.koino).slice(0, 8) + '…');

/** Egy készülék sora. */
function keszulekHtml(d, kezelo) {
  const jelek = [];
  if (d.sajat) jelek.push('<span class="koino-keszulekek__jel">ez a készülék</span>');
  if (d.kizarva) jelek.push('<span class="koino-keszulekek__jel koino-keszulekek__jel--kizarva">kizárva</span>');
  if (d.regi) {
    jelek.push('<span class="koino-keszulekek__jel koino-keszulekek__jel--figyelem" title="Egy régebbi kulcs tanúsította: kizárás nélkül'
      + ' a múltja nem számít; a kizárása a vágásig megtartja.">régebbi kulcs</span>');
  }
  const koinok = [...d.koinok.map((x) => koinoNeve(x) + ': ' + x.n + ' esemény'),
    ...d.listaKoinok.map((x) => koinoNeve(x) + ': a listája szerint ' + x.n + ' esemény (' + (x.ismert ? 'itt nincs láncrésze' : 'itt nem ismert koinó') + ')')];
  const hatar = !d.sajat && !d.kizarva
    ? '<div class="koino-keszulekek__hatar"><label>Határ (ennyit adok neki magától): <input type="number" min="0" step="100" '
      + 'data-hatar="' + html(d.k) + '" value="' + (d.hatar ?? '') + '" placeholder="alap: a keret 20%-a"></label> '
      + '<button type="button" class="koino-keszulekek__gomb" data-hatar-mentes="' + html(d.k) + '">Mentés</button></div>'
    : '';
  const kizar = kezelo && !d.sajat && !d.kizarva
    ? '<button type="button" class="koino-keszulekek__gomb koino-keszulekek__gomb--veszely" data-kizar="' + html(d.k) + '">Kizárás…</button>'
    : '';
  return '<li class="koino-keszulekek__keszulek"><div class="koino-keszulekek__fej"><strong>' + html(d.nev ?? '?') + '</strong> <code>'
    + html(d.rovid) + '</code> ' + jelek.join(' ') + '</div>'
    + (koinok.length ? '<ul class="koino-keszulekek__koinok">' + koinok.map((k) => '<li>' + html(k) + '</li>').join('') + '</ul>' : '')
    + hatar + kizar + '</li>';
}

/** A felvétel (a párosítás) része. */
function felvetelHtml(f, kezelo) {
  if (!kezelo) {
    return '<p class="koino-keszulekek__megjegyzes">Ez egy <strong>felvett</strong> készülék: az azonosságod kulcsa nincs rajta. Új készüléket'
      + ' felvenni és kizárni a kezelő készülékeden tudsz.</p>';
  }
  if (!f || f.allapot === 'nincs' || f.allapot === 'lejart' || f.allapot === 'megszakitva' || f.allapot === 'kesz') {
    const elozo = f?.allapot === 'kesz' && f.felvett
      ? '<p class="koino-keszulekek__siker">Felvetted: „' + html(f.felvett.nev) + '” — az ellenőrző kód: <strong class="koino-keszulekek__kod">'
        + html(f.felvett.ellenorzo) + '</strong>. Az új készüléken ugyanezt kell látnod; ha nem egyezik, zárd ki.</p>'
      : f?.allapot === 'lejart' ? '<p class="koino-keszulekek__megjegyzes">Az előző párosítás lejárt — új készülék nem jelentkezett.</p>' : '';
    return elozo + '<button type="button" class="koino-keszulekek__gomb koino-keszulekek__gomb--fo" data-felvetel>➕ Új készülék felvétele</button>';
  }
  return '<div class="koino-keszulekek__parositas"><p>Az új készüléken (a telefonon) <strong>egy sort</strong> másolj a Termuxba — a QR ugyanezt'
    + ' hordozza (a telefon kamerája szöveggé olvassa). A két gép ugyanazon a hálózaton legyen.</p>'
    + '<div class="koino-keszulekek__qr">' + (f.qr ?? '') + '</div>'
    + '<textarea class="koino-keszulekek__sor" readonly rows="4">' + html(f.telepitoSor) + '</textarea>'
    + '<div class="koino-keszulekek__gombok"><button type="button" class="koino-keszulekek__gomb" data-masol="termux">📋 A Termuxba</button>'
    + '<button type="button" class="koino-keszulekek__gomb" data-masol="windows">💻 Windowsra</button>'
    + '<button type="button" class="koino-keszulekek__gomb" data-megse>Mégse</button></div>'
    + '<p class="koino-keszulekek__megjegyzes">Várok… (a kód ' + new Date(f.lejar).toLocaleTimeString() + '-ig érvényes)</p></div>';
}

/** A papír állása. */
function papirHtml(p) {
  if (!p) return '';
  const sorok = [p.el ? 'A papírod él (a csere-kulcs — vele cserélheted a kulcsodat, ha ellopják).'
    : 'A papírodat visszavontad — a helyreállítás a segítőidé.'];
  if (p.fajlGepen) sorok.push('⚠ A csere-kulcs fájlja még a gépen van: vidd papírra (node koino.js papir), és töröld innen.');
  if (p.intelem) sorok.push(p.intelem);
  return '<h4>A papír</h4><ul class="koino-keszulekek__papir">' + sorok.map((s) => '<li>' + html(s) + '</li>').join('') + '</ul>';
}

/**
 * ⭐⭐ A „📱 KÉSZÜLÉKEIM” ABLAK.
 */
export async function keszulekeimMegnyitasa() {
  console.log('keszulekeimMegnyitasa - KEZDÉS');
  const tartalom = document.createElement('div');
  tartalom.className = 'koino-keszulekek';
  const modal = new Modal(MODAL_KONTENER, {
    cim: '📱 Készülékeim',
    meret: 'alap',
    tartalom,
    gombok: [{ felirat: 'Bezárás', tipus: 'masodlagos', akcio: () => { leallit(); modal.bezaras(); } }]
  });
  let adat = null;
  let uzenet = '';
  let kerdezo = null;
  let kizarKerdes = null;   // a kizárás megerősítése: a második kattintás
  const leallit = () => { if (kerdezo) clearInterval(kerdezo); kerdezo = null; };

  const rajzol = () => {
    if (!adat) { tartalom.innerHTML = '<p>Betöltés…</p>'; return; }
    tartalom.innerHTML = '<p class="koino-keszulekek__leiras">Az azonosságod: <code>' + html(adat.rovidNev) + '</code> — '
      + (adat.kezelo ? 'ez a <strong>kezelő</strong> készüléked (itt van az azonosságod kulcsa).' : 'ez egy felvett készülék.') + '</p>'
      + (uzenet ? '<p class="koino-keszulekek__uzenet">' + html(uzenet) + '</p>' : '')
      + '<ul class="koino-keszulekek__lista">' + adat.keszulekek.map((d) => keszulekHtml(d, adat.kezelo)).join('') + '</ul>'
      + '<h4>Új készülék</h4>' + felvetelHtml(adat.felvetel, adat.kezelo) + papirHtml(adat.papir);
  };

  const betolt = async () => {
    try { adat = await apiGet('keszulekek'); } catch (hiba) { uzenet = 'Nem sikerült betölteni: ' + hiba.message; }
    rajzol();
    if (adat?.felvetel?.allapot === 'var') figyel();
  };

  const figyel = () => {
    if (kerdezo) return;
    kerdezo = setInterval(async () => {
      try {
        const f = await apiGet('keszulek/felvetel');
        if (f.allapot !== 'var') {
          leallit();
          await betolt();
        }
      } catch { /* a következő kérdés újra próbálja */ }
    }, KERDEZES);
  };

  tartalom.addEventListener('click', async (e) => {
    const cel = e.target.closest('button');
    if (!cel) return;
    try {
      if (cel.hasAttribute('data-felvetel')) {
        uzenet = '';
        adat.felvetel = await apiPost('keszulek/felvetel', {});
        rajzol();
        figyel();
      } else if (cel.hasAttribute('data-megse')) {
        adat.felvetel = await apiPost('keszulek/felvetel/megse', {});
        leallit();
        rajzol();
      } else if (cel.dataset.masol) {
        const f = adat.felvetel ?? {};
        await navigator.clipboard?.writeText(cel.dataset.masol === 'windows' ? f.windowsSor : f.telepitoSor);
        cel.textContent = '✔ Másolva';
      } else if (cel.dataset.hatarMentes) {
        const k = cel.dataset.hatarMentes;
        const mezo = tartalom.querySelector('input[data-hatar="' + CSS.escape(k) + '"]');
        const ertek = mezo?.value?.trim() ?? '';
        await apiPost('keszulek/hatar', { keszulek: k, hatar: ertek === '' ? null : Number(ertek) });
        uzenet = ertek === '' ? 'A határ az alapérték (a keret 20%-a).' : 'A határ: ' + ertek + ' pont.';
        await betolt();
      } else if (cel.dataset.kizar) {
        const k = cel.dataset.kizar;
        if (kizarKerdes !== k) {
          kizarKerdes = k;
          cel.textContent = 'Biztosan kizárod? (kattints újra)';
          return;
        }
        kizarKerdes = null;
        const r = await apiPost('keszulek/kizar', { keszulek: k });
        uzenet = 'Kizártad: „' + (r.nev ?? k.slice(0, 8)) + '” — ' + r.koinok.length + ' koinóban a vágásig marad a láncából, a többiben semmi.'
          + (r.csatlakozasok.length ? ' ' + r.csatlakozasok.length + ' koinóhoz csatlakoztam (csak ott volt tag).' : '')
          + (r.hibak.length ? ' ⚠ ' + r.hibak.join('; ') : '');
        await betolt();
      }
    } catch (hiba) {
      uzenet = 'Nem sikerült: ' + hiba.message;
      rajzol();
    }
  });

  await modal.init();
  modal.megnyitas();
  rajzol();
  await betolt();
  console.log('keszulekeimMegnyitasa - VÉGE');
}
