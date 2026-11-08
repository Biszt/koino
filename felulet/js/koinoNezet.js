// felulet/js/koinoNezet.js

// Felelősség: ⭐⭐ A KÖZÖSSÉG FELTÖLTÖTT NÉZETEI A LAPON (D126 — a D123 PR4-e) — koinós többlet, a prototípusban nincs ilyen:
//   · A KÁRTYA: a nézet-kártyát a lap a gondolat-kártyával rajzolja (a `kartyaAdat.js` fordít), és itt kap a fejlécébe egy „🧩 nézet”
//     jelet, a törzsébe egy „🧩 Kód” fület — a kód (a HTML) olvashatóan, ki tette fel, és az állása ezen a készüléken (be / ki / a
//     kódja azóta változott), a bekapcsolás és a megnyitás gombjával. A pont a közösség jelzése (NZ1);
//   · A BEKAPCSOLÁS (NZ1–NZ3): előtte egy ablak mondja ki, ki tette fel, hány pont van rajta, mit lát a nézet és mit nem, és hogy a
//     rajza nem bizonyíték. A bekapcsolás a te készülékedé, koinónként, a kód lenyomatához kötve (ha egy egyezmény új kódot hoz, a
//     nézet kikapcsol, és a lap megmondja);
//   · A FŐ MENÜ: „🧩 Nézetek…” (a koinó nézet-kártyái pont szerint, a bekapcsoltak elöl — a megnyitás a pakli helyén, NZ5) és
//     „🧩 Új nézet…” (egy HTML-fájl, egy cím, egy leírás és a pont — D14: pont nélkül nincs).
//
// ⭐ A lap csak rajzol (7. szabály): a feltöltést, a kártyát, a pontot és a bekapcsolást a program végzi (`koino.js` — ugyanaz, mint a
// `nezet` parancsé); a nézet futtatása a `koinoNezetKeret.js`-é. A prototípus kártyája bájtra változatlan: a koinós rész a metódusai
// KÖRÉ kerül, a modul betöltésekor (mint a `koinoVerzio.js`-ben).
//
// Használja: `index.html` (egyszer betölti), `foMenu.js` (a két menüpont).

import GondolatKartya from './components/kartya/GondolatKartya.js';
import KartyaFulsav from './components/kartya/KartyaFulsav.js';
import Modal from './components/modals/Modal.js';
import { apiGet, apiPost } from './utils/apiHelper.js';
import { aktivEntitasMentese } from './utils/authHelper.js';
import { nezetFuttatasa } from './koinoNezetKeret.js';

const MODAL_KONTENER = 'modal-kontener';
const FAJL_KORLAT = 2 * 1024 * 1024;   // a program fájl-tárának határa (`FAJL_KORLAT`) — a lap előre szól

const html = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rovid = (az) => String(az ?? '').slice(0, 12) + '…';
const kb = (bajt) => (bajt / 1024).toLocaleString('hu-HU', { maximumFractionDigits: 1 }) + ' KB';

const ALLAS = {
  be: '<span class="koino-nezet__allas koino-nezet__allas--be">🧩 bekapcsolva ezen a készüléken</span>',
  ki: '<span class="koino-nezet__allas">kikapcsolva</span>',
  valtozott: '<span class="koino-nezet__allas koino-nezet__allas--valtozott">⚠ a kódja azóta változott, hogy bekapcsoltad — '
    + 'kikapcsolva (nézd meg újra)</span>'
};

// ===================================
// A KÁRTYA — a fejléc jele és a „🧩 Kód” fül (a gondolat-kártya metódusai KÖRÉ)
// ===================================

