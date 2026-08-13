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

        const nodes = Array.from(main.children).filter((node) => {
            if (!(node instanceof HTMLElement)) return false;
            const group = node.getAttribute('data-v42-group');
            return Boolean(group && attributes[group]);
        });

        if (!nodes.length) {
            return;
        }

        const enabled = page.getAttribute('data-v42-order-enabled') === 'true';

        const readOrder = (group) => {
            const value = Number(page.getAttribute(attributes[group]));
            if (!Number.isFinite(value)) return 10;
            return Math.max(1, Math.min(10, Math.round(value)));
        };

        /*
         * V99:
         * Never move the product form or any Salla Web Component in the DOM.
         * Detaching/re-attaching salla-product-options / salla-add-product-button
         * can re-run component lifecycle and desynchronize native cart/quick-buy
         * state. .main-content is a flex column, so CSS order is sufficient.
         */
        nodes.forEach((node, index) => {
            if (!node.hasAttribute('data-v42-original-index')) {
                node.setAttribute('data-v42-original-index', String(index));
            }

            if (enabled) {
                const group = node.getAttribute('data-v42-group');
                node.style.setProperty('order', String(readOrder(group)), 'important');
            } else {
                node.style.removeProperty('order');
            }
        });

        main.classList.toggle('veloura-details-order-enabled', enabled);
        page.dataset.velouraOrderApplied = enabled ? 'css-v99' : 'native';
    }

    initVelouraProductSliders() {
        const page = document.querySelector('.veloura-product-page');
        if (!page) return;

        const settings = window.velouraProductSliderSettings || {};

        const clamp = (value, min, max, fallback) => {
            const number = Number(value);
            if (!Number.isFinite(number)) return fallback;
            return Math.max(min, Math.min(max, Math.round(number)));
        };

        /* ==========================================================
         * Related products — V99 controlled slider
         * ========================================================== */
        const section = document.querySelector('[data-veloura-related-controller]');
        const slider = section?.querySelector('salla-slider[data-veloura-related-slider]');
        const items = slider?.querySelector('[data-veloura-related-items]');

        if (section && slider && items) {
            const mobileColumns = clamp(
                section.dataset.velouraRelatedMobile ??
                settings.related?.mobileColumns,
                1,
                3,
                2
            );

            const desktopColumns = clamp(
                section.dataset.velouraRelatedDesktop ??
                settings.related?.desktopColumns,
                1,
                6,
                4
            );

            const hideArrows =
                section.dataset.velouraRelatedHideArrows === 'true' ||
                settings.related?.hideArrows === true;

            const centerTitle =
                section.dataset.velouraRelatedCenterTitle === 'true' ||
                settings.related?.centerTitle === true;

            section.classList.toggle('is-title-centered', centerTitle);
            section.classList.toggle('is-arrows-hidden', hideArrows);

            const sliderConfig = {
                slidesPerView: mobileColumns,
                slidesPerGroup: 1,
                spaceBetween: 12,
                watchOverflow: true,
                allowTouchMove: true,
                simulateTouch: true,
                grabCursor: true,
                breakpoints: {
                    768: {
                        slidesPerView: desktopColumns,
                        slidesPerGroup: 1,
                        spaceBetween: 16,
                    },
                },
            };

            const applySliderConfig = async () => {
                try {
                    slider.sliderConfig = sliderConfig;
                    slider.slidesPerView = String(mobileColumns);
                    slider.showControls = !hideArrows;
                } catch (_) {}

                slider.setAttribute('slider-config', JSON.stringify(sliderConfig));
                slider.setAttribute('slides-per-view', String(mobileColumns));
                slider.setAttribute('show-controls', hideArrows ? 'false' : 'true');

                try {
                    if (typeof slider.componentOnReady === 'function') {
                        await slider.componentOnReady();
                    }
                } catch (_) {}

                try {
                    if (typeof slider.update === 'function') {
                        await slider.update();
                    }
                } catch (_) {}
            };

            const parseSourceValue = () => {
                const source = String(section.dataset.velouraRelatedSource || 'related').trim();
                const raw = String(section.dataset.velouraRelatedSourceValue || '').trim();

                if (['selected', 'categories', 'brands', 'tags'].includes(source)) {
                    try {
                        const parsed = JSON.parse(raw);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch (_) {
                        return raw
                            .split(',')
                            .map((value) => value.trim())
                            .filter(Boolean);
                    }
                }

                return raw;
            };

            const normalizeProducts = (response) => {
                const candidates = [
                    response?.data?.data,
                    response?.data?.products,
                    response?.data?.items,
                    response?.data,
                    response?.products,
                    response?.items,
                    response,
                ];

                for (const candidate of candidates) {
                    if (Array.isArray(candidate)) {
                        return candidate.filter(Boolean);
                    }
                }

                return [];
            };

            const fetchProducts = async (payload) => {
                if (!window.salla?.product) {
                    throw new Error('Salla product SDK is not ready');
                }

                const attempts = [];

                if (typeof salla.product.fetch === 'function') {
                    attempts.push(() => salla.product.fetch(payload));
                }

                if (typeof salla.product.api?.fetch === 'function') {
                    attempts.push(() => salla.product.api.fetch(payload));
                }

                if (!attempts.length) {
                    throw new Error('Salla product fetch API is unavailable');
                }

                let lastError = null;

                for (const attempt of attempts) {
                    try {
                        const response = await attempt();
                        const products = normalizeProducts(response);
                        if (products.length) return products;
                    } catch (error) {
                        lastError = error;
                    }
                }

                if (lastError) throw lastError;
                return [];
            };

            const createProductSlide = (product) => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide veloura-related-product-slide';

                const useCustomCard =
                    typeof window.customElements !== 'undefined' &&
                    Boolean(customElements.get('custom-salla-product-card'));

                const card = document.createElement(
                    useCustomCard ? 'custom-salla-product-card' : 'salla-product-card'
                );

                card.classList.add('veloura-related-product-card');

                const productJson = JSON.stringify(product);

                /*
                 * Salla's native product card accepts serialized product data.
                 * Theme custom cards usually receive the product object as a
                 * property, so set both forms before connecting the element.
                 */
                try {
                    card.product = useCustomCard ? product : productJson;
                } catch (_) {}

                try {
                    card.setAttribute('product', productJson);
                } catch (_) {}

                slide.appendChild(card);
                return slide;
            };

            const renderFallback = () => {
                const source = String(section.dataset.velouraRelatedSource || 'related');
                const sourceValue = String(section.dataset.velouraRelatedSourceValue || '');

                const fallback = document.createElement('salla-products-slider');
                fallback.setAttribute('source', source);
                fallback.setAttribute('source-value', sourceValue);
                fallback.setAttribute('product-card-component', 'custom-salla-product-card');
                fallback.setAttribute('data-veloura-related-native-fallback', 'true');

                slider.replaceWith(fallback);
                section.dataset.velouraRelatedState = 'native-fallback';
            };

            const loadRelated = async () => {
                if (section.dataset.velouraRelatedLoading === 'true' ||
                    section.dataset.velouraRelatedLoaded === 'true') {
                    return;
                }

                section.dataset.velouraRelatedLoading = 'true';
                await applySliderConfig();

                const source = String(section.dataset.velouraRelatedSource || 'related').trim();
                const sourceValue = parseSourceValue();

                const payload = {
                    source,
                    source_value: sourceValue,
                };

                try {
                    let products = await fetchProducts(payload);

                    const currentProductId = String(
                        section.dataset.velouraCurrentProductId || ''
                    ).replace(/\D/g, '');

                    if (source !== 'related' && currentProductId) {
                        products = products.filter((product) => {
                            const id = String(
                                product?.id ??
                                product?.product_id ??
                                ''
                            ).replace(/\D/g, '');

                            return !id || id !== currentProductId;
                        });
                    }

                    if (!products.length) {
                        section.hidden = true;
                        section.dataset.velouraRelatedState = 'empty';
                        return;
                    }

                    const fragment = document.createDocumentFragment();
                    products.forEach((product) => {
                        fragment.appendChild(createProductSlide(product));
                    });

                    items.replaceChildren(fragment);

                    section.hidden = false;
                    section.dataset.velouraRelatedLoaded = 'true';
                    section.dataset.velouraRelatedState = 'controlled-v99';
                    section.dataset.velouraRelatedCount = String(products.length);

                    await applySliderConfig();

                    /* Salla documents update() for custom DOM modifications. */
                    try {
                        await slider.updateSlides?.();
                        await slider.updateSlidesClasses?.();
                        await slider.update?.();
                    } catch (_) {}
                } catch (error) {
                    console.warn('[Veloura V99] Related products controlled slider failed; using native fallback.', error);
                    renderFallback();
                } finally {
                    section.dataset.velouraRelatedLoading = 'false';
                }
            };

            const start = () => {
                loadRelated().catch(() => renderFallback());
            };

            if (window.salla?.onReady) {
                salla.onReady(start);
            } else {
                start();
            }
        }

        /* ==========================================================
         * Recently viewed — keep existing independent behavior.
         * ========================================================== */
        const recent = settings.recent || {};
        const recentHide = Boolean(recent.hide);
        const recentCustomize = Boolean(recent.customize);
        const recentCenterTitle = Boolean(recent.centerTitle);
        const recentMobile = clamp(recent.mobileColumns, 1, 3, 2);
        const recentDesktop = clamp(recent.desktopColumns, 1, 6, 4);

        const isRecent = (node) => {
            if (!node) return false;

            const haystack = `${node.id || ''} ${node.className || ''} ${
                node.getAttribute?.('block-title') || ''
            }`.toLowerCase();

            return /recent|recently|viewed|شاهد/.test(haystack);
        };

        document.querySelectorAll('salla-products-slider,salla-products-list').forEach((recentHost) => {
            if (!isRecent(recentHost) && !isRecent(recentHost.parentElement)) return;

            const recentSection =
                recentHost.closest('section,.container,[class*="recent"],[class*="slider"]') ||
                recentHost.parentElement;

            if (recentHide && recentSection) {
                recentSection.style.setProperty('display', 'none', 'important');
                return;
            }

            if (recentCenterTitle && recentSection) {
                recentSection
                    .querySelectorAll('h2,h3,.s-slider-block__title')
                    .forEach((title) => {
                        title.style.setProperty('text-align', 'center', 'important');
                        title.style.setProperty('justify-content', 'center', 'important');
                    });
            }

            if (recentCustomize && recentHost.tagName === 'SALLA-PRODUCTS-SLIDER') {
                const recentConfig = {
                    slidesPerView: recentMobile,
                    spaceBetween: 12,
                    breakpoints: {
                        768: {
                            slidesPerView: recentDesktop,
                            spaceBetween: 16,
                        },
                    },
                };

                try {
                    recentHost.sliderConfig = recentConfig;
                } catch (_) {}

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
        const button = document.querySelector(
            '.veloura-product-page salla-add-product-button.sticky-product-bar__btn'
        );

        if (!button) return;

        /*
         * V99:
         * Salla owns Add to cart, Quick Buy / Buy now, validation and option
         * synchronization. Do not alter children, hidden state, display,
         * click handlers, or component properties here.
         */
        button.dataset.velouraPurchaseMode = 'native-v99';
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
