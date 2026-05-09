function getCartKey(){
  const user = JSON.parse(localStorage.getItem("user")) || {};
  return "cart_" + (user.id || user.username || "guest");
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
  const token = localStorage.getItem("token");

  if(!token){
    window.location.href = "auth.html";
    return;
  }

  let cart = loadCart(); 

  let item = cart.find(x => x.id == id);

  if(item){
    item.quantity++;
  } else {
    cart.push({
      id: id,
      quantity: 1
    });
  }

  saveCart(cart);
  updateCartUI();
}

function updateCartUI(){
  const cart = loadCart();

  let total = cart.reduce((sum, item) => sum + item.quantity, 0);

  const ids = ["cart", "cartCount"];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerText = total;
  });
}

function viewCart(){
  const token = localStorage.getItem("token");

  if(!token){
    window.location.href = "auth.html";
    return;
  }

  window.location.href = "cart.html";
}

window.addEventListener("storage", function(e){
  if(e.key && e.key.startsWith("cart_")){
    updateCartUI();
  }
});

window.addEventListener("cartUpdated", updateCartUI);

window.addEventListener("DOMContentLoaded", function(){
  updateCartUI();
});