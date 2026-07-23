$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$twilightPath = Join-Path $root 'twilight.json'
$cartPath = Join-Path $root 'src\views\pages\cart.twig'
$appScssPath = Join-Path $root 'src\assets\styles\app.scss'
$payloadScssPath = Join-Path $root 'payload\src\assets\styles\05-utilities\veloura-cart-surfaces-v2.scss'
$targetScssPath = Join-Path $root 'src\assets\styles\05-utilities\veloura-cart-surfaces-v2.scss'
$importLine = "@import './05-utilities/veloura-cart-surfaces-v2';"

foreach ($path in @($twilightPath, $cartPath, $appScssPath, $payloadScssPath)) {
    if (-not (Test-Path $path)) {
        throw "Required file was not found: $path"
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$twilight = [System.IO.File]::ReadAllText($twilightPath)
$cart = [System.IO.File]::ReadAllText($cartPath)
$appScss = [System.IO.File]::ReadAllText($appScssPath)

# Validate the existing JSON before touching any file.
try {
    $twilight | ConvertFrom-Json | Out-Null
}
catch {
    throw "twilight.json is invalid before installation. Nothing was changed. $($_.Exception.Message)"
}

$jsonNl = if ($twilight.Contains("`r`n")) { "`r`n" } else { "`n" }
$cartNl = if ($cart.Contains("`r`n")) { "`r`n" } else { "`n" }
$appNl = if ($appScss.Contains("`r`n")) { "`r`n" } else { "`n" }

# Build the Twilight settings block using the project's existing schema:
# colors are type=string + format=color; dropdowns use selected/options/source.
if ($twilight -notmatch '"id"\s*:\s*"veloura_cart_surfaces_enabled_2026"') {
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

    $markerPattern = '(?m)^    \{\r?\n      "type": "static",\r?\n      "format": "description",\r?\n      "id": "veloura_product_card_settings_title_2026",'
    $marker = [regex]::Match($twilight, $markerPattern)
    if (-not $marker.Success) {
        throw 'Could not find the product-card settings marker in twilight.json. Nothing was changed.'
    }
    $twilight = $twilight.Insert($marker.Index, $settingsSnippet)
}

# Validate the modified JSON in memory before writing it.
try {
    $parsed = $twilight | ConvertFrom-Json
}
catch {
    throw "Generated twilight.json is invalid. Nothing was changed. $($_.Exception.Message)"
}

$requiredSettingIds = @(
    'veloura_cart_surfaces_settings_title_2026',
    'veloura_cart_surfaces_enabled_2026',
    'veloura_cart_surfaces_bg_color_2026',
    'veloura_cart_surfaces_radius_2026',
    'veloura_cart_surfaces_border_enabled_2026',
    'veloura_cart_surfaces_border_color_2026',
    'veloura_cart_surfaces_shadow_enabled_2026'
)
foreach ($id in $requiredSettingIds) {
    $count = ([regex]::Matches($twilight, '"id"\s*:\s*"' + [regex]::Escape($id) + '"')).Count
    if ($count -ne 1) {
        throw "Setting ID $id must appear exactly once; found $count. Nothing was changed."
    }
}

# Add only a small settings block and one scoped class to the current cart.twig.
if ($cart -notmatch 'veloura_cart_surfaces_enabled_2026') {
$cartSettingsBlock = @'
    {% set vcart_surfaces_enabled = theme.settings.get('veloura_cart_surfaces_enabled_2026', false) %}
    {% set vcart_surface_bg = theme.settings.get('veloura_cart_surfaces_bg_color_2026', '#f3f4f6') %}
    {% set vcart_surface_radius_key = theme.settings.get('veloura_cart_surfaces_radius_2026', 'medium') %}
    {% set vcart_surface_border_enabled = theme.settings.get('veloura_cart_surfaces_border_enabled_2026', false) %}
    {% set vcart_surface_border_color = theme.settings.get('veloura_cart_surfaces_border_color_2026', '#e5e7eb') %}
    {% set vcart_surface_shadow_enabled = theme.settings.get('veloura_cart_surfaces_shadow_enabled_2026', false) %}
    {% set vcart_surface_radius = '16px' %}
    {% if vcart_surface_radius_key == 'sharp' %}
        {% set vcart_surface_radius = '0px' %}
    {% elseif vcart_surface_radius_key == 'soft' %}
        {% set vcart_surface_radius = '10px' %}
    {% elseif vcart_surface_radius_key == 'large' %}
        {% set vcart_surface_radius = '24px' %}
    {% elseif vcart_surface_radius_key == 'round' %}
        {% set vcart_surface_radius = '32px' %}
    {% endif %}
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

if ($cart -notmatch 'veloura-cart-surfaces-enabled') {
    throw 'The cart surface class was not generated. Nothing was changed.'
}

# Add the SCSS import without replacing the current app.scss.
if ($appScss -notmatch [regex]::Escape($importLine)) {
    if (-not $appScss.EndsWith($appNl)) {
        $appScss += $appNl
    }
    $appScss += $importLine + $appNl
}

$backup = Join-Path $root ('migration-audit\before-cart-surfaces-v2-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
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

try {
    New-Item -ItemType Directory -Path (Split-Path $targetScssPath) -Force | Out-Null
    Copy-Item $payloadScssPath $targetScssPath -Force
    [System.IO.File]::WriteAllText($twilightPath, $twilight, $utf8NoBom)
    [System.IO.File]::WriteAllText($cartPath, $cart, $utf8NoBom)
    [System.IO.File]::WriteAllText($appScssPath, $appScss, $utf8NoBom)

    # Final on-disk checks.
    ([System.IO.File]::ReadAllText($twilightPath)) | ConvertFrom-Json | Out-Null
    if (([System.IO.File]::ReadAllText($cartPath)) -notmatch 'veloura-cart-surfaces-enabled') {
        throw 'cart.twig verification failed after writing.'
    }
    if (([System.IO.File]::ReadAllText($appScssPath)) -notmatch [regex]::Escape($importLine)) {
        throw 'app.scss verification failed after writing.'
    }
}
catch {
    foreach ($source in $backupMap.Keys) {
        Copy-Item $backupMap[$source] $source -Force
    }
    if (Test-Path $targetScssPath) {
        Remove-Item $targetScssPath -Force
    }
    throw "Installation failed and original files were restored. $($_.Exception.Message)"
}

Write-Host 'twilight.json: OK' -ForegroundColor Green
Write-Host 'Cart Surfaces V2 safe settings installed correctly.' -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor DarkGray
