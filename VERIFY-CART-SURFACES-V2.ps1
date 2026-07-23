$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$twilightPath = Join-Path $root 'twilight.json'
$cartPath = Join-Path $root 'src\views\pages\cart.twig'
$appScssPath = Join-Path $root 'src\assets\styles\app.scss'
$scssPath = Join-Path $root 'src\assets\styles\05-utilities\veloura-cart-surfaces-v2.scss'

foreach ($path in @($twilightPath, $cartPath, $appScssPath, $scssPath)) {
    if (-not (Test-Path $path)) {
        throw "Missing file: $path"
    }
}

$twilight = [System.IO.File]::ReadAllText($twilightPath)
$twilight | ConvertFrom-Json | Out-Null

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
    $count = ([regex]::Matches($twilight, '"id"\s*:\s*"' + [regex]::Escape($id) + '"')).Count
    if ($count -ne 1) {
        throw "Invalid setting ID count for $id: $count"
    }
}

if ($twilight -notmatch '"id"\s*:\s*"veloura_cart_surfaces_bg_color_2026"[\s\S]*?"type"\s*:\s*"string"[\s\S]*?"format"\s*:\s*"color"') {
    throw 'Background color setting does not use the required string/color schema.'
}

$cart = [System.IO.File]::ReadAllText($cartPath)
foreach ($marker in @(
    'veloura_cart_surfaces_enabled_2026',
    'veloura-cart-surfaces-enabled',
    '--veloura-cart-surface-bg',
    '--veloura-cart-surface-radius'
)) {
    if ($cart -notmatch [regex]::Escape($marker)) {
        throw "Missing cart.twig marker: $marker"
    }
}

$appScss = [System.IO.File]::ReadAllText($appScssPath)
if ($appScss -notmatch [regex]::Escape("@import './05-utilities/veloura-cart-surfaces-v2';")) {
    throw 'Missing app.scss import.'
}

$scss = [System.IO.File]::ReadAllText($scssPath)
if ($scss -notmatch '\.veloura-cart-surfaces-enabled') {
    throw 'Missing scoped SCSS selector.'
}

Write-Host 'twilight.json: OK' -ForegroundColor Green
Write-Host 'Cart Surfaces V2 safe installation verified.' -ForegroundColor Green
