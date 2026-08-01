import { getCart, getSubtotal, clearCart } from './cart.js';
import { calculateShipping, generateWhatsAppMessage } from './utils.js';

export function finalizeOrder() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Seu carrinho está vazio.');
        return;
    }

    const subtotal = getSubtotal();
    const region = document.querySelector('#cart-region')?.value || 'outros';
    const shipping = calculateShipping(region, subtotal);
    const total = subtotal + shipping;

    const order = {
        items: cart.map(item => ({
            name: item.productName,
            size: item.size,
            quantity: item.quantity,
            price: item.unitPrice,
            customization: item.customization || ''
        })),
        total: subtotal,
        shipping: shipping,
        grandTotal: total,
        region: region
    };

    const message = generateWhatsAppMessage(order);
    const phone = '5500000000000';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    clearCart();

    const panel = document.querySelector('#cart-panel');
    if (panel && panel.close) panel.close();

    alert('Pedido enviado para o WhatsApp! Em breve entraremos em contato.');
}
