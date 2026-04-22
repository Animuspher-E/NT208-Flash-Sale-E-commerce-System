// src/routes/payment.routes.js
const express = require('express');
const paymentController = require('../controllers/payment.controller');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');

// API lấy URL thanh toán (Cần người dùng đăng nhập)
router.post('/create_url', verifyToken, paymentController.createPaymentUrl);

// API để VNPay tự động gọi đến cập nhật DB (IPN) (KHÔNG được chặn xác thực!)
router.get('/vnpay_ipn', paymentController.vnpayIpn);

module.exports = router;
