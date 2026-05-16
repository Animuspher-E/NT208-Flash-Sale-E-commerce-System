const provinceEl = document.getElementById("province");
const districtEl = document.getElementById("district");
const wardEl = document.getElementById("ward");

let provinces = [];
let cachedAddresses = []; // Lưu địa chỉ từ server vào bộ nhớ

async function loadProvinces() {
  try {
    const res = await fetch("https://provinces.open-api.vn/api/?depth=3");
    provinces = await res.json();
    renderProvinces();
  } catch (err) {
    console.error("Lỗi tải tỉnh thành:", err);
  }
}

function renderProvinces() {
  if (!provinceEl) return;
  provinceEl.innerHTML = '<option value="">Chọn tỉnh</option>' + 
    provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
}

if (provinceEl) {
  provinceEl.addEventListener("change", function() {
    const pCode = this.value;
    const province = provinces.find(p => p.code == pCode);
    if (province && districtEl) {
      districtEl.innerHTML = '<option value="">Chọn quận</option>' + 
        province.districts.map(d => `<option value="${d.code}">${d.name}</option>`).join('');
      if (wardEl) wardEl.innerHTML = '<option value="">Chọn phường</option>';
    }
  });
}

if (districtEl) {
  districtEl.addEventListener("change", function() {
    const pCode = provinceEl.value;
    const dCode = this.value;
    const province = provinces.find(p => p.code == pCode);
    const district = province?.districts.find(d => d.code == dCode);
    if (district && wardEl) {
      wardEl.innerHTML = '<option value="">Chọn phường</option>' + 
        district.wards.map(w => `<option value="${w.code}">${w.name}</option>`).join('');
    }
  });
}

