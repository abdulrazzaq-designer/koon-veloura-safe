import 'lite-youtube-embed';
import BasePage from './base-page';
import Fslightbox from 'fslightbox';
window.fslightbox = Fslightbox;
import { zoom } from './partials/image-zoom';

class Product extends BasePage {
    onReady() {
        app.watchElements({
            totalPrice: '.total-price',
            productWeight: '.product-weight',
            beforePrice: '.before-price',
            startingPriceTitle: '.starting-price-title',
            productSku: '.product-sku',
        });

        this.initVelouraProductPageState();
        this.initVelouraDetailsOrder();
        this.initVelouraProductSliders();
        this.initVelouraProductThumbnails();
        this.initProductOptionValidations();
        this.initVelouraPurchaseButtons();
        this.initVelouraReadMore();

        /* Veloura V38 performance-safe zoom */ const velouraProductPage = document.querySelector('.veloura-product-page'); const velouraZoomControlled = Boolean(velouraProductPage && velouraProductPage.classList.contains('veloura-product-enabled')); const themeZoomEnabled = velouraZoomControlled ? velouraProductPage.classList.contains('veloura-product-zoom-enabled') : (typeof imageZoom !== 'undefined' && imageZoom); const velouraFinePointer = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches; if (themeZoomEnabled && velouraFinePointer && !this.__velouraZoomInitialized) { this.__velouraZoomInitialized = true; this.initImagesZooming(); }
    }

    initVelouraProductPageState() {
        const page = document.querySelector('.veloura-product-page');

        if (!page) {
            return;
        }

        document.documentElement.classList.add('veloura-is-product-page');
        document.body.classList.add('veloura-is-product-page');

        const rawSticky = page.getAttribute('data-veloura-v42-sticky');
        const stickyEnabled =
            rawSticky === 'true' ||
            (rawSticky !== 'false' && page.classList.contains('veloura-product-mobile-sticky-enabled'));

        document.body.classList.toggle('veloura-v42-sticky-enabled', stickyEnabled);
        document.body.classList.toggle('veloura-v42-sticky-disabled', !stickyEnabled);
        document.body.classList.toggle('veloura-product-sticky-active', stickyEnabled);

        if (!stickyEnabled) {
            document.body.classList.remove('is-sticky-product-bar');
        }
    }

    initVelouraDetailsOrder() {
        const page = document.querySelector('.veloura-product-page');
        const main = page?.querySelector('.main-content');

        if (!page || !main) {
            return;
        }

        const attributes = {
            title: 'data-v42-order-title',
            price: 'data-v42-order-price',
            status: 'data-v42-order-status',
            description: 'data-v42-order-description',
            data: 'data-v42-order-data',
            extras: 'data-v42-order-extras',
            options: 'data-v42-order-options',
            quick: 'data-v42-order-quick',
            payments: 'data-v42-order-payments',
        };

        const directGroups = () =>
            Array.from(main.children).filter((node) =>
                node.nodeType === 1 &&
                node.hasAttribute('data-v42-group') &&
                attributes[node.getAttribute('data-v42-group')]
            );

        const readOrder = (group) => {
            const raw = Number(page.getAttribute(attributes[group]));
            if (!Number.isFinite(raw)) return 10;
            return Math.max(1, Math.min(10, Math.round(raw)));
        };

        const nodes = directGroups();

        if (!nodes.length) {
            return;
        }

        /* Preserve the server-rendered order once, so disabling the feature can
           restore the exact original structure without guessing. */
        nodes.forEach((node, index) => {
            if (!node.hasAttribute('data-v42-original-index')) {
                node.setAttribute('data-v42-original-index', String(index));
            }
        });

        const enabled = page.getAttribute('data-v42-order-enabled') === 'true';

        const targetOrder = [...nodes].sort((a, b) => {
            if (!enabled) {
                return (
                    Number(a.getAttribute('data-v42-original-index')) -
                    Number(b.getAttribute('data-v42-original-index'))
                );
            }

            const groupA = a.getAttribute('data-v42-group');
            const groupB = b.getAttribute('data-v42-group');
            const orderA = readOrder(groupA);
            const orderB = readOrder(groupB);

            if (orderA !== orderB) return orderA - orderB;

            /* Same selected number = keep original sequence, exactly as the
               setting description promises. */
            return (
                Number(a.getAttribute('data-v42-original-index')) -
                Number(b.getAttribute('data-v42-original-index'))
            );
        });

        /*
         * Real DOM reorder.
         *
         * We temporarily replace only the sortable direct children with comment
         * placeholders. Ungrouped elements stay exactly where they are. Then
         * each placeholder receives the correctly sorted node.
         */
        const placeholders = nodes.map((node, index) => {
            const placeholder = document.createComment(`veloura-v42-order-slot-${index}`);
            main.replaceChild(placeholder, node);
            return placeholder;
        });

        placeholders.forEach((placeholder, index) => {
            main.replaceChild(targetOrder[index], placeholder);
        });

        main.classList.toggle('veloura-details-order-enabled', enabled);
        page.dataset.velouraOrderApplied = enabled ? 'true' : 'false';
    }

