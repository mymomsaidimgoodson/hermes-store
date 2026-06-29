let allProducts = []; 
let currentProducts = []; 
let itemsToShow = 6; 
let activeCategory = 'all'; 
let activeBrand = 'all'; 
let activeSubcategory = 'all'; 

// Загружаем Избранное из памяти браузера (или создаем пустой массив, если там ничего нет)
let wishlist = JSON.parse(localStorage.getItem('hermes_wishlist')) || [];

// Анимации
const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 }); 

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('opacity-0', 'transition-opacity', 'duration-1000');
    setTimeout(() => { document.body.classList.remove('opacity-0'); }, 50);

    loadData();

    // Мобильное меню
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-menu-close');
    if (mobileBtn && mobileMenu && mobileClose) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('flex');
            document.body.style.overflow = 'hidden';
        });
        mobileClose.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('flex');
            document.body.style.overflow = '';
        });
    }

    // Слушатель кликов для кнопок Избранного (Делегирование событий)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-btn');
        if (btn) {
            e.preventDefault(); // Предотвращаем переход по ссылке карточки
            toggleWishlist(btn);
        }
    });
});

async function loadData() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Не удалось найти products.json');
        allProducts = await response.json();
        currentProducts = [...allProducts]; 
        
        // Безопасная инициализация
        const catalogGrid = document.getElementById('catalog-grid');
        if (catalogGrid) {
            renderCatalog(currentProducts, catalogGrid);
            initSort(); 
            initLoadMore(); 
            initCategoryFilters(); 
        }
        
        if (document.getElementById('product-container')) {
            renderProductPage(allProducts);
        }
        
        if (document.getElementById('bestsellers-grid')) {
            renderBestsellers(allProducts, document.getElementById('bestsellers-grid'));
        }

        // Инициализируем Избранное, если мы на странице wishlist.html
        if (document.getElementById('wishlist-grid')) {
            renderWishlist();
        }
        
        initSearch();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

// --- ЛОГИКА ИЗБРАННОГО ---
function toggleWishlist(btn) {
    const id = btn.dataset.id;
    const icon = btn.querySelector('i');

    if (wishlist.includes(id)) {
        // Удаляем из Избранного
        wishlist = wishlist.filter(itemId => itemId !== id);
        icon.classList.remove('fa-solid', 'text-[#D4B88A]');
        icon.classList.add('fa-regular', 'text-gray-400');
    } else {
        // Добавляем в Избранное
        wishlist.push(id);
        icon.classList.remove('fa-regular', 'text-gray-400');
        icon.classList.add('fa-solid', 'text-[#D4B88A]');
    }

    // Сохраняем обновленный список в память браузера
    localStorage.setItem('hermes_wishlist', JSON.stringify(wishlist));

    // Если мы прямо сейчас на странице Избранного — обновляем витрину
    if (document.getElementById('wishlist-grid')) {
        renderWishlist();
    }
}

function renderWishlist() {
    const container = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('empty-wishlist');
    if (!container || !emptyState) return;

    container.innerHTML = '';
    
    // Оставляем только те товары, ID которых есть в нашем массиве wishlist
    const likedProducts = allProducts.filter(p => wishlist.includes(p.id));

    if (likedProducts.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        container.classList.remove('hidden');
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        likedProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-1000 ease-out';
            card.innerHTML = createCardHtml(product);
            container.appendChild(card);
            scrollObserver.observe(card);
        });
    }
}

