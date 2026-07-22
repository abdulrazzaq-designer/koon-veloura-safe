$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-mobile-menu-v22.scss'
)

foreach ($path in $required) {
  if (-not (Test-Path $path)) {
    throw "Missing required file: $path"
  }
}

$app = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($app -notmatch 'veloura-mobile-menu-v22') {
  throw 'app.scss does not import veloura-mobile-menu-v22.'
}

Write-Host 'V22 active tile, indicator and page-color fades installed correctly.' -ForegroundColor Green
