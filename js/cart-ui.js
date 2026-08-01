import { getCart, getTotalItems, getSubtotal, removeItem, updateQuantity } from './cart.js';
import { calculateShipping, formatCurrency, fallbackImages } from './utils.js';
import { products } from './data/products.js';

let elements = {};

function getItemImage(item) {
    const product = products.find(p => p.id === item.productId);
    return (product && product.primaryImage) || fallbackImages.primary;
}

function renderCartPanel() {
    const cart = getCart();
    const totalItems = getTotalItems();
    const subtotal = getSubtotal();

    // Badge
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = totalItems > 0 ? totalItems : '';
        badge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    }

    // Se o painel não estiver aberto, não renderiza tudo
    if (!elements.panel || !elements.panel.open) return;

    const container = elements.items;
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty">🛒 Seu carrinho está vazio.</p>';
        elements.subtotal.textContent = 'R$ 0,00';
        elements.total.textContent = 'R$ 0,00';
        elements.shipping.textContent = 'R$ 0,00';
        return;
    }

    let html = '';
    cart.forEach((item, index) => {
        const price = formatCurrency(item.unitPrice * item.quantity);
        const imageSrc = getItemImage(item);
        html += `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${imageSrc}" alt="${item.productName}" loading="lazy">
                </div>
                <div class="cart-item-info">
                    <strong>${item.productName}</strong>
                    ${item.size ? `<span>Tamanho: ${item.size}</span>` : ''}
                    ${item.customization ? `<small>Obs: ${item.customization}</small>` : ''}
                </div>
                <div class="cart-item-controls">
                    <button class="cart-qty-btn" data-index="${index}" data-action="decr" aria-label="Diminuir quantidade">−</button>
                    <span class="cart-qty">${item.quantity}</span>
                    <button class="cart-qty-btn" data-index="${index}" data-action="incr" aria-label="Aumentar quantidade">+</button>
                    <button class="cart-remove-btn" data-index="${index}" aria-label="Remover item">✕</button>
                </div>
                <div class="cart-item-price">${price}</div>
            </div>
        `;
    });
    container.innerHTML = html;

    // Resumo
    elements.subtotal.textContent = formatCurrency(subtotal);
    const region = document.querySelector('#cart-region')?.value || 'outros';
    const shipping = calculateShipping(region, subtotal);
    elements.shipping.textContent = shipping === 0 ? 'Grátis' : formatCurrency(shipping);
    const total = subtotal + shipping;
    elements.total.textContent = formatCurrency(total);
    elements.panel.dataset.shipping = shipping;
    elements.panel.dataset.total = total;

    // Eventos dos botões
    document.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const action = btn.dataset.action;
            const currentQty = cart[index]?.quantity || 0;
            const newQty = action === 'incr' ? currentQty + 1 : currentQty - 1;
            updateQuantity(index, newQty);
            renderCartPanel();
        });
    });
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeItem(index);
            renderCartPanel();
        });
    });
}

function openCartPanel() {
    elements.panel.showModal();
    renderCartPanel();
}

function closeCartPanel() {
    elements.panel.close();
}

export function initCartUI() {
    elements.panel = document.querySelector('#cart-panel');
    elements.items = document.querySelector('.cart-items');
    elements.subtotal = document.querySelector('.cart-subtotal');
    elements.shipping = document.querySelector('.cart-shipping');
    elements.total = document.querySelector('.cart-total');
    elements.checkoutBtn = document.querySelector('.cart-checkout-btn');
    elements.closeBtn = document.querySelector('.cart-close');
    elements.regionSelect = document.querySelector('#cart-region');

    if (!elements.panel) {
        console.error('Carrinho: #cart-panel não encontrado.');
        return;
    }

    const toggle = document.querySelector('.cart-toggle');
    if (toggle) toggle.addEventListener('click', openCartPanel);

    if (elements.closeBtn) elements.closeBtn.addEventListener('click', closeCartPanel);

    elements.panel.addEventListener('click', (e) => {
        if (e.target === elements.panel) closeCartPanel();
    });

    if (elements.regionSelect) {
        elements.regionSelect.addEventListener('change', renderCartPanel);
    }

    if (elements.checkoutBtn) {
        elements.checkoutBtn.addEventListener('click', () => {
            import('./checkout.js').then(module => {
                module.finalizeOrder();
            });
        });
    }

    document.addEventListener('cart-updated', () => {
        renderCartPanel();
        const totalItems = getTotalItems();
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            badge.textContent = totalItems > 0 ? totalItems : '';
            badge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
        }
    });

    // Carregar do localStorage
    import('./cart.js').then(module => {
        module.loadCart();
    });

    renderCartPanel();
}
