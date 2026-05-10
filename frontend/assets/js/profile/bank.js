function addBank(){
  if(!bankNumber.value || !bankName.value){
    return showMessage("bankMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  if(!/^[0-9]{6,20}$/.test(bankNumber.value)){
    return showMessage("bankMessage", "Số tài khoản không hợp lệ!");
  }

  const banks = getBanks();

  banks.push({
    number: bankNumber.value,
    name: bankName.value
  });

  localStorage.setItem("banks", JSON.stringify(banks));

  bankNumber.value = "";
  bankName.value = "";

  renderBanks();
  showMessage("bankMessage", "Thêm ngân hàng thành công!", "success");
}

function renderBanks(){
  const list = document.getElementById("bankList");
  const banks = getBanks();

  list.innerHTML = "";

  banks.forEach((b,i)=>{
    list.innerHTML += `
      <div class="address-box">
        ${b.number} - ${b.name}
        <button onclick="deleteBank(${i})">Xóa</button>
      </div>
    `;
  });
}

function deleteBank(i){
  const banks = getBanks();
  banks.splice(i,1);
  localStorage.setItem("banks", JSON.stringify(banks));
  renderBanks();
  showMessage("bankMessage", "Xóa ngân hàng thành công!", "success");
}