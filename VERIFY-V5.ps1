$ErrorActionPreference = "Stop"

$required = @(
  ".\\twilight.json",
  ".\\src\\assets\\js\\app.js",
  ".\\src\\assets\\styles\\app.scss",
  ".\\src\\assets\\styles\\05-utilities\\veloura-header-tabs-v5.scss",
  ".\\src\\views\\layouts\\master.twig",
  ".\\src\\views\\components\\header\\header.twig"
)

foreach ($path in $required) {
  if (-not (Test-Path $path)) { throw "Missing file: $path" }
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check ".\\src\\assets\\js\\app.js"

$checks = @(
  @{ Path = ".\\src\\assets\\js\\app.js"; Text = "velouraStickyV5Ready" },
  @{ Path = ".\\src\\assets\\styles\\app.scss"; Text = "veloura-header-tabs-v5" },
  @{ Path = ".\\twilight.json"; Text = "veloura_header_sticky_v5_2026" },
  @{ Path = ".\\twilight.json"; Text = "veloura_top_hide_on_scroll_v5_2026" }
)

foreach ($check in $checks) {
  if (-not (Select-String -Path $check.Path -SimpleMatch $check.Text -Quiet)) {
    throw "V5 marker missing: $($check.Text) in $($check.Path)"
  }
}

Write-Host "V5 files installed correctly." -ForegroundColor Green
