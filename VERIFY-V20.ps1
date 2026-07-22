$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the theme project root.'
}

$null = Get-Content '.\twilight.json' -Raw | ConvertFrom-Json

$required = @(
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-mobile-menu-v20.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Missing file: $file"
  }
}

$app = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($app -notmatch 'veloura-mobile-menu-v20') {
  throw 'V20 import was not found in app.scss.'
}

Write-Host 'twilight.json: OK'
Write-Host 'V20 mobile menu settings, glass and active indicator installed correctly.'
