$ErrorActionPreference = 'Stop'

$required = @(
  '.\src\assets\js\app.js',
  '.\src\assets\styles\05-utilities\veloura-glass.scss',
  '.\src\assets\styles\05-utilities\veloura-global-overlays.scss',
  '.\src\assets\styles\app.scss'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Missing required file: $file"
  }
}

$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw
if ($appScss -notmatch "veloura-global-overlays") {
  throw 'app.scss does not import veloura-global-overlays.scss. Install Global Glass V1 first.'
}

$appJs = Get-Content '.\src\assets\js\app.js' -Raw
if ($appJs -notmatch 'Veloura Neutral Frosted Glass V3 Runtime') {
  throw 'The V3 Shadow DOM runtime was not installed in app.js.'
}
if ($appJs -match "\[role='dialog'\]\s*\{") {
  throw 'Unsafe full-dialog glass selector is still present in the V3 runtime.'
}

$overlayScss = Get-Content '.\src\assets\styles\05-utilities\veloura-global-overlays.scss' -Raw
if ($overlayScss -notmatch 'Global Overlay Glass V3') {
  throw 'The V3 overlay stylesheet was not installed.'
}
if ($overlayScss -notmatch 'saturate\(36%\)') {
  throw 'The neutral low-saturation filter is missing.'
}
if ($overlayScss -notmatch 'Full-screen hosts/wrappers must never become glass') {
  throw 'The full-screen login blur reset is missing.'
}

$glassScss = Get-Content '.\src\assets\styles\05-utilities\veloura-glass.scss' -Raw
if ($glassScss -notmatch 'Neutral Frosted Glass V3') {
  throw 'The V3 shared glass stylesheet was not installed.'
}

foreach ($scss in @(
  '.\src\assets\styles\05-utilities\veloura-glass.scss',
  '.\src\assets\styles\05-utilities\veloura-global-overlays.scss'
)) {
  $text = Get-Content $scss -Raw
  $open = ([regex]::Matches($text, '\{')).Count
  $close = ([regex]::Matches($text, '\}')).Count
  if ($open -ne $close) {
    throw "Unbalanced braces in $scss ($open opening / $close closing)."
  }
}

node --check '.\src\assets\js\app.js'
if ($LASTEXITCODE -ne 0) {
  throw 'app.js failed the Node syntax check.'
}

Write-Host 'Global Glass V3 neutral material and login-only blur installed correctly.' -ForegroundColor Green
