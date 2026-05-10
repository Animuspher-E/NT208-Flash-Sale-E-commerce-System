/**
 * Hàm tiện ích để tạo response chuẩn
 * Đảm bảo tất cả API trả về cùng 1 định dạng JSON
 */

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
