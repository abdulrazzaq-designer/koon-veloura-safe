$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this file from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\assets\js\app.js',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\04-components\home-tabs.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v18.scss'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "Missing: $_" -ForegroundColor Red }
  throw 'V18 installation verification failed.'
}

$importText = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($importText -notmatch 'veloura-header-tabs-v18') {
  throw 'V18 SCSS import is missing from app.scss.'
}

node --check '.\src\assets\js\app.js'
Write-Host 'V18 mobile indicator and preview performance fix installed correctly.' -ForegroundColor Green
