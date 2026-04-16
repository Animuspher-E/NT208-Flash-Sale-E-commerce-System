// src/routes/auth.routes.js
// Authentication API routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../validations/auth.schema');

/**
 * POST /api/auth/register
 * Register user mới
 * Body: { email, password, confirmPassword, name }
 */
router.post(
    '/register',
    validate(schemas.registerSchema),
    authController.register
);

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post(
    '/login',
    validate(schemas.loginSchema),
    authController.login
);

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 * Headers: Authorization: Bearer <token>
 */
router.post(
    '/refresh-token',
    authMiddleware,
    authController.refreshToken
);

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 * Headers: Authorization: Bearer <token>
 */
router.get(
    '/me',
    authMiddleware,
    authController.getMe
);

/**
 * POST /api/auth/change-password
 * Thay đổi mật khẩu
 * Headers: Authorization: Bearer <token>
 * Body: { oldPassword, newPassword, confirmPassword }
 */
router.post(
    '/change-password',
    authMiddleware,
    validate(schemas.changePasswordSchema),
    authController.changePassword
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post(
    '/logout',
    authMiddleware,
    authController.logout
);

/**
 * POST /api/auth/forgot-password
 * Quên mật khẩu - Gửi mail xác nhận
 * Body: { email }
 */
router.post(
    '/forgot-password',
    validate(schemas.forgotPasswordSchema),
    authController.forgotPassword
);

/**
 * POST /api/auth/reset-password/:token
 * Đặt lại mật khẩu mới
 * Body: { password, confirmPassword }
 */
router.post(
    '/reset-password/:token',
    validate(schemas.resetPasswordSchema),
    authController.resetPassword
);

module.exports = router;