    initVelouraProductSliders() {
        const page = document.querySelector('.veloura-product-page');
        if (!page) return;

        const settings = window.velouraProductSliderSettings || {};
        const relatedHost = document.querySelector('[data-veloura-related-slider]');
        const relatedSection = relatedHost?.closest('.veloura-product-related-products');

        const clamp = (value, min, max, fallback) => {
            const number = Number(value);
            if (!Number.isFinite(number)) return fallback;
            return Math.max(min, Math.min(max, Math.round(number)));
        };

        const related = {
            mobileColumns: clamp(settings.related?.mobileColumns ?? relatedHost?.dataset.velouraRelatedMobile, 1, 3, 2),
            desktopColumns: clamp(settings.related?.desktopColumns ?? relatedHost?.dataset.velouraRelatedDesktop, 1, 6, 4),
            hideArrows: Boolean(settings.related?.hideArrows ?? (relatedHost?.dataset.velouraRelatedHideArrows === 'true')),
            centerTitle: Boolean(settings.related?.centerTitle ?? (relatedHost?.dataset.velouraRelatedCenterTitle === 'true')),
        };

        if (relatedSection) {
            relatedSection.classList.toggle('is-title-centered', related.centerTitle);
            relatedSection.classList.toggle('is-arrows-hidden', related.hideArrows);

            const heading = relatedSection.querySelector('.veloura-product-related-heading');
            const title = relatedSection.querySelector('.veloura-product-related-title');
            [heading, title].filter(Boolean).forEach((element) => {
                if (related.centerTitle) {
                    element.style.setProperty('display', 'flex', 'important');
                    element.style.setProperty('width', '100%', 'important');
                    element.style.setProperty('justify-content', 'center', 'important');
                    element.style.setProperty('text-align', 'center', 'important');
                    element.style.setProperty('margin-inline', 'auto', 'important');
                } else {
                    element.style.removeProperty('display');
                    element.style.removeProperty('width');
                    element.style.removeProperty('justify-content');
                    element.style.removeProperty('text-align');
                    element.style.removeProperty('margin-inline');
                }
            });
        }

        const sliderConfig = (config) => ({
            slidesPerView: config.mobileColumns,
            slidesPerGroup: 1,
            spaceBetween: 12,
            centeredSlides: false,
            freeMode: false,
            allowTouchMove: true,
            simulateTouch: true,
            grabCursor: true,
            watchOverflow: true,
            breakpoints: {
                768: {
                    slidesPerView: config.desktopColumns,
                    slidesPerGroup: 1,
                    spaceBetween: 16,
                },
            },
        });

        const currentColumns = (config) => (
            window.matchMedia('(min-width: 768px)').matches
                ? config.desktopColumns
                : config.mobileColumns
        );

        const currentGap = () => window.matchMedia('(min-width: 768px)').matches ? 16 : 12;

        const injectShadowFallback = (root, config, hideArrows, styleId) => {
            if (!root || !root.appendChild) return;

            let style = root.querySelector(`#${styleId}`);
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                root.appendChild(style);
            }

            const mobileWidth = `calc((100% - ${(config.mobileColumns - 1) * 12}px) / ${config.mobileColumns})`;
            const desktopWidth = `calc((100% - ${(config.desktopColumns - 1) * 16}px) / ${config.desktopColumns})`;
            const hideCss = hideArrows ? `
                .s-slider-next,.s-slider-prev,
                .swiper-button-next,.swiper-button-prev,
                [part~="next"],[part~="prev"],
                [class*="arrow-next"],[class*="arrow-prev"] {
                    display:none !important;
                    visibility:hidden !important;
                    pointer-events:none !important;
                }
            ` : '';

            style.textContent = `
                ::slotted(.swiper-slide),
                .swiper-slide,
                .swiper-wrapper > * {
                    width:${mobileWidth} !important;
                    max-width:${mobileWidth} !important;
                    flex:0 0 ${mobileWidth} !important;
                }
                ${hideCss}
                @media (min-width:768px) {
                    ::slotted(.swiper-slide),
                    .swiper-slide,
                    .swiper-wrapper > * {
                        width:${desktopWidth} !important;
                        max-width:${desktopWidth} !important;
                        flex:0 0 ${desktopWidth} !important;
                    }
                }
            `;
        };

