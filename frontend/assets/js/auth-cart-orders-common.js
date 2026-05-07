(function () {
  const DEFAULT_API_BASE_URL = "http://localhost:3000";
  const API_STORAGE_KEY = "api_url";
  const TOKEN_KEY = "token";
  const USER_KEY = "user";
  const CART_STORAGE_KEY = "cart";

  function getApiBaseUrl() {
    return (window.FLASH_SALE_API_URL || localStorage.getItem(API_STORAGE_KEY) || DEFAULT_API_BASE_URL).replace(/\/$/, "");
  }

  function setApiBaseUrl(value) {
    const nextValue = String(value || "").trim().replace(/\/$/, "");
    if (!nextValue) return getApiBaseUrl();
    localStorage.setItem(API_STORAGE_KEY, nextValue);
    return nextValue;
  }

  function readJSON(storage, key, fallback) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    return readJSON(localStorage, USER_KEY, null) || readJSON(sessionStorage, USER_KEY, null);
  }

  function persistSession(data, remember) {
    const token = data && data.data ? data.data.token : null;
    const user = data && data.data ? data.data.user : null;
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem(TOKEN_KEY);
    otherStorage.removeItem(USER_KEY);

    if (token) storage.setItem(TOKEN_KEY, token);
    if (user) storage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function requireAuth() {
    if (!getToken()) {
      window.location.href = "auth.html";
      return false;
    }
    return true;
  }

  function readCart() {
    return readJSON(localStorage, CART_STORAGE_KEY, []);
  }

  function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart || []));
  }

  function getErrorMessage(data) {
    if (data && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0].message || data.errors[0].error || "Dữ liệu gửi lên không hợp lệ.";
    }
    if (data && Array.isArray(data.details) && data.details.length > 0) {
      return data.details[0].message || "Dữ liệu gửi lên không hợp lệ.";
    }
    return data && (data.message || data.error)
      ? data.message || data.error
      : "Yêu cầu thất bại. Vui lòng thử lại.";
  }

  async function apiRequest(path, options = {}) {
    const auth = options.auth !== false;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (auth) {
      const token = getToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok || data.success === false) {
      if (auth && response.status === 401) {
        clearSession();
      }
      throw new Error(getErrorMessage(data));
    }

    return data;
  }

  async function loadCurrentUser() {
    const data = await apiRequest("/api/auth/me");
    const user = data && data.data ? data.data : null;
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;

    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    }

    return user;
  }

  function setMessage(element, text, type = "info") {
    if (!element) return;
    const baseClass = element.classList.contains("app-message") ? "app-message" : "message";
    element.textContent = text || "";
    element.className = text ? `${baseClass} ${type}` : baseClass;
  }

  function setButtonLoading(button, isLoading, loadingText = "Đang xử lý") {
    if (!button) return;
    button.disabled = isLoading;
    button.dataset.originalText = button.dataset.originalText || button.innerHTML;
    button.innerHTML = isLoading
      ? `<i class="fa-solid fa-circle-notch fa-spin"></i> ${loadingText}`
      : button.dataset.originalText;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "Không rõ";
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function emptyState(icon, title, description) {
    return `
      <div class="empty-state">
        <i class="fa-solid ${icon}"></i>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
    `;
  }

  function statusLabel(status) {
    const labels = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      paid: "Đã thanh toán",
      shipped: "Đang giao",
      delivered: "Đã giao",
      completed: "Hoàn tất",
      cancelled: "Đã hủy"
    };
    return labels[status] || status || "Không rõ";
  }

  function paymentLabel(status) {
    const labels = {
      unpaid: "Chưa thanh toán",
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thanh toán lỗi"
    };
    return labels[status] || status || "Không rõ";
  }

  function renderUserHeader() {
    const user = getUser() || {};
    const nameEl = document.getElementById("headerUserName");
    const emailEl = document.getElementById("headerUserEmail");
    const cartCountEl = document.getElementById("cartCount");
    const apiBaseEl = document.getElementById("apiBaseText");

    if (nameEl) nameEl.textContent = user.name || "Khách hàng";
    if (emailEl) emailEl.textContent = user.email || "user@example.com";
    if (cartCountEl) cartCountEl.textContent = readCart().length;
    if (apiBaseEl) apiBaseEl.textContent = getApiBaseUrl();
  }

  async function logout() {
    try {
      if (getToken()) {
        await apiRequest("/api/auth/logout", { method: "POST" });
      }
    } catch {
      // Token may already be invalid; local cleanup is still required.
    } finally {
      clearSession();
      window.location.href = "auth.html";
    }
  }

  window.ECommerce = {
    apiRequest,
    clearSession,
    emptyState,
    escapeHtml,
    formatCurrency,
    formatDate,
    getApiBaseUrl,
    getToken,
    getUser,
    loadCurrentUser,
    logout,
    paymentLabel,
    persistSession,
    readCart,
    renderUserHeader,
    requireAuth,
    saveCart,
    setApiBaseUrl,
    setButtonLoading,
    setMessage,
    statusLabel
  };
})();

function goHome() {
  window.location.href = "home.html";
}

function syncHeaderAvatar() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const defaultAvatar = "./img/default-avatar.png";

  const avatar = user.avatar || defaultAvatar;

  const headerAvatar = document.getElementById("headerAvatar");

  if (headerAvatar) {
    headerAvatar.src = avatar;
  }
}

window.addEventListener("DOMContentLoaded", function () {
  syncHeaderAvatar();
});

window.addEventListener("storage", function (e) {
  if (e.key === "user") {
    syncHeaderAvatar();
  }
});

function initAvatarClick() {
  const headerAvatar = document.getElementById("headerAvatar");

  if (headerAvatar) {
    headerAvatar.style.cursor = "pointer"; // cho UX đẹp hơn
    headerAvatar.addEventListener("click", function () {
      window.location.href = "profile.html";
    });
  }
}

window.addEventListener("DOMContentLoaded", function () {
  initAvatarClick();
});