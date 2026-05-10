// ================================================
// File: src/routes/admin.routes.js
// Mục đích: Các API endpoint dành riêng cho Admin
//   Tất cả đều cần: authMiddleware + isAdmin
// ================================================

const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

// Áp dụng auth + isAdmin cho toàn bộ route admin
router.use(authMiddleware, isAdmin);

// Dashboard Stats
router.get('/stats', adminController.getStats);

// Categories
router.get('/categories', adminController.getCategories);

// Products
router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.patch('/products/:id/flashsale', adminController.toggleFlashSale);

// Orders
router.get('/orders', adminController.getOrders);

// Customers
router.get('/customers', adminController.getCustomers);

module.exports = router;
