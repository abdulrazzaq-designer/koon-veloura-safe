$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

$scss = '.\src\assets\styles\05-utilities\veloura-mobile-menu-v20.scss'
$app  = '.\src\assets\styles\app.scss'

if (-not (Test-Path $scss)) { throw "Missing file: $scss" }
if (-not (Test-Path $app))  { throw "Missing file: $app" }

$content = Get-Content $scss -Raw
$appContent = Get-Content $app -Raw

$required = @(
  '--veloura-v15-glass-fallback',
  '--veloura-v15-glass-dark-fallback',
  '--veloura-v15-filter',
  '--veloura-v15-border'
)

foreach ($token in $required) {
  if ($content -notmatch [regex]::Escape($token)) {
    throw "Missing glass token: $token"
  }
}

if ($appContent -notmatch 'veloura-mobile-menu-v20') {
  throw 'app.scss does not import veloura-mobile-menu-v20.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
Write-Host 'V21 mobile glass now matches the header material.' -ForegroundColor Green
