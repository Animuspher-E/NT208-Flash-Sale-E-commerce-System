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
  const wrapper = document.getElementById("userDropdownWrapper");
  const avatar = document.getElementById("userAvatar");
  const nameEl = document.getElementById("dropdownUserName");
  const emailEl = document.getElementById("dropdownUserEmail");

  if (token && user && user.name) {
    // Đã đăng nhập: ẩn nút "Đăng nhập", hiện avatar
    if (loginBtn) loginBtn.style.display = "none";
    if (wrapper) wrapper.style.display = "inline-block";
    if (avatar) avatar.src = user.avatar || "./img/default-avatar.png";
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email || "";
  } else {
    // Chưa đăng nhập: hiện nút "Đăng nhập", ẩn avatar
    if (loginBtn) loginBtn.style.display = "";
    if (wrapper) wrapper.style.display = "none";
  }
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById("userDropdown");
  if (dropdown) dropdown.classList.toggle("hidden");
}

window.addEventListener("DOMContentLoaded", async () => {
  // fetch dữ liệu từ database trước
  await fetchFlashSaleProducts();

  // sau khi có dữ liệu trong biến products mới render giao diện
  initRender();
  initFlashSale();
  initUserUI();
  initSocket();

  // Avatar click → toggle dropdown
  const avatarBtn = document.getElementById("avatarBtn");
  if (avatarBtn) avatarBtn.addEventListener("click", toggleUserDropdown);

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Click ngoài dropdown → đóng
  document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("userDropdown");
    const wrapper = document.getElementById("userDropdownWrapper");
    if (dropdown && wrapper && !wrapper.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
});

function isLoggedIn() {
  return !!getToken();
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
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  initUserUI();

  window.location.href = "auth.html";
}

window.addEventListener("storage", () => {
  initUserUI();
});