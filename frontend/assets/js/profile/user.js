// Use existing BF from common.js
if (typeof BF === 'undefined') {
  var BF = window.ECommerce;
}

function getToken() { return BF.getToken(); }
function getUser() { return BF.getUser() || {}; }
function setUser(userObj) {
  const storage = BF.getToken() ? localStorage : sessionStorage;
  storage.setItem("user", JSON.stringify(userObj));
}
let usernameInput, nameInput, emailInput, phoneInput, genderInput, dobInput;

window.addEventListener("DOMContentLoaded", async () => {
  if (!BF.requireAuth()) return;

  bindInputs();

  initProfileUI();
  initAvatar();
  initLogout();

  await loadProfile();

  renderBanks();
  renderAddresses();
});

function bindInputs() {
  usernameInput = document.getElementById("username");
  nameInput     = document.getElementById("name");
  emailInput    = document.getElementById("email");
  phoneInput    = document.getElementById("phone");
  genderInput   = document.getElementById("gender");
  dobInput      = document.getElementById("dob");
}

function initProfileUI() {
  const user = getUser();
  console.log("[Profile] Initializing UI with user:", user);
  
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
}

async function loadProfile() {
  try {
    const data = await BF.apiRequest('/api/users/profile');
    const profile = data.data || data;
    const oldUser = getUser();
    const mergedUser = {
      ...oldUser,
      ...profile,
      avatar: oldUser.avatar || profile.avatar
    };
    setUser(mergedUser);
    initProfileUI();
    // Make email read-only for security
    if (emailInput) {
      emailInput.readOnly = true;
      emailInput.style.background = '#f0f0f0';
      emailInput.style.cursor = 'not-allowed';
      emailInput.style.color = '#555';
      emailInput.title = 'Email không thể thay đổi';
    }
  } catch (err) {
    console.warn('Không tải được hồ sơ từ máy chủ, dùng dữ liệu cục bộ:', err.message);
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
      return showMessage('profileMessage', 'Tên đăng nhập phải có ít nhất 4 ký tự!', 'error');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return showMessage('profileMessage', 'Tên đăng nhập chỉ gồm chữ, số hoặc _', 'error');
    }
  }

    const name = nameInput?.value.trim();
  if (!name || name.length < 2) {
    return showMessage('profileMessage', 'Họ tên phải có ít nhất 2 ký tự!', 'error');
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
  const avatarPreview = document.getElementById('avatarPreview');

  const payload = { name };
  if (username && !usernameInput.readOnly) payload.username = username;
  if (email)   payload.email   = email;
  if (phone)   payload.phone   = phone;
  if (gender)  payload.gender  = gender;
  if (dob)     payload.dob     = dob;
  
  // Nếu avatar là base64 (mới upload) thì gửi lên
  if (avatarPreview && avatarPreview.src.startsWith('data:image')) {
    payload.avatar = avatarPreview.src;
  }

  try {
    const result = await BF.apiRequest('/api/users/profile', {
      method: 'PUT',
      body: payload
    });

    const updated = result.data || result;
    const oldUser = getUser();
    setUser({ ...oldUser, ...updated });
    initProfileUI();

    showMessage('profileMessage', 'Cập nhật thành công!', 'success');
  } catch (err) {
    // BF.apiRequest tự parse lỗi từ server và throw Error với message rõ ràng
    showMessage('profileMessage', err.message || 'Cập nhật thất bại!', 'error');
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
    return showMessage("passwordMessage", "Mật khẩu không khớp!");
  }

  if (oldPass === newPass) {

    return showMessage(
      "passwordMessage",
      "Mật khẩu mới không được giống với mật khẩu cũ!"
    );
  }

  try {

    await BF.apiRequest('/api/auth/change-password', {
      method: 'PUT',
      body: { oldPassword: oldPass, newPassword: newPass }
    });

    document.getElementById("oldPass").value = "";

    document.getElementById("newPass").value = "";

    document.getElementById("confirmPass").value = "";

    showMessage("passwordMessage", "Đổi mật khẩu thành công!", "success");

  } catch (err) {

    showMessage("passwordMessage", err.message);
  }
}

window.addEventListener("userUpdated", () => {
  initProfileUI();
});