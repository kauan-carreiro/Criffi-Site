import { products } from './data/products.js';

let cartItems = [];

export function getCart() {
    return [...cartItems];
}

export function getTotalItems() {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
}

export function getSubtotal() {
    return cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
}

export function addItem(productId, size, customization, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    let price = 0;
    if (product.sizes && product.sizes.length > 0) {
        const sizeObj = product.sizes.find(s => s.size === size);
        price = sizeObj ? sizeObj.price : product.sizes[0].price;
    } else {
        const numeric = parseFloat(product.price.replace(/[^\d,]/g, '').replace(',', '.'));
        price = numeric || 0;
    }
    const existing = cartItems.find(item =>
        item.productId === productId && item.size === size && item.customization === customization
    );
    if (existing) {
        existing.quantity += quantity;
    } else {
        cartItems.push({
            productId,
            size,
            quantity,
            customization: customization || '',
            unitPrice: price,
            productName: product.name
        });
    }
    document.dispatchEvent(new CustomEvent('cart-updated'));
    return true;
}

export function removeItem(index) {
    if (index >= 0 && index < cartItems.length) {
        cartItems.splice(index, 1);
        document.dispatchEvent(new CustomEvent('cart-updated'));
        return true;
    }
    return false;
}

export function updateQuantity(index, quantity) {
    if (index >= 0 && index < cartItems.length) {
        if (quantity <= 0) return removeItem(index);
        cartItems[index].quantity = quantity;
        document.dispatchEvent(new CustomEvent('cart-updated'));
        return true;
    }
    return false;
}

export function clearCart() {
    cartItems = [];
    document.dispatchEvent(new CustomEvent('cart-updated'));
}

// Persistência
export function loadCart() {
    const stored = localStorage.getItem('criffi-cart');
    if (stored) {
        try {
            cartItems = JSON.parse(stored);
        } catch (e) {
            cartItems = [];
        }
    }
    document.dispatchEvent(new CustomEvent('cart-updated'));
}

export function saveCart() {
    localStorage.setItem('criffi-cart', JSON.stringify(cartItems));
}

document.addEventListener('cart-updated', saveCart);
