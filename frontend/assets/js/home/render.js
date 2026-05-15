function renderCard(p) {
  const discountPrice = p.price - (p.price * p.discount / 100);
  
  const fmt = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Giả lập dữ liệu nếu thiếu để giống screenshot
  const location = p.location || ["Hà Nội", "TP. HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ"][p.id % 5];
  const stock = p.stock || 100;
  const initialStock = p.initialStock || (stock + (p.sold || 0)) || 100;
  const progress = Math.min(100, Math.round(((p.sold || 0) / initialStock) * 100)) || 10;
  const isLowStock = stock <= 10 && stock > 0;

  return `
  <div class="card" onclick="goProductDetail(${p.id})">
    <div class="img">
      <img src="${p.image || '../assets/img/placeholder.png'}" alt="${p.name}">
      ${p.discount > 0 ? `<div class="discount-badge">-${p.discount}%</div>` : `<div class="discount-badge">-0%</div>`}
    </div>

    <div class="card-content">
      <div class="card-title">${p.name}</div>
      
      <div class="price-box">
        <span class="old-price">${fmt(p.price)}</span>
        <span class="current-price">${fmt(discountPrice)}</span>
      </div>

      <div class="location-box">
        <i class="fa-solid fa-location-dot"></i> ${location}
        <span class="sold-text">Đã bán ${p.sold || 0}+</span>
      </div>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-info">
          <span>Còn ${stock} sản phẩm</span>
        </div>
      </div>

      ${isLowStock ? `<div class="stock-warning">🔥 Sắp cháy hàng! <br><small>Còn ${stock} sản phẩm</small></div>` : ''}

      <button class="add-to-cart-btn" onclick="event.stopPropagation(); handleAddToCart(${p.id})">
        Thêm vào giỏ
      </button>

      <div class="rating-bar">
        <i class="fa-solid fa-star"></i> 5
      </div>
    </div>
  </div>`;
}

function renderList(list, id){
  let html = "";
  if (!list || list.length === 0) {
    document.getElementById(id).innerHTML = "<p>Không có sản phẩm nào</p>";
    return;
  }

  let displayList = [];
  if (isPaginationActive[id]) {
    // Chế độ phân trang (sau khi nhấn Xem thêm)
    const start = (currentPage[id] - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    displayList = list.slice(start, end);
    
    // Ẩn nút Xem thêm
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.style.display = "none";
    
    // Hiện phân trang (luôn hiện khi ở chế độ phân trang để người dùng thấy thanh số trang)
    renderPagination(list.length, itemsPerPage, currentPage[id], id);
  } else {
    // Chế độ ban đầu (2 hàng x 5 sản phẩm = 10)
    displayList = list.slice(0, 10);
    
    // Hiện nút Xem thêm nếu còn sản phẩm
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.style.display = list.length > 10 ? "block" : "none";
    
    // Ẩn phân trang
    const pag = document.getElementById(`pagination-${id}`);
    if (pag) pag.innerHTML = "";
  }

  displayList.forEach(p=>{
    html += renderCard(p);
  });
  document.getElementById(id).innerHTML = html;
}

function renderPagination(totalItems, itemsPerPage, curPage, id) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const container = document.getElementById(`pagination-${id}`);
  if (!container) return;

  let html = `<div class="pagination">`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === curPage ? 'active' : ''}" 
              onclick="changePage('${id}', ${i})">${i}</button>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

function changePage(id, page) {
  currentPage[id] = page;
  initRender();
  // Cuộn lên đầu section
  const section = document.getElementById(`${id}-section`);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderSearchResult(list, id){
  let html = "";
  list.forEach(p=>{
    html += renderCard(p);
  });
  document.getElementById(id).innerHTML = html;
}

async function goFlash(){
  currentCategory = "FLASH";

  document.querySelector(".category-row").style.display = "none";
  document.querySelector(".banner").style.display = "none";

  document.getElementById("flash-section").style.display = "none";
  document.getElementById("best-section").style.display = "none";
  document.getElementById("recommend-section").style.display = "none";

  document.getElementById("category-section").style.display = "block";

  document.getElementById("category-title").innerHTML = `
    <div class="flash-title">
      <i class="fa-solid fa-bolt"></i> FLASH SALE
      <div class="flash-timer-box" id="flash-timer-page"></div>
    </div>
  `;

  // lọc từ mảng products toàn cục đã fetch
  let flash = products.filter(p => p.isFlashSale);

  let html = "";
  flash.forEach(p=>{
    html += renderCard(p);
  });

  document.getElementById("category-list").innerHTML = html;
  document.getElementById("searchInput").placeholder = "Tìm trong Flash Sale";

  if (flash.length) {
    startFlashSaleTimer(flash[0].flashSaleEnd, "flash-timer-page");
  }
}

async function initFlashSale() {
  // flashSale đã được fetch và gán vào products ở initRender
  let flash = products.filter(p => p.isFlashSale);

  if (!flash.length) return;

  renderFlashSale(flash);

  const flashSaleEnd = flash[0].flashSaleEnd || new Date(Date.now() + 3600000); // Mặc định 1h nếu ko có
  startFlashSaleTimer(flashSaleEnd);
}

function renderFlashSale(list){
  let html = "";
  list.slice(0, 15).forEach(p=>{
    html += renderCard(p);
  });
  document.getElementById("flash").innerHTML = html;
}

function initRender(){
  if (!products || products.length === 0) return;

  let flash = products.filter(p => p.isFlashSale);
  let best = [...products].sort((a,b)=> (b.sold || 0) - (a.sold || 0));
  let recommend = [...products].sort((a,b)=> (b.rating || 0) - (a.rating || 0));

  renderList(flash, "flash");
  renderList(best, "best");
  renderList(recommend, "recommend");
}

function goProductDetail(id) {
  const isInsidePages = window.location.pathname.includes('/pages/');
  const path = isInsidePages ? "product-detail.html" : "pages/product-detail.html";
  window.location.href = `${path}?id=${id}`;
}