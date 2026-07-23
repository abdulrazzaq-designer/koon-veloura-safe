$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$twilightPath = Join-Path $root 'twilight.json'
$cartPath = Join-Path $root 'src\views\pages\cart.twig'
$appScssPath = Join-Path $root 'src\assets\styles\app.scss'
$payloadScssPath = Join-Path $root 'payload\src\assets\styles\05-utilities\veloura-cart-surfaces-v21.scss'
$targetScssPath = Join-Path $root 'src\assets\styles\05-utilities\veloura-cart-surfaces-v21.scss'
$importLine = "@import './05-utilities/veloura-cart-surfaces-v21';"
$cartMarker = 'Veloura Cart Surfaces V2.1 settings'

foreach ($path in @($twilightPath, $cartPath, $appScssPath, $payloadScssPath)) {
    if (-not (Test-Path $path)) {
        throw "Required file was not found: $path"
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$twilight = [System.IO.File]::ReadAllText($twilightPath)
$cart = [System.IO.File]::ReadAllText($cartPath)
$appScss = [System.IO.File]::ReadAllText($appScssPath)

function Parse-Twilight([string]$Text, [string]$Stage) {
    try {
        $parsed = $Text | ConvertFrom-Json
    }
    catch {
        throw "twilight.json is invalid $Stage. Nothing was changed. $($_.Exception.Message)"
    }

    if ($null -eq $parsed.settings) {
        throw "twilight.json has no top-level settings array $Stage. Nothing was changed."
    }

    return $parsed
}

function Get-SettingDefinitionCount($Parsed, [string]$Id) {
    return @($Parsed.settings | Where-Object {
        $_.PSObject.Properties['id'] -and $_.id -eq $Id
    }).Count
}

$parsedBefore = Parse-Twilight $twilight 'before installation'
$jsonNl = if ($twilight.Contains("`r`n")) { "`r`n" } else { "`n" }
$cartNl = if ($cart.Contains("`r`n")) { "`r`n" } else { "`n" }
$appNl = if ($appScss.Contains("`r`n")) { "`r`n" } else { "`n" }

$requiredSettingIds = @(
    'veloura_cart_surfaces_settings_title_2026',
    'veloura_cart_surfaces_enabled_2026',
    'veloura_cart_surfaces_bg_color_2026',
    'veloura_cart_surfaces_radius_2026',
    'veloura_cart_surfaces_border_enabled_2026',
    'veloura_cart_surfaces_border_color_2026',
    'veloura_cart_surfaces_shadow_enabled_2026'
)

$beforeCounts = @{}
foreach ($id in $requiredSettingIds) {
    $beforeCounts[$id] = Get-SettingDefinitionCount $parsedBefore $id
}

$allMissing = @($requiredSettingIds | Where-Object { $beforeCounts[$_] -ne 0 }).Count -eq 0
$allPresentOnce = @($requiredSettingIds | Where-Object { $beforeCounts[$_] -ne 1 }).Count -eq 0

if (-not $allMissing -and -not $allPresentOnce) {
    $details = ($requiredSettingIds | ForEach-Object { "${_}=$($beforeCounts[$_])" }) -join ', '
    throw "A partial or duplicate Cart Surfaces settings block already exists. Nothing was changed. $details"
}

if ($allMissing) {
$settingsSnippet = @'
    {
      "type": "static",
      "format": "description",
      "id": "veloura_cart_surfaces_settings_title_2026",
      "value": "<div class=\"veloura-switch-title\" style=\"width:100%;padding:10px;border-radius:9999px;background:linear-gradient(270deg,#004d65,#006b7a,#00a6a6);color:#fff;display:flex;align-items:center;justify-content:flex-start;gap:12px;text-align:right;box-shadow:0 10px 25px rgba(49,46,129,.20)\"><div style=\"width:45px;height:45px;border-radius:999px;background:#fff;color:#005369;display:flex;align-items:center;justify-content:center;font-size:25px;flex-shrink:0\"><i class=\"sicon-shopping-bag\"></i></div><div style=\"flex:1\"><strong style=\"display:block;font-size:22px;font-weight:800;line-height:1.4;text-align:right\">مظهر عناصر صفحة السلة</strong></div></div>",
      "label": " ",
      "icon": "sicon-shopping-bag"
    },
    {
      "type": "boolean",
      "format": "switch",
      "id": "veloura_cart_surfaces_enabled_2026",
      "label": " ",
      "description": "فعّل الخيار لتخصيص خلفية وحواف بطاقات المنتجات وملخص الطلب داخل صفحة السلة فقط",
      "wide": true,
      "required": false,
      "value": false,
      "selected": false
    },
    {
      "id": "veloura_cart_surfaces_bg_color_2026",
      "type": "string",
      "format": "color",
      "label": "لون خلفية عناصر السلة",
      "description": "يطبق على بطاقة المنتج وصناديق ملخص الطلب والشحن والهدايا",
      "icon": "sicon-palette",
      "value": "#f3f4f6",
      "required": false,
      "conditions": [
        {
          "id": "veloura_cart_surfaces_enabled_2026",
          "operation": "=",
          "value": true
        }
      ]
    },
    {
      "id": "veloura_cart_surfaces_radius_2026",
      "type": "items",
      "format": "dropdown-list",
      "label": "حواف عناصر السلة",
      "icon": "sicon-border-radius",
      "source": "Manual",
      "required": true,
      "selected": [
        {
          "label": "ناعمة",
          "value": "medium",
          "key": "veloura-cart-surfaces-radius-medium-2026"
        }
      ],
      "options": [
        {
          "label": "حادة",
          "value": "sharp",
          "key": "veloura-cart-surfaces-radius-sharp-2026"
        },
        {
          "label": "خفيفة",
          "value": "soft",
          "key": "veloura-cart-surfaces-radius-soft-2026"
        },
        {
          "label": "ناعمة",
          "value": "medium",
          "key": "veloura-cart-surfaces-radius-medium-2026"
        },
        {
          "label": "ناعمة جدًا",
          "value": "large",
          "key": "veloura-cart-surfaces-radius-large-2026"
        },
        {
          "label": "دائرية",
          "value": "round",
          "key": "veloura-cart-surfaces-radius-round-2026"
        }
      ],
      "conditions": [
        {
          "id": "veloura_cart_surfaces_enabled_2026",
          "operation": "=",
          "value": true
        }
      ]
    },
    {
      "type": "boolean",
      "format": "switch",
      "id": "veloura_cart_surfaces_border_enabled_2026",
      "label": "إظهار إطار خفيف حول العناصر",
      "description": "يضيف إطارًا رفيعًا يساعد العناصر على الظهور فوق الخلفيات المتقاربة",
      "icon": "sicon-border-all",
      "required": false,
      "value": false,
      "selected": false,
      "conditions": [
        {
          "id": "veloura_cart_surfaces_enabled_2026",
          "operation": "=",
          "value": true
        }
      ]
    },
    {
      "id": "veloura_cart_surfaces_border_color_2026",
      "type": "string",
      "format": "color",
      "label": "لون إطار عناصر السلة",
      "icon": "sicon-palette",
      "value": "#e5e7eb",
      "required": false,
      "conditions": [
        {
          "id": "veloura_cart_surfaces_enabled_2026",
          "operation": "=",
          "value": true
        },
        {
          "id": "veloura_cart_surfaces_border_enabled_2026",
          "operation": "=",
          "value": true
        }
      ]
    },
    {
      "type": "boolean",
      "format": "switch",
      "id": "veloura_cart_surfaces_shadow_enabled_2026",
      "label": "إظهار ظل خفيف",
      "description": "ظل محايد وخفيف حول بطاقات السلة",
      "icon": "sicon-magic",
      "required": false,
      "value": false,
      "selected": false,
      "conditions": [
        {
          "id": "veloura_cart_surfaces_enabled_2026",
          "operation": "=",
          "value": true
        }
      ]
    },
'@
    $settingsSnippet = [regex]::Replace($settingsSnippet, "\r?\n", $jsonNl)

    $markerId = '"id": "veloura_product_card_settings_title_2026"'
    $markerIdIndex = $twilight.IndexOf($markerId)
    if ($markerIdIndex -lt 0) {
        throw 'Could not find the product-card settings marker in twilight.json. Nothing was changed.'
    }

    $markerStart = $twilight.LastIndexOf('    {', $markerIdIndex)
    if ($markerStart -lt 0) {
        throw 'Could not locate the start of the product-card settings object. Nothing was changed.'
    }

    $twilight = $twilight.Insert($markerStart, $settingsSnippet)
}

$parsedAfter = Parse-Twilight $twilight 'after generating the settings block'
foreach ($id in $requiredSettingIds) {
    $count = Get-SettingDefinitionCount $parsedAfter $id
    if ($count -ne 1) {
        throw "Setting definition ${id} must appear exactly once; found $count. Nothing was changed."
    }
}

$bgSetting = @($parsedAfter.settings | Where-Object { $_.id -eq 'veloura_cart_surfaces_bg_color_2026' })[0]
if ($bgSetting.type -ne 'string' -or $bgSetting.format -ne 'color') {
    throw 'The background color setting does not use the required type=string and format=color schema. Nothing was changed.'
}

$hasCartMarker = $cart.Contains($cartMarker)
$hasCartClass = $cart.Contains('veloura-cart-surfaces-enabled')
if ($hasCartMarker -xor $hasCartClass) {
    throw 'A partial Cart Surfaces cart.twig modification already exists. Nothing was changed.'
}

if (-not $hasCartMarker) {
$cartSettingsBlock = @'
    {# Veloura Cart Surfaces V2.1 settings #}
    {% set vcart_enabled_raw = theme.settings.get('veloura_cart_surfaces_enabled_2026', false) %}
    {% if vcart_enabled_raw.value is defined %}
        {% set vcart_enabled_raw = vcart_enabled_raw.value %}
    {% elseif vcart_enabled_raw.selected is defined %}
        {% set vcart_enabled_raw = vcart_enabled_raw.selected %}
    {% endif %}
    {% set vcart_surfaces_enabled = vcart_enabled_raw == true or vcart_enabled_raw == 'true' or vcart_enabled_raw == 1 or vcart_enabled_raw == '1' or vcart_enabled_raw == 'on' %}

    {% set vcart_surface_bg = theme.settings.get('veloura_cart_surfaces_bg_color_2026', '#f3f4f6') %}
    {% if vcart_surface_bg.value is defined %}
        {% set vcart_surface_bg = vcart_surface_bg.value %}
    {% endif %}

    {% set vcart_surface_radius_raw = theme.settings.get('veloura_cart_surfaces_radius_2026', 'medium') %}
    {% if vcart_surface_radius_raw is iterable and vcart_surface_radius_raw[0].value is defined %}
        {% set vcart_surface_radius_key = vcart_surface_radius_raw[0].value %}
    {% elseif vcart_surface_radius_raw.value is defined %}
        {% set vcart_surface_radius_key = vcart_surface_radius_raw.value %}
    {% else %}
        {% set vcart_surface_radius_key = vcart_surface_radius_raw %}
    {% endif %}

    {% set vcart_border_raw = theme.settings.get('veloura_cart_surfaces_border_enabled_2026', false) %}
    {% if vcart_border_raw.value is defined %}
        {% set vcart_border_raw = vcart_border_raw.value %}
    {% elseif vcart_border_raw.selected is defined %}
        {% set vcart_border_raw = vcart_border_raw.selected %}
    {% endif %}
    {% set vcart_surface_border_enabled = vcart_border_raw == true or vcart_border_raw == 'true' or vcart_border_raw == 1 or vcart_border_raw == '1' or vcart_border_raw == 'on' %}

    {% set vcart_surface_border_color = theme.settings.get('veloura_cart_surfaces_border_color_2026', '#e5e7eb') %}
    {% if vcart_surface_border_color.value is defined %}
        {% set vcart_surface_border_color = vcart_surface_border_color.value %}
    {% endif %}

    {% set vcart_shadow_raw = theme.settings.get('veloura_cart_surfaces_shadow_enabled_2026', false) %}
    {% if vcart_shadow_raw.value is defined %}
        {% set vcart_shadow_raw = vcart_shadow_raw.value %}
    {% elseif vcart_shadow_raw.selected is defined %}
        {% set vcart_shadow_raw = vcart_shadow_raw.selected %}
    {% endif %}
    {% set vcart_surface_shadow_enabled = vcart_shadow_raw == true or vcart_shadow_raw == 'true' or vcart_shadow_raw == 1 or vcart_shadow_raw == '1' or vcart_shadow_raw == 'on' %}

    {% set vcart_surface_radius_map = {
        'sharp': '0px',
        'soft': '10px',
        'medium': '16px',
        'large': '24px',
        'round': '32px'
    } %}
    {% set vcart_surface_radius = vcart_surface_radius_map[vcart_surface_radius_key]|default('16px') %}
'@
    $cartSettingsBlock = [regex]::Replace($cartSettingsBlock, "\r?\n", $cartNl) + $cartNl

    $blockMarker = [regex]::Match($cart, '(?m)^\{% block content %\}\r?\n')
    if (-not $blockMarker.Success) {
        throw 'Could not find the content block in cart.twig. Nothing was changed.'
    }
    $cart = $cart.Insert($blockMarker.Index + $blockMarker.Length, $cartSettingsBlock)

    $oldContainer = '<div class="container">'
    $containerIndex = $cart.IndexOf($oldContainer)
    if ($containerIndex -lt 0) {
        throw 'Could not find the main cart container in cart.twig. Nothing was changed.'
    }

$newContainer = @'
<div class="container{% if vcart_surfaces_enabled %} veloura-cart-surfaces-enabled{% endif %}{% if vcart_surface_border_enabled %} veloura-cart-border-enabled{% endif %}{% if vcart_surface_shadow_enabled %} veloura-cart-shadow-enabled{% endif %}"
         style="--veloura-cart-surface-bg: {{ vcart_surface_bg }}; --veloura-cart-surface-radius: {{ vcart_surface_radius }}; --veloura-cart-surface-border-color: {{ vcart_surface_border_color }};">
'@
    $newContainer = ([regex]::Replace($newContainer, "\r?\n", $cartNl)).TrimEnd([char[]]"`r`n")
    $cart = $cart.Remove($containerIndex, $oldContainer.Length).Insert($containerIndex, $newContainer)
}

if (-not $cart.Contains($cartMarker) -or -not $cart.Contains('veloura-cart-surfaces-enabled')) {
    throw 'The cart.twig surface markers were not generated. Nothing was changed.'
}

if (-not $appScss.Contains($importLine)) {
    if (-not $appScss.EndsWith($appNl)) {
        $appScss += $appNl
    }
    $appScss += $importLine + $appNl
}

$backup = Join-Path $root ('migration-audit\before-cart-surfaces-v21-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null

$backupMap = @{}
$backupMap[$twilightPath] = Join-Path $backup 'twilight.json'
$backupMap[$cartPath] = Join-Path $backup 'src\views\pages\cart.twig'
$backupMap[$appScssPath] = Join-Path $backup 'src\assets\styles\app.scss'

foreach ($source in $backupMap.Keys) {
    $destination = $backupMap[$source]
    New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
    Copy-Item $source $destination -Force
}

$scssExisted = Test-Path $targetScssPath
if ($scssExisted) {
    $scssBackup = Join-Path $backup 'src\assets\styles\05-utilities\veloura-cart-surfaces-v21.scss'
    New-Item -ItemType Directory -Path (Split-Path $scssBackup) -Force | Out-Null
    Copy-Item $targetScssPath $scssBackup -Force
}

try {
    New-Item -ItemType Directory -Path (Split-Path $targetScssPath) -Force | Out-Null
    Copy-Item $payloadScssPath $targetScssPath -Force
    [System.IO.File]::WriteAllText($twilightPath, $twilight, $utf8NoBom)
    [System.IO.File]::WriteAllText($cartPath, $cart, $utf8NoBom)
    [System.IO.File]::WriteAllText($appScssPath, $appScss, $utf8NoBom)

    $diskParsed = Parse-Twilight ([System.IO.File]::ReadAllText($twilightPath)) 'after writing to disk'
    foreach ($id in $requiredSettingIds) {
        $count = Get-SettingDefinitionCount $diskParsed $id
        if ($count -ne 1) {
            throw "On-disk setting definition ${id} count is $count."
        }
    }

    if (-not ([System.IO.File]::ReadAllText($cartPath)).Contains($cartMarker)) {
        throw 'cart.twig verification failed after writing.'
    }
    if (-not ([System.IO.File]::ReadAllText($appScssPath)).Contains($importLine)) {
        throw 'app.scss verification failed after writing.'
    }
}
catch {
    foreach ($source in $backupMap.Keys) {
        Copy-Item $backupMap[$source] $source -Force
    }

    if ($scssExisted) {
        Copy-Item $scssBackup $targetScssPath -Force
    }
    elseif (Test-Path $targetScssPath) {
        Remove-Item $targetScssPath -Force
    }

    throw "Installation failed and original files were restored. $($_.Exception.Message)"
}

Write-Host 'twilight.json: OK' -ForegroundColor Green
Write-Host 'Cart Surfaces V2.1 safe settings installed correctly.' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