const eredetiFejlec = GondolatKartya.prototype._fejlecFeltoltese;
GondolatKartya.prototype._fejlecFeltoltese = function (cimSav, masodikSor, ...tobbi) {
  const ertek = eredetiFejlec.call(this, cimSav, masodikSor, ...tobbi);
  if (this.entitas?.koinoNezet && masodikSor) {
    const jel = document.createElement('span');
    jel.className = 'koino-nezet-jel';
    jel.textContent = '🧩 nézet';
    jel.title = 'A közösség egy feltöltött nézete — a kódja a „🧩 Kód” fülön olvasható; a saját készülékeden kapcsolod be (D126).';
    masodikSor.insertBefore(jel, masodikSor.firstChild);
  }
  return ertek;
};

const eredetiTorzs = GondolatKartya.prototype._bodyFeltoltese;
GondolatKartya.prototype._bodyFeltoltese = function (body, ...tobbi) {
  const ertek = eredetiTorzs.call(this, body, ...tobbi);
  if (!this.entitas?.koinoNezet || !body) return ertek;
  console.log('koinoNezet - a „Kód” fül', { entitasId: this.entitas?.entitasId });
  let fulek = [];
  let kontener = null;
  if (this.kartyaFulsav) {
    fulek = [...this.kartyaFulsav.fulek];
    kontener = this.kartyaFulsav.kontener;
    this.kartyaFulsav.destroy();
  }
  if (!kontener) {
    kontener = document.createElement('div');
    body.appendChild(kontener);
  }
  // A kártya szövege itt a nézet LEÍRÁSA (és a kód fájl-blokkja — letölthető, mint egy csatolmány).
  fulek = fulek.map((f) => (f.id === 'gondolat' ? { ...f, felirat: 'Leírás' } : f));
  const kod = document.createElement('div');
  kod.className = 'koino-nezet';
  kod.innerHTML = '<p class="koino-nezet__leiras">A nézet a „🧩 Kód” fülre kattintva töltődik be.</p>';
  fulek.push({ id: 'nezetkod', felirat: '🧩 Kód', tartalomElem: kod });
  kodFulFigyelese(kod, this.entitas.entitasId);
  this.kartyaFulsav = new KartyaFulsav(kontener, {
    fulek,
    onFulValtas: (id) => {
      if (id === 'nezetkod') kodFulBetoltese(kod, this.entitas.entitasId);
      this._kibovitesUjraertekeles?.();
    }
  });
  return ertek;
};

