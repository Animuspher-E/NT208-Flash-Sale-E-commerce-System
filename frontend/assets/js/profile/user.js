const API_URL = "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getUser() {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setUser(userObj) {
  const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
  storage.setItem("user", JSON.stringify(userObj));
}
let usernameInput, nameInput, emailInput, phoneInput, addressInput;

window.addEventListener("DOMContentLoaded", async () => {
  if (!requireLogin()) return;

  bindInputs();

  initProfileUI();
  initAvatar();
  initLogout();

  await loadProfile();

  renderBanks();
  renderAddresses();
});

let usernameInput, nameInput, emailInput, phoneInput, genderInput, dobInput, addressInput;

function bindInputs() {
  usernameInput = document.getElementById("username");
  nameInput     = document.getElementById("name");
  emailInput    = document.getElementById("email");
  phoneInput    = document.getElementById("phone");
  genderInput   = document.getElementById("gender");
  dobInput      = document.getElementById("dob");
  addressInput  = document.getElementById("address");
}

function initProfileUI() {
  const user = getUser();
  const defaultAvatar = './img/default-avatar.png';
  const avatarPreview = document.getElementById('avatarPreview');
  const headerAvatar  = document.getElementById('headerAvatar');
  const avatar = user.avatar || defaultAvatar;
  if (avatarPreview) avatarPreview.src = avatar;
  if (headerAvatar)  headerAvatar.src  = avatar;

  if (usernameInput) {
    usernameInput.value = user.username || '';
    if (user.usernameChanged) {
      usernameInput.readOnly = true;
      usernameInput.style.background = '#f0f0f0';
      usernameInput.style.cursor = 'not-allowed';
      usernameInput.style.color = '#888';
    } else {
      usernameInput.readOnly = false;
      usernameInput.style.background = '';
      usernameInput.style.cursor = '';
      usernameInput.style.color = '';
    }
  }
  if (nameInput)     nameInput.value     = user.name     || '';
  if (emailInput)    emailInput.value    = user.email    || '';
  if (phoneInput)    phoneInput.value    = user.phone    || '';
  if (genderInput)   genderInput.value   = user.gender   || '';
  if (dobInput)      dobInput.value      = user.dob ? user.dob.split('T')[0] : '';
  if (addressInput)  addressInput.value  = user.address  || '';
}

async function loadProfile() {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}/api/users/profile`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    if (!res.ok) {
      console.warn('[loadProfile] server:', data?.message || data);
      throw new Error(data?.message || 'Lỗi tải hồ sơ');
    }

    const profile = data.data || data;

    const oldUser = getUser();

    const mergedUser = {
      ...oldUser,
      ...profile,
      avatar: oldUser.avatar || profile.avatar
    };

    setUser(mergedUser);
    initProfileUI();
  } catch (err) {
    console.warn('API lỗi → dùng localStorage:', err.message);
    initProfileUI();
  }
}

function initAvatar() {
  const avatarInput = document.getElementById("avatarInput");

  avatarInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      const oldUser = getUser();

      const newUser = {
        ...oldUser,
        avatar: e.target.result
      };

      setUser(newUser);

      initProfileUI();
      window.dispatchEvent(new Event("userUpdated"));
    };

    reader.readAsDataURL(file);
  });
}

async function saveProfile() {
  const token = getToken();
  if (!token) return window.location.href = 'auth.html';

  const username = usernameInput?.value.trim();
  if (username && !usernameInput.readOnly) {
    if (username.length < 4) {
      return showMessage('profileMessage', 'Tên đăng nhập phải ít nhất 4 ký tự!', 'error');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return showMessage('profileMessage', 'Tên đăng nhập chỉ gồm chữ, số hoặc _', 'error');
    }
  }

  const name = nameInput?.value.trim();
  if (!name || name.length < 2) {
    return showMessage('profileMessage', 'Tên phải ít nhất 2 ký tự!', 'error');
  }

  const email = emailInput?.value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showMessage('profileMessage', 'Email không hợp lệ!', 'error');
  }

  const phone = phoneInput?.value.trim();
  if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
    return showMessage('profileMessage', 'Số điện thoại không hợp lệ!', 'error');
  }
  if (phone && phone.length > 20) {
    return showMessage('profileMessage', 'Số điện thoại không quá 20 ký tự!', 'error');
  }

  const gender = genderInput?.value;
  const dob = dobInput?.value;
  const address = addressInput?.value.trim();

  const payload = { name };
  if (username && !usernameInput.readOnly) payload.username = username;
  if (email)   payload.email   = email;
  if (phone)   payload.phone   = phone;
  if (gender)  payload.gender  = gender;
  if (dob)     payload.dob     = dob;
  if (address) payload.address = address;

  try {
    const res = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      // Đọc message từ backend (Zod trả về details array hoặc message)
      const errMsg = result?.details?.[0]?.message
        || result?.errors?.[0]?.message
        || result?.message
        || 'Cập nhật thất bại!';
      throw new Error(errMsg);
    }

    const updated = result.data || result;
    const oldUser = getUser();
    setUser({ ...oldUser, ...updated, avatar: oldUser.avatar });
    initProfileUI();

    showMessage('profileMessage', 'Cập nhật thành công!', 'success');

  } catch (err) {
    showMessage('profileMessage', err.message || 'Lỗi cập nhật!', 'error');
  }
}

async function changePassword() {

  const oldPass = document
    .getElementById("oldPass")
    .value
    .trim();

  const newPass = document
    .getElementById("newPass")
    .value
    .trim();

  const confirmPass = document
    .getElementById("confirmPass")
    .value
    .trim();

  const token = getToken();

  if (!oldPass || !newPass || !confirmPass) {
    return showMessage("passwordMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  if (newPass.length < 6) {
    return showMessage("passwordMessage", "Mật khẩu mới phải >= 6 ký tự!");
  }

  if (newPass !== confirmPass) {
    return showMessage("passwordMessage", "Xác nhận mật khẩu không khớp!");
  }

  if (oldPass === newPass) {

    return showMessage(
      "passwordMessage",
      "Mật khẩu mới không được trùng mật khẩu cũ!"
    );
  }

  try {

    const response = await fetch(
      "http://localhost:3000/api/auth/change-password",
      {

        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },

        body: JSON.stringify({

          oldPassword: oldPass,

          newPassword: newPass
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.message || "Đổi mật khẩu thất bại!"
      );
    }

    document.getElementById("oldPass").value = "";

    document.getElementById("newPass").value = "";

    document.getElementById("confirmPass").value = "";

    showMessage("passwordMessage", "Đổi mật khẩu thành công!", "success");

  } catch (err) {

    showMessage("passwordMessage", err.message);
  }
}

function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "auth.html";
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = "auth.html";
    return false;
  }
  return true;
}

window.addEventListener("userUpdated", () => {
  initProfileUI();
});