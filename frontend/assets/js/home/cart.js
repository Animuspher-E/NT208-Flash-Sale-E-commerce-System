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
    window.location.href = "auth.html";
    return;
  }

  let cart = loadCart(); 

  // Mỗi tài khoản chỉ mua tối đa 1 sản phẩm Flash Sale
  if (cart.some(item => Number(item.id) === Number(id))) {
    alert("Sản phẩm đã có trong giỏ hàng. Mỗi tài khoản chỉ mua tối đa 1 sản phẩm Flash Sale.");
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
      stock: product.stock
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
  // Giỏ hàng đồng bộ đếm theo số lượng item (1 loại = 1 item)
  let total = cart.length;

  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerText = total;
  });
}

function viewCart(){
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if(!token){
    window.location.href = "auth.html";
    return;
  }

  window.location.href = "cart.html";
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