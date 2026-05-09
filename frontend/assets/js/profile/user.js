const API_URL = "http://localhost:3000";

let usernameInput, nameInput, emailInput, phoneInput, genderInput, dobInput;

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

function bindInputs() {
  usernameInput = document.getElementById("username");
  nameInput = document.getElementById("name");
  emailInput = document.getElementById("email");
  phoneInput = document.getElementById("phone");
  genderInput = document.getElementById("gender");
  dobInput = document.getElementById("dob");
}

function initProfileUI() {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const defaultAvatar = "./img/default-avatar.png";

  const avatarPreview = document.getElementById("avatarPreview");
  const headerAvatar = document.getElementById("headerAvatar");

  const avatar = user.avatar || defaultAvatar;

  if (avatarPreview) avatarPreview.src = avatar;
  if (headerAvatar) headerAvatar.src = avatar;

  if (usernameInput) usernameInput.value = user.username || "";
  if (nameInput) nameInput.value = user.name || "";
  if (emailInput) emailInput.value = user.email || "";
  if (phoneInput) phoneInput.value = user.phone || "";
  if (genderInput) genderInput.value = user.gender || "";
  if (dobInput) dobInput.value = user.dob ? user.dob.split("T")[0] : "";
}

async function loadProfile() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/api/users/profile`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    const oldUser = JSON.parse(localStorage.getItem("user")) || {};

    const mergedUser = {
      ...oldUser,
      ...data,
      avatar: oldUser.avatar || data.avatar
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));

    initProfileUI(); 
  } catch {
    console.warn("API lỗi → dùng localStorage");
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
      const oldUser = JSON.parse(localStorage.getItem("user")) || {};

      const newUser = {
        ...oldUser,
        avatar: e.target.result
      };

      localStorage.setItem("user", JSON.stringify(newUser));

      initProfileUI(); 
      window.dispatchEvent(new Event("userUpdated"));
    };

    reader.readAsDataURL(file);
  });
}

async function saveProfile() {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "auth.html";

  if (!usernameInput.value.trim()) {
    return showMessage("profileMessage", "Vui lòng nhập username!");
  }

  if (usernameInput.value.length < 4) {
    return showMessage("profileMessage", "Username phải >= 4 ký tự!");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(usernameInput.value.trim())) {
    return showMessage("profileMessage", "Username chỉ gồm chữ, số, hoặc _");
  }

  if (!nameInput.value.trim()) {
    return showMessage("profileMessage", "Vui lòng nhập tên!");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailInput.value.trim()) {
    return showMessage("profileMessage", "Vui lòng nhập email!");
  }

  if (!emailRegex.test(emailInput.value)) {
    return showMessage("profileMessage", "Email không hợp lệ!");
  }

  const phoneRegex = /^[0-9]{9,11}$/;
  if (phoneInput.value && !phoneRegex.test(phoneInput.value)) {
    return showMessage("profileMessage", "Số điện thoại không hợp lệ!");
  }

  if (!genderInput.value) {
    return showMessage("profileMessage", "Vui lòng chọn giới tính!");
  }

  if (!dobInput.value) {
    return showMessage("profileMessage", "Vui lòng chọn ngày sinh!");
  }

  const data = {
    username: usernameInput.value.trim(),
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    gender: genderInput.value,
    dob: dobInput.value
  };

  try {
    const res = await fetch(`${API_URL}/api/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error();

    const updated = await res.json();

    const oldUser = JSON.parse(localStorage.getItem("user")) || {};

    const mergedUser = {
      ...oldUser,
      ...updated,
      avatar: oldUser.avatar
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));

    initProfileUI();

    showMessage("profileMessage", "Cập nhật thành công!", "success");

  } catch (err) {
    showMessage("profileMessage", "Lỗi cập nhật!", "error");
  }
}

async function changePassword(){

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

  const token = localStorage.getItem("token");

  if(!oldPass || !newPass || !confirmPass){
    return showMessage("passwordMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  if(newPass.length < 6){
    return showMessage("passwordMessage", "Mật khẩu mới phải >= 6 ký tự!");
  }

  if(newPass !== confirmPass){
    return showMessage("passwordMessage", "Xác nhận mật khẩu không khớp!");
  }

  if(oldPass === newPass){

    return showMessage(
      "passwordMessage",
      "Mật khẩu mới không được trùng mật khẩu cũ!"
    );
  }

  try{

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

    if(!response.ok){

      throw new Error(
        data.message || "Đổi mật khẩu thất bại!"
      );
    }

    document.getElementById("oldPass").value = "";

    document.getElementById("newPass").value = "";

    document.getElementById("confirmPass").value = "";

    showMessage("passwordMessage", "Đổi mật khẩu thành công!", "success");

  }catch(err){

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
  window.location.href = "auth.html";
}

function requireLogin() {
  if (!localStorage.getItem("token")) {
    window.location.href = "auth.html";
    return false;
  }
  return true;
}

window.addEventListener("userUpdated", () => {
  initProfileUI();
});