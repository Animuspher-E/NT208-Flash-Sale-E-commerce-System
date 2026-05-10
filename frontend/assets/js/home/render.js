function renderCard(p){
  let price = p.price - (p.price * p.discount / 100);

  let formatPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);

  let oldPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(p.price);

  return `
  <div class="card">
    <div class="img">
      <img src="${p.image || '../assets/img/placeholder.png'}" alt="${p.name}">
      <div class="discount-badge">-${p.discount}%</div>
    </div>

    <h4>${p.name}</h4>
    <div class="old">${oldPrice}</div>
    <div class="new">${formatPrice}</div>

    <div class="meta">
      <small class="location">
        <i class="fa-solid fa-location-dot"></i> ${p.location || 'Toàn quốc'}
      </small>
      <small class="sold">
        Đã bán ${p.sold >= 1000 ? (p.sold/1000).toFixed(1)+'k' : (p.sold || 0)}+
      </small>
    </div>

    <div class="stock-bar">
      <div class="stock-fill" style="width:${Math.min(((p.stock || 0) / 100) * 100, 100)}%"></div>
    </div>

    ${(p.stock || 0) <= 15 ? `<div class="danger">⚡ Sắp cháy hàng!</div>` : ``}

    <small class="stock-text">Còn ${p.stock || 0} sản phẩm</small>

    <button class="btn ${(p.stock || 0)==0?'out':''}"
      onclick="handleAddToCart(${p.id})"
      ${(p.stock || 0)==0?'disabled':''}>
      ${(p.stock || 0)==0?'Hết hàng':'Thêm vào giỏ'}
    </button>

    <div class="rating-box">
      <i class="fa-solid fa-star"></i>
      ${p.rating || 5.0}
    </div>
  </div>`;
}

function renderList(list, id){
  let html = "";
  if (!list || list.length === 0) {
    document.getElementById(id).innerHTML = "<p>Không có sản phẩm nào</p>";
    return;
  }
  list.slice(0, limit[id]).forEach(p=>{
    html += renderCard(p);
  });
  document.getElementById(id).innerHTML = html;
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
  let flash = products.filter(p => p.discount >= 25);

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
  let flash = products.filter(p => p.discount >= 25);

  if (!flash.length) return;

  renderFlashSale(flash);

  const flashSaleEnd = flash[0].flashSaleEnd || new Date(Date.now() + 3600000); // Mặc định 1h nếu ko có
  startFlashSaleTimer(flashSaleEnd);
}

function renderFlashSale(list){
  let html = "";
  list.slice(0, 6).forEach(p=>{
    html += renderCard(p);
  });
  document.getElementById("flash").innerHTML = html;
}

function initRender(){
  if (!products || products.length === 0) return;

  let flash = products.filter(p => p.discount >= 25);
  let best = [...products].sort((a,b)=> (b.sold || 0) - (a.sold || 0));
  let recommend = [...products].sort((a,b)=> (b.rating || 0) - (a.rating || 0));

  renderList(flash.slice(0, 6), "flash");
  renderList(best, "best");
  renderList(recommend, "recommend");
}