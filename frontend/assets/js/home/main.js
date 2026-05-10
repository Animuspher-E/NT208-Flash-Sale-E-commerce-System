let countdownInterval;

function startFlashSaleTimer(flashSaleEnd) {
  clearInterval(countdownInterval);

  function updateTimer() {
    const now = new Date().getTime();
    const end = new Date(flashSaleEnd).getTime();

    let diff = Math.floor((end - now) / 1000);

    const el = document.getElementById("flash-timer");

    if (diff <= 0) {
      clearInterval(countdownInterval);
      if (el) el.innerText = "Đã kết thúc";
      return;
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    if (el) {
      el.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

function initUserUI() {
  const token = localStorage.getItem("token");

  const avatar = document.getElementById("userAvatar");
  const loginText = document.getElementById("loginText");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!avatar || !loginText || !logoutBtn) return;

  if (token) {
    const user = JSON.parse(localStorage.getItem("user")) || {};

    avatar.classList.remove("hidden");
    loginText.classList.add("hidden");
    logoutBtn.classList.remove("hidden");

    avatar.src = user.avatar || "./img/default-avatar.png";
  } else {
    avatar.classList.add("hidden");
    loginText.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
}

function handleUserClick() {
  const token = localStorage.getItem("token");

  if (token) {
    window.location.href = "profile.html";
  } else {
    window.location.href = "auth.html";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  // fetch dữ liệu từ database trước
  await fetchFlashSaleProducts();

  // sau khi có dữ liệu trong biến products mới render giao diện
  initRender();
  initFlashSale();
  initUserUI();
  initSocket();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "auth.html";
    return false;
  }
  return true;
}

let socket;
function initSocket() {
  if (typeof io !== 'undefined') {
    socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("[Socket] Connected to server");
    });

    socket.on("stock_update", (data) => {
      console.log("[Socket] Stock update:", data);
      const { productId, newStock } = data;
      const p = products.find(x => x.id == productId);
      if (p) {
        p.stock = newStock;
        if (currentCategory) {
          filterCategory(currentCategory);
        } else {
          initRender();
        }
      }
    });
  }
}

function handleAddToCart(id) {
  if (!requireLogin()) return;

  add(id);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("cart");

  initUserUI();

  window.location.href = "auth.html";
}

window.addEventListener("storage", () => {
  initUserUI();
});