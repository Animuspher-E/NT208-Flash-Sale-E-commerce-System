// src/routes/payment.routes.js
const express = require('express');
const paymentController = require('../controllers/payment.controller');
const router = express.Router();
const { authMiddleware: verifyToken } = require('../middlewares/auth');

// API lấy URL thanh toán (Cần người dùng đăng nhập)
router.post('/create_url', verifyToken, paymentController.createPaymentUrl);

// API để PayOS tự động gọi đến cập nhật DB (Webhook) (KHÔNG được chặn xác thực!)
router.post('/payos_webhook', paymentController.payosWebhook);

// API thủ công cho frontend khi redirect từ màn hình thanh toán
router.post('/verify_return', verifyToken, paymentController.verifyReturnUrl);

// Đồng bộ trạng thái sau khi user chuyển khoản / quét QR
router.post('/sync_status', verifyToken, paymentController.syncPaymentStatus);

module.exports = router;