        const forceSlides = (root, config) => {
            if (!root?.querySelectorAll) return;
            const columns = currentColumns(config);
            const gap = currentGap();
            const width = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;

            root.querySelectorAll('.swiper-slide').forEach((slide) => {
                slide.style.setProperty('width', width, 'important');
                slide.style.setProperty('max-width', width, 'important');
                slide.style.setProperty('flex', `0 0 ${width}`, 'important');
            });
        };

        const applyInnerSlider = (inner, config, hideArrows, prefix) => {
            if (!inner) return;

            const value = sliderConfig(config);
            const columns = currentColumns(config);
            const json = JSON.stringify(value);

            inner.setAttribute('slides-per-view', String(columns));
            inner.setAttribute('slider-config', json);
            inner.setAttribute('show-controls', hideArrows ? 'false' : 'true');

            try { inner.slidesPerView = String(columns); } catch (_) {}
            try { inner.sliderConfig = value; } catch (_) {}
            try { inner.showControls = !hideArrows; } catch (_) {}

            injectShadowFallback(inner.shadowRoot, config, hideArrows, `${prefix}-inner-style`);
            forceSlides(inner, config);
            forceSlides(inner.shadowRoot, config);

            const update = () => {
                const swiper = inner.swiper || inner.slider || inner.swiperInstance ||
                    inner.shadowRoot?.querySelector('.swiper,.swiper-container')?.swiper;

                if (swiper?.params) {
                    swiper.params.slidesPerView = columns;
                    swiper.params.slidesPerGroup = 1;
                    swiper.params.spaceBetween = currentGap();
                    swiper.params.breakpoints = value.breakpoints;
                    if (swiper.originalParams) {
                        swiper.originalParams.slidesPerView = config.mobileColumns;
                        swiper.originalParams.slidesPerGroup = 1;
                        swiper.originalParams.spaceBetween = 12;
                        swiper.originalParams.breakpoints = value.breakpoints;
                    }
                    try { swiper.setBreakpoint?.(); } catch (_) {}
                    try { swiper.update?.(); } catch (_) {}
                }

                forceSlides(inner, config);
                forceSlides(inner.shadowRoot, config);
                try { inner.updateSlides?.(); } catch (_) {}
                try { inner.update?.(); } catch (_) {}
            };

            update();
            if (typeof inner.componentOnReady === 'function') {
                Promise.resolve(inner.componentOnReady()).then(update).catch(() => {});
            }
            if (!inner.dataset.velouraV97AfterInit) {
                inner.dataset.velouraV97AfterInit = '1';
                inner.addEventListener('afterInit', update);
            }
        };

        const collectInnerSliders = (host) => {
            const sliders = [];
            const add = (root) => {
                if (!root?.querySelectorAll) return;
                root.querySelectorAll('salla-slider').forEach((slider) => {
                    if (!sliders.includes(slider)) sliders.push(slider);
                });
            };
            add(host);
            add(host?.shadowRoot);
            return sliders;
        };

        const applyRelated = () => {
            if (!relatedHost) return;

            injectShadowFallback(relatedHost.shadowRoot, related, related.hideArrows, 'veloura-v97-related-host-style');
            forceSlides(relatedHost, related);
            forceSlides(relatedHost.shadowRoot, related);

            const inners = collectInnerSliders(relatedHost);
            inners.forEach((inner, index) => {
                applyInnerSlider(inner, related, related.hideArrows, `veloura-v97-related-${index}`);
            });

            relatedHost.dataset.velouraV97Applied = '1';
            relatedHost.dataset.velouraV97Columns = String(currentColumns(related));
        };

