function goHome() {
  window.location.href = "home.html";
}

function showTab(event, tab) {
  document.querySelectorAll(".content > div").forEach(e => e.classList.add("hidden"));
  document.getElementById(tab + "Tab").classList.remove("hidden");

  document.querySelectorAll(".menu-item").forEach(e => e.classList.remove("active"));
  event.target.classList.add("active");

  localStorage.setItem("activeProfileTab", tab);

  document.querySelectorAll(".form-message").forEach(e => {
    e.innerText = "";
    e.classList.remove("success");
  });
}

function showMessage(id, message, type = "error") {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = message;
  el.className = "form-message";

  if (type === "success") {
    el.classList.add("success");
  }
}

// search
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("searchInput");

  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const keyword = input.value.trim();
        if (keyword) {
          window.location.href = `home.html?search=${encodeURIComponent(keyword)}`;
        }
      }
    });
  }
});

function logout() {
  localStorage.clear();
  window.location.href = "auth.html";
}

window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "auth.html";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const savedTab =
    localStorage.getItem("activeProfileTab") || "profile";

  document
    .querySelectorAll(".content > div")
    .forEach(e => e.classList.add("hidden"));

  const activeTab =
    document.getElementById(savedTab + "Tab");

  if (activeTab) {
    activeTab.classList.remove("hidden");
  }

  document
    .querySelectorAll(".menu-item")
    .forEach(e => e.classList.remove("active"));

  const menuItems =
    document.querySelectorAll(".menu-item");

  menuItems.forEach(item => {

    const text =
      item.innerText.toLowerCase();

    if (
      (savedTab === "profile" && text.includes("hồ sơ")) ||
      (savedTab === "bank" && text.includes("ngân hàng")) ||
      (savedTab === "address" && text.includes("địa chỉ")) ||
      (savedTab === "password" && text.includes("mật khẩu")) ||
      (savedTab === "delete" && text.includes("xóa"))
    ) {
      item.classList.add("active");
    }
  });
});