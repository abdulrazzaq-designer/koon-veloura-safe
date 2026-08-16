import BasePage from './base-page';
import MobileMenu from 'mmenu-light';

class Products extends BasePage {
    onReady() {
        const productsList = app.element('salla-products-list');
        const productFilter = app.element('#product-filter');
        const urlParams = new URLSearchParams(window.location.search);

        if (productFilter && urlParams.has('sort')) {
            productFilter.value = urlParams.get('sort');
        }

        if (productFilter && productsList) {
            app.on('change', '#product-filter', async event => {
                window.history.replaceState(
                    null,
                    null,
                    salla.helpers.addParamToUrl('sort', event.currentTarget.value)
                );

                productsList.sortBy = event.currentTarget.value;
                await productsList.reload();
                productsList.setAttribute(
                    'filters',
                    `{"sort": "${event.currentTarget.value}"}`
                );
            });
        }

        this.initVelouraCategoryPage(productsList);
        this.initiateMobileMenu();
    }

    initVelouraCategoryPage(productsList) {
        const page = document.querySelector('.veloura-category-page');

        if (!page) {
            return;
        }

        const settings = window.velouraCategoryPageSettings || {};
        const title = document.querySelector('#page-main-title');

        const syncTitle = response => {
            if (!title) {
                return;
            }

            if (settings.hideProductCount && settings.categoryTitle) {
                title.textContent = settings.categoryTitle;
                return;
            }

            if (response?.title) {
                title.innerHTML = response.title;
            }
        };

        if (settings.hideProductCount && settings.categoryTitle) {
            syncTitle();
        }

        if (productsList && window.salla?.event?.on) {
            salla.event.on('salla-products-list::products.fetched', syncTitle);
        }

        this.applyVelouraCategoryMappedImages(page, settings);
        this.initVelouraCategorySticky(page, settings);
        this.initVelouraCategoryInlineSwitch(page, productsList, settings);
    }

    initVelouraCategorySticky(page, settings) {
        const rail = page.querySelector('[data-veloura-category-children]');

        if (!rail) {
            return;
        }

        if (!settings.stickyChildren) {
            rail.classList.remove('veloura-category-children--sticky');
            page.style.removeProperty('--vcat-sticky-top');
            page.style.removeProperty('--vcat-sticky-height');
            return;
        }

        rail.classList.add('veloura-category-children--sticky');

        const header =
            document.querySelector('[data-veloura-header-tabs-stack]') ||
            document.querySelector('header');

        let frame = 0;

        const update = () => {
            frame = 0;

            let top = 0;

            if (header) {
                const rect = header.getBoundingClientRect();

                if (rect.bottom > 0) {
                    top = Math.max(0, rect.bottom);
                }
            }

            page.style.setProperty(
                '--vcat-sticky-top',
                `${Math.ceil(top + 8)}px`
            );

            page.style.setProperty(
                '--vcat-sticky-height',
                `${Math.ceil(rail.getBoundingClientRect().height)}px`
            );
        };

        const schedule = () => {
            if (frame) {
                return;
            }

            frame = requestAnimationFrame(update);
        };

        update();

        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('scroll', schedule, { passive: true });

        if (window.ResizeObserver) {
            const observer = new ResizeObserver(schedule);

            observer.observe(rail);

            if (header) {
                observer.observe(header);
            }

            rail.__velouraCategoryStickyObserver = observer;
        }
    }

