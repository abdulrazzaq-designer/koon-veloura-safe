$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\twilight.json')) {
  throw 'شغّل الملف من داخل مجلد المشروع الرئيسي.'
}

$checks = @(
  @{ Path = '.\twilight.json'; Text = 'veloura_top_floating_v4_2026' },
  @{ Path = '.\src\assets\js\app.js'; Text = 'velouraStickyV4Ready' },
  @{ Path = '.\src\assets\styles\app.scss'; Text = 'veloura-header-tabs-v4' },
  @{ Path = '.\src\views\components\header\header.twig'; Text = 'data-veloura-header-v4' }
)

foreach ($check in $checks) {
  if (-not (Test-Path $check.Path)) { throw "الملف مفقود: $($check.Path)" }
  if (-not (Select-String -Path $check.Path -Pattern $check.Text -SimpleMatch -Quiet)) {
    throw "تحديث V4 غير موجود داخل: $($check.Path)"
  }
}

node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json صحيح ✅')"
Write-Host 'ملفات V4 مركبة فعلياً ✅'
