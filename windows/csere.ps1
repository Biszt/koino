# windows/csere.ps1

# Felelősség: ⭐⭐ D125 (D123 PR5) — A PROGRAM CSERÉJE WINDOWSON: a kártyáról telepítés (TK1) és a visszaút (TK5). A FUTÓ program
# (`koino.js` `programCsereje`) egy ideiglenes másolatból, leválasztva hívja — nem a kártya telepítője: egy régebbi kártya
# (a PR7 előtti) telepítője nem tudna cserélni, és ez a visszafordítás sem volna benne (D125 — az építés pontosítása).
#
# A MENET:
#   1. vár egy kicsit (a hívó felület még válaszol a lapnak), és leállítja a program mappájából futó koinót (a node és az
#      indító — mint a `telepit.ps1`: amíg egy folyamat munkakönyvtára a mappában áll, a mappa nem nevezhető át);
#   2. CSERÉL: telepítésnél a régi a `-regi`-be (az előző generáció ilyenkor törlődik — mint a PR7-nél), az új (`-uj`) a helyére;
#      visszaútnál (`-Vissza`) a mostani és a `-regi` helyet cserél (így előre is vissza lehet lépni);
#   3. ELINDÍTJA a helyén lévőt (az indítójával, egy új ablakban — mint az asztali ikon), és ⭐ VÁR, hogy feleljen (a felület
#      portja, legfeljebb `-Varakozas` mp — TK5); ha nem felel, a régit teszi vissza (a nem induló a `-hibas`-ba), és azt indítja;
#   4. kimondja: a naplóba (`<adat>\telepites.log`) és az eredményt (`<adat>\telepites.json` — a lap és a `telepit` parancs ebből
#      mondja el, mi történt).
# ⚠️ Az adat (`<adat>` — alapból `%USERPROFILE%\koino-adat`) a program mappáján kívül van: a csere nem érinti.
# ⚠️ UTF-8 BOM-mal mentve: a Windows PowerShell 5.1 a BOM nélküli szkriptet ANSI-ként olvasná — a próba őrzi.

param(
  [Parameter(Mandatory = $true)][string]$Helye,
  [Parameter(Mandatory = $true)][string]$Uj,
  [Parameter(Mandatory = $true)][string]$Regi,
  [Parameter(Mandatory = $true)][string]$Adat,
  [string]$Port = '7499',
  [switch]$Vissza,
  [int]$Varakozas = 30,
  [switch]$Rejtett
)

if ([Console]::IsOutputRedirected) { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false }
$UTF8 = New-Object System.Text.UTF8Encoding $false
# ⚠️ a kód és a kártya neve a környezetből (base64url — egy kötőjellel kezdődőt a PowerShell paraméternévnek venne)
$Kod = [string]$env:KOINO_CSERE_KOD
$Kartya = [string]$env:KOINO_CSERE_KARTYA
if (-not (Test-Path -LiteralPath $Adat)) { New-Item -ItemType Directory -Path $Adat -Force | Out-Null }
$NAPLO = Join-Path $Adat 'telepites.log'

function Naplo([string]$s) {
  [IO.File]::AppendAllText($NAPLO, ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $s + "`n"), $UTF8)
  Write-Host $s
}

# Az eredmény a lapnak és a parancsnak (BOM nélkül — a program JSON-ként olvassa).
function Eredmeny([string]$allapot, [string]$mondat) {
  $o = [ordered]@{ allapot = $allapot; mondat = $mondat; mikor = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();
    kod = $Kod; kartya = $Kartya; vissza = [bool]$Vissza; helye = $Helye }
  [IO.File]::WriteAllText((Join-Path $Adat 'telepites.json'), ($o | ConvertTo-Json -Compress), $UTF8)
  Naplo $mondat
}

