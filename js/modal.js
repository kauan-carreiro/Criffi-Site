import { fallbackImages, getCategoryName, formatCurrency } from "./utils.js";
import { addItem } from "./cart.js";

const selectors = {
    modal: "#product-modal",
    close: ".modal-close",
    image: "#product-modal-image",
    thumbs: "#product-modal-thumbs",
    category: "#product-modal-category",
    title: "#product-modal-title",
    summary: "#product-modal-summary",
    detailsToggle: "#product-modal-details-toggle",
    details: "#product-modal-details",
    description: "#product-modal-description",
    availability: "#product-modal-availability",
    price: "#product-modal-price",
    prevButton: "#modal-prev",
    nextButton: "#modal-next",
    sizesContainer: "#product-modal-sizes",
    customization: "#product-modal-customization",
    addToCart: "#product-modal-add-to-cart",
    qtyValue: "#product-modal-qty-value",
    qtyIncr: "#product-modal-qty-incr",
    qtyDecr: "#product-modal-qty-decr"
};

let elements;
let currentProduct = null;
let currentGallery = [];
let currentImageIndex = 0;
let selectedSize = null;
let selectedPrice = 0;
let selectedQuantity = 1;
let addToCartTimeout = null;

function getGallery(product) {
    return [...new Set([
        ...(product.gallery || []),
        product.primaryImage,
        product.secondaryImage
    ].filter(Boolean))];
}

function setActiveThumb(activeButton) {
    elements.thumbs.querySelectorAll(".product-modal__thumb").forEach((button) => {
        button.classList.toggle("is-active", button === activeButton);
        button.setAttribute("aria-current", button === activeButton ? "true" : "false");
    });
}

function selectImage(src, alt, activeButton) {
    if (!elements.image) return;
    elements.image.src = src;
    elements.image.alt = alt;
    if (activeButton) setActiveThumb(activeButton);
}

