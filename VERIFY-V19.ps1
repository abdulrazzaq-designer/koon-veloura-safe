$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this file from the project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-mobile-menu-v19.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file"
  }
}

$app = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($app -notmatch 'veloura-mobile-menu-v19') {
  throw 'V19 stylesheet is not imported by app.scss.'
}

Write-Host 'V19 mobile active tile and fade fix installed correctly.' -ForegroundColor Green
