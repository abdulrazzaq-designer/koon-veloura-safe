$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) { throw 'Run this script from the theme project root.' }

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\assets\js\app.js',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v10.scss',
  '.\src\views\layouts\master.twig',
  '.\src\views\components\header\header.twig'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "Missing: $_" -ForegroundColor Red }
  throw 'V10 installation verification failed.'
}

$js = Get-Content '.\src\assets\js\app.js' -Raw
if ($js -notmatch 'velouraStackV10Ready') { throw 'V10 JavaScript controller was not installed.' }

$scss = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($scss -notmatch 'veloura-header-tabs-v10') { throw 'V10 stylesheet import was not installed.' }

Write-Host 'V10 full-width and top-only reveal fix installed correctly.' -ForegroundColor Green
