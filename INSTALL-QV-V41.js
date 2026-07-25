const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v41-' + timestamp());

const START = '{# Veloura QV V41 sticky state and custom right thumbnails start #}';
const END = '{# Veloura QV V41 sticky state and custom right thumbnails end #}';
const STYLE_ID = 'veloura-qv-v41-sticky-thumbs-style-2026';
const SCRIPT_ID = 'veloura-qv-v41-sticky-state-runtime-2026';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function backup(file, relativeName) {
  const target = path.join(backupDir, relativeName);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function stripMarkedBlock(content, start, end) {
  const re = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}
function replaceMethod(content, methodName, replacement) {
  const startToken = `    ${methodName}() {`;
  const start = content.indexOf(startToken);
  if (start < 0) return null;
  const nextMethod = /^    [A-Za-z_$][\w$]*\([^\n]*\) \{/gm;
  nextMethod.lastIndex = start + startToken.length;
  const match = nextMethod.exec(content);
  if (!match) fail(`Could not locate the method after ${methodName}.`);
  return content.slice(0, start) + replacement + '\n' + content.slice(match.index);
}
function ensureOnReadyCall(content, call, afterCall) {
  if (content.includes(call)) return content;
  if (content.includes(afterCall)) return content.replace(afterCall, afterCall + '\n        ' + call);
  fail(`Could not add ${call} to onReady().`);
}

const block = `${START}
<style id="${STYLE_ID}">
  /* V41: the disabled state always wins, even when Salla leaves a native sticky class behind. */
  @media (max-width: 640px) {
    html body.veloura-v41-sticky-enabled .veloura-v41-sticky-ancestor {
      transform: none !important;
      filter: none !important;
      perspective: none !important;
      contain: none !important;
      isolation: auto !important;
      z-index: auto !important;
      clip-path: none !important;
      overflow: visible !important;
    }

    html body.veloura-v41-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar {
      position: fixed !important;
      inset-inline: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
      z-index: 2147483000 !important;
      isolation: isolate !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: translate3d(0,0,0) !important;
    }

    html body.veloura-v41-sticky-disabled
    .veloura-product-page.veloura-product-mobile-sticky-disabled
    .sticky-product-bar.veloura-product-sticky-bar,
    html body .veloura-product-page.veloura-product-mobile-sticky-disabled
    .sticky-product-bar.veloura-product-sticky-bar {
      position: static !important;
      inset: auto !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 16px 0 0 !important;
      z-index: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: none !important;
    }

    html body.veloura-v41-sticky-disabled .product-single,
    html body.veloura-v41-sticky-disabled.is-sticky-product-bar.product-single {
      padding-bottom: 0 !important;
    }

    #mobile-menu,
    .mm-menu,
    .mm-wrapper__blocker,
    .mm-page__blocker,
    salla-sidebar,
    salla-modal,
    .s-modal-wrapper,
    [role="dialog"] {
      z-index: 2147483600 !important;
    }
  }

  /* V41 custom desktop rail: it is independent from Salla's internal left-side vertical layout. */
  .veloura-v41-gallery-shell {
    width: 100% !important;
    min-width: 0 !important;
  }
  .veloura-v41-thumb-rail {
    display: none;
  }

  @media (min-width: 768px) {
    .veloura-v41-gallery-shell.is-right-thumbs {
      --veloura-v41-thumb-width: clamp(82px, 7vw, 104px);
      --veloura-v41-thumb-gap: 12px;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) var(--veloura-v41-thumb-width) !important;
      grid-template-areas: "main thumbs" !important;
      gap: var(--veloura-v41-thumb-gap) !important;
      align-items: start !important;
      direction: ltr !important;
      overflow: visible !important;
    }
    .veloura-v41-gallery-shell.is-right-thumbs > salla-slider.details-slider {
      grid-area: main !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      direction: rtl !important;
    }
    .veloura-v41-gallery-shell.is-right-thumbs .veloura-v41-thumb-rail {
      grid-area: thumbs !important;
      display: flex !important;
      flex-direction: column !important;
      gap: var(--veloura-v41-thumb-gap) !important;
      height: var(--veloura-v41-gallery-height, 520px) !important;
      max-height: var(--veloura-v41-gallery-height, 520px) !important;
      min-height: 0 !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      overscroll-behavior: contain !important;
      scrollbar-width: thin;
      direction: rtl !important;
      padding: 0 0 2px !important;
    }
    .veloura-v41-gallery-shell.is-right-thumbs .veloura-v41-thumb-button {
      flex: 0 0 calc(
        (100% - (var(--veloura-v41-visible-count, 3) - 1) * var(--veloura-v41-thumb-gap)) /
        var(--veloura-v41-visible-count, 3)
      ) !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 2px solid transparent !important;
      border-radius: var(--veloura-product-radius-final, 18px) !important;
      background: var(--veloura-product-inner-bg, #fff) !important;
      overflow: hidden !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
    }
    .veloura-v41-gallery-shell.is-right-thumbs .veloura-v41-thumb-button.is-active {
      border-color: var(--color-primary, #10bcd4) !important;
    }
    .veloura-v41-gallery-shell.is-right-thumbs .veloura-v41-thumb-button img {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      object-fit: cover !important;
      border-radius: inherit !important;
    }
    .veloura-v41-gallery-shell.is-right-thumbs > salla-slider > .veloura-v41-native-thumbs,
    .veloura-v41-gallery-shell.is-right-thumbs > salla-slider > [slot="thumbs"] {
      display: none !important;
    }
  }

  @media (max-width: 767px) {
    .veloura-v41-gallery-shell,
    .veloura-v41-gallery-shell.is-right-thumbs {
      display: block !important;
    }
    .veloura-v41-thumb-rail {
      display: none !important;
    }
    .veloura-v41-gallery-shell > salla-slider > .veloura-v41-native-thumbs,
    .veloura-v41-gallery-shell > salla-slider > [slot="thumbs"] {
      display: block !important;
    }
  }
</style>
<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  function syncStickyState() {
    var page = document.querySelector('.veloura-product-page');
    var bar = page && page.querySelector('.veloura-product-sticky-bar');
    if (!page || !bar || !document.body) return;

    var raw = page.getAttribute('data-veloura-v41-sticky');
    var enabled = raw === 'true' || (raw !== 'false' && page.classList.contains('veloura-product-mobile-sticky-enabled'));

    document.documentElement.classList.add('veloura-is-product-page');
    document.body.classList.add('veloura-is-product-page');
    document.body.classList.toggle('veloura-v41-sticky-enabled', enabled);
    document.body.classList.toggle('veloura-v41-sticky-disabled', !enabled);
    document.body.classList.toggle('veloura-product-sticky-active', enabled);

    if (!enabled) {
      document.body.classList.remove('is-sticky-product-bar');
    }

    var parent = bar.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      parent.classList.add('veloura-v41-sticky-ancestor');
      parent = parent.parentElement;
    }

    var button = bar.querySelector('salla-add-product-button');
    if (button) {
      if (enabled) button.setAttribute('support-sticky-bar', '');
      else button.removeAttribute('support-sticky-bar');
    }
  }

  function run() {
    syncStickyState();
    window.setTimeout(syncStickyState, 120);
    window.setTimeout(syncStickyState, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  document.addEventListener('theme::ready', syncStickyState);
  window.addEventListener('pageshow', syncStickyState, { passive: true });
  window.addEventListener('orientationchange', function () { window.setTimeout(syncStickyState, 180); }, { passive: true });
})();
</script>
${END}`;

const stateMethod = `    initVelouraProductPageState() {
        const page = document.querySelector('.veloura-product-page');

        if (!page) {
            return;
        }

        document.documentElement.classList.add('veloura-is-product-page');
        document.body.classList.add('veloura-is-product-page');

        const rawSticky = page.getAttribute('data-veloura-v41-sticky');
        const stickyEnabled =
            rawSticky === 'true' ||
            (rawSticky !== 'false' && page.classList.contains('veloura-product-mobile-sticky-enabled'));

        document.body.classList.toggle('veloura-v41-sticky-enabled', stickyEnabled);
        document.body.classList.toggle('veloura-v41-sticky-disabled', !stickyEnabled);
        document.body.classList.toggle('veloura-product-sticky-active', stickyEnabled);

        if (!stickyEnabled) {
            document.body.classList.remove('is-sticky-product-bar');
        }
    }`;

const thumbnailsMethod = `    initVelouraProductThumbnails() {
        const page = document.querySelector('.veloura-product-page');
        const slider = page?.querySelector('salla-slider.details-slider.image-slider');
        const nativeThumbs = slider?.querySelector(':scope > [slot="thumbs"]');

        if (!page || !slider || !nativeThumbs || slider.dataset.velouraV41ThumbsReady === '1') {
            return;
        }

        slider.dataset.velouraV41ThumbsReady = '1';
        slider.dataset.velouraThumbsReady = '1';
        nativeThumbs.classList.add('veloura-v41-native-thumbs');

        const selectedLayout =
            slider.getAttribute('data-veloura-thumbs-layout') ||
            page.getAttribute('data-veloura-v37-thumbs') ||
            'below_image';
        const desktopMedia = window.matchMedia('(min-width: 768px)');

        let shell = slider.parentElement;
        if (!shell?.classList.contains('veloura-v41-gallery-shell')) {
            shell = document.createElement('div');
            shell.className = 'veloura-v41-gallery-shell';
            slider.parentNode.insertBefore(shell, slider);
            shell.appendChild(slider);
        }

        let rail = shell.querySelector(':scope > .veloura-v41-thumb-rail');
        if (!rail) {
            rail = document.createElement('div');
            rail.className = 'veloura-v41-thumb-rail';
            rail.setAttribute('role', 'tablist');
            rail.setAttribute('aria-label', 'صور المنتج المصغرة');
            shell.appendChild(rail);
        }

        const sourceThumbs = Array.from(nativeThumbs.querySelectorAll('.veloura-product-thumb-item'));
        const buttons = sourceThumbs.map((thumb, index) => {
            const sourceImage = thumb.querySelector('img');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'veloura-v41-thumb-button' + (index === 0 ? ' is-active' : '');
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            button.setAttribute('aria-label', 'عرض صورة المنتج ' + (index + 1));

            if (sourceImage) {
                const image = document.createElement('img');
                image.src = sourceImage.currentSrc || sourceImage.src;
                image.alt = sourceImage.alt || '';
                image.loading = index < 3 ? 'eager' : 'lazy';
                button.appendChild(image);
            }

            button.addEventListener('click', () => {
                buttons.forEach((item, itemIndex) => {
                    item.classList.toggle('is-active', itemIndex === index);
                    item.setAttribute('aria-selected', itemIndex === index ? 'true' : 'false');
                });
                if (typeof slider.slideTo === 'function') {
                    slider.slideTo(index);
                }
            });

            rail.appendChild(button);
            return button;
        });

        const setActive = (index) => {
            index = Number.parseInt(index, 10);
            if (!Number.isFinite(index)) return;
            buttons.forEach((button, itemIndex) => {
                const active = itemIndex === index;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-selected', active ? 'true' : 'false');
                if (active) button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        };

        slider.addEventListener('slideChange', (event) => {
            const detail = event.detail || {};
            const index =
                detail.realIndex ??
                detail.activeIndex ??
                detail.swiper?.realIndex ??
                detail.swiper?.activeIndex;
            setActive(index);
        });

        let frame = 0;
        const measure = () => {
            frame = 0;
            if (!shell.classList.contains('is-right-thumbs')) return;

            let height = 0;
            const shadowSwipers = slider.shadowRoot
                ? Array.from(slider.shadowRoot.querySelectorAll('.swiper'))
                : [];
            shadowSwipers.forEach((element) => {
                const rect = element.getBoundingClientRect();
                if (rect.width > 150 && rect.height > height) height = rect.height;
            });

            if (height < 120) {
                const item = slider.querySelector('[slot="items"] .swiper-slide');
                height = item?.getBoundingClientRect().height || slider.getBoundingClientRect().height;
            }

            if (height < 120) return;
            const width = Math.max(1, slider.getBoundingClientRect().width);
            const visibleCount = height >= width * 1.08 ? 3 : 2;
            shell.style.setProperty('--veloura-v41-gallery-height', height.toFixed(2) + 'px');
            shell.style.setProperty('--veloura-v41-visible-count', String(visibleCount));
        };

        const scheduleMeasure = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };

        const horizontalConfig = {
            direction: 'horizontal',
            slidesPerView: 'auto',
            spaceBetween: 12,
            watchSlidesProgress: true,
        };

        const applyLayout = async () => {
            const right = selectedLayout === 'right_side' && desktopMedia.matches;
            shell.classList.toggle('is-right-thumbs', right);
            rail.hidden = !right;
            nativeThumbs.hidden = right;

            slider.removeAttribute('vertical-thumbs');
            slider.setAttribute('thumbs-config', JSON.stringify(horizontalConfig));
            try {
                slider.verticalThumbs = false;
                slider.thumbsConfig = horizontalConfig;
                if (typeof slider.update === 'function') await slider.update();
            } catch (error) {
                console.warn('Veloura thumbnail layout update failed:', error);
            }

            if (right) {
                scheduleMeasure();
                window.setTimeout(scheduleMeasure, 120);
                window.setTimeout(scheduleMeasure, 500);
            } else {
                shell.style.removeProperty('--veloura-v41-gallery-height');
                shell.style.removeProperty('--veloura-v41-visible-count');
            }
        };

        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(scheduleMeasure);
            resizeObserver.observe(slider);
        }

        slider.querySelectorAll('[slot="items"] img').forEach((image) => {
            if (!image.complete) image.addEventListener('load', scheduleMeasure, { once: true });
        });

        if (window.customElements?.whenDefined) {
            window.customElements.whenDefined('salla-slider').then(applyLayout).catch(applyLayout);
        } else {
            applyLayout();
        }

        if (typeof desktopMedia.addEventListener === 'function') {
            desktopMedia.addEventListener('change', applyLayout);
        } else if (typeof desktopMedia.addListener === 'function') {
            desktopMedia.addListener(applyLayout);
        }
    }`;

try {
  let master = read(masterPath);
  let single = read(singlePath);
  let productJs = read(productJsPath);

  backup(masterPath, path.join('src', 'views', 'layouts', 'master.twig'));
  backup(singlePath, path.join('src', 'views', 'pages', 'product', 'single.twig'));
  backup(productJsPath, path.join('src', 'assets', 'js', 'product.js'));

  master = stripMarkedBlock(master, START, END);
  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) fail('Could not find a safe head anchor in master.twig.');
  master = master.replace(anchor, block + '\n' + anchor);

  if (!single.includes('data-veloura-v41-sticky=')) {
    single = single.replace(
      /<div data-veloura-product-build=/,
      `<div data-veloura-v41-sticky="{{ vpp_mobile_sticky_cart ? 'true' : 'false' }}" data-veloura-product-build=`
    );
  }
  single = single.replace(/^\s*\{\{\s*vpp_thumbnails_position == 'right_side' \? 'vertical-thumbs' : ''\s*\}\}\s*\r?\n/m, '');
  single = single.replace(/\s+vertical-thumbs(?=[\s>])/g, '');
  single = single.replace(/\s+thumbs-position="[^"]*"/g, '');
  if (!single.includes('class="veloura-v41-native-thumbs"')) {
    single = single.replace('<div slot="thumbs">', '<div slot="thumbs" class="veloura-v41-native-thumbs">');
  }

  productJs = ensureOnReadyCall(
    productJs,
    'this.initVelouraProductThumbnails();',
    'this.initVelouraProductPageState();'
  );

  const stateReplaced = replaceMethod(productJs, 'initVelouraProductPageState', stateMethod);
  if (!stateReplaced) fail('initVelouraProductPageState() was not found in product.js.');
  productJs = stateReplaced;

  const thumbsReplaced = replaceMethod(productJs, 'initVelouraProductThumbnails', thumbnailsMethod);
  if (thumbsReplaced) {
    productJs = thumbsReplaced;
  } else {
    const insertionPoint = '    initProductOptionValidations() {';
    if (!productJs.includes(insertionPoint)) fail('Could not insert initVelouraProductThumbnails().');
    productJs = productJs.replace(insertionPoint, thumbnailsMethod + '\n\n' + insertionPoint);
  }

  write(masterPath, master);
  write(singlePath, single);
  write(productJsPath, productJs);

  console.log('Quick View V41 installed correctly.');
  console.log('The mobile purchase bar now follows the toggle exactly: fixed above page content when enabled, normal in-flow content when disabled.');
  console.log('Desktop right thumbnails now use a dedicated right-side rail equal to the main image height.');
  console.log('The rail shows three thumbnails for tall galleries and two for shorter/rectangular galleries, with scrolling for the rest.');
  console.log(`Backup: ${path.relative(root, backupDir)}`);
} catch (error) {
  console.error('Install failed: ' + error.message);
  process.exit(1);
}
