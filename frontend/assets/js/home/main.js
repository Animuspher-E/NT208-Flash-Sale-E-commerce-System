let countdownInterval;

function startFlashSaleTimer(flashSaleEnd, elementId = "flash-timer") {
  clearInterval(countdownInterval);

  function updateTimer() {
    const now = new Date().getTime();
    const end = new Date(flashSaleEnd).getTime();

    let diff = Math.floor((end - now) / 1000);

    const el = document.getElementById(elementId);
    const elHome = document.getElementById("flash-timer"); // Luôn cập nhật cả ở trang chủ nếu nó tồn tại

    if (diff <= 0) {
      clearInterval(countdownInterval);
      if (el) el.innerText = "Kết thúc";
      if (elHome) elHome.innerText = "Kết thúc";
      return;
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (el) el.innerText = timeStr;
    if (elHome && elementId !== "flash-timer") elHome.innerText = timeStr;
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function initUserUI() {
  const token = getToken();
  const user = getStoredUser();

  const loginBtn = document.getElementById("loginBtn");
  const wrapper = document.getElementById("userActionsWrapper");
  const avatar = document.getElementById("userAvatar");

  if (token && user && user.name) {
    // Đã đăng nhập: ẩn nút "Đăng nhập", hiện nhóm hành động
    if (loginBtn) loginBtn.classList.add("hidden");
    if (wrapper) wrapper.classList.remove("hidden");
    if (wrapper) wrapper.style.display = "flex";
    if (avatar) avatar.src = user.avatar || "pages/img/default-avatar.png";
  } else {
    // Chưa đăng nhập: hiện nút "Đăng nhập", ẩn nhóm hành động
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (wrapper) wrapper.classList.add("hidden");
    if (wrapper) wrapper.style.display = "none";
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

  // Kiểm tra tham số category từ URL
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat && typeof filterCategory === "function") {
    // Tìm key category tương ứng từ tên hiển thị nếu cần, 
    // hoặc truyền trực tiếp nếu filterCategory hỗ trợ
    filterCategory(cat);
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
      if (typeof ECommerce !== 'undefined') {
        ECommerce.logout();
      } else {
        // Dự phòng nếu chưa load kịp common
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "pages/auth.html";
      }
    });
  }
});

function isLoggedIn() {
  return !!getToken();
}

function requireLogin() {
  if (typeof ECommerce !== 'undefined') {
    return ECommerce.requireAuth();
  }
  if (!localStorage.getItem("token") && !sessionStorage.getItem("token")) {
    window.location.href = "pages/auth.html";
    return false;
  }
  return true;
}

let socket;
function initSocket() {
  if (typeof io !== 'undefined') {
    socket = io(API_URL);

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
  if (typeof ECommerce !== 'undefined' && !ECommerce.requireAuth()) return;

  add(id);
}


window.addEventListener("storage", () => {
  initUserUI();
});