    initVelouraCategoryInlineSwitch(page, productsList, settings) {
        if (!settings.inlineSwitch || !productsList) {
            return;
        }

        const rail = page.querySelector('[data-veloura-category-children]');
        const title = page.querySelector('#page-main-title');
        const filters = page.querySelector('#filters-menu');

        if (!rail) {
            return;
        }

        const items = Array.from(
            rail.querySelectorAll('[data-veloura-category-switch]')
        );

        if (!items.length) {
            return;
        }

        const root = settings.rootCategory || {
            id: rail.dataset.rootCategoryId,
            name: rail.dataset.rootCategoryName,
            url: rail.dataset.rootCategoryUrl,
        };

        let loading = false;
        let activeTitle = settings.categoryTitle || root.name || '';

        const itemById = id => {
            return items.find(item => {
                return String(item.dataset.categoryId || '') === String(id || '');
            }) || null;
        };

        const setActive = item => {
            items.forEach(candidate => {
                const active = candidate === item;

                candidate.classList.toggle('is-active', active);

                if (active) {
                    candidate.setAttribute('aria-current', 'page');
                } else {
                    candidate.removeAttribute('aria-current');
                }
            });
        };

        const setVisibleTitle = name => {
            activeTitle = name || root.name || activeTitle;

            if (title && activeTitle) {
                title.textContent = activeTitle;
            }
        };

        const updateUrl = (id, push) => {
            const url = new URL(window.location.href);
            const isRoot = String(id || '') === String(root.id || '');

            if (isRoot) {
                url.searchParams.delete('vcat');
            } else {
                url.searchParams.set('vcat', String(id));
            }

            const method = push ? 'pushState' : 'replaceState';

            window.history[method](
                { velouraCategoryId: String(id || '') },
                '',
                `${url.pathname}${url.search}${url.hash}`
            );
        };

        const waitForComponent = async component => {
            if (
                component &&
                typeof component.componentOnReady === 'function'
            ) {
                try {
                    await component.componentOnReady();
                } catch (_) {}
            }
        };

        const switchTo = async (item, { push = true } = {}) => {
            if (!item || loading) {
                return;
            }

            const id = item.dataset.categoryId;
            const name = item.dataset.categoryName || root.name || '';

            if (!id) {
                return;
            }

            loading = true;
            rail.classList.add('is-loading');
            rail.setAttribute('aria-busy', 'true');

            setActive(item);
            setVisibleTitle(name);

            if (push) {
                updateUrl(id, true);
            }

            try {
                await waitForComponent(productsList);

                productsList.source = 'categories';
                productsList.sourceValue = String(id);

                productsList.setAttribute('source', 'categories');
                productsList.setAttribute('source-value', String(id));

                if (typeof productsList.setFilters === 'function') {
                    try {
                        await productsList.setFilters({});
                    } catch (_) {}
                }

                if (
                    filters &&
                    typeof filters.resetFilters === 'function'
                ) {
                    try {
                        await filters.resetFilters();
                    } catch (_) {}
                }

                if (typeof productsList.reload === 'function') {
                    await productsList.reload();
                }

                page.dataset.velouraActiveCategoryId = String(id);
                page.dataset.velouraActiveCategoryName = name;

                if (settings.hideProductCount) {
                    setVisibleTitle(name);
                }
            } finally {
                loading = false;
                rail.classList.remove('is-loading');
                rail.removeAttribute('aria-busy');
            }
        };

        rail.addEventListener('click', event => {
            const link = event.target.closest(
                '[data-veloura-category-switch]'
            );

            if (!link || !rail.contains(link)) {
                return;
            }

            event.preventDefault();

            switchTo(link, {
                push: true,
            });
        });

        const syncFromUrl = () => {
            const url = new URL(window.location.href);
            const id = url.searchParams.get('vcat') || root.id;
            const item = itemById(id) || itemById(root.id);

            if (item) {
                switchTo(item, { push: false });
            }
        };

        window.addEventListener('popstate', syncFromUrl);

        const initialId =
            new URL(window.location.href).searchParams.get('vcat');

        if (initialId && String(initialId) !== String(root.id || '')) {
            const initialItem = itemById(initialId);

            if (initialItem) {
                switchTo(initialItem, { push: false });
            }
        } else {
            const rootItem = itemById(root.id);

            if (rootItem) {
                setActive(rootItem);
            }
        }

        if (
            settings.hideProductCount &&
            window.salla?.event?.on
        ) {
            salla.event.on(
                'salla-products-list::products.fetched',
                () => setVisibleTitle(activeTitle)
            );
        }
    }

