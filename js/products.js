import { products } from "./data/products.js";
import { openProductModal } from "./modal.js";
import { createProductImage, fallbackImages, normalizeText } from "./utils.js";

const productsPerPage = 10;

const state = {
    filter: "todos",
    search: "",
    sort: "suggested",
    page: 1
};

let elements;

function getProductById(productId) {
    return products.find((product) => product.id === productId);
}

function getSearchableContent(product) {
    return normalizeText([
        product.name,
        product.category,
        product.shortDescription,
        product.fullDescription
    ].join(" "));
}

function getFilteredProducts() {
    const search = normalizeText(state.search.trim());

    const filteredProducts = products.filter((product) => {
        const matchesFilter = state.filter === "todos" || product.category === state.filter;
        const matchesSearch = !search || getSearchableContent(product).includes(search);

        return matchesFilter && matchesSearch;
    });

    return sortProducts(filteredProducts);
}

function getNumericPrice(product) {
    const numericValue = String(product.price || "")
        .replace(/[^\d,]/g, "")
        .replace(",", ".");

    return Number.parseFloat(numericValue) || 0;
}

function sortProducts(productList) {
    const sortedProducts = [...productList];

    if (state.sort === "name-asc") {
        return sortedProducts.sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
    }

    if (state.sort === "price-desc") {
        return sortedProducts.sort((first, second) => getNumericPrice(second) - getNumericPrice(first));
    }

    if (state.sort === "price-asc") {
        return sortedProducts.sort((first, second) => getNumericPrice(first) - getNumericPrice(second));
    }

    return sortedProducts;
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.tabIndex = 0;
    card.role = "button";
    card.dataset.productId = product.id;
    card.setAttribute("aria-label", `Ver detalhes de ${product.name}`);

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "product-card__image";
    imageWrapper.append(
        createProductImage(
            product.primaryImage,
            product.name,
            "product-image product-image--primary",
            fallbackImages.primary
        ),
        createProductImage(
            product.secondaryImage,
            product.name,
            "product-image product-image--secondary",
            fallbackImages.secondary
        )
    );

    const content = document.createElement("div");
    content.className = "product-card__content";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.shortDescription;

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = product.price || "Sob consulta";

    const availability = document.createElement("p");
    availability.className = "product-card__availability";
    availability.textContent = product.availability || "Consulte disponibilidade";

    content.append(title, price, description, availability);
    card.append(imageWrapper, content);

    return card;
}

function renderPagination(totalPages, totalProducts) {
    elements.pagination.replaceChildren();

    if (totalPages <= 1 || totalProducts === 0) {
        return;
    }

    for (let page = 1; page <= totalPages; page += 1) {
        const button = document.createElement("button");
        button.className = `pagination-button${page === state.page ? " active" : ""}`;
        button.type = "button";
        button.textContent = page;
        button.setAttribute("aria-label", `Ir para a página ${page} de produtos`);
        button.addEventListener("click", () => {
            state.page = page;
            renderProducts();
            document.querySelector("#produtos").scrollIntoView({ behavior: "smooth", block: "start" });
        });

        elements.pagination.append(button);
    }
}

function renderProducts() {
    const filteredProducts = getFilteredProducts();
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));

    if (state.page > totalPages) {
        state.page = totalPages;
    }

    const start = (state.page - 1) * productsPerPage;
    const visibleProducts = filteredProducts.slice(start, start + productsPerPage);

    elements.grid.replaceChildren(...visibleProducts.map(createProductCard));
    elements.emptyMessage.hidden = filteredProducts.length > 0;
    elements.count.textContent = `${filteredProducts.length} produto${filteredProducts.length === 1 ? "" : "s"}`;
    renderPagination(totalPages, filteredProducts.length);
}

function handleGridClick(event) {
    const card = event.target.closest(".product-card");

    if (!card) {
        return;
    }

    const product = getProductById(card.dataset.productId);

    if (product) {
        openProductModal(product);
    }
}

function handleGridKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const card = event.target.closest(".product-card");

    if (!card) {
        return;
    }

    event.preventDefault();
    const product = getProductById(card.dataset.productId);

    if (product) {
        openProductModal(product);
    }
}

function initFilters() {
    elements.filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            elements.filterButtons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            state.filter = button.dataset.filter;
            state.page = 1;
            renderProducts();
        });
    });

    elements.searchInput.addEventListener("input", (event) => {
        state.search = event.target.value;
        state.page = 1;
        renderProducts();
    });

    elements.sortSelect.addEventListener("change", (event) => {
        state.sort = event.target.value;
        state.page = 1;
        renderProducts();
    });
}

export function initProductsCatalog() {
    elements = {
        grid: document.querySelector("#products-grid"),
        emptyMessage: document.querySelector("#products-empty"),
        pagination: document.querySelector("#products-pagination"),
        count: document.querySelector("#products-count"),
        searchInput: document.querySelector("#product-search"),
        sortSelect: document.querySelector("#product-sort"),
        filterButtons: document.querySelectorAll(".filter-button")
    };

    initFilters();
    elements.grid.addEventListener("click", handleGridClick);
    elements.grid.addEventListener("keydown", handleGridKeydown);
    renderProducts();
}
