function filterCategory(cat, event){

  currentCategory = cat;

  document.querySelectorAll('.category')
    .forEach(c=>c.classList.remove('active'));

  if(event){
    event.currentTarget.classList.add('active');
  }

  document.getElementById("searchInput").placeholder = "Tìm trong " + categoryName[cat];

  document.getElementById("flash-section").style.display = "none";
  document.getElementById("best-section").style.display = "none";
  document.getElementById("recommend-section").style.display = "none";

  document.getElementById("category-section").style.display = "block";
  document.getElementById("category-title").innerText = categoryName[cat];

  let filtered = products.filter(p => p.category === categoryName[cat] || p.category === cat);

  let html = "";

  filtered.forEach(p=>{
    html += renderCard(p);
  });

  document.getElementById("category-list").innerHTML = html;
}

function loadMore(type){
  isPaginationActive[type] = true; // Kích hoạt chế độ phân trang

  if(currentCategory === "FLASH"){
    goFlash();
  }
  else if(currentCategory){
    filterCategory(currentCategory);
  }else{
    initRender();
  }
}

function goHome(){
  // reset trạng thái
  currentCategory = null;

  // reset số lượng hiển thị
  limit = {
    flash: 15,
    best: 15,
    recommend: 15
  };

  currentPage = {
    best: 1,
    recommend: 1
  };

  isPaginationActive = {
    best: false,
    recommend: false,
    flash: false
  };

  // hiện lại category + banner + 3 section
  document.querySelector(".category-row").style.display = "flex";
  document.querySelector(".banner").style.display = "";

  document.getElementById("flash-section").style.display = "block";
  document.getElementById("best-section").style.display = "block";
  document.getElementById("recommend-section").style.display = "block";

  // ẩn khu vực category/flash riêng
  document.getElementById("category-section").style.display = "none";

  // bỏ active category
  document.querySelectorAll('.category')
    .forEach(c=>c.classList.remove('active'));

  // reset search
  document.getElementById("searchInput").value = "";
  document.getElementById("searchInput").placeholder = "Tìm kiếm sản phẩm...";

  // dừng timer flash nếu có
  if(window.flashInterval){
    clearInterval(window.flashInterval);
  }

  initRender();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}