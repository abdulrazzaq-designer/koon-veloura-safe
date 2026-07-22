$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this verifier from the project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
if ($LASTEXITCODE -ne 0) { throw 'twilight.json validation failed.' }

node --check '.\src\assets\js\app.js'
if ($LASTEXITCODE -ne 0) { throw 'app.js syntax validation failed.' }

$required = @(
  '.\src\assets\styles\04-components\home-tabs.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v16.scss',
  '.\src\assets\styles\app.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) { throw "Missing required file: $file" }
}

$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($appScss -notmatch 'veloura-header-tabs-v16') {
  throw 'app.scss does not import the V16 utility file.'
}

$tabs = Get-Content '.\src\assets\styles\04-components\home-tabs.scss' -Raw
if ($tabs -notmatch "button:not\(:last-child\)::after") {
  throw 'The V16 tab separator rule is missing.'
}

$utility = Get-Content '.\src\assets\styles\05-utilities\veloura-header-tabs-v16.scss' -Raw
if ($utility -notmatch 'bottom: -7px') {
  throw 'The V16 mobile bottom indicator rule is missing.'
}

Write-Host 'V16 separator and mobile indicator fixes installed correctly.' -ForegroundColor Green
