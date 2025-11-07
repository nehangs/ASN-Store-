(() => {
  const STORAGE_KEY = 'asn_store_cart_v1';

  // --- Sample product data ---
  // Replace this array with dynamic data or fetch from a server/JSON file as needed.
  const PRODUCTS = [
    { id: 'p1', title: 'Classic T-Shirt', price: 399, category: 'Clothing', img: 'images/tshirt.jpg', desc: 'Comfortable cotton tee.' },
    { id: 'p2', title: 'Running Shoes', price: 2499, category: 'Footwear', img: 'images/shoes.jpg', desc: 'Lightweight running shoes.' },
    { id: 'p3', title: 'Wireless Headphones', price: 3499, category: 'Electronics', img: 'images/headphones.jpg', desc: 'Noise-cancelling, long battery.' },
    { id: 'p4', title: 'Denim Jacket', price: 1999, category: 'Clothing', img: 'images/jacket.jpg', desc: 'Stylish denim jacket.' },
    { id: 'p5', title: 'Coffee Mug', price: 249, category: 'Home', img: 'images/mug.jpg', desc: 'Ceramic mug 350ml.' }
  ];

  // --- App state ---
  let state = {
    products: PRODUCTS.slice(),
    filtered: PRODUCTS.slice(),
    cart: loadCart()
  };

  // --- Utils ---
  function formatPrice(p) { return ₹${p.toLocaleString()}; }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    renderCartCount();
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Could not load cart:', e);
      return {};
    }
  }

  function cartItemCount() {
    return Object.values(state.cart).reduce((s, v) => s + v.qty, 0);
  }

  // --- Rendering ---
  function renderProducts(products = state.filtered) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = products.map(p => productCardHTML(p)).join('');

    // Attach add-to-cart listeners
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        addToCart(id);
      });
    });
  }

  function productCardHTML(p) {
    return `
      <div class="product-card" data-id="${p.id}">
        <img src="${p.img}" alt="${escapeHtml(p.title)}" class="product-img" loading="lazy" />
        <h3 class="product-title">${escapeHtml(p.title)}</h3>
        <p class="product-desc">${escapeHtml(p.desc)}</p>
        <div class="product-meta">
          <strong class="product-price">${formatPrice(p.price)}</strong>
          <button class="add-to-cart-btn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    `;
  }

  function renderCartCount() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    el.textContent = cartItemCount();
  }

  function renderCartList() {
    const list = document.getElementById('cart-list');
    if (!list) return;

    const items = Object.values(state.cart);
    if (items.length === 0) {
      list.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
      return;
    }

    list.innerHTML = items.map(ci => {
      const p = state.products.find(x => x.id === ci.id) || {};
      return `
        <div class="cart-item" data-id="${ci.id}">
          <img src="${p.img || 'images/placeholder.png'}" class="cart-thumb" />
          <div class="cart-info">
            <div class="cart-title">${escapeHtml(p.title || ci.id)}</div>
            <div class="cart-controls">
              <button class="qty-decrease" data-id="${ci.id}">-</button>
              <span class="qty">${ci.qty}</span>
              <button class="qty-increase" data-id="${ci.id}">+</button>
              <span class="cart-price">${formatPrice((p.price||0) * ci.qty)}</span>
              <button class="remove-item" data-id="${ci.id}">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach cart controls
    list.querySelectorAll('.qty-increase').forEach(btn => btn.addEventListener('click', () => changeQty(btn.dataset.id, 1)));
    list.querySelectorAll('.qty-decrease').forEach(btn => btn.addEventListener('click', () => changeQty(btn.dataset.id, -1)));
    list.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', () => removeCartItem(btn.dataset.id)));
  }

  function renderCartTotals() {
    const subtotalEl = document.getElementById('cart-subtotal');
    if (!subtotalEl) return;
    const subtotal = Object.values(state.cart).reduce((s, it) => {
      const p = state.products.find(x => x.id === it.id) || { price: 0 };
      return s + (p.price || 0) * it.qty;
    }, 0);
    subtotalEl.textContent = formatPrice(subtotal);
  }

  // --- Cart operations ---
  function addToCart(id, qty = 1) {
    if (!state.cart[id]) state.cart[id] = { id, qty: 0 };
    state.cart[id].qty += qty;
    saveCart();
    renderCartCount();
    renderCartList();
    renderCartTotals();
    flashMessage('Added to cart');
  }

  function changeQty(id, delta) {
    if (!state.cart[id]) return;
    state.cart[id].qty += delta;
    if (state.cart[id].qty <= 0) delete state.cart[id];
    saveCart();
    renderCartList();
    renderCartTotals();
  }

  function removeCartItem(id) {
    delete state.cart[id];
    saveCart();
    renderCartList();
    renderCartTotals();
  }

  function clearCart() {
    state.cart = {};
    saveCart();
    renderCartList();
    renderCartTotals();
  }

  // --- Search / Filter / Sort ---
  function applyFilters() {
    const search = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    const category = (document.getElementById('category-select')?.value || '').trim();
    const sort = (document.getElementById('sort-select')?.value || '').trim();

    let out = state.products.slice();
    if (search) {
      out = out.filter(p => (p.title + ' ' + p.desc + ' ' + p.category).toLowerCase().includes(search));
    }
    if (category) {
      out = out.filter(p => p.category === category);
    }

    if (sort === 'price-asc') out.sort((a,b) => a.price - b.price);
    if (sort === 'price-desc') out.sort((a,b) => b.price - a.price);

    state.filtered = out;
    renderProducts(out);
  }

  // --- Checkout (simulation) ---
  function bindCheckout() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // basic validation
      const name = form.querySelector('[name="name"]').value.trim();
      const phone = form.querySelector('[name="phone"]').value.trim();
      const addr = form.querySelector('[name="address"]').value.trim();
      if (!name || !phone || !addr) {
        flashMessage('Please fill all required fields');
        return;
      }
      // create a simple order summary
      const order = {
        id: 'ORD' + Date.now(),
        items: Object.values(state.cart),
        total: Object.values(state.cart).reduce((s,it) => {
          const p = state.products.find(x => x.id === it.id) || { price: 0 };
          return s + (p.price||0) * it.qty;
        }, 0),
        customer: { name, phone, addr }
      };
      // In a real app, you'd POST this to server. Here we simulate success.
      console.log('Order created', order);
      clearCart();
      form.reset();
      flashMessage('Order placed! ' + order.id);
    });
  }

  // --- Small niceties ---
  function flashMessage(msg, duration = 2000) {
    let el = document.getElementById('asn-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'asn-flash';
      el.style.position = 'fixed';
      el.style.right = '16px';
      el.style.bottom = '16px';
      el.style.padding = '10px 14px';
      el.style.background = 'rgba(0,0,0,0.8)';
      el.style.color = '#fff';
      el.style.borderRadius = '8px';
      el.style.zIndex = 9999;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => el.style.opacity = '0', duration);
  }

  function escapeHtml(s='') {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }

  // --- Init / binding UI controls ---
  function initASNStore() {
    // Populate categories in select if available
    const categories = Array.from(new Set(state.products.map(p => p.category)));
    const catSelect = document.getElementById('category-select');
    if (catSelect) {
      catSelect.innerHTML = '<option value="">All categories</option>' + categories.map(c=><option value="${escapeHtml(c)}">${escapeHtml(c)}</option>).join('');
      catSelect.addEventListener('change', applyFilters);
    }

    const search = document.getElementById('search-input');
    if (search) search.addEventListener('input', debounce(applyFilters, 250));

    const sort = document.getElementById('sort-select');
    if (sort) sort.addEventListener('change', applyFilters);

    // Cart open/close
    document.getElementById('open-cart')?.addEventListener('click', () => {
      document.getElementById('cart-modal')?.classList.add('open');
      renderCartList();
      renderCartTotals();
    });
    document.querySelectorAll('.close-cart').forEach(el => el.addEventListener('click', () => document.getElementById('cart-modal')?.classList.remove('open')));

    // Bind cart actions
    renderProducts();
    renderCartCount();
    renderCartList();
    renderCartTotals();
    bindCheckout();
  }

  // small debounce helper
  function debounce(fn, wait=200){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  // Expose to global so HTML can call initASNStore() after DOM loads
  window.initASNStore = initASNStore;
  // also expose some useful helpers (optional)
  window.asnStore = { addToCart, clearCart, state };

})();