/** A „🧩 Kód” fül tartalma: ki tette fel, a pont, a kód (a HTML olvashatóan), az állás és a gombok. */
async function kodFulBetoltese(elem, kartya) {
  console.log('koinoNezet.kodFulBetoltese - KEZDÉS', { kartya });
  elem.innerHTML = '<p class="koino-nezet__leiras">A nézetet kérem a programtól…</p>';
  let n;
  try {
    n = await apiGet('nezet?kartya=' + encodeURIComponent(kartya));
  } catch (hiba) {
    elem.innerHTML = '<p class="koino-megjegyzes">A nézet most nem kérdezhető le: ' + html(hiba.message) + '</p>';
    return;
  }
  let s = '<p class="koino-nezet__allas-sor">' + (ALLAS[n.allas] ?? '') + '</p>'
    + '<p class="koino-nezet__leiras">Feltette: <code title="' + html(n.szerzo) + '">' + html(rovid(n.szerzo)) + '</code> · '
    + n.pont + ' tudatpont rajta (' + n.hozzajarulok + ' e-embertől)</p>';
  if (!n.kod) {
    elem.innerHTML = s + '<p class="koino-megjegyzes">Ennek a kártyának a szövegében nincs csatolt fájl — nincs kódja.</p>';
    return;
  }
  s += '<p class="koino-nezet__leiras">A kódja: <strong>' + html(n.kod.nev) + '</strong>' + (n.kod.bajt != null ? ' · ' + kb(n.kod.bajt) : '')
    + ' · <code title="' + html(n.kod.lenyomat) + '">' + html(rovid(n.kod.lenyomat)) + '</code></p>';
  const gombok = [];
  if (!n.megvan) {
    gombok.push('<button type="button" class="koino-nezet__gomb" data-muvelet="ker">⬇ Kérem a kódot</button>');
  } else if (n.allas === 'be') {
    gombok.push('<button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" data-muvelet="megnyit">▶ Megnyitás</button>');
    gombok.push('<button type="button" class="koino-nezet__gomb" data-muvelet="ki">Kikapcsolás</button>');
  } else {
    gombok.push('<button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" data-muvelet="be">🧩 Bekapcsolom ezen a '
      + 'készüléken…</button>');
    if (n.allas === 'valtozott') gombok.push('<button type="button" class="koino-nezet__gomb" data-muvelet="ki">Kikapcsolás</button>');
  }
  s += '<div class="koino-nezet__gombok">' + gombok.join('') + '</div>';
  if (!n.megvan) {
    s += '<p class="koino-megjegyzes">A kód még nincs meg ezen a készüléken. A kártya vállalóitól jön: ha pontot teszel a kártyára, '
      + 'vagy elkéred, a következő csere elhozza.</p>';
    elem.innerHTML = s;
    return;
  }
  s += '<details class="koino-nezet__kod"><summary>A kód (HTML) — olvasható, nem fut</summary><pre class="koino-nezet__szoveg">'
    + 'betöltés…</pre></details>';
  elem.innerHTML = s;
  try {
    const valasz = await fetch('/api/fajl/' + encodeURIComponent(n.kod.lenyomat));
    if (!valasz.ok) throw new Error('a kód most nem olvasható (' + valasz.status + ')');
    elem.querySelector('.koino-nezet__szoveg').textContent = await valasz.text();
  } catch (hiba) {
    elem.querySelector('.koino-nezet__szoveg').textContent = hiba.message;
  }
  console.log('koinoNezet.kodFulBetoltese - VÉGE', { allas: n.allas, megvan: n.megvan });
}

/** A „🧩 Kód” fül gombjai (a fül tartalma újrarajzolódik — a figyelő a fül elemén, egyszer). */
function kodFulFigyelese(elem, kartya) {
  elem.addEventListener('click', async (e) => {
    const gomb = e.target.closest('button[data-muvelet]');
    if (!gomb || gomb.disabled) return;
    e.stopPropagation();   // a kártya a koppintást is figyeli (kiválasztás)
    const m = gomb.dataset.muvelet;
    if (m === 'be') { nezetBekapcsolasMegnyitasa({ kartya, utana: () => kodFulBetoltese(elem, kartya) }); return; }
    if (m === 'megnyit') { await nezetMegnyitasa(kartya); return; }
    gomb.disabled = true;
    try {
      if (m === 'ki') await apiPost('nezet/ki', { kartya });
      if (m === 'ker') await apiPost('torzs', { entitas: kartya });
    } catch (hiba) {
      alert(hiba.message);
    }
    kodFulBetoltese(elem, kartya);
  });
}

/** Egy bekapcsolt nézet megnyitása — ha nem megy, kimondjuk (a modál-konténerben). */
async function nezetMegnyitasa(kartya) {
  try {
    Modal.osszesBezarasa?.();
    await nezetFuttatasa({ kartya });
  } catch (hiba) {
    const p = document.createElement('p');
    p.className = 'koino-megjegyzes';
    p.textContent = 'A nézet most nem nyitható meg: ' + hiba.message;
    const m = new Modal(MODAL_KONTENER, { cim: '🧩 Nézet', meret: 'alap', tartalom: p,
      gombok: [{ felirat: 'Bezárás', tipus: 'masodlagos', akcio: () => m.bezaras() }] });
    await m.init();
    m.megnyitas();
  }
}

// ===================================
// A BEKAPCSOLÁS — előtte kimondva (NZ1–NZ3)
// ===================================

/**
 * A bekapcsolás ablaka: ki tette fel, a pont, mit lát a nézet és mit nem, a hamis rajz — és „Igen, bekapcsolom”. A program a lap
 * kimondott lenyomatával kapcsol be (ha közben más kód jött, nem).
 * @param {{kartya: string, utana?: Function}} b
 */
