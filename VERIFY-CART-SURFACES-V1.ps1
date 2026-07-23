$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$twilight = Join-Path $root "twilight.json"
$cart = Join-Path $root "src\views\pages\cart.twig"
$scss = Join-Path $root "src\assets\styles\05-utilities\veloura-cart-surfaces.scss"
$app = Join-Path $root "src\assets\styles\app.scss"

foreach ($file in @($twilight, $cart, $scss, $app)) {
    if (-not (Test-Path $file)) { throw "Missing file: $file" }
}

try {
    $null = Get-Content $twilight -Raw | ConvertFrom-Json
    Write-Host "twilight.json: OK"
} catch {
    throw "twilight.json is invalid: $($_.Exception.Message)"
}

$twilightText = Get-Content $twilight -Raw
$cartText = Get-Content $cart -Raw
$scssText = Get-Content $scss -Raw
$appText = Get-Content $app -Raw

$checks = @(
    @{ Name = "cart settings switch"; Text = $twilightText; Pattern = 'veloura_cart_surfaces_enabled_2026' },
    @{ Name = "cart background color"; Text = $twilightText; Pattern = 'veloura_cart_surfaces_bg_color_2026' },
    @{ Name = "cart radius setting"; Text = $twilightText; Pattern = 'veloura_cart_surfaces_radius_2026' },
    @{ Name = "cart page class"; Text = $cartText; Pattern = 'veloura-cart-surfaces-enabled' },
    @{ Name = "cart item surface"; Text = $cartText; Pattern = 'veloura-cart-item-surface' },
    @{ Name = "summary surface"; Text = $cartText; Pattern = 'veloura-cart-summary-surface' },
    @{ Name = "surface stylesheet"; Text = $scssText; Pattern = 'Veloura Cart Surfaces V1' },
    @{ Name = "stylesheet import"; Text = $appText; Pattern = "@import './05-utilities/veloura-cart-surfaces';" }
)

foreach ($check in $checks) {
    if ($check.Text -notmatch [regex]::Escape($check.Pattern)) {
        throw "Verification failed: $($check.Name)"
    }
}

Write-Host "Cart Surfaces V1 installed correctly."
