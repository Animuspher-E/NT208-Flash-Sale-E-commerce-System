// ================================================
// File: src/validations/user.schema.js
// Mục đích: Định nghĩa Zod schemas cho User endpoints
//   - updateProfileSchema: Cập nhật thông tin user
// ================================================

const { z } = require('zod');

/**
 * Schema để validate PUT /users/profile
 * Cho phép cập nhật: name, phone, address
 */
const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Tên phải ít nhất 2 ký tự')
        .max(255, 'Tên không được quá 255 ký tự')
        .optional(),
    username: z
        .string()
        .min(4, 'Tên đăng nhập phải ít nhất 4 ký tự')
        .max(50, 'Tên đăng nhập không quá 50 ký tự')
        .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ gồm chữ cái, số và dấu gạch dưới')
        .optional()
        .nullable(),
    email: z
        .string()
        .email('Email không hợp lệ')
        .max(255, 'Email không được quá 255 ký tự')
        .optional()
        .nullable(),
    phone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Số điện thoại không hợp lệ')
        .max(20, 'Số điện thoại không được quá 20 ký tự')
        .optional()
        .nullable(),
    gender: z
        .enum(['Nam', 'Nữ', 'Khác'], { errorMap: () => ({ message: 'Giới tính không hợp lệ' }) })
        .optional()
        .nullable(),
    dob: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD')
        .optional()
        .nullable(),
    address: z
        .string()
        .max(500, 'Địa chỉ không được quá 500 ký tự')
        .optional()
        .nullable(),
});

/**
 * Schema để validate GET query params cho /users/orders
 */
const getOrdersQuerySchema = z.object({
    page: z
        .string()
        .regex(/^\d+$/, 'Page phải là số nguyên')
        .transform(Number)
        .refine(n => n >= 1, 'Page phải >= 1')
        .default('1')
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, 'Limit phải là số nguyên')
        .transform(Number)
        .refine(n => n >= 1 && n <= 100, 'Limit phải từ 1-100')
        .default('10')
        .optional(),
    status: z
        .enum(['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'completed', 'cancelled'])
        .optional(),
});

module.exports = {
    updateProfileSchema,
    getOrdersQuerySchema,
};