function createThumb(src, product, index) {
    const button = document.createElement("button");
    button.className = `product-modal__thumb${index === 0 ? " is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `Ver imagem ${index + 1} de ${product.name}`);
    button.setAttribute("aria-current", index === 0 ? "true" : "false");
    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => { image.src = fallbackImages.primary; }, { once: true });
    button.append(image);
    button.addEventListener("click", () => goToImage(index));
    return button;
}

function goToImage(index) {
    if (!currentGallery.length || !currentProduct) return;
    if (index < 0) index = currentGallery.length - 1;
    if (index >= currentGallery.length) index = 0;
    currentImageIndex = index;
    const src = currentGallery[index];
    selectImage(src, currentProduct.name);
    const thumbButtons = elements.thumbs.querySelectorAll(".product-modal__thumb");
    thumbButtons.forEach((btn, i) => {
        const isActive = i === index;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-current", isActive ? "true" : "false");
    });
}

function nextImage() { goToImage(currentImageIndex + 1); }
function prevImage() { goToImage(currentImageIndex - 1); }

function renderGallery(product) {
    currentGallery = getGallery(product);
    currentProduct = product;
    currentImageIndex = 0;
    const thumbElements = currentGallery.map((src, index) => createThumb(src, product, index));
    elements.thumbs.replaceChildren(...thumbElements);
    goToImage(0);
    if (elements.image) {
        elements.image.onerror = () => { elements.image.src = fallbackImages.primary; };
    }
}

function collapseDetails() {
    elements.detailsToggle.setAttribute("aria-expanded", "false");
    elements.details.classList.remove("is-open");
    elements.details.hidden = true;
}

function toggleDetails() {
    const willOpen = elements.details.hidden;
    elements.details.hidden = false;
    elements.detailsToggle.setAttribute("aria-expanded", String(willOpen));
    requestAnimationFrame(() => {
        elements.details.classList.toggle("is-open", willOpen);
    });
    if (!willOpen) {
        elements.details.addEventListener("transitionend", () => {
            if (!elements.details.classList.contains("is-open")) {
                elements.details.hidden = true;
            }
        }, { once: true });
    }
}

function renderSizes(product) {
    const container = elements.sizesContainer;
    container.replaceChildren();
    if (!product.sizes || product.sizes.length === 0) {
        container.innerHTML = '<p class="product-modal__size-label">Tamanho único</p>';
        selectedSize = null;
        selectedPrice = parseFloat(product.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        updatePriceDisplay(selectedPrice);
        return;
    }
    const label = document.createElement('span');
    label.className = 'product-modal__size-label';
    label.textContent = 'Tamanho:';
    container.append(label);

    product.sizes.forEach((sizeObj) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'product-modal__size-btn';
        btn.textContent = sizeObj.size;
        btn.dataset.price = sizeObj.price;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.product-modal__size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = sizeObj.size;
            selectedPrice = sizeObj.price;
            updatePriceDisplay(selectedPrice);
        });
        container.append(btn);
    });

    // Selecionar o primeiro por padrão
    const firstBtn = container.querySelector('.product-modal__size-btn');
    if (firstBtn) {
        firstBtn.classList.add('active');
        selectedSize = product.sizes[0].size;
        selectedPrice = product.sizes[0].price;
        updatePriceDisplay(selectedPrice);
    }
}

function updatePriceDisplay(price) {
    if (elements.price) {
        elements.price.textContent = formatCurrency(price);
    }
}

function renderCustomization(product) {
    const container = elements.customization;
    container.replaceChildren();
    if (!product.customizable) {
        container.innerHTML = '';
        return;
    }
    const label = document.createElement('label');
    label.htmlFor = 'customization-text';
    label.textContent = 'Observações (opcional):';
    const textarea = document.createElement('textarea');
    textarea.id = 'customization-text';
    textarea.rows = 2;
    textarea.placeholder = 'Ex: cor preferida, ajuste, etc.';
    container.append(label, textarea);
}

function updateQuantityDisplay() {
    if (elements.qtyValue) elements.qtyValue.textContent = selectedQuantity;
    if (elements.qtyDecr) elements.qtyDecr.disabled = selectedQuantity <= 1;
}

function incrementQuantity() {
    selectedQuantity += 1;
    updateQuantityDisplay();
}

function decrementQuantity() {
    if (selectedQuantity > 1) {
        selectedQuantity -= 1;
        updateQuantityDisplay();
    }
}

function resetQuantity() {
    selectedQuantity = 1;
    updateQuantityDisplay();
}

function handleAddToCart() {
    if (!currentProduct) return;

    let size = selectedSize;
    let price = selectedPrice;
    if (!size && currentProduct.sizes && currentProduct.sizes.length > 0) {
        const first = currentProduct.sizes[0];
        size = first.size;
        price = first.price;
    } else if (!size) {
        const numeric = parseFloat(currentProduct.price.replace(/[^\d,]/g, '').replace(',', '.'));
        price = numeric || 0;
        size = 'Único';
    }

    const customization = document.querySelector('#customization-text')?.value || '';
    const success = addItem(currentProduct.id, size, customization, selectedQuantity);

    if (success) {
        const btn = elements.addToCart;

        if (addToCartTimeout) {
            clearTimeout(addToCartTimeout);
            addToCartTimeout = null;
        }

        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.textContent;
        }

        btn.textContent = '✓ Adicionado!';
        btn.classList.add('is-added');
        btn.disabled = true;

        resetQuantity();

        addToCartTimeout = setTimeout(() => {
            btn.textContent = btn.dataset.originalText || 'Adicionar ao carrinho';
            btn.classList.remove('is-added');
            btn.disabled = false;
            addToCartTimeout = null;
        }, 1600);
    }
}


export function openProductModal(product) {
    if (!elements || !elements.image || !elements.thumbs || !elements.category) {
        console.error("Modal não inicializado.");
        return;
    }
    collapseDetails();
    renderGallery(product);
    elements.category.textContent = getCategoryName(product.category);
    elements.title.textContent = product.name;
    elements.summary.textContent = product.shortDescription;
    elements.description.textContent = product.fullDescription;
    elements.availability.textContent = product.availability || "Consulte disponibilidade";

    renderSizes(product);
    renderCustomization(product);
    resetQuantity();

    // Reset do botão de carrinho (limpa qualquer animação/estado pendente)
    if (addToCartTimeout) {
        clearTimeout(addToCartTimeout);
        addToCartTimeout = null;
    }
    const btn = elements.addToCart;
    btn.textContent = btn.dataset.originalText || 'Adicionar ao carrinho';
    btn.classList.remove('is-added');
    btn.disabled = false;

    if (typeof elements.modal.showModal === "function") {
        elements.modal.showModal();
    } else {
        elements.modal.setAttribute("open", "");
    }
}

export function initProductModal() {
    elements = Object.fromEntries(
        Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)])
    );

    if (!elements.modal || !elements.close || !elements.image) {
        console.error("Modal não pôde ser inicializado.");
        return;
    }

    elements.close.addEventListener("click", () => elements.modal.close());
    if (elements.prevButton) elements.prevButton.addEventListener("click", prevImage);
    if (elements.nextButton) elements.nextButton.addEventListener("click", nextImage);
    elements.detailsToggle.addEventListener("click", toggleDetails);

    if (elements.qtyIncr) elements.qtyIncr.addEventListener("click", incrementQuantity);
    if (elements.qtyDecr) elements.qtyDecr.addEventListener("click", decrementQuantity);

    elements.modal.addEventListener("click", (event) => {
        const modalBox = elements.modal.getBoundingClientRect();
        const clickedOutside = (
            event.clientX < modalBox.left ||
            event.clientX > modalBox.right ||
            event.clientY < modalBox.top ||
            event.clientY > modalBox.bottom
        );
        if (clickedOutside) elements.modal.close();
    });

    elements.modal.addEventListener("close", collapseDetails);

    if (elements.addToCart) {
        elements.addToCart.addEventListener("click", handleAddToCart);
    }
}
