$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check '.\src\assets\js\app.js'

$required = @(
  '.\src\views\layouts\master.twig',
  '.\src\views\components\header\header.twig',
  '.\src\assets\js\app.js',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\04-components\home-tabs.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v7.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file"
  }
}

$master = Get-Content '.\src\views\layouts\master.twig' -Raw
$appJs = Get-Content '.\src\assets\js\app.js' -Raw
$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw

if ($master -notmatch 'data-veloura-header-tabs-stack') {
  throw 'V7 stack markup was not installed in master.twig.'
}

if ($appJs -notmatch 'velouraStackV7Ready') {
  throw 'V7 sticky controller was not installed in app.js.'
}

if ($appScss -notmatch 'veloura-header-tabs-v7') {
  throw 'V7 SCSS import was not installed in app.scss.'
}

Write-Host 'V7 connected header/tabs stack installed correctly.' -ForegroundColor Green
