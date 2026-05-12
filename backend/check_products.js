
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allProducts = await prisma.product.count();
  const flashSaleProducts = await prisma.product.count({ where: { isFlashSale: true } });
  console.log(`Total products: ${allProducts}`);
  console.log(`Flash sale products: ${flashSaleProducts}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
