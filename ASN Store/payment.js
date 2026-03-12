// webapp/payment.js

function processPayment() {
    const btn = document.querySelector('.pay-btn');
    const originalText = btn.innerText;

    // --- CHECK 1: Is a payment method selected? ---
    const methodInput = document.querySelector('input[name="payment-method"]:checked');
    if (!methodInput) {
        alert("Please select a payment method.");
        return;
    }
    
    // --- CHECK 2: Is the Cart Empty? (CRITICAL FIX) ---
    const STORAGE_KEY_CART = 'asn_store_cart';
    const cartRaw = localStorage.getItem(STORAGE_KEY_CART);
    const cart = cartRaw ? JSON.parse(cartRaw) : [];

    if (cart.length === 0) {
        alert("Your cart is empty! Please add products before paying.");
        return; // STOP HERE if cart is empty
    }

    // --- CHECK 3: Card Details Validation ---
    const method = methodInput.value;
    if (method === 'card') {
        const cardNum = document.querySelector('#card-details input[placeholder="Card Number"]').value;
        if (!cardNum || cardNum.length < 1) {
            alert("Please enter card details.");
            return;
        }
    }

    // --- PROCESSING VISUALS ---
    btn.innerText = "Processing...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    // Simulate Network Delay (2 seconds)
    setTimeout(() => {
        // --- SAVE THE ORDER ---
        const orderSaved = saveOrderAndClearCart(cart);

        if (orderSaved) {
            // Show success modal ONLY if save was successful
            document.getElementById('successModal').style.display = 'flex';
        } else {
            alert("Error saving order. Please try again.");
        }
        
        // Reset button
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
    }, 2000);
}

function saveOrderAndClearCart(cart) {
    const STORAGE_KEY_ORDERS = 'asn_store_orders';
    const STORAGE_KEY_CART = 'asn_store_cart';

    try {
        // 1. Calculate Total
        const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

        // 2. Create Order Object
        const newOrder = {
            orderId: Math.floor(100000 + Math.random() * 900000).toString(),
            date: new Date().toLocaleDateString(),
            status: 'Processing',
            total: totalAmount.toFixed(2),
            items: cart
        };

        // 3. Get Existing Orders & Add New One
        const existingOrdersRaw = localStorage.getItem(STORAGE_KEY_ORDERS);
        let orders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
        
        // Add new order to the BEGINNING of the array
        orders.unshift(newOrder);

        // 4. Save back to Local Storage
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));

        // 5. Clear the Cart
        localStorage.removeItem(STORAGE_KEY_CART);
        
        // 6. Update Cart Count Badge (if it exists on page)
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = '0';

        return true; // Success
    } catch (error) {
        console.error("Failed to save order:", error);
        return false; // Failed
    }
}

// Close modal logic
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target == modal) {
        window.location.href = "ASN Store.html";
    }
}