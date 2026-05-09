document.addEventListener("DOMContentLoaded", function(){

  const province = document.getElementById("province");
  const district = document.getElementById("district");
  const ward = document.getElementById("ward");

  // LOAD PROVINCE
  fetch("https://provinces.open-api.vn/api/p/")
    .then(res => res.json())
    .then(data => {
      data.forEach(p=>{
        province.innerHTML += `<option value="${p.code}">${p.name}</option>`;
      });
    });

  // LOAD DISTRICT
  province.addEventListener("change", function(){
    fetch(`https://provinces.open-api.vn/api/p/${this.value}?depth=2`)
      .then(res => res.json())
      .then(data => {
        district.innerHTML = '<option value="">Chọn quận</option>';
        ward.innerHTML = '<option value="">Chọn phường</option>';

        data.districts.forEach(d=>{
          district.innerHTML += `<option value="${d.code}">${d.name}</option>`;
        });
      });
  });

  // LOAD WARD
  district.addEventListener("change", function(){
    fetch(`https://provinces.open-api.vn/api/d/${this.value}?depth=2`)
      .then(res => res.json())
      .then(data => {
        ward.innerHTML = '<option value="">Chọn phường</option>';

        data.wards.forEach(w=>{
          ward.innerHTML += `<option value="${w.name}">${w.name}</option>`;
        });
      });
  });

});

function getBanks(){
  return JSON.parse(localStorage.getItem("banks")) || [];
}

function getAddresses(){
  return JSON.parse(localStorage.getItem("addresses")) || [];
}


function showDeleteConfirm(){
  document.getElementById("deleteConfirmBox").classList.remove("hidden");
}

function cancelDelete(){
  document.getElementById("deleteConfirmBox").classList.add("hidden");
}
