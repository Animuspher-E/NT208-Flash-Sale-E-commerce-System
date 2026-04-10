// ================================================
// File: src/validations/order.schema.js
// Mục đích: Định nghĩa "khuôn mẫu" dữ liệu cho đơn hàng
//   Dùng Zod để khai báo luật kiểm tra input
//   Được dùng bởi middleware validate.js
//
// Ví dụ input hợp lệ:
//   { "productId": 3, "quantity": 1 }
// Ví dụ input không hợp lệ:
//   { "productId": "abc", "quantity": -1 }
// ================================================

const { z } = require('zod');
const buySchema = z.object({
  productId: z
    .number({ required_error: 'productId là bắt buộc' })
    .int('productId phải là số nguyên')
    .positive('productId phải lớn hơn 0'),
  quantity: z
    .number({ required_error: 'quantity là bắt buộc' })
    .int('quantity phải là số nguyên')
    .min(1, 'quantity phải ít nhất là 1')
    .max(1, 'Mỗi người chỉ được mua tối đa 1 sản phẩm Flash Sale')
});

module.exports = { buySchema };
