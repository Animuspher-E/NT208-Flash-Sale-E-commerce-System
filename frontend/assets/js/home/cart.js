function getPagePath(pageName) {
  // Kiểm tra xem có đang ở trong thư mục pages không
  const isInsidePages = window.location.pathname.includes('/pages/');
  return isInsidePages ? pageName : `pages/${pageName}`;
}

function getCartKey(){
  return "cart"; // Đồng bộ với hệ thống giỏ hàng flash sale (auth-cart-orders-common.js)
}

function loadCart(){
  try {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
  } catch {
    return [];
  }
}

function saveCart(cart){
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

function add(id){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(!token){
    window.location.href = getPagePath("auth.html");
    return;
  }

  let cart = loadCart(); 
  const existingItem = cart.find(item => Number(item.id) === Number(id));

  if (existingItem) {
    existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
    saveCart(cart);
    updateCartUI();
    alert(`Đã tăng số lượng ${existingItem.name || "sản phẩm"} trong giỏ hàng.`);
    return;
  }

  const product = (typeof products !== 'undefined') ? products.find(p => Number(p.id) === Number(id)) : null;

  if (product) {
    if (Number(product.stock || 0) <= 0) {
      alert("Sản phẩm đã hết hàng.");
      return;
    }
    
    const discount = Number(product.discount || 0);
    const finalPrice = product.price - (product.price * discount / 100);

    cart.push({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      stock: product.stock,
      quantity: 1
    });
  } else {
    // Dự phòng nếu không tìm thấy thông tin sản phẩm
    cart.push({
      id: id,
      quantity: 1 
    });
  }

  saveCart(cart);
  updateCartUI();
  alert("Đã thêm sản phẩm vào giỏ hàng.");
}

function updateCartUI(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
  const ids = ["cart", "cartCount"];
  
  if (!token) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerText = "0";
    });
    return;
  }

  const cart = loadCart();
  // Đếm theo số loại sản phẩm (mỗi loại tính là 1)
  let total = cart.length;

  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerText = total;
  });
}

function viewCart(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(!token){
    window.location.href = getPagePath("auth.html");
    return;
  }

  window.location.href = getPagePath("cart.html");
}

window.addEventListener("storage", function(e){
  if(e.key === "cart"){
    updateCartUI();
  }
});

window.addEventListener("cartUpdated", updateCartUI);

window.addEventListener("DOMContentLoaded", function(){
  updateCartUI();
});