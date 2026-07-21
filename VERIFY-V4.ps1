$ErrorActionPreference = 'Stop'

$projectRoot = (Get-Location).Path
$requiredRootFile = Join-Path $projectRoot 'twilight.json'

if (-not (Test-Path $requiredRootFile)) {
    throw 'Run this script from the theme project root.'
}

$checks = @(
    @{ Path = 'twilight.json'; Text = 'veloura_top_floating_v4_2026' },
    @{ Path = 'src\assets\js\app.js'; Text = 'velouraStickyV4Ready' },
    @{ Path = 'src\assets\styles\app.scss'; Text = 'veloura-header-tabs-v4' },
    @{ Path = 'src\views\components\header\header.twig'; Text = 'data-veloura-header-v4' }
)

foreach ($check in $checks) {
    $fullPath = Join-Path $projectRoot $check.Path

    if (-not (Test-Path $fullPath)) {
        throw "Missing file: $($check.Path)"
    }

    if (-not (Select-String -Path $fullPath -Pattern $check.Text -SimpleMatch -Quiet)) {
        throw "V4 marker is missing from: $($check.Path)"
    }
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"

if ($LASTEXITCODE -ne 0) {
    throw 'twilight.json validation failed.'
}

Write-Host 'V4 files are installed correctly.'