        if (relatedHost) {
            applyRelated();
            if (typeof relatedHost.componentOnReady === 'function') {
                Promise.resolve(relatedHost.componentOnReady()).then(applyRelated).catch(() => {});
            }

            [80, 250, 600, 1200, 2200].forEach((delay) => {
                window.setTimeout(applyRelated, delay);
            });

            const observer = new MutationObserver(() => {
                window.requestAnimationFrame(applyRelated);
            });
            observer.observe(relatedHost, { childList: true, subtree: true });

            let resizeFrame = 0;
            window.addEventListener('resize', () => {
                if (resizeFrame) cancelAnimationFrame(resizeFrame);
                resizeFrame = requestAnimationFrame(() => {
                    resizeFrame = 0;
                    applyRelated();
                });
            }, { passive: true });
        }

        /* Recently viewed settings are kept working after removing the old
           inline slider runtime. We only touch matching recent components. */
        const recentSettings = settings.recent || {};
        const recent = {
            hide: Boolean(recentSettings.hide),
            customize: Boolean(recentSettings.customize),
            mobileColumns: clamp(recentSettings.mobileColumns, 1, 3, 2),
            desktopColumns: clamp(recentSettings.desktopColumns, 1, 6, 4),
            centerTitle: Boolean(recentSettings.centerTitle),
        };

        const isRecent = (node) => {
            const text = `${node?.textContent || ''} ${node?.getAttribute?.('block-title') || ''} ${node?.className || ''}`.toLowerCase();
            return text.includes('شاهدتها مؤخ') || text.includes('recently viewed') || text.includes('recently-viewed');
        };

        const applyRecent = () => {
            document.querySelectorAll('salla-products-slider,salla-products-list').forEach((host) => {
                if (host === relatedHost || !isRecent(host) && !isRecent(host.parentElement)) return;
                const section = host.closest('section,.container,[class*="recent"],[class*="slider"]') || host.parentElement;
                if (section) {
                    section.classList.add('veloura-recent-stable-section');
                    if (recent.hide) section.style.setProperty('display', 'none', 'important');
                    else section.style.removeProperty('display');
                    section.classList.toggle('is-title-centered', recent.customize && recent.centerTitle);
                }
                if (!recent.customize || recent.hide) return;
                injectShadowFallback(host.shadowRoot, recent, false, 'veloura-v97-recent-host-style');
                collectInnerSliders(host).forEach((inner, index) => {
                    applyInnerSlider(inner, recent, false, `veloura-v97-recent-${index}`);
                });
            });
        };

