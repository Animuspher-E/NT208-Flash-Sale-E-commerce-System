const flashsaleService = require('../services/flashsale.service');
const { getAllProductsFromCache, getProductFromCache } = require('../services/cache.service');
const { warmUpCache } = require('../services/cache.service');
const orderService = require('../services/order.service');

// API Mua hàng Flash Sale
async function buy(req, res, next) {
  const { productId, quantity, shippingAddress } = req.body;
  const userId = req.user.userId;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  let redisDecrSuccess = false;
  try {
    const buyResult = await flashsaleService.buyProduct(productId, userId, qty);
    if (!buyResult.success) {
      if (buyResult.reason === 'out_of_stock') {
        const remain = buyResult.remainingStock ?? 0;
        return res.status(400).json({
          success: false,
          message: remain > 0
            ? `Chỉ còn ${remain} sản phẩm trong kho. Vui lòng giảm số lượng.`
            : 'Rất tiếc! Sản phẩm đã hết hàng.'
        });
      }
      if (buyResult.reason === 'invalid_quantity') {
        return res.status(400).json({
          success: false,
          message: 'Số lượng mua không hợp lệ.'
        });
      }
    }
    redisDecrSuccess = true;
    const remainingStock = buyResult.remainingStock;
    const orderResponse = await orderService.buyProduct(userId, productId, qty, shippingAddress);
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
      error.rollbackInfo = { productId, userId, quantity: qty };
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
      // Sản phẩm Flash Sale → trừ kho Redis theo số lượng trong giỏ
      const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const buyResult = await flashsaleService.buyProduct(item.productId, userId, itemQty);
      if (buyResult.success) {
        successfulItems.push({
          productId: item.productId,
          quantity: itemQty,
          remainingStock: buyResult.remainingStock,
          isFlashSale: true
        });
        flashSaleDecrItems.push({ productId: item.productId, quantity: itemQty });
      } else {
        const remain = buyResult.remainingStock ?? 0;
        failures.push({
          productId: item.productId,
          reason: remain > 0
            ? `Chỉ còn ${remain} sản phẩm trong kho`
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
    for (const decrItem of flashSaleDecrItems) {
      await flashsaleService.rollbackStock(
        decrItem.productId,
        userId,
        decrItem.quantity
      );
    }
    next(error);
  }
}
// API Lấy danh sách sản phẩm
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

// API Chi tiết 1 sản phẩm (mô tả + thông số từ DB)
async function getProductById(req, res, next) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (!productId || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'productId không hợp lệ',
      });
    }

    const product = await getProductFromCache(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
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

module.exports = { buy, buyCart, getProducts, getProductById, getStock, triggerWarmUp };

