export const fallbackImages = {
    primary: "./assets/images/hero/hero-image.webp",
    secondary: "./assets/images/about/about.webp"
};

export function normalizeText(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export function getCategoryName(category) {
    const names = {
        blusas: "Blusas",
        croppeds: "Croppeds",
        biquinis: "Biquínis",
        saias: "Saias",
        vestidos: "Vestidos",
        conjuntos: "Conjuntos",
        acessorios: "Acessórios"
    };

    return names[category] || "Produto";
}

export function createProductImage(src, alt, className, fallback = fallbackImages.primary) {
    const image = document.createElement("img");
    image.src = src || fallback;
    image.alt = alt;
    image.className = className;
    image.loading = "lazy";
    image.addEventListener("error", () => {
        image.src = fallback;
    }, { once: true });

    return image;
}