export async function nezetBekapcsolasMegnyitasa({ kartya, utana = null }) {
  console.log('nezetBekapcsolasMegnyitasa - KEZDÉS', { kartya });
  const tartalom = document.createElement('div');
  tartalom.className = 'koino-nezet-ablak';
  const modal = new Modal(MODAL_KONTENER, {
    cim: '🧩 Nézet bekapcsolása ezen a készüléken',
    meret: 'alap',
    tartalom,
    gombok: [{ felirat: 'Bezárás', tipus: 'masodlagos', akcio: () => modal.bezaras() }]
  });
  await modal.init();
  modal.megnyitas();
  let n;
  try {
    n = await apiGet('nezet?kartya=' + encodeURIComponent(kartya));
  } catch (hiba) {
    tartalom.innerHTML = '<p class="koino-megjegyzes">A nézet most nem kérdezhető le: ' + html(hiba.message) + '</p>';
    return modal;
  }
  const rajzol = (folyamatban = false, kesz = false) => {
    if (kesz) {
      tartalom.innerHTML = '<p class="koino-nezet__siker">✅ Bekapcsolva ezen a készüléken, ebben a koinóban.</p>'
        + '<p class="koino-nezet__leiras">A fő menü „🧩 Nézetek…” pontjából is megnyithatod. Ha egy egyezmény új kódot hoz a kártyára, '
        + 'a nézet kikapcsol — az új kódot újra meg kell nézned.</p><div class="koino-nezet__gombok"><button type="button" '
        + 'class="koino-nezet__gomb koino-nezet__gomb--fo" data-muvelet="megnyit">▶ Megnyitás most</button></div>';
      return;
    }
    tartalom.innerHTML = '<p class="koino-nezet__leiras"><strong>„' + html(n.cim) + '”</strong> — a közösség egy feltöltött nézete.</p>'
      + '<p class="koino-nezet__leiras">Feltette: <code title="' + html(n.szerzo) + '">' + html(rovid(n.szerzo)) + '</code> · ' + n.pont
      + ' tudatpont rajta (' + n.hozzajarulok + ' e-embertől) · a kódja: ' + html(n.kod?.nev ?? '—')
      + (n.kod?.bajt != null ? ', ' + kb(n.kod.bajt) : '') + '</p>'
      + '<ul class="koino-nezet__kimondas"><li><strong>Mit lát:</strong> ' + html(n.kimondas?.latja) + '.</li>'
      + '<li><strong>Mit nem:</strong> ' + html(n.kimondas?.nemLatja) + '.</li></ul>'
      + '<p class="koino-nezet__figyelem">⚠ ' + html(n.kimondas?.hamisRajz) + '</p>'
      + (n.megvan ? '' : '<p class="koino-megjegyzes">A kód még nincs meg ezen a készüléken — előbb kérd el (a „🧩 Kód” fül).</p>')
      + '<div class="koino-nezet__gombok"><button type="button" class="koino-nezet__gomb" data-muvelet="megse">Mégse</button>'
      + '<button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" data-muvelet="bekapcsol"'
      + (folyamatban || !n.megvan || !n.kod ? ' disabled' : '') + '>' + (folyamatban ? 'Bekapcsolom…' : 'Igen, bekapcsolom') + '</button></div>';
  };
  tartalom.addEventListener('click', async (e) => {
    const gomb = e.target.closest('button[data-muvelet]');
    if (!gomb || gomb.disabled) return;
    const m = gomb.dataset.muvelet;
    if (m === 'megse') { modal.bezaras(); return; }
    if (m === 'megnyit') { modal.bezaras(); await nezetMegnyitasa(kartya); return; }
    if (m !== 'bekapcsol') return;
    rajzol(true);
    try {
      await apiPost('nezet/be', { kartya, lenyomat: n.kod.lenyomat });
    } catch (hiba) {
      modal.hibaBeallitasa(hiba.message ?? 'A nézet nem kapcsolható be.');
      rajzol(false);
      return;
    }
    rajzol(false, true);
    utana?.();
  });
  rajzol();
  console.log('nezetBekapcsolasMegnyitasa - VÉGE', { allas: n.allas });
  return modal;
}

