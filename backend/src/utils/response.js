// ================================================
// File: src/utils/response.js
// Mục đích: Hàm tiện ích để tạo response chuẩn
//   Đảm bảo tất cả API trả về cùng 1 định dạng JSON
//
// Định dạng chuẩn:
//   Thành công: { success: true, message: "...", data: {...} }
//   Thất bại:   { success: false, message: "...", errors: [...] }
//
// Ví dụ dùng trong Controller:
//   return res.status(200).json(sendSuccess(res, data, 'Thành công'));
//   return res.status(400).json(sendError(res, 'Lỗi dữ liệu'));
// ================================================

function sendSuccess(data, message = 'OK') {
  return {
    success: true,
    message: message,
    data: data
  };
}

function sendError(message, errors = []) {
  const response = {
    success: false,
    message: message
  };
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  return response;
}

module.exports = { sendSuccess, sendError };
