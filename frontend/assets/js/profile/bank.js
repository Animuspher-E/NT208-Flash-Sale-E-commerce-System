const BANK_API_URL = "http://localhost:3000/api/payment/payos";

let bankNumber;
let bankName;

async function addBank() {

  if (!bankNumber.value || !bankName.value) {
    return showMessage("bankMessage", "Vui lòng nhập đầy đủ thông tin!");
  }

  if (!/^[0-9]{6,20}$/.test(bankNumber.value)) {
    return showMessage("bankMessage", "Số tài khoản không hợp lệ!");
  }

  try {

    const response = await fetch(BANK_API_URL, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        number: bankNumber.value,

        name: bankName.value
      })

    });

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.message || "Thêm thất bại"
      );
    }

    bankNumber.value = "";

    bankName.value = "";

    renderBanks();

    showMessage("bankMessage", "Liên kết ngân hàng thành công!", "success");

  } catch (err) {

    showMessage("bankMessage", err.message
    );
  }
}

async function renderBanks() {

  const list = document.getElementById("bankList");

  try {

    const response = await fetch(BANK_API_URL);

    const banks = await response.json();

    list.innerHTML = "";

    if (banks.length === 0) {

      list.innerHTML = `
        <div class="address-box">
          Chưa có tài khoản ngân hàng nào.
        </div>
      `;

      return;
    }

    banks.forEach((b) => {

      list.innerHTML += `

        <div class="bank-item">

          <div class="bank-info">

            <div class="bank-name">
              <i class="fa-solid fa-building-columns"></i>
              ${b.name}
            </div>

            <div class="bank-number">
              ${maskBankNumber(b.number)}
            </div>

          </div>

          <button
            class="delete-bank-btn"
            onclick="deleteBank('${b.id}')"
          >
            <i class="fa-solid fa-trash"></i>
            Xóa
          </button>

        </div>
      `;
    });

  } catch (err) {

    list.innerHTML = `
      <div class="address-box">
        Không thể tải danh sách ngân hàng.
      </div>
    `;
  }
}

async function deleteBank(id) {

  try {

    const response = await fetch(
      `${BANK_API_URL}/${id}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.message || "Xóa thất bại"
      );
    }

    renderBanks();

    showMessage("bankMessage", "Xóa ngân hàng thành công!", "success");

  } catch (err) {

    showMessage("bankMessage", err.message);
  }
}

function maskBankNumber(number) {

  const last4 = number.slice(-4);

  return "•••• •••• •••• " + last4;
}

window.addEventListener("DOMContentLoaded", () => {

  bankNumber = document.getElementById("bankNumber");
  bankName = document.getElementById("bankName");

  renderBanks();

});
