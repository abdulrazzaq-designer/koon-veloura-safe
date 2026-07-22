$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v17.scss'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "Missing: $_" -ForegroundColor Red }
  throw 'V17 installation verification failed.'
}

$import = Select-String -Path '.\src\assets\styles\app.scss' -Pattern 'veloura-header-tabs-v17' -Quiet
if (-not $import) {
  throw 'V17 SCSS import was not found in app.scss.'
}

Write-Host 'V17 mobile active tile and bottom indicator fix installed correctly.' -ForegroundColor Green
