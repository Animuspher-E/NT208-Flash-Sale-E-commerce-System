// ================================================
// File: src/config/vnpay.js
// Mục đích: Cấu hình mặc định cho môi trường Sandbox của VNPay
// Trong thực tế, các giá trị này nên được để trong file .env
// ================================================

module.exports = {
  vnp_TmnCode: '66G4ROY1', // Mã website tại VNPay (Mã dùng cho Môi trường Sandbox dev)
  vnp_HashSecret: '71ZYZXHKPH9171NGNV7550Y22ADTXXOM', // Chuỗi bí mật tạo checksum
  vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_Api: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  vnp_ReturnUrl: 'http://localhost:5173/payment/result', // Nơi VNPay redirect user về sau khi thanh toán trên web
};
