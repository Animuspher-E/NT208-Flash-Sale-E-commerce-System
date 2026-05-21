const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Cộng lượt bán (sold) theo số lượng trong đơn đã thanh toán
 */
async function incrementSoldForOrder(orderId, tx = prisma) {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true },
  });

  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { sold: { increment: item.quantity } },
    });
    logger.info(
      `[Sold] +${item.quantity} cho product #${item.productId} (order #${orderId})`
    );
  }
}

/**
 * Tính lại sold từ các đơn đã thanh toán (đồng bộ dữ liệu cũ)
 */
async function syncAllProductSoldCounts() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  let updated = 0;

  for (const product of products) {
    const agg = await prisma.orderItem.aggregate({
      where: {
        productId: product.id,
        order: {
          paymentStatus: 'paid',
          status: { not: 'cancelled' },
        },
      },
      _sum: { quantity: true },
    });

    const sold = agg._sum.quantity || 0;
    await prisma.product.update({
      where: { id: product.id },
      data: { sold },
    });
    if (sold > 0) {
      console.log(`  #${product.id} ${product.name}: sold=${sold}`);
    }
    updated++;
  }

  return updated;
}

module.exports = { incrementSoldForOrder, syncAllProductSoldCounts };
