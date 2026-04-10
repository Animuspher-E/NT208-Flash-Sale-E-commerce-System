// ================================================
// File: src/services/cache.service.js
// Mục đích: Cache Warm-up - Nạp dữ liệu lên Redis trước giờ G
//   Giảm tải tối đa cho MySQL khi Flash Sale diễn ra
//   Vì hàng nghìn người cùng đọc dữ liệu 1 lúc -> Redis nhanh hơn MySQL
//
// Cách hoạt động:
//   1. Khoảng 30 phút trước Flash Sale, gọi hàm warmUpCache()
//   2. Đọc toàn bộ danh sách sản phẩm Flash Sale từ MySQL (1 lần duy nhất)
//   3. Nạp từng sản phẩm lên Redis:
//      - Thông tin tĩnh:  flashsale:product_1:info  = JSON string
//      - Tồn kho:         flashsale:product_1:stock = 100 (số nguyên)
//   4. Từ đây, mọi request đọc sản phẩm đều lấy từ Redis, không cần MySQL
//
// Ví dụ Redis sau khi warm-up:
//   flashsale:product_1:info  => '{"name":"iPhone 15","price":15000000,"image":"..."}'
//   flashsale:product_1:stock => '100'
//   flashsale:product_2:info  => '{"name":"Galaxy S24","price":12000000,"image":"..."}'
//   flashsale:product_2:stock => '50'
// ================================================

const { getRedisClient } = require('../config/redis');
const { getPrismaClient } = require('../config/database');
const REDIS_KEY_INFO = (productId) => `flashsale:product_${productId}:info`;
const REDIS_KEY_STOCK = (productId) => `flashsale:product_${productId}:stock`;
const CACHE_TTL_SECONDS = 24 * 60 * 60; // Thời gian hết hạn dữ liệu Redis: 24 giờ 

async function warmUpCache() {
  const redis = getRedisClient();
  const prisma = getPrismaClient();
  console.log('[Cache] Bắt đầu cache warm-up...');
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        stock: true,
      }
    });
    console.log(`[Cache] Tìm thấy ${products.length} sản phẩm Flash Sale cần warm-up`);
    const uploadTasks = products.map(async (product) => {
      const productInfo = {
        name: product.name,
        price: product.price,
        image: product.image,
      };
      await redis.set(
        REDIS_KEY_INFO(product.id),
        JSON.stringify(productInfo),
        'EX',
        CACHE_TTL_SECONDS
      );
      await redis.set(
        REDIS_KEY_STOCK(product.id),
        product.stock,
        'EX',
        CACHE_TTL_SECONDS
      );
      console.log(`[Cache] product_${product.id} (${product.name}): stock=${product.stock}`);
    });
    await Promise.all(uploadTasks);
    console.log(`[Cache] Cache warm-up hoàn tất! ${products.length} sản phẩm đã được nạp lên redis.`);
  } catch (error) {
    console.error('[Cache] Lỗi trong quá trình warm-up:', error.message);
    throw error;
  }
}

async function getProductFromCache(productId) {
  const redis = getRedisClient();
  const infoJson = await redis.get(REDIS_KEY_INFO(productId));
  if (!infoJson) {
    return null;
  }
  const stock = await redis.get(REDIS_KEY_STOCK(productId));
  const info = JSON.parse(infoJson);
  return {
    id: productId,
    name: info.name,
    price: info.price,
    image: info.image,
    stock: parseInt(stock) || 0,
  };
}
async function getAllProductsFromCache() {
  const redis = getRedisClient();
  const infoKeys = await redis.keys('flashsale:product_*:info');
  if (infoKeys.length === 0) {
    return [];
  }
  const products = await Promise.all(
    infoKeys.map(async (infoKey) => {
      const productId = infoKey.split(':')[2].replace('product_', '');
      const infoJson = await redis.get(infoKey);
      const stock = await redis.get(REDIS_KEY_STOCK(productId));
      const info = JSON.parse(infoJson);
      return {
        id: parseInt(productId),
        name: info.name,
        price: info.price,
        image: info.image,
        stock: parseInt(stock) || 0,
      };
    })
  );
  return products;
}

module.exports = { warmUpCache, getProductFromCache, getAllProductsFromCache };