// ===================================
// A FŐ MENÜ — „🧩 Nézetek…”
// ===================================

/** A koinó nézetei: pont szerint, a bekapcsoltak elöl — megnyitás, bekapcsolás, kikapcsolás, a kártya a pakliban. */
export async function nezetekMegnyitasa() {
  console.log('nezetekMegnyitasa - KEZDÉS');
  const tartalom = document.createElement('div');
  tartalom.className = 'koino-nezet-ablak';
  const modal = new Modal(MODAL_KONTENER, {
    cim: '🧩 A koinó nézetei',
    meret: 'alap',
    tartalom,
    gombok: [{ felirat: 'Bezárás', tipus: 'masodlagos', akcio: () => modal.bezaras() }]
  });
  await modal.init();
  modal.megnyitas();
  const betolt = async () => {
    tartalom.innerHTML = '<p class="koino-nezet__leiras">A nézeteket kérem a programtól…</p>';
    let v;
    try {
      v = await apiGet('nezetek');
    } catch (hiba) {
      tartalom.innerHTML = '<p class="koino-megjegyzes">A nézetek most nem kérdezhetők le: ' + html(hiba.message) + '</p>';
      return;
    }
    const lista = v.kartyak ?? [];
    tartalom.innerHTML = '<p class="koino-nezet__leiras">A közösség feltöltött nézetei ebben a koinóban — egy nézet a koinó közös képét '
      + 'rajzolja, olvas, nem ír. A saját készülékeden kapcsolod be.</p>'
      + (lista.length ? '<ul class="koino-nezet__lista">' + lista.map((n) => '<li class="koino-nezet__elem"><div><strong>🧩 '
        + html(n.cim) + '</strong> · ' + n.pont + ' pont' + (n.kod ? ' · ' + html(n.kod.nev) : ' · nincs kódja')
        + (n.kod && !n.megvan ? ' · <em>a kód még nincs meg</em>' : '') + '<br>' + (ALLAS[n.allas] ?? '') + '</div>'
        + '<div class="koino-nezet__gombok">'
        + (n.allas === 'be' ? '<button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" data-muvelet="megnyit" data-kartya="'
          + html(n.azonosito) + '">▶ Megnyitás</button>' : '')
        + (n.allas !== 'be' && n.kod ? '<button type="button" class="koino-nezet__gomb" data-muvelet="be" data-kartya="' + html(n.azonosito)
          + '">Bekapcsolás…</button>' : '')
        + (n.allas !== 'ki' ? '<button type="button" class="koino-nezet__gomb" data-muvelet="ki" data-kartya="' + html(n.azonosito)
          + '">Kikapcsolás</button>' : '')
        + '<button type="button" class="koino-nezet__gomb" data-muvelet="kartya" data-kartya="' + html(n.azonosito) + '">A kártya</button>'
        + '</div></li>').join('') + '</ul>'
        : '<p class="koino-megjegyzes">Ebben a koinóban még nincs nézet-kártya.</p>')
      + '<div class="koino-nezet__gombok"><button type="button" class="koino-nezet__gomb" data-muvelet="uj">＋ Új nézet…</button></div>';
  };
  tartalom.addEventListener('click', async (e) => {
    const gomb = e.target.closest('button[data-muvelet]');
    if (!gomb || gomb.disabled) return;
    const m = gomb.dataset.muvelet;
    const kartya = gomb.dataset.kartya;
    if (m === 'uj') { modal.bezaras(); await ujNezetMegnyitasa(); return; }
    if (m === 'megnyit') { modal.bezaras(); await nezetMegnyitasa(kartya); return; }
    if (m === 'be') { modal.bezaras(); await nezetBekapcsolasMegnyitasa({ kartya }); return; }
    if (m === 'kartya') {
      modal.bezaras();
      aktivEntitasMentese(kartya, 'Gondolat');
      await window.aktivPakli?.init?.(kartya, 'Gondolat');
      return;
    }
    if (m === 'ki') {
      gomb.disabled = true;
      try { await apiPost('nezet/ki', { kartya }); } catch (hiba) { modal.hibaBeallitasa(hiba.message); }
      await betolt();
    }
  });
  await betolt();
  console.log('nezetekMegnyitasa - VÉGE');
  return modal;
}