// Универсальный шаблон карточки с кнопкой лайка
function createCardHtml(product) {
    const badgeHtml = product.isNew ? `<span class="absolute top-4 left-4 z-10 text-[10px] tracking-widest text-[#D4B88A] uppercase">New</span>` : '';
    const shortSpec = (product.specs && Object.keys(product.specs).length > 0) ? Object.values(product.specs)[0] : '';
    const image0 = product.images && product.images[0] ? product.images[0] : '';
    const image1 = product.images && product.images[1] ? product.images[1] : '';

    const hoverImageHtml = image1 ? `<img src="${image1}" alt="${product.name} detail" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-0 transition-opacity duration-700 group-hover:opacity-100">` : '';

    // Проверяем, есть ли этот товар в Избранном, чтобы закрасить сердечко
    const isLiked = wishlist.includes(product.id);
    const heartClass = isLiked ? 'fa-solid text-[#D4B88A]' : 'fa-regular text-gray-400 hover:text-[#D4B88A]';

    return `
        ${badgeHtml}
        <button class="wishlist-btn absolute top-4 right-4 z-20 text-xl transition-colors" data-id="${product.id}">
            <i class="${heartClass} fa-heart"></i>
        </button>
        <a href="product.html?id=${product.id}" class="block relative w-full aspect-square mb-6 overflow-hidden bg-white/30 cursor-pointer shrink-0">
            <img src="${image0}" alt="${product.name}" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-opacity duration-700 ${image1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}">
            ${hoverImageHtml}
        </a>
        <div class="flex flex-col flex-grow px-4">
            <a href="product.html?id=${product.id}" class="cursor-pointer block">
                <h3 class="font-light text-lg tracking-wide hover:text-[#D4B88A] transition-colors leading-tight">${product.name}</h3>
            </a>
            <div class="mt-auto">
                <p class="text-gray-400 text-[13px] mt-2 mb-2 font-light">${shortSpec}</p>
                <p class="text-[#1C1C1C]">${product.price}</p>
            </div>
        </div>
    `;
}

function renderCatalog(products, container) {
    if (!container) return;
    container.innerHTML = '';
    const visibleProducts = products.slice(0, itemsToShow);

    if (visibleProducts.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">В этой категории пока нет товаров</div>';
    } else {
        visibleProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-1000 ease-out';
            card.innerHTML = createCardHtml(product);
            container.appendChild(card);
            scrollObserver.observe(card);
        });
    }

    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (itemsToShow >= products.length) {
            loadMoreContainer.classList.add('hidden');
        } else {
            loadMoreContainer.classList.remove('hidden');
        }
    }
}

// --- ЛОГИКА ФИЛЬТРОВ (Категория -> Бренд -> Модель) ---
function formatSubcategoryName(str) {
    const mapping = {
        "iphone-15-pro": "iPhone 15 Pro",
        "charging-station": "Зарядные станции",
        "smartphones": "Смартфоны"
    };
    return mapping[str] || str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function initCategoryFilters() {
    const categoryLinks = document.querySelectorAll('.category-filter, .category-link');
    const catalogGrid = document.getElementById('catalog-grid');
    const brandContainer = document.getElementById('brand-container');
    const brandList = document.getElementById('brand-list');
    const subcategoryContainer = document.getElementById('subcategory-container');
    const subcategoryList = document.getElementById('subcategory-list');

    if (!catalogGrid) return; 

    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target.dataset.category) return; 
            
            if (window.location.pathname.includes('catalog.html')) {
                e.preventDefault();
                
                activeCategory = target.dataset.category;
                activeBrand = 'all'; 
                activeSubcategory = 'all'; 
                
                document.querySelectorAll('.category-filter').forEach(el => {
                    el.classList.remove('text-[#1C1C1C]', 'font-medium');
                    el.classList.add('text-gray-600', 'hover:text-[#1C1C1C]');
                });
                if (target.classList.contains('category-filter')) {
                    target.classList.remove('text-gray-600', 'hover:text-[#1C1C1C]');
                    target.classList.add('text-[#1C1C1C]', 'font-medium');
                }

                if (activeCategory === 'all') {
                    if(brandContainer) brandContainer.classList.add('hidden');
                    if(subcategoryContainer) subcategoryContainer.classList.add('hidden');
                } else {
                    const categoryProducts = allProducts.filter(p => p.category === activeCategory);
                    renderBrands(categoryProducts, brandContainer, brandList, subcategoryContainer, subcategoryList, catalogGrid);
                    if(subcategoryContainer) subcategoryContainer.classList.add('hidden');
                }

                applyAllFiltersAndRender(catalogGrid);
            }
        });
    });
}