        applyRecent();
        [250, 800, 1600].forEach((delay) => window.setTimeout(applyRecent, delay));
    }

    initVelouraProductThumbnails() {
        const page = document.querySelector('.veloura-product-page');
        const slider = page?.querySelector('salla-slider.details-slider.image-slider');
        const nativeThumbs = slider?.querySelector(':scope > [slot="thumbs"]');

        if (!page || !slider || !nativeThumbs || slider.dataset.velouraV48ThumbsReady === '1') {
            return;
        }

        slider.dataset.velouraV48ThumbsReady = '1';
        slider.dataset.velouraV42ThumbsReady = '1';
        slider.dataset.velouraThumbsReady = '1';
        nativeThumbs.hidden = false;
        nativeThumbs.classList.remove('veloura-v41-native-thumbs');
        nativeThumbs.classList.add('veloura-v42-native-thumbs', 'veloura-v48-scrollable-thumbs');

        slider.removeAttribute('vertical-thumbs');
        slider.removeAttribute('thumbs-position');
        slider.removeAttribute('data-veloura-thumbs-layout');

        const horizontalConfig = {
            direction: 'horizontal',
            slidesPerView: 'auto',
            spaceBetween: 12,
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            allowTouchMove: true,
            freeMode: { enabled: true, sticky: false },
        };

        slider.setAttribute('thumbs-config', JSON.stringify(horizontalConfig));
        nativeThumbs.style.setProperty('display', 'flex', 'important');
        nativeThumbs.style.setProperty('flex-wrap', 'nowrap', 'important');
        nativeThumbs.style.setProperty('gap', '12px', 'important');
        nativeThumbs.style.setProperty('width', '100%', 'important');
        nativeThumbs.style.setProperty('max-width', '100%', 'important');
        nativeThumbs.style.setProperty('overflow-x', 'auto', 'important');
        nativeThumbs.style.setProperty('overflow-y', 'hidden', 'important');
        nativeThumbs.style.setProperty('touch-action', 'pan-x', 'important');
        nativeThumbs.style.setProperty('scroll-behavior', 'smooth', 'important');
        nativeThumbs.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        Array.from(nativeThumbs.children).forEach((thumb) => {
            thumb.style.setProperty('flex', '0 0 auto', 'important');
            thumb.style.removeProperty('transform');
        });

        let pointerDown = false;
        let moved = false;
        let startX = 0;
        let startScroll = 0;
        nativeThumbs.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            pointerDown = true;
            moved = false;
            startX = event.clientX;
            startScroll = nativeThumbs.scrollLeft;
            try { nativeThumbs.setPointerCapture(event.pointerId); } catch (error) {}
        });
        nativeThumbs.addEventListener('pointermove', (event) => {
            if (!pointerDown) return;
            const delta = event.clientX - startX;
            if (Math.abs(delta) > 4) moved = true;
            if (moved) nativeThumbs.scrollLeft = startScroll - delta;
        });
        const release = () => { pointerDown = false; };
        nativeThumbs.addEventListener('pointerup', release);
        nativeThumbs.addEventListener('pointercancel', release);
        nativeThumbs.addEventListener('pointerleave', release);
        nativeThumbs.addEventListener('click', (event) => {
            if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; }
        }, true);

        const apply = () => {
            try {
                slider.verticalThumbs = false;
                slider.thumbsConfig = horizontalConfig;
                const root = slider.shadowRoot;
                const candidates = root ? root.querySelectorAll('.swiper, [class*="thumb"] .swiper, .swiper-thumbs') : [];
                candidates.forEach((node) => {
                    const swiper = node.swiper;
                    if (!swiper || !swiper.params) return;
                    swiper.allowTouchMove = true;
                    swiper.params.allowTouchMove = true;
                    swiper.params.watchOverflow = false;
                    swiper.params.slidesPerView = 'auto';
                    swiper.params.spaceBetween = 12;
                    swiper.params.freeMode = { enabled: true, sticky: false };
                    if (swiper.originalParams) {
                        swiper.originalParams.allowTouchMove = true;
                        swiper.originalParams.watchOverflow = false;
                        swiper.originalParams.slidesPerView = 'auto';
                        swiper.originalParams.spaceBetween = 12;
                        swiper.originalParams.freeMode = { enabled: true, sticky: false };
                    }
                    if (typeof swiper.update === 'function') swiper.update();
                });
            } catch (error) {
                console.warn('Veloura horizontal thumbnails recovery failed:', error);
            }
        };

        if (window.customElements?.whenDefined) {
            window.customElements.whenDefined('salla-slider').then(() => {
                apply();
                window.setTimeout(apply, 160);
                window.setTimeout(apply, 650);
            }).catch(apply);
        } else {
            apply();
        }
    }
    initProductOptionValidations() {
        document.querySelector('.product-form')?.addEventListener('change', function () {
            this.reportValidity() && salla.product.getPrice(new FormData(this));
        });
    }

    initImagesZooming() {
        const slider = document.querySelector('salla-slider.details-slider');

        if (!slider) {
            return;
        }

        const existingZoom = document.querySelector(
            '.image-slider .magnify-wrapper.swiper-slide-active .img-magnifier-glass'
        );

        if (window.innerWidth < 1024 || existingZoom) {
            return;
        }

        setTimeout(() => {
            const image = document.querySelector(
                '.image-slider .magnify-wrapper.swiper-slide-active img'
            );

            if (!image || !image.id) {
                return;
            }

            zoom(image.id, 2);
        }, 250);

        if (slider.dataset.velouraZoomReady === '1') {
            return;
        }

        slider.dataset.velouraZoomReady = '1';

        slider.addEventListener('slideChange', () => {
            setTimeout(() => {
                const existingZoom = document.querySelector(
                    '.image-slider .magnify-wrapper.swiper-slide-active .img-magnifier-glass'
                );

                if (window.innerWidth < 1024 || existingZoom) {
                    return;
                }

                const image = document.querySelector(
                    '.image-slider .magnify-wrapper.swiper-slide-active img'
                );

                if (!image || !image.id) {
                    return;
                }

                zoom(image.id, 2);
            }, 250);
        });
    }


    initVelouraPurchaseButtons() {
        const page = document.querySelector('.veloura-product-page');

        if (!page) {
            return;
        }

        const state = window.__velouraStablePurchaseButtons || {
            roots: new WeakMap(),
            documentObserver: null,
            frame: 0,
            hooksReady: false,
        };
        window.__velouraStablePurchaseButtons = state;

        const getTokens = () => {
            const styles = window.getComputedStyle(page);
            return {
                radius: (
                    styles.getPropertyValue('--veloura-product-radius-final') ||
                    styles.getPropertyValue('--veloura-product-radius') ||
                    '28px'
                ).trim(),
                primary: (
                    styles.getPropertyValue('--veloura-product-primary') ||
                    styles.getPropertyValue('--color-primary') ||
                    '#004d65'
                ).trim(),
                primaryText: (
                    styles.getPropertyValue('--veloura-product-primary-text') ||
                    styles.getPropertyValue('--color-primary-reverse') ||
                    '#ffffff'
                ).trim(),
                height: '46px',
            };
        };

        const composedParent = (node) => {
            if (!node) return null;
            if (node.parentElement) return node.parentElement;
            const root = node.getRootNode?.();
            return root?.host || null;
        };

        const findPurchaseHost = (node) => {
            let current = node;
            for (let depth = 0; current && depth < 12; depth += 1) {
                if (current.matches?.('salla-add-product-button.sticky-product-bar__btn')) {
                    return current;
                }
                current = composedParent(current);
            }
            return null;
        };

        const ensureStyle = (root, id, css) => {
            if (!root?.querySelector) return;
            let style = root.querySelector(`#${id}`);
            if (!style) {
                style = document.createElement('style');
                style.id = id;
                root.appendChild(style);
            }
            if (style.textContent !== css) {
                style.textContent = css;
            }
        };

        const observeRoot = (root, callback) => {
            if (!root || state.roots.has(root)) return;
            const observer = new MutationObserver(() => {
                window.requestAnimationFrame(callback);
            });
            observer.observe(root, { childList: true, subtree: true });
            state.roots.set(root, observer);
        };

        const styleButtonRoot = (button, kind, tokens, seen = new WeakSet()) => {
            if (!button || seen.has(button)) return;
            seen.add(button);

            button.style.setProperty('display', 'block', 'important');
            button.style.setProperty('width', '100%', 'important');
            button.style.setProperty('min-width', '0', 'important');
            button.style.setProperty('height', tokens.height, 'important');
            button.style.setProperty('min-height', tokens.height, 'important');
            button.style.setProperty('max-height', tokens.height, 'important');
            button.style.setProperty('border-radius', tokens.radius, 'important');
            button.style.setProperty('--salla-button-border-radius', tokens.radius, 'important');
            button.style.setProperty('--salla-fast-checkout-button-border-radius', tokens.radius, 'important');

            if (kind === 'cart') {
                button.setAttribute?.('fill', 'solid');
                button.setAttribute?.('width', 'wide');
                button.setAttribute?.('color', 'primary');
                button.style.setProperty('--color-primary', tokens.primary, 'important');
                button.style.setProperty('--color-primary-reverse', tokens.primaryText, 'important');
                button.style.setProperty('--button-background-color', tokens.primary, 'important');
                button.style.setProperty('--button-border-color', tokens.primary, 'important');
                button.style.setProperty('--button-text-color', tokens.primaryText, 'important');
            }

            const root = button.shadowRoot;
            if (!root) return;

            const css = `
              :host {
                display: block !important;
                width: 100% !important;
                min-width: 0 !important;
                height: ${tokens.height} !important;
                min-height: ${tokens.height} !important;
                max-height: ${tokens.height} !important;
                border-radius: ${tokens.radius} !important;
                overflow: hidden !important;
                opacity: 1 !important;
                visibility: visible !important;
              }
              button,
              a,
              .s-button-wrap,
              .s-button-element,
              .s-button-btn,
              [part~="button"] {
                display: flex !important;
                width: 100% !important;
                min-width: 0 !important;
                height: ${tokens.height} !important;
                min-height: ${tokens.height} !important;
                max-height: ${tokens.height} !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
                border-radius: ${tokens.radius} !important;
                opacity: 1 !important;
                visibility: visible !important;
              }
              ${kind === 'cart' ? `
              button,
              .s-button-wrap,
              .s-button-element,
              .s-button-btn,
              [part~="button"] {
                background: ${tokens.primary} !important;
                background-color: ${tokens.primary} !important;
                border-color: ${tokens.primary} !important;
                color: ${tokens.primaryText} !important;
              }
              button *,
              .s-button-wrap *,
              .s-button-element *,
              .s-button-btn * {
                color: ${tokens.primaryText} !important;
                fill: ${tokens.primaryText} !important;
                stroke: currentColor !important;
              }
              ` : ''}
            `;

            ensureStyle(root, 'veloura-product-purchase-button-style-2026', css);
            root.querySelectorAll('salla-button, salla-quick-buy, salla-mini-checkout-widget').forEach((inner) => {
                styleButtonRoot(inner, kind, tokens, seen);
            });
            observeRoot(root, () => {
                const owner = findPurchaseHost(button) || findPurchaseHost(root.host);
                if (owner) apply(owner);
            });
        };

        const apply = (target) => {
            if (!target?.isConnected) return;

            const tokens = getTokens();
            const root = target.shadowRoot || target;
            const main = root.querySelector?.('.s-add-product-button-main');

            target.style.setProperty('display', 'block', 'important');
            target.style.setProperty('width', '100%', 'important');
            target.style.setProperty('min-width', '0', 'important');
            target.style.setProperty('border-radius', tokens.radius, 'important');
            target.style.setProperty('overflow', 'hidden', 'important');

            if (target.shadowRoot) {
                observeRoot(target.shadowRoot, () => apply(target));
            }

            if (!main) return;

            main.style.setProperty('display', 'grid', 'important');
            main.style.setProperty('grid-template-columns', 'repeat(2, minmax(0, 1fr))', 'important');
            main.style.setProperty('align-items', 'stretch', 'important');
            main.style.setProperty('width', '100%', 'important');
            main.style.setProperty('min-width', '0', 'important');
            main.style.setProperty('gap', '10px', 'important');
            main.style.setProperty('direction', 'rtl', 'important');

            const children = Array.from(main.children).filter((child) => {
                const style = window.getComputedStyle(child);
                return !child.hidden && style.display !== 'none';
            });

            main.style.setProperty(
                'grid-template-columns',
                children.length > 1 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
                'important'
            );

            children.forEach((child, index) => {
                child.style.setProperty('display', 'block', 'important');
                child.style.setProperty('width', '100%', 'important');
                child.style.setProperty('min-width', '0', 'important');
                child.style.setProperty('max-width', '100%', 'important');
                child.style.setProperty('margin', '0', 'important');
                child.style.setProperty('opacity', '1', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.hidden = false;
                styleButtonRoot(child, index === 0 ? 'cart' : 'quick', tokens);
            });
        };

        const applyAll = () => {
            page.querySelectorAll('salla-add-product-button.sticky-product-bar__btn').forEach((target) => {
                apply(target);
                if (typeof target.componentOnReady === 'function') {
                    Promise.resolve(target.componentOnReady()).then(() => apply(target)).catch(() => {});
                }
            });
        };

        const scheduleApply = () => {
            window.cancelAnimationFrame(state.frame);
            state.frame = window.requestAnimationFrame(applyAll);
        };

        if (!state.documentObserver) {
            const form = page;
            state.documentObserver = new MutationObserver((records) => {
                const relevant = records.some((record) => Array.from(record.addedNodes).some((node) =>
                    node.nodeType === 1 && (
                        node.matches?.('salla-add-product-button, salla-button, salla-quick-buy, salla-mini-checkout-widget') ||
                        node.querySelector?.('salla-add-product-button, salla-button, salla-quick-buy, salla-mini-checkout-widget')
                    )
                ));
                if (relevant) scheduleApply();
            });
            state.documentObserver.observe(form, { childList: true, subtree: true });
        }

        const registerHooks = () => {
            if (state.hooksReady) return;
            const api = window.Salla || window.salla;
            if (!api?.hooks?.registerHook) return;

            state.hooksReady = true;
            ['salla-add-product-button', 'salla-button', 'salla-quick-buy', 'salla-mini-checkout-widget']
                .forEach((tag) => {
                    api.hooks.registerHook(tag, 'componentDidLoad', (target) => {
                        const host = findPurchaseHost(target);
                        if (host) window.requestAnimationFrame(() => apply(host));
                    });
                });
        };

        const api = window.Salla || window.salla;
        if (api?.onReady) api.onReady(registerHooks);
        else registerHooks();

        page.addEventListener('change', scheduleApply, true);
        page.addEventListener('salla-product-options::changed', scheduleApply);
        document.addEventListener('theme::ready', scheduleApply);
        salla.product.event.onPriceUpdated(scheduleApply);

        applyAll();
    }

    initVelouraReadMore() {
        const button = document.querySelector('#btn-show-more');
        const content = document.querySelector('#more-content');

        if (!button || !content || button.dataset.velouraReadMoreReady === '1') {
            return;
        }

        button.dataset.velouraReadMoreReady = '1';

        const textNode = button.querySelector('.veloura-product-read-more__text');
        const moreText = button.dataset.moreText || 'عرض المزيد';
        const lessText = button.dataset.lessText || 'عرض أقل';
        const rootFontSize = parseFloat(
            window.getComputedStyle(document.documentElement).fontSize
        ) || 16;
        const collapsedHeight = 8.5 * rootFontSize;

        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 440ms cubic-bezier(.22, .61, .36, 1)';
        content.style.maxHeight = `${collapsedHeight}px`;

        const setButtonText = (expanded) => {
            if (textNode) {
                textNode.textContent = expanded ? lessText : moreText;
            } else {
                button.textContent = expanded ? lessText : moreText;
            }

            button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        };

        button.addEventListener('click', (event) => {
            event.preventDefault();

            const willExpand = !button.classList.contains('is-expanded');
            const currentHeight = content.getBoundingClientRect().height;

            content.style.maxHeight = `${currentHeight}px`;
            void content.offsetHeight;

            button.classList.toggle('is-expanded', willExpand);
            content.classList.toggle('is-expanded', willExpand);
            setButtonText(willExpand);

            window.requestAnimationFrame(() => {
                const targetHeight = willExpand
                    ? content.scrollHeight
                    : collapsedHeight;

                content.style.maxHeight = `${targetHeight}px`;
            });
        });

        content.addEventListener('transitionend', (event) => {
            if (event.propertyName !== 'max-height') {
                return;
            }

            if (button.classList.contains('is-expanded')) {
                content.style.maxHeight = `${content.scrollHeight}px`;
            }
        });

        window.addEventListener('resize', () => {
            content.style.maxHeight = button.classList.contains('is-expanded')
                ? `${content.scrollHeight}px`
                : `${collapsedHeight}px`;
        });
    }


    registerEvents() {
        salla.event.on('product::price.updated.failed', () => {
            document.querySelectorAll('.price-wrapper').forEach((el) => el.classList.add('hidden'));

            const outOfStock = app.element('.out-of-stock');

            if (!outOfStock) {
                return;
            }

            outOfStock.classList.remove('hidden');
            outOfStock.classList.remove('scale-pulse');

            void outOfStock.offsetWidth;

            outOfStock.classList.add('scale-pulse');
        });

        salla.product.event.onPriceUpdated((res) => {
            document.querySelectorAll('.out-of-stock').forEach((el) => el.classList.add('hidden'));
            document.querySelectorAll('.price-wrapper').forEach((el) => el.classList.remove('hidden'));

            const data = res.data;
            const price = Number(data.price || 0);
            const regularPrice = Number(data.regular_price || 0);
            const isOnSale = Boolean(data.has_sale_price || regularPrice > price) && regularPrice > price;

            app.startingPriceTitle?.classList.add('hidden');

            app.productWeight.forEach((el) => {
                el.innerHTML = data.weight || '';
            });

            app.totalPrice.forEach((el) => {
                el.innerHTML = salla.money(data.price);
            });

            app.beforePrice.forEach((el) => {
                el.innerHTML = salla.money(data.regular_price);
                el.classList.toggle('hidden', !isOnSale);
            });

            app.productSku.forEach((el) => {
                el.innerHTML = data.sku || '';
            });

    
            document.querySelectorAll('.total-price, .product-weight').forEach(el => {
                el.classList.remove('scale-pulse');
                void el.offsetWidth;
                el.classList.add('scale-pulse');
            });
        });


    }
}

Product.initiateWhenReady(['product.single']);
