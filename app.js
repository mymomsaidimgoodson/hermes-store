document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

async function loadData() {
  try {
    const response = await fetch('products.json');
    const products = await response.json();
    
    // Рендер каталога
    const catalogGrid = document.getElementById('catalog-grid');
    if (catalogGrid) {
      renderCatalog(products, catalogGrid);
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

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

// Универсальная карточка (для каталога и главной)
function createCardHtml(product) {
  const badgeHtml = product.isNew 
    ? `<span class="absolute top-4 left-4 z-10 text-[10px] tracking-widest text-[#D4B88A] uppercase">New</span>` 
    : '';

  const shortSpec = Object.values(product.specs)[0] || '';

  const hoverImageHtml = product.images[1] 
    ? `<img src="${product.images[1]}" alt="${product.name} detail" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-0 transition-opacity duration-700 group-hover:opacity-100">`
    : '';

  return `
    ${badgeHtml}
    <a href="product.html?id=${product.id}" class="block relative w-full aspect-square mb-6 overflow-hidden bg-white/30 cursor-pointer shrink-0">
      <img src="${product.images[0]}" alt="${product.name}" class="absolute inset-0 w-full h-full object-contain mix-blend-multiply transition-opacity duration-700 ${product.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}">
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
  container.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'group flex flex-col relative text-center h-full';
    card.innerHTML = createCardHtml(product);
    container.appendChild(card);
  });
}

function renderBestsellers(products, container) {
  container.innerHTML = '';
  const bestsellers = products.filter(p => p.isBestseller).slice(0, 4);
  bestsellers.forEach(product => {
    const card = document.createElement('div');
    card.className = 'group flex flex-col relative text-center h-full';
    card.innerHTML = createCardHtml(product);
    container.appendChild(card);
  });
}

// НОВАЯ ЛОГИКА ДЛЯ СТРАНИЦЫ ТОВАРА
function renderProductPage(products) {
    // 1. Получаем ID товара из URL (например, ?id=iphone-16-pro)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // 2. Ищем товар в нашей базе данных
    const product = products.find(p => p.id === productId);

    const container = document.getElementById('product-container');
    const errorMessage = document.getElementById('error-message');

    // Если товар не найден (или зашли по прямой ссылке без ID), показываем ошибку
    if (!product) {
        errorMessage.classList.remove('hidden');
        return;
    }

    // 3. Заполняем текстовые данные
    document.title = `${product.name} — Hermes Store`;
    document.getElementById('breadcrumb-brand').textContent = product.brand;
    document.getElementById('breadcrumb-name').textContent = product.name;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-description').textContent = product.description;
    
    // Ссылка на Авито
    document.getElementById('avito-btn').href = product.avitoLink;

    // Добавляем бейдж NEW, если он есть у товара
    if (product.isNew) {
        document.getElementById('product-badge-container').innerHTML = `<span class="absolute top-6 left-6 text-xs tracking-widest text-[#D4B88A] font-medium border border-[#D4B88A] px-2 py-1 z-10 bg-white/50 backdrop-blur-sm">NEW</span>`;
    }

    // 4. Заполняем галерею (Главное фото)
    const mainImage = document.getElementById('main-image');
    mainImage.src = product.images[0];
    mainImage.alt = product.name;

    // Миниатюры (Остальные фото)
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    thumbnailsContainer.innerHTML = ''; // Очищаем контейнер

    // Если есть больше одной картинки, выводим остальные как миниатюры
    if (product.images.length > 1) {
        for (let i = 1; i < product.images.length; i++) {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'bg-white p-4 aspect-square flex items-center justify-center cursor-pointer hover:opacity-80 transition';
            thumbDiv.innerHTML = `<img src="${product.images[i]}" alt="${product.name} detail ${i}" class="w-full h-full object-contain mix-blend-multiply">`;
            
            // Логика переключения главного фото при клике на миниатюру
            thumbDiv.addEventListener('click', () => {
                const currentMainSrc = mainImage.src;
                mainImage.src = product.images[i];
                thumbDiv.querySelector('img').src = currentMainSrc;
                // Обновляем массив картинок (меняем местами), чтобы клик работал корректно при повторных нажатиях
                product.images[0] = mainImage.src;
                product.images[i] = currentMainSrc;
            });
            
            thumbnailsContainer.appendChild(thumbDiv);
        }
    }

    // 5. Генерируем список характеристик в аккордеоне
    const specsContainer = document.getElementById('specs-container');
    specsContainer.innerHTML = '';
    
    for (const [key, value] of Object.entries(product.specs)) {
        specsContainer.innerHTML += `
            <div class="flex justify-between border-b border-[#EDE9E0] pb-2 last:border-0 last:pb-0">
                <span class="text-gray-400">${key}</span>
                <span class="text-[#1C1C1C] text-right font-medium">${value}</span>
            </div>
        `;
    }

    // Показываем контейнер с товаром
    container.classList.remove('hidden');
}
// --- ЛОГИКА МОБИЛЬНОГО МЕНЮ ---
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-menu-close');

    if (mobileBtn && mobileMenu && mobileClose) {
        // Открытие меню
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('flex');
            document.body.style.overflow = 'hidden'; // Убираем скролл сайта под меню
        });

        // Закрытие меню
        mobileClose.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('flex');
            document.body.style.overflow = ''; // Возвращаем скролл
        });
    }
});