function renderBrands(products, container, list, subContainer, subList, grid) {
    if (!container || !list) return;
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

    if (brands.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = `<li><a href="#" class="text-[#1C1C1C] font-medium flex justify-between brand-filter" data-brand="all">Все бренды</a></li>`;

    brands.forEach(brand => {
        list.innerHTML += `<li><a href="#" class="text-gray-600 hover:text-[#1C1C1C] transition flex justify-between brand-filter" data-brand="${brand}">${brand}</a></li>`;
    });

    const brandLinks = list.querySelectorAll('.brand-filter');
    brandLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activeBrand = e.target.closest('a').dataset.brand;
            activeSubcategory = 'all'; 

            brandLinks.forEach(el => {
                el.classList.remove('text-[#1C1C1C]', 'font-medium');
                el.classList.add('text-gray-600', 'hover:text-[#1C1C1C]');
            });
            e.target.closest('a').classList.remove('text-gray-600', 'hover:text-[#1C1C1C]');
            e.target.closest('a').classList.add('text-[#1C1C1C]', 'font-medium');

            if (activeBrand === 'all') {
                if(subContainer) subContainer.classList.add('hidden');
            } else {
                const brandProducts = allProducts.filter(p => p.category === activeCategory && p.brand === activeBrand);
                renderSubcategories(brandProducts, subContainer, subList, grid);
            }

            applyAllFiltersAndRender(grid);
        });
    });
}

function renderSubcategories(products, container, list, grid) {
    if (!container || !list) return;
    const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];

    if (subcategories.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    list.innerHTML = `<li><a href="#" class="text-[#1C1C1C] font-medium flex justify-between subcategory-filter" data-subcategory="all">Все модели</a></li>`;

    subcategories.forEach(sub => {
        const formattedName = formatSubcategoryName(sub);
        list.innerHTML += `<li><a href="#" class="text-gray-600 hover:text-[#1C1C1C] transition flex justify-between subcategory-filter" data-subcategory="${sub}">${formattedName}</a></li>`;
    });

    const subLinks = list.querySelectorAll('.subcategory-filter');
    subLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activeSubcategory = e.target.closest('a').dataset.subcategory;

            subLinks.forEach(el => {
                el.classList.remove('text-[#1C1C1C]', 'font-medium');
                el.classList.add('text-gray-600', 'hover:text-[#1C1C1C]');
            });
            e.target.closest('a').classList.remove('text-gray-600', 'hover:text-[#1C1C1C]');
            e.target.closest('a').classList.add('text-[#1C1C1C]', 'font-medium');

            applyAllFiltersAndRender(grid);
        });
    });
}

function applyAllFiltersAndRender(grid) {
    let filtered = [...allProducts];
    if (activeCategory !== 'all') filtered = filtered.filter(p => p.category === activeCategory);
    if (activeBrand !== 'all') filtered = filtered.filter(p => p.brand === activeBrand);
    if (activeSubcategory !== 'all') filtered = filtered.filter(p => p.subcategory === activeSubcategory);

    currentProducts = filtered;
    itemsToShow = 6;
    applySortAndRender(grid);
}

function applySortAndRender(grid) {
    const sortSelect = document.getElementById('sort-select');
    let productsToSort = [...currentProducts];

    if (sortSelect) {
        const sortType = sortSelect.value;
        if (sortType === 'new') {
            productsToSort.sort((a, b) => (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1);
        } else if (sortType === 'cheap') {
            productsToSort.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        } else if (sortType === 'expensive') {
            productsToSort.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        }
    }
    renderCatalog(productsToSort, grid);
}

function initLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    const catalogGrid = document.getElementById('catalog-grid');
    if (loadMoreBtn && catalogGrid) {
        loadMoreBtn.addEventListener('click', () => {
            itemsToShow += 6; 
            applySortAndRender(catalogGrid); 
        });
    }
}

