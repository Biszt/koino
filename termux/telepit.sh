#!/bin/sh
# termux/telepit.sh

# Felelősség: AZ ELSŐ INDÍTÁS a telefonon (Termux) — a bemásolt egy sor a letöltés után ezt hívja: ellenőrzi, hogy a Node tud-e
# Ed25519-et (a koino minden műveletet aláír — ha ez nincs meg, semmi más nem számít), a Termux PATH-jára teszi a `koino`
# parancsot (a további indításhoz és a program parancsaihoz), és elindítja (`indit.sh`).
#
# A bemásolandó sor (docs/telepites_telefon.md, „A legegyszerűbb út”; ⭐ D122: a meghívó a végén — a lap „Meghívóim” ablaka adja):
#   yes | pkg upgrade && pkg install -y nodejs git procps && { if [ -d ~/koino ]; then git -C ~/koino fetch --depth 1
#   origin main && git -C ~/koino reset --hard FETCH_HEAD || echo …; else git clone --depth 1
#   https://github.com/Biszt/koino.git ~/koino; fi; } && sh ~/koino/termux/telepit.sh
#
# ⭐ 2026-11-06: a P2P koino saját tárban él (`Biszt/koino`, a program a tár gyökere), a telefonon a `~/koino` mappában. A régi
# helyről (`~/koino_1.1/koino`) futó koinót is leállítja (a költözés), és a `koino` parancs ezután az új helyre mutat; a régi
# mappát nem bántja (ha már nem kell: rm -rf ~/koino_1.1).
#
# ⭐⭐ D123 (PR7): a sor a már telepített programot FRISSÍTI is (a git a program mappáját a legújabbra állítja — az adat a
# `~/koino-adat`-ban, a mappán kívül: nem érinti), és ez a szkript már az új kód: ha egy másik Termux-ablakban még a régi koino fut,
# leállítja (lent, „A FUTÓ KOINO LEÁLLÍTÁSA”). `KOINO_INDITAS=nem`: a telepítő nem indítja el a programot (a próbáknak).
# ⚠️ A program magától nem frissül (csak ha a sort bemásolod): hogy melyik kódot futtatja egy koinó, az a közösség dolga (a
# koino-verzió kártya, D119 — és ha a gépeden más a számítás magja, mint amivel a koinó született, a lap kimondja: D123).

KONYVTAR=$(cd "$(dirname "$0")/.." && pwd)

if [ -z "$PREFIX" ] || [ ! -d "$PREFIX/bin" ]; then
  echo "Ez a telepítő a Termuxnak készült (a \$PREFIX nincs beállítva). Számítógépen: node koino.js felulet"
  exit 1
fi

# ===== A VIZSGA: tud-e a Node Ed25519-et? =====
if ! node -e "crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']).then(()=>process.exit(0),()=>process.exit(1))"; then
  echo "⚠ A telefon Node-ja nem tud Ed25519-aláírást — a koino így nem futhat. Frissítsd: pkg upgrade nodejs"
  exit 1
fi
echo "✓ A Node tud Ed25519-et ($(node -v))"

# ===== ⭐ D123 (PR7): A FUTÓ KOINO LEÁLLÍTÁSA =====
#
# Ha egy másik Termux-ablakban még fut a koino (ebből a mappából), az a régi kódot futtatja, és a felület portját is fogja — ezért
# leállítjuk: az indítót és a két folyamatot TERM-mel (az indító csapdája a sajátjait is leállítja, és az ébren tartást elengedi),
# ami 10 mp után is fut, azt erővel. A `pkill` a `procps` csomagé (a telepítő sor hozza); ha nincs, a felület induláskor kimondja,
# hogy egy koino már fut. ⭐ A költözés: a régi tár helyéről (`~/koino_1.1/koino`) futót is.
futo_koino_leallitasa() {
  if pgrep -f "$1/koino.js" >/dev/null 2>&1 || pgrep -f "$1/termux/indit.sh" >/dev/null 2>&1; then
    pkill -TERM -f "$1/termux/indit.sh" 2>/dev/null
    pkill -TERM -f "$1/koino.js" 2>/dev/null
    i=0
    while pgrep -f "$1/koino.js" >/dev/null 2>&1 && [ "$i" -lt 20 ]; do
      sleep 0.5
      i=$((i + 1))
    done
    pkill -KILL -f "$1/koino.js" 2>/dev/null
    echo "· A futó koinót leállítottam ($1) — az új programmal indul újra."
  fi
}
if command -v pkill >/dev/null 2>&1; then
  futo_koino_leallitasa "$KONYVTAR"
  [ "$KONYVTAR" != "$HOME/koino_1.1/koino" ] && futo_koino_leallitasa "$HOME/koino_1.1/koino"
fi

# ===== A `koino` PARANCS =====
cat > "$PREFIX/bin/koino" <<EOF
#!$PREFIX/bin/sh
exec sh "$KONYVTAR/termux/indit.sh" "\$@"
EOF
chmod 700 "$PREFIX/bin/koino"
echo "✓ Telepítve. A következő indításhoz elég ennyi: koino  (a futó program lapja: koino lap)"

# ===== ⭐ A KATTINTHATÓ CÍMEK (Csaba, 2026-11-09: „tudjuk őket kattínthatóvá tenni, hogy ne keljen kimásólni?”) =====
#
# A Termux a kiírt címet koppintásra megnyitja, ha a beállításaiban `terminal-onclick-url-open = true` (Termux 0.118 óta) — e nélkül
# csak hosszú nyomás → „More…” → „Select URL”. Ha a beállítás még nincs a fájlban, felvesszük; ha valaki kimondta (akár `false`-ra),
# nem nyúlunk hozzá.
TULAJDONSAGOK="$HOME/.termux/termux.properties"
if ! grep -q "^[[:space:]]*terminal-onclick-url-open" "$TULAJDONSAGOK" 2>/dev/null; then
  if mkdir -p "$HOME/.termux" \
      && printf '\n# koino (2026-11-09): a kiírt címek koppintásra megnyílnak\nterminal-onclick-url-open = true\n' >> "$TULAJDONSAGOK"; then
    echo "✓ A Termuxban a kiírt címek mostantól koppintásra megnyílnak."
    command -v termux-reload-settings >/dev/null 2>&1 && termux-reload-settings
  fi
fi
echo
if [ "$KOINO_INDITAS" = "nem" ]; then
  echo "(KOINO_INDITAS=nem — nem indítom el)"
  exit 0
fi

# ⭐ D122: a meghívó (ha a telepítő sor végén ott van) az indítóhoz megy — az fogadja el
exec sh "$KONYVTAR/termux/indit.sh" "$@"
