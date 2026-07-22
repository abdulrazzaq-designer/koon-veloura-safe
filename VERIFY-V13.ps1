$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
if ($LASTEXITCODE -ne 0) { throw 'twilight.json validation failed.' }

$required = @(
  '.\src\views\layouts\master.twig',
  '.\src\views\components\header\header.twig',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v13.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) { throw "Missing file: $file" }
}

$master = Get-Content '.\src\views\layouts\master.twig' -Raw
$styles = Get-Content '.\src\assets\styles\app.scss' -Raw
$twilight = Get-Content '.\twilight.json' -Raw

if ($master -notmatch 'veloura-header-solid-bg') { throw 'V13 header color variable is missing.' }
if ($master -notmatch 'veloura-tabs-solid-bg') { throw 'V13 tabs color variable is missing.' }
if ($master -notmatch 'veloura-unified-glass-color') { throw 'V13 glass color variable is missing.' }
if ($styles -notmatch 'veloura-header-tabs-v13') { throw 'V13 stylesheet is not imported.' }
if ($twilight -notmatch 'veloura_top_glass_unified_color_2026') { throw 'V13 glass color setting is missing.' }

Write-Host 'V13 independent colors / unified glass installed correctly.' -ForegroundColor Green
