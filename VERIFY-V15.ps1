$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) { throw 'Run this file from the theme project root.' }

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\views\layouts\master.twig',
  '.\src\assets\js\app.js',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\04-components\home-tabs.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v15.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) { throw "Missing file: $file" }
}

$twilight = Get-Content '.\twilight.json' -Raw -Encoding UTF8
$master = Get-Content '.\src\views\layouts\master.twig' -Raw -Encoding UTF8
$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw -Encoding UTF8

if ($twilight -match 'veloura_home_tabs_active_text_2026') { throw 'Removed tabs color settings are still present.' }
if ($twilight -match 'veloura_home_tabs_inactive_bg_2026') { throw 'Removed tabs color settings are still present.' }
if ($twilight -match 'veloura_home_tabs_inactive_text_2026') { throw 'Removed tabs color settings are still present.' }
if ($twilight -match 'veloura_top_glass_unified_color_2026') { throw 'Removed glass color setting is still present.' }
if ($twilight -notmatch 'z-index:2!important') { throw 'Admin switch z-index fix is missing.' }
if ($master -notmatch 'vht_tab_icon_raw.selected') { throw 'Robust tab icon parsing is missing.' }
if ($appScss -notmatch 'veloura-header-tabs-v15') { throw 'V15 SCSS import is missing.' }

Write-Host 'V15 tabs/icons/mobile/admin fixes installed correctly.' -ForegroundColor Green
