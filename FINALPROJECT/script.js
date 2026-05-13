// ZZMHUB Laptop Store - Global JavaScript

// ===== AUTHENTICATION =====
const AUTH_USERS = {
    'user': { password: 'user', role: 'user', name: 'User' },
    'admin': { password: 'admin', role: 'admin', name: 'Admin' },
    'superadmin': { password: 'superadmin', role: 'superadmin', name: 'Super Admin' }
};

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('zzmhub_user'));
    } catch (e) {
        return null;
    }
}

function initAuth() {
    const currentUser = getCurrentUser();
    updateHeaderForUser(currentUser);
}

function updateHeaderForUser(user) {
    const loginArea = document.getElementById('login-area');
    if (!loginArea) return;

    if (user) {
        let dashboardLink = '';
        if (user.role === 'user') {
            dashboardLink = '<a href="promos.html" class="btn-login">Promos</a>';
        } else if (user.role === 'admin') {
            dashboardLink = '<a href="admin-dashboard.html" class="btn-login">Dashboard</a>';
        } else if (user.role === 'superadmin') {
            dashboardLink = '<a href="superadmin-dashboard.html" class="btn-login">Dashboard</a>';
        }

        loginArea.innerHTML = `
            <span class="user-greeting">Hi, ${user.name}</span>
            ${dashboardLink}
            <button onclick="logout()" class="btn-login">Logout</button>
        `;
    } else {
        loginArea.innerHTML = `<a href="login.html" class="btn-login">Login / Register</a>`;
    }
}

