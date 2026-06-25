let allProducts = []; 
let currentProducts = []; 
let itemsToShow = 6; 

// --- ЛОГИКА АНИМАЦИЙ (Scroll Reveal) ---
const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Как только карточка появляется на экране, убираем прозрачность и сдвиг
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(entry.target); // Анимируем только один раз
        }
    });
}, { threshold: 0.1 }); // Срабатывает, когда видно хотя бы 10% карточки

document.addEventListener('DOMContentLoaded', () => {
  // Плавное появление всей страницы при загрузке
  document.body.classList.add('opacity-0', 'transition-opacity', 'duration-1000');
  setTimeout(() => {
      document.body.classList.remove('opacity-0');
  }, 50);

  loadData();

  // --- ЛОГИКА МОБИЛЬНОГО МЕНЮ ---
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
});

async function loadData() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('Сетевая ошибка: файл не найден');
    
    const products = await response.json();
    allProducts = products; 
    currentProducts = [...allProducts]; 
    
    // Рендер каталога
    const catalogGrid = document.getElementById('catalog-grid');
    if (catalogGrid) {
      renderCatalog(currentProducts, catalogGrid);
      initSort(); 
      initLoadMore(); 
    }

    // Рендер бестселлеров на главной
    const bestsellersGrid = document.getElementById('bestsellers-grid');
    if (bestsellersGrid) {
      renderBestsellers(products, bestsellersGrid);
    }

    // Рендер детальной страницы товара
    const productContainer = document.getElementById('product-container');
    if (productContainer) {
      renderProductPage(products);
    }

    // Инициализируем живой поиск на всех страницах
    initSearch();

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    const catalogGrid = document.getElementById('catalog-grid');
    if (catalogGrid) {
      catalogGrid.innerHTML = `
        <div class="col-span-full text-center py-20 text-red-500 font-light">
          <p class="text-xl mb-2">Упс, не удалось загрузить товары.</p>
          <p class="text-sm">Причина: ${error.message}</p>
        </div>
      `;
    }
  }
}

// Защищенная функция создания карточки
function createCardHtml(product) {
  const badgeHtml = product.isNew 
    ? `<span class="absolute top-4 left-4 z-10 text-[10px] tracking-widest text-[#D4B88A] uppercase">New</span>` 
    : '';

  const shortSpec = (product.specs && Object.keys(product.specs).length > 0) ? Object.values(product.specs)[0] : '';
  const image0 = (product.images && product.images[0]) ? product.images[0] : '';
  const image1 = (product.images && product.images[1]) ? product.images[1] : '';

  const hoverImageHtml = image1 
    ? `<img src="${image1}" alt="${product.name} detail" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-0 transition-opacity duration-700 group-hover:opacity-100">`
    : '';

  return `
    ${badgeHtml}
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

// --- НОВАЯ ЛОГИКА РЕНДЕРА КАТАЛОГА (С ЛИМИТАМИ И АНИМАЦИЕЙ) ---
function renderCatalog(products, container) {
  container.innerHTML = '';
  const visibleProducts = products.slice(0, itemsToShow);

  visibleProducts.forEach(product => {
    const card = document.createElement('div');
    // Добавлены начальные классы для скрытия и анимации
    card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-1000 ease-out';
    card.innerHTML = createCardHtml(product);
    container.appendChild(card);
    scrollObserver.observe(card); // Подключаем карточку к наблюдателю
  });

  const loadMoreContainer = document.getElementById('load-more-container');
  if (loadMoreContainer) {
      if (itemsToShow >= products.length) {
          loadMoreContainer.classList.add('hidden'); 
      } else {
          loadMoreContainer.classList.remove('hidden'); 
      }
  }
}

function initLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    const catalogGrid = document.getElementById('catalog-grid');

    if (loadMoreBtn && catalogGrid) {
        loadMoreBtn.addEventListener('click', () => {
            itemsToShow += 6; 
            renderCatalog(currentProducts, catalogGrid); 
        });
    }
}

function initSort() {
    const sortSelect = document.getElementById('sort-select');
    const catalogGrid = document.getElementById('catalog-grid');

    if (sortSelect && catalogGrid) {
        sortSelect.addEventListener('change', (e) => {
            const sortType = e.target.value;
            currentProducts = [...allProducts]; 

            if (sortType === 'new') {
                currentProducts.sort((a, b) => (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1);
            } else if (sortType === 'cheap') {
                currentProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
            } else if (sortType === 'expensive') {
                currentProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
            }

            itemsToShow = 6; 
            renderCatalog(currentProducts, catalogGrid);
        });
    }
}

function parsePrice(priceString) {
    return parseInt(priceString.replace(/\D/g, ''), 10);
}

function renderBestsellers(products, container) {
  container.innerHTML = '';
  const bestsellers = products.filter(p => p.isBestseller).slice(0, 4);
  bestsellers.forEach(product => {
    const card = document.createElement('div');
    card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-1000 ease-out';
    card.innerHTML = createCardHtml(product);
    container.appendChild(card);
    scrollObserver.observe(card); // Подключаем анимацию
  });
}

// --- ЛОГИКА ЖИВОГО ПОИСКА ---
function initSearch() {
    const searchIcons = document.querySelectorAll('.fa-magnifying-glass');
    const searchModal = document.getElementById('search-modal');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchModal || !searchInput) return;

    searchIcons.forEach(icon => {
        icon.parentElement.addEventListener('click', (e) => {
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
            product.brand.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            searchResults.innerHTML = '<div class="col-span-full text-center text-gray-400 text-lg mt-10">По вашему запросу ничего не найдено</div>';
            return;
        }

        filtered.forEach(product => {
            const card = document.createElement('div');
            // При поиске тоже добавляем анимацию появления
            card.className = 'group flex flex-col relative text-center h-full opacity-0 translate-y-8 transition-all duration-700 ease-out';
            card.innerHTML = createCardHtml(product);
            
            card.addEventListener('click', () => {
                document.body.style.overflow = '';
            });
            
            searchResults.appendChild(card);
            // Даем небольшую задержку, чтобы анимация сработала при рендере
            setTimeout(() => {
                card.classList.remove('opacity-0', 'translate-y-8');
                card.classList.add('opacity-100', 'translate-y-0');
            }, 50);
        });
    });
}

function renderProductPage(products) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const product = products.find(p => p.id === productId);

    const container = document.getElementById('product-container');
    const errorMessage = document.getElementById('error-message');

    if (!product) {
        errorMessage.classList.remove('hidden');
        return;
    }

    document.title = `${product.name} — Hermes Store`;
    document.getElementById('breadcrumb-brand').textContent = product.brand;
    document.getElementById('breadcrumb-name').textContent = product.name;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('avito-btn').href = product.avitoLink;

    if (product.isNew) {
        document.getElementById('product-badge-container').innerHTML = `<span class="absolute top-6 left-6 text-xs tracking-widest text-[#D4B88A] font-medium border border-[#D4B88A] px-2 py-1 z-10 bg-white/50 backdrop-blur-sm">NEW</span>`;
    }

    const mainImage = document.getElementById('main-image');
    mainImage.src = product.images && product.images[0] ? product.images[0] : '';
    mainImage.alt = product.name;

    const thumbnailsContainer = document.getElementById('thumbnails-container');
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

    const specsContainer = document.getElementById('specs-container');
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

    container.classList.remove('hidden');
}