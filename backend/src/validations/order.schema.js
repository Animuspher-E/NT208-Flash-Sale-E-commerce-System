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
    .max(9999, 'Số lượng mua quá lớn')
});

const buyCartSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1)
  })).min(1, 'Giỏ hàng không được trống'),
  shippingAddress: z.string().nullable().optional()
});

module.exports = { buySchema, buyCartSchema };

