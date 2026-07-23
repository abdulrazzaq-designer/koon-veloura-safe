$ErrorActionPreference = 'Stop'

$required = @(
  '.\twilight.json',
  '.\src\views\layouts\master.twig',
  '.\src\views\components\home\veloura-popup.twig',
  '.\src\views\pages\product\single.twig',
  '.\src\assets\js\app.js',
  '.\src\assets\js\partials\product-card.js',
  '.\src\assets\styles\app.scss',
  '.\src\assets\styles\05-utilities\veloura-global-overlays.scss'
)

$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "Missing: $_" -ForegroundColor Red }
  throw 'Global glass installation is incomplete.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check .\src\assets\js\app.js
node --check .\src\assets\js\partials\product-card.js

$checks = @(
  @{ Path = '.\src\assets\styles\app.scss'; Pattern = 'veloura-global-overlays' },
  @{ Path = '.\src\assets\js\app.js'; Pattern = 'initVelouraGlobalGlass' },
  @{ Path = '.\src\views\layouts\master.twig'; Pattern = 'veloura-glass-host' },
  @{ Path = '.\src\views\components\home\veloura-popup.twig'; Pattern = 'veloura-glass-popup-surface' },
  @{ Path = '.\src\views\pages\product\single.twig'; Pattern = 'veloura-glass-sticky-product' }
)

foreach ($check in $checks) {
  if (-not (Select-String -Path $check.Path -Pattern $check.Pattern -Quiet)) {
    throw "Marker not found: $($check.Pattern) in $($check.Path)"
  }
}

Write-Host 'Global glass files installed correctly.' -ForegroundColor Green
