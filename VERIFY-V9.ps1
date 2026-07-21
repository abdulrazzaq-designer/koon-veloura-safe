$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$required = @(
  '.\src\views\layouts\master.twig',
  '.\src\views\components\header\header.twig',
  '.\src\assets\js\app.js',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v9.scss'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "Missing: $_" -ForegroundColor Red }
  throw 'V9 verification failed.'
}

Write-Host 'V9 single-surface sticky fix installed correctly.' -ForegroundColor Green
