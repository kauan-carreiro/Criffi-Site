import { fallbackImages, getCategoryName } from "./utils.js";

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
    nextButton: "#modal-next"
};

let elements;
let currentProduct = null;
let currentGallery = [];
let currentImageIndex = 0;

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
    if (!elements.image) {
        console.error("Elemento #product-modal-image não encontrado");
        return;
    }
    elements.image.src = src;
    elements.image.alt = alt;

    if (activeButton) {
        setActiveThumb(activeButton);
    }
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
    image.addEventListener("error", () => {
        image.src = fallbackImages.primary;
    }, { once: true });

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

function nextImage() {
    goToImage(currentImageIndex + 1);
}

function prevImage() {
    goToImage(currentImageIndex - 1);
}

function renderGallery(product) {
    currentGallery = getGallery(product);
    currentProduct = product;
    currentImageIndex = 0;

    const thumbElements = currentGallery.map((src, index) => createThumb(src, product, index));
    elements.thumbs.replaceChildren(...thumbElements);

    goToImage(0);

    if (elements.image) {
        elements.image.onerror = () => {
            elements.image.src = fallbackImages.primary;
        };
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

export function openProductModal(product) {
    if (!elements || !elements.image || !elements.thumbs || !elements.category) {
        console.error("Elementos do modal não foram inicializados corretamente.");
        return;
    }

    collapseDetails();
    renderGallery(product);

    elements.category.textContent = getCategoryName(product.category);
    elements.title.textContent = product.name;
    elements.summary.textContent = product.shortDescription;
    elements.description.textContent = product.fullDescription;
    elements.availability.textContent = product.availability || "Consulte disponibilidade";
    elements.price.textContent = product.price || "Sob consulta";

    if (typeof elements.modal.showModal === "function") {
        elements.modal.showModal();
        return;
    }

    elements.modal.setAttribute("open", "");
}

export function initProductModal() {
    elements = Object.fromEntries(
        Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)])
    );

    if (!elements.modal || !elements.close || !elements.image) {
        console.error("Modal não pôde ser inicializado: elementos faltando.");
        return;
    }

    elements.close.addEventListener("click", () => elements.modal.close());

    if (elements.prevButton) {
        elements.prevButton.addEventListener("click", prevImage);
    }
    if (elements.nextButton) {
        elements.nextButton.addEventListener("click", nextImage);
    }

    elements.detailsToggle.addEventListener("click", toggleDetails);

    elements.modal.addEventListener("click", (event) => {
        const modalBox = elements.modal.getBoundingClientRect();
        const clickedOutside = (
            event.clientX < modalBox.left ||
            event.clientX > modalBox.right ||
            event.clientY < modalBox.top ||
            event.clientY > modalBox.bottom
        );

        if (clickedOutside) {
            elements.modal.close();
        }
    });

    elements.modal.addEventListener("close", collapseDetails);
}
