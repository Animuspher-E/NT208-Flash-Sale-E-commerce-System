// ================================================
// File: src/services/flashsale.service.js
// Mục đích: Xử lý mua hàng Flash Sale - LÕI TỐC ĐỘ
//   Đây là phần quan trọng nhất, phải xử lý cực nhanh
//   vì có hàng nghìn người cùng nhấn "Mua" một lúc
//
// Kỹ thuật chính: Atomic Operations trên Redis
//   - "Atomic" nghĩa là: thực hiện nguyên một khối, không bị ngắt quãng
//   - Dùng Lua Script để đảm bảo 2 thao tác (kiểm tra + trừ kho) chạy cùng nhau
//   - Redis là single-threaded nên không bao giờ bị race condition
//
// Ví dụ Race Condition (KHÔNG dùng Atomic):
//   User A đọc: stock = 1 (còn hàng)
//   User B đọc: stock = 1 (còn hàng)  <- cùng lúc
//   User A trừ: stock = 0 (OK)
//   User B trừ: stock = -1 (Sai! Over-selling!)
//
// Với Atomic (Lua Script):
//   User A: [đọc + kiểm tra + trừ] = 1 khối không bị ngắt
//   User B: chờ User A xong mới chạy
//   -> stock không bao giờ < 0
// ================================================

const { getRedisClient } = require('../config/redis');
const { getSocketIO } = require('../config/socket');
const REDIS_KEY_STOCK = (productId) => `flashsale:product_${productId}:stock`;
const REDIS_KEY_USERS = (productId) => `flashsale:product_${productId}:users`;
const BUY_LUA_SCRIPT = `
  -- Kiểm tra user đã mua hay chưa
  local alreadyBought = redis.call('SISMEMBER', KEYS[2], ARGV[1])
  if alreadyBought == 1 then
    return -1
  end

  -- Đọc tồn kho hiện tại
  local stock = tonumber(redis.call('GET', KEYS[1]))
  if stock == nil or stock <= 0 then
    return -2
  end

  -- Trừ kho đi 1 (DECR)
  redis.call('DECR', KEYS[1])

  -- Ghi nhớ userId vào tập hợp "đã mua" (SADD)
  redis.call('SADD', KEYS[2], ARGV[1])

  -- Trả về tồn kho sau khi trừ
  return stock - 1
`;

async function buyProduct(productId, userId) {
  const redis = getRedisClient();
  const result = await redis.eval(
    BUY_LUA_SCRIPT,
    2,
    REDIS_KEY_STOCK(productId),
    REDIS_KEY_USERS(productId),
    userId.toString()
  );
  if (result === -1) return { success: false, reason: 'already_bought' };
  if (result === -2) return { success: false, reason: 'out_of_stock' };
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

async function rollbackStock(productId, userId) {
  const redis = getRedisClient();
  await redis.incr(REDIS_KEY_STOCK(productId));
  await redis.srem(REDIS_KEY_USERS(productId), userId.toString());
  console.log(`[Flashsale] Rollback: đã hoàn trả stock cho product_${productId}, user=${userId}`);
}

async function getStock(productId) {
  const redis = getRedisClient();
  const stock = await redis.get(REDIS_KEY_STOCK(productId));
  return parseInt(stock) || 0;
}

module.exports = { buyProduct, rollbackStock, getStock };