    applyVelouraCategoryMappedImages(page, settings) {
        if (!settings.useCustomImages) {
            return;
        }

        const map = this.normalizeVelouraCollection(settings.imagesMap);
        const cards = page.querySelectorAll('[data-veloura-category-child]');

        if (!map.length || !cards.length) {
            return;
        }

        map.forEach(item => {
            const image = this.extractVelouraImageUrl(
                item?.veloura_map_image ||
                item?.image ||
                item?.img ||
                item?.photo ||
                ''
            );

            const categoryTokens = this.collectVelouraTokens(
                item?.veloura_map_categories ||
                item?.categories ||
                item?.category ||
                item?.selected ||
                item?.value ||
                []
            );

            if (!image || !categoryTokens.length) {
                return;
            }

            cards.forEach(card => {
                const cardTokens = this.collectVelouraTokens([
                    card.dataset.categoryId,
                    card.dataset.categoryName,
                    card.dataset.categoryUrl,
                    card.dataset.categorySlug,
                    card.getAttribute('href')
                ]);

                if (!this.velouraTokensMatch(cardTokens, categoryTokens)) {
                    return;
                }

                const img = card.querySelector(
                    '[data-veloura-category-child-image]'
                );

                if (img) {
                    img.src = image;
                    img.dataset.velouraMappedImage = 'true';
                }
            });
        });
    }

    normalizeVelouraCollection(collection) {
        if (!collection) return [];
        if (Array.isArray(collection)) return collection;

        if (typeof collection === 'object') {
            if (Array.isArray(collection.selected)) return collection.selected;
            if (Array.isArray(collection.value)) return collection.value;
            if (Array.isArray(collection.items)) return collection.items;
            if (Array.isArray(collection.data)) return collection.data;

            return Object.keys(collection).map(key => collection[key]);
        }

        return [];
    }

    extractVelouraImageUrl(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;

        if (Array.isArray(value)) {
            for (const item of value) {
                const found = this.extractVelouraImageUrl(item);
                if (found) return found;
            }

            return '';
        }

        if (typeof value === 'object') {
            return this.extractVelouraImageUrl(
                value.url ||
                value.src ||
                value.path ||
                value.image ||
                value.cdn ||
                value.value ||
                ''
            );
        }

        return '';
    }

    normalizeVelouraToken(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/[?#].*$/, '')
            .replace(/\/+$/, '');
    }

    collectVelouraTokens(value, tokens = []) {
        const add = raw => {
            const token = this.normalizeVelouraToken(raw);

            if (token && !tokens.includes(token)) {
                tokens.push(token);
            }
        };

        if (value === null || value === undefined) {
            return tokens;
        }

        if (typeof value === 'string' || typeof value === 'number') {
            add(value);
            return tokens;
        }

        if (Array.isArray(value)) {
            value.forEach(item => this.collectVelouraTokens(item, tokens));
            return tokens;
        }

        if (typeof value === 'object') {
            [
                'label',
                'name',
                'title',
                'value',
                'id',
                'key',
                'url',
                'link',
                'slug',
                'selected',
                'items',
                'data'
            ].forEach(prop => {
                if (value[prop] !== undefined) {
                    this.collectVelouraTokens(value[prop], tokens);
                }
            });
        }

        return tokens;
    }

    velouraTokensMatch(leftTokens, rightTokens) {
        return rightTokens.some(right => {
            return leftTokens.some(left => {
                if (!left || !right) return false;
                if (left === right) return true;

                if (left.length >= 2 && right.length >= 2) {
                    return left.includes(right) || right.includes(left);
                }

                return false;
            });
        });
    }

    initiateMobileMenu() {
        let filters = app.element('#filters-menu');
        const trigger = app.element("a[href='#filters-menu']");
        const close = app.element('button.close-filters');

        if (!filters || !trigger || !close) {
            return;
        }

        filters = new MobileMenu(
            filters,
            '(max-width: 1024px)',
            '( slidingSubmenus: false)'
        );

        const drawer = filters.offcanvas({
            position: salla.config.get('theme.is_rtl') ? 'right' : 'left'
        });

        trigger.addEventListener('click', event => {
            document.body.classList.add('filters-opened');
            event.preventDefault();
            drawer.open();
        });

        close.addEventListener('click', event => {
            document.body.classList.remove('filters-opened');
            event.preventDefault();
            drawer.close();
        });

        salla.event.on('salla-filters::changed', filtersValue => {
            if (!Object.entries(filtersValue).length) {
                return;
            }

            document.body.classList.remove('filters-opened');
            drawer.close();
        });
    }
}

Products.initiateWhenReady([
    'product.index',
    'product.index.latest',
    'product.index.offers',
    'product.index.search',
    'product.index.tag',
]);
