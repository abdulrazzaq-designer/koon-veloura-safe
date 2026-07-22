$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) { throw 'Run this script from the project root.' }

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check '.\src\assets\js\app.js'

$required = @(
  '.\src\assets\styles\04-components\home-tabs.scss',
  '.\src\assets\styles\05-utilities\veloura-header-tabs-v12.scss',
  '.\src\assets\styles\app.scss',
  '.\src\assets\js\app.js',
  '.\src\views\layouts\master.twig'
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) { throw "Missing file: $file" }
}

$import = Select-String -Path '.\src\assets\styles\app.scss' -Pattern 'veloura-header-tabs-v12' -Quiet
if (-not $import) { throw 'V12 SCSS import is missing.' }

Write-Host 'V12 files installed correctly.' -ForegroundColor Green