function login(email, password) {
    const user = AUTH_USERS[email.toLowerCase()];
    if (user && user.password === password) {
        const session = {
            email: email.toLowerCase(),
            name: user.name,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('zzmhub_user', JSON.stringify(session));
        return { success: true, role: user.role };
    }
    return { success: false, message: 'Invalid email or password' };
}

function logout() {
    localStorage.removeItem('zzmhub_user');
    localStorage.removeItem('zzmhub_cart');
    window.location.href = 'index.html';
}

// ===== CART FUNCTIONS (REQUIRE LOGIN) =====
function getCart() {
    const user = getCurrentUser();
    if (!user) return [];
    try {
        const allCarts = JSON.parse(localStorage.getItem('zzmhub_carts')) || {};
        return allCarts[user.email] || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    const user = getCurrentUser();
    if (!user) return;
    try {
        const allCarts = JSON.parse(localStorage.getItem('zzmhub_carts')) || {};
        allCarts[user.email] = cart;
        localStorage.setItem('zzmhub_carts', JSON.stringify(allCarts));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

function addToCart(productName, price) {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to add items to your cart.');
        window.location.href = 'login.html';
        return;
    }

    if (user.role !== 'user') {
        alert('Only customer accounts can use the cart. Please log in as a user.');
        return;
    }

    const cart = getCart();
    const existing = cart.find(item => item.name === productName);
    if (existing) {
        existing.qty = parseInt(existing.qty) + 1;
    } else {
        cart.push({ name: productName, price: parseFloat(price), qty: 1 });
    }
    saveCart(cart);
    updateCartDisplay();
    alert(productName + ' added to cart!');
}

function removeFromCart(productName) {
    let cart = getCart();
    cart = cart.filter(item => item.name !== productName);
    saveCart(cart);
    updateCartDisplay();
    if (document.getElementById('cart-items-body')) {
        renderCartPage();
    }
}

function updateCartQty(productName, newQty) {
    const cart = getCart();
    const item = cart.find(item => item.name === productName);
    if (item) {
        if (newQty <= 0) {
            removeFromCart(productName);
            return;
        }
        item.qty = parseInt(newQty);
        saveCart(cart);
        updateCartDisplay();
        if (document.getElementById('cart-items-body')) {
            renderCartPage();
        }
    }
}

function clearCart() {
    const user = getCurrentUser();
    if (!user) return;
    const allCarts = JSON.parse(localStorage.getItem('zzmhub_carts')) || {};
    delete allCarts[user.email];
    localStorage.setItem('zzmhub_carts', JSON.stringify(allCarts));
    updateCartDisplay();
    if (document.getElementById('cart-items-body')) {
        renderCartPage();
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.qty)), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + parseInt(item.qty), 0);
}

function updateCartDisplay() {
    const count = getCartCount();
    const total = getCartTotal();

    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');

    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = '\u20b1 ' + total.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// ===== CART PAGE RENDER =====
function renderCartPage() {
    const tbody = document.getElementById('cart-items-body');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total-amount');
    const emptyMsg = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    const loginPrompt = document.getElementById('cart-login-prompt');

    const user = getCurrentUser();
    const cart = getCart();

    if (!user) {
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (emptyMsg) emptyMsg.style.display = 'none';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }

    if (loginPrompt) loginPrompt.style.display = 'none';

    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';

    if (tbody) {
        tbody.innerHTML = cart.map(item => {
            const itemPrice = parseFloat(item.price);
            const itemQty = parseInt(item.qty);
            const itemTotal = itemPrice * itemQty;
            const safeName = item.name.replace(/'/g, "\\'");
            return `
            <tr>
                <td style="padding:14px 18px;border:1px solid var(--border-color);">
                    <strong style="color:var(--text-primary);">${item.name}</strong>
                </td>
                <td style="padding:14px 18px;border:1px solid var(--border-color);text-align:right;">
                    \u20b1 ${itemPrice.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2})}
                </td>
                <td style="padding:14px 18px;border:1px solid var(--border-color);text-align:center;">
                    <button onclick="updateCartQty('${safeName}', ${itemQty - 1})" style="border:1px solid var(--border-color);background:var(--bg-secondary);width:32px;height:32px;cursor:pointer;font-weight:700;color:var(--text-primary);border-radius:6px;transition:all 0.3s;" onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='var(--border-color)'">-</button>
                    <span style="margin:0 12px;font-weight:700;color:var(--text-primary);">${itemQty}</span>
                    <button onclick="updateCartQty('${safeName}', ${itemQty + 1})" style="border:1px solid var(--border-color);background:var(--bg-secondary);width:32px;height:32px;cursor:pointer;font-weight:700;color:var(--text-primary);border-radius:6px;transition:all 0.3s;" onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='var(--border-color)'">+</button>
                </td>
                <td style="padding:14px 18px;border:1px solid var(--border-color);text-align:right;font-weight:700;color:var(--accent-cyan);">
                    \u20b1 ${itemTotal.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2})}
                </td>
                <td style="padding:14px 18px;border:1px solid var(--border-color);text-align:center;">
                    <button onclick="removeFromCart('${safeName}')" style="border:1px solid var(--danger);background:var(--bg-secondary);color:var(--danger);padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;border-radius:6px;transition:all 0.3s;" onmouseover="this.style.background='var(--danger)';this.style.color='#fff'" onmouseout="this.style.background='var(--bg-secondary)';this.style.color='var(--danger)'">Remove</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    const subtotal = getCartTotal();
    const shipping = subtotal > 5000 ? 0 : 150;
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = '\u20b1 ' + subtotal.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : '\u20b1 ' + shipping.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (totalEl) totalEl.textContent = '\u20b1 ' + total.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// ===== CHECKOUT / PAYMENT =====
function initCheckout() {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') {
        alert('Please log in as a user to checkout.');
        window.location.href = 'login.html';
        return;
    }

    const cart = getCart();

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    const subtotal = getCartTotal();
    const shipping = subtotal > 5000 ? 0 : 150;
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');
    const itemsList = document.getElementById('checkout-items');

    if (subtotalEl) subtotalEl.textContent = '\u20b1 ' + subtotal.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE (Orders over \u20b15,000)' : '\u20b1 ' + shipping.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (totalEl) totalEl.textContent = '\u20b1 ' + total.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});

    if (itemsList) {
        itemsList.innerHTML = cart.map(item => {
            const itemTotal = parseFloat(item.price) * parseInt(item.qty);
            return `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color);">
                <span style="color:var(--text-secondary);">${item.name} x${item.qty}</span>
                <span style="font-weight:700;color:var(--accent-cyan);">\u20b1 ${itemTotal.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            `;
        }).join('');
    }

    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const paymentMethod = document.querySelector('input[name="payment"]:checked');
            if (!paymentMethod) {
                alert('Please select a payment method.');
                return;
            }

            const orderId = 'ORD-' + Date.now().toString().slice(-6);
            localStorage.setItem('zzmhub_last_order', JSON.stringify({
                orderId: orderId,
                items: cart,
                total: total,
                date: new Date().toISOString(),
                payment: paymentMethod.value
            }));

            clearCart();
            window.location.href = 'order-success.html';
        });
    }
}

// ===== LOGIN PAGE FUNCTIONS =====
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    const user = getCurrentUser();
    if (user) {
        if (user.role === 'user') window.location.href = 'promos.html';
        else if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
        else if (user.role === 'superadmin') window.location.href = 'superadmin-dashboard.html';
        return;
    }

    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const signupForm = document.getElementById('signup-form');

    if (loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            document.getElementById('error-msg').style.display = 'none';
        });
    }

    if (signupTab) {
        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            document.getElementById('error-msg').style.display = 'none';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const result = login(email, password);

            if (result.success) {
                if (result.role === 'user') window.location.href = 'promos.html';
                else if (result.role === 'admin') window.location.href = 'admin-dashboard.html';
                else if (result.role === 'superadmin') window.location.href = 'superadmin-dashboard.html';
            } else {
                const errorMsg = document.getElementById('error-msg');
                errorMsg.textContent = result.message;
                errorMsg.style.display = 'block';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorMsg = document.getElementById('error-msg');
            errorMsg.textContent = 'Registration is currently disabled. Please use demo accounts.';
            errorMsg.style.display = 'block';
        });
    }
}

// ===== ACTIVE NAV LINK =====
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ===== DASHBOARD FUNCTIONS =====
function initDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const userNameEl = document.getElementById('dashboard-user');
    if (userNameEl) userNameEl.textContent = user.name;

    const analytics = {
        totalSales: '\u20b1 1,245,890.00',
        totalOrders: 342,
        totalCustomers: 128,
        totalProducts: 56,
        salesGrowth: '+12.5%',
        ordersGrowth: '+8.3%',
        customersGrowth: '+15.2%',
        productsGrowth: '+3.1%'
    };

    const statValues = document.querySelectorAll('.stat-value');
    const statChanges = document.querySelectorAll('.stat-change');

    if (statValues.length >= 4) {
        statValues[0].textContent = analytics.totalSales;
        statValues[1].textContent = analytics.totalOrders;
        statValues[2].textContent = analytics.totalCustomers;
        statValues[3].textContent = analytics.totalProducts;
    }

    if (statChanges.length >= 4) {
        statChanges[0].textContent = analytics.salesGrowth + ' from last month';
        statChanges[1].textContent = analytics.ordersGrowth + ' from last month';
        statChanges[2].textContent = analytics.customersGrowth + ' from last month';
        statChanges[3].textContent = analytics.productsGrowth + ' from last month';
    }
}

function initUserManagement() {
    const demoUsers = [
        { id: 1, name: 'Juan Dela Cruz', email: 'juan@email.com', role: 'Customer', status: 'Active', joined: '2026-01-15' },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', role: 'Customer', status: 'Active', joined: '2026-02-20' },
        { id: 3, name: 'Pedro Reyes', email: 'pedro@email.com', role: 'Customer', status: 'Inactive', joined: '2026-03-10' },
        { id: 4, name: 'Ana Garcia', email: 'ana@email.com', role: 'Customer', status: 'Active', joined: '2026-04-05' },
    ];

    const tbody = document.getElementById('users-table-body');
    if (tbody) {
        tbody.innerHTML = demoUsers.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span style="background:var(--success);color:#000;padding:4px 10px;font-size:12px;font-weight:700;border-radius:4px;">${user.status}</span></td>
                <td>${user.joined}</td>
                <td>
                    <button class="btn-small">Edit</button>
                    <button class="btn-small btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

function initAccountManagement() {
    const demoAccounts = [
        { id: 1, name: 'Juan Dela Cruz', email: 'juan@email.com', role: 'Customer', status: 'Active', joined: '2026-01-15' },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', role: 'Customer', status: 'Active', joined: '2026-02-20' },
        { id: 3, name: 'Pedro Reyes', email: 'pedro@email.com', role: 'Customer', status: 'Inactive', joined: '2026-03-10' },
        { id: 4, name: 'Ana Garcia', email: 'ana@email.com', role: 'Customer', status: 'Active', joined: '2026-04-05' },
        { id: 5, name: 'Admin User', email: 'admin', role: 'Admin', status: 'Active', joined: '2025-12-01' },
    ];

    const tbody = document.getElementById('accounts-table-body');
    if (tbody) {
        tbody.innerHTML = demoAccounts.map(acc => `
            <tr>
                <td>${acc.id}</td>
                <td>${acc.name}</td>
                <td>${acc.email}</td>
                <td><span style="color:var(--accent-cyan);font-weight:700;">${acc.role}</span></td>
                <td><span style="background:var(--success);color:#000;padding:4px 10px;font-size:12px;font-weight:700;border-radius:4px;">${acc.status}</span></td>
                <td>${acc.joined}</td>
                <td>
                    <button class="btn-small">Edit</button>
                    <button class="btn-small btn-danger">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            form.reset();
        });
    }
}

// ===== CATEGORY FILTER =====
function initCategoryFilter() {
    const categories = document.querySelectorAll('.category-list li');
    categories.forEach(cat => {
        cat.addEventListener('click', function() {
            categories.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ===== ORDER SUCCESS =====
function initOrderSuccess() {
    const orderData = JSON.parse(localStorage.getItem('zzmhub_last_order'));
    if (!orderData) {
        window.location.href = 'index.html';
        return;
    }

    const orderIdEl = document.getElementById('success-order-id');
    const orderTotalEl = document.getElementById('success-order-total');
    const orderDateEl = document.getElementById('success-order-date');
    const orderPaymentEl = document.getElementById('success-order-payment');
    const itemsList = document.getElementById('success-items');

    if (orderIdEl) orderIdEl.textContent = orderData.orderId;
    if (orderTotalEl) orderTotalEl.textContent = '\u20b1 ' + orderData.total.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (orderDateEl) orderDateEl.textContent = new Date(orderData.date).toLocaleDateString('en-PH');
    if (orderPaymentEl) orderPaymentEl.textContent = orderData.payment;

    if (itemsList && orderData.items) {
        itemsList.innerHTML = orderData.items.map(item => {
            const itemTotal = parseFloat(item.price) * parseInt(item.qty);
            return `
            <div style="display:flex;justify-content:space-between;padding:8px 0;">
                <span style="color:var(--text-secondary);">${item.name} x${item.qty}</span>
                <span style="font-weight:700;color:var(--accent-cyan);">\u20b1 ${itemTotal.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            `;
        }).join('');
    }
}

// ===== PAGE AUTH PROTECTION =====
function initPageProtection() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const user = getCurrentUser();

    const protectedPages = {
        'promos.html': 'user',
        'admin-dashboard.html': 'admin',
        'admin-users.html': 'admin',
        'admin-products.html': 'admin',
        'admin-orders.html': 'admin',
        'superadmin-dashboard.html': 'superadmin',
        'superadmin-accounts.html': 'superadmin',
        'superadmin-products.html': 'superadmin',
        'superadmin-orders.html': 'superadmin',
        'superadmin-settings.html': 'superadmin'
    };

    const requiredRole = protectedPages[currentPage];
    if (!requiredRole) return;

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (requiredRole === 'user' && user.role !== 'user') {
        window.location.href = 'index.html';
        return;
    }
    if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'superadmin') {
        window.location.href = 'index.html';
        return;
    }
    if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
        window.location.href = 'index.html';
        return;
    }
}

// ===== INITIALIZE ON DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    setActiveNav();
    updateCartDisplay();
    initLoginPage();
    initContactForm();
    initCategoryFilter();
    initPageProtection();

    if (document.getElementById('dashboard-user')) {
        initDashboard();
    }
    if (document.getElementById('users-table-body')) {
        initUserManagement();
    }
    if (document.getElementById('accounts-table-body')) {
        initAccountManagement();
    }
    if (document.getElementById('cart-items-body')) {
        renderCartPage();
    }
    if (document.getElementById('checkout-form')) {
        initCheckout();
    }
    if (document.getElementById('success-order-id')) {
        initOrderSuccess();
    }
})


// ===== PAGE TRANSITIONS =====
(function() {
    // Add exit animation when clicking internal links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Skip external links, anchors, javascript, mailto, tel
        if (href.startsWith('#') || 
            href.startsWith('javascript') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') ||
            href.startsWith('http') && !href.includes(window.location.hostname)) {
            return;
        }

        // Skip if modifier keys are pressed (Ctrl, Cmd, Shift)
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        e.preventDefault();

        // Add exit animation
        document.body.style.animation = 'pageExit 0.25s cubic-bezier(0.55, 0, 1, 0.45) forwards';
        document.body.style.pointerEvents = 'none';

        // Navigate after animation
        setTimeout(function() {
            window.location.href = href;
        }, 250);
    });

    // Handle browser back/forward buttons - ensure smooth re-entry
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            // Page was loaded from cache (back/forward)
            document.body.style.animation = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.animation = 'pageEnter 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';
            document.body.style.pointerEvents = 'auto';
        }
    });
})();