const { z } = require('zod');

/**
 * Schema để validate POST /auth/register
 * Yêu cầu: email hợp lệ, password mạnh, tên không trống
 */
const registerSchema = z.object({
    email: z
        .string({ required_error: 'Email là bắt buộc' })
        .email('Email không hợp lệ')
        .toLowerCase(),
    password: z
        .string({ required_error: 'Password là bắt buộc' })
        .min(8, 'Password phải ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Password phải chứa ít nhất 1 chữ hoa')
        .regex(/[0-9]/, 'Password phải chứa ít nhất 1 chữ số')
        .regex(/[^a-zA-Z0-9]/, 'Password phải chứa ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z
        .string({ required_error: 'Xác nhận password là bắt buộc' }),
    name: z
        .string({ required_error: 'Tên là bắt buộc' })
        .min(2, 'Tên phải ít nhất 2 ký tự')
        .max(255, 'Tên không được quá 255 ký tự'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Password không khớp',
    path: ['confirmPassword'],
});

/**
 * Schema để validate POST /auth/login
 * Yêu cầu: email hợp lệ, password không trống
 */
const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email là bắt buộc' })
        .email('Email không hợp lệ')
        .toLowerCase(),
    password: z
        .string({ required_error: 'Password là bắt buộc' })
        .min(1, 'Password không được trống'),
});

/**
 * Schema để validate POST /auth/refresh-token
 */
const refreshTokenSchema = z.object({
    refreshToken: z
        .string({ required_error: 'Refresh token là bắt buộc' })
        .min(10, 'Refresh token không hợp lệ'),
});

/**
 * Schema để validate POST /auth/change-password
 * Yêu cầu: mật khẩu cũ, mật khẩu mới (mạnh), xác nhận mật khẩu
 */
const changePasswordSchema = z.object({
    oldPassword: z
        .string({ required_error: 'Mật khẩu cũ là bắt buộc' })
        .min(1, 'Mật khẩu cũ không được trống'),
    newPassword: z
        .string({ required_error: 'Mật khẩu mới là bắt buộc' })
        .min(8, 'Mật khẩu phải ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
        .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
        .regex(/[^a-zA-Z0-9]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z
        .string({ required_error: 'Xác nhận mật khẩu là bắt buộc' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu mới không khớp',
    path: ['confirmPassword'],
}).refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu cũ',
    path: ['newPassword'],
});

/**
 * Schema để validate POST /auth/forgot-password
 */
const forgotPasswordSchema = z.object({
    email: z
        .string({ required_error: 'Email là bắt buộc' })
        .email('Email không hợp lệ')
        .toLowerCase(),
});

/**
 * Schema để validate POST /auth/reset-password
 */
const resetPasswordSchema = z.object({
    password: z
        .string({ required_error: 'Mật khẩu là bắt buộc' })
        .min(8, 'Mật khẩu phải ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
        .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
        .regex(/[^a-zA-Z0-9]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z
        .string({ required_error: 'Xác nhận mật khẩu là bắt buộc' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};

