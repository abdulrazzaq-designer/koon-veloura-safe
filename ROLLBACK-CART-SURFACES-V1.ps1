$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backupRoot = Join-Path $root "migration-audit"

if (-not (Test-Path $backupRoot)) {
    throw "migration-audit directory was not found in the project root."
}

$backup = Get-ChildItem $backupRoot -Directory -Filter "before-cart-surfaces-v1-*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $backup) {
    throw "No before-cart-surfaces-v1 backup was found."
}

$restoreFiles = @(
    "twilight.json",
    "src\views\pages\cart.twig",
    "src\assets\styles\app.scss"
)

foreach ($relative in $restoreFiles) {
    $source = Join-Path $backup.FullName $relative
    $target = Join-Path $root $relative

    if (-not (Test-Path $source)) {
        throw "Backup file was not found: $source"
    }

    $targetDirectory = Split-Path $target -Parent
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    Copy-Item $source $target -Force
}

$removeFiles = @(
    "src\assets\styles\05-utilities\veloura-cart-surfaces.scss",
    "INSTALL-CART-SURFACES-V1.ps1",
    "VERIFY-CART-SURFACES-V1.ps1",
    "README-CART-SURFACES-V1.txt"
)

foreach ($relative in $removeFiles) {
    $path = Join-Path $root $relative
    if (Test-Path $path) {
        Remove-Item $path -Force
    }
}

try {
    $null = Get-Content (Join-Path $root "twilight.json") -Raw | ConvertFrom-Json
} catch {
    throw "Restored twilight.json is invalid: $($_.Exception.Message)"
}

$appText = Get-Content (Join-Path $root "src\assets\styles\app.scss") -Raw
if ($appText -match [regex]::Escape("@import './05-utilities/veloura-cart-surfaces';")) {
    throw "Rollback failed: the cart-surfaces import is still present in app.scss."
}

Write-Host "Cart Surfaces V1 was rolled back successfully."
Write-Host "Restored from: $($backup.FullName)"
