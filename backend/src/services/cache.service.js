// ================================================
// File: src/services/cache.service.js
// Cache Redis cho tồn kho Flash Sale; mô tả/specs luôn lấy từ DB
// ================================================

const { getRedisClient } = require('../config/redis');
const prisma = require('../config/database');
const REDIS_KEY_INFO = (productId) => `flashsale:product_${productId}:info`;
const REDIS_KEY_STOCK = (productId) => `flashsale:product_${productId}:stock`;
const CACHE_TTL_SECONDS = 24 * 60 * 60;

const PRODUCT_SELECT = {
  id: true,
  name: true,
  price: true,
  image: true,
  stock: true,
  discount: true,
  sold: true,
  location: true,
  rating: true,
  flashSaleEnd: true,
  isFlashSale: true,
  description: true,
  specs: true,
  category: { select: { name: true } },
};

function resolveFlashSaleFlag(product) {
  let isFlashSale = product.isFlashSale;
  if (isFlashSale && product.flashSaleEnd && new Date(product.flashSaleEnd) < new Date()) {
    isFlashSale = false;
    prisma.product
      .update({ where: { id: product.id }, data: { isFlashSale: false } })
      .catch((err) =>
        console.error(`[Cache] Lỗi cập nhật hết hạn cho SP ${product.id}:`, err.message)
      );
  }
  return isFlashSale;
}

function mapProductToClient(product, stockOverride) {
  const isFlashSale = resolveFlashSaleFlag(product);
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: stockOverride !== undefined ? stockOverride : product.stock,
    discount: product.discount,
    sold: product.sold,
    location: product.location,
    rating: product.rating,
    flashSaleEnd: product.flashSaleEnd,
    isFlashSale,
    category: product.category?.name || null,
    description: product.description || null,
    specs: product.specs || null,
  };
}

async function clearProductCache() {
  const redis = getRedisClient();
  const keys = await redis.keys('flashsale:product_*');
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`[Cache] Đã xóa ${keys.length} key cache sản phẩm cũ`);
  }
}

async function warmUpCache() {
  const redis = getRedisClient();
  console.log('[Cache] Bắt đầu cache warm-up...');
  try {
    await clearProductCache();

    const products = await prisma.product.findMany({ select: PRODUCT_SELECT });
    console.log(`[Cache] Tìm thấy ${products.length} sản phẩm cần warm-up`);

    const uploadTasks = products.map(async (product) => {
      const isActuallyFlashSale = resolveFlashSaleFlag(product);
      const productInfo = {
        name: product.name,
        price: product.price,
        image: product.image,
        discount: product.discount,
        sold: product.sold,
        location: product.location,
        rating: product.rating,
        flashSaleEnd: product.flashSaleEnd,
        isFlashSale: isActuallyFlashSale,
        category: product.category?.name,
        description: product.description || null,
        specs: product.specs || null,
      };
      await redis.set(
        REDIS_KEY_INFO(product.id),
        JSON.stringify(productInfo),
        'EX',
        CACHE_TTL_SECONDS
      );
      await redis.set(
        REDIS_KEY_STOCK(product.id),
        String(product.stock),
        'EX',
        CACHE_TTL_SECONDS
      );
      console.log(
        `[Cache] product_${product.id} (${product.name}): stock=${product.stock}, category=${productInfo.category}`
      );
    });
    await Promise.all(uploadTasks);
    console.log(`[Cache] Cache warm-up hoàn tất! ${products.length} sản phẩm.`);
  } catch (error) {
    console.error('[Cache] Lỗi trong quá trình warm-up:', error.message);
    throw error;
  }
}

async function getLiveStock(productId) {
  const redis = getRedisClient();
  const stock = await redis.get(REDIS_KEY_STOCK(productId));
  if (stock === null) return null;
  return parseInt(stock, 10) || 0;
}

async function getProductFromCache(productId) {
  const id = parseInt(productId, 10);
  const product = await prisma.product.findUnique({
    where: { id },
    select: PRODUCT_SELECT,
  });
  if (!product) return null;

  const liveStock = await getLiveStock(id);
  return mapProductToClient(product, liveStock !== null ? liveStock : product.stock);
}

async function getAllProductsFromCache() {
  const products = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    orderBy: { id: 'asc' },
  });

  const result = await Promise.all(
    products.map(async (product) => {
      const liveStock = await getLiveStock(product.id);
      return mapProductToClient(
        product,
        liveStock !== null ? liveStock : product.stock
      );
    })
  );
  return result;
}

module.exports = {
  warmUpCache,
  clearProductCache,
  getProductFromCache,
  getAllProductsFromCache,
};
