// ================================================
// File: src/services/flashsale.service.js
// Mục đích: Xử lý mua hàng Flash Sale - LÕI TỐC ĐỘ
// ================================================

const { getRedisClient } = require('../config/redis');
const { getSocketIO } = require('../config/socket');
const REDIS_KEY_STOCK = (productId) => `flashsale:product_${productId}:stock`;
const REDIS_KEY_USER_QTY = (productId) => `flashsale:product_${productId}:user_qty`;

const BUY_LUA_SCRIPT = `
  local userQty = tonumber(redis.call('HGET', KEYS[2], ARGV[1])) or 0
  local qty = tonumber(ARGV[2])
  if qty == nil or qty <= 0 then
    return -3
  end

  local stock = tonumber(redis.call('GET', KEYS[1]))
  if stock == nil or stock <= 0 then
    return -2
  end

  -- Giới hạn mua = tồn kho còn lại (user có thể mua tối đa bằng số lượng trong kho)
  if qty > stock then
    return -2
  end

  redis.call('DECRBY', KEYS[1], qty)
  redis.call('HINCRBY', KEYS[2], ARGV[1], qty)

  return stock - qty
`;

async function buyProduct(productId, userId, quantity = 1) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const redis = getRedisClient();
  const result = await redis.eval(
    BUY_LUA_SCRIPT,
    2,
    REDIS_KEY_STOCK(productId),
    REDIS_KEY_USER_QTY(productId),
    userId.toString(),
    qty.toString()
  );

  if (result === -2) {
    const remainingStock = await getStock(productId);
    return { success: false, reason: 'out_of_stock', remainingStock };
  }
  if (result === -3) {
    return { success: false, reason: 'invalid_quantity' };
  }

  const remainingStock = result;
  try {
    const io = getSocketIO();
    io.to('flashsale_room').emit('STOCK_UPDATED', {
      productId: productId,
      remainingStock: remainingStock,
    });
    console.log(`[Socket] Phát STOCK_UPDATED: product_${productId} còn ${remainingStock}`);
  } catch (socketError) {
    console.error('[Socket] Lỗi phát tín hiệu:', socketError.message);
  }
  return { success: true, remainingStock };
}

async function rollbackStock(productId, userId, quantity = 1) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const redis = getRedisClient();
  await redis.incrby(REDIS_KEY_STOCK(productId), qty);
  const newUserQty = await redis.hincrby(
    REDIS_KEY_USER_QTY(productId),
    userId.toString(),
    -qty
  );
  if (newUserQty <= 0) {
    await redis.hdel(REDIS_KEY_USER_QTY(productId), userId.toString());
  }
  console.log(`[Flashsale] Rollback: +${qty} stock cho product_${productId}, user=${userId}`);
}

async function getStock(productId) {
  const redis = getRedisClient();
  const stock = await redis.get(REDIS_KEY_STOCK(productId));
  return parseInt(stock, 10) || 0;
}

async function getUserPurchasedQty(productId, userId) {
  const redis = getRedisClient();
  const qty = await redis.hget(REDIS_KEY_USER_QTY(productId), userId.toString());
  return parseInt(qty, 10) || 0;
}

module.exports = {
  buyProduct,
  rollbackStock,
  getStock,
  getUserPurchasedQty,
};