# Egy program-mappából futó koino leállítása: a node (`…\koino.js`) és az indító (`…\windows\indit.ps1`) — ezt a folyamatot kivéve
# (a `telepit.ps1` ugyanígy).
function FutoKoinoLeallitasa([string]$programGyoker) {
  $elotag = $programGyoker.TrimEnd('\') + '\'
  $mintak = @(($elotag + 'koino.js'), ($elotag + 'windows\indit.ps1'))
  $futok = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $sor = $_.CommandLine
    $_.ProcessId -ne $PID -and $sor -and @($mintak | Where-Object { $sor.IndexOf($_, [StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count
  })
  foreach ($p in $futok) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }
  foreach ($p in $futok) { Wait-Process -Id $p.ProcessId -Timeout 10 -ErrorAction SilentlyContinue }
  return $futok.Count
}

# Két mappa helyet cserél (mindkettő megvan) — egy átmeneti néven át; ha a második lépés nem megy, az első visszaáll.
function Helycsere([string]$a, [string]$b) {
  $atmeneti = $a + '-csere'
  if (Test-Path -LiteralPath $atmeneti) { Remove-Item -LiteralPath $atmeneti -Recurse -Force -ErrorAction Stop }
  Rename-Item -LiteralPath $a (Split-Path -Leaf $atmeneti) -ErrorAction Stop
  try { Rename-Item -LiteralPath $b (Split-Path -Leaf $a) -ErrorAction Stop }
  catch { Rename-Item -LiteralPath $atmeneti (Split-Path -Leaf $a) -ErrorAction SilentlyContinue; throw }
  Rename-Item -LiteralPath $atmeneti (Split-Path -Leaf $b) -ErrorAction Stop
}

# A helyén lévő program indítása az indítójával — egy új ablakban (mint az asztali ikon; a próbáknak rejtve).
function Inditas {
  $indito = Join-Path $Helye 'windows\indit.ps1'
  if ($Rejtett) {
    Start-Process powershell -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $indito + '"') -WindowStyle Hidden `
      -WorkingDirectory $HOME | Out-Null
  } else {
    Start-Process powershell -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -NoExit -File "' + $indito + '"') `
      -WorkingDirectory $HOME | Out-Null
  }
}

# Felel-e a felület (a portja nyitva) `$mp` másodpercen belül.
function Felel([int]$mp) {
  $hatar = (Get-Date).AddSeconds($mp)
  while ((Get-Date) -lt $hatar) {
    try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', [int]$Port); $c.Close(); return $true } catch { }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

# ===== 1. a leállítás =====
# ⛔ MÉRVE (2026-11-07, a lapról): 1,5 mp kevés volt — a hívó felület a válasza előtt leállt (a rövid indító PowerShell lassabban
# lépett ki, mint ahogy ez a leállításig ért). A lap így is tudja, mi történt (a régi kulcsával figyel), de a válasz jobb.
Start-Sleep -Seconds 4
Naplo ('A csere kezdete (' + $(if ($Vissza) { 'vissza az előző programra' } else { 'telepítés: ' + $Uj }) + ')')
$leallitva = FutoKoinoLeallitasa $Helye
Naplo ('· a futó koinó leállítva (' + $leallitva + ' folyamat)')

# ===== 2. a csere =====
try {
  if ($Vissza) {
    if (-not (Test-Path -LiteralPath $Regi)) { throw ('nincs előző program (' + $Regi + ')') }
    Helycsere $Helye $Regi
  } else {
    if (-not (Test-Path -LiteralPath (Join-Path $Uj 'koino.js'))) { throw ('az új program nincs meg (' + $Uj + ')') }
    if (Test-Path -LiteralPath $Regi) { Remove-Item -LiteralPath $Regi -Recurse -Force -ErrorAction Stop }
    Rename-Item -LiteralPath $Helye (Split-Path -Leaf $Regi) -ErrorAction Stop
    try { Rename-Item -LiteralPath $Uj (Split-Path -Leaf $Helye) -ErrorAction Stop }
    catch { Rename-Item -LiteralPath $Regi (Split-Path -Leaf $Helye) -ErrorAction SilentlyContinue; throw }
  }
} catch {
  Eredmeny 'bukott' ('⚠ A csere nem sikerült: ' + $_.Exception.Message + ' — a régi program indul újra')
  Inditas
  exit 1
}
Naplo '· a mappák kicserélve'

# ===== 3. az indítás és a vizsga (TK5) =====
Inditas
if (Felel $Varakozas) {
  if ($Vissza) { Eredmeny 'kesz' ('✓ Visszaálltál az előző programra — a mostani a következő cseréig: ' + $Regi) }
  else { Eredmeny 'kesz' ('✓ A kártyáról telepített program fut — az előző a következő cseréig: ' + $Regi) }
  exit 0
}

# ⛔ nem felelt: vissza a régit
Naplo ('⚠ Az új program ' + $Varakozas + ' mp alatt nem felelt — visszateszem a régit')
FutoKoinoLeallitasa $Helye | Out-Null
try {
  if ($Vissza) {
    Helycsere $Helye $Regi
  } else {
    $hibas = $Helye + '-hibas'
    if (Test-Path -LiteralPath $hibas) { Remove-Item -LiteralPath $hibas -Recurse -Force -ErrorAction Stop }
    Rename-Item -LiteralPath $Helye (Split-Path -Leaf $hibas) -ErrorAction Stop
    Rename-Item -LiteralPath $Regi (Split-Path -Leaf $Helye) -ErrorAction Stop
  }
} catch {
  Eredmeny 'bukott' ('⚠ Az új program nem indult, és a régit sem tudtam visszatenni: ' + $_.Exception.Message)
  exit 1
}
Inditas
$naploHelye = Join-Path $Adat 'felulet.log'
if (Felel $Varakozas) {
  $nemIndulo = $Helye + '-hibas'
  if ($Vissza) { $nemIndulo = $Regi }
  Eredmeny 'visszafordult' ('⚠ Az új program ' + $Varakozas + ' mp alatt nem felelt — a régi fut újra (a nem induló: ' + $nemIndulo +
    '; a felület naplója: ' + $naploHelye + ')')
  exit 2
}
Eredmeny 'bukott' ('⚠ Az új program nem felelt, és a visszatett régi sem — a felület naplója: ' + $naploHelye)
exit 1