function initSort() {
    const sortSelect = document.getElementById('sort-select');
    const catalogGrid = document.getElementById('catalog-grid');
    if (sortSelect && catalogGrid) {
        sortSelect.addEventListener('change', () => {
            itemsToShow = 6; 
            applySortAndRender(catalogGrid);
        });
    }
}

function parsePrice(priceString) {
    return parseInt(priceString.replace(/\D/g, ''), 10);
}

function renderBestsellers(products, container) {
    if (!container) return;
    container.innerHTML = '';
    const bestsellers = products.filter(p => p.isBestseller).slice(0, 4);
    bestsellers.forEach(product => {
        const card = document.createElement('div');
        card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-1000 ease-out';
        card.innerHTML = createCardHtml(product);
        container.appendChild(card);
        scrollObserver.observe(card); 
    });
}

function renderProductPage(products) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const product = products.find(p => p.id === productId);

    const container = document.getElementById('product-container');
    const errorMessage = document.getElementById('error-message');

    if (!product) {
        if(errorMessage) errorMessage.classList.remove('hidden');
        return;
    }

    document.title = `${product.name} — Hermes Store`;
    document.getElementById('breadcrumb-brand').textContent = product.brand;
    document.getElementById('breadcrumb-name').textContent = product.name;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-description').textContent = product.description;
    
    const avitoBtn = document.getElementById('avito-btn');
    if (avitoBtn) avitoBtn.href = product.avitoLink;

    if (product.isNew) {
        const badgeContainer = document.getElementById('product-badge-container');
        if (badgeContainer) badgeContainer.innerHTML = `<span class="absolute top-6 left-6 text-xs tracking-widest text-[#D4B88A] font-medium border border-[#D4B88A] px-2 py-1 z-10 bg-white/50 backdrop-blur-sm">NEW</span>`;
    }

    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = product.images && product.images[0] ? product.images[0] : '';
        mainImage.alt = product.name;
    }

    const thumbnailsContainer = document.getElementById('thumbnails-container');
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        if (product.images && product.images.length > 1) {
            for (let i = 1; i < product.images.length; i++) {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = 'bg-white p-4 aspect-square flex items-center justify-center cursor-pointer hover:opacity-80 transition';
                thumbDiv.innerHTML = `<img src="${product.images[i]}" alt="${product.name} detail ${i}" class="w-full h-full object-contain mix-blend-multiply">`;
                
                thumbDiv.addEventListener('click', () => {
                    const currentMainSrc = mainImage.src;
                    mainImage.src = product.images[i];
                    thumbDiv.querySelector('img').src = currentMainSrc;
                    product.images[0] = mainImage.src;
                    product.images[i] = currentMainSrc;
                });
                thumbnailsContainer.appendChild(thumbDiv);
            }
        }
    }

    const specsContainer = document.getElementById('specs-container');
    if (specsContainer) {
        specsContainer.innerHTML = '';
        if (product.specs) {
            for (const [key, value] of Object.entries(product.specs)) {
                specsContainer.innerHTML += `
                    <div class="flex justify-between border-b border-[#EDE9E0] pb-2 last:border-0 last:pb-0">
                        <span class="text-gray-400">${key}</span>
                        <span class="text-[#1C1C1C] text-right font-medium">${value}</span>
                    </div>
                `;
            }
        }
    }

    if(container) container.classList.remove('hidden');

    const similarGrid = document.getElementById('similar-products-grid');
    if (similarGrid) {
        similarGrid.innerHTML = '';
        let similarProducts = products.filter(p => p.category === product.category && p.id !== product.id);
        if (similarProducts.length < 4) {
            const others = products.filter(p => p.category !== product.category && p.id !== product.id);
            similarProducts = [...similarProducts, ...others];
        }
        similarProducts.slice(0, 4).forEach(p => {
            const card = document.createElement('div');
            card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-1000 ease-out';
            card.innerHTML = createCardHtml(p);
            similarGrid.appendChild(card);
            scrollObserver.observe(card);
        });
    }
}

