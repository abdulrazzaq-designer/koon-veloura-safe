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
        this.initVelouraProductThumbnails();
        this.initProductOptionValidations();
        this.initVelouraCouponCopy();
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
        const component = page?.querySelector(
            'salla-add-product-button.sticky-product-bar__btn'
        );

        if (!page || !component) {
            return;
        }

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
                height: '46px'
            };
        };

        const ensureStyle = (root, id, css) => {
            if (!root?.querySelector || root.querySelector('#' + id)) {
                return;
            }

            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            root.appendChild(style);
        };

        const styleButtonRoot = (button, kind, tokens) => {
            if (!button) return;

            button.style.setProperty('width', '100%', 'important');
            button.style.setProperty('min-width', '0', 'important');
            button.style.setProperty('height', tokens.height, 'important');
            button.style.setProperty('min-height', tokens.height, 'important');
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

            ensureStyle(
                root,
                'veloura-product-purchase-button-style-2026',
                `
                  :host {
                    display: block !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    height: ${tokens.height} !important;
                    min-height: ${tokens.height} !important;
                    border-radius: ${tokens.radius} !important;
                    overflow: hidden !important;
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
                    align-items: center !important;
                    justify-content: center !important;
                    box-sizing: border-box !important;
                    border-radius: ${tokens.radius} !important;
                  }
                  ${kind === 'cart' ? `
                  button,
                  .s-button-element,
                  .s-button-btn,
                  [part~="button"] {
                    background: ${tokens.primary} !important;
                    background-color: ${tokens.primary} !important;
                    border-color: ${tokens.primary} !important;
                    color: ${tokens.primaryText} !important;
                  }
                  button *,
                  .s-button-element *,
                  .s-button-btn * {
                    color: ${tokens.primaryText} !important;
                    fill: ${tokens.primaryText} !important;
                    stroke: currentColor !important;
                  }
                  ` : ''}
                `
            );

            root.querySelectorAll('salla-button').forEach((inner) => {
                styleButtonRoot(inner, kind, tokens);
            });
        };

        const apply = (target = component) => {
            if (!target) return;

            const tokens = getTokens();
            const root = target.shadowRoot || target;
            const main = root.querySelector('.s-add-product-button-main');

            target.style.setProperty('display', 'block', 'important');
            target.style.setProperty('width', '100%', 'important');
            target.style.setProperty('min-width', '0', 'important');
            target.style.setProperty('border-radius', tokens.radius, 'important');

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

            if (children.length < 2) {
                main.style.setProperty('grid-template-columns', 'minmax(0, 1fr)', 'important');
            }

            children.forEach((child, index) => {
                child.style.setProperty('width', '100%', 'important');
                child.style.setProperty('min-width', '0', 'important');
                child.style.setProperty('max-width', '100%', 'important');
                child.style.setProperty('margin', '0', 'important');
                child.style.setProperty('opacity', '1', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                styleButtonRoot(child, index === 0 ? 'cart' : 'quick', tokens);
            });
        };

        const applyWhenReady = (target) => {
            apply(target);
            if (typeof target?.componentOnReady === 'function') {
                target.componentOnReady().then(() => apply(target)).catch(() => {});
            }
        };

        applyWhenReady(component);

        const registerHooks = () => {
            if (window.__velouraPurchaseButtonsHooked) return;
            const api = window.Salla || window.salla;
            if (!api?.hooks?.registerHook) return;

            window.__velouraPurchaseButtonsHooked = true;
            api.hooks.registerHook(
                'salla-add-product-button',
                'componentDidLoad',
                (target) => {
                    if (target.matches?.('.sticky-product-bar__btn')) {
                        applyWhenReady(target);
                    }
                }
            );
        };

        const api = window.Salla || window.salla;
        if (api?.onReady) {
            api.onReady(registerHooks);
        } else {
            registerHooks();
        }

        salla.product.event.onPriceUpdated(() => {
            window.requestAnimationFrame(() => apply(component));
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

    initVelouraCouponCopy() {
        document.querySelectorAll('.veloura-product-coupon__code').forEach(button => {
            if (button.dataset.velouraCouponReady === '1') {
                return;
            }

            button.dataset.velouraCouponReady = '1';

            button.addEventListener('click', async () => {
                const code =
                    button.getAttribute('data-code') ||
                    button.textContent.trim();

                if (!code) {
                    return;
                }

                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(code);
                    } else {
                        const input = document.createElement('input');
                        input.value = code;
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand('copy');
                        input.remove();
                    }

                    const oldText = button.textContent;
                    button.classList.add('is-copied');
                    button.textContent = 'تم النسخ';

                    setTimeout(() => {
                        button.textContent = oldText;
                        button.classList.remove('is-copied');
                    }, 1200);
                } catch (error) {
                    console.warn('Veloura coupon copy failed:', error);
                }
            });
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
