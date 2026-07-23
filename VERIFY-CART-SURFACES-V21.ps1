$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$twilightPath = Join-Path $root 'twilight.json'
$cartPath = Join-Path $root 'src\views\pages\cart.twig'
$appScssPath = Join-Path $root 'src\assets\styles\app.scss'
$scssPath = Join-Path $root 'src\assets\styles\05-utilities\veloura-cart-surfaces-v21.scss'
$importLine = "@import './05-utilities/veloura-cart-surfaces-v21';"
$cartMarker = 'Veloura Cart Surfaces V2.1 settings'

foreach ($path in @($twilightPath, $cartPath, $appScssPath, $scssPath)) {
    if (-not (Test-Path $path)) {
        throw "Missing file: $path"
    }
}

try {
    $parsed = ([System.IO.File]::ReadAllText($twilightPath)) | ConvertFrom-Json
}
catch {
    throw "twilight.json is invalid: $($_.Exception.Message)"
}

if ($null -eq $parsed.settings) {
    throw 'twilight.json has no top-level settings array.'
}

$ids = @(
    'veloura_cart_surfaces_settings_title_2026',
    'veloura_cart_surfaces_enabled_2026',
    'veloura_cart_surfaces_bg_color_2026',
    'veloura_cart_surfaces_radius_2026',
    'veloura_cart_surfaces_border_enabled_2026',
    'veloura_cart_surfaces_border_color_2026',
    'veloura_cart_surfaces_shadow_enabled_2026'
)

foreach ($id in $ids) {
    $count = @($parsed.settings | Where-Object {
        $_.PSObject.Properties['id'] -and $_.id -eq $id
    }).Count

    if ($count -ne 1) {
        throw "Invalid top-level setting definition count for ${id}: $count"
    }
}

$bgSetting = @($parsed.settings | Where-Object { $_.id -eq 'veloura_cart_surfaces_bg_color_2026' })[0]
if ($bgSetting.type -ne 'string' -or $bgSetting.format -ne 'color') {
    throw 'Background color setting must use type=string and format=color.'
}

$cart = [System.IO.File]::ReadAllText($cartPath)
foreach ($marker in @(
    $cartMarker,
    'veloura-cart-surfaces-enabled',
    '--veloura-cart-surface-bg',
    '--veloura-cart-surface-radius'
)) {
    if (-not $cart.Contains($marker)) {
        throw "Missing cart.twig marker: $marker"
    }
}

$appScss = [System.IO.File]::ReadAllText($appScssPath)
if (-not $appScss.Contains($importLine)) {
    throw 'Missing app.scss import.'
}

$scss = [System.IO.File]::ReadAllText($scssPath)
if (-not $scss.Contains('.veloura-cart-surfaces-enabled')) {
    throw 'Missing scoped SCSS selector.'
}

Write-Host 'twilight.json: OK' -ForegroundColor Green
Write-Host 'Cart Surfaces V2.1 safe installation verified.' -ForegroundColor Green
