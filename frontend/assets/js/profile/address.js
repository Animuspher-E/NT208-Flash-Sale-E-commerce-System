const provinceEl = document.getElementById("province");
const districtEl = document.getElementById("district");
const wardEl = document.getElementById("ward");

let provinces = [];

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

  const addresses = JSON.parse(localStorage.getItem("userAddresses") || "[]");
  if (addresses.length === 0) {
    listEl.innerHTML = '<p style="color:#888;font-size:14px;margin-top:10px">Chưa có địa chỉ nào.</p>';
    return;
  }

  listEl.innerHTML = addresses.map((addr, index) => `
    <div class="address-box" style="margin-top:10px;padding:10px;border:1px solid #eee;border-radius:5px;position:relative">
      <p><strong>${addr.fullName}</strong> | ${addr.phone}</p>
      <p style="font-size:14px;color:#666">${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.province}</p>
      <button onclick="deleteAddress(${index})" style="position:absolute;right:10px;top:10px;border:none;background:none;color:red;cursor:pointer">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function addAddress() {
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phoneAddress").value.trim();
  const pName = provinceEl.options[provinceEl.selectedIndex]?.text;
  const dName = districtEl.options[districtEl.selectedIndex]?.text;
  const wName = wardEl.options[wardEl.selectedIndex]?.text;
  const detail = document.getElementById("detailAddress").value.trim();

  if (!fullName || !phone || !pName || !dName || !wName || !detail) {
    return showMessage("addressMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  const addresses = JSON.parse(localStorage.getItem("userAddresses") || "[]");
  addresses.push({ fullName, phone, province: pName, district: dName, ward: wName, detail });
  localStorage.setItem("userAddresses", JSON.stringify(addresses));

  // Reset form
  document.getElementById("fullName").value = "";
  document.getElementById("phoneAddress").value = "";
  provinceEl.value = "";
  districtEl.innerHTML = '<option value="">Chọn quận</option>';
  wardEl.innerHTML = '<option value="">Chọn phường</option>';
  document.getElementById("detailAddress").value = "";

  renderAddresses();
  showMessage("addressMessage", "Thêm địa chỉ thành công!", "success");
}

function deleteAddress(index) {
  const addresses = JSON.parse(localStorage.getItem("userAddresses") || "[]");
  addresses.splice(index, 1);
  localStorage.setItem("userAddresses", JSON.stringify(addresses));
  renderAddresses();
}

loadProvinces();
renderAddresses();
