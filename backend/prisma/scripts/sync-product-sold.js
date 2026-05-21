/**
 * Đồng bộ lượt bán (sold) từ đơn đã thanh toán.
 * Chạy: node prisma/scripts/sync-product-sold.js
 */
const { syncAllProductSoldCounts } = require('../../src/services/productSold.service');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('--- Đồng bộ lượt bán (sold) ---');
  const count = await syncAllProductSoldCounts();
  console.log(`\nHoàn tất: ${count} sản phẩm.`);

  const prisma = new PrismaClient();
  const nick = await prisma.product.findFirst({
    where: { name: { contains: 'Nick Wilde' } },
    select: { id: true, name: true, sold: true },
  });
  if (nick) console.log(`Kiểm tra: ${nick.name} → sold=${nick.sold}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
