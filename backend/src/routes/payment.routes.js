// src/routes/payment.routes.js
const express = require('express');
const paymentController = require('../controllers/payment.controller');
const router = express.Router();
const { authMiddleware: verifyToken } = require('../middlewares/auth');

// API lấy URL thanh toán (Cần người dùng đăng nhập)
router.post('/create_url', verifyToken, paymentController.createPaymentUrl);

// API để PayOS tự động gọi đến cập nhật DB (Webhook) (KHÔNG được chặn xác thực!)
router.post('/payos_webhook', paymentController.payosWebhook);

module.exports = router;
