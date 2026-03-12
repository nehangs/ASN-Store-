// webapp/my-orders.js

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

function loadOrders() {
    const STORAGE_KEY_ORDERS = 'asn_store_orders';
    const ordersList = document.getElementById('orders-list');

    // 1. Get orders from storage
    let orders = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
        orders = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Error loading orders:", e);
        orders = [];
    }

    // 2. Check if list element exists
    if (!ordersList) return;

    // 3. Clear current list
    ordersList.innerHTML = '';

    // 4. Handle Empty State
    if (orders.length === 0) {
        ordersList.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px;">You have no orders yet.</td></tr>`;
        return;
    }

    // 5. Render Orders
    orders.forEach(order => {
        // Handle missing status (treat as Processing)
        const currentStatus = order.status || 'Processing';
        const statusClass = getStatusColor(currentStatus);
        
        // Safety check for total
        const displayTotal = order.total ? order.total : '0.00';
        const displayId = order.orderId || 'Unknown';

        // --- BUTTON LOGIC ---
        // View Button
        let actionButtons = `<button class="btn-sm" onclick="viewOrderDetails('${displayId}')">View</button>`;
        
        // Cancel Button: Show if status is Processing (or missing)
        if (currentStatus === 'Processing') {
            actionButtons += ` 
                <button class="btn-sm" 
                        onclick="cancelOrder('${displayId}')" 
                        style="background-color: #dc3545; margin-left: 5px; color: white; border:none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                    Cancel
                </button>`;
        }

        let row = `
            <tr>
                <td data-label="Order ID">#${displayId}</td>
                <td data-label="Date">${order.date || '-'}</td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${currentStatus}</span></td>
                <td data-label="Total">₹${displayTotal}</td>
                <td data-label="Action" style="white-space: nowrap;">
                    ${actionButtons}
                </td>
            </tr>
        `;
        ordersList.innerHTML += row;
    });
}

function getStatusColor(status) {
    if (status === 'Delivered') return 'status-green';
    if (status === 'Cancelled') return 'status-red';
    return 'status-orange'; // Default to Processing
}

// --- EXPOSE FUNCTIONS TO WINDOW (Fixes "function not defined" errors) ---

window.cancelOrder = function(orderId) {
    // 1. Convert ID to string to be safe
    const targetId = String(orderId);

    if (!confirm("Are you sure you want to cancel Order #" + targetId + "?")) {
        return;
    }

    const STORAGE_KEY_ORDERS = 'asn_store_orders';
    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
    } catch(e) { return; }
    
    // 2. Find the order (strict string comparison)
    const orderIndex = orders.findIndex(o => String(o.orderId) === targetId);

    if (orderIndex > -1) {
        // 3. Update status
        orders[orderIndex].status = 'Cancelled';
        
        // 4. Save back to storage
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
        
        // 5. Refresh the UI immediately
        loadOrders();
    } else {
        alert("Order not found! Please refresh the page.");
    }
};

window.viewOrderDetails = function(orderId) {
    const STORAGE_KEY_ORDERS = 'asn_store_orders';
    let orders = JSON.parse(localStorage.getItem(STORAGE_KEY_ORDERS) || '[]');
    let order = orders.find(o => String(o.orderId) === String(orderId));

    if (order) {
        let itemDetails = "";
        if (order.items && order.items.length > 0) {
            itemDetails = order.items.map(i => `- ${i.quantity}x ${i.name}`).join('\n');
        } else {
            itemDetails = "No item details available.";
        }

        alert(`Order #${order.orderId}\nDate: ${order.date}\nStatus: ${order.status || 'Processing'}\n\nItems:\n${itemDetails}\n\nTotal: ₹${order.total}`);
    } else {
        alert("Order details not found.");
    }
};