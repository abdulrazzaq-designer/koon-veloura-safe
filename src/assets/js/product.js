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
        const host = document.querySelector('[data-veloura-related-slider]');
        const section = host?.closest('.veloura-product-related-products');

        const clamp = (value, min, max, fallback) => {
            const number = Number(value);
            if (!Number.isFinite(number)) return fallback;
            return Math.max(min, Math.min(max, Math.round(number)));
        };

        const config = {
            mobileColumns: clamp(
                settings.related?.mobileColumns ?? host?.dataset.velouraRelatedMobile,
                1,
                3,
                2
            ),
            desktopColumns: clamp(
                settings.related?.desktopColumns ?? host?.dataset.velouraRelatedDesktop,
                1,
                6,
                4
            ),
            hideArrows: Boolean(
                settings.related?.hideArrows ??
                (host?.dataset.velouraRelatedHideArrows === 'true')
            ),
            centerTitle: Boolean(
                settings.related?.centerTitle ??
                (host?.dataset.velouraRelatedCenterTitle === 'true')
            ),
        };

        if (section) {
            section.classList.toggle('is-title-centered', config.centerTitle);
            section.classList.toggle('is-arrows-hidden', config.hideArrows);

            const heading = section.querySelector('.veloura-product-related-heading');
            const title = section.querySelector('.veloura-product-related-title');

            [heading, title].filter(Boolean).forEach((element) => {
                if (config.centerTitle) {
                    element.style.setProperty('width', '100%', 'important');
                    element.style.setProperty('text-align', 'center', 'important');
                    element.style.setProperty('justify-content', 'center', 'important');
                    element.style.setProperty('margin-inline', 'auto', 'important');
                } else {
                    element.style.removeProperty('width');
                    element.style.removeProperty('text-align');
                    element.style.removeProperty('justify-content');
                    element.style.removeProperty('margin-inline');
                }
            });
        }

        if (!host) return;

        /*
         * salla-products-slider has a real sliderConfig property and forwards it
         * to its internal salla-slider. Assign the PROPERTY, not only an HTML
         * attribute, so Stencil receives a real object instead of a JSON string.
         */
        const sliderConfig = {
            slidesPerView: config.mobileColumns,
            slidesPerGroup: 1,
            spaceBetween: 12,
            centeredSlides: false,
            centerInsufficientSlides: false,
            watchOverflow: true,
            allowTouchMove: true,
            simulateTouch: true,
            grabCursor: true,
            breakpoints: {
                768: {
                    slidesPerView: config.desktopColumns,
                    slidesPerGroup: 1,
                    spaceBetween: 16,
                },
            },
        };

        const assignHostConfig = () => {
            try {
                host.sliderConfig = sliderConfig;
            } catch (_) {}

            /* Keep a readable copy in DevTools as well. */
            host.setAttribute('slider-config', JSON.stringify(sliderConfig));
            host.dataset.velouraV98ConfigApplied = 'true';
            host.dataset.velouraV98Mobile = String(config.mobileColumns);
            host.dataset.velouraV98Desktop = String(config.desktopColumns);
        };

        const applyInnerSlider = () => {
            const inner = host.querySelector('salla-slider.s-products-slider-slider') ||
                host.querySelector('salla-slider');

            if (!inner) return false;

            try { inner.sliderConfig = sliderConfig; } catch (_) {}
            inner.setAttribute('slider-config', JSON.stringify(sliderConfig));

            try { inner.showControls = !config.hideArrows; } catch (_) {}
            inner.setAttribute('show-controls', config.hideArrows ? 'false' : 'true');

            const swiper = inner.swiper || inner.slider || inner.swiperInstance;
            if (swiper?.params) {
                swiper.params.slidesPerView = window.matchMedia('(min-width: 768px)').matches
                    ? config.desktopColumns
                    : config.mobileColumns;
                swiper.params.slidesPerGroup = 1;
                swiper.params.spaceBetween = window.matchMedia('(min-width: 768px)').matches ? 16 : 12;
                swiper.params.breakpoints = sliderConfig.breakpoints;

                if (swiper.originalParams) {
                    swiper.originalParams.slidesPerView = config.mobileColumns;
                    swiper.originalParams.slidesPerGroup = 1;
                    swiper.originalParams.spaceBetween = 12;
                    swiper.originalParams.breakpoints = sliderConfig.breakpoints;
                }

                try { swiper.setBreakpoint?.(); } catch (_) {}
                try { swiper.update?.(); } catch (_) {}
            }

            inner.dataset.velouraV98Applied = 'true';
            return true;
        };

        assignHostConfig();
        applyInnerSlider();

        if (typeof host.componentOnReady === 'function') {
            Promise.resolve(host.componentOnReady())
                .then(() => {
                    assignHostConfig();
                    applyInnerSlider();
                })
                .catch(() => {});
        }

        /* The products component creates its inner salla-slider after fetching
           products. Observe only until that native slider appears, then stop. */
        const observer = new MutationObserver(() => {
            if (applyInnerSlider()) {
                observer.disconnect();
            }
        });
        observer.observe(host, { childList: true, subtree: true });

        [50, 180, 450, 900].forEach((delay) => {
            window.setTimeout(() => {
                assignHostConfig();
                applyInnerSlider();
            }, delay);
        });

        window.addEventListener('resize', () => {
            window.requestAnimationFrame(applyInnerSlider);
        }, { passive: true });

        /* Keep the existing recently-viewed behavior independent from the
           related-products slider. */
        const recent = settings.recent || {};
        const recentHide = Boolean(recent.hide);
        const recentCustomize = Boolean(recent.customize);
        const recentCenterTitle = Boolean(recent.centerTitle);
        const recentMobile = clamp(recent.mobileColumns, 1, 3, 2);
        const recentDesktop = clamp(recent.desktopColumns, 1, 6, 4);

        const isRecent = (node) => {
            if (!node) return false;
            const haystack = `${node.id || ''} ${node.className || ''} ${node.getAttribute?.('block-title') || ''}`.toLowerCase();
            return /recent|recently|viewed|شاهد/.test(haystack);
        };

        document.querySelectorAll('salla-products-slider,salla-products-list').forEach((recentHost) => {
            if (recentHost === host || !isRecent(recentHost) && !isRecent(recentHost.parentElement)) return;

            const recentSection = recentHost.closest('section,.container,[class*="recent"],[class*="slider"]') || recentHost.parentElement;
            if (recentHide && recentSection) {
                recentSection.style.setProperty('display', 'none', 'important');
                return;
            }

            if (recentCenterTitle && recentSection) {
                recentSection.querySelectorAll('h2,h3,.s-slider-block__title').forEach((title) => {
                    title.style.setProperty('text-align', 'center', 'important');
                    title.style.setProperty('justify-content', 'center', 'important');
                });
            }

            if (recentCustomize && recentHost.tagName === 'SALLA-PRODUCTS-SLIDER') {
                const recentConfig = {
                    slidesPerView: recentMobile,
                    spaceBetween: 12,
                    breakpoints: {
                        768: { slidesPerView: recentDesktop, spaceBetween: 16 },
                    },
                };
                try { recentHost.sliderConfig = recentConfig; } catch (_) {}
                recentHost.setAttribute('slider-config', JSON.stringify(recentConfig));
            }
        });
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
        if (!page) return;

        /*
         * V98: leave Salla's native salla-add-product-button completely in
         * charge of Add to cart / Buy now behavior. Previous versions changed
         * its rendered children, forced hidden quick-buy nodes visible and
         * repeatedly rewrote its internal layout. That can desynchronize the
         * component from its own state after product-option changes.
         */
        page.querySelectorAll('salla-add-product-button.sticky-product-bar__btn')
            .forEach((button) => {
                button.dataset.velouraPurchaseMode = 'native-v98';
                button.style.setProperty('width', '100%', 'important');
                button.style.setProperty('min-width', '0', 'important');
                button.style.removeProperty('overflow');

                /* Do not touch shadow/light children, hidden state, click
                   handlers, quick-buy widget, or native component props. */
            });
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
