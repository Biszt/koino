#!/bin/sh
# termux/csere.sh

# Felelősség: ⭐⭐ D125 (D123 PR5) — A PROGRAM CSERÉJE A TELEFONON (Termux): a kártyáról telepítés (TK1) és a visszaút (TK5) — a
# `windows/csere.ps1` párja. A FUTÓ program (`koino.js` `programCsereje`) egy ideiglenes másolatból, leválasztva hívja — nem a kártya
# telepítője (egy régebbi kártyáé nem tudna cserélni, és ez a visszafordítás sem volna benne — D125).
#
# A MENET:
#   1. vár egy kicsit (a hívó felület még válaszol a lapnak), és leállítja a program mappájából futó koinót (az indító és a node);
#   2. CSERÉL: telepítésnél a régi a `-regi`-be (az előző generáció ilyenkor törlődik), az új (`-uj`) a helyére; visszaútnál a
#      mostani és a `-regi` helyet cserél. ⭐ A `.git` MINDIG a helyén lévő programmal van (TK1): a `~/koino` a telepítő sor sekély
#      klónja — ha a git-tár a programmal megy, a sor később is a GitHubról frissít (`git reset` a legújabbra);
#   3. ELINDÍTJA a helyén lévőt a háttérben (`nohup … termux/indit.sh` — a régi Termux-ablakban a régi koino leállt; a lap
#      magától újratöltődik), és ⭐ VÁR, hogy feleljen (a felület portja, legfeljebb 30 mp — TK5); ha nem felel, a régit teszi vissza
#      (a nem induló a `-hibas`-ba), és azt indítja;
#   4. kimondja: a naplóba (`<adat>/telepites.log`) és az eredményt (`<adat>/telepites.json`).
#
# Hívás: sh csere.sh <helye> <uj> <regi> <adat> <port> telepites|vissza  (a kód és a kártya: KOINO_CSERE_KOD, KOINO_CSERE_KARTYA)
# Csak POSIX sh (a Termux `sh`-ja dash). ⚠️ `pkill` nélkül (a `procps` hiányában) a futó koinót nem tudja leállítani — kimondja.

HELYE="$1"
UJ="$2"
REGI="$3"
ADAT="$4"
PORT="${5:-7499}"
MOD="${6:-telepites}"
# a kód és a kártya neve a környezetből (a windowsos párjához igazodva)
KOD="${KOINO_CSERE_KOD:-}"
KARTYA="${KOINO_CSERE_KARTYA:-}"
VARAKOZAS="${KOINO_CSERE_VARAKOZAS:-30}"
NAPLO="$ADAT/telepites.log"
mkdir -p "$ADAT"

naplo() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$NAPLO"
  echo "$1"
}

# Az eredmény a lapnak és a parancsnak (JSON — a mondat idézőjelei és visszaperjelei védve).
eredmeny() {
  m=$(printf '%s' "$2" | sed 's/\\/\\\\/g; s/"/\\"/g')
  v=false
  [ "$MOD" = vissza ] && v=true
  printf '{"allapot":"%s","mondat":"%s","mikor":%s000,"kod":"%s","kartya":"%s","vissza":%s,"helye":"%s"}' \
    "$1" "$m" "$(date +%s)" "$KOD" "$KARTYA" "$v" "$HELYE" > "$ADAT/telepites.json"
  naplo "$2"
}

# A program mappájából futó koino leállítása: az indító és a node (a `telepit.sh` ugyanígy).
leallitas() {
  if ! command -v pkill >/dev/null 2>&1; then
    naplo "· pkill nélkül a futó koinót nem tudom leállítani (pkg install procps)"
    return 0
  fi
  pkill -TERM -f "$HELYE/termux/indit.sh" 2>/dev/null
  pkill -TERM -f "$HELYE/koino.js" 2>/dev/null
  i=0
  while [ "$i" -lt 20 ] && pgrep -f "$HELYE/koino.js" >/dev/null 2>&1; do
    sleep 0.5
    i=$((i + 1))
  done
  pkill -KILL -f "$HELYE/koino.js" 2>/dev/null
  return 0
}

# A `.git` a helyén lévő programmal megy (ha az egyiknél van, és a másiknál nincs).
git_atvitele() {
  if [ -d "$1/.git" ] && [ ! -e "$2/.git" ]; then mv "$1/.git" "$2/.git"; fi
}

