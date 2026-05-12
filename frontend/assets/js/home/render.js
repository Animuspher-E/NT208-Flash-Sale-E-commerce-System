function renderCard(p){
  let price = p.price - (p.price * p.discount / 100);

  let formatPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);

  return `
  <a href="#" class="card" onclick="handleAddToCart(${p.id}); return false;">
    <div class="img">
      <img src="${p.image || '../assets/img/placeholder.png'}" alt="${p.name}">
      ${p.discount > 0 ? `<div class="discount-badge">-${p.discount}%</div>` : ''}
    </div>

    <div class="card-content">
      <div class="card-title">
        <span class="badge-yt">Yêu thích</span>${p.name}
      </div>

      <div class="card-tags">
        <span class="tag-item">Rẻ Vô Địch</span>
      </div>

      <div class="card-bottom">
        <div class="card-price">${formatPrice}</div>
        <div class="card-sold">${p.sold >= 1000 ? (p.sold/1000).toFixed(1)+'k' : (p.sold || 0)} đã bán</div>
      </div>
    </div>
  </a>`;
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
    // Chế độ ban đầu (3 dòng)
    displayList = list.slice(0, 15);
    
    // Hiện nút Xem thêm nếu còn sản phẩm
    const btn = document.getElementById(`btn-${id}`);
    if (btn) btn.style.display = list.length > 15 ? "block" : "none";
    
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
      FLASH SALE
      <div class="flash-timer" id="flash-timer"></div>
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
    startFlashSaleTimer(flash[0].flashSaleEnd);
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