// ===================================
// A FŐ MENÜ — „🧩 Új nézet…” (a feltöltés)
// ===================================

/** Egy fájl bájtjai base64-ben (a kapu JSON-t fogad — mint a `/api/feltoltes/fajl`). */
function base64be(fajl) {
  return new Promise((kesz, baj) => {
    const r = new FileReader();
    r.onload = () => kesz(String(r.result).replace(/^data:[^,]*,/, ''));
    r.onerror = () => baj(new Error('A fájl nem olvasható.'));
    r.readAsDataURL(fajl);
  });
}

/** Az új nézet ablaka: egy HTML-fájl, a cím, a leírás, a pont — és a megerősítés után a kártya. */
export async function ujNezetMegnyitasa() {
  console.log('ujNezetMegnyitasa - KEZDÉS');
  const tartalom = document.createElement('div');
  tartalom.className = 'koino-nezet-ablak';
  const modal = new Modal(MODAL_KONTENER, {
    cim: '🧩 Új nézet (a közösségnek)',
    meret: 'alap',
    tartalom,
    gombok: [{ felirat: 'Bezárás', tipus: 'masodlagos', akcio: () => modal.bezaras() }]
  });
  const ertekek = { fajl: null, cim: '', leiras: '', pont: 10 };
  let megerosites = false;
  let folyamatban = false;
  let siker = null;
  const rajzol = () => {
    if (siker) {
      tartalom.innerHTML = '<p class="koino-nezet__siker">✅ A nézet feltöltve: <strong>' + html(siker.cim) + '</strong> — a kártyája a '
        + 'pakliban van (' + siker.pont + ' tudatpontod rajta), a többiek a cserével kapják.</p><p class="koino-nezet__leiras">Ezen a '
        + 'készüléken is külön kell bekapcsolnod (a kártya „🧩 Kód” füle, vagy a „🧩 Nézetek…”).</p><div class="koino-nezet__gombok">'
        + '<button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" data-muvelet="bekapcsol">🧩 Bekapcsolom…</button></div>';
      return;
    }
    const ki = folyamatban || megerosites ? ' disabled' : '';
    tartalom.innerHTML = '<p class="koino-nezet__leiras">Egy nézet egy HTML-fájl (a szkript és a stílus benne), ami a koinó közös képét '
      + 'rajzolja. A kártyája a koinóban mindenkihez eljut; a kódja a „🧩 Kód” fülön olvasható, és csak egyezménnyel változhat. Futni '
      + 'csak annál fut, aki a saját készülékén bekapcsolja — elszigetelten: olvas, nem ír, kifelé nem szólhat.</p>'
      + '<label class="koino-nezet__mezo">A HTML-fájl <input type="file" data-mezo="fajl" accept=".html,.htm,text/html"' + ki + '></label>'
      + (ertekek.fajl ? '<p class="koino-nezet__leiras">' + html(ertekek.fajl.name) + ' · ' + kb(ertekek.fajl.size) + '</p>' : '')
      + '<label class="koino-nezet__mezo">A nézet neve (a kártya címe) <input type="text" data-mezo="cim" maxlength="200" value="'
      + html(ertekek.cim) + '"' + ki + '></label>'
      + '<label class="koino-nezet__mezo">Leírás (mit mutat?) <textarea data-mezo="leiras" rows="3"' + ki + '>' + html(ertekek.leiras)
      + '</textarea></label>'
      + '<label class="koino-nezet__mezo">Tudatpont a kártyára <input type="number" data-mezo="pont" min="1" value="' + ertekek.pont
      + '"' + ki + '></label>'
      + (megerosites
        ? '<p class="koino-nezet__figyelem">Biztos? A kártya aláírt esemény — nem vonható vissza. A pontot tevők a kódot is tárolják.</p>'
          + '<div class="koino-nezet__gombok"><button type="button" class="koino-nezet__gomb" data-muvelet="megse"'
          + (folyamatban ? ' disabled' : '') + '>Mégse</button><button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" '
          + 'data-muvelet="feltoltom"' + (folyamatban ? ' disabled' : '') + '>' + (folyamatban ? 'Feltöltöm…' : 'Igen, feltöltöm')
          + '</button></div>'
        : '<div class="koino-nezet__gombok"><button type="button" class="koino-nezet__gomb koino-nezet__gomb--fo" '
          + 'data-muvelet="megerosites"' + (ertekek.fajl && ertekek.cim.trim() ? '' : ' disabled') + '>Feltöltöm…</button></div>');
  };
  const gombAllapot = () => {
    const g = tartalom.querySelector('button[data-muvelet="megerosites"]');
    if (g) g.disabled = !(ertekek.fajl && ertekek.cim.trim());
  };
  tartalom.addEventListener('input', (e) => {
    const m = e.target.dataset?.mezo;
    if (m === 'cim') ertekek.cim = e.target.value;
    else if (m === 'leiras') ertekek.leiras = e.target.value;
    else if (m === 'pont') ertekek.pont = Number.parseInt(e.target.value, 10);
    gombAllapot();
  });
  tartalom.addEventListener('change', (e) => {
    if (e.target.dataset?.mezo !== 'fajl') return;
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > FAJL_KORLAT) {
      modal.hibaBeallitasa('A fájl túl nagy (' + kb(f.size) + ') — egy nézet legfeljebb ' + kb(FAJL_KORLAT) + '.');
      return;
    }
    ertekek.fajl = f;
    if (f && !ertekek.cim.trim()) ertekek.cim = f.name.replace(/\.[^.]*$/, '');
    rajzol();
  });
  tartalom.addEventListener('click', async (e) => {
    const gomb = e.target.closest('button[data-muvelet]');
    if (!gomb || gomb.disabled) return;
    const m = gomb.dataset.muvelet;
    if (m === 'bekapcsol') { modal.bezaras(); await nezetBekapcsolasMegnyitasa({ kartya: siker.kartya }); return; }
    if (m === 'megerosites') { megerosites = true; rajzol(); return; }
    if (m === 'megse') { megerosites = false; rajzol(); return; }
    if (m !== 'feltoltom') return;
    folyamatban = true;
    rajzol();
    try {
      siker = await apiPost('nezet', { cim: ertekek.cim.trim(), leiras: ertekek.leiras.trim() || null,
        pont: Number.isInteger(ertekek.pont) && ertekek.pont > 0 ? ertekek.pont : 10, nev: ertekek.fajl.name,
        adat: await base64be(ertekek.fajl) });
    } catch (hiba) {
      modal.hibaBeallitasa(hiba.message ?? 'A nézet nem töltődött fel.');
      folyamatban = false;
      megerosites = false;
      rajzol();
      return;
    }
    folyamatban = false;
    rajzol();
    window.aktivPakli?.kulsoValtozas?.();   // az új kártya a pakliban (csendben, a kiválasztás helyén)
  });
  await modal.init();
  modal.megnyitas();
  rajzol();
  console.log('ujNezetMegnyitasa - VÉGE');
  return modal;
}