# Két mappa helyet cserél — egy átmeneti néven át (a `.git` a helyén maradó programmal).
helycsere() {
  git_atvitele "$1" "$2"
  rm -rf "$1-csere"
  mv "$1" "$1-csere" || return 1
  if ! mv "$2" "$1"; then mv "$1-csere" "$1"; return 1; fi
  mv "$1-csere" "$2" || return 1
  return 0
}

inditas() {
  nohup sh "$HELYE/termux/indit.sh" > "$ADAT/indit.log" 2>&1 &
}

# Felel-e a felület (a portja nyitva) — a Node kérdezi (a Termuxban mindig van; a curl nem biztos).
felel() {
  i=0
  while [ "$i" -lt $(( $1 * 2 )) ]; do
    if node -e "require('net').connect($PORT,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" \
      >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
    i=$((i + 1))
  done
  return 1
}

# ===== 1. a leállítás =====
# (a hívó felület előbb válaszol a lapnak — a windowsos párján mérve: 1,5 mp kevés volt)
sleep 4
if [ "$MOD" = vissza ]; then naplo "A csere kezdete (vissza az előző programra)"; else naplo "A csere kezdete (telepítés: $UJ)"; fi
leallitas
naplo "· a futó koinó leállítva"

# ===== 2. a csere =====
if [ "$MOD" = vissza ]; then
  if [ ! -d "$REGI" ]; then eredmeny bukott "⚠ A csere nem sikerült: nincs előző program ($REGI) — a mostani indul újra"; inditas; exit 1; fi
  if ! helycsere "$HELYE" "$REGI"; then eredmeny bukott "⚠ A csere nem sikerült — a mostani program indul újra"; inditas; exit 1; fi
else
  if [ ! -f "$UJ/koino.js" ]; then eredmeny bukott "⚠ A csere nem sikerült: az új program nincs meg ($UJ) — a régi indul újra"; inditas; exit 1; fi
  rm -rf "$REGI"
  git_atvitele "$HELYE" "$UJ"
  if ! mv "$HELYE" "$REGI"; then
    git_atvitele "$UJ" "$HELYE"
    eredmeny bukott "⚠ A csere nem sikerült (a régi mappa nem mozdult) — a régi program indul újra"; inditas; exit 1
  fi
  if ! mv "$UJ" "$HELYE"; then
    mv "$REGI" "$HELYE"
    git_atvitele "$UJ" "$HELYE"
    eredmeny bukott "⚠ A csere nem sikerült (az új nem került a helyére) — a régi program indul újra"; inditas; exit 1
  fi
fi
naplo "· a mappák kicserélve"

# ===== 3. az indítás és a vizsga (TK5) =====
inditas
if felel "$VARAKOZAS"; then
  if [ "$MOD" = vissza ]; then eredmeny kesz "✓ Visszaálltál az előző programra — a mostani a következő cseréig: $REGI"
  else eredmeny kesz "✓ A kártyáról telepített program fut — az előző a következő cseréig: $REGI"; fi
  exit 0
fi

naplo "⚠ Az új program $VARAKOZAS mp alatt nem felelt — visszateszem a régit"
leallitas
if [ "$MOD" = vissza ]; then
  NEM_INDULO="$REGI"
  helycsere "$HELYE" "$REGI" || { eredmeny bukott "⚠ Az új program nem indult, és a régit sem tudtam visszatenni"; exit 1; }
else
  NEM_INDULO="$HELYE-hibas"
  rm -rf "$NEM_INDULO"
  git_atvitele "$HELYE" "$REGI"
  { mv "$HELYE" "$NEM_INDULO" && mv "$REGI" "$HELYE"; } || { eredmeny bukott "⚠ Az új program nem indult, és a régit sem tudtam visszatenni"; exit 1; }
fi
inditas
if felel "$VARAKOZAS"; then
  eredmeny visszafordult "⚠ Az új program $VARAKOZAS mp alatt nem felelt — a régi fut újra (a nem induló: $NEM_INDULO; a felület naplója: $ADAT/felulet.log)"
  exit 2
fi
eredmeny bukott "⚠ Az új program nem felelt, és a visszatett régi sem — a felület naplója: $ADAT/felulet.log"
exit 1
