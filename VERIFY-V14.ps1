$ErrorActionPreference = 'Stop'

$required = @(
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v14.scss',
  '.\src\assets\js\app.js',
  '.\twilight.json'
)

foreach ($path in $required) {
  if (-not (Test-Path $path)) {
    throw "Missing required file: $path"
  }
}

$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($appScss -notmatch 'veloura-header-tabs-v14') {
  throw 'V14 SCSS import is missing from app.scss'
}

$css = Get-Content '.\src\assets\styles\05-utilities\veloura-header-tabs-v14.scss' -Raw
foreach ($marker in @(
  'SOLID MODE: two completely independent colors',
  'GLASS MODE: one shared surface',
  "data-veloura-hide-header='false'",
  'veloura-header-tabs-stack:not(.veloura-header-tabs-stack--floating)'
)) {
  if ($css -notmatch [regex]::Escape($marker)) {
    throw "Missing V14 marker: $marker"
  }
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check '.\src\assets\js\app.js'
Write-Host 'V14 structural restore installed correctly.' -ForegroundColor Green
