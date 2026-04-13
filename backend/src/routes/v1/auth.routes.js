// src/routes/v1/auth.routes.js
// Authentication API routes

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const authMiddleware = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schemas = require('../../validations/auth.schema');

/**
 * POST /api/v1/auth/register
 * Register user mới
 * Body: { email, password, confirmPassword, name }
 */
router.post(
    '/register',
    validate(schemas.registerSchema),
    authController.register
);

/**
 * POST /api/v1/auth/login
 * Login user
 * Body: { email, password }
 */
router.post(
    '/login',
    validate(schemas.loginSchema),
    authController.login
);

/**
 * POST /api/v1/auth/refresh-token
 * Refresh JWT token
 * Headers: Authorization: Bearer <token>
 */
router.post(
    '/refresh-token',
    authMiddleware,
    authController.refreshToken
);

/**
 * GET /api/v1/auth/me
 * Lấy thông tin user hiện tại
 * Headers: Authorization: Bearer <token>
 */
router.get(
    '/me',
    authMiddleware,
    authController.getMe
);

/**
 * POST /api/v1/auth/change-password
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
 * POST /api/v1/auth/logout
 * Logout user
 */
router.post(
    '/logout',
    authMiddleware,
    authController.logout
);

module.exports = router;
