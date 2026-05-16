const BF = window.ECommerce;
let currentProduct = null;
let products = []; // To store for related products logic

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = "../home.html";
        return;
    }

    await loadProductDetail(productId);
    BF.renderUserHeader();
    initUserUI();
    initLogout();
});

function initUserUI() {
    const token = BF.getToken();
    const user = BF.getUser();

    const loginBtn = document.getElementById("loginBtn");
    const wrapper = document.getElementById("userActionsWrapper");
    const avatar = document.getElementById("userAvatar");

    if (token && user && user.name) {
        if (loginBtn) loginBtn.classList.add("hidden");
        if (wrapper) {
            wrapper.classList.remove("hidden");
            wrapper.style.display = "flex";
        }
        if (avatar) avatar.src = user.avatar || "img/default-avatar.png";
    } else {
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (wrapper) {
            wrapper.classList.add("hidden");
            wrapper.style.display = "none";
        }
    }
}

function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => BF.logout());
    }
}

async function loadProductDetail(id) {
    try {
        // Fetch all products or a specific one if backend supports it
        // For simplicity with existing frontend logic, we fetch all and find
        const data = await BF.apiRequest("/api/flashsale/products", { auth: false });
        products = Array.isArray(data.data) ? data.data : [];
        currentProduct = products.find(p => p.id == id);

        if (!currentProduct) {
            alert("Sản phẩm không tồn tại!");
            window.location.href = "../home.html";
            return;
        }

        renderProduct(currentProduct);
        renderRelated(products, currentProduct.category);
    } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
    }
}

function renderProduct(p) {
    const discountPrice = p.price - (p.price * p.discount / 100);
    const fmt = BF.formatCurrency;

    // Breadcrumb
    document.querySelector('.breadcrumb-item.active').textContent = p.name;
    const catLink = document.querySelector('.breadcrumb-item:nth-child(2) a');
    catLink.textContent = p.category || "Điện tử";
    catLink.href = `../home.html?category=${encodeURIComponent(p.category || "Điện tử")}`;

    // Images
    const mainImg = document.getElementById('mainImg');
    mainImg.src = p.image || '../assets/img/placeholder.png';
    
    const thumbList = document.querySelector('.thumb-list');
    // Using main image as first thumb
    thumbList.innerHTML = `
        <div class="thumb-item active" onclick="changeImg(this, '${p.image}')">
            <img src="${p.image}">
        </div>
        <div class="thumb-item" onclick="changeImg(this, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500')">
            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500">
        </div>
    `;

    // Content
    document.querySelector('.product-title').textContent = p.name;
    document.querySelector('.current-price').textContent = fmt(discountPrice);
    
    const oldPriceEl = document.querySelector('.old-price');
    const badgeEl = document.querySelector('.discount-badge');
    if (p.discount > 0) {
        oldPriceEl.style.display = 'inline';
        oldPriceEl.textContent = fmt(p.price);
        badgeEl.style.display = 'inline';
        badgeEl.textContent = `-${p.discount}% OFF`;
    } else {
        oldPriceEl.style.display = 'none';
        badgeEl.style.display = 'none';
    }

    // Rating & Sold
    renderRatingStars(p.rating || 5);
    document.getElementById('reviewCount').textContent = p.reviewCount || "0";
    document.getElementById('soldCount').textContent = p.sold || "0";

    // Stock & Meta
    document.querySelector('.text-muted.mb-0 b').textContent = p.location || "TP. Hồ Chí Minh";
    const stockText = document.querySelector('.d-flex.align-items-center .text-muted');
    if (stockText) stockText.textContent = `${p.stock || 0} sản phẩm có sẵn`;

    // Description
    const descTab = document.querySelector('#desc-tab p');
    if (descTab) descTab.textContent = p.description || "Thông tin sản phẩm đang được cập nhật...";

    // Action Buttons
    const addBtn = document.querySelector('.btn-add-cart');
    const buyBtn = document.querySelector('.btn-buy-now');

    addBtn.onclick = () => addToCartDetail();
    buyBtn.onclick = () => buyNowDetail();
}

function renderRatingStars(rating) {
    const container = document.getElementById('ratingStars');
    if (!container) return;

    let html = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fa-solid fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            html += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            html += '<i class="fa-regular fa-star"></i>';
        }
    }
    html += `<span class="ms-1" style="color: var(--primary-red); font-weight: 600;">${rating}</span>`;
    container.innerHTML = html;
}

function renderRelated(all, category) {
    const related = all.filter(p => p.category === category && p.id != currentProduct.id).slice(0, 4);
    const container = document.getElementById('relatedProducts');
    
    if (related.length === 0) {
        container.innerHTML = "<p class='text-muted px-3'>Không có sản phẩm liên quan</p>";
        return;
    }

    container.innerHTML = related.map(p => renderCard(p)).join("");
}

function handleAddToCart(id) {
    // Re-use logic for related product cards
    const p = products.find(x => x.id == id);
    if (p) addToCartManual(p);
}

function addToCartManual(p) {
    if (!BF.requireAuth()) return;
    const cart = BF.readCart();
    const existingItem = cart.find(item => item.id == p.id);
    if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
        BF.saveCart(cart);
        BF.renderUserHeader();
        alert(`Đã tăng số lượng ${p.name} trong giỏ hàng!`);
        return;
    }
    const discountPrice = p.price - (p.price * p.discount / 100);
    cart.push({
        id: p.id,
        name: p.name,
        price: discountPrice,
        image: p.image,
        stock: p.stock,
        quantity: 1
    });
    BF.saveCart(cart);
    BF.renderUserHeader();
    alert("Đã thêm vào giỏ hàng!");
}

function addToCartDetail() {
    if (!BF.requireAuth()) return;
    
    const cart = BF.readCart();
    const qty = parseInt(document.getElementById('qtyVal').value) || 1;
    const existingItem = cart.find(item => item.id == currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 1) + qty;
        BF.saveCart(cart);
        BF.renderUserHeader();
        alert(`Đã thêm thêm ${qty} sản phẩm vào giỏ hàng!`);
        return;
    }
    const discountPrice = currentProduct.price - (currentProduct.price * currentProduct.discount / 100);

    cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: discountPrice,
        image: currentProduct.image,
        stock: currentProduct.stock,
        quantity: qty
    });

    BF.saveCart(cart);
    BF.renderUserHeader();
    alert("Đã thêm vào giỏ hàng!");
}

function buyNowDetail() {
    if (!BF.requireAuth()) return;
    
    // Simple logic: add to cart then go to cart page
    const cart = BF.readCart();
    if (!cart.some(item => item.id == currentProduct.id)) {
        const qty = parseInt(document.getElementById('qtyVal').value);
        const discountPrice = currentProduct.price - (currentProduct.price * currentProduct.discount / 100);
        
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: discountPrice,
            image: currentProduct.image,
            stock: currentProduct.stock,
            quantity: qty
        });
        BF.saveCart(cart);
    }
    
    window.location.href = "cart.html";
}
