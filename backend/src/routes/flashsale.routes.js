const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const { flashSaleRateLimit } = require('../middlewares/rateLimit');
const validate = require('../middlewares/validate');
const { buySchema } = require('../validations/order.schema');
const flashsaleController = require('../controllers/flashsale.controller');
router.get('/products', flashsaleController.getProducts); //GET /api/flashsale/products
router.get('/products/:productId', flashsaleController.getProductById); //GET /api/flashsale/products/:id
router.get('/stock/:productId', flashsaleController.getStock); //GET /api/flashsale/stock/:productId
//Đăng nhập -> Chống spam -> Kiểm tra dữ liệu -> Mua hàng        
router.post(
  '/buy',
  authMiddleware,
  flashSaleRateLimit,
  validate(buySchema),
  flashsaleController.buy
); //POST /api/flashsale/buy

router.post(
  '/buy-cart',
  authMiddleware,
  // We can skip rate limit or use a different one, but for now we skip rate limiting or use a simple one.
  // Actually let's use the same flashSaleRateLimit or none. None is fine because it's multiple products.
  validate(require('../validations/order.schema').buyCartSchema),
  flashsaleController.buyCart
);

router.post('/warmup', authMiddleware, isAdmin, flashsaleController.triggerWarmUp); //POST /api/flashsale/warmup

module.exports = router;

