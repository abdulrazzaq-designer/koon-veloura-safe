$ErrorActionPreference = 'Stop'

$root = Get-Location
$app = Join-Path $root 'src\assets\styles\app.scss'
$patch = Join-Path $root 'src\assets\styles\05-utilities\veloura-mobile-menu-v23.scss'

if (-not (Test-Path $app)) { throw 'app.scss was not found.' }
if (-not (Test-Path $patch)) { throw 'V23 SCSS patch was not found.' }

$appText = Get-Content $app -Raw
$patchText = Get-Content $patch -Raw

if ($appText -notmatch 'veloura-mobile-menu-v23') { throw 'V23 import is missing from app.scss.' }
if ($patchText -notmatch 'width:\s*14px') { throw 'V23 indicator width rule is missing.' }
if ($patchText -notmatch 'height:\s*3px') { throw 'V23 indicator height rule is missing.' }
if ($patchText -notmatch 'left:\s*50%') { throw 'V23 centering rule is missing.' }
if ($patchText -notmatch 'veloura-header-tabs-stack::before') { throw 'V23 header fade removal is missing.' }
if ($patchText -notmatch 'veloura-mobile-floating-menu::before') { throw 'V23 mobile fade removal is missing.' }

Write-Host 'V23 compact centered indicator and fade removal installed correctly.' -ForegroundColor Green
