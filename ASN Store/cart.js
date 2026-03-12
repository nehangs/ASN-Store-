// webapp/cart.js

const STORAGE_KEY = 'asn_store_cart';

// Retrieve cart (array of items)
function getCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('getCart parse error', e);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const cart = getCart();
    const totalQty = cart.reduce((s, it) => s + (it.quantity || 0), 0);
    countEl.textContent = totalQty;
}

// Add an item to the cart. If already present, increment quantity.
function addToCart(id, name, price, image) {
    const cart = getCart();
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
    } else {
        cart.push({ id, name, price: Number(price), image, quantity: 1 });
    }
    saveCart(cart);
    flashMessage('Added to cart');
}

function removeItem(id) {
    showConfirm('Remove this item from cart?', () => {
        let cart = getCart();
        cart = cart.filter(i => i.id !== id);
        saveCart(cart);
        renderCartPage();
    });
}

function updateQuantity(id, qty) {
    qty = Number(qty);
    if (isNaN(qty) || qty < 1) return;
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity = qty;
    saveCart(cart);
    renderCartPage();
}

// Renders the cart into the cart page (if present)
function renderCartPage() {
    const tableBody = document.getElementById('cart-items-body') || document.getElementById('cart-table-body');
    const totalEl = document.getElementById('cart-total') || document.getElementById('total-price');
    if (!tableBody) return; // not on cart page

    const cart = getCart();
    tableBody.innerHTML = '';
    if (cart.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Your cart is empty</td></tr>';
        if (totalEl) totalEl.textContent = '₹0.00';
        updateCartCount();
        return;
    }

    let total = 0;
    cart.forEach(item => {
        const subtotal = (Number(item.price) || 0) * (item.quantity || 1);
        total += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="cart-info">
                    <img src="${item.image}" alt="${item.name}" />
                    <div>
                        <p>${item.name}</p>
                        <small>Price: ₹${Number(item.price).toFixed(2)}</small><br>
                        <a href="#" class="remove-link" data-id="${item.id}">Remove</a>
                    </div>
                </div>
            </td>
            <td><input type="number" min="1" value="${item.quantity}" class="qty-input" data-id="${item.id}"></td>
            <td>₹${subtotal.toFixed(2)}</td>
        `;
        tableBody.appendChild(tr);
    });

    if (totalEl) totalEl.textContent = '₹' + total.toFixed(2);
    
    // Attach listeners
    tableBody.querySelectorAll('.qty-input').forEach(inp => {
        inp.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const q = parseInt(e.target.value) || 1;
            updateQuantity(id, q);
        });
    });
    tableBody.querySelectorAll('.remove-link').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const id = a.dataset.id;
            removeItem(id);
        });
    });

    updateCartCount();
}

// Small flash message for feedback
function flashMessage(msg, duration = 1600) {
    let el = document.getElementById('cart-flash');
    if (!el) {
        el = document.createElement('div');
        el.id = 'cart-flash';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.classList.remove('cart-bump');
        void countEl.offsetWidth; // force reflow
        countEl.classList.add('cart-bump');
    }
    setTimeout(() => el.classList.remove('show'), duration);
}

// Create or show confirmation modal
function showConfirm(message, onConfirm) {
    let modal = document.getElementById('cart-confirm-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-confirm-modal';
        modal.className = 'modal-confirm';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-message">${message}</div>
                <div class="modal-actions">
                    <button class="btn secondary" id="cart-confirm-cancel">Cancel</button>
                    <button class="btn" id="cart-confirm-ok">Remove</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal-message').textContent = message;
    }

    modal.style.display = 'flex';

    const cleanup = () => { modal.style.display = 'none'; };
    modal.querySelector('#cart-confirm-cancel').onclick = () => cleanup();
    modal.querySelector('#cart-confirm-ok').onclick = () => { cleanup(); if (typeof onConfirm === 'function') onConfirm(); };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    renderCartPage();
    updateCartCount();

    // Wire add-to-cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            let name, price, img, id;

            // --- Case 1: Product Listing Page (Grid) ---
            const card = btn.closest('.col-4');
            if (card) {
                name = card.querySelector('h4, .product-title')?.innerText || 'Product';
                const priceText = card.querySelector('p')?.innerText || '0';
                price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
                img = card.querySelector('img')?.getAttribute('src') || '';
                // Use data-id or generate from name
                id = card.dataset.id || name.replace(/\s+/g, '-').toLowerCase();
            } 
            
            // --- Case 2: Single Product Details Page ---
            else {
                const details = btn.closest('.col-2');
                if (details) {
                    // On details page, Title is often H1 and price is H4
                    name = details.querySelector('h1')?.innerText || 'Product';
                    const priceText = details.querySelector('h4')?.innerText || '0';
                    price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
                    
                    // The main image usually has id="ProductImg"
                    const imgEl = document.getElementById('ProductImg');
                    img = imgEl ? imgEl.getAttribute('src') : '';
                    
                    id = name.replace(/\s+/g, '-').toLowerCase();
                }
            }

            if (name && id) {
                // disable button briefly and show feedback
                btn.classList.add('disabled');
                btn.setAttribute('disabled', '');
                addToCart(id, name, price, img);
                setTimeout(() => { btn.classList.remove('disabled'); btn.removeAttribute('disabled'); }, 650);
            } else {
                console.error('Could not extract product details');
            }
        });
    });
});