$ErrorActionPreference = "Stop"

$app = Join-Path $PSScriptRoot "src\assets\styles\app.scss"
$import = "@import './05-utilities/veloura-cart-surfaces';"

if (-not (Test-Path $app)) {
    throw "src\assets\styles\app.scss was not found. Run this script from the project root."
}

$content = Get-Content $app -Raw
if ($content -notmatch [regex]::Escape($import)) {
    Add-Content -Path $app -Value "`r`n$import`r`n"
}

& (Join-Path $PSScriptRoot "VERIFY-CART-SURFACES-V1.ps1")
