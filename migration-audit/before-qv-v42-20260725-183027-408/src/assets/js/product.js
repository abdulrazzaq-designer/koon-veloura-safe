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
        this.initVelouraCouponCopy();        this.initVelouraPurchaseButtons();
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
    }
    initVelouraProductThumbnails() {
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
        const component = document.querySelector(
            '.veloura-product-page salla-add-product-button.sticky-product-bar__btn'
        );

        if (!component) {
            return;
        }

        const normalize = () => {
            const main = component.querySelector('.s-add-product-button-main');

            if (!main) {
                return;
            }

            main.style.setProperty('display', 'flex', 'important');
            main.style.setProperty('width', '100%', 'important');
            main.style.setProperty('gap', '12px', 'important');
            main.style.setProperty('direction', 'rtl', 'important');

            Array.from(main.children).forEach((child) => {
                child.style.setProperty('flex', '1 1 0', 'important');
                child.style.setProperty('width', '0', 'important');
                child.style.setProperty('min-width', '0', 'important');
                child.style.setProperty('max-width', 'none', 'important');
            });

            component.querySelectorAll('salla-mini-checkout-widget').forEach((widget) => {
                widget.style.setProperty('--salla-fast-checkout-button-height', '46px');
                widget.style.setProperty('--salla-fast-checkout-button-width', '100%');
                widget.style.setProperty('--salla-fast-checkout-button-border-radius', '9999px');
            });
        };

        normalize();

        const observer = new MutationObserver(normalize);
        observer.observe(component, { childList: true, subtree: true });

        window.setTimeout(normalize, 250);
        window.setTimeout(normalize, 800);
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
