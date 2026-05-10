function addAddress(){
  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phoneAddress").value;
  const detail = document.getElementById("detailAddress").value;

  const provinceSelect = document.getElementById("province");
  const districtSelect = document.getElementById("district");
  const wardSelect = document.getElementById("ward");

  const province = provinceSelect.options[provinceSelect.selectedIndex].text;
  const district = districtSelect.options[districtSelect.selectedIndex].text;
  const ward = wardSelect.options[wardSelect.selectedIndex].text;

  if(!fullName || !phone || !detail){
    return showMessage("addressMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  if(!provinceSelect.value || !districtSelect.value || !wardSelect.value){
    return showMessage("addressMessage", "Chọn đủ Tỉnh/Quận/Phường!");
  }

  if(!/^[0-9]{9,11}$/.test(phone)){
    return showMessage("addressMessage", "Số điện thoại không hợp lệ!");
  }

  const addresses = getAddresses();

  addresses.push({
    fullName,
    phone,
    province,
    district,
    ward,
    detail
  });

  localStorage.setItem("addresses", JSON.stringify(addresses));

  renderAddresses();
  resetAddressForm();

  showMessage("addressMessage", "Thêm địa chỉ thành công!", "success");
}

function renderAddresses(){
  const list = document.getElementById("addressList");
  const data = getAddresses();

  list.innerHTML = "";

  data.forEach((a,i)=>{
    list.innerHTML += `
      <div class="address-box">
        <div>
          <b>${a.fullName}</b><br>
          ${a.phone}<br>
          ${a.detail}, ${a.ward}, ${a.district}, ${a.province}
        </div>
        <button onclick="deleteAddress(${i})">Xóa</button>
      </div>
    `;
  });
}

function deleteAddress(i){
  const data = getAddresses();
  data.splice(i,1);
  localStorage.setItem("addresses", JSON.stringify(data));
  renderAddresses();
  showMessage("addressMessage", "Xóa địa chỉ thành công!", "success");
}

function resetAddressForm(){
  document.getElementById("fullName").value = "";
  document.getElementById("phoneAddress").value = "";
  document.getElementById("detailAddress").value = "";

  province.value = "";
  district.innerHTML = '<option value="">Chọn quận</option>';
  ward.innerHTML = '<option value="">Chọn phường</option>';
}