function initSearch() {
    const searchIcons = document.querySelectorAll('.fa-magnifying-glass');
    const searchModal = document.getElementById('search-modal');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchModal || !searchInput) return;

    // ИСПРАВЛЕНИЕ: Теперь клик слушает саму иконку, а не весь родительский блок
    searchIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            searchModal.classList.remove('hidden');
            searchModal.classList.add('flex');
            document.body.style.overflow = 'hidden'; 
            setTimeout(() => searchInput.focus(), 100); 
        });
    });

    searchClose.addEventListener('click', () => {
        searchModal.classList.add('hidden');
        searchModal.classList.remove('flex');
        document.body.style.overflow = ''; 
        searchInput.value = ''; 
        searchResults.innerHTML = ''; 
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = ''; 

        if (query.length === 0) return;

        const filtered = allProducts.filter(product => 
            product.name.toLowerCase().includes(query) || 
            product.brand.toLowerCase().includes(query) ||
            (product.category && product.category.toLowerCase().includes(query)) ||
            (product.subcategory && product.subcategory.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            searchResults.innerHTML = '<div class="col-span-full text-center text-gray-400 text-lg mt-10">По вашему запросу ничего не найдено</div>';
            return;
        }

        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-700 ease-out';
            card.innerHTML = createCardHtml(product);
            
            card.addEventListener('click', () => {
                document.body.style.overflow = '';
            });
            
            searchResults.appendChild(card);
            setTimeout(() => {
                card.classList.remove('opacity-0', 'translate-y-8');
                card.classList.add('opacity-100', 'translate-y-0');
            }, 50);
        });
    });
}
// Обработка клика по категориям в шапке (с защитой от бесконечного цикла)
document.addEventListener('click', (e) => {
    // Используем closest, чтобы точно поймать клик, даже если нажали на текст внутри ссылки
    const link = e.target.closest('.category-link');
    
    if (link) {
        // ЗАЩИТА №1: Если это программный клик от нашего скрипта — игнорируем и рвем цикл!
        if (!e.isTrusted) return;

        // ЗАЩИТА №2: Если клиент уже в каталоге и кликает по левому сайдбару (<aside>), 
        // страницу не перезагружаем (пусть работают локальные фильтры)
        if (link.closest('aside')) return;

        e.preventDefault(); 
        const category = link.getAttribute('data-category');
        
        // Перенаправляем пользователя
        window.location.href = `catalog.html?category=${category}`;
    }
});
// Автоматическое применение фильтра из URL при открытии каталога
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('catalog-grid')) {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');
        
        if (categoryFromUrl) {
            // Запускаем таймер, который проверяет каждые 100мс, загрузилась ли база
            const waitForData = setInterval(() => {
                const targetBtn = document.querySelector(`aside a[data-category="${categoryFromUrl}"]`);
                const grid = document.getElementById('catalog-grid');
                
                // Если кнопка найдена и в сетке уже появились первые товары — база загружена!
                if (targetBtn && grid && grid.children.length > 0) {
                    clearInterval(waitForData); // Останавливаем таймер
                    targetBtn.click(); // Теперь безопасно кликаем
                }
            }, 100);
        }
    }
});
// Логика плавного скрытия прелоадера
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Даем пользователю полсекунды насладиться логотипом, затем плавно скрываем
        setTimeout(() => {
            preloader.style.opacity = '0';
            // Ждем завершения CSS-анимации (700мс) и полностью удаляем элемент из HTML
            setTimeout(() => {
                preloader.remove();
            }, 700);
        }, 500);
    }
});