function renderAddresses() {
  const listEl = document.getElementById("addressList");
  if (!listEl) return;

  // Dùng dữ liệu từ server (cachedAddresses), không dùng localStorage
  if (cachedAddresses.length === 0) {
    listEl.innerHTML = '<p style="color:#888;font-size:14px;margin-top:10px">Chưa có địa chỉ nào. Thêm địa chỉ giao hàng bên trên.</p>';
    return;
  }

  listEl.innerHTML = cachedAddresses.map((addr) => `
    <div class="address-box ${addr.isDefault ? 'default' : ''}" style="margin-top:10px;padding:12px 14px;border:1px solid ${addr.isDefault ? '#3b82f6' : '#e5e7eb'};border-radius:8px;position:relative;background:${addr.isDefault ? '#eff6ff' : '#fff'}">
      <p style="margin:0 0 4px"><strong>${addr.fullName}</strong> &nbsp;·&nbsp; ${addr.phone} ${addr.isDefault ? '<span style="background:#3b82f6;color:#fff;font-size:11px;padding:1px 7px;border-radius:10px;margin-left:8px">Mặc định</span>' : ''}</p>
      <p style="font-size:13px;color:#6b7280;margin:0">${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.province}</p>
      <button onclick="deleteAddress(${addr.id})" style="position:absolute;right:12px;top:12px;border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px" title="Xóa địa chỉ">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

async function loadAddresses() {
  if (!BF.getToken()) return;
  try {
    const res = await BF.apiRequest("/api/users/addresses");
    if (res.success && Array.isArray(res.data)) {
      cachedAddresses = res.data;

      // Đồng bộ SĐT từ địa chỉ mặc định sang Hồ sơ nếu Hồ sơ chưa có SĐT
      const defaultAddr = cachedAddresses.find(a => a.isDefault);
      if (defaultAddr && defaultAddr.phone) {
        const currentUser = BF.getUser() || {};
        if (!currentUser.phone) {
          BF.getToken() && (function(){
            const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify({ ...currentUser, phone: defaultAddr.phone }));
            if (typeof phoneInput !== 'undefined' && phoneInput) phoneInput.value = defaultAddr.phone;
          })();
        }
      }
    }
  } catch (err) {
    console.error("Lỗi tải địa chỉ từ server:", err);
  }
  renderAddresses();
}

async function addAddress() {
  // Điền sẵn họ tên từ hồ sơ nếu ô trống
  const user = BF.getUser() || {};
  const fullNameEl = document.getElementById("fullName");
  const phoneAddressEl = document.getElementById("phoneAddress");
  if (fullNameEl && !fullNameEl.value && user.name) fullNameEl.value = user.name;
  if (phoneAddressEl && !phoneAddressEl.value && user.phone) phoneAddressEl.value = user.phone;

  const fullName = fullNameEl ? fullNameEl.value.trim() : '';
  const phone = phoneAddressEl ? phoneAddressEl.value.trim() : '';
  const pName = provinceEl.options[provinceEl.selectedIndex]?.text;
  const dName = districtEl.options[districtEl.selectedIndex]?.text;
  const wName = wardEl.options[wardEl.selectedIndex]?.text;
  const detail = document.getElementById("detailAddress").value.trim();
  const isDefault = document.getElementById("isDefaultAddress")?.checked || false;

  if (!fullName || !phone || !pName || !dName || !wName || !detail) {
    return showMessage("addressMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  try {
    const res = await BF.apiRequest("/api/users/addresses", {
      method: "POST",
      body: { fullName, phone, province: pName, district: dName, ward: wName, detail, isDefault }
    });

    if (res.success) {
      await loadAddresses();
      // Reset form
      document.getElementById("fullName").value = "";
      document.getElementById("phoneAddress").value = "";
      provinceEl.value = "";
      districtEl.innerHTML = '<option value="">Chọn quận</option>';
      wardEl.innerHTML = '<option value="">Chọn phường</option>';
      document.getElementById("detailAddress").value = "";
      if (document.getElementById("isDefaultAddress")) {
        document.getElementById("isDefaultAddress").checked = false;
      }
      showMessage("addressMessage", "Thêm địa chỉ thành công!", "success");
    }
  } catch (err) {
    showMessage("addressMessage", err.message || "Lỗi thêm địa chỉ!");
  }
}

async function deleteAddress(id) {
  const target = cachedAddresses.find(a => a.id === id);
  if (!target) return;

  if (!confirm(`Bạn có chắc chắn muốn xóa địa chỉ: ${target.detail}?`)) return;

  try {
    const res = await BF.apiRequest(`/api/users/addresses/${id}`, {
      method: "DELETE"
    });

    if (res.success) {
      const wasDefault = target.isDefault;
      await loadAddresses();

      // Nếu xóa địa chỉ mặc định và vẫn còn địa chỉ khác
      if (wasDefault && cachedAddresses.length > 0) {
        showDefaultSelector();
      }
    }
  } catch (err) {
    showMessage("addressMessage", err.message || "Lỗi xóa địa chỉ!");
  }
}

function showDefaultSelector() {
  const modal = document.createElement('div');
  modal.id = 'defaultAddressModal';
  modal.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
  
  const content = `
    <div style="background:#fff;padding:25px;border-radius:12px;width:90%;max-width:400px;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
      <h3 style="margin-top:0;margin-bottom:15px;font-size:18px;">Chọn địa chỉ mặc định mới</h3>
      <p style="font-size:14px;color:#666;margin-bottom:20px;">Bạn vừa xóa địa chỉ mặc định. Hãy chọn một địa chỉ khác làm mặc định (không bắt buộc).</p>
      <div id="selectorList" style="max-height:250px;overflow-y:auto;margin-bottom:20px;">
        ${cachedAddresses.map(addr => `
          <div onclick="selectNewDefault(${addr.id})" style="padding:12px;border:1px solid #eee;border-radius:8px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#3b82f6';this.style.background='#f8fafc'" onmouseout="this.style.borderColor='#eee';this.style.background='none'">
            <div style="font-weight:600;font-size:14px;">${addr.fullName}</div>
            <div style="font-size:12px;color:#888;">${addr.detail}, ${addr.ward}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button onclick="closeDefaultSelector()" style="background:#f1f5f9;color:#475569;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:500;">Bỏ qua</button>
      </div>
    </div>
  `;
  
  modal.innerHTML = content;
  document.body.appendChild(modal);
}

function closeDefaultSelector() {
  const modal = document.getElementById('defaultAddressModal');
  if (modal) modal.remove();
}

async function selectNewDefault(id) {
  try {
    // Để tiết kiệm thời gian và không cần tạo API mới, ta lợi dụng addAddress logic 
    // hoặc gọi API update (mà ta sắp thêm). Hiện tại ta sẽ dùng API update nếu có.
    // Vì backend chưa có PUT, ta sẽ thêm PUT /api/users/addresses/:id/default
    await BF.apiRequest(`/api/users/addresses/${id}/default`, {
      method: "PUT"
    });
    
    closeDefaultSelector();
    await loadAddresses();
    showMessage("addressMessage", "Đã cập nhật địa chỉ mặc định mới!", "success");
  } catch (err) {
    alert("Lỗi khi đặt mặc định: " + err.message);
  }
}

loadProvinces();
loadAddresses();
