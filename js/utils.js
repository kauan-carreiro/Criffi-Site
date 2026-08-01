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

export function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(amount);
}

// Tabela de frete por região (valores em R$)
const shippingTable = {
    'SP': 15.00,
    'RJ': 20.00,
    'MG': 18.00,
    'outros': 25.00
};

export function calculateShipping(region, total) {
    const base = shippingTable[region] || shippingTable['outros'];
    // Frete grátis
    if (total >= 1500) return 0;
    return base;
}

export function generateWhatsAppMessage(order) {
    // order: { items, total, shipping, grandTotal, region }
    const lines = [];
    lines.push('🧵 *Pedido Criffi*');
    lines.push('');
    order.items.forEach((item, i) => {
        let line = `- ${item.name}`;
        if (item.size) line += ` (Tamanho: ${item.size})`;
        if (item.quantity > 1) line += ` x${item.quantity}`;
        if (item.customization) line += `\n  Obs: ${item.customization}`;
        line += ` - ${formatCurrency(item.price * item.quantity)}`;
        lines.push(line);
    });
    lines.push('');
    lines.push(`Subtotal: ${formatCurrency(order.total)}`);
    if (order.shipping > 0) {
        lines.push(`Frete: ${formatCurrency(order.shipping)}`);
    } else {
        lines.push('Frete: Grátis');
    }
    lines.push(`Total: ${formatCurrency(order.grandTotal)}`);
    lines.push('');
    lines.push('📱 Enviar para finalizar o pedido.');
    return lines.join('\n');
}
