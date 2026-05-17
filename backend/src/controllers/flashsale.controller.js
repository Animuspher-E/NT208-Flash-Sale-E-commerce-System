// ================================================
// File: src/controllers/flashsale.controller.js
// Mục đích: Tiếp nhận request và điều phối xử lý Flash Sale
//   Controller chỉ làm 2 việc:
//     1. Đọc dữ liệu từ req (request của client)
//     2. Gọi service và trả về response cho client
//   Không chứa logic nghiệp vụ (logic ở service)
//
// Các API this controller xử lý:
//   POST /api/flashsale/buy            => Mua hàng Flash Sale
//   GET  /api/flashsale/products       => Lấy danh sách sản phẩm Flash Sale
//   GET  /api/flashsale/stock/:id    => Lấy tồn kho 1 sản phẩm
//   POST /api/flashsale/warmup         => Kích hoạt Cache Warm-up (Admin)
// ================================================

const flashsaleService = require('../services/flashsale.service');
const { getAllProductsFromCache } = require('../services/cache.service');
const { warmUpCache } = require('../services/cache.service');
const orderService = require('../services/order.service');

// API Mua hàng Flash Sale
async function buy(req, res, next) {
  const { productId, quantity, shippingAddress } = req.body;
  const userId = req.user.userId;
  let redisDecrSuccess = false;
  try {
    const buyResult = await flashsaleService.buyProduct(productId, userId);
    if (!buyResult.success) {
      if (buyResult.reason === 'already_bought') {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã mua sản phẩm này rồi! Mỗi người chỉ được mua 1 lần.'
        });
      }
      if (buyResult.reason === 'out_of_stock') {
        return res.status(400).json({
          success: false,
          message: 'Rất tiếc! Sản phẩm đã hết hàng.'
        });
      }
    }
    redisDecrSuccess = true;
    const remainingStock = buyResult.remainingStock;
    const orderResponse = await orderService.buyProduct(userId, productId, quantity, shippingAddress);
    const order = orderResponse.order;
    return res.status(201).json({
      success: true,
      message: 'Mua hàng thành công!',
      data: {
        orderId: order.id,
        productId: productId,
        remainingStock: remainingStock,
      }
    });
  } catch (error) {
    if (redisDecrSuccess) {
      error.needRollback = true;
      error.rollbackInfo = { productId, userId };
    }
    next(error);
  }
}

async function buyCart(req, res, next) {
  const { items, shippingAddress } = req.body;
  const userId = req.user.userId;
  const redis = require('../config/redis').getRedisClient();

  const successfulItems = [];
  const failures = [];
  const flashSaleDecrItems = []; // track which items had Redis stock decremented (for rollback)

  for (const item of items) {
    // Kiểm tra sản phẩm này có trong Flash Sale (Redis) không
    const stockKey = `flashsale:product_${item.productId}:stock`;
    const redisStock = await redis.get(stockKey);
    const isFlashSaleProduct = redisStock !== null;

    if (isFlashSaleProduct) {
      // Sản phẩm Flash Sale → dùng Lua script (kiểm tra already_bought + trừ kho Redis)
      const buyResult = await flashsaleService.buyProduct(item.productId, userId);
      if (buyResult.success) {
        successfulItems.push({
          productId: item.productId,
          quantity: item.quantity,
          remainingStock: buyResult.remainingStock,
          isFlashSale: true
        });
        flashSaleDecrItems.push(item.productId);
      } else {
        failures.push({
          productId: item.productId,
          reason: buyResult.reason === 'already_bought'
            ? 'Flash Sale giới hạn 1 lượt mua/sản phẩm'
            : 'Sản phẩm đã hết hàng'
        });
      }
    } else {
      // Sản phẩm thường → bỏ qua Redis, kiểm tra tồn kho sau ở DB transaction
      successfulItems.push({
        productId: item.productId,
        quantity: item.quantity,
        remainingStock: null,
        isFlashSale: false
      });
    }
  }

  if (successfulItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Không thể tạo đơn hàng.',
      failures
    });
  }

  try {
    const orderResponse = await orderService.buyMultipleProducts(userId, successfulItems, shippingAddress);
    return res.status(201).json({
      success: true,
      message: 'Chốt đơn thành công!',
      data: {
        orderId: orderResponse.order.id,
        successfulItems,
        failures
      }
    });
  } catch (error) {
    // Chỉ rollback Redis cho sản phẩm Flash Sale
    for (const productId of flashSaleDecrItems) {
      await flashsaleService.rollbackStock(productId, userId);
    }
    next(error);
  }
}
// API Lấy danh sách sản phẩm Flash Sale
async function getProducts(req, res, next) {
  try {
    const products = await getAllProductsFromCache();

    return res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    next(error);
  }
}
// API Lấy tồn kho của 1 sản phẩm
async function getStock(req, res, next) {
  try {
    const productId = parseInt(req.params.productId);
    if (!productId || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'productId không hợp lệ'
      });
    }
    const stock = await flashsaleService.getStock(productId);

    return res.status(200).json({
      success: true,
      data: { productId, stock }
    });
  } catch (error) {
    next(error);
  }
}
// API Kích hoạt Cache Warm-up
async function triggerWarmUp(req, res, next) {
  try {
    console.log('[Admin] Bắt đầu Cache Warm-up theo yêu cầu...');
    await warmUpCache();
    return res.status(200).json({
      success: true,
      message: 'Cache Warm-up hoàn tất! Hệ thống đã sẵn sàng cho Flash Sale.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { buy, buyCart, getProducts, getStock, triggerWarmUp };
