$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) { throw 'Run this script from the theme project root.' }
if (-not (Test-Path '.\src\assets\styles\05-utilities\veloura-header-tabs-v11.scss')) { throw 'V11 stylesheet is missing.' }

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json: OK')"
node --check '.\src\assets\js\app.js'

$appScss = Get-Content '.\src\assets\styles\app.scss' -Raw
$appJs = Get-Content '.\src\assets\js\app.js' -Raw

if ($appScss -notmatch 'veloura-header-tabs-v11') { throw 'V11 stylesheet import is missing from app.scss.' }
if ($appJs -notmatch 'velouraStackV11Ready') { throw 'V11 sticky controller is missing from app.js.' }
if ($appScss -match 'veloura-header-tabs-v8|veloura-header-tabs-v9|veloura-header-tabs-v10') { throw 'Legacy header/tabs stylesheet imports are still active.' }

Write-Host 'V11 files installed correctly.' -ForegroundColor Green
