$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'Run this script from the project root.'
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

$checks = @(
  @{ Path = '.\src\assets\js\app.js'; Text = 'velouraStickyV6Ready' },
  @{ Path = '.\src\assets\styles\app.scss'; Text = 'veloura-header-tabs-v6' },
  @{ Path = '.\src\assets\styles\05-utilities\veloura-header-tabs-v6.scss'; Text = '--veloura-shell-top-v6' },
  @{ Path = '.\src\views\layouts\master.twig'; Text = 'veloura_header_sticky_v6_2026' },
  @{ Path = '.\src\views\components\header\header.twig'; Text = 'data-veloura-header-v6' }
)

foreach ($check in $checks) {
  if (-not (Test-Path $check.Path)) {
    throw "Missing file: $($check.Path)"
  }
  if (-not (Select-String -Path $check.Path -Pattern $check.Text -SimpleMatch -Quiet)) {
    throw "V6 marker missing in: $($check.Path)"
  }
}

Write-Host 'V6 files installed correctly.' -ForegroundColor Green
