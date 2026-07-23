$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check '.\src\assets\js\app.js'
node --check '.\src\assets\js\mobile-floating-menu.js'

$required = @(
  '.\src\assets\styles\05-utilities\veloura-glass.scss',
  '.\src\assets\styles\05-utilities\veloura-global-overlays.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v18.scss',
  '.\src\assets\js\mobile-floating-menu.js',
  '.\src\views\layouts\master.twig'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "Missing: $_" -ForegroundColor Red }
  throw 'Required files are missing.'
}

$app = Get-Content '.\src\assets\js\app.js' -Raw
$menuJs = Get-Content '.\src\assets\js\mobile-floating-menu.js' -Raw
$overlay = Get-Content '.\src\assets\styles\05-utilities\veloura-global-overlays.scss' -Raw
$header = Get-Content '.\src\assets\styles\05-utilities\veloura-header-tabs-v18.scss' -Raw
$master = Get-Content '.\src\views\layouts\master.twig' -Raw

if ($app -notmatch "import './mobile-floating-menu';") { throw 'Mobile menu controller import is missing.' }
if ($menuJs -notmatch 'restoreRouteActive') { throw 'Route restore controller is missing.' }
if ($overlay -notmatch 'rgba\(248, 250, 252, \.72\)') { throw 'Neutral silver glass value is missing.' }
if ($overlay -match 'backdrop-filter: blur\(6px\)') { throw 'Page-wide overlay blur is still present.' }
if ($header -notmatch '--veloura-v15-glass-fallback: rgba\(248, 250, 252, \.72\)') { throw 'Header glass was not updated.' }
if ($master -notmatch 'data-login-url=') { throw 'Floating menu login URL is missing.' }
if ($master -match 'veloura-mobile-floating-menu-external-sync-fix') { throw 'Old duplicate floating-menu controller still exists.' }

Write-Host 'Global Glass V2 and floating-menu state fixes are installed correctly.' -ForegroundColor Green
