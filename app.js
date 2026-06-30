let allProducts = []; 
let currentProducts = []; 
let itemsToShow = 6; 

// --- НОВЫЕ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ УМНЫХ ФИЛЬТРОВ ---
let currentCategory = null; 
let currentSubcategory = null; 
let currentFilters = {}; 

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
            renderDynamicSidebar(); // Генерируем умный сайдбар
            applySortAndRender(catalogGrid); // Отрисовываем товары с учетом сортировки
            initSort(); 
            initLoadMore(); 
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

// --- УМНЫЙ ГЕНЕРАТОР САЙДБАРА ---
function renderDynamicSidebar() {
    const sidebar = document.getElementById('dynamic-sidebar');
    if (!sidebar) return; 

    let html = '';

    // 1. Генерируем ГЛАВНЫЕ КАТЕГОРИИ
    const categories = [...new Set(allProducts.map(p => p.category))].filter(Boolean);
    
    // Заголовок "КАТАЛОГ" убран отсюда, оставляем только контейнер для кнопок
    html += `<div class="mb-8">
                <div class="flex flex-col gap-3">`;
    categories.forEach(cat => {
        const isActive = cat === currentCategory ? 'font-bold text-[#1C1C1C]' : 'text-gray-500';
        html += `<button class="text-left hover:text-[#D4B88A] transition ${isActive}" onclick="setCategory('${cat}')">${cat}</button>`;
    });
    html += `</div></div>`;

    // 2. Генерируем ПОДКАТЕГОРИИ (Только если выбрана главная категория)
    // ... дальше твой старый код без изменений ...
    if (currentCategory) {
        const subcategories = [...new Set(allProducts.filter(p => p.category === currentCategory).map(p => p.subcategory))].filter(Boolean);
        if (subcategories.length > 0) {
            html += `<div class="mb-8">
                        <h3 class="text-sm text-gray-400 tracking-widest uppercase mb-4">ТИП / МОДЕЛЬ</h3>
                        <div class="flex flex-col gap-2">`;
            subcategories.forEach(sub => {
                const isActive = sub === currentSubcategory ? 'text-[#1C1C1C] font-medium' : 'text-gray-500';
                html += `<button class="text-left hover:text-[#D4B88A] transition text-sm ${isActive}" onclick="setSubcategory('${sub}')">${sub}</button>`;
            });
            html += `</div></div>`;
        }
    }

    // 3. Генерируем ЧЕКБОКСЫ ХАРАКТЕРИСТИК 
    let availableProducts = allProducts;
    if (currentCategory) availableProducts = availableProducts.filter(p => p.category === currentCategory);
    if (currentSubcategory) availableProducts = availableProducts.filter(p => p.subcategory === currentSubcategory);

    const availableFilters = {};
    availableProducts.forEach(p => {
        if (p.filters) {
            for (const [key, value] of Object.entries(p.filters)) {
                if (!availableFilters[key]) availableFilters[key] = new Set();
                availableFilters[key].add(value);
            }
        }
    });

    for (const [filterName, valuesSet] of Object.entries(availableFilters)) {
        html += `<div class="mb-6">
                    <h4 class="text-sm font-medium mb-3">${filterName}</h4>
                    <div class="flex flex-col gap-2">`;
        [...valuesSet].sort().forEach(val => {
            const isChecked = currentFilters[filterName] && currentFilters[filterName].includes(val);
            html += `
                <label class="flex items-center gap-3 cursor-pointer text-sm text-gray-600 hover:text-[#D4B88A] transition">
                    <input type="checkbox" class="form-checkbox h-4 w-4 text-[#D4B88A] border-gray-300 rounded focus:ring-[#D4B88A]" 
                           value="${val}" ${isChecked ? 'checked' : ''} onchange="toggleFilter('${filterName}', '${val}')">
                    ${val}
                </label>
            `;
        });
        html += `</div></div>`;
    }

    sidebar.innerHTML = html;
}

// --- ФУНКЦИИ УПРАВЛЕНИЯ КЛИКАМИ ПО ФИЛЬТРАМ ---
window.setCategory = function(cat) {
    if (currentCategory === cat) {
        currentCategory = null;
    } else {
        currentCategory = cat;
    }
    currentSubcategory = null;
    currentFilters = {}; 
    
    renderDynamicSidebar();
    applySmartFilters();
};

window.setSubcategory = function(sub) {
    if (currentSubcategory === sub) {
        currentSubcategory = null;
    } else {
        currentSubcategory = sub;
    }
    currentFilters = {}; 
    
    renderDynamicSidebar();
    applySmartFilters();
};

window.toggleFilter = function(filterName, filterValue) {
    if (!currentFilters[filterName]) currentFilters[filterName] = [];
    
    const idx = currentFilters[filterName].indexOf(filterValue);
    if (idx > -1) {
        currentFilters[filterName].splice(idx, 1);
        if (currentFilters[filterName].length === 0) delete currentFilters[filterName];
    } else {
        currentFilters[filterName].push(filterValue);
    }
    
    renderDynamicSidebar();
    applySmartFilters();
};

function applySmartFilters() {
    let result = allProducts;

    if (currentCategory) result = result.filter(p => p.category === currentCategory);
    if (currentSubcategory) result = result.filter(p => p.subcategory === currentSubcategory);
    for (const [fName, fValues] of Object.entries(currentFilters)) {
        result = result.filter(p => p.filters && fValues.includes(p.filters[fName]));
    }

    currentProducts = result; 
    itemsToShow = 6; // Сбрасываем подгрузку
    
    const grid = document.getElementById('catalog-grid');
    if (grid) applySortAndRender(grid);
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

    localStorage.setItem('hermes_wishlist', JSON.stringify(wishlist));

    if (document.getElementById('wishlist-grid')) {
        renderWishlist();
    }
}

function renderWishlist() {
    const container = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('empty-wishlist');
    if (!container || !emptyState) return;

    container.innerHTML = '';
    
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
    if (!priceString) return 0;
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
    document.getElementById('breadcrumb-brand').textContent = product.brand || product.category;
    document.getElementById('breadcrumb-name').textContent = product.name;
    document.getElementById('product-brand').textContent = product.brand || product.category;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-description').textContent = product.description || '';
    
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
            (product.brand && product.brand.toLowerCase().includes(query)) ||
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

// Обработка клика по категориям в шапке
document.addEventListener('click', (e) => {
    const link = e.target.closest('.category-link');
    
    if (link) {
        if (!e.isTrusted) return;
        if (link.closest('aside')) return; // Игнорируем сайдбар, там уже все само строится

        e.preventDefault(); 
        const category = link.getAttribute('data-category');
        window.location.href = `catalog.html?category=${category}`;
    }
});

// Автоматическое применение фильтра из URL при открытии каталога
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('catalog-grid')) {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');
        
        if (categoryFromUrl) {
            const waitForData = setInterval(() => {
                // Ждем, пока товары загрузятся в массив
                if (allProducts.length > 0) {
                    clearInterval(waitForData);
                    // Вызываем новую умную функцию, которая сразу применит категорию!
                    setCategory(categoryFromUrl); 
                }
            }, 100);
        }
    }
});

// Логика плавного скрытия прелоадера
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.remove();
            }, 700);
        }, 500);
    }
});