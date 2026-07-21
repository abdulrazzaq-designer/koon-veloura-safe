$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check '.\src\assets\js\app.js'

$required = @(
  '.\src\assets\styles\04-components\home-tabs.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v8.scss',
  '.\src\assets\styles\app.scss',
  '.\src\views\layouts\master.twig',
  '.\src\assets\js\app.js'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file"
  }
}

$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($appScss -notmatch 'veloura-header-tabs-v8') {
  throw 'V8 stylesheet import is missing from app.scss.'
}

$master = Get-Content '.\src\views\layouts\master.twig' -Raw
if ($master -notmatch 'veloura-header-tabs-stack__container container') {
  throw 'V8 connected stack container marker is missing.'
}

$v8Css = Get-Content '.\src\assets\styles\05-utilities\veloura-header-tabs-v8.scss' -Raw
if ($v8Css -notmatch 'veloura-stack-backdrop-fade-v8' -or $v8Css -notmatch 'veloura-home-tabs__button') {
  throw 'V8 compact glass styles are incomplete.'
}

Write-Host 'V8 compact connected glass stack is installed correctly.' -ForegroundColor Green
