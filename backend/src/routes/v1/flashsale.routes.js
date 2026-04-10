// ================================================
// File: src/routes/v1/flashsale.routes.js
// Mục đích: Khai báo các API Endpoints cho Flash Sale
//   Đây là "bảng chỉ đường" - mỗi URL -> hàm xử lý tương ứng
// Danh sách API:
//   GET  /api/v1/flashsale/products       => Lấy danh sách sản phẩm
//   GET  /api/v1/flashsale/stock/:id    => Lấy tồn kho 1 sản phẩm
//   POST /api/v1/flashsale/buy            => Mua hàng (cần đăng nhập)
//   POST /api/v1/flashsale/warmup         => Kích hoạt Warm-up (Admin)
// Cấu trúc middleware stack cho POST /buy:
//   authMiddleware -> flashSaleRateLimit -> validate(buySchema) -> controller.buy
//   (xác thực)       (chống spam)          (kiểm tra dữ liệu)     (xử lý mua)
// ================================================

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { flashSaleRateLimit } = require('../../middlewares/rateLimit');
const validate = require('../../middlewares/validate');
const { buySchema } = require('../../validations/order.schema');
const flashsaleController = require('../../controllers/flashsale.controller');
router.get('/products', flashsaleController.getProducts); //GET /api/v1/flashsale/products
router.get('/stock/:productId', flashsaleController.getStock); //GET /api/v1/flashsale/stock/:productId
//Đăng nhập -> Chống spam -> Kiểm tra dữ liệu -> Mua hàng        
router.post(
  '/buy',
  authMiddleware,
  flashSaleRateLimit,
  validate(buySchema),
  flashsaleController.buy
); //POST /api/v1/flashsale/buy
router.post('/warmup', flashsaleController.triggerWarmUp); //POST /api/v1/flashsale/warmup

module.exports = router;
